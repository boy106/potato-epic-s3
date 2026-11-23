"use strict";
(Object.assign(MOB_TYPES, {
  piglin: {
    cn: "猪灵",
    hp: 16,
    w: 0.6,
    h: 1.95,
    speed: 0.35,
    model: "zombified_piglin",
    tex: "piglin",
    hostile: !0,
    neutral: !0,
    attack: 5,
    drops: [],
    scale: 0.9375,
  },
  hoglin: {
    cn: "疣猪兽",
    hp: 40,
    w: 1.3965,
    h: 1.4,
    speed: 0.3,
    model: "hoglin",
    hostile: !0,
    attack: 6,
    drops: [
      ["porkchop", 2, 4, "cooked_porkchop"],
      ["leather", 0, 1],
    ],
    scale: 1,
  },
  strider: {
    cn: "炽足兽",
    hp: 20,
    w: 0.9,
    h: 1.7,
    speed: 0.175,
    model: "strider",
    passive: !0,
    fireproof: !0,
    drops: [["string", 2, 5]],
    scale: 1,
  },
}),
  (() => {
    const t = createMob;
    createMob = function (e, s, o, i, r) {
      return "piglin" === s
        ? new Piglin(e, o, i, r)
        : "hoglin" === s
          ? new Hoglin(e, o, i, r)
          : "strider" === s
            ? new Strider(e, o, i, r)
            : t(e, s, o, i, r);
    };
  })());
const wearsGold = (t) =>
    t.inv.slots.slice(36, 40).some((t) => t && ITEMS[t.id].key.startsWith("golden_")),
  BARTER = [
    ["iron_boots", 8, 1, 1],
    ["ender_pearl", 10, 2, 4],
    ["string", 20, 3, 9],
    ["quartz", 20, 5, 12],
    ["obsidian", 40, 1, 1],
    ["crying_obsidian", 40, 1, 3],
    ["fire_charge", 40, 1, 1],
    ["leather", 40, 2, 4],
    ["soul_sand", 40, 2, 8],
    ["nether_brick", 40, 2, 8],
    ["arrow", 40, 6, 12],
    ["gravel", 40, 8, 16],
    ["blackstone", 40, 8, 16],
    ["iron_nugget", 10, 10, 36],
  ];
