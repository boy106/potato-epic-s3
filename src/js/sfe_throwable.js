"use strict";
// W12a · S6 投掷物（规格 GDD-07 §7/§8.1：破片手雷 / 闪光弹 / 烟雾弹）
// 物理：优先复用 xzguns 公开接口 self.XZ.Grenade（F5，只读 bundle.js 不写入）；
//       接口不可达时按规格降级自写简易抛物线（无实体渲染，逻辑等价）。
// 烟雾判定与渲染解耦：AI 视线 = 线段-圆柱数学求交；渲染 = particles.spawn("smoke") 粒池预算（≤120/低端 60）。
const SFE_THROW = (() => {
  const TU = self.SURV && SURV.TUNE;
  const T = TU || {
    throwChargeSec: 0.5, throwV0: 6, throwVFull: 18,
    fragFuseSec: 3.5, fragRadius: 3, fragDmgC: 60, fragDmgE: 8, fragSelfMul: 0.5,
    flashFuseSec: 1.8, flashRadius: 10, flashConeDeg: 60, flashFullSec: 2.5, flashFadeSec: 2.5, flashBackSec: 0.8,
    flashAiL12: 4, flashAiL3: 2,
    smokeFuseSec: 2.0, smokeR: 2.5, smokeH: 3, smokeSec: 12,
    smokePartMax: 60, smokePartLow: 30, smokeLifeMin: 8, smokeLifeMax: 14,
    fragAlertR: 24,
  };
  const DT = 1 / 20;
  const now = () => performance.now();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ITEMS_DEF = [
    { key: "surf_frag", cn: "破片手雷", tex: "iron_ingot", stack: TU ? TU.fragCarry : 3 },
    { key: "surf_flash", cn: "闪光弹", tex: "ghast_tear", stack: TU ? TU.fragCarry : 3 },
    { key: "surf_smoke", cn: "烟雾弹", tex: "paper", stack: TU ? TU.smokeCarry : 2 },
  ];
  const KIND = { surf_frag: "frag", surf_flash: "flash", surf_smoke: "smoke" };
  const ITEM_IDS = {};
  function registerItems() {
    if (typeof defItem !== "function") return;
    for (const d of ITEMS_DEF) {
      if (self.ITEM_KEY && ITEM_KEY[d.key] != null) { ITEM_IDS[d.key] = ITEM_KEY[d.key]; continue; }
      const it = defItem(d.key, d.cn, { stack: d.stack, tex: tileOf(d.tex) });
      it.survThrowable = KIND[d.key];
      ITEM_IDS[d.key] = it.id;
    }
  }
  const tileOf = (k) => {
    try { const t = self.ASSETS && ASSETS.tiles && ASSETS.tiles["i_" + k]; return t != null ? t : ASSETS.tiles.white; }
    catch (e) { return self.ASSETS && ASSETS.tiles ? ASSETS.tiles.white : 0; }
  };
  registerItems();

  // ================================================================ 状态
  const st = {
    charging: null,       // { key, t }
    smoke: [],            // { x, y, z, until, part, spawnAcc }
    projs: [],            // 降级模式虚拟投掷物
  };
  const matchOn = (g) => !!(self.SURV && SURV.matchOn && SURV.matchOn(g));
  const poseOn = (g) => !!(self.SURV && SURV.poseOn(g));

  // ================================================================ 蓄力/投掷（§7.1：按 use 蓄力 0~0.5s，松手掷出）
  function tickCharge(g) {
    const p = g && g.player;
    if (!p || !poseOn(g) || g.state !== "play" || (g.ui && g.ui.screen)) { st.charging = null; return; }
    const held = p.inv.held;
    const kind = held && ITEMS[held.id] && ITEMS[held.id].survThrowable;
    const btn = !!g.mouseBtn[2];
    if (st.charging) {
      // 手持切换 / 受击 / 扑行 → 取消不消耗（对齐药物打断惯例）
      const m = self.SFE_RULES && SFE_RULES.match;
      const fireNow = m && matchOn(g) ? m.t - m.fireT < DT * 2 : false;
      if (!btn || held.id !== ITEM_IDS[st.charging.key] || p.survDiveT > 0 || fireNow) {
        st.charging = null;
        return;
      }
      st.charging.t = Math.min(T.throwChargeSec, st.charging.t + DT);
    } else if (btn && kind) {
      const m = self.SFE_RULES && SFE_RULES.match;
      if (m && matchOn(g) && m.phase === "DEPLOY") return;             // DEPLOY 保护期禁投掷（§7.1）
      if (p.survDiveT > 0 || now() < SURV.st.poseLockUntil || SURV.st.drug) return;
      st.charging = { key: Object.keys(KIND).find((k) => ITEM_IDS[k] === held.id), t: 0 };
    }
  }
  function chargeRatio() { return st.charging ? st.charging.t / T.throwChargeSec : 0; }

  function release(g) {
    const c = st.charging;
    st.charging = null;
    if (!c) return;
    const p = g.player;
    const held = p.inv.held;
    if (!held || held.id !== ITEM_IDS[c.key]) return;
    const ratio = clamp(c.t / T.throwChargeSec, 0, 1);
    const spd = T.throwV0 + (T.throwVFull - T.throwV0) * ratio;        // 方块/s（满蓄 18）
    const eye = [p.pos[0], p.pos[1] + p.eye(), p.pos[2]];
    const yaw = p.yaw, pitch = p.pitch;
    const dir = [
      -Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch),
    ];
    const v = dir.map((d) => (d * spd) / 20);                          // 方块/tick
    const kind = KIND[c.key];
    spawnProj(g, p, eye, v, kind);
    // 消耗 1 个
    held.count--;
    if (held.count <= 0) p.inv.slots[p.inv.sel] = null;
    // 投掷计入 fireT → 撤离读条被打断（进度保留不清，F6/§8.3）
    const m = self.SFE_RULES && SFE_RULES.match;
    if (m && matchOn(g)) m.fireT = m.t;
  }

  // ================================================================ 投掷物实体（复用 XZ.Grenade 物理与渲染）
  function spawnProj(g, owner, pos, vel, kind) {
    const fuse = Math.round(
      (kind === "frag" ? T.fragFuseSec : kind === "flash" ? T.flashFuseSec : T.smokeFuseSec) / DT,
    );
    if (self.XZ && XZ.Grenade) {
      try {
        class SurvGrenade extends XZ.Grenade {
          constructor(gg, x, y, z, v) { super(gg, x, y, z, v, owner); this.survFuse = fuse; this.survKind = kind; }
          tick() {
            if (this.dead) return;
            if (--this.survFuse <= 0) return this.survBoom(this.pos[0], this.pos[1], this.pos[2]);
            survPhysics(this);
          }
          boom(...a) { /* 原生碰撞引爆路径改走自管引信 */ this.survBoom(a[0], a[1], a[2]); }
          drawSelf(...a) { try { super.drawSelf(...a); } catch (e) {} }
        }
        g.entities.push(new SurvGrenade(g, pos[0], pos[1], pos[2], vel));
        return;
      } catch (e) { /* 落入降级路径 */ }
    }
    // 降级：自写简易抛物线（模块管理，无实体渲染，逻辑等价——规格 §0-4 降级条款）
    st.projs.push({ g, game: g, owner, pos: [...pos], vel: [...vel], fuse, kind, age: 0 });
  }

  // Grenade 同款物理（F5：重力 −0.05/tick、阻力 ×0.99、落地弹跳）
  function survPhysics(e) {
    const g = e.game, p = e.pos, v = e.vel;
    const step = Math.hypot(v[0], v[1], v[2]);
    if (step > 0) {
      const dir = [v[0] / step, v[1] / step, v[2] / step];
      const hit = g.raycast ? g.raycast(p, dir, step + 0.05, !1, !0) : null;
      if (hit && hit.t <= step) {
        // 弹跳：命中轴反射 ×0.45
        const bx = p[0] + dir[0] * hit.t, by = p[1] + dir[1] * hit.t, bz = p[2] + dir[2] * hit.t;
        const n = hit.n || normalGuess(g, bx, by, bz, dir);
        const dot = v[0] * n[0] + v[1] * n[1] + v[2] * n[2];
        v[0] = (v[0] - 2 * dot * n[0]) * 0.45;
        v[1] = (v[1] - 2 * dot * n[1]) * 0.45;
        v[2] = (v[2] - 2 * dot * n[2]) * 0.45;
        p[0] = bx + n[0] * 0.05; p[1] = by + n[1] * 0.05; p[2] = bz + n[2] * 0.05;
      } else {
        p[0] += v[0]; p[1] += v[1]; p[2] += v[2];
      }
    }
    v[1] -= 0.05;
    v[0] *= 0.99; v[1] *= 0.99; v[2] *= 0.99;
    if (g.particles && e.age % 4 === 0) g.particles.spawn("smoke", p[0], p[1], p[2], 0, 0.01, 0);
    e.age++;
    if (p[1] < -80) e.dead = true;
  }
  const normalGuess = (g, x, y, z, dir) => {
    const ax = Math.abs(dir[0]), ay = Math.abs(dir[1]), az = Math.abs(dir[2]);
    return ax > ay && ax > az ? [-Math.sign(dir[0]), 0, 0] : ay > az ? [0, -Math.sign(dir[1]), 0] : [0, 0, -Math.sign(dir[2])];
  };

  // ================================================================ 引信触发（离手后计时，无论是否落地 §7.1）
  function survBoom(e, x, y, z) {
    e.dead = true;
    const g = e.game;
    if (e.survKind === "frag") fragBoom(g, e, x, y, z);
    else if (e.survKind === "flash") flashBoom(g, x, y, z);
    else smokeBoom(g, x, y, z);
  }
  // 破片：game.explode 半径 3（与榴弹发射器同路径 F5），伤害线性 60→8，自伤 ×0.5（§7.2）
  function fragBoom(g, e, x, y, z) {
    const owner = e.shooter || e.owner || null;
    const dmgFn = (dist, maxR, ent) => {
      if (dist > T.fragRadius) return 0;
      let d = T.fragDmgC + ((T.fragDmgE - T.fragDmgC) * dist) / T.fragRadius;
      if (ent && owner && ent === owner) d *= T.fragSelfMul;           // 自伤 ×0.5
      return Math.max(1, Math.round(d));
    };
    try {
      // 9 参 dmgFn 为本任务在 game.js explode 的最小侵入点（可选参，不传走原公式）
      g.explode(x, y, z, T.fragRadius, owner, !1, !1, null, dmgFn);
    } catch (err) {
      g.explode(x, y, z, T.fragRadius, owner, !1, !1);                 // 兜底：原生公式
    }
    // 爆炸声惊动 24 格 AI：转向声源，不直接索敌（§8.1）
    alertAI(g, x, y, z);
    const p = g.player;
    if (p && self.XZ && XZ.shake) {
      const d = Math.hypot(p.pos[0] - x, p.pos[1] + 1 - y, p.pos[2] - z);
      if (d < 16) XZ.shake(3.5 * (1 - d / 16));
    }
  }
  function alertAI(g, x, y, z) {
    try {
      for (const e of g.entities) {
        if (!e || e.dead || !e.T || !e.T.hostile) continue;
        if (Math.hypot(e.pos[0] - x, e.pos[1] - y, e.pos[2] - z) > T.fragAlertR) continue;
        const dy = Math.atan2(-(x - e.pos[0]), -(z - e.pos[2]));
        e.turnTo && e.turnTo(dy, 0.5);                                 // 转向声源（不索敌）
      }
    } catch (err) {}
  }
  // 闪光：触发半径 10、视线无遮挡；玩家锥角 <60° 全白 2.5s+渐退 2.5s，背对/遮挡 0.8s；AI L1/L2 4s / L3 2s（§7.2/§8.1）
  function flashBoom(g, x, y, z) {
    const p = g.player;
    if (p && !p.dead) {
      const eye = [p.pos[0], p.pos[1] + p.eye(), p.pos[2]];
      const d = Math.hypot(eye[0] - x, eye[1] - y, eye[2] - z);
      if (d <= T.flashRadius && los(g, eye, [x, y, z])) {
        const toFlash = [x - eye[0], y - eye[1], z - eye[2]];
        const view = [-Math.sin(p.yaw) * Math.cos(p.pitch), Math.sin(p.pitch), -Math.cos(p.yaw) * Math.cos(p.pitch)];
        const facing = self.SURV && SURV._test.flashCone(toFlash, view);
        if (facing) SURV.flashHit(T.flashFullSec, T.flashFadeSec);
        else SURV.flashHit(T.flashBackSec, 0);
      } else SURV.flashHit(T.flashBackSec, 0);
    }
    try {
      for (const e of g.entities) {
        if (!e || e.dead || !e.T || !e.T.hostile) continue;
        const d = Math.hypot(e.pos[0] - x, e.pos[1] + 1 - y, e.pos[2] - z);
        if (d > T.flashRadius) continue;
        if (!los(g, [e.pos[0], e.pos[1] + 1, e.pos[2]], [x, y, z])) continue;
        // L3（精英骷髅）2s，L1/L2 4s（按类型近似：skeleton=ranged 高层）
        const lvl3 = e.type === "skeleton";
        e.survBlindT = Math.round((lvl3 ? T.flashAiL3 : T.flashAiL12) / DT);
        e.target = null;                                               // 索敌中断
      }
    } catch (err) {}
    if (g.particles) for (let i = 0; i < 12; i++)
      g.particles.spawn("crit", x, y, z, 0.4 * (Math.random() - 0.5), 0.3 * Math.random(), 0.4 * (Math.random() - 0.5));
  }
  // 烟雾：落地静止后触发（§7.2），持续 12s，半径 2.5/高 3 圆柱
  function smokeBoom(g, x, y, z) {
    st.smoke.push({ g, x, y, z, until: now() + T.smokeSec * 1000, armed: false, part: partBudget() });
  }
  const partBudget = () => {
    try {
      const n = (navigator.hardwareConcurrency || 8) + (navigator.deviceMemory || 4);
      return n <= 8 ? T.smokePartLow : T.smokePartMax;                 // 低端 30/团（§7.3 降档）
    } catch (e) { return T.smokePartMax; }
  };

  // 视线检测（无遮挡 = true；复用 game.raycast，Grenade 同款参数）
  function los(g, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const d = Math.hypot(dx, dy, dz) || 1e-9;
    const hit = g.raycast ? g.raycast(a, [dx / d, dy / d, dz / d], d, !1, !0) : null;
    return !hit || hit.t >= d - 0.2;
  }

  // ================================================================ 烟雾：AI 视线遮挡 + 粒子维持（§7.3/§8.1）
  // 线段-圆柱求交（半径 2.5、高 3 的圆柱区，数学判定非体素）——供 AI sees 包装与验收 15 自测
  function segCylHit(a, b, cx, cy, cz, r, h) {
    const ax = a[0] - cx, az = a[2] - cz, bx = b[0] - cx, bz = b[2] - cz;
    const dx = bx - ax, dz = bz - az;
    const A = dx * dx + dz * dz, B = 2 * (ax * dx + az * dz), C = ax * ax + az * az - r * r;
    const yAt = (t) => a[1] + (b[1] - a[1]) * t;
    if (A < 1e-9) return C <= 0 && yIn(a, b);                          // 线段垂直穿圆柱轴
    const disc = B * B - 4 * A * C;
    if (disc < 0) return false;
    const sq = Math.sqrt(disc);
    for (const t of [(-B - sq) / (2 * A), (-B + sq) / (2 * A)]) {
      if (t < 0 || t > 1) continue;
      const y = yAt(t);
      if (y >= cy && y <= cy + h) return true;
    }
    return false;
    function yIn(pa, pb) {
      const y0 = Math.min(pa[1], pb[1]), y1 = Math.max(pa[1], pb[1]);
      return y1 >= cy && y0 <= cy + h;
    }
  }
  function smokeBlocks(mob, target) {
    if (!st.smoke.length) return false;
    const a = [mob.pos[0], mob.pos[1] + (mob.eye ? mob.eye() : 1.5), mob.pos[2]];
    const b = [target.pos[0], target.pos[1] + (target.eye ? target.eye() : 1.5), target.pos[2]];
    return st.smoke.some((s) => segCylHit(a, b, s.x, s.y, s.z, T.smokeR, T.smokeH));
  }
  function smokeTick() {
    const t = now();
    st.smoke = st.smoke.filter((s) => t < s.until && s.g.state === "play");
    for (const s of st.smoke) {
      // 落地静止后才触发：爆点下方无支撑则等 1 格落定（最多 3s 兜底）
      if (!s.armed) {
        const bl = s.g.world.getBlock(Math.floor(s.x), Math.floor(s.y - 0.3), Math.floor(s.z));
        const solid = bl && BLOCKS[bl] && BLOCKS[bl].solid;
        if (solid || t > s.until - (T.smokeSec - 3) * 1000) s.armed = true;
        else continue;
      }
      // 粒子维持：每团 ≤预算（life 8~14 tick，均值 ~11 → 每 tick 生成 part/11 循环再生）
      if (!s.g.particles) continue;
      s.spawnAcc = (s.spawnAcc || 0) + s.part / 11;
      while (s.spawnAcc >= 1) {
        s.spawnAcc--;
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * T.smokeR;
        s.g.particles.spawn(
          "smoke",
          s.x + Math.cos(a) * r,
          s.y + Math.random() * T.smokeH,
          s.z + Math.sin(a) * r,
          0.008 * (Math.random() - 0.5), 0.006, 0.008 * (Math.random() - 0.5),
        );
      }
    }
  }

  // ================================================================ 降级虚拟投掷物推进
  function projTick() {
    for (const pr of st.projs) {
      if (pr.done) continue;
      survPhysics(pr);
      if (--pr.fuse <= 0 || pr.pos[1] < -80) {
        pr.done = true;
        if (pr.kind === "frag") fragBoom(pr.g, { shooter: pr.owner, game: pr.g }, pr.pos[0], pr.pos[1], pr.pos[2]);
        else if (pr.kind === "flash") flashBoom(pr.g, pr.pos[0], pr.pos[1], pr.pos[2]);
        else smokeBoom(pr.g, pr.pos[0], pr.pos[1], pr.pos[2]);
      }
    }
    st.projs = st.projs.filter((p) => !p.done);
  }

  // ================================================================ 安装
  let installed = false;
  function install() {
    if (installed || typeof Game === "undefined") return;
    installed = true;
    const gt = Game.prototype.tick;
    Game.prototype.tick = function () {
      const r = gt.apply(this, arguments);
      try {
        if (this.state === "play") {
          tickCharge(this);
          smokeTick();
          projTick();
        }
      } catch (e) { typeof errLog === "function" && errLog(e, "sfe_throw tick"); }
      return r;
    };
    // 松手即掷：use 键抬起沿统一在 tickCharge 内检测（桌面与移动端同源 mouseBtn[2]）
  }
  install();

  // 蓄力中途松手兜底：Game.use 抬起沿不可靠，统一在 tickCharge 内检测 !btn 时 release
  const _origTickCharge = tickCharge;
  tickCharge = function (g) {
    if (st.charging && !g.mouseBtn[2]) { try { release(g); } catch (e) { st.charging = null; } return; }
    _origTickCharge(g);
  };

  // ================================================================ mock 测试出口
  const _test = { st, T, segCylHit, los, chargeRatio, tickCharge, release, spawnProj, fragBoom, flashBoom, smokeBoom };
  return { st, T, chargeRatio, smokeBlocks, _test, ITEM_IDS: () => ITEM_IDS };
})();
self.SFE_THROW = SFE_THROW;
//# sourceURL=js/sfe_throwable.js
