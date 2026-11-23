"use strict";
(defItem("potato", "马铃薯", { food: [1, 0.6], places: "potatoes" }),
  defItem("beetroot", "甜菜根", { food: [1, 1.2] }),
  defItem("beetroot_seeds", "甜菜种子", { places: "beetroots" }),
  defItem("cod", "生鳕鱼", { food: [2, 0.4] }),
  defItem("cooked_cod", "熟鳕鱼", { food: [5, 6] }),
  defItem("salmon", "生鲑鱼", { food: [2, 0.4] }),
  defItem("cooked_salmon", "熟鲑鱼", { food: [6, 9.6] }),
  defItem("glass_bottle", "玻璃瓶"),
  ITEMS[ITEM_KEY.carrot] && (ITEMS[ITEM_KEY.carrot].places = "carrots"),
  (() => {
    const age = (t, e) =>
      +((BLOCKS[t].states && BLOCKS[t].states[e] && BLOCKS[t].states[e].age) || 0);
    (void 0 !== BID.carrots &&
      (BLOCKS[BID.carrots].drops = (t, e, o) =>
        age(BID.carrots, t) >= 7 ? [["carrot", 1 + cropBonusCount(e, o)]] : [["carrot", 1]]),
      void 0 !== BID.potatoes &&
        (BLOCKS[BID.potatoes].drops = (t, e, o) =>
          age(BID.potatoes, t) >= 7 ? [["potato", 1 + cropBonusCount(e, o)]] : [["potato", 1]]),
      void 0 !== BID.beetroots &&
        (BLOCKS[BID.beetroots].drops = (t, e, o) =>
          age(BID.beetroots, t) >= 3
            ? [
                ["beetroot", 1],
                ["beetroot_seeds", cropBonusCount(e, o)],
              ]
            : [["beetroot_seeds", 1]]));
  })());
