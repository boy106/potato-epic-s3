"use strict";
const WG = {};
(!(function () {
  let t = 0,
    e = 0;
  function add64(n, s, i, o) {
    const r = (s >>> 0) + (o >>> 0);
    ((e = 0 | r), (t = (n + i + (r > 4294967295 ? 1 : 0)) | 0));
  }
  function mul64(n, s, i, o) {
    const r = 65535 & n,
      a = s >>> 16,
      l = 65535 & s,
      h = 65535 & i,
      u = o >>> 16,
      f = 65535 & o;
    let m = 0,
      d = 0,
      p = 0,
      _ = 0;
    ((_ += l * f),
      (p += _ >>> 16),
      (_ &= 65535),
      (p += a * f),
      (d += p >>> 16),
      (p &= 65535),
      (p += l * u),
      (d += p >>> 16),
      (p &= 65535),
      (d += r * f),
      (m += d >>> 16),
      (d &= 65535),
      (d += a * u),
      (m += d >>> 16),
      (d &= 65535),
      (d += l * h),
      (m += d >>> 16),
      (d &= 65535),
      (m += (n >>> 16) * f + r * u + a * h + l * (i >>> 16)),
      (m &= 65535),
      (t = (m << 16) | d),
      (e = (p << 16) | _));
  }
  function rotl64(n, s, i) {
    if (32 === i) return ((t = s), void (e = n));
    if (i > 32) {
      const t = n;
      ((n = s), (s = t), (i -= 32));
    }
    ((t = (n << i) | (s >>> (32 - i))), (e = (s << i) | (n >>> (32 - i))));
  }
  function fromBig(t) {
    return ((t = BigInt.asUintN(64, t)), [0 | Number(t >> 32n), 0 | Number(0xffffffffn & t)]);
  }
  function bigFromBytesBE(t, e) {
    let n = 0n;
    for (let s = 0; s < 8; s++) n = (n << 8n) | BigInt(t[e + s]);
    return BigInt.asIntN(64, n);
  }
  function md5(t) {
    const e = new Int32Array(64),
      n = [
        7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5,
        9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10,
        15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
      ];
    for (let t = 0; t < 64; t++) e[t] = 0 | Math.floor(4294967296 * Math.abs(Math.sin(t + 1)));
    const s = t.length,
      i = 1 + ((s + 8) >> 6),
      o = new Int32Array(16 * i);
    for (let e = 0; e < s; e++) o[e >> 2] |= t[e] << ((e % 4) * 8);
    ((o[s >> 2] |= 128 << ((s % 4) * 8)),
      (o[16 * i - 2] = (8 * s) | 0),
      (o[16 * i - 1] = Math.floor(s / 536870912)));
    let r = 1732584193,
      a = -271733879,
      l = -1732584194,
      h = 271733878;
    for (let t = 0; t < i; t++) {
      let s = r,
        i = a,
        u = l,
        f = h;
      for (let r = 0; r < 64; r++) {
        let a, l;
        (r < 16
          ? ((a = (i & u) | (~i & f)), (l = r))
          : r < 32
            ? ((a = (f & i) | (~f & u)), (l = (5 * r + 1) % 16))
            : r < 48
              ? ((a = i ^ u ^ f), (l = (3 * r + 5) % 16))
              : ((a = u ^ (i | ~f)), (l = (7 * r) % 16)),
          (a = (a + s + e[r] + o[16 * t + l]) | 0),
          (s = f),
          (f = u),
          (u = i),
          (i = (i + ((a << n[r]) | (a >>> (32 - n[r])))) | 0));
      }
      ((r = (r + s) | 0), (a = (a + i) | 0), (l = (l + u) | 0), (h = (h + f) | 0));
    }
    const u = new Uint8Array(16);
    return (
      [r, a, l, h].forEach((t, e) => {
        for (let n = 0; n < 4; n++) u[4 * e + n] = (t >>> (8 * n)) & 255;
      }),
      u
    );
  }
  function utf8(t) {
    return new TextEncoder().encode(t);
  }
  class Xoroshiro {
    constructor(t, e, n, s) {
      (0 === (t | e | n | s) &&
        ((t = -1640531527), (e = 2135587861), (n = 1779033703), (s = -205731575)),
        (this.lh = t),
        (this.ll = e),
        (this.hh = n),
        (this.hl = s));
    }
    static fromSeed(t) {
      const mix = (t) => (
          (t = BigInt.asUintN(64, 0xbf58476d1ce4e5b9n * (t ^ (t >> 30n)))),
          (t = BigInt.asUintN(64, 0x94d049bb133111ebn * (t ^ (t >> 27n)))) ^ (t >> 31n)
        ),
        e = 0x6a09e667f3bcc909n ^ BigInt.asUintN(64, BigInt(t)),
        n = BigInt.asUintN(64, e + 0x9e3779b97f4a7c15n),
        s = fromBig(mix(e)),
        i = fromBig(mix(n));
      return new Xoroshiro(s[0], s[1], i[0], i[1]);
    }
    nextLong() {
      const n = this.lh,
        s = this.ll,
        i = this.hh,
        o = this.hl;
      (add64(n, s, i, o), rotl64(t, e, 17), add64(t, e, n, s));
      const r = t,
        a = e,
        l = i ^ n,
        h = o ^ s;
      (rotl64(n, s, 49),
        (this.lh = t ^ l ^ ((l << 21) | (h >>> 11))),
        (this.ll = e ^ h ^ (h << 21)),
        rotl64(l, h, 28),
        (this.hh = t),
        (this.hl = e),
        (t = r),
        (e = a));
    }
    nextInt() {
      return (this.nextLong(), e);
    }
    nextIntB(t) {
      let e = this.nextInt() >>> 0,
        n = Math.imul(e, t) >>> 0;
      if (n < t) {
        const s = (-t >>> 0) % t;
        for (; n < s;) ((e = this.nextInt() >>> 0), (n = Math.imul(e, t) >>> 0));
      }
      const s = (e >>> 16) * t,
        i = (65535 & e) * t;
      return (Math.floor(s / 65536) + Math.floor(((s % 65536) * 65536 + i) / 4294967296)) | 0;
    }
    nextIntBetween(t, e) {
      return this.nextIntB(e - t + 1) + t;
    }
    nextDouble() {
      return (this.nextLong(), 11102230246251565e-32 * (2097152 * (t >>> 0) + (e >>> 11)));
    }
    nextFloat() {
      return (this.nextLong(), 5.9604645e-8 * (t >>> 8));
    }
    nextBoolean() {
      return (this.nextLong(), !!(1 & e));
    }
    consume(t) {
      for (let e = 0; e < t; e++) this.nextLong();
    }
    fork() {
      this.nextLong();
      const n = t,
        s = e;
      return (this.nextLong(), new Xoroshiro(n, s, t, e));
    }
    forkPositional() {
      this.nextLong();
      const n = t,
        s = e;
      return (this.nextLong(), new XoroFactory(n, s, t, e));
    }
  }
  class XoroFactory {
    constructor(t, e, n, s) {
      ((this.lh = t), (this.ll = e), (this.hh = n), (this.hl = s));
    }
    at(n, s, i) {
      const o = Math.imul(n, 3129871);
      mul64(i >> 31, i, 0, 116129781);
      const r = (o >> 31) ^ t ^ (s >> 31),
        a = o ^ e ^ s;
      (mul64(r, a, r, a), mul64(t, e, 0, 42317861));
      const l = t,
        h = e;
      (mul64(r, a, 0, 11), add64(l, h, t, e));
      const u = (e >>> 16) | (t << 16);
      return new Xoroshiro((t >> 16) ^ this.lh, u ^ this.ll, this.hh, this.hl);
    }
    fromHashOf(t) {
      const e = md5(utf8(t)),
        n = fromBig(bigFromBytesBE(e, 0)),
        s = fromBig(bigFromBytesBE(e, 8));
      return new Xoroshiro(n[0] ^ this.lh, n[1] ^ this.ll, s[0] ^ this.hh, s[1] ^ this.hl);
    }
  }
  const n = [
      [1, 1, 0],
      [-1, 1, 0],
      [1, -1, 0],
      [-1, -1, 0],
      [1, 0, 1],
      [-1, 0, 1],
      [1, 0, -1],
      [-1, 0, -1],
      [0, 1, 1],
      [0, -1, 1],
      [0, 1, -1],
      [0, -1, -1],
      [1, 1, 0],
      [0, -1, 1],
      [-1, 1, 0],
      [0, -1, -1],
    ],
    s = new Float64Array(16),
    i = new Float64Array(16),
    o = new Float64Array(16);
  for (let t = 0; t < 16; t++) ((s[t] = n[t][0]), (i[t] = n[t][1]), (o[t] = n[t][2]));
  const r = Math.floor;
  function shuffled(t) {
    const e = new Uint8Array(256);
    for (let t = 0; t < 256; t++) e[t] = t;
    for (let n = 0; n < 256; n++) {
      const s = t.nextIntB(256 - n),
        i = e[n];
      ((e[n] = e[n + s]), (e[n + s] = i));
    }
    return e;
  }
  class ImprovedNoise {
    constructor(t) {
      ((this.xo = 256 * t.nextDouble()),
        (this.yo = 256 * t.nextDouble()),
        (this.zo = 256 * t.nextDouble()));
      const e = shuffled(t);
      this.p = new Uint8Array(512);
      for (let t = 0; t < 512; t++) this.p[t] = e[255 & t];
    }
    noise(t, e, n, s, i) {
      const o = t + this.xo,
        a = e + this.yo,
        l = n + this.zo,
        h = r(o),
        u = r(a),
        f = r(l),
        m = o - h,
        d = a - u,
        p = l - f;
      let _ = 0;
      if (0 !== s) {
        _ = r((i >= 0 && i < d ? i : d) / s + 1.0000000116860974e-7) * s;
      }
      return this.sampleAndLerp(h, u, f, m, d - _, p, d);
    }
    sampleAndLerp(t, e, n, r, a, l, h) {
      const u = this.p,
        f = u[255 & t],
        m = u[(t + 1) & 255],
        d = u[(f + e) & 255],
        p = u[(f + e + 1) & 255],
        _ = u[(m + e) & 255],
        g = u[(m + e + 1) & 255];
      let x;
      x = 15 & u[(d + n) & 255];
      const b = s[x] * r + i[x] * a + o[x] * l;
      x = 15 & u[(_ + n) & 255];
      const w = s[x] * (r - 1) + i[x] * a + o[x] * l;
      x = 15 & u[(p + n) & 255];
      const y = s[x] * r + i[x] * (a - 1) + o[x] * l;
      x = 15 & u[(g + n) & 255];
      const v = s[x] * (r - 1) + i[x] * (a - 1) + o[x] * l;
      x = 15 & u[(d + n + 1) & 255];
      const M = s[x] * r + i[x] * a + o[x] * (l - 1);
      x = 15 & u[(_ + n + 1) & 255];
      const I = s[x] * (r - 1) + i[x] * a + o[x] * (l - 1);
      x = 15 & u[(p + n + 1) & 255];
      const B = s[x] * r + i[x] * (a - 1) + o[x] * (l - 1);
      x = 15 & u[(g + n + 1) & 255];
      const N = r * r * r * (r * (6 * r - 15) + 10),
        A = h * h * h * (h * (6 * h - 15) + 10),
        F = b + N * (w - b),
        S = M + N * (I - M),
        z = F + A * (y + N * (v - y) - F);
      return (
        z +
        l *
          l *
          l *
          (l * (6 * l - 15) + 10) *
          (S + A * (B + N * (s[x] * (r - 1) + i[x] * (a - 1) + o[x] * (l - 1) - B) - S) - z)
      );
    }
  }
  const wrap = (t) => t - 33554432 * r(t / 33554432 + 0.5);
  class PerlinNoise {
    static create(t, e, n) {
      const s = new PerlinNoise(),
        i = n.length;
      ((s.levels = new Array(i).fill(null)), (s.amps = n));
      const o = t.forkPositional();
      for (let t = 0; t < i; t++)
        0 !== n[t] && (s.levels[t] = new ImprovedNoise(o.fromHashOf("octave_" + (e + t))));
      return (
        (s.inF = Math.pow(2, e)),
        (s.valF = Math.pow(2, i - 1) / (Math.pow(2, i) - 1)),
        (s.maxValue = s.edgeValue(2)),
        s
      );
    }
    static legacy(t, e) {
      const n = new PerlinNoise(),
        s = 1 - e,
        i = -e;
      ((n.amps = new Array(s).fill(1)), (n.levels = new Array(s).fill(null)));
      const o = new ImprovedNoise(t);
      n.levels[i] = o;
      for (let e = i - 1; e >= 0; e--) n.levels[e] = new ImprovedNoise(t);
      return ((n.inF = Math.pow(2, e)), (n.valF = Math.pow(2, s - 1) / (Math.pow(2, s) - 1)), n);
    }
    static legacyAmps(t, e, n) {
      const s = new PerlinNoise(),
        i = n.length,
        o = -e;
      ((s.amps = n), (s.levels = new Array(i).fill(null)));
      const r = new ImprovedNoise(t);
      o >= 0 && o < i && 0 !== n[o] && (s.levels[o] = r);
      for (let e = o - 1; e >= 0; e--)
        e < i && 0 !== n[e] ? (s.levels[e] = new ImprovedNoise(t)) : t.consume(262);
      return (
        (s.inF = Math.pow(2, e)),
        (s.valF = Math.pow(2, i - 1) / (Math.pow(2, i) - 1)),
        (s.maxValue = s.edgeValue(2)),
        s
      );
    }
    edgeValue(t) {
      let e = 0,
        n = this.valF;
      for (let s = 0; s < this.levels.length; s++)
        (this.levels[s] && (e += this.amps[s] * t * n), (n /= 2));
      return e;
    }
    octave(t) {
      return this.levels[this.levels.length - 1 - t];
    }
    get(t, e, n) {
      let s = 0,
        i = this.inF,
        o = this.valF;
      const r = this.levels,
        a = this.amps;
      for (let l = 0; l < r.length; l++) {
        const h = r[l];
        (h && (s += a[l] * h.noise(wrap(t * i), wrap(e * i), wrap(n * i), 0, 0) * o),
          (i *= 2),
          (o /= 2));
      }
      return s;
    }
  }
  class SimplexNoise {
    constructor(t) {
      ((this.xo = 256 * t.nextDouble()),
        (this.yo = 256 * t.nextDouble()),
        (this.zo = 256 * t.nextDouble()));
      const e = shuffled(t);
      this.p = new Uint8Array(512);
      for (let t = 0; t < 512; t++) this.p[t] = e[255 & t];
    }
    corner(t, e, n, r, a) {
      let l = a - e * e - n * n - r * r;
      return l < 0 ? 0 : ((l *= l), l * l * (s[t] * e + i[t] * n + o[t] * r));
    }
    get2(t, e) {
      const n = 0.5 * (Math.sqrt(3) - 1),
        s = (3 - Math.sqrt(3)) / 6,
        i = (t + e) * n,
        o = r(t + i),
        a = r(e + i),
        l = (o + a) * s,
        h = t - (o - l),
        u = e - (a - l);
      let f, m;
      h > u ? ((f = 1), (m = 0)) : ((f = 0), (m = 1));
      const d = h - f + s,
        p = u - m + s,
        _ = h - 1 + 2 * s,
        g = u - 1 + 2 * s,
        x = 255 & o,
        b = 255 & a,
        w = this.p,
        y = w[x + w[b]] % 12,
        v = w[x + f + w[b + m]] % 12,
        M = w[x + 1 + w[b + 1]] % 12;
      return (
        70 *
        (this.corner(y, h, u, 0, 0.5) + this.corner(v, d, p, 0, 0.5) + this.corner(M, _, g, 0, 0.5))
      );
    }
  }
  Object.assign(WG, {
    Xoroshiro: Xoroshiro,
    XoroFactory: XoroFactory,
    JavaRandom: class JavaRandom {
      constructor(t) {
        this.setSeed(t);
      }
      setSeed(t) {
        this.s = (0x5deece66dn ^ BigInt.asUintN(64, BigInt(t))) & ((1n << 48n) - 1n);
      }
      next(t) {
        return (
          (this.s = (0x5deece66dn * this.s + 0xbn) & ((1n << 48n) - 1n)),
          Number(BigInt.asIntN(32, this.s >> BigInt(48 - t)))
        );
      }
      nextInt() {
        return this.next(32);
      }
      nextIntB(t) {
        if ((t & -t) === t) return Number((BigInt(t) * BigInt(this.next(31))) >> 31n);
        let e, n;
        do {
          ((e = this.next(31)), (n = e % t));
        } while (e - n + (t - 1) < 0 || e - n + (t - 1) > 2147483647);
        return n;
      }
      nextLong() {
        return (BigInt(this.next(32)) << 32n) + BigInt(this.next(32));
      }
      nextDouble() {
        return 11102230246251565e-32 * (134217728 * this.next(26) + this.next(27));
      }
      nextFloat() {
        return this.next(24) / 16777216;
      }
      nextBoolean() {
        return 0 !== this.next(1);
      }
      consume(t) {
        for (let e = 0; e < t; e++) this.next(32);
      }
    },
    ImprovedNoise: ImprovedNoise,
    PerlinNoise: PerlinNoise,
    NormalNoise: class NormalNoise {
      constructor(t, e, n) {
        const s = e.amplitudes,
          i = e.firstOctave;
        ((this.a = n ? PerlinNoise.legacyAmps(t, i, s) : PerlinNoise.create(t, i, s)),
          (this.b = n ? PerlinNoise.legacyAmps(t, i, s) : PerlinNoise.create(t, i, s)));
        let o = 1e9,
          r = -1e9;
        (s.forEach((t, e) => {
          0 !== t && ((o = Math.min(o, e)), (r = Math.max(r, e)));
        }),
          (this.valueFactor = 0.16666666666666666 / (0.1 * (1 + 1 / (r - o + 1)))),
          (this.maxValue = (this.a.maxValue + this.b.maxValue) * this.valueFactor));
      }
      get(t, e, n) {
        const s = 1.0181268882175227;
        return (this.a.get(t, e, n) + this.b.get(t * s, e * s, n * s)) * this.valueFactor;
      }
    },
    BlendedNoise: class BlendedNoise {
      constructor(t, e) {
        ((this.minL = PerlinNoise.legacy(t, -15)),
          (this.maxL = PerlinNoise.legacy(t, -15)),
          (this.main = PerlinNoise.legacy(t, -7)),
          (this.xzMul = 684.412 * e.xz_scale),
          (this.yMul = 684.412 * e.y_scale),
          (this.xzF = e.xz_factor),
          (this.yF = e.y_factor),
          (this.smear = e.smear_scale_multiplier));
      }
      compute(t, e, n) {
        const s = t * this.xzMul,
          i = e * this.yMul,
          o = n * this.xzMul,
          r = s / this.xzF,
          a = i / this.yF,
          l = o / this.xzF,
          h = this.yMul * this.smear,
          u = h / this.yF;
        let f = 0,
          m = 0,
          d = 0,
          p = 1;
        for (let t = 0; t < 8; t++) {
          const e = this.main.octave(t);
          (e && (d += e.noise(wrap(r * p), wrap(a * p), wrap(l * p), u * p, a * p) / p), (p /= 2));
        }
        const _ = (d / 10 + 1) / 2,
          g = _ >= 1,
          x = _ <= 0;
        p = 1;
        for (let t = 0; t < 16; t++) {
          const e = wrap(s * p),
            n = wrap(i * p),
            r = wrap(o * p),
            a = h * p;
          if (!g) {
            const s = this.minL.octave(t);
            s && (f += s.noise(e, n, r, a, i * p) / p);
          }
          if (!x) {
            const s = this.maxL.octave(t);
            s && (m += s.noise(e, n, r, a, i * p) / p);
          }
          p /= 2;
        }
        const b = f / 512,
          w = m / 512;
        return (_ < 0 ? b : _ > 1 ? w : b + _ * (w - b)) / 128;
      }
    },
    SimplexNoise: SimplexNoise,
    PerlinSimplexNoise: class PerlinSimplexNoise {
      constructor(t) {
        this.n = new SimplexNoise(t);
      }
      get(t, e) {
        return this.n.get2(t, e);
      }
    },
    md5: md5,
    sha256: function sha256(t) {
      const e = [
          1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748,
          2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206,
          2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983,
          1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671,
          3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372,
          1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411,
          3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734,
          506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779,
          1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479,
          3329325298,
        ],
        n = [
          1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635,
          1541459225,
        ],
        s = t.length,
        i = 1 + ((s + 8) >> 6),
        o = new Int32Array(16 * i);
      for (let e = 0; e < s; e++) o[e >> 2] |= t[e] << (24 - (e % 4) * 8);
      ((o[s >> 2] |= 128 << (24 - (s % 4) * 8)), (o[16 * i - 1] = 8 * s));
      const r = new Int32Array(64),
        ror = (t, e) => (t >>> e) | (t << (32 - e));
      for (let t = 0; t < i; t++) {
        for (let e = 0; e < 16; e++) r[e] = o[16 * t + e];
        for (let t = 16; t < 64; t++) {
          const e = ror(r[t - 15], 7) ^ ror(r[t - 15], 18) ^ (r[t - 15] >>> 3),
            n = ror(r[t - 2], 17) ^ ror(r[t - 2], 19) ^ (r[t - 2] >>> 10);
          r[t] = (r[t - 16] + e + r[t - 7] + n) | 0;
        }
        let [s, i, a, l, h, u, f, m] = n;
        for (let t = 0; t < 64; t++) {
          const n =
              (m + (ror(h, 6) ^ ror(h, 11) ^ ror(h, 25)) + ((h & u) ^ (~h & f)) + e[t] + r[t]) | 0,
            o = ((ror(s, 2) ^ ror(s, 13) ^ ror(s, 22)) + ((s & i) ^ (s & a) ^ (i & a))) | 0;
          ((m = f),
            (f = u),
            (u = h),
            (h = (l + n) | 0),
            (l = a),
            (a = i),
            (i = s),
            (s = (n + o) | 0));
        }
        ((n[0] = (n[0] + s) | 0),
          (n[1] = (n[1] + i) | 0),
          (n[2] = (n[2] + a) | 0),
          (n[3] = (n[3] + l) | 0),
          (n[4] = (n[4] + h) | 0),
          (n[5] = (n[5] + u) | 0),
          (n[6] = (n[6] + f) | 0),
          (n[7] = (n[7] + m) | 0));
      }
      const a = new Uint8Array(32);
      return (
        n.forEach((t, e) => {
          for (let n = 0; n < 4; n++) a[4 * e + n] = (t >>> (24 - 8 * n)) & 255;
        }),
        a
      );
    },
    utf8: utf8,
    toBig: function toBig(t, e) {
      return BigInt.asIntN(64, (BigInt(t >>> 0) << 32n) | BigInt(e >>> 0));
    },
    fromBig: fromBig,
    mul64: mul64,
    add64: add64,
    getR: () => [t, e],
  });
})(),
  (function () {
    const t = Math.fround,
      clampedMap = (t, e, n, s, i) => {
        const o = (t - e) / (n - e);
        return o < 0 ? s : o > 1 ? i : s + o * (i - s);
      };
    class GenState {
      constructor(t, e) {
        ((this.x0 = 0), (this.z0 = 0), (this.active = !1), (this.minY = t), (this.cellsY = e / 8));
      }
    }
    const e = -32512,
      n = [
        [0, 0],
        [-2, -1],
        [-1, -1],
        [0, -1],
        [1, -1],
        [-3, 0],
        [-2, 0],
        [-1, 0],
        [1, 0],
        [-2, 1],
        [-1, 1],
        [0, 1],
        [1, 1],
      ];
    Object.assign(WG, {
      RandomState: class RandomState {
        constructor(t, e, n) {
          ((this.data = e),
            (this.settings = e.noise_settings[n]),
            (this.seed = BigInt(t)),
            (this.legacy = !!this.settings.legacy_random_source),
            (this.random = this.legacy
              ? new WG.JRand(this.seed).forkPositional()
              : WG.Xoroshiro.fromSeed(this.seed).forkPositional()),
            (this.noises = new Map()),
            (this.S = new GenState(this.settings.noise.min_y, this.settings.noise.height)),
            (this.memo = new Map()),
            (this.refs = new Map()),
            (this.flatNodes = []),
            (this.interpNodes = []));
          const s = this.settings.noise_router;
          this.router = {};
          for (const t of Object.keys(s)) this.router[t] = this.compile(s[t]);
          (this.legacy ||
            ((this.aquiferRandom = this.random.fromHashOf("minecraft:aquifer").forkPositional()),
            (this.oreRandom = this.random.fromHashOf("minecraft:ore").forkPositional())),
            (this.factories = new Map()));
        }
        noise(t) {
          t.includes(":") || (t = "minecraft:" + t);
          let e = this.noises.get(t);
          if (!e) {
            const n = this.data.noise[t.slice(10)];
            if (!n) throw new Error("missing noise " + t);
            ((e =
              !this.legacy ||
              ("minecraft:nether/temperature" !== t && "minecraft:nether/vegetation" !== t)
                ? new WG.NormalNoise(this.random.fromHashOf(t), n)
                : new WG.NormalNoise(
                    new WG.JRand(this.seed + (t.endsWith("vegetation") ? 1n : 0n)),
                    n,
                    !0,
                  )),
              this.noises.set(t, e));
          }
          return e;
        }
        factory(t) {
          let e = this.factories.get(t);
          return (
            e || ((e = this.random.fromHashOf(t).forkPositional()), this.factories.set(t, e)),
            e
          );
        }
        beginChunk(t, e) {
          const n = this.S;
          ((n.active = !1), (n.x0 = 16 * t), (n.z0 = 16 * e));
          for (const t of this.flatNodes) t.fill();
          ((n.active = !0), (n.interpReady = !1));
          for (const t of this.interpNodes) t.fill();
          n.interpReady = !0;
        }
        endChunk() {
          ((this.S.active = !1), (this.S.interpReady = !1));
        }
        compile(t) {
          if ("number" == typeof t) {
            const e = t;
            return { f: () => e, lo: e, hi: e, k: e };
          }
          if ("string" == typeof t) {
            let e = this.refs.get(t);
            if (!e) {
              const n = this.data.density_function[t.replace("minecraft:", "")];
              if (void 0 === n) throw new Error("missing density function " + t);
              ((e = this.compile(n)), this.refs.set(t, e));
            }
            return e;
          }
          const e = JSON.stringify(t);
          let n = this.memo.get(e);
          return (n || ((n = this.build(t)), this.memo.set(e, n)), n);
        }
        build(t) {
          const e = t.type.replace("minecraft:", ""),
            C = (t) => this.compile(t),
            n = this.S;
          switch (e) {
            case "add":
            case "mul":
            case "min":
            case "max": {
              const n = C(t.argument1),
                s = C(t.argument2),
                i = n.f,
                o = s.f;
              if ("add" === e) {
                if (void 0 !== n.k) {
                  const t = n.k;
                  return { f: (e, n, s) => o(e, n, s) + t, lo: n.lo + s.lo, hi: n.hi + s.hi };
                }
                if (void 0 !== s.k) {
                  const t = s.k;
                  return { f: (e, n, s) => i(e, n, s) + t, lo: n.lo + s.lo, hi: n.hi + s.hi };
                }
                return {
                  f: (t, e, n) => i(t, e, n) + o(t, e, n),
                  lo: n.lo + s.lo,
                  hi: n.hi + s.hi,
                };
              }
              if ("mul" === e) {
                const t = [n.lo * s.lo, n.lo * s.hi, n.hi * s.lo, n.hi * s.hi].map((t) =>
                    Number.isNaN(t) ? 0 : t,
                  ),
                  e = Math.min(...t),
                  r = Math.max(...t);
                if (void 0 !== n.k) {
                  const t = n.k;
                  return { f: (e, n, s) => o(e, n, s) * t, lo: e, hi: r };
                }
                if (void 0 !== s.k) {
                  const t = s.k;
                  return { f: (e, n, s) => i(e, n, s) * t, lo: e, hi: r };
                }
                return {
                  f: (t, e, n) => {
                    const s = i(t, e, n);
                    return 0 === s ? 0 : s * o(t, e, n);
                  },
                  lo: e,
                  hi: r,
                };
              }
              if ("min" === e) {
                const t = s.lo;
                return {
                  f: (e, n, s) => {
                    const r = i(e, n, s);
                    if (r < t) return r;
                    const a = o(e, n, s);
                    return r < a ? r : a;
                  },
                  lo: Math.min(n.lo, s.lo),
                  hi: Math.min(n.hi, s.hi),
                };
              }
              const r = s.hi;
              return {
                f: (t, e, n) => {
                  const s = i(t, e, n);
                  if (s > r) return s;
                  const a = o(t, e, n);
                  return s > a ? s : a;
                },
                lo: Math.max(n.lo, s.lo),
                hi: Math.max(n.hi, s.hi),
              };
            }
            case "abs": {
              const e = C(t.argument),
                n = e.f;
              return {
                f: (t, e, s) => Math.abs(n(t, e, s)),
                lo: Math.max(0, e.lo, -e.hi),
                hi: Math.max(Math.abs(e.lo), Math.abs(e.hi)),
              };
            }
            case "square": {
              const e = C(t.argument),
                n = e.f;
              return {
                f: (t, e, s) => {
                  const i = n(t, e, s);
                  return i * i;
                },
                lo: 0,
                hi: Math.max(e.lo * e.lo, e.hi * e.hi),
              };
            }
            case "cube": {
              const e = C(t.argument),
                n = e.f;
              return {
                f: (t, e, s) => {
                  const i = n(t, e, s);
                  return i * i * i;
                },
                lo: e.lo ** 3,
                hi: e.hi ** 3,
              };
            }
            case "half_negative": {
              const e = C(t.argument),
                n = e.f;
              return {
                f: (t, e, s) => {
                  const i = n(t, e, s);
                  return i > 0 ? i : 0.5 * i;
                },
                lo: e.lo > 0 ? e.lo : 0.5 * e.lo,
                hi: e.hi > 0 ? e.hi : 0.5 * e.hi,
              };
            }
            case "quarter_negative": {
              const e = C(t.argument),
                n = e.f;
              return {
                f: (t, e, s) => {
                  const i = n(t, e, s);
                  return i > 0 ? i : 0.25 * i;
                },
                lo: e.lo > 0 ? e.lo : 0.25 * e.lo,
                hi: e.hi > 0 ? e.hi : 0.25 * e.hi,
              };
            }
            case "squeeze": {
              const e = C(t.argument),
                n = e.f,
                sq = (t) => {
                  const e = t < -1 ? -1 : t > 1 ? 1 : t;
                  return e / 2 - (e * e * e) / 24;
                };
              return { f: (t, e, s) => sq(n(t, e, s)), lo: sq(e.lo), hi: sq(e.hi) };
            }
            case "invert": {
              const e = C(t.argument).f;
              return { f: (t, n, s) => 1 / e(t, n, s), lo: -1 / 0, hi: 1 / 0 };
            }
            case "clamp": {
              const e = C(t.input).f,
                n = t.min,
                s = t.max;
              return {
                f: (t, i, o) => {
                  const r = e(t, i, o);
                  return r < n ? n : r > s ? s : r;
                },
                lo: n,
                hi: s,
              };
            }
            case "y_clamped_gradient": {
              const e = t.from_y,
                n = t.to_y,
                s = t.from_value,
                i = t.to_value;
              return {
                f: (t, o, r) => clampedMap(o, e, n, s, i),
                lo: Math.min(s, i),
                hi: Math.max(s, i),
              };
            }
            case "range_choice": {
              const e = C(t.input).f,
                n = C(t.when_in_range),
                s = C(t.when_out_of_range),
                i = t.min_inclusive,
                o = t.max_exclusive,
                r = n.f,
                a = s.f;
              return {
                f: (t, n, s) => {
                  const l = e(t, n, s);
                  return l >= i && l < o ? r(t, n, s) : a(t, n, s);
                },
                lo: Math.min(n.lo, s.lo),
                hi: Math.max(n.hi, s.hi),
              };
            }
            case "interval_select": {
              const e = C(t.input).f,
                n = t.functions.map(C),
                s = t.thresholds,
                i = n.map((t) => t.f),
                o = s.length;
              return {
                f: (t, n, r) => {
                  const a = e(t, n, r);
                  let l = 0;
                  for (; l < o && a >= s[l];) l++;
                  return i[l](t, n, r);
                },
                lo: Math.min(...n.map((t) => t.lo)),
                hi: Math.max(...n.map((t) => t.hi)),
              };
            }
            case "noise": {
              const e = this.noise(t.noise),
                n = t.xz_scale,
                s = t.y_scale;
              return {
                f: (t, i, o) => e.get(t * n, i * s, o * n),
                lo: -e.maxValue,
                hi: e.maxValue,
              };
            }
            case "shifted_noise": {
              const e = this.noise(t.noise),
                n = t.xz_scale,
                s = t.y_scale,
                i = C(t.shift_x).f,
                o = C(t.shift_y).f,
                r = C(t.shift_z).f;
              return {
                f: (t, a, l) => e.get(t * n + i(t, a, l), a * s + o(t, a, l), l * n + r(t, a, l)),
                lo: -e.maxValue,
                hi: e.maxValue,
              };
            }
            case "shift_a": {
              const e = this.noise(t.argument);
              return {
                f: (t, n, s) => 4 * e.get(0.25 * t, 0, 0.25 * s),
                lo: 4 * -e.maxValue,
                hi: 4 * e.maxValue,
              };
            }
            case "shift_b": {
              const e = this.noise(t.argument);
              return {
                f: (t, n, s) => 4 * e.get(0.25 * s, 0.25 * t, 0),
                lo: 4 * -e.maxValue,
                hi: 4 * e.maxValue,
              };
            }
            case "shift": {
              const e = this.noise(t.argument);
              return {
                f: (t, n, s) => 4 * e.get(0.25 * t, 0.25 * n, 0.25 * s),
                lo: 4 * -e.maxValue,
                hi: 4 * e.maxValue,
              };
            }
            case "old_blended_noise": {
              const e = new WG.BlendedNoise(
                this.legacy ? new WG.JRand(this.seed) : this.random.fromHashOf("minecraft:terrain"),
                t,
              );
              return { f: (t, n, s) => e.compute(t, n, s), lo: -200, hi: 200 };
            }
            case "blend_alpha":
              return { f: () => 1, lo: 1, hi: 1, k: 1 };
            case "blend_offset":
            case "beardifier":
              return { f: () => 0, lo: 0, hi: 0, k: 0 };
            case "blend_density":
              return C(t.argument);
            case "cache_once": {
              const e = C(t.argument),
                n = e.f;
              let s = NaN,
                i = NaN,
                o = NaN,
                r = 0;
              return {
                f: (t, e, a) =>
                  t === s && e === i && a === o ? r : ((s = t), (i = e), (o = a), (r = n(t, e, a))),
                lo: e.lo,
                hi: e.hi,
              };
            }
            case "cache_2d": {
              const e = C(t.argument),
                n = e.f;
              let s = NaN,
                i = NaN,
                o = 0;
              return {
                f: (t, e, r) => (t === s && r === i ? o : ((s = t), (i = r), (o = n(t, e, r)))),
                lo: e.lo,
                hi: e.hi,
              };
            }
            case "flat_cache": {
              const e = C(t.argument),
                s = e.f,
                i = new Float64Array(25),
                o = {
                  lo: e.lo,
                  hi: e.hi,
                  fill: () => {
                    for (let t = 0; t < 5; t++)
                      for (let e = 0; e < 5; e++) i[5 * t + e] = s(n.x0 + 4 * t, 0, n.z0 + 4 * e);
                  },
                  f: (t, e, o) => {
                    if (n.active) {
                      const e = (t >> 2) - (n.x0 >> 2),
                        s = (o >> 2) - (n.z0 >> 2);
                      if (e >= 0 && s >= 0 && e < 5 && s < 5) return i[5 * e + s];
                    }
                    return s(t, e, o);
                  },
                };
              return (this.flatNodes.push(o), o);
            }
            case "interpolated": {
              const e = C(t.argument),
                s = e.f,
                i = n.cellsY + 1,
                o = new Float64Array(25 * i),
                r = {
                  lo: e.lo,
                  hi: e.hi,
                  fill: () => {
                    let t = 0;
                    for (let e = 0; e < 5; e++)
                      for (let r = 0; r < 5; r++)
                        for (let a = 0; a < i; a++)
                          o[t++] = s(n.x0 + 4 * e, n.minY + 8 * a, n.z0 + 4 * r);
                  },
                };
              let a = -1;
              const l = new Float64Array(4 * i),
                colF = (t, e, o) => {
                  a !== n.colStamp && ((a = n.colStamp), l.fill(NaN));
                  const r = t - n.colX0,
                    h = o - n.colZ0,
                    u = e - n.minY,
                    f = u >> 3;
                  if (r < 0 || h < 0 || r > 3 || h > 3 || f < 0 || f >= n.cellsY) return s(t, e, o);
                  const c = (t, e, o) => {
                      const r = (2 * t + e) * i + o;
                      let a = l[r];
                      return (
                        a != a && (a = l[r] = s(n.colX0 + 4 * t, n.minY + 8 * o, n.colZ0 + 4 * e)),
                        a
                      );
                    },
                    m = (7 & u) / 8,
                    d = r / 4,
                    p = h / 4,
                    _ = c(0, 0, f),
                    g = c(0, 0, f + 1),
                    x = c(1, 0, f),
                    b = c(1, 0, f + 1),
                    w = c(0, 1, f),
                    y = c(0, 1, f + 1),
                    v = c(1, 1, f),
                    M = _ + m * (g - _),
                    I = w + m * (y - w),
                    B = M + d * (x + m * (b - x) - M);
                  return B + p * (I + d * (v + m * (c(1, 1, f + 1) - v) - I) - B);
                };
              return (
                (r.f = (t, e, r) => {
                  if (!n.interpReady) return n.colMode ? colF(t, e, r) : s(t, e, r);
                  const a = t - n.x0,
                    l = r - n.z0,
                    h = e - n.minY,
                    u = a >> 2,
                    f = l >> 2,
                    m = h >> 3;
                  if (u < 0 || f < 0 || u > 3 || f > 3 || m < 0 || m >= n.cellsY) return s(t, e, r);
                  const d = (5 * u + f) * i + m,
                    p = 5 * i,
                    _ = i,
                    g = o[d],
                    x = o[d + 1],
                    b = o[d + p],
                    w = o[d + p + 1],
                    y = o[d + _],
                    v = o[d + _ + 1],
                    M = o[d + p + _],
                    I = (7 & h) / 8,
                    B = (3 & a) / 4,
                    N = g + I * (x - g),
                    A = y + I * (v - y),
                    F = N + B * (b + I * (w - b) - N);
                  return F + ((3 & l) / 4) * (A + B * (M + I * (o[d + p + _ + 1] - M) - A) - F);
                }),
                this.interpNodes.push(r),
                r
              );
            }
            case "find_top_surface": {
              const e = C(t.density).f,
                n = C(t.upper_bound).f,
                s = t.lower_bound,
                i = t.cell_height;
              return {
                f: (t, o, r) => {
                  for (let a = Math.floor(n(t, o, r) / i) * i; a >= s; a -= i)
                    if (e(t, a, r) > 0) return a;
                  return s;
                },
                lo: s,
                hi: 320,
              };
            }
            case "spline": {
              const e = this.spline(t.spline);
              return { f: (t, n, s) => e(t, n, s), lo: -10, hi: 10 };
            }
            case "end_islands":
              return { f: () => 0, lo: -1, hi: 1 };
            case "weird_scaled_sampler": {
              const e = C(t.input).f,
                n = this.noise(t.noise),
                s = "type_1" === t.rarity_value_mapper;
              return {
                f: (t, i, o) => {
                  const r = e(t, i, o),
                    a = s
                      ? r < -0.5
                        ? 0.75
                        : r < 0
                          ? 1
                          : r < 0.5
                            ? 1.5
                            : 2
                      : r < -0.75
                        ? 0.5
                        : r < -0.5
                          ? 0.75
                          : r < 0.5
                            ? 1
                            : r < 0.75
                              ? 2
                              : 3;
                  return a * Math.abs(n.get(t / a, i / a, o / a));
                },
                lo: 0,
                hi: 3 * n.maxValue,
              };
            }
          }
          throw new Error("unsupported density function " + e);
        }
        spline(e) {
          if ("number" == typeof e) {
            const n = t(e);
            return () => n;
          }
          const n = this.compile(e.coordinate).f,
            s = e.points.map((e) => t(e.location)),
            i = e.points.map((e) => t(e.derivative)),
            o = e.points.map((t) => this.spline(t.value)),
            r = s.length - 1;
          return (e, a, l) => {
            const h = t(n(e, a, l));
            let u = -1;
            for (; u < r && h >= s[u + 1];) u++;
            if (u < 0) {
              const n = o[0](e, a, l),
                r = i[0];
              return 0 === r ? n : t(n + t(r * t(h - s[0])));
            }
            if (u === r) {
              const n = o[r](e, a, l),
                u = i[r];
              return 0 === u ? n : t(n + t(u * t(h - s[r])));
            }
            const f = s[u],
              m = s[u + 1],
              d = t(t(h - f) / t(m - f)),
              p = i[u],
              _ = i[u + 1],
              g = o[u](e, a, l),
              x = o[u + 1](e, a, l),
              b = t(m - f),
              w = t(x - g),
              y = t(t(p * b) - w),
              v = t(t(-_ * b) + w),
              M = t(g + t(d * w)),
              I = t(y + t(d * t(v - y)));
            return t(M + t(t(d * t(1 - d)) * I));
          };
        }
      },
      Aquifer: class Aquifer {
        constructor(t, e, n, s) {
          const i = t.router,
            o = t.S.minY,
            r = 8 * t.S.cellsY;
          ((this.barrier = i.barrier.f),
            (this.flood = i.fluid_level_floodedness.f),
            (this.spread = i.fluid_level_spread.f),
            (this.lavaN = i.lava.f),
            (this.erosion = i.erosion.f),
            (this.depth = i.depth.f),
            (this.rand = t.aquiferRandom),
            (this.prelim = s),
            (this.sea = t.settings.sea_level));
          const fd = (t, e) => Math.floor(t / e);
          ((this.minGX = fd(16 * e, 16) - 1),
            (this.sizeX = fd(16 * e + 15, 16) + 1 - this.minGX + 1),
            (this.minGY = fd(o, 12) - 1),
            (this.sizeY = fd(o + r, 12) + 1 - this.minGY + 1),
            (this.minGZ = fd(16 * n, 16) - 1),
            (this.sizeZ = fd(16 * n + 15, 16) + 1 - this.minGZ + 1));
          const a = this.sizeX * this.sizeY * this.sizeZ;
          ((this.locX = new Int32Array(a)),
            (this.locY = new Int32Array(a)),
            (this.locZ = new Int32Array(a)),
            (this.locSet = new Uint8Array(a)),
            (this.stLevel = new Int32Array(a)),
            (this.stType = new Int8Array(a)),
            (this.stSet = new Uint8Array(a)),
            (this.sL = 0),
            (this.sT = 0),
            (this.bar = NaN));
          let l = this.sea;
          const h = 16 * Math.floor((16 * e - 5) / 16),
            u = 16 * (Math.floor((16 * e + 10) / 16) + 1) + 9,
            f = 16 * Math.floor((16 * n - 5) / 16),
            m = 16 * (Math.floor((16 * n + 10) / 16) + 1) + 9;
          for (let t = h >> 2; t <= u >> 2; t++)
            for (let e = f >> 2; e <= m >> 2; e++) l = Math.max(l, s(t << 2, e << 2));
          this.airFrom = l + 5;
        }
        idx(t, e, n) {
          return ((e - this.minGY) * this.sizeZ + (n - this.minGZ)) * this.sizeX + (t - this.minGX);
        }
        globalLevel(t) {
          return t < Math.min(-54, this.sea) ? -54 : this.sea;
        }
        globalType(t) {
          return t < Math.min(-54, this.sea) ? 2 : 1;
        }
        compute(t, e, n, s) {
          if (s > 0) return -1;
          if (e >= this.airFrom) return 0;
          if (e < -54) return 2;
          const i = Math.floor((t - 5) / 16),
            o = Math.floor((e + 1) / 12),
            r = Math.floor((n - 5) / 16);
          let a = 2147483647,
            l = a,
            h = a,
            u = -1,
            f = -1,
            m = -1;
          for (let s = 0; s <= 1; s++)
            for (let d = -1; d <= 1; d++)
              for (let p = 0; p <= 1; p++) {
                const _ = i + s,
                  g = o + d,
                  x = r + p,
                  b = this.idx(_, g, x);
                if (!this.locSet[b]) {
                  const t = this.rand.at(_, g, x);
                  ((this.locX[b] = 16 * _ + t.nextIntB(10)),
                    (this.locY[b] = 12 * g + t.nextIntB(9)),
                    (this.locZ[b] = 16 * x + t.nextIntB(10)),
                    (this.locSet[b] = 1));
                }
                const w = this.locX[b] - t,
                  y = this.locY[b] - e,
                  v = this.locZ[b] - n,
                  M = w * w + y * y + v * v;
                a >= M
                  ? ((m = f), (f = u), (u = b), (h = l), (l = a), (a = M))
                  : l >= M
                    ? ((m = f), (f = b), (h = l), (l = M))
                    : h >= M && ((m = b), (h = M));
              }
          this.status(u);
          const d = this.sL,
            p = this.sT,
            _ = 1 - Math.abs(l - a) / 25,
            g = e < d ? p : 0;
          if (_ <= 0) return g;
          if (1 === g && e - 1 < -54) return g;
          ((this.bar = NaN), this.status(f));
          const x = this.sL,
            b = this.sT;
          if (s + _ * this.pressure(t, e, n, d, p, x, b) > 0) return -1;
          this.status(m);
          const w = this.sL,
            y = this.sT,
            v = 1 - Math.abs(h - a) / 25;
          if (v > 0) {
            if (s + _ * v * this.pressure(t, e, n, d, p, w, y) > 0) return -1;
          }
          const M = 1 - Math.abs(h - l) / 25;
          if (M > 0) {
            if (s + _ * M * this.pressure(t, e, n, x, b, w, y) > 0) return -1;
          }
          return g;
        }
        pressure(t, e, n, s, i, o, r) {
          const a = e < s ? i : 0,
            l = e < o ? r : 0;
          if ((2 === a && 1 === l) || (1 === a && 2 === l)) return 2;
          const h = Math.abs(s - o);
          if (0 === h) return 0;
          const u = e + 0.5 - 0.5 * (s + o),
            f = h / 2 - Math.abs(u);
          let m, d;
          if (u > 0) {
            const t = 0 + f;
            m = t > 0 ? t / 1.5 : t / 2.5;
          } else {
            const t = 3 + f;
            m = t > 0 ? t / 3 : t / 10;
          }
          return (
            m < -2 || m > 2
              ? (d = 0)
              : (Number.isNaN(this.bar) && (this.bar = this.barrier(t, e, n)), (d = this.bar)),
            2 * (d + m)
          );
        }
        status(t) {
          (this.stSet[t] ||
            (this.computeFluid(this.locX[t], this.locY[t], this.locZ[t]),
            (this.stLevel[t] = this.sL),
            (this.stType[t] = this.sT),
            (this.stSet[t] = 1)),
            (this.sL = this.stLevel[t]),
            (this.sT = this.stType[t]));
        }
        computeFluid(t, s, i) {
          const o = this.globalLevel(s),
            r = this.globalType(s);
          let a = 2147483647;
          const l = s + 12,
            h = s - 12;
          let u,
            f,
            m,
            d = !1;
          for (const [e, s] of n) {
            const n = t + 16 * e,
              u = i + 16 * s,
              f = this.prelim(n, u),
              m = f + 8,
              p = 0 === e && 0 === s;
            if (p && h > m) return ((this.sL = o), void (this.sT = r));
            const _ = l > m;
            if (_ || p) {
              const t = this.globalLevel(m),
                e = this.globalType(m);
              if (m < t && (p && (d = !0), _)) return ((this.sL = t), void (this.sT = e));
            }
            a = Math.min(a, f);
          }
          if (
            this.erosion(t, s, i) < -0.22499999403953552 &&
            this.depth(t, s, i) > 0.8999999761581421
          )
            ((u = -1), (f = -1));
          else {
            const e = d ? clampedMap(a + 8 - s, 0, 64, 1, 0) : 0,
              n = Math.max(-1, Math.min(1, this.flood(t, s, i)));
            ((u = n - (((e - 1) / -1) * (0.4 - -0.8) - 0.8)),
              (f = n - (((e - 1) / -1) * 1.1 - 0.3)));
          }
          if (f > 0) m = o;
          else if (u > 0) {
            const e = Math.floor(t / 16),
              n = Math.floor(s / 40),
              o = Math.floor(i / 16),
              r = 40 * n + 20,
              l = 10 * this.spread(e, n, o),
              h = 3 * Math.floor(l / 3);
            m = Math.min(a, r + h);
          } else m = e;
          let p = r;
          if (m <= -10 && m !== e && 2 !== r) {
            const e = this.lavaN(Math.floor(t / 64), Math.floor(s / 40), Math.floor(i / 64));
            Math.abs(e) > 0.3 && (p = 2);
          }
          ((this.sL = m), (this.sT = p));
        }
      },
      makeVeinifier: function makeVeinifier(t) {
        const e = t.router,
          n = e.vein_toggle.f,
          s = e.vein_ridged.f,
          i = e.vein_gap.f,
          o = t.oreRandom,
          r = ["copper_ore", "raw_copper_block", "granite", 0, 50],
          a = ["deepslate_iron_ore", "raw_iron_block", "tuff", -60, -8];
        return (t, e, l) => {
          const h = n(t, e, l),
            u = h > 0 ? r : a,
            f = Math.abs(h),
            m = u[4] - e,
            d = e - u[3];
          if (d < 0 || m < 0) return null;
          const p = Math.min(m, d);
          if (f + clampedMap(p, 0, 20, -0.2, 0) < 0.4000000059604645) return null;
          const _ = o.at(t, e, l);
          if (_.nextFloat() > 0.699999988079071) return null;
          if (s(t, e, l) >= 0) return null;
          const g = clampedMap(
            f,
            0.4000000059604645,
            0.6000000238418579,
            0.10000000149011612,
            0.30000001192092896,
          );
          return _.nextFloat() < g && i(t, e, l) > -0.30000001192092896
            ? _.nextFloat() < 0.02
              ? u[1]
              : u[0]
            : u[2];
        };
      },
      SUB: { AIR: 0, WATER: 1, LAVA: 2, NONE: -1 },
      clampedMap: clampedMap,
    });
  })(),
  (function () {
    const q = (t) => Math.trunc(Math.fround(1e4 * Math.fround(t))),
      span = (t, e) => ["number" == typeof t ? q(t) : t[0], "number" == typeof e ? q(e) : e[1]],
      point = (t) => [q(t), q(t)],
      t = span(-1, 1),
      e = [span(-1, -0.45), span(-0.45, -0.15), span(-0.15, 0.2), span(0.2, 0.55), span(0.55, 1)],
      n = [span(-1, -0.35), span(-0.35, -0.1), span(-0.1, 0.1), span(0.1, 0.3), span(0.3, 1)],
      s = [
        span(-1, -0.78),
        span(-0.78, -0.375),
        span(-0.375, -0.2225),
        span(-0.2225, 0.05),
        span(0.05, 0.45),
        span(0.45, 0.55),
        span(0.55, 1),
      ],
      i = e[0],
      o = span(e[1], e[4]),
      r = span(-1.2, -1.05),
      a = span(-1.05, -0.455),
      l = span(-0.455, -0.19),
      h = span(-0.19, -0.11),
      u = span(-0.11, 0.55),
      f = span(-0.11, 0.03),
      m = span(0.03, 0.3),
      d = span(0.3, 1),
      p = [
        ["deep_frozen_ocean", "deep_cold_ocean", "deep_ocean", "deep_lukewarm_ocean", "warm_ocean"],
        ["frozen_ocean", "cold_ocean", "ocean", "lukewarm_ocean", "warm_ocean"],
      ],
      _ = [
        ["snowy_plains", "snowy_plains", "snowy_plains", "snowy_taiga", "taiga"],
        ["plains", "plains", "forest", "taiga", "old_growth_spruce_taiga"],
        ["flower_forest", "plains", "forest", "birch_forest", "dark_forest"],
        ["savanna", "savanna", "forest", "jungle", "jungle"],
        ["desert", "desert", "desert", "desert", "desert"],
      ],
      g = [
        ["ice_spikes", null, "snowy_taiga", null, null],
        [null, null, null, null, "old_growth_pine_taiga"],
        ["sunflower_plains", null, null, "old_growth_birch_forest", null],
        [null, null, "plains", "sparse_jungle", "bamboo_jungle"],
        [null, null, null, null, null],
      ],
      x = [
        ["snowy_plains", "snowy_plains", "snowy_plains", "snowy_taiga", "snowy_taiga"],
        ["meadow", "meadow", "forest", "taiga", "old_growth_spruce_taiga"],
        ["meadow", "meadow", "meadow", "meadow", "pale_garden"],
        ["savanna_plateau", "savanna_plateau", "forest", "forest", "jungle"],
        ["badlands", "badlands", "badlands", "wooded_badlands", "wooded_badlands"],
      ],
      b = [
        ["ice_spikes", null, null, null, null],
        ["cherry_grove", null, "meadow", "meadow", "old_growth_pine_taiga"],
        ["cherry_grove", "cherry_grove", "forest", "birch_forest", null],
        [null, null, null, null, null],
        ["eroded_badlands", "eroded_badlands", null, null, null],
      ],
      w = [
        [
          "windswept_gravelly_hills",
          "windswept_gravelly_hills",
          "windswept_hills",
          "windswept_forest",
          "windswept_forest",
        ],
        [
          "windswept_gravelly_hills",
          "windswept_gravelly_hills",
          "windswept_hills",
          "windswept_forest",
          "windswept_forest",
        ],
        [
          "windswept_hills",
          "windswept_hills",
          "windswept_hills",
          "windswept_forest",
          "windswept_forest",
        ],
        [null, null, null, null, null],
        [null, null, null, null, null],
      ];
    function overworldParameters() {
      const y = [],
        add = (t, e, n, s, i, o, r, a) => y.push([[t, e, n, s, i, o, point(r)], a]),
        surf = (t, e, n, s, i, o, r) => {
          (add(t, e, n, s, point(0), i, o, r), add(t, e, n, s, point(1), i, o, r));
        },
        under = (t, e, n, s, i, o, r) => add(t, e, n, s, span(0.2, 0.9), i, o, r),
        neg = (t) => t[1] < 0,
        middle = (t, e, n) => (neg(n) ? _[t][e] : g[t][e] || _[t][e]),
        badlands = (t, e) =>
          t < 2
            ? neg(e)
              ? "badlands"
              : "eroded_badlands"
            : t < 3
              ? "badlands"
              : "wooded_badlands",
        middleOrBadlands = (t, e, n) => (4 === t ? badlands(e, n) : middle(t, e, n)),
        plateau = (t, e, n) => (!neg(n) && b[t][e] ? b[t][e] : x[t][e]),
        slope = (t, e, n) => (t >= 3 ? plateau(t, e, n) : e <= 1 ? "snowy_slopes" : "grove"),
        middleOrBadlandsOrSlope = (t, e, n) =>
          0 === t ? slope(t, e, n) : middleOrBadlands(t, e, n),
        windswept = (t, e, n, s) => (t > 1 && e < 4 && !neg(n) ? "windswept_savanna" : s),
        beach = (t) => (0 === t ? "snowy_beach" : 4 === t ? "desert" : "beach"),
        shatteredCoast = (t, e, n) => windswept(t, e, n, neg(n) ? beach(t) : middle(t, e, n)),
        peak = (t, e, n) =>
          t <= 2
            ? neg(n)
              ? "jagged_peaks"
              : "frozen_peaks"
            : 3 === t
              ? "stony_peaks"
              : badlands(e, n),
        shattered = (t, e, n) => w[t][e] || middle(t, e, n),
        S2 = (t, e) => span(t, e);
      surf(t, t, r, t, t, 0, "mushroom_fields");
      for (let n = 0; n < 5; n++)
        (surf(e[n], t, a, t, t, 0, p[0][n]), surf(e[n], t, l, t, t, 0, p[1][n]));
      const peaks = (t) => {
          for (let i = 0; i < 5; i++)
            for (let o = 0; o < 5; o++) {
              const r = e[i],
                a = n[o],
                l = middle(i, o, t),
                u = middleOrBadlands(i, o, t),
                p = middleOrBadlandsOrSlope(i, o, t),
                _ = plateau(i, o, t),
                g = shattered(i, o, t),
                x = windswept(i, o, t, g),
                b = peak(i, o, t);
              (surf(r, a, S2(h, d), s[0], t, 0, b),
                surf(r, a, S2(h, f), s[1], t, 0, p),
                surf(r, a, S2(m, d), s[1], t, 0, b),
                surf(r, a, S2(h, f), S2(s[2], s[3]), t, 0, l),
                surf(r, a, S2(m, d), s[2], t, 0, _),
                surf(r, a, m, s[3], t, 0, u),
                surf(r, a, d, s[3], t, 0, _),
                surf(r, a, S2(h, d), s[4], t, 0, l),
                surf(r, a, S2(h, f), s[5], t, 0, x),
                surf(r, a, S2(m, d), s[5], t, 0, g),
                surf(r, a, S2(h, d), s[6], t, 0, l));
            }
        },
        high = (t) => {
          for (let i = 0; i < 5; i++)
            for (let o = 0; o < 5; o++) {
              const r = e[i],
                a = n[o],
                l = middle(i, o, t),
                u = middleOrBadlands(i, o, t),
                p = middleOrBadlandsOrSlope(i, o, t),
                _ = plateau(i, o, t),
                g = shattered(i, o, t),
                x = windswept(i, o, t, l),
                b = slope(i, o, t),
                w = peak(i, o, t);
              (surf(r, a, h, S2(s[0], s[1]), t, 0, l),
                surf(r, a, f, s[0], t, 0, b),
                surf(r, a, S2(m, d), s[0], t, 0, w),
                surf(r, a, f, s[1], t, 0, p),
                surf(r, a, S2(m, d), s[1], t, 0, b),
                surf(r, a, S2(h, f), S2(s[2], s[3]), t, 0, l),
                surf(r, a, S2(m, d), s[2], t, 0, _),
                surf(r, a, m, s[3], t, 0, u),
                surf(r, a, d, s[3], t, 0, _),
                surf(r, a, S2(h, d), s[4], t, 0, l),
                surf(r, a, S2(h, f), s[5], t, 0, x),
                surf(r, a, S2(m, d), s[5], t, 0, g),
                surf(r, a, S2(h, d), s[6], t, 0, l));
            }
        },
        mid = (i) => {
          (surf(t, t, h, S2(s[0], s[2]), i, 0, "stony_shore"),
            surf(S2(e[1], e[2]), t, S2(f, d), s[6], i, 0, "swamp"),
            surf(S2(e[3], e[4]), t, S2(f, d), s[6], i, 0, "mangrove_swamp"));
          for (let t = 0; t < 5; t++)
            for (let o = 0; o < 5; o++) {
              const r = e[t],
                a = n[o],
                l = middle(t, o, i),
                u = middleOrBadlands(t, o, i),
                p = middleOrBadlandsOrSlope(t, o, i),
                _ = shattered(t, o, i),
                g = plateau(t, o, i),
                x = beach(t),
                b = windswept(t, o, i, l),
                w = shatteredCoast(t, o, i),
                y = slope(t, o, i);
              (surf(r, a, S2(f, d), s[0], i, 0, y),
                surf(r, a, S2(f, m), s[1], i, 0, p),
                surf(r, a, d, s[1], i, 0, 0 === t ? y : g),
                surf(r, a, f, s[2], i, 0, l),
                surf(r, a, m, s[2], i, 0, u),
                surf(r, a, d, s[2], i, 0, g),
                surf(r, a, S2(h, f), s[3], i, 0, l),
                surf(r, a, S2(m, d), s[3], i, 0, u),
                neg(i)
                  ? (surf(r, a, h, s[4], i, 0, x), surf(r, a, S2(f, d), s[4], i, 0, l))
                  : surf(r, a, S2(h, d), s[4], i, 0, l),
                surf(r, a, h, s[5], i, 0, w),
                surf(r, a, f, s[5], i, 0, b),
                surf(r, a, S2(m, d), s[5], i, 0, _),
                neg(i) ? surf(r, a, h, s[6], i, 0, x) : surf(r, a, h, s[6], i, 0, l),
                0 === t && surf(r, a, S2(f, d), s[6], i, 0, l));
            }
        },
        low = (i) => {
          (surf(t, t, h, S2(s[0], s[2]), i, 0, "stony_shore"),
            surf(S2(e[1], e[2]), t, S2(f, d), s[6], i, 0, "swamp"),
            surf(S2(e[3], e[4]), t, S2(f, d), s[6], i, 0, "mangrove_swamp"));
          for (let t = 0; t < 5; t++)
            for (let o = 0; o < 5; o++) {
              const r = e[t],
                a = n[o],
                l = middle(t, o, i),
                u = middleOrBadlands(t, o, i),
                p = middleOrBadlandsOrSlope(t, o, i),
                _ = beach(t),
                g = windswept(t, o, i, l),
                x = shatteredCoast(t, o, i);
              (surf(r, a, f, S2(s[0], s[1]), i, 0, u),
                surf(r, a, S2(m, d), S2(s[0], s[1]), i, 0, p),
                surf(r, a, f, S2(s[2], s[3]), i, 0, l),
                surf(r, a, S2(m, d), S2(s[2], s[3]), i, 0, u),
                surf(r, a, h, S2(s[3], s[4]), i, 0, _),
                surf(r, a, S2(f, d), s[4], i, 0, l),
                surf(r, a, h, s[5], i, 0, x),
                surf(r, a, f, s[5], i, 0, g),
                surf(r, a, S2(m, d), s[5], i, 0, l),
                surf(r, a, h, s[6], i, 0, _),
                0 === t && surf(r, a, S2(f, d), s[6], i, 0, l));
            }
        };
      var v, M, I, B, N, A, F;
      return (
        mid(span(-1, -0.93333334)),
        high(span(-0.93333334, -0.7666667)),
        peaks(span(-0.7666667, -0.56666666)),
        high(span(-0.56666666, -0.4)),
        mid(span(-0.4, -0.26666668)),
        low(span(-0.26666668, -0.05)),
        ((r) => {
          (surf(i, t, h, S2(s[0], s[1]), r, 0, neg(r) ? "stony_shore" : "frozen_river"),
            surf(o, t, h, S2(s[0], s[1]), r, 0, neg(r) ? "stony_shore" : "river"),
            surf(i, t, f, S2(s[0], s[1]), r, 0, "frozen_river"),
            surf(o, t, f, S2(s[0], s[1]), r, 0, "river"),
            surf(i, t, S2(h, d), S2(s[2], s[5]), r, 0, "frozen_river"),
            surf(o, t, S2(h, d), S2(s[2], s[5]), r, 0, "river"),
            surf(i, t, h, s[6], r, 0, "frozen_river"),
            surf(o, t, h, s[6], r, 0, "river"),
            surf(S2(e[1], e[2]), t, S2(u, d), s[6], r, 0, "swamp"),
            surf(S2(e[3], e[4]), t, S2(u, d), s[6], r, 0, "mangrove_swamp"),
            surf(i, t, S2(u, d), s[6], r, 0, "frozen_river"));
          for (let t = 0; t < 5; t++)
            for (let i = 0; i < 5; i++)
              surf(e[t], n[i], S2(m, d), S2(s[0], s[1]), r, 0, middleOrBadlands(t, i, r));
        })(span(-0.05, 0.05)),
        low(span(0.05, 0.26666668)),
        mid(span(0.26666668, 0.4)),
        high(span(0.4, 0.56666666)),
        peaks(span(0.56666666, 0.7666667)),
        high(span(0.7666667, 0.93333334)),
        mid(span(0.93333334, 1)),
        under(t, t, span(0.8, 1), t, t, 0, "dripstone_caves"),
        under(t, span(0.7, 1), t, t, t, 0, "lush_caves"),
        (v = t),
        (M = t),
        (I = t),
        (B = S2(s[0], s[1])),
        (N = t),
        (A = 0),
        (F = "deep_dark"),
        add(v, M, I, B, point(1.1), N, A, F),
        y
      );
    }
    function mkSub(t) {
      const e = [];
      for (let n = 0; n < 7; n++) {
        let s = 1 / 0,
          i = -1 / 0;
        for (const e of t) ((s = Math.min(s, e.space[n][0])), (i = Math.max(i, e.space[n][1])));
        e.push([s, i]);
      }
      return { space: e, children: t, leaf: !1 };
    }
    const centre = (t, e, n) => {
      const s = t.space[e],
        i = Math.trunc((s[0] + s[1]) / 2);
      return n ? Math.abs(i) : i;
    };
    function sortNodes(t, e, n) {
      t.sort((t, s) => {
        for (let i = 0; i < 7; i++) {
          const o = (e + i) % 7,
            r = centre(t, o, n),
            a = centre(s, o, n);
          if (r !== a) return r - a;
        }
        return 0;
      });
    }
    function bucketize(t) {
      const e = [];
      let n = [];
      const s = Math.pow(6, Math.floor(Math.log(t.length - 0.01) / Math.log(6)));
      for (const i of t) (n.push(i), n.length >= s && (e.push(mkSub(n)), (n = [])));
      return (n.length && e.push(mkSub(n)), e);
    }
    const cost = (t) => {
      let e = 0;
      for (const n of t) e += Math.abs(n[1] - n[0]);
      return e;
    };
    function build(t) {
      if (1 === t.length) return t[0];
      if (t.length <= 6)
        return (
          t.sort((t, e) => {
            let n = 0,
              s = 0;
            for (let i = 0; i < 7; i++)
              ((n += Math.abs(Math.trunc((t.space[i][0] + t.space[i][1]) / 2))),
                (s += Math.abs(Math.trunc((e.space[i][0] + e.space[i][1]) / 2))));
            return n - s;
          }),
          mkSub(t)
        );
      let e = 1 / 0,
        n = -1,
        s = null;
      for (let i = 0; i < 7; i++) {
        sortNodes(t, i, !1);
        const o = bucketize(t);
        let r = 0;
        for (const t of o) r += cost(t.space);
        e > r && ((e = r), (n = i), (s = o));
      }
      return (sortNodes(s, n, !0), mkSub(s.map((t) => build(t.children.slice()))));
    }
    function dist(t, e) {
      let n = 0;
      for (let s = 0; s < 7; s++) {
        const i = t.space[s],
          o = e[s],
          r = o > i[1] ? o - i[1] : o < i[0] ? i[0] - o : 0;
        n += r * r;
      }
      return n;
    }
    function search(t, e, n) {
      if (t.leaf) return t;
      let s = n ? dist(n, e) : 1 / 0,
        i = n;
      for (const n of t.children) {
        const t = dist(n, e);
        if (s > t) {
          const o = search(n, e, i),
            r = n === o ? t : dist(o, e);
          s > r && ((s = r), (i = o));
        }
      }
      return i;
    }
    class BiomeTree {
      constructor(t) {
        ((this.root = build(
          t.map(([t, e]) =>
            (function mkLeaf(t, e) {
              return { space: t, value: e, leaf: !0 };
            })(t, e),
          ),
        )),
          (this.last = null));
      }
      find(t) {
        return ((this.last = search(this.root, t, this.last)), this.last.value);
      }
    }
    Object.assign(WG, {
      overworldParameters: overworldParameters,
      netherParameters: function netherParameters() {
        const P = (t, e, n) => [
          point(t),
          point(e),
          point(0),
          point(0),
          point(0),
          point(0),
          point(n),
        ];
        return [
          [P(0, 0, 0), "nether_wastes"],
          [P(0, -0.5, 0), "soul_sand_valley"],
          [P(0.4, 0, 0), "crimson_forest"],
          [P(0, 0.5, 0.375), "warped_forest"],
          [P(-0.5, 0, 0.175), "basalt_deltas"],
        ];
      },
      BiomeTree: BiomeTree,
      BiomeSource: class BiomeSource {
        constructor(t, e) {
          this.rs = t;
          const n = t.router;
          ((this.fn = [
            n.temperature.f,
            n.vegetation.f,
            n.continents.f,
            n.erosion.f,
            n.depth.f,
            n.ridges.f,
          ]),
            (this.tree = new BiomeTree(e || overworldParameters())),
            (this.t = [0, 0, 0, 0, 0, 0, 0]));
        }
        climate(t, e, n, s) {
          for (let i = 0; i < 6; i++) s[i] = q(this.fn[i](t, e, n));
          return ((s[6] = 0), s);
        }
        at(t, e, n) {
          return this.tree.find(this.climate(t << 2, e << 2, n << 2, this.t));
        }
      },
      BiomeZoom: class BiomeZoom {
        constructor(t) {
          const e = BigInt.asUintN(64, BigInt(t)),
            n = new Uint8Array(8);
          for (let t = 0; t < 8; t++) n[t] = Number((e >> BigInt(8 * t)) & 0xffn);
          const s = WG.sha256(n);
          let i = 0n;
          for (let t = 7; t >= 0; t--) i = (i << 8n) | BigInt(s[t]);
          this.seed = BigInt.asIntN(64, i);
          const o = WG.fromBig(this.seed);
          ((this.sh = o[0]), (this.sl = o[1]), (this.cache = new Map()));
        }
        setBox(t, e, n, s, i, o) {
          ((this.bx = t),
            (this.by = e),
            (this.bz = n),
            (this.nx = s),
            (this.ny = i),
            (this.nz = o));
          const r = s * i * o;
          !this.bv || this.bv.length < 3 * r
            ? ((this.bv = new Float64Array(3 * r)), (this.bf = new Uint8Array(r)))
            : this.bf.fill(0, 0, r);
        }
        fiddle(t, e, n) {
          const s = (73856093 * t) ^ (19349663 * e) ^ (83492791 * n);
          let i = this.cache.get(s);
          if (i && i[3] === t && i[4] === e && i[5] === n) return i;
          let o = this.sh,
            r = this.sl;
          const next = (t, e) => {
            WG.mul64(o, r, 1481765933, 1284865837);
            const n = WG.getR();
            WG.add64(n[0], n[1], 335903614, -144211633);
            const s = WG.getR();
            WG.mul64(o, r, s[0], s[1]);
            const i = WG.getR();
            WG.add64(i[0], i[1], t, e);
            const a = WG.getR();
            ((o = a[0]), (r = a[1]));
          };
          (next(t >> 31, t),
            next(e >> 31, e),
            next(n >> 31, n),
            next(t >> 31, t),
            next(e >> 31, e),
            next(n >> 31, n));
          const fid = () => 0.9 * (((r >>> 24) | ((3 & o) << 8)) / 1024 - 0.5),
            a = fid();
          next(this.sh, this.sl);
          const l = fid();
          next(this.sh, this.sl);
          return (
            (i = [a, l, fid(), t, e, n]),
            this.cache.size > 2e5 && this.cache.clear(),
            this.cache.set(s, i),
            i
          );
        }
        pick(t, e, n, s) {
          const i = t - 2,
            o = e - 2,
            r = n - 2,
            a = i >> 2,
            l = o >> 2,
            h = r >> 2,
            u = (3 & i) / 4,
            f = (3 & o) / 4,
            m = (3 & r) / 4;
          let d = 0,
            p = 1 / 0;
          const _ =
            this.bv &&
            a - this.bx >= 0 &&
            a + 1 - this.bx < this.nx &&
            l - this.by >= 0 &&
            l + 1 - this.by < this.ny &&
            h - this.bz >= 0 &&
            h + 1 - this.bz < this.nz;
          for (let t = 0; t < 8; t++) {
            const e = !(4 & t),
              n = !(2 & t),
              s = !(1 & t),
              i = e ? a : a + 1,
              o = n ? l : l + 1,
              r = s ? h : h + 1;
            let g, x, b;
            if (_) {
              const t = ((o - this.by) * this.nz + (r - this.bz)) * this.nx + (i - this.bx),
                e = this.bv;
              if (!this.bf[t]) {
                const n = this.fiddle(i, o, r);
                ((e[3 * t] = n[0]), (e[3 * t + 1] = n[1]), (e[3 * t + 2] = n[2]), (this.bf[t] = 1));
              }
              ((g = e[3 * t]), (x = e[3 * t + 1]), (b = e[3 * t + 2]));
            } else {
              const t = this.fiddle(i, o, r);
              ((g = t[0]), (x = t[1]), (b = t[2]));
            }
            const w = e ? u : u - 1,
              y = n ? f : f - 1,
              v = s ? m : m - 1,
              M = (v + b) * (v + b) + (y + x) * (y + x) + (w + g) * (w + g);
            p > M && ((d = t), (p = M));
          }
          return (
            (s[0] = 4 & d ? a + 1 : a),
            (s[1] = 2 & d ? l + 1 : l),
            (s[2] = 1 & d ? h + 1 : h),
            s
          );
        }
      },
      quantize: q,
    });
  })(),
  (function () {
    class PerlinSimplex {
      constructor(t, e) {
        const n = -e[0],
          s = e[e.length - 1],
          i = n + s + 1,
          o = new WG.SimplexNoise(t);
        ((this.levels = new Array(i).fill(null)),
          s >= 0 && s < i && e.includes(0) && (this.levels[s] = o));
        for (let n = s + 1; n < i; n++)
          n >= 0 && e.includes(s - n) ? (this.levels[n] = new WG.SimplexNoise(t)) : t.consume(262);
        ((this.inF = Math.pow(2, s)), (this.valF = 1 / (Math.pow(2, i) - 1)));
      }
      get(t, e) {
        let n = 0,
          s = this.inF,
          i = this.valF;
        for (const o of this.levels) (o && (n += o.get2(t * s, e * s) * i), (s /= 2), (i *= 2));
        return n;
      }
    }
    let t = null,
      e = null,
      n = null;
    function climateNoises() {
      t ||
        ((t = new PerlinSimplex(new WG.JavaRandom(1234), [0])),
        (e = new PerlinSimplex(new WG.JavaRandom(3456), [-2, -1, 0])),
        (n = new PerlinSimplex(new WG.JavaRandom(2345), [0])));
    }
    const s = Math.fround;
    function biomeTemperature(i, o, r, a, l) {
      climateNoises();
      let h = s(i.temperature);
      if ("frozen" === i.temperature_modifier) {
        7 * e.get(0.05 * o, 0.05 * a) + n.get(0.2 * o, 0.2 * a) < 0.3 &&
          n.get(0.09 * o, 0.09 * a) < 0.8 &&
          (h = s(0.2));
      }
      const u = l + 17;
      if (r > u) {
        const e = s(8 * t.get(s(o / 8), s(a / 8)));
        return s(h - s(s(s(e + r) - u) * s(0.05)) / 40);
      }
      return h;
    }
    const coldEnoughToSnow = (t, e, n, s, i) =>
      biomeTemperature(t, e, n, s, i) < 0.15000000596046448;
    Object.assign(WG, {
      Generator: class Generator {
        constructor(t, e, n, s = "overworld") {
          ((this.data = e),
            (this.dim = s),
            (this.rs = new WG.RandomState(t, e, s)),
            (this.biomes = new WG.BiomeSource(
              this.rs,
              "nether" === s ? WG.netherParameters() : null,
            )),
            (this.zoom = new WG.BiomeZoom(this.rs.seed)),
            (this.set = this.rs.settings),
            (this.minY = this.set.noise.min_y),
            (this.height = this.set.noise.height),
            (this.sea = this.set.sea_level),
            (this.biomeList = e.biome_order),
            (this.biomeIdx = new Map(this.biomeList.map((t, e) => [t, e]))),
            (this.biomeDef = this.biomeList.map((t) => e.biome[t])),
            (this.pal = n));
          const P = (t) => {
            const e = n[t];
            return void 0 === e ? n.stone : e;
          };
          ((this.P = P),
            (this.STONE = P(this.set.default_block.Name.replace("minecraft:", ""))),
            (this.WATER = P("water")),
            (this.LAVA = P("lava")),
            (this.AIR = 0),
            (this.fluid = this.set.default_fluid.Name.includes("lava") ? this.LAVA : this.WATER));
          const i = this.rs,
            o = i.random;
          ((this.noiseRandom = o),
            (this.nSurface = i.noise("surface")),
            (this.nSecondary = i.noise("surface_secondary")),
            (this.nBandOff = i.noise("clay_bands_offset")),
            (this.nBadSurf = i.noise("badlands_surface")),
            (this.nBadPillar = i.noise("badlands_pillar")),
            (this.nBadRoof = i.noise("badlands_pillar_roof")),
            (this.nIceSurf = i.noise("iceberg_surface")),
            (this.nIcePillar = i.noise("iceberg_pillar")),
            (this.nIceRoof = i.noise("iceberg_pillar_roof")),
            (this.bands = (function generateBands(t) {
              const e = 192,
                n = new Array(e).fill("terracotta");
              for (let s = 0; s < e; s++)
                ((s += t.nextIntB(5) + 1), s < e && (n[s] = "orange_terracotta"));
              const make = (s, i) => {
                const o = t.nextIntBetween(6, 15);
                for (let r = 0; r < o; r++) {
                  const o = s + t.nextIntB(3),
                    r = t.nextIntB(e);
                  for (let t = 0; r + t < e && t < o; t++) n[r + t] = i;
                }
              };
              (make(1, "yellow_terracotta"),
                make(2, "brown_terracotta"),
                make(1, "red_terracotta"));
              const s = t.nextIntBetween(9, 15);
              let i = 0;
              for (let o = 0; i < s && o < e; o += t.nextIntB(16) + 4)
                ((n[o] = "white_terracotta"),
                  o - 1 > 0 && t.nextBoolean() && (n[o - 1] = "light_gray_terracotta"),
                  o + 1 < e && t.nextBoolean() && (n[o + 1] = "light_gray_terracotta"),
                  i++);
              return n;
            })(o.fromHashOf("minecraft:clay_bands")).map(P)),
            (this.veins = this.set.ore_veins_enabled ? WG.makeVeinifier(i) : () => null),
            (this.prelimCache = new Map()),
            (this.rule = this.compileRule(this.set.surface_rule)));
        }
        prelim(t, e) {
          const n = t >> 2,
            s = e >> 2,
            i = 1048576 * n + s;
          let o = this.prelimCache.get(i);
          return (
            void 0 === o &&
              ((o = Math.floor(this.rs.router.preliminary_surface_level.f(n << 2, 0, s << 2))),
              this.prelimCache.size > 1e5 && this.prelimCache.clear(),
              this.prelimCache.set(i, o)),
            o
          );
        }
        baseHeight(t, e, n = !1) {
          const s = 2 * (67108864 * t + e) + (n ? 1 : 0);
          this.bhCache || (this.bhCache = new Map());
          let i = this.bhCache.get(s);
          if (void 0 !== i) return i;
          const o = this.rs,
            r = o.S,
            a = o.router.final_density.f,
            l = this.minY;
          ((r.colMode = !0),
            (r.colX0 = (t >> 2) << 2),
            (r.colZ0 = (e >> 2) << 2),
            (r.colStamp = (r.colStamp || 0) + 1),
            (i = l));
          for (let s = l + this.height - 1; s >= l; s--)
            if ((!n && s < this.sea) || a(t, s, e) > 0) {
              i = s + 1;
              break;
            }
          return (
            (r.colMode = !1),
            this.bhCache.size > 2e5 && this.bhCache.clear(),
            this.bhCache.set(s, i),
            i
          );
        }
        densityAt(t, e, n) {
          const s = this.rs.S;
          ((s.colMode && s.colX0 === (t >> 2) << 2 && s.colZ0 === (n >> 2) << 2) ||
            ((s.colX0 = (t >> 2) << 2),
            (s.colZ0 = (n >> 2) << 2),
            (s.colStamp = (s.colStamp || 0) + 1)),
            (s.colMode = !0));
          const i = this.rs.router.final_density.f(t, e, n);
          return ((s.colMode = !1), i);
        }
        substanceAt(t, e, n) {
          const s = this.densityAt(t, e, n),
            i = WG.SUB;
          if (!this.set.aquifers_enabled)
            return s > 0
              ? i.NONE
              : e < this.sea
                ? this.fluid === this.LAVA
                  ? i.LAVA
                  : i.WATER
                : i.AIR;
          const o = 67108864 * (t >> 4) + (n >> 4);
          this.colAq || (this.colAq = new Map());
          let r = this.colAq.get(o);
          return (
            r ||
              (this.colAq.size > 64 && this.colAq.clear(),
              (r = new WG.Aquifer(this.rs, t >> 4, n >> 4, (t, e) => this.prelim(t, e))),
              this.colAq.set(o, r)),
            r.compute(t, e, n, s)
          );
        }
        biomeAtQuart(t, e, n) {
          return (
            (e = Math.max(this.minY >> 2, Math.min(((this.minY + this.height) >> 2) - 1, e))),
            this.biomes.at(t, e, n)
          );
        }
        biomeAt(t, e, n) {
          const s = this.zoom.pick(t, e, n, [0, 0, 0]);
          return this.biomeAtQuart(s[0], s[1], s[2]);
        }
        temperatureAt(t, e, n, s) {
          return biomeTemperature(this.data.biome[t], e, n, s, this.sea);
        }
        anchor(t) {
          return "absolute" in t
            ? t.absolute
            : "above_bottom" in t
              ? this.minY + t.above_bottom
              : this.height - 1 + this.minY - t.below_top;
        }
        compileCond(t) {
          const e = t.type.replace("minecraft:", ""),
            n = this.ctx;
          switch (e) {
            case "biome": {
              const e = new Set([].concat(t.biome_is).map((t) => t.replace("minecraft:", "")));
              return () => e.has(n.biome());
            }
            case "noise_threshold": {
              const e = this.rs.noise(t.noise),
                s = t.min_threshold,
                i = t.max_threshold;
              return () => {
                const t = e.get(n.x, 0, n.z);
                return t >= s && t <= i;
              };
            }
            case "vertical_gradient": {
              const e = this.anchor(t.true_at_and_below),
                s = this.anchor(t.false_at_and_above),
                i = this.rs.factory(t.random_name);
              return () => {
                const t = n.y;
                if (t <= e) return !0;
                if (t >= s) return !1;
                const o = 1 + ((t - e) / (s - e)) * -1;
                return i.at(n.x, t, n.z).nextFloat() < o;
              };
            }
            case "y_above": {
              const e = this.anchor(t.anchor),
                s = t.surface_depth_multiplier,
                i = t.add_stone_depth;
              return () => n.y + (i ? n.stoneAbove : 0) >= e + n.surfaceDepth * s;
            }
            case "water": {
              const e = t.offset,
                s = t.surface_depth_multiplier,
                i = t.add_stone_depth;
              return () =>
                -2147483648 === n.waterHeight ||
                n.y + (i ? n.stoneAbove : 0) >= n.waterHeight + e + n.surfaceDepth * s;
            }
            case "stone_depth": {
              const e = "ceiling" === t.surface_type,
                s = t.offset,
                i = t.add_surface_depth,
                o = t.secondary_depth_range;
              return () => {
                const t = e ? n.stoneBelow : n.stoneAbove,
                  r = i ? n.surfaceDepth : 0,
                  a = 0 === o ? 0 : Math.trunc(((n.secondary() + 1) / 2) * o);
                return t <= 1 + s + r + a;
              };
            }
            case "above_preliminary_surface":
              return () => n.y >= n.ms;
            case "hole":
              return () => n.surfaceDepth <= 0;
            case "steep":
              return () => n.steep();
            case "temperature":
              return () => coldEnoughToSnow(this.data.biome[n.biome()], n.x, n.y, n.z, this.sea);
            case "not": {
              const e = this.compileCond(t.invert);
              return () => !e();
            }
          }
          throw new Error("surface condition " + e);
        }
        compileRule(t) {
          this.ctx || (this.ctx = {});
          const e = t.type.replace("minecraft:", "");
          switch (e) {
            case "block": {
              const e = this.P(t.result_state.Name.replace("minecraft:", ""));
              return () => e;
            }
            case "sequence": {
              const e = t.sequence.map((t) => this.compileRule(t));
              return () => {
                for (const t of e) {
                  const e = t();
                  if (e >= 0) return e;
                }
                return -1;
              };
            }
            case "condition": {
              const e = this.compileCond(t.if_true),
                n = this.compileRule(t.then_run);
              let s = -1,
                i = !1;
              return () => (
                s !== this.ctx.stamp && ((s = this.ctx.stamp), (i = e())),
                i ? n() : -1
              );
            }
            case "bandlands":
              return () => {
                const t = this.ctx,
                  e = Math.round(4 * this.nBandOff.get(t.x, 0, t.z));
                return this.bands[(((t.y + e) % 192) + 192 + 192) % 192];
              };
          }
          throw new Error("surface rule " + e);
        }
        generate(t, e) {
          const n = this.rs,
            s = n.router,
            i = this.minY,
            o = this.height,
            r = 16 * t,
            a = 16 * e,
            l = new Uint16Array(256 * o),
            h = new Uint8Array(256 * o),
            u = o >> 2,
            f = new Uint8Array(16 * u);
          n.beginChunk(t, e);
          for (let t = 0; t < 4; t++)
            for (let e = 0; e < 4; e++)
              for (let n = 0; n < u; n++)
                f[4 * (4 * n + e) + t] = this.biomeIdx.get(
                  this.biomes.at((r >> 2) + t, (i >> 2) + n, (a >> 2) + e),
                );
          const m = s.final_density.f,
            d = this.beard,
            p = d ? (t, e, n) => m(t, e, n) + d(t, e, n) : m,
            _ = this.set.aquifers_enabled
              ? new WG.Aquifer(n, t, e, (t, e) => this.prelim(t, e))
              : {
                  compute: (t, e, n, s) =>
                    s > 0
                      ? WG.SUB.NONE
                      : e < this.sea
                        ? this.fluid === this.LAVA
                          ? WG.SUB.LAVA
                          : WG.SUB.WATER
                        : WG.SUB.AIR,
                },
            g = WG.SUB,
            x = this.STONE,
            b = this.WATER,
            w = this.LAVA,
            y = this.veins,
            v = this.P,
            M = new Map();
          for (let t = 0; t < 16; t++)
            for (let e = 0; e < 16; e++) {
              const n = r + t,
                s = a + e;
              for (let r = o - 1; r >= 0; r--) {
                const o = r + i,
                  a = p(n, o, s),
                  h = _.compute(n, o, s, a);
                let u;
                if (h === g.NONE) {
                  const t = y(n, o, s);
                  if (t) {
                    let e = M.get(t);
                    (void 0 === e && ((e = v(t)), M.set(t, e)), (u = e));
                  } else u = x;
                } else u = h === g.WATER ? b : h === g.LAVA ? w : 0;
                u && (l[(r << 8) | (e << 4) | t] = u);
              }
            }
          const I = new Int16Array(256);
          for (let t = 0; t < 256; t++) {
            let e = o - 1;
            for (; e >= 0 && !l[(e << 8) | t];) e--;
            I[t] = e + i;
          }
          (this.buildSurface(t, e, l, I, f),
            WG.carveChunk && this.data.configured_carver && WG.carveChunk(this, t, e, l, _),
            n.endChunk());
          for (let t = 0; t < 256; t++) {
            let e = o - 1;
            for (; e >= 0 && !l[(e << 8) | t];) e--;
            I[t] = e + i;
          }
          return { blocks: l, meta: h, quartBiomes: f, heightmap: I };
        }
        buildSurface(t, e, n, s, i) {
          const o = this.ctx,
            r = this.minY,
            a = this.height,
            l = 16 * t,
            h = 16 * e,
            u = this.STONE,
            f = this.WATER,
            m = this.LAVA,
            d = [0, 0, 0],
            p = a >> 2,
            _ = r >> 2,
            g = (l >> 2) - 1,
            x = (h >> 2) - 1;
          this.zoom.setBox(g, _ - 1, x, 6, p + 2, 6);
          const b = new Int16Array(36 * p).fill(-1),
            quartBiome = (t, e, n) => {
              e = e < _ ? _ : e >= _ + p ? _ + p - 1 : e;
              const s = t - (l >> 2),
                o = n - (h >> 2);
              if (s >= 0 && s < 4 && o >= 0 && o < 4)
                return this.biomeList[i[4 * (4 * (e - _) + o) + s]];
              const r = 6 * (6 * (e - _) + (n - x)) + (t - g);
              let a = b[r];
              return (
                a < 0 && (b[r] = a = this.biomeIdx.get(this.biomes.at(t, e, n))),
                this.biomeList[a]
              );
            },
            biomeAt = (t, e, n) => (this.zoom.pick(t, e, n, d), quartBiome(d[0], d[1], d[2])),
            w = [
              this.prelim(l, h),
              this.prelim(l + 16, h),
              this.prelim(l, h + 16),
              this.prelim(l + 16, h + 16),
            ],
            get = (t, e, s) => n[(e << 8) | (s << 4) | t];
          ((o.stamp = 0),
            (o.biome = () => o.bc || (o.bc = biomeAt(o.x, o.y, o.z))),
            (o.steep = () => {
              const t = 15 & o.x,
                e = 15 & o.z,
                n = Math.max(e - 1, 0),
                i = Math.min(e + 1, 15);
              if (s[16 * i + t] >= s[16 * n + t] + 4) return !0;
              const r = Math.max(t - 1, 0),
                a = Math.min(t + 1, 15);
              return s[16 * e + r] >= s[16 * e + a] + 4;
            }));
          for (let t = 0; t < 16; t++)
            for (let e = 0; e < 16; e++) {
              const i = l + t,
                d = h + e,
                p = s[16 * e + t] + 1;
              ((o.x = i), (o.z = d));
              const _ = biomeAt(i, p, d);
              "eroded_badlands" === _ && this.erodedBadlands(n, t, e, i, d, p);
              const g = s[16 * e + t] + 1;
              o.surfaceDepth = Math.trunc(
                2.75 * this.nSurface.get(i, 0, d) +
                  3 +
                  0.25 * this.noiseRandom.at(i, 0, d).nextDouble(),
              );
              let x = NaN;
              o.secondary = () => (Number.isNaN(x) ? (x = this.nSecondary.get(i, 0, d)) : x);
              {
                const t = (15 & i) / 16,
                  e = (15 & d) / 16,
                  n = w[0] + t * (w[1] - w[0]),
                  s = w[2] + t * (w[3] - w[2]);
                o.ms = Math.floor(n + e * (s - n)) + o.surfaceDepth - 8;
              }
              let b = 0,
                y = -2147483648,
                v = 2147483647;
              for (let s = Math.min(g, r + a - 1); s >= r; s--) {
                const i = ((s - r) << 8) | (e << 4) | t,
                  a = n[i];
                if (0 === a) {
                  ((b = 0), (y = -2147483648));
                  continue;
                }
                if (a === f || a === m) {
                  -2147483648 === y && (y = s + 1);
                  continue;
                }
                if (v >= s) {
                  v = -32512;
                  for (let n = s - 1; n >= r - 1; n--) {
                    const s = n >= r ? get(t, n - r, e) : 0;
                    if (0 === s || s === f || s === m) {
                      v = n + 1;
                      break;
                    }
                  }
                }
                if (
                  (b++,
                  (o.stoneAbove = b),
                  (o.stoneBelow = s - v + 1),
                  (o.waterHeight = y),
                  (o.y = s),
                  o.stamp++,
                  (o.bc = null),
                  a !== u)
                )
                  continue;
                const l = this.rule();
                l >= 0 && (n[i] = l);
              }
              ("frozen_ocean" !== _ && "deep_frozen_ocean" !== _) ||
                this.frozenOcean(n, t, e, i, d, p, o.ms, _);
            }
        }
        erodedBadlands(t, e, n, s, i, o) {
          const r = Math.min(
            Math.abs(8.25 * this.nBadSurf.get(s, 0, i)),
            15 * this.nBadPillar.get(0.2 * s, 0, 0.2 * i),
          );
          if (r <= 0) return;
          const a = Math.abs(1.5 * this.nBadRoof.get(0.75 * s, 0, 0.75 * i)),
            l = Math.floor(64 + Math.min(r * r * 2.5, Math.ceil(50 * a) + 24));
          if (o > l) return;
          const h = this.minY,
            at = (t) => ((t - h) << 8) | (n << 4) | e;
          for (let e = l; e >= h; e--) {
            const n = t[at(e)];
            if (n === this.STONE) break;
            if (n === this.WATER) return;
          }
          for (let e = l; e >= h && 0 === t[at(e)]; e--) t[at(e)] = this.STONE;
        }
        frozenOcean(t, e, n, s, i, o, r, a) {
          const l = Math.min(
            Math.abs(8.25 * this.nIceSurf.get(s, 0, i)),
            15 * this.nIcePillar.get(1.28 * s, 0, 1.28 * i),
          );
          if (l <= 1.8) return;
          const h = Math.abs(1.5 * this.nIceRoof.get(1.17 * s, 0, 1.17 * i));
          let u,
            f = Math.min(l * l * 1.2, Math.ceil(40 * h) + 14);
          (biomeTemperature(this.data.biome[a], s, 63, i, this.sea) > 0.10000000149011612 &&
            (f -= 2),
            f > 2 ? ((u = this.sea - f - 7), (f += this.sea)) : ((f = 0), (u = 0)));
          const m = f,
            d = this.noiseRandom.at(s, 0, i),
            p = 2 + d.nextIntB(4),
            _ = this.sea + 18 + d.nextIntB(10),
            g = this.minY,
            at = (t) => ((t - g) << 8) | (n << 4) | e,
            x = this.P("snow_block"),
            b = this.P("packed_ice");
          let w = 0;
          for (let e = Math.max(o, Math.trunc(m) + 1); e >= r; e--) {
            if (e - g >= this.height || e < g) continue;
            const n = t[at(e)];
            if (
              (0 === n && e < Math.trunc(m) && d.nextDouble() > 0.01) ||
              (n === this.WATER &&
                e > Math.trunc(u) &&
                e < this.sea &&
                0 !== u &&
                d.nextDouble() > 0.15)
            ) {
              if (w <= p && e > _) {
                ((t[at(e)] = x), w++);
                continue;
              }
              t[at(e)] = b;
            }
          }
        }
      },
      biomeTemperature: biomeTemperature,
      coldEnoughToSnow: coldEnoughToSnow,
      PerlinSimplex: PerlinSimplex,
      infoNoise: () => (climateNoises(), n),
    });
  })(),
  !WG.data && "undefined" != typeof self && self.WG_DATA && (WG.data = self.WG_DATA),
  Object.assign(WG, {
    findSpawn: function findSpawn(t) {
      const e = WG.quantize,
        n = Math.fround,
        span = (t) => (Array.isArray(t) ? [e(t[0]), e(t[1])] : [e(t), e(t)]),
        s = (t.data.noise_settings.overworld.spawn_target || []).map((t) => [
          span(t.temperature),
          span(t.humidity),
          span(t.continentalness),
          span(t.erosion),
          span(t.depth),
          span(t.weirdness),
          span(t.offset),
        ]),
        i = t.rs.router,
        o = [i.temperature.f, i.vegetation.f, i.continents.f, i.erosion.f, i.depth.f, i.ridges.f],
        fit = (t, n) => {
          const i = (t >> 2) << 2,
            r = (n >> 2) << 2,
            a = o.map((t, n) => (4 === n ? 0 : e(t(i, 0, r))));
          a.push(0);
          let l = 1 / 0;
          for (const t of s) {
            let e = 0;
            for (let n = 0; n < 7; n++) {
              const s = a[n],
                i = t[n][0],
                o = t[n][1],
                r = s > o ? s - o : s < i ? i - s : 0;
              e += r * r;
            }
            e < l && (l = e);
          }
          return 2048 * l * 2048 + t * t + n * n;
        };
      let r = 0,
        a = 0,
        l = fit(0, 0);
      const radial = (t, e) => {
        let s = 0,
          i = n(e);
        const o = r,
          h = a;
        for (; i <= t;) {
          const t = o + Math.trunc(Math.sin(s) * i),
            u = h + Math.trunc(Math.cos(s) * i),
            f = fit(t, u);
          (f < l && ((l = f), (r = t), (a = u)),
            (s = n(s + n(e / i))),
            s > n(2 * Math.PI) && ((s = 0), (i = n(i + e))));
        }
      };
      return (radial(2048, 512), radial(512, 32), [r, a]);
    },
  }),
  (function () {
    const t = Math.fround,
      e = 16777216;
    class JRand {
      constructor(t) {
        this.setSeed(t || 0n);
      }
      setSeed(t) {
        const e = 0xffffffffffffn & (0x5deece66dn ^ BigInt.asUintN(64, BigInt(t)));
        ((this.h = Number(e >> 24n)), (this.l = Number(0xffffffn & e)));
      }
    }
    ((JRand.prototype.next = function (t) {
      const n = this.h,
        s = this.l,
        i = 15525485 * s + 11,
        o = Math.floor(i / e),
        r = i - o * e,
        a = (15525485 * n + 1502 * s + o) % e;
      return (
        (this.h = a),
        (this.l = r),
        t >= 24
          ? (a * Math.pow(2, t - 24) + Math.floor(r / Math.pow(2, 48 - t))) | 0
          : Math.floor(a / Math.pow(2, 24 - t))
      );
    }),
      (JRand.prototype.nextInt = function (t) {
        if (void 0 === t) return this.next(32);
        if ((t & -t) === t) return this.next(31) >>> (31 - Math.log2(t));
        let e, n;
        do {
          ((e = this.next(31)), (n = e % t));
        } while (e - n + (t - 1) > 2147483647);
        return n;
      }),
      (JRand.prototype.nextIntBetween = function (t, e) {
        return this.nextInt(e - t + 1) + t;
      }),
      (JRand.prototype.nextIntB = function (t) {
        return this.nextInt(t);
      }),
      (JRand.prototype.consume = function (t) {
        for (let e = 0; e < t; e++) this.next(32);
      }),
      (JRand.prototype.forkPositional = function () {
        return new LegacyFactory(this.nextLong());
      }));
    class LegacyFactory {
      constructor(t) {
        this.seed = BigInt.asIntN(64, t);
      }
      fromHashOf(t) {
        let e = 0;
        for (let n = 0; n < t.length; n++) e = (Math.imul(e, 31) + t.charCodeAt(n)) | 0;
        return new JRand(BigInt(e) ^ this.seed);
      }
      at(t, e, n) {
        let s = BigInt.asIntN(
          64,
          BigInt(Math.imul(t, 3129871)) ^ (116129781n * BigInt(n)) ^ BigInt(e),
        );
        return (
          (s = BigInt.asIntN(64, BigInt.asIntN(64, s * s * 42317861n) + 11n * s) >> 16n),
          new JRand(s ^ this.seed)
        );
      }
    }
    ((JRand.prototype.nextFloat = function () {
      return this.next(24) / 16777216;
    }),
      (JRand.prototype.nextDouble = function () {
        return 11102230246251565e-32 * (134217728 * this.next(26) + this.next(27));
      }),
      (JRand.prototype.nextBoolean = function () {
        return 0 !== this.next(1);
      }),
      (JRand.prototype.nextLong = function () {
        const t = BigInt(this.next(32)),
          e = BigInt(this.next(32));
        return BigInt.asIntN(64, (t << 32n) + e);
      }),
      (JRand.prototype.largeFeatureSeed = function (t, e, n) {
        this.setSeed(t);
        const s = this.nextLong(),
          i = this.nextLong();
        this.setSeed(
          BigInt.asIntN(64, BigInt(e) * s) ^ BigInt.asIntN(64, BigInt(n) * i) ^ BigInt(t),
        );
      }));
    const n = new Float32Array(65536);
    for (let t = 0; t < 65536; t++) n[t] = Math.sin((t * Math.PI * 2) / 65536);
    const msin = (e) => n[65535 & Math.trunc(10430.378 * t(e))],
      mcos = (e) => n[65535 & Math.trunc(10430.378 * t(e) + 16384)],
      floatProvider = (e) => {
        if ("number" == typeof e) return () => e;
        const n = e.type.replace("minecraft:", "");
        if ("uniform" === n)
          return (n) =>
            t(t(n.nextFloat() * t(e.max_exclusive - e.min_inclusive)) + e.min_inclusive);
        if ("trapezoid" === n)
          return (n) => {
            const s = t(e.max - e.min),
              i = t((s - e.plateau) / 2),
              o = t(s - i);
            return t(t(e.min + t(n.nextFloat() * o)) + t(n.nextFloat() * i));
          };
        if ("constant" === n) return () => e.value;
        if ("clamped_normal" === n) return (t) => Math.min(e.max, Math.max(e.min, e.mean + 0));
        throw new Error("float provider " + n);
      };
    Object.assign(WG, {
      JRand: JRand,
      carveChunk: function carveChunk(e, n, s, i, o) {
        const r = e.data,
          a = e.minY,
          l = e.height,
          h = 16 * n,
          u = 16 * s,
          f = e.WATER,
          m = e.LAVA;
        if (!e.carverCfg) {
          e.carverCfg = {};
          const t =
            (self.BLOCK_TAGS || {})[
              "nether" === e.dim ? "nether_carver_replaceables" : "overworld_carver_replaceables"
            ] || [];
          e.carveRepl = new Set(t.map((t) => e.pal[t]).filter((t) => void 0 !== t));
        }
        const anchor = (t) =>
            "absolute" in t
              ? t.absolute
              : "above_bottom" in t
                ? a + t.above_bottom
                : a + l - 1 - t.below_top,
          cfgOf = (t) => {
            let n = e.carverCfg[t];
            if (!n) {
              const s = r.configured_carver[t],
                i = s.config;
              ((n = e.carverCfg[t] =
                {
                  type: s.type.replace("minecraft:", ""),
                  p: i.probability,
                  lava: anchor(i.lava_level),
                  yLo: anchor(i.y.min_inclusive),
                  yHi: anchor(i.y.max_inclusive),
                  yScale: floatProvider(i.yScale || i.y_scale || 1),
                  hm: i.horizontal_radius_multiplier
                    ? floatProvider(i.horizontal_radius_multiplier)
                    : null,
                  vm: i.vertical_radius_multiplier
                    ? floatProvider(i.vertical_radius_multiplier)
                    : null,
                  floor: i.floor_level ? floatProvider(i.floor_level) : null,
                  rot: i.vertical_rotation ? floatProvider(i.vertical_rotation) : null,
                  shape: i.shape || null,
                }),
                n.shape &&
                  ((n.dist = floatProvider(n.shape.distance_factor)),
                  (n.thick = floatProvider(n.shape.thickness)),
                  (n.hrf = floatProvider(n.shape.horizontal_radius_factor))));
            }
            return n;
          },
          d = new Uint8Array(256 * l),
          p = e.pal.grass_block,
          _ = e.pal.mycelium,
          g = e.pal.dirt,
          x = h + 8,
          b = u + 8,
          ellipsoid = (t, n, s, r, w, y, v) => {
            const M = 16 + 2 * w;
            if (Math.abs(n - x) > M || Math.abs(r - b) > M) return;
            const I = Math.max(Math.floor(n - w) - h - 1, 0),
              B = Math.min(Math.floor(n + w) - h, 15),
              N = Math.max(Math.floor(s - y) - 1, a + 1),
              A = Math.min(Math.floor(s + y) + 1, a + l - 1 - 7),
              F = Math.max(Math.floor(r - w) - u - 1, 0),
              S = Math.min(Math.floor(r + w) - u, 15);
            for (let l = I; l <= B; l++) {
              const x = (h + l + 0.5 - n) / w;
              for (let n = F; n <= S; n++) {
                const b = (u + n + 0.5 - r) / w;
                if (x * x + b * b >= 1) continue;
                let M = !1;
                for (let r = A; r > N; r--) {
                  if (v(x, (r - 0.5 - s) / y, b, r)) continue;
                  const w = r - a,
                    I = (w << 8) | (n << 4) | l;
                  if (d[I]) continue;
                  d[I] = 1;
                  const B = i[I];
                  if (((B !== p && B !== _) || (M = !0), !e.carveRepl.has(B))) continue;
                  let N;
                  if ("nether_cave" === t.type) N = r <= a + 31 ? m : 0;
                  else if (r <= t.lava) N = m;
                  else {
                    const t = o.compute(h + l, r, u + n, 0);
                    if (t === WG.SUB.NONE) continue;
                    N = t === WG.SUB.WATER ? f : t === WG.SUB.LAVA ? m : 0;
                  }
                  if (((i[I] = N), M && w > 0)) {
                    const t = ((w - 1) << 8) | (n << 4) | l;
                    i[t] === g && 0 === N && (i[t] = p);
                  }
                }
              }
            }
          },
          w = e.carveCache || (e.carveCache = new Map());
        for (let t = -8; t <= 8; t++)
          for (let e = -8; e <= 8; e++) {
            const i = n + t,
              o = s + e,
              r = 65536 * i + o;
            let a = w.get(r);
            a || ((a = sourceEllipsoids(i, o)), w.size > 3e4 && w.clear(), w.set(r, a));
            for (const t of a) {
              const e = 16 + 2 * t.g;
              Math.abs(t.d - x) > e ||
                Math.abs(t.f - b) > e ||
                ellipsoid(t.c, t.d, t.e, t.f, t.g, t.h, t.skip);
            }
          }
        function sourceEllipsoids(n, s) {
          const i = [],
            o = new JRand(0n),
            a = e.rs.seed,
            l = e.biomes.at(4 * n, 0, 4 * s),
            h = (r.biome[l] && r.biome[l].carvers) || [];
          let u = 0;
          for (const e of [].concat(h)) {
            const r = cfgOf(e.replace("minecraft:", ""));
            if ((o.largeFeatureSeed(a + BigInt(u), n, s), u++, !(o.nextFloat() <= t(r.p))))
              continue;
            const add = (t, e, n, s, o, a) =>
              i.push({ c: r, d: t, e: e, f: n, g: s, h: o, skip: a });
            "cave" === r.type || "nether_cave" === r.type
              ? carveCave(r, o, n, s, add)
              : "canyon" === r.type && carveCanyon(r, o, n, s, add);
          }
          return i;
        }
        function carveCave(e, n, s, i, o) {
          const r = "nether_cave" === e.type,
            a = n.nextInt(n.nextInt(n.nextInt(r ? 10 : 15) + 1) + 1);
          for (let l = 0; l < a; l++) {
            const a = 16 * s + n.nextInt(16),
              l = n.nextIntBetween(e.yLo, e.yHi),
              h = 16 * i + n.nextInt(16),
              u = e.hm(n),
              f = e.vm(n),
              m = e.floor(n),
              skip = (t, e, n) => e <= m || t * t + e * e + n * n >= 1;
            let d = 1;
            if (0 === n.nextInt(4)) {
              const s = e.yScale(n),
                i = t(1 + t(6 * n.nextFloat())),
                r = 1.5 + t(msin(1.5707964) * i);
              (o(a + 1, l, h, r, r * s, skip), (d += n.nextInt(4)));
            }
            for (let e = 0; e < d; e++) {
              const e = t(n.nextFloat() * t(2 * Math.PI)),
                s = t(t(n.nextFloat() - 0.5) / 4);
              let i = t(t(2 * n.nextFloat()) + n.nextFloat());
              r
                ? (i = t(2 * i))
                : 0 === n.nextInt(10) &&
                  (i = t(i * t(t(3 * t(n.nextFloat() * n.nextFloat())) + 1)));
              const m = 112 - n.nextInt(28);
              tunnel(n.nextLong(), a, l, h, u, f, i, e, s, 0, m, r ? 5 : 1, skip, o);
            }
          }
        }
        function tunnel(e, n, s, i, o, r, a, l, h, u, f, m, d, p) {
          const _ = new JRand(e),
            g = _.nextInt((f / 2) | 0) + ((f / 4) | 0),
            x = 0 === _.nextInt(6);
          let b = 0,
            w = 0;
          for (let e = u; e < f; e++) {
            const u = 1.5 + t(msin(t(t(t(Math.PI) * e) / f)) * a),
              y = u * m,
              v = mcos(h);
            if (
              ((n += t(mcos(l) * v)),
              (s += msin(h)),
              (i += t(msin(l) * v)),
              (h = t(h * (x ? 0.92 : 0.7))),
              (h = t(h + t(0.1 * w))),
              (l = t(l + t(0.1 * b))),
              (w = t(0.9 * w)),
              (b = t(0.75 * b)),
              (w = t(w + t(2 * t(t(_.nextFloat() - _.nextFloat()) * _.nextFloat())))),
              (b = t(b + t(4 * t(t(_.nextFloat() - _.nextFloat()) * _.nextFloat())))),
              e === g && a > 1)
            )
              return (
                tunnel(
                  _.nextLong(),
                  n,
                  s,
                  i,
                  o,
                  r,
                  t(t(0.5 * _.nextFloat()) + 0.5),
                  t(l - 1.5707964),
                  t(h / 3),
                  e,
                  f,
                  1,
                  d,
                  p,
                ),
                void tunnel(
                  _.nextLong(),
                  n,
                  s,
                  i,
                  o,
                  r,
                  t(t(0.5 * _.nextFloat()) + 0.5),
                  t(l + 1.5707964),
                  t(h / 3),
                  e,
                  f,
                  1,
                  d,
                  p,
                )
              );
            0 !== _.nextInt(4) && p(n, s, i, u * o, y * r, d);
          }
        }
        function carveCanyon(e, n, s, i, o) {
          const r = 16 * s + n.nextInt(16),
            h = n.nextIntBetween(e.yLo, e.yHi),
            u = 16 * i + n.nextInt(16),
            f = t(n.nextFloat() * t(2 * Math.PI)),
            m = e.rot(n),
            d = e.yScale(n),
            p = e.thick(n),
            _ = Math.trunc(t(112 * e.dist(n))),
            g = new JRand(n.nextLong()),
            x = e.shape,
            b = new Float32Array(l);
          let w = 1;
          for (let e = 0; e < l; e++)
            ((0 !== e && 0 !== g.nextInt(x.width_smoothness)) ||
              (w = t(1 + t(g.nextFloat() * g.nextFloat()))),
              (b[e] = t(w * w)));
          const skip = (t, e, n, s) => (t * t + n * n) * b[s - a - 1] + (e * e) / 6 >= 1;
          let y = r,
            v = h,
            M = u,
            I = f,
            B = m,
            N = 0,
            A = 0;
          for (let n = 0; n < _; n++) {
            let s = 1.5 + t(msin(t(t(n * t(Math.PI)) / _)) * p),
              i = s * d;
            s *= e.hrf(g);
            const r = t(1 - t(2 * Math.abs(t(0.5 - t(n / _)))));
            i =
              t(x.vertical_radius_default_factor + t(x.vertical_radius_center_factor * r)) *
              i *
              t(t(0.25 * g.nextFloat()) + 0.75);
            const a = mcos(B),
              l = msin(B);
            ((y += t(mcos(I) * a)),
              (v += l),
              (M += t(msin(I) * a)),
              (B = t(0.7 * B)),
              (B = t(B + t(0.05 * A))),
              (I = t(I + t(0.05 * N))),
              (A = t(0.8 * A)),
              (N = t(0.5 * N)),
              (A = t(A + t(2 * t(t(g.nextFloat() - g.nextFloat()) * g.nextFloat())))),
              (N = t(N + t(4 * t(t(g.nextFloat() - g.nextFloat()) * g.nextFloat())))),
              0 !== g.nextInt(4) && o(y, v, M, s, i, skip));
          }
        }
      },
    });
  })());
//# sourceURL=js/worldgen.js
