"use strict";
const VMOB = {},
  VMOB_CLASS = {};
function defVMob(t, e = {}) {
  const i = ENTITY_DATA.types[t] || { w: 0.6, h: 1.8, cat: "creature", a: {} },
    s = i.a || {},
    o = e.cat || i.cat;
  ((VMOB[t] = e),
    e.cls && (VMOB_CLASS[t] = e.cls),
    (MOB_TYPES[t] = Object.assign(
      {
        cn: i.cn || t,
        hp: s.max_health || 10,
        w: i.w,
        h: i.h,
        eye: i.eye,
        speed: s.movement_speed || 0.25,
        model: "vm",
        passive:
          "creature" === o ||
          "water_creature" === o ||
          "water_ambient" === o ||
          "ambient" === o ||
          "axolotls" === o ||
          "underground_water_creature" === o ||
          "misc" === o,
        hostile: "monster" === o,
        attack: s.attack_damage || 0,
        fireproof: !!i.fire,
        drops: [],
        scale: 1,
        cat: o,
        follow: s.follow_range || 16,
        flySpeed: s.flying_speed || 0,
        kbRes: s.knockback_resistance || 0,
        armor: s.armor || 0,
        step: s.step_height || 0.6,
      },
      e.T || {},
    )));
  const a = ITEM_KEY[t + "_spawn_egg"];
  void 0 !== a && (ITEMS[a].spawnEgg = t);
}
(() => {
  const t = createMob;
  createMob = function (e, i, s, o, a) {
    if (VMOB[i] && ("string" != typeof i || !i.includes(":"))) {
      return new (VMOB_CLASS[i] || VMob)(e, i, s, o, a);
    }
    return t(e, i, s, o, a);
  };
})();
const foodIds = (t) => new Set(itemIds("#" + t)),
  _foodCache = {},
  isFood = (t, e) => (_foodCache[t] || (_foodCache[t] = foodIds(t)), _foodCache[t].has(e)),
  randInt = (t, e) => t + Math.floor(Math.random() * (e - t + 1)),
  pickW = (t) => {
    let e = 0;
    for (const i of t) e += i[1];
    let i = Math.random() * e;
    for (const e of t) if ((i -= e[1]) < 0) return e[0];
    return t[0][0];
  },
  DYES = [
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
  ],
  dyeRGB = (t) => {
    const e = DYE_RGB[t] || 16777215;
    return [((e >> 16) & 255) / 255, ((e >> 8) & 255) / 255, (255 & e) / 255];
  };
function lootNum(t) {
  if ("number" == typeof t) return t;
  if (!t) return 1;
  const e = (t.type || "").replace("minecraft:", "");
  if ("uniform" === e) return lootNum(t.min) + Math.random() * (lootNum(t.max) - lootNum(t.min));
  if ("binomial" === e) {
    let e = 0;
    const i = lootNum(t.n),
      s = lootNum(t.p);
    for (let t = 0; t < i; t++) Math.random() < s && e++;
    return e;
  }
  return "constant" === e ? t.value : 1;
}
function lootInt(t) {
  if (t && "object" == typeof t && "uniform" === (t.type || "").replace("minecraft:", "")) {
    const e = Math.floor(lootNum(t.min)),
      i = Math.floor(lootNum(t.max));
    return e + Math.floor(Math.random() * (i - e + 1));
  }
  return Math.floor(lootNum(t));
}
function lootEntityMatch(t, e, i) {
  if (!t) return !1;
  for (const s in e) {
    const o = e[s],
      a = s.replace("minecraft:", "");
    if ("flags" === a) {
      if (void 0 !== o.is_on_fire && t.fire > 0 !== o.is_on_fire) return !1;
      if (void 0 !== o.is_baby && !!t.baby !== o.is_baby) return !1;
    } else if ("entity_type" === a) {
      const e = String(o).replace("minecraft:", "");
      if ("#" === e[0]) {
        if (!(ENTITY_TAGS[e.slice(1)] || []).includes(t.type)) return !1;
      } else if (t.type !== e) return !1;
    } else if ("components" === a) {
      for (const e in o)
        if (
          String(t.comp ? t.comp(e.replace("minecraft:", "")) : "").replace("minecraft:", "") !==
          String(o[e]).replace("minecraft:", "")
        )
          return !1;
    } else if (a.startsWith("type_specific")) {
      const e = o;
      if (void 0 !== e.sheared && !!t.sheared !== e.sheared) return !1;
      if (e.size) {
        const i = t.size || 1;
        if ((null != e.size.min && i < e.size.min) || (null != e.size.max && i > e.size.max))
          return !1;
      }
      if (void 0 !== e.is_captain && !(!t.patrolLeader && !t.raidLeader) !== e.is_captain)
        return !1;
    } else if ("equipment" === a) {
      const e = t.inv ? t.inv.held : null,
        i = o.mainhand;
      if (i && i.predicates && i.predicates["minecraft:enchantments"]) {
        const t = i.predicates["minecraft:enchantments"].some((t) => {
          const i = String(t.enchantments || "");
          return (
            !(!e || !e.e) &&
            ("#minecraft:smelts_loot" === i
              ? e.e.some(([t]) => "fire_aspect" === t)
              : e.e.some(([t]) => "minecraft:" + t === i || t === i))
          );
        });
        if (!t) return !1;
      } else if (i) return !1;
    } else {
      if ("vehicle" !== a) return !1;
      if (!t.vehicle || !lootEntityMatch(t.vehicle, o, i)) return !1;
    }
  }
  return !0;
}
function lootCond(t, e) {
  switch (t.condition.replace("minecraft:", "")) {
    case "killed_by_player":
      return !!e.player;
    case "random_chance":
      return Math.random() < lootNum(t.chance);
    case "random_chance_with_enchanted_bonus": {
      const i = e.looting || 0,
        s = t.enchanted_chance,
        o =
          i <= 0
            ? lootNum(t.unenchanted_chance)
            : "number" == typeof s
              ? s
              : (s.base || 0) + (s.per_level_above_first || 0) * (i - 1);
      return Math.random() < o;
    }
    case "entity_properties":
      return lootEntityMatch(
        "this" === t.entity
          ? e.e
          : "attacker" === t.entity || "direct_attacker" === t.entity
            ? e.src && e.src.attacker
            : null,
        t.predicate || {},
        e,
      );
    case "damage_source_properties": {
      const i = t.predicate || {},
        s = e.src && e.src.attacker;
      return (
        !(i.source_entity && !lootEntityMatch(s, i.source_entity, e)) &&
        !(i.direct_entity && !lootEntityMatch(e.src && (e.src.direct || s), i.direct_entity, e)) &&
        !i.tags &&
        !(!i.source_entity && !i.direct_entity)
      );
    }
    case "any_of":
      return t.terms.some((t) => lootCond(t, e));
    case "all_of":
      return t.terms.every((t) => lootCond(t, e));
    case "inverted":
      return !lootCond(t.term, e);
  }
  return !1;
}
const condsOk = (t, e) => !t.conditions || t.conditions.every((t) => lootCond(t, e)),
  LOOT_TREASURE = new Set(["binding_curse", "vanishing_curse", "frost_walker", "mending"]);