const T_ = (t, e, o, s, a = 12, i = 1, r = null, _ = 0) => ({
    a: t,
    an: e,
    b: r,
    bn: _,
    r: o,
    rn: s,
    uses: a,
    xp: i,
  }),
  E = "emerald",
  TRADES = {
    armorer: [
      [
        T_("coal", 15, E, 1, 16, 2),
        T_(E, 5, "iron_leggings", 1, 12, 1),
        T_(E, 9, "iron_chestplate", 1, 12, 1),
        T_(E, 5, "iron_helmet", 1, 12, 1),
        T_(E, 4, "iron_boots", 1, 12, 1),
      ],
      [T_("iron_ingot", 4, E, 1, 12, 10), T_(E, 36, "bell", 1, 12, 5)],
      [T_("lava_bucket", 1, E, 1, 12, 20), T_("diamond", 1, E, 1, 12, 20)],
      [T_(E, 19, "diamond_leggings", 1, 3, 15), T_(E, 13, "diamond_boots", 1, 3, 15)],
      [T_(E, 13, "diamond_helmet", 1, 3, 30), T_(E, 21, "diamond_chestplate", 1, 3, 30)],
    ],
    butcher: [
      [T_("chicken", 14, E, 1, 16, 2), T_("porkchop", 7, E, 1, 16, 2)],
      [
        T_("coal", 15, E, 1, 16, 2),
        T_(E, 1, "cooked_porkchop", 5, 16, 5),
        T_(E, 1, "cooked_chicken", 8, 16, 5),
      ],
      [T_("mutton", 7, E, 1, 16, 20), T_("beef", 10, E, 1, 16, 20)],
      [T_("coal", 15, E, 1, 12, 30)],
      [T_("sweet_berry_bush", 10, E, 1, 12, 30)],
    ],
    cartographer: [
      [T_("paper", 24, E, 1, 16, 2)],
      [T_("glass_pane", 11, E, 1, 16, 10)],
      [T_("paper", 24, E, 1, 12, 20)],
      [T_(E, 7, "white_carpet", 1, 12, 15)],
      [T_(E, 8, "book", 1, 12, 30)],
    ],
    cleric: [
      [T_("rotten_flesh", 32, E, 1, 16, 2), T_(E, 1, "redstone", 2, 12, 1)],
      [T_("gold_ingot", 3, E, 1, 12, 10), T_(E, 1, "lapis_lazuli", 1, 12, 5)],
      [T_(E, 4, "glowstone", 1, 12, 10)],
      [T_("glass_bottle", 9, E, 1, 12, 30), T_(E, 5, "ender_pearl", 1, 12, 15)],
      [T_("nether_wart", 22, E, 1, 12, 30)],
    ],
    farmer: [
      [
        T_("wheat", 20, E, 1, 16, 2),
        T_("potato", 26, E, 1, 16, 2),
        T_("carrot", 22, E, 1, 16, 2),
        T_("beetroot", 15, E, 1, 16, 2),
        T_(E, 1, "bread", 6, 16, 1),
      ],
      [
        T_("pumpkin", 6, E, 1, 12, 10),
        T_(E, 1, "pumpkin_pie", 4, 12, 5),
        T_(E, 1, "apple", 4, 16, 5),
      ],
      [T_(E, 1, "cookie", 18, 12, 10), T_("melon", 4, E, 1, 12, 20)],
      [T_(E, 1, "pumpkin_pie", 4, 12, 15)],
      [T_(E, 3, "golden_apple", 1, 12, 30)],
    ],
    fisherman: [
      [
        T_("string", 20, E, 1, 16, 2),
        T_("coal", 10, E, 1, 16, 2),
        T_(E, 1, "cooked_cod", 6, 16, 1, "cod", 6),
      ],
      [
        T_("cod", 15, E, 1, 16, 10),
        T_(E, 1, "cooked_salmon", 6, 16, 5, "salmon", 6),
        T_(E, 2, "campfire", 1, 12, 5),
      ],
      [T_("salmon", 13, E, 1, 16, 20)],
      [T_("cod", 15, E, 1, 12, 30)],
      [T_("salmon", 13, E, 1, 12, 30)],
    ],
    fletcher: [
      [
        T_("stick", 32, E, 1, 16, 2),
        T_(E, 1, "arrow", 16, 12, 1),
        T_(E, 1, "flint", 10, 12, 1, "gravel", 10),
      ],
      [T_("flint", 26, E, 1, 12, 10), T_(E, 2, "bow", 1, 12, 5)],
      [T_("string", 14, E, 1, 16, 20)],
      [T_("feather", 24, E, 1, 16, 30)],
      [T_("tripwire_hook", 8, E, 1, 12, 30)],
    ],
    leatherworker: [
      [
        T_("leather", 6, E, 1, 16, 2),
        T_(E, 3, "leather_leggings", 1, 12, 1),
        T_(E, 7, "leather_chestplate", 1, 12, 1),
      ],
      [
        T_("flint", 26, E, 1, 12, 10),
        T_(E, 5, "leather_helmet", 1, 12, 5),
        T_(E, 4, "leather_boots", 1, 12, 5),
      ],
      [T_("leather", 9, E, 1, 12, 20)],
      [T_(E, 6, "leather_helmet", 1, 12, 15)],
      [T_(E, 6, "leather_boots", 1, 12, 30)],
    ],
    librarian: [
      [T_("paper", 24, E, 1, 16, 2), T_(E, 9, "bookshelf", 1, 12, 1)],
      [T_("book", 4, E, 1, 12, 10), T_(E, 1, "lantern", 1, 12, 5)],
      [T_(E, 1, "glass", 4, 12, 10)],
      [T_("book", 4, E, 1, 12, 15)],
      [T_(E, 20, "golden_apple", 1, 12, 30)],
    ],
    mason: [
      [T_("clay_ball", 10, E, 1, 16, 2), T_(E, 1, "bricks", 10, 16, 1)],
      [T_("stone", 20, E, 1, 16, 10), T_(E, 1, "chiseled_stone_bricks", 4, 16, 5)],
      [
        T_("granite", 16, E, 1, 16, 20),
        T_("andesite", 16, E, 1, 16, 20),
        T_("diorite", 16, E, 1, 16, 20),
        T_(E, 1, "polished_andesite", 4, 16, 10),
        T_(E, 1, "polished_diorite", 4, 16, 10),
        T_(E, 1, "polished_granite", 4, 16, 10),
      ],
      [
        T_("quartz", 12, E, 1, 12, 30),
        T_(E, 1, "orange_terracotta", 1, 12, 15),
        T_(E, 1, "white_glazed_terracotta", 1, 12, 15),
        T_(E, 1, "light_blue_glazed_terracotta", 1, 12, 15),
      ],
      [T_(E, 1, "quartz_block", 1, 12, 30)],
    ],
    shepherd: [
      [
        T_("white_wool", 18, E, 1, 16, 2),
        T_("brown_wool", 18, E, 1, 16, 2),
        T_("black_wool", 18, E, 1, 16, 2),
        T_("gray_wool", 18, E, 1, 16, 2),
        T_(E, 2, "shears", 1, 12, 1),
      ],
      [
        T_(E, 1, "white_wool", 1, 16, 5),
        T_(E, 1, "red_wool", 1, 16, 5),
        T_(E, 1, "white_carpet", 4, 16, 5),
        T_(E, 1, "red_carpet", 4, 16, 5),
      ],
      [
        T_(E, 3, "white_bed", 1, 12, 10),
        T_(E, 3, "red_bed", 1, 12, 10),
        T_(E, 3, "blue_bed", 1, 12, 10),
      ],
      [T_(E, 3, "yellow_bed", 1, 12, 15)],
      [T_(E, 2, "black_carpet", 4, 12, 30)],
    ],
    toolsmith: [
      [
        T_("coal", 15, E, 1, 16, 2),
        T_(E, 1, "stone_axe", 1, 12, 1),
        T_(E, 1, "stone_shovel", 1, 12, 1),
        T_(E, 1, "stone_pickaxe", 1, 12, 1),
        T_(E, 1, "stone_hoe", 1, 12, 1),
      ],
      [T_("iron_ingot", 4, E, 1, 12, 10), T_(E, 36, "bell", 1, 12, 5)],
      [T_("flint", 30, E, 1, 12, 20), T_(E, 4, "diamond_hoe", 1, 3, 10)],
      [
        T_("diamond", 1, E, 1, 12, 30),
        T_(E, 17, "diamond_axe", 1, 3, 15),
        T_(E, 10, "diamond_shovel", 1, 3, 15),
      ],
      [T_(E, 18, "diamond_pickaxe", 1, 3, 30)],
    ],
    weaponsmith: [
      [
        T_("coal", 15, E, 1, 16, 2),
        T_(E, 3, "iron_axe", 1, 12, 1),
        T_(E, 2, "iron_sword", 1, 12, 1),
      ],
      [T_("iron_ingot", 4, E, 1, 12, 10), T_(E, 36, "bell", 1, 12, 5)],
      [T_("flint", 24, E, 1, 12, 20)],
      [T_("diamond", 1, E, 1, 12, 30), T_(E, 17, "diamond_axe", 1, 3, 15)],
      [T_(E, 13, "diamond_sword", 1, 3, 30)],
    ],
  },
  LEVEL_XP = [0, 10, 70, 150, 250],
  LEVEL_CN = ["新手", "学徒", "老手", "专家", "大师"],
  hasItem = (t) => void 0 !== ITEM_KEY[t];
