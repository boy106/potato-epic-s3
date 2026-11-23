"use strict";
const Extras = {};
function hudMarker(t, e, s, i, o) {
  const n = t.game,
    a = n.renderer.vp,
    r = n.player;
  if (!a || !r) return;
  const l = e[0] + 0.5,
    h = e[1] + 1,
    c = e[2] + 0.5,
    d = a[0] * l + a[4] * h + a[8] * c + a[12],
    p = a[1] * l + a[5] * h + a[9] * c + a[13],
    u = a[3] * l + a[7] * h + a[11] * c + a[15],
    m = Math.hypot(l - r.pos[0], c - r.pos[2]);
  let y,
    f,
    w = !1;
  if (
    (u > 0.1 && ((y = ((d / u) * 0.5 + 0.5) * t.w), (f = (1 - ((p / u) * 0.5 + 0.5)) * t.h)),
    u <= 0.1 || y < 8 || y > t.w - 8 || f < 20 || f > t.h - 40)
  ) {
    const e = Math.atan2(
        (d / Math.max(Math.abs(u), 0.1)) * Math.sign(u || 1),
        (p / Math.max(Math.abs(u), 0.1)) * Math.sign(u || 1),
      ),
      s = 0.42 * Math.min(t.w, t.h);
    ((y = t.w / 2 + Math.sin(e) * s * (u > 0 ? 1 : -1)),
      (f = t.h / 2 - Math.cos(e) * s * (u > 0 ? 1 : -1)),
      (w = !0));
  }
  ((y = clamp(y, 10, t.w - 10)), (f = clamp(f, 22, t.h - 44)));
  const g = t.ctx,
    F = `${s} ${Math.round(m)}m`;
  if (
    ((g.fillStyle = i),
    g.beginPath(),
    g.moveTo(y, f - 5),
    g.lineTo(y + 4, f),
    g.lineTo(y, f + 5),
    g.lineTo(y - 4, f),
    g.fill(),
    !o || !w)
  ) {
    const t = Font.width(F) + 4;
    ((g.fillStyle = "rgba(0,0,0,0.45)"),
      g.fillRect(Math.round(y - t / 2), Math.round(f + 7), t, 10),
      Font.center(g, F, y, f + 8, i));
  }
}
((() => {
  const t = Game.prototype.onPlayerDeath;
  Game.prototype.onPlayerDeath = function (e) {
    const s = t.call(this, e);
    return (this.lastDeath && (this.lastDeath.at = Date.now()), s);
  };
})(),
  (Extras.drawDeath = function (t) {
    const e = t.game,
      s = e.lastDeath,
      i = e.settings;
    if (
      !s ||
      !s.at ||
      s.dim !== e.dim ||
      !1 === i.deathMarker ||
      (void 0 === i.deathMarker && "new" !== i.playerKind) ||
      e.player.deathTime > 0
    )
      return;
    const o = Math.hypot(s.pos[0] - e.player.pos[0], s.pos[2] - e.player.pos[2]);
    Date.now() - s.at > 3e5 || o < 3
      ? o < 3 && (s.at = 0)
      : hudMarker(t, s.pos, "死亡点", "#FF6060");
  }));
