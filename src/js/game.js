"use strict";
const IOS_WEBGL =
    "undefined" != typeof navigator &&
    (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)),
  WEBKIT_GL =
    IOS_WEBGL ||
    ("undefined" != typeof navigator &&
      /Macintosh/.test(navigator.userAgent) &&
      /Version\/[\d.]+.*Safari\//.test(navigator.userAgent) &&
      !/Chrome|Chromium|Edg|OPR|Firefox/.test(navigator.userAgent)),
  ADVANCEMENTS = {
    wood: ["获得木头", "oak_log"],
    crafting_table: ["这是？工作台！", "crafting_table"],
    pickaxe: ["采矿时间到！", "wooden_pickaxe"],
    stone_pickaxe: ["获得升级", "stone_pickaxe"],
    furnace: ["热门话题", "furnace"],
    iron: ["来硬的", "iron_ingot"],
    diamond: ["钻石！", "diamond"],
    bread: ["烤面包", "bread"],
    kill: ["怪物猎人", "iron_sword"],
    armor: ["整装上阵", "iron_chestplate"],
    tnt: ["轰隆隆！", "tnt"],
    deep: ["深入地底", "deepslate"],
    night: ["活过第一夜", "torch"],
    build: ["建筑师", "bricks"],
    farm: ["开始耕作", "wheat"],
    cook: ["美味佳肴", "cooked_beef"],
    bow: ["狙击手", "bow"],
    sleep: ["甜蜜的梦", "red_bed"],
  },
  TUTORIAL = [
    {
      title: "移动",
      text: "使用 W A S D 键四处走走",
      touch: "用左下角的摇杆四处走走",
      icon: "grass_block",
      done: (t) => t.tutStat.moved > 8,
    },
    {
      title: "获取木头",
      text: "对着树干按住鼠标左键",
      touch: "准星对准树干，按住右下的攻击按钮",
      icon: "oak_log",
      done: (t) => t.adv.wood,
    },
    {
      title: "打开物品栏",
      text: "按 E 键打开物品栏",
      touch: "点快捷栏右侧的 … 按钮",
      icon: "chest",
      done: (t) => t.tutStat.inv,
    },
    {
      title: "合成木板",
      text: "用左侧配方书或 2x2 合成格",
      icon: "oak_planks",
      done: (t) => t.tutStat.planks,
    },
    {
      title: "制作工作台",
      text: "用 4 个木板合成工作台",
      icon: "crafting_table",
      done: (t) => t.adv.crafting_table,
    },
    {
      title: "制作木镐",
      text: "放下工作台，右键打开它",
      touch: "放下工作台，对准它点使用按钮",
      icon: "wooden_pickaxe",
      done: (t) => t.adv.pickaxe,
    },
  ],
  CROP_TICK =
    /^(carrots|potatoes|beetroots|torchflower_crop|pitcher_crop|melon_stem|pumpkin_stem|sweet_berry_bush)$/,
  VIS_NONE = new Uint8Array(BLOCKS.length),
  VIS_SEL = new Uint8Array(BLOCKS.length);
for (const t of BLOCKS)
  t &&
    (/^(glass|tinted_glass|powder_snow|iron_bars|.*_stained_glass|.*glass_pane|.*copper_bars|.*copper_grate)$/.test(
      t.key,
    )
      ? (VIS_NONE[t.id] = 1)
      : ((t.fence && "wall" !== t.fence) ||
          /^(soul_sand|mud|snow|cocoa|sea_pickle|pointed_dripstone|sulfur_spike|repeater|comparator|(pale_)?moss_carpet|amethyst_cluster|.*amethyst_bud|.*candle)$/.test(
            t.key,
          )) &&
        (VIS_SEL[t.id] = 1));
