"use strict";
!(function () {
  const t = (self.SG = {}),
    e = self.STRUCT_DATA,
    strip = (t) => ("string" == typeof t ? t.replace("minecraft:", "") : t),
    M64 = (t) => BigInt.asIntN(64, t),
    n = [];
  for (const t of (e && self.MOD_STRUCT) || []) {
    if (t.merged) continue;
    const o = t.states.map((t) => {
      let n = e.states.indexOf(t);
      return (n < 0 && ((n = e.states.length), e.states.push(t)), n);
    });
    t.states.forEach((n, s) => {
      const r = o[s];
      (e.rot[r] || (e.rot[r] = t.rot[s].map((t) => o[t])),
        e.mir && !e.mir[r] && (e.mir[r] = t.mir[s].map((t) => o[t])));
    });
    const s = Uint8Array.from(atob(t.blob), (t) => t.charCodeAt(0));
    for (const [r, a] of Object.entries(t.templates)) {
      const t = Object.assign({}, a, {
        pal: a.pal.map((t) => t.map((t) => o[t])),
        jig: a.jig.map((t) => {
          const e = t.slice();
          return ((e[8] = o[e[8]]), e);
        }),
      });
      ((e.templates[r] = t), n.push([t, s, a.off]));
    }
    for (const n of t.pools) {
      const t = e.template_pool[strip(n.pool)];
      t && t.elements.push({ element: n.element, weight: n.weight });
    }
    t.merged = !0;
  }
  let o = null,
    s = null;
  Object.defineProperty(t, "ready", {
    get: () =>
      s ||
      (s = (async () => {
        const t = Uint8Array.from(atob(self.STRUCT_BLOB), (t) => t.charCodeAt(0)),
          e = new Blob([t]).stream().pipeThrough(new DecompressionStream("gzip"));
        if (((o = new Uint8Array(await new Response(e).arrayBuffer())), n.length)) {
          const t = [...new Set(n.map((t) => t[1]))],
            e = new Map();
          let s = o.length;
          for (const n of t) (e.set(n, s), (s += n.length));
          const r = new Uint8Array(s);
          r.set(o, 0);
          for (const n of t) r.set(n, e.get(n));
          for (const [t, o, s] of n) t.off = e.get(o) / 5 + s;
          o = r;
        }
      })()),
  });
  let r = null;
  const a = e.states.map((t) => t.split("[")[0]);
  let i = null;
  t.setStateMap = (e, n) => {
    ((r = e), (t.smap = e), (i = n || null));
  };
  const putWl = (e, n, o, s, r) => {
    const a = i ? i[o] : 0;
    1 & a || (2 & a && s === t.PAL.water && 0 === r) ? e.wl.add(n) : e.wl.delete(n);
  };
  let l = null,
    c = null;
  const tag = (t) => {
    ((t = strip(t).replace(/^#/, "")), l || (l = new Map()));
    let e = l.get(t);
    return (e || ((e = new Set((self.BLOCK_TAGS && self.BLOCK_TAGS[t]) || [])), l.set(t, e)), e);
  };
  t.setPalette = (e) => {
    ((t.PAL = e), (c = []));
    for (const t in e) c[e[t]] = t;
    ((c[0] = "air"), (t.ID_NAME = c));
  };
  const JR = (t) => new WG.JRand(void 0 === t ? 0n : t),
    saltSeed = (t, e, n, o, s) =>
      t.setSeed(M64(341873128712n * BigInt(n) + 132897987541n * BigInt(o) + e + BigInt(s)));
  function posSeed(t, e, n) {
    const o = M64(BigInt(Math.imul(t, 3129871)) ^ (116129781n * BigInt(n)) ^ BigInt(e));
    return M64(M64(o * o * 42317861n) + 11n * o) >> 16n;
  }
  const shuffle = (t, e) => {
      for (let n = t.length; n > 1; n--) {
        const o = e.nextInt(n),
          s = t[n - 1];
        ((t[n - 1] = t[o]), (t[o] = s));
      }
      return t;
    },
    weighted = (t, e, n = (t) => t.weight) => {
      let o = 0;
      for (const e of t) o += n(e);
      let s = e.nextInt(o);
      for (const e of t) if (((s -= n(e)), s < 0)) return e;
      return t[t.length - 1];
    },
    p = ["north", "east", "south", "west"],
    f = {
      north: [0, 0, -1],
      south: [0, 0, 1],
      west: [-1, 0, 0],
      east: [1, 0, 0],
      up: [0, 1, 0],
      down: [0, -1, 0],
    },
    u = { north: "south", south: "north", west: "east", east: "west", up: "down", down: "up" },
    rotDir = (t, e) => (p.includes(t) ? p[(p.indexOf(t) + e) & 3] : t),
    rotPos = (t, e, n, o) =>
      1 === o ? [-n, e, t] : 2 === o ? [-t, e, -n] : 3 === o ? [n, e, -t] : [t, e, n],
    rotPosM = (t, e, n, o, s, r, a) => {
      switch ((1 === s ? (n = -n) : 2 === s && (t = -t), o)) {
        case 1:
          return [r + a - n, e, a - r + t];
        case 2:
          return [r + r - t, e, a + a - n];
        case 3:
          return [r - a + n, e, r + a - t];
      }
      return [t, e, n];
    },
    inside = (t, e, n, o) =>
      e >= t[0] && e <= t[3] && n >= t[1] && n <= t[4] && o >= t[2] && o <= t[5],
    overlap = (t, e) =>
      t[0] <= e[3] && t[3] >= e[0] && t[1] <= e[4] && t[4] >= e[1] && t[2] <= e[5] && t[5] >= e[2],
    h = e.templates,
    m = new Map();
  function processors(t) {
    if (!t) return [];
    if ("string" == typeof t) {
      let n = m.get(t);
      if (!n) {
        const o = e.processor_list[strip(t)];
        ((n = (o && o.processors) || []), m.set(t, n));
      }
      return n;
    }
    return t.processors || (Array.isArray(t) ? t : []);
  }
  const g = {
      x: 0,
      y: 0,
      z: 0,
      front: "down",
      top: "south",
      name: "bottom",
      target: "empty",
      pool: "empty",
      rollable: !0,
      final: -1,
      pp: 0,
      sp: 0,
    },
    d = new WeakMap();
  function element(t) {
    let e = d.get(t);
    if (e) return e;
    const n = strip(t.element_type);
    if ("empty_pool_element" === n) e = { type: "empty" };
    else if ("feature_pool_element" === n)
      e = { type: "feature", feature: strip(t.feature), proj: t.projection };
    else if ("list_pool_element" === n)
      e = { type: "list", list: t.elements.map(element), proj: t.projection };
    else {
      const o = h[strip(t.location)];
      e = o
        ? {
            type: "legacy_single_pool_element" === n ? "legacy" : "single",
            name: strip(t.location),
            tpl: o,
            proc: processors(t.processors),
            proj: t.projection,
          }
        : { type: "empty" };
    }
    return (d.set(t, e), e);
  }
  function elBox(t, e, n) {
    if ("feature" === t.type) return [e[0], e[1], e[2], e[0], e[1], e[2]];
    if ("list" === t.type) {
      return t.list
        .filter((t) => "empty" !== t.type)
        .map((t) => elBox(t, e, n))
        .reduce((t, e) => [
          Math.min(t[0], e[0]),
          Math.min(t[1], e[1]),
          Math.min(t[2], e[2]),
          Math.max(t[3], e[3]),
          Math.max(t[4], e[4]),
          Math.max(t[5], e[5]),
        ]);
    }
    const o = t.tpl.size;
    return ((t, e, n, o, s) => {
      const r = rotPos(0, 0, 0, s),
        a = rotPos(t - 1, e - 1, n - 1, s);
      return [
        Math.min(r[0], a[0]) + o[0],
        o[1],
        Math.min(r[2], a[2]) + o[2],
        Math.max(r[0], a[0]) + o[0],
        o[1] + e - 1,
        Math.max(r[2], a[2]) + o[2],
      ];
    })(o[0], o[1], o[2], e, n);
  }
  function elJigsaws(t, e, n, o) {
    let s;
    if ("feature" === t.type) s = [{ ...g, x: e[0], y: e[1], z: e[2] }];
    else {
      if ("list" === t.type) return elJigsaws(t.list[0], e, n, o);
      s = t.tpl.jig.map((t) => {
        const o = rotPos(t[0], t[1], t[2], n),
          [s, r] = t[3].split("_"),
          a = rotDir(s, n),
          i = rotDir(r, n);
        return {
          x: o[0] + e[0],
          y: o[1] + e[1],
          z: o[2] + e[2],
          front: a,
          top: i,
          name: t[4],
          target: t[5],
          pool: t[6],
          rollable: t[7] ? "rollable" === t[7] : !p.includes(a),
          final: t[8],
          pp: t[9],
          sp: t[10],
        };
      });
    }
    return (shuffle(s, o), s.sort((t, e) => e.sp - t.sp), s);
  }
  const canAttach = (t, e) =>
      t.front === u[e.front] && (t.rollable || t.top === e.top) && t.target === e.name,
    b = new Map();
  function pool(t) {
    t = strip(t);
    let n = b.get(t);
    if (n) return n;
    const o = e.template_pool[t];
    if (!o) return (b.set(t, null), null);
    const s = [];
    for (const t of o.elements) {
      const e = element(t.element);
      for (let n = 0; n < t.weight; n++) s.push(e);
    }
    return (
      (n = { name: t, els: s, fallback: strip(o.fallback || "empty"), maxSize: -1 }),
      b.set(t, n),
      n
    );
  }
  const poolMax = (t) => {
      if (!t) return 0;
      if (t.maxSize < 0) {
        t.maxSize = 0;
        for (const e of t.els)
          if ("empty" !== e.type) {
            const n = elBox(e, [0, 0, 0], 0);
            t.maxSize = Math.max(t.maxSize, n[4] - n[1] + 1);
          }
      }
      return t.maxSize;
    },
    x = {};
  function setsFor(t) {
    if (x[t.dim]) return x[t.dim];
    const n = new Set(
        ("nether" === t.dim ? WG.netherParameters() : WG.overworldParameters()).map((t) => t[1]),
      ),
      o = [];
    for (const [t, s] of Object.entries(e.structure_set)) {
      const r = s.placement;
      if ("random_spread" !== strip(r.type)) continue;
      const a = s.structures
        .map((t) => ({
          name: strip(t.structure),
          weight: t.weight,
          def: e.structure[strip(t.structure)],
        }))
        .filter((t) => t.def && SUPPORTED(t.def) && biomeSet(t.def.biomes).some((t) => n.has(t)));
      if (!a.length) continue;
      const reach = (t) => {
        const e = strip(t.type);
        return "jigsaw" === e
          ? Math.ceil(((t.max_distance_from_center || 80) + 32) / 16)
          : "mineshaft" === e
            ? 7
            : "fortress" === e
              ? 5
              : "ocean_ruin" === e
                ? 3
                : 2;
      };
      o.push({
        name: t,
        list: a,
        pl: r,
        salt: BigInt(r.salt),
        spacing: r.spacing,
        sep: r.separation,
        R: Math.max(...a.map((t) => reach(t.def))),
        pot: new Map(),
      });
    }
    return (x[t.dim] = o);
  }
  const SUPPORTED = (e) =>
      "jigsaw" === strip(e.type) || "fortress" === strip(e.type) || !!t.TYPES[strip(e.type)],
    _ = new Map();
  function biomeSet(t) {
    let n = _.get(t);
    return (
      n ||
        ((n = []
          .concat(t)
          .flatMap((t) =>
            t.startsWith("#") ? e.biome_tags[strip(t.slice(1))] || [] : [strip(t)],
          )),
        _.set(t, n)),
      n
    );
  }
  function potential(t, e, n, o) {
    const s = t.spacing,
      r = Math.floor(n / s),
      a = Math.floor(o / s);
    if (t.pot) {
      const n = 1048576 * r + a,
        o = t.pot.get(n);
      if (o) return o;
      const i = potential0(t, e, r, a, s);
      return (t.pot.size > 5e4 && t.pot.clear(), t.pot.set(n, i), i);
    }
    return potential0(t, e, r, a, s);
  }
  function potential0(t, e, n, o, s) {
    const r = JR();
    saltSeed(r, e, n, o, t.salt);
    const a = s - t.sep,
      i = "triangular" === t.pl.spread_type,
      ev = () => (i ? (r.nextInt(a) + r.nextInt(a)) >> 1 : r.nextInt(a));
    return [n * s + ev(), o * s + ev()];
  }
  function frequencyOk(t, e, n, o) {
    const s = t.pl.frequency ?? 1;
    if (s >= 1) return !0;
    const r = t.pl.frequency_reduction_method || "default",
      a = JR();
    switch (r) {
      case "legacy_type_1": {
        const t = n >> 4,
          r = o >> 4;
        return (
          a.setSeed(BigInt(t ^ (r << 4)) ^ e),
          a.nextInt(),
          0 === a.nextInt(Math.trunc(1 / Math.fround(s)))
        );
      }
      case "legacy_type_2":
        return (saltSeed(a, e, n, o, 10387320n), a.nextFloat() < s);
      case "legacy_type_3":
        return (a.largeFeatureSeed(e, n, o), a.nextDouble() < s);
      default:
        return (saltSeed(a, e, t.salt, n, BigInt(o)), a.nextFloat() < s);
    }
  }
  function isStructureChunk(t, e, n, o) {
    const s = t.rs.seed,
      r = potential(e, s, n, o);
    if (r[0] !== n || r[1] !== o || !frequencyOk(e, s, n, o)) return !1;
    const a = e.pl.exclusion_zone;
    if (a) {
      const e = setsFor(t).find((t) => t.name === strip(a.other_set)) || mkSet(strip(a.other_set));
      if (e)
        for (let t = n - a.chunk_count; t <= n + a.chunk_count; t++)
          for (let n = o - a.chunk_count; n <= o + a.chunk_count; n++) {
            const o = potential(e, s, t, n);
            if (o[0] === t && o[1] === n && frequencyOk(e, s, t, n)) return !1;
          }
    }
    return !0;
  }
  const mkSet = (t) => {
      const n = e.structure_set[t];
      return n && "random_spread" === strip(n.placement.type)
        ? {
            name: t,
            pl: n.placement,
            salt: BigInt(n.placement.salt),
            spacing: n.placement.spacing,
            sep: n.placement.separation,
          }
        : null;
    },
    y = new Map();
  function startsAt(t, e, n) {
    const o = t.dim + ":" + e + "," + n;
    let s = y.get(o);
    if (s) return s;
    s = [];
    for (const o of setsFor(t)) {
      if (!isStructureChunk(t, o, e, n)) continue;
      if (1 === o.list.length) {
        const r = tryStructure(t, o.list[0], e, n);
        r && s.push(r);
        continue;
      }
      const r = o.list.slice(),
        a = JR();
      a.largeFeatureSeed(t.rs.seed, e, n);
      let i = 0;
      for (const t of r) i += t.weight;
      for (; r.length;) {
        let o = a.nextInt(i),
          l = 0;
        for (const t of r) {
          if (((o -= t.weight), o < 0)) break;
          l++;
        }
        const c = r[l],
          p = tryStructure(t, c, e, n);
        if (p) {
          s.push(p);
          break;
        }
        (r.splice(l, 1), (i -= c.weight));
      }
    }
    return (y.size > 4e3 && y.clear(), y.set(o, s), s);
  }
  function tryStructure(e, n, o, s) {
    const r = JR();
    r.largeFeatureSeed(e.rs.seed, o, s);
    const a = n.def,
      i = strip(a.type);
    if ("jigsaw" === i)
      return (function jigsaw(t, e, n, o, s, r) {
        const a = sampleHeight(t, n.start_height, r),
          i = [16 * o, a, 16 * s],
          l = (function aliases(t, e, n) {
            const o = new Map();
            if (!t.pool_aliases) return o;
            const s = JR(n).forkPositional().at(e[0], e[1], e[2]);
            for (const e of t.pool_aliases) {
              const t = strip(e.type);
              if ("direct" === t) o.set(strip(e.alias), strip(e.target));
              else if ("random" === t) o.set(strip(e.alias), strip(weighted(e.targets, s).data));
              else if ("random_group" === t)
                for (const t of weighted(e.groups, s).data) o.set(strip(t.alias), strip(t.target));
            }
            return o;
          })(n, i, t.rs.seed),
          A = (t) => l.get(strip(t)) || strip(t),
          c = r.nextInt(4),
          p = pool(A(n.start_pool));
        if (!p || !p.els.length) return null;
        const u = p.els[r.nextInt(p.els.length)];
        if ("empty" === u.type) return null;
        let h = i;
        if (n.start_jigsaw_name) {
          const t = elJigsaws(u, i, c, r).find((t) => t.name === strip(n.start_jigsaw_name));
          if (!t) return null;
          h = [t.x, t.y, t.z];
        }
        const m = [h[0] - i[0], h[1] - i[1], h[2] - i[2]],
          g = [i[0] - m[0], i[1] - m[1], i[2] - m[2]],
          d = piece(u, g, c, 1),
          b = d.box,
          x = Math.trunc((b[3] + b[0]) / 2),
          _ = Math.trunc((b[5] + b[2]) / 2),
          y = n.project_start_to_heightmap ? i[1] + t.baseHeight(x, _) : g[1];
        movePiece(d, y - (b[1] + d.gld));
        const M = y + m[1];
        if (!new Set(biomeSet(n.biomes)).has(t.biomeAtQuart(x >> 2, M >> 2, _ >> 2))) return null;
        const w = n.dimension_padding || 0,
          S = "number" == typeof w ? w : w.bottom || 0,
          k = "number" == typeof w ? w : w.top || 0;
        if (w && (d.box[1] < t.minY + S || d.box[4] > t.minY + t.height - 1 - k)) return null;
        const j = [d],
          I = n.size;
        if (I > 0) {
          const e = n.max_distance_from_center || 80,
            o = {
              c: [
                x - e,
                Math.max(M - e, t.minY + S),
                _ - e,
                x + e + 1,
                Math.min(M + e + 1, t.minY + t.height - k),
                _ + e + 1,
              ],
              holes: [d.box],
            };
          !(function placeChildren(t, e, n, o, s, r, a, i) {
            const l = new Map(),
              push = (t, e) => {
                let n = l.get(e);
                (n || l.set(e, (n = [])), n.push(t));
              },
              next = () => {
                let t = null;
                for (const [e, n] of l) n.length && (null === t || e > t) && (t = e);
                return null === t ? null : l.get(t).shift();
              },
              c = !!n.use_expansion_hack;
            let p = { p: a, free: i, depth: 0 };
            for (; p;) (tryChildren(p.p, p.free, p.depth), (p = next()));
            function tryChildren(n, a, i) {
              const l = n.el,
                p = n.rigid,
                u = n.box,
                h = u[1];
              let m = null;
              t: for (const g of elJigsaws(l, n.pos, n.rot, e)) {
                const l = f[g.front],
                  d = g.x + l[0],
                  b = g.y + l[1],
                  x = g.z + l[2],
                  _ = g.y - h;
                let y = -1;
                const M = o(g.pool),
                  w = pool(M);
                if (!w || (!w.els.length && "empty" !== M)) continue;
                const S = pool(w.fallback);
                if (!S || (!S.els.length && "empty" !== w.fallback)) continue;
                let k;
                inside(u, d, b, x)
                  ? (m || (m = { c: [u[0], u[1], u[2], u[3] + 1, u[4] + 1, u[5] + 1], holes: [] }),
                    (k = m))
                  : (k = a);
                const j = [];
                (i !== r && j.push(...shuffle(w.els.slice(), e)),
                  j.push(...shuffle(S.els.slice(), e)));
                for (const a of j) {
                  if ("empty" === a.type) break;
                  for (const u of shuffle([0, 1, 2, 3], e)) {
                    const m = elJigsaws(a, [0, 0, 0], u, e),
                      M = elBox(a, [0, 0, 0], u);
                    let w = 0;
                    if (c && M[4] - M[1] + 1 <= 16)
                      for (const t of m) {
                        const e = f[t.front];
                        if (!inside(M, t.x + e[0], t.y + e[1], t.z + e[2])) continue;
                        const n = pool(o(t.pool));
                        w = Math.max(w, poolMax(n), poolMax(n && pool(n.fallback)));
                      }
                    for (const e of m) {
                      if (!canAttach(g, e)) continue;
                      const o = [d - e.x, b - e.y, x - e.z],
                        c = elBox(a, o, u),
                        f = c[1],
                        m = "terrain_matching" !== a.proj,
                        M = e.y,
                        S = _ - M + l[1];
                      let j;
                      p && m
                        ? (j = h + S)
                        : (-1 === y && (y = t.baseHeight(g.x, g.z)), (j = y - M));
                      const I = j - f,
                        z = [c[0], c[1] + I, c[2], c[3], c[4] + I, c[5]],
                        B = [o[0], o[1] + I, o[2]];
                      if (w > 0) {
                        const t = Math.max(w + 1, z[4] - z[1]);
                        z[4] = Math.max(z[4], z[1] + t);
                      }
                      if (!fits(k, z)) continue;
                      k.holes.push(z);
                      const v = n.gld,
                        P = m ? v - S : "empty" === a.type ? 0 : 1,
                        F = { el: a, pos: B, rot: u, box: z, gld: P, rigid: m, junctions: [] };
                      let T;
                      (p
                        ? (T = h + _)
                        : m
                          ? (T = j + M)
                          : (-1 === y && (y = t.baseHeight(g.x, g.z)), (T = y + Math.trunc(S / 2))),
                        n.junctions.push([d, T - _ + v, x, S, m]),
                        F.junctions.push([g.x, T - M + P, g.z, -S, p]),
                        s.push(F),
                        i + 1 <= r && push({ p: F, free: k, depth: i + 1 }, g.pp));
                      continue t;
                    }
                  }
                }
              }
            }
          })(t, r, n, A, j, I, d, o);
        }
        const z = j.reduce(
          (t, e) => [
            Math.min(t[0], e.box[0]),
            Math.min(t[1], e.box[1]),
            Math.min(t[2], e.box[2]),
            Math.max(t[3], e.box[3]),
            Math.max(t[4], e.box[4]),
            Math.max(t[5], e.box[5]),
          ],
          d.box.slice(),
        );
        return {
          name: e,
          def: n,
          pieces: j,
          box: z,
          adapt: n.terrain_adaptation || "none",
          step: n.step,
          liquid: n.liquid_settings,
        };
      })(e, n.name, a, o, s, r);
    if (t.TYPES[i]) return t.TYPES[i](e, n.name, a, o, s, r, t.helpers);
    if ("fortress" === i) {
      const t = 16 * o + 2,
        i = 16 * s + 2;
      if (!new Set(biomeSet(a.biomes)).has(e.biomeAtQuart(t >> 2, 16, i >> 2))) return null;
      const l = 48 + r.nextInt(23);
      return {
        name: n.name,
        def: a,
        pieces: [],
        box: [t - 64, l - 30, i - 64, t + 64, l + 12, i + 64],
        adapt: "none",
        fortress: [t + 6, l, i + 6],
      };
    }
    return null;
  }
  function anchor(t, e) {
    return "absolute" in e
      ? e.absolute
      : "above_bottom" in e
        ? t.minY + e.above_bottom
        : t.minY + t.height - 1 - e.below_top;
  }
  function sampleHeight(t, e, n) {
    if (!e.type) return anchor(t, e);
    const o = strip(e.type);
    if ("constant" === o) return anchor(t, e.value);
    if ("uniform" === o) {
      const o = anchor(t, e.min_inclusive),
        s = anchor(t, e.max_inclusive);
      return n.nextInt(s - o + 1) + o;
    }
    return anchor(t, e.min_inclusive || { absolute: 0 });
  }
  const piece = (t, e, n, o) => ({
      el: t,
      pos: e.slice(),
      rot: n,
      box: elBox(t, e, n),
      gld: o,
      rigid: "terrain_matching" !== t.proj,
      junctions: [],
    }),
    movePiece = (t, e) => {
      ((t.pos[1] += e), (t.box[1] += e), (t.box[4] += e));
    },
    fits = (t, e) => {
      const n = t.c;
      if (
        e[0] + 0.25 < n[0] ||
        e[3] + 0.75 > n[3] ||
        e[1] + 0.25 < n[1] ||
        e[4] + 0.75 > n[4] ||
        e[2] + 0.25 < n[2] ||
        e[5] + 0.75 > n[5]
      )
        return !1;
      for (const n of t.holes) if (overlap(e, n)) return !1;
      return !0;
    };
  ((t.forChunk = function (t, e, n) {
    if (!r) return { starts: [], beard: null };
    const o = 16 * e,
      s = 16 * n,
      a = [o - 12, -1e9, s - 12, o + 27, 1e9, s + 27],
      i = [];
    for (const o of setsFor(t)) {
      const s = o.R,
        r = o.spacing;
      for (let l = Math.floor((e - s) / r); l <= Math.floor((e + s) / r); l++)
        for (let c = Math.floor((n - s) / r); c <= Math.floor((n + s) / r); c++) {
          const p = potential(o, t.rs.seed, l * r, c * r);
          if (!(Math.abs(p[0] - e) > s || Math.abs(p[1] - n) > s))
            for (const e of startsAt(t, p[0], p[1]))
              overlap(e.box, a) && !i.includes(e) && i.push(e);
        }
    }
    return { starts: i, beard: beardifier(i, o, s, t.minY, t.height) };
  }),
    (t.locate = function (t, e, n, o, s = 12) {
      for (const n of setsFor(t)) n._has = n.list.some((t) => t.name.startsWith(e));
      let r = null;
      for (let a = 0; a <= s && !r; a++)
        for (const s of setsFor(t)) {
          if (!s._has) continue;
          const i = s.spacing,
            l = Math.floor(n / i),
            c = Math.floor(o / i);
          for (let p = -a; p <= a; p++)
            for (let f = -a; f <= a; f++) {
              if (Math.max(Math.abs(p), Math.abs(f)) !== a) continue;
              const u = potential(s, t.rs.seed, (l + p) * i, (c + f) * i);
              for (const s of startsAt(t, u[0], u[1])) {
                if (!s.name.startsWith(e)) continue;
                const t = (s.box[0] + s.box[3]) >> 1,
                  a = (s.box[2] + s.box[5]) >> 1,
                  i = Math.hypot(t - 16 * n, a - 16 * o),
                  l = s.pieces.length ? s.pieces[0].box[1] : s.fortress ? s.fortress[1] : s.box[1];
                (!r || i < r.d) && (r = { name: s.name, x: t, y: l, z: a, d: i });
              }
            }
        }
      return r;
    }));
  const M = new Float32Array(13824);
  for (let t = 0; t < 24; t++)
    for (let e = 0; e < 24; e++)
      for (let n = 0; n < 24; n++) {
        const o = e - 12,
          s = n - 12,
          r = t - 12,
          a = o * o + (s + 0.5) * (s + 0.5) + r * r;
        M[576 * t + 24 * e + n] = Math.pow(Math.E, -a / 16);
      }
  const beardC = (t, e, n, o) => {
      const s = t + 12,
        r = e + 12,
        a = n + 12;
      if (s < 0 || s >= 24 || r < 0 || r >= 24 || a < 0 || a >= 24) return 0;
      const i = o + 0.5,
        l = t * t + i * i + n * n;
      return (-i / Math.sqrt(l / 2) / 2) * M[576 * a + 24 * s + r];
    },
    buryC = (t, e, n) => {
      const o = Math.sqrt(t * t + e * e + n * n);
      return o >= 6 ? 0 : 1 - o / 6;
    };
  function beardifier(t, e, n, o, s) {
    const r = [],
      a = [];
    for (const o of t) {
      if ("none" === o.adapt) continue;
      const t = o.adapt;
      for (const s of o.pieces) {
        const o = s.box;
        if (!(o[3] < e - 12 || o[0] > e + 15 + 12 || o[5] < n - 12 || o[2] > n + 15 + 12)) {
          s.rigid && r.push([o, t, s.gld]);
          for (const t of s.junctions)
            t[0] > e - 12 && t[2] > n - 12 && t[0] < e + 15 + 12 && t[2] < n + 15 + 12 && a.push(t);
        }
      }
    }
    if (!r.length && !a.length) return null;
    const i = new Float64Array(s);
    let l = NaN,
      c = NaN,
      p = !1;
    const add = (t, e, n) => {
      ((t = Math.max(t, o)), (e = Math.min(e, o + s - 1)));
      for (let s = t; s <= e; s++) i[s - o] += n(s);
      p = !0;
    };
    return (t, e, n) => {
      if (t !== l || n !== c) {
        ((l = t), (c = n), p && i.fill(0), (p = !1));
        for (const [e, o, s] of r) {
          const r = Math.max(0, e[0] - t, t - e[3]),
            a = Math.max(0, e[2] - n, n - e[5]);
          if (r >= 12 || a >= 12) continue;
          const i = e[1] + s;
          "beard_thin" === o
            ? add(i - 12, i + 11, (t) => 0.8 * beardC(r, t - i, a, t - i))
            : "beard_box" === o
              ? add(
                  i - 12,
                  e[4] + 11,
                  (t) => 0.8 * beardC(r, Math.max(0, i - t, t - e[4]), a, t - i),
                )
              : "bury" === o
                ? add(i - 12, i + 12, (t) => buryC(r, (t - i) / 2, a))
                : "encapsulate" === o &&
                  add(
                    e[1] - 12,
                    e[4] + 12,
                    (t) => 0.8 * buryC(r / 2, Math.max(0, e[1] - t, t - e[4]) / 2, a / 2),
                  );
        }
        for (const e of a) {
          const o = t - e[0],
            s = n - e[2];
          o <= -12 ||
            o >= 12 ||
            s <= -12 ||
            s >= 12 ||
            add(e[1] - 12, e[1] + 11, (t) => 0.4 * beardC(o, t - e[1], s, t - e[1]));
        }
      }
      return p ? i[e - o] : 0;
    };
  }
  function placePiece(t, n, s, i, l, c, p, f, u, h, m, g, d) {
    if ("tpl" === n.kind)
      return (function placeTpl(t, n, s, i, l, c, p, f, u, h, m) {
        const g = n.tpl,
          d = n.rot,
          b = n.mirror || 0,
          x = n.pivot ? n.pivot[0] : 0,
          _ = n.pivot ? n.pivot[1] : 0,
          y =
            g.pal.length > 1
              ? g.pal[JR(posSeed(n.pos[0], n.pos[1], n.pos[2])).nextInt(g.pal.length)]
              : g.pal[0],
          M = 5 * g.off,
          set = (t, e, n, o) => {
            if (t < s || t >= s + 16 || n < i || n >= i + 16 || e < l || e >= l + c) return;
            const a = r[2 * o];
            if (a < 0) return;
            const u = h(t, e, n);
            (putWl(m, u, o, p[u], f[u]), (p[u] = a), (f[u] = r[2 * o + 1]));
          };
        for (let t = 0; t < g.n; t++) {
          const r = M + 5 * t,
            l = o[r],
            c = o[r + 1],
            p = o[r + 2],
            f = o[r + 3] | (o[r + 4] << 8),
            h = rotPosM(l, c, p, d, b, x, _),
            m = h[0] + n.pos[0],
            g = h[2] + n.pos[2];
          if (m < s || m >= s + 16 || g < i || g >= i + 16) continue;
          const w = h[1] + n.pos[1];
          let S = y[f];
          const k = a[S];
          "structure_block" === k ||
            "structure_void" === k ||
            "jigsaw" === k ||
            (n.ignoreAir && "air" === k) ||
            (b && (S = e.mir[S][b - 1]),
            (S = e.rot[S][d]),
            (void 0 !== n.integrity &&
              n.integrity < 1 &&
              JR(posSeed(m, w, g)).nextFloat() > n.integrity) ||
              (n.proc && ((S = process(n.proc, S, m, w, g, u)), S < 0)) ||
              (n.mapState && ((S = n.mapState(S, m, w, g, u)), S < 0)) ||
              set(m, w, g, S));
        }
        if (g.be)
          for (const t of g.be) {
            const e = rotPosM(t[0], t[1], t[2], d, b, x, _),
              o = e[0] + n.pos[0],
              r = e[1] + n.pos[1],
              a = e[2] + n.pos[2];
            o < s ||
              o >= s + 16 ||
              a < i ||
              a >= i + 16 ||
              ("marker" === t[3]
                ? n.marker && n.marker(t[4], o, r, a, set, m)
                : m.loot.push([o, r, a, t[3], t[4]]));
          }
        n.post && n.post(s, i, set, u, m);
      })(0, n, i, l, c, p, f, u, h, g, d);
    if ("code" === n.kind) return n.build(i, l, c, p, f, u, h, g, d);
    const b = n.el;
    if ("empty" === b.type) return;
    if ("list" === b.type) {
      for (const e of b.list) placePiece(t, { ...n, el: e }, s, i, l, c, p, f, u, h, m, g, d);
      return;
    }
    if ("feature" === b.type) {
      const [t, e, o] = n.pos;
      return void (
        t >= i &&
        t < i + 16 &&
        o >= l &&
        o < l + 16 &&
        d.feat.push([t, e, o, b.feature])
      );
    }
    const x = b.tpl,
      _ = n.rot,
      y = "legacy" === b.type,
      M = "terrain_matching" === b.proj,
      w =
        x.pal.length > 1
          ? x.pal[JR(posSeed(n.pos[0], n.pos[1], n.pos[2])).nextInt(x.pal.length)]
          : x.pal[0],
      S = b.proc,
      k = x.n,
      j = 5 * x.off,
      I = new Map();
    for (const t of x.jig) I.set(t[0] + "," + t[1] + "," + t[2], t[8]);
    for (let t = 0; t < k; t++) {
      const s = j + 5 * t,
        b = o[s],
        x = o[s + 1],
        k = o[s + 2],
        z = o[s + 3] | (o[s + 4] << 8),
        B = rotPos(b, x, k, _),
        v = B[0] + n.pos[0],
        P = B[2] + n.pos[2];
      if (v < i || v >= i + 16 || P < l || P >= l + 16) continue;
      let F = B[1] + n.pos[1],
        T = w[z];
      const O = a[T];
      if ("structure_block" === O || "structure_void" === O) continue;
      if (
        "jigsaw" === O &&
        ((T = I.get(b + "," + x + "," + k)), void 0 === T || "structure_void" === a[T])
      )
        continue;
      if (((T = e.rot[T][_]), y && "air" === a[T])) continue;
      if (((T = process(S, T, v, F, P, h)), T < 0)) continue;
      if ((M && (F = m(v, P) - 1 + x), F < c || F >= c + p)) continue;
      const C = r[2 * T];
      if (C < 0) continue;
      const Y = g(v, F, P);
      (putWl(d, Y, T, f[Y], u[Y]), (f[Y] = C), (u[Y] = r[2 * T + 1]));
    }
    if (x.be)
      for (const t of x.be) {
        const e = rotPos(t[0], t[1], t[2], _),
          o = e[0] + n.pos[0],
          s = e[2] + n.pos[2];
        let r = e[1] + n.pos[1];
        o < i ||
          o >= i + 16 ||
          s < l ||
          s >= l + 16 ||
          (M && (r = m(o, s) - 1 + t[1]), d.loot.push([o, r, s, t[3], t[4]]));
      }
    if (x.ent)
      for (const t of x.ent) {
        const e = rotPos(Math.floor(t[0]), Math.floor(t[1]), Math.floor(t[2]), _),
          o = e[0] + n.pos[0],
          s = e[2] + n.pos[2];
        if (o < i || o >= i + 16 || s < l || s >= l + 16) continue;
        const [r, a, c] = t,
          p =
            1 === _
              ? [1 - c, a, r]
              : 2 === _
                ? [1 - r, a, 1 - c]
                : 3 === _
                  ? [c, a, 1 - r]
                  : [r, a, c];
        d.ent.push([p[0] + n.pos[0], p[1] + n.pos[1], p[2] + n.pos[2], t[3], t[4]]);
      }
  }
  t.place = function (t, e, n, o, s, r, a) {
    const i = { loot: [], ent: [], feat: [], refs: [], wl: new Set() };
    if (!a.length) return ((i.wl = []), i);
    const l = 16 * e,
      c = 16 * n,
      p = t.minY,
      f = t.height,
      u = [l, p, c, l + 15, p + f - 1, c + 15],
      idx = (t, e, n) => ((e - p) << 8) | ((n - c) << 4) | (t - l),
      getId = (t, e, n) => (e < p || e >= p + f ? 0 : o[idx(t, e, n)]),
      height = (t, e) => r[((e - c) << 4) | (t - l)] + 1;
    for (const e of a) {
      let n = !1;
      for (const r of e.pieces)
        (overlap(r.box, u) || (r.el && "terrain_matching" === r.el.proj)) &&
          (r.box[3] < l ||
            r.box[0] > l + 15 ||
            r.box[5] < c ||
            r.box[2] > c + 15 ||
            ((n = !0), placePiece(t, r, e, l, c, p, f, o, s, getId, height, idx, i)));
      (n || overlap(e.box, u)) &&
        i.refs.push(e.fortress ? [e.name, e.box, e.fortress] : [e.name, e.box]);
    }
    for (let t = 0; t < 256; t++) {
      let e = f - 1;
      for (; e >= 0 && !o[(e << 8) | t];) e--;
      r[t] = e + p;
    }
    return ((i.wl = [...i.wl].filter((t) => o[t])), i);
  };
  const w = new Map();
  function process(t, e, n, o, s, r) {
    let i = null;
    const R = () => i || (i = JR(posSeed(n, o, s)));
    for (const l of t) {
      const t = strip(l.processor_type);
      if ("rule" === t) {
        i = null;
        const t = (c && c[r(n, o, s)]) || "air";
        for (const n of l.rules)
          if (
            pred(n.input_predicate, e, a[e], R) &&
            pred(n.location_predicate, -1, t, R) &&
            (!n.position_predicate || "always_true" === strip(n.position_predicate.predicate_type))
          ) {
            e = n.out;
            break;
          }
      } else if ("block_rot" === t) {
        i = null;
        const t = l.rottable_blocks;
        if ((!t || tag(t).has(a[e])) && !(R().nextFloat() <= l.integrity)) return -1;
      } else if ("protected_blocks" === t) {
        const t = c ? c[r(n, o, s)] : null;
        if (t && tag(l.value).has(t)) return -1;
      }
    }
    return e;
  }
  function pred(t, e, n, o) {
    switch (strip(t.predicate_type)) {
      case "always_true":
        return !0;
      case "block_match":
        return n === strip(t.block);
      case "blockstate_match":
        return e >= 0 && e === t.sid;
      case "random_block_match":
        return n === strip(t.block) && o().nextFloat() < t.probability;
      case "random_blockstate_match":
        return e === t.sid && o().nextFloat() < t.probability;
      case "tag_match":
        return tag(t.tag).has(n);
    }
    return !1;
  }
  ((t.TYPES = {}),
    (t.helpers = {
      JR: JR,
      posSeed: posSeed,
      rotPosM: rotPosM,
      rotPos: rotPos,
      tplPiece: function tplPiece(t, e, n, o, s, r) {
        const a = h[t];
        if (!a) return null;
        const i = a.size,
          l = s ? s[0] : 0,
          c = s ? s[1] : 0,
          p = rotPosM(0, 0, 0, n, o || 0, l, c),
          f = rotPosM(i[0] - 1, i[1] - 1, i[2] - 1, n, o || 0, l, c),
          u = [
            Math.min(p[0], f[0]) + e[0],
            e[1],
            Math.min(p[2], f[2]) + e[2],
            Math.max(p[0], f[0]) + e[0],
            e[1] + i[1] - 1,
            Math.max(p[2], f[2]) + e[2],
          ];
        return Object.assign(
          {
            kind: "tpl",
            name: t,
            tpl: a,
            pos: e.slice(),
            rot: n,
            mirror: o || 0,
            pivot: s,
            box: u,
            rigid: !0,
            gld: 0,
            junctions: [],
          },
          r || {},
        );
      },
      stateOf: (t) => (w.size || e.states.forEach((t, e) => w.set(t, e)), w.get(t)),
      biomeSet: biomeSet,
      TPL: h,
      D: e,
      NAMES: a,
      strip: strip,
      anchor: (t, e) => anchor(t, e),
      sampleHeight: (t, e, n) => sampleHeight(t, e, n),
      shuffle: shuffle,
    }));
})();
//# sourceURL=js/structgen.js
