"use strict";
const Cosmetics = (() => {
  const t = [
      { id: "hat:straw", kind: "hat", name: "草帽" },
      { id: "hat:tophat", kind: "hat", name: "礼帽" },
      { id: "hat:crown", kind: "hat", name: "皇冠" },
      { id: "pet:snowman", kind: "pet", name: "小雪人" },
      { id: "pre:potato", kind: "pre", name: "土豆前缀" },
      { id: "cape:penguin", kind: "cape", name: "企鹅披风" },
      { id: "cape:penguinwalk", kind: "cape", name: "企鹅披风（动态）" },
      { id: "cape:goldapple", kind: "cape", name: "金苹果披风" },
      { id: "pet:lantern", kind: "pet", name: "灯笼小精灵", how: ["更新公告的礼物"] },
      {
        id: "hat:chef",
        kind: "hat",
        name: "厨师帽",
        how: ["第一次打开「模组」下载界面就送", "点一下去模组界面"],
        go: "mods",
      },
      { id: "cape:smeltery", kind: "cape", name: "冶炼炉披风", how: ["即将推出"] },
      {
        id: "cape:fireworks",
        kind: "cape",
        name: "烟花夜空披风",
        how: ["加入股东名单就送（关注 UP 主后就能加入）", "点一下去股东名单"],
        go: "shareholders",
      },
    ],
    info = (e) => t.find((t) => t.id === e) || null,
    owned = () =>
      "undefined" != typeof Account && Account.loggedIn && Account.data
        ? Account.data.super
          ? [...new Set([...t.map((t) => t.id), ...(Account.data.owned || [])])]
          : Array.isArray(Account.data.owned)
            ? Account.data.owned
            : []
        : [],
    mode = (t) => {
      if (self.POTATO) {
        const e = t && t.ui && t.ui.screen,
          o = self.XZ;
        return e && o && o.LadderScreen && e instanceof o.LadderScreen ? "all" : "mine";
      }
      return (t && t.settings && t.settings.cosShow) || "all";
    };
  function shown(t, e, o) {
    if (o && o.inv) return !0;
    const n = mode(t);
    return "all" === n || ("mine" === n && !!t && e === t.player);
  }
  function lookOf(t, e) {
    if (t && e === t.player) {
      const t =
        ("undefined" != typeof Skins && Skins.preview()) ||
        ("undefined" != typeof Account && Account.data && Account.data.skin) ||
        null;
      if (!t) return null;
      const e = owned(),
        ok = (o) => (t[o] && e.includes(o + ":" + t[o]) ? t[o] : null);
      return { hat: ok("hat"), pet: ok("pet"), pre: ok("pre") };
    }
    return (
      (e && e.look) || (t && t.net && t.net.looks && e && e.name && t.net.looks.get(e.name)) || null
    );
  }
  const hasKey = (t, e) => !!e && Object.prototype.hasOwnProperty.call(t, e),
    worn = (t, e, o) => {
      const n = lookOf(t, e),
        a = n && n[o];
      return hasKey("hat" === o ? p : "pet" === o ? d : F, a) ? a : null;
    };
  const hash = (t, e, o) => {
      const n = 43758.5453 * Math.sin(12.9898 * t + 78.233 * e + 37.719 * o);
      return n - Math.floor(n);
    },
    e = { top: 1, bottom: 2, front: 3, back: 4, left: 5, right: 6 },
    o = "#ECBF57",
    n = "#D8B45E",
    a = [
      "DDDDDDDL",
      "DDLLLLLD",
      "DLLDDDDD",
      "DLDLLLLD",
      "DDDDLDLD",
      "DDLLLDDD",
      "DDDLDLDD",
      "DDDDDDLL",
    ],
    straw = (t, e) => ((t + e) % 2 ? n : o),
    r = "#1C1C22",
    s = "#F2C94C",
    i = "#FFE27A",
    l = "#C8961E",
    p = {
      straw: [
        {
          name: "head",
          pivot: [0, 24, 0],
          boxes: [
            [
              -7,
              5,
              -7,
              14,
              1,
              14,
              0,
              (t, e, o) => ("bottom" === t ? ((e + o) % 2 ? "#B8954A" : "#A8873F") : straw(e, o)),
            ],
            [
              -4,
              6,
              -4,
              8,
              4,
              8,
              0.65,
              (t, r, s) =>
                "top" === t
                  ? "L" === a[s][r]
                    ? o
                    : n
                  : "bottom" === t
                    ? n
                    : 2 === s
                      ? (7 * r + e[t]) % 3
                        ? "#8A1E1E"
                        : "#701515"
                      : straw(r, s),
            ],
          ],
        },
      ],
      tophat: [
        {
          name: "head",
          pivot: [0, 24, 0],
          boxes: [
            [
              -6,
              8.6,
              -6,
              12,
              1,
              12,
              0,
              (t, e, o, n) =>
                "bottom" === t
                  ? "#141418"
                  : "top" === t
                    ? 0 === e || 0 === o || e === n - 1 || o === n - 1
                      ? "#2A2A33"
                      : "#1A1A20"
                    : "#24242C",
            ],
            [
              -3.5,
              9.6,
              -3.5,
              7,
              7,
              7,
              0,
              (t, e, o) =>
                "top" === t
                  ? (e + o) % 4
                    ? "#26262E"
                    : "#2E2E38"
                  : "bottom" === t
                    ? r
                    : 5 === o
                      ? "#9A1A2C"
                      : 6 === o
                        ? "#7A1020"
                        : 1 === e
                          ? "#34343F"
                          : r,
            ],
          ],
        },
      ],
      crown: [
        {
          name: "head",
          pivot: [0, 24, 0],
          boxes: (() => {
            const band = (t) => (e, o, n, a) => {
                if ("top" === e) return i;
                if ("bottom" === e) return l;
                const r = a / 2;
                return ("front" !== e && "back" !== e) || !t || (o !== r - 1 && o !== r)
                  ? ("front" !== e && "back" !== e) || !t || (1 !== o && o !== a - 2)
                    ? ("left" !== e && "right" !== e) || t || (o !== r - 1 && o !== r)
                      ? 0 === n
                        ? i
                        : s
                      : "#2FC46A"
                    : n
                      ? "#3A6AE0"
                      : i
                  : "#E0303A";
              },
              pt = (t, e, o, n, a) => ("top" === t ? "#FFF2A0" : 0 === o && a > 1 ? i : s),
              t = [
                [-5, 7.5, -5, 10, 2, 1, 0, band(!0)],
                [-5, 7.5, 4, 10, 2, 1, 0, band(!0)],
                [4, 7.5, -4, 1, 2, 8, 0, band(!1)],
                [-5, 7.5, -4, 1, 2, 8, 0, band(!1)],
              ];
            for (const [e, o] of [
              [-5, -5],
              [4, -5],
              [-5, 4],
              [4, 4],
            ])
              t.push([e, 9.5, o, 1, 1, 1, 0, pt]);
            for (const [e, o] of [
              [-0.5, -5],
              [-0.5, 4],
              [4, -0.5],
              [-5, -0.5],
            ])
              t.push([e, 9.5, o, 1, 2, 1, 0, pt]);
            return t;
          })(),
        },
      ],
      chef: [
        {
          name: "head",
          pivot: [0, 24, 0],
          boxes: [
            [
              -4,
              6,
              -4,
              8,
              3,
              8,
              0.7,
              (t, e, o, n, a) =>
                "top" === t
                  ? "#FFFFFF"
                  : "bottom" === t
                    ? "#D4D4DE"
                    : "front" === t && 1 === o && 2 === e
                      ? "#5DAA3C"
                      : "front" === t &&
                          ((0 === o && 3 === e) || (1 === o && 3 === e) || (2 === o && 2 === e))
                        ? 0 === o
                          ? "#7CC456"
                          : "#3E8A2A"
                        : o === a - 1
                          ? "#E2E2EA"
                          : e % 2
                            ? "#EEEEF4"
                            : "#FFFFFF",
            ],
            [
              -6,
              9.2,
              -6,
              12,
              4,
              12,
              0,
              (t, e, o, n, a) =>
                "bottom" === t
                  ? 0 === e || 0 === o || e === n - 1 || o === n - 1
                    ? "#C8C8D4"
                    : "#D8D8E2"
                  : "top" === t
                    ? hash(e, o, 3) > 0.8
                      ? "#F1F1F6"
                      : "#FFFFFF"
                    : o === a - 1
                      ? "#DEDEE8"
                      : e % 3 == 1
                        ? "#ECECF3"
                        : "#FFFFFF",
            ],
            [
              -4.5,
              13.2,
              -4.5,
              9,
              2,
              9,
              0,
              (t, e, o, n, a) =>
                "bottom" === t
                  ? "#E0E0E8"
                  : "top" === t
                    ? hash(e, o, 5) > 0.85
                      ? "#F2F2F7"
                      : "#FFFFFF"
                    : e % 3 == 1
                      ? "#EEEEF4"
                      : "#FFFFFF",
            ],
          ],
        },
      ],
    },
    snowPx = (t, o, n) =>
      "bottom" === t
        ? "#C5D0DE"
        : hash(o, n, e[t]) > 0.86
          ? "#DCE5F0"
          : hash(o, n, e[t] + 9) > 0.9
            ? "#FFFFFF"
            : "#F2F6FC",
    c = "#26262C",
    scarf = (t, e, o) => ((e + o) % 3 == 0 ? "#A82828" : "#D23A3A"),
    twig = (t, e) => (e % 2 ? "#5A3C22" : "#6B4A2B"),
    d = {
      snowman: [
        {
          name: "body",
          pivot: [0, 0, 0],
          boxes: [
            [
              -3.5,
              0,
              -3.5,
              7,
              6,
              7,
              0,
              (t, e, o) => ("front" !== t || 3 !== e || (1 !== o && 3 !== o) ? snowPx(t, e, o) : c),
            ],
            [-3, 6, -3, 6, 1, 6, 0, scarf],
            [1, 3.5, -4.5, 1, 3, 1, 0, scarf],
          ],
        },
        {
          name: "head",
          parent: "body",
          pivot: [0, 7, 0],
          boxes: [
            [
              -2.5,
              0,
              -2.5,
              5,
              5,
              5,
              0,
              (t, e, o) =>
                "front" === t &&
                ((1 === o && (1 === e || 3 === e)) ||
                  (3 === o && (1 === e || 3 === e)) ||
                  (4 === o && 2 === e))
                  ? c
                  : snowPx(t, e, o + 7),
            ],
            [-0.5, 2, -4.5, 1, 1, 2, 0, (t) => ("front" === t ? "#D9661A" : "#F08A24")],
          ],
        },
        {
          name: "rarm",
          parent: "body",
          pivot: [3.5, 4.5, 0],
          boxes: [[0, -0.5, -0.5, 3, 1, 1, 0, twig]],
        },
        {
          name: "larm",
          parent: "body",
          pivot: [-3.5, 4.5, 0],
          boxes: [[-3, -0.5, -0.5, 3, 1, 1, 0, twig]],
        },
      ],
    },
    h = "#3E3E48",
    f = "#585864";
  d.lantern = [
    {
      name: "body",
      pivot: [0, 0, 0],
      boxes: [
        [
          -3,
          0,
          -3,
          6,
          1,
          6,
          0,
          (t, e, o, n) => ("top" === t ? "#2C2C34" : 0 === e || e === n - 1 ? f : h),
        ],
        [
          -2.5,
          1,
          -2.5,
          5,
          5,
          5,
          0,
          (t, e, o, n, a) => {
            if ("top" === t || "bottom" === t) return h;
            if (0 === e || e === n - 1) return f;
            if ("front" === t && 2 === o && (1 === e || 3 === e)) return "#4A2A08";
            if ("front" === t && 3 === o && 2 === e) return "#B8601A";
            if ("front" === t && 3 === o && (1 === e || 3 === e)) return "#FFB08A";
            return Math.abs(e - (n - 1) / 2) < 1 && o >= 2
              ? "#FFF4C8"
              : 0 === o || o === a - 1
                ? "#FFC24A"
                : "#FFDF86";
          },
        ],
        [
          -3,
          6,
          -3,
          6,
          1,
          6,
          0,
          (t, e, o, n) => ("bottom" === t ? "#2C2C34" : 0 === e || e === n - 1 ? f : h),
        ],
        [-2, 7, -2, 4, 1, 4, 0, (t) => ("top" === t ? f : h)],
      ],
    },
    {
      name: "handle",
      parent: "body",
      pivot: [0, 8, 0],
      boxes: [
        [-1.5, 0, -0.5, 1, 2, 1, 0, () => f],
        [0.5, 0, -0.5, 1, 2, 1, 0, () => f],
        [-1.5, 2, -0.5, 3, 1, 1, 0, () => h],
      ],
    },
  ];
  const W = { lantern: !0 },
    u = { lantern: !0 },
    m = 0.85,
    model = (t, e, o) =>
      (function buildModel(t, e, o) {
        if (t.models[e]) return e;
        const n = [];
        let a = 0,
          r = 0,
          s = 0;
        for (const t of o)
          for (const e of t.boxes) {
            const t = e[3],
              o = e[4],
              i = e[5];
            (a + 2 * (t + i) > 64 && ((a = 0), (r += s), (s = 0)),
              n.push([e, a, r]),
              (a += 2 * (t + i)),
              (s = Math.max(s, i + o)));
          }
        const i = Math.max(16, 1 << Math.ceil(Math.log2(r + s))),
          l = document.createElement("canvas");
        ((l.width = 64), (l.height = i));
        const p = l.getContext("2d"),
          c = p.createImageData(64, i),
          d = c.data,
          put = (t, e, o) => {
            if (!o) return;
            const n = 4 * (64 * e + t),
              a = parseInt(o.slice(1), 16);
            ((d[n] = a >> 16), (d[n + 1] = (a >> 8) & 255), (d[n + 2] = 255 & a), (d[n + 3] = 255));
          },
          face = (t, e, o, n, a, r) => {
            for (let s = 0; s < r; s++)
              for (let i = 0; i < a; i++) put(o + i, n + s, t[7](e, i, s, a, r));
          };
        for (const [t, e, o] of n) {
          const n = t[3],
            a = t[4],
            r = t[5];
          (face(t, "top", e + r, o, n, r),
            face(t, "bottom", e + r + n, o, n, r),
            face(t, "right", e, o + r, r, a),
            face(t, "front", e + r, o + r, n, a),
            face(t, "left", e + r + n, o + r, r, a),
            face(t, "back", e + 2 * r + n, o + r, n, a));
        }
        p.putImageData(c, 0, 0);
        const h = new Map(n.map(([t, e, o]) => [t, [e, o]])),
          f = {
            parts: o.map((t) => ({
              name: t.name,
              pivot: t.pivot,
              parent: t.parent,
              boxes: t.boxes.map((t) => [
                ...h.get(t),
                t[0],
                t[1],
                t[2],
                t[3],
                t[4],
                t[5],
                t[6] || 0,
              ]),
            })),
          };
        for (const e of f.parts) e.mesh = t.makeModelPart(e.boxes, 64, i);
        return ((t.models[e] = f), (t.entityTex[e] = t.tex2D(l, !1)), e);
      })(t, "cos_" + e + "_" + o, ("hat" === e ? p : d)[o]),
    F = { potato: { ch: "" } };
  let w = null;
  const D = {
    "": function potato() {
      if (w) return w;
      const t = window.game && window.game.renderer;
      if (!t || !t.stripCanvas || "undefined" == typeof ITEM_KEY || void 0 === ITEM_KEY.potato)
        return null;
      const [e, o] = t.tileXY(ITEMS[ITEM_KEY.potato].tex),
        n = document.createElement("canvas");
      return (
        (n.width = n.height = 16),
        n.getContext("2d").drawImage(t.stripCanvas, e, o, 16, 16, 0, 0, 16, 16),
        (w = n)
      );
    },
  };
  function prefixed(t, e, o, n) {
    const a = String(o),
      r = n || lookOf(t, e),
      s = r && hasKey(F, r.pre) && F[r.pre];
    return s && !a.startsWith(s.ch) ? s.ch + a : a;
  }
  (() => {
    const t = Font.render,
      e = new Map(),
      o = Object.keys(D),
      n = new RegExp("([" + o.join("") + "])");
    Font.render = function (a, r, s = 2, i = !1) {
      const l = String(a);
      if (!o.some((t) => l.includes(t))) return t.call(this, l, r, s, i);
      const p = r + "\0" + s + (i ? "s" : "") + (this.noEmo ? "n" : "") + "\0" + l;
      let c = e.get(p);
      if (c) return c;
      const d = this.PAD;
      ((c = document.createElement("canvas")),
        (c.width = Math.max(1, Math.ceil((this.width(l) + 2 * d) * s))),
        (c.height = Math.ceil((this.H + 2 * d) * s)));
      const h = c.getContext("2d");
      let f = 0,
        W = !0;
      for (const e of l.split(n))
        if (e)
          if (D[e]) {
            const t = D[e]();
            (t
              ? this.noEmo ||
                ((h.imageSmoothingEnabled = !1),
                h.drawImage(t, 0, 0, 16, 16, (d + f + 0.5) * s, (d - 0.2) * s, 8.5 * s, 8.5 * s))
              : (W = !1),
              (f += this.charW(e)));
          } else (h.drawImage(t.call(this, e, r, s, i), f * s, 0), (f += this.width(e)));
      return (W && (e.set(p, c), e.size > 200 && e.delete(e.keys().next().value)), c);
    };
  })();
  const solidAt = (t, e, o, n) => {
    const a = BLOCKS[t.getBlock(Math.floor(e), Math.floor(o), Math.floor(n))];
    return !(!a || !a.solid);
  };
  function floorAt(t, e, o, n) {
    for (let a = Math.floor(o + 1); a >= Math.floor(o) - 3; a--)
      if (!solidAt(t, e, a, n) && solidAt(t, e, a - 1, n)) return a;
    return null;
  }
  const glowLight = (t, e) => [
    t ? t[0] : 1,
    0.88 + 0.08 * Math.sin(e / 130) * Math.sin(e / 370) + 0.04 * Math.sin(e / 53),
  ];
  function petPose(t, e, o) {
    const n = e / 1e3,
      a = t && t.wave > 0 ? 0.5 * Math.sin(12 * t.wave) + 0.9 : 0;
    if ("lantern" === o) {
      const e = 0.07 * Math.sin(1.7 * n);
      return {
        body: { rx: t ? Math.min(0.4, 0.09 * (t.speed || 0)) : 0, rz: e },
        handle: { rz: 0.8 * -e },
      };
    }
    return {
      head: { ry: 0.25 * Math.sin(0.7 * n), rz: 0.06 * Math.sin(1.3 * n) },
      rarm: { rz: 0.35 + a + 0.05 * Math.sin(2 * n) },
      larm: { rz: -0.35 - 0.05 * Math.sin(2 * n + 1) },
    };
  }
  function drawPet(t, e, o, n, a, r) {
    const s = t.renderer,
      i = t.world,
      l = e.ipos(o),
      p = e === t.player,
      c =
        e.cosPet ||
        (e.cosPet = {
          pos: null,
          t: a,
          yaw: 0,
          hop: 0,
          hopAmt: 0,
          idle: 0,
          wave: 0,
          side: Math.random() < 0.5 ? -1 : 1,
        }),
      d = Math.min(0.1, Math.max(0, (a - c.t) / 1e3));
    c.t = a;
    const h = p && t.playerBodyYaw ? t.playerBodyYaw(o) : (e.bodyYaw ?? e.yaw ?? 0),
      f = [-Math.sin(h), -Math.cos(h)],
      F = [Math.cos(h), -Math.sin(h)],
      w = floorAt(i, l[0], l[1], l[2]),
      D =
        !!W[r] ||
        !!(e.flying || e.gliding || e.swimming || e.netSwim || (p && e.inWater)) ||
        null === w;
    let g, A, y;
    if (D) {
      const o = p && 0 === t.perspective ? 0.6 : 0.15,
        n = e.gliding || e.swimming || e.netSwim;
      ((g = l[0] - 0.8 * F[0] - f[0] * o),
        (y = l[2] - 0.8 * F[1] - f[1] * o),
        (A = l[1] + (n ? 0.3 : 1.3)));
    } else {
      let t = null;
      for (const [e, o] of [
        [0.9, 0.6 * c.side],
        [0.9, 0],
        [0, 0],
      ])
        if (
          ((g = l[0] - f[0] * e + F[0] * o),
          (y = l[2] - f[1] * e + F[1] * o),
          (t = floorAt(i, g, l[1], y)),
          null !== t)
        )
          break;
      A = null === t || Math.abs(t - l[1]) < 0.6 ? l[1] : t;
    }
    (!c.pos || c.world !== i || Math.hypot(g - c.pos[0], A - c.pos[1], y - c.pos[2]) > 12) &&
      ((c.pos = [g, A, y]), (c.world = i));
    const L = c.pos,
      M = L[0],
      E = L[2],
      b = Math.hypot(g - M, y - E);
    if ((D || b > 0.5 ? (c.going = !0) : b < 0.08 && (c.going = !1), c.going)) {
      const t = 1 - Math.exp(-d * (D ? 4 : 5));
      ((L[0] += (g - L[0]) * t), (L[2] += (y - L[2]) * t));
    }
    L[1] += (A - L[1]) * (1 - Math.exp(-d * (D ? 4 : 12)));
    const K = d > 0 ? Math.hypot(L[0] - M, L[2] - E) / d : 0,
      k = K > 0.3;
    c.speed = (c.speed || 0) + (K - (c.speed || 0)) * (1 - Math.exp(6 * -d));
    let G =
      (k ? Math.atan2(-(L[0] - M), -(L[2] - E)) : Math.atan2(-(l[0] - L[0]), -(l[2] - L[2]))) -
      c.yaw;
    ((G = Math.atan2(Math.sin(G), Math.cos(G))),
      (c.yaw += G * (1 - Math.exp(8 * -d))),
      (c.hopAmt += ((k && !D ? 1 : 0) - c.hopAmt) * (1 - Math.exp(8 * -d))),
      c.hopAmt > 0.01 && (c.hop += 8 * d),
      (c.idle = k ? 0 : c.idle + d),
      c.wave > 0 ? (c.wave -= d) : !D && c.idle > 3 && Math.random() < 0.15 * d && (c.wave = 1.2));
    const C = a / 1e3,
      x = 0.2 * Math.abs(Math.sin(c.hop)) * c.hopAmt,
      v = L[1] + x + (D ? 0.06 * Math.sin(2.5 * C) : 0);
    if (
      p &&
      0 === t.perspective &&
      Math.hypot(L[0] - s.camPos[0], v + 0.3 - s.camPos[1], L[2] - s.camPos[2]) < 0.6
    )
      return;
    if (!aabbInFrustum(s.planes, L[0] - 0.4, v, L[2] - 0.4, L[0] + 0.4, v + 0.7, L[2] + 0.4))
      return;
    const R = D
        ? 1
        : 1 + 0.025 * Math.sin(3 * C) * (1 - c.hopAmt) - 0.05 * Math.cos(2 * c.hop) * c.hopAmt,
      S = M4.create();
    (M4.translate(S, L[0], v, L[2]),
      M4.rotY(S, c.yaw),
      M4.scale(S, m / Math.sqrt(R), m * R, m / Math.sqrt(R)));
    const Y = i.getLight(Math.floor(L[0]), Math.floor(v + 0.3), Math.floor(L[2]));
    let B = Y ? [(Y >> 4) / 15, (15 & Y) / 15] : e.lightAt();
    (u[r] && (B = glowLight(B, a)), (c.glow = u[r] ? [L[0], v + 0.3, L[2]] : null), (c.glowT = a));
    const P = model(s, "pet", r);
    (s.drawModel(P, P, S, petPose(c, a, r), B, n, {}),
      !D && x < 0.5 && s.drawShadow(L[0], L[1], L[2], 0.28, 0.45 * (1 - 2 * x)));
  }
  const hidden = (t) => !!(t.invisible || (t.hasEffect && t.hasEffect("invisibility")));
  function drawPets(t, e, o) {
    const n = t.player,
      a = performance.now(),
      r = [];
    if (n && !n.dead && !(n.deathTime > 0) && "spectator" !== t.mode && !hidden(n) && shown(t, n)) {
      const e = worn(t, n, "pet");
      e && r.push([n, e]);
    }
    if (
      n &&
      ((t) =>
        "all" === mode(t) && !(void 0 === t.settings.cosShow && "fast" === t.settings.graphics))(t)
    ) {
      const e = [];
      for (const o of t.entities) {
        if ("player" !== o.type || o === n || o.dead || o.deathTime > 0 || hidden(o)) continue;
        const a = worn(t, o, "pet");
        if (!a) continue;
        const r = Math.hypot(o.pos[0] - n.pos[0], o.pos[1] - n.pos[1], o.pos[2] - n.pos[2]);
        r <= 32 && e.push([r, o, a]);
      }
      e.sort((t, e) => t[0] - e[0]);
      for (const [, t, o] of e.slice(0, 20)) r.push([t, o]);
    }
    if (!r.length) return;
    const s = t.renderer.gl;
    (s.enable(s.DEPTH_TEST), s.disable(s.CULL_FACE));
    for (const [n, s] of r)
      try {
        drawPet(t, n, e, o, a, s);
      } catch (e) {
        t.reportError("pet", e, !0);
      }
    s.enable(s.CULL_FACE);
  }
  (() => {
    const t = Game.prototype.drawEntityList;
    Game.prototype.drawEntityList = function (e, o, n, a) {
      if ((t.call(this, e, o, n, a), "play" === this.state && this.world && this.player))
        try {
          drawPets(this, o, n);
        } catch (t) {
          this.reportError("pets", t, !0);
        }
    };
  })();
  const g = {
      straw: {
        pal: { L: o, D: n, R: "#8A1E1E", r: "#701515", b: "#A8873F" },
        rows: [
          "................",
          "................",
          "................",
          "................",
          ".....LDLDLD.....",
          "....LDLDLDLD....",
          "....DLDLDLDL....",
          "....LDLDLDLD....",
          "....RrRRrRRr....",
          "....DLDLDLDL....",
          ".LDLDLDLDLDLDLD.",
          "LDLDLDLDLDLDLDLD",
          ".bbbbbbbbbbbbbb.",
          "................",
          "................",
          "................",
        ],
      },
      tophat: {
        pal: { K: r, k: "#4A4A58", g: "#5A5A68", R: "#9A1A2C", r: "#7A1020", s: "#0E0E12" },
        rows: [
          "................",
          ".....gggggg.....",
          ".....KkKKKK.....",
          ".....KkKKKK.....",
          ".....KkKKKK.....",
          ".....KkKKKK.....",
          ".....KkKKKK.....",
          ".....KkKKKK.....",
          ".....RRRRRR.....",
          ".....rrrrrr.....",
          "..gggggggggggg..",
          ".KKKKKKKKKKKKKK.",
          "..ssssssssssss..",
          "................",
          "................",
          "................",
        ],
      },
      crown: {
        pal: { y: "#FFF2A0", G: s, L: i, d: l, R: "#E0303A", B: "#3A6AE0", E: "#2FC46A" },
        rows: [
          "................",
          "................",
          "................",
          "..y....yy....y..",
          "..G...GGGG...G..",
          "..GG..GRRG..GG..",
          "..GGGGGGGGGGGG..",
          "..LLLLLLLLLLLL..",
          "..GBGGGRRGGGEG..",
          "..GBGGGRRGGGEG..",
          "..GGGGGGGGGGGG..",
          "..dddddddddddd..",
          "................",
          "................",
          "................",
          "................",
        ],
      },
      snowman: {
        pal: { W: "#F4F8FF", S: "#C5D0DE", k: c, o: "#F08A24", R: "#D23A3A", t: "#6B4A2B" },
        rows: [
          "................",
          "......WWWW......",
          ".....WWWWWW.....",
          ".....WkWWkW.....",
          ".....WWWWooo....",
          ".....WkWkWW.....",
          "......WkWW......",
          "....RRRRRRRR....",
          "..t.WWWWWRWW.t..",
          "...tWWWkWRWWt...",
          "....WWWWWRWW....",
          "....WWWkWWWW....",
          "....WWWWWWWW....",
          ".....SSSSSS.....",
          "................",
          "................",
        ],
      },
      chef: {
        pal: { W: "#FFFFFF", s: "#D8D8E2", p: "#E6E6EE", d: "#B8B8C4", g: "#5DAA3C", G: "#3E8A2A" },
        rows: [
          "................",
          ".....WW..WW.....",
          "...WWWWWWWWWW...",
          "..WWWWWWWWWWWW..",
          "..WWWWWWWWWWWW..",
          "..WsWWWWWWWWsW..",
          "...ssWWWWWWss...",
          "....ssssssss....",
          "....WgWWWWWW....",
          "....WGgWpWpW....",
          "....WWpWpWpW....",
          "....pWpWpWpW....",
          "....dddddddd....",
          "................",
          "................",
          "................",
        ],
      },
      lantern: {
        pal: {
          k: "#55555F",
          K: "#33333B",
          y: "#FFC24A",
          Y: "#FFE08A",
          W: "#FFF6D0",
          e: "#5A3A10",
          m: "#B0601A",
          b: "#FFB08A",
        },
        rows: [
          "................",
          "......kkkk......",
          "......k..k......",
          "....KKKKKKKK....",
          ".....KKKKKK.....",
          "....kyyyyyyk....",
          "....kYYYYYYk....",
          "....kYeYYeYk....",
          "....kbYWWYbk....",
          "....kYYmmYYk....",
          "....kyYWWYyk....",
          "....kyyyyyyk....",
          "....KKKKKKKK....",
          ".....KKKKKK.....",
          "................",
          "................",
        ],
      },
    },
    grey = (t) => {
      const e = parseInt(t.slice(1), 16),
        o = Math.round(
          0.5 * (0.3 * ((e >> 16) & 255) + 0.59 * ((e >> 8) & 255) + 0.11 * (255 & e)) + 20,
        );
      return "rgb(" + o + "," + o + "," + o + ")";
    };
  return {
    LIST: t,
    KIND: { hat: "帽子", pet: "宠物", pre: "名字前缀", cape: "披风" },
    info: info,
    name: (t) => {
      const e = info(t);
      return e ? e.name : "";
    },
    lights: function lights(t) {
      const e = t && t.player,
        o = e && e.cosPet;
      return !o || !o.glow || performance.now() - (o.glowT || 0) > 1e3
        ? []
        : [{ key: o, x: o.glow[0], y: o.glow[1], z: o.glow[2], L: 12 }];
    },
    owned: owned,
    has: (t) => owned().includes(t),
    shown: shown,
    lookOf: lookOf,
    worn: worn,
    mine: function mine(t) {
      const e = (t && t.player && lookOf(t, t.player)) || {};
      return { hat: e.hat || null, pet: e.pet || null, pre: e.pre || null };
    },
    drawOn: function drawOn(t, e, o, n, a, r, s) {
      if (!shown(t, e, s)) return;
      const i = t.renderer,
        l = i.gl,
        p = l.isEnabled(l.CULL_FACE);
      l.disable(l.CULL_FACE);
      try {
        const l = worn(t, e, "hat"),
          p = e.inv ? e.inv.slots[36] : (e.armorItems || [])[0];
        if (l && !p) {
          const t = model(i, "hat", l);
          i.drawModel(t, t, o, { head: n && n.head }, a, r, s || {});
        }
        const c =
          s &&
          s.inv &&
          e === t.player &&
          "undefined" != typeof Skins &&
          Skins.preview() &&
          worn(t, e, "pet");
        if (c) {
          const t = model(i, "pet", c),
            e = M4.copy(o),
            n = performance.now();
          (W[c]
            ? M4.translate(e, 0.5, 1.15 + 0.05 * Math.sin(n / 500), -0.1)
            : M4.translate(e, 0.45, 0.05 * Math.abs(Math.sin(n / 300)), -0.1),
            M4.scale(e, m, m, m),
            i.drawModel(t, t, e, petPose(null, n, c), u[c] ? glowLight(a, n) : a, r, s));
        }
      } catch (e) {
        t.reportError && t.reportError("decoration", e, !0);
      } finally {
        p && l.enable(l.CULL_FACE);
      }
    },
    drawIcon: function drawIcon(t, e, o, n, a, r) {
      const [s, i] = String(e || "").split(":");
      (t.save(), (t.imageSmoothingEnabled = !1));
      try {
        if ("cape" === s && "undefined" != typeof Capes) {
          const e = a / 16;
          Capes.drawFlat(t, i, Math.round(o + (a - 10 * e) / 2), n, e, r);
        } else if ("pre" === s) {
          const e = hasKey(F, i) && D[F[i].ch]();
          e && (r && (t.globalAlpha = 0.35), t.drawImage(e, 0, 0, 16, 16, o, n, a, a));
        } else
          hasKey(g, i) &&
            (function drawPix(t, e, o, n, a, r) {
              const s = e.rows.length,
                i = a / s;
              for (let a = 0; a < s; a++)
                for (let s = 0; s < e.rows[a].length; s++) {
                  const l = e.pal[e.rows[a][s]];
                  if (!l) continue;
                  const p = Math.floor(o + s * i),
                    c = Math.floor(n + a * i);
                  ((t.fillStyle = r ? grey(l) : l),
                    t.fillRect(
                      p,
                      c,
                      Math.floor(o + (s + 1) * i) - p,
                      Math.floor(n + (a + 1) * i) - c,
                    ));
                }
            })(t, g[i], o, n, a, r);
      } finally {
        t.restore();
      }
    },
    openWardrobe: function openWardrobe(t, e, o) {
      const n = new WardrobeScreen(t, e),
        a = String(o || "").split(":")[0];
      return (["skin", "cape", "hat", "pet", "pre"].includes(a) && (n.tab = a), t.ui.open(n), n);
    },
    tagName: function tagName(t, e, o) {
      return t && e && (e === t.player || "player" === e.type) && shown(t, e)
        ? prefixed(t, e, o)
        : o;
    },
    preName: function preName(t, e) {
      if (!t || !e) return e;
      const o =
        (t.net && t.net.name) ||
        ("undefined" != typeof Account && Account.loggedIn && Account.name);
      if (e === o) return shown(t, t.player) ? prefixed(t, t.player, e) : e;
      if (!shown(t, null)) return e;
      const n = (t.entities || []).find((t) => "player" === t.type && t.name === e),
        a = (n && n.look) || (t.net && t.net.looks && t.net.looks.get(e)) || null;
      return a ? prefixed(t, n, e, a) : e;
    },
    PRE_CHAR: F.potato.ch,
    preChar: (t) => (hasKey(F, t) ? F[t].ch : ""),
  };
})();
//# sourceURL=js/cosmetics.js
