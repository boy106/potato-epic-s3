"use strict";
const CMD_MODE = {};
for (const [e, c] of [
  ["command_block", "redstone"],
  ["chain_command_block", "sequence"],
  ["repeating_command_block", "auto"],
])
  void 0 !== BID[e] && (CMD_MODE[BID[e]] = c);
const CMD_BLOCK_OF = {
    redstone: "command_block",
    sequence: "chain_command_block",
    auto: "repeating_command_block",
  },
  CMD_MODE_CN = { sequence: "连锁", auto: "循环", redstone: "脉冲" },
  GM_BLOCKS = new Set(
    [
      "command_block",
      "chain_command_block",
      "repeating_command_block",
      "structure_block",
      "jigsaw",
      "test_block",
      "test_instance_block",
    ]
      .filter((e) => void 0 !== BID[e])
      .map((e) => BID[e]),
  );
for (const e in CMD_MODE) RS_IDS.add(+e);
Game.prototype.canUseGameMasterBlocks = function () {
  return "creative" === this.mode && (this.net ? (0 | this.net.opLevel) >= 2 : !!this.cheats);
};
const cmdKey = (e, c, o) => e + "," + c + "," + o,
  cmdProp = (e, c, o, n, s) =>
    Features.propOf(e.world.getBlock(c, o, n), e.world.getMeta(c, o, n), s),
  cmdConditional = (e, c, o, n) => "true" === cmdProp(e, c, o, n, "conditional");
function cmdMarkMet(e, c) {
  const [o, n, s] = c.pos;
  if (((c.met = !0), cmdConditional(e, o, n, s))) {
    const i = RS_DIRS[cmdProp(e, o, n, s, "facing")],
      a = o - i[0],
      d = n - i[1],
      r = s - i[2],
      m =
        void 0 !== CMD_MODE[e.world.getBlock(a, d, r)]
          ? e.blockEntities.get(cmdKey(a, d, r))
          : null;
    c.met = !!m && "command_block" === m.type && m.success > 0;
  }
  return c.met;
}
Game.prototype.cmdEntity = function (e, c, o) {
  const n = cmdKey(e, c, o);
  let s = this.blockEntities.get(n);
  return (
    (s && "command_block" === s.type) ||
      ((s = {
        type: "command_block",
        pos: [e, c, o],
        command: "",
        success: 0,
        output: "",
        track: !0,
        auto: "sequence" === CMD_MODE[this.world.getBlock(e, c, o)],
        powered: RS.neighborSignal(this, e, c, o),
        met: !1,
      }),
      this.blockEntities.set(n, s)),
    s
  );
};
const cmdStamp = () => {
    const e = new Date(),
      t = (e) => String(e).padStart(2, "0");
    return `[${t(e.getHours())}:${t(e.getMinutes())}:${t(e.getSeconds())}] `;
  },
  CMD_LAST = new WeakMap();
