"use strict";
const OFF = 40,
  keyOfStack = (t) => (t && ITEMS[t.id] ? ITEMS[t.id].key : null),
  isSpear = (t) => !!t && /_spear$/.test(t),
  AMMO = new Set(["arrow", "tipped_arrow", "spectral_arrow"]),
  glintOf = (t) => "function" == typeof stackGlint && stackGlint(t);
Renderer.prototype.initEquipModels = function () {
  if (this.models.eq_shield) return;
  const t = this.models,
    P = (t, e, s) => ({
      parts: [{ name: "p", pivot: [0, 0, 0], boxes: s, mesh: this.makeModelPart(s, t, e) }],
    });
  ((t.eq_shield = P(64, 64, [
    [0, 0, -6, -11, -2, 12, 22, 1],
    [26, 0, -1, -3, -1, 2, 6, 6],
  ])),
    (t.eq_elytra = {
      parts: [
        { name: "lw", pivot: [-5, 24, 2], boxes: [[22, 0, 0, -20, 0, 10, 20, 2, 1]] },
        { name: "rw", pivot: [5, 24, 2], boxes: [[22, 0, -10, -20, 0, 10, 20, 2, 1, !0]] },
      ],
    }),
    this.packParts(t.eq_elytra.parts, 64, 32),
    (t.eq_trident = P(32, 32, [
      [0, 6, -0.5, -27, -0.5, 1, 25, 1],
      [4, 0, -1.5, -2, -0.5, 3, 2, 1],
      [4, 3, -2.5, -1, -0.5, 1, 4, 1],
      [0, 0, -0.5, 0, -0.5, 1, 4, 1],
      [4, 3, 1.5, -1, -0.5, 1, 4, 1, 0, !0],
    ])));
};
const DISPLAY = {
  shield: {
    firstperson_righthand: { r: [0, 180, 5], t: [-10, 1.75, -10], s: [1.25, 1.25, 1.25] },
    firstperson_lefthand: { r: [0, 180, 5], t: [10, 0, -10], s: [1.25, 1.25, 1.25] },
    thirdperson_righthand: { r: [0, 90, 0], t: [10, 6, -4], s: [1, 1, 1] },
    thirdperson_lefthand: { r: [0, 90, 0], t: [10, 6, 12], s: [1, 1, 1] },
  },
  shield_blocking: {
    firstperson_righthand: { r: [0, 180, -5], t: [-15, 3.25, -11], s: [1.25, 1.25, 1.25] },
    firstperson_lefthand: { r: [0, 180, -5], t: [5, 5, -11], s: [1.25, 1.25, 1.25] },
    thirdperson_righthand: { r: [45, 155, 0], t: [-3.49, 11, -2], s: [1, 1, 1] },
    thirdperson_lefthand: { r: [45, 155, 0], t: [11.51, 7, 2.5], s: [1, 1, 1] },
  },
  trident: {
    firstperson_righthand: { r: [0, -90, 25], t: [-3, 17, 1], s: [1, 1, 1] },
    firstperson_lefthand: { r: [0, 90, -25], t: [13, 17, 1], s: [1, 1, 1] },
    thirdperson_righthand: { r: [0, 60, 0], t: [11, 17, -2], s: [1, 1, 1] },
    thirdperson_lefthand: { r: [0, 60, 0], t: [3, 17, 12], s: [1, 1, 1] },
  },
  trident_throwing: {
    thirdperson_righthand: { r: [0, 90, 180], t: [8, -17, 9], s: [1, 1, 1] },
    thirdperson_lefthand: { r: [0, 90, 180], t: [8, -17, -7], s: [1, 1, 1] },
  },
};
function applyDisplay(t, e, s) {
  if (!e) return;
  const i = Math.PI / 180,
    r = s ? -1 : 1,
    n = e.t || [0, 0, 0],
    a = e.r || [0, 0, 0],
    o = e.s || [1, 1, 1];
  (M4.translate(t, (r * n[0]) / 16, n[1] / 16, n[2] / 16),
    M4.rotX(t, a[0] * i),
    M4.rotY(t, r * a[1] * i),
    M4.rotZ(t, r * a[2] * i),
    M4.scale(t, o[0], o[1], o[2]));
}
((Renderer.prototype.shieldIcon = function (t, e, s, i) {
  (this.initEquipModels(), (t = t || { r: [15, -25, -5], t: [2, 3, 0], s: [0.65, 0.65, 0.65] }));
  const r = M4.create();
  (applyDisplay(r, t, !1),
    M4.translate(r, -0.5, -0.5, -0.5),
    M4.scale(r, 1, 1, -1),
    this.drawModel(
      "eq_shield",
      i || this.beTex("shield_base"),
      r,
      null,
      [1, 0],
      { ...e, ambient: [0.3, 0.3, 0.3] },
      { vp: s },
    ));
}),
  (Renderer.prototype.shieldStackIcon = function (t) {
    const e =
      "function" == typeof shieldTex && t && (t.base || (t.patterns && t.patterns.length))
        ? shieldTex(this, t)
        : null;
    if (!e || "shield_base" === e || !this.iconSize) return null;
    const s = this._shieldIcons || (this._shieldIcons = new Map());
    if (s.has(e)) return s.get(e);
    const i = this.gl,
      r = this.iconSize,
      n = i.getParameter(i.FRAMEBUFFER_BINDING),
      a = i.getParameter(i.VIEWPORT),
      o = i.getParameter(i.COLOR_CLEAR_VALUE),
      l = i.isEnabled(i.SCISSOR_TEST),
      h = i.isEnabled(i.DEPTH_TEST),
      c = i.isEnabled(i.CULL_FACE),
      d = i.isEnabled(i.BLEND),
      p = i.createFramebuffer(),
      u = i.createTexture(),
      f = i.createRenderbuffer();
    (i.bindTexture(i.TEXTURE_2D, u),
      i.texImage2D(i.TEXTURE_2D, 0, i.RGBA, r, r, 0, i.RGBA, i.UNSIGNED_BYTE, null),
      (this.texEp = -1),
      i.bindRenderbuffer(i.RENDERBUFFER, f),
      i.renderbufferStorage(i.RENDERBUFFER, i.DEPTH_COMPONENT24, r, r),
      i.bindFramebuffer(i.FRAMEBUFFER, p),
      i.framebufferTexture2D(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0, i.TEXTURE_2D, u, 0),
      i.framebufferRenderbuffer(i.FRAMEBUFFER, i.DEPTH_ATTACHMENT, i.RENDERBUFFER, f),
      i.viewport(0, 0, r, r),
      i.disable(i.SCISSOR_TEST),
      i.clearColor(0, 0, 0, 0),
      i.clear(i.COLOR_BUFFER_BIT | i.DEPTH_BUFFER_BIT),
      i.enable(i.DEPTH_TEST),
      i.disable(i.CULL_FACE),
      i.disable(i.BLEND));
    const m = M4.create();
    M4.ortho(m, -0.5, 0.5, -0.5, 0.5, -10, 10);
    const g = this.vp,
      y = this.camPos,
      M = this.fxOn;
    ((this.vp = m), (this.camPos = [0, 0, 0]), (this.fxOn = !1));
    const k = new Uint8Array(r * r * 4);
    try {
      const t = "undefined" != typeof VM && VM.ready && VM.data.items.shield,
        s = t && void 0 !== t.m ? VM.data.models[t.m] : null;
      (this.shieldIcon(
        s && s.display && s.display.gui,
        { tick: 0, day: 1, fogColor: [0, 0, 0], fogNear: 1e8, fogFar: 2e8, nightTint: [1, 1, 1] },
        m,
        e,
      ),
        i.readPixels(0, 0, r, r, i.RGBA, i.UNSIGNED_BYTE, k));
    } catch (t) {
      return (s.set(e, null), null);
    } finally {
      ((this.vp = g),
        (this.camPos = y),
        (this.fxOn = M),
        i.bindFramebuffer(i.FRAMEBUFFER, n),
        i.viewport(a[0], a[1], a[2], a[3]),
        i.clearColor(o[0], o[1], o[2], o[3]),
        l && i.enable(i.SCISSOR_TEST),
        h || i.disable(i.DEPTH_TEST),
        c && i.enable(i.CULL_FACE),
        d && i.enable(i.BLEND),
        i.deleteFramebuffer(p),
        i.deleteTexture(u),
        i.deleteRenderbuffer(f));
    }
    const w = document.createElement("canvas");
    w.width = w.height = r;
    const _ = w.getContext("2d"),
      E = _.createImageData(r, r);
    for (let t = 0; t < r; t++)
      E.data.set(k.subarray((r - 1 - t) * r * 4, (r - t) * r * 4), t * r * 4);
    return (
      _.putImageData(E, 0, 0),
      s.size > 64 && s.delete(s.keys().next().value),
      s.set(e, w),
      w
    );
  }),
  (Game.prototype.drawShieldItem = function (t, e, s, i, r) {
    const n = this.renderer,
      a = n.itemModel(t.id),
      o = a && a.model && a.model.display && a.model.display[r];
    n.initEquipModels();
    const l = n.mat(e);
    ("ground" === r && M4.translate(l, 0, 0.046875, 0),
      applyDisplay(l, o || { r: [0, 0, 0], t: [0, 0, 0], s: [0.25, 0.25, 0.25] }, !1),
      M4.translate(l, -0.5, -0.5, -0.5),
      M4.scale(l, 1, 1, -1));
    const h = n.gl,
      c = h.isEnabled(h.CULL_FACE);
    (h.disable(h.CULL_FACE),
      n.drawModel(
        "eq_shield",
        "function" == typeof shieldTex ? shieldTex(n, t) : n.beTex("shield_base"),
        l,
        null,
        s,
        i,
        { glint: glintOf(t) && "entity" },
      ),
      c && h.enable(h.CULL_FACE));
  }));
