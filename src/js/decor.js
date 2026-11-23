"use strict";
const EXTRA = (window.ENTITY_DATA && ENTITY_DATA.extra) || {},
  zhT = (t, e) => (EXTRA.lang && EXTRA.lang[t]) || e || t;
function faceRot(t, e) {
  switch (e) {
    case 5:
      M4.rotY(t, Math.PI);
      break;
    case 1:
      M4.rotY(t, -Math.PI / 2);
      break;
    case 0:
      M4.rotY(t, Math.PI / 2);
      break;
    case 3:
      M4.rotX(t, Math.PI / 2);
      break;
    case 2:
      M4.rotX(t, -Math.PI / 2);
  }
}
((Renderer.prototype.namedMesh = function (t) {
  if ((this._named || (this._named = new Map()), this._named.has(t))) return this._named.get(t);
  let e = null;
  if ("undefined" != typeof VM && VM.ready) {
    const s = VM.data.models.findIndex((e) => e.name === t);
    if (s >= 0) {
      const t = VM.bake(s);
      e = new MeshBuffer(4 * t.length + 4);
      for (const s of t) {
        const t = s.shade ? (s.dir >= 0 ? FACE_SHADE[s.dir] : 0.85) : 1;
        for (let i = 0; i < 4; i++)
          e.v(
            s.p[i][0],
            s.p[i][1],
            s.p[i][2],
            s.uv[i][0],
            s.uv[i][1],
            s.layer,
            0,
            255,
            255,
            255,
            Math.round(255 * t),
            255,
            255,
            s.anim,
          );
      }
    }
  }
  return (this._named.set(t, e), e);
}),
  (Game.prototype.drawItemFixed = function (t, e, s, i) {
    const n = ITEMS[t.id],
      a = this.renderer;
    if (!n) return;
    if ("shield" === n.key && this.drawShieldItem) {
      const n = a.mat(e);
      return (
        M4.rotY(n, -Math.PI),
        M4.scale(n, 0.5, 0.5, 0.5),
        void this.drawShieldItem(t, n, s, i, "fixed")
      );
    }
    const r = void 0 !== n.block ? BLOCKS[n.block] : null,
      o = a.itemModel(t.id),
      h = o
        ? o.gen || !r
        : !r || n.flat || r.shape === SH_CROSS || r.shape === SH_TORCH || r.ladder || r.door,
      l = new Float32Array(e),
      c = { glint: "function" == typeof stackGlint && stackGlint(t) && "item" };
    if (h) {
      const e = itemStateTex ? itemStateTex(t, null) : null,
        h = e
          ? T(e)
          : o && o.gen && o.model.layers && o.model.layers.length
            ? T(o.model.layers[0])
            : r
              ? n.flat
                ? T(n.flat)
                : r.tex[0]
              : n.tex;
      (M4.scale(l, 0.5, 0.5, 0.5),
        M4.translate(l, -0.5, -0.5, -1 / 32),
        a.drawMesh(this.spriteMesh(h), l, i, s, c));
    } else
      (M4.scale(l, 0.25, 0.25, 0.25),
        M4.rotY(l, Math.PI),
        M4.translate(l, -0.5, -0.5, -0.5),
        o && o.mesh && !r.bed
          ? a.drawMesh(o.mesh, l, i, s, c)
          : a.drawMesh(this.blockMesh(n.block, r.facing ? 4 : 0), l, i, s, c));
  }));
