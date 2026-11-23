"use strict";
// W10c 搜打撤（SFE）世界工厂 —— 方案 §五步 1/2/6。
// 职责：① createWorld 旁路工厂（固定 seed、meta.sfe/ephemeral、structures 关、spawn 预算）；
//       ② 局终即弃守卫（putChunks/autosave 封堵、DB.deleteWorld、陈局清理）；
//       ③ 大地图规划（720²/45×45 chunk）与登机期预生成衔接；
//       ④ 设备档映射（AI 上限 / 预生成半径）。
// 依赖：SFE_MAP/SFE_POI、Game/DB/WG/BID（全部惰性或加载期已存在；本模块在 potato.js 之前加载）。
const SFE_WORLD = (() => {
  const M = self.SFE_MAP;
  const T = M.TUNE;

  const state = {
    active: false,        // 当前是否处于 SFE 对局（进图 → 结算）
    worldId: null,
    plan: null,           // SFE_POI.computePlan 产物
    placed: 0,
    preset: "medium",     // 设备档（detectPreset 结果，低配降 AI 上限）
  };

  // ---------------------------------------------------------------- seed 与元数据
  const sfeSeed = () => M.strHash(T.seedStr + ":" + T.mapVersion) | 0;

  const buildMeta = (spawn, planSeed) => ({
    id: "sfe~" + Date.now().toString(36),
    name: "搜打撤 · " + T.mapVersion.toUpperCase(),
    seed: planSeed,
    gen: 2,                    // gen2 噪声世界（首次接入 L2 世界生成层）
    mode: "survival",
    flat: false,
    created: Date.now(),
    lastPlayed: Date.now(),
    time: 6000,                // 正午开局（规格未约束昼夜；固定正午便于对局计时体感）
    player: null,
    hardcore: false,
    difficulty: 2,
    cheats: false,
    structures: false,         // 方案 §2.4：砍 vanilla 结构，POI 密度由 SFE POI 承担
    bonus: false,
    weather: 0,
    spawn,
    sfe: true,                 // 模式标记（sfe_rules 全部以此为判）
    ephemeral: true,           // 局终即弃（方案 §2.5）
    sfePlanSeed: planSeed,
  });

  // ---------------------------------------------------------------- 陈局清理（崩溃恢复入口：验收 §9.12）
  async function cleanupStale() {
    try {
      const list = await DB.listWorlds();
      for (const w of list || []) if (String(w.id).startsWith("sfe~")) await DB.deleteWorld(w.id);
    } catch (e) { /* 存档层不可用不阻断 */ }
  }

  // ---------------------------------------------------------------- 地表高度查询（复用 WG 生成器，同 seed 同高度）
  function makeHeightSampler(planSeed) {
    const palette = { air: 0 };
    for (const k in BID) palette[k] = BID[k];
    const gen = new WG.Generator(BigInt(planSeed), self.WG_DATA, palette, "sfe");
    return (x, z) => gen.baseHeight(x, z, false);
  }

  // ---------------------------------------------------------------- 启动对局（06 卡 → 出击准备 → 确认后调用）
  async function start(game) {
    await cleanupStale();
    const planSeed = sfeSeed();
    // 出生点先用轻量预扫定下（meta.spawn 必须先于 loadWorld 存在，跳过 genSpawn/WG.findSpawn）
    const sampler = makeHeightSampler(planSeed);
    const c0 = (T.chunkSpan * 16) / 2;
    let spawn = null;
    for (let rad = 0; rad < 240 && !spawn; rad += 16)
      for (let k = 0; k < 12 && !spawn; k++) {
        const ang = (k / 12) * Math.PI * 2;
        const x = Math.round(c0 + Math.cos(ang) * rad), z = Math.round(c0 + Math.sin(ang) * rad);
        const h = sampler(x, z);
        if (h > 63 && h < 100) spawn = [x, h + 1, z];
      }
    if (!spawn) spawn = [c0, 80, c0];

    const meta = buildMeta(spawn, planSeed);
    await DB.putWorld(meta);
    state.worldId = meta.id;
    state.placed = 0;
    state.preset = (game.settings && game.settings.preset && game.settings.preset !== "auto" && PRESETS[game.settings.preset]) ? game.settings.preset
      : (game.renderer ? detectPreset(game.renderer.gl) : "medium");

    // GenPool init 携带 dim:"sfe"（terrain2.js 一行接线）→ worker 侧 noise_settings.sfe 生效
    self.SFE_GEN = "sfe";
    try {
      await game.loadWorld(meta.id);
    } finally {
      self.SFE_GEN = null;
    }
    if (!game.world || !game.worldMeta || !game.worldMeta.sfe) throw new Error("sfe: 世界加载失败");
    game.world.sfe = true;

    // 大地图规划（loading 屏已开，同步计算不产生体感卡顿；同 seed 断言见 sfe_poi）
    state.plan = SFE_POI.computePlan(makeHeightSampler(planSeed), { seed: planSeed });
    state.active = true;
    return { meta, plan: state.plan };
  }

  // ---------------------------------------------------------------- 结束对局（撤离/死亡/超时/退出共用）
  async function end(game) {
    state.active = false;
    const id = state.worldId;
    state.worldId = null;
    state.plan = null;
    state.placed = 0;
    // 内存释放：epoch 世代自弃（terrain2 reset 由下次 loadWorld 承担），chunk 渲染随 setupWorld 清空
    if (game && game.worldMeta && game.worldMeta.sfe) {
      game.worldMeta.sfeDone = true;
    }
    if (id) { try { await DB.deleteWorld(id); } catch (e) {} }
  }

  // ---------------------------------------------------------------- 守卫：chunk 级数据一律不落盘（方案 §2.5 唯一薄弱点）
  // cloudsave.js:94 包装在先（pack4 先加载），本包装在链最外层：ephemeral 对局直接吞掉写盘。
  function installGuards() {
    if (DB.putChunks.__sfeGuard) return;
    const putChunksOrig = DB.putChunks.bind(DB);
    DB.putChunks = async function (store, entries) {
      if (state.active && entries && entries.length) return; // 不写 IndexedDB、不进 cloud dirty
      return putChunksOrig(store, entries);
    };
    DB.putChunks.__sfeGuard = true;

    if (typeof Game !== "undefined" && Game.prototype && !Game.prototype.autosaveStart.__sfeGuard) {
      const autosaveOrig = Game.prototype.autosaveStart;
      Game.prototype.autosaveStart = function () {
        if (state.active) return; // 对局制跳过 autosave（对齐 xzduel 先例 game.js:1106）
        return autosaveOrig.call(this);
      };
      Game.prototype.autosaveStart.__sfeGuard = true;
    }
  }

  // ---------------------------------------------------------------- 设备档映射（方案 §三）
  function aiCap() {
    return state.preset === "low" ? T.aiCapLow : T.aiCapHigh;
  }

  installGuards();

  return { state, sfeSeed, start, end, cleanupStale, aiCap, buildMeta };
})();
self.SFE_WORLD = SFE_WORLD;
//# sourceURL=js/sfe_world.js