function cmdPerform(e, c, o) {
  if (CMD_LAST.get(c) === e.tickCount) return !1;
  if (/^searge$/i.test(c.command)) return ((c.output = "#itzlipofutzli"), (c.success = 1), !0);
  if (((c.success = 0), e.rule("command_blocks_work") && c.command)) {
    c.output = "";
    const n = {
      ...o,
      name: "@",
      say(o, n) {
        c.track &&
          (e.rule("send_command_feedback") && (c.output = cmdStamp() + o),
          !n &&
            e.rule("command_block_output") &&
            e.rule("send_command_feedback") &&
            e.cheats &&
            e.ui.message(`[@: ${o}]`, "#AAAAAA"));
      },
      fail(e) {
        c.track && (c.output = cmdStamp() + e);
      },
    };
    cmdExec(e, c.command, n) && (c.success = 1);
  }
  return (CMD_LAST.set(c, e.tickCount), !0);
}
const cmdBlockSource = (e, c, o, n) => ({
  pos: [c + 0.5, o + 0.5, n + 0.5],
  rot: [
    { north: Math.PI, south: 0, west: Math.PI / 2, east: -Math.PI / 2 }[
      cmdProp(e, c, o, n, "facing")
    ] || 0,
    0,
  ],
});
function cmdExecute(e, c, o, n, s) {
  s.command ? cmdPerform(e, s, cmdBlockSource(e, c, o, n)) : (s.success = 0);
  let i = cmdProp(e, c, o, n, "facing"),
    a = e.rule("max_command_sequence_length");
  for (; a-- > 0;) {
    const s = RS_DIRS[i];
    if (((c += s[0]), (o += s[1]), (n += s[2]), "sequence" !== CMD_MODE[e.world.getBlock(c, o, n)]))
      break;
    const a = e.blockEntities.get(cmdKey(c, o, n));
    if (!a || "command_block" !== a.type) break;
    if (a.powered || a.auto)
      if (cmdMarkMet(e, a)) {
        if (!cmdPerform(e, a, cmdBlockSource(e, c, o, n))) break;
        RS.wake(c, o, n);
      } else cmdConditional(e, c, o, n) && (a.success = 0);
    i = cmdProp(e, c, o, n, "facing");
  }
}
function cmdSetPowered(e, c, o, n, s, i) {
  i !== s.powered &&
    ((s.powered = i),
    i &&
      !s.auto &&
      "sequence" !== CMD_MODE[e.world.getBlock(c, o, n)] &&
      (cmdMarkMet(e, s), e.world.schedule(c, o, n, 1)));
}
function cmdSetAuto(e, c, o) {
  const n = c.auto,
    [s, i, a] = c.pos;
  ((c.auto = o),
    n ||
      !o ||
      c.powered ||
      "sequence" === CMD_MODE[e.world.getBlock(s, i, a)] ||
      (cmdMarkMet(e, c), e.world.schedule(s, i, a, 1)));
}
function cmdModeSwitch(e, c) {
  const [o, n, s] = c.pos;
  "auto" === CMD_MODE[e.world.getBlock(o, n, s)] &&
    (c.powered || c.auto) &&
    (cmdMarkMet(e, c), e.world.schedule(o, n, s, 1));
}
const _cmdRsUpdate = RS.update;
RS.update = function (e, c, o, n) {
  if (void 0 === CMD_MODE[e.world.getBlock(c, o, n)] || !e.world.isLoaded(c, n))
    return _cmdRsUpdate.call(this, e, c, o, n);
  const s = !e.blockEntities.has(cmdKey(c, o, n)),
    i = e.cmdEntity(c, o, n);
  s || cmdSetPowered(e, c, o, n, i, RS.neighborSignal(e, c, o, n));
};
const _cmdRsTick = RS.tick;
RS.tick = function (e, c, o, n) {
  const s = CMD_MODE[e.world.getBlock(c, o, n)];
  if (void 0 === s) return _cmdRsTick.call(this, e, c, o, n);
  const i = e.blockEntities.get(cmdKey(c, o, n));
  if (!i || "command_block" !== i.type) return !0;
  const a = i.met;
  return (
    "auto" === s
      ? (cmdMarkMet(e, i),
        a ? cmdExecute(e, c, o, n, i) : cmdConditional(e, c, o, n) && (i.success = 0),
        (i.powered || i.auto) && e.world.schedule(c, o, n, 1))
      : "redstone" === s &&
        (a ? cmdExecute(e, c, o, n, i) : cmdConditional(e, c, o, n) && (i.success = 0)),
    RS.wake(c, o, n),
    !0
  );
};
const _cmdRsAnalog = RS.analog;
RS.analog = function (e, c, o, n) {
  const s = e.world,
    i = s.getBlock(c, o, n);
  if (void 0 !== CMD_MODE[i]) {
    const s = e.blockEntities.get(cmdKey(c, o, n));
    return s && "command_block" === s.type ? Math.min(15, s.success) : 0;
  }
  if (
    BLOCKS[i] &&
    "detector_rail" === BLOCKS[i].key &&
    "true" === Features.propOf(i, s.getMeta(c, o, n), "powered")
  ) {
    const s = RS.entitiesIn(
      e,
      [c + 0.2, o, n + 0.2, c + 0.8, o + 0.8, n + 0.8],
      (e) => e instanceof Minecart && "command_block" === e.kind,
    );
    if (s.length) return Math.min(15, cartCmd(s[0]).success);
  }
  return _cmdRsAnalog.call(this, e, c, o, n);
};
const _cmdPlaceAt = Game.prototype.placeAt;
Game.prototype.placeAt = function (e, c, o, n, ...s) {
  if (GM_BLOCKS.has(n) && !this.canUseGameMasterBlocks()) return;
  const i = _cmdPlaceAt.call(this, e, c, o, n, ...s);
  if (!this.net && void 0 !== CMD_MODE[n] && this.world.getBlock(e, c, o) === n) {
    this.blockEntities.delete(cmdKey(e, c, o));
    const n = this.cmdEntity(e, c, o);
    ((n.powered = !1),
      (n.track = !!this.rule("send_command_feedback")),
      cmdSetPowered(this, e, c, o, n, RS.neighborSignal(this, e, c, o)));
  }
  return i;
};
const _cmdBreak = Game.prototype.breakBlock;
Game.prototype.breakBlock = function (e, c, o, n, ...s) {
  return (
    !(
      !n &&
      "creative" === this.mode &&
      GM_BLOCKS.has(this.world.getBlock(e, c, o)) &&
      !this.canUseGameMasterBlocks()
    ) && _cmdBreak.call(this, e, c, o, n, ...s)
  );
};
for (const e in CMD_MODE)
  BLOCKS[e].onUse = (e, c, o, n) =>
    !!e.canUseGameMasterBlocks() && (e.ui.open(cmdBlockScreen(e, c, o, n)), !0);
