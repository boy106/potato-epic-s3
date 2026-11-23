"use strict";
const CMD_ITEMS = () => Object.keys(ITEM_KEY),
  CMD_MOBS = () => [...Object.keys(MOB_TYPES), "ender_dragon", "tnt"],
  CMD_STRUCTS = [
    "village",
    "stronghold",
    "fortress",
    "bastion_remnant",
    "pillager_outpost",
    "ancient_city",
    "trial_chambers",
    "trail_ruins",
    "desert_pyramid",
    "jungle_pyramid",
    "swamp_hut",
    "igloo",
    "shipwreck",
    "ocean_ruin_cold",
    "ocean_ruin_warm",
    "ruined_portal",
    "mineshaft",
    "buried_treasure",
    "end_city",
    "monument",
    "mansion",
  ],
  CMD_PLAYERS = (e) => [
    "@s",
    "@p",
    "@a",
    ...(e.net ? [...e.net.players.values()].filter(Boolean) : []),
  ],
  CMD_DIMS = ["overworld", "nether", "end"],
  CMD_MODES = ["survival", "creative", "spectator", "adventure"],
  CMD_SEL = ["@s", "@p", "@a", "@r", "@e", "@e[type="],
  CMD_EFFECTS = () => Object.keys(EFFECTS),
  CMD_ENCH = () => ("undefined" != typeof ENCH ? Object.keys(ENCH) : []),
  CMD_BLOCKS = () => Object.keys(BID),
  CMD_RULES = () => ("undefined" != typeof GAME_RULES ? Object.keys(GAME_RULES) : []),
  CMD_XYZ = [["~"], ["~"], ["~"]],
  CMDS_LOCAL = [
    ["gamemode", "/gamemode <模式> [目标]", "切换游戏模式", [CMD_MODES, CMD_SEL]],
    [
      "difficulty",
      "/difficulty [难度]",
      "查看或设置难度",
      [["peaceful", "easy", "normal", "hard"]],
    ],
    [
      "time",
      "/time set|add|query <时间>",
      "设置时间：day / noon / night / midnight、数值或 10s / 1d",
      [
        ["set", "add", "query"],
        ["day", "noon", "night", "midnight", "sunrise", "sunset", "daytime", "gametime", "day"],
      ],
    ],
    ["weather", "/weather clear|rain|thunder [时长]", "设置天气", [["clear", "rain", "thunder"]]],
    [
      "give",
      "/give <目标> <物品> [数量]",
      "给予物品，如 /give @s diamond 64",
      [(e) => [...CMD_SEL, ...CMD_ITEMS()], CMD_ITEMS],
    ],
    ["clear", "/clear [目标] [物品] [最大数量]", "清除物品栏里的物品", [CMD_SEL, CMD_ITEMS]],
    [
      "tp",
      "/tp [目标] <x y z | 目标实体> [偏航 俯仰]",
      "传送（~ 相对位置，^ 视线方向的局部坐标）",
      [(e) => ["~", "^", ...CMD_SEL], ["~", "^"], ["~", "^"]],
    ],
    [
      "summon",
      "/summon <实体> [x y z]",
      "生成实体（含 lightning_bolt、tnt）",
      [() => [...CMD_MOBS(), "lightning_bolt", "experience_orb"], ...CMD_XYZ],
    ],
    ["kill", "/kill [目标]", "杀死实体，如 /kill @e[type=zombie]", [CMD_SEL]],
    [
      "effect",
      "/effect give|clear <目标> [效果] [秒数] [等级] [隐藏粒子]",
      "给予或清除状态效果",
      [
        ["give", "clear"],
        CMD_SEL,
        CMD_EFFECTS,
        ["30", "infinite"],
        ["0", "1", "2", "4", "9", "255"],
        ["true", "false"],
      ],
    ],
    ["enchant", "/enchant <目标> <魔咒> [等级]", "给手上的物品附魔", [CMD_SEL, CMD_ENCH]],
    [
      "xp",
      "/xp add|set|query <目标> <数量> [points|levels]",
      "经验（/xp 30L 也可以）",
      [["add", "set", "query"], CMD_SEL, [], ["points", "levels"]],
    ],
    [
      "setblock",
      "/setblock <x y z> <方块> [destroy|keep|replace]",
      "放置方块，可带状态：oak_stairs[facing=east]",
      [["~"], ["~"], ["~"], CMD_BLOCKS, ["destroy", "keep", "replace"]],
    ],
    [
      "fill",
      "/fill <x1 y1 z1> <x2 y2 z2> <方块> [destroy|hollow|keep|outline|replace [过滤]]",
      "填充区域（最多 32768 格）",
      [
        ["~"],
        ["~"],
        ["~"],
        ["~"],
        ["~"],
        ["~"],
        CMD_BLOCKS,
        ["destroy", "hollow", "keep", "outline", "replace"],
        CMD_BLOCKS,
      ],
    ],
    [
      "clone",
      "/clone <x1 y1 z1> <x2 y2 z2> <目标 x y z> [replace|masked] [normal|force|move]",
      "复制区域",
      [
        ["~"],
        ["~"],
        ["~"],
        ["~"],
        ["~"],
        ["~"],
        ["~"],
        ["~"],
        ["~"],
        ["replace", "masked"],
        ["normal", "force", "move"],
      ],
    ],
    ["gamerule", "/gamerule <规则> [值]", "查看或修改游戏规则", [CMD_RULES, ["true", "false"]]],
    ["locate", "/locate structure <结构>", "查找最近的结构", [["structure"], CMD_STRUCTS]],
    ["tpdim", "/tpdim <维度>", "直接前往某个维度", [CMD_DIMS]],
    ["spawnpoint", "/spawnpoint [目标] [x y z]", "设置重生点", [CMD_SEL, ...CMD_XYZ]],
    ["setworldspawn", "/setworldspawn [x y z]", "设置世界重生点", CMD_XYZ],
    [
      "title",
      "/title <目标> title|subtitle|actionbar|clear|reset|times <文本>",
      "在屏幕上显示标题",
      [CMD_SEL, ["title", "subtitle", "actionbar", "clear", "reset", "times"]],
    ],
    ["tellraw", "/tellraw <目标> <JSON 文本>", "发送 JSON 格式的消息", [CMD_SEL]],
    ["say", "/say <消息>", "向所有人说话", []],
    ["me", "/me <动作>", "以第三人称说话", []],
    ["msg", "/msg <玩家> <消息>", "悄悄话", [CMD_SEL]],
    [
      "playsound",
      "/playsound <声音> [来源] [目标] [x y z] [音量] [音调]",
      "播放声音",
      [
        () => ("undefined" != typeof SOUND_EVENTS ? Object.keys(SOUND_EVENTS) : []),
        [
          "master",
          "music",
          "record",
          "weather",
          "block",
          "hostile",
          "neutral",
          "player",
          "ambient",
          "voice",
        ],
        CMD_SEL,
      ],
    ],
    [
      "particle",
      "/particle <粒子> [x y z] [dx dy dz] [速度] [数量]",
      "显示粒子",
      [() => Object.keys(CMD_PARTICLES)],
    ],
    ["damage", "/damage <目标> <伤害> [伤害类型]", "对实体造成伤害", [CMD_SEL]],
    [
      "ride",
      "/ride <目标> mount <载具> | dismount",
      "骑乘实体",
      [CMD_SEL, ["mount", "dismount"], CMD_SEL],
    ],
    [
      "tag",
      "/tag <目标> add|remove|list [标签]",
      "给实体加标签（选择器 tag= 可用）",
      [CMD_SEL, ["add", "remove", "list"]],
    ],
    ["defaultgamemode", "/defaultgamemode <模式>", "设置默认游戏模式", [CMD_MODES]],
    [
      "random",
      "/random value|roll <范围>",
      "随机数，如 /random roll 1..6",
      [
        ["value", "roll"],
        ["1..6", "1..100"],
      ],
    ],
    ["list", "/list", "在线玩家", []],
    ["seed", "/seed", "显示世界种子", []],
    ["help", "/help", "打开这个命令列表", []],
  ],
  CMDS_NET = [
    ["gamemode", "/gamemode <模式> [玩家]", "切换游戏模式", [CMD_MODES, CMD_PLAYERS]],
    [
      "time",
      "/time set|add|query <时间>",
      "设置 / 查询时间",
      [
        ["set", "add", "query"],
        ["day", "noon", "night", "midnight", "daytime", "gametime"],
      ],
    ],
    ["weather", "/weather clear|rain|thunder [时长]", "设置天气", [["clear", "rain", "thunder"]]],
    ["give", "/give <玩家> <物品> [数量]", "给予物品", [CMD_PLAYERS, CMD_ITEMS]],
    ["tp", "/tp <目标> | <x> <y> <z>", "传送", [(e) => ["~", ...CMD_PLAYERS(e)], ["~"], ["~"]]],
    ["summon", "/summon <实体> [x y z]", "生成实体", [CMD_MOBS]],
    ["kill", "/kill [目标]", "杀死实体", [(e) => ["@e[type=", ...CMD_PLAYERS(e)]]],
    [
      "locate",
      "/locate structure <结构>",
      "查找最近的结构",
      [["structure", "biome", "poi"], CMD_STRUCTS],
    ],
    [
      "effect",
      "/effect give <目标> <效果> [秒] [等级]",
      "给予状态效果",
      [["give", "clear"], CMD_PLAYERS, () => Object.keys(EFFECTS)],
    ],
    ["enchant", "/enchant <目标> <魔咒> [等级]", "给手上的物品附魔", [CMD_PLAYERS]],
    ["xp", "/xp add <目标> <数量> [levels]", "给予经验", [["add", "set", "query"], CMD_PLAYERS]],
    ["clear", "/clear [玩家] [物品]", "清除物品", [CMD_PLAYERS, CMD_ITEMS]],
    ["difficulty", "/difficulty <难度>", "设置难度", [["peaceful", "easy", "normal", "hard"]]],
    [
      "gamerule",
      "/gamerule <规则> [值]",
      "修改游戏规则",
      [
        [
          "keepInventory",
          "doDaylightCycle",
          "doWeatherCycle",
          "doMobSpawning",
          "mobGriefing",
          "doFireTick",
          "naturalRegeneration",
          "showDeathMessages",
        ],
      ],
    ],
    ["setblock", "/setblock <x> <y> <z> <方块>", "放置方块", [["~"], ["~"], ["~"], CMD_ITEMS]],
    [
      "fill",
      "/fill <x1> <y1> <z1> <x2> <y2> <z2> <方块>",
      "填充区域",
      [["~"], ["~"], ["~"], ["~"], ["~"], ["~"], CMD_ITEMS],
    ],
    ["spawnpoint", "/spawnpoint [玩家]", "设置重生点", [CMD_PLAYERS]],
    ["msg", "/msg <玩家> <消息>", "悄悄话", [CMD_PLAYERS]],
    ["me", "/me <动作>", "以第三人称说话", []],
    ["list", "/list", "在线玩家", []],
    ["seed", "/seed", "显示世界种子", []],
    ["help", "/help", "打开这个命令列表", []],
  ],
  cmdList = (e) => (e.net ? CMDS_NET : CMDS_LOCAL);
