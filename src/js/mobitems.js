"use strict";
const climateAt = (t, e, i) => {
    const o = biomeName(t, e, i);
    return /desert|badlands|savanna|jungle|mangrove|warm|nether|crimson|warped|basalt|soul/.test(o)
      ? "warm"
      : /snowy|frozen|ice|grove|jagged|peaks|taiga|cold|deep_dark/.test(o)
        ? "cold"
        : "temperate";
  },
  FARM_SKIN = {
    pig: (t) => ({
      layer: t.baby ? "pig_baby#main" : "cold" === t.cvar ? "cold_pig#main" : "pig#main",
      tex: "entity/pig/pig_" + t.cvar + (t.baby ? "_baby" : ""),
    }),
    cow: (t) => ({
      layer: t.baby
        ? "cold" === t.cvar
          ? "cold_cow_baby#main"
          : "warm" === t.cvar
            ? "warm_cow_baby#main"
            : "cow_baby#main"
        : "cold" === t.cvar
          ? "cold_cow#main"
          : "warm" === t.cvar
            ? "warm_cow#main"
            : "cow#main",
      tex: "entity/cow/cow_" + t.cvar + (t.baby ? "_baby" : ""),
    }),
    chicken: (t) => ({
      layer: t.baby
        ? "chicken_baby#main"
        : "cold" === t.cvar
          ? "cold_chicken#main"
          : "chicken#main",
      tex: "entity/chicken/chicken_" + t.cvar + (t.baby ? "_baby" : ""),
    }),
    sheep: (t) => ({
      layer: t.baby ? "sheep_baby#main" : "sheep#main",
      tex: "entity/sheep/sheep" + (t.baby ? "_baby" : ""),
    }),
  };
function farmAnim(t, e, i) {
  const o = t.parts,
    [s, a] = emLimbs(e, i);
  if ((emHead(o.head, e, i), "chicken" === e.type)) {
    (o.right_leg && (o.right_leg.xRot = 1.4 * Math.cos(0.6662 * s) * a),
      o.left_leg && (o.left_leg.xRot = 1.4 * Math.cos(0.6662 * s + Math.PI) * a));
    const t = e.onGround ? 0 : 0.8 * Math.sin(1.5 * (e.age + i)) + 0.8;
    return (o.right_wing && (o.right_wing.zRot = t), void (o.left_wing && (o.left_wing.zRot = -t)));
  }
  if ((emQuad(t, s, a), "sheep" === e.type && e.eatT > 0 && o.head)) {
    const t = Math.min(1, Math.min(e.eatT, 40 - e.eatT) / 4);
    ((o.head.y += 9 * t), (o.head.xRot = 0.8 * t + o.head.xRot * (1 - t)));
  }
}
function upsideDown(t, e) {
  ("Dinnerbone" !== t.customName && "Grumm" !== t.customName) ||
    (M4.translate(e, 0, t.h + 0.1, 0), M4.rotZ(e, Math.PI));
}
((() => {
  const t = Mob.prototype.saveData,
    e = Mob.prototype.loadData;
  ((Mob.prototype.saveData = function () {
    const e = t ? t.call(this) : {};
    return (
      (FARM_SKIN[this.type] || "strider" === this.type) &&
        ((e.cv = this.cvar), (e.sad = this.saddled), this.customName && (e.name = this.customName)),
      e
    );
  }),
    (Mob.prototype.loadData = function (t) {
      (e && e.call(this, t),
        t &&
          (FARM_SKIN[this.type] || "strider" === this.type) &&
          (t.cv && (this.cvar = t.cv),
          (this.saddled = !!t.sad),
          t.name && (this.customName = t.name)));
    }));
})(),
  (Game.prototype.drawFarmMob = function (t, e, i, o, s) {
    const a = this.renderer;
    t.cvar || (t.cvar = climateAt(this, t.pos[0], t.pos[2]));
    const r = FARM_SKIN[t.type](t),
      n = EM.get(a, r.layer),
      l = a.etex(r.tex);
    if (!n) return !1;
    if (!l) return !0;
    let h = M4.create();
    if (t.displayMatrix) h = M4.copy(t.displayMatrix);
    else {
      M4.translate(h, e[0], e[1], e[2]);
      const o =
        void 0 !== t.prevBodyYaw
          ? t.prevBodyYaw + angDelta(t.bodyYaw, t.prevBodyYaw) * i
          : t.bodyYaw;
      M4.rotY(h, o);
    }
    (t.deathTime > 0 && M4.rotZ(h, (Math.min(1, Math.sqrt((t.deathTime + i) / 20)) * Math.PI) / 2),
      upsideDown(t, h),
      EM.reset(n),
      farmAnim(n, t, i));
    const c = t.hurtTime > 0 || t.deathTime > 0 ? [1, 0, 0, 0.4] : null,
      d = [s[0], t.fire > 0 ? 1 : s[1]];
    if ((a.drawEM(n, l, h, d, o, { overlay: c }), "pig" === t.type && t.saddled && !t.baby)) {
      const t = EM.get(a, "pig#saddle");
      t &&
        (EM.reset(t),
        EM.copy(n, t),
        a.drawEM(t, a.etex("entity/equipment/pig_saddle/saddle"), h, d, o, { overlay: c }));
    }
    if ("sheep" === t.type && !t.sheared) {
      const e = EM.get(a, t.baby ? "sheep_baby#wool" : "sheep#wool");
      if (e) {
        (EM.reset(e), EM.copy(n, e));
        let s = WOOL_RGB[t.woolColor] || [1, 1, 1];
        if ("jeb_" === t.customName) {
          const e = (t.age + i) / 25,
            o = Math.floor(e) % 16,
            a = e % 1,
            r = dyeRGB(DYES[o]),
            n = dyeRGB(DYES[(o + 1) % 16]);
          s = [lerp(r[0], n[0], a), lerp(r[1], n[1], a), lerp(r[2], n[2], a)];
        }
        a.drawEM(e, a.etex("entity/sheep/sheep_wool" + (t.baby ? "_baby" : "")), h, d, o, {
          overlay: c,
          tint: s,
        });
      }
    }
    if (
      (t.customName && this.drawNameTag && this.drawNameTag(t, e, t.customName),
      0 === t.deathTime && !t.displayMatrix)
    ) {
      const i = Math.floor(e[0]),
        o = Math.floor(e[2]);
      let s = Math.floor(e[1] + 0.01);
      for (
        let t = 0;
        t < 4 &&
        s > 0 &&
        !SOLIDCUBE[this.world.getBlock(i, s - 1, o)] &&
        !BLOCKS[this.world.getBlock(i, s - 1, o)].solid;
        t++
      )
        s--;
      const r = e[1] - s;
      r < 3 && a.drawShadow(e[0], s, e[2], 0.75 * t.w * (1 - r / 6), 0.55 * (1 - r / 3));
    }
    return !0;
  }));
