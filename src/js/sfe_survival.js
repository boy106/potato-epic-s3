"use strict";
// W12a · S3 生存系统（规格 GDD-07 07-s3-survival-spec.md，方案 B）
// 职责：① 体力条（仅搜打撤启用，竞技模式零开销旁路）；② 趴姿 prone（接 entity.js PLAYER_H 状态机）；
//       ③ 飞扑 dive（冲刺触发，落地强制接趴）；④ 肢体损伤轨（方案 B：双腿/双臂 2 轨，规格 §5.4 允许合并）；
//       ⑤ 药物 5 种（读条可缓移、打断不消耗）；⑥ HUD（体力条/部位图标/药物读条/闪光遮罩/喘息图标）。
// 全部新增数值集中在 SURV.TUNE（对齐 SFE_MAP.TUNE 惯例，规格 §0/§8.5-16）。
// 输入接入：entity.js 姿态机读 t.prone（game.js readInput 注入），本模块经 Player.prototype.tick 包装做输入仲裁。
const SURV = (() => {
  // ================================================================ 调参块（规格数值表唯一出处）
  const TUNE = {
    // —— 体力（§2）——
    stamMax: 100,
    drainSprint: 8,        // /s
    drainJump: 12,         // /次
    drainDive: 25,         // /次
    drainMelee: 6,         // /次
    meleeStamMin: 10,      // <10 禁挥击
    regenStand: 15, regenCrouch: 12, regenProne: 18, regenWalk: 10, regenAds: 8,
    regenDelay: 0.8,       // s，停止消耗后
    sprintGate: 15,        // <15 不可进入冲刺
    gaspSec: 1.5,          // 喘息时长
    gaspSpeed: 0.8,        // 喘息移速 ×0.8
    gaspResume: 10,        // 体力 ≥10 才解禁
    diveStamMin: 25,       // <25 不可飞扑
    // —— 趴姿（§3）——
    proneSpd: 0.25,        // 移速 ×0.25
    pronePitchMin: -80 * Math.PI / 180, pronePitchMax: 20 * Math.PI / 180,
    poseLockSec: 0.3,      // 姿态过渡期
    // —— 飞扑（§4）——
    diveSpd: 7.0,          // 峰值 方块/s（tick 内换算 /20）
    diveTicks: 11,         // 0.55s @20Hz
    diveDrag: 0.99,        // Grenade 同款阻力（F5）
    diveGravity: 0.05,     // Grenade 同款重力（F5）
    diveRise: 0.16,        // 起跳垂直初速（≈+0.25 方块小抛物线）
    diveWallK: 0.4,        // 水平速度骤降 >60% 判撞墙
    diveWallCost: 5,       // 撞墙扣体力
    diveCdSec: 0.5,        // 落地后防扑链
    diveFireLock: 0.85,    // 扑中+落地禁射总时长
    // —— 肢体损伤轨（§5.3/§5.4，方案 B；左右歧义 → 双腿/双臂 2 轴）——
    limbMul: 3,            // 四肢命中伤害 ×3 累计
    limbMax: 100,
    legSlow1: 40, legSlow1Mul: 0.85,
    legSlow2: 70, legSlow2Mul: 0.7,   // 且禁冲刺禁飞扑
    armSway: 40, armSwayMul: 1.5,     // 开镜晃动 +50%
    armHeavy: 70, armReloadMul: 1.3, armSpreadAdd: 0.5,
    limbHyst: 10,          // 阈值迟滞：降到 阈值−10 才解除
    // —— 药物（§6.2）——
    drugMoveMul: 0.5,      // 读条移速 ×0.5
    bandageSec: 3, bandageHeal: 30,     // 每轨 −30
    medkitSec: 6, medkitHp: 10, medkitCarry: 2,
    epiSec: 2, epiDur: 20, epiSpd: 1.15, epiRegen: 2, epiDrain: 0.7, epiFatigueSec: 10, epiFatigueMul: 0.5, epiCarry: 2,
    painSec: 2, painDur: 30, painCarry: 2,
    energySec: 1.5, energyStam: 40, energyDrain: 0.8, energyDur: 10, energyCarry: 3,
    // —— 投掷物（§7，物理与效果实现在 sfe_throwable.js，数值同块集中）——
    throwChargeSec: 0.5, throwV0: 6, throwVFull: 18,
    fragFuseSec: 3.5, fragRadius: 3, fragDmgC: 60, fragDmgE: 8, fragSelfMul: 0.5, fragCarry: 3,
    flashFuseSec: 1.8, flashRadius: 10, flashConeDeg: 60, flashFullSec: 2.5, flashFadeSec: 2.5, flashBackSec: 0.8,
    flashAiL12: 4, flashAiL3: 2,
    smokeFuseSec: 2.0, smokeR: 2.5, smokeH: 3, smokeSec: 12, smokeCarry: 2,
    smokePartMax: 60, smokePartLow: 30, smokeLifeMin: 8, smokeLifeMax: 14,
    fragAlertR: 24,        // 爆炸惊动半径（§8.1）
    // —— HUD/设置（§2.4/§7.4）——
    hudLow: 0.15,          // 体力条 <15% 变红
    flashPeak: 0.85,       // 白闪峰值透明度
  };
  const DT = 1 / 20; // Game.tick 20Hz（sfe_rules TICK_DT 惯例）

  // ================================================================ 运行时状态（单机单玩家）
  const st = {
    stam: TUNE.stamMax,
    lastCostAt: -9,       // 最近一次消耗（游戏 tick 数）
    gaspLeft: 0,          // 喘息剩余 tick
    wantProne: false,
    proneHeld: false,     // 趴键沿
    poseLockUntil: 0,     // performance.now 基准
    diveFireLockUntil: 0,
    diveCdUntil: 0,
    lastPose: "stand",
    tracks: { legs: 0, arms: 0 },            // 损伤轨（方案 B）
    latch: { legs1: false, legs2: false, arms1: false, arms2: false },
    drug: null,           // { id, key, left(tick), total, startTick }
    buffs: { epi: 0, epiFatigue: 0, pain: 0, energy: 0 },   // 剩余 tick
    flash: { full: 0, fade: 0 },   // 剩余 tick
    lastFireAt: 0,        // performance.now（药物打断用）
    lastHeldId: -1,
    matchRef: null,       // SFE 对局实例（换局重置检测）
    lastHurtTick: -9,
  };

  // ================================================================ 工具
  const now = () => performance.now();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const matchOn = (g) => !!(g && g.worldMeta && g.worldMeta.sfe && self.SFE_RULES && SFE_RULES.match && !SFE_RULES.match.settle);
  const match = () => (self.SFE_RULES && SFE_RULES.match) || null;
  // 模式判定（规格 §1.2）：sfe=全量；comp(天梯/乱斗/靶场/约战 worldMeta.xzduel)=旁路；其余=沙盒（趴/扑/药物/投掷可用）
  const modeOf = (g) => {
    const wm = g && g.worldMeta;
    if (wm && wm.sfe) return "sfe";
    if (wm && wm.xzduel) return "comp";
    return "sandbox";
  };
  const survOn = (g) => modeOf(g) === "sfe";       // 体力/损伤/药物 debuff 域
  const poseOn = (g) => modeOf(g) !== "comp";      // 趴/扑/药物/投掷域
  const aimAmt = (p) => {
    try { return (self.XZ && XZ.aimAmount && XZ.aimAmount(p)) || 0; } catch (e) { return 0; }
  };

  // ================================================================ 物品注册（绷带/急救包/肾上腺素/止痛针/能量饮料）
  const DRUGS = {
    surf_bandage:   { cn: "绷带",     sec: TUNE.bandageSec, carry: 5, tex: "paper",
                      desc: "四肢损伤每轨 −30" },
    surf_medkit:    { cn: "急救包",   sec: TUNE.medkitSec, carry: TUNE.medkitCarry, tex: "iron_ingot",
                      desc: "HP +10 并清空全部四肢损伤" },
    surf_epi:       { cn: "肾上腺素针", sec: TUNE.epiSec, carry: TUNE.epiCarry, tex: "sugar",
                      desc: `20s：移速 ×1.15 体力恢复 ×2 冲刺消耗 ×0.7；结束后疲劳 ${TUNE.epiFatigueSec}s` },
    surf_painkiller:{ cn: "止痛针",   sec: TUNE.painSec, carry: TUNE.painCarry, tex: "ghast_tear",
                      desc: "30s：压制全部四肢 debuff（损伤值保留）" },
    surf_energy:    { cn: "能量饮料", sec: TUNE.energySec, carry: TUNE.energyCarry, tex: "redstone",
                      desc: `立即回体力 +${TUNE.energyStam} · 10s 体力消耗 ×0.8` },
  };
  const tileOf = (k) => {
    try { const t = self.ASSETS && ASSETS.tiles && ASSETS.tiles["i_" + k]; return t != null ? t : ASSETS.tiles.white; }
    catch (e) { return self.ASSETS && ASSETS.tiles ? ASSETS.tiles.white : 0; }
  };
  let ITEM_IDS = {};
  function registerItems() {
    if (typeof defItem !== "function") return;
    for (const [key, d] of Object.entries(DRUGS)) {
      if (ITEM_KEY[key] != null) { ITEM_IDS[key] = ITEM_KEY[key]; continue; }
      const it = defItem(key, d.cn, { stack: d.carry, tex: tileOf(d.tex) });
      it.survDrug = key;
      ITEM_IDS[key] = it.id;
    }
  }
  registerItems();

  // ================================================================ 体力（§2）
  const stam = {
    get: () => st.stam,
    ratio: () => st.stam / TUNE.stamMax,
    cost(n) { st.stam = clamp(st.stam - n, 0, TUNE.stamMax); st.lastCostAt = tickNo(); },
    canSprintEnter: () => st.stam >= TUNE.sprintGate,
    canDive: () => st.stam >= TUNE.diveStamMin && st.gaspLeft <= 0,
    canMelee: () => st.stam >= TUNE.meleeStamMin,
    gasping: () => st.gaspLeft > 0,
  };
  let _tick = 0;
  const tickNo = () => _tick;

  // 恢复速率（§2.3）：姿态分层 + 行走 + 开镜 min(rate, 8) + 肾上腺素/疲劳系数
  function regenRate(p) {
    let r;
    if (p.proning) r = TUNE.regenProne;
    else if (p.sneaking) r = TUNE.regenCrouch;
    else if (Math.hypot(p.pos[0] - p.prev[0], p.pos[2] - p.prev[2]) > 0.001) r = TUNE.regenWalk;
    else r = TUNE.regenStand;
    if (aimAmt(p) > 0.5) r = Math.min(r, TUNE.regenAds);
    if (st.buffs.epi > 0) r *= TUNE.epiRegen;
    else if (st.buffs.epiFatigue > 0) r *= TUNE.epiFatigueMul;
    return r;
  }

  // ================================================================ 损伤轨（§5.3 方案 B）
  // 命中分类：src.hitY（entity.js Arrow 命中注入）→ 低于 eye−0.3 = 腿，眼 −0.3~+0.5 = 臂；
  // 近战（type "mob"）= 腿（AI 地面挥击）；xzguns 弹道走 XZ.onHitEntity 包装（part==="limb" → 腿）。
  function classifyHit(p, src) {
    if (!src) return null;
    if (src.bullet) return null;                       // xzguns 弹道由 onHitEntity 通道处理，防双计
    if (src.hitY != null) {
      const eye = p.pos[1] + p.eye();
      if (src.hitY < eye - 0.3) return "legs";
      if (src.hitY < eye + 0.5) return "arms";
      return null;
    }
    if (src.type === "mob" && src.attacker) return "legs";
    return null;
  }
  function addLimb(track, dmg) {
    if (!track || dmg <= 0) return;
    st.tracks[track] = clamp(st.tracks[track] + dmg * TUNE.limbMul, 0, TUNE.limbMax);
  }
  // debuff 状态（含 −10 迟滞；止痛针压制 → 规格 §6.2）
  function limbState(kind) {
    const v = st.tracks[kind];
    const sup = st.buffs.pain > 0;
    if (kind === "legs") {
      const l2 = st.latch.legs2 ? v >= TUNE.legSlow2 - TUNE.limbHyst : v >= TUNE.legSlow2;
      const l1 = l2 || (st.latch.legs1 ? v >= TUNE.legSlow1 - TUNE.limbHyst : v >= TUNE.legSlow1);
      st.latch.legs1 = l1; st.latch.legs2 = l2;
      if (sup) return { slow: 1, hard: false };
      return { slow: l2 ? TUNE.legSlow2Mul : l1 ? TUNE.legSlow1Mul : 1, hard: l2 };
    }
    const l2 = st.latch.arms2 ? v >= TUNE.armHeavy - TUNE.limbHyst : v >= TUNE.armHeavy;
    const l1 = l2 || (st.latch.arms1 ? v >= TUNE.armSway - TUNE.limbHyst : v >= TUNE.armSway);
    st.latch.arms1 = l1; st.latch.arms2 = l2;
    if (sup) return { sway: false, heavy: false };
    return { sway: l1, heavy: l2 };
  }
  const limbReset = () => { st.tracks.legs = 0; st.tracks.arms = 0; st.latch = { legs1: false, legs2: false, arms1: false, arms2: false }; };

  // ================================================================ 药物（§6）
  function drugStart(g, p, key) {
    const d = DRUGS[key];
    if (!d || !poseOn(g)) return false;
    if (st.drug || st.flash.full > 0) return false;                 // 读条中不叠加
    if (now() < st.poseLockUntil || p.survDiveT > 0 || now() < st.diveFireLockUntil) return false;
    if (key === "surf_medkit" && p.health >= p.maxHealth) {          // HP 满禁用（§6.1）
      g.ui && g.ui.message("急救包：生命值已满，无需使用", "#FFD24A");
      return false;
    }
    st.drug = { key, left: Math.round(d.sec / DT), total: Math.round(d.sec / DT) };
    st.lastHeldId = p.inv && p.inv.held ? p.inv.held.id : -1;
    return true;
  }
  function drugFinish(g, p) {
    const key = st.drug && st.drug.key;
    st.drug = null;
    if (!key) return;
    consumeHeld(g, p, key);
    if (key === "surf_bandage") {
      st.tracks.legs = Math.max(0, st.tracks.legs - TUNE.bandageHeal);
      st.tracks.arms = Math.max(0, st.tracks.arms - TUNE.bandageHeal);
    } else if (key === "surf_medkit") {
      p.health = Math.min(p.maxHealth, p.health + TUNE.medkitHp);
      limbReset();
    } else if (key === "surf_epi") {
      st.buffs.epi = Math.round(TUNE.epiDur / DT);      // 同名不叠加，仅刷新剩余时长（§6.1）
      st.buffs.epiFatigue = 0;
    } else if (key === "surf_painkiller") {
      st.buffs.pain = Math.round(TUNE.painDur / DT);
    } else if (key === "surf_energy") {
      st.stam = clamp(st.stam + TUNE.energyStam, 0, TUNE.stamMax);
      st.buffs.energy = Math.round(TUNE.energyDur / DT);
    }
  }
  function consumeHeld(g, p, key) {
    const s = p.inv.held;
    if (s && ITEMS[s.id] && ITEMS[s.id].survDrug === key) {
      s.count--;
      if (s.count <= 0) p.inv.slots[p.inv.sel] = null;
    }
  }
  // 打断：开火/受击/飞扑/切换手持物 → 取消不消耗（§6.1）
  function drugInterrupted(g, p) {
    if (!st.drug) return false;
    const m = match();
    if (now() - st.lastFireAt < DT * 2 * 1000) return true;
    if (m && matchOn(g) && m.t - m.fireT < DT * 2) return true;
    if (m && matchOn(g) && m.t - m.hitT < DT * 2) return true;
    if (p.hurtTime > 5 || _tick - st.lastHurtTick < 2) return true;
    if (p.inv.held && p.inv.held.id !== st.lastHeldId) return true;
    return false;
  }

  // ================================================================ 玩家 tick 仲裁（Player.prototype.tick 包装）
  // 在引擎姿态机/移动结算前改写输入 t：冲刺门槛/喘息/趴姿/飞扑触发/药物读条推进。
  function preTick(g, p, t) {
    _tick++;
    const m = match();
    // 换局重置（§8.2：死亡/结算清零）
    if (m !== st.matchRef) { st.matchRef = m; resetRun(p); }
    // 增益计时
    for (const k of ["epi", "epiFatigue", "pain", "energy"]) if (st.buffs[k] > 0) st.buffs[k]--;
    if (st.flash.full > 0) st.flash.full--; else if (st.flash.fade > 0) st.flash.fade--;
    st.lastHeldId = p.inv && p.inv.held ? p.inv.held.id : -1;

    // —— 输入注入：prone ——（桌面 bindDown / 移动端 touchHeld，bindDown 为 controls.js 全局函数）
    let proneIn = false;
    try { proneIn = !!(typeof bindDown === "function" && bindDown(g, "prone")); } catch (e) {}
    if (!poseOn(g) || (g.ui && g.ui.screen)) proneIn = false;

    // —— 药物读条推进 ——
    if (st.drug) {
      if (drugInterrupted(g, p)) { st.drug = null; g.ui && g.ui.message("读条被打断（物品未消耗）", "#FFD24A"); }
      else {
        st.drug.left--;
        if (st.drug.left <= 0) drugFinish(g, p);
      }
    }

    // —— 体力结算（仅搜打撤，§1.2）——
    if (survOn(g)) {
      const moving = t.fwd > 0 || Math.hypot(p.pos[0] - p.prev[0], p.pos[2] - p.prev[2]) > 0.005;
      if (p.sprinting && moving) {
        let d = TUNE.drainSprint;
        if (st.buffs.epi > 0) d *= TUNE.epiDrain;
        else if (st.buffs.energy > 0) d *= TUNE.energyDrain;
        stam.cost(d * DT);
      }
      if (stam.get() <= 0 && st.gaspLeft <= 0 && p.sprinting) st.gaspLeft = Math.round(TUNE.gaspSec / DT);
      if (st.gaspLeft > 0) {
        st.gaspLeft--;
        // 喘息结束条件：时长走完且体力回升 ≥10（§2.4；喘息期内按恢复速率自然回升）
        if (st.gaspLeft <= 0 && stam.get() < TUNE.gaspResume) st.gaspLeft = 1;
      }
      if (_tick - st.lastCostAt > TUNE.regenDelay / DT && !p.sprinting && p.survDiveT <= 0)
        st.stam = clamp(st.stam + regenRate(p) * DT, 0, TUNE.stamMax);
    }

    // —— 输入改写 ——
    if (survOn(g)) {
      // <15 不可进入冲刺；已冲刺者继续直到 0 或松开（§2.4）
      if (!p.sprinting && t.sprint && !stam.canSprintEnter()) t.sprint = false;
      if (st.gaspLeft > 0) { t.sprint = false; t.jump = false; }        // 喘息禁冲刺/跳/扑
    }
    if (st.drug) { t.sprint = false; }                                   // 读条禁冲刺（×0.5 缓移经 speedK）

    // —— 姿态过渡锁（§3.1：0.3s 内不能再次切换姿态）——
    const poseLocked = now() < st.poseLockUntil;
    if (p.pose !== st.lastPose) { st.lastPose = p.pose; st.poseLockUntil = now() + TUNE.poseLockSec * 1000; }
    // 水域 swim 优先级高于 prone；上岸不自动回趴（§8.4）
    if (p.pose === "swim" && st.wantProne) st.wantProne = false;

    // —— 趴姿 / 飞扑（§3/§4）——
    const pronePress = proneIn && !st.proneHeld;                          // 上升沿
    st.proneHeld = proneIn;
    if (poseOn(g) && p.survDiveT > 0) { t.prone = false; return; }        // 扑行中趴键忽略（§4.4）
    if (p.proning) {
      // 趴态：趴键或跳跃键 = 尝试起立（§3.1）；起立走引擎 fits 链（stand→crouch→保持趴）
      if (pronePress && !poseLocked) st.wantProne = false;
      if (t.jump) { t.jump = false; if (!poseLocked) st.wantProne = false; }
    } else if (pronePress && !poseLocked) {
      if (
        p.sprinting && p.onGround && stam.canDive() && now() >= st.diveCdUntil &&
        poseOn(g) && !(m && m.phase === "DEPLOY") &&
        (function spaceAhead() {                                           // 前方 1 格高度可通行（§4.1）
          try {
            const d = [-Math.sin(p.yaw), -Math.cos(p.yaw)];
            const x = Math.floor(p.pos[0] + d[0] * 1.2), z = Math.floor(p.pos[2] + d[1] * 1.2);
            const b = BLOCKS[g.world.getBlock(x, Math.floor(p.pos[1] + 0.1), z)];
            return !b || !b.solid;
          } catch (e) { return true; }
        })()
      ) {
        triggerDive(g, p);
      } else if (!p.sprinting && !p.inWater && !p.flying && !p.spectator && p.pose !== "swim") {
        st.wantProne = true;                                               // 趴下永远允许（0.6 高空间）
      }
    }
    t.prone = st.wantProne;                                                // 保持趴（起立由上面沿沿清位）
    // 趴姿 pitch 钳制（§3.2）
    if (p.proning) p.pitch = clamp(p.pitch, TUNE.pronePitchMin, TUNE.pronePitchMax);

    // —— speedK 合成（F2 乘法链的挂点）——
    let k = 1;
    if (st.gaspLeft > 0) k *= TUNE.gaspSpeed;
    if (survOn(g)) {
      const legs = limbState("legs");
      k *= legs.slow;
      if (legs.hard) t.sprint = false;                                   // 腿损 ≥70 禁冲刺禁飞扑
    }
    if (st.drug) k *= TUNE.drugMoveMul;
    if (st.buffs.epi > 0) k *= TUNE.epiSpd;
    p.speedK = k;
  }

  // —— 飞扑触发（§4.1/§4.2；运动结算在 entity.js dive 分支）——
  function triggerDive(g, p) {
    const spd = TUNE.diveSpd / 20;                                       // 方块/tick
    const d = [-Math.sin(p.yaw), -Math.cos(p.yaw)];
    p.survDiveT = TUNE.diveTicks;
    p.survDiveDir = [d[0] * spd, d[1] * spd];
    p.survDiveVy = TUNE.diveRise;
    p.sprinting = false;
    st.wantProne = false;
    stam.cost(TUNE.drainDive);
    st.diveFireLockUntil = now() + TUNE.diveFireLock * 1000;             // 扑中+落地 0.85s 禁射
    p.onSurvDiveEnd = (reason) => {
      p.onSurvDiveEnd = null;
      if (reason === "wall") stam.cost(TUNE.diveWallCost);               // 撞墙代价（不扣血 §4.4）
      if (reason === "land" || reason === "wall") st.wantProne = true;   // 强制接趴，不自动起立（§4.3）
      if (reason === "water") st.wantProne = false;                      // 扑入水转 swim
      st.diveCdUntil = now() + TUNE.diveCdSec * 1000;
      st.lastPose = p.pose;
      st.poseLockUntil = now() + TUNE.poseLockSec * 1000;
    };
    p.onSurvJump = null;
  }

  // 跳跃消耗钩子（entity.js onSurvJump）
  function onJump() {
    const g = self.game, p = g && g.player;
    if (!p || !survOn(g)) return;
    if (st.gaspLeft > 0) return;
    stam.cost(TUNE.drainJump);
  }

  // 死亡/换局重置（§8.2）
  function resetRun(p) {
    st.stam = TUNE.stamMax;
    st.gaspLeft = 0;
    st.wantProne = false;
    st.drug = null;
    st.flash = { full: 0, fade: 0 };
    limbReset();
    st.buffs = { epi: 0, epiFatigue: 0, pain: 0, energy: 0 };
    if (p) { p.survDiveT = 0; p.onSurvDiveEnd = null; p.onSurvJump = null; p.speedK = 1; }
  }

  // 闪光命中（sfe_throwable 触发；§7.4 峰值透明度 + 渐退）
  function flashHit(fullSec, fadeSec) {
    st.flash.full = Math.round(fullSec / DT);
    st.flash.fade = Math.round(fadeSec / DT);
  }

  // ================================================================ 开镜晃动（臂损 ≥40 → sway 层经 lookWrite 同链，F7/§10.2）
  let swayT = 0;
  function swayTick(g) {
    const p = g && g.player;
    if (!p || !survOn(g)) return;
    if (st.buffs.pain > 0) return;
    const arms = limbState("arms");
    if (!arms.sway || aimAmt(p) <= 0.5) return;
    swayT += DT * 9;
    const amp = 0.0028 * TUNE.armSwayMul;
    lookWrite(g, Math.sin(swayT) * amp, Math.cos(swayT * 1.37) * amp * 0.6, "survArmSway");
  }

  // ================================================================ HUD（§2.4/§2.5/§5.4/§6.1/§7.4；drawHUD 链）
  function drawHUD(ui) {
    const g = ui.game, ctx = ui.ctx;
    const p = g && g.player;
    if (!ctx || !p || g.state !== "play" || ui.screen) return;
    const md = modeOf(g);
    if (md === "comp") return;
    const w = ui.w, h = ui.h;
    // 体力条（搜打撤专用，§2.5：贴血条下方、血条同宽、纯色填充）
    if (md === "sfe") {
      const bw = 91, bx = Math.floor(w / 2 - 91), by = h - 38;
      const r = stam.ratio();
      ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(bx - 1, by - 1, bw + 2, 7);
      ctx.fillStyle = r < TUNE.hudLow ? "#FF6060" : r < 0.4 ? "#FFD24A" : "#E8E8E8";
      ctx.fillRect(bx, by, Math.round(bw * r), 5);
      if (st.gaspLeft > 0) Font.draw(ctx, "喘息…", bx + bw + 6, by - 3, "#FFD24A", !1);
      // 部位损伤图标（亮=健康 黄=40+ 红=70+，§5.4）
      const legV = st.tracks.legs, armV = st.tracks.arms;
      const col = (v) => v >= 70 ? "#FF6060" : v >= 40 ? "#FFD24A" : "#19C79A";
      Font.draw(ctx, "腿", bx - 26, by - 3, col(legV), !1);
      Font.draw(ctx, "臂", bx - 14, by - 3, col(armV), !1);
      // 药物读条（屏幕下方短进度条，与撤离读条 h-96 错位排布，§6.1/§8.3）
      if (st.drug) {
        const d = DRUGS[st.drug.key];
        const dw = Math.min(220, w * 0.4), dx = (w - dw) / 2, dy = h - 74;
        ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(dx - 4, dy - 6, dw + 8, 22);
        ctx.fillStyle = "#7EB6FF"; ctx.fillRect(dx, dy + 4, dw * (1 - st.drug.left / st.drug.total), 8);
        Font.draw(ctx, `${d.cn} 使用中…`, dx, dy - 4, "#7EB6FF", !1);
      }
      // 增益剩余（克制显示）
      let tag = "";
      if (st.buffs.epi > 0) tag += ` 肾上腺素 ${(st.buffs.epi * DT).toFixed(0)}s`;
      if (st.buffs.pain > 0) tag += ` 止痛 ${(st.buffs.pain * DT).toFixed(0)}s`;
      if (st.buffs.energy > 0) tag += ` 能量 ${(st.buffs.energy * DT).toFixed(0)}s`;
      if (tag) Font.draw(ctx, tag.trim(), bx, by - 12, "#7EB6FF", !1);
    }
    // 闪光遮罩（§7.4：峰值 0.85 × 强度滑条，非纯白）
    const f = st.flash;
    if (f.full > 0 || f.fade > 0) {
      const slider = clamp(g.settings && g.settings.survFlash != null ? g.settings.survFlash : TUNE.flashPeak, 0.5, 1);
      const a = f.full > 0 ? TUNE.flashPeak : TUNE.flashPeak * (f.fade / Math.round(TUNE.flashFadeSec / DT));
      ctx.fillStyle = `rgba(255,255,255,${(a * slider).toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }
    // 投掷蓄力条（sfe_throwable 状态）
    if (self.SFE_THROW && SFE_THROW.chargeRatio() > 0) {
      const cr = SFE_THROW.chargeRatio();
      const cw = 120, cx = Math.floor(w / 2 - cw / 2), cy = h - 56;
      ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(cx - 1, cy - 1, cw + 2, 7);
      ctx.fillStyle = "#FFD24A"; ctx.fillRect(cx, cy, Math.round(cw * cr), 5);
    }
  }

  // ================================================================ 全局安装（wrap 链；对齐 sfe_rules install 惯例）
  let installed = false;
  function install() {
    if (installed || typeof Game === "undefined" || typeof Player === "undefined") return;
    installed = true;

    // Player.tick：输入仲裁（在最前）
    const ptickOrig = Player.prototype.tick;
    Player.prototype.tick = function (t) {
      const g = this.game;
      try {
        if (t && typeof t === "object" && this === g.player && !this.dead) {
          t.prone = false;                       // 引擎姿态机专用输入，本模块独占写
          preTick(g, this, t);
        }
      } catch (e) { typeof errLog === "function" && errLog(e, "surv pretick"); }
      return ptickOrig.apply(this, arguments);
    };

    // Player.hurt：损伤轨分流（伤害照常进 HP，方案 B 平行记账 §5.3）
    const hurtOrig = Player.prototype.hurt;
    Player.prototype.hurt = function (dmg, src) {
      const g = this.game;
      if (matchOn(g) && this === g.player && src && !src.bullet) {
        const track = classifyHit(this, src);
        if (track) addLimb(track, dmg);
        st.lastHurtTick = _tick;
      }
      return hurtOrig.call(this, dmg, src);
    };

    // Player.swing：体力门 + 近战消耗 + 药物打断（firePulse）
    const swingOrig = Player.prototype.swing;
    Player.prototype.swing = function (...a) {
      const g = this.game;
      if (this === g.player && survOn(g) && !g.breaking) {
        if (!stam.canMelee()) return !1;         // <10 禁挥击（§2.4）
        stam.cost(TUNE.drainMelee);
      }
      if (this === g.player) st.lastFireAt = now();
      return swingOrig.apply(this, a);
    };

    // Player.die：损伤/增益/体力清零（§8.2）
    const dieOrig = Player.prototype.die;
    Player.prototype.die = function (cause) {
      if (this === this.game.player) resetRun(this);
      return dieOrig.call(this, cause);
    };

    // Game.use：药物入口（与吃食同键 use 通路，§6.1）
    const useOrig = Game.prototype.use;
    Game.prototype.use = function () {
      const p = this.player, s = p && p.inv && p.inv.held;
      if (s && ITEMS[s.id] && ITEMS[s.id].survDrug && poseOn(this)) {
        drugStart(this, p, ITEMS[s.id].survDrug);
        return;                                  // 药物走自管读条，不进 vanilla use
      }
      return useOrig.apply(this, arguments);
    };

    // HUD 链（sfe_rules 已包装 drawHUD，本模块再链一层）
    if (typeof UI !== "undefined" && UI.prototype.drawHUD && !UI.prototype.drawHUD.__surv) {
      const hudOrig = UI.prototype.drawHUD;
      UI.prototype.drawHUD = function () {
        hudOrig.call(this);
        try { drawHUD(this); } catch (e) {}
      };
      UI.prototype.drawHUD.__surv = true;
    }

    // Game.tick：开镜晃动 + 趴姿 pitch 已在 preTick；sway 挂 20Hz tick
    const gtickOrig = Game.prototype.tick;
    Game.prototype.tick = function () {
      const r = gtickOrig.apply(this, arguments);
      try { swayTick(this); } catch (e) {}
      return r;
    };

    // 「闪光强度」滑条（§7.4 设置项；经 controlOptions 追加，不触碰 potato.js 内部）
    if (typeof OptionsListScreen !== "undefined" && !OptionsListScreen.prototype.__survOpt) {
      const coOrig = OptionsListScreen.prototype.controlOptions;
      OptionsListScreen.prototype.controlOptions = function () {
        const list = coOrig.call(this);
        const g = this.game;
        if (!g || !g.settings) return list;
        list.push({
          slider: true,
          value: clamp(g.settings.survFlash != null ? g.settings.survFlash : TUNE.flashPeak, 0.5, 1),
          label: () => "闪光强度：" + Math.round(100 * (g.settings.survFlash != null ? g.settings.survFlash : TUNE.flashPeak)) + "%",
          onChange: (v) => { g.settings.survFlash = Math.round(100 * clamp(v, 0.5, 1)) / 100; },
        });
        return list;
      };
      OptionsListScreen.prototype.__survOpt = true;
    }

    installAISees(); // 烟雾/闪光对 AI 视线的作用不依赖 xzguns
    installXZ();   // xzguns 公开接口复用（轮询至 bundle 就绪）
  }

  // ---- xzguns 接口包装（bundle 为 BOOT_EXTRA 晚载，轮询等待；只读 bundle.js，不写入）----
  let xzDone = false;
  function installXZ() {
    const timer = setInterval(() => {
      const XZ = self.XZ;
      if (!XZ) return;
      xzDone = true;
      clearInterval(timer);
      // ① 开火阻断（扑行/姿态过渡/落地禁射）——链式，保留前序（duel noFire）
      const nf = XZ.noFire;
      XZ.noFire = (g) => {
        const p = g && g.player;
        if (p && (p.survDiveT > 0 || now() < st.poseLockUntil || now() < st.diveFireLockUntil)) return true;
        return nf ? nf(g) : false;
      };
      // ② 蓄力开镜阻断（扑中禁开镜 §4.2）
      const ai = XZ.aimInput;
      if (ai) XZ.aimInput = (g, down) => {
        const p = g && g.player;
        return ai(g, down && !(p && (p.survDiveT > 0 || now() < st.diveFireLockUntil)));
      };
      // ③ 腰射散布：趴姿 ×0.6 / 臂损 ≥70 腰射 +0.5（§3.2/§5.4）
      const sp = XZ.spreadNow;
      if (sp) XZ.spreadNow = (g, item, f) => {
        let v = sp(g, item, f);
        const p = g && g.player;
        if (p && survOn(g)) {
          if (p.proning) v *= 0.6;
          if (limbState("arms").heavy && !f) v += TUNE.armSpreadAdd;
        }
        return v;
      };
      // ④ 换弹：臂损 ≥70 ×1.3（§5.4）+ 扑行/禁射期禁换弹（§4.2）
      const so = XZ.slowOf;
      if (so) XZ.slowOf = (item) => {
        const g = self.game;
        let v = so(item);
        if (g && g.player && survOn(g) && limbState("arms").heavy && st.buffs.pain <= 0) v *= TUNE.armReloadMul;
        return v;
      };
      const rn = XZ.reloadNow;
      if (rn) XZ.reloadNow = (g) => {
        const p = g && g.player;
        if (p && (p.survDiveT > 0 || now() < st.diveFireLockUntil || now() < st.poseLockUntil)) return;
        return rn(g);
      };
      // ⑤ 玩家开火脉冲（xzguns 独立开火路径 → 药物打断 + 撤离读条 fireT，F6）
      const of_ = XZ.onFired;
      XZ.onFired = (g, who) => {
        if (of_) of_.apply(this, arguments);
        if (who === g.player) {
          st.lastFireAt = now();
          const m = match();
          if (m && matchOn(g)) m.fireT = m.t;
        }
      };
      // ⑥ 损伤轨弹道通道：onHitEntity(game, shooter, target, isHead, dmg, killed, part)
      const ohe = XZ.onHitEntity;
      XZ.onHitEntity = (g, shooter, target, isHead, dmg, killed, part) => {
        if (ohe) ohe.apply(this, arguments);
        try {
          if (g && target === g.player && matchOn(g) && part === "limb" && shooter !== target)
            addLimb("legs", dmg);              // bundle limb 判定 = 命中点低于眼−0.3（02-§3.1）→ 腿轨
        } catch (e) {}
      };
      // ⑦ AI 视线：烟雾体积 + 闪光致盲（§8.1；实现挂 sees 同链）
      installAISees();
    }, 300);
  }

    // —— AI：sees 包装（烟雾圆柱遮挡 + 致盲；线段-圆柱数学判定，规格 §7.2/§8.1）——
  function installAISees() {
    const cands = [self.Mob, self.Living, self.Entity].filter((P) => P && P.prototype && P.prototype.sees);
    const P = cands[0];
    if (!P || P.prototype.__survSees) return;
    const orig = P.prototype.sees;
    P.prototype.sees = function (t) {
      if (this.survBlindT > 0) return false;                       // 闪光致盲期
      if (self.SFE_THROW && t && SFE_THROW.smokeBlocks(this, t)) return false;
      return orig.call(this, t);
    };
    P.prototype.__survSees = true;
  }

  // ================================================================ 跨成员钩子 & mock 测试出口
  const _test = {
    TUNE, DRUGS, st, stam, addLimb, limbState, classifyHit, drugStart, drugFinish, modeOf, survOn, poseOn,
    resetRun, regenRate, preTick, drugInterrupted, DT, limbReset,
    segCylHit: null,   // 由 sfe_throwable 注入（线段-圆柱求交，供验收 15 自测）
    flashCone: (dirA, dirB) => {                                        // 锥角判定（验收 14）
      const d = (a) => Math.hypot(a[0], a[1], a[2]) || 1e-9;
      const c = (a, b) => (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (d(a) * d(b));
      return Math.acos(clamp(c(dirA, dirB), -1, 1)) * 180 / Math.PI < TUNE.flashConeDeg;
    },
  };

  install();

  return {
    TUNE, st, stam, DRUGS, ITEM_IDS: () => ITEM_IDS, matchOn, survOn, poseOn, modeOf,
    onJump, drugStart, resetRun, flashHit, _test,
    get tracks() { return st.tracks; },
  };
})();
self.SURV = SURV;
//# sourceURL=js/sfe_survival.js
