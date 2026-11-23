"use strict";
const diffMul = (t, s) =>
    1 === t.difficulty ? Math.min(s / 2 + 1, s) : 3 === t.difficulty ? 1.5 * s : s,
  lookVec = (t, s) => {
    const e = s.pos[0] - t.pos[0],
      i = s.pos[1] + 0.5 * s.h - (t.pos[1] + 0.85 * t.h),
      h = s.pos[2] - t.pos[2],
      a = Math.hypot(e, i, h) || 1;
    return [e / a, i / a, h / a, a];
  };
class Humanoid extends VMob {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h),
      (this.hand = this.D.hand
        ? makeStack("function" == typeof this.D.hand ? this.D.hand(this) : this.D.hand, 1)
        : null),
      (this.armorItems = []),
      (this.persistent = !1));
  }
  extraSave() {
    return { hand: this.hand, arm: this.armorItems };
  }
  extraLoad(t) {
    (void 0 !== t.hand && (this.hand = t.hand), t.arm && (this.armorItems = t.arm));
  }
  setupAnim(t, s) {
    (emHumanoid(t, this, s, { zombie: !!this.D.zombieArms, bow: !(!this.D.bow || !this.target) }),
      this.charging &&
        t.parts.right_arm &&
        ((t.parts.right_arm.xRot = -Math.PI / 2 + t.parts.head.xRot),
        (t.parts.left_arm.xRot = -Math.PI / 2 + t.parts.head.xRot),
        (t.parts.left_arm.yRot = 0.6)));
  }
  attachments(t, s, e, i) {
    if (!this.hand) return null;
    const h = this.hand;
    return { right_arm: (s) => t.drawHeldItem(s, h, !1, e, i, this, null) };
  }
  drawLayers(t, s, e, i, h, a, o, r) {
    if (this.D.outer) {
      const t = EM.get(s, this.layerKey().replace("#main", "#outer"));
      t &&
        (EM.reset(t),
        EM.copy(e, t),
        s.drawEM(
          t,
          s.etex(this.D.outer + (this.baby && this.D.outerBaby ? "_baby" : "")),
          i,
          o,
          a,
          { overlay: r },
        ));
    }
    this.armorItems.some((t) => t) && drawVArmor(t, s, this, e, i, o, a, r);
  }
}
function drawVArmor(t, s, e, i, h, a, o, r) {
  const n = e.layerKey().split("#")[0];
  ["helmet", "chestplate", "leggings", "boots"].forEach((t, l) => {
    const d = e.armorItems[l];
    if (!d) return;
    const p = ITEMS[d.id].armor,
      c = p && p.mat;
    if (!c || "elytra" === c) return;
    const u = EM.get(s, n + "#" + t);
    if (!u) return;
    (EM.reset(u), EM.copy(i, u));
    const g = /_baby$/.test(n)
        ? "humanoid_baby"
        : "leggings" === t
          ? "humanoid_leggings"
          : "humanoid",
      m =
        "golden" === c
          ? "gold"
          : "chain" === c || "chainmail" === c
            ? "chainmail"
            : "turtle" === c
              ? "turtle_scute"
              : c;
    (s.drawEM(u, s.etex("entity/equipment/" + g + "/" + m), h, a, o, {
      overlay: r,
      tint: "leather" === m ? dyeTintOf(d, [160 / 255, 101 / 255, 64 / 255]) : null,
      cull: !1,
    }),
      "function" == typeof stackGlint &&
        stackGlint(d) &&
        s.drawEM(u, s.etex("entity/equipment/" + g + "/" + m), h, a, o, {
          overlay: r,
          cull: !1,
          glint: "armor",
          glintOnly: !0,
        }),
      "leather" === m &&
        s.drawEM(u, s.etex("entity/equipment/" + g + "/leather_overlay"), h, a, o, {
          overlay: r,
          cull: !1,
        }));
    const f = d.trim && s.trimTex && !e.baby ? s.trimTex(d.trim, c, "leggings" === t) : null;
    f &&
      (s.gl.depthFunc(s.gl.LEQUAL),
      s.drawEM(u, f, h, a, o, { overlay: r, cull: !1 }),
      s.gl.depthFunc(s.gl.LESS));
  });
}
function randomArmor(t) {
  const s = t.game;
  if (Math.random() > (s.difficulty / 3) * 0.15) return;
  const e = pickW([
    ["leather", 37],
    ["golden", 49],
    ["chainmail", 13],
    ["iron", 1],
  ]);
  ["helmet", "chestplate", "leggings", "boots"].forEach((s, i) => {
    if (Math.random() < (0 === i ? 1 : 0.6)) {
      const h = e + "_" + s;
      void 0 !== ITEM_KEY[h] && (t.armorItems[i] = makeStack(h, 1));
    }
  });
}
class SkeletonKind extends Humanoid {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h), randomArmor(this), (this.strafeT = 0), (this.strafeDir = 1));
  }
  ranged(t, s, e) {
    if (this.D.melee) return this.chase(t, s, e);
    if (((t.look = s), e > 15))
      return ((t.goal = [s.pos[0], s.pos[1], s.pos[2]]), void (this.drawT = 0));
    if (e < 6) {
      const e = this.pos[0] - s.pos[0],
        i = this.pos[2] - s.pos[2],
        h = Math.hypot(e, i) || 1;
      ((t.goal = [this.pos[0] + (e / h) * 3, this.pos[1], this.pos[2] + (i / h) * 3]),
        (t.mod = 0.8));
    }
    if (
      (++this.strafeT > 20 && Math.random() < 0.3 && ((this.strafeDir *= -1), (this.strafeT = 0)),
      (t.strafe = 0.5 * this.strafeDir),
      (t.face = Math.atan2(-(s.pos[0] - this.pos[0]), -(s.pos[2] - this.pos[2]))),
      this.canSee(s))
    ) {
      if (
        ((this.drawT = (this.drawT || 0) + 1), this.drawT >= (3 === this.game.difficulty ? 20 : 40))
      ) {
        this.drawT = 0;
        const [t, e, i, h] = lookVec(this, s),
          a = 1.6,
          o = 0.0075 * (14 - 4 * this.game.difficulty),
          r = new Arrow(
            this.game,
            this.pos[0],
            this.pos[1] + 0.85 * this.h,
            this.pos[2],
            [
              t * a + (Math.random() - 0.5) * o,
              e * a + 0.2 * h * 0.05 + (Math.random() - 0.5) * o,
              i * a + (Math.random() - 0.5) * o,
            ],
            this,
          );
        (this.D.tip && ((r.tip = makeStack("tipped_arrow", 1)), (r.tip.pot = this.D.tip)),
          (r.baseDmg = 2 + 0.11 * this.game.difficulty),
          this.fire > 0 && (r.fire = 100),
          this.game.entities.push(r),
          Sound.ev(
            "entity." + (this.D.soundType || this.type) + ".shoot",
            this.pos,
            1,
            1 / (0.4 * Math.random() + 0.8),
          ));
      }
    } else this.drawT = 0;
  }
  melee(t) {
    (super.melee(t),
      "wither_skeleton" === this.type && t.addEffect && t.addEffect("wither", 0, 200));
  }
  setupAnim(t, s) {
    if (
      (emHumanoid(t, this, s, { bow: !this.D.melee && !!this.target }),
      this.D.melee && this.target && t.parts.right_arm)
    ) {
      t.parts.right_arm.xRot =
        (-Math.PI / 2) * 0.6 +
        (this.swingT > 0 ? 1.2 * -Math.sin((1 - this.swingT / 6) * Math.PI) : 0);
    }
  }
}
for (const [t, s] of [
  [
    "stray",
    { outer: "entity/skeleton/stray_overlay", tip: "slowness", tex: "entity/skeleton/stray" },
  ],
  [
    "bogged",
    { outer: "entity/skeleton/bogged_overlay", tip: "poison", tex: "entity/skeleton/bogged" },
  ],
  ["parched", { tex: "entity/skeleton/parched", tip: "weakness", burns: !1 }],
  [
    "wither_skeleton",
    { tex: "entity/skeleton/wither_skeleton", melee: !0, hand: "stone_sword", burns: !1 },
  ],
])
  defVMob(t, {
    cls: SkeletonKind,
    hand: s.hand || "bow",
    burns: !1 !== s.burns,
    xp: 5,
    shadowR: 0.4,
    bow: !s.melee,
    ...s,
    tex: () => s.tex,
    T: { hostile: !0 },
  });
((VMOB.bogged.postInteract = null),
  (SkeletonKind.prototype.postInteract = function (t, s) {
    return (
      !("bogged" !== this.type || !s || "shears" !== ITEMS[s.id].key || this.sheared) &&
      ((this.sheared = !0),
      this.game.dropItem(
        this.pos[0],
        this.pos[1] + 1.7,
        this.pos[2],
        makeStack("brown_mushroom", 1),
      ),
      this.game.dropItem(this.pos[0], this.pos[1] + 1.7, this.pos[2], makeStack("red_mushroom", 1)),
      Sound.ev("entity.bogged.shear", this.pos, 1, 1),
      this.game.damageHeld(1),
      !0)
    );
  }),
  (() => {
    const t = SkeletonKind.prototype.setupAnim;
    SkeletonKind.prototype.setupAnim = function (s, e) {
      (t.call(this, s, e),
        "bogged" === this.type && s.parts.mushrooms && (s.parts.mushrooms.visible = !this.sheared));
    };
  })());
