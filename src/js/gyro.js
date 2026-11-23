"use strict";
// ============================================================================
// W5b · 陀螺仪（GDD-05）—— 差分式陀螺仪视角控制
//
// 设计契约：docs/gdd/05-gyroscope-spec.md（14 条验收标准）
// 结构约束：
//  - deviceorientation 回调内【只做差分累加进缓冲】（§5.6 硬性）：不做死区/EMA/
//    视角写入，60Hz 事件流回调内零计算（除两次四元数乘法）。
//  - 死区 → EMA → 灵敏度换算 → 单帧钳制 → 经 H2 统一视角写入口 lookWrite()
//    （touch.js）在游戏主循环（Game.prototype.frame 包装）内消费。
//  - 陀螺仪不旁路改相机：唯一写入路径 = touchLook 的写入口。
//  - 无传感器设备零开销旁路：不注册事件、frameTick 首行布尔短路。
//  - 存储对齐现有触控设置：单对象序列化（game.settings，key "potato-settings"），
//    新增字段 gyroMode / gyroSensBase / gyroSensAds（§1.1 推荐路径）。
// ============================================================================

// ---------------------------------------------------------------------------
// 调参块（§9：全部集中定义，上线后按手感调参，不改结构）
// ---------------------------------------------------------------------------
const GYRO_TUNING = {
  pitchScale: 0.8, // §5.2 横屏 pitch 映射 0.8×
  dzEvtDeg: 0.05, // §5.3 单事件死区（°）
  dzAccDeg: 0.1, // §5.3 累计死区（°），累计≥此值一次性应用
  emaAlpha: 0.5, // §5.4 一阶 EMA 系数
  maxFrameDeg: 30, // §7.6 单 rAF 各轴应用增量钳制
  rotSilenceMs: 300, // §7.4 横竖切换静默期
  resumeDropEvents: 2, // §4.5 恢复可见后丢弃的前 N 个事件
  validDataTimeoutMs: 1500, // §2.3/§7.2 无有效数据判定窗口
  tailMs: 80, // §4.4 可选衰减尾时长
  tailK: 0.6, // §4.4 衰减尾每帧系数（0=关闭该打磨项）
  sensMin: 10, // §5.1 灵敏度取值域
  sensMax: 300,
  sensStep: 5,
  pendCap: 120, // 缓冲上限（异常保险丝，正常 60Hz×16ms 每帧约 1 个事件）
};

