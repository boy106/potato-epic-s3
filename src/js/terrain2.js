"use strict";
const VB_BASE = 32,
  VBIOME = [];
function hexRGB(e) {
  const t = parseInt(e.slice(1), 16);
  return [(t >> 16) & 255, (t >> 8) & 255, 255 & t];
}
const DRY_FOLIAGE = {
  badlands: "#a38046",
  bamboo_jungle: "#a36346",
  basalt_deltas: "#a38046",
  beach: "#a37546",
  birch_forest: "#a37246",
  cherry_grove: "#a17148",
  cold_ocean: "#a17448",
  crimson_forest: "#a38046",
  deep_cold_ocean: "#a17448",
  deep_dark: "#a37546",
  deep_frozen_ocean: "#a17448",
  deep_lukewarm_ocean: "#a17448",
  deep_ocean: "#a17448",
  desert: "#a38046",
  dripstone_caves: "#a37546",
  end_barrens: "#a17448",
  end_highlands: "#a17448",
  end_midlands: "#a17448",
  eroded_badlands: "#a38046",
  flower_forest: "#a36d46",
  forest: "#a36d46",
  frozen_ocean: "#8f7a5a",
  frozen_peaks: "#8f7a5a",
  frozen_river: "#8f7a5a",
  grove: "#8f7a5a",
  ice_spikes: "#8f7a5a",
  jagged_peaks: "#8f7a5a",
  jungle: "#a36346",
  lukewarm_ocean: "#a17448",
  lush_caves: "#a17448",
  meadow: "#a17148",
  mushroom_fields: "#a36246",
  nether_wastes: "#a38046",
  ocean: "#a17448",
  old_growth_birch_forest: "#a37246",
  old_growth_pine_taiga: "#9c754d",
  old_growth_spruce_taiga: "#9a764f",
  plains: "#a37546",
  river: "#a17448",
  savanna: "#a38046",
  savanna_plateau: "#a38046",
  small_end_islands: "#a17448",
  snowy_beach: "#917958",
  snowy_plains: "#8f7a5a",
  snowy_slopes: "#8f7a5a",
  snowy_taiga: "#8f7a5a",
  soul_sand_valley: "#a38046",
  sparse_jungle: "#a36646",
  stony_peaks: "#a37946",
  stony_shore: "#967753",
  sulfur_caves: "#a37546",
  sunflower_plains: "#a37546",
  taiga: "#9a764f",
  the_end: "#a17448",
  the_void: "#a17448",
  warm_ocean: "#a17448",
  warped_forest: "#a38046",
  windswept_forest: "#967753",
  windswept_gravelly_hills: "#967753",
  windswept_hills: "#967753",
  windswept_savanna: "#a38046",
  wooded_badlands: "#a38046",
};
function initVanillaBiomes(e, t) {
  if (VBIOME.length) return;
  const s = self.WG_DATA;
  s.biome_order.forEach((n, o) => {
    const i = 32 + o,
      a = s.biome[n],
      c = a.effects || {},
      h = a.attributes || {},
      col = (e, t) => {
        if (t) return hexRGB(t);
        const s = clamp(a.temperature, 0, 1),
          n = 4 * (256 * ((255 * (1 - clamp(a.downfall, 0, 1) * s)) | 0) + ((255 * (1 - s)) | 0));
        return [e[n], e[n + 1], e[n + 2]];
      };
    let l = col(e, c.grass_color);
    if ("dark_forest" === c.grass_color_modifier) {
      const e = (2634762 + (16711422 & ((l[0] << 16) | (l[1] << 8) | l[2]))) >> 1;
      l = [(e >> 16) & 255, (e >> 8) & 255, 255 & e];
    }
    const u = h["minecraft:visual/sky_color"],
      f = h["minecraft:visual/fog_color"],
      p = h["minecraft:audio/background_music"];
    ((VBIOME[i] = {
      name: n,
      def: a,
      cn: s.biome_cn[n] || n,
      precip: !!a.has_precipitation,
      sky: u ? hexRGB(u) : null,
      fog: f ? hexRGB(f) : null,
      grass: l,
      foliage: col(t, c.foliage_color),
      swamp: "swamp" === c.grass_color_modifier,
      dry: hexRGB(c.dry_foliage_color || DRY_FOLIAGE[n] || "#5c3c32"),
      water: hexRGB(c.water_color || "#3f76e4"),
      music: p && p.default ? p.default.sound.replace("minecraft:", "") : null,
      amb: h["minecraft:audio/ambient_sounds"] || null,
    }),
      (BIOMES[i] = VBIOME[i].cn),
      (BIOME_TEMP[i] = a.temperature),
      (BIOME_WATER[i] = VBIOME[i].water));
  });
}
const vbiomeIndex = (e) => self.WG_DATA.biome_order.indexOf(e) + 32;
function parseSeed(e) {
  if (!(e = (e || "").trim())) {
    const r = () => BigInt(Math.floor(4294967296 * Math.random()));
    return BigInt.asIntN(64, (r() << 32n) | r()).toString();
  }
  if (/^[-+]?\d+$/.test(e)) {
    const t = BigInt(e);
    if (t >= -(2n ** 63n) && t < 2n ** 63n) return t.toString();
  }
  let t = 0;
  for (let s = 0; s < e.length; s++) t = (Math.imul(t, 31) + e.charCodeAt(s)) | 0;
  return String(t);
}
const seed32 = (e) => ("number" == typeof e ? 0 | e : Number(BigInt.asIntN(32, BigInt(e)))),
  STATE_ALIAS = {
    cave_air: "air",
    void_air: "air",
    wall_torch: "torch",
    suspicious_gravel: "gravel",
    suspicious_sand: "sand",
    lit_furnace: "furnace",
    bubble_column: "water",
    end_gateway: "end_portal",
  },
  FACE_META = { west: 0, east: 1, north: 4, south: 5 };