const Minimap = {
    N: 64,
    cv: null,
    img: null,
    at: 0,
    on(t) {
      if (self.POTATO) return !1;
      const e = t.settings;
      return !0 === e.minimap || (void 0 === e.minimap && "new" === e.playerKind);
    },
    rect(t) {
      const e = this.N,
        s = t.safe ? t.safe() : { l: 0, t: 0 };
      return { x: 4 + s.l, y: 4 + s.t, w: e, h: e };
    },
    update(t) {
      const e = this.N,
        s = t.world,
        i = t.player;
      this.cv ||
        ((this.cv = document.createElement("canvas")),
        (this.cv.width = this.cv.height = e),
        (this.ctx = this.cv.getContext("2d")),
        (this.img = this.ctx.createImageData(e, e)));
      const o = this.img.data,
        n = Math.floor(i.pos[0]),
        a = Math.floor(i.pos[2]),
        r = "overworld" !== t.dim,
        l = Math.floor(i.pos[1]);
      let h = new Int16Array(e);
      for (let t = 0; t < e; t++)
        for (let i = 0; i < e; i++) {
          const c = n - e / 2 + i,
            d = a - e / 2 + t,
            p = 4 * (t * e + i);
          if (!s.isLoaded(c, d)) {
            ((o[p] = o[p + 1] = o[p + 2] = 0), (o[p + 3] = 120), (h[i] = 0));
            continue;
          }
          let u = r ? Math.min(l + 1, HEIGHT - 1) : s.surfaceY(c, d, !0) + 1,
            m = 0,
            y = 0;
          if (r) for (; u > 0 && y++ < 40 && 0 !== (m = s.getBlock(c, u, d));) u--;
          do {
            (u--, (m = s.getBlock(c, u, d)), WLOG[m] && (m = WATER));
          } while (u > 0 && (0 === m || 0 === mapColorOf(m, 0)));
          const f = mapColorOf(m, s.getMeta(c, u, d)),
            w = t ? u - h[i] : 0;
          h[i] = u;
          const g = m === WATER ? 1 : w > 0 ? 2 : w < 0 ? 0 : 1,
            F = MAP_PAL[4 * f + g] || [0, 0, 0, 0];
          ((o[p] = F[0]), (o[p + 1] = F[1]), (o[p + 2] = F[2]), (o[p + 3] = 255));
        }
      this.ctx.putImageData(this.img, 0, 0);
    },
    draw(t) {
      const e = t.game;
      if (!this.on(e) || t.hideHud || "play" !== e.state) return;
      const s = performance.now();
      if (s - this.at > 500) {
        this.at = s;
        try {
          this.update(e);
        } catch (t) {
          return;
        }
      }
      const i = t.ctx,
        o = this.rect(t),
        n = this.N,
        a = e.player;
      ((i.fillStyle = "rgba(0,0,0,0.5)"),
        i.fillRect(o.x - 1, o.y - 1, o.w + 2, o.h + 2),
        i.drawImage(this.cv, o.x, o.y, o.w, o.h));
      const at = (t, e) => [
        o.x + (t - Math.floor(a.pos[0]) + n / 2),
        o.y + (e - Math.floor(a.pos[2]) + n / 2),
      ];
      for (const t of Waypoints.list(e)) {
        const [e, s] = at(t.pos[0], t.pos[2]);
        e >= o.x &&
          e < o.x + n &&
          s >= o.y &&
          s < o.y + n &&
          ((i.fillStyle = t.color), i.fillRect(Math.round(e) - 1, Math.round(s) - 1, 3, 3));
      }
      if (e.lastDeath && e.lastDeath.at && e.lastDeath.dim === e.dim) {
        const [t, s] = at(e.lastDeath.pos[0], e.lastDeath.pos[2]);
        t >= o.x &&
          t < o.x + n &&
          s >= o.y &&
          s < o.y + n &&
          ((i.fillStyle = "#FF4040"), i.fillRect(Math.round(t) - 1, Math.round(s) - 1, 3, 3));
      }
      const r = a.yaw,
        l = o.x + n / 2,
        h = o.y + n / 2;
      ((i.fillStyle = "#FFFFFF"),
        i.beginPath(),
        i.moveTo(l - 4 * Math.sin(r), h - 4 * Math.cos(r)),
        i.lineTo(l + 2.5 * Math.cos(r) + 2 * Math.sin(r), h - 2.5 * Math.sin(r) + 2 * Math.cos(r)),
        i.lineTo(l - 2.5 * Math.cos(r) + 2 * Math.sin(r), h + 2.5 * Math.sin(r) + 2 * Math.cos(r)),
        i.fill(),
        Font.draw(i, "北", o.x + n / 2 - 4, o.y + 1, "#FFFFFF"),
        Font.draw(
          i,
          `${Math.floor(a.pos[0])}, ${Math.floor(a.pos[2])}`,
          o.x,
          o.y + n + 3,
          "#E0E0E0",
        ));
    },
  },
  WP_COLORS = ["#55FFFF", "#FFFF55", "#FF55FF", "#55FF55", "#FFAA00", "#FFFFFF"],
  Waypoints = {
    all(t) {
      const e = t.worldMeta;
      return e ? e.waypoints || (e.waypoints = []) : t.netWaypoints || (t.netWaypoints = []);
    },
    list(t) {
      return this.all(t).filter(
        (e) => (e.dim || "overworld") === (t.dim || "overworld") && !1 !== e.show,
      );
    },
    add(t) {
      const e = this.all(t),
        s = t.player,
        i = {
          name: e.length ? "路标 " + (e.length + 1) : "家",
          pos: s.pos.map(Math.floor),
          dim: t.dim || "overworld",
          color: WP_COLORS[e.length % WP_COLORS.length],
        };
      (e.push(i),
        t.ui.message(
          `已添加路标“${i.name}”（${i.pos[0]}, ${i.pos[1] + ("number" == typeof MIN_Y ? MIN_Y : 0)}, ${i.pos[2]}）：N 键管理`,
          i.color,
        ));
    },
  };
