"use strict";
const Checkin = (() => {
    const t = 288e5,
      e = 864e5,
      dayKey = (e) => new Date(e + t).toISOString().slice(0, 10),
      bj = (e) => new Date(e + t),
      p2 = (t) => String(t).padStart(2, "0"),
      i = {
        "hat:straw": "草帽",
        "cape:penguin": "企鹅披风",
        "hat:tophat": "礼帽",
        "pet:snowman": "小雪人",
        "cape:penguinwalk": "企鹅动态披风",
        "hat:crown": "皇冠",
        "pre:potato": "土豆名字前缀",
      },
      n = { hat: "帽子", cape: "披风", pet: "宠物", pre: "名字前缀" },
      o = {
        st: null,
        skew: 0,
        err: "",
        busy: null,
        busyWho: null,
        busyLoud: !1,
        game: null,
        tried: -1e9,
        triedWho: null,
        wait: 6e4,
        seq: 0,
        claimAt: 0,
        claiming: 0,
        dayKey: dayKey,
        now() {
          return Date.now() + this.skew;
        },
        who: () =>
          Account.loggedIn && Account.data
            ? String(Account.data.id || Account.data.name || "?")
            : "",
        cur() {
          return this.st && this.st.who === this.who() ? this.st : null;
        },
        phase(t = this.st) {
          if (!t) return "";
          const e = this.now();
          return e < t.event.start ? "before" : e >= t.event.end ? "ended" : "open";
        },
        count(t = this.st) {
          return (t && t.event.rewards && t.event.rewards.length) || 7;
        },
        today(t = this.st) {
          return !(!t || !t.today || dayKey(this.now()) !== t.dayAt);
        },
        canSign(t = this.cur()) {
          return !(
            !(t && t.logged && "open" === this.phase(t) && t.days < this.count(t)) || this.today(t)
          );
        },
        dot() {
          const t = this.cur();
          return !(!t || "open" !== this.phase(t)) && (!t.logged || this.canSign(t));
        },
        shown() {
          const t = this.now();
          return !!this.st && t >= this.st.event.start && t < this.st.event.end;
        },
        name(t) {
          if ("undefined" != typeof Cosmetics && Cosmetics.name)
            try {
              const e = Cosmetics.name(t);
              if (e) return e;
            } catch (t) {}
          return i[t] || "装饰";
        },
        kind: (t) => String(t || "").split(":")[0],
        kindName(t) {
          return n[this.kind(t)] || "装饰";
        },
        day(t) {
          const e = bj(t);
          return `${e.getUTCMonth() + 1}月${e.getUTCDate()}日`;
        },
        time(t) {
          const e = bj(t);
          return `${p2(e.getUTCHours())}:${p2(e.getUTCMinutes())}`;
        },
        dates(t) {
          const e =
            "00:00" === this.time(t.end)
              ? this.day(t.end - 1)
              : this.day(t.end) + " " + this.time(t.end);
          return `${this.day(t.start)} ${this.time(t.start)} – ${e}`;
        },
        span(t) {
          const e = Math.max(0, Math.floor(t / 1e3)),
            i = Math.floor(e / 86400),
            n = Math.floor(e / 3600) % 24,
            o = Math.floor(e / 60) % 60;
          return (i ? i + " 天 " : "") + `${p2(n)}:${p2(o)}:${p2(e % 60)}`;
        },
        untilMidnight() {
          return e - ((this.now() + t) % e);
        },
        load(t, e) {
          t && (this.game = t);
          const i = this.who();
          return this.busy
            ? this.busyWho !== i || (e && !this.busyLoud)
              ? this.busy.then(() => this.load(t, e))
              : this.busy
            : !e &&
                ((this.triedWho === i && performance.now() - this.tried < this.wait) ||
                  !1 === navigator.onLine)
              ? Promise.resolve(this.cur())
              : ((this.tried = performance.now()),
                (this.triedWho = i),
                (this.wait = 6e4),
                "undefined" != typeof RoomService && RoomService.base()
                  ? ((this.busyWho = i),
                    (this.busyLoud = !!e),
                    (this.busy = (e ? this.fetch() : this.quiet())
                      .catch((t) => {
                        this.err = t.message || String(t);
                      })
                      .then(() => ((this.busy = null), this.notify(), this.st))),
                    this.busy)
                  : ((this.err = "还没有配置游戏服务器地址"), Promise.resolve(null)));
        },
        async fetch() {
          const t = Date.now(),
            e = ++this.seq;
          let i = null,
            n = this.who();
          if (n)
            try {
              i = await Account.api("/api/account/checkin", {});
            } catch (t) {
              if (Account.loggedIn) throw t;
            }
          (i || ((n = ""), (i = await Account.api("/api/event"))),
            this.took(i, t, Date.now(), n, e));
        },
        async quiet() {
          const t = Date.now(),
            e = ++this.seq,
            i = RoomService.base(),
            n = this.who(),
            get = async (t, e) => {
              let n, o;
              try {
                n = await fetch(i + t, e ? { method: "POST", body: JSON.stringify(e) } : void 0);
              } catch (t) {
                throw ((this.wait = 6e5), new Error("游戏正在更新中…请稍后"));
              }
              if (401 === n.status) return null;
              try {
                o = await n.json();
              } catch (t) {
                o = { error: "游戏正在更新中…请稍后" };
              }
              if (!n.ok || o.error) throw new Error(o.error || "HTTP " + n.status);
              return o;
            };
          if (n) {
            const i = await get("/api/account/checkin", { _t: Account.token });
            return i ? this.took(i, t, Date.now(), n, e) : this.fetch();
          }
          this.took(await get("/api/event"), t, Date.now(), "", e);
        },
        took(t, e, i, n = this.who(), o) {
          if (void 0 !== o && (this.claiming > 0 || o < this.claimAt)) return;
          if (!t || !t.event) return void (this.err = "现在没有签到活动");
          const s = t.now || i;
          (t.now && (this.skew = t.now - (e + i) / 2),
            (this.st = {
              event: { ...t.event, rewards: t.event.rewards || [] },
              now: s,
              days: 0 | t.days,
              today: !!t.today,
              dayAt: dayKey(s),
              who: n,
              logged: !!n,
            }),
            (this.err = ""));
          try {
            localStorage.setItem("mcjs-checkin", JSON.stringify({ st: this.st, skew: this.skew }));
          } catch (t) {}
        },
        notify() {
          const t = this.game,
            e = t && t.ui && t.ui.screen;
          e &&
            e.layout &&
            (("undefined" != typeof TitleScreen && e instanceof TitleScreen) ||
              ("undefined" != typeof PauseScreen && e instanceof PauseScreen) ||
              e instanceof CheckinScreen) &&
            e.layout();
        },
        titleRect(t) {
          if ("undefined" != typeof NewsBoard && NewsBoard.signRect)
            try {
              const e = NewsBoard.signRect(t);
              if (e) return { x: e.x, y: e.y + e.h + 4, w: e.w, h: 16 };
            } catch (t) {}
          return t.w / 2 + 128 > t.w - 62
            ? { x: t.w - 60, y: 84, w: 54, h: 16 }
            : { x: t.w - 60, y: 66, w: 54, h: 16 };
        },
        drawDot(t, e, i) {
          const n = 0.75 + 0.25 * Math.sin(performance.now() / 260);
          ((t.fillStyle = "#3A0000"),
            t.fillRect(e - 1, i - 1, 7, 7),
            (t.fillStyle = `rgba(255,${Math.round(40 + 30 * n)},${Math.round(40 + 30 * n)},1)`),
            t.fillRect(e, i, 5, 5),
            (t.fillStyle = "#FFB0B0"),
            t.fillRect(e + 1, i + 1, 1, 1));
        },
        drawReward(t, e, i, n, o, s) {
          const a = t.ctx;
          if ("undefined" != typeof Cosmetics && Cosmetics.drawIcon)
            try {
              return void Cosmetics.drawIcon(a, e, i, n, o, s);
            } catch (t) {}
          const l = this.kind(e),
            r = String(e || "").split(":")[1];
          if ("cape" === l && "undefined" != typeof Capes && Capes.get && Capes.get(r)) {
            const t = Math.max(1, Math.floor(o / 16));
            return void Capes.drawFlat(
              a,
              r,
              Math.round(i + (o - 10 * t) / 2),
              Math.round(n + (o - 16 * t) / 2),
              t,
              s,
            );
          }
          ("pre" === l &&
          "potato" === r &&
          "undefined" != typeof ITEM_KEY &&
          void 0 !== ITEM_KEY.potato
            ? (a.save(),
              a.translate(i, n),
              a.scale(o / 16, o / 16),
              t.drawItem({ id: ITEM_KEY.potato, count: 1 }, 0, 0),
              a.restore())
            : ((a.fillStyle = "rgba(0,0,0,0.3)"),
              a.fillRect(i + 2, n + 2, o - 4, o - 4),
              Font.center(a, "?", i + o / 2, n + o / 2 - 4, "#FFFFFF")),
            s && ((a.fillStyle = "rgba(0,0,0,0.45)"), a.fillRect(i, n, o, o)));
        },
        tc: (t) => {
          "undefined" != typeof Telemetry && Telemetry.count && Telemetry.count(t);
        },
      };
    try {
      const t = JSON.parse(localStorage.getItem("mcjs-checkin") || "null");
      t && t.st && t.st.event && ((o.st = t.st), (o.skew = +t.skew || 0));
    } catch (t) {}
    return o;
  })(),
  CHK_PENGUIN = [
    "..kkkk..",
    ".kkkkkk.",
    ".kWkkWk.",
    ".kkookk.",
    "kkrrrrkk",
    "kkWWWWrk",
    ".kWWWWk.",
    ".kWWWWk.",
    "..kkkk..",
  ],
  CHK_PAL = { k: "#1E1E26", W: "#F7F7F2", o: "#F29A2E", r: "#E8262B" },
  CHK_BOX = [
    ["#E8473F", "#FFE27A"],
    ["#4AA3E8", "#FFFFFF"],
    ["#5DBB63", "#E8262B"],
    ["#B06AE0", "#FFE27A"],
    ["#F28C38", "#FFFFFF"],
    ["#E85D9A", "#FFFFFF"],
    ["#F2C230", "#C8261E"],
  ],
  chkRnd = (t, e) => {
    const i = 43758.5453 * Math.sin(12.9898 * t + 78.233 * e);
    return i - Math.floor(i);
  };
