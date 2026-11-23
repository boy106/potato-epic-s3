"use strict";
const inWaterAt = (t, s, i, e) => t.waterAt(Math.floor(s), Math.floor(i), Math.floor(e)),
  fishFlop = (t, s, i) => {
    t.inWater || (M4.translate(s, 0.1, 0.1, -0.1), M4.rotZ(s, Math.PI / 2));
  },
  finWag = (t, s, i = 1) =>
    0.45 * -(t.inWater ? 1 : 1.5) * Math.sin((t.inWater ? 0.6 : 1.7) * (t.age + s)) * i;
class Fish extends VMob {
  constructor(t, s, i, e, a) {
    (super(t, s, i, e, a),
      (this.waterBreather = !0),
      (this.persistent = !1),
      (this.fromBucket = !1));
  }
  extraSave() {
    return { fb: this.fromBucket };
  }
  extraLoad(t) {
    ((this.fromBucket = !!t.fb), this.fromBucket && (this.persistent = !0));
  }
  despawn() {
    return !this.fromBucket && super.despawn();
  }
  think(t) {
    (this.age % 40 != 0 ||
      this.leader ||
      (this.leader = this.game.entities.find(
        (t) => t !== this && t.type === this.type && !t.dead && t.distTo(this) < 8 && !t.leader,
      )),
      this.leader && (this.leader.dead || this.leader.distTo(this) > 12) && (this.leader = null),
      this.leader && this.distTo(this.leader) > 2.5
        ? (t.goal = [...this.leader.pos])
        : VMob.prototype.think.call(this, t));
  }
  bucketData() {
    return {};
  }
  preInteract(t, s) {
    return (
      !(!s || "water_bucket" !== ITEMS[s.id].key || void 0 === ITEM_KEY[this.type + "_bucket"]) &&
      (swapHeld(this.game, t, this.type + "_bucket", { mob: this.bucketData() }),
      (this.dead = !0),
      Sound.ev("item.bucket.fill_fish", this.pos, 1, 1),
      !0)
    );
  }
  preDraw(t, s) {
    fishFlop(this, t);
  }
  ambientKind() {
    return this.inWater ? "ambient" : "flop";
  }
}
class Cod extends Fish {
  setupAnim(t, s) {
    t.parts.tail_fin && (t.parts.tail_fin.yRot = finWag(this, s));
  }
  texKey(t) {
    return t.etex("entity/fish/cod");
  }
}
defVMob("cod", {
  cls: Cod,
  ai: "swim",
  xp: 1,
  shadowR: 0.2,
  stepSound: !1,
  swimAcc: 0.007,
  panicMod: 1.25,
});
const SALMON_SIZE = { small: 0.5, medium: 1, large: 1.5 };
class Salmon extends Fish {
  constructor(t, s, i, e, a) {
    (super(t, s, i, e, a),
      (this.size = pickW([
        ["small", 30],
        ["medium", 50],
        ["large", 20],
      ])));
  }
  extraSave() {
    return { ...super.extraSave(), sz: this.size };
  }
  extraLoad(t) {
    (super.extraLoad(t), (this.size = t.sz || "medium"));
  }
  bucketData() {
    return { sz: this.size };
  }
  layerKey() {
    return "small" === this.size
      ? "salmon_small#main"
      : "large" === this.size
        ? "salmon_large#main"
        : "salmon#main";
  }
  setupAnim(t, s) {
    const i = finWag(this, s);
    t.parts.body_back && (t.parts.body_back.yRot = 0.6 * i);
  }
  texKey(t) {
    return t.etex("entity/fish/salmon");
  }
}
defVMob("salmon", {
  cls: Salmon,
  ai: "swim",
  xp: 1,
  shadowR: 0.2,
  stepSound: !1,
  swimAcc: 0.007,
  panicMod: 1.25,
});
class Pufferfish extends Fish {
  constructor(t, s, i, e, a) {
    (super(t, s, i, e, a), (this.puff = 0), (this.puffT = 0), (this.deflT = 0));
  }
  layerKey() {
    return ["pufferfish_small#main", "pufferfish_medium#main", "pufferfish_big#main"][this.puff];
  }
  afterMove() {
    const t = this.game,
      s = t.entities.filter(
        (s) =>
          s !== this &&
          s instanceof Living &&
          !s.dead &&
          s.distTo(this) < 2.5 &&
          !(s instanceof Fish) &&
          "axolotl" !== s.type &&
          !(s === t.player && (t.player.creative || t.player.spectator)),
      );
    if (
      (s.length && this.inWater
        ? ((this.deflT = 0),
          this.puff < 2 &&
            ++this.puffT > (this.puff ? 40 : 1) &&
            (this.puff++, (this.puffT = 0), this.sound("blow_up")))
        : this.puff > 0 &&
          ++this.deflT > 60 &&
          (this.puff--, (this.deflT = 0), (this.puffT = 0), this.sound("blow_out")),
      this.puff > 0)
    )
      for (const t of s)
        t.distTo(this) < 0.6 + 0.4 * this.puff &&
          t.hurt(1 + this.puff, { type: "mob", attacker: this, knockFrom: this.pos }) &&
          (t.addEffect && t.addEffect("poison", 0, 60 * this.puff), this.sound("sting"));
  }
  setupAnim(t, s) {
    const i = t.parts,
      e = this.age + s;
    for (const t of ["left_blue_fin", "right_blue_fin", "left_fin", "right_fin"])
      i[t] &&
        (i[t].zRot = (t.startsWith("left") ? -1 : 1) * (0.2 + Math.cos(1.3 * e) * Math.PI * 0.05));
  }
  texKey(t) {
    return t.etex("entity/fish/pufferfish");
  }
}
defVMob("pufferfish", {
  cls: Pufferfish,
  ai: "swim",
  xp: 1,
  shadowR: 0.2,
  stepSound: !1,
  swimAcc: 0.007,
  panicMod: 1.25,
});
class TropicalFish extends Fish {
  constructor(t, s, i, e, a) {
    (super(t, s, i, e, a),
      (this.shape = randInt(0, 1)),
      (this.pattern = randInt(0, 5)),
      (this.base = randInt(0, 15)),
      (this.pcol = randInt(0, 15)));
  }
  extraSave() {
    return { ...super.extraSave(), v: [this.shape, this.pattern, this.base, this.pcol] };
  }
  extraLoad(t) {
    (super.extraLoad(t), t.v && ([this.shape, this.pattern, this.base, this.pcol] = t.v));
  }
  bucketData() {
    return { v: [this.shape, this.pattern, this.base, this.pcol] };
  }
  get packed() {
    return this.shape | (this.pattern << 8) | (this.base << 16) | (this.pcol << 24);
  }
  layerKey() {
    return this.shape ? "tropical_fish_large#main" : "tropical_fish_small#main";
  }
  setupAnim(t, s) {
    t.parts.tail && (t.parts.tail.yRot = finWag(this, s));
  }
  texKey(t) {
    const s = this.shape ? "b" : "a";
    return t.etexMix([
      { p: "entity/fish/tropical_" + s, c: dyeRGB(DYES[this.base]) },
      {
        p: "entity/fish/tropical_" + s + "_pattern_" + (this.pattern + 1),
        c: dyeRGB(DYES[this.pcol]),
      },
    ]);
  }
}
defVMob("tropical_fish", {
  cls: TropicalFish,
  ai: "swim",
  xp: 1,
  shadowR: 0.15,
  stepSound: !1,
  swimAcc: 0.007,
  panicMod: 1.25,
});
class Squid extends VMob {
  constructor(t, s, i, e, a) {
    (super(t, s, i, e, a),
      (this.waterBreather = !0),
      (this.tent = 0),
      (this.tentSpd = 0.1 + 0.1 * Math.random()),
      (this.bodyPitch = 0),
      (this.darkT = 0),
      (this.persistent = !1));
  }
  think(t) {
    if (
      ((this.tent += this.tentSpd),
      this.tent > 2 * Math.PI &&
        ((this.tent -= 2 * Math.PI),
        Math.random() < 0.1 && (this.tentSpd = 0.1 + 0.1 * Math.random())),
      this.panic > 0)
    ) {
      this.panic--;
      const s = this.lastAttacker,
        i =
          s && !s.dead && s.pos
            ? [this.pos[0] - s.pos[0], this.pos[1] - s.pos[1], this.pos[2] - s.pos[2]]
            : null,
        e = i ? Math.hypot(i[0], i[1], i[2]) : 99;
      if (this.inWater && e > 0.01 && e < 10) {
        const s = this.world,
          a = Math.floor(this.pos[0] + i[0]),
          h = Math.floor(this.pos[1] + i[1]),
          r = Math.floor(this.pos[2] + i[2]),
          o = 0 === s.getBlock(a, h, r);
        if ((o && (i[1] = 0), o || s.waterAt(a, h, r))) {
          const t = Math.hypot(i[0], i[1], i[2]);
          this.fleeV =
            t > 0.01
              ? [i[0] / t, i[1] / t, i[2] / t, Math.max(1, (t * (3 - Math.max(0, e - 5) / 5)) / 4)]
              : null;
        }
        const n = this.fleeV;
        if (n)
          return void (
            this.tent < Math.PI &&
            ((t.mod = n[3]),
            (t.goal = [this.pos[0] + 4 * n[0], this.pos[1] + 4 * n[1], this.pos[2] + 4 * n[2]]))
          );
      }
    } else this.fleeV = null;
    this.tent < Math.PI &&
      this.inWater &&
      ((!this.goal || this.near(this.goal, 1.5) || Math.random() < 0.01) &&
        (this.goal = this.randomGoal(10, 4)),
      (t.goal = this.goal));
  }
  hurt(t, s) {
    const i = super.hurt(t, s);
    if (i && this.inWater) {
      for (let t = 0; t < 30; t++) {
        const t = this.game.particles.spawn(
          "smoke",
          this.pos[0],
          this.pos[1] + 0.5,
          this.pos[2],
          0.3 * (Math.random() - 0.5),
          0.3 * (Math.random() - 0.5),
          0.3 * (Math.random() - 0.5),
        );
        t && (t.col = "glow_squid" === this.type ? [60, 220, 210] : [10, 10, 20]);
      }
      (this.sound("squirt"), "glow_squid" === this.type && (this.darkT = 100));
    }
    return i;
  }
  afterMove() {
    this.darkT > 0 && this.darkT--;
    const t = this.vel;
    this.bodyPitch +=
      0.1 *
      (Math.atan2(Math.hypot(t[0], t[2]), t[1] + 0.001) * (this.inWater ? 1 : 0) - this.bodyPitch);
  }
  setupAnim(t, s) {
    const i = t.parts,
      e = this.tent + this.tentSpd * s,
      a = this.inWater
        ? (Math.abs(Math.sin(e)), 0 + (1 - 0.5 * Math.cos(2 * e) - 0.5) * Math.PI * 0.25 + 0.15)
        : 0;
    for (let t = 0; t < 8; t++)
      i["tentacle" + t] && (i["tentacle" + t].xRot = this.inWater ? a : (Math.PI / 2) * 0 + 0.1);
  }
  preDraw(t, s) {
    (M4.translate(t, 0, 0.5, 0),
      M4.rotX(t, 0.6 * -(this.bodyPitch - Math.PI / 2) * (this.inWater ? 1 : 0)),
      M4.translate(t, 0, -0.5, 0));
  }
  texKey(t) {
    return t.etex("entity/squid/" + this.type + (this.baby ? "_baby" : ""));
  }
}
(defVMob("squid", { cls: Squid, ai: "swim", xp: 2, shadowR: 0.4, stepSound: !1, swimAcc: 0.02 }),
  defVMob("glow_squid", {
    cls: Squid,
    ai: "swim",
    xp: 2,
    shadowR: 0.4,
    stepSound: !1,
    swimAcc: 0.02,
    bright: !0,
  }),
  Object.defineProperty(VMOB.glow_squid, "bright", { get: () => !0 }));