class Game {
  constructor() {
    const t = this.loadSettings();
    ((this.hadSettings = Object.keys(t).length > 0),
      (this.settings = Object.assign(
        {
          fov: 70,
          renderDist: 8,
          sens: 0.5,
          volume: 0.8,
          gamma: 0.5,
          guiScale: 0,
          clouds: !0,
          bobbing: !0,
          advTooltips: !1,
          resScale: 1,
          shaders: 0,
          maxFps: 0,
          vsync: !0,
          graphics: "fancy",
          dynRes: !1,
        },
        t,
      )));
    const e = this.settings.shaders;
    ((this.settings.shaders =
      !0 === e ? 3 : Math.max(0, Math.min(FX_NAMES.length - 1, Math.round(Number(e)) || 0))),
      (this.state = "boot"),
      (this.mode = "survival"),
      (this.entities = []),
      (this.blockEntities = new Map()),
      (this.keys = {}),
      (this.mouseBtn = [!1, !1, !1]),
      (this.tickCount = 0),
      (this.worldTime = 1e3),
      (this.fps = 0),
      (this.perspective = 0),
      (this.weather = 0),
      (this.rainTarget = 0),
      (this.weatherTimer = this.weatherSpan(0)),
      (this.breaking = null),
      (this.useCd = 0),
      (this.attackCd = 0),
      (this.stats = { kills: 0, placed: 0, mined: 0 }),
      (this.adv = {}),
      (this.openChests = new Set()),
      (this.chestLids = new Map()),
      (this.signs = new Map()),
      (this.lastTap = {}),
      (this.sleepFade = 0));
  }
  viewDist() {
    return this.settings.renderDist;
  }
  settingsKey() {
    return self.POTATO ? "potato-settings" : "mcjs-settings";
  }
  loadSettings() {
    try {
      return JSON.parse(localStorage.getItem(this.settingsKey()) || "{}");
    } catch (t) {
      return {};
    }
  }
  saveSettings() {
    try {
      localStorage.setItem(this.settingsKey(), JSON.stringify(this.settings));
    } catch (t) {}
  }
  async init() {
    const step = (t) =>
      new Promise((e) => {
        ((self.BOOT_STEP = t), self.BOOT_DRAW && self.BOOT_DRAW());
        let s = !1;
        const go = () => {
          s || ((s = !0), setTimeout(e, 0));
        };
        (requestAnimationFrame(go), setTimeout(go, 100));
      });
    if (
      ((self.BOOT_STEP = "正在准备贴图"),
      (this.canvas = document.getElementById("gl")),
      (this.renderer = new Renderer(this.canvas)),
      (this.renderer.resScale = this.settings.resScale),
      await this.renderer.init(),
      Font.init(this.renderer.images.font),
      "function" == typeof GenPool && !this.genPool && !self.POTATO)
    )
      try {
        this.genSetup(window.PANORAMA ? PANORAMA.seed : 0);
      } catch (t) {}
    (await step("正在生成物品图标"),
      this.renderer.buildIcons(),
      await step("正在生成标题画面"),
      (this.ui = new UI(this, document.getElementById("ui"))),
      (this.particles = new Particles(this)),
      initPresets(this, this.hadSettings),
      setFastLeaves("fast" === this.settings.graphics),
      this.applySettings(),
      await DB.open(),
      this.resize(),
      window.addEventListener("resize", () => {
        ("undefined" != typeof Stage && Stage.el) || this.resize();
      }),
      bindInput(this),
      Sound.loadPack(),
      this.startTitle());
    let t = 0,
      e = 0,
      s = performance.now();
    ((this.pacer = new FramePacer(this, (i, o) => {
      if (
        (InlineGenWorker.frame++,
        o > 250 && (o = 250),
        o >= 0 || (o = 0),
        t >= 0 || (t = 0),
        (t += o),
        e++,
        i - s > 1e3 && ((this.fps = Math.round((1e3 * e) / (i - s))), (e = 0), (s = i)),
        this.debugPause)
      ) {
        try {
          this.render(1, i);
        } catch (t) {
          this.reportError("render", t);
        }
        return;
      }
      try {
        this.frame(o, i);
      } catch (t) {
        this.reportError("frame", t);
      }
      let a = 0;
      for (; t >= 50 && a < 5;) {
        try {
          this.tick();
        } catch (t) {
          this.reportError("tick", t);
        }
        ((t -= 50), a++);
      }
      5 === a && (t = 0);
      const r =
        "play" === this.state &&
        this.ui.screen &&
        this.ui.screen.pauses &&
        !(this.net || this.p2pHost || this.p2pGuest);
      r ? null == this.pauseA && (this.pauseA = t / 50) : (this.pauseA = null);
      const h = performance.now();
      PerfMon.gpuBegin(this.renderer.gl);
      try {
        this.render(r ? this.pauseA : t / 50, i);
      } catch (t) {
        this.reportError("render", t);
        try {
          this.ui.draw();
        } catch (t) {}
      }
      (PerfMon.gpuEnd(), (PerfMon.renderMs = performance.now() - h));
    })),
      this.pacer.start());
  }
  showError(t) {
    this.reportError("", t);
  }
  reportError(t, e, s) {
    const i = String((e && e.message) || e),
      o = String((e && e.stack) || "")
        .split("\n")
        .slice(1, 4)
        .map((t) => t.trim())
        .join(" | "),
      a = t + "|" + i + "|" + o,
      r = this.errLog || (this.errLog = new Map()),
      h = performance.now();
    let l = r.get(a);
    (l ||
      (r.size >= 30 && r.delete(r.keys().next().value),
      r.set(a, (l = { where: t, msg: i, stack: o, n: 0, first: Date.now(), shown: -1e9 })),
      console.error("[" + (t || "error") + "]", e)),
      l.n++,
      (l.last = Date.now()),
      !s &&
        h - l.shown > 15e3 &&
        this.ui &&
        ((l.shown = h), this.ui.message("错误（已跳过）: " + i, "#FF5555")));
  }
  guard(t, e) {
    try {
      return e();
    } catch (e) {
      this.reportError(t, e, !0);
    }
  }
  applySettings() {
    const t = this.settings;
    ((this.renderer.renderDist = t.renderDist),
      (this.renderer.gamma = t.gamma),
      (this.renderer.showClouds = t.clouds),
      Sound.setVolume(t.volume));
    const e = t.resScale * DynRes.scale;
    this.renderer.resScale !== e && ((this.renderer.resScale = e), this.sizeCanvas());
  }
  resize() {
    (this.sizeCanvas(), this.ui && this.ui.resize());
  }
  sizeCanvas() {
    const t = this.renderer.canvas,
      e = t.width,
      s = t.height;
    (this.renderer.resize(),
      (t.width === e && t.height === s) || (this.canvasGen = (this.canvasGen || 0) + 1));
  }
  setupWorld(t, e) {
    (this.world && this.unloadAll(),
      (this.dim = "overworld"),
      (this.dimData = null),
      (this.portalOverlay = 0),
      (this.genEpoch = (this.genEpoch || 0) + 1),
      setWorldFormat(e ? 2 : 1),
      (this.world = new World(seed32(t))),
      e &&
        ((this.world.gen2 = !0),
        (this.world.minY = MIN_Y),
        (this.world.seedStr = String(t)),
        this.genSetup(t)),
      (this.world.grassMap = this.renderer.grassMap),
      (this.world.foliageMap = this.renderer.foliageMap),
      (this.world.listener = this),
      (this.entities = []),
      (this.blockEntities = new Map()),
      (this.particles.list = []),
      (this.genQueue = []),
      (this.meshQueue = []));
  }
  unloadAll() {
    for (const t of this.world.chunks.values()) this.renderer.dropChunk(t.cx, t.cz);
    (this.world.chunks.clear(),
      this.world.proto && this.world.proto.clear(),
      this.renderer.clearSections());
  }
  startTitle() {
    ((this.state = "title"),
      (this.saveQ = null),
      this.ui && (this.ui.pinned = null),
      (this.pendingPin = null));
    const t =
        "undefined" != typeof TITLE_SCENES && !1 !== this.settings.titleScenes
          ? TITLE_SCENES[(Math.random() * TITLE_SCENES.length) | 0]
          : null,
      e = t ? null : window.PANORAMA;
    ((this.titleScene = t),
      this.setupWorld(t ? parseSeed(t.seed) : e ? e.seed : parseSeed(""), !0));
    const s = this.genEpoch;
    ((this.player = new Player(this, 0.5, 200, 0.5)),
      (this.titleCam = [0.5, 200, 0.5]),
      (this.panoAlpha = e ? 1 : 0),
      (this.panoT = 0),
      (this.panoFading = !1),
      e
        ? ((this.titleCam = [...e.pos]),
          (this.player.pos = [...e.pos]),
          (this.player.prev = [...e.pos]),
          (this.titleGround = !1))
        : t
          ? ((this.titleCam = [t.x + 0.5, 200, t.z + 0.5]),
            (this.player.pos = [...this.titleCam]),
            (this.player.prev = [...this.titleCam]),
            (this.titleGround = !0),
            (this.titleYaw = t.yaw || 0))
          : this.genSpawn().then(([t, e]) => {
              this.genEpoch === s &&
                ((this.titleCam = [t + 0.5, 200, e + 0.5]),
                (this.player.pos = [t + 0.5, 200, e + 0.5]),
                (this.player.prev = [...this.player.pos]),
                (this.titleGround = !0));
            }),
      (this.worldTime = t && t.time >= 500 && t.time <= 11e3 ? t.time : 4e3),
      (this.weather = t && t.rain ? 1 : 0),
      (this.rainTarget = this.weather),
      this.ui.open(new TitleScreen(this)));
  }
  findInland() {
    const t = this.world;
    for (let e = 0; e < 3e3; e += 48)
      for (let s = 0; s < 12; s++) {
        const i = Math.round(Math.cos((s / 12) * Math.PI * 2) * e),
          o = Math.round(Math.sin((s / 12) * Math.PI * 2) * e),
          a = t.column(i, o);
        if (a.h < SEA + 4 || a.h > 105) continue;
        let r = !0;
        for (let e = 0; e < 8 && r; e++) {
          t.column(
            i + 56 * Math.cos((e / 8) * Math.PI * 2),
            o + 56 * Math.sin((e / 8) * Math.PI * 2),
          ).h <=
            SEA + 1 && (r = !1);
        }
        if (r) {
          let e = a.h;
          for (let s = -2; s <= 2; s++)
            for (let a = -2; a <= 2; a++)
              e = Math.max(
                e,
                t.column(i + s, o + a).h +
                  (t.biomeOf(t.column(i + s, o + a)) === BI.FOREST ? 7 : 0),
              );
          return [i, e, o];
        }
        if (0 === e) break;
      }
    return this.findSpawn();
  }
  findSpawn() {
    const t = this.world;
    if (t.flat) return [0, (t.flatTop || 60) + 1, 0];
    for (let e = 0; e < 400; e += 8)
      for (let s = 0; s < 16; s++) {
        const i = Math.round(Math.cos((s / 16) * Math.PI * 2) * e),
          o = Math.round(Math.sin((s / 16) * Math.PI * 2) * e),
          a = t.column(i, o),
          r = t.biomeOf(a);
        if (a.h > SEA + 1 && a.h < 100 && r !== BI.OCEAN && r !== BI.RIVER && r !== BI.BEACH)
          return [i, a.h + 1, o];
        if (0 === e) break;
      }
    return [0, 80, 0];
  }
  async createWorld(t, e, s, i, o = {}) {
    const a = i ? 1 : 2;
    let r;
    2 === a
      ? (r = parseSeed(e))
      : ((r = parseInt(e, 10)),
        e
          ? (isNaN(r) || String(r) !== e.trim()) && (r = hashStr(e))
          : (r = (Math.random() * 2 ** 31) | 0));
    const h = "w" + Date.now().toString(36),
      l = {
        id: h,
        name: t || "新的世界",
        seed: r,
        gen: a,
        mode: s,
        flat: !!i,
        ...(i ? { flatClassic: !0 } : {}),
        created: Date.now(),
        lastPlayed: Date.now(),
        time: 1e3,
        player: null,
        hardcore: !!o.hardcore,
        difficulty: o.difficulty ?? 2,
        cheats: o.cheats ?? "creative" === s,
        structures: !1 !== o.structures,
        bonus: !!o.bonus,
      };
    return (await DB.putWorld(l), this.loadWorld(h));
  }
  async loadWorld(t) {
    let e;
    try {
      e = await DB.getWorld(t);
    } catch (e) {
      this.reportError("读取世界", e, !0);
      const s = this.ui.screen,
        i = s && void 0 !== s.loadBack ? s.loadBack : s instanceof LoadingScreen ? null : s,
        o = new ConfirmScreen(
          this,
          "无法读取这个世界",
          String((e && e.message) || e).slice(0, 60),
          "重试",
          (e) => {
            e
              ? this.loadWorld(t)
              : this.ui.open(i || ("title" === this.state ? new TitleScreen(this) : null));
          },
        );
      return ((o.loadBack = i), void this.ui.open(o));
    }
    if (!e) return;
    (this.ui.open(new LoadingScreen(this, "正在载入世界…")),
      (this.worldMeta = e),
      this.world && this.unloadAll(),
      (this.entities = []),
      (this.particles.list = []),
      (this.sleeping = null),
      (this.portalOverlay = 0),
      (this._ts = this._tsSeen = this._tsMobs = null),
      (this.welcome = !0),
      setWorldFormat(e.gen || 1),
      2 === e.gen && this.genSetup(e.seed),
      await this.initDims(e),
      (this.mode = e.mode),
      (this.hardcore = !!e.hardcore),
      (this.difficulty = this.hardcore ? 3 : (e.difficulty ?? 2)),
      (this.cheats = !this.hardcore && (e.cheats ?? !0)),
      (this.iconAt = e.icon ? 0 : performance.now() + 2500),
      (this.worldTime = e.time || 1e3),
      (this.weather = e.weather || 0),
      (this.rainTarget = e.rainTarget || 0),
      (this.weatherTimer = e.weatherTimer > 0 ? e.weatherTimer : this.weatherSpan(this.rainTarget)),
      (this.adv = e.adv || {}),
      (this.stats = e.stats || { kills: 0, placed: 0, mined: 0 }),
      (this.tutorial =
        e.tutorial ??
        ("survival" !== e.mode || ["mc", "vet"].includes(this.settings.playerKind) ? -1 : 0)),
      (this.tutStat = { moved: 0 }));
    let s = e.spawn;
    if (!s)
      if (2 === e.gen) {
        const [t, e] = await this.genSpawn();
        s = [t, 200, e];
      } else s = this.findSpawn();
    const i = (this.player = new Player(this, s[0] + 0.5, s[1], s[2] + 0.5));
    if (((i.spawn = s), e.player)) {
      const t = e.player;
      for (
        i.pos = [...t.pos],
          i.prev = [...t.pos],
          i.yaw = t.yaw,
          i.pitch = t.pitch,
          i.health = t.health,
          i.food = t.food,
          i.saturation = t.sat,
          i.xp = t.xp || 0,
          i.flying = !!t.flying,
          i.enchSeed = t.enchSeed ?? (Math.random() * 2 ** 31) | 0,
          i.inv.slots = t.inv.map((t) => (t ? fixSavedStack({ ...t }) : null));
        i.inv.slots.length < 41;
      )
        i.inv.slots.push(null);
      i.inv.sel = t.sel || 0;
      for (const [e, s, o, a] of t.effects || []) i.addEffect(e, s, o, a);
      ((i.absorption = t.absorption || 0),
        (i.bedSpawn = !!t.bedSpawn),
        (i.spawnYaw = t.spawnYaw),
        (i.air = 300),
        "number" == typeof t.health && t.health <= 0 && ((i.health = 0), (i.deathTime = 1)),
        "spectator" === this.mode && (i.noClip = !0));
    } else i.needsGround = !0;
    ((this.state = "loading"), (this.loadStart = performance.now()));
  }
  placeBonusChest(t, e) {
    const s = this.world;
    for (let i = 0; i < 64; i++) {
      const i = t + ((21 * Math.random()) | 0) - 10,
        o = e + ((21 * Math.random()) | 0) - 10,
        a = s.surfaceY(i, o) + 1,
        r = s.getBlock(i, a - 1, o);
      if (
        !SOLIDCUBE[r] ||
        IS_FLUID[r] ||
        0 !== s.getBlock(i, a, o) ||
        0 !== s.getBlock(i, a + 1, o)
      )
        continue;
      s.setBlock(i, a, o, 52, 4, 0);
      const h = this.getBlockEntity(i, a, o, "chest"),
        pick = (t) => {
          t = t.filter((t) => void 0 !== ITEM_KEY[t[0]]);
          let e = 0;
          for (const s of t) e += s[1];
          let s = Math.random() * e;
          for (const e of t) if ((s -= e[1]) < 0) return e;
          return t[0];
        },
        put = (t, e) => {
          if (void 0 === ITEM_KEY[t]) return;
          let s = (27 * Math.random()) | 0,
            i = 0;
          for (; h.slots[s] && i++ < 40;) s = (27 * Math.random()) | 0;
          h.slots[s] = makeStack(t, e);
        },
        rnd = (t, e) => t + ((Math.random() * (e - t + 1)) | 0);
      (put(
        pick([
          ["stone_axe", 1],
          ["wooden_axe", 3],
        ])[0],
        1,
      ),
        put(
          pick([
            ["stone_pickaxe", 1],
            ["wooden_pickaxe", 3],
          ])[0],
          1,
        ));
      for (let t = 0; t < 3; t++)
        put(
          pick([
            ["apple", 5],
            ["bread", 3],
            ["cod", 3],
          ])[0],
          rnd(1, 2),
        );
      for (let t = 0; t < 4; t++) {
        const t = pick([
          ["stick", 10],
          ["oak_planks", 10],
          ["oak_log", 3],
          ["spruce_log", 3],
          ["birch_log", 3],
          ["jungle_log", 3],
          ["acacia_log", 3],
          ["dark_oak_log", 3],
        ]);
        put(t[0], t[0].endsWith("_log") ? rnd(1, 3) : rnd(1, 12));
      }
      for (const [t, e] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ])
        0 === s.getBlock(i + t, a, o + e) &&
          SOLIDCUBE[s.getBlock(i + t, a - 1, o + e)] &&
          s.setBlock(i + t, a, o + e, 21, 0, 0);
      return;
    }
  }
  captureIcon() {
    this.iconAt = 0;
    const t = this.canvas,
      e = Math.min(t.width, t.height),
      s = document.createElement("canvas");
    s.width = s.height = 64;
    const i = s.getContext("2d");
    ((i.imageSmoothingQuality = "high"),
      i.drawImage(t, (t.width - e) / 2, (t.height - e) / 2, e, e, 0, 0, 64, 64));
    try {
      ((this.worldMeta.icon = s.toDataURL("image/png")),
        Promise.resolve(DB.putWorld(this.worldMeta)).catch(() => {}));
    } catch (t) {}
  }
  async saveWorld(t) {
    if (((this.saveQ = null), !this.worldMeta || "play" !== this.state)) return;
    const e = this.player,
      s = this.collectDimSave(),
      i = this.worldMeta;
    ((i.lastPlayed = Date.now()),
      (i.time = this.worldTime),
      (i.mode = this.mode),
      (i.difficulty = this.difficulty),
      (i.weather = this.weather),
      (i.rainTarget = this.rainTarget),
      (i.weatherTimer = Math.round(this.weatherTimer)),
      (i.spawn = e.spawn),
      (i.adv = this.adv),
      (i.stats = this.stats),
      (i.tutorial = this.tutorial),
      this.animalChunks &&
        this.animalChunksFor === i.id &&
        (i.animalChunks = [...this.animalChunks]));
    let o = e.inv.slots;
    const a = this.ui && this.ui.pendingStacks ? this.ui.pendingStacks() : [];
    if (a.length) {
      o = o.slice();
      for (const t of a) {
        const e = o.findIndex((t, e) => e < 36 && !t);
        e >= 0 && (o[e] = { ...t });
      }
    }
    i.player = {
      pos: [...e.pos],
      yaw: e.yaw,
      pitch: e.pitch,
      health: e.health,
      food: e.food,
      sat: e.saturation,
      xp: e.xp,
      inv: o,
      sel: e.inv.sel,
      flying: e.flying,
      effects: e.effects ? [...e.effects].map(([t, e]) => [t, e.amp, e.dur, e.ambient]) : [],
      absorption: e.absorption || 0,
      enchSeed: e.enchSeed,
      bedSpawn: !!e.bedSpawn,
      spawnYaw: e.spawnYaw,
    };
    let r = 0;
    try {
      for (const [t, e] of s) (await DB.putChunks(t, e), r++);
      (await DB.putWorld(i), t || this.ui.message("世界已保存", "#AAAAAA"));
    } catch (t) {
      for (const [t, e] of s.slice(r)) {
        const s = Object.keys(this.dimData || {}).find((e) => this.dimStoreId(e) === t),
          i = s && this.dimData[s];
        if (i && i.dirtySaved) for (const [t, s] of e) i.dirtySaved.add(ckey(t, s));
      }
      (this.ui.message("保存失败: " + t.message, "#FF5555"),
        "undefined" != typeof Telemetry && Telemetry.count && Telemetry.count("save_fail"));
    }
  }
  async quitToTitle() {
    this.net
      ? this.leaveServer()
      : (await this.saveWorld(!0),
        (this.worldMeta = null),
        (this.ui.cursor = null),
        this.startTitle());
  }
  updateChunks(t) {
    const e = performance.now();
    try {
      this.updateChunksIn(t);
    } finally {
      this.pacer && (this.pacer.chunkMs += performance.now() - e);
    }
  }
  chunkBudget() {
    return this.pacer ? this.pacer.budget() : 6;
  }
  updateChunksIn(t) {
    const e = this.world,
      s =
        "title" === this.state
          ? 6
          : "loading" === this.state
            ? Math.min(3, this.viewDist())
            : this.viewDist(),
      i = "title" === this.state ? this.titleCam : this.player.pos,
      o = Math.floor(i[0]) >> 4,
      a = Math.floor(i[2]) >> 4,
      r = performance.now();
    if (
      ((this.workDone = 0), !(e.remote || (this.genQueue.length && this._lastCC === o + "," + a)))
    ) {
      this._lastCC = o + "," + a;
      const t = [];
      for (let i = -s - 1; i <= s + 1; i++)
        for (let r = -s - 1; r <= s + 1; r++)
          i * i + r * r > (s + 1.5) * (s + 1.5) ||
            e.chunks.has(ckey(o + i, a + r)) ||
            t.push([o + i, a + r, i * i + r * r]);
      (t.sort((t, e) => e[2] - t[2]), (this.genQueue = t));
    }
    this.genQueueLen = this.genQueue.length;
    let h = 0;
    for (
      e.gen2 && !e.remote && ((this.genQueue.length = 0), this.genStep(o, a, s, r, t));
      this.genQueue.length && (performance.now() - r < 0.5 * t || 0 === h);
    ) {
      const [t, s] = this.genQueue.pop();
      !e.chunks.has(ckey(t, s)) && this.savedReady(e, ckey(t, s)) && (this.loadChunk(t, s), h++);
    }
    this.meshResQ && this.meshResQ.length && this.applyMeshResults(r, t);
    const l = [];
    for (const t of e.chunks.values()) {
      if (!t.dirty) continue;
      const i = t.cx - o,
        r = t.cz - a;
      if (i * i + r * r > (s + 0.5) * (s + 0.5)) continue;
      let h = !0;
      for (let s = -1; s <= 1 && h; s++)
        for (let i = -1; i <= 1; i++)
          if (!e.chunks.has(ckey(t.cx + s, t.cz + i))) {
            h = !1;
            break;
          }
      h && l.push([t, i * i + r * r]);
    }
    l.sort((t, e) => t[1] - e[1]);
    const c = this.chunkWorker,
      p = e.useCW && c && c.ready && !c.failed;
    for (const [e] of l)
      if (p && !e.syncMesh) {
        if (c.inflightMeshes() > 64 || !this.workFits(r, t, "gather")) break;
        this.timedWork("gather", () => this.meshChunkAsync(e));
      } else {
        if (!this.workFits(r, t, "mesh")) break;
        this.timedWork("mesh", () => this.meshChunk(e));
      }
    if (((this.meshPending = l.length), this.tickCount % 40 == 0 && !e.remote)) {
      const t = [];
      for (const i of [...e.chunks.values()]) {
        const r = i.cx - o,
          h = i.cz - a;
        if (r * r + h * h > (s + 2.5) * (s + 2.5)) {
          const s = ckey(i.cx, i.cz);
          if (
            (i.modified && e.savedChunks && "play" === this.state
              ? (e.savedChunks.set(s, encodeChunk(i)),
                e.savedIndex && e.savedIndex.add(s),
                this.dirtySaved.add(s))
              : e.savedIndex &&
                e.savedIndex.has(s) &&
                !this.dirtySaved.has(s) &&
                e.savedChunks.delete(s),
            this.renderer.dropChunk(i.cx, i.cz),
            e.chunks.delete(ckey(i.cx, i.cz)),
            t.push(ckey(i.cx, i.cz)),
            this.meshVer)
          )
            for (let t = 0; t < SECTIONS; t++) this.meshVer.delete(32 * ckey(i.cx, i.cz) + t);
        }
      }
      if (
        (t.length &&
          e.useCW &&
          c &&
          c.world === e &&
          !c.failed &&
          c.post({ type: "unloaded", epoch: c.epoch, keys: t }),
        t.length && "play" === this.state && this.parkEntities(new Set(t)),
        e.savedIndex && e.savedChunks.size > 64)
      )
        for (const t of [...e.savedChunks.keys()]) {
          if (e.chunks.has(t) || this.dirtySaved.has(t)) continue;
          const i = Math.floor(t / 65536) - 32768 - o,
            r = (t % 65536) - 32768 - a;
          i * i + r * r > (s + 8) * (s + 8) && e.savedChunks.delete(t);
        }
    }
  }
  savedReady(t, e) {
    if (!t.savedIndex || !t.savedIndex.has(e) || t.savedChunks.has(e)) return !0;
    const s = t.savedFetch instanceof Map ? t.savedFetch : (t.savedFetch = new Map()),
      i = performance.now(),
      o = s.get(e);
    if (void 0 === o || i - o > 8e3) {
      s.set(e, i);
      const o = t.savedTries || (t.savedTries = new Map());
      DB.getChunk(t.savedStore, Math.floor(e / 65536) - 32768, (e % 65536) - 32768).then(
        (i) => {
          (s.delete(e), o.delete(e), i ? t.savedChunks.set(e, i) : t.savedIndex.delete(e));
        },
        (i) => {
          s.delete(e);
          const a = (o.get(e) || 0) + 1;
          (o.set(e, a),
            a >= 3 && (o.delete(e), t.savedIndex.delete(e), this.reportError("读取存档区块", i)));
        },
      );
    }
    return !1;
  }
  workFits(t, e, s) {
    return (
      !this.workDone || performance.now() - t + ((this.workCost && this.workCost[s]) || 2) <= e
    );
  }
  timedWork(t, e) {
    const s = performance.now();
    e();
    const i = performance.now() - s,
      o = this.workCost || (this.workCost = {});
    ((o[t] = void 0 === o[t] ? i : 0.8 * o[t] + 0.2 * i), this.workDone++);
  }
  meshChunkAsync(t) {
    const e = this.world,
      s = this.renderer,
      i = this.chunkWorker,
      o = this.meshVer || (this.meshVer = new Map());
    for (let a = 0; a < SECTIONS; a++) {
      if (!(t.dirty & (1 << a))) continue;
      const r = 32 * ckey(t.cx, t.cz) + a,
        h = (o.get(r) || 0) + 1;
      if ((o.set(r, h), !t.sectionCount[a])) {
        const t = s.sections.get(r);
        (t && (s.freeSection(t), s.sections.delete(r)), s.setSectionVis(r, VIS_ALL));
        continue;
      }
      try {
        (Mesher.gather(e, t.cx, a, t.cz),
          i.mesh(Object.assign(Mesher.snapshot(e.dim), { cx: t.cx, sy: a, cz: t.cz }), (s) =>
            (this.meshResQ || (this.meshResQ = [])).push({
              res: s,
              key: r,
              ver: h,
              ch: t,
              sy: a,
              w: e,
            }),
          ));
      } catch (e) {
        (this.reportError("mesh " + t.cx + "," + a + "," + t.cz, e, !0), (t.syncMesh = !0));
      }
    }
    t.dirty = t.syncMesh ? ALL_SECTIONS : 0;
  }
  applyMeshResults(t, e) {
    const s = this.meshResQ,
      i = this.renderer,
      o = this.meshVer;
    let a = 0;
    for (; a < s.length; a++) {
      const r = s[a],
        h = r.w,
        l = r.ch;
      if (o && o.get(r.key) === r.ver && this.world === h && h.chunks.get(ckey(l.cx, l.cz)) === l)
        if (r.res) {
          if (!this.workFits(t, e, "upload")) break;
          this.timedWork("upload", () =>
            this.guard("upload " + l.cx + "," + r.sy + "," + l.cz, () => {
              (i.setSection(r.key, l.cx, r.sy, l.cz, r.res), i.setSectionVis(r.key, r.res.vis));
            }),
          );
        } else ((l.dirty |= 1 << r.sy), (l.syncMesh = !0));
    }
    s.splice(0, a);
  }
  meshChunk(t) {
    const e = this.world;
    for (let s = 0; s < SECTIONS; s++) {
      if (!(t.dirty & (1 << s))) continue;
      const i = 32 * ckey(t.cx, t.cz) + s;
      if (
        (this.meshVer && this.meshVer.set(i, (this.meshVer.get(i) || 0) + 1), !t.sectionCount[s])
      ) {
        const t = this.renderer.sections.get(i);
        (t && (this.renderer.freeSection(t), this.renderer.sections.delete(i)),
          this.renderer.setSectionVis(i, VIS_ALL));
        continue;
      }
      this.guard("mesh " + t.cx + "," + s + "," + t.cz, () => {
        const o = Mesher.build(e, t.cx, s, t.cz);
        (this.renderer.setSection(i, t.cx, s, t.cz, o), this.renderer.setSectionVis(i, o.vis));
      });
    }
    ((t.dirty = 0), (t.syncMesh = !1));
  }
  loadChunk(t, e) {
    try {
      this.loadChunkIn(t, e);
    } catch (s) {
      (this.reportError("chunk " + t + "," + e, s, !0),
        this.world.chunks.has(ckey(t, e)) || this.finishChunk(new Chunk(t, e), !1));
    }
  }
  loadChunkIn(t, e) {
    const s = this.world,
      i = s.savedChunks && s.savedChunks.get(ckey(t, e));
    let o;
    if (i) {
      ((o = new Chunk(t, e)), decodeChunk(i, o));
      for (let i = 0; i < 16; i++)
        for (let a = 0; a < 16; a++) {
          const r = s.flat
            ? { temp: 0.3, humid: 0.2, h: 60, river: 0, cont: 0.3, mount: 0 }
            : s.column(16 * t + a, 16 * e + i);
          ((o.biome[16 * i + a] = s.biomeOf(r)),
            s.tintFor(s.grassMap, r.temp, r.humid, o.grass, 3 * (16 * i + a)),
            s.tintFor(s.foliageMap, r.temp, r.humid, o.foliage, 3 * (16 * i + a)));
        }
      o.recount();
    } else o = s.generate(t, e);
    this.finishChunk(o, !!i);
  }
  finishChunk(t, e) {
    const s = this.world,
      i = t.cx,
      o = t.cz;
    (s.chunks.set(ckey(i, o), t), (t.dirty = ALL_SECTIONS));
    for (let e = -1; e <= 1; e++)
      for (let a = -1; a <= 1; a++) {
        const r = s.getChunk(i + e, o + a);
        r && r !== t && (r.dirty |= ALL_SECTIONS);
      }
    if (
      (e &&
        !this.net &&
        "undefined" != typeof RS &&
        this.guard("redstone " + i + "," + o, () => RS.settleChunk(this, t)),
      this.guard("light " + i + "," + o, () => s.initLight(t)),
      "play" === this.state || "loading" === this.state)
    ) {
      this.pendingMobs &&
        this.pendingMobs.length &&
        (this.pendingMobs = this.pendingMobs.filter((t) => {
          if (Math.floor(t.pos[0]) >> 4 === i && Math.floor(t.pos[2]) >> 4 === o) {
            let e;
            try {
              e = this.restoreMob(t);
            } catch (e) {
              return (console.warn("[mobs] not restored: " + t.type, e), !0);
            }
            return (this.entities.push(e), !1);
          }
          return !0;
        }));
      const a = s.parked && s.parked.get(ckey(i, o));
      if (a) {
        s.parked.delete(ckey(i, o));
        for (const t of a) this.entities.push(t);
      }
      e ||
        "overworld" !== this.dim ||
        (this.worldMeta && this.worldMeta.noAnimals) ||
        this.spawnAnimals(t);
    }
  }
  spawnAnimals(t) {
    const e = RNG(hashStr("animals" + this.world.seed + t.cx + ":" + t.cz)),
      s = "function" == typeof spawnBiome ? spawnBiome(this, 16 * t.cx, 16 * t.cz) : null,
      i = s && s.def && s.def.spawners && s.def.spawners.creature ? s : null;
    if (e() >= (i ? (i.def.creature_spawn_probability ?? 0.1) : 0.1)) return;
    const o = this.worldMeta,
      a = o ? o.id : null;
    (this.animalChunksFor === a && this.animalChunks) ||
      ((this.animalChunksFor = a), (this.animalChunks = new Set((o && o.animalChunks) || [])));
    const r = ckey(t.cx, t.cz);
    if (this.animalChunks.has(r)) return;
    if ((this.animalChunks.add(r), i && this.spawnChunkAnimals))
      return void this.spawnChunkAnimals(t, i);
    const h = ["pig", "cow", "sheep", "sheep", "chicken"],
      l = h[e.int(h.length)],
      c = 2 + e.int(3);
    for (let s = 0; s < c; s++) {
      const s = 16 * t.cx + e.int(16),
        i = 16 * t.cz + e.int(16);
      for (let e = HEIGHT - 2; e > (this.world.flat ? 0 : SEA); e--) {
        const o = t.getB((e << 8) | ((15 & i) << 4) | (15 & s));
        if (0 !== o && BLOCKS[o].solid) {
          2 === o && this.entities.push(new Mob(this, l, s + 0.5, e + 1, i + 0.5));
          break;
        }
      }
    }
  }
  frame(t, e) {
    if (this.world)
      if ("title" !== this.state) {
        if ("loading" === this.state) {
          this.updateChunks(30);
          const t = this.player,
            s = Math.floor(t.pos[0]) >> 4,
            i = Math.floor(t.pos[2]) >> 4;
          let o = 0,
            a = 0;
          const r = Math.max(0, Math.min(2, (0 | this.settings.renderDist) - 1));
          for (let t = -r; t <= r; t++)
            for (let e = -r; e <= r; e++) {
              a++;
              const r = this.world.getChunk(s + t, i + e);
              r && !r.dirty && o++;
            }
          const h = this.chunkWorker,
            l =
              o === a &&
              ((this.meshResQ && this.meshResQ.length) ||
                (h && !h.failed && h.inflightMeshes() > 0));
          if (
            (l ? this.meshWaitT || (this.meshWaitT = e) : (this.meshWaitT = 0),
            (this.loadProgress = (o - (l ? 0.5 : 0)) / a),
            this.chunkWatchdog(s, i, e),
            o === a && (!l || e - this.meshWaitT > 5e3))
          ) {
            if (((this.meshWaitT = 0), this.onDimReady)) {
              const t = this.onDimReady;
              ((this.onDimReady = null), t(), this.flushMesh());
            }
            if (t.needsGround) {
              const e = Math.floor(t.pos[0]),
                s = Math.floor(t.pos[2]);
              let i = HEIGHT - 2;
              for (
                ;
                i > 0 &&
                !BLOCKS[this.world.getBlock(e, i, s)].solid &&
                !IS_FLUID[this.world.getBlock(e, i, s)];
              )
                i--;
              ((t.pos[1] = i + 1),
                (t.prev[1] = i + 1),
                (t.spawn = [e, i + 1, s]),
                (t.needsGround = !1),
                (this.worldMeta.spawn = t.spawn),
                this.worldMeta.bonus &&
                  !this.worldMeta.bonusPlaced &&
                  ((this.worldMeta.bonusPlaced = !0), this.placeBonusChest(e, s)));
            }
            if (
              ((this.state = "play"),
              this.ui.close(),
              !this.net && t.deathTime > 0 && t.health <= 0 && this.ui.open(new DeathScreen(this)),
              "undefined" != typeof DynRes && DynRes.reset(this),
              this.pendingPin)
            ) {
              const t = this.pendingPin;
              ((this.pendingPin = null), this.ui.pinMessage(t.text, t.ms));
            }
            (this.welcome &&
              ((this.welcome = !1),
              this.ui.message(
                `欢迎来到 ${this.worldMeta.name}！` +
                  (touchOn(this)
                    ? "点右上角的暂停 → 游戏说明 查看触屏操作。"
                    : "按 H 查看操作说明。"),
                "#FFFF55",
              )),
              "file:" !== location.protocol ||
                this.fileHint ||
                ((this.fileHint = !0),
                this.ui.message(
                  "当前是直接打开 index.html 的方式，浏览器不允许后台线程，地形生成会让游戏很卡。请双击“启动游戏.bat”启动（会自动开本地服务器）。",
                  "#FF5555",
                )),
              (this.lastSave = e),
              Sound.init());
          }
          return;
        }
        "play" === this.state &&
          (this.updateChunks(this.chunkBudget()),
          this.net ||
            this.chunkWatchdog(
              Math.floor(this.player.pos[0]) >> 4,
              Math.floor(this.player.pos[2]) >> 4,
              e,
            ),
          this.saveQ
            ? this.autosaveStep()
            : e - this.lastSave > 45e3 &&
              ((this.lastSave = e),
              (self.POTATO && this.worldMeta && this.worldMeta.xzduel) || this.autosaveStart()));
      } else {
        if (
          (this.titleFrozen ||
            this.lobby ||
            ((this.titleYaw = (this.titleYaw || 0) + 4e-5 * t), this.updatePanorama(t)),
          this.lobby && (this.lobby.frame(this, t), !this.lobby.live))
        )
          return;
        if (
          (this.updateChunks(this.chunkBudget()),
          this.titleGround &&
            this.world.isLoaded(Math.floor(this.titleCam[0]), Math.floor(this.titleCam[2])))
        ) {
          let t = 0;
          for (let e = -8; e <= 8; e += 4)
            for (let s = -8; s <= 8; s += 4)
              t = Math.max(
                t,
                this.world.surfaceY(
                  Math.floor(this.titleCam[0]) + e,
                  Math.floor(this.titleCam[2]) + s,
                ),
              );
          ((this.titleCam[1] = t + 14), (this.titleGround = !1));
        }
      }
  }
  autosaveStart() {
    const t = this.world,
      e = [];
    if (this.worldMeta && !this.net && !this.p2pGuest && t && t.savedChunks && this.dirtySaved)
      for (const s of t.chunks.values()) s.modified && e.push(s);
    e.length ? (this.saveQ = { w: t, dirty: this.dirtySaved, q: e, i: 0 }) : this.saveWorld(!0);
  }
  autosaveStep() {
    const t = this.saveQ,
      e = this.world;
    if (e !== t.w || this.dirtySaved !== t.dirty || "play" !== this.state)
      return void (this.saveQ = null);
    const s = performance.now();
    do {
      const s = t.q[t.i++],
        i = ckey(s.cx, s.cz);
      if (!s.modified || e.chunks.get(i) !== s) continue;
      const o = encodeChunk(s);
      (e.savedChunks.set(i, o),
        e.savedIndex && e.savedIndex.add(i),
        t.dirty.add(i),
        (s.modified = !1));
    } while (t.i < t.q.length && performance.now() - s < 1.5);
    if (!(t.i < t.q.length)) {
      for (const s of t.q)
        s.modified && e.chunks.get(ckey(s.cx, s.cz)) === s && t.dirty.delete(ckey(s.cx, s.cz));
      ((this.saveQ = null), this.saveWorld(!0));
    }
  }
  tickFov() {
    const t = this.player;
    if (!t) return;
    let e = 1;
    if ((t.flying && (e *= 1.1), t.sprinting && (e *= 1.15), t.usingItem === item("bow"))) {
      const s = Math.min(1, t.useT / 20);
      e *= 1 - s * s * 0.15;
    }
    ((this.oFovMod = this.fovMod ?? 1), (this.fovMod = this.oFovMod + 0.5 * (e - this.oFovMod)));
  }
  weatherSpan(t) {
    return t ? 12e3 + 12e3 * Math.random() : 12e3 + 168e3 * Math.random();
  }
  tick() {
    if (!this.world) return;
    if ("title" === this.state) return void this.world.time++;
    if ("play" !== this.state) return;
    if (this.ui.screen && this.ui.screen.pauses) return;
    (this.tickCount++,
      (this.frameA = 0),
      this.tickFov(),
      this.world.time++,
      (this.worldTime += this.net && null != this.timeRate ? this.timeRate : 1));
    const t = this.player;
    for (let e = 0, s = t.inv.slots; e < s.length; e++)
      s[e] && !ITEMS[s[e].id] && (s[e] = knownStack(s[e], this, "inventory"));
    ("overworld" !== this.dim ||
      (!this.net &&
        !this.p2pGuest &&
        --this.weatherTimer < 0 &&
        ((this.rainTarget = this.rainTarget ? 0 : 1),
        (this.weatherTimer = this.weatherSpan(this.rainTarget)))),
      (this.weather += clamp(this.rainTarget - this.weather, -0.01, 0.01)));
    const e = this.ui.screen
      ? { fwd: 0, strafe: 0, jump: !1, sneak: !1, sprint: !1 }
      : this.readInput();
    if (
      (this.tickSleep() ||
        (t.loadedHere()
          ? (t.respawnGround && this.guard("respawn", () => this.respawnSettle()),
            this.guard("player", () => t.tick(e)))
          : t.savePrev()),
      this.tickPlayerBody(t),
      this.net || this.tickCount % 5 != 0 || this.guard("barrels", () => this.recheckBarrels()),
      this.net)
    )
      return (
        this.guard("interaction", () => this.handleInteraction()),
        void this.guard("net", () => this.netTick())
      );
    if (this.p2pGuest)
      return (
        this.guard("interaction", () => this.handleInteraction()),
        void this.guard("p2p", () => this.p2pGuest.tick())
      );
    if (
      (!(t.pos[1] + (this.world.minY || 0) < 16 && t.pos[1] < SEA - 30) ||
        this.world.flatTop < 16 ||
        this.adv.deep ||
        this.grant("deep"),
      this.sleeping || this.guard("interaction", () => this.handleInteraction()),
      this.guard("portals", () => this.tickPortals()),
      this.tickCount % 10 != 0 ||
        t.creative ||
        t.noClip ||
        0 !== t.deathTime ||
        !this.inWallBlock() ||
        t.hurt(1, { type: "in_wall" }),
      "play" !== this.state)
    )
      return;
    (this.tickCount % 2 == 0 && this.guard("ender stare", () => this.checkEnderStare()),
      this.tickCount % 20 == 0 && this.guard("spawners", () => this.tickSpawners()),
      this.guard("chest lids", () => this.tickChestLids()));
    for (const t of this.entities)
      t.dead ||
        (t.alwaysTick ||
        (this.world.isLoaded(Math.floor(t.pos[0]), Math.floor(t.pos[2])) &&
          this.world.isLoaded(Math.floor(t.pos[0]) + 16, Math.floor(t.pos[2])) &&
          this.world.isLoaded(Math.floor(t.pos[0]) - 16, Math.floor(t.pos[2])))
          ? this.tickEntity(t)
          : t.savePrev());
    if ((this.guard("passengers", () => this.seatPassengers()), 0 === this.difficulty))
      for (const t of this.entities)
        t instanceof Mob && (t.T.hostile || "monster" === t.T.cat) && (t.dead = !0);
    if (
      ((this.entities = this.entities.filter((t) => !t.dead)),
      this.guard("particles", () => this.particles.tick()),
      this.guard("scheduled ticks", () => this.world.tickScheduled()),
      this.guard("random ticks", () =>
        this.world.randomTick(
          Math.floor(t.pos[0]),
          Math.floor(t.pos[2]),
          this.rng || (this.rng = RNG(12345)),
        ),
      ),
      this.guard("furnaces", () => this.tickFurnaces()),
      this.ui.screen &&
        this.ui.screen.stillValid &&
        this.guard("screen", () => this.ui.screen.stillValid()),
      this.tickCount % 20 == 0 &&
        this.guard("spawning", () => {
          "overworld" === this.dim ? this.spawnMobs() : this.spawnMobsDim();
        }),
      this.tutorial >= 0 &&
        ((this.tutStat.moved += Math.hypot(t.pos[0] - t.prev[0], t.pos[2] - t.prev[2])),
        this.ui.screen instanceof ContainerScreen && (this.tutStat.inv = !0),
        TUTORIAL[this.tutorial].done(this) &&
          (Sound.toast(),
          this.tutorial++,
          this.tutorial >= TUTORIAL.length && (this.tutorial = -1))),
      this.tickCount % 20 == 0)
    ) {
      const e = Math.floor(t.pos[0]),
        s = Math.floor(t.pos[1]),
        i = Math.floor(t.pos[2]);
      if (
        (!this.adv.fortress &&
          "nether" === this.dim &&
          this.world.inFortress(e, s, i) &&
          this.grant("fortress"),
        !this.adv.eye_spy && "overworld" === this.dim)
      ) {
        const t = this.nearestStronghold();
        t &&
          Math.abs(t.x - e) < 40 &&
          Math.abs(t.z - i) < 40 &&
          s < t.y + 8 &&
          s >= t.y - 1 &&
          this.grant("eye_spy");
      }
    }
    (this.armorSounds(),
      this.tickCount % 20 == 0 &&
        !this.adv.armor &&
        t.inv.slots.slice(36).some((t) => t && ITEMS[t.id].key.startsWith("iron_")) &&
        this.grant("armor"),
      !this.adv.night &&
        "survival" === this.mode &&
        this.dayTime() > 23500 &&
        this.worldTime > 2e4 &&
        this.grant("night"),
      "overworld" === this.dim &&
        this.weather > 0.2 &&
        this.tickCount % 2 == 0 &&
        this.rainParticles());
    const s = t.pos[1] + t.eye(),
      i = this.world.getBlock(Math.floor(t.pos[0]), Math.floor(s), Math.floor(t.pos[2]));
    ((this.headInWater = this.world.waterAt(
      Math.floor(t.pos[0]),
      Math.floor(s),
      Math.floor(t.pos[2]),
    )),
      (this.headInLava = i === LAVA),
      (this.headInPowder = i === BID.powder_snow && "spectator" !== this.mode),
      (this.waterVisionT = this.headInWater ? (this.waterVisionT || 0) + 1 : 0));
    {
      const t = this.waterVisionT;
      this.waterVision =
        t >= 600
          ? 1
          : 0.6 * clamp(t / 100, 0, 1) + 0.4 * (t < 100 ? 0 : clamp((t - 100) / 500, 0, 1));
    }
    (this.headInWater &&
      Math.random() < 0.1 &&
      this.particles.spawn(
        "bubble",
        t.pos[0] + (Math.random() - 0.5),
        s - 0.5,
        t.pos[2] + (Math.random() - 0.5),
        0,
        0.05,
        0,
      ),
      this.ambientParticles(),
      this.markerParticles(),
      this.bubbleColumnFx(),
      this.guard("ambient sounds", () => this.ambientSounds()),
      (Sound.listener = { x: t.pos[0], y: t.pos[1] + 1.6, z: t.pos[2], yaw: t.yaw }));
  }
  chunkWatchdog(t, e, s) {
    const i = this.world;
    if (!i || i.remote || s - (this.wdT || 0) < 1e3) return;
    const o = s - (this.wdT || 0) > 3e3;
    this.wdT = s;
    const a = [],
      r = "title" === this.state ? 6 : this.viewDist(),
      h = (r + 1.5) * (r + 1.5);
    for (let s = -3; s <= 3; s++)
      for (let o = -3; o <= 3; o++)
        s * s + o * o <= h && !i.chunks.has(ckey(t + s, e + o)) && a.push(ckey(t + s, e + o));
    const l = t + "," + e + ":" + a.join(",");
    if (!a.length || l !== this.wdSig || o) return ((this.wdSig = l), void (this.wdSince = s));
    if (s - this.wdSince < 8e3) return;
    if (s - (this.genProgressT || 0) < 4e3) return void (this.wdSince = s);
    ((this.wdSince = s),
      this.reportError(
        "区块加载停住了，重新请求 " + a.length + " 个区块",
        new Error("chunk stall"),
        !0,
      ));
    const c = this.chunkWorker,
      p = [];
    for (const t of a)
      (this.genPending && this.genPending.delete(t),
        i.protoKeys && i.protoKeys.delete(t) && p.push(t),
        i.savedFetch instanceof Map && i.savedFetch.delete(t));
    if (
      (p.length &&
        c &&
        !c.failed &&
        c.world === i &&
        c.post({ type: "unloaded", epoch: c.epoch, keys: p }),
      c && !c.failed && c.meshCb.size && s - (c.lastMesh || 0) > 1e4)
    ) {
      for (const t of c.meshCb.values()) t(null);
      c.meshCb.clear();
    }
    this._lastCC = null;
  }
  tickEntity(t) {
    try {
      (t.tick(), (t.tickErrs = 0));
    } catch (e) {
      ((t.tickErrs = (t.tickErrs || 0) + 1),
        this.reportError("entity " + (t.type || t.constructor.name), e, t.tickErrs < 5),
        t.tickErrs >= 5 && (t.dead = !0));
    }
  }
  readInput() {
    this.keys;
    const d = (t) => bindDown(this, t),
      t = this.settings,
      e = this.touchHeld || {};
    return {
      fwd: (d("forward") ? 1 : 0) - (d("back") ? 1 : 0),
      strafe: (d("right") ? 1 : 0) - (d("left") ? 1 : 0),
      jump: d("jump"),
      sneak: (t.toggleSneak ? !!this.sneakToggled : d("sneak")) || !!e.sneak || !!e.down,
      prone: d("prone") || !!e.prone, // W12a（07-§8.6）
      sprint:
        (t.toggleSprint ? !!this.sprintToggled : d("sprint")) || !!this.sprintToggle || !!e.sprint,
    };
  }
  ambientParticles() {
    const t = this.player,
      e = this.world;
    for (let s = 0; s < 40; s++) {
      const s = Math.floor(t.pos[0] + 24 * (Math.random() - 0.5)),
        i = Math.floor(t.pos[1] + 16 * (Math.random() - 0.5)),
        o = Math.floor(t.pos[2] + 24 * (Math.random() - 0.5)),
        a = e.getBlock(s, i, o);
      if (21 === a) {
        const t = e.getMeta(s, i, o),
          a = DIRS[t];
        let r = s + 0.5,
          h = i + 0.7,
          l = o + 0.5;
        (t &&
          a &&
          ((r = s + 0.5 + 0.38 * a[0] - 0.32 * a[0] * 0.6),
          (l = o + 0.5 + 0.38 * a[2] - 0.32 * a[2] * 0.6),
          (h = i + 0.92)),
          (this.particles.spawn("flame", r, h, l, 0, 0.002, 0).life = 12),
          (this.particles.spawn("smoke", r, h + 0.05, l, 0, 0.01, 0).size = 0.06));
      } else
        a === LAVA &&
          0 === e.getBlock(s, i + 1, o) &&
          Math.random() < 0.05 &&
          (this.particles.spawn(
            "lava",
            s + Math.random(),
            i + 1,
            o + Math.random(),
            0.1 * (Math.random() - 0.5),
            0.25,
            0.1 * (Math.random() - 0.5),
          ),
          Math.random() < 0.3 &&
            Sound.noise([s, i, o], { type: "bandpass", freq: 400, q: 2, dur: 0.1, vol: 0.3 }));
    }
  }
  markerParticles() {
    const t = this.player,
      e = t.inv.held,
      s = e && ITEMS[e.id];
    if (
      "creative" !== this.mode ||
      !s ||
      ("barrier" !== s.key && "light" !== s.key) ||
      void 0 === BID[s.key]
    )
      return;
    const i = BID[s.key],
      o = this.world,
      a = Math.floor(t.pos[0]),
      r = Math.floor(t.pos[1]),
      h = Math.floor(t.pos[2]),
      l = Math.random;
    for (const t of [16, 32])
      for (let e = 0; e < 667; e++) {
        const e = a + ((l() * t) | 0) - ((l() * t) | 0),
          c = r + ((l() * t) | 0) - ((l() * t) | 0),
          p = h + ((l() * t) | 0) - ((l() * t) | 0);
        o.getBlock(e, c, p) === i &&
          this.particles.spawn("marker", e + 0.5, c + 0.5, p + 0.5, 0, 0, 0, {
            layer: T("i_" + s.key),
          });
      }
  }
  bubbleColumnFx() {
    const t = this.player,
      e = this.world;
    if (void 0 !== BID.soul_sand) {
      if (!this.bubbleCols || this.tickCount % 20 == 0) {
        const s = [],
          i = Math.floor(t.pos[0]),
          o = Math.floor(t.pos[1]),
          a = Math.floor(t.pos[2]);
        for (let t = i - 12; t <= i + 12; t++)
          for (let i = a - 12; i <= a + 12; i++)
            for (let a = o - 12; a <= o + 12; a++) {
              const o = e.getBlock(t, a, i);
              if (
                (o !== BID.soul_sand && o !== BID.magma_block) ||
                e.getBlock(t, a + 1, i) !== WATER ||
                0 !== e.getMeta(t, a + 1, i)
              )
                continue;
              let r = a + 1;
              for (
                ;
                r < a + 64 && e.getBlock(t, r + 1, i) === WATER && 0 === e.getMeta(t, r + 1, i);
              )
                r++;
              s.length < 64 && s.push([t, a + 1, i, r, o === BID.soul_sand]);
            }
        this.bubbleCols = s;
      }
      for (const [t, s, i, o, a] of this.bubbleCols)
        if (e.getBlock(t, s, i) === WATER)
          if (a) {
            const e = s + Math.floor(Math.random() * (o - s + 1));
            (this.particles.spawn("bubble", t + 0.5, e, i + 0.5, 0, 0.04, 0),
              this.particles.spawn(
                "bubble",
                t + Math.random(),
                e + Math.random(),
                i + Math.random(),
                0,
                0.04,
                0,
              ),
              Math.random() < 0.005 &&
                Sound.ev(
                  "block.bubble_column.upwards_ambient",
                  [t + 0.5, o, i + 0.5],
                  0.2 + 0.2 * Math.random(),
                  0.9 + 0.15 * Math.random(),
                ));
          } else
            (this.particles.spawn(
              "bubble",
              t + 0.2 + 0.6 * Math.random(),
              o + 0.8,
              i + 0.2 + 0.6 * Math.random(),
              0,
              -0.05,
              0,
            ),
              Math.random() < 0.005 &&
                Sound.ev(
                  "block.bubble_column.whirlpool_ambient",
                  [t + 0.5, o, i + 0.5],
                  0.2 + 0.2 * Math.random(),
                  0.9 + 0.15 * Math.random(),
                ));
    }
  }
  armorSounds() {
    const t = this.player,
      e = t.inv.slots.slice(36, 40).map((t) => (t ? t.id : 0));
    if (
      (this.lastArmor &&
        e.forEach((e, s) => {
          e && e !== this.lastArmor[s] && Sound.ev(armorEquipSound(ITEMS[e].key), t.pos, 1, 1);
        }),
      (this.lastArmor = e),
      t.gliding)
    ) {
      this.glideT = (this.glideT || 0) + 1;
      const e = t.vel[0] * t.vel[0] + t.vel[1] * t.vel[1] + t.vel[2] * t.vel[2];
      let s = e >= 1e-7 ? clamp(e / 4, 0, 1) : 0;
      (this.glideT < 20 ? (s = 0) : this.glideT < 40 && (s *= (this.glideT - 20) / 20),
        (this.glideSnd && this.glideSnd.live) || (this.glideSnd = Sound.loop("item.elytra.flying")),
        this.glideSnd.update(null, s, s > 0.8 ? s - 0.8 + 1 : 1));
    } else this.glideT = 0;
  }
  ambientSounds() {
    const t = this.player,
      e = this.world,
      s = this.amb || (this.amb = { loops: new Map(), mood: 0 });
    if (!t || !e || t.deathTime > 0) return;
    const i = Math.floor(t.pos[0]),
      o = t.pos[1] + t.eye(),
      a = Math.floor(t.pos[2]),
      r = !!this.headInWater,
      h = this.vbiomeAt(i, a),
      l = h && h.amb;
    (void 0 !== s.under &&
      r !== s.under &&
      Sound.ev(r ? "ambient.underwater.enter" : "ambient.underwater.exit", null, 1, 1),
      (s.under = r));
    const c = r ? "ambient.underwater.loop" : l && l.loop ? l.loop.replace("minecraft:", "") : null;
    c && !s.loops.has(c) && s.loops.set(c, { h: null, f: 0 });
    for (const [t, e] of s.loops)
      ((e.f = clamp(e.f + (t === c ? 1 : -1), 0, 40)),
        e.f || t === c
          ? ((e.h && e.h.live) || (e.h = Sound.loop(t)), e.h.update(null, e.f / 40, 1))
          : (e.h && e.h.stop(), s.loops.delete(t)));
    if (r) {
      if (Math.random() < 0.01) {
        const t = Math.random();
        Sound.ev(
          t < 1e-4
            ? "ambient.underwater.loop.additions.ultra_rare"
            : t < 0.001
              ? "ambient.underwater.loop.additions.rare"
              : "ambient.underwater.loop.additions",
          null,
          1,
          1,
        );
      }
      return;
    }
    const p =
      l && l.mood
        ? l.mood
        : "overworld" === this.dim
          ? { sound: "ambient.cave", tick_delay: 6e3, block_search_extent: 8, offset: 2 }
          : null;
    if (p) {
      const r = p.block_search_extent,
        h = 2 * r + 1,
        l = i + Math.floor(Math.random() * h) - r,
        c = Math.floor(o) + Math.floor(Math.random() * h) - r,
        u = a + Math.floor(Math.random() * h) - r,
        f = e.skyAt(l, c, u);
      if (
        ((s.mood -= f > 0 ? (f / 15) * 0.001 : (e.blockLightAt(l, c, u) - 1) / p.tick_delay),
        s.mood >= 1)
      ) {
        const e = l + 0.5 - t.pos[0],
          i = c + 0.5 - o,
          a = u + 0.5 - t.pos[2],
          r = Math.hypot(e, i, a) || 1,
          h = (r + p.offset) / r;
        (Sound.ev(
          p.sound.replace("minecraft:", ""),
          [t.pos[0] + e * h, o + i * h, t.pos[2] + a * h],
          0.5,
          1,
        ),
          (s.mood = 0));
      } else s.mood = Math.max(s.mood, 0);
    }
    l &&
      l.additions &&
      Math.random() < l.additions.tick_chance &&
      Sound.ev(l.additions.sound.replace("minecraft:", ""), null, 0.5, 1);
  }
  rainParticles() {
    const t = this.player,
      e = this.world;
    for (let s = 0; s < 6; s++) {
      const s = Math.floor(t.pos[0] + 20 * (Math.random() - 0.5)),
        i = Math.floor(t.pos[2] + 20 * (Math.random() - 0.5));
      if (!e.getChunk(s >> 4, i >> 4)) continue;
      if (this.isCold(s, i) || this.dryAt(s, i)) continue;
      let o = Math.floor(t.pos[1]) + 10;
      for (
        ;
        o > t.pos[1] - 10 && !BLOCKS[e.getBlock(s, o, i)].solid && !IS_FLUID[e.getBlock(s, o, i)];
      )
        o--;
      o > t.pos[1] - 10 &&
        this.particles.spawn("rain", s + Math.random(), o + 1.05, i + Math.random(), 0, 0.05, 0);
    }
  }
  dryAt(t, e) {
    if (!this.world.gen2) return !1;
    const s = this.vbiomeAt(t, e);
    return !!s && !s.precip;
  }
  isCold(t, e) {
    if (this.world.gen2) return this.snowsAt(t, this.world.surfaceY(t, e) + 1, e);
    const s = this.world.getChunk(t >> 4, e >> 4);
    if (!s) return !1;
    const i = s.biome[((15 & e) << 4) | (15 & t)];
    return i === BI.SNOWY || i === BI.SNOWPEAK || i === BI.FROZEN_OCEAN;
  }
  tintAt(t, e, s) {
    if ("string" == typeof s && s.startsWith("slime:")) return slimeTint(s, t, e);
    if ("string" == typeof s && "#" === s[0])
      return [1, 3, 5].map((t) => parseInt(s.slice(t, t + 2), 16));
    const i = this.world.getChunk(t >> 4, e >> 4);
    if (!i) return [124, 189, 107];
    const o = 3 * (((15 & e) << 4) | (15 & t)),
      a =
        "foliage" === s
          ? i.foliage
          : "water" === s
            ? i.water
            : "dry_foliage" === s
              ? i.dry
              : i.grass;
    return "birch" === s
      ? [128, 167, 85]
      : "spruce" === s
        ? [97, 153, 97]
        : a
          ? [a[o], a[o + 1], a[o + 2]]
          : "water" === s
            ? BIOME_WATER[i.biome[o / 3]] || BIOME_WATER_DEFAULT
            : DRY_FOLIAGE_DEFAULT;
  }
  blockTintAt(t, e, s, i) {
    const o = BLOCKS[s];
    return o && o.tint && 2 !== s && !1 !== o.particleTint
      ? "stem" === o.tint
        ? stemTint(o.states && o.states[i] ? o.states[i].age : 0)
        : o.tintRGB || this.tintAt(t, e, o.tint)
      : null;
  }
  dayTime() {
    return ((this.worldTime % 24e3) + 24e3) % 24e3;
  }
  celestial() {
    const t = this.dayTime() / 24e3 - 0.25,
      e = t - Math.floor(t);
    return e + (0.5 - Math.cos(e * Math.PI) / 2 - e) / 3;
  }
  isDay() {
    return Math.cos(this.celestial() * Math.PI * 2) > 0;
  }
  daylight() {
    const t = Math.cos(this.celestial() * Math.PI * 2);
    return clamp(2 * t + 0.5, 0, 1);
  }
  xpNeeded(t) {
    return t >= 30 ? 112 + 9 * (t - 30) : t >= 15 ? 37 + 5 * (t - 15) : 7 + 2 * t;
  }
  xpTotalFor(t) {
    let e = 0;
    for (let s = 0; s < t; s++) e += this.xpNeeded(s);
    return e;
  }
  xpLevel() {
    let t = 0,
      e = 0,
      s = this.player.xp;
    for (; e + this.xpNeeded(t) <= s;) ((e += this.xpNeeded(t)), t++);
    return t;
  }
  addXp(t) {
    if (t <= 0) return;
    const e = this.xpLevel();
    this.player.xp += t;
    const s = this.xpLevel();
    s > e && s % 5 == 0 && Sound.levelup();
  }
  dropXp(t, e, s, i) {
    for (i = Math.floor(i); i > 0;) {
      const o = XP_SIZES.find((t) => t <= i) || 1;
      ((i -= o), this.entities.push(new ExperienceOrb(this, t, e, s, o)));
    }
  }
  grant(t) {
    if (this.adv[t] || "title" === this.state || !ADVANCEMENTS[t]) return;
    this.adv[t] = Date.now();
    const e = ADVANCEMENTS[t];
    (this.ui.toast("进度达成！", e[0], item(e[1])),
      this.ui.message(`玩家取得了进度 [${e[0]}]`, "#55FF55"));
  }
  recheckBarrels() {
    const t = this.world,
      e = this.barrelsShown || (this.barrelsShown = new Set());
    if (!this.p2pHost && !this.p2pGuest && this.tickCount % 100 == 0)
      for (const t of this.blockEntities.values())
        "chest" === t.type && t.pos && e.add(t.pos.join(","));
    for (const s of e) {
      const [i, o, a] = s.split(",").map(Number),
        r = t.getBlock(i, o, a);
      if (!BLOCKS[r] || "barrel" !== BLOCKS[r].key) {
        e.delete(s);
        continue;
      }
      const h = t.getMeta(i, o, a),
        l = this.openChests.has(s);
      (("true" === Features.propOf(r, h, "open")) !== l &&
        (t.setMeta(i, o, a, Features.withProp(r, h, "open", l)), this.flushMesh()),
        l || e.delete(s));
    }
  }
  onBlockChanged(t, e, s, i, o, a) {
    if (i === o) return;
    const book = (t) => "undefined" != typeof BOOK_BLOCKS && BOOK_BLOCKS.has(t),
      r = BLOCKS[i] && (BLOCKS[i].beRender || BLOCKS[i].beDraw || book(i)),
      h = BLOCKS[o] && (BLOCKS[o].beRender || BLOCKS[o].beDraw || book(o));
    if (r || h || 127 === i || 127 === o) {
      const e = this.world.getChunk(t >> 4, s >> 4);
      e && (r || h ? (e.chests = null) : (e.spawners = null));
    }
    const l = `${t},${e},${s}`,
      c = this.blockEntities.get(l);
    if (c && (!BLOCKS[o] || !BLOCKS[o].chestLike) && 20 !== o && 117 !== o) {
      const i =
        "brewing" === c.type
          ? [...(c.bottles || []), c.ingredient, c.fuel]
          : c.items
            ? c.items
            : c.slots
              ? c.slots
              : [c.input, c.fuel, c.output];
      for (const o of i)
        o && "object" == typeof o && this.dropItem(t + 0.5, e + 0.5, s + 0.5, { ...o });
      (this.blockEntities.delete(l),
        this.ui.screen &&
          (this.ui.screen.be === c || (this.ui.screen.owns && this.ui.screen.owns(c))) &&
          this.ui.close());
    }
    !this.net && SNOWY_DIRT.has(o) && this.snowyUpdate(t, e, s, o);
  }
  snowyUpdate(t, e, s, i) {
    const o = this.world,
      a = o.getBlock(t, e + 1, s),
      r = a === BID.snow || a === BID.snow_block || a === BID.powder_snow,
      h = o.getMeta(t, e, s),
      l = 2 === i ? (r ? 1 | h : -2 & h) : Features.withProp(i, h, "snowy", r);
    l !== h && o.setMeta(t, e, s, l);
  }
  onNeighborUpdate(t, e, s, i) {
    const o = this.world,
      a = BLOCKS[i];
    if (a) {
      if (
        a &&
        !this.net &&
        ("attached_melon_stem" === a.key || "attached_pumpkin_stem" === a.key)
      ) {
        const r = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] }[
            Features.propOf(i, o.getMeta(t, e, s), "facing")
          ],
          h = BID[a.key.slice(9)];
        return void (this.supported(t, e, s, i, o.getMeta(t, e, s))
          ? r &&
            void 0 !== h &&
            o.getBlock(t + r[0], e, s + r[1]) !==
              BID["attached_melon_stem" === a.key ? "melon" : "pumpkin"] &&
            o.setBlock(t, e, s, h, Features.withProp(h, 0, "age", "7"))
          : this.breakBlock(t, e, s, !0));
      }
      if (this.net || !SNOWY_DIRT.has(i)) {
        if (a && a.chestLike) {
          const a = o.getMeta(t, e, s),
            r = chestSeam(a);
          if (r) {
            const h = o.getMeta(t + r[0], e, s + r[1]);
            (o.getBlock(t + r[0], e, s + r[1]) === i &&
              (7 & h) == (7 & a) &&
              chestType(h) !== chestType(a) &&
              chestType(h)) ||
              o.setMeta(t, e, s, -49 & a);
          }
          return;
        }
        if (170 !== i)
          if (171 !== i) {
            if (a.gravity) {
              if (o.getBlock(t, e, s) !== i) return;
              const a = o.getBlock(t, e - 1, s);
              if (e > 0 && (0 === a || REPLACEABLE[a] || IS_FLUID[a]) && o.isLoaded(t, s)) {
                const a = o.getMeta(t, e, s);
                (o.setBlock(t, e, s, 0, 0),
                  this.entities.push(new FallingBlock(this, t, e, s, i, a)));
              }
              return;
            }
            if (!(
              (this.blasting && this.blasting.has(t + "," + e + "," + s)) ||
              (this.cmdPlaced && this.cmdPlaced === t + "," + e + "," + s)
            ))
              if (a.needsSupport || a.door) {
                if (this.pairBreak === t + "," + e + "," + s) return;
                const a = o.getMeta(t, e, s),
                  r =
                    this.net || "undefined" == typeof Features
                      ? void 0
                      : Features.faceUpdate(this.survivalR(), i, a, t, e, s);
                if (r >= 0) return void (r !== a && o.setBlock(t, e, s, i, r));
                this.supported(t, e, s, i, a) || this.breakBlock(t, e, s, !0);
              } else
                this.net || "pointed_dripstone" !== a.key
                  ? !this.net &&
                    this.attachLost(t, e, s, i, o.getMeta(t, e, s)) &&
                    this.breakBlock(t, e, s, !0)
                  : this.dripstoneUpdate(t, e, s, i);
          } else
            this.fireSupported(t, e, s)
              ? this.net ||
                171 === this.fireIdAt(t, e, s) ||
                o.setBlock(t, e, s, this.fireIdAt(t, e, s), 0)
              : o.setBlock(t, e, s, 0, 0);
        else this.portalValid(t, e, s) || o.setBlock(t, e, s, 0, 0);
      } else this.snowyUpdate(t, e, s, i);
    }
  }
  dripstoneUpdate(t, e, s, i) {
    const o = this.world,
      a = o.getMeta(t, e, s),
      r = Features,
      h = "up" !== r.propOf(i, a, "vertical_direction");
    if (!this.supported(t, e, s, i, a)) {
      if (!h) return void this.breakBlock(t, e, s, !0);
      const a = [];
      for (
        let h = e;
        h >= 0 &&
        o.getBlock(t, h, s) === i &&
        "down" === r.propOf(i, o.getMeta(t, h, s), "vertical_direction") &&
        (a.push([h, o.getMeta(t, h, s)]),
        !/^tip/.test(r.propOf(i, a[a.length - 1][1], "thickness")));
        h--
      );
      a.forEach(([h, l], c) => {
        const p = new FallingBlock(this, t, h, s, i, l);
        (c === a.length - 1 &&
          /^tip/.test(r.propOf(i, l, "thickness")) &&
          (p.hurts = [Math.max(1 + e - h, 6), 40]),
          o.setBlock(t, h, s, 0, 0, 0),
          this.entities.push(p));
      });
      for (const [e] of a) {
        o.notify(t, e, s, i);
        for (const i of DIRS) o.notify(t + i[0], e + i[1], s + i[2], -1);
      }
      return;
    }
    const l = r.withProp(
      i,
      a,
      "thickness",
      this.dripThickness(t, e, s, h, "tip_merge" === r.propOf(i, a, "thickness")),
    );
    l !== a && o.setBlock(t, e, s, i, l);
  }
  dripThickness(t, e, s, i, o) {
    const a = this.world,
      r = BID.pointed_dripstone,
      h = i ? -1 : 1,
      l = i ? "down" : "up",
      dir = (e) =>
        a.getBlock(t, e, s) === r
          ? Features.propOf(r, a.getMeta(t, e, s), "vertical_direction")
          : null,
      c = dir(e + h);
    if (c && c !== l)
      return o || "tip_merge" === Features.propOf(r, a.getMeta(t, e + h, s), "thickness")
        ? "tip_merge"
        : "tip";
    if (c !== l) return "tip";
    const p = Features.propOf(r, a.getMeta(t, e + h, s), "thickness");
    return "tip" === p || "tip_merge" === p ? "frustum" : dir(e - h) !== l ? "base" : "middle";
  }
  attachLost(t, e, s, i, o) {
    const a = BLOCKS[i],
      r = a.key;
    if (
      (void 0 === a.attaches &&
        (a.attaches =
          /(^|_)(sign|banner|pressure_plate|carpet|rail|torch|fan|head|skull|button|lantern|amethyst_cluster|amethyst_bud)$|^(ladder|lever|pointed_dripstone|bamboo|redstone_wire|repeater|comparator)$/.test(
            r,
          )),
      !a.attaches)
    )
      return !1;
    const h = this.world,
      P = (t) => Features.propOf(i, o, t),
      gone = (i, o, a) => {
        const r = h.getBlock(t + i, e + o, s + a);
        return 0 === r || !!REPLACEABLE[r] || !!IS_FLUID[r];
      },
      back = (t) => {
        const e = {
          north: [0, 0, 1],
          south: [0, 0, -1],
          west: [1, 0, 0],
          east: [-1, 0, 0],
          up: [0, -1, 0],
          down: [0, 1, 0],
        }[t];
        return !!e && gone(...e);
      };
    if (TORCHLIKE[i] || "lever" === r || /_button$/.test(r) || "ladder" === r || "bamboo" === r)
      return !this.supported(t, e, s, i, o);
    if (IS_WALL_FORM.has(r))
      return !/_wall_(head|skull|hanging_sign)$/.test(r) && back(P("facing"));
    if ("lever" === r || /_button$/.test(r)) {
      const t = P("face");
      return "floor" === t ? gone(0, -1, 0) : "ceiling" === t ? gone(0, 1, 0) : back(P("facing"));
    }
    return "lantern" === r || "soul_lantern" === r || /copper_lantern$/.test(r)
      ? "true" === P("hanging")
        ? gone(0, 1, 0)
        : gone(0, -1, 0)
      : "pointed_dripstone" === r
        ? "down" === P("vertical_direction")
          ? gone(0, 1, 0)
          : gone(0, -1, 0)
        : /_hanging_sign$/.test(r)
          ? gone(0, 1, 0)
          : /(amethyst_cluster|amethyst_bud)$/.test(r) || "ladder" === r
            ? back(P("facing"))
            : !(
                !/(^|_)(sign|banner|pressure_plate|carpet|rail)$/.test(r) &&
                "bamboo" !== r &&
                "redstone_wire" !== r &&
                "repeater" !== r &&
                "comparator" !== r
              ) && gone(0, -1, 0);
  }
  placeState(t, e, s, i, o, a) {
    const r = Features,
      h = t.id,
      l = t.states[0],
      c = ["west", "east", "down", "up", "north", "south"];
    let p = 0;
    const set = (t, e) => {
        t in l && (p = r.withProp(h, p, t, e));
      },
      has = (e, s) => t.states.some((t) => t[e] === s),
      u = c[OPP[s]],
      f = c[s],
      g = e.point[1] - Math.floor(e.point[1]);
    if ("facing" in l)
      if (t.gate) set("facing", f);
      else if (!has("facing", "up") || ("end_rod" !== t.key && "iron_chain" !== t.key))
        if (has("facing", "up")) {
          const t = this.lookDir();
          set("facing", t[1] > 0.8 ? "down" : t[1] < -0.8 ? "up" : u);
        } else set("facing", u);
      else set("facing", c[e.face]);
    return (
      "axis" in l && set("axis", e.face <= 1 ? "x" : e.face <= 3 ? "y" : "z"),
      "rotation" in l &&
        set("rotation", String(15 & Math.floor(16 - (8 * this.player.yaw) / Math.PI + 0.5))),
      "facing" in l && IS_WALL_FORM.has(t.key) && set("facing", c[e.face]),
      "hanging" in l && set("hanging", 2 === e.face ? "true" : "false"),
      "half" in l &&
        has("half", "top") &&
        set("half", 2 === e.face || (3 !== e.face && g > 0.5) ? "top" : "bottom"),
      "face" in l && set("face", 3 === e.face ? "floor" : 2 === e.face ? "ceiling" : "wall"),
      "attachment" in l &&
        set("attachment", 3 === e.face ? "floor" : 2 === e.face ? "ceiling" : "single_wall"),
      2 !== e.face &&
        3 !== e.face &&
        ("face" in l || "attachment" in l) &&
        set("facing", c[e.face]),
      "lit" in l && set("lit", t.key.includes("campfire") ? "true" : "false"),
      "waterlogged" in l && set("waterlogged", "false"),
      p
    );
  }
  lookingDirs(t, e) {
    const s = this.lookDir(),
      i = [
        [Math.abs(s[0]), s[0] > 0 ? 1 : 0],
        [Math.abs(s[1]), s[1] > 0 ? 3 : 2],
        [Math.abs(s[2]), s[2] > 0 ? 5 : 4],
      ]
        .sort((t, e) => e[0] - t[0])
        .map((t) => t[1]),
      o = [i[0], i[1], i[2], OPP[i[2]], OPP[i[1]], OPP[i[0]]];
    if (!e && t) {
      const e = OPP[t.face];
      (o.splice(o.indexOf(e), 1), o.unshift(e));
    }
    return o;
  }
  placeFaces(t, e, s) {
    const i = this.world,
      o = Features,
      a = t.id,
      r = this.survivalR(),
      h = DIRS[e.face],
      l = ["west", "east", "down", "up", "north", "south"],
      c = "vine" === t.key ? [3, 0, 1, 4, 5] : [0, 1, 2, 3, 4, 5],
      full = (t) => c.every((e) => "true" === o.propOf(a, t, l[e])),
      p = !(!REPLACEABLE[e.id] || IS_FLUID[e.id] || (e.id === a && full(i.getMeta(...e.pos)))),
      u = e.pos[0] + (p ? 0 : h[0]),
      f = e.pos[1] + (p ? 0 : h[1]),
      g = e.pos[2] + (p ? 0 : h[2]);
    if (f < 0 || f >= HEIGHT) return;
    const m = i.getBlock(u, f, g),
      k = m === a,
      w = k ? i.getMeta(u, f, g) : 0;
    if ((m && !REPLACEABLE[m]) || (k && full(w))) return;
    const _ = i.getBlock(u, f + 1, g) === a ? i.getMeta(u, f + 1, g) : -1;
    for (const h of this.lookingDirs(e, p)) {
      if (!c.includes(h) || "true" === o.propOf(a, w, l[h])) continue;
      if (!(
        o.sturdy(r, u + DIRS[h][0], f + DIRS[h][1], g + DIRS[h][2], OPP[h], 2) ||
        ("vine" === t.key && 3 !== h && _ >= 0 && "true" === o.propOf(a, _, l[h]))
      ))
        continue;
      const e = m === WATER ? 0 === i.getMeta(u, f, g) : 0 !== m && !k && i.waterAt(u, f, g);
      return (
        this.placeAt(u, f, g, a, o.withProp(a, w, l[h], "true"), s, k),
        void (e && i.getBlock(u, f, g) === a && canWaterlog(a, 0) && i.setWaterlogged(u, f, g, !0))
      );
    }
  }
  survivalR() {
    return (
      this._survR ||
      (this._survR = {
        id: (t, e, s) => this.world.getBlock(t, e, s),
        meta: (t, e, s) => this.world.getMeta(t, e, s),
        water: (t, e, s) => this.world.waterAt(t, e, s),
      })
    );
  }
  supported(t, e, s, i, o) {
    const a = this.world,
      r = a.getBlock(t, e - 1, s),
      h =
        (SOLIDCUBE[r] ||
          (BLOCKS[r].slab && !!(3 & a.getMeta(t, e - 1, s))) ||
          (BLOCKS[r].stairs && a.getMeta(t, e - 1, s)),
        BLOCKS[i]),
      l = this.survivalR(),
      holds = (i, o) =>
        !!DIRS[i] &&
        ("undefined" == typeof Features
          ? !!SOLIDCUBE[a.getBlock(t + DIRS[i][0], e + DIRS[i][1], s + DIRS[i][2])]
          : Features.sturdy(l, t + DIRS[i][0], e + DIRS[i][1], s + DIRS[i][2], OPP[i], o));
    switch (h.key) {
      case "torch":
        return o && DIRS[o] ? holds(o, 0) : holds(2, 1);
      case "ladder":
        return holds(o, 0);
      case "wheat":
        return 63 === r;
      case "cactus":
        return 37 === r || 9 === r || 97 === r;
      case "dead_bush":
        return 9 === r || 97 === r || 3 === r || 2 === r || 83 === r;
      case "snow":
        return (
          (!!SOLIDCUBE[r] && 35 !== r && 96 !== r) || (r === i && !(7 & ~a.getMeta(t, e - 1, s)))
        );
      case "oak_door":
        return 8 & o
          ? 69 === a.getBlock(t, e - 1, s)
          : SOLIDCUBE[r] && 69 === a.getBlock(t, e + 1, s);
    }
    if (h.door)
      return 8 & o
        ? a.getBlock(t, e - 1, s) === i
        : !!SOLIDCUBE[r] && a.getBlock(t, e + 1, s) === i;
    switch (h.key) {
      case "red_mushroom":
      case "brown_mushroom":
        return !!SOLIDCUBE[r];
      case "nether_wart":
        return 120 === r;
    }
    return "undefined" != typeof Features && (h.states || h.id >= 1024 || h.needsSupport)
      ? Features.canSurvive(l, i, o, t, e, s)
      : !h.needsSupport || 2 === r || 3 === r || 63 === r || 88 === r;
  }
  onFizz(t, e, s) {
    Sound.fizz([t, e, s]);
    for (let i = 0; i < 6; i++)
      this.particles.spawn("smoke", t + Math.random(), e + 1, s + Math.random(), 0, 0.05, 0);
  }
  onFluidDestroy(t, e, s, i, o = !0) {
    const a = BLOCKS[i];
    o
      ? a && !REPLACEABLE[i] && "creative" !== this.mode
        ? this.dropBlockLoot(t, e, s, i, this.world.getMeta(t, e, s), null)
        : a && a.drops && 39 !== i && 40 !== i && this.dropBlockLoot(t, e, s, i, 0, null)
      : this.onFizz(t, e - 1, s);
  }
  randomTickTable() {
    if (this.rtTable) return this.rtTable;
    const t = new Uint8Array(MAX_BLOCKS),
      e = "undefined" != typeof BLOCK_RANDOM_TICK ? BLOCK_RANDOM_TICK : {};
    for (const e of [2, 15, 34, 35, 37, 38, 47, 50, 63, 64, 65, 66, 67, 126, 171, LAVA]) t[e] = 1;
    for (let s = 0; s < MAX_BLOCKS; s++) {
      const i = BLOCKS[s],
        o = i && i.key;
      o &&
        (Object.prototype.hasOwnProperty.call(e, o) ||
          (s >= 1024 &&
            (o.endsWith("_leaves") ||
              o.endsWith("_sapling") ||
              "mangrove_propagule" === o ||
              CROP_TICK.test(o)))) &&
        (t[s] = 1);
    }
    return (this.rtTable = t);
  }
  onRandomTick(t, e, s, i, o) {
    const a = this.world;
    switch (i) {
      case 2: {
        const i = a.getBlock(t, e + 1, s);
        if (SOLIDCUBE[i] || IS_FLUID[i]) {
          a.setBlock(t, e, s, 3, 0);
          break;
        }
        if (a.skyAt(t, e + 1, s) >= 9 || a.blockLightAt(t, e + 1, s) >= 9) {
          const i = t + ((3 * Math.random()) | 0) - 1,
            o = e + ((5 * Math.random()) | 0) - 3,
            r = s + ((3 * Math.random()) | 0) - 1;
          3 === a.getBlock(i, o, r) &&
            !SOLIDCUBE[a.getBlock(i, o + 1, r)] &&
            !IS_FLUID[a.getBlock(i, o + 1, r)] &&
            a.getLight(i, o + 1, r) >> 4 >= 4 &&
            a.setBlock(i, o, r, 2, 0);
        }
        break;
      }
      case 64:
        this.cropTick(t, e, s, i);
        break;
      case 65:
      case 66:
      case 67:
        Math.random() < 0.15 &&
          (a.skyAt(t, e, s) >= 9 || a.blockLightAt(t, e, s) >= 9) &&
          ((a.gen2 && this.growTreeV(t, e, s, i)) || this.growTree(t, e, s, i));
        break;
      case 63: {
        let i = !1;
        for (let o = -4; o <= 4 && !i; o++)
          for (let r = -4; r <= 4 && !i; r++)
            for (let h = 0; h <= 1; h++)
              if (a.waterAt(t + o, e + h, s + r)) {
                i = !0;
                break;
              }
        const o = a.getMeta(t, e, s);
        i && !o
          ? a.setMeta(t, e, s, 1)
          : i ||
            (o
              ? a.setMeta(t, e, s, 0)
              : 64 !== a.getBlock(t, e + 1, s) &&
                ("undefined" == typeof Features ||
                  !Features.tagSet("maintains_farmland").has(a.getBlock(t, e + 1, s))) &&
                Math.random() < 0.3 &&
                a.setBlock(t, e, s, 3, 0));
        break;
      }
      case 38:
      case 37:
        if (0 === a.getBlock(t, e + 1, s) && Math.random() < 0.08) {
          let o = 1;
          for (; a.getBlock(t, e - o, s) === i;) o++;
          o < 3 &&
            (38 !== i || this.supported(t, e - o + 1, s, i, 0)) &&
            a.setBlock(t, e + 1, s, i, 0);
        }
        break;
      case 15:
      case 47:
      case 50:
        if (4 & a.getMeta(t, e, s)) break;
        this.nearLog(t, e, s) || this.breakBlock(t, e, s, !0, !0);
        break;
      default: {
        const o = BLOCKS[i];
        if (!o || i < 1024) break;
        o.key.endsWith("_leaves")
          ? 4 & a.getMeta(t, e, s) || this.nearLog(t, e, s) || this.breakBlock(t, e, s, !0, !0)
          : (o.key.endsWith("_sapling") || "mangrove_propagule" === o.key) &&
              Math.random() < 0.15 &&
              (a.skyAt(t, e, s) >= 9 || a.blockLightAt(t, e, s) >= 9)
            ? this.growTreeV(t, e, s, i)
            : CROP_TICK.test(o.key) && this.cropTick(t, e, s, i);
        break;
      }
      case 171:
        this.fireTick(t, e, s);
        break;
      case LAVA:
        this.lavaTick(t, e, s);
        break;
      case 126: {
        const i = a.getMeta(t, e, s);
        i < 3 && Math.random() < 0.15 && a.setMeta(t, e, s, i + 1);
        break;
      }
      case 34:
      case 35:
        (a.blockLightAt(t, e, s) > 11 || (35 === i && a.blockLightAt(t, e + 1, s) > 11)) &&
          (35 === i ? a.setBlock(t, e, s, WATER, 0) : a.setBlock(t, e, s, 0, 0));
    }
  }
  cropTick(t, e, s, i) {
    const o = this.world,
      a = BLOCKS[i],
      r = a.key,
      h = o.getMeta(t, e, s),
      light = (e) => Math.max(o.skyAt(t, e, s), o.blockLightAt(t, e, s)),
      l = 64 === i ? h : +Features.propOf(i, h, "age"),
      setAge = (a) => o.setMeta(t, e, s, 64 === i ? a : Features.withProp(i, h, "age", String(a)));
    if (isNaN(l)) return;
    if ("pitcher_crop" === r)
      return void (
        "lower" === Features.propOf(i, h, "half") &&
        Math.random() * (Math.floor(25 / this.cropSpeed(t, e, s, i)) + 1) < 1 &&
        this.growPitcher(t, e, s, i)
      );
    if ("sweet_berry_bush" === r)
      return void (l < 3 && Math.random() < 0.2 && light(e + 1) >= 9 && setAge(l + 1));
    if (("beetroots" === r || "torchflower_crop" === r) && Math.random() < 1 / 3) return;
    if (light(e) < 9 || Math.random() * (Math.floor(25 / this.cropSpeed(t, e, s, i)) + 1) >= 1)
      return;
    if ("melon_stem" === r || "pumpkin_stem" === r) {
      if (l < 7) return void setAge(l + 1);
      const i = [
          [0, -1, "north"],
          [0, 1, "south"],
          [-1, 0, "west"],
          [1, 0, "east"],
        ][(4 * Math.random()) | 0],
        a = BID["melon_stem" === r ? "melon" : "pumpkin"],
        h = BID["attached_" + r],
        c = t + i[0],
        p = s + i[1];
      return void (
        void 0 !== a &&
        void 0 !== h &&
        0 === o.getBlock(c, e, p) &&
        Features.tagSet("supports_" + r + "_fruit").has(o.getBlock(c, e - 1, p)) &&
        (o.setBlock(c, e, p, a, 0), o.setBlock(t, e, s, h, Features.withProp(h, 0, "facing", i[2])))
      );
    }
    l < (64 === i ? 7 : Math.max(...a.states.map((t) => +t.age).filter((t) => !isNaN(t))))
      ? setAge(l + 1)
      : "torchflower_crop" === r &&
        void 0 !== BID.torchflower &&
        o.setBlock(t, e, s, BID.torchflower, 0);
  }
  growPitcher(t, e, s, i) {
    const o = this.world,
      a = o.getMeta(t, e, s),
      r = +Features.propOf(i, a, "age");
    if (!(r < 4) || Math.max(o.skyAt(t, e, s), o.blockLightAt(t, e, s)) < 8 || e + 1 >= HEIGHT)
      return !1;
    const h = o.getBlock(t, e + 1, s);
    if (r + 1 >= 3 && 0 !== h && h !== i) return !1;
    const l = Features.withProp(i, a, "age", String(r + 1));
    return (
      o.setMeta(t, e, s, l),
      r + 1 >= 3 &&
        (h === i
          ? o.setMeta(t, e + 1, s, Features.withProp(i, l, "half", "upper"))
          : o.setBlock(t, e + 1, s, i, Features.withProp(i, l, "half", "upper"))),
      !0
    );
  }
  cropSpeed(t, e, s, i) {
    const o = this.world;
    let a = 1;
    for (let i = -1; i <= 1; i++)
      for (let r = -1; r <= 1; r++) {
        const h =
          63 === o.getBlock(t + i, e - 1, s + r) ? (o.getMeta(t + i, e - 1, s + r) ? 3 : 1) : 0;
        a += i || r ? h / 4 : h;
      }
    const at = (a, r) => o.getBlock(t + a, e, s + r) === i;
    return (
      (((at(-1, 0) || at(1, 0)) && (at(0, -1) || at(0, 1))) ||
        at(-1, -1) ||
        at(1, -1) ||
        at(1, 1) ||
        at(-1, 1)) &&
        (a /= 2),
      a
    );
  }
  tallSeagrass(t, e, s) {
    const i = BID.tall_seagrass;
    (this.world.setBlock(t, e, s, i, Features.withProp(i, 0, "half", "lower")),
      this.world.setBlock(t, e + 1, s, i, Features.withProp(i, 0, "half", "upper")));
  }
  spreadPickles(t, e, s) {
    const i = this.world,
      o = BID.sea_pickle,
      a = Features.tagSet("coral_blocks"),
      state = (t) =>
        Math.max(
          0,
          BLOCKS[o].states.findIndex((e) => e.pickles === String(t) && "false" !== e.waterlogged),
        );
    for (let r = 0, h = 1, l = 0; r < 5; r++) {
      for (let c = 0; c < h; c++)
        for (let h = e - 1; h <= e; h++) {
          const p = t - 2 + r,
            u = s - l + c;
          (p !== t || h !== e || u !== s) &&
            Math.random() < 1 / 6 &&
            i.getBlock(p, h, u) === WATER &&
            a.has(i.getBlock(p, h - 1, u)) &&
            (i.setBlock(p, h, u, o, state(1 + ((4 * Math.random()) | 0))),
            i.setWaterlogged(p, h, u, !0));
        }
      r < 2 ? ((h += 2), l++) : ((h -= 2), l--);
    }
    i.setMeta(t, e, s, Features.withProp(o, i.getMeta(t, e, s), "pickles", "4"));
  }
  growWaterPlant(t, e, s, i) {
    const o = this.world,
      rnd = (t) => (Math.random() * t) | 0;
    if (o.getBlock(t, e, s) !== WATER || 0 !== o.getMeta(t, e, s) || void 0 === BID.seagrass)
      return !1;
    const a = { id: (t, e, s) => o.getBlock(t, e, s) },
      any = (t) => {
        const e = [...Features.tagSet(t)];
        return e.length ? e[rnd(e.length)] : BID.seagrass;
      },
      r = ["west", "east", "down", "up", "north", "south"];
    t: for (let h = 0; h < 128; h++) {
      let l = t,
        c = e,
        p = s;
      for (let t = 0; t < h >> 4; t++)
        if (
          ((l += rnd(3) - 1),
          (c += Math.trunc(((rnd(3) - 1) * rnd(3)) / 2)),
          (p += rnd(3) - 1),
          SOLIDCUBE[o.getBlock(l, c, p)])
        )
          continue t;
      let u = BID.seagrass,
        f = 0;
      if (
        /warm_ocean/.test(biomeName(this, l, p)) &&
        (0 === h && 2 !== i && 3 !== i
          ? ((u = any("wall_corals")), (f = Features.withProp(u, 0, "facing", r[i])))
          : 0 === rnd(4) && (u = any("underwater_bonemeals")),
        /_wall_fan$/.test(BLOCKS[u].key))
      )
        for (let t = 0; t < 4 && !Features.canSurvive(a, u, f, l, c, p); t++)
          f = Features.withProp(u, f, "facing", r[[0, 1, 4, 5][rnd(4)]]);
      if (c < 1 || c >= HEIGHT || !Features.canSurvive(a, u, f, l, c, p)) continue;
      const g = o.getBlock(l, c, p);
      g === WATER && 0 === o.getMeta(l, c, p)
        ? o.setBlock(l, c, p, u, f)
        : g === BID.seagrass &&
          void 0 !== BID.tall_seagrass &&
          o.getBlock(l, c + 1, p) === WATER &&
          0 === rnd(10) &&
          this.tallSeagrass(l, c, p);
    }
    return !0;
  }
  nearLog(t, e, s) {
    const i = this.world,
      o = new Set([`${t},${e},${s}`]),
      a = [[t, e, s, 0]];
    for (; a.length;) {
      const [t, e, s, r] = a.shift();
      for (const h of DIRS) {
        const l = t + h[0],
          c = e + h[1],
          p = s + h[2],
          u = `${l},${c},${p}`;
        if (o.has(u)) continue;
        if ((o.add(u), !i.isLoaded(l, p))) return !0;
        const f = i.getBlock(l, c, p);
        if (14 === f || 46 === f || 49 === f || LOG_IDS.has(f)) return !0;
        (15 === f || 47 === f || 50 === f || LEAF_IDS.has(f)) && r < 6 && a.push([l, c, p, r + 1]);
      }
    }
    return !1;
  }
  growTree(t, e, s, i) {
    const o = this.world,
      a = 66 === i ? "birch" : 67 === i ? "spruce" : Math.random() < 0.1 ? "big" : "oak",
      r = 4 + ((3 * Math.random()) | 0);
    for (let i = 1; i <= r + 1; i++) {
      const a = o.getBlock(t, e + i, s);
      if (a && !BLOCKS[a].replaceable && 15 !== a && 47 !== a && 50 !== a) return !1;
    }
    return (
      o.setBlock(t, e, s, 0, 0, 0),
      this.world.placeTree(
        (t, e, s, i, a, r) => {
          const h = o.getBlock(t, e, s);
          (r ? 6 !== h : 0 === h || REPLACEABLE[h]) && o.setBlock(t, e, s, i, a);
        },
        { x: t, y: e, z: s, type: a, h: r, seed: (1e9 * Math.random()) | 0 },
      ),
      !0
    );
  }
  spawnMobs() {
    "creative" === this.mode && this.settings.creativeMobs;
    const t = this.player,
      e = this.world,
      s = this.entities.filter((t) => t instanceof Mob && t.T.hostile).length,
      i = this.entities.filter((e) => e instanceof Mob && e.T.passive && e.distTo(t) < 96).length,
      o = this.daylight();
    for (let a = 0; a < 3; a++) {
      const a = Math.random() * Math.PI * 2,
        r = 24 + 40 * Math.random(),
        h = Math.floor(t.pos[0] + Math.sin(a) * r),
        l = Math.floor(t.pos[2] + Math.cos(a) * r);
      if (!e.isLoaded(h, l)) continue;
      const c = e.surfaceY(h, l);
      let p = c + 1;
      if (Math.random() < 0.5) {
        const t = 8 + Math.floor(Math.random() * Math.max(1, c - 10));
        0 === e.getBlock(h, t, l) &&
          0 === e.getBlock(h, t + 1, l) &&
          BLOCKS[e.getBlock(h, t - 1, l)].solid &&
          (p = t);
      }
      if (
        0 !== e.getBlock(h, p, l) ||
        0 !== e.getBlock(h, p + 1, l) ||
        !SOLIDCUBE[e.getBlock(h, p - 1, l)]
      )
        continue;
      const u = e.getLight(h, p, l),
        f = (u >> 4) * o;
      if (
        0 === (15 & u) &&
        f <= 7 &&
        s < 22 &&
        this.difficulty > 0 &&
        Math.random() < 0.6 &&
        Math.hypot(h - t.pos[0], l - t.pos[2]) > 24
      ) {
        const t = Math.random(),
          e = createMob(
            this,
            t < 0.32
              ? "zombie"
              : t < 0.55
                ? "skeleton"
                : t < 0.76
                  ? "creeper"
                  : t < 0.89
                    ? "spider"
                    : "enderman",
            h + 0.5,
            p,
            l + 0.5,
          );
        ((e.persistent = !1), e.collides(e.box()) || this.entities.push(e));
      } else if (
        i < 12 &&
        o > 0.8 &&
        2 === e.getBlock(h, p - 1, l) &&
        f >= 9 &&
        Math.random() < 0.02
      ) {
        const t = ["pig", "cow", "sheep", "chicken"][(4 * Math.random()) | 0];
        for (let e = 0; e < 2 + 2 * Math.random(); e++)
          this.entities.push(new Mob(this, t, h + 0.5 + Math.random(), p, l + 0.5 + Math.random()));
      }
    }
  }
  tickFurnaces() {
    for (const [t, e] of this.blockEntities) {
      if ("furnace" !== e.type) continue;
      const [t, s, i] = e.pos;
      if (!this.world.isLoaded(t, i)) continue;
      const o = e.burn > 0;
      e.burn > 0 && e.burn--;
      const a = e.kind || "smelting",
        r = e.input && COOKING[a][e.input.id];
      e.cookMax = (r && r.time) || e.cookMax || 200;
      const h =
        r && (!e.output || (e.output.id === r.result && e.output.count < maxStack(r.result)));
      if (0 === e.burn && h && e.fuel) {
        const t = Math.floor(fuelValue(e.fuel.id) / ("smelting" === a ? 1 : 2));
        t &&
          ((e.burn = e.burnMax = t),
          e.fuel.id === item("lava_bucket")
            ? (e.fuel = makeStack("bucket"))
            : (e.fuel.count--, e.fuel.count || (e.fuel = null)));
      }
      e.burn > 0 && h
        ? ++e.cook >= e.cookMax &&
          ((e.cook = 0),
          e.output ? e.output.count++ : (e.output = { id: r.result, count: 1, dmg: 0 }),
          (e.xp = (e.xp || 0) + r.xp),
          e.input.count--,
          e.input.count || (e.input = null))
        : e.cook > 0 && (e.cook = Math.max(0, e.cook - 2));
      const l = e.burn > 0;
      if (l !== o) {
        const e = this.world.getBlock(t, s, i),
          o = this.world.getMeta(t, s, i),
          a = BLOCKS[e];
        20 === e || 117 === e
          ? this.world.setBlock(t, s, i, l ? 117 : 20, o, 0)
          : a &&
            a.states &&
            "lit" in a.states[0] &&
            this.world.setMeta(t, s, i, Features.withProp(e, o, "lit", l ? "true" : "false"));
      }
    }
  }
  markBlockEntity() {}
  getBlockEntity(t, e, s, i) {
    const o = `${t},${e},${s}`;
    let a = this.blockEntities.get(o);
    return (
      a ||
        ((a =
          "chest" === i
            ? { type: i, pos: [t, e, s], slots: new Array(27).fill(null) }
            : {
                type: i,
                pos: [t, e, s],
                input: null,
                fuel: null,
                output: null,
                burn: 0,
                burnMax: 0,
                cook: 0,
              }),
        this.blockEntities.set(o, a)),
      a
    );
  }
  trySleep(t, e, s) {
    const i = this.player,
      o = this.world,
      a = o.getMeta(t, e, s);
    let r = t,
      h = s;
    const l = DIRS[[4, 1, 5, 0][3 & a]];
    if (
      (4 & a || ((r += l[0]), (h += l[2])), Math.hypot(i.pos[0] - r - 0.5, i.pos[2] - h - 0.5) > 3)
    )
      return void (this.ui.actionBar = { text: "你离床太远了", t: performance.now() });
    const choke = (t, s) => {
      const i = o.getBlock(t, e + 1, s);
      return !(!SOLIDCUBE[i] || !AOCUBE[i]);
    };
    if (choke(r, h) || choke(r - l[0], h - l[2]))
      return void (this.ui.actionBar = { text: "这张床已被阻挡", t: performance.now() });
    ((i.spawn = [r, e + 1, h]), (i.bedSpawn = !0), (i.spawnYaw = i.yaw));
    const c = clamp(this.weather || 0, 0, 1),
      p = this.thunder ? c : 0,
      u = this.dayTime() < 133 ? this.dayTime() + 24e3 : this.dayTime(),
      f = 0.26666668;
    let g =
      15 *
      (u <= 11867
        ? 1
        : u < 13670
          ? 1 + ((f - 1) * (u - 11867)) / 1803
          : u <= 22330
            ? f
            : f + ((1 - f) * (u - 22330)) / 1803);
    if (
      ((g += 0.3125 * (c - p) * (4 - g)), (g += 0.52734375 * p * (4 - g)), Math.floor(15 - g) < 4)
    )
      return void (this.ui.actionBar = {
        text: "你只能在夜间或雷暴中入睡（已设置重生点）",
        t: performance.now(),
      });
    this.entities.some(
      (t) =>
        t instanceof Mob &&
        t.T.hostile &&
        0 === t.deathTime &&
        Math.abs(t.pos[0] - r) < 8 &&
        Math.abs(t.pos[1] - e) < 5 &&
        Math.abs(t.pos[2] - h) < 8,
    )
      ? (this.ui.actionBar = {
          text: "你现在不能休息，周围有怪物在游荡",
          t: performance.now(),
          color: "#FF5555",
        })
      : ((this.sleeping = {
          x: r + 0.5,
          y: e + 0.5625,
          z: h + 0.5,
          t: 0,
          rot: 3 & a,
          bed: [r, e, h],
        }),
        (i.vel = [0, 0, 0]),
        (i.hurtTime = 0),
        this.ui.message(
          "正在睡觉…（" + (touchOn(this) ? "点击潜行按钮" : "按 Shift ") + "起床）",
          "#AAAAAA",
        ));
  }
  tickSleep() {
    const t = this.sleeping,
      e = this.player;
    if (!t)
      return (this.sleepFade > 0 && (this.sleepFade = Math.max(0, this.sleepFade - 0.05)), !1);
    (t.t++,
      (e.pos = [t.x, t.y, t.z]),
      (e.prev = [...e.pos]),
      (e.vel = [0, 0, 0]),
      (e.fallDist = 0),
      (this.sleepFade = Math.min(1, t.t / 80)));
    const s = bindDown(this, "sneak") || e.hurtTime > 0;
    return t.net
      ? ((this.sleepFade = Math.min(0.7, this.sleepFade)),
        s && !t.asked && this.net && ((t.asked = !0), this.net.send({ t: "wake" })),
        !0)
      : (t.t >= 100 &&
          ((this.worldTime = 24e3 * (Math.floor(this.worldTime / 24e3) + 1)),
          this.rainTarget && ((this.rainTarget = 0), (this.weather = 0)),
          (this.thunder = !1),
          this.ui.message("早上好！", "#FFFF55"),
          this.grant("sleep")),
        (t.t >= 100 || s) && ((this.sleeping = null), this.standUp(t)),
        !0);
  }
  standUp(t) {
    const e = this.player;
    e.h = PLAYER_H.stand;
    const s = t.bed && this.world && BLOCKS[this.world.getBlock(t.bed[0], t.bed[1], t.bed[2])];
    ((e.pos = (s && s.bed && this.bedStandUp(t.bed, t.rot, e.yaw)) || [t.x, t.y, t.z]),
      (e.prev = [...e.pos]),
      (e.vel = [0, 0, 0]),
      s && s.bed && this.faceBed(t.bed));
  }
  faceBed(t) {
    const e = this.player,
      s = t[0] + 0.5 - e.pos[0],
      i = t[2] + 0.5 - e.pos[2];
    (s * s + i * i > 1e-6 && (e.yaw = Math.atan2(-s, -i)), (e.pitch = 0));
  }
  bedStandUp(t, e, s) {
    const i = this.player,
      o = DIRS[[4, 1, 5, 0][3 & e]],
      a = o[0],
      r = o[2];
    let h = -r,
      l = a;
    -Math.sin(s) * h - Math.cos(s) * l > 0 && ((h = -h), (l = -l));
    const c = [
      [h, l],
      [h - a, l - r],
      [h - 2 * a, l - 2 * r],
      [-2 * a, -2 * r],
      [-h - 2 * a, -l - 2 * r],
      [-h - a, -l - r],
      [-h, -l],
      [-h + a, -l + r],
      [a, r],
      [h + a, l + r],
      [0, 0],
      [-a, -r],
    ];
    for (const e of [!0, !1])
      for (const [s, o] of c) {
        const a = safeStandAt(i, t[0] + s, t[1], t[2] + o, e);
        if (a) return a;
      }
    return null;
  }
  fillLoot(t, e, s, i) {
    const o = RNG(hashStr("loot" + this.world.seed + ":" + e + ":" + s + ":" + i));
    if (t.loot)
      return ("undefined" != typeof Loot && Loot.fill(t.slots, t.loot, o), void delete t.loot);
    const a = [
      ["bread", 1, 3, 0.5],
      ["wheat", 1, 4, 0.5],
      ["iron_ingot", 1, 4, 0.55],
      ["gold_ingot", 1, 3, 0.35],
      ["coal", 3, 8, 0.5],
      ["string", 1, 4, 0.4],
      ["bone", 2, 6, 0.5],
      ["rotten_flesh", 2, 5, 0.5],
      ["gunpowder", 1, 4, 0.4],
      ["diamond", 1, 2, 0.2],
      ["golden_apple", 1, 1, 0.12],
      ["bucket", 1, 1, 0.15],
      ["iron_pickaxe", 1, 1, 0.08],
      ["apple", 1, 3, 0.3],
      ["redstone", 2, 6, 0.25],
      ["emerald", 1, 2, 0.12],
      ["wheat_seeds", 2, 5, 0.3],
      ["iron_chestplate", 1, 1, 0.06],
      ["bow", 1, 1, 0.1],
      ["arrow", 4, 12, 0.25],
    ];
    for (const [e, s, i, r] of a) {
      if (o() > r) continue;
      let a = o.int(27),
        h = 0;
      for (; t.slots[a] && h++ < 30;) a = o.int(27);
      t.slots[a] = makeStack(e, s + o.int(i - s + 1));
    }
  }
  onSmeltTake(t, e) {
    const s = t.id;
    if (
      (s === item("iron_ingot") && this.grant("iron"),
      ["cooked_beef", "cooked_porkchop", "cooked_mutton", "cooked_chicken"].some(
        (t) => item(t) === s,
      ) && this.grant("cook"),
      e.xp)
    ) {
      const t = this.player;
      (this.dropXp(t.pos[0], t.pos[1] + 0.5, t.pos[2], Math.floor(e.xp + Math.random())),
        (e.xp = 0));
    }
  }
  onCraft(t, e) {
    const s = ITEMS[t].key;
    (s.endsWith("_planks") && this.tutStat && (this.tutStat.planks = !0),
      "crafting_table" === s && this.grant("crafting_table"),
      "wooden_pickaxe" === s && this.grant("pickaxe"),
      "stone_pickaxe" === s && this.grant("stone_pickaxe"),
      "furnace" === s && this.grant("furnace"),
      "bread" === s && this.grant("bread"),
      "bow" === s && this.grant("bow"));
  }
  onPickup(t, e) {
    const s = ITEMS[t].key;
    (s.endsWith("_log") && this.grant("wood"),
      "diamond" === s && this.grant("diamond"),
      "wheat" === s && this.grant("farm"),
      "blaze_rod" === s && this.grant("blaze_rod"),
      "dragon_egg" === s && this.grant("next_gen"));
  }
  onMobKilled(t, e) {
    if (e && (e.attacker === this.player || e.player)) {
      const e = t.T.hostile ? 5 : 1 + ((3 * Math.random()) | 0);
      (t.T.hostile && this.grant("kill"), this.dropXp(t.pos[0], t.pos[1] + 0.5, t.pos[2], e));
    }
  }
  onPlayerHurt(t) {
    this.hurtTilt = 1;
  }
  onPlayerDeath(t) {
    const e = this.player;
    let s =
      {
        in_wall: "在墙里窒息而亡",
        fall: "从高处摔了下来",
        lava: "试图在熔岩里游泳",
        fire: "被烧死了",
        drown: "淹死了",
        starve: "饿死了",
        mob: "被杀死了",
        arrow: "被射杀",
        explosion: "爆炸了",
        cactus: "被戳死了",
        void: "掉出了这个世界",
        hotFloor: "发现了地板是熔岩做的",
        lightning: "被闪电击中",
        freeze: "被冻死了",
        berry: "被甜浆果丛戳死了",
        firework: "随着一声巨响消失了",
      }[t && t.type] || "死了";
    (t &&
      t.attacker &&
      t.attacker.T &&
      (s =
        "arrow" === t.type ? "被" + t.attacker.T.cn + "射杀" : "被" + t.attacker.T.cn + "杀死了"),
      t &&
        "explosion" === t.type &&
        t.attacker &&
        t.attacker.T &&
        (s = "被" + t.attacker.T.cn + "炸死了"),
      (this.deathMsg = "玩家" + s),
      this.ui.message(this.deathMsg, "#FFFFFF"));
    for (let t = 0; t < 41; t++) {
      const s = e.inv.slots[t];
      s && enchLevel(s, "vanishing_curse")
        ? (e.inv.slots[t] = null)
        : s &&
          (this.dropItem(e.pos[0], e.pos[1] + 1, e.pos[2], s, [
            0.5 * (Math.random() - 0.5),
            0.3,
            0.5 * (Math.random() - 0.5),
          ]),
          (e.inv.slots[t] = null));
    }
    ((this.deathScore = e.xp),
      (e.xp = 0),
      e.clearEffects && e.clearEffects(),
      setTimeout(() => {
        "play" === this.state && this.ui.open(new DeathScreen(this));
      }, 1e3));
  }
  respawn() {
    const t = this.player,
      e = t.spawn;
    if (this.net) return (this.net.send({ t: "respawn" }), (t.deathTime = 0), void this.ui.close());
    ((t.health = 20),
      (t.food = 20),
      (t.saturation = 5),
      (t.deathTime = 0),
      (t.fire = 0),
      (t.air = 300),
      (t.fallDist = 0),
      (t.dead = !1),
      this.ui.close(),
      "overworld" === this.dim
        ? ((t.pos = [e[0] + 0.5, e[1], e[2] + 0.5]),
          (t.prev = [...t.pos]),
          (t.vel = [0, 0, 0]),
          (t.respawnGround = !0),
          this.respawnSettle())
        : this.changeDimension("overworld", [e[0] + 0.5, e[1], e[2] + 0.5], () => {
            ((t.respawnGround = !0), this.respawnSettle());
          }));
  }
  inWallBlock() {
    const t = this.player,
      e = this.world;
    if (!t || !e) return 0;
    const s = Math.floor(t.pos[1] + t.eye()),
      i = 0.4 * t.w;
    for (const [o, a] of [
      [-i, -i],
      [i, -i],
      [-i, i],
      [i, i],
    ]) {
      const i = e.getBlock(Math.floor(t.pos[0] + o), s, Math.floor(t.pos[2] + a));
      if (SOLIDCUBE[i] && AOCUBE[i]) return i;
    }
    return 0;
  }
  respawnSettle() {
    const t = this.player,
      e = this.world,
      s = Math.floor(t.pos[0]),
      i = Math.floor(t.pos[2]);
    if (!e.isLoaded(s, i) || !e.isLoaded(s + 16, i) || !e.isLoaded(s - 16, i)) return;
    if (t.bedSpawn) {
      if (!e.isLoaded(s, i + 16) || !e.isLoaded(s, i - 16)) return;
      const o = t.spawn,
        a = e.getMeta(o[0], o[1] - 1, o[2]),
        r = [o[0], o[1] - 1, o[2]];
      if (!(4 & a)) {
        const t = DIRS[[4, 1, 5, 0][3 & a]];
        ((r[0] += t[0]), (r[2] += t[2]));
      }
      const h = BLOCKS[e.getBlock(o[0], o[1] - 1, o[2])],
        l = h && h.bed && this.bedStandUp(r, 3 & a, t.spawnYaw ?? t.yaw);
      if (l)
        return (
          (t.pos = l),
          (t.prev = [...l]),
          (t.vel = [0, 0, 0]),
          (t.respawnGround = !1),
          void this.faceBed(r)
        );
      ((t.bedSpawn = !1),
        (t.spawn = (this.worldMeta && this.worldMeta.spawn) || o),
        this.ui.message("你的床已丢失或被阻挡", "#FFFFFF"));
      const c = t.spawn;
      return (
        (t.pos = [c[0] + 0.5, c[1], c[2] + 0.5]),
        (t.prev = [...t.pos]),
        (t.vel = [0, 0, 0]),
        this.respawnSettle()
      );
    }
    if (((t.respawnGround = !1), t.flying || t.noClip)) return;
    let o = Math.floor(t.pos[1]);
    for (; t.collides(t.box()) && o < HEIGHT;) (o++, (t.pos[1] = o));
    const solid = (t) => {
      const o = e.getBlock(s, t, i);
      return !(!BLOCKS[o] || !BLOCKS[o].solid) || IS_FLUID[o];
    };
    let a = o - 1;
    for (; a > 0 && !solid(a);) a--;
    (o - 1 - a > 1 && a > 0 && ((t.pos[1] = a + 1), (t.vel = [0, 0, 0]), (t.fallDist = 0)),
      (t.prev = [...t.pos]));
  }
  dropItem(t, e, s, i, o) {
    if (!(i = knownStack(i, this, "drop"))) return;
    const a = new ItemEntity(this, t, e, s, { ...i, dmg: i.dmg || 0 }, o);
    return (this.entities.push(a), a);
  }
  dropFromPlayer(t) {
    const e = this.player,
      s = this.lookDir(),
      i = this.dropItem(e.pos[0], e.pos[1] + e.eye() - 0.3, e.pos[2], t, [
        0.3 * s[0],
        0.3 * s[1] + 0.1,
        0.3 * s[2],
      ]);
    i && (i.pickup = 40);
  }
  addEntity(t) {
    this.entities.push(t);
  }
  dropBlockLoot(t, e, s, i, o, a) {
    const r = BLOCKS[i];
    let h;
    if (
      a &&
      "shears" === ITEMS[a.id].key &&
      (r.shearsDrop ||
        r.key.endsWith("leaves") ||
        39 === i ||
        40 === i ||
        45 === i ||
        "cobweb" === r.key)
    )
      h =
        "function" == typeof r.shearsDrop
          ? r.shearsDrop(o, Math.random, a)
          : [[r.shearsDrop || i, 1]];
    else if (r.drops && enchLevel(a, "silk_touch") && ITEMS[i] && !r.noItem && !NO_SILK.has(r.key))
      h = [[i, 1]];
    else if (r.drops) {
      h = r.drops(o, Math.random, a);
      const t = enchLevel(a, "fortune");
      t &&
        /_ore$/.test(r.key) &&
        (h = h.map(([e, s]) => [e, e === i || e === r.key ? s : fortuneCount(s, t)]));
    } else h = r.noItem ? [] : [[i, 1]];
    for (const [i, o] of h)
      o > 0 &&
        this.dropItem(
          t + 0.5 + 0.3 * (Math.random() - 0.5),
          e + 0.3,
          s + 0.5 + 0.3 * (Math.random() - 0.5),
          makeStack(i, o),
        );
  }
  explode(t, e, s, i, o, a, r, h, dmgFn) {
    const l = this.world;
    (Sound.explode([t, e, s]), o instanceof PrimedTNT && this.grant("tnt"));
    const c = new Set();
    if (!(a || (h && this.rule && !1 === this.rule("mob_griefing")))) {
      const o = Math.random;
      for (let a = 0; a < 16; a++)
        for (let r = 0; r < 16; r++)
          for (let h = 0; h < 16; h++) {
            if (a > 0 && a < 15 && r > 0 && r < 15 && h > 0 && h < 15) continue;
            let p = (a / 15) * 2 - 1,
              u = (r / 15) * 2 - 1,
              f = (h / 15) * 2 - 1;
            const g = Math.hypot(p, u, f);
            ((p /= g), (u /= g), (f /= g));
            let m = i * (0.7 + 0.6 * o()),
              k = t,
              w = e,
              _ = s;
            for (; m > 0;) {
              const t = Math.floor(k),
                e = Math.floor(w),
                s = Math.floor(_),
                i = l.getBlock(t, e, s);
              if (i) {
                const o = BLOCKS[i];
                ((m -= 0.3 * ((IS_FLUID[i] ? 100 : blastRes(o)) + 0.3)),
                  m > 0 && e >= 0 && c.add(t + "," + e + "," + s));
              }
              ((k += 0.3 * p), (w += 0.3 * u), (_ += 0.3 * f), (m -= 0.225));
            }
          }
    }
    this.blasting = c;
    try {
      for (const t of c) {
        const [e, s, o] = t.split(",").map(Number),
          a = l.getBlock(e, s, o);
        if (!a || IS_FLUID[a]) continue;
        if (26 === a) {
          (l.setBlock(e, s, o, 0, 0),
            this.entities.push(new PrimedTNT(this, e, s, o, 10 + ((20 * Math.random()) | 0))));
          continue;
        }
        const r = BLOCKS[a],
          h = l.getMeta(e, s, o),
          p = r.states && r.states[h] && r.states[h].half;
        let u = null;
        if (r.door) u = [e, 8 & h ? s - 1 : s + 1, o];
        else if ("upper" === p || "lower" === p) u = [e, "upper" === p ? s - 1 : s + 1, o];
        else if (r.bed) {
          const t = [4, 1, 5, 0][3 & h],
            i = DIRS[4 & h ? OPP[t] : t];
          u = [e + i[0], s, o + i[2]];
        }
        let f = [e, s, o, h];
        if (u && l.getBlock(u[0], u[1], u[2]) === a) {
          const t = l.getMeta(u[0], u[1], u[2]);
          (((r.door && 8 & h) || "upper" === p || (r.bed && !(4 & h))) &&
            (f = [u[0], u[1], u[2], t]),
            c.delete(u.join(",")),
            (this.pairBreak = e + "," + s + "," + o));
          try {
            l.setBlock(u[0], u[1], u[2], WLOG[a] ? WATER : 0, 0);
          } finally {
            this.pairBreak = null;
          }
        }
        (Math.random() < 1 / i &&
          "creative" !== this.mode &&
          this.dropBlockLoot(f[0], f[1], f[2], a, f[3], null),
          l.setBlock(e, s, o, 0, 0));
      }
    } finally {
      this.blasting = null;
    }
    if (r)
      for (const t of c) {
        const [e, s, i] = t.split(",").map(Number);
        Math.random() < 0.33 &&
          0 === l.getBlock(e, s, i) &&
          SOLIDCUBE[l.getBlock(e, s - 1, i)] &&
          l.setBlock(e, s, i, this.fireIdAt(e, s, i), 0);
      }
    const p = 2 * i;
    for (const i of [...this.entities, this.player]) {
      if (i === o) continue;
      const a = Math.hypot(i.pos[0] - t, i.pos[1] + i.h / 2 - e, i.pos[2] - s);
      if (a > p) continue;
      const r = (1 - a / p) * this.blastSeen(t, e, s, i);
      if (r <= 0) continue;
      const h = [
        (i.pos[0] - t) / (a || 1),
        (i.pos[1] + i.h / 2 - e) / (a || 1),
        (i.pos[2] - s) / (a || 1),
      ];
      if (i instanceof Living)
        i.hurt(
          dmgFn
            ? Math.floor(dmgFn(a, p, i)) // W12a: 可选自定义伤害曲线（破片 60→8 线性，07-§7.2）
            : Math.floor(((r * r + r) / 2) * 7 * p + 1),
          {
            type: "explosion",
            attacker: o && o.T ? o : null,
            knockFrom: [t, e, s],
            knock: 0,
          },
        );
      else if (i.hittable && i instanceof EndCrystal && !i.dead) {
        setTimeout(() => i.hurt(1, { type: "explosion" }), 50);
        continue;
      }
      i instanceof EnderDragon ||
        i instanceof EndCrystal ||
        ((i.vel[0] += h[0] * r), (i.vel[1] += h[1] * r + 0.1), (i.vel[2] += h[2] * r));
    }
    for (let o = 0; o < 24; o++)
      this.particles.spawn(
        "explosion",
        t + (Math.random() - 0.5) * i * 1.5,
        e + (Math.random() - 0.5) * i * 1.5,
        s + (Math.random() - 0.5) * i * 1.5,
        0,
        0,
        0,
      );
    for (let o = 0; o < 40; o++)
      this.particles.spawn(
        "smoke",
        t + (Math.random() - 0.5) * i * 2,
        e + (Math.random() - 0.5) * i * 2,
        s + (Math.random() - 0.5) * i * 2,
        0.3 * (Math.random() - 0.5),
        0.2 * Math.random(),
        0.3 * (Math.random() - 0.5),
      );
    const u = this.player,
      f = Math.hypot(u.pos[0] - t, u.pos[1] - e, u.pos[2] - s);
    f < 30 && (this.shake = Math.max(this.shake || 0, ((1 - f / 30) * i) / 4));
  }
  blastSeen(t, e, s, i) {
    const o = this.world,
      a = i.box();
    let r = 0,
      h = 0;
    for (let i = 0; i <= 1; i++)
      for (let l = 0; l <= 2; l++)
        for (let c = 0; c <= 1; c++) {
          const p = a[0] + (a[3] - a[0]) * (0.1 + 0.8 * i),
            u = a[1] + (a[4] - a[1]) * (0.1 + 0.4 * l),
            f = a[2] + (a[5] - a[2]) * (0.1 + 0.8 * c),
            g = t - p,
            m = e - u,
            k = s - f,
            w = Math.hypot(g, m, k),
            _ = Math.ceil(w / 0.3);
          let b = !0;
          for (let t = 1; t < _; t++) {
            const e = t / _,
              s = Math.floor(p + g * e),
              i = Math.floor(u + m * e),
              a = Math.floor(f + k * e),
              r = o.getBlock(s, i, a);
            if (
              SOLIDCUBE[r] ||
              (BLOCKS[r] &&
                ((BLOCKS[r].door && !(4 & o.getMeta(s, i, a))) ||
                  (BLOCKS[r].shape === SH_CUBE && BLOCKS[r].solid)))
            ) {
              b = !1;
              break;
            }
          }
          (h++, b && r++);
        }
    return h ? r / h : 1;
  }
  lookDir() {
    const t = this.player,
      e = Math.cos(t.pitch),
      s = this.viewYaw();
    return [-Math.sin(s) * e, Math.sin(t.pitch), -Math.cos(s) * e];
  }
  viewYaw() {
    const t = this.player,
      e = t.vehicle;
    return "undefined" != typeof Boat && e instanceof Boat && void 0 !== e.prevYaw
      ? t.yaw + (e.yaw - e.prevYaw) * (this.frameA || 0)
      : t.yaw;
  }
  selBoxes(t, e, s, i) {
    const o = BLOCKS[i],
      a = this.world.getMeta(t, e, s);
    if (!o) return [];
    if ("light" === o.key) {
      const t = this.player && this.player.inv.held;
      return t && ITEMS[t.id] && "light" === ITEMS[t.id].key ? [[0, 0, 0, 1, 1, 1]] : [];
    }
    if (o.shape === SH_BOXES || o.shape === SH_MODEL)
      return o.boxes(a).map((t) => t.map((t) => t / 16));
    if (o.shape === SH_CROSS || o.shape === SH_CROP)
      return [[0.15, 0, 0.15, 0.85, "wheat" === o.key ? 0.25 + (7 & a) / 10 : 0.8, 0.85]];
    if (o.shape === SH_TORCH) {
      const t = DIRS[a];
      if (!a || !t) return [[0.4, 0, 0.4, 0.6, 0.6, 0.6]];
      const e = 0.5 + 0.35 * t[0],
        s = 0.5 + 0.35 * t[2];
      return [[e - 0.15, 0.2, s - 0.15, e + 0.15, 0.8, s + 0.15]];
    }
    return o.shape === SH_CACTUS
      ? [[1 / 16, 0, 1 / 16, 15 / 16, 1, 15 / 16]]
      : [[0, 0, 0, 1, 1, 1]];
  }
  raycast(t, e, s, i, o) {
    const a = this.world;
    let r = Math.floor(t[0]),
      h = Math.floor(t[1]),
      l = Math.floor(t[2]);
    const c = Math.sign(e[0]),
      p = Math.sign(e[1]),
      u = Math.sign(e[2]),
      f = Math.abs(1 / e[0]),
      g = Math.abs(1 / e[1]),
      m = Math.abs(1 / e[2]);
    let k = (c > 0 ? r + 1 - t[0] : t[0] - r) * f,
      w = (p > 0 ? h + 1 - t[1] : t[1] - h) * g,
      _ = (u > 0 ? l + 1 - t[2] : t[2] - l) * m;
    for (let b = 0; b < 200; b++) {
      const b = a.getBlock(r, h, l),
        M = BLOCKS[b];
      if (
        b &&
        (!IS_FLUID[b] || (i && 0 === a.getMeta(r, h, l))) &&
        (!o || (!VIS_NONE[b] && (M.solid || M.collide || VIS_SEL[b])))
      ) {
        const i = IS_FLUID[b]
          ? [[0, 0, 0, 1, 0.9, 1]]
          : o && VIS_SEL[b] && M.fence
            ? M.boxes(a.fenceMeta(r, h, l, M)).map((t) => t.map((t) => t / 16))
            : !o || VIS_SEL[b] || !M.collide || (M.shape !== SH_BOXES && M.shape !== SH_MODEL)
              ? this.selBoxes(r, h, l, b)
              : M.collide(M.fence ? a.fenceMeta(r, h, l, M) : a.getMeta(r, h, l), null, h).map(
                  (t) => t.map((t) => t / 16),
                );
        let c = null;
        for (const s of i) {
          const i = rayBox(t, e, r + s[0], h + s[1], l + s[2], r + s[3], h + s[4], l + s[5]);
          i && (!c || i.t < c.t) && (c = { ...i, box: s });
        }
        if (c && c.t <= s)
          return {
            pos: [r, h, l],
            face: c.face,
            t: c.t,
            point: [t[0] + e[0] * c.t, t[1] + e[1] * c.t, t[2] + e[2] * c.t],
            id: b,
            box: c.box,
          };
      }
      if (k < w && k < _) {
        if (k > s) break;
        ((r += c), (k += f));
      } else if (w < _) {
        if (w > s) break;
        ((h += p), (w += g));
      } else {
        if (_ > s) break;
        ((l += u), (_ += m));
      }
    }
    return null;
  }
  rayEntity(t, e, s) {
    let i = null;
    for (const o of this.entities) {
      if (o.dead || (!(o instanceof Living) && !o.hittable) || o.deathTime > 0) continue;
      const a = o.parts ? o.parts() : [{ box: o.box() }];
      for (const r of a) {
        const a = r.box,
          h = rayBox(t, e, a[0] - 0.1, a[1] - 0.1, a[2] - 0.1, a[3] + 0.1, a[4] + 0.1, a[5] + 0.1);
        h && h.t <= s && (!i || h.t < i.t) && (i = { e: o, t: h.t, part: o.parts ? r : null });
      }
    }
    return i;
  }
  reach() {
    return "creative" === this.mode ? 5 : 4.5;
  }
  updateTarget() {
    const t = this.player,
      e = [t.pos[0], t.pos[1] + t.eye(), t.pos[2]],
      s = this.lookDir();
    this.target = this.raycast(e, s, this.reach(), !1);
    const i = this.rayEntity(e, s, "creative" === this.mode ? 5 : 3);
    return (
      (this.targetEntity = i && (!this.target || i.t < this.target.t) ? i.e : null),
      (this.targetPart = this.targetEntity ? i.part : null),
      { eye: e, dir: s }
    );
  }
  handleInteraction() {
    const t = this.player;
    if (this.ui.screen || t.deathTime > 0 || "spectator" === this.mode)
      return (
        (this.breaking = null),
        (t.usingItem = null),
        (this.target = null),
        (this.targetEntity = null),
        void (this.mouseClicked0 = this.useClicked = !1)
      );
    if ((this.updateTarget(), this.net)) this.netInteraction();
    else {
      if ((this.useCd > 0 && this.useCd--, this.attackCd > 0 && this.attackCd--, t.usingItem)) {
        const step = () => {
          const e = "off" === t.useHand ? t.inv.slots[40] : t.inv.held;
          if (this.mouseBtn[2] && e && e.id === t.usingItem) {
            (t.useT++, this.usingTick(e));
            const s = ITEMS[e.id],
              i = "potion" === s.key || "milk_bucket" === s.key || "honey_bottle" === s.key;
            (s.food || i) &&
              (t.useT % 4 == 0 &&
                t.useT > 6 &&
                (i
                  ? Sound.ev("entity.generic.drink", t.pos, 0.5, 1)
                  : (Sound.eat(t.pos), this.foodParticles(e.id))),
              t.useT >= this.useTicks(s) && this.finishEating(e));
          } else
            (e && e.id === t.usingItem && this.releaseUsing(e),
              (t.usingItem = null),
              (t.useT = 0),
              (t.useHand = null));
        };
        "off" === t.useHand && this.withOffhand ? this.withOffhand(step) : step();
      }
      if ((!this.mouseBtn[0] && !this.mouseClicked0) || t.usingItem) this.breaking = null;
      else if (this.targetEntity)
        (this.mouseClicked0 && this.attackCd <= 0 && this.attack(this.targetEntity),
          (this.breaking = null));
      else if (this.target) {
        const e = this.target,
          s = t.inv.held && ITEMS[t.inv.held.id].key,
          i = "function" == typeof isSpear && isSpear(s);
        if (i)
          (this.mouseClicked0 && this.attackCd <= 0 && this.spearJab && this.spearJab(),
            (this.breaking = null));
        else if ("creative" === this.mode) {
          if (this.attackCd <= 0) {
            const o = t.inv.held;
            ((o &&
              ((ITEMS[o.id].tool && "sword" === ITEMS[o.id].tool.type) ||
                i ||
                "mace" === s ||
                "trident" === s)) ||
              this.breakBlock(...e.pos, !1),
              (this.attackCd = 5),
              t.swing());
          }
        } else {
          const s = e.pos.join(",");
          (this.breaking && this.breaking.key === s) ||
            (this.breaking = { key: s, pos: e.pos, progress: 0, id: e.id });
          const i = BLOCKS[e.id];
          if (171 === e.id || 176 === e.id || (e.id && e.id === BID.soul_fire))
            return (
              176 !== e.id
                ? (this.world.setBlock(...e.pos, 0, 0),
                  Sound.ev("block.fire.extinguish", e.pos, 0.5, 2))
                : this.teleportEgg(...e.pos),
              (this.breaking = null),
              (this.attackCd = 5),
              t.swing(),
              void (this.mouseBtn[0] = this.mouseClicked0 = this.useClicked = !1)
            );
          i.hardness < 0 || this.attackCd > 0
            ? i.hardness < 0 && (this.breaking.progress = 0)
            : ((this.breaking.progress += this.breakSpeed(e.id)),
              t.swing(),
              this.tickCount % 4 == 0 &&
                (Sound.block("hit", i.sound, [e.pos[0] + 0.5, e.pos[1] + 0.5, e.pos[2] + 0.5]),
                this.particles.blockHit(...e.pos, e.face, e.id, this.world.getMeta(...e.pos))),
              this.breaking.progress >= 1 &&
                (this.breakBlock(...e.pos, !1), (this.breaking = null), (this.attackCd = 5)));
        }
      } else if (((this.breaking = null), this.mouseClicked0)) {
        const e = t.inv.held && ITEMS[t.inv.held.id].key;
        "function" == typeof isSpear && isSpear(e)
          ? this.attackCd <= 0 && this.spearJab && this.spearJab() && (this.attackCd = 2)
          : (t.swing(), (t.attackT = 0));
      }
      ((this.mouseClicked0 = !1),
        (this.mouseBtn[2] || this.useClicked) &&
          this.useCd <= 0 &&
          !t.usingItem &&
          (this.useHands ? this.useHands() : this.use()),
        (this.useClicked = !1));
    }
  }
  breakSpeed(t) {
    const e = this.player,
      s = BLOCKS[t];
    if (0 === s.hardness) return 1;
    const i = e.inv.held,
      o = i && ITEMS[i.id];
    let a = 1,
      r = !s.needsTool;
    if (o && o.tool) {
      const t = o.tool;
      (t.type === s.tool && ((a = t.speed), t.level >= s.level && (r = !0)),
        "sword" !== t.type ||
          (!s.key.endsWith("leaves") &&
            "cactus" !== s.key &&
            "pumpkin" !== s.key &&
            "melon" !== s.key) ||
          (a = 1.5));
    }
    (o &&
      "shears" === o.key &&
      (s.key.endsWith("leaves") || s.key.endsWith("wool")) &&
      ((a = s.key.endsWith("wool") ? 5 : 15), (r = !0)),
      "cobweb" === s.key &&
        o &&
        ("shears" === o.key || (o.tool && "sword" === o.tool.type)) &&
        ((a = 15), (r = !0)),
      "shears" === s.tool && (r = !0));
    const h = heldEnch(e, "efficiency");
    h && a > 1 && (a += h * h + 1);
    let l = (a * effectMineFactor(e)) / s.hardness / (r ? 30 : 100);
    return (
      e.eyeInWater && !armorEnch(e, "aqua_affinity", [36]) && (l /= 5),
      e.onGround || e.flying || (l /= 5),
      l
    );
  }
  canHarvest(t, e) {
    const s = BLOCKS[t];
    if (!s.needsTool) return !0;
    const i = e && ITEMS[e.id];
    return (
      "shears" === s.tool || !!(i && i.tool && i.tool.type === s.tool && i.tool.level >= s.level)
    );
  }
  teleportEgg(t, e, s) {
    const i = this.world;
    for (let o = 0; o < 100; o++) {
      const o = t + ((31 * Math.random()) | 0) - 15,
        a = e + ((15 * Math.random()) | 0) - 7,
        r = s + ((31 * Math.random()) | 0) - 15;
      if (0 === i.getBlock(o, a, r) && BLOCKS[i.getBlock(o, a - 1, r)].solid) {
        (i.setBlock(t, e, s, 0, 0), i.setBlock(o, a, r, 176, 0));
        for (let i = 0; i < 40; i++) {
          const h = i / 40;
          this.particles.spawn(
            "portal",
            lerp(t, o, h) + 0.5,
            lerp(e, a, h) + 0.5,
            lerp(s, r, h) + 0.5,
            0,
            0,
            0,
          );
        }
        return void this.flushMesh();
      }
    }
  }
  breakBlock(t, e, s, i, o) {
    const a = this.world,
      r = a.getBlock(t, e, s),
      h = a.getMeta(t, e, s);
    if (!r || IS_FLUID[r]) return;
    if (176 === r && !i && "creative" !== this.mode) return void this.teleportEgg(t, e, s);
    const l = BLOCKS[r],
      c = this.player,
      p = i ? null : c.inv.held;
    if (
      (o || Sound.block("break", l.sound, [t + 0.5, e + 0.5, s + 0.5]),
      this.particles.blockBreak(t, e, s, r, h),
      ("creative" !== this.mode || i) &&
        ((i || this.canHarvest(r, p)) && this.dropBlockLoot(t, e, s, r, h, p), !i))
    ) {
      (c.exhaust(0.005), p && ITEMS[p.id].durability && l.hardness > 0 && this.damageHeld(1));
      const i =
        {
          coal_ore: [0, 2],
          deepslate_coal_ore: [0, 2],
          diamond_ore: [3, 7],
          deepslate_diamond_ore: [3, 7],
          redstone_ore: [1, 5],
          lapis_ore: [2, 5],
          emerald_ore: [3, 7],
        }[l.key] ||
        (Array.isArray(l.xp) && l.xp);
      (i &&
        this.canHarvest(r, p) &&
        !enchLevel(p, "silk_touch") &&
        this.dropXp(
          t + 0.5,
          e + 0.5,
          s + 0.5,
          i[0] + Math.floor(Math.random() * (i[1] - i[0] + 1)),
        ),
        this.stats.mined++);
    }
    const pair = (i, o) => {
      this.pairBreak = t + "," + e + "," + s;
      try {
        a.setBlock(t, i, s, o, 0, 1);
      } finally {
        this.pairBreak = null;
      }
    };
    if (l.door) {
      const i = 8 & h ? e - 1 : e + 1;
      a.getBlock(t, i, s) === r && pair(i, 0);
    }
    if (l.bed) {
      const o = [4, 1, 5, 0][3 & h],
        l = DIRS[4 & h ? OPP[o] : o],
        c = t + l[0],
        p = s + l[2];
      a.getBlock(c, e, p) === r &&
        (4 & h && "creative" !== this.mode && !i && this.dropBlockLoot(c, e, p, r, 0, null),
        a.setBlock(c, e, p, 0, 0, 1));
    }
    const u = l.states && l.states[h] && l.states[h].half;
    if ("upper" === u || "lower" === u) {
      const i = "upper" === u ? e - 1 : e + 1;
      a.getBlock(t, i, s) === r && pair(i, WLOG[r] ? WATER : 0);
    }
    (a.setBlock(t, e, s, WLOG[r] ? WATER : 0, 0),
      35 !== r ||
        0 === a.getBlock(t, e - 1, s) ||
        "creative" === this.mode ||
        i ||
        a.setBlock(t, e, s, WATER, 0),
      i || this.flushMesh());
  }
  damageHeld(t) {
    const e = this.player,
      s = e.inv.held;
    if (s && "creative" !== this.mode) {
      for (let e = t; e > 0; e--) unbreakingSkips(s, !1) && t--;
      t <= 0 ||
        ((s.dmg = (s.dmg || 0) + t),
        s.dmg >= ITEMS[s.id].durability &&
          ((e.inv.slots[e.inv.sel] = null),
          Sound.ev("entity.item.break", e.pos, 0.8, 0.8 + 0.4 * Math.random()),
          (this.ui.actionBar = {
            text: ITEMS[s.id].cn + " 损坏了",
            t: performance.now(),
            color: "#FF5555",
          })));
    }
  }
  flushMesh() {
    const t = this.player,
      e = Math.floor(t.pos[0]) >> 4,
      s = Math.floor(t.pos[2]) >> 4;
    for (let t = -2; t <= 2; t++)
      for (let i = -2; i <= 2; i++) {
        const o = this.world.getChunk(e + t, s + i);
        if (!o || !o.dirty) continue;
        let a = !0;
        for (let t = -1; t <= 1 && a; t++)
          for (let e = -1; e <= 1; e++)
            if (!this.world.getChunk(o.cx + t, o.cz + e)) {
              a = !1;
              break;
            }
        a && this.meshChunk(o);
      }
  }
  attackSpeed() {
    const t = this.player.inv.held,
      e = t && ITEMS[t.id],
      s = e && e.tool;
    if (e && e.attackSpeed) return e.attackSpeed;
    if (!s) return 4;
    const i = e.key.split("_")[0];
    switch (s.type) {
      case "sword":
        return 1.6;
      case "pickaxe":
        return 1.2;
      case "shovel":
        return 1;
      case "axe":
        return { wooden: 0.8, stone: 0.8, iron: 0.9 }[i] || 1;
      case "hoe":
        return { wooden: 1, stone: 2, iron: 3, golden: 1, diamond: 4 }[i] || 1;
    }
    return 4;
  }
  attackStrength(t = 0.5) {
    return clamp(((this.player.attackT || 0) + t) / (20 / this.attackSpeed()), 0, 1);
  }
  attack(t) {
    const e = this.player,
      s = e.inv.held,
      i = s && ITEMS[s.id],
      o = this.attackStrength();
    let a =
      Math.max(0, (i && i.attack ? i.attack : 1) + effectAttackBonus(e)) * (0.2 + o * o * 0.8);
    a += e.maceBonus || 0;
    const r = o > 0.9 && e.vel[1] < -0.05 && !e.onGround && !e.inWater && !e.sprinting,
      snd = (t) => Sound.ev("entity.player.attack." + t, e.pos, 1, 1);
    if ((e.sprinting && o > 0.9 && snd("knockback"), r)) {
      a *= 1.5;
      for (let e = 0; e < 12; e++)
        this.particles.spawn(
          "crit",
          t.pos[0] + (Math.random() - 0.5) * t.w,
          t.pos[1] + Math.random() * t.h,
          t.pos[2] + (Math.random() - 0.5) * t.w,
          0.3 * (Math.random() - 0.5),
          0.3 * Math.random(),
          0.3 * (Math.random() - 0.5),
        );
    }
    a += enchantAttackBonus(s, t) * o;
    const h = (e.sprinting && o > 0.9 ? 0.8 : 0.4) + 0.5 * heldEnch(e, "knockback"),
      l = {
        type: "player",
        attacker: e,
        knockFrom: e.pos,
        knock: h,
        player: !0,
        looting: heldEnch(e, "looting"),
      };
    e.attackT = 0;
    const c = heldEnch(e, "fire_aspect");
    c && !t.fireproof && t instanceof Living && (t.fire = Math.max(t.fire || 0, 80 * c));
    const p = t.parts && this.targetPart ? t.hurtPart(this.targetPart, a, l) : t.hurt(a, l);
    return (
      p
        ? (i && i.durability && this.damageHeld(i.tool && "sword" === i.tool.type ? 1 : 2),
          e.exhaust(0.1),
          e.sprinting && (e.sprinting = !1),
          r ? snd("crit") : this.sweepHit || snd(o > 0.9 ? "strong" : "weak"))
        : snd("nodamage"),
      e.swing(),
      (this.attackCd = 2),
      p
    );
  }
  foodParticles(t) {
    const e = this.player,
      s = this.lookDir();
    for (let i = 0; i < 3; i++) {
      this.particles.spawn(
        "block",
        e.pos[0] + 0.5 * s[0],
        e.pos[1] + e.eye() - 0.2,
        e.pos[2] + 0.5 * s[2],
        0.1 * (Math.random() - 0.5),
        0.1,
        0.1 * (Math.random() - 0.5),
        { id: 1, layer: ITEMS[t].tex },
      );
    }
  }
  finishEating(t) {
    const e = this.player,
      s = ITEMS[t.id];
    ((e.food = Math.min(20, e.food + s.food[0])),
      (e.saturation = Math.min(e.food, e.saturation + s.food[1])),
      s.heal && (e.health = Math.min(20, e.health + s.heal)),
      "rotten_flesh" === s.key && Math.random() < 0.8 && (e.food = Math.max(0, e.food - 1)),
      Sound.burp(e.pos),
      "creative" !== this.mode && (t.count--, t.count || (e.inv.slots[e.inv.sel] = null)),
      (e.usingItem = null),
      (e.useT = 0),
      (this.useCd = 4));
  }
  releaseBow() {
    const t = this.player;
    let e = t.useT / 20;
    if (((e = (e * e + 2 * e) / 3), e > 1 && (e = 1), e < 0.1)) return;
    const s = this.findAmmo(!1);
    if (!s && "creative" !== this.mode) return;
    const i = t.inv.held,
      o = s ? s[1] : null,
      a = o ? ITEMS[o.id].key : "arrow",
      r = enchLevel(i, "infinity") > 0 && "arrow" === a;
    "creative" === this.mode || r || (o.count--, o.count || (t.inv.slots[s[0]] = null));
    const h = this.lookDir(),
      l = 3 * e,
      c = new Arrow(
        this,
        t.pos[0] + 0.3 * h[0],
        t.pos[1] + t.eye() - 0.1,
        t.pos[2] + 0.3 * h[2],
        [h[0] * l, h[1] * l, h[2] * l],
        t,
      ),
      p = enchLevel(i, "power"),
      u = enchLevel(i, "punch");
    (p && (c.baseDmg = 2 + 0.5 * p + 0.5),
      u && (c.punch = u),
      enchLevel(i, "flame") && (c.fire = 100),
      (r || "creative" === this.mode) && (c.noPickup = !0),
      o && ((c.stack = { ...o, count: 1 }), "arrow" !== a && (c.tip = c.stack)),
      this.entities.push(c),
      Sound.bow(t.pos),
      this.damageHeld(1));
  }
  use() {
    const t = this.player,
      e = this.world,
      s = t.inv.held,
      i = s && ITEMS[s.id],
      o = this.target;
    if (
      ((this.useCd = 4),
      this.targetEntity &&
        this.targetEntity.interact &&
        !(s && ITEMS[s.id] && ITEMS[s.id].spawnEgg) &&
        this.targetEntity.interact(t, s))
    )
      return void t.swing();
    if (this.targetEntity && s) {
      const e = this.targetEntity;
      if ("undefined" != typeof Piglin && e instanceof Piglin && s.id === ITEM_KEY.gold_ingot)
        return void (
          e.give(s) &&
          ("creative" !== this.mode && (s.count--, s.count || (t.inv.slots[t.inv.sel] = null)),
          t.swing())
        );
      if ("shears" === i.key && "sheep" === e.type && !e.sheared) {
        e.sheared = !0;
        for (let t = 0, s = 1 + ((3 * Math.random()) | 0); t < s; t++)
          this.dropItem(e.pos[0], e.pos[1] + 1, e.pos[2], makeStack(woolKey(e.woolColor), 1));
        return (
          Sound.ev("entity.sheep.shear", e.pos, 1, 1) ||
            Sound.noise(e.pos, { freq: 3e3, q: 3, dur: 0.15, vol: 0.4 }),
          this.damageHeld(1),
          void t.swing()
        );
      }
      if (e.T && e.T.food && s.id === item(e.T.food) && !e.loveT && !e.baby) {
        e.loveT = 600;
        for (let t = 0; t < 6; t++)
          this.particles.spawn(
            "heart",
            e.pos[0] + (Math.random() - 0.5),
            e.pos[1] + e.h + 0.5 * Math.random(),
            e.pos[2] + (Math.random() - 0.5),
            0,
            0.02,
            0,
          );
        "creative" !== this.mode && (s.count--, s.count || (t.inv.slots[t.inv.sel] = null));
        const i = this.entities.find(
          (t) => t !== e && t instanceof Mob && t.type === e.type && t.loveT > 0 && t.distTo(e) < 8,
        );
        if (i) {
          ((e.loveT = 0), (i.loveT = 0));
          const t = createMob(
            this,
            e.type,
            (e.pos[0] + i.pos[0]) / 2,
            e.pos[1],
            (e.pos[2] + i.pos[2]) / 2,
          ).makeBaby();
          ("undefined" != typeof Cat &&
            t instanceof Cat &&
            e.variant &&
            i.variant &&
            (t.variant = Math.random() < 0.5 ? e.variant : i.variant),
            this.entities.push(t));
          for (let e = 0; e < 8; e++)
            this.particles.spawn(
              "heart",
              t.pos[0] + (Math.random() - 0.5),
              t.pos[1] + 1 + 0.5 * Math.random(),
              t.pos[2] + (Math.random() - 0.5),
              0,
              0.02,
              0,
            );
          this.dropXp(t.pos[0], t.pos[1] + 0.5, t.pos[2], 1 + ((7 * Math.random()) | 0));
        }
        return void t.swing();
      }
    }
    if (o && !t.sneaking) {
      const s = BLOCKS[o.id],
        [a, r, h] = o.pos;
      if (
        "light" === s.key &&
        i &&
        "light" === i.key &&
        "creative" === this.mode &&
        "undefined" != typeof Features
      ) {
        const s = e.getMeta(a, r, h),
          i = +Features.propOf(o.id, s, "level") || 0;
        return (
          e.setBlock(a, r, h, o.id, Features.withProp(o.id, s, "level", String((i + 1) % 16))),
          void t.swing()
        );
      }
      if ("function" == typeof s.onUse && s.onUse(this, a, r, h, o)) return void t.swing();
      if ("crafting" === s.onUse) return void this.ui.open(new CraftingScreen(this, 3));
      if (WORKSTATIONS[s.onUse]) return void this.openWorkstation(s, a, r, h);
      if ("furnace" === s.onUse) {
        const t = this.getBlockEntity(a, r, h, "furnace");
        t.kind = FURNACE_KIND[s.key] || "smelting";
        const e = new FurnaceScreen(this, t);
        return ((e.title = s.cn), void this.ui.open(e));
      }
      if ("chest" === s.onUse) {
        const t = e.getMeta(a, r, h),
          i = chestSeam(t),
          l = [[a, h]];
        (i && e.getBlock(a + i[0], r, h + i[1]) === o.id && l.push([a + i[0], h + i[1]]),
          2 === l.length && 1 === chestType(t) && l.reverse());
        const c = l.map(([t, s]) => {
          const i = this.getBlockEntity(t, r, s, "chest");
          return (
            8 & e.getMeta(t, r, s) &&
              (this.fillLoot(i, t, r, s), e.setMeta(t, r, s, -9 & e.getMeta(t, r, s))),
            i
          );
        });
        return (
          this.ui.open(new ChestScreen(this, c, c.length > 1 ? "大型" + s.cn : s.cn)),
          void Sound.chest([a + 0.5, r + 0.5, h + 0.5], !0)
        );
      }
      if ("barrel" === s.onUse) {
        const t = this.getBlockEntity(a, r, h, "chest");
        (t.loot && this.fillLoot(t, a, r, h), this.ui.open(new ChestScreen(this, [t], s.cn)));
        const i = e.getMeta(a, r, h);
        return (
          (this.barrelsShown || (this.barrelsShown = new Set())).add(a + "," + r + "," + h),
          "undefined" != typeof Features &&
            "false" === Features.propOf(o.id, i, "open") &&
            (e.setMeta(a, r, h, Features.withProp(o.id, i, "open", !0)), this.flushMesh()),
          void Sound.ev(
            "block.barrel.open",
            [a + 0.5, r + 0.5, h + 0.5],
            0.5,
            0.1 * Math.random() + 0.9,
          )
        );
      }
      if ("note" === s.onUse) {
        const s = (e.getMeta(a, r, h) + 1) % 25;
        return (
          e.setMeta(a, r, h, s),
          Sound.note([a, r, h], s),
          this.particles.spawn("note", a + 0.5, r + 1.2, h + 0.5, 0, 0.02, 0, {
            col: [255, Math.round(10 * s), Math.round(255 - 10 * s)],
          }),
          void t.swing()
        );
      }
      if (s.door && !s.key.startsWith("iron_")) {
        const i = 8 & e.getMeta(a, r, h) ? r - 1 : r,
          o = 4 ^ e.getMeta(a, i, h);
        return (
          e.setMeta(a, i, h, o),
          e.setMeta(a, i + 1, h, 8 | o),
          Sound.door([a, r, h], !!(4 & o), s.key),
          t.swing(),
          void this.flushMesh()
        );
      }
      if (s.bed)
        return (
          "overworld" !== this.dim ? this.bedExplode(a, r, h) : this.trySleep(a, r, h),
          void t.swing()
        );
      if (176 === o.id) return (this.teleportEgg(a, r, h), void t.swing());
      if (s.trapdoor && !s.key.startsWith("iron_")) {
        const i = 4 ^ e.getMeta(a, r, h);
        return (
          e.setMeta(a, r, h, i),
          Sound.door([a, r, h], !!(4 & i), s.key),
          t.swing(),
          void this.flushMesh()
        );
      }
      if (s.gate && "undefined" != typeof Features) {
        const i = o.id,
          l = e.getMeta(a, r, h),
          c = "true" === Features.propOf(i, l, "open");
        let p = Features.withProp(i, l, "open", !c);
        if (!c) {
          const t = Features.propOf(i, l, "facing"),
            e = this.lookDir(),
            s =
              Math.abs(e[0]) > Math.abs(e[2])
                ? e[0] > 0
                  ? "east"
                  : "west"
                : e[2] > 0
                  ? "south"
                  : "north";
          s === OPPOSITE[t] && (p = Features.withProp(i, p, "facing", s));
        }
        return (
          e.setMeta(a, r, h, p),
          Sound.door([a, r, h], !c, s.key),
          t.swing(),
          void this.flushMesh()
        );
      }
      if (26 === o.id && i && "flint_and_steel" === i.key)
        return (
          e.setBlock(a, r, h, 0, 0),
          this.entities.push(new PrimedTNT(this, a, r, h)),
          this.damageHeld(1),
          void t.swing()
        );
    }
    if (this.useEquipment(s, i)) return;
    if (!s) return;
    if (i.armor) {
      const e = 36 + i.armor.slot,
        o = t.inv.slots[e];
      return (
        (t.inv.slots[e] = s),
        (t.inv.slots[t.inv.sel] = o),
        t.swing(),
        void (i.key.startsWith("iron") && this.grant("armor"))
      );
    }
    const a =
      i.food &&
      i.places &&
      o &&
      !this.targetEntity &&
      void 0 !== BID[i.places] &&
      (() => {
        const t = BID[i.places],
          e = BLOCKS[t],
          s = DIRS[o.face],
          a = BLOCKS[o.id];
        let [r, h, l] = o.pos;
        (a.replaceable && !IS_FLUID[o.id]) || ((r += s[0]), (h += s[1]), (l += s[2]));
        const c = this.world.getBlock(r, h, l);
        return (
          !(c && !REPLACEABLE[c]) && (!e.needsSupport || this.supportedForPlace(r, h, l, t, 0))
        );
      })();
    if (!a && (i.food || "potion" === i.key || "milk_bucket" === i.key))
      return void (this.canConsume(i) && ((t.usingItem = s.id), (t.useT = 0)));
    if ("splash_potion" === i.key || "lingering_potion" === i.key) return void this.throwPotion(s);
    if ("bow" === i.key)
      return void (
        ("creative" === this.mode || this.findAmmo(!1)) &&
        ((t.usingItem = s.id), (t.useHand = "main"), (t.useT = 0))
      );
    if ("ender_pearl" === i.key) {
      if (this.pearlCd > this.tickCount) return;
      const e = this.lookDir();
      return (
        this.entities.push(
          new ThrownPearl(
            this,
            t.pos[0],
            t.pos[1] + t.eye() - 0.1,
            t.pos[2],
            [1.5 * e[0], 1.5 * e[1], 1.5 * e[2]],
            t,
          ),
        ),
        Sound.ev("entity.ender_pearl.throw", t.pos, 0.5, 0.4 / (0.4 * Math.random() + 0.8)),
        "creative" !== this.mode && (s.count--, s.count || (t.inv.slots[t.inv.sel] = null)),
        (this.pearlCd = this.tickCount + 20),
        void t.swing()
      );
    }
    if ("ender_eye" === i.key && (!o || 174 !== o.id)) {
      if ("overworld" !== this.dim)
        return void (this.ui.actionBar = {
          text: "末影之眼在这里没有反应……",
          t: performance.now(),
        });
      const e = this.nearestStronghold();
      if (!e) return;
      return (
        this.entities.push(
          new EyeOfEnder(this, t.pos[0], t.pos[1] + t.eye() - 0.2, t.pos[2], e.x, e.z),
        ),
        "creative" !== this.mode && (s.count--, s.count || (t.inv.slots[t.inv.sel] = null)),
        void t.swing()
      );
    }
    if ("snowball" === i.key || "egg" === i.key) {
      const e = this.lookDir(),
        o = new Arrow(
          this,
          t.pos[0],
          t.pos[1] + t.eye() - 0.1,
          t.pos[2],
          [1.5 * e[0], 1.5 * e[1], 1.5 * e[2]],
          t,
        );
      return (
        (o.snowball = s.id),
        this.entities.push(o),
        "creative" !== this.mode && (s.count--, s.count || (t.inv.slots[t.inv.sel] = null)),
        Sound.ev(
          "egg" === i.key ? "entity.egg.throw" : "entity.snowball.throw",
          t.pos,
          0.5,
          0.4 / (0.4 * Math.random() + 0.8),
        ),
        void t.swing()
      );
    }
    if ("bucket" === i.key) {
      const i = this.raycast(
          [t.pos[0], t.pos[1] + t.eye(), t.pos[2]],
          this.lookDir(),
          this.reach(),
          !0,
        ),
        o = i && !IS_FLUID[i.id] && e.isWaterlogged(...i.pos);
      if (i && (o || (IS_FLUID[i.id] && 0 === e.getMeta(...i.pos)))) {
        o ? e.setWaterlogged(...i.pos, !1) : e.setBlock(...i.pos, 0, 0);
        const a = makeStack(
          o || i.id === WATER
            ? "water_bucket"
            : i.id === LAVA
              ? "lava_bucket"
              : BLOCKS[i.id].bucket || "lava_bucket",
        );
        ("creative" !== this.mode &&
          (s.count--,
          s.count ? t.inv.add(a) && this.dropFromPlayer(a) : (t.inv.slots[t.inv.sel] = a)),
          Sound.ev(
            o || i.id !== LAVA ? "item.bucket.fill" : "item.bucket.fill_lava",
            i.pos,
            1,
            1,
          ) || Sound.splash(i.pos),
          t.swing(),
          this.flushMesh());
      }
      return;
    }
    if (!o) return;
    const [r, h, l] = o.pos,
      c = DIRS[o.face];
    if (
      i.tool &&
      "hoe" === i.tool.type &&
      (2 === o.id || 3 === o.id) &&
      0 === e.getBlock(r, h + 1, l)
    )
      return (
        e.setBlock(r, h, l, 63, 0),
        Sound.ev("item.hoe.till", [r + 0.5, h + 0.5, l + 0.5], 1, 1) ||
          Sound.block("step", "gravel", [r, h, l]),
        this.damageHeld(1),
        t.swing(),
        void this.flushMesh()
      );
    if ("bone_meal" === i.key) {
      let i = !1;
      const a = BLOCKS[o.id],
        p = a && a.states && a.states[e.getMeta(r, h, l)];
      if (64 === o.id && e.getMeta(r, h, l) < 7)
        (e.setMeta(r, h, l, Math.min(7, e.getMeta(r, h, l) + 2 + ((3 * Math.random()) | 0))),
          (i = !0));
      else if (
        p &&
        void 0 !== p.age &&
        /^(carrots|potatoes|beetroots|melon_stem|pumpkin_stem|sweet_berry_bush|cocoa|torchflower_crop)$/.test(
          a.key,
        )
      ) {
        const t = Math.max(...a.states.map((t) => +t.age).filter((t) => !isNaN(t))),
          s = +p.age;
        if (s < t) {
          const c = /^(carrots|potatoes|beetroots|melon_stem|pumpkin_stem)$/.test(a.key)
            ? 2 + ((4 * Math.random()) | 0)
            : 1;
          (e.setMeta(
            r,
            h,
            l,
            Features.withProp(o.id, e.getMeta(r, h, l), "age", String(Math.min(t, s + c))),
          ),
            (i = !0));
        }
      } else if (
        (o.id >= 65 && o.id <= 67) ||
        (BLOCKS[o.id] &&
          (BLOCKS[o.id].key.endsWith("_sapling") ||
            "mangrove_propagule" === BLOCKS[o.id].key ||
            (/^(flowering_)?azalea$/.test(BLOCKS[o.id].key) && !e.waterAt(r, h + 1, l))))
      )
        (Math.random() < 0.45 &&
          (!e.gen2 || !this.growTreeV(r, h, l, o.id)) &&
          o.id <= 67 &&
          this.growTree(r, h, l, o.id),
          (i = !0));
      else if (a && "pitcher_crop" === a.key && p) {
        const t = "upper" === p.half ? h - 1 : h;
        e.getBlock(r, t, l) === o.id &&
          "lower" === Features.propOf(o.id, e.getMeta(r, t, l), "half") &&
          this.growPitcher(r, t, l, o.id) &&
          (i = !0);
      } else if (
        a &&
        ("cave_vines" === a.key || "cave_vines_plant" === a.key) &&
        p &&
        "false" === p.berries
      )
        (e.setMeta(r, h, l, Features.withProp(o.id, e.getMeta(r, h, l), "berries", "true")),
          (i = !0));
      else if (
        !a ||
        ("moss_block" !== a.key && "pale_moss_block" !== a.key) ||
        0 !== e.getBlock(r, h + 1, l) ||
        "undefined" == typeof LiveRegion
      )
        if (
          a &&
          "seagrass" === a.key &&
          e.getBlock(r, h + 1, l) === WATER &&
          void 0 !== BID.tall_seagrass
        )
          (this.tallSeagrass(r, h, l), (i = !0));
        else if (!a || ("kelp" !== a.key && "kelp_plant" !== a.key) || void 0 === BID.kelp_plant)
          if (
            a &&
            "sea_pickle" === a.key &&
            e.isWaterlogged(r, h, l) &&
            Features.tagSet("coral_blocks").has(e.getBlock(r, h - 1, l))
          )
            (this.spreadPickles(r, h, l), (i = !0));
          else if (2 === o.id && 0 === e.getBlock(r, h + 1, l)) {
            for (let t = 0; t < 40; t++) {
              const t = r + ((7 * Math.random()) | 0) - 3,
                s = l + ((7 * Math.random()) | 0) - 3;
              2 === e.getBlock(t, h, s) &&
                0 === e.getBlock(t, h + 1, s) &&
                e.setBlock(
                  t,
                  h + 1,
                  s,
                  Math.random() < 0.85 ? 39 : FLOWER_IDS[(4 * Math.random()) | 0],
                  0,
                );
            }
            i = !0;
          } else
            SOLIDCUBE[o.id] &&
              this.growWaterPlant(r + c[0], h + c[1], l + c[2], o.face) &&
              (i = !0);
        else {
          let t = h;
          for (; e.getBlock(r, t, l) === BID.kelp_plant;) t++;
          e.getBlock(r, t, l) === BID.kelp &&
            t + 1 < HEIGHT &&
            e.getBlock(r, t + 1, l) === WATER &&
            (e.setBlock(r, t, l, BID.kelp_plant, 0),
            e.setBlock(r, t + 1, l, BID.kelp, 0),
            (i = !0));
        }
      else {
        const t = new LiveRegion(e),
          s = new Features.WRand();
        (s.setSeed(BigInt(Math.floor(Math.random() * 2 ** 52))),
          Features.placeCF(
            {
              R: t,
              top: null,
              seed: e.seedStr || "0",
              biomeAt: () => "plains",
              biomeHas: () => !0,
            },
            "moss_block" === a.key ? "moss_patch_bonemeal" : "pale_moss_patch_bonemeal",
            s,
            [r, h + 1 + t.minY, l],
          ),
          (i = !0));
      }
      if (i) {
        for (let t = 0; t < 12; t++)
          this.particles.spawn(
            "bone_meal",
            r + Math.random(),
            h + 1 + 0.5 * Math.random(),
            l + Math.random(),
            0,
            0.02,
            0,
          );
        (Sound.ev("item.bone_meal.use", [r + 0.5, h + 0.5, l + 0.5], 1, 1),
          "creative" !== this.mode && (s.count--, s.count || (t.inv.slots[t.inv.sel] = null)),
          t.swing(),
          this.flushMesh());
      }
      return;
    }
    if ("ender_eye" === i.key && 174 === o.id)
      return void (
        4 & e.getMeta(r, h, l) ||
        (this.fillEndFrame(r, h, l),
        "creative" !== this.mode && (s.count--, s.count || (t.inv.slots[t.inv.sel] = null)),
        t.swing(),
        this.flushMesh())
      );
    if ("end_crystal" === i.key) {
      const inSpace = (t) => {
        if (!t || t.dead || !t.pos || !t.w) return !1;
        const e = t.box();
        return e[0] < r + 1 && e[3] > r && e[1] < h + 3 && e[4] > h + 1 && e[2] < l + 1 && e[5] > l;
      };
      if (
        (28 === o.id || 6 === o.id) &&
        3 === o.face &&
        0 === e.getBlock(r, h + 1, l) &&
        (t.spectator || !inSpace(t)) &&
        !this.entities.some(inSpace)
      ) {
        const e = new EndCrystal(this, r + 0.5, h + 1, l + 0.5);
        ((e.showBase = !1),
          this.entities.push(e),
          "creative" !== this.mode && (s.count--, s.count || (t.inv.slots[t.inv.sel] = null)),
          t.swing());
      }
      return;
    }
    if ("flint_and_steel" === i.key || "fire_charge" === i.key) {
      const a = BLOCKS[o.id].key,
        p = e.getMeta(r, h, l);
      if (
        /(^|_)(candle|candle_cake|campfire)$/.test(a) &&
        "false" === Features.propOf(o.id, p, "lit") &&
        "true" !== Features.propOf(o.id, p, "waterlogged") &&
        !e.isWaterlogged(r, h, l)
      )
        return (
          e.setBlock(r, h, l, o.id, Features.withProp(o.id, p, "lit", "true")),
          "fire_charge" === i.key
            ? (Sound.ev("item.firecharge.use", [r + 0.5, h + 0.5, l + 0.5], 1, 1),
              "creative" !== this.mode && (s.count--, s.count || (t.inv.slots[t.inv.sel] = null)))
            : (Sound.ev(
                "item.flintandsteel.use",
                [r + 0.5, h + 0.5, l + 0.5],
                1,
                0.4 * Math.random() + 0.8,
              ),
              this.damageHeld(1)),
          t.swing(),
          void this.flushMesh()
        );
      const u = r + c[0],
        f = h + c[1],
        g = l + c[2];
      if (0 !== e.getBlock(u, f, g)) return;
      if (!this.tryLightPortal(u, f, g)) {
        if (!this.fireSupported(u, f, g)) return;
        e.setBlock(u, f, g, this.fireIdAt(u, f, g), 0);
      }
      return (
        "fire_charge" === i.key
          ? (Sound.ev("item.firecharge.use", [u, f, g], 1, 1) || Sound.fizz([u, f, g]),
            "creative" !== this.mode && (s.count--, s.count || (t.inv.slots[t.inv.sel] = null)))
          : (Sound.ev("item.flintandsteel.use", [u, f, g], 1, 0.4 * Math.random() + 0.8),
            this.damageHeld(1)),
        t.swing(),
        void this.flushMesh()
      );
    }
    if (i.spawnEgg) {
      if (127 === o.id && MOB_TYPES[i.spawnEgg])
        return (
          this.blockEntities.set(r + "," + h + "," + l, {
            type: "spawner",
            pos: [r, h, l],
            mob: i.spawnEgg,
          }),
          "creative" !== this.mode && (s.count--, s.count || (t.inv.slots[t.inv.sel] = null)),
          void t.swing()
        );
      const e = createMob(
        this,
        i.spawnEgg,
        r + c[0] + 0.5,
        h + Math.max(0, c[1]) + (c[1] < 0 ? -2 : 0),
        l + c[2] + 0.5,
      );
      ((e.persistent = !0), (e.yaw = e.bodyYaw = t.yaw + Math.PI), this.entities.push(e));
      for (let t = 0; t < 8; t++)
        this.particles.spawn(
          "poof",
          e.pos[0] + (Math.random() - 0.5),
          e.pos[1] + Math.random(),
          e.pos[2] + (Math.random() - 0.5),
          0,
          0.05,
          0,
        );
      return (
        "creative" !== this.mode && (s.count--, s.count || (t.inv.slots[t.inv.sel] = null)),
        void t.swing()
      );
    }
    let p = null;
    if (
      (void 0 !== i.block && BLOCKS[i.block] ? (p = i.block) : i.places && (p = BID[i.places]),
      null == p)
    )
      return;
    const u = WALL_FORM[BLOCKS[p].key],
      f =
        !!u &&
        /(^|_)torch$/.test(BLOCKS[p].key) &&
        void 0 !== BID[u] &&
        "undefined" != typeof Features;
    if (u && !f && void 0 !== BID[u] && 2 !== o.face && 3 !== o.face) p = BID[u];
    else if (
      u &&
      2 === o.face &&
      !BLOCKS[p].key.endsWith("hanging_sign") &&
      /_(sign|banner)$/.test(BLOCKS[p].key)
    )
      return;
    let g = BLOCKS[p];
    if (p === WATER && "nether" !== this.dim)
      for (const [s, i, o] of [
        [r, h, l],
        [r + c[0], h + c[1], l + c[2]],
      ])
        if (canWaterlog(e.getBlock(s, i, o), e.getMeta(s, i, o)) && !e.isWaterlogged(s, i, o))
          return (
            e.setWaterlogged(s, i, o, !0),
            this.dowseCampfire && this.dowseCampfire(s, i, o, "entity.generic.extinguish_fire"),
            "creative" !== this.mode && (t.inv.slots[t.inv.sel] = makeStack("bucket")),
            Sound.ev("item.bucket.empty", [s, i, o], 1, 1) || Sound.splash([s, i, o]),
            t.swing(),
            void this.flushMesh()
          );
    if ("snow" === g.key && o.id === p && (7 & e.getMeta(r, h, l)) < 7)
      return void (
        this.entityInWay(r, h, l, p, 1 + (7 & e.getMeta(r, h, l))) ||
        this.placeAt(r, h, l, p, 1 + (7 & e.getMeta(r, h, l)), s, !0)
      );
    if (g.slab && o.id === p) {
      const t = 3 & e.getMeta(r, h, l);
      if ((0 === t && 3 === o.face) || (1 === t && 2 === o.face))
        return void (this.entityInWay(r, h, l, p, 2) || this.placeAt(r, h, l, p, 2, s, !0));
    }
    const m =
      g.states && "undefined" != typeof Features
        ? ["segment_amount", "flower_amount"].find((t) => t in g.states[0])
        : null;
    if (m) {
      const n = (t) => +Features.propOf(p, e.getMeta(...t), m) || 1,
        i = [r + c[0], h + c[1], l + c[2]],
        more = (s) => e.getBlock(...s) === p && n(s) < 4 && !t.sneaking,
        o = more([r, h, l]) ? [r, h, l] : e.getBlock(...i) === p ? i : null;
      if (o)
        return void (
          more(o) &&
          this.placeAt(...o, p, Features.withProp(p, e.getMeta(...o), m, String(n(o) + 1)), s, !0)
        );
    }
    if (("vine" === g.key || "glow_lichen" === g.key) && g.states && "undefined" != typeof Features)
      return void this.placeFaces(g, o, s);
    let k = r,
      w = h,
      _ = l;
    if (
      ((BLOCKS[o.id].replaceable && !IS_FLUID[o.id] && o.id !== p) ||
        ((k += c[0]), (w += c[1]), (_ += c[2])),
      w < 0 || w >= HEIGHT)
    )
      return;
    const b = e.getBlock(k, w, _);
    if (g.slab && b === p) {
      if (2 !== (3 & e.getMeta(k, w, _)))
        return void (this.entityInWay(k, w, _, p, 2) || this.placeAt(k, w, _, p, 2, s, !0));
    }
    if (b && !REPLACEABLE[b]) return;
    if (IS_FLUID[p] && b && IS_FLUID[b] && 0 === e.getMeta(k, w, _) && b === p) return;
    if (b && b === p && !IS_FLUID[b])
      return void (
        "snow" === g.key &&
        (7 & e.getMeta(k, w, _)) < 7 &&
        !this.entityInWay(k, w, _, p, 1 + (7 & e.getMeta(k, w, _))) &&
        this.placeAt(k, w, _, p, 1 + (7 & e.getMeta(k, w, _)), s, !0)
      );
    const M = b === WATER ? 0 === e.getMeta(k, w, _) : 0 !== b && e.waterAt(k, w, _);
    if (("kelp" === g.key || "seagrass" === g.key) && !M) return;
    if ("bamboo" === g.key && ((b && IS_FLUID[b]) || !this.supported(k, w, _, p, 0))) return;
    let y = 0;
    const v = this.lookDir(),
      S = Math.abs(v[0]) > Math.abs(v[2]) ? (v[0] > 0 ? 1 : 0) : v[2] > 0 ? 5 : 4;
    if (
      (g.facing && (y = OPP[S]),
      g.axis && (y = 0 === o.face || 1 === o.face ? 1 : 4 === o.face || 5 === o.face ? 2 : 0),
      g.slab)
    ) {
      const t = o.point[1] - Math.floor(o.point[1]);
      y = 2 === o.face || (3 !== o.face && t > 0.5) ? 1 : 0;
    }
    if (g.stairs) {
      y = { 1: 0, 0: 1, 5: 2, 4: 3 }[S];
      const t = o.point[1] - Math.floor(o.point[1]);
      (2 === o.face || (3 !== o.face && t > 0.5)) && (y |= 4);
    }
    if (g.trapdoor) {
      const t = o.point[1] - Math.floor(o.point[1]);
      (2 === o.face || (3 !== o.face && t > 0.5)) && (y |= 8);
      const e = 2 === o.face || 3 === o.face ? OPP[S] : o.face;
      y |= { 4: 0, 5: 1, 0: 2, 1: 3 }[e] || 0;
    }
    (g.key.endsWith("leaves") && (y = 4),
      g.states && "undefined" != typeof Features && (y = this.placeState(g, o, S, k, w, _)));
    const B = ["west", "east", "down", "up", "north", "south"],
      I = this.lookingDirs(o, k === r && w === h && _ === l);
    if (f) {
      const t = BID[u],
        e = BLOCKS[t];
      let s,
        i = null;
      for (const a of I)
        if (3 !== a) {
          if (2 === a) {
            const t = g.states ? y : 0;
            if (this.supported(k, w, _, p, t)) {
              i = [p, t];
              break;
            }
            continue;
          }
          if (void 0 === s) {
            s = null;
            const i = e.states ? this.placeState(e, o, S, k, w, _) : 0;
            for (const e of I)
              if (2 !== e && 3 !== e) {
                const o = Features.withProp(t, i, "facing", B[OPP[e]]);
                if (this.supported(k, w, _, t, o)) {
                  s = o;
                  break;
                }
              }
          }
          if (null !== s) {
            i = [t, s];
            break;
          }
        }
      if (!i) return;
      (([p, y] = i), (g = BLOCKS[p]));
    }
    if (g.ladder && !g.states) {
      if (o.id === p && o.face === OPP[e.getMeta(r, h, l)]) return;
      const t = I.find((t) => 2 !== t && 3 !== t && this.supported(k, w, _, p, t));
      if (void 0 === t) return;
      y = t;
    }
    if (g.states && ("lever" === g.key || /_button$/.test(g.key))) {
      let t = -1;
      for (const e of I) {
        const s = Features.withProp(
          p,
          Features.withProp(p, y, "face", 2 === e ? "floor" : 3 === e ? "ceiling" : "wall"),
          "facing",
          2 === e || 3 === e ? B[S] : B[OPP[e]],
        );
        if (this.supported(k, w, _, p, s)) {
          t = s;
          break;
        }
      }
      if (t < 0) return;
      y = t;
    }
    if ("pointed_dripstone" === g.key && g.states) {
      const st = (t) => Features.withProp(p, y, "vertical_direction", t ? "down" : "up");
      let e = v[1] > 0;
      if (!this.supported(k, w, _, p, st(e)) && ((e = !e), !this.supported(k, w, _, p, st(e))))
        return;
      y = Features.withProp(p, st(e), "thickness", this.dripThickness(k, w, _, e, !t.sneaking));
    }
    if (("light" === g.key && g.states && (y = Features.withProp(p, y, "level", "15")), g.bed)) {
      const t = { 4: 0, 1: 1, 5: 2, 0: 3 }[S],
        i = DIRS[S],
        o = k + i[0],
        a = _ + i[2],
        r = e.getBlock(o, w, a);
      if (r && !REPLACEABLE[r]) return;
      if (this.entityInWay(k, w, _, p, t)) return;
      return (e.setBlock(o, w, a, p, 4 | t, 0), void this.placeAt(k, w, _, p, t, s, !1));
    }
    if (g.door) {
      if (0 !== e.getBlock(k, w + 1, _) && !REPLACEABLE[e.getBlock(k, w + 1, _)]) return;
      y = { 1: 0, 0: 1, 5: 2, 4: 3 }[S];
      const t = [
          [0, -1],
          [0, 1],
          [1, 0],
          [-1, 0],
        ][y],
        s = e.getBlock(k + t[0], w, _ + t[1]),
        i = e.getMeta(k + t[0], w, _ + t[1]);
      !BLOCKS[s] || !BLOCKS[s].door || (3 & i) !== y || 16 & i || (y |= 16);
    }
    if ((g.needsSupport || g.door) && !this.supportedForPlace(k, w, _, p, y)) return;
    const T =
      g.states &&
      g.states[y] &&
      "lower" === g.states[y].half &&
      !g.door &&
      "pitcher_crop" !== g.key &&
      "undefined" != typeof Features;
    if (!(
      (T &&
        (w + 1 >= HEIGHT || (e.getBlock(k, w + 1, _) && !REPLACEABLE[e.getBlock(k, w + 1, _)]))) ||
      this.entityInWay(k, w, _, p, y)
    )) {
      if (IS_FLUID[p]) {
        if (p === WATER && "nether" === this.dim) {
          ("creative" !== this.mode && (t.inv.slots[t.inv.sel] = makeStack("bucket")),
            Sound.fizz([k, w, _]));
          for (let t = 0; t < 8; t++)
            this.particles.spawn(
              "smoke",
              k + Math.random(),
              w + Math.random(),
              _ + Math.random(),
              0,
              0.05,
              0,
            );
          return void t.swing();
        }
        return (
          b && !IS_FLUID[b] && this.dropBlockLoot(k, w, _, b, e.getMeta(k, w, _), null),
          e.setBlock(k, w, _, p, 0),
          "creative" !== this.mode && (t.inv.slots[t.inv.sel] = makeStack("bucket")),
          Sound.ev(p === LAVA ? "item.bucket.empty_lava" : "item.bucket.empty", [k, w, _], 1, 1) ||
            Sound.splash([k, w, _]),
          t.swing(),
          void this.flushMesh()
        );
      }
      if (
        (g.door && e.setBlock(k, w + 1, _, p, 8 | y, 0),
        g.chestLike && "ender_chest" !== g.key && !t.sneaking)
      )
        for (const t of [1, 2]) {
          const s = chestSeam(y | (1 === t ? 16 : 32)),
            i = k + s[0],
            o = _ + s[1],
            a = e.getMeta(i, w, o);
          if (e.getBlock(i, w, o) === p && !chestType(a) && (7 & a) === y) {
            ((y |= 1 === t ? 16 : 32), e.setMeta(i, w, o, a | (1 === t ? 32 : 16)));
            break;
          }
        }
      if ((this.placeAt(k, w, _, p, y, s, !1), T && e.getBlock(k, w, _) === p)) {
        this.pairBreak = k + "," + w + "," + _;
        try {
          e.setBlock(k, w + 1, _, p, Features.withProp(p, y, "half", "upper"), 1);
        } finally {
          this.pairBreak = null;
        }
      }
      M &&
        e.getBlock(k, w, _) === p &&
        canWaterlog(p, y) &&
        (e.setWaterlogged(k, w, _, !0), this.dowseCampfire && this.dowseCampfire(k, w, _));
    }
  }
  entityInWay(t, e, s, i, o) {
    const a = BLOCKS[i],
      r = this.world;
    if (!a) return !1;
    if ("bamboo" === a.key) {
      const i = r.getBlock(t, e - 1, s);
      if (i !== BID.bamboo && i !== BID.bamboo_sapling && r.getBlock(t, e + 1, s) !== BID.bamboo)
        return !1;
    }
    if (!a.solid && !a.collide) return !1;
    const h = a.fence ? r.fenceMeta(t, e, s, a) : o,
      l =
        a.shape === SH_BOXES || a.shape === SH_MODEL
          ? a.collide
            ? a.collide(h, null, e)
            : a.boxes(h)
          : a.shape === SH_CACTUS
            ? [[1, 0, 1, 15, 16, 15]]
            : a.solid
              ? [[0, 0, 0, 16, 16, 16]]
              : null;
    if (!l || !l.length) return !1;
    const blocks = (t) =>
      t instanceof Living ||
      t instanceof FallingBlock ||
      t instanceof PrimedTNT ||
      ("undefined" != typeof Vehicle && t instanceof Vehicle) ||
      ("undefined" != typeof ArmorStand && t instanceof ArmorStand) ||
      ("undefined" != typeof EndCrystal && t instanceof EndCrystal);
    for (const i of [this.player, ...this.entities]) {
      if (!blocks(i) || i.dead || i.deathTime > 0) continue;
      const o = i.box();
      for (const i of l)
        if (
          o[0] < t + i[3] / 16 &&
          o[3] > t + i[0] / 16 &&
          o[1] < e + i[4] / 16 &&
          o[4] > e + i[1] / 16 &&
          o[2] < s + i[5] / 16 &&
          o[5] > s + i[2] / 16
        )
          return !0;
    }
    return !1;
  }
  supportedForPlace(t, e, s, i, o) {
    const a = this.world;
    a.getBlock(t, e, s);
    return BLOCKS[i].door ? !!SOLIDCUBE[a.getBlock(t, e - 1, s)] : this.supported(t, e, s, i, o);
  }
  placeAt(t, e, s, i, o, a, r) {
    const h = this.player;
    (this.world.setBlock(t, e, s, i, o),
      127 === i &&
        this.blockEntities.set(t + "," + e + "," + s, {
          type: "spawner",
          pos: [t, e, s],
          mob: null,
        }));
    const l =
      /^(wheat|carrots|potatoes|beetroots|melon_stem|pumpkin_stem|torchflower_crop|pitcher_crop)$/.test(
        BLOCKS[i].key,
      )
        ? "item.crop.plant"
        : "nether_wart" === BLOCKS[i].key
          ? "item.nether_wart.plant"
          : null;
    ((l && Sound.ev(l, [t + 0.5, e + 0.5, s + 0.5], 1, 0.8)) ||
      Sound.block("place", BLOCKS[i].sound, [t + 0.5, e + 0.5, s + 0.5]),
      "creative" !== this.mode && (a.count--, a.count || (h.inv.slots[h.inv.sel] = null)),
      h.swing(),
      this.stats.placed++,
      this.stats.placed >= 100 && this.grant("build"),
      BLOCKS[i].gravity && this.onNeighborUpdate(t, e, s, i),
      this.flushMesh());
  }
  pickBlock() {
    const t = this.target;
    if (!t) return;
    let e = t.id;
    BLOCKS[e];
    const s = { 2: 2, 117: 20, 64: "wheat_seeds", 69: "oak_door", 38: "sugar_cane", 63: 3 };
    if ((void 0 !== s[e] && (e = "string" == typeof s[e] ? item(s[e]) : s[e]), !ITEMS[e])) return;
    const i = this.player.inv;
    for (let t = 0; t < 9; t++) if (i.slots[t] && i.slots[t].id === e) return void (i.sel = t);
    if ("creative" === this.mode) {
      let t = i.slots.findIndex((t, e) => e < 9 && !t);
      (t < 0 && (t = i.sel), (i.slots[t] = { id: e, count: maxStack(e), dmg: 0 }), (i.sel = t));
    } else {
      const t = i.slots.findIndex((t, s) => s >= 9 && s < 36 && t && t.id === e);
      if (t >= 0) {
        const e = i.slots[i.sel];
        ((i.slots[i.sel] = i.slots[t]), (i.slots[t] = e));
      }
    }
  }
  env(t) {
    const e = this.celestial(),
      s = Math.cos(e * Math.PI * 2),
      i = clamp(2 * s + 0.5, 0, 1),
      o = this.weather,
      a = this.player;
    let r = 0.8;
    if (a && this.world) {
      const t = this.world.getChunk(Math.floor(a.pos[0]) >> 4, Math.floor(a.pos[2]) >> 4);
      t &&
        (r =
          BIOME_TEMP[t.biome[16 * (15 & Math.floor(a.pos[2])) + (15 & Math.floor(a.pos[0]))]] ??
          0.8);
    }
    let h = hsv2rgb(
      0.62222224 - 0.05 * clamp(r / 3, -1, 1),
      0.5 + 0.1 * clamp(r / 3, -1, 1),
      1,
    ).map((t) => t * i);
    const l =
      a && this.world && this.world.gen2
        ? this.vbiomeAt(Math.floor(a.pos[0]), Math.floor(a.pos[2]))
        : null;
    if ((l && l.sky && (h = l.sky.map((t) => (t / 255) * i)), o > 0)) {
      const t = 0.6 * (0.3 * h[0] + 0.59 * h[1] + 0.11 * h[2]),
        e = 1 - 0.75 * o;
      h = h.map((s) => s * e + t * (1 - e));
    }
    let c = [
      (192 / 255) * (0.94 * i + 0.06),
      (216 / 255) * (0.94 * i + 0.06),
      1 * (0.91 * i + 0.09),
    ];
    l &&
      l.fog &&
      (c = [
        (l.fog[0] / 255) * (0.94 * i + 0.06),
        (l.fog[1] / 255) * (0.94 * i + 0.06),
        (l.fog[2] / 255) * (0.91 * i + 0.09),
      ]);
    let p = [0, 0, 0, 0];
    if (s >= -0.4 && s <= 0.4) {
      const t = (s / 0.4) * 0.5 + 0.5;
      let e = 1 - 0.99 * (1 - Math.sin(t * Math.PI));
      ((e *= e), (p = [0.3 * t + 0.7, t * t * 0.7 + 0.2, 0.2, e]));
    }
    const u = [-Math.sin(e * Math.PI * 2), Math.cos(e * Math.PI * 2), 0],
      f = this.renderer.renderDist;
    if (f >= 4 && p[3] > 0 && a) {
      const t = this.lookDir(),
        e = Math.hypot(t[0], t[2]) || 1,
        s = Math.max(0, (t[0] / e) * Math.sign(u[0] || 1)) * p[3];
      c = c.map((t, e) => t + (p[e] - t) * s);
    }
    const g = 1 - Math.pow(0.25 + (0.75 * f) / 32, 0.25);
    ((c = c.map((t, e) => t + (h[e] - t) * g)), o > 0 && (c = c.map((t) => t * (1 - 0.5 * o))));
    let m = 16 * f,
      k = m - clamp(m / 10, 4, 64);
    if (this.headInWater) {
      const t = Math.max(
        0.12,
        i *
          ((this.world.getLight(
            Math.floor(a.pos[0]),
            Math.floor(a.pos[1] + 1.6),
            Math.floor(a.pos[2]),
          ) >>
            4) /
            15),
      );
      ((c = [0.05 * t, 0.18 * t, 0.45 * t]),
        (k = -8),
        (m = 96 * clamp(this.waterVision || 0.25, 0.25, 1)));
    } else
      this.headInLava
        ? ((c = [0.6, 0.1, 0]), (k = 0.25), (m = 1))
        : this.headInPowder && ((c = [0.623, 0.734, 0.785]), (k = 0), (m = 2));
    if (
      (a.effects &&
        (a.hasEffect("blindness") || a.hasEffect("darkness")) &&
        ((c = [0, 0, 0]), (k = 0), (m = a.hasEffect("blindness") ? 5 : 15)),
      !this.headInWater && "play" === this.state)
    ) {
      const t = this.world.skyAt(
          Math.floor(a.pos[0]),
          Math.floor(a.pos[1] + 1.6),
          Math.floor(a.pos[2]),
        ),
        e = clamp(t / 10, 0.25, 1);
      c = c.map((t) => t * e + 0.02 * (1 - e));
    }
    if (
      a &&
      !this.headInWater &&
      !this.headInLava &&
      !this.headInPowder &&
      "function" == typeof nightVisionScale &&
      (!a.effects || !a.hasEffect("darkness")) &&
      c[0] &&
      c[1] &&
      c[2]
    ) {
      const t = nightVisionScale(a);
      if (t > 0) {
        const e = Math.max(c[0], c[1], c[2]),
          s = 1 / clamp(e, 0.07, 1),
          i = 1 / e;
        c = c.map((o) => o + (o * (o === e ? i : s) - o) * Math.min(1, t));
      }
    }
    let w = 1 - (2 * s + 0.25);
    ((w = clamp(w, 0, 1)), (w = w * w * 0.5 * (1 - o)));
    let _ = [0.9 * i + 0.1, 0.9 * i + 0.1, 0.85 * i + 0.15];
    if (o > 0) {
      const t = 0.6 * (0.3 * _[0] + 0.59 * _[1] + 0.11 * _[2]),
        e = 1 - 0.95 * o;
      _ = _.map((s) => s * e + t * (1 - e));
    }
    const b = Math.floor(this.worldTime / 24e3) % 8;
    let M = 1 - clamp(1 - (2 * s + 0.2), 0, 1);
    M *= 1 - (5 * o) / 16;
    const y = 0.8 * M + 0.2;
    return this.dimEnv({
      tick: this.worldTime + t,
      day: y,
      fogColor: c,
      skyColor: h,
      sunDir: u,
      sunset: p,
      voidColor: [0.2 * h[0] + 0.04, 0.2 * h[1] + 0.04, 0.6 * h[2] + 0.1],
      horizon: this.world && this.world.flat ? 0 : 63,
      celestial: e,
      starBright: 2 * w,
      sunAlpha: 1 - o,
      rain: o,
      moonPhase: b,
      temp: r,
      fogNear: k,
      fogFar: m,
      nightTint: [0.55, 0.62, 0.95],
      cloudColor: _,
    });
  }
  render(t, e) {
    const s = this.renderer,
      i = s.gl,
      o = this.ui.screen;
    this.lastA = t;
    if (
      !WEBKIT_GL &&
      (("play" === this.state && o && o.pauses) ||
        ("title" === this.state && o && o.blurBg && this.ui.blurOn && !this.panoCam))
    ) {
      const t =
        innerWidth +
        "x" +
        innerHeight +
        ":" +
        devicePixelRatio +
        ":" +
        s.resScale +
        ":" +
        ("title" === this.state ? s.sections.size : "") +
        ":" +
        JSON.stringify(this.settings);
      if (this.frozenKey === t && this.frozenFrames >= 2 && this.drawnGen === this.canvasGen)
        return (
          (this.titleFrozen = "title" === this.state),
          (this.halfWorld = !1),
          void this.ui.draw()
        );
      ((this.frozenFrames = this.frozenKey === t ? (this.frozenFrames || 0) + 1 : 0),
        (this.frozenKey = t));
    } else this.frozenKey = null;
    if (
      ((this.titleFrozen = !1),
      (this.halfWorld =
        "play" === this.state &&
        o instanceof ContainerScreen &&
        !o.pauses &&
        ((this.pacer && this.pacer.touch) || touchOn(this))),
      this.halfWorld)
    ) {
      if (
        ((this.oddFrame = !this.oddFrame),
        this.oddFrame && this.sizeCanvas(),
        this.oddFrame && this.drawnGen === this.canvasGen && !this.wantScreenshot)
      )
        return void this.ui.draw();
    } else this.oddFrame = !1;
    if (
      (this.sizeCanvas(),
      (this.drawnGen = this.canvasGen),
      (s.yOff = (this.world && "overworld" === this.dim && this.world.minY) || 0),
      i.viewport(0, 0, s.canvas.width, s.canvas.height),
      !this.world || "boot" === this.state)
    )
      return (i.clearColor(0, 0, 0, 1), i.clear(i.COLOR_BUFFER_BIT), void this.ui.draw());
    const a = this.player;
    let r,
      h,
      l,
      c = this.settings.fov;
    if ("title" === this.state || "loading" === this.state || "switching" === this.state) {
      if (
        ((r = this.titleCam || [0, 100, 0]),
        (h = this.titleYaw || 0),
        (l = this.titlePitch ?? -0.15),
        this.titleFov && (c = this.titleFov),
        this.panoCam)
      )
        ((h = this.panoCam.yaw), (l = this.panoCam.pitch), (c = 90));
      else if ("title" === this.state && this.panoAlpha >= 1 && Panorama.ready())
        return (s.drawPanorama(h, l, c, 1), void this.ui.draw());
      if ("title" !== this.state)
        return (
          i.clearColor(0, 0, 0, 1),
          i.clear(i.COLOR_BUFFER_BIT | i.DEPTH_BUFFER_BIT),
          void this.ui.draw()
        );
    } else {
      const e = a.ipos(t),
        s = this.sleeping ? 0.2 : a.eye();
      ((this.smoothEye = null == this.smoothEye ? s : lerp(this.smoothEye, s, 0.4)),
        (r = [e[0], e[1] + this.smoothEye, e[2]]),
        (this.frameA = t),
        (h = this.viewYaw()),
        (l = a.pitch),
        h === a.yaw ||
          this.ui.screen ||
          0 !== a.deathTime ||
          "spectator" === this.mode ||
          this.updateTarget(),
        this.sleeping &&
          ((h = [0, -Math.PI / 2, Math.PI, Math.PI / 2][this.sleeping.rot] + Math.PI), (l = 0.5)),
        a.deathTime > 0 && (r[1] -= Math.min(1.2, a.deathTime / 20)),
        (c *=
          1 + (lerp(this.oFovMod ?? 1, this.fovMod ?? 1, t) - 1) * (this.settings.fovEffects ?? 1)),
        this.headInWater && (c *= 6 / 7));
    }
    this.curFov = c;
    const p = this.env(t);
    ((p.nightVision = nightVisionScale(a)), s.updateLightmap(p, this.dim));
    let u = r;
    const f =
      self.POTATO && "play" === this.state && self.POTATO_CAM
        ? self.POTATO_CAM(this, r, h, l, t)
        : null;
    if (f) ((u = f.pos), (h = f.yaw), (l = f.pitch));
    else if ("play" === this.state && this.perspective > 0) {
      const t = 1 === this.perspective ? 4 : -4,
        e = [-Math.sin(h) * Math.cos(l), Math.sin(l), -Math.cos(h) * Math.cos(l)];
      (e[0], e[1], e[2]);
      let s = Math.abs(t);
      const i = [Math.sign(t) * -e[0], Math.sign(t) * -e[1], Math.sign(t) * -e[2]];
      for (let t = 0; t < 8; t++) {
        const e = [
            r[0] + 0.1 * (2 * (1 & t) - 1),
            r[1] + 0.1 * (2 * ((t >> 1) & 1) - 1),
            r[2] + 0.1 * (2 * ((t >> 2) & 1) - 1),
          ],
          o = this.raycast(e, i, s, !1, !0);
        if (o) {
          const t = o.point,
            e = Math.hypot(t[0] - r[0], t[1] - r[1], t[2] - r[2]);
          e < s && (s = e);
        }
      }
      ((u = [
        r[0] - e[0] * s * Math.sign(t),
        r[1] - e[1] * s * Math.sign(t),
        r[2] - e[2] * s * Math.sign(t),
      ]),
        2 === this.perspective && ((h += Math.PI), (l = -l)));
    }
    const g = this.shake || 0;
    ((this.shake = 0.9 * g),
      s.setCamera(
        u,
        h + (Math.random() - 0.5) * g * 0.05,
        l + (Math.random() - 0.5) * g * 0.05,
        this.curFov,
        (e) => {
          if ("play" === this.state) {
            if (a.hurtTime > 0) {
              const s = (a.hurtTime - t) / 10;
              M4.rotZ(e, 0.25 * Math.sin(s * s * s * s * Math.PI));
            }
            if (
              (a.deathTime > 0 && M4.rotZ(e, 0.6 * Math.min(1, a.deathTime / 20)),
              this.potRoll && M4.rotZ(e, this.potRoll),
              self.POTATO && this.settings.bobbing && 1 === this.perspective)
            ) {
              const s = lerp(a.prevBob, a.bob, t) * Math.PI * 0.6,
                i = lerp(a.prevBobAmt || 0, a.bobAmt, t);
              (M4.translate(e, Math.sin(s) * i * 0.35, 0.6 * -Math.abs(Math.cos(s) * i), 0),
                M4.rotZ(e, Math.sin(s) * i * 0.025));
            }
            if (this.settings.bobbing && 0 === this.perspective) {
              const s = lerp(a.prevBob, a.bob, t) * Math.PI * 0.6,
                i = lerp(a.prevBobAmt || 0, a.bobAmt, t);
              (M4.translate(e, Math.sin(s) * i * 0.5, -Math.abs(Math.cos(s) * i), 0),
                M4.rotZ(e, Math.sin(s) * i * 0.05),
                M4.rotX(e, 0.08 * Math.abs(Math.cos(s - 0.2) * i)));
            }
          }
        },
      ),
      (s.noCull =
        "play" !== this.state ||
        !!SOLIDCUBE[this.world.getBlock(Math.floor(u[0]), Math.floor(u[1]), Math.floor(u[2]))]));
    const m = s.fx && s.fx.ok && this.settings.shaders > 0 && !!FX_CFG[this.settings.shaders];
    (m && ((s.fx.level = this.settings.shaders), s.fx.begin(p, this)),
      this.headInWater || this.headInLava || this.headInPowder || "none" === p.sky
        ? (i.clearColor(p.fogColor[0], p.fogColor[1], p.fogColor[2], 1),
          i.clear(i.COLOR_BUFFER_BIT | i.DEPTH_BUFFER_BIT))
        : "end" === p.sky
          ? (i.clearColor(0, 0, 0, 1),
            i.clear(i.COLOR_BUFFER_BIT | i.DEPTH_BUFFER_BIT),
            s.drawEndSky())
          : (i.clear(i.DEPTH_BUFFER_BIT), s.drawSky(p)),
      s.drawTerrain(p),
      this.drawEntities(t, p),
      "end" !== this.dim && this.drawSpawners(t, p),
      this.drawChests(t, p),
      "play" === this.state && this.drawSelection(p));
    const k = [Math.cos(h), 0, -Math.sin(h)],
      w = [Math.sin(h) * Math.sin(l), Math.cos(l), Math.cos(h) * Math.sin(l)];
    (s.drawSprites(this.spriteList || [], p, k, w),
      this.particles.build(s.particleBuf, t, u, k, w),
      s.drawDynamic(s.particleBuf, s.particleGL, p, { noCull: !0 }),
      s.drawTranslucent(p),
      "overworld" !== this.dim ||
        this.headInLava ||
        this.headInPowder ||
        s.drawClouds(p, u[0], u[2]),
      "play" === this.state &&
        ("overworld" === this.dim && this.drawWeather(p, t),
        0 !== this.perspective ||
          0 !== a.deathTime ||
          "spectator" === this.mode ||
          this.sleeping ||
          (this.iconAt && e >= this.iconAt) ||
          (s.fxOn && i.depthRange(0, 0.01), this.drawHand(t, p), i.depthRange(0, 1))),
      m && s.fx.end(),
      this.iconAt &&
        "play" === this.state &&
        !this.ui.screen &&
        e >= this.iconAt &&
        this.captureIcon(),
      "title" === this.state &&
        this.panoAlpha > 0 &&
        Panorama.ready() &&
        s.drawPanorama(h, l, this.curFov, this.panoAlpha),
      this.ui.draw(),
      this.wantScreenshot && ((this.wantScreenshot = !1), this.saveScreenshot()));
  }
  saveScreenshot() {
    const t = this.renderer.canvas,
      e = this.ui.canvas,
      s = document.createElement("canvas");
    ((s.width = t.width), (s.height = t.height));
    const i = s.getContext("2d");
    (i.drawImage(t, 0, 0), i.drawImage(e, 0, 0, s.width, s.height));
    const o = new Date(),
      z = (t) => String(t).padStart(2, "0"),
      a = `${o.getFullYear()}-${z(o.getMonth() + 1)}-${z(o.getDate())}_${z(o.getHours())}.${z(o.getMinutes())}.${z(o.getSeconds())}.png`;
    s.toBlob((t) => {
      if (!t) return;
      const e = document.createElement("a");
      ((e.href = URL.createObjectURL(t)),
        (e.download = a),
        e.click(),
        setTimeout(() => URL.revokeObjectURL(e.href), 2e3),
        this.ui.message("已将截图保存为" + a, "#FFFFFF"));
    }, "image/png");
  }
  drawSelection(t) {
    const e = this.renderer,
      s = this.target;
    if (!s || this.ui.hideHud || 2 === this.perspective) return;
    const [i, o, a] = s.pos,
      r = [],
      h = 0.002;
    for (const t of this.selBoxes(i, o, a, s.id)) {
      const e = i + t[0] - h,
        s = o + t[1] - h,
        l = a + t[2] - h,
        c = i + t[3] + h,
        p = o + t[4] + h,
        u = a + t[5] + h,
        L = (t, e) => r.push(t[0], t[1], t[2], 0, 0, 0, 1, e[0], e[1], e[2], 0, 0, 0, 1),
        f = [
          [e, s, l],
          [c, s, l],
          [c, s, u],
          [e, s, u],
          [e, p, l],
          [c, p, l],
          [c, p, u],
          [e, p, u],
        ];
      for (let t = 0; t < 4; t++)
        (L(f[t], f[(t + 1) % 4]), L(f[t + 4], f[((t + 1) % 4) + 4]), L(f[t], f[t + 4]));
    }
    if (
      (e.gl.enable(e.gl.DEPTH_TEST),
      e.drawLines(r, [0, 0, 0, 0.45]),
      this.breaking && this.breaking.progress > 0)
    ) {
      const s = Math.min(9, Math.floor(10 * this.breaking.progress)),
        i = e.miscBuf;
      i.reset();
      const o = T("destroy_stage_" + s),
        [a, r, h] = this.breaking.pos;
      for (const t of this.selBoxes(a, r, h, this.world.getBlock(a, r, h)))
        for (let e = 0; e < 6; e++) {
          const s = FACES[e];
          for (const e of s.c) {
            const l = e[0] ? t[3] : t[0],
              c = e[1] ? t[4] : t[1],
              p = e[2] ? t[5] : t[2],
              u = s.uv(l, c, p);
            i.v(
              a + l + (e[0] ? 0.003 : -0.003),
              r + c + (e[1] ? 0.003 : -0.003),
              h + p + (e[2] ? 0.003 : -0.003),
              u[0],
              u[1],
              o,
              0,
              255,
              255,
              255,
              255,
              255,
              255,
              0,
            );
          }
        }
      e.drawDynamic(
        i,
        e.miscGL,
        { ...t, day: 1, fogNear: 1e8, fogFar: 2e8 },
        { blend: "mul", alphaTest: 0.01 },
      );
    }
  }
  drawEntities(t, e) {
    const s = this.renderer,
      i = s.gl;
    ((this.spriteList = []), i.enable(i.DEPTH_TEST), i.enable(i.CULL_FACE));
    const o = s.camPos,
      a = this.entities.slice();
    "play" === this.state &&
      this.perspective > 0 &&
      "spectator" !== this.mode &&
      a.push(this.player);
    const r = s.fxOn && s.fx.shadowOn ? (s.fx.entRec = []) : null;
    ((s.shRec = r), (this.boatPatches = []));
    try {
      this.drawEntityList(a, t, e, o);
    } finally {
      s.shRec = null;
    }
    if (this.boatPatches.length) {
      (i.disable(i.CULL_FACE), i.colorMask(!1, !1, !1, !1));
      try {
        for (const [t, i, o] of this.boatPatches) s.drawModel("vh_boat_patch", i, t, null, o, e);
      } catch (t) {
        this.reportError("boat patch", t, !0);
      } finally {
        (i.colorMask(!0, !0, !0, !0), i.enable(i.CULL_FACE), (this.boatPatches = []));
      }
    }
    if ("undefined" != typeof Jing)
      try {
        Jing.draw(this, t, e);
      } catch (t) {
        this.reportError("companion", t, !0);
      }
    if (this.net && !this.ui.hideHud)
      try {
        this.net.drawNames(t);
      } catch (t) {
        this.reportError("name tags", t, !0);
      }
    if (
      r &&
      "play" === this.state &&
      0 === this.perspective &&
      "spectator" !== this.mode &&
      0 === this.player.deathTime
    ) {
      ((s.shRec = r), (s.shRecOnly = !0));
      try {
        this.drawMob(this.player, this.player.ipos(t), t, e, this.player.lightAt());
      } catch (t) {
        this.reportError("player shadow", t, !0);
      } finally {
        ((s.shRec = null), (s.shRecOnly = !1));
      }
    }
  }
  entityViewDist(t, e) {
    const s = (t.w + t.h + t.w) / 3;
    return t instanceof Mob || t instanceof ItemEntity
      ? (s == s ? s : 1) * e
      : t instanceof Arrow && !t.snowball
        ? (s == s ? 10 * s : 1) * e
        : t instanceof Arrow ||
            t instanceof Fireball ||
            t instanceof DragonFireball ||
            t instanceof ThrownPearl ||
            t instanceof EyeOfEnder ||
            ("undefined" != typeof WitherSkull && t instanceof WitherSkull) ||
            ("undefined" != typeof ThrownPotion && t instanceof ThrownPotion) ||
            ("undefined" != typeof ArmorStand && t instanceof ArmorStand)
          ? 64 * (s > 0 ? 4 * s : 4)
          : "undefined" != typeof ShulkerBullet && t instanceof ShulkerBullet
            ? 128
            : ("undefined" != typeof FireworkRocket && t instanceof FireworkRocket) ||
                ("undefined" != typeof FishingHook && t instanceof FishingHook)
              ? 64
              : "undefined" != typeof LeashKnot && t instanceof LeashKnot
                ? 32
                : "undefined" != typeof ItemFrame && t instanceof ItemFrame
                  ? 16 * e
                  : (s == s ? s : 1) * e;
  }
  drawEntityList(t, e, s, i) {
    const o = this.renderer,
      a = o.gl,
      r = 64 * clamp(o.renderDist / 8, 1, 2.5),
      h = (16 * o.renderDist) ** 2,
      l =
        !o.fxOn && (this.headInWater || this.headInLava || this.headInPowder)
          ? (s.fogFar + 4) ** 2
          : 1 / 0;
    for (const c of t)
      try {
        const t = c.ipos(e),
          p = t[0] - i[0],
          u = t[2] - i[2],
          f = p * p + u * u;
        if (f > h) continue;
        if (!(
          c instanceof EnderDragon ||
          c instanceof Ghast ||
          ("player" === c.type && c !== this.player)
        )) {
          if (f > l) continue;
          const e = this.entityViewDist(c, r);
          if (f + (t[1] - i[1]) ** 2 >= e * e) continue;
        }
        const g = c instanceof EnderDragon ? 14 : c instanceof Ghast ? 5 : 2;
        if (
          !aabbInFrustum(o.planes, t[0] - g, t[1] - g, t[2] - g, t[0] + g, t[1] + 3 + g, t[2] + g)
        )
          continue;
        const m = c.lightAt();
        if (c.drawSelf) {
          c.drawSelf(this, t, e, s, m);
          continue;
        }
        if (c instanceof EnderDragon) {
          this.drawDragon(c, t, e, s);
          continue;
        }
        if (c instanceof EndCrystal) {
          this.drawCrystal(c, t, e, s);
          continue;
        }
        if (
          c instanceof Fireball ||
          c instanceof DragonFireball ||
          c instanceof ThrownPearl ||
          c instanceof EyeOfEnder ||
          void 0 !== c.spriteLayer
        ) {
          const e =
            void 0 !== c.spriteLayer
              ? c.spriteLayer
              : c instanceof ThrownPearl
                ? T("i_ender_pearl")
                : c instanceof EyeOfEnder
                  ? T("i_ender_eye")
                  : T("i_fire_charge");
          this.spriteList.push({
            pos: [t[0], t[1] + c.h / 2, t[2]],
            size: (c instanceof Fireball && !c.small) || c instanceof DragonFireball ? 0.5 : 0.18,
            layer: e,
            bright: !(c instanceof ThrownPearl),
            col: c instanceof DragonFireball ? [200, 80, 255] : null,
          });
          continue;
        }
        if (c instanceof AreaCloud) continue;
        if (c instanceof ExperienceOrb) {
          const s = (c.age + e) / 2,
            i = 0.5 * (Math.sin(s) + 1),
            o = 0.1 * (Math.sin(s + 4.18879) + 1);
          this.spriteList.push({
            pos: [t[0], t[1] + 0.1, t[2]],
            size: 0.15,
            layer: T("xp_orb_" + c.icon),
            bright: !0,
            col: [Math.round(255 * i), 255, Math.round(255 * o)],
          });
          continue;
        }
        if (c instanceof Mob || c === this.player) {
          if (
            (this.drawMob(c, t, e, s, m),
            c.fire > 0 && !c.fireproof && 0 === c.deathTime && !c.inWater)
          ) {
            const e = 1.4 * c.w * (c.T && c.T.scale && c.T.scale > 1 ? c.T.scale : 1),
              s = o.camPos,
              i = s[0] - t[0],
              a = s[2] - t[2],
              r = Math.hypot(i, a) || 1,
              h = T("fire_0"),
              l = T("fire_1");
            for (let s = 0, o = 0; o < 0.9 * c.h; s++, o += 0.45 * e) {
              const c = 0.03 * s + 0.3 * e;
              this.spriteList.push({
                pos: [t[0] + (i / r) * c, t[1] + o + 0.7 * e, t[2] + (a / r) * c],
                w: 0.5 * e,
                h: 0.7 * e,
                layer: s % 2 ? l : h,
                anim: ANIM_FRAMES[s % 2 ? l : h],
                bright: !0,
                cyl: !0,
              });
            }
          }
        } else if (c instanceof ItemEntity) {
          const i = c.stack;
          if (!(i && ITEMS[i.id])) continue;
          const o = (c.age + e) / 20,
            a = 0.1 * Math.sin(2 * o + c.bobOff) + 0.1,
            r = i.count > 16 ? 3 : i.count > 1 ? 2 : 1;
          for (let e = 0; e < r; e++) {
            const r = M4.create();
            (M4.translate(r, t[0] + 0.06 * e, t[1] + a + 0.05 + 0.03 * e, t[2] + 0.04 * e),
              M4.rotY(r, o + c.bobOff),
              this.drawItemModel(i.id, r, m, s, "ground", i));
          }
        } else if (c instanceof FallingBlock || c instanceof PrimedTNT) {
          const e = c instanceof PrimedTNT ? 26 : c.blockId,
            i = this.blockMesh(e, c.meta || 0),
            r = M4.create();
          let h = 1;
          (c instanceof PrimedTNT && c.fuse < 10 && (h = 1 + 0.2 * (1 - c.fuse / 10)),
            M4.translate(r, t[0], t[1] + 0.49, t[2]),
            M4.scale(r, h, h, h),
            M4.translate(r, -0.5, -0.49, -0.5),
            o.drawMesh(i, r, s, m),
            c instanceof PrimedTNT &&
              ((c.fuse / 5) | 0) % 2 == 0 &&
              (a.enable(a.BLEND),
              a.blendFunc(a.SRC_ALPHA, a.ONE),
              a.depthFunc(a.LEQUAL),
              o.drawMesh(i, r, s, [1, 1], { color: [1, 1, 1, 0.5] }),
              a.disable(a.BLEND),
              a.depthFunc(a.LESS)));
        } else if (c instanceof Arrow) {
          const e = c.snowball ? ITEMS[c.snowball].tex : T("i_arrow");
          for (let i = 0; i < (c.snowball ? 1 : 2); i++) {
            const a = M4.create();
            (M4.translate(a, t[0], t[1], t[2]),
              M4.rotY(a, c.yaw + Math.PI / 2),
              M4.rotZ(a, c.pitch),
              i && M4.rotX(a, Math.PI / 2),
              M4.rotZ(a, -Math.PI / 4),
              M4.scale(a, 0.7, 0.7, 0.7),
              M4.translate(a, -0.5, -0.5, 0),
              o.drawMesh(this.spriteMesh(e), a, s, m));
          }
        }
      } catch (t) {
        (this.reportError("draw " + (c.type || c.constructor.name), t, !0),
          a.enable(a.DEPTH_TEST),
          a.enable(a.CULL_FACE),
          a.depthMask(!0),
          a.depthFunc(a.LESS),
          a.disable(a.BLEND));
      }
  }
  drawMob(t, e, s, i, o) {
    const a = this.renderer,
      r = a.gl,
      h = t === this.player,
      l = h || "player" === t.type,
      c = l && "undefined" != typeof Skins ? Skins.modelOf(this, t) : h ? "steve" : t.T.model;
    let p = M4.create();
    if (t.displayMatrix) p = M4.copy(t.displayMatrix);
    else {
      M4.translate(p, e[0], e[1], e[2]);
      let i = h ? this.playerBodyYaw(s) : t.bodyYaw;
      const o = h || "player" === t.type;
      if (
        (o &&
          t.sneaking &&
          !t.flying &&
          "swim" !== t.pose &&
          !t.netSwim &&
          M4.translate(p, 0, -2 / 16, 0),
        !h && void 0 !== t.prevBodyYaw)
      ) {
        let e = t.bodyYaw - t.prevBodyYaw;
        for (; e > Math.PI;) e -= 2 * Math.PI;
        for (; e < -Math.PI;) e += 2 * Math.PI;
        i = t.prevBodyYaw + e * s;
      }
      M4.rotY(p, i);
      const a = o ? lerp(t.prevSwimAmt || 0, t.swimAmt || 0, s) : 0;
      if (o && t.gliding) {
        const e = h ? Math.min(1, ((t.glideT || 0) + s) ** 2 / 100) : 1;
        t.glideFlip
          ? M4.rotX(p, (Math.PI / 2 - t.pitch) * e)
          : (M4.rotX(p, (-Math.PI / 2 + t.pitch) * e), M4.translate(p, 0, -1 * e, 0.3 * e));
      } else
        o &&
          a > 0.01 &&
          (M4.rotX(p, (-Math.PI / 2 + (t.swimming ? t.pitch : 0)) * a),
          M4.translate(p, 0, -1 * a, 0.3 * a));
    }
    t.deathTime > 0 && M4.rotZ(p, (Math.min(1, Math.sqrt((t.deathTime + s) / 20)) * Math.PI) / 2);
    let u = h ? 0.9375 : t.T.scale;
    if ((t instanceof MagmaCube && (u = t.size), "creeper" === t.type && t.fuse >= 0)) {
      const e = lerp(t.prevFuse, t.fuse, s) / 28;
      u *= (1 + 0.4 * e) * (1 + Math.sin(100 * e) * e * 0.01);
    }
    (t.baby && (u *= 0.5), M4.scale(p, u, u, u));
    const f = h ? this.playerPose(s) : t.pose(s);
    this.frameA = s;
    let g = t.hurtTime > 0 || t.deathTime > 0 ? [1, 0, 0, 0.4] : null;
    "creeper" === t.type && t.fuse >= 0 && ((t.fuse / 4) | 0) % 2 == 0 && (g = [1, 1, 1, 0.5]);
    const m = [o[0], o[1]];
    t.fire > 0 && (m[1] = 1);
    let k = null;
    h && t.inv.held
      ? (k = t.inv.held.id)
      : null != t.heldId
        ? (k = t.heldId)
        : "skeleton" === t.type
          ? (k = item("bow"))
          : "zombified_piglin" === t.type
            ? (k = item("golden_sword"))
            : "piglin" === t.type && (k = t.holding || item("golden_sword"));
    const w =
        null == k
          ? null
          : h
            ? t.inv.held
            : t.hand && t.hand.id === k
              ? t.hand
              : { id: k, count: 1, dmg: 0 },
      _ = h ? t.inv.slots[40] : t.offhand && !t.offhand.unk ? t.offhand : null,
      b = this.heldAttach(t, c, w, _, m, i);
    let M =
      l && "undefined" != typeof Skins
        ? Skins.texOf(this, t)
        : "steve" === c
          ? "steve"
          : "sheep" === t.type
            ? "sheep"
            : (t.T && t.T.tex) || c;
    if (
      ("strider" !== t.type || t.warm || (M = "strider_cold"),
      t.skin && (M = t.skin(a)),
      t instanceof Ghast && t.charge > 10 && (M = "ghast_shooting"),
      t instanceof MagmaCube)
    ) {
      const e = lerp(t.prevSquish, t.squish, s);
      for (let t = 0; t < 8; t++) f["s" + t] = { t: [0, (7 - t) * e * 0.06, 0] };
    }
    const y = !!(t.invisible || (t.hasEffect && t.hasEffect("invisibility")));
    if (
      (a.gl.disable(a.gl.CULL_FACE),
      a.drawModel(c, M, p, f, m, i, {
        overlay: g,
        attach: b,
        bright: !(!t.T || !t.T.bright),
        hidden: y,
      }),
      l && (this.lastPlayerModel = { m: p, poses: f, lt: m }),
      a.gl.enable(a.gl.CULL_FACE),
      y)
    ) {
      const e = h ? t.inv.slots.slice(36, 40) : t.armorItems || [];
      return (
        (l ||
          "zombie" === t.T.model ||
          "skeleton" === t.T.model ||
          "zombified_piglin" === t.T.model) &&
          this.drawArmor(e, p, f, m, i, { overlay: g, baby: !!t.baby }),
        void (l && this.drawWings && this.drawWings(t, p, m, i, g))
      );
    }
    t instanceof Enderman &&
      (r.enable(r.BLEND),
      r.blendFunc(r.ONE, r.ONE),
      r.depthFunc(r.LEQUAL),
      a.drawModel("enderman", "enderman_eyes", p, f, [1, 1], i, { bright: !0 }),
      r.disable(r.BLEND),
      r.depthFunc(r.LESS));
    const v = h ? t.inv.slots.slice(36, 40) : t.armorItems || [];
    if (
      ((l ||
        "zombie" === t.T.model ||
        "skeleton" === t.T.model ||
        "zombified_piglin" === t.T.model) &&
        this.drawArmor(v, p, f, m, i, { overlay: g, baby: !!t.baby }),
      l && this.drawWings && this.drawWings(t, p, m, i, g),
      "sheep" === t.type && !t.sheared)
    ) {
      const e = WOOL_RGB[t.woolColor] || [1, 1, 1];
      a.drawModel("sheep_wool", "sheep_wool", p, f, m, i, { overlay: g, tint: e });
    }
    if (
      ("spider" === t.type &&
        (r.enable(r.BLEND),
        r.blendFunc(r.ONE, r.ONE),
        r.depthFunc(r.LEQUAL),
        a.drawModel("spider", "spider_eyes", p, f, [1, 1], i, {}),
        r.disable(r.BLEND),
        r.depthFunc(r.LESS)),
      0 === t.deathTime && !t.displayMatrix)
    ) {
      const s = Math.floor(e[0]),
        i = Math.floor(e[2]);
      let o = Math.floor(e[1] + 0.01);
      for (
        let t = 0;
        t < 4 &&
        o > 0 &&
        !SOLIDCUBE[this.world.getBlock(s, o - 1, i)] &&
        !BLOCKS[this.world.getBlock(s, o - 1, i)]?.solid;
        t++
      )
        o--;
      const r = e[1] - o;
      r < 3 && a.drawShadow(e[0], o, e[2], 0.75 * t.w * (1 - r / 6), 0.55 * (1 - r / 3));
    }
  }
  drawArmor(t, e, s, i, o, a = {}) {
    const r = this.renderer;
    if (!t.some((t) => t)) return;
    const h = [["head"], ["body", "rarm", "larm"], ["body", "rleg", "lleg"], ["rleg", "lleg"]];
    t.forEach((t, l) => {
      if (!t) return;
      const c = ITEMS[t.id].armor,
        p = c && c.mat;
      if (!p || "elytra" === p) return;
      const u = 2 === l,
        f = u ? "armor_inner" : "armor_outer",
        g = r.beTex("armor_" + p + (u ? "_legs" : ""));
      if (!g) return;
      const m = {};
      for (const t of ["head", "body", "rarm", "larm", "rleg", "lleg"])
        m[t] = h[l].includes(t) ? (s && s[t]) || {} : { hidden: !0 };
      (r.drawModel(f, g, e, m, i, o, {
        ...a,
        tint:
          "leather" === p
            ? "function" == typeof dyeTintOf
              ? dyeTintOf(t, [160 / 255, 101 / 255, 64 / 255])
              : [160 / 255, 101 / 255, 64 / 255]
            : null,
      }),
        "function" == typeof stackGlint &&
          stackGlint(t) &&
          r.drawModel(f, g, e, m, i, o, { ...a, glint: "armor", glintOnly: !0 }),
        "leather" === p && r.drawModel(f, g + "_overlay", e, m, i, o, a));
      const k = t.trim && r.trimTex && !a.baby ? r.trimTex(t.trim, p, u) : null;
      if (k) {
        const t = r.gl;
        (t.depthFunc(t.LEQUAL), r.drawModel(f, k, e, m, i, o, a), t.depthFunc(t.LESS));
      }
    });
  }
  tickPlayerBody(t) {
    const wrap = (t) => {
      for (; t > Math.PI;) t -= 2 * Math.PI;
      for (; t < -Math.PI;) t += 2 * Math.PI;
      return t;
    };
    if (
      ((void 0 !== t.bodyYaw && void 0 !== t.prevBodyYaw) || (t.bodyYaw = t.prevBodyYaw = t.yaw),
      "swim" === t.pose || t.gliding || t.sleeping || this.sleeping)
    )
      return void (t.bodyYaw = t.yaw);
    const e = t.pos[0] - t.prev[0],
      s = t.pos[2] - t.prev[2];
    let i = t.bodyYaw;
    (e * e + s * s > 0.0025 &&
      ((i = Math.atan2(-e, -s)),
      Math.abs(wrap(t.yaw - i)) > (95 * Math.PI) / 180 && (i += Math.PI)),
      t.swingT > 0 && (i = t.yaw),
      (t.bodyYaw += 0.3 * wrap(i - t.bodyYaw)));
    const o = wrap(t.yaw - t.bodyYaw),
      a = (50 * Math.PI) / 180;
    (Math.abs(o) > a && (t.bodyYaw += o - Math.sign(o) * a),
      (t.bodyYaw = t.yaw + wrap(t.bodyYaw - t.yaw)));
  }
  playerBodyYaw(t) {
    const e = this.player;
    if (void 0 === e.bodyYaw) return e.yaw;
    let s = e.bodyYaw - (e.prevBodyYaw ?? e.bodyYaw);
    for (; s > Math.PI;) s -= 2 * Math.PI;
    for (; s < -Math.PI;) s += 2 * Math.PI;
    return (e.prevBodyYaw ?? e.bodyYaw) + s * t;
  }
  playerPose(t) {
    const e = this.player,
      s = 0.6662 * lerp(e.limbSwing - e.limbAmt, e.limbSwing, t),
      i = e.limbAmt,
      o = 1.4 * Math.cos(s) * i,
      a = -o;
    let r = e.yaw - this.playerBodyYaw(t);
    for (; r > Math.PI;) r -= 2 * Math.PI;
    for (; r < -Math.PI;) r += 2 * Math.PI;
    const h = {
      head: { rx: e.pitch, ry: r },
      body: {},
      rarm: { rx: -Math.cos(s) * i },
      larm: { rx: Math.cos(s) * i },
      rleg: { rx: o },
      lleg: { rx: a },
    };
    e.inv.held && (h.rarm.rx = 0.5 * h.rarm.rx + Math.PI / 10);
    const l = e.swingDur || 6,
      c = e.swingT > 0 ? clamp((l - e.swingT + t) / l, 0, 1) : 0,
      p = "off" === e.swingHand,
      u = p ? h.larm : h.rarm;
    if (c > 0) {
      const t = 0.2 * -Math.sin(Math.sqrt(c) * Math.PI * 2) * (p ? -1 : 1),
        e = Math.cos(t),
        s = Math.sin(t);
      ((h.body.ry = t), (h.rarm.t = [6 * e - 6, 0, -6 * s]), (h.larm.t = [-6 * e + 6, 0, 6 * s]));
    }
    if (c > 0 && !e.swingStab) {
      const t = h.body.ry;
      ((h.rarm.ry = t), (h.larm.ry = t), (h.larm.rx += t));
      let s = 1 - c;
      ((s *= s), (s *= s), (s = 1 - s));
      const i = Math.sin(s * Math.PI),
        o = Math.sin(c * Math.PI) * (e.pitch + 0.7) * 0.75;
      ((u.rx += 1.2 * i + o), (u.ry += 2 * t), (u.rz = -0.4 * Math.sin(c * Math.PI)));
    }
    if ("swim" === e.pose)
      return swimLimbs(h, lerp(e.limbSwing - e.limbAmt, e.limbSwing, t), e.swimming);
    if (e.sneaking && !e.flying) {
      ((h.head.t = [0, -0.2625, 0]), (h.body.t = [0, -1.73 / 16, 5.75 / 16]), (h.body.rx = -0.5));
      for (const t of ["rarm", "larm"]) {
        const e = h[t].t || [0, 0, 0];
        ((h[t].t = [e[0] / 16, e[1] / 16 - 0.2, e[2] / 16]), (h[t].rx -= 0.4));
      }
      for (const t of ["rleg", "lleg"]) h[t].t = [0, -0.0125, 0.25];
    } else for (const t of ["rarm", "larm"]) h[t].t && (h[t].t = h[t].t.map((t) => t / 16));
    const f = (e.age || this.tickCount || 0) + t;
    return (
      (h.rarm.rz = (h.rarm.rz || 0) + 0.05 * Math.cos(0.09 * f) + 0.05),
      (h.larm.rz = (h.larm.rz || 0) - (0.05 * Math.cos(0.09 * f) + 0.05)),
      (h.rarm.rx -= 0.05 * Math.sin(0.067 * f)),
      (h.larm.rx += 0.05 * Math.sin(0.067 * f)),
      h
    );
  }
  blockMesh(t, e) {
    this._bm || (this._bm = new Map());
    const s = 256 * t + e;
    let i = this._bm.get(s);
    return (i || ((i = Mesher.single(t, e)), this._bm.set(s, i)), i);
  }
  spriteMesh(t) {
    return itemSpriteMesh(t);
  }
  itemLayers(t, e, s, i) {
    if (!(s && s.gen && s.model.layers && s.model.layers.length))
      return [[i ? (e.flat ? T(e.flat) : i.tex[0]) : e.tex, null]];
    const o = VM.data.items[e.key];
    return s.model.layers.map((e, s) => [T(e), stackTint(this.renderer, o, s, t)]);
  }
  drawLayers(t, e, s, i, o) {
    t.forEach(([t, a], r) => {
      let h = e;
      r && ((h = new Float32Array(e)), M4.scale(h, 1, 1, 1 + 0.08 * r));
      const l = a ? { color: [a[0] / 255, a[1] / 255, a[2] / 255, 1] } : {};
      (o && (l.glint = "item"), this.renderer.drawMesh(this.spriteMesh(t), h, s, i, l));
    });
  }
  drawItemModel(t, e, s, i, o, a) {
    const r = ITEMS[t],
      h = this.renderer;
    if (!r) return;
    if ("shield" === r.key && this.drawShieldItem && ("ground" === o || "fixed" === o))
      return void this.drawShieldItem(a || { id: t, count: 1 }, e, s, i, o);
    const l = void 0 !== r.block ? BLOCKS[r.block] : null,
      c = h.itemModel(t),
      p = c
        ? c.gen || (!l && !c.mesh)
        : !l || r.flat || l.shape === SH_CROSS || l.shape === SH_TORCH || l.ladder || l.door,
      u = "function" == typeof stackGlint && stackGlint(a || { id: t });
    if (p) {
      const t = new Float32Array(e);
      ("ground" === o && (M4.scale(t, 0.5, 0.5, 0.5), M4.translate(t, -0.5, 0, 0)),
        this.drawLayers(this.itemLayers(a, r, c, l), t, i, s, u));
    } else {
      const a = new Float32Array(e);
      if (
        ("ground" === o &&
          (M4.scale(a, 0.25, 0.25, 0.25), M4.translate(a, -0.5, 0, l && l.bed ? -1 : -0.5)),
        c && c.mesh)
      )
        return void h.drawMesh(c.mesh, a, i, s, { glint: u && "item" });
      if (this.isBEItem({ id: t })) return void this.drawBEItem(l, a, s, i);
      let p = l.facing ? 4 : 0;
      (l.stairs && (p = 0),
        h.drawMesh(this.blockMesh(r.block, p), a, i, s, { glint: u && "item" }));
    }
  }
  drawHand(t, e) {
    const s = this.renderer,
      i = s.gl,
      o = this.player;
    s.fxOn || i.clear(i.DEPTH_BUFFER_BIT);
    const a = M4.create();
    M4.perspective(a, (70 * Math.PI) / 180, s.canvas.width / s.canvas.height, 0.05, 10);
    const r = s.vp,
      h = s.camPos;
    ((s.vp = a), (s.camPos = [0, 0, 0]));
    const l = o.inv.held,
      c = l ? l.id : -1,
      p = void 0 === o.handItem ? c : o.handItem,
      u = p === c ? l : p >= 0 ? { id: p, count: 1, dmg: 0 } : null,
      f = 1 - lerp(o.oHandH ?? 1, o.handH ?? 1, t),
      g = o.swingT > 0 && "off" !== o.swingHand ? clamp((6 - o.swingT + t) / 6, 0, 1) : 0,
      m = Math.PI / 180,
      k = Math.PI,
      w = M4.create();
    if (this.settings.bobbing) {
      const e = lerp(o.prevBob, o.bob, t) * k * 0.6,
        s = lerp(o.prevBobAmt || 0, o.bobAmt, t);
      M4.translate(w, Math.sin(e) * s * 0.5, -Math.abs(Math.cos(e) * s), 0);
    }
    const _ = o.lightAt(),
      b = { ...e, fogNear: 1e8, fogFar: 2e8 };
    if (u) {
      const e = ITEMS[u.id],
        i = void 0 !== e.block ? BLOCKS[e.block] : null,
        a = s.itemModel(u.id),
        l = a
          ? a.gen || (!i && !a.mesh)
          : !i || e.flat || i.shape === SH_CROSS || i.shape === SH_TORCH || i.ladder || i.door,
        c = o.usingItem === u.id && "off" !== o.useHand,
        p = c && (e.food || /^(potion|milk_bucket|honey_bottle|ominous_bottle)$/.test(e.key)),
        M = c && "bow" === e.key;
      if (p) {
        const s = "honey_bottle" === e.key ? 40 : 32,
          i = s - o.useT - t + 1,
          a = i / s;
        a < 0.8 && M4.translate(w, 0, Math.abs(0.1 * Math.cos((i / 4) * k)), 0);
        const r = 1 - Math.pow(Math.max(0, a), 27);
        (M4.translate(w, 0.6 * r, -0.5 * r, 0),
          M4.rotY(w, 90 * r * m),
          M4.rotX(w, 10 * r * m),
          M4.rotZ(w, 30 * r * m),
          M4.translate(w, 0.56, -0.52 - 0.6 * f, -0.72));
      } else if (M) {
        (M4.translate(w, 0.56, -0.52 - 0.6 * f, -0.72),
          M4.translate(w, -0.2785682, 0.18344387, 0.15731531),
          M4.rotX(w, -13.935 * m),
          M4.rotY(w, 35.3 * m),
          M4.rotZ(w, -9.785 * m));
        let e = (o.useT + t) / 20;
        ((e = (e * e + 2 * e) / 3),
          e > 1 && (e = 1),
          e > 0.1 && M4.translate(w, 0, Math.sin(1.3 * (o.useT - 0.1)) * (e - 0.1) * 0.004, 0),
          M4.translate(w, 0, 0, 0.04 * e),
          M4.scale(w, 1, 1, 1 + 0.2 * e),
          M4.rotY(w, -45 * m));
      } else {
        const t = Math.sqrt(g);
        (M4.translate(w, -0.4 * Math.sin(t * k), 0.2 * Math.sin(t * k * 2), -0.2 * Math.sin(g * k)),
          M4.translate(w, 0.56, -0.52 - 0.6 * f, -0.72));
        const e = Math.sin(g * g * k);
        (M4.rotY(w, (45 + -20 * e) * m),
          M4.rotZ(w, -20 * e * m * Math.sin(t * k)),
          M4.rotX(w, -80 * Math.sin(t * k) * m),
          M4.rotY(w, -45 * m));
      }
      const y = a && a.model && a.model.display,
        v =
          (y && y.firstperson_righthand) ||
          (l
            ? { r: [0, -90, 25], t: [1.13, 3.2, 1.13], s: [0.68, 0.68, 0.68] }
            : y
              ? { r: [0, 0, 0], t: [0, 0, 0], s: [1, 1, 1] }
              : { r: [0, 45, 0], t: [0, 0, 0], s: [0.4, 0.4, 0.4] });
      if (
        (self.preItemDisplay && self.preItemDisplay(this, w, u, !1, o, "first", t),
        M4.translate(w, v.t[0] / 16, v.t[1] / 16, v.t[2] / 16),
        M4.rotX(w, v.r[0] * m),
        M4.rotY(w, v.r[1] * m),
        M4.rotZ(w, v.r[2] * m),
        M4.scale(w, v.s[0], v.s[1], v.s[2]),
        l)
      ) {
        M4.translate(w, -0.5, -0.5, 0);
        let t = this.itemLayers(u, e, a, i);
        if (M && !e.tcTool) {
          const e = o.useT;
          t = [
            [
              T(e >= 18 ? "i_bow_pulling_2" : e >= 13 ? "i_bow_pulling_1" : "i_bow_pulling_0"),
              null,
            ],
          ];
        }
        this.drawLayers(t, w, b, _, "function" == typeof stackGlint && stackGlint(u));
      } else {
        M4.translate(w, -0.5, -0.5, -0.5);
        const t = { glint: "function" == typeof stackGlint && stackGlint(u) && "item" };
        if (a && a.mesh) return (s.drawMesh(a.mesh, w, b, _, t), (s.vp = r), void (s.camPos = h));
        let o = i.facing ? 4 : 0;
        (i.stairs && (o = 0), s.drawMesh(this.blockMesh(e.block, o), w, b, _, t));
      }
    } else {
      const t = Math.sqrt(g);
      (M4.translate(
        w,
        -0.3 * Math.sin(t * k) + 0.64,
        0.4 * Math.sin(t * k * 2) - 0.6 - 0.6 * f,
        -0.4 * Math.sin(g * k) - 0.72,
      ),
        M4.rotY(w, 45 * m),
        M4.rotY(w, 70 * Math.sin(t * k) * m),
        M4.rotZ(w, -20 * Math.sin(g * g * k) * m),
        M4.translate(w, -1, 3.6, 3.5),
        M4.rotZ(w, 120 * m),
        M4.rotX(w, 200 * m),
        M4.rotY(w, -135 * m),
        M4.translate(w, 5.6, 0, 0),
        M4.translate(w, -6 / 16, 2 / 16, 0),
        M4.rotZ(w, k),
        s.drawModel(
          "undefined" != typeof Skins ? Skins.armOf(this, !1) : "arm",
          "undefined" != typeof Skins ? Skins.texOf(this, o) : "steve",
          w,
          null,
          _,
          b,
          { vp: a },
        ));
    }
    ((s.vp = r), (s.camPos = h));
  }
  weatherCols(t, e, s, i, o) {
    const a = this.world,
      r = (2 * o + 1) * (2 * o + 1);
    let h = this.wxCols;
    if (
      ((h && h.N === r) ||
        (h = this.wxCols =
          {
            N: r,
            n: 0,
            tick: -1,
            px: 0,
            pz: 0,
            cy: 0,
            w: null,
            cx: new Float64Array(r),
            cz: new Float64Array(r),
            y0: new Int32Array(r),
            y1: new Int32Array(r),
            sx: new Float64Array(r),
            sz: new Float64Array(r),
            cold: new Uint8Array(r),
            li: new Uint16Array(r),
            k: new Float64Array(r),
            i3: new Uint8Array(r),
            u0: new Float64Array(r),
            gx: new Int32Array(4096),
            gz: new Int32Array(4096),
            gy: new Int32Array(4096).fill(-1e9),
            gf: new Uint8Array(4096),
          }),
      h.tick === i && h.px === t && h.pz === e && h.cy === s && h.w === a)
    )
      return h;
    (h.w !== a && h.gy.fill(-1e9), (h.tick = i), (h.px = t), (h.pz = e), (h.cy = s), (h.w = a));
    let l = 0;
    for (let r = -o; r <= o; r++)
      for (let c = -o; c <= o; c++) {
        const p = t + c,
          u = e + r;
        if (!a.isLoaded(p, u)) continue;
        const f = a.surfaceY(p, u);
        if (f + 1 > s + o) continue;
        let g = s + o;
        for (
          ;
          g > s - o - 1 &&
          !BLOCKS[a.getBlock(p, g - 1, u)].solid &&
          !IS_FLUID[a.getBlock(p, g - 1, u)];
        )
          g--;
        const m = Math.max(s - o, g),
          k = Math.max(s + o, g);
        if (m === k) continue;
        const w = ((63 & u) << 6) | (63 & p);
        if (
          ((h.gx[w] === p && h.gz[w] === u && h.gy[w] === f) ||
            ((h.gx[w] = p),
            (h.gz[w] = u),
            (h.gy[w] = f),
            (h.gf[w] = this.dryAt(p, u) ? 2 : this.isCold(p, u) ? 1 : 0)),
          2 === h.gf[w])
        )
          continue;
        const _ = Math.hypot(r, c) || 1,
          b = Math.max(s, g),
          M = a.getLight(p, b, u),
          y = 1 === h.gf[w],
          v =
            (1831565813 +
              ((((p * p * 3121 + 45238971 * p) ^ (u * u * 418711 + 13761 * u)) >>> 0) | 0)) |
            0;
        let S = M >> 4,
          B = 15 & M;
        (y
          ? ((S = Math.min(15, Math.round((3 * (M >> 4) + 15) / 4))),
            (B = Math.min(15, Math.round((3 * (15 & M) + 15) / 4))),
            (h.k[l] = mulberryAt(v)),
            (h.u0[l] = mulberryAt((v + 1831565813) | 0) + 0.01 * Math.sin(0.05 * i + p)))
          : ((h.k[l] = 3 + mulberryAt(v)),
            (h.i3[l] = (i + p * p * 3121 + 45238971 * p + u * u * 418711 + 13761 * u) & 31)),
          (h.cx[l] = p + 0.5),
          (h.cz[l] = u + 0.5),
          (h.y0[l] = m),
          (h.y1[l] = k),
          (h.sx[l] = (-c / _) * 0.5),
          (h.sz[l] = (r / _) * 0.5),
          (h.cold[l] = y ? 1 : 0),
          (h.li[l] = 4 * (16 * S + B)),
          l++);
      }
    return ((h.n = l), h);
  }
  drawWeather(t, e) {
    if (this.weather < 0.02) return;
    const s = this.renderer,
      i = s.gl,
      o = this.player,
      a = this.world,
      r = lerp(o.prev[0], o.pos[0], e),
      h = lerp(o.prev[2], o.pos[2], e),
      l = lerp(o.prev[1], o.pos[1], e) + o.eye(),
      c = Math.floor(r),
      p = Math.floor(h),
      u = Math.floor(l),
      f = this.tickCount,
      g = this.weatherCols(c, p, u, f, 10),
      m = s._lmData,
      k = this.weather,
      w = s.fxOn;
    (!s.weatherData || s.weatherData.length < 36 * g.N) &&
      (s.weatherData = new Float32Array(36 * g.N));
    const _ = s.weatherData;
    let b = 0,
      M = 0;
    for (let t = 0; t < 2; t++)
      for (let s = 0; s < g.n; s++) {
        const i = g.cold[s];
        if (i !== t) continue;
        const o = g.cx[s],
          a = g.cz[s],
          l = o - r,
          c = a - h,
          p = (0.5 * (1 - (l * l + c * c) / 100) + 0.5) * k;
        if (p <= 0) continue;
        let u,
          y = 0;
        i
          ? ((u = -((511 & f) + e) / 512 + g.k[s]), (y = g.u0[s]))
          : (u = (-(g.i3[s] + e) / 32) * g.k[s]);
        const v = g.li[s],
          S = m ? m[v] / 255 : 1,
          B = m ? m[v + 1] / 255 : 1,
          I = m ? m[v + 2] / 255 : 1,
          T = p * (w ? (i ? 0.6 : 0.4) : 1),
          E = g.y0[s],
          C = g.y1[s],
          A = g.sx[s],
          F = g.sz[s],
          O = 0.25 * E + u,
          x = 0.25 * C + u;
        ((b = weatherVert(_, b, o - A, C, a - F, y, O, S, B, I, T)),
          (b = weatherVert(_, b, o + A, C, a + F, y + 1, O, S, B, I, T)),
          (b = weatherVert(_, b, o + A, E, a + F, y + 1, x, S, B, I, T)),
          (b = weatherVert(_, b, o - A, E, a - F, y, x, S, B, I, T)),
          i || M++);
      }
    const y = b / 36 - M;
    s.weatherProg ||
      ((s.weatherProg = compile(
        i,
        "#version 300 es\nlayout(location=0) in vec3 a_pos; layout(location=1) in vec2 a_uv; layout(location=2) in vec4 a_col;\nuniform mat4 u_vp; out vec2 v_uv; out vec4 v_col;\nvoid main(){ v_uv = a_uv; v_col = a_col; gl_Position = u_vp * vec4(a_pos, 1.0); }",
        "#version 300 es\nprecision highp float; uniform sampler2D u_tex; in vec2 v_uv; in vec4 v_col; out vec4 o;\nvoid main(){ vec4 t = texture(u_tex, v_uv); if (t.a * v_col.a < 0.01) discard; o = t * v_col; }",
      )),
      (s.weatherVao = i.createVertexArray()),
      i.bindVertexArray(s.weatherVao),
      (s.weatherBuf = i.createBuffer()),
      i.bindBuffer(i.ARRAY_BUFFER, s.weatherBuf),
      i.bufferData(i.ARRAY_BUFFER, _.byteLength, i.DYNAMIC_DRAW),
      (s.weatherCap = _.length),
      i.enableVertexAttribArray(0),
      i.vertexAttribPointer(0, 3, i.FLOAT, !1, 36, 0),
      i.enableVertexAttribArray(1),
      i.vertexAttribPointer(1, 2, i.FLOAT, !1, 36, 12),
      i.enableVertexAttribArray(2),
      i.vertexAttribPointer(2, 4, i.FLOAT, !1, 36, 20),
      i.bindBuffer(i.ELEMENT_ARRAY_BUFFER, s.quadIdx));
    const v = s.weatherProg;
    if (
      (i.useProgram(v.p),
      i.uniformMatrix4fv(v.u.u_vp, !1, s.vp),
      i.uniform1i(v.u.u_tex, 0),
      i.bindVertexArray(s.weatherVao),
      i.enable(i.BLEND),
      i.blendFunc(i.SRC_ALPHA, i.ONE_MINUS_SRC_ALPHA),
      i.depthMask(!1),
      i.disable(i.CULL_FACE),
      b &&
        (i.bindBuffer(i.ARRAY_BUFFER, s.weatherBuf),
        s.weatherCap < _.length &&
          (i.bufferData(i.ARRAY_BUFFER, _.byteLength, i.DYNAMIC_DRAW), (s.weatherCap = _.length)),
        i.bufferSubData(i.ARRAY_BUFFER, 0, _, 0, b),
        i.activeTexture(i.TEXTURE0),
        M &&
          (i.bindTexture(i.TEXTURE_2D, s.entityTex.rain),
          i.drawElements(i.TRIANGLES, 6 * M, i.UNSIGNED_INT, 0)),
        y &&
          (i.bindTexture(i.TEXTURE_2D, s.entityTex.snowfall),
          i.drawElements(i.TRIANGLES, 6 * y, i.UNSIGNED_INT, 24 * M))),
      i.depthMask(!0),
      i.enable(i.CULL_FACE),
      i.disable(i.BLEND),
      this.weather > 0.2 &&
        this.tickCount !== this._rainSoundT &&
        Math.random() < 0.33 * this.weather)
    ) {
      this._rainSoundT = this.tickCount;
      const t = c + ((21 * Math.random()) | 0) - 10,
        e = p + ((21 * Math.random()) | 0) - 10;
      if (!this.isCold(t, e) && !this.dryAt(t, e)) {
        const s = a.surfaceY(t, e) + 1;
        s > l + 1 && a.surfaceY(c, p) + 1 > l
          ? Sound.ev("weather.rain.above", [t, s, e], 0.1, 0.5)
          : Sound.ev("weather.rain", [t, s, e], 0.2, 1);
      }
    }
  }
  capturePointer() {
    if ("play" !== this.state) return;
    if (this.escHeld && performance.now() - this.escHeld < 1500) return void (this.escCapture = !0);
    const t = this.canvas,
      e = navigator.userActivation;
    if (document.pointerLockElement === t || performance.now() - (this.lockAsked || 0) < 1e3)
      return;
    this.lockHooked ||
      ((this.lockHooked = !0),
      document.addEventListener("pointerlockchange", () => {
        ((this.lockAsked = 0),
          (this.lockSoftAt = 0),
          document.pointerLockElement !== t && (this.lockLostAt = performance.now()));
      }),
      document.addEventListener("pointerlockerror", () => {
        (this.lockNoPromise && (this.lockAsked = 0),
          this.lockSoftAt &&
            performance.now() - this.lockSoftAt < 1500 &&
            ((this.lockSoftAt = 0), (this.lockFails = Math.max(0, (this.lockFails || 0) - 1))));
      }));
    const ask = (s) => {
      const i = performance.now(),
        o = (e && !e.isActive) || i - (this.lockLostAt || -1e9) < 2e3;
      let a;
      ((this.lockAsked = i), (this.lockSoftAt = o ? i : 0), (this.lockRaw = !1));
      try {
        a = s ? t.requestPointerLock({ unadjustedMovement: !0 }) : t.requestPointerLock();
      } catch (e) {
        return (
          (this.lockAsked = 0),
          void (s
            ? ((this.rawLockOff = !0), ask(!1))
            : (o && "function" == typeof t.requestPointerLock) ||
              (this.lockFails = (this.lockFails || 0) + 1))
        );
      }
      (setTimeout(() => {
        this.lockAsked === i &&
          document.pointerLockElement !== t &&
          ((this.lockAsked = 0), o || (this.lockFails = (this.lockFails || 0) + 1));
      }, 1500),
        (this.lockNoPromise = !(a && a.then)),
        a &&
          a.then &&
          a.then(
            () => {
              ((this.lockAsked = 0), (this.lockRaw = s));
            },
            (t) => {
              ((this.lockAsked = 0),
                s &&
                  t &&
                  "NotSupportedError" === t.name &&
                  ((this.rawLockOff = !0), ask(!1), (this.lockSoftAt = performance.now())));
            },
          ));
    };
    ask(!1 !== this.settings.rawInput && !this.rawLockOff);
  }
  releasePointer() {
    document.pointerLockElement && document.exitPointerLock();
  }
}
const BLAST_RES = new Map();
for (const [t, e] of [
  [
    1200,
    "obsidian enchanting_table anvil chipped_anvil damaged_anvil netherite_block ancient_debris crying_obsidian respawn_anchor reinforced_deepslate heavy_core",
  ],
  [600, "ender_chest"],
  [
    9,
    "end_stone dragon_egg end_stone_bricks end_stone_brick_stairs end_stone_brick_slab end_stone_brick_wall",
  ],
  [
    6,
    "stone granite polished_granite diorite polished_diorite andesite polished_andesite cobblestone gold_block iron_block bricks mossy_cobblestone diamond_block cobblestone_stairs jukebox stone_bricks mossy_stone_bricks cracked_stone_bricks chiseled_stone_bricks iron_bars copper_bars iron_chain copper_chain brick_stairs stone_brick_stairs resin_bricks resin_brick_stairs resin_brick_slab resin_brick_wall chiseled_resin_bricks nether_bricks nether_brick_fence nether_brick_stairs emerald_block cobblestone_wall mossy_cobblestone_wall redstone_block prismarine prismarine_bricks dark_prismarine prismarine_stairs prismarine_brick_stairs dark_prismarine_stairs prismarine_slab prismarine_brick_slab dark_prismarine_slab coal_block stone_slab smooth_stone_slab sandstone_slab cut_sandstone_slab petrified_oak_slab cobblestone_slab brick_slab stone_brick_slab nether_brick_slab quartz_slab red_sandstone_slab cut_red_sandstone_slab purpur_slab smooth_stone smooth_sandstone smooth_quartz smooth_red_sandstone purpur_block purpur_pillar purpur_stairs red_nether_bricks dead_tube_coral_block dead_brain_coral_block dead_bubble_coral_block dead_fire_coral_block dead_horn_coral_block tube_coral_block brain_coral_block bubble_coral_block fire_coral_block horn_coral_block polished_granite_stairs smooth_red_sandstone_stairs mossy_stone_brick_stairs polished_diorite_stairs mossy_cobblestone_stairs stone_stairs smooth_sandstone_stairs smooth_quartz_stairs granite_stairs andesite_stairs red_nether_brick_stairs polished_andesite_stairs diorite_stairs polished_granite_slab smooth_red_sandstone_slab mossy_stone_brick_slab polished_diorite_slab mossy_cobblestone_slab smooth_sandstone_slab smooth_quartz_slab granite_slab andesite_slab red_nether_brick_slab polished_andesite_slab diorite_slab brick_wall prismarine_wall mossy_stone_brick_wall granite_wall stone_brick_wall nether_brick_wall andesite_wall red_nether_brick_wall diorite_wall grindstone blackstone blackstone_stairs blackstone_wall blackstone_slab polished_blackstone polished_blackstone_bricks cracked_polished_blackstone_bricks chiseled_polished_blackstone polished_blackstone_brick_slab polished_blackstone_brick_stairs polished_blackstone_brick_wall gilded_blackstone polished_blackstone_stairs polished_blackstone_slab polished_blackstone_wall chiseled_nether_bricks cracked_nether_bricks tuff tuff_slab tuff_stairs tuff_wall polished_tuff polished_tuff_slab polished_tuff_stairs polished_tuff_wall chiseled_tuff tuff_bricks tuff_brick_slab tuff_brick_stairs tuff_brick_wall chiseled_tuff_bricks copper_block copper_door copper_trapdoor copper_grate copper_bulb copper_chest copper_golem_statue lightning_rod deepslate cobbled_deepslate cobbled_deepslate_stairs cobbled_deepslate_slab cobbled_deepslate_wall polished_deepslate polished_deepslate_stairs polished_deepslate_slab polished_deepslate_wall deepslate_tiles deepslate_tile_stairs deepslate_tile_slab deepslate_tile_wall deepslate_bricks deepslate_brick_stairs deepslate_brick_slab deepslate_brick_wall chiseled_deepslate cracked_deepslate_bricks cracked_deepslate_tiles raw_iron_block raw_copper_block raw_gold_block copper cut_copper chiseled_copper cut_copper_stairs cut_copper_slab sulfur potent_sulfur sulfur_slab sulfur_stairs sulfur_wall polished_sulfur polished_sulfur_slab polished_sulfur_stairs polished_sulfur_wall sulfur_bricks sulfur_brick_slab sulfur_brick_stairs sulfur_brick_wall chiseled_sulfur cinnabar cinnabar_slab cinnabar_stairs cinnabar_wall polished_cinnabar polished_cinnabar_slab polished_cinnabar_stairs polished_cinnabar_wall cinnabar_bricks cinnabar_brick_slab cinnabar_brick_stairs cinnabar_brick_wall chiseled_cinnabar",
  ],
  [4.8, "hopper"],
  [
    4.2,
    "basalt polished_basalt terracotta smooth_basalt white_terracotta orange_terracotta magenta_terracotta light_blue_terracotta yellow_terracotta lime_terracotta pink_terracotta gray_terracotta light_gray_terracotta cyan_terracotta purple_terracotta blue_terracotta brown_terracotta green_terracotta red_terracotta black_terracotta",
  ],
  [3.5, "crafter"],
  [
    3,
    "oak_planks spruce_planks birch_planks jungle_planks acacia_planks cherry_planks dark_oak_planks pale_oak_planks mangrove_planks bamboo_planks bamboo_mosaic deepslate_gold_ore deepslate_iron_ore deepslate_coal_ore deepslate_lapis_ore acacia_shelf bamboo_shelf birch_shelf cherry_shelf crimson_shelf dark_oak_shelf jungle_shelf mangrove_shelf oak_shelf pale_oak_shelf spruce_shelf warped_shelf oak_stairs deepslate_diamond_ore deepslate_redstone_ore oak_fence packed_mud mud_bricks oak_fence_gate mud_brick_stairs cocoa deepslate_emerald_ore spruce_stairs birch_stairs jungle_stairs acacia_stairs cherry_stairs dark_oak_stairs pale_oak_stairs mangrove_stairs bamboo_stairs bamboo_mosaic_stairs oak_slab spruce_slab birch_slab jungle_slab acacia_slab cherry_slab dark_oak_slab pale_oak_slab mangrove_slab bamboo_slab bamboo_mosaic_slab mud_brick_slab spruce_fence_gate birch_fence_gate jungle_fence_gate acacia_fence_gate cherry_fence_gate dark_oak_fence_gate pale_oak_fence_gate mangrove_fence_gate bamboo_fence_gate spruce_fence birch_fence jungle_fence acacia_fence cherry_fence dark_oak_fence pale_oak_fence mangrove_fence bamboo_fence mud_brick_wall crimson_planks warped_planks crimson_slab warped_slab crimson_fence warped_fence crimson_fence_gate warped_fence_gate crimson_stairs warped_stairs deepslate_copper_ore pointed_dripstone sulfur_spike",
  ],
  [2.5, "dried_kelp_block"],
  [1, "dripstone_block"],
  [
    0.75,
    "infested_stone infested_cobblestone infested_stone_bricks infested_mossy_stone_bricks infested_cracked_stone_bricks infested_chiseled_stone_bricks infested_deepslate",
  ],
  [0.1, "firefly_bush"],
  [0, "nether_portal"],
])
  for (const s of e.split(" ")) BLAST_RES.set(s, t);