const BABY_HUMANOID = {
  zombie: { layer: "zombie_baby#main", tex: () => "entity/zombie/zombie_baby", zombie: !0 },
  zombie_villager: {
    layer: "zombie_villager_baby#main",
    tex: (t) => [
      "entity/zombie_villager/zombie_villager_baby",
      "entity/zombie_villager/baby/" + (t.vtype || "plains"),
    ],
    zombie: !0,
  },
  zombified_piglin: {
    layer: "zombified_piglin_baby#main",
    tex: () => "entity/piglin/zombified_piglin_baby",
    zombie: !0,
  },
  piglin: { layer: "piglin_baby#main", tex: () => "entity/piglin/piglin_baby" },
};
((Game.prototype.drawBabyHumanoid = function (t, e, i, o, s) {
  const a = this.renderer,
    r = BABY_HUMANOID[t.type],
    n = EM.get(a, r.layer);
  if (!n || t.invisible || (t.hasEffect && t.hasEffect("invisibility"))) return !1;
  const l = r.tex(t),
    h = "string" == typeof l ? a.etex(l) : a.etexMix(l);
  if (!h) return !0;
  let c = M4.create();
  if (t.displayMatrix) c = M4.copy(t.displayMatrix);
  else {
    M4.translate(c, e[0], e[1], e[2]);
    const o =
      void 0 !== t.prevBodyYaw ? t.prevBodyYaw + angDelta(t.bodyYaw, t.prevBodyYaw) * i : t.bodyYaw;
    M4.rotY(c, o);
  }
  (t.deathTime > 0 && M4.rotZ(c, (Math.min(1, Math.sqrt((t.deathTime + i) / 20)) * Math.PI) / 2),
    upsideDown(t, c),
    EM.reset(n),
    emHumanoid(n, t, i, { zombie: r.zombie }));
  const d = "piglin" === t.type && t.admire > 0,
    p = n.parts;
  d &&
    p.head &&
    p.left_arm &&
    ((p.head.xRot = 0.5), (p.head.yRot = 0), (p.left_arm.yRot = 0.5), (p.left_arm.xRot = -0.9));
  const m = t.hurtTime > 0 || t.deathTime > 0 ? [1, 0, 0, 0.4] : null,
    u = [s[0], t.fire > 0 ? 1 : s[1]],
    y =
      null != t.heldId
        ? t.heldId
        : "zombified_piglin" === t.type
          ? item("golden_sword")
          : ("piglin" === t.type && t.holding) || null,
    b = null != y ? { id: y, count: 1, dmg: 0 } : null,
    f = b
      ? d
        ? { left_arm: (e) => this.drawHeldItem(e, b, !0, u, o, t, null) }
        : { right_arm: (e) => this.drawHeldItem(e, b, !1, u, o, t, null) }
      : null;
  if (
    (a.drawEM(n, h, c, u, o, { overlay: m, attach: f }),
    t.armorItems &&
      t.armorItems.some((t) => t) &&
      drawVArmor(this, a, { layerKey: () => r.layer, armorItems: t.armorItems }, n, c, u, o, m),
    0 === t.deathTime && !t.displayMatrix)
  ) {
    const i = Math.floor(e[0]),
      o = Math.floor(e[2]);
    let s = Math.floor(e[1] + 0.01);
    for (
      let t = 0;
      t < 4 &&
      s > 0 &&
      !SOLIDCUBE[this.world.getBlock(i, s - 1, o)] &&
      !BLOCKS[this.world.getBlock(i, s - 1, o)].solid;
      t++
    )
      s--;
    const r = e[1] - s;
    r < 3 && a.drawShadow(e[0], s, e[2], 0.75 * t.w * (1 - r / 6), 0.55 * (1 - r / 3));
  }
  return !0;
}),
  (() => {
    const t = Game.prototype.drawMob;
    Game.prototype.drawMob = function (e, i, o, s, a) {
      if (
        (e.vm || !FARM_SKIN[e.type] || e === this.player || !this.drawFarmMob(e, i, o, s, a)) &&
        (e.vm ||
          !e.baby ||
          !BABY_HUMANOID[e.type] ||
          e === this.player ||
          !this.drawBabyHumanoid(e, i, o, s, a))
      )
        return t.call(this, e, i, o, s, a);
    };
    VMob.prototype.preDraw;
    const e = Game.prototype.drawVMob;
    Game.prototype.drawVMob = function (t, i, o, s, a) {
      if ("Dinnerbone" === t.customName || "Grumm" === t.customName) {
        const r = t.preDraw;
        return (
          (t.preDraw = function (t, e) {
            (upsideDown(this, t), r && r.call(this, t, e));
          }),
          e.call(this, t, i, o, s, a),
          void (r ? (t.preDraw = r) : delete t.preDraw)
        );
      }
      return e.call(this, t, i, o, s, a);
    };
  })());
