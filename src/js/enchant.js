"use strict";
const ENCH = {},
  ENCH_LIST = [];
for (const [t, e, n, o, i, s, r, a, l, c] of (self.RECIPE_DATA && RECIPE_DATA.enchantments) || []) {
  const h = {
    key: t,
    max: e,
    weight: n,
    anvil: o,
    minC: i,
    maxC: s,
    ex: new Set(l),
    treasure: c.includes("t"),
    curse: c.includes("c"),
    table: c.includes("e"),
    trade: c.includes("r"),
  };
  ((h.sup = new Set(itemIds(r))),
    (h.prim = a ? new Set(itemIds(a)) : h.sup),
    (ENCH[t] = h),
    ENCH_LIST.push(h));
}
const enchMinCost = (t, e) => t.minC[0] + t.minC[1] * (e - 1),
  enchMaxCost = (t, e) => t.maxC[0] + t.maxC[1] * (e - 1),
  enchCompatible = (t, e) => t !== e && !ENCH[t].ex.has(e) && !ENCH[e].ex.has(t);
function enchLevel(t, e) {
  if (!t || !t.e) return 0;
  for (const [n, o] of t.e) if (n === e) return o;
  return 0;
}
function armorEnch(t, e, n = [36, 37, 38, 39]) {
  let o = 0;
  for (const i of n) o = Math.max(o, enchLevel(t.inv.slots[i], e));
  return o;
}
const heldEnch = (t, e) => enchLevel(t.inv && t.inv.held, e),
  isBook = (t) => t && ITEMS[t.id] && "enchanted_book" === ITEMS[t.id].key;