const DIR_NAME = ["west", "east", "down", "up", "north", "south"];
class Hanging extends Entity {
  constructor(t, e, s, i, n) {
    (super(t, e, s, i, 0.5, 0.5),
      (this.block = [e, s, i]),
      (this.face = n ?? 4),
      (this.keepSaved = !0),
      (this.hittable = !0),
      this.place());
  }
  get support() {
    const t = DIRS[this.face];
    return [this.block[0] - t[0], this.block[1] - t[1], this.block[2] - t[2]];
  }
  place() {
    const t = DIRS[this.face],
      [e, s, i] = this.block;
    ((this.pos = [
      e + 0.5 - 0.46875 * t[0],
      s + (t[1] ? 0.5 - 0.46875 * t[1] : 0.5) - this.h / 2,
      i + 0.5 - 0.46875 * t[2],
    ]),
      (this.prev = [...this.pos]));
  }
  saveData() {
    return { b: this.block, f: this.face, ...(this.more ? this.more() : {}) };
  }
  loadData(t) {
    t && ((this.block = t.b), (this.face = t.f), this.place(), this.load && this.load(t));
  }
  survives() {
    const [t, e, s] = this.support,
      i = BLOCKS[this.world.getBlock(t, e, s)];
    return !i || !!i.solid;
  }
  tick() {
    (this.savePrev(), this.age++, this.age % 100 != 0 || this.survives() || this.breakOff(null));
  }
  breakOff(t) {
    ((this.dead = !0),
      (t && t.attacker === this.game.player && "creative" === this.game.mode) ||
        this.game.dropItem(this.pos[0], this.pos[1], this.pos[2], makeStack(this.type, 1)),
      this.onBreak && this.onBreak(t));
  }
}
class ItemFrame extends Hanging {
  constructor(t, e, s, i, n, a) {
    (super(t, e, s, i, n),
      (this.type = a ? "glow_item_frame" : "item_frame"),
      (this.item = null),
      (this.rot = 0),
      (this.w = 0.75),
      (this.h = 0.75),
      this.place());
  }
  more() {
    return { it: this.item, r: this.rot, t: this.type };
  }
  load(t) {
    ((this.item = t.it || null), (this.rot = 0 | t.r), t.t && (this.type = t.t));
  }
  interact(t, e) {
    const s = this.game;
    if (!this.item)
      return (
        !!e &&
        ((this.item = { ...e, count: 1 }),
        useOne(s, t),
        Sound.ev("entity." + this.type + ".add_item", this.pos, 1, 1),
        !0)
      );
    ((this.rot = (this.rot + 1) % 8),
      Sound.ev("entity." + this.type + ".rotate_item", this.pos, 1, 1));
    for (const [t, e, i] of [this.support])
      s.world && "undefined" != typeof RS && RS.wake && RS.wake(s, t, e, i);
    return !0;
  }
  hurt(t, e) {
    return this.item
      ? ((e && e.attacker === this.game.player && "creative" === this.game.mode) ||
          this.game.dropItem(this.pos[0], this.pos[1], this.pos[2], this.item),
        (this.item = null),
        Sound.ev("entity." + this.type + ".remove_item", this.pos, 1, 1),
        !0)
      : (Sound.ev("entity." + this.type + ".break", this.pos, 1, 1), this.breakOff(e), !0);
  }
  get comparator() {
    return this.item ? this.rot + 1 : 0;
  }
  drawSelf(t, e, s, i, n) {
    const a = t.renderer,
      r = !!this.item && !!ITEMS[this.item.id] && "filled_map" === ITEMS[this.item.id].key,
      o = "glow_item_frame" === this.type,
      [h, l, c] = (DIRS[this.face], this.block),
      d = M4.create();
    (M4.translate(d, h + 0.5, l + 0.5, c + 0.5), faceRot(d, this.face));
    const p = o ? [1, 1] : n;
    if (!this.invisible) {
      const t = a.namedMesh("block/" + this.type + (r ? "_map" : ""));
      if (t) {
        const e = M4.copy(d);
        (M4.translate(e, -0.5, -0.5, -0.5), a.drawMesh(t, e, i, n));
      }
    }
    if (!this.item) return;
    const m = M4.copy(d);
    (M4.translate(m, 0, 0, 0.4275),
      M4.rotZ(m, ((this.rot * Math.PI) / 4) * (r ? 2 : 1)),
      r && t.drawMapInFrame
        ? t.drawMapInFrame(this.item, m, p, i)
        : (M4.rotY(m, Math.PI), t.drawItemFixed(this.item, m, p, i)));
  }
}
const PAINTINGS = Object.entries(EXTRA.painting_variant || {}).map(([t, e]) => ({
    key: t,
    w: e.width,
    h: e.height,
    asset: String(e.asset_id).replace("minecraft:", ""),
    title: zhT("painting.minecraft." + t + ".title", t),
    author: zhT("painting.minecraft." + t + ".author", ""),
  })),
  PAINTING_PLACEABLE = new Set([
    "kebab",
    "aztec",
    "alban",
    "aztec2",
    "bomb",
    "plant",
    "wasteland",
    "pool",
    "courbet",
    "sea",
    "sunset",
    "creebet",
    "wanderer",
    "graham",
    "match",
    "bust",
    "stage",
    "void",
    "skull_and_roses",
    "wither",
    "fighters",
    "pointer",
    "pigscene",
    "burning_skull",
    "skeleton",
    "donkey_kong",
    "baroque",
    "humble",
    "meditative",
    "prairie_ride",
    "unpacked",
    "backyard",
    "bouquet",
    "cavebird",
    "changing",
    "cotan",
    "endboss",
    "fern",
    "finding",
    "lowmist",
    "orb",
    "owlemons",
    "passage",
    "pond",
    "sunflowers",
    "tides",
  ]);
