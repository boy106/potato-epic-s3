"use strict";
const MOD_BLUE = "rgba(120,200,255,0.55)";
class SmoothScroll {
  constructor() {
    ((this.y = 0),
      (this.goal = 0),
      (this.v = 0),
      (this.max = 0),
      (this.held = !1),
      (this.t = 0),
      (this.trail = []));
  }
  setMax(t) {
    ((this.max = Math.max(0, t)),
      this.held || this.v || (this.goal = clamp(this.goal, 0, this.max)));
  }
  drag(t) {
    const e = this.y < 0 ? -this.y : this.y > this.max ? this.y - this.max : 0;
    ((this.y -= t * (e > 0 ? Math.max(0.12, 0.5 - e / 100) : 1)),
      (this.goal = this.y),
      (this.held = !0),
      (this.v = 0));
    const o = performance.now();
    for (this.trail.push([o, this.y]); this.trail.length > 2 && o - this.trail[0][0] > 90;)
      this.trail.shift();
  }
  release() {
    const t = this.trail,
      e = performance.now();
    if (
      ((this.held = !1),
      (this.trail = []),
      (this.goal = clamp(this.y, 0, this.max)),
      t.length < 2 || e - t[t.length - 1][0] > 70)
    )
      return;
    const o = (t[t.length - 1][0] - t[0][0]) / 1e3;
    o > 0.005 && (this.v = clamp((t[t.length - 1][1] - t[0][1]) / o, -3e3, 3e3));
  }
  wheel(t) {
    ((this.v = 0), (this.goal = clamp(this.goal + t, 0, this.max)));
  }
  step() {
    const t = performance.now(),
      e = this.t ? Math.min(0.05, (t - this.t) / 1e3) : 0;
    if (((this.t = t), this.held || !e)) return;
    const out = () => this.y < 0 || this.y > this.max;
    if (
      this.v &&
      ((this.y += this.v * e),
      (this.v *= Math.exp(-(out() ? 30 : 3) * e)),
      Math.abs(this.v) < 8 && (this.v = 0),
      (this.goal = clamp(this.y, 0, this.max)),
      !out())
    )
      return;
    const o = clamp(this.goal, 0, this.max),
      s = o - this.y;
    this.y = Math.abs(s) < 0.05 ? o : this.y + s * (1 - Math.exp(-15 * e));
  }
  moving() {
    return this.held || !!this.v || Math.abs(clamp(this.goal, 0, this.max) - this.y) > 0.05;
  }
}
class ModListScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, e),
      (this.titleY = 10),
      (this.pauses = !1),
      (this.sc = new SmoothScroll()),
      (this.rows = []),
      (this.contentH = 0),
      (this.area = { x: 0, y: 34, w: 0, h: 0 }),
      (this.t0 = performance.now()));
  }
  place() {
    let t = 4;
    for (const e of this.rows) ((e.y = t), (t += e.h + 4));
    ((this.contentH = t), this.sc.setMax(t - this.area.h));
  }
  offset(t) {
    return Math.round(this.sc.y * t.scale) / t.scale;
  }
  wheel(t, e) {
    this.sc.wheel(Math.abs(e) < 4 ? 30 * Math.sign(e) : clamp((e * t.dpr) / t.scale, -90, 90));
  }
  touchHold() {
    ((this.halted = Math.abs(this.sc.v) > 60), (this.sc.v = 0));
  }
  scrollPx(t) {
    this.sc.drag(t);
  }
  scrollRelease() {
    this.sc.release();
  }
  inArea(t, e) {
    const o = this.area;
    return t >= o.x - 4 && t < o.x + o.w + 8 && e >= o.y && e < o.y + o.h;
  }
  mouseDown(t, e, o, s) {
    if (0 === s && this.inArea(e, o))
      return (
        (this.press = { y: o, ly: o, moved: !1, stop: this.halted || Math.abs(this.sc.v) > 60 }),
        (this.halted = !1),
        void (this.sc.v = 0)
      );
    super.mouseDown(t, e, o, s);
  }
  mouseMove(t, e, o) {
    const s = this.press;
    if (s && t.mouse.down)
      return (
        !s.moved && Math.abs(o - s.y) > 3 && ((s.moved = !0), (s.ly = s.y)),
        void (s.moved && (this.sc.drag(o - s.ly), (s.ly = o)))
      );
    super.mouseMove(t, e, o);
  }
  mouseUp(t, e, o) {
    const s = this.press;
    if (((this.press = null), s && s.moved)) this.sc.release();
    else if (s && !s.stop && this.inArea(e, o)) {
      const s = o - this.area.y + this.offset(t),
        i = this.rows.find((t) => s >= t.y && s < t.y + t.h);
      i && this.clickRow(i, e, s - i.y);
    }
    super.mouseUp(t, e, o);
  }
  hover(t, e, o) {
    const s = this.area,
      i = t.mouse.x,
      n = t.mouse.y;
    return (
      !(this.press && this.press.moved) &&
      !this.sc.held &&
      i >= s.x &&
      i < s.x + s.w &&
      n >= Math.max(s.y, o) &&
      n < Math.min(s.y + s.h, o + e.h)
    );
  }
  drawList(t) {
    this.sc.step();
    const e = t.ctx,
      o = this.area,
      s = this.offset(t),
      i = performance.now() - this.t0;
    (t.listBackground(o.y, o.y + o.h),
      e.save(),
      e.beginPath(),
      e.rect(0, o.y, t.w, o.h),
      e.clip(),
      this.rows.forEach((n, a) => {
        const h = o.y + n.y - s;
        if (h + n.h < o.y || h > o.y + o.h) return;
        const l = clamp((i - 45 * a) / 220, 0, 1);
        l <= 0 ||
          ((e.globalAlpha = l),
          this.drawRow(t, n, h + Math.round((1 - l) * (1 - l) * 8)),
          (e.globalAlpha = 1));
      }));
    let n = e.createLinearGradient(0, o.y, 0, o.y + 6);
    if (
      (n.addColorStop(0, "rgba(0,0,0,0.5)"),
      n.addColorStop(1, "rgba(0,0,0,0)"),
      (e.fillStyle = n),
      e.fillRect(0, o.y, t.w, 6),
      (n = e.createLinearGradient(0, o.y + o.h - 6, 0, o.y + o.h)),
      n.addColorStop(0, "rgba(0,0,0,0)"),
      n.addColorStop(1, "rgba(0,0,0,0.5)"),
      (e.fillStyle = n),
      e.fillRect(0, o.y + o.h - 6, t.w, 6),
      e.restore(),
      this.sc.max > 0)
    ) {
      const t = o.h - 4,
        s = Math.max(16, Math.round((t * o.h) / this.contentH)),
        i = clamp(this.sc.y / this.sc.max, 0, 1),
        n = o.x + o.w + 4,
        a = o.y + 2 + Math.round((t - s) * i);
      ((e.fillStyle = "rgba(0,0,0,0.45)"),
        e.fillRect(n, o.y + 2, 3, t),
        (e.fillStyle = this.sc.moving() ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.45)"),
        e.fillRect(n, a, 3, s));
    }
  }
}
const modIconImgs = new Map();
function drawModIcon(t, e, o, s, i) {
  const n = t.ctx;
  ((n.fillStyle = "#373737"),
    n.fillRect(o, s, i + 2, i + 2),
    (n.fillStyle = "#FFFFFF"),
    n.fillRect(o + 1, s + 1, i + 1, i + 1),
    (n.fillStyle = "#8B8B8B"),
    n.fillRect(o + 1, s + 1, i, i));
  let a = e.icon ? modIconImgs.get(e.id) : null;
  (e.icon && !a && ((a = new Image()), (a.src = e.icon), modIconImgs.set(e.id, a)),
    a && a.complete && a.naturalWidth
      ? ((n.imageSmoothingEnabled = a.naturalWidth > 16),
        (n.imageSmoothingQuality = "high"),
        n.drawImage(a, o + 1, s + 1, i, i),
        (n.imageSmoothingEnabled = !1))
      : Font.center(
          n,
          String(e.name || e.id).slice(0, 1),
          o + 1 + i / 2,
          s + 1 + Math.floor((i - 8) / 2),
          "#FFFFFF",
        ));
}
function modFrame(t, e, o, s, i) {
  (t.fillRect(e, o, s, 1),
    t.fillRect(e, o + i - 1, s, 1),
    t.fillRect(e, o + 1, 1, i - 2),
    t.fillRect(e + s - 1, o + 1, 1, i - 2));
}
function modWrap(t, e, o) {
  const s = [],
    i = "，、。；：！？ ,;:";
  let n = "";
  for (const o of String(t || "")) {
    if (n && Font.width(n + o) > e && !i.includes(o)) {
      let t = -1;
      for (let e = n.length - 1; e >= Math.max(1, n.length - 8); e--)
        if (i.includes(n[e])) {
          t = e + 1;
          break;
        }
      t > 0 && t < n.length ? (s.push(n.slice(0, t)), (n = n.slice(t))) : (s.push(n), (n = ""));
    }
    n += o;
  }
  return (
    n && s.push(n),
    s.length > o && ((s.length = o), (s[o - 1] = fitText(s[o - 1] + "……", e))),
    s.length ? s : [""]
  );
}
const modMB = (t) =>
  t < 102400 ? Math.max(1, Math.round(t / 1024)) + " KB" : (t / 1048576).toFixed(1) + " MB";
