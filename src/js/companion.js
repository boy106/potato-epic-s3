"use strict";
const JING_KAOMOJI = [
    "(≧▽≦)",
    "(｡･ω･｡)",
    "(◕‿◕)",
    "(￣▽￣)",
    "ヾ(≧▽≦*)o",
    "(＞﹏＜)",
    "(´・ω・`)",
    "(｀・ω・´)",
    "(╥﹏╥)",
    "Σ(っ°Д°;)っ",
    "(✿◠‿◠)",
    "♪(´▽｀)",
    "(*/ω＼*)",
    "(⊙_⊙)",
    "(・∀・)",
    "(￣ω￣)",
  ],
  COMPANION_OFF = !!self.POTATO,
  Companion = {
    status: null,
    history: [],
    busy: !1,
    sinceRemember: 0,
    lastEvent: 0,
    events: 0,
    watch: null,
    get name() {
      return (this.status && this.status.name) || "伙伴";
    },
    get ready() {
      return (
        !COMPANION_OFF &&
        !!(
          this.status &&
          this.status.on &&
          this.unlocked &&
          (this.status.key || this.status.shared)
        )
      );
    },
    get unlocked() {
      return !(!this.status || !this.status.unlocked) && Account.has("jing");
    },
    get shown() {
      return !COMPANION_OFF && !(!this.status || !this.status.on);
    },
    async load() {
      if (COMPANION_OFF || !Account.loggedIn) return ((this.status = null), null);
      try {
        this.status = await Account.api("/api/ai/status", {});
      } catch (t) {}
      return this.status;
    },
    context(t) {
      const e = t.player,
        i = {};
      if ("play" !== t.state || !e || !t.world) return { 场景: "在游戏主菜单" };
      const s = Math.floor(e.pos[0]),
        n = Math.floor(e.pos[1] + (t.world.minY || 0)),
        a = Math.floor(e.pos[2]);
      ((i["游戏"] =
        t.net && t.net.room
          ? `联机房间（${(t.net.players && t.net.players.size) || "几"} 人）`
          : "单人游戏"),
        (i["模式"] = ("undefined" != typeof MODE_NAMES && MODE_NAMES[t.mode]) || t.mode),
        (i["维度"] = ("undefined" != typeof DIM_CN && DIM_CN[t.dim]) || t.dim || "主世界"),
        (i["坐标"] = `${s}, ${n}, ${a}`));
      try {
        i["生物群系"] = biomeName(t, s, a);
      } catch (t) {}
      const o = t.dayTime(),
        h = Math.floor((o / 1e3 + 6) % 24);
      ((i["时间"] =
        `第 ${Math.floor(t.worldTime / 24e3) + 1} 天 ${String(h).padStart(2, "0")}:${String(Math.floor((o % 1e3) * 0.06)).padStart(2, "0")}${o > 12500 && o < 23500 ? "（夜晚）" : ""}`),
        ("overworld" !== t.dim && t.dim) || (i["天气"] = t.weather > 0.5 ? "下雨" : "晴"),
        "survival" === t.mode &&
          ((i["生命值"] = `${Math.ceil(e.health)}/${e.maxHealth}`),
          (i["饥饿值"] = `${e.food}/20`)));
      const nm = (t) => (t && ITEMS[t.id] ? ITEMS[t.id].cn : ""),
        r = e.inv && e.inv.held;
      if (((i["手上"] = r ? `${nm(r)}${r.count > 1 ? " ×" + r.count : ""}` : "空手"), e.inv)) {
        const t = new Map();
        for (let i = 0; i < 36; i++) {
          const s = e.inv.slots[i];
          s && t.set(nm(s), (t.get(nm(s)) || 0) + s.count);
        }
        i["背包"] = [...t]
          .sort((t, e) => e[1] - t[1])
          .slice(0, 24)
          .map(([t, e]) => `${t}×${e}`);
        const s = [36, 37, 38, 39].map((t) => nm(e.inv.slots[t])).filter(Boolean);
        s.length && (i["盔甲"] = s);
      }
      const c = new Map();
      for (const i of t.entities || [])
        i.T &&
          i.T.cn &&
          !i.dead &&
          i.pos &&
          (Math.hypot(i.pos[0] - e.pos[0], i.pos[1] - e.pos[1], i.pos[2] - e.pos[2]) > 24 ||
            c.set(i.T.cn, (c.get(i.T.cn) || 0) + 1));
      (c.size && (i["附近的生物"] = [...c].slice(0, 12).map(([t, e]) => (e > 1 ? `${t}×${e}` : t))),
        t.adv && (i["已完成进度"] = Object.keys(t.adv).length + " 个"));
      const l = t.settings,
        pc = (t) => Math.round(100 * t) + "%",
        oo = (t) => (t ? "开" : "关");
      ((i["当前设置"] =
        `光影 ${FX_NAMES[l.shaders || 0]}，画质预设 ${PRESET_NAMES[l.preset] || "自定义"}，图形品质 ${"fast" === l.graphics ? "流畅" : "高品质"}，渲染距离 ${l.renderDist}，亮度 ${pc(l.gamma)}，视场角 ${Math.round(l.fov)}，主音量 ${pc(l.volume)}，鼠标灵敏度 ${Math.round(200 * l.sens)}%，渲染分辨率 ${pc(l.resScale)}，最大帧率 ${l.maxFps || "无限制"}，字幕 ${oo(l.subtitles)}，视角摇晃 ${oo(l.bobbing)}，云 ${oo(l.clouds)}，自动跳跃 ${oo(l.autoJump)}，动态分辨率 ${oo(l.dynRes)}`),
        (i["设备"] = "function" == typeof touchOn && touchOn(t) ? "手机 / 平板（触屏）" : "电脑"));
      const u = (t.ui.chat || [])
        .filter((t) => !t.ai && t.text)
        .slice(-4)
        .map((t) => t.text);
      return (u.length && (i["聊天栏最近几行"] = u), i);
    },
    show(t, e, i, s) {
      const n = [];
      let a = e;
      for (const t of String(i)) (Font.width(a + t) > 312 && (n.push(a), (a = "  ")), (a += t));
      n.push(a);
      for (const e of n) (t.ui.message(e, s), (t.ui.chat[t.ui.chat.length - 1].ai = !0));
    },
    on(t) {
      if (!t || !t.settings) return !1;
      const e = t.settings.jingOn;
      return (
        !0 === e ||
        (void 0 === e && "undefined" != typeof Live && !0 === Live.get("jing.default", !1))
      );
    },
    quick(t, e) {
      return (
        !(!this.ready || !1 === t.settings.aiQuick || !this.on(t)) &&
        (void 0 === e || !(t.net && t.net.room) || String(e).includes(this.name))
      );
    },
    async say(t, e, i = !0, s = !1) {
      if (!this.busy)
        if ((this.status || (await this.load()), this.ready)) {
          ((this.busy = !0),
            Jing.call(1500),
            i && this.show(t, "[对" + this.name + "说] ", e, "#AAAAAA"));
          try {
            const i = await Account.api("/api/ai/chat", {
              said: e,
              history: this.history.slice(-10),
              ctx: this.context(t),
            });
            (this.history.push({ r: "u", t: e }, { r: "a", t: i.reply }),
              (this.history = this.history.slice(-24)),
              this.show(t, "<" + this.name + "> ", i.reply, "#7FE3FF"),
              (Jing.pulse = performance.now()),
              Jing.call(Math.min(2e4, Math.max(6e3, 4e3 + 120 * i.reply.length))),
              i.actions && i.actions.length && this.applyActions(t, i.actions),
              void 0 !== i.freeLeft && this.status && (this.status.freeLeft = i.freeLeft),
              Telemetry.count && Telemetry.count("ai_chat"),
              ++this.sinceRemember >= 8 && this.remember());
          } catch (e) {
            s || this.show(t, "<" + this.name + "> ", e.message, "#FF8080");
          } finally {
            this.busy = !1;
          }
        } else t.ui.open(new CompanionScreen(t, null));
    },
    applyActions(t, e) {
      const i = t.settings,
        s = [],
        n = [],
        a = e.find((t) => t && "feedback" === t.k && t.v && "string" == typeof t.v.text);
      a && this.feedback(t, a.v);
      const o = {
        shaders: (t) => [0, 1, 2, 3, 4].includes(t),
        preset: (t) => ["auto", "low", "medium", "high", "ultra"].includes(t),
        graphics: (t) => "fast" === t || "fancy" === t,
        renderDist: (t) => t >= 2 && t <= 16,
        gamma: (t) => t >= 0 && t <= 1,
        fov: (t) => t >= 30 && t <= 110,
        volume: (t) => t >= 0 && t <= 1,
        sens: (t) => t > 0 && t <= 1,
        resScale: (t) => [0.5, 0.75, 1].includes(t),
        maxFps: (t) => 0 === t || (t >= 10 && t <= 250),
        subtitles: (t) => "boolean" == typeof t,
        bobbing: (t) => "boolean" == typeof t,
        clouds: (t) => "boolean" == typeof t,
        autoJump: (t) => "boolean" == typeof t,
        dynRes: (t) => "boolean" == typeof t,
      };
      for (const a of e)
        a && "cmd" === a.k && "string" == typeof a.v && /^\/[^\n]{1,200}$/.test(a.v)
          ? n.push(a.v)
          : a &&
            o[a.k] &&
            o[a.k](a.v) &&
            ("shaders" !== a.k || (t.renderer.fx && t.renderer.fx.ok)
              ? ("preset" === a.k
                  ? applyPreset(t, a.v)
                  : (["graphics", "renderDist", "resScale", "clouds", "dynRes"].includes(a.k) &&
                      (i.preset = "custom"),
                    (i[a.k] = a.v),
                    "graphics" === a.k && t.graphicsChanged()),
                s.push(a.name + "：" + a.label))
              : this.show(t, "<" + this.name + "> ", "诶，你的设备好像不支持光影…", "#FF8080"));
      for (const e of n)
        (t.ui.message("[" + this.name + "帮你输入了] " + e, "#FFFF55"),
          (t.ui.chat[t.ui.chat.length - 1].ai = !0),
          (this.runRaw || runCommand)(t, e),
          Telemetry.count && Telemetry.count("ai_cmd"));
      s.length &&
        (t.applySettings(),
        t.saveSettings(),
        t.ui.message("[" + this.name + "帮你调整了] " + s.join("，"), "#FFFF55"),
        (t.ui.chat[t.ui.chat.length - 1].ai = !0),
        Telemetry.count && Telemetry.count("ai_adjust"));
    },
    async feedback(t, e) {
      const i = ["bug", "lag", "idea", "other"].includes(e.kind) ? e.kind : "other",
        s = String(e.text).slice(0, 800),
        n = await postFeedback(
          t,
          i,
          "[" + this.name + "整理] " + s,
          "function" == typeof feedbackShot ? feedbackShot(t) : null,
        );
      (t.ui.message(
        n
          ? "[" + this.name + "没能帮你反馈] " + n
          : "[" + this.name + "帮你反馈了] 作者会看到的，谢谢你！",
        n ? "#FF5555" : "#55FF55",
      ),
        (t.ui.chat[t.ui.chat.length - 1].ai = !0),
        Telemetry.count && Telemetry.count(n ? "ai_feedback_fail" : "ai_feedback"));
    },
    async event(t, e) {
      const i = t.settings;
      if (
        !this.ready ||
        this.busy ||
        !1 === i.aiTalk ||
        !this.on(t) ||
        "play" !== t.state ||
        ("undefined" != typeof Live && !Live.on("jing.chatty"))
      )
        return;
      const s = Date.now();
      if (!(s - this.lastEvent < 12e4 || this.events >= 10)) {
        ((this.lastEvent = s), this.events++, (this.busy = !0));
        try {
          const i = await Account.api("/api/ai/chat", {
            event: e,
            history: this.history.slice(-6),
            ctx: this.context(t),
          });
          (this.history.push({ r: "a", t: i.reply }),
            (this.history = this.history.slice(-24)),
            this.show(t, "<" + this.name + "> ", i.reply, "#7FE3FF"),
            (Jing.pulse = performance.now()),
            Jing.call(Math.min(2e4, Math.max(6e3, 4e3 + 120 * i.reply.length))),
            Telemetry.count && Telemetry.count("ai_event"));
        } catch (t) {
        } finally {
          this.busy = !1;
        }
      }
    },
    async remember() {
      this.sinceRemember = 0;
      try {
        this.status = await Account.api("/api/ai/remember", { history: this.history.slice(-20) });
      } catch (t) {}
    },
    hiDone: null,
    hiWait: 0,
    greeted() {
      const t = Account.data && Account.data.id;
      if (!t) return !0;
      if (!this.hiDone)
        try {
          this.hiDone = new Set(JSON.parse(localStorage.getItem("mcjs-jing-hi") || "[]"));
        } catch (t) {
          this.hiDone = new Set();
        }
      return this.hiDone.has(t);
    },
    greet(t) {
      const e = Account.data && Account.data.id;
      if (!e) return;
      (this.greeted(), this.hiDone.add(e));
      try {
        localStorage.setItem("mcjs-jing-hi", JSON.stringify([...this.hiDone].slice(-20)));
      } catch (t) {}
      const i =
        "function" == typeof touchOn && touchOn(t)
          ? t.net && t.net.room
            ? `在聊天里叫一声「${this.name}」我就会回你`
            : "点开聊天直接跟我说话就行"
          : "按 V 就能和我聊天";
      (this.show(
        t,
        "<" + this.name + "> ",
        `你好呀～我是${this.name}！以后我就陪着你啦 (≧▽≦) ${i}，游戏里有什么不会的都可以问我哦～`,
        "#7FE3FF",
      ),
        (Jing.pulse = performance.now()),
        Jing.call(1e4),
        Sound.ev && Sound.ev("entity.experience_orb.pickup", null, 0.35, 1.3),
        Telemetry.count && Telemetry.count("jing_hi"));
    },
    start(t) {
      if (this.watch) return;
      let e = null,
        i = null,
        s = !1,
        n = null;
      this.watch = setInterval(() => {
        if (
          ("play" !== t.state ||
          !t.player ||
          t.player.dead ||
          t.ui.screen ||
          !this.ready ||
          !this.on(t) ||
          ("undefined" != typeof Live && !Live.on("jing.greet")) ||
          this.greeted()
            ? (this.hiWait = 0)
            : ++this.hiWait >= 2 && ((this.hiWait = 0), this.greet(t)),
          "play" !== t.state || !t.player)
        )
          return ((e = null), (i = null), void (n = null));
        if (n !== t.world)
          return (
            (n = t.world),
            (e = new Set(Object.keys(t.adv || {}))),
            (i = t.dim),
            void (s = !1)
          );
        const a = new Set(Object.keys(t.adv || {}));
        for (const i of a)
          if (!e.has(i) && "undefined" != typeof ADVANCEMENTS && ADVANCEMENTS[i]) {
            this.event(t, `玩家取得了进度「${ADVANCEMENTS[i][0]}」`);
            break;
          }
        ((e = a),
          t.dim !== i &&
            (i &&
              this.event(
                t,
                `玩家进入了${("undefined" != typeof DIM_CN && DIM_CN[t.dim]) || t.dim}`,
              ),
            (i = t.dim)));
        const o = !!t.player.dead;
        (o && !s && this.event(t, String(t.deathMsg || "玩家死了").replace(/^玩家/, "玩家刚刚")),
          (s = o));
      }, 1e3);
    },
  };
