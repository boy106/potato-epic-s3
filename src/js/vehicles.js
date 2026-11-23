"use strict";
const BOAT_WOODS = [
    "oak",
    "spruce",
    "birch",
    "jungle",
    "acacia",
    "dark_oak",
    "mangrove",
    "cherry",
    "pale_oak",
    "bamboo",
  ],
  BOAT_ITEM = {};
for (const t of BOAT_WOODS) {
  const s = "bamboo" === t;
  ((BOAT_ITEM[t + (s ? "_raft" : "_boat")] = [t, !1]),
    (BOAT_ITEM[t + (s ? "_chest_raft" : "_chest_boat")] = [t, !0]));
}
const CART_ITEM = {
  minecart: "",
  chest_minecart: "chest",
  furnace_minecart: "furnace",
  tnt_minecart: "tnt",
  hopper_minecart: "hopper",
  command_block_minecart: "command_block",
};
function vanillaPart(t, s, e, i) {
  return {
    name: t,
    pivot: [-s[0], -s[1], s[2]],
    rotX: -(e[0] || 0),
    rotY: -(e[1] || 0),
    rotZ: e[2] || 0,
    boxes: i.map(([t, s, e, i, o, a, h, n, r, l]) => [
      t,
      s,
      -(e + a),
      -(i + h),
      o,
      a,
      h,
      n,
      r || 0,
      !!l,
    ]),
  };
}
((Renderer.prototype.initVehicleModels = function () {
  if (this.models.vh_boat) return;
  const t = this.models,
    P = (t, s, e) => {
      for (const i of e) i.mesh = this.makeModelPart(i.boxes, t, s);
      return { parts: e };
    },
    s = Math.PI,
    paddle = (t, s) => [
      [t, s, -1, 0, -5, 2, 2, 18],
      [t, s, -1.001, -3, 8, 1, 6, 7],
    ],
    e = [
      vanillaPart("bottom", [0, 3, 1], [s / 2, 0, 0], [[0, 0, -14, -9, -3, 28, 16, 3]]),
      vanillaPart("back", [-15, 4, 4], [0, 1.5 * s, 0], [[0, 19, -13, -7, -1, 18, 6, 2]]),
      vanillaPart("front", [15, 4, 0], [0, s / 2, 0], [[0, 27, -8, -7, -1, 16, 6, 2]]),
      vanillaPart("right", [0, 4, -9], [0, s, 0], [[0, 35, -14, -7, -1, 28, 6, 2]]),
      vanillaPart("left", [0, 4, 9], [0, 0, 0], [[0, 43, -14, -7, -1, 28, 6, 2]]),
      vanillaPart("lp", [3, -5, 9], [0, 0, s / 16], paddle(62, 0)),
      vanillaPart("rp", [3, -5, -9], [0, s, -s / 16], paddle(62, 20)),
    ],
    chest = (t) => [
      vanillaPart("chest_bottom", [-2, t, -6], [0, -s / 2, 0], [[0, 76, 0, 0, 0, 12, 8, 12]]),
      vanillaPart("chest_lid", [-2, t - 4, -6], [0, -s / 2, 0], [[0, 59, 0, 0, 0, 12, 4, 12]]),
      vanillaPart("chest_lock", [-1, t - 1, -1], [0, -s / 2, 0], [[0, 59, 0, 0, 0, 2, 4, 1]]),
    ];
  ((t.vh_boat = P(128, 64, e)),
    (t.vh_chest_boat = P(128, 128, [...e.map((t) => ({ ...t })), ...chest(-5)])),
    (t.vh_boat_patch = P(128, 64, [
      vanillaPart("water_patch", [0, -3, 1], [s / 2, 0, 0], [[0, 0, -14, -9, -3, 28, 16, 3]]),
    ])));
  const i = [
    vanillaPart(
      "bottom",
      [0, -2.1, 1],
      [1.5708, 0, 0],
      [
        [0, 0, -14, -11, -4, 28, 20, 4],
        [0, 0, -14, -9, -8, 28, 16, 4],
      ],
    ),
    vanillaPart("lp", [3, -4, 9], [0, 0, s / 16], paddle(0, 24)),
    vanillaPart("rp", [3, -4, -9], [0, s, -s / 16], paddle(40, 24)),
  ];
  ((t.vh_raft = P(128, 64, i)),
    (t.vh_chest_raft = P(128, 128, [...i.map((t) => ({ ...t })), ...chest(-10.1)])));
  const side = (t, s) => vanillaPart("s", t, [0, s, 0], [[0, 0, -8, -9, -1, 16, 8, 2]]);
  t.vh_minecart = P(64, 32, [
    vanillaPart("bottom", [0, 4, 0], [s / 2, 0, 0], [[0, 10, -10, -8, -1, 20, 16, 2]]),
    side([-9, 4, 0], 1.5 * s),
    side([9, 4, 0], s / 2),
    side([0, 4, -7], s),
    side([0, 4, 7], 0),
  ]);
}),
  (Renderer.prototype.vehicleModel = function (t) {
    return (this.initVehicleModels(), t);
  }));