const TRIM_DARKER = new Set(["iron", "gold", "diamond", "netherite", "copper"]);
function itemStateTex(t, e) {
  if (t && ITEMS[t.id] && ITEMS[t.id].tcTool) return null;
  const s = keyOfStack(t);
  if ("crossbow" === s) {
    if (t.charged && t.charged.length)
      return "firework_rocket" === keyOfStack(t.charged[0])
        ? "i_crossbow_firework"
        : "i_crossbow_arrow";
    if (e && e.usingItem === t.id && ("off" === e.useHand ? e.inv.slots[OFF] : e.inv.held) === t) {
      const s = e.useT / crossbowCharge(t);
      return s >= 1
        ? "i_crossbow_pulling_2"
        : s >= 0.58
          ? "i_crossbow_pulling_1"
          : "i_crossbow_pulling_0";
    }
  }
  return "elytra" === s && (t.dmg || 0) >= ITEMS[t.id].durability - 1
    ? "i_elytra_broken"
    : "function" == typeof dynamicIconTex
      ? dynamicIconTex(t, e)
      : null;
}
((Renderer.prototype.trimTex = function (t, e, s) {
  if (!t || !t.pattern || !t.material) return null;
  const i = "golden" === e ? "gold" : "chain" === e ? "chainmail" : e,
    r = t.material + (i === t.material && TRIM_DARKER.has(t.material) ? "_darker" : ""),
    n = "trims/entity/" + (s ? "humanoid_leggings/" : "humanoid/") + t.pattern,
    a = "@trim:" + n + ":" + r;
  if (this.entityTex[a]) return a;
  if (this._trimFail && this._trimFail.has(a)) return null;
  const o = [n, "trims/color_palettes/trim_palette", "trims/color_palettes/" + r];
  if (o.some((t) => !(window.ETEX && ETEX[t])))
    return ((this._trimFail || (this._trimFail = new Set())).add(a), null);
  const l = o.map((t) => (this.etex(t), this.images["@" + t]));
  if (l.some((t) => !t)) return null;
  const px = (t) => {
      const e = document.createElement("canvas");
      ((e.width = t.width), (e.height = t.height));
      const s = e.getContext("2d");
      return (s.drawImage(t, 0, 0), [e, s, s.getImageData(0, 0, t.width, t.height)]);
    },
    [h, c, d] = px(l[0]),
    p = px(l[1])[2].data,
    u = px(l[2])[2].data,
    f = new Map();
  for (let t = 0; t + 3 < p.length && t + 3 < u.length; t += 4)
    f.set((p[t] << 16) | (p[t + 1] << 8) | p[t + 2], t);
  const m = d.data;
  for (let t = 0; t < m.length; t += 4) {
    if (!m[t + 3]) continue;
    let e = f.get((m[t] << 16) | (m[t + 1] << 8) | m[t + 2]);
    if (void 0 === e) {
      let s = 300;
      for (let i = 0; i + 3 < p.length; i += 4) {
        const r = (p[i] - m[t]) ** 2 + (p[i + 1] - m[t + 1]) ** 2 + (p[i + 2] - m[t + 2]) ** 2;
        r < s && ((s = r), (e = i));
      }
    }
    void 0 === e ||
      e + 3 >= u.length ||
      ((m[t] = u[e]),
      (m[t + 1] = u[e + 1]),
      (m[t + 2] = u[e + 2]),
      (m[t + 3] = Math.round((m[t + 3] * u[e + 3]) / 255)));
  }
  return (c.putImageData(d, 0, 0), (this.entityTex[a] = this.tex2D(h, !1)), a);
}),
  (Renderer.prototype.tileIcon = function (t) {
    const e = this._tileIcons || (this._tileIcons = new Map());
    let s = e.get(t);
    return (
      s ||
        ((s = document.createElement("canvas")),
        (s.width = s.height = 16),
        s.getContext("2d").drawImage(this.stripCanvas, ...this.tileXY(T(t)), 16, 16, 0, 0, 16, 16),
        e.set(t, s)),
      s
    );
  }),
  (Game.prototype.swapOffhand = function () {
    const t = this.player,
      e = t.inv;
    this.net && this.net.send({ t: "swaphands" });
    const s = e.slots[e.sel];
    ((e.slots[e.sel] = e.slots[OFF] || null),
      (e.slots[OFF] = s || null),
      (t.usingItem = null),
      (t.useT = 0));
  }));