function wrapText(t, e) {
  const i = [];
  let s = "";
  for (const n of String(t)) (Font.width(s + n) > e && (i.push(s), (s = "")), (s += n));
  return (s && i.push(s), i);
}
class CompanionChatScreen extends MenuScreen {
  constructor(t) {
    (super(t, null), (this.blurBg = !1), (this.bgDim = 0), (this.isChat = !0), (t.ui.chatOff = 0));
  }
  wheel(t, e) {
    t.chatOff = clamp((t.chatOff || 0) - 7 * Math.sign(e), 0, Math.max(0, t.chatRowCount() - 20));
  }
  layout() {
    const t = this.game.ui,
      e = Font.width("对" + Companion.name + "说：") + 6;
    t.showInput(
      2 + e,
      t.h - 14,
      t.w - 4 - e,
      12,
      "",
      (e) => {
        (t.close(), (e = e.trim()) && Companion.say(this.game, e));
      },
      { onEsc: () => t.close(), max: 200 },
    );
  }
  draw(t) {
    const e = t.ctx,
      i = "对" + Companion.name + "说：";
    ((e.fillStyle = "rgba(0,0,0,0.5)"),
      e.fillRect(2, t.h - 14, t.w - 4, 12),
      Font.draw(e, i, 4, t.h - 12, "#7FE3FF"),
      Companion.busy && Font.draw(e, Companion.name + "正在想…", 4, t.h - 26, "#AAAAAA"));
  }
}
class CompanionScreen extends FormScreen {
  constructor(t, e) {
    (super(t, "AI 伙伴", e),
      Promise.all([Companion.load(), Account.loadGate()]).then(() => {
        this.game.ui.screen === this && this.layout();
      }));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      i = this.game,
      s = Companion.status;
    ((this.fields = {}), (this.widgets = []));
    const n = { x: e - 100, y: t.h - 30, w: 200, h: 20, label: "完成", onClick: () => this.back() };
    if (!Account.loggedIn)
      return void this.widgets.push(
        {
          x: e - 100,
          y: 70,
          w: 200,
          h: 24,
          gold: !0,
          label: "登录",
          onClick: () =>
            i.ui.open(new LoginScreen(i, () => i.ui.open(new CompanionScreen(i, this.parent)))),
        },
        n,
      );
    if (!s) return void this.widgets.push(n);
    if (!Companion.unlocked) {
      const t = !!Account.unlocks.follow,
        i = Account.tripleOk();
      return void this.widgets.push(
        {
          x: e - 100,
          y: 76,
          w: 98,
          h: 22,
          gold: !t,
          label: t ? "✓ 已关注" : "去关注",
          enabled: !t,
          tip: ["打开 UP 主的空间，关注后回来"],
          onClick: () => this.unlock("follow"),
        },
        {
          x: e + 2,
          y: 76,
          w: 98,
          h: 22,
          gold: !i,
          label: i ? "✓ 已三连" : "去三连",
          enabled: !i,
          tip: ["打开新视频，点赞、投币、收藏后回来"],
          onClick: () => this.unlock("triple"),
        },
        {
          x: e - 100,
          y: 102,
          w: 200,
          h: 20,
          label: () => (Account.checking ? "正在检查…" : "我完成了，检查"),
          enabled: !Account.checking,
          onClick: () => this.recheck(),
        },
        n,
      );
    }
    const a = i.settings;
    this.widgets.push(
      {
        x: e - 150,
        y: 94,
        w: 98,
        h: 20,
        label: () => "主动说话：" + (!1 === a.aiTalk ? "关" : "开"),
        tip: ["完成进度、死亡、进入新维度时", Companion.name + "会说一句（每 2 分钟最多一次）"],
        onClick: () => {
          ((a.aiTalk = !1 === a.aiTalk), i.saveSettings());
        },
      },
      {
        x: e - 49,
        y: 94,
        w: 98,
        h: 20,
        label: () => "快速模式：" + (!1 === a.aiQuick ? "关" : "开"),
        tip: [
          "开着时，在聊天框里说的话" + Companion.name + "都会回",
          "（联机房间里要提到「" + Companion.name + "」）；关掉就只有按 V 才回",
        ],
        onClick: () => {
          ((a.aiQuick = !1 === a.aiQuick), i.saveSettings());
        },
      },
      {
        x: e + 52,
        y: 94,
        w: 98,
        h: 20,
        label: "忘掉记忆",
        enabled: !!s.memory,
        tip: s.memory
          ? [Companion.name + "记得：", ...wrapText(s.memory, 220), "", "点一下清空这些记忆"]
          : ["还没有记住什么"],
        onClick: () => this.forget(),
      },
      {
        x: s.admin ? e - 150 : e - 74,
        y: 118,
        w: 148,
        h: 20,
        label: () => Companion.name + "：" + (Companion.on(i) ? "开" : "关"),
        gold: !Companion.on(i),
        tip: Companion.on(i)
          ? ["在你身边飘着、会打招呼、会主动说话", "点一下关掉（按 V 照样能找它聊）"]
          : ["现在是关着的：不显示、不打招呼、不主动说话", "点一下打开"],
        onClick: () => {
          ((a.jingOn = !Companion.on(i)), i.saveSettings(), this.layout());
        },
      },
      ...(s.admin
        ? [
            {
              x: e + 2,
              y: 118,
              w: 148,
              h: 20,
              gold: !0,
              label: "共用密钥…",
              tip: [
                "管理员：全服玩家聊天用的密钥",
                "今天已花 " +
                  s.admin.yuan +
                  " 元 / 上限 " +
                  s.admin.budget +
                  " 元（" +
                  s.admin.lines +
                  " 句）",
              ],
              onClick: () => {
                (i.ui.hideInput(), i.ui.open(new CompanionSharedScreen(i, this)));
              },
            },
          ]
        : []),
      {
        x: e - 150,
        y: t.h - 30,
        w: 148,
        h: 20,
        gold: Companion.ready,
        label: fitText("和" + Companion.name + "聊天", 140),
        enabled: Companion.ready && "play" === i.state,
        tip:
          "play" === i.state
            ? ["也可以在游戏里按 V"]
            : ["进入世界后按 V 和" + Companion.name + "聊天"],
        onClick: () => {
          (i.ui.hideInput(), i.ui.open(new CompanionChatScreen(i)));
        },
      },
      { x: e + 2, y: t.h - 30, w: 148, h: 20, label: "完成", onClick: () => this.back() },
    );
  }
  async unlock(t) {
    try {
      if (!(await Toy.ready())) return void this.say("请在 B站 App 或电脑网页的游戏页面里操作", !0);
      if ("triple" === t) {
        const t = Account.pickVideo();
        t && (await Toy.openVideo(t));
      } else await Toy.openAuthor();
      (this.say(Toy.backHint(t)), (this.waiting = !0));
    } catch (t) {
      this.say(t instanceof ToyError ? Toy.explain(t) : t.message, !0);
    }
  }
  async recheck() {
    if (((this.waiting = !1), !(await Toy.ready())))
      return void this.say("请在 B站 App 或电脑网页的游戏页面里检查", !0);
    this.layout();
    let t = null;
    try {
      t = await Account.checkUnlocks();
    } catch (t) {
      this.say(t.message, !0);
    }
    if ((await Companion.load(), Companion.unlocked))
      this.say(
        "已解锁" +
          Companion.name +
          "！" +
          ("play" === this.game.state ? "回到游戏，它马上就来" : "进入世界后它就会来找你"),
      );
    else if (t && !t.inToy) this.say("请在 B站 App 或电脑网页的游戏页面里检查", !0);
    else if (t && t.inToy && t.error && null === t.follow && null === t.triple)
      this.say("没查到（" + Toy.explain(t.error) + "），过一会儿再点检查", !0);
    else if (t && t.inToy && !t.own)
      this.say(
        "这里没登录你自己的 B站：用你的 B站 关注、三连后，在那台设备打开一次游戏就会同步",
        !0,
      );
    else if (t && null === t.triple && !Account.tripleOk())
      this.say(
        "没查到三连状态（" +
          (t.error ? Toy.explain(t.error) : "B站没有返回能看懂的数据") +
          "），过一会儿再点检查",
        !0,
      );
    else {
      const t = Account.tripleParts,
        e = [];
      (Account.unlocks.follow || e.push("关注"),
        Account.tripleOk() ||
          (t && !t.all
            ? (t.like || e.push("点赞"), t.coin || e.push("投币"), t.fav || e.push("收藏"))
            : e.push("三连")),
        this.say(
          e.length
            ? "还差：" + e.join("、") + "（刚操作完可能要等几秒）"
            : "还没有检测到，完成后再回来看看",
          !0,
        ));
    }
    this.game.ui.screen === this && this.layout();
  }
  back() {
    const t = this.game;
    (t.ui.hideInput(),
      this.parent
        ? t.ui.open(this.parent)
        : "play" === t.state
          ? t.ui.close()
          : t.ui.open(new TitleScreen(t)));
  }
  async forget() {
    try {
      ((Companion.status = await Account.api("/api/ai/forget", {})),
        this.say(Companion.name + "已经忘掉了"));
    } catch (t) {
      this.say(t.message, !0);
    }
    this.layout();
  }
  drawExtra(t) {
    const e = t.ctx,
      i = t.w / 2,
      s = Companion.status;
    if (
      (this.waiting &&
        "visible" === document.visibilityState &&
        this.leftAt &&
        Date.now() - this.leftAt > 1500 &&
        ((this.leftAt = 0), this.recheck()),
      this.waiting && "visible" !== document.visibilityState && (this.leftAt = Date.now()),
      Account.loggedIn)
    )
      if (s) {
        if (!Companion.unlocked)
          return (
            Font.center(
              e,
              fitText(`关注 UP 主 + 给新视频三连，就能解锁${Companion.name}`, t.w - 8),
              i,
              46,
              "#FFD24A",
            ),
            Font.center(
              e,
              fitText("三连 = 点赞 + 投币 + 收藏；之前给老视频三连过的也要再三连", t.w - 8),
              i,
              60,
              "#A0A0A0",
            ),
            void (this.note && Font.center(e, fitText(this.note, t.w - 8), i, 130, this.noteColor))
          );
        (Font.center(
          e,
          fitText(`${Companion.name}：会聊天、懂你在游戏里做什么的 AI 小伙伴`, t.w - 8),
          i,
          34,
          "#7FE3FF",
        ),
          s.shared || s.key
            ? (s.shared &&
                Font.center(
                  e,
                  fitText(
                    `全服免费：今天还能聊 ${s.freeLeft ?? "?"} 句（每天 ${s.perDay || 30} 句，明天重新算）`,
                    t.w - 8,
                  ),
                  i,
                  50,
                  "#55FF55",
                ),
              Font.center(
                e,
                fitText(
                  "只聊游戏和日常；总让" + Companion.name + "写代码、翻译、做作业会被暂停一天",
                  t.w - 8,
                ),
                i,
                64,
                "#A0A0A0",
              ))
            : Font.center(
                e,
                fitText(Companion.name + "暂时在休息，稍后再来找它吧", t.w - 8),
                i,
                50,
                "#FF8080",
              ),
          this.drawFields(t));
      } else Font.center(e, "正在读取…", i, 50, "#A0A0A0");
    else Font.center(e, "登录后才能使用 AI 伙伴", i, 50, "#A0A0A0");
  }
}
(() => {
  const t = Game.prototype.startTitle;
  Game.prototype.startTitle = function (...e) {
    const i = t.apply(this, e);
    return (Companion.start(this), Companion.status || Companion.load(), i);
  };
  const e = Account.took;
  Account.took = function (t) {
    const i = e.call(this, t);
    return (t && t.token && Companion.load(), i);
  };
  const i = Account.checkUnlocks;
  Account.checkUnlocks = async function (...t) {
    const e = await i.apply(this, t);
    return (e && e.got && e.got.length && (await Companion.load()), e);
  };
})();
class CompanionSharedScreen extends FormScreen {
  constructor(t, e) {
    (super(t, "全服共用密钥", e), (this.key = ""), (this.busy = !1));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      i = (Companion.status && Companion.status.admin) || {};
    ((this.fields = {}),
      this.addField(
        "key",
        e - 150,
        94,
        300,
        i.sharedTail
          ? `共用密钥（已设置：sk-…${i.sharedTail}，粘贴新的可以替换）`
          : "共用密钥（以 sk- 开头）",
        140,
        (t) => t.trim(),
      ),
      (this.widgets = [
        {
          x: e - 150,
          y: 118,
          w: 148,
          h: 20,
          gold: !0,
          label: () => (this.busy ? "正在检查…" : "设为共用密钥"),
          enabled: !this.busy,
          onClick: () => this.submit(),
        },
        {
          x: e + 2,
          y: 118,
          w: 148,
          h: 20,
          label: "停用共用密钥",
          enabled: !!i.sharedTail && !this.busy,
          tip: ["删掉共用密钥：所有玩家就都不能聊了"],
          onClick: () => this.remove(),
        },
        {
          x: e - 150,
          y: 142,
          w: 300,
          h: 20,
          gold: !0,
          label: "调整上限…（每天 / 每小时花多少钱、每人几句，立刻生效）",
          onClick: () => {
            (this.game.ui.hideInput(),
              this.game.ui.open(new CompanionLimitsScreen(this.game, this)));
          },
        },
        { x: e - 100, y: t.h - 30, w: 200, h: 20, label: "完成", onClick: () => this.back() },
      ]));
  }
  async submit() {
    if (!this.busy)
      if (/^sk-\S{16,}$/.test(this.key)) {
        ((this.busy = !0), this.say("正在向 DeepSeek 检查密钥…"), this.layout());
        try {
          const t = await Account.api("/api/ai/shared", { key: this.key });
          ((Companion.status = t.status),
            (this.key = ""),
            this.game.ui.hideInput(),
            this.say(
              "已设为共用密钥" + (t.balance && t.balance.text ? "，余额 " + t.balance.text : ""),
            ));
        } catch (t) {
          this.say(t.message, !0);
        }
        ((this.busy = !1), this.layout());
      } else this.say("DeepSeek 的密钥以 sk- 开头，请完整复制", !0);
  }
  async remove() {
    try {
      ((Companion.status = await Account.api("/api/ai/shared/delete", {})),
        this.say("共用密钥已停用"));
    } catch (t) {
      this.say(t.message, !0);
    }
    this.layout();
  }
  drawExtra(t) {
    const e = t.ctx,
      i = t.w / 2,
      s = (Companion.status && Companion.status.admin) || {};
    (this.drawFields(t),
      Font.center(
        e,
        fitText(
          "全服玩家都用这个密钥和" + Companion.name + "聊天（费用从这个账户扣，只存在服务器上）",
          t.w - 8,
        ),
        i,
        36,
        "#A0A0A0",
      ),
      Font.center(
        e,
        fitText(
          `今天已花 ${s.yuan ?? 0} 元 / 每天上限 ${s.budget ?? "?"} 元，共 ${s.lines ?? 0} 句；这个小时 ${s.hourYuan ?? 0} / ${s.hourBudget ?? "?"} 元`,
          t.w - 8,
        ),
        i,
        50,
        "#FFD24A",
      ),
      Font.center(
        e,
        fitText(
          `每天：每人 ${s.perDay ?? 30} 句（每分钟 ${s.perMinute ?? 4} 句）、每个地址 ${s.perIp ?? 60} 句、每个网段 ${s.perNet ?? 300} 句`,
          t.w - 8,
        ),
        i,
        64,
        "#A0A0A0",
      ),
      s.stopped &&
        Font.center(
          e,
          fitText(
            "今天有 " +
              s.stopped +
              " 个账号一直让" +
              Companion.name +
              "做别的事（写代码、翻译等），免费聊天已暂停",
            t.w - 8,
          ),
          i,
          168,
          "#FF8080",
        ));
  }
}
class CompanionLimitsScreen extends FormScreen {
  constructor(t, e) {
    (super(t, Companion.name + "的上限", e), (this.busy = !1));
    const i = (Companion.status && Companion.status.admin) || {},
      str = (t) => (null == t ? "" : String(t));
    ((this.day = str(i.budgetBase ?? i.budget)),
      (this.hour = str(i.hourBudget)),
      (this.per = str(i.perDay)),
      (this.today = i.boost ? str(i.boost.yuan) : ""));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      num = (t) => t.replace(/[^0-9.]/g, "").slice(0, 6);
    ((this.fields = {}),
      this.addField("day", e - 150, 72, 96, "每天上限（元）", 6, num),
      this.addField("hour", e - 48, 72, 96, "每小时上限（元）", 6, num),
      this.addField("per", e + 54, 72, 96, "每人每天（句）", 5, (t) =>
        t.replace(/[^0-9]/g, "").slice(0, 5),
      ),
      this.addField("today", e - 150, 114, 96, "只今天的每天上限（元）", 6, num),
      (this.widgets = [
        {
          x: e - 150,
          y: t.h - 30,
          w: 148,
          h: 20,
          gold: !0,
          label: () => (this.busy ? "正在保存…" : "保存（立刻生效）"),
          enabled: !this.busy,
          onClick: () => this.save(),
        },
        { x: e + 2, y: t.h - 30, w: 148, h: 20, label: "完成", onClick: () => this.back() },
      ]));
  }
  submit() {
    this.save();
  }
  async save() {
    if (this.busy) return;
    const t = {
      freeBudgetYuan: this.day,
      freeBudgetHourYuan: this.hour,
      freePerDay: this.per,
      todayYuan: this.today,
    };
    for (const e in t) t[e] = String(t[e] || "").trim();
    ((this.busy = !0), this.layout());
    try {
      ((Companion.status = await Account.api("/api/ai/limits", t)),
        this.say("已保存，马上生效（不用重启）"));
    } catch (t) {
      this.say(t.message, !0);
    }
    ((this.busy = !1), this.layout());
  }
  drawExtra(t) {
    const e = t.ctx,
      i = t.w / 2,
      s = (Companion.status && Companion.status.admin) || {},
      n = s.boost;
    (Font.center(
      e,
      fitText(
        `现在：每天 ${s.budget ?? "?"} 元${n ? `（今天临时，0 点后回到 ${s.budgetBase ?? "?"} 元）` : ""} · 每小时 ${s.hourBudget ?? "?"} 元 · 每人每天 ${s.perDay ?? "?"} 句`,
        t.w - 8,
      ),
      i,
      34,
      "#FFD24A",
    ),
      Font.center(
        e,
        fitText(
          `今天已花 ${s.yuan ?? 0} 元，共 ${s.lines ?? 0} 句；这个小时 ${s.hourYuan ?? 0} 元`,
          t.w - 8,
        ),
        i,
        46,
        "#A0A0A0",
      ),
      Font.draw(
        e,
        fitText("填了就只用到今晚 0 点；空着 = 不用", t.w / 2 + 150 - 104),
        i - 48,
        120,
        "#A0A0A0",
      ),
      Font.center(e, fitText("空着的格子 = 用服务器原来的设置", t.w - 8), i, 144, "#808080"),
      this.drawFields(t));
  }
}
const Jing = {
  R: 0.2,
  mesh: null,
  tail: null,
  pos: null,
  yaw: 0,
  last: 0,
  pulse: -1e9,
  TAIL_AT: [0, -0.55, -0.78],
  visible: (t) =>
    Companion.ready &&
    Companion.on(t) &&
    "play" === t.state &&
    !!t.player &&
    !t.player.dead &&
    "spectator" !== t.mode,
  upload(t, e) {
    const i = t.gl,
      s = i.createVertexArray();
    i.bindVertexArray(s);
    const n = i.createBuffer();
    return (
      i.bindBuffer(i.ARRAY_BUFFER, n),
      i.bufferData(i.ARRAY_BUFFER, new Float32Array(e), i.STATIC_DRAW),
      i.enableVertexAttribArray(0),
      i.vertexAttribPointer(0, 3, i.FLOAT, !1, 32, 0),
      i.enableVertexAttribArray(1),
      i.vertexAttribPointer(1, 2, i.FLOAT, !1, 32, 12),
      i.enableVertexAttribArray(2),
      i.vertexAttribPointer(2, 3, i.FLOAT, !1, 32, 20),
      i.bindBuffer(i.ELEMENT_ARRAY_BUFFER, t.quadIdx),
      i.bindVertexArray(null),
      { vao: s, n: e.length / 8 }
    );
  },
  extrude(t, e, i, s, n, a, o, h = 0.14) {
    const r = JING_TEX.size,
      [c, l, u, p] = JING_TEX.parts[i],
      d = s / u,
      m = h / 2,
      y = Math.max(1, Math.round(u / 48)),
      f = Math.ceil(u / y),
      g = Math.ceil(p / y),
      at = (t, i) =>
        t < 0 || i < 0 || t >= f || i >= g
          ? 0
          : e[
              (l + Math.min(p - 1, i * y + (y >> 1))) * r + c + Math.min(u - 1, t * y + (y >> 1))
            ] >= 128,
      P = (t, e, i) => a([((o ? u - t : t) - n[0] * u) * d, (p - e - n[1] * p) * d, i]),
      N = (t) => {
        const e = a([0, 0, 0]),
          i = a(t);
        return [i[0] - e[0], i[1] - e[1], i[2] - e[2]];
      },
      V = (e, i, s, n) => t.push(e[0], e[1], e[2], i / r, s / r, n[0], n[1], n[2]),
      w = o ? c + u : c,
      A = o ? c : c + u;
    let b = N([0, 0, 1]);
    (V(P(0, 0, m), w, l, b),
      V(P(0, p, m), w, l + p, b),
      V(P(u, p, m), A, l + p, b),
      V(P(u, 0, m), A, l, b),
      (b = N([0, 0, -1])),
      V(P(u, 0, -m), A, l, b),
      V(P(u, p, -m), A, l + p, b),
      V(P(0, p, -m), w, l + p, b),
      V(P(0, 0, -m), w, l, b));
    for (let t = 0; t < g; t++)
      for (let e = 0; e < f; e++) {
        if (!at(e, t)) continue;
        const i = e * y,
          s = t * y,
          n = Math.min(u, i + y),
          a = Math.min(p, s + y),
          h = c + Math.min(u - 1, i + (y >> 1)) + 0.5,
          r = l + Math.min(p - 1, s + (y >> 1)) + 0.5,
          d = o ? -1 : 1;
        (at(e, t - 1) ||
          ((b = N([0, 1, 0])),
          V(P(i, s, m), h, r, b),
          V(P(i, s, -m), h, r, b),
          V(P(n, s, -m), h, r, b),
          V(P(n, s, m), h, r, b)),
          at(e, t + 1) ||
            ((b = N([0, -1, 0])),
            V(P(i, a, -m), h, r, b),
            V(P(i, a, m), h, r, b),
            V(P(n, a, m), h, r, b),
            V(P(n, a, -m), h, r, b)),
          at(e - 1, t) ||
            ((b = N([-d, 0, 0])),
            V(P(i, s, -m), h, r, b),
            V(P(i, s, m), h, r, b),
            V(P(i, a, m), h, r, b),
            V(P(i, a, -m), h, r, b)),
          at(e + 1, t) ||
            ((b = N([d, 0, 0])),
            V(P(n, s, m), h, r, b),
            V(P(n, s, -m), h, r, b),
            V(P(n, a, -m), h, r, b),
            V(P(n, a, m), h, r, b)));
      }
  },
  build(t, e) {
    const i = JING_TEX.size,
      s = JING_TEX.cell,
      n = document.createElement("canvas");
    n.width = n.height = i;
    const a = n.getContext("2d");
    a.drawImage(e, 0, 0);
    const o = a.getImageData(0, 0, i, i).data,
      h = new Uint8Array(i * i);
    for (let t = 0; t < h.length; t++) h[t] = o[4 * t + 3];
    const r = [],
      pt = (t, e) => {
        const i = (t / 32) * 2 * Math.PI,
          s = Math.PI / 2 - (e / 16) * Math.PI;
        return [Math.cos(s) * Math.sin(i), Math.sin(s), Math.cos(s) * Math.cos(i)];
      };
    for (let t = 0; t < 16; t++)
      for (let e = 0; e < 32; e++) {
        const n = [pt(e, t), pt(e, t + 1), pt(e + 1, t + 1), pt(e + 1, t)],
          a = n[0][2] + n[1][2] + n[2][2] + n[3][2] > 0 ? 0 : s;
        for (const t of n)
          r.push(
            t[0],
            t[1],
            t[2],
            (a + 0.5 + (0.5 + 0.5 * t[0]) * (s - 1)) / i,
            (0.5 + (0.5 - 0.5 * t[1]) * (s - 1)) / i,
            t[0],
            t[1],
            t[2],
          );
      }
    const rx = (t) => (e) => [
        e[0],
        e[1] * Math.cos(t) - e[2] * Math.sin(t),
        e[1] * Math.sin(t) + e[2] * Math.cos(t),
      ],
      ry = (t) => (e) => [
        e[0] * Math.cos(t) + e[2] * Math.sin(t),
        e[1],
        -e[0] * Math.sin(t) + e[2] * Math.cos(t),
      ],
      rz = (t) => (e) => [
        e[0] * Math.cos(t) - e[1] * Math.sin(t),
        e[0] * Math.sin(t) + e[1] * Math.cos(t),
        e[2],
      ],
      mv = (t) => (e) => [e[0] + t[0], e[1] + t[1], e[2] + t[2]],
      seq =
        (...t) =>
        (e) =>
          t.reduce((t, e) => e(t), e);
    (this.extrude(r, h, "ear", 0.8, [0.9, 0.1], seq(rz(0.35), ry(-0.8), mv([-0.78, 0.2, 0])), !1),
      this.extrude(r, h, "ear", 0.8, [0.1, 0.1], seq(rz(-0.35), ry(0.8), mv([0.78, 0.2, 0])), !0),
      this.extrude(
        r,
        h,
        "ahoge",
        0.5,
        [0.45, 0.02],
        seq(rx(-0.25), mv([0.02, 0.9, 0.12])),
        !1,
        0.12,
      ),
      this.extrude(r, h, "crown", 1.55, [0.5, 0.02], seq(rx(-0.55), mv([0, 0.6, 0.6])), !1, 0.12),
      (this.mesh = this.upload(t, r)));
    const c = [];
    (this.extrude(c, h, "tail", 1.05, [0.5, 0], seq(rx(0.95), ry(Math.PI)), !1, 0.16),
      (this.tail = this.upload(t, c)));
  },
  summoned(t) {
    const e = t.ui.screen;
    return (
      performance.now() < this.until ||
      Companion.busy ||
      e instanceof CompanionChatScreen ||
      (e instanceof ChatScreen && Companion.quick(t))
    );
  },
  call(t) {
    this.until = Math.max(this.until || 0, performance.now() + t);
  },
  place(t, e, i) {
    const s = t.player,
      n = t.world,
      a = Math.cos(s.pitch),
      o = s.ipos(null == i ? 1 : i),
      h = null != t.smoothEye ? t.smoothEye : t.sleeping ? 0.2 : s.eye(),
      r = [o[0], o[1] + h, o[2]],
      c = [-Math.sin(s.yaw), 0, -Math.cos(s.yaw)],
      l = [Math.cos(s.yaw), 0, -Math.sin(s.yaw)];
    let u = [-Math.sin(s.yaw) * a, Math.sin(s.pitch), -Math.cos(s.yaw) * a];
    2 === t.perspective && (u = u.map((t) => -t));
    const p = [l[1] * u[2] - l[2] * u[1], l[2] * u[0] - l[0] * u[2], l[0] * u[1] - l[1] * u[0]],
      add = (t, ...e) => {
        const i = t.slice();
        for (const [t, s] of e) for (let e = 0; e < 3; e++) i[e] += t[e] * s;
        return i;
      },
      d = this.summoned(t);
    let m;
    m = d
      ? add(0 === t.perspective ? r : t.renderer.camPos, [u, 1.4], [l, 0.32], [p, -0.12])
      : 0 === t.perspective
        ? add(r, [l, 1], [c, -0.45], [[0, 1, 0], -0.1])
        : add(r, [l, 0.75], [c, 0.15], [[0, 1, 0], 0.35]);
    const y = 1.15 * this.R,
      solid = (t, e, i) => {
        const s = BLOCKS[n.getBlock(Math.floor(t), Math.floor(e), Math.floor(i))];
        return !(!s || !s.solid);
      },
      clear = (t) =>
        !(
          solid(t[0], t[1], t[2]) ||
          solid(t[0] + y, t[1], t[2]) ||
          solid(t[0] - y, t[1], t[2]) ||
          solid(t[0], t[1] + y, t[2]) ||
          solid(t[0], t[1] - y, t[2]) ||
          solid(t[0], t[1], t[2] + y) ||
          solid(t[0], t[1], t[2] - y)
        ),
      reach = (t, e) => {
        const i = Math.hypot(e[0] - t[0], e[1] - t[1], e[2] - t[2]),
          s = Math.max(1, Math.ceil(i / 0.08));
        let n = t;
        for (let i = 1; i <= s; i++) {
          const a = [
            t[0] + ((e[0] - t[0]) * i) / s,
            t[1] + ((e[1] - t[1]) * i) / s,
            t[2] + ((e[2] - t[2]) * i) / s,
          ];
          if (!clear(a)) break;
          n = a;
        }
        return n;
      };
    m = reach(r, m);
    const f = Math.min(0.1, (e - (this.last || e)) / 1e3);
    ((this.last = e),
      (!this.pos ||
        Math.hypot(m[0] - this.pos[0], m[1] - this.pos[1], m[2] - this.pos[2]) > 12 ||
        this.world !== n) &&
        ((this.pos = m.slice()), (this.world = n)));
    const g = 1 - Math.exp(-f * (d ? 7 : 6));
    for (let t = 0; t < 3; t++) this.pos[t] += (m[t] - this.pos[t]) * g;
    ((this.pos = reach(r, this.pos)),
      (this.tooClose =
        0 === t.perspective &&
        Math.hypot(this.pos[0] - r[0], this.pos[1] - r[1], this.pos[2] - r[2]) <
          (this.tooClose ? 0.7 : 0.55)));
    const w = t.renderer.camPos;
    let A = Math.atan2(w[0] - this.pos[0], w[2] - this.pos[2]) - this.yaw;
    ((A = Math.atan2(Math.sin(A), Math.cos(A))), (this.yaw += A * (1 - Math.exp(6 * -f))));
  },
  draw(t, e, i) {
    if (!this.visible(t)) return void (this.pos = null);
    const s = t.renderer,
      n = s.gl,
      a = performance.now();
    if (!s.entityTex["@jing"]) {
      if (!this.loading) {
        this.loading = !0;
        const t = new Image();
        ((t.onload = () => {
          this.img = t;
          const e = n.createTexture();
          (n.bindTexture(n.TEXTURE_2D, e),
            n.texImage2D(n.TEXTURE_2D, 0, n.RGBA, n.RGBA, n.UNSIGNED_BYTE, t),
            n.generateMipmap(n.TEXTURE_2D),
            n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MIN_FILTER, n.LINEAR_MIPMAP_LINEAR),
            n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MAG_FILTER, n.LINEAR),
            n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_S, n.CLAMP_TO_EDGE),
            n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_T, n.CLAMP_TO_EDGE),
            (s.entityTex["@jing"] = e));
        }),
          (t.src = JING_TEX.src));
      }
      return;
    }
    if ((this.mesh || this.build(s, this.img), this.place(t, a, e), this.tooClose)) return;
    const o = a / 1e3,
      h = (a - this.pulse) / 1e3,
      r = h < 0.6 ? Math.sin((h / 0.6) * Math.PI) : 0,
      c = Math.hypot(...[0, 1, 2].map((t) => this.pos[t] - s.camPos[t])),
      l = 1 + 0.12 * r,
      u = this.R * Math.max(0.55, Math.min(1, c / 1.2)),
      p = M4.create();
    (M4.translate(p, this.pos[0], this.pos[1] + 0.04 * Math.sin(2.2 * o) + 0.12 * r, this.pos[2]),
      M4.rotY(p, this.yaw),
      M4.rotZ(p, 0.08 * Math.sin(1.3 * o)),
      M4.scale(p, u / Math.sqrt(l), u * l, u / Math.sqrt(l)));
    const d = t.world.getLight(
        Math.floor(this.pos[0]),
        Math.floor(this.pos[1]),
        Math.floor(this.pos[2]),
      ),
      m = s.entBegin("@jing", [Math.max(0.5, (d >> 4) / 15), Math.max(0.5, (15 & d) / 15)], i, {});
    (n.uniform1f(m.u.u_bright, s.fxOn ? 0.55 : 0.3),
      n.disable(n.CULL_FACE),
      n.uniformMatrix4fv(m.u.u_model, !1, p),
      n.bindVertexArray(this.mesh.vao),
      n.drawElements(n.TRIANGLES, 1.5 * this.mesh.n, n.UNSIGNED_INT, 0));
    const y = M4.copy(p);
    (M4.translate(y, ...this.TAIL_AT),
      M4.rotY(y, 0.35 * Math.sin(3.1 * o)),
      n.uniformMatrix4fv(m.u.u_model, !1, y),
      n.bindVertexArray(this.tail.vao),
      n.drawElements(n.TRIANGLES, 1.5 * this.tail.n, n.UNSIGNED_INT, 0),
      n.bindVertexArray(null),
      n.enable(n.CULL_FACE),
      n.activeTexture(n.TEXTURE0));
  },
};
(() => {
  const t = runCommand;
  ((Companion.runRaw = t),
    (runCommand = function (e, i) {
      const s = performance.now();
      t(e, i);
      const n = cmdTidy(String(i || ""));
      n &&
        (n.startsWith("/")
          ? Companion.quick(e) &&
            setTimeout(
              () => {
                const t = e.ui.chat.filter((t) => t.t >= s && !t.ai && t.text),
                  i = t.some((t) => "#FF5555" === t.color);
                Companion.say(
                  e,
                  `（玩家刚输入了命令：${n}  游戏的回应：${
                    t
                      .map((t) => t.text)
                      .join(" / ")
                      .slice(0, 300) || "没有回应"
                  }${i ? "（出错了）" : ""}）`,
                  !1,
                  !0,
                );
              },
              e.net ? 1500 : 300,
            )
          : Companion.quick(e, n) && Companion.say(e, n, !1));
    }));
})();
//# sourceURL=js/companion.js
