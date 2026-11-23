"use strict";
const KEYBIND_CATS = [
    [
      "移动",
      [
        ["forward", "向前移动", "KeyW"],
        ["left", "向左移动", "KeyA"],
        ["back", "向后移动", "KeyS"],
        ["right", "向右移动", "KeyD"],
        ["jump", "跳跃", "Space"],
        ["sneak", "潜行", "ShiftLeft"],
        ["sprint", "疾跑", "ControlLeft"],
        ["prone", "趴下/飞扑", "KeyZ"], // W12a（07-§8.6 桌面键位注册表）
      ],
    ],
    [
      "游戏内容",
      [
        ["attack", "攻击/摧毁", "Mouse0"],
        ["use", "使用物品/放置方块", "Mouse2"],
        ["pickItem", "选取方块", "Mouse1"],
      ],
    ],
    [
      "物品栏",
      [
        ["drop", "丢弃所选物品", "KeyQ"],
        ["inventory", "开启/关闭物品栏", "KeyE"],
        ["swapOffhand", "与副手交换物品", "KeyF"],
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((e) => ["hotbar." + e, "快捷栏" + e, "Digit" + e]),
      ],
    ],
    [
      "多人游戏",
      [
        ["chat", "打开聊天栏", "KeyT"],
        ["command", "输入命令", "Slash"],
      ],
    ],
    [
      "杂项",
      [
        ["advancements", "进度", "KeyL"],
        ["screenshot", "截图", "F2"],
        ["togglePerspective", "切换视角", "F5"],
        ["toggleGui", "切换界面", "F1"],
        ["fullscreen", "切换全屏显示", "F11"],
        ["help", "游戏说明", "KeyH"],
        ["companion", "AI 伙伴", "KeyV"],
      ],
    ],
  ],
  KEY_DEFAULT = {},
  KEY_CN = {};
for (const [, e] of KEYBIND_CATS)
  for (const [t, s, n] of e) ((KEY_DEFAULT[t] = n), (KEY_CN[t] = s));
const KEY_NAMES = {
  Space: "空格",
  ShiftLeft: "左Shift",
  ShiftRight: "右Shift",
  ControlLeft: "左Ctrl",
  ControlRight: "右Ctrl",
  AltLeft: "左Alt",
  AltRight: "右Alt",
  MetaLeft: "左Win",
  MetaRight: "右Win",
  Tab: "Tab",
  Enter: "Enter",
  Backspace: "Backspace",
  CapsLock: "Caps Lock",
  Escape: "Esc",
  Delete: "Delete",
  Insert: "Insert",
  Home: "Home",
  End: "End",
  PageUp: "Page Up",
  PageDown: "Page Down",
  ArrowUp: "上方向键",
  ArrowDown: "下方向键",
  ArrowLeft: "左方向键",
  ArrowRight: "右方向键",
  Slash: "/",
  Backslash: "\\",
  Comma: ",",
  Period: ".",
  Semicolon: ";",
  Quote: "'",
  BracketLeft: "[",
  BracketRight: "]",
  Minus: "-",
  Equal: "=",
  Backquote: "`",
  ContextMenu: "菜单",
  NumLock: "Num Lock",
  ScrollLock: "Scroll Lock",
  Pause: "Pause",
  PrintScreen: "Print Screen",
  Mouse0: "左键",
  Mouse1: "中键",
  Mouse2: "右键",
};
function keyLabel(e) {
  return e
    ? KEY_NAMES[e]
      ? KEY_NAMES[e]
      : e.startsWith("Key")
        ? e.slice(3)
        : e.startsWith("Digit")
          ? e.slice(5)
          : e.startsWith("Numpad")
            ? "小键盘" + e.slice(6)
            : e.startsWith("Mouse")
              ? "鼠标按键" + (+e.slice(5) + 1)
              : e
    : "未指定";
}
const keyOf = (e, t) => {
    const s = e.settings.keys && e.settings.keys[t];
    return void 0 !== s ? s : KEY_DEFAULT[t];
  },
  bindingsFor = (e, t) => (t ? Object.keys(KEY_DEFAULT).filter((s) => keyOf(e, s) === t) : []);