class ZombieKind extends Humanoid {
  constructor(t, s, e, i, h) {
    if ((super(t, s, e, i, h), randomArmor(this), "drowned" === s)) {
      const t = Math.random();
      ((this.hand =
        t < 0.0625
          ? makeStack("trident", 1)
          : t < 0.1
            ? makeStack("fishing_rod", 1)
            : Math.random() < 0.03
              ? makeStack("nautilus_shell", 1)
              : null),
        (this.waterBreather = !0));
    }
    Math.random() < 0.05 && "giant" !== s && this.makeBaby();
  }
  get ai() {
    return "drowned" === this.type && this.inWater ? "amph" : "ground";
  }
  makeBaby() {
    return (super.makeBaby(), (this.growT = 1e12), this);
  }
  wantsPlayer() {
    return (
      this.game.difficulty > 0 &&
      ("drowned" !== this.type || !this.game.isDay() || this.game.player.inWater)
    );
  }
  huntTarget() {
    return (this.age + this.id) % 20
      ? null
      : this.game.entities.find(
          (t) =>
            !t.dead &&
            !t.deathTime &&
            ("villager" === t.type ||
              "wandering_trader" === t.type ||
              "iron_golem" === t.type ||
              ("turtle" === t.type && t.baby)) &&
            t.distTo(this) < 16 &&
            this.canSee(t),
        ) || null;
  }
  ranged(t, s, e) {
    if (this.hand && "trident" === ITEMS[this.hand.id].key && e > 3 && e < 16 && this.canSee(s)) {
      if (
        ((t.look = s),
        (t.face = Math.atan2(-(s.pos[0] - this.pos[0]), -(s.pos[2] - this.pos[2]))),
        (this.charging = !0),
        this.attackCd <= 0)
      ) {
        ((this.attackCd = 40), (this.charging = !1));
        const [t, e, i, h] = lookVec(this, s),
          a =
            "undefined" != typeof ThrownTrident
              ? new ThrownTrident(
                  this.game,
                  this.pos[0],
                  this.pos[1] + 0.85 * this.h,
                  this.pos[2],
                  [1.6 * t, 1.6 * e + 0.01 * h, 1.6 * i],
                  this,
                  makeStack("trident", 1),
                )
              : new Arrow(
                  this.game,
                  this.pos[0],
                  this.pos[1] + 0.85 * this.h,
                  this.pos[2],
                  [1.6 * t, 1.6 * e, 1.6 * i],
                  this,
                );
        ((a.noPickup = !0),
          (a.baseDmg = 8),
          this.game.entities.push(a),
          Sound.ev("entity.drowned.shoot", this.pos, 1, 1));
      }
    } else ((this.charging = !1), this.chase(t, s, e));
  }
  melee(t) {
    (super.melee(t),
      "husk" === this.type && t.addEffect && t.addEffect("hunger", 0, 140 * this.game.difficulty),
      t === this.game.player &&
        Math.random() < 0.05 * this.game.difficulty &&
        "giant" !== this.type &&
        (this.callHelp = !0));
  }
  texKey(t) {
    return t.etex(this.D.tex2 + (this.baby && "giant" !== this.type ? "_baby" : ""));
  }
  moveBy(t) {
    if ("drowned" === this.type && this.inWater) {
      if (t.goal) {
        const s = t.goal[1] - this.pos[1];
        this.vel[1] += 0.01 * clamp(s, -1, 1);
      } else this.vel[1] -= 0.005;
      const s = 0.6 * this.T.speed;
      if (t.goal) {
        const e = t.goal[0] - this.pos[0],
          i = t.goal[2] - this.pos[2],
          h = Math.hypot(e, i);
        h > 0.3 &&
          (this.turnTo(Math.atan2(-e, -i), 0.3),
          (this.vel[0] += (e / h) * s * 0.1),
          (this.vel[2] += (i / h) * s * 0.1));
      }
      return (
        this.move(this.vel[0], this.vel[1], this.vel[2]),
        (this.vel[0] *= 0.9),
        (this.vel[1] *= 0.9),
        (this.vel[2] *= 0.9),
        void (this.bodyYaw += 0.3 * angDelta(this.yaw, this.bodyYaw))
      );
    }
    super.moveBy(t);
  }
}
const ZD = (t, s, e = {}) =>
  defVMob(t, {
    cls: ZombieKind,
    zombieArms: !0,
    burns: !0,
    xp: 5,
    shadowR: 0.4,
    tex2: s,
    T: { hostile: !0, attack: 3 },
    ...e,
  });
(ZD("husk", "entity/zombie/husk", { burns: !1 }),
  ZD("drowned", "entity/zombie/drowned", {
    outer: "entity/zombie/drowned_outer_layer",
    outerBaby: !0,
    waterOk: !0,
    sinks: !0,
  }),
  ZD("giant", "entity/zombie/zombie", {
    burns: !1,
    layer: "giant#main",
    shadowR: 3,
    T: { hostile: !0, attack: 50 },
  }));
class CaveSpider extends VMob {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h), (this.persistent = !1));
  }
  wantsPlayer() {
    return (
      this.game.difficulty > 0 &&
      (!this.game.isDay() ||
        this.world.skyAt(
          Math.floor(this.pos[0]),
          Math.floor(this.pos[1] + 1),
          Math.floor(this.pos[2]),
        ) < 8 ||
        this.anger > 0)
    );
  }
  melee(t) {
    super.melee(t);
    const s = this.game.difficulty;
    s >= 2 && t.addEffect && t.addEffect("poison", 0, 20 * (3 === s ? 15 : 7));
  }
  fight(t) {
    const s = this.target,
      e = this.distTo(s);
    if (this.onGround && e < 4 && e > 2 && Math.random() < 0.1) {
      const t = s.pos[0] - this.pos[0],
        e = s.pos[2] - this.pos[2],
        i = Math.hypot(t, e) || 1;
      ((this.vel[1] = 0.4), (this.vel[0] += (t / i) * 0.3), (this.vel[2] += (e / i) * 0.3));
    }
    VMob.prototype.fight.call(this, t);
  }
  setupAnim(t, s) {
    spiderAnim(t, this, s);
  }
  texKey(t) {
    return t.etex("entity/spider/cave_spider");
  }
  drawLayers(t, s, e, i, h, a) {
    const o = s.etex("entity/spider/spider_eyes");
    o && s.drawEMGlow(e, o, i, a, {});
  }
}
function spiderAnim(t, s, e) {
  const i = t.parts,
    [h, a] = emLimbs(s, e);
  emHead(i.head, s, e);
  [
    ["right_hind_leg", "left_hind_leg"],
    ["right_middle_hind_leg", "left_middle_hind_leg"],
    ["right_middle_front_leg", "left_middle_front_leg"],
    ["right_front_leg", "left_front_leg"],
  ].forEach(([t, s], e) => {
    const o = [0, Math.PI, Math.PI / 2, 1.5 * Math.PI][e],
      r = 0.4 * -Math.cos(0.6662 * h * 2 + o) * a,
      n = 0.4 * Math.abs(Math.sin(0.6662 * h + o)) * a;
    (i[t] && ((i[t].yRot += r), (i[t].zRot += n)), i[s] && ((i[s].yRot -= r), (i[s].zRot -= n)));
  });
}
defVMob("cave_spider", {
  cls: CaveSpider,
  climbs: !0,
  xp: 5,
  shadowR: 0.35,
  T: { hostile: !0, attack: 2 },
});
class Crawler extends VMob {
  wantsPlayer() {
    return this.game.difficulty > 0;
  }
  onAttacked(t) {
    if ("silverfish" !== this.type) return;
    const s = this.world,
      e = Math.floor(this.pos[0]),
      i = Math.floor(this.pos[1]),
      h = Math.floor(this.pos[2]);
    for (let a = -5; a <= 5; a++)
      for (let o = -3; o <= 3; o++)
        for (let r = -5; r <= 5; r++) {
          const n = BLOCKS[s.getBlock(e + a, i + o, h + r)].key;
          if (n && n.startsWith("infested_") && Math.random() < 0.3) {
            const l = !1 === this.game.rule("mob_griefing") ? BID[n.slice(9)] : void 0;
            void 0 !== l
              ? s.setBlock(e + a, i + o, h + r, l, s.getMeta(e + a, i + o, h + r))
              : s.setBlock(e + a, i + o, h + r, 0, 0);
            const d = spawnAt(this.game, "silverfish", e + a + 0.5, i + o, h + r + 0.5);
            ((d.target = t.attacker), (d.persistent = !1));
          }
        }
  }
  setupAnim(t, s) {
    const e = t.parts,
      i = this.age + s;
    for (let t = 0; t < 7; t++) {
      const s = e["segment" + t];
      s &&
        ((s.yRot = Math.cos(0.9 * i + 0.15 * t * Math.PI) * Math.PI * 0.05 * (1 + Math.abs(t - 2))),
        (s.x = Math.sin(0.9 * i + 0.15 * t * Math.PI) * Math.PI * 0.2 * Math.abs(t - 2)));
    }
    for (let t = 0; t < 3; t++) {
      const s = e["layer" + t],
        i = e["segment" + [2, 4, 1][t]];
      s && i && ((s.yRot = i.yRot), (s.x = i.x));
    }
  }
  texKey(t) {
    return t.etex("entity/" + this.type + "/" + this.type);
  }
}
(defVMob("silverfish", {
  cls: Crawler,
  xp: 5,
  shadowR: 0.3,
  T: { hostile: !0, attack: 1 },
  stepSound: !0,
}),
  defVMob("endermite", {
    cls: Crawler,
    xp: 3,
    shadowR: 0.3,
    T: { hostile: !0, attack: 2 },
    despawnT: 2400,
  }));
class Slime extends VMob {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h),
      this.setSize([1, 2, 4][randInt(0, 2)]),
      (this.squish = 0),
      (this.prevSquish = 0),
      (this.jumpT = randInt(10, 30)),
      (this.persistent = !1));
  }
  setSize(t) {
    ((this.size = t),
      (this.w = this.h = 0.52 * t),
      (this.maxHealth = this.health = t * t),
      (this.T = { ...MOB_TYPES[this.type], speed: 0.2 + 0.1 * t, attack: t > 1 ? t : 0 }));
  }
  extraSave() {
    return { sz: this.size };
  }
  extraLoad(t) {
    if (t.sz) {
      const s = this.health;
      (this.setSize(t.sz), (this.health = Math.min(s, this.maxHealth)));
    }
  }
  wantsPlayer() {
    return this.size > 1 && this.game.difficulty > 0;
  }
  think(t) {
    (VMob.prototype.think.call(this, t),
      !this.target && !t.goal && Math.random() < 0.02 && (this.goal = this.randomGoal(8, 2)));
  }
  moveBy(t) {
    if (((this.prevSquish = this.squish), (this.squish *= 0.6), this.onGround)) {
      if (
        (this.wasAir &&
          ((this.squish = -0.5),
          this.sound(this.size > 1 ? "squish" : "squish_small", 0.4 * this.size)),
        (this.wasAir = !1),
        --this.jumpT <= 0 && (t.goal || this.target))
      ) {
        const s = t.goal || this.target.pos,
          e = s[0] - this.pos[0],
          i = s[2] - this.pos[2],
          h = Math.hypot(e, i) || 1;
        ((this.yaw = Math.atan2(-e, -i)), (this.vel[1] = 0.42));
        const a = 0.35 * this.T.speed;
        ((this.vel[0] = (e / h) * a),
          (this.vel[2] = (i / h) * a),
          (this.jumpT = this.target ? randInt(5, 15) : randInt(10, 30)),
          (this.squish = 1),
          this.sound(this.size > 1 ? "jump" : "jump_small", 0.4 * this.size));
      }
    } else this.wasAir = !0;
    if ((this.travel(0, 0, 0, !1), !this.onGround)) {
      const t = this.vel;
      (this.move(0, 0, 0), (t[0] *= 1), (t[2] *= 1));
    }
    this.bodyYaw += 0.5 * angDelta(this.yaw, this.bodyYaw);
  }
  afterMove() {
    const t = this.target;
    t &&
      this.size > 1 &&
      this.attackCd <= 0 &&
      this.distTo(t) < 0.6 * this.w + 0.5 * t.w + 0.3 &&
      ((this.attackCd = 10),
      t.hurt(diffMul(this.game, this.T.attack), {
        type: "mob",
        attacker: this,
        knockFrom: this.pos,
      }),
      this.sound("attack"));
  }
  fight(t) {
    ((t.look = this.target), (t.goal = [...this.target.pos]));
  }
  onDeath() {
    if (!(this.size <= 1))
      for (let t = 0, s = randInt(2, 4); t < s; t++) {
        const t = createMob(
          this.game,
          this.type,
          this.pos[0] + ((Math.random() - 0.5) * this.w) / 2,
          this.pos[1] + 0.5,
          this.pos[2] + ((Math.random() - 0.5) * this.w) / 2,
        );
        (t.setSize(this.size / 2),
          (t.persistent = this.persistent),
          this.customName && (t.customName = this.customName),
          this.game.entities.push(t));
      }
  }
  layerKey() {
    return "slime#main";
  }
  renderScale(t) {
    return 0.999 * this.size;
  }
  preDraw(t, s) {
    const e = 1 / (lerp(this.prevSquish, this.squish, s) / (0.5 * this.size + 1) + 1);
    M4.scale(t, 1 / e, e, 1 / e);
  }
  setupAnim() {}
  texKey(t) {
    return t.etex("entity/slime/slime");
  }
  drawLayers(t, s, e, i, h, a, o, r) {
    const n = EM.get(s, "slime#outer"),
      l = s.gl;
    n &&
      (l.enable(l.BLEND),
      l.blendFunc(l.SRC_ALPHA, l.ONE_MINUS_SRC_ALPHA),
      s.drawEM(n, s.etex("entity/slime/slime"), i, o, a, { overlay: r }),
      l.disable(l.BLEND));
  }
}
(defVMob("slime", {
  cls: Slime,
  xp: 0,
  shadowR: 0.25,
  T: { hostile: !0 },
  stepSound: !1,
  noDeathFlip: !1,
}),
  (VMOB.slime.loot = "slime"),
  (() => {
    const t = VMob.prototype.die;
    Slime.prototype.die = function (s) {
      ((this.D.xp = this.size), t.call(this, s));
    };
  })());