class Vehicle extends Entity {
  constructor(t, s, e, i, o, a) {
    (super(t, s, e, i, o, a),
      (this.isVehicle = !0),
      (this.hittable = !0),
      (this.rider = null),
      (this.damage = 0),
      (this.hurtT = 0),
      (this.hurtDir = 1),
      (this.yaw = 0));
  }
  hurt(t, s) {
    if (
      this.dead ||
      !s ||
      (!s.player &&
        s.attacker !== this.game.player &&
        "explosion" !== s.type &&
        "arrow" !== s.type &&
        "lava" !== s.type)
    )
      return !1;
    const e = this.game,
      i = s.player && "creative" === e.mode;
    return (
      (this.hurtDir = -this.hurtDir),
      (this.hurtT = 10),
      (this.damage += 10 * t),
      (i || this.damage > 40) &&
        (this.rider && this.rider.dismount(), i || this.dropSelf(), (this.dead = !0)),
      !0
    );
  }
  dropSelf() {
    const t = this.game;
    (this.unpackLoot(),
      t.dropItem(this.pos[0], this.pos[1] + 0.3, this.pos[2], makeStack(this.itemKey)));
    for (const s of this.slots || [])
      s && t.dropItem(this.pos[0], this.pos[1] + 0.3, this.pos[2], { ...s });
  }
  interact(t) {
    return (
      t.vehicle !== this &&
      (this.slots && t.sneaking
        ? (this.openChest(), !0)
        : !(this.rider || t.sneaking || !this.canRide) && (t.mount(this), !0))
    );
  }
  unpackLoot() {
    if (!this.loot || !this.slots) return;
    const t = RNG(
      hashStr(
        "loot" +
          this.game.world.seed +
          ":" +
          Math.floor(this.pos[0]) +
          ":" +
          Math.floor(this.pos[2]),
      ),
    );
    ("undefined" != typeof Loot && Loot.fill(this.slots, this.loot, t), (this.loot = null));
  }
  openChest() {
    this.unpackLoot();
    const t = this.game,
      s = { pos: this.pos.map(Math.floor), slots: this.slots, type: "chest" },
      e = new ChestScreen(t, [s], ITEMS[ITEM_KEY[this.itemKey]].cn);
    ((e.close = () => {
      Sound.chest(this.pos, !1);
    }),
      t.ui.open(e),
      Sound.chest(this.pos, !0));
  }
  saveData() {
    return { yaw: this.yaw, slots: this.slots, fuel: this.fuel, loot: this.loot || void 0 };
  }
  loadData(t) {
    ((this.yaw = t.yaw || 0),
      t.slots && this.slots && (this.slots = t.slots),
      t.fuel && (this.fuel = t.fuel),
      t.loot && (this.loot = t.loot));
  }
}
class Boat extends Vehicle {
  constructor(t, s, e, i, o = "oak", a = !1) {
    (super(t, s, e, i, 1.375, 0.5625),
      (this.wood = o),
      (this.chest = a),
      (this.raft = "bamboo" === o),
      (this.type = (a ? "chest_" : "") + "boat:" + o),
      (this.itemKey =
        o + (this.raft ? (a ? "_chest_raft" : "_raft") : a ? "_chest_boat" : "_boat")),
      (this.canRide = !0),
      (this.deltaRot = 0),
      (this.status = "air"),
      (this.paddle = [0, 0]),
      a && (this.slots = new Array(27).fill(null)));
  }
  waterState() {
    const t = this.box(),
      s = this.world;
    let e = null,
      i = !1;
    for (let o = Math.floor(t[0]); o <= Math.floor(t[3] - 0.001); o++)
      for (let a = Math.floor(t[2]); a <= Math.floor(t[5] - 0.001); a++)
        for (let h = Math.floor(t[1]); h <= Math.floor(t[4]) + 1; h++) {
          const n = s.getBlock(o, h, a);
          if (!(n === WATER || WLOG[n] || (n && s.isWaterlogged(o, h, a)))) continue;
          const r = h + 1 - (n === WATER ? Math.min(7, 7 & s.getMeta(o, h, a)) / 9 : 0) - 0.11;
          (r >= t[1] - 0.001 && (null === e || r > e) && (e = r), r > t[4] + 0.001 && (i = !0));
        }
    return { top: e, under: i };
  }
  landFriction() {
    const t = this.box(),
      s = this.world,
      e = Math.floor(t[1] - 0.001);
    let i = 0,
      o = 0;
    for (let a = Math.floor(t[0]); a <= Math.floor(t[3]); a++)
      for (let h = Math.floor(t[2]); h <= Math.floor(t[5]); h++) {
        const t = s.getBlock(a, e, h);
        t && BLOCKS[t].solid && ((i += BLOCKS[t].slip || 0.6), o++);
      }
    return o ? i / o : 0;
  }
  tick() {
    (this.savePrev(),
      this.age++,
      this.hurtT > 0 && this.hurtT--,
      this.damage > 0 && (this.damage = Math.max(0, this.damage - 1)));
    let t = !1;
    const s = this.box();
    for (let e = Math.floor(s[0] + 0.001); e <= Math.floor(s[3] - 0.001) && !t; e++)
      for (let i = Math.floor(s[2] + 0.001); i <= Math.floor(s[5] - 0.001) && !t; i++)
        for (let o = Math.floor(s[1] + 0.001); o <= Math.floor(s[4] - 0.001); o++)
          if (this.world.getBlock(e, o, i) === LAVA) {
            t = !0;
            break;
          }
    if (t && (this.hurt(4, { type: "lava" }), this.dead)) return;
    const e = this.vel,
      i = this.waterState(),
      o = this.onGround ? this.landFriction() : 0,
      a = this.status;
    this.status = i.under ? "under" : null !== i.top ? "water" : o ? "land" : "air";
    let h = 0,
      n = 0.05;
    "air" === a && "water" === this.status
      ? ((this.pos[1] = i.top - this.h + 0.101), (e[1] = 0))
      : ("water" === this.status
          ? ((h = (i.top - this.pos[1]) / this.h), (n = 0.9))
          : "under" === this.status
            ? ((h = 0.01), (n = 0.45))
            : (n = "air" === this.status ? 0.9 : o),
        (e[0] *= n),
        (e[2] *= n),
        (e[1] += -0.04),
        (this.deltaRot *= n),
        h > 0 && (e[1] = 0.75 * (e[1] + 0.06153846 * h)));
    const r = this.rider && this.rider.rideInput;
    if (r && ("water" === this.status || "land" === this.status || "under" === this.status)) {
      let t = 0;
      (r.strafe < 0 && this.deltaRot--,
        r.strafe > 0 && this.deltaRot++,
        r.strafe && !r.fwd && (t += 0.005),
        r.fwd > 0 && (t += 0.04),
        r.fwd < 0 && (t -= 0.005),
        (e[0] += -Math.sin(this.yaw) * t),
        (e[2] += -Math.cos(this.yaw) * t),
        (this.paddle[0] += r.fwd || r.strafe > 0 ? Math.PI / 8 : 0),
        (this.paddle[1] += r.fwd || r.strafe < 0 ? Math.PI / 8 : 0));
    }
    ((this.yaw -= (this.deltaRot * Math.PI) / 180),
      this.move(e[0], e[1], e[2]),
      this.bubbleTick(),
      this.rider && this.rider.followVehicle(this));
  }
  bubbleTick() {
    const t = this.world,
      s = Math.floor(this.pos[0]),
      e = Math.floor(this.pos[2]);
    let i = 0;
    for (const o of [Math.floor(this.pos[1]), Math.floor(this.pos[1]) - 1]) {
      const a = t.bubbleColumnAt(s, o, e);
      if (a && t.getBlock(s, o + 1, e) === AIR) {
        i = a;
        break;
      }
    }
    i
      ? (this.bubbleT || (this.bubbleT = 60),
        --this.bubbleT > 0 ||
          (i < 0
            ? ((this.vel[1] -= 0.7),
              this.rider && this.rider.dismount(),
              this.mob && this.dropMob())
            : (this.vel[1] = this.rider ? 2.7 : 0.6)))
      : (this.bubbleT = 0);
  }
  seat() {
    return [this.pos[0], this.pos[1] - 0.45 + (this.raft ? 0.1 : 0), this.pos[2]];
  }
  drawSelf(t, s, e, i, o) {
    const a = t.renderer;
    a.initVehicleModels();
    const h = M4.create();
    (M4.translate(h, s[0], s[1] + 0.375, s[2]),
      M4.rotY(h, lerp(this.prevYaw ?? this.yaw, this.yaw, e) - Math.PI / 2),
      this.hurtT > 0 &&
        M4.rotX(
          h,
          (Math.sin(this.hurtT - e) *
            (this.hurtT - e) *
            (this.damage / 10) *
            this.hurtDir *
            Math.PI) /
            180,
        ));
    const n = a.beTex((this.chest ? "chest_boat_" : "boat_") + this.wood),
      r = this.raft
        ? this.chest
          ? "vh_chest_raft"
          : "vh_raft"
        : this.chest
          ? "vh_chest_boat"
          : "vh_boat";
    (a.gl.disable(a.gl.CULL_FACE),
      a.drawModel(
        r,
        n,
        h,
        { lp: { rx: 0.6 * -Math.sin(this.paddle[0]) }, rp: { rx: 0.6 * Math.sin(this.paddle[1]) } },
        o,
        i,
      ),
      this.raft ||
        "under" === this.status ||
        a.shRecOnly ||
        (t.boatPatches || (t.boatPatches = [])).push([h, n, o]),
      a.gl.enable(a.gl.CULL_FACE));
  }
  savePrev() {
    (super.savePrev(), (this.prevYaw = this.yaw));
  }
}
const RAIL_EXITS = {
    north_south: [
      [0, 0, -1],
      [0, 0, 1],
    ],
    east_west: [
      [-1, 0, 0],
      [1, 0, 0],
    ],
    ascending_east: [
      [-1, -1, 0],
      [1, 0, 0],
    ],
    ascending_west: [
      [-1, 0, 0],
      [1, -1, 0],
    ],
    ascending_north: [
      [0, 0, -1],
      [0, -1, 1],
    ],
    ascending_south: [
      [0, -1, -1],
      [0, 0, 1],
    ],
    south_east: [
      [0, 0, 1],
      [1, 0, 0],
    ],
    south_west: [
      [0, 0, 1],
      [-1, 0, 0],
    ],
    north_west: [
      [0, 0, -1],
      [-1, 0, 0],
    ],
    north_east: [
      [0, 0, -1],
      [1, 0, 0],
    ],
  },
  isRail = (t) => !!t && !!BLOCKS[t] && /(^|_)rail$/.test(BLOCKS[t].key),
  railShape = (t, s, e, i) => {
    const o = t.getBlock(s, e, i);
    return isRail(o) ? Features.propOf(o, t.getMeta(s, e, i), "shape") : null;
  };
