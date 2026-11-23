"use strict";
const NET_MOBS = new Set([
    "pig",
    "cow",
    "sheep",
    "chicken",
    "zombie",
    "skeleton",
    "creeper",
    "spider",
    "enderman",
    "blaze",
    "ghast",
    "zombified_piglin",
    "magma_cube",
    "villager",
    "zombie_villager",
    "iron_golem",
    "cat",
    "piglin",
    "hoglin",
    "strider",
  ]),
  NET_PLAYER_T = {
    cn: "玩家",
    hp: 20,
    w: 0.6,
    h: 1.8,
    speed: 0,
    model: "steve",
    tex: "steve",
    scale: 0.9375,
    drops: [],
  },
  R2D = 180 / Math.PI,
  angDiff = (t, e) => {
    let s = t - e;
    for (; s > Math.PI;) s -= 2 * Math.PI;
    for (; s < -Math.PI;) s += 2 * Math.PI;
    return s;
  },
  toYaw = (t) => Math.PI - t / R2D,
  fromYaw = (t) => 180 - t * R2D,
  NET_FACE = [4, 5, 0, 1, 2, 3],
  oursToWin = (t) => (40 === t ? 45 : t < 9 ? 36 + t : t < 36 ? t : 5 + t - 36),
  netRd = (t) => clamp(Math.round(+(t.settings && t.settings.renderDist) || 10), 2, 32),
  pinvToOurs = (t) => (t < 36 ? t : t <= 39 ? 75 - t : -1),
  sameItem = (t, e) =>
    t.id === e.id && (t.x || "") === (e.x || "") && (t.unk || "") === (e.unk || ""),
  sameStack = (t, e) =>
    (!t && !e) ||
    (!!t && !!e && sameItem(t, e) && t.count === e.count && (t.dmg || 0) === (e.dmg || 0)),
  netStack = (t) => {
    if (!t) return null;
    const e = { n: t.unk || ITEMS[t.id].key, c: t.count, x: t.x };
    return (
      t.x ||
        (t.dmg && (e.d = t.dmg),
        t.name && (e.name = t.name),
        t.e && t.e.length && (e.e = t.e),
        t.pot && (e.pot = t.pot),
        null != t.color && (e.color = t.color),
        t.pv && (e.pv = t.pv),
        t.instrument && (e.ins = t.instrument),
        t.patterns && (e.pat = t.patterns),
        t.base && (e.base = t.base),
        t.flight && ((e.flight = t.flight), (e.ex = t.explosions || [])),
        t.fw && (e.fw = t.fw)),
      e
    );
  };