function mapVanillaState(e) {
  const t = e.indexOf("["),
    s = t < 0 ? e : e.slice(0, t),
    n = {};
  if (t >= 0)
    for (const s of e.slice(t + 1, -1).split(",")) {
      const [e, t] = s.split("=");
      n[e] = t;
    }
  let o = void 0 !== BID[s] ? s : STATE_ALIAS[s];
  if (
    ("furnace" === o && "true" === n.lit && void 0 !== BID.lit_furnace && (o = "lit_furnace"),
    "air" === o || "air" === s)
  )
    return [0, 0];
  const i = BID[o];
  if (void 0 === i) return null;
  if ((i === WATER || i === LAVA) && void 0 !== n.level) {
    const e = +n.level || 0;
    return [i, e >= 8 ? 8 : e];
  }
  const a = BLOCKS[i];
  if ("redstone_wire" === o && +n.power > 0 && "undefined" != typeof WIRE_ID) {
    const e = Features.stateOf({ Name: o, Properties: n }) || [i, 0];
    return [WIRE_ID[+n.power], e[1]];
  }
  if (a.states) return Features.stateOf({ Name: o, Properties: n }) || [i, 0];
  if (a.facing && n.facing) {
    let e = FACE_META[n.facing] ?? 0;
    return (
      a.chestLike && ("left" === n.type ? (e |= 16) : "right" === n.type && (e |= 32)),
      [i, e]
    );
  }
  if (a.axis && n.axis) return [i, { y: 0, x: 1, z: 2 }[n.axis]];
  if (t < 0) return [i, 0];
  let c = 0,
    h = -1e9;
  for (let e = 0; e < 64; e++) {
    const t = vanillaState(a, e, null);
    if (t.key !== s && ("wall_torch" !== s || "wall_torch" !== t.key)) continue;
    let o = 0;
    for (const e in n) void 0 !== t.p[e] && (o += String(t.p[e]) === n[e] ? 1 : -10);
    o > h && ((h = o), (c = e));
  }
  return [i, c];
}
const NEAR_WOODS = [
    "spruce",
    "birch",
    "jungle",
    "acacia",
    "cherry",
    "dark_oak",
    "pale_oak",
    "mangrove",
    "bamboo",
    "crimson",
    "warped",
  ],
  NEAR_COLORS = [
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
  ],
  NEAR_SHAPES = [
    ["_wall_hanging_sign", "oak_wall_sign"],
    ["_hanging_sign", "oak_sign"],
    ["_wall_sign", "oak_wall_sign"],
    ["_sign", "oak_sign"],
    ["_fence_gate", "oak_fence_gate"],
    ["_pressure_plate", "stone_pressure_plate", "oak_pressure_plate"],
    ["_trapdoor", "oak_trapdoor"],
    ["_door", "oak_door"],
    ["_stairs", "stone_stairs", "cobblestone_stairs", "oak_stairs"],
    ["_slab", "stone_slab", "smooth_stone_slab", "cobblestone_slab", "oak_slab"],
    ["_wall", "cobblestone_wall"],
    ["_fence", "oak_fence"],
    ["_button", "stone_button", "oak_button"],
    ["_planks", "oak_planks"],
    ["_log", "oak_log"],
    ["_wood", "oak_log"],
    ["_hyphae", "oak_log"],
    ["_stem", "oak_log"],
    ["_leaves", "oak_leaves"],
    ["_sapling", "oak_sapling"],
    ["_bricks", "stone_bricks", "bricks"],
    ["_tiles", "stone_bricks"],
    ["_pillar", "quartz_block", "stone"],
    ["_ore", "stone"],
    ["_rail", "rail"],
    ["shulker_box", "chest"],
    ["_carpet", "white_carpet"],
    ["_candle", "candle"],
    ["_wall_torch", "wall_torch"],
    ["_torch", "torch"],
    ["_lantern", "lantern"],
    ["_bars", "iron_bars"],
    ["_chain", "chain", "iron_chain"],
    ["_grate", "glass"],
    ["_bulb", "redstone_lamp"],
    ["_froglight", "glowstone"],
    ["_coral_block", "stone"],
    ["_concrete_powder", "sand"],
    ["_block", "stone"],
  ];