const STICK_FOR = { pig: "carrot_on_a_stick", strider: "warped_fungus_on_a_stick" };
function nameTagUse(t, e, i) {
  return (
    !(!i || "name_tag" !== keyOfStack(i) || !i.name || t === e) &&
    ((t.customName = i.name), (t.persistent = !0), useOne(t.game, e), !0)
  );
}
((() => {
  const t = Mob.prototype.interact;
  ((Mob.prototype.interact = function (e, i) {
    if (t && t.call(this, e, i)) return !0;
    const o = this.game,
      s = keyOfStack(i);
    if (STICK_FOR[this.type] && !this.baby) {
      if ("saddle" === s && !this.saddled)
        return (
          (this.saddled = !0),
          useOne(o, e),
          Sound.ev("entity." + this.type + ".saddle", this.pos, 0.5, 1),
          !0
        );
      if (
        this.saddled &&
        !e.vehicle &&
        !e.sneaking &&
        (!i || !ITEMS[i.id] || !ITEMS[i.id].spawnEgg)
      )
        return (e.mount(this), !0);
    }
    return nameTagUse(this, e, i) || leadUse(this, e, i);
  }),
    (Mob.prototype.seat = function () {
      return [
        this.pos[0],
        this.pos[1] + this.h * ("strider" === this.type ? 1 : 0.62),
        this.pos[2],
      ];
    }));
  const e = Mob.prototype.tick;
  Mob.prototype.tick = function () {
    if (!this.rider || this.vm || !STICK_FOR[this.type])
      return (e.call(this), void (this.leashHolder && this.leashTick()));
    if ((this.savePrev(), this.baseTick(), this.deathTick())) return;
    const t = this.rider,
      i = t.inv.held,
      o = !!i && keyOfStack(i) === STICK_FOR[this.type];
    this.boostT > 0 && this.boostT--;
    let s = 0;
    (o && ((this.yaw = t.yaw), (s = 1)), (this.bodyYaw += 0.5 * angDelta(this.yaw, this.bodyYaw)));
    const a =
      ("pig" === this.type ? 0.225 : this.inLava ? 0.35 : 0.2) *
      (1 + (this.boostT > 0 ? 1.15 * Math.sin((this.boostT / 140) * Math.PI) : 0));
    if (
      (this.collidedH && this.onGround && s && (this.vel[1] = 0.42),
      "strider" === this.type && this.inLava && (this.vel[1] = Math.max(this.vel[1], 0.05)),
      this.travel(s, 0, a * a * 1.5, !1),
      "strider" === this.type && this.inLava)
    ) {
      this.vel[1] = 0;
      const t = Math.floor(this.pos[1]);
      this.world.getBlock(Math.floor(this.pos[0]), t + 1, Math.floor(this.pos[2])) === LAVA &&
        (this.pos[1] += 0.1);
    }
    (t.followVehicle(this), this.animate());
  };
})(),
  (() => {
    "function" == typeof useEquipment && useEquipment;
    const t = Game.prototype.use;
    Game.prototype.use = function () {
      const e = this.player,
        i = e.vehicle,
        o = e.inv.held;
      return !(i && o && ITEMS[o.id] && STICK_FOR[i.type] === ITEMS[o.id].key) ||
        i.vm ||
        i.boostT > 0
        ? t.call(this)
        : ((i.boostT = 140 + (randInt(0, 700) % 140)),
          this.damageHeld("creative" === this.mode ? 0 : "pig" === i.type ? 7 : 1),
          e.swing(),
          o.dmg >= (ITEMS[o.id].durability || 1e9) &&
            (e.inv.slots[e.inv.sel] = makeStack("fishing_rod", 1)),
          void (this.useCd = 10));
    };
  })(),
  (() => {
    const t = VMob.prototype.interact;
    VMob.prototype.interact = function (e, i) {
      return !!nameTagUse(this, e, i) || !!leadUse(this, e, i) || t.call(this, e, i);
    };
  })(),
  (Game.prototype.drawNameTag = function (t, e, i, o = {}) {
    const s = this.renderer,
      a = s.gl;
    if (!this.player || t.distTo(this.player) > (o.max || 32)) return;
    ("undefined" != typeof Cosmetics && (i = Cosmetics.tagName(this, t, i)),
      s.nameTex || (s.nameTex = new Map()));
    const r = o.color || "#FFFFFF",
      n = i + "|" + r;
    let l = s.nameTex.get(n);
    if (!l) {
      const t = Font.width(i) + 2,
        mk = (e, o) => {
          const a = document.createElement("canvas");
          ((a.width = 2 * t), (a.height = 20));
          const n = a.getContext("2d");
          return (
            e && ((n.fillStyle = "rgba(0,0,0,0.25)"), n.fillRect(0, 0, a.width, a.height)),
            n.scale(2, 2),
            (n.globalAlpha = o),
            Font.draw(n, i, 1, 1, r, !1),
            s.tex2D(a, !1)
          );
        };
      if (
        ((l = { tex: mk(!0, 1), faint: mk(!0, 32 / 255), text: mk(!1, 1), w: t, h: 10 }),
        s.nameTex.set(n, l),
        s.nameTex.size > 200)
      ) {
        const t = s.nameTex.keys().next().value,
          e = s.nameTex.get(t);
        for (const t of [e.tex, e.faint, e.text]) a.deleteTexture(t);
        s.nameTex.delete(t);
      }
    }
    const h = s.progTex,
      c = s.camPos,
      d =
        e[1] +
        (o.h ?? t.h * (t.renderScale ? t.renderScale(1) / ((t.D && t.D.scale) || 1) : 1)) +
        0.5,
      p = c[0] - e[0],
      m = c[2] - e[2],
      u = Math.atan2(p, m),
      y = c[1] - d,
      b = Math.atan2(y, Math.hypot(p, m)),
      f = M4.create();
    (M4.translate(f, e[0], d, e[2]),
      M4.rotY(f, u),
      M4.rotX(f, -b),
      M4.rotX(f, Math.PI / 2),
      M4.scale(f, (0.025 * l.w) / 2, 1, (0.025 * l.h) / 2),
      a.useProgram(h.p),
      a.uniformMatrix4fv(h.u.u_vp, !1, s.vp),
      a.uniformMatrix4fv(h.u.u_model, !1, f),
      a.uniform4f(h.u.u_color, 1, 1, 1, 1),
      a.enable(a.BLEND),
      a.blendFunc(a.SRC_ALPHA, a.ONE_MINUS_SRC_ALPHA),
      a.disable(a.CULL_FACE),
      a.activeTexture(a.TEXTURE0),
      a.bindVertexArray(s.quadVao));
    const quad = (t) => {
        (a.bindTexture(a.TEXTURE_2D, t), a.drawElements(a.TRIANGLES, 6, a.UNSIGNED_INT, 0));
      },
      cut = () => {
        if (void 0 === s.progTexCut)
          try {
            s.progTexCut = compile(
              a,
              TEX_VS,
              TEX_FS.replace("o = t * u_color;", "if (t.a < 0.1) discard; o = t * u_color;"),
            );
          } catch (t) {
            s.progTexCut = null;
          }
        const t = s.progTexCut;
        return (
          t &&
            (a.useProgram(t.p),
            a.uniformMatrix4fv(t.u.u_vp, !1, s.vp),
            a.uniformMatrix4fv(t.u.u_model, !1, f),
            a.uniform4f(t.u.u_color, 1, 1, 1, 1)),
          !!t
        );
      };
    (o.through
      ? (a.disable(a.DEPTH_TEST),
        a.depthMask(!1),
        quad(l.faint),
        a.enable(a.DEPTH_TEST),
        cut() && a.depthMask(!0),
        quad(l.text))
      : o.faded
        ? (a.depthMask(!0), quad(l.faint))
        : (a.depthMask(!1),
          quad(l.tex),
          cut() &&
            (a.colorMask(!1, !1, !1, !1),
            a.depthMask(!0),
            quad(l.text),
            a.colorMask(!0, !0, !0, !0))),
      a.depthMask(!0),
      a.disable(a.BLEND),
      a.enable(a.CULL_FACE));
  }),
  (() => {
    const t = Game.prototype.drawMob;
    Game.prototype.drawMob = function (e, i, o, s, a) {
      const r = t.call(this, e, i, o, s, a);
      return (
        e.vm ||
          !e.customName ||
          FARM_SKIN[e.type] ||
          e === this.player ||
          this.drawNameTag(e, i, e.customName),
        r
      );
    };
  })());