class Minecart extends Vehicle {
  constructor(t, s, e, i, o = "") {
    (super(t, s, e, i, 0.98, 0.7),
      (this.kind = o),
      (this.type = "minecart:" + o),
      (this.itemKey = o ? o + "_minecart" : "minecart"),
      (this.canRide = !o),
      (this.fuel = 0),
      (this.push = [0, 0]),
      "chest" === o && (this.slots = new Array(27).fill(null)),
      "hopper" === o && ((this.slots = new Array(5).fill(null)), (this.enabled = !0)));
  }
  interact(t, s) {
    return "furnace" === this.kind
      ? (s &&
          ("coal" === ITEMS[s.id].key || "charcoal" === ITEMS[s.id].key) &&
          this.fuel + 3600 <= 32e3 &&
          ((this.fuel += 3600),
          "creative" !== this.game.mode && (s.count--, s.count || (t.inv.slots[t.inv.sel] = null))),
        this.fuel > 0 && (this.push = [this.pos[0] - t.pos[0], this.pos[2] - t.pos[2]]),
        !0)
      : this.slots && !t.sneaking
        ? (this.openChest(), !0)
        : super.interact(t);
  }
  tick() {
    (this.savePrev(),
      this.age++,
      this.hurtT > 0 && this.hurtT--,
      this.damage > 0 && (this.damage = Math.max(0, this.damage - 1)));
    const t = this.world,
      s = this.vel;
    if ((this.updateFluids(), this.inLava && (this.hurt(4, { type: "lava" }), this.dead))) return;
    let e = Math.floor(this.pos[0]),
      i = Math.floor(this.pos[1]),
      o = Math.floor(this.pos[2]);
    isRail(t.getBlock(e, i - 1, o)) && i--;
    const a = t.getBlock(e, i, o);
    if (
      (isRail(a)
        ? (this.fallDist > 0 && this.onLand(this.fallDist), this.moveOnRail(e, i, o, a))
        : ((s[1] -= 0.04),
          this.onGround && ((s[0] *= 0.5), (s[2] *= 0.5)),
          this.move(clamp(s[0], -0.4, 0.4), s[1], clamp(s[2], -0.4, 0.4)),
          (s[0] *= 0.95),
          (s[1] *= 0.95),
          (s[2] *= 0.95)),
      !this.dead)
    ) {
      if (
        ("furnace" === this.kind &&
          (this.fuel > 0
            ? (this.fuel--,
              Math.random() < 0.25 &&
                this.game.particles.spawn(
                  "smoke",
                  this.pos[0],
                  this.pos[1] + 0.8,
                  this.pos[2],
                  0,
                  0.05,
                  0,
                ))
            : (this.push = [0, 0])),
        "tnt" === this.kind && void 0 !== this.primed)
      ) {
        if (--this.primed <= 0) return void this.explodeTnt(s[0] * s[0] + s[2] * s[2]);
        this.game.particles.spawn("smoke", this.pos[0], this.pos[1] + 0.5, this.pos[2], 0, 0, 0);
      }
      ("hopper" === this.kind && this.enabled && "undefined" != typeof RS && this.suck(),
        this.rider && this.rider.followVehicle(this),
        this.rollSound());
    }
  }
  primeTnt(t) {
    void 0 === this.primed && ((this.primed = t), Sound.ev("entity.tnt.primed", this.pos, 1, 1));
  }
  explodeTnt(t) {
    this.dead ||
      ((this.dead = !0),
      this.rider && this.rider.dismount(),
      this.game.explode(
        this.pos[0],
        this.pos[1],
        this.pos[2],
        4 + 1.5 * Math.random() * Math.min(Math.sqrt(t), 5),
        null,
      ));
  }
  hurt(t, s) {
    if ("tnt" === this.kind && s && !this.dead) {
      if ("arrow" === s.type && s.fire) return (this.explodeTnt(s.speed2 || 0), !0);
      const e = "explosion" === s.type || "lava" === s.type,
        i = (s.player && "creative" === this.game.mode) || this.damage + 10 * t > 40;
      if (e || (i && this.vel[0] * this.vel[0] + this.vel[2] * this.vel[2] >= 0.01))
        return (
          (this.hurtDir = -this.hurtDir),
          (this.hurtT = 10),
          this.primeTnt(((20 * Math.random()) | 0) + ((20 * Math.random()) | 0)),
          !0
        );
    }
    return super.hurt(t, s);
  }
  onLand(t) {
    "tnt" === this.kind && t >= 3 && this.explodeTnt((t / 10) * (t / 10));
  }
  suck() {
    const t = this.game,
      s = {
        size: 5,
        get: (t) => this.slots[t],
        set: (t, s) => {
          this.slots[t] = s;
        },
        canIn: () => !0,
        canOut: () => !0,
      },
      e = RS.container(
        t,
        Math.floor(this.pos[0]),
        Math.floor(this.pos[1] + 1.5),
        Math.floor(this.pos[2]),
      );
    if (e) {
      for (let t = 0; t < e.size; t++) {
        const i = e.get(t);
        if (i && e.canOut(t, "down") && !RS.insert(s, { ...i, count: 1 }, "up"))
          return (i.count--, void (i.count || e.set(t, null)));
      }
      return;
    }
    const i = this.box();
    for (const e of t.entities) {
      if (!(e instanceof ItemEntity) || e.dead) continue;
      if (
        e.pos[0] < i[0] - 0.25 ||
        e.pos[0] > i[3] + 0.25 ||
        e.pos[2] < i[2] - 0.25 ||
        e.pos[2] > i[5] + 0.25 ||
        e.pos[1] + 0.25 < i[1] ||
        e.pos[1] > i[4]
      )
        continue;
      const t = RS.insert(s, e.stack, "up");
      if (t) {
        if (t.count === e.stack.count) continue;
        e.stack = t;
      } else e.dead = !0;
      return;
    }
  }
  rollSound() {
    const t = Math.hypot(this.pos[0] - this.prev[0], this.pos[2] - this.prev[2]);
    let s = 0;
    (t >= 0.01
      ? ((this.sndPitch = Math.min(1, (this.sndPitch || 0) + 0.0025)),
        (s = lerp(0, 0.7, clamp(t, 0, 0.5))))
      : (this.sndPitch = 0),
      !(s > 0) ||
        (this.sndRoll && this.sndRoll.live) ||
        (this.sndRoll = Sound.loop("entity.minecart.riding")),
      this.sndRoll && this.sndRoll.update(this.pos, s, this.sndPitch));
    const e = this.game,
      i = e.player && e.player.vehicle === this;
    if (!i && !this.sndIn) return;
    const o = e.headInWater ? "entity.minecart.inside.underwater" : "entity.minecart.inside";
    this.sndIn && this.sndInEv !== o && (this.sndIn.stop(), (this.sndIn = null));
    const a = i && t >= 0.01 ? 0.75 * clamp(t, 0, 1) : 0;
    (!(a > 0) ||
      (this.sndIn && this.sndIn.live) ||
      ((this.sndIn = Sound.loop(o)), (this.sndInEv = o)),
      this.sndIn && this.sndIn.update(null, a, 1));
  }
  saveData() {
    return { ...super.saveData(), primed: this.primed, enabled: this.enabled, push: this.push };
  }
  loadData(t) {
    (super.loadData(t),
      void 0 !== t.primed && null !== t.primed && (this.primed = t.primed),
      void 0 !== t.enabled && (this.enabled = t.enabled),
      t.push && (this.push = t.push));
  }
  moveOnRail(t, s, e, i) {
    const o = this.world,
      a = this.vel,
      h = o.getMeta(t, s, e),
      n = Features.propOf(i, h, "shape"),
      r = BLOCKS[i].key,
      l = "true" === Features.propOf(i, h, "powered");
    this.fallDist = 0;
    const c = 0.0078125;
    "ascending_east" === n
      ? (a[0] -= c)
      : "ascending_west" === n
        ? (a[0] += c)
        : "ascending_north" === n
          ? (a[2] += c)
          : "ascending_south" === n && (a[2] -= c);
    const [p, d] = RAIL_EXITS[n] || RAIL_EXITS.north_south;
    let u = d[0] - p[0],
      f = d[2] - p[2];
    const m = Math.hypot(u, f);
    a[0] * u + a[2] * f < 0 && ((u = -u), (f = -f));
    let M = Math.min(2, Math.hypot(a[0], a[2]));
    ((a[0] = (M * u) / m), (a[2] = (M * f) / m));
    const _ = this.rider && this.rider.rideInput;
    if (_ && _.fwd > 0 && a[0] * a[0] + a[2] * a[2] < 0.01) {
      const t = this.rider.yaw,
        s = (-Math.sin(t) * u + -Math.cos(t) * f) / m;
      ((a[0] += (u / m) * s * 0.1), (a[2] += (f / m) * s * 0.1));
    }
    if (
      ("powered_rail" !== r ||
        l ||
        (Math.hypot(a[0], a[2]) < 0.03 ? ((a[0] = 0), (a[2] = 0)) : ((a[0] *= 0.5), (a[2] *= 0.5))),
      "furnace" === this.kind && this.fuel > 0)
    ) {
      let t = this.push[0],
        s = this.push[1];
      const e = Math.hypot(t, s);
      e > 1e-4 &&
        ((t /= e),
        (s /= e),
        t * u + s * f < 0 ? ((t = -u / m), (s = -f / m)) : ((t = u / m), (s = f / m)),
        (this.push = [t, s]),
        (a[0] = 0.8 * a[0] + 0.05 * t),
        (a[2] = 0.8 * a[2] + 0.05 * s));
    }
    const v = t + 0.5 + 0.5 * p[0],
      y = e + 0.5 + 0.5 * p[2],
      b = t + 0.5 + 0.5 * d[0] - v,
      w = e + 0.5 + 0.5 * d[2] - y;
    let g;
    ((g =
      0 === b
        ? this.pos[2] - e
        : 0 === w
          ? this.pos[0] - t
          : 2 * ((this.pos[0] - v) * b + (this.pos[2] - y) * w)),
      (this.pos[0] = v + b * g),
      (this.pos[2] = y + w * g));
    const k = "furnace" === this.kind ? (this.inWater ? 0.15 : 0.2) : this.inWater ? 0.2 : 0.4,
      I = clamp(a[0], -k, k),
      S = clamp(a[2], -k, k);
    ((this.pos[0] += I), (this.pos[2] += S));
    const T = this.pos[0] - t,
      R = this.pos[2] - e;
    let A = 0.0625;
    "ascending_east" === n
      ? (A += T)
      : "ascending_west" === n
        ? (A += 1 - T)
        : "ascending_north" === n
          ? (A += 1 - R)
          : "ascending_south" === n && (A += R);
    let B = s + A;
    const E = Math.floor(this.pos[0]),
      O = Math.floor(this.pos[2]);
    if (E !== t || O !== e) {
      const t = o.getBlock(E, s, O);
      if (isRail(o.getBlock(E, s + 1, O))) B = s + 1 + 0.0625;
      else if (isRail(t)) {
        const e = Features.propOf(t, o.getMeta(E, s, O), "shape"),
          i = this.pos[0] - E,
          a = this.pos[2] - O;
        B =
          s +
          0.0625 +
          ("ascending_east" === e
            ? i
            : "ascending_west" === e
              ? 1 - i
              : "ascending_north" === e
                ? 1 - a
                : "ascending_south" === e
                  ? a
                  : 0);
      } else isRail(o.getBlock(E, s - 1, O)) && (B = s - 1 + 0.0625 + 0.99);
    }
    const x = n && n.startsWith("ascending"),
      L = x ? 0.35 : 0.49,
      D = [
        this.pos[0] - L,
        B + (x ? 0.45 : 0.1),
        this.pos[2] - L,
        this.pos[0] + L,
        B + 0.7,
        this.pos[2] + L,
      ];
    (this.collides(D)
      ? ((this.pos[0] -= I), (this.pos[2] -= S), (a[0] = 0), (a[2] = 0))
      : (this.pos[1] = B),
      (a[1] = 0));
    const V = this.rider ? 0.997 : 0.96;
    if (((a[0] *= V), (a[2] *= V), "powered_rail" === r && l)) {
      const t = Math.hypot(a[0], a[2]);
      t > 0.01
        ? ((a[0] += (a[0] / t) * 0.06), (a[2] += (a[2] / t) * 0.06))
        : 0 === u
          ? this.collides([
              this.pos[0] - 0.5,
              B + 0.2,
              this.pos[2] - 1.3,
              this.pos[0] + 0.5,
              B + 0.6,
              this.pos[2] - 0.6,
            ])
            ? (a[2] = 0.02)
            : this.collides([
                this.pos[0] - 0.5,
                B + 0.2,
                this.pos[2] + 0.6,
                this.pos[0] + 0.5,
                B + 0.6,
                this.pos[2] + 1.3,
              ]) && (a[2] = -0.02)
          : this.collides([
                this.pos[0] - 1.3,
                B + 0.2,
                this.pos[2] - 0.5,
                this.pos[0] - 0.6,
                B + 0.6,
                this.pos[2] + 0.5,
              ])
            ? (a[0] = 0.02)
            : this.collides([
                this.pos[0] + 0.6,
                B + 0.2,
                this.pos[2] - 0.5,
                this.pos[0] + 1.3,
                B + 0.6,
                this.pos[2] + 0.5,
              ]) && (a[0] = -0.02);
    }
    if (
      ("activator_rail" === r &&
        ("hopper" === this.kind && (this.enabled = !l),
        l && ("tnt" === this.kind && this.primeTnt(80), this.rider && this.rider.dismount())),
      Math.abs(a[0]) + Math.abs(a[2]) > 0.001)
    ) {
      let t = Math.atan2(-a[0], -a[2]) - this.yaw;
      for (; t > Math.PI;) t -= 2 * Math.PI;
      for (; t < -Math.PI;) t += 2 * Math.PI;
      (Math.abs(t) > Math.PI / 2 && (t += t > 0 ? -Math.PI : Math.PI), (this.yaw += t));
    }
    this.pitch =
      n && n.startsWith("ascending")
        ? (("ascending_east" === n || "ascending_north" === n ? 1 : -1) * Math.PI) / 4
        : 0;
  }
  seat() {
    return [this.pos[0], this.pos[1] - 0.25, this.pos[2]];
  }
  drawSelf(t, s, e, i, o) {
    const a = t.renderer;
    a.initVehicleModels();
    const h = M4.create();
    (M4.translate(h, s[0], s[1] + 0.375, s[2]),
      M4.rotY(h, lerp(this.prevYaw ?? this.yaw, this.yaw, e) + Math.PI / 2),
      this.pitch && M4.rotZ(h, -this.pitch * (Math.abs(Math.cos(this.yaw)), 1)),
      this.hurtT > 0 &&
        M4.rotX(
          h,
          (Math.sin(this.hurtT - e) *
            (this.hurtT - e) *
            (this.damage / 10) *
            this.hurtDir *
            Math.PI) /
            180,
        ));
    const n = {
      chest: "chest",
      furnace: "furnace",
      tnt: "tnt",
      hopper: "hopper",
      command_block: "command_block",
    }[this.kind];
    if (n && void 0 !== BID[n]) {
      const s = M4.copy(h);
      if (
        (M4.scale(s, 0.75, 0.75, 0.75),
        M4.translate(s, -0.5, -2 / 16, -0.5),
        "tnt" === this.kind &&
          void 0 !== this.primed &&
          ((this.primed / 5) | 0) % 2 == 0 &&
          (M4.translate(s, 0.5, 0.5, 0.5),
          M4.scale(s, 1.1, 1.1, 1.1),
          M4.translate(s, -0.5, -0.5, -0.5)),
        "chest" === n)
      ) {
        const t = M4.copy(h);
        (M4.scale(t, 0.75, 0.75, 0.75),
          M4.translate(t, 0, -2 / 16, 0),
          M4.translate(t, -0.5, 0, -0.5),
          M4.scale(t, -1, -1, 1),
          a.initBEModels(),
          a.drawModel("chest", a.beTex("chest_normal") || "chest_normal", t, null, o, i));
      } else {
        const e =
          "furnace" === n && this.fuel > 0 && void 0 !== BID.lit_furnace ? BID.lit_furnace : BID[n];
        a.drawMesh(
          t.blockMesh(e, "furnace" === n ? Features.withProp(e, 0, "facing", "east") : 0),
          s,
          i,
          o,
        );
      }
    }
    (a.gl.disable(a.gl.CULL_FACE),
      a.drawModel("vh_minecart", a.beTex("minecart"), h, null, o, i),
      a.gl.enable(a.gl.CULL_FACE));
  }
  savePrev() {
    (super.savePrev(), (this.prevYaw = this.yaw));
  }
}
((Player.prototype.mount = function (t) {
  (this.vehicle && this.dismount(),
    (this.vehicle = t),
    (t.rider = this),
    (this.flying = !1),
    (this.gliding = !1),
    (this.sneaking = !1),
    this.followVehicle(t),
    this.savePrev());
}),
  (Player.prototype.dismount = function () {
    const t = this.vehicle;
    t &&
      ((this.vehicle = null),
      (t.rider = null),
      (this.rideInput = null),
      (this.pos = dismountSpot(this, t) || [t.pos[0], t.pos[1] + t.h, t.pos[2]]),
      (this.vel = [0, 0, 0]),
      this.savePrev());
  }));
