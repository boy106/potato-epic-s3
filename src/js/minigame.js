"use strict";
const LEGACY_COL = {
    0: "#000000",
    1: "#0000AA",
    2: "#00AA00",
    3: "#00AAAA",
    4: "#AA0000",
    5: "#AA00AA",
    6: "#FFAA00",
    7: "#AAAAAA",
    8: "#555555",
    9: "#5555FF",
    a: "#55FF55",
    b: "#55FFFF",
    c: "#FF5555",
    d: "#FF55FF",
    e: "#FFFF55",
    f: "#FFFFFF",
  },
  Legacy = {
    runs(t, e = "#FFFFFF") {
      const s = [];
      let o = e,
        a = "";
      t = String(null == t ? "" : t);
      for (let l = 0; l < t.length; l++) {
        const r = t[l];
        if ("§" !== r || l + 1 >= t.length) {
          a += r;
          continue;
        }
        let n;
        const i = t[l + 1].toLowerCase();
        if ("#" === i && /^[0-9a-fA-F]{6}$/.test(t.substr(l + 2, 6)))
          ((n = "#" + t.substr(l + 2, 6).toUpperCase()), (l += 7));
        else if ((l++, LEGACY_COL[i])) n = LEGACY_COL[i];
        else {
          if ("r" !== i) continue;
          n = e;
        }
        (a && s.push({ t: a, c: o }), (a = ""), (o = n));
      }
      return (a && s.push({ t: a, c: o }), s);
    },
    strip: (t) => String(null == t ? "" : t).replace(/§(#[0-9a-fA-F]{6}|.)/g, ""),
    width(t) {
      return Font.width(this.strip(t));
    },
    first(t, e = "#FFFFFF") {
      const s = this.runs(t, e);
      return s.length ? s[0].c : e;
    },
    draw(t, e, s, o, a = "#FFFFFF", l = !0) {
      for (const r of this.runs(e, a)) s = Font.draw(t, r.t, s, o, r.c, l);
      return s;
    },
    center(t, e, s, o, a, l) {
      this.draw(t, e, Math.round(s - this.width(e) / 2), o, a, l);
    },
  },
  MG = {
    types: new Set(["sbo", "sbd", "sbs", "sbr", "team", "title", "boss", "tabhf"]),
    BOSS_COL: ["#EC00B8", "#00B7EC", "#EC3500", "#1DEC00", "#E8EC00", "#7B00EC", "#ECECEC"],
    reset: (t) => (
      (t.mg = {
        obj: new Map(),
        scores: new Map(),
        slots: [],
        teams: new Map(),
        who: new Map(),
        title: null,
        times: [10, 70, 20],
        sub: "",
        boss: new Map(),
        tab: null,
      }),
      t.mg
    ),
    st(t) {
      return t.mg || this.reset(t);
    },
    on(t, e) {
      const s = this.st(t);
      switch (e.t) {
        case "sbo":
          if (1 === e.a) {
            (s.obj.delete(e.name), s.scores.delete(e.name));
            for (let t = 0; t < s.slots.length; t++) s.slots[t] === e.name && (s.slots[t] = null);
          } else s.obj.set(e.name, { title: e.title || "", blank: !!e.blank });
          break;
        case "sbd":
          s.slots[e.pos] = e.name || null;
          break;
        case "sbs": {
          let t = s.scores.get(e.obj);
          (t || s.scores.set(e.obj, (t = new Map())),
            t.set(e.k, { v: e.v, d: e.d, blank: !!e.blank }));
          break;
        }
        case "sbr":
          if (e.obj) {
            const t = s.scores.get(e.obj);
            t && t.delete(e.k);
          } else for (const t of s.scores.values()) t.delete(e.k);
          break;
        case "team": {
          if ("remove" === e.mode) {
            const t = s.teams.get(e.team);
            if (t) for (const e of t.players) s.who.delete(e);
            s.teams.delete(e.team);
            break;
          }
          let t = s.teams.get(e.team);
          if (
            (t ||
              s.teams.set(
                e.team,
                (t = { color: 15, pre: "", suf: "", tags: "always", players: new Set() }),
              ),
            ("add" !== e.mode && "change" !== e.mode) ||
              (void 0 !== e.color && (t.color = e.color),
              void 0 !== e.pre && (t.pre = e.pre),
              void 0 !== e.suf && (t.suf = e.suf),
              e.tags && (t.tags = e.tags)),
            "add" === e.mode || "join" === e.mode)
          )
            for (const o of e.players || []) {
              const a = s.teams.get(s.who.get(o));
              (a && a !== t && a.players.delete(o), t.players.add(o), s.who.set(o, e.team));
            }
          if ("leave" === e.mode)
            for (const o of e.players || [])
              (t.players.delete(o), s.who.get(o) === e.team && s.who.delete(o));
          break;
        }
        case "title":
          if (e.clear) {
            ((s.title = null), e.reset && ((s.sub = ""), (s.times = [10, 70, 20])));
            break;
          }
          (e.time &&
            ((s.times = e.time.map((t) => Math.max(0, 0 | t))),
            s.title && (s.title.t0 = performance.now())),
            void 0 !== e.sub && ((s.sub = e.sub), s.title && (s.title.sub = e.sub)),
            void 0 !== e.title &&
              (s.title = {
                text: e.title,
                sub: s.sub,
                t0: performance.now(),
                times: s.times.slice(),
              }));
          break;
        case "boss": {
          if (1 === e.a) {
            s.boss.delete(e.id);
            break;
          }
          let t = s.boss.get(e.id);
          if (!t) {
            if (0 !== e.a) break;
            s.boss.set(e.id, (t = { title: "", hp: 1, color: 0 }));
          }
          (void 0 !== e.title && (t.title = e.title),
            void 0 !== e.hp && (t.hp = Math.max(0, Math.min(1, e.hp))),
            void 0 !== e.color && (t.color = e.color));
          break;
        }
        case "tabhf":
          s.tab = { h: e.h || "", f: e.f || "" };
      }
    },
    teamCode: (t) => (t && t.color >= 0 && t.color < 16 ? "§" + t.color.toString(16) : ""),
    holder(t, e, s) {
      if (s && s.d) return s.d;
      const o = t.teams.get(t.who.get(e));
      return o ? o.pre + this.teamCode(o) + e + "§r" + o.suf : e;
    },
    sidebar(t, e) {
      const s = t.net && t.net.name,
        o = s && e.teams.get(e.who.get(s));
      return o &&
        o.color >= 0 &&
        o.color < 16 &&
        e.slots[3 + o.color] &&
        e.obj.has(e.slots[3 + o.color])
        ? e.slots[3 + o.color]
        : e.slots[1] && e.obj.has(e.slots[1])
          ? e.slots[1]
          : null;
    },
    draw(t) {
      const e = t.game;
      if (!e.net || !e.mg || "play" !== e.state) return;
      const s = e.mg,
        o = t.ctx,
        a = t.w,
        l = t.h,
        r = t.safe ? t.safe() : { t: 0, r: 0, b: 0, l: 0 };
      let n = 2 + r.t;
      for (const t of s.boss.values()) {
        if (n > l / 3) break;
        Legacy.center(o, t.title, a / 2, n, "#FFFFFF");
        const e = 182,
          s = Math.round(a / 2 - e / 2),
          r = this.BOSS_COL[t.color] || this.BOSS_COL[6];
        ((o.fillStyle = "rgba(0,0,0,0.6)"),
          o.fillRect(s, n + 10, e, 5),
          (o.fillStyle = r),
          (o.globalAlpha = 0.35),
          o.fillRect(s, n + 10, e, 5),
          (o.globalAlpha = 1),
          (o.fillStyle = r),
          o.fillRect(s, n + 10, Math.round(e * t.hp), 5),
          (n += 19));
      }
      const i = this.sidebar(e, s);
      if (i) {
        const t = s.obj.get(i),
          e = s.scores.get(i),
          n = (
            e
              ? [...e.entries()]
                  .filter(([t]) => !t.startsWith("#"))
                  .sort((t, e) => e[1].v - t[1].v || (t[0] < e[0] ? -1 : 1))
                  .slice(0, 15)
              : []
          ).map(([e, o]) => ({
            text: this.holder(s, e, o),
            num: t.blank || o.blank ? "" : String(o.v),
          }));
        let c = Legacy.width(t.title);
        for (const t of n)
          c = Math.max(c, Legacy.width(t.text) + (t.num ? Font.width(t.num) + 8 : 0));
        const h = n.length,
          f = a - 1 - r.r,
          m = f - c - 4,
          F = Math.round(l / 2 + (9 * h) / 3) - 9 * h;
        ((o.fillStyle = "rgba(0,0,0,0.4)"),
          o.fillRect(m, F - 10, f - m, 10),
          (o.fillStyle = "rgba(0,0,0,0.3)"),
          o.fillRect(m, F, f - m, 9 * h),
          Legacy.center(o, t.title, (m + f) / 2, F - 9, "#FFFFFF", !1),
          n.forEach((t, e) => {
            const s = F + 9 * e;
            (Legacy.draw(o, t.text, m + 2, s, "#FFFFFF", !1),
              t.num && Font.draw(o, t.num, f - 1 - Font.width(t.num), s, "#FF5555", !1));
          }));
      }
      const c = s.title;
      if (c) {
        const [t, e, r] = c.times.map((t) => 50 * t),
          n = performance.now() - c.t0;
        if (n > t + e + r) s.title = null;
        else {
          const s = n < t ? n / Math.max(1, t) : n > t + e ? 1 - (n - t - e) / Math.max(1, r) : 1;
          (o.save(), (o.globalAlpha = Math.max(0.05, Math.min(1, s))));
          const i = Legacy.width(c.text),
            h = Math.max(1, Math.min(4, (a - 16) / Math.max(1, i)));
          if (
            (o.translate(a / 2, l / 2),
            o.scale(h, h),
            Legacy.center(o, c.text, 0, -10, "#FFFFFF"),
            o.restore(),
            c.sub)
          ) {
            (o.save(), (o.globalAlpha = Math.max(0.05, Math.min(1, s))));
            const t = Legacy.width(c.sub),
              e = Math.max(1, Math.min(2, (a - 16) / Math.max(1, t)));
            (o.translate(a / 2, l / 2),
              o.scale(e, e),
              Legacy.center(o, c.sub, 0, 5, "#FFFFFF"),
              o.restore());
          }
        }
      }
    },
  };
((() => {
  if ("function" == typeof netApplyMeta) {
    const t = netApplyMeta;
    netApplyMeta = function (e, s, o) {
      (t(e, s, o), o && "custom_name_visible" in o && (s.nameVisible = !!o.custom_name_visible));
    };
  }
  if ("undefined" != typeof ArmorStand) {
    const t = ArmorStand.prototype.drawSelf;
    ArmorStand.prototype.drawSelf = function (e, s, o, a, l) {
      if (this.invisible) {
        const t = this.gear && this.gear[3];
        if (t && ITEMS[t.id]) {
          const o = M4.create();
          (M4.translate(o, s[0], s[1] + (this.small ? 0.72 : 1.4375), s[2]), M4.rotY(o, this.yaw));
          const r = this.small ? 0.3125 : 0.625;
          (M4.scale(o, r, r, r),
            M4.translate(o, -0.5, 0, -0.5),
            e.drawItemModel(t.id, o, l, a, null, t));
        }
      } else t.call(this, e, s, o, a, l);
      this.customName &&
        (this.nameVisible || !this.invisible) &&
        e.drawNameTag &&
        e.drawNameTag(this, s, Legacy.strip(this.customName), { max: 48, through: !0 });
    };
  }
  if ("undefined" != typeof NetClient) {
    const t = NetClient.prototype.drawNames;
    NetClient.prototype.drawNames = function (e) {
      const s = this.g.mg;
      if (!s || !s.who.size) return t.call(this, e);
      const o = this.g;
      for (const t of o.entities) {
        if (!(t instanceof NetPlayer) || t.dead || t.invisible) continue;
        const a = s.teams.get(s.who.get(t.name));
        if (a && "never" === a.tags) continue;
        const l = t.netSwim || t.gliding ? 0.6 : t.sneaking ? 1.5 : t.h,
          r =
            a && a.color >= 0 && a.color < 16
              ? LEGACY_COL[a.color.toString(16)]
              : (this.colors && this.colors.get(t.name)) || "#FFFFFF",
          n = (a ? Legacy.strip(a.pre) : "") + t.name + (a ? Legacy.strip(a.suf) : "");
        o.drawNameTag(t, t.ipos(e), n, {
          color: r,
          max: 64,
          h: l,
          through: !t.sneaking,
          faded: t.sneaking,
        });
      }
    };
  }
  if ("undefined" != typeof Extras && Extras.drawPlayerList) {
    const t = Extras.drawPlayerList;
    Extras.drawPlayerList = function (e) {
      const s = e.game,
        o = s.net,
        a = s.mg;
      if (!Extras.tabHeld || !o || !a || (!a.tab && !a.who.size)) return t(e);
      const l = e.ctx,
        r = [...new Set([...(o.players ? o.players.values() : []), o.name])].filter(Boolean);
      r.sort(
        (t, e) =>
          String(a.who.get(t) || "~").localeCompare(String(a.who.get(e) || "~")) ||
          t.localeCompare(e),
      );
      const n = a.tab && a.tab.h ? String(a.tab.h).split("\n") : [],
        i = a.tab && a.tab.f ? String(a.tab.f).split("\n") : [],
        c = Math.min(r.length, 20),
        h = c > 10 ? 2 : 1,
        f = Math.ceil(c / h),
        m = 110;
      let F = h * m + 8;
      for (const t of n.concat(i)) F = Math.max(F, Legacy.width(t) + 12);
      const g = 10 * n.length + 10 * f + 10 * i.length + 10,
        d = Math.floor(e.w / 2 - F / 2);
      ((l.fillStyle = "rgba(0,0,0,0.6)"),
        l.fillRect(d, 14, F, g),
        n.forEach((t, s) => Legacy.center(l, t, e.w / 2, 17 + 10 * s, "#FFFFFF")));
      const b = 18 + 10 * n.length;
      (r.slice(0, c).forEach((t, e) => {
        const s = ((t) => a.teams.get(a.who.get(t)))(t),
          r = s && s.color >= 0 && s.color < 16 ? LEGACY_COL[s.color.toString(16)] : "#FFFFFF",
          n = d + 4 + Math.floor(e / f) * m + Math.floor((F - 8 - h * m) / 2),
          i = b + (e % f) * 10;
        ((l.fillStyle = "rgba(255,255,255,0.08)"),
          l.fillRect(n, i - 1, 106, 9),
          Font.draw(
            l,
            fitText((s ? Legacy.strip(s.pre) : "") + t + (t === o.name ? "（你）" : ""), 102),
            n + 2,
            i,
            r,
          ));
      }),
        i.forEach((t, s) => Legacy.center(l, t, e.w / 2, b + 10 * f + 2 + 10 * s, "#FFFFFF")));
    };
  }
})(),
  (() => {
    const t = NetClient.prototype.onMessage;
    NetClient.prototype.onMessage = function (e) {
      if (!e || !MG.types.has(e.t))
        return (e && "login" === e.t && MG.reset(this.g), t.call(this, e));
      try {
        MG.on(this.g, e);
      } catch (t) {
        console.error("minigame", t);
      }
    };
    const e = UI.prototype.drawHUD;
    UI.prototype.drawHUD = function (...t) {
      const s = e.apply(this, t);
      try {
        MG.draw(this);
      } catch (t) {
        console.error("minigame draw", t);
      }
      return s;
    };
  })());
//# sourceURL=js/minigame.js