function nearNames(e) {
  const t = [],
    add = (s) => {
      s && s !== e && !t.includes(s) && t.push(s);
    },
    s = e
      .replace(/^(waxed_|stripped_|infested_|potted_|dead_)+/, "")
      .replace(/^(exposed_|weathered_|oxidized_)/, "");
  add(s);
  for (const e of NEAR_WOODS) s.startsWith(e + "_") && add("oak_" + s.slice(e.length + 1));
  for (const e of NEAR_COLORS)
    if (s.startsWith(e + "_")) {
      const t = s.slice(e.length + 1);
      for (const e of NEAR_COLORS) add(e + "_" + t);
      add(t);
    }
  (add(s.replace(/_concrete_powder$/, "_concrete")),
    add(s.replace(/_glazed_terracotta$/, "_terracotta")),
    /glass_pane$/.test(s) ? add("glass_pane") : /glass$/.test(s) && add("glass"),
    s.includes("copper_") && (add(s.replace("copper_", "iron_")), add(s.replace("copper_", ""))),
    s.startsWith("soul_") && add(s.slice(5)),
    s.endsWith("candle_cake") && add("cake"));
  for (const [e, ...t] of NEAR_SHAPES)
    if (s.endsWith(e)) {
      for (const e of t) add(e);
      break;
    }
  return t;
}
const nearCache = new Map();
function mapVanillaStateNear(e) {
  const t = mapVanillaState(e);
  if (t) return t;
  let s = nearCache.get(e);
  if (void 0 !== s) return s;
  s = null;
  const n = e.indexOf("["),
    o = n < 0 ? e : e.slice(0, n),
    i = n < 0 ? "" : e.slice(n);
  for (const e of nearNames(o)) {
    let t = null;
    try {
      t = mapVanillaState(e + i);
    } catch (e) {}
    if (t && t[0]) {
      s = [t[0], t[1], !0];
      break;
    }
  }
  return (nearCache.set(e, s), s);
}
function structStateMap() {
  if (structStateMap.cache) return structStateMap.cache;
  const e = self.STRUCT_DATA;
  if (!e || "undefined" == typeof Features) return null;
  const t = new Int32Array(2 * e.states.length),
    s = new Set(),
    n = (structStateMap.wl = new Uint8Array(e.states.length));
  return (
    e.states.forEach((e, o) => {
      let i = null;
      const a = e.split("[")[0];
      if (!["structure_void", "structure_block", "jigsaw"].includes(a))
        try {
          i = mapVanillaState(e);
        } catch (e) {
          i = null;
        }
      if (i)
        ((t[2 * o] = i[0]),
          (t[2 * o + 1] = i[1]),
          i[0] > 0 &&
            canWaterlog(i[0], i[1]) &&
            (n[o] = 2 | (e.includes("waterlogged=true") ? 1 : 0)));
      else {
        t[2 * o] = -1;
        const n = e.split("[")[0];
        ["structure_void", "structure_block", "jigsaw"].includes(n) || s.add(n);
      }
    }),
    s.size && console.info("structure blocks the game does not have:", [...s].join(" ")),
    (structStateMap.cache = t)
  );
}
class InlineGenWorker {
  constructor() {
    ((this.core = self.makeGenCore()),
      (this.q = []),
      (this.running = !1),
      (this.onmessage = null),
      (this.inline = !0),
      (this.genFrame = -1),
      (this.nextT = 0));
  }
  postMessage(e) {
    (this.q.push(e), this.kick());
  }
  kick() {
    this.running || this.dead || ((this.running = !0), setTimeout(() => this.step(), 0));
  }
  async step() {
    const e = this.q.length && "gen" === this.q[0].type;
    if (e) {
      const e = performance.now();
      if (this.genFrame === InlineGenWorker.frame || e < this.nextT)
        return (
          (this.running = !1),
          void setTimeout(() => this.kick(), Math.max(4, Math.min(50, this.nextT - e)))
        );
      this.genFrame = InlineGenWorker.frame;
    }
    const t = this.q.shift(),
      s = performance.now();
    if (
      (t &&
        !this.dead &&
        (await this.core(t, (e) => {
          !this.dead && this.onmessage && this.onmessage({ data: e });
        })),
      e)
    ) {
      const e = performance.now(),
        t = window.game && "loading" === game.state;
      this.nextT = t ? 0 : e + Math.min(1e3, 2 * (e - s));
    }
    ((this.running = !1), this.q.length && this.kick());
  }
  terminate() {
    ((this.dead = !0), (this.q = []));
  }
}
InlineGenWorker.frame = 0;
const newGenWorker = () => {
  if (!GenPool.inline)
    try {
      return new Worker("js/gen_worker.js" + Mods.workerQuery());
    } catch (e) {
      ((GenPool.inline = !0),
        console.info("worldgen: workers unavailable (" + e.name + "), generating in the page"));
    }
  return new InlineGenWorker();
};
class GenPool {
  constructor(e) {
    ((this.seed = String(e)), "file:" === location.protocol && (GenPool.inline = !0));
    const t = GenPool.inline ? 1 : genWorkerCount(),
      s = { air: 0 };
    for (const e in BID) s[e] = BID[e];
    ((this.workers = []),
      (this.queue = []),
      (this.wait = new Map()),
      (this.nextId = 1),
      (this.dead = !1),
      (this.keys = new Map()),
      (this.okN = 0),
      (this.errRun = 0),
      (this.errSeen = new Set()),
      (this.init = {
        type: "init",
        seed: this.seed,
        palette: s,
        smap: structStateMap(),
        swl: structStateMap.wl,
        ...(self.SFE_GEN ? { dim: self.SFE_GEN } : {}), // W10c：SFE 世界使用 noise_settings.sfe（sfe_world.js 置位）
      }),
      (this.ready = new Promise((e) => {
        this.readyRes = e;
      })));
    for (let e = 0; e < t; e++) this.spawn(0);
  }
  spawn(e) {
    const t = newGenWorker();
    ((t.busy = 0),
      (t.jobs = new Map()),
      (t.onmessage = (s) => {
        const n = s.data;
        ((t.jobT = performance.now()),
          (t.heard = !0),
          n && "error" !== n.type && "ready" !== n.type && (e = 0),
          this.onMessage(t, n));
      }),
      (t.onerror = (s) => {
        if ((s && s.preventDefault && s.preventDefault(), this.workers.includes(t))) {
          (console.warn(
            "worldgen: worker failed (" + ((s && s.message) || "error") + "), restarting",
          ),
            (this.workers = this.workers.filter((e) => e !== t)));
          try {
            t.terminate();
          } catch (e) {}
          (this.queue.unshift(...t.jobs.values()),
            t.jobs.clear(),
            this.dead ||
              (e < 5
                ? setTimeout(
                    () => {
                      this.dead || this.spawn(e + 1);
                    },
                    250 * (e + 1),
                  )
                : this.workers.length || ((GenPool.inline = !0), this.spawn(0)),
              this.pump()));
        }
      }),
      t.postMessage(this.init),
      this.workers.push(t),
      this.pump());
  }
  onMessage(e, t) {
    if (t && this.workers.includes(e))
      if ("ready" !== t.type) {
        if (
          ("error" === t.type
            ? this.workerError(t)
            : "chunk" === t.type &&
              (this.okN++, (this.errRun = 0), t.warn && this.workerError({ message: t.warn }, !0)),
          void 0 === t.id)
        )
          return (
            (e.broken = !0),
            void (
              this.okN ||
              GenPool.inline ||
              this.dead ||
              !this.workers.every((e) => e.broken) ||
              this.goInline(String(t.message || "").split("\n")[0])
            )
          );
        e.jobs.has(t.id) &&
          (e.jobs.delete(t.id),
          (e.busy = Math.max(0, e.busy - 1)),
          this.answer(t.id, t),
          this.pump());
      } else this.readyRes();
  }
  answer(e, t) {
    const s = this.wait.get(e);
    if (s) {
      if ((this.wait.delete(e), s.key)) {
        const e = this.keys.get(s.key) - 1;
        e > 0 ? this.keys.set(s.key, e) : this.keys.delete(s.key);
      }
      if (!this.dead)
        try {
          s.cb(t);
        } catch (e) {
          window.game && game.reportError && game.reportError("worldgen " + (t && t.type), e, !0);
        }
    }
  }
  workerError(e, t) {
    const s = String(e.message || "error"),
      n = s.split("\n")[0].slice(0, 200);
    if (!this.errSeen.has(n) && this.errSeen.size < 8) {
      (this.errSeen.add(n), console.error("worldgen:", s));
      const e = new Error(n);
      ((e.stack = s),
        window.game &&
          game.reportError &&
          game.reportError(t ? "地形生成线程（结构）" : "地形生成线程出错", e, !0));
    }
    t ||
      (this.errRun++,
      !this.okN && this.errRun >= 6 && !GenPool.inline && !this.dead && this.goInline(n));
  }
  goInline(e) {
    (console.warn("worldgen: the workers only fail (" + e + "), generating in the page"),
      window.game &&
        game.reportError &&
        game.reportError("地形生成线程不能用，改在页面里生成", new Error(e), !0),
      (GenPool.inline = !0));
    for (const e of this.workers) {
      try {
        e.terminate();
      } catch (e) {}
      (this.queue.unshift(...e.jobs.values()), e.jobs.clear());
    }
    ((this.workers = []), this.spawn(0));
  }
  request(e, t) {
    e.id = this.nextId++;
    const s = "gen" === e.type ? (e.dim || "overworld") + ":" + ckey(e.cx, e.cz) : null;
    (s && this.keys.set(s, (this.keys.get(s) || 0) + 1),
      this.wait.set(e.id, { cb: t, key: s }),
      this.queue.push(e),
      this.pump());
  }
  asked(e, t) {
    return this.keys.has((e || "overworld") + ":" + t);
  }
  pump() {
    for (const e of this.workers)
      for (; e.busy < 2 && this.queue.length;) {
        const t = this.queue.shift();
        (e.busy || (e.jobT = performance.now()), e.busy++, e.jobs.set(t.id, t), e.postMessage(t));
      }
  }
  check() {
    if (GenPool.inline || this.dead) return;
    const e = performance.now();
    if (!(e - (this.checkT || 0) < 2e3)) {
      this.checkT = e;
      for (const t of [...this.workers]) {
        if (!t.busy) {
          ((t.jobT = 0), (t.suspect = 0));
          continue;
        }
        const s = t.jobs.values().next().value,
          n = t.heard ? (s && "gen" !== s.type ? 9e4 : 3e4) : 6e4;
        if (e - t.jobT < n) {
          t.suspect = 0;
          continue;
        }
        if (!t.suspect) {
          t.suspect = e;
          continue;
        }
        (console.warn("worldgen: a worker stopped answering, restarting it"),
          window.game &&
            game.reportError &&
            game.reportError("地形生成线程无响应（已重启）", new Error("worker timeout"), !0));
        const o = t.jobs.values().next().value;
        (o &&
          (o.strikes = (o.strikes || 0) + 1) >= 2 &&
          (t.jobs.delete(o.id),
          t.busy--,
          this.answer(o.id, {
            type: "error",
            id: o.id,
            message: "timeout: the job stopped two workers",
            timeout: !0,
          })),
          t.onerror({ message: "timeout" }));
      }
    }
  }
  inflight() {
    return this.wait.size;
  }
  terminate() {
    this.dead = !0;
    for (const e of this.workers) e.terminate();
    this.workers = [];
  }
  reseed(e) {
    ((this.seed = String(e)),
      (this.init = Object.assign({}, this.init, { seed: this.seed })),
      (this.ready = new Promise((e) => {
        this.readyRes = e;
      })),
      (this.queue = []),
      this.wait.clear(),
      this.keys.clear(),
      (this.errRun = 0));
    for (const e of this.workers)
      (e.jobs.clear(),
        (e.busy = 0),
        (e.jobT = 0),
        (e.suspect = 0),
        (e.broken = !1),
        e.postMessage(this.init));
    this.pump();
  }
}
Game.prototype.genSetup = function (e) {
  return this.genPool && this.genPool.seed === String(e)
    ? this.genPool.ready
    : this.genPool &&
        !this.genPool.dead &&
        this.genPool.workers.length &&
        !this.genPool.workers.every((e) => e.broken)
      ? (this.genPool.reseed(e),
        initVanillaBiomes(this.renderer.grassMap, this.renderer.foliageMap),
        (this.genPending = new Set()),
        this.genPool.ready)
      : (this.genPool && this.genPool.terminate(),
        this.chunkWorker || (this.chunkWorker = new ChunkWorker(this)),
        initVanillaBiomes(this.renderer.grassMap, this.renderer.foliageMap),
        (this.genPool = new GenPool(e)),
        (this.genPending = new Set()),
        this.genPool.ready);
};
class ChunkWorker {
  constructor(e) {
    ((this.game = e),
      (this.ready = !1),
      (this.failed = !1),
      (this.epoch = 0),
      (this.world = null),
      (this.meshCb = new Map()),
      (this.nextId = 1),
      (this.asking = new Map()),
      (this.askN = 0),
      (this.inQ = new Set()),
      (this.poison = new Map()),
      (this.poisonId = ""),
      (this.restarts = 0),
      ("file:" !== location.protocol && "undefined" != typeof Worker && this.start()) ||
        (this.failed = !0));
  }
  start() {
    let e;
    try {
      e = this.w = new Worker("js/chunk_worker.js" + Mods.workerQuery());
    } catch (e) {
      return !1;
    }
    return (
      (this.startT = performance.now()),
      (this.ready = !1),
      (this.pingT = 0),
      (this.suspect = 0),
      (this.last = null),
      (e.onmessage = (t) => {
        if (e !== this.w) return;
        const s = t.data;
        ((this.lastMsg = performance.now()),
          (this.last = s && "work" === s.type ? s : null),
          this.onMessage(s));
      }),
      (e.onerror = (t) => {
        if ((t && t.preventDefault && t.preventDefault(), e !== this.w || this.failed)) return;
        const s = new Error((t && t.message) || "error");
        ((s.stack = t && t.filename ? t.filename + ":" + t.lineno : ""),
          this.game.reportError("区块线程出错", s, !0),
          this.restart(t && t.message));
      }),
      !0
    );
  }
  fail(e) {
    if (!this.failed) {
      (console.warn("chunk worker unavailable (" + e + "), staying on the main thread"),
        (this.failed = !0),
        (this.ready = !1));
      try {
        this.w.terminate();
      } catch (e) {}
      (this.world && ((this.world.protoKeys = null), (this.world.useCW = !1)),
        this.asking.clear(),
        this.inQ.clear());
      for (const e of this.meshCb.values()) e(null);
      this.meshCb.clear();
    }
  }
  restart(e) {
    if (!this.failed)
      if (this.restarts >= 3) this.fail(e);
      else {
        (this.restarts++, console.warn("chunk worker: " + e + ", starting a new one"));
        try {
          this.w.terminate();
        } catch (e) {}
        for (const e of this.meshCb.values()) e(null);
        (this.meshCb.clear(),
          this.asking.clear(),
          this.start()
            ? this.world &&
              (this.world === this.game.world ? this.reset(this.world, !0) : (this.world = null))
            : this.fail(e + "; no new worker"));
      }
  }
  check() {
    if (this.failed) return;
    const e = performance.now();
    if (!this.ready)
      return void (
        e - this.startT > 6e4 &&
        (this.game.reportError(
          "区块线程启动不了",
          new Error("chunk worker not ready after 60 s"),
          !0,
        ),
        this.restart("not ready after 60 s"))
      );
    !this.pingT || this.lastMsg >= this.pingT
      ? ((this.suspect = 0),
        e - (this.pingT || 0) > 5e3 && ((this.pingT = e), this.post({ type: "ping" })))
      : e - this.pingT > 2e4 &&
        (this.suspect ? e - this.suspect > 3e3 && this.stuck() : (this.suspect = e));
  }
  stuck() {
    const e = this.last,
      t = e && "work" === e.type && this.world ? e.k : void 0;
    if (void 0 !== t) {
      const s = ChunkWorker.genId(this.world);
      (s !== this.poisonId && (this.poison.clear(), (this.poisonId = s)), this.poison.set(t, e.s));
    }
    const s =
      void 0 !== t
        ? " at chunk " +
          (Math.floor(t / 65536) - 32768) +
          "," +
          ((t % 65536) - 32768) +
          " stage " +
          e.s
        : "";
    (this.game.reportError(
      this.restarts < 3 ? "区块线程无响应（已重启）" : "区块线程无响应（改在主线程生成）",
      new Error("chunk worker timeout" + s),
      !0,
    ),
      this.restart("no answer for 20 s" + s));
  }
  post(e, t) {
    if ("unloaded" === e.type && e.keys.length) {
      e.ask = ++this.askN;
      for (const t of e.keys) this.asking.set(t, e.ask);
    }
    this.w.postMessage(e, t || []);
  }
  reset(e, t) {
    const s = this.game,
      n = t && this.world === e ? (s.finalQ || []).filter((e) => e.epoch === this.epoch) : [];
    (this.epoch++,
      (this.world = e),
      (e.protoKeys = new Set()),
      (this.sent = null),
      this.asking.clear(),
      this.inQ.clear(),
      (s.finalQ = n),
      this.post({
        type: "reset",
        epoch: this.epoch,
        seed: e.seedStr,
        dim: e.dim,
        minY: e.minY || 0,
        structures: !1 !== e.structures,
      }),
      this.opts());
    const o = [],
      i = [];
    for (const t of e.chunks.values()) (o.push(ckey(t.cx, t.cz)), i.push(t.biome));
    for (const e of n) {
      e.epoch = this.epoch;
      const t = ckey(e.cx, e.cz);
      (this.inQ.add(t), o.push(t), i.push(e.biome));
    }
    if (o.length) {
      const e = new Uint8Array(256 * o.length);
      (i.forEach((t, s) => {
        t && e.set(t, 256 * s);
      }),
        this.post({ type: "have", epoch: this.epoch, keys: o, biomes: e }, [e.buffer]));
    }
    const a = this.poisonFor(e);
    a && this.post({ type: "skip", keys: [...a.keys()], stages: [...a.values()] });
  }
  poisonFor(e) {
    return this.poison.size && e && this.poisonId === ChunkWorker.genId(e) ? this.poison : null;
  }
  static genId(e) {
    return e.seedStr + ":" + (e.dim || "overworld") + ":" + (!1 !== e.structures);
  }
  opts() {
    this.failed || this.post({ type: "opts", fastLeaves: FAST_LEAVES });
  }
  center(e, t, s) {
    const n = e + "," + t + "," + s;
    n !== this.sent &&
      ((this.sent = n), this.post({ type: "center", epoch: this.epoch, cx: e, cz: t, R: s }));
  }
  mesh(e, t) {
    const s = this.nextId++;
    (this.meshCb.set(s, t),
      (e.type = "mesh"),
      (e.id = s),
      this.post(e, [
        e.ids.buffer,
        e.metas.buffer,
        e.lights.buffer,
        e.tints.buffer,
        e.tints2.buffer,
        e.biomes.buffer,
      ]));
  }
  onMessage(e) {
    const t = this.game,
      s = this.world;
    switch (e.type) {
      case "ready":
        this.ready = !0;
        break;
      case "mesh": {
        this.lastMesh = performance.now();
        const t = this.meshCb.get(e.id);
        (this.meshCb.delete(e.id), t && t(e.error ? null : e));
        break;
      }
      case "final": {
        if (e.epoch !== this.epoch || !s || !s.protoKeys) break;
        const n = ckey(e.cx, e.cz);
        if ((s.protoKeys.delete(n), (t.genProgressT = performance.now()), this.asking.has(n))) {
          const t = new Uint8Array(256);
          (e.biome && t.set(e.biome),
            this.post({ type: "have", epoch: this.epoch, keys: [n], biomes: t }, [t.buffer]));
        }
        (this.inQ.add(n), (t.finalQ || (t.finalQ = [])).push(e));
        break;
      }
      case "held": {
        for (const [t, s] of this.asking) s === e.ask && this.asking.delete(t);
        if (e.epoch !== this.epoch || !s || !s.protoKeys) break;
        const t = new Set();
        for (const n of e.keys) {
          if (s.chunks.has(n)) continue;
          s.protoKeys.add(n);
          const e = Math.floor(n / 65536) - 32768,
            o = (n % 65536) - 32768;
          for (let n = -1; n <= 1; n++)
            for (let i = -1; i <= 1; i++) {
              const a = ckey(e + n, o + i);
              (n || i) && s.chunks.has(a) && t.add(a);
            }
        }
        if (t.size) {
          const e = [...t],
            n = new Uint8Array(256 * e.length);
          (e.forEach((e, t) => n.set(s.chunks.get(e).biome, 256 * t)),
            this.post({ type: "have", epoch: this.epoch, keys: e, biomes: n }, [n.buffer]));
        }
        break;
      }
      case "work":
      case "pong":
        break;
      case "dropped":
        if (e.epoch === this.epoch && s && s.protoKeys)
          for (const t of e.keys) s.protoKeys.delete(t);
        break;
      case "stats":
        this.stats = e;
        break;
      case "error": {
        const s = new Error(e.msg);
        ((s.stack = e.stack), t.reportError("区块线程 " + e.where, s, !0));
        break;
      }
    }
  }
  inflightMeshes() {
    return this.meshCb.size;
  }
}
((Game.prototype.finishFromWorker = function (e) {
  const t = this.world,
    s = ckey(e.cx, e.cz),
    n = this.chunkWorker;
  if (!t.chunks.has(s) && n && n.world === t && e.epoch === n.epoch) {
    if (e.broken)
      return (
        this.reportError("chunk " + e.cx + "," + e.cz, new Error(e.broken), !0),
        void this.finishStub(t, e.cx, e.cz)
      );
    try {
      this.finishFromWorkerIn(e, t, s);
    } catch (n) {
      if ((this.reportError("chunk " + e.cx + "," + e.cz, n, !0), !t.chunks.has(s)))
        try {
          this.finishChunk(new Chunk(e.cx, e.cz), !1);
        } catch (n) {
          t.chunks.set(s, new Chunk(e.cx, e.cz));
        }
    }
  }
}),
  (Game.prototype.finishFromWorkerIn = function (e, t, s) {
    const n = Chunk.fromWire(e.cx, e.cz, e.sec);
    (n.biome.set(e.biome),
      (n.final = !0),
      (n.sx = e.sx),
      (n.nb = e.nb),
      e.sx && e.sx.wl && (n.wl = new Set(e.sx.wl)));
    const o = t.savedChunks && t.savedChunks.get(s);
    (o && decodeChunk(o, n),
      n.sx && this.structureExtras(n, !!o),
      this.chunkTints(n),
      (n.nb = null),
      this.finishChunk(n, !!o));
  }),
  (Game.prototype.finishStub = function (e, t, s) {
    const n = e.savedChunks && e.savedChunks.get(ckey(t, s));
    if (n)
      try {
        const o = new Chunk(t, s);
        (decodeChunk(n, o), (o.final = !0));
        for (const [n, i] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const a = e.chunks.get(ckey(t + n, s + i));
          if (a) {
            o.biome.set(a.biome);
            break;
          }
        }
        return (this.chunkTints(o), void this.finishChunk(o, !0));
      } catch (e) {
        this.reportError("chunk " + t + "," + s, e, !0);
      }
    e.chunks.has(ckey(t, s)) || this.finishChunk(new Chunk(t, s), !1);
  }),
  (Game.prototype.genSpawn = function () {
    const e = this.genPool,
      ask = (t) =>
        new Promise((t) => e.request({ type: "spawn" }, t)).then((s) =>
          s && "spawn" === s.type && Number.isFinite(s.x) && Number.isFinite(s.z)
            ? [s.x, s.z]
            : t < 4 && !e.dead
              ? new Promise((e) => setTimeout(e, 1e3)).then(() => ask(t + 1))
              : [0, 0],
        );
    return e.ready.then(() => ask(0));
  }),
  (Game.prototype.genStep = function (e, t, s, n, o) {
    const i = this.world,
      a = this.genPool;
    if (!a) return;
    a.check();
    const c = this.chunkWorker;
    c && c.check();
    const h = i.proto || (i.proto = new Map()),
      l = this.genPending;
    (void 0 === i.useCW && (i.useCW = !(!c || c.failed || h.size)),
      !i.useCW || (c && !c.failed) || (i.useCW = !1));
    const u = i.useCW;
    (u && c.world !== i && c.reset(i), u || i.spills || (i.spills = new Map()));
    const f = u
        ? (e, t) => {
            const s = ckey(e, t);
            return i.chunks.has(s) || i.protoKeys.has(s) || c.asking.has(s) || c.inQ.has(s);
          }
        : (e, t) => i.chunks.has(ckey(e, t)) || h.has(ckey(e, t)),
      p = s + 4,
      d = performance.now(),
      k = i.genFails;
    if (a.inflight() < 3 * a.workers.length) {
      const n = [];
      for (let o = -p; o <= p; o++)
        for (let c = -p; c <= p; c++) {
          const h = o * o + c * c;
          if (h > (s + 4.5) * (s + 4.5)) continue;
          const u = e + o,
            p = t + c,
            g = ckey(u, p);
          if (!(l.has(g) || f(u, p) || a.asked(i.dim, g))) {
            if (k) {
              const e = k.get(g);
              if (e && d < e.until) continue;
            }
            n.push([u, p, h]);
          }
        }
      n.sort((e, t) => e[2] - t[2]);
      const o = this.genEpoch;
      for (const [e, t] of n.slice(0, 3 * a.workers.length - a.inflight())) {
        const s = ckey(e, t);
        (l.add(s),
          this.savedReady(i, s),
          a.request(
            {
              type: "gen",
              cx: e,
              cz: t,
              dim: i.dim,
              height: HEIGHT,
              structures: !1 !== i.structures,
            },
            (n) => {
              (l.delete(s), this.genEpoch === o && this.world === i && this.genAnswer(i, e, t, n));
            },
          ));
      }
    }
    if (u) {
      c.center(e, t, s);
      const a = this.finalQ;
      if (a && a.length) {
        a.sort((s, n) => (n.cx - e) ** 2 + (n.cz - t) ** 2 - ((s.cx - e) ** 2 + (s.cz - t) ** 2));
        const s = [];
        for (; a.length && this.workFits(n, 0.8 * o, "finalise");) {
          const e = a.pop(),
            t = ckey(e.cx, e.cz);
          this.savedReady(i, t)
            ? (c.inQ.delete(t), this.timedWork("finalise", () => this.finishFromWorker(e)))
            : s.push(e);
        }
        for (const e of s) a.push(e);
      }
      return;
    }
    const g = [];
    for (const n of h.values()) {
      const o = n.cx - e,
        i = n.cz - t,
        a = o * o + i * i;
      a > (s + 3) * (s + 3) || g.push([n, a]);
    }
    g.sort((e, t) => e[1] - t[1]);
    const around = (e, t) => {
        for (let s = -1; s <= 1; s++)
          for (let n = -1; n <= 1; n++) {
            if (!s && !n) continue;
            const o = h.get(ckey(e.cx + s, e.cz + n));
            if (!o || !t(o)) {
              if (!o && i.chunks.has(ckey(e.cx + s, e.cz + n))) continue;
              return !1;
            }
          }
        return !0;
      },
      w = c ? c.poisonFor(i) : null;
    for (const [e, t] of g) {
      if (!this.workFits(n, 0.6 * o, "decorate")) break;
      1 === e.stage &&
        around(e, () => !0) &&
        ((w && 1 === w.get(ckey(e.cx, e.cz))) ||
          this.timedWork("decorate", () =>
            this.guard("decorate " + e.cx + "," + e.cz, () => this.decorateChunk(e)),
          ),
        (e.stage = 2));
    }
    for (const [e, t] of g) {
      if (!this.workFits(n, 0.8 * o, "finalise")) break;
      2 === e.stage &&
        t <= (s + 1.5) * (s + 1.5) &&
        around(e, (e) => 2 === e.stage) &&
        this.savedReady(i, ckey(e.cx, e.cz)) &&
        this.timedWork("finalise", () => {
          const t = ckey(e.cx, e.cz);
          if (w && 2 === w.get(t))
            return (h.delete(t), void (i.chunks.has(t) || this.finishStub(i, e.cx, e.cz)));
          try {
            this.finaliseChunk(e);
          } catch (t) {
            this.reportError("chunk " + e.cx + "," + e.cz, t, !0);
            const s = ckey(e.cx, e.cz);
            (h.delete(s), i.chunks.has(s) || this.finishChunk(new Chunk(e.cx, e.cz), !1));
          }
        });
    }
    if (this.tickCount % 40 == 0)
      for (const n of [...h.values()]) {
        const o = n.cx - e,
          i = n.cz - t;
        o * o + i * i > (s + 5.5) * (s + 5.5) && h.delete(ckey(n.cx, n.cz));
      }
    this.tickCount % 40 == 0 &&
      i.spills &&
      "undefined" != typeof Features &&
      Features.pruneSpill(i, (e) => h.has(e) || i.chunks.has(e));
  }),
  (Game.prototype.genAnswer = function (e, t, s, n) {
    const o = ckey(t, s);
    if (((this.genProgressT = performance.now()), n && "chunk" === n.type && n.blocks && n.sb))
      return (e.genFails && e.genFails.delete(o), void this.genReceive(n));
    const i = e.genFails || (e.genFails = new Map()),
      a = i.get(o) || { n: 0 };
    if (
      (a.n++,
      (a.until = performance.now() + Math.min(1e4, 250 * 2 ** a.n)),
      i.set(o, a),
      (a.n >= 4 || (n && n.timeout)) && this.genPool && this.genPool.okN > 0)
    ) {
      (i.delete(o),
        this.reportError(
          "chunk " + t + "," + s,
          new Error(
            "generation failed (" +
              String((n && n.message) || "no answer").split("\n")[0] +
              "): left empty",
          ),
          !0,
        ));
      const a = Math.max(0, vbiomeIndex("the_void") - 32);
      this.genReceive({
        type: "chunk",
        cx: t,
        cz: s,
        blocks: new Uint16Array(256 * HEIGHT),
        qb: new Uint8Array(16 * (HEIGHT >> 2)).fill(a),
        hm: new Int16Array(256).fill((e.minY || 0) - 1),
        sb: new Uint8Array(256).fill(a),
      });
    }
  }),
  (Game.prototype.genReceive = function (e) {
    if (!e || "chunk" !== e.type || !e.blocks || !e.sb) return;
    const t = this.world,
      s = ckey(e.cx, e.cz);
    if (t.useCW && this.chunkWorker && !this.chunkWorker.failed) {
      if (t.chunks.has(s) || t.protoKeys.has(s) || this.chunkWorker.inQ.has(s)) return;
      if (e.sx) {
        const s = t.structRefs || (t.structRefs = new Map());
        for (const [t, n, o] of e.sx.refs)
          s.set(t + ":" + n[0] + "," + n[2], { name: t, box: n, f: o });
      }
      const n = {
          type: "proto",
          epoch: this.chunkWorker.epoch,
          cx: e.cx,
          cz: e.cz,
          blocks: e.blocks,
          qb: e.qb,
          hm: e.hm,
          sb: e.sb,
          meta: e.meta,
          sx: e.sx,
        },
        o = [e.blocks.buffer];
      e.meta && o.push(e.meta.buffer);
      try {
        (this.chunkWorker.post(n, o), t.protoKeys.add(s));
      } catch (t) {
        this.reportError("chunk " + e.cx + "," + e.cz, t, !0);
      }
      return;
    }
    if (t.chunks.has(s) || t.proto.has(s)) return;
    const n = Chunk.from(e.cx, e.cz, e.blocks, e.sx ? e.meta : null);
    if (((n.qb = e.qb), (n.hm = e.hm), e.sx)) {
      ((n.sx = e.sx), e.sx.wl && e.sx.wl.length && (n.wl = new Set(e.sx.wl)));
      const s = t.structRefs || (t.structRefs = new Map());
      for (const [t, n, o] of e.sx.refs)
        s.set(t + ":" + n[0] + "," + n[2], { name: t, box: n, f: o });
    }
    for (let t = 0; t < 256; t++) n.biome[t] = 32 + e.sb[t];
    ((n.stage = 1),
      t.proto.set(s, n),
      t.spills && "undefined" != typeof Features && Features.applySpill(t, n, !1, genDecorated(t)));
  }));