const DISMOUNT_H = () => [PLAYER_H.stand, PLAYER_H.crouch, PLAYER_H.swim];
function escapeVec(t, s, e, i) {
  const o = (t + s + 1e-5) / 2,
    a = Math.max(Math.abs(e), Math.abs(i)) || 1;
  return [(e * o) / a, (i * o) / a];
}
function dismountOffsets(t, s) {
  const e = -s;
  return [
    [e, t],
    [-e, -t],
    [e - t, t - s],
    [-e - t, -t - s],
    [e + t, t + s],
    [-e + t, -t + s],
    [-t, -s],
    [t, s],
  ];
}
function cardinalOf(t, s) {
  return Math.abs(t) >= Math.abs(s) ? [Math.sign(t) || 1, 0] : [0, Math.sign(s)];
}
function dismountSpot(t, s) {
  const e = t.world,
    i = DISMOUNT_H(),
    o = Math.floor;
  if ("undefined" != typeof HappyGhast && s instanceof HappyGhast) return null;
  if (s instanceof Boat) {
    const a = escapeVec(s.w * Math.SQRT2, t.w, -Math.sin(t.yaw), -Math.cos(t.yaw)),
      h = s.pos[0] + a[0],
      n = s.pos[2] + a[1],
      r = o(s.pos[1] + s.h);
    if (e.waterAt(o(h), r - 1, o(n))) return null;
    const l = [r, r - 1].map((t) => [t, blockFloor(e, o(h), t, o(n), !1)]).filter(([, t]) => t < 1);
    for (const s of i)
      for (const [e, i] of l) if (standsFree(t, h, e + i, n, s)) return [h, e + i, n];
    return null;
  }
  if ("undefined" != typeof Horse && s instanceof Horse) {
    const a = -Math.sin(s.yaw),
      h = -Math.cos(s.yaw),
      n = s.pos[1] + s.h + 0.75;
    for (const r of [1, -1]) {
      const l = escapeVec(s.w, t.w, -h * r, a * r),
        c = s.pos[0] + l[0],
        p = s.pos[2] + l[1];
      for (const a of i)
        for (let i = o(s.pos[1]); i < n; i++) {
          const s = blockFloor(e, o(c), i, o(p), !1);
          if (i + s > n) break;
          if (s < 1 && standsFree(t, c, i + s, p, a)) return [c, i + s, p];
        }
    }
    return [s.pos[0], s.pos[1], s.pos[2]];
  }
  if ("strider" === s.type) {
    const a = new Set(),
      h = [];
    for (const e of [0, 22.5, -22.5, 45, -45]) {
      const i = t.yaw + (e * Math.PI) / 180,
        n = escapeVec(s.w, t.w, -Math.sin(i), -Math.cos(i)),
        r = o(s.pos[0] + n[0]),
        l = o(s.pos[2] + n[1]);
      for (let t = s.pos[1] + s.h, e = o(t); t > s.pos[1] - 0.5; t--, e--) {
        const t = r + "," + e + "," + l;
        a.has(t) || (a.add(t), h.push([r, e, l]));
      }
    }
    for (const [s, o, a] of h) {
      if (e.getBlock(s, o, a) === LAVA) continue;
      const h = blockFloor(e, s, o, a, !1);
      if (h < 1)
        for (const e of i)
          if (standsFree(t, s + 0.5, o + h, a + 0.5, e)) return [s + 0.5, o + h, a + 0.5];
    }
    return null;
  }
  const a = s instanceof Minecart,
    h = o(s.pos[0]),
    n = o(s.pos[1]),
    r = o(s.pos[2]),
    l = Math.abs(s.vel[0]) + Math.abs(s.vel[2]) > 0.001,
    c = cardinalOf(l ? s.vel[0] : -Math.sin(s.yaw), l ? s.vel[2] : -Math.cos(s.yaw));
  for (const s of i)
    for (const i of a ? (s === PLAYER_H.swim ? [0, 1] : [0, 1, -1]) : [0])
      for (const [o, l] of dismountOffsets(c[0], c[1])) {
        const c = h + o,
          p = n + i,
          d = r + l,
          u = blockFloor(e, c, p, d, a);
        if (u < 1 && standsFree(t, c + 0.5, p + u, d + 0.5, s)) return [c + 0.5, p + u, d + 0.5];
      }
  return null;
}
Player.prototype.followVehicle = function (t) {
  const s = t.seat();
  ((this.pos[0] = s[0]),
    (this.pos[1] = s[1]),
    (this.pos[2] = s[2]),
    (this.vel = [0, 0, 0]),
    (this.fallDist = 0));
};
const _vPlayerTick = Player.prototype.tick;
Player.prototype.tick = function (t) {
  const s = this.vehicle;
  return s
    ? s.dead || (t.sneak && !this.rideSneak)
      ? (this.dismount(),
        (this.rideSneak = !!t.sneak),
        _vPlayerTick.call(this, { ...t, sneak: !1 }))
      : ((this.rideSneak = !!t.sneak),
        this.savePrev(),
        this.baseTick(),
        this.boostT > 0 && this.boostT--,
        this.deathTime > 0
          ? (this.dismount(), void this.deathTime++)
          : ((this.rideInput = t),
            (this.onGround = !0),
            (this.sprinting = !1),
            (this.swimming = !1),
            (this.pose = "stand"),
            (this.h = 1.8),
            (this.prevBob = this.bob),
            (this.prevBobAmt = this.bobAmt),
            (this.bobAmt *= 0.6),
            (this.limbAmt = 0),
            this.handsTick(),
            this.hungerTick(),
            void (s instanceof Boat && void 0 !== s.prevYaw && (this.yaw += s.yaw - s.prevYaw))))
    : _vPlayerTick.call(this, t);
};
const _vPose = Game.prototype.playerPose;
Game.prototype.playerPose = function (t) {
  const s = _vPose.call(this, t),
    e = this.player;
  return (
    e.vehicle &&
      ((s.rleg = { rx: 1.4137167, ry: -0.31415927 }),
      (s.lleg = { rx: 1.4137167, ry: 0.31415927 }),
      e.usingItem ||
        ((s.rarm.rx = (s.rarm.rx || 0) + 0.62831855), (s.larm.rx = (s.larm.rx || 0) + 0.62831855))),
    s
  );
};
const _rayEntity = Game.prototype.rayEntity;
Game.prototype.rayEntity = function (t, s, e) {
  const i = this.player && this.player.vehicle;
  if (!i) return _rayEntity.call(this, t, s, e);
  const o = i.hittable;
  ((i.hittable = !1), (i.dead = !0));
  try {
    return _rayEntity.call(this, t, s, e);
  } finally {
    ((i.dead = !1), (i.hittable = o));
  }
};
const _vUseEquipment = Game.prototype.useEquipment;
Game.prototype.useEquipment = function (t, s) {
  const e = s && s.key,
    i = this.player;
  if (BOAT_ITEM[e]) {
    const s = [i.pos[0], i.pos[1] + i.eye(), i.pos[2]],
      o = this.raycast(s, this.lookDir(), this.reach(), !0);
    if (!o) return !0;
    let [a, h, n] = o.point;
    if (IS_FLUID[o.id]) h = Math.floor(h) + 1 - 0.11 - 0.4;
    else if (3 !== o.face) return !0;
    const [r, l] = BOAT_ITEM[e],
      c = new Boat(this, a, h, n, r, l);
    return (
      (c.yaw = i.yaw),
      c.savePrev(),
      c.collides(c.box()) && !IS_FLUID[o.id]
        ? !0
        : (this.entities.push(c),
          "creative" !== this.mode && (t.count--, t.count || (i.inv.slots[i.inv.sel] = null)),
          i.swing(),
          Sound.ev("entity.boat.paddle_water", [a, h, n], 0.5, 1),
          !0)
    );
  }
  if (void 0 !== CART_ITEM[e]) {
    const s = this.target;
    if (!s || !isRail(s.id)) return !0;
    const [o, a, h] = s.pos,
      n = new Minecart(this, o + 0.5, a + 0.0625, h + 0.5, CART_ITEM[e]),
      r = railShape(this.world, o, a, h) || "north_south";
    return (
      (n.yaw = r.includes("east") || r.includes("west") ? Math.PI / 2 : 0),
      n.savePrev(),
      this.entities.push(n),
      "creative" !== this.mode && (t.count--, t.count || (i.inv.slots[i.inv.sel] = null)),
      i.swing(),
      !0
    );
  }
  return _vUseEquipment.call(this, t, s);
};
const RAIL_DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
function railConnects(t, s, e, i, o, a) {
  for (const h of [0, -1, 1]) {
    const n = railShape(t, s, e + h, i);
    if (n && RAIL_EXITS[n].some(([t, , e]) => s + t === o && i + e === a)) return !0;
  }
  return !1;
}
function railNeighbors(t, s, e, i) {
  const o = [];
  for (const [a, [h, n]] of Object.entries(RAIL_DIRS))
    for (const r of [0, 1, -1])
      if (railShape(t, s + h, e + r, i + n)) {
        o.push({ d: a, dx: h, dz: n, dy: r });
        break;
      }
  return o;
}
function railJunctionShape(t, s, e, i, o) {
  const a = new Set(railNeighbors(t, s, e, i).map((t) => t.d));
  if (3 !== a.size) return null;
  const h = a.has("north"),
    n = a.has("south"),
    r = a.has("east"),
    l = a.has("west"),
    c = o
      ? [
          ["south_east", n && r],
          ["south_west", n && l],
          ["north_east", h && r],
          ["north_west", h && l],
        ]
      : [
          ["north_west", h && l],
          ["north_east", h && r],
          ["south_west", n && l],
          ["south_east", n && r],
        ];
  let p = null;
  for (const [t, s] of c) s && (p = t);
  return p;
}
function railShapeFor(t, s, e, i, o, a) {
  const h = railNeighbors(t, s, e, i).filter((o) => {
      const a = railShape(t, s + o.dx, e + o.dy, i + o.dz);
      return (
        railNeighbors(t, s + o.dx, e + o.dy, i + o.dz).filter((a) =>
          railConnects(t, s + o.dx + a.dx, e + o.dy + a.dy, i + o.dz + a.dz, s + o.dx, i + o.dz),
        ).length < 2 || RAIL_EXITS[a].some(([t, , s]) => t === -o.dx && s === -o.dz)
      );
    }),
    has = (t) => h.find((s) => s.d === t),
    up = (t) => {
      const s = has(t);
      return s && 1 === s.dy;
    };
  let n;
  return (
    (n =
      has("north") && has("south")
        ? up("north")
          ? "ascending_north"
          : up("south")
            ? "ascending_south"
            : "north_south"
        : has("east") && has("west")
          ? up("east")
            ? "ascending_east"
            : up("west")
              ? "ascending_west"
              : "east_west"
          : o && (has("north") || has("south")) && (has("east") || has("west"))
            ? (has("north") ? "north" : "south") + "_" + (has("east") ? "east" : "west")
            : has("north") || has("south")
              ? up("north")
                ? "ascending_north"
                : up("south")
                  ? "ascending_south"
                  : "north_south"
              : has("east") || has("west")
                ? up("east")
                  ? "ascending_east"
                  : up("west")
                    ? "ascending_west"
                    : "east_west"
                : a
                  ? "north_south"
                  : "east_west"),
    n
  );
}
const _vPlaceState = Game.prototype.placeState;
Game.prototype.placeState = function (t, s, e) {
  let i = _vPlaceState.call(this, t, s, e);
  if (!/(^|_)rail$/.test(t.key) || !t.states || !("shape" in t.states[0])) return i;
  const o = DIRS[s.face],
    a = s.pos[0] + o[0],
    h = s.pos[1] + o[1],
    n = s.pos[2] + o[2],
    r = railShapeFor(this.world, a, h, n, "rail" === t.key, 4 === e || 5 === e);
  return (
    t.states.some((t) => t.shape === r) && (i = Features.withProp(t.id, i, "shape", r)),
    (this.pendingRail = [a, h, n]),
    i
  );
};
const _vPlaceAt = Game.prototype.placeAt;
Game.prototype.placeAt = function (...t) {
  const s = _vPlaceAt.apply(this, t),
    e = this.pendingRail;
  if (((this.pendingRail = null), e)) {
    const t = this.world,
      [s, i, o] = e;
    for (const e of railNeighbors(t, s, i, o)) {
      const a = s + e.dx,
        h = i + e.dy,
        n = o + e.dz,
        r = t.getBlock(a, h, n);
      if (railConnects(t, a, h, n, s, o)) continue;
      if (
        railNeighbors(t, a, h, n).filter(
          (e) =>
            railConnects(t, a + e.dx, h + e.dy, n + e.dz, a, n) &&
            !(a + e.dx === s && n + e.dz === o),
        ).length >= 2
      )
        continue;
      const l = railShapeFor(t, a, h, n, "rail" === BLOCKS[r].key, !0);
      BLOCKS[r].states.some((t) => t.shape === l) &&
        t.setMeta(a, h, n, Features.withProp(r, t.getMeta(a, h, n), "shape", l));
    }
    this.flushMesh();
  }
  return s;
};
const _vCreateMob = createMob;
createMob = function (t, s, e, i, o) {
  if ("string" == typeof s && s.includes("boat:")) {
    const [a, h] = s.split(":");
    return new Boat(t, e, i, o, h, "chest_boat" === a);
  }
  return "string" == typeof s && s.startsWith("minecart:")
    ? new Minecart(t, e, i, o, s.slice(9))
    : _vCreateMob(t, s, e, i, o);
};
const NO_BOAT_MOBS = new Set([
    "elder_guardian",
    "cod",
    "pufferfish",
    "salmon",
    "tropical_fish",
    "dolphin",
    "squid",
    "glow_squid",
    "tadpole",
    "creaking",
    "nautilus",
    "zombie_nautilus",
    "sulfur_cube",
  ]),
  SEATED_MOBS =
    /zombie|skeleton|stray|bogged|husk|drowned|villager|wandering_trader|piglin|pillager|vindicator|evoker|illusioner|witch/;