function sameEnchants(t, e) {
  const n = t.e || [],
    o = e.e || [];
  return n.length === o.length && n.every(([t, n]) => enchLevel(e, t) === n);
}
class JRandom {
  constructor(t) {
    this.s = (0x5deece66dn ^ BigInt(t)) & ((1n << 48n) - 1n);
  }
  next(t) {
    return (
      (this.s = (0x5deece66dn * this.s + 0xbn) & ((1n << 48n) - 1n)),
      Number(BigInt.asIntN(32, this.s >> BigInt(48 - t)))
    );
  }
  nextInt(t) {
    if ((t & -t) === t) return Number((BigInt(t) * BigInt(this.next(31))) >> 31n);
    let e, n;
    do {
      ((e = this.next(31)), (n = e % t));
    } while (e - n + (t - 1) < 0 || e - n + (t - 1) > 2147483647);
    return n;
  }
  nextFloat() {
    return this.next(24) / (1 << 24);
  }
}
function enchantCost(t, e, n, o) {
  if (o <= 0) return 0;
  n = Math.min(n, 15);
  const i = t.nextInt(8) + 1 + (n >> 1) + t.nextInt(n + 1);
  return 0 === e
    ? Math.max(Math.floor(i / 3), 1)
    : 1 === e
      ? Math.floor((2 * i) / 3) + 1
      : Math.max(i, 2 * n);
}
function availableEnchants(t, e, n) {
  const o = "book" === ITEMS[e].key,
    i = [];
  for (const s of ENCH_LIST)
    if (("function" == typeof n ? n(s) : n || (s.table && !s.treasure)) && (o || s.prim.has(e)))
      for (let e = s.max; e >= 1; e--)
        if (t >= enchMinCost(s, e) && t <= enchMaxCost(s, e)) {
          i.push([s.key, e]);
          break;
        }
  return i;
}
function weightedPick(t, e) {
  let n = 0;
  for (const [t] of e) n += ENCH[t].weight;
  let o = t.nextInt(n);
  for (const t of e) if (((o -= ENCH[t[0]].weight), o < 0)) return t;
  return e[0];
}
function selectEnchants(t, e, n, o = !1) {
  const i = ITEMS[e].enchantability || ("book" === ITEMS[e].key ? 1 : 0),
    s = [];
  if (i <= 0) return s;
  n += 1 + t.nextInt(1 + (i >> 2)) + t.nextInt(1 + (i >> 2));
  const r = 0.15 * (t.nextFloat() + t.nextFloat() - 1);
  let a = availableEnchants((n = Math.max(1, Math.round(n + n * r))), e, o);
  if (!a.length) return s;
  for (s.push(weightedPick(t, a)); t.nextInt(50) <= n;) {
    const e = s[s.length - 1][0];
    if (((a = a.filter(([t]) => enchCompatible(t, e) && !s.some(([e]) => e === t))), !a.length))
      break;
    (s.push(weightedPick(t, a)), (n = Math.floor(n / 2)));
  }
  return s;
}
function enchantOffers(t, e, n) {
  if (!t || (t.e && t.e.length)) return [];
  const o = ITEMS[t.id];
  if (!(o.enchantability > 0 || "book" === o.key)) return [];
  const i = new JRandom(n);
  return [0, 1, 2]
    .map((t) => enchantCost(i, t, e, o.enchantability || 1))
    .map((e, i) => {
      if (e < i + 1) return null;
      const s = new JRandom(n + i),
        r = selectEnchants(s, t.id, e);
      return (
        "book" === o.key && r.length > 1 && r.splice(s.nextInt(r.length), 1),
        r.length ? { cost: e, clue: r[s.nextInt(r.length)], list: r } : null
      );
    });
}
function countBookshelves(t, e, n, o) {
  let i = 0;
  for (let s = -2; s <= 2; s++)
    for (let r = -2; r <= 2; r++)
      if (2 === Math.abs(s) || 2 === Math.abs(r))
        for (let a = 0; a <= 1; a++) {
          if (t.getBlock(e + s, n + a, o + r) !== BID.bookshelf) continue;
          const l = t.getBlock(e + Math.trunc(s / 2), n + a, o + Math.trunc(r / 2));
          (l && !REPLACEABLE[l]) || i++;
        }
  return i;
}
function anvilResult(t, e, n, o) {
  if (!t) return null;
  const i = ITEMS[t.id],
    s = { ...t, e: t.e ? t.e.map((t) => [...t]) : void 0 };
  let r = 0,
    a = 0,
    l = 0;
  const c = (t.rc || 0) + ((e && e.rc) || 0);
  if (e) {
    const n = isBook(e);
    if (i.durability && i.repair && itemIds(i.repair).includes(e.id)) {
      let n = Math.min(t.dmg || 0, Math.floor(i.durability / 4));
      if (n <= 0) return null;
      let o = 0;
      for (; n > 0 && o < e.count; o++)
        ((s.dmg -= n), r++, (n = Math.min(s.dmg, Math.floor(i.durability / 4))));
      l = o;
    } else {
      if (!(n || (e.id === t.id && i.durability) || (isBook(t) && n))) return null;
      if (i.durability && !n) {
        const n = i.durability - (t.dmg || 0),
          o = i.durability - (e.dmg || 0) + Math.floor((12 * i.durability) / 100),
          a = Math.max(0, i.durability - (n + o));
        a < (s.dmg || 0) && ((s.dmg = a), (r += 2));
      }
      let a = !1,
        l = !1;
      for (const [i, c] of e.e || []) {
        const e = ENCH[i];
        if (!e) continue;
        const h = enchLevel(s, i);
        let u = h === c ? c + 1 : Math.max(h, c),
          f = o || isBook(t) || e.sup.has(t.id);
        for (const [t] of s.e || []) t === i || enchCompatible(t, i) || ((f = !1), r++);
        if (!f) {
          l = !0;
          continue;
        }
        ((a = !0),
          (u = Math.min(u, e.max)),
          (s.e = (s.e || []).filter(([t]) => t !== i)),
          s.e.push([i, u]));
        let d = e.anvil;
        (n && (d = Math.max(1, d >> 1)), (r += d * u), t.count > 1 && (r = 40));
      }
      if (l && !a) return null;
    }
  }
  if (null != n) {
    const e = n.trim();
    e && e !== (t.name || i.cn)
      ? ((a = 1), (r += 1), (s.name = e))
      : !e && t.name && ((a = 1), (r += 1), delete s.name);
  }
  if (r <= 0) return null;
  let h = c + r;
  if ((a === r && a > 0 && h >= 40 && (h = 39), h >= 40 && !o))
    return { tooExpensive: !0, cost: h };
  s.e && !s.e.length && delete s.e;
  let u = Math.max(s.rc || 0, (e && e.rc) || 0);
  return ((a === r && 0 !== a) || (u = 2 * u + 1), (s.rc = u), { stack: s, cost: h, used: l });
}
function grindstoneResult(t, e) {
  if (!t && !e) return null;
  if (t && e) {
    if (t.id !== e.id || !ITEMS[t.id].durability || t.count > 1 || e.count > 1) return null;
    const n = ITEMS[t.id].durability,
      o = n - (t.dmg || 0) + (n - (e.dmg || 0)) + Math.floor((5 * n) / 100),
      i = { id: t.id, count: 1, dmg: Math.max(0, n - o) },
      s = [...(t.e || []), ...(e.e || [])].filter(([t]) => ENCH[t] && ENCH[t].curse),
      r = [];
    for (const [t, e] of s) r.some(([e]) => e === t) || r.push([t, e]);
    return (r.length && (i.e = r), finishGrind(i));
  }
  const n = t || e;
  if (!n.e || !n.e.some(([t]) => ENCH[t] && !ENCH[t].curse)) return null;
  const o = { ...n, count: 1, e: n.e.filter(([t]) => ENCH[t] && ENCH[t].curse) };
  return (
    isBook(n) && !o.e.length && ((o.id = ITEM_KEY.book), delete o.e),
    o.e && !o.e.length && delete o.e,
    finishGrind(o)
  );
}
function finishGrind(t) {
  let e = 0;
  for (let n = 0; n < (t.e || []).length; n++) e = 2 * e + 1;
  return (e ? (t.rc = e) : delete t.rc, t);
}
function grindstoneXp(...t) {
  let e = 0;
  for (const n of t)
    if (n)
      for (const [t, o] of n.e || []) ENCH[t] && !ENCH[t].curse && (e += enchMinCost(ENCH[t], o));
  if (!e) return 0;
  const n = Math.ceil(e / 2);
  return n + Math.floor(Math.random() * n);
}
function unbreakingSkips(t, e) {
  const n = enchLevel(t, "unbreaking");
  return !!n && (e ? Math.random() >= 0.6 + 0.4 / (n + 1) : Math.random() >= 1 / (n + 1));
}
function protectionPoints(t, e) {
  const n = e && e.type;
  if ("void" === n || "starve" === n) return 0;
  let o = 0;
  for (let e = 36; e < 40; e++) {
    const i = t.inv.slots[e];
    if (i && i.e)
      for (const [t, e] of i.e)
        "protection" === t
          ? (o += e)
          : "fire_protection" !== t ||
              ("fire" !== n && "lava" !== n && "fireball" !== n && "hotFloor" !== n)
            ? "blast_protection" === t && "explosion" === n
              ? (o += 2 * e)
              : "projectile_protection" !== t ||
                  ("arrow" !== n && "fireball" !== n && "trident" !== n)
                ? "feather_falling" === t && "fall" === n && (o += 3 * e)
                : (o += 2 * e)
            : (o += 2 * e);
  }
  return Math.min(o, 20);
}
const UNDEAD = new Set([
    "zombie",
    "skeleton",
    "zombified_piglin",
    "wither_skeleton",
    "husk",
    "stray",
    "drowned",
    "zombie_villager",
    "phantom",
    "wither",
    "zoglin",
    "skeleton_horse",
    "zombie_horse",
    "bogged",
  ]),
  ARTHROPOD = new Set(["spider", "cave_spider", "bee", "silverfish", "endermite"]);
