"use strict";
const IU_STAGES = ["", "exposed_", "weathered_", "oxidized_"];
function copperInfo(t) {
  const e = /^(waxed_)?(exposed_|weathered_|oxidized_)?(.*copper.*)$/.exec(t);
  if (!e) return null;
  const o = e[3],
    s = IU_STAGES.indexOf(e[2] || ""),
    name = (t, e) => {
      let s =
        "copper" === o || "copper_block" === o
          ? 0 === t
            ? "copper_block"
            : IU_STAGES[t] + "copper"
          : IU_STAGES[t] + o;
      return (e && (s = "waxed_" + s), void 0 !== BID[s] ? s : null);
    };
  return name(s, !!e[1]) && (name(1, !1) || name(0, !0))
    ? { stage: s, waxed: !!e[1], name: name }
    : null;
}
Game.prototype.swapBlock = function (t, e, o, s) {
  const i = this.world,
    n = i.getBlock(t, e, o),
    a = i.getMeta(t, e, o),
    r = BLOCKS[n],
    h = BID[s];
  if (void 0 === h) return !1;
  let l = a;
  if (r.states && BLOCKS[h].states) {
    const t = Features.stateOf({ Name: s, Properties: r.states[a] || {} });
    t && (l = t[1]);
  }
  if ((i.setBlock(t, e, o, h, l), r.door)) {
    const s = 8 & a ? e - 1 : e + 1;
    i.getBlock(t, s, o) === n && i.setBlock(t, s, o, h, i.getMeta(t, s, o));
  }
  return (this.flushMesh(), !0);
};
const STRIP = /^(.*_(log|wood|stem|hyphae)|bamboo_block)$/,
  PATHABLE = new Set(["grass_block", "dirt", "podzol", "mycelium", "coarse_dirt", "rooted_dirt"]),
  DYE_COLORS = [
    "white",
    "orange",
    "magenta",
    "light_blue",
    "yellow",
    "lime",
    "pink",
    "gray",
    "light_gray",
    "cyan",
    "purple",
    "blue",
    "brown",
    "green",
    "red",
    "black",
  ];