const genDecorated = (e) => (t) => {
  const s = e.proto.get(t);
  return s ? 2 === s.stage : e.chunks.has(t);
};
((Game.prototype.decorateChunk = function (e) {
  const t = this.world;
  if (!1 !== t.structures) for (const s of t.structuresFor(e.cx, e.cz)) s.apply(e);
  "undefined" != typeof Features &&
    (Features.decorate(this, t, e), t.spills && Features.applySpill(t, e, !0, genDecorated(t)));
}),
  (Game.prototype.finaliseChunk = function (e) {
    const t = this.world,
      s = ckey(e.cx, e.cz);
    (t.proto.delete(s), (e.final = !0));
    const n = t.savedChunks && t.savedChunks.get(s);
    (n && decodeChunk(n, e),
      e.sx && this.structureExtras(e, !!n),
      this.chunkTints(e),
      e.recount(),
      this.finishChunk(e, !!n));
  }),
  (Game.prototype.chunkTints = function (e) {
    const t = this.world,
      s = 16 * e.cx,
      n = 16 * e.cz,
      o = e.nb,
      i = o
        ? (t, s) =>
            o[((3 * ((s >> 4) - e.cz + 1) + (t >> 4) - e.cx + 1) << 8) | ((15 & s) << 4) | (15 & t)]
        : (s, n) => {
            const o =
              s >> 4 === e.cx && n >> 4 === e.cz
                ? e
                : t.chunks.get(ckey(s >> 4, n >> 4)) ||
                  (t.proto && t.proto.get(ckey(s >> 4, n >> 4)));
            return o ? o.biome[((15 & n) << 4) | (15 & s)] : e.biome[((15 & n) << 4) | (15 & s)];
          },
      swamp = (e, t) =>
        WG.infoNoise().get(0.0225 * e, 0.0225 * t) < -0.1 ? [76, 118, 60] : [106, 112, 57],
      a = e.water || (e.water = new Uint8Array(768)),
      c = e.dry || (e.dry = new Uint8Array(768));
    for (let t = 0; t < 16; t++)
      for (let o = 0; o < 16; o++) {
        let h = 0,
          l = 0,
          u = 0,
          f = 0,
          p = 0,
          d = 0,
          k = 0,
          g = 0,
          w = 0,
          _ = 0,
          m = 0,
          y = 0,
          b = 0;
        for (let e = -2; e <= 2; e++)
          for (let a = -2; a <= 2; a++) {
            const c = s + o + a,
              v = n + t + e,
              x = VBIOME[i(c, v)];
            if (!x) continue;
            const E = x.swamp ? swamp(c, v) : x.grass;
            ((h += E[0]),
              (l += E[1]),
              (u += E[2]),
              (f += x.foliage[0]),
              (p += x.foliage[1]),
              (d += x.foliage[2]),
              (k += x.water[0]),
              (g += x.water[1]),
              (w += x.water[2]),
              (_ += x.dry[0]),
              (m += x.dry[1]),
              (y += x.dry[2]),
              b++);
          }
        const v = 3 * (16 * t + o);
        ((e.grass[v] = h / 25),
          (e.grass[v + 1] = l / 25),
          (e.grass[v + 2] = u / 25),
          (e.foliage[v] = f / 25),
          (e.foliage[v + 1] = p / 25),
          (e.foliage[v + 2] = d / 25),
          b
            ? ((a[v] = k / b),
              (a[v + 1] = g / b),
              (a[v + 2] = w / b),
              (c[v] = _ / b),
              (c[v + 1] = m / b),
              (c[v + 2] = y / b))
            : (a.set(BIOME_WATER_DEFAULT, v), c.set(DRY_FOLIAGE_DEFAULT, v)));
      }
  }),
  (Game.prototype.vbiomeAt = function (e, t) {
    const s = this.world.getChunk(e >> 4, t >> 4);
    return s ? VBIOME[s.biome[((15 & t) << 4) | (15 & e)]] : null;
  }),
  (Game.prototype.snowsAt = function (e, t, s) {
    const n = this.vbiomeAt(e, s);
    return !!n && n.precip && WG.coldEnoughToSnow(n.def, e, t + MIN_Y, s, 63);
  }));