function enchantAttackBonus(t, e) {
  let n = 0;
  const o = e && e.type,
    i = enchLevel(t, "sharpness");
  i && (n += 0.5 * i + 0.5);
  const s = enchLevel(t, "smite");
  s && UNDEAD.has(o) && (n += 2.5 * s);
  const r = enchLevel(t, "bane_of_arthropods");
  return (r && ARTHROPOD.has(o) && (n += 2.5 * r), n);
}
function fortuneCount(t, e) {
  if (!e) return t;
  return t * (Math.max(0, Math.floor(Math.random() * (e + 2)) - 1) + 1);
}
function cropBonusCount(t, e) {
  let n = 1;
  for (let o = 0, i = 3 + enchLevel(e, "fortune"); o < i; o++) t() < 0.5714286 && n++;
  return n;
}
const NO_SILK = new Set([
    "spawner",
    "budding_amethyst",
    "reinforced_deepslate",
    "farmland",
    "dirt_path",
    "frosted_ice",
    "trial_spawner",
    "vault",
    "small_dripleaf",
    "hanging_roots",
    "seagrass",
    "vine",
    "glow_lichen",
    "nether_sprouts",
    "sculk_vein",
    "short_grass",
    "fern",
    "tall_grass",
    "large_fern",
    "dead_bush",
    ...WOOLS.map(([t]) => t + "_wool"),
  ]),
  _ctItems = creativeTabItems;
