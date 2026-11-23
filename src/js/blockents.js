"use strict";
const DYE_RGB = {
    white: 16383998,
    orange: 16351261,
    magenta: 13061821,
    light_blue: 3847130,
    yellow: 16701501,
    lime: 8439583,
    pink: 15961002,
    gray: 4673362,
    light_gray: 10329495,
    cyan: 1481884,
    purple: 8991416,
    blue: 3949738,
    brown: 8606770,
    green: 6192150,
    red: 11546150,
    black: 1908001,
  },
  dyeOf = (e) => {
    for (const t in DYE_RGB) if (e.startsWith(t + "_")) return t;
    return "white";
  },
  FACING_DEG = { south: 0, west: 90, north: 180, east: 270 },
  beYaw = (e) => Math.PI - (e * Math.PI) / 180;
function beParts(e, t, n, o, s, a) {
  const r = (t.states && t.states[n]) || {},
    i = t.key,
    l = 22.5 * (void 0 !== r.rotation ? +r.rotation : 0);
  switch (t.be) {
    case "head":
    case "wall_head": {
      const e = "wall_head" === t.be,
        n = e ? (FACING_DEG[r.facing] ?? 0) : l,
        c = i.replace(/_(wall_)?(head|skull)$/, ""),
        [h, _] =
          "skeleton" === c
            ? ["be_head", "skeleton"]
            : "wither_skeleton" === c
              ? ["be_head", "wither_skeleton"]
              : "creeper" === c
                ? ["be_head", "creeper"]
                : "zombie" === c
                  ? ["be_head64", "zombie"]
                  : "piglin" === c
                    ? ["be_piglin_head", "piglin"]
                    : "dragon" === c
                      ? ["be_dragon_head", "dragon"]
                      : ["be_player_head", "steve"],
        p = M4.create();
      return (
        M4.translate(p, o + 0.5, s, a + 0.5),
        M4.rotY(p, beYaw(n)),
        e && M4.translate(p, 0, 0.25, 0.25),
        "dragon" === c && M4.scale(p, 0.75, 0.75, 0.75),
        [[h, _, p]]
      );
    }
    case "banner":
    case "wall_banner": {
      const e = "wall_banner" === t.be,
        n = e ? (FACING_DEG[r.facing] ?? 0) : l,
        c = M4.create();
      (M4.translate(c, o + 0.5, s, a + 0.5), M4.rotY(c, beYaw(n)));
      const h = DYE_RGB[dyeOf(i)],
        _ = [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (255 & h) / 255];
      if (e) {
        const e = new Float32Array(c);
        return (
          M4.translate(e, 0, -1.5, 6 / 16),
          [
            ["be_banner_bar", "banner_base", c],
            ["be_banner_flag", "banner_pattern_base", e, { tint: _ }],
          ]
        );
      }
      const p = new Float32Array(c);
      return (
        M4.translate(p, 0, 2 / 16, 0),
        [
          ["be_banner_pole", "banner_base", c],
          ["be_banner_flag", "banner_pattern_base", p, { tint: _ }],
        ]
      );
    }
    case "shulker_box": {
      const e = M4.create();
      M4.translate(e, o + 0.5, s + 0.5, a + 0.5);
      const t = r.facing || "up";
      ("down" === t
        ? M4.rotX(e, Math.PI)
        : "up" !== t && (M4.rotY(e, beYaw(FACING_DEG[t])), M4.rotX(e, -Math.PI / 2)),
        M4.translate(e, 0, -0.5, 0));
      return [
        [
          "be_shulker",
          "shulker" + ("shulker_box" === i ? "" : "_" + i.replace(/_shulker_box$/, "")),
          e,
        ],
      ];
    }
    case "decorated_pot": {
      const e = M4.create();
      return (
        M4.translate(e, o + 0.5, s, a + 0.5),
        M4.rotY(e, beYaw(FACING_DEG[r.facing] ?? 0)),
        [
          ["be_pot_base", "decorated_pot_base", e],
          ["be_pot_sides", "decorated_pot_side", e],
        ]
      );
    }
    case "conduit": {
      const e = M4.create();
      return (M4.translate(e, o + 0.5, s, a + 0.5), [["be_conduit", "conduit_base", e]]);
    }
    case "golem_statue": {
      const e = M4.create();
      (M4.translate(e, o + 0.5, s, a + 0.5), M4.rotY(e, beYaw(FACING_DEG[r.facing] ?? 0)));
      const t = i
        .replace(/^waxed_/, "")
        .replace(/copper_golem_statue$/, "")
        .replace(/_$/, "");
      return [["be_golem", "copper_golem" + (t ? "_" + t : ""), e]];
    }
  }
  return [];
}
function chestTexBase(e) {
  const t = e.replace(/^waxed_/, "");
  if ("chest" === t) return "chest_normal";
  if ("trapped_chest" === t) return "chest_trapped";
  if ("ender_chest" === t) return "chest_ender";
  const n = t.replace(/_?copper_chest$/, "");
  return "chest_copper" + (n ? "_" + n : "");
}
((Renderer.prototype.beTex = function (e) {
  if (!this.entityTex[e]) {
    const t = this.images[e];
    if (!t) return null;
    this.entityTex[e] = this.tex2D(t, !1);
  }
  return e;
}),
  (Renderer.prototype.initBEModels = function () {
    if (this.models.be_head) return;
    const e = this.models,
      P = (e, t, n) => {
        for (const o of n) o.mesh = this.makeModelPart(o.boxes, e, t);
        return { parts: n };
      },
      part = (e, t = {}) => ({ name: "p", pivot: [0, 0, 0], boxes: e, ...t });
    ((e.be_head = P(64, 32, [part([[0, 0, -4, 0, -4, 8, 8, 8]])])),
      (e.be_head64 = P(64, 64, [part([[0, 0, -4, 0, -4, 8, 8, 8]])])),
      (e.be_player_head = P(64, 64, [
        part([
          [0, 0, -4, 0, -4, 8, 8, 8],
          [32, 0, -4, 0, -4, 8, 8, 8, 0.25],
        ]),
      ])),
      (e.be_piglin_head = P(64, 64, [
        part([
          [0, 0, -5, 0, -4, 10, 8, 8],
          [31, 1, -2, 0, -5, 4, 4, 1],
          [2, 4, 2, 0, -5, 1, 2, 1],
          [2, 0, -3, 0, -5, 1, 2, 1],
        ]),
        {
          name: "lear",
          parent: "p",
          pivot: [-4.5, 6, 0],
          rotZ: -0.7,
          boxes: [[51, 6, -1, -5, -2, 1, 5, 4]],
        },
        {
          name: "rear",
          parent: "p",
          pivot: [4.5, 6, 0],
          rotZ: 0.7,
          boxes: [[39, 6, 0, -5, -2, 1, 5, 4]],
        },
      ])),
      (e.be_dragon_head = P(256, 256, [
        part([
          [112, 30, -8, 0, -8, 16, 16, 16],
          [176, 44, -6, 4, -22, 12, 5, 16],
          [176, 65, -6, 0, -22, 12, 4, 16],
          [0, 0, 3, 16, -2, 2, 4, 6, 0, !0],
          [0, 0, -5, 16, -2, 2, 4, 6],
          [112, 0, 3, 9, -20, 2, 2, 4, 0, !0],
          [112, 0, -5, 9, -20, 2, 2, 4],
        ]),
      ])),
      (e.be_banner_pole = P(64, 64, [
        part([
          [44, 0, -1, 0, -1, 2, 42, 2],
          [0, 42, -10, 40, -1, 20, 2, 2],
        ]),
      ])),
      (e.be_banner_bar = P(64, 64, [part([[0, 42, -10, 14, 5, 20, 2, 2]])])),
      (e.be_banner_flag = P(64, 64, [part([[0, 0, -10, 0, -2, 20, 40, 1]])])),
      (e.be_shulker = P(64, 64, [
        part([
          [0, 28, -8, 0, -8, 16, 8, 16],
          [0, 0, -8, 4, -8, 16, 12, 16],
        ]),
      ])),
      (e.be_pot_base = P(32, 32, [
        part([
          [0, 0, -4, 16, -4, 8, 3, 8],
          [0, 5, -3, 19, -3, 6, 1, 6],
          [-14, 13, -7, 16, -7, 14, 0, 14],
          [-14, 13, -7, 0, -7, 14, 0, 14],
        ]),
      ])));
    const side = (e) => ({
      name: "s",
      pivot: [0, 0, 0],
      rotY: e,
      boxes: [[1, 0, -7, 0, -7, 14, 16, 0]],
    });
    ((e.be_pot_sides = P(16, 16, [side(0), side(Math.PI / 2), side(Math.PI), side(-Math.PI / 2)])),
      (e.be_conduit = P(32, 16, [part([[0, 0, -3, 5, -3, 6, 6, 6]])])),
      (e.be_golem = P(64, 64, [
        part([
          [0, 27, -4, 0, -2, 4, 5, 4],
          [16, 27, 0, 0, -2, 4, 5, 4],
          [0, 15, -4, 5, -3, 8, 6, 6],
          [0, 0, -4, 11, -5, 8, 5, 10],
          [56, 0, -1, 12, -7, 2, 3, 2],
          [37, 8, -1, 16, -1, 2, 4, 2],
          [37, 0, -2, 20, -2, 4, 4, 4],
          [36, 16, -8, 1, -2, 4, 10, 4],
          [36, 16, 4, 1, -2, 4, 10, 4, 0, !0],
        ]),
      ])));
  }),
  (Renderer.prototype.drawBE = function (e, t, n, o, s, a, r, i = {}) {
    this.initBEModels();
    for (const [l, c, h, _] of beParts(this, e, t, n, o, s)) {
      if (!this.beTex(c)) continue;
      let e = h;
      (i.base && ((e = new Float32Array(16)), M4.mul(e, i.base, h)),
        this.drawModel(l, c, e, null, a, r, { ...(_ || {}), vp: i.vp }));
    }
  }),
  (Game.prototype.drawChests = function (e, t) {
    const n = this.player,
      o = this.world,
      s = this.renderer,
      a = Math.floor(n.pos[0]),
      r = Math.floor(n.pos[2]),
      i = Math.min(64, 16 * s.renderDist);
    if (BE_IDS.length) {
      s.gl.disable(s.gl.CULL_FACE);
      for (let n = (a - i) >> 4; n <= (a + i) >> 4; n++)
        for (let a = (r - i) >> 4; a <= (r + i) >> 4; a++) {
          const r = o.getChunk(n, a);
          if (r) {
            r.chests ||
              ((r.chests = []),
              r.findAll(BE_IDS, (e) =>
                r.chests.push([16 * n + (15 & e), e >> 8, 16 * a + ((e >> 4) & 15)]),
              ));
            for (const [n, a, i] of r.chests) {
              const r = o.getBlock(n, a, i),
                l = BLOCKS[r];
              if (
                !l ||
                (!l.beRender &&
                  !BOOK_BLOCKS.has(r) &&
                  r !== BELL_ID &&
                  "function" != typeof l.beDraw)
              )
                continue;
              if (!aabbInFrustum(s.planes, n - 1, a - 2, i - 1, n + 2, a + 3, i + 2)) continue;
              const c = o.getMeta(n, a, i),
                h = o.getLight(n, a, i),
                _ = [(h >> 4) / 15, (15 & h) / 15];
              if ("function" == typeof l.beDraw) {
                (s.gl.enable(s.gl.CULL_FACE),
                  l.beDraw(this, l, n, a, i, _, t),
                  s.gl.disable(s.gl.CULL_FACE));
                continue;
              }
              if (BOOK_BLOCKS.has(r)) {
                this.drawBook(l, c, n, a, i, _, t, e);
                continue;
              }
              if (r === BELL_ID) {
                this.drawBell(n, a, i, _, t, e);
                continue;
              }
              if (!l.chestLike) {
                s.drawBE(l, c, n, a, i, _, t);
                continue;
              }
              const p = chestType(c),
                b = chestSeam(c),
                d = `${n},${a},${i}`,
                g = this.chestLids.get(d),
                f = b && this.chestLids.get(`${n + b[0]},${a},${i + b[1]}`),
                u = Math.max(g ? lerp(g.prev, g.o, e) : 0, f ? lerp(f.prev, f.o, e) : 0),
                M = ((1 - Math.pow(1 - u, 3)) * Math.PI) / 2,
                B = M4.create();
              (M4.translate(B, n + 0.5, a, i + 0.5),
                M4.rotY(B, CHEST_ROT[7 & c] || 0),
                M4.translate(B, -0.5, 0, -0.5),
                M4.scale(B, -1, -1, 1));
              const m = 1 === p ? "chest_left" : 2 === p ? "chest_right" : "chest",
                w = chestTexBase(l.key),
                F = "chest_normal" === w ? "chest" : w,
                k = 1 === p ? F + "_left" : 2 === p ? F + "_right" : w;
              s.drawModel(
                m,
                s.beTex(k) || "chest_normal",
                B,
                { lid: { rx: M }, lock: { rx: M } },
                _,
                t,
                {},
              );
            }
          }
        }
      (s.gl.enable(s.gl.CULL_FACE), this.signs && this.signs.size && this.drawSignTexts(t));
    }
  }));
