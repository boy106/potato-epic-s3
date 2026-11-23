"use strict";
const SGA = {
  words:
    "the elder scrolls klaatu berata niktu xyzzy bless curse light darkness fire air earth water hot dry cold wet ignite snuff embiggen twist shorten stretch fiddle destroy imbue galvanize enchant free limited range of towards inside sphere cube self other ball mental physical grow shrink demon elemental spirit animal creature beast humanoid undead fresh stale phnglui mglwnafh cthulhu rlyeh wgahnagl fhtagnbaguette".split(
      " ",
    ),
  cache: new Map(),
  init(t) {
    if (this.img === t) return;
    ((this.img = t), (this.cell = t.width / 16), (this.wd = new Array(256).fill(0)));
    const e = document.createElement("canvas");
    ((e.width = t.width), (e.height = t.height));
    const s = e.getContext("2d");
    s.drawImage(t, 0, 0);
    const n = s.getImageData(0, 0, t.width, t.height).data,
      i = this.cell;
    for (let e = 0; e < 256; e++) {
      let s = -1;
      for (let o = 0; o < i; o++)
        for (let r = 0; r < i; r++)
          n[4 * (((e >> 4) * i + r) * t.width + (15 & e) * i + o) + 3] && (s = Math.max(s, o));
      this.wd[e] = 32 === e ? 4 : s < 0 ? 0 : Math.round((8 * (s + 1)) / i) + 1;
    }
  },
  width(t) {
    let e = 0;
    for (const s of t) e += this.wd[255 & s.charCodeAt(0)];
    return e;
  },
  name(t, e) {
    const s = new JRandom(t),
      n = s.nextInt(2) + 3,
      i = [];
    for (let t = 0; t < n; t++) i.push(this.words[s.nextInt(this.words.length)]);
    const o = [];
    let r = "";
    for (const t of i) {
      const s = r ? r + " " + t : t;
      this.width(s) > e && r ? (o.push(r), (r = t)) : (r = s);
    }
    return (r && o.push(r), o.slice(0, 2));
  },
  draw(t, e, s, n, i) {
    const o = e + "|" + i;
    let r = this.cache.get(o);
    if (!r) {
      ((r = document.createElement("canvas")),
        (r.width = Math.max(1, this.width(e))),
        (r.height = 8));
      const t = r.getContext("2d"),
        s = this.cell;
      let n = 0;
      t.imageSmoothingEnabled = !1;
      for (const i of e) {
        const e = 255 & i.charCodeAt(0);
        (t.drawImage(this.img, (15 & e) * s, (e >> 4) * s, s, s, n, 0, 8, 8), (n += this.wd[e]));
      }
      ((t.globalCompositeOperation = "source-in"),
        (t.fillStyle = i),
        t.fillRect(0, 0, r.width, 8),
        this.cache.size > 200 && this.cache.clear(),
        this.cache.set(o, r));
    }
    t.drawImage(r, s, n);
  },
};
Game.prototype.addLevels = function (t) {
  const e = this.player,
    s = this.xpLevel(),
    n = (e.xp - this.xpTotalFor(s)) / this.xpNeeded(s),
    i = Math.max(0, s + t);
  e.xp = Math.max(0, Math.round(this.xpTotalFor(i) + n * this.xpNeeded(i)));
};
class StationScreen extends ContainerScreen {
  constructor(t, e, s, n) {
    (super(t, e, 176, 166, s), (this.pos = n), (this.held = []), (this.invLabelY = 72));
  }
  S(t) {
    return this.slots[t].get();
  }
  own(t, e, s, n = {}) {
    this.slots.push({
      x: e,
      y: s,
      group: "container",
      get: () => this.held[t] || null,
      set: (e) => {
        this.held[t] = e;
      },
      ...n,
    });
  }
  drawExtra(t) {
    (Font.draw(t.ctx, "物品栏", this.x + 8, this.y + this.invLabelY, "#404040", !1),
      this.drawMore && this.drawMore(t));
  }
  close() {
    for (const t of this.held) t && this.game.ui.returnStack(t);
    ((this.held = []), (this.result = null));
  }
  stillValid() {
    if (!this.pos || this.net) return;
    const t = this.game.player,
      [e, s, n] = this.pos;
    (this.game.world.getBlock(e, s, n) !== this.blockId ||
      Math.hypot(t.pos[0] - e - 0.5, t.pos[1] - s - 0.5, t.pos[2] - n - 0.5) > 8) &&
      this.game.ui.close();
  }
}
class EnchantingScreen extends StationScreen {
  constructor(t, e, s) {
    (super(t, "gui_enchanting_table", s || "附魔", e),
      this.own(0, 15, 47, {
        max: 1,
        accept: (t) => 1 === t.count || 1 === maxStack(t.id) || "book" === ITEMS[t.id].key,
      }),
      this.own(1, 35, 47, {
        emptyIcon: "slot_lapis_lazuli",
        accept: (t) => t.id === ITEM_KEY.lapis_lazuli,
      }),
      this.addPlayerSlots(84, 142),
      (this.shelves = e ? countBookshelves(t.world, ...e) : 0),
      this.changed());
  }
  changed() {
    const t = this.game.player;
    (void 0 === t.enchSeed && (t.enchSeed = (Math.random() * 2 ** 31) | 0),
      (this.offers = enchantOffers(this.S(0), this.shelves, t.enchSeed)));
  }
  maxIn(t, e) {
    return t === this.slots[0] ? 1 : super.maxIn(t, e);
  }
  btn(t) {
    return { x: this.x + 60, y: this.y + 14 + 19 * t, w: 108, h: 19 };
  }
  usable(t) {
    const e = this.offers[t],
      s = this.game,
      n = this.S(1) ? this.S(1).count : 0;
    return !!e && (s.player.creative || (n >= t + 1 && s.xpLevel() >= e.cost));
  }
  drawMore(t) {
    const e = t.ctx,
      s = this.game;
    (SGA.init(t.img.font_sga),
      e.save(),
      e.translate(this.x + 28, this.y + 16),
      e.scale(2, 2),
      t.drawItem({ id: ITEM_KEY.enchanted_book, count: 1, g: !1 }, 0, 0),
      e.restore());
    let n = null;
    for (let i = 0; i < 3; i++) {
      const o = this.offers[i],
        r = this.btn(i);
      if (!o) {
        t.sprite("enchanting_table_enchantment_slot_disabled", r.x, r.y);
        continue;
      }
      const l = String(o.cost),
        a = 86 - Font.width(l),
        h = SGA.name((this.seed ?? s.player.enchSeed) + i, a);
      let c;
      if (this.usable(i)) {
        const s = t.hit(r);
        (t.sprite(
          s ? "enchanting_table_enchantment_slot_highlighted" : "enchanting_table_enchantment_slot",
          r.x,
          r.y,
        ),
          t.sprite("enchanting_table_level_" + (i + 1), r.x + 1, r.y + 1),
          h.forEach((t, n) => SGA.draw(e, t, r.x + 20, r.y + 2 + 8 * n, s ? "#FFFF80" : "#685E4A")),
          (c = "#80FF20"));
      } else
        (t.sprite("enchanting_table_enchantment_slot_disabled", r.x, r.y),
          t.sprite("enchanting_table_level_" + (i + 1) + "_disabled", r.x + 1, r.y + 1),
          h.forEach((t, s) => SGA.draw(e, t, r.x + 20, r.y + 2 + 8 * s, "#342F25")),
          (c = "#407F10"));
      (Font.draw(e, l, r.x + 20 + 86 - Font.width(l), r.y + 9, c),
        t.hit(r) && !t.cursor && (n = i));
    }
    if (null !== n) {
      const e = this.offers[n],
        i = e.clue,
        o = this.S(1) ? this.S(1).count : 0,
        r = i
          ? [
              {
                text:
                  (NET_ENCH_CN[i[0]] || i[0]) +
                  (ENCH[i[0]] && 1 === ENCH[i[0]].max ? "" : " " + romanNum(i[1])) +
                  "…？",
                color: "#FFFFFF",
              },
            ]
          : [];
      (s.player.creative ||
        (r.push({ text: "" }),
        s.xpLevel() < e.cost
          ? r.push({ text: "等级要求：" + e.cost, color: "#FF5555" })
          : (r.push({
              text: 0 === n ? "花费：1颗青金石" : "花费：" + (n + 1) + "颗青金石",
              color: o >= n + 1 ? "#AAAAAA" : "#FF5555",
            }),
            r.push({ text: 0 === n ? "+ 1级经验" : "+ " + (n + 1) + "级经验", color: "#AAAAAA" }))),
        t.tooltip(r, t.mouse.x, t.mouse.y));
    }
  }
  mouseDown(t, e, s, n, i) {
    const o = this.offerAt(e, s);
    o >= 0 ? this.pick(o) : super.mouseDown(t, e, s, n, i);
  }
  offerAt(t, e) {
    for (let s = 0; s < 3; s++) if (this.game.ui.hit(this.btn(s), t, e)) return s;
    return -1;
  }
  pick(t) {
    this.usable(t) && this.enchant(t);
  }
  enchant(t) {
    const e = this.game,
      s = e.player,
      n = this.offers[t],
      i = this.held[0],
      o = { ...i, e: n.list.map((t) => [...t]) };
    ("book" === ITEMS[i.id].key && (o.id = ITEM_KEY.enchanted_book),
      (this.held[0] = o),
      s.creative ||
        (e.addLevels(-(t + 1)),
        (this.held[1].count -= t + 1),
        this.held[1].count || (this.held[1] = null)),
      (s.enchSeed = (Math.random() * 2 ** 31) | 0),
      e.grant && e.grant("enchant_item"),
      Sound.ev(
        "block.enchantment_table.use",
        [this.pos[0] + 0.5, this.pos[1] + 0.5, this.pos[2] + 0.5],
        1,
        0.1 * Math.random() + 0.9,
      ),
      this.changed());
  }
  quickMove(t) {
    const e = t.get();
    if (e) {
      if ("container" !== t.group && e.id === ITEM_KEY.lapis_lazuli) {
        const s = this.slots[1],
          n = s.get();
        if (!n) return (s.set(e), void t.set(null));
        if (sameKind(n, e)) {
          const s = Math.min(e.count, maxStack(e.id) - n.count);
          return ((n.count += s), (e.count -= s), void (e.count || t.set(null)));
        }
      }
      if ("container" !== t.group && !this.held[0])
        return ((this.held[0] = { ...e, count: 1 }), e.count--, void (e.count || t.set(null)));
      super.quickMove(t);
    }
  }
}
const ANVIL_NEXT = { anvil: "chipped_anvil", chipped_anvil: "damaged_anvil", damaged_anvil: null };
class AnvilScreen extends StationScreen {
  constructor(t, e, s) {
    (super(t, "gui_anvil", s || "修复和命名", e),
      (this.titleX = 60),
      (this.name = ""),
      this.own(0, 27, 47),
      this.own(1, 76, 47),
      this.slots.push({
        x: 134,
        y: 47,
        output: !0,
        get: () => this.result,
        set: () => {},
        onTake: () => this.take(),
      }),
      this.addPlayerSlots(84, 142),
      this.changed());
  }
  layout() {
    super.layout();
    const t = this.game.ui;
    t.showInput(this.x + 62, this.y + 24, 103, 12, this.name, () => {}, {
      onInput: (t) => {
        ((this.name = t), this.changed(), this.onName && this.onName(t));
      },
      onEsc: () => t.close(),
      max: 50,
    });
  }
  changed() {
    const t = this.held[0];
    if (t !== this.lastLeft) {
      ((this.lastLeft = t), (this.name = t ? t.name || ITEMS[t.id].cn : ""));
      const e = this.game.ui.input;
      e && void 0 !== this.x && (e.value = this.name);
    }
    const e = anvilResult(t, this.held[1], t ? this.name : null, this.game.player.creative);
    ((this.res = e), (this.result = e && e.stack ? e.stack : null));
  }
  canTake() {
    const t = this.res;
    return t && t.stack && (this.game.player.creative || this.game.xpLevel() >= t.cost);
  }
  takeOutput(t, e, s) {
    this.canTake() && super.takeOutput(t, e, s);
  }
  take() {
    const t = this.game,
      e = this.res;
    (t.player.creative || t.addLevels(-e.cost), (this.held[0] = null));
    const s = this.held[1];
    (s && e.used
      ? ((s.count -= e.used), s.count <= 0 && (this.held[1] = null))
      : (this.held[1] = null),
      (this.lastLeft = null));
    const [n, i, o] = this.pos,
      r = t.world,
      l = r.getBlock(n, i, o),
      a = BLOCKS[l],
      h = [n + 0.5, i + 0.5, o + 0.5];
    if (!t.player.creative && Math.random() < 0.12) {
      const e = ANVIL_NEXT[a.key];
      if (null === e)
        return (
          r.setBlock(n, i, o, 0, 0),
          t.flushMesh(),
          Sound.ev("block.anvil.destroy", h, 1, 1),
          void t.ui.close()
        );
      if (e && void 0 !== BID[e]) {
        const s = r.getMeta(n, i, o);
        (r.setBlock(
          n,
          i,
          o,
          BID[e],
          Features.withProp(BID[e], 0, "facing", Features.propOf(l, s, "facing")),
        ),
          (this.blockId = BID[e]),
          t.flushMesh());
      }
    }
    Sound.ev("block.anvil.use", h, 1, 0.1 * Math.random() + 0.9);
  }
  drawMore(t) {
    const e = t.ctx,
      s = this.S(0);
    (this.net && this.netLeft(s),
      t.sprite(s ? "anvil_text_field" : "anvil_text_field_disabled", this.x + 59, this.y + 20),
      s && this.S(1) && !this.S(2) && t.sprite("anvil_error", this.x + 99, this.y + 45));
    const n = this.res;
    if (n && n.cost > 0) {
      const t = this.game,
        s = n.tooExpensive,
        i = s ? "过于昂贵！" : "附魔花费：" + n.cost,
        o = s || (!t.player.creative && t.xpLevel() < n.cost) ? "#FF6060" : "#80FF20",
        r = this.x + 176 - 8 - Font.width(i) - 2;
      ((e.fillStyle = "rgba(0,0,0,0.31)"),
        e.fillRect(r - 2, this.y + 67, this.x + 176 - 8 - (r - 2), 12),
        Font.draw(e, i, r, this.y + 69, o));
    }
  }
  close() {
    (super.close(), this.game.ui.hideInput());
  }
  key(t, e) {
    return document.activeElement === t.input || super.key(t, e);
  }
}
class GrindstoneScreen extends StationScreen {
  constructor(t, e, s) {
    super(t, "gui_grindstone", s || "修复和祛魔", e);
    const ok = (t) => !!ITEMS[t.id].durability || !(!t.e || !t.e.length);
    (this.own(0, 49, 19, { accept: ok }),
      this.own(1, 49, 40, { accept: ok }),
      this.slots.push({
        x: 129,
        y: 34,
        output: !0,
        get: () => this.result,
        set: () => {},
        onTake: () => this.take(),
      }),
      this.addPlayerSlots(84, 142),
      this.changed());
  }
  changed() {
    this.result = grindstoneResult(this.held[0], this.held[1]);
  }
  take() {
    const t = this.game,
      e = grindstoneXp(this.held[0], this.held[1]),
      [s, n, i] = this.pos;
    for (const t of [0, 1]) {
      const e = this.held[t];
      e && (e.count--, e.count || (this.held[t] = null));
    }
    (e && t.dropXp(s + 0.5, n + 0.5, i + 0.5, e),
      Sound.ev("block.grindstone.use", [s + 0.5, n + 0.5, i + 0.5], 1, 1));
  }
  drawMore(t) {
    (!this.S(0) && !this.S(1)) ||
      this.S(2) ||
      t.sprite("grindstone_error", this.x + 92, this.y + 31);
  }
}
class StonecutterScreen extends StationScreen {
  constructor(t, e, s) {
    (super(t, "gui_stonecutter", s || "切石机", e),
      (this.sel = -1),
      (this.scroll = 0),
      this.own(0, 20, 33),
      this.slots.push({
        x: 143,
        y: 33,
        output: !0,
        get: () => this.result,
        set: () => {},
        onTake: () => this.take(),
      }),
      this.addPlayerSlots(84, 142),
      this.changed());
  }
  recipes() {
    const t = this.S(0);
    return (t && STONECUTTING[t.id]) || [];
  }
  changed() {
    const t = this.held[0];
    (t && t.id) !== this.lastId && ((this.lastId = t && t.id), (this.sel = -1), (this.scroll = 0));
    const e = this.recipes()[this.sel];
    this.result = e ? { id: e.result, count: e.count, dmg: 0 } : null;
  }
  rows() {
    return Math.ceil(this.recipes().length / 4);
  }
  take() {
    const t = this.held[0];
    t &&
      (t.count--,
      t.count || (this.held[0] = null),
      Sound.ev("ui.stonecutter.take_result", null, 1, 1));
  }
  cell(t) {
    const e = t - 4 * this.scroll;
    return {
      x: this.x + 52 + (e % 4) * 16,
      y: this.y + 14 + 18 * Math.floor(e / 4) + 1,
      w: 16,
      h: 18,
    };
  }
  drawMore(t) {
    const e = this.recipes(),
      s = Math.max(0, this.rows() - 3),
      n = this.y + 15 + (s ? Math.round((this.scroll / s) * 41) : 0);
    t.sprite(s ? "stonecutter_scroller" : "stonecutter_scroller_disabled", this.x + 119, n);
    let i = null;
    for (let s = 4 * this.scroll; s < Math.min(e.length, 4 * this.scroll + 12); s++) {
      const n = this.cell(s),
        o = t.hit(n);
      (t.sprite(
        s === this.sel
          ? "stonecutter_recipe_selected"
          : o
            ? "stonecutter_recipe_highlighted"
            : "stonecutter_recipe",
        n.x,
        n.y,
      ),
        t.drawItem({ id: e[s].result, count: e[s].count }, n.x, n.y + 1),
        o && !t.cursor && (i = e[s]));
    }
    i && t.tooltip(t.itemLines({ id: i.result, count: i.count }), t.mouse.x, t.mouse.y);
  }
  mouseDown(t, e, s, n, i) {
    this.recipes();
    const o = this.offerAt(e, s);
    o >= 0 ? this.pick(o) : super.mouseDown(t, e, s, n, i);
  }
  offerAt(t, e) {
    const s = this.recipes();
    for (let n = 4 * this.scroll; n < Math.min(s.length, 4 * this.scroll + 12); n++)
      if (this.game.ui.hit(this.cell(n), t, e)) return n;
    return -1;
  }
  pick(t) {
    ((this.sel = t), this.changed(), Sound.ev("ui.stonecutter.select_recipe", null, 1, 1));
  }
  wheel(t, e) {
    this.scroll = clamp(this.scroll + Math.sign(e), 0, Math.max(0, this.rows() - 3));
  }
}
const TRIM_CN = {
    amethyst: "紫水晶质",
    copper: "铜质",
    diamond: "钻石质",
    emerald: "绿宝石质",
    gold: "金质",
    iron: "铁质",
    lapis: "青金石质",
    netherite: "下界合金质",
    quartz: "石英质",
    redstone: "红石质",
    resin: "树脂质",
  },
  TRIM_MAT_OF = {
    amethyst_shard: "amethyst",
    copper_ingot: "copper",
    diamond: "diamond",
    emerald: "emerald",
    gold_ingot: "gold",
    iron_ingot: "iron",
    lapis_lazuli: "lapis",
    netherite_ingot: "netherite",
    quartz: "quartz",
    redstone: "redstone",
    resin_brick: "resin",
  },
  TRIM_COLOR = {
    amethyst: "#9A5CC6",
    copper: "#B4684D",
    diamond: "#6EECD2",
    emerald: "#11A036",
    gold: "#DEB12D",
    iron: "#ECECEC",
    lapis: "#416E97",
    netherite: "#625859",
    quartz: "#E3D4C4",
    redstone: "#971607",
    resin: "#FC7812",
  },
  TRIM_PATTERN_CN = {
    bolt: "镶铆",
    coast: "海岸",
    dune: "沙丘",
    eye: "眼眸",
    flow: "涡流",
    host: "雇主",
    raiser: "牧民",
    rib: "肋骨",
    sentry: "哨兵",
    shaper: "塑造",
    silence: "幽静",
    snout: "猪鼻",
    spire: "尖塔",
    tide: "潮汐",
    vex: "恼鬼",
    ward: "监守",
    wayfinder: "向导",
    wild: "荒野",
  };