((Villager.prototype.offers = function () {
  return (
    this.trades || ((this.trades = []), (this.vlevel = 1), (this.vxp = 0), this.addLevelTrades(1)),
    this.trades
  );
}),
  (Villager.prototype.addLevelTrades = function (t) {
    const e = ((TRADES[this.profession] || [])[t - 1] || []).filter(
      (t) => hasItem(t.a) && hasItem(t.r) && (!t.b || hasItem(t.b)),
    );
    for (let t = 0; t < 2 && e.length; t++) {
      const t = e.splice(Math.floor(Math.random() * e.length), 1)[0];
      this.trades.push({ ...t, used: 0 });
    }
  }),
  (Villager.prototype.gainXp = function (t) {
    for (this.vxp += t; this.vlevel < 5 && this.vxp >= LEVEL_XP[this.vlevel];) {
      (this.vlevel++, this.addLevelTrades(this.vlevel));
      for (let t = 0; t < 8; t++)
        this.game.particles.spawn(
          "happy_villager",
          this.pos[0] + (Math.random() - 0.5),
          this.pos[1] + 1 + Math.random(),
          this.pos[2] + (Math.random() - 0.5),
          0,
          0.05,
          0,
        );
    }
  }),
  (Villager.prototype.restock = function () {
    const t = Math.floor((this.game.worldTime || 0) / 12e3);
    if (this.restockDay !== t) {
      this.restockDay = t;
      for (const t of this.trades || []) t.used = 0;
    }
  }));