class Piglin extends Mob {
  constructor(t, e, s, o) {
    (super(t, "piglin", e, s, o), (this.angry = 0), (this.admire = 0), (this.persistent = !1));
  }
  hurt(t, e) {
    const s = super.hurt(t, e);
    if (s && e && e.attacker) {
      for (const t of this.game.entities)
        t instanceof Piglin &&
          t.distTo(this) < 16 &&
          ((t.angry = 600), (t.target = e.attacker), (t.admire = 0));
      Sound.ev("entity.piglin.angry", this.pos, 1, 1);
    }
    return s;
  }
  give(t) {
    return (
      !(this.admire > 0 || this.angry > 0) &&
      ((this.admire = 120),
      (this.target = null),
      (this.holding = item("gold_ingot")),
      Sound.ev("entity.piglin.admiring_item", this.pos, 1, 1),
      !0)
    );
  }
  barter() {
    const t = BARTER.filter((t) => void 0 !== ITEM_KEY[t[0]]),
      e = t.reduce((t, e) => t + e[1], 0);
    let s = Math.random() * e;
    for (const [e, o, i, r] of t) {
      if ((s -= o) >= 0) continue;
      const t = this.game,
        n = Math.atan2(t.player.pos[0] - this.pos[0], t.player.pos[2] - this.pos[2]);
      return void t.dropItem(
        this.pos[0],
        this.pos[1] + 1.2,
        this.pos[2],
        makeStack(e, i + Math.floor(Math.random() * (r - i + 1))),
        [0.2 * Math.sin(n), 0.25, 0.2 * Math.cos(n)],
      );
    }
  }
  tick() {
    const t = this.game,
      e = t.player;
    if (this.admire > 0) {
      if ((this.savePrev(), this.baseTick(), this.deathTick())) return;
      return (
        0 === --this.admire && ((this.holding = null), this.barter()),
        (this.headYaw *= 0.8),
        (this.pitch = 0.5),
        this.travel(0, 0, 0, !1),
        void this.animate()
      );
    }
    if (this.age % 10 == 0)
      for (const e of t.entities)
        if (
          e instanceof ItemEntity &&
          !e.dead &&
          e.stack.id === ITEM_KEY.gold_ingot &&
          !(e.distTo(this) > 8)
        ) {
          e.distTo(this) < 1.5
            ? this.give(e.stack) && --e.stack.count <= 0 && (e.dead = !0)
            : ((this.wander = [e.pos[0], e.pos[1], e.pos[2]]), (this.wanderT = 40));
          break;
        }
    const s = wearsGold(e) && this.angry <= 0;
    (this.angry > 0 && this.angry--,
      (this.T = s ? PIGLIN_CALM : MOB_TYPES.piglin),
      s && this.target === e && (this.target = null),
      super.tick(),
      (this.T = MOB_TYPES.piglin));
  }
  pose(t) {
    const e = super.pose(t),
      s = 0.6662 * lerp(this.limbSwing - this.limbAmt, this.limbSwing, t),
      o = this.limbAmt;
    return (
      (e.rarm = {
        rx:
          1.4 * Math.cos(s + Math.PI) * o * 0.5 +
          (this.swingT > 0 ? Math.sin((this.swingT / 6) * Math.PI) : 0),
      }),
      (e.larm = { rx: this.admire > 0 ? 1.2 : 1.4 * Math.cos(s) * o * 0.5 }),
      (e.rleg = { rx: 1.4 * Math.cos(s) * o }),
      (e.lleg = { rx: 1.4 * Math.cos(s + Math.PI) * o }),
      e
    );
  }
}
const PIGLIN_CALM = Object.assign({}, MOB_TYPES.piglin, { hostile: !1 });
class Hoglin extends Mob {
  constructor(t, e, s, o) {
    (super(t, "hoglin", e, s, o), (this.persistent = !1));
  }
  tick() {
    this.game;
    const t = this.attackCd;
    if (this.age % 20 == 0) {
      const t = Math.floor(this.pos[0]),
        e = Math.floor(this.pos[1]),
        s = Math.floor(this.pos[2]);
      for (let o = -6; o <= 6 && !this.fleeing; o += 2)
        for (let i = -6; i <= 6; i += 2)
          if (this.world.getBlock(t + o, e, s + i) === BID.warped_fungus) {
            ((this.panic = 60), (this.target = null), (this.fleeing = !0));
            break;
          }
      this.fleeing = !1;
    }
    if ((super.tick(), 20 === this.attackCd && 20 !== t && this.target)) {
      const t = this.target,
        e = t.pos[0] - this.pos[0],
        s = t.pos[2] - this.pos[2],
        o = Math.hypot(e, s) || 1;
      ((t.vel[0] += (e / o) * 0.6),
        (t.vel[2] += (s / o) * 0.6),
        (t.vel[1] = Math.max(t.vel[1], 0.55)),
        Sound.ev("entity.hoglin.attack", this.pos, 1, 1));
    }
  }
  pose(t) {
    const e = 0.6662 * lerp(this.limbSwing - this.limbAmt, this.limbSwing, t),
      s = this.limbAmt,
      o = 1.2 * Math.cos(e) * s,
      i = 1.2 * Math.cos(e + Math.PI) * s,
      r = this.swingT > 0 ? 0.6 * Math.sin((this.swingT / 6) * Math.PI) : 0;
    return {
      head: { ry: this.headYaw, rx: -r },
      leg0: { rx: o },
      leg1: { rx: i },
      leg2: { rx: i },
      leg3: { rx: o },
    };
  }
}
class Strider extends Mob {
  constructor(t, e, s, o) {
    (super(t, "strider", e, s, o), (this.warm = !0), (this.persistent = !0));
  }
  lavaBelow() {
    return (
      this.world.getBlock(
        Math.floor(this.pos[0]),
        Math.floor(this.pos[1] - 0.1),
        Math.floor(this.pos[2]),
      ) === LAVA ||
      this.world.getBlock(
        Math.floor(this.pos[0]),
        Math.floor(this.pos[1]),
        Math.floor(this.pos[2]),
      ) === LAVA
    );
  }
  tick() {
    const t = this.world,
      e = Math.floor(this.pos[0]),
      s = Math.floor(this.pos[2]);
    let o = Math.floor(this.pos[1]);
    if (t.getBlock(e, o, s) === LAVA) {
      for (; t.getBlock(e, o + 1, s) === LAVA;) o++;
      this.pos[1] < o + 1 &&
        ((this.vel[1] = Math.min(0.15, o + 1 - this.pos[1])), (this.fallDist = 0));
    }
    const i =
      t.getBlock(e, Math.floor(this.pos[1] - 0.05), s) === LAVA &&
      t.getBlock(e, Math.floor(this.pos[1] + 0.2), s) !== LAVA;
    (i &&
      ((this.pos[1] = Math.floor(this.pos[1] - 0.05) + 1),
      (this.vel[1] = Math.max(0, this.vel[1])),
      (this.onGround = !0),
      (this.fallDist = 0)),
      (this.warm = this.lavaBelow() || i),
      super.tick(),
      (this.fire = 0),
      i && this.vel[1] < 0 && (this.vel[1] = 0));
  }
  pose(t) {
    const e = 1.5 * lerp(this.limbSwing - this.limbAmt, this.limbSwing, t),
      s = Math.min(1, 2 * this.limbAmt),
      o = this.age + t,
      i = this.warm ? 0 : 0.05 * Math.sin(2 * o),
      r = {
        rleg: { rx: 2 * Math.sin(e) * s },
        lleg: { rx: 2 * Math.sin(e + Math.PI) * s },
        body: { rz: i, t: [0, 0.1 * Math.abs(Math.sin(e)) * s, 0] },
      },
      n = 0.1 * Math.sin(0.25 * o);
    return (
      (r.rb0 = { rz: n }),
      (r.rb1 = { rz: 0.8 * n }),
      (r.rb2 = { rz: 0.6 * n }),
      (r.lb0 = { rz: -n }),
      (r.lb1 = { rz: 0.8 * -n }),
      (r.lb2 = { rz: 0.6 * -n }),
      r
    );
  }
}
((() => {
  const t = Renderer.prototype.initModels2;
  Renderer.prototype.initModels2 = function () {
    t.call(this);
    const e = this.models,
      P = (t, e, s) => {
        for (const o of s) o.mesh = this.makeModelPart(o.boxes, t, e);
        return { parts: s };
      };
    ((e.hoglin = P(128, 64, [
      { name: "body", pivot: [0, 17, 0], boxes: [[1, 1, -8, -7, -13, 16, 14, 26]] },
      {
        name: "mane",
        parent: "body",
        pivot: [0, 14, -7],
        boxes: [[90, 33, 0, -10, -9, 0, 10, 19, 0.001]],
      },
      {
        name: "head",
        pivot: [0, 22, -12],
        rotX: -0.87266463,
        boxes: [[61, 1, -7, -3, -19, 14, 6, 19]],
      },
      {
        name: "rear",
        parent: "head",
        pivot: [6, 2, -3],
        rotZ: -0.6981317,
        boxes: [[1, 1, 0, 0, -2, 6, 1, 4]],
      },
      {
        name: "lear",
        parent: "head",
        pivot: [-6, 2, -3],
        rotZ: 0.6981317,
        boxes: [[1, 6, -6, 0, -2, 6, 1, 4]],
      },
      {
        name: "rhorn",
        parent: "head",
        pivot: [7, -2, -12],
        boxes: [[10, 13, -1, 0, -1, 2, 11, 2]],
      },
      {
        name: "lhorn",
        parent: "head",
        pivot: [-7, -2, -12],
        boxes: [[1, 13, -1, 0, -1, 2, 11, 2]],
      },
      { name: "leg0", pivot: [4, 14, -8.5], boxes: [[66, 42, -3, -14, -3, 6, 14, 6]] },
      { name: "leg1", pivot: [-4, 14, -8.5], boxes: [[41, 42, -3, -14, -3, 6, 14, 6]] },
      { name: "leg2", pivot: [5, 11, 10], boxes: [[21, 45, -2.5, -11, -2.5, 5, 11, 5]] },
      { name: "leg3", pivot: [-5, 11, 10], boxes: [[0, 45, -2.5, -11, -2.5, 5, 11, 5]] },
    ])),
      (e.strider = P(64, 128, [
        { name: "rleg", pivot: [4, 16, 0], boxes: [[0, 32, -2, -16, -2, 4, 16, 4]] },
        { name: "lleg", pivot: [-4, 16, 0], boxes: [[0, 55, -2, -16, -2, 4, 16, 4]] },
        { name: "body", pivot: [0, 23, 0], boxes: [[0, 0, -8, -8, -8, 16, 14, 16]] },
        {
          name: "rb0",
          parent: "body",
          pivot: [8, -4, -8],
          rotZ: -1.2217305,
          boxes: [[16, 65, 0, 0, 0, 12, 0, 16, 0, !0]],
        },
        {
          name: "rb1",
          parent: "body",
          pivot: [8, 1, -8],
          rotZ: -1.134464,
          boxes: [[16, 49, 0, 0, 0, 12, 0, 16, 0, !0]],
        },
        {
          name: "rb2",
          parent: "body",
          pivot: [8, 5, -8],
          rotZ: -0.87266463,
          boxes: [[16, 33, 0, 0, 0, 12, 0, 16, 0, !0]],
        },
        {
          name: "lb2",
          parent: "body",
          pivot: [-8, 6, -8],
          rotZ: 0.87266463,
          boxes: [[16, 33, -12, 0, 0, 12, 0, 16]],
        },
        {
          name: "lb1",
          parent: "body",
          pivot: [-8, 2, -8],
          rotZ: 1.134464,
          boxes: [[16, 49, -12, 0, 0, 12, 0, 16]],
        },
        {
          name: "lb0",
          parent: "body",
          pivot: [-8, -3, -8],
          rotZ: 1.2217305,
          boxes: [[16, 65, -12, 0, 0, 12, 0, 16]],
        },
      ])));
  };
})(),
  ["helmet", "chestplate", "leggings", "boots"].forEach((t, e) => {
    defItem("golden_" + t, "金" + ["头盔", "胸甲", "护腿", "靴子"][e], {
      stack: 1,
      durability: [77, 112, 105, 91][e],
      armor: { slot: e, points: [2, 5, 3, 1][e], tough: 0, mat: "golden" },
    });
  }),
  shaped("golden_helmet", 1, ["XXX", "X X"], { X: "gold_ingot" }),
  shaped("golden_chestplate", 1, ["X X", "XXX", "XXX"], { X: "gold_ingot" }),
  shaped("golden_leggings", 1, ["XXX", "X X", "X X"], { X: "gold_ingot" }),
  shaped("golden_boots", 1, ["X X", "X X"], { X: "gold_ingot" }));