class WaypointScreen extends FormScreen {
  constructor(t) {
    (super(t, "路标", null), (this.pauses = !1), (this.edit = -1), (this.name = ""));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      s = this.game,
      i = Waypoints.all(s);
    ((this.fields = {}),
      (this.widgets = []),
      i.slice(0, 7).forEach((t, o) => {
        const n = 36 + 22 * o;
        this.edit === o
          ? (this.addField("name", e - 150, n, 150, "", 16),
            this.widgets.push({
              x: e + 4,
              y: n,
              w: 50,
              h: 20,
              label: "确定",
              onClick: () => {
                ((t.name = this.name.trim() || t.name),
                  (this.edit = -1),
                  s.ui.hideInput(),
                  this.layout());
              },
            }))
          : this.widgets.push(
              {
                x: e + 4,
                y: n,
                w: 46,
                h: 20,
                label: "改名",
                onClick: () => {
                  ((this.edit = o), (this.name = t.name), this.layout());
                },
              },
              {
                x: e + 54,
                y: n,
                w: 46,
                h: 20,
                label: !1 === t.show ? "显示" : "隐藏",
                onClick: () => {
                  ((t.show = !1 === t.show), this.layout());
                },
              },
              {
                x: e + 104,
                y: n,
                w: 46,
                h: 20,
                label: "删除",
                onClick: () => {
                  (i.splice(o, 1), this.layout());
                },
              },
            );
      }),
      this.widgets.push(
        {
          x: e - 150,
          y: t.h - 52,
          w: 148,
          h: 20,
          label: "在这里加一个路标",
          onClick: () => {
            (Waypoints.add(s), this.layout());
          },
        },
        {
          x: e + 2,
          y: t.h - 52,
          w: 148,
          h: 20,
          label: () => "小地图：" + (Minimap.on(s) ? "开" : "关"),
          onClick: () => {
            ((s.settings.minimap = !Minimap.on(s)), s.saveSettings());
          },
        },
        {
          x: e - 100,
          y: t.h - 28,
          w: 200,
          h: 20,
          label: "完成",
          onClick: () => {
            (s.ui.hideInput(), s.ui.close());
          },
        },
      ),
      this.edit >= 0 && this.focus("name"));
  }
  drawExtra(t) {
    const e = t.ctx,
      s = t.w / 2,
      i = this.game,
      o = Waypoints.all(i),
      n = i.player;
    (o.length || Font.center(e, "还没有路标：按 B 在脚下添加，或点下面的按钮", s, 50, "#A0A0A0"),
      o.slice(0, 7).forEach((t, o) => {
        if (this.edit === o) return;
        const a = 36 + 22 * o,
          r = Math.round(Math.hypot(t.pos[0] - n.pos[0], t.pos[2] - n.pos[2]));
        ((e.fillStyle = t.color),
          e.fillRect(s - 150, a + 6, 6, 6),
          Font.draw(e, fitText(t.name, 80), s - 140, a + 6, "#FFFFFF"),
          Font.draw(
            e,
            (t.dim || "overworld") === (i.dim || "overworld")
              ? r + "m"
              : { nether: "下界", end: "末地", overworld: "主世界" }[t.dim],
            s - 52,
            a + 6,
            "#A0A0A0",
          ));
      }),
      this.drawFields(t));
  }
  onEsc() {
    (this.game.ui.hideInput(), this.game.ui.close());
  }
}
const Marks = {
  list: [],
  add(t, e, s) {
    ((this.list = this.list.filter((e) => e.name !== t)),
      this.list.push({ name: t, pos: e, color: s || "#FFD24A", at: performance.now() }));
  },
  place(t) {
    if (!t.net) return void Waypoints.add(t);
    const e = t.target,
      s = e ? [...e.pos] : t.player.pos.map(Math.floor);
    (t.net.send({ t: "mark", pos: s }),
      this.add(t.net.name || "我", s, "#55FF55"),
      Sound.click && Sound.click());
  },
  draw(t) {
    const e = performance.now();
    this.list = this.list.filter((t) => e - t.at < 3e4);
    for (const e of this.list) hudMarker(t, e.pos, e.name, e.color, !0);
  },
};
((() => {
  const t = UI.prototype.drawHUD;
  ((UI.prototype.drawHUD = function () {
    t.call(this);
    const e = this.game;
    if ("play" === e.state && !this.hideHud)
      try {
        (Minimap.draw(this), Extras.drawDeath(this));
        for (const t of Waypoints.list(e))
          Math.hypot(t.pos[0] - e.player.pos[0], t.pos[2] - e.player.pos[2]) > 4 &&
            hudMarker(this, t.pos, t.name, t.color, !0);
        (Marks.draw(this), Extras.drawNet(this), Extras.drawPlayerList(this));
      } catch (t) {}
  }),
    addEventListener("keydown", (t) => {
      const e = "undefined" != typeof game && game;
      e &&
        "play" === e.state &&
        !e.ui.screen &&
        document.activeElement !== e.ui.input &&
        ((self.POTATO && /^Key[BNGJ]$/.test(t.code)) ||
          ("KeyB" === t.code
            ? Waypoints.add(e)
            : "KeyN" === t.code
              ? e.ui.open(new WaypointScreen(e))
              : "KeyG" === t.code
                ? Marks.place(e)
                : "KeyJ" === t.code
                  ? e.ui.open(new ItemDexScreen(e, null))
                  : "Tab" === t.code
                    ? ((Extras.tabHeld = !0), t.preventDefault())
                    : "F2" === t.code && (t.preventDefault(), Photo.take(e))));
    }),
    addEventListener("keyup", (t) => {
      "Tab" === t.code && (Extras.tabHeld = !1);
    }));
  const e = TouchControls.prototype.startPlay;
  TouchControls.prototype.startPlay = function (t) {
    const s = this.g,
      i = Minimap.rect(this.ui);
    return Minimap.on(s) && t.x >= i.x && t.x < i.x + i.w && t.y >= i.y && t.y < i.y + i.h
      ? ((t.kind = "button"), void (t.btn = "minimap"))
      : e.call(this, t);
  };
  const s = TouchControls.prototype.button;
  TouchControls.prototype.button = function (t) {
    "minimap" === t ? this.g.ui.open(new WaypointScreen(this.g)) : s.call(this, t);
  };
  const i = NetClient.prototype.onMessage;
  NetClient.prototype.onMessage = function (t) {
    if (t && "mark" === t.t && Array.isArray(t.pos) && 3 === t.pos.length)
      return (
        Marks.add(
          String(t.name || "?").slice(0, 16),
          t.pos.map((t) => 0 | t),
        ),
        Sound.ev && Sound.ev("block.note_block.pling", null, 0.6, 1.5),
        void this.g.ui.message(`${t.name} 标记了一个位置`, "#FFD24A")
      );
    if (t && "pong" === t.t && "string" == typeof t.i && "x" === t.i[0]) {
      const e = this.myPings && this.myPings.get(t.i);
      return void (
        e && (this.myPings.delete(t.i), (this.ping = Math.round(performance.now() - e)))
      );
    }
    return i.call(this, t);
  };
})(),
  setInterval(() => {
    const t = "undefined" != typeof game && game,
      e = t && t.net;
    if (!e || e.closed) return;
    const s = "x" + (e.pingN = (e.pingN || 0) + 1);
    ((e.myPings || (e.myPings = new Map())).set(s, performance.now()),
      e.myPings.size > 5 && e.myPings.delete(e.myPings.keys().next().value),
      e.send({ t: "ping", i: s }));
  }, 5e3),
  (Extras.drawNet = function (t) {
    const e = t.game.net;
    if (!e) return;
    const s = e.ping,
      i = void 0 !== s && s > 300,
      o = t.w - 30,
      n = (t.touch && t.touch.on() ? t.touch.topInset() : 0) + 4;
    if (!i && !Extras.tabHeld) return;
    const a = void 0 === s ? 0 : s < 150 ? 4 : s < 300 ? 3 : s < 600 ? 2 : 1,
      r = t.ctx;
    for (let t = 0; t < 4; t++)
      ((r.fillStyle = t < a ? (a <= 2 ? "#FF5555" : "#55FF55") : "#404040"),
        r.fillRect(o + 4 * t, n + 8 - 2 * t, 3, 2 + 2 * t));
    Font.draw(
      r,
      void 0 === s ? "…" : s + "ms",
      o - Font.width(String(s) + "ms") - 3,
      n + 1,
      i ? "#FF8080" : "#E0E0E0",
    );
  }));