function cmdSuggest(e, t) {
  if (!t.startsWith("/")) return null;
  const s = t.slice(1).replace(/^ +/, "").split(/ +/),
    i = s[s.length - 1].replace(/^minecraft:/, ""),
    a = t.length - s[s.length - 1].length,
    l = cmdList(e);
  if (1 === s.length) {
    const e = l.map((e) => e[0]).filter((e) => e.startsWith(i)),
      t = l.find((e) => e[0] === i);
    return { list: t && 1 === e.length ? [] : e, at: a, usage: t ? t[1] : null };
  }
  const n = l.find((e) => e[0] === s[0]);
  if (!n) return null;
  let o = n[3][s.length - 2];
  "function" == typeof o && (o = o(e));
  const r = (o || []).filter((e) => e.startsWith(i) && e !== i);
  if (i.length > 1 && o && r.length < 10)
    for (const e of o) e.startsWith(i) || !e.includes("_" + i) || r.includes(e) || r.push(e);
  return { list: r.slice(0, 50), at: a, usage: n[1] };
}
(() => {
  const e = ChatScreen.prototype.layout,
    t = ChatScreen.prototype.draw;
  ((ChatScreen.prototype.layout = function () {
    e.call(this);
    const t = this.game.ui.input,
      s = t.onkeydown;
    ((this.sugSel = 0),
      (this.sugFor = null),
      (t.onkeydown = (e) => {
        const i = this.sug && this.sug.list.length ? this.sug : null;
        return !i || ("ArrowUp" !== e.key && "ArrowDown" !== e.key)
          ? "Tab" === e.key
            ? (e.preventDefault(), e.stopPropagation(), void (i && this.takeSuggestion(t)))
            : "Enter" === e.key && "/help" === t.value.trim()
              ? (e.preventDefault(),
                e.stopPropagation(),
                this.game.ui.close(),
                void this.game.ui.open(new CommandHelpScreen(this.game)))
              : void s(e)
          : (e.preventDefault(),
            e.stopPropagation(),
            void (this.sugSel =
              (this.sugSel + ("ArrowUp" === e.key ? -1 : 1) + i.list.length) % i.list.length));
      }));
  }),
    (ChatScreen.prototype.takeSuggestion = function (e) {
      const t = this.sug,
        s = t.list[this.sugSel] || t.list[0];
      ((e.value = e.value.slice(0, t.at) + s + (s.endsWith("=") || s.endsWith("[") ? "" : " ")),
        (this.sugSel = 0));
    }),
    (ChatScreen.prototype.draw = function (e) {
      t.call(this, e);
      const s = e.input.value;
      s !== this.sugFor &&
        ((this.sugFor = s), (this.sug = cmdSuggest(this.game, s)), (this.sugSel = 0));
      const i = this.sug;
      if (!i) return;
      const a = e.ctx,
        l = 4 + Font.width(s.slice(0, i.at)),
        n = e.h - 14;
      if (!i.list.length) {
        if (i.usage) {
          const e = Font.width(i.usage) + 2;
          ((a.fillStyle = "rgba(0,0,0,0.8)"),
            a.fillRect(2, n - 12, e, 12),
            Font.draw(a, i.usage, 3, n - 10, "#AAAAAA"));
        }
        return;
      }
      const o = Math.min(10, i.list.length),
        r = Math.max(0, Math.min(i.list.length - o, this.sugSel - 4)),
        c = i.list.slice(r, r + o),
        h = Math.max(...c.map((e) => Font.width(e))) + 2;
      ((a.fillStyle = "rgba(0,0,0,0.8)"),
        a.fillRect(l - 1, n - 12 * o, h, 12 * o),
        c.forEach((e, t) =>
          Font.draw(
            a,
            e,
            l,
            n - 12 * o + 2 + 12 * t,
            r + t === this.sugSel ? "#FFFF00" : "#AAAAAA",
          ),
        ),
        i.usage && Font.draw(a, i.usage, l + h + 4, n - 10, "#AAAAAA"));
    }));
  const s = ChatScreen.prototype.mouseDown;
  ChatScreen.prototype.mouseDown = function (e, t, i, a) {
    const l = this.sug;
    if (l && l.list.length && 0 === a) {
      const t = Math.min(10, l.list.length),
        s = Math.max(0, Math.min(l.list.length - t, this.sugSel - 4)),
        a = e.h - 14 - 12 * t,
        n = Math.floor((i - a) / 12);
      if (i >= a && n >= 0 && n < t)
        return ((this.sugSel = s + n), this.takeSuggestion(e.input), void e.input.focus());
    }
    if (s) return s.call(this, e, t, i, a);
  };
})();
class CommandHelpScreen extends MenuScreen {
  constructor(e) {
    (super(e, "命令"), (this.page = 0));
  }
  layout() {
    const e = this.game.ui,
      t = this.game,
      s = cmdList(t),
      i = e.w / 2,
      a = Math.max(4, Math.floor((e.h - 90) / 22)),
      l = Math.ceil(s.length / a);
    this.page = clamp(this.page, 0, l - 1);
    const n = Math.min(420, e.w - 20);
    this.widgets = s.slice(this.page * a, this.page * a + a).map((s, a) => ({
      x: i - n / 2,
      y: 44 + 22 * a,
      w: n,
      h: 20,
      label: Font.width(s[1] + "   " + s[2]) < n - 12 ? s[1] + "   " + s[2] : s[1],
      tip: [s[2], "点击填入聊天框"],
      onClick: () => {
        (e.close(), e.open(new ChatScreen(t, "/" + s[0] + (s[3].length ? " " : ""))));
      },
    }));
    const o = e.h - 30;
    (l > 1 &&
      (this.widgets.push({
        x: i - 150,
        y: o,
        w: 70,
        h: 20,
        label: "<",
        enabled: this.page > 0,
        onClick: () => {
          (this.page--, this.layout());
        },
      }),
      this.widgets.push({
        x: i + 80,
        y: o,
        w: 70,
        h: 20,
        label: ">",
        enabled: this.page < l - 1,
        onClick: () => {
          (this.page++, this.layout());
        },
      }),
      this.widgets.push({ text: `${this.page + 1} / ${l}`, x: i, y: o - 11, color: "#AAAAAA" })),
      this.widgets.push({
        x: i - 70,
        y: o,
        w: 140,
        h: 20,
        label: "完成",
        onClick: () => e.close(),
      }));
  }
  drawExtra(e) {
    Font.center(
      e.ctx,
      this.game.net
        ? "服务器上能不能用由服务器决定"
        : this.game.cheats
          ? ""
          : "这个世界没有开作弊，只有 /help /seed 等可用",
      e.w / 2,
      32,
      "#AAAAAA",
    );
  }
}
//# sourceURL=js/commands.js
