"use strict";
const SPLASHES = [
  "也试试 Java 版！",
  "100% 纯手工打造！",
  "方块！",
  "在浏览器里运行！",
  "无需安装！",
  "还有苦力怕！",
  "挖矿与合成！",
  "WebGL2！",
  "平滑光照！",
  "流动的水！",
  "会爆炸的 TNT！",
  "自带昼夜循环！",
  "小心岩浆！",
  "钻石！",
  "羊毛有很多颜色！",
];
class ImportScreen extends MenuScreen {
  constructor(e, t, s) {
    (super(e, "导入存档"),
      (this.parent = t),
      (this.titleY = 20),
      (this.p = 0),
      (this.stats = null),
      (this.result = null),
      (this.error = null),
      VanillaImport.run(e, s, (e, t) => {
        ((this.p = e), (this.stats = t));
      }).then(
        (e) => {
          ((this.result = e), this.layout());
        },
        (e) => {
          (console.error(e), (this.error = String((e && e.message) || e)), this.layout());
        },
      ));
  }
  layout() {
    const e = this.game.ui,
      t = e.w / 2,
      s = this.game;
    ((this.widgets = []),
      this.result
        ? (this.widgets.push({
            x: t - 154,
            y: e.h - 40,
            w: 150,
            h: 20,
            label: "进入世界",
            onClick: () => s.loadWorld(this.result.meta.id),
          }),
          this.widgets.push({
            x: t + 4,
            y: e.h - 40,
            w: 150,
            h: 20,
            label: "返回",
            onClick: () => s.ui.open(new WorldListScreen(s)),
          }))
        : this.error &&
          this.widgets.push({
            x: t - 100,
            y: e.h - 40,
            w: 200,
            h: 20,
            label: "返回",
            onClick: () => s.ui.open(new WorldListScreen(s)),
          }));
  }
  drawExtra(e) {
    const t = e.ctx,
      s = e.w / 2;
    let i = 44;
    const line = (e, n = "#FFFFFF") => {
      (Font.center(t, e, s, i, n), (i += 11));
    };
    if (this.error)
      return (line("导入失败", "#FF5555"), (i += 4), void line(this.error, "#FFFFFF"));
    const n = this.result ? this.result.stats : this.stats;
    if (!this.result) {
      line("正在读取区块…");
      const e = 182,
        o = Math.floor(s - e / 2);
      return (
        (t.fillStyle = "#808080"),
        t.fillRect(o, i + 2, e, 3),
        (t.fillStyle = "#80FF80"),
        t.fillRect(o, i + 2, Math.floor(e * this.p), 3),
        (i += 12),
        void (n && line(`已导入 ${n.chunks} 个区块，区域文件 ${n.regions} 个`, "#A0A0A0"))
      );
    }
    const o = this.result.meta,
      l = { overworld: "主世界", nether: "下界", end: "末地" };
    (line(`“${o.name}” 导入完成`, "#55FF55"),
      line(`版本 ${o.imported.version}，种子 ${o.seed}`, "#A0A0A0"),
      line(
        "区块：" +
          Object.entries(n.perDim)
            .map(([e, t]) => `${l[e] || e} ${t}`)
            .join("，") +
          `；箱子和熔炉 ${n.containers} 个；生物和载具等 ${n.entities || 0} 个`,
      ),
      n.entitiesMissing &&
        n.entitiesMissing.length &&
        line(
          "本游戏还没有、没导入的实体：" +
            n.entitiesMissing
              .slice(0, 4)
              .map(([e, t]) => `${e} ×${t}`)
              .join("，"),
          "#A0A0A0",
        ),
      (n.partial || n.old || n.skipped) &&
        line(
          `未完成生成的区块 ${n.partial} 个（进入后由生成器补全）` +
            (n.old ? `，1.18 以前格式 ${n.old} 个` : "") +
            (n.skipped ? `，无法读取 ${n.skipped} 个` : ""),
          "#A0A0A0",
        ),
      n.substituted &&
        n.substituted.length &&
        (line(`本游戏还没有、以相近方块代替的：${n.substituted.length} 种`, "#FFFF55"),
        line(
          n.substituted
            .slice(0, 5)
            .map(([e, t]) => `${e} ×${t}`)
            .join("，"),
          "#A0A0A0",
        )),
      n.missing.length &&
        (line(`本游戏还没有、以空气代替的：${n.missing.length} 种`, "#FFFF55"),
        line(
          n.missing
            .slice(0, 5)
            .map(([e, t]) => `${e} ×${t}`)
            .join("，"),
          "#A0A0A0",
        )),
      (i += 4),
      line("没探索过的地方会按同一个种子生成", "#A0A0A0"));
  }
  onEsc() {
    (this.result || this.error) && this.game.ui.open(new WorldListScreen(this.game));
  }
}
class LoadingScreen extends MenuScreen {
  constructor(e, t) {
    (super(e, null),
      (this.text = t),
      (this.blurBg = !1),
      (this.bgDirt = !0),
      (this.pauses = !1),
      (this.queue = null));
  }
  setQueue(e) {
    const t = !!this.queue;
    ((this.queue = e
      ? { ...e, since: (this.queue && this.queue.since) || performance.now() }
      : null),
      t !== !!e && this.layout());
  }
  layout() {
    const e = this.game.ui,
      t = this.game,
      s = e.w / 2;
    this.widgets = this.queue
      ? [
          {
            x: s - 100,
            y: e.h / 2 + 60,
            w: 200,
            h: 20,
            label: "去公开房间（加入正在玩的）",
            onClick: () => {
              (t.leaveServer(), t.ui.open(new MultiplayerScreen(t, null)));
            },
          },
          {
            x: s - 100,
            y: e.h / 2 + 84,
            w: 200,
            h: 20,
            label: "取消排队",
            onClick: () => {
              t.leaveServer();
            },
          },
        ]
      : [];
  }
  drawExtra(e) {
    const t = e.ctx,
      s = this.game,
      i = this.queue;
    if (i) {
      (Font.center(t, "服务器上的房间已经满了，正在排队", e.w / 2, e.h / 2 - 30, "#FFFFFF"),
        Font.center(
          t,
          `你的房间排在第 ${i.pos} 位（一共 ${i.of} 个在等），有位置时会自动启动`,
          e.w / 2,
          e.h / 2 - 14,
          "#A0A0A0",
        ));
      const s = Math.floor((performance.now() - i.since) / 1e3);
      return (
        Font.center(
          t,
          `已经等了 ${Math.floor(s / 60)} 分 ${s % 60} 秒`,
          e.w / 2,
          e.h / 2 + 2,
          "#A0A0A0",
        ),
        void (
          s >= 120 &&
          Font.center(
            t,
            "等太久的话，可以先加入正在玩的公开房间，或者在「联机」里开本地房间",
            e.w / 2,
            e.h / 2 + 30,
            "#FFFF55",
          )
        )
      );
    }
    const n = this.text || "正在生成地形…";
    Font.center(t, n, e.w / 2, e.h / 2 - 20, "#FFFFFF");
    const o = s.loadProgress || 0,
      l = Math.floor(e.w / 2 - 91),
      a = Math.floor(e.h / 2);
    ((t.fillStyle = "#808080"),
      t.fillRect(l, a, 182, 3),
      (t.fillStyle = "#80FF80"),
      t.fillRect(l, a, Math.floor(182 * o), 3),
      Font.center(t, `区块: ${s.world ? s.world.chunks.size : 0}`, e.w / 2, a + 10, "#A0A0A0"));
  }
}
class TitleScreen extends MenuScreen {
  constructor(e) {
    (super(e, null),
      (this.blurBg = !1),
      (this.bgDim = 0),
      (this.splash = SPLASHES[(Math.random() * SPLASHES.length) | 0]));
  }
  layout() {
    const e = this.game.ui,
      t = e.w / 2,
      s = Math.floor(e.h / 4 + 48),
      i = this.game;
    ((this.widgets = [
      {
        x: t - 100,
        y: s,
        w: 200,
        h: 20,
        label: "单人游戏",
        onClick: () => singleGate(i, () => i.ui.open(new WorldListScreen(i)), this),
      },
      {
        x: t - 100,
        y: s + 24,
        w: 200,
        h: 20,
        label: "多人游戏",
        onClick: () => onlineGate(i, () => i.ui.open(new MultiplayerScreen(i, this)), this),
        tip: ["加入公开房间、用邀请码加入朋友的房间，或者自己开一个（4–10 人）"],
      },
      {
        x: t - 100,
        y: s + 48,
        w: 98,
        h: 20,
        label: "皮肤和装饰",
        gold: !0,
        tip: ["换皮肤、穿上原创披风、帽子和宠物"],
        onClick: () => i.ui.open(new WardrobeScreen(i, this)),
      },
      {
        x: t + 2,
        y: s + 48,
        w: 98,
        h: 20,
        label: "反馈问题",
        tip: ["遇到 bug、卡顿，或者有建议，发给我们"],
        onClick: () => i.ui.open(new FeedbackScreen(i, this, null)),
      },
      {
        x: t - 124,
        y: s + 84,
        w: 20,
        h: 20,
        icon: "icon_language",
        tip: ["游戏说明"],
        onClick: () => i.ui.open(new HelpScreen(i, this)),
      },
      {
        x: t - 100,
        y: s + 84,
        w: 98,
        h: 20,
        label: "选项…",
        onClick: () => i.ui.open(new OptionsScreen(i, this)),
      },
      { x: t + 2, y: s + 84, w: 98, h: 20, label: "退出游戏", onClick: () => quitGame(i) },
      fsSupported()
        ? {
            x: t + 104,
            y: s + 84,
            w: 20,
            h: 20,
            icon: "icon_accessibility",
            tip: ["全屏"],
            onClick: () => toggleFullscreen(),
          }
        : null,
    ].filter(Boolean)),
      Account.loggedIn
        ? this.widgets.push({
            x: 4,
            y: 4,
            w: Math.min(120, Font.width(Account.name) + 30),
            h: 18,
            label: fitText(Account.name, 110),
            tip: ["账号：游戏名、识别码、退出登录"],
            onClick: () => i.ui.open(new AccountScreen(i, this)),
          })
        : this.widgets.push({
            x: 4,
            y: 4,
            w: 60,
            h: 18,
            gold: !0,
            label: "登录",
            tip: ["登录后可以联机、云存档、换皮肤和披风"],
            onClick: () => i.ui.open(new LoginScreen(i, () => i.ui.open(new TitleScreen(i)))),
          }),
      Account.loggedIn &&
        !Account.allUnlocked() &&
        this.widgets.push({
          x: e.w - 112,
          y: 4,
          w: 108,
          h: 18,
          gold: !0,
          label: "解锁披风和联机",
          onClick: () => i.ui.open(new UnlockScreen(i, this)),
        }));
  }
  drawExtra(e) {
    const t = e.ctx,
      s = e.w,
      i = e.img.logo,
      n = e.img.edition,
      o = Math.floor(s / 2 - 128);
    ((t.imageSmoothingEnabled = !0),
      t.drawImage(i, 0, 0, i.width, (44 * i.height) / 64, o, 30, 256, 44),
      t.drawImage(n, 0, 0, n.width, (14 * n.height) / 16, o + 64, 67, 128, 14),
      (t.imageSmoothingEnabled = !1),
      t.save(),
      t.translate(s / 2 + 123, 69),
      t.rotate((-20 * Math.PI) / 180));
    let l = 1.8 - Math.abs(0.1 * Math.sin(((performance.now() % 1e3) / 1e3) * Math.PI * 2));
    if (
      ((l = (100 * l) / (Font.width(this.splash) + 32)),
      t.scale(l, l),
      Font.center(t, this.splash, 0, -8, "#FFFF00"),
      t.restore(),
      this.quitTip && performance.now() - this.quitTip < 6e3)
    ) {
      const i = "这里不能直接关闭网页，请用返回键或关闭标签页退出",
        n = Math.floor(e.h / 4 + 48) + ("undefined" != typeof Mods ? 120 : 108);
      ((t.globalAlpha = 0.6),
        (t.fillStyle = "#000"),
        t.fillRect(Math.floor(s / 2 - Font.width(i) / 2 - 4), n - 2, Font.width(i) + 8, 12),
        (t.globalAlpha = 1),
        Font.center(t, i, s / 2, n, "#FFFF55"));
    }
    const a = "土豆史诗 · 仅在 B站 Toy 平台发布";
    Font.draw(t, a, 2, e.h - 10, "#FFFFFF");
    let h = "独立制作 · 永久免费",
      r = e.h - 10;
    (Font.width(a) + Font.width(h) + 10 > e.w && (h = "永久免费"),
      Font.width(a) + Font.width(h) + 10 > e.w && (r = e.h - 20),
      Font.draw(t, h, e.w - Font.width(h) - 2, r, "#FFFFFF"));
  }
}
class WorldListScreen extends MenuScreen {
  constructor(e) {
    (super(e, "选择世界"),
      (this.titleY = 8),
      (this.worlds = null),
      (this.sel = -1),
      (this.scroll = 0),
      (this.filter = ""),
      (this.icons = {}),
      DB.listWorlds()
        .then((e) => {
          ((this.worlds = e), this.layout());
        })
        .catch((e) => {
          (console.error(e),
            (this.worlds = []),
            (this.loadErr = "读取存档失败: " + String((e && e.message) || e)),
            this.layout());
        }));
  }
  shown() {
    return (this.worlds || []).filter(
      (e) => !this.filter || e.name.toLowerCase().includes(this.filter.toLowerCase()),
    );
  }
  layout() {
    const e = this.game.ui,
      t = e.w / 2,
      s = this.game,
      i = this.shown(),
      n = this.sel >= 0 && !!i[this.sel];
    ((this.widgets = [
      {
        x: t - 154,
        y: e.h - 76,
        w: 150,
        h: 20,
        label: "导入存档（文件夹）",
        onClick: () => this.pick(!0),
        tip: ["选择存档的世界文件夹", "（里面有 level.dat）"],
      },
      {
        x: t + 4,
        y: e.h - 76,
        w: 150,
        h: 20,
        label: "导入存档（.zip）",
        onClick: () => this.pick(!1),
        tip: ["选择打包成 .zip 的世界存档", "手机上请用这个"],
      },
      {
        x: t - 154,
        y: e.h - 52,
        w: 150,
        h: 20,
        label: "进入选中的世界",
        enabled: n,
        onClick: () => this.play(),
      },
      {
        x: t + 4,
        y: e.h - 52,
        w: 150,
        h: 20,
        label: "创建新的世界",
        onClick: () => s.ui.open(new CreateWorldScreen(s, this)),
      },
      {
        x: t - 154,
        y: e.h - 28,
        w: 72,
        h: 20,
        label: "编辑",
        enabled: n,
        onClick: () => s.ui.open(new EditWorldScreen(s, this, i[this.sel])),
      },
      {
        x: t - 76,
        y: e.h - 28,
        w: 72,
        h: 20,
        label: "删除",
        enabled: n,
        onClick: () => this.del(),
      },
      {
        x: t + 4,
        y: e.h - 28,
        w: 72,
        h: 20,
        label: "重建",
        enabled: n,
        onClick: () => s.ui.open(new CreateWorldScreen(s, this, i[this.sel])),
      },
      { x: t + 82, y: e.h - 28, w: 72, h: 20, label: "取消", onClick: () => this.onEsc() },
    ]),
      (this.listTop = 48),
      (this.listBottom = e.h - 88),
      (this.rowW = 270),
      (this.search = { x: t - 100, y: 22, w: 200, h: 20 }),
      e.showInput(
        this.search.x + 4,
        this.search.y + 6,
        this.search.w - 8,
        10,
        this.filter,
        () => {
          this.sel >= 0 && this.play();
        },
        {
          onInput: (e) => {
            ((this.filter = e), (this.sel = -1), (this.scroll = 0), this.layout());
          },
          onEsc: () => this.onEsc(),
          max: 32,
        },
      ));
  }
  play() {
    const e = this.shown()[this.sel];
    e && (this.game.ui.hideInput(), this.game.loadWorld(e.id));
  }
  pick(e) {
    const t = document.createElement("input");
    ((t.type = "file"),
      e ? ((t.webkitdirectory = !0), (t.multiple = !0)) : (t.accept = ".zip,application/zip"),
      (t.onchange = () => {
        t.files &&
          t.files.length &&
          (this.game.ui.hideInput(), this.game.ui.open(new ImportScreen(this.game, this, t.files)));
      }),
      t.click());
  }
  del() {
    const e = this.shown()[this.sel];
    if (!e) return;
    const t = this.game;
    t.ui.open(
      new ConfirmScreen(
        t,
        "你确定要删除这个世界吗？",
        `“${e.name}”将会永久消失！（真的很久！）`,
        "删除",
        async (s) => {
          (s &&
            (await DB.deleteWorld(e.id), (this.worlds = await DB.listWorlds()), (this.sel = -1)),
            t.ui.open(this));
        },
      ),
    );
  }
  drawExtra(e) {
    const t = e.ctx,
      s = e.w / 2,
      i = this.listTop,
      n = this.listBottom;
    if (
      (e.listBackground(i, n),
      e.nine("text_field_hl", this.search.x, this.search.y, this.search.w, this.search.h, 1),
      e.input.value ||
        document.activeElement === e.input ||
        Font.draw(t, "搜索世界", this.search.x + 4, this.search.y + 6, "#707070"),
      "memory" === DB.backend &&
        Font.center(t, "注意：当前浏览器禁止本地存储，存档在关闭页面后会丢失", s, n + 2, "#FF5555"),
      !this.worlds)
    )
      return void Font.center(t, "加载世界列表中", s, i + 20, "#FFFFFF");
    this.loadErr && Font.center(t, fitText(this.loadErr, e.w - 8), s, i + 20, "#FF5555");
    const o = this.shown(),
      l = Math.floor(s - this.rowW / 2) + 2,
      a = Math.floor((n - i - 4) / 36);
    if (
      ((this.scroll = clamp(this.scroll, 0, Math.max(0, o.length - a))),
      t.save(),
      t.beginPath(),
      t.rect(0, i, e.w, n - i),
      t.clip(),
      o.slice(this.scroll, this.scroll + a + 1).forEach((s, o) => {
        const a = i + 4 + 36 * o;
        o + this.scroll === this.sel &&
          ((t.fillStyle = "#FFFFFF"),
          t.fillRect(l - 2, a - 2, this.rowW, 36),
          (t.fillStyle = "#000000"),
          t.fillRect(l - 1, a - 1, this.rowW - 2, 34));
        let h = this.icons[s.id];
        (s.icon && !h && ((h = this.icons[s.id] = new Image()), (h.src = s.icon)),
          (t.imageSmoothingEnabled = !0),
          t.drawImage(h && h.complete && h.naturalWidth ? h : e.img.unknown_server, l, a, 32, 32),
          (t.imageSmoothingEnabled = !1));
        (e.mouse.y >= Math.max(i, a - 2) &&
          e.mouse.y < Math.min(n, a + 34) &&
          e.mouse.x >= l - 2 &&
          e.mouse.x < l - 2 + this.rowW &&
          ((t.fillStyle = "rgba(144,144,144,0.627)"),
          t.fillRect(l, a, 32, 32),
          e.sprite(e.mouse.x - l < 32 ? "wl_join_hl" : "wl_join", l, a)),
          Font.draw(t, s.name, l + 35, a + 1, "#FFFFFF"));
        const r = new Date(s.lastPlayed),
          pad = (e) => String(e).padStart(2, "0");
        Font.draw(
          t,
          `${s.id} (${r.getFullYear()}/${pad(r.getMonth() + 1)}/${pad(r.getDate())} ${pad(r.getHours())}:${pad(r.getMinutes())})`,
          l + 35,
          a + 12,
          "#808080",
        );
        let c = l + 35;
        const part = (e, s) => {
          (Font.draw(t, e, c, a + 21, s), (c += Font.width(e)));
        };
        (s.hardcore
          ? part("极限模式", "#FF0000")
          : part(
              "creative" === s.mode ? "创造模式" : "spectator" === s.mode ? "旁观模式" : "生存模式",
              "#808080",
            ),
          (s.cheats ?? !0) && part(", 命令", "#808080"),
          part(", 26.2", "#808080"));
      }),
      t.restore(),
      !o.length && this.filter && Font.center(t, "找不到匹配的世界", s, i + 20, "#AAAAAA"),
      o.length > a)
    ) {
      const t = Math.floor(s + this.rowW / 2 + 4),
        l = n - i,
        h = clamp(Math.floor((l * l) / (36 * o.length + 4)), 32, l - 8),
        r = i + Math.floor(((l - h) * this.scroll) / Math.max(1, o.length - a));
      (e.nine("wscroller_bg", t, i, 6, l, 1), e.nine("wscroller", t, r, 6, h, 1));
    }
  }
  mouseDown(e, t, s, i) {
    const n = this.shown(),
      o = Math.floor(e.w / 2 - this.rowW / 2) + 2;
    if (
      this.worlds &&
      s >= this.listTop &&
      s < this.listBottom &&
      t >= o - 2 &&
      t < o - 2 + this.rowW
    ) {
      const e = Math.floor((s - this.listTop - 4 + 2) / 36) + this.scroll;
      if (e < n.length && e >= 0) {
        const s = performance.now();
        if (
          (Sound.init(),
          Sound.click(),
          t - o < 32 || (this.sel === e && s - (this.lastT || 0) < 250))
        )
          return ((this.sel = e), void this.play());
        ((this.sel = e), (this.lastT = s), this.layout());
      }
      return;
    }
    super.mouseDown(e, t, s, i);
  }
  wheel(e, t) {
    this.worlds && (this.scroll += Math.sign(t));
  }
  onEsc() {
    (this.game.ui.hideInput(), this.game.ui.open(new TitleScreen(this.game)));
  }
}
class ConfirmScreen extends MenuScreen {
  constructor(e, t, s, i, n) {
    (super(e, t), (this.titleY = 70), (this.message = s), (this.yesLabel = i), (this.cb = n));
  }
  layout() {
    const e = this.game.ui,
      t = e.w / 2,
      s = Math.floor(e.h / 6 + 96);
    this.widgets = [
      { x: t - 155, y: s, w: 150, h: 20, label: this.yesLabel, onClick: () => this.cb(!0) },
      { x: t + 5, y: s, w: 150, h: 20, label: "取消", onClick: () => this.cb(!1) },
    ];
  }
  drawExtra(e) {
    Font.center(e.ctx, this.message, e.w / 2, 90, "#FFFFFF");
  }
  onEsc() {
    this.cb(!1);
  }
}
class EditWorldScreen extends MenuScreen {
  constructor(e, t, s) {
    (super(e, "编辑世界"),
      (this.titleY = 15),
      (this.parent = t),
      (this.world = s),
      (this.name = s.name));
  }
  layout() {
    const e = this.game.ui,
      t = e.w / 2;
    this.field = { x: t - 100, y: 53, w: 200, h: 20 };
    const s = { enabled: !1, tip: ["网页版无法访问存档文件夹"] };
    ((this.widgets = [
      {
        x: t - 100,
        y: 77,
        w: 200,
        h: 20,
        label: "重置图标",
        enabled: !!this.world.icon,
        onClick: async () => {
          (delete this.world.icon,
            delete this.parent.icons[this.world.id],
            await DB.putWorld(this.world),
            this.layout());
        },
      },
      { x: t - 100, y: 101, w: 200, h: 20, label: "打开世界文件夹", ...s },
      { x: t - 100, y: 125, w: 200, h: 20, label: "进行备份", ...s },
      { x: t - 100, y: 149, w: 200, h: 20, label: "打开备份文件夹", ...s },
      { x: t - 100, y: 173, w: 200, h: 20, label: "优化世界", ...s },
      { x: t - 100, y: e.h - 27, w: 98, h: 20, label: "保存", onClick: () => this.save() },
      { x: t + 2, y: e.h - 27, w: 98, h: 20, label: "取消", onClick: () => this.back() },
    ]),
      e.showInput(
        this.field.x + 4,
        this.field.y + 6,
        this.field.w - 8,
        10,
        this.name,
        () => this.save(),
        {
          onInput: (e) => {
            this.name = e;
          },
          onEsc: () => this.back(),
          max: 32,
        },
      ));
  }
  async save() {
    ((this.world.name = this.name.trim() || this.world.name),
      await DB.putWorld(this.world),
      this.back());
  }
  back() {
    (this.game.ui.hideInput(), this.game.ui.open(this.parent));
  }
  drawExtra(e) {
    (Font.draw(e.ctx, "世界名称", this.field.x, 40, "#A0A0A0"),
      e.nine("text_field_hl", this.field.x, this.field.y, this.field.w, this.field.h, 1));
  }
  onEsc() {
    this.back();
  }
}
class CreateWorldScreen extends MenuScreen {
  constructor(e, t, s) {
    (super(e, null),
      (this.parent = t),
      (this.tab = 0),
      (this.from = s || null),
      (this.name = s ? s.name : "新的世界"),
      (this.seed = s ? String(s.seed) : ""),
      (this.mode = s
        ? s.hardcore
          ? "hardcore"
          : "creative" === s.mode
            ? "creative"
            : "survival"
        : "survival"),
      (this.flat = !!s && !!s.flat),
      (this.difficulty = s ? (s.difficulty ?? 2) : 2),
      (this.cheats = !!s && (s.cheats ?? !0)),
      (this.structures = !s || !1 !== s.structures),
      (this.bonus = !!s && !!s.bonus));
  }
  layout() {
    const e = this.game.ui,
      t = e.w / 2,
      s = Math.min(400, e.w) - 28,
      i = Math.floor(s / 3),
      n = Math.floor(t - (3 * i) / 2);
    this.tabs = ["游戏", "世界", "更多"].map((e, t) => ({
      x: n + t * i,
      y: 0,
      w: i,
      h: 24,
      label: e,
    }));
    const o = e.h - 33 - 24,
      top = (e) => 24 + Math.floor((o - e) / 6),
      l = [],
      a = {
        survival: ["生存", "探索未知的世界，尽情建造、收集、合成并与怪物战斗。"],
        hardcore: ["极限", "难度锁定为“困难”的生存模式，且死亡后无法重生。"],
        creative: ["创造", "无拘无束地探索创造。可以飞行，材料取之不尽，且不受怪物伤害。"],
      },
      h = [
        ["和平", "不会生成绝大多数敌对生物。饥饿值不会消耗，且生命值会自然恢复。"],
        ["简单", "敌对生物会生成，但伤害较低。生命值在饥饿值耗尽后最终会降至5颗心。"],
        ["普通", "敌对生物会生成，且伤害适中。生命值在饥饿值耗尽后最终会降至半颗心。"],
        ["困难", "敌对生物会生成，且伤害较高。饥饿值耗尽后最终会饿死。"],
      ],
      r = "hardcore" === this.mode;
    if (((this.field = null), (this.fieldLabel = null), 0 === this.tab)) {
      const s = top(117),
        i = t - 105;
      ((this.field = { x: t - 104, y: s + 13, w: 208, h: 20 }),
        (this.fieldLabel = ["世界名称", s]),
        l.push({
          x: i,
          y: s + 41,
          w: 210,
          h: 20,
          label: () => "游戏模式：" + a[this.mode][0],
          tip: [a[this.mode][1]],
          onClick: () => {
            ((this.mode = { survival: "hardcore", hardcore: "creative", creative: "survival" }[
              this.mode
            ]),
              (this.cheats = "creative" === this.mode),
              this.layout());
          },
        }),
        l.push({
          x: i,
          y: s + 69,
          w: 210,
          h: 20,
          label: () => "难度：" + (r ? "极限" : h[this.difficulty][0]),
          enabled: !r,
          tip: r ? null : [h[this.difficulty][1]],
          onClick: () => {
            ((this.difficulty = (this.difficulty + 1) % 4), this.layout());
          },
        }),
        l.push({
          x: i,
          y: s + 97,
          w: 210,
          h: 20,
          label: () => "允许命令：" + (this.cheats && !r ? "开" : "关"),
          enabled: !r,
          tip: ["例如/gamemode、/experience等命令"],
          onClick: () => {
            this.cheats = !this.cheats;
          },
        }),
        e.showInput(
          this.field.x + 4,
          this.field.y + 6,
          this.field.w - 8,
          10,
          this.name,
          () => this.create(),
          {
            onInput: (e) => {
              this.name = e;
            },
            onEsc: () => this.back(),
            max: 32,
          },
        ));
    } else if (1 === this.tab) {
      const s = top(117),
        i = t - 155;
      (l.push({
        x: i,
        y: s,
        w: 150,
        h: 20,
        label: () => "世界类型：" + (this.flat ? "超平坦" : "默认"),
        onClick: () => {
          this.flat = !this.flat;
        },
      }),
        l.push({ x: i + 160, y: s, w: 150, h: 20, label: "自定义", enabled: !1 }),
        (this.field = { x: t - 154, y: s + 41, w: 308, h: 20 }),
        (this.fieldLabel = ["世界生成器的种子", s + 28]),
        l.push({
          x: i,
          y: s + 69,
          w: 310,
          h: 20,
          label: () => "生成结构：" + (this.structures ? "开" : "关"),
          tip: ["村庄、沉船等"],
          onClick: () => {
            this.structures = !this.structures;
          },
        }),
        l.push({
          x: i,
          y: s + 97,
          w: 310,
          h: 20,
          label: () => "奖励箱：" + (this.bonus ? "开" : "关"),
          onClick: () => {
            this.bonus = !this.bonus;
          },
        }),
        e.showInput(
          this.field.x + 4,
          this.field.y + 6,
          this.field.w - 8,
          10,
          this.seed,
          () => this.create(),
          {
            onInput: (e) => {
              this.seed = e;
            },
            onEsc: () => this.back(),
            max: 32,
          },
        ));
    } else {
      const s = top(68),
        i = t - 105;
      e.hideInput();
      const n = { enabled: !1, tip: ["本复刻版暂不支持"] };
      (l.push({ x: i, y: s, w: 210, h: 20, label: "游戏规则", ...n }),
        l.push({ x: i, y: s + 24, w: 210, h: 20, label: "实验性内容", ...n }),
        l.push({ x: i, y: s + 48, w: 210, h: 20, label: "数据包", ...n }));
    }
    (l.push({
      x: t - 154,
      y: e.h - 27,
      w: 150,
      h: 20,
      label: "创建新的世界",
      onClick: () => this.create(),
    }),
      l.push({ x: t + 4, y: e.h - 27, w: 150, h: 20, label: "取消", onClick: () => this.back() }),
      (this.widgets = l));
  }
  back() {
    (this.game.ui.hideInput(), this.game.ui.open(this.parent));
  }
  create() {
    const e = this.game;
    e.ui.hideInput();
    const t = "hardcore" === this.mode;
    ((this.error = null),
      e
        .createWorld(
          this.name.trim() || "新的世界",
          this.seed.trim(),
          t ? "survival" : this.mode,
          this.flat,
          {
            hardcore: t,
            difficulty: t ? 3 : this.difficulty,
            cheats: !t && this.cheats,
            structures: this.structures,
            bonus: this.bonus,
          },
        )
        .catch((t) => {
          (console.error(t),
            (this.error = "创建世界失败: " + String((t && t.message) || t)),
            "play" !== e.state && "loading" !== e.state && e.ui.open(this));
        }));
  }
  drawExtra(e) {
    const t = e.ctx,
      s = this.tabs[0],
      i = this.tabs[2];
    (e.tile("tab_header_bg", 0, 0, e.w, 24),
      e.tile(e.sepName("header"), 0, 22, s.x, 2),
      e.tile(e.sepName("header"), i.x + i.w, 22, e.w - i.x - i.w, 2),
      this.tabs.forEach((s, i) => {
        const n = e.hit(s),
          o = i === this.tab;
        if (
          (e.nine(o ? (n ? "tab_sel_hl" : "tab_sel") : n ? "tab_hl" : "tab", s.x, s.y, s.w, s.h, 2),
          Font.center(t, s.label, s.x + s.w / 2, s.y + (o ? 8 : 10), o ? "#FFFFFF" : "#A0A0A0"),
          o)
        ) {
          const e = Math.min(Font.width(s.label), s.w - 4);
          ((t.fillStyle = "#FFFFFF"),
            t.fillRect(Math.floor(s.x + (s.w - e) / 2), s.y + s.h - 2, e, 1));
        }
      }),
      e.tile(e.sepName("footer"), 0, e.h - 35, e.w, 2),
      this.error && Font.center(t, fitText(this.error, e.w - 8), e.w / 2, e.h - 46, "#FF5555"),
      this.field &&
        (Font.draw(t, this.fieldLabel[0], this.field.x, this.fieldLabel[1], "#FFFFFF"),
        e.nine("text_field_hl", this.field.x, this.field.y, this.field.w, this.field.h, 1),
        1 !== this.tab ||
          e.input.value ||
          document.activeElement === e.input ||
          Font.draw(t, "留空以生成随机种子", this.field.x + 4, this.field.y + 6, "#707070")));
  }
  mouseDown(e, t, s, i) {
    for (let i = 0; i < this.tabs.length; i++)
      if (e.hit(this.tabs[i], t, s))
        return void (
          this.tab !== i && ((this.tab = i), this.layout(), Sound.init(), Sound.click())
        );
    super.mouseDown(e, t, s, i);
  }
  onEsc() {
    this.back();
  }
}
class OptionsScreen extends MenuScreen {
  constructor(e, t) {
    (super(e, "选项"), (this.parent = t), (this.pauses = "play" === e.state), (this.titleY = 12));
  }
  layout() {
    const e = this.game.ui,
      t = e.w / 2,
      s = this.game.settings,
      i = this.game,
      n = ["和平", "简单", "普通", "困难"],
      o = 61 + Math.floor((e.h - 33 - 61 - 116) / 2),
      sub = (e, s, n) => ({
        x: e % 2 ? t + 5 : t - 155,
        y: o + 24 * Math.floor(e / 2),
        w: 150,
        h: 20,
        label: s,
        enabled: !!n,
        tip: n ? null : ["本复刻版暂不支持"],
        onClick: () => n && i.ui.open(n()),
      });
    this.widgets = [
      {
        slider: !0,
        x: t - 155,
        y: 29,
        w: 150,
        h: 20,
        value: (s.fov - 30) / 80,
        label: () =>
          "视场角：" +
          (70 === Math.round(s.fov)
            ? "中"
            : 110 === Math.round(s.fov)
              ? "超广角"
              : Math.round(s.fov)),
        onChange: (e) => {
          ((s.fov = Math.round(30 + 80 * e)), i.applySettings(), i.saveSettings());
        },
      },
      "play" === i.state
        ? {
            x: t + 5,
            y: 29,
            w: 150,
            h: 20,
            label: () => "难度：" + (i.hardcore ? "极限" : n[i.difficulty]),
            enabled: !i.hardcore,
            onClick: () => {
              i.difficulty = (i.difficulty + 1) % 4;
            },
          }
        : { x: t + 5, y: 29, w: 150, h: 20, label: "联机…", enabled: !1 },
      sub(0, "皮肤自定义…", null),
      sub(1, "声音…", () => new OptionsListScreen(i, this, "声音选项", "sound")),
      sub(2, "视频设置…", () => new OptionsListScreen(i, this, "视频设置", "video")),
      sub(3, "控制…", () => new OptionsListScreen(i, this, "按键控制", "controls")),
      sub(4, "语言…", null),
      sub(5, "聊天设置…", null),
      sub(6, "资源包…", null),
      sub(7, "辅助功能设置…", () => new OptionsListScreen(i, this, "辅助功能设置", "access")),
      sub(8, "遥测数据…", () => new TelemetryScreen(i, this)),
      sub(9, "制作人员名单与致谢…", () => creditsRoll(i, this)),
      { x: t - 100, y: e.h - 27, w: 200, h: 20, label: "完成", onClick: () => this.done() },
    ];
  }
  done() {
    (this.game.saveSettings(), this.game.ui.open(this.parent));
  }
  onEsc() {
    this.done();
  }
}
function creditsRoll(e, t) {
  const s = new CreditsScreen(e, () => e.ui.open(t)),
    i = s.lines,
    n = i.findIndex((e) => "============" === e.t);
  return (
    n > 9 && (s.lines = [...i.slice(0, 9), ...i.slice(n - 1)]),
    (s.pauses = "play" === e.state),
    (s.onEsc = () => s.finish()),
    (s.mouseDown = () => s.finish()),
    s
  );
}
class OptionsListScreen extends MenuScreen {
  constructor(e, t, s, i) {
    (super(e, s),
      (this.parent = t),
      (this.page = i),
      (this.pauses = "play" === e.state),
      (this.titleY = 12),
      (this.scroll = 0));
  }
  options() {
    const e = this.game.settings,
      t = this.game,
      sl = (e, s, i, n) => ({
        slider: !0,
        wide: n,
        value: s,
        label: e,
        onChange: (e) => {
          (i(e), t.applySettings(), t.saveSettings());
        },
      }),
      bt = (e, s, i) => ({
        label: e,
        onClick: () => {
          (s(), t.applySettings(), t.saveSettings());
        },
        ...i,
      }),
      onoff = (e) => (e ? "开" : "关");
    if ("access" === this.page)
      return [
        sl(
          () =>
            "视场角效果：" +
            ((e.fovEffects ?? 1) > 0 ? Math.round(100 * (e.fovEffects ?? 1)) + "%" : "关"),
          e.fovEffects ?? 1,
          (t) => (e.fovEffects = Math.round(20 * t) / 20),
          !0,
        ),
      ];
    if ("sound" === this.page)
      return [
        sl(
          () => "主音量：" + (e.volume > 0 ? Math.round(100 * e.volume) + "%" : "关"),
          e.volume,
          (t) => (e.volume = t),
          !0,
        ),
        bt(
          () => "显示字幕：" + onoff(!!e.subtitles),
          () => (e.subtitles = !e.subtitles),
          { tip: ["在屏幕右下角用文字列出听到的声音和方向"] },
        ),
      ];
    const own = (t) => (s) => {
      ((e.preset = "custom"), t(s));
    };
    return [
      bt(
        () =>
          "画质预设：" +
          (PRESET_NAMES[e.preset] || "自定义") +
          ("auto" === e.preset && e.autoPreset ? "（" + PRESET_NAMES[e.autoPreset] + "）" : ""),
        () => {
          const s = ["auto", "low", "medium", "high", "ultra"];
          applyPreset(t, s[(s.indexOf(e.preset) + 1) % s.length]);
        },
        {
          tip: [
            "自动：按设备性能选择（" + TouchDevice.name + "）",
            "低 / 中 / 高 / 极高：渲染距离、分辨率、云、图形品质",
          ],
        },
      ),
      bt(
        () => "图形品质：" + ("fast" === e.graphics ? "流畅" : "高品质"),
        own(() => {
          ((e.graphics = "fast" === e.graphics ? "fancy" : "fast"), t.graphicsChanged());
        }),
        { tip: ["流畅：树叶不透明，相邻树叶之间的面不绘制", "省显存和显卡，森林里更流畅"] },
      ),
      bt(
        () =>
          "光影：" +
          FX_NAMES[e.shaders || 0] +
          (t.renderer.fx && !t.renderer.fx.ok ? "（不支持）" : ""),
        () => {
          t.renderer.fx &&
            t.renderer.fx.ok &&
            (e.shaders = ((e.shaders || 0) + 1) % FX_NAMES.length);
        },
        { tip: ["关 / 低 / 中 / 高 / 极限：实时阴影、水面反射、体积光等"] },
      ),
      bt(
        () => "渲染分辨率：" + Math.round(100 * e.resScale) + "%",
        own(() => {
          e.resScale = e.resScale >= 1 ? 0.5 : e.resScale + 0.25;
        }),
      ),
      sl(
        () => "渲染距离：" + e.renderDist + "个区块",
        (e.renderDist - 2) / 14,
        own((t) => (e.renderDist = Math.round(2 + 14 * t))),
        !0,
      ),
      sl(
        () =>
          "最大帧率：" +
          (e.maxFps > 0
            ? e.maxFps + " fps"
            : -1 !== e.maxFps && this.game.pacer && this.game.pacer.auto60
              ? "自动（60 fps）"
              : self.POTATO && this.game.pacer
                ? "跟随屏幕（" + this.game.pacer.hz + " Hz）"
                : "无限制"),
        e.maxFps > 0 ? (e.maxFps - 10) / 250 : 1,
        (t) => {
          const s = 10 * Math.round(25 * t) + 10;
          e.maxFps = s >= 260 ? (self.POTATO || -1 === e.maxFps ? -1 : 0) : s;
        },
      ),
      bt(
        () => "垂直同步：" + onoff(!1 !== e.vsync),
        () => (e.vsync = !1 === e.vsync),
        {
          tip: [
            "开：帧与显示器刷新同步，不撕裂",
            "关：帧率可超过刷新率（浏览器需带 --disable-gpu-vsync 启动才能显示出来）",
          ],
        },
      ),
      bt(
        () => "动态分辨率：" + onoff(e.dynRes),
        own(() => (e.dynRes = !e.dynRes)),
        { tip: ["显卡跟不上时自动降低渲染分辨率（最低 50%），恢复后再调回"] },
      ),
      bt(
        () => "云：" + (e.clouds ? "高品质" : "关"),
        own(() => (e.clouds = !e.clouds)),
      ),
      sl(
        () =>
          "亮度：" +
          (e.gamma < 0.01 ? "昏暗" : e.gamma > 0.99 ? "明亮" : Math.round(100 * e.gamma) + "%"),
        e.gamma,
        (t) => (e.gamma = t),
      ),
      bt(
        () => "界面尺寸：" + (e.guiScale || "自动"),
        () => {
          ((e.guiScale = (e.guiScale + 1) % 5), setTimeout(() => t.ui.resize(), 0));
        },
      ),
      fsSupported()
        ? bt(
            () => "全屏：" + onoff(!!fsElement()),
            () => toggleFullscreen(),
          )
        : bt("全屏：不支持", () => {}, { enabled: !1, tip: ["这个浏览器不支持网页全屏"] }),
      bt(
        () => "视角摇晃：" + onoff(e.bobbing),
        () => (e.bobbing = !e.bobbing),
      ),
      bt("平滑光照：开", () => {}, { enabled: !1 }),
      bt(
        "复制性能报告",
        () =>
          copyText(PerfMon.report(t, null, 0)).then((e) =>
            t.ui.message(
              e ? "性能报告已复制到剪贴板" : "无法写入剪贴板，报告已输出到浏览器控制台",
              "#FFFF55",
            ),
          ),
        {
          tip: ["复制最近 240 帧的帧时间、内存和设备信息", "游戏中按 F3 + L 记录 10 秒的完整报告"],
        },
      ),
    ];
  }
  layout() {
    const e = this.game.ui,
      t = e.w / 2;
    ((this.top = 33), (this.bottom = e.h - 33));
    const s = [],
      i = this.options();
    for (let e = 0; e < i.length;) {
      const n = i[e];
      if (n.wide) {
        (s.push([Object.assign(n, { x: t - 155, w: 310 })]), e++);
        continue;
      }
      const o = [Object.assign(n, { x: t - 155, w: 150 })];
      (i[e + 1] && !i[e + 1].wide && o.push(Object.assign(i[e + 1], { x: t + 5, w: 150 })),
        s.push(o),
        (e += o.length));
    }
    ((this.rows = s),
      (this.doneBtn = {
        x: t - 100,
        y: e.h - 27,
        w: 200,
        h: 20,
        label: "完成",
        onClick: () => this.back(),
      }),
      this.place());
  }
  place() {
    const e = [],
      t = Math.max(0, 25 * this.rows.length + 4 - (this.bottom - this.top));
    ((this.scroll = clamp(this.scroll, 0, t)),
      this.rows.forEach((t, s) => {
        const i = this.top + 4 - this.scroll + 25 * s + 2;
        for (const s of t)
          ((s.y = i), (s.h = 20), i >= this.top && i + 20 <= this.bottom && e.push(s));
      }),
      (this.widgets = [...e, this.doneBtn]));
  }
  back() {
    (this.game.saveSettings(), this.game.ui.open(this.parent));
  }
  drawExtra(e) {
    e.listBackground(this.top, this.bottom);
  }
  wheel(e, t) {
    ((this.scroll += 25 * Math.sign(t)), this.place());
  }
  onEsc() {
    this.back();
  }
}
class PauseScreen extends MenuScreen {
  constructor(e) {
    (super(e, "游戏菜单"), (this.pauses = !0), (this.titleY = 40));
  }
  layout() {
    const e = this.game.ui,
      t = e.w / 2,
      s = this.game,
      i = Math.floor((e.h - 166) / 4) + 50,
      n = !(!s.net || !s.net.room),
      o = n && (0 | s.net.opLevel) >= 2;
    this.widgets = [
      {
        x: t - 102,
        y: i,
        w: Companion.shown ? 150 : 204,
        h: 20,
        label: "回到游戏",
        onClick: () => s.ui.close(),
      },
      Companion.shown
        ? {
            x: t + 52,
            y: i,
            w: 50,
            h: 20,
            label: () => fitText(Companion.name, 44),
            tip: ["AI 伙伴的设置（和它聊天按 V）"],
            onClick: () => s.ui.open(new CompanionScreen(s, this)),
          }
        : null,
      {
        x: t - 102,
        y: i + 24,
        w: 98,
        h: 20,
        label: "进度",
        onClick: () => s.ui.open(new AdvancementsScreen(s, this)),
      },
      {
        x: t + 4,
        y: i + 24,
        w: 98,
        h: 20,
        label: "统计信息",
        onClick: () => s.ui.open(new StatsScreen(s, this)),
      },
      {
        x: t - 102,
        y: i + 48,
        w: 98,
        h: 20,
        label: "游戏说明",
        onClick: () => s.ui.open(new HelpScreen(s, this)),
      },
      {
        x: t + 4,
        y: i + 48,
        w: 98,
        h: 20,
        label: "反馈问题",
        tip: ["遇到 bug、卡顿，或者有建议，发给我们（会附上现在的画面）"],
        onClick: () => s.ui.open(new FeedbackScreen(s, this, feedbackShot(s))),
      },
      n && !o
        ? null
        : {
            x: o ? t - 102 : t + 4,
            y: o ? i + 96 : i + 72,
            w: o ? 204 : 98,
            h: 20,
            label: () => "模式：" + MODE_NAMES[s.mode],
            enabled: !!s.cheats || !!s.net,
            tip:
              s.cheats || s.net ? ["生存 → 创造 → 旁观（也可按 F3 + F4）"] : ["需要开启“允许命令”"],
            onClick: () => s.requestMode(MODE_NEXT[s.mode]),
          },
      {
        x: t - 102,
        y: i + 72,
        w: 98,
        h: 20,
        label: "选项…",
        onClick: () => s.ui.open(new OptionsScreen(s, this)),
      },
      s.net && s.net.room
        ? {
            x: t + 4,
            y: i + 72,
            w: 98,
            h: 20,
            label: "房间…",
            tip: ["邀请朋友、看在场的玩家；房主可以踢人、封禁、禁言"],
            onClick: () => s.ui.open(new RoomScreen(s, this)),
          }
        : null,
      {
        x: t - 102,
        y: i + (o ? 120 : 96),
        w: 204,
        h: 20,
        label: "保存并退回到标题屏幕",
        onClick: () => s.quitToTitle(),
      },
    ].filter(Boolean);
  }
  onEsc() {
    this.game.ui.close();
  }
}
const MODE_NAMES = { survival: "生存", creative: "创造", spectator: "旁观" },
  MODE_NEXT = { survival: "creative", creative: "spectator", spectator: "survival" };