class NetPlayer extends Mob {
  constructor(t, e, s, i, n) {
    (super(t, "zombie", e, s, i),
      (this.type = "player"),
      (this.T = NET_PLAYER_T),
      (this.w = 0.6),
      (this.h = 1.8),
      (this.name = n || "?"));
  }
  pose(t) {
    const e = 0.6662 * lerp(this.limbSwing - this.limbAmt, this.limbSwing, t),
      s = this.limbAmt,
      i = 1.4 * Math.cos(e) * s,
      n = -i,
      o = this.swingT > 0 ? clamp((6 - this.swingT + t) / 6, 0, 1) : 0,
      a = Math.sin(o * Math.PI),
      r = "off" === this.swingHand,
      l = {
        head: { ry: this.headYaw, rx: this.pitch },
        rarm: { rx: 0.7 * n + (r ? 0 : 1.5 * a) },
        larm: { rx: 0.7 * i + (r ? 1.5 * a : 0) },
        rleg: { rx: i },
        lleg: { rx: n },
      };
    if (
      (this.sneaking &&
        ((l.body = { rx: -0.5, t: [0, -1.73 / 16, 5.75 / 16] }), (l.head.t = [0, -0.2625, 0])),
      this.vehicleRef)
    )
      ((l.rleg = { rx: 1.4137167, ry: -0.31415927 }), (l.lleg = { rx: 1.4137167, ry: 0.31415927 }));
    else if (this.netSwim)
      return swimLimbs(l, lerp(this.limbSwing - this.limbAmt, this.limbSwing, t), this.swimming);
    return l;
  }
  swimTick() {
    ((this.prevSwimAmt = this.swimAmt || 0),
      (this.swimAmt = clamp(this.prevSwimAmt + (this.netSwim ? 0.09 : -0.09), 0, 1)),
      (this.swimming =
        !!this.netSwim &&
        this.world.waterAt(
          Math.floor(this.pos[0]),
          Math.floor(this.pos[1] + 0.3),
          Math.floor(this.pos[2]),
        )));
  }
}
function netVehicleTick() {
  const t = this.game.player;
  if (this instanceof Boat && this.rider === t) Boat.prototype.tick.call(this);
  else {
    if ((this.savePrev(), this.age++, this.lerpN > 0)) {
      const t = 1 / this.lerpN;
      for (let e = 0; e < 3; e++) this.pos[e] += (this.netPos[e] - this.pos[e]) * t;
      this.lerpN--;
    }
    if (
      (void 0 !== this.netYaw &&
        (this.yaw += 0.5 * angDiff(this.netYaw + (this.netYawOff || 0), this.yaw)),
      this.hurtT > 0 && this.hurtT--,
      this instanceof Boat)
    ) {
      const t = this.waterState();
      this.status = t.under ? "under" : null !== t.top ? "water" : "air";
    }
    if (this.rider)
      if (this.rider === t) t.followVehicle(this);
      else {
        const t = this.seat();
        ((this.rider.pos = t), (this.rider.netPos = t.slice()), (this.rider.lerpN = 0));
      }
  }
}
function netItemTick() {
  if ((this.savePrev(), this.age++, this.lerpN > 0)) {
    const t = 1 / this.lerpN;
    for (let e = 0; e < 3; e++) this.pos[e] += (this.netPos[e] - this.pos[e]) * t;
    this.lerpN--;
  }
}
function netEntityTick() {
  if ((this.savePrev(), this.age++, this.lerpN > 0)) {
    const t = 1 / this.lerpN;
    for (let e = 0; e < 3; e++) this.pos[e] += (this.netPos[e] - this.pos[e]) * t;
    this.lerpN--;
  }
  this.yaw += 0.5 * angDiff(this.netYaw, this.yaw);
  const t = this.netHead ?? this.netYaw,
    e = Math.hypot(this.pos[0] - this.prev[0], this.pos[2] - this.prev[2]) > 0.01,
    s =
      this.vehicleRef && this.vehicleRef.rider === this && void 0 !== this.vehicleRef.bodyYaw
        ? this.vehicleRef
        : null;
  (s
    ? (this.bodyYaw = s.bodyYaw)
    : (e || Math.abs(angDiff(t, this.bodyYaw)) > 0.9) &&
      (this.bodyYaw += 0.3 * angDiff(e ? this.yaw : t, this.bodyYaw)),
    (this.headYaw = clamp(angDiff(t, this.bodyYaw), -1.3, 1.3)),
    (this.pitch = this.netPitch || 0),
    this.swimTick && this.swimTick(),
    this.animate(),
    this instanceof EnderDragon || this.updateFluids(),
    this.netAnimTick && this.netAnimTick(),
    this.hurtTime > 0 && this.hurtTime--,
    this.swingT > 0 && this.swingT--,
    this.deathTime > 0 && ++this.deathTime > 20 && (this.dead = !0));
}
EnderDragon.prototype.netAnimTick = function () {
  if (
    ((this.prevFlap = this.flap),
    this.hist.unshift([this.pos[0], this.pos[1], this.pos[2], this.yaw]),
    this.hist.length > 64 && (this.hist.length = 64),
    (this.vel = [
      this.pos[0] - this.prev[0],
      this.pos[1] - this.prev[1],
      this.pos[2] - this.prev[2],
    ]),
    this.deathTime > 0)
  )
    this.flap += 0.02;
  else if (
    ((this.flap += this.flapSpeed()),
    Math.floor(this.flap) !== Math.floor(this.prevFlap) &&
      Sound.ev("entity.ender_dragon.flap", this.pos, 5, 0.8 + 0.3 * Math.random()),
    this.age % 10 == 0)
  ) {
    this.healer = null;
    let t = 32;
    for (const e of this.game.entities)
      if (e instanceof EndCrystal && !e.dead) {
        const s = e.distTo(this);
        s < t && ((t = s), (this.healer = e));
      }
  }
};
class NetClient {
  constructor(t, e, s, i = {}) {
    ((this.g = t),
      (this.url = e),
      (this.name = s),
      (this.opts = i),
      (this.room = null),
      (this.stateMap = null),
      (this.bookStates = new Set()),
      (this.lecternBooks = new Set()),
      (this.biomes = []),
      (this.minY = -64),
      (this.ents = new Map()),
      (this.players = new Map()),
      (this.unknown = new Map()),
      (this.missing = new Map()),
      (this.stats = { chunks: 0, msgs: 0 }),
      (this.inv = new Array(40).fill(null)),
      (this.w0x = new Array(5).fill(null)),
      (this.off = null),
      (this.win = null),
      (this.sentSel = -1),
      (this.unknownItems = new Set()),
      (this.eid = 0),
      (this.pendingItems = new Map()));
    const n = (this.ws = new WebSocket(e));
    ((n.binaryType = "arraybuffer"),
      (n.onopen = async () => {
        const e = "undefined" != typeof Integrity ? await Integrity.reportWithin(4e3) : null;
        1 === n.readyState &&
          n.send(
            JSON.stringify({
              t: "hello",
              name: s,
              version: 1,
              proto: 1,
              room: i.room,
              key: i.key,
              token: (i.room && "undefined" != typeof Account && Account.token) || void 0,
              rd: netRd(t),
              ic: e || void 0,
            }),
          );
      }),
      (n.onmessage = (t) => {
        this.stats.msgs++;
        try {
          "string" == typeof t.data ? this.onMessage(JSON.parse(t.data)) : this.onBinary(t.data);
        } catch (t) {
          console.error("net", t);
        }
      }),
      (n.onerror = () => {
        this.closed ||
          this.fail(
            i.room ? "游戏正在更新中…请稍后" : "无法连接到联机中转 " + e + "（中转程序没有启动？）",
          );
      }),
      (n.onclose = () => {
        this.closed || this.fail("游戏正在更新中…请稍后");
      }));
  }
  send(t) {
    try {
      if ("undefined" != typeof AntiCheat) {
        if (!AntiCheat.roomOut(this.g, this, t)) return;
        AntiCheat.roomSign(this, t);
      }
    } catch (t) {}
    1 === this.ws.readyState && this.ws.send(JSON.stringify(t));
  }
  sendSettings() {
    const t = netRd(this.g);
    t !== this.sentRd && ((this.sentRd = t), this.send({ t: "settings", rd: t }));
  }
  settingsSoon() {
    (clearTimeout(this.rdTimer),
      (this.rdTimer = setTimeout(() => {
        this.closed || this.g.net !== this || this.sendSettings();
      }, 1e3)));
  }
  close() {
    ((this.closed = !0), clearTimeout(this.rdTimer));
    try {
      this.ws.close();
    } catch (t) {}
  }
  fail(t) {
    if (this.closed) return;
    this.closed = !0;
    const e = this.g;
    (e.leaveServer(),
      e.ui.open(
        new ConfirmScreen(
          e,
          "游戏正在更新中…请稍后" === t ? "游戏正在更新中" : "连接已断开",
          "游戏正在更新中…请稍后" === t ? "请稍后再试" : t,
          "返回标题画面",
          () => e.ui.open(new TitleScreen(e)),
        ),
      ));
  }
  onMessage(t) {
    const e = this.g,
      s = e.world,
      i = e.player;
    switch (t.t) {
      case "states": {
        const e = (this.stateMap = new Uint32Array(t.list.length));
        ((this.subst = new Set()), (this.bookStates = new Set()));
        const s = (this.wlStates = new Uint8Array(t.list.length));
        t.list.forEach((t, i) => {
          /lectern\[[^\]]*has_book=true/.test(t) && this.bookStates.add(i);
          let n = null;
          try {
            n = mapVanillaStateNear(t);
          } catch (t) {}
          const o = t.split("[")[0];
          (n
            ? n[2] && this.subst.add(o)
            : (this.missing.set(o, (this.missing.get(o) || 0) + 1), (n = [0, 0])),
            t.includes("waterlogged=true") &&
              (n[0] ? canWaterlog(n[0], n[1]) && (s[i] = 1) : (n = [WATER, 0])),
            (e[i] = (n[0] << 8) | n[1]));
        });
        break;
      }
      case "biomes":
        this.biomes = t.list.map((t) => Math.max(VB_BASE, vbiomeIndex(t)));
        break;
      case "login":
        ((this.eid = t.eid), this.enterWorld(t, !0), (this.sentRd = null), this.sendSettings());
        break;
      case "respawn":
        this.enterWorld(t, !1);
        break;
      case "pos": {
        const e = t.rel || {};
        ((i.pos[0] = e.x ? i.pos[0] + t.x : t.x),
          (i.pos[1] = e.y ? i.pos[1] + t.y : t.y - this.minY),
          (i.pos[2] = e.z ? i.pos[2] + t.z : t.z),
          (i.yaw = e.yaw ? i.yaw - t.yaw / R2D : toYaw(t.yaw)),
          (i.pitch = e.pitch ? i.pitch - t.pitch / R2D : -t.pitch / R2D),
          (i.prev = [...i.pos]),
          (i.vel = [0, 0, 0]),
          (i.fallDist = 0),
          "undefined" != typeof AntiCheat && AntiCheat.roomReset(this),
          this.send({ t: "tpok", id: t.id }),
          (this.posDue = !0));
        break;
      }
      case "abilities":
        ((i.flying = !!(2 & t.flags)), (i.canFly = !!(4 & t.flags)));
        break;
      case "mode":
        e.setMode("adventure" === t.mode ? "survival" : t.mode, !0);
        break;
      case "time":
        ((e.worldTime = t.day), (e.timeRate = t.rate ?? 1), s && (s.time = t.day));
        break;
      case "rain":
        (void 0 !== t.on && (e.rainTarget = t.on ? 1 : 0),
          void 0 !== t.level && ((e.rainTarget = t.level), (e.weather = t.level)));
        break;
      case "chat":
        if (t.bar) e.ui.actionBar = { text: t.text, t: performance.now(), color: t.color };
        else for (const s of String(t.text).split("\n")) e.ui.message(s, t.color);
        break;
      case "unload":
        this.unload(t.cx, t.cz);
        break;
      case "signs":
        for (const [s, i, n, o] of t.list) e.signs.set(s + "," + (i - this.minY) + "," + n, o);
        break;
      case "block":
        this.setBlock(t.x, t.y, t.z, t.s);
        break;
      case "blocks":
        for (let e = 0; e < t.list.length; e += 4)
          this.setBlock(t.list[e], t.list[e + 1], t.list[e + 2], t.list[e + 3]);
        break;
      case "players":
        this.players = new Map(t.list.map((t) => [t.uuid, t.name]));
        break;
      case "spawn":
        this.spawn(t);
        break;
      case "move": {
        const e = this.ents.get(t.id) || this.pendingItems.get(t.id);
        if (!e) break;
        if ("undefined" != typeof AntiCheat && !AntiCheat.roomIn(this, e, t)) break;
        (void 0 !== t.x && ((e.netPos = [t.x, t.y - this.minY, t.z]), (e.lerpN = t.tp ? 1 : 3)),
          void 0 !== t.yaw && ((e.netYaw = toYaw(t.yaw)), (e.netPitch = -t.pitch / R2D)));
        break;
      }
      case "head": {
        const e = this.ents.get(t.id);
        e && (e.netHead = toYaw(t.yaw));
        break;
      }
      case "pass": {
        const e = this.ents.get(t.id);
        if (!e || (!e.isVehicle && !e.seat)) break;
        const s = t.list.map((t) => (t === this.eid ? i : this.ents.get(t))).filter(Boolean);
        e.rider &&
          !s.includes(e.rider) &&
          (e.rider === i ? ((i.vehicle = null), (i.rideInput = null)) : (e.rider.vehicleRef = null),
          (e.rider = null));
        const n = s[0];
        n === i
          ? i.vehicle !== e && ((i.vehicle = e), (e.rider = i), i.followVehicle(e), i.savePrev())
          : n && ((e.rider = n), (n.vehicleRef = e));
        break;
      }
      case "vmove": {
        const e = i.vehicle;
        e && ((e.pos = [t.x, t.y - this.minY, t.z]), (e.yaw = toYaw(t.yaw)), (e.vel = [0, 0, 0]));
        break;
      }
      case "remove":
        for (const e of t.ids) {
          const t = this.ents.get(e);
          (t && ((t.dead = !0), this.ents.delete(e)), this.pendingItems.delete(e));
        }
        break;
      case "anim": {
        const e = this.ents.get(t.id);
        !e ||
          (0 !== t.a && 3 !== t.a) ||
          ((e.swingT = 6), (e.swingHand = 3 === t.a ? "off" : "main"));
        break;
      }
      case "hurt": {
        if (t.id === this.eid) {
          ((i.hurtTime = 10), Sound.ev("entity.player.hurt", i.pos, 1, 1));
          break;
        }
        const e = this.ents.get(t.id);
        e && (e.hurtTime = 10);
        break;
      }
      case "open": {
        const s = e.ui.screen;
        (s && s.net === this && (s.serverClosed = !0),
          (this.win = {
            id: t.id,
            kind: t.kind,
            title: t.title,
            slots: [],
            props: [],
            trades: null,
          }));
        break;
      }
      case "win": {
        const s = t.id,
          i = this.win,
          n = !!i && i.id === s;
        if (0 !== s && !n) break;
        (n &&
          void 0 === i.n &&
          (i.n =
            "lectern" === i.kind
              ? t.items.length
              : "crafter_3x3" === i.kind
                ? 9
                : Math.max(0, t.items.length - 36)),
          t.items.forEach((t, e) => this.slotSet(s, e, this.stackIn(t))),
          this.screenFor(s) && (e.ui.cursor = this.stackIn(t.carried)),
          this.applyInv(),
          n && !i.screen && this.openWindow(i));
        break;
      }
      case "wslot":
        (0 === t.id || (this.win && this.win.id === t.id)) &&
          (this.slotSet(t.id, t.i, this.stackIn(t.item)), this.applyInv());
        break;
      case "cursor":
        e.ui.screen && e.ui.screen.net === this && (e.ui.cursor = this.stackIn(t.item));
        break;
      case "wclose": {
        const s = this.screenFor(t.id);
        (s && ((s.serverClosed = !0), e.ui.close()),
          this.win && this.win.id === t.id && (this.win = null));
        break;
      }
      case "prop":
        this.win &&
          this.win.id === t.id &&
          ((this.win.props[t.k] = t.v),
          void 0 !== t.name && ((this.win.pnames || (this.win.pnames = {}))[t.k] = t.name));
        break;
      case "trades":
        this.win &&
          this.win.id === t.id &&
          Object.assign(this.win, {
            trades: t.list,
            level: t.level,
            xp: t.xp,
            regular: t.regular,
            offers: null,
          });
        break;
      case "pinv": {
        const e = this.stackIn(t.item);
        if (40 === t.i) this.off = e;
        else {
          const s = pinvToOurs(t.i);
          s >= 0 && (this.inv[s] = e);
        }
        this.applyInv();
        break;
      }
      case "held":
        i.inv.sel = this.sentSel = t.slot;
        break;
      case "effect":
        t.e &&
          (i.effects || (i.effects = new Map())).set(t.e, {
            amp: t.amp,
            dur: t.dur,
            ambient: !!(1 & t.f),
            hidden: !(4 & t.f),
            max: t.dur,
          });
        break;
      case "uneffect":
        i.effects && i.effects.delete(t.e);
        break;
      case "health":
        ((i.health = t.hp),
          (i.food = t.food),
          (i.saturation = t.sat),
          t.hp <= 0 && 0 === i.deathTime
            ? ((i.deathTime = 1),
              (e.deathMsg = this.deathMsg || "你死了"),
              (i.usingItem = null),
              "loading" === e.state
                ? ((e.state = "play"), e.ui.open(new DeathScreen(e)))
                : setTimeout(() => {
                    e.net === this && "play" === e.state && e.ui.open(new DeathScreen(e));
                  }, 1e3))
            : t.hp > 0 &&
              i.deathTime > 0 &&
              ((i.deathTime = 0), e.ui.screen instanceof DeathScreen && e.ui.close()));
        break;
      case "xp":
        i.xp = e.xpTotalFor(t.level) + Math.round(t.bar * e.xpNeeded(t.level));
        break;
      case "death":
        ((this.deathMsg = t.msg), e.ui.message(t.msg));
        break;
      case "equip": {
        const e = this.ents.get(t.id);
        if (e && void 0 !== t.item) {
          const s = this.stackIn(t.item);
          e.heldId = s && !s.unk ? s.id : null;
        }
        break;
      }
      case "meta": {
        const s = this.ents.get(t.id) || this.pendingItems.get(t.id);
        if (!s) break;
        if (
          (void 0 !== t.pose &&
            ((s.sneaking = "crouching" === t.pose || 5 === t.pose),
            (s.netSwim = "swimming" === t.pose || 3 === t.pose)),
          void 0 !== t.item && s instanceof ItemEntity)
        ) {
          const i = this.stackIn(t.item);
          i &&
            !i.unk &&
            ((s.stack = i),
            this.pendingItems.delete(t.id) && (e.entities.push(s), this.ents.set(t.id, s)));
        } else if (t.item && s.netPotion) {
          const e = this.stackIn(t.item);
          e && (s.netPot = e.pot);
        }
        break;
      }
      case "collect": {
        const e = this.ents.get(t.id);
        e &&
          ((e.dead = !0),
          this.ents.delete(t.id),
          t.by === this.eid && Sound.pop && Sound.pop(i.pos));
        break;
      }
      case "status": {
        const e = this.ents.get(t.id);
        e && 3 === t.s && (e.deathTime = 1);
        break;
      }
      case "kick":
        ("undefined" != typeof AntiCheat && AntiCheat.roomSignOff(this),
          this.fail(t.reason || "被服务器断开"));
        break;
      case "live":
        "undefined" != typeof Live && Live.fetch(t.v);
        break;
      case "notice":
        e.ui.screen instanceof LoadingScreen
          ? ((e.ui.screen.text = t.text), e.ui.screen.setQueue(null))
          : e.ui.message(t.text, "#AAAAAA");
        break;
      case "queue":
        e.ui.screen instanceof LoadingScreen && e.ui.screen.setQueue(t);
        break;
      case "room":
        if (
          ((this.room = t),
          e.ui.message(
            "已进入房间「" +
              t.name +
              "」，邀请码 " +
              t.code +
              "（暂停菜单 → 房间：邀请朋友、看玩家" +
              (t.isOwner ? "、管理" : "、举报") +
              "）",
            "#FFFF55",
          ),
          t.sponsorText)
        ) {
          const s = {
            text: String(t.sponsorText).slice(0, 80),
            ms: 1e3 * clamp(+t.sponsorSeconds || 30, 0, 300),
          };
          "play" === e.state ? e.ui.pinMessage(s.text, s.ms) : (e.pendingPin = s);
        }
        break;
      case "error":
        ("undefined" != typeof AntiCheat && AntiCheat.roomSignOff(this),
          console.warn("proxy:", t.msg));
    }
  }
  enterWorld(t, e) {
    const s = this.g;
    (s.world && s.unloadAll(),
      setWorldFormat(2),
      NetClient.biomesReady ||
        (initVanillaBiomes(s.renderer.grassMap, s.renderer.foliageMap),
        (NetClient.biomesReady = !0)));
    const i = t.dim,
      n = new World(0, i);
    if (
      ((n.gen2 = !0),
      (n.remote = !0),
      (n.minY = t.minY),
      (n.seedStr = "0"),
      (n.structures = !1),
      (n.grassMap = s.renderer.grassMap),
      (n.foliageMap = s.renderer.foliageMap),
      (n.listener = s),
      (n.useCW = !(!s.chunkWorker || !s.chunkWorker.ready || s.chunkWorker.failed)),
      (this.minY = t.minY),
      (s.world = n),
      (s.dim = i),
      (s.dimData = null),
      (s.entities = []),
      (s.blockEntities = new Map()),
      (s.signs = new Map()),
      (s.particles.list = []),
      (s.genQueue = []),
      (s.meshQueue = []),
      (s.genEpoch = (s.genEpoch || 0) + 1),
      (s._lastCC = null),
      (s.meshResQ = []),
      this.ents.clear(),
      e)
    ) {
      (((s.player = new Player(s, 0.5, 100, 0.5)).hurt = () => !1),
        (s.worldMeta = null),
        (s.hardcore = !1),
        (s.difficulty = 2),
        (s.cheats = !1),
        (s.tutorial = -1),
        (s.tutStat = { moved: 0 }),
        (s.adv = {}),
        (s.stats = { kills: 0, placed: 0, mined: 0 }),
        (s.welcome = !1),
        (s.iconAt = 0),
        (s.sleeping = null),
        (s.portalOverlay = 0));
    } else s.player.world = n;
    ((s.mode = "adventure" === t.mode ? "survival" : t.mode || "survival"),
      (s.state = "loading"),
      (s.loadStart = performance.now()),
      s.ui.screen && s.ui.screen.net === this && (s.ui.screen.serverClosed = !0),
      (this.win = null),
      s.ui.open(new LoadingScreen(s, e ? "正在加入服务器…" : "正在进入" + (DIM_CN[i] || i) + "…")));
  }
  setBlock(t, e, s, i) {
    const n = this.g.world;
    if (!n) return;
    const o = this.stateMap[i] || 0,
      a = e - this.minY,
      r = n.getChunk(t >> 4, s >> 4),
      l = (a << 8) | ((15 & s) << 4) | (15 & t),
      h = r ? r.getB(l) : 0,
      c = !!(r && r.wl && r.wl.delete(l));
    (n.setBlock(t, a, s, o >> 8, 255 & o, 0),
      r && this.wlStates[i] && (r.wl || (r.wl = new Set())).add(l),
      r && c !== !!this.wlStates[i] && n.markBlock(r, 15 & t, a, 15 & s),
      r && (c || this.wlStates[i]) && (WET_EMIT[h] || WET_EMIT[o >> 8]) && n.relight(t, a, s));
    const p = t + "," + a + "," + s;
    this.bookStates.has(i) ? this.lecternBooks.add(p) : this.lecternBooks.delete(p);
  }
  unload(t, e) {
    const s = this.g,
      i = s.world,
      n = ckey(t, e);
    if (i && i.chunks.has(n)) {
      (s.renderer.dropChunk(t, e), i.chunks.delete(n));
      for (const i of s.signs.keys()) {
        const [n, , o] = i.split(",");
        n >> 4 === t && o >> 4 === e && s.signs.delete(i);
      }
      if ((this.dropBooks(t, e), s.meshVer))
        for (let t = 0; t < SECTIONS; t++) s.meshVer.delete(32 * n + t);
    }
  }
  dropBooks(t, e) {
    for (const s of this.lecternBooks) {
      const [i, , n] = s.split(",");
      i >> 4 === t && n >> 4 === e && this.lecternBooks.delete(s);
    }
  }
  onBinary(t) {
    const e = this.g,
      s = e.world;
    if (!s || !this.stateMap) return;
    const i = new DataView(t),
      n = new Uint8Array(t);
    let o = 0;
    const a = i.getUint8(o),
      r = i.getInt32(o + 1, !0),
      l = i.getInt32(o + 5, !0),
      h = i.getUint8(o + 9);
    o += 10;
    const c = ckey(r, l);
    let p = s.chunks.get(c);
    if (1 === a) ((p = new Chunk(r, l)), this.stats.chunks++);
    else if (!p) return;
    const u = new Uint8Array(4096),
      d = this.stateMap,
      g = this.bookStates,
      f = this.wlStates;
    let m = -1;
    const w = [];
    1 === a && this.dropBooks(r, l);
    for (let e = 0; e < h; e++) {
      const s = i.getUint16(o, !0);
      o += 2;
      const h = new Array(s);
      let c = null,
        y = null;
      for (let t = 0; t < s; t++, o += 2) {
        const e = i.getUint16(o, !0);
        ((h[t] = d[e] || 0),
          g.size && g.has(e) && (c || (c = new Set())).add(t),
          f && f[e] && (y || (y = new Set())).add(t));
      }
      let k = null;
      if (
        (s > 1 &&
          (s <= 256
            ? ((k = n.subarray(o, o + 4096)), (o += 4096))
            : ((k = new Uint16Array(t.slice(o, o + 8192))), (o += 8192))),
        y && 1 === a && e < SECTIONS)
      )
        for (let t = 0; t < 4096; t++)
          y.has(k ? k[t] : 0) && (p.wl || (p.wl = new Set())).add((e << 12) | t);
      if (c && 1 === a && e < SECTIONS)
        for (let t = 0; t < 4096; t++)
          c.has(k ? k[t] : 0) &&
            this.lecternBooks.add(
              16 * r + (15 & t) + "," + (16 * e + (t >> 8)) + "," + (16 * l + ((t >> 4) & 15)),
            );
      1 === a && e < SECTIONS && this.putSection(p, e, h, k);
      const b = n[o++],
        _ = 1 & b ? n.subarray(o, o + 2048) : null;
      _ && (o += 2048);
      const v = 2 & b ? n.subarray(o, o + 2048) : null;
      if (
        (v && (o += 2048),
        1 === a && e < SECTIONS && (_ ? (m = e) : w.push(e)),
        e >= SECTIONS || (!_ && !v && 2 === a))
      )
        continue;
      for (let t = 0; t < 4096; t++) {
        const s = (1 & t) << 2,
          i = 2 === a ? p.getL((e << 12) | t) : 0;
        u[t] = ((_ ? (_[t >> 1] >> s) & 15 : i >> 4) << 4) | (v ? (v[t >> 1] >> s) & 15 : 15 & i);
      }
      const S = u[0];
      let x = !0;
      for (let t = 1; t < 4096; t++)
        if (u[t] !== S) {
          x = !1;
          break;
        }
      (x ? ((p.ls[e] = null), (p.lu[e] = S)) : (p.ls[e] = u.slice()),
        2 === a && this.markSection(r, l, e));
    }
    if (1 === a) {
      for (const t of w)
        if (t > m)
          if (p.ls[t]) {
            const e = p.ls[t];
            for (let t = 0; t < 4096; t++) e[t] |= 240;
          } else p.lu[t] = 240 | (15 & p.lu[t]);
      for (let t = 0; t < 256; t++) p.biome[t] = this.biomes[n[o + t]] || VB_BASE;
      ((p.lit = !0),
        (p.final = !0),
        p.recount(),
        s.chunks.set(c, p),
        e.chunkTints(p),
        (p.dirty = ALL_SECTIONS));
      for (let t = -1; t <= 1; t++)
        for (let e = -1; e <= 1; e++) {
          const i = s.getChunk(r + t, l + e);
          i && i !== p && (i.dirty |= ALL_SECTIONS);
        }
    }
  }
  putSection(t, e, s, i) {
    const n = [],
      o = new Map();
    let a = !1,
      r = !1;
    const l = s.map((t) => {
      const e = t >> 8;
      (255 & t && (a = !0), e && (r = !0));
      let s = o.get(e);
      return (void 0 === s && ((s = n.length), o.set(e, s), n.push(e)), s);
    });
    if (!r) return;
    const h = new Uint8Array(4096),
      c = a ? new Uint8Array(4096) : null;
    if (n.length > 256) {
      const n = new Uint16Array(4096);
      for (let t = 0; t < 4096; t++) {
        const e = s[i ? i[t] : 0];
        ((n[t] = e >> 8), c && (c[t] = 255 & e));
      }
      t.bs[e] = { p: SEC_IDENT, n: -1, d: n };
    } else {
      const o = new Uint16Array(256);
      o.set(n);
      for (let t = 0; t < 4096; t++) {
        const e = i ? i[t] : 0;
        ((h[t] = l[e]), c && (c[t] = 255 & s[e]));
      }
      t.bs[e] = { p: o, n: n.length, d: h };
    }
    t.ms[e] = c;
  }
  markSection(t, e, s) {
    const i = this.g.world;
    for (let n = -1; n <= 1; n++)
      for (let o = -1; o <= 1; o++) {
        const a = i.getChunk(t + n, e + o);
        a && (a.dirty |= (1 << s) | (s > 0 ? 1 << (s - 1) : 0) | (1 << (s + 1)));
      }
  }
  spawn(t) {
    const e = this.g;
    if (this.ents.has(t.id)) return;
    let s;
    const i = t.y - this.minY;
    if ("item" === t.type) {
      const s = new ItemEntity(e, t.x, i, t.z, { id: ITEM_KEY.stone, count: 1 }, [0, 0, 0]);
      return (
        (s.netId = t.id),
        (s.remote = !0),
        (s.tick = netItemTick),
        (s.netPos = [t.x, i, t.z]),
        (s.lerpN = 0),
        (s.pickup = 1e9),
        void this.pendingItems.set(t.id, s)
      );
    }
    if ("player" === t.type) s = new NetPlayer(e, t.x, i, t.z, t.name || this.players.get(t.uuid));
    else {
      if (!NET_MOBS.has(t.type)) {
        if (/_(chest_)?(boat|raft)$/.test(t.type) || /(^|_)minecart$/.test(t.type)) {
          const n = /^(\w+?)_(chest_)?(boat|raft)$/.exec(t.type);
          return (
            (s = n
              ? new Boat(e, t.x, i, t.z, n[1], !!n[2])
              : new Minecart(
                  e,
                  t.x,
                  i,
                  t.z,
                  "minecart" === t.type ? "" : t.type.replace(/_minecart$/, ""),
                )),
            (s.netId = t.id),
            (s.remote = !0),
            (s.alwaysTick = !0),
            (s.tick = netVehicleTick),
            (s.hurt = () => !1),
            (s.netPos = [t.x, i, t.z]),
            (s.lerpN = 0),
            (s.netYaw = s.yaw = toYaw(t.yaw) + (n ? 0 : Math.PI / 2)),
            n || (s.netYawOff = Math.PI / 2),
            e.entities.push(s),
            void this.ents.set(t.id, s)
          );
        }
        return void this.unknown.set(t.type, (this.unknown.get(t.type) || 0) + 1);
      }
      s = createMob(e, t.type, t.x, i, t.z);
    }
    ((s.netId = t.id),
      (s.remote = !0),
      (s.persistent = !0),
      (s.alwaysTick = !0),
      (s.tick = netEntityTick),
      (s.netPos = [t.x, i, t.z]),
      (s.lerpN = 0),
      (s.netYaw = s.yaw = s.bodyYaw = s.prevBodyYaw = toYaw(t.yaw)),
      (s.netPitch = -t.pitch / R2D),
      (s.hurt = () => !1),
      e.entities.push(s),
      this.ents.set(t.id, s));
  }
  stackIn(t) {
    if (!t) return null;
    const e = ITEM_KEY[t.n],
      s = { id: e, count: t.c, dmg: t.d || 0 };
    return (
      void 0 === e && (this.unknownItems.add(t.n), (s.id = ITEM_KEY.stone), (s.unk = t.n)),
      t.x && (s.x = t.x),
      t.name && (s.name = t.name),
      t.lore && (s.lore = t.lore),
      t.e && (s.e = t.e),
      t.pot && (s.pot = t.pot),
      void 0 !== t.g && (s.g = t.g),
      t.ch && (s.charged = t.ch.map((t) => this.stackIn(t))),
      s
    );
  }
  applyInv() {
    const t = this.g.player.inv.slots;
    for (let e = 0; e < 40; e++) t[e] = this.inv[e] ? { ...this.inv[e] } : null;
    t[40] = this.off ? { ...this.off } : null;
  }
  slotGet(t, e) {
    if (0 === t)
      return e < 5
        ? this.w0x[e]
        : e < 9
          ? this.inv[36 + e - 5]
          : e < 36
            ? this.inv[e]
            : e < 45
              ? this.inv[e - 36]
              : 45 === e
                ? this.off
                : null;
    const s = this.win;
    if (!s || s.id !== t || e < 0) return null;
    if (e < s.n) return s.slots[e];
    const i = e - s.n;
    return i < 27 ? this.inv[9 + i] : i < 36 ? this.inv[i - 27] : null;
  }
  slotSet(t, e, s) {
    if (0 === t)
      return void (e < 5
        ? (this.w0x[e] = s)
        : e < 9
          ? (this.inv[36 + e - 5] = s)
          : e < 36
            ? (this.inv[e] = s)
            : e < 45
              ? (this.inv[e - 36] = s)
              : 45 === e && (this.off = s));
    const i = this.win;
    if (!i || i.id !== t || e < 0) return;
    if (e < i.n) return void (i.slots[e] = s);
    const n = e - i.n;
    n < 27 ? (this.inv[9 + n] = s) : n < 36 && (this.inv[n - 27] = s);
  }
  screenFor(t) {
    const e = this.g.ui.screen;
    return e && e.net === this && e.netWin === t ? e : null;
  }
  inventoryScreen() {
    const t = new CraftingScreen(this.g, 2);
    return (
      this.netify(t, 0, [1, 2, 3, 4, 0, 5, 6, 7, 8], 9),
      t.slots.push(this.netSlot(t, { x: 77, y: 62 }, 45)),
      t
    );
  }
  openWindow(t) {
    const e = this.g,
      s = t.kind,
      i = t.n;
    let n, o;
    if ("lectern" === s) return ((n = this.lecternScreen(t)), (t.screen = n), void e.ui.open(n));
    if ("crafting" === s) ((n = new CraftingScreen(e, 3)), (o = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]));
    else if ("furnace" === s || "blast_furnace" === s || "smoker" === s) {
      const s = t.props;
      ((n = new FurnaceScreen(e, {
        get burn() {
          return s[0] || 0;
        },
        get burnMax() {
          return s[1] || 200;
        },
        get cook() {
          return s[3] ? ((s[2] || 0) / s[3]) * 200 : 0;
        },
      })),
        (n.title = t.title),
        (o = [0, 1, 2]));
    } else if ("merchant" === s)
      ((n = new MerchantScreen(e, this.merchantView(t))),
        (o = [0, 1, 2]),
        Object.defineProperty(n, "title2", {
          get: () => t.title + (t.regular && t.level ? " - " + LEVEL_CN[t.level - 1] : ""),
        }),
        (n.pick = (t) => {
          ((n.sel = t), this.send({ t: "trade", i: t }));
        }),
        (n.update = () => {}));
    else if (NET_STATION[s]) ((n = NET_STATION[s](this, t)), (o = [...Array(i).keys()]));
    else {
      const a = /^generic_9x\d$/.test(s)
          ? +s.slice(-1)
          : "shulker_box" === s
            ? 3
            : Math.max(1, Math.ceil(i / 9)),
        r = /^generic_|^shulker_box$|^hopper$|^crafter_3x3$/.test(s);
      ((n = new ContainerScreen(
        e,
        "generic_54",
        176,
        114 + 18 * a,
        t.title + (r ? "" : "（暂不完整支持）"),
      )),
        (n.rows = a),
        (n.drawBase = ChestScreen.prototype.drawBase),
        (n.drawExtra = (t) => {
          t.ctx.fillStyle = "#C6C6C6";
          for (let e = i; e < 9 * a; e++)
            t.ctx.fillRect(n.x + 7 + (e % 9) * 18, n.y + 17 + 18 * Math.floor(e / 9), 18, 18);
        }));
      for (let t = 0; t < i; t++)
        n.slots.push({
          x: 8 + (t % 9) * 18,
          y: 18 + 18 * Math.floor(t / 9),
          output: NET_OUTPUT[s] === t,
        });
      ("lectern" !== s && n.addPlayerSlots(31 + 18 * a, 89 + 18 * a), (o = [...Array(i).keys()]));
    }
    if ((this.netify(n, t.id, o, i), n.onNetClose)) {
      const t = n.close;
      n.close = function () {
        (t.call(this), this.onNetClose());
      };
    }
    ((t.screen = n), e.ui.open(n));
  }
  lecternScreen(t) {
    const e = this,
      s = t.props,
      i = new BookScreen(this.g, { pages: [] }, !1, {
        pos: null,
        get page() {
          return s[0] || 0;
        },
        set page(s) {
          e.send({ t: "button", id: t.id, b: 100 + s });
        },
      });
    (Object.defineProperty(i, "pages", {
      get: () => {
        const e = t.slots[0];
        return e && e.pages && e.pages.length ? e.pages : [""];
      },
      set: () => {},
    }),
      Object.defineProperty(i, "page", {
        get: () => clamp(s[0] || 0, 0, i.pages.length - 1),
        set: (t) => {
          s[0] = t;
        },
      }));
    const n = i.mouseDown,
      o = i.close;
    return (
      (i.mouseDown = function (s, i, o) {
        const a = this.btns().find((t) => "take" === t.act);
        if (a && s.hit(a, i, o))
          return (
            Sound.click && Sound.click(),
            e.send({ t: "button", id: t.id, b: 3 }),
            void s.close()
          );
        n.call(this, s, i, o);
      }),
      (i.net = this),
      (i.netWin = t.id),
      (i.close = function () {
        (o.call(this),
          this.serverClosed || e.send({ t: "wclose", id: t.id }),
          e.win && e.win.id === t.id && (e.win = null));
      }),
      i
    );
  }
  merchantView(t) {
    return {
      restock() {},
      pos: this.g.player.pos,
      get vlevel() {
        return t.regular ? t.level || 1 : 5;
      },
      get vxp() {
        return t.xp || 0;
      },
      offers: () =>
        t.offers ||
        (t.offers = (t.trades || [])
          .map((t) => {
            const e = this.stackIn(t.a),
              s = t.b && this.stackIn(t.b),
              i = this.stackIn(t.r);
            if (!e || !i) return null;
            const n = clamp(
              e.count + Math.max(0, Math.floor(e.count * t.dem * t.mul)) + t.sp,
              1,
              maxStack(e.id),
            );
            return {
              a: e.id,
              an: n,
              b: s ? s.id : null,
              bn: s ? s.count : 0,
              r: i.id,
              rn: i.count,
              used: t.off ? t.max : t.used,
              uses: t.max,
            };
          })
          .filter(Boolean)),
    };
  }
  netify(t, e, s, i) {
    ((t.net = this),
      (t.netWin = e),
      (t.slots = t.slots.map((e, n) => this.netSlot(t, e, n < s.length ? s[n] : i + n - s.length))),
      Object.assign(t, NET_SCREEN));
  }
  netSlot(t, e, s) {
    const i = this.win && t.netWin === this.win.id ? this.win.kind : "player";
    let n = null;
    0 === t.netWin && s >= 5 && s <= 8
      ? (n = (t) => !!ITEMS[t.id].armor && !t.unk && ITEMS[t.id].armor.slot === s - 5)
      : /furnace|smoker/.test(i) &&
        1 === s &&
        (n = (t) => fuelValue(t.id) > 0 || t.id === ITEM_KEY.bucket);
    const o =
      !!e.output ||
      (0 === s && (0 === t.netWin || "crafting" === i)) ||
      (2 === s && /furnace|smoker|merchant/.test(i));
    return (
      !n && e.accept && 0 !== t.netWin && (n = e.accept),
      {
        x: e.x,
        y: e.y,
        v: s,
        output: o,
        accept: n,
        max: 0 === t.netWin && s >= 5 && s <= 8 ? 1 : e.max || 0,
        emptyIcon: e.emptyIcon,
        group: e.group,
        get: () => this.slotGet(t.netWin, s),
        set: (e) => this.slotSet(t.netWin, s, e),
      }
    );
  }
  click(t, e, s, i, n = () => this.predict(t, e, s, i)) {
    const o = this.g.ui,
      a = new Map(t.slots.map((t) => [t.v, t.get()]));
    if (n)
      try {
        n();
      } catch (t) {
        console.warn("net predict", t);
      }
    const r = [];
    for (const e of t.slots) {
      const t = a.get(e.v),
        s = e.get();
      t === s || sameStack(t, s) || r.push([e.v, netStack(s)]);
    }
    (this.send({
      t: "click",
      id: t.netWin,
      slot: e,
      button: s,
      mode: i,
      changed: r,
      carried: netStack(o.cursor),
    }),
      this.applyInv());
  }
  drag(t, e, s) {
    const i = 0 === s ? 0 : 4;
    this.click(t, -999, i, 5, null);
    for (const s of e) this.click(t, s.v, i + 1, 5, null);
    this.click(t, -999, i + 2, 5, () => {
      const t = this.g.ui,
        i = t.cursor;
      if (!i) return;
      const n = 0 === s ? Math.floor(i.count / e.length) : 1;
      if (n < 1) return;
      let o = i.count;
      for (const t of e) {
        const e = t.get();
        if ((e && !sameItem(e, i)) || !netMayPlace(t, i)) continue;
        const s = e ? e.count : 0,
          a = Math.min(n, netMax(t, i) - s, o);
        a <= 0 || (t.set({ ...(e || i), count: s + a }), (o -= a));
      }
      t.cursor = o > 0 ? { ...i, count: o } : null;
    });
  }
  predict(t, e, s, i) {
    const n = this.g.ui,
      o = n.cursor,
      a = e >= 0 ? t.slots.find((t) => t.v === e) : null,
      r = a && a.get(),
      cp = (t, e) => (e > 0 ? { ...t, count: e } : null);
    if (0 === i && -999 === e) return void (o && (n.cursor = 0 === s ? null : cp(o, o.count - 1)));
    const l = this.win;
    if (
      (a &&
        a.output &&
        r &&
        0 === i &&
        l &&
        "merchant" === l.kind &&
        l.trades &&
        l.trades[t.sel] &&
        (!o || (sameItem(o, r) && o.count + r.count <= netMax({}, r))) &&
        (l.trades[t.sel].used++, (l.offers = null)),
      a && !a.output)
    )
      if (0 === i) {
        if (0 === s) {
          if (r)
            if (o)
              if (sameItem(r, o)) {
                if (netMayPlace(a, o)) {
                  const t = Math.max(0, Math.min(o.count, netMax(a, r) - r.count));
                  (a.set(cp(r, r.count + t)), (n.cursor = cp(o, o.count - t)));
                }
              } else netMayPlace(a, o) && o.count <= netMax(a, o) && (a.set(o), (n.cursor = r));
            else ((n.cursor = r), a.set(null));
          else if (o && netMayPlace(a, o)) {
            const t = Math.min(o.count, netMax(a, o));
            (a.set(cp(o, t)), (n.cursor = cp(o, o.count - t)));
          }
        } else if (1 === s)
          if (o)
            r
              ? sameItem(r, o)
                ? netMayPlace(a, o) &&
                  r.count < netMax(a, r) &&
                  (a.set(cp(r, r.count + 1)), (n.cursor = cp(o, o.count - 1)))
                : netMayPlace(a, o) && o.count <= netMax(a, o) && (a.set(o), (n.cursor = r))
              : netMayPlace(a, o) && (a.set(cp(o, 1)), (n.cursor = cp(o, o.count - 1)));
          else if (r) {
            const t = Math.ceil(r.count / 2);
            ((n.cursor = cp(r, t)), a.set(cp(r, r.count - t)));
          }
      } else if (1 === i) this.predictQuickMove(t, a);
      else if (2 === i) {
        const i = 0 === t.netWin ? null : this.win,
          n = 40 === s ? (i ? null : 45) : i ? i.n + 27 + s : 36 + s;
        if (n === e) return;
        const o = null === n ? this.off : this.slotGet(t.netWin, n),
          hset = (e) => {
            null === n ? (this.off = e) : this.slotSet(t.netWin, n, e);
          };
        if (o) {
          if (r) netMayPlace(a, o) && o.count <= netMax(a, o) && (a.set(o), hset(r));
          else if (netMayPlace(a, o)) {
            const t = Math.min(o.count, netMax(a, o));
            (a.set(cp(o, t)), hset(cp(o, o.count - t)));
          }
        } else r && (hset(r), a.set(null));
      } else if (3 === i)
        "creative" === this.g.mode && r && !o && (n.cursor = cp(r, netMax({}, r)));
      else if (4 === i) r && !o && a.set(0 === s ? cp(r, r.count - 1) : null);
      else if (6 === i && o) {
        let e = o;
        const s = [...t.slots].sort((t, e) => t.v - e.v);
        for (let t = 0; t < 2; t++)
          for (const i of s) {
            if (e.count >= netMax({}, e)) break;
            const s = i.get();
            if (!s || i.output || !sameItem(s, e) || (0 === t && s.count >= netMax({}, s)))
              continue;
            const n = Math.min(s.count, netMax({}, e) - e.count);
            ((e = cp(e, e.count + n)), i.set(cp(s, s.count - n)));
          }
        n.cursor = e;
      }
  }
  predictQuickMove(t, e) {
    const s = t.netWin,
      i = e.get(),
      n = e.v;
    if (!i) return;
    const move = (s, i, n) => netMoveTo(t, e, s, i, n);
    if (0 === s) {
      const t = ITEMS[i.id].armor;
      return void (n >= 1 && n <= 8
        ? move(9, 45, !1)
        : !t || i.unk || this.slotGet(0, 5 + t.slot)
          ? n >= 9 && n < 36
            ? move(36, 45, !1)
            : n >= 36 && n < 45
              ? move(9, 36, !1)
              : 45 === n && move(9, 45, !1)
          : (this.slotSet(0, 5 + t.slot, { ...i, count: 1 }),
            e.set(i.count > 1 ? { ...i, count: i.count - 1 } : null)));
    }
    const o = this.win;
    o &&
      /^generic_|^shulker_box$|^hopper$/.test(o.kind) &&
      (n < o.n ? move(o.n, o.n + 36, !0) : move(0, o.n, !1));
  }
  tick() {
    const t = this.g,
      e = t.player;
    if (!e || "play" !== t.state) return;
    if (
      (e.inv.sel !== this.sentSel &&
        ((this.sentSel = e.inv.sel), this.send({ t: "held", slot: e.inv.sel })),
      "creative" === t.mode)
    )
      for (let t = 0; t <= 40; t++) {
        const s = e.inv.slots[t],
          i = 40 === t ? this.off : this.inv[t];
        sameStack(s, i) ||
          (40 === t ? (this.off = s ? { ...s } : null) : (this.inv[t] = s ? { ...s } : null),
          this.send({ t: "creative", slot: oursToWin(t), item: netStack(s) }));
      }
    else if (!(t.ui.screen instanceof ContainerScreen))
      for (let t = 0; t < 40; t++)
        if (!sameStack(e.inv.slots[t], this.inv[t])) {
          this.applyInv();
          break;
        }
    if (!e.loadedHere() && !this.posDue) return void this.send({ t: "tick" });
    this.posDue = !1;
    const s = t.ui.screen ? null : t.readInput(),
      i = s && {
        f: s.fwd > 0,
        b: s.fwd < 0,
        l: s.strafe < 0,
        r: s.strafe > 0,
        j: s.jump,
        s: s.sneak,
        sp: !!e.sprinting,
      },
      n = e.vehicle;
    if (n) {
      const t = n instanceof Boat;
      return void this.send({
        t: "tick",
        look: [fromYaw(e.yaw), -e.pitch * R2D],
        keys: i,
        vmove:
          t || (n.vm && n.ridden)
            ? [n.pos[0], n.pos[1] + this.minY, n.pos[2], fromYaw(n.yaw), 0, n.onGround]
            : null,
        paddles: t && s ? [s.fwd > 0 || s.strafe > 0, s.fwd > 0 || s.strafe < 0] : null,
      });
    }
    this.send({
      t: "tick",
      pos: [
        e.pos[0],
        e.pos[1] + this.minY,
        e.pos[2],
        fromYaw(e.yaw),
        -e.pitch * R2D,
        e.onGround,
        e.collidedH,
      ],
      keys: i,
    });
  }
  drop(t) {
    const e = this.g.player,
      s = e.inv.sel,
      i = e.inv.slots[s];
    if (!i) return;
    this.send({ t: "drop", all: t });
    const n = t ? 0 : i.count - 1;
    ((e.inv.slots[s] = n > 0 ? { ...i, count: n } : null),
      (this.inv[s] = e.inv.slots[s] ? { ...e.inv.slots[s] } : null));
  }
  dig(t, e) {
    (this.send({
      t: "dig",
      status: t,
      x: e.pos[0],
      y: e.pos[1] + this.minY,
      z: e.pos[2],
      face: NET_FACE[e.face] ?? 1,
    }),
      (this.digging = 0 === t ? { key: e.pos.join(","), t: e } : null));
  }
  chat(t) {
    this.send({ t: "chat", text: t });
  }
  drawNames(t) {
    const e = this.g;
    for (const s of e.entities) {
      if (!(s instanceof NetPlayer) || s.dead || s.invisible) continue;
      const i = s.netSwim || s.gliding ? 0.6 : s.sneaking ? 1.5 : s.h;
      e.drawNameTag(s, s.ipos(t), s.name, {
        color: (this.colors && this.colors.get(s.name)) || "#FFFFFF",
        max: 64,
        h: i,
        through: !s.sneaking,
        faded: s.sneaking,
      });
    }
  }
}
const NET_OUTPUT = {
    anvil: 2,
    grindstone: 2,
    smithing: 3,
    cartography_table: 2,
    stonecutter: 1,
    loom: 3,
  },
  NET_STATION = {
    enchantment(t, e) {
      const s = e.props,
        i = new EnchantingScreen(t.g, null, e.title);
      return (
        (i.changed = () => {}),
        Object.defineProperty(i, "offers", {
          get: () =>
            [0, 1, 2].map((t) =>
              s[t] > 0
                ? {
                    cost: s[t],
                    clue:
                      s[4 + t] >= 0 && e.pnames && e.pnames[4 + t]
                        ? [e.pnames[4 + t], s[7 + t]]
                        : null,
                  }
                : null,
            ),
        }),
        Object.defineProperty(i, "seed", { get: () => s[3] || 0 }),
        (i.pick = (s) => {
          i.usable(s) && t.send({ t: "button", id: e.id, b: s });
        }),
        i
      );
    },
    anvil(t, e) {
      const s = e.props,
        i = new AnvilScreen(t.g, null, e.title);
      return (
        (i.changed = () => {}),
        Object.defineProperty(i, "res", {
          get: () =>
            s[0] > 0
              ? { cost: s[0], tooExpensive: s[0] >= 40 && !t.g.player.creative, stack: i.S(2) }
              : null,
        }),
        (i.netLeft = (e) => {
          const s = e ? e.id + "|" + (e.name || "") : "";
          if (s === i.leftKey) return;
          ((i.leftKey = s), (i.name = e ? e.name || ITEMS[e.id].cn : ""));
          const n = t.g.ui.input;
          n && (n.value = i.name);
        }),
        (i.onName = (e) => t.send({ t: "rename", name: e })),
        (i.onNetClose = () => t.g.ui.hideInput()),
        i
      );
    },
    grindstone: (t, e) => new GrindstoneScreen(t.g, null, e.title),
    stonecutter(t, e) {
      const s = e.props,
        i = new StonecutterScreen(t.g, null, e.title);
      return (
        (i.changed = () => {}),
        Object.defineProperty(i, "sel", { get: () => s[0] ?? -1, set: () => {} }),
        (i.pick = (s) => {
          (t.send({ t: "button", id: e.id, b: s }),
            Sound.ev("ui.stonecutter.select_recipe", null, 1, 1));
        }),
        i
      );
    },
    smithing: (t, e) => new SmithingScreen(t.g, null, e.title),
    loom(t, e) {
      const s = e.props,
        i = new LoomScreen(t.g, null, e.title);
      return (
        (i.changed = () => {}),
        Object.defineProperty(i, "sel", { get: () => s[0] ?? -1, set: () => {} }),
        (i.pick = (s) => t.send({ t: "button", id: e.id, b: s })),
        i
      );
    },
    cartography_table(t, e) {
      const s = new CartographyScreen(t.g, null, e.title),
        i = s.drawMore;
      return (
        (s.drawMore = function (t) {
          (this.changed(), i.call(this, t));
        }),
        s
      );
    },
    brewing_stand(t, e) {
      const s = e.props,
        i = {
          get brewTime() {
            return s[0] || 0;
          },
          get fuelLeft() {
            return s[1] || 0;
          },
          bottles: [],
          ingredient: null,
          fuel: null,
        };
      return new BrewingScreen(t.g, i, e.title);
    },
  },
  netMayPlace = (t, e) => !t.output && (!t.accept || t.accept(e)),
  netMax = (t, e) => Math.min(t.max || 99, e.unk ? 64 : maxStack(e.id));
