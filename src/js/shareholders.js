"use strict";
const Share = {
    count: 0,
    seq: -1,
    pool: [],
    at: 0,
    me: null,
    err: "",
    news: [],
    ok: !1,
    url: (t) => RoomService.base() + "/api/shareholders" + (t || ""),
    async get(t) {
      const e = await fetch(this.url(t));
      if (!e.ok) throw new Error("股东名单读取失败（" + e.status + "）");
      return e.json();
    },
    async load() {
      const t = await this.get("");
      ((this.count = 0 | t.count), (this.seq = 0 | t.seq));
      const e = [...new Set([...(t.names || []), ...(t.recent || []).map((t) => t[0])])];
      for (let t = e.length - 1; t > 0; t--) {
        const o = Math.floor(Math.random() * (t + 1));
        [e[t], e[o]] = [e[o], e[t]];
      }
      ((this.pool = e), (this.at = 0), (this.ok = !0), (this.err = ""));
    },
    async poll() {
      if (this.seq < 0) return this.load();
      const t = await this.get("?after=" + this.seq);
      ((this.count = 0 | t.count), (this.seq = 0 | t.seq));
      for (const [e, o] of t.add || [])
        (this.pool.includes(e) ||
          this.pool.splice(Math.floor(Math.random() * (this.pool.length + 1)), 0, e),
          this.news.push({ name: e, no: o, t: performance.now() }));
      this.news.length > 20 && this.news.splice(0, this.news.length - 20);
    },
    async mine() {
      if (Account.loggedIn)
        try {
          ((this.me = await Account.api("/api/account/shareholders/me", {})),
            this.me.account && Account.took({ account: this.me.account }));
        } catch (t) {}
      else this.me = null;
    },
    async join() {
      try {
        "undefined" != typeof Toy &&
          !Toy.phoneWeb &&
          (await Toy.ready()) &&
          !0 === (await Toy.following()) &&
          (await Account.api("/api/account/unlocks", { follow: !0 }));
      } catch (t) {}
      const t = await Account.api("/api/account/shareholders/join", {});
      return (
        t.account && Account.took({ account: t.account }),
        (this.me = t),
        (this.count = Math.max(this.count, 0 | t.count)),
        t.name && !this.pool.includes(t.name) && this.pool.push(t.name),
        t
      );
    },
    async leave() {
      const t = await Account.api("/api/account/shareholders/leave", {});
      return ((this.me = t), (this.count = 0 | t.count), t);
    },
    next() {
      return this.pool.length
        ? (this.at >= this.pool.length && (this.at = 0), this.pool[this.at++])
        : null;
    },
  },
  SH = {
    hash(t) {
      let e = 2166136261;
      for (const o of String(t)) ((e ^= o.codePointAt(0)), (e = Math.imul(e, 16777619)));
      return (e >>> 0) / 4294967296;
    },
    text(t, e, o, s, n, i = 1, h = 1, a = !1, l = !0) {
      if (h <= 0.01) return;
      (t.save(), (t.globalAlpha *= Math.min(1, h)));
      const r = Font.width(e);
      (t.translate(a ? o - (r * i) / 2 : o, s),
        1 !== i && t.scale(i, i),
        Font.draw(t, e, 0, 0, n, l),
        t.restore());
    },
    hsl: (t, e, o) => "hsl(" + Math.round(((t % 360) + 360) % 360) + "," + e + "%," + o + "%)",
    hex(t, e, o) {
      o /= 100;
      const k = (e) => (e + t / 30) % 12,
        s = (e /= 100) * Math.min(o, 1 - o),
        f = (t) =>
          Math.round(255 * (o - s * Math.max(-1, Math.min(k(t) - 3, 9 - k(t), 1))))
            .toString(16)
            .padStart(2, "0");
      return "#" + f(0) + f(8) + f(4);
    },
    stars(t, e) {
      const o = [];
      for (let s = 0; s < t; s++)
        o.push([SH.hash(e + "x" + s), SH.hash(e + "y" + s), SH.hash(e + "s" + s)]);
      return o;
    },
  },
  EMPTY_SEAT = "虚位以待",
  SHARE_STYLES = [
    {
      id: "danmaku",
      name: "弹幕",
      COLS: [
        "#FFFFFF",
        "#FFFFFF",
        "#FFFFFF",
        "#FFFFFF",
        "#FE0302",
        "#FFFF00",
        "#00CD00",
        "#89D5FF",
        "#FF7204",
        "#CC0273",
        "#4266BE",
      ],
      init(t) {
        t.st = { items: [], lanes: [], top: [] };
      },
      step(t, e) {
        const o = t.st,
          s = Math.max(3, Math.floor((t.bot - t.top - 8) / 12));
        for (; o.lanes.length < s;) o.lanes.push(0);
        o.lanes.length = s;
        for (let n = 0; n < s; n++) {
          if (((o.lanes[n] -= e), o.lanes[n] > 0)) continue;
          const i = n < s - 1 && t.incoming.length ? t.incoming.shift() : null,
            h = i || Share.next() || "虚位以待",
            a = !!i || (Math.random() < 0.06 && n < s - 1),
            l = a ? 2 : 1,
            r = Font.width(h) * l,
            c = (55 + 45 * Math.random()) * (t.w / 400 + 0.4) * (a ? 0.8 : 1),
            u = i
              ? "#F2C94C"
              : "虚位以待" === h
                ? "#808080"
                : this.COLS[Math.floor(SH.hash(h) * this.COLS.length)];
          (o.items.push({
            name: h,
            x: t.w + 4,
            y: t.top + 4 + 12 * n,
            v: c,
            k: l,
            w: r,
            col: u,
            mine: h === t.me,
          }),
            (o.lanes[n] = (r + 24) / c + 1.6 * Math.random()),
            a && (o.lanes[n + 1] = Math.max(o.lanes[n + 1], o.lanes[n])));
        }
        for (const s of o.items) s.x -= s.v * e * (1 - 0.85 * t.slow);
        o.items = o.items.filter((t) => t.x + t.w > -4);
        for (const t of Share.news.splice(0))
          o.top.push({ text: "欢迎 " + t.name + " 成为第 " + t.no + " 位股东！", t: 0 });
        for (const t of o.top) t.t += e;
        o.top = o.top.filter((t) => t.t < 4);
        const n = o.hero;
        if (n)
          if (
            ((n.t += e),
            n.skip && n.t > n.IN && n.t < n.IN + n.HOLD && (n.t = n.IN + n.HOLD),
            n.t < n.IN)
          ) {
            const e = 1 - Math.pow(1 - n.t / n.IN, 3);
            ((n.s = n.from ? 1 + e : 2),
              (n.cx = n.x0 + (t.w / 2 - n.x0) * e),
              (n.cy = n.y0 + (n.yc - n.y0) * e - (n.from ? 26 * Math.sin(e * Math.PI) : 0)));
          } else
            n.t < n.IN + n.HOLD
              ? ((n.s = 2),
                (n.cx = t.w / 2),
                (n.cy = n.yc),
                n.landed ||
                  ((n.landed = !0), Sound.ev && Sound.ev("entity.player.levelup", null, 0.8, 1.3)))
              : ((n.dim = !1),
                (n.v = (n.v || 40) + 520 * e),
                (n.cx -= n.v * e),
                n.cx + Font.width(n.name) < -8 && (o.hero = null));
      },
      hero(t, e) {
        const o = Math.round((t.top + t.bot) / 2 - 8);
        (Object.assign(e, {
          t: 0,
          IN: e.from ? 0.8 : 1.2,
          HOLD: 2.8,
          dim: !0,
          s: e.from ? 1 : 2,
          yc: o,
          x0: e.from ? e.from.x : t.w + 4 + Font.width(e.name),
          y0: e.from ? e.from.y - 8 : o,
        }),
          (e.cx = e.x0),
          (e.cy = e.y0),
          (t.st.hero = e),
          "undefined" != typeof Sound && Sound.click && Sound.click());
      },
      drawHero(t, e, o) {
        const s = t.st.hero;
        if (!s) return;
        const n = s.landed && s.dim,
          i = s.s + (n ? 0.06 * Math.sin(5 * s.t) : 0),
          h = Font.width(s.name) * i,
          a = Math.round(s.cx - h / 2),
          l = Math.round(s.cy),
          r = l + 4 * i,
          c = e.createRadialGradient(s.cx, r, 0, s.cx, r, h / 2 + 34);
        (c.addColorStop(0, "rgba(255,214,90," + (n ? 0.32 : 0.18) + ")"),
          c.addColorStop(1, "rgba(255,214,90,0)"),
          (e.fillStyle = c),
          e.fillRect(s.cx - h / 2 - 40, r - h / 2 - 40, h + 80, h + 80));
        const u = a - 3,
          d = l - 3,
          p = Math.round(h) + 6,
          y = Math.round(8 * i) + 5;
        if (
          ((e.fillStyle = "rgba(8,10,20,0.8)"),
          e.fillRect(u, d, p, y),
          (e.fillStyle = "rgba(255,255,255,0.95)"),
          e.fillRect(u, d, p, 1),
          e.fillRect(u, d + y, p + 1, 1),
          e.fillRect(u, d, 1, y),
          e.fillRect(u + p, d, 1, y),
          SH.text(e, s.name, a, l, "#FFE94A", i, 1),
          n)
        ) {
          const n = Math.min(1, 3 * (s.t - s.IN));
          for (let t = 0; t < 8; t++) {
            const a = Math.sin(3 * o + 2.1 * t);
            if (a < 0.3) continue;
            const l = Math.round(s.cx + Math.cos(0.785 * t + 0.3) * (h / 2 + 14)),
              c = Math.round(r + Math.sin(0.785 * t + 0.3) * (6 * i + 6));
            ((e.fillStyle = "rgba(255,240,180," + (n * a).toFixed(2) + ")"),
              e.fillRect(l, c - 1, 1, 3),
              e.fillRect(l - 1, c, 3, 1));
          }
          SH.text(
            e,
            "join" === s.kind
              ? "欢迎你成为第 " + s.no + " 位股东！"
              : "你在这里 · 第 " + s.no + " 位股东",
            t.w / 2,
            d + y + 8,
            "#FFFFFF",
            1,
            n,
            !0,
          );
        }
      },
      draw(t, e, o) {
        const s = e.createLinearGradient(0, 0, 0, t.h);
        (s.addColorStop(0, "#0B0E1A"),
          s.addColorStop(1, "#171C30"),
          (e.fillStyle = s),
          e.fillRect(0, 0, t.w, t.h),
          (e.fillStyle = "rgba(255,255,255,0.025)"));
        for (let o = 0; o < t.h; o += 3) e.fillRect(0, o, t.w, 1);
        ((e.fillStyle = "rgba(255,255,255,0.12)"), e.fillRect(8, t.bot - 3, t.w - 16, 1));
        const n = ((o / 40) % 1) * (t.w - 16);
        ((e.fillStyle = "#FB7299"),
          e.fillRect(8, t.bot - 3, n, 1),
          e.fillRect(8 + n - 1, t.bot - 5, 3, 5));
        for (const o of t.st.items) {
          if (o.mine) {
            e.fillStyle = "rgba(255,255,255,0.9)";
            const t = Math.round(o.x) - 2,
              s = o.y - 2,
              n = o.w + 4,
              i = 8 * o.k + 3;
            (e.fillRect(t, s, n, 1),
              e.fillRect(t, s + i, n, 1),
              e.fillRect(t, s, 1, i),
              e.fillRect(t + n, s, 1, i + 1));
          }
          SH.text(e, o.name, o.x, o.y, o.col, o.k, 1);
        }
        let i = t.top + 2;
        for (const o of t.st.top) {
          const s = Math.min(1, 4 * o.t, 2 * (4 - o.t));
          ((e.fillStyle = "rgba(0,0,0," + 0.45 * s + ")"),
            e.fillRect(t.w / 2 - Font.width(o.text) / 2 - 4, i - 2, Font.width(o.text) + 8, 12),
            SH.text(e, o.text, t.w / 2, i, "#FFE94A", 1, s, !0),
            (i += 13));
        }
      },
    },
    {
      id: "fireworks",
      name: "烟花",
      init(t) {
        t.st = { rockets: [], sparks: [], names: [], spawn: 0.2, sky: SH.stars(90, "f") };
      },
      step(t, e) {
        const o = t.st,
          s = 1 - 0.85 * t.slow;
        ((o.spawn -= e * s),
          o.spawn <= 0 &&
            (o.rockets.push({
              x: t.w * (0.15 + 0.7 * Math.random()),
              y: t.bot - 14,
              vy: -(t.bot - t.top) * (0.9 + 0.35 * Math.random()),
              h: 360 * Math.random(),
            }),
            (o.spawn = 0.75 + 0.7 * Math.random())));
        for (const n of o.rockets) {
          const i = n.hero ? 1 : s;
          if (
            ((n.x += (n.vx || 0) * e * i),
            (n.y += n.vy * e * i),
            (n.vy += 112 * e * i),
            Math.random() < (n.hero ? 1 : 0.6) &&
              o.sparks.push({
                x: n.x + (Math.random() - 0.5),
                y: n.y + 2,
                vx: 0,
                vy: 10,
                t: 0,
                life: n.hero ? 0.6 : 0.4,
                c: "#FFE2A0",
                hero: n.hero,
              }),
            n.vy > -30 || n.y < t.top + 20)
          ) {
            if (((n.done = !0), n.hero)) {
              for (let t = 0; t < 140; t++) {
                const e = (t / 70) * Math.PI * 2 + 0.05 * Math.random(),
                  s = (t < 70 ? 95 : 55) + 25 * Math.random();
                o.sparks.push({
                  x: n.x,
                  y: n.y,
                  vx: Math.cos(e) * s,
                  vy: Math.sin(e) * s,
                  t: 0,
                  life: 1.8 + 0.8 * Math.random(),
                  c: t % 3 ? "#FFD86A" : "#FFFFFF",
                  hero: !0,
                });
              }
              const t = o.hero;
              (t && ((t.up = !1), (t.x = n.x), (t.y = n.y), (t.bt = 0)),
                Sound.ev && Sound.ev("entity.firework_rocket.large_blast", null, 1, 1));
              continue;
            }
            const e = SH.hsl(n.h, 90, 65);
            for (let t = 0; t < 46; t++) {
              const s = (t / 46) * Math.PI * 2,
                i = 40 + 40 * Math.random();
              o.sparks.push({
                x: n.x,
                y: n.y,
                vx: Math.cos(s) * i,
                vy: Math.sin(s) * i,
                t: 0,
                life: 1.2 + 0.6 * Math.random(),
                c: e,
              });
            }
            const s = (t.incoming.length && t.incoming.shift()) || Share.next() || "虚位以待";
            o.names.push({
              name: s,
              x: n.x,
              y: n.y,
              vx: 0,
              vy: -6,
              t: 0,
              life: 2.6,
              k: 2,
              col: SH.hex(n.h, 90, 75),
            });
            for (let t = 0; t < 5; t++) {
              const e = Share.next() || "虚位以待",
                s = (t / 5) * Math.PI * 2 + Math.random();
              o.names.push({
                name: e,
                x: n.x,
                y: n.y,
                vx: 34 * Math.cos(s),
                vy: 26 * Math.sin(s) - 10,
                t: 0,
                life: 2.2,
                k: 1,
                col: SH.hex(n.h + 30 * t, 80, 80),
                g: 1,
              });
            }
          }
        }
        o.rockets = o.rockets.filter((t) => !t.done);
        for (const t of o.sparks) {
          const o = t.hero ? 1 : s;
          ((t.t += e * o),
            (t.vx *= Math.exp(-e * o * 1.8)),
            (t.vy = t.vy * Math.exp(-e * o * 1.8) + 70 * e * o),
            (t.x += t.vx * e * o),
            (t.y += t.vy * e * o));
        }
        o.sparks = o.sparks.filter((t) => t.t < t.life);
        for (const t of o.names)
          ((t.t += e * s),
            (t.x += t.vx * e * s),
            (t.y += t.vy * e * s),
            t.g && (t.vy += 22 * e * s),
            (t.vx *= Math.exp(0.8 * -e)));
        o.names = o.names.filter((t) => t.t < t.life);
        const n = o.hero;
        n &&
          (n.up
            ? o.rockets.includes(n.rocket) || (o.hero = null)
            : ((n.bt += e),
              (n.y -= 4 * e),
              n.skip && n.bt > 0.6 && n.bt < 3.4 && (n.bt = 3.4),
              n.bt > 3.4 && (n.dim = !1),
              n.bt > 4.2 && (o.hero = null)));
      },
      hero(t, e) {
        const o = e.from ? e.from.x : t.w / 2,
          s = e.from ? e.from.y - 6 : t.bot - 14,
          n = t.w / 2,
          i = Math.round(t.top + 0.36 * (t.bot - t.top)),
          h = -Math.sqrt(224 * Math.max(20, s - i) + 900),
          a = { x: o, y: s, vx: (n - o) / ((-h - 30) / 112), vy: h, h: 45, hero: !0 };
        (t.st.rockets.push(a),
          Object.assign(e, { up: !0, rocket: a, bt: 0, dim: !0 }),
          (t.st.hero = e),
          Sound.ev && Sound.ev("entity.firework_rocket.launch", null, 1, 1));
      },
      drawHero(t, e, o) {
        const s = t.st.hero;
        for (const o of t.st.sparks)
          o.hero &&
            ((e.globalAlpha = Math.max(0, 1 - o.t / o.life)),
            (e.fillStyle = o.c),
            e.fillRect(Math.round(o.x), Math.round(o.y), 1, 1));
        if (((e.globalAlpha = 1), !s)) return;
        if (s.up) {
          const t = s.rocket;
          return (
            (e.fillStyle = "#FFF4D0"),
            e.fillRect(Math.round(t.x), Math.round(t.y), 2, 4),
            void SH.text(e, s.name, t.x + 1, t.y + 8, "#FFE94A", 1, 1, !0)
          );
        }
        const n = s.bt,
          i = Math.min(1, n / 0.35),
          h = 0.8 + 1.8 * (1 - Math.pow(1 - i, 3)) + (n > 0.35 ? 0.05 * Math.sin(4 * n) : 0),
          a = n > 3.6 ? Math.max(0, 1 - (n - 3.6) / 0.6) : 1,
          l = Font.width(s.name) * h,
          r = e.createRadialGradient(s.x, s.y, 0, s.x, s.y, l / 2 + 40);
        (r.addColorStop(0, "rgba(255,214,90," + (0.35 * a).toFixed(2) + ")"),
          r.addColorStop(1, "rgba(255,214,90,0)"),
          (e.fillStyle = r),
          e.fillRect(s.x - l / 2 - 44, s.y - l / 2 - 44, l + 88, l + 88),
          SH.text(e, s.name, s.x, s.y - 4 * h, "#FFE94A", h, a, !0),
          n > 0.3 &&
            SH.text(
              e,
              "join" === s.kind
                ? "欢迎你成为第 " + s.no + " 位股东！"
                : "你在这里 · 第 " + s.no + " 位股东",
              s.x,
              s.y + 4 * h + 8,
              "#FFFFFF",
              1,
              a * Math.min(1, 3 * (n - 0.3)),
              !0,
            ));
      },
      draw(t, e, o) {
        const s = e.createLinearGradient(0, 0, 0, t.h);
        (s.addColorStop(0, "#03051A"),
          s.addColorStop(1, "#1C1236"),
          (e.fillStyle = s),
          e.fillRect(0, 0, t.w, t.h));
        for (const [s, n, i] of t.st.sky)
          ((e.fillStyle =
            "rgba(255,255,255," +
            (0.2 + 0.5 * Math.max(0, Math.sin(1.5 * o + 50 * i))).toFixed(2) +
            ")"),
            e.fillRect(Math.floor(s * t.w), Math.floor(n * t.h * 0.7), 1, 1));
        ((e.fillStyle = "#F4F0DA"),
          e.fillRect(t.w - 40, t.top + 4, 10, 10),
          (e.fillStyle = "#E2DCC0"),
          e.fillRect(t.w - 38, t.top + 6, 2, 2),
          e.fillRect(t.w - 34, t.top + 10, 2, 2));
        for (const o of t.st.sparks)
          o.hero ||
            ((e.globalAlpha = Math.max(0, 1 - o.t / o.life)),
            (e.fillStyle = o.c),
            e.fillRect(Math.round(o.x), Math.round(o.y), 1, 1));
        e.globalAlpha = 1;
        for (const o of t.st.rockets)
          o.hero || ((e.fillStyle = "#FFF4D0"), e.fillRect(Math.round(o.x), Math.round(o.y), 1, 3));
        for (const o of t.st.names) {
          const s = Math.min(1, 4 * o.t) * Math.min(1, 1.5 * (o.life - o.t)),
            n = o.name === t.me;
          SH.text(
            e,
            o.name,
            o.x,
            o.y - 4 * o.k,
            n ? "#FFD24A" : o.col,
            o.k + (o.k > 1 ? Math.min(0.4, 0.3 * o.t) : 0),
            s,
            !0,
          );
        }
        const n = t.bot - 6;
        for (let s = 0, i = 0; s < t.w; i++) {
          const t = 10 + 6 * Math.floor(4 * SH.hash("b" + i)),
            h = 8 + 4 * Math.floor(5 * SH.hash("h" + i)),
            a = SH.hash("t" + i) < 0.3;
          ((e.fillStyle = "#0A0814"),
            a
              ? (e.fillRect(s + t / 2 - 1, n - 6, 2, 6), e.fillRect(s + 1, n - 14, t - 2, 9))
              : (e.fillRect(s, n - h, t, h),
                e.fillRect(s + 2, n - h - 3, t - 4, 3),
                SH.hash("w" + i) < 0.6 &&
                  ((e.fillStyle = Math.sin(0.7 * o + i) > -0.6 ? "#FFC860" : "#4A3A20"),
                  e.fillRect(s + 3, n - h + 3, 2, 2))),
            (s += t + 1));
        }
        ((e.fillStyle = "#0A0814"), e.fillRect(0, n, t.w, t.h - n));
      },
    },
  ],
  SHARE_GIFT = "cape:fireworks";
class ShareholdersScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, null),
      (this.parent = e),
      (this.pauses = !1),
      (this.blurBg = !1),
      (this.bgDim = 0),
      (this.si = Math.floor(Math.random() * SHARE_STYLES.length)),
      (this.t0 = performance.now()),
      (this.last = this.t0),
      (this.slow = 0),
      (this.shown = Share.count),
      (this.bump = 0),
      (this.plus = []),
      (this.toast = []),
      (this.incoming = []),
      (this.heroOn = !1),
      (this.note = ""),
      (this.busy = !1),
      (this.st = null),
      this.style().init(this),
      (Share.news.length = 0),
      (this.loading = !0),
      Share.load()
        .catch((t) => {
          Share.err = t.message;
        })
        .then(() => {
          ((this.loading = !1), (this.shown = Share.count));
        }),
      Share.mine().then(() => {
        (this.layout(), this.giftCheck());
      }),
      (this.timer = setInterval(() => {
        document.hidden ||
          Share.poll()
            .then(() => this.took())
            .catch(() => {});
      }, 3e3)));
  }
  close() {
    clearInterval(this.timer);
  }
  style() {
    return SHARE_STYLES[this.si];
  }
  took() {
    const t = Share.count - Math.round(this.shown);
    t > 0 && ((this.bump = 1), this.plus.push({ n: t, t: performance.now() }));
    for (const t of Share.news)
      (this.toast.push({ ...t, t: performance.now() }),
        t.name !== this.me && this.incoming.length < 6 && this.incoming.push(t.name));
    ("danmaku" !== this.style().id && (Share.news.length = 0),
      this.toast.length > 3 && this.toast.splice(0, this.toast.length - 3));
  }
  get me() {
    return Share.me && Share.me.in ? Share.me.name : null;
  }
  layout() {
    const t = this.game.ui,
      e = Math.min(t.w - 12, 360),
      o = Math.floor(t.w / 2 - e / 2),
      s = Math.floor((e - 8) / 3),
      n = t.h - 24,
      i = !(!Share.me || !Share.me.in);
    this.widgets = [
      { x: o, y: n, w: s, h: 20, label: "返回", onClick: () => this.back() },
      {
        x: o + s + 4,
        y: n,
        w: s,
        h: 20,
        gold: !i,
        enabled: !this.busy,
        label: () => (this.busy ? "…" : i ? "第 " + Share.me.no + " 位股东" : "加入股东名单"),
        tip: i
          ? ["你已经在股东名单里了", "再点一下可以退出"]
          : ["用你的 B站 昵称加入股东名单", "入股就送动态披风「烟花夜空」"],
        onClick: () => (i ? this.askLeave() : this.join()),
      },
      {
        x: o + 2 * (s + 4),
        y: n,
        w: s,
        h: 20,
        glowBlue: i,
        enabled: !this.heroOn,
        label: "找到我",
        tip: ["在名单里找到你自己"],
        onClick: () => this.findMe(),
      },
    ];
  }
  back() {
    this.game.ui.open(this.parent || new TitleScreen(this.game));
  }
  onEsc() {
    this.pop ? (this.pop = null) : this.st && this.st.hero ? (this.st.hero.skip = !0) : this.back();
  }
  async join() {
    const t = this.game;
    if (Account.loggedIn) {
      if (!this.busy) {
        ((this.busy = !0), this.layout());
        try {
          (await Share.join(),
            Sound.ev && Sound.ev("entity.player.levelup", null, 0.8, 1),
            "undefined" != typeof Telemetry && Telemetry.count && Telemetry.count("share_join"),
            (this.busy = !1),
            this.layout(),
            this.launch("join"),
            Share.me && Share.me.fresh ? (this.giftWait = { fresh: !0 }) : this.giftCheck());
        } catch (t) {
          ((this.busy = !1), this.say(t.message), this.layout());
        }
      }
    } else
      t.ui.open(
        new LoginScreen(
          t,
          () => {
            (t.ui.open(this), this.join());
          },
          () => t.ui.open(this),
        ),
      );
  }
  giftCheck() {
    if (
      this.giftWait ||
      this.pop ||
      !Share.me ||
      !Share.me.in ||
      "undefined" == typeof Cosmetics ||
      !Cosmetics.has(SHARE_GIFT)
    )
      return;
    let t = !1;
    try {
      t = "1" === localStorage.getItem("mcjs-share-gift");
    } catch (t) {}
    t || (this.giftWait = { fresh: !1, old: !0 });
  }
  giftShow() {
    try {
      localStorage.setItem("mcjs-share-gift", "1");
    } catch (t) {}
    ((this.pop = { id: SHARE_GIFT, old: !!this.giftWait.old, t0: performance.now() }),
      (this.giftWait = null),
      Sound.ev && Sound.ev("entity.firework_rocket.launch", null, 0.8, 1),
      setTimeout(() => {
        this.pop && Sound.ev && Sound.ev("entity.firework_rocket.large_blast", null, 0.7, 1);
      }, 650),
      "undefined" != typeof Telemetry && Telemetry.count && Telemetry.count("share_gift"));
  }
  popButtons() {
    const t = this.game.ui,
      e = Math.floor(t.w / 2),
      o = { x: e - 112, y: Math.floor(t.h / 2) - 78, w: 224, h: 156 };
    return {
      P: o,
      wear: {
        x: e - 106,
        y: o.y + o.h - 26,
        w: 104,
        h: 20,
        label: "去穿上",
        gold: !0,
        act: () => this.wear(),
      },
      ok: {
        x: e + 2,
        y: o.y + o.h - 26,
        w: 104,
        h: 20,
        label: "好的",
        act: () => {
          this.pop = null;
        },
      },
    };
  }
  wear() {
    this.pop = null;
    const t = Cosmetics.openWardrobe(this.game, this, SHARE_GIFT);
    try {
      ((t.look.cape = SHARE_GIFT.split(":")[1]), t.layout(), t.say && t.say("点「保存」就穿上了"));
    } catch (t) {}
  }
  drawPop(t) {
    const e = t.ctx,
      o = (performance.now() - this.pop.t0) / 1e3,
      { P: s, wear: n, ok: i } = this.popButtons(),
      h = Math.min(1, o / 0.4),
      a = 1 - (1 - h) ** 3,
      l = s.x + s.w / 2;
    ((e.fillStyle = "rgba(0,0,0," + (0.6 * a).toFixed(3) + ")"),
      e.fillRect(0, 0, t.w, t.h),
      e.save());
    const r = h < 1 ? 0.6 + 0.4 * a + 0.08 * Math.sin(h * Math.PI) : 1,
      c = s.y + s.h / 2;
    (e.translate(l, c), e.scale(r, r), e.translate(-l, -c), (e.globalAlpha = a));
    const u = e.createLinearGradient(0, s.y, 0, s.y + s.h);
    (u.addColorStop(0, "rgba(8,12,40,0.96)"),
      u.addColorStop(1, "rgba(30,20,70,0.96)"),
      (e.fillStyle = u),
      e.fillRect(s.x, s.y, s.w, s.h),
      (e.fillStyle = "#F2C94C"),
      e.fillRect(s.x, s.y, s.w, 1),
      e.fillRect(s.x, s.y + s.h - 1, s.w, 1),
      e.fillRect(s.x, s.y, 1, s.h),
      e.fillRect(s.x + s.w - 1, s.y, 1, s.h),
      (e.fillStyle = "rgba(242,201,76,0.3)"),
      e.fillRect(s.x + 2, s.y + 2, s.w - 4, 1),
      e.fillRect(s.x + 2, s.y + s.h - 3, s.w - 4, 1));
    for (let t = 0; t < 18; t++) {
      const n = SH.hash("st" + t),
        i = SH.hash("sy" + t),
        h = 0.3 + 0.7 * Math.max(0, Math.sin(2.4 * o + 1.9 * t));
      ((e.fillStyle = "rgba(255,255,255," + (0.7 * h).toFixed(2) + ")"),
        e.fillRect(Math.round(s.x + 6 + n * (s.w - 12)), Math.round(s.y + 6 + 50 * i), 1, 1));
    }
    const d = l,
      p = s.y + 48;
    for (let t = 0; t < 3; t++) {
      const s = ((o + 0.7 * t) % 2.1) / 1.4;
      if (s > 1) continue;
      const n = d + [-46, 44, -6][t],
        i = p + [-14, -6, -26][t],
        h = 4 + 20 * (1 - (1 - s) ** 2),
        a = ["255,226,122", "255,154,200", "124,242,154"][t];
      for (let o = 0; o < 14; o++) {
        const l = (o / 14) * Math.PI * 2 + t;
        ((e.fillStyle = "rgba(" + a + "," + (1 - s).toFixed(2) + ")"),
          e.fillRect(
            Math.round(n + Math.cos(l) * h),
            Math.round(i + Math.sin(l) * h + s * s * 6),
            1,
            1,
          ));
      }
    }
    const y = o < 0.9 ? Math.abs(Math.sin(7 * o)) * (0.9 - o) * 10 : 1.2 * Math.sin(2.2 * o),
      m = Math.round(d - 17.5),
      S = Math.round(p - 28 - y);
    (e.save(),
      (e.shadowColor = "rgba(255,214,110,0.9)"),
      (e.shadowBlur = 10 + 6 * Math.sin(3 * o)),
      (e.fillStyle = "#F2C94C"),
      e.fillRect(m - 2, S - 2, Math.round(35) + 4, 60),
      e.restore(),
      (e.fillStyle = "#FFF2C0"),
      e.fillRect(m - 2, S - 2, Math.round(35) + 4, 1),
      Cosmetics.drawIcon(e, this.pop.id, Math.round(d - 28), S, 56, !1),
      Font.center(
        e,
        this.pop.old ? "感谢你入股！补发一件股东专属装饰" : "入股成功！送你一件股东专属装饰",
        l,
        s.y + 86,
        "#E0E0E0",
      ),
      Font.center(e, "「" + Cosmetics.name(this.pop.id) + "」（动态）", l, s.y + 100, "#FFD24A"),
      Font.center(e, "已经放进衣柜，退出名单也会保留", l, s.y + 112, "#A8A8C8"),
      t.button(n),
      t.button(i),
      e.restore());
  }
  askLeave() {
    const t = this.game;
    t.ui.open(
      new ConfirmScreen(
        t,
        "要退出股东名单吗？",
        "你的名字会从名单里拿掉（以后还可以重新加入）",
        "退出",
        async (e) => {
          if ((t.ui.open(this), e)) {
            try {
              (await Share.leave(), this.say("已经退出股东名单"));
            } catch (t) {
              this.say(t.message);
            }
            this.layout();
          }
        },
      ),
    );
  }
  say(t) {
    ((this.note = t), (this.noteT = performance.now()));
  }
  findMe() {
    this.me
      ? this.launch("find")
      : this.say(Account.loggedIn ? "先点「加入股东名单」，再来找自己" : "先登录，再加入股东名单");
  }
  launch(t) {
    if (!this.me || (this.st && this.st.hero)) return;
    const e = this.widgets && this.widgets[1],
      o = "join" === t && e ? { x: e.x + e.w / 2, y: e.y } : null;
    try {
      this.style().hero(this, { name: this.me, no: Share.me.no, kind: t, from: o });
    } catch (t) {}
    ((this.heroOn = !0), this.layout());
  }
  mouseDown(t, e, o, s) {
    if (this.pop) {
      if (0 === s && performance.now() - this.pop.t0 > 400)
        for (const s of ["wear", "ok"]) {
          const n = this.popButtons()[s];
          if (t.hit(n, e, o)) return (Sound.click(), void n.act());
        }
    } else
      this.st && this.st.hero && 0 === s && !this.widgets.some((s) => t.hit(s, e, o))
        ? (this.st.hero.skip = !0)
        : super.mouseDown(t, e, o, s);
  }
  draw(t) {
    const e = t.ctx,
      o = performance.now(),
      s = Math.min(0.05, (o - this.last) / 1e3),
      n = (o - this.t0) / 1e3;
    this.last = o;
    const i = this;
    ((i.w = t.w), (i.h = t.h), (i.top = 40), (i.bot = t.h - 30));
    const h = this.st && this.st.hero;
    (!!h !== this.heroOn && ((this.heroOn = !!h), this.layout()),
      (this.slow += ((h && h.dim ? 1 : 0) - this.slow) * Math.min(1, 4 * s)));
    const a = this.style();
    try {
      a.step(i, s, n);
    } catch (t) {
      this.st && (this.st.hero = null);
    }
    e.save();
    try {
      a.draw(i, e, n, t);
    } catch (t) {}
    (e.restore(),
      this.slow > 0.02 &&
        ((e.fillStyle = "rgba(0,0,0," + (0.62 * this.slow).toFixed(3) + ")"),
        e.fillRect(0, 0, t.w, t.h)),
      e.save());
    try {
      a.drawHero(i, e, n);
    } catch (t) {}
    (e.restore(), this.drawHead(t, n, s));
    const l = e.createLinearGradient(0, t.h - 34, 0, t.h);
    (l.addColorStop(0, "rgba(0,0,0,0)"),
      l.addColorStop(1, "rgba(0,0,0,0.6)"),
      (e.fillStyle = l),
      e.fillRect(0, t.h - 34, t.w, 34),
      this.note &&
        o - this.noteT < 4e3 &&
        SH.text(
          e,
          fitText(this.note, t.w - 16),
          t.w / 2,
          t.h - 36,
          "#FFD24A",
          1,
          Math.min(1, (4e3 - (o - this.noteT)) / 500),
          !0,
        ),
      this.loading
        ? SH.text(e, "正在读取股东名单…", t.w / 2, t.h / 2, "#E0E0E0", 1, 1, !0)
        : Share.err &&
          !Share.ok &&
          SH.text(e, fitText(Share.err, t.w - 16), t.w / 2, t.h / 2, "#FF7070", 1, 1, !0));
    const r = this.widgets[1],
      c = !(!Share.me || !Share.me.in);
    if (
      r &&
      !c &&
      !this.busy &&
      !(this.note && o - this.noteT < 4e3) &&
      "undefined" != typeof Capes &&
      Capes.get(SHARE_GIFT.split(":")[1])
    ) {
      const t = "入股送动态披风",
        o = Font.width(t),
        s = Math.round(r.x + r.w / 2 - (o + 14) / 2),
        i = r.y - 20,
        h = 0.85 + 0.15 * Math.sin(3 * n);
      ((e.fillStyle = "rgba(8,12,40,0.75)"),
        e.fillRect(s - 3, i - 2, o + 20, 20),
        (e.fillStyle = "#F2C94C"),
        e.fillRect(s - 1, i - 1, 12, 18),
        Capes.drawFlat(e, SHARE_GIFT.split(":")[1], s, i, 1, !1),
        SH.text(e, t, s + 14, i + 5, "#FFD24A", 1, h));
    }
    for (const e of this.widgets) t.button(e);
    if (this.pop) this.drawPop(t);
    else {
      this.giftWait && !h && this.giftShow();
      for (const e of this.widgets)
        e.tip &&
          t.hit(e) &&
          t.tooltip(
            e.tip.map((t) => ({ text: t })),
            t.mouse.x,
            t.mouse.y,
          );
    }
  }
  drawHead(t, e, o) {
    const s = t.ctx,
      n = t.w / 2,
      i = performance.now(),
      h = s.createLinearGradient(0, 0, 0, 44);
    (h.addColorStop(0, "rgba(0,0,0,0.65)"),
      h.addColorStop(1, "rgba(0,0,0,0)"),
      (s.fillStyle = h),
      s.fillRect(0, 0, t.w, 44));
    const a = "股东名单",
      l = 2 * Font.width(a),
      r = Math.round(n - l / 2);
    SH.text(s, a, r, 4, "#F2C94C", 2);
    const c = (((0.5 * e) % 1.6) - 0.3) * (l + 40) - 20;
    (s.save(),
      s.beginPath(),
      s.rect(r + c, 0, 10, 24),
      s.clip(),
      SH.text(s, a, r, 4, "#FFF8D8", 2, 1, !1, !1),
      s.restore(),
      (this.shown += (Share.count - this.shown) * Math.min(1, 3 * o)),
      Math.abs(Share.count - this.shown) < 0.5 && (this.shown = Share.count),
      (this.bump = Math.max(0, this.bump - 2.5 * o)));
    const u = "感谢 " + Math.round(this.shown).toLocaleString("en-US") + " 位股东",
      d = Font.width(u),
      p = 1 + 0.25 * this.bump;
    SH.text(s, u, n, 25 - 4 * (p - 1), this.bump > 0 ? "#FFFFFF" : "#E8E8E8", p, 1, !0);
    const y = Math.round(n + (d * p) / 2 + 6),
      m = 0.5 + 0.5 * Math.sin(i / 300);
    ((s.fillStyle = "rgba(255,60,60," + (0.5 + 0.5 * m).toFixed(2) + ")"),
      s.fillRect(y, 27, 4, 4),
      SH.text(s, "实时", y + 7, 25, "#FF8080", 1, 0.9));
    for (const t of this.plus) {
      const e = (i - t.t) / 1e3;
      SH.text(s, "+" + t.n, n + d / 2 + 36, 22 - 14 * e, "#7CFF7C", 1, 1 - e / 1.4, !0);
    }
    this.plus = this.plus.filter((t) => i - t.t < 1400);
    let S = 44;
    for (const e of this.toast) {
      const o = (i - e.t) / 1e3;
      if (o > 4) continue;
      const n = fitText("欢迎 " + e.name + " 成为第 " + e.no + " 位股东！", 0.6 * t.w),
        h = Font.width(n) + 10,
        a = o < 0.3 ? (1 - o / 0.3) * (h + 8) : o > 3.6 ? ((o - 3.6) / 0.4) * (h + 8) : 0;
      "danmaku" !== this.style().id &&
        ((s.fillStyle = "rgba(40,24,0,0.75)"),
        s.fillRect(t.w - h - 6 + a, S, h, 12),
        (s.fillStyle = "#F2C94C"),
        s.fillRect(t.w - h - 6 + a, S, 2, 12),
        SH.text(s, n, t.w - h - 1 + a, S + 2, "#FFE9A0"),
        (S += 14));
    }
    this.toast = this.toast.filter((t) => i - t.t < 4e3);
  }
}
async function openShareholders(t, e) {
  if (
    "undefined" != typeof Account &&
    Account.loggedIn &&
    Account.data &&
    (Account.data.super || (Account.unlocks && Account.unlocks.follow))
  )
    return void t.ui.open(new ShareholdersScreen(t, e));
  let o = null,
    s = null;
  if ("undefined" != typeof Toy && Toy.following)
    try {
      o = await Toy.following();
    } catch (t) {
      s = t;
    }
  !1 !== o || s || "undefined" == typeof FollowGateScreen
    ? t.ui.open(new ShareholdersScreen(t, e))
    : t.ui.open(
        new FollowGateScreen(
          t,
          e,
          () => t.ui.open(new ShareholdersScreen(t, e)),
          "关注 UP 主「土豆味小哲」后就能进入股东名单",
        ),
      );
}
(() => {
  const t = TitleScreen.prototype.layout;
  TitleScreen.prototype.layout = function () {
    t.call(this);
    const e = this.game,
      o = e.ui;
    if (
      "undefined" == typeof RoomService ||
      !RoomService.base() ||
      "undefined" == typeof Checkin ||
      ("undefined" != typeof Live && !Live.on("title.shareholders"))
    )
      return;
    const s = Checkin.titleRect(o),
      n = this.widgets.find((t) => t.checkin);
    this.widgets.push({
      x: s.x,
      y: n ? n.y + n.h + 4 : s.y,
      w: s.w,
      h: 16,
      label: "股东名单",
      gold: !0,
      tip: ["关注 UP 主后，把你的名字加进股东名单"],
      onClick: () => openShareholders(e, this),
    });
  };
})();
//# sourceURL=js/shareholders.js
