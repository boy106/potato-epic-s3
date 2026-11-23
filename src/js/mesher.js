"use strict";
const VSTRIDE = 32,
  FACE_SHADE = [0.6, 0.6, 0.5, 1, 0.8, 0.8];
function setFaceShade(t) {
  const s = "nether" === t;
  ((FACE_SHADE[2] = s ? 0.9 : 0.5), (FACE_SHADE[3] = s ? 0.9 : 1));
}
const FACES = [
    {
      n: [-1, 0, 0],
      c: [
        [0, 0, 0],
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0],
      ],
      uv: (t, s, i) => [i, 1 - s],
    },
    {
      n: [1, 0, 0],
      c: [
        [1, 0, 1],
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 1],
      ],
      uv: (t, s, i) => [1 - i, 1 - s],
    },
    {
      n: [0, -1, 0],
      c: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 0, 1],
        [0, 0, 1],
      ],
      uv: (t, s, i) => [t, 1 - i],
    },
    {
      n: [0, 1, 0],
      c: [
        [0, 1, 0],
        [0, 1, 1],
        [1, 1, 1],
        [1, 1, 0],
      ],
      uv: (t, s, i) => [t, i],
    },
    {
      n: [0, 0, -1],
      c: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
      uv: (t, s, i) => [1 - t, 1 - s],
    },
    {
      n: [0, 0, 1],
      c: [
        [0, 0, 1],
        [1, 0, 1],
        [1, 1, 1],
        [0, 1, 1],
      ],
      uv: (t, s, i) => [t, 1 - s],
    },
  ],
  AO_D1 = new Int16Array(24),
  AO_D2 = new Int16Array(24),
  FACE_UV = new Float64Array(48),
  FACE_UVR = new Float64Array(48);
for (let t = 0; t < 6; t++)
  for (let s = 0; s < 4; s++) {
    const i = FACES[t],
      e = i.n,
      n = i.c[s],
      r = 4 * t + s;
    let h = 0,
      o = 0,
      a = 0,
      l = 0,
      c = 0,
      u = 0;
    (e[0]
      ? ((o = n[1] ? 1 : -1), (u = n[2] ? 1 : -1))
      : e[1]
        ? ((h = n[0] ? 1 : -1), (u = n[2] ? 1 : -1))
        : ((h = n[0] ? 1 : -1), (c = n[1] ? 1 : -1)),
      (AO_D1[r] = 324 * o + 18 * a + h),
      (AO_D2[r] = 324 * c + 18 * u + l));
    const f = i.uv(n[0], n[1], n[2]);
    ((FACE_UV[2 * r] = f[0]),
      (FACE_UV[2 * r + 1] = f[1]),
      (FACE_UVR[2 * r] = 1 - f[1]),
      (FACE_UVR[2 * r + 1] = f[0]));
  }
const AO_V = new Float64Array(4),
  AO_SK = new Float64Array(4),
  AO_BK = new Float64Array(4),
  VM_HAS = new Uint8Array(MAX_BLOCKS),
  LEAF_BLOCK = new Uint8Array(MAX_BLOCKS),
  SOLID_LEAF = 32768;
for (let t = 0; t < MAX_BLOCKS; t++)
  BLOCKS[t] && /leaves$/.test(BLOCKS[t].key) && (LEAF_BLOCK[t] = 1);
let FAST_LEAVES = !1;
function setFastLeaves(t) {
  FAST_LEAVES = !!t;
}
const FLAT_BOX = new Uint8Array(MAX_BLOCKS),
  TRANS_LATE = new Uint8Array(MAX_BLOCKS),
  FLUID_WALL = new Uint8Array(MAX_BLOCKS);
for (let t = 0; t < MAX_BLOCKS; t++) {
  const s = BLOCKS[t];
  s &&
    ("farmland" === s.key || "dirt_path" === s.key
      ? (FLAT_BOX[t] = 1)
      : s.slab
        ? (FLAT_BOX[t] = 2)
        : "snow" === s.key && (FLAT_BOX[t] = 3),
    "translucent" === s.render && s.shape !== SH_LIQUID && (TRANS_LATE[t] = 1),
    (SOLIDCUBE[t] || (s.solid && s.shape !== SH_LIQUID)) && (FLUID_WALL[t] = 1));
}
const FLUID_INSET = 1 / 256,
  ANIM_FRAMES = new Uint8Array(4096);
function initAnimTable() {
  for (const t in ASSETS.anims) ANIM_FRAMES[ASSETS.tiles[t]] = ASSETS.anims[t];
}
class MeshBuffer {
  constructor(t) {
    (this.alloc(t), (this.n = 0));
  }
  alloc(t) {
    const s = new ArrayBuffer(32 * t);
    (this.buf && new Uint8Array(s).set(new Uint8Array(this.buf, 0, 32 * this.n)),
      (this.buf = s),
      (this.cap = t),
      (this.f = new Float32Array(s)),
      (this.u16 = new Uint16Array(s)),
      (this.u8 = new Uint8Array(s)));
  }
  reset() {
    this.n = 0;
  }
  append(t) {
    (this.n + t.n > this.cap && this.alloc(Math.max(2 * this.cap, this.n + t.n)),
      this.u8.set(t.u8.subarray(0, 32 * t.n), 32 * this.n),
      (this.n += t.n));
  }
  appendQuads(t, s, i) {
    const e = t.f;
    for (let n = 0; n < t.n; n += 4) {
      const r = 8 * n;
      (e[r + 1] >= s && e[r + 9] >= s && e[r + 17] >= s && e[r + 25] >= s) === i &&
        (this.n + 4 > this.cap && this.alloc(2 * this.cap),
        this.u8.set(t.u8.subarray(32 * n, 32 * (n + 4)), 32 * this.n),
        (this.n += 4));
    }
  }
  v(t, s, i, e, n, r, h, o, a, l, c, u, f, A) {
    this.n >= this.cap && this.alloc(2 * this.cap);
    const S = 8 * this.n,
      d = 16 * this.n,
      E = 32 * this.n,
      _ = this.f;
    ((_[S] = t),
      (_[S + 1] = s),
      (_[S + 2] = i),
      (_[S + 3] = e),
      (_[S + 4] = n),
      (this.u16[d + 10] = r),
      (this.u16[d + 11] = h));
    const B = this.u8;
    ((B[E + 24] = o),
      (B[E + 25] = a),
      (B[E + 26] = l),
      (B[E + 27] = c),
      (B[E + 28] = u),
      (B[E + 29] = f),
      (B[E + 30] = A),
      (B[E + 31] = 0),
      this.n++);
  }
  slice() {
    return new Uint8Array(this.buf.slice(0, 32 * this.n));
  }
}
const SVSTRIDE = 24,
  SV_SCALE = 2048,
  _hf = new Float32Array(1),
  _hu = new Uint32Array(_hf.buffer);
