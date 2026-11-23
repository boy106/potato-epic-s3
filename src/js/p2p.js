"use strict";
const P2P_MAX = 4,
  p2pUrl = () => RoomService.base().replace(/^http/, "ws") + "/p2p",
  p2pBlocks = { applying: 0 };
function p2pPackChunk(t) {
  const e = new Uint8Array(t.b.buffer, t.b.byteOffset, t.b.byteLength),
    s = new Uint8Array(t.m.buffer, t.m.byteOffset, t.m.byteLength),
    i = t.w ? new Uint8Array(t.w.buffer, t.w.byteOffset, t.w.byteLength) : new Uint8Array(0),
    n = new Uint8Array(12 + e.length + s.length + i.length),
    o = new DataView(n.buffer);
  return (
    o.setUint32(0, t.b.length),
    o.setUint32(4, t.m.length),
    o.setUint32(8, t.w ? t.w.length : 0),
    n.set(e, 12),
    n.set(s, 12 + e.length),
    n.set(i, 12 + e.length + s.length),
    n
  );
}
function p2pUnpackChunk(t) {
  const e = new DataView(t.buffer, t.byteOffset, t.byteLength),
    s = e.getUint32(0),
    i = e.getUint32(4),
    n = e.getUint32(8),
    copy = (e, s, i, n) => {
      const o = new i(s);
      return (new Uint8Array(o.buffer).set(t.subarray(e, e + s * n)), o);
    },
    o = { b: copy(12, s, Uint16Array, 2), m: copy(12 + 2 * s, i, Uint16Array, 2) };
  return (n && (o.w = copy(12 + 2 * s + 2 * i, n, Uint32Array, 4)), o);
}
function p2pFrame(t, e, s) {
  const i = new Uint8Array(5 + s.length);
  return ((i[0] = t), new DataView(i.buffer).setUint32(1, e), i.set(s, 5), i);
}
const beJson = (t) => {
    try {
      return JSON.stringify(t, (t, e) =>
        "open" === t || "lid" === t || "viewers" === t ? void 0 : e,
      );
    } catch (t) {
      return "";
    }
  },
  beKey = (t) => "string" == typeof t && /^-?\d+,-?\d+,-?\d+$/.test(t),
  p2pItem = (t) => (null != t && ITEMS[t] ? t : null),
  p2pLooks = (t) => {
    const e = !!t && "function" == typeof stackGlint && stackGlint(t);
    return t && (e || t.trim) ? { g: e ? 1 : 0, trim: t.trim || null } : null;
  },
  p2pArmx = (t) => {
    const e = t.map(p2pLooks);
    return e.some((t) => t) ? e : void 0;
  },
  p2pStack = (t, e) => {
    if (null == p2pItem(t)) return null;
    const s = { id: t, count: 1, dmg: 0 },
      i = e && e.trim,
      w = (t) => "string" == typeof t && /^[a-z_]{1,32}$/.test(t);
    return (
      e && e.g && (s.g = !0),
      i && w(i.pattern) && w(i.material) && (s.trim = { pattern: i.pattern, material: i.material }),
      s
    );
  },
  p2pBytes = (t) =>
    "string" != typeof t
      ? t.length
      : 3 * t.length <= 65536
        ? 3 * t.length
        : new TextEncoder().encode(t).length,
  p2pWord = (t) => ("string" == typeof t && /^[a-z]{3,16}$/.test(t) ? t : null),
  p2pLook = (t) =>
    t && "object" == typeof t
      ? {
          skin:
            "string" == typeof t.skin && /^(p:[a-z_]{3,20}|m:[A-Za-z0-9_]{3,16})$/.test(t.skin)
              ? t.skin
              : null,
          slim: !!t.slim,
          cape:
            p2pWord(t.cape) && "undefined" != typeof Capes && Capes.info(t.cape) ? t.cape : null,
          hat: p2pWord(t.hat),
          pet: p2pWord(t.pet),
          pre: p2pWord(t.pre),
        }
      : null;