const SULFUR_BLOCK_IMMUNE = new Set([
  "mob",
  "player",
  "arrow",
  "trident",
  "pearl",
  "fall",
  "cactus",
  "berry",
  "freeze",
  "hotFloor",
  "explosion",
]);
class SulfurCube extends Slime {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h), this.setSize(Math.random() < 0.5 ? 1 : 2), (this.block = null));
  }
  setSize(t) {
    ((this.size = t),
      (this.w = this.h = 0.49 * t),
      (this.maxHealth = this.health = 10 * t),
      (this.T = { ...MOB_TYPES[this.type], speed: 0.25, attack: 0 }));
  }
  extraSave() {
    return { sz: this.size, blk: this.block };
  }
  extraLoad(t) {
    (t.sz && this.setSize(t.sz), (this.block = t.blk || null));
  }
  wantsPlayer() {
    return !1;
  }
  think(t) {
    if (this.block) return ((this.goal = null), void (this.target = null));
    super.think(t);
  }
  hurt(t, s) {
    if (this.block && s && SULFUR_BLOCK_IMMUNE.has(s.type) && !this.dead && !this.deathTime) {
      if (s.knockFrom && (s.knock ?? 0.4) > 0) {
        const t = this.pos[0] - s.knockFrom[0],
          e = this.pos[2] - s.knockFrom[2],
          i = Math.hypot(t, e) || 1,
          h = s.knock ?? 0.4;
        ((this.vel[0] = this.vel[0] / 2 + (t / i) * h),
          (this.vel[2] = this.vel[2] / 2 + (e / i) * h),
          this.onGround && (this.vel[1] = Math.min(0.4, this.vel[1] / 2 + 0.36)));
      }
      return !0;
    }
    return super.hurt(t, s);
  }
  onDeath() {
    this.block && this.game.dropItem(this.pos[0], this.pos[1] + 0.3, this.pos[2], this.block);
  }
  preInteract(t, s) {
    const e = this.game,
      i = s && ITEMS[s.id].key;
    return "slime_ball" === i && this.size < 2
      ? (this.setSize(2), useOne(e, t), this.sound("eat"), !0)
      : "bucket" === i && 1 === this.size && void 0 !== ITEM_KEY.sulfur_cube_bucket
        ? (swapHeld(e, t, "sulfur_cube_bucket", { mob: { blk: this.block } }),
          (this.dead = !0),
          Sound.ev("item.bucket.fill_sulfur_cube", this.pos, 1, 1),
          !0)
        : s && void 0 !== ITEMS[s.id].block && !this.block && SOLIDCUBE[ITEMS[s.id].block]
          ? ((this.block = { ...s, count: 1 }), useOne(e, t), this.sound("absorb"), !0)
          : !(s || !this.block) &&
            (e.dropItem(this.pos[0], this.pos[1] + this.h, this.pos[2], this.block),
            (this.block = null),
            this.sound("eject"),
            !0);
  }
  layerKey() {
    return this.size > 1 ? "sulfur_cube#main" : "sulfur_cube_small#main";
  }
  renderScale() {
    return 1;
  }
  preDraw(t, s) {
    M4.translate(t, 0, this.h / 2, 0);
    const e = 1 / ((this.block ? 0 : 0.3 * lerp(this.prevSquish, this.squish, s)) + 1);
    (M4.scale(t, 1 / e, e, 1 / e), M4.translate(t, 0, -1.501, 0));
  }
  texKey(t) {
    return t.etex("entity/sulfur_cube/sulfur_cube_inner" + (this.size > 1 ? "" : "_small"));
  }
  drawVM(t, s, e, i, h, a, o) {
    const r = this.size > 1,
      n = EM.get(s, r ? "sulfur_cube#inner" : "sulfur_cube_small#inner"),
      l = EM.get(s, this.layerKey()),
      d = this.block && t.blockMesh && ITEMS[this.block.id] ? ITEMS[this.block.id].block : void 0;
    if (void 0 !== d) {
      const i = M4.copy(e);
      M4.translate(i, 0, 1.501, 0);
      const o = r ? 1 : 0.5;
      (M4.translate(i, -o / 2, -0.518 * o, -o / 2),
        M4.scale(i, o, o, o),
        s.drawMesh(t.blockMesh(d, 0), i, h, a));
    } else n && s.drawEM(n, this.texKey(s), e, a, h, { overlay: o });
    if (l) {
      const t = s.gl;
      (t.enable(t.BLEND),
        t.blendFunc(t.SRC_ALPHA, t.ONE_MINUS_SRC_ALPHA),
        s.drawEM(l, s.etex("entity/sulfur_cube/sulfur_cube_outer" + (r ? "" : "_small")), e, a, h, {
          overlay: o,
        }),
        t.disable(t.BLEND));
    }
  }
}
defVMob("sulfur_cube", {
  cls: SulfurCube,
  xp: 1,
  shadowR: 0.3,
  T: { hostile: !1, passive: !0 },
  stepSound: !1,
});
class Phantom extends VMob {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h),
      (this.circle = [e, i, h]),
      (this.ang = Math.random() * Math.PI * 2),
      (this.swoop = 0),
      (this.size = 0),
      (this.persistent = !1));
  }
  wantsPlayer() {
    return this.game.difficulty > 0;
  }
  think(t) {
    this.game.player;
    if (
      ((this.ang += 0.04),
      this.target &&
        this.swoop <= 0 &&
        this.age % 100 == 0 &&
        Math.random() < 0.5 &&
        (this.swoop = 60),
      this.target && this.swoop > 0)
    ) {
      this.swoop--;
      const s = this.target;
      return (
        (t.goal = [s.pos[0], s.pos[1] + 0.5 * s.h, s.pos[2]]),
        (t.mod = 2),
        void (
          this.distTo(s) < 1.5 &&
          this.attackCd <= 0 &&
          (this.melee(s),
          (this.swoop = 0),
          (this.circle = [s.pos[0], s.pos[1] + 20 + randInt(0, 10), s.pos[2]]),
          this.sound("bite"))
        )
      );
    }
    (this.target &&
      (this.circle = [
        this.target.pos[0],
        Math.max(this.circle[1], this.target.pos[1] + 15),
        this.target.pos[2],
      ]),
      (t.goal = [
        this.circle[0] + 12 * Math.cos(this.ang),
        this.circle[1] + 2 * Math.sin(2 * this.ang),
        this.circle[2] + 12 * Math.sin(this.ang),
      ]),
      this.age % 40 == 0 && this.sound("swoop", 0.3));
  }
  setupAnim(t, s) {
    const e = t.parts,
      i = (7.448451 * (this.age + 3 * this.id + s) * Math.PI) / 180,
      h = (16 * Math.cos(i) * Math.PI) / 180;
    (e.left_wing_base && (e.left_wing_base.zRot = h),
      e.left_wing_tip && (e.left_wing_tip.zRot = h),
      e.right_wing_base && (e.right_wing_base.zRot = -h),
      e.right_wing_tip && (e.right_wing_tip.zRot = -h),
      e.tail_base && (e.tail_base.xRot = (-(5 + 5 * Math.cos(2 * i)) * Math.PI) / 180),
      e.tail_tip && (e.tail_tip.xRot = (-(5 + 5 * Math.cos(2 * i)) * Math.PI) / 180));
  }
  preDraw(t) {
    (M4.translate(t, 0, 1.3125, 0.1875), M4.rotX(t, -(this.pitch3 || 0)));
  }
  texKey(t) {
    return t.etex("entity/phantom/phantom");
  }
  drawLayers(t, s, e, i, h, a) {
    const o = s.etex("entity/phantom/phantom_eyes");
    o && s.drawEMGlow(e, o, i, a, {});
  }
}
(defVMob("phantom", {
  cls: Phantom,
  ai: "fly",
  burns: !0,
  xp: 5,
  shadowR: 0.75,
  T: { hostile: !0, attack: 6, flySpeed: 0.6 },
  speed3: 2,
  noDeathFlip: !1,
  stepSound: !1,
}),
  (Game.prototype.trySpawnPhantoms = function () {
    const t = this.player,
      s = this.world;
    if (0 === this.difficulty || t.creative || (this.dim && "overworld" !== this.dim)) return;
    if (((t.sinceRest = (t.sinceRest || 0) + 1200), this.sleeping || spawnDarken(this) < 5)) return;
    if (t.sinceRest < 72e3 || Math.random() * t.sinceRest < 72e3) return;
    if (
      Math.floor(t.pos[1]) < (s.flat ? 0 : SEA + 1) ||
      s.skyAt(Math.floor(t.pos[0]), Math.floor(t.pos[1] + 2), Math.floor(t.pos[2])) < 15
    )
      return;
    const e = 1 + randInt(0, this.difficulty);
    for (let s = 0; s < e; s++) {
      const s = spawnAt(
        this,
        "phantom",
        t.pos[0] + randInt(-10, 10),
        t.pos[1] + 20 + randInt(0, 14),
        t.pos[2] + randInt(-10, 10),
      );
      ((s.persistent = !1), (s.target = t));
    }
  }),
  (() => {
    const t = Game.prototype.trySleep;
    Game.prototype.trySleep = function (...s) {
      const e = t.apply(this, s);
      return (this.sleeping && this.player && (this.player.sinceRest = 0), e);
    };
  })());
