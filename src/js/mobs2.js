"use strict";
function createMob(t, s, i, h, e) {
  switch (s) {
    case "enderman":
      return new Enderman(t, i, h, e);
    case "blaze":
      return new Blaze(t, i, h, e);
    case "ghast":
      return new Ghast(t, i, h, e);
    case "zombified_piglin":
      return new ZombifiedPiglin(t, i, h, e);
    case "magma_cube":
      return new MagmaCube(t, i, h, e, 4);
    case "ender_dragon":
      return new EnderDragon(t, i, h, e);
    case "end_crystal":
      return new EndCrystal(t, i, h, e);
  }
  return new Mob(t, s, i, h, e);
}
function randomDespawn(t) {
  return (
    !t.persistent &&
    !t.customName &&
    !t.remote &&
    !t.leashHolder &&
    !t.carriedBlock &&
    t.age > 600 &&
    Math.random() < 1 / 800 &&
    t.distTo(t.game.player) > 32
  );
}
function particleBurst(t, s, i, h, e, a, o, r) {
  for (let n = 0; n < a; n++) {
    const a = t.particles.spawn(
      s,
      i + (Math.random() - 0.5) * o,
      h + Math.random() * o,
      e + (Math.random() - 0.5) * o,
      0.2 * (Math.random() - 0.5),
      0.2 * (Math.random() - 0.3),
      0.2 * (Math.random() - 0.5),
    );
    a && r && (a.col = r);
  }
}
function teleportEntity(t, s, i, h) {
  const e = t.world,
    a = Math.floor(s),
    o = Math.floor(h);
  if (!e.isLoaded(a, o)) return !1;
  let r = Math.floor(i);
  for (; r > 1 && !BLOCKS[e.getBlock(a, r - 1, o)].solid;) r--;
  if (r <= 1) return !1;
  for (let s = 0; s < Math.ceil(t.h); s++) {
    const t = e.getBlock(a, r + s, o);
    if (t && (BLOCKS[t].solid || IS_FLUID[t])) return !1;
  }
  if (IS_FLUID[e.getBlock(a, r - 1, o)]) return !1;
  const n = t.pos[0],
    p = t.pos[1],
    l = t.pos[2];
  return (
    (t.pos = [a + 0.5, r, o + 0.5]),
    (t.prev = [...t.pos]),
    t.collides(t.box())
      ? ((t.pos = [n, p, l]), (t.prev = [...t.pos]), !1)
      : (particleBurst(t.game, "portal", n, p, l, 24, t.h),
        particleBurst(t.game, "portal", t.pos[0], t.pos[1], t.pos[2], 24, t.h),
        Sound.ev("entity.enderman.teleport", t.pos, 1, 1),
        (t.fallDist = 0),
        (t.vel = [0, 0, 0]),
        !0)
  );
}
Object.assign(MOB_TYPES, {
  enderman: {
    cn: "末影人",
    hp: 40,
    w: 0.6,
    h: 2.9,
    speed: 0.3,
    model: "enderman",
    hostile: !0,
    neutral: !0,
    attack: 7,
    drops: [["ender_pearl", 0, 1]],
    scale: 1,
  },
  blaze: {
    cn: "烈焰人",
    hp: 20,
    w: 0.6,
    h: 1.8,
    speed: 0.23,
    model: "blaze",
    hostile: !0,
    fireproof: !0,
    flying: !0,
    drops: [["blaze_rod", 0, 1]],
    scale: 1,
    bright: !0,
  },
  ghast: {
    cn: "恶魂",
    hp: 10,
    w: 4,
    h: 4,
    speed: 0.1,
    model: "ghast",
    hostile: !0,
    fireproof: !0,
    flying: !0,
    drops: [
      ["ghast_tear", 0, 1],
      ["gunpowder", 0, 2],
    ],
    scale: 4.5,
  },
  zombified_piglin: {
    cn: "僵尸猪灵",
    hp: 20,
    w: 0.6,
    h: 1.95,
    speed: 0.23,
    model: "zombified_piglin",
    hostile: !0,
    neutral: !0,
    fireproof: !0,
    attack: 8,
    armor: 2,
    drops: [
      ["rotten_flesh", 0, 1],
      ["gold_nugget", 0, 1],
    ],
    scale: 0.9375,
  },
  magma_cube: {
    cn: "岩浆怪",
    hp: 16,
    w: 2.04,
    h: 2.04,
    speed: 0.2,
    model: "magma_cube",
    hostile: !0,
    fireproof: !0,
    attack: 6,
    drops: [],
    scale: 1,
  },
});
class Enderman extends Mob {
  constructor(t, s, i, h) {
    (super(t, "enderman", s, i, h),
      (this.angry = !1),
      (this.eyeH = 2.55),
      (this.tpCd = 0),
      (this.persistent = !1));
  }
  hurt(t, s) {
    if (s && ("arrow" === s.type || "snowball" === s.type)) return (this.teleportRandom(), !1);
    const i = super.hurt(t, s);
    return (
      i &&
        s &&
        s.attacker &&
        (this.provoke(s.attacker), Math.random() < 0.4 && this.teleportRandom()),
      i
    );
  }
  provoke(t) {
    (this.angry || Sound.ev("entity.enderman.scream", this.pos, 1, 1),
      (this.angry = !0),
      (this.target = t),
      (this.angerT = 600));
  }
  teleportRandom() {
    for (let t = 0; t < 16; t++)
      if (
        teleportEntity(
          this,
          this.pos[0] + 48 * (Math.random() - 0.5),
          this.pos[1] + 32 * (Math.random() - 0.5) + 8,
          this.pos[2] + 48 * (Math.random() - 0.5),
        )
      )
        return ((this.tpCd = 20), !0);
    return !1;
  }
  tick() {
    if ((this.savePrev(), this.baseTick(), this.deathTick())) return;
    const t = this.game,
      s = t.player,
      i = this.distTo(s);
    if ((!this.persistent && i > 100) || randomDespawn(this)) return void (this.dead = !0);
    this.tpCd > 0 && this.tpCd--;
    ((this.inWater ||
      ("overworld" === t.dim &&
        t.weather > 0.5 &&
        this.world.skyAt(
          Math.floor(this.pos[0]),
          Math.floor(this.pos[1] + 2),
          Math.floor(this.pos[2]),
        ) >= 15 &&
        !t.isCold(Math.floor(this.pos[0]), Math.floor(this.pos[2])))) &&
      this.age % 10 == 0 &&
      (this.hurt(1, { type: "drown" }), this.teleportRandom()),
      --this.idleSound < 0 &&
        ((this.idleSound = 200 + 400 * Math.random()),
        i < 20 && Sound.mob("enderman", "idle", this.pos)),
      this.attackCd > 0 && this.attackCd--);
    let h = 0,
      e = !1;
    const a = this.target;
    if (!this.angry || !a || a.dead || 0 !== a.deathTime || (a === s && s.creative)) {
      if (((this.angry = !1), this.wander)) {
        const t = this.wander[0] - this.pos[0],
          s = this.wander[2] - this.pos[2];
        Math.hypot(t, s) < 1 || --this.wanderT <= 0
          ? (this.wander = null)
          : (this.turnTo(Math.atan2(-t, -s), 0.2), (h = 0.6));
      } else Math.random() < 0.01 && this.pickWander(10);
      Math.random() < 0.0015 && this.tpCd <= 0 && this.teleportRandom();
    } else {
      --this.angerT <= 0 && i > 16 && ((this.angry = !1), (this.target = null));
      const t = a.pos[0] - this.pos[0],
        s = a.pos[2] - this.pos[2],
        e = Math.hypot(t, s);
      if (
        (this.turnTo(Math.atan2(-t, -s), 0.5),
        (h = 1),
        e > 14 && this.tpCd <= 0 && Math.random() < 0.05)
      ) {
        const t = Math.random() * Math.PI * 2;
        teleportEntity(
          this,
          a.pos[0] + 3 * Math.sin(t),
          a.pos[1] + 2,
          a.pos[2] + 3 * Math.cos(t),
        ) && (this.tpCd = 40);
      }
      (e < 1.6 &&
        Math.abs(a.pos[1] - this.pos[1]) < 2.5 &&
        this.attackCd <= 0 &&
        ((this.attackCd = 20),
        (this.swingT = 6),
        a.hurt(this.T.attack, { type: "mob", attacker: this, knockFrom: this.pos })),
        (this.headYaw = 0),
        (this.pitch = 0));
    }
    (this.collidedH && this.onGround && (e = !0),
      e && this.onGround && (this.vel[1] = 0.42),
      this.travel(h, 0, this.T.speed * this.T.speed * (this.angry ? 1.6 : 1), e));
    let o = this.yaw - this.bodyYaw;
    for (; o > Math.PI;) o -= 2 * Math.PI;
    for (; o < -Math.PI;) o += 2 * Math.PI;
    if (((this.bodyYaw += 0.4 * o), this.swingT > 0 && this.swingT--, Math.random() < 0.1)) {
      this.game.particles.spawn(
        "portal",
        this.pos[0] + 0.6 * (Math.random() - 0.5),
        this.pos[1] + 2.9 * Math.random(),
        this.pos[2] + 0.6 * (Math.random() - 0.5),
        0.3 * (Math.random() - 0.5),
        0.2 * -Math.random(),
        0.3 * (Math.random() - 0.5),
      );
    }
    this.animate();
  }
  pose(t) {
    const s = 0.6662 * lerp(this.limbSwing - this.limbAmt, this.limbSwing, t),
      i = this.limbAmt,
      h = 0.6 * Math.cos(s) * i,
      e = -h,
      a = {
        head: { ry: this.headYaw, rx: this.pitch, t: this.angry ? [0, 0.3, 0] : null },
        rarm: { rx: e + (this.swingT > 0 ? 1 : 0) },
        larm: { rx: h },
        rleg: { rx: h },
        lleg: { rx: e },
      };
    return (
      this.angry && (a.head.t = [0.04 * (Math.random() - 0.5), 0.32, 0.04 * (Math.random() - 0.5)]),
      a
    );
  }
}
class ZombifiedPiglin extends Mob {
  constructor(t, s, i, h) {
    (super(t, "zombified_piglin", s, i, h), (this.angry = 0), (this.persistent = !1));
  }
  hurt(t, s) {
    const i = super.hurt(t, s);
    if (i && s && s.attacker) {
      for (const t of this.game.entities)
        t instanceof ZombifiedPiglin &&
          t.distTo(this) < 20 &&
          ((t.angry = 400 + 400 * Math.random()), (t.target = s.attacker));
      Sound.ev("entity.zombified_piglin.angry", this.pos, 1, 1);
    }
    return i;
  }
  tick() {
    if ((this.savePrev(), this.baseTick(), this.deathTick())) return;
    const t = this.game.player,
      s = this.distTo(t);
    if ((!this.persistent && s > 100) || randomDespawn(this)) return void (this.dead = !0);
    (--this.idleSound < 0 &&
      ((this.idleSound = 200 + 400 * Math.random()),
      s < 20 && Sound.mob("zombified_piglin", this.angry > 0 ? "angry" : "idle", this.pos)),
      this.attackCd > 0 && this.attackCd--);
    let i = 0,
      h = !1;
    if (
      this.angry > 0 &&
      this.target &&
      0 === this.target.deathTime &&
      (this.target !== t || !t.creative)
    ) {
      this.angry--;
      const t = this.target,
        s = t.pos[0] - this.pos[0],
        h = t.pos[2] - this.pos[2],
        e = Math.hypot(s, h);
      (this.turnTo(Math.atan2(-s, -h), 0.4),
        (i = 1),
        e < 1.4 &&
          Math.abs(t.pos[1] - this.pos[1]) < 1.8 &&
          this.attackCd <= 0 &&
          ((this.attackCd = 20),
          (this.swingT = 6),
          t.hurt(this.T.attack, { type: "mob", attacker: this, knockFrom: this.pos })));
    } else if (((this.target = null), this.wander)) {
      const t = this.wander[0] - this.pos[0],
        s = this.wander[2] - this.pos[2];
      Math.hypot(t, s) < 1 || --this.wanderT <= 0
        ? (this.wander = null)
        : (this.turnTo(Math.atan2(-t, -s), 0.2), (i = 0.7));
    } else Math.random() < 0.01 && this.pickWander(8);
    if (i > 0) {
      const t = this.pos[0] - 0.8 * Math.sin(this.yaw),
        s = this.pos[2] - 0.8 * Math.cos(this.yaw);
      let h = 0;
      for (
        ;
        h < 4 &&
        !BLOCKS[this.world.getBlock(Math.floor(t), Math.floor(this.pos[1]) - 1 - h, Math.floor(s))]
          .solid;
      )
        h++;
      h >= 4 && this.angry <= 0 && ((i = 0), (this.wander = null));
    }
    (this.collidedH && this.onGround && (h = !0),
      h && this.onGround && (this.vel[1] = 0.42),
      this.travel(i, 0, this.T.speed * this.T.speed * (this.angry > 0 ? 1.4 : 1), h));
    let e = this.yaw - this.bodyYaw;
    for (; e > Math.PI;) e -= 2 * Math.PI;
    for (; e < -Math.PI;) e += 2 * Math.PI;
    ((this.bodyYaw += 0.3 * e), this.swingT > 0 && this.swingT--, this.animate());
  }
  pose(t) {
    const s = 0.6662 * lerp(this.limbSwing - this.limbAmt, this.limbSwing, t),
      i = this.limbAmt,
      h = 1.4 * Math.cos(s) * i,
      e = -h,
      a = this.angry > 0 ? Math.PI / 2 : 0;
    return {
      head: { ry: this.headYaw, rx: this.pitch },
      rarm: {
        rx: a + 0.5 * e + (this.swingT > 0 ? 0.6 * Math.sin((this.swingT / 6) * Math.PI) : 0),
      },
      larm: { rx: 0.6 * a + 0.5 * h },
      rleg: { rx: h },
      lleg: { rx: e },
    };
  }
}
class FlyingMob extends Mob {
  fly(t, s, i, h, e = 0.9) {
    const a = t - this.pos[0],
      o = s - this.pos[1],
      r = i - this.pos[2],
      n = Math.hypot(a, o, r) || 1;
    (n > 0.5 &&
      ((this.vel[0] += (a / n) * h), (this.vel[1] += (o / n) * h), (this.vel[2] += (r / n) * h)),
      this.move(this.vel[0], this.vel[1], this.vel[2]),
      (this.vel[0] *= e),
      (this.vel[1] *= e),
      (this.vel[2] *= e),
      (this.fallDist = 0));
  }
}
class Blaze extends FlyingMob {
  constructor(t, s, i, h) {
    (super(t, "blaze", s, i, h),
      (this.attackStep = 0),
      (this.attackT = 0),
      (this.persistent = !1),
      (this.hover = i));
  }
  tick() {
    if ((this.savePrev(), this.baseTick(), this.deathTick())) return;
    const t = this.game,
      s = t.player,
      i = this.distTo(s);
    if ((!this.persistent && i > 96) || randomDespawn(this)) return void (this.dead = !0);
    (this.inWater && this.age % 10 == 0 && this.hurt(1, { type: "drown" }),
      --this.idleSound < 0 &&
        ((this.idleSound = 160 + 200 * Math.random()),
        i < 20 && Sound.mob("blaze", "idle", this.pos)),
      Math.random() < 0.3 &&
        t.particles.spawn(
          "smoke",
          this.pos[0] + 0.6 * (Math.random() - 0.5),
          this.pos[1] + 1.8 * Math.random(),
          this.pos[2] + 0.6 * (Math.random() - 0.5),
          0,
          0.02,
          0,
        ));
    const h = 0 === s.deathTime && !s.creative;
    h && i < seenWithin(s, 48) && this.canSee(s)
      ? (this.target = s)
      : (i > 64 || !h) && (this.target = null);
    let e = this.pos[0],
      a = this.pos[1],
      o = this.pos[2];
    if (this.target) {
      const s = this.target,
        i = s.pos[0] - this.pos[0],
        h = s.pos[2] - this.pos[2],
        r = Math.hypot(i, h);
      if (
        ((this.yaw = Math.atan2(-i, -h)),
        (this.bodyYaw = this.yaw),
        (a = s.pos[1] + 2.5),
        r > 10
          ? ((e = s.pos[0]), (o = s.pos[2]))
          : r < 4 && ((e = this.pos[0] - i), (o = this.pos[2] - h)),
        r < 2 &&
          this.attackCd-- <= 0 &&
          ((this.attackCd = 20), s.hurt(6, { type: "mob", attacker: this, knockFrom: this.pos })),
        this.attackT++,
        0 === this.attackStep &&
          this.attackT > 60 &&
          ((this.attackStep = 1),
          (this.attackT = 0),
          Sound.ev("entity.blaze.burn", this.pos, 1, 1)),
        this.attackStep >= 1)
      ) {
        for (let s = 0; s < 3; s++)
          t.particles.spawn(
            "flame",
            this.pos[0] + (Math.random() - 0.5),
            this.pos[1] + 1.8 * Math.random(),
            this.pos[2] + (Math.random() - 0.5),
            0,
            0.02,
            0,
          );
        if (this.attackT >= 30 && (this.attackT - 30) % 6 == 0) {
          const i = this.pos[0],
            h = this.pos[1] + 1.2,
            e = this.pos[2],
            a = s.pos[0] - i + 1.2 * (Math.random() - 0.5),
            o = s.pos[1] + 1 - h,
            r = s.pos[2] - e + 1.2 * (Math.random() - 0.5),
            n = Math.hypot(a, o, r);
          (t.addEntity(
            new Fireball(t, i, h, e, [(a / n) * 0.8, (o / n) * 0.8, (r / n) * 0.8], this, !0),
          ),
            Sound.ev("entity.blaze.shoot", this.pos, 1, 1),
            ++this.attackStep > 3 && ((this.attackStep = 0), (this.attackT = -40)));
        }
      }
    } else
      ((this.attackStep = 0),
        (this.attackT = 0),
        (a = this.hover + 1.5 * Math.sin(this.age / 30)),
        (!this.wander || --this.wanderT <= 0) && this.pickWander(6),
        (e = this.wander[0]),
        (o = this.wander[2]));
    const r = this.world.getBlock(
      Math.floor(this.pos[0]),
      Math.floor(this.pos[1] - 0.5),
      Math.floor(this.pos[2]),
    );
    (this.fly(e, a, o, 0.012),
      this.target || BLOCKS[r].solid || (this.vel[1] -= 0.004),
      this.animate());
  }
  pose(t) {
    const s = 0.1 * (this.age + t),
      i = { head: { ry: this.headYaw } };
    for (let t = 0; t < 12; t++) {
      const h = t < 4 ? 0 : t < 8 ? 1 : 2,
        e = [9, 7, 5][h],
        a = s * [1, -0.6, 0.35][h] + ((t % 4) * Math.PI) / 2 + 0.4 * h;
      i["rod" + t] = {
        t: [
          (Math.cos(a) * e) / 16,
          ([16, 9, 2][h] + Math.cos(0.25 * (2 * t + s))) / 16,
          (Math.sin(a) * e) / 16,
        ],
      };
    }
    return i;
  }
}
class Ghast extends FlyingMob {
  constructor(t, s, i, h) {
    (super(t, "ghast", s, i, h), (this.charge = 0), (this.persistent = !1), (this.goal = null));
  }
  tick() {
    if ((this.savePrev(), this.baseTick(), this.deathTick())) return;
    const t = this.game,
      s = t.player,
      i = this.distTo(s);
    if (!this.persistent && i > 128) return void (this.dead = !0);
    (--this.idleSound < 0 &&
      ((this.idleSound = 200 + 300 * Math.random()),
      i < 48 && Sound.mob("ghast", "idle", this.pos)),
      (!this.goal ||
        Math.hypot(
          this.goal[0] - this.pos[0],
          this.goal[1] - this.pos[1],
          this.goal[2] - this.pos[2],
        ) < 2 ||
        Math.random() < 0.01) &&
        (this.goal = [
          this.pos[0] + 32 * (Math.random() - 0.5),
          clamp(this.pos[1] + 16 * (Math.random() - 0.5), 40, 110),
          this.pos[2] + 32 * (Math.random() - 0.5),
        ]));
    const h = 0 === s.deathTime && !s.creative && i < seenWithin(s, 64) && this.canSee(s);
    if (h) {
      const i = s.pos[0] - this.pos[0],
        h = s.pos[2] - this.pos[2];
      if (
        ((this.yaw = Math.atan2(-i, -h)),
        (this.bodyYaw = this.yaw),
        this.charge++,
        10 === this.charge && Sound.ev("entity.ghast.warn", this.pos, 5, 1),
        this.charge >= 20)
      ) {
        const i = -Math.sin(this.yaw),
          h = -Math.cos(this.yaw),
          e = this.pos[0] + 2.2 * i,
          a = this.pos[1] + 2,
          o = this.pos[2] + 2.2 * h,
          r = s.pos[0] - e,
          n = s.pos[1] + 1 - a,
          p = s.pos[2] - o,
          l = Math.hypot(r, n, p);
        (t.addEntity(
          new Fireball(t, e, a, o, [(r / l) * 0.7, (n / l) * 0.7, (p / l) * 0.7], this, !1),
        ),
          Sound.ev("entity.ghast.shoot", this.pos, 5, 1),
          (this.charge = -40));
      }
    } else this.charge > 0 ? this.charge-- : this.charge < 0 && this.charge++;
    (this.fly(this.goal[0], this.goal[1], this.goal[2], 0.006, 0.92),
      this.collidedH && (this.goal = null),
      !h &&
        Math.hypot(this.vel[0], this.vel[2]) > 0.001 &&
        ((this.yaw = Math.atan2(-this.vel[0], -this.vel[2])), (this.bodyYaw = this.yaw)),
      this.animate());
  }
  pose(t) {
    const s = {};
    for (let i = 0; i < 9; i++)
      s["t" + i] = { rx: -(0.2 * Math.sin(0.3 * (this.age + t) + i) + 0.4) };
    return s;
  }
}
class MagmaCube extends Mob {
  constructor(t, s, i, h, e = 4) {
    (super(t, "magma_cube", s, i, h),
      this.setSize(e),
      (this.jumpDelay = 20),
      (this.squish = 0),
      (this.prevSquish = 0),
      (this.persistent = !1));
  }
  setSize(t) {
    ((this.size = t), (this.w = this.h = 0.52 * t), (this.health = this.maxHealth = t * t));
  }
  die(t) {
    if ((super.die(t), this.size > 1)) {
      for (let t = 0, s = 2 + ((3 * Math.random()) | 0); t < s; t++) {
        const t = new MagmaCube(
          this.game,
          this.pos[0] + (Math.random() - 0.5) * this.w,
          this.pos[1] + 0.5,
          this.pos[2] + (Math.random() - 0.5) * this.w,
          this.size / 2,
        );
        this.game.addEntity(t);
      }
      Math.random() < 0.25 &&
        this.game.dropItem(
          this.pos[0],
          this.pos[1] + 0.5,
          this.pos[2],
          makeStack("magma_cream", 1),
        );
    }
  }
  tick() {
    if ((this.savePrev(), this.baseTick(), this.deathTick())) return;
    const t = this.game.player,
      s = this.distTo(t);
    if ((!this.persistent && s > 100) || randomDespawn(this)) return void (this.dead = !0);
    ((this.prevSquish = this.squish), (this.squish *= 0.6));
    const i = 0 === t.deathTime && !t.creative;
    if (((this.target = i && s < seenWithin(t, 16) ? t : null), this.target)) {
      const s = t.pos[0] - this.pos[0],
        i = t.pos[2] - this.pos[2];
      this.yaw = Math.atan2(-s, -i);
    } else Math.random() < 0.02 && (this.yaw += 2 * (Math.random() - 0.5));
    if (this.onGround) {
      if (
        ((this.vel[0] *= 0.5),
        (this.vel[2] *= 0.5),
        this.wasAir &&
          ((this.squish = -0.5),
          Sound.ev("entity.magma_cube.squish", this.pos, 1, 1),
          (this.wasAir = !1)),
        --this.jumpDelay <= 0)
      ) {
        this.jumpDelay = this.target
          ? 10 + ((10 * Math.random()) | 0)
          : 20 + ((40 * Math.random()) | 0);
        const t = 0.1 + 0.04 * this.size;
        ((this.vel[1] = 0.42 + 0.1 * this.size),
          (this.vel[0] = -Math.sin(this.yaw) * t),
          (this.vel[2] = -Math.cos(this.yaw) * t),
          (this.squish = 1),
          Sound.ev("entity.magma_cube.jump", this.pos, 1, 1));
      }
    } else this.wasAir = !0;
    if (
      (this.move(this.vel[0], this.vel[1], this.vel[2]),
      (this.vel[1] = 0.98 * (this.vel[1] - 0.08)),
      this.attackCd > 0 && this.attackCd--,
      this.target && this.attackCd <= 0)
    ) {
      const s = this.box(),
        i = t.box();
      s[0] < i[3] &&
        s[3] > i[0] &&
        s[1] < i[4] &&
        s[4] > i[1] &&
        s[2] < i[5] &&
        s[5] > i[2] &&
        ((this.attackCd = 20),
        t.hurt([3, 3, 4, 4, 6][this.size] || 3, {
          type: "mob",
          attacker: this,
          knockFrom: this.pos,
        }));
    }
    this.bodyYaw = this.yaw;
  }
}
class Fireball extends Entity {
  constructor(t, s, i, h, e, a, o) {
    (super(t, s, i, h, o ? 0.3125 : 1, o ? 0.3125 : 1),
      (this.vel = e),
      (this.owner = a),
      (this.small = o),
      (this.hittable = !o));
  }
  hurt(t, s) {
    if (this.small || !s || !s.attacker) return !1;
    const i = s.attacker,
      h =
        i === this.game.player
          ? this.game.lookDir()
          : [this.pos[0] - i.pos[0], 0, this.pos[2] - i.pos[2]],
      e = Math.hypot(h[0], h[1], h[2]) || 1;
    return (
      (this.vel = [(h[0] / e) * 0.9, (h[1] / e) * 0.9, (h[2] / e) * 0.9]),
      (this.owner = i),
      (this.deflected = !0),
      !0
    );
  }
  tick() {
    if ((this.savePrev(), this.age++, this.age > 300)) return void (this.dead = !0);
    const t = this.game,
      s = this.vel,
      i = t.entities.concat([t.player]);
    for (let t = 0; t < 4; t++) {
      const t = this.pos[0] + s[0] / 4,
        h = this.pos[1] + s[1] / 4,
        e = this.pos[2] + s[2] / 4;
      for (const s of i) {
        if (s === this || s === this.owner || s.dead || !(s instanceof Living) || s.deathTime > 0)
          continue;
        if (this.owner instanceof Ghast && s instanceof Ghast) continue;
        const i = s.box(),
          a = this.w / 2;
        if (
          t > i[0] - a &&
          t < i[3] + a &&
          h > i[1] - a &&
          h < i[4] + a &&
          e > i[2] - a &&
          e < i[5] + a
        )
          return void this.impact(s);
      }
      const a = this.world.getBlock(Math.floor(t), Math.floor(h), Math.floor(e));
      if (a && BLOCKS[a].solid)
        return void this.impact(null, [Math.floor(t), Math.floor(h), Math.floor(e)]);
      ((this.pos[0] = t), (this.pos[1] = h), (this.pos[2] = e));
    }
    this.age % 2 == 0 &&
      t.particles.spawn("smoke", this.pos[0], this.pos[1] + this.h / 2, this.pos[2], 0, 0.01, 0);
  }
  impact(t, s) {
    const i = this.game;
    if (((this.dead = !0), this.small)) {
      if (t)
        t.fireproof ||
          (t.hurt(5, { type: "fireball", attacker: this.owner, knockFrom: this.pos }),
          (t.fire = Math.max(t.fire || 0, 100)));
      else if (s) {
        const t = Math.floor(this.pos[0]),
          s = Math.floor(this.pos[1]),
          h = Math.floor(this.pos[2]);
        (this.owner instanceof Mob && !1 === i.rule("mob_griefing")) ||
          0 !== this.world.getBlock(t, s, h) ||
          !SOLIDCUBE[this.world.getBlock(t, s - 1, h)] ||
          this.world.setBlock(t, s, h, i.fireIdAt(t, s, h), 0);
      }
      Sound.ev("block.fire.extinguish", this.pos, 0.3, 1.5);
    } else
      (t &&
        this.owner &&
        t !== this.owner &&
        t.hurt(6, { type: "fireball", attacker: this.owner, knockFrom: this.pos }),
        t instanceof Ghast &&
          this.deflected &&
          this.owner === i.player &&
          (t.hurt(1e3, { type: "fireball", attacker: i.player, player: !0 }),
          i.grant("return_sender")),
        i.explode(
          this.pos[0],
          this.pos[1] + 0.5,
          this.pos[2],
          1,
          this.owner && this.owner.T ? this.owner : null,
          !1,
          !0,
          !0,
        ));
  }
}
class DragonFireball extends Entity {
  constructor(t, s, i, h, e, a) {
    (super(t, s, i, h, 1, 1), (this.vel = e), (this.owner = a));
  }
  tick() {
    if ((this.savePrev(), this.age++, this.age > 300)) return void (this.dead = !0);
    const t = this.game,
      s = this.vel;
    for (let i = 0; i < 4; i++) {
      const i = this.pos[0] + s[0] / 4,
        h = this.pos[1] + s[1] / 4,
        e = this.pos[2] + s[2] / 4,
        a = t.player.box(),
        o =
          i > a[0] - 0.5 &&
          i < a[3] + 0.5 &&
          h > a[1] - 0.5 &&
          h < a[4] + 0.5 &&
          e > a[2] - 0.5 &&
          e < a[5] + 0.5,
        r = this.world.getBlock(Math.floor(i), Math.floor(h), Math.floor(e));
      if (o || (r && BLOCKS[r].solid) || h < 0) return void this.burst();
      ((this.pos[0] = i), (this.pos[1] = h), (this.pos[2] = e));
    }
    t.particles.spawn(
      "breath",
      this.pos[0],
      this.pos[1],
      this.pos[2],
      0.05 * (Math.random() - 0.5),
      0,
      0.05 * (Math.random() - 0.5),
    );
  }
  burst() {
    this.dead = !0;
    const t = this.game;
    let s = this.pos[1];
    const i = Math.floor(this.pos[0]),
      h = Math.floor(this.pos[2]);
    for (
      let t = 0;
      t < 8 && s > 1 && !BLOCKS[this.world.getBlock(i, Math.floor(s - 0.5), h)].solid;
      t++
    )
      s -= 1;
    (t.addEntity(new AreaCloud(t, this.pos[0], Math.floor(s), this.pos[2], 3, 200, this.owner)),
      Sound.ev("entity.dragon_fireball.explode", this.pos, 1, 1));
  }
}
class AreaCloud extends Entity {
  constructor(t, s, i, h, e, a, o) {
    (super(t, s, i, h, 2 * e, 0.5), (this.radius = e), (this.life = a), (this.owner = o));
  }
  tick() {
    (this.savePrev(), this.age++);
    const t = this.game,
      s = 1 - this.age / this.life,
      i = this.radius * (0.5 + 0.5 * s);
    if (this.age >= this.life) this.dead = !0;
    else {
      for (let s = 0; s < 4; s++) {
        const s = Math.random() * Math.PI * 2,
          h = Math.sqrt(Math.random()) * i;
        t.particles.spawn(
          "breath",
          this.pos[0] + Math.cos(s) * h,
          this.pos[1] + 0.1,
          this.pos[2] + Math.sin(s) * h,
          0,
          0.02,
          0,
        );
      }
      if (this.age % 20 == 0) {
        const s = t.player;
        Math.hypot(s.pos[0] - this.pos[0], s.pos[2] - this.pos[2]) < i &&
          Math.abs(s.pos[1] - this.pos[1]) < 2 &&
          s.hurt(4, { type: "magic", attacker: this.owner });
      }
    }
  }
}
class ThrownPearl extends Entity {
  constructor(t, s, i, h, e, a) {
    (super(t, s, i, h, 0.25, 0.25), (this.vel = e), (this.owner = a));
  }
  tick() {
    (this.savePrev(), this.age++);
    const t = this.game,
      s = this.vel,
      i = Math.max(1, Math.ceil(Math.hypot(s[0], s[1], s[2]) / 0.3));
    for (let h = 0; h < i; h++) {
      const h = this.pos[0] + s[0] / i,
        e = this.pos[1] + s[1] / i,
        a = this.pos[2] + s[2] / i;
      let o = null;
      for (const s of t.entities) {
        if (s === this || !(s instanceof Living) || s.deathTime > 0) continue;
        const t = s.box();
        if (h > t[0] && h < t[3] && e > t[1] && e < t[4] && a > t[2] && a < t[5]) {
          o = s;
          break;
        }
      }
      const r = this.world.getBlock(Math.floor(h), Math.floor(e), Math.floor(a));
      if (o || (r && BLOCKS[r].solid) || e < -60)
        return (o && o.hurt(0.01, { type: "pearl", attacker: this.owner }), void this.land());
      ((this.pos[0] = h), (this.pos[1] = e), (this.pos[2] = a));
    }
    ((s[0] *= 0.99),
      (s[1] = 0.99 * s[1] - 0.03),
      (s[2] *= 0.99),
      this.age % 2 == 0 &&
        t.particles.spawn("portal", this.pos[0], this.pos[1], this.pos[2], 0, 0, 0));
  }
  land() {
    this.dead = !0;
    const t = this.game,
      s = this.owner;
    if (
      (particleBurst(t, "portal", this.pos[0], this.pos[1], this.pos[2], 32, 1),
      s !== t.player || s.deathTime > 0 || this.pos[1] < -60)
    )
      return;
    s.pos = [
      this.pos[0] - 0.3 * this.vel[0],
      this.pos[1] - 0.3 * Math.max(0, this.vel[1]),
      this.pos[2] - 0.3 * this.vel[2],
    ];
    let i = 0;
    for (; s.collides(s.box()) && i++ < 4;) s.pos[1] += 0.5;
    ((s.prev = [...s.pos]),
      (s.vel = [0, 0, 0]),
      (s.fallDist = 0),
      s.creative || s.hurt(5, { type: "fall" }),
      Sound.ev("entity.enderman.teleport", s.pos, 1, 1));
  }
}
class EyeOfEnder extends Entity {
  constructor(t, s, i, h, e, a) {
    super(t, s, i, h, 0.25, 0.25);
    const o = e - s,
      r = a - h,
      n = Math.hypot(o, r);
    (n > 12
      ? ((this.tx = s + (o / n) * 12), (this.tz = h + (r / n) * 12), (this.ty = i + 8))
      : ((this.tx = e), (this.tz = a), (this.ty = i)),
      (this.survive = Math.random() > 0.2),
      Sound.ev("entity.ender_eye.launch", this.pos, 1, 1));
  }
  tick() {
    (this.savePrev(), this.age++);
    const t = this.game,
      s = this.vel,
      i = this.tx - this.pos[0],
      h = this.tz - this.pos[2],
      e = Math.hypot(i, h);
    let a = Math.hypot(s[0], s[2]);
    const o = lerp(a, e, 0.0025);
    let r = s[1];
    e < 1 && ((a *= 0.8), (r *= 0.8));
    const n = Math.atan2(h, i);
    ((s[0] = Math.cos(n) * Math.max(o, 0.05)),
      (s[2] = Math.sin(n) * Math.max(o, 0.05)),
      (s[1] = r + 0.015 * ((this.pos[1] < this.ty ? 1 : -1) - r)),
      (this.pos[0] += s[0]),
      (this.pos[1] += s[1]),
      (this.pos[2] += s[2]));
    for (let i = 0; i < 2; i++)
      t.particles.spawn(
        "portal",
        this.pos[0] - 0.25 * s[0] + 0.2 * (Math.random() - 0.5),
        this.pos[1] - 0.25 * s[1] - 0.2,
        this.pos[2] - 0.25 * s[2] + 0.2 * (Math.random() - 0.5),
        0.1 * (Math.random() - 0.5),
        0,
        0.1 * (Math.random() - 0.5),
      );
    this.age > 80 &&
      ((this.dead = !0),
      Sound.ev("entity.ender_eye.death", this.pos, 1, 1),
      this.survive
        ? t.dropItem(this.pos[0], this.pos[1], this.pos[2], makeStack("ender_eye", 1), [0, 0.1, 0])
        : (particleBurst(t, "portal", this.pos[0], this.pos[1], this.pos[2], 20, 0.5),
          Sound.block("break", "glass", this.pos)));
  }
}
class EndCrystal extends Entity {
  constructor(t, s, i, h) {
    (super(t, s, i, h, 2, 2),
      (this.hittable = !0),
      (this.spin = 100 * Math.random()),
      (this.showBase = !0),
      (this.type = "end_crystal"),
      (this.persistent = !0));
  }
  tick() {
    (this.savePrev(), this.age++);
  }
  hurt(t, s) {
    if (this.dead) return !1;
    this.dead = !0;
    const i = this.game,
      h = i.entities.find((t) => t instanceof EnderDragon && t.healer === this);
    return (
      i.explode(this.pos[0], this.pos[1] + 0.5, this.pos[2], 6, this, !1, !1),
      h && ((h.healer = null), h.hurtRaw(10, { type: "explosion", attacker: s && s.attacker })),
      !0
    );
  }
}
class EnderDragon extends Living {
  constructor(t, s, i, h) {
    (super(t, s, i, h, 8, 4, 200),
      (this.type = "ender_dragon"),
      (this.T = { cn: "末影龙", hostile: !0, drops: [], model: "dragon" }),
      (this.noClip = !0),
      (this.persistent = !0),
      (this.fireproof = !0),
      (this.alwaysTick = !0),
      (this.phase = "circle"),
      (this.phaseT = 0),
      (this.circleA = Math.random() * Math.PI * 2),
      (this.circleDir = 1),
      (this.hist = []),
      (this.flap = 0),
      (this.prevFlap = 0),
      (this.healer = null),
      (this.perchDamage = 0),
      (this.yaw = 0),
      (this.pitchD = 0),
      (this.speed = 0.6),
      (this.stepHeight = 0));
  }
  box() {
    return [
      this.pos[0] - 4,
      this.pos[1],
      this.pos[2] - 4,
      this.pos[0] + 4,
      this.pos[1] + 4,
      this.pos[2] + 4,
    ];
  }
  parts() {
    const t = Math.sin(this.yaw),
      s = Math.cos(this.yaw),
      i = this.pos[0],
      h = this.pos[1],
      e = this.pos[2],
      at = (a, o, r, n, p) => [
        i - t * a + s * o - n,
        h + r,
        e - s * a - t * o - n,
        i - t * a + s * o + n,
        h + r + p,
        e - s * a - t * o + n,
      ],
      a = this.headPos || [i - 6.5 * t, h + 2, e - 6.5 * s];
    return [
      { box: [a[0] - 1, a[1] - 0.5, a[2] - 1, a[0] + 1, a[1] + 1.5, a[2] + 1], mult: 1, head: !0 },
      { box: at(0, 0, 0.5, 2.5, 3), mult: 0.25 },
      { box: at(0, 4.5, 2, 2, 2), mult: 0.25 },
      { box: at(0, -4.5, 2, 2, 2), mult: 0.25 },
      { box: at(-7, 0, 1.5, 1.5, 2), mult: 0.25 },
      { box: at(-11, 0, 1.5, 1.2, 2), mult: 0.25 },
    ];
  }
  hurtPart(t, s, i) {
    if (this.deathTime > 0) return !1;
    let h = t.head ? s : 0.25 * s + 1;
    return (
      !(i && "explosion" !== i.type && i.attacker !== this.game.player && !i.player) &&
      ("perch" !== this.phase || !i || ("arrow" !== i.type && "trident" !== i.type)
        ? ("perch" === this.phase && (this.perchDamage += h), this.hurtRaw(h, i))
        : ((i.deflected = !0), !1))
    );
  }
  hurt(t, s) {
    return this.hurtPart({ mult: 0.25 }, t, s);
  }
  hurtRaw(t, s) {
    return (
      !(this.deathTime > 0) &&
      !(this.invuln > 10) &&
      ((this.invuln = 20),
      (this.hurtTime = 10),
      (this.health -= t),
      Sound.ev("entity.ender_dragon.hurt", this.pos, 5, 1),
      "perch" === this.phase && this.perchDamage > 50 && this.setPhase("takeoff"),
      this.health <= 0 &&
        ((this.health = 0),
        (this.deathTime = 1),
        Sound.ev("entity.ender_dragon.death", this.pos, 10, 1)),
      !0)
    );
  }
  setPhase(t) {
    ((this.phase = t), (this.phaseT = 0), "perch" === t && (this.perchDamage = 0));
  }
  perchPoint() {
    const t = this.world;
    return [
      0.5,
      (t.podiumY && void 0 !== t.endTop0 ? t.podiumY() : (t.endTop0 || 60) + 2) + 3.5,
      0.5,
    ];
  }
  tick() {
    (this.savePrev(),
      this.age++,
      this.invuln > 0 && this.invuln--,
      this.hurtTime > 0 && this.hurtTime--,
      (this.prevFlap = this.flap));
    const t = this.game,
      s = t.player;
    if (
      (this.hist.unshift([this.pos[0], this.pos[1], this.pos[2], this.yaw]),
      this.hist.length > 64 && (this.hist.length = 64),
      this.deathTime > 0)
    )
      return (
        this.deathTime++,
        (this.pos[1] += 0.1),
        (this.flap += 0.02),
        this.deathTime > 150 &&
          this.deathTime % 5 == 0 &&
          particleBurst(t, "explosion", this.pos[0], this.pos[1], this.pos[2], 2, 8),
        void (this.deathTime >= 200 && ((this.dead = !0), t.onDragonKilled(this)))
      );
    if (this.age % 10 == 0) {
      if (!this.healer || this.healer.dead) {
        this.healer = null;
        let s = 32;
        for (const i of t.entities)
          if (i instanceof EndCrystal && !i.dead) {
            const t = i.distTo(this);
            t < s && ((s = t), (this.healer = i));
          }
      }
      (this.healer && this.healer.distTo(this) > 40 && (this.healer = null),
        this.healer &&
          this.health < this.maxHealth &&
          (this.health = Math.min(this.maxHealth, this.health + 1)));
    }
    const i = this.flapSpeed();
    ((this.flap += i),
      Math.floor(this.flap) !== Math.floor(this.prevFlap) &&
        Sound.ev("entity.ender_dragon.flap", this.pos, 5, 0.8 + 0.3 * Math.random()),
      this.age % 200 == 0 &&
        Math.random() < 0.5 &&
        Sound.ev("entity.ender_dragon.growl", this.pos, 5, 0.8 + 0.3 * Math.random()));
    const h = 0 === s.deathTime && !s.creative && "end" === t.dim;
    this.phaseT++;
    let e,
      a = 0.6,
      o = 0;
    for (const s of t.entities) s instanceof EndCrystal && !s.dead && o++;
    switch (this.phase) {
      case "circle": {
        this.circleA += 0.008 * this.circleDir;
        const t = 70;
        if (
          ((e = [
            Math.cos(this.circleA) * t,
            95 + 10 * Math.sin(3 * this.circleA),
            Math.sin(this.circleA) * t,
          ]),
          this.phaseT > 60 && this.age % 20 == 0)
        ) {
          const t = Math.random();
          t < 1 / (o + 3)
            ? this.setPhase("land")
            : h &&
              (t < 0.25
                ? this.setPhase("strafe")
                : t < 0.32
                  ? this.setPhase("charge")
                  : t < 0.34 && (this.circleDir *= -1));
        }
        break;
      }
      case "strafe": {
        if (!h) {
          this.setPhase("circle");
          break;
        }
        e = [s.pos[0], Math.max(s.pos[1] + 18, 75), s.pos[2]];
        const i = Math.hypot(s.pos[0] - this.pos[0], s.pos[2] - this.pos[2]),
          a = [-Math.sin(this.yaw), -Math.cos(this.yaw)],
          o = [(s.pos[0] - this.pos[0]) / i, (s.pos[2] - this.pos[2]) / i];
        if (i < 64 && a[0] * o[0] + a[1] * o[1] > 0.85 && this.phaseT > 20) {
          const i = this.headPos || this.pos,
            h = s.pos[0] - i[0],
            e = s.pos[1] + 1 - i[1],
            a = s.pos[2] - i[2],
            o = Math.hypot(h, e, a);
          (t.addEntity(
            new DragonFireball(
              t,
              i[0],
              i[1],
              i[2],
              [(h / o) * 1.2, (e / o) * 1.2, (a / o) * 1.2],
              this,
            ),
          ),
            Sound.ev("entity.ender_dragon.shoot", this.pos, 5, 1),
            this.setPhase("circle"));
        }
        this.phaseT > 300 && this.setPhase("circle");
        break;
      }
      case "charge":
        if (!h) {
          this.setPhase("circle");
          break;
        }
        ((e = [s.pos[0], s.pos[1] + 1, s.pos[2]]),
          (a = 1),
          (this.distTo(s) < 6 || this.phaseT > 120) && this.setPhase("circle"));
        break;
      case "land":
        ((e = this.perchPoint()), (a = 0.5));
        (Math.hypot(e[0] - this.pos[0], e[1] - this.pos[1], e[2] - this.pos[2]) < 3 &&
          this.setPhase("perch"),
          this.phaseT > 500 && this.setPhase("circle"));
        break;
      case "perch":
        if (((e = this.perchPoint()), (a = 0.1), h)) {
          const t = s.pos[0] - this.pos[0],
            i = s.pos[2] - this.pos[2];
          this.wantYaw = Math.atan2(-t, -i);
        }
        if (this.phaseT % 50 == 25 && h && this.distTo(s) < 24) {
          const s = this.headPos || this.pos,
            i = -Math.sin(this.yaw),
            h = -Math.cos(this.yaw);
          let e = Math.floor(s[1]);
          for (
            ;
            e > 1 &&
            !BLOCKS[this.world.getBlock(Math.floor(s[0] + 2 * i), e - 1, Math.floor(s[2] + 2 * h))]
              .solid;
          )
            e--;
          (t.addEntity(new AreaCloud(t, s[0] + 3 * i, e, s[2] + 3 * h, 3.5, 60, this)),
            Sound.ev("entity.ender_dragon.growl", this.pos, 5, 1));
        }
        this.phaseT > 320 && this.setPhase("takeoff");
        break;
      case "takeoff":
        ((e = [this.pos[0] - 20 * Math.sin(this.yaw), 105, this.pos[2] - 20 * Math.cos(this.yaw)]),
          (this.pos[1] > 95 || this.phaseT > 100) && this.setPhase("circle"));
    }
    e ||
      (e = [
        70 * Math.cos(this.circleA),
        95 + 10 * Math.sin(3 * this.circleA),
        70 * Math.sin(this.circleA),
      ]);
    const r = e[0] - this.pos[0],
      n = e[1] - this.pos[1],
      p = e[2] - this.pos[2],
      l = Math.hypot(r, n, p) || 1;
    if ("perch" === this.phase) {
      if (((this.vel = [0.1 * r, 0.1 * n, 0.1 * p]), void 0 !== this.wantYaw)) {
        let t = this.wantYaw - this.yaw;
        for (; t > Math.PI;) t -= 2 * Math.PI;
        for (; t < -Math.PI;) t += 2 * Math.PI;
        this.yaw += clamp(t, -0.05, 0.05);
      }
    } else {
      let t = Math.atan2(-r, -p) - this.yaw;
      for (; t > Math.PI;) t -= 2 * Math.PI;
      for (; t < -Math.PI;) t += 2 * Math.PI;
      const s = Math.hypot(this.vel[0], this.vel[2]) + 1,
        i = 0.7 / Math.min(s, 40) / s;
      ((this.yawVel = 0.8 * (this.yawVel || 0) + clamp((180 * t) / Math.PI, -50, 50) * i),
        (this.yaw += (0.1 * this.yawVel * Math.PI) / 180));
      const h = [-Math.sin(this.yaw), -Math.cos(this.yaw)],
        e = Math.abs(t) > 1 ? 0.5 : 1;
      ((this.vel[0] += 0.08 * (h[0] * a * e - this.vel[0])),
        (this.vel[2] += 0.08 * (h[1] * a * e - this.vel[2])),
        (this.vel[1] += 0.08 * (clamp(n / l, -0.6, 0.6) * a - this.vel[1])));
    }
    ((this.pos[0] += this.vel[0]),
      (this.pos[1] += this.vel[1]),
      (this.pos[2] += this.vel[2]),
      (this.pitchD = lerp(this.pitchD, clamp(0.8 * this.vel[1], -0.6, 0.6), 0.1)));
    const d = Math.sin(this.yaw),
      c = Math.cos(this.yaw),
      m = "perch" === this.phase ? -2.5 : 0;
    if (
      ((this.headPos = [
        this.pos[0] - 7 * d,
        this.pos[1] + 2 + m + 3 * this.pitchD,
        this.pos[2] - 7 * c,
      ]),
      h && s.invuln <= 0)
    )
      for (const t of this.parts()) {
        const i = t.box,
          h = s.box();
        if (
          h[0] < i[3] &&
          h[3] > i[0] &&
          h[1] < i[4] &&
          h[4] > i[1] &&
          h[2] < i[5] &&
          h[5] > i[2]
        ) {
          if (t.head) s.hurt(10, { type: "mob", attacker: this, knockFrom: this.pos, knock: 1 });
          else if ("perch" !== this.phase) {
            const t = s.pos[0] - this.pos[0],
              i = s.pos[2] - this.pos[2],
              h = Math.hypot(t, i) || 1;
            ((s.vel[0] += (t / h) * 2),
              (s.vel[2] += (i / h) * 2),
              (s.vel[1] = 0.6),
              s.hurt(5, { type: "mob", attacker: this }));
          }
          break;
        }
      }
    if ("perch" !== this.phase && this.age % 2 == 0 && !1 !== t.rule("mob_griefing")) {
      let s = 0;
      const i = this.parts()[1].box;
      for (let h = Math.floor(i[0]); h <= Math.floor(i[3]) && s < 12; h++)
        for (let e = Math.floor(i[1]); e <= Math.floor(i[4]) && s < 12; e++)
          for (let a = Math.floor(i[2]); a <= Math.floor(i[5]) && s < 12; a++) {
            const i = this.world.getBlock(h, e, a);
            !i ||
              [172, 28, 6, 174, 175, 176, 180, 21].includes(i) ||
              IS_FLUID[i] ||
              (this.world.setBlock(h, e, a, 0, 0), s++, t.particles.blockBreak(h, e, a, i, 0));
          }
      s && Sound.explode(this.pos);
    }
  }
  flapSpeed() {
    return "perch" === this.phase
      ? 0.1
      : (0.2 / (10 * Math.hypot(this.vel[0], this.vel[2]) + 1)) * Math.pow(2, this.vel[1]);
  }
}
//# sourceURL=js/mobs2.js