const LEASHABLE = (t) =>
  t instanceof Mob &&
  !(t.T.hostile && !["zoglin", "hoglin"].includes(t.type)) &&
  !["villager", "wandering_trader", "bat", "ender_dragon", "wither", "warden", "shulker"].includes(
    t.type,
  );
function leadUse(t, e, i) {
  const o = t.game;
  return t.leashHolder === e
    ? ((t.leashHolder = null),
      "creative" !== o.mode && o.dropItem(t.pos[0], t.pos[1] + 0.5, t.pos[2], makeStack("lead", 1)),
      Sound.ev("item.lead.untied", t.pos, 1, 1),
      !0)
    : !(!i || "lead" !== keyOfStack(i) || !LEASHABLE(t) || t.leashHolder) &&
        ((t.leashHolder = e), useOne(o, e), Sound.ev("item.lead.tied", t.pos, 1, 1), !0);
}
((Mob.prototype.leashTick = function () {
  const t = this.leashHolder;
  if (!t) return;
  if (t.dead || (t.deathTime && t.deathTime > 0)) return void (this.leashHolder = null);
  const e = this.distTo(t);
  if (e > 10)
    return (
      (this.leashHolder = null),
      this.game.dropItem(this.pos[0], this.pos[1] + 0.5, this.pos[2], makeStack("lead", 1)),
      void Sound.ev("item.lead.break", this.pos, 1, 1)
    );
  if (e > 6) {
    const i = 0.05 * (e - 6),
      o = t.pos[0] - this.pos[0],
      s = t.pos[1] - this.pos[1],
      a = t.pos[2] - this.pos[2];
    ((this.vel[0] += (o / e) * i),
      (this.vel[1] += Math.max(0, (s / e) * i)),
      (this.vel[2] += (a / e) * i));
  }
  e > 4 && this.vm && !this.rider && (this.goal = [t.pos[0], t.pos[1], t.pos[2]]);
}),
  (VMob.prototype.leashTick = Mob.prototype.leashTick));