class Dolphin extends VMob {
  constructor(t, s, i, e, a) {
    (super(t, s, i, e, a),
      (this.waterBreather = !0),
      (this.breath = 4800),
      (this.persistent = !1),
      (this.fed = !1));
  }
  wantsPlayer() {
    return !1;
  }
  think(t) {
    const s = this.game.player,
      i = this.world;
    if (this.inWater) {
      if ((this.breath--, this.breath < 400)) {
        let s = Math.floor(this.pos[1]);
        for (; s < 320 && inWaterAt(i, this.pos[0], s + 1, this.pos[2]);) s++;
        return (
          (t.goal = [this.pos[0], s + 1.5, this.pos[2]]),
          (t.mod = 1.5),
          void (
            inWaterAt(i, this.pos[0], this.pos[1] + this.h + 0.2, this.pos[2]) ||
            (this.breath = 4800)
          )
        );
      }
      if (
        (this.breath <= 0 && this.age % 20 == 0 && this.hurt(2, { type: "drown" }),
        s.inWater &&
          s.swimming &&
          !s.creative &&
          this.distTo(s) < 10 &&
          (s.addEffect && this.age % 20 == 0 && s.addEffect("dolphins_grace", 0, 100),
          this.distTo(s) > 3))
      )
        return ((t.goal = [s.pos[0], s.pos[1], s.pos[2]]), (t.mod = 4), void (t.look = s));
      (Math.random() < 1 / 300 &&
        !inWaterAt(i, this.pos[0], this.pos[1] + 2, this.pos[2]) &&
        inWaterAt(i, this.pos[0], this.pos[1], this.pos[2]) &&
        ((this.vel[1] = 0.8),
        (this.vel[0] += 0.6 * -Math.sin(this.yaw)),
        (this.vel[2] += 0.6 * -Math.cos(this.yaw)),
        this.sound("jump")),
        VMob.prototype.think.call(this, t));
    } else this.flop();
  }
  moveBy(t) {
    if (!this.inWater)
      return (
        this.travel(0, 0, 0, !1),
        (this.dry = (this.dry || 0) + 1),
        void (this.dry > 2400 && this.age % 20 == 0 && this.hurt(1, { type: "drown" }))
      );
    ((this.dry = 0), VMob.prototype.moveBy.call(this, t));
  }
  preInteract(t, s) {
    if (s && /^(cod|salmon)$/.test(ITEMS[s.id].key)) {
      (useOne(this.game, t), this.sound("eat"), (this.fed = !0));
      for (let t = 0; t < 7; t++)
        this.game.particles.spawn(
          "happy_villager",
          this.pos[0] + (Math.random() - 0.5),
          this.pos[1] + 0.5,
          this.pos[2] + (Math.random() - 0.5),
          0,
          0.02,
          0,
        );
      return !0;
    }
    return !1;
  }
  setupAnim(t, s) {
    const i = t.parts,
      [e, a] = emLimbs(this, s),
      h = this.vel;
    (i.body &&
      (i.body.xRot =
        clamp(-Math.atan2(h[1], Math.hypot(h[0], h[2]) + 0.001), -1, 1) * (this.inWater ? 1 : 0.3)),
      i.head && (i.head.yRot = 0.3 * -(this.headYaw || 0)));
    const r = Math.hypot(h[0], h[2]) > 1e-4 ? 1 : 0.2;
    (i.tail && (i.tail.xRot = -0.1 * Math.cos(0.3 * (this.age + s)) * r),
      i.tail_fin && (i.tail_fin.xRot = -0.2 * Math.cos(0.3 * (this.age + s)) * r));
  }
  texKey(t) {
    return t.etex("entity/dolphin/dolphin" + (this.baby ? "_baby" : ""));
  }
  ambientKind() {
    return this.inWater ? "ambient_water" : "ambient";
  }
}
defVMob("dolphin", {
  cls: Dolphin,
  ai: "swim",
  xp: 2,
  shadowR: 0.5,
  stepSound: !1,
  swimAcc: 0.024,
  fights: !0,
  T: { attack: 3 },
});
const AXOLOTL_COLORS = ["lucy", "wild", "gold", "cyan", "blue"];
class Axolotl extends VMob {
  constructor(t, s, i, e, a) {
    (super(t, s, i, e, a),
      (this.variant = Math.random() < 1 / 1200 ? 4 : randInt(0, 3)),
      (this.deadT = 0),
      (this.dry = 0),
      (this.fromBucket = !1),
      (this.waterBreather = !0));
  }
  extraSave() {
    return { var: this.variant, fb: this.fromBucket };
  }
  extraLoad(t) {
    ((this.variant = 0 | t.var),
      (this.fromBucket = !!t.fb),
      this.fromBucket && (this.persistent = !0));
  }
  compVal(t) {
    return "axolotl/variant" === t ? AXOLOTL_COLORS[this.variant] : void 0;
  }
  get ai() {
    return "amph";
  }
  wantsPlayer() {
    return !1;
  }
  huntTarget() {
    return (this.age + this.id) % 20
      ? null
      : this.game.entities.find(
          (t) =>
            !t.dead &&
            !t.deathTime &&
            t.inWater &&
            /^(cod|salmon|pufferfish|tropical_fish|squid|glow_squid|drowned|guardian|elder_guardian|tadpole)$/.test(
              t.type,
            ) &&
            t.distTo(this) < 8,
        ) || null;
  }
  findTarget() {
    (this.target &&
      (this.target.dead || this.target.deathTime || !this.target.inWater) &&
      (this.target = null),
      this.target || (this.target = this.huntTarget()));
  }
  hurt(t, s) {
    const i = super.hurt(t, s);
    return (
      i &&
        this.health > 0 &&
        this.health < this.maxHealth / 2 &&
        this.inWater &&
        Math.random() < 1 / 3 &&
        this.deadT <= 0 &&
        ((this.deadT = 200),
        this.addEffect && this.addEffect("regeneration", 0, 200),
        (this.target = null)),
      i
    );
  }
  onDeath(t) {
    const s = this.game.player;
    t &&
      t.attacker &&
      t.attacker !== s &&
      s.inWater &&
      this.distTo(s) < 16 &&
      s.addEffect &&
      s.addEffect("regeneration", 0, 100);
  }
  think(t) {
    if (this.deadT > 0)
      return (this.deadT--, void (this.health = Math.min(this.maxHealth, this.health + 0.025)));
    (this.inWater
      ? (this.dry = 0)
      : ++this.dry > 6e3 && this.age % 20 == 0 && this.hurt(1, { type: "drown" }),
      VMob.prototype.think.call(this, t));
  }
  melee(t) {
    if ((super.melee(t), t.dead || t.deathTime)) {
      const t = this.game.player;
      t.inWater && this.distTo(t) < 16 && t.addEffect && t.addEffect("regeneration", 0, 100);
    }
  }
  preInteract(t, s) {
    return s && "water_bucket" === ITEMS[s.id].key && void 0 !== ITEM_KEY.axolotl_bucket
      ? (swapHeld(this.game, t, "axolotl_bucket", {
          mob: { var: this.variant, baby: this.baby ? this.growT : 0 },
        }),
        (this.dead = !0),
        Sound.ev("item.bucket.fill_axolotl", this.pos, 1, 1),
        !0)
      : !(!s || !isFood("axolotl_food", s.id)) &&
          (this.baby
            ? ((this.growT -= Math.floor(0.1 * this.growT)),
              swapHeld(this.game, t, "water_bucket"),
              !0)
            : this.breedCd <= 0 &&
              !this.loveT &&
              ((this.loveT = 600), swapHeld(this.game, t, "water_bucket"), this.sound("eat"), !0));
  }
  spawnChild(t) {
    const s = super.spawnChild(t);
    return (
      (s.variant = Math.random() < 1 / 1200 ? 4 : Math.random() < 0.5 ? this.variant : t.variant),
      s
    );
  }
  setupAnim(t, s) {
    const i = t.parts,
      [e, a] = emLimbs(this, s),
      h = this.age + s;
    if (this.baby) {
      const s = "BabyAxolotlAnimation.";
      return void (this.deadT > 0
        ? EM.anim(t, s + "BABY_AXOLOTL_PLAY_DEAD", h / 20)
        : this.inWater
          ? EM.anim(t, a > 0.05 ? s + "BABY_AXOLOTL_SWIM" : s + "IDLE_UNDERWATER", h / 20)
          : EM.walk(
              t,
              a > 0.05 ? s + "AXOLOTL_WALK_FLOOR" : s + "BABY_AXOLOTL_IDLE_FLOOR",
              a > 0.05 ? e : h,
              a > 0.05 ? a : 1,
              1,
              2,
            ));
    }
    if ((i.head && (i.head.yRot = 0.5 * -(this.headYaw || 0)), this.deadT > 0)) {
      i.body && (i.body.zRot = (Math.PI / 2) * 0.9);
      for (const t of ["right_front_leg", "left_front_leg", "right_hind_leg", "left_hind_leg"])
        i[t] && ((i[t].xRot = 0.5), (i[t].zRot = t.startsWith("right") ? -0.6 : 0.6));
    } else {
      if (this.inWater) {
        const t = a > 0.05 ? 1 : 0.3,
          s = h * (a > 0.05 ? 0.33 : 0.09);
        (i.body && (i.body.xRot = clamp(4 * -this.vel[1], -0.6, 0.6)),
          i.tail && (i.tail.yRot = 0.5 * Math.sin(s) * t),
          i.head && (i.head.yRot += 0.15 * Math.sin(s + 1) * t));
        for (const [t, e] of [
          ["right_front_leg", 1],
          ["left_front_leg", -1],
          ["right_hind_leg", 1],
          ["left_hind_leg", -1],
        ])
          i[t] &&
            ((i[t].xRot = a > 0.05 ? 1.88 : 0.2),
            (i[t].zRot = e * (a > 0.05 ? 0 : 0.6 + 0.1 * Math.cos(s))));
      } else (emQuad(t, 1.5 * e, a), i.tail && (i.tail.yRot = 0.3 * Math.sin(0.6662 * e) * a));
      for (const t of ["top_gills", "left_gills", "right_gills"])
        if (i[t]) {
          const s = 0.15 * Math.sin(0.1 * h);
          "top_gills" === t
            ? (i[t].xRot = -0.2 + s)
            : (i[t].yRot = ("left_gills" === t ? -1 : 1) * (0.3 + s));
        }
    }
  }
  texKey(t) {
    return t.etex(
      "entity/axolotl/axolotl_" + AXOLOTL_COLORS[0 | this.variant] + (this.baby ? "_baby" : ""),
    );
  }
  ambientKind() {
    return this.inWater ? "idle_water" : "idle_air";
  }
}
defVMob("axolotl", {
  cls: Axolotl,
  food: "axolotl_food",
  xp: 2,
  shadowR: 0.3,
  stepSound: !1,
  waterOk: !0,
  swimAcc: 0.025,
  landSpeedMul: 0.015,
  fights: !0,
  T: { attack: 2 },
});
const NAUTILUS_ARMOR = {
  copper_nautilus_armor: "copper",
  iron_nautilus_armor: "iron",
  golden_nautilus_armor: "gold",
  diamond_nautilus_armor: "diamond",
  netherite_nautilus_armor: "netherite",
};
class Nautilus extends VMob {
  constructor(t, s, i, e, a) {
    (super(t, s, i, e, a),
      (this.waterBreather = !0),
      (this.saddled = !1),
      (this.armorItem = null),
      (this.tame = "nautilus" !== s),
      (this.dashCd = 0),
      (this.coral = "zombie_nautilus" === s && Math.random() < 0.5));
  }
  extraSave() {
    return { sad: this.saddled, arm: this.armorItem, tame: this.tame, cor: this.coral };
  }
  extraLoad(t) {
    ((this.saddled = !!t.sad),
      (this.armorItem = t.arm || null),
      (this.tame = !!t.tame),
      (this.coral = !!t.cor));
  }
  dropsOnDeath() {
    return [this.armorItem];
  }
  seat() {
    return [this.pos[0], this.pos[1] + 0.8 * this.h, this.pos[2]];
  }
  get ai() {
    return "swim";
  }
  wantsPlayer() {
    return "zombie_nautilus" === this.type && !this.tame && this.game.difficulty > 0 && !this.rider;
  }
  preInteract(t, s) {
    const i = this.game,
      e = s && ITEMS[s.id].key;
    if (s && isFood("nautilus_food", s.id)) {
      if (!this.tame)
        return (
          swapBucketFood(i, t, s),
          tryTame(this, t, 1 / 3),
          (this.tame = !!this.owner),
          (this.sitting = !1),
          !0
        );
      if (this.health < this.maxHealth)
        return (
          (this.health = Math.min(this.maxHealth, this.health + 3)),
          swapBucketFood(i, t, s),
          this.sound("eat"),
          !0
        );
      if (this.breedCd <= 0 && !this.loveT && !this.baby)
        return ((this.loveT = 600), swapBucketFood(i, t, s), !0);
    }
    return (
      !!this.tame &&
      ("saddle" !== e || this.saddled || this.baby
        ? e && NAUTILUS_ARMOR[e] && !this.armorItem && !this.baby
          ? ((this.armorItem = { ...s, count: 1 }),
            useOne(i, t),
            Sound.ev("item.armor.equip_nautilus", this.pos, 1, 1),
            !0)
          : !(!this.saddled || t.vehicle) && (t.mount(this), (t.yaw = this.yaw), !0)
        : ((this.saddled = !0),
          useOne(i, t),
          Sound.ev("entity.nautilus.saddle", this.pos, 1, 1),
          !0))
    );
  }
  ridden(t, s) {
    const i = this.rider;
    if (!this.saddled) return;
    this.yaw = i.yaw;
    const e = s.fwd || 0;
    if (this.inWater) {
      const t = 0.035 * (this.armorItem, 1);
      ((this.vel[0] += -Math.sin(i.yaw) * Math.cos(i.pitch) * e * t),
        (this.vel[2] += -Math.cos(i.yaw) * Math.cos(i.pitch) * e * t),
        (this.vel[1] += Math.sin(i.pitch) * e * t + (s.jump ? 0.02 : 0)),
        this.dashCd > 0 && this.dashCd--,
        s.sprint &&
          this.dashCd <= 0 &&
          e > 0 &&
          ((this.vel[0] += 1.2 * -Math.sin(i.yaw)),
          (this.vel[2] += 1.2 * -Math.cos(i.yaw)),
          (this.vel[1] += 1.2 * Math.sin(i.pitch)),
          (this.dashCd = 40),
          this.sound("dash")));
    } else t.fwd = e > 0 ? 0.3 : 0;
  }
  moveBy(t) {
    if (this.rider && this.saddled && this.inWater) {
      this.move(this.vel[0], this.vel[1], this.vel[2]);
      for (let t = 0; t < 3; t++) this.vel[t] *= 0.9;
      this.bodyYaw += 0.4 * angDelta(this.yaw, this.bodyYaw);
    } else this.inWater ? VMob.prototype.moveBy.call(this, t) : this.travel(t.fwd, 0, 0.02, !1);
  }
  setupAnim(t, s) {
    const i = t.parts,
      [e, a] = emLimbs(this, s);
    (EM.walk(t, "NautilusAnimation.SWIMMING", this.age + s, 1, 1, Math.max(0.2, 3 * a)),
      i.body && (i.body.yRot = 0.3 * -(this.headYaw || 0)));
  }
  texKey(t) {
    return t.etex(
      "zombie_nautilus" === this.type
        ? "entity/nautilus/zombie_nautilus"
        : "entity/nautilus/nautilus" + (this.baby ? "_baby" : ""),
    );
  }
  drawLayers(t, s, i, e, a, h, r, o) {
    if (this.coral) {
      const t = EM.get(s, "zombie_nautilus_coral#main");
      t &&
        (EM.reset(t),
        EM.copy(i, t),
        s.drawEM(t, s.etex("entity/nautilus/zombie_nautilus_coral"), e, r, h, {
          overlay: o,
          cull: !1,
        }));
    }
    if (this.armorItem && !this.baby) {
      const t = EM.get(s, "nautilus_armor#main");
      t &&
        (EM.reset(t),
        EM.copy(i, t),
        s.drawEM(
          t,
          s.etex("entity/equipment/nautilus_body/" + NAUTILUS_ARMOR[ITEMS[this.armorItem.id].key]),
          e,
          r,
          h,
          { overlay: o },
        ));
    }
    if (this.saddled && !this.baby) {
      const t = EM.get(s, "nautilus#saddle");
      t &&
        (EM.reset(t),
        EM.copy(i, t),
        s.drawEM(t, s.etex("entity/equipment/nautilus_saddle/saddle"), e, r, h, { overlay: o }));
    }
  }
}
function swapBucketFood(t, s, i) {
  /_bucket$/.test(ITEMS[i.id].key) ? swapHeld(t, s, "water_bucket") : useOne(t, s);
}
(defVMob("nautilus", {
  cls: Nautilus,
  food: "nautilus_food",
  xp: 2,
  shadowR: 0.5,
  stepSound: !1,
  swimAcc: 0.011,
}),
  defVMob("zombie_nautilus", {
    cls: Nautilus,
    xp: 5,
    shadowR: 0.5,
    stepSound: !1,
    swimAcc: 0.012,
    T: { hostile: !0 },
  }));