function toHalf(t) {
  _hf[0] = t;
  const s = _hu[0];
  let i = (s >> 16) & 32768,
    e = (s >> 12) & 2047;
  const n = (s >> 23) & 255;
  return n < 103
    ? i
    : n > 142
      ? 31744 | i
      : n < 113
        ? ((e |= 2048), i | ((e >> (114 - n)) + ((e >> (113 - n)) & 1)))
        : ((i |= ((n - 112) << 10) | (e >> 1)), i + (1 & e));
}
function compactVerts(t, s, i, e) {
  const n = t.n,
    r = t.f,
    h = t.u16,
    o = t.u8,
    a = new Uint32Array(t.buf),
    l = new ArrayBuffer(24 * n),
    c = new Uint16Array(l),
    u = new Uint32Array(l);
  for (let t = 0; t < n; t++) {
    const n = 8 * t,
      l = 12 * t;
    let f = Math.round(2048 * (r[n] - s + 8));
    ((c[l] = f < 0 ? 0 : f > 65535 ? 65535 : f),
      (f = Math.round(2048 * (r[n + 1] - i + 8))),
      (c[l + 1] = f < 0 ? 0 : f > 65535 ? 65535 : f),
      (f = Math.round(2048 * (r[n + 2] - e + 8))),
      (c[l + 2] = f < 0 ? 0 : f > 65535 ? 65535 : f),
      (c[l + 3] = o[32 * t + 30]));
    const A = r[n + 3],
      S = r[n + 4];
    ((c[l + 4] = 1 === A ? 15360 : toHalf(A)),
      (c[l + 5] = 1 === S ? 15360 : toHalf(S)),
      (u[6 * t + 3] = a[8 * t + 5]),
      (u[6 * t + 4] = a[8 * t + 6]),
      (c[l + 10] = h[16 * t + 14]));
  }
  return new Uint8Array(l);
}
const VIS_ALL = 32767,
  VIS_PAIR = new Int8Array(36);
{
  let t = 0;
  for (let s = 0; s < 6; s++)
    for (let i = s + 1; i < 6; i++) VIS_PAIR[6 * s + i] = VIS_PAIR[6 * i + s] = t++;
}
const SLIME_RGB = {};
function slimeTint(t, s, i) {
  const e = self.TC_SLIME,
    n = t.split(":"),
    r = n[1];
  if (!e || !e.maps[r]) return [255, 255, 255];
  let h = SLIME_RGB[r];
  if (!h) {
    const t = e.maps[r],
      s = e.def[r] || "ffffff";
    h = SLIME_RGB[r] = {
      px: new Uint8Array(t.length / 2),
      def: [0, 2, 4].map((t) => parseInt(s.substr(t, 2), 16)),
      cache: new Map(),
    };
    for (let s = 0; s < h.px.length; s++) h.px[s] = parseInt(t.substr(2 * s, 2), 16);
  }
  if (null == s) return h.def;
  n[2] && ((s += 128), (i += 128));
  let o = Math.abs((256 - (Math.abs(s) % 512)) / 256),
    a = Math.abs((256 - (Math.abs(i) % 512)) / 256);
  if (o < a) {
    const t = o;
    ((o = a), (a = t));
  }
  const l = 64 * Math.min(63, Math.round(63 * o)) + Math.min(63, Math.round(63 * a));
  let c = h.cache.get(l);
  return (c || ((c = [h.px[3 * l], h.px[3 * l + 1], h.px[3 * l + 2]]), h.cache.set(l, c)), c);
}
const Mesher = {
    ids: new Uint16Array(5832),
    metas: new Uint8Array(5832),
    lights: new Uint8Array(5832),
    tints: new Uint8Array(1944),
    tints2: new Uint8Array(1944),
    opaqueBuf: new MeshBuffer(65536),
    transBuf: new MeshBuffer(16384),
    P: (t, s, i) => 18 * (18 * (s + 1) + (i + 1)) + (t + 1),
    gather(t, s, i, e) {
      setFaceShade(t.dim);
      const n = this.ids,
        r = this.metas,
        h = this.lights,
        o = this.tints,
        a = t.hasSky ? 240 : 0,
        l = 16 * i;
      let c = null;
      for (let i = -1; i <= 1; i++)
        for (let u = -1; u <= 1; u++) {
          const f = t.getChunk(s + u, e + i),
            A = u < 0 ? 15 : 0,
            S = u > 0 ? 0 : 15,
            d = i < 0 ? 15 : 0,
            E = i > 0 ? 0 : 15;
          if (f && f.wl && f.wl.size)
            for (const t of f.wl) {
              const s = (t >> 8) - l,
                e = (t >> 4) & 15,
                n = 15 & t;
              s < -1 ||
                s > 16 ||
                n < A ||
                n > S ||
                e < d ||
                e > E ||
                (c || ((c = this.wlsBuf || (this.wlsBuf = new Uint8Array(5832))), c.fill(0)),
                (c[18 * (18 * (s + 1) + (e + 16 * i + 1)) + 16 * u + 1 + n] = 1));
            }
          for (let t = d; t <= E; t++)
            for (let s = A; s <= S; s++) {
              const e = s + 16 * u,
                n = t + 16 * i,
                r = 6 * (18 * (n + 1) + (e + 1));
              if (f) {
                const i = 3 * (16 * t + s);
                ((o[r] = f.grass[i]),
                  (o[r + 1] = f.grass[i + 1]),
                  (o[r + 2] = f.grass[i + 2]),
                  (o[r + 3] = f.foliage[i]),
                  (o[r + 4] = f.foliage[i + 1]),
                  (o[r + 5] = f.foliage[i + 2]),
                  ((this.biomes || (this.biomes = new Uint8Array(324)))[18 * (n + 1) + (e + 1)] =
                    f.biome[16 * t + s]));
                const h = this.tints2,
                  a = f.water,
                  l = f.dry,
                  c = a ? null : BIOME_WATER[f.biome[16 * t + s]] || BIOME_WATER_DEFAULT;
                ((h[r] = a ? a[i] : c[0]),
                  (h[r + 1] = a ? a[i + 1] : c[1]),
                  (h[r + 2] = a ? a[i + 2] : c[2]),
                  (h[r + 3] = l ? l[i] : DRY_FOLIAGE_DEFAULT[0]),
                  (h[r + 4] = l ? l[i + 1] : DRY_FOLIAGE_DEFAULT[1]),
                  (h[r + 5] = l ? l[i + 2] : DRY_FOLIAGE_DEFAULT[2]));
              }
            }
          for (let s = -1; s <= 16; s++) {
            const e = l + s,
              o = e >> 4,
              c = (15 & e) << 8,
              _ = !f || e < 0 || e >= HEIGHT,
              B = _ ? null : f.bs[o],
              F = _ ? null : f.ms[o],
              O = _ ? null : f.ls[o],
              C = B && B.p,
              I = B && B.d,
              M = e < 0 && "end" !== t.dim ? 6 : 0,
              m = _ ? (e < 0 ? 0 : a) : f.lu[o];
            for (let t = d; t <= E; t++) {
              const e = 18 * (18 * (s + 1) + (t + 16 * i + 1)) + 16 * u + 1,
                o = c | (t << 4);
              for (let t = A; t <= S; t++) {
                const s = e + t,
                  i = o | t;
                ((n[s] = B ? C[I[i]] : M), (r[s] = F ? F[i] : 0), (h[s] = O ? O[i] : m));
              }
            }
          }
        }
      this.wls = c;
    },
    tintOf(t, s, i) {
      const e = this.tints,
        n = 6 * (18 * (i + 1) + (s + 1));
      if (t.tintRGB) return t.tintRGB;
      switch (t.tint) {
        case "grass":
          return [e[n], e[n + 1], e[n + 2]];
        case "foliage":
          return [e[n + 3], e[n + 4], e[n + 5]];
        case "birch":
          return [128, 167, 85];
        case "spruce":
          return [97, 153, 97];
        case "water": {
          const t = this.tints2;
          return [t[n], t[n + 1], t[n + 2]];
        }
        case "dry_foliage": {
          const t = this.tints2;
          return [t[n + 3], t[n + 4], t[n + 5]];
        }
      }
      return "string" == typeof t.tint && t.tint.startsWith("slime:")
        ? slimeTint(t.tint, null == this.tx0 ? null : this.tx0 + s, this.tz0 + i)
        : [255, 255, 255];
    },
    build(t, s, i, e) {
      return (this.gather(t, s, i, e), this.buildGathered(s, i, e));
    },
    snapshot(t) {
      return {
        dim: t,
        ids: this.ids.slice(),
        metas: this.metas.slice(),
        lights: this.lights.slice(),
        tints: this.tints.slice(),
        tints2: this.tints2.slice(),
        biomes: this.biomes ? this.biomes.slice() : new Uint8Array(324),
        wls: this.wls ? this.wls.slice() : null,
      };
    },
    load(t) {
      (setFaceShade(t.dim),
        this.ids.set(t.ids),
        this.metas.set(t.metas),
        this.lights.set(t.lights),
        this.tints.set(t.tints),
        t.tints2 && this.tints2.set(t.tints2),
        (this.wls = t.wls || null),
        (this.biomes || (this.biomes = new Uint8Array(324))).set(t.biomes));
    },
    buildGathered(t, s, i) {
      const e = this.opaqueBuf,
        n = this.transBuf,
        r = this.lateBuf || (this.lateBuf = new MeshBuffer(4096)),
        h = this.surfBuf || (this.surfBuf = new MeshBuffer(4096));
      (e.reset(), n.reset(), r.reset(), h.reset());
      const o = this.ids,
        a = this.wls,
        l = 16 * t,
        c = 16 * s,
        u = 16 * i;
      ((this.tx0 = l), (this.tz0 = u), (this.surf = h));
      try {
        for (let t = 0; t < 16; t++) {
          for (let s = 0; s < 16; s++)
            for (let i = 0; i < 16; i++) {
              const e = 18 * (18 * (t + 1) + (s + 1)) + (i + 1),
                h = o[e];
              if (h) {
                if (TRANS_LATE[h]) {
                  this.transBuf = r;
                  try {
                    this.block(h, i, t, s, l, c, u);
                  } finally {
                    this.transBuf = n;
                  }
                } else this.block(h, i, t, s, l, c, u);
                a && a[e] && this.liquid(BLOCKS[WATER], WATER, 0, i, t, s, l, c, u);
              }
            }
          if (r.n || h.n) {
            const s = c + t + 8 / 9 - 1e-4;
            (n.appendQuads(r, s, !1), n.append(h), n.appendQuads(r, s, !0), r.reset(), h.reset());
          }
        }
      } finally {
        this.surf = null;
      }
      return {
        opaque: e.n ? compactVerts(e, l, c, u) : null,
        trans: n.n ? compactVerts(n, l, c, u) : null,
        nOpaque: e.n,
        nTrans: n.n,
        vis: this.visibility(),
      };
    },
    visibility() {
      const t = this.ids,
        s = this.visSeen || (this.visSeen = new Uint8Array(4096)),
        i = this.visQ || (this.visQ = new Int16Array(4096));
      let e = 0;
      for (let i = 0; i < 16; i++)
        for (let n = 0; n < 16; n++) {
          const r = 18 * (18 * (i + 1) + (n + 1)) + 1,
            h = (i << 8) | (n << 4);
          for (let i = 0; i < 16; i++) {
            const n = SOLIDCUBE[t[r + i]];
            ((s[h | i] = n), n || e++);
          }
        }
      if (0 === e) return 0;
      if (4096 - e < 256) return 32767;
      let n = 0;
      for (let t = 0; t < 4096; t++) {
        if (s[t]) continue;
        let e = 0,
          r = 0,
          h = 0;
        for (i[r++] = t, s[t] = 1; e < r;) {
          const t = i[e++],
            n = 15 & t,
            o = (t >> 4) & 15,
            a = t >> 8;
          (0 === n ? (h |= 1) : s[t - 1] || ((s[t - 1] = 1), (i[r++] = t - 1)),
            15 === n ? (h |= 2) : s[t + 1] || ((s[t + 1] = 1), (i[r++] = t + 1)),
            0 === a ? (h |= 4) : s[t - 256] || ((s[t - 256] = 1), (i[r++] = t - 256)),
            15 === a ? (h |= 8) : s[t + 256] || ((s[t + 256] = 1), (i[r++] = t + 256)),
            0 === o ? (h |= 16) : s[t - 16] || ((s[t - 16] = 1), (i[r++] = t - 16)),
            15 === o ? (h |= 32) : s[t + 16] || ((s[t + 16] = 1), (i[r++] = t + 16)));
        }
        for (let t = 0; t < 6; t++)
          if (h & (1 << t))
            for (let s = t + 1; s < 6; s++) h & (1 << s) && (n |= 1 << VIS_PAIR[6 * t + s]);
        if (32767 === n) break;
      }
      return n;
    },
    single(t, s, i = !0) {
      (setFaceShade("overworld"),
        (this.tx0 = null),
        this.ids.fill(0),
        this.metas.fill(0),
        this.lights.fill(240));
      for (let t = 0; t < this.tints.length; t += 6)
        (this.tints.set([124, 189, 107, 89, 174, 48], t),
          this.tints2.set([...BIOME_WATER_DEFAULT, ...DRY_FOLIAGE_DEFAULT], t));
      const e = this.P(0, 0, 0);
      ((this.ids[e] = t), (this.metas[e] = s), BLOCKS[t].door && (this.ids[this.P(0, 1, 0)] = 0));
      const n = this.opaqueBuf,
        r = this.transBuf;
      (n.reset(), r.reset(), this.block(t, 0, 0, 0, 0, 0, 0, !0));
      const h = new MeshBuffer(n.n + r.n + 4);
      return (
        h.u8.set(n.u8.subarray(0, 32 * n.n), 0),
        h.u8.set(r.u8.subarray(0, 32 * r.n), 32 * n.n),
        (h.n = n.n + r.n),
        h
      );
    },
    block(t, s, i, e, n, r, h, o) {
      const a = BLOCKS[t];
      if (!a || (a.beRender && !o)) return;
      if ("invisible" === a.be && !o) return;
      const l = this.metas[this.P(s, i, e)];
      WLOG[t] && !o && this.liquid(BLOCKS[WATER], WATER, 0, s, i, e, n, r, h, !1);
      let c = VM_HAS[t];
      if (
        (c || ((c = VM.ready ? (VM.has(a.key) ? 2 : 1) : 0), (VM_HAS[t] = c)),
        2 !== c || !this.vmodel(a, l, s, i, e, n, r, h, o))
      )
        switch (a.shape) {
          case SH_CUBE:
            this.cube(a, t, l, s, i, e, n, r, h, o);
            break;
          case SH_CROSS:
            this.cross(a, l, s, i, e, n, r, h, o);
            break;
          case SH_CROP:
            this.crop(a, l, s, i, e, n, r, h);
            break;
          case SH_LIQUID:
            this.liquid(a, t, l, s, i, e, n, r, h, o);
            break;
          case SH_BOXES:
            this.boxes(a, t, l, s, i, e, n, r, h, o);
            break;
          case SH_TORCH:
            this.torch(a, l, s, i, e, n, r, h);
            break;
          case SH_CACTUS:
            this.cactus(a, l, s, i, e, n, r, h);
            break;
          case SH_MODEL:
            a.model && this.modelShape(a, l, s, i, e, n, r, h, o);
            break;
          case SH_FIRE:
            this.fire(a, l, s, i, e, n, r, h);
        }
    },
    texOf: (t, s, i) => (t.texFn ? t.texFn.call(t, s, i) : t.tex[s]),
    cube(t, s, i, e, n, r, h, o, a, l) {
      const c = this.ids,
        u = (this.lights, "translucent" === t.render ? this.transBuf : this.opaqueBuf);
      let f = t.tint ? this.tintOf(t, e, r) : null;
      const A = FAST_LEAVES && !l && LEAF_BLOCK[s];
      for (let S = 0; S < 6; S++) {
        const d = FACES[S],
          E = d.n,
          _ = c[this.P(e + E[0], n + E[1], r + E[2])];
        if (SOLIDCUBE[_]) continue;
        if (t.cullSame && _ === s) continue;
        if (A && LEAF_BLOCK[_]) continue;
        if (2 === S && "translucent" === t.render && IS_FLUID[_] && !c[this.P(e, n + 1, r)])
          continue;
        if (
          "translucent" === t.render &&
          "translucent" === BLOCKS[_].render &&
          0 === SOLIDCUBE[_] &&
          0 !== _ &&
          BLOCKS[_].shape === SH_CUBE &&
          35 !== s
        )
          continue;
        let B = this.texOf(t, S, i),
          F = A ? 32768 : t.overlay[S],
          O = 255,
          C = 255,
          I = 255;
        2 === s
          ? (1 & i && 2 !== S && 3 !== S
              ? (F = 0)
              : 3 === S && ((O = f[0]), (C = f[1]), (I = f[2])),
            F && ((O = f[0]), (C = f[1]), (I = f[2])))
          : f && ((O = f[0]), (C = f[1]), (I = f[2]));
        const M = t.axis && 3 & i ? this.axisRot(3 & i, S) : 0;
        this.quadAO(u, d, e, n, r, h, o, a, B, F, O, C, I, S, M, l);
      }
    },
    axisRot: (t, s) =>
      1 === t
        ? 0 === s || 1 === s
          ? 0
          : 1
        : 2 === t
          ? 4 === s || 5 === s || 2 === s || 3 === s
            ? 0
            : 1
          : 0,
    quadAO(t, s, i, e, n, r, h, o, a, l, c, u, f, A, S, d) {
      const E = this.ids,
        _ = this.lights,
        B = s.n,
        F = AO_V,
        O = AO_SK,
        C = AO_BK,
        I = this.P(i + B[0], e + B[1], n + B[2]),
        M = _[I],
        m = ANIM_FRAMES[a],
        p = d ? 0 : AOCUBE[E[I]];
      for (let t = 0; t < 4; t++) {
        const s = AO_D2[4 * A + t],
          i = I + AO_D1[4 * A + t],
          e = I + s,
          n = i + s,
          r = E[i],
          h = E[e],
          o = SOLIDCUBE[r],
          a = SOLIDCUBE[h],
          l = SOLIDCUBE[E[n]],
          c = AOCUBE[r],
          u = AOCUBE[h],
          f = c && u ? 1 : AOCUBE[E[n]];
        F[t] = d ? 1 : (4 - 0.8 * (p + c + u + f)) / 4;
        let S = M >> 4,
          B = 15 & M,
          m = 1;
        (o || ((S += _[i] >> 4), (B += 15 & _[i]), m++),
          a || ((S += _[e] >> 4), (B += 15 & _[e]), m++),
          l || (o && a) || ((S += _[n] >> 4), (B += 15 & _[n]), m++),
          (O[t] = S / m),
          (C[t] = B / m));
      }
      const w = FACE_SHADE[A],
        U = S ? FACE_UVR : FACE_UV,
        y = F[0] + F[2] + 0.003 * (O[0] + O[2]) < F[1] + F[3] + 0.003 * (O[1] + O[3]) ? 1 : 0;
      for (let S = 0; S < 4; S++) {
        const d = (S + y) & 3,
          E = s.c[d],
          _ = 2 * (4 * A + d);
        t.v(
          r + i + E[0],
          h + e + E[1],
          o + n + E[2],
          U[_],
          U[_ + 1],
          a,
          l,
          c,
          u,
          f,
          Math.round(w * F[d] * 255),
          Math.round(17 * O[d]),
          Math.round(17 * C[d]),
          m,
        );
      }
    },
    quadFlat(t, s, i, e, n, r, h, o, a, l = 0) {
      const c = Math.round(17 * (a >> 4)),
        u = Math.round(17 * (15 & a)),
        f = Math.round(255 * o);
      for (const o of s) t.v(o[0], o[1], o[2], o[3], o[4], i, e, n, r, h, f, c, u, l);
    },
    cross(t, s, i, e, n, r, h, o, a) {
      const l = this.opaqueBuf,
        c = this.lights[this.P(i, e, n)],
        u = this.texOf(t, 0, s),
        f = t.tint ? this.tintOf(t, i, n) : [255, 255, 255];
      let A = 0,
        S = 0;
      if (!a && ("short_grass" === t.key || "fern" === t.key || FLOWER_IDS.includes(t.id))) {
        ((A = 0.4 * (hash3(r + i, h + e, o + n, 99) - 0.5)),
          (S = 0.4 * (hash3(o + n, r + i, h + e, 7) - 0.5)));
      }
      const d = r + i + A,
        E = h + e,
        _ = o + n + S,
        B = 0.15,
        F = 0.85,
        O = [
          [
            [d + B, E, _ + B, 0, 1],
            [d + F, E, _ + F, 1, 1],
            [d + F, E + 1, _ + F, 1, 0],
            [d + B, E + 1, _ + B, 0, 0],
          ],
          [
            [d + F, E, _ + F, 0, 1],
            [d + B, E, _ + B, 1, 1],
            [d + B, E + 1, _ + B, 1, 0],
            [d + F, E + 1, _ + F, 0, 0],
          ],
          [
            [d + B, E, _ + F, 0, 1],
            [d + F, E, _ + B, 1, 1],
            [d + F, E + 1, _ + B, 1, 0],
            [d + B, E + 1, _ + F, 0, 0],
          ],
          [
            [d + F, E, _ + B, 0, 1],
            [d + B, E, _ + F, 1, 1],
            [d + B, E + 1, _ + F, 1, 0],
            [d + F, E + 1, _ + B, 0, 0],
          ],
        ];
      for (const t of O) this.quadFlat(l, t, u, 0, f[0], f[1], f[2], 0.9, c);
    },
    crop(t, s, i, e, n, r, h, o) {
      const a = this.opaqueBuf,
        l = this.lights[this.P(i, e, n)],
        c = this.texOf(t, 0, s),
        u = r + i,
        f = h + e - 1 / 16,
        A = o + n;
      for (const t of [0.25, 0.75])
        for (const s of [0, 1]) {
          const i = s ? 1 : 0,
            e = s ? 0 : 1;
          (this.quadFlat(
            a,
            [
              [u + t, f, A + i, 0, 1],
              [u + t, f, A + e, 1, 1],
              [u + t, f + 1, A + e, 1, 0],
              [u + t, f + 1, A + i, 0, 0],
            ],
            c,
            0,
            255,
            255,
            255,
            0.85,
            l,
          ),
            this.quadFlat(
              a,
              [
                [u + e, f, A + t, 0, 1],
                [u + i, f, A + t, 1, 1],
                [u + i, f + 1, A + t, 1, 0],
                [u + e, f + 1, A + t, 0, 0],
              ],
              c,
              0,
              255,
              255,
              255,
              0.85,
              l,
            ));
        }
    },
    fluidHeight(t, s, i, e) {
      const n = this.wls,
        r = this.P(s, i, e),
        same = (s) => this.ids[s] === t || (t === WATER && (WLOG[this.ids[s]] || (n && n[s])));
      if (!same(r)) return FLUID_WALL[this.ids[r]] ? -1 : 0;
      if (same(this.P(s, i + 1, e))) return 1;
      if (WLOG[this.ids[r]] || (n && n[r])) return 8 / 9;
      const h = this.metas[r];
      return 0 === h || 8 & h ? 8 / 9 : (8 - h) / 9;
    },
    cornerHeight(t, s, i, e, n, r) {
      const h = n ? 1 : -1,
        o = r ? 1 : -1,
        a = this.fluidHeight(t, s, i, e),
        l = this.fluidHeight(t, s, i, e + o),
        c = this.fluidHeight(t, s + h, i, e);
      if (l >= 1 || c >= 1) return 1;
      let u = 0,
        f = 0;
      const add = (t) => {
        t >= 0.8 ? ((u += 10 * t), (f += 10)) : t >= 0 && ((u += t), f++);
      };
      if (l > 0 || c > 0) {
        const n = this.fluidHeight(t, s + h, i, e + o);
        if (n >= 1) return 1;
        add(n);
      }
      return (add(a), add(c), add(l), f ? u / f : a);
    },
    liquid(t, s, i, e, n, r, h, o, a, l) {
      const c = "translucent" === t.render ? this.transBuf : this.opaqueBuf,
        u = this.ids,
        f = t.tex[0],
        A = ANIM_FRAMES[f],
        S = t.tint ? this.tintOf(t, e, r) : [255, 255, 255],
        d = this.wls,
        same = (t, i) => t === s || (s === WATER && (WLOG[t] || (void 0 !== i && d && d[i]))),
        E = this.P(e, n + 1, r),
        _ = u[E];
      let B, F, O, C;
      same(_, E) || l
        ? (B = F = O = C = l ? 0.889 : 1)
        : ((B = this.cornerHeight(s, e, n, r, 0, 0)),
          (F = this.cornerHeight(s, e, n, r, 1, 0)),
          (O = this.cornerHeight(s, e, n, r, 0, 1)),
          (C = this.cornerHeight(s, e, n, r, 1, 1)));
      const I = h + e,
        M = o + n,
        m = a + r,
        L = (t, s, i) => this.lights[this.P(e + t, n + s, r + i)],
        p = this.lights[this.P(e, n, r)],
        lmax = (t, s) => (Math.max(t >> 4, s >> 4) << 4) | Math.max(15 & t, 15 & s),
        w = 0.00390625,
        U = l ? -1 : this.flatBox(u[this.P(e, n, r)], this.metas[this.P(e, n, r)]),
        y =
          !l &&
          B >= 1 &&
          F >= 1 &&
          O >= 1 &&
          C >= 1 &&
          (SOLIDCUBE[_] || !(31 & this.flatBox(_, this.metas[E])));
      if (!same(_, E) && !y) {
        const s = lmax(L(0, 1, 0), p),
          i = !l && this.surf && "translucent" === t.render ? this.surf : c,
          e = 0.001;
        (this.quadFlat(
          i,
          [
            [I, M + B - e, m, 0, 0],
            [I, M + O - e, m + 1, 0, 1],
            [I + 1, M + C - e, m + 1, 1, 1],
            [I + 1, M + F - e, m, 1, 0],
          ],
          f,
          0,
          S[0],
          S[1],
          S[2],
          1,
          s,
          A,
        ),
          "translucent" === t.render &&
            this.quadFlat(
              i,
              [
                [I + 1, M + F - e, m, 1, 0],
                [I + 1, M + C - e, m + 1, 1, 1],
                [I, M + O - e, m + 1, 0, 1],
                [I, M + B - e, m, 0, 0],
              ],
              f,
              0,
              S[0],
              S[1],
              S[2],
              0.8,
              s,
              A,
            ));
      }
      const b = this.P(e, n - 1, r),
        D = u[b];
      if (
        !same(D, b) &&
        !SOLIDCUBE[D] &&
        this.flatBox(D, this.metas[b]) >> 5 != 16 &&
        (U < 0 || 31 & U)
      ) {
        const t = M + (l ? 0 : w);
        this.quadFlat(
          c,
          [
            [I, t, m, 0, 0],
            [I + 1, t, m, 1, 0],
            [I + 1, t, m + 1, 1, 1],
            [I, t, m + 1, 0, 1],
          ],
          f,
          0,
          S[0],
          S[1],
          S[2],
          0.5,
          lmax(L(0, -1, 0), p),
          A,
        );
      }
      const T = l ? 0 : w,
        R = [
          [0, -1, 0, I + T, m, I + T, m + 1, O, B],
          [1, 1, 0, I + 1 - T, m + 1, I + 1 - T, m, F, C],
          [4, 0, -1, I + 1, m + T, I, m + T, B, F],
          [5, 0, 1, I, m + 1 - T, I + 1, m + 1 - T, C, O],
        ];
      for (const [t, s, i, h, o, a, l, d, E] of R) {
        const _ = this.P(e + s, n, r + i),
          B = u[_];
        if (same(B, _) || SOLIDCUBE[B]) continue;
        let F = 0,
          O = 1;
        for (let t = 0; t < 2; t++) {
          const s = t ? U : this.flatBox(B, this.metas[_]);
          s < 0 ||
            (31 & s
              ? s >> 5 == 16 && (O = Math.min(O, (31 & s) / 16))
              : (F = Math.max(F, (s >> 5) / 16)));
        }
        const C = Math.min(E, d);
        if (F >= Math.max(E, d) || O <= F) continue;
        const I = Math.min(F, C),
          m = O <= C ? O : E,
          w = O <= C ? O : d,
          y = [
            [h, M + I, o, 0, 1 - I],
            [a, M + I, l, 1, 1 - I],
            [a, M + w, l, 1, 1 - w],
            [h, M + m, o, 0, 1 - m],
          ];
        this.quadFlat(c, y, f, 0, S[0], S[1], S[2], FACE_SHADE[t], lmax(L(s, 0, i), p), A);
      }
    },
    flatBox(t, s) {
      switch (FLAT_BOX[t]) {
        case 1:
          return 480;
        case 2:
          return 3 & s ? (1 == (3 & s) ? 520 : 512) : 256;
        case 3:
          return (2 * (1 + (7 & s))) << 5;
      }
      return -1;
    },
    boxes(t, s, i, e, n, r, h, o, a, l) {
      const c = "translucent" === t.render ? this.transBuf : this.opaqueBuf,
        u = this.ids,
        f = this.lights,
        A = f[this.P(e, n, r)],
        S = t.tint ? this.tintOf(t, e, r) : [255, 255, 255];
      let d;
      if (t.fence) {
        const con = (s) => SOLIDCUBE[s] || (BLOCKS[s] && BLOCKS[s].fence === t.fence);
        let s = 0;
        (con(u[this.P(e - 1, n, r)]) && (s |= 1),
          con(u[this.P(e + 1, n, r)]) && (s |= 2),
          con(u[this.P(e, n, r - 1)]) && (s |= 4),
          con(u[this.P(e, n, r + 1)]) && (s |= 8),
          (d = t.boxes(l ? 3 : s)));
      } else d = t.boxes(i);
      for (const E of d) {
        const d = E[0] / 16,
          _ = E[1] / 16,
          B = E[2] / 16,
          F = E[3] / 16,
          O = E[4] / 16,
          C = E[5] / 16;
        for (let I = 0; I < 6; I++) {
          const M = FACES[I].n,
            m =
              (0 === I && 0 === d) ||
              (1 === I && 1 === F) ||
              (2 === I && 0 === _) ||
              (3 === I && 1 === O) ||
              (4 === I && 0 === B) ||
              (5 === I && 1 === C);
          let p = A;
          if (m) {
            const i = u[this.P(e + M[0], n + M[1], r + M[2])];
            if (SOLIDCUBE[i] && !l) continue;
            if (i === s && t.cullSame) continue;
            ((p = f[this.P(e + M[0], n + M[1], r + M[2])]), SOLIDCUBE[i] && (p = A));
          }
          if (t.slab && 2 == (3 & i) && !m) continue;
          l && (p = 240);
          const w = void 0 !== E[6] ? E[6] : this.texOf(t, I, i),
            U = ANIM_FRAMES[w],
            y = FACES[I].c.map((t) => {
              const s = t[0] ? F : d,
                i = t[1] ? O : _,
                l = t[2] ? C : B,
                c = FACES[I].uv(s, i, l);
              return [h + e + s, o + n + i, a + r + l, c[0], c[1]];
            });
          this.quadFlat(c, y, w, 0, S[0], S[1], S[2], FACE_SHADE[I], p, U);
        }
      }
    },
    modelShape(t, s, i, e, n, r, h, o, a) {
      const l = this.opaqueBuf,
        c = this.ids,
        u = this.lights,
        f = u[this.P(i, e, n)],
        { els: A, rot: S } = t.model(s),
        d = { west: 0, east: 1, down: 2, up: 3, north: 4, south: 5 },
        E = [
          [0, 1, 2, 3, 4, 5],
          [4, 5, 2, 3, 1, 0],
          [1, 0, 2, 3, 5, 4],
          [5, 4, 2, 3, 0, 1],
        ][S],
        rp = (t, s) => {
          for (let i = 0; i < S; i++) {
            const i = t;
            ((t = 1 - s), (s = i));
          }
          return [t, s];
        };
      for (const t of A) {
        const s = t.from[0] / 16,
          A = t.from[1] / 16,
          S = t.from[2] / 16,
          _ = t.to[0] / 16,
          B = t.to[1] / 16,
          F = t.to[2] / 16;
        for (const O in t.faces) {
          const C = d[O],
            [I, M, m, p, w] = t.faces[O],
            U = E[C],
            y = FACES[U].n;
          let b = f;
          if (
            ((0 === C && 0 === s) ||
              (1 === C && 1 === _) ||
              (2 === C && 0 === A) ||
              (3 === C && 1 === B) ||
              (4 === C && 0 === S) ||
              (5 === C && 1 === F)) &&
            !a
          ) {
            const t = c[this.P(i + y[0], e + y[1], n + y[2])];
            if (SOLIDCUBE[t]) continue;
            b = u[this.P(i + y[0], e + y[1], n + y[2])];
          }
          a && (b = 240);
          const D = FACES[C].c.map((t) => {
            const a = t[0] ? _ : s,
              l = t[1] ? B : A,
              c = t[2] ? F : S,
              u = FACES[C].uv(t[0], t[1], t[2]),
              [f, d] = rp(a, c);
            return [
              r + i + f,
              h + e + l,
              o + n + d,
              (I + u[0] * (m - I)) / 16,
              (M + u[1] * (p - M)) / 16,
            ];
          });
          this.quadFlat(l, D, w, 0, 255, 255, 255, FACE_SHADE[U], b);
        }
      }
    },
    multi(t) {
      ((this.tx0 = null), this.ids.fill(0), this.metas.fill(0), this.lights.fill(240));
      for (const [s, i, e, n, r] of t) {
        const t = this.P(e, n, r);
        ((this.ids[t] = s), (this.metas[t] = i));
      }
      const s = this.opaqueBuf;
      (s.reset(), this.transBuf.reset());
      for (const [s, i, e, n, r] of t) this.block(s, e, n, r, 0, 0, 0, !0);
      const i = new MeshBuffer(s.n + 4);
      return (i.u8.set(s.u8.subarray(0, 32 * s.n), 0), (i.n = s.n), i);
    },
    fire(t, s, i, e, n, r, h, o) {
      const a = this.opaqueBuf,
        l = T("fire_0"),
        c = T("fire_1"),
        u = ANIM_FRAMES[l],
        f = ANIM_FRAMES[c],
        A = r + i,
        S = h + e,
        d = o + n,
        E = 1.4,
        _ = 0.3,
        B = 0.01,
        q = (t, s, i) => {
          (this.quadFlat(a, t, s, 0, 255, 255, 255, 1, 255, i),
            this.quadFlat(
              a,
              [t[1], t[0], t[3], t[2]].map((t) => [t[0], t[1], t[2], t[3], t[4]]),
              s,
              0,
              255,
              255,
              255,
              1,
              255,
              i,
            ));
        };
      (q(
        [
          [A + B, S, d, 0, 1],
          [A + B, S, d + 1, 1, 1],
          [A + B + _, S + E, d + 1, 1, 0],
          [A + B + _, S + E, d, 0, 0],
        ],
        l,
        u,
      ),
        q(
          [
            [A + 1 - B, S, d + 1, 0, 1],
            [A + 1 - B, S, d, 1, 1],
            [A + 1 - B - _, S + E, d, 1, 0],
            [A + 1 - B - _, S + E, d + 1, 0, 0],
          ],
          c,
          f,
        ),
        q(
          [
            [A + 1, S, d + B, 0, 1],
            [A, S, d + B, 1, 1],
            [A, S + E, d + B + _, 1, 0],
            [A + 1, S + E, d + B + _, 0, 0],
          ],
          c,
          f,
        ),
        q(
          [
            [A, S, d + 1 - B, 0, 1],
            [A + 1, S, d + 1 - B, 1, 1],
            [A + 1, S + E, d + 1 - B - _, 1, 0],
            [A, S + E, d + 1 - B - _, 0, 0],
          ],
          l,
          u,
        ),
        q(
          [
            [A, S, d + 0.5, 0, 1],
            [A + 1, S, d + 0.5, 1, 1],
            [A + 1, S + E, d + 0.5, 1, 0],
            [A, S + E, d + 0.5, 0, 0],
          ],
          l,
          u,
        ),
        q(
          [
            [A + 0.5, S, d + 1, 0, 1],
            [A + 0.5, S, d, 1, 1],
            [A + 0.5, S + E, d, 1, 0],
            [A + 0.5, S + E, d + 1, 0, 0],
          ],
          c,
          f,
        ));
    },
    cactus(t, s, i, e, n, r, h, o) {
      const a = this.opaqueBuf,
        l = this.lights[this.P(i, e, n)],
        c = r + i,
        u = h + e,
        f = o + n,
        A = 1 / 16;
      for (let s = 0; s < 6; s++) {
        const r = FACES[s],
          h = r.n;
        if ((2 === s || 3 === s) && SOLIDCUBE[this.ids[this.P(i + h[0], e + h[1], n + h[2])]])
          continue;
        if ((3 === s || 2 === s) && this.ids[this.P(i + h[0], e + h[1], n + h[2])] === t.id)
          continue;
        const o = r.c.map((t) => {
          let i = t[0],
            e = t[1],
            n = t[2];
          (0 === s && (i = A), 1 === s && (i = 1 - A), 4 === s && (n = A), 5 === s && (n = 1 - A));
          const h = r.uv(t[0], t[1], t[2]);
          return [c + i, u + e, f + n, h[0], h[1]];
        });
        this.quadFlat(a, o, t.tex[s], 0, 255, 255, 255, FACE_SHADE[s], l);
      }
    },
    torch(t, s, i, e, n, r, h, o) {
      const a = this.opaqueBuf,
        l = 254 | (240 & this.lights[this.P(i, e, n)]),
        c = t.tex[0],
        u = r + i + 0.5,
        f = o + n + 0.5;
      let A = 0,
        S = 0,
        d = 0,
        E = 0,
        _ = 0,
        B = 0;
      if (s) {
        const t = DIRS[s];
        ((A = 0.38 * t[0]), (S = 0.38 * t[2]), (d = 0.2), (E = 0.32), (_ = -t[0]), (B = -t[2]));
      }
      const F = h + e + d,
        O = 1 / 16,
        C = 0.625,
        P = (t, s, i) => [
          u + A + t + ((_ * E * s) / C) * 0.6,
          F + s,
          f + S + i + ((B * E * s) / C) * 0.6,
        ],
        I = 7 / 16,
        M = 9 / 16,
        m = 6 / 16,
        p = [
          [[-O, 0, -O], [-O, 0, O], [-O, C, O], [-O, C, -O], 0],
          [[O, 0, O], [O, 0, -O], [O, C, -O], [O, C, O], 1],
          [[O, 0, -O], [-O, 0, -O], [-O, C, -O], [O, C, -O], 4],
          [[-O, 0, O], [O, 0, O], [O, C, O], [-O, C, O], 5],
        ];
      for (const t of p) {
        const s = [
          [...P(...t[0]), I, 1],
          [...P(...t[1]), M, 1],
          [...P(...t[2]), M, m],
          [...P(...t[3]), I, m],
        ];
        this.quadFlat(a, s, c, 0, 255, 255, 255, FACE_SHADE[t[4]], l);
      }
      const w = [
        [...P(-O, C, -O), I, 0.5],
        [...P(-O, C, O), I, 6 / 16],
        [...P(O, C, O), M, 6 / 16],
        [...P(O, C, -O), M, 0.5],
      ];
      this.quadFlat(a, w, c, 0, 255, 255, 255, 1, l);
      const U = [
        [...P(-O, 0, -O), I, 1],
        [...P(O, 0, -O), M, 1],
        [...P(O, 0, O), M, 0.875],
        [...P(-O, 0, O), I, 0.875],
      ];
      this.quadFlat(a, U, c, 0, 255, 255, 255, 0.5, l);
    },
  },
  ItemMeshCache = new Map();
