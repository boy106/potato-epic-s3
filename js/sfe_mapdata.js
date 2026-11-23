"use strict";
// W10c 搜打撤（SFE）地图数据模块 —— 唯一必须可被 gen_worker importScripts 的新模块。
// 职责：① 向 WG_DATA 注入 noise_settings.sfe（地形噪声子集，方案 §2.4）；
//      ② 搜打撤全部调参常量集中块（规格 §9.16 验收）+ POI/撤离点/巢穴落位参数与战利品表。
// 依赖：仅 self.WG_DATA（pack1 worldgen_data.js 之后加载）；其余引用全部运行期惰性解析，
//       因此主线程（pack2 位置）与 gen_worker（worldgen_data.js 之后）加载皆安全。
const SFE_MAP = (() => {
  // ---------------------------------------------------------------- 调参常量块（规格 §3/§5/§6 集中定义）
  const TUNE = {
    // 地图与边界（W10b 定稿 720²，45×45 chunk）
    mapVersion: "v1",            // 进 seed 派生；换图 = 改这里
    seedStr: "sfe-v1",           // 固定 seed 基串（方案 §2.2：版本内同 seed 同图）
    mapSize: 720,                // 方块边长（可玩区 [0,720)）
    chunkSpan: 45,               // 45×45 = 2025 块
    // 局时长（规格 §3.1）
    deploySec: 30,               // DEPLOY 段：无敌+禁开火
    extractOpenT: 240,           // T+4:00 常开点开放
    finalWindowT: 720,           // T+12:00 广播，主点开放、常开点关闭
    forceEndT: 900,              // T+15:00 硬结算
    // 撤离（规格 §3.5）
    readSec: 5,                  // 读条 5s
    extractRadius: 6,            // 撤离圈半径（方块）
    alwaysOpenCount: 3,          // 常开点 3
    mainCandidates: 3,           // 主撤离点候选 3（每局随机 3 选 1）
    // 经济（规格 §3.2/§3.3）
    sellDiscount: 0.5,           // 变现 = 黑市成本当量 × 50%
    matchSellCap: 500,           // 单局变现封顶
    // 仓库与背包（规格 §5.1/§2.1）
    stashSlots: 24,              // 仓库 24 格
    insuranceSlots: 1,           // 免费保险格 1 格
    // AI（规格 §3.4/§8.3）
    aiCapHigh: 24,               // 全图活跃 AI 上限（高/中配）
    aiCapLow: 16,                // 低端机降档上限
    aiSpawnRadius: 56,           // 巢穴/驻守激活半径（仅玩家接近才 spawn）
    aiDespawnRadius: 96,         // 玩家远离即回收
    aiTickEvery: 20,             // AI 调度节流（tick 数，20Hz → 每 1s）
    hpL1: 20,                    // L1 游荡者血量
    hpL2: 25,                    // L2 巡逻血量
    hpL3min: 40,                 // L3 精英血量下限
    hpL3max: 60,                 // L3 精英血量上限
    deployGrace: "sfe_grace",    // DEPLOY 段 AI 不索敌标记
    // 性能分档（方案 §三）
    pregenRadius: 16,            // 登机期预生成半径（chunk，出生区 ±16）
    mapTier: "M",                // 地图档 M（降级 S=480 备用）
    mapTierS: 480,
  };
  // 材料基准价（规格 §3.2【设计·低】联调校准；变现价 = 当量合计 × 50%）
  const MATERIAL_VALUE = {
    iron_ingot: 1, oak_planks: 1, wool: 1, leather: 1, paper: 1,
    gold_ingot: 5, amethyst: 5,
    copper_ingot: 2, glass: 2, gunpowder: 2,
    redstone: 3, diamond: 10,
  };
  // 成品枪械/配件当量（黑市成本当量；变现 = ×50%）。抽查对照规格 §9.7：
  // 冲锋枪 22 → 11 币；突击步枪 27 → 13 币（规格示例 13）；狙击 40 → 20 币；8倍镜 16 → 8 币。
  const GOODS_VALUE = {
    smg: 22, assault_rifle: 27, sniper: 40, revolver: 14, pistol: 10,
    shotgun: 24, lmg: 36, bolt_action: 30, double_barrel: 18, grenade_launcher: 32, rifle: 25,
    scope_8x: 16, scope_4x: 12, red_dot: 8, grip: 6, ext_mag: 6, laser: 6, muzzle: 6, stock: 6,
    // 弹药按束当量（拾取栈 × 单位价）
    bullet_light: 0.5, bullet_heavy: 1, shell: 1, rocket: 4,
  };
  // 战利品表（规格 §3.2 物资层 T0~T4；w=权重，id=物品/材料名，n=[min,max]）
  const LOOT = {
    T0: [ // 白板速通补给：地面散落/散点箱
      { id: "iron_ingot", w: 20, n: [1, 3] },
      { id: "oak_planks", w: 16, n: [1, 4] },
      { id: "paper", w: 10, n: [1, 2] },
      { id: "gunpowder", w: 8, n: [1, 2] },
      { id: "bullet_light", w: 18, n: [8, 16] },
    ],
    T1: [ // 常规容器
      { id: "copper_ingot", w: 18, n: [1, 3] },
      { id: "glass", w: 12, n: [1, 3] },
      { id: "redstone", w: 10, n: [1, 2] },
      { id: "revolver", w: 4, n: [1, 1] },
      { id: "smg", w: 3, n: [1, 1] },
      { id: "bullet_light", w: 14, n: [8, 16] },
      { id: "iron_ingot", w: 16, n: [2, 4] },
    ],
    T2: [ // 常规容器深处/精英箱
      { id: "gold_ingot", w: 14, n: [1, 2] },
      { id: "amethyst", w: 10, n: [1, 2] },
      { id: "bullet_heavy", w: 12, n: [6, 12] },
      { id: "shell", w: 8, n: [4, 8] },
      { id: "red_dot", w: 5, n: [1, 1] },
      { id: "grip", w: 5, n: [1, 1] },
      { id: "ext_mag", w: 5, n: [1, 1] },
      { id: "rifle", w: 3, n: [1, 1] },
      { id: "copper_ingot", w: 12, n: [2, 4] },
    ],
    T3: [ // 精英容器
      { id: "diamond", w: 10, n: [1, 2] },
      { id: "scope_4x", w: 5, n: [1, 1] },
      { id: "scope_8x", w: 3, n: [1, 1] },
      { id: "bolt_action", w: 3, n: [1, 1] },
      { id: "assault_rifle", w: 3, n: [1, 1] },
      { id: "bullet_heavy", w: 12, n: [8, 16] },
      { id: "gold_ingot", w: 14, n: [2, 3] },
    ],
    T4: [ // 主 POI 深处精英容器 / 稀有材料袋
      { id: "sniper", w: 4, n: [1, 1] },
      { id: "lmg", w: 4, n: [1, 1] },
      { id: "diamond", w: 18, n: [2, 4] },
      { id: "amethyst", w: 14, n: [2, 4] },
      { id: "scope_8x", w: 5, n: [1, 1] },
      { id: "assault_rifle", w: 4, n: [1, 1] },
    ],
  };
  // POI 落位（方案 §2.3 哈希网格）：主 POI spacing 16 chunk（256m）/ 散点 spacing 6 chunk 频率抽稀
  const POI = {
    main:  { spacing: 16, sep: 6, salt: 0x5fe1337, wantMin: 6, wantMax: 8, elite: [2, 3], normal: [6, 10], edgeChunks: 3 },
    minor: { spacing: 6,  sep: 2, salt: 0x1ab04d2,  freq: 0.82, elite: [0, 0], normal: [1, 2], edgeChunks: 2 },
  };
  // 撤离点锚（方案 §2.3 固定哈希锚 + 半格 jitter；常开 3 分布三向 + 主点候选 3）
  const EXTRACT = {
    salt: 0x7ee0c1a,
    always: [ // 三向均衡：西北 / 东南 / 东北（格心 + 方向偏移，格 = 45×45 chunk）
      { cx: 10, cz: 10, name: "西北撤离点" },
      { cx: 34, cz: 34, name: "东南撤离点" },
      { cx: 34, cz: 10, name: "东北撤离点" },
    ],
    mainCandidates: [
      { cx: 22, cz: 8,  name: "中央车站" },
      { cx: 8,  cz: 26, name: "废弃机场" },
      { cx: 30, cz: 28, name: "南岭哨站" },
    ],
    jitterChunks: 2,             // 落点抖动 ≤ 半格量级
  };
  // AI 巢穴（方案 §2.3 中频网格锚定）
  const LAIR = {
    spacing: 11, sep: 3, salt: 0x3d2c9a1, wantMax: 8, edgeChunks: 4, freq: 0.72,
    guardRadius: 16,             // L3 交战不追出 16 格（规格 §3.4）
  };
  // POI 场景蓝图参数（纯程序化箱体，无手工结构 v1）
  const POI_BUILD = {
    platform: 9,                 // 场地平整半径（方块）
    deepPit: true,               // 主 POI 含一处深挖精英坑（"深入险地"叙事，规格 §6.3）
    pitDepth: 6,
    marker: "gold_block",        // POI 地标柱
  };

  // ---------------------------------------------------------------- 确定性哈希工具（无外部依赖，worker/主线程同源）
  // FNV-1a 32bit + mulberry32；同 seed 同落点（方案步 3 验收：落点哈希一致）
  const hash2 = (a, b, c, d) => {
    let h = 0x811c9dc5 ^ (a | 0);
    h = Math.imul(h ^ (b | 0), 16777619);
    h = Math.imul(h ^ (c | 0), 16777619);
    h = Math.imul(h ^ (d | 0), 16777619);
    h ^= h >>> 15;
    return h >>> 0;
  };
  const mulberry32 = (s) => {
    let a = s >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const strHash = (str) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  // ---------------------------------------------------------------- SFE noise settings（自研紧凑子集，方案 §2.4）
  // 说明：本 build 的 WG_DATA.noise_settings/density_function/noise 均为空对象（逆向确认），
  // overworld 从未配数据。SFE 作为首个 gen2 噪声世界，在此自给自足：
  //  - min_y=0 / height=256 / sea_level=62，与 util.js 常量一致
  //  - aquifers/矿脉/结构引用全关（成本砍半），carver 无数据自然关闭
  //  - final_density = 垂直剖面 × 地形信号 + 深部回填；地形信号 = 大陆噪声 + 3D 丘陵噪声
  const noiseSettings = () => ({
    sea_level: 62,
    default_block: { Name: "minecraft:stone" },
    default_fluid: { Name: "minecraft:water" },
    aquifers_enabled: false,
    ore_veins_enabled: false,
    legacy_random_source: false,
    noise: { min_y: 0, height: 256 },
    noise_router: {
      temperature: { type: "minecraft:noise", noise: "minecraft:sfe_temp", xz_scale: 1, y_scale: 0 },
      vegetation: { type: "minecraft:noise", noise: "minecraft:sfe_veg", xz_scale: 1, y_scale: 0 },
      continents: { type: "minecraft:noise", noise: "minecraft:sfe_cont", xz_scale: 1, y_scale: 0 },
      erosion: { type: "minecraft:noise", noise: "minecraft:sfe_ero", xz_scale: 1, y_scale: 0 },
      depth: 0,
      ridges: { type: "minecraft:noise", noise: "minecraft:sfe_rid", xz_scale: 1, y_scale: 0 },
      preliminary_surface_level: {
        type: "minecraft:add",
        argument1: 70,
        argument2: { type: "minecraft:mul", argument1: { type: "minecraft:noise", noise: "minecraft:sfe_cont", xz_scale: 1, y_scale: 0 }, argument2: 42 },
      },
      final_density: {
        // surface ≈ y = 46.5 × signal；signal = 1.5 + 0.9·cont(2D) + 0.5·hills(3D，含洞窟/悬突)
        type: "minecraft:add",
        argument1: {
          type: "minecraft:add",
          argument1: {
            type: "minecraft:add",
            argument1: 1.5,
            argument2: { type: "minecraft:mul", argument1: { type: "minecraft:noise", noise: "minecraft:sfe_cont", xz_scale: 1, y_scale: 0 }, argument2: 0.9 },
          },
          argument2: { type: "minecraft:mul", argument1: { type: "minecraft:noise", noise: "minecraft:sfe_hills", xz_scale: 1.15, y_scale: 0.6 }, argument2: 0.5 },
        },
        argument2: { type: "minecraft:y_clamped_gradient", from_y: 0, from_value: 0, to_y: 256, to_value: -5.5 },
      },
    },
    surface_rule: {
      type: "minecraft:sequence",
      sequence: [
        { type: "minecraft:condition", if_true: { type: "minecraft:vertical_gradient", random_name: "minecraft:sfe_bedrock", true_at_and_below: { above_bottom: 0 }, false_at_and_above: { absolute: 5 } }, then_run: { type: "minecraft:block", result_state: { Name: "minecraft:bedrock" } } },
        { type: "minecraft:condition", if_true: { type: "minecraft:biome", biome_is: ["minecraft:desert", "minecraft:beach"] }, then_run: { type: "minecraft:sequence", sequence: [
          { type: "minecraft:condition", if_true: { type: "minecraft:stone_depth", surface_type: "floor", offset: 0, add_surface_depth: false, secondary_depth_range: 0 }, then_run: { type: "minecraft:block", result_state: { Name: "minecraft:sand" } } },
          { type: "minecraft:condition", if_true: { type: "minecraft:stone_depth", surface_type: "floor", offset: 1, add_surface_depth: true, secondary_depth_range: 0 }, then_run: { type: "minecraft:block", result_state: { Name: "minecraft:sand" } } },
          { type: "minecraft:block", result_state: { Name: "minecraft:sandstone" } },
        ] } },
        { type: "minecraft:condition", if_true: { type: "minecraft:biome", biome_is: ["minecraft:ocean", "minecraft:river", "minecraft:frozen_ocean", "minecraft:deep_ocean"] }, then_run: { type: "minecraft:sequence", sequence: [
          { type: "minecraft:condition", if_true: { type: "minecraft:stone_depth", surface_type: "floor", offset: 0, add_surface_depth: false, secondary_depth_range: 0 }, then_run: { type: "minecraft:block", result_state: { Name: "minecraft:gravel" } } },
          { type: "minecraft:block", result_state: { Name: "minecraft:stone" } },
        ] } },
        { type: "minecraft:condition", if_true: { type: "minecraft:biome", biome_is: ["minecraft:snowy_plains", "minecraft:snowy_taiga", "minecraft:snowy_slopes", "minecraft:frozen_peaks"] }, then_run: { type: "minecraft:sequence", sequence: [
          { type: "minecraft:condition", if_true: { type: "minecraft:stone_depth", surface_type: "floor", offset: 0, add_surface_depth: false, secondary_depth_range: 0 }, then_run: { type: "minecraft:block", result_state: { Name: "minecraft:snow_block" } } },
          { type: "minecraft:condition", if_true: { type: "minecraft:stone_depth", surface_type: "floor", offset: 1, add_surface_depth: true, secondary_depth_range: 0 }, then_run: { type: "minecraft:block", result_state: { Name: "minecraft:dirt" } } },
          { type: "minecraft:block", result_state: { Name: "minecraft:stone" } },
        ] } },
        { type: "minecraft:sequence", sequence: [
          { type: "minecraft:condition", if_true: { type: "minecraft:stone_depth", surface_type: "floor", offset: 0, add_surface_depth: false, secondary_depth_range: 0 }, then_run: { type: "minecraft:block", result_state: { Name: "minecraft:grass_block" } } },
          { type: "minecraft:condition", if_true: { type: "minecraft:stone_depth", surface_type: "floor", offset: 3, add_surface_depth: true, secondary_depth_range: 0 }, then_run: { type: "minecraft:block", result_state: { Name: "minecraft:dirt" } } },
        ] },
      ],
    },
  });
  const noiseParams = () => ({
    sfe_temp: { firstOctave: -4, amplitudes: [1, 1, 1, 1] },
    sfe_veg:  { firstOctave: -4, amplitudes: [1, 1, 1, 1] },
    sfe_cont: { firstOctave: -5, amplitudes: [1, 1, 1, 1] },
    sfe_ero:  { firstOctave: -5, amplitudes: [1, 1, 1] },
    sfe_rid:  { firstOctave: -5, amplitudes: [1, 1, 1] },
    sfe_hills: { firstOctave: -4, amplitudes: [1, 1, 0.5] },
    // Generator 构造期硬依赖的 vanilla 噪声（地表细节/badlands/冰山；对 SFE 只影响次要材质）
    surface: { firstOctave: -6, amplitudes: [1, 1, 1, 1, 1, 1] },
    surface_secondary: { firstOctave: -6, amplitudes: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4] },
    clay_bands_offset: { firstOctave: 0, amplitudes: [1] },
    badlands_surface: { firstOctave: -5, amplitudes: [1, 1, 1, 1, 1] },
    badlands_pillar: { firstOctave: -11, amplitudes: [1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
    badlands_pillar_roof: { firstOctave: -9, amplitudes: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    iceberg_surface: { firstOctave: -8, amplitudes: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    iceberg_pillar: { firstOctave: -10, amplitudes: [1, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6] },
    iceberg_pillar_roof: { firstOctave: -8, amplitudes: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  });

  // ---------------------------------------------------------------- WG_DATA 注入（幂等；worker importScripts 时即生效）
  const injectWorldgen = () => {
    const D = self.WG_DATA;
    if (!D || D.noise_settings.sfe) return false;
    // 空的 configured_carver（[]，无任何雕蚀器数据）会让 Generator.generate 的 carver 分支
    // 在 cfgOf 处崩溃（worldgen.js:2753 读 undefined.config）——置 null 走"无雕蚀器"路径。
    // 仅当确实为空时才置（不影响任何已配数据的世界）。
    if (D.configured_carver && !Object.keys(D.configured_carver).length) D.configured_carver = null;
    D.noise_settings.sfe = noiseSettings();
    Object.assign(D.noise, noiseParams());
    Object.assign(D.density_function, {
      "sfe:vprof": { type: "minecraft:y_clamped_gradient", from_y: 0, from_value: 1.4, to_y: 200, to_value: -1.6 },
      "sfe:floor": { type: "minecraft:y_clamped_gradient", from_y: 0, from_value: 1.2, to_y: 56, to_value: 0 },
    });
    return true;
  };
  injectWorldgen();

  return { TUNE, MATERIAL_VALUE, GOODS_VALUE, LOOT, POI, EXTRACT, LAIR, POI_BUILD, hash2, mulberry32, strHash, injectWorldgen };
})();
self.SFE_MAP = SFE_MAP;
//# sourceURL=js/sfe_mapdata.js