class Witch extends Humanoid {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h), (this.hand = null), (this.drinkT = 0));
  }
  ranged(t, s, e) {
    if (
      ((t.look = s),
      !(this.drinkT > 0) &&
        (e > 8 && (t.goal = [s.pos[0], s.pos[1], s.pos[2]]),
        this.attackCd <= 0 && e < 10 && this.canSee(s)))
    ) {
      this.attackCd = 60;
      const hasFx = (t) => s.hasEffect && s.hasEffect(t),
        t =
          e >= 8 && !hasFx("slowness")
            ? "slowness"
            : s.health >= 8 && !hasFx("poison")
              ? "poison"
              : e <= 3 && !hasFx("weakness") && Math.random() < 0.25
                ? "weakness"
                : "harming",
        [i, h, a, o] = lookVec(this, s),
        r = makeStack("splash_potion", 1);
      ((r.pot = t),
        "undefined" != typeof ThrownPotion &&
          this.game.entities.push(
            new ThrownPotion(
              this.game,
              this.pos[0],
              this.pos[1] + 0.85 * this.h,
              this.pos[2],
              [0.75 * i, 0.75 * h + 0.02 * o + 0.2, 0.75 * a],
              this,
              r,
            ),
          ),
        this.sound("throw"));
    }
  }
  think(t) {
    if (this.drinkT > 0) {
      if (0 === --this.drinkT && this.hand) {
        const t = this.hand.pot;
        for (const [s, e, i] of ("undefined" != typeof POTIONS && POTIONS[t]) || [])
          "instant_health" === s
            ? (this.health = Math.min(this.maxHealth, this.health + 4 * (i + 1)))
            : this.addEffect && this.addEffect(s, i, e);
        this.hand = null;
      }
      return;
    }
    const s =
      this.inWater && this.air < 200
        ? "water_breathing"
        : this.fire > 0
          ? "fire_resistance"
          : this.health < this.maxHealth && Math.random() < 0.05
            ? "healing"
            : this.target && this.distTo(this.target) > 11 && Math.random() < 0.05
              ? "swiftness"
              : null;
    if (s)
      return (
        (this.hand = makeStack("potion", 1)),
        (this.hand.pot = s),
        (this.drinkT = 32),
        void this.sound("drink")
      );
    VMob.prototype.think.call(this, t);
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, h] = emLimbs(this, s);
    (emHead(e.head, this, s),
      e.right_leg && (e.right_leg.xRot = 1.4 * Math.cos(0.6662 * i) * h * 0.5),
      e.left_leg && (e.left_leg.xRot = 1.4 * Math.cos(0.6662 * i + Math.PI) * h * 0.5),
      e.nose &&
        ((e.nose.x = 0),
        (e.nose.z = 0),
        this.drinkT > 0 && (e.nose.y = 0.5 * Math.sin(0.8 * this.age) - 2)));
  }
  attachments(t, s, e, i) {
    if (!this.hand) return null;
    const h = this.hand;
    return {
      arms: (s) => {
        (M4.translate(s, 0, 0.25, -0.15),
          M4.rotX(s, Math.PI),
          M4.scale(s, 0.75, 0.75, 0.75),
          t.drawHeldItem(s, h, !1, e, i, this, null));
      },
    };
  }
  texKey(t) {
    return t.etex("entity/witch/witch");
  }
}
defVMob("witch", { cls: Witch, xp: 5, shadowR: 0.4, T: { hostile: !0 }, immune: [] });
class Illager extends Humanoid {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h), (this.spellT = 0), (this.spell = null), (this.persistent = !1));
  }
  huntTarget() {
    return (this.age + this.id) % 20
      ? null
      : this.game.entities.find(
          (t) =>
            !t.dead &&
            !t.deathTime &&
            ("villager" === t.type || "wandering_trader" === t.type || "iron_golem" === t.type) &&
            t.distTo(this) < 16 &&
            this.canSee(t),
        ) || null;
  }
  get aggressive() {
    return !!this.target;
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, h] = emLimbs(this, s);
    (emHead(e.head, this, s),
      e.right_leg && (e.right_leg.xRot = 1.4 * Math.cos(0.6662 * i) * h * 0.5),
      e.left_leg && (e.left_leg.xRot = 1.4 * Math.cos(0.6662 * i + Math.PI) * h * 0.5));
    const a = !(
      this.target ||
      this.spellT > 0 ||
      this.charging ||
      ("pillager" === this.type && this.hand)
    );
    if (
      (e.arms && (e.arms.visible = a),
      e.right_arm && (e.right_arm.visible = !a),
      e.left_arm && (e.left_arm.visible = !a),
      a)
    )
      return;
    const o = this.age + s;
    if (this.spellT > 0)
      ((e.right_arm.z = 0),
        (e.right_arm.x = -5),
        (e.left_arm.z = 0),
        (e.left_arm.x = 5),
        (e.right_arm.xRot = 0.25 * Math.cos(0.6662 * o)),
        (e.left_arm.xRot = 0.25 * Math.cos(0.6662 * o)),
        (e.right_arm.zRot = 2.3561945),
        (e.left_arm.zRot = -2.3561945),
        (e.right_arm.yRot = 0),
        (e.left_arm.yRot = 0));
    else if (this.charging || ("pillager" === this.type && this.target))
      ((e.right_arm.yRot = -0.3 + e.head.yRot),
        (e.left_arm.yRot = 0.6 + e.head.yRot),
        (e.right_arm.xRot = -Math.PI / 2 + e.head.xRot + 0.1),
        (e.left_arm.xRot = -1.5 + e.head.xRot));
    else {
      const t = this.swingT > 0 ? Math.sin((1 - this.swingT / 6) * Math.PI) : 0;
      ((e.right_arm.xRot = (-Math.PI / 2) * 0.8 - 1.2 * t),
        (e.left_arm.xRot = 0.5 * Math.cos(0.6662 * i) * h));
    }
  }
  texKey(t) {
    return t.etex("entity/illager/" + this.type);
  }
}
class Pillager extends Illager {
  ranged(t, s, e) {
    if (((t.look = s), e > 12))
      return ((t.goal = [s.pos[0], s.pos[1], s.pos[2]]), void (this.charging = !1));
    if (e < 5) {
      const e = this.pos[0] - s.pos[0],
        i = this.pos[2] - s.pos[2],
        h = Math.hypot(e, i) || 1;
      t.goal = [this.pos[0] + (e / h) * 3, this.pos[1], this.pos[2] + (i / h) * 3];
    }
    if (
      ((t.face = Math.atan2(-(s.pos[0] - this.pos[0]), -(s.pos[2] - this.pos[2]))),
      (this.charging = !0),
      this.canSee(s) &&
        ((this.loadT = (this.loadT || 0) + 1),
        1 === this.loadT && Sound.ev("item.crossbow.loading_start", this.pos, 1, 1),
        this.loadT >= 25 && this.attackCd <= 0))
    ) {
      ((this.loadT = 0), (this.attackCd = 20 + randInt(0, 20)));
      const [t, e, i, h] = lookVec(this, s),
        a = 1.6,
        o = new Arrow(
          this.game,
          this.pos[0],
          this.pos[1] + 0.85 * this.h,
          this.pos[2],
          [t * a, e * a + 0.015 * h, i * a],
          this,
        );
      ((o.baseDmg = 3),
        this.game.entities.push(o),
        Sound.ev("item.crossbow.shoot", this.pos, 1, 1));
    }
  }
  attachments(t, s, e, i) {
    const h = this.hand;
    if (!h) return null;
    const a = (this.target, "right_arm");
    return { [a]: (s) => t.drawHeldItem(s, h, !1, e, i, this, null) };
  }
}
class Vindicator extends Illager {
  get johnny() {
    return "Johnny" === this.customName;
  }
  huntTarget() {
    return this.johnny && (this.age + this.id) % 20 == 0
      ? this.game.entities.find(
          (t) =>
            t instanceof Mob &&
            t !== this &&
            !t.dead &&
            t.distTo(this) < 16 &&
            !(t instanceof Illager) &&
            "ravager" !== t.type,
        ) || null
      : super.huntTarget();
  }
  attachments(t, s, e, i) {
    if (!this.target || !this.hand) return null;
    const h = this.hand;
    return { right_arm: (s) => t.drawHeldItem(s, h, !1, e, i, this, null) };
  }
}
class Evoker extends Illager {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h), (this.hand = null), (this.castCd = 0));
  }
  ranged(t, s, e) {
    if (((t.look = s), this.spellT > 0)) 0 === --this.spellT && this.castSpell(s);
    else {
      if (e < 8) {
        const e = this.pos[0] - s.pos[0],
          i = this.pos[2] - s.pos[2],
          h = Math.hypot(e, i) || 1;
        ((t.goal = [this.pos[0] + (e / h) * 4, this.pos[1], this.pos[2] + (i / h) * 4]),
          (t.mod = 0.6));
      } else e > 12 && (t.goal = [s.pos[0], s.pos[1], s.pos[2]]);
      if (--this.castCd <= 0 && this.canSee(s)) {
        const t = this.game.entities.filter(
          (t) => "vex" === t.type && !t.dead && t.distTo(this) < 16,
        ).length;
        ((this.spell = t < 8 && Math.random() < 0.4 ? "vex" : "fangs"),
          (this.spellT = "vex" === this.spell ? 100 : 40),
          (this.castCd = "vex" === this.spell ? 340 : 100),
          Sound.ev(
            "vex" === this.spell ? "entity.evoker.prepare_summon" : "entity.evoker.prepare_attack",
            this.pos,
            1,
            1,
          ));
      }
    }
  }
  castSpell(t) {
    const s = this.game;
    if ("vex" === this.spell) {
      for (let e = 0; e < 3; e++) {
        const e = spawnAt(
          s,
          "vex",
          this.pos[0] + randInt(-2, 2),
          this.pos[1] + 1,
          this.pos[2] + randInt(-2, 2),
        );
        ((e.owner = this),
          (e.target = t),
          (e.life = 30 * (20 + randInt(0, 90))),
          (e.persistent = !1));
      }
      return void Sound.ev("entity.evoker.cast_spell", this.pos, 1, 1);
    }
    if (this.distTo(t) < 3) {
      for (let t = 0; t < 5; t++) {
        const e = (t * Math.PI * 2) / 5;
        evokerFang(s, this, this.pos[0] + 1.5 * Math.cos(e), this.pos[2] + 1.5 * Math.sin(e), 0);
      }
      for (let t = 0; t < 8; t++) {
        const e = (t * Math.PI * 2) / 8 + 1.2566371;
        evokerFang(s, this, this.pos[0] + 2.5 * Math.cos(e), this.pos[2] + 2.5 * Math.sin(e), 3);
      }
    } else {
      const e = Math.atan2(t.pos[2] - this.pos[2], t.pos[0] - this.pos[0]);
      for (let t = 0; t < 16; t++) {
        const i = 1.25 * (t + 1);
        evokerFang(s, this, this.pos[0] + Math.cos(e) * i, this.pos[2] + Math.sin(e) * i, t);
      }
    }
    Sound.ev("entity.evoker.cast_spell", this.pos, 1, 1);
  }
}
class EvokerFangs extends Entity {
  constructor(t, s, e, i, h, a) {
    (super(t, s, e, i, 0.5, 0.8),
      (this.delay = h),
      (this.owner = a),
      (this.life = 0),
      (this.yaw = Math.random() * Math.PI * 2));
  }
  tick() {
    if ((this.savePrev(), !(--this.delay > 0))) {
      if (
        (this.life++,
        1 === this.life &&
          Sound.ev("entity.evoker_fangs.attack", this.pos, 1, 0.2 * Math.random() + 0.85),
        4 === this.life)
      )
        for (const t of this.game.entities)
          t instanceof Living &&
            t !== this.owner &&
            !(t instanceof Illager) &&
            !t.dead &&
            Math.abs(t.pos[0] - this.pos[0]) < 0.6 + t.w / 2 &&
            Math.abs(t.pos[2] - this.pos[2]) < 0.6 + t.w / 2 &&
            Math.abs(t.pos[1] - this.pos[1]) < 1 &&
            t.hurt(6, { type: "magic", attacker: this.owner });
      this.life > 22 && (this.dead = !0);
    }
  }
  drawSelf(t, s, e) {
    if (this.delay > 0) return;
    const i = t.renderer,
      h = EM.get(i, "evoker_fangs#main"),
      a = i.etex("entity/illager/evoker_fangs");
    if (!h || !a) return;
    EM.reset(h);
    const o = Math.min(1, (this.life + e) / 20),
      r = o > 0.9 ? 1 : 0,
      n = Math.sin(Math.min(1, 2 * o) * Math.PI);
    (h.parts.upper_jaw && (h.parts.upper_jaw.zRot = Math.PI - (1 - r) * n * 0.35 * Math.PI),
      h.parts.lower_jaw && (h.parts.lower_jaw.zRot = Math.PI + (1 - r) * n * 0.35 * Math.PI));
    const l = M4.create();
    (M4.translate(
      l,
      s[0],
      s[1] - 0.5 * (o > 0.9 ? 10 * (o - 0.9) : 0) - 0.7 * (1 - Math.min(1, 4 * o)),
      s[2],
    ),
      M4.rotY(l, this.yaw),
      i.drawEM(
        h,
        a,
        l,
        this.lightAt(),
        t.envCache || {
          day: 1,
          fogColor: [0, 0, 0],
          fogNear: 1e8,
          fogFar: 2e8,
          nightTint: [1, 1, 1],
        },
        {},
      ));
  }
}
function evokerFang(t, s, e, i, h) {
  let a = Math.floor(s.pos[1]) + 1;
  for (let s = 0; s < 6 && !SOLIDCUBE[t.world.getBlock(Math.floor(e), a - 1, Math.floor(i))]; s++)
    a--;
  SOLIDCUBE[t.world.getBlock(Math.floor(e), a, Math.floor(i))] ||
    t.entities.push(new EvokerFangs(t, e, a, i, h, s));
}
class Vex extends VMob {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h),
      (this.noClip = !0),
      (this.life = 0),
      (this.hand = makeStack("iron_sword", 1)),
      (this.chargeT = 0),
      (this.persistent = !1));
  }
  wantsPlayer() {
    return this.game.difficulty > 0;
  }
  extraSave() {
    return { own: this.owner && this.owner === this.game.player ? 1 : 0, life: this.life };
  }
  extraLoad(t) {
    this.life = 0 | t.life;
  }
  think(t) {
    if (this.life > 0 && 0 === --this.life) return void this.hurt(1e3, { type: "generic" });
    if (this.target) {
      const s = this.target;
      return (
        this.chargeT <= 0 && Math.random() < 0.02 && (this.chargeT = 20),
        this.chargeT > 0
          ? (this.chargeT--,
            (t.goal = [s.pos[0], s.pos[1] + 0.5 * s.h, s.pos[2]]),
            (t.mod = 2),
            void (
              this.distTo(s) < 1.2 &&
              this.attackCd <= 0 &&
              (this.melee(s), (this.chargeT = 0))
            ))
          : ((t.goal = [
              s.pos[0] + 3 * Math.cos(0.05 * this.age),
              s.pos[1] + 2,
              s.pos[2] + 3 * Math.sin(0.05 * this.age),
            ]),
            void (t.look = s))
      );
    }
    const s = this.owner && !this.owner.dead ? this.owner.pos : this.pos;
    ((!this.goal || this.near(this.goal, 1) || Math.random() < 0.02) &&
      (this.goal = [s[0] + randInt(-7, 7), s[1] + randInt(0, 4), s[2] + randInt(-7, 7)]),
      (t.goal = this.goal));
  }
  setupAnim(t, s) {
    const e = t.parts,
      i = this.age + s;
    emHead(e.head, this, s);
    const h = 0.1 * Math.cos((5.5 * i * Math.PI) / 180);
    (e.right_arm &&
      ((e.right_arm.zRot = Math.PI / 5 + h),
      (e.right_arm.xRot = this.chargeT > 0 ? 0.8 * -Math.PI : -0.3)),
      e.left_arm && (e.left_arm.zRot = -(Math.PI / 5 + h)),
      e.right_wing &&
        ((e.right_wing.yRot = 0.47 + 0.3 * Math.cos((45.836624 * i * Math.PI) / 180)),
        (e.right_wing.xRot = 0.47),
        (e.right_wing.zRot = -0.47)),
      e.left_wing &&
        ((e.left_wing.yRot = -(0.47 + 0.3 * Math.cos((45.836624 * i * Math.PI) / 180))),
        (e.left_wing.xRot = 0.47),
        (e.left_wing.zRot = 0.47)));
  }
  texKey(t) {
    return t.etex(this.chargeT > 0 ? "entity/illager/vex_charging" : "entity/illager/vex");
  }
  attachments(t, s, e, i) {
    const h = this.hand;
    return {
      right_arm: (s) => {
        (M4.translate(s, 0.0625, 0.4, 0),
          M4.scale(s, 0.6, 0.6, 0.6),
          t.drawHeldItem(s, h, !1, e, i, this, null));
      },
    };
  }
}
(defVMob("pillager", { cls: Pillager, hand: "crossbow", xp: 5, shadowR: 0.4, T: { hostile: !0 } }),
  defVMob("vindicator", {
    cls: Vindicator,
    hand: "iron_axe",
    xp: 5,
    shadowR: 0.4,
    T: { hostile: !0 },
  }),
  defVMob("evoker", { cls: Evoker, xp: 10, shadowR: 0.4, T: { hostile: !0 } }),
  defVMob("illusioner", {
    cls: SkeletonKind,
    hand: "bow",
    bow: !0,
    xp: 5,
    shadowR: 0.4,
    tex: () => "entity/illager/illusioner",
    T: { hostile: !0 },
  }),
  defVMob("vex", {
    cls: Vex,
    ai: "fly",
    xp: 3,
    shadowR: 0,
    T: { hostile: !0, attack: 9 },
    stepSound: !1,
    hover: !0,
    bright: !0,
  }),
  (Evoker.prototype.ranged = Evoker.prototype.ranged),
  (VMOB.illusioner.anim = (t, s, e) => Illager.prototype.setupAnim.call(s, t, e)));