class ReconnectScreen extends MenuScreen {
  constructor(t, e, s) {
    (super(t, "游戏正在更新中"),
      (this.n = e),
      (this.go = s),
      (this.pauses = !1),
      (this.t0 = performance.now()),
      (this.wait = Math.min(15, 2 * e)),
      (this.timer = setTimeout(() => {
        this.game.ui.screen === this && s();
      }, 1e3 * this.wait)));
  }
  layout() {
    const t = this.game.ui;
    this.widgets = [
      {
        x: t.w / 2 - 100,
        y: t.h / 2 + 20,
        w: 200,
        h: 20,
        label: "不等了，回标题画面",
        onClick: () => {
          (clearTimeout(this.timer),
            (this.game.reconnect = null),
            this.game.ui.open(new TitleScreen(this.game)));
        },
      },
    ];
  }
  drawExtra(t) {
    const e = Math.max(0, Math.ceil(this.wait - (performance.now() - this.t0) / 1e3));
    Font.center(
      t.ctx,
      `请稍后，${e > 0 ? e + " 秒后" : "正在"}自动重新连接（第 ${this.n} 次，最多 5 次）…`,
      t.w / 2,
      t.h / 2 - 10,
      "#FFFFFF",
    );
  }
  onEsc() {}
}
((() => {
  const t = NetClient.prototype.fail;
  NetClient.prototype.fail = function (e) {
    const s = this.g,
      i = this.opts && this.opts.room;
    if (
      !this.closed &&
      i &&
      "游戏正在更新中…请稍后" === e &&
      (this.joined || s.reconnect) &&
      ((s.reconnect && s.reconnect.n) || 0) < 5
    ) {
      this.closed = !0;
      const t = ((s.reconnect && s.reconnect.n) || 0) + 1,
        e = this.name;
      return (
        (s.reconnect = { room: i, n: t }),
        s.leaveServer(),
        Telemetry.count && Telemetry.count("net:reconnect"),
        void s.ui.open(new ReconnectScreen(s, t, () => s.joinRoom(i, e)))
      );
    }
    return ((s.reconnect = null), t.call(this, e));
  };
  const e = NetClient.prototype.onMessage;
  NetClient.prototype.onMessage = function (t) {
    return (
      t &&
        "room" === t.t &&
        ((this.joined = !0),
        this.g.reconnect &&
          (this.g.ui.message("已重新连接", "#55FF55"), (this.g.reconnect = null))),
      e.call(this, t)
    );
  };
})(),
  (Extras.drawPlayerList = function (t) {
    const e = t.game,
      s = e.net;
    if (!Extras.tabHeld || !s) return;
    const i = s.room,
      o =
        (i && i.players) ||
        [...new Set(e.entities.filter((t) => "player" === t.type).map((t) => t.name))].concat([
          s.name,
        ]),
      n = t.ctx,
      a = Math.min(o.length, 12),
      r = Math.floor(t.w / 2 - 90);
    ((n.fillStyle = "rgba(0,0,0,0.6)"),
      n.fillRect(r, 20, 180, 10 * a + 16),
      Font.center(n, i ? `${i.name}（${o.length}/${i.max}）` : "在线玩家", t.w / 2, 23, "#FFFF55"),
      o.slice(0, a).forEach((t, e) => {
        (Font.draw(
          n,
          t + (i && t === i.owner ? "（房主）" : "") + (t === s.name ? "（你）" : ""),
          r + 4,
          34 + 10 * e,
          "#FFFFFF",
        ),
          t === s.name &&
            void 0 !== s.ping &&
            Font.draw(
              n,
              s.ping + "ms",
              r + 180 - 4 - Font.width(s.ping + "ms"),
              34 + 10 * e,
              s.ping > 300 ? "#FF8080" : "#80FF80",
            ));
      }));
  }));
const sortKey = (t) => {
  const e = ITEMS[t.id];
  return 1e5 * (e.armor ? 2 : e.durability ? 1 : e.food ? 4 : BLOCKS[e.block] ? 5 : 3) + t.id;
};
function sortSlots(t) {
  const e = t.map((t) => t.get()).filter(Boolean),
    s = [];
  for (const t of e) {
    const e = s.find(
      (e) =>
        e.id === t.id &&
        e.count < maxStack(e.id) &&
        JSON.stringify({ ...e, count: 0 }) === JSON.stringify({ ...t, count: 0 }),
    );
    if (e) {
      const i = Math.min(maxStack(e.id) - e.count, t.count);
      ((e.count += i), (t.count -= i), t.count && s.push(t));
    } else s.push(t);
  }
  (s.sort((t, e) => sortKey(t) - sortKey(e)), t.forEach((t, e) => t.set(s[e] || null)));
}
((() => {
  const t = ContainerScreen.prototype.drawSlots;
  ContainerScreen.prototype.drawSlots = function (e) {
    if ((t.call(this, e), this.net || this.game.net || this instanceof CreativeScreen)) return;
    const s = (this.sortRect = { x: this.x + this.gw - 22, y: this.y - 14, w: 20, h: 12 }),
      i = e.hit(s),
      o = e.ctx;
    if (
      ((o.fillStyle = i ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.45)"),
      o.fillRect(s.x, s.y, s.w, s.h),
      Font.center(o, "整理", s.x + s.w / 2, s.y + 2, "#FFFFFF"),
      self.POTATO)
    )
      this.dexRect = null;
    else {
      const t = (this.dexRect = { x: this.x + this.gw - 46, y: this.y - 14, w: 22, h: 12 });
      ((o.fillStyle = e.hit(t) ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.45)"),
        o.fillRect(t.x, t.y, t.w, t.h),
        Font.center(o, "图鉴", t.x + t.w / 2, t.y + 2, "#FFFFFF"));
    }
    i &&
      e.tooltip(
        [
          { text: "整理：合并同样的物品，按种类排好" },
          { text: "（只整理背包里的格子；箱子里点箱子那半边）", color: "#A0A0A0" },
        ],
        e.mouse.x,
        e.mouse.y,
      );
  };
  const e = UI.prototype.mouseDown;
  ((UI.prototype.mouseDown = function (t) {
    const s = this.screen;
    if (!(s instanceof ContainerScreen) || this.game.net || s instanceof CreativeScreen)
      return e.call(this, t);
    const [i, o] = this.toGui(t),
      hit = (t) => t && i >= t.x && i < t.x + t.w && o >= t.y && o < t.y + t.h;
    if (hit(s.dexRect)) this.open(new ItemDexScreen(this.game, s));
    else {
      if (!hit(s.sortRect)) return e.call(this, t);
      s.sortNow();
    }
  }),
    (ContainerScreen.prototype.sortNow = function () {
      {
        const t = this.slots.filter((t) => "main" === t.group),
          e = this.slots.filter((t) => !t.group && !t.output && void 0 !== t.get && !t.accept);
        (sortSlots(e.length >= 9 ? e : t),
          this.changed && this.changed(),
          Sound.click && Sound.click());
      }
    }));
})(),
  (() => {
    const t = Game.prototype.tick;
    Game.prototype.tick = function (...e) {
      const s = t.apply(this, e);
      if (
        "play" === this.state &&
        this.tickCount % 10 == 0 &&
        !1 !== this.settings.durabilityWarn
      ) {
        const t = this.player && this.player.inv.held,
          e = t && ITEMS[t.id];
        if (e && e.durability && e.durability >= 32) {
          const s = e.durability - (t.dmg || 0);
          s <= Math.max(5, 0.05 * e.durability) &&
            t.warned !== s &&
            ((t.warned = s),
            this.ui.pinMessage(`${e.cn || e.key}快坏了：只剩 ${s} 点耐久`, 3e3, "#FF8040"));
        }
      }
      return s;
    };
  })());