((Vehicle.prototype.seatFor = function (t) {
  const s = this.seat();
  if (
    (t === this.mob && (s[1] = this.pos[1] + 0.1875 - (SEATED_MOBS.test(t.type || "") ? 0.6 : 0)),
    this instanceof Boat && this.rider && this.mob)
  ) {
    const e = t === this.mob ? -0.6 : 0.2;
    ((s[0] += -Math.sin(this.yaw) * e), (s[2] += -Math.cos(this.yaw) * e));
  }
  return s;
}),
  (Vehicle.prototype.pickUpMob = function () {
    const t = this instanceof Boat,
      s = this.game;
    if (
      t ? this.rider : !(this.canRide && !this.rider && this.vel[0] ** 2 + this.vel[2] ** 2 > 0.01)
    )
      return;
    const e = this.box();
    for (const i of s.entities) {
      if (
        !(i instanceof Mob) ||
        i.dead ||
        i.deathTime ||
        i.vehicleRef ||
        i.remote ||
        (i.boardAt || 0) > s.tickCount ||
        i.rider
      )
        continue;
      if (t ? NO_BOAT_MOBS.has(i.type) || i.w >= this.w : "iron_golem" === i.type) continue;
      const o = i.box();
      if (!(
        o[3] < e[0] - 0.2 ||
        o[0] > e[3] + 0.2 ||
        o[5] < e[2] - 0.2 ||
        o[2] > e[5] + 0.2 ||
        o[4] < e[1] ||
        o[1] > e[4]
      ))
        return void this.board(i);
    }
  }),
  (Vehicle.prototype.board = function (t) {
    ((this.mob = t), (t.vehicleRef = this), (t.riding = !0), (t.persistent = !0), (t.goal = null));
  }),
  (Vehicle.prototype.dropMob = function () {
    const t = this.mob;
    ((this.mob = null),
      t &&
        t.vehicleRef === this &&
        ((t.vehicleRef = null),
        (t.riding = !1),
        (t.boardAt = this.game.tickCount + 60),
        (t.pos[1] = this.pos[1] + this.h),
        (t.prev = [...t.pos])));
  }));