class Ravager extends VMob {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h),
      (this.roarT = 0),
      (this.stunT = 0),
      (this.atkT = 0),
      (this.persistent = !1));
  }
  wantsPlayer() {
    return this.game.difficulty > 0;
  }
  think(t) {
    if (this.stunT > 0) return (this.stunT--, void (0 === this.stunT && (this.roarT = 20)));
    if (this.roarT > 0) {
      if (10 === --this.roarT) {
        this.sound("roar");
        for (const t of this.game.entities)
          if (t instanceof Living && t !== this && !(t instanceof Illager) && t.distTo(this) < 4) {
            t.hurt(6, { type: "mob", attacker: this });
            const s = t.pos[0] - this.pos[0],
              e = t.pos[2] - this.pos[2],
              i = Math.hypot(s, e) || 1;
            ((t.vel[0] += (s / i) * 1), (t.vel[2] += (e / i) * 1), (t.vel[1] = 0.3));
          }
      }
    } else if (
      (VMob.prototype.think.call(this, t),
      this.collidedH && this.age % 5 == 0 && !1 !== this.game.rule("mob_griefing"))
    ) {
      const t = Math.floor(this.pos[0] - 1.6 * Math.sin(this.yaw)),
        s = Math.floor(this.pos[2] - 1.6 * Math.cos(this.yaw));
      for (let e = 0; e < 3; e++) {
        const i = this.world.getBlock(t, Math.floor(this.pos[1]) + e, s),
          h = BLOCKS[i].key;
        /leaves$|^(wheat|carrots|potatoes|beetroots|melon_stem|pumpkin_stem)$/.test(h) &&
          (this.game.breakBlockAt
            ? this.game.breakBlockAt(t, Math.floor(this.pos[1]) + e, s)
            : this.world.setBlock(t, Math.floor(this.pos[1]) + e, s, 0, 0));
      }
    }
  }
  melee(t) {
    (super.melee(t),
      (this.atkT = 10),
      t.usingItem &&
        t.inv &&
        t.inv.held &&
        "shield" === ITEMS[t.inv.held.id].key &&
        (this.stunT = 40));
  }
  afterMove() {
    this.atkT > 0 && this.atkT--;
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, h] = emLimbs(this, s);
    (e.head && ((e.head.yRot = -(this.headYaw || 0)), (e.head.xRot = -(this.pitch || 0))),
      emQuad(t, i, 0.4 * h),
      e.mouth &&
        (e.mouth.xRot =
          this.atkT > 0 ? 0.6 * Math.sin((this.atkT / 10) * Math.PI) : this.roarT > 0 ? 0.8 : 0),
      e.neck && this.stunT > 0 && (e.neck.y = 1 * Math.sin(this.age) - 7));
  }
  texKey(t) {
    return t.etex("entity/illager/ravager");
  }
}
defVMob("ravager", {
  cls: Ravager,
  xp: 20,
  shadowR: 1.1,
  T: { hostile: !0 },
  reach: 1.2,
  attackCd: 10,
});
class Breeze extends VMob {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h), (this.st = "idle"), (this.stT = 0), (this.persistent = !1));
  }
  hurt(t, s) {
    return s && ("arrow" === s.type || s.projectile)
      ? (this.sound("deflect"), !1)
      : super.hurt(t, s);
  }
  wantsPlayer() {
    return this.game.difficulty > 0;
  }
  ranged(t, s, e) {
    if (((t.look = s), this.stT++, "idle" === this.st && this.stT > 30))
      e < 20 && this.canSee(s) && Math.random() < 0.5
        ? ((this.st = "shoot"),
          (this.stT = 0),
          (this.anims = { SHOOT: this.age }),
          this.sound("inhale"))
        : this.onGround &&
          ((this.st = "jump"),
          (this.stT = 0),
          (this.anims = { JUMP: this.age }),
          this.sound("charge"));
    else if ("shoot" === this.st && 20 === this.stT) {
      const [t, e, i] = lookVec(this, s),
        h =
          "undefined" != typeof Thrown
            ? new Thrown(
                this.game,
                this.pos[0] + t,
                this.pos[1] + 0.6 * this.h,
                this.pos[2] + i,
                [0.7 * t, 0.7 * e, 0.7 * i],
                this,
                "wind_charge",
              )
            : null;
      (h && ((h.breeze = !0), this.game.entities.push(h)), this.sound("shoot"));
    } else if ("jump" === this.st && 10 === this.stT) {
      const t = Math.random() * Math.PI * 2;
      ((this.vel[1] = 0.9),
        (this.vel[0] = 0.4 * Math.cos(t)),
        (this.vel[2] = 0.4 * Math.sin(t)),
        this.sound("jump"));
    } else this.stT > 40 && ((this.st = "idle"), (this.stT = 0), (this.anims = {}));
  }
  think(t) {
    (this.target || ((this.st = "idle"), (this.stT = 0)), VMob.prototype.think.call(this, t));
  }
  onLand(t) {
    "jump" === this.st && this.sound("land");
  }
  setupAnim(t, s) {
    const e = t.parts,
      i = this.age + s;
    EM.anim(t, "BreezeAnimation.IDLE", i / 20);
    for (const e in this.anims)
      EM.anim(t, "BreezeAnimation." + e, (this.age - this.anims[e] + s) / 20);
    (e.head && ((e.head.yRot = -(this.headYaw || 0)), (e.head.xRot = -(this.pitch || 0))),
      e.rods && (e.rods.yRot = i * Math.PI * 0.1));
  }
  texKey(t) {
    return t.etex("entity/breeze/breeze");
  }
  drawLayers(t, s, e, i, h, a, o) {
    const r = EM.get(s, "breeze#wind"),
      n = s.etex("entity/breeze/breeze_eyes"),
      l = EM.get(s, "breeze#eyes");
    if (r) {
      (EM.reset(r), EM.copy(e, r));
      const t = s.gl;
      (t.enable(t.BLEND),
        t.blendFunc(t.SRC_ALPHA, t.ONE_MINUS_SRC_ALPHA),
        s.drawEM(r, s.etex("entity/breeze/breeze_wind"), i, [1, 1], a, { cull: !1 }),
        t.disable(t.BLEND));
    }
    l && n && (EM.reset(l), EM.copy(e, l), s.drawEMGlow(l, n, i, a, {}));
  }
}
defVMob("breeze", {
  cls: Breeze,
  xp: 10,
  shadowR: 0.4,
  T: { hostile: !0 },
  stepSound: !1,
  immune: ["fall"],
});
class Creaking extends VMob {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h), (this.heart = null), (this.frozen = !1), (this.persistent = !1));
  }
  extraSave() {
    return { heart: this.heart };
  }
  extraLoad(t) {
    this.heart = t.heart || null;
  }
  wantsPlayer() {
    return this.game.difficulty > 0;
  }
  watched() {
    const t = this.game.player;
    if (t.creative || this.distTo(t) > 24) return !1;
    const s = this.pos[0] - t.pos[0],
      e = this.pos[1] + 1.5 - (t.pos[1] + 1.6),
      i = this.pos[2] - t.pos[2],
      h = Math.hypot(s, e, i) || 1;
    return (
      (s * (-Math.sin(t.yaw) * Math.cos(t.pitch)) +
        e * Math.sin(t.pitch) +
        i * (-Math.cos(t.yaw) * Math.cos(t.pitch))) /
        h >
        0.8 && this.canSee(t)
    );
  }
  think(t) {
    if (this.heart) {
      const [s, e, i] = this.heart;
      if ("creaking_heart" !== BLOCKS[this.world.getBlock(s, e, i)].key || this.game.isDay())
        return (
          (this.dead = !0),
          particleBurst(this.game, "poof", this.pos[0], this.pos[1] + 1, this.pos[2], 20, 1.5),
          void this.sound("death")
        );
      if (Math.hypot(s - this.pos[0], i - this.pos[2]) > 32) return void (t.goal = [s, e, i]);
    }
    const s = this.frozen;
    ((this.frozen = this.watched()),
      this.frozen
        ? s || this.sound("freeze")
        : (s && this.sound("unfreeze"), VMob.prototype.think.call(this, t)));
  }
  hurt(t, s) {
    return this.heart
      ? ((this.anims.INVULNERABLE = this.age),
        this.sound("sway"),
        Sound.ev("block.creaking_heart.hurt", [this.heart[0], this.heart[1], this.heart[2]], 1, 1),
        (this.hurtTime = 0),
        !1)
      : super.hurt(t, s);
  }
  moveBy(t) {
    this.frozen ? this.travel(0, 0, 0, !1) : super.moveBy(t);
  }
  melee(t) {
    (super.melee(t), (this.anims.ATTACK = this.age));
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, h] = emLimbs(this, s);
    (e.head && ((e.head.yRot = -(this.headYaw || 0)), (e.head.xRot = -(this.pitch || 0))),
      this.frozen || EM.walk(t, "CreakingAnimation.CREAKING_WALK", i, h, 1, 1));
    for (const e in this.anims)
      EM.anim(t, "CreakingAnimation.CREAKING_" + e, (this.age - this.anims[e] + s) / 20);
  }
  texKey(t) {
    return t.etex("entity/creaking/creaking");
  }
  drawLayers(t, s, e, i, h, a) {
    if (this.frozen) return;
    const o = s.etex("entity/creaking/creaking_eyes"),
      r = EM.get(s, "creaking#eyes");
    o && r && (EM.reset(r), EM.copy(e, r), s.drawEMGlow(r, o, i, a, {}));
  }
}
(defVMob("creaking", { cls: Creaking, xp: 0, shadowR: 0.6, T: { hostile: !0 }, reach: 0.8 }),
  (BLOCK_RANDOM_TICK.creaking_heart = (t, s, e, i, h, a) => {
    if (t.isDay() || 0 === t.difficulty) return;
    const o = t.world,
      r = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[Features.propOf(h, a, "axis") || "y"],
      log = (t, h, a) => /pale_oak_(log|wood)$/.test(BLOCKS[o.getBlock(s + t, e + h, i + a)].key);
    if (
      log(r[0], r[1], r[2]) &&
      log(-r[0], -r[1], -r[2]) &&
      !t.entities.some(
        (t) =>
          t instanceof Creaking &&
          t.heart &&
          t.heart[0] === s &&
          t.heart[1] === e &&
          t.heart[2] === i,
      )
    )
      for (let h = 0; h < 10; h++) {
        const h = s + randInt(-16, 16),
          a = i + randInt(-16, 16);
        let r = e + 8;
        for (; r > e - 8 && !SOLIDCUBE[o.getBlock(h, r - 1, a)];) r--;
        if (o.getBlock(h, r, a) || o.getBlock(h, r + 1, a) || o.getBlock(h, r + 2, a)) continue;
        const n = spawnAt(t, "creaking", h + 0.5, r, a + 0.5);
        return (
          (n.heart = [s, e, i]),
          (n.persistent = !1),
          void Sound.ev("block.creaking_heart.spawn", [s + 0.5, e, i + 0.5], 1, 1)
        );
      }
  }));