function smithingRecipe(t, e, s) {
  return (
    (t &&
      e &&
      s &&
      SMITHING.find(
        (n) => n.template.includes(t.id) && n.base.includes(e.id) && n.addition.includes(s.id),
      )) ||
    null
  );
}
class SmithingScreen extends StationScreen {
  constructor(t, e, s) {
    (super(t, "gui_smithing", s || "升级装备", e),
      (this.titleX = 44),
      (this.titleY = 15),
      this.own(0, 8, 48, {
        emptyIcon: "slot_smithing_template_netherite_upgrade",
        accept: (t) => SMITHING.some((e) => e.template.includes(t.id)),
      }),
      this.own(1, 26, 48, { max: 1 }),
      this.own(2, 44, 48, { emptyIcon: "slot_ingot" }),
      this.slots.push({
        x: 98,
        y: 48,
        output: !0,
        get: () => this.result,
        set: () => {},
        onTake: () => this.take(),
      }),
      this.addPlayerSlots(84, 142),
      this.changed());
  }
  changed() {
    const [t, e, s] = this.held,
      n = smithingRecipe(t, e, s);
    if (n)
      if (n.trim) {
        const t = TRIM_MAT_OF[ITEMS[s.id].key],
          i = { pattern: n.pattern, material: t };
        this.result =
          e.trim && e.trim.pattern === i.pattern && e.trim.material === t
            ? null
            : { ...e, count: 1, trim: i };
      } else this.result = { ...e, id: n.result, count: 1 };
    else this.result = null;
  }
  take() {
    for (const t of [0, 1, 2]) {
      const e = this.held[t];
      e && (e.count--, e.count || (this.held[t] = null));
    }
    Sound.ev(
      "block.smithing_table.use",
      [this.pos[0] + 0.5, this.pos[1] + 0.5, this.pos[2] + 0.5],
      1,
      1,
    );
  }
  drawBase(t) {
    (t.dim(0.6),
      t.ctx.drawImage(t.img[this.bg], 0, 0, this.gw, this.gh, this.x, this.y, this.gw, this.gh),
      Font.draw(t.ctx, this.title, this.x + 44, this.y + 15, "#404040", !1));
  }
  drawMore(t) {
    const e = this.S(0),
      s = this.S(1),
      n = this.S(2),
      i = this.S(3);
    e && s && n && !i && t.sprite("smithing_error", this.x + 65, this.y + 46);
    const o = i || s;
    o &&
      (t.ctx.save(),
      t.ctx.translate(this.x + 125, this.y + 28),
      t.ctx.scale(2, 2),
      t.drawItem({ ...o, count: 1 }, 0, 0),
      t.ctx.restore());
  }
}
const BREW_MIXES = [];
!(function () {
  const add = (t, e, s) => BREW_MIXES.push([t, e, s]);
  for (const t of [
    "glistering_melon_slice",
    "ghast_tear",
    "rabbit_foot",
    "blaze_powder",
    "spider_eye",
    "sugar",
    "magma_cream",
    "redstone",
  ])
    add("water", t, "mundane");
  (add("water", "glowstone_dust", "thick"),
    add("water", "nether_wart", "awkward"),
    add("water", "fermented_spider_eye", "weakness"),
    add("awkward", "breeze_rod", "wind_charged"),
    add("awkward", "slime_block", "oozing"),
    add("awkward", "stone", "infested"),
    add("awkward", "cobweb", "weaving"),
    add("awkward", "golden_carrot", "night_vision"),
    add("night_vision", "redstone", "long_night_vision"),
    add("night_vision", "fermented_spider_eye", "invisibility"),
    add("long_night_vision", "fermented_spider_eye", "long_invisibility"),
    add("invisibility", "redstone", "long_invisibility"),
    add("awkward", "magma_cream", "fire_resistance"),
    add("fire_resistance", "redstone", "long_fire_resistance"),
    add("awkward", "rabbit_foot", "leaping"),
    add("leaping", "redstone", "long_leaping"),
    add("leaping", "glowstone_dust", "strong_leaping"),
    add("leaping", "fermented_spider_eye", "slowness"),
    add("long_leaping", "fermented_spider_eye", "long_slowness"),
    add("slowness", "redstone", "long_slowness"),
    add("slowness", "glowstone_dust", "strong_slowness"),
    add("awkward", "turtle_helmet", "turtle_master"),
    add("turtle_master", "redstone", "long_turtle_master"),
    add("turtle_master", "glowstone_dust", "strong_turtle_master"),
    add("swiftness", "fermented_spider_eye", "slowness"),
    add("long_swiftness", "fermented_spider_eye", "long_slowness"),
    add("awkward", "sugar", "swiftness"),
    add("swiftness", "redstone", "long_swiftness"),
    add("swiftness", "glowstone_dust", "strong_swiftness"),
    add("awkward", "pufferfish", "water_breathing"),
    add("water_breathing", "redstone", "long_water_breathing"),
    add("awkward", "glistering_melon_slice", "healing"),
    add("healing", "glowstone_dust", "strong_healing"),
    add("healing", "fermented_spider_eye", "harming"),
    add("strong_healing", "fermented_spider_eye", "strong_harming"),
    add("harming", "glowstone_dust", "strong_harming"),
    add("poison", "fermented_spider_eye", "harming"),
    add("long_poison", "fermented_spider_eye", "harming"),
    add("strong_poison", "fermented_spider_eye", "strong_harming"),
    add("awkward", "spider_eye", "poison"),
    add("poison", "redstone", "long_poison"),
    add("poison", "glowstone_dust", "strong_poison"),
    add("awkward", "ghast_tear", "regeneration"),
    add("regeneration", "redstone", "long_regeneration"),
    add("regeneration", "glowstone_dust", "strong_regeneration"),
    add("awkward", "blaze_powder", "strength"),
    add("strength", "redstone", "long_strength"),
    add("strength", "glowstone_dust", "strong_strength"),
    add("weakness", "redstone", "long_weakness"),
    add("awkward", "phantom_membrane", "slow_falling"),
    add("slow_falling", "redstone", "long_slow_falling"));
})();
const POTION_ITEMS = new Set(["potion", "splash_potion", "lingering_potion"]),
  isPotion = (t) => t && POTION_ITEMS.has(ITEMS[t.id].key),
  BREW_INGREDIENTS = new Set([...BREW_MIXES.map((t) => t[1]), "gunpowder", "dragon_breath"]);