const SIGN_TEXT_RGB = {
  white: "#FFFFFF",
  orange: "#FF681F",
  magenta: "#FF00FF",
  light_blue: "#9AC0CD",
  yellow: "#FFFF00",
  lime: "#BFFF00",
  pink: "#FF69B4",
  gray: "#808080",
  light_gray: "#D3D3D3",
  cyan: "#00FFFF",
  purple: "#A020F0",
  blue: "#0000FF",
  brown: "#8B4513",
  green: "#00FF00",
  red: "#FF0000",
  black: "#000000",
};
function signDark(e, t) {
  if ("black" === e && t) return "#F0EBCC";
  const n = (SIGN_TEXT_RGB[e] || "#000000").slice(1),
    ch = (e) =>
      Math.floor(0.4 * parseInt(n.slice(e, e + 2), 16))
        .toString(16)
        .padStart(2, "0");
  return "#" + ch(0) + ch(2) + ch(4);
}
const SIGN_SCALE = 2;
((Renderer.prototype.signTextTex = function (e) {
  const t = "sign:" + e.c + (e.g ? "*" : "") + e.l.join("|");
  if (this.entityTex[t]) return t;
  const n = document.createElement("canvas");
  ((n.width = 192), (n.height = 96));
  const o = n.getContext("2d");
  ((o.imageSmoothingEnabled = !1), o.scale(2, 2));
  const s = !!e.g,
    a = signDark(e.c, s),
    r = s ? SIGN_TEXT_RGB[e.c] || "#000000" : a;
  for (
    e.l.slice(0, 4).forEach((e, t) => {
      if (!e) return;
      const n = Math.round(48 - Font.width(e) / 2),
        i = 4 + 10 * t;
      if (s)
        for (let t = -1; t <= 1; t++)
          for (let s = -1; s <= 1; s++) (t || s) && Font.draw(o, e, n + t / 2, i + s / 2, a, !1);
      Font.draw(o, e, n, i, r, !1);
    }),
      this.entityTex[t] = this.tex2D(n, !1),
      (this.signTexKeys || (this.signTexKeys = [])).push(t);
    this.signTexKeys.length > 256;
  ) {
    const e = this.signTexKeys.shift();
    (this.gl.deleteTexture(this.entityTex[e]), delete this.entityTex[e]);
  }
  return t;
}),
  (Game.prototype.drawSignTexts = function (e) {
    const t = this.renderer,
      n = this.world,
      o = t.camPos;
    if ((t.initBEModels(), !t.models.be_sign_text)) {
      const P = (e) => ({
        parts: [{ name: "p", pivot: [0, 0, 0], boxes: e, mesh: t.makeModelPart(e, 16, 8) }],
      });
      ((t.models.be_sign_text = P([[0, 0, -8, 9.333, -0.75, 16, 8, 0]])),
        (t.models.be_wall_sign_text = P([[0, 0, -8, 4.333, 6.25, 16, 8, 0]])),
        (t.models.be_hanging_sign_text = P([[0, 0, -7, 1, -1.05, 14, 8, 0]])));
    }
    t.gl.disable(t.gl.CULL_FACE);
    for (const [s, a] of this.signs) {
      const [r, i, l] = s.split(",").map(Number);
      if ((r - o[0]) ** 2 + (i - o[1]) ** 2 + (l - o[2]) ** 2 > 1024) continue;
      const c = BLOCKS[n.getBlock(r, i, l)];
      if (!c || !c.key.endsWith("sign") || !aabbInFrustum(t.planes, r, i, l, r + 1, i + 1, l + 1))
        continue;
      const h = (c.states && c.states[n.getMeta(r, i, l)]) || {},
        _ = c.key.includes("wall"),
        p = c.key.includes("hanging"),
        b = void 0 !== h.rotation ? 22.5 * +h.rotation : (FACING_DEG[h.facing] ?? 0),
        d = p ? "be_hanging_sign_text" : _ ? "be_wall_sign_text" : "be_sign_text",
        g = n.getLight(r, i, l);
      for (const [n, o] of [
        [a.f, 0],
        [a.b, Math.PI],
      ]) {
        if (!n || !n.l.some(Boolean) || (_ && !p && o)) continue;
        const s = M4.create();
        (M4.translate(s, r + 0.5, i, l + 0.5), M4.rotY(s, beYaw(b) + o));
        const a = t.signTextTex(n);
        t.drawModel(d, a, s, null, n.g ? [1, 1] : [(g >> 4) / 15, (15 & g) / 15], e, {
          bright: n.g,
        });
      }
    }
    t.gl.enable(t.gl.CULL_FACE);
  }));
