"use strict";
const OPACITY = new Uint8Array(MAX_BLOCKS),
  EMIT = new Uint8Array(MAX_BLOCKS),
  SOLIDCUBE = new Uint8Array(MAX_BLOCKS),
  IS_FLUID = new Uint8Array(MAX_BLOCKS),
  REPLACEABLE = new Uint8Array(MAX_BLOCKS),
  AOCUBE = new Uint8Array(MAX_BLOCKS),
  WLOG = new Uint8Array(MAX_BLOCKS),
  TORCHLIKE = new Uint8Array(MAX_BLOCKS),
  FLUID_HDIRS = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ],
  FLUID_HDIR_D = [4, 1, 5, 0],
  FLUID_MOD = new Uint8Array(MAX_BLOCKS);
for (let t = 0; t < MAX_BLOCKS; t++) {
  const e = BLOCKS[t];
  e
    ? ((OPACITY[t] = e.opacity),
      (EMIT[t] = e.light),
      (SOLIDCUBE[t] = e.opaque ? 1 : 0),
      (AOCUBE[t] =
        e.opaque || (e.shape === SH_CUBE && e.solid && "translucent" !== e.render) ? 1 : 0),
      (IS_FLUID[t] = e.shape === SH_LIQUID ? 1 : 0),
      (REPLACEABLE[t] = e.replaceable ? 1 : 0),
      (WLOG[t] = e.waterlogged ? 1 : 0),
      (FLUID_MOD[t] = "water" === e.fluidKind ? 1 : "lava" === e.fluidKind ? 2 : 0),
      (TORCHLIKE[t] = /(^|_)torch$/.test(e.key || "") && !e.solid ? 1 : 0))
    : (OPACITY[t] = 15);
}
const STATE_EMIT = new Array(MAX_BLOCKS).fill(null);
for (let t = 0; t < MAX_BLOCKS; t++)
  BLOCKS[t] && BLOCKS[t].stateLight && (STATE_EMIT[t] = BLOCKS[t].stateLight);
const WET_EMIT = new Uint8Array(MAX_BLOCKS);
for (let t = 0; t < MAX_BLOCKS; t++) BLOCKS[t] && BLOCKS[t].wetLight && (WET_EMIT[t] = 1);
const emitOf = (t, e, s) => {
    if (WET_EMIT[t] && !s) return 0;
    const n = STATE_EMIT[t];
    return n ? 0 | n[e] : EMIT[t];
  },
  AIR = 0,
  WATER = 7,
  LAVA = 8;
function ckey(t, e) {
  return 65536 * (t + 32768) + (e + 32768);
}
const SEC_IDENT = new Uint16Array(MAX_BLOCKS);
for (let t = 0; t < MAX_BLOCKS; t++) SEC_IDENT[t] = t;
const SEC_LUT = new Int16Array(MAX_BLOCKS).fill(-1),
  PK_P = new Uint16Array(256),
  PK_D = new Uint8Array(4096),
  newBlockSec = () => ({ p: new Uint16Array(256), n: 1, d: new Uint8Array(4096) });
function secIndex(t, e) {
  const s = t.p,
    n = t.n;
  for (let t = 0; t < n; t++) if (s[t] === e) return t;
  return n < 256 ? ((s[n] = e), (t.n = n + 1), n) : -1;
}
function secMakeRoom(t) {
  const e = new Uint8Array(256),
    s = t.d,
    n = t.p;
  for (let t = 0; t < 4096; t++) e[s[t]] = 1;
  const i = new Uint8Array(256),
    o = new Uint16Array(256);
  let r = 0;
  for (let t = 0; t < 256; t++) e[t] && ((i[t] = r), (o[r++] = n[t]));
  if (r < 256) {
    for (let t = 0; t < 4096; t++) s[t] = i[s[t]];
    return ((t.p = o), void (t.n = r));
  }
  const h = new Uint16Array(4096);
  for (let t = 0; t < 4096; t++) h[t] = n[s[t]];
  ((t.d = h), (t.p = SEC_IDENT), (t.n = -1));
}
let FLAT_B = null,
  FLAT_M = null,
  FLAT_L = null;
function flatScratch() {
  (FLAT_B && FLAT_B.length === 256 * HEIGHT) ||
    ((FLAT_B = new Uint16Array(256 * HEIGHT)),
    (FLAT_M = new Uint8Array(256 * HEIGHT)),
    (FLAT_L = new Uint8Array(256 * HEIGHT)));
}
class Chunk {
  constructor(t, e) {
    ((this.cx = t),
      (this.cz = e),
      (this.bs = new Array(SECTIONS).fill(null)),
      (this.ms = new Array(SECTIONS).fill(null)),
      (this.ls = new Array(SECTIONS).fill(null)),
      (this.lu = new Uint8Array(SECTIONS)),
      (this.blocks = null),
      (this.meta = null),
      (this.grass = new Uint8Array(768)),
      (this.foliage = new Uint8Array(768)),
      (this.biome = new Uint8Array(256)),
      (this.dirty = 0),
      (this.lit = !1),
      (this.modified = !1),
      (this.sectionCount = new Uint16Array(SECTIONS)));
  }
  static from(t, e, s, n) {
    const i = new Chunk(t, e);
    return (i.packFrom(s, n), i);
  }
  static fromWire(t, e, s) {
    const n = new Chunk(t, e);
    for (const t of s.bs) t && t.n < 0 && (t.p = SEC_IDENT);
    return (
      (n.bs = s.bs),
      (n.ms = s.ms),
      s.ls && ((n.ls = s.ls), (n.lu = s.lu), (n.lit = !0)),
      n.recount(),
      n
    );
  }
  wire(t) {
    const e = [],
      s = this.bs.map((t) =>
        t
          ? (e.push(t.d.buffer), t.n < 0 ? { p: null, n: -1, d: t.d } : (e.push(t.p.buffer), t))
          : null,
      );
    for (const t of this.ms) t && e.push(t.buffer);
    const n = { bs: s, ms: this.ms };
    if (t) {
      for (const t of this.ls) t && e.push(t.buffer);
      ((n.ls = this.ls), (n.lu = this.lu), e.push(this.lu.buffer));
    }
    return [n, e];
  }
  idx(t, e, s) {
    return (e << 8) | (s << 4) | t;
  }
  getB(t) {
    const e = this.bs[t >> 12];
    return null === e ? 0 : e.p[e.d[4095 & t]];
  }
  setB(t, e) {
    const s = t >> 12;
    let n = this.bs[s];
    if (null === n) {
      if (!e) return;
      n = this.bs[s] = newBlockSec();
    }
    if (n.n < 0) return void (n.d[4095 & t] = e);
    let i = secIndex(n, e);
    if (i < 0) {
      if ((secMakeRoom(n), n.n < 0)) return void (n.d[4095 & t] = e);
      i = secIndex(n, e);
    }
    n.d[4095 & t] = i;
  }
  getM(t) {
    const e = this.ms[t >> 12];
    return null === e ? 0 : e[4095 & t];
  }
  setM(t, e) {
    let s = this.ms[t >> 12];
    if (null === s) {
      if (!e) return;
      s = this.ms[t >> 12] = new Uint8Array(4096);
    }
    s[4095 & t] = e;
  }
  getL(t) {
    const e = this.ls[t >> 12];
    return null === e ? this.lu[t >> 12] : e[4095 & t];
  }
  setL(t, e) {
    const s = t >> 12;
    let n = this.ls[s];
    if (null === n) {
      const t = this.lu[s];
      if (t === e) return;
      ((n = this.ls[s] = new Uint8Array(4096)), t && n.fill(t));
    }
    n[4095 & t] = e;
  }
  beginFlat() {
    return (
      (this.blocks = new Uint16Array(256 * HEIGHT)),
      (this.meta = new Uint8Array(256 * HEIGHT)),
      this
    );
  }
  pack() {
    const t = this.blocks,
      e = this.meta;
    ((this.blocks = this.meta = null), this.packFrom(t, e));
  }
  packFrom(t, e) {
    for (let s = 0; s < SECTIONS; s++) {
      const n = s << 12;
      let i = 0,
        o = 0;
      const r = PK_P,
        h = PK_D;
      for (let e = 0; e < 4096; e++) {
        const s = t[n + e];
        s && o++;
        let l = SEC_LUT[s];
        if (l < 0) {
          if (256 === i) {
            i = -1;
            break;
          }
          ((l = SEC_LUT[s] = i), (r[i++] = s));
        }
        h[e] = l;
      }
      for (let t = 0; t < (i < 0 ? 256 : i); t++) SEC_LUT[r[t]] = -1;
      if (i < 0) {
        o = 0;
        for (let e = 0; e < 4096; e++) t[n + e] && o++;
        this.bs[s] = { p: SEC_IDENT, n: -1, d: t.slice(n, n + 4096) };
      } else this.bs[s] = o ? { p: r.slice(), n: i, d: h.slice() } : null;
      this.sectionCount[s] = o;
      let l = !0;
      if (e)
        for (let t = n; t < n + 4096; t++)
          if (e[t]) {
            l = !1;
            break;
          }
      this.ms[s] = l ? null : new Uint8Array(e.subarray(n, n + 4096));
    }
  }
  flatBlocks(t) {
    t = t || (flatScratch(), FLAT_B);
    for (let e = 0; e < SECTIONS; e++) {
      const s = this.bs[e],
        n = e << 12;
      if (!s) {
        t.fill(0, n, n + 4096);
        continue;
      }
      const i = s.p,
        o = s.d;
      for (let e = 0; e < 4096; e++) t[n + e] = i[o[e]];
    }
    return t;
  }
  flatMeta(t) {
    t = t || (flatScratch(), FLAT_M);
    for (let e = 0; e < SECTIONS; e++) {
      const s = this.ms[e],
        n = e << 12;
      s ? t.set(s, n) : t.fill(0, n, n + 4096);
    }
    return t;
  }
  packLight(t) {
    for (let e = 0; e < SECTIONS; e++) {
      const s = e << 12,
        n = t[s];
      let i = !0;
      for (let e = s + 1; e < s + 4096; e++)
        if (t[e] !== n) {
          i = !1;
          break;
        }
      i ? ((this.ls[e] = null), (this.lu[e] = n)) : (this.ls[e] = t.slice(s, s + 4096));
    }
  }
  compactLight() {
    for (let t = 0; t < SECTIONS; t++) {
      const e = this.ls[t];
      if (!e) continue;
      const s = e[0];
      let n = !0;
      for (let t = 1; t < 4096; t++)
        if (e[t] !== s) {
          n = !1;
          break;
        }
      n && ((this.ls[t] = null), (this.lu[t] = s));
    }
  }
  findAll(t, e) {
    for (let s = 0; s < SECTIONS; s++) {
      const n = this.bs[s];
      if (n) {
        if (n.n >= 0) {
          let e = !1;
          for (let s = 0; s < n.n; s++)
            if (t.includes(n.p[s])) {
              e = !0;
              break;
            }
          if (!e) continue;
        }
        for (let i = 0; i < 4096; i++) {
          const o = n.p[n.d[i]];
          t.includes(o) && e((s << 12) | i, o);
        }
      }
    }
  }
  recount() {
    if (this.blocks) {
      this.sectionCount.fill(0);
      const t = this.blocks;
      for (let e = 0; e < t.length; e++) t[e] && this.sectionCount[e >> 12]++;
      return;
    }
    for (let t = 0; t < SECTIONS; t++) {
      const e = this.bs[t];
      let s = 0;
      if (e) {
        const t = e.p,
          n = e.d;
        for (let e = 0; e < 4096; e++) t[n[e]] && s++;
      }
      (s || (this.bs[t] = null), (this.sectionCount[t] = s));
    }
  }
}
const LIGHT_H = new Int16Array(256);
function lightChunk(t, e) {
  flatScratch();
  const s = t.blocks || t.flatBlocks(),
    n = t.meta,
    i = FLAT_L,
    o = LIGHT_H,
    r = [];
  if ((i.fill(0), e)) {
    for (let t = 0; t < 16; t++)
      for (let e = 0; e < 16; e++) {
        let n = 15,
          r = 0;
        for (let o = HEIGHT - 1; o >= 0; o--) {
          const h = (o << 8) | (t << 4) | e,
            l = OPACITY[s[h]];
          if (
            (l >= 15 ? (n = 0) : (l > 0 || n < 15) && (n = Math.max(0, n - Math.max(1, l))),
            15 === n && (r = o),
            (i[h] = n << 4),
            0 === n)
          )
            break;
        }
        o[16 * t + e] = r;
      }
    for (let t = 0; t < 16; t++)
      for (let e = 0; e < 16; e++) {
        const s = o[16 * t + e];
        let n = s;
        (e > 0 && (n = Math.max(n, o[16 * t + e - 1])),
          e < 15 && (n = Math.max(n, o[16 * t + e + 1])),
          t > 0 && (n = Math.max(n, o[16 * t + e - 16])),
          t < 15 && (n = Math.max(n, o[16 * t + e + 16])));
        for (let o = s; o <= n && o < HEIGHT; o++) {
          const s = (o << 8) | (t << 4) | e;
          i[s] >> 4 > 1 && r.push(s);
        }
      }
    (propagateFlat(s, i, r, 4), (r.length = 0));
  }
  for (let e = 0; e < SECTIONS; e++) {
    if (!t.blocks) {
      const s = t.bs[e];
      if (!s) continue;
      if (s.n >= 0) {
        let t = !1;
        for (let e = 0; e < s.n; e++)
          if (EMIT[s.p[e]]) {
            t = !0;
            break;
          }
        if (!t) continue;
      }
    }
    for (let o = e << 12, h = o + 4096; o < h; o++) {
      const e = s[o];
      if (!EMIT[e]) continue;
      const h = emitOf(e, n ? n[o] : t.getM(o), t.wl && t.wl.has(o));
      h && ((i[o] = (240 & i[o]) | h), r.push(o));
    }
  }
  (propagateFlat(s, i, r, 0), t.packLight(i), (t.lit = !0));
}
function propagateFlat(t, e, s, n) {
  const i = 4 === n,
    o = HEIGHT - 1;
  for (let r = 0; r < s.length; r++) {
    const h = s[r],
      l = (e[h] >> n) & 15;
    if (l <= 1) continue;
    const c = 15 & h,
      f = (h >> 4) & 15,
      a = h >> 8;
    for (let r = 0; r < 6; r++) {
      let u;
      switch (r) {
        case 0:
          if (0 === c) continue;
          u = h - 1;
          break;
        case 1:
          if (15 === c) continue;
          u = h + 1;
          break;
        case 2:
          if (0 === a) continue;
          u = h - 256;
          break;
        case 3:
          if (a === o) continue;
          u = h + 256;
          break;
        case 4:
          if (0 === f) continue;
          u = h - 16;
          break;
        default:
          if (15 === f) continue;
          u = h + 16;
      }
      const I = OPACITY[t[u]];
      if (I >= 15) continue;
      const g = i && 2 === r && 15 === l && 0 === I ? 15 : l - (I > 1 ? I : 1),
        d = e[u];
      g > ((d >> n) & 15) && ((e[u] = i ? (15 & d) | (g << 4) : (240 & d) | g), s.push(u));
    }
  }
}
const BIOMES = [
    "海洋",
    "沙滩",
    "平原",
    "森林",
    "桦木森林",
    "针叶林",
    "雪原",
    "沙漠",
    "山地",
    "河流",
    "雪山",
    "冻洋",
    "下界荒地",
    "末地",
  ],
  BIOME_WATER_DEFAULT = [63, 118, 228],
  BIOME_WATER = [];