class LeashKnot extends Entity {
  constructor(t, e, i, o) {
    (super(t, e + 0.5, i + 0.375, o + 0.5, 0.375, 0.5),
      (this.post = [e, i, o]),
      (this.isVehicle = !1),
      (this.knot = !0));
  }
  tick() {
    (this.savePrev(), this.age++);
    const [t, e, i] = this.post;
    if (
      !/fence$|_wall$/.test(BLOCKS[this.world.getBlock(t, e, i)].key) ||
      (this.age % 20 == 0 && !this.game.entities.some((t) => t.leashHolder === this))
    ) {
      for (const t of this.game.entities)
        t.leashHolder === this &&
          ((t.leashHolder = null),
          this.game.dropItem(t.pos[0], t.pos[1], t.pos[2], makeStack("lead", 1)));
      ((this.dead = !0), Sound.ev("entity.leash_knot.break", this.pos, 1, 1));
    }
  }
  saveData() {
    return { post: this.post };
  }
  loadData(t) {
    t &&
      t.post &&
      ((this.post = t.post), (this.pos = [t.post[0] + 0.5, t.post[1] + 0.375, t.post[2] + 0.5]));
  }
  drawSelf(t, e, i, o, s) {
    const a = t.renderer,
      r = EM.get(a, "leash_knot#main"),
      n = a.etex("entity/lead_knot/lead_knot");
    if (!r || !n) return;
    EM.reset(r);
    const l = M4.create();
    (M4.translate(l, e[0], e[1] - 1.501, e[2]), a.drawEM(r, n, l, s, o, {}));
  }
}
((() => {
  const t = Game.prototype.use;
  Game.prototype.use = function () {
    const e = this.player,
      i = this.target;
    if (i && !this.targetEntity && /fence$/.test(BLOCKS[i.id].key) && !e.sneaking) {
      const t = this.entities.filter((t) => t.leashHolder === e),
        [o, s, a] = i.pos;
      let r = this.entities.find(
        (t) => t instanceof LeashKnot && t.post[0] === o && t.post[1] === s && t.post[2] === a,
      );
      if (t.length) {
        r || ((r = new LeashKnot(this, o, s, a)), this.entities.push(r));
        for (const e of t) e.leashHolder = r;
        return (Sound.ev("entity.leash_knot.place", r.pos, 1, 1), void e.swing());
      }
      if (r && this.entities.some((t) => t.leashHolder === r)) {
        for (const t of this.entities) t.leashHolder === r && (t.leashHolder = e);
        return ((r.dead = !0), void e.swing());
      }
      e.inv.held && keyOfStack(e.inv.held);
    }
    return t.call(this);
  };
})(),
  (Renderer.prototype.drawRibbon = function (t, e, i) {
    const o = this.gl,
      s = this.progCol,
      a = [],
      r = this.camPos;
    for (let o = 0; o < t.length; o++) {
      const s = t[o],
        n = t[Math.min(t.length - 1, o + 1)],
        l = t[Math.max(0, o - 1)],
        h = n[0] - l[0],
        c = n[1] - l[1],
        d = n[2] - l[2],
        p = r[0] - s[0],
        m = r[1] - s[1],
        u = r[2] - s[2];
      let y = c * u - d * m,
        b = d * p - h * u,
        f = h * m - c * p;
      const _ = Math.hypot(y, b, f) || 1;
      ((y *= e / _), (b *= e / _), (f *= e / _));
      const M = i(o / (t.length - 1));
      a.push(s[0] - y, s[1] - b, s[2] - f, ...M, s[0] + y, s[1] + b, s[2] + f, ...M);
    }
    (o.useProgram(s.p),
      o.uniformMatrix4fv(s.u.u_vp, !1, this.vp),
      o.uniformMatrix4fv(s.u.u_model, !1, this.identity),
      o.uniform4fv(s.u.u_color, [1, 1, 1, 1]),
      o.uniform3fv(s.u.u_cam, this.camPos),
      o.uniform2f(s.u.u_fog, 1e9, 2e9),
      o.uniform1f(s.u.u_psize, 1),
      o.bindVertexArray(this.lineVao),
      o.bindBuffer(o.ARRAY_BUFFER, this.lineBuf),
      o.bufferData(o.ARRAY_BUFFER, new Float32Array(a), o.DYNAMIC_DRAW),
      o.enableVertexAttribArray(0),
      o.vertexAttribPointer(0, 3, o.FLOAT, !1, 28, 0),
      o.enableVertexAttribArray(1),
      o.vertexAttribPointer(1, 4, o.FLOAT, !1, 28, 12),
      o.disable(o.CULL_FACE),
      o.drawArrays(o.TRIANGLE_STRIP, 0, a.length / 7),
      o.enable(o.CULL_FACE));
  }),
  (() => {
    const t = Game.prototype.drawEntities;
    Game.prototype.drawEntities = function (e, i) {
      const o = t.call(this, e, i);
      for (const t of this.entities) {
        const o = t.leashHolder;
        if (!o || t.dead) continue;
        const s = t.ipos(e),
          a = o.ipos ? o.ipos(e) : o.pos;
        let r = a[0],
          n = a[1] + (o instanceof LeashKnot ? 0.25 : 0.7 * o.h),
          l = a[2];
        if (o === this.player) {
          const t = o.yaw;
          ((r +=
            0.35 * -Math.cos(t) * (this.perspective ? 1 : 0.6) -
            Math.sin(t) * (this.perspective ? 0.1 : 0.4)),
            (l +=
              0.35 * Math.sin(t) * (this.perspective ? 1 : 0.6) -
              Math.cos(t) * (this.perspective ? 0.1 : 0.4)),
            (n = a[1] + (this.perspective ? 1 : 1.3)));
        }
        const h = s[0] - Math.sin(t.bodyYaw) * t.w * 0.4,
          c = s[1] + 0.7 * t.h,
          d = s[2] - Math.cos(t.bodyYaw) * t.w * 0.4,
          p = [],
          m = 24;
        for (let t = 0; t <= m; t++) {
          const e = t / m;
          p.push([
            lerp(r, h, e),
            lerp(n, c, e) -
              0.25 * Math.sin(e * Math.PI) * Math.min(1, Math.hypot(r - h, l - d) / 4),
            lerp(l, d, e),
          ]);
        }
        const u = t.lightAt(),
          y = Math.max(0.15, Math.max(u[0], u[1] * i.day));
        this.renderer.drawRibbon(p, 0.025, (t) => {
          const e = Math.floor(24 * t) % 2 ? 0.7 : 1;
          return [0.5 * y * e, 0.4 * y * e, 0.3 * y * e, 1];
        });
      }
      return o;
    };
  })());
