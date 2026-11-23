"use strict";
const NewsBoard = {
  list: null,
  adminList: null,
  ver: 0,
  lastFetch: 0,
  loading: !1,
  pending: null,
  err: "",
  wood: null,
  seenV: null,
  autoId: "",
  load() {
    try {
      const t = JSON.parse(localStorage.getItem("mcjs-news") || "null");
      t && Array.isArray(t.list) && (this.list = t.list);
    } catch (t) {}
  },
  isSuper: () =>
    "undefined" != typeof Account && Account.loggedIn && !(!Account.data || !Account.data.super),
  seen() {
    if (null === this.seenV)
      try {
        this.seenV = +localStorage.getItem("mcjs-news-seen") || 0;
      } catch (t) {
        this.seenV = 0;
      }
    return this.seenV;
  },
  markSeen() {
    const t = Math.max(0, ...(this.list || []).filter((t) => !t.draft).map((t) => t.at || 0));
    if (!(t <= this.seen())) {
      this.seenV = t;
      try {
        localStorage.setItem("mcjs-news-seen", String(t));
      } catch (t) {}
    }
  },
  unread() {
    const t = this.seen();
    return (this.list || []).filter((e) => !e.draft && (e.at || 0) > t);
  },
  fetch(t, e) {
    if (this.pending) return t ? this.pending.then(() => this.fetch()) : this.pending;
    if ("undefined" == typeof RoomService || !RoomService.base() || "undefined" == typeof Account)
      return Promise.resolve();
    ((this.loading = !0), (this.lastFetch = performance.now()));
    return (this.pending = (async () => {
      try {
        const t = await (async () => {
          if (!e) return Account.api("/api/news");
          let t, s;
          try {
            t = await fetch(RoomService.base() + "/api/news");
          } catch (t) {
            throw new Error("游戏正在更新中…请稍后");
          }
          try {
            s = await t.json();
          } catch (t) {
            s = { error: "游戏正在更新中…请稍后" };
          }
          if (!t.ok || s.error) throw new Error(s.error || "HTTP " + t.status);
          return s;
        })();
        ((this.list = (t.list || []).filter((t) => !t.draft)), (this.err = ""), this.ver++);
        try {
          localStorage.setItem("mcjs-news", JSON.stringify({ list: this.list, at: Date.now() }));
        } catch (t) {}
      } catch (t) {
        this.err = t.message;
      }
      ((this.loading = !1), (this.pending = null));
    })());
  },
  async fetchAdmin() {
    if (this.isSuper())
      try {
        const t = await Account.api("/api/account/news/list");
        ((this.adminList = t.list || []), this.ver++);
      } catch (t) {
        this.err = t.message;
      }
  },
  rich(t, e) {
    const s = [],
      i = String(t).split("**");
    (i.length % 2 == 0 && (i[i.length - 2] += "**" + i.pop()),
      i.forEach((t, e) => {
        t && s.push({ t: t, b: e % 2 == 1 });
      }));
    const n = [];
    let o = [],
      a = 0;
    for (const t of s)
      for (const s of t.t) {
        const i = Font.width(s);
        a + i > e && o.length && (n.push(o), (o = []), (a = 0));
        const h = o[o.length - 1];
        (h && h.b === t.b ? (h.t += s) : o.push({ t: s, b: t.b }), (a += i));
      }
    return (o.length && n.push(o), n);
  },
  plain: (t) => String(t || "").replace(/\*\*/g, ""),
  sorted: (t) => (t || []).slice().sort((t, e) => !!e.pin - !!t.pin || (e.at || 0) - (t.at || 0)),
  date(t) {
    const p = (t) => String(t).padStart(2, "0"),
      e = new Date((t || 0) + 288e5),
      s = new Date(Date.now() + 288e5).getUTCFullYear();
    return (
      (e.getUTCFullYear() !== s ? e.getUTCFullYear() + "年" : "") +
      `${p(e.getUTCMonth() + 1)}月${p(e.getUTCDate())}日 ${p(e.getUTCHours())}:${p(e.getUTCMinutes())}`
    );
  },
  autoItem() {
    const t = (this.list || []).filter((t) => !t.draft);
    if (!t.length) return null;
    const e = t.reduce((t, e) => ((e.at || 0) > (t.at || 0) ? e : t));
    if (!e.imp || (e.at || 0) <= this.seen() || this.autoId === String(e.id)) return null;
    let s = "";
    try {
      s = localStorage.getItem("mcjs-news-auto") || "";
    } catch (t) {}
    return s === String(e.id) ? null : e;
  },
  autoDone(t) {
    this.autoId = String(t.id);
    try {
      localStorage.setItem("mcjs-news-auto", String(t.id));
    } catch (t) {}
  },
  noAnim(t) {
    const e = (t && t.settings) || {};
    if (!1 === e.newsAnim || "low" === ("auto" === e.preset ? e.autoPreset : e.preset)) return !0;
    try {
      return matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (t) {
      return !1;
    }
  },
  open(t, e, s) {
    ("undefined" != typeof Telemetry &&
      Telemetry.count &&
      Telemetry.count(s ? "news_auto" : "news_open"),
      t.ui.open(new NewsScreen(t, e, { auto: s })));
  },
  signRect(t) {
    const e =
      "undefined" != typeof Account &&
      Account.loggedIn &&
      Account.allUnlocked &&
      !Account.allUnlocked();
    if (t.w / 2 + 190 <= t.w - 62) return { x: t.w - 60, y: 26, w: 54, h: 36, top: e ? 22 : 0 };
    if (t.w / 2 + 128 <= t.w - 62) return { x: t.w - 60, y: 72, w: 54, h: 36, top: 66 };
    const s = Math.max(30, Math.min(54, Math.floor(t.w / 2 - 112))),
      i = Math.round((2 * s) / 3);
    return { x: t.w - 6 - s, y: 88, w: s, h: i, top: 82 };
  },
  checkinRect(t) {
    const e = this.signRect(t);
    return { x: e.x, y: e.y + e.h + 4, w: e.w, h: 16 };
  },
  hitRect(t, e) {
    const s = this.signRect(t),
      i = ("function" == typeof touchOn && e && touchOn(e)) || navigator.maxTouchPoints > 0 ? 8 : 2;
    return { x: s.x - i, y: s.top, w: s.w + 2 * i, h: s.y + s.h - s.top + 3 };
  },
  pose(t, e) {
    const s = this.signRect(t),
      i = this.unread().length > 0,
      n = e / 1e3,
      o =
        Math.sin((n * Math.PI * 2) / 3.4) * (i ? 0.06 : 0.022) +
        (i ? 0.01 * Math.sin((n * Math.PI * 2) / 1.3) : 0),
      a = s.x + s.w / 2,
      h = s.top,
      r = s.y + s.h / 2 - s.top;
    return {
      cx: a - Math.sin(o) * r,
      cy: h + Math.cos(o) * r,
      w: s.w,
      h: s.h,
      ang: o,
      chain: s.y - s.top,
      px: a,
      py: h,
    };
  },
  drawSign(t, e, s) {
    const i = this.pose(t, s),
      n = this.unread().length;
    this.drawBoard(t, e, {
      ...i,
      k: 1,
      hover: t.hit(this.hitRect(t, e)),
      glow: n ? 0.55 + 0.45 * Math.sin(((s / 1e3) * Math.PI * 2) / 1.4) : 0,
      badge: n,
    });
  },
  woodTex(t) {
    if (this.wood) return this.wood;
    const e = t && t.renderer;
    if (!e || !e.stripCanvas || "function" != typeof T) return null;
    const s = document.createElement("canvas");
    ((s.width = 16),
      (s.height = 16),
      s
        .getContext("2d")
        .drawImage(e.stripCanvas, ...e.tileXY(T("dark_oak_planks")), 16, 16, 0, 0, 16, 16));
    const i = document.createElement("canvas");
    ((i.width = 640), (i.height = 480));
    const n = i.getContext("2d");
    return (
      (n.fillStyle = n.createPattern(s, "repeat")),
      n.fillRect(0, 0, 640, 480),
      (this.wood = i)
    );
  },
  chain(t, e, s, i) {
    for (let n = i - 4, o = 0; n + 4 > s; n -= 4, o++) {
      const i = Math.max(n, s),
        a = n + 4 - i;
      o % 2 == 0
        ? ((t.fillStyle = "#9AA2B3"),
          t.fillRect(e - 1, i, 1, a),
          (t.fillStyle = "#4B505C"),
          t.fillRect(e + 1, i, 1, a),
          (t.fillStyle = "#6F7786"),
          n >= s && t.fillRect(e, n, 1, 1),
          t.fillRect(e, n + 3, 1, 1))
        : ((t.fillStyle = "#5E6574"),
          t.fillRect(e, i, 1, a),
          (t.fillStyle = "#A9B1C1"),
          t.fillRect(e, i + (a > 2 ? 1 : 0), 1, 1));
    }
  },
  drawBoard(t, e, s) {
    const i = t.ctx,
      n = s.w,
      o = s.h,
      a = -n / 2,
      h = -o / 2,
      r = this.woodTex(e),
      l = i.globalAlpha;
    if (
      (i.save(),
      i.translate(s.cx, s.cy),
      i.rotate(s.ang || 0),
      i.scale(s.k || 1, s.k || 1),
      s.chain > 0 &&
        ((i.globalAlpha = l * (s.chainA ?? 1)),
        this.chain(i, a + 8, h - s.chain, h),
        this.chain(i, a + n - 9, h - s.chain, h),
        (i.globalAlpha = l)),
      s.glow > 0)
    ) {
      i.lineWidth = 1;
      for (let t = 5; t >= 1; t--)
        ((i.strokeStyle = `rgba(255,196,64,${((0.55 * s.glow * (6 - t)) / 5).toFixed(3)})`),
          i.strokeRect(a - t + 0.5, h - t + 0.5, n + 2 * t - 1, o + 2 * t - 1));
    }
    if (
      (r
        ? i.drawImage(r, 0, 0, n, o, a, h, n, o)
        : ((i.fillStyle = "#3B2614"), i.fillRect(a, h, n, o)),
      (i.lineWidth = 1),
      (i.strokeStyle = "#140A04"),
      i.strokeRect(a + 0.5, h + 0.5, n - 1, o - 1),
      (i.strokeStyle = "rgba(0,0,0,0.32)"),
      i.strokeRect(a + 1.5, h + 1.5, n - 3, o - 3),
      (i.fillStyle = "rgba(255,255,255,0.07)"),
      i.fillRect(a + 2, h + 2, n - 4, 1),
      (i.fillStyle = "#2A2D34"),
      i.fillRect(a + 7, h + 1, 3, 2),
      i.fillRect(a + n - 10, h + 1, 3, 2),
      s.glow > 0 &&
        ((i.fillStyle = `rgba(255,210,100,${(0.22 * s.glow).toFixed(3)})`),
        i.fillRect(a + 1, h + 1, n - 2, o - 2)),
      s.hover && ((i.fillStyle = "rgba(255,255,255,0.14)"), i.fillRect(a + 1, h + 1, n - 2, o - 2)),
      !1 !== s.label)
    ) {
      const t = n >= 44 && o >= 26 ? 2 : 1;
      (i.save(),
        i.scale(t, t),
        Font.center(i, "公告", 0, -4, s.hover ? "#FFFFFF" : "#FFF0C8"),
        i.restore());
    }
    if (s.badge) {
      const t = "!",
        e = Math.max(10, Font.width(t) + 4),
        s = Math.round(a + n - e + 4),
        o = Math.round(h - 5);
      ((i.fillStyle = "#6E0000"),
        i.fillRect(s, o + 1, e, 9),
        i.fillRect(s + 1, o, e - 2, 11),
        (i.fillStyle = "#E8262B"),
        i.fillRect(s + 1, o + 1, e - 2, 9),
        Font.draw(i, t, s + Math.round((e - Font.width(t)) / 2), o + 2, "#FFFFFF", !1));
    }
    i.restore();
  },
};
(NewsBoard.load(),
  (() => {
    const t = TitleScreen.prototype.layout,
      e = TitleScreen.prototype.drawExtra,
      s = TitleScreen.prototype.mouseDown;
    ((TitleScreen.prototype.layout = function (...e) {
      const s = t.apply(this, e);
      return (
        this.newsT ||
          ((this.newsT = performance.now()),
          (!NewsBoard.lastFetch || this.newsT - NewsBoard.lastFetch > 2e4) &&
            NewsBoard.fetch(!1, !0)),
        s
      );
    }),
      (TitleScreen.prototype.drawExtra = function (t) {
        e.call(this, t);
        const s = performance.now(),
          i = this.game,
          n = t.screen;
        if (n === this) {
          NewsBoard.lastFetch && s - NewsBoard.lastFetch > 3e5 && NewsBoard.fetch(!1, !0);
          const t = !this.newsAuto && s - (this.newsT || s) > 1e3 && NewsBoard.autoItem();
          t &&
            ((this.newsAuto = !0),
            NewsBoard.autoDone(t),
            setTimeout(() => {
              i.ui.screen === this && NewsBoard.open(i, this, !0);
            }, 0));
        }
        (void 0 !== NewsScreen && n instanceof NewsScreen && n.parent === this && n.from) ||
          NewsBoard.drawSign(t, i, s);
      }),
      (TitleScreen.prototype.mouseDown = function (t, e, i, n) {
        return 0 === n && t.hit(NewsBoard.hitRect(t, this.game), e, i)
          ? (Sound.init && Sound.init(), void NewsBoard.open(this.game, this, !1))
          : s.call(this, t, e, i, n);
      }));
  })());
const NEWS_T = { fall: 340, b1: 170, b2: 100, grow: 220, shrink: 120, fly: 260 };
NEWS_T.drop = NEWS_T.fall + NEWS_T.b1 + NEWS_T.b2;
const newsEase = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3),
  newsEaseIO = (t) =>
    (t = Math.min(1, Math.max(0, t))) < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
