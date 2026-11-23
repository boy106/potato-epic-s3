"use strict";
function xhr(t, e, i) {
  return new Promise((s, n) => {
    const o = new XMLHttpRequest();
    (o.open(t, e),
      (o.timeout = 15e3),
      (o.onload = () =>
        s({ status: o.status, ok: o.status >= 200 && o.status < 300, text: o.responseText })),
      (o.onerror = () => n(new Error("XHR 出错"))),
      (o.ontimeout = () => n(new Error("XHR 超时"))),
      o.send(void 0 === i ? null : i));
  });
}
const Account = {
    token: "",
    data: null,
    offline: !1,
    gate: null,
    checking: !1,
    lastCheck: 0,
    codeShown: null,
    bili: void 0,
    load() {
      try {
        const t = JSON.parse(localStorage.getItem("mcjs-account") || "{}");
        ((this.token = t.token || ""),
          (this.data = t.account || null),
          (this.offline = !!t.offline),
          (this.bili = t.bili));
      } catch (t) {}
    },
    save() {
      try {
        localStorage.setItem(
          "mcjs-account",
          JSON.stringify({
            token: this.token,
            account: this.data,
            offline: this.offline,
            bili: this.bili,
          }),
        );
      } catch (t) {}
    },
    get loggedIn() {
      return !(!this.token || !this.data);
    },
    get name() {
      return this.data ? this.data.name : "";
    },
    device() {
      const t = navigator.userAgent;
      return (
        (/Android/.test(t)
          ? "Android"
          : /iPhone|iPad/.test(t)
            ? "iOS"
            : /Windows/.test(t)
              ? "Windows"
              : /Mac/.test(t)
                ? "Mac"
                : "其他") +
        " · " +
        (/BiliApp/i.test(t)
          ? "B站App"
          : /Edg\//.test(t)
            ? "Edge"
            : /Chrome/.test(t)
              ? "Chrome"
              : /Safari/.test(t)
                ? "Safari"
                : /Firefox/.test(t)
                  ? "Firefox"
                  : "浏览器")
      );
    },
    async api(t, e) {
      if (!RoomService.base()) throw new Error("还没有配置游戏服务器地址");
      let i;
      const s =
          e || this.token
            ? JSON.stringify(this.token ? { ...(e || {}), _t: this.token } : e)
            : void 0,
        n = RoomService.base() + t,
        o = s ? "POST" : "GET";
      try {
        const t = await fetch(n, { method: o, body: s });
        i = { status: t.status, ok: t.ok, text: await t.text() };
      } catch (e) {
        try {
          i = await xhr(o, n, s);
        } catch (i) {
          const s =
            `${(e && e.message) || e} / ${(i && i.message) || i}${!1 === navigator.onLine ? " / 离线" : ""}`.slice(
              0,
              80,
            );
          throw (
            "undefined" != typeof Telemetry &&
              Telemetry.event &&
              (Telemetry.event("net_fail", {
                path: t.replace(/\/w[a-z0-9]+/, "/w"),
                why: s,
                dev: this.device(),
              }),
              Telemetry.flush(!1)),
            new Error("游戏正在更新中…请稍后")
          );
        }
      }
      let a;
      try {
        a = JSON.parse(i.text);
      } catch (t) {
        a = { error: "游戏正在更新中…请稍后" };
      }
      if (
        (401 === i.status && this.token && ((this.token = ""), (this.data = null), this.save()),
        !i.ok || a.error)
      )
        throw Object.assign(new Error(a.error || "HTTP " + i.status), {
          status: i.status,
          body: a,
        });
      return a;
    },
    took(t) {
      return (
        t.token && (this.token = t.token),
        t.account && (this.data = t.account),
        (this.offline = !1),
        this.save(),
        this.applySettings(),
        t
      );
    },
    async loginBili() {
      let t;
      try {
        t = await Toy.profile();
      } catch (e) {
        if (
          ("undefined" != typeof Telemetry &&
            Telemetry.event &&
            Telemetry.event("toy_fail", {
              err: e && e.type,
              code: e && e.code,
              msg: String((e && e.message) || "").slice(0, 60),
              dev: this.device(),
            }),
          !(e instanceof ToyError && "not_logged_in" === e.type))
        )
          throw e;
        (await new Promise((t) => setTimeout(t, 1500)), (t = await Toy.profile()));
      }
      if (!t.toyOpenId) throw new Error("B站没有给出身份信息，请再试一次");
      const e = this.took(
        await this.api("/api/account/bili", {
          openId: t.toyOpenId,
          nickname: t.nickname,
          avatar: t.avatar,
          device: this.device(),
        }),
      );
      return (
        (this.bili = t.toyOpenId),
        this.save(),
        Telemetry.count && Telemetry.count("login_bili"),
        this.checkUnlocks(!0).catch(() => {}),
        e
      );
    },
    async loginCode(t) {
      const e = this.took(await this.api("/api/account/code", { code: t, device: this.device() }));
      return ((this.bili = ""), this.save(), Telemetry.count && Telemetry.count("login_code"), e);
    },
    async refresh() {
      if (!this.token) return null;
      try {
        this.took(await this.api("/api/account/me"));
      } catch (t) {}
      return this.data;
    },
    async update(t) {
      return (this.took(await this.api("/api/account/update", t)), this.data);
    },
    async logout() {
      try {
        await this.api("/api/account/logout", {});
      } catch (t) {}
      ((this.token = ""), (this.data = null), (this.bili = void 0), this.save());
    },
    async resetCode() {
      const t = await Toy.profile();
      return (await this.api("/api/account/reset-code", { openId: t.toyOpenId })).code;
    },
    async remove(t) {
      let e = "";
      try {
        e = (await Toy.profile()).toyOpenId;
      } catch (t) {}
      (await this.api("/api/account/delete", { openId: e, confirm: t }),
        (this.token = ""),
        (this.data = null),
        this.save());
    },
    chooseOffline() {
      ((this.offline = !0), this.save());
    },
    async loadGate(t) {
      if (this.gate && !t) return this.gate;
      try {
        const t = await this.api("/api/gate"),
          e = {};
        for (const [i, s] of Object.entries((t && t.jump) || {}))
          /^BV[0-9A-Za-z]{10}$/.test(i) && s > 0 && (e[i] = Math.min(100, +s));
        this.gate = Object.assign({}, t, {
          videos: (t.videos || []).filter((t) => /^BV[0-9A-Za-z]{10}$/.test(t)),
          aiVideos: [],
          jump: e,
        });
      } catch (t) {
        this.gate = this.gate || {
          follow: !0,
          triple: !0,
          videos: [],
          aiVideos: [],
          requireAccount: !0,
        };
      }
      return this.gate;
    },
    pickVideo() {
      const t = this.gate || {},
        e = t.videos || [];
      if (!e.length) return null;
      const i = t.jump || {},
        s = e.filter((t) => i[t] > 0),
        n = Math.min(
          100,
          s.reduce((t, e) => t + i[e], 0),
        ),
        o = e.length - s.length,
        a = o ? (100 - n) / o : 0,
        c = s.reduce((t, e) => t + i[e], 0) + a * o;
      let h = Math.random() * (c || 1),
        l = e[e.length - 1];
      for (const t of e)
        if (((h -= i[t] > 0 ? i[t] : a), h < 0)) {
          l = t;
          break;
        }
      return l;
    },
    get unlocks() {
      return (this.data && this.data.unlocks) || { follow: !1, triple: !1 };
    },
    tripleOk() {
      const t = this.gate;
      return this.loggedIn && (this.unlocks.triple || (!!t && !t.triple && this.unlocks.follow));
    },
    has(t) {
      if (!this.loggedIn) return !1;
      const e = this.unlocks,
        i = this.gate || {};
      return (
        !(("anim" !== t && "static" !== t && "skin" !== t) || !this.data || !this.data.super) ||
        ("anim" === t
          ? !!e.follow
          : "static" === t || "skin" === t
            ? this.tripleOk()
            : "online" === t
              ? (!i.follow || e.follow) && (!i.triple || e.triple)
              : "jing" === t && ((this.data && this.data.super) || (!!e.follow && this.tripleOk())))
      );
    },
    allUnlocked() {
      return this.has("anim") && this.has("static") && this.has("online");
    },
    async checkUnlocks(t) {
      if (!this.loggedIn || this.checking) return null;
      this.checking = !0;
      try {
        const e = await this.loadGate();
        if (Toy.phoneWeb || !(await Toy.ready())) return { inToy: !1 };
        const i = {
          follow: this.unlocks.follow,
          stat: this.has("static"),
          online: this.has("online"),
          jing: this.has("jing"),
        };
        let s = null,
          n = null,
          o = null;
        try {
          s = await Toy.following();
        } catch (t) {
          o = t;
        }
        if (e.videos && e.videos.length) {
          let t = null;
          try {
            const t = await Toy.triple(e.videos);
            ((n = t ? t.all : null), (this.tripleParts = t));
          } catch (e) {
            ((t = e), (o = o || e), (this.tripleParts = null));
          }
          if (null === n && "undefined" != typeof Telemetry && Telemetry.event) {
            let e = "";
            try {
              e = JSON.stringify({
                d: void 0 === Toy.last.videoActions ? null : Toy.last.videoActions,
                how: Toy.last.videoActionsHow,
                errs: Toy.last.videoActionsErrs,
              }).slice(0, 600);
            } catch (t) {}
            (Telemetry.event("triple_check", {
              err: t && t.type,
              code: t && t.code,
              msg: String((t && t.message) || "").slice(0, 120),
              raw: e,
              dev: this.device(),
            }),
              Telemetry.flush(!1));
          }
        }
        let a = n;
        this.lastCheck = Date.now();
        const c = await this.ownBili();
        c || (!0 !== s && (s = null), !0 !== n && (n = null), !0 !== a && (a = null));
        const h = !0 === n && this.tripleParts ? this.tripleParts.video : null;
        (null === s && null === n && null === a) ||
          this.took(
            await this.api("/api/account/unlocks", {
              follow: s,
              triple: n,
              ai: a,
              videos: e.videos || [],
              tv: h,
              any: !0,
            }),
          );
        const l = [];
        (!i.stat && this.has("static") && l.push("triple"),
          !i.follow && this.unlocks.follow && l.push("follow"),
          !i.online && this.has("online") && l.push("online"),
          !i.jing && this.has("jing") && l.push("jing"),
          l.length && !t && "undefined" != typeof game && unlockCelebrate(game, l));
        const r =
            (i.follow && !this.unlocks.follow) ||
            (i.stat && !this.has("static")) ||
            (i.online && !this.has("online")),
          u = i.stat && !this.has("static");
        return (
          r &&
            "undefined" != typeof game &&
            (game.net && game.net.sendLook && game.net.sendLook(),
            game.ui &&
              game.ui.toast &&
              game.ui.toast(
                "解锁已收回",
                u ? "三连换成了新视频：给新视频三连就能恢复" : "重新关注/三连就能恢复",
              )),
          { inToy: !0, follow: s, triple: n, got: l, lost: r, error: o, own: c }
        );
      } finally {
        this.checking = !1;
      }
    },
    async ownBili() {
      let t = null;
      try {
        t = await Toy.profile();
      } catch (t) {
        return !1;
      }
      return (
        !(!t || !t.toyOpenId) &&
        (void 0 === this.bili &&
          this.data &&
          this.data.nick &&
          t.nickname === this.data.nick &&
          ((this.bili = t.toyOpenId), this.save()),
        !!this.bili && t.toyOpenId === this.bili)
      );
    },
    applySettings() {
      const t = this.data && this.data.settings;
      if (t && "undefined" != typeof game && game.settings && this.appliedFor !== this.data.id) {
        this.appliedFor = this.data.id;
        for (const e of ACCOUNT_SETTINGS) void 0 !== t[e] && (game.settings[e] = t[e]);
        game.saveSettings();
      }
    },
    settingsChanged() {
      this.loggedIn &&
        "undefined" != typeof game &&
        (clearTimeout(this.setT),
        (this.setT = setTimeout(() => {
          const t = {};
          for (const e of ACCOUNT_SETTINGS)
            void 0 !== game.settings[e] && (t[e] = game.settings[e]);
          this.update({ settings: t }).catch(() => {});
        }, 4e3)));
    },
  },
  ACCOUNT_SETTINGS = [
    "fov",
    "sens",
    "volume",
    "gamma",
    "bobbing",
    "advTooltips",
    "keys",
    "autoJump",
    "invertY",
    "subtitles",
    "chatOpacity",
    "tutorialOff",
    "minimap",
    "deathMarker",
    "recipeHints",
    "vibrate",
    "quickChat",
  ];