class Painting extends Hanging {
  constructor(t, e, s, i, n, a) {
    (super(t, e, s, i, n), (this.type = "painting"), (this.v = a || PAINTINGS[0]), this.resize());
  }
  resize() {
    const t = this.v || { w: 1, h: 1 };
    ((this.w = Math.max(t.w, 0.0625)), (this.h = t.h), this.place());
  }
  place() {
    const t = DIRS[this.face],
      [e, s, i] = this.block,
      n = this.v || { w: 1, h: 1 },
      a = n.w % 2 == 0 ? 0.5 : 0,
      r = n.h % 2 == 0 ? 0.5 : 0,
      o = [t[2], 0, -t[0]];
    ((this.center = [
      e + 0.5 - 0.46875 * t[0] + o[0] * -a,
      s + 0.5 + r,
      i + 0.5 - 0.46875 * t[2] + o[2] * -a,
    ]),
      (this.pos = [this.center[0], this.center[1] - n.h / 2, this.center[2]]),
      (this.prev = [...this.pos]));
  }
  more() {
    return { v: this.v && this.v.key };
  }
  load(t) {
    ((this.v = PAINTINGS.find((e) => e.key === t.v) || PAINTINGS[0]), this.resize());
  }
  hurt(t, e) {
    return (Sound.ev("entity.painting.break", this.pos, 1, 1), this.breakOff(e), !0);
  }
  survives() {
    return paintingFits(this.world, this.block, this.face, this.v, this);
  }
  drawSelf(t, e, s, i, n) {
    const a = t.renderer,
      r = this.v;
    if (!r) return;
    const o = a.etex("painting/" + r.asset),
      h = a.etex("painting/back");
    if (!o) return;
    const l = M4.create();
    (M4.translate(l, this.center[0], this.center[1], this.center[2]), faceRot(l, this.face));
    const c = a.progTex,
      d = a.gl,
      p = 0.85 * Math.max(n[0], n[1] * i.day) + 0.15,
      quad = (t, e, s) => {
        (d.useProgram(c.p),
          d.uniformMatrix4fv(c.u.u_vp, !1, a.vp),
          d.uniformMatrix4fv(c.u.u_model, !1, e),
          d.uniform4f(c.u.u_color, s, s, s, 1),
          d.activeTexture(d.TEXTURE0),
          d.bindTexture(d.TEXTURE_2D, a.entityTex[t]),
          d.bindVertexArray(a.quadVao),
          d.drawElements(d.TRIANGLES, 6, d.UNSIGNED_INT, 0));
      };
    d.disable(d.CULL_FACE);
    const m = M4.copy(l);
    if (
      (M4.translate(m, 0, 0, -1 / 32),
      M4.rotX(m, -Math.PI / 2),
      M4.scale(m, -r.w / 2, 1, -r.h / 2),
      quad(o, m, p),
      h)
    ) {
      const t = M4.copy(l);
      (M4.translate(t, 0, 0, 1 / 32),
        M4.rotX(t, -Math.PI / 2),
        M4.scale(t, r.w / 2, 1, r.h / 2),
        quad(h, t, 0.7 * p));
    }
    d.enable(d.CULL_FACE);
  }
}
function paintingFits(t, e, s, i, n) {
  if (2 === s || 3 === s) return !1;
  const a = DIRS[s],
    r = [a[2], 0, -a[0]],
    [o, h, l] = e,
    c = -Math.floor((i.w - 1) / 2) - 0 * (i.w % 2 == 0 ? 1 : 0),
    d = -Math.floor((i.h - 1) / 2);
  for (let e = 0; e < i.w; e++)
    for (let s = 0; s < i.h; s++) {
      const n = c + e - (i.w % 2 == 0 ? i.w / 2 - Math.floor((i.w - 1) / 2) - 1 : 0),
        p = h + d + s,
        m = o + r[0] * -n,
        g = l + r[2] * -n;
      if (!BLOCKS[t.getBlock(m - a[0], p, g - a[2])].solid) return !1;
      const u = t.getBlock(m, p, g);
      if (u && !BLOCKS[u].replaceable) return !1;
    }
  return !0;
}
class ArmorStand extends Entity {
  constructor(t, e, s, i) {
    (super(t, e, s, i, 0.5, 1.975),
      (this.type = "armor_stand"),
      (this.keepSaved = !0),
      (this.hittable = !0),
      (this.gear = [null, null, null, null, null, null]),
      (this.lastHit = -100),
      (this.wobble = 0),
      (this.small = !1),
      (this.arms = !1),
      (this.bodyYaw = 0));
  }
  saveData() {
    return { g: this.gear, s: this.small, a: this.arms, y: this.yaw };
  }
  loadData(t) {
    t &&
      ((this.gear = t.g || this.gear),
      (this.small = !!t.s),
      (this.arms = !!t.a),
      void 0 !== t.y && (this.yaw = t.y));
  }
  tick() {
    (this.savePrev(),
      this.age++,
      this.wobble > 0 && this.wobble--,
      (this.vel[1] -= 0.04),
      this.move(0, this.vel[1], 0),
      (this.vel[1] *= 0.98),
      this.onGround && (this.vel[1] = 0));
  }
  slotAt(t) {
    const e = (t - this.pos[1]) / (this.small ? 0.5 : 1);
    return e >= 1.6 ? 3 : e >= 0.9 ? 2 : e >= 0.4 ? 1 : 0;
  }
  interact(t, e) {
    const s = this.game;
    if (e) {
      const i = ITEMS[e.id];
      if (!i) return !1;
      const n = i.armor,
        a = n ? 3 - n.slot : /_(head|skull)$|^carved_pumpkin$/.test(i.key) ? 3 : this.arms ? 4 : -1;
      if (a < 0) return !1;
      const r = this.gear[a];
      return (
        (this.gear[a] = { ...e, count: 1 }),
        useOne(s, t),
        r &&
          "creative" !== s.mode &&
          (t.inv.held
            ? t.inv.add(r) && s.dropItem(t.pos[0], t.pos[1], t.pos[2], r)
            : (t.inv.slots[t.inv.sel] = r)),
        Sound.ev("entity.armor_stand.place", this.pos, 0.5, 1.3),
        !0
      );
    }
    const i = Math.hypot(this.pos[0] - t.pos[0], this.pos[2] - t.pos[2]),
      n = t.pos[1] + t.eye() + Math.tan(t.pitch) * i;
    let a = this.slotAt(n);
    return (
      this.gear[a] || (a = this.gear.findIndex((t) => t)),
      !(a < 0) && ((t.inv.slots[t.inv.sel] = this.gear[a]), (this.gear[a] = null), !0)
    );
  }
  hurt(t, e) {
    const s = this.game;
    if (e && e.attacker === s.player && "creative" === s.mode)
      return ((this.dead = !0), Sound.ev("entity.armor_stand.break", this.pos, 1, 1), !0);
    if (this.age - this.lastHit < 5) {
      ((this.dead = !0),
        Sound.ev("entity.armor_stand.break", this.pos, 1, 1),
        s.dropItem(this.pos[0], this.pos[1] + 0.5, this.pos[2], makeStack("armor_stand", 1)));
      for (const t of this.gear) t && s.dropItem(this.pos[0], this.pos[1] + 0.5, this.pos[2], t);
      for (let t = 0; t < 10; t++)
        s.particles.spawn(
          "block",
          this.pos[0] + 0.4 * (Math.random() - 0.5),
          this.pos[1] + 1.8 * Math.random(),
          this.pos[2] + 0.4 * (Math.random() - 0.5),
          0,
          0.05,
          0,
          { id: BID.oak_planks || 5 },
        );
    } else
      ((this.lastHit = this.age),
        (this.wobble = 5),
        Sound.ev("entity.armor_stand.hit", this.pos, 1, 1));
    return !0;
  }
  drawSelf(t, e, s, i, n) {
    const a = t.renderer,
      r = this.small ? "armor_stand_small" : "armor_stand",
      o = EM.get(a, r + "#main"),
      h = a.etex("entity/armorstand/armorstand");
    if (!o || !h) return;
    EM.reset(o);
    const l = o.parts,
      c = Math.PI / 180;
    (l.left_arm &&
      ((l.left_arm.xRot = -10 * c), (l.left_arm.zRot = -10 * c), (l.left_arm.visible = this.arms)),
      l.right_arm &&
        ((l.right_arm.xRot = -15 * c),
        (l.right_arm.zRot = 10 * c),
        (l.right_arm.visible = this.arms)),
      l.left_leg && ((l.left_leg.xRot = -1 * c), (l.left_leg.zRot = -1 * c)),
      l.right_leg && ((l.right_leg.xRot = 1 * c), (l.right_leg.zRot = 1 * c)),
      l.base_plate && (l.base_plate.yRot = 0));
    const d = M4.create();
    (M4.translate(d, e[0], e[1], e[2]),
      M4.rotY(
        d,
        this.yaw + (this.wobble > 0 ? 0.15 * Math.sin(((this.wobble - s) / 1.5) * Math.PI) : 0),
      ));
    const p = {};
    if (this.gear[4]) {
      const e = this.gear[4];
      p.right_arm = (s) => t.drawHeldItem(s, e, !1, n, i, this, null);
    }
    if (this.gear[5]) {
      const e = this.gear[5];
      p.left_arm = (s) => t.drawHeldItem(s, e, !0, n, i, this, null);
    }
    a.drawEM(o, h, d, n, i, { attach: p, cull: !1 });
    const m = {
      layerKey: () => r + "#main",
      armorItems: [this.gear[3], this.gear[2], this.gear[1], this.gear[0]],
    };
    m.armorItems.some((t) => t) && drawVArmor(t, a, m, o, d, n, i, null);
  }
}
(() => {
  const t = createMob;
  createMob = function (e, s, i, n, a) {
    if ("item_frame" === s || "glow_item_frame" === s)
      return new ItemFrame(
        e,
        Math.floor(i),
        Math.floor(n),
        Math.floor(a),
        4,
        "glow_item_frame" === s,
      );
    if ("painting" === s)
      return new Painting(e, Math.floor(i), Math.floor(n), Math.floor(a), 4, null);
    if ("armor_stand" === s) return new ArmorStand(e, i, n, a);
    if ("leash_knot" === s) {
      const t = new LeashKnot(e, Math.floor(i), Math.floor(n), Math.floor(a));
      return ((t.keepSaved = !0), (t.type = "leash_knot"), t);
    }
    return t(e, s, i, n, a);
  };
  const e = Game.prototype.use;
  Game.prototype.use = function () {
    const t = this.player,
      s = this.world,
      i = t.inv.held,
      n = this.target,
      a = i && ITEMS[i.id] && ITEMS[i.id].key;
    if (
      n &&
      !this.targetEntity &&
      ("item_frame" === a || "glow_item_frame" === a || "painting" === a || "armor_stand" === a)
    ) {
      const e = DIRS[n.face],
        r = n.pos[0] + e[0],
        o = n.pos[1] + e[1],
        h = n.pos[2] + e[2];
      if ("armor_stand" === a) {
        if (3 !== n.face || (s.getBlock(r, o, h) && !BLOCKS[s.getBlock(r, o, h)].replaceable))
          return;
        const e = new ArmorStand(this, r + 0.5, o, h + 0.5);
        return (
          (e.yaw = (Math.round((t.yaw + Math.PI) / (Math.PI / 4)) * Math.PI) / 4),
          i.name && (e.customName = i.name),
          this.entities.push(e),
          Sound.ev("entity.armor_stand.place", e.pos, 0.75, 0.8),
          useOne(this, t),
          void t.swing()
        );
      }
      if (
        this.entities.some(
          (t) =>
            t instanceof Hanging &&
            !t.dead &&
            t.block[0] === r &&
            t.block[1] === o &&
            t.block[2] === h &&
            t.face === n.face,
        )
      )
        return;
      if ("painting" === a) {
        const t = PAINTINGS.filter(
          (t) => PAINTING_PLACEABLE.has(t.key) && paintingFits(s, [r, o, h], n.face, t),
        );
        if (!t.length) return;
        const e = Math.max(...t.map((t) => t.w * t.h)),
          a = t.filter((t) => t.w * t.h === e),
          l = new Painting(
            this,
            r,
            o,
            h,
            n.face,
            i.pv
              ? PAINTINGS.find((t) => t.key === i.pv) || a[0]
              : a[(Math.random() * a.length) | 0],
          );
        (this.entities.push(l), Sound.ev("entity.painting.place", l.pos, 1, 1));
      } else {
        const t = new ItemFrame(this, r, o, h, n.face, "glow_item_frame" === a);
        if (!t.survives()) return;
        (this.entities.push(t), Sound.ev("entity." + a + ".place", t.pos, 1, 1));
      }
      return (useOne(this, t), void t.swing());
    }
    return e.call(this);
  };
})();
const BANNER_PATTERNS = Object.keys(EXTRA.banner_pattern || {}),
  PATTERN_ITEM = {
    flower_banner_pattern: "flower",
    creeper_banner_pattern: "creeper",
    skull_banner_pattern: "skull",
    mojang_banner_pattern: "mojang",
    globe_banner_pattern: "globe",
    piglin_banner_pattern: "piglin",
    flow_banner_pattern: "flow",
    guster_banner_pattern: "guster",
    field_masoned_banner_pattern: "bricks",
    bordure_indented_banner_pattern: "curly_border",
  },
  PATTERN_NEEDS_ITEM = new Set(Object.values(PATTERN_ITEM)),
  patternName = (t, e) => zhT("block.minecraft.banner." + t + "." + e, t),
  bannerColor = (t) => t.replace(/_(wall_)?banner$/, "");