const BE_IDS = [];
for (const e of BLOCKS) e && e.beRender && BE_IDS.push(e.id);
const BELL_ID = BID.bell;
if (void 0 !== BELL_ID) {
  (BE_IDS.push(BELL_ID), (BLOCKS[BELL_ID].beDraw = !0));
  const e = BLOCKS[BELL_ID].boxes;
  ((BLOCKS[BELL_ID].boxes = (t) =>
    ((e && e(t)) || []).concat([
      [5, 6, 5, 11, 13, 11],
      [4, 4, 4, 12, 6, 12],
    ])),
    (BLOCKS[BELL_ID].onUse = function (e, t, n, o) {
      const s = e.player,
        a = t + 0.5 - s.pos[0],
        r = o + 0.5 - s.pos[2];
      return (
        (e.bells || (e.bells = new Map())).set(t + "," + n + "," + o, {
          t: e.tickCount,
          alongX: Math.abs(a) >= Math.abs(r),
        }),
        Sound.ev("block.bell.use", [t + 0.5, n + 0.5, o + 0.5], 2, 1),
        !0
      );
    }));
}
((Game.prototype.drawBell = function (e, t, n, o, s, a) {
  const r = this.renderer,
    i = EM.get(r, "bell#main"),
    l = r.etex("entity/bell/bell_body");
  if (!i || !l) return;
  EM.reset(i);
  const c = this.bells && this.bells.get(e + "," + t + "," + n),
    h = c ? this.tickCount - c.t + a : 0;
  c && h >= 50 && this.bells.delete(e + "," + t + "," + n);
  const _ = c && h < 50 ? Math.sin(h / Math.PI) / (4 + h / 3) : 0,
    p = M4.create();
  (M4.translate(p, e, t, n),
    _ &&
      (M4.translate(p, 0.5, 0.75, 0.5),
      c.alongX ? M4.rotZ(p, -_) : M4.rotX(p, _),
      M4.translate(p, -0.5, -0.75, -0.5)),
    M4.translate(p, 0, 1.501, 0),
    M4.scale(p, -1, -1, 1),
    r.drawEM(i, l, p, o, s, { cull: !0 }),
    r.gl.disable(r.gl.CULL_FACE));
}),
  (Game.prototype.drawBEItem = function (e, t, n, o, s) {
    const a = this.renderer,
      r = e.states
        ? Math.max(
            0,
            e.states.findIndex(
              (e) =>
                !(
                  (void 0 !== e.rotation && "0" !== e.rotation) ||
                  (void 0 !== e.facing && "south" !== e.facing && "up" !== e.facing)
                ),
            ),
          )
        : 0;
    if (e.chestLike) {
      a.initBEModels();
      const r = new Float32Array(t);
      return (
        M4.scale(r, -1, -1, 1),
        void a.drawModel("chest", a.beTex(chestTexBase(e.key)) || "chest_normal", r, null, n, o, {
          vp: s,
        })
      );
    }
    a.drawBE(e, r, 0, 0, 0, n, o, { vp: s, base: t });
  }));