function drawCard(t, e, i, s, n, o) {
  ((t.fillStyle = "rgba(0,0,0,0.55)"),
    t.fillRect(e, i, s, n),
    (t.strokeStyle = o ? "#E8B830" : "#555555"),
    (t.lineWidth = 1),
    t.strokeRect(e + 0.5, i + 0.5, s - 1, n - 1),
    o && ((t.fillStyle = "rgba(232,184,48,0.10)"), t.fillRect(e + 1, i + 1, s - 2, n - 2)));
}
(Account.load(),
  setTimeout(() => {
    if (!Account.loggedIn) return;
    let t = null;
    try {
      ((t = JSON.parse(localStorage.getItem("mcjs-nav") || "null")),
        localStorage.removeItem("mcjs-nav"));
    } catch (t) {}
    const e = !!(t && Date.now() - t.t < 9e5);
    e && "undefined" != typeof Telemetry && Telemetry.count && Telemetry.count("nav_reopen");
    const go = (t) => {
      Account.checking && t < 6
        ? setTimeout(() => go(t + 1), 2e3)
        : Account.checkUnlocks(!1).catch(() => {});
    };
    e ? go(0) : Date.now() - Account.lastCheck > 5e3 && Account.checkUnlocks(!0).catch(() => {});
  }, 3e3),
  (() => {
    const t = RoomService.key.bind(RoomService);
    RoomService.key = () => (Account.loggedIn && Account.data.roomKey ? Account.data.roomKey : t());
    const e = RoomService.api.bind(RoomService);
    RoomService.api = async function (t, i) {
      if (!Account.token || !i) return e(t, i);
      let s;
      try {
        s = await fetch(this.base() + t, {
          method: "POST",
          body: JSON.stringify({ ...i, _t: Account.token }),
        });
      } catch (t) {
        throw new Error("游戏正在更新中…请稍后");
      }
      const n = await s.json().catch(() => ({ error: "游戏正在更新中…请稍后" }));
      if (!s.ok || (n && n.error))
        throw Object.assign(new Error((n && n.error) || "HTTP " + s.status), {
          gate: !(!n || !n.gate),
        });
      return n;
    };
    const i = Game.prototype.saveSettings;
    Game.prototype.saveSettings = function () {
      (i.call(this), Account.settingsChanged());
    };
  })());