BIOME_WATER[11] = [57, 56, 201];
const DRY_FOLIAGE_DEFAULT = [92, 60, 50],
  BIOME_TEMP = [0.5, 0.8, 0.8, 0.7, 0.6, 0.25, 0, 2, 0.2, 0.5, -0.7, 0, 2, 0.5];
function hsv2rgb(t, e, s) {
  const n = Math.floor(6 * t),
    i = 6 * t - n,
    o = s * (1 - e),
    r = s * (1 - i * e),
    h = s * (1 - (1 - i) * e);
  return [
    [s, h, o],
    [r, s, o],
    [o, s, h],
    [o, r, s],
    [h, o, s],
    [s, o, r],
  ][((n % 6) + 6) % 6];
}
const BI = {
  OCEAN: 0,
  BEACH: 1,
  PLAINS: 2,
  FOREST: 3,
  BIRCH: 4,
  TAIGA: 5,
  SNOWY: 6,
  DESERT: 7,
  MOUNTAIN: 8,
  RIVER: 9,
  SNOWPEAK: 10,
  FROZEN_OCEAN: 11,
  NETHER: 12,
  END: 13,
};
class StructBuilder {
  constructor() {
    this.buckets = new Map();
  }
  set(t, e, s, n, i = 0) {
    if (e < 0 || e >= HEIGHT) return;
    const o = ckey(t >> 4, s >> 4);
    let r = this.buckets.get(o);
    (r || this.buckets.set(o, (r = [])), r.push((e << 8) | ((15 & s) << 4) | (15 & t), n, i));
  }
  fill(t, e, s, n, i, o, r, h = 0) {
    for (let l = t; l <= n; l++)
      for (let t = e; t <= i; t++)
        for (let e = s; e <= o; e++) this.set(l, t, e, "function" == typeof r ? r(l, t, e) : r, h);
  }
  box(t, e, s, n, i, o, r, h = 0) {
    for (let l = t; l <= n; l++)
      for (let c = e; c <= i; c++)
        for (let f = s; f <= o; f++) {
          if (l === t || l === n || c === e || c === i || f === s || f === o) {
            const t = "function" == typeof r ? r(l, c, f) : r;
            null !== t && this.set(l, c, f, t);
          } else this.set(l, c, f, h);
        }
  }
  apply(t) {
    const e = this.buckets.get(ckey(t.cx, t.cz));
    if (!e) return !1;
    if (t.blocks)
      for (let s = 0; s < e.length; s += 3)
        ((t.blocks[e[s]] = e[s + 1]), (t.meta[e[s]] = e[s + 2]));
    else for (let s = 0; s < e.length; s += 3) (t.setB(e[s], e[s + 1]), t.setM(e[s], e[s + 2]));
    return !0;
  }
}
class World {
  constructor(t, e = "overworld") {
    ((this.seed = 0 | t),
      (this.dim = e),
      (this.hasSky = "overworld" === e),
      (this.structCache = new Map()),
      (this.nNether = new Noise(t + 101)),
      (this.nNether2 = new Noise(t + 102)),
      (this.nEnd = new Noise(t + 201)),
      "end" === e && this.initEnd(),
      (this.chunks = new Map()),
      (this.nCont = new Noise(t)),
      (this.nErosion = new Noise(t + 1)),
      (this.nPeaks = new Noise(t + 2)),
      (this.nHills = new Noise(t + 3)),
      (this.nTemp = new Noise(t + 4)),
      (this.nHumid = new Noise(t + 5)),
      (this.nCave1 = new Noise(t + 6)),
      (this.nCave2 = new Noise(t + 7)),
      (this.nCave3 = new Noise(t + 8)),
      (this.nRiver = new Noise(t + 9)),
      (this.nSurf = new Noise(t + 10)),
      (this.listener = null),
      (this.ticks = new Map()),
      (this.time = 0),
      (this.savedChunks = null),
      (this.lightQ = []),
      (this.grassMap = null),
      (this.foliageMap = null));
  }
  getChunk(t, e) {
    return this.chunks.get(ckey(t, e));
  }
  getBlock(t, e, s) {
    if (e < 0) return "end" === this.dim ? 0 : 6;
    if (e >= HEIGHT) return 0;
    const n = this.chunks.get(ckey(t >> 4, s >> 4));
    return n ? n.getB((e << 8) | ((15 & s) << 4) | (15 & t)) : 0;
  }
  getMeta(t, e, s) {
    if (e < 0 || e >= HEIGHT) return 0;
    const n = this.chunks.get(ckey(t >> 4, s >> 4));
    return n ? n.getM((e << 8) | ((15 & s) << 4) | (15 & t)) : 0;
  }
  isWaterlogged(t, e, s) {
    if (e < 0 || e >= HEIGHT) return !1;
    const n = this.chunks.get(ckey(t >> 4, s >> 4));
    return !!(n && n.wl && n.wl.has((e << 8) | ((15 & s) << 4) | (15 & t)));
  }
  setWaterlogged(t, e, s, n) {
    if (e < 0 || e >= HEIGHT) return;
    const i = this.chunks.get(ckey(t >> 4, s >> 4));
    if (!i) return;
    const o = (e << 8) | ((15 & s) << 4) | (15 & t);
    if (!(!i.wl || !i.wl.has(o)) != !!n) {
      (n ? (i.wl || (i.wl = new Set())).add(o) : i.wl.delete(o),
        (i.modified = !0),
        this.markBlock(i, 15 & t, e, 15 & s),
        WET_EMIT[i.getB(o)] && this.relight(t, e, s),
        this.notify(t, e, s, -1));
      for (let n = 0; n < 6; n++) this.notify(t + DIRS[n][0], e + DIRS[n][1], s + DIRS[n][2], -1);
    }
  }
  waterAt(t, e, s) {
    const n = this.getBlock(t, e, s);
    return 7 === n || !!WLOG[n] || (0 !== n && this.isWaterlogged(t, e, s));
  }
  fluidAmount(t, e, s, n) {
    const i = this.getBlock(e, s, n);
    if (i === t) {
      const t = this.getMeta(e, s, n);
      return 0 === t || 8 & t ? 8 : 8 - (7 & t);
    }
    return 0 !== i && (WLOG[i] || this.isWaterlogged(e, s, n))
      ? 7 === t
        ? 8
        : -1
      : IS_FLUID[i]
        ? -1
        : 0;
  }
  fluidFlow(t, e, s, n) {
    const i = this.fluidAmount(t, e, s, n) / 9;
    let o = 0,
      r = 0;
    for (const [h, l] of FLUID_HDIRS) {
      const c = this.fluidAmount(t, e + h, s, n + l);
      if (c < 0) continue;
      let f = 0;
      if (0 === c) {
        if (!BLOCKS[this.getBlock(e + h, s, n + l)].solid) {
          const o = this.fluidAmount(t, e + h, s - 1, n + l);
          o > 0 && (f = i - (o / 9 - 0.8888889));
        }
      } else f = i - c / 9;
      ((o += h * f), (r += l * f));
    }
    let h = [o, 0, r];
    if (this.getBlock(e, s, n) === t && 8 & this.getMeta(e, s, n))
      for (const [t, i] of FLUID_HDIRS) {
        if (
          !SOLIDCUBE[this.getBlock(e + t, s, n + i)] &&
          !SOLIDCUBE[this.getBlock(e + t, s + 1, n + i)]
        )
          continue;
        const l = Math.hypot(o, r);
        h = l > 0 ? [o / l, -6, r / l] : [0, -6, 0];
        break;
      }
    const l = Math.hypot(h[0], h[1], h[2]);
    return l > 0 ? [h[0] / l, h[1] / l, h[2] / l] : h;
  }
  faceMask(t, e, s, n) {
    const i = this.getBlock(t, e, s),
      o = BLOCKS[i];
    if (!o || !o.solid || IS_FLUID[i]) return 0;
    if (o.shape === SH_CUBE) return 65535;
    if (o.shape !== SH_BOXES && o.shape !== SH_MODEL) return 0;
    const r = n >> 1,
      h = (r + 1) % 3,
      l = (r + 2) % 3;
    let c = 0;
    for (const i of o.boxes(this.getMeta(t, e, s)) || [])
      if (!(1 & n ? i[r + 3] < 16 : i[r] > 0))
        for (let t = 0; t < 4; t++)
          for (let e = 0; e < 4; e++) {
            const s = 4 * t + 2,
              n = 4 * e + 2;
            i[h] <= s && s < i[h + 3] && i[l] <= n && n < i[l + 3] && (c |= 1 << (4 * t + e));
          }
    return c;
  }
  fluidPass(t, e, s, n) {
    return (
      65535 !==
      (this.faceMask(t, e, s, n) |
        this.faceMask(t + DIRS[n][0], e + DIRS[n][1], s + DIRS[n][2], 1 ^ n))
    );
  }
  fenceMeta(t, e, s, n) {
    return connBits(n, (n, i) => this.getBlock(t + n, e, s + i));
  }
  isLoaded(t, e) {
    return this.chunks.has(ckey(t >> 4, e >> 4));
  }
  getLight(t, e, s) {
    if (e >= HEIGHT) return 240;
    if (e < 0) return 0;
    const n = this.chunks.get(ckey(t >> 4, s >> 4));
    return n ? n.getL((e << 8) | ((15 & s) << 4) | (15 & t)) : this.hasSky ? 240 : 0;
  }
  skyAt(t, e, s) {
    return this.getLight(t, e, s) >> 4;
  }
  blockLightAt(t, e, s) {
    return 15 & this.getLight(t, e, s);
  }
  surfaceY(t, e, s) {
    const n = this.chunks.get(ckey(t >> 4, e >> 4));
    if (!n) return 0;
    const i = ((15 & e) << 4) | (15 & t);
    for (let t = SECTIONS - 1; t >= 0; t--)
      if (null !== n.bs[t])
        for (let e = Math.min(HEIGHT - 1, 16 * t + 15); e >= 16 * t && e > 0; e--) {
          const t = n.getB((e << 8) | i);
          if (t && (BLOCKS[t].solid || (s && (IS_FLUID[t] || WLOG[t])))) return e;
        }
    return 0;
  }
  column(t, e) {
    const s = 1.4 * this.nCont.fbm2(t / 900, e / 900, 4),
      n = this.nErosion.fbm2(t / 500, e / 500, 3),
      i = 1 - Math.abs(this.nPeaks.fbm2(t / 280, e / 280, 4)),
      o = this.nHills.fbm2(t / 140, e / 140, 4),
      r = this.nHills.n2(t / 32 + 100, e / 32);
    let h;
    h =
      s < -0.45
        ? lerp(30, 40, (s + 1) / 0.55)
        : s < -0.18
          ? lerp(40, 55, (s + 0.45) / 0.27)
          : s < -0.06
            ? lerp(55, 62, (s + 0.18) / 0.12)
            : s < 0.05
              ? lerp(62, 66, (s + 0.06) / 0.11)
              : lerp(66, 78, clamp((s - 0.05) / 0.6, 0, 1));
    const l = smoothstep(-0.1, 0.1, s),
      c = smoothstep(0.02, 0.45, s) * smoothstep(0.05, -0.35, n);
    ((h += c * i * i * 95), (h += o * (5 + 10 * l) * (0.6 + c) + 2 * r));
    const f = Math.abs(this.nRiver.fbm2(t / 420, e / 420, 3));
    let a = 0;
    if (s > -0.12) {
      a = 1 - smoothstep(0, 0.045, f);
      const t = 57;
      a > 0 && h > t && (h = lerp(h, t, a * (h > 100 ? 0.5 : 1)));
    }
    const u = 1.6 * this.nTemp.fbm2(t / 1100, e / 1100, 3) + 0.03 * this.nSurf.n2(t / 40, e / 40),
      I = 1.6 * this.nHumid.fbm2(t / 900, e / 900, 3);
    return { h: Math.floor(h), temp: u, humid: I, river: a, cont: s, mount: c };
  }
  biomeOf(t) {
    const e = t.h,
      s = t.temp,
      n = t.humid;
    return e < SEA - 3
      ? t.river > 0.5 && t.cont > -0.12
        ? BI.RIVER
        : s < -0.5
          ? BI.FROZEN_OCEAN
          : BI.OCEAN
      : e <= SEA + 1 && t.river > 0.3
        ? BI.RIVER
        : e <= SEA + 2 && t.cont < 0.02
          ? s > 0.35 && n < 0.1
            ? BI.DESERT
            : BI.BEACH
          : e > 118
            ? BI.SNOWPEAK
            : e > 98 && t.mount > 0.3
              ? BI.MOUNTAIN
              : s > 0.35 && n < 0.1
                ? BI.DESERT
                : s < -0.42
                  ? BI.SNOWY
                  : s < -0.15
                    ? BI.TAIGA
                    : n > 0.38 && s > -0.05
                      ? BI.BIRCH
                      : n > 0.08
                        ? BI.FOREST
                        : BI.PLAINS;
  }
  tintFor(t, e, s, n, i) {
    const o = clamp(0.62 + 0.45 * e, 0, 1),
      r = clamp(0.5 + 0.5 * s, 0, 1) * o,
      h = Math.floor(255 * (1 - o)),
      l = 4 * (256 * Math.floor(255 * (1 - r)) + h);
    ((n[i] = t[l]), (n[i + 1] = t[l + 1]), (n[i + 2] = t[l + 2]));
  }
  generateFlat(t, e) {
    const s = new Chunk(t, e).beginFlat(),
      n = this.flatTop || 60;
    for (let t = 0; t < 16; t++)
      for (let e = 0; e < 16; e++) {
        for (let i = 0; i <= n; i++)
          s.blocks[(i << 8) | (t << 4) | e] = 0 === i ? 6 : i < n - 3 ? 1 : i < n ? 3 : 2;
        ((s.biome[16 * t + e] = BI.PLAINS),
          this.tintFor(this.grassMap, 0.3, 0.2, s.grass, 3 * (16 * t + e)),
          this.tintFor(this.foliageMap, 0.3, 0.2, s.foliage, 3 * (16 * t + e)));
      }
    return (s.recount(), s);
  }
  generate(t, e) {
    let s;
    s =
      "nether" === this.dim
        ? this.generateNether(t, e)
        : "end" === this.dim
          ? this.generateEnd(t, e)
          : this.flat
            ? this.generateFlat(t, e)
            : this.generateOverworld(t, e);
    for (const n of this.structuresFor(t, e)) n.apply(s);
    return (s.pack(), s);
  }
  generateOverworld(t, e) {
    const s = new Chunk(t, e).beginFlat(),
      n = s.blocks,
      i = s.meta,
      o = 16 * t,
      r = 16 * e,
      h = this.seed,
      l = new Array(324);
    for (let t = -1; t < 17; t++)
      for (let e = -1; e < 17; e++) l[18 * (t + 1) + e + 1] = this.column(o + e, r + t);
    let c = 0;
    for (let t = 0; t < 16; t++)
      for (let e = 0; e < 16; e++) {
        const n = l[18 * (t + 1) + e + 1];
        c = Math.max(c, n.h);
        const i = this.biomeOf(n);
        ((s.biome[16 * t + e] = i),
          this.tintFor(this.grassMap, n.temp, n.humid, s.grass, 3 * (16 * t + e)),
          this.tintFor(this.foliageMap, n.temp, n.humid, s.foliage, 3 * (16 * t + e)));
      }
    const f = Math.min(HEIGHT, c + 9) >> 3,
      a = f + 1,
      u = new Float32Array(5 * a * 5),
      I = new Float32Array(5 * a * 5),
      g = new Float32Array(5 * a * 5);
    for (let t = 0; t < 5; t++)
      for (let e = 0; e < 5; e++)
        for (let s = 0; s < a; s++) {
          const n = o + 4 * t,
            i = 8 * s,
            h = r + 4 * e,
            l = (5 * t + e) * a + s;
          ((u[l] = this.nCave1.n3(n / 48, i / 32, h / 48)),
            (I[l] = this.nCave2.n3(n / 48, i / 32, h / 48)),
            (g[l] = this.nCave3.n3(n / 90, i / 40, h / 90)));
        }
    const sample = (t, e, s, n) => {
        const i = e / 4,
          o = s / 8,
          r = n / 4,
          h = Math.min(0 | i, 3),
          l = Math.min(0 | o, a - 2),
          c = Math.min(0 | r, 3),
          f = i - h,
          u = o - l,
          I = r - c,
          g = (5 * h + c) * a + l,
          d = (5 * (h + 1) + c) * a + l,
          S = g + 1,
          k = d + 1,
          B = g + a,
          E = d + a,
          M = B + 1,
          p = E + 1,
          m = lerp(lerp(t[g], t[d], f), lerp(t[B], t[E], f), I),
          A = lerp(lerp(t[S], t[k], f), lerp(t[M], t[p], f), I);
        return lerp(m, A, u);
      },
      d = RNG(hashStr(h + ":" + t + ":" + e));
    for (let t = 0; t < 16; t++)
      for (let e = 0; e < 16; e++) {
        const c = 18 * (t + 1) + e + 1,
          f = l[c],
          a = f.h,
          d = s.biome[16 * t + e],
          S = Math.max(Math.abs(l[c - 1].h - l[c + 1].h), Math.abs(l[c - 18].h - l[c + 18].h)),
          k = o + e,
          B = r + t;
        let E,
          M,
          p = 3 + ((2 * hash3(k, 0, B, h)) | 0);
        if (d === BI.DESERT) ((E = 9), (M = 9), (p = 4));
        else if (d === BI.BEACH) ((E = 9), (M = 9));
        else if (d === BI.OCEAN || d === BI.FROZEN_OCEAN || d === BI.RIVER) {
          const t = this.nSurf.n2(k / 12, B / 12);
          ((E = a < SEA - 1 ? (t > 0.35 ? 10 : t < -0.5 ? 36 : 9) : 9),
            (M = 36 === E ? 36 : 9),
            d === BI.RIVER && a >= SEA - 1 && (E = 9));
        } else
          d === BI.MOUNTAIN || d === BI.SNOWPEAK
            ? ((E = S > 3 ? 1 : 2),
              (M = S > 3 ? 1 : 3),
              a > 135 + 6 * hash3(k, 1, B, h) && (E = 33))
            : ((E = 2), (M = 3));
        S > 5 && 2 === E && ((E = 1), (M = 1));
        for (let s = 0; s <= a && s < HEIGHT; s++) {
          let i;
          if (
            ((i =
              0 === s || (s < 4 && hash3(k, s, B, h) < (4 - s) / 4)
                ? 6
                : s === a
                  ? E
                  : s > a - p
                    ? M
                    : d === BI.DESERT && s > a - p - 3
                      ? 17
                      : s < 8 || (s < 16 && hash3(k, s, B, h + 77) < (16 - s) / 8)
                        ? 75
                        : 1),
            s > 4 && 6 !== i)
          ) {
            const n = s > a - 5;
            if (!(a < SEA + 2 && s > a - 9)) {
              const o = sample(u, e, s, t),
                r = sample(I, e, s, t);
              let h = o * o + r * r < (n ? 0.006 : 0.011);
              (!h && s < 52 && !n && (h = sample(g, e, s, t) > 0.62 - 0.004 * (52 - s)),
                h && (i = s <= 10 ? 8 : 0));
            }
          }
          n[(s << 8) | (t << 4) | e] = i;
        }
        for (let s = a + 1; s <= SEA; s++) {
          const i = (s << 8) | (t << 4) | e;
          0 === n[i] &&
            (n[i] =
              s === SEA && (d === BI.FROZEN_OCEAN || (d === BI.SNOWY && f.temp < -0.5)) ? 35 : 7);
        }
        if (
          (d === BI.SNOWY || d === BI.SNOWPEAK || (d === BI.MOUNTAIN && a > 125)) &&
          a >= SEA &&
          a + 1 < HEIGHT
        ) {
          const s = (a << 8) | (t << 4) | e;
          (2 === n[s] && (i[s] = 1),
            0 !== n[s] &&
              7 !== n[s] &&
              35 !== n[s] &&
              33 !== n[s] &&
              0 === n[((a + 1) << 8) | (t << 4) | e] &&
              (n[((a + 1) << 8) | (t << 4) | e] = 34));
        }
      }
    return (
      this.genOres(s, d),
      d() < 0.11 && !1 !== this.structures && this.genDungeon(s, l, d),
      this.decorate(s, l),
      s.recount(),
      s
    );
  }
  generateNether(t, e) {
    const s = new Chunk(t, e).beginFlat(),
      n = s.blocks,
      i = (s.meta, 16 * t),
      o = 16 * e,
      r = this.seed,
      h = 33,
      l = new Float32Array(825);
    for (let t = 0; t < 5; t++)
      for (let e = 0; e < 5; e++)
        for (let s = 0; s < h; s++) {
          const n = i + 4 * t,
            r = 4 * s,
            c = o + 4 * e;
          let f =
            0.95 * this.nNether.n3(n / 90, r / 42, c / 90) +
            0.42 * this.nNether2.n3(n / 34, r / 13, c / 34) +
            0.16 * this.nNether.n3(n / 11 + 300, r / 8, c / 11 - 300);
          ((f += Math.max(0, (18 - r) / 9) + Math.max(0, (r - 104) / 10)),
            (f -= 0.22 * Math.max(0, (52 - Math.abs(r - 64)) / 52)),
            (l[(5 * t + e) * h + s] = f));
        }
    const sample = (t, e, s) => {
      const n = t / 4,
        i = e / 4,
        o = s / 4,
        r = Math.min(0 | n, 3),
        c = Math.min(0 | i, 31),
        f = Math.min(0 | o, 3),
        a = n - r,
        u = i - c,
        I = o - f,
        g = (5 * r + f) * h + c,
        d = (5 * (r + 1) + f) * h + c,
        S = lerp(lerp(l[g], l[d], a), lerp(l[g + h], l[d + h], a), I),
        k = lerp(lerp(l[g + 1], l[d + 1], a), lerp(l[g + h + 1], l[d + h + 1], a), I);
      return lerp(S, k, u);
    };
    for (let t = 0; t < 16; t++)
      for (let e = 0; e < 16; e++) {
        const h = i + e,
          l = o + t;
        s.biome[16 * t + e] = BI.NETHER;
        const c = this.nNether2.n2(h / 50, l / 50) > 0.35,
          f = this.nNether.n2(h / 30 + 99, l / 30) > 0.45;
        for (let s = 0; s < 128; s++) {
          const i = (s << 8) | (t << 4) | e;
          let o;
          ((o =
            0 === s ||
            127 === s ||
            (s < 5 && hash3(h, s, l, r) < (5 - s) / 5) ||
            (s > 122 && hash3(h, s, l, r + 1) < (s - 122) / 5)
              ? 6
              : sample(e, s, t) > 0
                ? 119
                : s <= 31
                  ? 8
                  : 0),
            (n[i] = o));
        }
        for (let s = 120; s > 5; s--) {
          const i = (s << 8) | (t << 4) | e,
            o = n[((s + 1) << 8) | (t << 4) | e];
          119 === n[i] &&
            0 === o &&
            (c && s > 31
              ? ((n[i] = 120), 119 === n[i - 256] && (n[i - 256] = 120))
              : f && s >= 30 && s <= 35 && (n[i] = 10),
            s > 32 && hash3(h, s, l, r + 5) < 0.004 && (n[((s + 1) << 8) | (t << 4) | e] = 171));
        }
        for (let s = 26; s <= 34; s++) {
          const i = (s << 8) | (t << 4) | e;
          119 === n[i] && this.nNether.n3(h / 8, s / 8, l / 8) > 0.45 && (n[i] = 103);
        }
      }
    const c = RNG(hashStr("nether" + r + ":" + t + ":" + e)),
      at = (t, e, s) =>
        t < 0 || t > 15 || s < 0 || s > 15 || e < 1 || e > 126 ? -1 : n[(e << 8) | (s << 4) | t];
    for (let t = 0; t < 12; t++) {
      const t = 3 + c.int(10),
        e = 3 + c.int(10),
        s = 32 + c.int(92);
      if (0 === at(t, s, e) && 119 === at(t, s + 1, e)) {
        n[(s << 8) | (e << 4) | t] = 27;
        for (let i = 0; i < 900; i++) {
          const i = t + c.int(4) - c.int(4),
            o = s - c.int(10),
            r = e + c.int(4) - c.int(4);
          if (0 !== at(i, o, r)) continue;
          let h = 0;
          for (const t of DIRS) if (27 === at(i + t[0], o + t[1], r + t[2]) && ++h > 1) break;
          1 === h && (n[(o << 8) | (r << 4) | i] = 27);
        }
      }
    }
    const vein = (t, e, s, i, o) => {
      for (let r = 0; r < e; r++) {
        let e = 16 * c(),
          r = s + c() * (i - s),
          h = 16 * c();
        for (let s = 0; s < o; s++) {
          const s = 0 | e,
            i = 0 | r,
            o = 0 | h;
          if (s >= 0 && s < 16 && o >= 0 && o < 16 && i > 0 && i < 127) {
            const e = (i << 8) | (o << 4) | s;
            119 === n[e] && (n[e] = t);
          }
          ((e += 2 * c() - 1), (r += 2 * c() - 1), (h += 2 * c() - 1));
        }
      }
    };
    return (vein(121, 14, 10, 117, 12), vein(122, 8, 10, 117, 8), s.recount(), s);
  }
  fortressAt(t, e) {
    const s = RNG(hashStr("fortress" + this.seed + ":" + t + ":" + e));
    if (s() > 0.9) return null;
    return {
      x: 16 * (18 * t + 3 + s.int(12)) + 8,
      y: 58 + s.int(12),
      z: 16 * (18 * e + 3 + s.int(12)) + 8,
      key: "f" + t + "," + e,
    };
  }
  fortressesNear(t, e, s = 2) {
    if (this.gen2) {
      const t = [];
      for (const e of (this.structRefs || new Map()).values())
        e.f &&
          t.push({
            x: e.f[0],
            y: e.f[1] - (this.minY || 0),
            z: e.f[2],
            key: "v" + e.f[0] + "," + e.f[2],
          });
      return t;
    }
    const n = Math.floor(t / 288),
      i = Math.floor(e / 288),
      o = [];
    for (let t = -s; t <= s; t++)
      for (let e = -s; e <= s; e++) {
        const s = this.fortressAt(n + t, i + e);
        s && o.push(s);
      }
    return o;
  }
  nearestFortress(t, e) {
    let s = null,
      n = 1e9;
    for (const i of this.fortressesNear(t, e)) {
      const o = Math.hypot(i.x - t, i.z - e);
      o < n && ((n = o), (s = i));
    }
    return s;
  }
  buildFortress(t) {
    const e = new StructBuilder(),
      s = 123,
      n = 124,
      i = t.x,
      o = t.y,
      r = t.z,
      h = 44;
    RNG(hashStr(t.key + this.seed));
    for (const t of [0, 1])
      for (let l = -h; l <= h; l++) {
        for (let h = -2; h <= 2; h++) {
          const c = t ? i + h : i + l,
            f = t ? r + l : r + h;
          e.set(c, o, f, s);
          for (let t = o + 1; t <= o + 5; t++) e.set(c, t, f, 0);
          2 === Math.abs(h) && e.set(c, o + 1, f, n, t ? 12 : 3);
        }
        if (Math.abs(l) % 10 == 5)
          for (let n = o - 1; n >= Math.max(12, o - 50); n--)
            for (let h = -2; h <= 2; h++)
              for (let c = -1; c <= 1; c++) {
                const f = t ? i + h : i + l + c,
                  a = t ? r + l + c : r + h;
                (Math.abs(h) <= 1 || n < o - 3) && e.set(f, n, a, s);
              }
      }
    const room = (t, i, r, h) => {
      e.box(t - r, o, i - r, t + r, o + h, i + r, s);
      for (let s = 2 - r; s <= r - 2; s += 3)
        for (const [h, l] of [
          [s, -r],
          [s, r],
          [-r, s],
          [r, s],
        ])
          (e.set(t + h, o + 2, i + l, n, 15), e.set(t + h, o + 3, i + l, n, 15));
      for (const [s, n] of [
        [0, -r],
        [0, r],
        [-r, 0],
        [r, 0],
      ])
        for (let r = -1; r <= 1; r++)
          for (let h = o + 1; h <= o + 4; h++)
            e.set(t + s + (n ? r : 0), h, i + n + (s ? r : 0), 0);
    };
    (room(i, r, 7, 7),
      e.fill(i - 1, o + 1, r - 1, i + 1, o + 1, r + 1, s),
      e.set(i, o + 2, r, 127, 3),
      room(i + h, r, 5, 6));
    for (let t = -3; t <= 3; t++)
      for (let s = -1; s <= 1; s++)
        (e.set(i + h + t, o, r + 2 * s, 120), e.set(i + h + t, o + 1, r + 2 * s, 126, 3));
    (room(i - h, r, 5, 6),
      e.set(i - h, o + 1, r - 3, 52, 13),
      e.set(i - h + 2, o + 1, r + 3, 52, 12));
    for (let t = -4; t <= 4; t++)
      for (let l = -4; l <= 4; l++) {
        e.set(i + t, o, r + h + l, s);
        for (let s = o + 1; s <= o + 5; s++) e.set(i + t, s, r + h + l, 0);
        (4 !== Math.abs(t) && 4 !== Math.abs(l)) || e.set(i + t, o + 1, r + h + l, n, 15);
      }
    (e.fill(i - 1, o + 1, r + h - 1, i + 1, o + 1, r + h + 1, s),
      e.set(i, o + 2, r + h, 127, 3),
      room(i, r - h, 5, 6));
    for (let t = 0; t < 4; t++) {
      for (let n = o + 1; n <= o + t; n++) e.set(i - 2 + t, n, r - h + 3, s);
      e.set(i - 2 + t, o + 1 + t, r - h + 3, 125, 0);
    }
    for (const [t, s] of [
      [i - 5, r - 5],
      [i + 5, r + 5],
      [i + h, r],
      [i - h, r],
    ])
      e.set(t, o + 6, s, 27);
    return e;
  }
  strongholds() {
    if (this._sh) return this._sh;
    const t = RNG(hashStr("strongholds" + this.seed)),
      e = t() * Math.PI * 2,
      s = [];
    for (let n = 0; n < 3; n++) {
      const i = e + (n * Math.PI * 2) / 3 + 0.5 * (t() - 0.5),
        o = 640 + 420 * t();
      s.push({
        x: 16 * Math.floor((Math.cos(i) * o) / 16) + 8,
        y: 26 + t.int(10),
        z: 16 * Math.floor((Math.sin(i) * o) / 16) + 8,
        key: "sh" + n,
      });
    }
    return (this._sh = s);
  }
  buildStronghold(t) {
    const e = new StructBuilder(),
      s = t.x,
      n = t.y,
      i = t.z,
      o = RNG(hashStr(t.key + this.seed)),
      brick = () => {
        const t = o();
        return t < 0.7 ? 23 : t < 0.85 ? 94 : 93;
      };
    (e.box(s - 6, n - 1, i - 8, s + 6, n + 7, i + 8, brick),
      e.fill(s - 4, n, i - 4, s + 4, n, i + 4, () => brick()),
      e.fill(s - 1, n - 1, i - 1, s + 1, n - 1, i + 1, 8),
      e.fill(s - 1, n, i - 1, s + 1, n, i + 1, 0));
    for (let t = -1; t <= 1; t++)
      (e.set(s + t, n, i - 2, 174, o() < 0.1 ? 4 : 0),
        e.set(s + t, n, i + 2, 174, o() < 0.1 ? 4 : 0),
        e.set(s - 2, n, i + t, 174, o() < 0.1 ? 4 : 0),
        e.set(s + 2, n, i + t, 174, o() < 0.1 ? 4 : 0));
    for (let t = -1; t <= 1; t++) e.set(s + t, n, i + 5, 62, 3);
    const wt = (t) => {
      const e = BID.wall_torch;
      return void 0 === e
        ? [21, 0]
        : [
            e,
            Math.max(
              0,
              BLOCKS[e].states.findIndex((e) => e.facing === t),
            ),
          ];
    };
    for (const [t, o, r] of [
      [s - 5, i - 6, "east"],
      [s + 5, i - 6, "west"],
      [s - 5, i + 6, "east"],
      [s + 5, i + 6, "west"],
    ])
      e.set(t, n + 3, o, ...wt(r));
    const corridor = (t, s, i, o, r) => {
      for (let h = 0; h < r; h++) {
        const r = t + i * h,
          l = s + o * h;
        for (let t = -2; t <= 2; t++)
          for (let s = n - 1; s <= n + 3; s++) {
            const h = r + (o ? t : 0),
              c = l + (i ? t : 0),
              f = 2 === Math.abs(t) || s === n - 1 || s === n + 3;
            e.set(h, s, c, f ? brick() : 0);
          }
        h % 8 == 4 && e.set(r + (o ? 1 : 0), n + 2, l + (i ? 1 : 0), ...wt(o ? "west" : "north"));
      }
    };
    (corridor(s, i - 9, 0, -1, 22),
      corridor(s, i + 9, 0, 1, 22),
      corridor(s - 7, i, -1, 0, 22),
      corridor(s + 7, i, 1, 0, 22));
    for (const [t, o] of [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ])
      for (let r = -1; r <= 1; r++)
        for (let h = n; h <= n + 2; h++)
          e.set(s + t * (o ? 0 : 6) + (o ? r : 0), h, i + 8 * o + (t ? r : 0), 0);
    const r = s + 7 + 22 + 5;
    e.box(r - 5, n - 1, i - 6, r + 5, n + 6, i + 6, brick);
    for (let t = r - 4; t <= r + 4; t++)
      for (let s = n; s <= n + 4; s++) (e.set(t, s, i - 5, 25), e.set(t, s, i + 5, 25));
    (e.set(r + 3, n, i, 52, 8), e.set(r, n + 5, i, 27));
    for (let t = -1; t <= 1; t++) for (let s = n; s <= n + 2; s++) e.set(r - 5, s, i + t, 0);
    const h = s - 7 - 22 - 4;
    (e.box(h - 4, n - 1, i - 4, h + 4, n + 4, i + 4, brick),
      e.set(h - 3, n, i - 3, 52, 9),
      e.set(h - 3, n, i + 3, 52, 9),
      e.set(h, n + 3, i, 27));
    for (let t = -1; t <= 1; t++) for (let s = n; s <= n + 2; s++) e.set(h + 4, s, i + t, 0);
    const l = i - 9 - 22;
    for (let t = 0; t < 18; t++) {
      const i = l - t;
      for (let o = -2; o <= 2; o++)
        for (let r = n - 1 + t; r <= n + 4 + t; r++) {
          const h = 2 === Math.abs(o) || r === n - 1 + t || r === n + 4 + t;
          e.set(s + o, r, i, h ? brick() : 0);
        }
      for (let o = -1; o <= 1; o++) e.set(s + o, n + t, i, 62, 3);
    }
    return e;
  }
  initEnd() {
    const t = RNG(hashStr("pillars" + this.seed)),
      e = [];
    for (let t = 0; t < 10; t++) e.push(76 + 3 * t);
    for (let s = 9; s > 0; s--) {
      const n = t.int(s + 1),
        i = e[s];
      ((e[s] = e[n]), (e[n] = i));
    }
    this.endPillars = [];
    for (let t = 0; t < 10; t++) {
      const s = (2 * Math.PI * t) / 10;
      this.endPillars.push({
        x: Math.round(42 * Math.cos(s)),
        z: Math.round(42 * Math.sin(s)),
        r: (2 + (e[t] - 76) / 9) | 0,
        h: e[t],
      });
    }
    this.endTop0 = this.endTop(0, 0);
  }
  endTop(t, e) {
    const s = Math.hypot(t, e),
      n = 88 + 12 * this.nEnd.fbm2(t / 40, e / 40, 3);
    return Math.round(
      60 + 3 * this.nEnd.n2(t / 60 + 50, e / 60) - 6 * Math.pow(Math.min(1, s / n), 4),
    );
  }
  podiumY() {
    for (let t = this.endTop0 + 8; t > this.endTop0 - 2; t--)
      if (6 === this.getBlock(0, t, 0)) return t - 3;
    return this.endTop0 + (this.oldPodium ? 2 : 0);
  }
  generateEnd(t, e) {
    const s = new Chunk(t, e).beginFlat(),
      n = s.blocks,
      i = 16 * t,
      o = 16 * e;
    for (let t = 0; t < 16; t++)
      for (let e = 0; e < 16; e++) {
        const r = i + e,
          h = o + t,
          l = Math.hypot(r, h);
        s.biome[16 * t + e] = BI.END;
        const c = 88 + 12 * this.nEnd.fbm2(r / 40, h / 40, 3);
        if (l >= c) continue;
        const f = this.endTop(r, h),
          a = 0.45 * Math.sqrt(c * c - l * l) + 3;
        for (let s = Math.max(1, Math.round(f - a)); s <= f; s++) n[(s << 8) | (t << 4) | e] = 172;
      }
    for (const t of this.endPillars)
      if (!(t.x + t.r < i || t.x - t.r > i + 15 || t.z + t.r < o || t.z - t.r > o + 15)) {
        for (let e = t.x - t.r; e <= t.x + t.r; e++)
          for (let s = t.z - t.r; s <= t.z + t.r; s++)
            if (!(
              (e - t.x) ** 2 + (s - t.z) ** 2 > t.r * t.r + 1 ||
              e < i ||
              e > i + 15 ||
              s < o ||
              s > o + 15
            ))
              for (let r = 40; r <= t.h; r++) n[(r << 8) | ((s - o) << 4) | (e - i)] = 28;
        t.x >= i &&
          t.x <= i + 15 &&
          t.z >= o &&
          t.z <= o + 15 &&
          (n[((t.h + 1) << 8) | ((t.z - o) << 4) | (t.x - i)] = 6);
      }
    const r = !!this.oldPodium,
      h = this.endTop0 + (r ? 2 : 0);
    for (let t = -4; t <= 4; t++)
      for (let e = -4; e <= 4; e++) {
        const s = t,
          l = e;
        if (s < i || s > i + 15 || l < o || l > o + 15) continue;
        const c = Math.hypot(t, e),
          f = s - i,
          a = l - o;
        if (!(c > 3.5)) {
          ((n[((h - 1) << 8) | (a << 4) | f] = c <= 2.5 || r ? 6 : 172),
            (n[(h << 8) | (a << 4) | f] = c <= 2.5 ? 0 : 6));
          for (let t = h + 1; t <= Math.min(h + (r ? 5 : 32), HEIGHT - 1); t++)
            n[(t << 8) | (a << 4) | f] = 0;
          if (0 === t && 0 === e) for (let t = h; t <= h + 3; t++) n[(t << 8) | (a << 4) | f] = 6;
        }
      }
    const l = "undefined" != typeof BID ? BID.wall_torch : void 0;
    for (const [t, e, r] of [
      [1, 0, "east"],
      [-1, 0, "west"],
      [0, 1, "south"],
      [0, -1, "north"],
    ]) {
      if (void 0 === l || t < i || t > i + 15 || e < o || e > o + 15) continue;
      const c = ((h + 2) << 8) | ((e - o) << 4) | (t - i);
      ((n[c] = l),
        (s.meta[c] = Math.max(
          0,
          BLOCKS[l].states.findIndex((t) => t.facing === r),
        )));
    }
    return (s.recount(), s);
  }
  structuresFor(t, e) {
    const s = [],
      n = 16 * t + 8,
      i = 16 * e + 8;
    if (!1 === this.structures) return s;
    const get = (t, e) => {
      let s = this.structCache.get(t.key);
      return (s || ((s = e(t)), this.structCache.set(t.key, s)), s);
    };
    if ("overworld" !== this.dim || this.flat) {
      if ("nether" === this.dim)
        for (const t of this.fortressesNear(n, i, 1))
          Math.abs(t.x - n) < 70 &&
            Math.abs(t.z - i) < 70 &&
            s.push(get(t, (t) => this.buildFortress(t)));
    } else
      for (const t of this.strongholds())
        Math.abs(t.x - n) < 80 &&
          Math.abs(t.z - i) < 80 &&
          s.push(get(t, (t) => this.buildStronghold(t)));
    return s;
  }
  inFortress(t, e, s) {
    const n = this.nearestFortress(t, s);
    return n && Math.abs(n.x - t) <= 50 && Math.abs(n.z - s) <= 50 && e >= n.y - 2 && e <= n.y + 10;
  }
  genOres(t, e) {
    const s = t.blocks,
      vein = (t, n, i, o, r, h) => {
        for (let l = 0; l < i; l++) {
          let i = 16 * e(),
            l = o + e() * (r - o),
            c = 16 * e();
          const f = h * (0.6 + 0.6 * e());
          for (let o = 0; o < f; o++) {
            const o = 0 | i,
              r = 0 | l,
              h = 0 | c;
            if (o >= 0 && o < 16 && h >= 0 && h < 16 && r > 0 && r < HEIGHT) {
              const e = (r << 8) | (h << 4) | o;
              1 === s[e] ? (s[e] = t) : 75 === s[e] && n && (s[e] = n);
            }
            ((i += 2 * e() - 1), (l += 2 * e() - 1), (c += 2 * e() - 1));
          }
        }
      };
    (vein(74, 74, 6, 0, 90, 30),
      vein(73, 73, 5, 0, 90, 30),
      vein(72, 72, 6, 0, 90, 30),
      vein(3, 0, 6, 10, 100, 24),
      vein(10, 0, 5, 5, 100, 24),
      vein(13, 76, 22, 5, 130, 12),
      vein(12, 77, 16, 1, 72, 9),
      vein(11, 78, 3, 1, 32, 8),
      vein(80, 0, 6, 1, 16, 7),
      vein(81, 0, 2, 1, 32, 6),
      vein(18, 79, 2, 1, 16, 6));
  }
  genDungeon(t, e, s) {
    const n = t.blocks,
      i = t.meta,
      o = s.int(7),
      r = s.int(7),
      h = 8 + s.int(2),
      l = 8 + s.int(2);
    if (o + h > 15 || r + l > 15) return;
    let c = 999;
    for (let t = r; t <= r + l; t++)
      for (let s = o; s <= o + h; s++) c = Math.min(c, e[18 * (t + 1) + s + 1].h);
    const f = 8 + s.int(Math.max(1, Math.min(40, c - 20)));
    if (f + 12 > c) return;
    for (let t = 0; t <= 5; t++)
      for (let e = 0; e <= l; e++)
        for (let c = 0; c <= h; c++) {
          const a = ((f + t) << 8) | ((r + e) << 4) | (o + c);
          if (0 === c || 0 === e || c === h || e === l || 0 === t || 5 === t) {
            if (5 === t && 0 === n[a]) continue;
            n[a] = (0 === t && s() < 0.6) || s() < 0.25 ? 24 : 4;
          } else n[a] = 0;
          i[a] = 0;
        }
    const a = 1 + (s() < 0.5 ? 1 : 0),
      u = [
        [1, Math.floor(l / 2), 1],
        [h - 1, Math.floor(l / 2), 0],
        [Math.floor(h / 2), 1, 5],
        [Math.floor(h / 2), l - 1, 4],
      ];
    for (let t = 0; t < a; t++) {
      const [t, e, h] = u[s.int(4)],
        l = ((f + 1) << 8) | ((r + e) << 4) | (o + t);
      ((n[l] = 52), (i[l] = 8 | h));
    }
    {
      const t = ((f + 1) << 8) | ((r + (l >> 1)) << 4) | (o + (h >> 1));
      ((n[t] = 127), (i[t] = s.int(3)));
    }
    for (let t = 0; t < 3; t++) {
      const t = ((f + 1) << 8) | ((r + 2 + s.int(l - 3)) << 4) | (o + 2 + s.int(h - 3));
      0 === n[t] && s() < 0.5 && (n[t] = 70 + s.int(2));
    }
    t.dungeon = [16 * t.cx + o + h / 2, f + 1, 16 * t.cz + r + l / 2];
  }
  treesFor(t, e) {
    const s = ckey(t, e);
    this._treeCache || (this._treeCache = new Map());
    let n = this._treeCache.get(s);
    if (n) return n;
    n = [];
    const i = RNG(hashStr("trees" + this.seed + ":" + t + ":" + e)),
      o = this.column(16 * t + 8, 16 * e + 8),
      r = this.biomeOf(o),
      h =
        {
          [BI.FOREST]: 9,
          [BI.BIRCH]: 9,
          [BI.TAIGA]: 7,
          [BI.SNOWY]: 1.5,
          [BI.PLAINS]: 0.25,
          [BI.MOUNTAIN]: 0.6,
          [BI.RIVER]: 0.3,
        }[r] || 0;
    let l = Math.floor(h + i());
    for (let s = 0; s < l; s++) {
      const s = 16 * t + i.int(16),
        o = 16 * e + i.int(16),
        r = this.column(s, o),
        h = this.biomeOf(r);
      if (r.h <= SEA || r.h > 125) continue;
      if (h === BI.DESERT || h === BI.BEACH || h === BI.OCEAN || h === BI.SNOWPEAK) continue;
      const l = this.column(s + 1, o),
        c = this.column(s, o + 1);
      if (Math.abs(l.h - r.h) > 2 || Math.abs(c.h - r.h) > 2) continue;
      let f = "oak";
      (h === BI.TAIGA || h === BI.SNOWY || h === BI.MOUNTAIN
        ? (f = "spruce")
        : h === BI.BIRCH
          ? (f = i() < 0.85 ? "birch" : "oak")
          : h === BI.FOREST && (f = i() < 0.25 ? "birch" : i() < 0.1 ? "big" : "oak"),
        n.push({ x: s, y: r.h + 1, z: o, type: f, h: 4 + i.int(3), seed: i.int(1 << 30) }));
    }
    return (this._treeCache.size > 4e3 && this._treeCache.clear(), this._treeCache.set(s, n), n);
  }
  placeTree(t, e) {
    const { x: s, y: n, z: i, type: o } = e,
      r = RNG(e.seed);
    if ("oak" === o || "birch" === o || "big" === o) {
      const h = "birch" === o ? 46 : 14,
        l = "birch" === o ? 47 : 15,
        c = "birch" === o ? e.h + 1 : e.h + ("big" === o ? 2 : 0);
      for (let e = c - 3; e <= c; e++) {
        const o = e >= c - 1 ? 1 : 2;
        for (let h = -o; h <= o; h++)
          for (let f = -o; f <= o; f++)
            (Math.abs(h) === o && Math.abs(f) === o && (e === c || r() < 0.5)) ||
              t(s + h, n + e, i + f, l, 0, !1);
      }
      if ("big" === o)
        for (let e = -1; e <= 1; e++)
          for (let o = -1; o <= 1; o++) (e && o) || t(s + e, n + c + 1, i + o, l, 0, !1);
      for (let e = 0; e < c; e++) t(s, n + e, i, h, 0, !0);
      t(s, n - 1, i, 3, 0, !0);
    } else if ("spruce" === o) {
      const o = e.h + 3;
      let r = 0;
      for (let e = o; e >= 2; e--) {
        for (let o = -r; o <= r; o++)
          for (let h = -r; h <= r; h++)
            Math.abs(o) + Math.abs(h) > r + (r > 1 ? 1 : 0) || t(s + o, n + e, i + h, 50, 0, !1);
        ((r = r >= 2 ? 1 : r + 1), e === o && (r = 1));
      }
      t(s, n + o + 1, i, 50, 0, !1);
      for (let e = 0; e < o; e++) t(s, n + e, i, 49, 0, !0);
      t(s, n - 1, i, 3, 0, !0);
    }
  }
  decorate(t, e) {
    const s = t.blocks,
      n = t.meta,
      i = 16 * t.cx,
      o = 16 * t.cz,
      set = (t, e, r, h, l, c) => {
        const f = t - i,
          a = r - o;
        if (f < 0 || f > 15 || a < 0 || a > 15 || e < 1 || e >= HEIGHT) return;
        const u = (e << 8) | (a << 4) | f,
          I = s[u];
        (c ? 6 !== I : 0 === I || 34 === I || 39 === I || 40 === I) && ((s[u] = h), (n[u] = l));
      };
    for (let e = -1; e <= 1; e++)
      for (let n = -1; n <= 1; n++)
        for (const r of this.treesFor(t.cx + e, t.cz + n))
          if (!(r.x < i - 3 || r.x > i + 18 || r.z < o - 3 || r.z > o + 18)) {
            if (0 === e && 0 === n) {
              const t = s[((r.y - 1) << 8) | ((r.z - o) << 4) | (r.x - i)];
              if (2 !== t && 3 !== t) continue;
            }
            this.placeTree(set, r);
          }
    const r = RNG(hashStr("plants" + this.seed + ":" + t.cx + ":" + t.cz));
    for (let n = 0; n < 16; n++)
      for (let h = 0; h < 16; h++) {
        const l = e[18 * (n + 1) + h + 1].h;
        if (l + 1 >= HEIGHT || l < SEA) continue;
        const c = t.biome[16 * n + h],
          f = (l << 8) | (n << 4) | h,
          a = ((l + 1) << 8) | (n << 4) | h;
        if (0 !== s[a]) continue;
        const u = s[f],
          I = r();
        if (2 === u)
          c === BI.PLAINS
            ? I < 0.25
              ? (s[a] = 39)
              : I < 0.28
                ? (s[a] =
                    [41, 42, 98, 44, 101, 43][
                      (3 * this.nSurf.n2((i + h) / 30, (o + n) / 30) + 3) | 0
                    ] || 41)
                : I < 0.2805 && (s[a] = 53)
            : c === BI.FOREST || c === BI.BIRCH
              ? I < 0.12
                ? (s[a] = 39)
                : I < 0.135
                  ? (s[a] = [41, 42, 99, 102, 100][r.int(5)])
                  : I < 0.138 && (s[a] = r() < 0.5 ? 70 : 71)
              : c === BI.TAIGA
                ? I < 0.08
                  ? (s[a] = 40)
                  : I < 0.1
                    ? (s[a] = 39)
                    : I < 0.103 && (s[a] = 71)
                : c === BI.MOUNTAIN
                  ? I < 0.05 && (s[a] = 39)
                  : (c !== BI.RIVER && c !== BI.BEACH) || (I < 0.1 && (s[a] = 39));
        else if (9 === u && c === BI.DESERT)
          if (I < 0.006) {
            const t = 1 + r.int(3);
            for (let e = 1; e <= t && l + e < HEIGHT; e++) s[((l + e) << 8) | (n << 4) | h] = 37;
          } else I < 0.014 && (s[a] = 45);
        if ((2 === u || 9 === u || 3 === u) && l <= SEA + 1 && r() < 0.12) {
          let t = !1;
          for (const [e, i] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const o = h + e,
              r = n + i;
            o >= 0 && o < 16 && r >= 0 && r < 16 && 7 === s[(l << 8) | (r << 4) | o] && (t = !0);
          }
          if (t) {
            const t = 1 + r.int(3);
            for (let e = 1; e <= t; e++) s[((l + e) << 8) | (n << 4) | h] = 38;
          }
        }
      }
  }
  initLight(t) {
    (t.lit || lightChunk(t, this.hasSky), this.exchangeLight(t), (t.lit = !0));
  }
  exchangeLight(t) {
    const e = 16 * t.cx,
      s = 16 * t.cz;
    for (const [n, i] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const o = this.getChunk(t.cx + n, t.cz + i);
      if (!o || !o.lit) continue;
      const r = [],
        h = [],
        l = 16 * o.cx,
        c = 16 * o.cz;
      for (let f = 0; f < SECTIONS; f++) {
        if (!t.ls[f] && !o.ls[f]) {
          const e = t.lu[f],
            s = o.lu[f];
          if (Math.abs((e >> 4) - (s >> 4)) <= 1 && Math.abs((15 & e) - (15 & s)) <= 1) continue;
        }
        for (let a = f << 4; a < (f + 1) << 4; a++)
          for (let f = 0; f < 16; f++) {
            let u, I, g, d;
            1 === n
              ? ((u = 15), (I = f), (g = 0), (d = f))
              : -1 === n
                ? ((u = 0), (I = f), (g = 15), (d = f))
                : 1 === i
                  ? ((u = f), (I = 15), (g = f), (d = 0))
                  : ((u = f), (I = 0), (g = f), (d = 15));
            const S = t.getL((a << 8) | (I << 4) | u),
              k = o.getL((a << 8) | (d << 4) | g),
              B = S >> 4,
              E = k >> 4,
              M = 15 & S,
              p = 15 & k;
            (B > E + 1 ? r.push(e + u, a, s + I) : E > B + 1 && r.push(l + g, a, c + d),
              M > p + 1 ? h.push(e + u, a, s + I) : p > M + 1 && h.push(l + g, a, c + d));
          }
      }
      (r.length && this.propagate(r, 4), h.length && this.propagate(h, 0));
    }
  }
  markLight(t, e, s, n) {
    const i = 1 << (s >> 4);
    let o = i;
    const r = 15 & s;
    if (
      (0 === r && s > 0 ? (o |= i >> 1) : 15 === r && (o |= i << 1),
      (t.dirty |= o),
      0 === e || 15 === e || 0 === n || 15 === n)
    ) {
      const s = 0 === e ? -1 : 15 === e ? 1 : 0,
        i = 0 === n ? -1 : 15 === n ? 1 : 0;
      if (s) {
        const e = this.chunks.get(ckey(t.cx + s, t.cz));
        e && (e.dirty |= o);
      }
      if (i) {
        const e = this.chunks.get(ckey(t.cx, t.cz + i));
        e && (e.dirty |= o);
      }
      if (s && i) {
        const e = this.chunks.get(ckey(t.cx + s, t.cz + i));
        e && (e.dirty |= o);
      }
    }
  }
  propagate(t, e) {
    const s = 4 === e;
    let n = 0,
      i = null,
      o = 0,
      r = 0;
    for (; n < t.length;) {
      const h = t[n++],
        l = t[n++],
        c = t[n++],
        f = h >> 4,
        a = c >> 4;
      if (((i && f === o && a === r) || ((i = this.chunks.get(ckey(f, a))), (o = f), (r = a)), !i))
        continue;
      const u = (i.getL((l << 8) | ((15 & c) << 4) | (15 & h)) >> e) & 15;
      if (!(u <= 1))
        for (let n = 0; n < 6; n++) {
          const o = DIRS[n],
            r = h + o[0],
            I = l + o[1],
            g = c + o[2];
          if (I < 0 || I >= HEIGHT) continue;
          const d = r >> 4 === f && g >> 4 === a ? i : this.chunks.get(ckey(r >> 4, g >> 4));
          if (!d) continue;
          const S = (I << 8) | ((15 & g) << 4) | (15 & r),
            k = OPACITY[d.getB(S)];
          if (k >= 15) continue;
          const B = s && 2 === n && 15 === u && 0 === k ? 15 : u - Math.max(1, k),
            E = d.getL(S);
          B > ((E >> e) & 15) &&
            (d.setL(S, s ? (15 & E) | (B << 4) : (240 & E) | B),
            this.markLight(d, 15 & r, I, 15 & g),
            t.push(r, I, g));
        }
    }
    t.length = 0;
  }
  relight(t, e, s) {
    for (const n of this.hasSky ? [4, 0] : [0]) {
      const i = 4 === n,
        o = [],
        r = [],
        h = this.getChunk(t >> 4, s >> 4),
        l = (e << 8) | ((15 & s) << 4) | (15 & t),
        c = (h.getL(l) >> n) & 15;
      c > 0 &&
        (h.setL(l, h.getL(l) & (i ? 15 : 240)),
        this.markLight(h, 15 & t, e, 15 & s),
        o.push(t, e, s, c));
      let f = 0;
      for (; f < o.length;) {
        const t = o[f++],
          e = o[f++],
          s = o[f++],
          h = o[f++];
        for (let l = 0; l < 6; l++) {
          const c = DIRS[l],
            f = t + c[0],
            a = e + c[1],
            u = s + c[2];
          if (a < 0 || a >= HEIGHT) continue;
          const I = this.chunks.get(ckey(f >> 4, u >> 4));
          if (!I) continue;
          const g = (a << 8) | ((15 & u) << 4) | (15 & f),
            d = I.getL(g),
            S = (d >> n) & 15;
          0 !== S &&
            (S < h || (i && 2 === l && 15 === h && 15 === S)
              ? (I.setL(g, d & (i ? 15 : 240)),
                this.markLight(I, 15 & f, a, 15 & u),
                o.push(f, a, u, S))
              : r.push(f, a, u));
        }
      }
      if (i)
        e === HEIGHT - 1 &&
          0 === OPACITY[h.getB(l)] &&
          (h.setL(l, 240 | h.getL(l)), r.push(t, e, s));
      else {
        const n = h.getB(l),
          i = EMIT[n] && emitOf(n, h.getM(l), h.wl && h.wl.has(l));
        i && (h.setL(l, (240 & h.getL(l)) | i), r.push(t, e, s));
      }
      for (let n = 0; n < 6; n++)
        r.push(t + DIRS[n][0], Math.max(0, Math.min(HEIGHT - 1, e + DIRS[n][1])), s + DIRS[n][2]);
      this.propagate(r, n);
    }
  }
  markBlock(t, e, s, n) {
    const i = 1 << (s >> 4);
    let o = i;
    const r = 15 & s;
    if (
      (0 === r && s > 0 ? (o |= i >> 1) : 15 === r && (o |= i << 1),
      (t.dirty |= o),
      0 === e || 15 === e || 0 === n || 15 === n)
    ) {
      const s = 0 === e ? -1 : 15 === e ? 1 : 0,
        i = 0 === n ? -1 : 15 === n ? 1 : 0;
      if (s) {
        const e = this.chunks.get(ckey(t.cx + s, t.cz));
        e && (e.dirty |= o);
      }
      if (i) {
        const e = this.chunks.get(ckey(t.cx, t.cz + i));
        e && (e.dirty |= o);
      }
      if (s && i) {
        const e = this.chunks.get(ckey(t.cx + s, t.cz + i));
        e && (e.dirty |= o);
      }
    }
  }
  setBlock(t, e, s, n, i = 0, o = 1) {
    if (e < 0 || e >= HEIGHT) return !1;
    const r = this.getChunk(t >> 4, s >> 4);
    if (!r) return !1;
    const h = (e << 8) | ((15 & s) << 4) | (15 & t),
      l = r.getB(h),
      c = r.getM(h);
    if (l === n && c === i) return !1;
    const f = !(!r.wl || !r.wl.has(h));
    if (
      (!f || (l === n && canWaterlog(n, i)) || (r.wl.delete(h), n || ((n = 7), (i = 0))),
      r.setB(h, n),
      r.setM(h, i),
      !l && n ? r.sectionCount[e >> 4]++ : l && !n && r.sectionCount[e >> 4]--,
      (r.modified = !0),
      this.markBlock(r, 15 & t, e, 15 & s),
      2 & o ||
        (OPACITY[l] === OPACITY[n] && emitOf(l, c, f) === emitOf(n, i, r.wl && r.wl.has(h))) ||
        this.relight(t, e, s),
      1 & o)
    ) {
      this.notify(t, e, s, l);
      for (let n = 0; n < 6; n++) this.notify(t + DIRS[n][0], e + DIRS[n][1], s + DIRS[n][2], -1);
    }
    return (this.listener && this.listener.onBlockChanged(t, e, s, l, n, c), !0);
  }
  setMeta(t, e, s, n) {
    const i = this.getChunk(t >> 4, s >> 4);
    if (!i || e < 0 || e >= HEIGHT) return;
    const o = (e << 8) | ((15 & s) << 4) | (15 & t);
    if (i.getM(o) !== n) {
      (i.setM(o, n), (i.modified = !0), this.markBlock(i, 15 & t, e, 15 & s));
      for (const n of DIRS) {
        const i = t + n[0],
          o = e + n[1],
          r = s + n[2],
          h = this.getBlock(i, o, r);
        IS_FLUID[h] && this.schedule(i, o, r, 7 === h ? 5 : "nether" === this.dim ? 10 : 30);
      }
      this.isWaterlogged(t, e, s) && this.schedule(t, e, s, 5);
    }
  }
  notify(t, e, s, n) {
    if (e < 0 || e >= HEIGHT) return;
    const i = this.getBlock(t, e, s);
    (IS_FLUID[i]
      ? this.schedule(t, e, s, 7 === i || 1 === FLUID_MOD[i] ? 5 : "nether" === this.dim ? 10 : 30)
      : 171 === i
        ? this.schedule(t, e, s, 30 + ((10 * Math.random()) | 0))
        : this.isWaterlogged(t, e, s) && this.schedule(t, e, s, 5),
      this.listener && i && this.listener.onNeighborUpdate(t, e, s, i));
  }
  schedule(t, e, s, n) {
    const i = `${t},${e},${s}`;
    this.ticks.has(i) || this.ticks.set(i, { x: t, y: e, z: s, t: this.time + n });
  }
  tickScheduled() {
    if (!this.ticks.size) return;
    const t = [];
    for (const [e, s] of this.ticks)
      if (s.t <= this.time && (t.push(s), this.ticks.delete(e), t.length > 400)) break;
    for (const e of t)
      if (171 === this.getBlock(e.x, e.y, e.z)) {
        if (!this.isLoaded(e.x, e.z) || !this.listener || !this.listener.fireTick) continue;
        (this.listener.fireTick(e.x, e.y, e.z),
          171 === this.getBlock(e.x, e.y, e.z) &&
            this.schedule(e.x, e.y, e.z, 30 + ((10 * Math.random()) | 0)));
      } else this.fluidTick(e.x, e.y, e.z);
  }
  canFlowInto(t) {
    return (
      !WLOG[t] &&
      (0 === t ||
        (REPLACEABLE[t] && !IS_FLUID[t]) ||
        21 === t ||
        1 === TORCHLIKE[t] ||
        (BLOCKS[t] && BLOCKS[t].needsSupport && !BLOCKS[t].solid && t !== BID.sea_pickle))
    );
  }
  fluidTick(t, e, s) {
    if (!this.isLoaded(t, s)) return;
    const n = !IS_FLUID[this.getBlock(t, e, s)] && this.isWaterlogged(t, e, s),
      i = n ? 7 : this.getBlock(t, e, s);
    if (!IS_FLUID[i]) return;
    let o = n ? 0 : this.getMeta(t, e, s);
    const r = FLUID_MOD[i],
      h = 7 === i || 1 === r,
      l = h || "nether" === this.dim ? 1 : 2,
      c = r ? -1 : h ? 8 : 7,
      f = 7 === i;
    if (!h && !r)
      for (let n = 0; n < 6; n++) {
        if (2 === n) continue;
        const i = t + DIRS[n][0],
          r = e + DIRS[n][1],
          h = s + DIRS[n][2];
        if (7 === this.getBlock(i, r, h) || this.isWaterlogged(i, r, h))
          return (
            this.setBlock(t, e, s, 0 === o ? 28 : 4, 0),
            void (this.listener && this.listener.onFizz(t, e, s))
          );
      }
    if (
      8 === i &&
      void 0 !== BID.basalt &&
      this.getBlock(t, e - 1, s) === BID.soul_soil &&
      [0, 1, 3, 4, 5].some(
        (n) => this.getBlock(t + DIRS[n][0], e + DIRS[n][1], s + DIRS[n][2]) === BID.blue_ice,
      )
    )
      return (
        this.setBlock(t, e, s, BID.basalt, 0),
        void (this.listener && this.listener.onFizz(t, e, s))
      );
    if (0 !== o) {
      const n = this.newLiquid(i, t, e, s, f, l);
      if (n !== o) {
        if (n < 0) return void this.setBlock(t, e, s, 0, 0);
        (!h &&
          8 !== o &&
          8 !== n &&
          n < o &&
          Math.random() < 0.75 &&
          this.schedule(t, e, s, 4 * ("nether" === this.dim ? 10 : 30)),
          this.setBlock(t, e, s, i, n),
          (o = n));
      }
    }
    const a = this.getBlock(t, e - 1, s);
    if (e > 0 && (this.canFlowInto(a) || a === c) && (!n || this.fluidPass(t, e, s, 2))) {
      if (
        (a === c
          ? (this.setBlock(t, e - 1, s, h && 0 === this.getMeta(t, e - 1, s) ? 28 : 1, 0),
            this.listener && this.listener.onFizz(t, e - 1, s))
          : (a && this.listener && this.listener.onFluidDestroy(t, e - 1, s, a, h),
            this.setBlock(t, e - 1, s, i, 8)),
        0 !== o || this.sourceNeighbors(i, t, e, s) < 3)
      )
        return;
    } else if (a === i && 0 !== o) return;
    if ((8 & o ? 0 : o) + l >= 8) return;
    const u = h || "nether" === this.dim ? 4 : 2;
    let I = 1e3;
    const g = [],
      d = new Map();
    for (let o = 0; o < 4; o++) {
      const r = FLUID_HDIRS[o],
        h = t + r[0],
        l = s + r[1],
        f = this.getBlock(h, e, l);
      if (n && !this.fluidPass(t, e, s, FLUID_HDIR_D[o])) continue;
      const a = f === i;
      if (a ? 0 === this.getMeta(h, e, l) : !this.canFlowInto(f) && f !== c) continue;
      const S = this.fluidHole(i, h, e, l) ? 0 : this.slopeDistance(i, h, e, l, 1, 2 ^ o, u, d);
      (S < I && ((I = S), (g.length = 0)), S <= I && !a && g.push(o));
    }
    for (const n of g) {
      const o = FLUID_HDIRS[n],
        r = t + o[0],
        a = s + o[1],
        u = this.getBlock(r, e, a);
      if (u === c) {
        (this.setBlock(r, e, a, h ? (0 === this.getMeta(r, e, a) ? 28 : 4) : 1, 0),
          this.listener && this.listener.onFizz(r, e, a));
        continue;
      }
      const I = this.newLiquid(i, r, e, a, f, l);
      I < 0 ||
        (u && this.listener && this.listener.onFluidDestroy(r, e, a, u, h),
        this.setBlock(r, e, a, i, I));
    }
  }
  bubbleColumnAt(t, e, s) {
    if (7 !== this.getBlock(t, e, s) || 0 !== this.getMeta(t, e, s) || void 0 === BID.soul_sand)
      return 0;
    this._bcT !== this.time && ((this._bcT = this.time), (this._bc = new Map()));
    const n = `${t},${e},${s}`;
    let i = this._bc.get(n);
    if (void 0 !== i) return i;
    i = 0;
    for (let n = e - 1; n >= Math.max(0, e - 64); n--) {
      const e = this.getBlock(t, n, s);
      if (7 !== e || 0 !== this.getMeta(t, n, s)) {
        i = e === BID.soul_sand ? 1 : e === BID.magma_block ? -1 : 0;
        break;
      }
    }
    return (this._bc.set(n, i), i);
  }
  newLiquid(t, e, s, n, i, o) {
    let r = 0,
      h = 0;
    for (let o = 0; o < 4; o++) {
      const l = FLUID_HDIRS[o];
      let c;
      if (this.getBlock(e + l[0], s, n + l[1]) === t) c = this.getMeta(e + l[0], s, n + l[1]);
      else {
        if (!(
          i &&
          this.isWaterlogged(e + l[0], s, n + l[1]) &&
          this.fluidPass(e, s, n, FLUID_HDIR_D[o])
        ))
          continue;
        c = 0;
      }
      (0 === c && h++, (r = Math.max(r, 0 === c || 8 & c ? 8 : 8 - (7 & c))));
    }
    if (i && h >= 2) {
      const i = this.getBlock(e, s - 1, n);
      if (BLOCKS[i].solid || (i === t && 0 === this.getMeta(e, s - 1, n))) return 0;
    }
    if (
      this.getBlock(e, s + 1, n) === t ||
      (i && this.isWaterlogged(e, s + 1, n) && this.fluidPass(e, s, n, 3))
    )
      return 8;
    const l = r - o;
    return l <= 0 ? -1 : 8 - l;
  }
  sourceNeighbors(t, e, s, n) {
    let i = 0;
    for (const o of FLUID_HDIRS) {
      const r = e + o[0],
        h = n + o[1];
      (this.getBlock(r, s, h) === t
        ? 0 === this.getMeta(r, s, h)
        : 7 === t && this.isWaterlogged(r, s, h)) && i++;
    }
    return i;
  }
  fluidHole(t, e, s, n) {
    const i = this.getBlock(e, s - 1, n);
    return (
      s > 0 &&
      (i === t ||
        this.canFlowInto(i) ||
        (7 === t && this.isWaterlogged(e, s - 1, n) && this.fluidPass(e, s, n, 2)))
    );
  }
  slopeDistance(t, e, s, n, i, o, r, h = new Map()) {
    const K = (t, e) => 65536 * (t + 32768) + e + 32768,
      state = (e, n) => {
        const i = K(e, n);
        let o = h.get(i);
        if (void 0 === o) {
          const r = this.getBlock(e, s, n);
          ((o =
            this.canFlowInto(r) || (r === t && 0 !== this.getMeta(e, s, n))
              ? this.fluidHole(t, e, s, n)
                ? 2
                : 1
              : 0),
            h.set(i, o));
        }
        return o;
      },
      l = FLUID_HDIRS[o],
      c = new Set([K(e, n), K(e + l[0], n + l[1])]);
    let f = [[e, n]];
    for (let t = i; t <= r && f.length; t++) {
      const e = [];
      for (const [s, n] of f)
        for (const i of FLUID_HDIRS) {
          const o = s + i[0],
            r = n + i[1],
            h = K(o, r);
          if (c.has(h)) continue;
          c.add(h);
          const l = state(o, r);
          if (2 === l) return t;
          1 === l && e.push([o, r]);
        }
      f = e;
    }
    return 1e3;
  }
  randomTick(t, e, s) {
    const n = this.listener;
    if (!n) return;
    const i = t >> 4,
      o = e >> 4,
      r = n.randomTickTable ? n.randomTickTable() : null;
    let h = 0 | this.rtSeed;
    h || (h = (4294967296 * s()) | 0 || 1);
    for (let t = -4; t <= 4; t++)
      for (let e = -4; e <= 4; e++) {
        const s = this.getChunk(i + t, o + e);
        if (s && s.lit)
          for (let t = 0; t < SECTIONS; t++) {
            if (!s.sectionCount[t]) continue;
            const e = s.bs[t];
            if (r && e && e.n >= 0) {
              if (e.rtP !== e.p || e.rtN !== e.n) {
                let t = 0;
                for (let s = 0, n = e.p; s < e.n; s++)
                  if (r[n[s]]) {
                    t = 1;
                    break;
                  }
                ((e.rt = t), (e.rtP = e.p), (e.rtN = e.n));
              }
              if (!e.rt) continue;
            }
            for (let e = 0; e < 3; e++) {
              ((h ^= h << 13), (h ^= h >>> 17), (h ^= h << 5), (this.rtSeed = h));
              const e = h >>> 20,
                i = 15 & e,
                o = (e >> 4) & 15,
                l = (t << 4) | (e >> 8),
                c = s.getB((l << 8) | (o << 4) | i);
              !c || (r && !r[c]) || n.onRandomTick(16 * s.cx + i, l, 16 * s.cz + o, c, s);
            }
          }
      }
  }
}
//# sourceURL=js/world.js