function bindDown(e, t) {
  if (e.touchHeld && e.touchHeld[t]) return !0;
  const s = keyOf(e, t);
  return !!s && (s.startsWith("Mouse") ? !(!e.rawMouse || !e.rawMouse[+s.slice(5)]) : !!e.keys[s]);
}
function pressAction(e, t, s) {
  const n = e.player,
    o = e.ui,
    i = e.settings,
    r = performance.now();
  switch (t) {
    case "inventory":
      return !e.net &&
        !e.p2pGuest &&
        "spectator" !== e.mode &&
        n.vehicle &&
        "undefined" != typeof Horse &&
        n.vehicle instanceof Horse &&
        (n.vehicle.tame || n.vehicle instanceof Camel)
        ? (o.open(new HorseScreen(e, n.vehicle)), !0)
        : ("spectator" !== e.mode &&
            o.open(
              "creative" === e.mode
                ? new CreativeScreen(e)
                : e.net
                  ? e.net.inventoryScreen()
                  : new CraftingScreen(e, 2),
            ),
          !0);
    case "chat":
      return (o.open(new ChatScreen(e)), !0);
    case "command":
      return (o.open(new ChatScreen(e, "/")), !0);
    case "help":
      return (o.open(new HelpScreen(e, null)), (o.screen.parent = null), !0);
    case "advancements":
      return (o.open(new AdvancementsScreen(e, null)), !0);
    case "companion":
      return (
        !!Companion.shown &&
        (Companion.ready
          ? o.open(new CompanionChatScreen(e))
          : o.open(new CompanionScreen(e, null)),
        !0)
      );
    case "toggleGui":
      return ((o.hideHud = !o.hideHud), !1);
    case "togglePerspective":
      return ((e.perspective = (e.perspective + 1) % 3), !1);
    case "fullscreen":
      return (toggleFullscreen(), !1);
    case "screenshot":
      return ((e.wantScreenshot = !0), !1);
    case "pickItem":
      return (e.pickBlock(), !1);
    case "swapOffhand":
      return ("spectator" !== e.mode && e.swapOffhand(), !1);
    case "drop":
      if (e.net)
        return (
          "spectator" !== e.mode && n.inv.held && (e.net.drop(!(!s || !s.ctrlKey)), n.swing()),
          !1
        );
      if ("spectator" !== e.mode) {
        const t = n.inv.held;
        if (t) {
          const o = s && s.ctrlKey ? t.count : 1;
          (e.dropFromPlayer({ ...t, count: o }),
            (t.count -= o),
            t.count || (n.inv.slots[n.inv.sel] = null),
            n.swing());
        }
      }
      return !1;
    case "jump":
      return "creative" === e.mode && r - (e.lastTap.space || 0) < 300
        ? ((n.flying = !n.flying), (n.vel[1] = 0), (n.gliding = !1), (e.lastTap.space = 0), !1)
        : ((e.lastTap.space = r), n.onGround || n.flying || !e.tryGlide || e.tryGlide(), !1);
    case "forward":
      return (
        r - (e.lastTap.w || 0) < 50 * (i.sprintWindow ?? 7) && (e.sprintToggle = !0),
        (e.lastTap.w = r),
        !1
      );
    case "sneak":
      return (i.toggleSneak && (e.sneakToggled = !e.sneakToggled), !1);
    case "sprint":
      return (i.toggleSprint && (e.sprintToggled = !e.sprintToggled), !1);
    case "attack":
      if (i.toggleAttack) {
        if (((e.mouseBtn[0] = !e.mouseBtn[0]), !e.mouseBtn[0])) return !1;
      } else e.mouseBtn[0] = !0;
      return (
        (e.mouseClicked0 = !0),
        (e.attackCd = Math.min(e.attackCd, 0)),
        e.targetEntity || e.target || n.swing(),
        !1
      );
    case "use":
      return (
        i.toggleUse ? (e.mouseBtn[2] = !e.mouseBtn[2]) : (e.mouseBtn[2] = !0),
        e.mouseBtn[2] && (e.useClicked = !0),
        (e.useCd = 0),
        !1
      );
  }
  return (t.startsWith("hotbar.") && (n.inv.sel = +t.slice(7) - 1), !1);
}
function releaseAction(e, t) {
  const s = e.settings;
  ("attack" !== t || s.toggleAttack || (e.mouseBtn[0] = !1),
    "use" !== t || s.toggleUse || (e.mouseBtn[2] = !1),
    "forward" === t && (e.sprintToggle = !1));
}
(Object.assign(OptionsListScreen.prototype, {
  controlOptions() {
    const e = this.game.settings,
      t = this.game,
      bt = (e, s, n) => ({
        label: e,
        onClick: () => {
          (s(), t.applySettings(), t.saveSettings());
        },
        ...n,
      }),
      sl = (e, s, n) => ({
        slider: !0,
        value: s,
        label: e,
        onChange: (e) => {
          (n(e), t.applySettings(), t.saveSettings());
        },
      }),
      hold = (s, n) =>
        bt(
          () => s + "：" + (e[n] ? "切换" : "按住"),
          () => {
            ((e[n] = !e[n]), (t.sneakToggled = t.sprintToggled = !1));
          },
        ),
      onoff = (e) => (e ? "开" : "关");
    return "mouse" === this.page
      ? [
          sl(
            () =>
              "鼠标灵敏度：" +
              (e.sens < 0.01
                ? "*哈欠*"
                : e.sens > 0.99
                  ? "超高速！！！"
                  : Math.round(200 * e.sens) + "%"),
            e.sens,
            (t) => (e.sens = Math.max(0.005, t)),
          ),
          bt(
            () => "反转鼠标X轴：" + onoff(e.invertX),
            () => (e.invertX = !e.invertX),
          ),
          bt(
            () => "反转鼠标Y轴：" + onoff(e.invertY),
            () => (e.invertY = !e.invertY),
          ),
          sl(
            () => "滚轮灵敏度：" + (e.scrollSens ?? 1).toFixed(2),
            Math.log10(100 * (e.scrollSens ?? 1)) / 3,
            (t) => (e.scrollSens = Math.round(100 * Math.pow(10, 3 * t - 2)) / 100),
          ),
          bt(
            () => "离散滚动：" + onoff(e.discreteScroll),
            () => (e.discreteScroll = !e.discreteScroll),
          ),
          bt(
            () => "原始输入：" + onoff(!1 !== e.rawInput),
            () => {
              e.rawInput = !1 === e.rawInput;
            },
          ),
        ]
      : "touch" === this.page
        ? [
            sl(
              () => "按钮大小：" + Math.round(100 * touchSizeOf(e)) + "%",
              (touchSizeOf(e) - 0.5) / 1.5,
              (t) => (e.touchSize = Math.round(20 * (0.5 + 1.5 * t)) / 20),
            ),
            sl(
              () => "按钮不透明度：" + Math.round(100 * (e.touchOpacity ?? 0.7)) + "%",
              ((e.touchOpacity ?? 0.7) - 0.2) / 0.8,
              (t) => (e.touchOpacity = Math.round(20 * (0.2 + 0.8 * t)) / 20),
            ),
            Object.assign(
              sl(
                () => "视角灵敏度：" + Math.round(100 * touchLook(e)) + "%",
                Math.log(touchLook(e) / 0.25) / Math.log(20),
                (t) => (e.touchLook = Math.round(0.25 * Math.pow(20, t) * 20) / 20),
              ),
              { tip: ["手指滑动转视角的快慢（只管触屏，鼠标在「鼠标设置」里）"] },
            ),
            bt(
              () => "疾跑按钮：" + (!1 === e.touchSprintBtn ? "隐藏" : "显示"),
              () => (e.touchSprintBtn = !1 === e.touchSprintBtn),
            ),
          ]
        : [
            bt("鼠标设置…", () => t.ui.open(new OptionsListScreen(t, this, "鼠标设置", "mouse"))),
            bt("按键绑定…", () => t.ui.open(new KeyBindsScreen(t, this))),
            Object.assign(
              bt(
                () => "触屏操作：" + onoff(touchOn(t)),
                () => {
                  ((e.touch = !touchOn(t)), t.ui.touch && t.ui.touch.reset());
                },
              ),
              {
                tip: [
                  "在屏幕上显示虚拟按键，用手指操作游戏。",
                  "检测到的设备：" +
                    TouchDevice.name +
                    "（默认" +
                    (TouchDevice.defaultOn ? "开启" : "关闭") +
                    "）",
                ],
              },
            ),
            Object.assign(
              bt("触控设置…", () => t.ui.open(new OptionsListScreen(t, this, "触控设置", "touch"))),
              { glowBlue: !0 },
            ),
            hold("潜行", "toggleSneak"),
            hold("疾跑", "toggleSprint"),
            hold("攻击/摧毁", "toggleAttack"),
            hold("使用物品/放置方块", "toggleUse"),
            bt(
              () => "自动跳跃：" + onoff(e.autoJump),
              () => (e.autoJump = !e.autoJump),
            ),
            Object.assign(
              sl(
                () => "疾跑间隔：" + (e.sprintWindow ?? 7) + "刻",
                ((e.sprintWindow ?? 7) - 1) / 9,
                (t) => (e.sprintWindow = Math.round(1 + 9 * t)),
              ),
              { tip: ["双击前进键激活疾跑的最大时间间隔，以刻为单位。"] },
            ),
          ];
  },
}),
  Object.assign(OptionsListScreen.prototype, {
    cosOptions() {
      const e = this.game.settings,
        t = this.game,
        s = ["all", "mine", "none"],
        n = { all: "全部", mine: "只显示自己的", none: "都不显示" };
      return [
        {
          label: () => "显示装饰：" + n[e.cosShow || "all"],
          onClick: () => {
            ((e.cosShow = s[(s.indexOf(e.cosShow || "all") + 1) % s.length]), t.saveSettings());
          },
          tip: [
            "披风、帽子、宠物和名字前缀",
            "全部：自己和别人的都显示",
            "只显示自己的：别人的不显示",
            "都不显示：自己的也不显示",
            "画质为流畅时，没选过这一项就不显示别人的宠物",
          ],
        },
        {
          label: "皮肤和装饰…",
          onClick: () => t.ui.open(new WardrobeScreen(t, this)),
          tip: ["换皮肤、穿披风、戴帽子、带宠物、名字前缀"],
        },
      ];
    },
  }),
  (() => {
    const e = OptionsListScreen.prototype.options;
    OptionsListScreen.prototype.options = function () {
      return "controls" === this.page || "mouse" === this.page || "touch" === this.page
        ? this.controlOptions()
        : "cos" === this.page
          ? this.cosOptions()
          : e.call(this);
    };
    const t = OptionsScreen.prototype.layout;
    OptionsScreen.prototype.layout = function () {
      t.call(this);
      const e = this.game,
        s = this.widgets.find((e) => "皮肤自定义…" === e.label);
      s &&
        Object.assign(s, {
          label: "皮肤与装饰…",
          enabled: !0,
          gold: !0,
          tip: ["显示装饰：全部 / 只显示自己的 / 都不显示", "换皮肤和装饰"],
          onClick: () => e.ui.open(new OptionsListScreen(e, this, "皮肤与装饰", "cos")),
        });
    };
  })());