class CheckinScreen extends MenuScreen {
  constructor(t, e, i) {
    (super(t, null),
      (this.parent = e),
      (this.pauses = "play" === t.state && !t.net),
      (this.bgDim = 0.6),
      (this.note = ""),
      (this.noteBad = !1),
      (this.sel = null),
      (this.got = null),
      (this.busy = !1),
      (this.key = ""),
      (this.t0 = performance.now()),
      i || Checkin.tc("checkin_open"),
      (this.asked = performance.now()),
      Checkin.load(t, !0));
  }
  say(t, e) {
    ((this.note = t), (this.noteBad = !!e), (this.noteT = performance.now()));
  }
  back() {
    this.game.ui.open(this.parent || new TitleScreen(this.game));
  }
  onEsc() {
    this.back();
  }
  state() {
    const t = Checkin.cur();
    if (!t)
      return (
        !Checkin.busy &&
          !Checkin.err &&
          performance.now() - this.asked > 3e3 &&
          ((this.asked = performance.now()), Checkin.load(this.game, !0)),
        Checkin.busy || !Checkin.err ? "loading" : "error"
      );
    if (this.got) return "got";
    const e = Checkin.phase(t);
    return "ended" === e
      ? "ended"
      : t.logged
        ? "before" === e
          ? "before"
          : t.days >= Checkin.count(t)
            ? "all"
            : Checkin.today(t)
              ? "today"
              : "sign"
        : "login";
  }
  geo() {
    const t = this.game.ui,
      e = Checkin.count(Checkin.st),
      i = Math.min(t.w - 8, 440);
    let n = Math.min(t.h - 8, 270),
      o = Math.floor((t.w - i) / 2),
      s = Math.floor((t.h - n) / 2);
    if ("undefined" != typeof Stage && Stage.inToy && !Stage.rot) {
      const e = t.dpr / t.scale,
        a = Math.ceil(110 * e),
        l = Math.ceil(50 * e);
      o + i > t.w - a &&
        s < l &&
        (t.w - a - i >= 4 ? (o = t.w - a - i) : ((s = l + 2), (n = Math.min(270, t.h - s - 4))));
    }
    const a = { x: o, y: s, w: i, h: n },
      l = { x: o + 4, y: s + n - 50, w: i - 8, h: 46 },
      r = { x: o + 4, y: s + 34, w: i - 8, h: l.y - (s + 34) },
      h = Math.min(34, 0.3 * r.h),
      ground = (t) =>
        Math.round(r.y + r.h - 14 - ((t - r.x) / r.w) * h - 3 * Math.sin(0.05 * (t - r.x))),
      c = r.x + 34,
      d = (r.w - 34 - 30) / Math.max(1, e - 1),
      f = [];
    for (let t = 0; t < e; t++) {
      const i = Math.round(c + t * d),
        n = ground(i);
      f.push({ i: t, x: i, gy: n, big: t === e - 1, hit: { x: i - 15, y: n - 50, w: 30, h: 58 } });
    }
    return {
      u: t,
      n: e,
      P: a,
      bar: l,
      scene: r,
      ground: ground,
      stops: f,
      step: d,
      icon: { x: l.x + 6, y: l.y + 5, w: 36, h: 36 },
    };
  }
  layout() {
    const t = this.game,
      e = this.geo(),
      i = Checkin.cur(),
      n = this.state(),
      o = e.bar;
    ((this.key = n + (this.got && this.got.done ? "+" : "")),
      (this.widgets = [
        {
          x: e.P.x + e.P.w - 20,
          y: e.P.y + 5,
          w: 15,
          h: 15,
          pad: 5,
          label: "×",
          onClick: () => this.back(),
        },
      ]));
    const s = o.y + Math.round((o.h - 22) / 2);
    let a = o.x + o.w - 6 - 76;
    const add = (t) => {
      (this.widgets.push({ x: a, y: s, w: 76, h: 22, ...t }), (a -= 80));
    };
    ("sign" === n &&
      add({
        gold: !0,
        glow: !0,
        label: () => (this.busy ? "正在签到…" : "签到"),
        enabled: !this.busy,
        onClick: () => this.claim(),
      }),
      "login" === n &&
        add({
          gold: !0,
          label: "登录",
          onClick: () => {
            "undefined" != typeof LoginScreen &&
              t.ui.open(
                new LoginScreen(
                  t,
                  () => t.ui.open(new CheckinScreen(t, this.parent, !0)),
                  () => t.ui.open(this),
                ),
              );
          },
        }),
      "error" === n &&
        add({
          label: "重试",
          onClick: () => {
            ((Checkin.err = ""), Checkin.load(t, !0), this.layout());
          },
        }));
    i &&
      i.logged &&
      i.days > 0 &&
      (!this.got || this.got.done) &&
      "sign" !== n &&
      ("undefined" != typeof Cosmetics || "undefined" != typeof WardrobeScreen) &&
      add({
        gold: !!this.got,
        label: "去穿戴",
        onClick: () => this.wear(this.got ? Checkin.kind(this.got.id) : void 0),
      });
  }
  wear(t) {
    const e = this.game;
    if ("undefined" != typeof Cosmetics && Cosmetics.openWardrobe)
      return Cosmetics.openWardrobe(e, this, t);
    "undefined" != typeof WardrobeScreen && e.ui.open(new WardrobeScreen(e, this));
  }
  async claim() {
    if (this.busy) return;
    ((this.busy = !0), this.say(""), this.layout());
    const t = Date.now(),
      e = Checkin.cur() ? Checkin.cur().days - 1 : -1;
    let i = null,
      n = null;
    Checkin.claiming++;
    try {
      i = await Account.api("/api/account/checkin/claim", {});
    } catch (t) {
      n = t;
    }
    (Checkin.claiming--, i && (Checkin.claimAt = ++Checkin.seq));
    try {
      if (n) throw n;
      (i.account && ((Account.data = i.account), Account.save()), Checkin.took(i, t, Date.now()));
      const o = Checkin.count(),
        s = Math.max(0, Math.min(o - 1, (0 | i.days) - 1)),
        a = [];
      for (let t = 0; t < 36; t++)
        a.push({
          a: Math.random() * Math.PI * 2,
          v: 25 + 70 * Math.random(),
          c: ["#FFD24A", "#FFF2B0", "#FFFFFF", "#9FD8FF"][t % 4],
          s: t % 3 ? 2 : 3,
        });
      ((this.got = {
        id: i.reward || Checkin.st.event.rewards[s],
        idx: s,
        from: Math.min(e, s - 1),
        t0: performance.now(),
        sparks: a,
        opened: !1,
        landed: !1,
        done: !1,
        last: (0 | i.days) >= o,
      }),
        (this.sel = null),
        Checkin.tc("checkin_claim"));
    } catch (t) {
      (this.say(t.message, !0), Checkin.load(this.game, !0));
    }
    ((this.busy = !1), this.game.ui.screen === this && this.layout());
  }
  mouseDown(t, e, i, n) {
    if (0 === n)
      for (const n of this.geo().stops)
        if (t.hit(n.hit, e, i)) return ((this.sel = n.i), void Sound.click());
    for (const n of this.widgets)
      if (
        n.pad &&
        !1 !== n.enabled &&
        t.hit({ x: n.x - n.pad, y: n.y - n.pad, w: n.w + 2 * n.pad, h: n.h + 2 * n.pad }, e, i)
      )
        return (Sound.click(), void n.onClick());
    super.mouseDown(t, e, i, n);
  }
  focus(t) {
    const e = t.stops.find((e) => t.u.hit(e.hit));
    if (e) return e.i;
    if (this.got) return this.got.idx;
    if (null !== this.sel && this.sel < t.n) return this.sel;
    const i = Checkin.cur();
    return i ? Math.min(t.n - 1, i.days) : 0;
  }
  slotState(t, e) {
    return e
      ? t < e.days
        ? "got"
        : t === e.days && Checkin.canSign(e)
          ? "today"
          : "later"
      : "later";
  }
  penguinAt(t, e) {
    const i = Checkin.cur(),
      spot = (e) =>
        e < 0
          ? { x: t.stops[0].x - 22, y: t.ground(t.stops[0].x - 22) }
          : { x: t.stops[e].x - (t.stops[e].big ? 22 : 18), y: t.stops[e].gy };
    if (this.got) {
      const t = (e - this.got.t0) / 1e3,
        i = spot(this.got.from),
        n = spot(this.got.idx);
      if (t < 0.45) {
        const e = t / 0.45,
          o = e * e * (3 - 2 * e);
        return {
          x: i.x + (n.x - i.x) * o,
          y: i.y + (n.y - i.y) * o - 16 * Math.sin(e * Math.PI),
          hop: !0,
        };
      }
      return n;
    }
    return spot(i ? Math.min(t.n, i.days) - 1 : -1);
  }
  drawExtra(t) {
    const e = t.ctx,
      i = this.geo(),
      n = Checkin.cur(),
      o = Checkin.st,
      s = this.state(),
      a = performance.now(),
      l = (a - this.t0) / 1e3;
    s + (this.got && this.got.done ? "+" : "") !== this.key && this.layout();
    const r = i.P,
      h = i.scene,
      rect = (t, i, n, o, s) => {
        ((e.fillStyle = s), e.fillRect(Math.round(t), Math.round(i), Math.round(n), Math.round(o)));
      };
    (rect(r.x + 2, r.y, r.w - 4, r.h, "#060B1A"),
      rect(r.x, r.y + 2, r.w, r.h - 4, "#060B1A"),
      rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, "#060B1A"),
      rect(r.x + 2, r.y + 2, r.w - 4, r.h - 4, "#101C3C"),
      (e.strokeStyle = "rgba(190,225,255,0.55)"),
      (e.lineWidth = 1),
      e.strokeRect(r.x + 2.5, r.y + 2.5, r.w - 5, r.h - 5),
      Font.draw(e, (o && o.event.name) || "开服签到", r.x + 10, r.y + 8, "#FFFFFF"));
    const c = Font.width((o && o.event.name) || "开服签到");
    Font.draw(e, "· 冬日足迹", r.x + 14 + c, r.y + 8, "#9FD8FF");
    const d = i.n,
      f = n ? Math.min(d, n.days) : 0,
      u = r.x + r.w - 30 - 10 * d;
    for (let t = 0; t < d; t++)
      this.flake(
        e,
        u + 10 * t,
        r.y + 9,
        t < f ? "#FFD24A" : "rgba(160,190,230,0.35)",
        t < f && this.got && t === this.got.idx
          ? 1 + 0.4 * Math.max(0, 1 - 3 * Math.abs((a - this.got.t0) / 1e3 - 1.3))
          : 1,
      );
    (o &&
      Font.draw(
        e,
        fitText(Checkin.dates(o.event) + " · 累计签满 " + d + " 天就行，不用连续", r.w - 20),
        r.x + 10,
        r.y + 20,
        "#7F93BF",
      ),
      e.save(),
      e.beginPath(),
      e.rect(h.x, h.y, h.w, h.h),
      e.clip(),
      this.drawSky(e, h, l),
      this.drawSlope(e, i, l));
    const y = o ? o.event.rewards : [],
      w = this.focus(i);
    for (let t = 0; t + 1 < i.n; t++)
      this.steps(e, i, i.stops[t], i.stops[t + 1], n && t + 1 < n.days, t);
    i.n &&
      this.steps(
        e,
        i,
        { x: i.stops[0].x - 22, gy: i.ground(i.stops[0].x - 22) },
        i.stops[0],
        n && n.days > 0,
        -1,
      );
    for (const e of i.stops) this.drawStop(t, i, e, y[e.i], this.slotState(e.i, n), e.i === w, a);
    const g = this.penguinAt(i, a);
    (this.drawPenguin(e, g.x, g.y, l, !!g.hop),
      this.drawSnow(e, h, l),
      e.restore(),
      this.drawBar(t, i, y, w, s, n, a));
  }
  flake(t, e, i, n, o = 1) {
    (t.save(),
      t.translate(e + 2.5, i + 2.5),
      t.scale(o, o),
      (t.fillStyle = n),
      t.fillRect(-0.5, -2.5, 1, 5),
      t.fillRect(-2.5, -0.5, 5, 1),
      t.fillRect(-1.5, -1.5, 1, 1),
      t.fillRect(0.5, -1.5, 1, 1),
      t.fillRect(-1.5, 0.5, 1, 1),
      t.fillRect(0.5, 0.5, 1, 1),
      t.restore());
  }
  drawSky(t, e, i) {
    const n = t.createLinearGradient(0, e.y, 0, e.y + e.h);
    (n.addColorStop(0, "#081230"),
      n.addColorStop(0.55, "#1C3266"),
      n.addColorStop(1, "#3F5E9C"),
      (t.fillStyle = n),
      t.fillRect(e.x, e.y, e.w, e.h));
    for (let n = 0; n < 46; n++) {
      const o = e.x + Math.floor(chkRnd(n, 1) * e.w),
        s = e.y + Math.floor(chkRnd(n, 2) * e.h * 0.55),
        a = 0.35 + 0.65 * Math.max(0, Math.sin(i * (1 + 2 * chkRnd(n, 3)) + n));
      ((t.fillStyle = `rgba(255,255,255,${(a * (0.4 + 0.6 * chkRnd(n, 4))).toFixed(2)})`),
        t.fillRect(o, s, 1, 1));
    }
    const o = e.x + e.w - 34,
      s = e.y + 10;
    ((t.fillStyle = "rgba(255,248,214,0.12)"),
      t.fillRect(o - 4, s - 4, 18, 18),
      (t.fillStyle = "#FFF4C8"),
      t.fillRect(o, s + 2, 10, 6),
      t.fillRect(o + 2, s, 6, 10),
      t.fillRect(o + 1, s + 1, 8, 8),
      (t.fillStyle = "#16295A"),
      t.fillRect(o + 4, s, 6, 7),
      t.fillRect(o + 5, s - 1, 6, 8));
    for (let n = 0; n < e.w; n += 2) {
      const o = n / e.w;
      for (const [s, a, l, r] of [
        [1, "90,255,190", 0, 0.16],
        [0.7, "120,200,255", 2.1, 0.26],
      ]) {
        const h =
            e.y + e.h * r + 7 * Math.sin(7 * o + 0.35 * i + l) + 3 * Math.sin(17 * o - 0.2 * i + l),
          c = 0.16 * s * (0.55 + 0.45 * Math.sin(5 * o - 0.5 * i + l));
        ((t.fillStyle = `rgba(${a},${c.toFixed(3)})`),
          t.fillRect(e.x + n, Math.round(h), 2, 12),
          (t.fillStyle = `rgba(${a},${(0.5 * c).toFixed(3)})`),
          t.fillRect(e.x + n, Math.round(h) + 12, 2, 8));
      }
    }
    const mh = (t) =>
        e.h * (0.16 + 0.16 * Math.abs(Math.sin(4.3 * t + 0.6)) + 0.05 * Math.sin(13 * t)),
      a = e.y + 0.8 * e.h;
    let l = 0;
    for (let t = 0; t < e.w; t += 2) l = Math.max(l, mh(t / e.w));
    const r = t.createLinearGradient(0, a - l, 0, a);
    (r.addColorStop(0, "#3A5694"), r.addColorStop(1, "#22386C"));
    for (let i = 0; i < e.w; i += 2) {
      const n = mh(i / e.w),
        o = Math.round(a - n);
      ((t.fillStyle = r),
        t.fillRect(e.x + i, o, 2, e.y + e.h - o),
        (t.fillStyle = "#6F8CC6"),
        t.fillRect(e.x + i, o, 2, 1));
      const s = Math.min(4, Math.round(0.5 * (n - 0.86 * l)));
      s > 0 &&
        ((t.fillStyle = "#DCE8F8"),
        t.fillRect(e.x + i, o, 2, s),
        (t.fillStyle = "#AFC3E4"),
        t.fillRect(e.x + i, o + s, 2, 1));
    }
  }
  drawSlope(t, e, i) {
    const n = e.scene;
    for (let i = 0; i < n.w; i += 2) {
      const o = n.x + i,
        s = e.ground(o);
      ((t.fillStyle = "#E3EFFA"),
        t.fillRect(o, s, 2, n.y + n.h - s),
        (t.fillStyle = "#F7FBFF"),
        t.fillRect(o, s, 2, 2),
        (t.fillStyle = "#C9DCEF"),
        t.fillRect(o, s + 7 + ((i >> 1) % 5 == 0 ? 1 : 0), 2, 1));
    }
    for (let o = 0; o < 14; o++) {
      const s = n.x + Math.floor(chkRnd(o, 9) * n.w),
        a = e.ground(s) + 3 + Math.floor(8 * chkRnd(o, 10));
      Math.sin(2 * i + 1.7 * o) > 0.7 && ((t.fillStyle = "#FFFFFF"), t.fillRect(s, a, 1, 1));
    }
  }
  steps(t, e, i, n, o, s) {
    const a = Math.max(2, Math.floor((n.x - i.x) / 6));
    for (let s = 1; s < a; s++) {
      const l = Math.round(i.x + 6 + ((n.x - 12 - i.x) * s) / a),
        r = e.ground(l) + 3 + (s % 2 ? 0 : 2);
      ((t.fillStyle = o ? "#8EA7C6" : "rgba(150,175,205,0.35)"), t.fillRect(l, r, 2, 1));
    }
  }
  drawSnow(t, e, i) {
    for (let n = 0; n < 70; n++) {
      const o = 8 + 14 * chkRnd(n, 5),
        s = e.x + ((((chkRnd(n, 6) * e.w + 6 * Math.sin(0.8 * i + n)) % e.w) + e.w) % e.w),
        a = e.y + ((chkRnd(n, 7) * e.h + i * o) % e.h);
      ((t.fillStyle = n % 5 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.95)"),
        t.fillRect(Math.round(s), Math.round(a), n % 7 ? 1 : 2, n % 7 ? 1 : 2));
    }
  }
  drawStop(t, e, i, n, o, s, a) {
    const l = t.ctx,
      r = i.big ? 1.5 : 1,
      h = Math.round(16 * r),
      c = Math.round(13 * r),
      d = i.x - h / 2,
      f = i.gy - c + 1,
      [u, y] = CHK_BOX[i.i % CHK_BOX.length],
      w = t.hit(i.hit),
      g = this.got && this.got.idx === i.i,
      k = g ? (a - this.got.t0) / 1e3 : 9,
      p = "got" === o && !(g && k < 0.55);
    if ("today" === o || (g && k < 0.7)) {
      const t = 0.5 + 0.5 * Math.sin(a / 260);
      ((l.fillStyle = `rgba(255,214,90,${(0.16 + 0.16 * t).toFixed(3)})`),
        l.fillRect(d - 6, f - 26, h + 12, c + 32),
        (l.fillStyle = `rgba(255,236,160,${(0.2 + 0.2 * t).toFixed(3)})`),
        l.fillRect(d - 3, f - 3, h + 6, c + 6));
    }
    if (
      (s &&
        ((l.fillStyle = "rgba(255,255,255,0.16)"), l.fillRect(i.hit.x, i.hit.y, i.hit.w, i.hit.h)),
      i.big)
    ) {
      const t = d + h + 2,
        e = f - 16;
      ((l.fillStyle = "#6B4A2A"), l.fillRect(t, e, 1, 16 + c - 1));
      const i = Math.round(Math.sin(a / 300));
      ((l.fillStyle = "#E8262B"),
        l.fillRect(t + 1, e, 7, 2),
        l.fillRect(t + 1, e + 2, 6 + i, 2),
        l.fillRect(t + 1, e + 4, 5, 1));
    }
    const F = g && k >= 0.45 && k < 0.6 ? Math.round(1.5 * Math.sin(90 * k)) : 0;
    (l.save(),
      l.translate(F, 0),
      (l.fillStyle = "rgba(30,50,90,0.25)"),
      l.fillRect(d + 1, i.gy, h, 2));
    const C = Math.round(2 * r),
      x = f,
      S = Math.round(4 * r);
    if (
      ((l.fillStyle = u),
      l.fillRect(d, f + S - 1, h, c - S + 1),
      (l.fillStyle = "rgba(0,0,0,0.18)"),
      l.fillRect(d, f + c - 2, h, 2),
      l.fillRect(d + h - 2, f + S, 2, c - S),
      (l.fillStyle = y),
      l.fillRect(d + Math.floor(h / 2) - 1, f + S - 1, C, c - S + 1),
      p && ((l.fillStyle = "rgba(255,240,180,0.55)"), l.fillRect(d + 1, f + S - 1, h - 2, 2)),
      l.save(),
      p && (l.translate(d + h + 1, i.gy + 1), l.rotate(-1.15), l.translate(-(d - 1), -x)),
      (l.fillStyle = u),
      l.fillRect(d - 1, x, h + 2, S),
      (l.fillStyle = "rgba(255,255,255,0.25)"),
      l.fillRect(d - 1, x, h + 2, 1),
      (l.fillStyle = y),
      l.fillRect(d + Math.floor(h / 2) - 1, x, C, S),
      !p)
    ) {
      const t = d + Math.floor(h / 2);
      (l.fillRect(t - 4, x - 2, 3, 2),
        l.fillRect(t + 1, x - 2, 3, 2),
        l.fillRect(t - 1, x - 1, 2, 1));
    }
    (l.restore(),
      "later" === o &&
        ((l.fillStyle = "rgba(16,28,60,0.28)"), l.fillRect(d - 1, f - 2, h + 2, c + 2)),
      l.restore());
    const M = g && k < 1.25,
      m = f - 25 - (i.big ? 2 : 0) + ("today" === o ? Math.round(1.5 * Math.sin(a / 300)) : 0);
    if (
      (n &&
        !M &&
        (l.save(),
        "later" === o && (l.globalAlpha = 0.45),
        Checkin.drawReward(t, n, i.x - 10, m, 20, !1),
        l.restore(),
        "got" === o &&
          (drawIcon(l, "check", i.x + 5, m + 13, 1, "#103010"),
          drawIcon(l, "check", i.x + 4, m + 12, 1, "#55FF55"))),
      "today" === o)
    ) {
      const t = m - 9 + Math.round(-3 * Math.abs(Math.sin(a / 220)));
      ((l.fillStyle = "#FFD24A"),
        l.fillRect(i.x - 3, t, 7, 1),
        l.fillRect(i.x - 2, t + 1, 5, 1),
        l.fillRect(i.x - 1, t + 2, 3, 1),
        l.fillRect(i.x, t + 3, 1, 1));
    }
    const b = e.step >= 44 ? "第" + (i.i + 1) + "天" : String(i.i + 1);
    (Font.center(
      l,
      b,
      i.x,
      i.gy + 4,
      "got" === o ? "#2E7D32" : "today" === o ? "#B5650A" : "#5B7397",
      !1,
    ),
      w &&
        ((l.strokeStyle = "rgba(255,255,255,0.7)"),
        (l.lineWidth = 1),
        l.strokeRect(i.hit.x + 0.5, i.hit.y + 0.5, i.hit.w - 1, i.hit.h - 1)));
  }
  drawPenguin(t, e, i, n, o) {
    const s = o ? 0.25 : 0.06 * Math.sin(3 * n),
      a = n % 3.3 < 0.12,
      l = 2 * CHK_PENGUIN.length;
    (t.save(),
      t.translate(Math.round(e), Math.round(i)),
      t.rotate(s),
      (t.fillStyle = "rgba(30,50,90,0.25)"),
      t.fillRect(-6, 0, 12, 2),
      CHK_PENGUIN.forEach((e, i) => {
        for (let n = 0; n < 8; n++) {
          let o = e[n];
          "." !== o &&
            (a && 2 === i && "W" === o && (o = "k"),
            (t.fillStyle = CHK_PAL[o]),
            t.fillRect(2 * n - 8, -l - 2 + 2 * i, 2, 2));
        }
      }));
    const r = o ? 0 : Math.floor(3 * n) % 2;
    ((t.fillStyle = CHK_PAL.o),
      t.fillRect(-6, -2 - (r ? 1 : 0), 4, 2),
      t.fillRect(2, -2 - (r ? 0 : 1), 4, 2),
      t.restore());
  }
  drawBar(t, e, i, n, o, s, a) {
    const l = t.ctx,
      r = e.bar,
      h = e.icon;
    ((l.fillStyle = "rgba(4,10,28,0.88)"),
      l.fillRect(r.x, r.y, r.w, r.h),
      (l.fillStyle = "rgba(190,225,255,0.35)"),
      l.fillRect(r.x, r.y, r.w, 1),
      (l.fillStyle = "#1B2A50"),
      l.fillRect(h.x, h.y, h.w, h.h),
      (l.strokeStyle = "rgba(190,225,255,0.5)"),
      (l.lineWidth = 1),
      l.strokeRect(h.x + 0.5, h.y + 0.5, h.w - 1, h.h - 1));
    const c = this.got ? this.got.id : i[n],
      d = this.got ? "got" : this.slotState(n, s),
      f = h.x + h.w + 8,
      u =
        Math.min(...this.widgets.filter((t) => t.y >= r.y).map((t) => t.x), r.x + r.w - 4) - 6 - f;
    !c ||
      (this.got && !this.got.landed) ||
      Checkin.drawReward(t, c, h.x + 4, h.y + 4, 28, "later" === d);
    const line = (t, e, i) => Font.draw(l, fitText(t, u), f, r.y + 10 + 13 * e, i),
      y = Checkin.count(s),
      w = Checkin.st && Checkin.st.event;
    if ("loading" === o) return void line("正在读取…", 0.5, "#A0A0A0");
    if ("error" === o) return void line(Checkin.err, 0.5, "#FF6060");
    if (this.got) {
      if (!this.got.landed) return;
      const t = Math.min(1, (a - this.got.t0 - 1250) / 300);
      return (
        l.save(),
        (l.globalAlpha = Math.max(0, t)),
        line("获得：" + Checkin.name(this.got.id), 0, "#FFD24A"),
        line(
          this.got.last
            ? `${y} 天全部签满！所有奖励都是你的了`
            : `已签 ${s ? s.days : 0}/${y} 天 · 明天再来`,
          1,
          "#C8D6F0",
        ),
        void l.restore()
      );
    }
    if (c) {
      const t = Font.draw(
        l,
        fitText(`第${n + 1}天 · ${Checkin.name(c)}`, u - 40),
        f,
        r.y + 10,
        "#FFFF55",
      );
      t + 6 + Font.width(Checkin.kindName(c)) <= f + u &&
        Font.draw(l, Checkin.kindName(c), t + 6, r.y + 10, "#7F93BF");
    }
    let g = "",
      k = "#C8D6F0";
    const p = s ? n + 1 - s.days : n + 1;
    ("ended" === o
      ? (g = s.logged && s.days ? `活动已结束 · 你领到了 ${s.days} 件装饰，永久保留` : "活动已结束")
      : "login" === o
        ? (g = "登录后签到，换设备也在")
        : "before" === o
          ? ((g = `${Checkin.day(w.start)} ${Checkin.time(w.start)} 开始 · 还有 ${Checkin.span(w.start - Checkin.now())}`),
            (k = "#FFD24A"))
          : "got" === d
            ? ((g = "已领取"), (k = "#55FF55"))
            : "today" === d
              ? ((g = "今天签到就能领"), (k = "#FFD24A"))
              : "all" === o
                ? ((g = "奖励已全部领取"), (k = "#55FF55"))
                : "today" === o && 1 === p
                  ? ((g = `明天就能领 · 还有 ${Checkin.span(Checkin.untilMidnight())}`),
                    (k = "#FFD24A"))
                  : (g = `再签 ${p} 天就能领`),
      line(g, 1, k),
      this.note &&
        a - this.noteT < 5e3 &&
        ((l.fillStyle = "rgba(0,0,0,0.8)"),
        l.fillRect(r.x, r.y - 13, r.w, 12),
        Font.center(
          l,
          fitText(this.note, r.w - 8),
          r.x + r.w / 2,
          r.y - 11,
          this.noteBad ? "#FF6060" : "#FFFFFF",
        )));
  }
  draw(t) {
    super.draw(t);
    const e = this.geo(),
      i = Checkin.st,
      n = t.ctx,
      o = this.widgets.find((t) => t.glow);
    if (o && !1 !== o.enabled) {
      const t = 0.5 + 0.5 * Math.sin(performance.now() / 260);
      ((n.strokeStyle = `rgba(255,230,140,${(0.35 + 0.45 * t).toFixed(2)})`),
        (n.lineWidth = 1),
        n.strokeRect(o.x - 1.5, o.y - 1.5, o.w + 3, o.h + 3));
    }
    this.got && this.drawClaim(t, e);
    const s = e.stops.find((e) => t.hit(e.hit));
    if (s && i && i.event.rewards[s.i]) {
      const e = i.event.rewards[s.i];
      t.tooltip(
        [
          { text: Checkin.name(e), color: "#FFFF55" },
          { text: Checkin.kindName(e) + " · 第" + (s.i + 1) + "天奖励", color: "#AAAAAA" },
        ],
        t.mouse.x,
        t.mouse.y,
      );
    }
  }
  drawClaim(t, e) {
    const i = t.ctx,
      n = this.got,
      o = (performance.now() - n.t0) / 1e3,
      s = e.stops[n.idx];
    if (!s) return;
    const a = e.icon,
      l = s.x,
      r = s.gy - (s.big ? 20 : 13);
    if (
      (o >= 0.45 &&
        !n.opened &&
        ((n.opened = !0),
        "undefined" != typeof Sound && Sound.ev && Sound.ev("entity.item.pickup", null, 0.8, 0.9)),
      o >= 1.25 &&
        !n.landed &&
        ((n.landed = !0),
        "undefined" != typeof Sound &&
          Sound.ev &&
          (Sound.ev("entity.player.levelup", null, 0.8, 1),
          n.last && Sound.ev("ui.toast.challenge_complete", null, 0.7, 1))),
      o >= 1.5 && !n.done && ((n.done = !0), this.layout()),
      o >= 0.55 && o < 0.9)
    ) {
      const t = (o - 0.55) / 0.35;
      ((i.fillStyle = `rgba(255,250,220,${(0.7 * (1 - t)).toFixed(2)})`),
        i.fillRect(l - 12 - 10 * t, r - 12 - 10 * t, 24 + 20 * t, 24 + 20 * t),
        (i.strokeStyle = `rgba(255,214,90,${(1 - t).toFixed(2)})`),
        (i.lineWidth = 2),
        i.beginPath(),
        i.arc(l, r, 6 + 26 * t, 0, 2 * Math.PI),
        i.stroke());
    }
    const burst = (t, e, n, o) => {
      (i.save(), (i.globalAlpha = Math.max(0, 1 - n / 0.8)));
      for (const s of o) {
        const o = s.v * n;
        ((i.fillStyle = s.c),
          i.fillRect(
            Math.round(t + Math.cos(s.a) * o),
            Math.round(e + Math.sin(s.a) * o + 30 * n * n),
            s.s,
            s.s,
          ));
      }
      i.restore();
    };
    if (
      (o >= 0.55 && o < 1.35 && burst(l, r, o - 0.55, n.sparks.slice(0, 18)), o >= 0.65 && o < 1.25)
    ) {
      const e = (o - 0.65) / 0.6,
        s = e * e * (3 - 2 * e),
        h = 1 - s,
        c = l,
        d = r - 18,
        f = a.x + a.w / 2,
        u = a.y + a.h / 2,
        y = h * h * c + 2 * h * s * ((c + f) / 2) + s * s * f,
        w = h * h * d + 2 * h * s * (Math.min(d, u) - 50) + s * s * u,
        g = Math.round(20 + 12 * s + 10 * Math.sin(e * Math.PI));
      (i.save(),
        (i.fillStyle = "rgba(255,220,90,0.35)"),
        i.fillRect(Math.round(y - g / 2 - 3), Math.round(w - g / 2 - 3), g + 6, g + 6),
        i.translate(Math.round(y), Math.round(w)),
        i.rotate(0.4 * Math.sin(e * Math.PI)),
        Checkin.drawReward(t, n.id, -Math.round(g / 2), -Math.round(g / 2), g, !1),
        i.restore());
    }
    o >= 1.25 && o < 2.05 && burst(a.x + a.w / 2, a.y + a.h / 2, o - 1.25, n.sparks.slice(18));
  }
}
(() => {
  const t = TitleScreen.prototype.layout;
  TitleScreen.prototype.layout = function () {
    t.call(this);
    const e = this.game;
    if (
      (Checkin.load(e),
      !Checkin.shown() || ("undefined" != typeof Live && !Live.on("title.checkin")))
    )
      return;
    const i = Checkin.titleRect(e.ui);
    this.widgets.push({
      ...i,
      label: "签到",
      checkin: !0,
      tip: ["开服签到：累计签 " + Checkin.count() + " 天，领原创装饰"],
      onClick: () => e.ui.open(new CheckinScreen(e, this)),
    });
  };
  const e = PauseScreen.prototype.layout;
  PauseScreen.prototype.layout = function () {
    e.call(this);
    const t = this.game;
    (Checkin.load(t),
      Checkin.shown() &&
        ("undefined" == typeof Live || Live.on("title.checkin")) &&
        this.widgets.push({
          x: 4,
          y: 4,
          w: 54,
          h: 16,
          label: "签到",
          checkin: !0,
          onClick: () => t.ui.open(new CheckinScreen(t, this)),
        }));
  };
  for (const t of [TitleScreen, PauseScreen]) {
    const e = t.prototype.draw;
    t.prototype.draw = function (t) {
      if ((e.call(this, t), !Checkin.dot())) return;
      const i = this.widgets.find((t) => t.checkin);
      i && Checkin.drawDot(t.ctx, i.x + i.w - 4, i.y - 2);
    };
  }
})();
//# sourceURL=js/checkin.js