function netMoveTo(t, e, s, i, n) {
  let o = e.get();
  const a = t.slots
    .filter((t) => t.v >= s && t.v < i && t !== e)
    .sort((t, e) => (n ? e.v - t.v : t.v - e.v));
  if (netMax({}, o) > 1)
    for (const t of a) {
      const e = t.get();
      if (!e || !sameItem(e, o) || e.count >= netMax(t, e)) continue;
      const s = Math.min(o.count, netMax(t, e) - e.count);
      if (
        (t.set({ ...e, count: e.count + s }),
        (o = o.count - s > 0 ? { ...o, count: o.count - s } : null),
        !o)
      )
        break;
    }
  if (o)
    for (const t of a) {
      if (t.get() || !netMayPlace(t, o)) continue;
      const e = Math.min(o.count, netMax(t, o));
      (t.set({ ...o, count: e }), (o = o.count - e > 0 ? { ...o, count: o.count - e } : null));
      break;
    }
  e.set(o);
}
const NET_SCREEN = {
    mouseDown(t, e, s, i, n) {
      const o = this.net,
        a = 2 === i ? 1 : 1 === i ? 2 : 0;
      if ((Sound.init(), this.offerAt)) {
        const t = this.offerAt(e, s);
        if (t >= 0) return void this.pick(t);
      }
      const r = this.slotAt(e, s);
      if (!r) return void (t.cursor && a < 2 && this.outside(e, s) && o.click(this, -999, a, 0));
      if (2 === a)
        return void (
          "creative" === this.game.mode &&
          !t.cursor &&
          r.get() &&
          o.click(this, r.v, 2, 3)
        );
      const l = performance.now(),
        h = this.lastClick;
      return (
        (this.lastClick = { t: l, v: r.v, b: a }),
        0 === a && !n && t.cursor && h && h.v === r.v && 0 === h.b && l - h.t < 250
          ? ((this.lastClick = null), void o.click(this, r.v, 0, 6))
          : n
            ? void o.click(this, r.v, a, 1)
            : !t.cursor || r.output || (r.get() && !sameItem(r.get(), t.cursor))
              ? void o.click(this, r.v, a, 0)
              : ((this.dragSlots = new Set([r])), void (this.dragButton = a))
      );
    },
    mouseMove(t, e, s) {
      if (!this.dragSlots || !t.mouse.down || !t.cursor) return;
      const i = this.slotAt(e, s),
        n = t.cursor;
      i &&
        !i.output &&
        (!i.get() || sameItem(i.get(), n)) &&
        netMayPlace(i, n) &&
        this.dragSlots.size < n.count &&
        this.dragSlots.add(i);
    },
    mouseUp(t) {
      if (!this.dragSlots) return;
      const e = [...this.dragSlots],
        s = this.dragButton;
      ((this.dragSlots = null),
        1 === e.length
          ? this.net.click(this, e[0].v, s, 0)
          : t.cursor && this.net.drag(this, e, s));
    },
    key(t, e) {
      const s = bindingsFor(this.game, e.code),
        i = this.slotAt(t.mouse.x, t.mouse.y),
        n = this.net,
        o = s.find((t) => t.startsWith("hotbar."));
      return (
        !s.includes("inventory") &&
        (o
          ? (i && !t.cursor && n.click(this, i.v, +o.slice(7) - 1, 2), !0)
          : s.includes("swapOffhand")
            ? (i && !t.cursor && n.click(this, i.v, 40, 2), !0)
            : !!s.includes("drop") &&
              (i && !t.cursor && i.get() && n.click(this, i.v, e.ctrlKey ? 1 : 0, 4), !0))
      );
    },
    close() {
      const t = this.net;
      ((this.game.ui.cursor = null),
        this.serverClosed || t.send({ t: "wclose", id: this.netWin }),
        this.netWin && t.win && t.win.id === this.netWin && (t.win = null));
    },
    quickMove(t) {
      this.net.click(this, t.v, 0, 1);
    },
  },
  NET_ENCH_CN = {
    protection: "保护",
    fire_protection: "火焰保护",
    feather_falling: "摔落缓冲",
    blast_protection: "爆炸保护",
    projectile_protection: "弹射物保护",
    respiration: "水下呼吸",
    aqua_affinity: "水下速掘",
    thorns: "荆棘",
    depth_strider: "深海探索者",
    frost_walker: "冰霜行者",
    binding_curse: "绑定诅咒",
    soul_speed: "灵魂疾行",
    swift_sneak: "迅捷潜行",
    sharpness: "锋利",
    smite: "亡灵杀手",
    bane_of_arthropods: "节肢杀手",
    knockback: "击退",
    fire_aspect: "火焰附加",
    looting: "抢夺",
    sweeping_edge: "横扫之刃",
    efficiency: "效率",
    silk_touch: "精准采集",
    unbreaking: "耐久",
    fortune: "时运",
    power: "力量",
    punch: "冲击",
    flame: "火矢",
    infinity: "无限",
    luck_of_the_sea: "海之眷顾",
    lure: "饵钓",
    loyalty: "忠诚",
    impaling: "穿刺",
    riptide: "激流",
    channeling: "引雷",
    multishot: "多重射击",
    quick_charge: "快速装填",
    piercing: "穿透",
    density: "致密",
    breach: "破甲",
    wind_burst: "风爆",
    mending: "经验修补",
    vanishing_curse: "消失诅咒",
    lunge: "突进",
  },
  NET_ENCH_ONE = new Set([
    "aqua_affinity",
    "binding_curse",
    "channeling",
    "flame",
    "infinity",
    "mending",
    "multishot",
    "silk_touch",
    "vanishing_curse",
  ]),
  NET_POTION_CN = {
    night_vision: "夜视",
    invisibility: "隐身",
    leaping: "跳跃提升",
    fire_resistance: "抗火",
    swiftness: "迅捷",
    slowness: "缓慢",
    turtle_master: "神龟",
    water_breathing: "水肺",
    healing: "治疗",
    harming: "伤害",
    poison: "剧毒",
    regeneration: "再生",
    strength: "力量",
    weakness: "虚弱",
    luck: "幸运",
    slow_falling: "缓降",
    wind_charged: "蓄风",
    weaving: "盘丝",
    oozing: "渗浆",
    infested: "寄生",
  },
  NET_POTION_PLAIN = {
    water: "水瓶",
    mundane: "平凡的药水",
    thick: "浑浊的药水",
    awkward: "粗制的药水",
  },
  romanNum = (t) =>
    ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][t] || String(t);