class KeyBindsScreen extends MenuScreen {
  constructor(e, t) {
    (super(e, "按键绑定"),
      (this.parent = t),
      (this.pauses = "play" === e.state),
      (this.titleY = 12),
      (this.scroll = 0),
      (this.sel = null));
  }
  layout() {
    const e = this.game.ui,
      t = e.w / 2,
      s = this.game,
      n = s.settings;
    ((this.top = 33), (this.bottom = e.h - 33), n.keys || (n.keys = {}));
    const o = [];
    for (const [e, t] of KEYBIND_CATS) {
      o.push({ cat: e });
      for (const [e] of t)
        ("companion" !== e || ("undefined" != typeof Companion && Companion.shown)) &&
          o.push({ name: e });
    }
    ((this.rows = o),
      (this.rowW = 340),
      (this.rowX = t - this.rowW / 2),
      (this.footer = [
        {
          x: t - 155,
          y: e.h - 27,
          w: 150,
          h: 20,
          label: "重置按键",
          onClick: () => {
            ((n.keys = {}), (this.sel = null), s.saveSettings());
          },
        },
        { x: t + 5, y: e.h - 27, w: 150, h: 20, label: "完成", onClick: () => this.back() },
      ]),
      this.place());
  }
  place() {
    const e = Math.max(0, 20 * this.rows.length + 4 - (this.bottom - this.top));
    this.scroll = clamp(this.scroll, 0, e);
    const t = this.game,
      s = t.settings,
      n = [],
      o = this.rowX + this.rowW;
    (this.rows.forEach((e, i) => {
      const r = this.top + 4 - this.scroll + 20 * i;
      if (((e.y = r), !e.name || r < this.top || r + 20 > this.bottom)) return;
      const a = e.name,
        c = keyOf(t, a),
        l = !!c && bindingsFor(t, c).length > 1;
      (n.push({
        x: o - 50,
        y: r,
        w: 50,
        h: 20,
        label: "重置",
        enabled: c !== KEY_DEFAULT[a],
        onClick: () => {
          (delete s.keys[a], t.saveSettings(), this.place());
        },
      }),
        n.push({
          x: o - 50 - 5 - 75,
          y: r,
          w: 75,
          h: 20,
          keyFor: a,
          label: () =>
            this.sel === a ? "> " + keyLabel(keyOf(t, a)) + " <" : keyLabel(keyOf(t, a)),
          color: this.sel === a ? "#FFFF55" : l ? "#FF5555" : null,
          tip: l
            ? [
                "该按键也用于：",
                ...bindingsFor(t, c)
                  .filter((e) => e !== a)
                  .map((e) => KEY_CN[e]),
              ]
            : null,
          onClick: () => {
            ((this.sel = a), this.place());
          },
        }));
    }),
      (this.widgets = [...n, ...this.footer]));
  }
  bind(e) {
    const t = this.game;
    ((t.settings.keys[this.sel] = e), (this.sel = null), t.saveSettings(), this.place());
  }
  drawExtra(e) {
    e.listBackground(this.top, this.bottom);
    const t = e.ctx;
    (t.save(), t.beginPath(), t.rect(0, this.top, e.w, this.bottom - this.top), t.clip());
    for (const s of this.rows)
      s.y + 20 < this.top ||
        s.y > this.bottom ||
        (s.cat
          ? Font.center(t, s.cat, e.w / 2, s.y + 6, "#FFFFFF")
          : Font.draw(t, KEY_CN[s.name], this.rowX, s.y + 6, "#FFFFFF"));
    t.restore();
  }
  mouseDown(e, t, s, n) {
    this.sel ? this.bind("Mouse" + n) : super.mouseDown(e, t, s, n);
  }
  key(e, t) {
    return this.sel
      ? (this.bind("Escape" === t.code ? "" : t.code), !0)
      : "Escape" === t.key && (this.back(), !0);
  }
  wheel(e, t) {
    ((this.scroll += 20 * Math.sign(t)), this.place());
  }
  back() {
    (this.game.saveSettings(), this.game.ui.open(this.parent));
  }
  onEsc() {
    this.back();
  }
}
//# sourceURL=js/controls.js
