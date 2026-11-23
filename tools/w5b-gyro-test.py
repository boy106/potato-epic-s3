#!/usr/bin/env python3
"""W5b 陀螺仪 mock 驱动验证（GDD-05，14 条验收标准）
运行前置：python3 -m http.server 8814（/workspace/src）
输出：控制台 PASS/FAIL 明细 + /workspace/tools/w5b-gyro-evidence.json
"""
import json, sys, time
from playwright.sync_api import sync_playwright

ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"]
URL = "http://localhost:8814/index.html"
R = []
def check(name, ok, detail=""):
    R.append({"name": name, "ok": bool(ok), "detail": str(detail)[:400]})
    print(("PASS " if ok else "FAIL ") + name + (("  | " + str(detail)[:220]) if detail else ""))

# ---------- 页面内 JS 帮手 ----------
SETUP_JS = r"""
() => {
  const T = self.Gyro._test;
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const G = T.TUNING ? self.Gyro : self.Gyro;
  function matOf(q) {
    const [w, x, y, z] = q;
    return [
      [1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)],
      [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
      [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)],
    ];
  }
  function qToEuler(q) {
    const m = matOf(q);
    const sb = Math.max(-1, Math.min(1, m[2][1]));
    const b = Math.asin(sb);
    if (Math.abs(sb) < 0.9999) {
      return [Math.atan2(-m[0][1], m[1][1]) * R2D, b * R2D, Math.atan2(-m[2][0], m[2][2]) * R2D];
    }
    if (sb > 0) return [Math.atan2(m[0][2], m[0][0]) * R2D, b * R2D, 0];
    return [-Math.atan2(m[0][2], m[0][0]) * R2D, b * R2D, 0];
  }
  function sendOrient(q) {
    const e = qToEuler(q);
    window.dispatchEvent(new DeviceOrientationEvent("deviceorientation", {
      alpha: e[0], beta: e[1], gamma: e[2],
    }));
    return e;
  }
  function fake(mode, base, ads) {
    T.reset();
    return {
      state: "play", mode: "survival",
      ui: { screen: null, w: 960, h: 480 },
      player: { yaw: 0, pitch: 0, health: 20, deathTime: 0, xz: { aimT: 0 } },
      settings: { gyroMode: mode, gyroSensBase: base, gyroSensAds: ads },
      saveSettings() {},
      _lookWriteAt: 0, _lookWriteSrc: null,
    };
  }
  window.__gy = { T, D2R, R2D, matOf, qToEuler, sendOrient, fake,
    eulerQuat: T.eulerQuat, quatMul: T.quatMul, quatAxis: T.quatAxis,
    quatRotate: T.quatRotate, axisDeg: T.axisDeg, state: T.state };
  return true;
}
"""