class NewsScreen extends MenuScreen {
  constructor(t, e, s = {}) {
    (super(t, null),
      (this.parent = e || null),
      (this.blurBg = !1),
      (this.bgDim = 0),
      (this.auto = !!s.auto),
      (this.scroll = 0),
      (this.rows = []),
      (this.btns = []),
      (this.contentH = 0),
      (this.ver = -1),
      (this.drag = null),
      (this.del = null),
      (this.msg = ""),
      (this.msgT = 0),
      (this.busy = !1));
    const i = performance.now();
    if (
      ((this.t0 = i),
      (this.phase = "open"),
      (this.openT = i),
      (this.from = null),
      (this.bits = []),
      "undefined" != typeof TitleScreen && e instanceof TitleScreen && !NewsBoard.noAnim(t))
    ) {
      const e = (this.from = NewsBoard.pose(t.ui, i));
      ((this.phase = "drop"),
        (this.snd = 0),
        Sound.ev && Sound.ev("block.chain.break", null, 0.9, 1));
      for (const t of [-e.w / 2 + 8, e.w / 2 - 9]) {
        const s = e.chain / 2,
          i = e.px + t * Math.cos(e.ang) - s * Math.sin(e.ang),
          n = e.py + t * Math.sin(e.ang) + s * Math.cos(e.ang);
        for (let e = 0; e < 4; e++)
          this.bits.push({
            x: i,
            y: n,
            vx: 70 * (Math.random() - 0.5) + 12 * Math.sign(t),
            vy: -20 - 50 * Math.random(),
          });
      }
    }
    ((this.seen0 = NewsBoard.seen()),
      NewsBoard.markSeen(),
      NewsBoard.isSuper() && NewsBoard.fetchAdmin(),
      (!NewsBoard.lastFetch || i - NewsBoard.lastFetch > 2e4) && NewsBoard.fetch());
  }
  panel() {
    const t = this.game.ui,
      e = Math.min(t.w - 12, 320),
      s = Math.min(t.h - 12, 400);
    return { x: Math.floor((t.w - e) / 2), y: Math.floor((t.h - s) / 2), w: e, h: s };
  }
  area() {
    const t = this.panel();
    return { x: t.x + 8, y: t.y + 28, w: t.w - 16, h: t.h - 36 };
  }
  boardK() {
    const t = this.from;
    return t ? Math.max(1, Math.min(2, (0.4 * this.panel().w) / t.w)) : 1;
  }
  layout() {
    this.parent && this.parent.layout && this.parent.layout();
    const t = this.game,
      e = this.panel();
    this.widgets = [
      {
        x: e.x + e.w - 22,
        y: e.y + 6,
        w: 16,
        h: 16,
        pad: 5,
        label: "×",
        onClick: () => this.back(),
      },
    ];
    let s = e.x + 6;
    ("undefined" != typeof CheckinScreen &&
      "undefined" != typeof Checkin &&
      Checkin.shown() &&
      (this.widgets.push({
        x: s,
        y: e.y + 6,
        w: 56,
        h: 16,
        gold: !0,
        label: "签到活动",
        onClick: () => t.ui.open(new CheckinScreen(t, this)),
      }),
      (s += 60)),
      NewsBoard.isSuper() &&
        this.widgets.push({
          x: s,
          y: e.y + 6,
          w: 36,
          h: 16,
          label: "新建",
          onClick: () => t.ui.open(new NewsEditScreen(t, this, null)),
        }),
      (this.ver = -1));
  }
  items() {
    return NewsBoard.sorted(
      NewsBoard.isSuper() && NewsBoard.adminList ? NewsBoard.adminList : NewsBoard.list,
    );
  }
  build() {
    ((this.ver = NewsBoard.ver), NewsBoard.markSeen());
    const t = this.area().w - 10;
    let e = 2;
    this.rows = [];
    for (const s of this.items()) {
      const i = [];
      for (const e of String(s.body || "").split("\n"))
        e.trim() ? i.push(...NewsBoard.rich(e, t)) : i.push(null);
      const n = s.gift && "undefined" != typeof Cosmetics && Cosmetics.info(s.gift) ? 32 : 0,
        o = { it: s, y: e, lines: i, gh: n, h: 23 + n + 10 * i.length + 2 };
      (this.rows.push(o), (e += o.h + 8));
    }
    ((this.contentH = e), (this.scroll = clamp(this.scroll, 0, this.maxScroll())));
  }
  maxScroll() {
    return Math.max(0, this.contentH - this.area().h);
  }
  say(t, e) {
    ((this.msg = t), (this.msgBad = !!e), (this.msgT = performance.now()));
  }
  draw(t) {
    const e = this.game,
      s = t.ctx,
      i = performance.now(),
      n = NEWS_T;
    if ((this.ver !== NewsBoard.ver && this.build(), this.parent)) {
      const e = t.mouse.x,
        s = t.mouse.y;
      ((t.mouse.x = -1e3),
        (t.mouse.y = -1e3),
        this.parent.draw(t),
        (t.mouse.x = e),
        (t.mouse.y = s),
        t.screen === this.parent && (t.screen = this));
    } else t.dim(0.5);
    const o = this.panel(),
      a = this.from,
      h = this.boardK(),
      r = t.w / 2,
      l = t.h / 2;
    if ("drop" === this.phase) {
      const c = i - this.t0;
      if (!(c >= n.drop + n.grow)) {
        if ((t.dim(0.5 * Math.min(1, c / n.drop)), c < n.drop)) {
          let i = r,
            o = l,
            d = 0,
            u = h;
          if (c < n.fall) {
            const t = c / n.fall;
            ((i = a.cx + (r - a.cx) * (1 - (1 - t) * (1 - t))),
              (o = a.cy + (l - a.cy) * t * t),
              (u = 1 + (h - 1) * t),
              (d = a.ang + (0.16 - a.ang) * t));
          } else if (c < n.fall + n.b1) {
            const t = (c - n.fall) / n.b1;
            ((o = l - 4 * Math.min(26, 0.22 * Math.max(0, l - a.cy)) * t * (1 - t)),
              (d = 0.16 - 0.22 * t),
              this.snd < 1 &&
                ((this.snd = 1), Sound.ev && Sound.ev("block.wood.fall", null, 1, 1)));
          } else {
            const t = (c - n.fall - n.b1) / n.b2;
            ((o = l - 4 * Math.min(8, 0.07 * Math.max(0, l - a.cy)) * t * (1 - t)),
              (d = -0.06 * (1 - t)),
              this.snd < 2 &&
                ((this.snd = 2), Sound.ev && Sound.ev("block.wood.fall", null, 0.5, 1.15)));
          }
          if (
            (a.chain > 3 &&
              c < 400 &&
              (s.save(),
              (s.globalAlpha = 1 - c / 400),
              s.translate(a.px, a.py),
              s.rotate(a.ang),
              NewsBoard.chain(s, -a.w / 2 + 8, 0, a.chain / 2),
              NewsBoard.chain(s, a.w / 2 - 9, 0, a.chain / 2),
              s.restore()),
            c < 500)
          ) {
            const t = c / 1e3;
            ((s.globalAlpha = 1 - c / 500), (s.fillStyle = "#A9B1C1"));
            for (const e of this.bits)
              s.fillRect(e.x + e.vx * t, e.y + e.vy * t + 200 * t * t, 1, 1);
            s.globalAlpha = 1;
          }
          NewsBoard.drawBoard(t, e, {
            cx: i,
            cy: o,
            w: a.w,
            h: a.h,
            ang: d,
            k: u,
            chain: a.chain > 3 ? Math.min(8, a.chain / 2) : 0,
            chainA: Math.max(0, 1 - c / n.fall),
          });
        } else {
          const e = newsEase((c - n.drop) / n.grow),
            i = a.w * h,
            d = a.h * h,
            u = {
              x: r - i / 2 + (o.x - (r - i / 2)) * e,
              y: l - d / 2 + (o.y - (l - d / 2)) * e,
              w: i + (o.w - i) * e,
              h: d + (o.h - d) * e,
            };
          this.drawPanel(t, u, h + (1 - h) * e);
          const w = a.w >= 44 && a.h >= 26 ? 2 : 1;
          (s.save(),
            (s.globalAlpha = 1 - e),
            s.translate(u.x + u.w / 2, u.y + u.h / 2),
            s.scale(w * h, w * h),
            Font.center(s, "公告", 0, -4, "#FFF0C8"),
            s.restore());
        }
        return;
      }
      ((this.phase = "open"), (this.openT = i));
    }
    if ("close" === this.phase) {
      const s = i - this.tc,
        c = NewsBoard.pose(t, i),
        d = a.w * h,
        u = a.h * h;
      if (s >= n.shrink + n.fly)
        return (Sound.ev && Sound.ev("block.chain.place", null, 0.7, 1), void this.finish());
      if (s < n.shrink) {
        const e = newsEase(s / n.shrink);
        t.dim(0.5);
        const i = {
          x: o.x + (r - d / 2 - o.x) * e,
          y: o.y + (l - u / 2 - o.y) * e,
          w: o.w + (d - o.w) * e,
          h: o.h + (u - o.h) * e,
        };
        this.drawPanel(t, i, 1 + (h - 1) * e);
      } else {
        const i = newsEaseIO((s - n.shrink) / n.fly);
        (t.dim(0.5 * (1 - i)),
          NewsBoard.drawBoard(t, e, {
            cx: r + (c.cx - r) * i,
            cy: l + (c.cy - l) * i,
            w: a.w,
            h: a.h,
            ang: c.ang * i,
            k: h + (1 - h) * i,
            chain: i > 0.6 ? c.chain : 0,
            chainA: (i - 0.6) / 0.4,
          }));
      }
      return;
    }
    (t.dim(0.5), this.drawPanel(t, o, 1));
    const c = Math.min(1, (i - this.openT) / 150);
    (s.save(),
      (s.globalAlpha = c),
      Font.center(s, "公告", o.x + o.w / 2, o.y + 10, "#FFF0C8"),
      this.drawList(t, c >= 1));
    for (const e of this.widgets) t.button(e);
    if ((s.restore(), c >= 1))
      for (const e of this.widgets)
        e.tip &&
          t.hit(e) &&
          t.tooltip(
            e.tip.map((t) => ({ text: t })),
            t.mouse.x,
            t.mouse.y,
          );
  }
  drawPanel(t, e, s = 1) {
    const i = t.ctx,
      n = NewsBoard.woodTex(this.game);
    (n
      ? i.drawImage(n, 0, 0, Math.min(640, e.w / s), Math.min(480, e.h / s), e.x, e.y, e.w, e.h)
      : ((i.fillStyle = "#3B2614"), i.fillRect(e.x, e.y, e.w, e.h)),
      (i.strokeStyle = "#140A04"),
      (i.lineWidth = 2),
      i.strokeRect(e.x + 1, e.y + 1, e.w - 2, e.h - 2),
      (i.strokeStyle = "rgba(0,0,0,0.32)"),
      (i.lineWidth = 1),
      i.strokeRect(e.x + 2.5, e.y + 2.5, e.w - 5, e.h - 5),
      (i.fillStyle = "rgba(255,255,255,0.07)"),
      i.fillRect(e.x + 3, e.y + 3, e.w - 6, 1));
  }
  drawList(t, e) {
    const s = t.ctx,
      i = this.area(),
      n = NewsBoard.isSuper(),
      o = performance.now();
    ((this.btns = []),
      (s.fillStyle = "rgba(0,0,0,0.38)"),
      s.fillRect(i.x, i.y, i.w, i.h),
      s.save(),
      s.beginPath(),
      s.rect(i.x, i.y, i.w, i.h),
      s.clip());
    const a = i.x + 4,
      h = i.w - 10;
    this.rows.length ||
      (Font.center(
        s,
        NewsBoard.loading ? "正在读取公告…" : "还没有公告",
        i.x + i.w / 2,
        i.y + i.h / 2 - 8,
        "#A0A0A0",
      ),
      NewsBoard.loading ||
        !NewsBoard.err ||
        NewsBoard.list ||
        Font.center(
          s,
          fitText(NewsBoard.err, i.w - 8),
          i.x + i.w / 2,
          i.y + i.h / 2 + 6,
          "#FF8080",
        ));
    for (const r of this.rows) {
      const l = Math.round(i.y + r.y - this.scroll),
        c = r.it;
      if (l > i.y + i.h || l + r.h + 4 < i.y) continue;
      const d = !c.draft && (c.at || 0) > this.seen0,
        u = c.draft ? "草稿" : d ? "NEW" : "",
        w = a + h,
        f = u ? Font.width(u) + 6 : 0;
      let y = a;
      if (
        (c.pin && (y = Font.draw(s, "[置顶]", y, l, "#FFAA00") + 3),
        c.imp && (y = Font.draw(s, "[重要]", y, l, "#FF5555") + 3),
        Font.draw(s, fitText(c.title || "", Math.max(12, w - f - y)), y, l, "#FFFF55"),
        u && Font.draw(s, u, w - Font.width(u), l, c.draft ? "#A0A0A0" : "#55FF55"),
        Font.draw(s, NewsBoard.date(c.at) + (c.draft ? "（未发布）" : ""), a, l + 11, "#A0A0A0"),
        n && e)
      ) {
        let e = a + h;
        const add = (s, i) => {
          const n = Font.width(s) + 10;
          e -= n;
          const o = { x: e, y: l + 9, w: n, h: 12, label: s, act: i, enabled: !this.busy };
          (t.button(o), this.btns.push(o), (e -= 3));
        };
        (add(this.del && this.del.id === c.id && o - this.del.t < 4e3 ? "确定删除？" : "删除", () =>
          this.remove(c),
        ),
          add("编辑", () => this.game.ui.open(new NewsEditScreen(this.game, this, c))),
          c.draft && add("发布", () => this.publish(c)));
      }
      r.gh && this.drawGift(t, c, a, l + 22, h, e);
      let m = l + 23 + r.gh;
      for (const t of r.lines) {
        let e = a;
        if (t)
          for (const i of t)
            (i.b && Font.draw(s, i.t, e + 0.5, m, "#FFD24A"),
              (e = Font.draw(s, i.t, e, m, i.b ? "#FFD24A" : "#E8E8E8")));
        m += 10;
      }
      const g = l + r.h + 3;
      ((s.fillStyle = "rgba(0,0,0,0.45)"),
        s.fillRect(a, g, h, 1),
        (s.fillStyle = "rgba(255,255,255,0.10)"),
        s.fillRect(a, g + 1, h, 1));
    }
    s.restore();
    const r = this.maxScroll();
    if (r > 0) {
      const t = Math.max(10, Math.floor((i.h * i.h) / this.contentH)),
        e = i.y + Math.round(((i.h - t) * this.scroll) / r);
      ((s.fillStyle = "rgba(0,0,0,0.5)"),
        s.fillRect(i.x + i.w - 3, i.y, 2, i.h),
        (s.fillStyle = "#C0B090"),
        s.fillRect(i.x + i.w - 3, e, 2, t));
    }
    this.msg &&
      o - this.msgT < 4e3 &&
      ((s.fillStyle = "rgba(0,0,0,0.75)"),
      s.fillRect(i.x, i.y + i.h - 12, i.w, 12),
      Font.center(
        s,
        fitText(this.msg, i.w - 8),
        i.x + i.w / 2,
        i.y + i.h - 10,
        this.msgBad ? "#FF6060" : "#FFFFFF",
      ));
  }
  drawGift(t, e, s, i, n, o) {
    const a = t.ctx,
      h = Cosmetics.has(e.gift),
      r = !h && !e.draft,
      l = 28,
      c = r ? 0.55 + 0.45 * Math.sin(((performance.now() / 1e3) * Math.PI * 2) / 1.4) : 0;
    if (r) {
      a.lineWidth = 1;
      for (let t = 3; t >= 1; t--)
        ((a.strokeStyle = `rgba(255,196,64,${((0.6 * c * (4 - t)) / 3).toFixed(3)})`),
          a.strokeRect(s - t + 0.5, i - t + 0.5, l + 2 * t - 1, l + 2 * t - 1));
    }
    if (
      ((a.fillStyle = "rgba(0,0,0,0.45)"),
      a.fillRect(s, i, l, l),
      r &&
        ((a.fillStyle = `rgba(255,210,100,${(0.12 + 0.16 * c).toFixed(3)})`),
        a.fillRect(s, i, l, l)),
      (a.strokeStyle = r ? "#E8B830" : "#555555"),
      (a.lineWidth = 1),
      a.strokeRect(s + 0.5, i + 0.5, 27, 27),
      Cosmetics.drawIcon(a, e.gift, s + 2, i + 2, 24, !1),
      r)
    ) {
      const t = s + l - 6,
        e = i - 4;
      ((a.fillStyle = "#6E0000"),
        a.fillRect(t, e + 1, 10, 9),
        a.fillRect(t + 1, e, 8, 11),
        (a.fillStyle = "#E8262B"),
        a.fillRect(t + 1, e + 1, 8, 9),
        Font.draw(a, "!", t + Math.round((10 - Font.width("!")) / 2), e + 2, "#FFFFFF", !1));
    }
    const d = this.busy === e.id ? "领取中…" : h ? "去穿戴" : "领取",
      u = Math.max(48, Font.width(d) + 16),
      w = n - l - 8 - u - 6;
    (Font.draw(a, fitText("礼物：" + Cosmetics.name(e.gift), w), s + l + 8, i + 4, "#FFD24A"),
      Font.draw(
        a,
        fitText(
          e.draft
            ? "发布以后玩家才能领取"
            : h
              ? "已领取，在「皮肤和装饰」里穿上"
              : "点「领取」马上到账，永久保留",
          w,
        ),
        s + l + 8,
        i + 16,
        "#A0A0A0",
      ));
    const f = {
      x: s + n - u,
      y: i + 5,
      w: u,
      h: 18,
      label: d,
      gold: !h,
      enabled: o && !this.busy,
      act: () => this.takeGift(e),
    };
    o && (t.button(f), this.btns.push(f));
  }
  mouseDown(t, e, s, i) {
    if (0 !== i) return;
    if ("drop" === this.phase)
      return ((this.t0 = performance.now() - NEWS_T.drop - NEWS_T.grow), void (this.snd = 2));
    if ("open" !== this.phase) return;
    for (const i of this.widgets) {
      const n = i.pad || 0;
      if (
        !1 !== i.enabled &&
        t.hit(n ? { x: i.x - n, y: i.y - n, w: i.w + 2 * n, h: i.h + 2 * n } : i, e, s)
      )
        return (Sound.init && Sound.init(), Sound.click(), void i.onClick());
    }
    const n = this.area();
    if (t.hit(n, e, s)) {
      for (const i of this.btns)
        if (!1 !== i.enabled && t.hit(i, e, s)) return (Sound.click(), void i.act());
      this.drag = { y: s, s: this.scroll };
    } else t.hit(this.panel(), e, s) || this.back();
  }
  mouseMove(t, e, s) {
    this.drag &&
      t.mouse.down &&
      (this.scroll = clamp(this.drag.s - (s - this.drag.y), 0, this.maxScroll()));
  }
  mouseUp() {
    this.drag = null;
  }
  wheel(t, e) {
    "open" === this.phase &&
      (this.scroll = clamp(this.scroll + 20 * Math.sign(e), 0, this.maxScroll()));
  }
  onEsc() {
    this.back();
  }
  back() {
    if ("close" !== this.phase)
      return this.from && "open" === this.phase
        ? ((this.phase = "close"), (this.tc = performance.now()), void (this.drag = null))
        : void this.finish();
  }
  finish() {
    const t = this.game;
    this.parent
      ? t.ui.open(this.parent)
      : "play" === t.state
        ? t.ui.close()
        : t.ui.open(new TitleScreen(t));
  }
  async takeGift(t) {
    const e = this.game;
    if (t.draft) this.say("发布以后玩家才能领取");
    else if (Cosmetics.has(t.gift)) Cosmetics.openWardrobe(e, this, t.gift);
    else if (Account.loggedIn) {
      if (!this.busy) {
        this.busy = t.id;
        try {
          const e = await Account.api("/api/account/gift", { id: t.id });
          (e.account && Account.took({ account: e.account }),
            Sound.ev && Sound.ev("entity.player.levelup", null, 0.8, 1),
            "undefined" != typeof Telemetry && Telemetry.count && Telemetry.count("news_gift"),
            this.say(`领到了${Cosmetics.name(e.gift) || "礼物"}！点「去穿戴」穿上`));
        } catch (t) {
          this.say(t.message, !0);
        }
        this.busy = !1;
      }
    } else
      "undefined" != typeof LoginScreen &&
        e.ui.open(
          new LoginScreen(
            e,
            () => {
              (e.ui.open(this), this.takeGift(t));
            },
            () => e.ui.open(this),
          ),
        );
  }
  async publish(t) {
    if (!this.busy) {
      ((this.busy = !0), this.say("正在发布…"));
      try {
        const e = await Account.api("/api/account/news/save", {
          id: t.id,
          title: t.title,
          body: t.body,
          pin: !!t.pin,
          imp: !!t.imp,
          publish: !0,
        });
        (e.list && (NewsBoard.adminList = e.list),
          NewsBoard.ver++,
          "undefined" != typeof Telemetry && Telemetry.count && Telemetry.count("news_publish"),
          this.say("已发布"),
          NewsBoard.fetch(!0));
      } catch (t) {
        this.say(t.message, !0);
      }
      this.busy = !1;
    }
  }
  async remove(t) {
    const e = performance.now();
    if (!this.del || this.del.id !== t.id || e - this.del.t > 4e3) this.del = { id: t.id, t: e };
    else if (((this.del = null), !this.busy)) {
      ((this.busy = !0), this.say("正在删除…"));
      try {
        const e = await Account.api("/api/account/news/delete", { id: t.id });
        ((NewsBoard.adminList = e.list || []),
          NewsBoard.ver++,
          this.say("已删除"),
          NewsBoard.fetch(!0));
      } catch (t) {
        this.say(t.message, !0);
      }
      this.busy = !1;
    }
  }
}
for (const t of ["contextmenu", "mousedown"])
  window.addEventListener(
    t,
    (t) => {
      t.target &&
        t.target.classList &&
        t.target.classList.contains("news-ta") &&
        t.stopImmediatePropagation();
    },
    !0,
  );