const BOOK_BLOCKS = new Set(
  ["lectern", "enchanting_table"].map((e) => BID[e]).filter((e) => void 0 !== e),
);
BE_IDS.push(...BOOK_BLOCKS);
const BOOK_CW_YROT = { north: 270, east: 0, south: 90, west: 180 };
function bookPose(e, t, n, o, s) {
  EM.reset(e);
  const a = e.parts,
    r = (0.1 * Math.sin(0.02 * t) + 1.25) * s,
    i = Math.sin(r);
  ((a.left_lid.yRot = Math.PI + r),
    (a.right_lid.yRot = -r),
    (a.left_pages.yRot = r),
    (a.right_pages.yRot = -r),
    (a.flip_page1.yRot = r - 2 * r * n),
    (a.flip_page2.yRot = r - 2 * r * o),
    (a.left_pages.x = i),
    (a.right_pages.x = i),
    (a.flip_page1.x = i),
    (a.flip_page2.x = i));
}
function enchBookTick(e, t, n, o, s) {
  ((e.oOpen = e.open), (e.oRot = e.rot));
  let a = null;
  for (const e of s)
    if ((e.pos[0] - t - 0.5) ** 2 + (e.pos[1] - n - 0.5) ** 2 + (e.pos[2] - o - 0.5) ** 2 < 9) {
      a = e;
      break;
    }
  if (a) {
    if (
      ((e.tRot = Math.atan2(a.pos[2] - (o + 0.5), a.pos[0] - (t + 0.5))),
      (e.open += 0.1),
      e.open < 0.5 || Math.random() < 1 / 40)
    ) {
      const t = e.flipT;
      do {
        e.flipT += ((4 * Math.random()) | 0) - ((4 * Math.random()) | 0);
      } while (t === e.flipT);
    }
  } else ((e.tRot += 0.02), (e.open -= 0.1));
  const wrap = (e) => {
    for (; e >= Math.PI;) e -= 2 * Math.PI;
    for (; e < -Math.PI;) e += 2 * Math.PI;
    return e;
  };
  ((e.rot = wrap(e.rot)),
    (e.tRot = wrap(e.tRot)),
    (e.rot += 0.4 * wrap(e.tRot - e.rot)),
    (e.open = clamp(e.open, 0, 1)),
    e.time++,
    (e.oFlip = e.flip));
  const r = clamp(0.4 * (e.flipT - e.flip), -0.2, 0.2);
  ((e.flipA += 0.9 * (r - e.flipA)), (e.flip += e.flipA));
}
Game.prototype.drawBook = function (e, t, n, o, s, a, r, i) {
  const l = this.renderer,
    c = EM.get(l, "book#main"),
    h = l.etex("entity/enchantment/enchanting_table_book");
  if (!c || !h) return;
  const _ = M4.create(),
    p = n + "," + o + "," + s;
  if ("lectern" === e.key) {
    const a = this.blockEntities && this.blockEntities.get(p);
    if (!(this.net ? this.net.lecternBooks.has(p) : a && a.book)) return;
    const r = (e.states && e.states[t]) || {};
    (M4.translate(_, n + 0.5, o + 1.0625, s + 0.5),
      M4.rotY(_, (-(BOOK_CW_YROT[r.facing] || 0) * Math.PI) / 180),
      M4.rotZ(_, (67.5 * Math.PI) / 180),
      M4.translate(_, 0, -0.125, 0),
      bookPose(c, 0, 0.1, 0.9, 1.2));
  } else {
    const e = this.enchBooks || (this.enchBooks = new Map());
    let t = e.get(p);
    if (
      (t ||
        ((t = {
          time: 0,
          open: 0,
          oOpen: 0,
          rot: 0,
          oRot: 0,
          tRot: 0,
          flip: 0,
          oFlip: 0,
          flipT: 0,
          flipA: 0,
          at: this.tickCount,
        }),
        e.set(p, t),
        e.size > 64 && e.delete(e.keys().next().value)),
      this.tickCount - t.at > 20 && (t.at = this.tickCount - 20),
      t.at < this.tickCount)
    ) {
      const e = [
        this.player,
        ...(this.net ? [...this.net.ents.values()].filter((e) => "player" === e.type) : []),
      ];
      for (; t.at < this.tickCount;) (enchBookTick(t, n, o, s, e), t.at++);
    }
    const a = t.time + i;
    let r = t.rot - t.oRot;
    for (; r >= Math.PI;) r -= 2 * Math.PI;
    for (; r < -Math.PI;) r += 2 * Math.PI;
    (M4.translate(_, n + 0.5, o + 0.75 + 0.1 + 0.01 * Math.sin(0.1 * a), s + 0.5),
      M4.rotY(_, -(t.oRot + r * i)),
      M4.rotZ(_, (80 * Math.PI) / 180));
    const l = lerp(t.oFlip, t.flip, i),
      frac = (e) => e - Math.floor(e);
    bookPose(
      c,
      a,
      clamp(1.6 * frac(l + 0.25) - 0.3, 0, 1),
      clamp(1.6 * frac(l + 0.75) - 0.3, 0, 1),
      lerp(t.oOpen, t.open, i),
    );
  }
  (M4.translate(_, 0, 1.501, 0),
    M4.scale(_, -1, -1, 1),
    l.drawEM(c, h, _, a, r, { cull: !0 }),
    l.gl.disable(l.gl.CULL_FACE));
};
//# sourceURL=js/blockents.js