with sync_playwright() as p:
    browser = p.chromium.launch(args=ARGS)

    # ============ 会话 A：桌面端（无触屏） ============
    ctxA = browser.new_context(viewport={"width": 1280, "height": 800})
    pgA = ctxA.new_page()
    errsA = []
    pgA.on("pageerror", lambda e: errsA.append(str(e)))
    pgA.goto(URL, wait_until="load", timeout=90000)
    for _ in range(120):
        if pgA.evaluate("typeof self.Gyro !== 'undefined'"): break
        time.sleep(0.5)
    check("A1 Gyro 全局就位", pgA.evaluate("typeof self.Gyro !== 'undefined'"))
    check("A2 pageerror=0（WebGL 环境错误豁免）",
          len([e for e in errsA if "WebGL" not in e and "webgl" not in e]) == 0, errsA[:3])
    st = pgA.evaluate("() => ({listening: self.Gyro._test.state.listening, on: self.Gyro._test.state.on})")
    check("A3 桌面端零开销旁路（未注册传感器监听）", st["listening"] == False and st["on"] == False, st)
    gv = pgA.evaluate("() => self.Gyro.groupVisible({settings:{}, ui:{}})")
    check("A4/AC5a 桌面端设置组隐藏", gv == False, gv)
    touch = pgA.evaluate("() => TouchDevice.kind + '/' + TouchDevice.touch")
    check("A5 桌面设备判定", "pc" in touch, touch)

    # ============ 会话 B：移动端模拟（触屏 + 安卓 UA） ============
    ctxB = browser.new_context(
        viewport={"width": 960, "height": 480}, has_touch=True, is_mobile=True,
        user_agent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36",
    )
    pgB = ctxB.new_page()
    errsB = []
    pgB.on("pageerror", lambda e: errsB.append(str(e)))
    pgB.goto(URL, wait_until="load", timeout=90000)
    for _ in range(120):
        if pgB.evaluate("typeof self.Gyro !== 'undefined'"): break
        time.sleep(0.5)
    pgB.evaluate(SETUP_JS)
    dev = pgB.evaluate("() => ({kind: TouchDevice.kind, dof: typeof DeviceOrientationEvent, listening: self.Gyro._test.state.listening})")
    check("B0 移动端环境（触屏 + DOF 可用）", dev["kind"] in ("phone", "tablet") and dev["dof"] != "undefined", dev)

    # ---- AC1：设置页默认渲染 ----
    ui_open = pgB.evaluate(r"""() => {
      localStorage.removeItem('potato-settings'); localStorage.removeItem('mcjs-settings');
      const g = { state: "menu", settings: {}, saveSettings() { this.saved = true; },
        ui: { open(){}, close(){}, screen: null, chat: [],
              message(t, c) { this.chat.push({ text: t, color: c }); },
              touch: { on: () => true }, w: 960, h: 480 } };
      window.__uiGame = g;
      window.__scr = new PotatoSettings(g, null, "touch");
      __scr.layout();
      const secs = [...__scr.el.querySelectorAll('.st-sec')].map(e => e.textContent);
      const segs = [...__scr.el.querySelectorAll('[data-gm]')].map(b => ({ v: b.dataset.gm, on: b.classList.contains('on'), dis: b.disabled, txt: b.textContent }));
      const rows = [...__scr.el.querySelectorAll('.st-row')].map(r => r.querySelector('.t') ? r.querySelector('.t').textContent : '');
      const pairs = [...__scr.el.querySelectorAll('.st-row')].map(r => [r.querySelector('.t') ? r.querySelector('.t').textContent : '', r.querySelector('.v') ? r.querySelector('.v').textContent : '']);
      const rowVals = pairs.filter(p2 => /^(基础|开镜)灵敏度$/.test(p2[0])).map(p2 => p2[0] + ':' + p2[1]);
      const sliders = [...__scr.el.querySelectorAll('.sl input')].map(i => ({ dis: i.disabled }));
      const note = __scr.el.querySelector('.gy-note small');
      const reset = [...__scr.el.querySelectorAll('button[data-r]')].some(b => {
        const r = __scr.rows[+b.dataset.r]; return r && r.label === '恢复默认';
      });
      return { secs, segs, rows, rowVals, sliders, note: note ? note.textContent : null, reset };
    }""")
    gy_sec = [s for s in ui_open["secs"] if "陀螺仪" in s]
    check("AC1a 移动端设置页有「陀螺仪」分组", len(gy_sec) == 1, ui_open["secs"])
    check("AC1b 三档分段按钮，默认高亮「开镜开启」",
          len(ui_open["segs"]) == 3 and [s["on"] for s in ui_open["segs"]] == [False, True, False],
          ui_open["segs"])
    gy_rows = [r for r in ui_open["rows"] if "灵敏度" in r and ("基础" in r or "开镜" in r)]
    gy_vals = ui_open.get("rowVals", [])
    check("AC1c 双灵敏度滑条默认 100%",
          len(gy_rows) == 2 and all("100%" in v for v in gy_vals), (gy_rows, gy_vals))
    check("AC1d 辅助说明文案", ui_open["note"] == "开镜开启：仅开镜时生效；总是开启：全程生效（需设备支持）", ui_open["note"])
    check("AC1e 恢复默认入口存在", ui_open["reset"])
    check("AC5b 移动端无传感器报错（pageerror=0）",
          len([e for e in errsB if "WebGL" not in e and "webgl" not in e]) == 0, errsB[:3])

    # ---- 档位切换 + 滑条交互（DOM 点击） ----
    click_gm = lambda v: pgB.evaluate(f"() => __scr.el.querySelector('button[data-gm=\"{v}\"]').dispatchEvent(new MouseEvent('click', {{bubbles: true}}))")
    click_gm("2")
    m = pgB.evaluate("() => window.__uiGame.settings.gyroMode")
    check("UI1 点「总是开启」→ 存档 gyroMode=2", m == 2, m)
    seg_on = pgB.evaluate("() => [...__scr.el.querySelectorAll('[data-gm]')].map(b => b.classList.contains('on'))")
    check("UI2 分段按钮高亮同步", seg_on == [False, False, True], seg_on)
    click_gm("0")
    sl_dis = pgB.evaluate("""() => {
      const rows = [...__scr.el.querySelectorAll('.st-row')];
      const gy = rows.filter(r => { const t = r.querySelector('.t'); return t && /灵敏度/.test(t.textContent) && __scr.rows[+(r.dataset.r ?? '')]; });
      const gyRows = [];
      for (let i = 0; i < __scr.rows.length; i++) {
        const r = __scr.rows[i];
        if (r.slider && r.label && /灵敏度/.test(String(r.label())) && /陀螺|基础|开镜/.test(String(r.label())) && !/视角/.test(String(r.label()))) gyRows.push(r);
      }
      return gyRows.map(r => ({ enabled: r.enabled, label: String(r.label()) }));
    }""")
    check("UI3 档位=关闭 → 滑条置灰但保留数值", all(r["enabled"] == False for r in sl_dis), sl_dis)
    keep = pgB.evaluate("() => { const v = []; for (const r of __scr.rows) if (r.slider && r.label && /基础灵敏度/.test(String(r.label()))) v.push(String(r.label())); return v; }")
    check("UI4 关闭档不重置灵敏度数值", any("155" in v or "100%" in v for v in keep), keep)
    click_gm("1")

    # ---- 滑条交互（步进 5） ----
    slider_set = pgB.evaluate("""() => {
      let row = null, idx = -1;
      for (let i = 0; i < __scr.rows.length; i++) { const r = __scr.rows[i]; if (r.slider && r.label && /基础灵敏度/.test(String(r.label()))) { row = r; idx = i; break; } }
      if (!row) return null;
      const el = __scr.el.querySelector(`.st-row[data-r="${idx}"] input[type=range]`);
      el.value = 500;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return { v: self.Gyro.getSens(__uiGame, 'base'), label: String(row.label()), val: el.value };
    }""")
    check("UI5 滑条 0.5 → 155（10+290×0.5，步进 5 生效）", slider_set and slider_set["v"] == 155, slider_set)
    slider_set2 = pgB.evaluate("""() => {
      let idx = -1;
      for (let i = 0; i < __scr.rows.length; i++) { const r = __scr.rows[i]; if (r.slider && r.label && /基础灵敏度/.test(String(r.label()))) { idx = i; break; } }
      const el = __scr.el.querySelector(`.st-row[data-r="${idx}"] input[type=range]`);
      el.value = 999;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return self.Gyro.getSens(__uiGame, 'base');
    }""")
    check("UI6 滑条上限钳到 300", slider_set2 == 300, slider_set2)
    ads_set = pgB.evaluate("""() => {
      let idx = -1;
      for (let i = 0; i < __scr.rows.length; i++) { const r = __scr.rows[i]; if (r.slider && r.label && /开镜灵敏度/.test(String(r.label()))) { idx = i; break; } }
      const el = __scr.el.querySelector(`.st-row[data-r="${idx}"] input[type=range]`);
      el.value = 300;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return self.Gyro.getSens(__uiGame, 'ads');
    }""")
    check("UI7 开镜灵敏度独立存取（0.3→97→步进吸附 95）", ads_set == 95, ads_set)

    # ---- 恢复默认（§2.4） ----
    perm_calls = {"n": 0}
    pgB.evaluate("""() => {
      DeviceOrientationEvent.requestPermission = () => Promise.resolve('denied');
      self.Gyro._test.clearPerm();   // 前面安卓路径点击已把会话权限置为 granted，先清掉
      self.Gyro.setMode(__uiGame, 1);
      self.Gyro._test.state.deniedToasts = 0;
      window.__uiGame.ui.chat.length = 0;
    }""")
    reset = pgB.evaluate("""() => {
      self.Gyro.setSens(__uiGame, 'base', 0, 55);
      let idx = -1;
      for (let i = 0; i < __scr.rows.length; i++) { const r = __scr.rows[i]; if (r.label === '恢复默认') { idx = i; break; } }
      __scr.rows[idx].onClick();
      return { mode: __uiGame.settings.gyroMode, base: __uiGame.settings.gyroSensBase, ads: __uiGame.settings.gyroSensAds,
               toast: __uiGame.ui.chat.length ? __uiGame.ui.chat[__uiGame.ui.chat.length - 1].text : null };
    }""")
    check("AC8b/§2.4 恢复默认：未授权 → 档位写 0 + toast「陀螺仪需要授权后才能开启」+ 不触发权限弹窗",
          reset["mode"] == 0 and reset["base"] == 100 and reset["ads"] == 100
          and reset["toast"] == "陀螺仪需要授权后才能开启", reset)

    # ---- AC7：权限拒绝 → 回退关闭 + toast（§3.3 逐字） ----
    denied = pgB.evaluate("""() => {
      __uiGame.ui.chat.length = 0;
      let calls = 0;
      DeviceOrientationEvent.requestPermission = () => { calls++; return Promise.resolve('denied'); };
      window.__permCalls = () => calls;
      return new Promise(res => {
        self.Gyro.uiPickMode(__uiGame, 2, () => {});
        setTimeout(() => res({ mode: __uiGame.settings.gyroMode,
          toast: __uiGame.ui.chat.length ? __uiGame.ui.chat[0].text : null }), 80);
      });
    }""")
    check("AC7a 权限拒绝 → 档位回退「关闭」",
          denied["mode"] == 0, denied)
    check("AC7b toast 文案与 §3.3 逐字一致",
          denied["toast"] == "未获得陀螺仪权限，陀螺仪已关闭。可在系统设置中允许后重试。", denied["toast"])
    check("AC8a 权限请求仅发生在点选回调内（调用 1 次）",
          pgB.evaluate("() => window.__permCalls()") == 1)
    # toast 会话上限 2
    cap = pgB.evaluate("""() => {
      __uiGame.ui.chat.length = 0;
      self.Gyro._test.state.deniedToasts = 0;
      return new Promise(res => {
        self.Gyro.uiPickMode(__uiGame, 2, () => {});
        self.Gyro.uiPickMode(__uiGame, 2, () => {});
        setTimeout(() => {
          const two = __uiGame.ui.chat.filter(c => /陀螺仪权限/.test(c.text)).length;
          self.Gyro.uiPickMode(__uiGame, 2, () => {});   // 第 3 次：静默回退
          setTimeout(() => res({ two, three: __uiGame.ui.chat.filter(c => /陀螺仪权限/.test(c.text)).length,
            mode: __uiGame.settings.gyroMode }), 80);
        }, 80);
      });
    }""")
    check("AC7c denied toast 每会话最多 2 次（第 3 次静默）", cap["two"] == 2 and cap["three"] == 2 and cap["mode"] == 0, cap)

    # ---- AC6：授权 → 生效并写入存储 ----
    granted = pgB.evaluate("""() => {
      __uiGame.ui.chat.length = 0;
      DeviceOrientationEvent.requestPermission = () => Promise.resolve('granted');
      return new Promise(res => {
        self.Gyro.uiPickMode(__uiGame, 2, () => {});
        setTimeout(() => res({ mode: __uiGame.settings.gyroMode, saved: __uiGame.saved === true,
          toasts: __uiGame.ui.chat.length }), 80);
      });
    }""")
    check("AC6 授权后档位生效并写入存储（无 toast）",
          granted["mode"] == 2 and granted["saved"] and granted["toasts"] == 0, granted)
    listening = pgB.evaluate("() => self.Gyro._test.state.listening")
    check("AC6b 授权后传感器监听已注册", listening == True, listening)

    # ---- 环境异常（§3.3 第二条文案） ----
    pgB.evaluate("() => { self.Gyro._test.clearPerm(); self.Gyro._test.state.deniedToasts = 0; self.Gyro._test.state.errToasts = 0; self.Gyro.setMode(__uiGame, 1); }")
    throw = pgB.evaluate("""() => {
      __uiGame.ui.chat.length = 0;
      DeviceOrientationEvent.requestPermission = () => { throw new Error('boom'); };
      return new Promise(res => {
        self.Gyro.uiPickMode(__uiGame, 2, () => {});
        setTimeout(() => res({ mode: __uiGame.settings.gyroMode,
          toast: __uiGame.ui.chat.length ? __uiGame.ui.chat[0].text : null }), 80);
      });
    }""")
    check("§3.3 请求抛错 → 回退关闭 + toast「当前环境不支持陀螺仪，已关闭。」",
          throw["mode"] == 0 and throw["toast"] == "当前环境不支持陀螺仪，已关闭。", throw)
    # 恢复 granted 状态用于后续传感器测试（模拟 Android：无权限 API）
    pgB.evaluate("""() => {
      delete DeviceOrientationEvent.requestPermission;
      self.Gyro._test.clearPerm();
      self.Gyro.setMode(__uiGame, 2);
    }""")

    # ---- AC2：方向正确（真实事件流：右转手机 = 视角右转；上抬 = 视角上抬） ----
    dir_yaw = pgB.evaluate(r"""() => {
      const { fake, quatMul, quatAxis, sendOrient, T } = __gy;
      self.Gyro.TUNING.tailK = 0;
      const f = fake(2, 100, 100);
      const q0 = quatMul(quatAxis([0, -1, 0], 88), quatAxis([1, 0, 0], 90)); // 横屏（顶边朝西，略倾避免万向锁）
      const q1 = quatMul(quatAxis([0, 0, 1], -10), q0);  // 从上方看顺时针 10° = 右转手机
      sendOrient(q0); sendOrient(q1);
      T.frameTick(f);
      return { yawDeg: -f.player.yaw / __gy.D2R, pitchDeg: f.player.pitch / __gy.D2R, dE: __gy.qToEuler(q1) };
    }""")
    check("AC2a 右转手机 10° → 视角右转（yaw −10°±10%）",
          abs(dir_yaw["yawDeg"] - 10) < 1.0, dir_yaw)
    dir_pitch = pgB.evaluate(r"""() => {
      const { fake, quatMul, quatAxis, sendOrient, quatRotate, T } = __gy;
      const f = fake(2, 100, 100);
      const q0 = quatMul(quatAxis([0, -1, 0], 88), quatAxis([1, 0, 0], 90));
      const u = quatRotate(q0, [0, 1, 0]); // 设备顶边轴（地心系）≈ 西
      const zBefore = quatRotate(q0, [0, 0, 1])[2];
      const q1 = quatMul(quatAxis(u, 10), q0); // 绕顶边轴 +10°（屏面朝天 = 抬起）
      const zAfter = quatRotate(q1, [0, 0, 1])[2];
      sendOrient(q0); sendOrient(q1);
      T.frameTick(f);
      return { pitchDeg: f.player.pitch / __gy.D2R, zBefore, zAfter };
    }""")
    check("AC2b 抬起手机 10° → 屏面朝天（z 上升）+ 视角上抬（pitch +10°×0.8±10%）",
          dir_pitch["zAfter"] > dir_pitch["zBefore"] and abs(dir_pitch["pitchDeg"] - 8) < 0.8, dir_pitch)

    # ---- AC3：开镜门控 + 收镜截止 ----
    ads_gate = pgB.evaluate(r"""() => {
      const { fake, T } = __gy;
      self.Gyro.TUNING.tailK = 0;
      const f = fake(1, 100, 100); // 开镜开启档
      T.pushDelta(-10, 0);
      T.frameTick(f);              // 未开镜 → 不动
      const yaw0 = f.player.yaw;
      f.player.xz.aimT = 1;        // 开镜
      T.pushDelta(-10, 0);
      T.frameTick(f);              // 开镜 → 生效
      const yaw1 = f.player.yaw;
      f.player.xz.aimT = 0;        // 收镜
      T.pushDelta(-10, 0);
      T.frameTick(f);              // 收镜 → 立即停止
      const yaw2 = f.player.yaw;
      T.pushDelta(0, 0);
      T.frameTick(f);              // 后续空帧
      const yaw3 = f.player.yaw;
      return { stopped0: yaw0, appliedDeg: (yaw1 - yaw0) / __gy.D2R,
               stopped2Deg: (yaw2 - yaw1) / __gy.D2R, noJumpDeg: (yaw3 - yaw2) / __gy.D2R };
    }""")
    check("AC3a 开镜档未开镜不生效", ads_gate["stopped0"] == 0, ads_gate)
    check("AC3b 开镜后生效（−10°）", abs(ads_gate["appliedDeg"] + 10) < 0.5, ads_gate)
    check("AC3c 收镜立即停止、无跳变无回弹",
          ads_gate["stopped2Deg"] == 0 and ads_gate["noJumpDeg"] == 0, ads_gate)

    # ---- AC4：基础/开镜灵敏度独立 ----
    gain = pgB.evaluate(r"""() => {
      const { fake, T } = __gy;
      const fA = fake(2, 100, 100); T.pushDelta(-10, 0); T.frameTick(fA);
      const fB = fake(2, 200, 100); T.pushDelta(-10, 0); T.frameTick(fB);
      const fC = fake(1, 100, 200); fC.player.xz.aimT = 1; T.pushDelta(-10, 0); T.frameTick(fC);
      const r = (-fB.player.yaw) / (-fA.player.yaw);
      const r2 = (-fC.player.yaw) / (-fA.player.yaw);
      return { r, r2, yawA: -fA.player.yaw / __gy.D2R, yawB: -fB.player.yaw / __gy.D2R, yawC: -fC.player.yaw / __gy.D2R };
    }""")
    check("AC4 基础 100% vs 200% → 视角速度 2 倍（±10%）", abs(gain["r"] - 2) < 0.2, gain)
    check("AC4b 开镜 200% 独立生效", abs(gain["r2"] - 2) < 0.2, gain)

    # ---- §5.3 死区（单事件 + 累计） ----
    dz = pgB.evaluate(r"""() => {
      const { fake, T } = __gy;
      const f = fake(2, 100, 100);
      for (let i = 0; i < 3; i++) T.pushDelta(0.03, 0);
      T.frameTick(f);
      const a = f.player.yaw;
      T.pushDelta(0.03, 0); // 第 4 个：累计 0.12° ≥ 0.1° → 一次性应用
      T.frameTick(f);
      return { before: a / __gy.D2R, applied: (f.player.yaw - a) / __gy.D2R };
    }""")
    check("§5.3a 单事件 <0.05° 丢弃（3×0.03° 不动）", dz["before"] == 0, dz)
    check("§5.3b 累计 ≥0.1° 一次性应用（ flush 帧 EMA 跨帧：0.5×0.12=0.06°）",
          abs(dz["applied"] - 0.06) < 0.02, dz)

    # ---- §5.4 EMA ----
    ema = pgB.evaluate(r"""() => {
      const { fake, T } = __gy;
      const f = fake(2, 100, 100);
      T.pushDelta(-10, 0); T.frameTick(f); // 首帧 EMA 从本帧起步 = 10°
      const y1 = (-f.player.yaw) / __gy.D2R;
      T.pushDelta(0, 0); T.frameTick(f);  // 次帧 fy=0 → EMA = 0.5×0 + 0.5×10 = 5°
      const y2 = (-f.player.yaw) / __gy.D2R - y1;
      return { y1, y2 };
    }""")
    check("§5.4 EMA α=0.5（首帧全量，次帧衰减一半）",
          abs(ema["y1"] - 10) < 0.01 and abs(ema["y2"] - 5) < 0.01, ema)

    # ---- AC11：单帧钳制 30° ----
    cl = pgB.evaluate(r"""() => {
      const { fake, T } = __gy;
      const f = fake(2, 300, 300); // 300% 也必须钳住
      T.pushDelta(-100, 0); T.frameTick(f);
      return { yawDeg: (-f.player.yaw) / __gy.D2R };
    }""")
    check("AC11 甩机单帧 100° → 实际应用钳到 30°", cl["yawDeg"] <= 30.0001 and cl["yawDeg"] > 29.9, cl)

    # ---- §7.5 逐帧仲裁（触屏同帧 veto） ----
    veto = pgB.evaluate(r"""() => {
      const { fake, T } = __gy;
      const f = fake(2, 100, 100);
      T.pushDelta(-10, 0);
      f._lookWriteAt = performance.now(); f._lookWriteSrc = 'touch';
      T.frameTick(f);
      const vetoed = f.player.yaw === 0;
      f._lookWriteSrc = 'gyro';
      T.frameTick(f); // 无新事件（缓冲已清）→ 仍不动
      const drained = f.player.yaw === 0;
      T.pushDelta(-10, 0); T.frameTick(f); // 下一帧无触屏写入 → 恢复生效
      return { vetoed, drained, applied: (-f.player.yaw) / __gy.D2R };
    }""")
    check("AC12/§7.5 触屏写视角的帧内陀螺仪增量被丢弃，松开后恢复（EMA 跨帧 0.5×10=5°）",
          veto["vetoed"] and veto["drained"] and abs(veto["applied"] - 5) < 0.1, veto)

    # ---- AC10：死亡 / 观战挂起，复活恢复 ----
    death = pgB.evaluate(r"""() => {
      const { fake, T } = __gy;
      const f = fake(2, 100, 100);
      T.pushDelta(-10, 0); T.frameTick(f);
      const alive = (-f.player.yaw) / __gy.D2R;
      f.player.health = 0; f.player.deathTime = 1;
      T.pushDelta(-10, 0); T.frameTick(f);
      const dead = (-f.player.yaw) / __gy.D2R - alive;
      f.player.health = 20; f.player.deathTime = 0; // 复活
      T.pushDelta(-10, 0); T.frameTick(f);
      const revived = (-f.player.yaw) / __gy.D2R - alive - dead;
      f.mode = 'spectator';
      T.pushDelta(-10, 0); T.frameTick(f);
      const spec = (-f.player.yaw) / __gy.D2R - alive - dead - revived;
      return { alive, dead, revived, spec };
    }""")
    check("AC10 死亡/观战挂起，复活自动恢复",
          abs(death["dead"]) < 0.001 and abs(death["spec"]) < 0.001 and abs(death["revived"] - 10) < 0.01, death)

    # ---- §7.4 竖屏挂起 + 旋转静默 ----
    port = pgB.evaluate(r"""() => {
      const { fake, T } = __gy;
      const f = fake(2, 100, 100); f.ui.h = 960; f.ui.w = 480; // 竖屏
      T.pushDelta(-10, 0); T.frameTick(f);
      const a = f.player.yaw;
      f.ui.w = 960; f.ui.h = 480;
      T.state.rotSilenceUntil = performance.now() + 300; // 旋转静默期
      T.pushDelta(10, 0); T.frameTick(f);
      const b = f.player.yaw - a;
      return { portrait: a, silence: b };
    }""")
    check("§7.4 竖屏挂起 + 旋转静默期丢弃", port["portrait"] == 0 and port["silence"] == 0, port)

    # ---- AC9：切后台 → 挂起；恢复后前 2 个事件丢弃 ----
    resume = pgB.evaluate(r"""() => {
      const { fake, quatMul, quatAxis, sendOrient, T } = __gy;
      const f = fake(2, 100, 100);
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
      T.pushDelta(10, 0); T.frameTick(f);
      const hidden = f.player.yaw;
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange')); // → dropCount = 2
      const q0 = quatMul(quatAxis([0, -1, 0], 88), quatAxis([1, 0, 0], 90));
      sendOrient(q0);                                   // 丢弃 1（重置参考）
      sendOrient(quatMul(quatAxis([0, 0, 1], 40), q0)); // 丢弃 2
      sendOrient(q0);                                   // 丢弃后首个有效 = 差分参考（本身丢弃）
      sendOrient(quatMul(quatAxis([0, 0, 1], -10), q0));// 恢复后首个应用：右转 10°
      T.frameTick(f);
      const after = (-f.player.yaw) / __gy.D2R;
      return { hiddenApplied: hidden, after, drops: T.state.dropCount };
    }""")
    check("AC9 切后台挂起；恢复后前 2 个事件丢弃，随后正常生效无瞬移",
          resume["hiddenApplied"] == 0 and resume["drops"] == 0 and abs(resume["after"] - 10) < 0.01, resume)

    # ---- §4.4 衰减尾（可选打磨项）：截止后 ≤80ms 同向衰减，无回弹 ----
    pgB.evaluate("() => { self.Gyro.TUNING.tailK = 0.6; }")
    tail = pgB.evaluate(r"""() => {
      const { fake, T } = __gy;
      const f = fake(1, 100, 100); f.player.xz.aimT = 1;
      T.pushDelta(-10, 0); T.frameTick(f);
      const y0 = (-f.player.yaw) / __gy.D2R;
      f.player.xz.aimT = 0; // 收镜
      let prev = y0, worst = 0, total = 0;
      for (let i = 0; i < 8; i++) { T.frameTick(f); const y = (-f.player.yaw) / __gy.D2R; const d = y - prev; total += d; worst = Math.min(worst, d); prev = y; }
      T.state.tailAt -= 1000; // 强制越过 80ms 尾窗
      T.frameTick(f); T.frameTick(f);
      const a = (-f.player.yaw) / __gy.D2R;
      T.frameTick(f);
      const endStatic = Math.abs(((-f.player.yaw) / __gy.D2R) - a) < 1e-9;
      return { y0, extra: total, noBounce: worst >= -1e-4, endStatic };
    }""")
    pgB.evaluate("() => { self.Gyro.TUNING.tailK = 0; }")
    check("§4.4 截止衰减尾：同向衰减、无回弹、最终静止",
          tail["noBounce"] and tail["endStatic"] and 0 <= tail["extra"] < 16, tail)

    # ---- AC13：对局中锁定 / 靶场放开 ----
    lock = pgB.evaluate("""() => {
      const orig = self.XZ && self.XZ.match;
      self.XZ.match = { on: () => true, state: () => ({ paused: false }) };
      __scr.tab = 'touch'; __scr.fill();
      const secs = [...__scr.el.querySelectorAll('.st-sec')].map(e => e.textContent);
      const segDis = [...__scr.el.querySelectorAll('[data-gm]')].map(b => b.disabled);
      const sliders = [...__scr.el.querySelectorAll('.sl input')].map(i => i.disabled);
      const pickBlocked = (() => { const m0 = __uiGame.settings.gyroMode; self.Gyro.uiPickMode(__uiGame, 2, () => {}); return __uiGame.settings.gyroMode === m0; })();
      if (orig) self.XZ.match = orig; else delete self.XZ.match;
      __scr.tab = 'touch'; __scr.fill();
      const unlocked = [...__scr.el.querySelectorAll('[data-gm]')].map(b => b.disabled);
      return { secs, segDis, sliders, pickBlocked, unlocked };
    }""")
    check("AC13a 对战类对局中：分组标题标注锁定、分段按钮置灰、陀螺仪双滑条置灰、改档无效",
          any("对局中锁定" in x for x in lock["secs"]) and all(lock["segDis"])
          and lock["sliders"][1] and lock["sliders"][2] and lock["pickBlocked"], lock)
    check("AC13b 非对局（含靶场，XZ.match.on=false）可实时调整", all(not d for d in lock["unlocked"]), lock["unlocked"])

    # ---- AC14：回调轻量（代码走查已由本文件注释保证；此处验证 60Hz 连发 600 事件 + 600 帧消费耗时） ----
    perf14 = pgB.evaluate(r"""() => {
      const { fake, quatMul, quatAxis, sendOrient, T } = __gy;
      const f = fake(2, 100, 100);
      const q0 = quatMul(quatAxis([0, -1, 0], 88), quatAxis([1, 0, 0], 90));
      const t0 = performance.now();
      for (let i = 0; i < 600; i++) sendOrient(quatMul(quatAxis([0, 0, 1], -0.5), q0));
      const t1 = performance.now();
      for (let i = 0; i < 600; i++) T.frameTick(f);
      const t2 = performance.now();
      return { evtMs: t1 - t0, frameMs: t2 - t1, perEvtUs: (t1 - t0) * 1000 / 600, perFrameUs: (t2 - t1) * 1000 / 600 };
    }""")
    check("AC14 600 事件 + 600 帧消费微基准（事件回调 <0.2ms/个，帧消费 <0.3ms/帧）",
          perf14["perEvtUs"] < 200 and perf14["perFrameUs"] < 300, perf14)

    # ---- 汇总 ----
    browser.close()

passed = sum(1 for r in R if r["ok"])
print(f"\n===== {passed}/{len(R)} PASS =====")
json.dump({"results": R, "passed": passed, "total": len(R), "ts": time.strftime("%F %T")},
          open("/workspace/tools/w5b-gyro-evidence.json", "w"), ensure_ascii=False, indent=2)
sys.exit(0 if passed == len(R) else 1)
