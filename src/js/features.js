"use strict";
const Features = (() => {
  const t = self.WG_DATA,
    e = self.BLOCK_TAGS || {},
    strip = (t) => ("string" == typeof t ? t.replace("minecraft:", "") : t);
  class WRand {
    constructor() {
      ((this.x = null), (this.haveGauss = !1));
    }
    setSeed(t) {
      ((this.x = WG.Xoroshiro.fromSeed(BigInt.asIntN(64, BigInt(t)))), (this.haveGauss = !1));
    }
    next(t) {
      this.x.nextLong();
      const e = WG.getR()[0];
      return 32 === t ? 0 | e : e >>> (32 - t);
    }
    nextInt(t) {
      if (void 0 === t) return this.next(32);
      if (t <= 0) throw new Error("bound must be positive");
      if ((t & -t) === t) return this.next(31) >>> (31 - Math.log2(t));
      let e, n;
      do {
        ((e = this.next(31)), (n = e % t));
      } while (e - n + (t - 1) > 2147483647);
      return n;
    }
    nextIntBetween(t, e) {
      return this.nextInt(e - t + 1) + t;
    }
    nextLong() {
      const t = BigInt(this.next(32)),
        e = BigInt(this.next(32));
      return BigInt.asIntN(64, (t << 32n) + e);
    }
    nextBoolean() {
      return 0 !== this.next(1);
    }
    nextFloat() {
      return 5.9604645e-8 * this.next(24);
    }
    nextDouble() {
      return 11102230246251565e-32 * (134217728 * this.next(26) + this.next(27));
    }
    nextGaussian() {
      if (this.haveGauss) return ((this.haveGauss = !1), this.gauss);
      let t, e, n;
      do {
        ((t = 2 * this.nextDouble() - 1), (e = 2 * this.nextDouble() - 1), (n = t * t + e * e));
      } while (n >= 1 || 0 === n);
      const r = Math.sqrt((-2 * Math.log(n)) / n);
      return ((this.gauss = e * r), (this.haveGauss = !0), t * r);
    }
    decorationSeed(t, e, n) {
      this.setSeed(t);
      const r = 1n | this.nextLong(),
        o = 1n | this.nextLong(),
        s = BigInt.asIntN(64, BigInt.asIntN(64, BigInt(e) * r + BigInt(n) * o) ^ BigInt(t));
      return (this.setSeed(s), s);
    }
  }
  const n = new Float32Array(65536);
  for (let t = 0; t < 65536; t++) n[t] = Math.sin((t * Math.PI * 2) / 65536);
  const msin = (t) => n[65535 & Math.trunc(10430.378 * Math.fround(t))],
    mcos = (t) => n[65535 & Math.trunc(10430.378 * Math.fround(t) + 16384)],
    r = new Map();
  function stateOf(t) {
    "string" == typeof t && (t = { Name: t });
    const e = JSON.stringify(t);
    let n = r.get(e);
    if (void 0 !== n) return n;
    const o = strip(t.Name),
      s = t.Properties || {};
    let a = "air" === o || "cave_air" === o || "void_air" === o ? 0 : BID[o];
    if (("water" === o && (a = WATER), "lava" === o && (a = LAVA), void 0 === a))
      return (r.set(e, null), null);
    const i = BLOCKS[a];
    let c = 0;
    if (i && i.states) {
      let t = 0,
        e = -1;
      (i.states.forEach((n, r) => {
        let o = 0;
        for (const t in s) n[t] === String(s[t]) ? o++ : t in n && (o -= 10);
        o > e && ((e = o), (t = r));
      }),
        (c = t));
    } else
      i && i.axis && s.axis
        ? (c = { y: 0, x: 1, z: 2 }[s.axis])
        : "snow" === o && s.layers && (c = 0);
    return ((n = [a, c]), r.set(e, n), n);
  }
  const propOf = (t, e, n) => {
    const r = BLOCKS[t];
    return r && r.states && r.states[e] ? r.states[e][n] : void 0;
  };
  function withProp(t, e, n, r) {
    const o = BLOCKS[t];
    if (!o || !o.states) return e;
    const s = Object.assign({}, o.states[e] || {}, { [n]: String(r) }),
      a = o.states.findIndex((t) => Object.keys(s).every((e) => !(e in t) || t[e] === s[e]));
    return a < 0 ? e : a;
  }
  const o = new Map();
  function tagSet(t) {
    t = strip(t).replace(/^#/, "");
    let n = o.get(t);
    if (!n) {
      n = new Set();
      for (const r of e[t] || []) {
        const t =
          "air" === r || "cave_air" === r || "void_air" === r
            ? 0
            : "water" === r
              ? WATER
              : "lava" === r
                ? LAVA
                : BID[r];
        void 0 !== t && n.add(t);
      }
      o.set(t, n);
    }
    return n;
  }
  const blockSet = (t) =>
    new Set(
      []
        .concat(t)
        .map((t) =>
          (t = strip(t)).startsWith("#")
            ? [...tagSet(t)]
            : "air" === t
              ? 0
              : "water" === t
                ? WATER
                : "lava" === t
                  ? LAVA
                  : BID[t],
        )
        .flat()
        .filter((t) => void 0 !== t),
    );
  class Region {
    constructor(t, e, n) {
      ((this.w = t),
        (this.cx = e),
        (this.cz = n),
        (this.minY = t.minY || 0),
        (this.maxY = this.minY + HEIGHT),
        (this.ch = new Array(9)));
      for (let r = -1; r <= 1; r++)
        for (let o = -1; o <= 1; o++)
          this.ch[3 * (o + 1) + r + 1] =
            t.proto.get(ckey(e + r, n + o)) || t.chunks.get(ckey(e + r, n + o)) || null;
      ((this.hm = {}), (this.spill = null));
    }
    col(t, e) {
      return (
        ((3 * ((e >> 4) - this.cz + 1) + (t >> 4) - this.cx + 1) << 8) | ((15 & e) << 4) | (15 & t)
      );
    }
    chunk(t, e) {
      const n = (t >> 4) - this.cx + 1,
        r = (e >> 4) - this.cz + 1;
      return n < 0 || n > 2 || r < 0 || r > 2 ? null : this.ch[3 * r + n];
    }
    id(t, e, n) {
      if (e < this.minY || e >= this.maxY) return 0;
      const r = this.chunk(t, n);
      return r ? r.getB(((e - this.minY) << 8) | ((15 & n) << 4) | (15 & t)) : 0;
    }
    meta(t, e, n) {
      const r = this.chunk(t, n);
      return r && e >= this.minY && e < this.maxY
        ? r.getM(((e - this.minY) << 8) | ((15 & n) << 4) | (15 & t))
        : 0;
    }
    canWrite(t, e, n) {
      const r = this.chunk(t, n);
      return e >= this.minY && e < this.maxY && !!r && !r.final;
    }
    set(t, e, n, r, o = 0) {
      if (e < this.minY || e >= this.maxY) return !1;
      const a = this.chunk(t, n);
      if (!a || a.final) return !1;
      const i = ((e - this.minY) << 8) | ((15 & n) << 4) | (15 & t);
      if (
        (canWaterlog(r, o) &&
        ((a.getB(i) === WATER && 0 === a.getM(i)) || (a.getB(i) === r && a.wl && a.wl.has(i)))
          ? (a.wl || (a.wl = new Set())).add(i)
          : a.wl && a.wl.delete(i),
        a.setB(i, r),
        a.setM(i, o),
        this.spill)
      ) {
        let t = this.spill.get(a);
        (t || this.spill.set(a, (t = new Set())), t.add(i));
      }
      for (const o in this.hm) {
        const a = this.hm[o],
          i = this.col(t, n),
          c = a[i];
        c !== s &&
          (matchesHeightmap(o, r) ? e + 1 > c && (a[i] = e + 1) : e + 1 === c && (a[i] = s));
      }
      return !0;
    }
    setState(t, e, n, r) {
      return !!r && this.set(t, e, n, r[0], r[1]);
    }
    isAir(t, e, n) {
      return 0 === this.id(t, e, n);
    }
    height(t, e, n) {
      const r = this.chunk(e, n);
      if (!r) return this.minY;
      const o = this.hm[t] || (this.hm[t] = new Int32Array(2304).fill(s)),
        a = this.col(e, n);
      if (o[a] !== s) return o[a];
      const i = ((15 & n) << 4) | (15 & e);
      let c = this.minY;
      for (let e = SECTIONS - 1; e >= 0 && c === this.minY; e--) {
        const n = r.bs[e];
        if (!n) continue;
        const o = n.p,
          s = n.d;
        for (let n = 15; n >= 0; n--) {
          const r = o[s[(n << 8) | i]];
          if (r && matchesHeightmap(t, r)) {
            c = (e << 4) + n + this.minY + 1;
            break;
          }
        }
      }
      return (o[a] = c);
    }
  }
  const s = -2147483647;
  function matchesHeightmap(t, e) {
    const n = BLOCKS[e];
    switch (t) {
      case "WORLD_SURFACE_WG":
      case "WORLD_SURFACE":
        return !0;
      case "OCEAN_FLOOR_WG":
      case "OCEAN_FLOOR":
        return !!n && n.solid && !IS_FLUID[e];
      case "MOTION_BLOCKING":
        return !!n && (n.solid || IS_FLUID[e]);
      case "MOTION_BLOCKING_NO_LEAVES":
        return !!n && (n.solid || IS_FLUID[e]) && !a.has(e);
    }
    return !0;
  }
  let a = null,
    i = null,
    c = null,
    l = null;
  function initTags() {
    ((a = tagSet("leaves")),
      (i = tagSet("logs")),
      (c = tagSet("substrate_overworld")),
      (l = tagSet("replaceable_by_trees")),
      (_ = new Set()));
    for (let t = 0; t < MAX_BLOCKS; t++) WLOG[t] && _.add(t);
  }
  const unwrapProv = (t) =>
    t && "object" == typeof t && t.value && "object" == typeof t.value && !Array.isArray(t.value)
      ? Object.assign({ type: t.type }, t.value)
      : t;
  function intProvider(t) {
    if ("number" == typeof t) return () => t;
    t = unwrapProv(t);
    const e = strip(t.type);
    switch (e) {
      case "constant":
        return () => t.value;
      case "uniform":
        return (e) => e.nextIntBetween(t.min_inclusive, t.max_inclusive);
      case "biased_to_bottom":
        return (e) =>
          t.min_inclusive + e.nextInt(e.nextInt(t.max_inclusive - t.min_inclusive + 1) + 1);
      case "clamped": {
        const e = intProvider(t.source);
        return (n) => clamp(e(n), t.min_inclusive, t.max_inclusive);
      }
      case "clamped_normal":
        return (e) =>
          Math.trunc(
            clamp(t.mean + e.nextGaussian() * t.deviation, t.min_inclusive, t.max_inclusive),
          );
      case "trapezoid":
        return (e) => {
          const n = t.max - t.min,
            r = t.plateau || 0;
          if (r >= n) return e.nextIntBetween(t.min, t.max);
          const o = (n - r) >> 1,
            s = n - o;
          return t.min + e.nextIntBetween(0, s) + e.nextIntBetween(0, o);
        };
      case "weighted_list": {
        const e = t.distribution.map((t) => [intProvider(t.data), t.weight]),
          n = e.reduce((t, e) => t + e[1], 0);
        return (t) => {
          let r = t.nextInt(n);
          for (const [n, o] of e) if (((r -= o), r < 0)) return n(t);
          return e[0][0](t);
        };
      }
    }
    if (void 0 !== t.min_inclusive && void 0 !== t.max_inclusive)
      return (e) => e.nextIntBetween(t.min_inclusive, t.max_inclusive);
    throw new Error("int provider " + e);
  }
  const u = { minY: -64, height: 384 },
    anchor = (t) =>
      "absolute" in t
        ? t.absolute
        : "above_bottom" in t
          ? u.minY + t.above_bottom
          : u.minY + u.height - 1 - t.below_top;
  class LegacyFactory {
    constructor(t) {
      this.seed = t;
    }
    fromHashOf(t) {
      return new WG.JavaRandom(
        BigInt(
          ((t) => {
            let e = 0;
            for (let n = 0; n < t.length; n++) e = (Math.imul(e, 31) + t.charCodeAt(n)) | 0;
            return e;
          })(t),
        ) ^ this.seed,
      );
    }
  }
  function legacyNormalNoise(t, e) {
    const n = new WG.JavaRandom(BigInt(t));
    return (
      (n.forkPositional = function () {
        return new LegacyFactory(this.nextLong());
      }),
      new WG.NormalNoise(n, e)
    );
  }
  const f = new Map(),
    legacyNoise = (t, e) => {
      const n = t + JSON.stringify(e);
      let r = f.get(n);
      return (r || ((r = legacyNormalNoise(t, e)), f.set(n, r)), r);
    },
    pickByNoise = (t, e) => t[Math.trunc(clamp((1 + e) / 2, 0, 0.9999) * t.length)];
  function provider(t) {
    const e = strip(t.type);
    switch (e) {
      case "simple_state_provider": {
        const e = stateOf(t.state);
        return () => e;
      }
      case "rotated_block_provider": {
        const e = stateOf(t.state);
        return (t) => {
          const n = ["x", "y", "z"][t.nextInt(3)];
          return e && BLOCKS[e[0]].axis ? [e[0], { y: 0, x: 1, z: 2 }[n]] : e;
        };
      }
      case "weighted_state_provider": {
        const e = t.entries.map((t) => [stateOf(t.data), t.weight]),
          n = e.reduce((t, e) => t + e[1], 0);
        return (t) => {
          let r = t.nextInt(n);
          for (const [t, n] of e) if (((r -= n), r < 0)) return t;
          return e[0][0];
        };
      }
      case "randomized_int_state_provider": {
        const e = provider(t.source),
          n = intProvider(t.values);
        return (r, o, s, a, i) => {
          const c = e(r, o, s, a, i);
          return c ? [c[0], withProp(c[0], c[1], t.property, n(r))] : c;
        };
      }
      case "rule_based_state_provider": {
        const e = t.rules.map((t) => [predicate(t.if_true), provider(t.then)]),
          n = t.fallback ? provider(t.fallback) : null;
        return (t, r, o, s, a) => {
          for (const [n, i] of e) if (n(a, r, o, s)) return i(t, r, o, s, a);
          return n ? n(t, r, o, s, a) : null;
        };
      }
      case "noise_provider": {
        const e = legacyNoise(t.seed, t.noise),
          n = t.scale,
          r = t.states.map(stateOf);
        return (t, o, s, a) => pickByNoise(r, e.get(o * n, s * n, a * n));
      }
      case "noise_threshold_provider": {
        const e = legacyNoise(t.seed, t.noise),
          n = t.scale,
          r = t.low_states.map(stateOf),
          o = t.high_states.map(stateOf),
          s = stateOf(t.default_state);
        return (a, i, c, l) =>
          e.get(i * n, c * n, l * n) < t.threshold
            ? r[a.nextInt(r.length)]
            : a.nextFloat() < t.high_chance
              ? o[a.nextInt(o.length)]
              : s;
      }
      case "dual_noise_provider": {
        const e = legacyNoise(t.seed, t.noise),
          n = legacyNoise(t.seed, t.slow_noise),
          r = t.scale,
          o = t.slow_scale,
          s = t.states.map(stateOf),
          a = Array.isArray(t.variety)
            ? t.variety
            : [t.variety.min_inclusive ?? t.variety, t.variety.max_inclusive ?? t.variety];
        return (t, i, c, l) => {
          const slow = (t, e, r) => n.get(t * o, e * o, r * o),
            u = Math.trunc(WG.clampedMap(slow(i, c, l), -1, 1, a[0], a[1] + 1)),
            f = [];
          for (let t = 0; t < u; t++) f.push(pickByNoise(s, slow(i + 54545 * t, c, l + 34234 * t)));
          return pickByNoise(f, e.get(i * r, c * r, l * r));
        };
      }
    }
    throw new Error("state provider " + e);
  }
  function predicate(t) {
    const e = strip(t.type),
      n = t.offset || [0, 0, 0],
      r = n[0],
      o = n[1],
      s = n[2];
    switch (e) {
      case "true":
      case "unobstructed":
        return () => !0;
      case "not": {
        const e = predicate(t.predicate);
        return (t, n, r, o) => !e(t, n, r, o);
      }
      case "any_of": {
        const e = t.predicates.map(predicate);
        return (t, n, r, o) => e.some((e) => e(t, n, r, o));
      }
      case "all_of": {
        const e = t.predicates.map(predicate);
        return (t, n, r, o) => e.every((e) => e(t, n, r, o));
      }
      case "matching_blocks": {
        const e = blockSet(t.blocks);
        return (t, n, a, i) => e.has(t.id(n + r, a + o, i + s));
      }
      case "matching_block_tag": {
        const e = tagSet(t.tag);
        return (t, n, a, i) => e.has(t.id(n + r, a + o, i + s));
      }
      case "matching_fluids": {
        const e = [].concat(t.fluids).map(strip),
          ok = (t) =>
            (t === WATER && e.some((t) => t.includes("water"))) ||
            (t === LAVA && e.some((t) => t.includes("lava"))) ||
            (_.has(t) && e.some((t) => t.includes("water")));
        return (t, e, n, a) => ok(t.id(e + r, n + o, a + s));
      }
      case "solid":
        return (t, e, n, a) => {
          const i = BLOCKS[t.id(e + r, n + o, a + s)];
          return !!i && i.solid;
        };
      case "replaceable":
        return (t, e, n, a) => {
          const i = t.id(e + r, n + o, a + s);
          return 0 === i || IS_FLUID[i] || REPLACEABLE[i];
        };
      case "would_survive": {
        const e = stateOf(t.state);
        return (t, n, a, i) => !!e && canSurvive(t, e[0], e[1], n + r, a + o, i + s);
      }
      case "has_sturdy_face":
        return (t, e, n, a) => !!SOLIDCUBE[t.id(e + r, n + o, a + s)];
      case "inside_world_bounds":
        return (t, e, n, r) => n + o >= t.minY && n + o < t.maxY;
    }
    throw new Error("block predicate " + e);
  }
  function ruleTest(t) {
    const e = strip(t.predicate_type);
    switch (e) {
      case "always_true":
        return () => !0;
      case "tag_match": {
        const e = tagSet(t.tag);
        return (t, n) => e.has(n);
      }
      case "block_match": {
        const e = blockSet(t.block);
        return (t, n) => e.has(n);
      }
      case "blockstate_match": {
        const e = stateOf(t.block_state);
        return (t, n) => !!e && e[0] === n;
      }
      case "random_block_match": {
        const e = blockSet(t.block);
        return (n, r) => e.has(r) && n.nextFloat() < t.probability;
      }
    }
    throw new Error("rule test " + e);
  }
  let _ = new Set();
  const h = {},
    sup = (t) => h[t] || (h[t] = tagSet(t)),
    d = new Set(["dead_bush", "short_dry_grass", "tall_dry_grass"]),
    p = { wall: [4, 0, 4, 12, 16, 12], pane: [7, 0, 7, 9, 16, 9] },
    m = {
      flower_pot: [[5, 0, 5, 11, 6, 11]],
      brewing_stand: [
        [1, 0, 1, 15, 2, 15],
        [7, 2, 7, 9, 14, 9],
      ],
      stonecutter: [[0, 0, 0, 16, 9, 16]],
      sculk_sensor: [[0, 0, 0, 16, 8, 16]],
      calibrated_sculk_sensor: [[0, 0, 0, 16, 8, 16]],
      chorus_flower: [[1, 0, 1, 15, 15, 15]],
      scaffolding: [
        [0, 14, 0, 16, 16, 16],
        [0, 0, 0, 2, 16, 2],
        [14, 0, 0, 16, 16, 2],
        [0, 0, 14, 2, 16, 16],
        [14, 0, 14, 16, 16, 16],
      ],
    };
  function sturdy(t, e, n, r, o, s = 0) {
    const i = t.id(e, n, r),
      c = BLOCKS[i];
    if (!i || !c || IS_FLUID[i]) return !1;
    if ((a || initTags(), a.has(i))) return s >= 2;
    if (SOLIDCUBE[i]) return !0;
    const l = t.meta ? t.meta(e, n, r) : 0,
      u = c.key;
    if ("snow" === u) return 2 === o || !(7 & ~l);
    if ("hopper" === u)
      return 3 === s ? 3 === o : 1 === s && 2 === o && "down" === propOf(i, l, "facing");
    if (/(^|_)cauldron$/.test(u)) return 3 === s && 3 === o;
    if ("composter" === u && 3 === o) return 3 === s;
    if ("lectern" === u && 2 !== o) return !1;
    if ("honey_block" === u) return 1 === s && 2 === o;
    let f =
      m[u] ||
      (u.startsWith("potted_")
        ? m.flower_pot
        : "piston_head" === u
          ? (function pistonHead(t, e) {
              const n = ["west", "east", "down", "up", "north", "south"].indexOf(
                  propOf(t, e, "facing"),
                ),
                r = n >> 1,
                o = 1 & n,
                s = "true" === propOf(t, e, "short");
              if (n < 0) return null;
              const a = [0, 0, 0, 16, 16, 16],
                i = [6, 6, 6, 10, 10, 10];
              return (
                (a[r] = o ? 12 : 0),
                (a[r + 3] = o ? 16 : 4),
                (i[r] = o ? (s ? 0 : -4) : 4),
                (i[r + 3] = o ? 12 : s ? 16 : 20),
                [a, i]
              );
            })(i, l)
          : "end_rod" === u
            ? (function endRod(t, e) {
                const n =
                  ["west", "east", "down", "up", "north", "south"].indexOf(
                    propOf(t, e, "facing"),
                  ) >> 1;
                if (n < 0) return null;
                const r = [6, 6, 6, 10, 10, 10];
                return ((r[n] = 0), (r[n + 3] = 16), [r]);
              })(i, l)
            : null);
    if (!f) {
      if (!c.solid) return !1;
      if (c.shape === SH_CUBE) return !0;
      if ((c.shape !== SH_BOXES && c.shape !== SH_MODEL) || !c.boxes) return !1;
      if (c.gate && "true" === propOf(i, l, "open")) return !1;
      f = c.fence ? [p[c.fence] || [6, 0, 6, 10, 16, 10]] : c.collide ? c.collide(l) : c.boxes(l);
    }
    const _ = o >> 1,
      h = 0 === _ ? 1 : 0,
      d = 2 === _ ? 1 : 2,
      g = [];
    for (const t of f)
      (1 & o ? t[_ + 3] >= 16 : t[_] <= 0) && t[h + 3] > t[h] && t[d + 3] > t[d] && g.push(t);
    if (3 === s) return g.length > 0;
    const x = 1 === s ? 7 : 0,
      I = 1 === s ? 9 : 16;
    for (let t = x; t < I; t++)
      for (let e = x; e < I; e++)
        if (!g.some((n) => n[h] <= t && n[h + 3] >= t + 1 && n[d] <= e && n[d + 3] >= e + 1))
          return !1;
    return !0;
  }
  const g = [
      [-1, 0, 0],
      [1, 0, 0],
      [0, -1, 0],
      [0, 1, 0],
      [0, 0, -1],
      [0, 0, 1],
    ],
    x = [1, 0, 3, 2, 5, 4],
    I = ["west", "east", "down", "up", "north", "south"],
    holds = (t, e, n, r, o, s) => sturdy(t, e + g[o][0], n + g[o][1], r + g[o][2], x[o], s);
  function faceUpdate(t, e, n, r, o, s) {
    const a = BLOCKS[e],
      i = a && a.key;
    if ("vine" !== i && "glow_lichen" !== i) return;
    const c = a.states && a.states[n];
    if (!c) return;
    const l = "vine" === i ? [3, 0, 1, 4, 5] : [0, 1, 2, 3, 4, 5],
      u = l.every((t) => "true" !== c[I[t]]),
      f = "vine" === i && t.id(r, o + 1, s) === e ? (t.meta ? t.meta(r, o + 1, s) : 0) : -1,
      ok = (n) => holds(t, r, o, s, n, 2) || (f >= 0 && 3 !== n && "true" === propOf(e, f, I[n]));
    let _ = n,
      h = !1;
    for (const t of l) {
      const n = I[t],
        r = "true" === c[n],
        o = (r || u) && ok(t);
      (o !== r && (_ = withProp(e, _, n, o ? "true" : "false")), o && (h = !0));
    }
    return h ? _ : -1;
  }
  function canSurvive(t, e, n, r, o, s) {
    a || initTags();
    const i = BLOCKS[e];
    if (!i) return !1;
    const c = i.key,
      l = t.id(r, o - 1, s),
      u = BLOCKS[l];
    if ("upper" === propOf(e, n, "half")) return l === e;
    switch (c) {
      case "cactus":
        for (const [e, n] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const a = t.id(r + e, o, s + n),
            i = BLOCKS[a];
          if ((i && i.solid) || IS_FLUID[a]) return !1;
        }
        return l === e || sup("supports_cactus").has(l);
      case "cactus_flower":
        return sup("support_override_cactus_flower").has(l) || !!SOLIDCUBE[l];
      case "soul_fire":
        return sup("soul_fire_base_blocks").has(l);
      case "sugar_cane":
        if (l === e) return !0;
        if (!sup("supports_sugar_cane").has(l)) return !1;
        for (const [e, n] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const a = t.id(r + e, o - 1, s + n);
          if (
            a === WATER ||
            _.has(a) ||
            (t.water && t.water(r + e, o - 1, s + n)) ||
            sup("supports_sugar_cane_adjacently").has(a)
          )
            return !0;
        }
        return !1;
      case "carrots":
      case "potatoes":
      case "beetroots":
      case "torchflower_crop":
      case "pitcher_crop":
        return sup("supports_crops").has(l);
      case "melon_stem":
      case "attached_melon_stem":
        return sup("supports_melon_stem").has(l);
      case "pumpkin_stem":
      case "attached_pumpkin_stem":
        return sup("supports_pumpkin_stem").has(l);
      case "lily_pad":
        return l === WATER || sup("supports_lily_pad").has(l);
      case "mangrove_propagule":
        return sup("supports_mangrove_propagule").has(l);
      case "azalea":
      case "flowering_azalea":
        return sup("supports_azalea").has(l);
      case "bamboo":
      case "bamboo_sapling":
        return sup("supports_bamboo").has(l);
      case "big_dripleaf":
        return l === BID.big_dripleaf_stem || sup("supports_big_dripleaf").has(l);
      case "small_dripleaf":
        return sup("supports_small_dripleaf").has(l);
      case "red_mushroom":
      case "brown_mushroom":
        return !!SOLIDCUBE[l];
      case "cocoa":
        return [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([e, n]) => sup("supports_cocoa").has(t.id(r + e, o, s + n)));
      case "snow":
        return (
          (!!SOLIDCUBE[l] && !sup("cannot_support_snow_layer").has(l)) ||
          sup("support_override_snow_layer").has(l) ||
          a.has(l)
        );
      case "crimson_fungus":
      case "warped_fungus":
        return sup(
          "crimson_fungus" === c ? "supports_crimson_fungus" : "supports_warped_fungus",
        ).has(l);
      case "crimson_roots":
      case "warped_roots":
        return sup("crimson_roots" === c ? "supports_crimson_roots" : "supports_warped_roots").has(
          l,
        );
      case "nether_sprouts":
        return sup("supports_nether_sprouts").has(l);
      case "weeping_vines":
      case "weeping_vines_plant":
      case "cave_vines":
      case "cave_vines_plant": {
        const e = BLOCKS[t.id(r, o + 1, s)],
          n = c.replace(/_plant$/, "");
        return (!!e && (e.key === n || e.key === n + "_plant")) || holds(t, r, o, s, 3, 0);
      }
      case "twisting_vines":
      case "twisting_vines_plant":
        return (
          (!!u && ("twisting_vines" === u.key || "twisting_vines_plant" === u.key)) ||
          holds(t, r, o, s, 2, 0)
        );
      case "vine":
      case "glow_lichen":
        return -1 !== faceUpdate(t, e, n, r, o, s);
      case "pointed_dripstone":
        return (function speleothemHolds(t, e, n, r, o) {
          const s = o ? n + 1 : n - 1,
            a = t.id(e, s, r);
          return (
            sturdy(t, e, s, r, o ? 2 : 3) ||
            (a === BID.pointed_dripstone &&
              propOf(a, t.meta ? t.meta(e, s, r) : 0, "vertical_direction") === (o ? "down" : "up"))
          );
        })(t, r, o, s, "up" !== propOf(e, n, "vertical_direction"));
      case "leaf_litter":
        return holds(t, r, o, s, 2, 0);
      case "sea_pickle":
        return holds(t, r, o, s, 2, 3);
      case "hanging_roots":
      case "spore_blossom":
      case "pale_hanging_moss":
      case "sculk_vein":
      case "cobweb":
        return !0;
    }
    const back = () => {
      const t = I.indexOf(propOf(e, n, "facing"));
      return t < 0 ? -1 : x[t];
    };
    if (/(^|_)wall_torch$/.test(c) || /coral_wall_fan$/.test(c)) {
      const e = back();
      return e >= 0 && holds(t, r, o, s, e, 0);
    }
    if (/(^|_)torch$/.test(c)) return holds(t, r, o, s, 2, 1);
    if (/coral_fan$/.test(c)) return holds(t, r, o, s, 2, 0);
    if ("lever" === c || /_button$/.test(c)) {
      const a = propOf(e, n, "face"),
        i = "floor" === a ? 2 : "ceiling" === a ? 3 : back();
      return i >= 0 && holds(t, r, o, s, i, 0);
    }
    return _.has(e)
      ? (!!SOLIDCUBE[l] && l !== BID.magma_block) ||
          l === e ||
          (("kelp" === c || "kelp_plant" === c) && l === BID.kelp_plant)
      : d.has(c)
        ? sup("supports_dry_vegetation").has(l)
        : !(
            i.shape === SH_CROSS ||
            i.needsSupport ||
            c.endsWith("_sapling") ||
            c.endsWith("_tulip") ||
            [
              "short_grass",
              "fern",
              "tall_grass",
              "large_fern",
              "bush",
              "sweet_berry_bush",
              "firefly_bush",
              "open_eyeblossom",
              "closed_eyeblossom",
              "pink_petals",
              "wildflowers",
              "leaf_litter",
              "sunflower",
              "lilac",
              "rose_bush",
              "peony",
            ].includes(c)
          ) || sup("supports_vegetation").has(l);
  }
  const w = new Map();
  function compilePlacement(t) {
    const e = strip(t.type);
    switch (e) {
      case "count": {
        const e = intProvider(t.count);
        return (t, n, r, o) => {
          const s = e(n);
          for (let t = 0; t < s; t++) o(r);
        };
      }
      case "in_square":
        return (t, e, n, r) => {
          const o = e.nextInt(16) + n[0],
            s = e.nextInt(16) + n[2];
          r([o, n[1], s]);
        };
      case "heightmap":
        return (e, n, r, o) => {
          const s = e.R.height(t.heightmap, r[0], r[2]);
          s > e.R.minY && o([r[0], s, r[2]]);
        };
      case "height_range": {
        const e = (function heightProvider(t) {
          const e = strip(t.type || "constant");
          if ("constant" === e) return () => anchor(t.value || t);
          const n = t.inner || 1;
          let r, o;
          const res = () => {
            ((r = anchor(t.min_inclusive)), (o = anchor(t.max_inclusive)));
          };
          switch (e) {
            case "uniform":
              return (t) => (res(), r > o ? r : t.nextIntBetween(r, o));
            case "trapezoid":
              return (e) => {
                if ((res(), r > o)) return r;
                const n = o - r,
                  s = t.plateau || 0;
                if (s >= n) return e.nextIntBetween(r, o);
                const a = (n - s) >> 1,
                  i = n - a;
                return r + e.nextIntBetween(0, i) + e.nextIntBetween(0, a);
              };
            case "biased_to_bottom":
              return (t) => {
                if ((res(), o - r - n + 1 <= 0)) return r;
                const e = t.nextInt(o - r - n + 1);
                return t.nextInt(e + n) + r;
              };
            case "very_biased_to_bottom":
              return (t) => {
                if ((res(), o - r - n + 1 <= 0)) return r;
                const ni = (e, n) => (e >= n ? e : t.nextInt(n - e + 1) + e),
                  e = ni(r + n, o),
                  s = ni(r, e - 1);
                return ni(r, s - 1 + n);
              };
          }
          throw new Error("height provider " + e);
        })(t.height);
        return (t, n, r, o) => o([r[0], e(n), r[2]]);
      }
      case "biome":
        return (t, e, n, r) => {
          t.biomeHas(n, t.top) && r(n);
        };
      case "rarity_filter": {
        const e = Math.fround(1 / t.chance);
        return (t, n, r, o) => {
          n.nextFloat() < e && o(r);
        };
      }
      case "random_offset": {
        const e = intProvider(t.xz_spread),
          n = intProvider(t.y_spread);
        return (t, r, o, s) => {
          s([o[0] + e(r), o[1] + n(r), o[2] + e(r)]);
        };
      }
      case "block_predicate_filter": {
        const e = predicate(t.predicate);
        return (t, n, r, o) => {
          e(t.R, r[0], r[1], r[2]) && o(r);
        };
      }
      case "surface_water_depth_filter":
        return (e, n, r, o) => {
          e.R.height("WORLD_SURFACE", r[0], r[2]) - e.R.height("OCEAN_FLOOR", r[0], r[2]) <=
            t.max_water_depth && o(r);
        };
      case "surface_relative_threshold_filter":
        return (e, n, r, o) => {
          const s = e.R.height(t.heightmap, r[0], r[2]),
            a = s + (t.min_inclusive ?? -1e9),
            i = s + (t.max_inclusive ?? 1e9);
          a <= r[1] && r[1] <= i && o(r);
        };
      case "noise_threshold_count":
        return (e, n, r, o) => {
          const s =
            WG.infoNoise().get(r[0] / 200, r[2] / 200) < t.noise_level
              ? t.below_noise
              : t.above_noise;
          for (let t = 0; t < s; t++) o(r);
        };
      case "noise_based_count":
        return (e, n, r, o) => {
          const s = WG.infoNoise().get(r[0] / t.noise_factor, r[2] / t.noise_factor),
            a = Math.ceil((s + (t.noise_offset || 0)) * t.noise_to_count_ratio);
          for (let t = 0; t < a; t++) o(r);
        };
      case "environment_scan": {
        const e = predicate(t.target_condition),
          n = t.allowed_search_condition ? predicate(t.allowed_search_condition) : () => !0,
          r = "up" === t.direction_of_search ? 1 : -1;
        return (o, s, a, i) => {
          const c = o.R;
          let l = a[1];
          if (n(c, a[0], l, a[2])) {
            for (let o = 0; o < t.max_steps; o++) {
              if (e(c, a[0], l, a[2])) return void i([a[0], l, a[2]]);
              if (((l += r), l < c.minY || l >= c.maxY)) return;
              if (!n(c, a[0], l, a[2])) break;
            }
            e(c, a[0], l, a[2]) && i([a[0], l, a[2]]);
          }
        };
      }
      case "count_on_every_layer": {
        const e = intProvider(t.count);
        return (t, n, r, o) => {
          const s = t.R;
          let a,
            i = 0;
          do {
            a = !1;
            for (let t = 0; t < e(n); t++) {
              const t = n.nextInt(16) + r[0],
                e = n.nextInt(16) + r[2],
                c = s.height("MOTION_BLOCKING", t, e),
                empty = (t) => 0 === t || t === WATER || t === LAVA;
              let l = 0,
                u = 2147483647,
                f = s.id(t, c, e);
              for (let n = c; n >= s.minY + 1; n--) {
                const r = s.id(t, n - 1, e);
                if (!empty(r) && empty(f) && r !== BID.bedrock) {
                  if (l === i) {
                    u = n;
                    break;
                  }
                  l++;
                }
                f = r;
              }
              2147483647 !== u && (o([t, u, e]), (a = !0));
            }
            i++;
          } while (a);
        };
      }
      case "fixed_placement":
        return (e, n, r, o) => {
          for (const e of t.positions) e[0] >> 4 == r[0] >> 4 && e[2] >> 4 == r[2] >> 4 && o(e);
        };
    }
    throw new Error("placement " + e);
  }
  function compilePF(e, n) {
    let r = e && w.get(e);
    if (r) return r;
    return (
      (r = {
        mods: (
          (n = ((e) => ("string" == typeof e ? t.placed_feature[strip(e)] : e))(n)).placement || []
        ).map(compilePlacement),
        feat: n.feature,
      }),
      e && w.set(e, r),
      r
    );
  }
  function placePF(t, e, n, r, o) {
    const s = compilePF("string" == typeof e ? strip(e) : null, e);
    let a = !1;
    const i = t.top;
    o && (t.top = o);
    const step = (e, r) => {
      e !== s.mods.length
        ? s.mods[e](t, n, r, (t) => step(e + 1, t))
        : placeCF(t, s.feat, n, r) && (a = !0);
    };
    try {
      step(0, r);
    } finally {
      t.top = i;
    }
    return a;
  }
  const v = {},
    b = new Map();
  function placeCF(e, n, r, o) {
    const s = ((e) => ("string" == typeof e ? t.configured_feature[strip(e)] : e))(n);
    if (!s) return !1;
    const a = strip(s.type),
      i = v[a];
    if (!i) return !1;
    let c = b.get(s);
    return (c || ((c = { raw: s.config || {} }), b.set(s, c)), i(e, c, r, o[0], o[1], o[2]));
  }
  const once = (t, e, n) => t[e] || (t[e] = n());
  function oreDoPlace(t, e, n, r, o, s, a, i, c, l, u, f, _, h, d) {
    let p = 0;
    const m = new Set(),
      g = n.size,
      x = new Float64Array(4 * g);
    for (let t = 0; t < g; t++) {
      const n = Math.fround(t / g),
        r = o + n * (s - o),
        u = c + n * (l - c),
        f = a + n * (i - a),
        _ = (e.nextDouble() * g) / 16,
        h = (Math.fround(msin(Math.PI * n) + 1) * _ + 1) / 2;
      ((x[4 * t] = r), (x[4 * t + 1] = u), (x[4 * t + 2] = f), (x[4 * t + 3] = h));
    }
    for (let t = 0; t < g - 1; t++)
      if (!(x[4 * t + 3] <= 0))
        for (let e = t + 1; e < g; e++) {
          if (x[4 * e + 3] <= 0) continue;
          const n = x[4 * t] - x[4 * e],
            r = x[4 * t + 1] - x[4 * e + 1],
            o = x[4 * t + 2] - x[4 * e + 2],
            s = x[4 * t + 3] - x[4 * e + 3];
          s * s > n * n + r * r + o * o && (s > 0 ? (x[4 * e + 3] = -1) : (x[4 * t + 3] = -1));
        }
    const I = n.discard_chance_on_air_exposure || 0;
    for (let n = 0; n < g; n++) {
      const o = x[4 * n + 3];
      if (o < 0) continue;
      const s = x[4 * n],
        a = x[4 * n + 1],
        i = x[4 * n + 2],
        c = Math.max(Math.floor(s - o), u),
        l = Math.max(Math.floor(a - o), f),
        g = Math.max(Math.floor(i - o), _),
        w = Math.max(Math.floor(s + o), c),
        v = Math.max(Math.floor(a + o), l),
        b = Math.max(Math.floor(i + o), g);
      for (let n = c; n <= w; n++) {
        const c = (n + 0.5 - s) / o;
        if (!(c * c >= 1))
          for (let s = l; s <= v; s++) {
            const l = (s + 0.5 - a) / o;
            if (!(c * c + l * l >= 1))
              for (let a = g; a <= b; a++) {
                const g = (a + 0.5 - i) / o;
                if (c * c + l * l + g * g >= 1 || s < t.minY || s >= t.maxY) continue;
                const x = n - u + (s - f) * h + (a - _) * h * d;
                if (m.has(x)) continue;
                if ((m.add(x), !t.canWrite(n, s, a))) continue;
                const w = t.id(n, s, a);
                for (const [o, i] of r)
                  if (
                    o(e, w) &&
                    (I <= 0 || (I < 1 && e.nextFloat() >= I) || !adjacentAir(t, n, s, a))
                  ) {
                    (t.setState(n, s, a, i), p++);
                    break;
                  }
              }
          }
      }
    }
    return p > 0;
  }
  ((v.random_selector = (t, e, n, r, o, s) => {
    for (const a of e.raw.features)
      if (n.nextFloat() < a.chance) return placePF(t, a.feature, n, [r, o, s]);
    return placePF(t, e.raw.default, n, [r, o, s]);
  }),
    (v.simple_random_selector = (t, e, n, r, o, s) => {
      const a = e.raw.features;
      return placePF(t, a[n.nextInt(a.length)], n, [r, o, s]);
    }),
    (v.random_boolean_selector = (t, e, n, r, o, s) =>
      placePF(t, n.nextBoolean() ? e.raw.feature_true : e.raw.feature_false, n, [r, o, s])),
    (v.weighted_random_selector = (t, e, n, r, o, s) => {
      const a = e.raw.features || e.raw.entries,
        i = a.reduce((t, e) => t + e.weight, 0);
      let c = n.nextInt(i);
      for (const e of a)
        if (((c -= e.weight), c < 0)) return placePF(t, e.data || e.feature, n, [r, o, s]);
      return !1;
    }),
    (v.sequence = (t, e, n, r, o, s) => {
      let a = !0;
      for (const i of e.raw.features) placePF(t, i, n, [r, o, s]) || (a = !1);
      return a;
    }),
    (v.simple_block = (t, e, n, r, o, s) => {
      const a = t.R,
        i = once(e, "p", () => provider(e.raw.to_place))(n, r, o, s, a);
      if (!i || !canSurvive(a, i[0], i[1], r, o, s)) return !1;
      const c = BLOCKS[i[0]];
      if (
        c.states &&
        c.states[0] &&
        void 0 !== c.states[0].half &&
        c.states.some((t) => "upper" === t.half)
      ) {
        if (!(a.isAir(r, o + 1, s) || (_.has(i[0]) && a.id(r, o + 1, s) === WATER))) return !1;
        (a.set(r, o, s, i[0], withProp(i[0], i[1], "half", "lower")),
          a.set(r, o + 1, s, i[0], withProp(i[0], i[1], "half", "upper")));
      } else a.set(r, o, s, i[0], i[1]);
      return !0;
    }),
    (v.block_column = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw,
        c = once(e, "l", () => i.layers.map((t) => [intProvider(t.height), provider(t.provider)])),
        l = once(e, "a", () => predicate(i.allowed_placement)),
        u = {
          up: [0, 1, 0],
          down: [0, -1, 0],
          north: [0, 0, -1],
          south: [0, 0, 1],
          east: [1, 0, 0],
          west: [-1, 0, 0],
        }[i.direction],
        f = c.length,
        _ = new Array(f);
      let h = 0;
      for (let t = 0; t < f; t++) ((_[t] = c[t][0](n)), (h += _[t]));
      if (0 === h) return !1;
      let d = r + u[0],
        p = o + u[1],
        m = s + u[2];
      for (let t = 0; t < h; t++) {
        if (!l(a, d, p, m)) {
          let e = h - t;
          const n = i.prioritize_tip,
            r = n ? 1 : -1;
          for (let t = n ? 0 : f - 1; t !== (n ? f : -1) && e > 0; t += r) {
            const n = Math.min(_[t], e);
            ((e -= n), (_[t] -= n));
          }
          break;
        }
        ((d += u[0]), (p += u[1]), (m += u[2]));
      }
      let g = r,
        x = o,
        I = s;
      for (let t = 0; t < f; t++)
        for (let e = 0; e < _[t]; e++)
          (a.setState(g, x, I, c[t][1](n, g, x, I, a)), (g += u[0]), (x += u[1]), (I += u[2]));
      return !0;
    }),
    (v.ore = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw,
        c = i.size,
        l = once(e, "t", () => i.targets.map((t) => [ruleTest(t.target), stateOf(t.state)])),
        u = n.nextFloat() * Math.PI,
        f = Math.fround(c / 8),
        _ = Math.ceil(((c / 16) * 2 + 1) / 2),
        h = r + msin(u) * f,
        d = r - msin(u) * f,
        p = s + mcos(u) * f,
        m = s - mcos(u) * f,
        g = o + n.nextInt(3) - 2,
        x = o + n.nextInt(3) - 2,
        I = r - Math.ceil(f) - _,
        w = o - 2 - _,
        v = s - Math.ceil(f) - _,
        b = 2 * (Math.ceil(f) + _),
        S = 2 * (2 + _);
      for (let t = I; t <= I + b; t++)
        for (let e = v; e <= v + b; e++)
          if (!(w > a.height("OCEAN_FLOOR_WG", t, e)))
            return oreDoPlace(a, n, i, l, h, d, p, m, g, x, I, w, v, b, S);
      return !1;
    }));
  const S = [
      [0, -1, 0],
      [0, 1, 0],
      [0, 0, -1],
      [0, 0, 1],
      [-1, 0, 0],
      [1, 0, 0],
    ],
    adjacentAir = (t, e, n, r) => S.some((o) => t.isAir(e + o[0], n + o[1], r + o[2]));
  ((v.scattered_ore = (t, e, n, r, o, s) => {
    const a = t.R,
      i = e.raw,
      c = once(e, "t", () => i.targets.map((t) => [ruleTest(t.target), stateOf(t.state)])),
      l = n.nextInt(i.size + 1);
    for (let t = 0; t < l; t++) {
      const e = Math.min(t, 7),
        off = () => Math.round((n.nextFloat() - n.nextFloat()) * e),
        l = r + off(),
        u = o + off(),
        f = s + off(),
        _ = a.id(l, u, f);
      for (const [t, e] of c) {
        if (!t(n, _)) continue;
        const r = i.discard_chance_on_air_exposure || 0;
        if (r <= 0 || (r < 1 && n.nextFloat() >= r) || !adjacentAir(a, l, u, f)) {
          a.setState(l, u, f, e);
          break;
        }
      }
    }
    return !0;
  }),
    (v.block_pile = (t, e, n, r, o, s) => {
      const a = t.R,
        i = once(e, "p", () => provider(e.raw.state_provider)),
        c = BID.dirt_path;
      if (o < a.minY + 5) return !1;
      const l = 2 + n.nextInt(2),
        u = 2 + n.nextInt(2),
        tryPlace = (t, e, r) => {
          if (0 !== a.id(t, e, r)) return;
          const o = a.id(t, e - 1, r);
          (o === c ? n.nextBoolean() : SOLIDCUBE[o]) && a.setState(t, e, r, i(n, t, e, r, a));
        };
      for (let t = s - u; t <= s + u; t++)
        for (let e = o; e <= o + 1; e++)
          for (let o = r - l; o <= r + l; o++) {
            const a = r - o,
              i = s - t;
            (a * a + i * i <= 10 * n.nextFloat() - 6 * n.nextFloat() || n.nextFloat() < 0.031) &&
              tryPlace(o, e, t);
          }
      return !0;
    }),
    (v.disk = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw,
        c = once(e, "p", () => provider(i.state_provider)),
        l = once(e, "t", () => predicate(i.target)),
        u = intProvider(i.radius)(n),
        f = o + i.half_height,
        _ = o - i.half_height - 1;
      let h = !1;
      for (let t = r - u; t <= r + u; t++)
        for (let e = s - u; e <= s + u; e++) {
          const o = t - r,
            i = e - s;
          if (o * o + i * i > u * u) continue;
          let d = !1;
          for (let r = f; r > _; r--)
            if (l(a, t, r, e)) {
              const o = c(n, t, r, e, a);
              (a.setState(t, r, e, o), (d = !0), (h = !0));
            }
        }
      return h;
    }),
    (v.freeze_top_layer = (e, n, r, o, s, a) => {
      const i = e.R,
        c = -16 & o,
        l = -16 & a,
        u = BID.snow,
        f = BID.ice;
      for (let n = 0; n < 16; n++)
        for (let r = 0; r < 16; r++) {
          const o = c + n,
            s = l + r,
            a = i.height("MOTION_BLOCKING", o, s),
            _ = e.biomeAt(o, a - 1, s),
            h = t.biome[_];
          if (!h) continue;
          const cold = (t) => WG.biomeTemperature(h, o, t, s, 63) < 0.15000000596046448;
          if (
            (i.id(o, a - 1, s) === WATER &&
              cold(a - 1) &&
              0 === i.meta(o, a - 1, s) &&
              i.set(o, a - 1, s, f),
            h.has_precipitation &&
              cold(a) &&
              a < i.maxY &&
              i.isAir(o, a, s) &&
              canSurvive(i, u, 0, o, a, s))
          ) {
            i.set(o, a, s, u);
            const t = i.id(o, a - 1, s);
            (t !== BID.grass_block && t !== BID.podzol && t !== BID.mycelium) ||
              i.set(
                o,
                a - 1,
                s,
                t,
                t === BID.grass_block ? 1 : withProp(t, i.meta(o, a - 1, s), "snowy", "true"),
              );
          }
        }
      return !0;
    }),
    (v.lake = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw,
        c = once(e, "f", () => provider(i.fluid)),
        l = once(e, "b", () => provider(i.barrier)),
        u = once(e, "r", () => predicate(i.can_replace_with_air_or_fluid)),
        f = once(e, "q", () => predicate(i.can_replace_with_barrier));
      if (o <= a.minY + 4) return !1;
      const _ = c(n, r, (o -= 4), s, a),
        h = _ && _[0] === LAVA,
        d = new Uint8Array(2048),
        p = n.nextInt(4) + 4;
      for (let t = 0; t < p; t++) {
        const t = 6 * n.nextDouble() + 3,
          e = 4 * n.nextDouble() + 2,
          r = 6 * n.nextDouble() + 3,
          o = n.nextDouble() * (16 - t - 2) + 1 + t / 2,
          s = n.nextDouble() * (8 - e - 4) + 2 + e / 2,
          a = n.nextDouble() * (16 - r - 2) + 1 + r / 2;
        for (let n = 1; n < 15; n++)
          for (let i = 1; i < 15; i++)
            for (let c = 1; c < 7; c++) {
              const l = (n - o) / (t / 2),
                u = (c - s) / (e / 2),
                f = (i - a) / (r / 2);
              l * l + u * u + f * f < 1 && (d[8 * (16 * n + i) + c] = 1);
            }
      }
      const B = (t, e, n) => d[8 * (16 * t + e) + n],
        edge = (t, e, n) =>
          !B(t, e, n) &&
          ((t < 15 && B(t + 1, e, n)) ||
            (t > 0 && B(t - 1, e, n)) ||
            (e < 15 && B(t, e + 1, n)) ||
            (e > 0 && B(t, e - 1, n)) ||
            (n < 7 && B(t, e, n + 1)) ||
            (n > 0 && B(t, e, n - 1)));
      for (let t = 0; t < 16; t++)
        for (let e = 0; e < 16; e++)
          for (let n = 0; n < 8; n++) {
            if (!edge(t, e, n)) continue;
            const i = a.id(r + t, o + n, s + e);
            if (n >= 4 && IS_FLUID[i]) return !1;
            if (n < 4 && (!BLOCKS[i] || !BLOCKS[i].solid) && i !== _[0]) return !1;
          }
      for (let t = 0; t < 16; t++)
        for (let e = 0; e < 16; e++)
          for (let n = 0; n < 8; n++) {
            if (!B(t, e, n)) continue;
            const i = r + t,
              c = o + n,
              l = s + e;
            if (u(a, i, c, l) && (a.set(i, c, l, n >= 4 ? 0 : _[0], 0), n >= 4))
              for (let t = 1; t <= 2; t++) {
                const e = a.id(i, c + t, l);
                if (
                  !e ||
                  IS_FLUID[e] ||
                  BLOCKS[e].solid ||
                  canSurvive(a, e, a.meta(i, c + t, l), i, c + t, l)
                )
                  break;
                a.set(i, c + t, l, 0, 0);
              }
          }
      if (l)
        for (let t = 0; t < 16; t++)
          for (let e = 0; e < 16; e++)
            for (let i = 0; i < 8; i++) {
              if (!edge(t, e, i) || (i >= 4 && 0 === n.nextInt(2))) continue;
              const c = r + t,
                u = o + i,
                _ = s + e,
                d = a.id(c, u, _);
              BLOCKS[d] &&
                BLOCKS[d].solid &&
                f(a, c, u, _) &&
                h &&
                a.setState(c, u, _, l(n, c, u, _, a));
            }
      return !0;
    }),
    (v.spring_feature = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw,
        c = once(e, "v", () => blockSet(i.valid_blocks)),
        l = stateOf(i.state),
        u = !1 !== i.requires_block_below,
        f = i.rock_count ?? 4,
        _ = i.hole_count ?? 1;
      if (!c.has(a.id(r, o + 1, s))) return !1;
      if (u && !c.has(a.id(r, o - 1, s))) return !1;
      const h = a.id(r, o, s);
      if (0 !== h && !c.has(h)) return !1;
      let d = 0,
        p = 0;
      for (const [t, e] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const n = a.id(r + t, o, s + e);
        (c.has(n) && d++, 0 === n && p++);
      }
      if (!u) {
        const t = a.id(r, o - 1, s);
        (c.has(t) && d++, 0 === t && p++);
      }
      return d === f && p === _ && (a.setState(r, o, s, l), !0);
    }),
    (v.block_blob = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw,
        c = stateOf(i.state),
        l = once(e, "c", () => predicate(i.can_place_on));
      for (; o > a.minY + 3 && (a.isAir(r, o - 1, s) || !l(a, r, o - 1, s)); o--);
      if (o <= a.minY + 3) return !1;
      for (let t = 0; t < 3; t++) {
        const t = n.nextInt(2),
          e = n.nextInt(2),
          i = n.nextInt(2),
          l = 0.333 * (t + e + i) + 0.5;
        for (let n = r - t; n <= r + t; n++)
          for (let t = o - e; t <= o + e; t++)
            for (let e = s - i; e <= s + i; e++)
              (n - r) ** 2 + (t - o) ** 2 + (e - s) ** 2 <= l * l && a.setState(n, t, e, c);
        ((r += -1 + n.nextInt(2)), (o -= n.nextInt(2)), (s += -1 + n.nextInt(2)));
      }
      return !0;
    }),
    (v.spike = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw,
        c = stateOf(i.state),
        l = once(e, "c", () => predicate(i.can_place_on)),
        u = once(e, "r", () => predicate(i.can_replace));
      for (; a.isAir(r, o, s) && o > a.minY + 2;) o--;
      if (!l(a, r, o, s)) return !1;
      o += n.nextInt(4);
      const f = n.nextInt(4) + 7,
        _ = ((f / 4) | 0) + n.nextInt(2);
      _ > 1 && 0 === n.nextInt(60) && (o += 10 + n.nextInt(30));
      for (let t = 0; t < f; t++) {
        const e = (1 - t / f) * _,
          i = Math.ceil(e);
        for (let l = -i; l <= i; l++) {
          const f = Math.abs(l) - 0.25;
          for (let _ = -i; _ <= i; _++) {
            const h = Math.abs(_) - 0.25;
            ((0 !== l || 0 !== _) && f * f + h * h > e * e) ||
              ((l === -i || l === i || _ === -i || _ === i) && n.nextFloat() > 0.75) ||
              (u(a, r + l, o + t, s + _) && a.setState(r + l, o + t, s + _, c),
              0 !== t && i > 1 && u(a, r + l, o - t, s + _) && a.setState(r + l, o - t, s + _, c));
          }
        }
      }
      let h = _ - 1;
      h < 0 ? (h = 0) : h > 1 && (h = 1);
      for (let t = -h; t <= h; t++)
        for (let e = -h; e <= h; e++) {
          let i = o - 1,
            l = 50;
          for (
            1 === Math.abs(t) && 1 === Math.abs(e) && (l = n.nextInt(5));
            i > 50 && u(a, r + t, i, s + e);
          )
            (a.setState(r + t, i, s + e, c),
              i--,
              --l > 0 || ((i -= n.nextInt(5) + 1), (l = n.nextInt(5))));
        }
      return !0;
    }),
    (v.vines = (t, e, n, r, o, s) => {
      const a = t.R,
        i = BID.vine;
      if (!a.isAir(r, o, s)) return !1;
      for (const [t, e, n] of [
        [0, -1, "north"],
        [1, 0, "east"],
        [0, 1, "south"],
        [-1, 0, "west"],
      ])
        if (SOLIDCUBE[a.id(r + t, o, s + e)])
          return (a.set(r, o, s, i, vineMeta({ [n]: "true" })), !0);
      return !1;
    }));
  const vineMeta = (t) => {
      const e = BLOCKS[BID.vine].states.findIndex((e) =>
        ["north", "east", "south", "west", "up"].every((n) => e[n] === (t[n] || "false")),
      );
      return Math.max(0, e);
    },
    k = [
      ["down", 0, -1, 0],
      ["up", 0, 1, 0],
      ["north", 0, 0, -1],
      ["south", 0, 0, 1],
      ["west", -1, 0, 0],
      ["east", 1, 0, 0],
    ],
    y = { down: "up", up: "down", north: "south", south: "north", west: "east", east: "west" },
    A = { down: 1, up: 1, north: 2, south: 2, west: 0, east: 0 },
    M = Object.fromEntries(k.map((t) => [t[0], t])),
    shuffled = (t, e) => {
      const n = t.slice();
      for (let t = n.length; t > 1; t--) {
        const r = e.nextInt(t),
          o = n[t - 1];
        ((n[t - 1] = n[r]), (n[r] = o));
      }
      return n;
    },
    mfHas = (t, e, n, r, o, s) => t.id(n, r, o) === e && "true" === propOf(e, t.meta(n, r, o), s);
  function mfState(t, e, n, r, o, s, a) {
    const i = t.id(n, r, o);
    if (i === e ? "true" === propOf(e, t.meta(n, r, o), s) : 0 !== i && i !== WATER) return null;
    if (!a(t.id(n + M[s][1], r + M[s][2], o + M[s][3]))) return null;
    const c = BLOCKS[e],
      l = new Set([s]);
    if (i === e) for (const [s] of k) "true" === propOf(e, t.meta(n, r, o), s) && l.add(s);
    const u = c.states.findIndex(
      (t) =>
        k.every(([e]) => !(e in t) || ("true" === t[e]) === l.has(e)) &&
        (!("waterlogged" in t) || "false" === t.waterlogged),
    );
    return Math.max(0, u);
  }
  function mfSpread(t, e, n, r, o, s, a) {
    const full = (t) => !!SOLIDCUBE[t];
    for (const [i, c, l, u] of shuffled(k, a)) {
      if (A[i] === A[s] || !mfHas(t, e, n, r, o, s) || mfHas(t, e, n, r, o, i)) continue;
      const [, a, f, _] = M[s];
      for (const [h, d, p, m] of [
        [n, r, o, i],
        [n + c, r + l, o + u, s],
        [n + c + a, r + l + f, o + u + _, y[i]],
      ]) {
        const n = t.id(h, d, p);
        if (0 !== n && n !== e && (n !== WATER || 0 !== t.meta(h, d, p))) continue;
        const r = mfState(t, e, h, d, p, m, full);
        if (null !== r) {
          if (t.set(h, d, p, e, r)) return !0;
          break;
        }
      }
    }
    return !1;
  }
  function vegetationPatch(t, e, n, r, o, s, a) {
    const i = t.R,
      c = e.raw,
      l = once(e, "rp", () => tagSet(c.replaceable)),
      u = once(e, "g", () => provider(c.ground_state)),
      f = intProvider(c.xz_radius),
      _ = intProvider(c.depth),
      h = "ceiling" === c.surface ? 1 : -1,
      d = f(n) + 1,
      p = f(n) + 1,
      m = [];
    for (let t = -d; t <= d; t++) {
      const e = t === -d || t === d;
      for (let a = -p; a <= p; a++) {
        const f = a === -p || a === p;
        if (
          (e && f) ||
          ((e || f) &&
            (0 === c.extra_edge_column_chance || n.nextFloat() > c.extra_edge_column_chance))
        )
          continue;
        let d = o;
        for (let e = 0; e < c.vertical_range && i.isAir(r + t, d, s + a); e++) d += h;
        for (let e = 0; e < c.vertical_range && !i.isAir(r + t, d, s + a); e++) d -= h;
        const g = d + h;
        if (!i.isAir(r + t, d, s + a) || !SOLIDCUBE[i.id(r + t, g, s + a)]) continue;
        const x =
          _(n) +
          (c.extra_bottom_block_chance > 0 && n.nextFloat() < c.extra_bottom_block_chance ? 1 : 0);
        let I = !1,
          w = g;
        for (let e = 0; e < x && l.has(i.id(r + t, w, s + a)); e++)
          (i.setState(r + t, w, s + a, u(n, r + t, w, s + a, i)),
            (I = !0),
            (w += -1 === h ? -1 : 1));
        I && m.push([r + t, d, s + a]);
      }
    }
    if (a)
      for (const t of m) {
        const [e, n, r] = t;
        S.slice(2).every(
          (t) =>
            SOLIDCUBE[i.id(e + t[0], n - 1, r + t[2])] || i.id(e + t[0], n - 1, r + t[2]) === WATER,
        ) && i.set(e, n - 1, r, WATER);
      }
    for (const e of m)
      n.nextFloat() < c.vegetation_chance &&
        placePF(t, c.vegetation_feature, n, a ? [e[0], e[1] - 1, e[2]] : e);
    return m.length > 0;
  }
  ((v.multiface_growth = (t, e, n, r, o, s) => {
    const a = t.R,
      i = e.raw,
      c = BID[strip(i.block)],
      l = once(e, "o", () => blockSet(i.can_be_placed_on)),
      airOrWater = (t) => 0 === t || t === WATER;
    if (void 0 === c || !airOrWater(a.id(r, o, s))) return !1;
    const u = [];
    (i.can_place_on_ceiling && u.push(M.up),
      i.can_place_on_floor && u.push(M.down),
      i.can_place_on_wall && u.push(M.north, M.east, M.south, M.west));
    const f = i.chance_of_spreading ?? 0.5,
      _ = i.search_range ?? 10,
      grow = (t, e, r, o) => {
        for (const [s, i, u, _] of o) {
          if (!l.has(a.id(t + i, e + u, r + _))) continue;
          const o = mfState(a, c, t, e, r, s, () => !0);
          return (
            null !== o &&
            (a.set(t, e, r, c, o), n.nextFloat() < f && mfSpread(a, c, t, e, r, s, n), !0)
          );
        }
        return !1;
      },
      h = shuffled(u, n);
    if (grow(r, o, s, h)) return !0;
    for (const [t, e, i, l] of h) {
      const f = shuffled(
        u.filter((e) => e[0] !== y[t]),
        n,
      );
      for (let t = 0; t < _; t++) {
        const t = r + e,
          n = o + i,
          u = s + l,
          _ = a.id(t, n, u);
        if (!airOrWater(_) && _ !== c) break;
        if (grow(t, n, u, f)) return !0;
      }
    }
    return !1;
  }),
    (v.vegetation_patch = (t, e, n, r, o, s) => vegetationPatch(t, e, n, r, o, s, !1)),
    (v.waterlogged_vegetation_patch = (t, e, n, r, o, s) => vegetationPatch(t, e, n, r, o, s, !0)),
    (v.root_system = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw;
      if (!a.isAir(r, o, s) && a.id(r, o, s) !== WATER) return !1;
      const c = once(e, "a", () => predicate(i.allowed_tree_position));
      let l = o,
        u = !1;
      for (
        let t = 0;
        t < i.required_vertical_space_for_tree &&
        (l++, c(a, r, l, s) && (a.isAir(r, l, s) || a.id(r, l, s) === WATER));
        t++
      )
        (i.required_vertical_space_for_tree, (u = !0));
      const f = once(e, "r", () => tagSet(i.root_replaceable)),
        _ = once(e, "rp", () => provider(i.root_state_provider));
      let h = o - 1,
        d = !1;
      for (let t = 0; t < i.root_column_max_height && f.has(a.id(r, h, s)); t++, h--)
        (a.setState(r, h, s, _(n, r, h, s, a)), (d = !0));
      if (!d) return !1;
      if (!placePF(t, i.feature, n, [r, o, s])) return !0;
      const p = once(e, "h", () => provider(i.hanging_root_state_provider));
      for (let t = 0; t < i.hanging_root_placement_attempts; t++) {
        const t = r + n.nextInt(i.hanging_root_radius) - n.nextInt(i.hanging_root_radius),
          e = s + n.nextInt(i.hanging_root_radius) - n.nextInt(i.hanging_root_radius),
          o =
            h - n.nextInt(i.hanging_roots_vertical_span) + n.nextInt(i.hanging_roots_vertical_span);
        a.isAir(t, o, e) && SOLIDCUBE[a.id(t, o + 1, e)] && a.setState(t, o, e, p(n, t, o, e, a));
      }
      return !0;
    }),
    (v.bamboo = (t, e, n, r, o, s) => {
      const a = t.R,
        i = BID.bamboo;
      if (!a.isAir(r, o, s) || void 0 === i) return !1;
      const l = n.nextInt(12) + 5;
      if (n.nextFloat() < e.raw.probability) {
        const t = n.nextInt(4) + 1;
        for (let e = r - t; e <= r + t; e++)
          for (let n = s - t; n <= s + t; n++) {
            if ((e - r) ** 2 + (n - s) ** 2 > t * t) continue;
            const o = a.height("WORLD_SURFACE_WG", e, n) - 1;
            c.has(a.id(e, o, n)) && a.set(e, o, n, BID.podzol);
          }
      }
      if (
        !c.has(a.id(r, o - 1, s)) &&
        a.id(r, o - 1, s) !== BID.sand &&
        a.id(r, o - 1, s) !== BID.gravel
      )
        return !1;
      let u = 0;
      for (; u < l && a.isAir(r, o + u, s); u++) a.set(r, o + u, s, i, bambooMeta(1, "none"));
      return (
        u >= 3 &&
          (a.set(r, o + u, s, i, bambooMeta(1, "large")),
          a.set(r, o + u - 1, s, i, bambooMeta(1, "large")),
          a.set(r, o + u - 2, s, i, bambooMeta(1, "small"))),
        u > 0
      );
    }));
  const bambooMeta = (t, e) =>
    Math.max(
      0,
      BLOCKS[BID.bamboo].states.findIndex((n) => n.age === String(t) && n.leaves === e),
    );
  ((v.huge_red_mushroom = (t, e, n, r, o, s) => hugeMushroom(t, e, n, r, o, s, !0)),
    (v.huge_brown_mushroom = (t, e, n, r, o, s) => hugeMushroom(t, e, n, r, o, s, !1)));
  const mushMeta = (t, e) => {
    const n = BLOCKS[t].states.findIndex((t) =>
      ["up", "down", "north", "south", "east", "west"].every(
        (n) => t[n] === (e[n] ? "true" : "false"),
      ),
    );
    return Math.max(0, n);
  };
  function hugeMushroom(t, e, n, r, o, s, i) {
    const l = t.R,
      u = e.raw,
      f = stateOf(
        u.cap_provider.state || { Name: i ? "red_mushroom_block" : "brown_mushroom_block" },
      ),
      _ = BID.mushroom_stem;
    let h = n.nextInt(3) + 4;
    if ((0 === n.nextInt(12) && (h *= 2), o < l.minY + 1 || o + h + 1 >= l.maxY)) return !1;
    if (!c.has(l.id(r, o - 1, s)) && l.id(r, o - 1, s) !== BID.mycelium) return !1;
    const d = u.foliage_radius || (i ? 2 : 3);
    for (let t = 0; t <= h; t++) {
      const e = t < h ? 0 : d;
      for (let n = -e; n <= e; n++)
        for (let i = -e; i <= e; i++) {
          const e = l.id(r + n, o + t, s + i);
          if (0 !== e && !a.has(e)) return !1;
        }
    }
    for (let t = 0; t < h; t++)
      (l.isAir(r, o + t, s) || REPLACEABLE[l.id(r, o + t, s)]) &&
        l.set(r, o + t, s, _, mushMeta(_, { north: 1, south: 1, east: 1, west: 1 }));
    if (i)
      for (let t = h - 3; t <= h; t++) {
        const e = t < h ? d : d - 1,
          n = d - 2;
        for (let i = -e; i <= e; i++)
          for (let c = -e; c <= e; c++) {
            (t < h && (i === -e || i === e) === (c === -e || c === e)) ||
              ((l.isAir(r + i, o + t, s + c) || a.has(l.id(r + i, o + t, s + c))) &&
                l.set(
                  r + i,
                  o + t,
                  s + c,
                  f[0],
                  mushMeta(f[0], {
                    up: t >= h - 1,
                    west: i < -n,
                    east: i > n,
                    north: c < -n,
                    south: c > n,
                  }),
                ));
          }
      }
    else {
      const t = d;
      for (let e = -t; e <= t; e++)
        for (let n = -t; n <= t; n++) {
          const i = e === -t || e === t,
            c = n === -t || n === t;
          if (i && c) continue;
          if (!l.isAir(r + e, o + h, s + n) && !a.has(l.id(r + e, o + h, s + n))) continue;
          const u = e === -t || (c && e === 1 - t),
            _ = e === t || (c && e === t - 1),
            d = n === -t || (i && n === 1 - t),
            p = n === t || (i && n === t - 1);
          l.set(
            r + e,
            o + h,
            s + n,
            f[0],
            mushMeta(f[0], { up: 1, west: u, east: _, north: d, south: p }),
          );
        }
    }
    return !0;
  }
  ((v.seagrass = (t, e, n, r, o, s) => {
    const a = t.R,
      i = r + (n.nextInt(8) - n.nextInt(8)),
      c = s + (n.nextInt(8) - n.nextInt(8)),
      l = a.height("OCEAN_FLOOR", i, c);
    if (a.id(i, l, c) !== WATER || !SOLIDCUBE[a.id(i, l - 1, c)]) return !1;
    return (
      n.nextDouble() < e.raw.probability &&
      a.id(i, l + 1, c) === WATER &&
      void 0 !== BID.tall_seagrass
        ? (a.set(i, l, c, BID.tall_seagrass, 0), a.set(i, l + 1, c, BID.tall_seagrass, 1))
        : void 0 !== BID.seagrass && a.set(i, l, c, BID.seagrass),
      !0
    );
  }),
    (v.kelp = (t, e, n, r, o, s) => {
      const a = t.R,
        i = a.height("OCEAN_FLOOR", r, s);
      if (a.id(r, i, s) !== WATER || void 0 === BID.kelp) return !1;
      const c = 1 + n.nextInt(10);
      let l = 0;
      for (let t = 0; t <= c; t++) {
        const e = i + t;
        if (a.id(r, e, s) !== WATER || a.id(r, e + 1, s) !== WATER) {
          t > 0 && a.set(r, e - 1, s, BID.kelp);
          break;
        }
        if (t === c) {
          (a.set(r, e, s, BID.kelp), l++);
          break;
        }
        (a.set(r, e, s, BID.kelp_plant), l++);
      }
      return l > 0;
    }),
    (v.sea_pickle = (t, e, n, r, o, s) => {
      const a = t.R,
        i = intProvider(e.raw.count)(n);
      let c = 0;
      for (let t = 0; t < i; t++) {
        const t = r + n.nextInt(8) - n.nextInt(8),
          e = s + n.nextInt(8) - n.nextInt(8),
          o = a.height("OCEAN_FLOOR", t, e),
          i = n.nextInt(4) + 1;
        a.id(t, o, e) === WATER &&
          SOLIDCUBE[a.id(t, o - 1, e)] &&
          void 0 !== BID.sea_pickle &&
          (a.set(
            t,
            o,
            e,
            BID.sea_pickle,
            Math.max(
              0,
              BLOCKS[BID.sea_pickle].states.findIndex(
                (t) => t.pickles === String(i) && "true" === t.waterlogged,
              ),
            ),
          ),
          c++);
      }
      return c > 0;
    }),
    (v.underwater_magma = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw,
        c = scanColumn(
          a,
          r,
          o,
          s,
          i.floor_search_range,
          (t) => t === WATER,
          (t) => t !== WATER,
        );
      if (!c || null === c.floor) return !1;
      const l = c.floor,
        u = i.placement_radius_around_floor;
      let f = 0;
      for (let t = -u; t <= u; t++)
        for (let e = -u; e <= u; e++)
          for (let o = -u; o <= u; o++) {
            if (n.nextFloat() >= i.placement_probability_per_valid_position) continue;
            const c = r + o,
              u = l + e,
              _ = s + t,
              h = a.id(c, u, _);
            h !== WATER &&
              0 !== h &&
              SOLIDCUBE[a.id(c, u - 1, _)] &&
              (L.some(([t, e]) => !SOLIDCUBE[a.id(c + t, u, _ + e)]) ||
                (a.set(c, u, _, BID.magma_block), f++));
          }
      return f > 0;
    }));
  const O = ["tube", "brain", "bubble", "fire", "horn"],
    D = [...O.map((t) => t + "_coral"), ...O.map((t) => t + "_coral_fan")],
    R = [
      [0, -1, "north"],
      [1, 0, "east"],
      [0, 1, "south"],
      [-1, 0, "west"],
    ];
  function placeCoralBlock(t, e, n, r, o, s) {
    const a = t.id(n, r, o);
    if ((a !== WATER && !D.some((t) => BID[t] === a)) || t.id(n, r + 1, o) !== WATER) return !1;
    if ((t.set(n, r, o, s), e.nextFloat() < 0.25)) {
      const s = BID[D[e.nextInt(D.length)]];
      void 0 !== s && t.set(n, r + 1, o, s);
    } else if (e.nextFloat() < 0.05 && void 0 !== BID.sea_pickle) {
      const s = BID.sea_pickle;
      t.set(
        n,
        r + 1,
        o,
        s,
        withProp(s, withProp(s, 0, "pickles", e.nextInt(4) + 1), "waterlogged", !0),
      );
    }
    for (const [s, a, i] of R)
      if (e.nextFloat() < 0.2 && t.id(n + s, r, o + a) === WATER) {
        const c = BID[O[e.nextInt(5)] + "_coral_wall_fan"];
        void 0 !== c && t.set(n + s, r, o + a, c, withProp(c, 0, "facing", i));
      }
    return !0;
  }
  const coralFeature = (t) => (e, n, r, o, s, a) => {
    const i = BID[O[r.nextInt(5)] + "_coral_block"];
    return void 0 !== i && t(e.R, r, o, s, a, i);
  };
  function floatProvider(t) {
    if ("number" == typeof t) return () => t;
    t = unwrapProv(t);
    const e = strip(t.type),
      n = Math.fround;
    switch (e) {
      case "constant":
        return () => t.value;
      case "uniform":
        return (e) => n(n(e.nextFloat() * n(t.max_exclusive - t.min_inclusive)) + t.min_inclusive);
      case "clamped_normal":
        return (e) => clamp(n(t.mean + n(n(e.nextGaussian()) * t.deviation)), t.min, t.max);
    }
    throw new Error("float provider " + e);
  }
  ((v.coral_tree = coralFeature((t, e, n, r, o, s) => {
    let a = r;
    const i = e.nextInt(3) + 1;
    for (let r = 0; r < i; r++, a++) if (!placeCoralBlock(t, e, n, a, o, s)) return !0;
    const c = e.nextInt(3) + 2,
      l = shuffled(R, e);
    for (const [r, i] of l.slice(0, c)) {
      let c = n + r,
        l = a,
        u = o + i,
        f = 0;
      const _ = e.nextInt(5) + 2;
      for (let n = 0; n < _ && placeCoralBlock(t, e, c, l, u, s); n++)
        (f++, l++, (0 === n || (f >= 2 && e.nextFloat() < 0.25)) && ((c += r), (u += i), (f = 0)));
    }
    return !0;
  })),
    (v.coral_claw = coralFeature((t, e, n, r, o, s) => {
      if (!placeCoralBlock(t, e, n, r, o, s)) return !1;
      const a = e.nextInt(4),
        i = R[a],
        c = e.nextInt(2) + 2,
        l = shuffled([i, R[(a + 1) & 3], R[(a + 3) & 3]], e);
      for (const a of l.slice(0, c)) {
        let c = n + a[0],
          l = r,
          u = o + a[1];
        const f = e.nextInt(2) + 1;
        let _, h;
        a === i
          ? ((_ = [i[0], 0, i[1]]), (h = e.nextInt(3) + 2))
          : (l++, (_ = 0 === e.nextInt(2) ? [a[0], 0, a[1]] : [0, 1, 0]), (h = e.nextInt(3) + 3));
        for (let n = 0; n < f && placeCoralBlock(t, e, c, l, u, s); n++)
          ((c += _[0]), (l += _[1]), (u += _[2]));
        ((c -= _[0]), (l -= _[1]), (u -= _[2]), l++);
        for (let n = 0; n < h && ((c += i[0]), (u += i[1]), placeCoralBlock(t, e, c, l, u, s)); n++)
          e.nextFloat() < 0.25 && l++;
      }
      return !0;
    })),
    (v.coral_mushroom = coralFeature((t, e, n, r, o, s) => {
      const a = e.nextInt(3) + 3,
        i = e.nextInt(3) + 3,
        c = e.nextInt(3) + 3,
        l = e.nextInt(3) + 1;
      for (let u = 0; u <= i; u++)
        for (let f = 0; f <= a; f++)
          for (let _ = 0; _ <= c; _++) {
            const h = 0 === u || u === i,
              d = 0 === f || f === a,
              p = 0 === _ || _ === c;
            (h && d) ||
              (p && d) ||
              (h && p) ||
              !(h || d || p) ||
              e.nextFloat() < 0.1 ||
              placeCoralBlock(t, e, n + u, r + f - l, o + _, s);
          }
      return !0;
    })),
    (v.blue_ice = (t, e, n, r, o, s) => {
      const a = t.R;
      if (o > 61 || o < a.minY) return !1;
      if (a.id(r, o, s) !== WATER && !a.isAir(r, o, s)) return !1;
      const i = BID.packed_ice,
        c = BID.blue_ice;
      if (
        ![1, -1].some((t) => a.id(r, o + t, s) === i) &&
        !S.some((t) => a.id(r + t[0], o + t[1], s + t[2]) === i)
      )
        return !1;
      a.set(r, o, s, c);
      for (let t = 0; t < 200; t++) {
        const t = n.nextInt(5) - n.nextInt(6);
        let e = 3;
        if ((t < 2 && (e += (t / 2) | 0), e < 1)) continue;
        const l = r + n.nextInt(e) - n.nextInt(e),
          u = o + t,
          f = s + n.nextInt(e) - n.nextInt(e),
          _ = a.id(l, u, f);
        if (0 === _ || _ === WATER || _ === i || _ === BID.ice)
          for (const t of S)
            if (a.id(l + t[0], u + t[1], f + t[2]) === c) {
              a.set(l, u, f, c);
              break;
            }
      }
      return !0;
    }),
    (v.iceberg = (t, e, n, r, o, s) => {
      const a = t.R,
        i = stateOf(e.raw.state);
      const c = n.nextDouble() > 0.7,
        l = c ? n.nextInt(14) + 12 : n.nextInt(7) + 4,
        u = c ? n.nextInt(16) + 4 : n.nextInt(3) + 3,
        f = c ? n.nextInt(5) + 6 : n.nextInt(3) + 3;
      for (let t = -u; t <= l; t++) {
        const e = t >= 0 ? 1 - t / (l + 1) : 1 - -t / (u + 1),
          o = f * Math.sqrt(Math.max(0, e));
        for (let e = -f; e <= f; e++)
          for (let c = -f; c <= f; c++) {
            if (e * e + c * c > o * o + 2 * n.nextFloat()) continue;
            const u = a.id(r + e, 63 + t, s + c);
            (0 !== u && u !== WATER && u !== BID.ice && u !== BID.snow_block) ||
              a.setState(
                r + e,
                63 + t,
                s + c,
                t > l - 3 && 0 === n.nextInt(3) ? [BID.snow_block, 0] : i,
              );
          }
      }
      return !0;
    }),
    (v.geode = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw,
        c = i.blocks,
        l = i.layers || {},
        u = i.crack || {},
        f = i.min_gen_offset ?? -16,
        _ = i.max_gen_offset ?? 16,
        h = intProvider(
          i.outer_wall_distance || { type: "uniform", min_inclusive: 4, max_inclusive: 5 },
        ),
        d = i.outer_wall_distance ? unwrapProv(i.outer_wall_distance).max_inclusive : 5,
        p = intProvider(i.point_offset || { type: "uniform", min_inclusive: 1, max_inclusive: 2 }),
        m = intProvider(
          i.distribution_points || { type: "uniform", min_inclusive: 3, max_inclusive: 4 },
        )(n),
        g = once(e, "n", () =>
          legacyNormalNoise(BigInt(t.seed), { firstOctave: -4, amplitudes: [1] }),
        ),
        x = m / d,
        I = 1 / Math.sqrt(l.filling ?? 1.7),
        w = 1 / Math.sqrt((l.inner_layer ?? 2.2) + x),
        v = 1 / Math.sqrt((l.middle_layer ?? 3.2) + x),
        b = 1 / Math.sqrt((l.outer_layer ?? 4.2) + x),
        S = 1 / Math.sqrt((u.base_crack_size ?? 2) + n.nextDouble() / 2 + (m > 3 ? x : 0)),
        k = n.nextFloat() < (u.generate_crack_chance ?? 1),
        y = u.crack_point_offset ?? 2,
        A = once(e, "i", () => tagSet(c.invalid_blocks || "geode_invalid_blocks")),
        M = once(e, "c", () => tagSet(c.cannot_replace || "features_cannot_replace")),
        O = [];
      let D = 0;
      for (let t = 0; t < m; t++) {
        const t = h(n),
          e = h(n),
          c = h(n),
          l = a.id(r + t, o + e, s + c);
        if ((0 === l || A.has(l)) && ++D > (i.invalid_blocks_threshold ?? 0)) return !1;
        O.push([r + t, o + e, s + c, p(n)]);
      }
      const R = [];
      if (k) {
        const t = 2 * m + 1,
          e = [
            [t, 0],
            [0, t],
            [t, t],
            [0, 0],
          ][n.nextInt(4)];
        for (const t of [7, 5, 1]) R.push([r + e[0], o + t, s + e[1]]);
      }
      const prov = (t) => provider(t),
        L = once(e, "p", () => ({
          fill: prov(c.filling_provider),
          inner: prov(c.inner_layer_provider),
          alt: prov(c.alternate_inner_layer_provider),
          mid: prov(c.middle_layer_provider),
          out: prov(c.outer_layer_provider),
          buds: c.inner_placements.map(stateOf),
        })),
        safeSet = (t, e, n, r) => {
          M.has(a.id(t, e, n)) || a.setState(t, e, n, r);
        },
        E = i.use_alternate_layer0_chance ?? 0,
        C = i.placements_require_layer0_alternate ?? !0,
        F = i.use_potential_placements_chance ?? 0.35,
        P = i.noise_multiplier ?? 0.05,
        W = [];
      for (let t = s + f; t <= s + _; t++)
        for (let e = o + f; e <= o + _; e++)
          for (let o = r + f; o <= r + _; o++) {
            const r = g.get(o, e, t) * P;
            let s = 0,
              i = 0;
            for (const n of O)
              s += 1 / Math.sqrt((n[0] - o) ** 2 + (n[1] - e) ** 2 + (n[2] - t) ** 2 + n[3]) + r;
            for (const n of R)
              i += 1 / Math.sqrt((n[0] - o) ** 2 + (n[1] - e) ** 2 + (n[2] - t) ** 2 + y) + r;
            if (!(s < b))
              if (k && i >= S && s < I) safeSet(o, e, t, [0, 0]);
              else if (s >= I) safeSet(o, e, t, L.fill(n, o, e, t, a));
              else {
                if (s >= w) {
                  const r = n.nextFloat() < E;
                  if (
                    (safeSet(o, e, t, r ? L.alt(n, o, e, t, a) : L.inner(n, o, e, t, a)),
                    (C && !r) || !(n.nextFloat() < F))
                  )
                    continue;
                  W.push([o, e, t]);
                  continue;
                }
                safeSet(o, e, t, s >= v ? L.mid(n, o, e, t, a) : L.out(n, o, e, t, a));
              }
          }
      const T = [
        ["down", 0, -1, 0],
        ["up", 0, 1, 0],
        ["north", 0, 0, -1],
        ["south", 0, 0, 1],
        ["west", -1, 0, 0],
        ["east", 1, 0, 0],
      ];
      for (const [t, e, r] of W) {
        const o = L.buds[n.nextInt(L.buds.length)];
        if (o)
          for (const [n, s, i, c] of T) {
            const l = a.id(t + s, e + i, r + c);
            if (0 === l || (l === WATER && 0 === a.meta(t + s, e + i, r + c))) {
              safeSet(t + s, e + i, r + c, [o[0], withProp(o[0], o[1], "facing", n)]);
              break;
            }
          }
      }
      return !0;
    }));
  const emptyOrWater = (t) => 0 === t || t === WATER,
    fluidWater = (t, e, n, r) => {
      const o = t.id(e, n, r);
      if (o === WATER) return !0;
      const s = _.has(o) && t.chunk(e, r);
      return !!(s && s.wl && s.wl.has(((n - t.minY) << 8) | ((15 & r) << 4) | (15 & e)));
    },
    emptyOrWaterOrLava = (t) => 0 === t || t === WATER || t === LAVA;
  function scanColumn(t, e, n, r, o, s, a) {
    if (!s(t.id(e, n, r))) return null;
    const dir = (i) => {
        let c = n;
        for (let n = 1; n < o && s(t.id(e, c, r)); n++) c += i;
        return a(t.id(e, c, r)) ? c : null;
      },
      i = dir(1);
    return { floor: dir(-1), ceiling: i };
  }
  const speleoBlocks = (t) =>
      once(t, "blocks", () => {
        const e = stateOf(t.raw.base_block),
          n = stateOf(t.raw.pointed_block);
        return e && n && BLOCKS[n[0]].states
          ? [e[0], n[0], blockSet(t.raw.replaceable_blocks)]
          : null;
      }),
    isBase = (t, e) => t === e[0] || e[2].has(t);
  function placeBaseBlock(t, e, n, r, o) {
    return !!o[2].has(t.id(e, n, r)) && (t.set(e, n, r, o[0]), !0);
  }
  function growSpeleothem(t, e, n, r, o, s, a, i) {
    if (!isBase(t.id(e, n - o, r), i)) return;
    const c = [];
    if (s >= 3) {
      c.push("base");
      for (let t = 0; t < s - 3; t++) c.push("middle");
    }
    (s >= 2 && c.push("frustum"),
      s >= 1 && c.push(a ? "tip_merge" : "tip"),
      c.forEach((s, a) =>
        t.set(
          e,
          n + a * o,
          r,
          i[1],
          ((t, e, n) =>
            Math.max(
              0,
              BLOCKS[t].states.findIndex(
                (t) => t.thickness === n && t.vertical_direction === (e > 0 ? "up" : "down"),
              ),
            ))(i[1], o, s),
        ),
      ));
  }
  const L = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ],
    E = [
      [0, -1, 0],
      [0, 1, 0],
      [0, 0, -1],
      [0, 0, 1],
      [-1, 0, 0],
      [1, 0, 0],
    ];
  ((v.pointed_dripstone = v.speleothem =
    (t, e, n, r, o, s) => {
      const a = t.R,
        i = speleoBlocks(e),
        c = e.raw;
      if (!i) return !1;
      const l = isBase(a.id(r, o + 1, s), i),
        u = isBase(a.id(r, o - 1, s), i);
      if (!l && !u) return !1;
      const f = l && u ? (n.nextBoolean() ? -1 : 1) : l ? -1 : 1,
        _ = c.chance_of_directional_spread ?? 0.7,
        h = c.chance_of_spread_radius2 ?? 0.5,
        d = c.chance_of_spread_radius3 ?? 0.5,
        p = r,
        m = o - f,
        g = s;
      placeBaseBlock(a, p, m, g, i);
      for (const [t, e] of L) {
        if (n.nextFloat() > _) continue;
        const r = p + t,
          o = g + e;
        if ((placeBaseBlock(a, r, m, o, i), n.nextFloat() > h)) continue;
        const s = E[n.nextInt(6)],
          c = r + s[0],
          l = m + s[1],
          u = o + s[2];
        if ((placeBaseBlock(a, c, l, u, i), n.nextFloat() > d)) continue;
        const f = E[n.nextInt(6)];
        placeBaseBlock(a, c + f[0], l + f[1], u + f[2], i);
      }
      const x =
        n.nextFloat() < (c.chance_of_taller_generation ?? 0.2) && emptyOrWater(a.id(r, o + f, s))
          ? 2
          : 1;
      return (growSpeleothem(a, r, o, s, f, x, !1, i), !0);
    }),
    (v.dripstone_cluster = v.speleothem_cluster =
      (t, e, n, r, o, s) => {
        const a = t.R,
          i = speleoBlocks(e),
          c = e.raw;
        if (!i || !emptyOrWater(a.id(r, o, s))) return !1;
        const l = once(e, "prov", () => ({
            height: intProvider(c.height),
            wet: floatProvider(c.wetness),
            dens: floatProvider(c.density),
            rad: intProvider(c.radius),
            layer: intProvider(c.speleothem_block_layer_thickness),
          })),
          u = l.height(n),
          f = l.wet(n),
          _ = l.dens(n),
          h = l.rad(n),
          d = l.rad(n),
          p = c.floor_to_ceiling_search_range,
          m = c.max_stalagmite_stalactite_height_diff,
          isLava = (t, e, n) => a.id(t, e, n) === LAVA,
          g = tagSet("base_stone_overworld"),
          stoneOrWater = (t, e, n) => g.has(a.id(t, e, n)) || fluidWater(a, t, e, n),
          canPool = (t, e, n) => {
            const r = a.id(t, e, n);
            if (r === WATER || r === i[0] || r === i[1] || fluidWater(a, t, e + 1, n)) return !1;
            for (const [r, o] of L) if (!stoneOrWater(t + r, e, n + o)) return !1;
            return stoneOrWater(t, e - 1, n);
          },
          spHeight = (t, e, r) => {
            if (n.nextFloat() > _) return 0;
            const o = Math.abs(t) + Math.abs(e),
              s = WG.clampedMap(o, 0, c.max_distance_from_center_affecting_height_bias, r / 2, 0);
            return Math.trunc(
              clamp(
                Math.fround(s + Math.fround(Math.fround(n.nextGaussian()) * c.height_deviation)),
                0,
                r,
              ),
            );
          };
        for (let t = -h; t <= h; t++)
          for (let e = -d; e <= d; e++) {
            const _ = Math.min(h - Math.abs(t), d - Math.abs(e)),
              g = WG.clampedMap(
                _,
                0,
                c.max_distance_from_edge_affecting_chance_of_speleothem,
                c.chance_of_speleothem_at_max_distance_from_center,
                1,
              ),
              x = r + t,
              I = s + e,
              w = scanColumn(a, x, o, I, p, emptyOrWater, (t) => !emptyOrWater(t));
            if (!w) continue;
            const v = w.ceiling;
            let b = w.floor;
            if (null === v && null === b) continue;
            n.nextFloat() < f && null !== b && canPool(x, b, I) && (a.set(x, b, I, WATER), b--);
            let S = 0,
              k = 0;
            if (n.nextDouble() < g && null !== v && !isLava(x, v, I)) {
              const r = l.layer(n);
              for (let t = 0; t < r && placeBaseBlock(a, x, v + t, I, i); t++);
              S = spHeight(t, e, null !== b ? Math.min(u, v - b) : u);
            }
            if (n.nextDouble() < g && null !== b && !isLava(x, b, I)) {
              const r = l.layer(n);
              for (let t = 0; t < r && placeBaseBlock(a, x, b - t, I, i); t++);
              k = null !== v ? Math.max(0, S + n.nextInt(2 * m + 1) - m) : spHeight(t, e, u);
            }
            let y = S,
              A = k;
            if (null !== v && null !== b && v - S <= b + k) {
              const t = Math.max(v - S, b + 1),
                e = Math.min(b + k, v - 1),
                r = n.nextInt(e + 1 - t + 1) + t;
              ((y = v - r), (A = r - 1 - b));
            }
            const M =
              n.nextBoolean() && y > 0 && A > 0 && null !== v && null !== b && y + A === v - b - 1;
            (null !== v && growSpeleothem(a, x, v - 1, I, -1, y, M, i),
              null !== b && growSpeleothem(a, x, b + 1, I, 1, A, M, i));
          }
        return !0;
      }),
    (v.large_dripstone = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw,
        c = BID.dripstone_block;
      if (void 0 === c || !emptyOrWater(a.id(r, o, s))) return !1;
      const l = once(e, "repl", () => blockSet(i.replaceable_blocks)),
        u = tagSet("base_stone_overworld"),
        f = scanColumn(
          a,
          r,
          o,
          s,
          i.floor_to_ceiling_search_range ?? 30,
          emptyOrWater,
          (t) => t === c || l.has(t) || t === LAVA,
        );
      if (!f || null === f.floor || null === f.ceiling) return !1;
      const _ = f.ceiling - f.floor - 1;
      if (_ < 4) return !1;
      const h = once(e, "prov", () => ({
          tite: floatProvider(i.stalactite_bluntness),
          mite: floatProvider(i.stalagmite_bluntness),
          scale: floatProvider(i.height_scale),
          wind: floatProvider(i.wind_speed),
        })),
        d = i.column_radius,
        p = d.min_inclusive,
        m = d.max_inclusive,
        g = clamp(Math.trunc(_ * Math.fround(i.max_column_radius_to_cave_height_ratio)), p, m),
        x = n.nextInt(g - p + 1) + p,
        make = (t, e, o) => ({
          x: r,
          y: t,
          z: s,
          up: e,
          radius: x,
          blunt: o(n),
          scale: h.scale(n),
        }),
        I = make(f.ceiling - 1, !1, h.tite),
        w = make(f.floor + 1, !0, h.mite),
        heightAt = (t, e) => {
          const n = ((e < t.blunt ? t.blunt : e) / t.radius) * 0.384,
            r = t.scale * (0.75 * Math.pow(n, 4 / 3) - Math.pow(n, 2 / 3) - Math.log(n) / 3);
          return Math.trunc((Math.max(r, 0) / 0.384) * t.radius);
        },
        windy = (t) => t.radius >= i.min_radius_for_wind && t.blunt >= i.min_bluntness_for_wind;
      let v = null;
      if (windy(I) && windy(w)) {
        const t = h.wind(n),
          e = Math.fround(n.nextFloat() * Math.fround(Math.PI));
        v = { oy: o, wx: mcos(e) * t, wz: msin(e) * t, max: 16 - x };
      }
      const off = (t, e, n) => {
          if (!v) return [t, e, n];
          const r = v.oy - e;
          return [
            t + clamp(Math.floor(v.wx * r), -v.max, v.max),
            e,
            n + clamp(Math.floor(v.wz * r), -v.max, v.max),
          ];
        },
        embedded = (t, e, n, r) => {
          if (emptyOrWaterOrLava(a.id(t, e, n))) return !1;
          const o = Math.fround(6 / r);
          for (let s = 0; s < Math.fround(2 * Math.PI); s = Math.fround(s + o))
            if (
              emptyOrWaterOrLava(a.id(t + Math.trunc(mcos(s) * r), e, n + Math.trunc(msin(s) * r)))
            )
              return !1;
          return !0;
        },
        settle = (t) => {
          for (; t.radius > 1;) {
            let e = t.y;
            const n = Math.min(10, heightAt(t, 0));
            for (let r = 0; r < n; r++) {
              if (a.id(t.x, e, t.z) === LAVA) return !1;
              const [n, r, o] = off(t.x, e, t.z);
              if (embedded(n, r, o, t.radius)) return ((t.y = e), !0);
              e += t.up ? -1 : 1;
            }
            t.radius = t.radius >> 1;
          }
          return !1;
        },
        place = (t) => {
          for (let e = -t.radius; e <= t.radius; e++)
            for (let r = -t.radius; r <= t.radius; r++) {
              const o = Math.fround(Math.sqrt(e * e + r * r));
              if (o > t.radius) continue;
              let s = heightAt(t, o);
              if (s <= 0) continue;
              n.nextFloat() < 0.2 &&
                (s = Math.trunc(s * Math.fround(Math.fround(0.2 * n.nextFloat()) + 0.8)));
              let i = t.y,
                l = !1;
              const f = t.up ? a.height("WORLD_SURFACE_WG", t.x + e, t.z + r) : 1 / 0;
              for (let n = 0; n < s && i < f; n++) {
                const [n, o, s] = off(t.x + e, i, t.z + r),
                  f = a.id(n, o, s);
                if (emptyOrWaterOrLava(f)) ((l = !0), a.set(n, o, s, c));
                else if (l && u.has(f)) break;
                i += t.up ? 1 : -1;
              }
            }
        },
        b = settle(I),
        S = settle(w);
      return (b && place(I), S && place(w), !0);
    }),
    (v.sculk_patch = (t, e, n, r, o, s) => {
      const a = t.R,
        i = BID.sculk,
        c = e.raw;
      if (void 0 === i) return !1;
      const l = a.id(r, o, s);
      if (
        l !== i &&
        l !== BID.sculk_vein &&
        l !== BID.sculk_catalyst &&
        0 !== l &&
        (l !== WATER || 0 !== a.meta(r, o, s))
      )
        return !1;
      if (
        l !== i &&
        l !== BID.sculk_vein &&
        l !== BID.sculk_catalyst &&
        !E.some(([t, e, n]) => SOLIDCUBE[a.id(r + t, o + e, s + n)])
      )
        return !1;
      const u = tagSet("sculk_replaceable_world_gen"),
        f = [],
        _ =
          (c.spread_attempts || 32) * Math.max(1, (c.spread_rounds || 0) + (c.growth_rounds || 0));
      for (let t = 0; t < _; t++) {
        const t = r + n.nextInt(9) - 4,
          e = s + n.nextInt(9) - 4;
        let c = o;
        for (let n = 0; n < 6 && a.isAir(t, c, e); n++) c--;
        const l = a.id(t, c, e);
        (l === i || (u.has(l) && SOLIDCUBE[l])) &&
          (l !== i && a.set(t, c, e, i), f.push([t, c, e]));
      }
      const h = BID.sculk_sensor,
        d = BID.sculk_shrieker,
        growthsNear = (t, e, n) => {
          let r = 0;
          for (let o = -4; o <= 4; o++)
            for (let s = 0; s <= 2; s++)
              for (let i = -4; i <= 4; i++) {
                const c = a.id(t + o, e + s, n + i);
                (c !== h && c !== d) || r++;
              }
          return r;
        },
        p = c.amount_per_charge || 32;
      if (f.length && void 0 !== h && void 0 !== d)
        for (let t = 0; t < (c.charge_count || 1); t++) {
          const [t, e, i] = f[n.nextInt(f.length)];
          if ((t - r) ** 2 + (e - o) ** 2 + (i - s) ** 2 < 1) continue;
          const c = a.id(t, e + 1, i);
          (0 !== c && c !== WATER) ||
            growthsNear(t, e, i) > 2 ||
            n.nextInt(50) >= p ||
            (0 === n.nextInt(11)
              ? a.set(t, e + 1, i, d, withProp(d, 0, "can_summon", !0))
              : a.set(t, e + 1, i, h, withProp(h, 0, "sculk_sensor_phase", "inactive")));
        }
      n.nextFloat() <= (c.catalyst_chance ?? 0.5) &&
        SOLIDCUBE[a.id(r, o - 1, s)] &&
        void 0 !== BID.sculk_catalyst &&
        a.set(r, o, s, BID.sculk_catalyst);
      const m = c.extra_rare_growths ? intProvider(c.extra_rare_growths)(n) : 0;
      for (let t = 0; t < m && void 0 !== d; t++) {
        const t = r + n.nextInt(5) - 2,
          e = s + n.nextInt(5) - 2;
        a.isAir(t, o, e) &&
          SOLIDCUBE[a.id(t, o - 1, e)] &&
          a.set(t, o, e, d, withProp(d, 0, "can_summon", !0));
      }
      return !0;
    }),
    (v.monster_room = (t, e, n, r, o, s) => {
      const a = t.R,
        i = n.nextInt(2) + 2,
        c = -i - 1,
        l = i + 1,
        u = n.nextInt(2) + 2,
        f = -u - 1,
        _ = u + 1;
      let h = 0;
      for (let t = c; t <= l; t++)
        for (let e = -1; e <= 4; e++)
          for (let n = f; n <= _; n++) {
            const i = a.id(r + t, o + e, s + n),
              u = BLOCKS[i] && BLOCKS[i].solid;
            if (-1 === e && !u) return !1;
            if (4 === e && !u) return !1;
            (t === c || t === l || n === f || n === _) &&
              0 === e &&
              a.isAir(r + t, o + e, s + n) &&
              a.isAir(r + t, o + e + 1, s + n) &&
              h++;
          }
      if (h < 1 || h > 5) return !1;
      for (let t = c; t <= l; t++)
        for (let e = 3; e >= -1; e--)
          for (let i = f; i <= _; i++) {
            const u = r + t,
              h = o + e,
              d = s + i,
              p = a.id(u, h, d);
            if (t === c || -1 === e || i === f || t === l || 4 === e || i === _) {
              if (h >= a.minY && (!BLOCKS[a.id(u, h - 1, d)] || !BLOCKS[a.id(u, h - 1, d)].solid)) {
                a.set(u, h, d, 0);
                continue;
              }
              if (!BLOCKS[p] || !BLOCKS[p].solid || p === BID.chest) continue;
              a.set(
                u,
                h,
                d,
                -1 === e && 0 !== n.nextInt(4) ? BID.mossy_cobblestone : BID.cobblestone,
              );
            } else p !== BID.chest && p !== BID.spawner && a.set(u, h, d, 0);
          }
      for (let t = 0; t < 2; t++)
        for (let t = 0; t < 3; t++) {
          const t = r + n.nextInt(2 * i + 1) - i,
            e = s + n.nextInt(2 * u + 1) - u;
          if (!a.isAir(t, o, e)) continue;
          let c = 0;
          for (const [n, r] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ])
            BLOCKS[a.id(t + n, o, e + r)] && BLOCKS[a.id(t + n, o, e + r)].solid && c++;
          if (1 === c) {
            a.set(t, o, e, BID.chest, 12);
            break;
          }
        }
      return (a.set(r, o, s, BID.spawner, [1, 0, 0, 2][n.nextInt(4)]), !0);
    }));
  const mthNext = (t, e, n) => (e >= n ? e : t.nextInt(n - e + 1) + e),
    C = [
      [0, -1, 0],
      [0, 1, 0],
      [0, 0, -1],
      [0, 0, 1],
      [-1, 0, 0],
      [1, 0, 0],
    ];
  function weepingColumn(t, e, n, r, o, s, a, i, c, l, u) {
    for (let f = c < 0 ? 0 : 1; f <= s; f++) {
      if (t.isAir(n, r, o)) {
        if (f === s || !t.isAir(n, r + c, o)) {
          t.set(
            n,
            r,
            o,
            l,
            Math.max(
              0,
              BLOCKS[l].states
                ? BLOCKS[l].states.findIndex((t) => t.age === String(mthNext(e, a, i)))
                : 0,
            ),
          );
          break;
        }
        t.set(n, r, o, u);
      }
      r += c;
    }
  }
  ((v.glowstone_blob = (t, e, n, r, o, s) => {
    const a = t.R,
      i = BID.glowstone;
    if (!a.isAir(r, o, s)) return !1;
    const c = a.id(r, o + 1, s);
    if (c !== BID.netherrack && c !== BID.basalt && c !== BID.blackstone) return !1;
    a.set(r, o, s, i);
    for (let t = 0; t < 1500; t++) {
      const t = r + n.nextInt(8) - n.nextInt(8),
        e = o - n.nextInt(12),
        c = s + n.nextInt(8) - n.nextInt(8);
      if (!a.isAir(t, e, c)) continue;
      let l = 0;
      for (const n of C) if ((a.id(t + n[0], e + n[1], c + n[2]) === i && l++, l > 1)) break;
      1 === l && a.set(t, e, c, i);
    }
    return !0;
  }),
    (v.netherrack_replace_blobs = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw,
        c = stateOf(i.target)[0],
        l = stateOf(i.state),
        u = intProvider(i.radius);
      for (o = clamp(o, a.minY + 1, a.maxY - 1); o > a.minY + 1 && a.id(r, o, s) !== c;) o--;
      if (a.id(r, o, s) !== c) return !1;
      const f = u(n),
        _ = u(n),
        h = u(n),
        d = Math.max(f, _, h);
      let p = !1;
      for (let t = -f; t <= f; t++)
        for (let e = -_; e <= _; e++)
          for (let n = -h; n <= h; n++)
            Math.abs(t) + Math.abs(e) + Math.abs(n) > d ||
              (a.id(r + t, o + e, s + n) === c && (a.setState(r + t, o + e, s + n, l), (p = !0)));
      return p;
    }),
    (v.weeping_vines = (t, e, n, r, o, s) => {
      const a = t.R,
        i = BID.netherrack,
        c = BID.nether_wart_block;
      if (!a.isAir(r, o, s)) return !1;
      const l = a.id(r, o + 1, s);
      if (l !== i && l !== c) return !1;
      a.set(r, o, s, c);
      for (let t = 0; t < 200; t++) {
        const t = r + n.nextInt(6) - n.nextInt(6),
          e = o + n.nextInt(2) - n.nextInt(5),
          l = s + n.nextInt(6) - n.nextInt(6);
        if (!a.isAir(t, e, l)) continue;
        let u = 0;
        for (const n of C) {
          const r = a.id(t + n[0], e + n[1], l + n[2]);
          if (((r !== i && r !== c) || u++, u > 1)) break;
        }
        1 === u && a.set(t, e, l, c);
      }
      for (let t = 0; t < 100; t++) {
        const t = r + n.nextInt(8) - n.nextInt(8),
          e = o + n.nextInt(2) - n.nextInt(7),
          l = s + n.nextInt(8) - n.nextInt(8);
        if (!a.isAir(t, e, l)) continue;
        const u = a.id(t, e + 1, l);
        if (u !== i && u !== c) continue;
        let f = mthNext(n, 1, 8);
        (0 === n.nextInt(6) && (f *= 2),
          0 === n.nextInt(5) && (f = 1),
          weepingColumn(a, n, t, e, l, f, 17, 25, -1, BID.weeping_vines, BID.weeping_vines_plant));
      }
      return !0;
    }),
    (v.twisting_vines = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw,
        c = i.spread_width,
        l = i.spread_height,
        u = i.max_height,
        invalid = (t, e, n) => {
          if (!a.isAir(t, e, n)) return !0;
          const r = a.id(t, e - 1, n);
          return r !== BID.netherrack && r !== BID.warped_nylium && r !== BID.warped_wart_block;
        };
      if (invalid(r, o, s)) return !1;
      for (let t = 0; t < c * c; t++) {
        let t = r + mthNext(n, -c, c),
          e = o + mthNext(n, -l, l),
          i = s + mthNext(n, -c, c),
          f = !0;
        do {
          if ((e--, e < a.minY || e >= a.maxY)) {
            f = !1;
            break;
          }
        } while (a.isAir(t, e, i));
        if (!f) continue;
        if ((e++, invalid(t, e, i))) continue;
        let _ = mthNext(n, 1, u);
        (0 === n.nextInt(6) && (_ *= 2),
          0 === n.nextInt(5) && (_ = 1),
          weepingColumn(a, n, t, e, i, _, 17, 25, 1, BID.twisting_vines, BID.twisting_vines_plant));
      }
      return !0;
    }),
    (v.nether_forest_vegetation = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw,
        c = once(e, "p", () => provider(i.state_provider)),
        l = i.spread_width,
        u = i.spread_height;
      if (!tagSet("nylium").has(a.id(r, o - 1, s))) return !1;
      if (o < a.minY + 1 || o + 1 > a.maxY) return !1;
      let f = 0;
      for (let t = 0; t < l * l; t++) {
        const t = r + n.nextInt(l) - n.nextInt(l),
          e = o + n.nextInt(u) - n.nextInt(u),
          i = s + n.nextInt(l) - n.nextInt(l),
          _ = c(n, t, e, i, a);
        a.isAir(t, e, i) &&
          !(e <= a.minY) &&
          _ &&
          canSurvive(a, _[0], _[1], t, e, i) &&
          (a.set(t, e, i, _[0], _[1]), f++);
      }
      return f > 0;
    }),
    (v.huge_fungus = (t, e, n, r, o, s) => {
      const a = t.R,
        i = e.raw,
        c = stateOf(i.valid_base_block)[0],
        l = stateOf(i.stem_state),
        u = stateOf(i.hat_state),
        f = stateOf(i.decor_state),
        _ = once(e, "r", () => predicate(i.replaceable_blocks));
      if (a.id(r, o - 1, s) !== c) return !1;
      let h = mthNext(n, 4, 13);
      if ((0 === n.nextInt(12) && (h *= 2), !i.planted && o + h + 1 >= a.maxY)) return !1;
      const d = !i.planted && n.nextFloat() < 0.06;
      a.set(r, o, s, 0);
      const canRepl = (t, e, n, r) => {
          const o = a.id(t, e, n);
          return !(0 !== o && !IS_FLUID[o] && !REPLACEABLE[o]) || (!!r && _(a, t, e, n));
        },
        p = d ? 1 : 0;
      for (let t = -p; t <= p; t++)
        for (let e = -p; e <= p; e++) {
          const i = d && Math.abs(t) === p && Math.abs(e) === p;
          for (let c = 0; c < h; c++)
            canRepl(r + t, o + c, s + e, !0) &&
              (!i || n.nextFloat() < 0.1) &&
              a.setState(r + t, o + c, s + e, l);
        }
      const m = u[0] === BID.nether_wart_block,
        vines = (t, e, r) => {
          if (!a.isAir(t, e - 1, r)) return;
          let o = mthNext(n, 1, 5);
          (0 === n.nextInt(7) && (o *= 2),
            weepingColumn(
              a,
              n,
              t,
              e - 1,
              r,
              o,
              23,
              25,
              -1,
              BID.weeping_vines,
              BID.weeping_vines_plant,
            ));
        },
        hatBlock = (t, e, r, o, s, i) => {
          n.nextFloat() < o
            ? a.setState(t, e, r, f)
            : n.nextFloat() < s && (a.setState(t, e, r, u), n.nextFloat() < i && vines(t, e, r));
        },
        g = Math.min(n.nextInt(1 + ((h / 3) | 0)) + 5, h),
        x = h - g;
      for (let t = x; t <= h; t++) {
        let e = t < h - n.nextInt(3) ? 2 : 1;
        (g > 8 && t < x + 4 && (e = 3), d && e++);
        for (let i = -e; i <= e; i++)
          for (let c = -e; c <= e; c++) {
            const l = i === -e || i === e,
              f = c === -e || c === e,
              _ = !l && !f && t !== h,
              d = l && f,
              p = t < x + 3,
              g = r + i,
              I = o + t,
              w = s + c;
            if (canRepl(g, I, w, !1))
              if (p) {
                if (_) continue;
                a.id(g, I - 1, w) === u[0]
                  ? a.setState(g, I, w, u)
                  : n.nextFloat() < 0.15 &&
                    (a.setState(g, I, w, u), m && 0 === n.nextInt(11) && vines(g, I, w));
              } else
                _
                  ? hatBlock(g, I, w, 0.1, 0.2, m ? 0.1 : 0)
                  : d
                    ? hatBlock(g, I, w, 0.01, 0.7, m ? 0.083 : 0)
                    : hatBlock(g, I, w, 5e-4, 0.98, m ? 0.07 : 0);
          }
      }
      return !0;
    }));
  const DELTA_NO = () =>
    new Set(
      [
        "bedrock",
        "nether_bricks",
        "nether_brick_fence",
        "nether_brick_stairs",
        "nether_wart",
        "chest",
        "spawner",
      ].map((t) => BID[t]),
    );
  ((v.delta_feature = (t, e, n, r, o, s) => {
    const a = t.R,
      i = e.raw,
      c = stateOf(i.contents),
      l = stateOf(i.rim),
      u = intProvider(i.size),
      f = intProvider(i.rim_size),
      _ = once(e, "n", DELTA_NO),
      clear = (t, e, n) => {
        const r = a.id(t, e, n);
        if (r === c[0] || _.has(r)) return !1;
        for (const r of C) {
          const o = a.isAir(t + r[0], e + r[1], n + r[2]),
            s = 1 === r[1];
          if ((o && !s) || (!o && s)) return !1;
        }
        return !0;
      },
      h = n.nextDouble() < 0.9,
      d = h ? f(n) : 0,
      p = h ? f(n) : 0,
      m = h && 0 !== d && 0 !== p,
      g = u(n),
      x = u(n),
      I = Math.max(g, x),
      w = [];
    for (let t = -g; t <= g; t++)
      for (let e = -x; e <= x; e++) w.push([t, e, Math.abs(t) + Math.abs(e)]);
    w.sort((t, e) => t[2] - e[2]);
    let v = !1;
    for (const [t, e, n] of w) {
      if (n > I) break;
      const i = r + t,
        u = s + e;
      clear(i, o, u) &&
        (m && ((v = !0), a.setState(i, o, u, l)),
        clear(i + d, o, u + p) && ((v = !0), a.setState(i + d, o, u + p, c)));
    }
    return v;
  }),
    (v.basalt_pillar = (t, e, n, r, o, s) => {
      const a = t.R,
        i = BID.basalt;
      if (!a.isAir(r, o, s) || a.isAir(r, o + 1, s)) return !1;
      let c = o,
        l = !0,
        u = !0,
        f = !0,
        _ = !0;
      const hang = (t, e, r) => 0 !== n.nextInt(10) && (a.set(t, e, r, i), !0);
      for (; a.isAir(r, c, s);) {
        if (c < a.minY || c >= a.maxY) return !0;
        (a.set(r, c, s, i),
          (l = l && hang(r, c, s - 1)),
          (u = u && hang(r, c, s + 1)),
          (f = f && hang(r - 1, c, s)),
          (_ = _ && hang(r + 1, c, s)),
          c--);
      }
      c++;
      for (const [t, e] of [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ])
        n.nextBoolean() && a.set(r + t, c, s + e, i);
      c--;
      for (let t = -3; t < 4; t++)
        for (let e = -3; e < 4; e++) {
          const o = Math.abs(t) * Math.abs(e);
          if (n.nextInt(10) >= 10 - o) continue;
          let l = c,
            u = 3;
          for (; a.isAir(r + t, l - 1, s + e) && (l--, --u > 0););
          a.isAir(r + t, l - 1, s + e) || a.set(r + t, l, s + e, i);
        }
      return !0;
    }));
  const COLUMN_NO = () =>
    new Set(
      [
        "lava",
        "bedrock",
        "magma_block",
        "soul_sand",
        "nether_bricks",
        "nether_brick_fence",
        "nether_brick_stairs",
        "nether_wart",
        "chest",
        "spawner",
      ].map((t) => ("lava" === t ? LAVA : BID[t])),
    );
  v.basalt_columns = (t, e, n, r, o, s) => {
    const a = t.R,
      i = e.raw,
      c = BID.basalt,
      l = once(e, "n", COLUMN_NO),
      u = intProvider(i.height),
      f = intProvider(i.reach),
      airOrLava = (t, e, n) => {
        const r = a.id(t, e, n);
        return 0 === r || (r === LAVA && e <= 32);
      },
      canPlaceAt = (t, e, n) => {
        if (!airOrLava(t, e, n)) return !1;
        const r = a.id(t, e - 1, n);
        return 0 !== r && !l.has(r);
      };
    if (!canPlaceAt(r, o, s)) return !1;
    const _ = u(n),
      h = n.nextFloat() < 0.9,
      d = Math.min(_, h ? 5 : 8),
      p = h ? 50 : 15;
    let m = !1;
    for (let t = 0; t < p; t++) {
      const t = r - d + n.nextInt(2 * d + 1),
        e = o + n.nextInt(1),
        i = s - d + n.nextInt(2 * d + 1),
        u = _ - (Math.abs(t - r) + Math.abs(e - o) + Math.abs(i - s));
      if (u < 0) continue;
      const h = f(n);
      for (let n = -h; n <= h; n++)
        for (let r = -h; r <= h; r++) {
          const o = t + n,
            s = i + r,
            f = Math.abs(n) + Math.abs(r);
          let _ = e,
            h = null;
          if (airOrLava(o, _, s)) {
            let t = f;
            for (; _ > a.minY + 1 && t > 0;) {
              if ((t--, canPlaceAt(o, _, s))) {
                h = _;
                break;
              }
              _--;
            }
          } else {
            let t = f;
            for (; _ <= a.maxY && t > 0;) {
              t--;
              const e = a.id(o, _, s);
              if (l.has(e)) break;
              if (0 === e) {
                h = _;
                break;
              }
              _++;
            }
          }
          if (null === h) continue;
          let d = u - (f >> 1),
            p = h;
          for (; d >= 0;) {
            if (airOrLava(o, p, s)) (a.set(o, p, s, c), p++, (m = !0));
            else {
              if (a.id(o, p, s) !== c) break;
              p++;
            }
            d--;
          }
        }
    }
    return m;
  };
  let F = null,
    P = null;
  const W = {};
  function putSpill(t, e) {
    const n = e.d;
    for (let e = 0; e < n.length; e += 2) {
      const r = 262143 & n[e],
        o = r + (n[e] >>> 18) + 1,
        s = 65535 & n[e + 1],
        a = n[e + 1] >>> 16;
      for (let e = r; e < o; e++)
        (t.setB(e, s),
          t.setM(e, 255 & a),
          256 & a ? (t.wl || (t.wl = new Set())).add(e) : t.wl && t.wl.delete(e));
    }
  }
  const T = {
    decorate: function decorate(e, n, r) {
      (!(function buildOrder(e = "overworld") {
        if (W[e]) return ((F = W[e].order), void (P = W[e].feats));
        a || initTags();
        const n = [];
        for (const [, t] of "nether" === e ? WG.netherParameters() : WG.overworldParameters())
          n.includes(t) || n.push(t);
        P = {};
        const r = new Map();
        let o = 0,
          s = 0;
        const i = new Map(),
          c = new Map(),
          node = (t, e) => {
            let n = r.get(t);
            void 0 === n && ((n = o++), r.set(t, n));
            const s = 1e5 * e + n;
            return (i.has(s) || i.set(s, { k: s, f: t, step: e, i: n }), i.get(s));
          };
        for (const e of n) {
          const n = (t.biome[e] && t.biome[e].features) || [],
            r = [];
          ((s = Math.max(s, n.length)),
            (P[e] = new Set()),
            n.forEach((t, n) => {
              for (const o of [].concat(t)) {
                const t = strip(o);
                (P[e].add(t), r.push(node(t, n)));
              }
            }));
          for (let t = 0; t < r.length; t++)
            (c.has(r[t].k) || c.set(r[t].k, new Set()),
              t < r.length - 1 && c.get(r[t].k).add(r[t + 1].k));
        }
        const l = [...c.keys()].sort((t, e) => t - e),
          u = new Set(),
          f = new Set(),
          _ = [],
          dfs = (t) => {
            if (u.has(t)) return !1;
            if (f.has(t)) return !0;
            f.add(t);
            for (const e of [...(c.get(t) || [])].sort((t, e) => t - e)) if (dfs(e)) return !0;
            return (f.delete(t), u.add(t), _.push(i.get(t)), !1);
          };
        for (const t of l) u.has(t) || dfs(t);
        (_.reverse(), (F = []));
        for (let t = 0; t < s; t++) F.push(_.filter((e) => e.step === t).map((t) => t.f));
        W[e] = { order: F, feats: P };
      })("nether" === n.dim ? "nether" : "overworld"),
        (u.minY = n.minY || 0),
        (u.height = "nether" === n.dim ? 128 : HEIGHT));
      const o = n.spills && n.spills.get(ckey(r.cx, r.cz));
      if (o && o.has(ckey(r.cx, r.cz)))
        return void (function restoreSpill(t, e, n) {
          const r = ckey(e.cx, e.cz);
          putSpill(e, n.get(r));
          for (const [e, o] of n) {
            const n = e !== r && t.proto.get(e);
            !n ||
              n.final ||
              (n.got && n.got.has(r)) ||
              (putSpill(n, o), (n.got || (n.got = new Set())).add(r));
          }
        })(n, r, o);
      const s = new Region(n, r.cx, r.cz);
      n.spills && (s.spill = new Map());
      const i = n.seedStr || "0";
      (e._zoom && e._zoomSeed === i) ||
        ((e._zoom = new WG.BiomeZoom(BigInt(i))), (e._zoomSeed = i));
      const c = e._zoom,
        l = self.WG_DATA.biome_order,
        f = [0, 0, 0],
        _ = {
          R: s,
          top: null,
          seed: i,
          biomeAt: (t, e, n) => (
            c.pick(t, e, n, f),
            ((t, e, n) => {
              const o = s.chunk(t << 2, n << 2) || r,
                a = HEIGHT >> 2;
              return (
                (e = clamp(e - (s.minY >> 2), 0, a - 1)),
                l[o.qb[4 * (4 * e + (3 & n)) + (3 & t)]]
              );
            })(f[0], f[1], f[2])
          ),
          biomeHas: (t, e) => {
            const n = _.biomeAt(t[0], t[1], t[2]);
            return !!e && !!P[n] && P[n].has(e);
          },
        },
        h = new Set();
      for (const t of s.ch) if (t && t.qb) for (const e of t.qb) h.add(l[e]);
      const d = new WRand(),
        p = 16 * r.cx,
        m = 16 * r.cz,
        g = d.decorationSeed(BigInt(i), p, m);
      for (let t = 0; t < F.length; t++) {
        const n = F[t];
        if (4 === t && r.sx && e.structureFeatures) {
          d.setSeed(g + BigInt(1e4 * t) + 9999n);
          try {
            e.structureFeatures(r, _, d, placePF);
          } catch (t) {
            console.warn("structure feature", t);
          }
        }
        for (let e = 0; e < n.length; e++) {
          const r = n[e];
          let o = !1;
          for (const t of h)
            if (P[t] && P[t].has(r)) {
              o = !0;
              break;
            }
          if (o) {
            d.setSeed(g + BigInt(e) + BigInt(1e4 * t));
            try {
              placePF(_, r, d, [p, MIN_Y, m], r);
            } catch (t) {
              decorate.warned || ((decorate.warned = !0), console.warn("feature", r, t));
            }
          }
        }
      }
      s.spill &&
        (function keepSpill(t, e, n) {
          const r = ckey(e.cx, e.cz);
          let o = t.spills.get(r);
          o || t.spills.set(r, (o = new Map()));
          for (let t = 0; t < 9; t++) {
            const e = n.ch[t];
            e && !e.final && o.delete(ckey(e.cx, e.cz));
          }
          n.spill.has(e) || n.spill.set(e, new Set());
          for (const [s, a] of n.spill) {
            const n = Int32Array.from(a).sort(),
              i = new Int32Array(2 * n.length),
              st = (t) => s.getM(t) | (s.wl && s.wl.has(t) ? 256 : 0);
            let c = 0;
            for (let t = 0; t < n.length;) {
              const e = n[t],
                r = s.getB(e),
                o = st(e);
              let a = 1;
              for (
                ;
                a < 4096 &&
                t + a < n.length &&
                n[t + a] === e + a &&
                s.getB(e + a) === r &&
                st(e + a) === o;
              )
                a++;
              ((i[c++] = e | ((a - 1) << 18)), (i[c++] = r | (o << 16)), (t += a));
            }
            ((t.spillSeq = (t.spillSeq || 0) + 1),
              o.set(ckey(s.cx, s.cz), { seq: t.spillSeq, after: 2 === s.stage, d: i.slice(0, c) }),
              s !== e && (s.got || (s.got = new Set())).add(r));
          }
        })(n, r, s);
    },
    applySpill: function applySpill(t, e, n, r) {
      if (!t.spills) return;
      const o = ckey(e.cx, e.cz),
        s = [];
      for (let a = -1; a <= 1; a++)
        for (let i = -1; i <= 1; i++) {
          if (!a && !i) continue;
          const c = ckey(e.cx + a, e.cz + i),
            l = t.spills.get(c),
            u = l && l.get(o);
          !u || u.after !== n || (e.got && e.got.has(c)) || !r(c) || s.push([u, c]);
        }
      s.sort((t, e) => t[0].seq - e[0].seq);
      for (const [t, n] of s) (putSpill(e, t), (e.got || (e.got = new Set())).add(n));
    },
    pruneSpill: function pruneSpill(t, e) {
      if (t.spills)
        for (const n of t.spills.keys()) {
          const r = Math.floor(n / 65536) - 32768,
            o = (n % 65536) - 32768;
          let s = !1;
          for (let t = -1; t <= 1 && !s; t++)
            for (let n = -1; n <= 1; n++)
              if (e(ckey(r + t, o + n))) {
                s = !0;
                break;
              }
          s || t.spills.delete(n);
        }
    },
    WRand: WRand,
    Region: Region,
    stateOf: stateOf,
    provider: provider,
    predicate: predicate,
    intProvider: intProvider,
    placePF: placePF,
    placeCF: (t, e, n, r) => (a || initTags(), placeCF(t, e, n, r)),
    FEATURE: v,
    canSurvive: canSurvive,
    tagSet: tagSet,
    withProp: withProp,
    msin: msin,
    mcos: mcos,
    propOf: propOf,
    sturdy: sturdy,
    faceUpdate: faceUpdate,
    helpers: () => ({ LEAVES: a, LOGS: i, DIRT: c, REPLACE_TREES: l, DIR6: S, once: once }),
  };
  return T;
})();
//# sourceURL=js/features.js
