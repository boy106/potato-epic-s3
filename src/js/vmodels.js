"use strict";
const VM = {
  ready: !1,
  baked: new Map(),
  DIR: { west: 0, east: 1, down: 2, up: 3, north: 4, south: 5 },
  init() {
    const t = window.VMODELS;
    if (t) {
      for (const e of self.MOD_VMODELS || []) {
        const n = t.models.length,
          mv = (t) => t.map((t) => Object.assign({}, t, { m: t.m + n }));
        t.models.push(...e.models);
        for (const n in e.blocks || {}) {
          const s = e.blocks[n];
          t.blocks[n] = s.variants
            ? { variants: s.variants.map(([t, e]) => [t, mv(e)]) }
            : { multipart: s.multipart.map(([t, e]) => [t, mv(e)]) };
        }
        for (const s in e.items || {}) {
          const r = Object.assign({}, e.items[s]);
          (void 0 !== r.m && (r.m += n), void 0 !== r.gui && (r.gui += n), (t.items[s] = r));
        }
      }
      ((self.MOD_VMODELS = []), (this.data = t), (this.ready = !0));
    }
  },
  has(t) {
    return this.ready && !!this.data.blocks[t];
  },
  bake(t, e = 0, n = 0, s = !1) {
    const r = t + ":" + e + ":" + n + ":" + (s ? 1 : 0);
    let o = this.baked.get(r);
    if (o) return o;
    o = [];
    const a = this.data.models[t],
      vrot = (t) => rotVariant(t, e, n);
    for (const t of a.elements || []) {
      const r = t.from.map((t) => t / 16),
        i = t.to.map((t) => t / 16);
      for (const c in t.faces) {
        const h = t.faces[c],
          u = this.DIR[c],
          f = FACES[u],
          l = T(h.tex);
        if (void 0 === l || l < 0) continue;
        const p = f.c.map((t) => [t[0] ? i[0] : r[0], t[1] ? i[1] : r[1], t[2] ? i[2] : r[2]]),
          span = (t, e, n) => (n - e > 1e-6 ? (t - e) / (n - e) : 0);
        let m = p.map((t) => {
            let e, n;
            switch (u) {
              case 0:
                ((e = span(t[2], r[2], i[2])), (n = span(i[1] - t[1] + r[1], r[1], i[1])));
                break;
              case 1:
                ((e = span(i[2] - t[2] + r[2], r[2], i[2])),
                  (n = span(i[1] - t[1] + r[1], r[1], i[1])));
                break;
              case 2:
                ((e = span(t[0], r[0], i[0])), (n = span(i[2] - t[2] + r[2], r[2], i[2])));
                break;
              case 3:
                ((e = span(t[0], r[0], i[0])), (n = span(t[2], r[2], i[2])));
                break;
              case 4:
                ((e = span(i[0] - t[0] + r[0], r[0], i[0])),
                  (n = span(i[1] - t[1] + r[1], r[1], i[1])));
                break;
              default:
                ((e = span(t[0], r[0], i[0])), (n = span(i[1] - t[1] + r[1], r[1], i[1])));
            }
            const s = ((h.rot || 0) / 90) & 3;
            1 === s
              ? ([e, n] = [n, 1 - e])
              : 2 === s
                ? ([e, n] = [1 - e, 1 - n])
                : 3 === s && ([e, n] = [1 - n, e]);
            const o = h.uv;
            return [(o[0] + (o[2] - o[0]) * e) / 16, (o[1] + (o[3] - o[1]) * n) / 16];
          }),
          d = p;
        (t.rot && t.rot.angle && (d = d.map((e) => rotElement(e, t.rot))), (d = d.map(vrot)));
        let k = rotVariant([0.5 + f.n[0], 0.5 + f.n[1], 0.5 + f.n[2]], e, n).map((t) => t - 0.5);
        if (t.rot && t.rot.angle) {
          k = rotVariant(
            rotElement([0.5 + f.n[0], 0.5 + f.n[1], 0.5 + f.n[2]], {
              ...t.rot,
              origin: [8, 8, 8],
              rescale: !1,
            }),
            e,
            n,
          ).map((t) => t - 0.5);
        }
        const C = axisDir(k);
        s && (e || n) && C >= 0 && (m = d.map((t) => FACES[C].uv(t[0], t[1], t[2])));
        let g = -1;
        if (h.cull) {
          const t = FACES[this.DIR[h.cull]].n;
          g = axisDir(rotVariant([0.5 + t[0], 0.5 + t[1], 0.5 + t[2]], e, n).map((t) => t - 0.5));
        }
        const M = h.ct ? Object.fromEntries(Object.entries(h.ct).map(([t, e]) => [t, T(e)])) : null;
        o.push({
          p: d,
          uv: m,
          layer: l,
          anim: ANIM_FRAMES[l],
          tint: h.tint,
          cull: g,
          dir: C,
          shade: !1 !== t.shade,
          n: k,
          ao: a.ao,
          ct: M,
        });
      }
    }
    return (this.baked.set(r, o), o);
  },
  select(t, e, n) {
    const s = this.data.blocks[t],
      r = [];
    if (!s) return r;
    const pick = (t) => {
      if (1 === t.length) return t[0];
      let e = 0;
      for (const n of t) e += n.w;
      let s = n * e;
      for (const e of t) if (((s -= e.w), s < 0)) return e;
      return t[0];
    };
    if (s.variants)
      for (const [t, n] of s.variants) {
        let s = !0;
        for (const n in t)
          if (String(e[n]) !== t[n]) {
            s = !1;
            break;
          }
        if (s) {
          const t = pick(n);
          r.push(this.bake(t.m, t.x, t.y, t.uvlock));
          break;
        }
      }
    else
      for (const [t, n] of s.multipart)
        if (!t || matchWhen(t, e)) {
          const t = pick(n);
          r.push(this.bake(t.m, t.x, t.y, t.uvlock));
        }
    return r;
  },
};
function matchWhen(t, e) {
  if (t.OR) return t.OR.some((t) => matchWhen(t, e));
  if (t.AND) return t.AND.every((t) => matchWhen(t, e));
  for (const n in t) if (!String(t[n]).split("|").includes(String(e[n]))) return !1;
  return !0;
}
function axisDir(t) {
  const e = Math.abs(t[0]),
    n = Math.abs(t[1]),
    s = Math.abs(t[2]);
  return e > 0.99
    ? t[0] < 0
      ? 0
      : 1
    : n > 0.99
      ? t[1] < 0
        ? 2
        : 3
      : s > 0.99
        ? t[2] < 0
          ? 4
          : 5
        : -1;
}
function rotAxis(t, e, n, s) {
  const r = Math.cos(s),
    o = Math.sin(s),
    a = t[0] - e[0],
    i = t[1] - e[1],
    c = t[2] - e[2];
  return "x" === n
    ? [t[0], e[1] + i * r - c * o, e[2] + i * o + c * r]
    : "y" === n
      ? [e[0] + a * r + c * o, t[1], e[2] - a * o + c * r]
      : [e[0] + a * r - i * o, e[1] + a * o + i * r, t[2]];
}
function rotElement(t, e) {
  const n = e.origin.map((t) => t / 16),
    s = (e.angle * Math.PI) / 180;
  let r = rotAxis(t, n, e.axis, s);
  if (e.rescale) {
    const t = 1 / Math.cos(Math.abs(s) > Math.PI / 8 ? Math.PI / 4 : Math.PI / 8);
    r = r.map((s, r) => ("xyz"[r] === e.axis ? s : n[r] + (s - n[r]) * t));
  }
  return r;
}
function rotVariant(t, e, n) {
  let s = t;
  return (
    e && (s = rotAxis(s, [0.5, 0.5, 0.5], "x", (-e * Math.PI) / 180)),
    n && (s = rotAxis(s, [0.5, 0.5, 0.5], "y", (-n * Math.PI) / 180)),
    s.map((t) => Math.round(1e5 * t) / 1e5)
  );
}
const FACING4 = ["east", "west", "south", "north"],
  DIR_VEC = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] },
  CCW = { north: "west", west: "south", south: "east", east: "north" },
  OPPOSITE = { north: "south", south: "north", west: "east", east: "west" };