const Gyro = (() => {
  const d2r = Math.PI / 180,
    r2d = 180 / Math.PI;

  // ---- 四元数工具（q = [w, x, y, z]，把设备坐标系旋到地心坐标系）----
  const quatAxis = (u, deg) => {
    const h = (deg * d2r) / 2,
      s = Math.sin(h);
    return [Math.cos(h), u[0] * s, u[1] * s, u[2] * s];
  };
  const quatMul = (a, b) => [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
  ];
  const quatNorm = (q) => {
    const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
  };
  const quatInv = (q) => {
    const n = quatNorm(q),
      l2 = n[0] * n[0] + n[1] * n[1] + n[2] * n[2] + n[3] * n[3] || 1;
    return [n[0] / l2, -n[1] / l2, -n[2] / l2, -n[3] / l2];
  };
  const quatRotate = (q, v) => {
    // v' = q v q^-1
    const w = q[0], u = [q[1], q[2], q[3]];
    const t = [
      2 * (u[1] * v[2] - u[2] * v[1]),
      2 * (u[2] * v[0] - u[0] * v[2]),
      2 * (u[0] * v[1] - u[1] * v[0]),
    ];
    return [
      v[0] + w * t[0] + (u[1] * t[2] - u[2] * t[1]),
      v[1] + w * t[1] + (u[2] * t[0] - u[0] * t[2]),
      v[2] + w * t[2] + (u[0] * t[1] - u[1] * t[0]),
    ];
  };
  // 绕世界轴 u 的带符号转角（°），小角度假设下对 60Hz 差分严格成立
  const axisDeg = (q, u) =>
    2 * Math.atan2(q[1] * u[0] + q[2] * u[1] + q[3] * u[2], q[0]) * r2d;

  // W3C 设备姿态：内旋 Z(α)-X'(β)-Y''(γ)，q = qz ⊗ qx ⊗ qy（设备系→地心系）
  const eulerQuat = (a, b, c) =>
    quatMul(quatAxis([0, 0, 1], a), quatMul(quatAxis([1, 0, 0], b), quatAxis([0, 1, 0], c)));

  // ---- 运行态 ----
  const S = {
    on: false, // 事件监听已注册（无传感器 = 永远 false，零开销旁路）
    listening: false,
    permission: null, // null | "granted" | "denied"（仅 iOS 13+ requestPermission 环境有意义）
    deniedToasts: 0, // §3.2 denied toast 每会话上限 2
    errToasts: 0, // §3.3 环境异常 toast 独立计数（同样封顶 2，防异常环境刷屏）
    gotData: false,
    lastValidAt: 0,
    activeSince: 0,
    noDataFlagged: false,
    q: null, // 上一事件姿态（差分参考）
    pend: [], // [dyDeg, dpDeg] 原始事件差分（回调只 append）
    acc: [0, 0], // 累计死区
    emaY: 0,
    emaP: 0,
    emaInit: false,
    active: false,
    lastConsumeAt: 0,
    lastApplied: null, // 上一帧实际写入的弧度增量（衰减尾用）
    tailVal: null,
    tailAt: 0,
    rotSilenceUntil: 0,
    dropCount: 0,
    lastGame: null,
    hooks: null, // document 级监听是否已挂
  };

  // ---- 环境 / 权限 ----
  function permNeeded() {
    try {
      return (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      );
    } catch (e) {
      return false;
    }
  }
  function deviceOk() {
    try {
      if (typeof TouchDevice === "undefined" || !TouchDevice.touch) return false;
      return (
        typeof DeviceOrientationEvent !== "undefined" ||
        typeof DeviceMotionEvent !== "undefined"
      );
    } catch (e) {
      return false;
    }
  }

  // ---- 设置读写（H4）。单对象序列化路径（§1.1）：新增三字段 ----
  function save(g) {
    try {
      g.saveSettings && g.saveSettings();
    } catch (e) {}
  }
  const clampI = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v) || 0));
  function getMode(g) {
    const v = g && g.settings ? clampI(g.settings.gyroMode ?? 1, 0, 2) : 1;
    return v;
  }
  function effMode(g) {
    // §7.1：无传感器标记存在时静默按关闭处理，不回写存储
    if (g && g.settings && g.settings.gyroNoSensor) return 0;
    return getMode(g);
  }
  function setMode(g, v) {
    if (!g || !g.settings) return;
    g.settings.gyroMode = clampI(v, 0, 2);
    save(g);
    syncListeners(g);
  }
  function snapSens(v) {
    const s = GYRO_TUNING.sensStep;
    return clampI(Math.round(v / s) * s, GYRO_TUNING.sensMin, GYRO_TUNING.sensMax);
  }
  function getSens(g, which) {
    const k = "gyroSens" + (which === "ads" ? "Ads" : "Base");
    const v = g && g.settings && g.settings[k];
    if (typeof v !== "number" || !isFinite(v)) return 100; // §1.3 缺失/非法按默认
    const s = snapSens(v);
    return s < GYRO_TUNING.sensMin || s > GYRO_TUNING.sensMax ? 100 : s;
  }
  // norm01：0..1（设置页滑条），或直接传 value
  function setSens(g, which, norm01, value) {
    if (!g || !g.settings) return;
    const raw =
      typeof value === "number"
        ? value
        : GYRO_TUNING.sensMin + norm01 * (GYRO_TUNING.sensMax - GYRO_TUNING.sensMin);
    g.settings["gyroSens" + (which === "ads" ? "Ads" : "Base")] = snapSens(raw);
    save(g);
  }

  // W9 真机诊断：轴向反转位掩码（bit1=左右/yaw，bit2=上下/pitch）。
  // 真机若发现转向/俯仰与操作反向，用户在设置页自行翻转，无需改码。
  function getFlip(g) {
    const v = g && g.settings ? g.settings.gyroFlip : 0;
    return typeof v === "number" && isFinite(v) ? clampI(v, 0, 3) : 0;
  }
  function toggleFlip(g, bit) {
    if (!g || !g.settings) return;
    if (matchLocked(g)) {
      toast(g, "对局进行中，陀螺仪设置已锁定");
      return;
    }
    g.settings.gyroFlip = getFlip(g) ^ bit;
    save(g);
  }

  // ---- 钩子点 H3：对局状态 ----
  function matchLocked(g) {
    // 黑市平板惯例的判定方式：XZ.match.on()（含死亡观战与暂停态；靶场/普通世界为 false）
    try {
      const X = self.XZ;
      return !!(X && X.match && X.match.on && X.match.on(g));
    } catch (e) {
      return false;
    }
  }
  function matchPaused(g) {
    try {
      const X = self.XZ;
      if (X && X.match && X.match.state) {
        const s = X.match.state();
        return !!(s && s.paused);
      }
    } catch (e) {}
    return false;
  }
  function adsActive(g) {
    // H1 唯一事实源：XZ.aimAmount(player)（xzguns 开镜状态 aimT），禁止 FOV 推断
    try {
      const X = self.XZ;
      if (X && typeof X.aimAmount === "function" && g.player)
        return X.aimAmount(g.player) > 0.01;
    } catch (e) {}
    return false;
  }

  // §2.3 设置组可见性（桌面端/无传感器整组隐藏）
  function ensureCss() {
    if (document.getElementById("gyro-css")) return;
    const st = document.createElement("style");
    st.id = "gyro-css";
    st.textContent =
      "#lobby .st-seg { display: flex; gap: calc(var(--u) * .4); }\n" +
      "#lobby .st-seg button { flex: 1; font: inherit; font-weight: 800; font-size: calc(var(--u) * 1.05); padding: calc(var(--u) * .5) 0; background: #23262E; color: var(--paper); border: calc(var(--u) * .2) solid #3A3F49; cursor: pointer; }\n" +
      "#lobby .st-seg button.on { border-color: var(--or); color: var(--or); box-shadow: calc(var(--u) * .25) calc(var(--u) * .25) 0 var(--or); }\n" +
      "#lobby .st-seg button:disabled, #lobby .sl input:disabled, #lobby .st-row.gy-lock { opacity: .45; cursor: default; }\n" +
      "#lobby .gy-note { padding: calc(var(--u) * .2) 0 calc(var(--u) * .5); } #lobby .gy-note small { color: #8A877F; font-size: calc(var(--u) * .85); line-height: 1.4; }";
    document.head.appendChild(st);
  }
  function groupVisible(g) {
    try {
      if (!g || !g.settings) return false;
      if (g.settings.gyroNoSensor) return false; // 上次会话确认无有效数据（§7.2 冷启动隐藏）
      if (typeof TouchDevice === "undefined" || !TouchDevice.touch) return false;
      const touchUiOn = g.ui && g.ui.touch && g.ui.touch.on && g.ui.touch.on();
      if (!(TouchDevice.defaultOn || touchUiOn)) return false;
      if (
        typeof DeviceOrientationEvent === "undefined" &&
        typeof DeviceMotionEvent === "undefined"
      )
        return false;
      ensureCss();
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---- 事件监听生命周期（§7.1 零开销旁路）----
  function onOrient(e) {
    const now = performance.now();
    if (S.dropCount > 0) {
      S.dropCount--;
      S.q = null; // 丢弃并以恢复后的首个有效事件为差分参考（§4.5/§7.4）
      return;
    }
    if (now < S.rotSilenceUntil) {
      S.q = null;
      return;
    }
    const a = e.alpha, b = e.beta, c = e.gamma;
    if (a == null && b == null && c == null) return; // 无效事件（§7.2）
    const q = eulerQuat(a, b, c);
    if (!S.q) {
      S.q = q; // 首个有效事件只作差分基准，本身丢弃
      markValid(g0(), now);
      return;
    }
    // 世界系相对旋转；α 回绕/±180 跳变由四元数天然吸收（§5.6 差分基准）
    const d = quatMul(q, quatInv(S.q));
    const dy = axisDeg(d, [0, 0, 1]); // 绕世界竖直轴 = 视角 yaw
    const dp = axisDeg(d, quatRotate(q, [0, 1, 0])); // 绕设备顶边轴 = 视角 pitch
    S.q = q;
    markValid(g0(), now);
    S.pend.push([dy, dp]);
    if (S.pend.length > GYRO_TUNING.pendCap) S.pend.splice(0, S.pend.length - GYRO_TUNING.pendCap);
  }
  const g0 = () => S.lastGame;
  function markValid(g, now) {
    S.gotData = true;
    S.lastValidAt = now;
    if (g && g.settings && g.settings.gyroNoSensor) {
      delete g.settings.gyroNoSensor; // 自愈：传感器实际有数据则解除隐藏标记
      save(g);
    }
    S.noDataFlagged = false;
  }
  function syncListeners(g) {
    const want =
      deviceOk() &&
      g &&
      effMode(g) > 0 &&
      (!permNeeded() || S.permission === "granted");
    if (want && !S.listening) {
      window.addEventListener("deviceorientation", onOrient);
      S.listening = true;
    } else if (!want && S.listening) {
      window.removeEventListener("deviceorientation", onOrient);
      S.listening = false;
      S.q = null;
    }
    if (want && !S.hooks) {
      S.hooks = true;
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          S.active = false;
          S.tailVal = null;
        } else {
          // §4.5：恢复可见丢弃前 N 个事件 + 重置差分参考，防后台恢复大跳变
          S.dropCount = GYRO_TUNING.resumeDropEvents;
          S.q = null;
          S.pend.length = 0;
        }
      });
      window.addEventListener("orientationchange", () => {
        // §7.4：旋转瞬间 300ms 静默 + 重置差分参考
        S.rotSilenceUntil = performance.now() + GYRO_TUNING.rotSilenceMs;
        S.q = null;
        S.pend.length = 0;
      });
    }
    S.on = want;
  }

  // ---- 状态机（§4.1，输出两态：激活/挂起，无半激活）----
  function evaluate(g, now) {
    const m = effMode(g);
    if (m === 0 || !g || "play" !== g.state) return null;
    if (g.ui && g.ui.screen) return null; // 暂停/菜单打开
    const p = g.player;
    if (!p) return null;
    if ("spectator" === g.mode) return null; // §4.6
    if (p.deathTime > 0 || (typeof p.health === "number" && p.health <= 0)) return null; // §4.6
    if (document.hidden) return null;
    const ui = g.ui;
    if (ui && ui.h > ui.w) return null; // §7.4 竖屏不可玩 → 挂起
    if (now < S.rotSilenceUntil) return null;
    if (matchPaused(g)) return null; // §4.5 对局暂停（双人暂停中）
    const ads = adsActive(g);
    if (m === 1 && !ads) return null;
    return { ads };
  }

  // ---- rAF 消费（死区 → EMA → 灵敏度 → 钳制 → lookWrite）----
  function dz(d, axis) {
    const ad = Math.abs(d);
    if (ad < GYRO_TUNING.dzEvtDeg) {
      const acc = (S.acc[axis] += d);
      if (Math.abs(acc) >= GYRO_TUNING.dzAccDeg) {
        S.acc[axis] = 0;
        return acc;
      }
      return 0;
    }
    return d;
  }
  const clampDeg = (v, m) => (v > m ? m : v < -m ? -m : v);
  function frameTick(g) {
    if (!deviceOk()) return; // 零开销旁路（每帧一次布尔短路）
    S.lastGame = g;
    const now = performance.now();
    const st = evaluate(g, now);
    if (!st) {
      if (S.active) stopSession(now);
      S.active = false;
      S.pend.length = 0; // 挂起即丢弃未应用缓冲（§4.4）
      applyTail(g, now);
      if (
        !S.noDataFlagged &&
        S.on &&
        S.listening &&
        effMode(g) > 0 &&
        !S.gotData &&
        S.activeSince &&
        now - S.activeSince > GYRO_TUNING.validDataTimeoutMs &&
        g &&
        g.settings &&
        (!permNeeded() || S.permission === "granted")
      ) {
        // §7.2：已授权但持续无有效数据 → 冷启动隐藏标记（静默，不弹 toast）
        S.noDataFlagged = true;
        try {
          g.settings.gyroNoSensor = 1;
          save(g);
        } catch (e) {}
      }
      return;
    }
    if (!S.active) {
      S.active = true;
      S.activeSince = now;
      S.emaInit = false; // 重新激活：EMA 从本帧增量起步，不继承历史输出
    }
    if (!S.gotData || now - S.lastValidAt > GYRO_TUNING.validDataTimeoutMs) {
      // 静默挂起（§7.2）；数据已停流则视为会话结束，干净退出（不留陈旧衰减尾）
      if (S.active) {
        S.active = false;
        S.pend.length = 0;
        S.acc[0] = S.acc[1] = 0;
        S.lastApplied = null;
        S.tailVal = null;
      }
      return;
    }
    // §7.5 逐帧仲裁：本帧若触屏滑动已写过视角，丢弃陀螺仪 pending（非混合）
    if (
      g._lookWriteAt > S.lastConsumeAt &&
      "touch" === g._lookWriteSrc
    ) {
      S.pend.length = 0;
      S.acc[0] = S.acc[1] = 0;
      return;
    }
    let fy = 0, fp = 0;
    const pend = S.pend;
    for (let i = 0; i < pend.length; i++) {
      fy += dz(pend[i][0], 0);
      fp += dz(pend[i][1], 1);
    }
    pend.length = 0;
    const a = GYRO_TUNING.emaAlpha;
    if (!S.emaInit) {
      S.emaY = fy;
      S.emaP = fp;
      S.emaInit = true;
    } else {
      S.emaY = a * fy + (1 - a) * S.emaY;
      S.emaP = a * fp + (1 - a) * S.emaP;
    }
    // H5 灵敏度切换点：本帧按当前开镜态取对应滑条，只影响后续帧（缓冲不重算）
    const gain = getSens(g, st.ads ? "ads" : "base") / 100;
    // 轴向映射（§5.2）：dy 为绕世界竖直轴角度（右转手机为负）→ 引擎右转 = yaw 减小
    // W9：gyroFlip 位掩码供真机自查翻转（bit1=左右、bit2=上下）
    const flip = getFlip(g);
    const yawRight = -S.emaY * (flip & 1 ? -1 : 1);
    // dp 为绕设备顶边轴角度；符号随横握方向翻转（设备右缘指向天上为 +1）
    let pitchSign = 0;
    if (S.q) {
      const ux = quatRotate(S.q, [1, 0, 0]);
      pitchSign = ux[2] >= 0 ? 1 : -1;
    }
    const pitchUp = S.emaP * pitchSign * (flip & 2 ? -1 : 1);
    let ay = clampDeg(yawRight * gain, GYRO_TUNING.maxFrameDeg);
    let ap = clampDeg(pitchUp * gain * GYRO_TUNING.pitchScale, GYRO_TUNING.maxFrameDeg);
    const dYaw = ay * d2r,
      dPitch = -ap * d2r;
    lookWrite(g, dYaw, dPitch, "gyro"); // H2：与触屏滑动同一写入口
    S.lastConsumeAt = now;
    S.lastApplied = [dYaw, dPitch];
    S.tailVal = null;
  }
  function stopSession(now) {
    S.pend.length = 0;
    S.acc[0] = S.acc[1] = 0;
    // 仅当上一帧确实刚消费过增量时才补衰减尾（防止对久未消费的陈旧增量补尾）
    if (S.lastApplied && GYRO_TUNING.tailK > 0 && now - S.lastConsumeAt < 150) {
      S.tailVal = [S.lastApplied[0] * GYRO_TUNING.tailK, S.lastApplied[1] * GYRO_TUNING.tailK];
      S.tailAt = now;
    }
  }
  // §4.4 可选打磨：截止后约 80ms 指数衰减尾（不回弹、无跳变）
  function applyTail(g, now) {
    if (!S.tailVal || !g || !g.player) return;
    if (now - S.tailAt > GYRO_TUNING.tailMs) {
      S.tailVal = null;
      return;
    }
    if (evaluate(g, now)) {
      S.tailVal = null; // 重新激活则不再补尾
      return;
    }
    lookWrite(g, S.tailVal[0], S.tailVal[1], "gyro");
    S.tailVal = [
      S.tailVal[0] * GYRO_TUNING.tailK,
      S.tailVal[1] * GYRO_TUNING.tailK,
    ];
  }

  // ---- 设置页 API（H4 / §3 权限流）----
  function toast(g, text) {
    try {
      g.ui && g.ui.message && g.ui.message(text, "#FFD24A");
    } catch (e) {}
  }
  function denied(g, err, re) {
    setMode(g, 0); // §3.2：回退「关闭」，UI 由 re 回调同步回弹
    if (re) re();
    if (err) {
      if (S.errToasts < 2) {
        S.errToasts++;
        toast(g, "当前环境不支持陀螺仪，已关闭。");
      }
    } else if (S.deniedToasts < 2) {
      S.deniedToasts++;
      toast(g, "未获得陀螺仪权限，陀螺仪已关闭。可在系统设置中允许后重试。");
    }
  }
  // 由设置页点选非关闭档调用；权限请求在当次点击回调内同步发起（§3.1）
  function uiPickMode(g, v, re) {
    if (matchLocked(g)) {
      toast(g, "对局进行中，陀螺仪设置已锁定");
      if (re) re();
      return;
    }
    if (v === 0) {
      setMode(g, 0);
      if (re) re();
      return;
    }
    if (permNeeded() && S.permission !== "granted") {
      let pr = null;
      try {
        pr = DeviceOrientationEvent.requestPermission(); // 同步调用，不进 promise 链再发起
      } catch (e) {
        denied(g, true, re);
        return;
      }
      if (pr && typeof pr.then === "function") {
        pr.then(
          (r) => {
            if ("granted" === r) {
              S.permission = "granted";
              setMode(g, v);
            } else denied(g, false, re);
          },
          () => denied(g, true, re),
        ).catch(() => denied(g, true, re));
      } else denied(g, true, re);
      if (re) re(); // 结果落地前 UI 不显示中间态（§3.2）
      return;
    }
    S.permission = "granted"; // 无权限 API 环境：选档即生效（§3.1）
    setMode(g, v);
    if (re) re();
  }
  // §2.4 恢复默认：不触发权限请求；未授权时档位写 0 + 一次性 toast
  function resetDefaults(g, re) {
    setSens(g, "base", 0, 100);
    setSens(g, "ads", 0, 100);
    if (g && g.settings) g.settings.gyroFlip = 0; // W9：恢复默认含轴向反转复位
    const canOn = !permNeeded() || S.permission === "granted";
    setMode(g, canOn ? 1 : 0);
    if (!canOn) toast(g, "陀螺仪需要授权后才能开启");
    if (re) re();
  }

  // ---- 主循环挂钩：Game.prototype.frame（每帧先于 tick/render 消费缓冲）----
  if (typeof Game !== "undefined" && Game.prototype && Game.prototype.frame) {
    const _frame = Game.prototype.frame;
    Game.prototype.frame = function () {
      try {
        frameTick(this);
      } catch (e) {}
      return _frame.apply(this, arguments);
    };
  }

  // ---- 冷启动：存储里已有非关闭档（上一会话授权过的 iOS / 安卓直接生效）----
  try {
    const raw = JSON.parse(
      localStorage.getItem(self.POTATO ? "potato-settings" : "mcjs-settings") || "{}",
    );
    if (deviceOk() && (raw.gyroMode ?? 1) > 0) syncListeners({ settings: raw });
  } catch (e) {}

  const api = {
    TUNING: GYRO_TUNING,
    getMode,
    effMode,
    setMode,
    getSens,
    setSens,
    getFlip,
    toggleFlip,
    uiPickMode,
    resetDefaults,
    groupVisible,
    matchLocked,
    adsActive,
    // 单元/集成测试钩子（纯数学 + 注入差分；不进任何运行时路径）
    _test: {
      eulerQuat,
      quatMul,
      quatInv,
      quatAxis,
      quatRotate,
      axisDeg,
      pushDelta: (dy, dp) => {
        S.pend.push([dy, dp]);
        const n = performance.now();
        S.gotData = true; // 模拟 onOrient 的 markValid 尾部
        S.lastValidAt = n;
      },
      reset: () => {
        S.pend.length = 0;
        S.acc[0] = S.acc[1] = 0;
        S.emaY = S.emaP = 0;
        S.emaInit = false;
        S.active = false;
        S.q = null;
        S.gotData = false;
        S.lastValidAt = 0;
        S.activeSince = 0;
        S.lastConsumeAt = 0;
        S.lastApplied = null;
        S.tailVal = null;
        S.dropCount = 0;
        S.rotSilenceUntil = 0;
      },
      state: S,
      frameTick,
      clearPerm: () => (S.permission = null),
    },
  };
  return api;
})();
self.Gyro = Gyro;
//# sourceURL=js/gyro.js
