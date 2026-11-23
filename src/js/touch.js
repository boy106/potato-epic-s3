"use strict";
const TouchDevice = (() => {
  const t = navigator.userAgent || "",
    mq = (t) => !(!window.matchMedia || !matchMedia(t).matches),
    e = navigator.maxTouchPoints || 0,
    n = e > 0 || "ontouchstart" in window,
    i = /Macintosh/.test(t) && e > 1,
    s =
      !(!navigator.userAgentData || !navigator.userAgentData.mobile) ||
      /Android|iPhone|iPad|iPod|Mobile|HarmonyOS|OpenHarmony/i.test(t) ||
      i,
    o = i || /iPad|Tablet/i.test(t) || (/Android/i.test(t) && !/Mobile/i.test(t)),
    c = s ? (o ? "tablet" : "phone") : n ? "touchpc" : "pc";
  return {
    kind: c,
    touch: n,
    defaultOn: s || (n && mq("(pointer: coarse)") && !mq("(any-pointer: fine)")),
    name: { phone: "手机", tablet: "平板", touchpc: "触屏电脑", pc: "电脑" }[c],
  };
})();
function touchLook(t) {
  return (
    void 0 === t.touchLook &&
      void 0 !== t.touchSens &&
      0.5 !== t.touchSens &&
      (t.touchLook = Math.round(20 * (1.6 * t.touchSens + 0.2)) / 20),
    t.touchLook ?? ("phone" === TouchDevice.kind ? 1.5 : 1)
  );
}
// W5b（GDD-05 H2）：统一视角写入口——触屏滑动与陀螺仪增量共用。
// 传入的 dYaw/dPitch 为已含各自灵敏度与翻转处理的弧度增量（正 dYaw = 视角右转）。
// 同一入口天然实现帧级仲裁：写入时记录 _lookWriteAt/_lookWriteSrc，
// 陀螺仪消费侧据此丢弃与触屏滑动同帧的 pending 增量（§7.5）。
function lookWrite(g, dYaw, dPitch, src) {
  const p = g.player;
  p.yaw -= dYaw;
  p.pitch = clamp(p.pitch - dPitch, -Math.PI / 2 + 0.001, Math.PI / 2 - 0.001);
  g._lookWriteAt = performance.now();
  g._lookWriteSrc = src;
}
const touchSizeOf = (t) => t.touchSize ?? ("tablet" === TouchDevice.kind ? 1.3 : 1),
  touchOn = (t) =>
    t.settings.touch ??
    t.touchAuto ??
    (t.settings.touchPick ? "phone" === t.settings.touchPick : TouchDevice.defaultOn);