((Renderer.prototype.patternTex = function (t, e, s) {
  return this.etexMix([
    { p: "entity/" + t + "/base", c: dyeRGB(e) },
    ...(s || []).map(([e, s]) => ({ p: "entity/" + t + "/" + e, c: dyeRGB(s) })),
  ]);
}),
  (() => {
    const t = beParts;
    beParts = function (e, s, i, n, a, r) {
      const o = t(e, s, i, n, a, r);
      if ("banner" === s.be || "wall_banner" === s.be) {
        const t =
          window.game && game.blockEntities && game.blockEntities.get(n + "," + a + "," + r);
        if (t && t.patterns && t.patterns.length) {
          const i = e.patternTex("banner", bannerColor(s.key), t.patterns);
          if (i)
            for (const t of o)
              "be_banner_flag" === t[0] && ((t[1] = i), t[3] && (t[3] = { ...t[3], tint: null }));
        }
      }
      return o;
    };
    const e = Renderer.prototype.beTex;
    Renderer.prototype.beTex = function (t) {
      return t && "@" === t[0] ? (this.entityTex[t] ? t : null) : e.call(this, t);
    };
    const s = Game.prototype.placeAt;
    Game.prototype.placeAt = function (t, e, i, n, a, r, ...o) {
      const h = s.call(this, t, e, i, n, a, r, ...o),
        l = BLOCKS[this.world.getBlock(t, e, i)];
      if (l && /banner$/.test(l.key) && r && r.patterns) {
        const s = this.getBlockEntity(t, e, i, "banner");
        ((s.patterns = r.patterns.map((t) => [...t])), r.name && (s.name = r.name));
      }
      return (
        l &&
          /sign$/.test(l.key) &&
          !this.net &&
          this.openSignEditor &&
          setTimeout(() => this.openSignEditor(t, e, i, !0), 0),
        h
      );
    };
    const i = Game.prototype.dropBlockLoot;
    Game.prototype.dropBlockLoot = function (t, e, s, n, a, r, ...o) {
      const h = BLOCKS[n],
        l = t + "," + e + "," + s;
      if (h && /banner$/.test(h.key)) {
        const i = this.blockEntities.get(l);
        if (i && i.patterns && i.patterns.length) {
          this.blockEntities.delete(l);
          const n = makeStack(bannerColor(h.key) + "_banner", 1);
          return (
            (n.patterns = i.patterns),
            i.name && (n.name = i.name),
            void this.dropItem(t + 0.5, e + 0.5, s + 0.5, n)
          );
        }
      }
      return (
        h && /sign$/.test(h.key) && (this.blockEntities.delete(l), this.signs.delete(l)),
        i.call(this, t, e, s, n, a, r, ...o)
      );
    };
  })());