class NewsEditScreen extends FormScreen {
  constructor(t, e, s) {
    (super(t, s ? "编辑公告" : "新建公告", e),
      (this.titleY = 8),
      (this.item = s || null),
      (this.ttl = (s && s.title) || ""),
      (this.body = (s && s.body) || ""),
      (this.pin = !(!s || !s.pin)),
      (this.imp = !(!s || !s.imp)),
      (this.gift = (s && s.gift) || null),
      (this.busy = !1),
      (this.msg = ""),
      (this.msgBad = !1),
      (this.ta = null),
      (this.checks = []),
      (this.first = !0));
  }
  live() {
    return !(!this.item || this.item.draft);
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      s = Math.min(t.w - 16, 320),
      i = Math.floor(e - s / 2);
    ((this.fields = {}), this.addField("ttl", i, 30, s, "标题（30 字以内）", 30));
    const n = Math.max(36, t.h - 66 - 60);
    ((this.box = { x: i, y: 66, w: s, h: n }),
      (this.checks = [
        { x: i, y: 66 + n + 5, w: 50, h: 12, k: "pin", label: "置顶" },
        { x: i + 58, y: 66 + n + 5, w: 50, h: 12, k: "imp", label: "重要" },
      ]));
    const o = t.h - 24,
      a = Math.floor((s - 8) / 3),
      h = this.live(),
      r = [null, ...("undefined" != typeof Cosmetics ? Cosmetics.LIST.map((t) => t.id) : [])];
    if (
      ((this.giftBtn = {
        x: i + s - 120,
        y: 66 + n + 4,
        w: 120,
        h: 14,
        label: () => "礼物：" + (this.gift ? Cosmetics.name(this.gift) : "无"),
        tip: ["玩家在这条公告右上角点「领取」就拿到", "再点一下换下一件"],
        onClick: () => {
          this.gift = r[(r.indexOf(this.gift) + 1) % r.length];
        },
      }),
      (this.widgets = [
        this.giftBtn,
        {
          x: i,
          y: o,
          w: a,
          h: 20,
          label: h ? "保存修改" : "保存草稿",
          enabled: !this.busy,
          tip: h ? ["改了以后照样显示，不算新公告"] : ["只有超级管理员看得到"],
          onClick: () => this.save(h ? {} : { draft: !0 }),
        },
        {
          x: i + a + 4,
          y: o,
          w: a,
          h: 20,
          gold: !0,
          label: h ? "重新发布" : "发布",
          enabled: !this.busy,
          tip: ["所有玩家都看得到，时间算现在，没看过的玩家牌子上会有提醒"],
          onClick: () => this.save({ publish: !0 }),
        },
        {
          x: i + 2 * (a + 4),
          y: o,
          w: s - 2 * (a + 4),
          h: 20,
          label: "取消",
          onClick: () => this.back(),
        },
      ]),
      this.place(),
      this.field && t.inputBox)
    ) {
      const e = this.fields[this.field],
        s = t.scale / t.dpr,
        i = t.input;
      ((t.inputBox.x = e.x + 4),
        (t.inputBox.y = e.y + 6),
        (i.style.left = (e.x + 4) * s + "px"),
        (i.style.top = (e.y + 6) * s + "px"),
        (i.style.width = (e.w - 8) * s + "px"));
    }
    this.first && ((this.first = !1), this.item || this.focus("ttl"));
  }
  place() {
    const t = this.game.ui,
      e = this.box,
      s = t.scale / t.dpr;
    let i = this.ta;
    if (!i) {
      const t = navigator.maxTouchPoints > 0;
      ((i = this.ta = document.createElement("textarea")),
        (i.maxLength = 3e3),
        (i.value = this.body),
        (i.placeholder = "正文（换行就是分段）"),
        (i.spellcheck = !1),
        i.setAttribute("autocomplete", "off"),
        Object.assign(i.style, {
          position: "absolute",
          zIndex: "6",
          boxSizing: "border-box",
          margin: "0",
          padding: "6px 8px",
          resize: "none",
          background: "rgba(0,0,0,0.85)",
          color: "#F0F0F0",
          border: "2px solid #A0A0A0",
          borderRadius: "0",
          outline: "none",
          font: (t ? 16 : 14) + 'px/1.45 "Microsoft YaHei", "PingFang SC", sans-serif',
          userSelect: "text",
          webkitUserSelect: "text",
          touchAction: "auto",
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          webkitTouchCallout: "default",
        }),
        (i.className = "news-ta"));
      const stop = (t) => t.stopPropagation();
      for (const t of [
        "mousedown",
        "mouseup",
        "touchstart",
        "touchmove",
        "touchend",
        "touchcancel",
        "wheel",
        "keyup",
      ])
        i.addEventListener(t, stop, { passive: !0 });
      (i.addEventListener("keydown", (t) => {
        (t.stopPropagation(), "Escape" === t.key && (t.preventDefault(), i.blur()));
      }),
        i.addEventListener("input", () => {
          this.body = i.value;
        }),
        i.addEventListener("focus", () => {
          i.style.borderColor = "#FFFFFF";
          const t = this.game.ui;
          t.inputBox && ((this.field = null), t.hideInput());
        }),
        i.addEventListener("blur", () => {
          i.style.borderColor = "#A0A0A0";
        }),
        document.body.appendChild(i));
    }
    Object.assign(i.style, {
      left: e.x * s + "px",
      top: e.y * s + "px",
      width: e.w * s + "px",
      height: e.h * s + "px",
    });
  }
  close() {
    this.ta && (this.ta.remove(), (this.ta = null));
  }
  submit() {
    this.ta && this.ta.focus();
  }
  drawExtra(t) {
    const e = t.ctx,
      s = this.box,
      i = this.ta ? this.ta.value : this.body;
    (this.drawFields(t),
      Font.draw(
        e,
        fitText(`正文（可以分段，**两边加两个星号**是加粗，${i.length}/1000）`, s.w),
        s.x,
        s.y - 11,
        "#A0A0A0",
      ),
      (e.fillStyle = "#000"),
      e.fillRect(s.x, s.y, s.w, s.h));
    for (const s of this.checks) {
      const i = t.hit(s);
      ((e.fillStyle = "#000"),
        e.fillRect(s.x, s.y, 12, 12),
        (e.strokeStyle = i ? "#FFFFFF" : "#A0A0A0"),
        (e.lineWidth = 1),
        e.strokeRect(s.x + 0.5, s.y + 0.5, 11, 11),
        this[s.k] &&
          ("function" == typeof drawIcon
            ? drawIcon(e, "check", s.x + 2, s.y + 2, 1, "#55FF55")
            : Font.draw(e, "✓", s.x + 3, s.y + 2, "#55FF55")),
        Font.draw(e, s.label, s.x + 16, s.y + 2, "#FFFFFF"));
    }
    const n = this.checks[1],
      o = n.x + n.w + 6;
    this.giftBtn.x - 4 - o > 40 &&
      Font.draw(
        e,
        fitText("重要：玩家第一次看到时自动掉下来", this.giftBtn.x - 4 - o),
        o,
        n.y + 2,
        "#808080",
      );
    const a = this.checks[0].y + 16;
    if (this.msg)
      return void Font.draw(e, fitText(this.msg, s.w), s.x, a, this.msgBad ? "#FF6060" : "#A0A0A0");
    let h = Font.draw(e, "预览：", s.x, a, "#A0A0A0");
    (this.pin && (h = Font.draw(e, "[置顶]", h, a, "#FFAA00") + 3),
      this.imp && (h = Font.draw(e, "[重要]", h, a, "#FF5555") + 3),
      (h =
        Font.draw(
          e,
          fitText(
            String(this.ttl || "").trim() || "（还没有标题）",
            Math.max(20, 0.5 * (s.x + s.w - h)),
          ),
          h,
          a,
          "#FFFF55",
        ) + 6));
    const r = NewsBoard.plain(i.split("\n").find((t) => t.trim()) || "");
    r && s.x + s.w - h > 20 && Font.draw(e, fitText(r.trim(), s.x + s.w - h), h, a, "#E0E0E0");
  }
  mouseDown(t, e, s, i) {
    if (0 === i)
      for (const i of this.checks)
        if (t.hit({ x: i.x - 2, y: i.y - 4, w: i.w + 4, h: i.h + 8 }, e, s))
          return (Sound.click(), void (this[i.k] = !this[i.k]));
    super.mouseDown(t, e, s, i);
  }
  say(t, e) {
    ((this.msg = t), (this.msgBad = !!e));
  }
  async save(t) {
    if (this.busy) return;
    const e = this.ta ? this.ta.value : this.body,
      s = String(this.ttl || "").trim();
    if (s)
      if (e.trim()) {
        ((this.busy = !0), this.say(t.publish ? "正在发布…" : "正在保存…"), this.layout());
        try {
          const i = await Account.api("/api/account/news/save", {
            id: this.item ? this.item.id : void 0,
            title: s,
            body: e,
            pin: this.pin,
            imp: this.imp,
            gift: this.gift,
            ...t,
          });
          return (
            i.list && (NewsBoard.adminList = i.list),
            NewsBoard.ver++,
            t.publish &&
              "undefined" != typeof Telemetry &&
              Telemetry.count &&
              Telemetry.count("news_publish"),
            NewsBoard.fetch(!0),
            this.parent instanceof NewsScreen && this.parent.say(t.publish ? "已发布" : "已保存"),
            (this.busy = !1),
            void (this.game.ui.screen === this && this.back())
          );
        } catch (t) {
          this.say(t.message, !0);
        }
        ((this.busy = !1), this.game.ui.screen === this && this.layout());
      } else this.say("正文是空的", !0);
    else this.say("标题是空的", !0);
  }
}
//# sourceURL=js/news.js
