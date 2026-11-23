"use strict";
(() => {
  const e = Features,
    {
      stateOf: t,
      provider: n,
      predicate: r,
      intProvider: o,
      msin: a,
      mcos: s,
      withProp: i,
      tagSet: c,
    } = e,
    strip = (e) => ("string" == typeof e ? e.replace("minecraft:", "") : e),
    l = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ],
    f = { y: 0, x: 1, z: 2 };
  e.FEATURE.tree = (t, r, i, f, h, u) => {
    const _ =
        r.tree ||
        (r.tree = (function compileTree(t) {
          const r = {
              c: t,
              H: e.helpers(),
              trunkP: n(t.trunk_provider),
              foliageP: n(t.foliage_provider),
              belowP: t.below_trunk_provider
                ? n(t.below_trunk_provider)
                : t.dirt_provider
                  ? n(t.dirt_provider)
                  : null,
              tp: t.trunk_placer,
              fp: t.foliage_placer,
              size: t.minimum_size,
              ignoreVines: !!t.ignore_vines,
              forceDirt: !!t.force_dirt,
              decorators: (t.decorators || []).map((e) => ({ t: strip(e.type), d: e })),
              root: t.root_placer || null,
            },
            a = r.tp,
            s = strip(a.type);
          if (
            ((r.tpType = s),
            (r.canGrowThrough = a.can_grow_through ? c(a.can_grow_through) : null),
            "cherry_trunk_placer" === s)
          ) {
            ((r.branchCount = o(a.branch_count)), (r.branchLen = o(a.branch_horizontal_length)));
            const e = a.branch_start_offset_from_top;
            ((r.branchStart = o({
              type: "uniform",
              min_inclusive: e.min_inclusive,
              max_inclusive: e.max_inclusive,
            })),
              (r.branchStart2 = o({
                type: "uniform",
                min_inclusive: e.min_inclusive,
                max_inclusive: e.max_inclusive - 1,
              })),
              (r.branchEnd = o(a.branch_end_offset_from_top)));
          }
          ("bending_trunk_placer" === s && (r.bendLength = o(a.bend_length)),
            "upwards_branching_trunk_placer" === s &&
              ((r.exLen = o(a.extra_branch_length)), (r.exSteps = o(a.extra_branch_steps))));
          const i = r.fp;
          return (
            (r.fpType = strip(i.type)),
            (r.radius = o(i.radius)),
            (r.offset = o(i.offset)),
            void 0 !== i.height && "number" != typeof i.height && (r.heightP = o(i.height)),
            void 0 !== i.trunk_height && (r.trunkHeightP = o(i.trunk_height)),
            void 0 !== i.crown_height && (r.crownP = o(i.crown_height)),
            void 0 !== i.foliage_height && (r.foliageHeightP = o(i.foliage_height)),
            r
          );
        })(r.raw)),
      p = t.R,
      g = (_.H, new Map()),
      x = new Map(),
      d = new Map(),
      b = new Map(),
      key = (e, t, n) => e + "," + t + "," + n,
      m = {
        R: p,
        r: i,
        T: _,
        setLog: (e, t, n, r) => {
          r && (p.set(e, t, n, r[0], r[1]), x.set(key(e, t, n), [e, t, n]));
        },
        setLeaf: (e, t, n, r) => {
          r && (p.set(e, t, n, r[0], r[1]), d.set(key(e, t, n), [e, t, n]));
        },
        setRoot: (e, t, n, r) => {
          r && (p.set(e, t, n, r[0], r[1]), g.set(key(e, t, n), [e, t, n]));
        },
        leafSet: (e, t, n) => d.has(key(e, t, n)),
      };
    if (
      !(function doPlace(e, t, r, i) {
        const f = e.T,
          h = e.R,
          u = e.r,
          _ = f.tp,
          p = _.base_height + u.nextInt(_.height_rand_a + 1) + u.nextInt(_.height_rand_b + 1),
          g = (function foliageHeight(e, t) {
            const n = e.T,
              r = n.fp,
              o = e.r;
            switch (n.fpType) {
              case "spruce_foliage_placer":
                return Math.max(4, t - n.trunkHeightP(o));
              case "pine_foliage_placer":
                return n.heightP(o);
              case "acacia_foliage_placer":
                return 0;
              case "dark_oak_foliage_placer":
                return 4;
              case "mega_pine_foliage_placer":
                return n.crownP(o);
              case "random_spread_foliage_placer":
                return n.foliageHeightP(o);
              case "cherry_foliage_placer":
                return n.heightP ? n.heightP(o) : r.height;
            }
            return n.heightP ? n.heightP(o) : r.height;
          })(e, p),
          x = (function foliageRadius(e, t) {
            const n = e.T,
              r = e.r,
              o = n.radius(r);
            return "pine_foliage_placer" === n.fpType ? o + r.nextInt(Math.max(t + 1, 1)) : o;
          })(e, p - g);
        let d = t,
          b = r,
          m = i;
        if (f.root) {
          const n = (function rootTrunkOrigin(e, t, n, r) {
            const a = e.T.root,
              s = a.trunk_offset_y ? o(a.trunk_offset_y)(e.r) : 0;
            return [t, n + s, r];
          })(e, t, r, i);
          ((d = n[0]), (b = n[1]), (m = n[2]));
        }
        const v = Math.min(r, b),
          M = Math.max(r, b) + p + 1;
        if (v < h.minY + 1 || M > h.maxY) return !1;
        const I = f.size.min_clipped_height;
        let y = p;
        e: for (let t = 0; t <= p + 1; t++) {
          const n = sizeAt(f, p, t);
          for (let r = -n; r <= n; r++)
            for (let o = -n; o <= n; o++)
              if (
                !isFreeTree(e, d + r, b + t, m + o) ||
                (!f.ignoreVines && h.id(d + r, b + t, m + o) === BID.vine)
              ) {
                y = t - 2;
                break e;
              }
        }
        if (y < p && (void 0 === I || y < I)) return !1;
        if (
          f.root &&
          !(function placeRoots(e, t, r, o, a, s, i) {
            const f = e.T.root,
              h = e.R,
              u = e.r,
              _ = f.mangrove_root_placement,
              p = c(_.can_grow_through),
              g = new Set([].concat(_.muddy_roots_in).map((e) => BID[strip(e)])),
              x = n(f.root_provider),
              d = n(_.muddy_roots_provider),
              b = f.above_root_placement
                ? {
                    p: n(f.above_root_placement.above_root_provider),
                    c: f.above_root_placement.above_root_placement_chance,
                  }
                : null,
              ok = (t, n, r) => baseTreePos(e, t, n, r) || p.has(h.id(t, n, r));
            for (let e = r; e < s; e++) if (!ok(t, e, o)) return !1;
            const m = [[a, s - 1, i]],
              v = _.max_root_length,
              M = _.max_root_width,
              I = _.random_skew_chance,
              potential = (e, t) => {
                const n = [e[0], e[1] - 1, e[2]],
                  r = [e[0] + t[0], e[1], e[2] + t[1]],
                  o = Math.abs(e[0] - a) + Math.abs(e[1] - s) + Math.abs(e[2] - i);
                return o > M - 3 && o <= M
                  ? u.nextFloat() < I
                    ? [n, [r[0], r[1] - 1, r[2]]]
                    : [n]
                  : o > M || u.nextFloat() < I
                    ? [n]
                    : u.nextBoolean()
                      ? [r]
                      : [n];
              },
              simulate = (e, t, n, r) => {
                if (r === v || n.length > v) return !1;
                for (const o of potential(e, t))
                  if (ok(o[0], o[1], o[2]) && (n.push(o), !simulate(o, t, n, r + 1))) return !1;
                return !0;
              };
            for (const e of l) {
              const t = [a + e[0], s, i + e[1]],
                n = [];
              if (!simulate(t, e, n, 0)) return !1;
              m.push(...n, t);
            }
            for (const t of m) {
              if (!ok(t[0], t[1], t[2])) continue;
              const n = h.id(t[0], t[1], t[2]);
              (e.setRoot(
                t[0],
                t[1],
                t[2],
                g.has(n) ? d(u, t[0], t[1], t[2], h) : x(u, t[0], t[1], t[2], h),
              ),
                b &&
                  u.nextFloat() < b.c &&
                  h.isAir(t[0], t[1] + 1, t[2]) &&
                  h.setState(t[0], t[1] + 1, t[2], b.p(u, t[0], t[1] + 1, t[2], h)));
            }
            return !0;
          })(e, t, r, i, d, b, m)
        )
          return !1;
        const w = (function placeTrunk(e, t, n, r, o) {
            const i = e.T,
              c = e.r;
            switch (i.tpType) {
              case "straight_trunk_placer":
                setDirtAt(e, n, r - 1, o);
                for (let a = 0; a < t; a++) placeLog(e, n, r + a, o);
                return [A(n, r + t, o)];
              case "forking_trunk_placer": {
                setDirtAt(e, n, r - 1, o);
                const a = [],
                  s = l[c.nextInt(4)],
                  i = t - c.nextInt(4) - 1;
                let f = 3 - c.nextInt(3),
                  h = n,
                  u = o,
                  _ = null;
                for (let n = 0; n < t; n++) {
                  const t = r + n;
                  (n >= i && f > 0 && ((h += s[0]), (u += s[1]), f--),
                    placeLog(e, h, t, u) && (_ = t + 1));
                }
                (null !== _ && a.push(A(h, _, u, 1)), (h = n), (u = o));
                const p = l[c.nextInt(4)];
                if (p !== s) {
                  const n = i - c.nextInt(2) - 1;
                  let o = 1 + c.nextInt(3);
                  _ = null;
                  for (let a = n; a < t && o > 0; a++, o--) {
                    if (a < 1) continue;
                    const t = r + a;
                    ((h += p[0]), (u += p[1]), placeLog(e, h, t, u) && (_ = t + 1));
                  }
                  null !== _ && a.push(A(h, _, u, 0));
                }
                return a;
              }
              case "giant_trunk_placer":
              case "mega_jungle_trunk_placer": {
                (setDirtAt(e, n, r - 1, o),
                  setDirtAt(e, n + 1, r - 1, o),
                  setDirtAt(e, n, r - 1, o + 1),
                  setDirtAt(e, n + 1, r - 1, o + 1));
                for (let a = 0; a < t; a++)
                  (placeLogIfFree(e, n, r + a, o),
                    a >= t - 1 ||
                      (placeLogIfFree(e, n + 1, r + a, o),
                      placeLogIfFree(e, n + 1, r + a, o + 1),
                      placeLogIfFree(e, n, r + a, o + 1)));
                const l = [A(n, r + t, o, 0, !0)];
                if ("mega_jungle_trunk_placer" === i.tpType)
                  for (let i = t - 2 - c.nextInt(4); i > ((t / 2) | 0); i -= 2 + c.nextInt(4)) {
                    const t = c.nextFloat() * (2 * Math.PI);
                    let f = 0,
                      h = 0;
                    for (let c = 0; c < 5; c++)
                      ((f = Math.trunc(1.5 + s(t) * c)),
                        (h = Math.trunc(1.5 + a(t) * c)),
                        placeLog(e, n + f, r + i - 3 + (c >> 1), o + h));
                    l.push(A(n + f, r + i, o + h, -2));
                  }
                return l;
              }
              case "dark_oak_trunk_placer": {
                (setDirtAt(e, n, r - 1, o),
                  setDirtAt(e, n + 1, r - 1, o),
                  setDirtAt(e, n, r - 1, o + 1),
                  setDirtAt(e, n + 1, r - 1, o + 1));
                const a = [],
                  s = l[c.nextInt(4)],
                  f = t - c.nextInt(4);
                let h = 2 - c.nextInt(3),
                  u = n,
                  _ = o;
                const p = r + t - 1;
                for (let n = 0; n < t; n++) {
                  n >= f && h > 0 && ((u += s[0]), (_ += s[1]), h--);
                  const t = r + n,
                    o = e.R.id(u, t, _);
                  (0 === o || i.H.LEAVES.has(o)) &&
                    (placeLog(e, u, t, _),
                    placeLog(e, u + 1, t, _),
                    placeLog(e, u, t, _ + 1),
                    placeLog(e, u + 1, t, _ + 1));
                }
                a.push(A(u, p, _, 0, !0));
                for (let t = -1; t <= 2; t++)
                  for (let r = -1; r <= 2; r++) {
                    if ((t >= 0 && t <= 1 && r >= 0 && r <= 1) || c.nextInt(3) > 0) continue;
                    const s = c.nextInt(3) + 2;
                    for (let a = 0; a < s; a++) placeLog(e, n + t, p - a - 1, o + r);
                    a.push(A(n + t, p, o + r));
                  }
                return a;
              }
              case "fancy_trunk_placer":
                return (function fancyTrunk(e, t, n, r, o) {
                  const a = e.r,
                    s = t + 2,
                    i = Math.floor(0.618 * s);
                  setDirtAt(e, n, r - 1, o);
                  const c = Math.min(1, Math.floor(1.382 + Math.pow((1 * s) / 13, 2))),
                    l = r + i,
                    f = [{ p: [n, r + i, o], base: l }];
                  for (let t = s - 5; t >= 0; t--) {
                    const i = treeShape(s, t);
                    if (!(i < 0))
                      for (let s = 0; s < c; s++) {
                        const s = 1 * i * (a.nextFloat() + 0.328),
                          c = 2 * a.nextFloat() * Math.PI,
                          h = s * Math.sin(c) + 0.5,
                          u = s * Math.cos(c) + 0.5,
                          _ = [n + Math.floor(h), r + t - 1, o + Math.floor(u)];
                        if (!makeLimb(e, _, [_[0], _[1] + 5, _[2]], !1)) continue;
                        const p = n - _[0],
                          g = o - _[2],
                          x = _[1] - 0.381 * Math.sqrt(p * p + g * g),
                          d = [n, x > l ? l : Math.trunc(x), o];
                        makeLimb(e, d, _, !1) && f.push({ p: _, base: d[1] });
                      }
                  }
                  makeLimb(e, [n, r, o], [n, r + i, o], !0);
                  for (const t of f) {
                    const a = t.base,
                      i = [n, a, o];
                    (i[0] !== t.p[0] || i[1] !== t.p[1] || i[2] !== t.p[2]) &&
                      a - r >= 0.2 * s &&
                      makeLimb(e, i, t.p, !0);
                  }
                  return f
                    .filter((e) => e.base - r >= 0.2 * s)
                    .map((e) => A(e.p[0], e.p[1], e.p[2]));
                })(e, t, n, r, o);
              case "bending_trunk_placer": {
                const a = l[c.nextInt(4)],
                  s = t - 1,
                  f = [];
                let h = n,
                  u = r,
                  _ = o;
                setDirtAt(e, n, r - 1, o);
                for (let t = 0; t <= s; t++)
                  (t + 1 >= s + c.nextInt(2) && ((h += a[0]), (_ += a[1])),
                    validTreePos(e, h, u, _) && placeLog(e, h, u, _),
                    t >= i.tp.min_height_for_leaves && f.push(A(h, u, _)),
                    u++);
                const p = i.bendLength(c);
                for (let t = 0; t <= p; t++)
                  (validTreePos(e, h, u, _) && placeLog(e, h, u, _),
                    f.push(A(h, u, _)),
                    (h += a[0]),
                    (_ += a[1]));
                return f;
              }
              case "upwards_branching_trunk_placer": {
                const a = [],
                  s = i.tp;
                for (let f = 0; f < t; f++) {
                  const h = r + f;
                  if (
                    placeLog(e, n, h, o) &&
                    f < t - 1 &&
                    c.nextFloat() < s.place_branch_per_log_probability
                  ) {
                    const r = l[c.nextInt(4)],
                      s = i.exLen(c),
                      f = Math.max(0, s - i.exLen(c) - 1);
                    let u = h + f,
                      _ = n,
                      p = o,
                      g = f,
                      x = i.exSteps(c);
                    for (; g < t && x > 0;) {
                      if (g >= 1) {
                        const t = h + g;
                        ((u = t),
                          (_ += r[0]),
                          (p += r[1]),
                          placeLog(e, _, t, p) && u++,
                          a.push(A(_, t, p)));
                      }
                      (g++, x--);
                    }
                    u - h > 1 && (a.push(A(_, u, p)), a.push(A(_, u - 2, p)));
                  }
                  f === t - 1 && a.push(A(n, h + 1, o));
                }
                return a;
              }
              case "cherry_trunk_placer": {
                setDirtAt(e, n, r - 1, o);
                const a = Math.max(0, t - 1 + i.branchStart(c));
                let s = Math.max(0, t - 1 + i.branchStart2(c));
                s >= a && s++;
                const f = i.branchCount(c),
                  h = 3 === f,
                  u = f >= 2,
                  _ = h ? t : u ? Math.max(a, s) + 1 : a + 1;
                for (let t = 0; t < _; t++) placeLog(e, n, r + t, o);
                const p = [];
                h && p.push(A(n, r + _, o));
                const g = c.nextInt(4),
                  x = l[g];
                return (
                  p.push(cherryBranch(e, t, n, r, o, x, a, a < _ - 1)),
                  u && p.push(cherryBranch(e, t, n, r, o, [-x[0], -x[1]], s, s < _ - 1)),
                  p
                );
              }
            }
            return [];
          })(e, y, d, b, m),
          k = f.offset(u);
        for (const t of w) createFoliage(e, y, t, g, x, k);
        return !0;
      })(m, f, h, u)
    )
      return !1;
    if (!x.size && !d.size) return !1;
    if (_.decorators.length) {
      const byY = (e) => [...e.values()].sort((e, t) => e[1] - t[1]),
        e = {
          R: p,
          r: i,
          logs: byY(x),
          leaves: byY(d),
          roots: byY(g),
          set: (e, t, n, r) => {
            r && (p.set(e, t, n, r[0], r[1]), b.set(key(e, t, n), 1));
          },
          isAir: (e, t, n) => p.isAir(e, t, n),
        };
      for (const t of _.decorators) decorate(e, t, _);
    }
    return !0;
  };
  const isFreeTree = (e, t, n, r) => validTreePos(e, t, n, r) || e.T.H.LOGS.has(e.R.id(t, n, r));
  function baseTreePos(e, t, n, r) {
    const o = e.R.id(t, n, r);
    return 0 === o || e.T.H.REPLACE_TREES.has(o);
  }
  function validTreePos(e, t, n, r) {
    return (
      !!baseTreePos(e, t, n, r) || (!!e.T.canGrowThrough && e.T.canGrowThrough.has(e.R.id(t, n, r)))
    );
  }
  function placeLog(e, t, n, r, o) {
    if (!validTreePos(e, t, n, r)) return !1;
    let a = e.T.trunkP(e.r, t, n, r, e.R);
    return (
      a && o && BLOCKS[a[0]] && BLOCKS[a[0]].axis && (a = [a[0], f[o]]),
      e.setLog(t, n, r, a),
      !0
    );
  }
  const placeLogIfFree = (e, t, n, r) => {
    isFreeTree(e, t, n, r) && placeLog(e, t, n, r);
  };
  function setDirtAt(e, t, n, r) {
    const o = e.R,
      a = e.T;
    if (!a.belowP) return;
    if (
      !a.forceDirt &&
      a.H.DIRT.has(o.id(t, n, r)) &&
      o.id(t, n, r) !== BID.grass_block &&
      o.id(t, n, r) !== BID.mycelium
    )
      return;
    const s = a.belowP(e.r, t, n, r, o);
    s && o.set(t, n, r, s[0], s[1]);
  }
  function sizeAt(e, t, n) {
    const r = e.size;
    if ("three_layers_feature_size" === strip(r.type)) {
      const e = r.limit ?? 1,
        o = r.upper_limit ?? 1;
      return n < e ? (r.lower_size ?? 0) : n >= t - o ? (r.upper_size ?? 1) : (r.middle_size ?? 1);
    }
    return n < (r.limit ?? 1) ? (r.lower_size ?? 0) : (r.upper_size ?? 1);
  }
  const A = (e, t, n, r = 0, o = !1) => ({ x: e, y: t, z: n, ro: r, dbl: o });
  function cherryBranch(e, t, n, r, o, a, s, i) {
    const c = e.T,
      l = e.r,
      f = a[0] ? "x" : "z";
    let h = n,
      u = r + s,
      _ = o;
    const p = t - 1 + c.branchEnd(l),
      g = i || p < s,
      x = c.branchLen(l) + (g ? 1 : 0),
      d = n + a[0] * x,
      b = r + p,
      m = o + a[1] * x,
      v = g ? 2 : 1;
    for (let t = 0; t < v; t++) ((h += a[0]), (_ += a[1]), placeLog(e, h, u, _, f));
    const M = b > u ? 1 : -1;
    let I;
    for (; 0 !== (I = Math.abs(h - d) + Math.abs(u - b) + Math.abs(_ - m));) {
      const t = Math.fround(Math.abs(b - u) / I),
        n = e.r.nextFloat() < t;
      (n ? (u += M) : ((h += a[0]), (_ += a[1])), placeLog(e, h, u, _, n ? null : f));
    }
    return A(d, b + 1, m);
  }
  function treeShape(e, t) {
    const n = Math.fround;
    if (n(t) < n(0.3 * e)) return -1;
    const r = n(e / 2),
      o = n(r - t);
    let a = n(Math.sqrt(n(n(r * r) - n(o * o))));
    if (0 === o) a = r;
    else if (Math.abs(o) >= r) return 0;
    return n(0.5 * a);
  }
  function makeLimb(e, t, n, r) {
    if (!r && t[0] === n[0] && t[1] === n[1] && t[2] === n[2]) return !0;
    const o = n[0] - t[0],
      a = n[1] - t[1],
      s = n[2] - t[2],
      i = Math.max(Math.abs(o), Math.abs(a), Math.abs(s)),
      c = Math.fround(o / i),
      l = Math.fround(a / i),
      f = Math.fround(s / i);
    for (let n = 0; n <= i; n++) {
      const o = [
        t[0] + Math.floor(Math.fround(0.5 + Math.fround(n * c))),
        t[1] + Math.floor(Math.fround(0.5 + Math.fround(n * l))),
        t[2] + Math.floor(Math.fround(0.5 + Math.fround(n * f))),
      ];
      if (r) {
        const n = Math.abs(o[0] - t[0]),
          r = Math.abs(o[2] - t[2]),
          a = Math.max(n, r);
        placeLog(e, o[0], o[1], o[2], a > 0 ? (n === a ? "x" : "z") : "y");
        continue;
      }
      if (!isFreeTree(e, o[0], o[1], o[2])) return !1;
    }
    return !0;
  }
  function tryPlaceLeaf(e, t, n, r) {
    return !!baseTreePos(e, t, n, r) && (e.setLeaf(t, n, r, e.T.foliageP(e.r, t, n, r, e.R)), !0);
  }
  function skipSigned(e, t, n, r, o, a) {
    if (
      "dark_oak_foliage_placer" === e.T.fpType &&
      0 === n &&
      a &&
      (t === -o || t >= o) &&
      (r === -o || r >= o)
    )
      return !0;
    let s, i;
    return (
      a
        ? ((s = Math.min(Math.abs(t), Math.abs(t - 1))),
          (i = Math.min(Math.abs(r), Math.abs(r - 1))))
        : ((s = Math.abs(t)), (i = Math.abs(r))),
      (function skipLocation(e, t, n, r, o, a) {
        const s = e.T,
          i = e.r,
          c = s.fp;
        switch (s.fpType) {
          case "blob_foliage_placer":
            return t === o && r === o && (0 === i.nextInt(2) || 0 === n);
          case "bush_foliage_placer":
            return t === o && r === o && 0 === i.nextInt(2);
          case "fancy_foliage_placer": {
            const e = Math.fround;
            return e(e(e(t + 0.5) * e(t + 0.5)) + e(e(r + 0.5) * e(r + 0.5))) > e(o * o);
          }
          case "spruce_foliage_placer":
          case "pine_foliage_placer":
            return t === o && r === o && o > 0;
          case "acacia_foliage_placer":
            return 0 === n ? (t > 1 || r > 1) && 0 !== t && 0 !== r : t === o && r === o && o > 0;
          case "jungle_foliage_placer":
          case "mega_pine_foliage_placer":
            return t + r >= 7 || t * t + r * r > o * o;
          case "dark_oak_foliage_placer":
            return -1 !== n || a ? 1 === n && t + r > 2 * o - 2 : t === o && r === o;
          case "cherry_foliage_placer": {
            if (-1 === n && (t === o || r === o) && i.nextFloat() < c.wide_bottom_layer_hole_chance)
              return !0;
            const e = t === o && r === o;
            return o > 2
              ? e || (t + r > 2 * o - 2 && i.nextFloat() < c.corner_hole_chance)
              : e && i.nextFloat() < c.corner_hole_chance;
          }
        }
        return !1;
      })(e, s, n, i, o, a)
    );
  }
  function leavesRow(e, t, n, r, o, a, s) {
    const i = s ? 1 : 0;
    for (let c = -o; c <= o + i; c++)
      for (let l = -o; l <= o + i; l++)
        skipSigned(e, c, a, l, o, s) || tryPlaceLeaf(e, t + c, n + a, r + l);
  }
  function createFoliage(e, t, n, r, o, a) {
    const s = e.T,
      i = e.r,
      c = s.fp,
      l = n.dbl;
    switch (s.fpType) {
      case "blob_foliage_placer":
        for (let t = a; t >= a - r; t--)
          leavesRow(e, n.x, n.y, n.z, Math.max(o + n.ro - 1 - Math.trunc(t / 2), 0), t, l);
        return;
      case "bush_foliage_placer":
        for (let t = a; t >= a - r; t--) leavesRow(e, n.x, n.y, n.z, o + n.ro - 1 - t, t, l);
        return;
      case "fancy_foliage_placer":
        for (let t = a; t >= a - r; t--)
          leavesRow(e, n.x, n.y, n.z, o + (t === a || t === a - r ? 0 : 1), t, l);
        return;
      case "spruce_foliage_placer": {
        let t = i.nextInt(2),
          s = 1,
          c = 0;
        for (let i = a; i >= -r; i--)
          (leavesRow(e, n.x, n.y, n.z, t, i, l),
            t >= s ? ((t = c), (c = 1), (s = Math.min(s + 1, o + n.ro))) : t++);
        return;
      }
      case "pine_foliage_placer": {
        let t = 0;
        for (let s = a; s >= a - r; s--)
          (leavesRow(e, n.x, n.y, n.z, t, s, l),
            t >= 1 && s === a - r + 1 ? t-- : t < o + n.ro && t++);
        return;
      }
      case "acacia_foliage_placer": {
        const t = n.y + a;
        return (
          leavesRow(e, n.x, t, n.z, o + n.ro, -1 - r, l),
          leavesRow(e, n.x, t, n.z, o - 1, -r, l),
          void leavesRow(e, n.x, t, n.z, o + n.ro - 1, 0, l)
        );
      }
      case "jungle_foliage_placer": {
        const t = l ? r : 1 + i.nextInt(2);
        for (let r = a; r >= a - t; r--) leavesRow(e, n.x, n.y, n.z, o + n.ro + 1 - r, r, l);
        return;
      }
      case "mega_pine_foliage_placer": {
        let t = 0;
        for (let s = n.y - r + a; s <= n.y + a; s++) {
          const a = n.y - s,
            i = o + n.ro + Math.floor(Math.fround(3.5 * Math.fround(a / r))),
            c = a > 0 && i === t && !(1 & s) ? i + 1 : i;
          (leavesRow(e, n.x, s, n.z, c, 0, l), (t = i));
        }
        return;
      }
      case "dark_oak_foliage_placer": {
        const t = n.y + a;
        return void (l
          ? (leavesRow(e, n.x, t, n.z, o + 2, -1, l),
            leavesRow(e, n.x, t, n.z, o + 3, 0, l),
            leavesRow(e, n.x, t, n.z, o + 2, 1, l),
            i.nextBoolean() && leavesRow(e, n.x, t, n.z, o, 2, l))
          : (leavesRow(e, n.x, t, n.z, o + 2, -1, l), leavesRow(e, n.x, t, n.z, o + 1, 0, l)));
      }
      case "random_spread_foliage_placer":
        for (let t = 0; t < c.leaf_placement_attempts; t++) {
          const t = i.nextInt(o) - i.nextInt(o),
            a = i.nextInt(r) - i.nextInt(r),
            s = i.nextInt(o) - i.nextInt(o);
          tryPlaceLeaf(e, n.x + t, n.y + a, n.z + s);
        }
        return;
      case "cherry_foliage_placer": {
        const t = n.y + a,
          s = o + n.ro - 1;
        (leavesRow(e, n.x, t, n.z, s - 2, r - 3, l), leavesRow(e, n.x, t, n.z, s - 1, r - 4, l));
        for (let o = r - 5; o >= 0; o--) leavesRow(e, n.x, t, n.z, s, o, l);
        return (
          cherryHanging(e, n.x, t, n.z, s, -1, l),
          void cherryHanging(e, n.x, t, n.z, s - 1, -2, l)
        );
      }
    }
  }
  function cherryHanging(e, t, n, r, o, a, s) {
    const i = e.T.fp,
      c = e.r;
    leavesRow(e, t, n, r, o, a, s);
    const f = s ? 1 : 0,
      h = n - 1;
    for (let s = 0; s < 4; s++) {
      const c = l[s],
        h = l[(s + 1) & 3],
        u = h[0] + h[1] > 0 ? o + f : o;
      let _ = t + h[0] * u - c[0] * o,
        p = n + a - 1,
        g = r + h[1] * u - c[1] * o;
      for (let t = -o; t < o + f; t++) {
        (e.leafSet(_, p + 1, g) &&
          ext(_, p, g, i.hanging_leaves_chance) &&
          ext(_, p - 1, g, i.hanging_leaves_extension_chance),
          (_ += c[0]),
          (g += c[1]));
      }
    }
    function ext(n, o, a, s) {
      return (
        !(Math.abs(n - t) + Math.abs(o - h) + Math.abs(a - r) >= 7) &&
        !(c.nextFloat() > s) &&
        tryPlaceLeaf(e, n, o, a)
      );
    }
  }
  function placeVine(e, t, n, r, o) {
    const a = BID.vine;
    if (void 0 === a) return;
    const s = BLOCKS[a].states.findIndex((e) =>
      ["north", "east", "south", "west", "up"].every((t) => e[t] === (t === o ? "true" : "false")),
    );
    e.set(t, n, r, [a, Math.max(0, s)]);
  }
  function decorate(e, t, r) {
    const o = e.r,
      a = t.d;
    switch (t.t) {
      case "trunk_vine":
        for (const [t, n, r] of e.logs)
          (o.nextInt(3) > 0 && e.isAir(t - 1, n, r) && placeVine(e, t - 1, n, r, "east"),
            o.nextInt(3) > 0 && e.isAir(t + 1, n, r) && placeVine(e, t + 1, n, r, "west"),
            o.nextInt(3) > 0 && e.isAir(t, n, r - 1) && placeVine(e, t, n, r - 1, "south"),
            o.nextInt(3) > 0 && e.isAir(t, n, r + 1) && placeVine(e, t, n, r + 1, "north"));
        return;
      case "leave_vine": {
        const hang = (t, n, r, o) => {
          placeVine(e, t, n, r, o);
          let a = 4;
          for (n--; e.isAir(t, n, r) && a > 0;) (placeVine(e, t, n, r, o), n--, a--);
        };
        for (const [t, n, r] of e.leaves)
          (o.nextFloat() < a.probability && e.isAir(t - 1, n, r) && hang(t - 1, n, r, "east"),
            o.nextFloat() < a.probability && e.isAir(t + 1, n, r) && hang(t + 1, n, r, "west"),
            o.nextFloat() < a.probability && e.isAir(t, n, r - 1) && hang(t, n, r - 1, "south"),
            o.nextFloat() < a.probability && e.isAir(t, n, r + 1) && hang(t, n, r + 1, "north"));
        return;
      }
      case "cocoa": {
        if (o.nextFloat() >= a.probability || !e.logs.length || void 0 === BID.cocoa) return;
        const t = e.logs[0][1];
        for (const [n, r, a] of e.logs.filter((e) => e[1] - t <= 2))
          for (let t = 0; t < 4; t++) {
            if (o.nextFloat() > 0.25) continue;
            const s = l[t],
              i = n - s[0],
              c = a - s[1];
            if (!e.isAir(i, r, c)) continue;
            const f = ["north", "east", "south", "west"][t],
              h = o.nextInt(3),
              u = BLOCKS[BID.cocoa].states.findIndex((e) => e.facing === f && e.age === String(h));
            e.set(i, r, c, [BID.cocoa, Math.max(0, u)]);
          }
        return;
      }
      case "beehive": {
        const t = e.leaves,
          n = e.logs;
        if (!n.length || void 0 === BID.bee_nest) return;
        if (o.nextFloat() >= a.probability) return;
        const r = t.length
            ? Math.max(t[0][1] - 1, n[0][1] + 1)
            : Math.min(n[0][1] + 1 + o.nextInt(3), n[n.length - 1][1]),
          s = [];
        for (const e of n)
          if (e[1] === r)
            for (const [t, n] of [
              [1, 0],
              [0, 1],
              [-1, 0],
            ])
              s.push([e[0] + t, e[1], e[2] + n]);
        if (!s.length) return;
        for (let e = s.length - 1; e > 0; e--) {
          const t = o.nextInt(e + 1);
          [s[e], s[t]] = [s[t], s[e]];
        }
        const i = s.find((t) => e.isAir(t[0], t[1], t[2]) && e.isAir(t[0], t[1], t[2] + 1));
        if (!i) return;
        const c = BLOCKS[BID.bee_nest].states.findIndex(
          (e) => "south" === e.facing && "0" === e.honey_level,
        );
        return void e.set(i[0], i[1], i[2], [BID.bee_nest, Math.max(0, c)]);
      }
      case "alter_ground": {
        const t = n(a.provider),
          s =
            !e.roots.length || (e.logs.length && e.roots[0][1] === e.logs[0][1])
              ? e.logs.concat(
                  e.roots.length && e.logs.length && e.roots[0][1] === e.logs[0][1] ? e.roots : [],
                )
              : e.roots;
        if (!s.length) return;
        const i = s[0][1],
          c = r.H,
          at = (n, r, a) => {
            for (let s = 2; s >= -3; s--) {
              const i = e.R.id(n, r + s, a);
              if (c.DIRT.has(i)) {
                e.set(n, r + s, a, t(o, n, r, a, e.R));
                break;
              }
              if (0 !== i && s < 0) break;
            }
          },
          circle = (e, t, n) => {
            for (let r = -2; r <= 2; r++)
              for (let o = -2; o <= 2; o++)
                (2 === Math.abs(r) && 2 === Math.abs(o)) || at(e + r, t, n + o);
          };
        for (const [e, t, n] of s)
          if (t === i) {
            (circle(e - 1, t, n - 1),
              circle(e + 2, t, n - 1),
              circle(e - 1, t, n + 2),
              circle(e + 2, t, n + 2));
            for (let r = 0; r < 5; r++) {
              const r = o.nextInt(64),
                a = r % 8,
                s = r >> 3;
              (0 !== a && 7 !== a && 0 !== s && 7 !== s) || circle(e - 3 + a, t, n - 3 + s);
            }
          }
        return;
      }
      case "attached_to_leaves":
      case "attached_to_logs": {
        const r = "attached_to_leaves" === t.t ? e.leaves.slice() : e.logs.slice();
        for (let e = r.length - 1; e > 0; e--) {
          const t = o.nextInt(e + 1);
          [r[e], r[t]] = [r[t], r[e]];
        }
        const s = new Set(),
          i = n(a.block_provider),
          c = a.directions.map(
            (e) =>
              ({
                up: [0, 1, 0],
                down: [0, -1, 0],
                north: [0, 0, -1],
                south: [0, 0, 1],
                east: [1, 0, 0],
                west: [-1, 0, 0],
              })[e],
          );
        for (const [t, n, l] of r) {
          const r = c[o.nextInt(c.length)],
            f = t + r[0],
            h = n + r[1],
            u = l + r[2],
            _ = f + "," + h + "," + u;
          if (s.has(_) || !(o.nextFloat() < a.probability)) continue;
          let p = !0;
          for (let o = 1; o <= (a.required_empty_blocks || 1); o++)
            if (!e.isAir(t + r[0] * o, n + r[1] * o, l + r[2] * o)) {
              p = !1;
              break;
            }
          if (p) {
            for (let e = -a.exclusion_radius_xz; e <= a.exclusion_radius_xz; e++)
              for (let t = -a.exclusion_radius_y; t <= a.exclusion_radius_y; t++)
                for (let n = -a.exclusion_radius_xz; n <= a.exclusion_radius_xz; n++)
                  s.add(f + e + "," + (h + t) + "," + (u + n));
            e.set(f, h, u, i(o, f, h, u, e.R));
          }
        }
        return;
      }
      case "place_on_ground": {
        const t = e.roots.length ? e.roots : e.logs;
        if (!t.length) return;
        const r = t[0][1],
          s = t.filter((e) => e[1] === r);
        let i = 1 / 0,
          c = -1 / 0,
          l = 1 / 0,
          f = -1 / 0;
        for (const e of s)
          ((i = Math.min(i, e[0])),
            (c = Math.max(c, e[0])),
            (l = Math.min(l, e[2])),
            (f = Math.max(f, e[2])));
        const h = a.radius ?? 2,
          u = a.height ?? 1,
          _ = n(a.block_state_provider);
        ((i -= h), (c += h), (l -= h), (f += h));
        for (let t = 0; t < (a.tries ?? 128); t++) {
          const t = o.nextIntBetween(i, c),
            n = o.nextIntBetween(r - u, r + u),
            a = o.nextIntBetween(l, f),
            s = e.R.id(t, n + 1, a);
          (0 === s || s === BID.vine) &&
            SOLIDCUBE[e.R.id(t, n, a)] &&
            e.R.height("MOTION_BLOCKING_NO_LEAVES", t, a) <= n + 1 &&
            e.set(t, n + 1, a, _(o, t, n + 1, a, e.R));
        }
        return;
      }
      case "pale_moss": {
        const t = BID.pale_hanging_moss,
          n = BID.pale_moss_carpet;
        for (const [n, r, s] of e.leaves)
          if (
            !(o.nextFloat() >= (a.leaves_probability ?? 0.4)) &&
            void 0 !== t &&
            e.isAir(n, r - 1, s)
          ) {
            let a = 1 + o.nextInt(3),
              i = r - 1;
            for (; a-- > 0 && e.isAir(n, i, s);) (e.set(n, i, s, [t, 0 === a ? 1 : 0]), i--);
          }
        if (void 0 !== n && e.logs.length && o.nextFloat() < (a.ground_probability ?? 0.8)) {
          const [t, r, a] = e.logs[0];
          for (let s = 0; s < 24; s++) {
            const s = t + o.nextInt(7) - 3,
              i = a + o.nextInt(7) - 3;
            e.isAir(s, r, i) && SOLIDCUBE[e.R.id(s, r - 1, i)] && e.set(s, r, i, [n, 0]);
          }
        }
        return;
      }
      case "creaking_heart": {
        if (
          o.nextFloat() >= (a.probability ?? 1) ||
          void 0 === BID.creaking_heart ||
          e.logs.length < 3
        )
          return;
        const t = e.logs[1 + o.nextInt(e.logs.length - 2)];
        return void e.set(t[0], t[1], t[2], [BID.creaking_heart, 1]);
      }
    }
  }
  e.FEATURE.fallen_tree = (e, t, r, a, s, i) => {
    const c = e.R,
      f = t.raw,
      h = n(f.trunk_provider),
      u = o(f.log_length)(r),
      _ = h(r, a, s, i, c);
    if (!_ || !SOLIDCUBE[c.id(a, s - 1, i)] || !c.isAir(a, s, i)) return !1;
    c.set(a, s, i, _[0], 0);
    const p = r.nextInt(4),
      g = l[p],
      x = 2 + r.nextInt(2),
      d = g[0] ? 1 : 2;
    let b = !0;
    for (let e = 0; e < u; e++) {
      const t = a + g[0] * (x + e),
        n = i + g[1] * (x + e);
      if (!c.isAir(t, s, n) || !SOLIDCUBE[c.id(t, s - 1, n)]) {
        b = !1;
        break;
      }
    }
    if (b) for (let e = 0; e < u; e++) c.set(a + g[0] * (x + e), s, i + g[1] * (x + e), _[0], d);
    return !0;
  };
})();
//# sourceURL=js/trees.js
