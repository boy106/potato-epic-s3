"use strict";
const Font = {
  img: null,
  cache: new Map(),
  wc: new Map(),
  adv: {},
  mctx: null,
  emo: null,
  emoImg: null,
  noEmo: !1,
  FACE: '"Bahnschrift","DIN Alternate","Segoe UI","HarmonyOS Sans SC","PingFang SC","Microsoft YaHei UI","Microsoft YaHei","Noto Sans SC","Source Han Sans SC",sans-serif',
  PX: 9,
  ASC: 7.6,
  H: 9,
  PAD: 2,
  font(t) {
    return "600 " + t + "px " + this.FACE;
  },
  init(t) {
    this.img = t;
    const e = window.EMOJI;
    if (e) {
      this.emo = new Map([...e.chars].map((t, e) => [t, e]));
      const t = new Image();
      ((t.onload = () => {
        ((this.emoImg = t), this.cache.clear());
      }),
        (t.src = e.src));
    }
    try {
      document.fonts && document.fonts.ready && document.fonts.ready.then(() => this.reset());
    } catch (t) {}
  },
  reset() {
    (this.cache.clear(), this.wc.clear(), (this.adv = {}));
  },
  zero: (t) => "️" === t || "‍" === t || "︎" === t,
  measure(t) {
    let e = this.wc.get(t);
    if (void 0 === e) {
      const s = this.mctx || (this.mctx = document.createElement("canvas").getContext("2d"));
      ((s.font = this.font(4 * this.PX)),
        (e = Math.round((s.measureText(t).width / 4) * 4) / 4),
        this.wc.size > 6e3 && this.wc.clear(),
        this.wc.set(t, e));
    }
    return e;
  },
  icon(t) {
    const e = t.codePointAt(0);
    return e >= 57344 && e <= 63743;
  },
  charW(t) {
    return this.zero(t) ? 0 : (this.emo && this.emo.has(t)) || this.icon(t) ? 9 : this.measure(t);
  },
  runs(t) {
    const e = [];
    let s = "";
    for (const i of String(t))
      this.zero(i) ||
        (this.emo && this.emo.has(i)
          ? (s && (e.push(s), (s = "")), e.push(this.emo.get(i)))
          : this.icon(i)
            ? (s && (e.push(s), (s = "")), e.push(-1))
            : (s += i));
    return (s && e.push(s), e);
  },
  width(t) {
    let e = 0;
    for (const s of this.runs(t)) e += "number" == typeof s ? 9 : this.measure(s);
    return e;
  },
  render(t, e, s = 2, i = !1) {
    const o = e + "\0" + s + (i ? "s" : "") + (this.noEmo ? "n" : "") + "\0" + t;
    let n = this.cache.get(o);
    if (n) return (this.cache.delete(o), this.cache.set(o, n), n);
    const r = this.PAD,
      h = this.width(t);
    ((n = document.createElement("canvas")),
      (n.width = Math.max(1, Math.ceil((h + 2 * r) * s))),
      (n.height = Math.ceil((this.H + 2 * r) * s)));
    const a = n.getContext("2d");
    ((a.font = this.font(this.PX * s)),
      (a.textBaseline = "alphabetic"),
      (a.fillStyle = e),
      i &&
        ((a.shadowColor = "rgba(0,0,0,0.62)"),
        (a.shadowBlur = 1.4 * s),
        (a.shadowOffsetX = 0.35 * s),
        (a.shadowOffsetY = 0.55 * s)));
    let l = r;
    for (const e of this.runs(t))
      if ("number" != typeof e) (a.fillText(e, l * s, (r + this.ASC) * s), (l += this.measure(e)));
      else {
        if (e >= 0 && !this.noEmo && this.emoImg) {
          const t = window.EMOJI,
            i = t.size;
          (a.save(),
            (a.shadowColor = "transparent"),
            a.drawImage(
              this.emoImg,
              (e % t.cols) * i,
              Math.floor(e / t.cols) * i,
              i,
              i,
              (l + 0.5) * s,
              (r - 0.2) * s,
              8.5 * s,
              8.5 * s,
            ),
            a.restore());
        }
        l += 9;
      }
    return (
      this.cache.set(o, n),
      this.cache.size > 900 && this.cache.delete(this.cache.keys().next().value),
      n
    );
  },
  scaleOf(t) {
    let e = 2;
    try {
      const s = t.getTransform();
      e = Math.hypot(s.a, s.b);
    } catch (t) {}
    return Math.max(1, Math.min(12, Math.round(2 * e) / 2));
  },
  drawRaw(t, e, s, i, o, n = !1) {
    if (!(e = String(e))) return s;
    const r = this.scaleOf(t),
      h = this.render(e, o, r, n),
      a = this.PAD,
      l = t.imageSmoothingEnabled;
    return (
      (t.imageSmoothingEnabled = !0),
      t.drawImage(h, 0, 0, h.width, h.height, s - a, i - a, h.width / r, h.height / r),
      (t.imageSmoothingEnabled = l),
      s + this.width(e)
    );
  },
  draw(t, e, s, i, o = "#FFFFFF", n = !0) {
    return this.drawRaw(t, e, s, i, o, n);
  },
  center(t, e, s, i, o, n = !0) {
    this.draw(t, e, Math.round(s - this.width(e) / 2), i, o, n);
  },
};
function shade(t) {
  const e = parseInt(t.slice(1), 16);
  return (
    "#" +
    [((e >> 16) & 255) >> 2, ((e >> 8) & 255) >> 2, (255 & e) >> 2]
      .map((t) => t.toString(16).padStart(2, "0"))
      .join("")
  );
}
const iconSmooth = (t) => {
    const e = ITEMS[t];
    return !(!e || !e.block || e.flat || !BLOCKS[t] || BLOCKS[t].shape === SH_CROSS);
  },
  SHINE_GOLD = {
    top: ["rgba(246,205,80,0.9)", "rgba(255,226,120,0.92)"],
    bottom: ["rgba(190,132,24,0.9)", "rgba(214,160,40,0.92)"],
    light: "rgba(255,248,210,0.55)",
    dark: "rgba(110,70,0,0.55)",
    glint: "rgba(255,255,220,",
    edge: ["#E8B830", "#FFF2B0"],
  },
  SHINE_BLUE = {
    top: ["rgba(96,176,255,0.92)", "rgba(130,200,255,0.94)"],
    bottom: ["rgba(30,96,226,0.92)", "rgba(50,120,240,0.94)"],
    light: "rgba(214,236,255,0.6)",
    dark: "rgba(0,36,110,0.55)",
    glint: "rgba(230,246,255,",
    edge: ["#4AA8FF", "#D2EAFF"],
  };
