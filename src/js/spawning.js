"use strict";
const SPAWN_CAPS = {
    monster: 70,
    creature: 10,
    ambient: 15,
    water_creature: 5,
    water_ambient: 20,
    underground_water_creature: 5,
    axolotls: 5,
  },
  SPAWN_GROUND = {
    mooshroom: /^mycelium$/,
    polar_bear: /snow|ice/,
    goat: /stone|snow|gravel|calcite|packed_ice/,
    rabbit: /grass_block|snow|sand/,
    turtle: /sand$/,
    frog: /mud|grass_block|mangrove_roots/,
    armadillo: /grass_block|red_sand|coarse_dirt|terracotta/,
    camel: /sand$/,
    parrot: /grass_block|leaves|log/,
    ocelot: /grass_block|leaves/,
    fox: /grass_block|snow|podzol|coarse_dirt/,
    wolf: /grass_block|snow|podzol|coarse_dirt/,
    panda: /grass_block|podzol|bamboo/,
    llama: /grass_block|stone|snow/,
    sniffer: /grass_block/,
  };
function spawnCatOf(t) {
  return t.T ? t.T.cat || (t.T.hostile ? "monster" : "creature") : null;
}
function spawnMustKeep(t) {
  return !!(t.customName || t.leashHolder || t.rider || t.fromBucket || t.remote);
}
const SPAWN_CLUSTER = { ghast: 1, wolf: 8, salmon: 5 };
function spawnArea(t) {
  const n = t.player,
    e = t.world,
    a = n.pos[0],
    r = n.pos[2],
    o = Math.floor(a) >> 4,
    s = Math.floor(r) >> 4,
    i = [],
    l = Math.max(2, Math.min(16, (t.settings && t.settings.renderDist) || 8)),
    c = Math.min(104, 16 * (l + 1));
  for (let t = -7; t <= 7; t++)
    for (let n = -7; n <= 7; n++) {
      const l = o + t,
        u = s + n;
      Math.hypot(16 * l + 8 - a, 16 * u + 8 - r) <= c && e.chunks.has(ckey(l, u)) && i.push(l, u);
    }
  const u = i.length / 2;
  return {
    n: u,
    scale: u / 289,
    has: (t, n) => Math.hypot(t - a, n - r) <= c,
    pick: () => {
      if (!u) return null;
      const t = 2 * Math.floor(Math.random() * u);
      return [16 * i[t] + randInt(0, 15), 16 * i[t + 1] + randInt(0, 15)];
    },
    ok: (t, n) => {
      const o = Math.hypot(t + 0.5 - a, n + 0.5 - r);
      return o >= 24 && o <= Math.min(96, c) && e.isLoaded(t, n);
    },
  };
}
function spawnDarken(t) {
  return Math.floor(11 * (1 - t.daylight() * (1 - (5 * clamp(t.weather || 0, 0, 1)) / 16)));
}
function slimeChunk(t, n, e) {
  const a = t.world,
    r = a.slimeChunks || (a.slimeChunks = new Map()),
    o = n + "," + e;
  let s = r.get(o);
  if (void 0 === s) {
    let i = 0n;
    try {
      i = BigInt(t.worldMeta && null != t.worldMeta.seed ? t.worldMeta.seed : 0 | a.seed);
    } catch (t) {
      i = BigInt(0 | a.seed);
    }
    const l =
      987234911n ^
      BigInt.asIntN(
        64,
        i +
          BigInt(Math.imul(Math.imul(n, n), 4987142)) +
          BigInt(Math.imul(n, 5947611)) +
          4392871n * BigInt(Math.imul(e, e)) +
          BigInt(Math.imul(e, 389711)),
      );
    ((s = 0 === new WG.JavaRandom(l).nextIntB(10)), r.size > 4096 && r.clear(), r.set(o, s));
  }
  return s;
}
const MOON_BRIGHT = [1, 0.75, 0.5, 0.25, 0, 0.25, 0.5, 0.75];
function spawnHalloween() {
  const t = new Date(),
    n = t.getMonth() + 1,
    e = t.getDate();
  return (10 === n && e >= 20) || (11 === n && e <= 3);
}
function spawnAttempt(t, n, e, a, r, o, s, i, l) {
  let c = 0;
  for (let u = 0; u < 3; u++) {
    let f = e,
      d = r,
      h = u ? null : n,
      p = null,
      m = u ? Math.ceil(4 * Math.random()) : 1;
    for (let n = 0; n < m; n++) {
      if (
        (u || n) &&
        ((f += randInt(0, 5) - randInt(0, 5)), (d += randInt(0, 5) - randInt(0, 5)), !o.ok(f, d))
      )
        continue;
      if (!h && !(h = i(f, d))) break;
      if (
        (p ||
          ((p = h.type.replace("minecraft:", "")),
          (m = h.minCount + randInt(0, h.maxCount - h.minCount))),
        (u || n) && !s(p, f, a, d))
      )
        continue;
      const e = createMob(t, p, f + 0.5, a, d + 0.5);
      if (
        e &&
        !e.collides(e.box()) &&
        (l && l(e), t.entities.push(e), ++c >= (SPAWN_CLUSTER[p] || 4))
      )
        return c;
    }
  }
  return c;
}
function spawnPickOf(t) {
  if (!t || !t.length) return null;
  let n = 0,
    e = null;
  for (const a of t) MOB_TYPES[a.type.replace("minecraft:", "")] && ((n += a.weight), (e = a));
  if (!e) return null;
  let a = Math.random() * n;
  for (const n of t)
    if (MOB_TYPES[n.type.replace("minecraft:", "")] && (a -= n.weight) < 0) return n;
  return e;
}
let SPAWN_FLAT = null;
function spawnBiome(t, n, e) {
  return t.world && t.world.flat
    ? SPAWN_FLAT ||
        (SPAWN_FLAT =
          self.WG_DATA && WG_DATA.biome.plains
            ? { name: "plains", def: WG_DATA.biome.plains }
            : null)
    : t.vbiomeAt
      ? t.vbiomeAt(n, e)
      : null;
}
function spawnOverride(t, n, e, a, r) {
  const o = t.world,
    s = o.structRefs,
    i = self.STRUCT_DATA && STRUCT_DATA.structure;
  if (!s || !s.size || !i) return null;
  let l = o._spawnOvr;
  if (!l || l.refs !== s || l.n !== s.size) {
    l = o._spawnOvr = { refs: s, n: s.size, list: [] };
    for (const t of s.values())
      i[t.name] &&
        i[t.name].spawn_overrides &&
        Object.keys(i[t.name].spawn_overrides).length &&
        l.list.push(t);
  }
  const c = null == a ? null : a + (o.minY || 0);
  for (const t of l.list) {
    const a = i[t.name].spawn_overrides[n],
      o = t.box;
    if (
      a &&
      ("piece" !== a.bounding_box || "swamp_hut" === t.name) &&
      e >= o[0] &&
      e <= o[3] &&
      r >= o[2] &&
      r <= o[5] &&
      (null == c || (c >= o[1] && c <= o[4]))
    )
      return a.spawns || [];
  }
  return null;
}
function spawnGroundY(t, n, e) {
  let a = t.surfaceY(n, e);
  for (
    let r = t.getBlock(n, a, e);
    a > 1 && (/_leaves$/.test(BLOCKS[r].key) || (!BLOCKS[r].solid && !IS_FLUID[r]));
    r = t.getBlock(n, --a, e)
  );
  return a;
}
function spawnStandY(t, n, e, a) {
  return "parrot" === n || "ocelot" === n ? t.surfaceY(e, a) : spawnGroundY(t, e, a);
}
Game.prototype.spawnPick = function (t, n, e, a) {
  const r = null != a ? spawnOverride(this, t, n, a, e) : null;
  if (r) return spawnPickOf(r);
  const o = spawnBiome(this, n, e);
  return spawnPickOf(o && o.def && o.def.spawners && o.def.spawners[t]);
};
const _oldSpawnMobs = Game.prototype.spawnMobs;
((Game.prototype.spawnMobs = function () {
  const t = this.player,
    n = spawnBiome(this, Math.floor(t.pos[0]), Math.floor(t.pos[2]));
  if (!n || !n.def || !n.def.spawners) return _oldSpawnMobs.call(this);
  (this.tickCount % 24e3 == 1200 && this.trySpawnTrader && this.trySpawnTrader(),
    this.tickCount % 1200 == 0 && this.trySpawnPhantoms && this.trySpawnPhantoms());
  const e = spawnArea(this);
  if (!e.n) return;
  const a = {};
  for (const t of this.entities) {
    if (!(t instanceof Mob) || t.dead || spawnMustKeep(t) || !e.has(t.pos[0], t.pos[2])) continue;
    const n = spawnCatOf(t);
    a[n] = (a[n] || 0) + 1;
  }
  const r = spawnDarken(this);
  for (const t in SPAWN_CAPS) {
    const n = Math.max(1, Math.round(SPAWN_CAPS[t] * e.scale));
    if (
      !((a[t] || 0) >= n) &&
      !(
        ("monster" === t && 0 === this.difficulty) ||
        ("creature" === t && this.tickCount % 400 != 0)
      )
    )
      for (
        let o = 0, s = "creature" === t ? e.n : "monster" === t ? 3 : 1;
        o < s && (a[t] || 0) < n;
        o++
      ) {
        const n = e.pick();
        if (!n || !e.ok(n[0], n[1])) continue;
        const [o, s] = n,
          i = spawnOverride(this, t, o, null, s),
          l = !(!i || !i.length);
        let c = l ? spawnPickOf(i) : this.spawnPick(t, o, s);
        if (!c) continue;
        const u = this.spawnY(t, c.type.replace("minecraft:", ""), o, s, r);
        if (null != u) {
          if (i) {
            const n = spawnOverride(this, t, o, u, s);
            if (
              (n ? n !== i || !l : l) &&
              (!(c = n ? spawnPickOf(n) : this.spawnPick(t, o, s)) ||
                null == this.spawnY(t, c.type.replace("minecraft:", ""), o, s, r, u))
            )
              continue;
          }
          if (
            ((a[t] =
              (a[t] || 0) +
              spawnAttempt(
                this,
                c,
                o,
                u,
                s,
                e,
                (n, e, a, o) => null != this.spawnY(t, n, e, o, r, a),
                (n, e) => this.spawnPick(t, n, e, u),
                (n) => {
                  "creature" !== t
                    ? (n.persistent = !1)
                    : Math.random() < 0.1 && n.makeBaby && !n.T.hostile && n.makeBaby();
                },
              )),
            "creature" !== t)
          )
            break;
        }
      }
  }
}),
  (Game.prototype.spawnChunkAnimals = function (t, n) {
    const e = this.world,
      a = 16 * t.cx,
      r = 16 * t.cz,
      o = n.def.creature_spawn_probability ?? 0.1;
    do {
      const t = spawnPickOf(n.def.spawners.creature);
      if (!t) return;
      const o = t.type.replace("minecraft:", ""),
        s = t.minCount + randInt(0, t.maxCount - t.minCount),
        i = a + randInt(0, 15),
        l = r + randInt(0, 15);
      let c = i,
        u = l;
      for (let t = 0; t < s; t++)
        for (let n = 0, s = !1; !s && n < 4; n++) {
          const n = this.spawnY("creature", o, c, u, 0, spawnStandY(e, o, c, u) + 1),
            f = null != n && createMob(this, o, c + 0.5, n, u + 0.5);
          for (
            f &&
              !f.collides(f.box()) &&
              (t > 0 && Math.random() < 0.05 && f.makeBaby && f.makeBaby(),
              this.entities.push(f),
              (s = !0)),
              c += randInt(0, 4) - randInt(0, 4),
              u += randInt(0, 4) - randInt(0, 4);
            c < a || c >= a + 16 || u < r || u >= r + 16;
          )
            ((c = i + randInt(0, 4) - randInt(0, 4)), (u = l + randInt(0, 4) - randInt(0, 4)));
        }
    } while (Math.random() < o);
  }),
  (Game.prototype.slimeSpawnOk = function (t, n, e, a, r, o) {
    const s = n + (this.world.flat ? -64 : this.world.minY || 0),
      i = MOON_BRIGHT[((Math.floor(this.worldTime / 24e3) % 8) + 8) % 8];
    return (
      !!(
        s > 50 &&
        s < 70 &&
        /swamp/.test(biomeName(this, t, e)) &&
        Math.random() < 0.5 &&
        Math.random() < i &&
        Math.max(a - o, r) <= randInt(0, 7)
      ) ||
      (s < 40 && Math.random() < 0.1 && slimeChunk(this, t >> 4, e >> 4))
    );
  }),
  (Game.prototype.spawnY = function (t, n, e, a, r, o) {
    const s = this.world,
      i = s.surfaceY(e, a),
      l = Math.floor(this.player.pos[1]),
      air = (t) => {
        const n = s.getBlock(e, t, a);
        return (
          0 === n || (!BLOCKS[n].solid && !IS_FLUID[n] && !WLOG[n] && !s.isWaterlogged(e, t, a))
        );
      },
      water = (t) => {
        const n = s.getBlock(e, t, a);
        return n === WATER || !!WLOG[n];
      };
    if (
      "water_creature" === t ||
      "water_ambient" === t ||
      "underground_water_creature" === t ||
      "axolotls" === t
    ) {
      const n = "underground_water_creature" === t || "axolotls" === t;
      let r = o;
      if (null == r) {
        const t = n ? Math.max(1, l - 48) : SEA - 12,
          e = n ? Math.min(SEA - 32, l + 24) : SEA - 1;
        if (t > e) return null;
        r = randInt(t, e);
      }
      return water(r) && water(r + 1) && (n ? 0 === s.getLight(e, r, a) : water(r - 1)) ? r : null;
    }
    if ("ambient" === t) {
      let t = o;
      if (null == t) {
        const n = Math.max(1, l - 48),
          e = Math.min(SEA, i - 4, l + 24);
        if (n > e) return null;
        t = randInt(n, e);
      }
      if (t > SEA || !SOLIDCUBE[s.getBlock(e, t - 1, a)] || !air(t) || !air(t + 1)) return null;
      const n = s.getLight(e, t, a),
        c = spawnHalloween();
      return (!c && Math.random() < 0.5) || Math.max((n >> 4) - r, 15 & n) > randInt(0, c ? 6 : 3)
        ? null
        : t;
    }
    if ("drowned" === n) {
      let t = o;
      if (null == t) {
        const n = Math.max(1, Math.min(i + 2, l - 48)),
          e = SEA;
        if (n > e) return null;
        t = randInt(n, e);
      }
      if (!water(t) || !water(t - 1) || SOLIDCUBE[s.getBlock(e, t + 1, a)]) return null;
      const n = s.getLight(e, t, a),
        c = n >> 4,
        u = 15 & n;
      return c > randInt(0, 31) || u > 0 || Math.max(c - r, u) > randInt(0, 7)
        ? null
        : Math.random() < (/river/.test(biomeName(this, e, a)) ? 1 / 15 : t <= SEA - 5 ? 1 / 40 : 0)
          ? t
          : null;
    }
    if ("guardian" === n || "elder_guardian" === n) {
      let t = o;
      if (null == t) {
        const n = Math.max(1, Math.min(i, l - 48)),
          e = SEA;
        if (n > e) return null;
        t = randInt(n, e);
      }
      return water(t) && water(t - 1) && !SOLIDCUBE[s.getBlock(e, t + 1, a)]
        ? i < t && Math.random() >= 0.05
          ? null
          : t
        : null;
    }
    const c =
      null != o
        ? [o]
        : "creature" === t
          ? [spawnStandY(s, n, e, a) + 1]
          : Math.random() < 0.4
            ? [i + 1]
            : [randInt(Math.max(1, Math.min(i, l - 48)), i)];
    for (const i of c) {
      let l = i;
      if (null == o && "monster" === t && !air(l)) for (let t = 0; t < 12 && !air(l); t++) l++;
      const c = s.getBlock(e, l - 1, a),
        u = BLOCKS[c].key;
      if (
        (!SOLIDCUBE[c] && (("parrot" !== n && "ocelot" !== n) || !/_leaves$/.test(u))) ||
        !air(l) ||
        !air(l + 1)
      )
        continue;
      if ("bedrock" === u || "barrier" === u || ("magma_block" === u && !MOB_TYPES[n].fireproof))
        continue;
      const f = s.getLight(e, l, a),
        d = f >> 4,
        h = 15 & f;
      if ("monster" === t) {
        if ("slime" === n) {
          if (!this.slimeSpawnOk(e, l, a, d, h, r)) continue;
        } else if ("pillager" === n) {
          if (h > 8) continue;
        } else if (d > randInt(0, 31) || h > 0 || Math.max(d - r, h) > randInt(0, 7)) continue;
      } else {
        if (f >> 4 < 9 && h < 9) continue;
        const t = SPAWN_GROUND[n];
        if (t ? !t.test(u) : "grass_block" !== u) continue;
      }
      return l;
    }
    return null;
  }));