const ICON_PIX = {
  like: [
    "..##....",
    "..##....",
    ".###....",
    "########",
    "#.######",
    "#.######",
    "#.#####.",
    "#.####..",
  ],
  coin: [
    "..####..",
    ".#....#.",
    "#..##..#",
    "#.#..#.#",
    "#.#..#.#",
    "#..##..#",
    ".#....#.",
    "..####..",
  ],
  star: [
    "...##...",
    "...##...",
    "########",
    ".######.",
    "..####..",
    ".##..##.",
    ".#....#.",
    "........",
  ],
  follow: [
    ".##..##.",
    "########",
    "########",
    "########",
    ".######.",
    "..####..",
    "...##...",
    "........",
  ],
  check: [
    ".......#",
    "......##",
    ".....##.",
    "#...##..",
    "##.##...",
    ".###....",
    "..#.....",
    "........",
  ],
  lock: [
    "..####..",
    ".#....#.",
    ".#....#.",
    "########",
    "###..###",
    "###..###",
    "########",
    "########",
  ],
};
function drawIcon(t, e, i, s, n, o) {
  const a = ICON_PIX[e];
  if (a) {
    t.fillStyle = o;
    for (let e = 0; e < 8; e++)
      for (let o = 0; o < 8; o++) "#" === a[e][o] && t.fillRect(i + o * n, s + e * n, n, n);
  }
}
function unlockCelebrate(t, e) {
  if (self.POTATO && self.Potato && self.Potato.allDone) {
    const i = self.Potato.allDone(),
      s = i
        ? "全部解锁：特效枪皮 · 刀 · 披风 · 天梯排位"
        : e.includes("follow")
          ? "已关注 ✓ 再给新视频三连就全部解锁"
          : "已三连 ✓ 再关注 UP 主就全部解锁";
    return (
      Sound.ev && Sound.ev("entity.player.levelup", null, 0.8, 1),
      t.ui.message && t.ui.message(s + (i ? "！" : ""), "#FFD24A"),
      void UnlockSparks.start(e, s)
    );
  }
  const i = {
    triple: "静态披风和自定义皮肤",
    follow: "动态披风",
    online: "联机",
    jing: "AI 伙伴" + (("undefined" != typeof Companion && Companion.name) || "鲸鲸"),
  };
  (Sound.ev && Sound.ev("entity.player.levelup", null, 0.8, 1),
    t.ui.message && t.ui.message("解锁了：" + e.map((t) => i[t]).join("、") + "！", "#FFD24A"),
    UnlockSparks.start(e));
}
const UnlockSparks = {
  t0: 0,
  list: [],
  text: "",
  start(t, e) {
    ((this.t0 = performance.now()),
      (this.list = []),
      (this.text =
        e ||
        "解锁：" +
          t
            .map(
              (t) =>
                ({
                  triple: "静态披风 + 自定义皮肤",
                  follow: "动态披风",
                  online: "联机",
                  jing: "鲸鲸",
                })[t],
            )
            .join(" · ")));
    for (let t = 0; t < 60; t++)
      this.list.push({
        a: Math.random() * Math.PI * 2,
        v: 40 + 90 * Math.random(),
        c: ["#FFD24A", "#FFF2B0", "#FB7299", "#7FD8FF"][t % 4],
      });
  },
  draw(t) {
    const e = (performance.now() - this.t0) / 1e3;
    if (!this.t0 || e > 2.6) return;
    const i = t.ctx,
      s = t.w / 2,
      n = t.h / 2 - 20,
      o = Math.min(1, 4 * e) * Math.min(1, 2 * (2.6 - e));
    (i.save(), (i.globalAlpha = o));
    for (const t of this.list) {
      const o = t.v * e,
        a = n + Math.sin(t.a) * o + 30 * e * e;
      ((i.fillStyle = t.c), i.fillRect(Math.round(s + Math.cos(t.a) * o), Math.round(a), 2, 2));
    }
    const a = Font.width(this.text) + 24;
    ((i.fillStyle = "rgba(40,28,0,0.85)"),
      i.fillRect(s - a / 2, n - 12, a, 22),
      (i.strokeStyle = "#E8B830"),
      i.strokeRect(s - a / 2 + 0.5, n - 11.5, a - 1, 21),
      Font.center(i, this.text, s, n - 4, "#FFD24A"),
      i.restore());
  },
};
class LoginScreen extends MenuScreen {
  constructor(t, e, i) {
    (super(t, "登录"),
      (this.next = e),
      (this.offline = i),
      (this.pauses = !1),
      (this.titleY = 22),
      (this.note = ""),
      (this.noteColor = "#A0A0A0"),
      (this.busy = !1),
      (this.inToy = null),
      Toy.ready().then((t) => {
        ((this.inToy = t), this.game.ui.screen === this && this.layout());
      }),
      (this.mobileOutside =
        /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) &&
        !/BiliApp/i.test(navigator.userAgent)));
  }
  say(t, e) {
    ((this.note = t), (this.noteColor = e ? "#FF6060" : "#A0A0A0"));
  }
  done() {
    const t = this.next;
    ((this.next = null), t ? t() : this.game.ui.open(new TitleScreen(this.game)));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      i = Math.max(70, Math.floor(t.h / 2 - 40)),
      s = !1 !== this.inToy;
    ((this.widgets = []),
      s &&
        this.widgets.push({
          x: e - 110,
          y: i,
          w: 220,
          h: 24,
          gold: !0,
          label: () =>
            this.busy ? "正在登录…" : null === this.inToy ? "正在连接 B站…" : "B站一键登录（推荐）",
          enabled: !this.busy && !0 === this.inToy,
          onClick: () => this.bili(),
        }),
      this.widgets.push(
        {
          x: e - 110,
          y: i + (s ? 30 : 0),
          w: 220,
          h: 20,
          label: "用识别码登录",
          enabled: !this.busy,
          tip: ["第一次用 B站登录时会给你一个识别码", "在别的设备、别的浏览器里用它登录同一个账号"],
          onClick: () => this.game.ui.open(new CodeLoginScreen(this.game, this)),
        },
        {
          x: e - 60,
          y: i + (s ? 62 : 32),
          w: 120,
          h: 16,
          label: "离线游玩",
          enabled: !this.busy,
          tip: ["只能玩单人游戏，存档只在这台设备上", "之后随时可以在 选项 → 账号 里登录"],
          onClick: () => {
            (Account.chooseOffline(),
              this.offline ? ((this.next = null), this.offline()) : this.done());
          },
        },
      ));
  }
  async bili() {
    ((this.busy = !0), this.say("正在向 B站 请求授权…"), this.layout());
    try {
      const t = await Account.loginBili();
      if (t.code)
        return void this.game.ui.open(new CodeShowScreen(this.game, t.code, () => this.done(), !0));
      (this.done(),
        this.game.ui.message && this.game.ui.message("欢迎回来，" + Account.name, "#55FF55"));
    } catch (t) {
      ((this.busy = !1),
        this.say(t instanceof ToyError ? Toy.explain(t) : t.message, !0),
        this.layout(),
        t instanceof ToyError &&
          "undefined" != typeof Telemetry &&
          Telemetry.flush &&
          Telemetry.flush(!1));
    }
  }
  drawExtra(t) {
    const e = t.ctx,
      i = t.w / 2,
      s = Math.max(70, Math.floor(t.h / 2 - 40));
    ((self.POTATO
      ? ["登录后可以：天梯排位、赚土豆币升级枪皮、换披风", "账号和进度换设备也在"]
      : ["登录后可以：和朋友联机、存档同步到云端、换皮肤和披风", "账号和存档换设备也在"]
    ).forEach((n, o) =>
      Font.center(e, fitText(n, t.w - 8), i, s - 34 + 11 * o, o ? "#A0A0A0" : "#FFFFFF"),
    ),
      !1 === this.inToy &&
        Font.center(
          e,
          fitText(
            this.mobileOutside
              ? "手机浏览器里不能用 B站登录：可以用识别码，或者在 B站 App 里打开"
              : "不在 B站 Toy 页面里：可以用识别码登录",
            t.w - 8,
          ),
          i,
          s - 12,
          "#FFD24A",
        ),
      this.note && Font.center(e, fitText(this.note, t.w - 8), i, s + 96, this.noteColor),
      "undefined" != typeof GAME_BUILD &&
        Font.center(e, "版本 " + GAME_BUILD, i, t.h - 12, "#707070"));
  }
  onEsc() {}
}
class CodeShowScreen extends MenuScreen {
  constructor(t, e, i, s) {
    (super(t, s ? "这是你的个人识别码" : "新的个人识别码"),
      (this.code = e),
      (this.next = i),
      (this.pauses = !1),
      (this.t0 = performance.now()),
      (this.copied = null));
  }
  base() {
    return Math.max(0, Math.floor((this.game.ui.h - 150) / 2));
  }
  layout() {
    const t = this.game.ui.w / 2,
      e = this.base() + 110;
    ((this.titleY = this.base() + 10),
      (this.widgets = [
        {
          x: t - 110,
          y: e,
          w: 108,
          h: 20,
          label: () =>
            this.copied ? "已复制" : !1 === this.copied ? "复制不了，请抄下来" : "复制识别码",
          onClick: async () => {
            this.copied = await copyText(this.code);
          },
        },
        {
          x: t + 2,
          y: e,
          w: 108,
          h: 20,
          label: () => {
            const t = Math.ceil(3 - (performance.now() - this.t0) / 1e3);
            return t > 0 ? `我记下了（${t}）` : "我记下了";
          },
          enabled: !0,
          onClick: () => {
            if (performance.now() - this.t0 < 3e3) return;
            const t = this.next;
            ((this.next = null), t && t());
          },
        },
      ]));
  }
  drawExtra(t) {
    const e = t.ctx,
      i = t.w / 2,
      s = this.base() + 76,
      n = 2 * Font.width(this.code) + 24;
    (drawCard(e, Math.floor(i - n / 2), s - 8, n, 30, !0),
      e.save(),
      e.translate(i, s),
      e.scale(2, 2),
      Font.center(e, this.code, 0, 0, "#FFD24A"),
      e.restore());
    [
      ["只显示这一次，请抄下来或复制保存", "#FFFFFF"],
      ["用它可以在任何设备上登录你的账号：请保密，别发给别人", "#FF8080"],
      ["忘了可以在 B站 里登录后，到 选项 → 账号 重新生成", "#A0A0A0"],
    ].forEach(([s, n], o) => Font.center(e, fitText(s, t.w - 8), i, this.base() + 26 + 11 * o, n));
  }
  onEsc() {}
}
class CodeLoginScreen extends FormScreen {
  constructor(t, e) {
    (super(t, "用识别码登录", e), (this.code = ""), (this.busy = !1));
  }
  layout() {
    const t = this.game.ui.w / 2;
    ((this.fields = {}),
      this.addField("code", t - 110, 80, 220, "个人识别码（XXXX-XXXX-XXXX-XXXX）", 19, (t) =>
        t
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 16)
          .replace(/(.{4})(?=.)/g, "$1-"),
      ),
      (this.widgets = [
        {
          x: t - 110,
          y: 110,
          w: 108,
          h: 20,
          label: () => (this.busy ? "正在登录…" : "登录"),
          enabled: !this.busy,
          onClick: () => this.submit(),
        },
        { x: t + 2, y: 110, w: 108, h: 20, label: "返回", onClick: () => this.back() },
      ]),
      this.focus("code"));
  }
  async submit() {
    if (!this.busy)
      if (16 === this.code.replace(/-/g, "").length) {
        ((this.busy = !0), this.say("正在登录…"), this.layout());
        try {
          (await Account.loginCode(this.code),
            this.game.ui.hideInput(),
            this.game.ui.message && this.game.ui.message("已登录：" + Account.name, "#55FF55"));
          const t = this.parent;
          t instanceof LoginScreen
            ? t.done()
            : this.game.ui.open(
                new AccountScreen(
                  this.game,
                  new OptionsScreen(this.game, new TitleScreen(this.game)),
                ),
              );
        } catch (t) {
          ((this.busy = !1), this.say(t.message, !0), this.layout());
        }
      } else this.say("识别码是 16 位（4 组，每组 4 位）", !0);
  }
  drawExtra(t) {
    (this.drawFields(t),
      Font.center(
        t.ctx,
        fitText("第一次用 B站登录时，游戏给过你识别码", t.w - 8),
        t.w / 2,
        140,
        "#808080",
      ));
  }
}
class AccountScreen extends FormScreen {
  constructor(t, e) {
    (super(t, "账号", e),
      (this.newName = Account.name),
      (this.confirm = null),
      Account.refresh().then(() => {
        ((this.newName = Account.name), this.game.ui.screen === this && this.layout());
      }),
      Account.loadGate());
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      i = this.game;
    if (((this.fields = {}), (this.widgets = []), !Account.loggedIn))
      return void this.widgets.push(
        {
          x: e - 100,
          y: 60,
          w: 200,
          h: 24,
          gold: !0,
          label: "登录",
          onClick: () =>
            i.ui.open(new LoginScreen(i, () => i.ui.open(new AccountScreen(i, this.parent)))),
        },
        { x: e - 100, y: t.h - 30, w: 200, h: 20, label: "完成", onClick: () => this.back() },
      );
    const s = "del" === this.confirm;
    this.widgets.push(
      ...(self.POTATO && self.Potato && self.Potato.allDone && self.PotatoGet
        ? [
            {
              x: e + 58,
              y: 52,
              w: 92,
              h: 20,
              gold: !self.Potato.allDone(),
              label: () => (self.Potato.allDone() ? "已全部解锁" : "去解锁…"),
              onClick: () =>
                i.ui.open(new self.PotatoGet(i, this, { need: self.Potato.needFor("any") })),
            },
          ]
        : [
            {
              x: e + 58,
              y: 52,
              w: 92,
              h: 20,
              gold: !Account.allUnlocked(),
              label: Account.allUnlocked() ? "已全部解锁" : "解锁…",
              onClick: () => i.ui.open(new UnlockScreen(i, this)),
            },
          ]),
      {
        x: e - 150,
        y: 112,
        w: 148,
        h: 20,
        label: "重新生成识别码",
        tip: ["旧的识别码马上失效", "要在 B站 里登录同一个账号才能用"],
        onClick: () => this.reset(),
      },
      {
        x: e + 2,
        y: 112,
        w: 148,
        h: 20,
        label: "皮肤和装饰…",
        gold: !0,
        onClick: () => i.ui.open(new WardrobeScreen(i, this)),
      },
      {
        x: e - 150,
        y: 136,
        w: 148,
        h: 20,
        label: "退出登录",
        onClick: async () => {
          (await Account.logout(), this.say("已退出登录"), this.layout());
        },
      },
      {
        x: e + 2,
        y: 136,
        w: 148,
        h: 20,
        label: s ? "再点一次：永久删除" : "删除账号",
        color: s ? "#FF6060" : void 0,
        tip: ["删除账号、云存档、解锁记录，不能恢复", "这台设备上的存档不受影响"],
        onClick: () => this.del(),
      },
      ...(Companion.shown
        ? [
            {
              x: e - 150,
              y: 184,
              w: 300,
              h: 20,
              label: "AI 伙伴…",
              tip: ["会聊天、懂你在游戏里做什么的 AI 小伙伴（全服免费，每天有次数）"],
              onClick: () => i.ui.open(new CompanionScreen(i, this)),
            },
          ]
        : []),
      {
        x: e - 150,
        y: 160,
        w: 148,
        h: 20,
        label: "诊断",
        tip: ["显示 B站 返回的原始数据（排查问题用）"],
        onClick: () => i.ui.open(new ToyDiagScreen(i, this)),
      },
      ...(Account.data.super
        ? [
            {
              x: e + 2,
              y: 160,
              w: 148,
              h: 20,
              gold: !0,
              label: "管理员…",
              tip: ["临时昵称、全服公告、昵称颜色、管理员披风"],
              onClick: () => i.ui.open(new AdminScreen(i, this)),
            },
          ]
        : []),
      { x: e - 100, y: t.h - 30, w: 200, h: 20, label: "完成", onClick: () => this.back() },
    );
  }
  async reset() {
    try {
      const t = await Account.resetCode();
      (this.game.ui.hideInput(),
        this.game.ui.open(new CodeShowScreen(this.game, t, () => this.game.ui.open(this), !1)));
    } catch (t) {
      this.say(t instanceof ToyError ? Toy.explain(t) : t.message, !0);
    }
  }
  async del() {
    if ("del" !== this.confirm) return ((this.confirm = "del"), void this.layout());
    try {
      (await Account.remove(Account.name), this.say("账号已删除"));
    } catch (t) {
      this.say(t.message, !0);
    }
    ((this.confirm = null), this.layout());
  }
  drawExtra(t) {
    const e = t.ctx,
      i = t.w / 2;
    if (!Account.loggedIn)
      return void Font.center(
        e,
        Account.offline ? "现在是离线游玩：只能玩单人游戏" : "还没有登录",
        i,
        40,
        "#A0A0A0",
      );
    this.drawFields(t);
    const s = Account.data,
      n = Account.unlocks;
    (Font.draw(e, "游戏名：" + Account.name, i - 150, 52, "#FFFFFF"),
      Font.draw(e, "就是 B站名，B站改名后会跟着变", i - 150, 64, "#808080"),
      Font.draw(
        e,
        `B站：${s.nick || "（识别码登录）"}　　注册于 ${new Date(s.created).toLocaleDateString()}`,
        i - 150,
        80,
        "#A0A0A0",
      ));
    const st = (t, e) => (t ? "✓ " : "✗ ") + e;
    if (self.POTATO && self.Potato && self.Potato.allDone) {
      const t = self.Potato.allDone(),
        o = "both" === self.Potato.needFor("any"),
        a = [
          st(!(!n.follow && !s.super), "关注 UP 主"),
          ...(o ? [st(!(!n.triple && !s.super), "三连新视频")] : []),
          t ? "全部功能已解锁" : "完成后解锁全部功能",
        ].join("　");
      Font.draw(e, fitText(a, 300), i - 150, 94, t ? "#7CFFB2" : "#E0E0E0");
    } else
      Font.draw(
        e,
        [
          st(Account.tripleOk(), "三连"),
          st(n.follow, "关注"),
          st(Account.has("online"), "联机"),
        ].join("　"),
        i - 150,
        94,
        "#E0E0E0",
      );
  }
}
const ADMIN_COLORS = [
  "",
  "#FFAA00",
  "#FFFF55",
  "#55FF55",
  "#55FFFF",
  "#5555FF",
  "#FF55FF",
  "#FF5555",
  "#AA00AA",
  "#00AAAA",
  "#AAAAAA",
  "#E8B830",
  "#FF7EB6",
  "#7FD4FF",
];
class FrozenScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, "冻结名单"),
      (this.parent = e),
      (this.pauses = !1),
      (this.titleY = 12),
      (this.list = null),
      (this.page = 0),
      (this.note = ""),
      (this.noteColor = "#80FF80"),
      this.load());
  }
  async load() {
    try {
      const t = await Account.api("/api/account/admin/frozen", {});
      ((this.list = t.list || []), (this.hours = t.hours));
    } catch (t) {
      ((this.list = []), this.say(t.message, !0));
    }
    this.game.ui.screen === this && this.layout();
  }
  say(t, e) {
    ((this.note = t), (this.noteColor = e ? "#FF6060" : "#80FF80"));
  }
  rows() {
    return Math.max(2, Math.floor((this.game.ui.h - 90) / 30));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      i = this.list || [],
      s = this.rows(),
      n = Math.max(1, Math.ceil(i.length / s));
    ((this.page = clamp(this.page, 0, n - 1)),
      (this.widgets = i
        .slice(this.page * s, this.page * s + s)
        .map((t, i) => ({
          x: e + 116,
          y: 34 + 30 * i,
          w: 44,
          h: 18,
          label: "解冻",
          onClick: () => this.unfreeze(t),
        }))),
      n > 1 &&
        this.widgets.push(
          {
            x: e - 160,
            y: t.h - 30,
            w: 50,
            h: 20,
            label: "<",
            enabled: this.page > 0,
            onClick: () => {
              (this.page--, this.layout());
            },
          },
          {
            x: e + 110,
            y: t.h - 30,
            w: 50,
            h: 20,
            label: ">",
            enabled: this.page < n - 1,
            onClick: () => {
              (this.page++, this.layout());
            },
          },
        ),
      this.widgets.push({
        x: e - 100,
        y: t.h - 30,
        w: 200,
        h: 20,
        label: "完成",
        onClick: () => this.game.ui.open(this.parent),
      }),
      this.widgets.push({
        x: e + 96,
        y: 6,
        w: 64,
        h: 18,
        label: "封禁玩家…",
        gold: !0,
        tip: ["按游戏名全服封禁一个玩家（不在线也可以）"],
        onClick: () => this.game.ui.open(new BanNameScreen(this.game, this)),
      }));
  }
  async unfreeze(t) {
    try {
      const e = await Account.api("/api/account/admin/unfreeze", { id: t.id });
      ((this.list = e.list || []), this.say("已解冻 " + t.name + "（账号和 IP 都放开了）"));
    } catch (t) {
      this.say(t.message, !0);
    }
    this.layout();
  }
  drawExtra(t) {
    const e = t.ctx,
      i = t.w / 2,
      s = this.list,
      n = this.rows();
    if (!s) return void Font.center(e, "正在读取…", i, 60, "#A0A0A0");
    s.length || Font.center(e, "没有被冻结的账号", i, 60, "#A0A0A0");
    (s.slice(this.page * n, this.page * n + n).forEach((t, s) => {
      const n = 34 + 30 * s;
      ((e.fillStyle = "rgba(0,0,0,0.35)"),
        e.fillRect(i - 160, n - 2, 320, 28),
        Font.draw(e, fitText(t.name || t.id, 140), i - 157, n + 1, "#FFFFFF"),
        Font.draw(
          e,
          fitText(
            `${((t) => {
              const e = new Date(t);
              return `${e.getMonth() + 1}-${e.getDate()} ${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}`;
            })(t.at)} · ${t.why}${t.banned ? " · IP 封禁中" : ""}`,
            270,
          ),
          i - 157,
          n + 12,
          "#A0A0A0",
        ),
        t.text && Font.draw(e, fitText("原话：" + t.text, 270), i - 157, n + 21, "#FF8080"));
    }),
      this.note && Font.center(e, fitText(this.note, t.w - 8), i, t.h - 42, this.noteColor));
  }
  onEsc() {
    this.game.ui.open(this.parent);
  }
}
class BanNameScreen extends FormScreen {
  constructor(t, e) {
    (super(t, "全服封禁玩家", e),
      (this.who = ""),
      (this.why = ""),
      (this.busy = !1),
      (this.sure = !1));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2;
    ((this.fields = {}),
      this.addField(
        "who",
        e - 100,
        60,
        200,
        "玩家的游戏名（和游戏里显示的一样）",
        32,
        (t) => ((this.sure = !1), t.replace(/[\s"'\\§]/g, "").slice(0, 32)),
      ),
      this.addField("why", e - 100, 104, 200, "原因（可以不写，只有管理员看得到）", 60, (t) =>
        t.slice(0, 60),
      ),
      (this.widgets = [
        {
          x: e - 100,
          y: 134,
          w: 200,
          h: 20,
          gold: !0,
          label: () => (this.busy ? "…" : this.sure ? "确定封禁「" + this.who + "」？" : "封禁"),
          enabled: !this.busy,
          onClick: () => this.submit(),
        },
        { x: e - 100, y: t.h - 30, w: 200, h: 20, label: "返回", onClick: () => this.back() },
      ]));
  }
  async submit() {
    const t = this.who.trim();
    if (!t) return (this.say("先写玩家的游戏名", !0), void this.focus("who"));
    if (!this.sure)
      return (
        (this.sure = !0),
        this.say("账号会被冻结、请出所有房间，再点一次确定", !1),
        void this.layout()
      );
    ((this.sure = !1), (this.busy = !0), this.game.ui.hideInput(), this.layout());
    try {
      const e = await Account.api("/api/account/admin/freeze", { name: t, why: this.why.trim() });
      (this.say(
        `已封禁 ${e.name}：账号冻结${e.ip ? `，IP 封禁 ${e.hours} 小时` : "（现在不在线，没有封 IP）"}`,
      ),
        (this.who = ""),
        (this.why = ""));
    } catch (t) {
      this.say(t.message, !0);
    }
    ((this.busy = !1), this.layout());
  }
  drawExtra(t) {
    this.drawFields(t);
  }
  back() {
    (this.game.ui.hideInput(),
      this.parent && this.parent.load && this.parent.load(),
      this.game.ui.open(this.parent));
  }
}
class AdminScreen extends FormScreen {
  constructor(t, e) {
    (super(t, "管理员", e),
      (this.nick = Account.data.tempNick || ""),
      (this.notice = ""),
      (this.busy = null));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      i = this.game;
    ((this.fields = {}),
      (this.widgets = []),
      this.addField(
        "nick",
        e - 150,
        52,
        196,
        "临时昵称（联机时用这个名字；留空：用 B站名）",
        16,
        (t) => t.replace(/[\s"'\\§]/g, "").slice(0, 16),
      ),
      this.widgets.push({
        x: e + 50,
        y: 52,
        w: 48,
        h: 20,
        gold: !0,
        label: () => ("nick" === this.busy ? "…" : "使用"),
        enabled: !this.busy,
        onClick: () => this.setNick(this.nick),
      }),
      this.widgets.push({
        x: e + 102,
        y: 52,
        w: 48,
        h: 20,
        label: "清除",
        enabled: !this.busy && !!Account.data.tempNick,
        onClick: () => this.setNick(""),
      }),
      this.addField(
        "notice",
        e - 150,
        96,
        248,
        "全服公告（单人和联机的所有人都会在聊天框看到）",
        100,
        (t) => t.slice(0, 100),
      ),
      this.widgets.push({
        x: e + 102,
        y: 96,
        w: 48,
        h: 20,
        gold: !0,
        label: () => ("notice" === this.busy ? "…" : "发布"),
        enabled: !this.busy,
        onClick: () => this.announce(),
      }),
      (this.swatches = ADMIN_COLORS.map((t, i) => ({
        x: e - 150 + 21 * i,
        y: 136,
        w: 19,
        h: 19,
        label: "",
        col: t,
        tip: [t ? "昵称颜色 " + t : "不用颜色（白色）"],
        enabled: !this.busy,
        onClick: () => this.setColor(t),
      }))),
      this.widgets.push(...this.swatches),
      this.widgets.push({
        x: e - 150,
        y: 166,
        w: 300,
        h: 20,
        gold: !0,
        label: "管理员披风（动态）…",
        tip: ["在 皮肤和装饰 里选「管理员」"],
        onClick: () => i.ui.open(new WardrobeScreen(i, this)),
      }),
      this.widgets.push({
        x: e - 150,
        y: 190,
        w: 300,
        h: 20,
        label: "冻结名单…",
        tip: ["写了严重违规内容被自动冻结的账号", "可以看原话和时间，误伤了可以解冻"],
        onClick: () => i.ui.open(new FrozenScreen(i, this)),
      }),
      this.widgets.push({
        x: e - 100,
        y: t.h - 30,
        w: 200,
        h: 20,
        label: "完成",
        onClick: () => this.back(),
      }));
  }
  async run(t, e, i) {
    ((this.busy = t), this.layout());
    try {
      (await e(), this.say(i));
    } catch (t) {
      this.say(t.message, !0);
    }
    ((this.busy = null), this.layout());
  }
  setNick(t) {
    return this.run(
      "nick",
      async () => {
        (await Account.update({ tempNick: t }), (this.nick = Account.data.tempNick || ""));
      },
      t
        ? `之后进联机房间时叫「${t}」（已经在房间里的话，重新进入后生效）`
        : "已改回 B站名（重新进入房间后生效）",
    );
  }
  setColor(t) {
    return this.run(
      "color",
      () => Account.update({ nameColor: t }),
      t ? "昵称颜色已设置，房间里的人马上能看到" : "已取消昵称颜色",
    );
  }
  announce() {
    const t = this.notice.trim();
    if (t)
      return this.run(
        "notice",
        async () => {
          if ("function" == typeof textOk && !(await textOk(this.game, t, "chat")))
            throw new Error("这段文字没有通过 B站 的内容检查");
          (await Account.api("/api/account/announce", { text: t }), (this.notice = ""));
        },
        "公告已发布",
      );
    this.say("先写公告内容", !0);
  }
  drawExtra(t) {
    this.drawFields(t);
    const e = t.ctx,
      i = t.w / 2,
      s = Account.data.nameColor || "";
    (Font.draw(e, "昵称颜色", i - 150, 125, "#A0A0A0"),
      Font.draw(
        e,
        "现在：" + (Account.data.tempNick || Account.name),
        i + 50,
        125,
        s || "#FFFFFF",
      ));
  }
  draw(t) {
    super.draw(t);
    const e = t.ctx,
      i = Account.data.nameColor || "";
    for (const t of this.swatches || [])
      ((e.fillStyle = t.col || "#FFFFFF"),
        e.fillRect(t.x + 3, t.y + 3, t.w - 6, t.h - 6),
        t.col ||
          ((e.strokeStyle = "#FF5555"),
          e.beginPath(),
          e.moveTo(t.x + 4, t.y + t.h - 4),
          e.lineTo(t.x + t.w - 4, t.y + 4),
          e.stroke()),
        t.col === i &&
          ((e.strokeStyle = "#FFFFFF"),
          (e.lineWidth = 1),
          e.strokeRect(t.x + 0.5, t.y + 0.5, t.w - 1, t.h - 1)));
  }
}
const g_netName = (t) => {
  Account.loggedIn && ((t.settings.netName = Account.name), t.saveSettings());
};
class UnlockScreen extends MenuScreen {
  constructor(t, e, i, s) {
    (super(t, "解锁"),
      (this.parent = e),
      (this.reason = i || ""),
      (this.then = s || null),
      (this.startOn = Account.has("online")),
      (this.goldFrom = 0),
      (this.pauses = !1),
      (this.titleY = 12),
      (this.note = ""),
      (this.noteColor = "#A0A0A0"),
      (this.inToy = null),
      (this.went = null),
      Account.loadGate().then(() => {
        this.game.ui.screen === this && this.layout();
      }),
      Toy.ready().then((t) => {
        ((this.inToy = t),
          this.game.ui.screen === this && this.layout(),
          t && Account.loggedIn && Date.now() - Account.lastCheck > 15e3 && this.check(!0));
      }),
      (this.onBack = () => {
        "visible" === document.visibilityState &&
          this.went &&
          this.game.ui.screen === this &&
          ((this.went = null), (this.retries = 3), setTimeout(() => this.check(), 600));
      }),
      document.addEventListener("visibilitychange", this.onBack),
      window.addEventListener("focus", this.onBack));
  }
  close() {
    (document.removeEventListener("visibilitychange", this.onBack),
      window.removeEventListener("focus", this.onBack));
  }
  back() {
    this.game.ui.open(this.parent || new TitleScreen(this.game));
  }
  onEsc() {
    this.back();
  }
  say(t, e) {
    ((this.note = t), (this.noteColor = e ? "#FF6060" : "#A0A0A0"));
  }
  cards() {
    const t = this.game.ui,
      e = t.w / 2,
      i = Math.min(170, Math.floor((t.w - 24) / 2)),
      s = Account.gate || {},
      n = !(!s.videos || !s.videos.length);
    return [
      {
        x: e - i - 4,
        y: 46,
        w: i,
        h: 132,
        kind: "triple",
        on: n,
        done: Account.tripleOk(),
        title: "给新视频三连",
        sub: n
          ? s.videos.length > 1
            ? "任意一个新视频点赞+投币+收藏"
            : "点赞+投币+收藏（老视频不算）"
          : "视频发布后开放",
        gives: ["4 款静态披风", "自定义皮肤"],
      },
      {
        x: e + 4,
        y: 46,
        w: i,
        h: 132,
        kind: "follow",
        on: !0,
        done: !!Account.unlocks.follow,
        title: "关注 UP 主",
        sub: "土豆味小哲",
        gives: ["3 款动态披风", n ? "" : "（视频发布前也解锁静态披风和皮肤）"].filter(Boolean),
      },
    ];
  }
  layout() {
    const t = this.game.ui.w / 2,
      e = this.game;
    if (((this.widgets = []), Account.loggedIn))
      for (const t of this.cards())
        !t.done &&
          t.on &&
          this.widgets.push({
            x: t.x + 10,
            y: t.y + t.h - 28,
            w: t.w - 20,
            h: 20,
            gold: !0,
            enabled: !0 === this.inToy,
            label: "triple" === t.kind ? "去三连" : "去关注",
            tip:
              !1 === this.inToy
                ? ["请在 B站 App 或电脑网页的游戏页面里操作"]
                : [
                    "triple" === t.kind
                      ? "打开视频页，点赞、投币、收藏后回来"
                      : "打开 UP 主的空间，关注后回来",
                  ],
            onClick: () => this.go(t.kind),
          });
    else
      this.widgets.push({
        x: t - 100,
        y: 196,
        w: 200,
        h: 24,
        gold: !0,
        label: "先登录",
        onClick: () =>
          e.ui.open(
            new LoginScreen(
              e,
              () => e.ui.open(new UnlockScreen(e, this.parent, this.reason, this.then)),
              () => offlineBack(e, this.parent),
            ),
          ),
      });
    const i = Account.has("online") && (this.then || "play" !== e.state);
    (i
      ? this.startOn || this.goldFrom || (this.goldFrom = performance.now())
      : ((this.goldFrom = 0), (this.startOn = !1)),
      i
        ? this.widgets.push({
            x: t - 100,
            y: 196,
            w: 98,
            h: 20,
            gold: !0,
            goldFrom: this.goldFrom,
            fromLabel: "我完成了，检查",
            label: "开始联机",
            onClick: () => this.start(),
          })
        : Account.loggedIn &&
          this.widgets.push({
            x: t - 100,
            y: 196,
            w: 98,
            h: 20,
            label: () => (Account.checking ? "正在检查…" : "我完成了，检查"),
            enabled: !0 === this.inToy && !Account.checking,
            onClick: () => this.check(),
          }),
      this.widgets.push({
        x: Account.loggedIn ? t + 2 : t - 100,
        y: Account.loggedIn ? 196 : 224,
        w: Account.loggedIn ? 98 : 200,
        h: 20,
        label: "返回",
        onClick: () => this.back(),
      }));
  }
  start() {
    const t = this.game,
      e = this.then;
    if ((Telemetry.count && Telemetry.count("unlock_start"), e)) return ((this.then = null), e());
    t.ui.open(
      new MultiplayerScreen(
        t,
        this.parent instanceof TitleScreen ? this.parent : new TitleScreen(t),
      ),
    );
  }
  async go(t) {
    Account.gate;
    this.went = t;
    try {
      ("triple" === t ? await Toy.openVideo(Account.pickVideo()) : await Toy.openAuthor(),
        this.say(Toy.backHint(t)),
        setTimeout(() => {
          this.went === t &&
            this.game.ui.screen === this &&
            ((this.went = null), (this.retries = 3), this.check(!0));
        }, 8e3));
    } catch (t) {
      ((this.went = null), this.say(Toy.explain(t), !0));
    }
    this.layout();
  }
  async check(t) {
    this.layout();
    try {
      const e = await Account.checkUnlocks();
      if (!e) return;
      const i = !Account.allUnlocked();
      if (
        (i &&
          this.retries > 0 &&
          e.inToy &&
          (this.retries--,
          setTimeout(() => {
            this.game.ui.screen === this && this.check(this.retries > 0);
          }, 4e3)),
        e.inToy)
      )
        if (e.own || !i || (e.got && e.got.length)) {
          if (e.error && null === e.follow && null === e.triple) this.say(Toy.explain(e.error), !0);
          else if (e.got && e.got.length) this.say("解锁成功！", !1);
          else if (
            Account.gate &&
            Account.gate.videos &&
            Account.gate.videos.length &&
            null === e.triple &&
            !Account.unlocks.triple
          )
            this.say(
              "没查到三连状态（" +
                (e.error ? Toy.explain(e.error) : "B站没有返回能看懂的数据") +
                "），过一会儿再点检查",
              !0,
            );
          else if (!t) {
            const t = Account.tripleParts,
              e = [];
            (t &&
              !t.all &&
              (t.like || e.push("点赞"), t.coin || e.push("投币"), t.fav || e.push("收藏")),
              Account.unlocks.follow || e.push("关注"));
            const i =
              Account.gate && Account.gate.videos && Account.gate.videos.length > 1 && t && !t.all;
            this.say(
              e.length
                ? "还差：" +
                    e.join("、") +
                    (i ? "（要在同一个视频上）" : "（刚操作完可能要等几秒）")
                : "都完成了",
              !!e.length,
            );
          }
        } else
          this.say(
            "这里没登录你自己的 B站：用你的 B站 关注、三连后，在那台设备打开一次游戏就会同步",
            !0,
          );
      else this.say("请在 B站 App 或电脑网页的游戏页面里检查", !0);
    } catch (t) {
      this.say(t.message, !0);
    }
    this.game.ui.screen === this && this.layout();
  }
  drawExtra(t) {
    const e = t.ctx,
      i = t.w / 2,
      s =
        Account.checking +
        ":" +
        Account.has("online") +
        ":" +
        Account.tripleOk() +
        ":" +
        !!Account.unlocks.follow;
    if (this.seenSt !== s) {
      const t = void 0 === this.seenSt;
      ((this.seenSt = s), t || this.layout());
    }
    this.reason
      ? Font.center(e, fitText(this.reason, t.w - 8), i, 26, "#FFD24A")
      : Font.center(
          e,
          fitText("支持一下 UP 主，就能解锁披风、皮肤和联机", t.w - 8),
          i,
          26,
          "#E0E0E0",
        );
    for (const t of this.cards()) {
      if (
        (drawCard(e, t.x, t.y, t.w, t.h, !t.done && t.on),
        "triple" === t.kind
          ? (drawIcon(e, "like", t.x + 8, t.y + 8, 1, "#FB7299"),
            drawIcon(e, "coin", t.x + 18, t.y + 8, 1, "#FFD24A"),
            drawIcon(e, "star", t.x + 28, t.y + 8, 1, "#FFD24A"))
          : drawIcon(e, "follow", t.x + 8, t.y + 8, 1, "#FB7299"),
        Font.draw(e, t.title, t.x + ("triple" === t.kind ? 40 : 20), t.y + 8, "#FFFFFF"),
        Font.draw(e, fitText(t.sub, t.w - 16), t.x + 8, t.y + 22, "#A0A0A0"),
        Font.draw(e, "解锁：", t.x + 8, t.y + 38, "#FFD24A"),
        t.gives.forEach((i, s) =>
          Font.draw(e, fitText(i, t.w - 16), t.x + 8, t.y + 50 + 10 * s, "#E0E0E0"),
        ),
        "undefined" != typeof Capes)
      ) {
        Capes.list
          .filter((e) => ("triple" === t.kind ? !e.anim : e.anim))
          .slice(0, 4)
          .forEach((i, s) => Capes.drawFlat(e, i.id, t.x + 8 + 26 * s, t.y + 72, 2, !t.done));
      }
      t.done
        ? (drawIcon(e, "check", t.x + t.w - 30, t.y + t.h - 26, 2, "#55FF55"),
          Font.draw(e, "已完成", t.x + 10, t.y + t.h - 22, "#55FF55"))
        : t.on || Font.draw(e, "敬请期待", t.x + 10, t.y + t.h - 22, "#808080");
    }
    const n = Account.has("online");
    (Account.loggedIn &&
      Font.center(
        e,
        fitText(
          n
            ? Account.has("jing")
              ? "✓ 联机、模组和鲸鲸已解锁"
              : "✓ 联机和模组已解锁"
            : Account.gate && Account.gate.triple
              ? "三连 + 关注 = 解锁联机、模组和鲸鲸"
              : "关注 = 解锁联机和模组",
          t.w - 8,
        ),
        i,
        182,
        n ? "#55FF55" : "#FFD24A",
      ),
      this.note
        ? Font.center(
            e,
            fitText(this.note, t.w - 8),
            i,
            t.h - 22 + (Account.loggedIn ? 0 : -6),
            this.noteColor,
          )
        : !1 === this.inToy &&
          Account.loggedIn &&
          Font.center(
            e,
            fitText(
              "在 B站 App 或电脑网页上打开游戏才能三连和关注；在别处用识别码登录时，按最后一次在 B站 检查到的状态",
              t.w - 8,
            ),
            i,
            t.h - 22,
            "#A0A0A0",
          ));
  }
}
class ToyDiagScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, "B站 接口诊断"),
      (this.parent = e),
      (this.pauses = !1),
      (this.titleY = 12),
      (this.lines = ["正在读取…"]),
      this.run());
  }
  async run() {
    const t = [],
      j = (t) => {
        try {
          return JSON.stringify(t);
        } catch (e) {
          return String(t);
        }
      };
    t.push("在 Toy 里：" + (await Toy.ready()) + (Toy.mock ? "（模拟）" : ""));
    const e = await Account.loadGate(!0);
    t.push("联机门槛：" + j(e));
    try {
      const e = await Toy.profile();
      t.push("用户：" + e.nickname + (e.toyOpenId ? "（有 toyOpenId）" : "（没有 toyOpenId）"));
    } catch (e) {
      t.push("用户：" + e.type + " " + e.message);
    }
    try {
      (t.push("关注 → " + (await Toy.following())), t.push("  原始：" + j(Toy.last.relation)));
    } catch (e) {
      t.push("关注：" + e.type + " " + e.message);
    }
    if (e.videos && e.videos.length)
      try {
        (t.push("三连 → " + j(await Toy.triple(e.videos))),
          t.push("  原始：" + j(Toy.last.videoActions)));
      } catch (e) {
        t.push("三连：" + e.type + " " + e.message);
      }
    try {
      t.push("能力：" + j(await Toy.abilities()));
    } catch (e) {
      t.push("能力：" + e.type);
    }
    ((this.lines = t), this.game.ui.screen === this && this.layout());
  }
  layout() {
    const t = this.game.ui;
    this.widgets = [
      {
        x: t.w / 2 - 100,
        y: t.h - 28,
        w: 200,
        h: 20,
        label: "完成",
        onClick: () => this.game.ui.open(this.parent),
      },
    ];
  }
  drawExtra(t) {
    let e = 30;
    for (const i of this.lines)
      for (let s = String(i); s.length && e < t.h - 36; e += 10) {
        let i = s.length;
        for (; i > 1 && Font.width(s.slice(0, i)) > t.w - 16;) i--;
        (Font.draw(t.ctx, s.slice(0, i), 8, e, "#E0E0E0"), (s = s.slice(i)));
      }
  }
  onEsc() {
    this.game.ui.open(this.parent);
  }
}
function offlineBack(t, e) {
  (t.ui.open(e || ("play" === t.state ? null : new TitleScreen(t))),
    t.ui.toast &&
      t.ui.toast(
        "离线游玩",
        self.POTATO
          ? "靶场和人机可以玩，排位和好友约战要先登录"
          : "只能玩单人游戏，联机要先登录（选项 → 账号）",
      ));
}
const SINGLE_OPEN = !0;
async function singleGate(t, e, i) {
  return e();
}
class FollowGateScreen extends MenuScreen {
  constructor(t, e, i, s) {
    (super(t, "关注 UP 主"),
      (this.parent = e),
      (this.then = i),
      (this.msg = s),
      (this.note = ""),
      (this.noteColor = "#A0A0A0"),
      (this.titleY = 40),
      (this.onBack = () => {
        "visible" === document.visibilityState &&
          this.went &&
          this.game.ui.screen === this &&
          ((this.went = !1), (this.retries = 3), setTimeout(() => this.check(!0), 600));
      }),
      document.addEventListener("visibilitychange", this.onBack),
      window.addEventListener("focus", this.onBack));
  }
  close() {
    (document.removeEventListener("visibilitychange", this.onBack),
      window.removeEventListener("focus", this.onBack));
  }
  back() {
    this.game.ui.open(this.parent || new TitleScreen(this.game));
  }
  onEsc() {
    this.back();
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      i = Math.floor(t.h / 2) + 10;
    this.widgets = [
      { x: e - 100, y: i, w: 200, h: 20, gold: !0, label: "去关注", onClick: () => this.go() },
      {
        x: e - 100,
        y: i + 24,
        w: 98,
        h: 20,
        label: () => (this.checking ? "正在检查…" : "我关注了，检查"),
        enabled: !this.checking,
        onClick: () => this.check(!1),
      },
      { x: e + 2, y: i + 24, w: 98, h: 20, label: "返回", onClick: () => this.back() },
    ];
  }
  async go() {
    this.went = !0;
    try {
      (await Toy.openAuthor(), (this.note = Toy.backHint("follow")), (this.noteColor = "#A0A0A0"));
    } catch (t) {
      ((this.went = !1), (this.note = Toy.explain(t)), (this.noteColor = "#FF6060"));
    }
    setTimeout(() => {
      this.went &&
        this.game.ui.screen === this &&
        ((this.went = !1), (this.retries = 3), this.check(!0));
    }, 8e3);
  }
  async check(t) {
    if (this.checking) return;
    this.checking = !0;
    let e = null,
      i = null;
    try {
      e = await Toy.following();
    } catch (t) {
      i = t;
    }
    if (((this.checking = !1), this.game.ui.screen === this)) {
      if (!0 === e || (null === e && !i)) {
        Telemetry.count && Telemetry.count("gate_single_ok");
        const t = this.then;
        return ((this.then = null), void (t && t()));
      }
      (this.retries > 0 &&
        (this.retries--,
        setTimeout(() => {
          this.game.ui.screen === this && this.check(!0);
        }, 4e3)),
        (t && this.retries) ||
          ((this.note = i ? Toy.explain(i) : "还没查到关注（刚关注完可能要等几秒，再点一次检查）"),
          (this.noteColor = "#FF6060")));
    }
  }
  drawExtra(t) {
    const e = t.ctx,
      i = t.w / 2,
      s = Math.floor(t.h / 2) - 40;
    (Font.center(
      e,
      fitText(this.msg || "关注 UP 主「土豆味小哲」后就能玩单人游戏", t.w - 8),
      i,
      s,
      "#FFD24A",
    ),
      Font.center(e, fitText("在 B站 里关注完回到这里，会自动检查", t.w - 8), i, s + 14, "#E0E0E0"),
      this.note && Font.center(e, fitText(this.note, t.w - 8), i, s + 30, this.noteColor));
  }
}
async function onlineGate(t, e, i) {
  if (!RoomService.base()) return e();
  const s = await Account.loadGate();
  if (!s.requireAccount && !s.follow && !s.triple) return e();
  if (!Account.loggedIn)
    return (
      Telemetry.count && Telemetry.count("gate_login"),
      t.ui.open(
        new LoginScreen(
          t,
          () => onlineGate(t, e, i),
          () => offlineBack(t, i),
        ),
      )
    );
  try {
    await Account.checkUnlocks(!0);
  } catch (t) {}
  if (!Account.has("online"))
    return (
      Telemetry.count && Telemetry.count("gate_unlock"),
      t.ui.open(
        new UnlockScreen(
          t,
          i,
          s.triple
            ? "联机需要关注 UP 主并给新视频三连（老视频的三连不算了）"
            : "联机需要关注 UP 主（取消关注后会重新锁上）",
          e,
        ),
      )
    );
  e();
}
//# sourceURL=js/account.js