class UI {
  constructor(t, e) {
    ((this.game = t),
      (this.canvas = e),
      (this.ctx = e.getContext("2d")),
      (this.scale = 2),
      (this.w = 320),
      (this.h = 240),
      (this.mouse = { x: 0, y: 0, down: !1, button: -1 }),
      (this.screen = null),
      (this.cursor = null),
      (this.chat = []),
      (this.toasts = []),
      (this.subs = []),
      (Sound.onPlay = (t, e, s) => this.hearSound(t, e, s)),
      (this.itemNameT = 0),
      (this.lastSel = -1),
      (this.debug = !1),
      (this.hideHud = !1),
      (this.input = document.getElementById("textinput")),
      (this.drag = null));
  }
  get img() {
    return this.game.renderer.images;
  }
  resize() {
    const t = Math.min(window.devicePixelRatio || 1, 2);
    ((this.canvas.width = Math.floor(window.innerWidth * t)),
      (this.canvas.height = Math.floor(window.innerHeight * t)));
    const e = Math.max(
        1,
        Math.min(Math.floor(this.canvas.width / 320), Math.floor(this.canvas.height / 240)),
      ),
      s = this.game.settings.guiScale;
    ((this.scale = s ? Math.min(s * t, e) : Math.min(e, Math.round(3 * t))),
      (this.scale = Math.max(1, Math.floor(this.scale))),
      (this.w = Math.ceil(this.canvas.width / this.scale)),
      (this.h = Math.ceil(this.canvas.height / this.scale)),
      (this.dpr = t),
      this.screen && this.screen.layout && this.screen.layout());
  }
  toGui(t) {
    const e = this.canvas.getBoundingClientRect();
    return [
      ((t.clientX - e.left) * this.dpr) / this.scale,
      ((t.clientY - e.top) * this.dpr) / this.scale,
    ];
  }
  open(t) {
    this.screen && this.screen.close && this.screen.close();
    const e = (this.screen && this.screen.needW) || (t && t.needW);
    if (((this.screen = t), this.hideInput(), e && this.resize(), t)) {
      t.layout && !e && t.layout();
      const s = this.game,
        i =
          s.rawMouse &&
          (s.rawMouse[0] || s.rawMouse[1] || s.rawMouse[2]) &&
          document.pointerLockElement === s.canvas;
      t.keepPointer || (i ? (s.unlockOnUp = !0) : s.releasePointer());
    }
  }
  close() {
    ((this.game.unlockOnUp = !1), this.screen && this.screen.close && this.screen.close());
    const t = this.screen && this.screen.needW;
    ((this.screen = null),
      t && this.resize(),
      this.cursor && (this.returnStack(this.cursor), (this.cursor = null)),
      this.hideInput(),
      this.game.capturePointer());
  }
  returnStack(t) {
    const e = this.game.player.inv.add(t);
    e && this.game.dropFromPlayer({ ...t, count: e });
  }
  pendingStacks() {
    const t = this.screen,
      e = [];
    if ((this.cursor && e.push(this.cursor), t && Array.isArray(t.grid)))
      for (const s of t.grid) s && e.push(s);
    if (t && Array.isArray(t.held)) for (const s of t.held) s && e.push(s);
    return e;
  }
  message(t, e = "#FFFFFF") {
    (this.chat.push({ text: t, color: e, t: performance.now() }),
      this.chat.length > 100 && this.chat.shift());
  }
  pinMessage(t, e, s = "#FFAA00") {
    this.pinned = { text: t, color: s, until: performance.now() + e };
  }
  toast(t, e, s) {
    (this.toasts.push({ title: t, sub: e, icon: s, t: performance.now() }), Sound.toast());
  }
  sprite(t, e, s, i, o, n = 0, r = 0, h, a) {
    const l = this.img[t];
    this.ctx.drawImage(
      l,
      n,
      r,
      h ?? i ?? l.width,
      a ?? o ?? l.height,
      e,
      s,
      i ?? l.width,
      o ?? l.height,
    );
  }
  bossPurple() {
    if (this.img.boss_purple_bg) return !0;
    const t = [this.img.boss_bg, this.img.boss_fg];
    if (t.some((t) => !t || !t.width || !1 === t.complete)) return !1;
    const e = t.map((t) => {
      const e = document.createElement("canvas");
      ((e.width = t.width), (e.height = t.height));
      const s = e.getContext("2d");
      s.drawImage(t, 0, 0);
      const i = s.getImageData(0, 0, e.width, e.height),
        o = i.data;
      for (let t = 0; t < o.length; t += 4) {
        const e = o[t];
        ((o[t] = Math.round(0.52 * e)), (o[t + 1] = 0), (o[t + 2] = e));
      }
      return (s.putImageData(i, 0, 0), e);
    });
    return ((this.img.boss_purple_bg = e[0]), (this.img.boss_purple_fg = e[1]), !0);
  }
  nine(t, e, s, i, o, n) {
    const r = this.img[t],
      h = this.ctx,
      a = r.width,
      l = r.height,
      c = n;
    (h.drawImage(r, 0, 0, c, c, e, s, c, c),
      h.drawImage(r, a - c, 0, c, c, e + i - c, s, c, c),
      h.drawImage(r, 0, l - c, c, c, e, s + o - c, c, c),
      h.drawImage(r, a - c, l - c, c, c, e + i - c, s + o - c, c, c),
      h.drawImage(r, c, 0, a - 2 * c, c, e + c, s, i - 2 * c, c),
      h.drawImage(r, c, l - c, a - 2 * c, c, e + c, s + o - c, i - 2 * c, c),
      h.drawImage(r, 0, c, c, l - 2 * c, e, s + c, c, o - 2 * c),
      h.drawImage(r, a - c, c, c, l - 2 * c, e + i - c, s + c, c, o - 2 * c),
      h.drawImage(r, c, c, a - 2 * c, l - 2 * c, e + c, s + c, i - 2 * c, o - 2 * c));
  }
  drawItem(t, e, s, i = {}) {
    if (!t) return;
    const o = this.game.renderer,
      n = this.ctx,
      r = t.id,
      h = ITEMS[r];
    if (
      ((n.imageSmoothingEnabled = iconSmooth(r)),
      (n.imageSmoothingQuality = "high"),
      t.unk || !h
        ? ((n.fillStyle = "#000"),
          n.fillRect(e, s, 16, 16),
          (n.fillStyle = "#F800F8"),
          n.fillRect(e, s, 8, 8),
          n.fillRect(e + 8, s + 8, 8, 8))
        : "shield" === h.key && o.shieldStackIcon && o.shieldStackIcon(t)
          ? n.drawImage(o.shieldStackIcon(t), e, s, 16, 16)
          : stackTinted(t) && o.stackIcon(r, t)
            ? n.drawImage(o.stackIcon(r, t), e, s, 16, 16)
            : "function" == typeof itemStateTex && itemStateTex(t, this.game.player)
              ? n.drawImage(o.tileIcon(itemStateTex(t, this.game.player)), e, s, 16, 16)
              : n.drawImage(this.itemIcon(r), e, s, 16, 16),
      (n.imageSmoothingEnabled = !1),
      (n.imageSmoothingQuality = "low"),
      h && (t.g || (!1 !== t.g && ((t.e && t.e.length) || h.glint))) && this.drawGlint(t, e, s),
      h && h.durability && t.dmg > 0)
    ) {
      const i = 1 - t.dmg / h.durability;
      ((n.fillStyle = "#000"),
        n.fillRect(e + 2, s + 13, 13, 2),
        (n.fillStyle = `hsl(${Math.round(120 * i)},100%,50%)`),
        n.fillRect(e + 2, s + 13, Math.round(13 * i), 1));
    }
    if (t.count > 1 || i.showCount) {
      const i = String(t.count);
      Font.draw(n, i, e + 17 - Font.width(i), s + 9, "#FFFFFF");
    }
  }
  itemIcon(t) {
    const e = this.game.renderer,
      s = e.iconSize,
      i = Math.min(s, 16 * this.scale);
    (this.iconsOf === e.iconAtlas && this.iconD === i) ||
      ((this.iconsOf = e.iconAtlas), (this.iconD = i), (this.icons = new Map()));
    const o = this.icons;
    let n = o.get(t);
    if (n) return (o.delete(t), o.set(t, n), n);
    ((n = document.createElement("canvas")), (n.width = n.height = i));
    const r = n.getContext("2d");
    return (
      i === s
        ? r.drawImage(e.iconAtlas, ...e.iconXY(t), s, s, 0, 0, s, s)
        : ((r.imageSmoothingEnabled = iconSmooth(t)),
          (r.imageSmoothingQuality = "high"),
          r.drawImage(this.iconCopy(t), 0, 0, s, s, 0, 0, i, i)),
      o.set(t, n),
      o.size > 2048 && o.delete(o.keys().next().value),
      n
    );
  }
  iconCopy(t) {
    const e = this.game.renderer,
      s = e.iconSize,
      i = document.createElement("canvas");
    return (
      (i.width = i.height = s),
      i.getContext("2d").drawImage(e.iconAtlas, ...e.iconXY(t), s, s, 0, 0, s, s),
      i
    );
  }
  drawGlint(t, e, s) {
    const i = this.game.renderer.iconSize,
      o = t.id,
      n = this.glints || (this.glints = new Map());
    let r = n.get(o);
    if (!r) {
      ((r = document.createElement("canvas")), (r.width = r.height = 16));
      const t = r.getContext("2d");
      (t.drawImage(this.iconCopy(o), 0, 0, i, i, 0, 0, 16, 16),
        (t.globalCompositeOperation = "source-atop"),
        (t.fillStyle = "#A050FF"),
        t.fillRect(0, 0, 16, 16),
        n.set(o, r));
    }
    const h = this.ctx;
    ((h.globalAlpha = 0.25 + 0.2 * Math.sin(performance.now() / 400 + 0.05 * e)),
      h.drawImage(r, e, s),
      (h.globalAlpha = 1));
  }
  tooltip(t, e, s) {
    const i = this.ctx;
    let o = 0;
    for (const e of t) o = Math.max(o, Font.width(e.text));
    const n = 10 * t.length + (t.length > 1 ? 2 : 0) - 2;
    let r = e + 12,
      h = s - 12;
    (r + o + 4 > this.w && (r = e - o - 16),
      h + n + 6 > this.h && (h = this.h - n - 6),
      (i.fillStyle = "rgba(16,0,16,0.94)"),
      i.fillRect(r - 3, h - 4, o + 6, n + 8),
      i.fillRect(r - 4, h - 3, o + 8, n + 6),
      (i.fillStyle = "rgba(80,0,255,0.32)"),
      i.fillRect(r - 3, h - 3, o + 6, 1),
      i.fillRect(r - 3, h + n + 2, o + 6, 1),
      i.fillRect(r - 3, h - 3, 1, n + 6),
      i.fillRect(r + o + 2, h - 3, 1, n + 6));
    let a = h;
    t.forEach((t, e) => {
      (Font.draw(i, t.text, r, a, t.color || "#FFFFFF"), (a += 0 === e ? 12 : 10));
    });
  }
  tipLines(t) {
    return ITEMS[t.id] || t.unk ? this.itemLines(t) : this.unknownLines(t);
  }
  unknownLines(t) {
    return [
      { text: "未知物品", color: "#FFFFFF" },
      { text: "#" + t.id, color: "#555555" },
    ];
  }
  itemLines(t) {
    if (t.unk)
      return netItemLines(t, [
        { text: "未知物品", color: "#FFFFFF" },
        { text: String(t.unk), color: "#555555" },
      ]);
    const e = ITEMS[t.id];
    if (!e) return this.unknownLines(t);
    const s = Math.max(0, ["common", "uncommon", "rare", "epic"].indexOf(e.rarity || "common")),
      i = t.e && t.e.length ? (s < 2 ? 2 : 3) : s,
      o = [{ text: e.cn, color: ["#FFFFFF", "#FFFF55", "#55FFFF", "#FF55FF"][i] }];
    if (t.trim && "undefined" != typeof TRIM_CN) {
      const e = TRIM_COLOR[t.trim.material] || "#AAAAAA";
      o.push(
        { text: "已有升级：", color: "#AAAAAA" },
        { text: " " + (TRIM_PATTERN_CN[t.trim.pattern] || t.trim.pattern) + "盔甲纹饰", color: e },
        { text: " " + (TRIM_CN[t.trim.material] || t.trim.material), color: e },
      );
    }
    if (
      (e.food && o.push({ text: `食物: +${e.food[0]} 饥饿值`, color: "#AAAAAA" }),
      (e.tool || e.attack) && o.push({ text: `攻击伤害: ${e.attack}`, color: "#00AA00" }),
      e.armor && e.armor.points && o.push({ text: `护甲值: +${e.armor.points}`, color: "#5555FF" }),
      e.armor && e.armor.tough && o.push({ text: `盔甲韧性: +${e.armor.tough}`, color: "#5555FF" }),
      e.durability &&
        o.push({
          text: `耐久度: ${e.durability - (t.dmg || 0)} / ${e.durability}`,
          color: "#AAAAAA",
        }),
      fuelValue(t.id) &&
        o.push({ text: `燃料: ${(fuelValue(t.id) / 200).toFixed(1)} 个物品`, color: "#777777" }),
      this.game.settings.advTooltips && o.push({ text: e.key, color: "#555555" }),
      (t.name || t.e || t.pot || t.lore) && netItemLines(t, o),
      t.pot && !this.game.net)
    ) {
      const e = o.findIndex((t, e) => e > 0 && ("#5555FF" === t.color || "#AAAAAA" === t.color));
      (e > 0 && o.splice(e, 1), potionLines(t, o));
    }
    return o;
  }
  button(t) {
    const e = this.hit(t) && !1 !== t.enabled;
    this.nine(!1 === t.enabled ? "button_dis" : e ? "button_hl" : "button", t.x, t.y, t.w, t.h, 3);
    const s = this.ctx,
      i = t.goldFrom ? Math.min(1, (performance.now() - t.goldFrom) / 700) : 1;
    if (
      ((t.gold || t.glowBlue) &&
        !1 !== t.enabled &&
        (s.save(), (s.globalAlpha = i), this.goldShine(t, e), s.restore()),
      t.tint &&
        !1 !== t.enabled &&
        ((s.fillStyle = t.tint),
        s.fillRect(t.x + 1, t.y + 1, t.w - 2, t.h - 2),
        e &&
          ((s.fillStyle = "rgba(255,255,255,0.12)"),
          s.fillRect(t.x + 1, t.y + 1, t.w - 2, t.h - 2))),
      t.blue &&
        !1 !== t.enabled &&
        ((s.fillStyle = e ? "rgba(80,140,255,0.6)" : "rgba(40,90,220,0.55)"),
        s.fillRect(t.x + 1, t.y + 1, t.w - 2, t.h - 2)),
      t.icon)
    ) {
      const e = this.img[t.icon];
      return void (
        e &&
        s.drawImage(
          e,
          Math.floor(t.x + (t.w - e.width) / 2),
          Math.floor(t.y + (t.h - e.height) / 2),
        )
      );
    }
    const o = !1 === t.enabled ? "#A0A0A0" : t.color || "#FFFFFF",
      n = t.y + (t.h - 8) / 2;
    if (i < 1 && t.fromLabel)
      return (
        s.save(),
        (s.globalAlpha = i < 0.5 ? 1 - 2 * i : 2 * i - 1),
        Font.center(
          s,
          i < 0.5 ? t.fromLabel : "function" == typeof t.label ? t.label() : t.label,
          t.x + t.w / 2,
          n,
          o,
        ),
        void s.restore()
      );
    Font.center(s, "function" == typeof t.label ? t.label() : t.label, t.x + t.w / 2, n, o);
  }
  goldShine(t, e) {
    const s = this.ctx,
      i = performance.now() / 1e3,
      o = t.glowBlue ? SHINE_BLUE : SHINE_GOLD,
      n = e ? 1 : 0;
    (s.save(), s.beginPath(), s.rect(t.x + 1, t.y + 1, t.w - 2, t.h - 2), s.clip());
    const r = s.createLinearGradient(0, t.y, 0, t.y + t.h);
    (r.addColorStop(0, o.top[n]),
      r.addColorStop(1, o.bottom[n]),
      (s.fillStyle = r),
      s.fillRect(t.x, t.y, t.w, t.h),
      (s.fillStyle = o.light),
      s.fillRect(t.x + 1, t.y + 1, t.w - 2, 1),
      (s.fillStyle = o.dark),
      s.fillRect(t.x + 1, t.y + t.h - 2, t.w - 2, 1));
    const h = ((i + 0.003 * (t.x + t.y)) % 3) / 0.7;
    if (h < 1) {
      const e = t.x - 20 + (t.w + 40) * h,
        i = s.createLinearGradient(e - 14, 0, e + 14, 0);
      (i.addColorStop(0, o.glint + "0)"),
        i.addColorStop(0.5, o.glint + "0.55)"),
        i.addColorStop(1, o.glint + "0)"),
        (s.fillStyle = i),
        s.beginPath(),
        s.moveTo(e - 10, t.y + t.h),
        s.lineTo(e + 2, t.y),
        s.lineTo(e + 18, t.y),
        s.lineTo(e + 6, t.y + t.h),
        s.fill());
    }
    (s.restore(),
      (s.strokeStyle = o.edge[n]),
      (s.lineWidth = 1),
      s.strokeRect(t.x + 0.5, t.y + 0.5, t.w - 1, t.h - 1));
  }
  slider(t) {
    this.nine("slider", t.x, t.y, t.w, t.h, 2);
    const e = t.x + Math.round(t.value * (t.w - 8));
    (this.nine(this.hit(t) ? "slider_handle_hl" : "slider_handle", e, t.y, 8, t.h, 2),
      Font.center(this.ctx, t.label(), t.x + t.w / 2, t.y + (t.h - 8) / 2, "#FFFFFF"));
  }
  tile(t, e, s, i, o) {
    this.tiled(this.img[t], t, e, s, i, o);
  }
  tiled(t, e, s, i, o, n) {
    if (o <= 0 || n <= 0 || !t) return;
    const r = this.scale,
      h = Math.ceil(o * r),
      a = Math.ceil(n * r),
      l = e + "|" + h + "x" + a + "|" + r,
      c = this.tileCache || (this.tileCache = new Map());
    let u = c.get(l);
    if (!u) {
      ((u = document.createElement("canvas")), (u.width = h), (u.height = a));
      const e = u.getContext("2d");
      ((e.imageSmoothingEnabled = !1),
        e.scale(r, r),
        (e.fillStyle = e.createPattern(t, "repeat")),
        e.fillRect(0, 0, o, n),
        c.set(l, u),
        c.size > 32 && c.delete(c.keys().next().value));
    }
    const d = this.ctx,
      g = d.imageSmoothingEnabled;
    ((d.imageSmoothingEnabled = !1),
      d.drawImage(u, 0, 0, h, a, s, i, h / r, a / r),
      (d.imageSmoothingEnabled = g));
  }
  sepName(t) {
    return ("play" === this.game.state ? "inworld_" : "") + t + "_sep";
  }
  menuBackground() {
    ((this.wantBlur = !0),
      this.tile("play" === this.game.state ? "options_bg" : "menu_bg", 0, 0, this.w, this.h));
  }
  listBackground(t, e) {
    (this.tile(
      "play" === this.game.state ? "inworld_list_bg" : "menu_list_bg",
      0,
      t,
      this.w,
      e - t,
    ),
      this.tile(this.sepName("header"), 0, t - 2, this.w, 2),
      this.tile(this.sepName("footer"), 0, e, this.w, 2));
  }
  hit(t, e = this.mouse.x, s = this.mouse.y) {
    return e >= t.x && s >= t.y && e < t.x + t.w && s < t.y + t.h;
  }
  dim(t = 0.55) {
    ((this.ctx.fillStyle = `rgba(16,16,16,${t})`), this.ctx.fillRect(0, 0, this.w, this.h));
  }
  showInput(t, e, s, i, o, n, r = {}) {
    const h = this.input,
      a = this.scale / this.dpr;
    ((this.inputBox = { x: t, y: e, w: s, h: i, t0: performance.now() }),
      (h.style.display = "block"),
      (h.style.left = t * a + "px"),
      (h.style.top = e * a + "px"),
      (h.style.width = s * a + "px"),
      (h.style.height = i * a + "px"),
      (h.style.fontSize = Math.max(navigator.maxTouchPoints > 0 ? 16 : 12, (i - 6) * a) + "px"),
      (h.value = o || ""),
      (h.maxLength = r.max || 100),
      (h.enterKeyHint = r.enter || "done"),
      (h.onkeydown = (t) => {
        (t.stopPropagation(),
          "Enter" === t.key && n(h.value),
          "Escape" === t.key &&
            (t.repeat || (this.game.escHeld = performance.now()), r.onEsc && r.onEsc()));
      }),
      (h.oninput = () => {
        r.onInput && r.onInput(h.value);
      }),
      (this.lastTouch && performance.now() - this.lastTouch < 2e3) ||
        document.activeElement === h ||
        setTimeout(() => h.focus(), 0));
  }
  hideInput() {
    ((this.input.style.display = "none"),
      (this.input.onkeydown = null),
      this.input.blur(),
      (this.inputBox = null));
  }
  drawInputText() {
    const t = this.inputBox,
      e = this.input;
    if (!t || "none" === e.style.display) return;
    const s = this.ctx,
      i = e.value,
      o = e.selectionStart ?? i.length,
      n = t.y + Math.floor((t.h - 8) / 2),
      r = t.w - 6;
    let h = 0;
    for (; h < o && Font.width(i.slice(h, o)) > r;) h++;
    let a = h;
    for (; a < i.length && Font.width(i.slice(h, a + 1)) <= r;) a++;
    if (
      (Font.draw(s, i.slice(h, a), t.x + 2, n, "#E0E0E0"),
      Math.floor((performance.now() - t.t0) / 300) % 2 == 0)
    ) {
      const e = t.x + 2 + Font.width(i.slice(h, o));
      o >= i.length
        ? Font.draw(s, "_", e, n, "#E0E0E0")
        : ((s.fillStyle = "#D0D0D0"), s.fillRect(e, n - 1, 1, 10));
    }
  }
  drawHUD() {
    const t = this.game,
      e = t.player,
      s = this.ctx,
      i = this.w,
      o = this.h;
    if (this.hideHud) return;
    if ((drawEffectIcons(this, e), !this.screen && 0 === t.perspective && !t.hideCrosshair)) {
      ((s.globalCompositeOperation = "difference"),
        this.sprite("crosshair", Math.floor(i / 2 - 7.5), Math.floor(o / 2 - 7.5)));
      const e = t.attackStrength(0),
        n = Math.floor(i / 2 - 8),
        r = Math.floor(o / 2 - 7 + 16);
      if (e < 1 && this.img.attack_bg) {
        this.sprite("attack_bg", n, r);
        const t = Math.floor(17 * e);
        t > 0 && s.drawImage(this.img.attack_progress, 0, 0, t, 4, n, r, t, 4);
      } else
        t.targetEntity &&
          20 / t.attackSpeed() > 5 &&
          this.img.attack_full &&
          this.sprite("attack_full", n, r);
      s.globalCompositeOperation = "source-over";
    }
    const n = Math.floor(i / 2 - 91),
      r = o - 22;
    if ("spectator" === t.mode) return;
    (this.sprite("hotbar", n, r), this.sprite("hotbar_sel", n - 1 + 20 * e.inv.sel, r - 1));
    for (let t = 0; t < 9; t++) this.drawItem(e.inv.slots[t], n + 3 + 20 * t, r + 3);
    if (
      (e.inv.slots[40] &&
        (this.sprite("hotbar_offhand_left", n - 29, r - 1),
        this.drawItem(e.inv.slots[40], n - 26, r + 3)),
      !e.creative)
    ) {
      const r = o - 29,
        h = e.vehicle && (e.vehicle.jumpStr || void 0 !== e.vehicle.dashCd) ? e.vehicle : null,
        a = t.xpLevel(),
        l = t.xpNeeded(a),
        c = (e.xp - t.xpTotalFor(a)) / l;
      if (h && this.img.jump_bar_bg)
        if ((this.sprite("jump_bar_bg", n, r), h.dashCd > 0))
          this.sprite("jump_bar_cooldown", n, r);
        else {
          const t = Math.floor(182 * clamp(h.jumpCharge || 0, 0, 1));
          t > 0 && s.drawImage(this.img.jump_bar_progress, 0, 0, t, 5, n, r, t, 5);
        }
      else {
        this.sprite("xp_bg", n, r);
        const t = Math.floor(182 * clamp(c, 0, 1));
        t > 0 && s.drawImage(this.img.xp_fg, 0, 0, t, 5, n, r, t, 5);
      }
      if (a > 0) {
        const t = String(a),
          e = Math.floor(i / 2 - Font.width(t) / 2);
        for (const [i, o] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ])
          Font.drawRaw(s, t, e + i, r - 6 + o, "#000000");
        Font.drawRaw(s, t, e, r - 6, "#80FF20");
      }
      const u = o - 39,
        d = Math.ceil(e.health),
        g = performance.now();
      (void 0 === this.lastHealth && ((this.lastHealth = d), (this.displayHealth = d)),
        d < this.lastHealth && e.invuln > 0
          ? ((this.lastHealthT = g), (this.blinkUntil = t.tickCount + 20))
          : d > this.lastHealth &&
            e.invuln > 0 &&
            ((this.lastHealthT = g), (this.blinkUntil = t.tickCount + 10)),
        g - (this.lastHealthT || 0) > 1e3 && (this.displayHealth = d),
        (this.lastHealth = d));
      const m =
          this.blinkUntil > t.tickCount && (((this.blinkUntil - t.tickCount) / 3) | 0) % 2 == 1,
        p = Math.max(e.maxHealth || 20, d),
        f = Math.ceil(e.absorption || 0),
        w = Math.ceil(p / 2),
        b = Math.ceil(f / 2),
        y = Math.ceil((p + f) / 20),
        x = Math.max(10 - (y - 2), 3),
        S = t.hardcore,
        F = S ? "hardcore_" : "",
        k =
          e.hasEffect && e.hasEffect("poison")
            ? "poisoned_"
            : e.hasEffect && e.hasEffect("wither")
              ? "withered_"
              : (e.frozenT || 0) >= 140
                ? "frozen_"
                : "",
        M = e.health + f <= 4,
        v = e.hasEffect && e.hasEffect("regeneration") ? t.tickCount % Math.ceil(p + 5) : -1;
      let _ = f;
      for (let e = w + b - 1; e >= 0; e--) {
        const s = n + (e % 10) * 8;
        let i = u - Math.floor(e / 10) * x;
        if (
          (M && (i += Math.round(1 * Math.sin(1.7 * t.tickCount + 3.1 * e))),
          e === v && (i -= 2),
          this.sprite(
            S
              ? m
                ? "heart_container_hc_blink"
                : "heart_container_hc"
              : m
                ? "heart_container_blink"
                : "heart_container",
            s,
            i,
          ),
          e >= w)
        ) {
          const t = _ === f && f % 2 == 1;
          ((_ -= t ? 1 : 2),
            this.sprite(
              "heart_" +
                ("withered_" === k ? "withered_" : "absorbing_") +
                F +
                (t ? "half" : "full"),
              s,
              i,
            ));
          continue;
        }
        if (m && 2 * e < this.displayHealth) {
          const t = this.displayHealth - 2 * e >= 2 ? "full" : "half";
          this.sprite(
            k ? "heart_" + k + F + t + "_blinking" : (S ? "heart_hc_" : "heart_") + t + "_blink",
            s,
            i,
          );
        }
        const o = d - 2 * e;
        if (o >= 1) {
          const t = o >= 2 ? "full" : "half";
          this.sprite(k ? "heart_" + k + F + t : (S ? "heart_hc_" : "heart_") + t, s, i);
        }
      }
      const I = e.inv.armorPoints(),
        E = u - (y - 1) * x - 10;
      if (I > 0)
        for (let t = 0; t < 10; t++) {
          const e = I - 2 * t;
          this.sprite(e >= 2 ? "armor_full" : e >= 1 ? "armor_half" : "armor_empty", n + 8 * t, E);
        }
      const A = e.vehicle && e.vehicle.maxHealth ? e.vehicle : null;
      if (A) {
        const t = Math.ceil(A.maxHealth / 2);
        for (let e = 0; e < Math.min(t, 30); e++) {
          const t = n + 182 - 9 - (e % 10) * 8,
            s = u - 10 * Math.floor(e / 10),
            i = Math.ceil(A.health) - 2 * e;
          (this.sprite("heart_vehicle_container", t, s),
            i >= 2
              ? this.sprite("heart_vehicle_full", t, s)
              : i >= 1 && this.sprite("heart_vehicle_half", t, s));
        }
      }
      if (!A)
        for (let s = 0; s < 10; s++) {
          const i = n + 182 - 9 - 8 * s;
          let o = u;
          e.saturation <= 0 &&
            t.tickCount % (3 * e.food + 1) == 0 &&
            (o += Math.round(2 * Math.random() - 1));
          const r = e.hasEffect && e.hasEffect("hunger") ? "_hunger" : "";
          this.sprite("food_empty" + r, i, o);
          const h = e.food - 2 * s;
          h >= 2
            ? this.sprite("food_full" + r, i, o)
            : h >= 1 && this.sprite("food_half" + r, i, o);
        }
      if (e.eyeInWater || e.air < 300) {
        const t = Math.ceil((10 * (e.air - 2)) / 300),
          s = Math.ceil((10 * e.air) / 300) - t;
        for (let i = 0; i < 10; i++) {
          const o = n + 182 - 9 - 8 * i;
          i < t
            ? this.sprite("air", o, u - 10)
            : i < t + s && e.air > 0 && this.sprite("air_bursting", o, u - 10);
        }
      }
    }
    e.inv.sel !== this.lastSel &&
      ((this.lastSel = e.inv.sel), (this.itemNameT = performance.now()));
    const h = e.inv.held,
      a = h && ITEMS[h.id],
      l = performance.now() - this.itemNameT;
    if (a && l < 2500) {
      const t = l > 2e3 ? 1 - (l - 2e3) / 500 : 1;
      ((s.globalAlpha = t),
        Font.center(
          s,
          a.stackName ? a.stackName(h) : a.cn || a.key,
          i / 2,
          o - (e.creative ? 38 : 58),
          "#FFFFFF",
        ),
        (s.globalAlpha = 1));
    }
    this.actionBar &&
      performance.now() - this.actionBar.t < 2500 &&
      Font.center(
        s,
        this.actionBar.text,
        i / 2,
        o - (e.creative ? 50 : 70),
        this.actionBar.color || "#FFFFFF",
      );
    const c = [],
      u = t.dragon && t.dragon();
    if (
      (u && c.push({ name: "末影龙", progress: u.health / u.maxHealth, color: "pink" }),
      !t.net && "undefined" != typeof Wither)
    )
      for (const s of t.entities)
        !(s instanceof Wither) ||
          s.dead ||
          s.distTo(e) >= 160 ||
          (t.p2pGuest && "number" != typeof s.bossProg) ||
          c.push({
            name: s.customName || "凋灵",
            progress: t.p2pGuest
              ? s.bossProg
              : s.invulT > 0
                ? 1 - s.invulT / 220
                : s.health / s.maxHealth,
            color: "purple",
          });
    (t.raidBars && c.push(...t.raidBars()),
      c.forEach((t, e) => {
        const o = Math.floor(i / 2 - 91),
          n = 12 + 19 * e;
        let r = "red" === t.color ? "boss_red_bg" : "boss_bg",
          h = "red" === t.color ? "boss_red_fg" : "boss_fg";
        ("purple" === t.color &&
          this.bossPurple() &&
          ((r = "boss_purple_bg"), (h = "boss_purple_fg")),
          Font.center(s, t.name, i / 2, n - 9, "#FFFFFF"),
          this.sprite(r, o, n),
          10 === t.notch && this.img.boss_n10_bg && this.sprite("boss_n10_bg", o, n));
        const a = Math.ceil(182 * clamp(t.progress, 0, 1));
        a > 0 &&
          (s.drawImage(this.img[h], 0, 0, a, 5, o, n, a, 5),
          10 === t.notch &&
            this.img.boss_n10_fg &&
            s.drawImage(this.img.boss_n10_fg, 0, 0, a, 5, o, n, a, 5));
      }),
      this.drawChat(),
      this.drawSubtitles(),
      this.drawToasts(),
      this.debug && this.drawDebug(),
      t.sleepFade > 0 && ((s.fillStyle = `rgba(10,10,20,${t.sleepFade})`), s.fillRect(0, 0, i, o)));
    const d = document.pointerLockElement !== t.canvas,
      g = t.escCapture && t.escHeld && performance.now() - t.escHeld < 1500;
    if (
      (!t.clickToResume || (d && !this.screen && "play" === t.state) || (t.clickToResume = 0),
      !t.clickToResume || touchOn(t) || t.lockFails)
    )
      if (
        this.screen ||
        "play" !== t.state ||
        !d ||
        t.debugPause ||
        touchOn(t) ||
        t.noLockPause ||
        t.lockFails ||
        g
      )
        this.unlockedAt = 0;
      else {
        const e = performance.now();
        this.unlockedAt
          ? e - this.unlockedAt > 250 && ((this.unlockedAt = 0), this.open(new PauseScreen(t)))
          : (this.unlockedAt = e);
      }
    else {
      const t = "点击画面继续游戏",
        e = Font.width(t);
      ((s.globalAlpha = 0.6),
        (s.fillStyle = "#000"),
        s.fillRect(Math.floor(i / 2 - e / 2 - 6), Math.floor(o / 2) + 14, e + 12, 14),
        (s.globalAlpha = 1),
        Font.center(s, t, i / 2, Math.floor(o / 2) + 17, "#FFFFFF"));
    }
  }
  drawChat() {
    const t = this.ctx,
      e = performance.now(),
      s = this.screen && this.screen.isChat;
    let i = this.h - 48 - (this.touch ? this.touch.chatLift() : 0);
    const o = this.pinned,
      row = (e, s) => {
        let o = 4;
        for (const [n, r] of s) o = Font.draw(t, n, o, i, r || e.color);
      };
    let n = 0;
    if (o && e >= o.until) ((this.pinned = null), this.message(o.text, o.color));
    else if (o) {
      const e = this.chatWrap(o);
      for (let s = e.length - 1; s >= 0; s--)
        ((t.globalAlpha = 0.5),
          (t.fillStyle = "#000"),
          t.fillRect(2, i - 1, 320, 10),
          (t.globalAlpha = 1),
          row(o, e[s]),
          (i -= 10));
      n = e.length;
    }
    const r = Math.max(1, (s ? 20 : 10) - n),
      h = s ? Math.min(this.chatOff || 0, Math.max(0, this.chatRowCount() - 20)) : 0;
    for (const [o, n] of this.chatRowsBack(h + r).slice(h)) {
      const r = e - o.t;
      if (!s && r > 1e4) continue;
      const h = s ? 1 : clamp((1e4 - r) / 1e3, 0, 1);
      ((t.globalAlpha = 0.5 * h),
        (t.fillStyle = "#000"),
        t.fillRect(2, i - 1, 320, 10),
        (t.globalAlpha = h),
        row(o, n),
        (t.globalAlpha = 1),
        (i -= 10));
    }
  }
  chatWrap(t) {
    const e = t.parts || t.text;
    if (t.wrap && t.wrapOf === e && t.wrapFont === Font.adv) return t.wrap;
    const s = [],
      i = [],
      o = Font.charW(" ");
    for (const [e, i] of t.parts || [[t.text, null]])
      for (const t of String(e ?? "")) s.push([t, i]);
    let n = 0,
      r = 0,
      h = -1,
      a = !1;
    const emit = (t, e) => {
      const o = a ? [[" ", null]] : [];
      for (let i = t; i < e; i++) {
        const t = o[o.length - 1];
        t && t[1] === s[i][1] && (o.length > 1 || !a)
          ? (t[0] += s[i][0])
          : o.push([s[i][0], s[i][1]]);
      }
      i.push(o);
    };
    for (let t = 0; t < s.length; t++) {
      const e = s[t][0],
        i = Font.charW(e);
      if ("\n" !== e)
        if (r + i > 316 - (a ? o : 0) && t > n) {
          if (" " === e) {
            (emit(n, t), (n = t + 1), (a = !0), (r = 0), (h = -1));
            continue;
          }
          (h > n ? (emit(n, h), (n = h + 1)) : (emit(n, t), (n = t)), (a = !0), (h = -1), (r = 0));
          for (let e = n; e < t; e++) r += Font.charW(s[e][0]);
          t--;
        } else (" " === e && (h = t), (r += i));
      else (emit(n, t), (n = t + 1), (r = 0), (h = -1), (a = !1));
    }
    return (emit(n, s.length), (t.wrapOf = e), (t.wrapFont = Font.adv), (t.wrap = i));
  }
  chatRowsBack(t) {
    const e = [];
    for (let s = this.chat.length - 1; s >= 0 && e.length < t; s--) {
      const i = this.chat[s],
        o = this.chatWrap(i);
      for (let s = o.length - 1; s >= 0 && e.length < t; s--) e.push([i, o[s]]);
    }
    return e;
  }
  chatRowCount() {
    let t = 0;
    for (const e of this.chat) t += this.chatWrap(e).length;
    return t;
  }
  hearSound(t, e, s) {
    if (!this.game.settings.subtitles || !self.SUBTITLES || !SUBTITLES[t]) return;
    const i = Sound.listener;
    if (e && Math.hypot(e[0] - i.x, e[1] - i.y, e[2] - i.z) > Math.max(16, 16 * s)) return;
    const o = SUBTITLES[t],
      n = this.subs.find((t) => t.text === o);
    n
      ? ((n.pos = e), (n.t = performance.now()))
      : this.subs.push({ text: o, pos: e, t: performance.now() });
  }
  drawSubtitles() {
    const t = this.game,
      e = performance.now();
    if (!t.settings.subtitles || "play" !== t.state) return void (this.subs.length = 0);
    if (((this.subs = this.subs.filter((t) => e - t.t < 3e3)), !this.subs.length)) return;
    const s = this.ctx,
      i = Sound.listener,
      o = Font.width("<"),
      n = Font.width(" "),
      r = Math.max(...this.subs.map((t) => Font.width(t.text))) + 2 * o + 2 * n;
    this.subs.forEach((t, n) => {
      const h = this.w - r / 2 - 2,
        a = this.h - 35 - 10 * n,
        l = Math.round(255 - ((e - t.t) / 3e3) * 180),
        c = `rgb(${l},${l},${l})`;
      if (
        ((s.fillStyle = "rgba(0,0,0,0.8)"),
        s.fillRect(Math.round(h - r / 2 - 1), a - 5, r + 2, 10),
        Font.draw(s, t.text, Math.round(h - Font.width(t.text) / 2), a - 4, c, !1),
        !t.pos)
      )
        return;
      const u = t.pos[0] - i.x,
        d = t.pos[2] - i.z,
        g = Math.hypot(u, t.pos[1] - i.y, d),
        m = g > 0.5 ? (u * Math.cos(i.yaw) - d * Math.sin(i.yaw)) / g : 0;
      m > 0.5
        ? Font.draw(s, ">", Math.round(h + r / 2 - o), a - 4, c, !1)
        : m < -0.5 && Font.draw(s, "<", Math.round(h - r / 2), a - 4, c, !1);
    });
  }
  drawToasts() {
    const t = this.ctx,
      e = performance.now(),
      s = this.game;
    if (
      "play" === s.state &&
      s.tutorial >= 0 &&
      "survival" === s.mode &&
      !this.toasts.length &&
      !this.debug
    ) {
      const e = TUTORIAL[s.tutorial],
        i = this.w - 160,
        o = this.touch ? this.touch.topInset() : 0,
        n = touchOn(s);
      (this.sprite("toast", i, o),
        this.drawItem({ id: item(e.icon), count: 1 }, i + 8, o + 8),
        Font.draw(t, e.title, i + 30, o + 7, "#55FFFF", !1),
        Font.draw(t, (n && e.touch) || e.text, i + 30, o + 18, "#FFFFFF", !1));
    }
    this.toasts = this.toasts.filter((t) => e - t.t < 5500);
    let i = this.touch ? this.touch.topInset() : 0;
    for (const s of this.toasts) {
      const o = e - s.t;
      o > 5e3 && !s.out && ((s.out = !0), Sound.ev("ui.toast.out", null, 1, 1));
      const n = o < 400 ? 1 - o / 400 : o > 5e3 ? (o - 5e3) / 500 : 0,
        r = this.w - 160 + Math.round(160 * n);
      (this.sprite("toast", r, i),
        s.icon && this.drawItem({ id: s.icon, count: 1 }, r + 8, i + 8),
        Font.draw(t, s.title, r + 30, i + 7, "#FFFF00", !1),
        Font.draw(t, s.sub, r + 30, i + 18, "#FFFFFF", !1),
        (i += 32));
    }
  }
  drawDebug() {
    const t = this.game,
      e = t.player,
      s = this.ctx,
      i = Math.floor(e.pos[0]),
      o = Math.floor(e.pos[1]),
      n = Math.floor(e.pos[2]);
    let r = (((((180 * -e.yaw) / Math.PI) % 360) + 540) % 360) - 180;
    const h = ["南 (+Z)", "西 (-X)", "北 (-Z)", "东 (+X)"][Math.round(((r + 180) % 360) / 90) % 4],
      a = t.world.getChunk(i >> 4, n >> 4),
      l = a ? BIOMES[a.biome[((15 & n) << 4) | (15 & i)]] : "?",
      c = t.world.getLight(i, o, n),
      u = t.dayTime(),
      d = [
        "土豆史诗 POTATO EPIC",
        `${t.fps} fps  区段: ${t.renderer.stats ? t.renderer.stats.sections : 0}  三角形: ${t.renderer.stats ? t.renderer.stats.tris : 0}` +
          ("undefined" != typeof DynRes && t.settings.dynRes
            ? `  渲染比例: ${Math.round(100 * DynRes.scale)}%`
            : ""),
        `区块: 已加载 ${t.world.chunks.size}  待生成 ${t.genQueueLen || 0}  实体: ${t.entities.length}  粒子: ${t.particles.list.length}`,
        "",
        `XYZ: ${e.pos[0].toFixed(3)} / ${(e.pos[1] + (t.world.minY || 0)).toFixed(3)} / ${e.pos[2].toFixed(3)}`,
        `方块: ${i} ${o + (t.world.minY || 0)} ${n}   区块: ${i >> 4} ${n >> 4}`,
        `朝向: ${h} (${r.toFixed(1)} / ${((180 * e.pitch) / Math.PI).toFixed(1)})`,
        `生物群系: ${l}`,
        `光照: 天空 ${c >> 4}  方块 ${15 & c}`,
        `时间: 第 ${Math.floor(t.worldTime / 24e3) + 1} 天  ${String(Math.floor((u / 1e3 + 6) % 24)).padStart(2, "0")}:${String(Math.floor((u % 1e3) * 0.06)).padStart(2, "0")}`,
        `种子: ${t.world.seed}   维度: ${DIM_CN[t.dim] || t.dim}`,
      ];
    if (t.target) {
      const e = BLOCKS[t.world.getBlock(...t.target.pos)];
      d.push(
        `目标方块: ${e ? e.cn || e.key : "?"} (${t.target.pos[0]}, ${t.target.pos[1] + (t.world.minY || 0)}, ${t.target.pos[2]})`,
      );
    }
    let g = 2;
    for (const t of d) {
      if (t) {
        const e = Font.width(t);
        ((s.fillStyle = "rgba(80,80,80,0.55)"),
          s.fillRect(1, g - 1, e + 2, 10),
          Font.draw(s, t, 2, g, "#E0E0E0", !1));
      }
      g += 10;
    }
    ((PerfMon.gpuOn = !0), (g = this.w < 560 ? g + 6 : 2));
    for (const e of PerfMon.lines(t)) {
      const t = "string" == typeof e ? e : e.text,
        i = "string" == typeof e ? "#E0E0E0" : e.color;
      if (t) {
        const e = Font.width(t),
          o = this.w - e - 2;
        ((s.fillStyle = "rgba(80,80,80,0.55)"),
          s.fillRect(o - 1, g - 1, e + 2, 10),
          Font.draw(s, t, o, g, i, !1));
      }
      g += 10;
    }
    PerfMon.drawGraph(s, 2, this.h - 2, Math.min(240, Math.floor(this.w / 2) - 4), 60, t);
  }
  draw() {
    const t = this.ctx;
    if (!this.canvas.width || !this.canvas.height) return;
    (t.setTransform(1, 0, 0, 1, 0, 0),
      t.clearRect(0, 0, this.canvas.width, this.canvas.height),
      t.setTransform(this.scale, 0, 0, this.scale, 0, 0),
      (t.imageSmoothingEnabled = !1));
    const e = this.game,
      s =
        "play" === e.state &&
        !this.screen &&
        e.lockFails > 0 &&
        document.pointerLockElement !== e.canvas &&
        !touchOn(e);
    if (
      (s !== !!this.ptrHidden &&
        document.body &&
        ((this.ptrHidden = s), (document.body.style.cursor = s ? "none" : "")),
      "play" === e.state && (this.drawOverlays(), this.drawHUD()),
      (this.wantBlur = !1),
      this.screen && this.screen.draw(this),
      "undefined" != typeof UnlockSparks && UnlockSparks.draw(this),
      this.wantBlur !== !!this.blurOn)
    ) {
      this.blurOn = this.wantBlur;
      const t = e.canvas.style;
      ((t.filter = this.blurOn ? "blur(5px)" : ""),
        (t.transform = this.blurOn ? "scale(1.03)" : ""));
    }
    (this.drawInputText(),
      this.touch && this.touch.draw(this),
      this.cursor && this.drawItem(this.cursor, this.mouse.x - 8, this.mouse.y - 8));
  }
  waterTile(t) {
    const e = this.img.underwater;
    this.waterOf !== e && ((this.waterOf = e), (this.waterTiles = new Map()));
    let s = this.waterTiles.get(t);
    if (!s) {
      ((s = document.createElement("canvas")), (s.width = e.width), (s.height = e.height));
      const i = s.getContext("2d");
      (i.drawImage(e, 0, 0),
        t < 1 &&
          ((i.globalCompositeOperation = "source-atop"),
          (i.fillStyle = `rgba(0,0,0,${1 - t})`),
          i.fillRect(0, 0, s.width, s.height)),
        this.waterTiles.set(t, s));
    }
    return s;
  }
  drawOverlays() {
    const t = this.game,
      e = t.player,
      s = this.ctx,
      i = this.w,
      o = this.h;
    if (!this.vigCanvas && this.img.vignette && this.img.vignette.width) {
      const t = this.img.vignette,
        e = document.createElement("canvas");
      ((e.width = t.width), (e.height = t.height));
      const s = e.getContext("2d");
      s.drawImage(t, 0, 0);
      const i = s.getImageData(0, 0, e.width, e.height),
        o = i.data;
      for (let t = 0; t < o.length; t += 4) ((o[t + 3] = o[t]), (o[t] = o[t + 1] = o[t + 2] = 0));
      (s.putImageData(i, 0, 0), (this.vigCanvas = e));
    }
    const n = this.canvas.width,
      r = this.canvas.height;
    if (
      this.vigCanvas &&
      (!this.vigFull || this.vigFull.width !== n || this.vigFull.height !== r)
    ) {
      const t = (this.vigFull = document.createElement("canvas"));
      ((t.width = n), (t.height = r));
      const e = t.getContext("2d");
      ((e.globalAlpha = 0.5),
        (e.imageSmoothingEnabled = !0),
        e.drawImage(this.vigCanvas, 0, 0, n, r));
    }
    if (
      (this.vigFull &&
        (s.save(), s.setTransform(1, 0, 0, 1, 0, 0), s.drawImage(this.vigFull, 0, 0), s.restore()),
      t.headInWater && this.img.underwater)
    ) {
      const [n, r] = e.lightAt(),
        h = Math.max(n * t.daylight(), r),
        a = h / (4 - 3 * h),
        l = i / 4,
        c = o / 4,
        u = 180 / Math.PI,
        d = this.waterTile(Math.round(32 * a) / 32),
        g = (((((e.yaw * u) / 64) % 1) + 1) % 1) * l,
        m = (((((e.pitch * u) / 64) % 1) + 1) % 1) * c;
      ((s.globalAlpha = 0.1), (s.imageSmoothingEnabled = !0));
      for (let t = g - l; t < i; t += l)
        for (let e = m - c; e < o; e += c) s.drawImage(d, t, e, l, c);
      ((s.globalAlpha = 1), (s.imageSmoothingEnabled = !1));
    }
    if (
      (t.headInLava && ((s.fillStyle = "rgba(200,60,0,0.75)"), s.fillRect(0, 0, i, o)),
      (e.frozenT || 0) > 0 &&
        this.img.powder_snow_outline &&
        ((s.globalAlpha = Math.min(1, e.frozenT / 140)),
        (s.imageSmoothingEnabled = !0),
        s.drawImage(this.img.powder_snow_outline, 0, 0, i, o),
        (s.globalAlpha = 1),
        (s.imageSmoothingEnabled = !1)),
      e.fire > 0 && !e.creative && !e.fireproof && 0 === t.perspective && !t.headInLava)
    ) {
      const e = t.renderer,
        n = T("fire_1"),
        r = ANIM_FRAMES[n] || 1,
        h = n + (Math.floor(t.worldTime / 2) % r),
        a = Math.round(0.62 * o);
      ((s.globalAlpha = 0.9), (s.imageSmoothingEnabled = !1));
      for (const t of [-1, 1])
        (s.save(),
          s.translate(i / 2 + t * i * 0.27, o - 0.32 * a),
          s.transform(1, 0.08 * t, 0, 1, 0, 0),
          t < 0 && s.scale(-1, 1),
          s.drawImage(e.stripCanvas, ...e.tileXY(h), 16, 16, -a / 2, -a / 2, a, a),
          s.restore());
      s.globalAlpha = 1;
    }
    const h = 0 === t.perspective && !e.noClip && t.inWallBlock ? t.inWallBlock() : 0;
    if (h) {
      const e = t.renderer,
        n = BLOCKS[h],
        r = n.particle ?? (Array.isArray(n.tex) ? n.tex[0] : n.tex);
      ((s.imageSmoothingEnabled = !1),
        null != r && s.drawImage(e.stripCanvas, ...e.tileXY(r), 16, 16, 0, 0, i, o),
        (s.fillStyle = "rgba(0,0,0,0.85)"),
        s.fillRect(0, 0, i, o));
    }
    if (t.portalOverlay > 0) {
      const e = t.renderer,
        n = T("nether_portal") + (Math.floor(performance.now() / 100) % 32);
      ((s.globalAlpha = Math.min(0.85, 0.9 * t.portalOverlay)),
        (s.imageSmoothingEnabled = !1),
        s.drawImage(e.stripCanvas, ...e.tileXY(n), 16, 16, 0, 0, i, o),
        (s.globalAlpha = 1));
    }
    if (e.fire > 0 && !e.creative && 0 === t.perspective) {
      const e = t.renderer,
        n = T("fire_0") + (t.tickCount % 32);
      s.globalAlpha = 0.85;
      const r = 0.45 * Math.min(i, o);
      (s.drawImage(e.stripCanvas, ...e.tileXY(n), 16, 16, i / 2 - 1.1 * r, o - 0.75 * r, r, r),
        s.drawImage(e.stripCanvas, ...e.tileXY(n), 16, 16, i / 2 + 0.1 * r, o - 0.75 * r, r, r),
        (s.globalAlpha = 1));
    }
    if (
      (e.hurtTime > 0 &&
        ((s.fillStyle = `rgba(160,0,0,${(e.hurtTime / 10) * 0.25})`), s.fillRect(0, 0, i, o)),
      e.deathTime > 0)
    ) {
      const t = Math.min(0.6, e.deathTime / 40),
        n = s.createLinearGradient(0, 0, 0, o);
      (n.addColorStop(0, `rgba(80,0,0,${t})`),
        n.addColorStop(1, `rgba(160,20,20,${t})`),
        (s.fillStyle = n),
        s.fillRect(0, 0, i, o));
    }
  }
  mouseMove(t) {
    (([this.mouse.x, this.mouse.y] = this.toGui(t)),
      this.screen &&
        this.screen.mouseMove &&
        this.screen.mouseMove(this, this.mouse.x, this.mouse.y));
  }
  mouseDown(t) {
    (([this.mouse.x, this.mouse.y] = this.toGui(t)),
      (this.mouse.down = !0),
      (this.mouse.button = t.button),
      this.screen &&
        this.screen.mouseDown &&
        this.screen.mouseDown(this, this.mouse.x, this.mouse.y, t.button, t.shiftKey));
  }
  mouseUp(t) {
    (([this.mouse.x, this.mouse.y] = this.toGui(t)),
      (this.mouse.down = !1),
      this.screen &&
        this.screen.mouseUp &&
        this.screen.mouseUp(this, this.mouse.x, this.mouse.y, t.button));
  }
  wheel(t) {
    this.screen && this.screen.wheel && this.screen.wheel(this, t);
  }
  key(t) {
    return !(!this.screen || !this.screen.key) && this.screen.key(this, t);
  }
}
class ContainerScreen {
  constructor(t, e, s, i, o) {
    ((this.game = t),
      (this.bg = e),
      (this.gw = s),
      (this.gh = i),
      (this.title = o),
      (this.slots = []),
      (this.dragSlots = null));
  }
  layout() {
    const t = this.game.ui;
    ((this.x = Math.floor((t.w - this.gw) / 2)), (this.y = Math.floor((t.h - this.gh) / 2)));
  }
  addPlayerSlots(t, e) {
    const s = this.game.player.inv;
    for (let e = 0; e < 3; e++)
      for (let i = 0; i < 9; i++) {
        const o = 9 + 9 * e + i;
        this.slots.push({
          x: 8 + 18 * i,
          y: t + 18 * e,
          get: () => s.slots[o],
          set: (t) => {
            s.slots[o] = t;
          },
          group: "main",
          idx: o,
        });
      }
    for (let t = 0; t < 9; t++)
      this.slots.push({
        x: 8 + 18 * t,
        y: e,
        get: () => s.slots[t],
        set: (e) => {
          s.slots[t] = e;
        },
        group: "hotbar",
        idx: t,
      });
  }
  slotAt(t, e) {
    for (const s of this.slots)
      if (
        t >= this.x + s.x - 1 &&
        t < this.x + s.x + 17 &&
        e >= this.y + s.y - 1 &&
        e < this.y + s.y + 17
      )
        return s;
    return null;
  }
  drawBase(t) {
    (t.dim(0.6),
      t.ctx.drawImage(t.img[this.bg], 0, 0, this.gw, this.gh, this.x, this.y, this.gw, this.gh),
      this.title &&
        Font.draw(t.ctx, this.title, this.x + (this.titleX ?? 8), this.y + 6, "#404040", !1));
  }
  drawSlots(t) {
    const e = this.slotAt(t.mouse.x, t.mouse.y);
    for (const s of this.slots) {
      const i = s.get();
      (!i &&
        s.emptyIcon &&
        ((t.ctx.globalAlpha = 0.6),
        t.sprite(s.emptyIcon, this.x + s.x, this.y + s.y),
        (t.ctx.globalAlpha = 1)),
        t.drawItem(i, this.x + s.x, this.y + s.y),
        (s === e || (this.dragSlots && this.dragSlots.has(s))) &&
          ((t.ctx.fillStyle = "rgba(255,255,255,0.5)"),
          t.ctx.fillRect(this.x + s.x, this.y + s.y, 16, 16)));
    }
    e && e.get() && !t.cursor && t.tooltip(t.tipLines(e.get()), t.mouse.x, t.mouse.y);
  }
  draw(t) {
    (this.drawBase(t), this.drawExtra && this.drawExtra(t), this.drawSlots(t));
  }
  canPlace(t, e) {
    return !t.output && (!t.accept || t.accept(e));
  }
  maxIn(t, e) {
    return Math.min(maxStack(e.id), t.max || 64);
  }
  mouseDown(t, e, s, i, o) {
    const n = this.slotAt(e, s);
    if (!n)
      return void (
        this.outside &&
        this.outside(e, s) &&
        t.cursor &&
        (0 === i
          ? (this.game.dropFromPlayer(t.cursor), (t.cursor = null))
          : 2 === i &&
            (this.game.dropFromPlayer({ ...t.cursor, count: 1 }),
            t.cursor.count--,
            t.cursor.count || (t.cursor = null)))
      );
    if ((Sound.init(), n.output))
      return void this.takeOutput(
        t,
        n,
        o || (2 === i && "function" == typeof touchOn && touchOn(this.game)),
      );
    if (o && 0 === i) return (this.quickMove(n), void this.changed());
    const r = n.get(),
      h = performance.now();
    if (
      0 === i &&
      t.cursor &&
      !r &&
      this.lastClick &&
      h - this.lastClick.t < 300 &&
      this.lastClick.slot === n &&
      this.lastClick.stack === t.cursor
    ) {
      const e = t.cursor,
        s = maxStack(e.id);
      if (!ITEMS[e.id] || !ITEMS[e.id].durability)
        for (const t of this.slots) {
          if (t.output || e.count >= s) continue;
          const i = t.get();
          if (i && i !== e && sameKind(i, e)) {
            const o = Math.min(i.count, s - e.count);
            ((e.count += o), (i.count -= o), i.count || t.set(null));
          }
        }
      return ((this.lastClick = null), void this.changed());
    }
    (!t.cursor ||
      (0 !== i && 2 !== i) ||
      (r && !sameKind(r, t.cursor)) ||
      ((this.dragSlots = new Set([n])), (this.dragButton = i), (this.dragStart = n)),
      this.dragSlots ||
        (this.clickSlot(t, n, i), (this.lastClick = { t: h, slot: n, stack: t.cursor })));
  }
  clickSlot(t, e, s) {
    const i = e.get();
    if (
      void 0 === e.armorSlot ||
      !i ||
      !enchLevel(i, "binding_curse") ||
      this.game.player.creative
    ) {
      if (0 === s)
        if (t.cursor) {
          if (i)
            if (!sameKind(i, t.cursor) || (ITEMS[i.id] && ITEMS[i.id].durability))
              this.canPlace(e, t.cursor) &&
                t.cursor.count <= this.maxIn(e, t.cursor) &&
                (e.set(t.cursor), (t.cursor = i));
            else {
              const s = Math.min(t.cursor.count, this.maxIn(e, i) - i.count);
              ((i.count += s), (t.cursor.count -= s), t.cursor.count || (t.cursor = null));
            }
          else if (this.canPlace(e, t.cursor)) {
            const s = Math.min(t.cursor.count, this.maxIn(e, t.cursor));
            (e.set({ ...t.cursor, count: s }),
              (t.cursor.count -= s),
              t.cursor.count || (t.cursor = null));
          }
        } else i && ((t.cursor = i), e.set(null));
      else if (2 === s)
        if (t.cursor)
          i
            ? sameKind(i, t.cursor) && i.count < this.maxIn(e, i)
              ? (i.count++, t.cursor.count--, t.cursor.count || (t.cursor = null))
              : this.canPlace(e, t.cursor) &&
                t.cursor.count <= this.maxIn(e, t.cursor) &&
                (e.set(t.cursor), (t.cursor = i))
            : this.canPlace(e, t.cursor) &&
              (e.set({ ...t.cursor, count: 1 }),
              t.cursor.count--,
              t.cursor.count || (t.cursor = null));
        else if (i) {
          const s = Math.ceil(i.count / 2);
          ((t.cursor = { ...i, count: s }), (i.count -= s), i.count || e.set(null));
        }
      this.changed();
    }
  }
  mouseMove(t, e, s) {
    if (this.dragSlots && t.mouse.down && t.cursor) {
      const i = this.slotAt(e, s);
      i &&
        !i.output &&
        (!i.get() || sameKind(i.get(), t.cursor)) &&
        this.canPlace(i, t.cursor) &&
        this.dragSlots.size < t.cursor.count + (this.dragButton, 0) &&
        this.dragSlots.add(i);
    }
  }
  mouseUp(t, e, s, i) {
    if (!this.dragSlots) return;
    const o = [...this.dragSlots];
    if (((this.dragSlots = null), 1 === o.length))
      return void this.clickSlot(t, o[0], this.dragButton);
    if (!t.cursor) return;
    const n = 2 === this.dragButton ? 1 : Math.floor(t.cursor.count / o.length);
    if (!(n < 1)) {
      for (const e of o) {
        if (!t.cursor) break;
        const s = e.get(),
          i = this.maxIn(e, t.cursor) - (s ? s.count : 0),
          o = Math.min(n, i, t.cursor.count);
        o <= 0 ||
          (s ? (s.count += o) : e.set({ ...t.cursor, count: o }),
          (t.cursor.count -= o),
          t.cursor.count || (t.cursor = null));
      }
      this.changed();
    }
  }
  quickMove(t) {
    const e = t.get();
    if (!e) return;
    let s;
    if (
      ((s =
        "hotbar" === t.group
          ? this.slots.filter((t) => "container" === t.group).length
            ? this.slots.filter((t) => "container" === t.group)
            : this.slots.filter((t) => "main" === t.group)
          : "main" === t.group
            ? this.slots.filter((t) => "container" === t.group).length
              ? this.slots.filter((t) => "container" === t.group)
              : this.slots.filter((t) => "hotbar" === t.group)
            : this.slots
                .filter((t) => "hotbar" === t.group || "main" === t.group)
                .sort((t, e) => ("hotbar" === t.group ? 1 : 0) - ("hotbar" === e.group ? 1 : 0))
                .reverse()),
      ITEMS[e.id] && ITEMS[e.id].armor && ("main" === t.group || "hotbar" === t.group))
    ) {
      const s = this.slots.find((t) => t.armorSlot === ITEMS[e.id].armor.slot && !t.get());
      if (s) return (s.set(e), void t.set(null));
    }
    s = s.filter((t) => this.canPlace(t, e));
    for (const i of s) {
      const s = i.get();
      if (s && sameKind(s, e) && (!ITEMS[e.id] || !ITEMS[e.id].durability)) {
        const o = Math.min(e.count, this.maxIn(i, e) - s.count);
        if (((s.count += o), (e.count -= o), !e.count)) return void t.set(null);
      }
    }
    for (const i of s)
      if (!i.get()) {
        const s = Math.min(e.count, this.maxIn(i, e));
        if ((i.set({ ...e, count: s }), (e.count -= s), !e.count)) return void t.set(null);
      }
  }
  takeOutput(t, e, s) {
    const i = e.get();
    if (i) {
      if (s) {
        let t = 0;
        for (; e.get() && t++ < 64;) {
          const t = e.get(),
            s = this.game.player.inv;
          let i = 0;
          const o = maxStack(t.id);
          for (let e = 0; e < 36; e++) {
            const n = s.slots[e];
            i += n ? (sameKind(n, t) && !ITEMS[n.id].durability ? Math.max(0, o - n.count) : 0) : o;
          }
          if (i < t.count) break;
          (s.add({ ...t }, [
            8,
            7,
            6,
            5,
            4,
            3,
            2,
            1,
            0,
            ...Array.from({ length: 27 }, (t, e) => 35 - e),
          ]),
            e.onTake(t),
            this.changed());
        }
        return;
      }
      (t.cursor
        ? sameKind(t.cursor, i) &&
          t.cursor.count + i.count <= maxStack(i.id) &&
          ((t.cursor.count += i.count), e.onTake(i))
        : ((t.cursor = { ...i }), e.onTake(i)),
        this.changed());
    }
  }
  key(t, e) {
    const s = bindingsFor(this.game, e.code);
    if (s.includes("inventory")) return !1;
    const i = s.find((t) => t.startsWith("hotbar."));
    if (i || s.includes("swapOffhand")) {
      const e = this.slotAt(t.mouse.x, t.mouse.y);
      if (e && !e.output && !t.cursor) {
        const t = this.game.player.inv,
          s = i ? +i.slice(7) - 1 : 40,
          o = e.get(),
          n = t.slots[s];
        e.creative || e.trash
          ? o && ((t.slots[s] = { ...o, count: maxStack(o.id), dmg: 0 }), this.changed())
          : (n && !this.canPlace(e, n)) || (e.set(n), (t.slots[s] = o), this.changed());
      }
      return !0;
    }
    if (s.includes("drop")) {
      const s = this.slotAt(t.mouse.x, t.mouse.y);
      if (s && s.get() && !s.output && !t.cursor) {
        const t = s.get(),
          i = e.ctrlKey ? (s.creative ? maxStack(t.id) : t.count) : 1;
        (this.game.dropFromPlayer({ ...t, count: i }),
          (t.count -= i),
          t.count || s.set(null),
          this.changed());
      }
      return !0;
    }
    return !1;
  }
  outside(t, e) {
    return t < this.x || e < this.y || t > this.x + this.gw || e > this.y + this.gh;
  }
  changed() {}
}
class CraftingScreen extends ContainerScreen {
  constructor(t, e) {
    const s = 3 === e;
    (super(t, s ? "crafting_table" : "inventory", 176, 166, s ? "合成" : null),
      (this.size = e),
      (this.grid = new Array(e * e).fill(null)),
      s && (this.titleX = 29));
    const i = s ? 30 : 98,
      o = s ? 17 : 18;
    for (let t = 0; t < e; t++)
      for (let s = 0; s < e; s++) {
        const n = t * e + s;
        this.slots.push({
          x: i + 18 * s,
          y: o + 18 * t,
          get: () => this.grid[n],
          set: (t) => {
            this.grid[n] = t;
          },
          group: "craft",
        });
      }
    if (
      ((this.result = null),
      this.slots.push({
        x: s ? 124 : 154,
        y: s ? 35 : 28,
        output: !0,
        get: () => this.result,
        set: () => {},
        onTake: () => this.consume(),
      }),
      !s)
    ) {
      const e = t.player.inv,
        s = ["slot_helmet", "slot_chestplate", "slot_leggings", "slot_boots"];
      for (let t = 0; t < 4; t++)
        this.slots.push({
          x: 8,
          y: 8 + 18 * t,
          armorSlot: t,
          emptyIcon: s[t],
          get: () => e.slots[36 + t],
          set: (s) => {
            e.slots[36 + t] = s;
          },
          accept: (e) => !!ITEMS[e.id] && ITEMS[e.id].armor && ITEMS[e.id].armor.slot === t,
          max: 1,
          group: "armor",
        });
    }
    if ((this.addPlayerSlots(84, 142), !s && !t.net)) {
      const e = t.player.inv;
      this.slots.push({
        x: 77,
        y: 62,
        emptyIcon: "slot_shield",
        get: () => e.slots[40],
        set: (t) => {
          e.slots[40] = t;
        },
        group: "offhand",
      });
    }
  }
  changed() {
    const t = matchRecipe(this.grid, this.size),
      e = t && void 0 !== t.keep ? this.grid.find((e) => e && t.ing[t.keep].includes(e.id)) : null;
    this.result = t ? { ...(e || {}), id: t.result, count: t.count, dmg: (e && e.dmg) || 0 } : null;
  }
  layout() {
    super.layout();
    const t = this.game.ui;
    ((this.narrow = t.w < 379),
      (this.bookOpen = !0 === this.game.settings.recipeBook),
      this.bookOpen && !this.narrow && (this.x = 177 + Math.floor((t.w - this.gw - 200) / 2)),
      (this.bookOpen && this.narrow) || (this.peek = !1),
      (this.bookBtn =
        3 === this.size ? { x: 5, y: 34, w: 20, h: 18 } : { x: 104, y: 61, w: 20, h: 18 }),
      (this.page = this.page || 0),
      (this.tab = this.tab || 0),
      (this.search = this.search || ""),
      !this.bookOpen && this.searching && (t.hideInput(), (this.searching = !1)));
  }
  static category(t) {
    const e = ITEMS[t],
      s = e.key;
    return e.tool ||
      e.armor ||
      ["bow", "arrow", "shears", "flint_and_steel", "fishing_rod"].includes(s)
      ? 1
      : ["tnt", "note_block", "oak_door", "oak_trapdoor", "redstone_block"].includes(s)
        ? 4
        : void 0 === e.block ||
            [
              "crafting_table",
              "furnace",
              "chest",
              "torch",
              "ladder",
              "jack_o_lantern",
              "bookshelf",
              "end_crystal",
            ].includes(s) ||
            BLOCKS[e.block].bed
          ? 3
          : 2;
  }
  bookRecipes() {
    const t = this.size * this.size,
      tail = (t) => String((ITEMS[t] && ITEMS[t].key) || "").replace(/^.*?_/, ""),
      recolours = (t) => {
        const e = tail(t.result);
        return (t.ing || Object.values(t.keys || {})).some((s) =>
          []
            .concat(s)
            .some((s) => s !== t.result && tail(s) === e && ITEMS[s].key !== ITEMS[t.result].key),
        );
      },
      e = this.game.player.inv,
      s = new Map();
    for (let t = 0; t < 36; t++) {
      const i = e.slots[t];
      i && s.set(i.id, (s.get(i.id) || 0) + i.count);
    }
    for (const t of this.grid) t && s.set(t.id, (s.get(t.id) || 0) + t.count);
    const i = this.search.trim().toLowerCase(),
      o = new Map();
    for (const e of RECIPES) {
      if ("shaped" === e.type ? e.w > this.size || e.h > this.size : e.ing.length > t) continue;
      if (this.tab > 0 && CraftingScreen.category(e.result) !== this.tab) continue;
      if (i && !ITEMS[e.result].cn.toLowerCase().includes(i) && !ITEMS[e.result].key.includes(i))
        continue;
      const n = planRecipe(e, s, this.size);
      let r = o.get(e.result);
      const rank = (t, e) => (e ? 4 : 0) + ("shaped" === t.type ? 2 : 0) + (recolours(t) ? 0 : 1);
      r
        ? ((r.many = !0), rank(e, n) > rank(r.r, r.plan) && ((r.r = e), (r.plan = n)))
        : o.set(e.result, (r = { r: e, plan: n, many: !1 }));
    }
    let n = [...o.values()];
    return (
      this.onlyCraftable && (n = n.filter((t) => t.plan)),
      n.sort((t, e) => (e.plan ? 1 : 0) - (t.plan ? 1 : 0)),
      n
    );
  }
  bookList() {
    const t = this.game.player.inv,
      sig = (t) => (t ? t.id + ":" + t.count : "-");
    let e =
      this.size +
      "|" +
      this.tab +
      "|" +
      this.search +
      "|" +
      !!this.onlyCraftable +
      "|" +
      !!this.net +
      "|";
    for (let s = 0; s < 36; s++) e += sig(t.slots[s]) + ",";
    for (const t of this.grid) e += sig(t) + ",";
    const s = performance.now();
    return (
      (e !== this.bookKey || (this.net && s - this.bookAt > 500)) &&
        ((this.bookKey = e), (this.bookAt = s), (this.bookCache = this.bookRecipes())),
      this.bookCache
    );
  }
  fillRecipe(t, e) {
    const s = this.game.player.inv,
      i = this.game.ui;
    for (let t = 0; t < this.grid.length; t++)
      this.grid[t] && (i.returnStack(this.grid[t]), (this.grid[t] = null));
    const o = new Map();
    for (let t = 0; t < 36; t++) {
      const e = s.slots[t];
      e && o.set(e.id, (o.get(e.id) || 0) + e.count);
    }
    const n = planRecipe(t.r, o, this.size);
    if (((this.ghost = null), !n)) {
      const e = new Array(this.size * this.size).fill(null),
        s = t.r;
      if ("shaped" === s.type)
        for (let t = 0; t < s.h; t++)
          for (let i = 0; i < s.w; i++) {
            const o = s.pattern[t][i];
            o && " " !== o && (e[t * this.size + i] = s.keys[o]);
          }
      else
        s.ing.forEach((t, s) => {
          e[s] = t;
        });
      return (
        (this.ghost = { slots: e, result: s.result, t: performance.now() }),
        void this.changed()
      );
    }
    let r = 1;
    if (e) {
      const t = new Map();
      for (const e of n) e && t.set(e.id, (t.get(e.id) || 0) + 1);
      r = 64;
      for (const [e, s] of t) r = Math.min(r, Math.floor(o.get(e) / s), maxStack(e));
      r = Math.max(1, r);
    }
    (n.forEach((t, e) => {
      t && (s.remove(t.id, r), (this.grid[e] = { id: t.id, count: r, dmg: 0 }));
    }),
      this.changed(),
      Sound.click());
  }
  bookLayout() {
    return {
      x: Math.floor((this.game.ui.w - 147) / 2) - (this.narrow ? 0 : 86),
      y: Math.floor((this.game.ui.h - 166) / 2),
      w: 147,
      h: 166,
    };
  }
  drawBook(t) {
    const e = t.ctx,
      s = this.bookLayout();
    this.tabRects = [];
    ([
      ["compass"],
      ["iron_axe", "golden_sword"],
      ["bricks"],
      ["lava_bucket", "apple"],
      ["redstone"],
    ].forEach((e, i) => {
      const o = i === this.tab,
        n = s.x - 30 - (o ? 2 : 0),
        r = s.y + 3 + 27 * i;
      (t.sprite(o ? "rb_tab_selected" : "rb_tab", n, r),
        this.tabRects.push({ x: n, y: r, w: 35, h: 27 }));
      let h = e.map((t) => ITEM_KEY[t]).filter((t) => void 0 !== t);
      (h.length || (h = [ITEM_KEY.iron_pickaxe]),
        h.forEach((e, s) =>
          t.drawItem(
            { id: e, count: 1 },
            n + 9 + (h.length > 1 ? 3 * s - 2 : 0),
            r + 5 + (h.length > 1 ? 3 * s - 1 : 0),
          ),
        ));
    }),
      e.drawImage(t.img.recipe_book, 1, 1, 147, 166, s.x, s.y, 147, 166),
      (this.searchRect = { x: s.x + 25, y: s.y + 13, w: 81, h: 14 }),
      this.searching || this.search
        ? this.searching || Font.draw(e, this.search, s.x + 27, s.y + 15, "#E0E0E0", !1)
        : Font.draw(e, "搜索…", s.x + 27, s.y + 15, "#808080", !1),
      (this.filterBtn = { x: s.x + 110, y: s.y + 12, w: 26, h: 16 }),
      t.sprite(
        (this.onlyCraftable ? "rb_filter_enabled" : "rb_filter_disabled") +
          (t.hit(this.filterBtn) ? "_hl" : ""),
        this.filterBtn.x,
        this.filterBtn.y,
      ));
    const i = this.bookList(),
      o = Math.max(1, Math.ceil(i.length / 20));
    ((this.page = clamp(this.page, 0, o - 1)), (this.bookCells = []));
    let n = null;
    if (
      (i.slice(20 * this.page, 20 * this.page + 20).forEach((e, i) => {
        const o = s.x + 11 + (i % 5) * 25,
          r = s.y + 31 + 25 * Math.floor(i / 5),
          h = { x: o, y: r, w: 25, h: 25, e: e };
        (this.bookCells.push(h),
          t.sprite(
            "rb_slot_" + (e.many ? "many_" : "") + (e.plan ? "craftable" : "uncraftable"),
            o,
            r,
          ),
          t.drawItem({ id: e.r.result, count: e.r.count }, o + 4, r + 4),
          t.hit(h) && (n = e));
      }),
      (this.prevBtn = { x: s.x + 38, y: s.y + 137, w: 12, h: 17 }),
      (this.nextBtn = { x: s.x + 93, y: s.y + 137, w: 12, h: 17 }),
      o > 1)
    ) {
      const i = this.page + 1 + "/" + o;
      (Font.draw(e, i, s.x + 73 - Math.floor(Font.width(i) / 2), s.y + 141, "#FFFFFF", !1),
        this.page > 0 &&
          t.sprite(
            "rb_page_backward" + (t.hit(this.prevBtn) ? "_hl" : ""),
            this.prevBtn.x,
            this.prevBtn.y,
          ),
        this.page < o - 1 &&
          t.sprite(
            "rb_page_forward" + (t.hit(this.nextBtn) ? "_hl" : ""),
            this.nextBtn.x,
            this.nextBtn.y,
          ));
    }
    t.hit(this.filterBtn) && !t.cursor
      ? t.tooltip(
          [{ text: this.onlyCraftable ? "显示全部" : "显示可合成的配方" }],
          t.mouse.x,
          t.mouse.y,
        )
      : n &&
        !t.cursor &&
        t.tooltip(t.itemLines({ id: n.r.result, count: n.r.count }), t.mouse.x, t.mouse.y);
  }
  drawGhost(t) {
    const e = this.ghost;
    if (!e) return;
    if (this.grid.some((t) => t)) return void (this.ghost = null);
    const s = t.ctx,
      i = Math.floor((performance.now() - e.t) / 1e3);
    let o = 0;
    for (const n of this.slots) {
      if ("craft" !== n.group && !n.output) continue;
      const r = n.output ? [e.result] : e.slots[o++];
      if (!r) continue;
      const h = r[i % r.length];
      ((s.fillStyle = "rgba(255,0,0,0.19)"),
        s.fillRect(this.x + n.x, this.y + n.y, 16, 16),
        (s.globalAlpha = 0.5),
        t.drawItem({ id: h, count: 1 }, this.x + n.x, this.y + n.y),
        (s.globalAlpha = 1));
    }
  }
  consume() {
    const t = this.result;
    for (let t = 0; t < this.grid.length; t++) {
      const e = this.grid[t];
      if (e) {
        if (e.id === item("water_bucket") || e.id === item("lava_bucket")) {
          this.grid[t] = makeStack("bucket");
          continue;
        }
        (e.count--, e.count || (this.grid[t] = null));
      }
    }
    (t && this.game.onCraft(t.id, t.count), this.changed());
  }
  draw(t) {
    const e = this.bookBtn,
      btn = () =>
        t.sprite(
          t.hit({ x: this.x + e.x, y: this.y + e.y, w: e.w, h: e.h })
            ? "rb_button_hl"
            : "rb_button",
          this.x + e.x,
          this.y + e.y,
        );
    if (this.bookOpen && this.narrow && !this.peek)
      return (t.dim(0.6), this.drawBook(t), void btn());
    (this.drawBase(t),
      this.bookOpen && !this.peek && this.drawBook(t),
      this.drawExtra(t),
      btn(),
      this.drawGhost(t),
      this.drawSlots(t));
  }
  mouseDown(t, e, s, i, o) {
    const n = this.bookBtn;
    if (t.hit({ x: this.x + n.x, y: this.y + n.y, w: n.w, h: n.h }, e, s))
      return this.peek
        ? ((this.peek = !1), void Sound.click())
        : ((this.game.settings.recipeBook = !this.bookOpen),
          this.game.saveSettings(),
          this.layout(),
          void Sound.click());
    if (this.bookOpen && !this.peek) {
      const n = { x: 0, y: 0, w: 0, h: 0 };
      if (t.hit(this.filterBtn || n, e, s))
        return ((this.onlyCraftable = !this.onlyCraftable), (this.page = 0), void Sound.click());
      if (t.hit(this.prevBtn || n, e, s)) return (this.page--, void Sound.click());
      if (t.hit(this.nextBtn || n, e, s)) return (this.page++, void Sound.click());
      for (let i = 0; i < (this.tabRects || []).length; i++)
        if (t.hit(this.tabRects[i], e, s))
          return ((this.tab = i), (this.page = 0), void Sound.click());
      if (t.hit(this.searchRect || n, e, s)) {
        const e = this.searchRect;
        return (
          (this.searching = !0),
          void t.showInput(e.x, e.y, e.w, e.h, this.search, () => {}, {
            onInput: (t) => {
              ((this.search = t), (this.page = 0), (this.tab = 0));
            },
            onEsc: () => {
              (t.hideInput(), (this.searching = !1));
            },
            max: 30,
          })
        );
      }
      this.searching && (t.hideInput(), (this.searching = !1));
      for (const n of this.bookCells || [])
        if (t.hit(n, e, s))
          return void (
            t.cursor || (this.fillRecipe(n.e, o || 2 === i), this.narrow && (this.peek = !0))
          );
      if (t.hit(this.bookLayout(), e, s) || this.narrow) return;
    }
    super.mouseDown(t, e, s, i, o);
  }
  wheel(t, e) {
    this.bookOpen && !this.peek && t.hit(this.bookLayout()) && (this.page += Math.sign(e));
  }
  scrollsAt(t, e) {
    return !!this.bookOpen && !this.peek && this.game.ui.hit(this.bookLayout(), t, e);
  }
  outside(t, e) {
    return (
      super.outside(t, e) &&
      !(this.bookOpen && !this.peek && this.game.ui.hit(this.bookLayout(), t, e))
    );
  }
  drawExtra(t) {
    if (2 === this.size) {
      Font.draw(t.ctx, "合成", this.x + 97, this.y + 6, "#404040", !1);
      const e = this.game.renderer.playerPreview(this.game, t, this.x + 26, this.y + 8, 49, 70);
      e &&
        ((t.ctx.imageSmoothingEnabled = !0),
        t.ctx.drawImage(e, this.x + 26, this.y + 8, 49, 70),
        (t.ctx.imageSmoothingEnabled = !1));
    } else Font.draw(t.ctx, "物品栏", this.x + 8, this.y + 72, "#404040", !1);
  }
  close() {
    for (const t of this.grid) t && this.game.ui.returnStack(t);
    (this.grid.fill(null),
      (this.result = null),
      (this.ghost = null),
      this.searching && (this.game.ui.hideInput(), (this.searching = !1)));
  }
}
class ChestScreen extends ContainerScreen {
  constructor(t, e, s = "箱子") {
    Array.isArray(e) || (e = [e]);
    const i = 3 * e.length;
    (super(t, "generic_54", 176, 114 + 18 * i, s),
      (this.bes = e),
      (this.be = e[0]),
      (this.rows = i),
      e.forEach((t, e) => {
        for (let s = 0; s < 3; s++)
          for (let i = 0; i < 9; i++) {
            const o = 9 * s + i;
            this.slots.push({
              x: 8 + 18 * i,
              y: 18 + 18 * (3 * e + s),
              get: () => t.slots[o],
              set: (e) => {
                t.slots[o] = e;
              },
              group: "container",
            });
          }
      }),
      this.addPlayerSlots(31 + 18 * i, 89 + 18 * i));
    for (const s of e) t.openChests.add(s.pos.join(","));
    const o = this.be.pos,
      n = t.world && BLOCKS[t.world.getBlock(o[0], o[1], o[2])];
    this.blockKey = n ? n.key : "";
  }
  owns(t) {
    return this.bes.includes(t);
  }
  drawBase(t) {
    t.dim(0.6);
    const e = t.ctx,
      s = t.img.generic_54,
      i = 17 + 18 * this.rows;
    (e.drawImage(s, 0, 0, 176, i, this.x, this.y, 176, i),
      e.drawImage(s, 0, 126, 176, 96, this.x, this.y + i, 176, 96),
      Font.draw(e, this.title, this.x + 8, this.y + 6, "#404040", !1),
      Font.draw(e, "物品栏", this.x + 8, this.y + i + 3, "#404040", !1));
  }
  close() {
    for (const t of this.bes)
      (this.game.markBlockEntity(t), this.game.openChests.delete(t.pos.join(",")));
    const t = this.be.pos,
      e = [t[0] + 0.5, t[1] + 0.5, t[2] + 0.5],
      s = this.blockKey,
      i = this.game.world,
      o = 0.1 * Math.random() + 0.9;
    if ("barrel" === s) {
      const s = i.getBlock(t[0], t[1], t[2]),
        n = i.getMeta(t[0], t[1], t[2]);
      (BLOCKS[s] &&
        "barrel" === BLOCKS[s].key &&
        "true" === Features.propOf(s, n, "open") &&
        (i.setMeta(t[0], t[1], t[2], Features.withProp(s, n, "open", !1)),
        this.game.flushMesh && this.game.flushMesh()),
        Sound.ev("block.barrel.close", e, 0.5, o));
    } else
      /(^|_)shulker_box$/.test(s)
        ? Sound.ev("block.shulker_box.close", e, 0.5, o)
        : "ender_chest" === s
          ? Sound.ev("block.ender_chest.close", e, 0.5, o)
          : Sound.chest(e, !1);
  }
}
class FurnaceScreen extends ContainerScreen {
  constructor(t, e) {
    (super(t, "furnace", 176, 166, "熔炉"),
      (this.be = e),
      this.slots.push({
        x: 56,
        y: 17,
        get: () => e.input,
        set: (t) => {
          e.input = t;
        },
        group: "container",
        accept: (t) => !!COOKING[e.kind || "smelting"][t.id],
      }),
      this.slots.push({
        x: 56,
        y: 53,
        get: () => e.fuel,
        set: (t) => {
          e.fuel = t;
        },
        group: "container",
        accept: (t) => fuelValue(t.id) > 0,
      }),
      this.slots.push({
        x: 116,
        y: 35,
        output: !0,
        get: () => e.output,
        set: (t) => {
          e.output = t;
        },
        onTake: (t) => {
          (this.game.onSmeltTake(t, e), (e.output = null));
        },
      }),
      this.addPlayerSlots(84, 142));
  }
  canPlace(t, e) {
    return !t.output && (!t.accept || t.accept(e));
  }
  quickMove(t) {
    const e = t.get();
    if (e) {
      if ("main" === t.group || "hotbar" === t.group) {
        const s = COOKING[this.be.kind || "smelting"][e.id]
          ? this.slots[0]
          : fuelValue(e.id)
            ? this.slots[1]
            : null;
        if (s) {
          const i = s.get();
          if (!i) return (s.set(e), void t.set(null));
          if (sameKind(i, e)) {
            const s = Math.min(e.count, maxStack(e.id) - i.count);
            return ((i.count += s), (e.count -= s), void (e.count || t.set(null)));
          }
        }
      }
      super.quickMove(t);
    }
  }
  drawExtra(t) {
    const e = this.be,
      s = t.ctx;
    if (e.burn > 0) {
      const i = Math.ceil((e.burn / e.burnMax) * 13) + 1;
      s.drawImage(t.img.lit_progress, 0, 14 - i, 14, i, this.x + 56, this.y + 36 + 14 - i, 14, i);
    }
    if (e.cook > 0) {
      const i = Math.ceil((e.cook / (e.cookMax || 200)) * 24);
      s.drawImage(t.img.burn_progress, 0, 0, i, 16, this.x + 79, this.y + 34, i, 16);
    }
    Font.draw(s, "物品栏", this.x + 8, this.y + 73, "#404040", !1);
  }
  close() {
    this.game.markBlockEntity(this.be);
  }
}
class CreativeScreen extends ContainerScreen {
  constructor(t) {
    (super(t, "tab_items", 195, 136, null),
      (this.tab = 0),
      (this.scroll = 0),
      (this.search = ""),
      (this.items = []),
      (this.trash = null));
    const e = t.player.inv;
    for (let t = 0; t < 9; t++)
      this.slots.push({
        x: 9 + 18 * t,
        y: 112,
        get: () => e.slots[t],
        set: (s) => {
          e.slots[t] = s;
        },
        group: "hotbar",
      });
    for (let t = 0; t < 5; t++)
      for (let e = 0; e < 9; e++) {
        const s = 9 * t + e;
        this.slots.push({
          x: 9 + 18 * e,
          y: 18 + 18 * t,
          creative: !0,
          get: () => {
            const t = this.items[9 * this.scroll + s];
            return null == t
              ? null
              : "object" == typeof t
                ? { ...t, count: 1 }
                : { id: t, count: 1 };
          },
          set: () => {},
        });
      }
    ((this.trashSlot = { x: 173, y: 112, trash: !0, get: () => null, set: () => {} }),
      this.slots.push(this.trashSlot),
      (this.itemSlots = this.slots));
    const s = ["slot_helmet", "slot_chestplate", "slot_leggings", "slot_boots"];
    ((this.invSlots = [
      ...[0, 1, 2, 3].map((t) => ({
        x: 54 + 54 * Math.floor(t / 2),
        y: 6 + (t % 2) * 27,
        armorSlot: t,
        emptyIcon: s[t],
        max: 1,
        group: "armor",
        get: () => e.slots[36 + t],
        set: (s) => {
          e.slots[36 + t] = s;
        },
        accept: (e) => !!ITEMS[e.id] && ITEMS[e.id].armor && ITEMS[e.id].armor.slot === t,
      })),
      {
        x: 35,
        y: 20,
        emptyIcon: "slot_shield",
        group: "offhand",
        get: () => e.slots[40],
        set: (t) => {
          e.slots[40] = t;
        },
      },
      ...Array.from({ length: 27 }, (t, s) => ({
        x: 9 + (s % 9) * 18,
        y: 54 + 18 * Math.floor(s / 9),
        group: "main",
        get: () => e.slots[9 + s],
        set: (t) => {
          e.slots[9 + s] = t;
        },
      })),
      ...this.itemSlots.filter((t) => "hotbar" === t.group),
      this.trashSlot,
    ]),
      this.setTab(0));
  }
  tabs() {
    return [
      ...CREATIVE_TABS.slice(0, 10),
      { name: "搜索物品", icon: "compass_search", search: !0 },
      { name: "生存模式物品栏", inv: !0 },
      ...CREATIVE_TABS.slice(10),
    ];
  }
  setTab(t) {
    ((this.tab = t), (this.scroll = 0));
    const e = this.tabs();
    if (((this.slots = e[t].inv ? this.invSlots : this.itemSlots), e[t].inv))
      return ((this.bg = "tab_inventory"), (this.items = []), void this.game.ui.hideInput());
    if (e[t].search) {
      this.bg = "tab_item_search";
      const t = this.search.trim().toLowerCase(),
        e = ITEMS.filter((t) => t && !(BLOCKS[t.id] && BLOCKS[t.id].noItem)).map((t) => t.id),
        s = t
          ? CREATIVE_TABS.flatMap((t) =>
              t.items
                .filter((t) => "object" == typeof t)
                .map((t) => {
                  const { key: e, ...s } = t;
                  return { id: item(e), count: 1, dmg: 0, ...s };
                }),
            )
          : [],
        text = (t) => {
          const e = ITEMS[t.id] || ITEMS[t];
          return (
            ("function" == typeof netItemLines && "object" == typeof t
              ? netItemLines(t, [{ text: e.cn, color: "#FFFFFF" }])
              : [{ text: e.cn }]
            )
              .map((t) => t.text)
              .join(" ") +
            " " +
            e.key +
            " " +
            (t.e ? t.e.map((t) => t[0]).join(" ") : "") +
            " " +
            (t.pot || "")
          ).toLowerCase();
        };
      this.items = [...e, ...s].filter((e) => !t || text(e).includes(t));
      const i = this.game.ui;
      void 0 !== this.x &&
        i.showInput(this.x + 82, this.y + 6, 89, 10, this.search, () => {}, {
          onInput: (t) => {
            ((this.search = t), this.setTab(this.tab));
          },
          onEsc: () => i.close(),
          max: 30,
        });
    } else
      ((this.bg = "tab_items"),
        (this.items = e[t].items.map((t) => {
          if ("object" != typeof t) return item(t);
          const { key: e, ...s } = t;
          return { id: item(e), ...s };
        })),
        this.game.ui.hideInput());
  }
  layout() {
    (super.layout(), this.tabs()[this.tab].search && this.setTab(this.tab));
  }
  maxScroll() {
    return Math.max(0, Math.ceil(this.items.length / 9) - 5);
  }
  wheel(t, e) {
    this.scroll = clamp(this.scroll + Math.sign(e), 0, this.maxScroll());
  }
  tabLayout() {
    const t = this.tabs();
    if (this._tl && this._tl.n === t.length) return this._tl;
    const e = [],
      s = [];
    let i = 1,
      o = 0;
    for (let n = 12; n < t.length; n++)
      (((t[n].newPage && o > 0) || 10 === o) && (i++, (o = 0)), (e[n] = i), (s[n] = o++));
    return (this._tl = { n: t.length, page: e, slot: s, pages: t.length > 12 ? i + 1 : 1 });
  }
  pages() {
    return this.tabLayout().pages;
  }
  tabPage(t) {
    return 10 === t || 11 === t ? -1 : t < 10 ? 0 : this.tabLayout().page[t];
  }
  tabShown(t) {
    const e = this.tabPage(t);
    return e < 0 || e === (this.page || 0);
  }
  tabSlot(t) {
    return t < 10 ? t : this.tabLayout().slot[t];
  }
  tabCol(t) {
    return 10 === t || 11 === t ? 6 : this.tabSlot(t) % 5;
  }
  tabTop(t) {
    return 10 === t || (11 !== t && this.tabSlot(t) < 5);
  }
  tabRect(t) {
    const e = this.tabCol(t);
    return {
      x: this.x + (6 === e ? 167 : 27 * e),
      y: this.tabTop(t) ? this.y - 28 : this.y + 132,
      w: 26,
      h: 30,
    };
  }
  tabSprite(t, e) {
    return (
      "tab_" +
      (this.tabTop(t) ? "top" : "bottom") +
      (e ? "_selected_" : "_unselected_") +
      (this.tabCol(t) + 1)
    );
  }
  pageBtn(t) {
    return { x: this.x + (t < 0 ? 136 : 152), y: this.y - 24, w: 15, h: 18 };
  }
  setPage(t) {
    const e = this.pages();
    if ((t = clamp(t, 0, e - 1)) === (this.page || 0)) return;
    this.page = t;
    const s = this.tabs();
    if (!s[this.tab].search && !s[this.tab].inv) {
      const e = s.findIndex((e, s) => this.tabPage(s) === t);
      e >= 0 && this.setTab(e);
    }
  }
  draw(t) {
    t.dim(0.6);
    const e = t.ctx,
      s = this.tabs(),
      i = this.tabShown(this.tab);
    for (let e = 0; e < s.length; e++)
      if (e !== this.tab && this.tabShown(e)) {
        const s = this.tabRect(e);
        t.sprite(this.tabSprite(e, !1), s.x, s.y);
      }
    if ((e.drawImage(t.img[this.bg], 0, 0, 195, 136, this.x, this.y, 195, 136), i)) {
      const e = this.tabRect(this.tab);
      t.sprite(this.tabSprite(this.tab, !0), e.x, e.y);
    }
    for (let e = 0; e < s.length; e++) {
      if (!this.tabShown(e)) continue;
      const i = this.tabRect(e),
        o = s[e],
        n = (!o.search && !o.inv && o.iconStack) || {
          id: o.search ? item("book") : o.inv ? item("chest") : item(o.icon),
          count: 1,
        };
      t.drawItem(n, i.x + 5, i.y + (this.tabTop(e) ? 9 : 7));
    }
    if (this.pages() > 1) {
      const s = this.page || 0;
      for (const i of [-1, 1]) {
        const o = this.pageBtn(i),
          n = i < 0 ? s > 0 : s < this.pages() - 1,
          r = n && t.hit(o);
        (t.nine(n ? (r ? "button_hl" : "button") : "button_dis", o.x, o.y, o.w, o.h, 3),
          Font.center(e, i < 0 ? "<" : ">", o.x + o.w / 2 + 1, o.y + 5, n ? "#FFFFFF" : "#A0A0A0"));
      }
      Font.center(e, s + 1 + " / " + this.pages(), this.x + 151, this.y - 37, "#FFFFFF");
    }
    s[this.tab].inv || Font.draw(e, s[this.tab].name, this.x + 8, this.y + 6, "#404040", !1);
    const o = this.maxScroll(),
      n = this.y + 18 + (o ? Math.round((this.scroll / o) * 79) : 0);
    if (s[this.tab].inv) {
      const s = this.game.renderer.playerPreview(this.game, t, this.x + 73, this.y + 6, 32, 43);
      s &&
        ((e.imageSmoothingEnabled = !0),
        e.drawImage(s, this.x + 73, this.y + 6, 32, 43),
        (e.imageSmoothingEnabled = !1));
    } else t.sprite(o ? "scroller" : "scroller_disabled", this.x + 175, n);
    ((t.ctx.fillStyle = "#8b8b8b"),
      t.ctx.fillRect(this.x + 173, this.y + 112, 16, 16),
      Font.center(e, "X", this.x + 181, this.y + 116, "#FF5555"),
      this.drawSlots(t));
    for (let e = 0; e < s.length; e++)
      this.tabShown(e) &&
        t.hit(this.tabRect(e)) &&
        t.tooltip([{ text: s[e].name }], t.mouse.x, t.mouse.y);
    if (this.pages() > 1)
      for (const e of [-1, 1]) {
        const s = (this.page || 0) + e;
        s >= 0 &&
          s < this.pages() &&
          t.hit(this.pageBtn(e)) &&
          t.tooltip(
            [
              { text: e < 0 ? "上一页" : "下一页" },
              { text: 0 === s ? "基础物品" : "模组物品", color: "#AAAAAA" },
            ],
            t.mouse.x,
            t.mouse.y,
          );
      }
  }
  drawSlots(t) {
    const e = this.slotAt(t.mouse.x, t.mouse.y);
    for (const s of this.slots)
      s.trash ||
        (!s.get() &&
          s.emptyIcon &&
          ((t.ctx.globalAlpha = 0.6),
          t.sprite(s.emptyIcon, this.x + s.x, this.y + s.y),
          (t.ctx.globalAlpha = 1)),
        t.drawItem(s.get(), this.x + s.x, this.y + s.y),
        s === e &&
          ((t.ctx.fillStyle = "rgba(255,255,255,0.5)"),
          t.ctx.fillRect(this.x + s.x, this.y + s.y, 16, 16)));
    e && e.get() && !t.cursor && t.tooltip(t.tipLines(e.get()), t.mouse.x, t.mouse.y);
  }
  mouseDown(t, e, s, i, o) {
    const n = this.tabs();
    if (this.pages() > 1)
      for (const i of [-1, 1])
        if (t.hit(this.pageBtn(i), e, s)) {
          const t = this.page || 0;
          return (this.setPage(t + i), void ((this.page || 0) !== t && Sound.click()));
        }
    for (let i = 0; i < n.length; i++)
      if (this.tabShown(i) && t.hit(this.tabRect(i), e, s))
        return (this.setTab(i), void Sound.click());
    if (
      !n[this.tab].inv &&
      e >= this.x + 175 &&
      e < this.x + 187 &&
      s >= this.y + 18 &&
      s < this.y + 130
    )
      return ((this.scrolling = !0), void this.mouseMove(t, e, s));
    const r = this.slotAt(e, s);
    if (r && r.trash)
      t.cursor ? (t.cursor = null) : o && this.game.player.inv.slots.fill(null, 0, 36);
    else {
      if (r && r.creative) {
        const e = r.get();
        if (t.cursor) return void (t.cursor = null);
        if (!e) return;
        if (o) {
          const t = this.game.player.inv,
            s = t.slots.findIndex((t, e) => e < 9 && !t);
          return void (t.slots[s >= 0 ? s : t.sel] = { ...e, count: maxStack(e.id), dmg: 0 });
        }
        return void (t.cursor = { ...e, count: 2 === i ? 1 : maxStack(e.id), dmg: 0 });
      }
      r && 1 === i && r.get()
        ? (t.cursor = { ...r.get(), count: maxStack(r.get().id) })
        : super.mouseDown(t, e, s, i, o);
    }
  }
  mouseMove(t, e, s) {
    if (this.scrolling && t.mouse.down) {
      const t = this.maxScroll();
      return void (this.scroll = clamp(Math.round(((s - this.y - 25) / 79) * t), 0, t));
    }
    super.mouseMove(t, e, s);
  }
  mouseUp(t, e, s, i) {
    ((this.scrolling = !1), super.mouseUp(t, e, s, i));
  }
  quickMove(t) {
    if (this.tabs()[this.tab].inv) return super.quickMove(t);
    "hotbar" === t.group && t.set(null);
  }
  outside(t, e) {
    return super.outside(t, e) && e > this.y - 28 && e < this.y + 164;
  }
  key(t, e) {
    return (
      !(!this.tabs()[this.tab].search || document.activeElement !== t.input) || super.key(t, e)
    );
  }
}
class MenuScreen {
  constructor(t, e) {
    ((this.game = t),
      (this.title = e),
      (this.widgets = []),
      (this.bgDim = 0.5),
      (this.blurBg = !0));
  }
  layout() {}
  draw(t) {
    (this.blurBg
      ? t.menuBackground()
      : this.bgDirt
        ? this.drawDirt(t)
        : this.bgDim && t.dim(this.bgDim),
      this.title && Font.center(t.ctx, this.title, t.w / 2, this.titleY ?? 30, "#FFFFFF"),
      this.drawExtra && this.drawExtra(t));
    for (const e of this.widgets)
      e.slider
        ? t.slider(e)
        : e.text
          ? Font.center(
              t.ctx,
              "function" == typeof e.text ? e.text() : e.text,
              e.x,
              e.y,
              e.color || "#FFFFFF",
            )
          : t.button(e);
    for (const e of this.widgets)
      e.tip &&
        t.hit(e) &&
        t.tooltip(
          e.tip.map((t) => ({ text: t })),
          t.mouse.x,
          t.mouse.y,
        );
  }
  drawDirt(t) {
    const e = this.game.renderer;
    if (!t.dirtTile) {
      const s = (t.dirtTile = document.createElement("canvas"));
      ((s.width = 32), (s.height = 32));
      const i = s.getContext("2d");
      ((i.imageSmoothingEnabled = !1),
        i.drawImage(e.stripCanvas, ...e.tileXY(T("dirt")), 16, 16, 0, 0, 32, 32),
        (i.fillStyle = "rgba(0,0,0,0.75)"),
        i.fillRect(0, 0, 32, 32));
    }
    t.tiled(t.dirtTile, "dirt", 0, 0, t.w, t.h);
  }
  mouseDown(t, e, s, i) {
    if (0 === i)
      for (const i of this.widgets) {
        if (i.slider && t.hit(i, e, s))
          return ((this.dragging = i), this.mouseMove(t, e, s), void Sound.click());
        if (!i.slider && !i.text && !1 !== i.enabled && t.hit(i, e, s))
          return (Sound.init(), Sound.click(), void i.onClick());
      }
  }
  mouseMove(t, e) {
    if (this.dragging && t.mouse.down) {
      const t = this.dragging;
      ((t.value = clamp((e - t.x - 4) / (t.w - 8), 0, 1)), t.onChange(t.value));
    }
  }
  mouseUp() {
    this.dragging = null;
  }
  key(t, e) {
    return !("Escape" !== e.key || !this.onEsc) && (this.onEsc(), !0);
  }
}
function planRecipe(t, e, s) {
  const i = new Map(e),
    take = (t) => {
      let e = -1,
        s = 0;
      for (const o of t) {
        const t = i.get(o) || 0;
        t > s && ((e = o), (s = t));
      }
      return e < 0 ? null : (i.set(e, s - 1), { id: e });
    },
    o = new Array(s * s).fill(null);
  if ("shaped" === t.type)
    for (let e = 0; e < t.h; e++)
      for (let i = 0; i < t.w; i++) {
        const n = t.pattern[e][i];
        if (" " === n || void 0 === n) continue;
        const r = take(t.keys[n]);
        if (!r) return null;
        o[e * s + i] = r;
      }
  else
    for (let e = 0; e < t.ing.length; e++) {
      const s = take(t.ing[e]);
      if (!s) return null;
      o[e] = s;
    }
  return o;
}
//# sourceURL=js/ui.js