function lootEnchant(t, e, i) {
  const s = i.options,
    o =
      !s || ("string" == typeof s && "#" === s[0])
        ? null
        : new Set([].concat(s).map((t) => String(t).replace("minecraft:", ""))),
    ok = (t) => (o ? o.has(t.key) : !t.treasure || LOOT_TREASURE.has(t.key)),
    a = "book" === ITEMS[t.id].key;
  let r;
  if ("enchant_with_levels" === e)
    r = selectEnchants(
      new JRandom((Math.random() * 2 ** 31) | 0),
      t.id,
      Math.max(0, lootInt(i.levels)),
      ok,
    );
  else {
    const e = ENCH_LIST.filter((e) => ok(e) && (a || e.sup.has(t.id)));
    if (!e.length) return;
    const i = e[(Math.random() * e.length) | 0];
    r = [[i.key, 1 + ((Math.random() * i.max) | 0)]];
  }
  r.length && (a && (t.id = ITEM_KEY.enchanted_book), (t.e = r));
}
function lootEntry(t, e, i) {
  const s = t.type.replace("minecraft:", "");
  if ("empty" === s) return;
  if ("loot_table" === s)
    return void rollLoot(
      String(t.value)
        .replace("minecraft:", "")
        .replace(/^entities\//, ""),
      e,
      i,
    );
  if ("alternatives" === s) {
    for (const s of t.children) if (condsOk(s, e)) return void lootEntry(s, e, i);
    return;
  }
  let o;
  if ("tag" === s) {
    const e = itemIds("#" + t.name.replace("minecraft:", ""));
    if (!e.length) return;
    o = ITEMS[e[(Math.random() * e.length) | 0]].key;
  } else {
    if ("item" !== s) return;
    o = t.name.replace("minecraft:", "");
  }
  if (void 0 === ITEM_KEY[o]) return;
  let a = 1;
  const r = { id: ITEM_KEY[o], count: 1, dmg: 0 };
  for (const i of t.functions || []) {
    if (!condsOk(i, e)) continue;
    const t = i.function.replace("minecraft:", "");
    if ("set_count" === t) a = i.add ? a + lootInt(i.count) : lootInt(i.count);
    else if ("enchanted_count_increase" === t || "looting_enchant" === t)
      ((a += Math.round(lootNum(i.count) * (e.looting || 0))),
        i.limit > 0 && (a = Math.min(a, i.limit)));
    else if ("furnace_smelt" === t) {
      const t = COOKING.smelting && COOKING.smelting[r.id];
      t && (r.id = t.result);
    } else if ("set_potion" === t) r.pot = String(i.id).replace("minecraft:", "");
    else if ("set_ominous_bottle_amplifier" === t) {
      const t = i.amplifier;
      r.amp =
        t && /uniform/.test(t.type || "")
          ? randInt(lootNum(t.min), lootNum(t.max))
          : Math.floor(lootNum(t));
    } else if ("set_damage" === t) {
      const t = ITEMS[r.id].durability;
      t && (r.dmg = clamp(Math.floor((1 - lootNum(i.damage)) * t), 0, t - 1));
    } else
      ("enchant_with_levels" !== t && "enchant_randomly" !== t) ||
        "function" != typeof selectEnchants ||
        lootEnchant(r, t, i);
  }
  if (((a = Math.floor(a)), a <= 0)) return;
  const h = maxStack(r.id);
  for (; a > 0;) {
    const t = Math.min(h, a);
    (i.push({ ...r, count: t }), (a -= t));
  }
}
function rollLoot(t, e = {}, i = []) {
  const s = ENTITY_DATA.loot[t];
  if (!s || !s.pools) return i;
  for (const t of s.pools) {
    if (!condsOk(t, e)) continue;
    const s = Math.floor(
      lootInt(t.rolls) + (t.bonus_rolls ? lootNum(t.bonus_rolls) * (e.luck || 0) : 0),
    );
    for (let o = 0; o < s; o++) {
      const s = t.entries.filter((t) => condsOk(t, e));
      if (!s.length) continue;
      const o = s.reduce((t, i) => t + (i.weight ?? 1) + (i.quality || 0) * (e.luck || 0), 0);
      let a = Math.random() * o,
        r = s[0];
      for (const t of s)
        if ((a -= (t.weight ?? 1) + (t.quality || 0) * (e.luck || 0)) < 0) {
          r = t;
          break;
        }
      lootEntry(r, e, i);
    }
  }
  return i;
}
const ENTITY_TAGS = {
  skeletons: ["skeleton", "stray", "wither_skeleton", "skeleton_horse", "bogged", "parched"],
  zombies: [
    "zombie",
    "husk",
    "drowned",
    "zombie_villager",
    "zombified_piglin",
    "zombie_horse",
    "zombie_nautilus",
    "camel_husk",
  ],
  raiders: ["evoker", "pillager", "ravager", "vindicator", "illusioner", "witch"],
  undead: [
    "skeleton",
    "stray",
    "wither_skeleton",
    "skeleton_horse",
    "bogged",
    "parched",
    "zombie",
    "husk",
    "drowned",
    "zombie_villager",
    "zombified_piglin",
    "zombie_horse",
    "phantom",
    "wither",
    "zoglin",
    "zombie_nautilus",
    "camel_husk",
  ],
  arthropod: ["spider", "cave_spider", "bee", "silverfish", "endermite"],
};
class VMob extends Mob {
  constructor(t, e, i, s, o) {
    (super(t, e, i, s, o),
      (this.D = VMOB[e]),
      (this.vm = !0),
      (this.anims = {}),
      (this.stepHeight = this.T.step || 0.6),
      (this.persistent = !this.T.hostile),
      (this.home = [i, s, o]),
      (this.breedCd = 0),
      (this.loveT = 0),
      (this.anger = 0),
      (this.owner = null),
      (this.ctl = { fwd: 0, strafe: 0, jump: !1, mod: 1, look: null, goal: null, up: 0 }),
      this.D.init && this.D.init(this));
  }
  get ai() {
    return this.D.ai || "ground";
  }
  saveData() {
    return {
      v: this.variant,
      own: this.owner ? 1 : 0,
      sit: this.sitting ? 1 : 0,
      name: this.customName,
      love: this.breedCd,
      ...(this.extraSave ? this.extraSave() : {}),
    };
  }
  loadData(t) {
    t &&
      (void 0 !== t.v && (this.variant = t.v),
      t.own && (this.owner = this.game.player),
      t.sit && (this.sitting = !0),
      t.name && (this.customName = t.name),
      t.love && (this.breedCd = t.love),
      this.extraLoad && this.extraLoad(t));
  }
  comp(t) {
    return this.compVal ? this.compVal(t) : void 0;
  }
  makeBaby() {
    return (
      super.makeBaby(),
      (this.growT = 24e3),
      this.D.babyW && ((this.w = this.D.babyW), (this.h = this.D.babyH)),
      this
    );
  }
  hurt(t, e) {
    if (this.D.immune && e && this.D.immune.includes(e.type)) return !1;
    const i =
        e && e.knockFrom && this.T.kbRes
          ? { ...e, knock: (e.knock ?? 0.4) * (1 - this.T.kbRes) }
          : e,
      s = super.hurt(t, i);
    return (
      s &&
        (e &&
          e.attacker &&
          e.attacker !== this &&
          ((this.lastAttacker = e.attacker),
          this.T.passive && !this.D.fights
            ? (this.panic = 80 + randInt(0, 40))
            : ((this.anger = 400), (this.target = e.attacker)),
          this.onAttacked && this.onAttacked(e)),
        this.sitting && !this.D.keepSitting && (this.sitting = !1)),
      s
    );
  }
  die(t) {
    Living.prototype.die.call(this, t);
    const e = this.game;
    t && (t.attacker === e.player || t.player) && e.stats.kills++;
    const i = (t && t.looting) || 0;
    if (!this.baby || this.D.babyLoot) {
      const s = rollLoot(this.D.loot || this.type, {
        e: this,
        src: t,
        looting: i,
        player: !(!t || (t.attacker !== e.player && !t.player)),
        fire: this.fire > 0,
      });
      for (const t of s) e.dropItem(this.pos[0], this.pos[1] + 0.5, this.pos[2], t);
    }
    if (
      (this.saddled &&
        e.dropItem(this.pos[0], this.pos[1] + 0.5, this.pos[2], makeStack("saddle", 1)),
      this.dropsOnDeath)
    )
      for (const t of this.dropsOnDeath())
        t && e.dropItem(this.pos[0], this.pos[1] + 0.5, this.pos[2], t);
    (this.rider && this.rider.dismount && this.rider.dismount(),
      t &&
        (t.attacker === e.player || t.player) &&
        (this.T.hostile && e.grant && e.grant("kill"),
        this.baby ||
          e.dropXp(
            this.pos[0],
            this.pos[1] + 0.5,
            this.pos[2],
            this.D.xp ?? (this.T.hostile ? 5 : randInt(1, 3)),
          )),
      this.onDeath && this.onDeath(t));
  }
  tick() {
    if ((this.savePrev(), this.baseTick(), this.deathTick())) return;
    const t = this.game,
      e = t.player,
      i = this.ctl;
    this.despawn() ||
      (this.D.burns && this.burnsNow() && (this.fire = Math.max(this.fire, 160)),
      this.age % 20 == 0 &&
        Sound.warmMob &&
        this.distTo(e) < 32 &&
        Sound.warmMob(this.D.soundType || this.type),
      --this.idleSound < 0 &&
        ((this.idleSound = (this.D.idleT || 200) + 400 * Math.random()),
        this.distTo(e) < 24 &&
          !this.silentNow &&
          this.sound(this.ambientKind ? this.ambientKind() : "ambient")),
      this.attackCd > 0 && this.attackCd--,
      this.anger > 0 && this.anger--,
      this.breedCd > 0 && this.breedCd--,
      (i.fwd = 0),
      (i.strafe = 0),
      (i.jump = !1),
      (i.mod = 1),
      (i.look = null),
      (i.goal = null),
      (i.up = 0),
      (i.face = null),
      this.rider && this.rider.rideInput && this.ridden
        ? this.ridden(i, this.rider.rideInput)
        : this.think(i),
      this.moveBy(i),
      this.afterMove && this.afterMove(),
      this.turnHead(i.look),
      this.loveT > 0 &&
        (this.loveT--,
        this.age % 10 == 0 &&
          t.particles.spawn(
            "heart",
            this.pos[0] + (Math.random() - 0.5) * this.w,
            this.pos[1] + this.h,
            this.pos[2] + (Math.random() - 0.5) * this.w,
            0,
            0.02,
            0,
          )),
      this.baby && --this.growT <= 0 && this.grownUp(),
      this.swingT > 0 && this.swingT--,
      this.leashHolder && this.leashTick && this.leashTick(),
      this.rider && this.rider.followVehicle(this),
      this.animate(),
      this.onGround &&
        this.limbAmt > 0.3 &&
        !1 !== this.D.stepSound &&
        Math.floor(this.limbSwing / 2.4) !== Math.floor((this.limbSwing - this.limbAmt) / 2.4) &&
        this.sound("step", 0.15));
  }
  grownUp() {
    ((this.baby = !1), (this.w = this.T.w), (this.h = this.T.h), this.onGrown && this.onGrown());
  }
  sound(t, e = 1, i) {
    const s =
      (this.D.sounds && this.D.sounds[t]) || "entity." + (this.D.soundType || this.type) + "." + t;
    Sound.ev(
      s,
      this.pos,
      e * (this.D.vol || 1),
      i ?? (this.baby ? 1.5 : 1) + 0.2 * (Math.random() - Math.random()),
    );
  }
  despawn() {
    if (this.persistent || this.customName || this.leashHolder || this.rider) return !1;
    const t = this.distTo(this.game.player);
    return (
      (t > 128 || (t > 32 && this.age > 600 && Math.random() < 1 / 800)) && ((this.dead = !0), !0)
    );
  }
  burnsNow() {
    const t = this.game;
    return (
      !(!t.isDay() || this.inWater || this.age % 20 || t.weather >= 0.5 || this.fire > 0) &&
      (!this.armorItems || !this.armorItems[0]) &&
      this.world.skyAt(
        Math.floor(this.pos[0]),
        Math.floor(this.pos[1] + this.h),
        Math.floor(this.pos[2]),
      ) >= 15
    );
  }
  think(t) {
    if (!this.sitting) {
      if ((this.findTarget(), !this.target))
        return this.panic > 0
          ? (this.panic--,
            (t.mod = this.D.panicMod || 1.4),
            (this.goal && this.age % 20 != 0 && !this.near(this.goal, 1.2)) ||
              (this.goal = this.randomGoal(8, 4)),
            void (t.goal = this.goal))
          : void (
              (this.avoid && this.avoid(t)) ||
              this.breedTick(t) ||
              this.tempt(t) ||
              (this.followOwner && this.followOwner(t)) ||
              this.followParent(t) ||
              (this.raid && this.raidGoal && this.raidGoal(t)) ||
              (this.idle && this.idle(t)) ||
              this.wanderTick(t)
            );
      this.fight(t);
    }
  }
  near(t, e) {
    return (
      Math.hypot(
        t[0] - this.pos[0],
        (t[1] - this.pos[1]) * ("ground" === this.ai ? 0 : 1),
        t[2] - this.pos[2],
      ) < e
    );
  }
  findTarget() {
    const t = this.game.player,
      e = this.T,
      ok = (i) =>
        i &&
        !i.dead &&
        0 === i.deathTime &&
        !(i === t && (t.creative || t.spectator || (0 === this.game.difficulty && e.hostile)));
    (this.target &&
      (!ok(this.target) ||
        this.distTo(this.target) > 1.5 * e.follow ||
        (this.target === t && this.anger <= 0 && !this.wantsPlayer())) &&
      (this.target = null),
      !this.target &&
        this.wantsPlayer() &&
        ok(t) &&
        this.distTo(t) < seenWithin(t, e.follow) &&
        (this.age + this.id) % 10 == 0 &&
        this.canSee(t) &&
        (this.target = t),
      !this.target && this.huntTarget && (this.target = this.huntTarget()));
  }
  wantsPlayer() {
    return this.T.hostile && !this.D.neutral && this.game.difficulty > 0;
  }
  fight(t) {
    const e = this.target,
      i = Math.hypot(e.pos[0] - this.pos[0], e.pos[2] - this.pos[2]);
    ((t.look = e), this.ranged ? this.ranged(t, e, i) : this.chase(t, e, i));
  }
  chase(t, e = this.target, i = Math.hypot(e.pos[0] - this.pos[0], e.pos[2] - this.pos[2])) {
    ((t.look = e),
      (t.goal = [e.pos[0], e.pos[1], e.pos[2]]),
      (t.mod = this.D.chaseMod || 1.2),
      "ground" !== this.ai && (t.goal[1] += 0.5 * e.h - 0.5 * this.h));
    const s = this.w / 2 + e.w / 2 + (this.D.reach || 0.7),
      o = Math.min(this.pos[1], this.jumpFromY ?? this.pos[1]),
      a =
        "ground" !== this.ai
          ? Math.abs(e.pos[1] - this.pos[1]) < Math.max(1.8, this.h)
          : e.pos[1] < o + Math.max(this.h, 1.2) && e.pos[1] + e.h > o;
    i < s && a && this.attackCd <= 0 && this.melee(e);
  }
  melee(t) {
    ((this.attackCd = this.D.attackCd || 20), (this.swingT = 6));
    const e = this.game;
    t === e.player &&
      t.usingItem === ITEM_KEY.shield &&
      this.hand &&
      /_axe$/.test(ITEMS[this.hand.id].key) &&
      ((t.shieldCd = e.tickCount + 100),
      (t.usingItem = null),
      Sound.ev("item.shield.break", t.pos, 0.8, 0.8 + 0.4 * Math.random()));
    let i = this.T.attack || 2;
    const s = this.game.difficulty;
    (t === this.game.player && (i = 1 === s ? Math.min(i / 2 + 1, i) : 3 === s ? 1.5 * i : i),
      t.hurt(i, {
        type: "mob",
        attacker: this,
        knockFrom: this.pos,
        knock: 0.4 + (this.D.knock || 0),
      }) && (this.sound("attack", 1), this.onMeleeHit && this.onMeleeHit(t)));
  }
  tempt(t) {
    if (!this.D.food || (this.baby && !this.D.babyTempt)) return !1;
    const e = this.game.player,
      i = e.inv.held,
      s = e.inv.slots[40];
    if (!((i && isFood(this.D.food, i.id)) || (s && isFood(this.D.food, s.id)))) return !1;
    const o = this.distTo(e);
    return (
      !(o > 10 || e.deathTime) &&
      ((t.look = e),
      o > 2.5 && ((t.goal = [e.pos[0], e.pos[1], e.pos[2]]), (t.mod = this.D.temptMod || 1)),
      !0)
    );
  }
  breedTick(t) {
    if (this.loveT <= 0) return !1;
    const e = this.game.entities.find(
      (t) =>
        t !== this &&
        t.type === this.type &&
        t.loveT > 0 &&
        !t.baby &&
        t.distTo(this) < 8 &&
        !t.dead,
    );
    return (
      !!e &&
      ((t.look = e),
      (t.goal = [e.pos[0], e.pos[1], e.pos[2]]),
      this.distTo(e) < 3 &&
        ((this.breedT = (this.breedT || 0) + 1),
        this.breedT > 60 &&
          this.id < e.id &&
          ((this.loveT = 0),
          (e.loveT = 0),
          (this.breedT = 0),
          (this.breedCd = e.breedCd = 6e3),
          this.spawnChild(e))),
      !0)
    );
  }
  spawnChild(t) {
    const e = this.game,
      i = createMob(
        e,
        this.type,
        (this.pos[0] + t.pos[0]) / 2,
        this.pos[1],
        (this.pos[2] + t.pos[2]) / 2,
      );
    (i.makeBaby(),
      (i.persistent = !0),
      this.inheritFrom && this.inheritFrom(i, t),
      this.owner && (i.owner = this.owner),
      e.entities.push(i));
    for (let t = 0; t < 7; t++)
      e.particles.spawn(
        "heart",
        i.pos[0] + (Math.random() - 0.5),
        i.pos[1] + 0.5 + 0.5 * Math.random(),
        i.pos[2] + (Math.random() - 0.5),
        0,
        0.02,
        0,
      );
    return (e.dropXp(i.pos[0], i.pos[1] + 0.5, i.pos[2], randInt(1, 7)), i);
  }
  followParent(t) {
    if (!this.baby || (this.age % 40 && !this.parentRef)) return !1;
    (this.parentRef && !this.parentRef.dead && this.age % 40 != 0) ||
      (this.parentRef = this.game.entities.find(
        (t) => t.type === this.type && !t.baby && t.distTo(this) < 8,
      ));
    const e = this.parentRef;
    return (
      !(!e || this.distTo(e) < 3) && ((t.goal = [e.pos[0], e.pos[1], e.pos[2]]), (t.mod = 1.1), !0)
    );
  }
  get avoidsWater() {
    return "ground" === this.ai && !this.D.waterOk;
  }
  wanderTick(t) {
    this.goal &&
      (this.near(this.goal, "ground" === this.ai ? 0.8 : 1) || --this.wanderT <= 0) &&
      (this.goal = null);
    const e = this.avoidsWater && this.inWater;
    (!this.goal &&
      (e
        ? this.age % 10 == 0
        : Math.random() < (this.D.wanderChance || ("ground" === this.ai ? 1 / 120 : 1 / 40))) &&
      ((this.goal = this.randomGoal(e ? 14 : this.D.wanderR || 10, this.D.wanderY || 7)),
      (this.wanderT = 200)),
      this.goal && ((t.goal = this.goal), (t.mod = this.D.wanderMod || 1)));
  }
  randomGoal(t, e) {
    const i = this.world;
    for (let s = 0; s < 10; s++) {
      const s = this.pos[0] + (2 * Math.random() - 1) * t,
        o = this.pos[2] + (2 * Math.random() - 1) * t;
      let a = this.pos[1] + (2 * Math.random() - 1) * e;
      const r = Math.floor(s),
        h = Math.floor(o);
      if (!i.isLoaded(r, h)) continue;
      if ("swim" === this.ai) {
        if (i.waterAt(r, Math.floor(a), h) && i.waterAt(r, Math.floor(a + this.h + 0.3), h))
          return [s, a, o];
        continue;
      }
      if ("fly" === this.ai) {
        if (this.D.flyHeight) {
          let t = Math.floor(this.pos[1]);
          for (; t > 0 && !BLOCKS[i.getBlock(r, t, h)].solid && this.pos[1] - t < 30;) t--;
          a = Math.min(a, t + 1 + this.D.flyHeight);
        }
        if (!BLOCKS[i.getBlock(r, Math.floor(a), h)].solid) return [s, a, o];
        continue;
      }
      let n = Math.floor(this.pos[1] + 2);
      for (let t = 0; t < 8 && !BLOCKS[i.getBlock(r, n - 1, h)].solid; t++) n--;
      if (
        BLOCKS[i.getBlock(r, n - 1, h)].solid &&
        !BLOCKS[i.getBlock(r, n, h)].solid &&
        (!this.avoidsWater ||
          (!i.waterAt(r, n, h) && !i.waterAt(r, n - 1, h) && i.getBlock(r, n - 1, h) !== LAVA))
      )
        return [s, n, o];
    }
    return null;
  }
  moveBy(t) {
    const e = this.D,
      i = t.goal;
    if (
      (null != t.face && this.turnTo(t.face, 0.5),
      "fly" === this.ai ||
        ("swim" === this.ai && this.inWater) ||
        ("amph" === this.ai && this.inWater && !this.D.walkUnderwater))
    )
      return void this.move3d(t);
    if ("swim" === this.ai && !this.inWater) return void this.flop();
    if (i) {
      const s = i[0] - this.pos[0],
        o = i[2] - this.pos[2];
      Math.hypot(s, o) > 0.3 &&
        (this.turnTo(Math.atan2(-s, -o), e.turn || 0.35), (t.fwd = Math.max(t.fwd, 1)));
    }
    if (t.fwd > 0) {
      const i = this.pos[0] - Math.sin(this.yaw) * (this.w / 2 + 0.5),
        s = this.pos[2] - Math.cos(this.yaw) * (this.w / 2 + 0.5),
        o = Math.floor(i),
        a = Math.floor(s),
        r = Math.floor(this.pos[1]);
      let h = 0;
      for (
        ;
        h < 5 &&
        !BLOCKS[this.world.getBlock(o, r - 1 - h, a)].solid &&
        !IS_FLUID[this.world.getBlock(o, r - 1 - h, a)];
      )
        h++;
      const n =
          this.world.getBlock(o, r - 1 - h, a) === LAVA || this.world.getBlock(o, r, a) === LAVA,
        l =
          this.avoidsWater &&
          !this.target &&
          !this.inWater &&
          t.goal === this.goal &&
          (this.world.waterAt(o, r, a) || this.world.waterAt(o, r - 1 - h, a));
      (((n && !this.T.fireproof) || l || (h > (this.target ? 4 : 3) && !e.fearless)) &&
        ((t.fwd = 0), (this.goal = null)),
        this.collidedH && this.onGround && (t.jump = !0),
        this.collidedH && e.climbs && ((this.vel[1] = 0.2), (this.fallDist = 0)),
        fwdStuck(this)
          ? ++this.stuck > 40 &&
            ((this.goal = null), (this.stuck = 0), (this.yaw += 2 * (Math.random() - 0.5)))
          : (this.stuck = 0));
    }
    (this.inWater && !e.sinks && (this.vel[1] < 0.02 || this.collidedH) && (t.jump = !0),
      this.inLava && this.T.fireproof && e.lavaWalker && (t.jump = !0),
      t.jump && this.onGround && !this.inWater
        ? ((this.vel[1] = (e.jump || 0.42) * jumpFactorOf(this)), (this.jumpFromY = this.pos[1]))
        : this.onGround && (this.jumpFromY = void 0));
    const s = this.T.speed * t.mod * (this.baby && e.babyFast ? 1.2 : 1);
    this.travel(t.fwd, t.strafe, s * s * (e.landSpeedMul || 1), t.jump);
    const o = angDelta(this.yaw, this.bodyYaw);
    this.bodyYaw += o * (e.bodyTurn || 0.3);
  }
  move3d(t) {
    const e = this.D,
      i = this.vel,
      s = t.goal,
      o = "fly" === this.ai,
      a =
        (o
          ? 0.1 * (this.T.flySpeed || 0.6) * (e.speed3 || 1)
          : e.swimAcc || 0.12 * this.T.speed * (e.speed3 || 1)) * t.mod;
    if (s) {
      const o = s[0] - this.pos[0],
        r = s[1] - this.pos[1],
        h = s[2] - this.pos[2],
        n = Math.hypot(o, r, h);
      if (n > 0.2) {
        ((i[0] += (o / n) * a), (i[1] += (r / n) * a * (e.vert || 1)), (i[2] += (h / n) * a));
        const s = Math.hypot(o, h);
        (s > 0.3 && null == t.face && this.turnTo(Math.atan2(-o, -h), e.turn || 0.25),
          (this.pitch3 = Math.atan2(r, s)));
      }
    }
    (t.up && (i[1] += t.up),
      o && (this.fallDist = 0),
      o && !1 !== e.hover && !s && (i[1] *= 0.6),
      o || s || (i[1] -= e.sink ?? 0.002),
      this.move(i[0], i[1], i[2]));
    const r = o ? e.airDrag || 0.91 : e.waterDrag || 0.9;
    ((i[0] *= r),
      (i[1] *= r),
      (i[2] *= r),
      o && e.gravity && (i[1] -= e.gravity),
      (this.bodyYaw += angDelta(this.yaw, this.bodyYaw) * (e.bodyTurn || 0.5)),
      this.collidedH && o && (i[1] += 0.05));
  }
  flop() {
    const t = this.vel;
    (this.onGround &&
      Math.random() < 0.1 &&
      ((t[1] = 0.4),
      (t[0] += 0.1 * (Math.random() - 0.5)),
      (t[2] += 0.1 * (Math.random() - 0.5)),
      this.sound("flop", 0.6)),
      this.travel(0, 0, 0, !1),
      (this.outOfWater = (this.outOfWater || 0) + 1),
      this.outOfWater > (this.D.dryOut || 300) &&
        this.age % 20 == 0 &&
        this.hurt(1, { type: "drown" }));
  }
  turnHead(t) {
    if (t) {
      const e = t.pos ? t.pos : t,
        i = t.pos ? t.pos[1] + (t.eyeH || 0.85 * t.h || 1) : t[1],
        s = e[0] - this.pos[0],
        o = e[2] - this.pos[2],
        a = angDelta(Math.atan2(-s, -o), this.bodyYaw),
        r = this.D.headYaw || 1.2;
      this.headYaw += 0.3 * (clamp(a, -r, r) - this.headYaw);
      const h = i - (this.pos[1] + (this.T.eye || 0.85 * this.h));
      ((this.pitch = clamp(Math.atan2(h, Math.hypot(s, o)), -0.8, 0.8)),
        Math.abs(a) > r &&
          "fly" !== this.ai &&
          0 === this.ctl.fwd &&
          (this.bodyYaw += 0.1 * angDelta(this.bodyYaw + a, this.bodyYaw)));
    } else
      ((this.headYaw *= 0.9),
        (this.pitch *= 0.9),
        "ground" !== this.ai && this.pitch3 && (this.pitch = 0));
  }
  interact(t, e) {
    const i = this.game;
    if (this.preInteract && this.preInteract(t, e)) return !0;
    if (e && this.D.food && isFood(this.D.food, e.id)) {
      if (this.health < this.maxHealth && this.D.healFood)
        return (
          (this.health = Math.min(this.maxHealth, this.health + this.D.healFood)),
          useOne(i, t),
          this.sound("eat"),
          !0
        );
      if (this.baby)
        return (
          (this.growT -= Math.floor(0.1 * this.growT)),
          useOne(i, t),
          i.particles.spawn(
            "happy_villager",
            this.pos[0],
            this.pos[1] + this.h,
            this.pos[2],
            0,
            0.05,
            0,
          ),
          !0
        );
      if (this.breedCd <= 0 && this.loveT <= 0 && this.canBreed())
        return ((this.loveT = 600), useOne(i, t), this.sound("eat"), !0);
    }
    return !(!this.postInteract || !this.postInteract(t, e));
  }
  canBreed() {
    return !this.D.tameToBreed || !!this.owner;
  }
  layerKey() {
    const t = this.D,
      e = t.layer || this.type + "#main";
    if (this.baby) {
      const i = t.babyLayer || e.replace("#", "_baby#");
      if (EM.has(i)) return i;
    }
    return e;
  }
  texKey(t) {
    const e = this.D.tex ? this.D.tex(this, t) : "entity/" + this.type + "/" + this.type;
    return e ? ("string" == typeof e ? ("@" === e[0] ? e : t.etex(e)) : t.etexMix(e)) : null;
  }
  setupAnim(t, e) {
    if (this.D.anim) this.D.anim(t, this, e);
    else {
      emHead(t.parts.head, this, e);
      const [i, s] = emLimbs(this, e);
      emQuad(t, i, s);
    }
  }
  renderScale() {
    return (
      (this.attrScale || 1) *
      (this.D.scale || 1) *
      (this.baby && this.layerKey() === (this.D.layer || this.type + "#main") ? 0.5 : 1)
    );
  }
  drawVM(t, e, i, s, o, a, r) {
    const h = EM.get(e, this.layerKey());
    if (!h) return;
    (EM.reset(h), this.setupAnim(h, s));
    const n = this.texKey(e),
      l = this.attachments ? this.attachments(t, h, a, o) : null;
    if (
      (e.drawEM(h, n, i, a, o, {
        overlay: r,
        attach: l,
        cull: "function" == typeof this.D.cull ? this.D.cull(this) : this.D.cull,
        bright: this.D.bright,
      }),
      this.drawLayers && this.drawLayers(t, e, h, i, s, o, a, r),
      this.D.glow)
    ) {
      const t = e.etex("function" == typeof this.D.glow ? this.D.glow(this) : this.D.glow);
      t && e.drawEMGlow(h, t, i, o, {});
    }
  }
}
function angDelta(t, e) {
  let i = t - e;
  for (; i > Math.PI;) i -= 2 * Math.PI;
  for (; i < -Math.PI;) i += 2 * Math.PI;
  return i;
}
function fwdStuck(t) {
  return Math.hypot(t.pos[0] - t.prev[0], t.pos[2] - t.prev[2]) < 0.01;
}
function useOne(t, e, i) {
  if ("creative" === t.mode) return;
  const s = e.inv.held;
  if (s && (s.count--, s.count || (e.inv.slots[e.inv.sel] = null), i)) {
    const s = makeStack(i, 1);
    e.inv.slots[e.inv.sel]
      ? e.inv.add(s) && t.dropItem(e.pos[0], e.pos[1] + 1, e.pos[2], s)
      : (e.inv.slots[e.inv.sel] = s);
  }
}
function swapHeld(t, e, i, s) {
  const o = { ...makeStack(i, 1), ...(s || {}) };
  if ("creative" === t.mode)
    return void (e.inv.slots.some((t) => t && sameKind(t, o)) || e.inv.add(o));
  const a = e.inv.held;
  a.count <= 1
    ? (e.inv.slots[e.inv.sel] = o)
    : (a.count--, e.inv.add(o) && t.dropItem(e.pos[0], e.pos[1] + 1, e.pos[2], o));
}
((Game.prototype.drawVMob = function (t, e, i, s, o) {
  const a = this.renderer;
  let r = M4.create();
  if (t.displayMatrix) r = M4.copy(t.displayMatrix);
  else {
    M4.translate(r, e[0], e[1], e[2]);
    let s = t.bodyYaw;
    (void 0 !== t.prevBodyYaw && (s = t.prevBodyYaw + angDelta(t.bodyYaw, t.prevBodyYaw) * i),
      M4.rotY(r, s));
  }
  (t.deathTime > 0 &&
    !t.D.noDeathFlip &&
    M4.rotZ(r, (Math.min(1, Math.sqrt((t.deathTime + i) / 20)) * Math.PI) / 2),
    t.preDraw && t.preDraw(r, i));
  const h = t.renderScale(i);
  M4.scale(r, h, h, h);
  const n =
      t.hurtTime > 0 || t.deathTime > 0 ? [1, 0, 0, 0.4] : t.whiteFlash ? t.whiteFlash(i) : null,
    l = [o[0], o[1]];
  if (
    ((t.fire > 0 || t.D.bright) && (l[1] = 1),
    t.drawVM(this, a, r, i, s, l, n),
    t.customName &&
      this.player &&
      t.distTo(this.player) < 32 &&
      this.drawNameTag &&
      this.drawNameTag(t, e, t.customName),
    0 === t.deathTime && !t.displayMatrix && !1 !== t.D.shadow)
  ) {
    const i = Math.floor(e[0]),
      s = Math.floor(e[2]);
    let o = Math.floor(e[1] + 0.01);
    for (
      let t = 0;
      t < 6 &&
      o > 0 &&
      !SOLIDCUBE[this.world.getBlock(i, o - 1, s)] &&
      !BLOCKS[this.world.getBlock(i, o - 1, s)].solid;
      t++
    )
      o--;
    const r = e[1] - o,
      h = (t.D.shadowR || 0.6 * t.w) * (t.baby ? 0.5 : 1) * (t.D.scale || 1);
    r < 5 && a.drawShadow(e[0], o, e[2], h * (1 - r / 10), 0.55 * (1 - r / 5));
  }
}),
  (() => {
    const t = Game.prototype.drawMob;
    Game.prototype.drawMob = function (e, i, s, o, a) {
      return e.vm && e.drawVM ? this.drawVMob(e, i, s, o, a) : t.call(this, e, i, s, o, a);
    };
  })());
const mobLookKey = (t) => {
  const st = (t) => (t ? t.id + ":" + (t.color ?? "") : "");
  return [
    t.type,
    t.variant,
    t.baby ? 1 : 0,
    t.saddled ? 1 : 0,
    t.rider ? 1 : 0,
    st(t.armorItem),
    t.chest ? 1 : 0,
    st(t.carpet),
    t.sit ? 1 : 0,
    t.sitting ? 1 : 0,
    t.cvar ?? "",
    t.sheared ? 1 : 0,
  ].join("/");
};
((Renderer.prototype.mobPreview = function (t, e, i, s, o, a, r) {
  const h = this.gl,
    n = Math.max(2, i.scale),
    l = a * n,
    d = r * n,
    c =
      e.id +
      "," +
      Math.round(i.mouse.x / 2) +
      "," +
      Math.round(i.mouse.y / 2) +
      "," +
      l +
      "," +
      d +
      "," +
      mobLookKey(e),
    p = performance.now(),
    m = this.mpv ? p - (this.mpv.at || 0) : 1e9;
  if (
    (this.mpv && (this.mpv.at = p),
    this.mpv && this.mpv.sync && this.mpv.W === l && this.mpv.H === d)
  ) {
    const t = this.mpv;
    if (t.eid !== e.id) (h.deleteSync(t.sync), (t.sync = null), (t.key = null));
    else {
      if (h.getSyncParameter(t.sync, h.SYNC_STATUS) !== h.SIGNALED) return t.cv;
      (h.deleteSync(t.sync),
        (t.sync = null),
        h.bindBuffer(h.PIXEL_PACK_BUFFER, t.pbo),
        h.getBufferSubData(h.PIXEL_PACK_BUFFER, 0, t.px),
        h.bindBuffer(h.PIXEL_PACK_BUFFER, null));
      for (let e = 0; e < d; e++)
        t.img.data.set(t.px.subarray((d - 1 - e) * l * 4, (d - e) * l * 4), e * l * 4);
      (t.ctx.putImageData(t.img, 0, 0), (t.key = t.pendingKey));
    }
  }
  if (this.mpv && this.mpv.key === c) return this.mpv.cv;
  if (!this.mpv || this.mpv.W !== l || this.mpv.H !== d) {
    this.mpv &&
      (h.deleteFramebuffer(this.mpv.fb),
      h.deleteTexture(this.mpv.tex),
      h.deleteRenderbuffer(this.mpv.rb),
      this.mpv.pbo && h.deleteBuffer(this.mpv.pbo),
      this.mpv.sync && h.deleteSync(this.mpv.sync));
    const t = h.createFramebuffer(),
      e = h.createTexture(),
      i = h.createRenderbuffer();
    (h.bindTexture(h.TEXTURE_2D, e),
      h.texImage2D(h.TEXTURE_2D, 0, h.RGBA, l, d, 0, h.RGBA, h.UNSIGNED_BYTE, null),
      h.bindRenderbuffer(h.RENDERBUFFER, i),
      h.renderbufferStorage(h.RENDERBUFFER, h.DEPTH_COMPONENT24, l, d),
      h.bindFramebuffer(h.FRAMEBUFFER, t),
      h.framebufferTexture2D(h.FRAMEBUFFER, h.COLOR_ATTACHMENT0, h.TEXTURE_2D, e, 0),
      h.framebufferRenderbuffer(h.FRAMEBUFFER, h.DEPTH_ATTACHMENT, h.RENDERBUFFER, i));
    const s = document.createElement("canvas");
    ((s.width = l), (s.height = d));
    const o = h.createBuffer();
    (h.bindBuffer(h.PIXEL_PACK_BUFFER, o),
      h.bufferData(h.PIXEL_PACK_BUFFER, l * d * 4, h.STREAM_READ),
      h.bindBuffer(h.PIXEL_PACK_BUFFER, null),
      (this.mpv = {
        fb: t,
        tex: e,
        rb: i,
        pbo: o,
        W: l,
        H: d,
        cv: s,
        ctx: s.getContext("2d"),
        px: new Uint8Array(l * d * 4),
        img: s.getContext("2d").createImageData(l, d),
        first: !0,
      }));
  }
  const u = this.mpv;
  (h.bindFramebuffer(h.FRAMEBUFFER, u.fb),
    h.viewport(0, 0, l, d),
    h.clearColor(0, 0, 0, 0),
    h.clear(h.COLOR_BUFFER_BIT | h.DEPTH_BUFFER_BIT),
    h.enable(h.DEPTH_TEST));
  const f = Math.max(e.w, e.h) * (e.D.scale || 1) * 0.62 + 0.1,
    g = M4.create();
  M4.ortho(g, -f, f, 0.25 * -f, 1.75 * f, -8, 8);
  const y = (i.mouse.x - (s + a / 2)) / 40,
    b = M4.create();
  M4.rotY(b, 0.8 * Math.PI - 0.7 * Math.atan(y));
  const w = { day: 1, fogColor: [0, 0, 0], fogNear: 1e8, fogFar: 2e8, nightTint: [1, 1, 1] },
    M = this.camPos,
    v = this.vp;
  ((this.camPos = [0, 0, 0]), (this.vp = g));
  const _ = e.headYaw,
    T = e.pitch,
    k = e.limbAmt;
  ((e.headYaw = 0), (e.pitch = 0), (e.limbAmt = 0));
  const D = e.renderScale(1);
  M4.scale(b, D, D, D);
  try {
    e.drawVM(t, this, b, 1, w, [1, 0], null);
  } catch (t) {}
  ((e.headYaw = _), (e.pitch = T), (e.limbAmt = k), (this.vp = v), (this.camPos = M));
  const E = e.texKey && e.texKey(this) ? c : null;
  if (u.first || u.eid !== e.id || m > 500) {
    ((u.first = !1), h.readPixels(0, 0, l, d, h.RGBA, h.UNSIGNED_BYTE, u.px));
    for (let t = 0; t < d; t++)
      u.img.data.set(u.px.subarray((d - 1 - t) * l * 4, (d - t) * l * 4), t * l * 4);
    (u.ctx.putImageData(u.img, 0, 0), (u.key = E));
  } else
    (h.bindBuffer(h.PIXEL_PACK_BUFFER, u.pbo),
      h.readPixels(0, 0, l, d, h.RGBA, h.UNSIGNED_BYTE, 0),
      h.bindBuffer(h.PIXEL_PACK_BUFFER, null),
      (u.sync = h.fenceSync(h.SYNC_GPU_COMMANDS_COMPLETE, 0)),
      h.flush(),
      (u.pendingKey = E));
  return (
    (u.eid = e.id),
    (u.at = p),
    h.bindFramebuffer(h.FRAMEBUFFER, null),
    h.viewport(0, 0, this.canvas.width, this.canvas.height),
    u.cv
  );
}),
  void 0 !== ITEM_KEY.ender_dragon_spawn_egg &&
    (ITEMS[ITEM_KEY.ender_dragon_spawn_egg].spawnEgg = "ender_dragon"));
//# sourceURL=js/vmobs.js
