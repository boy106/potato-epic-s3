"use strict";
const Loot = (function () {
  const strip = (t) => ("string" == typeof t ? t.replace("minecraft:", "") : t),
    num = (t, o) => {
      if (void 0 === t) return 1;
      if ("number" == typeof t) return t;
      const n = strip(t.type || "uniform");
      if ("constant" === n) return t.value;
      if ("uniform" === n) return num(t.min, o) + o() * (num(t.max, o) - num(t.min, o));
      if ("binomial" === n) {
        let n = 0;
        const e = num(t.n, o),
          s = num(t.p, o);
        for (let t = 0; t < e; t++) o() < s && n++;
        return n;
      }
      return 1;
    },
    condOk = (t, o) =>
      !t ||
      t.every((t) => {
        const n = strip(t.condition);
        return "random_chance" === n
          ? o() < ("number" == typeof t.chance ? t.chance : num(t.chance, o))
          : "inverted" !== n || !condOk([t.term], o);
      }),
    itemId = (t) => (
      (t = strip(t)),
      void 0 !== ITEM_KEY[t] ? ITEM_KEY[t] : void 0 !== BID[t] && ITEMS[BID[t]] ? BID[t] : null
    );
  function applyFns(t, o, n) {
    for (const e of o || []) {
      if (!condOk(e.conditions, n)) continue;
      const o = strip(e.function);
      "set_count" === o
        ? (t.count = Math.max(0, Math.floor(e.add ? t.count + num(e.count, n) : num(e.count, n))))
        : "set_damage" === o && ITEMS[t.id] && ITEMS[t.id].durability
          ? (t.dmg = Math.floor(ITEMS[t.id].durability * (1 - num(e.damage, n))))
          : "set_potion" === o && e.id && (t.pot = strip(e.id));
    }
    return t;
  }
  function expand(t, o, n) {
    if (!condOk(t.conditions, o)) return !1;
    switch (strip(t.type)) {
      case "item": {
        const e = itemId(t.name);
        if (null !== e) {
          const s = applyFns({ id: e, count: 1, dmg: 0 }, t.functions, o);
          s.count > 0 && n.push(s);
        }
        return !0;
      }
      case "empty":
        return !0;
      case "loot_table": {
        const e = "string" == typeof t.value ? strip(t.value) : null;
        return (e && n.push(...roll(e, o)), !0);
      }
      case "alternatives":
        for (const e of t.children || []) if (expand(e, o, n)) return !0;
        return !1;
      case "group":
        for (const e of t.children || []) expand(e, o, n);
        return !0;
      case "sequence":
        for (const e of t.children || []) if (!expand(e, o, n)) return !1;
        return !0;
    }
    return !0;
  }
  function roll(t, o) {
    const n = self.STRUCT_DATA && self.STRUCT_DATA.loot[strip(t)],
      e = [];
    if (!n) return e;
    for (const t of n.pools || []) {
      if (!condOk(t.conditions, o)) continue;
      const n = Math.floor(num(t.rolls, o));
      for (let s = 0; s < n; s++) {
        const n = t.entries.filter((t) => condOk(t.conditions, () => 0.5));
        let s = 0;
        for (const t of n) s += t.weight ?? 1;
        if (!s) continue;
        let r = o() * s,
          i = n[0];
        for (const t of n)
          if (((r -= t.weight ?? 1), r < 0)) {
            i = t;
            break;
          }
        const l = [];
        expand(i, o, l);
        for (const n of l) e.push(applyFns(n, t.functions, o));
      }
    }
    for (const t of e) applyFns(t, n.functions, o);
    return e.filter((t) => t.count > 0);
  }
  return {
    roll: roll,
    fill: function fill(t, o, n) {
      const e = roll(o, n),
        s = [];
      for (let o = 0; o < t.length; o++) t[o] || s.push(o);
      for (let t = s.length - 1; t > 0; t--) {
        const o = Math.floor(n() * (t + 1));
        [s[t], s[o]] = [s[o], s[t]];
      }
      const r = [];
      for (const t of e) {
        const o = maxStack(t.id);
        for (; t.count > o;) (r.push({ ...t, count: o }), (t.count -= o));
        r.push(t);
      }
      for (; r.length < s.length;) {
        const t = r.filter((t) => t.count > 1);
        if (!t.length) break;
        const o = t[Math.floor(n() * t.length)],
          e = 1 + Math.floor(n() * (o.count / 2));
        ((o.count -= e), r.push({ ...o, count: e }));
      }
      for (let t = r.length - 1; t > 0; t--) {
        const o = Math.floor(n() * (t + 1));
        [r[t], r[o]] = [r[o], r[t]];
      }
      for (const o of r) {
        if (!s.length) break;
        t[s.pop()] = o;
      }
    },
    itemId: itemId,
  };
})();
((Game.prototype.structureExtras = function (t, o) {
  const n = this.world,
    e = t.sx,
    s = n.minY || 0;
  if (((t.sx = null), o)) return;
  const stackOf = ([t, o, , n]) => {
    const e = Loot.itemId(t);
    if (null === e) return null;
    const s = { id: e, count: o || 1, dmg: 0 };
    return (n && (s.pot = n), s);
  };
  for (const [o, n, r, i, l] of e.loot) {
    const e = n - s,
      c = (e << 8) | ((15 & r) << 4) | (15 & o),
      u = t.getB(c),
      f = BLOCKS[u];
    if (!f) continue;
    const a = `${o},${e},${r}`,
      p = "chest" === f.key || "barrel" === f.key || "trapped_chest" === f.key;
    if ("loot" === i && p)
      (this.blockEntities.has(a) ||
        this.blockEntities.set(a, {
          type: "chest",
          pos: [o, e, r],
          slots: new Array(27).fill(null),
          loot: l,
        }),
        "chest" === f.key && t.setM(c, 8 | t.getM(c)));
    else {
      if (this.blockEntities.has(a)) continue;
      if ("loot" !== i || ("dispenser" !== f.key && "dropper" !== f.key)) {
        if ("loot" === i && "decorated_pot" === f.key)
          this.blockEntities.set(a, { type: "pot", pos: [o, e, r], loot: l });
        else if ("items" === i && Array.isArray(l)) {
          let t = null;
          if (
            (p
              ? (t = { type: "chest", pos: [o, e, r], slots: new Array(27).fill(null) })
              : "dispenser" === f.key || "dropper" === f.key || "hopper" === f.key
                ? (t = {
                    type: f.key,
                    pos: [o, e, r],
                    slots: new Array("hopper" === f.key ? 5 : 9).fill(null),
                    cd: 0,
                  })
                : "brewing_stand" === f.key
                  ? (t = {
                      type: "brewing",
                      pos: [o, e, r],
                      bottles: [null, null, null],
                      ingredient: null,
                      fuel: null,
                      fuelLeft: 0,
                      brewTime: 0,
                    })
                  : /^(furnace|smoker|blast_furnace)$/.test(f.key) &&
                    (t = {
                      type: "furnace",
                      pos: [o, e, r],
                      input: null,
                      fuel: null,
                      output: null,
                      burn: 0,
                      burnMax: 0,
                      cook: 0,
                    }),
            !t)
          )
            continue;
          for (const o of l) {
            const n = stackOf(o),
              e = o[2] || 0;
            n &&
              (t.slots
                ? e < t.slots.length && (t.slots[e] = n)
                : t.bottles
                  ? e < 3
                    ? (t.bottles[e] = n)
                    : 3 === e
                      ? (t.ingredient = n)
                      : 4 === e && (t.fuel = n)
                  : (t[["input", "fuel", "output"][e] || "output"] = n));
          }
          this.blockEntities.set(a, t);
        }
      } else {
        const t = { type: f.key, pos: [o, e, r], slots: new Array(9).fill(null), cd: 0, loot: l };
        (this.blockEntities.set(a, t), this.fillLoot(t, o, e, r));
      }
    }
    if ("spawner" === i && "spawner" === f.key && "string" == typeof l) {
      const t = `${o},${e},${r}`;
      this.blockEntities.has(t) ||
        this.blockEntities.set(t, { type: "spawner", pos: [o, e, r], mob: l });
    }
  }
  e.ent.length && (t.modified = !0);
  for (const [t, o, n, r, i] of e.ent) {
    const e = "minecart:chest" === r && "undefined" != typeof Minecart;
    if (!MOB_TYPES[r] && !e) continue;
    const l = createMob(this, r, t, o - s, n);
    l &&
      ((l.persistent = !0),
      e && i && i.loot && (l.loot = i.loot),
      i && i.profession && (l.profession = i.profession),
      i && i.type && (l.vtype = i.type),
      this.entities.push(l));
  }
}),
  (Game.prototype.structureFeatures = function (t, o, n, e) {
    if (t.sx && t.sx.feat) for (const [s, r, i, l] of t.sx.feat) e(o, l, n, [s, r, i], l);
  }),
  (Game.prototype.nearestStructure = function (t, o, n) {
    let e = null,
      s = 1 / 0;
    for (const r of (this.world.structRefs || new Map()).values()) {
      if (t && !r.name.startsWith(t)) continue;
      const i = (r.box[0] + r.box[3]) / 2,
        l = (r.box[2] + r.box[5]) / 2,
        c = Math.hypot(i - o, l - n);
      c < s && ((s = c), (e = { name: r.name, x: Math.round(i), z: Math.round(l), d: c }));
    }
    return e;
  }));
//# sourceURL=js/structures.js