function netItemLines(t, e) {
  if (t.pot) {
    const s = t.pot.replace(/^(long|strong)_/, ""),
      i = NET_POTION_CN[s],
      n = t.unk || ITEMS[t.id].key,
      o = "splash_potion" === n ? "喷溅型" : "lingering_potion" === n ? "滞留型" : "";
    ((e[0].text = NET_POTION_PLAIN[s]
      ? o + NET_POTION_PLAIN[s]
      : i
        ? "tipped_arrow" === n
          ? i + "之箭"
          : o + i + "药水"
        : e[0].text),
      i
        ? e.splice(1, 0, {
            text:
              i +
              (t.pot.startsWith("strong_") ? " II" : "") +
              (t.pot.startsWith("long_") ? "（延长）" : ""),
            color: "#5555FF",
          })
        : e.splice(1, 0, { text: "无效果", color: "#AAAAAA" }));
  }
  if (
    (t.e &&
      t.e.length &&
      ("#FFFFFF" === e[0].color && (e[0].color = "#55FFFF"),
      e.splice(
        1,
        0,
        ...t.e.map(([t, e]) => ({
          text: (NET_ENCH_CN[t] || t) + (NET_ENCH_ONE.has(t) && 1 === e ? "" : " " + romanNum(e)),
          color: /curse/.test(t) ? "#FF5555" : "#AAAAAA",
        })),
      )),
    t.name && (e[0].text = t.name),
    t.lore && "undefined" != typeof Legacy)
  )
    for (const s of t.lore)
      e.push({ text: Legacy.strip(s) || " ", color: Legacy.first(s, "#AA00AA") });
  return e;
}
Game.prototype.netInteraction = function () {
  const t = this.player,
    e = this.net;
  if ((this.useCd > 0 && this.useCd--, this.attackCd > 0 && this.attackCd--, t.usingItem)) {
    const s = "off" === t.useHand ? t.inv.slots[40] : t.inv.held;
    if (this.mouseBtn[2] && s && s.id === t.usingItem) {
      t.useT++;
      const e = ITEMS[s.id];
      (e.food && t.useT % 4 == 0 && t.useT > 6 && (Sound.eat(t.pos), this.foodParticles(s.id)),
        e.food && t.useT >= 52 && ((t.usingItem = null), (t.useT = 0)));
    } else (e.send({ t: "release" }), (t.usingItem = null), (t.useT = 0), (t.useHand = null));
  }
  const s =
      "function" == typeof isSpear &&
      t.inv.held &&
      ITEMS[t.inv.held.id] &&
      isSpear(ITEMS[t.inv.held.id].key),
    i = s && this.attackStrength(0.1) < 1;
  if ((!this.mouseBtn[0] && !this.mouseClicked0) || t.usingItem) this.breaking = null;
  else if (this.targetEntity) {
    const s = this.targetEntity;
    (this.mouseClicked0 &&
      this.attackCd <= 0 &&
      null != s.netId &&
      !i &&
      (e.send({ t: "attack", id: s.netId }),
      e.send({ t: "swing" }),
      t.swing(),
      (t.attackT = 0),
      (this.attackCd = 4)),
      (this.breaking = null));
  } else if (this.target && s)
    ((this.breaking = null),
      this.mouseClicked0 && !i && (t.swing(), e.send({ t: "swing" }), (t.attackT = 0)));
  else if (this.target) {
    const s = this.target,
      i = s.pos.join(","),
      n = BLOCKS[s.id];
    if ("creative" === this.mode) {
      if (this.attackCd <= 0) {
        const i = t.inv.held;
        ((i && ITEMS[i.id].tool && "sword" === ITEMS[i.id].tool.type) ||
          (e.dig(0, s), (e.digging = null), this.netBreak(s.pos)),
          (this.attackCd = 5),
          t.swing(),
          e.send({ t: "swing" }));
      }
    } else
      ((this.breaking && this.breaking.key === i) ||
        ((this.breaking = { key: i, pos: s.pos, progress: 0, id: s.id }), e.dig(0, s)),
        n.hardness >= 0 &&
          this.attackCd <= 0 &&
          ((this.breaking.progress += this.breakSpeed(s.id)),
          t.swing(),
          this.tickCount % 4 == 0 &&
            (e.send({ t: "swing" }),
            Sound.block("hit", n.sound, [s.pos[0] + 0.5, s.pos[1] + 0.5, s.pos[2] + 0.5]),
            this.particles.blockHit(...s.pos, s.face, s.id, this.world.getMeta(...s.pos))),
          this.breaking.progress >= 1 &&
            (e.dig(2, s), this.netBreak(s.pos), (this.breaking = null), (this.attackCd = 5))));
  } else
    ((this.breaking = null),
      this.mouseClicked0 && !i && (t.swing(), e.send({ t: "swing" }), s && (t.attackT = 0)));
  (!e.digging ||
    (this.breaking && this.breaking.key === e.digging.key) ||
    (e.dig(1, e.digging.t), (e.digging = null)),
    (this.mouseClicked0 = !1),
    (this.mouseBtn[2] || this.useClicked) && this.useCd <= 0 && !t.usingItem && this.netUse(),
    (this.useClicked = !1));
};
const NET_USE_ON_PASS =
  /^(snowball|egg|blue_egg|brown_egg|ender_pearl|splash_potion|lingering_potion|experience_bottle|ender_eye|wind_charge|fishing_rod|bucket|water_bucket|lava_bucket|(cod|salmon|pufferfish|tropical_fish|axolotl|tadpole)_bucket|map|bundle|\w+_bundle|elytra|crossbow|knowledge_book|turtle_helmet|\w+_(helmet|chestplate|leggings|boots))$/;
((Game.prototype.netUse = function () {
  const t = this.player,
    e = this.net,
    s = t.inv.held,
    i = s && ITEMS[s.id],
    n = this.target;
  this.useCd = 4;
  const heldUse = (t, e) =>
      !(
        !e ||
        (!e.food &&
          !/^(bow|potion|milk_bucket|honey_bottle|shield|trident|crossbow|spyglass|goat_horn|brush)$|_spear$/.test(
            e.key,
          )) ||
        ("crossbow" === e.key && t.charged)
      ),
    o = heldUse(s, i),
    a = t.inv.slots[40],
    r = a && ITEMS[a.id],
    l = heldUse(a, r),
    h = n && !this.targetEntity && BLOCKS[n.id],
    c = !(!h || !(h.onUse || h.door || h.trapdoor || h.gate || h.bed)),
    p = !(
      o ||
      (i && (NET_USE_ON_PASS.test(i.key) || /_(boat|raft)$/.test(i.key))) ||
      this.mainHandBusy(s, i) ||
      (i &&
        i.tool &&
        h &&
        (() => {
          const e = i.tool.type,
            s = h.key,
            [o, a, l] = n.pos,
            c = this.world,
            p = !c.getBlock(o, a + 1, l);
          if ("axe" === e) {
            const e = copperInfo(s);
            return (
              !(r && "shield" === r.key && !t.sneaking) &&
              ((STRIP.test(s) && !s.startsWith("stripped_") && void 0 !== BID["stripped_" + s]) ||
                !(!e || !(e.waxed || e.stage > 0)))
            );
          }
          return "shovel" === e
            ? 2 !== n.face &&
                ((PATHABLE.has(s) && p) ||
                  (/campfire$/.test(s) &&
                    "true" === Features.propOf(n.id, c.getMeta(o, a, l), "lit")))
            : "hoe" === e &&
                ("rooted_dirt" === s ||
                  (/^(grass_block|dirt|dirt_path|coarse_dirt)$/.test(s) && 2 !== n.face && p));
        })())
    ),
    u =
      !!r &&
      p &&
      (l || NET_USE_ON_PASS.test(r.key) || "firework_rocket" === r.key) &&
      !(c && !t.sneaking);
  if (this.targetEntity && null != this.targetEntity.netId) {
    const s = this.targetEntity;
    e.send({ t: "interact", id: s.netId, x: 0, y: s.h / 2, z: 0, sneak: t.sneaking });
    const n =
      /^(villager|wandering_trader|horse|donkey|mule|llama|trader_llama|camel|camel_husk|zombie_horse|skeleton_horse)$/.test(
        s.type,
      )
        ? !s.baby
        : /^(pig|strider)$/.test(s.type)
          ? !!s.saddled && !s.baby
          : /^(wolf|cat|parrot|nautilus|zombie_nautilus)$/.test(s.type)
            ? !!s.owner
            : "happy_ghast" === s.type
              ? !!s.harness
              : "allay" === s.type
                ? !!s.hand
                : "copper_golem" === s.type && !(!i || !i.tool || "axe" !== i.tool.type);
    if (!(u && (!i || i.tool || i.attack) && s instanceof Mob) || n)
      return (t.swing(), void e.send({ t: "swing" }));
  }
  if (i && /^(writable_book|written_book)$/.test(i.key) && (!n || "lectern" !== BLOCKS[n.id].key))
    return void this.ui.open(new BookScreen(this, s, "writable_book" === i.key));
  const d = !!i && /_(boat|raft)$/.test(i.key);
  if (u && ("firework_rocket" !== r.key || !n || this.targetEntity || t.gliding))
    return (
      e.send({ t: "use", hand: "off", yaw: fromYaw(t.yaw), pitch: -t.pitch * R2D }),
      void (
        l &&
        (!r.food || t.food < 20 || "creative" === this.mode || "golden_apple" === r.key) &&
        ((t.usingItem = a.id), (t.useHand = "off"), (t.useT = 0))
      )
    );
  if (n && !d && (!o || (BLOCKS[n.id].onUse && !t.sneaking))) {
    const o = n.point || [n.pos[0] + 0.5, n.pos[1] + 0.5, n.pos[2] + 0.5];
    e.send({
      t: "place",
      x: n.pos[0],
      y: n.pos[1] + e.minY,
      z: n.pos[2],
      face: NET_FACE[n.face] ?? 1,
      cx: clamp(o[0] - n.pos[0], 0, 1),
      cy: clamp(o[1] - n.pos[1], 0, 1),
      cz: clamp(o[2] - n.pos[2], 0, 1),
    });
    if (
      i &&
      NET_USE_ON_PASS.test(i.key) &&
      !(BLOCKS[n.id].onUse && !t.sneaking) &&
      !("ender_eye" === i.key && "end_portal_frame" === BLOCKS[n.id].key)
    )
      return (
        e.send({ t: "use", yaw: fromYaw(t.yaw), pitch: -t.pitch * R2D }),
        t.swing(),
        void e.send({ t: "swing" })
      );
    const a = !(
      !r ||
      (void 0 === r.block && !r.places && "firework_rocket" !== r.key) ||
      r.armor ||
      !p ||
      (c && !t.sneaking)
    );
    return (
      a &&
        e.send({
          t: "place",
          hand: "off",
          x: n.pos[0],
          y: n.pos[1] + e.minY,
          z: n.pos[2],
          face: NET_FACE[n.face] ?? 1,
          cx: clamp(o[0] - n.pos[0], 0, 1),
          cy: clamp(o[1] - n.pos[1], 0, 1),
          cz: clamp(o[2] - n.pos[2], 0, 1),
        }),
      a && t.swingOff ? t.swingOff() : s && t.swing(),
      void e.send(a ? { t: "swing", hand: "off" } : { t: "swing" })
    );
  }
  i &&
    (e.send({ t: "use", yaw: fromYaw(t.yaw), pitch: -t.pitch * R2D }),
    o && (!i.food || t.food < 20 || "creative" === this.mode || "golden_apple" === i.key)
      ? ((t.usingItem = s.id), (t.useHand = "main"), (t.useT = 0))
      : t.swing());
}),
  (Game.prototype.netBreak = function (t) {
    const e = this.world,
      [s, i, n] = t,
      o = e.getBlock(s, i, n);
    if (!o || IS_FLUID[o]) return;
    const a = BLOCKS[o];
    (Sound.block("break", a.sound, [s + 0.5, i + 0.5, n + 0.5]),
      this.particles.blockBreak(s, i, n, o, e.getMeta(s, i, n)),
      e.setBlock(s, i, n, WLOG[o] ? WATER : 0, 0, 0),
      this.flushMesh());
  }),
  (Game.prototype.joinServer = function (t, e) {
    (this.world && (this.unloadAll(), (this.world = null)),
      (this.net = new NetClient(this, t, e)),
      this.ui.open(new LoadingScreen(this, "正在连接…")));
  }),
  (Game.prototype.leaveServer = function () {
    const t = this.net;
    t && ((this.net = null), t.close(), this.startTitle());
  }),
  (Game.prototype.netTick = function () {
    const t = this.player;
    for (const t of this.entities) t.dead || this.tickEntity(t);
    ((this.entities = this.entities.filter((t) => !t.dead)),
      this.guard("particles", () => this.particles.tick()));
    const e = t.pos[1] + t.eye(),
      s = this.world.getBlock(Math.floor(t.pos[0]), Math.floor(e), Math.floor(t.pos[2]));
    ((this.headInWater = this.world.waterAt(
      Math.floor(t.pos[0]),
      Math.floor(e),
      Math.floor(t.pos[2]),
    )),
      (this.headInLava = s === LAVA),
      this.guard("ambient sounds", () => this.ambientSounds()),
      (this.weather += clamp(this.rainTarget - this.weather, -0.01, 0.01)),
      this.net.tick(),
      (Sound.listener = { x: t.pos[0], y: t.pos[1] + 1.6, z: t.pos[2], yaw: t.yaw }));
  }));
const RoomService = {
  base() {
    const t = new URLSearchParams(location.search).get("rooms");
    return !t && /^(localhost|127\.|\[::1\])|\.(localhost|test)$/.test(location.hostname)
      ? ""
      : String(t || (window.NET_CONFIG && NET_CONFIG.rooms) || "").replace(/\/+$/, "");
  },
  ws() {
    return this.base().replace(/^http/, "ws") + "/ws";
  },
  key() {
    const make = () =>
      [...crypto.getRandomValues(new Uint8Array(16))]
        .map((t) => t.toString(16).padStart(2, "0"))
        .join("");
    try {
      let t = localStorage.getItem("mcjs-room-key");
      return (t || ((t = make()), localStorage.setItem("mcjs-room-key", t)), t);
    } catch (t) {
      return this._k || (this._k = make());
    }
  },
  upload(t, e, s) {
    return new Promise((i, n) => {
      const o = new XMLHttpRequest();
      (o.open("POST", this.base() + t),
        o.setRequestHeader("Content-Type", "text/plain"),
        (o.upload.onprogress = (t) => {
          t.lengthComputable && s && s(t.loaded / t.total);
        }),
        (o.onload = () => {
          let t = null;
          try {
            t = JSON.parse(o.responseText);
          } catch (t) {}
          200 === o.status && t && !t.error
            ? i(t)
            : n(new Error((t && t.error) || "HTTP " + o.status));
        }),
        (o.onerror = () => n(new Error("游戏正在更新中…请稍后"))),
        o.send(e));
    });
  },
  async api(t, e) {
    let s;
    try {
      s = await fetch(this.base() + t, e ? { method: "POST", body: JSON.stringify(e) } : {});
    } catch (t) {
      throw new Error("游戏正在更新中…请稍后");
    }
    const i = await s.json().catch(() => ({ error: "游戏正在更新中…请稍后" }));
    if (!s.ok || (i && i.error)) throw new Error((i && i.error) || "HTTP " + s.status);
    return i;
  },
  link(t) {
    const e = (window.NET_CONFIG && NET_CONFIG.share) || location.origin + location.pathname;
    return e + (e.includes("?") ? "&" : "?") + "room=" + t;
  },
  fromUrl() {
    const t = new URLSearchParams(location.search).get("room");
    return t
      ? t
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 8)
      : "";
  },
};
((Game.prototype.joinRoom = function (t, e) {
  (this.world && (this.unloadAll(), (this.world = null)),
    (this.net = new NetClient(this, RoomService.ws(), e, { room: t, key: RoomService.key() })),
    this.ui.open(new LoadingScreen(this, "正在连接房间 " + t + "…")));
}),
  (() => {
    const t = Game.prototype.startTitle;
    Game.prototype.startTitle = function (...e) {
      const s = t.apply(this, e);
      return (
        !this.roomLinkUsed &&
          RoomService.fromUrl() &&
          ((this.roomLinkUsed = !0),
          setTimeout(() => {
            "title" === this.state && this.ui.open(new MultiplayerScreen(this, null));
          }, 400)),
        s
      );
    };
  })());
class FormScreen extends MenuScreen {
  constructor(t, e, s) {
    (super(t, e),
      (this.parent = s),
      (this.titleY = 20),
      (this.fields = {}),
      (this.field = null),
      (this.note = ""),
      (this.noteColor = "#A0A0A0"));
  }
  addField(t, e, s, i, n, o, a) {
    this.fields[t] = { x: e, y: s, w: i, h: 20, label: n, max: o, filter: a };
  }
  focus(t) {
    const e = this.game.ui,
      s = this.fields[t];
    s &&
      ((this.field = t),
      e.showInput(s.x + 4, s.y + 6, s.w - 8, 10, this[t], () => this.submit(), {
        onInput: (e) => {
          this[t] = s.filter ? s.filter(e) : e;
        },
        onEsc: () => this.onEsc(),
        max: s.max,
      }));
  }
  submit() {}
  mouseDown(t, e, s, i) {
    for (const t in this.fields) {
      const i = this.fields[t];
      if (e >= i.x && e < i.x + i.w && s >= i.y && s < i.y + i.h) return void this.focus(t);
    }
    super.mouseDown(t, e, s, i);
  }
  drawFields(t) {
    const e = t.ctx;
    for (const s in this.fields) {
      const i = this.fields[s];
      (Font.draw(e, i.label, i.x, i.y - 11, "#A0A0A0"),
        t.nine(this.field === s ? "text_field_hl" : "text_field", i.x, i.y, i.w, i.h, 1),
        this.field !== s && Font.draw(e, String(this[s] || ""), i.x + 4, i.y + 6, "#E0E0E0"));
    }
    this.note && Font.center(e, this.note, t.w / 2, t.h - 52, this.noteColor);
  }
  say(t, e) {
    ((this.note = t), (this.noteColor = e ? "#FF6060" : "#A0A0A0"));
  }
  back() {
    (this.game.ui.hideInput(), this.game.ui.open(this.parent || new TitleScreen(this.game)));
  }
  onEsc() {
    this.back();
  }
}
const nameOnly = (t) => t.replace(/[^A-Za-z0-9_]/g, "").slice(0, 16),
  codeOnly = (t) =>
    t
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8),
  GM_CN = { survival: "生存", creative: "创造", adventure: "冒险", spectator: "旁观" },
  fitText = (t, e) => {
    if (((t = String(t)), Font.width(t) <= e)) return t;
    for (; t.length && Font.width(t + "…") > e;) t = t.slice(0, -1);
    return t + "…";
  },
  roomAge = (t) => {
    if (!t) return "";
    const e = Math.floor((Date.now() - t) / 6e4);
    return e < 60 ? `${e} 分钟` : `${Math.floor(e / 60)} 小时 ${e % 60} 分`;
  };
