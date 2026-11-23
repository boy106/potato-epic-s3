"use strict";
const Stage = {
  rot: !1,
  el: null,
  inset: { top: 0, right: 0, bottom: 0, left: 0 },
  toyLandscape: !1,
  init() {
    if (this.el) return;
    const t = (this.el = document.createElement("div"));
    ((t.id = "stage"),
      (t.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;overflow:hidden"),
      document.body.insertBefore(t, document.body.firstChild));
    for (const e of ["gl", "ui", "textinput"]) {
      const s = document.getElementById(e);
      s && t.appendChild(s);
    }
    addEventListener("resize", () => {
      if (this.pend) return;
      this.pend = !0;
      const run = () => {
        this.pend && ((this.pend = !1), this.update());
      };
      (requestAnimationFrame(run), setTimeout(run, 120));
    });
    const e = document.getElementById("textinput");
    (e && e.addEventListener("blur", () => setTimeout(() => this.update(), 50)),
      addEventListener("orientationchange", () => setTimeout(() => this.update(), 200)),
      this.update());
  },
  want() {
    const t = "undefined" != typeof game && game;
    return (
      !!t &&
      "phone" === TouchDevice.kind &&
      !1 !== t.settings.rotatePortrait &&
      innerHeight > 1.05 * innerWidth
    );
  },
  update() {
    if (!this.el) return;
    const t = this.want(),
      e = this.el.style;
    this.inset;
    t
      ? ((e.left = "0px"),
        (e.top = "0px"),
        (e.width = innerHeight + "px"),
        (e.height = innerWidth + "px"),
        (e.transformOrigin = "0 0"),
        (e.transform = `translateX(${innerWidth}px) rotate(90deg)`))
      : ((e.transform = ""),
        (e.left = "0px"),
        (e.top = "0px"),
        (e.width = "100%"),
        (e.height = "100%"));
    this.rot;
    this.rot = t;
    {
      const t = "undefined" != typeof game && game;
      t && t.renderer && t.resize();
    }
  },
  w() {
    return this.el ? this.el.clientWidth : innerWidth;
  },
  h() {
    return this.el ? this.el.clientHeight : innerHeight;
  },
  toStage(t, e) {
    return this.rot ? [e, innerWidth - t] : [t, e];
  },
};
((UI.prototype.safe = function () {
  const t = Stage.inset,
    e = this.dpr / this.scale;
  return Stage.rot || !t
    ? { t: 0, l: 0, r: 0, b: 0 }
    : {
        t: Math.ceil(t.top * e),
        l: Math.ceil(t.left * e),
        r: Math.ceil(t.right * e),
        b: Math.ceil(t.bottom * e),
      };
}),
  (() => {
    const t = UI.prototype.drawHUD,
      e = UI.prototype.drawChat;
    ((UI.prototype.drawHUD = function () {
      const e = this.safe();
      if (!e.b) return t.call(this);
      const s = this.ctx;
      (s.save(), s.translate(0, -e.b));
      try {
        return t.call(this);
      } finally {
        s.restore();
      }
    }),
      (UI.prototype.drawChat = function () {
        const t = this.safe();
        if (!t.l) return e.call(this);
        const s = this.ctx;
        (s.save(), s.translate(t.l, 0));
        try {
          return e.call(this);
        } finally {
          s.restore();
        }
      }));
  })(),
  (Renderer.prototype.resize = function () {
    const t = Math.min(window.devicePixelRatio || 1, 2);
    let e = Math.floor(Stage.w() * t * this.resScale),
      s = Math.floor(Stage.h() * t * this.resScale);
    if (
      (this.forceSize && ([e, s] = this.forceSize),
      (e = Math.max(1, e)),
      (s = Math.max(1, s)),
      "undefined" != typeof WEBKIT_GL &&
        WEBKIT_GL &&
        this.canvas.width > 1 &&
        !this.forceSize &&
        navigator.maxTouchPoints > 0)
    ) {
      const t = document.getElementById("textinput");
      if (t && document.activeElement === t) return;
    }
    (this.canvas.width === e && this.canvas.height === s) ||
      ((this.canvas.width = e), (this.canvas.height = s));
  }),
  (UI.prototype.resize = function () {
    const t = Math.min(window.devicePixelRatio || 1, 2),
      e = Math.floor(Stage.w() * t),
      s = Math.floor(Stage.h() * t);
    (this.canvas.width !== e && (this.canvas.width = e),
      this.canvas.height !== s && (this.canvas.height = s));
    const i = Math.max(
        1,
        Math.min(Math.floor(this.canvas.width / 320), Math.floor(this.canvas.height / 240)),
      ),
      n = this.game.settings.guiScale;
    ((this.scale = n ? Math.min(n * t, i) : Math.min(i, Math.round(3 * t))),
      (this.scale = Math.max(1, Math.floor(this.scale))));
    const o = this.screen && this.screen.needW;
    if (o) for (; this.scale > 1 && this.canvas.width / this.scale < o;) this.scale--;
    ((this.w = Math.ceil(this.canvas.width / this.scale)),
      (this.h = Math.ceil(this.canvas.height / this.scale)),
      (this.dpr = t),
      this.screen && this.screen.layout && this.screen.layout());
  }),
  (UI.prototype.toGui = function (t) {
    const [e, s] = t.stage ? [t.clientX, t.clientY] : Stage.toStage(t.clientX, t.clientY);
    return [(e * this.dpr) / this.scale, (s * this.dpr) / this.scale];
  }),
  (() => {
    const t = TouchControls.prototype;
    t.gui = function (t, e) {
      const s = this.ui.dpr / this.ui.scale;
      return [t * s, e * s];
    };
    const turn = (t) => ({
      target: t.target,
      preventDefault: () => t.preventDefault(),
      touches: t.touches ? [...t.touches].map((t) => ({ identifier: t.identifier })) : null,
      changedTouches: [...t.changedTouches].map((t) => {
        const [e, s] = Stage.toStage(t.clientX, t.clientY);
        return { identifier: t.identifier, clientX: e, clientY: s };
      }),
    });
    for (const e of ["onStart", "onMove"]) {
      const s = t[e];
      t[e] = function (t) {
        return s.call(this, turn(t));
      };
    }
    const e = t.onEnd;
    t.onEnd = function (t, s) {
      return e.call(this, turn(t), s);
    };
    t.synth;
    t.synth = function (t, e, s, i) {
      const n = {
        clientX: i ? e.sx : e.cx,
        clientY: i ? e.sy : e.cy,
        button: s,
        shiftKey: !1,
        stage: !0,
      };
      "down" === t ? this.ui.mouseDown(n) : "up" === t ? this.ui.mouseUp(n) : this.ui.mouseMove(n);
    };
  })(),
  (async () => {
    if ("phone" !== TouchDevice.kind && "tablet" !== TouchDevice.kind) return;
    if (!(await Toy.ready())) return;
    Stage.inToy = !0;
    const apply = (t) => {
      if (!t) return;
      const e = t.safeArea || {};
      ((Stage.inset = {
        top: e.top || 0,
        right: e.right || 0,
        bottom: e.bottom || 0,
        left: e.left || 0,
      }),
        (Stage.toyLandscape = "landscape" === t.orientation),
        Stage.update());
    };
    try {
      await Toy.setContainerMode({ orientation: "landscape", immersive: !0 });
    } catch (t) {}
    try {
      apply(await Toy.containerState());
    } catch (t) {}
    Toy.onContainerChange(apply);
  })(),
  Object.assign(TOUCH_ICONS, {
    attack: [
      "...........###",
      "..........####",
      ".........####.",
      "........####..",
      ".......####...",
      "......####....",
      ".##..####.....",
      ".###.###......",
      "..#####.......",
      "...###........",
      "..#####.......",
      ".###..##......",
      "###...........",
      "##............",
    ],
    use: [
      "..#.#.#..",
      "..#.#.#..",
      "..#.#.#.#",
      "..#######",
      ".########",
      ".########",
      "..#######",
      "...#####.",
      "....###..",
    ],
    emote: [
      "..#####..",
      ".#.....#.",
      "#..#.#..#",
      "#.......#",
      "#.#...#.#",
      "#..###..#",
      ".#.....#.",
      "..#####..",
      ".........",
    ],
  }));
const DPAD_RC = {
    ul: [0, 0],
    up: [0, 1],
    ur: [0, 2],
    left: [1, 0],
    sneak: [1, 1],
    right: [1, 2],
    down: [2, 1],
  },
  touchDescFollows = (t) => {
    const e = (t.touchLayout || {}).descend,
      s = (t.touchScale || {}).descend;
    return !((s && 1 !== s) || (e && t.touchDescOwn));
  };
((() => {
  const t = TouchControls.prototype,
    stickOn = (t) => !1 !== t.settings.touchStick,
    stickFixed = (t) => !0 !== t.settings.touchStickDyn,
    classic = (t) => !0 === t.settings.touchClassic,
    toyCapsule = (t) => {
      if (!Stage.inToy || Stage.rot) return null;
      const e = t.dpr / t.scale;
      return { w: Math.ceil(100 * e), h: Math.ceil(48 * e) };
    },
    e = t.layout;
  t.layout = function () {
    const t = e.call(this),
      s = this.g,
      { W: i, H: n } = this.metrics(),
      { B: o, gp: a } = t,
      c = Math.max(3, Math.round(0.3 * o)),
      h = s.settings;
    ((t.W = i),
      (t.H = n),
      stickOn(s) &&
        ((t.cells = {}),
        (t.dpad = null),
        (t.x0 = t.y0 = -1e4),
        (t.stickR = Math.round(1.25 * o)),
        (t.stickHome = { x: c + t.stickR, y: n - c - t.stickR }),
        (t.stickZone = {
          x: 0,
          y: Math.round(0.28 * n),
          w: Math.round(0.42 * i),
          h: n - Math.round(0.28 * n),
        }),
        (s.player.flying && !this.editAll) ||
          (t.sneak = {
            x: Math.min(c + 2 * t.stickR + 2 * a, Math.floor(i / 2 - 91 - o - 4)),
            y: n - c - o,
            w: o,
            h: o,
          })));
    const r = t.pause.y,
      l = t.pause.w;
    ((t.emote = { x: t.view.x - l - a, y: r, w: l, h: l }),
      (t.f3 = { x: t.emote.x - l - a, y: r, w: l, h: l }),
      "spectator" !== s.mode &&
        ((t.attack = { x: t.jump.x - o - a, y: t.jump.y - o - a, w: o, h: o }),
        (t.use = { x: t.jump.x, y: t.jump.y - o - a, w: o, h: o }),
        t.interact && (t.interact.y = t.use.y - t.interact.h - a)));
    const u = this.ui.safe();
    for (const e of ["pause", "chat", "view", "emote", "f3"])
      t[e] && ((t[e].x -= u.r), (t[e].y += u.t));
    for (const e of ["jump", "descend", "sprint", "attack", "use", "interact"])
      t[e] && ((t[e].x -= u.r), (t[e].y -= u.b));
    (t.stickHome && ((t.stickHome.x += u.l), (t.stickHome.y -= u.b), (t.stickZone.x += u.l)),
      t.sneak && ((t.sneak.x += u.l), (t.sneak.y -= u.b)),
      t.hotbar && ((t.hotbar.y -= u.b), (t.inv.y -= u.b)));
    const d = toyCapsule(this.ui);
    if (d && u.t < d.h) {
      const e = Math.max(0, d.w - u.r - 4);
      for (const s of ["pause", "chat", "view", "emote", "f3"])
        t[s] && t[s].y < d.h && (t[s].x = Math.max(0, t[s].x - e));
    }
    "function" == typeof self.POTATO_TOUCH &&
      self.POTATO_TOUCH.call(this, t, { W: i, H: n, B: o, gp: a, m: c, sf: u });
    const y = h.touchLayout || {},
      p = t.dpad && t.x0 > -1e3 ? { x: t.dpad.x, y: t.dpad.y } : null;
    (t.descend && (t.descBase = { ...t.descend }), (t.base = {}));
    for (const e in t) {
      const s = t[e];
      s &&
        "object" == typeof s &&
        void 0 !== s.x &&
        void 0 !== s.w &&
        (t.base[e] = { x: s.x, y: s.y, w: s.w, h: s.h });
    }
    for (const e in y) {
      const s = t[e],
        o = y[e];
      s &&
        o &&
        void 0 !== s.x &&
        ((s.x = clamp(s.x + o[0], 0, i - s.w)), (s.y = clamp(s.y + o[1], 0, n - s.h)));
    }
    if (p && (t.dpad.x !== p.x || t.dpad.y !== p.y)) {
      const e = t.dpad.x - p.x,
        s = t.dpad.y - p.y;
      ((t.x0 += e), (t.y0 += s));
      for (const i in t.cells) ((t.cells[i].x += e), (t.cells[i].y += s));
    }
    y.stick &&
      t.stickHome &&
      (t.stickHome = {
        x: clamp(t.stickHome.x + y.stick[0], t.stickR, i - t.stickR),
        y: clamp(t.stickHome.y + y.stick[1], t.stickR, n - t.stickR),
      });
    const f = h.touchScale || {};
    for (const e in f) {
      const s = clamp(+f[e] || 1, 0.5, 4);
      if (1 === s) continue;
      if ("stick" === e) {
        t.stickHome &&
          ((t.stickR = Math.round(t.stickR * s)),
          (t.stickHome = {
            x: clamp(t.stickHome.x, t.stickR, i - t.stickR),
            y: clamp(t.stickHome.y, t.stickR, n - t.stickR),
          }));
        continue;
      }
      const o = t[e];
      if (!o || void 0 === o.x) continue;
      const a = o.x + o.w / 2,
        c = o.y + o.h / 2;
      ((o.w = Math.min(i, Math.round(o.w * s))),
        (o.h = Math.min(n, Math.round(o.h * s))),
        (o.x = clamp(Math.round(a - o.w / 2), 0, i - o.w)),
        (o.y = clamp(Math.round(c - o.h / 2), 0, n - o.h)));
    }
    if (t.dpad && t.x0 > -1e3 && 1 !== (+f.dpad || 1)) {
      const e = t.dpad,
        s = Math.min(e.w, e.h) / 3,
        i = Math.max(1, Math.round((a * s) / o));
      ((t.x0 = e.x), (t.y0 = e.y), (t.dB = s));
      for (const n in t.cells) {
        const [o, a] = DPAD_RC[n];
        t.cells[n] = { x: e.x + a * s + i, y: e.y + o * s + i, w: s - 2 * i, h: s - 2 * i };
      }
    }
    if (t.descend && touchDescFollows(h)) {
      const e = t.jump,
        s = t.descend,
        o = s.w,
        c = s.h,
        h = Math.round(e.x + (e.w - o) / 2),
        r = ["jump", "sprint", "attack", "use", "interact", "sneak", "hotbar", "inv"]
          .map((e) => t[e])
          .filter(Boolean),
        hit = (t, e) => t.x < e.x + e.w && e.x < t.x + t.w && t.y < e.y + e.h && e.y < t.y + t.h,
        fits = (t, s) =>
          t.x >= 0 &&
          t.y >= 0 &&
          t.x + o <= i &&
          t.y + c <= n - u.b &&
          !(s ? r : [e]).some((e) => hit(e, { ...t, w: o, h: c })),
        l = [
          { x: h, y: e.y + e.h + a },
          { x: e.x - a - o, y: e.y + e.h - c },
          { x: e.x - a - o, y: e.y },
          { x: e.x + e.w + a, y: e.y + e.h - c },
        ],
        d = l.slice(1),
        y = (fits(l[0], !1) && l[0]) || d.find((t) => fits(t, !0)) || d.find((t) => fits(t, !1));
      y
        ? ((s.x = y.x), (s.y = y.y))
        : ((s.x = clamp(h, 0, i - o)), (s.y = clamp(e.y + e.h + a, 0, n - c)));
    }
    if (t.stickHome && ((y.stick && (y.stick[0] || y.stick[1])) || (f.stick && 1 !== f.stick))) {
      const e = 2 * t.stickR,
        s = Math.max(0, t.stickHome.x - e),
        o = Math.max(0, t.stickHome.y - e);
      t.stickZone = {
        x: s,
        y: o,
        w: Math.min(i, t.stickHome.x + e) - s,
        h: Math.min(n, t.stickHome.y + e) - o,
      };
    }
    if (d)
      for (const e of [
        "pause",
        "chat",
        "view",
        "emote",
        "f3",
        "jump",
        "descend",
        "sprint",
        "attack",
        "use",
        "interact",
        "sneak",
        "inv",
      ]) {
        const s = t[e];
        s && s.x + s.w > i - d.w && s.y < d.h && (s.y = Math.max(0, Math.min(n - s.h, d.h + 2)));
      }
    return t;
  };
  const s = t.topInset;
  t.topInset = function () {
    const t = s.call(this),
      e = t ? toyCapsule(this.ui) : null;
    return e ? Math.max(t, e.h + 2) : t;
  };
  const i = t.closeRect;
  t.closeRect = function () {
    const t = i.call(this);
    if (!t) return t;
    const e = this.ui.safe();
    if (Stage.inToy) {
      if (((t.x = 4 + e.l), (t.y = 4 + e.t), "undefined" != typeof Minimap && Minimap.on(this.g))) {
        const e = Minimap.rect(this.ui);
        t.x = e.x + e.w + 4;
      }
    } else ((t.x -= e.r), (t.y += e.t));
    return t;
  };
  const n = t.startPlay;
  ((t.startPlay = function (t) {
    const e = this.g,
      s = e.touchHeld,
      i = this.layout(),
      o = t.x,
      a = t.y;
    if (this.hitL(i.emote, o, a)) return ((t.kind = "button"), void (t.btn = "emote"));
    if (this.hitL(i.f3, o, a)) return ((t.kind = "button"), void (t.btn = "f3"));
    if (i.attack && this.hitL(i.attack, o, a))
      return (
        (t.kind = "abtn"),
        (t.holdBtn = 0),
        (e.mouseBtn[0] = !0),
        (e.mouseClicked0 = !0),
        (e.attackCd = Math.min(e.attackCd, 0)),
        e.target || e.targetEntity || e.player.swing(),
        void (t.holding = !0)
      );
    if (i.use && this.hitL(i.use, o, a))
      return (
        (t.kind = "abtn"),
        (t.holdBtn = 2),
        (e.mouseBtn[2] = !0),
        (e.useCd = 0),
        void (t.holding = !0)
      );
    if (stickOn(e)) {
      if (i.sneak && this.hitL(i.sneak, o, a))
        return ((t.kind = "none"), void (s.sneak = !s.sneak));
      for (const e of ["pause", "chat", "view", "inv", "interact"])
        if (this.hitL(i[e], o, a)) return n.call(this, t);
      if (i.hotbar && this.hitL(i.hotbar, o, a, 0)) return n.call(this, t);
      if (
        this.hitL(i.jump, o, a) ||
        (i.descend && this.hitL(i.descend, o, a)) ||
        (i.sprint && this.hitL(i.sprint, o, a))
      )
        return n.call(this, t);
      const c = i.stickZone;
      if (
        o >= c.x &&
        o < c.x + c.w &&
        a >= c.y &&
        a < c.y + c.h &&
        ![...this.t.values()].some((e) => e !== t && "stick" === e.kind)
      )
        return (
          (t.kind = "stick"),
          stickFixed(e)
            ? ((t.bx = i.stickHome.x), (t.by = i.stickHome.y))
            : ((t.bx = clamp(o, i.stickR, i.W - i.stickR)),
              (t.by = clamp(a, i.stickR, i.H - i.stickR))),
          void this.stick(t)
        );
    }
    n.call(this, t);
  }),
    (t.stick = function (t) {
      const e = this.g,
        s = e.touchHeld,
        i = this.L.stickR;
      let n = (t.x - t.bx) / i,
        o = (t.y - t.by) / i;
      const a = Math.hypot(n, o);
      (a > 1 && ((n /= a), (o /= a)),
        a > 1.4 && !stickFixed(e) && ((t.bx = t.x - n * i), (t.by = t.y - o * i)));
      const c = Math.min(1, a),
        h = 0.18,
        r = c < h ? 0 : (c - h) / (1 - h);
      s.joy = r
        ? {
            x: (n / Math.max(1e-6, Math.min(1, a))) * r,
            y: (o / Math.max(1e-6, Math.min(1, a))) * r,
          }
        : null;
      const l = s.joy && -s.joy.y > 0.35;
      (l && !s.forward && ((s.forward = !0), pressAction(e, "forward")),
        !l && s.forward && ((s.forward = !1), releaseAction(e, "forward")),
        ((t) => !1 !== t.settings.touchPushSprint)(e)
          ? s.joy && c > 0.96 && -o > 0.8
            ? (s.joySprint = !0)
            : (!s.joy || c < 0.35 || -o < 0.3) && (s.joySprint = !1)
          : (s.joySprint = !1));
    }));
  const o = t.movePlay;
  t.movePlay = function (t, e, s) {
    if ("stick" !== t.kind)
      if ("abtn" !== t.kind) o.call(this, t, e, s);
      else {
        if (t.noTurn) return;
        if (!t.turning && ((t.turning = Math.hypot(t.cx - t.sx, t.cy - t.sy) > 8), !t.turning))
          return;
        t.kind = "look";
        try {
          o.call(this, t, e, s);
        } finally {
          t.kind = "abtn";
        }
      }
    else this.stick(t);
  };
  const a = t.endPlay;
  t.endPlay = function (t, e) {
    const s = this.g,
      i = s.touchHeld;
    if ("stick" === t.kind)
      return (
        (i.joy = null),
        (i.joySprint = !1),
        void (i.forward && ((i.forward = !1), releaseAction(s, "forward")))
      );
    "abtn" !== t.kind
      ? "button" !== t.kind || "f3" !== t.btn
        ? "button" !== t.kind || "emote" !== t.btn
          ? "look" !== t.kind || classic(s)
            ? a.call(this, t, e)
            : t.holding && (s.mouseBtn[t.holdBtn] = !1)
          : !e && this.hitL(this.L.emote, t.x, t.y) && s.ui.open(new QuickChatScreen(s))
        : !e &&
          this.hitL(this.L.f3, t.x, t.y) &&
          ((s.ui.debug = !s.ui.debug),
          "undefined" != typeof PerfMon && (PerfMon.gpuOn = s.ui.debug))
      : (s.mouseBtn[t.holdBtn] = !1);
  };
  const c = t.update;
  t.update = function (t) {
    if (classic(this.g)) return c.call(this, t);
    for (const t of this.t.values()) "look" === t.kind && (t.holding = t.holding || "none");
    c.call(this, t);
    for (const t of this.t.values()) "none" === t.holding && (t.holding = !1);
  };
  const h = new Map(),
    pixDisc = (t, e) => {
      const s = e + t;
      if (h.has(s)) return h.get(s);
      const i = Math.max(2, Math.round(t / 13)),
        n = Math.ceil((2 * t) / i),
        o = document.createElement("canvas");
      o.width = o.height = n * i;
      const a = o.getContext("2d"),
        c = "base" === e;
      for (let s = 0; s < n; s++)
        for (let o = 0; o < n; o++) {
          const n = (o + 0.5) * i - t,
            h = (s + 0.5) * i - t,
            r = Math.hypot(n, h);
          if (r > t) continue;
          let l;
          ((l =
            r > t - i
              ? "rgba(0,0,0,0.6)"
              : r > t - 2 * i
                ? n + h < 0
                  ? c
                    ? "rgba(255,255,255,0.3)"
                    : "#D8D8D8"
                  : c
                    ? "rgba(0,0,0,0.35)"
                    : "#5E5E5E"
                : c
                  ? "rgba(40,40,40,0.42)"
                  : "knobOn" === e
                    ? "#C8C8C8"
                    : "#9C9C9C"),
            (a.fillStyle = l),
            a.fillRect(o * i, s * i, i, i));
        }
      if (c) {
        a.fillStyle = "rgba(255,255,255,0.5)";
        const e = Math.floor(n / 2),
          s = Math.round((0.74 * t) / i);
        for (const [t, n] of [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
        ]) {
          const o = e + t * s,
            c = e + n * s;
          for (let e = -1; e <= 1; e++) {
            const s = o + (n ? e : 0) - t,
              h = c + (t ? e : 0) - n;
            a.fillRect(s * i, h * i, i, i);
          }
          a.fillRect(o * i, c * i, i, i);
        }
      }
      return (h.set(s, o), o);
    },
    r = t.draw;
  t.draw = function (t) {
    r.call(this, t);
    const e = this.g;
    if (!this.on() || "play" !== e.state || t.screen || !this.L) return;
    const s = t.ctx,
      i = this.L,
      n = e.touchHeld;
    if ((s.save(), (s.globalAlpha = e.settings.touchOpacity ?? 0.7), i.stickHome)) {
      const t = [...this.t.values()].find((t) => "stick" === t.kind),
        e = t ? t.bx : i.stickHome.x,
        o = t ? t.by : i.stickHome.y,
        a = i.stickR,
        c = t ? e + clamp(t.x - e, -a, a) : e,
        h = t ? o + clamp(t.y - o, -a, a) : o,
        r = Math.hypot(c - e, h - o),
        l = r > a ? a / r : 1,
        u = e + (c - e) * l,
        d = o + (h - o) * l,
        y = s.imageSmoothingEnabled;
      if (self.POTATO && self.POTATO_STICK)
        (self.POTATO_STICK(s, e, o, a, u, d, !!n.joySprint),
          i.sneak && this.btn(s, i.sneak, n.sneak ? "sneakOn" : "sneak", !!n.sneak));
      else {
        s.imageSmoothingEnabled = !1;
        const t = pixDisc(a, "base"),
          c = pixDisc(Math.round(0.42 * a), n.joySprint ? "knobOn" : "knob");
        (s.drawImage(t, Math.round(e - a), Math.round(o - a)),
          s.drawImage(c, Math.round(u - c.width / 2), Math.round(d - c.height / 2)),
          (s.imageSmoothingEnabled = y),
          i.sneak && this.btn(s, i.sneak, n.sneak ? "sneakOn" : "sneak", !!n.sneak));
      }
    }
    (this.btn(s, i.emote, "emote", !1),
      this.btn(s, i.f3, null, !!t.debug, "F3"),
      i.attack &&
        (this.btn(s, i.attack, "attack", e.mouseBtn[0]), this.btn(s, i.use, "use", e.mouseBtn[2])),
      s.restore());
  };
  const l = Game.prototype.readInput;
  Game.prototype.readInput = function () {
    const t = l.call(this),
      e = this.touchHeld;
    return (
      e &&
        e.joy &&
        ((t.fwd = clamp(-e.joy.y, -1, 1)),
        (t.strafe = clamp(e.joy.x, -1, 1)),
        "undefined" != typeof Boat &&
          this.player &&
          this.player.vehicle instanceof Boat &&
          Math.abs(t.strafe) < 0.35 &&
          (t.strafe = 0)),
      e && e.joySprint && (t.sprint = !0),
      t
    );
  };
})(),
  (() => {
    const t = PauseScreen.prototype.layout;
    PauseScreen.prototype.layout = function () {
      t.call(this);
      const e = this.game,
        s = e.ui;
      touchOn(e) &&
        this.widgets.push({
          x: 4,
          y: s.h - 22,
          w: 64,
          h: 18,
          label: "触控设置",
          onClick: () => e.ui.open(new OptionsListScreen(e, this, "触控设置", "touch")),
        });
    };
  })());
const buzz = (t, e) => {
  if (touchOn(t) && !1 !== t.settings.vibrate && navigator.vibrate)
    try {
      navigator.vibrate(e);
    } catch (t) {}
};
(() => {
  const t = Game.prototype.breakBlock;
  Game.prototype.breakBlock = function (e, s, i, n, o) {
    const a = t.call(this, e, s, i, n, o);
    return (n || o || buzz(this, 15), a);
  };
  const e = Player.prototype.hurt;
  Player.prototype.hurt = function (t, s) {
    const i = e.call(this, t, s);
    return (i && buzz(this.game, 40), i);
  };
})();
const QUICK_PHRASES = [
    "过来！",
    "救命！",
    "这里有钻石",
    "跟我来",
    "等等我",
    "谢谢！",
    "好的",
    "天黑了，回家",
    "小心苦力怕！",
    "我去挖矿",
    "我饿了",
    "晚安",
  ],
  QUICK_EMOTES = ["(^_^)", "(T_T)", "(o_O)", "(>_<)", "(*^▽^*)", "(╯°□°)╯", "♥", "233"];
class QuickChatScreen extends MenuScreen {
  constructor(t) {
    (super(t, "快捷聊天"),
      (this.pauses = !1),
      (this.bgDim = 0.3),
      (this.blurBg = !1),
      (this.titleY = 10));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      s = Math.min(110, Math.floor((t.w - 24) / 3) - 4);
    ((this.widgets = []),
      QUICK_PHRASES.forEach((t, i) =>
        this.widgets.push({
          x: e - (3 * (s + 4)) / 2 + (i % 3) * (s + 4),
          y: 24 + 24 * Math.floor(i / 3),
          w: s,
          h: 20,
          label: t,
          onClick: () => this.send(t),
        }),
      ));
    const i = QUICK_EMOTES.length,
      n = 24 + 24 * Math.ceil(QUICK_PHRASES.length / 3) + 6;
    (QUICK_EMOTES.forEach((t, s) =>
      this.widgets.push({
        x: e - (50 * Math.min(i, 6)) / 2 + (s % 6) * 50,
        y: n + 24 * Math.floor(s / 6),
        w: 46,
        h: 20,
        label: t,
        onClick: () => this.send(t),
      }),
    ),
      this.widgets.push({
        x: e - 60,
        y: t.h - 28,
        w: 120,
        h: 20,
        label: "关闭",
        onClick: () => this.game.ui.close(),
      }));
  }
  send(t) {
    const e = this.game;
    (e.net
      ? e.net.chat(t)
      : e.ui.message(
          "<" +
            (("undefined" != typeof Account && Account.name) || e.settings.netName || "我") +
            "> " +
            t,
        ),
      e.ui.close());
  }
  onEsc() {
    this.game.ui.close();
  }
}
class TouchLayoutScreen extends MenuScreen {
  constructor(t, e, s) {
    (super(t, null),
      (this.parent = e),
      (this.done = s || null),
      (this.blurBg = !1),
      (this.bgDim = 0.35),
      (this.pauses = !1),
      (this.drag = null),
      (this.touchDrag = !0),
      (this.sel = null));
    const i = t.settings;
    this.was = {
      layout: JSON.stringify(i.touchLayout || {}),
      scale: JSON.stringify(i.touchScale || {}),
      descOwn: i.touchDescOwn,
    };
  }
  scaleOf(t) {
    return (this.game.settings.touchScale || {})[t] || 1;
  }
  setScale(t, e) {
    const s = this.game.settings;
    ("descend" === t &&
      (touchDescFollows(s) &&
        (s.touchLayout = Object.assign({}, s.touchLayout || {}, { descend: this.descOffset() })),
      (s.touchDescOwn = !0)),
      (s.touchScale = Object.assign({}, s.touchScale || {}, {
        [t]: Math.round(100 * clamp(e, 0.5, 4)) / 100,
      })));
  }
  descOffset() {
    const t = this.game.ui.touch.L,
      e = t && t.descend,
      s = t && t.descBase;
    return e && s
      ? [Math.round(e.x + e.w / 2 - s.x - s.w / 2), Math.round(e.y + e.h / 2 - s.y - s.h / 2)]
      : [0, 0];
  }
  save() {
    if ((this.game.saveSettings(), this.done)) {
      const t = this.done;
      ((this.done = null), t());
    } else this.game.ui.open(this.parent);
  }
  discard() {
    const t = this.game.settings;
    ((t.touchLayout = JSON.parse(this.was.layout)),
      (t.touchScale = JSON.parse(this.was.scale)),
      (t.touchDescOwn = this.was.descOwn),
      this.game.saveSettings(),
      this.game.ui.open(this.parent));
  }
  ids() {
    return [
      "stick",
      "dpad",
      "sneak",
      "jump",
      "descend",
      "sprint",
      "attack",
      "use",
      "interact",
      "inv",
      "pause",
      "chat",
      "emote",
      "f3",
      "view",
    ];
  }
  rects() {
    const t = this.game.ui.touch,
      e = {};
    let s;
    t.editAll = !0;
    try {
      s = t.layout();
    } finally {
      t.editAll = !1;
    }
    for (const t of this.ids())
      "stick" === t
        ? s.stickHome &&
          (e.stick = {
            x: s.stickHome.x - s.stickR,
            y: s.stickHome.y - s.stickR,
            w: 2 * s.stickR,
            h: 2 * s.stickR,
          })
        : s[t] && (e[t] = s[t]);
    return e;
  }
  layout() {
    const t = this.game.ui.w / 2,
      e = this.game;
    if (
      ((this.widgets = [
        {
          x: t - 154,
          y: 6,
          w: 100,
          h: 18,
          label: "重置布局",
          tip: ["所有按钮回到默认的位置和大小"],
          onClick: () => {
            ((e.settings.touchLayout = {}), (e.settings.touchScale = {}), this.layout());
          },
        },
        { x: t - 50, y: 6, w: 100, h: 18, label: "保存布局", gold: !0, onClick: () => this.save() },
      ]),
      this.done ||
        this.widgets.push({
          x: t + 54,
          y: 6,
          w: 100,
          h: 18,
          label: "不保存返回",
          onClick: () => this.discard(),
        }),
      this.sel)
    ) {
      const e = this.sel,
        s = 44;
      this.widgets.push(
        {
          x: t - 92,
          y: s,
          w: 30,
          h: 18,
          label: "－",
          enabled: this.scaleOf(e) > 0.5,
          onClick: () => {
            (this.setScale(e, this.scaleOf(e) - 0.1), this.layout());
          },
        },
        {
          x: t - 60,
          y: s,
          w: 120,
          h: 18,
          label: () => "大小：" + Math.round(100 * this.scaleOf(this.sel)) + "%",
          enabled: !1,
        },
        {
          x: t + 62,
          y: s,
          w: 30,
          h: 18,
          label: "＋",
          enabled: this.scaleOf(e) < 4,
          onClick: () => {
            (this.setScale(e, this.scaleOf(e) + 0.1), this.layout());
          },
        },
      );
    }
  }
  mouseDown(t, e, s, i) {
    for (const n of this.widgets) if (t.hit(n, e, s)) return super.mouseDown(t, e, s, i);
    const n = this.rects();
    for (const t in n) {
      const i = n[t];
      if (e >= i.x && e < i.x + i.w && s >= i.y && s < i.y + i.h) {
        const i = this.game.settings,
          n =
            "descend" === t && touchDescFollows(i)
              ? this.descOffset()
              : (i.touchLayout || {})[t] || [0, 0];
        return (
          (this.drag = { id: t, mx: e, my: s, o: [...n] }),
          void (this.sel !== t && ((this.sel = t), this.layout()))
        );
      }
    }
  }
  mouseMove(t, e, s) {
    if (!this.drag || !t.mouse.down) return;
    const i = this.game.settings,
      n = this.drag,
      o = "jump" === n.id && touchDescFollows(i);
    ((i.touchLayout = Object.assign({}, i.touchLayout || {}, {
      [n.id]: [Math.round(n.o[0] + e - n.mx), Math.round(n.o[1] + s - n.my)],
    })),
      o && delete i.touchLayout.descend,
      "descend" === n.id && (i.touchDescOwn = !0));
  }
  mouseUp() {
    this.drag && (this.drag = null);
  }
  drawExtra(t) {
    const e = t.ctx,
      s = this.rects(),
      i = Object.assign(
        {
          stick: "摇杆",
          dpad: "方向键",
          sneak: "潜行",
          jump: "跳跃",
          descend: "下降",
          sprint: "疾跑",
          attack: "攻击",
          use: "使用",
          interact: "互动",
          inv: "背包",
          pause: "暂停",
          chat: "聊天",
          emote: "快捷聊天",
          f3: "F3",
          view: "视角",
        },
        TouchLayoutScreen.names || {},
      );
    Font.center(
      e,
      this.sel
        ? "拖动按钮换位置；用 － ＋ 调这个按钮的大小"
        : "拖动按钮到顺手的位置；点一个按钮可以调它的大小",
      t.w / 2,
      30,
      "#FFFFFF",
    );
    for (const t in s) {
      const n = s[t];
      ((e.fillStyle =
        this.drag && this.drag.id === t
          ? "rgba(255,210,74,0.5)"
          : this.sel === t
            ? "rgba(255,210,74,0.3)"
            : "rgba(255,255,255,0.25)"),
        e.fillRect(n.x, n.y, n.w, n.h),
        (e.strokeStyle = "#FFD24A"),
        e.strokeRect(n.x + 0.5, n.y + 0.5, n.w - 1, n.h - 1),
        Font.center(
          e,
          i[t] || (TouchLayoutScreen.names || {})[t] || t,
          n.x + n.w / 2,
          n.y + n.h / 2 - 4,
          "#FFFFFF",
        ));
    }
  }
  onEsc() {
    this.done ? this.save() : this.discard();
  }
}
const FpsChoice = {
  list(t) {
    const e = t.pacer,
      s = [90, 120].filter((t) => t <= (e ? e.hz : 60) + 5);
    return e && e.auto60 ? [0, ...s, -1] : [60, ...s, 0];
  },
  label(t, e) {
    const s = t.pacer,
      i = s ? s.hz : 60;
    return e > 0
      ? e + " 帧"
      : -1 !== e && s && s.auto60
        ? "自动（60 帧）"
        : "跟随屏幕（" + i + " 帧）";
  },
  next(t) {
    const e = t.settings,
      s = this.list(t),
      i = e.maxFps > 0 || -1 === e.maxFps ? e.maxFps : 0;
    e.maxFps = s[(s.indexOf(60 === i && 0 === s[0] ? 0 : i) + 1) % s.length];
  },
};
((() => {
  const t = OptionsListScreen.prototype.options;
  OptionsListScreen.prototype.options = function () {
    const e = t.call(this);
    if ("touch" !== this.page) return e;
    const s = this.game.settings,
      i = this.game,
      bt = (t, e, s) => ({
        label: t,
        onClick: () => {
          (e(), i.applySettings(), i.saveSettings());
        },
        ...s,
      });
    return [
      bt(
        () => "移动：" + (!1 === s.touchStick ? "方向键" : "摇杆"),
        () => {
          s.touchStick = !1 === s.touchStick;
        },
      ),
      ...(!1 === s.touchStick
        ? []
        : [
            Object.assign(
              bt(
                () => "动态摇杆：" + (s.touchStickDyn ? "开" : "关"),
                () => {
                  s.touchStickDyn = !s.touchStickDyn;
                },
              ),
              {
                tip: [
                  "关：摇杆固定在原地，按在它附近都以它为中心",
                  "开：手指按下的地方就是摇杆中心，手指拉远时摇杆跟着走",
                ],
              },
            ),
            bt(
              () => "摇杆推满疾跑：" + (!1 === s.touchPushSprint ? "关" : "开"),
              () => {
                s.touchPushSprint = !1 === s.touchPushSprint;
              },
            ),
          ]),
      ...e,
      Object.assign(
        bt(
          () => "操作方式：" + (s.touchClassic ? "经典（点屏幕放置，长按挖）" : "准星 + 按钮"),
          () => {
            s.touchClassic = !s.touchClassic;
          },
        ),
        {
          tip: [
            "准星 + 按钮：用攻击、使用按钮对着屏幕中间的准星操作",
            "经典：直接点屏幕放置、长按屏幕挖掘，按钮也还在",
          ],
        },
      ),
      bt(
        () => "震动：" + (!1 === s.vibrate ? "关" : "开"),
        () => {
          s.vibrate = !1 === s.vibrate;
        },
      ),
      bt("编辑按钮布局…", () => i.ui.open(new TouchLayoutScreen(i, this))),
      Object.assign(
        bt(
          () => "帧率上限：" + FpsChoice.label(i, s.maxFps),
          () => FpsChoice.next(i),
        ),
        {
          tip: [
            "越高越流畅，但更耗电、手机更热",
            "自动：90 / 120 Hz 的屏幕上是 60 帧",
            "手机热到跟不上时会自动降回 60 帧",
          ],
        },
      ),
      bt(
        () => "竖着拿手机时旋转画面：" + (!1 === s.rotatePortrait ? "关" : "开"),
        () => {
          ((s.rotatePortrait = !1 === s.rotatePortrait), Stage.update());
        },
      ),
    ];
  };
})(),
  (() => {
    let t = 0,
      e = performance.now();
    setInterval(() => {
      const s = "undefined" != typeof game && game,
        i = s && s.pacer,
        n = performance.now(),
        o = n - e;
      e = n;
      const a = i ? i.playLimit || i.hz : 0;
      !i || "play" !== s.state || !touchOn(s) || a <= 65
        ? (t = 0)
        : document.hidden ||
          n - i.cappedT < 2500 ||
          !s.fps ||
          (s.fps < 0.7 * a ? (t += o) : (t = Math.max(0, t - o / 2)),
          t > 3e4 &&
            ((s.settings.maxFps = i.auto60 ? 0 : 60),
            s.saveSettings(),
            s.ui.message("手机有点热，帧率上限降到 60 帧（触控设置里可以改回来）", "#FFAA00"),
            (t = 0)));
    }, 2e3);
  })(),
  addEventListener("load", () => Stage.init()));
//# sourceURL=js/mobile.js