for (const [t, e] of [
  ["piglin", "猪灵"],
  ["hoglin", "疣猪兽"],
  ["strider", "炽足兽"],
])
  defItem(t + "_spawn_egg", e + "刷怪蛋", { spawnEgg: t });
Game.prototype.fortressAt = function (t, e) {
  const s = this.world.structRefs;
  if (!s) return null;
  for (const o of s.values())
    if ("fortress" === o.name && t >= o.box[0] && t <= o.box[3] && e >= o.box[2] && e <= o.box[5])
      return o;
  return null;
};
const netherMade = (t) => {
  "magma_cube" === t.type && t.setSize && t.setSize([1, 2, 4][randInt(0, 2)]);
};
function netherSpot(t, e, s, o, i, r = !0) {
  const n = t.world,
    a = n.getBlock(s, o - 1, i),
    h = n.getBlock(s, o, i),
    l = n.getBlock(s, o + 1, i),
    room = (t) => 0 === t || (!BLOCKS[t].solid && !IS_FLUID[t] && !/fire$/.test(BLOCKS[t].key));
  return "strider" === e
    ? a === LAVA && 0 === h
    : !(
        !SOLIDCUBE[a] ||
        EMIT[a] >= 14 ||
        (a === BID.magma_block && !MOB_TYPES[e].fireproof) ||
        !room(h) ||
        !room(l)
      ) &&
        (("enderman" !== e && "skeleton" !== e && "wither_skeleton" !== e) ||
          !((15 & n.getLight(s, o, i)) > 7)) &&
        (!/piglin|hoglin/.test(e) || a !== BID.nether_wart_block) &&
        !(r && "ghast" === e && Math.random() >= 0.05);
}
((Game.prototype.spawnFortressGroup = function (t, e, s, o) {
  const i = this.world,
    r = self.STRUCT_DATA && STRUCT_DATA.structure.fortress,
    n = r && r.spawn_overrides && r.spawn_overrides.monster;
  if (!n) return !1;
  const spot = (e, s, o, r) =>
    i.getBlock(s, o - 1, r) === BID.nether_bricks &&
    this.fortressAt(s, r) === t &&
    netherSpot(this, e, s, o, r);
  for (let r = Math.max(1, t.box[1]); r <= t.box[4]; r++) {
    if (
      i.getBlock(e, r - 1, s) !== BID.nether_bricks ||
      0 !== i.getBlock(e, r, s) ||
      0 !== i.getBlock(e, r + 1, s)
    )
      continue;
    const t = spawnPickOf(n.spawns);
    if (t && spot(t.type.replace("minecraft:", ""), e, r, s))
      return (spawnAttempt(this, t, e, r, s, o, spot, () => spawnPickOf(n.spawns), netherMade), !0);
  }
  return !1;
}),
  (Game.prototype.spawnNetherV = function () {
    if (0 === this.difficulty) return;
    const t = spawnArea(this);
    if (!t.n) return;
    const e = {};
    for (const s of this.entities) {
      if (!(s instanceof Mob) || s.dead || spawnMustKeep(s) || !t.has(s.pos[0], s.pos[2])) continue;
      const o = s.T.passive ? "creature" : "monster";
      e[o] = (e[o] || 0) + 1;
    }
    for (let s = 0; s < 3; s++) {
      const s = t.pick();
      if (!s || !t.ok(s[0], s[1])) continue;
      const [o, i] = s,
        r = this.vbiomeAt(o, i);
      if (!r || !r.def.spawners) continue;
      const n = Math.random() < 0.1 ? "creature" : "monster";
      if ((e[n] || 0) >= Math.max(1, Math.round(SPAWN_CAPS[n] * t.scale))) continue;
      const a = "monster" === n && this.fortressAt(o, i);
      if (a && this.spawnFortressGroup(a, o, i, t)) return;
      const h = spawnPickOf(r.def.spawners[n]);
      if (!h) continue;
      const l = h.type.replace("minecraft:", "");
      for (let e = 0; e < 8; e++) {
        const e = 8 + Math.floor(110 * Math.random());
        if (netherSpot(this, l, o, e, i, !1)) {
          if ("ghast" === l && Math.random() >= 0.05) return;
          return void spawnAttempt(
            this,
            h,
            o,
            e,
            i,
            t,
            (t, e, s, o) => netherSpot(this, t, e, s, o),
            (t, e) => {
              const s = this.vbiomeAt(t, e);
              return s && s.def.spawners ? spawnPickOf(s.def.spawners[n]) : null;
            },
            netherMade,
          );
        }
      }
    }
  }),
  (() => {
    const t = Ghast.prototype.tick;
    Ghast.prototype.tick = function () {
      if (!(
        !this.persistent &&
        !this.customName &&
        !this.remote &&
        !this.leashHolder &&
        this.age > 600 &&
        Math.random() < 1 / 800 &&
        this.distTo(this.game.player) > 32
      ))
        return t.call(this);
      this.dead = !0;
    };
  })());
//# sourceURL=js/nether_mobs.js