class MultiplayerScreen extends FormScreen {
  constructor(t, e) {
    super(t, "多人游戏", e);
    const s = t.settings;
    ((this.name =
      ("undefined" != typeof Account && Account.loggedIn && Account.name) ||
      s.netName ||
      "Steve" + Math.floor(900 * Math.random() + 100)),
      (this.code = RoomService.fromUrl() || ""),
      (this.list = null),
      (this.page = 0),
      (this.cap = null),
      RoomService.base() ||
        this.say(
          "http:" === location.protocol
            ? "没有配置房间服务（js/netconfig.js）：可以用下面的“直接连接”"
            : "还没有配置联机服务器地址（js/netconfig.js）",
          !0,
        ),
      (this.field = this.code ? "name" : null),
      this.load());
  }
  async load() {
    if (RoomService.base()) {
      this.loading = !0;
      try {
        const t = await RoomService.api("/api/public");
        ((this.list = t.rooms || []),
          (this.cap = t.capacity || null),
          (this.maint = t.maintenance || null));
      } catch (t) {
        ((this.list = []), this.say(t.message, !0));
      }
      ((this.loading = !1), this.game.ui.screen === this && this.layout());
    }
  }
  rows() {
    return Math.max(2, Math.floor((this.game.ui.h - 82 - 62) / 24));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      s = this.rows(),
      i = this.list || [];
    ((this.fields = {}),
      "undefined" != typeof Account && Account.loggedIn
        ? (this.name = Account.name)
        : this.addField("name", e - 152, 42, 148, "你的名字（英文、数字、下划线）", 16, nameOnly),
      this.addField("code", e + 4, 42, 98, "邀请码", 8, codeOnly));
    const n = Math.max(1, Math.ceil(i.length / s));
    ((this.page = clamp(this.page, 0, n - 1)),
      (this.widgets = [
        { x: e + 106, y: 42, w: 46, h: 20, label: "加入", onClick: () => this.submit() },
        {
          x: e + 106,
          y: 66,
          w: 22,
          h: 14,
          label: "<",
          enabled: this.page > 0,
          onClick: () => {
            (this.page--, this.layout());
          },
        },
        {
          x: e + 130,
          y: 66,
          w: 22,
          h: 14,
          label: ">",
          enabled: this.page < n - 1,
          onClick: () => {
            (this.page++, this.layout());
          },
        },
      ]),
      i.slice(this.page * s, this.page * s + s).forEach((t, s) => {
        const i = t.players >= t.max,
          n = "undefined" != typeof Account && !(!Account.data || !Account.data.super),
          o =
            "undefined" != typeof Account &&
            !!Account.name &&
            String(t.owner || "").toLowerCase() === Account.name.toLowerCase();
        (this.widgets.push({
          x: e + 106,
          y: 84 + 24 * s,
          w: 46,
          h: 20,
          label: !i || n || o ? "进入" : "已满",
          enabled: !i || n || o,
          gold: i && n && !o,
          blue: o,
          tip: [
            t.name,
            `房主 ${t.owner}，${t.players}/${t.max} 人，${GM_CN[t.gamemode] || ""}`,
          ].concat(o ? ["你的房间：满员了也能进"] : i && n ? ["满员了，管理员可以进"] : []),
          onClick: () => this.join(t.code),
        }),
          n &&
            this.widgets.push({
              x: e + 76,
              y: 84 + 24 * s,
              w: 28,
              h: 20,
              label: "管理",
              gold: !0,
              tip: ["管理员：关闭这个房间的服务器、删除房间、封禁里面的玩家"],
              onClick: () => {
                (this.game.ui.hideInput(),
                  this.game.ui.open(new AdminRoomScreen(this.game, this, t.code)));
              },
            }));
      }),
      this.widgets.push(
        {
          x: e - 152,
          y: t.h - 52,
          w: 98,
          h: 20,
          label: "创建房间",
          onClick: () => this.go(CreateRoomScreen),
        },
        {
          x: e - 50,
          y: t.h - 52,
          w: 98,
          h: 20,
          label: "我的房间",
          onClick: () => this.go(MyRoomsScreen),
        },
        {
          x: e + 52,
          y: t.h - 52,
          w: 100,
          h: 20,
          label: this.loading ? "正在刷新…" : "刷新列表",
          onClick: () => {
            ((this.list = null), this.layout(), this.load());
          },
        },
        { x: e - 152, y: t.h - 28, w: 150, h: 20, label: "返回", onClick: () => this.back() },
      ),
      "http:" === location.protocol &&
        this.widgets.push({
          x: e + 2,
          y: t.h - 28,
          w: 150,
          h: 20,
          label: "直接连接（局域网）",
          onClick: () => {
            (this.game.ui.hideInput(), this.game.ui.open(new DirectConnectScreen(this.game, this)));
          },
        }),
      this.field && this.focus(this.field));
  }
  okName() {
    const t =
      "undefined" != typeof Account && Account.loggedIn && Account.name
        ? Account.name
        : nameOnly(this.name);
    if (t.length < 1) return (this.say("先输入名字", !0), this.focus("name"), null);
    const e = this.game;
    return ((e.settings.netName = t), e.saveSettings(), t);
  }
  go(t) {
    const e = this.okName();
    e && (this.game.ui.hideInput(), this.game.ui.open(new t(this.game, this, e)));
  }
  join(t) {
    const e = this.okName();
    e && RoomService.base() && (this.game.ui.hideInput(), this.game.joinRoom(t, e));
  }
  submit() {
    const t = codeOnly(this.code);
    if (t.length < 4)
      return (
        this.say("输入朋友给你的邀请码，或者从下面的公开房间里选一个", !0),
        void this.focus("code")
      );
    this.join(t);
  }
  drawExtra(t) {
    const e = t.ctx,
      s = t.w / 2,
      i = this.rows(),
      n = this.list || [],
      o = this.note;
    ((this.note = ""),
      this.drawFields(t),
      (this.note = o),
      "undefined" != typeof Account &&
        Account.loggedIn &&
        (Font.draw(e, "你的名字", s - 152, 31, "#A0A0A0"),
        Font.draw(e, fitText(Account.name, 146), s - 150, 48, "#FFFFFF")),
      Font.draw(e, "公开房间" + (n.length ? `（${n.length}）` : ""), s - 152, 69, "#FFFFFF"),
      this.maint && Font.draw(e, this.maint, s - 80, 69, "#FF5555"),
      this.list
        ? n.length || Font.center(e, "现在还没有公开房间，创建一个吧", s, 100, "#A0A0A0")
        : Font.center(e, "正在读取公开房间…", s, 100, "#A0A0A0"),
      n.slice(this.page * i, this.page * i + i).forEach((t, i) => {
        const n = 84 + 24 * i,
          o = "stopped" !== t.state;
        ((e.fillStyle = "rgba(0,0,0,0.35)"), e.fillRect(s - 152, n, 254, 20));
        const a = "undefined" != typeof Account && Account.data && Account.data.super ? 222 : 248;
        Font.draw(e, fitText(t.name, a), s - 149, n + 2, "#FFFFFF");
        const r = o
          ? `${t.players}/${t.max} 人 · ${GM_CN[t.gamemode] || ""} · ${roomAge(t.started)}`
          : `休息中 · 最多 ${t.max} 人 · ${GM_CN[t.gamemode] || ""}`;
        Font.draw(
          e,
          fitText(`房主 ${t.owner} · ${r}`, a),
          s - 149,
          n + 11,
          o ? "#90C890" : "#909090",
        );
      }),
      this.note && Font.center(e, fitText(this.note, t.w - 8), s, t.h - 62, this.noteColor));
  }
}
class CreateRoomScreen extends FormScreen {
  constructor(t, e, s) {
    (super(t, "创建新房间", e),
      (this.owner = s),
      (this.roomName = s + " 的世界"),
      (this.seed = ""),
      (this.save = null),
      (this.gamemode = "survival"),
      (this.difficulty = "normal"),
      (this.pvp = !0),
      (this.busy = !1),
      (this.size = 4),
      (this.cap = null),
      this.loadCap());
  }
  async loadCap() {
    try {
      ((this.cap = await RoomService.api("/api/capacity")),
        this.cap && !this.cap.sizes[this.size] && this.cap.max && (this.size = this.cap.max));
    } catch (t) {
      this.cap = null;
    }
    this.game.ui.screen === this && this.layout();
  }
  sizes() {
    return this.cap ? Object.keys(this.cap.sizes).map(Number) : [4, 6, 8, 10];
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2;
    ((this.fields = {}),
      this.save ||
        this.addField("seed", e + 2, 166, 98, "种子（留空：随机）", 32, (t) => t.slice(0, 32)));
    const s = { survival: "生存", creative: "创造", adventure: "冒险" },
      i = { peaceful: "和平", easy: "简单", normal: "普通", hard: "困难" },
      next = (t, e) => {
        const s = Object.keys(t);
        return s[(s.indexOf(e) + 1) % s.length];
      },
      ok = (t) => !this.cap || this.cap.sizes[t];
    ((this.widgets = [
      {
        x: e - 100,
        y: 52,
        w: 200,
        h: 20,
        label: () => fitText("房间名：" + this.roomName, 192),
        enabled: !1,
        tip: [
          "房间名就是「你的名字 的世界」，不能自己起名",
          "每个人只能建一个房间，不要了可以在「我的房间」里删掉",
        ],
      },
      {
        x: e - 100,
        y: 80,
        w: 98,
        h: 20,
        label: () => "模式：" + s[this.gamemode],
        onClick: () => {
          this.gamemode = next(s, this.gamemode);
        },
      },
      {
        x: e + 2,
        y: 80,
        w: 98,
        h: 20,
        label: () => "难度：" + i[this.difficulty],
        onClick: () => {
          this.difficulty = next(i, this.difficulty);
        },
      },
      {
        x: e - 100,
        y: 104,
        w: 98,
        h: 20,
        label: () => "PVP：" + (this.pvp ? "开" : "关"),
        tip: ["玩家能不能互相伤害"],
        onClick: () => {
          this.pvp = !this.pvp;
        },
      },
      {
        x: e + 2,
        y: 104,
        w: 98,
        h: 20,
        label: () => `人数：${this.size}${ok(this.size) ? "" : "（要排队）"}`,
        tip: [
          "房间最多几个人（包括你）",
          "人越多服务器给的内存越多，资源紧张时要排队等别的房间关掉",
        ],
        onClick: () => {
          const t = this.sizes();
          this.size = t[(t.indexOf(this.size) + 1) % t.length];
        },
      },
      {
        x: e - 100,
        y: 166,
        w: this.save ? 200 : 98,
        h: 20,
        label: () => (this.save ? "存档：" + this.save.name : "世界：新世界"),
        tip: ["可以用你的单人存档（新版地形）开房间，大小不超过 100 MB"],
        enabled: !this.busy,
        onClick: () => this.game.ui.open(new SavePickScreen(this.game, this)),
      },
      {
        x: e - 100,
        y: 196,
        w: 200,
        h: 20,
        label: () => (this.busy ? "正在创建…" : ok(this.size) ? "创建并进入" : "创建并排队"),
        enabled: !this.busy,
        onClick: () => this.submit(),
      },
      { x: e - 100, y: t.h - 30, w: 200, h: 20, label: "返回", onClick: () => this.back() },
    ]),
      this.field && this.focus(this.field));
  }
  async submit() {
    if (this.busy) return;
    ((this.busy = !0), this.say("正在创建房间…"), this.layout());
    let t = null;
    try {
      let e = null;
      if (this.save) {
        const t = await DB.getWorld(this.save.id);
        if (!t) throw new Error("找不到这个存档");
        const s = await RoomExport.build(t, (t) => {
          this.say(`正在转换存档… ${Math.round(100 * t)}%`);
        });
        ((e = RoomExport.packFiles(s.files)), (this.seed = s.info.seed));
      }
      if (
        ((t = (
          await RoomService.api("/api/rooms", {
            name: this.roomName,
            owner: this.owner,
            key: RoomService.key(),
            gamemode: this.gamemode,
            difficulty: this.difficulty,
            pvp: this.pvp,
            seed: this.seed,
            size: this.size,
          })
        ).code),
        e)
      ) {
        const s = (e.length / 1048576).toFixed(1);
        await RoomService.upload("/api/rooms/" + t + "/world?key=" + RoomService.key(), e, (t) => {
          this.say(`正在上传存档… ${Math.round(100 * t)}%（${s} MB）`);
        });
      }
      (this.game.ui.hideInput(), this.game.joinRoom(t, this.owner));
    } catch (e) {
      (t &&
        RoomService.api("/api/rooms/" + t + "/delete", { key: RoomService.key() }).catch(() => {}),
        (this.busy = !1),
        this.say(e.message, !0),
        this.loadCap(),
        this.layout(),
        e.gate &&
          this.game.ui.open(
            Account.loggedIn
              ? new UnlockScreen(this.game, this, e.message, () => this.game.ui.open(this))
              : new LoginScreen(this.game, () => this.game.ui.open(this)),
          ));
    }
  }
  drawExtra(t) {
    const e = t.ctx,
      s = t.w / 2,
      i = this.note;
    ((this.note = ""), this.drawFields(t), (this.note = i));
    const n = this.cap,
      o = n
        ? n.max
          ? `现在能开：最多 ${n.max} 人的房间`
          : `现在开不了新房间：${n.reason || "服务器满了"}`
        : "";
    (Font.center(e, fitText(o, t.w - 8), s, 130, n && !n.max ? "#FF8080" : "#80FF80"),
      Font.center(
        e,
        fitText(
          n && !n.max
            ? "可以先加入一个正在玩的公开房间"
            : "房间公开，所有人都能进；你是房主，能踢人、封禁、禁言",
          t.w - 8,
        ),
        s,
        142,
        "#808080",
      ),
      this.note && Font.center(e, this.note, s, 222, this.noteColor));
  }
}
class SavePickScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, "房间的世界"),
      (this.parent = e),
      (this.pauses = !1),
      (this.titleY = 8),
      (this.worlds = null),
      (this.page = 0),
      this.load());
  }
  async load() {
    try {
      this.worlds = (await DB.listWorlds()).filter((t) => 2 === t.gen && !t.flat);
    } catch (t) {
      this.worlds = [];
    }
    this.game.ui.screen === this && this.layout();
  }
  rows() {
    return Math.max(2, Math.floor((this.game.ui.h - 68 - 60) / 24));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      s = this.worlds || [],
      i = this.rows(),
      n = Math.max(1, Math.ceil(s.length / i));
    this.page = clamp(this.page, 0, n - 1);
    const pick = (t) => {
      const e = this.parent;
      ((e.save = t ? { id: t.id, name: t.name } : null), this.game.ui.open(e));
    };
    ((this.widgets = [
      { x: e - 100, y: 38, w: 200, h: 20, label: "新世界", onClick: () => pick(null) },
    ]),
      s
        .slice(this.page * i, this.page * i + i)
        .forEach((t, s) =>
          this.widgets.push({
            x: e - 100,
            y: 68 + 24 * s,
            w: 200,
            h: 20,
            label: fitText(t.name, 190),
            onClick: () => pick(t),
          }),
        ),
      n > 1 &&
        this.widgets.push(
          {
            x: e - 100,
            y: t.h - 54,
            w: 98,
            h: 20,
            label: "上一页",
            enabled: this.page > 0,
            onClick: () => {
              (this.page--, this.layout());
            },
          },
          {
            x: e + 2,
            y: t.h - 54,
            w: 98,
            h: 20,
            label: "下一页",
            enabled: this.page < n - 1,
            onClick: () => {
              (this.page++, this.layout());
            },
          },
        ),
      this.widgets.push({
        x: e - 100,
        y: t.h - 30,
        w: 200,
        h: 20,
        label: "返回",
        onClick: () => this.game.ui.open(this.parent),
      }));
  }
  drawExtra(t) {
    this.worlds && !this.worlds.length
      ? Font.center(t.ctx, "没有能用的存档（只能用新版地形的单人存档）", t.w / 2, 70, "#A0A0A0")
      : Font.center(
          t.ctx,
          fitText("只能用新版地形的单人存档，最大 100 MB；房间里的进度不会回到单人存档", t.w - 8),
          t.w / 2,
          22,
          "#909090",
        );
  }
  onEsc() {
    this.game.ui.open(this.parent);
  }
}
class MyRoomsScreen extends FormScreen {
  constructor(t, e, s) {
    (super(t, "我的房间", e),
      (this.name = s),
      (this.rooms = null),
      (this.confirm = null),
      this.load());
  }
  async load() {
    try {
      ((this.rooms = await RoomService.api("/api/rooms?key=" + RoomService.key())),
        this.say(this.rooms.length ? "" : "你还没有建过房间"));
    } catch (t) {
      ((this.rooms = []), this.say(t.message, !0));
    }
    this.game.ui.screen === this && this.layout();
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2;
    ((this.widgets = [
      { x: e - 100, y: t.h - 30, w: 200, h: 20, label: "返回", onClick: () => this.back() },
    ]),
      (this.rooms || []).slice(0, 5).forEach((t, s) => {
        const i = 44 + 30 * s;
        (this.widgets.push({
          x: e + 64,
          y: i,
          w: 50,
          h: 20,
          label: "进入",
          blue: !0,
          tip: ["你的房间：满员了也能进"],
          onClick: () => {
            (this.game.ui.hideInput(), this.game.joinRoom(t.code, this.name));
          },
        }),
          this.widgets.push({
            x: e + 118,
            y: i,
            w: 50,
            h: 20,
            label: () => (this.confirm === t.code ? "确定？" : "删除"),
            onClick: () => this.del(t),
          }));
      }));
  }
  async del(t) {
    if (this.confirm === t.code) {
      this.confirm = null;
      try {
        (await RoomService.api("/api/rooms/" + t.code + "/delete", { key: RoomService.key() }),
          this.say("已删除 " + t.name),
          this.load());
      } catch (t) {
        this.say(t.message, !0);
      }
    } else this.confirm = t.code;
  }
  drawExtra(t) {
    const e = t.ctx,
      s = t.w / 2;
    (this.rooms || Font.center(e, "正在读取…", s, 60, "#A0A0A0"),
      (this.rooms || []).slice(0, 5).forEach((t, i) => {
        const n = 44 + 30 * i;
        (Font.draw(e, t.name, s - 170, n + 2, "#FFFFFF"),
          Font.draw(
            e,
            `${t.code}  ${"running" === t.state ? "运行中 " + t.players.length + "/" + t.max : "休息中"}`,
            s - 170,
            n + 12,
            "#909090",
          ));
      }),
      this.note && Font.center(e, this.note, s, t.h - 52, this.noteColor));
  }
}
class DirectConnectScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, "直接连接"), (this.parent = e), (this.titleY = 20));
    const s = t.settings;
    ((this.url = s.netUrl || "ws://" + (location.hostname || "localhost") + ":8780"),
      (this.name = s.netName || "Web" + Math.floor(9e3 * Math.random() + 1e3)),
      (this.field = "name"));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2;
    ((this.boxes = {
      name: { x: e - 100, y: 60, w: 200, h: 20 },
      url: { x: e - 100, y: 106, w: 200, h: 20 },
    }),
      (this.widgets = [
        { x: e - 100, y: 140, w: 200, h: 20, label: "加入服务器", onClick: () => this.join() },
        { x: e - 100, y: t.h - 30, w: 200, h: 20, label: "返回", onClick: () => this.onEsc() },
      ]),
      this.focus(this.field));
  }
  focus(t) {
    const e = this.game.ui,
      s = this.boxes[t];
    ((this.field = t),
      e.showInput(s.x + 4, s.y + 6, s.w - 8, 10, this[t], () => this.join(), {
        onInput: (e) => {
          this[t] = e;
        },
        onEsc: () => this.onEsc(),
        max: "name" === t ? 16 : 120,
      }));
  }
  join() {
    const t = this.game,
      e = this.name.replace(/[^A-Za-z0-9_]/g, "").slice(0, 16);
    e &&
      ((t.settings.netUrl = this.url.trim()),
      (t.settings.netName = e),
      t.saveSettings(),
      t.ui.hideInput(),
      t.joinServer(this.url.trim(), e));
  }
  mouseDown(t, e, s, i) {
    for (const t of ["name", "url"]) {
      const i = this.boxes[t];
      if (e >= i.x && e < i.x + i.w && s >= i.y && s < i.y + i.h) return void this.focus(t);
    }
    super.mouseDown(t, e, s, i);
  }
  drawExtra(t) {
    const e = t.ctx,
      s = t.w / 2;
    (Font.draw(
      e,
      "玩家名（英文字母、数字、下划线）",
      this.boxes.name.x,
      this.boxes.name.y - 11,
      "#A0A0A0",
    ),
      Font.draw(
        e,
        "联机中转地址（multiplayer/proxy）",
        this.boxes.url.x,
        this.boxes.url.y - 11,
        "#A0A0A0",
      ));
    for (const s of ["name", "url"]) {
      const i = this.boxes[s];
      (t.nine(this.field === s ? "text_field_hl" : "text_field", i.x, i.y, i.w, i.h, 1),
        this.field !== s && Font.draw(e, this[s], i.x + 4, i.y + 6, "#E0E0E0"));
    }
    (Font.center(
      e,
      "先启动 multiplayer/proxy 的联机中转（node src/proxy.js），它会连到游戏服务器",
      s,
      170,
      "#808080",
    ),
      Font.center(
        e,
        "目前可以：走动、挖掘、放置、战斗、聊天，用箱子、工作台、熔炉，和村民交易",
        s,
        182,
        "#808080",
      ));
  }
  onEsc() {
    (this.game.ui.hideInput(), this.game.ui.open(this.parent || new TitleScreen(this.game)));
  }
}
class RoomScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, "房间"),
      (this.parent = e),
      (this.pauses = !1),
      (this.titleY = 12),
      (this.note = ""),
      (this.noteColor = "#80FF80"),
      (this.info = null),
      (this.page = 0),
      (this.confirm = null),
      this.load());
  }
  get R() {
    return this.game.net && this.game.net.room;
  }
  get me() {
    return (this.game.net && this.game.net.name) || "";
  }
  async load() {
    const t = this.R;
    if (t) {
      try {
        ((this.info = await RoomService.api(
          "/api/rooms/" + t.code + (t.isOwner ? "?key=" + RoomService.key() : ""),
        )),
          (t.guestMode = this.info.guestMode),
          (t.players = this.info.players));
      } catch (t) {
        this.say(t.message, !0);
      }
      this.game.ui.screen === this && this.layout();
    }
  }
  say(t, e) {
    ((this.note = t), (this.noteColor = e ? "#FF6060" : "#80FF80"));
  }
  rows() {
    return Math.max(2, Math.floor((this.game.ui.h - 108 - 56) / 22));
  }
  async act(t, e, s) {
    const i = this.R;
    try {
      ((this.info = await RoomService.api("/api/rooms/" + i.code + "/manage", {
        key: RoomService.key(),
        action: t,
        name: e,
        value: s,
      })),
        (i.guestMode = this.info.guestMode),
        (i.max = this.info.max),
        this.say("已完成"));
    } catch (t) {
      this.say(t.message, !0);
    }
    ((this.confirm = null), this.layout());
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      s = this.R,
      i = this.info,
      n = !(!s || !s.isOwner);
    if (((this.widgets = []), !s))
      return void this.widgets.push({
        x: e - 100,
        y: t.h - 30,
        w: 200,
        h: 20,
        label: "完成",
        onClick: () => this.game.ui.open(this.parent),
      });
    (this.widgets.push(
      {
        x: e - 160,
        y: 48,
        w: 78,
        h: 20,
        label: "复制邀请码",
        onClick: () => this.copy(s.code, "邀请码已复制"),
      },
      {
        x: e - 78,
        y: 48,
        w: 78,
        h: 20,
        label: "复制链接",
        onClick: () => this.copy(RoomService.link(s.code), "链接已复制，发给朋友打开就能加入"),
      },
    ),
      n &&
        this.widgets.push(
          {
            x: e + 4,
            y: 48,
            w: 96,
            h: 20,
            label: () => "访客：" + ("view" === (i && i.guestMode) ? "只能看" : "能建造"),
            tip: [
              "只能看：不是成员的人进来是冒险模式，不能破坏和放置方块",
              "能建造：所有人都能建造",
            ],
            onClick: () =>
              this.act("guestMode", "", "view" === (i && i.guestMode) ? "build" : "view"),
          },
          {
            x: e + 104,
            y: 48,
            w: 56,
            h: 20,
            label: () => "人数 " + ((i && i.max) || s.max),
            tip: ["点一下换下一档人数上限", "不能少于房间里现在的人数"],
            enabled: !(!i || !i.sizes),
            onClick: () => {
              const t = i.sizes,
                e = i.max,
                s = (i.players || []).length,
                n = t.filter((t) => t >= s);
              this.act("size", "", n.find((t) => t > e) || n[0]);
            },
          },
        ));
    const o = (i && i.players) || s.players || [],
      a = this.rows(),
      r = Math.max(1, Math.ceil(o.length / a));
    ((this.page = clamp(this.page, 0, r - 1)),
      o.slice(this.page * a, this.page * a + a).forEach((t, s) => {
        const o = 96 + 22 * s,
          a = i && t.toLowerCase() === i.owner.toLowerCase(),
          r = t.toLowerCase();
        if (n && !a) {
          const s = i && (i.mutes || []).includes(r),
            n = i && (i.members || []).includes(r);
          this.widgets.push(
            {
              x: e - 20,
              y: o,
              w: 42,
              h: 18,
              label: () => (this.confirm === "kick:" + t ? "确定？" : "踢出"),
              onClick: () => this.twice("kick:" + t, () => this.act("kick", t)),
            },
            {
              x: e + 24,
              y: o,
              w: 42,
              h: 18,
              label: () => (this.confirm === "ban:" + t ? "确定？" : "封禁"),
              tip: ["踢出并且以后不让他进这个房间"],
              onClick: () => this.twice("ban:" + t, () => this.act("ban", t)),
            },
            {
              x: e + 68,
              y: o,
              w: 44,
              h: 18,
              label: s ? "解除禁言" : "禁言",
              onClick: () => this.act(s ? "unmute" : "mute", t),
            },
            {
              x: e + 114,
              y: o,
              w: 46,
              h: 18,
              label: n ? "取消成员" : "设为成员",
              tip: [
                "成员和房主有一样的游戏内权限：切换生存 / 创造、用命令",
                "但不能管理房间（踢人、封禁、设成员只有房主能做）",
              ],
              onClick: () => this.act("member", t, !n),
            },
          );
        } else
          n ||
            t === this.me ||
            this.widgets.push({
              x: e + 114,
              y: o,
              w: 46,
              h: 18,
              label: "举报",
              onClick: () => this.game.ui.open(new ReportScreen(this.game, this, t)),
            });
      }),
      r > 1 &&
        this.widgets.push(
          {
            x: e + 114,
            y: 80,
            w: 22,
            h: 14,
            label: "<",
            enabled: this.page > 0,
            onClick: () => {
              (this.page--, this.layout());
            },
          },
          {
            x: e + 138,
            y: 80,
            w: 22,
            h: 14,
            label: ">",
            enabled: this.page < r - 1,
            onClick: () => {
              (this.page++, this.layout());
            },
          },
        ),
      n &&
        i &&
        (i.bans || []).length &&
        this.widgets.push({
          x: e - 160,
          y: t.h - 52,
          w: 150,
          h: 20,
          label: `封禁名单（${i.bans.length}）…`,
          onClick: () => this.game.ui.open(new BanListScreen(this.game, this)),
        }),
      "undefined" != typeof Account &&
        Account.data &&
        Account.data.super &&
        this.widgets.push({
          x: e + 10,
          y: t.h - 52,
          w: 150,
          h: 20,
          label: "管理员：管理房间…",
          gold: !0,
          tip: ["关闭这个房间的服务器、删除房间、全服封禁玩家"],
          onClick: () => this.game.ui.open(new AdminRoomScreen(this.game, this, s.code)),
        }),
      this.widgets.push({
        x: e - 100 + (n && i && (i.bans || []).length ? 110 : 0),
        y: t.h - 30,
        w: 200 - (n && i && (i.bans || []).length ? 110 : 0),
        h: 20,
        label: "完成",
        onClick: () => this.game.ui.open(this.parent),
      }));
  }
  twice(t, e) {
    this.confirm === t ? e() : ((this.confirm = t), this.layout());
  }
  async copy(t, e) {
    this.say((await copyText(t)) ? e : "复制失败：" + t, !1);
  }
  drawExtra(t) {
    const e = t.ctx,
      s = t.w / 2,
      i = this.R,
      n = this.info;
    if (!i) return void Font.center(e, "不在房间里", s, 60, "#A0A0A0");
    (Font.center(
      e,
      fitText(`${i.name}　邀请码 ${i.code}　房主 ${i.owner}`, t.w - 8),
      s,
      28,
      "#FFFF55",
    ),
      Font.center(
        e,
        i.isOwner
          ? "房间公开，所有人都能在列表里看到并进入"
          : "有人捣乱可以举报，房主也能踢人和封禁",
        s,
        38,
        "#909090",
      ));
    const o = (n && n.players) || i.players || [],
      a = this.rows();
    (Font.draw(e, `玩家（${o.length}/${(n && n.max) || i.max}）`, s - 160, 82, "#FFFFFF"),
      o.slice(this.page * a, this.page * a + a).forEach((t, i) => {
        const o = 96 + 22 * i,
          a = t.toLowerCase(),
          r = [];
        (n && a === n.owner.toLowerCase()
          ? r.push("房主")
          : n && (n.members || []).includes(a) && r.push("成员"),
          n && (n.mutes || []).includes(a) && r.push("禁言"),
          t === this.me && r.push("你"),
          (e.fillStyle = "rgba(0,0,0,0.35)"),
          e.fillRect(s - 160, o, 320, 18));
        const l = "undefined" != typeof Cosmetics ? Cosmetics.preName(this.game, t) : t;
        (Font.draw(e, l, s - 157, o + 5, "#FFFFFF"),
          r.length && Font.draw(e, r.join(" "), s - 157 + Font.width(l) + 6, o + 5, "#A0A0A0"));
      }),
      this.note && Font.center(e, this.note, s, t.h - 62, this.noteColor));
  }
  onEsc() {
    this.game.ui.open(this.parent);
  }
}
class BanListScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, "封禁名单"), (this.parent = e), (this.pauses = !1), (this.titleY = 20));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      s = (this.parent.info && this.parent.info.bans) || [];
    ((this.widgets = s.slice(0, 8).map((t, s) => ({
      x: e + 40,
      y: 44 + 22 * s,
      w: 60,
      h: 18,
      label: "解除封禁",
      onClick: async () => {
        (await this.parent.act("unban", t), this.layout());
      },
    }))),
      this.widgets.push({
        x: e - 100,
        y: t.h - 30,
        w: 200,
        h: 20,
        label: "完成",
        onClick: () => this.game.ui.open(this.parent),
      }));
  }
  drawExtra(t) {
    const e = (this.parent.info && this.parent.info.bans) || [];
    (e.length || Font.center(t.ctx, "没有封禁的人", t.w / 2, 60, "#A0A0A0"),
      e.slice(0, 8).forEach((e, s) => Font.draw(t.ctx, e, t.w / 2 - 100, 49 + 22 * s, "#FFFFFF")));
  }
  onEsc() {
    this.game.ui.open(this.parent);
  }
}
class AdminRoomScreen extends MenuScreen {
  constructor(t, e, s) {
    (super(t, "管理房间"),
      (this.parent = e),
      (this.code = s),
      (this.pauses = !1),
      (this.titleY = 12),
      (this.info = null),
      (this.gone = !1),
      (this.page = 0),
      (this.confirm = null),
      (this.busy = !1),
      (this.note = ""),
      (this.noteColor = "#80FF80"),
      this.load());
  }
  async load() {
    try {
      this.info = await RoomService.api("/api/rooms/" + this.code);
    } catch (t) {
      ((this.info = null), this.say(t.message, !0));
    }
    this.game.ui.screen === this && this.layout();
  }
  say(t, e) {
    ((this.note = t), (this.noteColor = e ? "#FF6060" : "#80FF80"));
  }
  rows() {
    return Math.max(2, Math.floor((this.game.ui.h - 96 - 56) / 22));
  }
  twice(t, e) {
    this.confirm === t ? ((this.confirm = null), e()) : ((this.confirm = t), this.layout());
  }
  async room(t) {
    ((this.busy = !0), this.layout());
    try {
      const e = await Account.api("/api/account/admin/room", { code: this.code, action: t });
      "delete" === t
        ? ((this.gone = !0), (this.info = null), this.say("房间已删除"))
        : ((this.info = e.room), this.say("服务器已关闭，房间里的人都被请出了"));
    } catch (t) {
      this.say(t.message, !0);
    }
    ((this.busy = !1), this.layout());
  }
  async ban(t) {
    ((this.busy = !0), this.layout());
    try {
      const e = await Account.api("/api/account/admin/freeze", { name: t });
      (this.say(
        `已封禁 ${e.name}：账号冻结${e.ip ? `，IP 封禁 ${e.hours} 小时` : ""}（冻结名单里可以解除）`,
      ),
        await new Promise((t) => setTimeout(t, 600)),
        await this.load());
    } catch (t) {
      this.say(t.message, !0);
    }
    ((this.busy = !1), this.layout());
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      s = this.info,
      i =
        (this.game.net && this.game.net.name) ||
        ("undefined" != typeof Account && Account.name) ||
        "",
      n = !!s && "stopped" !== s.state;
    ((this.widgets = []),
      this.gone ||
        this.widgets.push(
          {
            x: e - 160,
            y: 48,
            w: 100,
            h: 20,
            label: () => ("stop" === this.confirm ? "确定关闭？" : "关闭服务器"),
            enabled: n && !this.busy,
            tip: ["保存世界并关掉这个房间的服务器", "房间里的人都会被请出；之后有人进入会重新启动"],
            onClick: () => this.twice("stop", () => this.room("stop")),
          },
          {
            x: e - 56,
            y: 48,
            w: 100,
            h: 20,
            label: () => ("delete" === this.confirm ? "确定删除？" : "删除房间"),
            enabled: !!s && !this.busy,
            tip: ["删除这个房间和它的世界，不能恢复", "房间里的人都会被请出"],
            onClick: () => this.twice("delete", () => this.room("delete")),
          },
        ));
    const o = (s && s.players) || [],
      a = this.rows(),
      r = Math.max(1, Math.ceil(o.length / a));
    ((this.page = clamp(this.page, 0, r - 1)),
      o.slice(this.page * a, this.page * a + a).forEach((t, s) => {
        t !== i &&
          this.widgets.push({
            x: e + 92,
            y: 96 + 22 * s,
            w: 68,
            h: 18,
            label: () => (this.confirm === "ban:" + t ? "确定封禁？" : "全服封禁"),
            enabled: !this.busy,
            tip: [
              "冻结这个玩家的账号，并封禁他的 IP",
              "他会被请出所有房间，以后也登录不了",
              "管理员 → 冻结名单 里可以解除",
            ],
            onClick: () => this.twice("ban:" + t, () => this.ban(t)),
          });
      }),
      r > 1 &&
        this.widgets.push(
          {
            x: e + 114,
            y: 80,
            w: 22,
            h: 14,
            label: "<",
            enabled: this.page > 0,
            onClick: () => {
              (this.page--, this.layout());
            },
          },
          {
            x: e + 138,
            y: 80,
            w: 22,
            h: 14,
            label: ">",
            enabled: this.page < r - 1,
            onClick: () => {
              (this.page++, this.layout());
            },
          },
        ),
      this.widgets.push({
        x: e - 100,
        y: t.h - 30,
        w: 200,
        h: 20,
        label: "完成",
        onClick: () => this.onEsc(),
      }));
  }
  drawExtra(t) {
    const e = t.ctx,
      s = t.w / 2,
      i = this.info,
      n = this.rows();
    if (this.gone) Font.center(e, "房间 " + this.code + " 已删除", s, 60, "#A0A0A0");
    else if (i) {
      const o = "running" === i.state ? "运行中" : "starting" === i.state ? "正在启动" : "休息中";
      Font.center(
        e,
        fitText(`${i.name}　邀请码 ${i.code}　房主 ${i.owner}　${o}`, t.w - 8),
        s,
        30,
        "#FFFF55",
      );
      const a = i.players || [];
      (Font.draw(e, `玩家（${a.length}/${i.max}）`, s - 160, 82, "#FFFFFF"),
        a.length || Font.draw(e, "房间里没有人", s - 157, 101, "#909090"),
        a.slice(this.page * n, this.page * n + n).forEach((t, i) => {
          const n = 96 + 22 * i;
          ((e.fillStyle = "rgba(0,0,0,0.35)"),
            e.fillRect(s - 160, n, 320, 18),
            Font.draw(e, fitText(t, 240), s - 157, n + 5, "#FFFFFF"));
        }));
    } else Font.center(e, "正在读取…", s, 60, "#A0A0A0");
    this.note && Font.center(e, fitText(this.note, t.w - 8), s, t.h - 44, this.noteColor);
  }
  onEsc() {
    const t = this.parent;
    (t && t.load && (t instanceof MultiplayerScreen && (t.list = null), t.load()),
      this.game.ui.open(t));
  }
}
const REPORT_REASONS = [
  ["cheat", "作弊"],
  ["abuse", "说脏话 / 刷屏"],
  ["grief", "破坏别人的建筑"],
  ["other", "其他"],
];
class ReportScreen extends FormScreen {
  constructor(t, e, s) {
    (super(t, "举报 " + s, e),
      (this.target = s),
      (this.reason = 0),
      (this.text = ""),
      (this.busy = !1));
  }
  layout() {
    const t = this.game.ui.w / 2;
    ((this.fields = {}),
      this.addField("text", t - 120, 90, 240, "说明（可以不写，最多 300 字）", 300),
      (this.widgets = [
        {
          x: t - 120,
          y: 50,
          w: 240,
          h: 20,
          label: () => "原因：" + REPORT_REASONS[this.reason][1],
          onClick: () => {
            this.reason = (this.reason + 1) % REPORT_REASONS.length;
          },
        },
        {
          x: t - 120,
          y: 124,
          w: 118,
          h: 20,
          label: () => (this.busy ? "发送中…" : "举报"),
          enabled: !this.busy && !this.sent,
          onClick: () => this.submit(),
        },
        { x: t + 2, y: 124, w: 118, h: 20, label: "返回", onClick: () => this.back() },
      ]),
      this.focus("text"));
  }
  async submit() {
    const t = this.game,
      e = t.net && t.net.room;
    if (e) {
      ((this.busy = !0), this.layout());
      try {
        (await RoomService.api("/api/rooms/" + e.code + "/report", {
          key: RoomService.key(),
          from: t.net.name,
          target: this.target,
          reason: REPORT_REASONS[this.reason][0],
          text: this.text,
        }),
          (this.sent = !0),
          this.say("已举报，谢谢！我们会查看"));
      } catch (t) {
        this.say(t.message, !0);
      }
      ((this.busy = !1), this.layout());
    }
  }
  drawExtra(t) {
    (this.drawFields(t),
      Font.center(t.ctx, "举报会连同房间和在场的玩家一起发给我们", t.w / 2, 154, "#909090"));
  }
}
const InviteScreen = RoomScreen,
  NET_DIR = [2, 3, 4, 5, 0, 1],
  NET_SPRITE = {
    snowball: "snowball",
    egg: "egg",
    blue_egg: "blue_egg",
    brown_egg: "brown_egg",
    ender_pearl: "ender_pearl",
    eye_of_ender: "ender_eye",
    splash_potion: "splash_potion",
    lingering_potion: "lingering_potion",
    potion: "splash_potion",
    experience_bottle: "experience_bottle",
    fireball: "fire_charge",
    small_fireball: "fire_charge",
    dragon_fireball: "fire_charge",
    wind_charge: "wind_charge",
    breeze_wind_charge: "wind_charge",
    firework_rocket: "firework_rocket",
    llama_spit: null,
    ominous_item_spawner: null,
  },
  NET_QUIET = new Set([
    "marker",
    "interaction",
    "area_effect_cloud",
    "item_display",
    "block_display",
    "text_display",
    "lightning_bolt",
  ]);