let _spriteAlpha = null,
  HI_SPRITES = null;
function itemSpriteMesh(t) {
  if (ItemMeshCache.has(t)) return ItemMeshCache.get(t);
  if (!HI_SPRITES) {
    HI_SPRITES = new Map();
    const t = ("undefined" != typeof ASSETS && ASSETS.hi) || {};
    for (const s in t) HI_SPRITES.set(ASSETS.tiles[s], t[s]);
  }
  const s = _spriteAlpha,
    i = HI_SPRITES.get(t),
    e = void 0 !== i ? 32 : 16,
    tileOf = (s, e) => (void 0 !== i ? i + ((e >> 4) << 1) + (s >> 4) : t),
    n = new MeshBuffer(32 === e ? 2048 : 512),
    r = 1 / 32,
    h = 1 / e,
    opaque = (t, i) =>
      t >= 0 && i >= 0 && t < e && i < e && s[256 * tileOf(t, i) + 16 * (15 & i) + (15 & t)] > 0,
    V = (s, i, e, r, h, o, a = t) =>
      n.v(s, i, e, r, h, a, 0, 255, 255, 255, Math.round(255 * o), 255, 0, 0),
    faces = (t, s, i, e) => {
      (V(t, s, r, 0, 1, 1, e),
        V(t + i, s, r, 1, 1, 1, e),
        V(t + i, s + i, r, 1, 0, 1, e),
        V(t, s + i, r, 0, 0, 1, e),
        V(t + i, s, -r, 1, 1, 0.8, e),
        V(t, s, -r, 0, 1, 0.8, e),
        V(t, s + i, -r, 0, 0, 0.8, e),
        V(t + i, s + i, -r, 1, 0, 0.8, e));
    };
  if (void 0 === i) faces(0, 0, 1, t);
  else for (let t = 0; t < 4; t++) faces(0.5 * (1 & t), t >> 1 ? 0 : 0.5, 0.5, i + t);
  for (let t = 0; t < e; t++)
    for (let s = 0; s < e; s++) {
      if (!opaque(s, t)) continue;
      const i = s * h,
        e = (s + 1) * h,
        n = 1 - t * h,
        o = 1 - (t + 1) * h,
        a = tileOf(s, t),
        l = (0.5 + (15 & s)) / 16,
        c = (0.5 + (15 & t)) / 16;
      (opaque(s - 1, t) ||
        (V(i, o, -r, l, c, 0.6, a),
        V(i, o, r, l, c, 0.6, a),
        V(i, n, r, l, c, 0.6, a),
        V(i, n, -r, l, c, 0.6, a)),
        opaque(s + 1, t) ||
          (V(e, o, r, l, c, 0.6, a),
          V(e, o, -r, l, c, 0.6, a),
          V(e, n, -r, l, c, 0.6, a),
          V(e, n, r, l, c, 0.6, a)),
        opaque(s, t - 1) ||
          (V(i, n, r, l, c, 1, a),
          V(e, n, r, l, c, 1, a),
          V(e, n, -r, l, c, 1, a),
          V(i, n, -r, l, c, 1, a)),
        opaque(s, t + 1) ||
          (V(i, o, -r, l, c, 0.5, a),
          V(e, o, -r, l, c, 0.5, a),
          V(e, o, r, l, c, 0.5, a),
          V(i, o, r, l, c, 0.5, a)));
    }
  return (ItemMeshCache.set(t, n), n);
}
//# sourceURL=js/mesher.js