function drawModName(t, e, o, s, i) {
  const n = fitText(e.name || e.id, i),
    a = Font.width(n);
  (Font.draw(t, n, o, s, "#FFFFFF"),
    e.en && a + 6 < i - 12 && Font.draw(t, fitText(e.en, i - a - 6), o + a + 6, s, "#9A9A9A"));
}
class ModsScreen extends ModListScreen {
  constructor(t, e) {
    (super(t, "模组"),
      (this.parent = e),
      (this.list = null),
      (this.note = "正在读取模组列表…"),
      (this.noteColor = "#A0A0A0"),
      Mods.loadIndex()
        .then((t) => {
          ((this.list = Mods.listed(t)),
            (this.note = ""),
            (this.t0 = performance.now()),
            this.layout(),
            Mods.dl &&
              !Mods.dl.background &&
              this.follow((t.mods || []).find((t) => t.id === Mods.dl.id)));
        })
        .catch((t) => {
          ((this.list = []), (this.note = t.message), (this.noteColor = "#FF5555"), this.layout());
        }),
      this.takeGift());
  }
  async takeGift() {
    const t = "undefined" != typeof Cosmetics ? Cosmetics : null;
    if (
      t &&
      "undefined" != typeof Account &&
      "undefined" != typeof RoomService &&
      RoomService.base()
    )
      if (Account.loggedIn) {
        if (!t.has(MODS_GIFT) && !ModsScreen.giftAsked) {
          ModsScreen.giftAsked = !0;
          try {
            const t = await Account.api("/api/account/gift/mods", {});
            if ((t.account && Account.took({ account: t.account }), !t.fresh)) return;
            ("undefined" != typeof Telemetry && Telemetry.count && Telemetry.count("mods_gift"),
              (this.pop = { id: t.gift || MODS_GIFT, t0: performance.now() }),
              Sound.ev && Sound.ev("entity.player.levelup", null, 0.8, 1),
              this.layout());
          } catch (t) {
            ModsScreen.giftAsked = !1;
          }
        }
      } else this.guestGift = !t.has(MODS_GIFT);
  }
  popButtons() {
    const t = this.game.ui,
      e = Math.floor(t.w / 2),
      o = { x: e - 110, y: Math.floor(t.h / 2) - 62, w: 220, h: 124 };
    return {
      P: o,
      wear: {
        x: e - 104,
        y: o.y + o.h - 26,
        w: 102,
        h: 20,
        label: "去穿戴",
        gold: !0,
        act: () => {
          ((this.pop = null), Cosmetics.openWardrobe(this.game, this, MODS_GIFT));
        },
      },
      ok: {
        x: e + 2,
        y: o.y + o.h - 26,
        w: 102,
        h: 20,
        label: "好的",
        act: () => {
          ((this.pop = null), this.layout());
        },
      },
    };
  }
  mouseDown(t, e, o, s) {
    if (this.pop) {
      if (0 === s && performance.now() - this.pop.t0 > 400)
        for (const s of ["wear", "ok"]) {
          const i = this.popButtons()[s];
          if (t.hit(i, e, o)) return (Sound.click(), void i.act());
        }
    } else super.mouseDown(t, e, o, s);
  }
  drawPop(t) {
    const e = t.ctx,
      o = (performance.now() - this.pop.t0) / 1e3,
      { P: s, wear: i, ok: n } = this.popButtons(),
      a = Math.min(1, o / 0.35),
      h = 1 - (1 - a) ** 3;
    ((e.fillStyle = "rgba(0,0,0," + (0.55 * h).toFixed(3) + ")"),
      e.fillRect(0, 0, t.w, t.h),
      e.save());
    const l = a < 1 ? 0.6 + 0.4 * h + 0.08 * Math.sin(a * Math.PI) : 1,
      r = s.x + s.w / 2,
      d = s.y + s.h / 2;
    (e.translate(r, d),
      e.scale(l, l),
      e.translate(-r, -d),
      (e.globalAlpha = h),
      (e.fillStyle = "rgba(16,12,4,0.92)"),
      e.fillRect(s.x, s.y, s.w, s.h),
      (e.fillStyle = "#F2C94C"),
      modFrame(e, s.x, s.y, s.w, s.h),
      (e.fillStyle = "rgba(242,201,76,0.35)"),
      modFrame(e, s.x + 2, s.y + 2, s.w - 4, s.h - 4));
    const c = r,
      u = s.y + 38;
    (e.save(), e.translate(c, u), e.rotate(0.6 * o));
    for (let t = 0; t < 12; t++)
      (e.rotate(Math.PI / 6),
        (e.fillStyle = t % 2 ? "rgba(255,226,122,0.18)" : "rgba(255,240,190,0.10)"),
        e.beginPath(),
        e.moveTo(0, 0),
        e.lineTo(-5, -34),
        e.lineTo(5, -34),
        e.closePath(),
        e.fill());
    e.restore();
    for (let t = 0; t < 10; t++) {
      const s = 2.4 * t + 0.9 * o,
        i = 20 + ((18 * o + 7 * t) % 18),
        n = Math.max(0, Math.sin(5 * o + 1.7 * t));
      ((e.fillStyle = "rgba(255,236,150," + (0.8 * n).toFixed(3) + ")"),
        e.fillRect(Math.round(c + Math.cos(s) * i), Math.round(u + Math.sin(s) * i * 0.8), 1, 1));
    }
    const m = o < 0.9 ? Math.abs(Math.sin(7 * o)) * (0.9 - o) * 10 : 1.2 * Math.sin(2.2 * o);
    (Cosmetics.drawIcon(e, this.pop.id, Math.round(c - 16), Math.round(u - 16 - m), 32, !1),
      Font.center(e, "第一次来模组界面", r, s.y + 64, "#E0E0E0"),
      Font.center(e, "送你一顶「" + Cosmetics.name(this.pop.id) + "」！", r, s.y + 76, "#FFD24A"),
      t.button(i),
      t.button(n),
      e.restore());
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      o = Math.min(t.w - 28, 340);
    ((this.area = { x: Math.floor(e - o / 2), y: 34, w: o, h: t.h - 34 - 48 }),
      (this.textW = o - 45 - 72));
    const s = new Set((this.rows || []).filter((t) => t.open).map((t) => t.m.id));
    ((this.rows = (this.list || []).map((t) => {
      const e = modWrap(t.brief || t.desc || "", this.textW, 2),
        i = 32 + 10 * e.length + (t.usage && t.usage.length ? 10 : 0),
        n = s.has(t.id) && !(!t.usage || !t.usage.length),
        a = n ? t.usage.flatMap((t) => modWrap(t, o - 51, 4)) : [];
      return { m: t, lines: e, top: i, open: n, use: a, h: i + (n ? 10 * a.length + 16 : 0) };
    })),
      this.place(),
      (this.widgets = [
        { x: e - 100, y: t.h - 28, w: 200, h: 20, label: "完成", onClick: () => this.back() },
      ]));
  }
  back() {
    this.game.ui.open(this.parent);
  }
  onEsc() {
    this.back();
  }
  busy(t) {
    return (
      (!!Mods.dl && !Mods.dl.background && Mods.dl.id === t) || (!!this.anim && this.anim.id === t)
    );
  }
  anyBusy() {
    return (!!Mods.dl && !Mods.dl.background) || !!this.anim;
  }
  shown() {
    const t = Mods.dl,
      e = t && !t.background ? (t.total ? Math.min(1, t.done / t.total) : 0) : 1;
    return this.anim ? Math.min(e, (performance.now() - this.anim.t0) / 1500) : e;
  }
  download(t) {
    ((this.anim = { id: t.id, t0: performance.now() }),
      Mods.download(t).catch(() => {}),
      this.layout(),
      this.follow(t));
  }
  async follow(t) {
    if (!t || !Mods.dl) return void (this.anim = null);
    let e = !0;
    try {
      await Mods.dl.promise;
    } catch (t) {
      ((e = !1),
        (this.note = "下载失败：" + t.message + "（再点下载会从断开的地方接着下）"),
        (this.noteColor = "#FF5555"));
    }
    if (e && this.anim) {
      const t = 1500 - (performance.now() - this.anim.t0);
      t > 0 && (await new Promise((e) => setTimeout(e, t)));
    }
    ((this.anim = null),
      e &&
        ((this.note = t.name + " 下载好了：在「单人游戏」里选中世界，点「模组管理」装上"),
        (this.noteColor = "#80FF80")),
      this.game.ui.screen === this && this.layout());
  }
  remove(t) {
    (Mods.remove(t.id),
      (this.note = "已删除 " + t.name + " 的资源"),
      (this.noteColor = "#A0A0A0"),
      this.layout());
  }
  btnY(t, e, o) {
    const s = !!t.m.tutorial && ("undefined" == typeof Live || Live.on("mods.tutorials"));
    return e + Math.floor(((t.top || t.h) - (s ? 38 : 18)) / 2) + (s ? 20 * o : 0);
  }
  action(t, e) {
    const o = t.m,
      s = this.area;
    if (Mods.always.includes(o.id)) return null;
    const i = Mods.isDownloaded(o.id),
      n = this.busy(o.id);
    return {
      x: s.x + s.w - 66,
      y: this.btnY(t, e, 0),
      w: 60,
      h: 18,
      enabled: !this.anyBusy(),
      glowBlue: !i && !n,
      label: n ? Math.round(100 * this.shown()) + "%" : i ? "删除" : "下载",
      act: () => (i ? this.remove(o) : this.download(o)),
    };
  }
  tutorial(t, e) {
    const o = t.m,
      s = this.area,
      i = o.tutorial;
    if (!i || ("undefined" != typeof Live && !Live.on("mods.tutorials"))) return null;
    const n = Mods.isDownloaded(o.id);
    return {
      x: s.x + s.w - 66,
      y: this.btnY(t, e, 1),
      w: 60,
      h: 18,
      enabled: n && !this.anyBusy(),
      gold: n,
      label: i.label || "教程地图",
      tip: n
        ? i.tip || [
            "一张专门的教程世界：沿路线体验" + o.name + "的玩法",
            "输入 /demo reset 整张地图重置",
          ]
        : ["先下载" + o.name],
      act: () => openTutorial(this.game, o),
    };
  }
  clickRow(t, e, o) {
    for (const s of [this.action(t, 0), this.tutorial(t, 0)])
      if (s && s.enabled && e >= s.x && e < s.x + s.w && o >= s.y - 1 && o < s.y + s.h + 1)
        return (Sound.init(), Sound.click(), void s.act());
    t.m.usage &&
      t.m.usage.length &&
      (Sound.init(), Sound.click(), (t.open = !t.open), this.layout());
  }
  draw(t) {
    (super.draw(t), this.pop && this.drawPop(t));
  }
  wheel(t, e) {
    this.pop || super.wheel(t, e);
  }
  scrollPx(t) {
    this.pop || super.scrollPx(t);
  }
  drawRow(t, e, o) {
    const s = t.ctx,
      i = this.area,
      n = e.m,
      a = this.hover(t, e, o),
      h = i.x,
      l = i.w,
      r = Mods.always.includes(n.id),
      d = Mods.isDownloaded(n.id),
      c = this.busy(n.id);
    ((s.fillStyle = a ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.42)"),
      s.fillRect(h, o, l, e.h),
      (s.fillStyle = a ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.13)"),
      modFrame(s, h, o, l, e.h),
      (r || d) && ((s.fillStyle = r ? "#E8B73A" : "#5FD35F"), s.fillRect(h + 1, o + 1, 2, e.h - 2)),
      drawModIcon(t, n, h + 6, o + Math.floor((e.top - 34) / 2), 32));
    const u = h + 45,
      m = this.textW;
    (drawModName(s, n, u, o + 6, m),
      e.lines.forEach((t, e) => Font.draw(s, t, u, o + 17 + 10 * e, "#D2D2D2")));
    const p = o + 17 + 10 * e.lines.length,
      f = (n.author || "") + " · " + (n.license || "") + (r ? "" : " · " + modMB(n.size || 0)),
      w = fitText(f, m - 36);
    (Font.draw(s, w, u, p, "#7F7F7F"),
      !d || r || c || Font.draw(s, "已下载", u + Font.width(w) + 6, p, "#7FD87F"));
    const y = this.action(e, o),
      g = this.tutorial(e, o);
    (y
      ? t.button(y)
      : Font.center(
          s,
          "已内置",
          h + l - 36,
          g ? this.btnY(e, o, 0) + 5 : o + Math.floor((e.top - 8) / 2),
          "#F2C94C",
        ),
      n.usage &&
        n.usage.length &&
        (e.open
          ? ((s.fillStyle = "rgba(255,255,255,0.12)"),
            s.fillRect(h + 6, o + e.top, l - 12, 1),
            Font.draw(s, "用法", h + 6, o + e.top + 5, "#FFD24A"),
            e.use.forEach((t, i) => Font.draw(s, t, h + 33, o + e.top + 5 + 10 * i, "#E6E6E6")),
            Font.draw(s, "« 收起", h + l - 6 - Font.width("« 收起"), o + e.h - 11, "#6FB8FF"))
          : Font.draw(s, "点开看用法 »", u, p + 10, "#6FB8FF")),
      g && t.button(g),
      c &&
        ((s.fillStyle = "rgba(0,0,0,0.55)"),
        s.fillRect(h + 1, o + e.h - 3, l - 2, 2),
        (s.fillStyle = "#4AA8FF"),
        s.fillRect(h + 1, o + e.h - 3, Math.round((l - 2) * this.shown()), 2)));
  }
  drawExtra(t) {
    const e = t.ctx,
      o = t.w / 2;
    (this.guestGift
      ? Font.center(e, fitText("登录后再打开这里，送你一顶厨师帽", t.w - 16), o, 22, "#FFD24A")
      : Font.center(
          e,
          fitText("下载后，在「单人游戏」里选中世界，点「模组管理」勾选要装的模组", t.w - 16),
          o,
          22,
          "#A0A0A0",
        ),
      this.drawList(t),
      !this.list ||
        this.list.length ||
        this.note ||
        Font.center(e, "还没有模组", o, this.area.y + 20, "#A0A0A0"),
      this.note && Font.center(e, fitText(this.note, t.w - 16), o, t.h - 42, this.noteColor));
  }
}
class ModPickScreen extends ModListScreen {
  constructor(t, e, o, s, i = {}) {
    (super(t, i.title || "世界的模组"),
      (this.parent = e),
      (this.chosen = new Set(o || [])),
      (this.was = new Set(i.was || o || [])),
      (this.onDone = s),
      (this.opts = i),
      (this.list = null),
      Mods.loadIndex()
        .then((t) => {
          ((this.list = Mods.listed(t)), (this.t0 = performance.now()), this.layout());
        })
        .catch(() => {
          ((this.list = []), this.layout());
        }));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      o = Math.min(t.w - 28, 320);
    ((this.area = { x: Math.floor(e - o / 2), y: 34, w: o, h: t.h - 34 - 50 }),
      (this.rows = (this.list || []).map((t) => ({ m: t, h: 32 }))),
      this.place());
    const s = Math.min(100, Math.floor((Math.min(t.w - 16, 316) - 8) / 3)),
      i = Math.floor(e - (3 * s + 8) / 2);
    this.widgets = [
      { x: i, y: t.h - 28, w: s, h: 20, label: "完成", onClick: () => this.done() },
      {
        x: i + s + 4,
        y: t.h - 28,
        w: s,
        h: 20,
        label: "下载模组…",
        onClick: () => this.toDownloads(),
      },
      { x: i + 2 * s + 8, y: t.h - 28, w: s, h: 20, label: "取消", onClick: () => this.onEsc() },
    ];
  }
  toDownloads() {
    const go = () =>
      this.game.ui.open(
        new ModsScreen(
          this.game,
          new ModPickScreen(
            this.game,
            this.parent,
            [...this.chosen],
            this.onDone,
            Object.assign({}, this.opts, { was: [...this.was] }),
          ),
        ),
      );
    this.opts.gate ? modsGate(this.game, go, this) : go();
  }
  done() {
    (this.onDone([...this.chosen]), this.game.ui.open(this.parent));
  }
  onEsc() {
    this.game.ui.open(this.parent);
  }
  gone() {
    return [...this.was].filter((t) => !this.chosen.has(t));
  }
  clickRow(t) {
    const e = t.m.id;
    if ((Sound.init(), Sound.click(), this.chosen.has(e)))
      return (this.chosen.delete(e), void (t.flip = performance.now()));
    if (!Mods.isDownloaded(e)) return void this.toDownloads();
    const add = () => {
      (this.chosen.add(e),
        (t.flip = performance.now()),
        this.game.ui.screen !== this && this.game.ui.open(this));
    };
    this.opts.gate ? modsGate(this.game, add, this) : add();
  }
  drawRow(t, e, o) {
    const s = t.ctx,
      i = this.area,
      n = e.m,
      a = this.hover(t, e, o),
      h = i.x,
      l = i.w,
      r = Mods.isDownloaded(n.id),
      d = this.chosen.has(n.id);
    (r || (s.globalAlpha *= 0.6),
      (s.fillStyle = d
        ? a
          ? "rgba(70,150,255,0.34)"
          : "rgba(50,130,255,0.24)"
        : a
          ? "rgba(255,255,255,0.09)"
          : "rgba(0,0,0,0.42)"),
      s.fillRect(h, o, l, e.h),
      (s.fillStyle = d
        ? "rgba(120,190,255,0.85)"
        : a
          ? "rgba(255,255,255,0.5)"
          : "rgba(255,255,255,0.13)"),
      modFrame(s, h, o, l, e.h));
    const c = h + 8,
      u = o + 10;
    if (
      ((s.fillStyle = a ? "#FFFFFF" : "#A0A0A0"),
      modFrame(s, c, u, 12, 12),
      (s.fillStyle = d ? "#2F7FE0" : "#101010"),
      s.fillRect(c + 1, u + 1, 10, 10),
      d)
    ) {
      const t = 0.55 + 0.45 * (e.flip ? clamp((performance.now() - e.flip) / 140, 0, 1) : 1);
      (s.save(), s.translate(c + 6, u + 6), s.scale(t, t), (s.fillStyle = "#FFFFFF"));
      for (let t = 0; t < 3; t++) s.fillRect(-4 + t, -1 + t, 2, 2);
      for (let t = 0; t < 5; t++) s.fillRect(-1 + t, 1 - t, 2, 2);
      s.restore();
    }
    drawModIcon(t, n, h + 26, o + 3, 24);
    const m = h + 58,
      p = l - 58 - (r ? 8 : 52);
    (drawModName(s, n, m, o + 6, p),
      Font.draw(s, fitText(n.brief || n.desc || "", p), m, o + 18, "#A8A8A8"),
      r || Font.draw(s, "未下载", h + l - 46, o + 12, "#FF9090"),
      r || (s.globalAlpha /= 0.6));
  }
  drawExtra(t) {
    const e = t.ctx,
      o = t.w / 2;
    (Font.center(
      e,
      fitText(
        this.opts.world ? "世界：" + this.opts.world.name : "勾选这个世界要装的模组（可以装多个）",
        t.w - 16,
      ),
      o,
      22,
      "#A0A0A0",
    ),
      this.drawList(t),
      this.list
        ? this.list.length || Font.center(e, "还没有模组", o, this.area.y + 20, "#A0A0A0")
        : Font.center(e, "正在读取模组列表…", o, this.area.y + 20, "#A0A0A0"));
    const s = this.gone();
    this.opts.existing && s.length
      ? Font.center(
          e,
          fitText(
            "去掉 " + s.map((t) => Mods.nameOf(t)).join("、") + " 后，世界里它的方块和物品会消失",
            t.w - 16,
          ),
          o,
          t.h - 43,
          "#FF5555",
        )
      : Font.center(
          e,
          fitText(
            "已选 " +
              [...this.chosen].filter((t) => Mods.isDownloaded(t)).length +
              " 个 · 只在单人游戏里生效",
            t.w - 16,
          ),
          o,
          t.h - 43,
          "#A0A0A0",
        );
  }
}
const MODS_GIFT = "hat:chef";
async function openTutorial(t, e) {
  const o = e.tutorial;
  if (!o) return;
  (Mods.isDownloaded(o.mod) || Mods.markDownloaded(o.mod),
    "undefined" != typeof Telemetry && Telemetry.count && Telemetry.count("mods_tutorial:" + e.id));
  let s = [];
  try {
    s = await DB.listWorlds();
  } catch (t) {}
  const i = s.find((t) => Mods.tutorialOf(t) === o.mod);
  if (i) return (t.ui.hideInput && t.ui.hideInput(), void t.loadWorld(i.id));
  Mods.reloadWith([e.id, o.mod], {
    create: [
      o.name,
      o.seed,
      o.mode || "survival",
      !0,
      { cheats: !0, difficulty: o.difficulty || 0, tutorialMap: o.mod },
    ],
  });
}
async function modsGate(t, e, o) {
  if ("undefined" == typeof RoomService || !RoomService.base() || "undefined" == typeof Account)
    return e();
  const s = await Account.loadGate();
  if (!s.requireAccount && !s.follow && !s.triple) return e();
  if (!Account.loggedIn)
    return (
      Telemetry.count && Telemetry.count("gate_mods_login"),
      t.ui.open(
        new LoginScreen(
          t,
          () => modsGate(t, e, o),
          () => t.ui.open(o || new TitleScreen(t)),
        ),
      )
    );
  if ((Account.data && Account.data.super) || Account.has("online"))
    return (e(), void Account.checkUnlocks(!0).catch(() => {}));
  try {
    await Account.checkUnlocks(!0);
  } catch (t) {}
  for (let t = 0; t < 40 && Account.checking; t++) await new Promise((t) => setTimeout(t, 250));
  if (Account.has("online")) return e();
  (Telemetry.count && Telemetry.count("gate_mods"),
    t.ui.open(
      new UnlockScreen(
        t,
        o,
        s.triple && s.videos && s.videos.length
          ? "模组需要关注 UP 主并给新视频三连（老视频的三连不算）"
          : "模组需要关注 UP 主",
        () => modsGate(t, e, o),
      ),
    ));
}
function openModsScreen(t, e) {
  modsGate(t, () => t.ui.open(new ModsScreen(t, e)), e);
}
const modNames = (t) => (t && t.length ? t.map((t) => Mods.nameOf(t)).join("、") : "无");
((() => {
  const t = TitleScreen.prototype.layout;
  ((TitleScreen.prototype.layout = function () {
    t.call(this);
    const e = this.game.ui,
      o = e.w / 2,
      s = Math.floor(e.h / 4 + 48);
    if ("undefined" == typeof Live || Live.on("title.mods")) {
      for (const t of this.widgets) t.y === s + 84 && (t.y += 12);
      this.widgets.push({
        x: o - 100,
        y: s + 72,
        w: 200,
        h: 20,
        label: "模组",
        glowBlue: !0,
        tip: ["下载模组；在「单人游戏」里选中世界，点「模组管理」勾选"],
        onClick: () => openModsScreen(this.game, this),
      });
    }
    const i = Mods.boot;
    if (i && !i.done && (i.open || i.create || i.p2p)) {
      i.done = !0;
      const t = this.game;
      setTimeout(() => {
        i.open
          ? t.loadWorld(i.open)
          : i.p2p
            ? "function" == typeof joinLocalRoom && joinLocalRoom(t, i.p2p, this)
            : t.createWorld(...i.create);
      }, 0);
    }
  }),
    Mods.loadIndex().catch(() => {}));
})(),
  (() => {
    const t = CreateWorldScreen.prototype.layout;
    CreateWorldScreen.prototype.layout = function () {
      if (
        (void 0 === this.mods &&
          (this.mods =
            this.from && this.from.mods ? this.from.mods.filter((t) => !Mods.isTutorial(t)) : []),
        t.call(this),
        0 !== this.tab)
      )
        return;
      const e = this.game.ui,
        o = e.w / 2,
        s = this.widgets.find((t) => "创建新的世界" === t.label),
        i = this.widgets
          .filter((t) => t !== s && "取消" !== t.label)
          .reduce((t, e) => Math.max(t, e.y), 0),
        n = Math.min(i + 28, e.h - 56);
      this.widgets.push({
        x: o - 105,
        y: n,
        w: 210,
        h: 20,
        glowBlue: !0,
        label: () => fitText("模组：" + modNames(this.mods), 200),
        tip: ["这个世界装的模组（可以装多个）"],
        onClick: () => {
          (this.game.ui.hideInput(),
            modsGate(
              this.game,
              () =>
                this.game.ui.open(
                  new ModPickScreen(this.game, this, this.mods, (t) => {
                    this.mods = t;
                  }),
                ),
              this,
            ));
        },
      });
    };
    const e = CreateWorldScreen.prototype.create;
    if (
      ((CreateWorldScreen.prototype.create = function () {
        const t = this.mods || [];
        if (!Mods.same(t, Mods.active)) {
          const e = "hardcore" === this.mode;
          return (
            this.game.ui.hideInput(),
            void Mods.reloadWith(t, {
              create: [
                this.name.trim() || "新的世界",
                this.seed.trim(),
                e ? "survival" : this.mode,
                this.flat,
                {
                  hardcore: e,
                  difficulty: e ? 3 : this.difficulty,
                  cheats: !e && this.cheats,
                  structures: this.structures,
                  bonus: this.bonus,
                },
              ],
            })
          );
        }
        return e.call(this);
      }),
      "undefined" != typeof DB && DB.putWorld)
    ) {
      const t = DB.putWorld.bind(DB);
      DB.putWorld = function (e, ...o) {
        if (e && void 0 === e.mods) {
          const t = Mods.making,
            o = "undefined" != typeof game && game && game.worldMeta && game.worldMeta.id === e.id;
          (t &&
            t.tutorialMap &&
            Mods.active.includes(t.tutorialMap) &&
            (e.tutorialMap = t.tutorialMap),
            (e.mods = t || o ? Mods.ownMods(e, Mods.active.slice()) : []));
        }
        return t(e, ...o);
      };
    }
    const o = Game.prototype.createWorld;
    Game.prototype.createWorld = function (t, e, s, i, n) {
      Mods.making = { tutorialMap: n && n.tutorialMap };
      try {
        return o.apply(this, arguments);
      } finally {
        Mods.making = null;
      }
    };
    const s = EditWorldScreen.prototype.layout;
    EditWorldScreen.prototype.layout = function () {
      (void 0 === this.mods && (this.mods = [...(this.world.mods || [])]), s.call(this));
      const t = this.game.ui.w / 2;
      this.widgets.push({
        x: t - 100,
        y: 197,
        w: 200,
        h: 20,
        glowBlue: !0,
        label: () => fitText("模组：" + modNames(this.mods), 190),
        tip: ["这个世界装的模组（可以装多个）"],
        onClick: () => {
          (this.game.ui.hideInput(),
            modsGate(
              this.game,
              () =>
                this.game.ui.open(
                  new ModPickScreen(
                    this.game,
                    this,
                    this.mods,
                    (t) => {
                      this.mods = t;
                    },
                    { existing: !0 },
                  ),
                ),
              this,
            ));
        },
      });
    };
    const i = EditWorldScreen.prototype.save;
    EditWorldScreen.prototype.save = async function () {
      return ((this.world.mods = [...(this.mods || [])]), i.call(this));
    };
    const n = Game.prototype.loadWorld;
    Game.prototype.loadWorld = async function (t) {
      if ("string" == typeof t && t.startsWith("p2p~")) return n.call(this, t);
      const e = await DB.getWorld(t);
      if (e && (e.mods || []).length) {
        const t = Mods.ownMods(e),
          o = Mods.tutorialOf(e);
        if (t.length !== e.mods.length || (o && !e.tutorialMap)) {
          ((e.mods = t), o && (e.tutorialMap = o));
          try {
            await DB.putWorld(e);
          } catch (t) {}
        }
      }
      const o = (e && e.mods) || [];
      if (o.length)
        try {
          await Promise.race([Mods.loadIndex(), new Promise((t) => setTimeout(t, 3e3))]);
        } catch (t) {}
      const s = o.filter((t) => !Mods.isDownloaded(t));
      if (!s.length)
        return self.POTATO || Mods.same(o, Mods.active)
          ? ((this.modTips = Mods.active.length ? { at: 0 } : null), n.call(this, t))
          : (this.ui.hideInput && this.ui.hideInput(),
            this.ui.open(new LoadingModsScreen(this, o)),
            void Mods.reloadWith(o, { open: t }));
      this.ui.open(
        new ConfirmScreen(
          this,
          "这个世界用了模组：" + modNames(s),
          "先在「模组」里下载；不要它了：在「模组管理」里去掉",
          "去模组",
          (t) =>
            t
              ? openModsScreen(this, new WorldListScreen(this))
              : this.ui.open(new WorldListScreen(this)),
        ),
      );
    };
    const a = Game.prototype.tick;
    Game.prototype.tick = function (...t) {
      const e = this.modTips;
      if (e && "play" === this.state && !this.net)
        if (e.at) {
          if (performance.now() - e.at > 1500) {
            this.modTips = null;
            const t = ((Mods.index && Mods.index.mods) || []).filter(
              (t) => Mods.active.includes(t.id) && t.hint,
            );
            if (t.length) {
              this.ui.message(
                "这个世界装了模组（「模组」界面里点开卡片能看详细用法）：",
                "#FFD24A",
              );
              for (const e of t) this.ui.message("【" + e.name + "】" + e.hint, "#9FDCFF");
            }
          }
        } else e.at = performance.now();
      return a.apply(this, t);
    };
    const h = WorldListScreen.prototype.layout;
    WorldListScreen.prototype.layout = function () {
      if ((h.call(this), "undefined" != typeof Live && !Live.on("title.mods"))) return;
      const t = this.game.ui,
        e = t.w / 2,
        o = this.game,
        s = this.shown()[this.sel];
      for (const t of this.widgets) t.y -= 24;
      ((this.listBottom -= 24),
        this.widgets.push({
          x: e - 154,
          y: t.h - 28,
          w: 308,
          h: 20,
          enabled: !!s,
          glowBlue: !!s,
          label: () =>
            s
              ? fitText(
                  "模组管理" + (s.mods && s.mods.length ? "：" + modNames(s.mods) : "：没有装模组"),
                  296,
                )
              : "模组管理（先选中一个世界）",
          tip: ["选中的世界装哪些模组：勾选（可以装多个）"],
          onClick: () => {
            (o.ui.hideInput(),
              modsGate(
                o,
                () =>
                  o.ui.open(
                    new ModPickScreen(
                      o,
                      this,
                      s.mods || [],
                      async (t) => {
                        s.mods = t;
                        try {
                          await DB.putWorld(s);
                        } catch (t) {
                          console.error(t);
                        }
                      },
                      { existing: !0, title: "模组管理", world: s },
                    ),
                  ),
                this,
              ));
          },
        }));
    };
    const l = WorldListScreen.prototype.drawExtra;
    WorldListScreen.prototype.drawExtra = function (t) {
      if ((l.call(this, t), !this.worlds)) return;
      const e = t.ctx,
        o = t.w / 2,
        s = this.listTop,
        i = this.listBottom,
        n = Math.floor(o - this.rowW / 2) + 2,
        a = this.shown(),
        h = Math.floor((i - s - 4) / 36);
      (e.save(),
        e.beginPath(),
        e.rect(0, s, t.w, i - s),
        e.clip(),
        a.slice(this.scroll, this.scroll + h + 1).forEach((t, o) => {
          if (!t.mods || !t.mods.length) return;
          const i = t.mods.filter((t) => !Mods.isTutorial(t)),
            a = s + 4 + 36 * o,
            h = "模组：" + modNames(i.length ? i : t.mods),
            l =
              (t.hardcore
                ? "极限模式"
                : "creative" === t.mode
                  ? "创造模式"
                  : "spectator" === t.mode
                    ? "旁观模式"
                    : "生存模式") +
              ((t.cheats ?? !0) ? ", 命令" : "") +
              ", 26.2",
            r = this.rowW - 8 - 35 - Font.width(l) - 8,
            d = fitText(h, r);
          r > 30 && Font.draw(e, d, n + this.rowW - 8 - Font.width(d), a + 21, "#80C8FF");
        }),
        e.restore());
    };
  })());