function netShotTick() {
  if ((this.savePrev(), this.age++, this.lerpN > 0)) {
    const t = 1 / this.lerpN;
    for (let e = 0; e < 3; e++) this.pos[e] += (this.netPos[e] - this.pos[e]) * t;
    this.lerpN--;
  } else if (this.netVel && !this.inGround) {
    for (let t = 0; t < 3; t++) this.pos[t] += this.netVel[t];
    this.netVel[1] -= this.netGrav || 0;
    for (let t = 0; t < 3; t++) this.netVel[t] *= 0.99;
  }
  if (this.updateRot && this.netVel && !this.inGround) {
    const t = this.netVel;
    Math.hypot(t[0], t[1], t[2]) > 0.001 && ((this.vel = [...t]), this.updateRot());
  }
}
(() => {
  const t = NetClient.prototype.spawn;
  NetClient.prototype.spawn = function (e) {
    const s = this.g,
      i = e.y - this.minY,
      n = e.type;
    if (this.ents.has(e.id)) return;
    let o = null,
      a = "mob";
    if (NET_QUIET.has(n))
      "lightning_bolt" === n &&
        (Sound.ev("entity.lightning_bolt.thunder", null, 1, 1), (s.lightningFlash = 4));
    else {
      if (NET_MOBS.has(n) || (!VMOB[n] && "ender_dragon" !== n))
        if ("item_frame" === n || "glow_item_frame" === n || "painting" === n) {
          const t = NET_DIR[0 | e.data] ?? 4,
            r = Math.floor(e.x),
            l = Math.floor(i),
            h = Math.floor(e.z);
          ((o =
            "painting" === n
              ? new Painting(s, r, l, h, t, PAINTINGS[0])
              : new ItemFrame(s, r, l, h, t, "glow_item_frame" === n)),
            (o.hurt = () => !1),
            (o.interact = null),
            (a = "still"));
        } else if ("armor_stand" === n)
          ((o = new ArmorStand(s, e.x, i, e.z)),
            (o.yaw = toYaw(e.yaw)),
            (o.hurt = () => !1),
            (o.interact = null),
            (a = "still"));
        else if ("leash_knot" === n)
          ((o = new LeashKnot(s, Math.floor(e.x), Math.floor(i), Math.floor(e.z))), (a = "still"));
        else if ("arrow" === n || "spectral_arrow" === n || "trident" === n)
          ((o =
            "trident" === n
              ? new ThrownTrident(s, e.x, i, e.z, [0, 0, 0], null, makeStack("trident", 1))
              : new Arrow(s, e.x, i, e.z, [0, 0, 0], null)),
            "spectral_arrow" === n && (o.tip = makeStack("spectral_arrow", 1)),
            (o.netGrav = 0.05),
            (a = "shot"));
        else if (n in NET_SPRITE || "wither_skull" === n || "shulker_bullet" === n) {
          if ("wither_skull" === n) o = new WitherSkull(s, e.x, i, e.z, [0, 0, 0], null, !1);
          else if ("shulker_bullet" === n) o = new ShulkerBullet(s, e.x, i, e.z, null, null);
          else if ("llama_spit" === n)
            o = new MobShot(s, e.x, i, e.z, [0, 0, 0], null, { sprite: "p_generic_2" });
          else {
            o = new Entity(s, e.x, i, e.z, 0.25, 0.25);
            const t = NET_SPRITE[n];
            o.spriteLayer = t && void 0 !== ITEM_KEY[t] ? ITEMS[ITEM_KEY[t]].tex : T("p_generic_0");
          }
          if (
            /^(splash|lingering)_potion$/.test(NET_SPRITE[n]) &&
            "function" == typeof potionSprites
          ) {
            const t = NET_SPRITE[n];
            ((o.netPotion = !0), (o.drawSelf = (e, s) => potionSprites(e, s, t, o.netPot)));
          }
          ((o.netGrav = /fireball|wind_charge|wither_skull|shulker|firework/.test(n) ? 0 : 0.03),
            (a = "shot"));
        } else if ("experience_orb" === n)
          ((o = new ExperienceOrb(s, e.x, i, e.z, 1)),
            (o.pickup = 1e9),
            (a = "shot"),
            (o.netGrav = 0.03));
        else if ("tnt" === n)
          ((o = new PrimedTNT(s, e.x, i, e.z, 80)), (a = "shot"), (o.netGrav = 0.04));
        else if ("end_crystal" === n)
          ((o = new EndCrystal(s, e.x, i, e.z)), (o.hurt = () => !1), (a = "still"));
        else if ("falling_block" === n) {
          const t = (this.stateMap && this.stateMap[e.data]) || 256,
            n = t >> 8,
            r = 255 & t;
          ((o = new FallingBlock(s, e.x - 0.5, i, e.z - 0.5, n, r)),
            (a = "shot"),
            (o.netGrav = 0.04));
        } else if ("fishing_bobber" === n) {
          const t = e.data === this.eid ? s.player : this.ents.get(e.data);
          ((o = new FishingHook(s, t || s.player, makeStack("fishing_rod", 1))),
            (o.pos = [e.x, i, e.z]),
            o.savePrev(),
            (o.netOwner = e.data),
            (a = "shot"),
            (o.netGrav = 0.03),
            (o.tick = netShotTick));
        } else
          "evoker_fangs" === n && ((o = new EvokerFangs(s, e.x, i, e.z, 0, null)), (a = "fangs"));
      else o = createMob(s, n, e.x, i, e.z);
      if (!o) {
        const s = t.call(this, e),
          i = this.ents.get(e.id);
        return (i && netMetaDefaults(this, i), s);
      }
      if (
        (netMetaDefaults(this, o),
        (o.netId = e.id),
        (o.remote = !0),
        (o.alwaysTick = !0),
        (o.persistent = !0),
        (o.keepSaved = !1),
        (o.netPos = [e.x, i, e.z]),
        (o.lerpN = 0),
        "mob" === a)
      )
        ((o.tick = netEntityTick),
          (o.anims = {}),
          o instanceof Warden && ((o.st = "idle"), (o.anims = {})),
          (o.netYaw = o.yaw = o.bodyYaw = o.prevBodyYaw = toYaw(e.yaw)),
          (o.netPitch = -e.pitch / R2D),
          (o.hurt = () => !1));
      else if ("shot" === a)
        ((o.tick = netShotTick),
          (o.yaw = toYaw(e.yaw)),
          e.v &&
            ((o.netVel = e.v.slice()),
            o.vel && (o.vel = e.v.slice()),
            o.updateRot && o.updateRot()));
      else if ("still" === a) {
        o.tick;
        o.tick = function () {
          (this.savePrev(), this.age++, this.wobble > 0 && this.wobble--);
        };
      }
      (s.entities.push(o), this.ents.set(e.id, o));
    }
  };
  const e = NetClient.prototype.onMessage;
  NetClient.prototype.onMessage = function (t) {
    const s = e.call(this, t),
      i = void 0 !== t.id ? this.ents.get(t.id) : null;
    switch (t.t) {
      case "meta":
        t.m && (t.id === this.eid ? netSelfMeta(this, t.m) : i && netApplyMeta(this, i, t.m));
        break;
      case "equip":
        i && t.slots && netApplyEquip(this, i, t.slots);
        break;
      case "vel":
        i && ((i.netVel = t.v.slice()), !i.vel || i instanceof Living || (i.vel = t.v.slice()));
        break;
      case "map":
        netMapData(this, t);
        break;
      case "be":
        for (const [e, s, i, n] of t.list) {
          const t = e + "," + (s - this.minY) + "," + i,
            o = this.g.blockEntities.get(t) || { type: "net", pos: [e, s - this.minY, i] };
          (Object.assign(o, n), this.g.blockEntities.set(t, o));
        }
        break;
      case "status":
        i && netStatus(this, i, t.s);
        break;
      case "sound": {
        let e = null != t.x ? [t.x, t.y - this.minY, t.z] : null;
        (void 0 !== t.id && i && (e = [i.pos[0], i.pos[1] + 0.5 * i.h, i.pos[2]]),
          Sound.ev(t.n, e, t.v, t.p));
        break;
      }
      case "wev": {
        const e = this.g,
          s = t.x,
          i = t.y - this.minY,
          n = t.z;
        if (2001 === t.e) {
          const o = this.stateMap[t.d] || 0,
            a = o >> 8;
          a &&
            BLOCKS[a] &&
            (e.particles.blockBreak(s, i, n, a, 255 & o),
            Sound.block("break", BLOCKS[a].sound, [s + 0.5, i + 0.5, n + 0.5]));
        } else if (1010 === t.e && t.song && e.jukeboxPlay)
          e.jukeboxPlay([s, i, n], makeStack("music_disc_" + t.song, 1));
        else if (1011 === t.e && e.jukeboxStop) e.jukeboxStop([s, i, n]);
        else if (2e3 === t.e)
          for (let t = 0; t < 10; t++)
            e.particles.spawn(
              "smoke",
              s + 0.5,
              i + 0.5,
              n + 0.5,
              0.1 * (Math.random() - 0.5),
              0.05,
              0.1 * (Math.random() - 0.5),
            );
        break;
      }
      case "signedit": {
        const e = this.g,
          s = t.x,
          i = t.y - this.minY,
          n = t.z,
          o = s + "," + i + "," + n,
          a = e.signs.get(o) || {
            f: { l: ["", "", "", ""], c: "black", g: !1 },
            b: { l: ["", "", "", ""], c: "black", g: !1 },
          };
        e.signs.set(o, a);
        const r = !1 === t.front ? a.b : a.f;
        r.l || (r.l = ["", "", "", ""]);
        const l = new SignScreen(e, [s, i, n], r);
        ((l.onDone = () =>
          this.send({
            t: "sign",
            x: s,
            y: t.y,
            z: n,
            front: !1 !== t.front,
            lines: r.l.slice(0, 4),
          })),
          e.ui.open(l));
        break;
      }
      case "attr": {
        const e = t.id === this.eid ? this.g.player : i;
        if (!e) break;
        (!(void 0 !== t.a.movement_speed && e instanceof Horse) ||
          e instanceof Camel ||
          e instanceof Llama ||
          (e.spd = t.a.movement_speed),
          void 0 !== t.a.jump_strength && (e.jumpStr = t.a.jump_strength),
          void 0 !== t.a.scale && (e.attrScale = t.a.scale),
          void 0 !== t.a.max_health &&
            void 0 !== e.maxHealth &&
            e !== this.g.player &&
            (e.maxHealth = t.a.max_health));
        break;
      }
    }
    return s;
  };
  const s = NetClient.prototype.stackIn;
  NetClient.prototype.stackIn = function (t) {
    const e = s.call(this, t);
    return e && t
      ? (void 0 !== t.map && (e.mapId = "n" + t.map),
        void 0 !== t.color && (e.color = t.color),
        t.base && (e.base = t.base),
        t.pat && (e.patterns = t.pat),
        t.fw && (e.fw = t.fw),
        void 0 !== t.flight && ((e.flight = t.flight), (e.explosions = t.ex || [])),
        t.bundle && (e.bundle = t.bundle.map((t) => this.stackIn(t))),
        t.pages && (e.pages = t.pages),
        void 0 !== t.title && ((e.title = t.title), (e.author = t.author), (e.gen = t.gen)),
        t.ins && (e.instrument = t.ins),
        t.pv && (e.pv = t.pv),
        t.sherds && (e.sherds = t.sherds),
        t.trim && t.trim.material && (e.trim = t.trim),
        e)
      : e;
  };
})();
const flag = (t, e) => !!((0 | t) & e);
function netSelfMeta(t, e) {
  const s = t.g.player,
    i = t.g;
  if (
    ("sleeping_pos" in e && (t.sleepPos = e.sleeping_pos),
    "pose" in e && (t.selfPose = e.pose),
    "pose" in e || "sleeping_pos" in e)
  ) {
    const e = t.sleepPos,
      n = e && [e[0], e[1] - t.minY, e[2]];
    if (("sleeping" !== t.selfPose && 2 !== t.selfPose) || !n || i.sleeping) {
      if ("sleeping" !== t.selfPose && 2 !== t.selfPose && i.sleeping && i.sleeping.net) {
        const t = i.sleeping;
        ((i.sleeping = null), i.standUp(t));
      }
    } else {
      const t = i.world ? i.world.getMeta(n[0], n[1], n[2]) : 0;
      ((i.sleeping = {
        x: n[0] + 0.5,
        y: n[1] + 0.5625,
        z: n[2] + 0.5,
        t: 0,
        rot: 3 & t,
        bed: [n[0], n[1], n[2]],
        net: !0,
      }),
        (s.vel = [0, 0, 0]),
        i.ui.message(
          "正在睡觉…（" + (touchOn(i) ? "点击潜行按钮" : "按 Shift ") + "起床）",
          "#AAAAAA",
        ));
    }
  }
  for (const t of ["shoulder_parrot_left", "shoulder_parrot_right"])
    if (t in e) {
      const i = e[t];
      ("shoulder_parrot_right" !== t && s.shoulder) ||
        (s.shoulder =
          i && i.id
            ? { variant: 0 | i.Variant }
            : "shoulder_parrot_right" === t
              ? null
              : s.shoulder);
    }
}
const NET_META_DEFAULTS = {
  slime: { size: 1 },
  magma_cube: { size: 1 },
  rabbit: { type: 0 },
  fox: { type: 0 },
  mooshroom: { type: 0 },
  panda: { main_gene: 0, hidden_gene: 0 },
  salmon: { type: 1 },
  pufferfish: { puff_state: 0 },
  horse: { type_variant: 0 },
  tropical_fish: { type_variant: 0 },
  goat: { is_screaming_goat: !1, has_left_horn: !0, has_right_horn: !0 },
};
function netMetaDefaults(t, e) {
  const s = NET_META_DEFAULTS[e.type];
  s && netApplyMeta(t, e, s);
}
function netApplyMeta(t, e, s) {
  const has = (t) => t in s;
  if (has("shared_flags")) {
    const t = 0 | s.shared_flags;
    ((e.netFire = !!(1 & t)),
      (e.fire = 1 & t ? 2 : 0),
      (e.sneaking = !!(2 & t)),
      (e.invisible = !!(32 & t)),
      (e.glowing = !!(64 & t)),
      (e.gliding = !!(128 & t)));
  }
  (has("custom_name") && (e.customName = s.custom_name || null),
    has("baby") &&
      e.makeBaby &&
      (s.baby && !e.baby
        ? e.makeBaby()
        : !s.baby && e.baby && ((e.baby = !1), (e.w = e.T.w), (e.h = e.T.h))));
  const i = s.pose,
    n = e.type;
  if (has("variant")) {
    const t = s.variant;
    "wolf" === n || "frog" === n
      ? (e.variant = String(t))
      : "cat" === n && "undefined" != typeof CAT_VARIANTS
        ? (e.variant = CAT_VARIANTS.includes(String(t)) ? String(t) : e.variant)
        : "pig" === n || "cow" === n || "chicken" === n
          ? (e.cvar = /warm|cold|temperate/.test(String(t)) ? String(t) : e.cvar)
          : "zombie_nautilus" === n
            ? (e.coral = /warm|coral/.test(String(t)))
            : "number" == typeof t && (e.variant = t);
  }
  if (has("flags") && "number" == typeof s.flags) {
    const t = s.flags;
    e instanceof Horse
      ? ((e.tame = flag(t, 2)),
        (e.eatT = flag(t, 16) ? 30 : 0),
        (e.rearT = flag(t, 32) ? 15 : 0),
        (e.mouthT = flag(t, 64) ? 5 : 0))
      : "wolf" === n || "parrot" === n || "cat" === n || "nautilus" === n || "zombie_nautilus" === n
        ? ((e.sitting = flag(t, 1)), (e.owner = flag(t, 4) ? e.owner || !0 : null))
        : "fox" === n
          ? ((e.sleeping = flag(t, 32)), (e.crouch = flag(t, 4) ? 5 : 0), (e.sitting = flag(t, 1)))
          : "panda" === n
            ? ((e.sneezeT = flag(t, 2) ? 10 : 0),
              (e.rollT = flag(t, 4) ? 16 : 0),
              (e.sit = flag(t, 8) ? 20 : 0))
            : "bee" === n
              ? ((e.stung = flag(t, 4)), (e.nectar = flag(t, 8)))
              : "bat" === n
                ? (e.resting = flag(t, 1))
                : "vex" === n && (e.chargeT = flag(t, 1) ? 20 : 0);
  }
  if (
    (has("anger_end_time") && (e.anger = Number(s.anger_end_time) > 0 ? 400 : 0),
    "wolf" === n &&
      (has("collar_color") && (e.collar = DYES[0 | s.collar_color] || "red"),
      (e.target = e.anger > 0 ? t.g.player : null)),
    "bee" === n && (e.target = e.anger > 0 ? t.g.player : null),
    "horse" === n && has("type_variant"))
  ) {
    const t = 0 | s.type_variant;
    e.variant = (255 & t) + 8 * ((t >> 8) & 255);
  }
  if (
    (has("chest") && ((e.chest = !!s.chest), e.chest && !e.chestInv && (e.chestInv = [])),
    has("strength") && (e.strength = s.strength),
    "camel" === n || "camel_husk" === n)
  ) {
    if (has("last_pose_change_tick")) {
      const t = Number(s.last_pose_change_tick) < 0;
      t !== !!e.sit && ((e.sit = t), (e.sitT = 0), (e.anims = {}));
    }
    s.dash ? (e.anims.CAMEL_DASH = e.age) : has("dash") && delete e.anims.CAMEL_DASH;
  }
  if (("fox" === n && has("type") && (e.variant = 1 === s.type ? "snow" : "red"), "panda" === n)) {
    const t = ["normal", "lazy", "worried", "playful", "brown", "weak", "aggressive"];
    (has("main_gene") && (e.main = t[0 | s.main_gene] || "normal"),
      has("hidden_gene") && (e.hidden = t[0 | s.hidden_gene] || "normal"));
  }
  if (
    ("rabbit" === n &&
      has("type") &&
      (e.variant =
        {
          0: "brown",
          1: "white",
          2: "black",
          3: "white_splotched",
          4: "gold",
          5: "salt",
          99: "evil",
        }[s.type] || "brown"),
    "axolotl" === n && has("playing_dead") && (e.deadT = s.playing_dead ? 20 : 0),
    "tropical_fish" === n && has("type_variant"))
  ) {
    const t = 0 | s.type_variant;
    ((e.shape = 255 & t ? 1 : 0),
      (e.pattern = (t >> 8) & 255),
      (e.base = (t >> 16) & 255),
      (e.pcol = (t >> 24) & 255));
  }
  if (
    ("pufferfish" === n && has("puff_state") && (e.puff = clamp(0 | s.puff_state, 0, 2)),
    "salmon" === n &&
      has("type") &&
      (e.size = ["small", "medium", "large"][0 | s.type] || "medium"),
    "mooshroom" === n && has("type") && (e.variant = 1 === s.type ? "brown" : "red"),
    "goat" === n &&
      (has("is_screaming_goat") && (e.screaming = !!s.is_screaming_goat),
      has("has_left_horn") && (e.horns[0] = !!s.has_left_horn),
      has("has_right_horn") && (e.horns[1] = !!s.has_right_horn)),
    ("slime" === n || "magma_cube" === n) &&
      has("size") &&
      e.setSize &&
      e.setSize(Math.max(1, 0 | s.size)),
    "shulker" === n &&
      (has("peek") && (e.peek = (0 | s.peek) / 100),
      has("color") && (e.color = s.color >= 0 && s.color < 16 ? DYES[s.color] : null),
      has("attach_face")))
  ) {
    const t = ["down", "up", "north", "south", "west", "east"],
      i = s.attach_face;
    e.attachFace = "number" == typeof i ? t[i] : String(i || "down").toLowerCase();
  }
  if (
    ("snow_golem" === n && has("pumpkin") && (e.pumpkin = !!(16 & s.pumpkin)),
    "armadillo" === n && has("armadillo_state"))
  ) {
    const t = s.armadillo_state;
    t !== e.st && ((e.st = t), (e.stT = "scared" === t ? 100 : 0), (e.anims = { [t]: e.age }));
  }
  if ("sniffer" === n && has("state")) {
    const t = s.state;
    ((e.st = "digging" === t ? "dig" : "searching" === t || "sniffing" === t ? "sniff" : "idle"),
      (e.stT = 0),
      "scenting" === t && (e.anims.SNIFFSNIFF = e.age));
  }
  if (
    ("creaking" === n && has("can_move") && (e.frozen = !s.can_move),
    "copper_golem" === n &&
      (has("weather_state") &&
        (e.ox = ["unaffected", "exposed", "weathered", "oxidized"].indexOf(s.weather_state)),
      e.ox < 0 && (e.ox = 0),
      has("copper_golem_state")))
  ) {
    const t = {
      getting_item: "CHEST_INTERACTION_NOITEM_GET",
      getting_no_item: "CHEST_INTERACTION_NOITEM_NOGET",
      dropping_item: "CHEST_INTERACTION_ITEM_DROP",
      dropping_no_item: "CHEST_INTERACTION_ITEM_NODROP",
    }[s.copper_golem_state];
    t && (e.anims = { [t]: e.age });
  }
  if (
    (("item_frame" !== n && "glow_item_frame" !== n) ||
      (has("item") && (e.item = s.item ? t.stackIn(s.item) : null),
      has("rotation") && (e.rot = 0 | s.rotation)),
    "painting" === n && has("painting_variant"))
  ) {
    const t = PAINTINGS.find((t) => t.key === String(s.painting_variant));
    t && ((e.v = t), e.resize());
  }
  if (
    ("ender_dragon" === n &&
      has("phase") &&
      (e.phase = [5, 6, 7].includes(0 | s.phase) ? "perch" : "fly"),
    "end_crystal" === n &&
      (has("show_bottom") && (e.showBase = !!s.show_bottom),
      has("beam_target") &&
        (e.beamTarget = s.beam_target
          ? [s.beam_target[0], s.beam_target[1] - t.minY, s.beam_target[2]]
          : null)),
    "armor_stand" === n &&
      has("client_flags") &&
      ((e.small = flag(s.client_flags, 1)), (e.arms = flag(s.client_flags, 4))),
    ("villager" !== n && "zombie_villager" !== n) ||
      !s.villager_data ||
      ((e.vtype = s.villager_data.type), (e.profession = s.villager_data.profession)),
    "turtle" === n && has("has_egg") && (e.hasEgg = !!s.has_egg),
    "wither" === n && has("inv") && (e.invulT = 0 | s.inv),
    "wither" === n &&
      [
        ["target_b", 0],
        ["target_c", 1],
      ].forEach(([i, n]) => {
        has(i) &&
          (e.headTargets[n] = s[i]
            ? s[i] === t.eid
              ? t.g.player
              : t.ents.get(s[i]) || null
            : null);
      }),
    ("guardian" === n || "elder_guardian" === n) && has("attack_target"))
  ) {
    const i = s.attack_target
      ? s.attack_target === t.eid
        ? t.g.player
        : t.ents.get(s.attack_target)
      : null;
    ((e.target = i || null), (e.beamT = i ? Math.max(0, e.beamT || 0) : -1));
  }
  if (
    ("evoker" === n && has("spell_casting") && (e.spellT = s.spell_casting ? 20 : 0),
    "pillager" === n && has("is_charging_crossbow") && (e.charging = !!s.is_charging_crossbow),
    "witch" === n && has("using_item") && (e.drinkT = s.using_item ? 10 : 0),
    "ghast" === n && has("is_charging") && (e.charge = s.is_charging ? 20 : 0),
    "creeper" === n &&
      has("swell_dir") &&
      (s.swell_dir > 0 && e.fuse < 0 && (e.fuse = 0), s.swell_dir < 0 && (e.fuse = -1)),
    "polar_bear" === n && has("standing") && (e.stand = s.standing ? 20 : 0),
    "ocelot" === n && has("trusting") && (e.trusting = !!s.trusting),
    "allay" === n && has("dancing") && (e.dance = !!s.dancing),
    "strider" === n && has("suffocating") && (e.warm = !s.suffocating),
    "sheep" === n && has("wool") && ((e.woolColor = 15 & s.wool), (e.sheared = !!(16 & s.wool))),
    "tnt" === n && has("fuse") && (e.fuse = 0 | s.fuse),
    "fishing_bobber" === n &&
      has("hooked_entity") &&
      (e.hooked = (s.hooked_entity && t.ents.get(s.hooked_entity - 1)) || null),
    ("arrow" !== n && "spectral_arrow" !== n && "trident" !== n) ||
      (has("in_ground") && (e.inGround = e.stuck = !!s.in_ground)),
    i)
  )
    if (e instanceof Warden) {
      const t = { emerging: "EMERGE", digging: "DIG", roaring: "ROAR", sniffing: "SNIFF" }[i];
      t && !(t in e.anims) && (e.anims = { [t]: e.age });
    } else if (e instanceof Breeze) {
      const t = { shooting: "SHOOT", inhaling: "INHALE", sliding: "SLIDE", long_jumping: "JUMP" }[
        i
      ];
      t ? (e.anims = { [t]: e.age }) : "standing" === i && (e.anims = {});
    } else if (e instanceof Frog) {
      const t = { croaking: "CROAK", using_tongue: "TONGUE", long_jumping: "JUMP" }[i];
      t && (e.anims = { [t]: e.age });
    } else if (e instanceof Camel) {
      const t = "sitting" === i;
      t !== !!e.sit && ((e.sit = t), (e.sitT = 0), (e.anims = {}));
    }
}
function netApplyEquip(t, e, s) {
  const st = (e) => (void 0 !== s[e] ? (s[e] ? t.stackIn(s[e]) : null) : void 0),
    i = st(0),
    n = st(1),
    o = st(6),
    a = st(7);
  if (
    (void 0 !== i && ((e.hand = i), (e.heldId = i && !i.unk ? i.id : null)),
    void 0 !== n && (e.offhand = n),
    e.armorItems || e.gear || e instanceof Mob)
  ) {
    const t = [st(5), st(4), st(3), st(2)];
    if (e.gear) {
      const t = [
        [2, 0],
        [3, 1],
        [4, 2],
        [5, 3],
      ];
      for (const [s, i] of t) {
        const t = st(s);
        void 0 !== t && (e.gear[i] = t);
      }
      (void 0 !== i && (e.gear[4] = i), void 0 !== n && (e.gear[5] = n));
    } else
      (e.armorItems || (e.armorItems = []),
        t.forEach((t, s) => {
          void 0 !== t && (e.armorItems[s] = t);
        }));
  }
  if ((void 0 !== a && (e.saddled = !!a), void 0 !== o)) {
    const t = o && ITEMS[o.id] ? ITEMS[o.id].key : "";
    e instanceof Llama
      ? (e.carpet = /_carpet$/.test(t) ? o : null)
      : e instanceof Horse
        ? (e.armorItem = o)
        : e instanceof Wolf
          ? (e.armor = o)
          : e instanceof HappyGhast
            ? (e.harness = o)
            : e instanceof Nautilus && (e.armorItem = o);
  }
}
function netStatus(t, e, s) {
  if (
    (e instanceof Warden && 4 === s && (e.anims.ATTACK = e.age),
    e instanceof Warden && 62 === s && (e.anims.SONIC_BOOM = e.age),
    e instanceof Ravager && 4 === s && (e.atkT = 10),
    e instanceof Ravager && 39 === s && (e.stunT = 40),
    e instanceof Goat && 58 === s && (e.ramT = 40),
    (e instanceof Wolf || e instanceof Ocelot || e instanceof Parrot) && (6 === s || 7 === s))
  )
    for (let i = 0; i < 7; i++)
      t.g.particles.spawn(
        7 === s ? "heart" : "smoke",
        e.pos[0] + (Math.random() - 0.5),
        e.pos[1] + e.h,
        e.pos[2] + (Math.random() - 0.5),
        0,
        0.02,
        0,
      );
  if (18 === s)
    for (let s = 0; s < 7; s++)
      t.g.particles.spawn(
        "heart",
        e.pos[0] + (Math.random() - 0.5),
        e.pos[1] + e.h,
        e.pos[2] + (Math.random() - 0.5),
        0,
        0.02,
        0,
      );
  e instanceof Creaking && 66 === s && (e.anims.INVULNERABLE = e.age);
}
function netMapData(t, e) {
  const s = t.g,
    i = "n" + e.id,
    n = s.netMaps || (s.netMaps = {}),
    o =
      n[i] ||
      (n[i] = {
        px: new Uint8Array(16384),
        scale: 0,
        locked: !1,
        cx: 0,
        cz: 0,
        dim: s.dim,
        net: !0,
      });
  if (
    ((o.scale = e.scale), (o.locked = e.locked), (o.icons = e.icons || o.icons), e.rect && e.data)
  ) {
    const [t, s, i, n] = e.rect,
      a = atob(e.data);
    for (let e = 0; e < n; e++)
      for (let n = 0; n < i; n++) {
        const r = 128 * (s + e) + t + n;
        r < 16384 && (o.px[r] = a.charCodeAt(e * i + n));
      }
  }
  o.dirty = !0;
}
((() => {
  const t = Game.prototype.mapData;
  Game.prototype.mapData = function (e) {
    return "string" == typeof e && "n" === e[0]
      ? (this.netMaps && this.netMaps[e]) || null
      : t.call(this, e);
  };
  const e = Game.prototype.updateMap;
  Game.prototype.updateMap = function (t) {
    if (!t || !t.net) return e.call(this, t);
  };
})(),
  (() => {
    const t = netEntityTick;
    netEntityTick = function () {
      const e = this.game.player;
      if (this.rider === e && e.rideInput) {
        if (this.vm && this.ridden) {
          (this.savePrev(), this.age++, this.updateFluids());
          const t = this.ctl;
          return (
            (t.fwd = 0),
            (t.strafe = 0),
            (t.jump = !1),
            (t.mod = 1),
            (t.goal = null),
            (t.look = null),
            (t.up = 0),
            (t.face = null),
            this.ridden(t, e.rideInput),
            this.moveBy(t),
            this.animate(),
            this.hurtTime > 0 && this.hurtTime--,
            void e.followVehicle(this)
          );
        }
        if ("undefined" != typeof STICK_FOR && STICK_FOR[this.type])
          return void Mob.prototype.tick.call(this);
      }
      if ((t.call(this), this.rider))
        if (this.rider === e) e.followVehicle(this);
        else if (this.seat) {
          const t = this.seat();
          ((this.rider.pos = t), (this.rider.netPos = t.slice()), (this.rider.lerpN = 0));
        }
    };
  })());