const LOG_IDS = new Set(),
  LEAF_IDS = new Set();
for (const e of (self.BLOCK_TAGS && self.BLOCK_TAGS.logs) || [])
  void 0 !== BID[e] && LOG_IDS.add(BID[e]);
for (const e of (self.BLOCK_TAGS && self.BLOCK_TAGS.leaves) || [])
  void 0 !== BID[e] && LEAF_IDS.add(BID[e]);
class LiveRegion {
  constructor(e) {
    ((this.w = e), (this.minY = e.minY || 0), (this.maxY = this.minY + HEIGHT));
  }
  id(e, t, s) {
    return this.w.getBlock(e, t - this.minY, s);
  }
  meta(e, t, s) {
    return this.w.getMeta(e, t - this.minY, s);
  }
  canWrite(e, t, s) {
    return t >= this.minY && t < this.maxY && this.w.isLoaded(e, s);
  }
  set(e, t, s, n, o = 0) {
    return !!this.canWrite(e, t, s) && (this.w.setBlock(e, t - this.minY, s, n, o), !0);
  }
  setState(e, t, s, n) {
    return !!n && this.set(e, t, s, n[0], n[1]);
  }
  isAir(e, t, s) {
    return 0 === this.id(e, t, s);
  }
  chunk(e, t) {
    return this.w.getChunk(e >> 4, t >> 4);
  }
  height(e, t, s) {
    for (let n = this.maxY - 1; n >= this.minY; n--) {
      const o = this.id(t, n, s);
      if (o && (e.startsWith("WORLD_SURFACE") || BLOCKS[o].solid || IS_FLUID[o])) return n + 1;
    }
    return this.minY;
  }
}
const TREE_GROWERS = {
  oak_sapling: {
    one: [
      ["oak", 0.9],
      ["fancy_oak", 0.1],
    ],
  },
  birch_sapling: { one: [["birch", 1]] },
  spruce_sapling: {
    one: [["spruce", 1]],
    mega: [
      ["mega_spruce", 0.5],
      ["mega_pine", 0.5],
    ],
  },
  jungle_sapling: { one: [["jungle_tree_no_vine", 1]], mega: [["mega_jungle_tree", 1]] },
  acacia_sapling: { one: [["acacia", 1]] },
  cherry_sapling: { one: [["cherry", 1]] },
  dark_oak_sapling: { mega: [["dark_oak", 1]] },
  pale_oak_sapling: { mega: [["pale_oak_bonemeal", 1]] },
  mangrove_propagule: {
    one: [
      ["mangrove", 0.85],
      ["tall_mangrove", 0.15],
    ],
  },
  azalea: { one: [["azalea_tree", 1]] },
  flowering_azalea: { one: [["azalea_tree", 1]] },
};
Game.prototype.growTreeV = function (e, t, s, n) {
  const o = BLOCKS[n],
    i = TREE_GROWERS[o.key],
    a = this.world;
  if (!i || "undefined" == typeof Features) return !1;
  const c = new LiveRegion(a),
    h = new Features.WRand();
  h.setSeed(BigInt(Math.floor(Math.random() * 2 ** 52)));
  const pick = (e) => {
      let t = Math.random();
      for (const [s, n] of e) if ((t -= n) < 0) return s;
      return e[0][0];
    },
    l = t + c.minY,
    u = { R: c, top: null, seed: a.seedStr || "0", biomeAt: () => "plains", biomeHas: () => !0 };
  if (i.mega)
    for (const [o, c] of [
      [0, 0],
      [-1, 0],
      [0, -1],
      [-1, -1],
    ]) {
      const f = e + o,
        p = s + c;
      if (
        [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ].every(([e, s]) => a.getBlock(f + e, t, p + s) === n)
      ) {
        for (const [e, s] of [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ])
          a.setBlock(f + e, t, p + s, 0, 0);
        if (Features.placeCF(u, pick(i.mega), h, [f, l, p])) return !0;
        for (const [e, s] of [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ])
          a.setBlock(f + e, t, p + s, n, 0);
        return !1;
      }
    }
  return (
    !!i.one &&
    (a.setBlock(e, t, s, 0, 0),
    !!Features.placeCF(u, pick(i.one), h, [e, l, s]) || (a.setBlock(e, t, s, n, 0), !1))
  );
};
//# sourceURL=js/terrain2.js