class Warden extends VMob {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h),
      (this.st = "emerge"),
      (this.stT = 0),
      (this.anims = { EMERGE: this.age }),
      (this.angerAt = new Map()),
      (this.boomCd = 0),
      (this.sniffT = 0),
      (this.persistent = !0),
      (this.idleCalm = 0),
      this.sound("emerge"));
  }
  extraSave() {
    return { st: "dig" === this.st ? "idle" : this.st };
  }
  extraLoad(t) {
    ((this.st = "idle"), (this.anims = {}));
  }
  wantsPlayer() {
    return !1;
  }
  hurt(t, s) {
    if ("emerge" === this.st || "dig" === this.st) return !1;
    const e = s && s.attacker,
      i = !!e && e === this.game.player && this.game.player.creative,
      h = super.hurt(t, s);
    return (i && this.target === e ? (this.target = null) : h && e && this.addAnger(e, 100), h);
  }
  addAnger(t, s) {
    (t === this.game.player && this.game.player.creative) ||
      (this.angerAt.set(t, Math.min(150, (this.angerAt.get(t) || 0) + s)),
      (this.angerAt.get(t) || 0) >= 80 && this.target !== t && this.roarAt(t));
  }
  roarAt(t) {
    ((this.target = t),
      (this.anims.ROAR = this.age),
      (this.roarT = 84),
      this.sound("roar"),
      (this.sonicT = 0),
      (this.boomCd = 200));
  }
  findTarget() {
    const t = this.game.player,
      bad = (s) => s.dead || s.deathTime || (s === t && (t.creative || t.spectator));
    if (
      (this.target &&
        bad(this.target) &&
        (this.angerAt.delete(this.target), (this.target = null), (this.sonicT = 0)),
      this.target)
    )
      return;
    let s = null,
      e = 79;
    for (const [t, i] of this.angerAt) i > e && !bad(t) && ((s = t), (e = i));
    s && this.roarAt(s);
  }
  think(t) {
    const s = this.game,
      e = s.player;
    if ((this.stT++, "emerge" !== this.st))
      if ("dig" !== this.st)
        if (this.roarT > 0) this.roarT--;
        else {
          (!e.creative &&
            this.distTo(e) < 16 &&
            !e.sneaking &&
            Math.hypot(e.pos[0] - e.prev[0], e.pos[1] - e.prev[1], e.pos[2] - e.prev[2]) > 0.05 &&
            this.age % 10 == 0 &&
            (this.addAnger(e, 10), this.sound("listening", 0.6)),
            this.age % 120 == 0 &&
              !e.creative &&
              this.distTo(e) < 20 &&
              e.addEffect &&
              e.addEffect("darkness", 0, 260),
            this.boomCd > 0 && this.boomCd--);
          for (const [t, s] of this.angerAt)
            s <= 1 || t.dead
              ? this.angerAt.delete(t)
              : this.age % 20 == 0 && this.angerAt.set(t, s - 1);
          if ((this.findTarget(), !(this.roarT > 0))) {
            if (this.target) {
              const e = this.target,
                i = this.distTo(e);
              if (((t.look = e), this.sonicT > 0)) {
                if (26 === --this.sonicT) {
                  const [t, , h] = lookVec(this, e),
                    a = 1 - ((e.T && e.T.kbRes) || 0);
                  (e.hurt(10, { type: "sonic_boom", attacker: this }) &&
                    a > 0 &&
                    ((e.vel[0] += 2.5 * t * a), (e.vel[1] += 0.5 * a), (e.vel[2] += 2.5 * h * a)),
                    this.sound("sonic_boom", 3));
                  for (let a = 1; a < Math.floor(i); a++)
                    s.particles.spawn(
                      "poof",
                      this.pos[0] + t * a,
                      this.pos[1] + 1.6 + ((e.pos[1] - this.pos[1]) * a) / i,
                      this.pos[2] + h * a,
                      0,
                      0,
                      0,
                    );
                }
                return void (0 === this.sonicT && (this.boomCd = 40));
              }
              return i > 4 && i < 15 && this.boomCd <= 0 && this.canSee(e) && Math.random() < 0.05
                ? ((this.sonicT = 60),
                  (this.anims.SONIC_BOOM = this.age),
                  void this.sound("sonic_charge", 3))
                : ((t.goal = [e.pos[0], e.pos[1], e.pos[2]]),
                  (t.mod = 1.2),
                  void (
                    i < 2.5 &&
                    this.attackCd <= 0 &&
                    (this.melee(e), (this.anims.ATTACK = this.age))
                  ));
            }
            if (Math.random() < 1 / 300) {
              ((this.anims.SNIFF = this.age), this.sound("sniff"));
              const t = s.entities.find(
                (t) =>
                  t instanceof Living &&
                  t !== this &&
                  !(t instanceof Warden) &&
                  !t.dead &&
                  t.distTo(this) < 24 &&
                  !(t === e && e.creative),
              );
              t && this.addAnger(t, 35);
            }
            if (++this.idleCalm > 1200 && !this.angerAt.size)
              return (
                (this.st = "dig"),
                (this.stT = 0),
                (this.anims = { DIG: this.age }),
                void this.sound("dig")
              );
            (this.angerAt.size && (this.idleCalm = 0), VMob.prototype.think.call(this, t));
          }
        }
      else this.stT > 100 && (this.dead = !0);
    else this.stT > 134 && ((this.st = "idle"), (this.anims = {}));
  }
  melee(t) {
    ((this.boomCd = 40),
      super.melee(t),
      t.usingItem &&
        t.inv &&
        t.inv.held &&
        "shield" === ITEMS[t.inv.held.id].key &&
        (t.shieldDown = 100));
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, h] = emLimbs(this, s),
      a = this.age + s;
    e.head && ((e.head.yRot = -(this.headYaw || 0)), (e.head.xRot = -(this.pitch || 0)));
    const o = Math.cos(0.8 * i) * h;
    (e.left_leg && (e.left_leg.xRot = 1.4 * Math.cos(0.6662 * i) * h * 0.7),
      e.right_leg && (e.right_leg.xRot = 1.4 * Math.cos(0.6662 * i + Math.PI) * h * 0.7),
      e.body && (e.body.zRot = 0.1 * o),
      e.left_arm && (e.left_arm.xRot = 1 * -Math.cos(0.6662 * i) * h),
      e.right_arm && (e.right_arm.xRot = 1 * -Math.cos(0.6662 * i + Math.PI) * h));
    const r = 0.1 * Math.sin(0.25 * a) * (this.target ? 2 : 1);
    (e.left_tendril && (e.left_tendril.xRot = r), e.right_tendril && (e.right_tendril.xRot = -r));
    for (const e in this.anims)
      EM.anim(t, "WardenAnimation.WARDEN_" + e, (this.age - this.anims[e] + s) / 20);
  }
  texKey(t) {
    return t.etex("entity/warden/warden");
  }
  drawLayers(t, s, e, i, h, a) {
    const o = this.age + h,
      r = Math.max(0, 0.5 * Math.cos(0.045 * o * (this.target ? 2 : 1)) + 0.2),
      layer = (t, h, o) => {
        const r = EM.get(s, "warden#" + t),
          n = s.etex(h);
        if (!r || !n || o <= 0.02) return;
        (EM.reset(r), EM.copy(e, r));
        const l = s.gl;
        (l.enable(l.BLEND),
          l.blendFunc(l.SRC_ALPHA, l.ONE),
          l.depthFunc(l.LEQUAL),
          s.drawEM(r, n, i, [1, 1], a, { alpha: o, bright: !0 }),
          l.disable(l.BLEND),
          l.depthFunc(l.LESS));
      };
    (layer("bioluminescent", "entity/warden/warden_bioluminescent_layer", 1),
      layer(
        "pulsating_spots",
        "entity/warden/warden_pulsating_spots_1",
        Math.max(0, 0.25 * Math.cos(0.045 * o) + 0.25),
      ),
      layer(
        "pulsating_spots",
        "entity/warden/warden_pulsating_spots_2",
        Math.max(0, 0.25 * Math.cos(0.045 * o + Math.PI) + 0.25),
      ),
      layer("heart", "entity/warden/warden_heart", r),
      layer("tendrils", "entity/warden/warden", this.target ? 0.6 : 0.2));
  }
}
defVMob("warden", {
  cls: Warden,
  xp: 5,
  shadowR: 0.8,
  T: { hostile: !0 },
  reach: 1,
  attackCd: 18,
  knock: 0.8,
  immune: ["fire", "lava", "drown"],
  fearless: !0,
});
class Shulker extends VMob {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h),
      (this.peek = 0),
      (this.peekGoal = 0),
      (this.color = null),
      (this.pos[0] = Math.floor(e) + 0.5),
      (this.pos[2] = Math.floor(h) + 0.5),
      (this.pos[1] = Math.floor(i)),
      (this.persistent = !0));
  }
  extraSave() {
    return { col: this.color };
  }
  extraLoad(t) {
    this.color = t.col || null;
  }
  wantsPlayer() {
    return this.game.difficulty > 0;
  }
  hurt(t, s) {
    if (this.peek < 0.1 && s && "arrow" === s.type) return !1;
    const e = super.hurt(this.peek < 0.1 ? 0.2 * t : t, s);
    return (e && this.health < this.maxHealth / 2 && Math.random() < 0.25 && this.teleport(), e);
  }
  teleport() {
    const t = this.world;
    for (let s = 0; s < 5; s++) {
      const s = Math.floor(this.pos[0]) + randInt(-8, 8),
        e = Math.floor(this.pos[1]) + randInt(-8, 8),
        i = Math.floor(this.pos[2]) + randInt(-8, 8);
      if (0 === t.getBlock(s, e, i) && SOLIDCUBE[t.getBlock(s, e - 1, i)])
        return ((this.pos = [s + 0.5, e, i + 0.5]), this.savePrev(), void this.sound("teleport"));
    }
  }
  think(t) {
    if (
      (Math.random() < 1 / 40 && (this.peekGoal = Math.random() < 0.3 ? 0.3 * Math.random() : 0),
      this.target)
    ) {
      const s = this.target;
      ((t.look = s),
        (this.peekGoal = 1),
        this.attackCd <= 0 &&
          this.distTo(s) < 16 &&
          ((this.attackCd = 20 + 2 * randInt(0, 10)),
          this.game.entities.push(
            new ShulkerBullet(this.game, this.pos[0], this.pos[1] + 0.5, this.pos[2], this, s),
          ),
          this.sound("shoot")));
    }
    this.findTarget();
  }
  moveBy() {
    this.vel = [0, 0, 0];
  }
  afterMove() {
    const t = this.peek;
    ((this.peek += clamp(this.peekGoal - this.peek, -0.05, 0.05)),
      t < 0.05 && this.peek >= 0.05 && this.sound("open"),
      t >= 0.05 && this.peek < 0.05 && this.sound("close"),
      (this.T.armor = this.peek < 0.05 ? 20 : 0));
  }
  setupAnim(t, s) {
    const e = t.parts,
      i = (0.5 + this.peek) * Math.PI,
      h = this.age + s;
    (e.lid &&
      ((e.lid.y = 24 - 16 * (0.5 * Math.sin(i) - 0.5 + 0.5) * 0.5 - 8 * Math.sin(i) * 0),
      (e.lid.y = 16 + 8 * (1 - this.peek) - 0 * this.peek),
      (e.lid.y = 24 - 8 * this.peek),
      (e.lid.yRot =
        this.peek > 0.3
          ? 0 * Math.sin(0.05 * h) + this.peek * Math.PI * 0.05 * Math.sin(0.1 * h)
          : 0)),
      e.head && ((e.head.xRot = -(this.pitch || 0)), (e.head.yRot = -(this.headYaw || 0))));
  }
  texKey(t) {
    return t.etex("entity/shulker/shulker" + (this.color ? "_" + this.color : ""));
  }
  preDraw(t) {}
}
class ShulkerBullet extends Entity {
  constructor(t, s, e, i, h, a) {
    (super(t, s, e, i, 0.3125, 0.3125),
      (this.owner = h),
      (this.target = a),
      (this.vel = [0, 0.15, 0]),
      (this.spriteLayer = void 0));
  }
  tick() {
    (this.savePrev(), this.age++);
    const t = this.target,
      s = this.vel;
    if (!t || t.dead || this.age > 300) return void (this.dead = !0);
    const e = t.pos[0] - this.pos[0],
      i = t.pos[1] + 0.5 * t.h - this.pos[1],
      h = t.pos[2] - this.pos[2],
      a = Math.hypot(e, i, h) || 1;
    if (
      ((s[0] += 0.2 * ((e / a) * 0.15 - s[0])),
      (s[1] += 0.2 * ((i / a) * 0.15 - s[1])),
      (s[2] += 0.2 * ((h / a) * 0.15 - s[2])),
      (this.noClip = !1),
      this.move(s[0], s[1], s[2]),
      a < 0.6)
    )
      return (
        t.hurt(4, { type: "mob", attacker: this.owner }),
        t.addEffect && t.addEffect("levitation", 0, 200),
        Sound.ev("entity.shulker_bullet.hit", this.pos, 1, 1),
        void (this.dead = !0)
      );
    ((this.collidedH || this.onGround) &&
      (Sound.ev("entity.shulker_bullet.hit", this.pos, 1, 1), (this.dead = !0)),
      this.age % 2 == 0 &&
        this.game.particles.spawn("glint", this.pos[0], this.pos[1], this.pos[2], 0, 0, 0));
  }
  drawSelf(t, s, e, i, h) {
    const a = t.renderer,
      o = EM.get(a, "shulker_bullet#main"),
      r = a.etex("entity/shulker/spark");
    if (!o || !r) return;
    EM.reset(o);
    const n = M4.create();
    (M4.translate(n, s[0], s[1] + 0.15, s[2]),
      M4.rotY(n, 0.3 * (this.age + e)),
      M4.rotX(n, 0.2 * (this.age + e)),
      M4.translate(n, 0, -0.15, 0),
      a.drawEM(o, r, n, [1, 1], i, { bright: !0, cull: !1 }));
  }
}
(defVMob("shulker", {
  cls: Shulker,
  xp: 5,
  shadowR: 0,
  T: { hostile: !0 },
  stepSound: !1,
  noDeathFlip: !0,
}),
  defVMob("piglin_brute", {
    cls: Humanoid,
    hand: "golden_axe",
    xp: 20,
    shadowR: 0.4,
    T: { hostile: !0 },
    tex: () => "entity/piglin/piglin_brute",
    zombieArms: !1,
    layer: "piglin_brute#main",
  }),
  (VMOB.piglin_brute.anim = (t, s, e) => {
    emHumanoid(t, s, e, {});
    const i = t.parts;
    (i.right_ear && (i.right_ear.zRot = 0.52 + 0.1 * Math.cos(0.1 * s.age)),
      i.left_ear && (i.left_ear.zRot = -0.52 - 0.1 * Math.cos(0.1 * s.age)),
      s.target &&
        i.right_arm &&
        (i.right_arm.xRot = -1.2 - (s.swingT > 0 ? Math.sin((1 - s.swingT / 6) * Math.PI) : 0)));
  }));