function touchHoldUse(t) {
  const e = t && ITEMS[t.id];
  return (
    !!e &&
    (!!e.food ||
      /^(bow|crossbow|trident|shield|spyglass|milk_bucket|potion|honey_bottle|goat_horn)$/.test(
        e.key,
      ))
  );
}
const TOUCH_ICONS = (() => {
  const t = {
      up: [
        "....#....",
        "...###...",
        "..#####..",
        ".#######.",
        "#########",
        "...###...",
        "...###...",
        "...###...",
        "...###...",
      ],
      ul: [
        "#####....",
        "####.....",
        "####.....",
        "#####....",
        "#..###...",
        "....###..",
        ".....###.",
        "......###",
        ".......##",
      ],
      jump: [
        "....#....",
        "...###...",
        "..#####..",
        ".#######.",
        "#########",
        "...###...",
        "...###...",
        ".........",
        "#########",
      ],
      sneak: [
        "..#####..",
        ".##...##.",
        "##.....##",
        "#.......#",
        "#.......#",
        "#.......#",
        "##.....##",
        ".##...##.",
        "..#####..",
      ],
      sneakOn: [
        "..#####..",
        ".#######.",
        "#########",
        "#########",
        "#########",
        "#########",
        "#########",
        ".#######.",
        "..#####..",
      ],
      sprint: [
        "....#....",
        "...###...",
        "..##.##..",
        ".##...##.",
        "##..#..##",
        "...###...",
        "..##.##..",
        ".##...##.",
        "##.....##",
      ],
      prone: [
        // W12a 趴/扑键（07-§8.6）：横卧人形
        ".........",
        ".........",
        ".........",
        ".##......",
        ".########",
        "##.######",
        "##...##.#",
        ".....##..",
        ".........",
      ],
      pause: [
        ".........",
        ".##...##.",
        ".##...##.",
        ".##...##.",
        ".##...##.",
        ".##...##.",
        ".##...##.",
        ".##...##.",
        ".........",
      ],
      chat: [
        ".........",
        "#########",
        "#.......#",
        "#.#.#.#.#",
        "#.......#",
        "#########",
        ".##......",
        ".#.......",
        ".........",
      ],
      view: [
        ".........",
        "..#####..",
        ".##...##.",
        "##.###.##",
        "#..###..#",
        "##.###.##",
        ".##...##.",
        "..#####..",
        ".........",
      ],
      close: [
        "##.....##",
        "###...###",
        ".###.###.",
        "..#####..",
        "...###...",
        "..#####..",
        ".###.###.",
        "###...###",
        "##.....##",
      ],
    },
    cw = (t) =>
      t[0].split("").map((e, n) =>
        t
          .map((t) => t[n])
          .reverse()
          .join(""),
      );
  return (
    (t.right = cw(t.up)),
    (t.down = cw(t.right)),
    (t.left = cw(t.down)),
    (t.ur = t.ul.map((t) => [...t].reverse().join(""))),
    (t.descend = [...t.jump].reverse()),
    t
  );
})();
class TouchControls {
  constructor(t) {
    ((this.g = t),
      (this.ui = t.ui),
      (this.t = new Map()),
      (this.pend = []),
      (this.lastSlotTap = null),
      (t.touchHeld = {}));
    const e = { passive: !1 };
    (window.addEventListener("touchstart", (t) => this.onStart(t), e),
      window.addEventListener("touchmove", (t) => this.onMove(t), e),
      window.addEventListener("touchend", (t) => this.onEnd(t, !1), e),
      window.addEventListener("touchcancel", (t) => this.onEnd(t, !0), e),
      document.addEventListener("gesturestart", (t) => t.preventDefault()));
    const n = this.ui.input;
    n &&
      n.addEventListener(
        "touchend",
        (t) => {
          "none" !== n.style.display &&
            document.activeElement !== n &&
            (t.preventDefault(), n.focus());
        },
        e,
      );
  }
  on() {
    return touchOn(this.g);
  }
  playing() {
    return "play" === this.g.state && !this.ui.screen;
  }
  gui(t, e) {
    const n = this.ui.canvas.getBoundingClientRect(),
      i = this.ui.dpr / this.ui.scale;
    return [(t - n.left) * i, (e - n.top) * i];
  }
  reset() {
    const t = this.g;
    for (const e of this.t.values()) e.holding && (t.mouseBtn[e.holdBtn] = !1);
    (this.t.clear(),
      (this.pend.length = 0),
      t.touchHeld && t.touchHeld.forward && releaseAction(t, "forward"),
      (t.touchHeld = {}));
  }
  onStart(t) {
    const e = this.ui;
    if (t.target === e.input) return;
    ((e.lastTouch = performance.now()), this.prune(t));
    const n = this.playing();
    if (!n || this.on()) {
      (t.preventDefault(), Sound.init());
      for (const e of t.changedTouches) {
        const [t, i] = this.gui(e.clientX, e.clientY),
          s = {
            sx: e.clientX,
            sy: e.clientY,
            cx: e.clientX,
            cy: e.clientY,
            x0: t,
            y0: i,
            x: t,
            y: i,
            t0: performance.now(),
          },
          o = this.t.get(e.identifier);
        (o && (this.t.delete(e.identifier), this.endTouch(o, !0)),
          this.t.set(e.identifier, s),
          n ? this.startPlay(s) : this.startMenu(s));
      }
    }
  }
  endTouch(t, e) {
    "menu" === t.kind ? this.endMenu(t, e) : this.endPlay(t, e);
  }
  prune(t) {
    if (!t.touches || !this.t.size) return;
    const e = new Set();
    for (const n of t.touches) e.add(n.identifier);
    for (const [t, n] of [...this.t]) e.has(t) || (this.t.delete(t), this.endTouch(n, !0));
  }
  onMove(t) {
    this.prune(t);
    let e = !1;
    for (const n of t.changedTouches) {
      const t = this.t.get(n.identifier);
      if (!t) continue;
      e = !0;
      const i = t.cx,
        s = t.cy;
      ((t.cx = n.clientX),
        (t.cy = n.clientY),
        ([t.x, t.y] = this.gui(t.cx, t.cy)),
        (t.cx - t.sx) ** 2 + (t.cy - t.sy) ** 2 > 100 && (t.moved = !0),
        "menu" === t.kind ? this.moveMenu(t) : this.movePlay(t, t.cx - i, t.cy - s));
    }
    e && t.preventDefault();
  }
  onEnd(t, e) {
    let n = !1;
    this.ui.lastTouch = performance.now();
    for (const i of t.changedTouches) {
      const t = this.t.get(i.identifier);
      t && ((n = !0), this.t.delete(i.identifier), this.endTouch(t, e));
    }
    if (
      (this.prune(t),
      n &&
        (t.preventDefault(),
        Sound.init(),
        this.on() &&
          !this.fsTried &&
          !e &&
          "play" === this.g.state &&
          !/BiliApp/i.test(navigator.userAgent)))
    ) {
      this.fsTried = !0;
      const e = document.documentElement,
        n = e.requestFullscreen || e.webkitRequestFullscreen;
      if (!fsElement() && n && fsSupported()) {
        "undefined" != typeof Telemetry &&
          Telemetry.count &&
          (Telemetry.count("fs_try"), Telemetry.flush && Telemetry.flush(!1));
        try {
          const t = n.call(e, { navigationUI: "hide" });
          t &&
            t.then &&
            t
              .then(() => {
                if (
                  (Telemetry.count && Telemetry.count("fs_ok"),
                  screen.orientation && screen.orientation.lock)
                )
                  return screen.orientation.lock("landscape");
              })
              .catch(() => {});
        } catch (t) {}
      }
    }
  }
  synth(t, e, n, i) {
    const s = { clientX: i ? e.sx : e.cx, clientY: i ? e.sy : e.cy, button: n, shiftKey: !1 };
    "down" === t ? this.ui.mouseDown(s) : "up" === t ? this.ui.mouseUp(s) : this.ui.mouseMove(s);
  }
  focusInput() {
    const t = this.ui;
    t.screen &&
      t.screen.isChat &&
      "block" === t.input.style.display &&
      document.activeElement !== t.input &&
      t.input.focus();
  }
  startMenu(t) {
    const e = this.ui,
      n = e.screen;
    ((t.kind = "menu"), (t.mode = "pending"));
    const i = this.closeRect();
    if (i && e.hit(i, t.x, t.y)) return void (t.mode = "close");
    if (
      (document.activeElement !== e.input ||
        (e.inputBox && e.hit(e.inputBox, t.x, t.y)) ||
        e.input.blur(),
      (e.mouse.x = t.x),
      (e.mouse.y = t.y),
      !n)
    )
      return;
    n.touchHold && n.touchHold();
    const s =
        !(n instanceof ContainerScreen) &&
        n.widgets &&
        n.widgets.some((n) => n.slider && !1 !== n.enabled && e.hit(n, t.x, t.y)),
      o =
        n instanceof CreativeScreen &&
        t.x >= n.x + 172 &&
        t.x < n.x + 190 &&
        t.y >= n.y + 16 &&
        t.y < n.y + 132;
    (s || o || n.touchDrag || (n.touchDragAt && n.touchDragAt(t.x, t.y))) &&
      (this.synth("down", t, 0), (t.mode = "drag"));
  }
  moveMenu(t) {
    const e = this.ui,
      n = e.screen;
    if ("drag" === t.mode || "down" === t.mode || "long" === t.mode)
      return void this.synth("move", t);
    if ("scroll" === t.mode) return void this.scrollBy(t);
    if ("pending" !== t.mode || !t.moved) return;
    const i = n instanceof ContainerScreen,
      s = t.cx - t.sx,
      o = t.cy - t.sy,
      c = i && n.slotAt ? n.slotAt(t.x0, t.y0) : null,
      r = !(e.cursor || !c || !c.get() || c.creative || (n.scrollsAt && n.scrollsAt(t.x0, t.y0)));
    n && n.wheel && (!i || (!e.cursor && !r && Math.abs(o) > Math.abs(s)))
      ? ((t.mode = "scroll"), (t.acc = 0), (t.ly = t.y0), this.scrollBy(t))
      : i
        ? (!e.cursor && c && c.get() && (t.carry = c),
          this.synth("down", t, 0, !0),
          (t.mode = "down"),
          this.synth("move", t))
        : (t.mode = "none");
  }
  scrollBy(t) {
    const e = this.ui.screen;
    if (e && e.scrollPx) return (e.scrollPx(t.y - t.ly), void (t.ly = t.y));
    const n =
      e instanceof WorldListScreen
        ? 36
        : e instanceof OptionsListScreen
          ? 25
          : e instanceof ContainerScreen
            ? 18
            : 20;
    for (t.acc += t.y - t.ly, t.ly = t.y; Math.abs(t.acc) >= n;) {
      const e = Math.sign(t.acc);
      ((t.acc -= e * n), this.ui.wheel(-e));
    }
  }
  endMenu(t, e) {
    const n = this.ui;
    switch (t.mode) {
      case "close": {
        const i = this.closeRect();
        !e && i && n.hit(i, t.x, t.y) && this.closeScreen();
        break;
      }
      case "pending":
        e || this.tap(t);
        break;
      case "drag":
      case "down":
        (this.synth("up", t, 0), t.carry && !e && this.dropCarried(t));
        break;
      case "long":
        this.synth("up", t, 2);
        break;
      case "scroll":
        n.screen && n.screen.scrollRelease && n.screen.scrollRelease();
    }
    n.screen instanceof ContainerScreen || ((n.mouse.x = -1e3), (n.mouse.y = -1e3));
  }
  dropCarried(t) {
    const e = this.ui,
      n = e.screen;
    if (!(n instanceof ContainerScreen && e.cursor)) return;
    const i = n.slotAt(t.x, t.y),
      s = t.carry,
      clickAt = (e) => {
        ((n.lastClick = null), this.synth("down", t, 0, e), this.synth("up", t, 0, e));
      };
    (i && i !== s && !i.output
      ? (clickAt(!1), !e.cursor || s.output || s.get() || clickAt(!0))
      : s.output || s.get() || clickAt(!0),
      (n.lastClick = null));
  }
  tap(t) {
    (this.ui.screen instanceof ContainerScreen && this.quickMoveTap(t)) ||
      (this.synth("down", t, 0, !0), this.synth("up", t, 0, !0), this.focusInput());
  }
  quickMoveTap(t) {
    const e = this.ui,
      n = e.screen,
      i = n.slotAt(t.x0, t.y0),
      s = performance.now(),
      o = this.lastSlotTap;
    return (
      (this.lastSlotTap = i ? { slot: i, sc: n, t: s } : null),
      !(!i || !o || o.slot !== i || o.sc !== n || s - o.t > 350) &&
        !(i.output || !e.cursor || i.get() || !n.canPlace(i, e.cursor)) &&
        (n.net
          ? (n.net.click(n, i.v, 0, 0), n.net.click(n, i.v, 0, 1), (this.lastSlotTap = null), !0)
          : (i.set(e.cursor),
            (e.cursor = null),
            n.quickMove(i),
            n.changed(),
            (this.lastSlotTap = null),
            !0))
    );
  }
  closeRect() {
    const t = this.g,
      e = this.ui.screen;
    if (!e || "play" !== t.state || !this.on()) return null;
    if (!(
      e instanceof ContainerScreen ||
      e.isChat ||
      e.touchClose ||
      ("undefined" != typeof CreditsScreen && e instanceof CreditsScreen)
    ))
      return null;
    const { B: n } = this.metrics(),
      i = Math.round(0.9 * n);
    return { x: this.ui.w - 4 - i, y: 4, w: i, h: i };
  }
  closeScreen() {
    const t = this.ui,
      e = t.screen;
    e.onEsc ? e.onEsc() : t.close();
  }
  metrics() {
    const t = this.ui,
      e = t.w,
      n = t.h,
      i = t.dpr / t.scale,
      s = this.g.settings;
    let o = Math.round(50 * touchSizeOf(s) * i);
    return (
      (o = Math.max(
        12,
        Math.min(
          o,
          Math.floor((e / 2 - 97) / 3.3),
          Math.floor((e / 2 - 117) / 2.4),
          Math.floor((n - 40) / 3.6),
        ),
      )),
      {
        B: o,
        m: Math.max(3, Math.round(0.3 * o)),
        gp: Math.max(1, Math.round(0.06 * o)),
        W: e,
        H: n,
      }
    );
  }
  layout() {
    const { B: t, m: e, gp: n, W: i, H: s } = this.metrics(),
      o = this.g,
      c = o.player,
      r = o.touchHeld,
      a = o.settings,
      h = { B: t, gp: n, x0: e, y0: s - e - 3 * t };
    h.dpad = { x: h.x0, y: h.y0, w: 3 * t, h: 3 * t };
    const cell = (e, i) => ({
      x: h.x0 + i * t + n,
      y: h.y0 + e * t + n,
      w: t - 2 * n,
      h: t - 2 * n,
    });
    ((h.cells = { up: cell(0, 1), left: cell(1, 0), right: cell(1, 2), down: cell(2, 1) }),
      r.forward && ((h.cells.ul = cell(0, 0)), (h.cells.ur = cell(0, 2))),
      c.flying || (h.cells.sneak = cell(1, 1)));
    const l = i - e - t,
      u = s - e - 2 * t - n;
    ((h.jump = { x: l, y: u, w: t, h: t }),
      (c.flying || this.editAll) && (h.descend = { x: l, y: s - e - t, w: t, h: t }),
      !(c.flying || this.editAll) && (h.prone = { x: l, y: s - e - t, w: t, h: t }), // W12a 趴/扑键：跳跃键下方（07-§8.6；编辑/飞行让位 descend）
      !1 !== a.touchSprintBtn &&
        "spectator" !== o.mode &&
        (h.sprint = { x: l - t - n, y: s - e - t, w: t, h: t }));
    const d = o.targetEntity;
    if ("spectator" !== o.mode && ((d && (!d.T || !d.T.hostile)) || this.editAll)) {
      h.interactText =
        d && "undefined" != typeof Villager && d instanceof Villager ? "交易" : "互动";
      const s = Math.max(t, Font.width(h.interactText) + 12),
        o = Math.round(0.6 * t);
      h.interact = { x: i - e - s, y: u - o - 2 * n, w: s, h: o };
    }
    const p = Math.round(0.7 * t);
    if (
      ((h.pause = { x: i - 4 - p, y: 4, w: p, h: p }),
      (h.chat = { x: i - 4 - 2 * p - n, y: 4, w: p, h: p }),
      (h.view = { x: i - 4 - 3 * p - 2 * n, y: 4, w: p, h: p }),
      "spectator" !== o.mode)
    ) {
      const t = Math.floor(i / 2 - 91),
        e = s - 22;
      ((h.hotbar = { x: t, y: e, w: 182, h: 22 }), (h.inv = { x: t + 184, y: e, w: 20, h: 22 }));
    }
    return ((h.chatLift = Math.max(0, e + 3 * t - 38)), (this.L = h));
  }
  hitL(t, e, n, i = this.L.gp) {
    return !!t && e >= t.x - i && n >= t.y - i && e < t.x + t.w + i && n < t.y + t.h + i;
  }
  dpadCell(t, e, n) {
    const i = this.L,
      s = i.dB || i.B,
      o = n ? 0 : 0.75 * s;
    if (t < i.x0 - o || e < i.y0 - o || t >= i.x0 + 3 * s + o || e >= i.y0 + 3 * s + o) return null;
    const c = clamp(Math.floor((t - i.x0) / s), 0, 2),
      r = [
        ["ul", "up", "ur"],
        ["left", "sneak", "right"],
        [null, "down", null],
      ][clamp(Math.floor((e - i.y0) / s), 0, 2)][c];
    return "sneak" === r
      ? n && i.cells.sneak
        ? "sneak"
        : null
      : ("ul" !== r && "ur" !== r) || !n
        ? r
        : null;
  }
  setDir(t) {
    const e = this.g,
      n = e.touchHeld,
      i = "up" === t || "ul" === t || "ur" === t,
      s = !!n.forward;
    ((n.forward = i),
      (n.back = "down" === t),
      (n.left = "left" === t || "ul" === t),
      (n.right = "right" === t || "ur" === t),
      i && !s && pressAction(e, "forward"),
      !i && s && (releaseAction(e, "forward"), (n.sprint = !1)));
  }
  hotbarAt(t) {
    const e = this.L,
      n = this.g.player,
      i = clamp(Math.floor((t.x - e.hotbar.x - 1) / 20), 0, 8);
    i !== t.slot && ((t.slot = i), (t.t0 = performance.now()), (t.dropped = !1), (n.inv.sel = i));
  }
  startPlay(t) {
    const e = this.g,
      n = e.touchHeld,
      i = this.layout(),
      s = t.x,
      o = t.y;
    t.kind = "look";
    for (const e of ["pause", "chat", "view", "inv", "interact"])
      if (this.hitL(i[e], s, o)) return ((t.kind = "button"), void (t.btn = e));
    if (i.hotbar && this.hitL(i.hotbar, s, o, 0))
      return ((t.kind = "hotbar"), void this.hotbarAt(t));
    if (this.hitL(i.jump, s, o))
      return ((t.kind = "jump"), (n.jump = !0), void pressAction(e, "jump"));
    if (i.descend && this.hitL(i.descend, s, o)) return ((t.kind = "descend"), void (n.down = !0));
    if (i.prone && this.hitL(i.prone, s, o))
      return ((t.kind = "none"), void (n.prone = !n.prone)); // W12a 趴/扑 toggle（07-§8.6）
    if (i.sprint && this.hitL(i.sprint, s, o))
      return ((t.kind = "none"), void (n.sprint = !n.sprint));
    const c = this.dpadCell(s, o, !0);
    if ("sneak" === c) return ((t.kind = "none"), void (n.sneak = !n.sneak));
    c && ((t.kind = "dpad"), (t.cell = c), this.setDir(c));
  }
  movePlay(t, e, n) {
    const i = this.g,
      s = i.player,
      o = i.settings;
    if ("look" === t.kind) {
      const t = 0.0045 * touchLook(o);
      lookWrite(i, e * t * (o.invertX ? -1 : 1), n * t * (o.invertY ? -1 : 1), "touch");
    } else if ("dpad" === t.kind) {
      const e = this.dpadCell(t.x, t.y, !1);
      e !== t.cell && ((t.cell = e), this.setDir(e));
    } else "hotbar" === t.kind && this.hitL(this.L.hotbar, t.x, t.y, 4) && this.hotbarAt(t);
  }
  endPlay(t, e) {
    const n = this.g,
      i = n.touchHeld;
    switch (t.kind) {
      case "look":
        t.holding
          ? (n.mouseBtn[t.holdBtn] = !1)
          : !t.moved && !e && performance.now() - t.t0 < 350 && this.click(n.targetEntity ? 0 : 2);
        break;
      case "dpad":
        this.setDir(null);
        break;
      case "jump":
        i.jump = !1;
        break;
      case "descend":
        i.down = !1;
        break;
      case "button":
        !e && this.hitL(this.L[t.btn], t.x, t.y) && this.button(t.btn);
    }
  }
  click(t) {
    const e = this.g,
      n = e.player;
    (0 === t
      ? ((e.mouseBtn[0] = !0),
        (e.mouseClicked0 = !0),
        (e.attackCd = Math.min(e.attackCd, 0)),
        e.targetEntity || e.target || n.swing())
      : ((e.mouseBtn[2] = !0), (e.useCd = 0)),
      this.pend.push({ b: t, tick: e.tickCount }));
  }
  button(t) {
    const e = this.g;
    switch (t) {
      case "pause":
        e.ui.open(new PauseScreen(e));
        break;
      case "chat":
        (pressAction(e, "chat"), this.focusInput());
        break;
      case "view":
        pressAction(e, "togglePerspective");
        break;
      case "inv":
        pressAction(e, "inventory");
        break;
      case "interact":
        this.click(2);
    }
  }
  update(t) {
    const e = this.g,
      n = e.player,
      i = e.touchHeld;
    for (let t = this.pend.length - 1; t >= 0; t--) {
      const n = this.pend[t];
      e.tickCount > n.tick &&
        ([...this.t.values()].some((t) => t.holding && t.holdBtn === n.b) || (e.mouseBtn[n.b] = !1),
        this.pend.splice(t, 1));
    }
    if (n) {
      n.flying && i.sneak && (i.sneak = !1);
      for (const i of this.t.values()) {
        if (
          "look" === i.kind &&
          !i.moved &&
          !i.holding &&
          t - i.t0 >= 300 &&
          this.playing() &&
          "spectator" !== e.mode
        ) {
          i.holding = !0;
          const t = n.inv.held && ITEMS[n.inv.held.id],
            s = n.inv.slots[40],
            o =
              (!e.target || !!e.targetEntity) &&
              !touchHoldUse(n.inv.held) &&
              touchHoldUse(s) &&
              !(t && (e.mainHandBusy(n.inv.held, t) || (t.tool && "sword" !== t.tool.type)))
                ? s
                : n.inv.held;
          if (
            ((i.holdBtn =
              !touchHoldUse(o) || (e.targetEntity && "shield" !== ITEMS[o.id].key) ? 0 : 2),
            2 === i.holdBtn
              ? ((e.mouseBtn[2] = !0), (e.useCd = 0))
              : ((e.mouseBtn[0] = !0),
                (e.mouseClicked0 = !0),
                (e.attackCd = Math.min(e.attackCd, 0)),
                e.target || e.targetEntity || n.swing()),
            navigator.vibrate)
          )
            try {
              navigator.vibrate(10);
            } catch (t) {}
        }
        if (
          "hotbar" === i.kind &&
          !i.dropped &&
          t - i.t0 >= 600 &&
          this.playing() &&
          ((i.dropped = !0), pressAction(e, "drop", { ctrlKey: !0 }), navigator.vibrate)
        )
          try {
            navigator.vibrate(20);
          } catch (t) {}
        if (
          "menu" === i.kind &&
          "pending" === i.mode &&
          t - i.t0 >= 350 &&
          this.ui.screen instanceof ContainerScreen &&
          ((i.mode = "long"),
          this.synth("down", i, 2, !0),
          this.synth("move", i),
          navigator.vibrate)
        )
          try {
            navigator.vibrate(10);
          } catch (t) {}
      }
    }
  }
  topInset() {
    return this.on() && "play" === this.g.state && !this.ui.screen && this.L
      ? Math.round(0.7 * this.L.B) + 6
      : 0;
  }
  chatLift() {
    return this.on() && "play" === this.g.state && !this.ui.screen && this.L ? this.L.chatLift : 0;
  }
  icon(t, e, n, i) {
    const s = TOUCH_ICONS[e],
      o = s.length,
      c = Math.max(1, Math.floor((Math.min(n.w, n.h) * (o > 9 ? 0.66 : 0.6)) / o)),
      r = Math.round(n.x + (n.w - o * c) / 2),
      a = Math.round(n.y + (n.h - o * c) / 2),
      h = t.globalAlpha;
    t.fillStyle = i;
    for (let e = 0; e < o; e++)
      for (let n = 0; n < o; n++) {
        const i = s[e][n];
        ("#" !== i && "+" !== i) ||
          ((t.globalAlpha = "+" === i ? 0.45 * h : h), t.fillRect(r + n * c, a + e * c, c, c));
      }
    t.globalAlpha = h;
  }
  btn(t, e, n, i, s) {
    if (!e) return;
    const o = Math.round(e.x),
      c = Math.round(e.y),
      r = Math.round(e.w),
      a = Math.round(e.h),
      h = this.ui.scale,
      l = t.globalAlpha;
    if (r <= 0 || a <= 0) return;
    const u = this.spr || (this.spr = new Map()),
      d = (s ? '"' + s : n) + "|" + (i ? 1 : 0) + "|" + r + "|" + a + "|" + l + "|" + h;
    let p = u.get(d);
    if (p) (u.delete(d), u.set(d, p));
    else {
      ((p = document.createElement("canvas")), (p.width = r * h), (p.height = a * h));
      const t = p.getContext("2d");
      (t.setTransform(h, 0, 0, h, 0, 0),
        (t.imageSmoothingEnabled = !1),
        (t.globalAlpha = l),
        this.btnRaw(t, 0, 0, r, a, n, i, s),
        u.set(d, p),
        u.size > 64 && u.delete(u.keys().next().value));
    }
    ((t.globalAlpha = 1), t.drawImage(p, o, c, r, a), (t.globalAlpha = l));
  }
  btnRaw(t, e, n, i, s, o, c, r) {
    if (self.POTATO && self.POTATO_BTN) return self.POTATO_BTN(t, e, n, i, s, o, c, r);
    const a = Math.max(1, Math.round(Math.min(i, s) / 22));
    ((t.fillStyle = "rgba(0,0,0,0.55)"),
      t.fillRect(e, n, i, a),
      t.fillRect(e, n + s - a, i, a),
      t.fillRect(e, n + a, a, s - 2 * a),
      t.fillRect(e + i - a, n + a, a, s - 2 * a),
      (t.fillStyle = c ? "rgba(150,150,150,0.6)" : "rgba(40,40,40,0.5)"),
      t.fillRect(e + a, n + a, i - 2 * a, s - 2 * a));
    const h = c ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.28)",
      l = c ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.35)";
    ((t.fillStyle = h),
      t.fillRect(e + a, n + a, i - 2 * a, a),
      t.fillRect(e + a, n + 2 * a, a, s - 3 * a),
      (t.fillStyle = l),
      t.fillRect(e + 2 * a, n + s - 2 * a, i - 3 * a, a),
      t.fillRect(e + i - 2 * a, n + 2 * a, a, s - 4 * a));
    const u = { x: e, y: n + (c ? a : 0), w: i, h: s };
    r
      ? Font.center(t, r, e + i / 2, Math.round(n + (s - 8) / 2) + (c ? a : 0), "#FFFFFF")
      : TOUCH_ICONS[o] &&
        (this.icon(t, o, { ...u, x: u.x + a, y: u.y + a }, "rgba(0,0,0,0.5)"),
        this.icon(t, o, u, c ? "#FFFFFF" : "#E6E6E6"));
  }
  draw(t) {
    const e = this.g,
      n = t.ctx,
      i = e.settings;
    if ((this.update(performance.now()), !this.on())) return;
    const s =
      t.canvas.width +
      "x" +
      t.canvas.height +
      "x" +
      t.scale +
      "x" +
      (i.touchOpacity ?? 0.7) +
      "x" +
      (i.touchSize ?? "");
    if (
      (!this.spr || (this.sprSig === s && this.sprScale === i.touchScale) || this.spr.clear(),
      (this.sprSig = s),
      (this.sprScale = i.touchScale),
      t.h > t.w)
    ) {
      const e = "横屏游玩体验更佳",
        i = Font.width(e) + 8;
      ((n.fillStyle = "rgba(0,0,0,0.6)"),
        n.fillRect(Math.floor(t.w / 2 - i / 2), 2, i, 12),
        Font.center(n, e, t.w / 2, 4, "#FFFF55"));
    }
    if ("play" !== e.state) return;
    if (t.screen) {
      const t = this.closeRect();
      return void (t && this.btn(n, t, "close", !1));
    }
    const o = this.layout(),
      c = e.touchHeld,
      r = e.player,
      a = new Set(
        [...this.t.values()].map((t) =>
          "dpad" === t.kind ? t.cell : "button" === t.kind ? t.btn : t.kind,
        ),
      );
    (n.save(), (n.globalAlpha = e.settings.touchOpacity ?? 0.7));
    for (const t in o.cells)
      this.btn(
        n,
        o.cells[t],
        "sneak" === t ? (c.sneak ? "sneakOn" : "sneak") : t,
        "sneak" === t ? !!c.sneak : a.has(t),
      );
    if (
      (this.btn(n, o.jump, "jump", !!c.jump),
      this.btn(n, o.descend, "descend", !!c.down),
      o.prone && this.btn(n, o.prone, "prone", !!c.prone), // W12a 趴/扑键（07-§8.6）
      this.btn(n, o.sprint, "sprint", !!c.sprint || !!r.sprinting),
      o.interact && this.btn(n, o.interact, null, a.has("interact"), o.interactText),
      this.btn(n, o.pause, "pause", a.has("pause")),
      this.btn(n, o.chat, "chat", a.has("chat")),
      this.btn(n, o.view, "view", a.has("view")),
      o.inv)
    ) {
      const t = o.inv;
      if (
        (this.btn(n, { x: t.x, y: t.y + 1, w: t.w, h: t.h - 2 }, "inv", a.has("inv")), !self.POTATO)
      ) {
        n.fillStyle = "#FFFFFF";
        for (let e = 0; e < 3; e++) n.fillRect(t.x + 4 + 5 * e, t.y + 10, 2, 2);
      }
    }
    n.restore();
    for (const t of this.t.values())
      if ("hotbar" === t.kind && !t.dropped && r.inv.held) {
        const e = clamp((performance.now() - t.t0 - 150) / 450, 0, 1);
        e > 0 &&
          ((n.fillStyle = "#FFFFFF"),
          n.fillRect(o.hotbar.x + 3 + 20 * t.slot, o.hotbar.y - 3, Math.round(16 * e), 2));
      }
  }
}
function bindTouch(t) {
  const e = t.loadSettings();
  (!1 === t.settings.touch &&
    !t.settings.touchMig &&
    t.settings.onboarded &&
    (delete t.settings.touch, (t.settings.touchPick = "pc")),
    t.settings.touchMig || ((t.settings.touchMig = 1), t.saveSettings()),
    TouchDevice.defaultOn &&
      (void 0 === e.renderDist && (t.settings.renderDist = 6),
      void 0 === e.autoJump && (t.settings.autoJump = !0),
      t.applySettings()));
  const n = (t.ui.touch = new TouchControls(t));
  (window.addEventListener("blur", () => n.reset()),
    document.addEventListener("visibilitychange", () => {
      document.hidden &&
        (n.reset(),
        touchOn(t) && "play" === t.state && !t.ui.screen && t.ui.open(new PauseScreen(t)));
    }));
  window.addEventListener(
    "pointerdown",
    (e) => {
      void 0 === t.settings.touch &&
        "play" === t.state &&
        (("touch" !== e.pointerType && "pen" !== e.pointerType) || touchOn(t)
          ? "mouse" === e.pointerType &&
            touchOn(t) &&
            !t.ui.screen &&
            (t.touchAuto || (window.matchMedia && matchMedia("(any-pointer: fine)").matches)) &&
            (n.reset(), (t.touchAuto = !1))
          : ((t.touchAuto = !0), t.releasePointer()));
    },
    !0,
  );
  const i = Game.prototype.capturePointer;
  Game.prototype.capturePointer = function () {
    touchOn(this) || i.call(this);
  };
}
{
  const t = bindInput;
  bindInput = function (e) {
    (t(e), bindTouch(e));
  };
}
//# sourceURL=js/touch.js
