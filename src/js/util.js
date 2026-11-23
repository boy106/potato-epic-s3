"use strict";
const CHUNK = 16,
  MAX_BLOCKS = 8192;
let HEIGHT = 256,
  SECTIONS = 16,
  SEA = 62,
  MIN_Y = 0,
  ALL_SECTIONS = 65535;
function setWorldFormat(t) {
  (t >= 2
    ? ((HEIGHT = 384), (SEA = 126), (MIN_Y = -64))
    : ((HEIGHT = 256), (SEA = 62), (MIN_Y = 0)),
    (SECTIONS = HEIGHT / 16),
    (ALL_SECTIONS = 2 ** SECTIONS - 1));
}
function clamp(t, r, n) {
  return t < r ? r : t > n ? n : t;
}
function lerp(t, r, n) {
  return t + (r - t) * n;
}
function smoothstep(t, r, n) {
  const o = clamp((n - t) / (r - t), 0, 1);
  return o * o * (3 - 2 * o);
}
function mod(t, r) {
  return ((t % r) + r) % r;
}
function hash3(t, r, n, o) {
  let e =
    (0 | o) ^
    Math.imul(0 | t, 374761393) ^
    Math.imul(0 | r, 668265263) ^
    Math.imul(0 | n, 2147483647);
  return ((e = Math.imul(e ^ (e >>> 13), 1274126177)), (e ^= e >>> 16), (e >>> 0) / 4294967296);
}
function hashStr(t) {
  let r = 2166136261;
  for (let n = 0; n < t.length; n++) ((r ^= t.charCodeAt(n)), (r = Math.imul(r, 16777619)));
  return 0 | r;
}
function RNG(t) {
  let r = 0 | t;
  const f = function () {
    r = (r + 1831565813) | 0;
    let t = Math.imul(r ^ (r >>> 15), 1 | r);
    return (
      (t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t),
      ((t ^ (t >>> 14)) >>> 0) / 4294967296
    );
  };
  return ((f.int = (t) => Math.floor(f() * t)), (f.range = (t, r) => t + f() * (r - t)), f);
}
class Noise {
  constructor(t) {
    const r = RNG(t),
      n = new Uint8Array(256);
    for (let t = 0; t < 256; t++) n[t] = t;
    for (let t = 255; t > 0; t--) {
      const o = Math.floor(r() * (t + 1)),
        e = n[t];
      ((n[t] = n[o]), (n[o] = e));
    }
    ((this.perm = new Uint8Array(512)), (this.perm12 = new Uint8Array(512)));
    for (let t = 0; t < 512; t++)
      ((this.perm[t] = n[255 & t]), (this.perm12[t] = this.perm[t] % 12));
  }
  n2(t, r) {
    const n = this.perm,
      o = this.perm12,
      e = Noise.grad3,
      s = 0.21132486540518713,
      l = 0.3660254037844386 * (t + r),
      c = Math.floor(t + l),
      i = Math.floor(r + l),
      a = (c + i) * s,
      u = t - (c - a),
      h = r - (i - a);
    let M, m;
    u > h ? ((M = 1), (m = 0)) : ((M = 0), (m = 1));
    const p = u - M + s,
      S = h - m + s,
      A = u - 1 + 2 * s,
      N = h - 1 + 2 * s,
      I = 255 & c,
      E = 255 & i;
    let y = 0,
      d = 0,
      H = 0,
      T = 0.5 - u * u - h * h;
    if (T > 0) {
      const t = 3 * o[I + n[E]];
      ((T *= T), (y = T * T * (e[t] * u + e[t + 1] * h)));
    }
    let g = 0.5 - p * p - S * S;
    if (g > 0) {
      const t = 3 * o[I + M + n[E + m]];
      ((g *= g), (d = g * g * (e[t] * p + e[t + 1] * S)));
    }
    let w = 0.5 - A * A - N * N;
    if (w > 0) {
      const t = 3 * o[I + 1 + n[E + 1]];
      ((w *= w), (H = w * w * (e[t] * A + e[t + 1] * N)));
    }
    return 70 * (y + d + H);
  }
  n3(t, r, n) {
    const o = this.perm,
      e = this.perm12,
      s = Noise.grad3,
      l = 1 / 6,
      c = (t + r + n) * (1 / 3),
      i = Math.floor(t + c),
      a = Math.floor(r + c),
      u = Math.floor(n + c),
      h = (i + a + u) * l,
      M = t - (i - h),
      m = r - (a - h),
      p = n - (u - h);
    let S, A, N, I, E, y;
    M >= m
      ? m >= p
        ? ((S = 1), (A = 0), (N = 0), (I = 1), (E = 1), (y = 0))
        : M >= p
          ? ((S = 1), (A = 0), (N = 0), (I = 1), (E = 0), (y = 1))
          : ((S = 0), (A = 0), (N = 1), (I = 1), (E = 0), (y = 1))
      : m < p
        ? ((S = 0), (A = 0), (N = 1), (I = 0), (E = 1), (y = 1))
        : M < p
          ? ((S = 0), (A = 1), (N = 0), (I = 0), (E = 1), (y = 1))
          : ((S = 0), (A = 1), (N = 0), (I = 1), (E = 1), (y = 0));
    const d = M - S + l,
      H = m - A + l,
      T = p - N + l,
      g = M - I + 2 * l,
      w = m - E + 2 * l,
      C = p - y + 2 * l,
      O = M - 1 + 0.5,
      F = m - 1 + 0.5,
      G = p - 1 + 0.5,
      _ = 255 & i,
      L = 255 & a,
      U = 255 & u;
    let b,
      Y,
      P = 0;
    return (
      (b = 0.6 - M * M - m * m - p * p),
      b > 0 &&
        ((Y = 3 * e[_ + o[L + o[U]]]),
        (b *= b),
        (P += b * b * (s[Y] * M + s[Y + 1] * m + s[Y + 2] * p))),
      (b = 0.6 - d * d - H * H - T * T),
      b > 0 &&
        ((Y = 3 * e[_ + S + o[L + A + o[U + N]]]),
        (b *= b),
        (P += b * b * (s[Y] * d + s[Y + 1] * H + s[Y + 2] * T))),
      (b = 0.6 - g * g - w * w - C * C),
      b > 0 &&
        ((Y = 3 * e[_ + I + o[L + E + o[U + y]]]),
        (b *= b),
        (P += b * b * (s[Y] * g + s[Y + 1] * w + s[Y + 2] * C))),
      (b = 0.6 - O * O - F * F - G * G),
      b > 0 &&
        ((Y = 3 * e[_ + 1 + o[L + 1 + o[U + 1]]]),
        (b *= b),
        (P += b * b * (s[Y] * O + s[Y + 1] * F + s[Y + 2] * G))),
      32 * P
    );
  }
  fbm2(t, r, n, o = 2, e = 0.5) {
    let s = 0,
      l = 1,
      c = 1,
      i = 0;
    for (let a = 0; a < n; a++) ((s += l * this.n2(t * c, r * c)), (i += l), (l *= e), (c *= o));
    return s / i;
  }
  fbm3(t, r, n, o) {
    let e = 0,
      s = 1,
      l = 1,
      c = 0;
    for (let i = 0; i < o; i++)
      ((e += s * this.n3(t * l, r * l, n * l)), (c += s), (s *= 0.5), (l *= 2));
    return e / c;
  }
}
Noise.grad3 = new Float32Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1,
  0, 1, -1, 0, -1, -1,
]);
const M4 = {
  create() {
    const t = new Float32Array(16);
    return ((t[0] = t[5] = t[10] = t[15] = 1), t);
  },
  identity: (t) => (t.fill(0), (t[0] = t[5] = t[10] = t[15] = 1), t),
  perspective(t, r, n, o, e) {
    const s = 1 / Math.tan(r / 2),
      l = 1 / (o - e);
    return (
      t.fill(0),
      (t[0] = s / n),
      (t[5] = s),
      (t[10] = (e + o) * l),
      (t[11] = -1),
      (t[14] = 2 * e * o * l),
      t
    );
  },
  ortho: (t, r, n, o, e, s, l) => (
    t.fill(0),
    (t[0] = 2 / (n - r)),
    (t[5] = 2 / (e - o)),
    (t[10] = -2 / (l - s)),
    (t[12] = -(n + r) / (n - r)),
    (t[13] = -(e + o) / (e - o)),
    (t[14] = -(l + s) / (l - s)),
    (t[15] = 1),
    t
  ),
  mul(t, r, n) {
    const o = new Float32Array(16);
    for (let t = 0; t < 4; t++)
      for (let e = 0; e < 4; e++)
        o[4 * e + t] =
          r[t] * n[4 * e] +
          r[4 + t] * n[4 * e + 1] +
          r[8 + t] * n[4 * e + 2] +
          r[12 + t] * n[4 * e + 3];
    return (t.set(o), t);
  },
  translate: (t, r, n, o) => (
    (t[12] += t[0] * r + t[4] * n + t[8] * o),
    (t[13] += t[1] * r + t[5] * n + t[9] * o),
    (t[14] += t[2] * r + t[6] * n + t[10] * o),
    (t[15] += t[3] * r + t[7] * n + t[11] * o),
    t
  ),
  scale(t, r, n, o) {
    for (let e = 0; e < 4; e++) ((t[e] *= r), (t[4 + e] *= n), (t[8 + e] *= o));
    return t;
  },
  rotX(t, r) {
    const n = Math.cos(r),
      o = Math.sin(r);
    for (let r = 0; r < 4; r++) {
      const e = t[4 + r],
        s = t[8 + r];
      ((t[4 + r] = e * n + s * o), (t[8 + r] = s * n - e * o));
    }
    return t;
  },
  rotY(t, r) {
    const n = Math.cos(r),
      o = Math.sin(r);
    for (let r = 0; r < 4; r++) {
      const e = t[r],
        s = t[8 + r];
      ((t[r] = e * n - s * o), (t[8 + r] = e * o + s * n));
    }
    return t;
  },
  rotZ(t, r) {
    const n = Math.cos(r),
      o = Math.sin(r);
    for (let r = 0; r < 4; r++) {
      const e = t[r],
        s = t[4 + r];
      ((t[r] = e * n + s * o), (t[4 + r] = s * n - e * o));
    }
    return t;
  },
  copy: (t) => new Float32Array(t),
};
function frustumPlanes(t) {
  const r = [],
    n = [
      [t[3] + t[0], t[7] + t[4], t[11] + t[8], t[15] + t[12]],
      [t[3] - t[0], t[7] - t[4], t[11] - t[8], t[15] - t[12]],
      [t[3] + t[1], t[7] + t[5], t[11] + t[9], t[15] + t[13]],
      [t[3] - t[1], t[7] - t[5], t[11] - t[9], t[15] - t[13]],
      [t[3] + t[2], t[7] + t[6], t[11] + t[10], t[15] + t[14]],
      [t[3] - t[2], t[7] - t[6], t[11] - t[10], t[15] - t[14]],
    ];
  for (const t of n) {
    const n = Math.hypot(t[0], t[1], t[2]);
    r.push([t[0] / n, t[1] / n, t[2] / n, t[3] / n]);
  }
  return r;
}
function aabbInFrustum(t, r, n, o, e, s, l) {
  for (const c of t) {
    const t = c[0] > 0 ? e : r,
      i = c[1] > 0 ? s : n,
      a = c[2] > 0 ? l : o;
    if (c[0] * t + c[1] * i + c[2] * a + c[3] < 0) return !1;
  }
  return !0;
}
const DIRS = [
    [-1, 0, 0],
    [1, 0, 0],
    [0, -1, 0],
    [0, 1, 0],
    [0, 0, -1],
    [0, 0, 1],
  ],
  OPP = [1, 0, 3, 2, 5, 4];
function rleEncode(t) {
  const r = [];
  let n = 0;
  for (; n < t.length;) {
    const o = t[n];
    let e = 1;
    for (; n + e < t.length && t[n + e] === o && e < 65535;) e++;
    (r.push(o, e), (n += e));
  }
  return r;
}
function rleDecode(t, r) {
  const n = new Uint16Array(r);
  let o = 0;
  for (let r = 0; r < t.length; r += 2) (n.fill(t[r], o, o + t[r + 1]), (o += t[r + 1]));
  return n;
}
//# sourceURL=js/util.js