class Zoglin extends VMob {
  wantsPlayer() {
    return this.game.difficulty > 0;
  }
  huntTarget() {
    return (this.age + this.id) % 20
      ? null
      : this.game.entities.find(
          (t) =>
            t instanceof Mob &&
            t !== this &&
            "zoglin" !== t.type &&
            "creeper" !== t.type &&
            !t.dead &&
            t.distTo(this) < 16,
        ) || null;
  }
  melee(t) {
    (super.melee(t), (t.vel[1] += 0.4), (this.atkT = 10));
  }
  afterMove() {
    this.atkT > 0 && this.atkT--;
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, h] = emLimbs(this, s);
    (emQuad(t, i, h),
      e.head &&
        ((e.head.yRot = -(this.headYaw || 0)),
        (e.head.xRot =
          0.87 + (this.atkT > 0 ? 0.6 * -Math.sin(((10 - this.atkT) / 10) * Math.PI) : 0))));
  }
  texKey(t) {
    return t.etex("entity/hoglin/zoglin" + (this.baby ? "_baby" : ""));
  }
}
defVMob("zoglin", { cls: Zoglin, xp: 5, shadowR: 0.7, T: { hostile: !0 } });
class Wither extends VMob {
  constructor(t, s, e, i, h) {
    (super(t, s, e, i, h),
      (this.invulT = 220),
      (this.headTargets = [null, null]),
      (this.skullCd = [0, 0, 0]),
      (this.persistent = !0),
      (this.health = this.maxHealth / 3),
      (this.blockCd = 0));
  }
  extraSave() {
    return { inv: this.invulT };
  }
  extraLoad(t) {
    this.invulT = t.inv || 0;
  }
  get armored() {
    return this.health <= this.maxHealth / 2;
  }
  wantsPlayer() {
    return !0;
  }
  hurt(t, s) {
    return (
      !(this.invulT > 0 || (s && "drown" === s.type)) &&
      (!this.armored || !s || ("arrow" !== s.type && !s.projectile)) &&
      super.hurt(t, s)
    );
  }
  think(t) {
    const s = this.game;
    if (this.invulT > 0)
      return (
        this.invulT--,
        (this.health = Math.min(this.maxHealth, this.health + (this.maxHealth / 220) * (2 / 3))),
        void (
          0 === this.invulT &&
          (s.explode(this.pos[0], this.pos[1] + this.h / 2, this.pos[2], 7, this, !1, !1, !0),
          Sound.ev("entity.wither.spawn", null, 1, 1))
        )
      );
    this.age % 20 == 0 && (this.health = Math.min(this.maxHealth, this.health + 1));
    for (let t = 0; t < 2; t++)
      (!this.headTargets[t] ||
        this.headTargets[t].dead ||
        this.headTargets[t].deathTime ||
        Math.random() < 0.005) &&
        (this.headTargets[t] =
          s.entities.find(
            (t) =>
              t instanceof Living &&
              t !== this &&
              !t.dead &&
              !ENTITY_TAGS.undead.includes(t.type) &&
              t.distTo(this) < 20 &&
              !(t === s.player && s.player.creative),
          ) || null);
    const e = this.target;
    for (let t = 0; t < 3; t++) {
      const s = 0 === t ? e : this.headTargets[t - 1];
      !s ||
        --this.skullCd[t] > 0 ||
        ((this.skullCd[t] = 0 === t ? 40 : 30 + randInt(0, 30)),
        this.shootSkull(t, s, t > 0 && Math.random() < 0.001));
    }
    if (--this.blockCd <= 0 && this.collidedH && !1 !== s.rule("mob_griefing")) {
      this.blockCd = 20;
      const t = Math.floor(this.pos[0]),
        s = Math.floor(this.pos[1]),
        e = Math.floor(this.pos[2]);
      for (let i = -1; i <= 1; i++)
        for (let h = 0; h <= 3; h++)
          for (let a = -1; a <= 1; a++) {
            const o = this.world.getBlock(t + i, s + h, e + a);
            o &&
              BLOCKS[o].hardness >= 0 &&
              BLOCKS[o].hardness < 50 &&
              !IS_FLUID[o] &&
              this.world.setBlock(t + i, s + h, e + a, 0, 0);
          }
    }
    if (e) {
      t.look = e;
      const s = this.armored ? 0 : 5;
      t.goal = [
        e.pos[0] + 6 * Math.cos(0.02 * this.age),
        e.pos[1] + s,
        e.pos[2] + 6 * Math.sin(0.02 * this.age),
      ];
    } else
      (this.findTarget(),
        (this.goal && !this.near(this.goal, 2)) || (this.goal = this.randomGoal(10, 3)),
        (t.goal = this.goal));
  }
  findTarget() {
    if (
      (this.target &&
        (this.target.dead ||
          this.target.deathTime ||
          (this.target === this.game.player && this.game.player.creative)) &&
        (this.target = null),
      !this.target)
    ) {
      const t = this.game.player;
      this.target = !t.creative && this.distTo(t) < 40 ? t : this.headTargets[0];
    }
  }
  headPos(t) {
    const s = this.bodyYaw + [0, -Math.PI / 2, Math.PI / 2][t],
      e = t ? 1.3 : 0;
    return [
      this.pos[0] + Math.cos(s) * e * (t ? 1 : 0),
      this.pos[1] + (t ? 2.2 : 3),
      this.pos[2] + Math.sin(s) * e * (t ? 1 : 0),
    ];
  }
  shootSkull(t, s, e) {
    const i = this.game,
      [h, a, o] = this.headPos(t),
      r = s.pos[0] - h,
      n = s.pos[1] + 0.5 * s.h - a,
      l = s.pos[2] - o,
      d = Math.hypot(r, n, l) || 1,
      p = new WitherSkull(i, h, a, o, [(r / d) * 0.4, (n / d) * 0.4, (l / d) * 0.4], this, e);
    (i.entities.push(p), Sound.ev("entity.wither.shoot", this.pos, 1, 1));
  }
  onDeath() {
    Sound.ev("entity.wither.death", null, 1, 1);
  }
  setupAnim(t, s) {
    const e = t.parts,
      i = this.age + s;
    (e.ribcage && (e.ribcage.xRot = (0.065 + 0.05 * Math.cos(0.1 * i)) * Math.PI),
      e.tail &&
        ((e.tail.xRot = (0.265 + 0.1 * Math.cos(0.1 * i)) * Math.PI),
        (e.tail.y = 6.9 + 10 * Math.cos(e.ribcage.xRot)),
        (e.tail.z = 10 * Math.sin(e.ribcage.xRot) - 0.5)),
      e.center_head &&
        ((e.center_head.yRot = -(this.headYaw || 0)), (e.center_head.xRot = -(this.pitch || 0))));
    for (let t = 0; t < 2; t++) {
      const s = e[t ? "left_head" : "right_head"],
        i = this.headTargets[t];
      if (s && i) {
        const t = i.pos[0] - this.pos[0],
          e = i.pos[2] - this.pos[2];
        s.yRot = 0.8 * -angDelta(Math.atan2(-t, -e), this.bodyYaw);
      }
    }
  }
  renderScale() {
    return 2;
  }
  texKey(t) {
    return t.etex(
      this.invulT > 0 && Math.floor(this.invulT / 5) % 2 == 0
        ? "entity/wither/wither_invulnerable"
        : "entity/wither/wither",
    );
  }
  drawLayers(t, s, e, i, h, a, o) {
    if (!this.armored && this.invulT <= 0) return;
    const r = EM.get(s, "wither#armor"),
      n = s.etex("entity/wither/wither_armor");
    if (!r || !n) return;
    (EM.reset(r), EM.copy(e, r));
    const l = s.gl;
    (l.enable(l.BLEND),
      l.blendFunc(l.ONE, l.ONE),
      l.depthFunc(l.LEQUAL),
      s.drawEM(r, n, i, [1, 1], a, { bright: !0, alpha: 0.6 }),
      l.disable(l.BLEND),
      l.depthFunc(l.LESS));
  }
}
class WitherSkull extends Entity {
  constructor(t, s, e, i, h, a, o) {
    (super(t, s, e, i, 0.3125, 0.3125), (this.vel = h), (this.owner = a), (this.blue = o));
  }
  tick() {
    (this.savePrev(), this.age++);
    const t = this.game,
      s = this.vel,
      e = [this.pos[0] + s[0], this.pos[1] + s[1], this.pos[2] + s[2]];
    for (const s of t.entities) {
      if (s === this.owner || !(s instanceof Living) || s.dead) continue;
      const t = s.box();
      if (
        e[0] > t[0] - 0.15 &&
        e[0] < t[3] + 0.15 &&
        e[1] > t[1] - 0.15 &&
        e[1] < t[4] + 0.15 &&
        e[2] > t[2] - 0.15 &&
        e[2] < t[5] + 0.15
      )
        return void this.hit(s);
    }
    ((this.noClip = !0),
      (this.pos = e),
      (this.noClip = !1),
      SOLIDCUBE[this.world.getBlock(Math.floor(e[0]), Math.floor(e[1]), Math.floor(e[2]))] ||
      this.age > 300
        ? this.hit(null)
        : this.age % 2 == 0 && t.particles.spawn("smoke", e[0], e[1], e[2], 0, 0, 0));
  }
  hit(t) {
    const s = this.game;
    if (t && t.hurt(8, { type: "mob", attacker: this.owner, projectile: !0 })) {
      const e = s.difficulty;
      (e >= 2 && t.addEffect && t.addEffect("wither", 1, 20 * (3 === e ? 40 : 10)),
        (t.dead || t.deathTime) &&
          this.owner &&
          (this.owner.health = Math.min(this.owner.maxHealth, this.owner.health + 5)));
    }
    (s.explode(this.pos[0], this.pos[1], this.pos[2], 1, this.owner, !1, !1, !0), (this.dead = !0));
  }
  drawSelf(t, s, e, i, h) {
    const a = t.renderer,
      o = EM.get(a, "wither_skull#main"),
      r = a.etex(this.blue ? "entity/wither/wither_invulnerable" : "entity/wither/wither");
    if (!o || !r) return;
    EM.reset(o);
    const n = M4.create();
    (M4.translate(n, s[0], s[1], s[2]),
      M4.rotY(n, Math.atan2(-this.vel[0], -this.vel[2])),
      a.drawEM(o, r, n, [h[0], 1], i, {}));
  }
}
function checkWitherBuild(t, s, e, i) {
  const h = t.world,
    soul = (t, s, e) => /^soul_(sand|soil)$/.test(BLOCKS[h.getBlock(t, s, e)].key),
    skull = (t, s, e) => "wither_skeleton_skull" === BLOCKS[h.getBlock(t, s, e)].key;
  for (const [a, o] of [
    [1, 0],
    [0, 1],
  ])
    for (let r = -1; r <= 1; r++) {
      const n = s - a * r,
        l = i - o * r,
        d = e - 1;
      if (
        skull(n, e, l) &&
        skull(n + a, e, l + o) &&
        skull(n - a, e, l - o) &&
        soul(n, d, l) &&
        soul(n + a, d, l + o) &&
        soul(n - a, d, l - o) &&
        soul(n, d - 1, l)
      ) {
        for (const [t, s, i] of [
          [n, e, l],
          [n + a, e, l + o],
          [n - a, e, l - o],
          [n, d, l],
          [n + a, d, l + o],
          [n - a, d, l - o],
          [n, d - 1, l],
        ])
          h.setBlock(t, s, i, 0, 0);
        return (spawnAt(t, "wither", n + 0.5, d - 1, l + 0.5), !0);
      }
    }
  return !1;
}
(defVMob("wither", {
  cls: Wither,
  ai: "fly",
  xp: 50,
  shadowR: 1,
  T: { hostile: !0, flySpeed: 0.6 },
  speed3: 1.6,
  stepSound: !1,
  immune: ["fire", "lava", "drown", "explosion", "wither"],
  boss: !0,
  noDeathFlip: !0,
}),
  (() => {
    const t = Game.prototype.placeAt;
    t &&
      (Game.prototype.placeAt = function (s, e, i, ...h) {
        const a = t.call(this, s, e, i, ...h),
          o = this.world;
        return (
          "wither_skeleton_skull" === BLOCKS[o.getBlock(s, e, i)].key &&
            checkWitherBuild(this, s, e, i),
          a
        );
      });
  })());
//# sourceURL=js/mobs_hostile.js