function connects(t, e) {
  if (SOLIDCUBE[e]) return !0;
  const n = BLOCKS[e];
  if (!n) return !1;
  if (n.fence) {
    if (n.fence === t.fence) return !0;
    if (!(("wall" !== t.fence && "pane" !== t.fence) || ("wall" !== n.fence && "pane" !== n.fence)))
      return !0;
  }
  return !!n.gate && "pane" !== t.fence;
}
function connBits(t, e) {
  let n = 0;
  return (
    connects(t, e(-1, 0)) && (n |= 1),
    connects(t, e(1, 0)) && (n |= 2),
    connects(t, e(0, -1)) && (n |= 4),
    connects(t, e(0, 1)) && (n |= 8),
    n
  );
}
function vanillaState(t, e, n) {
  const s = t.key;
  if (t.states) return { key: s, p: t.states[e] || t.states[0] };
  if (t.stairs) {
    const t = FACING4[3 & e],
      r = 4 & e ? "top" : "bottom",
      st = (t, e) => {
        if (!n) return null;
        const [s, r] = n(t, 0, e);
        return BLOCKS[s] && BLOCKS[s].stairs
          ? { facing: FACING4[3 & r], half: 4 & r ? "top" : "bottom" }
          : null;
      },
      canTake = (e) => {
        const n = DIR_VEC[e],
          s = st(n[0], n[1]);
        return !s || s.facing !== t || s.half !== r;
      };
    let o = "straight";
    const a = DIR_VEC[t],
      i = st(a[0], a[1]);
    if (
      i &&
      i.half === r &&
      (0 !== DIR_VEC[i.facing][0]) != (0 !== a[0]) &&
      canTake(OPPOSITE[i.facing])
    )
      o = i.facing === CCW[t] ? "outer_left" : "outer_right";
    else {
      const e = st(-a[0], -a[1]);
      e &&
        e.half === r &&
        (0 !== DIR_VEC[e.facing][0]) != (0 !== a[0]) &&
        canTake(e.facing) &&
        (o = e.facing === CCW[t] ? "inner_left" : "inner_right");
    }
    return { key: s, p: { facing: t, half: r, shape: o } };
  }
  if (t.slab) return { key: s, p: { type: ["bottom", "top", "double", "double"][3 & e] } };
  if (t.fence) {
    const r = n ? connBits(t, (t, e) => n(t, 0, e)[0]) : e;
    if ("wall" === t.fence) {
      const t = 3 === r || 12 === r,
        e = n ? n(0, 1, 0)[0] : 0,
        o = SOLIDCUBE[e] || (BLOCKS[e] && "wall" === BLOCKS[e].fence),
        side = (t) => (r & t ? (o ? "tall" : "low") : "none");
      return {
        key: s,
        p: {
          west: side(1),
          east: side(2),
          north: side(4),
          south: side(8),
          up: !(t && (!BLOCKS[e] || "wall" !== BLOCKS[e].fence)),
        },
      };
    }
    return { key: s, p: { west: !!(1 & r), east: !!(2 & r), north: !!(4 & r), south: !!(8 & r) } };
  }
  if (t.bed)
    return {
      key: s,
      p: {
        facing: ["north", "east", "south", "west"][3 & e],
        part: 4 & e ? "head" : "foot",
        occupied: !1,
      },
    };
  if (t.door)
    return {
      key: s,
      p: {
        facing: FACING4[3 & e],
        half: 8 & e ? "upper" : "lower",
        open: !!(4 & e),
        hinge: 16 & e ? "right" : "left",
      },
    };
  if (t.trapdoor)
    return {
      key: s,
      p: {
        facing: ["north", "south", "west", "east"][3 & e],
        half: 8 & e ? "top" : "bottom",
        open: !!(4 & e),
      },
    };
  if (t.ladder)
    return {
      key: s,
      p: { facing: { 0: "east", 1: "west", 4: "south", 5: "north" }[e] || "north" },
    };
  switch (s) {
    case "torch":
      return e
        ? {
            key: "wall_torch",
            p: { facing: { 0: "east", 1: "west", 4: "south", 5: "north" }[e] || "north" },
          }
        : { key: "torch", p: {} };
    case "farmland":
      return { key: s, p: { moisture: e ? 7 : 0 } };
    case "snow":
      return { key: s, p: { layers: 1 + (7 & e) } };
    case "wheat":
      return { key: s, p: { age: 7 & e } };
    case "nether_wart":
      return { key: s, p: { age: Math.min(3, 3 & e) } };
    case "end_portal_frame":
      return { key: s, p: { eye: !!(4 & e), facing: "south" } };
    case "nether_portal":
      return { key: s, p: { axis: 1 & e ? "z" : "x" } };
  }
  return { key: s, p: {} };
}
Mesher.vmodel = function (t, e, n, s, r, o, a, i, c) {
  const h = this.ids,
    u = this.metas,
    f = this.lights,
    l = vanillaState(t, e, (t, e, o) => {
      const a = this.P(n + t, s + e, r + o);
      return [h[a], u[a]];
    });
  if (!VM.data.blocks[l.key]) return !1;
  const p = hash3(o + n, a + s, i + r, 1234),
    m = VM.select(l.key, l.p, p),
    d = "translucent" === t.render ? this.transBuf : this.opaqueBuf,
    k = "stem" === t.tint ? stemTint(l.p.age) : t.tint ? this.tintOf(t, n, r) : null,
    C = f[this.P(n, s, r)],
    g = FAST_LEAVES && !c && LEAF_BLOCK[h[this.P(n, s, r)]],
    M = g ? SOLID_LEAF : 0;
  for (const e of m)
    for (const u of e) {
      if (!c && u.cull >= 0) {
        const e = FACES[u.cull].n,
          o = h[this.P(n + e[0], s + e[1], r + e[2])];
        if (SOLIDCUBE[o] || (g && LEAF_BLOCK[o])) continue;
        if (t.cullSame && o === t.id) continue;
      }
      const e = u.ct && !c ? this.ctLayer(u, n, s, r) : u.layer;
      let f = 255,
        l = 255,
        p = 255;
      u.tint >= 0 && k && ((f = k[0]), (l = k[1]), (p = k[2]));
      const m =
        u.shade && u.dir >= 0 ? FACE_SHADE[u.dir] : u.shade ? 0.8 + 0.2 * Math.max(0, u.n[1]) : 1;
      if (c) {
        for (let t = 0; t < 4; t++)
          d.v(
            o + n + u.p[t][0],
            a + s + u.p[t][1],
            i + r + u.p[t][2],
            u.uv[t][0],
            u.uv[t][1],
            e,
            0,
            f,
            l,
            p,
            Math.round(255 * m),
            255,
            255,
            u.anim,
          );
        continue;
      }
      if (u.dir < 0) {
        const t = Math.round(17 * (C >> 4)),
          c = Math.round(17 * (15 & C)),
          h = Math.round(255 * m);
        for (let m = 0; m < 4; m++)
          d.v(
            o + n + u.p[m][0],
            a + s + u.p[m][1],
            i + r + u.p[m][2],
            u.uv[m][0],
            u.uv[m][1],
            e,
            M,
            f,
            l,
            p,
            h,
            t,
            c,
            u.anim,
          );
        continue;
      }
      const y = FACES[u.dir],
        E = y.n,
        S = E[0] ? 0 : E[1] ? 1 : 2,
        b = E[S] > 0 ? 1 : 0,
        O = u.p.every((t) => Math.abs(t[S] - b) < 1e-4),
        w = this.faceCorners(n, s, r, u.dir, O, u.ao),
        I = [0, 1, 2].filter((t) => t !== S);
      for (let t = 0; t < 4; t++) {
        const c = u.p[t],
          h = clamp(c[I[0]], 0, 1),
          k = clamp(c[I[1]], 0, 1);
        let C = 0,
          g = 0,
          E = 0;
        for (let t = 0; t < 4; t++) {
          const e = y.c[t],
            n = (e[I[0]] ? h : 1 - h) * (e[I[1]] ? k : 1 - k);
          ((C += w.ao[t] * n), (g += w.sk[t] * n), (E += w.bk[t] * n));
        }
        d.v(
          o + n + c[0],
          a + s + c[1],
          i + r + c[2],
          u.uv[t][0],
          u.uv[t][1],
          e,
          M,
          f,
          l,
          p,
          Math.round(m * C * 255),
          Math.round(17 * g),
          Math.round(17 * E),
          u.anim,
        );
      }
    }
  return !0;
};
const CT_SIDES = [
  [
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, -1],
    [0, 0, 1],
  ],
  [
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ],
  [
    [0, 0, 1],
    [0, 0, -1],
    [-1, 0, 0],
    [1, 0, 0],
  ],
  [
    [0, 0, -1],
    [0, 0, 1],
    [-1, 0, 0],
    [1, 0, 0],
  ],
  [
    [0, 1, 0],
    [0, -1, 0],
    [1, 0, 0],
    [-1, 0, 0],
  ],
  [
    [0, 1, 0],
    [0, -1, 0],
    [-1, 0, 0],
    [1, 0, 0],
  ],
];
((Mesher.ctLayer = function (t, e, n, s) {
  if (t.dir < 0) return t.layer;
  const r = this.ids,
    o = r[this.P(e, n, s)],
    a = CT_SIDES[t.dir];
  let i = "";
  for (let t = 0; t < 4; t++) {
    const c = a[t];
    r[this.P(e + c[0], n + c[1], s + c[2])] === o && (i += "udlr"[t]);
  }
  return i && void 0 !== t.ct[i] ? t.ct[i] : t.layer;
}),
  (Mesher.faceCorners = function (t, e, n, s, r, o) {
    const a = this.ids,
      i = this.lights,
      c = FACES[s],
      h = c.n,
      u = t + (r ? h[0] : 0),
      f = e + (r ? h[1] : 0),
      l = n + (r ? h[2] : 0),
      p = [1, 1, 1, 1],
      m = [0, 0, 0, 0],
      d = [0, 0, 0, 0],
      k = this.P(u, f, l),
      C = r && o ? AOCUBE[a[k]] : 0;
    let g = i[k];
    if (!r) {
      const s = this.P(t + h[0], e + h[1], n + h[2]);
      g = (Math.max(g >> 4, i[s] >> 4) << 4) | Math.max(15 & g, 15 & i[s]);
    }
    for (let t = 0; t < 4; t++) {
      const e = c.c[t];
      let n = 0,
        s = 0,
        k = 0,
        M = 0,
        y = 0,
        E = 0;
      h[0]
        ? ((s = e[1] ? 1 : -1), (E = e[2] ? 1 : -1))
        : h[1]
          ? ((n = e[0] ? 1 : -1), (E = e[2] ? 1 : -1))
          : ((n = e[0] ? 1 : -1), (y = e[1] ? 1 : -1));
      const S = this.P(u + n, f + s, l + k),
        b = this.P(u + M, f + y, l + E),
        O = this.P(u + n + M, f + s + y, l + k + E),
        w = SOLIDCUBE[a[S]],
        I = SOLIDCUBE[a[b]],
        A = SOLIDCUBE[a[O]];
      if (o) {
        const e = AOCUBE[a[S]],
          n = AOCUBE[a[b]],
          s = e && n ? 1 : AOCUBE[a[O]];
        p[t] = (4 - 0.8 * (C + e + n + s)) / 4;
      }
      let v = g >> 4,
        D = 15 & g,
        L = 1;
      (r &&
        (w || ((v += i[S] >> 4), (D += 15 & i[S]), L++),
        I || ((v += i[b] >> 4), (D += 15 & i[b]), L++),
        A || (w && I) || ((v += i[O] >> 4), (D += 15 & i[O]), L++)),
        (m[t] = v / L),
        (d[t] = D / L));
    }
    return { ao: p, sk: m, bk: d };
  }),
  VM.init());
//# sourceURL=js/vmodels.js
