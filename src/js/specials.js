"use strict";
const STAR_SHAPE = { fire_charge: "large_ball", gold_nugget: "star", feather: "burst" },
  isHead = (t) => /_(head|skull)$/.test(t),
  DYE_RGB_ARR = (t) => DYE_RGB[t] || 16777215;
function specialRecipe(t) {
  const e = t
    .map((t, e) => (t ? { s: t, i: e, k: ITEMS[t.id] ? ITEMS[t.id].key : "" } : null))
    .filter(Boolean);
  if (!e.length) return null;
  const by = (t) => e.filter((e) => t.test(e.k)),
    s = by(/_dye$/);
  if (2 === e.length) {
    const t = e.find((t) => "shield" === t.k),
      s = e.find((t) => /_banner$/.test(t.k));
    if (t && s && !t.s.base)
      return {
        result: {
          ...t.s,
          count: 1,
          base: s.k.replace(/_banner$/, ""),
          patterns: (s.s.patterns || []).map((t) => [...t]),
        },
      };
    const o = by(/_banner$/);
    if (2 === o.length && o[0].k === o[1].k) {
      const t = o.find((t) => t.s.patterns && t.s.patterns.length),
        e = o.find((t) => !(t.s.patterns && t.s.patterns.length));
      if (t && e) return { result: { ...t.s, count: 1 }, keep: t.i };
    }
  }
  const o = e.find((t) => "written_book" === t.k),
    n = by(/^writable_book$/);
  if (o && n.length && n.length + 1 === e.length && (0 | o.s.gen) < 2)
    return { result: { ...o.s, count: n.length, gen: 1 + (0 | o.s.gen) }, keep: o.i };
  const i = e.find((t) => "filled_map" === t.k),
    r = by(/^map$/);
  if (i && r.length && r.length + 1 === e.length)
    return { result: { ...i.s, count: r.length + 1 } };
  if (
    9 === e.length &&
    "lingering_potion" === e[4].k &&
    8 === e.filter((t) => "arrow" === t.k).length
  )
    return { result: { ...makeStack("tipped_arrow", 8), pot: t[4].pot } };
  const a = by(/^gunpowder$/);
  if (1 === a.length && s.length && !e.some((t) => "paper" === t.k || "firework_star" === t.k)) {
    const t = e.filter((t) => STAR_SHAPE[t.k] || isHead(t.k)),
      o = e.filter(
        (t) =>
          !/_dye$/.test(t.k) &&
          "gunpowder" !== t.k &&
          !STAR_SHAPE[t.k] &&
          !isHead(t.k) &&
          "diamond" !== t.k &&
          "glowstone_dust" !== t.k,
      );
    if (
      t.length <= 1 &&
      !o.length &&
      by(/^diamond$/).length <= 1 &&
      by(/^glowstone_dust$/).length <= 1
    ) {
      const e = t[0] ? STAR_SHAPE[t[0].k] || "creeper" : "small_ball";
      return {
        result: {
          ...makeStack("firework_star", 1),
          fw: {
            shape: e,
            colors: s.map((t) => t.k.replace(/_dye$/, "")),
            fade: [],
            trail: !!by(/^diamond$/).length,
            twinkle: !!by(/^glowstone_dust$/).length,
          },
        },
      };
    }
  }
  const l = e.filter((t) => "firework_star" === t.k);
  if (1 === l.length && s.length && s.length + 1 === e.length && l[0].s.fw)
    return {
      result: {
        ...l[0].s,
        count: 1,
        fw: { ...l[0].s.fw, fade: s.map((t) => t.k.replace(/_dye$/, "")) },
      },
    };
  const c = by(/^paper$/);
  if (
    1 === c.length &&
    a.length >= 1 &&
    a.length <= 3 &&
    c.length + a.length + l.length === e.length
  )
    return {
      result: {
        ...makeStack("firework_rocket", 3),
        flight: a.length,
        explosions: l.map((t) => t.s.fw).filter(Boolean),
      },
    };
  const h = e.filter((t) =>
    /^leather_(helmet|chestplate|leggings|boots|horse_armor)$|^wolf_armor$/.test(t.k),
  );
  if (1 === h.length && s.length && s.length + 1 === e.length) {
    const t = s.map((t) => DYE_RGB_ARR(t.k.replace(/_dye$/, "")));
    null != h[0].s.color && t.push(h[0].s.color);
    let e = 0,
      o = 0,
      n = 0,
      i = 0;
    for (const s of t) {
      const t = (s >> 16) & 255,
        r = (s >> 8) & 255,
        a = 255 & s;
      ((i += Math.max(t, r, a)), (e += t), (o += r), (n += a));
    }
    const r = t.length;
    ((e /= r), (o /= r), (n /= r));
    const a = i / r,
      l = Math.max(e, o, n) || 1;
    return (
      (e = (e * a) / l),
      (o = (o * a) / l),
      (n = (n * a) / l),
      {
        result: {
          ...h[0].s,
          count: 1,
          color: (Math.round(e) << 16) | (Math.round(o) << 8) | Math.round(n),
        },
      }
    );
  }
  return null;
}
function shieldTex(t, e) {
  if (e && (e.base || (e.patterns && e.patterns.length))) {
    const s = t.patternTex("shield", e.base || "white", e.patterns);
    if (s) return s;
  }
  return t.beTex("shield_base");
}
((() => {
  const t = CraftingScreen.prototype.changed;
  CraftingScreen.prototype.changed = function () {
    if ((t.call(this), (this.specialKeep = null), this.result && !this.result.unk)) {
      if ("decorated_pot" === ITEMS[this.result.id].key) {
        const at = (t) => this.grid[t] && ITEMS[this.grid[t].id].key,
          t = 3 === this.size ? [at(1), at(3), at(5), at(7)] : null;
        t &&
          t.some((t) => t && /_pottery_sherd$/.test(t)) &&
          (this.result = {
            ...this.result,
            sherds: t.map((t) => (t && /_pottery_sherd$/.test(t) ? t : "brick")),
          });
      }
      return;
    }
    const e = specialRecipe(this.grid);
    e &&
      ((this.result = e.result),
      void 0 !== e.keep && (this.specialKeep = [e.keep, { ...this.grid[e.keep] }]));
  };
  const e = CraftingScreen.prototype.consume;
  CraftingScreen.prototype.consume = function () {
    const t = this.specialKeep;
    (e.call(this),
      t && !this.grid[t[0]]
        ? ((this.grid[t[0]] = t[1]), this.changed())
        : t &&
          this.grid[t[0]] &&
          sameKind(this.grid[t[0]], t[1]) &&
          (this.grid[t[0]].count++, this.changed()));
  };
  const s = UI.prototype.itemLines;
  UI.prototype.itemLines = function (t) {
    const e = s.call(this, t),
      o = {
        small_ball: "小型球状",
        large_ball: "大型球状",
        star: "星形",
        creeper: "苦力怕状",
        burst: "爆裂状",
      },
      fwLines = (t, s) => {
        (e.push({ text: s + (o[t.shape] || t.shape), color: "#AAAAAA" }),
          t.colors &&
            t.colors.length &&
            e.push({
              text:
                s +
                " " +
                t.colors.map((t) => zhT("item.minecraft.firework_star." + t, t)).join("、"),
              color: "#AAAAAA",
            }),
          t.fade &&
            t.fade.length &&
            e.push({
              text:
                s +
                " 淡化成" +
                t.fade.map((t) => zhT("item.minecraft.firework_star." + t, t)).join("、"),
              color: "#AAAAAA",
            }),
          t.trail && e.push({ text: s + " 踪迹", color: "#AAAAAA" }),
          t.twinkle && e.push({ text: s + " 闪烁", color: "#AAAAAA" }));
      };
    if ((t.fw && fwLines(t.fw, ""), t.flight)) {
      e.push({ text: "飞行时间：" + t.flight, color: "#AAAAAA" });
      for (const e of t.explosions || []) fwLines(e, "  ");
    }
    if (
      (null != t.color &&
        ITEMS[t.id] &&
        /leather|wolf_armor/.test(ITEMS[t.id].key) &&
        e.push({ text: "已染色", color: "#AAAAAA" }),
      t.sherds)
    )
      for (const s of t.sherds)
        e.push({ text: ITEMS[ITEM_KEY[s]] ? ITEMS[ITEM_KEY[s]].cn : s, color: "#AAAAAA" });
    return e;
  };
})(),
  (() => {
    if ("undefined" == typeof FireworkRocket) return;
    const t = FireworkRocket.prototype.tick;
    FireworkRocket.prototype.tick = function () {
      const e = this.dead,
        s = this.stackRef && this.stackRef.explosions;
      if (
        !s ||
        !s.length ||
        e ||
        !(
          this.age + 1 >= this.life ||
          (!this.shot &&
            this.world.getBlock(
              Math.floor(this.pos[0]),
              Math.floor(this.pos[1]),
              Math.floor(this.pos[2]),
            ))
        )
      )
        return t.call(this);
      ((this.dead = !0),
        Sound.ev(
          s.some((t) => "large_ball" === t.shape)
            ? "entity.firework_rocket.large_blast"
            : "entity.firework_rocket.blast",
          this.pos,
          3,
          1,
        ));
      for (const t of s) {
        const e = (t.colors || ["white"]).map((t) => {
            const e = DYE_RGB[t] || 16777215;
            return [(e >> 16) & 255, (e >> 8) & 255, 255 & e];
          }),
          s = "large_ball" === t.shape ? 120 : 60,
          o = "large_ball" === t.shape ? 0.5 : 0.25;
        for (let n = 0; n < s; n++) {
          let s = Math.random() * Math.PI * 2,
            i = Math.acos(2 * Math.random() - 1),
            r = o;
          "star" === t.shape && n % 2 && (r *= 0.5);
          const a = this.game.particles.spawn(
            "glint",
            ...this.pos,
            Math.sin(i) * Math.cos(s) * r,
            Math.cos(i) * r,
            Math.sin(i) * Math.sin(s) * r,
          );
          a &&
            ((a.col = e[n % e.length]),
            (a.life = 30 + 20 * Math.random()),
            (a.size = 0.12),
            (a.grav = 0.003));
        }
        t.twinkle && Sound.ev("entity.firework_rocket.twinkle", this.pos, 3, 1);
      }
      this.blastDamage && this.blastDamage();
    };
    const e = Game.prototype.use;
    Game.prototype.use = function () {
      const t = this.player.inv.held,
        s = new Set(this.entities),
        o = e.call(this);
      if (t && ITEMS[t.id] && "firework_rocket" === ITEMS[t.id].key)
        for (const e of this.entities)
          e instanceof FireworkRocket && !s.has(e) && (e.stackRef = { ...t });
      return o;
    };
  })(),
  (() => {
    const t = Game.prototype.placeAt;
    Game.prototype.placeAt = function (e, s, o, n, i, r, ...a) {
      const l = t.call(this, e, s, o, n, i, r, ...a);
      return (
        r &&
          r.sherds &&
          "decorated_pot" === BLOCKS[this.world.getBlock(e, s, o)].key &&
          (this.getBlockEntity(e, s, o, "pot").sherds = [...r.sherds]),
        l
      );
    };
    const e = Game.prototype.dropBlockLoot;
    Game.prototype.dropBlockLoot = function (t, s, o, n, i, r, ...a) {
      const l = t + "," + s + "," + o,
        c = this.blockEntities.get(l);
      if (
        BLOCKS[n] &&
        "decorated_pot" === BLOCKS[n].key &&
        c &&
        c.loot &&
        "undefined" != typeof Loot
      ) {
        const e = RNG(hashStr("loot" + this.world.seed + ":" + t + ":" + s + ":" + o));
        for (const n of Loot.roll(c.loot, e)) this.dropItem(t + 0.5, s + 0.5, o + 0.5, n);
        (delete c.loot, c.sherds || this.blockEntities.delete(l));
      }
      if (!(BLOCKS[n] && "decorated_pot" === BLOCKS[n].key && c && c.sherds))
        return e.call(this, t, s, o, n, i, r, ...a);
      if ((this.blockEntities.delete(l), r && !enchLevel(r, "silk_touch")))
        for (const e of c.sherds)
          this.dropItem(t + 0.5, s + 0.5, o + 0.5, makeStack("brick" === e ? "brick" : e, 1));
      else {
        const e = makeStack("decorated_pot", 1);
        ((e.sherds = c.sherds), this.dropItem(t + 0.5, s + 0.5, o + 0.5, e));
      }
      Sound.ev("block.decorated_pot.shatter", [t + 0.5, s + 0.5, o + 0.5], 1, 1);
    };
    const s = beParts;
    beParts = function (t, e, o, n, i, r) {
      const a = s(t, e, o, n, i, r);
      if ("decorated_pot" !== e.be) return a;
      const l = window.game && game.blockEntities && game.blockEntities.get(n + "," + i + "," + r);
      if (!l || !l.sherds) return a;
      if (!t.models.be_pot_side1) {
        const side = (e) => ({
          parts: [
            {
              name: "s",
              pivot: [0, 0, 0],
              rotY: e,
              boxes: [[1, 0, -7, 0, -7, 14, 16, 0]],
              mesh: t.makeModelPart([[1, 0, -7, 0, -7, 14, 16, 0]], 16, 16),
            },
          ],
        });
        [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((e, s) => {
          t.models["be_pot_side" + s] = side(e);
        });
      }
      const c = a.filter((t) => "be_pot_sides" !== t[0]),
        h = a.find((t) => "be_pot_sides" === t[0]),
        p = [3, 0, 1, 2];
      return (
        l.sherds.forEach((e, s) => {
          const o =
              "brick" === e
                ? null
                : "entity/decorated_pot/" + e.replace(/_pottery_sherd$/, "") + "_pottery_pattern",
            n = o ? t.etex(o) : "decorated_pot_side";
          h && c.push(["be_pot_side" + p[s], n || "decorated_pot_side", h[2]]);
        }),
        c
      );
    };
  })(),
  (() => {
    const t = creativeTabItems;
    ((creativeTabItems = function (e) {
      const s = creativeTabItems.cache || (creativeTabItems.cache = {});
      if (s[e]) return s[e];
      const o = t
        .call(this, e)
        .flatMap((t) =>
          "painting" === t && "undefined" != typeof PAINTINGS
            ? [
                "painting",
                ...PAINTINGS.filter((t) => PAINTING_PLACEABLE.has(t.key)).map((t) => ({
                  key: "painting",
                  pv: t.key,
                })),
              ]
            : "goat_horn" === t && EXTRA.instrument
              ? Object.keys(EXTRA.instrument).map((t) => ({ key: "goat_horn", instrument: t }))
              : [t],
        );
      return (s[e] = o);
    }),
      (creativeTabItems.cache = {}));
  })(),
  (() => {
    const t = { 0: "west", 1: "east", 4: "north", 5: "south" };
    function metaStates(e) {
      const s = metaStates.cache || (metaStates.cache = new Map());
      if (s.has(e)) return s.get(e);
      const o = BLOCKS[e],
        n = new Map(),
        i = {};
      if (!o.fence)
        for (let e = 0; e < 256; e++) {
          if (o.ladder && !t[e]) continue;
          if ("torch" === o.key && e && 1 !== e && 4 !== e && 5 !== e) continue;
          const s = vanillaState(o, e, null),
            r = {};
          for (const t in s.p) "shape" !== t && "occupied" !== t && (r[t] = String(s.p[t]));
          if (o.axis) {
            if (!(3 & ~e)) continue;
            r.axis = ["y", "x", "z"][3 & e];
          }
          if (o.facing && "crafting_table" !== o.key) {
            if (!t[e]) continue;
            r.facing = t[e];
          }
          const a = s.key + JSON.stringify(r);
          if (!n.has(a)) {
            n.set(a, { meta: e, key: s.key, p: r });
            for (const t in r) (i[t] = i[t] || new Set()).add(r[t]);
          }
        }
      const r = [...n.values()],
        a = Object.keys(i).filter((t) => i[t].size > 1),
        l = r.length && a.length ? { list: r, props: a } : null;
      return (s.set(e, l), l);
    }
    const e = Game.prototype.use;
    Game.prototype.use = function () {
      const t = this.player,
        s = this.target,
        o = t.inv.held;
      if (
        o &&
        ITEMS[o.id] &&
        "debug_stick" === ITEMS[o.id].key &&
        s &&
        !this.targetEntity &&
        !this.net
      ) {
        const e = this.world,
          [n, i, r] = s.pos,
          a = e.getBlock(n, i, r),
          l = BLOCKS[a],
          c =
            !l.states &&
            (function legacyState(t, e) {
              const s = metaStates(t);
              if (!s) return null;
              const o = vanillaState(BLOCKS[t], e, null),
                n =
                  s.list.find((t) => t.meta === e) ||
                  s.list.find(
                    (t) =>
                      t.key === o.key &&
                      Object.keys(t.p).every((e) => void 0 === o.p[e] || String(o.p[e]) === t.p[e]),
                  );
              if (!n) return null;
              const i = s.list.filter((t) => t.key === n.key),
                r = {};
              for (const t of s.props)
                t in n.p && new Set(i.map((e) => e.p[t])).size > 1 && (r[t] = n.p[t]);
              return [
                r,
                i.map((t) => Object.assign({}, t.p)),
                (t, s) => {
                  const o = i.find(
                    (e) => e.p[t] === s && Object.keys(r).every((s) => s === t || e.p[s] === r[s]),
                  );
                  return o ? o.meta : e;
                },
              ];
            })(a, e.getMeta(n, i, r)),
          h = c ? c[0] : l.states && l.states[e.getMeta(n, i, r)];
        if (!h || !Object.keys(h).length)
          return (
            (this.ui.actionBar = {
              text: "minecraft:" + l.key + " 没有属性",
              t: performance.now(),
            }),
            void t.swing()
          );
        const p = Object.keys(h);
        o.dbg = o.dbg || {};
        let f = o.dbg[l.key] && p.includes(o.dbg[l.key]) ? o.dbg[l.key] : p[0];
        if (t.sneaking)
          return (
            (f = p[(p.indexOf(f) + 1) % p.length]),
            (o.dbg[l.key] = f),
            (this.ui.actionBar = {
              text: "已选择“" + f + "”（" + h[f] + "）",
              t: performance.now(),
            }),
            void t.swing()
          );
        const d = [...new Set((c ? c[1] : l.states).map((t) => t[f]))],
          u = d[(d.indexOf(h[f]) + 1) % d.length];
        return (
          e.setBlock(n, i, r, a, c ? c[2](f, u) : Features.withProp(a, e.getMeta(n, i, r), f, u)),
          (o.dbg[l.key] = f),
          (this.ui.actionBar = { text: "“" + f + "”设为" + u, t: performance.now() }),
          this.flushMesh && this.flushMesh(),
          void t.swing()
        );
      }
      return e.call(this);
    };
  })(),
  (() => {
    const t = BLOCKS.map((t, e) =>
        !t || ("campfire" !== t.key && "soul_campfire" !== t.key) ? -1 : e,
      ).filter((t) => t >= 0),
      isCamp = (e) => t.includes(e),
      lit = (t, e, s, o, n) => "false" !== Features.propOf(n, t.getMeta(e, s, o), "lit");
    for (const e of t) {
      const t = "soul_campfire" === BLOCKS[e].key,
        s = ITEM_KEY[t ? "soul_soil" : "charcoal"];
      void 0 !== s && (BLOCKS[e].drops = () => [[s, t ? 1 : 2]]);
    }
    Game.prototype.dowseCampfire = function (t, e, s, o) {
      const n = this.world,
        i = n.getBlock(t, e, s);
      if (!isCamp(i) || !lit(n, t, e, s, i)) return !1;
      if (
        (n.setBlock(t, e, s, i, Features.withProp(i, n.getMeta(t, e, s), "lit", "false")),
        o &&
          Sound.ev(
            o,
            [t + 0.5, e + 0.5, s + 0.5],
            "block.fire.extinguish" === o ? 0.5 : 1,
            "block.fire.extinguish" === o ? 2.6 + 0.8 * (Math.random() - Math.random()) : 1,
          ),
        o)
      )
        for (let o = 0; o < 20; o++)
          this.particles.spawn(
            "smoke",
            t + 0.3 + 0.4 * Math.random(),
            e + 0.4,
            s + 0.3 + 0.4 * Math.random(),
            0,
            0.07,
            0,
          );
      return (this.flushMesh(), !0);
    };
    const e = Game.prototype.use;
    Game.prototype.use = function () {
      const t = this.player,
        s = this.target,
        o = t.inv.held;
      if (
        s &&
        !this.targetEntity &&
        !this.net &&
        !this.p2pGuest &&
        o &&
        isCamp(s.id) &&
        COOKING.campfire_cooking[o.id]
      ) {
        const [e, n, i] = s.pos,
          r = ((t, e, s, o) => {
            const n = e + "," + s + "," + o;
            let i = t.blockEntities.get(n);
            return (
              (i && "campfire" === i.type) ||
                ((i = {
                  type: "campfire",
                  pos: [e, s, o],
                  items: [null, null, null, null],
                  times: [0, 0, 0, 0],
                }),
                t.blockEntities.set(n, i)),
              i
            );
          })(this, e, n, i),
          a = r.items.findIndex((t) => !t);
        if (a >= 0)
          return (
            (r.items[a] = { ...o, count: 1 }),
            (r.times[a] = 0),
            useOne(this, t),
            t.swing(),
            void this.markBlockEntity(r)
          );
      }
      return e.call(this);
    };
    const s = Game.prototype.tickFurnaces;
    Game.prototype.tickFurnaces = function () {
      if ((s.call(this), this.net || this.p2pGuest)) return;
      const e = this.world,
        o = this.player;
      for (const t of this.blockEntities.values()) {
        if ("campfire" !== t.type) continue;
        const [s, o, n] = t.pos;
        if (!e.isLoaded(s, n)) continue;
        const i = e.getBlock(s, o, n);
        if (!isCamp(i)) {
          for (const e of t.items) e && this.dropItem(s + 0.5, o + 0.5, n + 0.5, e);
          this.blockEntities.delete(t.pos.join(","));
          continue;
        }
        const r = lit(e, s, o, n, i);
        for (let e = 0; e < 4; e++) {
          const i = t.items[e];
          if (!i) continue;
          const a = COOKING.campfire_cooking[i.id];
          r
            ? ++t.times[e] >= (a ? a.time : 600) &&
              ((t.items[e] = null),
              (t.times[e] = 0),
              a &&
                this.dropItem(
                  s + 0.5,
                  o + 1,
                  n + 0.5,
                  { id: a.result, count: 1, dmg: 0 },
                  [0, 0.1, 0],
                ),
              this.markBlockEntity(t))
            : (t.times[e] = Math.max(0, t.times[e] - 2));
        }
      }
      if (!t.length || !o) return;
      const n = Math.floor(o.pos[0]),
        i = Math.floor(o.pos[2]);
      for (let s = (n >> 4) - 2; s <= 2 + (n >> 4); s++)
        for (let n = (i >> 4) - 2; n <= 2 + (i >> 4); n++) {
          const i = e.getChunk(s, n);
          if (i) {
            (!i.campfires || this.tickCount - i.campfiresT > 100) &&
              ((i.campfires = []),
              (i.campfiresT = this.tickCount),
              i.findAll(t, (t) =>
                i.campfires.push([16 * s + (15 & t), t >> 8, 16 * n + ((t >> 4) & 15)]),
              ));
            for (const [t, s, n] of i.campfires) {
              const i = e.getBlock(t, s, n);
              if (!isCamp(i) || !lit(e, t, s, n, i)) continue;
              Math.random() < 0.12 &&
                this.particles.spawn(
                  "smoke",
                  t + 0.3 + 0.4 * Math.random(),
                  s + 0.6,
                  n + 0.3 + 0.4 * Math.random(),
                  0,
                  0.07,
                  0,
                );
              const r = o.pos;
              r[0] > t - 0.3 &&
                r[0] < t + 1.3 &&
                r[2] > n - 0.3 &&
                r[2] < n + 1.3 &&
                r[1] >= s &&
                r[1] < s + 0.7 &&
                !o.creative &&
                0 === o.deathTime &&
                o.hurt("soul_campfire" === BLOCKS[i].key ? 2 : 1, { type: "fire" });
            }
          }
        }
    };
    const o = Game.prototype.drawChests;
    Game.prototype.drawChests = function (t, e) {
      const s = o.call(this, t, e);
      if (!this.blockEntities) return s;
      const n = this.player,
        i = this.world;
      for (const t of this.blockEntities.values()) {
        if ("campfire" !== t.type || !t.items.some(Boolean)) continue;
        const [s, o, r] = t.pos;
        if (
          Math.abs(s - n.pos[0]) > 48 ||
          Math.abs(r - n.pos[2]) > 48 ||
          !isCamp(i.getBlock(s, o, r))
        )
          continue;
        const a = i.getLight(s, o + 1, r),
          l = [(a >> 4) / 15, Math.max(15 & a, 13) / 15];
        for (let n = 0; n < 4; n++) {
          const i = t.items[n];
          if (!i) continue;
          const a = M4.create();
          (M4.translate(a, s + 0.5, o + 0.45, r + 0.5),
            M4.rotY(a, (-n * Math.PI) / 2),
            M4.translate(a, -0.3125, 0, -0.3125),
            M4.rotX(a, -Math.PI / 2),
            M4.scale(a, 0.75, 0.75, 0.75),
            this.drawItemFixed(i, a, l, e));
        }
      }
      return s;
    };
  })(),
  (() => {
    const t = new Set(
        BLOCKS.map((t, e) => (t && /(^|_)shulker_box$/.test(t.key) ? e : -1)).filter((t) => t >= 0),
      ),
      e = BLOCKS.findIndex((t) => t && "ender_chest" === t.key),
      itemOf = (t) => ITEM_KEY[BLOCKS[t].key],
      s = Game.prototype.use;
    Game.prototype.use = function () {
      const o = this.player,
        n = this.target;
      if (
        n &&
        !this.targetEntity &&
        !this.net &&
        !this.p2pGuest &&
        !o.sneaking &&
        (t.has(n.id) || (e >= 0 && n.id === e))
      ) {
        const [t, s, i] = n.pos,
          r = BLOCKS[n.id],
          a = [t + 0.5, s + 0.5, i + 0.5];
        if (n.id === e) {
          const e = this.worldMeta,
            o = e.ender || (e.ender = new Array(27).fill(null));
          (this.ui.open(new ChestScreen(this, [{ type: "ender", pos: [t, s, i], slots: o }], r.cn)),
            Sound.ev("block.ender_chest.open", a, 0.5, 0.9 + 0.1 * Math.random()));
        } else
          (this.ui.open(new ChestScreen(this, [this.getBlockEntity(t, s, i, "chest")], r.cn)),
            Sound.ev("block.shulker_box.open", a, 0.5, 0.9 + 0.1 * Math.random()));
        return void o.swing();
      }
      const i = o.inv.held,
        r = i && i.sb,
        a = s.call(this);
      if (r && n && !this.net) {
        const e = DIRS[n.face] || [0, 0, 0];
        for (const [s, o, i] of [[n.pos[0] + e[0], n.pos[1] + e[1], n.pos[2] + e[2]], n.pos]) {
          if (!t.has(this.world.getBlock(s, o, i))) continue;
          const e = this.getBlockEntity(s, o, i, "chest");
          if (!e.slots.some(Boolean)) {
            for (e.slots = r.map((t) => (t ? { ...t } : null)); e.slots.length < 27;)
              e.slots.push(null);
            break;
          }
        }
      }
      return a;
    };
    const o = Game.prototype.dropBlockLoot;
    Game.prototype.dropBlockLoot = function (e, s, n, i, r, a) {
      if (!t.has(i) || void 0 === itemOf(i)) return o.call(this, e, s, n, i, r, a);
      const l = e + "," + s + "," + n,
        c = this.blockEntities.get(l),
        h = makeStack(itemOf(i), 1);
      (c && c.slots && c.slots.some(Boolean) && (h.sb = c.slots.map((t) => (t ? { ...t } : null))),
        this.blockEntities.delete(l),
        this.dropItem(e + 0.5, s + 0.3, n + 0.5, h));
    };
    const n = Game.prototype.breakBlock;
    Game.prototype.breakBlock = function (e, s, o, i, r) {
      const a = this.world.getBlock(e, s, o);
      if (t.has(a) && "creative" === this.mode && !i && !this.net) {
        const t = this.blockEntities.get(e + "," + s + "," + o);
        t &&
          t.slots &&
          t.slots.some(Boolean) &&
          this.dropBlockLoot(e, s, o, a, this.world.getMeta(e, s, o), null);
      }
      return n.call(this, e, s, o, i, r);
    };
  })());
for (const t of BLOCKS)
  t &&
    (/^(chipped_|damaged_)?anvil$/.test(t.key) || /_concrete_powder$/.test(t.key)) &&
    (t.gravity = !0);
("undefined" != typeof MOB_TYPES &&
  MOB_TYPES.wandering_trader &&
  MOB_TYPES.wandering_trader.speed > 0.5 &&
  (MOB_TYPES.wandering_trader.speed = 0.245),
  (() => {
    const t = Game.prototype.tickFurnaces;
    Game.prototype.tickFurnaces = function () {
      t.call(this);
      const e = this.player,
        s = this.world;
      if (!e || void 0 === BID.soul_sand || void 0 === BID.magma_block) return;
      const o = Math.floor(e.pos[0]),
        n = Math.floor(e.pos[2]),
        i = [BID.soul_sand, BID.magma_block];
      for (let t = (o >> 4) - 1; t <= 1 + (o >> 4); t++)
        for (let e = (n >> 4) - 1; e <= 1 + (n >> 4); e++) {
          const r = s.getChunk(t, e);
          if (r) {
            (!r.bubbleSrc || this.tickCount - r.bubbleSrcT > 100) &&
              ((r.bubbleSrc = []),
              (r.bubbleSrcT = this.tickCount),
              r.findAll(i, (o) => {
                const n = 16 * t + (15 & o),
                  i = o >> 8,
                  a = 16 * e + ((o >> 4) & 15);
                s.getBlock(n, i + 1, a) === WATER && r.bubbleSrc.push([n, i, a]);
              }));
            for (const [t, e, i] of r.bubbleSrc) {
              if (Math.abs(t - o) > 24 || Math.abs(i - n) > 24 || Math.random() > 0.5) continue;
              const r = s.getBlock(t, e, i) === BID.soul_sand;
              let a = e + 1;
              for (
                ;
                a < e + 64 && s.getBlock(t, a + 1, i) === WATER && 0 === s.getMeta(t, a + 1, i);
              )
                a++;
              if (!s.bubbleColumnAt(t, e + 1, i)) continue;
              const l = e + 1 + Math.random() * (a - e);
              this.particles.spawn(
                "bubble",
                t + 0.3 + 0.4 * Math.random(),
                l,
                i + 0.3 + 0.4 * Math.random(),
                0,
                r ? 0.12 : -0.08,
                0,
              );
            }
          }
        }
    };
  })(),
  (() => {
    const t = Game.prototype.finishChunk;
    Game.prototype.finishChunk = function (e, s) {
      const o = t.call(this, e, s);
      if (s || this.net || this.p2pGuest || !e || !e.bs) return o;
      const n = this.world,
        i = 16 * e.cx,
        r = 16 * e.cz,
        at = (t, s, o) => {
          if (s < 0 || s >= HEIGHT) return -1;
          const a = t - i,
            l = o - r;
          return a >= 0 && a < 16 && l >= 0 && l < 16
            ? e.getB((s << 8) | (l << 4) | a)
            : n.isLoaded(t, o)
              ? n.getBlock(t, s, o)
              : -1;
        },
        free = (t, e, s) => {
          const o = at(t, e, s);
          return 0 === o || (o > 0 && !!REPLACEABLE[o] && !IS_FLUID[o] && !WLOG[o]);
        },
        wet = (t, e, s) => {
          const o = at(t, e, s);
          return o === WATER || (o > 0 && !!WLOG[o]);
        };
      let a = 0;
      for (let t = 0; t < e.bs.length; t++) {
        const s = e.bs[t];
        if (!s || !s.p.some((t) => IS_FLUID[t])) continue;
        const o = s.p.includes(LAVA) && s.p.includes(WATER);
        if (!(a >= 400) || o)
          for (let s = 0; s < 4096 && (a < 400 || o); s++) {
            const l = (t << 12) | s,
              c = e.getB(l);
            if (!IS_FLUID[c]) continue;
            const h = l >> 8,
              p = i + (15 & l),
              f = r + ((l >> 4) & 15);
            a < 400 &&
            (free(p, h - 1, f) ||
              free(p + 1, h, f) ||
              free(p - 1, h, f) ||
              free(p, h, f + 1) ||
              free(p, h, f - 1))
              ? (n.schedule(p, h, f, c === WATER ? 5 : 30), a++)
              : o &&
                c === LAVA &&
                (wet(p, h + 1, f) ||
                  wet(p + 1, h, f) ||
                  wet(p - 1, h, f) ||
                  wet(p, h, f + 1) ||
                  wet(p, h, f - 1)) &&
                n.schedule(p, h, f, 2);
          }
      }
      return o;
    };
  })(),
  (() => {
    const t = BLOCKS.findIndex((t) => t && "pointed_dripstone" === t.key);
    if (t < 0) return;
    const e = BLOCKS[t],
      s = { tip_merge: 5, tip: 5, frustum: 4, middle: 3, base: 2 };
    ((e.solid = !0),
      (e.collide = (t) => {
        const o = (e.states && e.states[t]) || {},
          n = s[o.thickness] ?? 3,
          i = 16 - n;
        return "tip" === o.thickness
          ? "up" === o.vertical_direction
            ? [[n, 0, n, i, 11, i]]
            : [[n, 5, n, i, 16, i]]
          : [[n, 0, n, i, 16, i]];
      }));
  })());
//# sourceURL=js/specials.js