const SPAWN_CLEAN_MAX = 40,
  _loadDimDataSpawn = Game.prototype.loadDimData;
Game.prototype.loadDimData = async function (t) {
  const n = !!this.dimData[t],
    e = await _loadDimDataSpawn.call(this, t),
    a = this.worldMeta && this.worldMeta.dims && this.worldMeta.dims[t],
    r = this.worldMeta && (this.worldMeta.capFix || (this.worldMeta.capFix = {}));
  if (n || !a || !r || r[t]) return e;
  r[t] = 1;
  const o = new Map(),
    s = new Set();
  for (const t of e.pendingMobs) {
    const n = MOB_TYPES[t.type],
      e = t.x || {};
    if (
      !n ||
      "creature" !== n.cat ||
      e.name ||
      e.own ||
      e.tame ||
      e.trust ||
      e.fb ||
      e.sad ||
      e.sit
    )
      continue;
    const a = Math.floor(t.pos[0] / 128) + "," + Math.floor(t.pos[2] / 128);
    (o.has(a) || o.set(a, []), o.get(a).push(t));
  }
  for (const t of o.values())
    if (!(t.length <= 40)) {
      for (let n = t.length - 1; n > 0; n--) {
        const e = Math.floor(Math.random() * (n + 1));
        [t[n], t[e]] = [t[e], t[n]];
      }
      for (let n = 40; n < t.length; n++) s.add(t[n]);
    }
  return (
    s.size &&
      ((e.pendingMobs = e.pendingMobs.filter((t) => !s.has(t))),
      console.log("[spawning] removed " + s.size + " extra animals from the save (" + t + ")")),
    e
  );
};
//# sourceURL=js/spawning.js