class LoomScreen extends StationScreen {
  constructor(t, e, s) {
    (super(t, "gui_loom", s || "织布机", e),
      (this.sel = -1),
      (this.scroll = 0),
      this.own(0, 13, 26, {
        accept: (t) => /_banner$/.test(ITEMS[t.id].key),
        emptyIcon: "slot_banner",
      }),
      this.own(1, 33, 26, { accept: (t) => /_dye$/.test(ITEMS[t.id].key), emptyIcon: "slot_dye" }),
      this.own(2, 23, 45, {
        accept: (t) => !!PATTERN_ITEM[ITEMS[t.id].key],
        emptyIcon: "slot_banner_pattern",
        max: 1,
      }),
      this.slots.push({
        x: 143,
        y: 58,
        output: !0,
        get: () => this.result,
        set: () => {},
        onTake: () => this.take(),
      }),
      this.addPlayerSlots(84, 142),
      this.changed());
  }
  patterns() {
    const t = (ENTITY_DATA.extra && ENTITY_DATA.extra.tags) || {},
      e = this.S(2),
      s = e && ITEMS[e.id].key,
      i = s && PATTERN_ITEM[s],
      tag = (e) =>
        t["banner_pattern:" + e] &&
        t["banner_pattern:" + e].map((t) => t.replace("minecraft:", ""));
    return i
      ? tag("pattern_item/" + s.replace(/_banner_pattern$/, "")) || [i]
      : tag("no_item_required") ||
          BANNER_PATTERNS.filter((t) => "base" !== t && !PATTERN_NEEDS_ITEM.has(t));
  }
  changed() {
    const t = this.S(0),
      e = this.S(1),
      s = this.patterns();
    (this.sel >= s.length && (this.sel = -1),
      1 === s.length && this.S(2) && (this.sel = 0),
      (this.result = null),
      t &&
        e &&
        this.sel >= 0 &&
        (t.patterns || []).length < 6 &&
        (this.result = {
          ...t,
          count: 1,
          patterns: [...(t.patterns || []), [s[this.sel], ITEMS[e.id].key.replace(/_dye$/, "")]],
        }));
  }
  pick(t) {
    ((this.sel = t), this.changed());
  }
  take() {
    for (const t of [0, 1]) {
      const e = this.held[t];
      e && (e.count--, e.count || (this.held[t] = null));
    }
    (Sound.ev("ui.loom.take_result", null, 1, 1), this.changed());
  }
  cell(t) {
    const e = t - 4 * this.scroll;
    return { x: this.x + 60 + (e % 4) * 14, y: this.y + 13 + 14 * Math.floor(e / 4), w: 14, h: 14 };
  }
  mouseDown(t, e, s, i, n) {
    if (this.S(0) && this.S(1)) {
      const i = this.patterns();
      for (let n = 4 * this.scroll; n < Math.min(i.length, 4 * this.scroll + 16); n++)
        if (t.hit(this.cell(n), e, s))
          return (this.pick(n), void Sound.ev("ui.loom.select_pattern", null, 1, 1));
    }
    super.mouseDown(t, e, s, i, n);
  }
  wheel(t, e) {
    this.scroll = clamp(
      this.scroll + Math.sign(e),
      0,
      Math.max(0, Math.ceil(this.patterns().length / 4) - 4),
    );
  }
  drawMore(t) {
    t.ctx;
    const e = this.game.renderer,
      s = this.S(0),
      i = this.S(1),
      n = this.patterns(),
      a = s && i && (s.patterns || []).length < 6;
    if (
      (s && (s.patterns || []).length >= 6 && t.sprite("loom_error", this.x + 133, this.y + 16), a)
    )
      for (let s = 4 * this.scroll; s < Math.min(n.length, 4 * this.scroll + 16); s++) {
        const a = this.cell(s);
        (t.sprite(
          s === this.sel
            ? "loom_pattern_selected"
            : t.hit(a)
              ? "loom_pattern_highlighted"
              : "loom_pattern",
          a.x,
          a.y,
        ),
          drawPatternPreview(
            t,
            e,
            "white",
            [[n[s], ITEMS[i.id].key.replace(/_dye$/, "")]],
            a.x + 4,
            a.y + 2,
            5,
            10,
            !0,
          ));
      }
    t.sprite(
      n.length > 16 ? "loom_scroller" : "loom_scroller_disabled",
      this.x + 119,
      this.y +
        13 +
        (n.length > 16
          ? Math.floor((this.scroll / Math.max(1, Math.ceil(n.length / 4) - 4)) * 41)
          : 0),
    );
    const r = this.S(3) || s;
    r &&
      drawPatternPreview(
        t,
        e,
        bannerColor(ITEMS[r.id].key),
        r.patterns || [],
        this.x + 141,
        this.y + 8,
        20,
        40,
        !1,
      );
  }
}
function drawPatternPreview(t, e, s, i, n, a, r, o, h) {
  const l = e.patternTex("banner", h ? "gray" : s, i),
    c = l && e.mixCanvas && e.mixCanvas.get(l);
  c && ((t.ctx.imageSmoothingEnabled = !1), t.ctx.drawImage(c, 1, 1, 20, 40, n, a, r, o));
}
((() => {
  const t = Renderer.prototype.etexMix;
  Renderer.prototype.etexMix = function (e) {
    const s = t.call(this, e);
    if (s && (!this.mixCanvas || !this.mixCanvas.has(s))) {
      const t = e.map((t) => this.images["@" + ("string" == typeof t ? t : t.p)]);
      if (t.every(Boolean)) {
        const i = document.createElement("canvas");
        ((i.width = t[0].width), (i.height = t[0].height));
        const n = i.getContext("2d");
        (e.forEach((e, s) => {
          const a = document.createElement("canvas");
          ((a.width = t[s].width), (a.height = t[s].height));
          const r = a.getContext("2d");
          if ((r.drawImage(t[s], 0, 0), e.c)) {
            const t = r.getImageData(0, 0, a.width, a.height);
            for (let s = 0; s < t.data.length; s += 4)
              ((t.data[s] *= e.c[0]), (t.data[s + 1] *= e.c[1]), (t.data[s + 2] *= e.c[2]));
            r.putImageData(t, 0, 0);
          }
          n.drawImage(a, 0, 0, i.width, i.height);
        }),
          (this.mixCanvas || (this.mixCanvas = new Map())).set(s, i));
      }
    }
    return s;
  };
})(),
  "undefined" != typeof WORKSTATIONS &&
    ((WORKSTATIONS.loom = (t, e, s) => new LoomScreen(t, e, s.cn)),
    void 0 !== BID.loom && (BLOCKS[BID.loom].onUse = "loom")),
  (() => {
    const t = UI.prototype.itemLines;
    UI.prototype.itemLines = function (e) {
      const s = t.call(this, e);
      if (e && e.patterns && e.patterns.length)
        for (const [t, i] of e.patterns)
          s.splice(1, 0, { text: patternName(t, i), color: "#AAAAAA" });
      if (e && e.pv && ITEMS[e.id] && "painting" === ITEMS[e.id].key) {
        const t = PAINTINGS.find((t) => t.key === e.pv);
        t && s.push({ text: t.title, color: "#FFFF55" }, { text: t.author, color: "#AAAAAA" });
      }
      return s;
    };
  })());
