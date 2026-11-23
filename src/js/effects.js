"use strict";
const EFFECT_LIST = [
    ["speed", "速度", 1, 3402751],
    ["slowness", "缓慢", -1, 9154528],
    ["haste", "急迫", 1, 14270531],
    ["mining_fatigue", "挖掘疲劳", -1, 4866583],
    ["strength", "力量", 1, 16762624],
    ["instant_health", "瞬间治疗", 1, 16262179],
    ["instant_damage", "瞬间伤害", -1, 11101546],
    ["jump_boost", "跳跃提升", 1, 16646020],
    ["nausea", "反胃", -1, 5578058],
    ["regeneration", "生命恢复", 1, 13458603],
    ["resistance", "抗性提升", 1, 9520880],
    ["fire_resistance", "抗火", 1, 16750848],
    ["water_breathing", "水下呼吸", 1, 10017472],
    ["invisibility", "隐身", 1, 16185078],
    ["blindness", "失明", -1, 2039587],
    ["night_vision", "夜视", 1, 12779366],
    ["hunger", "饥饿", -1, 5797459],
    ["weakness", "虚弱", -1, 4738376],
    ["poison", "中毒", -1, 8889187],
    ["wither", "凋零", -1, 7561558],
    ["health_boost", "生命提升", 1, 16284963],
    ["absorption", "伤害吸收", 1, 2445989],
    ["saturation", "饱和", 1, 16262179],
    ["glowing", "发光", 0, 9740385],
    ["levitation", "飘浮", -1, 13565951],
    ["luck", "幸运", 1, 5882118],
    ["unluck", "霉运", -1, 12624973],
    ["slow_falling", "缓降", 1, 15978425],
    ["conduit_power", "潮涌能量", 1, 1950417],
    ["dolphins_grace", "海豚的恩惠", 1, 8954814],
    ["bad_omen", "不祥之兆", 0, 745784],
    ["hero_of_the_village", "村庄英雄", 1, 4521796],
    ["darkness", "黑暗", -1, 2696993],
    ["trial_omen", "试炼之兆", 0, 1484454],
    ["raid_omen", "袭击之兆", 0, 14565464],
    ["wind_charged", "蓄风", -1, 12438015],
    ["weaving", "盘丝", -1, 7891290],
    ["oozing", "渗浆", -1, 10092451],
    ["infested", "寄生", -1, 9214860],
    ["breath_of_the_nautilus", "鹦鹉螺之息", 1, 4904935],
  ],
  EFFECTS = {};