creativeTabItems = function (t) {
  const e = creativeTabItems.cache || (creativeTabItems.cache = {});
  if (!e[t] && ((e[t] = _ctItems.call(this, t)), "ingredients" === t)) {
    const n = e[t].indexOf("enchanted_book");
    n >= 0 &&
      e[t].splice(
        n,
        1,
        ...ENCH_LIST.flatMap((t) =>
          Array.from({ length: t.max }, (e, n) => ({ key: "enchanted_book", e: [[t.key, n + 1]] })),
        ),
      );
  }
  return e[t];
};
const SOUL_SPEED_BLOCKS = new Set(["soul_sand", "soul_soil"]);
((Player.prototype.speedBonus = function () {
  const t = enchLevel(this.inv.slots[39], "soul_speed");
  if (!t || this.vehicle || this.flying) return ((this.soulSpeedOn = !1), 0);
  const e =
    BLOCKS[
      this.world.getBlock(
        Math.floor(this.pos[0]),
        Math.floor(this.pos[1] - 0.5),
        Math.floor(this.pos[2]),
      )
    ];
  return (
    (this.soulSpeedOn = this.onGround
      ? !(!e || !SOUL_SPEED_BLOCKS.has(e.key))
      : !!this.soulSpeedOn),
    this.soulSpeedOn ? 0.0405 + 0.0105 * (t - 1) : 0
  );
}),
  (Player.prototype.sneakSpeed = function () {
    return Math.min(1, 0.3 + 0.15 * enchLevel(this.inv.slots[38], "swift_sneak"));
  }),
  (Player.prototype.waterEfficiency = function () {
    return Math.min(1, enchLevel(this.inv.slots[39], "depth_strider") / 3);
  }),
  (() => {
    const t = Player.prototype.tick;
    Player.prototype.tick = function (e) {
      const n = t.call(this, e),
        o = this.game;
      if (o.net || this.deathTime > 0) return n;
      const i = this.inv.slots[39];
      this.soulSpeedOn &&
        this.onGround &&
        i &&
        Math.abs(this.pos[0] - this.prev[0]) + Math.abs(this.pos[2] - this.prev[2]) > 0.01 &&
        (Math.random() < 0.04 &&
          !this.creative &&
          ITEMS[i.id].durability &&
          !unbreakingSkips(i, !0) &&
          ((i.dmg = (i.dmg || 0) + 1),
          i.dmg >= ITEMS[i.id].durability &&
            ((this.inv.slots[39] = null),
            Sound.ev("entity.item.break", this.pos, 0.8, 0.8 + 0.4 * Math.random()))),
        Math.random() < 0.3 &&
          (o.particles.spawn(
            "soul",
            this.pos[0] + (Math.random() - 0.5) * this.w,
            this.pos[1] + 0.1,
            this.pos[2] + (Math.random() - 0.5) * this.w,
            0.2 * -this.vel[0],
            0.1,
            0.2 * -this.vel[2],
          ),
          Sound.ev(
            "particle.soul_escape",
            this.pos,
            0.6 + 0.4 * Math.random(),
            0.6 + 0.4 * Math.random(),
          )));
      const s = enchLevel(i, "frost_walker");
      if (
        s &&
        this.onGround &&
        !this.vehicle &&
        (this.pos[0] !== this.prev[0] || this.pos[2] !== this.prev[2])
      ) {
        const t = this.world,
          e = Math.min(16, s - 1 + 3),
          n = Math.floor(this.pos[1]) - 1,
          i = Math.floor(this.pos[0]),
          r = Math.floor(this.pos[2]),
          a = BID.frosted_ice;
        if (void 0 !== a)
          for (let s = i - e; s <= i + e; s++)
            for (let i = r - e; i <= r + e; i++)
              (s + 0.5 - this.pos[0]) ** 2 + (i + 0.5 - this.pos[2]) ** 2 >= e * e ||
                0 !== t.getBlock(s, n + 1, i) ||
                t.getBlock(s, n, i) !== WATER ||
                0 !== t.getMeta(s, n, i) ||
                (t.isWaterlogged && t.isWaterlogged(s, n, i)) ||
                o.entities.some(
                  (t) =>
                    t instanceof Living &&
                    !t.dead &&
                    Math.floor(t.pos[0]) === s &&
                    Math.floor(t.pos[2]) === i &&
                    Math.floor(t.pos[1]) === n,
                ) ||
                (t.setBlock(s, n, i, a, 0),
                (o.frostedIce || (o.frostedIce = new Map())).set(
                  `${s},${n},${i}`,
                  o.tickCount + randInt(60, 120),
                ));
      }
      return n;
    };
    const e = Player.prototype.hurt;
    Player.prototype.hurt = function (t, n) {
      return (
        (!n || "hotFloor" !== n.type || !enchLevel(this.inv.slots[39], "frost_walker")) &&
        e.call(this, t, n)
      );
    };
    const n = Game.prototype.tick;
    Game.prototype.tick = function () {
      const t = n.call(this),
        e = this.frostedIce;
      if (
        !e ||
        !e.size ||
        this.net ||
        "play" !== this.state ||
        (this.ui.screen && this.ui.screen.pauses)
      )
        return t;
      const o = this.world,
        i = BID.frosted_ice;
      for (const [t, n] of e) {
        if (n > this.tickCount) continue;
        const [s, r, a] = t.split(",").map(Number);
        if (o.getBlock(s, r, a) !== i) {
          e.delete(t);
          continue;
        }
        let l = 0;
        for (const [t, e] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ])
          o.getBlock(s + t, r, a + e) === i && l++;
        const c = +(Features.propOf(i, o.getMeta(s, r, a), "age") || 0),
          h = o.getLight(s, r + 1, a),
          u = Math.max(
            15 & h,
            (h >> 4) - (this.daylight ? Math.round(11 * (1 - this.daylight())) : 0),
          );
        (0 === randInt(0, 2) || l < 4) && u > 11 - c - 1
          ? c < 3
            ? (o.setBlock(
                s,
                r,
                a,
                i,
                Features.withProp(i, o.getMeta(s, r, a), "age", String(c + 1)),
              ),
              e.set(t, this.tickCount + randInt(20, 40)))
            : (o.setBlock(s, r, a, WATER, 0), e.delete(t))
          : e.set(t, this.tickCount + randInt(20, 40));
      }
      return t;
    };
  })(),
  (() => {
    const t = Game.prototype.attack;
    Game.prototype.attack = function (e) {
      const n = this.player,
        o = n.inv.held,
        i = o && ITEMS[o.id],
        s = !(!i || !i.tool || "sword" !== i.tool.type),
        r = this.attackStrength(),
        a = Math.hypot(n.pos[0] - n.prev[0], n.pos[2] - n.prev[2]),
        l = r > 0.9 && n.vel[1] < -0.05 && !n.onGround && !n.inWater,
        c =
          s &&
          r > 0.9 &&
          !l &&
          !n.sprinting &&
          n.onGround &&
          a < 0.1 &&
          !this.net &&
          e instanceof Living,
        h =
          Math.max(0, (i && i.attack ? i.attack : 1) + effectAttackBonus(n)) * (0.2 + r * r * 0.8);
      let u;
      this.sweepHit = c;
      try {
        u = t.call(this, e);
      } finally {
        this.sweepHit = !1;
      }
      if (!c || !u) return u;
      const f = enchLevel(o, "sweeping_edge"),
        d = 1 + (f / (f + 1)) * h,
        p = e.box();
      for (const t of this.entities) {
        if (
          t === e ||
          t === n ||
          !(t instanceof Living) ||
          t.dead ||
          t.deathTime > 0 ||
          t.isVehicle
        )
          continue;
        if (t.owner === n) continue;
        const i = t.box();
        i[3] < p[0] - 1 ||
          i[0] > p[3] + 1 ||
          i[4] < p[1] - 0.25 ||
          i[1] > p[4] + 0.25 ||
          i[5] < p[2] - 1 ||
          i[2] > p[5] + 1 ||
          (t.pos[0] - n.pos[0]) ** 2 + (t.pos[1] - n.pos[1]) ** 2 + (t.pos[2] - n.pos[2]) ** 2 >=
            9 ||
          t.hurt(d + enchantAttackBonus(o, t) * r, {
            type: "player",
            attacker: n,
            player: !0,
            knockFrom: n.pos,
            knock: 0.4,
            looting: heldEnch(n, "looting"),
          });
      }
      return (
        Sound.ev("entity.player.attack.sweep", n.pos, 1, 1),
        this.particles.spawn(
          "sweep",
          n.pos[0] - Math.sin(n.yaw),
          n.pos[1] + 0.5 * n.eye(),
          n.pos[2] - Math.cos(n.yaw),
          0,
          0,
          0,
        ),
        u
      );
    };
  })());
//# sourceURL=js/enchant.js