const MOB_BUCKET = {
  cod_bucket: "cod",
  salmon_bucket: "salmon",
  pufferfish_bucket: "pufferfish",
  tropical_fish_bucket: "tropical_fish",
  axolotl_bucket: "axolotl",
  tadpole_bucket: "tadpole",
  sulfur_cube_bucket: "sulfur_cube",
};
((() => {
  const t = Game.prototype.use;
  Game.prototype.use = function () {
    const e = this.player,
      i = this.world,
      o = e.inv.held,
      s = this.target,
      a = o && ITEMS[o.id] && ITEMS[o.id].key;
    if (a && MOB_BUCKET[a] && s && !this.targetEntity) {
      const t = DIRS[s.face],
        r = BLOCKS[s.id].replaceable || IS_FLUID[s.id],
        [n, l, h] = r ? s.pos : [s.pos[0] + t[0], s.pos[1] + t[1], s.pos[2] + t[2]],
        c = i.getBlock(n, l, h);
      if (c && !IS_FLUID[c] && !BLOCKS[c].replaceable) return;
      const d = "sulfur_cube_bucket" !== a;
      if (d && "nether" === this.dim)
        return (
          Sound.fizz([n, l, h]),
          "creative" !== this.mode && (e.inv.slots[e.inv.sel] = makeStack("bucket")),
          void e.swing()
        );
      d && i.setBlock(n, l, h, WATER, 0);
      const p = createMob(this, MOB_BUCKET[a], n + 0.5, l + (d ? 0.2 : 0), h + 0.5);
      ((p.persistent = !0), (p.fromBucket = !0));
      const m = o.mob || {};
      return (
        m.sz && void 0 !== p.size && (p.size = m.sz),
        m.v && p instanceof TropicalFish && ([p.shape, p.pattern, p.base, p.pcol] = m.v),
        void 0 !== m.var && (p.variant = m.var),
        m.baby && (p.makeBaby(), (p.growT = m.baby)),
        m.grow && (p.grow = m.grow),
        void 0 !== m.blk && (p.block = m.blk),
        o.name && (p.customName = o.name),
        this.entities.push(p),
        Sound.ev(
          "axolotl_bucket" === a
            ? "item.bucket.empty_axolotl"
            : "tadpole_bucket" === a
              ? "item.bucket.empty_tadpole"
              : "sulfur_cube_bucket" === a
                ? "item.bucket.empty_sulfur_cube"
                : "item.bucket.empty_fish",
          [n, l, h],
          1,
          1,
        ),
        "creative" !== this.mode && (e.inv.slots[e.inv.sel] = makeStack("bucket")),
        e.swing(),
        void this.flushMesh()
      );
    }
    if ("powder_snow_bucket" === a && s && !this.targetEntity && void 0 !== BID.powder_snow) {
      const t = DIRS[s.face],
        [o, a, r] = BLOCKS[s.id].replaceable
          ? s.pos
          : [s.pos[0] + t[0], s.pos[1] + t[1], s.pos[2] + t[2]],
        n = i.getBlock(o, a, r);
      if (n && !BLOCKS[n].replaceable) return;
      return (
        i.setBlock(o, a, r, BID.powder_snow, 0),
        Sound.ev("item.bucket.empty_powder_snow", [o, a, r], 1, 1),
        "creative" !== this.mode && (e.inv.slots[e.inv.sel] = makeStack("bucket")),
        e.swing(),
        void this.flushMesh()
      );
    }
    return "bucket" === a && s && !this.targetEntity && "powder_snow" === BLOCKS[s.id].key
      ? (i.setBlock(...s.pos, 0, 0),
        Sound.ev("item.bucket.fill_powder_snow", s.pos, 1, 1),
        swapHeld(this, e, "powder_snow_bucket"),
        e.swing(),
        void this.flushMesh())
      : t.call(this);
  };
})(),
  (() => {
    const t = /^leather_(helmet|chestplate|leggings|boots|horse_armor)$/,
      isImmune = (e) => !!(e && ITEMS[e.id] && t.test(ITEMS[e.id].key)),
      e = Living.prototype.baseTick;
    Living.prototype.baseTick = function () {
      if ((e.call(this), void 0 === BID.powder_snow)) return;
      const t = Math.floor(this.pos[0]),
        i = Math.floor(this.pos[2]),
        o =
          !this.noClip &&
          (this.world.getBlock(t, Math.floor(this.pos[1] + 0.1), i) === BID.powder_snow ||
            this.world.getBlock(t, Math.floor(this.pos[1] + 0.8 * this.h), i) === BID.powder_snow);
      if (!(o || this.frozenT > 0)) return;
      const s =
        this.spectator ||
        /^(stray|polar_bear|snow_golem|wither|skeleton)$/.test(this.type) ||
        ((t) => {
          const e = t.inv ? t.inv.slots : t.armorItems,
            i = t.inv ? 36 : 0;
          if (e) for (let t = i; t < i + 4; t++) if (isImmune(e[t])) return !0;
          return isImmune(t.armorItem);
        })(this);
      (o &&
        ((this.vel[0] *= 0.9),
        (this.vel[2] *= 0.9),
        this.vel[1] < -0.05 && (this.vel[1] = -0.05),
        (this.fallDist = 0),
        s || (this.frozenT = Math.min(140, (this.frozenT || 0) + 1)),
        this.jumpHeld && (this.vel[1] = 0.1)),
        (!o || s) && this.frozenT > 0 && (this.frozenT = Math.max(0, this.frozenT - 2)),
        !s &&
          this.frozenT >= 140 &&
          this.age % 40 == 0 &&
          this.hurt(
            "blaze" === this.type || "strider" === this.type || "magma_cube" === this.type ? 5 : 1,
            { type: "freeze" },
          ));
    };
  })());
//# sourceURL=js/mobitems.js
