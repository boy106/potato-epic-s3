"use strict";
const Live = {
  v: 0,
  values: {},
  busy: !1,
  at: 0,
  get(t, e) {
    return Object.prototype.hasOwnProperty.call(this.values, t) ? this.values[t] : e;
  },
  on(t) {
    return !1 !== this.get(t, !0);
  },
  load() {
    try {
      const t = JSON.parse(localStorage.getItem("mcjs-live") || "null");
      t && t.values && ((this.v = +t.v || 0), (this.values = t.values));
    } catch (t) {}
  },
  async fetch(t) {
    if (void 0 !== t && +t === this.v) return;
    if (this.busy || "undefined" == typeof RoomService || !RoomService.base()) return;
    const e = Date.now();
    if (!(e - this.at < 2e3)) {
      ((this.busy = !0), (this.at = e));
      try {
        const t = await fetch(RoomService.base() + "/api/live?v=" + this.v, { cache: "no-store" }),
          e = await t.json();
        if (t.ok && e && !e.same && e.values) {
          const t = JSON.stringify(this.values);
          ((this.v = +e.v || 0), (this.values = e.values));
          try {
            localStorage.setItem("mcjs-live", JSON.stringify({ v: this.v, values: this.values }));
          } catch (t) {}
          JSON.stringify(this.values) !== t && this.changed();
        }
      } catch (t) {}
      this.busy = !1;
    }
  },
  changed() {
    const t = "undefined" != typeof game && game;
    if (!t || !t.settings) return;
    this.defaults(t);
    const e = t.ui && t.ui.screen;
    e && "undefined" != typeof TitleScreen && e instanceof TitleScreen && e.layout();
  },
  defaults(t) {
    let e = {};
    try {
      e = t.loadSettings() || {};
    } catch (t) {}
    const i = {
      fov: ["defaults.fov", 1],
      volume: ["defaults.volume", 100],
      sens: ["defaults.sens", 100],
      clouds: ["defaults.clouds"],
      bobbing: ["defaults.bobbing"],
    };
    for (const [s, [n, o]] of Object.entries(i)) {
      if (s in e || !Object.prototype.hasOwnProperty.call(this.values, n)) continue;
      const i = this.values[n];
      if (o) {
        const e = Number(i);
        Number.isFinite(e) && (t.settings[s] = e / o);
      } else "boolean" == typeof i && (t.settings[s] = i);
    }
  },
};
(Live.load(),
  (() => {
    if ("function" != typeof TitleScreen) return;
    const t = {
      gold: "#FFAA00",
      red: "#FF5555",
      green: "#55FF55",
      aqua: "#55FFFF",
      white: "#FFFFFF",
    };
    let e = !0;
    const i = TitleScreen.prototype.layout,
      s = TitleScreen.prototype.drawExtra;
    ((TitleScreen.prototype.layout = function (...t) {
      (e && this.game && ((e = !1), Live.defaults(this.game)), i.apply(this, t));
      const s = String(Live.get("title.splash", "") || "").trim();
      if (
        (s
          ? (this.splash = s)
          : this.liveSplash && (this.splash = SPLASHES[(Math.random() * SPLASHES.length) | 0]),
        (this.liveSplash = !!s),
        !Live.on("client.feedback"))
      ) {
        const t = this.widgets.find((t) => "反馈问题" === t.label),
          e = this.widgets.find((t) => "皮肤和装饰" === t.label);
        t &&
          (this.widgets.splice(this.widgets.indexOf(t), 1),
          e && e.y === t.y && (e.w = t.x + t.w - e.x));
      }
    }),
      (TitleScreen.prototype.drawExtra = function (e) {
        s.call(this, e);
        const i = String(Live.get("notice.text", "") || "").trim();
        if (!i) return;
        const n = e.ctx,
          o = Math.floor(e.h / 4 + 48) - 14,
          a = Math.min(e.w - 8, Font.width(i) + 12),
          l =
            !0 === Live.get("notice.blink", !1)
              ? 0.65 + 0.35 * Math.sin(performance.now() / 260)
              : 1;
        ((n.globalAlpha = 0.55),
          (n.fillStyle = "#000"),
          n.fillRect(Math.floor(e.w / 2 - a / 2), o - 2, a, 12),
          (n.globalAlpha = l),
          Font.center(
            n,
            fitText(i, e.w - 16),
            e.w / 2,
            o,
            t[Live.get("notice.color", "gold")] || t.gold,
          ),
          (n.globalAlpha = 1));
      }));
  })(),
  (() => {
    const menus = () => {
      const t = "undefined" != typeof game && game;
      return !t || "play" !== t.state;
    };
    (setTimeout(() => Live.fetch(), 1500),
      setInterval(() => {
        !document.hidden && menus() && Live.fetch();
      }, 3e5),
      document.addEventListener("visibilitychange", () => {
        !document.hidden && menus() && Date.now() - Live.at > 3e5 && Live.fetch();
      }));
  })());
//# sourceURL=js/live.js