function p2pSendList(t, e, s) {
  const i = JSON.stringify({ t: e, list: s });
  if (s.length < 2 || p2pBytes(i) <= t.maxSize() - 256) return t.send(i);
  const n = s.length >> 1;
  return (p2pSendList(t, e, s.slice(0, n)), p2pSendList(t, e, s.slice(n)));
}
function p2pFrames(t, e, s) {
  if (e.length + 5 <= s) return [p2pFrame(1, t, e)];
  const i = [],
    n = s - 6;
  for (let s = 0; s < e.length; s += n) {
    const o = e.subarray(s, s + n),
      a = new Uint8Array(6 + o.length);
    ((a[0] = 2),
      new DataView(a.buffer).setUint32(1, t),
      (a[5] = s + n >= e.length ? 1 : 0),
      a.set(o, 6),
      i.push(a));
  }
  return i;
}
class P2PLink {
  constructor(t, e, s) {
    ((this.ice = t), (this.onMsg = e), (this.onState = s), (this.pending = []));
  }
  make(t) {
    const e = (this.pc = new RTCPeerConnection({
      iceServers: this.ice.iceServers || [],
      iceTransportPolicy: this.ice.relayOnly ? "relay" : "all",
    }));
    return (
      (e.onicecandidate = (e) => {
        e.candidate && t({ cand: e.candidate.toJSON() });
      }),
      (e.onconnectionstatechange = () => this.onState(e.connectionState)),
      e
    );
  }
  wire(t) {
    ((this.dc = t),
      (t.binaryType = "arraybuffer"),
      (t.onopen = () => this.onState("open")),
      (t.onclose = () => this.onState("closed")),
      (t.onmessage = (t) => {
        try {
          this.onMsg("string" == typeof t.data ? JSON.parse(t.data) : new Uint8Array(t.data));
        } catch (t) {
          console.warn("p2p message", t);
        }
      }));
  }
  async signal(t, e) {
    const s = this.pc;
    if (t.sdp) {
      await s.setRemoteDescription(t.sdp);
      for (const t of this.pending) await s.addIceCandidate(t).catch(() => {});
      ((this.pending = []),
        "offer" === t.sdp.type &&
          (await s.setLocalDescription(await s.createAnswer()),
          e({ sdp: s.localDescription.toJSON() })));
    } else
      t.cand &&
        (s.remoteDescription
          ? await s.addIceCandidate(t.cand).catch(() => {})
          : this.pending.push(t.cand));
  }
  maxSize() {
    const t = this.pc && this.pc.sctp;
    return Math.min(t && t.maxMessageSize > 0 ? t.maxMessageSize : 65536, 262144);
  }
  backlog() {
    return this.dc ? this.dc.bufferedAmount : 0;
  }
  send(t) {
    const e = this.dc;
    if (!e || "open" !== e.readyState) return !1;
    if (e.bufferedAmount > 8 << 20) return !1;
    const s = t instanceof Uint8Array || "string" == typeof t ? t : JSON.stringify(t);
    if (p2pBytes(s) > this.maxSize())
      return (console.warn("p2p: message too large", t && t.t, p2pBytes(s)), !1);
    try {
      return (e.send(s), !0);
    } catch (t) {
      return (console.warn("p2p send", t), !1);
    }
  }
  close() {
    try {
      this.dc && this.dc.close();
    } catch (t) {}
    try {
      this.pc && this.pc.close();
    } catch (t) {}
  }
}
class GuestAvatar extends NetPlayer {
  constructor(t, e, s, i, n) {
    (super(t, s, i, n, e.name),
      (this.peer = e),
      (this.remote = !0),
      (this.alwaysTick = !0),
      (this.persistent = !1),
      (this.creative = !1),
      (this.spectator = !1),
      (this.netPos = [s, i, n]),
      (this.lerpN = 0),
      (this.tick = netEntityTick),
      (this.netYaw = this.netHead = this.yaw));
    const o = this;
    this.inv = {
      get held() {
        return null != o.heldId ? { id: o.heldId, count: 1, dmg: 0 } : null;
      },
      get slots() {
        return [...new Array(36).fill(null), ...(o.armorItems || [null, null, null, null])];
      },
      armorPoints: () => 0,
      armorToughness: () => 0,
    };
  }
  eye() {
    return this.sneaking ? 1.27 : 1.62;
  }
  hurt(t, e) {
    if (this.creative || this.spectator || this.deadGuest) return !1;
    const s = e || {},
      i = s.attacker || s.entity || s.source;
    return (
      this.peer.link.send({
        t: "hurt",
        dmg: t,
        kind: s.type || "mob",
        from: i && i.pos ? i.pos.map((t) => +t.toFixed(2)) : null,
        name: i && (i.name || i.type),
      }),
      (this.hurtTime = 10),
      !0
    );
  }
  isSavedEntity() {
    return !1;
  }
}
(() => {
  const t = Game.prototype.isSavedEntity;
  Game.prototype.isSavedEntity = function (e) {
    return !(e instanceof GuestAvatar || e.p2pMirror) && t.call(this, e);
  };
})();
class LocalHost {
  constructor(t, e) {
    ((this.g = t),
      (this.code = e),
      (this.peers = new Map()),
      (this.nextEnt = 1),
      (this.blocks = []),
      (this.beSent = new Map()),
      (this.state = "connecting"),
      (this.chunkLists = new Map()));
  }
  open() {
    return new Promise((t, e) => {
      const s = (this.ws = new WebSocket(p2pUrl()));
      ((s.onopen = async () => {
        const t = "undefined" != typeof Integrity ? await Integrity.reportWithin(4e3) : null;
        1 === s.readyState &&
          s.send(
            JSON.stringify({
              t: "host",
              code: this.code,
              token: Account.token || void 0,
              name: (Account.loggedIn && Account.name) || this.g.settings.netName || "Host",
              ic: t || void 0,
            }),
          );
      }),
        (s.onmessage = (s) => {
          let i;
          try {
            i = JSON.parse(s.data);
          } catch (t) {
            return;
          }
          if ("hosted" === i.t)
            ((this.ice = i.ice),
              (this.sponsor = i.sponsorText
                ? { text: i.sponsorText, seconds: i.sponsorSeconds }
                : null),
              (this.state = "open"),
              t());
          else if ("error" === i.t) ((this.state = "closed"), e(new Error(i.reason)));
          else if ("peer" === i.t) this.addPeer(i.id, i.name);
          else if ("signal" === i.t) {
            const t = this.peers.get(i.from);
            t &&
              t.link
                .signal(i.data, (e) => this.sig(t.id, e))
                .catch((t) => console.warn("p2p signal", t));
          } else "gone" === i.t && this.dropPeer(i.id, "离开了");
        }),
        (s.onclose = () => {
          ("connecting" === this.state && e(new Error("游戏正在更新中…请稍后")),
            "open" === this.state &&
              ((this.state = "closed"),
              this.g.ui.message(
                "游戏正在更新中…请稍后：已经在房间里的朋友不受影响，新的人暂时进不来",
                "#FFAA00",
              )));
        }));
    });
  }
  sig(t, e) {
    1 === this.ws.readyState && this.ws.send(JSON.stringify({ t: "signal", to: t, data: e }));
  }
  async addPeer(t, e) {
    const s = { id: t, name: e, avatar: null, state: null, look: null, joined: !1 };
    s.link = new P2PLink(
      this.ice,
      (t) => this.onMsg(s, t),
      (e) => {
        ("open" === e && this.welcome(s),
          ("failed" !== e && "closed" !== e && "disconnected" !== e) ||
            this.peers.get(t) !== s ||
            this.dropPeer(t, "failed" === e ? "没连上（网络不通）" : "离开了"));
      },
    );
    const i = s.link.make((e) => this.sig(t, e));
    (s.link.wire(i.createDataChannel("game", { ordered: !0 })),
      this.peers.set(t, s),
      await i.setLocalDescription(await i.createOffer()),
      this.sig(t, { sdp: i.localDescription.toJSON() }),
      setTimeout(() => {
        this.peers.get(t) !== s || s.joined || this.dropPeer(t, "没连上（网络不通）");
      }, 3e4));
  }
  dropPeer(t, e) {
    const s = this.peers.get(t);
    s &&
      (this.peers.delete(t),
      s.link.close(),
      s.avatar && (s.avatar.dead = !0),
      s.joined &&
        (this.g.ui.message(`${s.name} ${e}`, "#FFFF55"),
        this.toAll({ t: "chat", sys: !0, text: `${s.name} ${e}` })),
      this.ws && 1 === this.ws.readyState && this.ws.send(JSON.stringify({ t: "leave", id: t })));
  }
  toAll(t, e) {
    for (const s of this.peers.values()) s.joined && s !== e && s.link.send(t);
  }
  welcome(t) {
    const e = this.g,
      s = e.world,
      i = e.worldMeta;
    if ("overworld" !== e.dim)
      return (
        t.link.send({ t: "kicked", reason: "房主现在不在主世界：等房主回到主世界再进来" }),
        void setTimeout(() => this.dropPeer(t.id, "没能进入"), 300)
      );
    const n = new Set(s.savedIndex || []);
    for (const t of s.chunks.values()) t.modified && n.add(ckey(t.cx, t.cz));
    let o = (i.guests || {})[t.name.toLowerCase()] || null;
    !o ||
      o.health > 0 ||
      (o = {
        ...o,
        health: 20,
        food: 20,
        sat: 5,
        pos: [...(e.player.spawn || i.spawn || e.player.pos)],
      });
    const a = e.player.pos,
      r = [...e.blockEntities]
        .filter(([t]) => beKey(t))
        .map(([t, e]) => [t, JSON.parse(beJson(e) || "null")]),
      c = [],
      l = Math.min(t.link.maxSize(), 65536) - 4096;
    for (let t = 0, e = [], s = 0; t <= r.length; t++) {
      const i = t < r.length ? p2pBytes(JSON.stringify(r[t])) + 1 : 0;
      if (
        (t === r.length || (e.length && s + i > l)) &&
        (e.length && c.push({ t: "wbes", list: e }), (e = []), (s = 0), t === r.length)
      )
        break;
      (e.push(r[t]), (s += i));
    }
    const p = [...n];
    for (let t = 0; t < p.length; t += 4e3) c.push({ t: "wkeys", list: p.slice(t, t + 4e3) });
    for (const e of c) t.link.send(e);
    (t.link.send({
      t: "welcome",
      name: i.name,
      seed: i.seed,
      gen: i.gen,
      flat: !!i.flat,
      flatClassic: !!i.flatClassic,
      structures: !1 !== i.structures,
      mode: "spectator" === e.mode ? "survival" : e.mode,
      difficulty: e.difficulty,
      hardcore: !!e.hardcore,
      time: e.worldTime,
      weather: e.weather,
      rain: e.rainTarget,
      spawn: e.player.spawn || i.spawn,
      near: [a[0], a[1], a[2]],
      host: (Account.loggedIn && Account.name) || "Host",
      saved: o,
      sponsor: this.sponsor,
      players: [...this.peers.values()].filter((t) => t.joined).map((t) => t.name),
      mods:
        "undefined" != typeof Mods
          ? Mods.active.filter((t) => !Mods.isTutorial(t)).map((t) => Mods.nameOf(t))
          : [],
    }),
      (t.joined = !0),
      (t.avatar = new GuestAvatar(e, t, a[0], a[1], a[2])),
      e.entities.push(t.avatar),
      e.ui.message(`${t.name} 加入了游戏`, "#FFFF55"),
      this.toAll({ t: "chat", sys: !0, text: `${t.name} 加入了游戏` }, t),
      Telemetry.count && Telemetry.count("p2p_guest"));
  }
  avatarOf(t) {
    const e = this.g,
      s = t.avatar;
    if (s && !s.dead && e.entities.includes(s)) return s;
    const i = s ? s.netPos || s.pos : e.player.pos,
      n = (t.avatar = new GuestAvatar(e, t, i[0], i[1], i[2]));
    return (s && (n.look = s.look), e.entities.push(n), n);
  }
  onMsg(t, e) {
    const s = this.g;
    if (!(e instanceof Uint8Array || this.peers.get(t.id) !== t))
      switch (e.t) {
        case "state": {
          if (
            ((t.state = e),
            !t.joined || !Array.isArray(e.pos) || !e.pos.slice(0, 3).every(Number.isFinite))
          )
            return;
          const s = this.avatarOf(t);
          ((s.netPos = e.pos.slice(0, 3)),
            (s.lerpN = 2),
            Number.isFinite(e.yaw) && (s.netYaw = s.netHead = e.yaw),
            (s.netPitch = Number.isFinite(e.pitch) ? e.pitch : 0),
            (s.sneaking = !!e.sneak),
            e.swing && (s.swingT = 6),
            (s.heldId = p2pItem(e.held)),
            (s.hand = p2pStack(e.held, e.heldx)),
            (s.offhand = p2pStack(e.off, e.offx)),
            (s.armorItems = (Array.isArray(e.armor) ? e.armor : []).map((t, s) =>
              p2pStack(t, Array.isArray(e.armx) ? e.armx[s] : null),
            )),
            (s.creative = "creative" === e.mode),
            (s.spectator = "spectator" === e.mode),
            (s.deadGuest = !!e.dead),
            (s.flying = !!e.flying),
            (s.netSwim = !!e.swim),
            e.look && (s.look = p2pLook(e.look)),
            "undefined" != typeof AntiCheat && AntiCheat.p2pState(this, t));
          break;
        }
        case "chunk": {
          const i = s.world,
            n = ckey(e.cx, e.cz),
            o = i.chunks.get(n),
            reply = (s) => {
              for (const i of p2pFrames(
                e.id,
                s ? p2pPackChunk(s) : new Uint8Array(0),
                t.link.maxSize(),
              ))
                if (!t.link.send(i)) break;
            };
          o && o.modified
            ? reply(encodeChunk(o))
            : i.savedChunks && i.savedChunks.has(n)
              ? reply(i.savedChunks.get(n))
              : DB.getChunk(i.savedStore, e.cx, e.cz).then(
                  (t) => reply(t || (o ? encodeChunk(o) : null)),
                  () => reply(null),
                );
          break;
        }
        case "b":
          for (const [i, n, o, a, r, c] of e.list || [])
            Number.isInteger(i) &&
              Number.isInteger(n) &&
              Number.isInteger(o) &&
              BLOCKS[a] &&
              ((p2pBlocks.from = t),
              s.world.setBlock(i, n, o, a, 0 | r, 3),
              void 0 !== c && s.world.setWaterlogged(i, n, o, !!c),
              (p2pBlocks.from = null));
          break;
        case "be":
          if (beKey(e.k) && e.data && "object" == typeof e.data) {
            const i = s.blockEntities.get(e.k);
            (i ? Object.assign(i, e.data) : s.blockEntities.set(e.k, e.data),
              this.beSent.set(e.k, beJson(s.blockEntities.get(e.k))),
              this.toAll({ t: "be", k: e.k, data: e.data }, t));
          }
          break;
        case "drop":
          if (e.stack && ITEMS[e.stack.id] && Array.isArray(e.pos)) {
            const t = s.dropItem(
              e.pos[0],
              e.pos[1],
              e.pos[2],
              fixSavedStack({ ...e.stack }),
              e.vel,
            );
            t && (t.pickup = 40);
          }
          break;
        case "pickup": {
          const i = s.entities.find((t) => t.p2pId === e.id && !t.dead),
            n = t.avatar;
          if (
            !i ||
            !n ||
            i.pickup > 0 ||
            Math.hypot(i.pos[0] - n.pos[0], i.pos[1] - n.pos[1], i.pos[2] - n.pos[2]) > 4
          )
            break;
          i instanceof ItemEntity && i.stack
            ? t.link.send({ t: "give", stack: i.stack }) &&
              ((i.dead = !0), Sound.ev && Sound.ev("entity.item.pickup", i.pos, 0.2, 1.5))
            : i instanceof ExperienceOrb &&
              t.link.send({ t: "xp", n: i.value || i.v || 1 }) &&
              (i.dead = !0);
          break;
        }
        case "hit": {
          const i = s.entities.find((t) => t.p2pId === e.id && !t.dead);
          if (!(i && i.hurt && "number" == typeof e.dmg && e.dmg > 0)) break;
          const n =
              "undefined" != typeof AntiCheat
                ? AntiCheat.p2pHit(this, t, e, i)
                : Math.min(e.dmg, 99),
            o =
              Array.isArray(e.kb) && e.kb.length >= 2 && e.kb.every(Number.isFinite)
                ? [e.kb[0], e.kb[1]]
                : null;
          if (o) {
            const t = Math.hypot(o[0], o[1]);
            t > 8 && ((o[0] *= 8 / t), (o[1] *= 8 / t));
          }
          n > 0 && i.hurt(n, { type: "player", attacker: t.avatar, player: !0, kb: o });
          break;
        }
        case "flag":
          "undefined" != typeof AntiCheat && AntiCheat.p2pFlag(this, t, e);
          break;
        case "chat": {
          const i = String(e.text || "").slice(0, 256);
          if (!i) break;
          (s.ui.message(`<${t.name}> ${i}`), this.toAll({ t: "chat", name: t.name, text: i }, t));
          break;
        }
        case "mark":
          Array.isArray(e.pos) &&
            (Marks.add(
              t.name,
              e.pos.map((t) => 0 | t),
            ),
            s.ui.message(`${t.name} 标记了一个位置`, "#FFD24A"),
            this.toAll({ t: "mark", name: t.name, pos: e.pos }, t));
          break;
        case "pstate": {
          const i = s.worldMeta;
          i && e.data && ((i.guests || (i.guests = {}))[t.name.toLowerCase()] = e.data);
          break;
        }
      }
  }
  tick() {
    const t = this.g;
    if (this.peers.size) {
      if (this.blocks.length) {
        const t = this.blocks.splice(0);
        for (const e of this.peers.values()) e.joined && p2pSendList(e.link, "B", t);
      }
      if (t.tickCount % 2 == 0)
        for (const e of this.peers.values())
          e.joined &&
            e.avatar &&
            (e.link.backlog() < 131072 || t.tickCount % 20 == 0) &&
            t.guard("p2p snapshot", () => this.sendSnapshot(e));
      if (t.tickCount % 10 == 0)
        for (const [e, s] of t.blockEntities) {
          if (!beKey(e)) continue;
          const t = beJson(s);
          this.beSent.get(e) !== t &&
            (this.beSent.set(e, t), this.toAll({ t: "be", k: e, data: JSON.parse(t) }));
        }
      t.tickCount % 40 == 0 &&
        this.toAll({
          t: "env",
          time: t.worldTime,
          weather: t.weather,
          rain: t.rainTarget,
          difficulty: t.difficulty,
        });
    } else this.blocks.length = 0;
  }
  sendSnapshot(t) {
    const e = this.snapshot(t),
      s = JSON.stringify(e),
      i = t.link.maxSize() - 256;
    if (p2pBytes(s) <= i) return void t.link.send(s);
    const n = [],
      cut = (t) => {
        if (t.length < 2 || p2pBytes(JSON.stringify(t)) <= i) n.push(t);
        else {
          const e = t.length >> 1;
          (cut(t.slice(0, e)), cut(t.slice(e)));
        }
      };
    (cut(e.list),
      n.forEach((e, s) =>
        t.link.send(s < n.length - 1 ? { t: "E", list: e, more: 1 } : { t: "E", list: e }),
      ));
  }
  snapshot(t) {
    const e = this.g,
      s = t.avatar,
      i = [];
    for (const t of e.entities) {
      if (t.dead || t === s) continue;
      const e = t.pos[0] - s.pos[0],
        n = t.pos[2] - s.pos[2];
      if (e * e + n * n > 4096 && !(t instanceof GuestAvatar)) continue;
      t.p2pId || (t.p2pId = this.nextEnt++);
      const o = [
        t.p2pId,
        0,
        +t.pos[0].toFixed(2),
        +t.pos[1].toFixed(2),
        +t.pos[2].toFixed(2),
        +(t.yaw || 0).toFixed(2),
      ];
      if (t instanceof GuestAvatar)
        ((o[1] = "player"),
          o.push({
            name: t.name,
            look: t.look || null,
            held: t.heldId ?? null,
            heldx: p2pLooks(t.hand),
            off: (t.offhand && t.offhand.id) ?? null,
            offx: p2pLooks(t.offhand),
            armor: (t.armorItems || []).map((t) => t && t.id),
            armx: p2pArmx(t.armorItems || []),
            sneak: !!t.sneaking,
            swing: t.swingT > 0,
            pitch: t.netPitch || 0,
            swim: !!t.netSwim,
          }));
      else if (t instanceof ItemEntity) {
        if (!t.stack) continue;
        ((o[1] = "item"), o.push({ id: t.stack.id, n: t.stack.count }));
      } else if (t instanceof ExperienceOrb) ((o[1] = "xp"), o.push({ v: t.value || t.v || 1 }));
      else {
        if (!(t instanceof Mob && t.type)) continue;
        ((o[1] = t.type),
          o.push({
            b: +(t.bodyYaw ?? t.yaw ?? 0).toFixed(2),
            h: +(t.headYaw || 0).toFixed(2),
            p: +(t.pitch || 0).toFixed(2),
            ls: +(t.limbSwing || 0).toFixed(2),
            la: +(t.limbAmt || 0).toFixed(2),
            baby: t.baby ? 1 : 0,
            sh: t.sheared ? 1 : 0,
            wc: t.woolColor || 0,
            sz: "number" == typeof t.size ? t.size : void 0,
            fuse: t.fuse,
            ht: t.hurtTime || 0,
            dt: t.deathTime || 0,
            sw: t.swingT || 0,
            held: t.heldId ?? (t.hand && t.hand.id),
            name: t.customName,
            boss:
              "undefined" != typeof Wither && t instanceof Wither
                ? +(t.invulT > 0 ? 1 - t.invulT / 220 : t.health / t.maxHealth).toFixed(3)
                : void 0,
          }));
      }
      i.push(o);
    }
    const n = e.player;
    return (
      i.push([
        -1,
        "player",
        +n.pos[0].toFixed(2),
        +n.pos[1].toFixed(2),
        +n.pos[2].toFixed(2),
        +n.yaw.toFixed(2),
        {
          name: (Account.loggedIn && Account.name) || "Host",
          look: Skins.mine(e),
          held: n.inv.held ? n.inv.held.id : null,
          heldx: p2pLooks(n.inv.held),
          off: n.inv.slots[40] ? n.inv.slots[40].id : null,
          offx: p2pLooks(n.inv.slots[40]),
          armor: n.inv.slots.slice(36, 40).map((t) => t && t.id),
          armx: p2pArmx(n.inv.slots.slice(36, 40)),
          sneak: !!n.sneaking,
          swing: n.swingT > 0,
          pitch: n.pitch,
          swim: !!n.swimming,
        },
      ]),
      { t: "E", list: i }
    );
  }
  onBlock(t, e, s, i, n, o) {
    this.peers.size && this.blocks.push([t, e, s, i, n, o]);
  }
  kick(t) {
    const e = this.peers.get(t);
    e &&
      (e.link.send({ t: "kicked", reason: "房主请你离开了房间" }),
      setTimeout(() => this.dropPeer(t, "被房主请出了房间"), 300));
  }
  close() {
    this.state = "closed";
    for (const t of this.peers.values())
      (t.link.send({ t: "closed" }), t.link.close(), t.avatar && (t.avatar.dead = !0));
    this.peers.clear();
    try {
      this.ws && this.ws.close();
    } catch (t) {}
    this.g.p2pHost === this && (this.g.p2pHost = null);
  }
}
class LocalGuest {
  constructor(t, e, s) {
    ((this.g = t),
      (this.code = e),
      (this.name = s),
      (this.reqs = new Map()),
      (this.nextReq = 1),
      (this.mirrors = new Map()),
      (this.picks = new Map()),
      (this.beSnap = new Map()),
      (this.outBlocks = []),
      (this.state = "connecting"));
  }
  join() {
    return new Promise((t, e) => {
      ((this.res = t), (this.rej = e));
      const s = (this.ws = new WebSocket(p2pUrl()));
      ((s.onopen = async () => {
        const t = "undefined" != typeof Integrity ? await Integrity.reportWithin(4e3) : null;
        1 === s.readyState &&
          s.send(
            JSON.stringify({
              t: "join",
              code: this.code,
              token: Account.token || void 0,
              name: this.name,
              ic: t || void 0,
            }),
          );
      }),
        (s.onmessage = (t) => {
          let i;
          try {
            i = JSON.parse(t.data);
          } catch (t) {
            return;
          }
          if ("joined" === i.t) {
            ((this.hostName = i.host),
              (this.link = new P2PLink(
                i.ice,
                (t) => this.onMsg(t),
                (t) => {
                  ("failed" !== t && "closed" !== t && "disconnected" !== t) ||
                    "left" === this.state ||
                    this.lost(
                      "failed" === t
                        ? "没连上房主（网络不通：可以换个网络再试，或者让房主开服务器上的公开房间）"
                        : "和房主的连接断开了",
                    );
                },
              )));
            ((this.link.make((t) =>
              s.send(JSON.stringify({ t: "signal", data: t })),
            ).ondatachannel = (t) => this.link.wire(t.channel)),
              setTimeout(() => {
                "connecting" === this.state && this.lost("连接超时：房主的网络可能不通");
              }, 3e4));
          } else
            "signal" === i.t
              ? this.link &&
                this.link
                  .signal(i.data, (t) => s.send(JSON.stringify({ t: "signal", data: t })))
                  .catch((t) => console.warn("p2p", t))
              : "error" === i.t
                ? ((this.state = "left"), e(new Error(i.reason)))
                : "closed" === i.t && this.lost("房主关闭了房间");
        }),
        (s.onerror = () => {
          "connecting" === this.state &&
            ((this.state = "left"), e(new Error("游戏正在更新中…请稍后")));
        }));
    });
  }
  lost(t) {
    if ("left" === this.state) return;
    const e = this.state;
    this.state = "left";
    try {
      this.link && this.link.close();
    } catch (t) {}
    try {
      this.ws && this.ws.close();
    } catch (t) {}
    const s = this.g;
    "connecting" !== e
      ? s.p2pGuest === this &&
        ((s.p2pGuest = null),
        (s.worldMeta = null),
        s.startTitle(),
        s.ui.open(
          new ConfirmScreen(s, "离开了本地房间", t, "返回标题画面", () =>
            s.ui.open(new TitleScreen(s)),
          ),
        ))
      : this.rej && this.rej(new Error(t));
  }
  leave() {
    "left" !== this.state &&
      (this.sendState(!0),
      (this.state = "left"),
      setTimeout(() => {
        try {
          this.link && this.link.close();
        } catch (t) {}
        try {
          this.ws && this.ws.close();
        } catch (t) {}
      }, 300));
  }
  send(t) {
    return this.link && this.link.send(t);
  }
  async onWelcome(t) {
    const e = this.g,
      s = "p2p~" + this.code;
    ((this.meta = {
      id: s,
      name: t.name + "（本地房间）",
      seed: String(t.seed),
      gen: t.gen || 2,
      mode: t.mode,
      flat: !!t.flat,
      ...(t.flatClassic ? { flatClassic: !0 } : {}),
      structures: !1 !== t.structures,
      difficulty: t.difficulty,
      hardcore: t.hardcore,
      cheats: !1,
      time: t.time,
      weather: t.weather,
      rainTarget: t.rain,
      spawn: t.spawn,
      tutorial: -1,
      dims: { overworld: { blockEntities: Object.fromEntries(this.wbes || []), mobs: [] } },
      player: t.saved || null,
      created: Date.now(),
      lastPlayed: Date.now(),
    }),
      (this.keys = new Set(this.wkeys || [])));
    for (const [t, e] of this.wbes || []) this.beSnap.set(t, beJson(e));
    if (((e.p2pGuest = this), (this.state = "joined"), await e.loadWorld(s), !t.saved && t.near)) {
      const s = e.player;
      ((s.pos = [t.near[0] + 1, t.near[1] + 0.5, t.near[2] + 1]),
        (s.prev = [...s.pos]),
        (s.spawn = t.spawn));
    }
    (t.sponsor &&
      t.sponsor.text &&
      (e.pendingPin = {
        text: String(t.sponsor.text).slice(0, 80),
        ms: 1e3 * clamp(+t.sponsor.seconds || 30, 0, 300),
      }),
      e.ui.message(
        `已进入 ${t.host} 的本地房间` +
          (t.players && t.players.length ? `（还有 ${t.players.join("、")}）` : ""),
        "#55FF55",
      ),
      Array.isArray(t.mods) &&
        t.mods.length &&
        e.ui.message(
          `房主的世界装了模组（${t.mods
            .map((t) => String(t).slice(0, 16))
            .slice(0, 8)
            .join(
              "、",
            )}）：本地房间里模组只在房主那边生效，你这边没有模组，看不到模组的方块和物品，连锁挖矿等也用不了`,
          "#FFAA00",
        ),
      this.res && this.res());
  }
  onMsg(t) {
    const e = this.g;
    if (t instanceof Uint8Array) {
      const e = t.length >= 5 ? new DataView(t.buffer, t.byteOffset).getUint32(1) : -1,
        s = this.reqs.get(e);
      if (1 === t[0])
        s && (this.reqs.delete(e), s(t.length > 5 ? p2pUnpackChunk(t.subarray(5)) : null));
      else if (2 === t[0] && s && t.length > 6) {
        const i = this.pieces || (this.pieces = new Map()),
          n = i.get(e) || [];
        if ((n.push(t.slice(6)), !t[5])) return void i.set(e, n);
        (i.delete(e), this.reqs.delete(e));
        const o = new Uint8Array(n.reduce((t, e) => t + e.length, 0));
        let a = 0;
        for (const t of n) (o.set(t, a), (a += t.length));
        const r = o.length >= 12 ? new DataView(o.buffer) : null;
        s(
          r && 12 + 2 * r.getUint32(0) + 2 * r.getUint32(4) + 4 * r.getUint32(8) === o.length
            ? p2pUnpackChunk(o)
            : null,
        );
      }
      return;
    }
    switch (t.t) {
      case "wkeys":
        (this.wkeys || (this.wkeys = [])).push(...t.list);
        break;
      case "wbes":
        (this.wbes || (this.wbes = [])).push(...t.list);
        break;
      case "welcome":
        this.onWelcome(t).catch((t) => this.lost("进入失败：" + t.message));
        break;
      case "B": {
        const s = e.world;
        if (!s || e.worldMeta !== this.meta) break;
        p2pBlocks.applying++;
        try {
          for (const [e, i, n, o, a, r] of t.list) {
            const t = ckey(e >> 4, n >> 4);
            (this.keys.add(t),
              s.savedIndex && s.savedIndex.add(t),
              s.chunks.has(t)
                ? (s.setBlock(e, i, n, o, a, 3), void 0 !== r && s.setWaterlogged(e, i, n, !!r))
                : s.savedChunks && s.savedChunks.delete(t));
          }
        } finally {
          p2pBlocks.applying--;
        }
        break;
      }
      case "be":
        if (beKey(t.k) && t.data) {
          const s = e.blockEntities.get(t.k);
          if (s) for (const e in t.data) s[e] = t.data[e];
          else e.blockEntities.set(t.k, t.data);
          this.beSnap.set(t.k, beJson(e.blockEntities.get(t.k)));
        }
        break;
      case "E": {
        if (!Array.isArray(t.list)) break;
        if (t.more) {
          (this.eParts || (this.eParts = [])).push(...t.list);
          break;
        }
        const e = this.eParts ? this.eParts.concat(t.list) : t.list;
        ((this.eParts = null), this.onEntities(e));
        break;
      }
      case "env":
        ((e.worldTime = t.time),
          (e.weather = t.weather),
          (e.rainTarget = t.rain),
          (e.difficulty = t.difficulty));
        break;
      case "hurt": {
        const s = e.player;
        if (!s || s.deathTime > 0) break;
        const i = t.from ? { pos: t.from, type: "mob", name: t.name } : null;
        try {
          s.hurt(t.dmg, {
            type: "player" === t.kind ? "player" : t.kind || "mob",
            attacker: i,
            entity: i,
          });
        } catch (e) {
          s.hurt(t.dmg, { type: "generic" });
        }
        break;
      }
      case "give": {
        if (!t.stack || "object" != typeof t.stack) break;
        const s = knownStack({ ...t.stack }, e, "p2p give"),
          i = s ? e.player.inv.add(s) : 0 | t.stack.count;
        (s && i < s.count && Sound.ev && Sound.ev("entity.item.pickup", null, 0.2, 1.5),
          i > 0 &&
            this.send({
              t: "drop",
              stack: { ...(s || t.stack), count: i },
              pos: e.player.pos.slice(0, 3),
            }));
        break;
      }
      case "xp":
        (e.addXp(0 | t.n), Sound.ev && Sound.ev("entity.experience_orb.pickup", null, 0.1, 1));
        break;
      case "chat":
        e.ui.message(t.sys ? t.text : `<${t.name}> ${t.text}`, t.sys ? "#FFFF55" : "#FFFFFF");
        break;
      case "mark":
        (Marks.add(
          String(t.name).slice(0, 16),
          (t.pos || []).map((t) => 0 | t),
        ),
          e.ui.message(`${t.name} 标记了一个位置`, "#FFD24A"));
        break;
      case "kicked":
        this.lost(t.reason || "房主请你离开了房间");
        break;
      case "closed":
        this.lost("房主关闭了房间");
    }
  }
  onEntities(t) {
    const e = this.g,
      s = new Set(),
      i = new Set(e.entities);
    for (const n of t) {
      if (!Array.isArray(n)) continue;
      const [t, o, a, r, c, l, p] = n;
      if (![a, r, c].every(Number.isFinite) || ("player" === o && (!p || "object" != typeof p)))
        continue;
      const h =
        "item" === o ? p && knownStack({ id: p.id, count: p.n || 1, dmg: 0 }, e, "p2p item") : null;
      if ("item" === o && !h) continue;
      s.add(t);
      let d = this.mirrors.get(t);
      if (d && (d.dead || !i.has(d) || d.mirrorType !== o)) {
        if (d.mirrorType === o && d.deathTime > 0 && p && p.dt) continue;
        ((d.dead = !0), (d = null));
      }
      if (!d) {
        if ("player" === o) d = new NetPlayer(e, a, r, c, p.name);
        else if ("item" === o)
          ((d = new ItemEntity(e, a, r, c, h, [0, 0, 0])),
            (d.tick = netItemTick),
            (d.pickup = 1e9));
        else if ("xp" === o)
          ((d = new ExperienceOrb(e, a, r, c, p.v || 1)), (d.tick = netItemTick));
        else {
          try {
            d = createMob(e, o, a, r, c);
          } catch (t) {
            d = null;
          }
          if (!d) continue;
        }
        ((d.p2pMirror = !0),
          (d.p2pId = t),
          (d.mirrorType = o),
          (d.remote = !0),
          (d.alwaysTick = !0),
          (d.persistent = !1),
          "item" !== o && "xp" !== o && (d.tick = netEntityTick),
          (d.netPos = [a, r, c]),
          (d.lerpN = 0),
          (d.netYaw = d.yaw = d.bodyYaw = d.prevBodyYaw = l),
          "item" !== o &&
            "xp" !== o &&
            (d.hurt = (s, i) => {
              if ("player" === o) return !1;
              const n = e.player,
                a = [d.pos[0] - n.pos[0], d.pos[2] - n.pos[2]];
              return (
                this.send({
                  t: "hit",
                  id: t,
                  dmg: s,
                  kb: a,
                  kind:
                    i && "player" === i.type && !i.projectile ? "melee" : (i && i.type) || "other",
                }),
                (d.hurtTime = 10),
                !0
              );
            }),
          e.entities.push(d),
          this.mirrors.set(t, d));
      }
      ((d.netPos = [a, r, c]),
        (d.lerpN = 3),
        (d.netYaw = l),
        "player" === o
          ? ((d.name = String(p.name || "?").slice(0, 32)),
            (d.look = p2pLook(p.look)),
            (d.heldId = p2pItem(p.held)),
            (d.hand = p2pStack(p.held, p.heldx)),
            (d.offhand = p2pStack(p.off, p.offx)),
            (d.armorItems = (Array.isArray(p.armor) ? p.armor : []).map((t, e) =>
              p2pStack(t, Array.isArray(p.armx) ? p.armx[e] : null),
            )),
            (d.sneaking = p.sneak),
            !p.swing || d.swingT > 0 || (d.swingT = 6),
            (d.netPitch = p.pitch),
            (d.netHead = l),
            (d.netSwim = p.swim))
          : p && "item" !== o && "xp" !== o
            ? ((d.netHead = l + (p.h || 0)),
              (d.netPitch = p.p),
              (d.limbSwing = p.ls),
              (d.limbAmt = p.la),
              (d.prevLimb = p.ls),
              p.baby && (d.baby = !0),
              (d.sheared = !!p.sh),
              (d.woolColor = p.wc),
              void 0 !== p.sz && (d.size = p.sz),
              void 0 !== p.fuse && (d.fuse = p.fuse),
              p.ht > (d.hurtTime || 0) && (d.hurtTime = p.ht),
              p.dt && !d.deathTime && (d.deathTime = 1),
              p.sw && (d.swingT = p.sw),
              (d.heldId = p2pItem(p.held)),
              p.name && (d.customName = p.name),
              Number.isFinite(p.boss) && (d.bossProg = p.boss))
            : "item" !== o ||
              (d.stack && d.stack.id === h.id && d.stack.count === h.count) ||
              (d.stack = h));
    }
    for (const [t, e] of this.mirrors)
      s.has(t) || (e.deathTime > 0 || (e.dead = !0), this.mirrors.delete(t), this.picks.delete(t));
  }
  sendState(t) {
    const e = this.g,
      s = e.player;
    s &&
      (this.send({
        t: "state",
        pos: s.pos.map((t) => +t.toFixed(2)),
        yaw: +s.yaw.toFixed(3),
        pitch: +s.pitch.toFixed(3),
        sneak: !!s.sneaking,
        swing: s.swingT > 0,
        held: s.inv.held ? s.inv.held.id : null,
        heldx: p2pLooks(s.inv.held),
        off: s.inv.slots[40] ? s.inv.slots[40].id : null,
        offx: p2pLooks(s.inv.slots[40]),
        armor: s.inv.slots.slice(36, 40).map((t) => t && t.id),
        armx: p2pArmx(s.inv.slots.slice(36, 40)),
        mode: e.mode,
        dead: s.deathTime > 0,
        flying: !!s.flying,
        swim: !!s.swimming,
        look: Skins.mine(e),
      }),
      (t || e.tickCount % 200 == 0) &&
        this.send({
          t: "pstate",
          data: {
            pos: [...s.pos],
            yaw: s.yaw,
            pitch: s.pitch,
            health: s.health,
            food: s.food,
            sat: s.saturation,
            xp: s.xp,
            inv: s.inv.slots,
            sel: s.inv.sel,
            flying: s.flying,
            effects: [],
          },
        }));
  }
  tick() {
    const t = this.g,
      e = t.player;
    t.tickCount % 2 == 0 && t.guard("p2p state", () => this.sendState());
    for (const e of t.entities) e.dead || t.tickEntity(e);
    ((t.entities = t.entities.filter((t) => !t.dead)),
      t.guard("particles", () => t.particles.tick()),
      "overworld" === t.dim &&
        t.weather > 0.2 &&
        t.tickCount % 2 == 0 &&
        t.guard("rain", () => t.rainParticles()));
    const fits = (t) => {
      const s = maxStack(t.id);
      for (let i = 0; i < 36; i++) {
        const n = e.inv.slots[i];
        if (!n || (sameKind(n, t) && n.count < s && !ITEMS[n.id].durability)) return !0;
      }
      return !1;
    };
    for (const [s, i] of this.mirrors) {
      if (
        !(i instanceof ItemEntity || i instanceof ExperienceOrb) ||
        i.dead ||
        e.deathTime > 0 ||
        "spectator" === t.mode
      )
        continue;
      if (
        Math.hypot(i.pos[0] - e.pos[0], i.pos[1] + 0.25 - (e.pos[1] + 0.9), i.pos[2] - e.pos[2]) >
        1.6
      )
        continue;
      if (i instanceof ItemEntity && !(i.stack && ITEMS[i.stack.id] && fits(i.stack))) continue;
      const n = this.picks.get(s) || 0;
      performance.now() - n < 600 ||
        (this.picks.set(s, performance.now()), this.send({ t: "pickup", id: s }));
    }
    if (
      (this.outBlocks.length && this.link && p2pSendList(this.link, "b", this.outBlocks.splice(0)),
      t.tickCount % 10 == 0)
    )
      for (const [e, s] of t.blockEntities) {
        if (!beKey(e)) continue;
        const t = beJson(s);
        this.beSnap.get(e) !== t &&
          (this.beSnap.set(e, t), this.send({ t: "be", k: e, data: JSON.parse(t) }));
      }
  }
  requestChunk(t, e) {
    return new Promise((s) => {
      const i = this.nextReq++;
      (this.reqs.set(i, s),
        this.send({ t: "chunk", id: i, cx: t, cz: e }) || (this.reqs.delete(i), s(null)),
        setTimeout(() => {
          this.reqs.has(i) && (this.reqs.delete(i), this.pieces && this.pieces.delete(i), s(null));
        }, 2e4));
    });
  }
}
(() => {
  const isP2P = (t) => "string" == typeof t && t.startsWith("p2p~"),
    t = DB.getWorld.bind(DB),
    e = DB.putWorld.bind(DB),
    s = DB.putChunks.bind(DB),
    i = DB.getChunk.bind(DB),
    n = DB.chunkKeys.bind(DB);
  ((DB.getWorld = (e) => (isP2P(e) ? Promise.resolve(game.p2pGuest && game.p2pGuest.meta) : t(e))),
    (DB.putWorld = (t) => (isP2P(t && t.id) ? Promise.resolve() : e(t))),
    (DB.putChunks = (t, e) => (isP2P(t) ? Promise.resolve() : s(t, e))),
    (DB.chunkKeys = (t) => {
      if (!isP2P(t)) return n(t);
      const e = game.p2pGuest,
        s = new Set();
      if (e && !t.includes("~nether") && !/~end$/.test(t.replace(/^p2p~/, "")))
        for (const t of e.keys) s.add(t);
      return Promise.resolve(s);
    }),
    (DB.getChunk = (t, e, s) =>
      isP2P(t)
        ? game.p2pGuest
          ? game.p2pGuest.requestChunk(e, s)
          : Promise.resolve(void 0)
        : i(t, e, s)));
  const o = World.prototype.setBlock,
    a = World.prototype.setMeta,
    r = World.prototype.setWaterlogged,
    relay = (t, e, s, i) => {
      const n = "undefined" != typeof game && game;
      if (!n || n.world !== t) return;
      const o = t.getBlock(e, s, i),
        a = t.getMeta(e, s, i),
        r = t.isWaterlogged(e, s, i) ? 1 : 0;
      n.p2pHost
        ? n.p2pHost.onBlock(e, s, i, o, a, r)
        : n.p2pGuest &&
          !p2pBlocks.applying &&
          "joined" === n.p2pGuest.state &&
          n.p2pGuest.outBlocks.push([e, s, i, o, a, r]);
    };
  ((World.prototype.setBlock = function (t, e, s, ...i) {
    const n = o.call(this, t, e, s, ...i);
    return (!1 !== n && relay(this, t, e, s), n);
  }),
    (World.prototype.setMeta = function (t, e, s, i) {
      const n = this.getMeta(t, e, s),
        o = a.call(this, t, e, s, i);
      return (n !== i && relay(this, t, e, s), o);
    }),
    (World.prototype.setWaterlogged = function (t, e, s, i) {
      const n = r.call(this, t, e, s, i);
      return (relay(this, t, e, s), n);
    }));
  const c = Game.prototype.dropItem;
  Game.prototype.dropItem = function (t, e, s, i, n) {
    return this.p2pGuest && "joined" === this.p2pGuest.state && i && i.count > 0
      ? (this.p2pGuest.send({ t: "drop", stack: { ...i }, pos: [t, e, s], vel: n }), null)
      : c.call(this, t, e, s, i, n);
  };
  const l = Game.prototype.tickEntity;
  Game.prototype.tickEntity = function (t) {
    const e = this.p2pHost;
    if (!(
      e &&
      e.peers.size &&
      t instanceof Mob &&
      !(t instanceof GuestAvatar) &&
      t.T &&
      t.T.hostile
    ))
      return l.call(this, t);
    let s = this.player,
      i = t.distTo(this.player);
    for (const n of e.peers.values()) {
      const e = n.avatar;
      if (e && !e.dead && !e.deadGuest && !e.creative && !e.spectator) {
        const n = t.distTo(e);
        n < i && ((i = n), (s = e));
      }
    }
    if (s === this.player) return l.call(this, t);
    const n = this.player;
    this.player = s;
    try {
      return l.call(this, t);
    } finally {
      this.player = n;
    }
  };
  const p = Game.prototype.tick;
  Game.prototype.tick = function () {
    const t = this.ui && this.ui.screen,
      e = t && t.pauses && (this.p2pHost || this.p2pGuest),
      s = e ? Object.getOwnPropertyDescriptor(t, "pauses") : null;
    if (e)
      try {
        Object.defineProperty(t, "pauses", { value: !1, writable: !0, configurable: !0 });
      } catch (t) {}
    try {
      p.call(this);
    } finally {
      if (e)
        try {
          s ? Object.defineProperty(t, "pauses", s) : delete t.pauses;
        } catch (t) {}
    }
    this.p2pHost && "play" === this.state && this.guard("p2p host", () => this.p2pHost.tick());
  };
  const h = runCommand;
  runCommand = function (t, e) {
    if (t.p2pGuest)
      return e.startsWith("/")
        ? void t.ui.message("本地房间里客人不能用命令", "#FF5555")
        : (t.ui.message(`<${t.p2pGuest.name}> ${e}`), void t.p2pGuest.send({ t: "chat", text: e }));
    if (t.p2pHost && !e.startsWith("/")) {
      const s = (Account.loggedIn && Account.name) || "房主";
      return (t.ui.message(`<${s}> ${e}`), void t.p2pHost.toAll({ t: "chat", name: s, text: e }));
    }
    return h(t, e);
  };
  const d = Marks.place;
  Marks.place = function (t) {
    if (t.p2pGuest || t.p2pHost) {
      const e = t.target,
        s = e ? [...e.pos] : t.player.pos.map(Math.floor),
        i = t.p2pGuest ? t.p2pGuest.name : (Account.loggedIn && Account.name) || "房主";
      return (
        t.p2pGuest
          ? t.p2pGuest.send({ t: "mark", pos: s })
          : t.p2pHost.toAll({ t: "mark", name: i, pos: s }),
        void Marks.add(i, s, "#55FF55")
      );
    }
    return d.call(this, t);
  };
  const u = Game.prototype.changeDimension;
  Game.prototype.changeDimension = function (...t) {
    if (this.p2pGuest) this.ui.pinMessage("本地房间里客人暂时不能去其他维度", 3e3, "#FF8080");
    else {
      if (!this.p2pHost || !this.p2pHost.peers.size) return u.apply(this, t);
      this.ui.pinMessage("房间里有朋友时不能去其他维度（先关掉本地房间）", 3e3, "#FF8080");
    }
  };
  const f = Game.prototype.quitToTitle;
  Game.prototype.quitToTitle = async function () {
    if (this.p2pGuest) {
      return (
        this.p2pGuest.leave(),
        (this.p2pGuest = null),
        (this.worldMeta = null),
        void this.startTitle()
      );
    }
    return (this.p2pHost && this.p2pHost.close(), f.call(this));
  };
  const m = Game.prototype.drawEntities;
  Game.prototype.drawEntities = function (t, e) {
    const s = m.call(this, t, e);
    if ((this.p2pHost || this.p2pGuest) && !this.net && !this.ui.hideHud && "play" === this.state)
      try {
        NetClient.prototype.drawNames.call({ g: this }, t);
      } catch (t) {
        this.reportError("name tags", t, !0);
      }
    return s;
  };
  const y = Game.prototype.saveWorld;
  Game.prototype.saveWorld = async function (t) {
    if (!this.p2pGuest) return y.call(this, t);
    this.p2pGuest.sendState(!0);
  };
})();
class LocalRoomScreen extends FormScreen {
  constructor(t, e) {
    (super(t, "开本地房间", e),
      (this.pauses = !1),
      (this.titleY = 8),
      (this.code = ""),
      (this.busy = !1));
    const s = t.fps || 0,
      i = navigator.deviceMemory || 8;
    this.weak = (s && s < 30) || i <= 2 || "phone" === TouchDevice.kind;
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2;
    ((this.fields = {}),
      this.addField(
        "code",
        e - 100,
        t.h - 82,
        200,
        "邀请码（6–12 位英文字母或数字，朋友输入它来加入）",
        12,
        (t) => t.replace(/[^A-Za-z0-9]/g, "").slice(0, 12),
      ),
      (this.widgets = [
        {
          x: e - 100,
          y: t.h - 54,
          w: 98,
          h: 20,
          gold: !0,
          label: () => (this.busy ? "正在开房间…" : "我知道了，开房间"),
          enabled: !this.busy,
          onClick: () => this.submit(),
        },
        {
          x: e + 2,
          y: t.h - 54,
          w: 98,
          h: 20,
          label: "随机邀请码",
          onClick: () => {
            const t = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
            let e = "";
            for (let s = 0; s < 8; s++) e += t[(31 * Math.random()) | 0];
            ((this.code = e), this.layout());
          },
        },
        { x: e - 100, y: t.h - 28, w: 200, h: 20, label: "返回", onClick: () => this.back() },
      ]),
      this.focus("code"));
  }
  async submit() {
    const t = this.game;
    if (!/^[A-Za-z0-9]{6,12}$/.test(this.code))
      return void this.say("邀请码要 6–12 位英文字母或数字", !0);
    if (!RoomService.base()) return void this.say("还没有配置游戏服务器", !0);
    ((this.busy = !0), this.say("正在开房间…"), this.layout());
    const e = new LocalHost(t, this.code);
    try {
      (await e.open(),
        (t.p2pHost = e),
        t.ui.hideInput(),
        t.ui.close(),
        t.ui.message(
          `本地房间已经开好：邀请码 ${this.code}（暂停 → 本地房间 可以复制邀请、查看在场的人）`,
          "#55FF55",
        ),
        Telemetry.count && Telemetry.count("p2p_host"));
    } catch (t) {
      ((this.busy = !1), this.say(t.message, !0), this.layout());
    }
  }
  drawExtra(t) {
    const e = t.ctx,
      s = t.w / 2,
      i = Math.min(340, t.w - 16),
      n = Math.floor(s - i / 2),
      o = "undefined" != typeof Mods ? Mods.active.filter((t) => !Mods.isTutorial(t)) : [];
    drawCard(e, n, 22, i, o.length ? 112 : 92, !0);
    const a = [
      ["本地房间会用你的设备运行整个世界：", "#FFD24A"],
      ["手机 / 电脑会更耗电、发热，人多时可能卡顿；你的网络不好时，其他人也会卡；", "#FFFFFF"],
      ["你关掉游戏、切到后台或者断网，房间里所有人都会被断开。", "#FF8080"],
      ["建议：用电脑 + 有线或稳定的 Wi-Fi。本地房间最多 4 人（含你）。", "#A0A0A0"],
      ["朋友在时你不能去下界 / 末地；朋友的背包会保存在你的存档里。", "#A0A0A0"],
    ];
    o.length &&
      a.push([
        "这个世界的模组（" +
          o.map((t) => Mods.nameOf(t)).join("、") +
          "）只在你这边生效：朋友那边没有模组，看不到模组的方块和物品，也用不了连锁挖矿等。",
        "#FFAA00",
      ]);
    let r = 28;
    for (const [t, s] of a) {
      let o = t;
      for (; o.length;) {
        let t = o.length;
        for (; t > 1 && Font.width(o.slice(0, t)) > i - 12;) t--;
        (Font.draw(e, o.slice(0, t), n + 6, r, s), (o = o.slice(t)), (r += 10));
      }
    }
    (this.weak &&
      Font.center(
        e,
        fitText(
          "phone" === TouchDevice.kind
            ? "在手机上开房间不太推荐：发热和后台断开都很常见"
            : "你的设备现在帧率偏低，不太推荐开本地房间",
          t.w - 8,
        ),
        s,
        o.length ? 138 : 118,
        "#FF8080",
      ),
      this.drawFields(t));
  }
}
class LocalRoomStatusScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, "本地房间"),
      (this.parent = e),
      (this.pauses = !1),
      (this.titleY = 10),
      (this.note = ""));
  }
  get H() {
    return this.game.p2pHost;
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      s = this.H;
    ((this.widgets = []),
      s &&
        ([...s.peers.values()]
          .filter((t) => t.joined)
          .forEach((t, i) =>
            this.widgets.push({
              x: e + 80,
              y: 66 + 22 * i,
              w: 60,
              h: 18,
              label: "请离开",
              onClick: () => {
                (s.kick(t.id), setTimeout(() => this.layout(), 400));
              },
            }),
          ),
        this.widgets.push(
          {
            x: e - 152,
            y: 30,
            w: 98,
            h: 20,
            gold: !0,
            label: "复制邀请",
            onClick: async () => {
              this.note = (await copyText(
                `来我的 土豆史诗 本地房间玩：多人游戏 → 输入邀请码 ${s.code}`,
              ))
                ? "已复制，发给朋友吧"
                : "复制失败：邀请码 " + s.code;
            },
          },
          {
            x: e - 50,
            y: 30,
            w: 98,
            h: 20,
            label: "复制邀请码",
            onClick: async () => {
              this.note = (await copyText(s.code)) ? "邀请码已复制" : "复制失败";
            },
          },
          {
            x: e + 52,
            y: 30,
            w: 100,
            h: 20,
            label: "关闭房间",
            onClick: () => {
              (s.close(),
                this.game.ui.message("本地房间已关闭", "#AAAAAA"),
                this.game.ui.open(this.parent));
            },
          },
        )),
      this.widgets.push({
        x: e - 100,
        y: t.h - 28,
        w: 200,
        h: 20,
        label: "完成",
        onClick: () => this.game.ui.open(this.parent),
      }));
  }
  drawExtra(t) {
    const e = t.ctx,
      s = t.w / 2,
      i = this.H;
    if (!i) return void Font.center(e, "没有开本地房间", s, 50, "#A0A0A0");
    const n = [...i.peers.values()].filter((t) => t.joined);
    Font.draw(e, `邀请码 ${i.code}　·　${n.length + 1} / 4 人`, s - 152, 54, "#FFFF55");
    ([{ name: ((Account.loggedIn && Account.name) || "你") + "（房主）" }, ...n].forEach((t, i) => {
      const n = 66 + 22 * i;
      ((e.fillStyle = "rgba(0,0,0,0.35)"),
        e.fillRect(s - 152, n, 290, 18),
        Font.draw(e, t.name, s - 148, n + 5, "#FFFFFF"));
    }),
      n.length ||
        Font.draw(
          e,
          "还没有人进来：把邀请码发给朋友，他们在「多人游戏」里输入",
          s - 152,
          92,
          "#A0A0A0",
        ),
      this.note && Font.center(e, this.note, s, t.h - 40, "#80FF80"));
  }
  onEsc() {
    this.game.ui.open(this.parent);
  }
}
async function joinLocalRoom(t, e, s) {
  const i =
    (Account.loggedIn && Account.name) ||
    nameOnly(t.settings.netName || "") ||
    "Steve" + Math.floor(900 * Math.random() + 100);
  if ((t.ui.hideInput(), "undefined" != typeof Mods && Mods.active.length))
    return (
      t.ui.open(
        new LoadingModsScreen(
          t,
          [],
          "本地房间里客人没有模组（模组只在房主那边生效），网页会重新载入一次，然后自动进入房间",
        ),
      ),
      void Mods.reloadWith([], { p2p: e })
    );
  t.ui.open(new LoadingScreen(t, "正在连接本地房间 " + e + "…"));
  const n = new LocalGuest(t, e, i);
  try {
    await n.join();
  } catch (e) {
    t.ui.open(
      new ConfirmScreen(t, "没能进入本地房间", e.message, "返回", () =>
        t.ui.open(s || new TitleScreen(t)),
      ),
    );
  }
}
(() => {
  const t = PauseScreen.prototype.layout;
  PauseScreen.prototype.layout = function () {
    t.call(this);
    const e = this.game;
    if (e.net || e.p2pGuest) return;
    const s = this.widgets.find(
      (t) => "function" == typeof t.label && String(t.label()).startsWith("模式："),
    );
    s &&
      ((s.w = 48),
      this.widgets.push({
        x: s.x + 50,
        y: s.y,
        w: 48,
        h: 20,
        gold: !e.p2pHost,
        label: e.p2pHost ? "房间…" : "开房间",
        tip: e.p2pHost
          ? ["本地房间：邀请码、在场的人"]
          : ["开一个本地房间，朋友用邀请码加入你的世界（最多 4 人）"],
        onClick: () =>
          onlineGate(
            e,
            () =>
              e.ui.open(
                e.p2pHost ? new LocalRoomStatusScreen(e, this) : new LocalRoomScreen(e, this),
              ),
            this,
          ),
      }));
  };
  const e = MultiplayerScreen.prototype.submit;
  MultiplayerScreen.prototype.submit = async function () {
    const t = String(this.code || "").replace(/[^A-Za-z0-9]/g, "");
    if (t.length >= 6 && RoomService.base())
      try {
        if ((await RoomService.api("/api/p2p/has?code=" + encodeURIComponent(t))).has)
          return joinLocalRoom(this.game, t, this);
      } catch (t) {}
    return e.call(this);
  };
  const s = MultiplayerScreen.prototype.layout;
  MultiplayerScreen.prototype.layout = function () {
    (s.call(this),
      this.fields.code && (this.fields.code.max = 12),
      this.fields.code &&
        (this.fields.code.filter = (t) => t.replace(/[^A-Za-z0-9]/g, "").slice(0, 12)));
  };
})();
//# sourceURL=js/p2p.js