class LoadingModsScreen extends MenuScreen {
  constructor(t, e, o) {
    (super(t, null), (this.mods = e), (this.sub = o), (this.pauses = !1));
  }
  layout() {
    this.widgets = [];
  }
  drawExtra(t) {
    (Font.center(
      t.ctx,
      fitText(mods_loadingText(this.mods), t.w - 16),
      t.w / 2,
      t.h / 2 - 8,
      "#FFFFFF",
    ),
      Font.center(
        t.ctx,
        fitText(this.sub || "网页会重新载入一次，然后自动进入世界", t.w - 16),
        t.w / 2,
        t.h / 2 + 6,
        "#A0A0A0",
      ));
  }
}
const mods_loadingText = (t) =>
  t.length
    ? "正在加载模组：" + modNames(t.filter((t) => !Mods.isTutorial(t))) + "…"
    : "正在卸下模组…";
Mods.testing.length &&
  "undefined" != typeof location &&
  /^(localhost|127\.0\.0\.1)$/.test(location.hostname) &&
  document.addEventListener("DOMContentLoaded", () => {
    const t = Game.prototype.startTitle;
    Game.prototype.startTitle = function (...e) {
      const o = this.settings;
      return (
        o.onboarded || ((o.onboarded = !0), (o.playerKind = o.playerKind || "vet")),
        (o.seenBuild = GAME_BUILD),
        "undefined" != typeof LEGAL && (o.legalV = LEGAL.v),
        "undefined" != typeof FPS_TEST_V &&
          (o.fpsTestV || 0) < FPS_TEST_V &&
          (o.fpsTestV = FPS_TEST_V),
        this.saveSettings(),
        t.apply(this, e)
      );
    };
  });
//# sourceURL=js/mods_ui.js