const signSideKey = (t, e, s, i) => {
  const n = t.world,
    a = BLOCKS[n.getBlock(e, s, i)],
    r = (a.states && a.states[n.getMeta(e, s, i)]) || {},
    o = t.player;
  if (a.key.includes("wall") && !a.key.includes("hanging")) return "f";
  const h =
      ((void 0 !== r.rotation ? 22.5 * +r.rotation : (FACING_DEG[r.facing] ?? 0)) * Math.PI) / 180,
    l = -Math.sin(h),
    c = Math.cos(h);
  return (o.pos[0] - e - 0.5) * l + (o.pos[2] - i - 0.5) * c >= 0 ? "f" : "b";
};
((Game.prototype.signAt = function (t, e, s) {
  const i = t + "," + e + "," + s;
  let n = this.signs.get(i);
  if (!n) {
    const a = this.getBlockEntity(t, e, s, "sign");
    ((a.text = a.text || {
      f: { l: ["", "", "", ""], c: "black", g: !1 },
      b: { l: ["", "", "", ""], c: "black", g: !1 },
    }),
      (n = a.text),
      this.signs.set(i, n));
  }
  return n;
}),
  (Game.prototype.openSignEditor = function (t, e, s, i) {
    if (!/sign$/.test(BLOCKS[this.world.getBlock(t, e, s)].key)) return;
    const n = this.signAt(t, e, s),
      a = !0 === i ? "f" : i || signSideKey(this, t, e, s);
    this.ui.open(new SignScreen(this, [t, e, s], n[a]));
  }));