function blastRes(t) {
  const e = BLAST_RES.get(
    t.key.replace(/^waxed_/, "").replace(/^(exposed|weathered|oxidized)_/, ""),
  );
  return void 0 !== e ? e : t.hardness < 0 ? 36e5 : t.hardness;
}
const WOOL_RGB = [
  [1, 1, 1],
  [0.95, 0.55, 0.2],
  [0.75, 0.3, 0.75],
  [0.4, 0.6, 0.85],
  [0.9, 0.85, 0.2],
  [0.5, 0.8, 0.2],
  [0.95, 0.6, 0.7],
  [0.3, 0.3, 0.3],
  [0.6, 0.6, 0.6],
  [0.2, 0.55, 0.6],
  [0.5, 0.25, 0.7],
  [0.2, 0.3, 0.65],
  [0.45, 0.3, 0.2],
  [0.35, 0.45, 0.2],
  [0.65, 0.2, 0.2],
  [0.1, 0.1, 0.1],
];
function mulberryAt(t) {
  let e = Math.imul(t ^ (t >>> 15), 1 | t);
  return ((e = (e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ e), ((e ^ (e >>> 14)) >>> 0) / 4294967296);
}
function weatherVert(t, e, s, i, o, a, r, h, l, c, p) {
  return (
    (t[e] = s),
    (t[e + 1] = i),
    (t[e + 2] = o),
    (t[e + 3] = a),
    (t[e + 4] = r),
    (t[e + 5] = h),
    (t[e + 6] = l),
    (t[e + 7] = c),
    (t[e + 8] = p),
    e + 9
  );
}
function rayBox(t, e, s, i, o, a, r, h) {
  let l = -1 / 0,
    c = 1 / 0,
    p = -1;
  const u = [s, i, o],
    f = [a, r, h];
  for (let s = 0; s < 3; s++) {
    if (Math.abs(e[s]) < 1e-9) {
      if (t[s] < u[s] || t[s] > f[s]) return null;
      continue;
    }
    let i = (u[s] - t[s]) / e[s],
      o = (f[s] - t[s]) / e[s],
      a = 2 * s,
      r = 2 * s + 1;
    if (i > o) {
      const t = i;
      ((i = o), (o = t));
      const e = a;
      ((a = r), (r = e));
    }
    if ((i > l && ((l = i), (p = a)), o < c && (c = o), l > c)) return null;
  }
  return c < 0 ? null : { t: Math.max(0, l), face: p };
}
function swimLimbs(t, e, s) {
  const i = ((((e % 26) + 26) % 26) / 26) * Math.PI * 2,
    o = Math.PI * (0.5 + 0.5 * Math.cos(i)),
    a = 1.1 * Math.max(0, Math.sin(i));
  return (
    (t.rarm = { rx: o, rz: a }),
    (t.larm = { rx: o, rz: -a }),
    (t.rleg = { rx: 0.3 * Math.cos(e / 3) }),
    (t.lleg = { rx: 0.3 * -Math.cos(e / 3) }),
    (t.head.rx = s ? Math.PI / 4 : 1.2),
    t
  );
}
Player.prototype.loadedHere = function () {
  const t = this.world,
    e = Math.floor(this.pos[0]),
    s = Math.floor(this.pos[2]);
  return t.isLoaded(e, s) && t.getChunk(e >> 4, s >> 4).lit;
};
//# sourceURL=js/game.js