function cmdApply(e, c, o, n, s) {
  const i = e.world,
    a = i.getBlock(c, o, n);
  if (void 0 === CMD_MODE[a]) return;
  const d = e.cmdEntity(c, o, n),
    r = CMD_MODE[a],
    m = BID[CMD_BLOCK_OF[s.mode]] ?? a;
  let l = Features.withProp(m, 0, "facing", cmdProp(e, c, o, n, "facing"));
  ((l = Features.withProp(m, l, "conditional", s.cond ? "true" : "false")),
    (m === a && l === i.getMeta(c, o, n)) ||
      (i.setBlock(c, o, n, m, l),
      e.blockEntities.set(cmdKey(c, o, n), d),
      e.flushMesh && e.flushMesh()),
    (d.command = s.command),
    (d.success = 0),
    (d.track = s.track),
    s.track || (d.output = ""),
    cmdSetAuto(e, d, s.auto),
    r !== s.mode && cmdModeSwitch(e, d),
    s.command &&
      e.ui.message(
        e.rule("command_blocks_work")
          ? `成功设置命令：${s.command}`
          : `成功设置命令：${s.command}，但命令方块仍被禁用`,
      ));
}
function cmdBlockScreen(e, c, o, n) {
  const s = e.cmdEntity(c, o, n),
    i = e.world.getBlock(c, o, n);
  return new CommandBlockScreen(e, {
    command: s.command,
    output: s.output,
    track: s.track,
    mode: CMD_MODE[i],
    cond: cmdConditional(e, c, o, n),
    auto: s.auto,
    valid: () => void 0 !== CMD_MODE[e.world.getBlock(c, o, n)],
    apply: (s) => cmdApply(e, c, o, n, s),
  });
}
function cartCmd(e) {
  return e.cmd || (e.cmd = { command: "", success: 0, output: "", track: !0 });
}
const _cmdOnRail = Minecart.prototype.moveOnRail;
Minecart.prototype.moveOnRail = function (e, c, o, n) {
  const s = _cmdOnRail.call(this, e, c, o, n);
  return (
    "command_block" === this.kind &&
      !this.game.net &&
      !this.dead &&
      "activator_rail" === BLOCKS[n].key &&
      "true" === Features.propOf(n, this.world.getMeta(e, c, o), "powered") &&
      this.age - (this.cmdAt || 0) >= 4 &&
      (cmdPerform(this.game, cartCmd(this), {
        pos: [...this.pos],
        rot: [this.yaw, this.pitch || 0],
        entity: this,
      }),
      (this.cmdAt = this.age)),
    s
  );
};
const _cmdCartUse = Minecart.prototype.interact;
Minecart.prototype.interact = function (e, c) {
  return "command_block" !== this.kind
    ? _cmdCartUse.call(this, e, c)
    : !!this.game.canUseGameMasterBlocks() && (this.game.ui.open(cartScreen(this.game, this)), !0);
};
const _cmdCartDrop = Minecart.prototype.dropSelf;
Minecart.prototype.dropSelf = function () {
  if ("command_block" !== this.kind) return _cmdCartDrop.call(this);
  this.game.dropItem(this.pos[0], this.pos[1] + 0.3, this.pos[2], makeStack("minecart"));
};
const _cmdCartSave = Minecart.prototype.saveData,
  _cmdCartLoad = Minecart.prototype.loadData;