class MerchantScreen extends ContainerScreen {
  constructor(t, e) {
    (super(t, "villager_gui", 276, 166, null),
      (this.v = e),
      e.restock && e.restock(),
      e.offers(),
      (this.sel = 0),
      (this.scroll = 0),
      (this.pay = [null, null]),
      (this.out = null),
      this.slots.push({
        x: 136,
        y: 37,
        get: () => this.pay[0],
        set: (t) => {
          ((this.pay[0] = t), this.update());
        },
        group: "container",
      }),
      this.slots.push({
        x: 162,
        y: 37,
        get: () => this.pay[1],
        set: (t) => {
          ((this.pay[1] = t), this.update());
        },
        group: "container",
      }),
      this.slots.push({
        x: 220,
        y: 37,
        output: !0,
        get: () => this.out,
        set: (t) => {
          this.out = t;
        },
        onTake: (t) => this.trade(),
      }));
    const o = t.player.inv;
    for (let t = 0; t < 3; t++)
      for (let e = 0; e < 9; e++) {
        const s = 9 + 9 * t + e;
        this.slots.push({
          x: 108 + 18 * e,
          y: 84 + 18 * t,
          get: () => o.slots[s],
          set: (t) => {
            o.slots[s] = t;
          },
          group: "main",
          idx: s,
        });
      }
    for (let t = 0; t < 9; t++)
      this.slots.push({
        x: 108 + 18 * t,
        y: 142,
        get: () => o.slots[t],
        set: (e) => {
          o.slots[t] = e;
        },
        group: "hotbar",
        idx: t,
      });
    this.pick(0);
  }
  get title2() {
    return PROFESSION_CN[this.v.profession] + " - " + LEVEL_CN[(this.v.vlevel || 1) - 1];
  }
  offer() {
    return this.v.offers()[this.sel];
  }
  matches(t, e, o) {
    return t && itemIds(e).includes(t.id) && t.count >= o;
  }
  update() {
    const t = this.offer();
    this.out =
      t &&
      t.used < t.uses &&
      this.matches(this.pay[0], t.a, t.an) &&
      (!t.b || this.matches(this.pay[1], t.b, t.bn))
        ? makeStack(t.r, t.rn)
        : null;
  }
  pick(t) {
    this.sel = t;
    const e = this.game.player.inv,
      o = this.offer();
    for (let t = 0; t < 2; t++) this.pay[t] && (this.giveBack(this.pay[t]), (this.pay[t] = null));
    (o &&
      [
        [o.a, o.an, 0],
        [o.b, o.bn, 1],
      ].forEach(([t, o, s]) => {
        if (!t) return;
        const a = ITEM_KEY[t],
          i = itemIds(t);
        let r = maxStack(a);
        for (let t = 0; t < 36 && r > 0; t++) {
          const o = e.slots[t];
          if (!o || !i.includes(o.id) || (this.pay[s] && o.id !== this.pay[s].id)) continue;
          const a = Math.min(o.count, r);
          ((r -= a),
            (o.count -= a),
            o.count || (e.slots[t] = null),
            this.pay[s]
              ? (this.pay[s].count += a)
              : (this.pay[s] = { id: o.id, count: a, dmg: 0 }));
        }
      }),
      this.update());
  }
  giveBack(t) {
    const e = this.game.player.inv.add(t);
    e > 0 && this.game.dropFromPlayer({ ...t, count: e });
  }
  trade() {
    const t = this.offer();
    if (!t) return;
    ((this.pay[0].count -= t.an),
      this.pay[0].count || (this.pay[0] = null),
      t.b && ((this.pay[1].count -= t.bn), this.pay[1].count || (this.pay[1] = null)),
      t.used++,
      this.v.gainXp(t.xp),
      this.game.addXp && this.game.addXp(3 + Math.floor(4 * Math.random())),
      Sound.ev("entity.villager.yes", this.v.pos, 1, 1));
    const e = this.sel;
    this.pick(e);
  }
  close() {
    for (let t = 0; t < 2; t++) this.pay[t] && (this.giveBack(this.pay[t]), (this.pay[t] = null));
    this.out = null;
  }
  offerAt(t, e) {
    const o = t - this.x - 5,
      s = e - this.y - 18;
    if (o < 0 || o >= 88 || s < 0) return -1;
    const a = Math.floor(s / 20) + this.scroll;
    return s < 140 && a < this.v.offers().length ? a : -1;
  }
  mouseDown(t, e, o, s, a) {
    const i = this.offerAt(e, o);
    if (i >= 0) return (this.pick(i), void (Sound.click && Sound.click()));
    super.mouseDown(t, e, o, s, a);
  }
  wheel(t, e) {
    const o = this.v.offers().length;
    this.scroll = clamp(this.scroll + Math.sign(e), 0, Math.max(0, o - 7));
  }
  drawExtra(t) {
    const e = t.ctx,
      o = t.img,
      s = this.v,
      a = s.offers(),
      i = this.title2;
    if (
      (Font.draw(e, i, this.x + 49 + 138 - Font.width(i) / 2, this.y + 6, "#404040", !1),
      Font.draw(e, "交易", this.x + 5 - Font.width("交易") / 2 + 48, this.y + 6, "#404040", !1),
      Font.draw(e, "物品栏", this.x + 107, this.y + 72, "#404040", !1),
      o.vxp_bg)
    ) {
      e.drawImage(o.vxp_bg, this.x + 136, this.y + 16);
      const t = s.vlevel || 1;
      if (t < 5 && o.vxp_cur) {
        const a = LEVEL_XP[t - 1],
          i = LEVEL_XP[t],
          r = Math.min(102, Math.floor((102 * (s.vxp - a)) / (i - a)));
        r > 0 && e.drawImage(o.vxp_cur, 0, 0, r, 5, this.x + 136, this.y + 16, r, 5);
      }
    }
    const r = this.offerAt(t.mouse.x, t.mouse.y);
    for (let s = 0; s < 7; s++) {
      const i = s + this.scroll,
        _ = a[i];
      if (!_) break;
      const l = this.x + 5,
        n = this.y + 18 + 20 * s;
      t.nine(i === r || i === this.sel ? "button_hl" : "button", l, n, 88, 20, 3);
      const h = n + 1;
      (t.drawItem(makeStack(_.a, _.an), this.x + 10, h),
        _.b && t.drawItem(makeStack(_.b, _.bn), this.x + 40, h));
      const c = _.used >= _.uses ? o.trade_arrow_out : o.trade_arrow;
      (c && e.drawImage(c, this.x + 60, n + 5), t.drawItem(makeStack(_.r, _.rn), this.x + 73, h));
    }
    a.length > 7 &&
      o.v_scroller &&
      e.drawImage(
        o.v_scroller,
        this.x + 94,
        this.y + 18 + Math.floor((this.scroll / Math.max(1, a.length - 7)) * 112),
      );
    const _ = this.offer();
    if (
      (_ &&
        _.used >= _.uses &&
        o.out_of_stock &&
        e.drawImage(o.out_of_stock, this.x + 186, this.y + 35),
      r >= 0 && !t.cursor)
    ) {
      const e = a[r],
        o = t.mouse.x,
        s =
          o < this.x + 36
            ? makeStack(e.a, e.an)
            : o < this.x + 60 && e.b
              ? makeStack(e.b, e.bn)
              : o >= this.x + 70
                ? makeStack(e.r, e.rn)
                : null;
      s && (this.tipLater = s);
    }
  }
  draw(t) {
    ((this.tipLater = null),
      super.draw(t),
      this.tipLater && t.tooltip(t.itemLines(this.tipLater), t.mouse.x, t.mouse.y));
  }
}
//# sourceURL=js/merchant.js