class SignScreen {
  constructor(t, e, s) {
    ((this.game = t), (this.pos = e), (this.side = s), (this.line = 0));
    const i = BLOCKS[t.world.getBlock(...e)];
    ((this.wood = i.key.replace(/_(wall_)?(hanging_)?sign$/, "")),
      (this.hanging = i.key.includes("hanging")));
  }
  layout() {
    const t = this.game.ui;
    ((this.x = Math.floor(t.w / 2)), (this.y = 40), this.edit());
  }
  edit() {
    const t = this.game.ui,
      e = this;
    t.showInput(
      this.x - 45,
      this.y + 40 + 10 * this.line,
      90,
      10,
      this.side.l[this.line],
      () => {
        ((e.line = (e.line + 1) % 4), e.edit());
      },
      {
        max: 15,
        onInput: (t) => {
          e.side.l[e.line] = t;
        },
        onEsc: () => t.close(),
      },
    );
    const s = t.input,
      i = s.onkeydown;
    s.onkeydown = (t) => {
      if ("ArrowUp" === t.key || "ArrowDown" === t.key)
        return (
          t.preventDefault(),
          (e.line = (e.line + ("ArrowUp" === t.key ? 3 : 1)) % 4),
          void e.edit()
        );
      i(t);
    };
  }
  close() {
    (this.game.ui.hideInput(),
      this.game.flushMesh && this.game.flushMesh(),
      this.onDone && this.onDone());
  }
  key(t, e) {
    return !0;
  }
  mouseDown(t, e, s) {
    t.hit({ x: this.x - 100, y: this.y + 140, w: 200, h: 20 }, e, s) && t.close();
  }
  draw(t) {
    const e = t.ctx,
      s = this.game.renderer;
    (t.dim(0.4), Font.center(e, "编辑告示牌信息", this.x, this.y, "#FFFFFF"));
    const i = s.images["@entity/signs/" + (this.hanging ? "hanging/" : "") + this.wood];
    (i || s.etex("entity/signs/" + (this.hanging ? "hanging/" : "") + this.wood),
      (e.imageSmoothingEnabled = !1),
      i
        ? this.hanging
          ? e.drawImage(i, 0, 0, 16, 16, this.x - 48, this.y + 22, 96, 96)
          : e.drawImage(i, 2, 2, 24, 12, this.x - 60, this.y + 30, 120, 60)
        : ((e.fillStyle = "#9C7F4E"), e.fillRect(this.x - 60, this.y + 30, 120, 60)));
    const n = SIGN_TEXT_RGB[this.side.c] || "#000000";
    for (let t = 0; t < 4; t++)
      t !== this.line && Font.center(e, this.side.l[t] || "", this.x, this.y + 41 + 10 * t, n, !1);
    t.drawInputText && t.drawInputText();
    const a = { x: this.x - 100, y: this.y + 140, w: 200, h: 20 };
    t.button({ ...a, label: "完成" });
  }
}
(() => {
  const t = Game.prototype.use;
  Game.prototype.use = function () {
    const e = this.player,
      s = this.target,
      i = e.inv.held,
      n = i && ITEMS[i.id] && ITEMS[i.id].key;
    if (
      s &&
      !this.targetEntity &&
      !e.sneaking &&
      BLOCKS[s.id] &&
      /sign$/.test(BLOCKS[s.id].key) &&
      !this.net
    ) {
      const [t, i, a] = s.pos,
        r = this.signAt(t, i, a),
        o = r[signSideKey(this, t, i, a)],
        h = [t + 0.5, i + 0.5, a + 0.5];
      if (r.wax) return (Sound.ev("block.sign.waxed_interact_fail", h, 1, 1), void e.swing());
      if (n && /_dye$/.test(n)) {
        const t = n.replace(/_dye$/, "");
        return (
          o.c !== t && ((o.c = t), useOne(this, e), Sound.ev("item.dye.use", h, 1, 1)),
          void e.swing()
        );
      }
      return "glow_ink_sac" !== n || o.g
        ? "ink_sac" === n && o.g
          ? ((o.g = !1), useOne(this, e), Sound.ev("item.ink_sac.use", h, 1, 1), void e.swing())
          : "honeycomb" === n
            ? ((r.wax = !0),
              useOne(this, e),
              Sound.ev("item.honeycomb.wax_on", h, 1, 1),
              void e.swing())
            : void this.openSignEditor(t, i, a)
        : ((o.g = !0), useOne(this, e), Sound.ev("item.glow_ink_sac.use", h, 1, 1), void e.swing());
    }
    return t.call(this);
  };
  const e = Game.prototype.drawSignTexts;
  Game.prototype.drawSignTexts = function (t) {
    return e.call(this, t);
  };
  const s = Game.prototype.drawChests;
  Game.prototype.drawChests = function (t, e) {
    if (this.blockEntities && this._signSync !== this.blockEntities) {
      this._signSync = this.blockEntities;
      for (const [t, e] of this.blockEntities)
        "sign" === e.type && e.text && this.signs.set(t, e.text);
    }
    return s.call(this, t, e);
  };
})();
//# sourceURL=js/decor.js
