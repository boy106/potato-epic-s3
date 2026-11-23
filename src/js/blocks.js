"use strict";
function T(e) {
  const o = ASSETS.tiles[e];
  return void 0 === o ? (console.warn("missing tile", e), ASSETS.tiles.white) : o;
}
const BLOCKS = new Array(MAX_BLOCKS).fill(null),
  ITEMS = [],
  ITEM_KEY = {},
  BID = {},
  SH_CUBE = 0,
  SH_CROSS = 1,
  SH_LIQUID = 2,
  SH_BOXES = 3,
  SH_TORCH = 4,
  SH_NONE = 5,
  SH_CROP = 6,
  SH_CACTUS = 7,
  SH_MODEL = 8,
  SH_FIRE = 9;
function defBlock(e, o, s, t = {}) {
  const a = t.shape ?? 0,
    n = {
      id: e,
      key: o,
      cn: s,
      shape: a,
      render: t.render || (0 === a ? "opaque" : "cutout"),
      solid: t.solid ?? (0 === a || 3 === a || 7 === a || 8 === a),
      model: t.model || null,
      bed: !!t.bed,
      opaque: !1,
      light: t.light || 0,
      hardness: t.hardness ?? 1,
      tool: t.tool || null,
      level: t.level || 0,
      needsTool: t.needsTool ?? !1,
      sound: t.sound || "stone",
      tint: t.tint || null,
      gravity: !!t.gravity,
      replaceable: !!t.replaceable,
      cullSame: !!t.cullSame,
      drops: t.drops,
      boxes: t.boxes || null,
      climbable: !!t.climbable,
      facing: !!t.facing,
      axis: !!t.axis,
      beRender: !!t.beRender,
      chestLike: !!t.chestLike,
      be: t.be || null,
      needsSupport: !!t.needsSupport,
      onUse: t.onUse || null,
      flammable: !!t.flammable,
      texFn: t.texFn || null,
      fuel: t.fuel || 0,
      noItem: !!t.noItem,
      icon: t.icon || null,
      damage: t.damage || 0,
      slip: t.slip || 0.6,
      tex: [0, 0, 0, 0, 0, 0],
      overlay: [0, 0, 0, 0, 0, 0],
      particle: 0,
      slab: !!t.slab,
      stairs: !!t.stairs,
      door: !!t.door,
      trapdoor: !!t.trapdoor,
      ladder: !!t.ladder,
      gate: !!t.gate,
      collide: t.collide || null,
      slow: t.slow || 0,
      fence: t.fence || null,
      xp: t.xp || null,
      portal: !!t.portal,
    };
  ((n.opaque = t.opaque ?? (0 === a && "opaque" === n.render)),
    (n.opacity = t.opacity ?? (n.opaque ? 15 : 0)));
  const l = t.tex;
  if (t.texFaces) n.tex = t.texFaces.map(T);
  else if ("string" == typeof l) n.tex.fill(T(l));
  else if (l) {
    const e = l.side ? T(l.side) : 0;
    ((n.tex = [e, e, T(l.bottom || l.top || l.side), T(l.top || l.side), e, e]),
      l.front && (n.texFront = T(l.front)),
      l.frontOn && (n.texFrontOn = T(l.frontOn)));
  }
  return (
    t.overlay && (n.overlay = [T(t.overlay), T(t.overlay), 0, 0, T(t.overlay), T(t.overlay)]),
    (n.particle = t.particle ? T(t.particle) : n.tex[0]),
    t.particle && (n.particleOwn = !0),
    n.texFront &&
      !t.texFn &&
      (n.texFn = (e, o) =>
        e === (7 & o) ? (8 & o && n.texFrontOn ? n.texFrontOn : n.texFront) : n.tex[e]),
    (BLOCKS[e] = n),
    (BID[o] = e),
    n.noItem ||
      ((ITEMS[e] = {
        id: e,
        key: o,
        cn: s,
        block: e,
        stack: t.stack || 64,
        fuel: n.fuel,
        flat: t.flatIcon || null,
      }),
      (ITEM_KEY[o] = e)),
    n
  );
}
const drop =
    (e, o = 1) =>
    () => [[e, o]],
  nothing = () => [];