Game.prototype.useOnBlockItem = function (t, e) {
  const o = this.player,
    s = this.target,
    i = this.world,
    n = e.key;
  if (!s || (o.sneaking, 0)) return !1;
  const [a, r, h] = s.pos,
    l = BLOCKS[s.id].key,
    c = [a + 0.5, r + 0.5, h + 0.5];
  if (e.tool && "axe" === e.tool.type) {
    if (STRIP.test(l) && !l.startsWith("stripped_") && void 0 !== BID["stripped_" + l])
      return (
        this.swapBlock(a, r, h, "stripped_" + l),
        Sound.ev("item.axe.strip", c, 1, 1),
        this.damageHeld(1),
        o.swing(),
        !0
      );
    const t = copperInfo(l);
    if (t && t.waxed)
      return (
        this.swapBlock(a, r, h, t.name(t.stage, !1)),
        Sound.ev("item.axe.wax_off", c, 1, 1),
        this.particles.spawn("crit", ...c, 0, 0.1, 0),
        this.damageHeld(1),
        o.swing(),
        !0
      );
    if (t && t.stage > 0)
      return (
        this.swapBlock(a, r, h, t.name(t.stage - 1, !1)),
        Sound.ev("item.axe.scrape", c, 1, 1),
        this.damageHeld(1),
        o.swing(),
        !0
      );
  }
  if (
    e.tool &&
    "shovel" === e.tool.type &&
    2 !== s.face &&
    /(^|_)campfire$/.test(l) &&
    this.dowseCampfire &&
    this.dowseCampfire(a, r, h, "block.fire.extinguish")
  )
    return (this.damageHeld(1), o.swing(), !0);
  if (
    e.tool &&
    "shovel" === e.tool.type &&
    PATHABLE.has(l) &&
    2 !== s.face &&
    !i.getBlock(a, r + 1, h) &&
    void 0 !== BID.dirt_path
  )
    return (
      i.setBlock(a, r, h, BID.dirt_path, 0),
      Sound.ev("item.shovel.flatten", c, 1, 1),
      this.damageHeld(1),
      o.swing(),
      this.flushMesh(),
      !0
    );
  if ("honeycomb" === n) {
    const e = copperInfo(l);
    if (e && !e.waxed && e.name(e.stage, !0))
      return (
        this.swapBlock(a, r, h, e.name(e.stage, !0)),
        Sound.ev("item.honeycomb.wax_on", c, 1, 1),
        "creative" !== this.mode && (t.count--, t.count || (o.inv.slots[o.inv.sel] = null)),
        o.swing(),
        !0
      );
  }
  return !1;
};
class Thrown extends Arrow {
  constructor(t, e, o, s, i, n, a) {
    (super(t, e, o, s, i, n),
      (this.kind = a),
      (this.snowball = ITEM_KEY[a]),
      (this.gravity = "wind_charge" === a ? 0 : void 0));
  }
  tick() {
    const t = this.dead;
    ("wind_charge" === this.kind && (this.vel[1] += 0.05),
      super.tick(),
      t || (!this.dead && !this.stuck) || this.burst());
  }
  breakSnowball() {
    this.burst();
  }
  burst() {
    if (this.burst_) return;
    ((this.burst_ = !0), (this.dead = !0));
    const t = this.game,
      [e, o, s] = this.pos;
    if ("experience_bottle" === this.kind) {
      Sound.ev("entity.splash_potion.break", this.pos, 1, 1);
      for (let i = 0; i < 12; i++)
        t.particles.spawn(
          "effect",
          e,
          o,
          s,
          0.4 * (Math.random() - 0.5),
          0.3 * Math.random(),
          0.4 * (Math.random() - 0.5),
          { col: [60, 140, 255] },
        );
      t.dropXp(e, o, s, 3 + Math.floor(5 * Math.random()) + Math.floor(5 * Math.random()));
    } else if ("wind_charge" === this.kind) {
      Sound.ev("entity.wind_charge.wind_burst", this.pos, 1, 1);
      for (let i = 0; i < 16; i++)
        t.particles.spawn(
          "poof",
          e,
          o,
          s,
          0.6 * (Math.random() - 0.5),
          0.6 * (Math.random() - 0.5),
          0.6 * (Math.random() - 0.5),
        );
      for (const i of [t.player, ...t.entities]) {
        if (!i || i.dead || !i.vel) continue;
        const n = i.pos[0] - e,
          a = i.pos[1] + (i.h || 1) / 2 - o,
          r = i.pos[2] - s,
          h = Math.hypot(n, a, r);
        if (h > 2.4 || h < 0.001) continue;
        const l = 1.22 * (1 - h / 2.4);
        ((i.vel[0] += (n / h) * l),
          (i.vel[1] += (a / h) * l + 0.3),
          (i.vel[2] += (r / h) * l),
          i !== t.player ||
            this.shooter instanceof Mob ||
            ((i.impulseY = i.pos[1]), (i.impulseGrace = Math.max(i.impulseGrace || 0, 40))),
          i === t.player && (i.fallDist = 0));
      }
    } else {
      for (let i = 0; i < 8; i++)
        t.particles.spawn(
          "poof",
          e,
          o,
          s,
          0.2 * (Math.random() - 0.5),
          0.2 * Math.random(),
          0.2 * (Math.random() - 0.5),
        );
      if (Math.random() < 0.125) {
        const i = new Mob(t, "chicken", e, o, s).makeBaby();
        ((i.persistent = !0), t.addEntity(i));
      }
    }
  }
}
const _iuUseEquipment = Game.prototype.useEquipment;
Game.prototype.useEquipment = function (t, e) {
  const o = this.player,
    s = e && e.key;
  if (!t) return _iuUseEquipment.call(this, t, e);
  if (this.useOnBlockItem(t, e)) return !0;
  const throwIt = (e, s, i) => {
    const n = this.lookDir(),
      a = new Thrown(
        this,
        o.pos[0],
        o.pos[1] + o.eye() - 0.1,
        o.pos[2],
        n.map((t) => t * s),
        o,
        e,
      );
    (this.entities.push(a),
      Sound.ev(i, o.pos, 0.5, 0.4 / (0.4 * Math.random() + 0.8)),
      "creative" !== this.mode && (t.count--, t.count || (o.inv.slots[o.inv.sel] = null)),
      o.swing());
  };
  if ("experience_bottle" === s) return (throwIt(s, 0.7, "entity.experience_bottle.throw"), !0);
  if ("wind_charge" === s)
    return (
      (o.windCd || 0) > this.tickCount ||
        ((o.windCd = this.tickCount + 10), throwIt(s, 1.5, "entity.wind_charge.throw")),
      !0
    );
  if ("blue_egg" === s || "brown_egg" === s) return (throwIt(s, 1.5, "entity.egg.throw"), !0);
  if ("glass_bottle" === s) {
    const e = [o.pos[0], o.pos[1] + o.eye(), o.pos[2]],
      s = this.raycast(e, this.lookDir(), this.reach(), !0),
      i = this.world;
    let n = !1;
    if (s && s.id === WATER) n = !0;
    else if (s && "water_cauldron" === BLOCKS[s.id].key) {
      const t = +Features.propOf(s.id, i.getMeta(...s.pos), "level") || 1;
      (t > 1
        ? i.setMeta(...s.pos, Features.withProp(s.id, i.getMeta(...s.pos), "level", t - 1))
        : i.setBlock(...s.pos, BID.cauldron, 0),
        (n = !0));
    }
    if (n) {
      const e = { id: ITEM_KEY.potion, count: 1, dmg: 0, pot: "water" };
      ("creative" !== this.mode &&
        (t.count--,
        t.count ? o.inv.add(e) && this.dropFromPlayer(e) : (o.inv.slots[o.inv.sel] = e)),
        Sound.ev("item.bottle.fill", o.pos, 1, 1),
        o.swing());
    }
    return !0;
  }
  if ("ominous_bottle" === s) return (this.startUsing(t, "main"), !0);
  if ("firework_rocket" === s && !o.gliding && this.target) {
    const e = this.target,
      s = DIRS[e.face],
      i = e.point || [e.pos[0] + 0.5, e.pos[1] + 1, e.pos[2] + 0.5];
    return (
      this.entities.push(
        new FireworkRocket(this, i[0] + 0.1 * s[0], i[1] + 0.1 * s[1], i[2] + 0.1 * s[2], t),
      ),
      Sound.ev("entity.firework_rocket.launch", i, 3, 1),
      "creative" !== this.mode && (t.count--, t.count || (o.inv.slots[o.inv.sel] = null)),
      o.swing(),
      !0
    );
  }
  return _iuUseEquipment.call(this, t, e);
};
const _iuUsingTick = Game.prototype.usingTick;
Game.prototype.usingTick = function (t) {
  _iuUsingTick.call(this, t);
  const e = this.player;
  "ominous_bottle" === ITEMS[t.id].key &&
    (e.useT % 4 == 0 && e.useT > 6 && Sound.ev("entity.generic.drink", e.pos, 0.5, 1),
    e.useT >= 32 &&
      (e.addEffect("bad_omen", t.amp || 0, 12e4),
      Sound.ev("item.ominous_bottle.dispose", e.pos, 1, 1),
      "creative" !== this.mode && (t.count--, t.count || (e.inv.slots[e.inv.sel] = null)),
      (e.usingItem = null),
      (e.useT = 0)));
};
class FireworkRocket extends Entity {
  constructor(t, e, o, s, i, n, a) {
    (super(t, e, o, s, 0.25, 0.25),
      (this.life =
        10 * ((i && i.flight) || 1) +
        6 +
        Math.floor(6 * Math.random()) +
        Math.floor(7 * Math.random())),
      (this.vel = n
        ? [...n]
        : [0.023 * (Math.random() - 0.5), 0.05, 0.023 * (Math.random() - 0.5)]),
      (this.shot = !!n),
      (this.shooter = a || null),
      (this.stackRef = i ? { ...i } : null),
      (this.spriteLayer = T("i_firework_rocket")));
  }
  tick() {
    if ((this.savePrev(), this.age++, this.shot)) this.shotMove();
    else {
      ((this.vel[0] *= 1.15), (this.vel[2] *= 1.15), (this.vel[1] += 0.04));
      for (let t = 0; t < 3; t++) this.pos[t] += this.vel[t];
    }
    if (
      (this.age % 2 == 0 &&
        this.game.particles.spawn(
          "smoke",
          this.pos[0],
          this.pos[1] - 0.3,
          this.pos[2],
          0,
          -0.05,
          0,
        ),
      this.age >= this.life ||
        (!this.shot &&
          this.world.getBlock(
            Math.floor(this.pos[0]),
            Math.floor(this.pos[1]),
            Math.floor(this.pos[2]),
          )))
    ) {
      ((this.dead = !0), Sound.ev("entity.firework_rocket.blast", this.pos, 3, 1));
      for (let t = 0; t < 40; t++) {
        const t = Math.random() * Math.PI * 2,
          e = Math.acos(2 * Math.random() - 1),
          o = 0.3;
        this.game.particles.spawn(
          "crit",
          ...this.pos,
          Math.sin(e) * Math.cos(t) * o,
          Math.cos(e) * o,
          Math.sin(e) * Math.sin(t) * o,
        );
      }
      this.blastDamage();
    }
  }
  shotMove() {
    if (this.stopped) return;
    const t = this.game,
      e = this.vel,
      o = Math.max(1, Math.ceil(Math.hypot(e[0], e[1], e[2]) / 0.3)),
      stop = (t) => {
        ((this.stopped = !0), t && (this.life = Math.min(this.life, this.age + 1)));
      };
    for (let s = 0; s < o; s++) {
      const s = this.pos[0] + e[0] / o,
        i = this.pos[1] + e[1] / o,
        n = this.pos[2] + e[2] / o;
      for (const e of [t.player, ...t.entities]) {
        if (
          !(e instanceof Living) ||
          e.dead ||
          e.deathTime > 0 ||
          (e === this.shooter && this.age < 5)
        )
          continue;
        const t = e.box();
        if (
          s > t[0] - 0.125 &&
          s < t[3] + 0.125 &&
          i > t[1] - 0.125 &&
          i < t[4] + 0.125 &&
          n > t[2] - 0.125 &&
          n < t[5] + 0.125
        )
          return stop(!0);
      }
      const a = this.world.getBlock(Math.floor(s), Math.floor(i), Math.floor(n));
      if (a && BLOCKS[a].solid)
        return stop(
          !!(this.stackRef && this.stackRef.explosions && this.stackRef.explosions.length),
        );
      ((this.pos[0] = s), (this.pos[1] = i), (this.pos[2] = n));
    }
  }
  blastDamage() {
    const t = this.stackRef && this.stackRef.explosions,
      e = this.game;
    if (!t || !t.length || e.net) return;
    const o = 5 + 2 * t.length,
      s = this.pos;
    for (const t of [e.player, ...e.entities]) {
      if (!(t instanceof Living) || t.dead || t.deathTime > 0) continue;
      const i = Math.hypot(t.pos[0] - s[0], t.pos[1] - s[1], t.pos[2] - s[2]);
      if (i > 5) continue;
      [0, 0.5].some((o) => {
        const i = [t.pos[0] - s[0], t.pos[1] + t.h * o - s[1], t.pos[2] - s[2]],
          n = Math.hypot(...i);
        if (n < 1e-6) return !0;
        const a = e.raycast(
          s,
          i.map((t) => t / n),
          n,
          !1,
        );
        return !a || a.t >= n;
      }) &&
        t.hurt(o * Math.sqrt((5 - i) / 5), {
          type: "firework",
          attacker: this.shooter,
          knockFrom: [...s],
          knock: 0,
          player: this.shooter === e.player,
        });
    }
  }
}
const _iuMobInteract = Mob.prototype.interact;
Mob.prototype.interact = function (t, e) {
  const o = e && ITEMS[e.id] ? ITEMS[e.id].key : "";
  if ("sheep" === this.type && /_dye$/.test(o) && !this.sheared) {
    const s = DYE_COLORS.indexOf(o.replace(/_dye$/, ""));
    if (s >= 0 && this.woolColor !== s)
      return (
        (this.woolColor = s),
        Sound.ev("item.dye.use", this.pos, 1, 1),
        "creative" !== this.game.mode && (e.count--, e.count || (t.inv.slots[t.inv.sel] = null)),
        !0
      );
  }
  return "creeper" !== this.type ||
    ("flint_and_steel" !== o && "fire_charge" !== o) ||
    this.dead ||
    this.deathTime > 0
    ? !!_iuMobInteract && _iuMobInteract.call(this, t, e)
    : (Sound.ev(
        "fire_charge" === o ? "item.firecharge.use" : "item.flintandsteel.use",
        this.pos,
        1,
        0.4 * Math.random() + 0.8,
      ),
      this.ignited ||
        ((this.ignited = !0), this.fuse < 0 && ((this.fuse = 0), Sound.fuse(this.pos))),
      "flint_and_steel" === o
        ? this.game.damageHeld(1)
        : "creative" !== this.game.mode && (e.count--, e.count || (t.inv.slots[t.inv.sel] = null)),
      !0);
};
for (const [t, e] of [
  ["kelp", () => [["kelp", 1]]],
  ["kelp_plant", () => [["kelp", 1]]],
  ["creaking_heart", (t, e) => [["resin_clump", 1 + Math.floor(3 * e())]]],
  ["brown_mushroom_block", (t, e) => [["brown_mushroom", Math.max(0, Math.floor(9 * e()) - 6)]]],
  ["red_mushroom_block", (t, e) => [["red_mushroom", Math.max(0, Math.floor(9 * e()) - 6)]]],
])
  void 0 === BID[t] ||
    ("creaking_heart" === t && void 0 === ITEM_KEY.resin_clump) ||
    (BLOCKS[BID[t]].drops = e);
