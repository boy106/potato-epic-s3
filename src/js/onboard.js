"use strict";
const LEGAL = {
  v: 3,
  agreement: [
    "《用户协议》（2026 年 11 月 17 日更新）",
    "1. 「土豆史诗」是 UP 主「土豆味小哲」独立制作的网页射击游戏，永久免费。",
    "2. 素材说明：游戏中使用的第三方素材（材质、皮肤、音效等）遵循各自的授权协议，版权归原作者所有。",
    "3. 永不盈利：本游戏永久免费，没有充值、付费道具、会员和广告，我们不会以任何形式通过本游戏盈利；游戏里的饰品、披风只能通过活动、签到等免费方式获得。",
    "4. 配合处理：如果任何权利人认为本游戏侵犯了他们的权利并提出要求，我们会立即配合，下架游戏或删除相关内容。权利人可以通过 B站 私信 UP 主「土豆味小哲」联系我们。",
    "5. 游戏中的枪械、地图和玩法为我们原创制作。",
    "6. 我们原创的代码、界面、披风、玩法等受著作权法保护。禁止：逆向、反编译游戏代码；抓取后未经书面许可公开或分发；搭建仿冒服务器或镜像站；使用作弊程序、改包连接我们的服务器。",
    "   违反的会被封号，必要时追究法律责任。",
    "7. 联机时请文明游戏：不骂人、不刷屏、不破坏别人的建筑；房主可以踢人、禁言、封禁，我们也会处理举报。",
    "8. 账号由你自己保管：个人识别码可以登录你的账号，请不要告诉别人。",
    "9. 服务器可能维护或调整；云存档、房间按说明的时间清理。因不可抗力或第三方原因造成的数据损失，我们会尽力恢复但不承担责任。",
    "10. 协议更新时会在游戏里再提示一次。问题和建议：游戏里的「反馈问题」，或 B站 私信 UP 主。",
  ],
  privacy: [
    "《隐私说明》",
    "我们收集：B站 昵称、头像链接和这个游戏专用的用户编号（toyOpenId，只存加密后的值）；你的游戏名、识别码（只存加密后的值）、",
    "设置、皮肤和披风选择、解锁记录；云存档；进过的房间；IP 地址（防刷、限流，不长期保存）；",
    "匿名的游戏统计（帧率、设备、显卡、报错，用来改进游戏，可以在 选项 → 遥测数据 里关掉）；你主动提交的反馈和截图。",
    "用途：登录、联机、云存档、防止作弊和刷屏、改进游戏。不出售、不用于广告。",
    "保存多久：云存档 7 天不玩删除；房间 30 天没人用删除；统计 180 天、反馈 365 天后删除。",
    "删除：选项 → 账号 → 删除账号，会删掉账号、云存档和解锁记录（设备上的存档不受影响）。",
  ],
};
class AgreementScreen extends MenuScreen {
  constructor(t, e, s, i) {
    if (
      (super(t, s ? "用户协议和隐私说明" : null),
      (this.next = e),
      (this.viewOnly = s),
      (this.pauses = !1),
      (this.titleY = 8),
      (this.agree = !1),
      (this.scroll = 0),
      (this.updated = !s && (t.settings.legalV || 0) > 0 && t.settings.legalV < LEGAL.v),
      s && "privacy" === i)
    ) {
      const t = this.lines(),
        e = t.findIndex((t) => t.startsWith("《隐私说明》"));
      this.scroll = clamp(e, 0, Math.max(0, t.length - this.rows()));
    }
  }
  box() {
    const t = this.game.ui,
      e = Math.min(290, t.w - 16);
    return { x: Math.floor(t.w / 2 - e / 2), y: Math.floor(t.h / 2 - 66), w: e, h: 132 };
  }
  rowParts() {
    const t = this.box(),
      e = [
        ["check", "我已阅读并同意"],
        ["agreement", "《用户协议》"],
        ["and", "和"],
        ["privacy", "《隐私说明》"],
      ],
      s = 12 + e.reduce((t, e) => t + Font.width(e[1]), 0);
    let i = Math.floor(t.x + t.w / 2 - s / 2) + 12;
    const n = t.y + 70,
      h = [{ k: "box", x: i - 12, y: n - 1, w: 9, h: 9 }];
    for (const [t, s] of e) {
      const e = Font.width(s);
      (h.push({ k: t, t: s, x: i, y: n, w: e, h: 9 }), (i += e));
    }
    return h;
  }
  rowHit(t, e) {
    return this.rowParts().find(
      (s) => t >= s.x - 1 && t < s.x + s.w + 1 && e >= s.y - 2 && e < s.y + s.h + 2,
    );
  }
  mouseDown(t, e, s, i) {
    if (!this.viewOnly && 0 === i) {
      const t = this.rowHit(e, s);
      if (t && ("agreement" === t.k || "privacy" === t.k))
        return (
          Sound.click(),
          this.game.ui.open(new AgreementScreen(this.game, () => this.game.ui.open(this), !0, t.k))
        );
      if (t) return (Sound.click(), (this.agree = !this.agree), void (this.warn = 0));
    }
    return super.mouseDown(t, e, s, i);
  }
  lines() {
    const t = [],
      e = this.game.ui.w - 40;
    for (const s of [...LEGAL.agreement, "", ...LEGAL.privacy]) {
      if (!s) {
        t.push("");
        continue;
      }
      let i = s;
      for (; i.length;) {
        let s = i.length;
        for (; s > 1 && Font.width(i.slice(0, s)) > e;) s--;
        (t.push(i.slice(0, s)), (i = i.slice(s)));
      }
    }
    return t;
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2;
    if (this.viewOnly)
      return void (this.widgets = [
        { x: e - 100, y: t.h - 26, w: 200, h: 20, label: "返回", onClick: () => this.done() },
      ]);
    const s = this.box();
    this.widgets = [
      {
        x: e - 70,
        y: s.y + s.h - 32,
        w: 140,
        h: 20,
        gold: !0,
        label: "同意并继续",
        onClick: () => {
          this.agree
            ? ((this.game.settings.legalV = LEGAL.v), this.game.saveSettings(), this.done())
            : (this.warn = performance.now());
        },
      },
    ];
  }
  drawWindow(t) {
    const e = t.ctx,
      s = this.box(),
      i = s.x + s.w / 2,
      n = t.mouse;
    (t.dim(0.35),
      drawCard(e, s.x, s.y, s.w, s.h, !1),
      Font.center(
        e,
        this.updated ? "用户协议有更新" : "欢迎来到 土豆史诗",
        i,
        s.y + 10,
        "#FFFFFF",
      ));
    (this.updated
      ? ["协议内容有调整，请重新阅读并同意后继续游戏。"]
      : [
          "这是 UP 主「土豆味小哲」制作的网页射击游戏，永久免费。",
          "开始之前，请阅读并同意下面的协议。",
        ]
    ).forEach((t, n) => Font.center(e, fitText(t, s.w - 16), i, s.y + 28 + 11 * n, "#A0A0A0"));
    const h = this.rowHit(n.x, n.y);
    for (const t of this.rowParts()) {
      if ("box" === t.k) {
        ((e.fillStyle = "#000000"),
          e.fillRect(t.x, t.y, t.w, t.h),
          (e.strokeStyle =
            !h || ("box" !== h.k && "check" !== h.k)
              ? this.warn && performance.now() - this.warn < 1500
                ? "#FF6060"
                : "#A0A0A0"
              : "#FFFFFF"),
          (e.lineWidth = 1),
          e.strokeRect(t.x + 0.5, t.y + 0.5, t.w - 1, t.h - 1),
          this.agree &&
            ((e.fillStyle = "#55FF55"),
            e.fillRect(t.x + 2, t.y + 4, 2, 2),
            e.fillRect(t.x + 3, t.y + 5, 2, 2),
            e.fillRect(t.x + 5, t.y + 3, 1, 2),
            e.fillRect(t.x + 6, t.y + 2, 1, 2)));
        continue;
      }
      const s = "agreement" === t.k || "privacy" === t.k,
        i = h === t || (h && h.k === t.k),
        n = s ? (i ? "#9FD0FF" : "#55AAFF") : "#E0E0E0";
      (Font.draw(e, t.t, t.x, t.y, n), s && ((e.fillStyle = n), e.fillRect(t.x, t.y + 9, t.w, 1)));
    }
    this.warn && performance.now() - this.warn < 1500
      ? Font.center(e, "请先勾选「我已阅读并同意」", i, s.y + 84, "#FF6060")
      : Font.center(e, "点蓝色的名字可以查看全文", i, s.y + 84, "#707070");
  }
  done() {
    const t = this.next;
    ((this.next = null), t && t());
  }
  wheel(t) {
    this.scroll = clamp(this.scroll - 3 * t, 0, Math.max(0, this.lines().length - this.rows()));
  }
  rows() {
    return Math.floor((this.game.ui.h - 24 - 34) / 10);
  }
  drawExtra(t) {
    if (!this.viewOnly) return this.drawWindow(t);
    const e = t.ctx,
      s = this.lines(),
      i = this.rows();
    ((e.fillStyle = "rgba(0,0,0,0.45)"),
      e.fillRect(12, 20, t.w - 24, 10 * i + 6),
      s
        .slice(this.scroll, this.scroll + i)
        .forEach((t, s) => Font.draw(e, t, 18, 24 + 10 * s, /^《/.test(t) ? "#FFD24A" : "#E0E0E0")),
      s.length > i &&
        Font.draw(
          e,
          "" + (this.scroll + i < s.length ? "↓ 滑动或滚动查看更多" : "— 完 —"),
          t.w - 120,
          24 + 10 * i - 9,
          "#808080",
        ));
  }
  onEsc() {
    this.viewOnly && this.done();
  }
}
const PLAYER_KINDS = [
  { id: "new", title: "第一次玩", sub: "从头教我怎么玩", icon: "grass_block" },
  { id: "mc", title: "玩过类似的游戏", sub: "看看有什么不一样", icon: "crafting_table" },
  { id: "vet", title: "这个版本我玩过", sub: "直接开始", icon: "diamond_pickaxe" },
];
class PlayerKindScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, "你是哪种玩家？"), (this.next = e), (this.pauses = !1), (this.titleY = 14));
  }
  cards() {
    const t = this.game.ui,
      e = Math.min(130, Math.floor((t.w - 24) / 3) - 6),
      s = Math.min(120, t.h - 80),
      i = Math.floor(t.h / 2 - s / 2) + 6;
    return PLAYER_KINDS.map((n, h) => ({
      ...n,
      x: Math.floor(t.w / 2 - (3 * e + 12) / 2) + h * (e + 6),
      y: i,
      w: e,
      h: s,
    }));
  }
  layout() {
    this.widgets = this.cards().map((t) => ({
      x: t.x,
      y: t.y,
      w: t.w,
      h: t.h,
      label: "",
      card: t,
      onClick: () => this.pick(t.id),
    }));
  }
  pick(t) {
    const e = this.game.settings;
    ((e.playerKind = t),
      "new" === t &&
        Object.assign(e, { tutorial: !0, tips: !0, recipeHints: !0, minimap: !0, deathMarker: !0 }),
      "mc" === t &&
        Object.assign(e, { tutorial: !1, tips: !1, recipeHints: !0, minimap: !1, deathMarker: !1 }),
      "vet" === t && Object.assign(e, { tutorial: !1, tips: !1 }),
      this.game.saveSettings(),
      Telemetry.count && Telemetry.count("kind_" + t));
    const s = this.next;
    ((this.next = null), s && s());
  }
  draw(t) {
    super.draw(t);
    const e = t.ctx;
    for (const s of this.widgets) {
      const i = s.card,
        n = t.hit(s);
      (drawCard(e, i.x, i.y, i.w, i.h, n),
        t.drawItem && t.drawItem(makeStack(i.icon, 1), Math.floor(i.x + i.w / 2 - 8), i.y + 14),
        Font.center(e, fitText(i.title, i.w - 8), i.x + i.w / 2, i.y + 44, "#FFFFFF"),
        Font.center(e, fitText(i.sub, i.w - 8), i.x + i.w / 2, i.y + 58, "#A0A0A0"));
    }
  }
  onEsc() {}
}
const QUALITY_CARDS = [
    { id: "low", name: "流畅", sub: "近处清楚、远处少", cost: 0.45 },
    { id: "medium", name: "均衡", sub: "大多数设备", cost: 0.65 },
    { id: "high", name: "高", sub: "看得更远", cost: 1 },
    { id: "ultra", name: "极致", sub: "最远视距", cost: 1.6 },
  ],
  SHADER_CARDS = [
    { lv: 0, name: "关闭", sub: "标准画面", cost: 1 },
    { lv: 1, name: "柔和", sub: "轻微阴影和雾", cost: 1.25 },
    { lv: 2, name: "标准光影", sub: "阴影、水面反射", cost: 1.6 },
    { lv: 3, name: "增强", sub: "更强的光影效果", cost: 2.2 },
    { lv: 4, name: "极限", sub: "体积光，最吃显卡", cost: 3 },
  ];
class QualityScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, null),
      (this.next = e),
      (this.pauses = !1),
      (this.blurBg = !1),
      (this.bgDim = 0),
      (this.phase = "detect"),
      (this.t0 = performance.now()),
      (this.rec = null));
    const s = t,
      i = s.renderer.gl;
    ((this.hw = {
      gpu: PerfMon.gpuName(i) || "未知显卡",
      cores: navigator.hardwareConcurrency || 0,
      mem: navigator.deviceMemory || 0,
      phone: "phone" === TouchDevice.kind || "tablet" === TouchDevice.kind,
    }),
      (this.q =
        s.settings.preset && QUALITY_CARDS.some((t) => t.id === s.settings.preset)
          ? s.settings.preset
          : detectPreset(i)),
      (this.sh = Math.max(
        0,
        Math.min(SHADER_CARDS.length - 1, Math.round(s.settings.shaders) || 0),
      )),
      applyPreset(s, this.q),
      s.applySettings(),
      (this.fxOk = !(!s.renderer.fx || !s.renderer.fx.ok)),
      this.startBench());
  }
  get hz() {
    const t = this.game.pacer;
    return t && t.refresh ? Math.round(1e3 / t.refresh) : 60;
  }
  get gameFps() {
    const t = this.game.pacer;
    return Math.min(this.hz, (t && t.playLimit) || 1e3);
  }
  startBench() {
    const t = this.game,
      e = t.renderer.gl,
      s = new Uint8Array(4),
      i = this;
    ((this.levels = this.fxOk && !this.hw.phone ? SHADER_CARDS.map((t) => t.lv) : [0]),
      (this.li = 0),
      (this.got = []),
      (this.skip = 6),
      (this.ms = {}),
      (this.lt0 = performance.now()),
      (this.benchFrom = 0),
      this.setLevel(this.levels[0]));
    const n = Object.prototype.hasOwnProperty.call(t, "render") ? t.render : null,
      h = t.render;
    ((t.render = function (...t) {
      const n = performance.now(),
        o = h.apply(this, t);
      return (
        "detect" === i.phase &&
          !document.hidden &&
          i.loaded() &&
          (e.readPixels(0, 0, 1, 1, e.RGBA, e.UNSIGNED_BYTE, s), i.sample(performance.now() - n)),
        o
      );
    }),
      (this.unhook = () => {
        (n ? (t.render = n) : delete t.render, (this.unhook = null));
      }));
  }
  loaded() {
    if (this.benchFrom) return !0;
    const t = this.game,
      e = performance.now(),
      s = t.renderer.sections ? t.renderer.sections.size : 0,
      i =
        t.titleGround ||
        (t.genQueue && t.genQueue.length) ||
        t.meshPending ||
        (t.genPending && t.genPending.size) ||
        (t.finalQ && t.finalQ.length);
    return (
      (i || s !== this.secN) && ((this.secN = s), (this.secT = e)),
      !!((!i && s && e - this.secT >= 1e3) || e - this.t0 > 1e4) &&
        ((this.benchFrom = this.lt0 = e), (this.skip = 6), !0)
    );
  }
  setLevel(t) {
    const e = this.game;
    ((e.settings.shaders = t), e.applySettings());
  }
  sample(t) {
    if (this.skip > 0) return void this.skip--;
    t < 250 && this.got.push(t);
    const e = performance.now();
    if ((this.got.length < 48 || e - this.lt0 < 2e3) && e - this.lt0 < 5e3) return;
    const s = this.got.sort((t, e) => t - e);
    (s.length >= 5 && (this.ms[this.levels[this.li]] = s[Math.floor(s.length / 2)]),
      ++this.li < this.levels.length
        ? ((this.got = []), (this.skip = 6), (this.lt0 = e), this.setLevel(this.levels[this.li]))
        : this.finish());
  }
  tick() {
    if ("detect" !== this.phase) return;
    const t = performance.now();
    (this.benchFrom ? t - this.benchFrom > 5500 * this.levels.length + 1500 : t - this.t0 > 12e3) &&
      this.finish();
  }
  finish() {
    if ("detect" !== this.phase) return;
    this.unhook && this.unhook();
    const t = this.game.settings,
      e = this.hw.phone,
      s = Object.keys(this.ms).length > 0;
    if (e) for (const t in this.ms) this.ms[t] *= 1.4;
    const i = this.ms[0] || ("low" === this.q ? 12 : "medium" === this.q ? 8 : 5);
    for (const t of SHADER_CARDS) this.ms[t.lv] || (this.ms[t.lv] = i * t.cost);
    this.base = { ms: this.ms, rd: t.renderDist || 8, res: t.resScale || 1 };
    const n = Math.min(55, 0.9 * this.gameFps);
    let h = { q: "low", sh: 0 };
    if (s)
      for (const t of QUALITY_CARDS)
        for (const s of SHADER_CARDS)
          (s.lv && (!this.fxOk || e)) ||
            (e && "ultra" === t.id) ||
            (this.estimate(t, s) >= n &&
              t.cost * s.cost >=
                QUALITY_CARDS.find((t) => t.id === h.q).cost * SHADER_CARDS[h.sh].cost &&
              (h = { q: t.id, sh: s.lv }));
    else h = { q: e && "ultra" === this.q ? "high" : this.q, sh: 0 };
    ((this.rec = h),
      (this.q = h.q),
      (this.sh = h.sh),
      this.apply(),
      (this.phase = "pick"),
      this.game.ui.screen === this && this.layout());
  }
  estimate(t, e) {
    const s = this.base;
    if (!s) return 0;
    const i = PRESETS[t.id] || {},
      n = self.POTATO ? 1 : ((i.renderDist || s.rd) / s.rd) ** 2,
      h = ((i.resScale || 1) / s.res) ** 2,
      o = s.ms[0],
      r =
        o * (0.6 * n + 0.4 * h) + Math.max(0, (s.ms[e.lv] || o * e.cost) - o) * (0.5 * n + 0.5 * h);
    return Math.min(this.gameFps, Math.round(1e3 / (1.15 * r + 1)));
  }
  apply() {
    const t = this.game,
      e = t.settings;
    (applyPreset(t, this.q),
      (e.shaders = this.fxOk ? this.sh : 0),
      t.applySettings(),
      t.saveSettings());
  }
  cardRects() {
    const t = this.game.ui,
      e = Math.max(QUALITY_CARDS.length, SHADER_CARDS.length),
      s = Math.min(90, Math.floor((t.w - 20) / e) - 4),
      x0 = (e) => Math.floor(t.w / 2 - (e * s + 4 * (e - 1)) / 2),
      i = t.h - 72 - 54,
      n = i + 36 + 14;
    return {
      q: QUALITY_CARDS.map((t, e) => ({
        ...t,
        x: x0(QUALITY_CARDS.length) + e * (s + 4),
        y: i,
        w: s,
        h: 36,
      })),
      s: SHADER_CARDS.map((t, e) => ({
        ...t,
        x: x0(SHADER_CARDS.length) + e * (s + 4),
        y: n,
        w: s,
        h: 36,
      })),
    };
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      s = this.cardRects();
    if (((this.widgets = []), "pick" === this.phase)) {
      for (const t of s.q)
        this.widgets.push({
          x: t.x,
          y: t.y,
          w: t.w,
          h: t.h,
          label: "",
          card: t,
          kind: "q",
          onClick: () => {
            ((this.q = t.id), this.apply());
          },
        });
      for (const t of s.s)
        this.widgets.push({
          x: t.x,
          y: t.y,
          w: t.w,
          h: t.h,
          label: "",
          card: t,
          kind: "s",
          enabled: this.fxOk || 0 === t.lv,
          onClick: () => {
            ((this.sh = t.lv), this.apply());
          },
        });
      this.widgets.push({
        x: e - 49,
        y: t.h - 24,
        w: 98,
        h: 20,
        gold: !0,
        label: "就这样",
        onClick: () => {
          const t = this.next;
          ((this.next = null), t && t());
        },
      });
    }
  }
  draw(t) {
    this.tick();
    const e = t.ctx,
      s = t.w / 2,
      i = this.cardRects();
    ((e.fillStyle = "rgba(0,0,0,0.55)"),
      e.fillRect(0, 0, t.w, 42),
      Font.center(e, "选择画质和光影（上面就是实时画面）", s, 4, "#FFFFFF"));
    const n = this.hw,
      h = `${n.gpu.replace(/^ANGLE \(|\)$/g, "").slice(0, 48)}${n.cores ? " · " + n.cores + " 线程" : ""}${n.mem ? " · " + n.mem + " GB 内存" : ""}`;
    if ("detect" === this.phase) {
      const i = this.levels[this.li],
        n = this.levels.length > 1 && void 0 !== i ? `（光影「${SHADER_CARDS[i].name}」）` : "";
      Font.center(e, fitText("正在测试你的设备" + n + "… " + h, t.w - 8), s, 18, "#A0A0A0");
      const o = Math.min(1, (this.li + Math.min(1, this.got.length / 48)) / this.levels.length);
      ((e.fillStyle = "#555555"),
        e.fillRect(s - 80, 29, 160, 2),
        (e.fillStyle = "#80FF80"),
        e.fillRect(s - 80, 29, Math.round(160 * o), 2));
    } else
      (Font.center(e, fitText("检测到：" + h, t.w - 8), s, 16, "#A0A0A0"),
        Font.center(
          e,
          `推荐：${QUALITY_CARDS.find((t) => t.id === this.rec.q).name}画质 + ${SHADER_CARDS[this.rec.sh].name}光影（已经帮你选好）`,
          s,
          28,
          "#80FF80",
        ));
    if (
      ((e.fillStyle = "rgba(0,0,0,0.6)"),
      e.fillRect(0, i.q[0].y - 14, t.w, t.h - i.q[0].y + 14),
      "pick" === this.phase)
    ) {
      (Font.draw(e, "画质", i.q[0].x, i.q[0].y - 11, "#FFFFFF"),
        Font.draw(e, "光影", i.s[0].x, i.s[0].y - 11, "#FFFFFF"));
      for (const s of this.widgets) {
        if (!s.card) continue;
        const i = s.card,
          n = "q" === s.kind ? this.q === i.id : this.sh === i.lv,
          h = "q" === s.kind ? this.rec.q === i.id : this.rec.sh === i.lv,
          o = !1 === s.enabled;
        if (
          ((e.fillStyle = n ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.5)"),
          e.fillRect(i.x, i.y, i.w, i.h),
          (e.strokeStyle = n ? "#FFFFFF" : t.hit(s) ? "#A0A0A0" : "#555555"),
          (e.lineWidth = n ? 2 : 1),
          e.strokeRect(i.x + 0.5, i.y + 0.5, i.w - 1, i.h - 1),
          Font.draw(e, i.name, i.x + 4, i.y + 4, o ? "#707070" : "#FFFFFF"),
          Font.draw(e, fitText(o ? "设备不支持" : i.sub, i.w - 8), i.x + 4, i.y + 15, "#A0A0A0"),
          !o)
        ) {
          const t =
            "q" === s.kind
              ? this.estimate(i, SHADER_CARDS[this.sh])
              : this.estimate(
                  QUALITY_CARDS.find((t) => t.id === this.q),
                  i,
                );
          Font.draw(
            e,
            `预计 ${t} 帧`,
            i.x + 4,
            i.y + 26,
            t >= 55 ? "#80FF80" : t >= 30 ? "#FFFF55" : "#FF8080",
          );
        }
        h &&
          ((e.fillStyle = "#E8B830"),
          e.fillRect(i.x + i.w - 26, i.y, 26, 10),
          Font.draw(e, "推荐", i.x + i.w - 25, i.y + 1, "#3A2A00"));
      }
      Font.center(
        e,
        fitText("之后可以在 选项 → 视频设置 里改；帧率太低时会自动降低分辨率", t.w - 8),
        s,
        t.h - 40,
        "#808080",
      );
    } else Font.center(e, "马上就好…", s, i.q[0].y + 20, "#A0A0A0");
    for (const e of this.widgets) e.card || t.button(e);
    for (const e of this.widgets)
      e.tip &&
        t.hit(e) &&
        t.tooltip(
          e.tip.map((t) => ({ text: t })),
          t.mouse.x,
          t.mouse.y,
        );
  }
  onEsc() {}
}
const FPS_TEST_V = 1,
  FPS_SUB = {
    120: "最流畅，最耗电",
    90: "很流畅，较耗电",
    60: "流畅，省电",
    30: "最省电，低配设备",
  };
class FpsTestScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, null),
      (this.next = e),
      (this.pauses = !1),
      (this.blurBg = !1),
      (this.bgDim = 0.3),
      (this.phase = "wait"),
      (this.t0 = performance.now()),
      (this.from = 0),
      (this.ts = []),
      (this.cpu = []),
      (this.skip = 10));
    const s = t.pacer;
    ((this.phone = !(!s || !s.touch)),
      s && (s.free = this),
      Telemetry.count && Telemetry.count("fpstest_start"));
  }
  get hz() {
    const t = this.game.pacer;
    return t ? t.hz : 60;
  }
  options() {
    const t = this.hz,
      e = [120, 90, 60, 30].filter((e) => e <= t + 5);
    return (!this.phone && t > 125 && e.unshift(t), e);
  }
  value(t) {
    const e = this.hz;
    return 60 === t
      ? this.phone || e <= 65
        ? 0
        : 60
      : !this.phone && t >= e - 5 && t > 125
        ? 0
        : t;
  }
  label(t) {
    return !this.phone && t > 125 ? `跟随屏幕 ${t}` : t + " 帧";
  }
  loaded() {
    if (this.from) return !0;
    const t = this.game,
      e = performance.now(),
      s = t.renderer.sections ? t.renderer.sections.size : 0,
      i =
        t.titleGround ||
        (t.genQueue && t.genQueue.length) ||
        t.meshPending ||
        (t.genPending && t.genPending.size) ||
        (t.finalQ && t.finalQ.length);
    return (
      (i || s !== this.secN) && ((this.secN = s), (this.secT = e)),
      !!((!i && s && e - this.secT >= 1e3) || e - this.t0 > 1e4) &&
        ((this.from = e), (this.phase = "test"), !0)
    );
  }
  sample() {
    const t = performance.now(),
      e = this.lastDraw ? t - this.lastDraw : 0;
    if (
      ((this.lastDraw = t),
      e > 1e3 &&
        "pick" !== this.phase &&
        ((this.t0 += e),
        this.from && ((this.from = t), (this.ts = []), (this.cpu = []), (this.skip = 10))),
      "pick" === this.phase || document.hidden || !this.loaded())
    )
      return;
    if (this.skip > 0) return (this.skip--, void (this.from = performance.now()));
    const s = performance.now(),
      i = PerfMon.N;
    (this.ts.push(s),
      this.cpu.push(PerfMon.cpu[(PerfMon.i + i - 1) % i]),
      s - this.from >= 4e3 && this.ts.length >= 20 && this.finish());
  }
  tick() {
    "pick" !== this.phase && performance.now() - this.t0 > 2e4 && this.finish();
  }
  finish() {
    if ("pick" === this.phase) return;
    const t = this.ts,
      e = t.length,
      s = this.hz,
      i = this.options();
    let n = 0,
      h = 0,
      o = 0;
    if (e >= 20) {
      n = (1e3 * (e - 1)) / (t[e - 1] - t[0]);
      const s = [...this.cpu].sort((t, e) => t - e);
      h = s[Math.floor(0.75 * s.length)];
      const i = 1e3 / (h * (this.phone ? 1.6 : 1.25) + 1);
      o = Math.min(n, i);
    }
    let r = 60;
    if (e >= 20) {
      r = 30;
      for (const t of i)
        if (t >= 60 && o >= 0.92 * t) {
          r = t;
          break;
        }
      30 === r && o >= 40 && (r = 60);
    }
    ((this.res = {
      fps: Math.round(n),
      work: Math.round(10 * h) / 10,
      sustain: Math.round(o),
      hz: s,
      measured: e >= 20,
    }),
      (this.rec = r),
      (this.sel = r),
      (this.phase = "pick"));
    const c = this.game.pacer;
    (c && c.free === this && (c.free = null), this.game.ui.screen === this && this.layout());
  }
  cardRects() {
    const t = this.game.ui,
      e = this.options(),
      s = Math.min(100, Math.floor((t.w - 20) / e.length) - 6),
      i = Math.floor(t.w / 2 - (e.length * s + 6 * (e.length - 1)) / 2),
      n = Math.floor(t.h / 2) - 6;
    return e.map((t, e) => ({ f: t, x: i + e * (s + 6), y: n, w: s, h: 40 }));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2;
    if (((this.widgets = []), "pick" === this.phase)) {
      for (const t of this.cardRects())
        this.widgets.push({
          x: t.x,
          y: t.y,
          w: t.w,
          h: t.h,
          label: "",
          card: t,
          onClick: () => {
            this.sel = t.f;
          },
        });
      this.widgets.push({
        x: e - 100,
        y: t.h - 30,
        w: 200,
        h: 20,
        gold: !0,
        label: "确定",
        onClick: () => this.done(),
      });
    } else
      this.widgets.push({
        x: e - 50,
        y: t.h - 28,
        w: 100,
        h: 20,
        label: "跳过",
        onClick: () => this.skipTest(),
      });
  }
  skipTest() {
    const t = this.game.pacer;
    (t && t.free === this && (t.free = null),
      Telemetry.count && Telemetry.count("fpstest_skip"),
      (this.game.settings.fpsTestV = 1),
      this.game.saveSettings());
    const e = this.next;
    ((this.next = null), e && e());
  }
  done() {
    const t = this.game,
      e = t.settings;
    ((e.maxFps = this.value(this.sel)),
      (e.fpsTestV = 1),
      (e.fpsTest = { ...this.res, rec: this.rec, pick: this.sel, at: Date.now() }),
      t.saveSettings(),
      t.applySettings && t.applySettings(),
      Telemetry.count &&
        Telemetry.count("fpstest_" + this.rec + (this.sel === this.rec ? "" : "_pick" + this.sel)));
    const s = this.next;
    ((this.next = null), s && s());
  }
  draw(t) {
    (this.sample(), this.tick(), super.draw(t));
    const e = t.ctx,
      s = t.w / 2,
      i = Math.floor(t.h / 2);
    if (
      ((e.fillStyle = "rgba(0,0,0,0.55)"),
      e.fillRect(0, 0, t.w, 44),
      Font.center(e, "帧率检测", s, 6, "#FFFFFF"),
      "pick" !== this.phase)
    ) {
      Font.center(
        e,
        fitText("正在测试你的设备能跑多少帧，找出最合适的帧率上限（约 5 秒）…", t.w - 8),
        s,
        20,
        "#A0A0A0",
      );
      const n = "test" === this.phase ? Math.min(1, (performance.now() - this.from) / 4e3) : 0;
      ((e.fillStyle = "#555555"),
        e.fillRect(s - 80, 33, 160, 2),
        (e.fillStyle = "#80FF80"),
        e.fillRect(s - 80, 33, Math.round(160 * n), 2));
      const h = this.ts,
        o = h.length,
        r = o > 10 ? Math.round(1e4 / (h[o - 1] - h[o - 11])) : 0;
      ((e.fillStyle = "rgba(0,0,0,0.6)"),
        e.fillRect(s - 90, i - 22, 180, 44),
        Font.center(
          e,
          "test" === this.phase ? `当前 ${r || "…"} 帧` : "正在准备画面…",
          s,
          i - 12,
          "#FFFFFF",
        ),
        Font.center(e, `屏幕刷新率 ${this.hz} Hz`, s, i + 4, "#A0A0A0"));
    } else {
      const n = this.res;
      (Font.center(
        e,
        fitText(
          n.measured
            ? `屏幕刷新率 ${n.hz} Hz，测试中每秒 ${n.fps} 帧，游戏里预计能稳定 ${n.sustain} 帧`
            : `屏幕刷新率 ${n.hz} Hz（没有测出来，先用 60 帧）`,
          t.w - 8,
        ),
        s,
        19,
        "#A0A0A0",
      ),
        Font.center(e, `推荐帧率上限：${this.label(this.rec)}（已经帮你选好）`, s, 31, "#80FF80"),
        (e.fillStyle = "rgba(0,0,0,0.6)"),
        e.fillRect(0, i - 26, t.w, 72),
        Font.center(e, "帧率上限", s, i - 20, "#FFFFFF"));
      for (const s of this.widgets) {
        const i = s.card;
        if (!i) continue;
        const h = this.sel === i.f;
        ((e.fillStyle = h ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.5)"),
          e.fillRect(i.x, i.y, i.w, i.h),
          (e.strokeStyle = h ? "#FFFFFF" : t.hit(s) ? "#A0A0A0" : "#555555"),
          (e.lineWidth = h ? 2 : 1),
          e.strokeRect(i.x + 0.5, i.y + 0.5, i.w - 1, i.h - 1),
          (e.lineWidth = 1),
          Font.draw(e, this.label(i.f), i.x + 4, i.y + 5, "#FFFFFF"),
          Font.draw(
            e,
            fitText(FPS_SUB[i.f] || "跟屏幕一样快，最耗电", i.w - 8),
            i.x + 4,
            i.y + 17,
            "#A0A0A0",
          ),
          n.measured &&
            i.f > this.rec &&
            Font.draw(e, fitText("可能跟不上", i.w - 8), i.x + 4, i.y + 28, "#FFAA55"),
          this.rec === i.f &&
            ((e.fillStyle = "#E8B830"),
            e.fillRect(i.x + i.w - 26, i.y, 26, 10),
            Font.draw(e, "推荐", i.x + i.w - 25, i.y + 1, "#3A2A00")));
      }
      Font.center(
        e,
        fitText(
          this.phone
            ? "之后可以在 选项 → 控制 → 触屏操作 里改；手机发热跟不上时会自动降到 60 帧"
            : "之后可以在 选项 → 视频设置 → 最大帧率 里改",
          t.w - 8,
        ),
        s,
        t.h - 44,
        "#808080",
      );
    }
    for (const e of this.widgets) e.card || t.button(e);
  }
  onEsc() {
    "pick" === this.phase && this.done();
  }
}
class DeviceScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, "你用什么设备玩？"),
      (this.next = e),
      (this.pauses = !1),
      (this.titleY = 14),
      (this.detected = TouchDevice.defaultOn ? "phone" : "pc"),
      (this.pick = this.detected));
  }
  cards() {
    const t = this.game.ui,
      e = Math.min(150, Math.floor((t.w - 30) / 2)),
      s = Math.min(100, t.h - 110),
      i = Math.floor(t.h / 2 - s / 2) - 4;
    return [
      { id: "pc", title: "用电脑玩", sub: "键盘 + 鼠标", icon: "comparator" },
      { id: "phone", title: "用手机玩", sub: "触屏操作（平板也选这个）", icon: "compass" },
    ].map((n, h) => ({
      ...n,
      x: Math.floor(t.w / 2 - (2 * e + 8) / 2) + h * (e + 8),
      y: i,
      w: e,
      h: s,
    }));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2;
    ((this.widgets = this.cards().map((t) => ({
      x: t.x,
      y: t.y,
      w: t.w,
      h: t.h,
      label: "",
      card: t,
      onClick: () => {
        this.pick = t.id;
      },
    }))),
      this.widgets.push({
        x: e - 100,
        y: t.h - 34,
        w: 200,
        h: 20,
        gold: !0,
        label: () => ("phone" === this.pick ? "继续：设置触控按钮" : "继续"),
        onClick: () => this.go(),
      }));
  }
  go() {
    const t = this.game,
      e = t.settings,
      s = "phone" === this.pick;
    (s ? (e.touch = !0) : delete e.touch,
      (e.touchPick = this.pick),
      (t.touchAuto = void 0),
      t.saveSettings(),
      t.applySettings && t.applySettings(),
      Telemetry.count &&
        Telemetry.count("device_" + this.pick + (this.pick === this.detected ? "" : "_changed")));
    const i = this.next;
    ((this.next = null), s ? t.ui.open(new TouchLayoutScreen(t, this, () => i && i())) : i && i());
  }
  draw(t) {
    super.draw(t);
    const e = t.ctx;
    for (const s of this.widgets) {
      const i = s.card;
      i
        ? (drawCard(e, i.x, i.y, i.w, i.h, t.hit(s) || this.pick === i.id),
          this.pick === i.id &&
            ((e.strokeStyle = "#FFD24A"),
            (e.lineWidth = 2),
            e.strokeRect(i.x + 1, i.y + 1, i.w - 2, i.h - 2),
            (e.lineWidth = 1)),
          t.drawItem && t.drawItem(makeStack(i.icon, 1), Math.floor(i.x + i.w / 2 - 8), i.y + 12),
          Font.center(e, i.title, i.x + i.w / 2, i.y + 40, "#FFFFFF"),
          Font.center(e, fitText(i.sub, i.w - 8), i.x + i.w / 2, i.y + 54, "#A0A0A0"),
          this.detected === i.id &&
            Font.center(e, "检测到的设备", i.x + i.w / 2, i.y + i.h - 14, "#E8B830"))
        : t.button(s);
    }
    Font.center(
      e,
      fitText(
        "pc" === this.pick
          ? "选错了也没关系：用手指点屏幕会自动出现触控按钮"
          : "之后可以在 选项 → 控制 → 触屏操作 里改",
        t.w - 8,
      ),
      t.w / 2,
      t.h - 46,
      "#808080",
    );
  }
  onEsc() {}
}
const Onboarding = {
  start(t) {
    const e = t.settings,
      login = () => {
        const after = () => this.afterLogin(t);
        if (Account.loggedIn || !RoomService.base()) return after();
        t.ui.open(new LoginScreen(t, after));
      },
      device = () => t.ui.open(new DeviceScreen(t, login)),
      fps = () => t.ui.open(new FpsTestScreen(t, device)),
      quality = () => t.ui.open(new QualityScreen(t, fps));
    e.onboarded
      ? (e.legalV || 0) < LEGAL.v &&
        t.ui.open(new AgreementScreen(t, () => t.ui.open(new TitleScreen(t))))
      : t.ui.open(new AgreementScreen(t, () => t.ui.open(new PlayerKindScreen(t, quality))));
  },
  afterLogin(t) {
    const e = t.settings;
    ((e.onboarded = !0),
      (e.seenBuild = GAME_BUILD),
      t.saveSettings(),
      Account.loggedIn && Account.update({ onboard: { kind: e.playerKind } }).catch(() => {}),
      "new" === e.playerKind || "mc" === e.playerKind
        ? t.ui.open(new DifferencesScreen(t, () => t.ui.open(new TitleScreen(t))))
        : t.ui.open(new TitleScreen(t)));
  },
};
(() => {
  const t = Game.prototype.startTitle;
  Game.prototype.startTitle = function (...e) {
    const s = t.apply(this, e),
      i = this.settings;
    if (!this.onboardChecked)
      if (((this.onboardChecked = !0), !i.onboarded || (i.legalV || 0) < LEGAL.v))
        setTimeout(() => Onboarding.start(this), 50);
      else {
        const title = () => this.ui.open(new TitleScreen(this)),
          t = i.seenBuild !== GAME_BUILD && WHATS_NEW[GAME_BUILD],
          e = t ? () => this.ui.open(new WhatsNewScreen(this, title)) : title;
        (i.fpsTestV || 0) < 1 && ("undefined" == typeof RoomService || !RoomService.fromUrl())
          ? setTimeout(() => {
              "title" === this.state && this.ui.open(new FpsTestScreen(this, e));
            }, 50)
          : t && setTimeout(e, 50);
      }
    return s;
  };
})();
const DIFF_PAGES = [
  [
    "网页里的操作",
    "电脑：WASD 移动、鼠标瞄准、E 背包、T 聊天；点一下画面锁定鼠标，Esc 释放",
    "手机：左下摇杆走路，右边滑动转视角；屏幕中间是准星，右下的攻击按钮挖掘 / 攻击、使用按钮放置 / 使用",
  ],
  [
    "和朋友联机",
    "多人游戏 → 创建房间，把邀请码或邀请卡片发给朋友；也可以进公开房间",
    "房主能踢人、禁言、设成员；也可以用自己的单人存档开房间",
  ],
  [
    "存档和账号",
    "登录后存档会同步到云端，换设备接着玩；7 天没玩的云端存档会自动删除（设备上的不动）",
    "识别码能在任何设备上登录你的账号，请保密",
  ],
  [
    "皮肤、披风、帮助",
    "大厅「衣柜」：皮肤、原创披风，签到活动的帽子、宠物和前缀",
    "按 F1 或 暂停 → 游戏说明 查看操作",
  ],
];
class DifferencesScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, "这个版本有什么不一样"),
      (this.next = e),
      (this.pauses = !1),
      (this.page = 0),
      (this.titleY = 16));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      s = this.page >= DIFF_PAGES.length - 1;
    this.widgets = [
      { x: e - 152, y: t.h - 30, w: 98, h: 20, label: "跳过", onClick: () => this.done() },
      {
        x: e - 50,
        y: t.h - 30,
        w: 98,
        h: 20,
        label: "上一页",
        enabled: this.page > 0,
        onClick: () => {
          (this.page--, this.layout());
        },
      },
      {
        x: e + 52,
        y: t.h - 30,
        w: 100,
        h: 20,
        gold: s,
        label: s ? "开始玩" : "下一页",
        onClick: () => {
          s ? this.done() : (this.page++, this.layout());
        },
      },
    ];
  }
  done() {
    const t = this.next;
    ((this.next = null), t && t());
  }
  drawExtra(t) {
    const e = t.ctx,
      s = t.w / 2,
      [i, ...n] = DIFF_PAGES[this.page],
      h = Math.min(320, t.w - 20),
      o = Math.floor(s - h / 2);
    (drawCard(e, o, 36, h, t.h - 36 - 44, !1),
      Font.center(e, `${this.page + 1} / ${DIFF_PAGES.length}　${i}`, s, 44, "#FFD24A"));
    let r = 62;
    for (const t of n) {
      let s = t;
      for (; s.length;) {
        let t = s.length;
        for (; t > 1 && Font.width(s.slice(0, t)) > h - 16;) t--;
        (Font.draw(e, s.slice(0, t), o + 8, r, "#E0E0E0"), (s = s.slice(t)), (r += 11));
      }
      r += 6;
    }
  }
  onEsc() {
    this.done();
  }
}
const WHATS_NEW = {
  "2026.10.30": [
    "B站 账号登录、个人识别码、云存档（换设备接着玩）",
    "原创披风 7 款",
    "手机：摇杆、准星 + 攻击 / 使用按钮、横屏",
    "新手引导、小地图、死亡点、物品图鉴、整理背包",
    "用单人存档开联机房间、邀请卡片、本地房间",
  ],
};
class WhatsNewScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, "更新内容"), (this.next = e), (this.pauses = !1), (this.titleY = 16));
  }
  layout() {
    const t = this.game.ui;
    this.widgets = [
      { x: t.w / 2 - 100, y: t.h - 30, w: 200, h: 20, label: "知道了", onClick: () => this.done() },
    ];
  }
  done() {
    ((this.game.settings.seenBuild = GAME_BUILD), this.game.saveSettings());
    const t = this.next;
    ((this.next = null), t && t());
  }
  drawExtra(t) {
    (WHATS_NEW[GAME_BUILD] || []).forEach((e, s) =>
      Font.center(t.ctx, fitText("· " + e, t.w - 16), t.w / 2, 40 + 14 * s, "#E0E0E0"),
    );
  }
  onEsc() {
    this.done();
  }
}
const obHas = (t, e) => t.player && t.player.inv.slots.some((t) => t && e.test(ITEMS[t.id].key));
(() => {
  const t = Game.prototype.tick;
  Game.prototype.tick = function (...e) {
    const s = t.apply(this, e);
    if ("play" === this.state)
      try {
        Tips.tick(this);
      } catch (t) {}
    return s;
  };
})();
const Tips = {
  shown: new Set(),
  tick(t) {
    if (!t.settings.tips || t.net || t.tickCount % 20) return;
    const e = t.player,
      s = ((t.worldTime % 24e3) + 24e3) % 24e3,
      i = t.settings.tipsSeen || (t.settings.tipsSeen = {}),
      tip = (e, s) => {
        i[e] ||
          this.shown.has(e) ||
          (this.shown.add(e), (i[e] = 1), t.saveSettings(), t.ui.pinMessage(s, 7e3, "#FFFF80"));
      };
    "survival" === t.mode &&
      (s > 11e3 && s < 13e3 && tip("dusk", "天快黑了：怪物晚上会出现，找个地方躲起来或者造个房子"),
      e.food <= 6 &&
        tip(
          "hungry",
          "饿了：吃点东西（选中食物，按住右键 / 按住屏幕）。饥饿值太低不能疾跑、不能回血",
        ),
      e.health <= 6 && tip("lowhp", "血量很低：先躲开怪物，吃饱了会慢慢回血"),
      obHas(t, /^cobblestone$/) &&
        tip("stone", "有了圆石：可以在工作台上做石镐、石剑，比木头的更好用"),
      obHas(t, /^raw_iron$/) && tip("iron", "挖到了铁：用熔炉把粗铁烧成铁锭，可以做铁工具和盔甲"));
  },
};
((() => {
  const t = Game.prototype.onPlayerDeath;
  Game.prototype.onPlayerDeath = function (e) {
    const s = t.call(this, e);
    return (
      this.settings.tips &&
        !(this.settings.tipsSeen || {}).death &&
        (((this.settings.tipsSeen || (this.settings.tipsSeen = {})).death = 1),
        this.saveSettings(),
        setTimeout(
          () =>
            this.ui.pinMessage(
              "死亡后东西会掉在原地：重生后屏幕上的标记会带你回去捡（5 分钟内）",
              9e3,
              "#FFFF80",
            ),
          1500,
        )),
      s
    );
  };
})(),
  (() => {
    const t = OptionsScreen.prototype.layout;
    OptionsScreen.prototype.layout = function () {
      t.call(this);
      const e = this.game.ui,
        s = this.game,
        i = s.settings;
      for (const t of this.widgets)
        ("皮肤自定义…" === t.label &&
          Object.assign(t, {
            enabled: !0,
            gold: !0,
            label: "皮肤和披风…",
            tip: null,
            onClick: () => s.ui.open(new WardrobeScreen(s, this)),
          }),
          "资源包…" === t.label &&
            Object.assign(t, {
              enabled: !0,
              label: "账号…",
              tip: ["登录、游戏名、识别码、解锁"],
              onClick: () => s.ui.open(new AccountScreen(s, this)),
            }));
      const n = Math.max(...this.widgets.filter((t) => t.y < e.h - 40).map((t) => t.y)) + 24;
      n < e.h - 50 &&
        this.widgets.push(
          {
            x: e.w / 2 - 155,
            y: n,
            w: 150,
            h: 20,
            label: () => "游戏提示：" + (i.tips ? "开" : "关"),
            tip: ["情景提示：天黑、饥饿、血量低、第一次死亡……"],
            onClick: () => {
              ((i.tips = !i.tips), s.saveSettings());
            },
          },
          {
            x: e.w / 2 + 5,
            y: n,
            w: 150,
            h: 20,
            label: "用户协议和隐私说明",
            onClick: () => s.ui.open(new AgreementScreen(s, () => s.ui.open(this), !0)),
          },
        );
    };
  })());
//# sourceURL=js/onboard.js
