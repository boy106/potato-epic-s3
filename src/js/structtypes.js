"use strict";
!(function () {
  const e = SG.helpers,
    t = SG.TYPES,
    s = e.D,
    S = (t) => {
      const s = e.stateOf(t);
      if (void 0 === s) throw new Error("state missing from the table: " + t);
      return s;
    },
    AIR = () => S("air"),
    start = (e, t, s, o) => {
      const n = s.reduce(
        (e, t) => [
          Math.min(e[0], t.box[0]),
          Math.min(e[1], t.box[1]),
          Math.min(e[2], t.box[2]),
          Math.max(e[3], t.box[3]),
          Math.max(e[4], t.box[4]),
          Math.max(e[5], t.box[5]),
        ],
        s[0].box.slice(),
      );
      return {
        name: e,
        def: t,
        pieces: s,
        box: n,
        adapt: o || t.terrain_adaptation || "none",
        step: t.step,
      };
    },
    biomeOk = (t, s, o, n, r) =>
      new Set(e.biomeSet(s.biomes)).has(t.biomeAtQuart(o >> 2, n >> 2, r >> 2)),
    centre = (e, t, s, o) => {
      const n = 16 * t + 8,
        r = 16 * s + 8;
      return [n, e.baseHeight(n, r, o) - 1, r];
    },
    pick = (e, t) => e[t.nextInt(e.length)],
    range = (e, t, s) => {
      const o = [];
      for (let n = t; n <= s; n++) o.push(e + n);
      return o;
    };
  t.igloo = (t, s, o, n, r, a) => {
    const i = centre(t, n, r, !1);
    if (!biomeOk(t, o, i[0], i[1], i[2])) return null;
    const l = a.nextInt(4),
      c = [16 * n, 90, 16 * r],
      f = { top: [3, 5], middle: [1, 1], bottom: [3, 7] },
      h = { top: [0, 0, 0], middle: [2, -3, 4], bottom: [0, -3, -2] },
      d = e.rotPosM(3, 0, 0, l, 0, 3, 5),
      u = t.baseHeight(c[0] + d[0], c[2] + d[2]) - 90 - 1,
      mk = (t, s) =>
        e.tplPiece(
          "igloo/" + t,
          [c[0] + h[t][0], 90 + h[t][1] - s + u, c[2] + h[t][2]],
          l,
          0,
          f[t],
          {
            marker: (e, t, s, o, n, r) => {
              "chest" === e &&
                (n(t, s, o, AIR()), r.loot.push([t, s - 1, o, "loot", "chests/igloo_chest"]));
            },
          },
        ),
      _ = [];
    if (a.nextDouble() < 0.5) {
      const e = a.nextInt(8) + 4;
      _.push(mk("bottom", 3 * e));
      for (let t = 0; t < e - 1; t++) _.push(mk("middle", 3 * t));
    }
    const b = mk("top", 0);
    return (
      (b.post = (t, s, o, n) => {
        const r = e.rotPosM(3, 0, 5, l, 0, 3, 5),
          a = b.pos[0] + r[0],
          i = b.pos[1] + r[1],
          c = b.pos[2] + r[2];
        if (a < t || a >= t + 16 || c < s || c >= s + 16) return;
        const f = SG.ID_NAME[n(a, i - 1, c)] || "air";
        "air" !== f && "ladder" !== f && o(a, i, c, S("snow_block"));
      }),
      _.push(b),
      start(s, o, _.filter(Boolean))
    );
  };
  const o = [
      "with_mast",
      "upsidedown_full",
      "upsidedown_fronthalf",
      "upsidedown_backhalf",
      "sideways_full",
      "sideways_fronthalf",
      "sideways_backhalf",
      "rightsideup_full",
      "rightsideup_fronthalf",
      "rightsideup_backhalf",
      "with_mast_degraded",
      "upsidedown_full_degraded",
      "upsidedown_fronthalf_degraded",
      "upsidedown_backhalf_degraded",
      "sideways_full_degraded",
      "sideways_fronthalf_degraded",
      "sideways_backhalf_degraded",
      "rightsideup_full_degraded",
      "rightsideup_fronthalf_degraded",
      "rightsideup_backhalf_degraded",
    ],
    n = [
      "with_mast",
      "sideways_full",
      "sideways_fronthalf",
      "sideways_backhalf",
      "rightsideup_full",
      "rightsideup_fronthalf",
      "rightsideup_backhalf",
      "with_mast_degraded",
      "rightsideup_full_degraded",
      "rightsideup_fronthalf_degraded",
      "rightsideup_backhalf_degraded",
    ],
    r = {
      map_chest: "chests/shipwreck_map",
      treasure_chest: "chests/shipwreck_treasure",
      supply_chest: "chests/shipwreck_supply",
    };
  t.shipwreck = (t, s, a, i, l, c) => {
    const f = !!a.is_beached,
      h = centre(t, i, l, !f);
    if (!biomeOk(t, a, h[0], h[1], h[2])) return null;
    const d = c.nextInt(4),
      u = pick(f ? n : o, c),
      _ = e.TPL["shipwreck/" + u];
    if (!_) return null;
    const b = 16 * i,
      p = 16 * l,
      x = _.size;
    let g = 0,
      w = 0,
      m = 1e9;
    for (let e = 0; e < x[0]; e += 2)
      for (let s = 0; s < x[2]; s += 2) {
        const o = t.baseHeight(b + e, p + s, !f);
        ((g += o), w++, (m = Math.min(m, o)));
      }
    const k = f ? m - (x[1] >> 1) - c.nextInt(3) : Math.floor(g / w),
      M = e.tplPiece("shipwreck/" + u, [b, k, p], d, 0, [4, 15], {
        ignoreAir: !0,
        marker: (e, t, s, o, n, a) => {
          r[e] && a.loot.push([t, s - 1, o, "loot", r[e]]);
        },
      });
    return M && start(s, a, [M]);
  };
  const a = range("underwater_ruin/warm_", 1, 8),
    i = range("underwater_ruin/big_warm_", 4, 7),
    l = range("underwater_ruin/brick_", 1, 8),
    c = range("underwater_ruin/cracked_", 1, 8),
    f = range("underwater_ruin/mossy_", 1, 8),
    BIG = (e) => [1, 2, 3, 8].map((t) => "underwater_ruin/big_" + e + "_" + t);
  ((t.ocean_ruin = (t, s, o, n, r, h) => {
    const d = centre(t, n, r, !0);
    if (!biomeOk(t, o, d[0], d[1], d[2])) return null;
    const u = "warm" === o.biome_temp,
      _ = [],
      b = [16 * n, 90, 16 * r],
      p = h.nextInt(4),
      add = (s, o, n, r) => {
        const mkp = (r, a) => {
          const i = e.TPL[r];
          if (!i) return;
          let l = t.baseHeight(s[0], s[2], !0);
          const c = e.rotPos(i.size[0] - 1, 0, i.size[2] - 1, o);
          let f = l;
          for (const [e, o] of [
            [0, 0],
            [c[0], 0],
            [0, c[2]],
            [c[0], c[2]],
            [c[0] >> 1, c[2] >> 1],
          ])
            f = Math.min(f, t.baseHeight(s[0] + e, s[2] + o, !0));
          (l - 1 - f > 2 && (l = f + 1),
            _.push(
              e.tplPiece(r, [s[0], l, s[2]], o, 0, null, {
                ignoreAir: !0,
                integrity: a,
                marker: (e, t, s, o, r, a) => {
                  "chest" === e &&
                    (r(t, s, o, S("chest[facing=north,type=single,waterlogged=true]")),
                    a.loot.push([
                      t,
                      s,
                      o,
                      "loot",
                      n ? "chests/underwater_ruin_big" : "chests/underwater_ruin_small",
                    ]));
                },
              }),
            ));
        };
        if (u) mkp(pick(n ? i : a, h), r);
        else {
          const e = n ? [BIG("brick"), BIG("cracked"), BIG("mossy")] : [l, c, f],
            t = h.nextInt(e[0].length);
          (mkp(e[0][t], r), mkp(e[1][t], 0.7), mkp(e[2][t], 0.5));
        }
      },
      x = h.nextFloat() <= o.large_probability;
    if ((add(b, p, x, x ? 0.9 : 0.8), x && h.nextFloat() <= o.cluster_probability)) {
      const t = e.rotPos(15, 0, 15, p),
        s = Math.min(b[0], b[0] + t[0]),
        o = Math.min(b[2], b[2] + t[2]),
        ri = (e, t) => e + h.nextInt(t - e + 1),
        n = [
          [-16 + ri(1, 8), 16 + ri(1, 7)],
          [-16 + ri(1, 8), ri(1, 7)],
          [-16 + ri(1, 8), -16 + ri(4, 8)],
          [ri(1, 7), 16 + ri(1, 7)],
          [ri(1, 7), -16 + ri(4, 6)],
          [16 + ri(1, 7), 16 + ri(3, 8)],
          [16 + ri(1, 7), ri(1, 5)],
          [16 + ri(1, 7), -16 + ri(4, 8)],
        ].map(([e, t]) => [s + e, 90, o + t]),
        r = ri(4, 8);
      for (let e = 0; e < r && n.length; e++) {
        add(n.splice(h.nextInt(n.length), 1)[0], h.nextInt(4), !1, 0.8);
      }
    }
    return _.length ? start(s, o, _) : null;
  }),
    (t.nether_fossil = (t, s, o, n, r, a) => {
      const i = 16 * n + a.nextInt(16),
        l = 16 * r + a.nextInt(16),
        c = t.sea;
      let f = e.sampleHeight(t, o.height, a);
      for (; f > c;) {
        const e = t.densityAt(i, f, l) <= 0;
        if ((f--, e && t.densityAt(i, f, l) > 0)) break;
      }
      if (f <= c || !biomeOk(t, o, i, f, l)) return null;
      const h = a.nextInt(4),
        d = "nether_fossils/fossil_" + (1 + a.nextInt(14)),
        u = e.tplPiece(d, [i, f, l], h, 0, null, { ignoreAir: !0 });
      return u && start(s, o, [u]);
    }));
  const h = new Set(["sandstone", "stone", "andesite", "granite", "diorite"]);
  function scattered(e, t, o, n, r, a, i) {
    const l =
        0 === n || 2 === n
          ? [e, t, o, e + r - 1, t + a - 1, o + i - 1]
          : [e, t, o, e + i - 1, t + a - 1, o + r - 1],
      c = 2 === n || 3 === n ? 1 : 0,
      f = 1 === n || 3 === n ? 1 : 0;
    return {
      box: l,
      orient: n,
      wx: (e, t) => (3 === n ? l[3] - t : 1 === n ? l[0] + t : l[0] + e),
      wz: (e, t) => (0 === n ? l[5] - t : 2 === n ? l[2] + t : l[2] + e),
      st: (e) => {
        let t = S(e);
        return (c && (t = s.mir[t][0]), s.rot[t][f]);
      },
    };
  }
  function codePiece(t, s) {
    return {
      kind: "code",
      box: t.box,
      rigid: !0,
      gld: 0,
      junctions: [],
      build: (o, n, r, a, i, l, c, f, h) => {
        if (t.box[3] < o || t.box[0] > o + 15 || t.box[5] < n || t.box[2] > n + 15) return;
        const inChunk = (e, t, s) =>
            e >= o && e < o + 16 && s >= n && s < n + 16 && t >= r && t < r + a,
          d = new Map(),
          st = (e) => {
            let s = d.get(e);
            return (void 0 === s && d.set(e, (s = t.st(e))), s);
          },
          u = {
            set(e, s, o, n) {
              const r = t.wx(e, o),
                a = t.box[1] + s,
                c = t.wz(e, o);
              if (!inChunk(r, a, c)) return;
              const h = st(n),
                d = f(r, a, c);
              SG.SMAP_ID(h) < 0 || ((i[d] = SG.SMAP_ID(h)), (l[d] = SG.SMAP_META(h)));
            },
            box(e, t, s, o, n, r, a, i) {
              for (let l = t; l <= n; l++)
                for (let c = e; c <= o; c++)
                  for (let f = s; f <= r; f++) {
                    const h =
                      l === t || l === n || c === e || c === o || f === s || f === r || void 0 === i
                        ? a
                        : i;
                    h && u.set(c, l, f, h);
                  }
            },
            rnd: (s, o, n) => e.JR(e.posSeed(t.wx(s, n), t.box[1] + o, t.wz(s, n))).nextFloat(),
            get(e, s, o) {
              const n = t.wx(e, o),
                r = t.box[1] + s,
                a = t.wz(e, o);
              return inChunk(n, r, a) ? SG.ID_NAME[c(n, r, a)] || "air" : null;
            },
            down(e, s, o, n) {
              const a = t.wx(e, o),
                h = t.wz(e, o);
              for (let e = t.box[1] + s; e > r; e--) {
                if (!inChunk(a, e, h)) return;
                const t = SG.ID_NAME[c(a, e, h)] || "air";
                if (
                  "air" !== t &&
                  "water" !== t &&
                  "lava" !== t &&
                  !/grass|fern|flower|vine|leaves|seagrass|kelp|bush/.test(t)
                )
                  return;
                const s = st(n),
                  o = f(a, e, h);
                if (SG.SMAP_ID(s) < 0) return;
                ((i[o] = SG.SMAP_ID(s)), (l[o] = SG.SMAP_META(s)));
              }
            },
            chest(e, s, o, n, r) {
              u.set(e, s, o, n);
              const a = t.wx(e, o),
                i = t.box[1] + s,
                l = t.wz(e, o);
              inChunk(a, i, l) && h.loot.push([a, i, l, "loot", r]);
            },
            mob(e, s, o, n) {
              const r = t.wx(e, o),
                a = t.box[1] + s,
                i = t.wz(e, o);
              inChunk(r, a, i) && h.ent.push([r + 0.5, a, i + 0.5, n, {}]);
            },
          };
        s(u);
      },
    };
  }
  ((t.buried_treasure = (e, t, s, o, n, r) => {
    const a = centre(e, o, n, !0);
    if (!biomeOk(e, s, a[0], a[1], a[2])) return null;
    const i = 16 * o + 9,
      l = 16 * n + 9,
      c = {
        kind: "code",
        box: [i - 1, e.minY, l - 1, i + 1, a[1] + 1, l + 1],
        rigid: !1,
        gld: 0,
        junctions: [],
        build: (e, t, s, o, n, r, a, c, f) => {
          if (i < e || i >= e + 16 || l < t || l >= t + 16) return;
          const name = (e) => SG.ID_NAME[e] || "air",
            liquid = (e) => "water" === e || "lava" === e;
          let d = s + o - 1;
          for (; d > s && (0 === a(i, d, l) || liquid(name(a(i, d, l))));) d--;
          for (d++; d > s + 1; d--) {
            const s = a(i, d, l),
              o = a(i, d - 1, l);
            if (!h.has(name(o))) continue;
            const u = s && !liquid(name(s)) ? s : SG.PAL.sand;
            for (const [s, r, f] of [
              [1, 0, 0],
              [-1, 0, 0],
              [0, 0, 1],
              [0, 0, -1],
              [0, 1, 0],
              [0, -1, 0],
            ]) {
              const h = i + s,
                _ = d + r,
                b = l + f;
              if (h < e || h >= e + 16 || b < t || b >= t + 16) continue;
              const p = a(h, _, b);
              if (p && !liquid(name(p))) continue;
              const x = a(h, _ - 1, b);
              n[c(h, _, b)] = (x && !liquid(name(x))) || 1 === r ? u : o;
            }
            const _ = S("chest[facing=north,type=single,waterlogged=false]"),
              b = c(i, d, l);
            return (
              SG.SMAP_ID(_) >= 0 && ((n[b] = SG.SMAP_ID(_)), (r[b] = SG.SMAP_META(_))),
              void f.loot.push([i, d, l, "loot", "chests/buried_treasure"])
            );
          }
        },
      };
    return start(t, s, [c]);
  }),
    (t.ruined_portal = (t, o, n, r, a, i) => {
      const l = n.setups;
      let c = l[0];
      if (l.length > 1) {
        let e = 0;
        for (const t of l) e += t.weight;
        let t = i.nextFloat();
        for (const s of l)
          if (((t -= s.weight / e), t < 0)) {
            c = s;
            break;
          }
      }
      const f = c.air_pocket_probability,
        h = 0 !== f && (1 === f || i.nextFloat() < f),
        d =
          i.nextFloat() < 0.05
            ? "ruined_portal/giant_portal_" + (1 + i.nextInt(3))
            : "ruined_portal/portal_" + (1 + i.nextInt(10)),
        u = e.TPL[d];
      if (!u) return null;
      const _ = i.nextInt(4),
        b = i.nextFloat() < 0.5 ? 0 : 2,
        p = u.size[0],
        x = u.size[2],
        g = [p >> 1, x >> 1],
        w = 16 * r,
        m = 16 * a,
        k = e.rotPosM(0, 0, 0, _, b, g[0], g[1]),
        M = e.rotPosM(p - 1, 0, x - 1, _, b, g[0], g[1]),
        I = w + Math.min(k[0], M[0]),
        A = w + Math.max(k[0], M[0]),
        y = m + Math.min(k[2], M[2]),
        P = m + Math.max(k[2], M[2]),
        G = "on_ocean_floor" === c.placement,
        D = u.size[1],
        E = t.baseHeight(I + ((A - I + 1) >> 1), y + ((P - y + 1) >> 1), G) - 1,
        between = (e, t) => i.nextInt(t - e + 1) + e,
        within = (e, t) => (e < t ? between(e, t) : t),
        v = t.minY + 15;
      let F;
      switch (c.placement) {
        case "in_nether":
          F = h ? between(32, 100) : i.nextFloat() < 0.5 ? between(27, 29) : between(29, 100);
          break;
        case "in_mountain":
          F = within(70, E - D);
          break;
        case "underground":
          F = within(v, E - D);
          break;
        case "partly_buried":
          F = E - D + between(2, 8);
          break;
        default:
          F = E;
      }
      const z = [
          [I, y],
          [A, y],
          [I, P],
          [A, P],
        ],
        H = t.substanceAt
          ? (e, s, o) => {
              const n = t.substanceAt(e, s, o);
              return G ? n === WG.SUB.NONE : n !== WG.SUB.AIR;
            }
          : (e, s, o) => t.densityAt(e, s, o) > 0 || (!G && s < t.sea);
      for (; F > v; F--) {
        let e = 0;
        for (const [t, s] of z) if (H(t, F, s) && 3 === ++e) break;
        if (3 === e) break;
      }
      if (!biomeOk(t, n, w, F, m)) return null;
      const N = c.mossiness,
        R = c.replace_with_blackstone,
        T = {
          stone_bricks: "mossy_stone_bricks",
          stone_brick_stairs: "mossy_stone_brick_stairs",
          stone_brick_slab: "mossy_stone_brick_slab",
          stone_brick_wall: "mossy_stone_brick_wall",
        },
        j = {
          stone_bricks: "polished_blackstone_bricks",
          cracked_stone_bricks: "cracked_polished_blackstone_bricks",
          stone_brick_stairs: "polished_blackstone_brick_stairs",
          stone_brick_slab: "polished_blackstone_brick_slab",
          stone_brick_wall: "polished_blackstone_brick_wall",
          chiseled_stone_bricks: "chiseled_polished_blackstone",
          stone: "blackstone",
          cobblestone: "blackstone",
          mossy_stone_bricks: "polished_blackstone_bricks",
        },
        swap = (t, o) => {
          const n = s.states[t],
            r = n.indexOf("["),
            a = r < 0 ? n : n.slice(0, r);
          if (!o[a]) return t;
          const i = e.stateOf(o[a] + (r < 0 ? "" : n.slice(r)));
          return void 0 === i ? (e.stateOf(o[a]) ?? t) : i;
        },
        J = e.tplPiece(d, [w, F, m], _, b, g, {
          ignoreAir: !h,
          mapState: (t, s, o, n) => {
            const r = e.NAMES[t];
            return "gold_block" === r && e.JR(e.posSeed(s, o, n)).nextFloat() < 0.3
              ? AIR()
              : "lava" === r &&
                  ("on_ocean_floor" === c.placement || e.JR(e.posSeed(s, o, n)).nextFloat() < 0.2)
                ? (e.stateOf("magma_block") ?? t)
                : R
                  ? swap(t, j)
                  : N > 0 && T[r] && e.JR(e.posSeed(s, o, n)).nextFloat() < N
                    ? swap(t, T)
                    : t;
          },
        }),
        L = {
          kind: "code",
          box: [J.box[0] - 3, J.box[1] - 2, J.box[2] - 3, J.box[3] + 3, J.box[1] + 2, J.box[5] + 3],
          rigid: !1,
          gld: 0,
          junctions: [],
          build: (t, s, o, n, r, a, i, l) => {
            const c = (J.box[0] + J.box[3]) / 2,
              f = (J.box[2] + J.box[5]) / 2,
              h = Math.max(J.box[3] - J.box[0], J.box[5] - J.box[2]) / 2 + 2;
            for (let o = Math.max(t, L.box[0]); o <= Math.min(t + 15, L.box[3]); o++)
              for (let t = Math.max(s, L.box[2]); t <= Math.min(s + 15, L.box[5]); t++) {
                const s = Math.hypot(o - c, t - f),
                  n = e.JR(e.posSeed(o, 0, t));
                if (!(s > h || n.nextFloat() > 1 - (s / h) * 0.7))
                  for (let e = J.box[1] + 1; e >= J.box[1] - 2; e--) {
                    const s = i(o, e, t),
                      a = i(o, e + 1, t),
                      c = SG.ID_NAME[s] || "air";
                    if (
                      s &&
                      "water" !== c &&
                      "lava" !== c &&
                      (!a ||
                        "air" === SG.ID_NAME[a] ||
                        /grass|fern|flower|snow/.test(SG.ID_NAME[a]))
                    ) {
                      r[l(o, e, t)] = R
                        ? SG.PAL.blackstone
                        : n.nextFloat() < 0.07
                          ? SG.PAL.magma_block
                          : SG.PAL.netherrack;
                      break;
                    }
                  }
              }
          },
        };
      return start(o, n, [L, J]);
    }));
  const avgGround = (e, t) => {
      let s = 0,
        o = 0;
      for (let n = t[0]; n <= t[3]; n += 2)
        for (let r = t[2]; r <= t[5]; r += 2) ((s += e.baseHeight(n, r)), o++);
      return Math.floor(s / o);
    },
    singlePiece = (e, t, s, o, n, r) => {
      const a = 16 * s,
        i = 16 * o;
      if (
        Math.min(
          e.baseHeight(a, i),
          e.baseHeight(a + n, i),
          e.baseHeight(a, i + r),
          e.baseHeight(a + n, i + r),
        ) -
          1 <
        e.sea
      )
        return null;
      const l = centre(e, s, o, !1);
      return biomeOk(e, t, l[0], l[1], l[2]) ? l : null;
    };
  ((t.swamp_hut = (e, t, s, o, n, r) => {
    const a = centre(e, o, n, !1);
    if (!biomeOk(e, s, a[0], a[1], a[2])) return null;
    const i = scattered(16 * o, 64, 16 * n, r.nextInt(4), 7, 7, 9),
      l = avgGround(e, i.box) - i.box[1];
    ((i.box[1] += l), (i.box[4] += l));
    const c = "spruce_planks",
      f = "oak_log[axis=y]",
      h = "oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]",
      stairs = (e, t = "straight") =>
        `spruce_stairs[facing=${e},half=bottom,shape=${t},waterlogged=false]`;
    return start(t, s, [
      codePiece(i, (e) => {
        (e.box(1, 1, 1, 5, 1, 7, c),
          e.box(1, 4, 2, 5, 4, 7, c),
          e.box(2, 1, 0, 4, 1, 0, c),
          e.box(2, 2, 2, 3, 3, 2, c),
          e.box(1, 2, 3, 1, 3, 6, c),
          e.box(5, 2, 3, 5, 3, 6, c),
          e.box(2, 2, 7, 4, 3, 7, c),
          e.box(1, 0, 2, 1, 3, 2, f),
          e.box(5, 0, 2, 5, 3, 2, f),
          e.box(1, 0, 7, 1, 3, 7, f),
          e.box(5, 0, 7, 5, 3, 7, f),
          e.set(2, 3, 2, h),
          e.set(3, 3, 7, h),
          e.set(1, 3, 4, "air"),
          e.set(5, 3, 4, "air"),
          e.set(5, 3, 5, "air"),
          e.set(1, 3, 5, "potted_red_mushroom"),
          e.set(3, 2, 6, "crafting_table"),
          e.set(4, 2, 6, "cauldron"),
          e.set(1, 2, 1, h),
          e.set(5, 2, 1, h),
          e.box(0, 4, 1, 6, 4, 1, stairs("north")),
          e.box(0, 4, 2, 0, 4, 7, stairs("east")),
          e.box(6, 4, 2, 6, 4, 7, stairs("west")),
          e.box(0, 4, 8, 6, 4, 8, stairs("south")),
          e.set(0, 4, 1, stairs("north", "outer_right")),
          e.set(6, 4, 1, stairs("north", "outer_left")),
          e.set(0, 4, 8, stairs("south", "outer_left")),
          e.set(6, 4, 8, stairs("south", "outer_right")));
        for (const t of [2, 7]) for (const s of [1, 5]) e.down(s, -1, t, f);
        e.mob(2, 2, 5, "cat");
      }),
    ]);
  }),
    (t.desert_pyramid = (e, t, s, o, n, r) => {
      if (!singlePiece(e, s, o, n, 21, 21)) return null;
      const a = scattered(16 * o, 64, 16 * n, r.nextInt(4), 21, 15, 21),
        i = avgGround(e, a.box) - a.box[1] - r.nextInt(3);
      ((a.box[1] += i), (a.box[4] += i));
      const l = "sandstone",
        c = "cut_sandstone",
        f = "chiseled_sandstone",
        h = "orange_terracotta",
        st = (e, t = "bottom") =>
          `sandstone_stairs[facing=${e},half=${t},shape=straight,waterlogged=false]`,
        chest = (e) => `chest[facing=${e},type=single,waterlogged=false]`;
      return start(t, s, [
        codePiece(a, (e) => {
          e.box(0, -4, 0, 20, 0, 20, l);
          for (let t = 1; t <= 9; t++)
            (e.box(t, t, t, 20 - t, t, 20 - t, l),
              e.box(t + 1, t, t + 1, 19 - t, t, 19 - t, "air"));
          for (let t = 0; t <= 20; t++) for (let s = 0; s <= 20; s++) e.down(t, -5, s, l);
          for (const t of [0, 16]) {
            (e.box(t, 0, 0, t + 4, 9, 4, l, "air"),
              e.box(t + 1, 10, 1, t + 3, 10, 3, c),
              e.set(t + 2, 10, 0, st("north")),
              e.set(t + 2, 10, 4, st("south")),
              e.set(t, 10, 2, st("east")),
              e.set(t + 4, 10, 2, st("west")));
            for (const s of [5, 6, 7])
              (e.set(t + 2, s, 0, h),
                e.set(t + 1, s, 0, 6 === s ? h : c),
                e.set(t + 3, s, 0, 6 === s ? h : c));
            (e.set(t + 2, 8, 0, f), e.set(t + 2, 4, 0, f), e.box(t + 1, 1, 1, t + 3, 9, 3, "air"));
          }
          (e.box(8, 0, 0, 12, 4, 4, l, "air"),
            e.box(9, 1, 0, 11, 3, 4, "air"),
            e.set(10, 5, 0, f),
            e.set(9, 4, 0, c),
            e.set(11, 4, 0, c),
            e.set(10, 4, 0, c),
            e.box(8, 5, 0, 12, 5, 0, c),
            e.set(10, 6, 0, st("north")),
            e.box(5, 1, 5, 15, 4, 15, "air"));
          for (const [t, s] of [
            [5, 5],
            [15, 5],
            [5, 15],
            [15, 15],
            [9, 9],
            [11, 9],
            [9, 11],
            [11, 11],
          ])
            e.box(t, 1, s, t, 3, s, c);
          (e.box(8, 0, 8, 12, 0, 12, h),
            e.box(9, 0, 9, 11, 0, 11, l),
            e.set(10, 0, 10, "blue_terracotta"));
          for (const [t, s] of [
            [10, 7],
            [10, 13],
            [7, 10],
            [13, 10],
          ])
            e.set(t, 0, s, h);
          (e.box(8, -14, 8, 12, -9, 12, l, "air"),
            e.box(9, -13, 9, 11, -10, 11, "air"),
            e.box(10, -9, 10, 10, -1, 10, "air"));
          for (const [t, s, o] of [
            [10, 8, "south"],
            [10, 12, "north"],
            [8, 10, "east"],
            [12, 10, "west"],
          ])
            (e.set(t, -12, s, c), e.chest(t, -13, s, chest(o), "chests/desert_pyramid"));
          (e.box(9, -14, 9, 11, -14, 11, "tnt[unstable=false]"),
            e.set(10, -13, 10, "stone_pressure_plate[powered=false]"));
          for (const [t, s] of [
            [9, 9],
            [11, 9],
            [9, 11],
            [11, 11],
          ])
            e.set(t, -11, s, f);
          for (let t = 1; t <= 9; t++)
            (e.set(t, t, 10, st("east")),
              e.set(20 - t, t, 10, st("west")),
              e.set(10, t, 20 - t, st("north")));
          e.set(10, 10, 10, "sandstone_slab[type=bottom,waterlogged=false]");
        }),
      ]);
    }),
    (t.jungle_temple = (e, t, s, o, n, r) => {
      if (!singlePiece(e, s, o, n, 12, 15)) return null;
      const a = scattered(16 * o, 64, 16 * n, r.nextInt(4), 12, 10, 15),
        i = avgGround(e, a.box) - a.box[1];
      ((a.box[1] += i), (a.box[4] += i));
      const l = "mossy_cobblestone",
        cs = (e) => `cobblestone_stairs[facing=${e},half=bottom,shape=straight,waterlogged=false]`,
        c = "redstone_wire[east=none,north=side,power=0,south=side,west=none]",
        f = "redstone_wire[east=side,north=none,power=0,south=none,west=side]",
        h =
          "tripwire[attached=true,disarmed=false,east=true,north=false,powered=false,south=false,west=true]";
      return start(t, s, [
        codePiece(a, (e) => {
          const fill = (t, s, o, n, r, a) => {
              for (let i = s; i <= r; i++)
                for (let s = t; s <= n; s++)
                  for (let t = o; t <= a; t++)
                    e.set(s, i, t, e.rnd(s, i, t) < 0.4 ? "cobblestone" : l);
            },
            air = (t, s, o, n, r, a) => e.box(t, s, o, n, r, a, "air");
          (fill(0, -4, 0, 11, 0, 14),
            fill(2, 1, 2, 9, 2, 2),
            fill(2, 1, 12, 9, 2, 12),
            fill(2, 1, 3, 2, 2, 11),
            fill(9, 1, 3, 9, 2, 11),
            fill(1, 3, 1, 10, 6, 1),
            fill(1, 3, 13, 10, 6, 13),
            fill(1, 3, 2, 1, 6, 12),
            fill(10, 3, 2, 10, 6, 12),
            fill(2, 3, 2, 9, 3, 12),
            fill(2, 6, 2, 9, 6, 12),
            fill(3, 7, 3, 8, 7, 11),
            fill(4, 8, 4, 7, 8, 10),
            air(3, 1, 3, 8, 2, 11),
            air(4, 3, 6, 7, 3, 9),
            air(2, 4, 2, 9, 5, 12),
            air(4, 6, 5, 7, 6, 9),
            air(5, 7, 6, 6, 7, 8),
            air(5, 1, 2, 6, 2, 2),
            air(5, 2, 12, 6, 2, 12),
            air(5, 5, 1, 6, 5, 1),
            air(5, 5, 13, 6, 5, 13));
          for (const [t, s] of [
            [1, 5],
            [10, 5],
            [1, 9],
            [10, 9],
          ])
            e.set(t, 5, s, "air");
          for (const e of [0, 14]) for (const t of [2, 4, 7, 9]) fill(t, 4, e, t, 5, e);
          fill(5, 6, 0, 6, 6, 0);
          for (const e of [0, 11]) {
            for (let t = 2; t <= 12; t += 2) fill(e, 4, t, e, 5, t);
            (fill(e, 6, 5, e, 6, 5), fill(e, 6, 9, e, 6, 9));
          }
          (fill(2, 7, 2, 2, 9, 2),
            fill(9, 7, 2, 9, 9, 2),
            fill(2, 7, 12, 2, 9, 12),
            fill(9, 7, 12, 9, 9, 12),
            fill(4, 9, 4, 4, 9, 4),
            fill(7, 9, 4, 7, 9, 4),
            fill(4, 9, 10, 4, 9, 10),
            fill(7, 9, 10, 7, 9, 10),
            fill(5, 9, 7, 6, 9, 7));
          for (const [t, s, o, n] of [
            [5, 9, 6, "north"],
            [6, 9, 6, "north"],
            [5, 9, 8, "south"],
            [6, 9, 8, "south"],
            [4, 0, 0, "north"],
            [5, 0, 0, "north"],
            [6, 0, 0, "north"],
            [7, 0, 0, "north"],
            [4, 1, 8, "north"],
            [4, 2, 9, "north"],
            [4, 3, 10, "north"],
            [7, 1, 8, "north"],
            [7, 2, 9, "north"],
            [7, 3, 10, "north"],
          ])
            e.set(t, s, o, cs(n));
          (fill(4, 1, 9, 4, 1, 9),
            fill(7, 1, 9, 7, 1, 9),
            fill(4, 1, 10, 7, 2, 10),
            fill(5, 4, 5, 6, 4, 5),
            e.set(4, 4, 5, cs("east")),
            e.set(7, 4, 5, cs("west")));
          for (let t = 0; t < 4; t++)
            (e.set(5, -t, 6 + t, cs("south")),
              e.set(6, -t, 6 + t, cs("south")),
              air(5, -t, 7 + t, 6, -t, 9 + t));
          (air(1, -3, 12, 10, -1, 13), air(1, -3, 1, 3, -1, 13), air(1, -3, 1, 9, -1, 5));
          for (let e = 1; e <= 13; e += 2) fill(1, -3, e, 1, -2, e);
          for (let e = 2; e <= 12; e += 2) fill(1, -1, e, 3, -1, e);
          (fill(2, -2, 1, 5, -2, 1),
            fill(7, -2, 1, 9, -2, 1),
            fill(6, -3, 1, 6, -3, 1),
            fill(6, -1, 1, 6, -1, 1),
            e.set(1, -3, 8, "tripwire_hook[attached=true,facing=east,powered=false]"),
            e.set(4, -3, 8, "tripwire_hook[attached=true,facing=west,powered=false]"),
            e.set(2, -3, 8, h),
            e.set(3, -3, 8, h));
          for (let t = 2; t <= 7; t++) e.set(5, -3, t, c);
          (e.set(5, -3, 1, "redstone_wire[east=none,north=side,power=0,south=none,west=side]"),
            e.set(4, -3, 1, f),
            e.set(3, -3, 1, l),
            e.chest(
              3,
              -2,
              1,
              "dispenser[facing=north,triggered=false]",
              "chests/jungle_temple_dispenser",
            ),
            e.set(3, -2, 2, "vine[east=false,north=false,south=true,up=false,west=false]"),
            e.set(7, -3, 1, "tripwire_hook[attached=true,facing=north,powered=false]"),
            e.set(7, -3, 5, "tripwire_hook[attached=true,facing=south,powered=false]"));
          for (let t = 2; t <= 4; t++)
            e.set(
              7,
              -3,
              t,
              "tripwire[attached=true,disarmed=false,east=false,north=true,powered=false,south=true,west=false]",
            );
          (e.set(8, -3, 6, f),
            e.set(9, -3, 6, "redstone_wire[east=none,north=none,power=0,south=side,west=side]"),
            e.set(9, -3, 5, "redstone_wire[east=none,north=side,power=0,south=up,west=none]"),
            e.set(9, -3, 4, l),
            e.set(9, -2, 4, c),
            e.chest(
              9,
              -2,
              3,
              "dispenser[facing=west,triggered=false]",
              "chests/jungle_temple_dispenser",
            ),
            e.set(8, -1, 3, "vine[east=true,north=false,south=false,up=false,west=false]"),
            e.set(8, -2, 3, "vine[east=true,north=false,south=false,up=false,west=false]"),
            e.chest(
              8,
              -3,
              3,
              "chest[facing=north,type=single,waterlogged=false]",
              "chests/jungle_temple",
            ));
          for (const [t, s, o] of [
            [9, -3, 2],
            [8, -3, 1],
            [4, -3, 5],
            [5, -2, 5],
            [5, -1, 5],
            [6, -3, 5],
            [7, -2, 5],
            [7, -1, 5],
            [8, -3, 5],
          ])
            e.set(t, s, o, l);
          (fill(9, -1, 1, 9, -1, 5), air(8, -3, 8, 10, -1, 10));
          for (const t of [8, 9, 10])
            (e.set(t, -2, 11, "chiseled_stone_bricks"),
              e.set(t, -2, 12, "lever[face=wall,facing=north,powered=false]"));
          (fill(8, -3, 8, 8, -3, 10),
            fill(10, -3, 8, 10, -3, 10),
            e.set(10, -2, 9, l),
            e.set(8, -2, 9, c),
            e.set(8, -2, 10, c),
            e.set(10, -1, 9, "redstone_wire[east=side,north=side,power=0,south=side,west=side]"),
            e.set(9, -2, 8, "sticky_piston[extended=false,facing=up]"),
            e.set(10, -2, 8, "sticky_piston[extended=false,facing=west]"),
            e.set(10, -1, 8, "sticky_piston[extended=false,facing=west]"),
            e.set(10, -2, 10, "repeater[delay=1,facing=north,locked=false,powered=false]"),
            e.chest(
              9,
              -3,
              10,
              "chest[facing=south,type=single,waterlogged=false]",
              "chests/jungle_temple",
            ));
        }),
      ]);
    }),
    (t.mineshaft = (t, s, o, n, r, a) => {
      const i = "mesa" === o.mineshaft_type,
        l = 16 * n + 2,
        c = 16 * r + 2;
      if (!biomeOk(t, o, 16 * n + 8, 50, 16 * r + 8)) return null;
      const f = i ? "dark_oak_planks" : "oak_planks",
        h =
          (i ? "dark_oak_fence" : "oak_fence") +
          "[east=false,north=false,south=false,waterlogged=false,west=false]",
        d = [],
        u = [],
        _ = [],
        free = (e) =>
          !u.some(
            (t) =>
              e[0] <= t[3] &&
              e[3] >= t[0] &&
              e[1] <= t[4] &&
              e[4] >= t[1] &&
              e[2] <= t[5] &&
              e[5] >= t[2],
          ),
        b = [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
        ],
        fill = (e, t, s) => d.push([e[0], e[1], e[2], e[3], e[4], e[5], t, s || 0]),
        p = [l, 50, c, l + 7 + a.nextInt(6), 54 + a.nextInt(6), c + 7 + a.nextInt(6)];
      (u.push(p),
        fill([p[0], p[1], p[2], p[3], p[1], p[5]], "dirt", 1),
        fill([p[0], p[1] + 1, p[2], p[3], p[4], p[5]], "air"));
      const x = [];
      for (let e = 0; e < 4; e++) {
        const t = e % 2 == 0 ? p[3] - p[0] : p[5] - p[2];
        for (let s = a.nextInt(4); s + 3 <= t; s += 4 + a.nextInt(t)) {
          const t = 0 === e || 2 === e ? p[0] + s : 1 === e ? p[3] + 1 : p[0] - 1,
            o = 1 === e || 3 === e ? p[2] + s : 2 === e ? p[5] + 1 : p[2] - 1;
          x.push([t, p[1] + 1, o, e, 1]);
        }
      }
      let g = 0;
      for (; x.length && g < 64;) {
        const [e, t, s, o, n] = x.shift();
        if (n > 8 || Math.abs(e - l) > 80 || Math.abs(s - c) > 80) continue;
        const [r, i] = b[o],
          d = -i,
          p = r,
          w = a.nextInt(100),
          at = (t, o) => [e + r * t + d * o, s + i * t + p * o],
          bx = (e, t, s, o, n, r) => {
            const a = at(e, s),
              i = at(t, o);
            return [
              Math.min(a[0], i[0]),
              n,
              Math.min(a[1], i[1]),
              Math.max(a[0], i[0]),
              r,
              Math.max(a[1], i[1]),
            ];
          };
        if (w >= 80) {
          const e = 0 === a.nextInt(4) ? 6 : 2,
            s = bx(0, 4, -1, 3, t, t + e);
          if (!free(s)) continue;
          (u.push(s),
            g++,
            fill(bx(1, 3, -1, 3, t, t + e), "air"),
            fill(bx(0, 4, 0, 2, t, t + e), "air"),
            fill(bx(1, 3, -1, 3, t - 1, t - 1), f, 3),
            fill(bx(0, 4, 0, 2, t - 1, t - 1), f, 3));
          for (const [s, o] of [
            [1, 0],
            [3, 0],
            [1, 2],
            [3, 2],
          ])
            fill(bx(s, s, o, o, t, t + e), f);
          (x.push([at(5, 0)[0], t, at(5, 0)[1], o, n + 1]),
            x.push([at(2, -2)[0], t, at(2, -2)[1], (o + 3) & 3, n + 1]),
            x.push([at(2, 4)[0], t, at(2, 4)[1], (o + 1) & 3, n + 1]));
        } else if (w >= 70) {
          const e = bx(0, 8, 0, 2, t - 5, t + 2);
          if (!free(e)) continue;
          (u.push(e),
            g++,
            fill(bx(0, 1, 0, 2, t, t + 2), "air"),
            fill(bx(7, 8, 0, 2, t - 5, t - 3), "air"));
          for (let e = 0; e < 5; e++)
            (fill(bx(2 + e, 2 + e, 0, 2, t - e - 1, t + 2 - e), "air"),
              fill(bx(2 + e, 2 + e, 0, 2, t - e - 2, t - e - 2), f, 3));
          x.push([at(9, 0)[0], t - 5, at(9, 0)[1], o, n + 1]);
        } else {
          const e = 2 + a.nextInt(3),
            s = 5 * e,
            r = bx(0, s - 1, 0, 2, t, t + 2);
          if (!free(r)) continue;
          (u.push(r), g++);
          const i = 0 === a.nextInt(3),
            l = !i && 0 === a.nextInt(23);
          (fill(r, "air"), fill(bx(0, s - 1, 0, 2, t - 1, t - 1), f, 3));
          for (let s = 0; s < e; s++) {
            const e = 2 + 5 * s;
            (fill(bx(e, e, 0, 0, t, t + 1), h),
              fill(bx(e, e, 2, 2, t, t + 1), h),
              fill(bx(e, e, 0, 2, t + 2, t + 2), f));
          }
          fill(r, "cobweb", l ? 5 : 4);
          for (let s = 0; s < e; s++) {
            const e = 2 + 5 * s;
            _.push([...at(e - 1, 2), t], [...at(e + 1, 0), t]);
          }
          (i &&
            fill(
              bx(0, s - 1, 1, 1, t, t),
              o % 2 == 0
                ? "rail[shape=north_south,waterlogged=false]"
                : "rail[shape=east_west,waterlogged=false]",
              6,
            ),
            l && fill(bx(s >> 1, s >> 1, 1, 1, t, t), "spawner"));
          const c = at(s, 0),
            d = a.nextInt(4);
          0 === d
            ? x.push([at(s - 2, -1)[0], t, at(s - 2, -1)[1], (o + 3) & 3, n + 1])
            : 1 === d
              ? x.push([at(s - 2, 3)[0], t, at(s - 2, 3)[1], (o + 1) & 3, n + 1])
              : x.push([c[0], t, c[1], o, n + 1]);
        }
      }
      const w = Math.max(...u.map((e) => e[4])),
        m = w - Math.min(...u.map((e) => e[1])) + 1,
        k = t.sea - 10;
      let M = m + t.minY + 1;
      M < k && (M += a.nextInt(k - M));
      const I = M - w;
      for (const e of d) ((e[1] += I), (e[4] += I));
      for (const e of u) ((e[1] += I), (e[4] += I));
      for (const e of _) e[2] += I;
      const A = u.reduce(
        (e, t) => [
          Math.min(e[0], t[0]),
          Math.min(e[1], t[1]),
          Math.min(e[2], t[2]),
          Math.max(e[3], t[3]),
          Math.max(e[4], t[4]),
          Math.max(e[5], t[5]),
        ],
        u[0].slice(),
      );
      return start(s, o, [
        {
          kind: "code",
          box: A,
          rigid: !1,
          gld: 0,
          junctions: [],
          build: (t, s, o, n, r, a, i, l, c) => {
            const liquid = (e) => {
              const t = SG.ID_NAME[e];
              return "water" === t || "lava" === t;
            };
            for (const i of d) {
              const f = S(i[6]),
                h = SG.SMAP_ID(f),
                d = SG.SMAP_META(f);
              if (!(h < 0))
                for (let f = Math.max(i[0], t); f <= Math.min(i[3], t + 15); f++)
                  for (let t = Math.max(i[2], s); t <= Math.min(i[5], s + 15); t++)
                    for (let s = Math.max(i[1], o + 1); s <= Math.min(i[4], o + n - 1); s++) {
                      const o = l(f, s, t),
                        n = r[o];
                      if (liquid(n)) continue;
                      const u = i[7];
                      (1 !== u || n) &&
                        ((2 === u && 0 === n) ||
                          (3 === u && n && !liquid(n)) ||
                          (4 === u &&
                            (s !== i[4] || e.JR(e.posSeed(f, s, t)).nextFloat() > 0.08)) ||
                          (5 === u && e.JR(e.posSeed(f, s, t)).nextFloat() > 0.6) ||
                          (((4 !== u && 5 !== u) || !n) &&
                            ((6 === u &&
                              (e.JR(e.posSeed(f, s, t)).nextFloat() > 0.7 || !r[l(f, s - 1, t)])) ||
                              ((r[o] = h),
                              (a[o] = d),
                              "spawner" === i[6] &&
                                c &&
                                c.loot.push([f, s, t, "spawner", "cave_spider"])))));
                    }
            }
            if (c)
              for (const [i, f, h] of _) {
                if (i < t || i > t + 15 || f < s || f > s + 15 || h <= o || h >= o + n - 1)
                  continue;
                const d = e.JR(e.posSeed(i, h, f));
                if ((d.nextFloat(), 0 !== d.nextInt(100) || r[l(i, h, f)] || !r[l(i, h - 1, f)]))
                  continue;
                const u = S(
                  d.nextBoolean()
                    ? "rail[shape=north_south,waterlogged=false]"
                    : "rail[shape=east_west,waterlogged=false]",
                );
                SG.SMAP_ID(u) < 0 ||
                  ((r[l(i, h, f)] = SG.SMAP_ID(u)),
                  (a[l(i, h, f)] = SG.SMAP_META(u)),
                  c.ent.push([
                    i + 0.5,
                    h + 0.0625,
                    f + 0.5,
                    "minecart:chest",
                    { loot: "chests/abandoned_mineshaft" },
                  ]));
              }
          },
        },
      ]);
    }),
    (SG.SMAP_ID = (e) => SG.smap[2 * e]),
    (SG.SMAP_META = (e) => SG.smap[2 * e + 1]));
})();
//# sourceURL=js/structtypes.js