class AdvancementsScreen extends MenuScreen {
  constructor(e, t) {
    (super(e, "进度"),
      (this.parent = t),
      (this.pauses = !0),
      (this.bgDim = 0.75),
      (this.titleY = 16));
  }
  layout() {
    const e = this.game.ui;
    this.widgets = [
      {
        x: e.w / 2 - 100,
        y: e.h - 28,
        w: 200,
        h: 20,
        label: "完成",
        onClick: () => this.game.ui.open(this.parent),
      },
    ];
  }
  drawExtra(e) {
    const t = e.ctx,
      s = Object.keys(ADVANCEMENTS),
      i = s.filter((e) => this.game.adv[e]).length;
    Font.center(t, `已完成 ${i} / ${s.length}`, e.w / 2, 28, "#AAAAAA");
    const n = e.w / 2 - 150,
      o = e.h - 32,
      l = Math.ceil(s.length / 2);
    ((this.maxScroll = Math.max(0, 20 * l + 4 - (o - 40))),
      (this.scroll = clamp(this.scroll || 0, 0, this.maxScroll)),
      t.save(),
      t.beginPath(),
      t.rect(0, 40, e.w, o - 40),
      t.clip(),
      s.forEach((s, i) => {
        const l = n + (i % 2) * 150,
          a = 42 + 20 * Math.floor(i / 2) - this.scroll;
        if (a > o || a + 18 < 40) return;
        const h = !!this.game.adv[s];
        ((t.fillStyle = h ? "rgba(40,120,40,0.6)" : "rgba(0,0,0,0.5)"),
          t.fillRect(l + 2, a, 146, 18),
          e.drawItem({ id: item(ADVANCEMENTS[s][1]), count: 1 }, l + 4, a + 1),
          Font.draw(t, ADVANCEMENTS[s][0], l + 24, a + 5, h ? "#FFFF55" : "#808080"));
      }),
      t.restore());
  }
  wheel(e, t) {
    this.scroll = clamp((this.scroll || 0) + 20 * Math.sign(t), 0, this.maxScroll || 0);
  }
  onEsc() {
    this.game.ui.open(this.parent);
  }
}
class StatsScreen extends MenuScreen {
  constructor(e, t) {
    (super(e, "统计信息"), (this.parent = t), (this.pauses = !0), (this.bgDim = 0.75));
  }
  layout() {
    const e = this.game.ui;
    this.widgets = [
      {
        x: e.w / 2 - 100,
        y: e.h - 28,
        w: 200,
        h: 20,
        label: "完成",
        onClick: () => this.game.ui.open(this.parent),
      },
    ];
  }
  drawExtra(e) {
    const t = this.game,
      s = t.stats,
      i = e.ctx;
    [
      ["游戏天数", Math.floor(t.worldTime / 24e3) + 1],
      ["放置的方块", s.placed],
      ["挖掘的方块", s.mined],
      ["击杀的生物", s.kills],
      ["经验等级", t.xpLevel()],
      ["世界种子", t.world.seed],
    ].forEach(([t, s], n) => {
      Font.draw(i, t, e.w / 2 - 100, 50 + 14 * n, "#FFFFFF");
      const o = String(s);
      Font.draw(i, o, e.w / 2 + 100 - Font.width(o), 50 + 14 * n, "#FFFF55");
    });
  }
  onEsc() {
    this.game.ui.open(this.parent);
  }
}
class DeathScreen extends MenuScreen {
  constructor(e) {
    (super(e, null),
      (this.blurBg = !1),
      (this.bgDim = 0),
      (this.pauses = !1),
      (this.t = performance.now()));
  }
  layout() {
    const e = this.game.ui,
      t = e.w / 2,
      s = Math.floor(e.h / 4 + 72),
      i = this.game,
      toTitle = () => {
        !i.hardcore || i.net || i.p2pGuest
          ? ((i.player.health = 20), (i.player.deathTime = 0), i.respawn(), i.quitToTitle())
          : i.quitToTitle();
      };
    this.widgets = i.hardcore
      ? [
          {
            x: t - 100,
            y: s,
            w: 200,
            h: 20,
            label: "旁观世界",
            onClick: () => {
              (i.respawn(), i.setMode("spectator", !0));
            },
          },
          { x: t - 100, y: s + 24, w: 200, h: 20, label: "标题屏幕", onClick: toTitle },
        ]
      : [
          { x: t - 100, y: s, w: 200, h: 20, label: "重生", onClick: () => i.respawn() },
          { x: t - 100, y: s + 24, w: 200, h: 20, label: "标题屏幕", onClick: toTitle },
        ];
  }
  draw(e) {
    const t = e.ctx,
      s = t.createLinearGradient(0, 0, 0, e.h);
    (s.addColorStop(0, "rgba(80,0,0,0.376)"),
      s.addColorStop(1, "rgba(128,48,48,0.627)"),
      (t.fillStyle = s),
      t.fillRect(0, 0, e.w, e.h),
      t.save(),
      t.scale(2, 2),
      Font.center(t, this.game.hardcore ? "游戏结束！" : "你死了！", e.w / 4, 30, "#FFFFFF"),
      t.restore(),
      Font.center(t, this.game.deathMsg || "", e.w / 2, 85, "#FFFFFF"));
    const i = "分数：",
      n = String(this.game.deathScore || 0),
      o = e.w / 2 - Font.width(i + n) / 2;
    (Font.draw(t, i, o, 100, "#FFFFFF"), Font.draw(t, n, o + Font.width(i), 100, "#FFFF55"));
    const l = performance.now() - this.t > 1e3;
    for (const t of this.widgets) ((t.enabled = l), e.button(t));
  }
}
class HelpScreen extends MenuScreen {
  constructor(e, t) {
    (super(e, "游戏说明"),
      (this.parent = t),
      (this.pauses = !0),
      (this.bgDim = 0.8),
      (this.bgDirt = t instanceof TitleScreen),
      (this.page = 0),
      (this.titleY = 10));
  }
  layout() {
    const e = this.game.ui,
      t = e.w / 2;
    this.widgets = [
      {
        x: t - 154,
        y: e.h - 26,
        w: 74,
        h: 20,
        label: "< 上一页",
        onClick: () => (this.page = Math.max(0, this.page - 1)),
      },
      {
        x: t - 76,
        y: e.h - 26,
        w: 152,
        h: 20,
        label: "完成",
        onClick: () => this.game.ui.open(this.parent),
      },
      {
        x: t + 80,
        y: e.h - 26,
        w: 74,
        h: 20,
        label: "下一页 >",
        onClick: () => (this.page = Math.min(HELP_PAGES.length - 1, this.page + 1)),
      },
    ];
  }
  drawExtra(e) {
    const t = e.ctx,
      s = HELP_PAGES[this.page];
    Font.center(t, `${s.title}  (${this.page + 1}/${HELP_PAGES.length})`, e.w / 2, 24, "#FFFF55");
    let i = 40;
    for (const n of s.lines) {
      if (i > e.h - 40) break;
      const [s, o] = n.split("|");
      (void 0 !== o
        ? (Font.draw(t, s, e.w / 2 - 150, i, "#FFFFA0"),
          Font.draw(t, o, e.w / 2 - 60, i, "#FFFFFF"))
        : Font.draw(t, s, e.w / 2 - 150, i, "#E0E0E0"),
        (i += 11));
    }
  }
  onEsc() {
    this.game.ui.open(this.parent);
  }
}
const HELP_PAGES = [
  {
    title: "基本操作",
    lines: [
      "W A S D|移动",
      "空格|跳跃 / 游泳上浮 / (创造) 双击切换飞行",
      "左 Shift|潜行（不会从边缘掉落）/ 飞行下降",
      "左 Ctrl 或 双击 W|疾跑",
      "鼠标移动|转动视角",
      "鼠标左键|挖掘方块 / 攻击生物（按住持续挖掘）",
      "鼠标右键|放置方块 / 使用物品 / 打开容器 / 吃东西 / 拉弓",
      "鼠标中键|选取方块",
      "滚轮 / 1-9|切换快捷栏",
      "E|打开物品栏",
      "Q|丢弃物品 (Ctrl+Q 丢弃一组)",
      "F1 / F3 / F5|隐藏界面 / 调试信息 / 切换视角",
      "T 或 /|打开聊天与命令",
      "Esc|游戏菜单（暂停）",
    ],
  },
  {
    title: "物品栏操作",
    lines: [
      "左键|拿起 / 放下整组物品",
      "右键|拿起一半 / 放下一个",
      "Shift + 左键|快速移动物品",
      "按住左键拖动|在多个格子之间平均分配",
      "按住右键拖动|每个格子放一个",
      "双击|收集同类物品",
      "悬停 + 数字键|与快捷栏交换",
      "悬停 + Q|丢弃物品",
      "",
      "创造模式物品栏：点击顶部标签切换分类，",
      "滚轮滚动；最后一个标签可以搜索物品。",
      "把物品放到右下角的 X 格可以删除。",
    ],
  },
  {
    title: "触屏操作",
    lines: [
      "（选项 → 控制… → 触屏操作；手机和平板默认开启）",
      "左下方向键|移动（按住上键时出现斜向键）",
      "方向键中间|潜行（点一下切换）",
      "跳跃键|跳跃 / 游泳上浮 / (创造) 双击切换飞行",
      "飞行时|跳跃键上升，下方按钮下降",
      "疾跑键 / 双击上键|疾跑",
      "在屏幕上拖动|转动视角",
      "轻点|放置方块 / 使用物品 / 攻击准星对准的生物",
      "按住不动|挖掘方块（手持食物、弓等则为使用）",
      "“互动”按钮|与准星对准的生物互动 / 交易",
      "点 / 按住快捷栏|选择 / 丢弃整组物品",
      "快捷栏右侧 …|打开物品栏",
      "物品栏里|点击=左键，长按=右键，双击=快速移动",
    ],
  },
  {
    title: "生存入门",
    lines: [
      "1. 徒手撸树获得原木，合成木板（在物品栏 2x2 合成格）",
      "2. 4 个木板合成工作台，右键打开 3x3 合成",
      "3. 木板竖放 2 个合成木棍，制作木镐",
      "4. 挖石头获得圆石，制作石镐、熔炉",
      "5. 煤炭 + 木棍合成火把，照亮洞穴防止怪物生成",
      "6. 用熔炉把粗铁冶炼成铁锭，制作铁镐与铁甲",
      "7. 铁镐可以挖掘钻石矿（在 Y<16 的深层）",
      "",
      "饥饿值不足时无法疾跑、不能回血，记得吃东西！",
      "夜晚会生成僵尸、骷髅、苦力怕和蜘蛛。",
      "摔落、溺水、岩浆、仙人掌都会造成伤害。",
      "按 Esc → 进度 查看你的成就目标。",
    ],
  },
  {
    title: "常用配方",
    lines: [
      "工作台|4 木板 (2x2)",
      "木棍|2 木板竖放",
      "镐|上排 3 材料 + 中间竖放 2 木棍",
      "斧 / 锹 / 剑 / 锄|同镐的摆法",
      "熔炉|8 圆石围一圈",
      "箱子|8 木板围一圈",
      "火把|煤炭/木炭 在 木棍 上方",
      "面包|3 小麦横排",
      "TNT|火药与沙子交错 (5 火药 + 4 沙子)",
      "床|3 羊毛 + 3 木板，夜晚右键睡觉跳过黑夜",
      "弓 / 箭|木棍+线 / 燧石+木棍+羽毛",
      "桶|3 铁锭 V 形；可装水和熔岩",
      "盔甲|皮革/铁/钻石，按身体部位摆成形状",
      "其他: 楼梯、台阶、门、梯子、书架、砖块…",
    ],
  },
  {
    title: "玩法机制",
    lines: [
      "• 平滑光照与环境光遮蔽，火把/荧石/熔岩发光",
      "• 真实的水与熔岩流动，水遇熔岩生成黑曜石/圆石",
      "• 沙子与沙砾会受重力下落",
      "• TNT 与苦力怕爆炸可以破坏地形并连锁引爆",
      "• 用锄头耕地、种小麦，骨粉催熟；树苗可以长成树",
      "• 用剪刀剪羊毛，用小麦/种子/胡萝卜引诱并繁殖动物",
      "• 熔炉冶炼矿石与烹饪食物，获得经验",
      "• 昼夜循环、月相、星空、云层、雨雪天气；床可跳过夜晚",
      "• 多种生物群系：平原、森林、桦木林、针叶林、",
      "  雪原、沙漠、山地、海洋、河流、沙滩",
      "• 世界自动保存，可在主菜单管理多个存档",
      "• 三个维度：主世界、下界、末地（各自独立保存）",
      "• 立体音效（声音来自对应方向和距离）",
      "• 两个箱子并排放置会合成大型箱子（潜行放置则不合并）",
      "• 选项 → 光影：关 / 低 / 中 / 高 / 极限（实时阴影、水面反射等）",
    ],
  },
  {
    title: "通关路线",
    lines: [
      "1. 准备铁装备、弓箭、食物，挖到钻石做钻石镐",
      "2. 用钻石镐挖 10 块以上黑曜石（水浇在熔岩源上）",
      "3. 黑曜石搭 4x5 门框，打火石点燃 → 进入下界",
      "4. 在下界找到下界要塞（暗红色砖块的桥与走廊）",
      "5. 击杀烈焰人获得烈焰棒 → 合成烈焰粉",
      "6. 击杀末影人获得末影珍珠（别盯着它的眼睛看！）",
      "7. 末影珍珠 + 烈焰粉 = 末影之眼（准备 12 个以上）",
      "8. 回主世界向空中扔末影之眼，它会飞向要塞方向",
      "9. 在眼睛掉落处往下挖，找到要塞里的末地传送门",
      "10. 把末影之眼放进 12 个框架，跳进传送门",
      "11. 用弓箭射掉黑曜石柱顶的末地水晶（会治疗末影龙）",
      "12. 末影龙停在中央传送门上时攻击它的头部",
      "13. 击败末影龙后跳进返回传送门 → 终末之诗 → 通关！",
    ],
  },
  {
    title: "下界与末地",
    lines: [
      "• 下界：没有昼夜和水，水会蒸发，床会爆炸",
      "  坐标与主世界 1:8 对应，传送门会自动建造或连接",
      "• 恶魂：远程发射火球，用剑或拳头可以把火球打回去",
      "• 烈焰人：三连发小火球，会点燃你；要塞里有刷怪笼",
      "• 僵尸猪灵：中立，攻击一只会让附近的同伴一起围攻",
      "• 岩浆怪：会分裂；末影人：直视会激怒，遇水瞬移",
      "• 末影珍珠：右键投掷后传送到落点，受到 5 点伤害",
      "• 末地：床同样会爆炸；掉进虚空会死亡",
      "• 末影龙 200 生命值：盘旋、俯冲、喷射龙息火球，",
      "  停在传送门上时喷吐龙息（站在紫雾里会持续掉血）",
      "• 头部受到全额伤害，身体和翅膀只受到约 1/4 伤害",
      "• 末地水晶爆炸威力很大，不要近战打它！",
    ],
  },
  {
    title: "村庄与结构",
    lines: [
      "• 标准地形的世界会生成结构：五种风格的村庄、",
      "  掠夺者前哨站、古城、试炼密室、古迹废墟、沙漠神殿、",
      "  丛林神庙、沼泽小屋、雪屋、沉船、海底废墟、",
      "  废弃传送门、废弃矿井、埋藏的宝藏；下界有堡垒遗迹、",
      "  下界要塞与下界化石",
      "• 结构里的箱子按战利品表生成物品",
      "• 无业村民会认领附近的工作站（堆肥桶→农民、",
      "  讲台→图书管理员、高炉→盔甲匠…）",
      "• 右键有职业的村民打开交易界面：点左侧的交易，",
      "  材料会自动放好，取走右侧物品即完成交易",
      "• 交易让村民升级（新手→大师）并解锁新交易",
      "• 铁傀儡守护村庄，会攻击附近的敌对生物",
      "• /locate village 查找最近的村庄（或其他结构名）",
    ],
  },
  {
    title: "命令 (按 T 或 /)",
    lines: [
      "/gamemode creative|survival|切换游戏模式",
      "/time set day|night|noon|<数值>|设置时间",
      "/weather clear|rain|设置天气",
      "/give <物品英文名> [数量]|给予物品，如 /give ender_eye 12",
      "/tp <x> <y> <z>|传送",
      "/summon <生物>|生成生物，如 blaze ghast ender_dragon",
      "/kill|自杀",
      "/kill @e[type=<生物>]|清除指定实体，如 ender_dragon",
      "/locate <结构>|查找结构，如 village stronghold fortress",
      "/tpdim overworld|nether|end|直接前往某个维度",
      "/spawnpoint|设置重生点为当前位置",
      "/seed|显示世界种子",
      "/clear|清空物品栏",
      "/xp <数量>|获得经验",
    ],
  },
];
class ChatScreen extends MenuScreen {
  constructor(e, t = "") {
    (super(e, null),
      (this.blurBg = !1),
      (this.bgDim = 0),
      (this.isChat = !0),
      (this.prefill = t),
      (this.hist = e.chatHistory || (e.chatHistory = [])),
      (this.hi = this.hist.length),
      (e.ui.chatOff = 0));
  }
  wheel(e, t) {
    ((e.chatOff = clamp(
      (e.chatOff || 0) - Math.sign(t) * (e.wheelShift ? 1 : 7),
      0,
      Math.max(0, e.chatRowCount() - 20),
    )),
      (e.wheelShift = !1));
  }
  layout() {
    const e = this.game.ui,
      send = (t) => {
        (e.close(), t.trim() && (this.hist.push(t), runCommand(this.game, t.trim())));
      },
      t = navigator.maxTouchPoints > 0 || ("function" == typeof touchOn && touchOn(this.game)),
      s = t ? 34 : 0;
    this.widgets = t
      ? [
          {
            x: e.w - 2 - s,
            y: e.h - 15,
            w: s,
            h: 14,
            label: "发送",
            onClick: () => send(e.input.value),
          },
        ]
      : [];
    const i = this.shownOnce && "block" === e.input.style.display ? e.input.value : this.prefill;
    ((this.shownOnce = !0),
      e.showInput(2, e.h - 14, e.w - 4 - (s ? s + 2 : 0), 12, i, send, {
        onEsc: () => e.close(),
        max: 256,
        enter: "send",
      }));
    const n = e.input,
      o = n.onkeydown;
    n.onkeydown = (e) => {
      ("ArrowUp" === e.key && this.hi > 0
        ? (this.hi--, (n.value = this.hist[this.hi]), e.preventDefault())
        : "ArrowDown" === e.key
          ? ((this.hi = Math.min(this.hist.length, this.hi + 1)),
            (n.value = this.hist[this.hi] || ""),
            e.preventDefault())
          : "Tab" === e.key && (e.preventDefault(), this.complete(n)),
        o(e));
    };
  }
  complete(e) {
    const t = e.value,
      s = t.split(" ");
    if ("/give" === s[0] && 2 === s.length) {
      const t = Object.keys(ITEM_KEY).filter((e) => e.startsWith(s[1]));
      t.length && (e.value = "/give " + t[0]);
    } else if ("/summon" === s[0] && 2 === s.length) {
      const t = Object.keys(MOB_TYPES).filter((e) => e.startsWith(s[1]));
      t.length && (e.value = "/summon " + t[0]);
    } else if (1 === s.length) {
      const s = [
        "/gamemode",
        "/time",
        "/weather",
        "/give",
        "/tp",
        "/summon",
        "/kill",
        "/locate",
        "/tpdim",
        "/spawnpoint",
        "/seed",
        "/clear",
        "/xp",
        "/help",
      ].filter((e) => e.startsWith(t));
      s.length && (e.value = s[0] + " ");
    }
  }
  draw(e) {
    const t = e.ctx,
      s = this.widgets[0];
    ((t.fillStyle = "rgba(0,0,0,0.5)"),
      t.fillRect(2, e.h - 14, e.w - 4 - (s ? s.w + 2 : 0), 12),
      s && e.button(s));
  }
}
function cmdTidy(e) {
  if (!e.startsWith("/")) return e;
  let t = "",
    s = null;
  for (const i of e.trim())
    s
      ? ((t += i), i === s && (s = null))
      : '"' !== i && "'" !== i
        ? /\s/.test(i)
          ? t.endsWith(" ") || (t += " ")
          : (t += i)
        : ((s = i), (t += i));
  return t.trim();
}
function runCommand(e, t) {
  if (((t = cmdTidy(t)), e.net)) return void e.net.chat(t);
  const s = e.player,
    i = e.ui;
  if (!t.startsWith("/")) return void i.message("<玩家> " + t);
  if ("function" == typeof cmdExec && !/^\/(locate|tpdim|dimension)\b/.test(t))
    return void cmdExec(e, t);
  const [n, ...o] = t.slice(1).split(/\s+/),
    err = (e) => i.message(e, "#FF5555");
  if (!e.cheats && !["help", "seed", "me", "msg", "tell", "w", "list", "trigger"].includes(n))
    return err("未知或不完整的命令，错误见下\n…/" + n + "<--[此处]");
  try {
    switch (n) {
      case "help":
        i.message(
          "可用命令: /gamemode /time /weather /give /tp /summon /kill [@e[type=…]] /locate /tpdim /spawnpoint /seed /clear /xp",
          "#FFFF55",
        );
        break;
      case "gamemode":
      case "gm": {
        const t = {
          creative: "creative",
          c: "creative",
          1: "creative",
          survival: "survival",
          s: "survival",
          0: "survival",
          spectator: "spectator",
          sp: "spectator",
          3: "spectator",
        }[o[0]];
        if (!t) return err("用法: /gamemode creative|survival|spectator");
        e.setMode(t);
        break;
      }
      case "time":
        if ("set" === o[0] || "add" === o[0]) {
          let t =
            { day: 1e3, noon: 6e3, night: 13e3, midnight: 18e3, sunrise: 23e3, sunset: 12e3 }[
              o[1]
            ] ?? parseInt(o[1]);
          if (isNaN(t)) return err("用法: /time set day|night|noon|midnight|<数值>");
          ("set" === o[0]
            ? (e.worldTime = 24e3 * Math.floor(e.worldTime / 24e3) + t)
            : (e.worldTime += t),
            i.message("时间已设置为 " + t, "#AAAAAA"));
        } else i.message("当前时间: " + e.dayTime(), "#AAAAAA");
        break;
      case "weather":
        if ("clear" === o[0]) ((e.rainTarget = 0), (e.weather = 0), (e.weatherTimer = 24e3));
        else {
          if ("rain" !== o[0] && "thunder" !== o[0]) return err("用法: /weather clear|rain");
          ((e.rainTarget = 1), (e.weather = 1), (e.weatherTimer = 12e3));
        }
        i.message("天气已更改", "#AAAAAA");
        break;
      case "give": {
        const t = (o[0] || "").replace("minecraft:", ""),
          n = ITEM_KEY[t];
        if (void 0 === n) return err("未知物品: " + t);
        const l = Math.max(1, Math.min(2304, parseInt(o[1]) || 1));
        let a = l;
        for (; a > 0;) {
          const t = Math.min(a, maxStack(n)),
            i = s.inv.add({ id: n, count: t, dmg: 0 });
          (i && e.dropFromPlayer({ id: n, count: i, dmg: 0 }), (a -= t));
        }
        i.message(`已将 ${l} 个 [${ITEMS[n].cn}] 给予玩家`, "#AAAAAA");
        break;
      }
      case "tp": {
        const t = o.map((t, i) =>
          t.startsWith("~")
            ? s.pos[i] + (parseFloat(t.slice(1)) || 0)
            : parseFloat(t) - ((1 === i && e.world.minY) || 0),
        );
        if (t.length < 3 || t.some(isNaN)) return err("用法: /tp <x> <y> <z>");
        ((s.pos = [t[0], t[1], t[2]]),
          (s.prev = [...s.pos]),
          (s.vel = [0, 0, 0]),
          (s.fallDist = 0),
          i.message(
            `已传送至 ${t.map((t, s) => (t + ((1 === s && e.world.minY) || 0)).toFixed(1)).join(", ")}`,
            "#AAAAAA",
          ));
        break;
      }
      case "summon": {
        const t = (o[0] || "").replace("minecraft:", "");
        if ("tnt" === t) {
          e.addEntity(new PrimedTNT(e, Math.floor(s.pos[0]), s.pos[1], Math.floor(s.pos[2])));
          break;
        }
        if (!MOB_TYPES[t] && "ender_dragon" !== t)
          return err(
            "未知生物: " + t + "（可用: " + Object.keys(MOB_TYPES).join(" ") + " ender_dragon）",
          );
        const n = e.lookDir();
        if ("ender_dragon" === t) {
          (e.addEntity(
            new EnderDragon(e, s.pos[0] + 20 * n[0], s.pos[1] + 15, s.pos[2] + 20 * n[2]),
          ),
            i.message("已生成 末影龙", "#AAAAAA"));
          break;
        }
        const l = createMob(e, t, s.pos[0] + 3 * n[0], s.pos[1] + 0.5, s.pos[2] + 3 * n[2]);
        ((l.persistent = !0), e.addEntity(l), i.message("已生成 " + MOB_TYPES[t].cn, "#AAAAAA"));
        break;
      }
      case "kill": {
        const t = o.join("").replace(/\s/g, "");
        if (t.startsWith("@e")) {
          const s = t.match(/type=(?:minecraft:)?([a-z_]+)/);
          let n = 0;
          for (const t of e.entities)
            t.dead ||
              (s && t.type !== s[1]) ||
              ((s || t instanceof Living || t instanceof ItemEntity || t.hittable) &&
                (t instanceof EnderDragon
                  ? 0 === t.deathTime &&
                    ((t.health = 0),
                    (t.deathTime = 1),
                    Sound.ev("entity.ender_dragon.death", t.pos, 10, 1),
                    n++)
                  : t instanceof EndCrystal
                    ? ((t.dead = !0), n++)
                    : t instanceof Living
                      ? 0 === t.deathTime && ((t.health = 0), t.die({ type: "void" }), n++)
                      : ((t.dead = !0), n++)));
          i.message(n ? `已清除 ${n} 个实体` : "没有找到匹配的实体", n ? "#AAAAAA" : "#FF5555");
          break;
        }
        "creative" === e.mode
          ? ((s.health = 0), s.die({ type: "void" }))
          : s.hurt(1e3, { type: "void" });
        break;
      }
      case "locate": {
        const t = ("structure" === o[0] ? o[1] : o[0]) || "";
        if (t.includes("stronghold")) {
          const t = e.nearestStronghold();
          if (!t) return err("该维度没有要塞");
          i.message(
            `最近的要塞位于 [${t.x}, ~, ${t.z}]（距离 ${Math.round(Math.hypot(t.x - s.pos[0], t.z - s.pos[2]))} 格）`,
            "#55FF55",
          );
        } else if (t.includes("fortress") && !e.world.gen2) {
          if ("nether" !== e.dim) return err("下界要塞只存在于下界");
          const t = e.world.nearestFortress(s.pos[0], s.pos[2]);
          if (!t) return err("附近没有下界要塞");
          i.message(
            `最近的下界要塞位于 [${t.x}, ${t.y}, ${t.z}]（距离 ${Math.round(Math.hypot(t.x - s.pos[0], t.z - s.pos[2]))} 格）`,
            "#55FF55",
          );
        } else {
          if (!(t && e.world.gen2 && e.genPool))
            return err("用法: /locate stronghold|fortress|village|bastion_remnant|...");
          {
            const n = t.replace("minecraft:", "");
            (i.message("正在查找 " + n + " ...", "#AAAAAA"),
              e.genPool.request(
                {
                  type: "locate",
                  name: n,
                  cx: Math.floor(s.pos[0]) >> 4,
                  cz: Math.floor(s.pos[2]) >> 4,
                  dim: e.dim,
                },
                (t) => {
                  t.r
                    ? ((e.lastLocate = t.r),
                      i.message(
                        `最近的 ${t.r.name} 位于 [${t.r.x}, ~, ${t.r.z}]（距离 ${Math.round(t.r.d)} 格）`,
                        "#55FF55",
                      ))
                    : i.message("附近找不到 " + n, "#FF5555");
                },
              ));
          }
        }
        break;
      }
      case "tpdim":
      case "dimension": {
        const t = {
          overworld: "overworld",
          nether: "nether",
          the_nether: "nether",
          end: "end",
          the_end: "end",
        }[(o[0] || "").replace("minecraft:", "")];
        if (!t) return err("用法: /tpdim overworld|nether|end");
        if (t === e.dim) return err("你已经在这个维度了");
        if ("end" === t) {
          e.enterEndPortal();
          break;
        }
        if ("nether" === t || "nether" === e.dim) {
          e.useNetherPortal();
          break;
        }
        e.leaveEnd();
        break;
      }
      case "spawnpoint":
        ((s.spawn = [Math.floor(s.pos[0]), Math.floor(s.pos[1]), Math.floor(s.pos[2])]),
          (s.bedSpawn = !1),
          i.message("已设置重生点", "#AAAAAA"));
        break;
      case "seed":
        i.message("种子: [" + (e.worldMeta ? e.worldMeta.seed : e.world.seed) + "]", "#FFFFFF");
        break;
      case "clear":
        (s.inv.slots.fill(null), i.message("已清空物品栏", "#AAAAAA"));
        break;
      case "xp":
        e.addXp(parseInt(o[0]) || 0);
        break;
      default:
        err("未知命令。输入 /help 查看帮助");
    }
  } catch (e) {
    err("命令出错: " + e.message);
  }
}
async function quitGame(e) {
  const t = e.ui.screen;
  fsElement() && fsExit();
  try {
    "undefined" != typeof Toy &&
      (await Promise.race([Toy.inToy(), new Promise((e) => setTimeout(() => e(!1), 1500))])) &&
      (await Promise.race([Toy.closeBrowser(), new Promise((e) => setTimeout(e, 1500))]));
  } catch (e) {}
  try {
    window.close();
  } catch (e) {}
  setTimeout(() => {
    !document.hidden && e.ui.screen === t && t && (t.quitTip = performance.now());
  }, 600);
}
((() => {
  const e = Game.prototype.startTitle;
  Game.prototype.startTitle = function (...t) {
    return (this.ui && ((this.ui.chat.length = 0), (this.ui.chatOff = 0)), e.apply(this, t));
  };
})(),
  (Game.prototype.setMode = function (e, t) {
    const s = this.player,
      i = this.mode;
    if ((e !== i && (this.prevMode = i), (this.mode = e), "spectator" === e))
      ((s.flying = !0), (s.noClip = !0), "spectator" !== i && (s.vel[1] = 0));
    else {
      if ("spectator" === i && s.noClip) {
        const e = s.box(),
          t = blockBoxes(this.world, e[0], e[1], e[2], e[3], e[4], e[5], [], s);
        let i = e[1];
        for (const s of t)
          e[0] < s[3] &&
            e[3] > s[0] &&
            e[1] < s[4] &&
            e[4] > s[1] &&
            e[2] < s[5] &&
            e[5] > s[2] &&
            (i = Math.max(i, s[4]));
        if (i > e[1] && i - e[1] < 0.5) {
          const e = s.pos[1];
          ((s.pos[1] = i),
            s.collides(s.box())
              ? (s.pos[1] = e)
              : ((s.prev[1] = i), (s.vel[1] = 0), (s.fallDist = 0)));
        }
      }
      ((s.noClip = !1),
        "survival" === e && (s.flying = !1),
        "spectator" === i && "creative" === e && (s.flying = !0));
    }
    t ||
      this.ui.message(
        "已将自己的游戏模式设置为" +
          { survival: "生存模式", creative: "创造模式", spectator: "旁观模式" }[e],
        "#AAAAAA",
      );
  }));