function eatCake(t, e, o, s, i) {
  const n = t.player;
  if (!(n.creative || n.food < 20)) return !1;
  ((n.food = Math.min(20, n.food + 2)), (n.saturation = Math.min(n.food, n.saturation + 0.4)));
  const a = BID.cake;
  return (
    i < 6
      ? t.world.setBlock(e, o, s, a, Features.withProp(a, 0, "bites", String(i + 1)))
      : t.world.setBlock(e, o, s, 0, 0),
    t.flushMesh && t.flushMesh(),
    !0
  );
}
void 0 !== BID.cake &&
  (BLOCKS[BID.cake].onUse = (t, e, o, s) => {
    const i = t.player,
      n = i.inv.held,
      a = keyOfStack(n),
      r = t.world,
      h = r.getBlock(e, o, s),
      l = r.getMeta(e, o, s),
      c = +Features.propOf(h, l, "bites") || 0;
    return a && /^(.+_)?candle$/.test(a) && void 0 !== BID[a + "_cake"]
      ? 0 === c &&
          (r.setBlock(
            e,
            o,
            s,
            BID[a + "_cake"],
            Features.withProp(BID[a + "_cake"], 0, "lit", "false"),
          ),
          "creative" !== t.mode && (n.count--, n.count || (i.inv.slots[i.inv.sel] = null)),
          Sound.ev("block.cake.add_candle", [e + 0.5, o + 0.5, s + 0.5], 1, 1),
          !0)
      : eatCake(t, e, o, s, c);
  });
for (const t in BID)
  /^(.+_)?candle_cake$/.test(t) &&
    (BLOCKS[BID[t]].onUse = (t, e, o, s, i) => {
      const n = t.player.inv.held,
        a = keyOfStack(n),
        r = t.world,
        h = r.getBlock(e, o, s),
        l = r.getMeta(e, o, s);
      return (
        "flint_and_steel" !== a &&
        "fire_charge" !== a &&
        (!n && i && i.point && i.point[1] - o > 0.5 && "true" === Features.propOf(h, l, "lit")
          ? (r.setBlock(e, o, s, h, Features.withProp(h, l, "lit", "false")),
            Sound.ev("block.candle.extinguish", [e + 0.5, o + 0.5, s + 0.5], 1, 1),
            !0)
          : !!eatCake(t, e, o, s, 0) &&
            (t.dropItem(
              e + 0.5,
              o + 0.5,
              s + 0.5,
              makeStack(BLOCKS[h].key.replace(/_cake$/, ""), 1),
            ),
            !0))
      );
    });
//# sourceURL=js/itemuse.js