const crossbowCharge = (t) => Math.max(0, 25 - 5 * enchLevel(t, "quick_charge"));
((Game.prototype.mainHandBusy = function (t, e) {
  if (!t) return !1;
  const s = e.key;
  return (
    !!(
      e.food ||
      e.armor ||
      e.spawnEgg ||
      /potion|bucket|bow$|^trident$|_spear$|^ender_(pearl|eye)$|^snowball$|egg$|^fishing_rod$|^flint_and_steel$|^fire_charge$|^bone_meal$|^shield$|^firework_rocket$/.test(
        s,
      )
    ) || !(!this.target || (void 0 === e.block && !e.places))
  );
}),
  (Game.prototype.startUsing = function (t, e) {
    const s = this.player;
    ((s.usingItem = t.id), (s.useHand = e), (s.useT = 0));
  }),
  (Game.prototype.useEquipment = function (t, e) {
    const s = this.player,
      i = e && e.key;
    return "shield" === i
      ? (s.shieldCd > this.tickCount || this.startUsing(t, "main"), !0)
      : "crossbow" === i
        ? t.charged && t.charged.length
          ? (this.shootCrossbow(t), !0)
          : (("creative" === this.mode || this.findAmmo(!0)) && this.startUsing(t, "main"), !0)
        : "trident" === i
          ? !(!enchLevel(t, "riptide") || s.inWater || this.rainingAt(s)) ||
            (t.dmg >= ITEMS[t.id].durability - 1 || this.startUsing(t, "main"), !0)
          : isSpear(i)
            ? (this.startUsing(t, "main"),
              (s.spearStart = this.tickCount),
              Sound.ev("item.spear.use", s.pos, 1, 1),
              !0)
            : !("firework_rocket" !== i || !s.gliding) &&
              ((s.boostT = 12 + Math.floor(6 * Math.random())),
              Sound.ev("entity.firework_rocket.launch", s.pos, 3, 1),
              "creative" !== this.mode && (t.count--, t.count || (s.inv.slots[s.inv.sel] = null)),
              s.swing(),
              !0);
  }),
  (Game.prototype.rainingAt = function (t) {
    if ("overworld" !== this.dim || !(this.weather > 0.2)) return !1;
    const e = Math.floor(t.pos[0]),
      s = Math.floor(t.pos[2]);
    if (this.dryAt(e, s)) return !1;
    const i = this.world.surfaceY(e, s);
    return [Math.floor(t.pos[1]), Math.floor(t.pos[1] + t.h)].some(
      (t) => t > i && !(this.world.gen2 ? this.snowsAt(e, t, s) : this.isCold(e, s)),
    );
  }),
  (Game.prototype.usingTick = function (t) {
    const e = this.player,
      s = keyOfStack(t);
    if ("crossbow" === s) {
      const s = crossbowCharge(t),
        i = enchLevel(t, "quick_charge");
      (e.useT === Math.ceil(0.2 * s) &&
        Sound.ev(
          i ? "item.crossbow.quick_charge_" + Math.min(i, 3) : "item.crossbow.loading_start",
          e.pos,
          0.5,
          1,
        ),
        i ||
          e.useT !== Math.ceil(0.5 * s) ||
          Sound.ev("item.crossbow.loading_middle", e.pos, 0.5, 1),
        e.useT === s &&
          Sound.ev("item.crossbow.loading_end", e.pos, 1, 1 / (0.5 * Math.random() + 1) + 0.2));
    }
    isSpear(s) && this.spearTick(t);
  }),
  (Game.prototype.releaseUsing = function (t) {
    const e = this.player,
      s = keyOfStack(t);
    return "bow" === s
      ? this.releaseBow()
      : !("crossbow" === s && e.useT >= crossbowCharge(t)) || (t.charged && t.charged.length)
        ? "trident" === s && e.useT >= 10
          ? this.releaseTrident(t)
          : void 0
        : this.loadCrossbow(t);
  }),
  (Game.prototype.findAmmo = function (t) {
    const e = this.player.inv,
      s = e.slots[OFF];
    if (s && (AMMO.has(keyOfStack(s)) || (t && "firework_rocket" === keyOfStack(s))))
      return [OFF, s];
    for (let t = 0; t < 36; t++) {
      const s = e.slots[t];
      if (s && AMMO.has(keyOfStack(s))) return [t, s];
    }
    return null;
  }),
  (Game.prototype.loadCrossbow = function (t) {
    const e = this.player,
      s = this.findAmmo(!0),
      i = enchLevel(t, "multishot") ? 3 : 1,
      r = s ? { ...s[1], count: 1 } : "creative" === this.mode ? makeStack("arrow") : null;
    r &&
      (s && "creative" !== this.mode && (s[1].count--, s[1].count || (e.inv.slots[s[0]] = null)),
      (t.charged = Array.from({ length: i }, () => ({ ...r }))),
      Sound.ev("item.crossbow.loading_end", e.pos, 1, 1));
  }),
  (Game.prototype.shootCrossbow = function (t) {
    const e = this.player,
      s = this.lookDir(),
      i = t.charged,
      r = enchLevel(t, "piercing");
    (i.forEach((t, n) => {
      const a = i.length > 1 ? ([0, -10, 10][n] * Math.PI) / 180 : 0,
        o = Math.cos(a),
        l = Math.sin(a),
        h = [s[0] * o - s[2] * l, s[1], s[0] * l + s[2] * o];
      if ("firework_rocket" === keyOfStack(t))
        return void this.entities.push(
          new FireworkRocket(
            this,
            e.pos[0],
            e.pos[1] + e.eye() - 0.15,
            e.pos[2],
            t,
            h.map((t) => 1.6 * t),
            e,
          ),
        );
      const c = new Arrow(
        this,
        e.pos[0],
        e.pos[1] + e.eye() - 0.15,
        e.pos[2],
        h.map((t) => 3.15 * t),
        e,
      );
      ((c.stack = { ...t, count: 1 }),
        (c.pierce = r),
        (c.crossbow = !0),
        "arrow" !== keyOfStack(t) && (c.tip = t),
        (n > 0 || "creative" === this.mode) && (c.noPickup = !0),
        this.entities.push(c));
    }),
      delete t.charged,
      Sound.ev("item.crossbow.shoot", e.pos, 1, 1 / (0.5 * Math.random() + 1.8) + 0.63),
      this.damageHeld(i.reduce((t, e) => t + ("firework_rocket" === keyOfStack(e) ? 3 : 1), 0)));
  }));