function logTex(e, o) {
  const s = 3 & o,
    t = this;
  return 0 === s
    ? t.tex[e]
    : 1 === s
      ? 0 === e || 1 === e
        ? t.tex[3]
        : t.tex[0]
      : 4 === e || 5 === e
        ? t.tex[3]
        : t.tex[0];
}
const SLAB_BOXES = [[[0, 0, 0, 16, 8, 16]], [[0, 8, 0, 16, 16, 16]], [[0, 0, 0, 16, 16, 16]]];
function stairBoxes(e) {
  const o = 4 & e,
    s = o ? 0 : 8,
    t = o ? 8 : 16;
  return [
    o ? [0, 8, 0, 16, 16, 16] : [0, 0, 0, 16, 8, 16],
    [
      [8, s, 0, 16, t, 16],
      [0, s, 0, 8, t, 16],
      [0, s, 8, 16, t, 16],
      [0, s, 0, 16, t, 8],
    ][3 & e],
  ];
}
const _modelBoxCache = new Map();
function modelBoxes(e, o) {
  const s = 256 * e.id + o;
  let t = _modelBoxCache.get(s);
  if (t) return t;
  if ("undefined" == typeof VM || !VM.ready) return null;
  const a = vanillaState(e, o, null),
    n = [1, 1, 1],
    l = [0, 0, 0];
  for (const e of VM.select(a.key, a.p, 0))
    for (const o of e)
      for (const e of o.p)
        for (let o = 0; o < 3; o++) ((n[o] = Math.min(n[o], e[o])), (l[o] = Math.max(l[o], e[o])));
  return (
    (t =
      l[0] > n[0]
        ? [[n[0], n[1], n[2], l[0], l[1], l[2]].map((e) => Math.round(16 * e))]
        : [[0, 0, 0, 16, 16, 16]]),
    _modelBoxCache.set(s, t),
    t
  );
}
function doorBoxes(e) {
  const o = modelBoxes(BLOCKS[69], -9 & e);
  if (o) return o;
  let s = 3 & e;
  return (
    4 & e && (s = [2, 3, 1, 0][s]),
    [
      [
        [0, 0, 0, 3, 16, 16],
        [13, 0, 0, 16, 16, 16],
        [0, 0, 0, 16, 16, 3],
        [0, 0, 13, 16, 16, 16],
      ][s],
    ]
  );
}
function ladderBoxes(e) {
  return [
    {
      0: [0, 0, 0, 2, 16, 16],
      1: [14, 0, 0, 16, 16, 16],
      4: [0, 0, 0, 16, 16, 2],
      5: [0, 0, 14, 16, 16, 16],
    }[e] || [0, 0, 0, 16, 16, 2],
  ];
}
(defBlock(0, "air", "空气", {
  shape: 5,
  solid: !1,
  opaque: !1,
  noItem: !0,
  replaceable: !0,
  hardness: 0,
}),
  defBlock(1, "stone", "石头", {
    tex: "stone",
    hardness: 1.5,
    tool: "pickaxe",
    needsTool: !0,
    drops: drop("cobblestone"),
  }),
  defBlock(2, "grass_block", "草方块", {
    tex: { top: "grass_block_top", bottom: "dirt", side: "grass_side_base" },
    overlay: "grass_block_side_overlay",
    tint: "grass",
    hardness: 0.6,
    tool: "shovel",
    sound: "grass",
    drops: drop("dirt"),
    particle: "dirt",
    texFn(e, o) {
      return 1 & o && 2 !== e && 3 !== e ? T("grass_block_snow") : this.tex[e];
    },
  }),
  defBlock(3, "dirt", "泥土", { tex: "dirt", hardness: 0.5, tool: "shovel", sound: "gravel" }),
  defBlock(4, "cobblestone", "圆石", {
    tex: "cobblestone",
    hardness: 2,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(5, "oak_planks", "橡木木板", {
    tex: "oak_planks",
    hardness: 2,
    tool: "axe",
    sound: "wood",
    fuel: 300,
    flammable: !0,
  }),
  defBlock(6, "bedrock", "基岩", { tex: "bedrock", hardness: -1 }),
  defBlock(7, "water", "水", {
    shape: 2,
    tex: "water_still",
    render: "translucent",
    solid: !1,
    opacity: 1,
    hardness: -1,
    replaceable: !0,
    noItem: !0,
    tint: "water",
    cullSame: !0,
  }),
  defBlock(8, "lava", "熔岩", {
    shape: 2,
    tex: "lava_still",
    render: "opaque",
    solid: !1,
    opacity: 15,
    light: 15,
    hardness: -1,
    replaceable: !0,
    noItem: !0,
    cullSame: !0,
  }),
  defBlock(9, "sand", "沙子", {
    tex: "sand",
    hardness: 0.5,
    tool: "shovel",
    sound: "sand",
    gravity: !0,
  }),
  defBlock(10, "gravel", "沙砾", {
    tex: "gravel",
    hardness: 0.6,
    tool: "shovel",
    sound: "gravel",
    gravity: !0,
    drops: (e, o) => [[o() < 0.1 ? "flint" : "gravel", 1]],
  }),
  defBlock(11, "gold_ore", "金矿石", {
    tex: "gold_ore",
    hardness: 3,
    tool: "pickaxe",
    level: 2,
    needsTool: !0,
    drops: drop("raw_gold"),
  }),
  defBlock(12, "iron_ore", "铁矿石", {
    tex: "iron_ore",
    hardness: 3,
    tool: "pickaxe",
    level: 1,
    needsTool: !0,
    drops: drop("raw_iron"),
  }),
  defBlock(13, "coal_ore", "煤矿石", {
    tex: "coal_ore",
    hardness: 3,
    tool: "pickaxe",
    needsTool: !0,
    drops: drop("coal"),
    xp: 1,
  }),
  defBlock(14, "oak_log", "橡木原木", {
    tex: { top: "oak_log_top", side: "oak_log" },
    hardness: 2,
    tool: "axe",
    sound: "wood",
    axis: !0,
    texFn: logTex,
    fuel: 300,
    flammable: !0,
  }),
  defBlock(15, "oak_leaves", "橡树树叶", {
    tex: "oak_leaves",
    render: "cutout",
    opaque: !1,
    opacity: 1,
    hardness: 0.2,
    tool: "hoe",
    sound: "grass",
    tint: "foliage",
    drops: (e, o) => {
      const s = [];
      return (
        o() < 0.05 && s.push(["oak_sapling", 1]),
        o() < 0.02 && s.push(["stick", 1 + ((2 * o()) | 0)]),
        o() < 0.02 && s.push(["apple", 1]),
        s
      );
    },
  }),
  defBlock(16, "glass", "玻璃", {
    tex: "glass",
    render: "cutout",
    opaque: !1,
    hardness: 0.3,
    sound: "glass",
    drops: nothing,
    cullSame: !0,
  }),
  defBlock(17, "sandstone", "砂岩", {
    tex: { top: "sandstone_top", bottom: "sandstone_bottom", side: "sandstone" },
    hardness: 0.8,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(18, "diamond_ore", "钻石矿石", {
    tex: "diamond_ore",
    hardness: 3,
    tool: "pickaxe",
    level: 2,
    needsTool: !0,
    drops: drop("diamond"),
  }),
  defBlock(19, "crafting_table", "工作台", {
    tex: {
      top: "crafting_table_top",
      bottom: "oak_planks",
      side: "crafting_table_side",
      front: "crafting_table_front",
    },
    facing: !0,
    hardness: 2.5,
    tool: "axe",
    sound: "wood",
    fuel: 300,
    onUse: "crafting",
  }),
  defBlock(20, "furnace", "熔炉", {
    tex: {
      top: "furnace_top",
      side: "furnace_side",
      front: "furnace_front",
      frontOn: "furnace_front_on",
    },
    facing: !0,
    hardness: 3.5,
    tool: "pickaxe",
    needsTool: !0,
    onUse: "furnace",
  }),
  defBlock(21, "torch", "火把", {
    shape: 4,
    tex: "torch",
    solid: !1,
    light: 14,
    hardness: 0,
    sound: "wood",
    needsSupport: !0,
    flatIcon: "torch",
  }),
  defBlock(22, "bricks", "砖块", { tex: "bricks", hardness: 2, tool: "pickaxe", needsTool: !0 }),
  defBlock(23, "stone_bricks", "石砖", {
    tex: "stone_bricks",
    hardness: 1.5,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(24, "mossy_cobblestone", "苔石", {
    tex: "mossy_cobblestone",
    hardness: 2,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(25, "bookshelf", "书架", {
    tex: { top: "oak_planks", side: "bookshelf" },
    hardness: 1.5,
    tool: "axe",
    sound: "wood",
    drops: drop("book", 3),
    fuel: 300,
  }),
  defBlock(26, "tnt", "TNT", {
    tex: { top: "tnt_top", bottom: "tnt_bottom", side: "tnt_side" },
    hardness: 0,
    sound: "grass",
  }),
  defBlock(27, "glowstone", "荧石", {
    tex: "glowstone",
    light: 15,
    hardness: 0.3,
    sound: "glass",
    drops: (e, o) => [["glowstone_dust", 2 + ((3 * o()) | 0)]],
  }),
  defBlock(28, "obsidian", "黑曜石", {
    tex: "obsidian",
    hardness: 50,
    tool: "pickaxe",
    level: 3,
    needsTool: !0,
  }),
  defBlock(29, "iron_block", "铁块", {
    tex: "iron_block",
    hardness: 5,
    tool: "pickaxe",
    level: 1,
    needsTool: !0,
    sound: "metal",
  }),
  defBlock(30, "gold_block", "金块", {
    tex: "gold_block",
    hardness: 3,
    tool: "pickaxe",
    level: 2,
    needsTool: !0,
    sound: "metal",
  }),
  defBlock(31, "diamond_block", "钻石块", {
    tex: "diamond_block",
    hardness: 5,
    tool: "pickaxe",
    level: 2,
    needsTool: !0,
    sound: "metal",
  }),
  defBlock(32, "coal_block", "煤炭块", {
    tex: "coal_block",
    hardness: 5,
    tool: "pickaxe",
    needsTool: !0,
    fuel: 16e3,
  }),
  defBlock(33, "snow_block", "雪块", {
    tex: "snow",
    hardness: 0.2,
    tool: "shovel",
    needsTool: !0,
    sound: "snow",
    drops: drop("snowball", 4),
  }),
  defBlock(34, "snow", "雪", {
    shape: 3,
    boxes: (e) => [[0, 0, 0, 16, 2 * (1 + (7 & e)), 16]],
    tex: "snow",
    render: "opaque",
    solid: !1,
    hardness: 0.1,
    tool: "shovel",
    needsTool: !0,
    sound: "snow",
    replaceable: !0,
    needsSupport: !0,
    drops: (e) => [["snowball", 1 + (7 & e)]],
  }),
  defBlock(35, "ice", "冰", {
    tex: "ice",
    render: "translucent",
    opaque: !1,
    opacity: 1,
    hardness: 0.5,
    tool: "pickaxe",
    sound: "glass",
    drops: nothing,
    cullSame: !0,
    slip: 0.98,
  }),
  defBlock(36, "clay", "黏土块", {
    tex: "clay",
    hardness: 0.6,
    tool: "shovel",
    sound: "gravel",
    drops: drop("clay_ball", 4),
  }),
  defBlock(37, "cactus", "仙人掌", {
    shape: 7,
    tex: { top: "cactus_top", bottom: "cactus_bottom", side: "cactus_side" },
    render: "cutout",
    hardness: 0.4,
    sound: "wool",
    needsSupport: !0,
    damage: 1,
  }),
  defBlock(38, "sugar_cane", "甘蔗", {
    shape: 1,
    tex: "sugar_cane",
    tint: "grass",
    solid: !1,
    hardness: 0,
    sound: "grass",
    needsSupport: !0,
    drops: drop("sugar_cane"),
    noItem: !0,
  }),
  defBlock(39, "short_grass", "草", {
    shape: 1,
    tex: "short_grass",
    solid: !1,
    hardness: 0,
    sound: "grass",
    tint: "grass",
    replaceable: !0,
    needsSupport: !0,
    drops: (e, o) => (o() < 0.125 ? [["wheat_seeds", 1]] : []),
    flatIcon: "short_grass",
  }),
  defBlock(40, "fern", "蕨", {
    shape: 1,
    tex: "fern",
    solid: !1,
    hardness: 0,
    sound: "grass",
    tint: "grass",
    replaceable: !0,
    needsSupport: !0,
    drops: (e, o) => (o() < 0.125 ? [["wheat_seeds", 1]] : []),
    flatIcon: "fern",
  }));
const FLOWERS = [
    ["dandelion", "蒲公英"],
    ["poppy", "虞美人"],
    ["cornflower", "矢车菊"],
    ["oxeye_daisy", "滨菊"],
    ["azure_bluet", "蓝花美耳草"],
    ["allium", "绒球葱"],
    ["blue_orchid", "兰花"],
    ["red_tulip", "红色郁金香"],
    ["lily_of_the_valley", "铃兰"],
  ],
  FLOWER_IDS = [41, 42, 43, 44, 98, 99, 100, 101, 102];
function chestType(e) {
  return 16 & e ? 1 : 32 & e ? 2 : 0;
}
function chestSeam(e) {
  const o = chestType(e);
  if (!o) return null;
  const s = { 5: [-1, 0], 4: [1, 0], 1: [0, 1], 0: [0, -1] }[7 & e] || [-1, 0];
  return 1 === o ? s : [-s[0], -s[1]];
}
function chestBoxes(e) {
  const o = [1, 0, 1, 15, 14, 15],
    s = chestSeam(e);
  return (
    s &&
      (s[0] < 0 && (o[0] = 0),
      s[0] > 0 && (o[3] = 16),
      s[1] < 0 && (o[2] = 0),
      s[1] > 0 && (o[5] = 16)),
    [o]
  );
}
(FLOWERS.forEach(([e, o], s) =>
  defBlock(FLOWER_IDS[s], e, o, {
    shape: 1,
    tex: e,
    solid: !1,
    hardness: 0,
    sound: "grass",
    needsSupport: !0,
    flatIcon: e,
  }),
),
  defBlock(45, "dead_bush", "枯死的灌木", {
    shape: 1,
    tex: "dead_bush",
    solid: !1,
    hardness: 0,
    sound: "grass",
    replaceable: !0,
    needsSupport: !0,
    drops: (e, o) => [["stick", (3 * o()) | 0]],
    flatIcon: "dead_bush",
  }),
  defBlock(46, "birch_log", "白桦原木", {
    tex: { top: "birch_log_top", side: "birch_log" },
    hardness: 2,
    tool: "axe",
    sound: "wood",
    axis: !0,
    texFn: logTex,
    fuel: 300,
  }),
  defBlock(47, "birch_leaves", "白桦树叶", {
    tex: "birch_leaves",
    render: "cutout",
    opaque: !1,
    opacity: 1,
    hardness: 0.2,
    tool: "hoe",
    sound: "grass",
    tint: "birch",
    drops: (e, o) => {
      const s = [];
      return (o() < 0.05 && s.push(["birch_sapling", 1]), o() < 0.02 && s.push(["stick", 1]), s);
    },
  }),
  defBlock(48, "birch_planks", "白桦木板", {
    tex: "birch_planks",
    hardness: 2,
    tool: "axe",
    sound: "wood",
    fuel: 300,
  }),
  defBlock(49, "spruce_log", "云杉原木", {
    tex: { top: "spruce_log_top", side: "spruce_log" },
    hardness: 2,
    tool: "axe",
    sound: "wood",
    axis: !0,
    texFn: logTex,
    fuel: 300,
  }),
  defBlock(50, "spruce_leaves", "云杉树叶", {
    tex: "spruce_leaves",
    render: "cutout",
    opaque: !1,
    opacity: 1,
    hardness: 0.2,
    tool: "hoe",
    sound: "grass",
    tint: "spruce",
    drops: (e, o) => {
      const s = [];
      return (o() < 0.05 && s.push(["spruce_sapling", 1]), o() < 0.02 && s.push(["stick", 1]), s);
    },
  }),
  defBlock(51, "spruce_planks", "云杉木板", {
    tex: "spruce_planks",
    hardness: 2,
    tool: "axe",
    sound: "wood",
    fuel: 300,
  }),
  defBlock(52, "chest", "箱子", {
    shape: 3,
    boxes: chestBoxes,
    beRender: !0,
    chestLike: !0,
    tex: { top: "chest_top", side: "chest_side", front: "chest_front" },
    render: "opaque",
    facing: !0,
    hardness: 2.5,
    tool: "axe",
    sound: "wood",
    onUse: "chest",
    fuel: 300,
  }),
  defBlock(53, "pumpkin", "南瓜", {
    tex: { top: "pumpkin_top", side: "pumpkin_side" },
    hardness: 1,
    tool: "axe",
    sound: "wood",
  }),
  defBlock(54, "jack_o_lantern", "南瓜灯", {
    tex: { top: "pumpkin_top", side: "pumpkin_side", front: "jack_o_lantern" },
    facing: !0,
    light: 15,
    hardness: 1,
    tool: "axe",
    sound: "wood",
  }),
  defBlock(55, "melon", "西瓜", {
    tex: { top: "melon_top", side: "melon_side" },
    hardness: 1,
    tool: "axe",
    sound: "wood",
    drops: (e, o) => [["melon_slice", 3 + ((5 * o()) | 0)]],
  }),
  defBlock(56, "smooth_stone", "平滑石头", {
    tex: "smooth_stone",
    hardness: 2,
    tool: "pickaxe",
    needsTool: !0,
  }));
const slabDrop = (e) => (o) => [[e, 2 == (3 & o) ? 2 : 1]];
(defBlock(57, "smooth_stone_slab", "平滑石台阶", {
  shape: 3,
  boxes: (e) => SLAB_BOXES[3 & e],
  tex: { top: "smooth_stone", side: "smooth_stone_slab_side" },
  render: "opaque",
  hardness: 2,
  tool: "pickaxe",
  needsTool: !0,
  slab: !0,
  drops: slabDrop("smooth_stone_slab"),
}),
  defBlock(58, "oak_slab", "橡木台阶", {
    shape: 3,
    boxes: (e) => SLAB_BOXES[3 & e],
    tex: "oak_planks",
    render: "opaque",
    hardness: 2,
    tool: "axe",
    sound: "wood",
    slab: !0,
    fuel: 150,
    drops: slabDrop("oak_slab"),
  }),
  defBlock(59, "cobblestone_slab", "圆石台阶", {
    shape: 3,
    boxes: (e) => SLAB_BOXES[3 & e],
    tex: "cobblestone",
    render: "opaque",
    hardness: 2,
    tool: "pickaxe",
    needsTool: !0,
    slab: !0,
    drops: slabDrop("cobblestone_slab"),
  }),
  defBlock(60, "oak_stairs", "橡木楼梯", {
    shape: 3,
    boxes: stairBoxes,
    tex: "oak_planks",
    render: "opaque",
    hardness: 2,
    tool: "axe",
    sound: "wood",
    stairs: !0,
    fuel: 300,
  }),
  defBlock(61, "cobblestone_stairs", "圆石楼梯", {
    shape: 3,
    boxes: stairBoxes,
    tex: "cobblestone",
    render: "opaque",
    hardness: 2,
    tool: "pickaxe",
    needsTool: !0,
    stairs: !0,
  }),
  defBlock(62, "stone_brick_stairs", "石砖楼梯", {
    shape: 3,
    boxes: stairBoxes,
    tex: "stone_bricks",
    render: "opaque",
    hardness: 1.5,
    tool: "pickaxe",
    needsTool: !0,
    stairs: !0,
  }),
  defBlock(63, "farmland", "耕地", {
    shape: 3,
    boxes: () => [[0, 0, 0, 16, 15, 16]],
    tex: { top: "farmland", side: "dirt" },
    render: "opaque",
    hardness: 0.6,
    tool: "shovel",
    sound: "gravel",
    drops: drop("dirt"),
    texFn(e, o) {
      return 3 === e ? T(o ? "farmland_moist" : "farmland") : this.tex[e];
    },
  }));
const WHEAT_TEX = [0, 1, 2, 3, 4, 5, 6, 7].map((e) => "wheat_stage" + e);
(defBlock(64, "wheat", "小麦", {
  shape: 6,
  tex: "wheat_stage0",
  solid: !1,
  hardness: 0,
  sound: "grass",
  needsSupport: !0,
  noItem: !0,
  texFn: (e, o) => T(WHEAT_TEX[7 & o]),
  drops: (e, o, s) =>
    (7 & e) >= 7
      ? [
          ["wheat", 1],
          ["wheat_seeds", cropBonusCount(o, s)],
        ]
      : [["wheat_seeds", 1]],
}),
  defBlock(65, "oak_sapling", "橡树树苗", {
    shape: 1,
    tex: "oak_sapling",
    solid: !1,
    hardness: 0,
    sound: "grass",
    needsSupport: !0,
    flatIcon: "oak_sapling",
    fuel: 100,
  }),
  defBlock(66, "birch_sapling", "白桦树苗", {
    shape: 1,
    tex: "birch_sapling",
    solid: !1,
    hardness: 0,
    sound: "grass",
    needsSupport: !0,
    flatIcon: "birch_sapling",
    fuel: 100,
  }),
  defBlock(67, "spruce_sapling", "云杉树苗", {
    shape: 1,
    tex: "spruce_sapling",
    solid: !1,
    hardness: 0,
    sound: "grass",
    needsSupport: !0,
    flatIcon: "spruce_sapling",
    fuel: 100,
  }),
  defBlock(68, "ladder", "梯子", {
    shape: 3,
    boxes: ladderBoxes,
    tex: "ladder",
    render: "cutout",
    hardness: 0.4,
    tool: "axe",
    sound: "wood",
    climbable: !0,
    flatIcon: "ladder",
    fuel: 300,
    ladder: !0,
  }),
  defBlock(69, "oak_door", "橡木门", {
    shape: 3,
    boxes: doorBoxes,
    tex: "oak_door_bottom",
    render: "cutout",
    hardness: 3,
    tool: "axe",
    sound: "wood",
    noItem: !0,
    door: !0,
    texFn: (e, o) => T(8 & o ? "oak_door_top" : "oak_door_bottom"),
    drops: drop("oak_door"),
  }),
  defBlock(70, "red_mushroom", "红色蘑菇", {
    shape: 1,
    tex: "red_mushroom",
    solid: !1,
    hardness: 0,
    sound: "grass",
    needsSupport: !0,
    flatIcon: "red_mushroom",
  }),
  defBlock(71, "brown_mushroom", "棕色蘑菇", {
    shape: 1,
    tex: "brown_mushroom",
    solid: !1,
    hardness: 0,
    sound: "grass",
    needsSupport: !0,
    light: 1,
    flatIcon: "brown_mushroom",
  }),
  defBlock(72, "andesite", "安山岩", {
    tex: "andesite",
    hardness: 1.5,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(73, "diorite", "闪长岩", {
    tex: "diorite",
    hardness: 1.5,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(74, "granite", "花岗岩", {
    tex: "granite",
    hardness: 1.5,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(75, "deepslate", "深板岩", {
    tex: { top: "deepslate_top", side: "deepslate" },
    hardness: 3,
    tool: "pickaxe",
    needsTool: !0,
    sound: "stone",
  }),
  defBlock(76, "deepslate_coal_ore", "深层煤矿石", {
    tex: "deepslate_coal_ore",
    hardness: 4.5,
    tool: "pickaxe",
    needsTool: !0,
    drops: drop("coal"),
  }),
  defBlock(77, "deepslate_iron_ore", "深层铁矿石", {
    tex: "deepslate_iron_ore",
    hardness: 4.5,
    tool: "pickaxe",
    level: 1,
    needsTool: !0,
    drops: drop("raw_iron"),
  }),
  defBlock(78, "deepslate_gold_ore", "深层金矿石", {
    tex: "deepslate_gold_ore",
    hardness: 4.5,
    tool: "pickaxe",
    level: 2,
    needsTool: !0,
    drops: drop("raw_gold"),
  }),
  defBlock(79, "deepslate_diamond_ore", "深层钻石矿石", {
    tex: "deepslate_diamond_ore",
    hardness: 4.5,
    tool: "pickaxe",
    level: 2,
    needsTool: !0,
    drops: drop("diamond"),
  }),
  defBlock(80, "redstone_ore", "红石矿石", {
    tex: "redstone_ore",
    hardness: 3,
    tool: "pickaxe",
    level: 2,
    needsTool: !0,
    drops: (e, o) => [["redstone", 4 + ((2 * o()) | 0)]],
  }),
  defBlock(81, "lapis_ore", "青金石矿石", {
    tex: "lapis_ore",
    hardness: 3,
    tool: "pickaxe",
    level: 1,
    needsTool: !0,
    drops: (e, o) => [["lapis_lazuli", 4 + ((5 * o()) | 0)]],
  }),
  defBlock(82, "emerald_ore", "绿宝石矿石", {
    tex: "emerald_ore",
    hardness: 3,
    tool: "pickaxe",
    level: 2,
    needsTool: !0,
    drops: drop("emerald"),
  }),
  defBlock(83, "terracotta", "陶瓦", {
    tex: "terracotta",
    hardness: 1.25,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(84, "quartz_block", "石英块", {
    tex: { top: "quartz_block_top", side: "quartz_block_side" },
    hardness: 0.8,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(85, "sea_lantern", "海晶灯", {
    tex: "sea_lantern",
    light: 15,
    hardness: 0.3,
    sound: "glass",
  }),
  defBlock(86, "prismarine", "海晶石", {
    tex: "prismarine",
    hardness: 1.5,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(87, "hay_block", "干草块", {
    tex: { top: "hay_block_top", side: "hay_block_side" },
    hardness: 0.5,
    tool: "hoe",
    sound: "grass",
    drops: drop("wheat", 9),
    axis: !0,
    texFn: logTex,
  }),
  defBlock(88, "moss_block", "苔藓块", {
    tex: "moss_block",
    hardness: 0.1,
    tool: "hoe",
    sound: "grass",
  }),
  defBlock(89, "mud_bricks", "泥砖", {
    tex: "mud_bricks",
    hardness: 1.5,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(90, "polished_andesite", "磨制安山岩", {
    tex: "polished_andesite",
    hardness: 1.5,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(91, "polished_diorite", "磨制闪长岩", {
    tex: "polished_diorite",
    hardness: 1.5,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(92, "polished_granite", "磨制花岗岩", {
    tex: "polished_granite",
    hardness: 1.5,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(93, "cracked_stone_bricks", "裂纹石砖", {
    tex: "cracked_stone_bricks",
    hardness: 1.5,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(94, "mossy_stone_bricks", "苔石砖", {
    tex: "mossy_stone_bricks",
    hardness: 1.5,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(95, "bone_block", "骨块", {
    tex: { top: "bone_block_top", side: "bone_block_side" },
    hardness: 2,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(96, "packed_ice", "浮冰", {
    tex: "packed_ice",
    hardness: 0.5,
    tool: "pickaxe",
    sound: "glass",
    slip: 0.98,
    drops: nothing,
  }),
  defBlock(97, "red_sand", "红沙", {
    tex: "red_sand",
    hardness: 0.5,
    tool: "shovel",
    sound: "sand",
    gravity: !0,
  }),
  defBlock(103, "magma_block", "岩浆块", {
    tex: "magma",
    light: 3,
    hardness: 0.5,
    tool: "pickaxe",
    needsTool: !0,
    damage: 1,
  }),
  defBlock(104, "dark_oak_planks", "深色橡木木板", {
    tex: "dark_oak_planks",
    hardness: 2,
    tool: "axe",
    sound: "wood",
    fuel: 300,
  }),
  defBlock(105, "jungle_planks", "丛林木板", {
    tex: "jungle_planks",
    hardness: 2,
    tool: "axe",
    sound: "wood",
    fuel: 300,
  }),
  defBlock(106, "acacia_planks", "金合欢木板", {
    tex: "acacia_planks",
    hardness: 2,
    tool: "axe",
    sound: "wood",
    fuel: 300,
  }),
  defBlock(107, "cherry_planks", "樱花木板", {
    tex: "cherry_planks",
    hardness: 2,
    tool: "axe",
    sound: "wood",
    fuel: 300,
  }),
  defBlock(108, "lapis_block", "青金石块", {
    tex: "lapis_block",
    hardness: 3,
    tool: "pickaxe",
    level: 1,
    needsTool: !0,
  }),
  defBlock(109, "emerald_block", "绿宝石块", {
    tex: "emerald_block",
    hardness: 5,
    tool: "pickaxe",
    level: 2,
    needsTool: !0,
    sound: "metal",
  }),
  defBlock(110, "redstone_block", "红石块", {
    tex: "redstone_block",
    hardness: 5,
    tool: "pickaxe",
    needsTool: !0,
    sound: "metal",
  }),
  defBlock(111, "note_block", "音符盒", {
    tex: "note_block",
    hardness: 0.8,
    tool: "axe",
    sound: "wood",
    onUse: "note",
    fuel: 300,
  }),
  defBlock(112, "oak_trapdoor", "橡木活板门", {
    shape: 3,
    boxes: (e) =>
      modelBoxes(BLOCKS[112], e) ||
      (4 & e
        ? [[0, 0, 13, 16, 16, 16]]
        : 8 & e
          ? [[0, 13, 0, 16, 16, 16]]
          : [[0, 0, 0, 16, 3, 16]]),
    tex: "oak_trapdoor",
    render: "cutout",
    hardness: 3,
    tool: "axe",
    sound: "wood",
    trapdoor: !0,
    fuel: 300,
  }),
  defBlock(113, "stone_brick_slab", "石砖台阶", {
    shape: 3,
    boxes: (e) => SLAB_BOXES[3 & e],
    tex: "stone_bricks",
    render: "opaque",
    hardness: 1.5,
    tool: "pickaxe",
    needsTool: !0,
    slab: !0,
    drops: slabDrop("stone_brick_slab"),
  }),
  defBlock(114, "brick_stairs", "砖楼梯", {
    shape: 3,
    boxes: stairBoxes,
    tex: "bricks",
    render: "opaque",
    hardness: 2,
    tool: "pickaxe",
    needsTool: !0,
    stairs: !0,
  }),
  defBlock(115, "spruce_stairs", "云杉木楼梯", {
    shape: 3,
    boxes: stairBoxes,
    tex: "spruce_planks",
    render: "opaque",
    hardness: 2,
    tool: "axe",
    sound: "wood",
    stairs: !0,
    fuel: 300,
  }),
  defBlock(117, "lit_furnace", "熔炉", {
    tex: { top: "furnace_top", side: "furnace_side", front: "furnace_front_on" },
    facing: !0,
    light: 13,
    hardness: 3.5,
    tool: "pickaxe",
    needsTool: !0,
    onUse: "furnace",
    noItem: !0,
    drops: drop("furnace"),
  }));
const BED_HEAD = [
    {
      from: [0, 3, 0],
      to: [16, 9, 16],
      faces: {
        down: [0, 0, 16, 16, "bed_down"],
        up: [0, 0, 16, 16, "red_bed_head_up"],
        north: [0, 7, 16, 13, "bed_head_north"],
        west: [0, 7, 16, 13, "red_bed_head_west"],
        east: [0, 7, 16, 13, "red_bed_head_east"],
      },
    },
    {
      from: [0, 0, 0],
      to: [3, 3, 3],
      faces: {
        down: [6, 13, 9, 16, "red_bed_head_west"],
        north: [13, 13, 16, 16, "bed_head_north"],
        south: [3, 13, 6, 16, "red_bed_head_west"],
        west: [0, 13, 3, 16, "red_bed_head_west"],
        east: [10, 13, 13, 16, "bed_head_north"],
      },
    },
    {
      from: [13, 0, 0],
      to: [16, 3, 3],
      faces: {
        down: [7, 13, 10, 16, "red_bed_head_east"],
        north: [0, 13, 3, 16, "bed_head_north"],
        south: [10, 13, 13, 16, "red_bed_head_east"],
        west: [3, 13, 6, 16, "bed_head_north"],
        east: [13, 13, 16, 16, "red_bed_head_east"],
      },
    },
  ],
  BED_FOOT = [
    {
      from: [0, 3, 0],
      to: [16, 9, 16],
      faces: {
        down: [0, 0, 16, 16, "bed_down"],
        up: [0, 0, 16, 16, "red_bed_foot_up"],
        south: [0, 7, 16, 13, "red_bed_foot_south"],
        west: [0, 7, 16, 13, "red_bed_foot_west"],
        east: [0, 7, 16, 13, "red_bed_foot_east"],
      },
    },
    {
      from: [0, 0, 13],
      to: [3, 3, 16],
      faces: {
        down: [7, 13, 10, 16, "red_bed_foot_west"],
        north: [10, 13, 13, 16, "red_bed_foot_west"],
        south: [0, 13, 3, 16, "red_bed_foot_south"],
        west: [13, 13, 16, 16, "red_bed_foot_west"],
        east: [3, 13, 6, 16, "red_bed_foot_south"],
      },
    },
    {
      from: [13, 0, 13],
      to: [16, 3, 16],
      faces: {
        down: [6, 13, 9, 16, "red_bed_foot_east"],
        north: [3, 13, 6, 16, "red_bed_foot_east"],
        south: [13, 13, 16, 16, "red_bed_foot_south"],
        west: [10, 13, 13, 16, "red_bed_foot_south"],
        east: [0, 13, 3, 16, "red_bed_foot_east"],
      },
    },
  ];
for (const e of [BED_HEAD, BED_FOOT])
  for (const o of e) for (const e in o.faces) o.faces[e][4] = T(o.faces[e][4]);
function fenceBoxes(e) {
  const o = [[6, 0, 6, 10, 16, 10]];
  return (
    1 & e && o.push([0, 6, 7, 6, 9, 9], [0, 12, 7, 6, 15, 9]),
    2 & e && o.push([10, 6, 7, 16, 9, 9], [10, 12, 7, 16, 15, 9]),
    4 & e && o.push([7, 6, 0, 9, 9, 6], [7, 12, 0, 9, 15, 6]),
    8 & e && o.push([7, 6, 10, 9, 9, 16], [7, 12, 10, 9, 15, 16]),
    o
  );
}
function fenceCollide(e) {
  const o = [[6, 0, 6, 10, 24, 10]];
  return (
    1 & e && o.push([0, 0, 6, 6, 24, 10]),
    2 & e && o.push([10, 0, 6, 16, 24, 10]),
    4 & e && o.push([6, 0, 0, 10, 24, 6]),
    8 & e && o.push([6, 0, 10, 10, 24, 16]),
    o
  );
}
(defBlock(118, "red_bed", "红色的床", {
  shape: 8,
  model: (e) => ({ els: 4 & e ? BED_HEAD : BED_FOOT, rot: 3 & e }),
  boxes: () => [[0, 0, 0, 16, 9, 16]],
  tex: "red_bed_foot_up",
  render: "opaque",
  hardness: 0.2,
  sound: "wool",
  bed: !0,
  stack: 1,
  particle: "red_bed_head_up",
  drops: (e) => (4 & e ? [] : [["red_bed", 1]]),
}),
  defBlock(119, "netherrack", "下界岩", {
    tex: "netherrack",
    hardness: 0.4,
    tool: "pickaxe",
    needsTool: !0,
    sound: "netherrack",
  }),
  defBlock(120, "soul_sand", "灵魂沙", {
    shape: 3,
    boxes: () => [[0, 0, 0, 16, 16, 16]],
    collide: () => [[0, 0, 0, 16, 14, 16]],
    tex: "soul_sand",
    render: "opaque",
    opaque: !0,
    hardness: 0.5,
    tool: "shovel",
    sound: "soul_sand",
    slow: 0.4,
  }),
  defBlock(121, "nether_quartz_ore", "下界石英矿石", {
    tex: "nether_quartz_ore",
    hardness: 3,
    tool: "pickaxe",
    needsTool: !0,
    sound: "netherrack",
    drops: drop("quartz"),
    xp: [2, 5],
  }),
  defBlock(122, "nether_gold_ore", "下界金矿石", {
    tex: "nether_gold_ore",
    hardness: 3,
    tool: "pickaxe",
    needsTool: !0,
    sound: "netherrack",
    drops: (e, o) => [["gold_nugget", 2 + ((5 * o()) | 0)]],
    xp: [0, 1],
  }),
  defBlock(123, "nether_bricks", "下界砖块", {
    tex: "nether_bricks",
    hardness: 2,
    tool: "pickaxe",
    needsTool: !0,
    sound: "nether_bricks",
  }),
  defBlock(124, "nether_brick_fence", "下界砖栅栏", {
    shape: 3,
    boxes: fenceBoxes,
    collide: fenceCollide,
    tex: "nether_bricks",
    render: "opaque",
    hardness: 2,
    tool: "pickaxe",
    needsTool: !0,
    sound: "nether_bricks",
    fence: "nether",
  }),
  defBlock(125, "nether_brick_stairs", "下界砖楼梯", {
    shape: 3,
    boxes: stairBoxes,
    tex: "nether_bricks",
    render: "opaque",
    hardness: 2,
    tool: "pickaxe",
    needsTool: !0,
    sound: "nether_bricks",
    stairs: !0,
  }),
  defBlock(126, "nether_wart", "下界疣", {
    shape: 6,
    tex: "nether_wart_stage0",
    solid: !1,
    hardness: 0,
    sound: "grass",
    needsSupport: !0,
    noItem: !0,
    texFn: (e, o) =>
      T(
        ["nether_wart_stage0", "nether_wart_stage1", "nether_wart_stage1", "nether_wart_stage2"][
          3 & o
        ],
      ),
    drops: (e, o) => [["nether_wart", (3 & e) >= 3 ? 2 + ((3 * o()) | 0) : 1]],
  }),
  defBlock(127, "spawner", "刷怪笼", {
    tex: "spawner",
    render: "cutout",
    opaque: !1,
    hardness: 5,
    tool: "pickaxe",
    needsTool: !0,
    sound: "metal",
    drops: nothing,
    xp: [15, 43],
    noItem: !0,
  }),
  defBlock(170, "nether_portal", "下界传送门", {
    shape: 3,
    boxes: (e) => (1 & e ? [[6, 0, 0, 10, 16, 16]] : [[0, 0, 6, 16, 16, 10]]),
    tex: "nether_portal",
    render: "translucent",
    solid: !1,
    light: 11,
    hardness: -1,
    cullSame: !0,
    noItem: !0,
    drops: nothing,
    sound: "glass",
    portal: !0,
  }),
  defBlock(171, "fire", "火", {
    shape: 9,
    tex: "fire_0",
    solid: !1,
    light: 15,
    hardness: 0,
    replaceable: !0,
    noItem: !0,
    drops: nothing,
    sound: "wool",
  }),
  defBlock(172, "end_stone", "末地石", {
    tex: "end_stone",
    hardness: 3,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(173, "end_stone_bricks", "末地石砖", {
    tex: "end_stone_bricks",
    hardness: 3,
    tool: "pickaxe",
    needsTool: !0,
  }),
  defBlock(174, "end_portal_frame", "末地传送门框架", {
    shape: 3,
    boxes: (e) =>
      4 & e
        ? [
            [0, 0, 0, 16, 13, 16],
            [4, 13, 4, 12, 16, 12, T("end_portal_frame_eye")],
          ]
        : [[0, 0, 0, 16, 13, 16]],
    tex: { top: "end_portal_frame_top", bottom: "end_stone", side: "end_portal_frame_side" },
    render: "opaque",
    hardness: -1,
    light: 1,
    sound: "glass",
    drops: nothing,
  }),
  defBlock(175, "end_portal", "末地传送门", {
    shape: 3,
    boxes: () => [[0, 0, 0, 16, 12, 16]],
    tex: "end_portal_marker",
    render: "opaque",
    solid: !1,
    light: 15,
    hardness: -1,
    noItem: !0,
    drops: nothing,
  }),
  defBlock(176, "dragon_egg", "龙蛋", {
    shape: 3,
    boxes: () => [
      [6, 15, 6, 10, 16, 10],
      [5, 14, 5, 11, 15, 11],
      [4, 13, 4, 12, 14, 12],
      [3, 11, 3, 13, 13, 13],
      [2, 8, 2, 14, 11, 14],
      [1, 3, 1, 15, 8, 15],
      [2, 1, 2, 14, 3, 14],
      [3, 0, 3, 13, 1, 13],
    ],
    tex: "dragon_egg",
    render: "opaque",
    hardness: 3,
    light: 1,
    gravity: !0,
    sound: "stone",
    stack: 64,
  }),
  defBlock(177, "cobweb", "蜘蛛网", {
    shape: 1,
    tex: "cobweb",
    solid: !1,
    hardness: 4,
    tool: "sword",
    sound: "wool",
    slow: 0.25,
    flatIcon: "cobweb",
    drops: () => [["string", 1]],
  }),
  defBlock(178, "oak_fence", "橡木栅栏", {
    shape: 3,
    boxes: fenceBoxes,
    collide: fenceCollide,
    tex: "oak_planks",
    render: "opaque",
    hardness: 2,
    tool: "axe",
    sound: "wood",
    fence: "wood",
    fuel: 300,
  }),
  defBlock(179, "nether_brick_slab", "下界砖台阶", {
    shape: 3,
    boxes: (e) => SLAB_BOXES[3 & e],
    tex: "nether_bricks",
    render: "opaque",
    hardness: 2,
    tool: "pickaxe",
    needsTool: !0,
    sound: "nether_bricks",
    slab: !0,
    drops: slabDrop("nether_brick_slab"),
  }),
  defBlock(180, "crying_obsidian", "哭泣的黑曜石", {
    tex: "crying_obsidian",
    light: 10,
    hardness: 50,
    tool: "pickaxe",
    level: 3,
    needsTool: !0,
  }),
  defBlock(116, "birch_slab", "白桦木台阶", {
    shape: 3,
    boxes: (e) => SLAB_BOXES[3 & e],
    tex: "birch_planks",
    render: "opaque",
    hardness: 2,
    tool: "axe",
    sound: "wood",
    slab: !0,
    fuel: 150,
    drops: slabDrop("birch_slab"),
  }));
const WOOLS = [
  ["white", "白色"],
  ["orange", "橙色"],
  ["magenta", "品红色"],
  ["light_blue", "淡蓝色"],
  ["yellow", "黄色"],
  ["lime", "黄绿色"],
  ["pink", "粉红色"],
  ["gray", "灰色"],
  ["light_gray", "淡灰色"],
  ["cyan", "青色"],
  ["purple", "紫色"],
  ["blue", "蓝色"],
  ["brown", "棕色"],
  ["green", "绿色"],
  ["red", "红色"],
  ["black", "黑色"],
];
WOOLS.forEach(([e, o], s) =>
  defBlock(128 + s, e + "_wool", o + "羊毛", {
    tex: e + "_wool",
    hardness: 0.8,
    sound: "wool",
    tool: "shears",
    fuel: 100,
    drops: drop(e + "_wool"),
  }),
);
const woolKey = (e) => (WOOLS[e] || WOOLS[0])[0] + "_wool",
  SGLASS = [
    ["white", "白色"],
    ["orange", "橙色"],
    ["light_blue", "淡蓝色"],
    ["yellow", "黄色"],
    ["lime", "黄绿色"],
    ["pink", "粉红色"],
    ["cyan", "青色"],
    ["purple", "紫色"],
    ["blue", "蓝色"],
    ["red", "红色"],
    ["black", "黑色"],
    ["green", "绿色"],
  ];
SGLASS.forEach(([e, o], s) =>
  defBlock(144 + s, e + "_stained_glass", o + "染色玻璃", {
    tex: e + "_stained_glass",
    render: "translucent",
    opaque: !1,
    hardness: 0.3,
    sound: "glass",
    drops: nothing,
    cullSame: !0,
  }),
);
const CONCRETE = [
  ["white", "白色"],
  ["orange", "橙色"],
  ["yellow", "黄色"],
  ["lime", "黄绿色"],
  ["light_blue", "淡蓝色"],
  ["blue", "蓝色"],
  ["red", "红色"],
  ["black", "黑色"],
  ["gray", "灰色"],
];
CONCRETE.forEach(([e, o], s) =>
  defBlock(160 + s, e + "_concrete", o + "混凝土", {
    tex: e + "_concrete",
    hardness: 1.8,
    tool: "pickaxe",
    needsTool: !0,
  }),
);
const SOUND_GROUP = {
    basalt: "basalt",
    wood: "wood",
    cherry_wood: "wood",
    mangrove_roots: "wood",
    beehive: "wood",
    bamboo: "wood",
    creaking_heart: "wood",
    gravel: "gravel",
    mud: "gravel",
    rooted_dirt: "gravel",
    muddy_mangrove_roots: "gravel",
    powder_snow: "snow",
    glass: "glass",
    sand: "sand",
  },
  GRASSY =
    /grass|moss|leaves|sapling|vine|lichen|berry|dripleaf|roots|azalea|blossom|petals|litter|flower|lily_pad|crop|slime/,
  CULL_SAME_GEN = new Set(["powder_snow", "tinted_glass", "slime_block", "honey_block"]),
  LEAF_SAPLING = {
    jungle_leaves: "jungle_sapling",
    acacia_leaves: "acacia_sapling",
    dark_oak_leaves: "dark_oak_sapling",
    cherry_leaves: "cherry_sapling",
    azalea_leaves: "azalea",
    flowering_azalea_leaves: "flowering_azalea",
    pale_oak_leaves: "pale_oak_sapling",
  };
function leafDrops(e) {
  const o = LEAF_SAPLING[e],
    s = "jungle_leaves" === e ? 1 / 40 : 0.05,
    t = "dark_oak_leaves" === e;
  return (e, a) => {
    const n = [];
    return (
      o && a() < s && n.push([o, 1]),
      a() < 0.02 && n.push(["stick", 1 + ((2 * a()) | 0)]),
      t && a() < 0.005 && n.push(["apple", 1]),
      n
    );
  };
}
function connBoxes(e, o) {
  return modelBoxes(e, o) || [[4, 0, 4, 12, 16, 12]];
}
function wallCollide(e) {
  const o = [[4, 0, 4, 12, 24, 12]];
  return (
    1 & e && o.push([0, 0, 5, 4, 24, 11]),
    2 & e && o.push([12, 0, 5, 16, 24, 11]),
    4 & e && o.push([5, 0, 0, 11, 24, 4]),
    8 & e && o.push([5, 0, 12, 11, 24, 16]),
    o
  );
}
function gateCollide(e) {
  const o = BLOCKS[this.id],
    s = o && o.states && o.states[e];
  return s && "true" !== s.open
    ? "east" === s.facing || "west" === s.facing
      ? [[6, 0, 0, 10, 24, 16]]
      : [[0, 0, 6, 16, 24, 10]]
    : [];
}
function entityBoxes(e, o) {
  const s = ((e.states && e.states[o]) || {}).facing,
    wall = (e) => {
      const [o, t, a, n, l, r] = e;
      return "south" === s
        ? [o, t, 16 - r, n, l, 16 - a]
        : "west" === s
          ? [a, t, o, r, l, n]
          : "east" === s
            ? [16 - r, t, o, 16 - a, l, n]
            : e;
    };
  switch (e.be) {
    case "head":
      return [[4, 0, 4, 12, 8, 12]];
    case "wall_head":
      return [wall([4, 4, 8, 12, 12, 16])];
    case "banner":
      return [[4, 0, 4, 12, 16, 12]];
    case "wall_banner":
      return [wall([0, 0, 14, 16, 12.5, 16])];
    case "decorated_pot":
      return [[1, 0, 1, 15, 16, 15]];
    case "conduit":
      return [[5, 5, 5, 11, 11, 11]];
    case "golem_statue":
      return [[2, 0, 2, 14, 14, 14]];
    case "invisible":
      return "barrier" === e.key ? [[0, 0, 0, 16, 16, 16]] : [];
  }
  return [[0, 0, 0, 16, 16, 16]];
}
function defDataBlock(e) {
  if (
    e.states &&
    e.states[0] &&
    "model" === e.kind &&
    !e.door &&
    !e.trapdoor &&
    !e.gate &&
    !e.stairs &&
    !e.slab &&
    !e.fence &&
    !e.wall &&
    !e.pane
  ) {
    const o = e.states[0],
      has = (...e) => e.every((e) => e in o),
      s = Object.keys(o).length;
    has("facing", "half", "shape")
      ? (e = Object.assign({}, e, { stairs: !0, states: null }))
      : has("facing", "half", "hinge", "open")
        ? (e = Object.assign({}, e, { door: !0, ownItem: !0, states: null }))
        : has("facing", "half", "open")
          ? (e = Object.assign({}, e, { trapdoor: !0, states: null }))
          : has("facing", "in_wall", "open")
            ? (e = Object.assign({}, e, { gate: !0 }))
            : 1 === s && has("type") && e.states.every((e) => /^(bottom|top|double)$/.test(e.type))
              ? (e = Object.assign({}, e, { slab: !0, states: null }))
              : has("north", "south", "east", "west", "up") && /_wall$/.test(e.key)
                ? (e = Object.assign({}, e, { wall: !0, states: null }))
                : 4 === s &&
                  has("north", "south", "east", "west") &&
                  /_fence$/.test(e.key) &&
                  (e = Object.assign({}, e, {
                    fence: /nether_brick/.test(e.key) ? "nether" : "wood",
                    states: null,
                  }));
  }
  const o = {
    hardness: e.hardness,
    tool: e.tool || null,
    level: e.level || 0,
    needsTool: !!e.needsTool,
    light: e.light || 0,
    fuel: e.fuel || 0,
    damage: e.damage || 0,
    slip: e.slip || 0.6,
    climbable: !!e.climbable,
    replaceable: !!e.replaceable,
    noItem: !!e.noitem,
  };
  if (
    ((o.sound = e.sound),
    e.tint && (o.tint = e.tint),
    "none" === e.drop ? (o.drops = nothing) : e.drop && (o.drops = drop(e.drop)),
    e.ore)
  ) {
    const [s, t] = e.oreCount || [1, 1];
    o.drops = (o, a) => [
      [void 0 !== ITEM_KEY[e.ore] ? e.ore : e.key, s + ((a() * (t - s + 1)) | 0)],
    ];
  }
  if ((e.xp && (o.xp = e.xp), "fluid" === e.kind)) {
    const o = defBlock(e.id, e.key, e.cn, {
      shape: 2,
      tex: e.still,
      render: e.hot ? "opaque" : "translucent",
      solid: !1,
      opacity: e.hot ? 15 : 1,
      light: e.light || 0,
      hardness: -1,
      replaceable: !0,
      noItem: !0,
      cullSame: !0,
    });
    return (
      (o.fluidKind = e.hot ? "lava" : "water"),
      e.bucket && (o.bucket = e.bucket),
      (o.soundGroup = e.hot ? "lava" : "water"),
      o
    );
  }
  if ("entity" === e.kind) {
    (Object.assign(o, {
      shape: 3,
      beRender: "invisible" !== e.be,
      be: e.be,
      render: "cutout",
      opaque: !1,
      opacity: 0,
      solid: !e.nonsolid,
      tex: e.particle || "white",
    }),
      "chest" === e.be
        ? Object.assign(o, {
            facing: !0,
            chestLike: !0,
            boxes: chestBoxes,
            onUse: "ender_chest" === e.key ? null : "chest",
          })
        : (o.boxes = (o) => entityBoxes(BLOCKS[e.id], o)));
    const s = defBlock(e.id, e.key, e.cn, o);
    return (
      e.states && "chest" !== e.be && (s.states = e.states),
      "light" === e.key && (s.stateLight = (e.states || []).map((e) => +e.level || 0)),
      (s.soundGroup = e.sound),
      s
    );
  }
  ("cube" === e.kind
    ? ((o.texFaces = e.tex),
      e.axis && ((o.axis = !0), (o.texFn = logTex), (o.flammable = !0)),
      e.log && (o.fuel = /crimson|warped/.test(e.key) ? 0 : 300),
      e.leaves &&
        Object.assign(o, {
          render: "cutout",
          opaque: !1,
          opacity: 1,
          flammable: !0,
          drops: leafDrops(e.key),
        }),
      e.translucent && Object.assign(o, { render: "translucent", opaque: !1, opacity: 1 }),
      e.cutout && Object.assign(o, { render: "cutout", opaque: !1, opacity: 0 }))
    : (Object.assign(o, {
        shape: 8,
        render: e.translucent ? "translucent" : "cutout",
        opaque: !1,
        opacity: 0,
        particle: e.particle,
      }),
      (e.plant || e.nonsolid) && (o.solid = !1),
      e.plant && (o.needsSupport = !0),
      e.stairs
        ? Object.assign(o, { stairs: !0, boxes: stairBoxes })
        : e.slab
          ? Object.assign(o, { slab: !0, boxes: (e) => SLAB_BOXES[3 & e], drops: slabDrop(e.key) })
          : e.fence
            ? Object.assign(o, { fence: e.fence, boxes: fenceBoxes, collide: fenceCollide })
            : e.wall
              ? Object.assign(o, {
                  fence: "wall",
                  boxes: (o) => connBoxes(BLOCKS[e.id], o),
                  collide: wallCollide,
                })
              : e.pane
                ? Object.assign(o, { fence: "pane", boxes: (o) => connBoxes(BLOCKS[e.id], o) })
                : e.door
                  ? Object.assign(o, {
                      door: !0,
                      noItem: !e.ownItem,
                      boxes: (o) => modelBoxes(BLOCKS[e.id], -9 & o) || [[0, 0, 0, 16, 16, 3]],
                      drops: (o) => (8 & o ? [] : [[e.key, 1]]),
                    })
                  : e.trapdoor
                    ? Object.assign(o, {
                        trapdoor: !0,
                        boxes: (o) => modelBoxes(BLOCKS[e.id], o) || [[0, 0, 0, 16, 3, 16]],
                      })
                    : e.bed
                      ? Object.assign(o, {
                          bed: !0,
                          stack: 1,
                          boxes: () => [[0, 0, 0, 16, 9, 16]],
                          drops: (o) => (4 & o ? [] : [[e.key, 1]]),
                        })
                      : e.gate
                        ? Object.assign(o, {
                            gate: !0,
                            boxes: (o) => modelBoxes(BLOCKS[e.id], o) || [[0, 0, 6, 16, 16, 10]],
                            collide: gateCollide,
                          })
                        : (o.boxes = (o) =>
                            modelBoxes(BLOCKS[e.id], o) || [[0, 0, 0, 16, 16, 16]])),
    (CULL_SAME_GEN.has(e.key) || e.cullSame) && (o.cullSame = !0),
    "powder_snow" === e.key && (o.render = "cutout"));
  const s = defBlock(e.id, e.key, e.cn, o);
  return (
    e.states && (s.states = e.states),
    e.states &&
      e.light &&
      e.states.some((e) => "lit" in e) &&
      (s.stateLight = e.states.map((o) =>
        "true" === o.lit ? (o.candles ? 3 * +o.candles : e.light) : 0,
      )),
    e.stateLight && (s.stateLight = e.stateLight),
    (s.soundGroup = e.sound),
    e.tint &&
      "#" === e.tint[0] &&
      (s.tintRGB = [1, 3, 5].map((o) => parseInt(e.tint.slice(o, o + 2), 16))),
    e.props && Object.assign(s, e.props),
    s
  );
}
for (const e of self.BLOCK_DATA || []) defDataBlock(e);
const WIRE_ID = [];
function wireColor(e) {
  const o = e / 15;
  return [
    0.6 * o + (o > 0 ? 0.4 : 0.3),
    clamp(o * o * 0.7 - 0.5, 0, 1),
    clamp(o * o * 0.6 - 0.7, 0, 1),
  ].map((e) => Math.round(255 * e));
}
if (void 0 !== BID.redstone_wire) {
  const e = BLOCKS[BID.redstone_wire];
  (Object.assign(e, { tint: "rgb", tintRGB: wireColor(0), wirePower: 0 }), (WIRE_ID[0] = e.id));
  for (let o = 1; o <= 15; o++) {
    const s = 4080 + o;
    ((BLOCKS[s] = Object.assign(Object.create(Object.getPrototypeOf(e)), e, {
      id: s,
      tintRGB: wireColor(o),
      wirePower: o,
    })),
      (WIRE_ID[o] = s));
  }
}
(void 0 !== BID.barrel && (BLOCKS[BID.barrel].onUse = "barrel"),
  void 0 !== BID.lily_pad && (BLOCKS[BID.lily_pad].solid = !0));
for (const [e, o] of [
  ["water_cauldron", "water"],
  ["leaf_litter", "dry_foliage"],
  ["melon_stem", "stem"],
  ["pumpkin_stem", "stem"],
  ["attached_melon_stem", "#e0c71c"],
  ["attached_pumpkin_stem", "#e0c71c"],
  ["lava_cauldron", null],
  ["powder_snow_cauldron", null],
]) {
  const s = BLOCKS[BID[e]];
  s &&
    ((s.tint = o),
    delete s.tintRGB,
    o && "#" === o[0] && (s.tintRGB = [1, 3, 5].map((e) => parseInt(o.slice(e, e + 2), 16))));
}
function stemTint(e) {
  return [32 * (e = +e || 0), 255 - 8 * e, 4 * e];
}
const SNOWY_DIRT = new Set([2, BID.podzol, BID.mycelium].filter((e) => void 0 !== e));
for (const e of ["pink_petals", "wildflowers"])
  void 0 !== BID[e] && Object.assign(BLOCKS[BID[e]], { tint: "grass", particleTint: !1 });
function wearsLeatherBoots(e) {
  const o = e.inv ? e.inv.slots[39] : e.armorItems && e.armorItems[3];
  return !(!o || !ITEMS[o.id] || "leather_boots" !== ITEMS[o.id].key);
}
void 0 !== BID.soul_fire && (BLOCKS[BID.soul_fire].replaceable = !0);
{
  const set = (e, o) => {
      void 0 !== BID[e] && Object.assign(BLOCKS[BID[e]], o);
    },
    prop = (e, o, s) => {
      const t = BLOCKS[BID[e]].states;
      return t && t[o] ? t[o][s] : void 0;
    };
  for (const e of ["campfire", "soul_campfire"]) set(e, { boxes: () => [[0, 0, 0, 16, 7, 16]] });
  set("stonecutter", { boxes: () => [[0, 0, 0, 16, 9, 16]] });
  for (const e of ["sculk_sensor", "calibrated_sculk_sensor"])
    set(e, { boxes: () => [[0, 0, 0, 16, 8, 16]], collide: () => [[0, 0, 0, 16, 8, 16]] });
  (set("sculk_shrieker", { collide: () => [[0, 0, 0, 16, 8, 16]] }),
    set("tripwire", {
      boxes: (e) =>
        "true" === prop("tripwire", e, "attached")
          ? [[0, 1, 0, 16, 2.5, 16]]
          : [[0, 0, 0, 16, 8, 16]],
    }),
    set("bamboo", { collide: () => [[6.5, 0, 6.5, 9.5, 16, 9.5]] }),
    set("end_rod", {
      collide: (e) => {
        const o = prop("end_rod", e, "facing");
        return "east" === o || "west" === o
          ? [[0, 6, 6, 16, 10, 10]]
          : "north" === o || "south" === o
            ? [[6, 6, 0, 10, 10, 16]]
            : [[6, 0, 6, 10, 16, 10]];
      },
    }));
  for (const e of ["azalea", "flowering_azalea"])
    set(e, {
      collide: () => [
        [0, 8, 0, 16, 16, 16],
        [6, 0, 6, 10, 8, 10],
      ],
    });
  set("big_dripleaf", {
    collide: (e) => {
      const o = prop("big_dripleaf", e, "tilt");
      return "full" === o ? [] : [[0, 11, 0, 16, "partial" === o ? 13 : 15, 16]];
    },
  });
  const e = [[]];
  for (let o = 1; o < 8; o++) e.push([[0, 0, 0, 16, 2 * o, 16]]);
  (set("snow", { collide: (o) => e[7 & o] }),
    set("honey_block", { collide: () => [[1, 0, 1, 15, 15, 15]], slow: 0.4, jumpFactor: 0.5 }),
    set("slime_block", { bounce: 1, slip: 0.8 }));
  const o = [[0, 0, 0, 16, 14.4, 16]],
    s = [[0, 0, 0, 16, 16, 16]],
    t = [],
    walker = (e) =>
      /^(rabbit|endermite|silverfish|fox)$/.test(e.type || "") || wearsLeatherBoots(e);
  set("powder_snow", {
    collide: (e, a, n) =>
      a
        ? a.fallDist > 2.5
          ? o
          : ("undefined" != typeof FallingBlock && a instanceof FallingBlock) ||
              (a.pos[1] > n + 1 - 1e-5 && !a.sneaking && !a.sneakHeld && walker(a))
            ? s
            : t
        : t,
  });
}
for (const e of [
  "seagrass",
  "tall_seagrass",
  "kelp",
  "kelp_plant",
  "tube_coral",
  "brain_coral",
  "bubble_coral",
  "fire_coral",
  "horn_coral",
  "tube_coral_fan",
  "brain_coral_fan",
  "bubble_coral_fan",
  "fire_coral_fan",
  "horn_coral_fan",
  "tube_coral_wall_fan",
  "brain_coral_wall_fan",
  "bubble_coral_wall_fan",
  "fire_coral_wall_fan",
  "horn_coral_wall_fan",
])
  void 0 !== BID[e] &&
    Object.assign(BLOCKS[BID[e]], {
      waterlogged: !0,
      render: "cutout",
      solid: !1,
      replaceable: e.includes("seagrass"),
    });
((() => {
  const fortune = (e) =>
      "function" == typeof enchLevel ? Math.min(3, enchLevel(e, "fortune")) : 0,
    vines = (e) => ({
      shearsDrop: e,
      drops: (o, s, t) =>
        ("function" == typeof enchLevel && enchLevel(t, "silk_touch")) ||
        s() < [0.33, 0.55, 0.77, 1][fortune(t)]
          ? [[e, 1]]
          : [],
    }),
    faces = (e, o) => {
      const s = (BLOCKS[BID[e]].states || [])[o] || {};
      return ["down", "up", "north", "south", "west", "east"].filter((e) => "true" === s[e]).length;
    },
    tall = (e) => ({
      drops: (e, o) => (o() < 0.125 ? [["wheat_seeds", 1]] : []),
      shearsDrop: () => [[e, 2]],
    }),
    e = {
      deepslate: { drops: drop("cobbled_deepslate") },
      sea_lantern: {
        drops: (e, o, s) => [
          [
            "prismarine_crystals",
            Math.min(5, 2 + ((2 * o()) | 0) + ((o() * (fortune(s) + 1)) | 0)),
          ],
        ],
      },
      gilded_blackstone: {
        drops: (e, o, s) =>
          o() < [0.1, 1 / 7, 0.25, 1][fortune(s)]
            ? [["gold_nugget", 2 + ((4 * o()) | 0)]]
            : [["gilded_blackstone", 1]],
      },
      amethyst_cluster: {
        needsTool: !1,
        drops: (e, o, s) => {
          const t = s && ITEMS[s.id] && ITEMS[s.id].tool;
          return [["amethyst_shard", t && "pickaxe" === t.type ? fortuneCount(4, fortune(s)) : 2]];
        },
      },
      sculk: { xp: [1, 1] },
      sculk_sensor: { xp: [5, 5] },
      calibrated_sculk_sensor: { xp: [5, 5] },
      sculk_shrieker: { xp: [5, 5] },
      sculk_catalyst: { xp: [5, 5] },
      weeping_vines: vines("weeping_vines"),
      weeping_vines_plant: vines("weeping_vines"),
      twisting_vines: vines("twisting_vines"),
      twisting_vines_plant: vines("twisting_vines"),
      sculk_vein: {
        drops: (e, o, s) =>
          "function" == typeof enchLevel && enchLevel(s, "silk_touch")
            ? [["sculk_vein", faces("sculk_vein", e)]]
            : [],
      },
      glow_lichen: {
        drops: nothing,
        shearsDrop: (e) => [["glow_lichen", faces("glow_lichen", e)]],
      },
      tall_seagrass: { drops: nothing, shearsDrop: () => [["seagrass", 2]] },
      tall_grass: tall("short_grass"),
      large_fern: tall("fern"),
    };
  for (const o of [
    "sculk",
    "sculk_sensor",
    "calibrated_sculk_sensor",
    "sculk_shrieker",
    "sculk_catalyst",
    "bee_nest",
    "chiseled_bookshelf",
    "turtle_egg",
  ])
    e[o] = Object.assign(e[o] || {}, { drops: nothing });
  for (const o of ["small_amethyst_bud", "medium_amethyst_bud", "large_amethyst_bud"])
    e[o] = { needsTool: !1, drops: nothing };
  for (const o of [
    "bush",
    "pale_hanging_moss",
    "small_dripleaf",
    "hanging_roots",
    "seagrass",
    "vine",
    "nether_sprouts",
    "short_dry_grass",
    "tall_dry_grass",
  ])
    e[o] = { drops: nothing, shearsDrop: o };
  for (const o of ["tube", "brain", "bubble", "fire", "horn"])
    ((e[o + "_coral_block"] = { drops: drop("dead_" + o + "_coral_block") }),
      (e["dead_" + o + "_coral"] =
        e["dead_" + o + "_coral_fan"] =
        e[o + "_coral_wall_fan"] =
          { drops: nothing }));
  for (const o of [
    "white",
    "orange",
    "magenta",
    "light_blue",
    "yellow",
    "lime",
    "pink",
    "gray",
    "light_gray",
    "cyan",
    "purple",
    "blue",
    "brown",
    "green",
    "red",
    "black",
  ])
    e[o + "_stained_glass"] = e[o + "_stained_glass_pane"] = { drops: nothing };
  for (const o of BLOCKS) o && e[o.key] && Object.assign(o, e[o.key]);
})(),
  void 0 !== BID.sea_pickle &&
    BLOCKS[BID.sea_pickle].states &&
    Object.assign(BLOCKS[BID.sea_pickle], {
      wetLight: !0,
      stateLight: BLOCKS[BID.sea_pickle].states.map((e) => 3 + 3 * (+e.pickles || 1)),
    }));
for (const e of ["cave_vines", "cave_vines_plant"])
  if (void 0 !== BID[e]) {
    const o = BLOCKS[BID[e]];
    o.states &&
      ((o.light = 14),
      (o.stateLight = o.states.map((e) => ("true" === e.berries ? 14 : 0))),
      (o.drops = (e) =>
        o.states[e] && "true" === o.states[e].berries ? [["glow_berries", 1]] : []));
  }
for (const [e, o] of [
  ["leaf_litter", "segment_amount"],
  ["pink_petals", "flower_amount"],
  ["wildflowers", "flower_amount"],
])
  if (void 0 !== BID[e] && BLOCKS[BID[e]].states) {
    const s = BLOCKS[BID[e]];
    s.drops = (t) => [[e, Math.max(1, +(s.states[t] && s.states[t][o]) || 1)]];
  }
const ITEM_ID_OF = {};
for (const e of self.ITEM_DATA || []) void 0 !== e.id && (ITEM_ID_OF[e.key] = e.id);
let nextItem = 256;
function defItem(e, o, s = {}) {
  const t = ITEM_ID_OF[e] ?? nextItem++,
    a = Object.assign(
      {
        id: t,
        key: e,
        cn: o,
        stack: 64,
        tex: void 0 !== s.tex ? s.tex : T("i_" + (s.texKey || e)),
      },
      s,
    );
  return ((ITEMS[t] = a), (ITEM_KEY[e] = t), a);
}
const TOOL_MAT = {
    wooden: [0, 2, 59, "木"],
    stone: [1, 4, 131, "石"],
    iron: [2, 6, 250, "铁"],
    golden: [0, 12, 32, "金"],
    diamond: [3, 8, 1561, "钻石"],
  },
  TOOL_DMG = {
    sword: [4, 5, 6, 4, 7],
    axe: [7, 9, 9, 7, 9],
    pickaxe: [2, 3, 4, 2, 5],
    shovel: [2.5, 3.5, 4.5, 2.5, 5.5],
    hoe: [1, 1, 1, 1, 1],
  },
  TOOL_CN = { pickaxe: "镐", axe: "斧", shovel: "锹", sword: "剑", hoe: "锄" };
(defItem("stick", "木棍", { fuel: 100 }),
  defItem("coal", "煤炭", { fuel: 1600 }),
  defItem("charcoal", "木炭", { fuel: 1600 }),
  defItem("raw_iron", "粗铁"),
  defItem("iron_ingot", "铁锭"),
  defItem("raw_gold", "粗金"),
  defItem("gold_ingot", "金锭"),
  defItem("diamond", "钻石"),
  defItem("emerald", "绿宝石"),
  defItem("lapis_lazuli", "青金石"),
  defItem("redstone", "红石粉"),
  defItem("flint", "燧石"),
  defItem("apple", "苹果", { food: [4, 2.4] }),
  defItem("bread", "面包", { food: [5, 6] }),
  defItem("wheat", "小麦"),
  defItem("wheat_seeds", "小麦种子", { places: "wheat" }),
  defItem("porkchop", "生猪排", { food: [3, 1.8] }),
  defItem("cooked_porkchop", "熟猪排", { food: [8, 12.8] }),
  defItem("beef", "生牛肉", { food: [3, 1.8] }),
  defItem("cooked_beef", "牛排", { food: [8, 12.8] }),
  defItem("mutton", "生羊肉", { food: [2, 1.2] }),
  defItem("cooked_mutton", "熟羊肉", { food: [6, 9.6] }),
  defItem("chicken", "生鸡肉", { food: [2, 1.2] }),
  defItem("cooked_chicken", "熟鸡肉", { food: [6, 7.2] }),
  defItem("rotten_flesh", "腐肉", { food: [4, 0.8] }),
  defItem("melon_slice", "西瓜片", { food: [2, 1.2] }),
  defItem("cookie", "曲奇", { food: [2, 0.4] }),
  defItem("pumpkin_pie", "南瓜派", { food: [8, 4.8] }),
  defItem("golden_apple", "金苹果", { food: [4, 9.6], heal: 4 }),
  defItem("baked_potato", "烤马铃薯", { food: [5, 6] }),
  defItem("carrot", "胡萝卜", { food: [3, 3.6] }),
  defItem("bone", "骨头"),
  defItem("bone_meal", "骨粉"),
  defItem("arrow", "箭"),
  defItem("bow", "弓", { stack: 1, durability: 384 }),
  defItem("string", "线"),
  defItem("gunpowder", "火药"),
  defItem("feather", "羽毛"),
  defItem("leather", "皮革"),
  defItem("egg", "鸡蛋", { stack: 16 }),
  defItem("snowball", "雪球", { stack: 16 }),
  defItem("shears", "剪刀", { stack: 1, durability: 238 }),
  defItem("flint_and_steel", "打火石", { stack: 1, durability: 64 }),
  defItem("bucket", "桶", { stack: 16 }),
  defItem("water_bucket", "水桶", { stack: 1, places: "water" }),
  defItem("lava_bucket", "熔岩桶", { stack: 1, places: "lava", fuel: 2e4 }));
for (const e of ["wooden", "stone", "iron", "golden", "diamond"]) {
  const [o, s, t, a] = TOOL_MAT[e],
    n = ["wooden", "stone", "iron", "golden", "diamond"].indexOf(e);
  for (const l of ["pickaxe", "axe", "shovel", "sword", "hoe"])
    defItem(e + "_" + l, a + TOOL_CN[l], {
      stack: 1,
      durability: t,
      tool: { type: l, level: o, speed: s },
      attack: TOOL_DMG[l][n],
      fuel: "wooden" === e ? 200 : 0,
    });
}
defItem("oak_door", "橡木门", { places: "oak_door", fuel: 200 });
for (const e of self.BLOCK_DATA || [])
  e.door && defItem(e.key, e.cn, { places: e.key, fuel: e.fuel || 0 });
(defItem("sugar_cane", "甘蔗", { places: "sugar_cane" }),
  defItem("sugar", "糖"),
  defItem("paper", "纸"),
  defItem("book", "书"),
  defItem("clay_ball", "黏土球"),
  defItem("brick", "红砖"));
const ARMOR_PTS = { leather: [1, 3, 2, 1], iron: [2, 6, 5, 2], diamond: [3, 8, 6, 3] },
  ARMOR_DUR = { leather: 80, iron: 240, diamond: 528 },
  ARMOR_CN = { leather: "皮革", iron: "铁", diamond: "钻石" };
for (const e of ["leather", "iron", "diamond"])
  ["helmet", "chestplate", "leggings", "boots"].forEach((o, s) => {
    defItem(e + "_" + o, ARMOR_CN[e] + ["头盔", "胸甲", "护腿", "靴子"][s], {
      stack: 1,
      durability: ARMOR_DUR[e],
      armor: { slot: s, points: ARMOR_PTS[e][s] },
    });
  });
for (const [e, o] of [
  ["pig", "猪"],
  ["cow", "牛"],
  ["sheep", "羊"],
  ["chicken", "鸡"],
  ["zombie", "僵尸"],
  ["skeleton", "骷髅"],
  ["creeper", "苦力怕"],
  ["spider", "蜘蛛"],
])
  defItem(e + "_spawn_egg", o + "刷怪蛋", { spawnEgg: e });
(defItem("blaze_rod", "烈焰棒", { fuel: 2400 }),
  defItem("blaze_powder", "烈焰粉"),
  defItem("ender_pearl", "末影珍珠", { stack: 16 }),
  defItem("ender_eye", "末影之眼"),
  defItem("gold_nugget", "金粒"),
  defItem("quartz", "下界石英"),
  defItem("magma_cream", "岩浆膏"),
  defItem("ghast_tear", "恶魂之泪"),
  defItem("nether_wart", "下界疣", { places: "nether_wart" }),
  defItem("glowstone_dust", "荧石粉"),
  defItem("nether_brick", "下界砖"),
  defItem("fire_charge", "火焰弹"),
  defItem("end_crystal", "末影水晶"));
for (const [e, o] of [
  ["enderman", "末影人"],
  ["blaze", "烈焰人"],
  ["ghast", "恶魂"],
  ["zombified_piglin", "僵尸猪灵"],
  ["magma_cube", "岩浆怪"],
])
  defItem(e + "_spawn_egg", o + "刷怪蛋", { spawnEgg: e });
for (const e of self.ITEM_DATA || []) {
  if (void 0 === e.id || void 0 !== ITEM_KEY[e.key]) continue;
  const o = { stack: e.stack, tex: e.tex ? T(e.tex) : T("white") };
  (e.dur && (o.durability = e.dur), e.places && (o.places = e.places), defItem(e.key, e.cn, o));
}
for (const e of self.ITEM_DATA || []) {
  const o = ITEMS[ITEM_KEY[e.key]];
  o &&
    ((o.stack = e.stack),
    (o.tab = e.tab),
    e.places && !o.places && void 0 === o.block && (o.places = e.places),
    e.ench && (o.enchantability = e.ench),
    e.rep && (o.repair = e.rep),
    e.rar && (o.rarity = e.rar),
    e.glint && (o.glint = !0),
    e.tcPart && (o.tcPart = e.tcPart),
    e.tcTool && (o.tcTool = e.tcTool));
}
void 0 === ITEM_KEY.spawner ||
  ITEMS[ITEM_KEY.spawner].places ||
  void 0 !== ITEMS[ITEM_KEY.spawner].block ||
  (ITEMS[ITEM_KEY.spawner].places = "spawner");
const TOOL_TIER = {
    wooden: [0, 2],
    stone: [1, 4],
    copper: [1, 5],
    iron: [2, 6],
    golden: [0, 12],
    diamond: [3, 8],
    netherite: [4, 9],
  },
  TOOL_ATTACK = {
    sword: [4, 5, 5, 6, 4, 7, 8],
    axe: [7, 9, 9, 9, 7, 9, 10],
    pickaxe: [2, 3, 3, 4, 2, 5, 6],
    shovel: [2.5, 3.5, 3.5, 4.5, 2.5, 5.5, 6.5],
    hoe: [1, 1, 1, 1, 1, 1, 1],
    spear: [2, 3, 3, 4, 2, 5, 6],
  },
  ARMOR_MAT = {
    leather: [[1, 3, 2, 1], 0],
    chainmail: [[2, 5, 4, 1], 0],
    copper: [[2, 4, 3, 1], 0],
    iron: [[2, 6, 5, 2], 0],
    golden: [[2, 5, 3, 1], 0],
    diamond: [[3, 8, 6, 3], 2],
    netherite: [[3, 8, 6, 3], 3],
  };
for (const e of ITEMS) {
  if (!e || void 0 !== e.block) continue;
  const o = /^(\w+?)_(sword|axe|pickaxe|shovel|hoe|spear|helmet|chestplate|leggings|boots)$/.exec(
    e.key,
  );
  if (!o) continue;
  const [, s, t] = o,
    a = Object.keys(TOOL_TIER).indexOf(s);
  if (TOOL_ATTACK[t] && TOOL_TIER[s])
    ("spear" !== t && (e.tool = { type: t, level: TOOL_TIER[s][0], speed: TOOL_TIER[s][1] }),
      (e.attack = TOOL_ATTACK[t][a]));
  else if (ARMOR_MAT[s]) {
    const o = ["helmet", "chestplate", "leggings", "boots"].indexOf(t);
    e.armor = { slot: o, points: ARMOR_MAT[s][0][o], tough: ARMOR_MAT[s][1], mat: s };
  }
}
(void 0 !== ITEM_KEY.turtle_helmet &&
  (ITEMS[ITEM_KEY.turtle_helmet].armor = { slot: 0, points: 2, tough: 0, mat: "turtle" }),
  void 0 !== ITEM_KEY.elytra &&
    (ITEMS[ITEM_KEY.elytra].armor = { slot: 1, points: 0, tough: 0, mat: "elytra" }));
for (const e of self.ITEM_DATA || []) {
  const o = ITEMS[ITEM_KEY[e.key]];
  o && e.atk && ((o.attack = e.atk), (o.attackSpeed = e.aspd));
}
const WALL_FORM = {},
  IS_WALL_FORM = new Set();
for (const e in BID) {
  const o = e
    .replace(/_hanging_sign$/, "_wall_hanging_sign")
    .replace(/(?<!hanging)_sign$/, "_wall_sign")
    .replace(/_banner$/, "_wall_banner")
    .replace(/_head$/, "_wall_head")
    .replace(/_skull$/, "_wall_skull")
    .replace(/_coral_fan$/, "_coral_wall_fan")
    .replace(/(^|_)torch$/, "$1wall_torch");
  o !== e && void 0 !== BID[o] && ((WALL_FORM[e] = o), IS_WALL_FORM.add(o));
}
for (const e in WALL_FORM) {
  const o = BLOCKS[BID[WALL_FORM[e]]],
    s = BLOCKS[BID[e]],
    silk = (e) =>
      "function" == typeof enchLevel &&
      enchLevel(e, "silk_touch") &&
      ITEMS[s.id] &&
      !s.noItem &&
      !NO_SILK.has(s.key);
  o.drops &&
    !o.drops(0, () => 0.5).length &&
    (o.drops = (e, o, t) =>
      s.drops ? (silk(t) ? [[s.id, 1]] : s.drops(0, o, t)) : s.noItem ? [] : [[s.id, 1]]);
}
const LEGACY_ITEM = {
  cocoa: "cocoa_beans",
  sweet_berry_bush: "sweet_berries",
  cave_vines: "glow_berries",
  cave_vines_plant: "glow_berries",
  kelp_plant: "kelp",
  bamboo_sapling: "bamboo",
  tall_seagrass: "seagrass",
  powder_snow: "powder_snow_bucket",
  big_dripleaf_stem: "big_dripleaf",
  weeping_vines_plant: "weeping_vines",
  twisting_vines_plant: "twisting_vines",
  oak_wall_sign: "oak_sign",
  spruce_wall_sign: "spruce_sign",
};
function fixSavedStack(e) {
  if (!e || ITEMS[e.id]) return e;
  const o = BLOCKS[e.id],
    s = o && ITEM_KEY[LEGACY_ITEM[o.key]];
  return void 0 !== s ? { ...e, id: s } : null;
}
function sameKind(e, o) {
  return (
    e.id === o.id &&
    (e.pot || "") === (o.pot || "") &&
    (e.x || "") === (o.x || "") &&
    (e.name || "") === (o.name || "") &&
    (e.rc || 0) === (o.rc || 0) &&
    JSON.stringify(e.trim || null) === JSON.stringify(o.trim || null) &&
    (e.mapId ?? null) === (o.mapId ?? null) &&
    ((!e.e && !o.e) || (!!e.e && !!o.e && sameEnchants(e, o)))
  );
}
function item(e) {
  const o = ITEM_KEY[e];
  if (void 0 === o) throw new Error("no item " + e);
  return o;
}
function itemDef(e) {
  return ITEMS[e];
}
function makeStack(e, o = 1) {
  return { id: "number" == typeof e ? e : item(e), count: o, dmg: 0 };
}
function maxStack(e) {
  return ITEMS[e] ? ITEMS[e].stack : 64;
}
const TAGS = {
    planks: [
      "oak_planks",
      "birch_planks",
      "spruce_planks",
      "dark_oak_planks",
      "jungle_planks",
      "acacia_planks",
      "cherry_planks",
    ],
    coals: ["coal", "charcoal"],
    stone_tool: ["cobblestone"],
    logs: ["oak_log", "birch_log", "spruce_log"],
    wool: [
      "white_wool",
      "orange_wool",
      "magenta_wool",
      "light_blue_wool",
      "yellow_wool",
      "lime_wool",
      "pink_wool",
      "gray_wool",
      "light_gray_wool",
      "cyan_wool",
      "purple_wool",
      "blue_wool",
      "brown_wool",
      "green_wool",
      "red_wool",
      "black_wool",
    ],
  },
  RECIPES = [];
function shaped(e, o, s, t) {
  const a = {};
  for (const e in t) a[e] = (TAGS[t[e]] || [t[e]]).map(item);
  RECIPES.push({
    type: "shaped",
    result: item(e),
    count: o,
    pattern: s,
    keys: a,
    w: s[0].length,
    h: s.length,
  });
}
function shapeless(e, o, s) {
  RECIPES.push({
    type: "shapeless",
    result: item(e),
    count: o,
    ing: s.map((e) => (TAGS[e] || [e]).map(item)),
  });
}
(shapeless("oak_planks", 4, ["oak_log"]),
  shapeless("birch_planks", 4, ["birch_log"]),
  shapeless("spruce_planks", 4, ["spruce_log"]),
  shaped("stick", 4, ["#", "#"], { "#": "planks" }),
  shaped("crafting_table", 1, ["##", "##"], { "#": "planks" }),
  shaped("furnace", 1, ["###", "# #", "###"], { "#": "cobblestone" }),
  shaped("chest", 1, ["###", "# #", "###"], { "#": "planks" }),
  shaped("torch", 4, ["C", "#"], { C: "coals", "#": "stick" }));
const TOOL_KEYS = {
  wooden: "planks",
  stone: "cobblestone",
  iron: "iron_ingot",
  golden: "gold_ingot",
  diamond: "diamond",
};
for (const e in TOOL_KEYS) {
  const o = TOOL_KEYS[e];
  (shaped(e + "_pickaxe", 1, ["XXX", " # ", " # "], { X: o, "#": "stick" }),
    shaped(e + "_axe", 1, ["XX", "X#", " #"], { X: o, "#": "stick" }),
    shaped(e + "_shovel", 1, ["X", "#", "#"], { X: o, "#": "stick" }),
    shaped(e + "_sword", 1, ["X", "X", "#"], { X: o, "#": "stick" }),
    shaped(e + "_hoe", 1, ["XX", " #", " #"], { X: o, "#": "stick" }));
}
for (const [e, o] of [
  ["leather", "leather"],
  ["iron", "iron_ingot"],
  ["diamond", "diamond"],
])
  (shaped(e + "_helmet", 1, ["XXX", "X X"], { X: o }),
    shaped(e + "_chestplate", 1, ["X X", "XXX", "XXX"], { X: o }),
    shaped(e + "_leggings", 1, ["XXX", "X X", "X X"], { X: o }),
    shaped(e + "_boots", 1, ["X X", "X X"], { X: o }));
(shaped("bow", 1, [" #S", "# S", " #S"], { "#": "stick", S: "string" }),
  shaped("arrow", 4, ["F", "#", "E"], { F: "flint", "#": "stick", E: "feather" }),
  shaped("bucket", 1, ["X X", " X "], { X: "iron_ingot" }),
  shaped("shears", 1, [" X", "X "], { X: "iron_ingot" }),
  shapeless("flint_and_steel", 1, ["iron_ingot", "flint"]));
for (const [e, o] of [
  ["iron_block", "iron_ingot"],
  ["gold_block", "gold_ingot"],
  ["diamond_block", "diamond"],
  ["coal_block", "coal"],
  ["emerald_block", "emerald"],
  ["lapis_block", "lapis_lazuli"],
  ["redstone_block", "redstone"],
  ["hay_block", "wheat"],
])
  (shaped(e, 1, ["XXX", "XXX", "XXX"], { X: o }), shapeless(o, 9, [e]));
function matchRecipe(e, o) {
  const s = e.length / o;
  let t = o,
    a = s,
    n = -1,
    l = -1,
    r = 0;
  for (let d = 0; d < s; d++)
    for (let s = 0; s < o; s++)
      e[d * o + s] &&
        (r++,
        (t = Math.min(t, s)),
        (n = Math.max(n, s)),
        (a = Math.min(a, d)),
        (l = Math.max(l, d)));
  if (!r) return null;
  const d = n - t + 1,
    c = l - a + 1;
  for (const s of RECIPES)
    if ("shaped" === s.type) {
      if (s.w !== d || s.h !== c) continue;
      for (const n of [!1, !0]) {
        let l = !0;
        for (let r = 0; r < c && l; r++)
          for (let c = 0; c < d && l; c++) {
            const i = s.pattern[r][n ? d - 1 - c : c],
              _ = e[(a + r) * o + t + c];
            " " === i || void 0 === i ? _ && (l = !1) : (_ && s.keys[i].includes(_.id)) || (l = !1);
          }
        if (l) return s;
      }
    } else {
      if (s.ing.length !== r) continue;
      const o = new Array(s.ing.length).fill(!1);
      let t = !0;
      for (const a of e) {
        if (!a) continue;
        let e = !1;
        for (let t = 0; t < s.ing.length; t++)
          if (!o[t] && s.ing[t].includes(a.id)) {
            ((o[t] = !0), (e = !0));
            break;
          }
        if (!e) {
          t = !1;
          break;
        }
      }
      if (t) return s;
    }
  return null;
}
(shaped("melon", 1, ["XXX", "XXX", "XXX"], { X: "melon_slice" }),
  shaped("tnt", 1, ["#S#", "S#S", "#S#"], { "#": "gunpowder", S: "sand" }),
  shaped("bread", 1, ["WWW"], { W: "wheat" }),
  shapeless("sugar", 1, ["sugar_cane"]),
  shaped("paper", 3, ["###"], { "#": "sugar_cane" }),
  shapeless("book", 1, ["paper", "paper", "paper", "leather"]),
  shaped("bookshelf", 1, ["###", "BBB", "###"], { "#": "planks", B: "book" }),
  shaped("bricks", 1, ["##", "##"], { "#": "brick" }),
  shaped("clay", 1, ["##", "##"], { "#": "clay_ball" }),
  shaped("stone_bricks", 4, ["##", "##"], { "#": "stone" }),
  shaped("sandstone", 1, ["##", "##"], { "#": "sand" }),
  shaped("snow_block", 1, ["##", "##"], { "#": "snowball" }),
  shaped("white_wool", 1, ["##", "##"], { "#": "string" }),
  shaped("polished_andesite", 4, ["##", "##"], { "#": "andesite" }),
  shaped("polished_diorite", 4, ["##", "##"], { "#": "diorite" }),
  shaped("polished_granite", 4, ["##", "##"], { "#": "granite" }),
  shaped("smooth_stone_slab", 6, ["###"], { "#": "smooth_stone" }),
  shaped("oak_slab", 6, ["###"], { "#": "oak_planks" }),
  shaped("birch_slab", 6, ["###"], { "#": "birch_planks" }),
  shaped("cobblestone_slab", 6, ["###"], { "#": "cobblestone" }),
  shaped("stone_brick_slab", 6, ["###"], { "#": "stone_bricks" }),
  shaped("oak_stairs", 4, ["#  ", "## ", "###"], { "#": "oak_planks" }),
  shaped("spruce_stairs", 4, ["#  ", "## ", "###"], { "#": "spruce_planks" }),
  shaped("cobblestone_stairs", 4, ["#  ", "## ", "###"], { "#": "cobblestone" }),
  shaped("stone_brick_stairs", 4, ["#  ", "## ", "###"], { "#": "stone_bricks" }),
  shaped("brick_stairs", 4, ["#  ", "## ", "###"], { "#": "bricks" }),
  shaped("oak_door", 3, ["##", "##", "##"], { "#": "planks" }),
  shaped("oak_trapdoor", 2, ["###", "###"], { "#": "planks" }),
  shaped("ladder", 3, ["# #", "###", "# #"], { "#": "stick" }),
  shaped("red_bed", 1, ["WWW", "PPP"], { W: "wool", P: "planks" }),
  shapeless("jack_o_lantern", 1, ["pumpkin", "torch"]),
  shapeless("bone_meal", 3, ["bone"]),
  shaped("golden_apple", 1, ["GGG", "GAG", "GGG"], { G: "gold_ingot", A: "apple" }),
  shapeless("pumpkin_pie", 1, ["pumpkin", "sugar", "egg"]),
  shaped("mossy_cobblestone", 1, ["#M"], { "#": "cobblestone", M: "moss_block" }),
  shaped("sea_lantern", 1, ["LGL", "GGG", "LGL"], { L: "lapis_lazuli", G: "glass" }),
  shaped("note_block", 1, ["###", "#R#", "###"], { "#": "planks", R: "redstone" }),
  shaped("quartz_block", 1, ["##", "##"], { "#": "quartz" }),
  shapeless("blaze_powder", 2, ["blaze_rod"]),
  shapeless("ender_eye", 1, ["ender_pearl", "blaze_powder"]),
  shaped("glowstone", 1, ["##", "##"], { "#": "glowstone_dust" }),
  shaped("gold_ingot", 1, ["###", "###", "###"], { "#": "gold_nugget" }),
  shapeless("gold_nugget", 9, ["gold_ingot"]),
  shaped("nether_bricks", 1, ["##", "##"], { "#": "nether_brick" }),
  shaped("nether_brick_fence", 6, ["#B#", "#B#"], { "#": "nether_bricks", B: "nether_brick" }),
  shaped("nether_brick_stairs", 4, ["#  ", "## ", "###"], { "#": "nether_bricks" }),
  shaped("nether_brick_slab", 6, ["###"], { "#": "nether_bricks" }),
  shaped("oak_fence", 3, ["#S#", "#S#"], { "#": "planks", S: "stick" }),
  shapeless("fire_charge", 3, ["gunpowder", "blaze_powder", "coals"]),
  shaped("magma_block", 1, ["##", "##"], { "#": "magma_cream" }),
  shaped("end_stone_bricks", 4, ["##", "##"], { "#": "end_stone" }),
  shaped("end_crystal", 1, ["GGG", "GEG", "GTG"], { G: "glass", E: "ender_eye", T: "ghast_tear" }));
const SMELTING = {};
function smelt(e, o, s = 0.1) {
  SMELTING[item(e)] = { result: item(o), xp: s };
}
(smelt("raw_iron", "iron_ingot", 0.7),
  smelt("raw_gold", "gold_ingot", 1),
  smelt("sand", "glass"),
  smelt("red_sand", "glass"),
  smelt("cobblestone", "stone"),
  smelt("stone", "smooth_stone"),
  smelt("clay_ball", "brick", 0.3),
  smelt("clay", "terracotta", 0.35),
  smelt("oak_log", "charcoal", 0.15),
  smelt("birch_log", "charcoal", 0.15),
  smelt("spruce_log", "charcoal", 0.15),
  smelt("porkchop", "cooked_porkchop", 0.35),
  smelt("beef", "cooked_beef", 0.35),
  smelt("mutton", "cooked_mutton", 0.35),
  smelt("chicken", "cooked_chicken", 0.35),
  smelt("stone_bricks", "cracked_stone_bricks"),
  smelt("cactus", "green_concrete" in ITEM_KEY ? "green_concrete" : "lime_concrete"),
  smelt("carrot", "baked_potato", 0.35),
  smelt("netherrack", "nether_brick", 0.1),
  smelt("nether_quartz_ore", "quartz", 0.2),
  smelt("nether_gold_ore", "gold_ingot", 1));
const COOKING = { smelting: SMELTING, blasting: {}, smoking: {}, campfire_cooking: {} },
  STONECUTTING = {},
  SMITHING = [];
function itemIds(e) {
  if (null == e) return [];
  if (Array.isArray(e)) return [...new Set(e.flatMap(itemIds))];
  if ("#" === e[0])
    return [
      ...new Set(((self.RECIPE_DATA && RECIPE_DATA.tags[e.slice(1)]) || []).flatMap(itemIds)),
    ];
  if (!itemIds.byKey) {
    itemIds.byKey = {};
    for (const e of ITEMS)
      e && e.key && (itemIds.byKey[e.key] = itemIds.byKey[e.key] || []).push(e.id);
  }
  const o = itemIds.byKey[e];
  if (o) return o.slice();
  const s = ITEM_KEY[e];
  return void 0 === s ? [] : [s];
}
!(function loadRecipes() {
  const e = self.RECIPE_DATA;
  if (!e) return;
  const o = itemIds;
  RECIPES.length = 0;
  for (const e in SMELTING) delete SMELTING[e];
  for (const s of e.crafting) {
    const e = ITEM_KEY[s[1]];
    if (void 0 !== e)
      if ("s" === s[0]) {
        const t = {};
        let a = !0;
        for (const e in s[4]) ((t[e] = o(s[4][e])), t[e].length || (a = !1));
        let n = s[3].slice();
        for (; n.length && !n[0].trim();) n.shift();
        for (; n.length && !n[n.length - 1].trim();) n.pop();
        const l = n.filter((e) => e.trim()),
          r = Math.min(...l.map((e) => e.search(/\S/))),
          d = Math.max(...l.map((e) => e.trimEnd().length));
        ((n = n.map((e) => e.slice(r, d).padEnd(d - r))),
          a &&
            n.length &&
            RECIPES.push({
              type: "shaped",
              result: e,
              count: s[2],
              pattern: n,
              keys: t,
              w: n[0].length,
              h: n.length,
            }));
      } else {
        const t = "l" === s[0] ? s[3].map(o) : [o(s[2]), o(s[3])];
        t.every((e) => e.length) &&
          RECIPES.push({
            type: "shapeless",
            result: e,
            count: "l" === s[0] ? s[2] : 1,
            ing: t,
            keep: "t" === s[0] ? 0 : void 0,
          });
      }
  }
  for (const [s, t, a, n, l] of e.cooking) {
    const e = ITEM_KEY[a];
    if (void 0 !== e) for (const a of o(t)) COOKING[s][a] = { result: e, xp: n, time: l };
  }
  for (const [s, t, a] of e.stonecutting) {
    const e = ITEM_KEY[t];
    if (void 0 !== e)
      for (const t of o(s)) (STONECUTTING[t] = STONECUTTING[t] || []).push({ result: e, count: a });
  }
  for (const [s, t, a, n, l] of e.smithing)
    SMITHING.push({
      trim: "trim" === s,
      template: o(t),
      base: o(a),
      addition: o(n),
      result: "trim" === s ? null : ITEM_KEY[l],
      pattern: "trim" === s ? l : null,
    });
})();
const FURNACE_KIND = {
  furnace: "smelting",
  lit_furnace: "smelting",
  blast_furnace: "blasting",
  smoker: "smoking",
};
for (const e of ["blast_furnace", "smoker"])
  void 0 !== BID[e] && (BLOCKS[BID[e]].onUse = "furnace");
const VANILLA_FUEL = (() => {
  const e = "(oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|pale_oak|bamboo)",
    o =
      "(white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)";
  return [
    [
      new RegExp(
        `^(stripped_)?${e}_(log|wood)$|^${e}_planks$|^(stripped_)?bamboo_block$|^bamboo_mosaic(_stairs)?$|^${e}_(stairs|trapdoor|pressure_plate|fence|fence_gate|shelf)$`,
      ),
      300,
    ],
    [
      /^(note_block|bookshelf|chiseled_bookshelf|lectern|jukebox|chest|trapped_chest|crafting_table|daylight_detector|bow|fishing_rod|ladder|crossbow|loom|barrel|cartography_table|fletching_table|smithing_table|composter|mangrove_roots)$/,
      300,
    ],
    [new RegExp(`^${o}_banner$`), 300],
    [new RegExp(`^${e}_slab$|^bamboo_mosaic_slab$`), 150],
    [new RegExp(`^${e}_hanging_sign$`), 800],
    [new RegExp(`^${e}_(sign|door)$|^wooden_(shovel|sword|spear|hoe|axe|pickaxe)$`), 200],
    [new RegExp(`^${e}_(chest_)?(boat|raft)$`), 1200],
    [new RegExp(`^${o}_wool$|^${e}_button$|_sapling$|^mangrove_propagule$`), 100],
    [
      /^(stick|bowl|dead_bush|short_dry_grass|tall_dry_grass|azalea|flowering_azalea|leaf_litter)$/,
      100,
    ],
    [new RegExp(`^${o}_carpet$`), 67],
    [/^dried_kelp_block$/, 4001],
    [/^(bamboo|scaffolding)$/, 50],
  ];
})();
let vanillaFuelDone = !1;
function fuelValue(e) {
  if (!vanillaFuelDone) {
    vanillaFuelDone = !0;
    for (const e of ITEMS)
      if (e && !(e.fuel || (BLOCKS[e.id] && BLOCKS[e.id].fuel))) {
        const o = VANILLA_FUEL.find(([o]) => o.test(e.key));
        o && (e.fuel = o[1]);
      }
  }
  const o = ITEMS[e];
  return (o && (o.fuel || (BLOCKS[e] && BLOCKS[e].fuel))) || 0;
}
const CREATIVE_TABS = [
  ["building_blocks", "建筑方块", "bricks"],
  ["colored_blocks", "染色方块", "cyan_wool"],
  ["natural_blocks", "自然方块", "grass_block"],
  ["functional_blocks", "功能方块", "oak_sign"],
  ["redstone_blocks", "红石方块", "redstone"],
  ["tools_and_utilities", "工具与实用物品", "diamond_pickaxe"],
  ["combat", "战斗用品", "netherite_sword"],
  ["food_and_drinks", "食物与饮品", "golden_apple"],
  ["ingredients", "原材料", "iron_ingot"],
  ["spawn_eggs", "刷怪蛋", "pig_spawn_egg"],
].map(([e, o, s]) => ({
  id: e,
  name: o,
  icon: s,
  get items() {
    return creativeTabItems(e);
  },
}));
function creativeTabItems(e) {
  const o = creativeTabItems.cache || (creativeTabItems.cache = {});
  return (
    o[e] ||
      (o[e] = (self.ITEM_DATA || [])
        .filter((o) => o.tab === e && void 0 !== ITEM_KEY[o.key])
        .flatMap((e) =>
          /^(potion|splash_potion|lingering_potion|tipped_arrow)$/.test(e.key) &&
          "undefined" != typeof POTIONS
            ? Object.keys(POTIONS)
                .filter((o) => "tipped_arrow" !== e.key || POTIONS[o].length)
                .map((o) => ({ key: e.key, pot: o }))
            : [e.key],
        )),
    o[e]
  );
}
const WATERLOGGABLE_RE =
  /(_stairs|_slab|_wall|_fence|_pane|_bars|_chain|_trapdoor|_sign|_shelf|_leaves|rail|_candle|_lantern|_coral|_coral_fan|_coral_wall_fan|lightning_rod|_grate|_chest|copper_golem_statue)$|^(candle|lantern|chest|ladder|glow_lichen|resin_clump|barrier|light|dried_ghast|sea_pickle|conduit|scaffolding|campfire|soul_campfire|amethyst_cluster|(large|medium|small)_amethyst_bud|sculk_sensor|calibrated_sculk_sensor|sculk_vein|sculk_shrieker|pointed_dripstone|sulfur_spike|big_dripleaf|big_dripleaf_stem|small_dripleaf|hanging_roots|decorated_pot|heavy_core|mangrove_propagule|mangrove_roots)$/;
let WATERLOGGABLE = null;
function canWaterlog(e, o) {
  if (!WATERLOGGABLE) {
    WATERLOGGABLE = new Uint8Array(MAX_BLOCKS);
    for (const e of BLOCKS)
      e &&
        (WATERLOGGABLE_RE.test(e.key) || e.waterloggable) &&
        !/^(jack_o|sea)_lantern$/.test(e.key) &&
        (WATERLOGGABLE[e.id] = 1);
  }
  return !(!WATERLOGGABLE[e] || (BLOCKS[e].slab && 2 == (3 & o)));
}
//# sourceURL=js/blocks.js