const NET_DELAY = 110;
(() => {
  const t = NetClient.prototype.onMessage;
  NetClient.prototype.onMessage = function (e) {
    const s = t.call(this, e);
    if ("move" === e.t && void 0 !== e.x) {
      const t = this.ents.get(e.id) || this.pendingItems.get(e.id);
      if (t && (!t.netVel || t.tick !== netShotTick)) {
        const s = performance.now(),
          i = t.snaps || (t.snaps = []),
          n = i[i.length - 1];
        e.tp &&
          n &&
          Math.hypot(t.netPos[0] - n[1], t.netPos[1] - n[2], t.netPos[2] - n[3]) > 8 &&
          (i.length = 0);
        const o = i.length ? s - i[i.length - 1][0] : 1e9;
        (o < 400 && (t.snapGap = 0.8 * (t.snapGap || 50) + 0.2 * o),
          i.push([s, t.netPos[0], t.netPos[1], t.netPos[2]]),
          i.length > 8 && i.shift());
      }
    }
    if ("remove" === e.t)
      for (const t of e.ids) {
        const e = this.ents.get(t);
        e && (e.snaps = null);
      }
    return s;
  };
  const wrap = (t) =>
    function () {
      const e = this.game.player,
        s = this.vehicleRef;
      if (s && s.rider === this && !s.dead) {
        if (((this.snaps = null), s.seat)) {
          const t = s.seat();
          ((this.pos = t), (this.netPos = t.slice()), (this.lerpN = 0));
        }
      } else if (this.rider !== e || !(this instanceof Boat || (this.vm && this.ridden))) {
        const t = ((t) => {
          const e = t.snaps;
          if (!e || !e.length) return null;
          const s = performance.now() - Math.max(110, 1.5 * (t.snapGap || 0));
          if (e[0][0] >= s) return [e[0][1], e[0][2], e[0][3]];
          const i = e[e.length - 1];
          if (i[0] <= s) return [i[1], i[2], i[3]];
          let n = e.length - 1;
          for (; n > 0 && e[n - 1][0] > s;) n--;
          const o = e[n - 1],
            a = e[n],
            r = (s - o[0]) / Math.max(1, a[0] - o[0]);
          return [o[1] + (a[1] - o[1]) * r, o[2] + (a[2] - o[2]) * r, o[3] + (a[3] - o[3]) * r];
        })(this);
        t && ((this.netPos = t), (this.lerpN = 1));
      }
      return t.call(this);
    };
  ((netEntityTick = wrap(netEntityTick)),
    (netItemTick = wrap(netItemTick)),
    (netVehicleTick = wrap(netVehicleTick)));
})();
const NET_CHUNK_MSG = new Set(["block", "blocks", "unload", "signs", "be"]);
(() => {
  const t = NetClient.prototype.onBinary,
    e = NetClient.prototype.onMessage;
  ((NetClient.prototype.onBinary = function (t) {
    (this.cq || (this.cq = [])).push([0, t]);
  }),
    (NetClient.prototype.onMessage = function (t) {
      if (!NET_CHUNK_MSG.has(t.t))
        return (("respawn" !== t.t && "login" !== t.t) || (this.cq = []), e.call(this, t));
      (this.cq || (this.cq = [])).push([1, t]);
    }),
    (NetClient.prototype.drainChunks = function (s) {
      const i = this.cq;
      if (!i || !i.length) return;
      const n = performance.now(),
        o = i.length > 300 ? 2 * s : s;
      let a = 0;
      for (; a < i.length && (0 === a || performance.now() - n < o);) {
        const [s, n] = i[a++];
        try {
          0 === s ? t.call(this, n) : e.call(this, n);
        } catch (t) {
          console.error("net", t);
        }
      }
      i.splice(0, a);
      const r = this.g.pacer;
      r && (r.chunkMs += performance.now() - n);
    }));
  const s = Game.prototype.frame;
  Game.prototype.frame = function (...t) {
    return (
      this.net &&
        this.net.drainChunks(
          "loading" === this.state ? Math.max(6, this.chunkBudget()) : this.chunkBudget(),
        ),
      s.apply(this, t)
    );
  };
  const i = Game.prototype.applySettings;
  Game.prototype.applySettings = function (...t) {
    const e = i.apply(this, t),
      s = this.net;
    if (s) {
      const t = netRd(this);
      t !== s.seenRd && ((s.seenRd = t), s.settingsSoon());
    }
    return e;
  };
})();
const NET_RB_TAB = {
  crafting_equipment: 1,
  crafting_building_blocks: 2,
  crafting_misc: 3,
  crafting_redstone: 4,
};
function netRecipe(t) {
  const ids = (t) => (t || []).map((t) => ITEM_KEY[t]).filter((t) => void 0 !== t),
    e = ITEM_KEY[t.result];
  if (void 0 === e) return null;
  const s = { netId: t.id, result: e, count: t.count || 1, cat: NET_RB_TAB[t.cat] || 3 };
  if (t.shaped) {
    ((s.type = "shaped"), (s.w = t.w), (s.h = t.h), (s.keys = {}), (s.pattern = []));
    for (let e = 0; e < t.h; e++) {
      let i = "";
      for (let n = 0; n < t.w; n++) {
        const o = ids(t.ing[e * t.w + n]);
        if (!o.length) {
          i += " ";
          continue;
        }
        const a = String.fromCharCode(65 + e * t.w + n);
        ((s.keys[a] = o), (i += a));
      }
      s.pattern.push(i);
    }
  } else ((s.type = "shapeless"), (s.ing = t.ing.map(ids).filter((t) => t.length)));
  return s;
}
((() => {
  const t = NetClient.prototype.onMessage;
  NetClient.prototype.onMessage = function (e) {
    if ("recipes" !== e.t) {
      if ("ghost" === e.t) {
        const t = this.g.ui.screen,
          s = netRecipe(e);
        return void (s && t instanceof CraftingScreen && t.netWin === e.win && t.showGhost(s));
      }
      return t.call(this, e);
    }
    (!e.replace && this.recipes) || (this.recipes = new Map());
    for (const t of e.add || []) {
      const e = netRecipe(t);
      e && this.recipes.set(t.id, e);
    }
    for (const t of e.remove || []) this.recipes.delete(t);
  };
  const e = CraftingScreen.prototype.bookRecipes;
  CraftingScreen.prototype.bookRecipes = function () {
    if (!this.net) return e.call(this);
    const t = this.size * this.size,
      s = this.game.player.inv,
      i = new Map(),
      add = (t) => {
        t && !t.unk && i.set(t.id, (i.get(t.id) || 0) + t.count);
      };
    for (let t = 0; t < 36; t++) add(s.slots[t]);
    for (const t of this.slots) "craft" === t.group && add(t.get());
    const n = this.search.trim().toLowerCase(),
      o = new Map();
    for (const e of (this.net.recipes || new Map()).values()) {
      if ("shaped" === e.type ? e.w > this.size || e.h > this.size : e.ing.length > t) continue;
      if (this.tab > 0 && e.cat !== this.tab) continue;
      if (n && !ITEMS[e.result].cn.toLowerCase().includes(n) && !ITEMS[e.result].key.includes(n))
        continue;
      const s = planRecipe(e, i, this.size);
      let a = o.get(e.result);
      a
        ? ((a.many = !0), !a.plan && s && ((a.r = e), (a.plan = s)))
        : o.set(e.result, (a = { r: e, plan: s, many: !1 }));
    }
    let a = [...o.values()];
    return (
      this.onlyCraftable && (a = a.filter((t) => t.plan)),
      a.sort((t, e) => (e.plan ? 1 : 0) - (t.plan ? 1 : 0)),
      a
    );
  };
  const s = CraftingScreen.prototype.fillRecipe;
  ((CraftingScreen.prototype.fillRecipe = function (t, e) {
    if (!this.net) return s.call(this, t, e);
    ((this.ghost = null),
      this.net.send({ t: "craft", win: this.netWin, id: t.r.netId, all: !!e }),
      Sound.click());
  }),
    (CraftingScreen.prototype.showGhost = function (t) {
      const e = new Array(this.size * this.size).fill(null);
      if ("shaped" === t.type)
        for (let s = 0; s < t.h; s++)
          for (let i = 0; i < t.w; i++) {
            const n = t.pattern[s][i];
            n && " " !== n && (e[s * this.size + i] = t.keys[n]);
          }
      else
        t.ing.forEach((t, s) => {
          e[s] = t;
        });
      this.ghost = { slots: e, result: t.result, t: performance.now() };
    }));
  const i = CraftingScreen.prototype.drawGhost;
  CraftingScreen.prototype.drawGhost = function (t) {
    return (
      this.net &&
        this.ghost &&
        this.slots.some((t) => "craft" === t.group && t.get()) &&
        (this.ghost = null),
      i.call(this, t)
    );
  };
})(),
  (() => {
    const t = NetClient.prototype.onMessage;
    NetClient.prototype.onMessage = function (e) {
      const s = t.call(this, e),
        i = this.g.player;
      return (
        "meta" === e.t &&
        e.m &&
        "number" == typeof e.m.attached_to_target &&
        e.m.attached_to_target - 1 === this.eid &&
        i
          ? ((this.rocket = e.id), (i.boostT = 60))
          : "remove" === e.t &&
            null != this.rocket &&
            e.ids.includes(this.rocket) &&
            ((this.rocket = null), i && (i.boostT = 0)),
        s
      );
    };
  })(),
  (() => {
    const sub = (t, e, s) => ((t = String(t)).includes(e) ? t.split(e).join(s) : t),
      t = NetClient.prototype.onMessage;
    NetClient.prototype.onMessage = function (e) {
      if ("names" === e.t) {
        const t = this.alias || (this.alias = new Map());
        for (const [s, i] of Object.entries(e.map || {})) s !== i && t.set(s, i);
        const s = this.colors || (this.colors = new Map());
        for (const [t, i] of Object.entries(e.colors || {})) i ? s.set(t, i) : s.delete(t);
        return;
      }
      if ("announce" === e.t) return void showAnnounce(this.g, e);
      const s = this.alias;
      if (s && s.size)
        if ("chat" === e.t && e.text) for (const [t, i] of s) e.text = sub(e.text, t, i);
        else
          "players" === e.t && e.list
            ? (e.list = e.list.map((t) => ({ ...t, name: s.get(t.name) || t.name })))
            : "spawn" === e.t && e.name && (e.name = s.get(e.name) || e.name);
      const i = t.call(this, e),
        n = this.colors,
        o = this.g.ui.chat[this.g.ui.chat.length - 1];
      if ("chat" === e.t && n && n.size && o && !o.parts) {
        const t = /^<([^>]+)> /.exec(o.text),
          e = t && n.get(t[1]);
        e &&
          (o.parts = [
            ["<", o.color],
            [t[1], e],
            [o.text.slice(t[1].length + 1), o.color],
          ]);
      }
      return i;
    };
    const e = NetClient.prototype.chat;
    NetClient.prototype.chat = function (t) {
      const s = this.alias;
      if (s && s.size && String(t).startsWith("/")) for (const [e, i] of s) t = sub(t, i, e);
      return e.call(this, t);
    };
  })(),
  (() => {
    const t = NetClient.prototype.onMessage;
    NetClient.prototype.onMessage = function (e) {
      const s = t.call(this, e),
        i = this.g.ui.chat[this.g.ui.chat.length - 1];
      if (e && "chat" === e.t && "undefined" != typeof Cosmetics && i && !i.pre) {
        i.pre = !0;
        const t = /^<([^>]+)> /.exec(i.text),
          e = t && Cosmetics.preName(this.g, t[1]);
        e &&
          e !== t[1] &&
          ((i.text = "<" + e + i.text.slice(t[1].length + 1)),
          i.parts && i.parts[1] && (i.parts[1] = [e, i.parts[1][1]]));
      }
      return s;
    };
  })(),
  (() => {
    const t = NetClient.prototype.onMessage;
    NetClient.prototype.onMessage = function (e) {
      const s = this.g,
        i = s.player;
      if ("vel" === e.t && e.id === this.eid && i && Array.isArray(e.v))
        return ((i.vel = e.v.slice()), void (i.onGround = !1));
      if ("boom" === e.t) {
        const t = e.y - this.minY,
          n = /wind/.test(e.snd || "");
        if (
          (e.snd
            ? Sound.ev(e.snd, [e.x, t, e.z], 4, 1)
            : Sound.ev("entity.generic.explode", [e.x, t, e.z], 4, 1),
          s.particles.spawn(n ? "poof" : "explosion", e.x, t, e.z, 0, 0, 0),
          n)
        )
          for (let i = 0; i < 8; i++)
            s.particles.spawn(
              "poof",
              e.x + (Math.random() - 0.5),
              t + Math.random(),
              e.z + (Math.random() - 0.5),
              0.2 * (Math.random() - 0.5),
              0.05,
              0.2 * (Math.random() - 0.5),
            );
        return void (
          e.kb &&
          i &&
          ((i.vel[0] += e.kb[0]),
          (i.vel[1] += e.kb[1]),
          (i.vel[2] += e.kb[2]),
          e.kb[1] > 0 && (i.onGround = !1))
        );
      }
      if (
        ("status" === e.t &&
          e.id === this.eid &&
          9 === e.s &&
          i &&
          ((i.usingItem = null), (i.useT = 0), (i.useHand = null)),
        "death" === e.t && e.msg && this.alias)
      )
        for (const [t, s] of this.alias) e.msg = String(e.msg).split(t).join(s);
      return ("pos" === e.t && i && (this.unstick = 40), t.call(this, e));
    };
    const e = Game.prototype.netTick;
    Game.prototype.netTick = function () {
      const t = e.apply(this, arguments),
        s = this.player,
        i = this.net;
      if (!i || !s || s.noClip || "spectator" === this.mode || !(i.unstick > 0)) return t;
      if ((i.unstick--, !s.collides(s.box()))) return t;
      let n = null;
      for (const [t, e, i] of [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 0, 1],
        [0, 0, -1],
        [0, 1, 0],
      ])
        for (let o = 0.1; o <= 1.6; o += 0.1) {
          const a = s.box(),
            r = [t * o, e * o, i * o];
          if (
            !s.collides([
              a[0] + r[0],
              a[1] + r[1],
              a[2] + r[2],
              a[3] + r[0],
              a[4] + r[1],
              a[5] + r[2],
            ])
          ) {
            (!n || o < n.d) && (n = { o: r, d: o });
            break;
          }
        }
      if (n) {
        for (let t = 0; t < 3; t++) s.pos[t] += n.o[t];
        s.prev = [...s.pos];
      }
      return t;
    };
  })(),
  (() => {
    const t = Game.prototype.tick;
    Game.prototype.tick = function () {
      const e = this.net && "play" === this.state && this.ui && this.ui.screen;
      if (!e || !e.pauses) return t.call(this);
      const s = Object.getOwnPropertyDescriptor(e, "pauses");
      ((this.mouseBtn = [!1, !1, !1]),
        (this.mouseClicked0 = this.useClicked = !1),
        Object.defineProperty(e, "pauses", { value: !1, configurable: !0, writable: !0 }));
      try {
        return t.call(this);
      } finally {
        s ? Object.defineProperty(e, "pauses", s) : delete e.pauses;
      }
    };
  })(),
  (() => {
    const t = OptionsScreen.prototype.layout;
    OptionsScreen.prototype.layout = function () {
      t.call(this);
      const e = this.game;
      if ((!e.net && !e.p2pGuest) || "play" !== e.state) return;
      const s = this.widgets.find(
          (t) => t && "function" == typeof t.label && /^难度：/.test(String(t.label())),
        ),
        i = e.net && e.net.room && e.net.room.isOwner;
      s &&
        Object.assign(s, {
          enabled: !1,
          onClick: () => {},
          label: "难度：" + (e.net && !e.net.room ? "由服务器决定" : "由房主决定"),
          tip: [
            i
              ? "在 暂停菜单 → 房间… 里改难度"
              : e.net && !e.net.room
                ? "服务器的难度由服务器的管理员决定"
                : "房间的难度只有房主能改",
          ],
        });
    };
  })(),
  (Game.prototype.requestMode = function (t) {
    this.net
      ? (0 | this.net.opLevel) < 2
        ? this.ui.message("[调试]：无法切换游戏模式；没有权限", "#FF5555")
        : this.net.chat("/gamemode " + t)
      : this.setMode(t);
  }),
  (() => {
    const t = {
        up: (t) => M4.rotX(t, Math.PI),
        north: (t) => M4.rotX(t, Math.PI / 2),
        south: (t) => M4.rotX(t, -Math.PI / 2),
        west: (t) => M4.rotZ(t, -Math.PI / 2),
        east: (t) => M4.rotZ(t, Math.PI / 2),
      },
      e = Shulker.prototype.preDraw;
    Shulker.prototype.preDraw = function (s, i) {
      const n = this.attachFace && t[this.attachFace];
      if (n) {
        const t = this.ipos ? this.ipos(i) : this.pos,
          e = M4.create();
        (M4.translate(e, t[0], t[1] + 0.5, t[2]), n(e), M4.translate(e, 0, -0.5, 0), s.set(e));
      }
      if (e) return e.call(this, s, i);
    };
  })());
//# sourceURL=js/net.js