class ThrownTrident extends Arrow {
  constructor(t, e, s, i, r, n, a) {
    (super(t, e, s, i, r, n),
      (this.stack = a),
      (this.baseDmg = 8),
      (this.trident = !0),
      (this.loyalty = enchLevel(a, "loyalty")),
      (this.returning = !1),
      (this.dealt = !1));
  }
  tick() {
    const t = this.game.player;
    if (
      (this.loyalty &&
        (this.dealt || this.stuck || this.age > 80) &&
        !this.returning &&
        this.shooter === t &&
        ((this.returning = !0),
        (this.stuck = !1),
        Sound.ev("item.trident.return", this.pos, 10, 1)),
      this.returning)
    ) {
      (this.savePrev(), this.age++);
      const e = [t.pos[0] - this.pos[0], t.pos[1] + t.eye() - this.pos[1], t.pos[2] - this.pos[2]],
        s = Math.hypot(...e) || 1,
        i = 0.05 * this.loyalty;
      ((this.pos[1] += 0.015 * e[1] * this.loyalty),
        (this.vel = this.vel.map((t, r) => 0.95 * t + (e[r] / s) * i)));
      for (let t = 0; t < 3; t++) this.pos[t] += this.vel[t];
      return (this.updateRot(), void (s < 1.5 && this.pickUp()));
    }
    const e = this.stuck;
    (super.tick(), !e && this.stuck && Sound.ev("item.trident.hit_ground", this.pos, 1, 1));
  }
  onHit(t) {
    this.dealt = !0;
    const e = this.vel;
    ((this.vel = [-0.01 * e[0], -0.1 * e[1], -0.01 * e[2]]),
      Sound.ev("item.trident.hit", this.pos, 1, 1),
      enchLevel(this.stack, "channeling") &&
        this.game.thunder &&
        this.game.strikeLightning &&
        this.game.strikeLightning(t.pos[0], t.pos[1], t.pos[2]));
  }
  pickUp() {
    const t = this.game.player;
    this.shooter !== t ||
      (!t.creative && 0 !== t.inv.add({ ...this.stack })) ||
      ((this.dead = !0), Sound.pop(this.pos));
  }
  drawSelf(t, e, s, i, r) {
    const n = t.renderer;
    n.initEquipModels();
    const a = n.mat();
    (M4.translate(a, e[0], e[1], e[2]),
      M4.rotY(a, this.yaw),
      M4.rotX(a, this.pitch - Math.PI / 2),
      M4.translate(a, 0, 0.6, 0),
      n.gl.disable(n.gl.CULL_FACE),
      n.drawModel("eq_trident", n.beTex("trident"), a, null, r, i, {
        glint: glintOf(this.stack) && "entity",
      }),
      n.gl.enable(n.gl.CULL_FACE));
  }
}
Game.prototype.releaseTrident = function (t) {
  const e = this.player,
    s = enchLevel(t, "riptide");
  if ((this.damageHeld(1), s)) {
    const t = this.lookDir(),
      i = ((1 + s) / 4) * 3;
    return (
      (e.vel[0] += t[0] * i),
      (e.vel[1] += t[1] * i),
      (e.vel[2] += t[2] * i),
      e.onGround && (e.pos[1] += 1.2),
      (e.riptideT = 20),
      (e.fallDist = 0),
      void Sound.ev("item.trident.riptide_" + Math.min(3, s), e.pos, 1, 1)
    );
  }
  const i = this.lookDir(),
    r = { ...t, count: 1 },
    n = new ThrownTrident(
      this,
      e.pos[0],
      e.pos[1] + e.eye() - 0.1,
      e.pos[2],
      i.map((t) => 2.5 * t),
      e,
      r,
    );
  ("creative" === this.mode && (n.noPickup = !0),
    this.entities.push(n),
    "creative" !== this.mode && (e.inv.slots[e.inv.sel] = null),
    Sound.ev("item.trident.throw", e.pos, 1, 1));
};
const SPEAR = {
    minR: 2,
    maxR: 4.5,
    minRC: 2,
    maxRC: 6.5,
    margin: 0.125,
    stab: 19,
    delay: 12,
    damageTicks: 225,
    minSpeed: 4.6,
    mult: 0.95,
    knockTicks: 135,
    knockSpeed: 5.1,
    forward: 0.38,
  },
  SPEAR_KW = {
    wooden: [15, 100, 200, 300, 0.7],
    stone: [14, 90, 180, 275, 0.82],
    copper: [13, 80, 165, 250, 0.82],
    iron: [12, 50, 135, 225, 0.95],
    golden: [14, 70, 170, 275, 0.7],
    diamond: [10, 60, 130, 200, 1.075],
    netherite: [8, 50, 110, 175, 1.2],
  },
  spearKW = (t) => {
    const e = SPEAR_KW[String(t).split("_")[0]] || SPEAR_KW.iron;
    return {
      delay: e[0],
      dismount: e[1],
      knock: e[2],
      damage: e[3],
      mult: e[4],
      forward: SPEAR.forward,
    };
  },
  prog = (t, e, s) => clamp((t - e) / (s - e), 0, 1),
  EASE = {
    inQuad: (t) => t * t,
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outCubic: (t) => 1 - (1 - t) ** 3,
    outQuart: (t) => 1 - (1 - t) ** 4,
    outCirc: (t) => Math.sqrt(1 - (t - 1) ** 2),
    inCirc: (t) => 1 - Math.sqrt(1 - t * t),
    outBack: (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
    inOutBack: (t) => {
      const e = 2.5949095;
      return t < 0.5
        ? ((2 * t) ** 2 * (2 * (e + 1) * t - e)) / 2
        : ((2 * t - 2) ** 2 * ((e + 1) * (2 * t - 2) + e) + 2) / 2;
    },
    inOutExpo: (t) =>
      t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2,
    inOutElastic: (t) => {
      const e = (2 * Math.PI) / 4.5;
      return t <= 0
        ? 0
        : t >= 1
          ? 1
          : t < 0.5
            ? (-(2 ** (20 * t - 10)) * Math.sin((20 * t - 11.125) * e)) / 2
            : (2 ** (-20 * t + 10) * Math.sin((20 * t - 11.125) * e)) / 2 + 1;
    },
  };
function spearUse(t, e) {
  const s = t.delay,
    i = t.dismount + s,
    r = t.knock + s,
    n = t.damage + s,
    a = Math.PI / 180,
    o = prog(e, 0, s),
    l = prog(e, i - 20, i),
    h = prog(e, n - 5, n),
    c = 2 * EASE.outCirc(l) - 2 * EASE.inCirc(h);
  return {
    raise: o,
    rs: prog(o, 0, 0.5),
    rm: prog(o, 0.5, 0.8),
    re: prog(o, 0.8, 1),
    sway: l,
    back: h,
    I: c,
    lower: EASE.outCubic(EASE.inOutElastic(prog(e - 20, r - 40, r))),
    slow: Math.sin(19 * e * a) * c,
    fast: Math.sin(30 * e * a) * c,
  };
}
const spearKick = (t) => 0.4 * (EASE.outQuart(prog(t, 1, 3)) - EASE.inOutSine(prog(t, 3, 10))),
  stabBeats = (t) => ({
    a: EASE.inOutSine(prog(t, 0, 0.05)),
    q: EASE.inQuad(prog(t, 0.05, 0.2)),
    b: EASE.outBack(prog(t, 0.05, 0.2)),
    c: EASE.inOutExpo(prog(t, 0.4, 1)),
  }),
  rotAround = (t, e, s, i, r, n) => {
    (M4.translate(t, i, r, n), e(t, s), M4.translate(t, -i, -r, -n));
  },
  attackTime = (t, e) =>
    t.swingT > 0 ? clamp(((t.swingDur || 6) - t.swingT + e) / (t.swingDur || 6), 0, 1) : 0;
Game.prototype.spearTargets = function () {
  const t = this.player,
    e = [t.pos[0], t.pos[1] + t.eye(), t.pos[2]],
    s = this.lookDir(),
    i = "creative" === this.mode,
    r = i ? SPEAR.minRC : SPEAR.minR,
    n = i ? SPEAR.maxRC : SPEAR.maxR,
    a = SPEAR.margin,
    o = this.raycast(e, s, n, !1),
    l = o ? Math.min(n, o.t) : n,
    h = [];
  for (const i of this.entities) {
    if (i.dead || (!(i instanceof Living) && !i.hittable) || i.deathTime > 0 || i === t.vehicle)
      continue;
    const n = i.box(),
      o = rayBox(e, s, n[0] - a, n[1] - a, n[2] - a, n[3] + a, n[4] + a, n[5] + a);
    o && o.t >= r && o.t <= l && h.push({ e: i, t: o.t });
  }
  return h.sort((t, e) => t.t - e.t);
};
const _spUpdateTarget = Game.prototype.updateTarget;
Game.prototype.updateTarget = function () {
  const t = _spUpdateTarget.call(this);
  if (isSpear(keyOfStack(this.player.inv.held))) {
    const t = this.spearTargets()[0];
    ((this.targetEntity = t && (!this.target || t.t < this.target.t) ? t.e : null),
      (this.targetPart = null));
  }
  return t;
};
const _spSwing = Player.prototype.swing;
((Player.prototype.swing = function () {
  if (((this.swingN = (this.swingN || 0) + 1), !isSpear(keyOfStack(this.inv && this.inv.held))))
    return ((this.swingDur = 6), (this.swingStab = !1), _spSwing.call(this));
  this.swingT <= SPEAR.stab / 2 &&
    ((this.swingT = SPEAR.stab), (this.swingDur = SPEAR.stab), (this.swingStab = !0));
}),
  (() => {
    const t = Player.prototype.swing;
    ((Player.prototype.swing = function (...e) {
      const s = this.swingT,
        i = t.apply(this, e);
      return (this.swingT !== s && (this.swingHand = this.offSwing ? "off" : "main"), i);
    }),
      (Player.prototype.swingOff = function () {
        this.offSwing = !0;
        try {
          this.swing();
        } finally {
          this.offSwing = !1;
        }
      }));
  })(),
  (Game.prototype.spearJab = function () {
    const t = this.player,
      e = t.inv.held,
      s = ITEMS[e.id];
    if (this.attackStrength(0.1) < 1) return !1;
    const i = this.spearTargets();
    Sound.ev("item.spear.attack", t.pos, 1, 1);
    let r = !1;
    for (const { e: n } of i) {
      const i = Math.max(0, (s.attack || 1) + effectAttackBonus(t)) + enchantAttackBonus(e, n),
        a = {
          type: "player",
          attacker: t,
          knockFrom: t.pos,
          knock: 0.4 + 0.5 * heldEnch(t, "knockback"),
          player: !0,
          looting: heldEnch(t, "looting"),
        };
      if (n.hurt(i, a)) {
        ((r = !0), Sound.ev("item.spear.hit", n.pos, 1, 1));
        const e = heldEnch(t, "fire_aspect");
        e && !n.fireproof && n instanceof Living && (n.fire = Math.max(n.fire || 0, 80 * e));
      }
    }
    const n = heldEnch(t, "lunge");
    if (n) {
      const e = this.lookDir();
      ((t.vel[0] += 0.458 * e[0] * n), (t.vel[2] += 0.458 * e[2] * n), t.exhaust(1.5 * n));
    }
    return (r && (this.damageHeld(1), t.exhaust(0.1)), (t.attackT = 0), t.swing(), !0);
  }),
  (Game.prototype.spearTick = function (t) {
    const e = this.player,
      s = spearKW(keyOfStack(t)),
      i = this.tickCount - (e.spearStart || 0) - s.delay;
    if (i < 0 || i > s.damage) return;
    const r = this.lookDir();
    for (const { e: n } of this.spearTargets()) {
      if (!(n instanceof Living) || (n.spearHitT || 0) > this.tickCount) continue;
      const mv = (t) =>
          t.prev ? [t.pos[0] - t.prev[0], t.pos[1] - t.prev[1], t.pos[2] - t.prev[2]] : [0, 0, 0],
        a = mv(e.vehicle || e),
        o = mv(n),
        l = 20 * ((a[0] - o[0]) * r[0] + (a[1] - o[1]) * r[1] + (a[2] - o[2]) * r[2]);
      if (l < SPEAR.minSpeed) continue;
      const h = i <= s.knock && l >= SPEAR.knockSpeed;
      if (
        ((n.spearHitT = this.tickCount + 10),
        (e.spearKickT = this.tickCount),
        n.hurt(s.mult * l + enchantAttackBonus(t, n), {
          type: "player",
          attacker: e,
          player: !0,
          knockFrom: e.pos,
          knock: h ? 0.9 : 0,
        }))
      ) {
        Sound.ev("item.spear.hit", n.pos, 1, 1);
        const e = enchLevel(t, "fire_aspect");
        (e && !n.fireproof && (n.fire = Math.max(n.fire || 0, 80 * e)), this.damageHeld(1));
      }
    }
  }));
const _attack = Game.prototype.attack;
((Game.prototype.attack = function (t) {
  const e = this.player,
    s = e.inv.held,
    i = keyOfStack(s);
  if (isSpear(i)) return void (this.spearJab() && (this.attackCd = 2));
  const r = "mace" === i && e.fallDist > 1.5 && !e.onGround && !e.gliding;
  if (r) {
    const t = e.fallDist;
    let i = t <= 3 ? 4 * t : t <= 8 ? 12 + 2 * (t - 3) : t - 8 + 22;
    ((i += 0.5 * enchLevel(s, "density") * t), (e.maceBonus = i));
  }
  if ((_attack.call(this, t), (e.maceBonus = 0), r)) {
    const i = e.fallDist;
    ((e.fallDist = 0), (e.vel[1] = Math.max(e.vel[1], 0.01)));
    const r = enchLevel(s, "wind_burst");
    r && (e.vel[1] = 0.7 + 0.35 * (r - 1));
    for (const e of this.entities)
      if (e !== t && e instanceof Living && !e.dead && e.distTo(t) < 3.5) {
        const s = e.pos[0] - t.pos[0],
          i = e.pos[2] - t.pos[2],
          r = Math.hypot(s, i) || 1,
          n = 0.7 * (3.5 - e.distTo(t));
        ((e.vel[0] += (s / r) * n), (e.vel[2] += (i / r) * n), (e.vel[1] += 0.2));
      }
    for (let e = 0; e < 30; e++)
      this.particles.spawn(
        "crit",
        t.pos[0] + 2 * (Math.random() - 0.5),
        t.pos[1] + 0.1,
        t.pos[2] + 2 * (Math.random() - 0.5),
        0.4 * (Math.random() - 0.5),
        0.2,
        0.4 * (Math.random() - 0.5),
      );
    Sound.ev(i > 5 ? "item.mace.smash_ground_heavy" : "item.mace.smash_ground", t.pos, 1, 1);
  }
}),
  (Player.prototype.blocking = function () {
    if (!this.usingItem || this.useT < 5) return null;
    const t = "off" === this.useHand ? this.inv.slots[OFF] : this.inv.held;
    return "shield" === keyOfStack(t) ? t : null;
  }));
const _playerHurt = Player.prototype.hurt;
Player.prototype.hurt = function (t, e) {
  const s = this.blocking(),
    i = e && e.type;
  if (
    s &&
    t > 0 &&
    i &&
    !["fall", "drown", "starve", "void", "fire", "lava", "magic", "cactus", "thorns"].includes(i) &&
    !this.creative
  ) {
    const r = e.knockFrom || (e.attacker && e.attacker.pos);
    if (r) {
      const n = this.game.lookDir(),
        a = [r[0] - this.pos[0], 0, r[2] - this.pos[2]],
        o = Math.hypot(a[0], a[2]) || 1;
      if ((a[0] * n[0] + a[2] * n[2]) / o > 0) {
        if (t >= 3 && "creative" !== this.game.mode) {
          const e = 1 + Math.floor(t);
          if (((s.dmg = (s.dmg || 0) + e), s.dmg >= ITEMS[s.id].durability)) {
            const t = "off" === this.useHand ? OFF : this.inv.sel;
            ((this.inv.slots[t] = null),
              (this.usingItem = null),
              Sound.ev("item.shield.break", this.pos, 1, 1));
          }
        }
        Sound.ev("item.shield.block", this.pos, 1, 0.8 + 0.4 * Math.random());
        const r = e.attacker;
        return (
          r &&
            r.vel &&
            "mob" === i &&
            ((r.vel[0] += (a[0] / o) * 0.5), (r.vel[2] += (a[2] / o) * 0.5)),
          !1
        );
      }
    }
  }
  return _playerHurt.call(this, t, e);
};
const _playerDie = Player.prototype.die;
((Player.prototype.die = function (t) {
  if (!t || "void" !== t.type) {
    const t = [this.inv.sel, OFF].find((t) => "totem_of_undying" === keyOfStack(this.inv.slots[t]));
    if (void 0 !== t) {
      ((this.inv.slots[t] = null),
        (this.health = 1),
        (this.deathTime = 0),
        (this.dead = !1),
        this.clearEffects(),
        this.addEffect("regeneration", 1, 900),
        this.addEffect("absorption", 1, 100),
        this.addEffect("fire_resistance", 0, 800));
      const e = this.game;
      for (let t = 0; t < 60; t++)
        e.particles.spawn(
          "crit",
          this.pos[0] + (Math.random() - 0.5),
          this.pos[1] + 2 * Math.random(),
          this.pos[2] + (Math.random() - 0.5),
          0.6 * (Math.random() - 0.5),
          0.6 * Math.random(),
          0.6 * (Math.random() - 0.5),
          { col: [Math.random() < 0.5 ? 255 : 120, 220, 60] },
        );
      return (
        Sound.ev("item.totem.use", this.pos, 1, 1),
        void (e.totemShow = { id: ITEM_KEY.totem_of_undying, t: performance.now() })
      );
    }
  }
  _playerDie.call(this, t);
}),
  (Player.prototype.canGlide = function () {
    const t = this.inv.slots[37];
    return (
      "elytra" === keyOfStack(t) &&
      (t.dmg || 0) < ITEMS[t.id].durability - 1 &&
      !this.onGround &&
      !this.inWater &&
      !this.inLava &&
      !this.flying &&
      !this.onLadder()
    );
  }),
  (Player.prototype.glideTravel = function () {
    const t = this.vel,
      e = this.game.lookDir(),
      s = -Math.asin(clamp(e[1], -1, 1)),
      i = Math.hypot(e[0], e[2]),
      r = Math.hypot(t[0], t[2]),
      n = this.hasEffect && this.hasEffect("slow_falling") && t[1] <= 0 ? 0.01 : 0.08,
      a = Math.cos(s) ** 2;
    if (((t[1] += n * (0.75 * a - 1)), t[1] < 0 && i > 0)) {
      const s = -0.1 * t[1] * a;
      ((t[0] += (e[0] * s) / i), (t[1] += s), (t[2] += (e[2] * s) / i));
    }
    if (s < 0 && i > 0) {
      const n = r * -Math.sin(s) * 0.04;
      ((t[0] -= (e[0] * n) / i), (t[1] += 3.2 * n), (t[2] -= (e[2] * n) / i));
    }
    if (
      (i > 0 && ((t[0] += 0.1 * ((e[0] / i) * r - t[0])), (t[2] += 0.1 * ((e[2] / i) * r - t[2]))),
      this.boostT > 0)
    ) {
      for (let s = 0; s < 3; s++) t[s] += 0.1 * e[s] + 0.5 * (1.5 * e[s] - t[s]);
      this.game.tickCount % 2 &&
        this.game.particles.spawn(
          "smoke",
          this.pos[0],
          this.pos[1],
          this.pos[2],
          0.3 * -t[0],
          0.3 * -t[1],
          0.3 * -t[2],
        );
    }
    ((t[0] *= 0.99), (t[1] *= 0.98), (t[2] *= 0.99));
    const o = Math.hypot(t[0], t[2]);
    if ((this.move(t[0], t[1], t[2]), this.collidedH)) {
      const t = 10 * (o - Math.hypot(this.vel[0], this.vel[2])) - 3;
      t > 0 && this.hurt(t, { type: "fly_into_wall" });
    }
    this.fallDist = this.vel[1] < -0.5 ? this.fallDist : 1;
    const l = this.inv.slots[37];
    (++this.glideT % 20 != 0 ||
      !l ||
      this.creative ||
      unbreakingSkips(l, !0) ||
      (l.dmg = (l.dmg || 0) + 1),
      (!this.onGround && this.canGlide()) || (this.gliding = !1));
  }));
const _travel = Player.prototype.travel;
Player.prototype.travel = function (t, e, s, i) {
  return this.gliding && this.canGlide()
    ? this.glideTravel()
    : ((this.gliding = !1), this.riptideT > 0 && this.riptideT--, _travel.call(this, t, e, s, i));
};
const _eqTick = Player.prototype.tick;
((Player.prototype.tick = function (t) {
  (_eqTick.call(this, t), this.boostT > 0 && this.boostT--);
}),
  (Game.prototype.tryGlide = function () {
    const t = this.player;
    return (
      !(t.gliding || t.flying || !(t.vel[1] < 0.2) || !t.canGlide()) &&
      ((t.gliding = !0),
      (t.glideT = 0),
      (t.glideFlip = /^(Dinnerbone|Grumm)$/.test(t.inv.slots[37].name || "")),
      this.net && this.net.send({ t: "glide" }),
      !0)
    );
  }));
const _drawHand = Game.prototype.drawHand;
((Game.prototype.isBEItem = function (t) {
  const e = t && ITEMS[t.id],
    s = e && void 0 !== e.block ? BLOCKS[e.block] : null;
  if (!s || !s.beRender || s.bed) return !1;
  const i = this.renderer.itemModel(t.id);
  return !(i && i.mesh);
}),
  (Game.prototype.drawHand = function (t, e) {
    const s = this.player,
      i = s.inv.held,
      r = keyOfStack(i),
      n = s.inv.slots[OFF];
    if (s.usingItem === ITEM_KEY.spyglass) return;
    const a =
      "shield" === r ||
      "trident" === r ||
      "crossbow" === r ||
      "spyglass" === r ||
      isSpear(r) ||
      this.isBEItem(i);
    (a
      ? this.renderer.fxOn || this.renderer.gl.clear(this.renderer.gl.DEPTH_BUFFER_BIT)
      : _drawHand.call(this, t, e),
      a && this.drawHandStack(i, !1, t, e),
      n && this.drawHandStack(n, !0, t, e));
  }));
const HAND_CAM = [0, 0, 0];
function spearArms(t, e, s, i) {
  const r = Math.PI / 180,
    n = e.sneaking && !e.flying ? -0.4 : 0;
  for (const [a, o, l] of [
    ["main", "rarm", 1],
    ["off", "larm", -1],
  ]) {
    const h = "main" === a ? e.inv.held : e.inv.slots[OFF];
    if (!isSpear(keyOfStack(h))) continue;
    const c = (t[o] = { ...t[o] });
    if (
      ((c.ry = clamp(-0.1 * l + (t.head.ry || 0), -60 * r, 60 * r)),
      (c.rx = clamp(Math.PI / 2 + t.head.rx - 0.8 + (i ? 0.9599311 : 0), -30 * r, 120 * r) + n),
      e.usingItem === h.id && e.useHand === a)
    ) {
      const t = spearUse(spearKW(keyOfStack(h)), e.useT + s);
      ((c.ry += -l * t.fast * r * t.I),
        (c.rz = (c.rz || 0) - l * t.slow * r * t.I * 0.5),
        (c.rx -=
          r *
          (-40 * t.rs + 30 * t.rm - 20 * t.re + 20 * t.lower + 10 * t.back + 0.6 * t.slow * t.I)));
    }
    if ("main" === a && e.swingStab && e.swingT > 0) {
      const t = stabBeats(attackTime(e, s));
      c.rx -= (90 * t.a - 120 * t.q + 30 * t.c) * r;
    }
  }
}
Game.prototype.drawHandStack = function (t, e, s, i) {
  const r = this.renderer,
    n = this.player,
    a = Math.PI / 180,
    o = Math.PI,
    l = e ? -1 : 1,
    h = r.mat();
  M4.perspective(h, 70 * a, r.canvas.width / r.canvas.height, 0.05, 10);
  const c = r.vp,
    d = r.camPos;
  ((r.vp = h), (r.camPos = HAND_CAM));
  const p = r.mat(),
    u = keyOfStack(t),
    f = ITEMS[t.id];
  if (this.settings.bobbing) {
    const t = lerp(n.prevBob, n.bob, s) * o * 0.6,
      e = lerp(n.prevBobAmt || 0, n.bobAmt, s);
    M4.translate(p, Math.sin(t) * e * 0.5, -Math.abs(Math.cos(t) * e), 0);
  }
  const m = e ? 0 : 1 - lerp(n.oHandH ?? 1, n.handH ?? 1, s),
    g = n.usingItem === t.id && ("off" === n.useHand) === e,
    y = ("off" === n.swingHand) === e && n.swingT > 0 ? clamp((6 - n.swingT + s) / 6, 0, 1) : 0,
    M = n.useT + s,
    armT = () => M4.translate(p, 0.56 * l, -0.52 - 0.6 * m, -0.72);
  if (isSpear(u))
    if (g) {
      M4.translate(p, 0.56 * l, -0.52, -0.72);
      const t = spearUse(spearKW(u), M);
      (M4.translate(
        p,
        l * (0.15 * t.raise - 0.05 * t.re - 0.1 * t.sway + 0.005 * t.slow),
        0.075 * -t.raise + 0.075 * t.rm + 0.01 * t.fast,
        0.05 * t.rs - 0.05 * t.re + 0.005 * t.slow,
      ),
        rotAround(
          p,
          M4.rotX,
          (-65 * EASE.inOutBack(t.raise) - 35 * t.lower + 100 * t.back - 0.5 * t.fast) * a,
          0,
          0.1,
          0,
        ),
        rotAround(
          p,
          M4.rotY,
          -l * (-90 * prog(t.raise, 0.5, 0.55) + 90 * t.sway + 2 * t.slow) * a,
          0.15 * l,
          0,
          0,
        ),
        M4.translate(p, 0, -spearKick(this.tickCount - (n.spearKickT ?? -1e9) + s), 0));
    } else {
      armT();
      const t = stabBeats(e ? 0 : attackTime(n, s));
      (M4.translate(p, 0.1 * l * (t.a - t.b), -0.075 * (t.a - t.c), 0.65 * (t.a - t.b)),
        M4.rotX(p, -70 * (t.a - t.c) * a),
        M4.translate(p, 0, 0, -0.25 * (t.c - t.b)));
    }
  else if (g && "trident" === u) {
    (armT(),
      M4.translate(p, -0.5 * l, 0.7, 0.1),
      M4.rotX(p, -55 * a),
      M4.rotY(p, 35.3 * l * a),
      M4.rotZ(p, -9.785 * l * a));
    const t = Math.min(1, M / 10);
    (t > 0.1 && M4.translate(p, 0, Math.sin(1.3 * (M - 0.1)) * (t - 0.1) * 0.004, 0),
      M4.translate(p, 0, 0, 0.2 * t),
      M4.scale(p, 1, 1, 1 + 0.2 * t),
      M4.rotY(p, 45 * -l * a));
  } else if (g && "crossbow" === u) {
    (armT(),
      M4.translate(p, -0.4785682 * l, -0.094387, 0.05731531),
      M4.rotX(p, -11.935 * a),
      M4.rotY(p, 65.3 * l * a),
      M4.rotZ(p, -9.785 * l * a));
    const e = Math.min(1, M / Math.max(1, crossbowCharge(t)));
    (e > 0.1 && M4.translate(p, 0, Math.sin(1.3 * (M - 0.1)) * (e - 0.1) * 0.004, 0),
      M4.translate(p, 0, 0, 0.04 * e),
      M4.scale(p, 1, 1, 1 + 0.2 * e),
      M4.rotY(p, 45 * -l * a));
  } else if (g && "shield" === u) armT();
  else if (g && "bow" === u) {
    (armT(),
      M4.translate(p, -0.2785682 * l, 0.18344387, 0.15731531),
      M4.rotX(p, -13.935 * a),
      M4.rotY(p, 35.3 * l * a),
      M4.rotZ(p, -9.785 * l * a));
    let t = M / 20;
    ((t = (t * t + 2 * t) / 3),
      t > 1 && (t = 1),
      t > 0.1 && M4.translate(p, 0, Math.sin(1.3 * (M - 0.1)) * (t - 0.1) * 0.004, 0),
      M4.translate(p, 0, 0, 0.04 * t),
      M4.scale(p, 1, 1, 1 + 0.2 * t),
      M4.rotY(p, 45 * -l * a));
  } else if (g && (f.food || /^(potion|milk_bucket|honey_bottle|ominous_bottle)$/.test(u))) {
    const t = "honey_bottle" === u ? 40 : 32,
      e = t - M + 1,
      s = e / t;
    s < 0.8 && M4.translate(p, 0, Math.abs(0.1 * Math.cos((e / 4) * o)), 0);
    const i = 1 - Math.pow(Math.max(0, s), 27);
    (M4.translate(p, l * i * 0.6, -0.5 * i, 0),
      M4.rotY(p, l * i * 90 * a),
      M4.rotX(p, 10 * i * a),
      M4.rotZ(p, l * i * 30 * a),
      armT());
  } else {
    const e = Math.sqrt(y);
    (M4.translate(p, -0.4 * l * Math.sin(e * o), 0.2 * Math.sin(e * o * 2), -0.2 * Math.sin(y * o)),
      armT());
    const s = Math.sin(y * y * o);
    (M4.rotY(p, l * (45 + -20 * s) * a),
      M4.rotZ(p, l * s * -20 * a * Math.sin(e * o)),
      M4.rotX(p, -80 * Math.sin(e * o) * a),
      M4.rotY(p, -45 * l * a),
      "crossbow" === u &&
        t.charged &&
        t.charged.length &&
        y < 0.001 &&
        (M4.translate(p, -0.641864 * l, 0, 0), M4.rotY(p, 10 * l * a)));
  }
  const k = n.lightAt(),
    w = { ...i, fogNear: 1e8, fogFar: 2e8 },
    _ = e ? "firstperson_lefthand" : "firstperson_righthand";
  if ((r.gl.disable(r.gl.CULL_FACE), "shield" === u || ("trident" === u && !f.tcTool))) {
    r.initEquipModels();
    const s = DISPLAY["shield" === u ? (g ? "shield_blocking" : "shield") : "trident"];
    (applyDisplay(p, s[_] || s.firstperson_righthand, e),
      M4.translate(p, -0.5, -0.5, -0.5),
      M4.scale(p, 1, 1, -1),
      r.drawModel(
        "shield" === u ? "eq_shield" : "eq_trident",
        "shield" === u
          ? "function" == typeof shieldTex
            ? shieldTex(r, t)
            : r.beTex("shield_base")
          : r.beTex("trident"),
        p,
        null,
        k,
        w,
        { vp: h, glint: glintOf(t) && "entity" },
      ));
  } else {
    const s = r.itemModel(t.id),
      i = void 0 !== f.block ? BLOCKS[f.block] : null,
      a = s
        ? s.gen || (!i && !s.mesh)
        : !i || f.flat || i.shape === SH_CROSS || i.shape === SH_TORCH || i.ladder || i.door,
      o = s && s.model && s.model.display;
    if (a) {
      const r = e && (f.tool || f.attack || f.handheld);
      (applyDisplay(
        p,
        (o && (o[_] || o.firstperson_righthand)) || {
          r: r ? [0, 90, -25] : [0, -90, 25],
          t: [1.13, 3.2, 1.13],
          s: [0.68, 0.68, 0.68],
        },
        e,
      ),
        M4.translate(p, -0.5, -0.5, 0));
      const a = itemStateTex(t, n);
      this.drawLayers(a ? [[T(a), null]] : this.itemLayers(t, f, s, i), p, w, k, glintOf(t));
    } else
      (applyDisplay(
        p,
        o
          ? o[_] || o.firstperson_righthand || { r: [0, 0, 0], t: [0, 0, 0], s: [1, 1, 1] }
          : { r: [0, e ? 225 : 45, 0], s: [0.4, 0.4, 0.4] },
        e,
      ),
        M4.translate(p, -0.5, -0.5, -0.5),
        s && s.mesh
          ? r.drawMesh(s.mesh, p, w, k, { glint: glintOf(t) && "item" })
          : this.isBEItem(t)
            ? (this.drawBEItem(i, p, k, w, h), r.gl.disable(r.gl.CULL_FACE))
            : r.drawMesh(this.blockMesh(f.block, i.facing ? 4 : 0), p, w, k, {
                glint: glintOf(t) && "item",
              }));
  }
  (r.gl.enable(r.gl.CULL_FACE), (r.vp = c), (r.camPos = d));
};
const _playerPose = Game.prototype.playerPose;
((Game.prototype.playerPose = function (t) {
  const e = _playerPose.call(this, t),
    s = this.player;
  if (s.gliding && !s.glideFlip)
    return (
      (e.rarm = { rx: 0, rz: 0.1 }),
      (e.larm = { rx: 0, rz: -0.1 }),
      (e.rleg = { rx: 0, rz: 0.05 }),
      (e.lleg = { rx: 0, rz: -0.05 }),
      (e.head.rx = Math.PI / 4),
      spearArms(e, s, t, !0),
      e
    );
  if ("swim" === s.pose) return (spearArms(e, s, t, !0), e);
  const i = s.usingItem ? ("off" === s.useHand ? s.inv.slots[OFF] : s.inv.held) : null,
    r = keyOfStack(i),
    n = "off" === s.useHand,
    a = n ? "larm" : "rarm",
    o = n ? -1 : 1,
    l = s.pitch;
  return (
    "shield" === r
      ? ((e[a].rx = 0.5 * e[a].rx + 0.9424779), (e[a].ry = (o * -Math.PI) / 6))
      : "trident" === r
        ? ((e[a].rx = 0.5 * e[a].rx + Math.PI), (e[a].ry = 0))
        : "crossbow" === r
          ? ((e.rarm.ry = -0.8),
            (e.rarm.rx = 0.97079635),
            (e.larm.rx = 0.97079635),
            (e.larm.ry = 0.85 * Math.min(1, s.useT / Math.max(1, crossbowCharge(i)))))
          : "crossbow" === keyOfStack(s.inv.held) && s.inv.held.charged && s.inv.held.charged.length
            ? ((e.rarm.ry = -0.3),
              (e.larm.ry = 0.6),
              (e.rarm.rx = Math.PI / 2 + l - 0.1),
              (e.larm.rx = 1.5 + l))
            : "bow" === r
              ? ((e.rarm.ry = -0.1),
                (e.larm.ry = 0.5),
                (e.rarm.rx = Math.PI / 2 + l),
                (e.larm.rx = Math.PI / 2 + l))
              : "spyglass" === r &&
                ((e[a].rx = -clamp(-l - 1.9198622 - (s.sneaking ? 0.2617994 : 0), -2.4, 3.3)),
                (e[a].ry = -0.2617994 * o)),
    !s.inv.slots[OFF] || (s.usingItem && n) || (e.larm.rx = (e.larm.rx || 0) + Math.PI / 10),
    spearArms(e, s, t, !1),
    e
  );
}),
  (Game.prototype.drawWings = function (t, e, s, i, r, n) {
    const a = t.inv ? t.inv.slots[37] : (t.armorItems || [])[1];
    if ("elytra" !== keyOfStack(a)) return;
    const o = this.renderer;
    o.initEquipModels();
    let l = 0.2617994,
      h = -0.2617994;
    if ((t.sneaking && ((l = 0.6981317), (h = -Math.PI / 4)), t.gliding)) {
      const e = t.vel,
        s = Math.hypot(e[0], e[1], e[2]) || 1,
        i = e[1] < 0 ? 1 - Math.pow(-e[1] / s, 1.5) : 1;
      ((l = 0.34906584 * i + (1 - i) * l), (h = (i * -Math.PI) / 2 + (1 - i) * h));
    }
    const c = o.gl,
      d = c.isEnabled(c.CULL_FACE);
    (c.disable(c.CULL_FACE),
      o.drawModel(
        "eq_elytra",
        o.beTex("elytra_wings"),
        e,
        { lw: { rx: -l, rz: h, zx: !0 }, rw: { rx: -l, rz: -h, zx: !0 } },
        s,
        i,
        { overlay: r, vp: n, glint: glintOf(a) && "armor" },
      ),
      d && c.enable(c.CULL_FACE));
  }));
const TP_DEFAULT = {
  generated: { r: [0, 0, 0], t: [0, 3, 1], s: [0.55, 0.55, 0.55] },
  handheld: { r: [0, -90, 55], t: [0, 4, 0.5], s: [0.85, 0.85, 0.85] },
  block: { r: [75, 45, 0], t: [0, 2.5, 0], s: [0.375, 0.375, 0.375] },
  handheld_left: { r: [0, 90, -55], t: [0, 4, 0.5], s: [0.85, 0.85, 0.85] },
};
function dynamicIconTex(t, e) {
  const s = keyOfStack(t),
    i = e && e.game;
  if (!i || !i.world || ("compass" !== s && "recovery_compass" !== s && "clock" !== s)) return null;
  const r = performance.now(),
    n = "overworld" !== i.dim;
  if ("clock" === s) {
    const t = n ? ((r / 1e3) * 0.37) % 1 : i.celestial();
    return "i_clock_" + String(Math.round(64 * t) % 64).padStart(2, "0");
  }
  const a =
    "compass" === s
      ? i.worldSpawn || e.spawn
      : i.lastDeath && i.lastDeath.dim === i.dim
        ? i.lastDeath.pos
        : null;
  let o;
  if (n || !a) o = ((r / 1e3) * 0.53) % 1;
  else {
    o =
      (((0.5 -
        ((((((180 - (180 * e.yaw) / Math.PI) / 360) % 1) + 1) % 1) -
          0.25 -
          Math.atan2(a[2] + 0.5 - e.pos[2], a[0] + 0.5 - e.pos[0]) / (2 * Math.PI))) %
        1) +
        1) %
      1;
  }
  return "i_" + s + "_" + String((16 + Math.round(32 * o)) % 32).padStart(2, "0");
}
((Game.prototype.heldAttach = function (t, e, s, i, r, n) {
  if (!s && !i) return null;
  const a = this.renderer.models[e];
  if (!a) return null;
  const pivot = (t) => {
      const e = a.parts.find((e) => e.name === t);
      return e ? Math.abs(e.pivot[0]) : null;
    },
    o = {},
    scoping = (e, s) =>
      e &&
      t.usingItem === e.id &&
      ("off" === t.useHand) === s &&
      "spyglass" === keyOfStack(e) &&
      !(t.swingT > 0);
  return (
    scoping(s, !1)
      ? (o.head = (t) => this.drawSpyglassAtEye(t, s, !1, r, n))
      : s &&
        null !== pivot("rarm") &&
        (o.rarm = (e) => this.drawHeldItem(e, s, !1, r, n, t, -(pivot("rarm") - 5) / 16)),
    scoping(i, !0)
      ? (o.head = (t) => this.drawSpyglassAtEye(t, i, !0, r, n))
      : i &&
        null !== pivot("larm") &&
        (o.larm = (e) => this.drawHeldItem(e, i, !0, r, n, t, (pivot("larm") - 5) / 16)),
    o
  );
}),
  (Game.prototype.drawSpyglassAtEye = function (t, e, s, i, r) {
    const n = this.renderer,
      a = n.itemModel(e.id),
      o = a && a.model && a.model.display && a.model.display.head;
    a &&
      a.mesh &&
      o &&
      (M4.rotZ(t, Math.PI),
      M4.translate(t, 0, -0.25, 0),
      M4.rotY(t, Math.PI),
      M4.scale(t, 0.625, -0.625, -0.625),
      M4.translate(t, (s ? -2.5 : 2.5) / 16, -0.0625, 0),
      applyDisplay(t, o, s),
      M4.translate(t, -0.5, -0.5, -0.5),
      n.drawMesh(a.mesh, t, r, i));
  }),
  (Game.prototype.drawHeldItem = function (t, e, s, i, r, n, a) {
    const o = this.renderer,
      l = keyOfStack(e),
      h = ITEMS[e.id];
    if (!h) return;
    const c = !!n.usingItem && n.usingItem === e.id && ("off" === n.useHand) === s;
    (null !== a && (M4.translate(t, a, 0, 0), M4.rotZ(t, Math.PI)),
      M4.rotX(t, -Math.PI / 2),
      M4.rotY(t, Math.PI),
      M4.translate(t, (s ? -1 : 1) / 16, 0.125, -0.625),
      isSpear(l) && this.spearInHand(t, e, s, n, c),
      self.preItemDisplay && self.preItemDisplay(this, t, e, s, n, "third"));
    const d = s ? "thirdperson_lefthand" : "thirdperson_righthand";
    if ("shield" === l || ("trident" === l && !h.tcTool)) {
      o.initEquipModels();
      const n =
        DISPLAY[
          "shield" === l ? (c ? "shield_blocking" : "shield") : c ? "trident_throwing" : "trident"
        ];
      return (
        applyDisplay(t, n[d] || n.thirdperson_righthand, s),
        M4.translate(t, -0.5, -0.5, -0.5),
        M4.scale(t, 1, 1, -1),
        void o.drawModel(
          "shield" === l ? "eq_shield" : "eq_trident",
          "shield" === l
            ? "function" == typeof shieldTex
              ? shieldTex(o, e)
              : o.beTex("shield_base")
            : o.beTex("trident"),
          t,
          null,
          i,
          r,
          { glint: glintOf(e) && "entity" },
        )
      );
    }
    const p = void 0 !== h.block ? BLOCKS[h.block] : null,
      u = o.itemModel(e.id),
      f = u
        ? u.gen || (!p && !u.mesh)
        : !p || h.flat || p.shape === SH_CROSS || p.shape === SH_TORCH || p.ladder || p.door,
      m = u && u.model && u.model.display;
    if (
      (applyDisplay(
        t,
        (m && (m[d] || m.thirdperson_righthand)) ||
          (f
            ? h.tool || h.attack || h.handheld
              ? s
                ? TP_DEFAULT.handheld_left
                : TP_DEFAULT.handheld
              : TP_DEFAULT.generated
            : TP_DEFAULT.block),
        s,
      ),
      f)
    ) {
      M4.translate(t, -0.5, -0.5, 0);
      const s = n === this.player ? itemStateTex(e, n) : null;
      this.drawLayers(s ? [[T(s), null]] : this.itemLayers(e, h, u, p), t, r, i, glintOf(e));
    } else
      (M4.translate(t, -0.5, -0.5, -0.5),
        u && u.mesh
          ? o.drawMesh(u.mesh, t, r, i, { glint: glintOf(e) && "item" })
          : this.isBEItem(e)
            ? this.drawBEItem(p, t, i, r)
            : o.drawMesh(this.blockMesh(h.block, p.facing ? 4 : 0), t, r, i, {
                glint: glintOf(e) && "item",
              }));
  }),
  (Game.prototype.spearInHand = function (t, e, s, i, r) {
    const n = this.frameA || 0,
      a = Math.PI / 180,
      o = spearKW(keyOfStack(e)),
      l = s ? -1 : 1,
      h = stabBeats(!s && i.swingStab ? attackTime(i, n) : 0);
    if (
      (h.q - h.c &&
        (rotAround(t, M4.rotX, -70 * (h.q - h.c) * a, 0, -0.125, 0.125),
        M4.translate(t, 0, o.forward * (h.q - h.c), 0)),
      !r)
    )
      return;
    const c = spearUse(o, (i.useT || 0) + n),
      d = 1 - EASE.outBack(1 - c.raise),
      p = i === this.player ? spearKick(this.tickCount - (i.spearKickT ?? -1e9) + n) : 0;
    (M4.translate(t, 0, 0.4 * -p, -o.forward * (d - c.back) + p),
      rotAround(t, M4.rotX, -(70 * (c.raise - c.back) - 40 * (h.q - h.c)) * a, 0, -0.03125, 0.125),
      rotAround(t, M4.rotY, 90 * l * (c.raise - c.sway + 3 * h.c + h.q) * a, 0, 0, 0.125));
  }));
const _equipDeath = Game.prototype.onPlayerDeath;
((Game.prototype.onPlayerDeath = function (t) {
  return (
    (this.lastDeath = { dim: this.dim, pos: this.player.pos.map(Math.floor) }),
    _equipDeath.call(this, t)
  );
}),
  (Game.prototype.withOffhand = function (t) {
    const e = this.player,
      s = e.inv,
      i = s.sel,
      r = s.slots[i];
    ((s.slots[i] = s.slots[OFF] || null),
      (s.slots[OFF] = r || null),
      "off" === e.useHand && (e.useHand = "main"),
      (e.offSwing = !0));
    try {
      return t();
    } finally {
      e.offSwing = !1;
      const t = s.slots[i];
      ((s.slots[i] = s.slots[OFF] || null),
        (s.slots[OFF] = t || null),
        e.usingItem && "main" === e.useHand && (e.useHand = "off"));
    }
  }),
  (Game.prototype.useHands = function () {
    const t = this.player,
      e = t.inv,
      sig = () => {
        const s = e.slots[e.sel],
          i = e.slots[OFF];
        return [
          t.usingItem,
          t.swingN,
          this.ui.screen,
          s,
          s && s.count,
          s && s.dmg,
          i,
          i && i.count,
          this.entities.length,
          t.boostT,
          t.vehicle,
        ];
      };
    t.useHand = "main";
    const s = sig(),
      i = s[3] && ITEMS[s[3].id];
    if ((this.use(), !e.slots[OFF] || sig().some((t, e) => t !== s[e]))) return;
    if (i && (void 0 !== i.block || i.places) && this.target && !this.targetEntity) return;
    const r = this.target;
    this.targetEntity && (this.target = null);
    try {
      this.withOffhand(() => this.use());
    } finally {
      this.target = r;
    }
  }));
//# sourceURL=js/equip.js