function brewResult(t, e) {
  if (!isPotion(t) || !e) return null;
  const s = ITEMS[e.id].key,
    n = ITEMS[t.id].key;
  if ("gunpowder" === s) return "potion" === n ? { ...t, id: ITEM_KEY.splash_potion } : null;
  if ("dragon_breath" === s)
    return "splash_potion" === n ? { ...t, id: ITEM_KEY.lingering_potion } : null;
  const i = BREW_MIXES.find(([e, n]) => e === (t.pot || "water") && n === s);
  return i ? { ...t, pot: i[2] } : null;
}
function canBrew(t) {
  return !!t.ingredient && t.bottles.some((e) => brewResult(e, t.ingredient));
}
Game.prototype.tickBrewing = function (t) {
  const [e, s, n] = t.pos,
    i = this.world;
  t.fuelLeft <= 0 &&
    t.fuel &&
    t.fuel.id === ITEM_KEY.blaze_powder &&
    ((t.fuelLeft = 20), t.fuel.count--, t.fuel.count || (t.fuel = null));
  const o = canBrew(t),
    r = t.ingredient && t.ingredient.id;
  if (t.brewTime > 0)
    if ((t.brewTime--, 0 === t.brewTime && o)) {
      t.bottles = t.bottles.map((e) => brewResult(e, t.ingredient) || e);
      const i = ITEMS[t.ingredient.id].key;
      (t.ingredient.count--,
        t.ingredient.count ||
          (t.ingredient = "dragon_breath" === i ? makeStack("glass_bottle") : null),
        Sound.ev("block.brewing_stand.brew", [e + 0.5, s + 0.5, n + 0.5], 1, 1));
    } else (o && r === t.ingId) || (t.brewTime = 0);
  else o && t.fuelLeft > 0 && (t.fuelLeft--, (t.brewTime = 400), (t.ingId = r));
  const l = i.getBlock(e, s, n);
  if (l === BID.brewing_stand) {
    let o = i.getMeta(e, s, n);
    for (let e = 0; e < 3; e++)
      o = Features.withProp(l, o, "has_bottle_" + e, t.bottles[e] ? "true" : "false");
    o !== i.getMeta(e, s, n) && i.setMeta(e, s, n, o);
  }
};
const _tickFurnaces = Game.prototype.tickFurnaces;
Game.prototype.tickFurnaces = function () {
  _tickFurnaces.call(this);
  for (const t of this.blockEntities.values())
    "brewing" === t.type && this.world.isLoaded(t.pos[0], t.pos[2]) && this.tickBrewing(t);
};
class BrewingScreen extends ContainerScreen {
  constructor(t, e, s) {
    (super(t, "gui_brewing_stand", 176, 166, s || "酿造台"), (this.be = e));
    const bottle = (t, s, n) =>
      this.slots.push({
        x: s,
        y: n,
        group: "container",
        emptyIcon: "slot_potion",
        max: 1,
        get: () => e.bottles[t],
        set: (s) => {
          e.bottles[t] = s;
        },
        accept: (t) => isPotion(t) || t.id === ITEM_KEY.glass_bottle,
      });
    (bottle(0, 56, 51),
      bottle(1, 79, 58),
      bottle(2, 102, 51),
      this.slots.push({
        x: 79,
        y: 17,
        group: "container",
        get: () => e.ingredient,
        set: (t) => {
          e.ingredient = t;
        },
        accept: (t) => BREW_INGREDIENTS.has(ITEMS[t.id].key),
      }),
      this.slots.push({
        x: 17,
        y: 17,
        group: "container",
        emptyIcon: "slot_brewing_fuel",
        get: () => e.fuel,
        set: (t) => {
          e.fuel = t;
        },
        accept: (t) => t.id === ITEM_KEY.blaze_powder,
      }),
      this.addPlayerSlots(84, 142));
  }
  maxIn(t, e) {
    return t.max || super.maxIn(t, e);
  }
  quickMove(t) {
    const e = t.get();
    if (e) {
      if ("container" !== t.group) {
        const s = ITEMS[e.id].key,
          n =
            "blaze_powder" === s && (!this.be.fuel || this.be.fuel.count < 64)
              ? this.slots[4]
              : BREW_INGREDIENTS.has(s)
                ? this.slots[3]
                : null;
        if (n) {
          const s = n.get();
          if (!s) return (n.set(e), void t.set(null));
          if (sameKind(s, e)) {
            const n = Math.min(e.count, maxStack(e.id) - s.count);
            return ((s.count += n), (e.count -= n), void (e.count || t.set(null)));
          }
        }
        if (isPotion(e))
          for (const s of this.slots.slice(0, 3))
            if (!s.get() && (s.set({ ...e, count: 1 }), e.count--, !e.count))
              return void t.set(null);
        return;
      }
      super.quickMove(t);
    }
  }
  drawExtra(t) {
    const e = this.be,
      s = t.ctx,
      n = clamp(Math.floor((18 * e.fuelLeft + 20 - 1) / 20), 0, 18);
    if (
      (n > 0 &&
        s.drawImage(t.img.brewing_stand_fuel_length, 0, 0, n, 4, this.x + 60, this.y + 44, n, 4),
      e.brewTime > 0)
    ) {
      const n = Math.floor(28 * (1 - e.brewTime / 400));
      n > 0 &&
        s.drawImage(t.img.brewing_stand_brew_progress, 0, 0, 9, n, this.x + 97, this.y + 16, 9, n);
      const i = [29, 24, 20, 16, 11, 6, 0][Math.floor(e.brewTime / 2) % 7];
      i > 0 &&
        s.drawImage(
          t.img.brewing_stand_bubbles,
          0,
          29 - i,
          12,
          i,
          this.x + 63,
          this.y + 14 + 29 - i,
          12,
          i,
        );
    }
    Font.draw(s, "物品栏", this.x + 8, this.y + 72, "#404040", !1);
  }
  close() {
    this.game.markBlockEntity(this.be);
  }
}
const WORKSTATIONS = {
  enchanting: (t, e, s) => new EnchantingScreen(t, e, s.cn),
  anvil: (t, e) => new AnvilScreen(t, e),
  grindstone: (t, e) => new GrindstoneScreen(t, e),
  stonecutter: (t, e) => new StonecutterScreen(t, e),
  smithing: (t, e) => new SmithingScreen(t, e),
  brewing: (t, e, s) => {
    const n = t.getBlockEntity(...e, "brewing");
    return (
      n.bottles ||
        Object.assign(n, {
          bottles: [null, null, null],
          ingredient: null,
          fuel: null,
          fuelLeft: 0,
          brewTime: 0,
        }),
      new BrewingScreen(t, n, s.cn)
    );
  },
};
for (const [t, e] of [
  ["enchanting_table", "enchanting"],
  ["anvil", "anvil"],
  ["chipped_anvil", "anvil"],
  ["damaged_anvil", "anvil"],
  ["grindstone", "grindstone"],
  ["stonecutter", "stonecutter"],
  ["smithing_table", "smithing"],
  ["brewing_stand", "brewing"],
])
  void 0 !== BID[t] && (BLOCKS[BID[t]].onUse = e);
Game.prototype.openWorkstation = function (t, e, s, n) {
  const i = WORKSTATIONS[t.onUse](this, [e, s, n], t);
  ((i.blockId = this.world.getBlock(e, s, n)), this.ui.open(i));
};
//# sourceURL=js/workstations.js