class Guardian extends VMob {
  constructor(t, s, i, e, a) {
    (super(t, s, i, e, a),
      (this.waterBreather = !0),
      (this.beamT = -1),
      (this.spikes = 0),
      (this.tailT = 0),
      (this.persistent = "elder_guardian" === s),
      (this.curseT = 0));
  }
  get elder() {
    return "elder_guardian" === this.type;
  }
  get beamTime() {
    return this.elder ? 60 : 80;
  }
  despawn() {
    return !this.elder && super.despawn();
  }
  hurt(t, s) {
    const i = super.hurt(t, s);
    return (
      i &&
        s &&
        s.attacker &&
        "mob" === s.type &&
        this.beamT < 0 &&
        s.attacker.hurt &&
        Math.random() < 0.6 &&
        s.attacker.hurt(2, { type: "thorns", attacker: this }),
      i
    );
  }
  findTarget() {
    const t = this.game.player;
    (this.target &&
      (this.target.dead ||
        this.target.deathTime ||
        this.distTo(this.target) > 16 ||
        !this.canSee(this.target)) &&
      ((this.target = null), (this.beamT = -1)),
      this.target ||
        (this.age + this.id) % 10 != 0 ||
        (!t.creative &&
        this.game.difficulty > 0 &&
        t.inWater &&
        this.distTo(t) < 16 &&
        this.canSee(t)
          ? (this.target = t)
          : (this.target =
              this.game.entities.find(
                (t) =>
                  ("squid" === t.type || "glow_squid" === t.type || "axolotl" === t.type) &&
                  !t.dead &&
                  t.distTo(this) < 16 &&
                  this.canSee(t),
              ) || null)));
  }
  ranged(t, s, i) {
    if (
      ((t.look = s),
      (t.face = Math.atan2(-(s.pos[0] - this.pos[0]), -(s.pos[2] - this.pos[2]))),
      this.beamT < 0 && ((this.beamT = 0), this.sound((this.inWater, "attack"), 1)),
      ++this.beamT >= this.beamTime)
    ) {
      const t = this.game.difficulty;
      (s.hurt(1 + (3 === t ? 2 : 0), { type: "magic", attacker: this }),
        s.hurt((this.elder ? 5 : 6) * (1 === t ? 0.5 : 3 === t ? 1.5 : 1), {
          type: "mob",
          attacker: this,
        }),
        (this.beamT = -1),
        (this.target = this.target === this.game.player ? this.target : null),
        (this.attackCd = 40));
    }
  }
  think(t) {
    if (this.inWater) {
      if (this.elder && --this.curseT <= 0) {
        this.curseT = 1200;
        const t = this.game.player;
        !t.creative &&
          this.distTo(t) < 50 &&
          t.addEffect &&
          (t.addEffect("mining_fatigue", 2, 6e3),
          Sound.ev("entity.elder_guardian.curse", t.pos, 1, 1));
      }
      VMob.prototype.think.call(this, t);
    } else this.flop();
  }
  afterMove() {
    ((this.spikes +=
      0.06 * ((this.ctl.goal && this.inWater && this.beamT < 0 ? 0 : 1) - this.spikes)),
      (this.tailT += this.ctl.goal ? 0.3 : 0.06));
  }
  setupAnim(t, s) {
    const i = t.parts,
      e = this.age + s,
      a = 0 * (1 - this.spikes) + this.spikes;
    for (let t = 0; t < 12; t++) {
      const s = i["spike" + t];
      if (s) {
        const i = 1 + -0.15 * (1 - a) + 0.02 * Math.sin(0.1 * e + t);
        ((s.x *= i), (s.y = 16 + (s.y - 16) * i), (s.z *= i));
      }
    }
    if (i.eye) {
      i.eye.z = -8.25;
      (this.target || this.ctl.look) &&
        ((i.eye.x = clamp(2 * -(this.headYaw || 0), -1.5, 1.5)),
        (i.eye.y = clamp(4 * -(this.pitch || 0), -1.5, 1.5)));
    }
    const h = Math.sin(this.tailT) * Math.PI * 0.05;
    (i.tail0 && (i.tail0.yRot = h), i.tail1 && (i.tail1.yRot = h), i.tail2 && (i.tail2.yRot = h));
  }
  texKey(t) {
    return t.etex(this.elder ? "entity/guardian/guardian_elder" : "entity/guardian/guardian");
  }
  ambientKind() {
    return this.inWater ? "ambient" : "ambient_land";
  }
  drawLayers(t, s, i, e, a, h, r) {
    if (this.beamT < 0 || !this.target) return;
    const o = this.target,
      n = this.beamT / this.beamTime,
      d = this.D.scale || 1,
      l = [this.pos[0], this.pos[1] + 0.5 * this.h, this.pos[2]],
      u = [o.pos[0], o.pos[1] + 0.5 * o.h, o.pos[2]];
    t.drawBeam &&
      t.drawBeam(
        l,
        u,
        0.2 * d,
        [64 + 191 * n, 32 + 191 * n, 128 - 64 * n].map((t) => t / 255),
        "entity/guardian/guardian_beam",
        this.age + a,
      );
  }
}
(defVMob("guardian", {
  cls: Guardian,
  ai: "swim",
  xp: 10,
  shadowR: 0.5,
  stepSound: !1,
  speed3: 1,
  T: { hostile: !0 },
}),
  defVMob("elder_guardian", {
    cls: Guardian,
    layer: "elder_guardian#main",
    ai: "swim",
    xp: 10,
    shadowR: 1.2,
    stepSound: !1,
    speed3: 0.6,
    T: { hostile: !0 },
  }));
//# sourceURL=js/mobs_water.js