class ItemDexScreen extends FormScreen {
  constructor(t, e) {
    (super(t, "物品图鉴", e),
      (this.titleY = 6),
      (this.q = ""),
      (this.page = 0),
      (this.sel = null),
      (this.rpage = 0),
      (this.all = ITEMS.map((t, e) => t && e).filter(
        (t) =>
          null != t &&
          ITEMS[t].key &&
          !/^(air|.*_wall_.*|potted_.*)$/.test(ITEMS[t].key) &&
          !1 !== ITEMS[t].creative,
      )));
  }
  get pauses() {
    return "play" === this.game.state && !this.game.net;
  }
  shown() {
    const t = this.q.trim().toLowerCase();
    return t
      ? this.all.filter((e) => {
          const s = ITEMS[e];
          return s.key.includes(t) || (s.cn || "").includes(t);
        })
      : this.all;
  }
  grid() {
    const t = this.game.ui;
    return {
      cols: Math.max(4, Math.floor((t.w / 2 - 20) / 18)),
      rows: Math.max(3, Math.floor((t.h - 70) / 18)),
      x: 10,
      y: 44,
    };
  }
  layout() {
    const t = this.game.ui,
      e = this.grid(),
      s = e.cols * e.rows,
      i = Math.max(1, Math.ceil(this.shown().length / s));
    ((this.page = clamp(this.page, 0, i - 1)),
      (this.fields = {}),
      this.addField("q", 10, 20, 18 * e.cols, "", 24, (t) => ((this.page = 0), t)),
      (this.widgets = [
        {
          x: 10,
          y: t.h - 24,
          w: 30,
          h: 18,
          label: "<",
          enabled: this.page > 0,
          onClick: () => {
            (this.page--, this.layout());
          },
        },
        {
          x: 44,
          y: t.h - 24,
          w: 30,
          h: 18,
          label: ">",
          enabled: this.page < i - 1,
          onClick: () => {
            (this.page++, this.layout());
          },
        },
        { x: t.w - 70, y: t.h - 24, w: 60, h: 18, label: "完成", onClick: () => this.back() },
      ]));
    const o = this.recipes();
    (o.length > 1 &&
      this.widgets.push(
        {
          x: t.w / 2 + 10,
          y: t.h - 24,
          w: 30,
          h: 18,
          label: "<",
          enabled: this.rpage > 0,
          onClick: () => {
            this.rpage--;
          },
        },
        {
          x: t.w / 2 + 44,
          y: t.h - 24,
          w: 30,
          h: 18,
          label: ">",
          enabled: this.rpage < o.length - 1,
          onClick: () => {
            this.rpage++;
          },
        },
      ),
      this.focus("q"));
  }
  back() {
    (this.game.ui.hideInput(), this.parent ? this.game.ui.open(this.parent) : this.game.ui.close());
  }
  onEsc() {
    this.back();
  }
  recipes() {
    const t = this.sel;
    if (null === t) return [];
    const e = [];
    for (const s of RECIPES) s.result === t && e.push({ kind: "craft", r: s });
    for (const s in SMELTING) SMELTING[s].result === t && e.push({ kind: "smelt", from: +s });
    SMELTING[t] && e.push({ kind: "smeltInto", to: SMELTING[t].result });
    for (const s of RECIPES)
      if (
        s.result !== t &&
        ("shaped" === s.type
          ? Object.values(s.keys).some((e) => e.includes(t))
          : s.ing.some((e) => e.includes(t))) &&
        (e.push({ kind: "use", r: s }), e.length > 60)
      )
        break;
    return e;
  }
  mouseDown(t, e, s, i) {
    const o = this.grid(),
      n = this.shown(),
      a = o.cols * o.rows,
      r = Math.floor((e - o.x) / 18),
      l = Math.floor((s - o.y) / 18);
    if (r >= 0 && r < o.cols && l >= 0 && l < o.rows && e >= o.x) {
      const t = n[this.page * a + l * o.cols + r];
      if (void 0 !== t)
        return (
          (this.sel = t),
          (this.rpage = 0),
          this.layout(),
          void (Sound.click && Sound.click())
        );
    }
    if (this.slotHits)
      for (const t of this.slotHits)
        if (e >= t.x && e < t.x + 16 && s >= t.y && s < t.y + 16 && void 0 !== t.id)
          return ((this.sel = t.id), (this.rpage = 0), void this.layout());
    super.mouseDown(t, e, s, i);
  }
  wheel(t) {
    const e = this.grid(),
      s = e.cols * e.rows,
      i = Math.ceil(this.shown().length / s);
    ((this.page = clamp(this.page - t, 0, i - 1)), this.layout());
  }
  drawExtra(t) {
    const e = t.ctx,
      s = this.grid(),
      i = this.shown(),
      o = s.cols * s.rows;
    (this.drawFields(t),
      this.q ||
        "q" === this.field ||
        Font.draw(e, "搜索物品（中文名或英文 id）", 14, 26, "#707070"),
      (e.fillStyle = "rgba(0,0,0,0.4)"),
      e.fillRect(s.x - 1, s.y - 1, 18 * s.cols + 2, 18 * s.rows + 2),
      i.slice(this.page * o, this.page * o + o).forEach((i, o) => {
        const n = s.x + (o % s.cols) * 18,
          a = s.y + 18 * Math.floor(o / s.cols);
        (i === this.sel && ((e.fillStyle = "rgba(255,255,255,0.35)"), e.fillRect(n, a, 18, 18)),
          t.drawItem({ id: i, count: 1 }, n + 1, a + 1));
      }),
      Font.draw(e, `${i.length} 个物品`, 80, t.h - 19, "#A0A0A0"));
    const n = Math.floor(t.w / 2) + 10,
      a = t.w - n - 10;
    if (((this.slotHits = []), null === this.sel))
      return void Font.draw(e, "点左边的物品，看它怎么合成、能做什么", n, 50, "#A0A0A0");
    const r = ITEMS[this.sel];
    (t.drawItem({ id: this.sel, count: 1 }, n, 24),
      Font.draw(e, fitText(r.cn || r.key, a - 22), n + 20, 24, "#FFFFFF"),
      Font.draw(e, r.key, n + 20, 34, "#707070"));
    const l = this.recipes();
    if (!l.length)
      return void Font.draw(e, "不能合成：在世界里找到或者从生物身上获得", n, 56, "#A0A0A0");
    this.rpage = clamp(this.rpage, 0, l.length - 1);
    const h = l[this.rpage],
      c = 62,
      slot = (s, i, o) => {
        ((e.fillStyle = "#8B8B8B"),
          e.fillRect(i - 1, o - 1, 18, 18),
          null != s &&
            (t.drawItem({ id: s, count: 1 }, i, o), this.slotHits.push({ x: i, y: o, id: s })));
      },
      cyc = (t) => (t && t.length ? t[Math.floor(performance.now() / 1e3) % t.length] : void 0);
    if (
      (Font.draw(
        e,
        { craft: "合成（工作台）", smelt: "烧炼（熔炉）", smeltInto: "烧炼成", use: "可以用来做" }[
          h.kind
        ] + `　${this.rpage + 1}/${l.length}`,
        n,
        50,
        "#FFD24A",
      ),
      "craft" === h.kind || "use" === h.kind)
    ) {
      const t = h.r;
      for (let e = 0; e < 3; e++)
        for (let s = 0; s < 3; s++) {
          let i;
          if ("shaped" === t.type) {
            const o = t.pattern[e] && t.pattern[e][s];
            i = o && " " !== o ? cyc(t.keys[o]) : void 0;
          } else {
            const o = 3 * e + s;
            i = t.ing[o] ? cyc(t.ing[o]) : void 0;
          }
          slot(i, n + 18 * s, c + 18 * e);
        }
      (Font.draw(e, "→", n + 58, 84, "#FFFFFF"),
        slot(t.result, n + 72, 80),
        t.count > 1 && Font.draw(e, "×" + t.count, n + 92, 84, "#FFFFFF"));
    } else
      (slot("smelt" === h.kind ? h.from : this.sel, n, 80),
        Font.draw(e, "→ 熔炉 →", n + 22, 84, "#FFFFFF"),
        slot("smelt" === h.kind ? this.sel : h.to, n + 70, 80));
    Font.draw(
      e,
      fitText("点格子里的物品可以查看它；带标签的格子会轮流显示能用的物品", a),
      n,
      124,
      "#707070",
    );
  }
}
(() => {
  RoomScreen.prototype.rows = function () {
    return Math.max(
      2,
      Math.floor((this.game.ui.h - 108 - 56 - (this.R && this.R.isOwner ? 22 : 0)) / 22),
    );
  };
  const t = RoomScreen.prototype.layout;
  RoomScreen.prototype.layout = function () {
    t.call(this);
    const e = this.R,
      s = this.game;
    if (!e || !e.isOwner) return;
    const i = s.ui,
      o = i.w / 2,
      n = i.h - 76,
      cmd = (t, e) => {
        (s.net.chat(t), this.say(e));
      },
      rule = (t, e) => {
        for (const e of ["overworld", "the_nether", "the_end"])
          s.net.chat("/execute in minecraft:" + e + " run gamerule " + t);
        this.say(e);
      },
      a = this.quick || (this.quick = { keep: !0, pvp: !0, diff: 2 }),
      r = ["peaceful", "easy", "normal", "hard"],
      l = ["和平", "简单", "普通", "困难"];
    this.widgets.push(
      {
        x: o - 160,
        y: n,
        w: 62,
        h: 18,
        label: () => "死亡不掉落：" + (a.keep ? "开" : "关"),
        onClick: () => {
          ((a.keep = !a.keep),
            rule("keep_inventory " + a.keep, a.keep ? "死亡不掉落：开" : "死亡不掉落：关"));
        },
      },
      {
        x: o - 96,
        y: n,
        w: 40,
        h: 18,
        label: "白天",
        onClick: () => cmd("/time set day", "已经设成白天"),
      },
      {
        x: o - 54,
        y: n,
        w: 40,
        h: 18,
        label: "晴天",
        onClick: () => cmd("/weather clear", "已经放晴"),
      },
      {
        x: o - 12,
        y: n,
        w: 70,
        h: 18,
        label: () => "难度：" + l[a.diff],
        onClick: () => {
          ((a.diff = (a.diff + 1) % 4), cmd("/difficulty " + r[a.diff], "难度：" + l[a.diff]));
        },
      },
      {
        x: o + 60,
        y: n,
        w: 50,
        h: 18,
        label: () => "PVP：" + (a.pvp ? "开" : "关"),
        onClick: () => {
          ((a.pvp = !a.pvp), rule("pvp " + a.pvp, a.pvp ? "玩家可以互相伤害" : "玩家不能互相伤害"));
        },
      },
    );
  };
})();
const Photo = {
  async take(t) {
    const e = t.ui,
      s = e.hideHud;
    ((e.hideHud = !0), (e.screen = null), t.render(1, performance.now()));
    const i = t.canvas,
      o = 960,
      n = Math.round((o * i.height) / i.width),
      a = document.createElement("canvas");
    ((a.width = o), (a.height = n + 64));
    const r = a.getContext("2d");
    (r.drawImage(i, 0, 0, o, n),
      (e.hideHud = s),
      (r.fillStyle = "#1B1B1B"),
      r.fillRect(0, n, o, 64),
      (r.fillStyle = "#FFFFFF"),
      (r.font = "bold 22px sans-serif"),
      r.fillText("土豆史诗 · POTATO EPIC", 16, n + 30),
      (r.fillStyle = "#A0A0A0"),
      (r.font = "15px sans-serif"),
      r.fillText(
        (("undefined" != typeof Account && Account.name) || "") +
          " 拍摄 · 在 B站 搜索 土豆史诗 就能玩",
        16,
        n + 52,
      ));
    try {
      const t = await Toy.qrCode("index.html", 120);
      if (t && t.base64) {
        const e = new Image();
        (await new Promise((s) => {
          ((e.onload = s),
            (e.onerror = s),
            (e.src = t.base64.startsWith("data:")
              ? t.base64
              : "data:image/png;base64," + t.base64));
        }),
          (r.fillStyle = "#FFFFFF"),
          r.fillRect(898, n + 4, 56, 56),
          r.drawImage(e, 900, n + 6, 52, 52));
      }
    } catch (t) {}
    (t.ui.open(new PhotoScreen(t, a)), Sound.ev && Sound.ev("ui.button.click", null, 1, 2));
  },
};
class PhotoScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, null),
      (this.cv = e),
      (this.pauses = !t.net),
      (this.blurBg = !1),
      (this.bgDim = 0.6),
      (this.note = ""),
      (this.inToy = null),
      Toy.ready().then((t) => {
        ((this.inToy = t), this.game.ui.screen === this && this.layout());
      }));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2;
    this.widgets = [
      {
        x: e - 152,
        y: t.h - 26,
        w: 98,
        h: 20,
        gold: !0,
        label: "分享",
        enabled: !0 === this.inToy,
        tip: this.inToy ? ["分享到 B站"] : ["在 B站 App 或网页里才能分享"],
        onClick: () => this.share(),
      },
      { x: e - 50, y: t.h - 26, w: 98, h: 20, label: "保存图片", onClick: () => this.save() },
      { x: e + 52, y: t.h - 26, w: 100, h: 20, label: "关闭", onClick: () => this.game.ui.close() },
    ];
  }
  data() {
    return this.cv.toDataURL("image/jpeg", 0.88);
  }
  async share() {
    try {
      (await Toy.sharePicture({ base64Data: this.data(), title: "土豆史诗 截图" }),
        (this.note = "已打开分享"),
        Telemetry.count && Telemetry.count("photo_share"));
    } catch (t) {
      this.note = Toy.explain(t);
    }
  }
  async save() {
    if (this.inToy)
      try {
        return (
          await Toy.saveImage({ base64Data: this.data() }),
          void (this.note = "已保存到相册")
        );
      } catch (t) {}
    const t = document.createElement("a");
    ((t.href = this.data()),
      (t.download = "PotatoEpic-" + Date.now() + ".jpg"),
      t.click(),
      (this.note = "已下载"));
  }
  drawExtra(t) {
    const e = t.ctx,
      s = t.w - 40,
      i = Math.min(t.h - 50, (s * this.cv.height) / this.cv.width),
      o = (i * this.cv.width) / this.cv.height;
    ((e.imageSmoothingEnabled = !0),
      e.drawImage(this.cv, Math.round(t.w / 2 - o / 2), 10, Math.round(o), Math.round(i)),
      (e.imageSmoothingEnabled = !1),
      this.note && Font.center(e, this.note, t.w / 2, t.h - 38, "#80FF80"));
  }
  onEsc() {
    this.game.ui.close();
  }
}
((() => {
  let t = 0,
    e = 0,
    s = performance.now();
  setInterval(() => {
    const i = "undefined" != typeof game && game,
      o = i && i.settings,
      n = i && i.pacer;
    if (!(i && n && "play" === i.state && o && !1 !== o.autoQuality && i.fps))
      return void (s = performance.now());
    const a = performance.now(),
      r = a - s;
    if (((s = a), n.afk || a - n.cappedT < 2500 || document.hidden)) return;
    const l = Math.min(n.playLimit || 1e3, n.hz, 60),
      h = !o.dynRes || ("undefined" != typeof DynRes && (DynRes.scale <= 0.55 || DynRes.cpuBound));
    i.fps < 0.6 * l && h
      ? ((t += r), (e = 0))
      : i.fps > 0.95 * l
        ? ((e += r), (t = Math.max(0, t - r)))
        : ((t = Math.max(0, t - r / 2)), (e = 0));
    const c = o.autoDistBase || o.renderDist;
    t > 2e4 && o.renderDist > 4
      ? ((o.autoDistBase = c),
        (o.renderDist = Math.max(4, o.renderDist - 2)),
        i.applySettings(),
        (t = 0),
        i.ui.message(
          `画面有点卡：渲染距离自动降到 ${o.renderDist} 个区块（视频设置里可以关掉自动画质）`,
          "#FFAA00",
        ))
      : e > 6e4 &&
        o.autoDistBase &&
        o.renderDist < o.autoDistBase &&
        ((o.renderDist = Math.min(o.autoDistBase, o.renderDist + 2)),
        i.applySettings(),
        (e = 0),
        o.renderDist >= o.autoDistBase && delete o.autoDistBase,
        i.ui.message(`又流畅了：渲染距离回到 ${o.renderDist} 个区块`, "#AAAAAA"));
  }, 2e3);
  const i = OptionsListScreen.prototype.options;
  OptionsListScreen.prototype.options = function () {
    const t = i.call(this);
    if ("video" !== this.page) return t;
    const e = this.game.settings,
      s = this.game;
    return (
      t.splice(1, 0, {
        label: () => "自动画质：" + (!1 === e.autoQuality ? "关" : "开"),
        tip: ["帧率长时间太低时自动降低渲染距离，流畅后再调回来"],
        onClick: () => {
          ((e.autoQuality = !1 === e.autoQuality),
            !1 === e.autoQuality &&
              e.autoDistBase &&
              ((e.renderDist = e.autoDistBase), delete e.autoDistBase, s.applySettings()),
            s.saveSettings());
        },
      }),
      t
    );
  };
})(),
  (() => {
    const t = Game.prototype.saveWorld;
    Game.prototype.saveWorld = async function (e) {
      if (this.worldMeta && "play" === this.state) {
        const t = performance.now();
        ((this.worldMeta.playMs = (this.worldMeta.playMs || 0) + (t - (this.playFrom || t))),
          (this.playFrom = t));
      }
      return t.call(this, e);
    };
    const e = Game.prototype.loadWorld;
    Game.prototype.loadWorld = function (...t) {
      return ((this.playFrom = performance.now()), e.apply(this, t));
    };
    const s = WorldListScreen.prototype.drawExtra;
    WorldListScreen.prototype.drawExtra = function (t) {
      if ((s.call(this, t), !this.worlds)) return;
      const e = t.ctx,
        i = t.w / 2,
        o = Math.floor(i - this.rowW / 2) + 2,
        n = this.listTop,
        a = this.listBottom,
        r = Math.floor((a - n - 4) / 36);
      (e.save(),
        e.beginPath(),
        e.rect(0, n, t.w, a - n),
        e.clip(),
        this.shown()
          .slice(this.scroll, this.scroll + r + 1)
          .forEach((t, s) => {
            if (!t.playMs) return;
            const i = Math.round(t.playMs / 6e4),
              a = i < 60 ? `玩了 ${i} 分钟` : `玩了 ${Math.floor(i / 60)} 小时 ${i % 60} 分`;
            Font.draw(e, a, o + this.rowW - 8 - Font.width(a), n + 4 + 36 * s + 23, "#707070");
          }),
        e.restore());
    };
  })());