const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
function fsSupported() {
  const e = document.documentElement;
  return (
    ("undefined" == typeof IOS_WEBGL || !IOS_WEBGL) &&
    !(!e.requestFullscreen && !e.webkitRequestFullscreen) &&
    !1 !== (document.fullscreenEnabled ?? document.webkitFullscreenEnabled)
  );
}
function fsExit() {
  const e = document.exitFullscreen || document.webkitExitFullscreen;
  try {
    const t = e && e.call(document);
    t && t.catch && t.catch(() => {});
  } catch (e) {}
}
function toggleFullscreen() {
  if (fsElement()) return void fsExit();
  const e = document.documentElement,
    t = e.requestFullscreen || e.webkitRequestFullscreen,
    no = () => {
      "undefined" != typeof game &&
        game.ui &&
        game.ui.message("这个浏览器不支持网页全屏", "#FFFF55");
    };
  if (!t || !fsSupported()) return void no();
  const lock = () => {
    navigator.keyboard &&
      navigator.keyboard.lock &&
      navigator.keyboard
        .lock(
          self.POTATO
            ? [
                "KeyW",
                "KeyA",
                "KeyS",
                "KeyD",
                "KeyT",
                "KeyN",
                "KeyR",
                "KeyQ",
                "KeyE",
                "KeyF",
                "KeyB",
                "Tab",
                "Digit1",
                "Digit2",
                "Digit3",
                "Digit4",
                "Digit5",
                "Escape",
              ]
            : ["KeyW", "KeyA", "KeyS", "KeyD", "Escape"],
        )
        .catch(() => {});
  };
  try {
    const s = t.call(e);
    s && s.then && s.then(lock, () => {});
  } catch (e) {
    no();
  }
}
//# sourceURL=js/screens.js