const _vInteract = Vehicle.prototype.interact;
Vehicle.prototype.interact = function (t, s) {
  return (
    !(this instanceof Minecart && this.mob && (!this.slots || !t.sneaking)) &&
    _vInteract.call(this, t, s)
  );
};
const _vHurt = Vehicle.prototype.hurt;
((Vehicle.prototype.hurt = function (t, s) {
  const e = _vHurt.call(this, t, s);
  return (this.dead && this.mob && this.dropMob(), e);
}),
  (Player.prototype.followVehicle = function (t) {
    const s = t.seatFor ? t.seatFor(this) : t.seat();
    ((this.pos[0] = s[0]),
      (this.pos[1] = s[1]),
      (this.pos[2] = s[2]),
      (this.vel = [0, 0, 0]),
      (this.fallDist = 0));
  }),
  (Game.prototype.seatPassengers = function () {
    if (!this.net)
      for (const t of this.entities) {
        if (!(t instanceof Vehicle) || t.dead) continue;
        if (t.wantsMob && !t.mob) {
          const s = this.entities.find(
            (s) =>
              s instanceof Mob &&
              s.wantsRide &&
              !s.vehicleRef &&
              Math.abs(s.pos[0] - t.pos[0]) < 2 &&
              Math.abs(s.pos[1] - t.pos[1]) < 2 &&
              Math.abs(s.pos[2] - t.pos[2]) < 2,
          );
          (s && ((s.wantsRide = !1), t.board(s)), (t.wantsMob = !1));
        }
        if (!t.mob && (t.pickUpMob(), !t.mob)) continue;
        const s = t.mob;
        if (s.dead || s.deathTime || s.vehicleRef !== t) t.dropMob();
        else {
          if (t instanceof Minecart) {
            const s = Math.floor(t.pos[0]),
              e = Math.floor(t.pos[2]);
            let i = Math.floor(t.pos[1]);
            isRail(this.world.getBlock(s, i, e)) || i--;
            const o = this.world.getBlock(s, i, e);
            if (
              BLOCKS[o] &&
              "activator_rail" === BLOCKS[o].key &&
              "true" === Features.propOf(o, this.world.getMeta(s, i, e), "powered")
            ) {
              t.dropMob();
              continue;
            }
          }
          ((s.pos = t.seatFor(s)),
            (s.vel = [0, 0, 0]),
            (s.fallDist = 0),
            (s.goal = null),
            (s.limbAmt = 0),
            t instanceof Boat && (s.bodyYaw = s.yaw = t.yaw));
        }
      }
  }));
const _vSaveV = Vehicle.prototype.saveData,
  _vLoadV = Vehicle.prototype.loadData;
((Vehicle.prototype.saveData = function () {
  return { ..._vSaveV.call(this), mob: this.mob ? 1 : 0 };
}),
  (Vehicle.prototype.loadData = function (t) {
    (_vLoadV.call(this, t), t && t.mob && (this.wantsMob = !0));
  }));
//# sourceURL=js/vehicles.js