const TITLE_SCENES = [
  { id: "cherry", seed: "23", x: -312, z: -56, time: 1500 },
  { id: "birch", seed: "42", x: -312, z: -312, time: 3e3 },
  { id: "desert", seed: "11", x: -184, z: 136, time: 6e3 },
  { id: "badlands", seed: "11", x: -312, z: -184, time: 11800 },
  { id: "jungle", seed: "11", x: -120, z: 328, time: 4e3, rain: !0 },
  { id: "flowers", seed: "100", x: 200, z: -184, time: 2500 },
  { id: "meadow", seed: "77", x: 8, z: -312, time: 12300 },
  { id: "savanna", seed: "11", x: -312, z: 264, time: 11900 },
  { id: "darkforest", seed: "42", x: -248, z: -248, time: 13200 },
  { id: "ocean", seed: "11", x: -184, z: -120, time: 5e3 },
  { id: "peaks", seed: "23", x: -120, z: 328, time: 23300 },
  { id: "slopes", seed: "23", x: -376, z: -120, time: 4500, rain: !0 },
  { id: "stony", seed: "100", x: -120, z: -248, time: 18500 },
];
((() => {
  const t = new Map(),
    thumbOf = (e) => {
      if (!t.has(e)) {
        let s = null;
        try {
          const t = localStorage.getItem("mcjs-scene-" + e);
          t && ((s = new Image()), (s.src = t));
        } catch (t) {}
        t.set(e, s);
      }
      return t.get(e);
    },
    e = TitleScreen.prototype.drawExtra;
  TitleScreen.prototype.drawExtra = function (t) {
    const s = this.game,
      i = s.titleScene;
    if (i) {
      this.sceneT || (this.sceneT = performance.now());
      const e = !s.titleGround && s.world && s.world.chunks.size > 60,
        o = performance.now();
      e && !this.readyT && (this.readyT = o);
      const n = thumbOf(i.id),
        a = this.readyT ? Math.max(0, 1 - (o - this.readyT) / 1200) : 1;
      if (a > 0) {
        const e = t.ctx;
        (e.save(),
          (e.globalAlpha = a),
          n && n.complete && n.naturalWidth
            ? ((e.imageSmoothingEnabled = !0), e.drawImage(n, 0, 0, t.w, t.h))
            : ((e.fillStyle = "#0B0B12"), e.fillRect(0, 0, t.w, t.h)),
          e.restore());
      }
      if (this.readyT && o - this.readyT > 5e3 && !this.shot && !thumbOf(i.id)) {
        this.shot = !0;
        try {
          ((s.ui.screen = null), s.render(1, o), (s.ui.screen = this));
          const t = document.createElement("canvas");
          ((t.width = 192), (t.height = Math.round((192 * s.canvas.height) / s.canvas.width)));
          const e = t.getContext("2d");
          ((e.filter = "blur(2px)"),
            e.drawImage(s.canvas, 0, 0, t.width, t.height),
            localStorage.setItem("mcjs-scene-" + i.id, t.toDataURL("image/jpeg", 0.7)));
        } catch (t) {}
      }
    }
    return e.call(this, t);
  };
})(),
  (() => {
    const t = QuickChatScreen.prototype.layout;
    QuickChatScreen.prototype.layout = function () {
      t.call(this);
      const e = this.game.ui,
        s = e.w / 2,
        i = this.game,
        o = e.h - 52,
        n = [
          [
            i.net ? "标记这里" : "加路标",
            () => {
              (i.ui.close(), Marks.place(i));
            },
          ],
          ["路标…", () => i.ui.open(new WaypointScreen(i))],
          ["物品图鉴", () => i.ui.open(new ItemDexScreen(i, null))],
          [
            "拍照",
            () => {
              (i.ui.close(), setTimeout(() => Photo.take(i), 50));
            },
          ],
        ];
      n.forEach(([t, e], i) =>
        this.widgets.push({
          x: s - (74 * n.length) / 2 + 74 * i,
          y: o,
          w: 70,
          h: 20,
          label: t,
          onClick: e,
        }),
      );
    };
  })());
//# sourceURL=js/extras.js