EFFECT_LIST.forEach(([t, e, s, o], i) => {
  EFFECTS[t] = { key: t, id: i, cn: e, kind: s, color: o };
});
const romanLevel = (t) =>
    t > 0
      ? " " + (["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][t] || String(t + 1))
      : "",
  POTIONS = {
    water: [],
    mundane: [],
    thick: [],
    awkward: [],
    night_vision: [["night_vision", 3600, 0]],
    long_night_vision: [["night_vision", 9600, 0]],
    invisibility: [["invisibility", 3600, 0]],
    long_invisibility: [["invisibility", 9600, 0]],
    leaping: [["jump_boost", 3600, 0]],
    long_leaping: [["jump_boost", 9600, 0]],
    strong_leaping: [["jump_boost", 1800, 1]],
    fire_resistance: [["fire_resistance", 3600, 0]],
    long_fire_resistance: [["fire_resistance", 9600, 0]],
    swiftness: [["speed", 3600, 0]],
    long_swiftness: [["speed", 9600, 0]],
    strong_swiftness: [["speed", 1800, 1]],
    slowness: [["slowness", 1800, 0]],
    long_slowness: [["slowness", 4800, 0]],
    strong_slowness: [["slowness", 400, 3]],
    turtle_master: [
      ["slowness", 400, 3],
      ["resistance", 400, 2],
    ],
    long_turtle_master: [
      ["slowness", 800, 3],
      ["resistance", 800, 2],
    ],
    strong_turtle_master: [
      ["slowness", 400, 5],
      ["resistance", 400, 3],
    ],
    water_breathing: [["water_breathing", 3600, 0]],
    long_water_breathing: [["water_breathing", 9600, 0]],
    healing: [["instant_health", 1, 0]],
    strong_healing: [["instant_health", 1, 1]],
    harming: [["instant_damage", 1, 0]],
    strong_harming: [["instant_damage", 1, 1]],
    poison: [["poison", 900, 0]],
    long_poison: [["poison", 1800, 0]],
    strong_poison: [["poison", 432, 1]],
    regeneration: [["regeneration", 900, 0]],
    long_regeneration: [["regeneration", 1800, 0]],
    strong_regeneration: [["regeneration", 450, 1]],
    strength: [["strength", 3600, 0]],
    long_strength: [["strength", 9600, 0]],
    strong_strength: [["strength", 1800, 1]],
    weakness: [["weakness", 1800, 0]],
    long_weakness: [["weakness", 4800, 0]],
    luck: [["luck", 6e3, 0]],
    slow_falling: [["slow_falling", 1800, 0]],
    long_slow_falling: [["slow_falling", 4800, 0]],
    wind_charged: [["wind_charged", 3600, 0]],
    weaving: [["weaving", 3600, 0]],
    oozing: [["oozing", 3600, 0]],
    infested: [["infested", 3600, 0]],
  };
function potionColor(t) {
  const e = POTIONS[t] || [];
  if (!e.length) return [56, 93, 198];
  let s = 0,
    o = 0,
    i = 0,
    n = 0;
  for (const [t, , a] of e) {
    const e = EFFECTS[t].color,
      r = a + 1;
    ((s += ((e >> 16) & 255) * r), (o += ((e >> 8) & 255) * r), (i += (255 & e) * r), (n += r));
  }
  return [s / n, o / n, i / n].map(Math.round);
}
const FOOD_EFFECTS = {
    golden_apple: [
      ["regeneration", 100, 1, 1],
      ["absorption", 2400, 0, 1],
    ],
    enchanted_golden_apple: [
      ["regeneration", 400, 1, 1],
      ["absorption", 2400, 3, 1],
      ["resistance", 6e3, 0, 1],
      ["fire_resistance", 6e3, 0, 1],
    ],
    pufferfish: [
      ["hunger", 300, 2, 1],
      ["nausea", 300, 0, 1],
      ["poison", 1200, 1, 1],
    ],
    spider_eye: [["poison", 100, 0, 1]],
    poisonous_potato: [["poison", 100, 0, 0.6]],
    rotten_flesh: [["hunger", 600, 0, 0.8]],
    chicken: [["hunger", 600, 0, 0.3]],
  },
  FOOD_LEFTOVER = {
    mushroom_stew: "bowl",
    beetroot_soup: "bowl",
    rabbit_stew: "bowl",
    suspicious_stew: "bowl",
    honey_bottle: "glass_bottle",
  },
  ALWAYS_EDIBLE = new Set([
    "golden_apple",
    "enchanted_golden_apple",
    "chorus_fruit",
    "honey_bottle",
    "suspicious_stew",
  ]),
  EAT_TICKS = { dried_kelp: 16, honey_bottle: 40 };
for (const t of self.ITEM_DATA || []) {
  const e = ITEMS[ITEM_KEY[t.key]];
  e && t.food && !e.food && (e.food = t.food);
}
(void 0 !== ITEM_KEY.golden_apple && delete ITEMS[ITEM_KEY.golden_apple].heal,
  Object.assign(Living.prototype, {
    addEffect(t, e, s, o = !1) {
      if (!EFFECTS[t]) return;
      const i = this.effects || (this.effects = new Map()),
        n = i.get(t);
      "instant_health" !== t && "instant_damage" !== t
        ? (("poison" !== t && "regeneration" !== t) || !this.isUndead()) &&
          ("saturation" !== t ||
            this !== this.game.player ||
            this.game.net ||
            ((this.food = Math.min(20, this.food + e + 1)),
            (this.saturation = Math.min(this.food, this.saturation + 2 * (e + 1)))),
          (n && (n.amp > e || (n.amp === e && (n.dur < 0 || (s >= 0 && n.dur >= s))))) ||
            (i.set(t, { amp: e, dur: s, ambient: o, max: s }),
            "health_boost" === t && this.applyHealthBoost(),
            "absorption" === t && (this.absorption = Math.max(this.absorption || 0, 4 * (e + 1)))))
        : this.instantEffect(t, e);
    },
    removeEffect(t) {
      this.effects &&
        this.effects.delete(t) &&
        ("health_boost" === t && this.applyHealthBoost(),
        "absorption" === t && (this.absorption = 0));
    },
    clearEffects() {
      if (this.effects) for (const t of [...this.effects.keys()]) this.removeEffect(t);
    },
    effectAmp(t) {
      const e = this.effects && this.effects.get(t);
      return e ? e.amp : -1;
    },
    hasEffect(t) {
      return !(!this.effects || !this.effects.has(t));
    },
    isUndead() {
      return (
        "undefined" != typeof ENTITY_TAGS && !!this.type && ENTITY_TAGS.undead.includes(this.type)
      );
    },
    applyHealthBoost() {
      (void 0 === this.baseMaxHealth && (this.baseMaxHealth = this.maxHealth),
        (this.maxHealth = this.baseMaxHealth + 4 * (this.effectAmp("health_boost") + 1)),
        (this.health = Math.min(this.health, this.maxHealth)));
    },
    instantEffect(t, e, s = 1) {
      if (this.game.net && this === this.game.player) return;
      ("instant_health" === t) != !!this.isUndead()
        ? (this.health = Math.min(this.maxHealth, this.health + Math.floor(s * (4 << e) + 0.5)))
        : this.hurt(Math.floor(s * (6 << e) + 0.5), { type: "magic" });
    },
    tickEffects() {
      const t = this.effects;
      if (!t || !t.size) return;
      const e = this.game,
        s = !!e.net && this === e.player;
      for (const [o, i] of t) {
        if (!s && this.health > 0)
          if ("regeneration" === o) {
            const t = 50 >> i.amp;
            (t < 1 || i.dur % t === 0) &&
              this.health < this.maxHealth &&
              (this.health = Math.min(this.maxHealth, this.health + 1));
          } else if ("poison" === o) {
            const t = 25 >> i.amp;
            (t < 1 || i.dur % t === 0) &&
              this.health > 1 &&
              this.hurt(1, { type: "magic", bypass: !0 });
          } else if ("wither" === o) {
            const t = 40 >> i.amp;
            (t < 1 || i.dur % t === 0) && this.hurt(1, { type: "wither", bypass: !0 });
          } else
            "hunger" === o && this.exhaust
              ? this.exhaust(0.005 * (i.amp + 1))
              : "saturation" === o &&
                this === e.player &&
                void 0 !== this.food &&
                ((this.food = Math.min(20, this.food + i.amp + 1)),
                (this.saturation = Math.min(this.food, this.saturation + 2 * (i.amp + 1))));
        if (
          !i.hidden &&
          (this !== e.player || e.perspective) &&
          Math.random() < (i.ambient ? 0.05 : 0.2)
        ) {
          const t = EFFECTS[o].color;
          e.particles.spawn(
            "effect",
            this.pos[0] + (Math.random() - 0.5) * this.w,
            this.pos[1] + Math.random() * this.h,
            this.pos[2] + (Math.random() - 0.5) * this.w,
            0,
            0.02,
            0,
            { col: [(t >> 16) & 255, (t >> 8) & 255, 255 & t] },
          );
        }
        i.dur > 0 && 0 === --i.dur && this.removeEffect(o);
      }
      this.waterBreatherFx =
        this.hasEffect("water_breathing") ||
        this.hasEffect("conduit_power") ||
        this.hasEffect("breath_of_the_nautilus");
    },
  }));
{
  const t = Living.prototype.hurt;
  Living.prototype.hurt = function (e, s) {
    const o = s && s.type;
    if (("fire" === o || "lava" === o) && this.hasEffect("fire_resistance")) return !1;
    const i = this.effectAmp("resistance");
    if (i >= 0 && "void" !== o) {
      if (i >= 4) return !1;
      e *= 1 - 0.2 * (i + 1);
    }
    if (this.absorption > 0 && "void" !== o && (!s || !s.bypass || "magic" !== o)) {
      const t = Math.min(this.absorption, e);
      if (((this.absorption -= t), (e -= t) <= 0)) return ((this.hurtTime = 10), !0);
    }
    return t.call(this, e, s);
  };
  const e = Living.prototype.baseTick;
  Living.prototype.baseTick = function () {
    this.tickEffects();
    const t = this.waterBreather;
    (this.waterBreatherFx && (this.waterBreather = !0), e.call(this), (this.waterBreather = t));
  };
}
function seenWithin(t, e) {
  let s = 1;
  if ((t.sneaking && (s *= 0.8), t.invisible || (t.hasEffect && t.hasEffect("invisibility")))) {
    const e = (t.inv ? t.inv.slots.slice(36, 40) : t.armorItems || []).filter(Boolean).length;
    s *= 0.7 * Math.max(0.1, e / 4);
  }
  return Math.max(e * s, 2);
}
function effectSpeedFactor(t) {
  return Math.max(
    0,
    (1 + 0.2 * (t.effectAmp("speed") + 1)) * (1 - 0.15 * (t.effectAmp("slowness") + 1)),
  );
}
function effectMineFactor(t) {
  let e = 1 + 0.2 * (t.effectAmp("haste") + 1) + 0.2 * (t.effectAmp("conduit_power") + 1);
  const s = t.effectAmp("mining_fatigue");
  return (s >= 0 && (e *= [0.3, 0.09, 0.0027, 81e-5][Math.min(3, s)]), e);
}
function effectAttackBonus(t) {
  return 3 * (t.effectAmp("strength") + 1) - 4 * (t.effectAmp("weakness") + 1);
}
function effectJumpBoost(t) {
  return 0.1 * (t.effectAmp("jump_boost") + 1);
}
function nightVisionScale(t) {
  const e = t && t.effects && t.effects.get("night_vision");
  return e ? (e.dur < 0 || e.dur > 200 ? 1 : 0.7 + 0.3 * Math.sin((e.dur - 1) * Math.PI * 0.2)) : 0;
}
((Game.prototype.useTicks = function (t) {
  return "potion" === t.key || "milk_bucket" === t.key ? 32 : EAT_TICKS[t.key] || 32;
}),
  (Game.prototype.canConsume = function (t) {
    const e = this.player;
    return (
      "potion" === t.key ||
      "milk_bucket" === t.key ||
      (!!t.food && (e.food < 20 || "creative" === this.mode || ALWAYS_EDIBLE.has(t.key)))
    );
  }),
  (Game.prototype.finishEating = function (t) {
    const e = this.player,
      s = ITEMS[t.id],
      o = s.key;
    if ("potion" === o) {
      for (const [s, o, i] of POTIONS[t.pot] || []) e.addEffect(s, i, o);
      Sound.ev("entity.generic.drink", e.pos, 0.5, 1);
    } else if ("milk_bucket" === o)
      (e.clearEffects(), Sound.ev("entity.generic.drink", e.pos, 0.5, 1));
    else {
      s.food &&
        ((e.food = Math.min(20, e.food + s.food[0])),
        (e.saturation = Math.min(e.food, e.saturation + s.food[1])));
      for (const [t, s, i, n] of FOOD_EFFECTS[o] || []) Math.random() < n && e.addEffect(t, i, s);
      if (("honey_bottle" === o && e.removeEffect("poison"), "suspicious_stew" === o && t.stew))
        for (const [s, o] of t.stew) e.addEffect(s, 0, o);
      ("chorus_fruit" === o && this.chorusTeleport(), Sound.burp(e.pos));
    }
    const i = "potion" === o ? "glass_bottle" : "milk_bucket" === o ? "bucket" : FOOD_LEFTOVER[o];
    if ("creative" !== this.mode)
      if ((t.count--, t.count)) {
        if (i) {
          const t = makeStack(i);
          e.inv.add(t) && this.dropFromPlayer(t);
        }
      } else e.inv.slots[e.inv.sel] = i ? makeStack(i) : null;
    ((e.usingItem = null), (e.useT = 0), (this.useCd = 4));
  }),
  (Game.prototype.chorusTeleport = function () {
    const t = this.player,
      e = this.world;
    for (let s = 0; s < 16; s++) {
      const s = t.pos[0] + 16 * (Math.random() - 0.5),
        o = t.pos[2] + 16 * (Math.random() - 0.5);
      let i = Math.min(HEIGHT - 2, Math.floor(t.pos[1] + (Math.floor(16 * Math.random()) - 8)));
      for (; i > 1 && !BLOCKS[e.getBlock(Math.floor(s), i - 1, Math.floor(o))].solid;) i--;
      const n = t.pos;
      if (
        ((t.pos = [s, i, o]),
        i > 1 && !t.collides(t.box()) && !IS_FLUID[e.getBlock(Math.floor(s), i, Math.floor(o))])
      )
        return (
          (t.prev = [...t.pos]),
          (t.vel = [0, 0, 0]),
          (t.fallDist = 0),
          void Sound.ev("item.chorus_fruit.teleport", t.pos, 1, 1)
        );
      t.pos = n;
    }
  }));
class ThrownPotion extends Entity {
  constructor(t, e, s, o, i, n, a) {
    (super(t, e, s, o, 0.25, 0.25), (this.vel = i), (this.owner = n), (this.stack = a));
  }
  drawSelf(t, e) {
    potionSprites(t, e, ITEMS[this.stack.id].key, this.stack.pot);
  }
  tick() {
    (this.savePrev(), this.age++);
    const t = this.game,
      e = this.vel,
      s = Math.max(1, Math.ceil(Math.hypot(e[0], e[1], e[2]) / 0.3));
    for (let o = 0; o < s; o++) {
      const o = this.pos[0] + e[0] / s,
        i = this.pos[1] + e[1] / s,
        n = this.pos[2] + e[2] / s;
      let a = !1;
      for (const e of t.entities) {
        if (
          e === this ||
          (e === this.owner && this.age < 5) ||
          !(e instanceof Living) ||
          e.deathTime > 0
        )
          continue;
        const t = e.box();
        if (o > t[0] && o < t[3] && i > t[1] && i < t[4] && n > t[2] && n < t[5]) {
          a = !0;
          break;
        }
      }
      const r = this.world.getBlock(Math.floor(o), Math.floor(i), Math.floor(n));
      if (
        (a ||
          !r ||
          !BLOCKS[r].solid ||
          (this.stack.pot && "water" !== this.stack.pot) ||
          this.dowse([Math.floor(o), Math.floor(i), Math.floor(n)]),
        a || (r && BLOCKS[r].solid) || i < -60)
      )
        return void this.splash();
      ((this.pos[0] = o), (this.pos[1] = i), (this.pos[2] = n));
    }
    ((e[0] *= 0.99), (e[1] = 0.99 * e[1] - 0.05), (e[2] *= 0.99));
  }
  dowse(t) {
    const e = this.game,
      s = this.world,
      o = [Math.floor(this.pos[0]), Math.floor(this.pos[1]), Math.floor(this.pos[2])];
    for (const [i, n, a] of [
      o,
      t,
      [o[0] + 1, o[1], o[2]],
      [o[0] - 1, o[1], o[2]],
      [o[0], o[1], o[2] + 1],
      [o[0], o[1], o[2] - 1],
    ]) {
      const t = s.getBlock(i, n, a),
        o = BLOCKS[t];
      171 === t || (o && "soul_fire" === o.key)
        ? (s.setBlock(i, n, a, 0, 0),
          Sound.ev("block.fire.extinguish", [i + 0.5, n + 0.5, a + 0.5], 0.5, 2.6))
        : o &&
            /(^|_)candle(_cake)?$/.test(o.key) &&
            "true" === Features.propOf(t, s.getMeta(i, n, a), "lit")
          ? (s.setBlock(i, n, a, t, Features.withProp(t, s.getMeta(i, n, a), "lit", "false")),
            Sound.ev("block.candle.extinguish", [i + 0.5, n + 0.5, a + 0.5], 1, 1))
          : e.dowseCampfire && e.dowseCampfire(i, n, a, "block.fire.extinguish");
    }
  }
  splash() {
    this.dead = !0;
    const t = this.game,
      e = this.stack.pot,
      s = POTIONS[e] || [],
      o = "lingering_potion" === ITEMS[this.stack.id].key,
      i = potionColor(e);
    for (let e = 0; e < 40; e++)
      t.particles.spawn(
        "effect",
        this.pos[0],
        this.pos[1],
        this.pos[2],
        0.5 * (Math.random() - 0.5),
        0.3 * Math.random(),
        0.5 * (Math.random() - 0.5),
        { col: i },
      );
    if ((Sound.ev("entity.splash_potion.break", this.pos, 1, 1), o))
      t.entities.push(new EffectCloud(t, this.pos[0], this.pos[1], this.pos[2], e, this.owner));
    else
      for (const e of t.entities.concat([t.player])) {
        if (!(e instanceof Living) || e.deathTime > 0) continue;
        const t = Math.hypot(
          e.pos[0] - this.pos[0],
          e.pos[1] + e.h / 2 - this.pos[1],
          e.pos[2] - this.pos[2],
        );
        if (t > 4) continue;
        const o = 1 - t / 4;
        for (const [t, i, n] of s)
          "instant_health" === t || "instant_damage" === t
            ? e.addEffect(t, n, 1)
            : i * o > 20 && e.addEffect(t, n, Math.floor(i * o));
      }
  }
}
class EffectCloud extends Entity {
  constructor(t, e, s, o, i, n) {
    (super(t, e, s, o, 6, 0.5),
      (this.pot = i),
      (this.owner = n),
      (this.radius = 3),
      (this.duration = 600),
      (this.waitTime = 10),
      (this.victims = new Map()),
      (this.col = potionColor(i)));
  }
  tick() {
    if ((this.savePrev(), this.age++, this.age - this.waitTime >= this.duration))
      return void (this.dead = !0);
    const t = this.game,
      e = this.age < this.waitTime,
      s = this.radius,
      [o, i, n] = this.pos;
    if (!e || Math.random() < 0.5)
      for (let a = 0, r = e ? 2 : Math.ceil((Math.PI * s * s) / 2); a < r; a++) {
        const a = Math.random() * Math.PI * 2,
          r = Math.sqrt(Math.random()) * (e ? 0.2 : s);
        t.particles.spawn(
          "effect",
          o + Math.cos(a) * r,
          i,
          n + Math.sin(a) * r,
          e ? 0 : 0.15 * (0.5 - Math.random()),
          e ? 0 : 0.01,
          e ? 0 : 0.15 * (0.5 - Math.random()),
          { col: this.col },
        );
      }
    if (e) return;
    if ((this.radius -= 3 / this.duration) < 0.5) return void (this.dead = !0);
    if (this.age % 5 || t.net) return;
    for (const [t, e] of this.victims) this.age >= e && this.victims.delete(t);
    const a = POTIONS[this.pot] || [];
    if (a.length)
      for (const e of [t.player, ...t.entities]) {
        if (!(e instanceof Living) || e.dead || e.deathTime > 0 || this.victims.has(e)) continue;
        if (!a.some(([t]) => !(("poison" === t || "regeneration" === t) && e.isUndead()))) continue;
        const t = e.box();
        if (!(
          t[4] < i ||
          t[1] > i + 0.5 ||
          (e.pos[0] - o) ** 2 + (e.pos[2] - n) ** 2 > this.radius ** 2
        )) {
          this.victims.set(e, this.age + 20);
          for (const [t, s, o] of a)
            "instant_health" === t || "instant_damage" === t
              ? e.instantEffect(t, o, 0.5)
              : e.addEffect(t, o, Math.floor(0.25 * s));
          if ((this.radius -= 0.5) < 0.5) return void (this.dead = !0);
        }
      }
    else this.victims.clear();
  }
  drawSelf() {}
}
function potionSprites(t, e, s, o) {
  const i = [e[0], e[1] + 0.125, e[2]];
  t.spriteList.push(
    { pos: i, size: 0.18, layer: T("i_potion_overlay"), col: potionColor(o) },
    { pos: i, size: 0.18, layer: T("i_" + s), front: 0.01 },
  );
}
function stackTint(t, e, s, o) {
  const i = e && e.tints && e.tints[s];
  if (!i) return null;
  const n = (i.type || "").replace("minecraft:", "");
  if ("potion" === n) return potionColor(o && o.pot);
  if ("dye" === n && o && null != o.color)
    return [(o.color >> 16) & 255, (o.color >> 8) & 255, 255 & o.color];
  const a = "firework" === n && o && o.fw && o.fw.colors;
  if (a && a.length) {
    const t = [0, 0, 0];
    for (const e of a) {
      const s = DYE_RGB[e] || 16777215;
      ((t[0] += (s >> 16) & 255), (t[1] += (s >> 8) & 255), (t[2] += 255 & s));
    }
    return t.map((t) => Math.round(t / a.length));
  }
  return t.itemTint(e.tints, s);
}
Game.prototype.throwPotion = function (t) {
  const e = this.player,
    s = this.lookDir();
  (this.entities.push(
    new ThrownPotion(
      this,
      e.pos[0],
      e.pos[1] + e.eye() - 0.1,
      e.pos[2],
      [0.5 * s[0], 0.5 * s[1] + 0.1, 0.5 * s[2]],
      e,
      { ...t, count: 1 },
    ),
  ),
    Sound.ev("entity.splash_potion.throw", e.pos, 0.5, 0.4 / (0.4 * Math.random() + 0.8)),
    "creative" !== this.mode && (t.count--, t.count || (e.inv.slots[e.inv.sel] = null)),
    e.swing());
};
const stackTinted = (t) =>
  !!(t.pot || null != t.color || (t.fw && t.fw.colors && t.fw.colors.length));
function drawEffectIcons(t, e) {
  const s = e && e.effects;
  if (!s || !s.size) return;
  const o = t.ctx,
    i = t.img;
  let n = 0,
    a = 0;
  for (const [e, r] of s) {
    const s = EFFECTS[e],
      h = i["eff_" + e];
    if (!h || r.hidden) continue;
    const c = s.kind < 0 ? 1 : 0,
      f = t.w - 25 * (c ? ++a : ++n),
      l = 1 + 26 * c,
      p = r.ambient ? i.effect_bg_ambient : i.effect_bg;
    p && o.drawImage(p, f, l);
    let d = 1;
    if (!r.ambient && r.dur >= 0 && r.dur <= 200) {
      const t = (r.dur / 10 / 5) * 0.5;
      d = clamp(
        t + Math.cos((r.dur * Math.PI) / 5) * clamp(((10 - r.dur / 20) / 10) * 0.25, 0, 0.25),
        0,
        1,
      );
    }
    ((o.globalAlpha = d), o.drawImage(h, f + 3, l + 3), (o.globalAlpha = 1));
  }
}
function potionLines(t, e) {
  const s = POTIONS[t.pot] || [];
  if (s.length)
    for (const [t, o, i] of s) {
      const s = Math.floor(o / 20),
        n = o > 1 ? ` (${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")})` : "";
      e.push({
        text: EFFECTS[t].cn + romanLevel(i) + n,
        color: EFFECTS[t].kind < 0 ? "#FF5555" : "#5555FF",
      });
    }
  else e.push({ text: "无效果", color: "#AAAAAA" });
}
Renderer.prototype.stackIcon = function (t, e) {
  const s = VM.ready && VM.data.items[ITEMS[t].key],
    o = s && void 0 !== s.m ? VM.data.models[s.m] : null;
  if (!(o && o.layers && o.layers.length && s.tints)) return null;
  const i =
      t +
      ":" +
      (e.pot || "") +
      ":" +
      (null != e.color ? e.color : "") +
      ":" +
      (e.fw && e.fw.colors ? e.fw.colors.join(",") : ""),
    n = this._stackIcons || (this._stackIcons = new Map());
  let a = n.get(i);
  if (a) return a;
  (n.size > 256 && n.delete(n.keys().next().value),
    (a = document.createElement("canvas")),
    (a.width = a.height = 16));
  const r = a.getContext("2d");
  return (
    o.layers.forEach((t, o) => {
      const i = stackTint(this, s, o, e),
        n = document.createElement("canvas");
      n.width = n.height = 16;
      const a = n.getContext("2d");
      if ((a.drawImage(this.stripCanvas, ...this.tileXY(T(t)), 16, 16, 0, 0, 16, 16), i)) {
        const t = a.getImageData(0, 0, 16, 16);
        for (let e = 0; e < 1024; e += 4)
          ((t.data[e] = (t.data[e] * i[0]) / 255),
            (t.data[e + 1] = (t.data[e + 1] * i[1]) / 255),
            (t.data[e + 2] = (t.data[e + 2] * i[2]) / 255));
        a.putImageData(t, 0, 0);
      }
      r.drawImage(n, 0, 0);
    }),
    n.set(i, a),
    a
  );
};
//# sourceURL=js/effects.js