function cartScreen(e, c) {
  const o = cartCmd(c);
  return new CommandBlockScreen(e, {
    cart: !0,
    command: o.command,
    output: o.output,
    track: o.track,
    valid: () => !c.dead,
    apply: (n) => {
      e.net
        ? e.net.send({ t: "cmdcart", id: c.netId, command: n.command, track: n.track })
        : ((o.command = n.command),
          (o.success = 0),
          (o.track = n.track),
          n.track || (o.output = ""),
          n.command && e.ui.message(`成功设置命令：${n.command}`));
    },
  });
}
((Minecart.prototype.saveData = function () {
  const e = _cmdCartSave.call(this);
  return ("command_block" === this.kind && (e.cmd = cartCmd(this)), e);
}),
  (Minecart.prototype.loadData = function (e) {
    (_cmdCartLoad.call(this, e), e && e.cmd && (this.cmd = { ...cartCmd(this), ...e.cmd }));
  }));
class CommandBlockScreen extends MenuScreen {
  constructor(e, c) {
    (super(e, null),
      (this.v = c),
      (this.pauses = !e.net),
      (this.command = c.command || ""),
      (this.output = c.output || ""),
      (this.track = !1 !== c.track),
      (this.mode = c.mode || "redstone"),
      (this.cond = !!c.cond),
      (this.auto = !!c.auto),
      (this.ready = !1 !== c.ready));
  }
  fill(e) {
    (Object.assign(this, e), (this.ready = !0), this.game.ui.screen === this && this.layout());
  }
  get prevY() {
    return this.v.cart ? 150 : 135;
  }
  layout() {
    const e = this.game.ui,
      c = Math.floor(e.w / 2),
      o = this.ready,
      n = Math.floor(e.h / 4) + 132;
    ((this.field = { x: c - 150, y: 50, w: 300, h: 20 }),
      (this.prev = { x: c - 150, y: this.prevY, w: 276, h: 20 }));
    const s = [
      {
        x: c + 130,
        y: this.prevY,
        w: 20,
        h: 20,
        label: () => (this.track ? "O" : "X"),
        enabled: o,
        onClick: () => {
          this.track = !this.track;
        },
      },
    ];
    if (!this.v.cart) {
      const e = { sequence: "auto", auto: "redstone", redstone: "sequence" };
      (s.push({
        x: c - 154,
        y: 165,
        w: 100,
        h: 20,
        label: () => CMD_MODE_CN[this.mode],
        enabled: o,
        onClick: () => {
          this.mode = e[this.mode];
        },
      }),
        s.push({
          x: c - 50,
          y: 165,
          w: 100,
          h: 20,
          label: () => (this.cond ? "条件制约" : "不受制约"),
          enabled: o,
          onClick: () => {
            this.cond = !this.cond;
          },
        }),
        s.push({
          x: c + 54,
          y: 165,
          w: 100,
          h: 20,
          label: () => (this.auto ? "保持开启" : "红石控制"),
          enabled: o,
          onClick: () => {
            this.auto = !this.auto;
          },
        }));
    }
    (s.push({
      x: c - 154,
      y: n,
      w: 150,
      h: 20,
      label: "完成",
      enabled: o,
      onClick: () => this.done(),
    }),
      s.push({ x: c + 4, y: n, w: 150, h: 20, label: "取消", onClick: () => this.cancel() }),
      (this.widgets = s),
      e.showInput(
        this.field.x + 4,
        this.field.y + 6,
        this.field.w - 8,
        10,
        this.command,
        () => this.done(),
        {
          onInput: (e) => {
            this.command = e;
          },
          onEsc: () => this.cancel(),
          max: 32500,
        },
      ));
  }
  done() {
    this.ready &&
      (this.v.apply({
        command: this.command,
        mode: this.mode,
        track: this.track,
        cond: this.cond,
        auto: this.auto,
      }),
      this.game.ui.close());
  }
  cancel() {
    this.game.ui.close();
  }
  onEsc() {
    this.cancel();
  }
  drawExtra(e) {
    if (this.v.valid && !this.v.valid())
      return void setTimeout(() => {
        e.screen === this && e.close();
      }, 0);
    const c = e.ctx,
      o = Math.floor(e.w / 2);
    (Font.center(c, "设置此方块的控制台命令", o, 20, "#FFFFFF"),
      Font.draw(c, "控制台命令", o - 149, 40, "#A0A0A0"),
      e.nine("text_field_hl", this.field.x, this.field.y, this.field.w, this.field.h, 1));
    const n = this.track ? this.output : "-";
    if (n) {
      Font.draw(c, "上一个输出", o - 149, 121 + this.prevY - 135 + 4, "#A0A0A0");
      const s = this.prev;
      e.nine("text_field", s.x, s.y, s.w, s.h, 1);
      let i = n;
      for (; i && Font.width(i) > s.w - 8;) i = i.slice(0, -1);
      Font.draw(c, i, s.x + 4, s.y + 6, "#707070");
    }
  }
}
function cmdSnbt(e) {
  let c = 0;
  const ws = () => {
      for (; /\s/.test(e[c] || "");) c++;
    },
    val = () => {
      ws();
      const o = e[c];
      if ("{" === o) {
        c++;
        const o = {};
        for (ws(); "}" !== e[c]; ws()) {
          const n = key();
          (ws(),
            ":" !== e[c++] && cmdFail("无效的数据标签"),
            (o[n] = val()),
            ws(),
            "," === e[c] ? c++ : "}" !== e[c] && cmdFail("无效的数据标签"));
        }
        return (c++, o);
      }
      if ("[" === o) {
        c++;
        const o = [];
        for (ws(), /^[BIL];/.test(e.slice(c, c + 2)) && (c += 2), ws(); "]" !== e[c]; ws())
          (o.push(val()), ws(), "," === e[c] ? c++ : "]" !== e[c] && cmdFail("无效的数据标签"));
        return (c++, o);
      }
      if ('"' === o || "'" === o) return str();
      const n = /^[^,}\]\s]+/.exec(e.slice(c));
      (n || cmdFail("无效的数据标签"), (c += n[0].length));
      const s = n[0];
      if ("true" === s) return 1;
      if ("false" === s) return 0;
      const i = /^(-?\d*\.?\d+(?:e-?\d+)?)[bslfdBSLFD]?$/.exec(s);
      return i ? Number(i[1]) : s;
    },
    key = () => {
      if ('"' === e[c] || "'" === e[c]) return str();
      const o = /^[A-Za-z0-9_.+-]+/.exec(e.slice(c));
      return (o || cmdFail("无效的数据标签"), (c += o[0].length), o[0]);
    },
    str = () => {
      const o = e[c++];
      let n = "";
      for (; c < e.length && e[c] !== o;) ("\\" === e[c] && c++, (n += e[c++]));
      return (c++, n);
    },
    o = val();
  return o && "object" == typeof o && !Array.isArray(o) ? o : cmdFail("无效的数据标签");
}
const _cmdSetblockRun = CMD_RUN.setblock;
CMD_RUN.setblock = function (e, c) {
  const o = c[3] && /^([^{]*)(\{[\s\S]*\})$/.exec(c[3]);
  if (!o) return _cmdSetblockRun.call(this, e, c);
  const n = cmdSnbt(o[2]),
    s = [...c];
  ((s[3] = o[1]), _cmdSetblockRun.call(this, e, s));
  const [i, a, d] = cmdBlockPos(e, c[0], c[1], c[2]);
  if (void 0 === CMD_MODE[this.world.getBlock(i, a, d)]) return;
  const r = this.cmdEntity(i, a, d);
  ("string" == typeof n.Command && (r.command = n.Command),
    void 0 !== n.SuccessCount && (r.success = 0 | n.SuccessCount),
    void 0 !== n.TrackOutput && (r.track = !!n.TrackOutput),
    "string" == typeof n.LastOutput && (r.output = n.LastOutput),
    void 0 !== n.powered && (r.powered = !!n.powered),
    void 0 !== n.conditionMet && (r.met = !!n.conditionMet),
    void 0 !== n.auto && cmdSetAuto(this, r, !!n.auto));
};
const _cmdNetMsg = NetClient.prototype.onMessage;
NetClient.prototype.onMessage = function (e) {
  "status" === e.t && e.id === this.eid && e.s >= 24 && e.s <= 28 && (this.opLevel = e.s - 24);
  const c = _cmdNetMsg.call(this, e);
  if ("be" === e.t)
    for (const [c, o, n, s] of e.list) {
      const e = this.g.ui.screen;
      if (!(
        s.cmd &&
        e instanceof CommandBlockScreen &&
        e.v.at &&
        e.v.at.join() === [c, o - this.minY, n].join()
      ))
        continue;
      const i = this.g.world,
        a = o - this.minY;
      e.fill({
        command: s.cmd.command,
        output: s.cmd.output,
        track: s.cmd.track,
        auto: s.cmd.auto,
        mode: CMD_MODE[i.getBlock(c, a, n)] || "redstone",
        cond: cmdConditional(this.g, c, a, n),
      });
    }
  return c;
};
const _cmdNetMeta = netApplyMeta;
netApplyMeta = function (e, c, o) {
  const n = _cmdNetMeta(e, c, o);
  if (c instanceof Minecart && "command_block" === c.kind) {
    const e = cartCmd(c);
    (void 0 !== o.command_name && (e.command = o.command_name || ""),
      void 0 !== o.last_output && (e.output = o.last_output || ""));
  }
  return n;
};
const _cmdNetUse = Game.prototype.netUse;
Game.prototype.netUse = function () {
  const e = this.target,
    c = this.targetEntity,
    o = this.player,
    n = this.net,
    s = _cmdNetUse.call(this);
  if (!this.canUseGameMasterBlocks()) return s;
  if (c && c instanceof Minecart && "command_block" === c.kind) this.ui.open(cartScreen(this, c));
  else if (!c && e && void 0 !== CMD_MODE[e.id] && (!o.sneaking || !o.inv.held)) {
    const [c, o, s] = e.pos,
      i = this.world;
    this.ui.open(
      new CommandBlockScreen(this, {
        at: [c, o, s],
        ready: !1,
        mode: CMD_MODE[e.id],
        cond: cmdConditional(this, c, o, s),
        valid: () => void 0 !== CMD_MODE[i.getBlock(c, o, s)],
        apply: (e) =>
          n.send({
            t: "cmdblock",
            x: c,
            y: o + n.minY,
            z: s,
            command: e.command,
            mode: e.mode,
            track: e.track,
            cond: e.cond,
            auto: e.auto,
          }),
      }),
    );
  }
  return s;
};
//# sourceURL=js/cmdblock.js
