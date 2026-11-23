"use strict";
const AntiCheat = (() => {
  const now = () => performance.now();
  const st = (e) =>
    e.ac ||
    (e.ac = { swingT: -1e9, s: 1, hits: [], tops: [], flags: 0, fly: 0, told: -1e9, why: {} });
  function track(e, t) {
    const o = st(e),
      n = now(),
      r = t.netPos ? t.netPos[1] : t.pos[1];
    for (o.tops.push([n, r]); o.tops.length && n - o.tops[0][0] > 4e3;) o.tops.shift();
  }
  function flag(e, t, o, n) {
    const r = st(t),
      a = now();
    (r.flags++,
      (r.why[o] = (r.why[o] || 0) + 1),
      a - r.told > 3e4 &&
        ((r.told = a),
        e.g.ui.message(
          "反作弊：" +
            (n ? t.name + " 的移动异常（" : "拦下了 " + t.name + " 的异常攻击（") +
            o +
            "）",
          "#FFAA00",
        )),
      "undefined" != typeof Telemetry &&
        Telemetry.event &&
        (!r.tel || a - r.tel > 6e4) &&
        ((r.tel = a), Telemetry.event("ac", { where: "p2p", why: o, n: r.flags })));
  }
  const e = new Set();
  function scan(e) {
    const t = [];
    try {
      const o = e.player,
        n = [
          Object.getPrototypeOf(e),
          o && Object.getPrototypeOf(o),
          o && Object.getPrototypeOf(Object.getPrototypeOf(o)),
        ];
      for (const e of n)
        if (e)
          for (const o of Object.getOwnPropertyNames(e)) /^__sw/i.test(o) && t.push("mark:" + o);
      const r = Function.prototype.toString.call(Object.getPrototypeOf(e).tick);
      (/SW\.hacks|\.hacks\)|h\.enabled/.test(r) && t.push("tick"),
        o && Object.prototype.hasOwnProperty.call(o, "creative") && t.push("creative"),
        Object.prototype.hasOwnProperty.call(e, "breakSpeed") && t.push("breakSpeed"),
        document.querySelector(".sw-root, .sw-panel") && t.push("panel"));
    } catch (e) {}
    return t;
  }
  // ---- W7：rooms 通道轻量自检层（用户拍板"轻量版先行"）----
  // 边界声明：本层是客户端自检 + 可观测性口径——防"老实人 bug"（坏坐标/超速
  // 瞬移/坏物品栈/超长聊天）并为 ADR-002 服务端完整版预留签名接口；
  // 防不了刻意绕过客户端的作弊器（真正权威校验在服务端，本期不做）。
  // 兼容性：签名走可选附加字段 _sig，老服务端忽略未知字段不报错；
  // 收到 error/kick 时自动熔断（本会话关闭签名），自检异常一律放行不炸对局。
  const SIGN_SET = new Set([
    "tick", "dig", "place", "use", "attack", "swing", "interact",
    "click", "drop", "held", "craft", "trade", "button", "release",
  ]);
  const roomCtxs = new WeakMap();
  function fnv1a(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h >>> 0;
  }
  function roomCtx(net) {
    let o = roomCtxs.get(net);
    if (!o) {
      let k = "r";
      try {
        for (const b of crypto.getRandomValues(new Uint8Array(12)))
          k += b.toString(16).padStart(2, "0");
      } catch (e) {
        k += ((Math.random() * 1e15) | 0).toString(16) + Date.now().toString(16);
      }
      o = { key: k, seq: 0, sign: !0, last: null, jump: !0, hits: [], told: -1e9, tels: {}, flags: 0 };
      roomCtxs.set(net, o);
    }
    return o;
  }
  function roomFlag(net, cat, detail, block) {
    try {
      const o = roomCtx(net),
        n = performance.now(),
        g = net && net.g;
      o.flags++;
      n - o.told > 3e4 &&
        g && g.ui && g.ui.message &&
        ((o.told = n),
        g.ui.message(
          "自检：" +
            (block ? "拦下了异常输入（" : "检测到远端异常（") +
            cat +
            (detail ? "：" + detail : "") +
            "）",
          block ? "#FFAA00" : "#FF5555",
        ));
      (o.tels[cat] || -1e9) + 1e4 < n &&
        ((o.tels[cat] = n),
        "undefined" != typeof Telemetry && Telemetry.event &&
          Telemetry.event("ac", { where: "room", why: cat, n: o.flags, b: block ? 1 : 0 }));
    } catch (e) {}
  }
  function roomOut(g, net, m) {
    try {
      const o = roomCtx(net);
      if ("tick" === m.t) {
        const p = m.pos;
        if (!p) return !0;
        if (!p.slice(0, 3).every(Number.isFinite)) return (roomFlag(net, "tick 坐标非法", "", !0), !1);
        if (o.jump || !o.last) return ((o.last = [p[0], p[1], p[2]]), (o.jump = !1), !0);
        const d = Math.hypot(p[0] - o.last[0], p[1] - o.last[1], p[2] - o.last[2]);
        o.last = [p[0], p[1], p[2]];
        if (d > 64)
          return (
            (o.jump = !0), roomFlag(net, "tick 瞬移", d.toFixed(0) + " 格", !0), !1
          );
        return !0;
      }
      if ("dig" === m.t || "place" === m.t) {
        if (![m.x, m.y, m.z].every(Number.isFinite)) return (roomFlag(net, m.t + " 坐标非法", "", !0), !1);
        const pl = g && g.player;
        if (pl && pl.pos) {
          const d = Math.hypot(m.x - pl.pos[0], m.y - (net.minY || 0) - pl.pos[1], m.z - pl.pos[2]);
          if (d > 12) return (roomFlag(net, m.t + " 超距", d.toFixed(1) + " 格", !0), !1);
        }
        return !0;
      }
      if ("attack" === m.t || "interact" === m.t) {
        const n = performance.now();
        o.hits = o.hits.filter((t) => n - t < 1e3);
        o.hits.push(n);
        if (o.hits.length > 25) return (roomFlag(net, "交互过频", "", !0), !1);
        return !0;
      }
      if ("click" === m.t) {
        const okStack = (s) =>
          !s ||
          ("number" == typeof s.c &&
            Number.isFinite(s.c) &&
            s.c >= 0 &&
            s.c <= 64 &&
            (null == s.n || "string" == typeof s.n));
        if (Array.isArray(m.changed) && !m.changed.every((c) => Array.isArray(c) && Number.isInteger(c[0]) && c[0] >= 0 && c[0] <= 128 && okStack(c[1])))
          return (roomFlag(net, "click 物品栈非法", "", !0), !1);
        if (!okStack(m.carried)) return (roomFlag(net, "carried 物品栈非法", "", !0), !1);
        return !0;
      }
      if ("chat" === m.t && "string" == typeof m.text && m.text.length > 256)
        return (roomFlag(net, "聊天超长", "", !0), !1);
    } catch (e) {}
    return !0;
  }
  function roomIn(net, ent, m) {
    try {
      if (!ent || "undefined" == typeof NetPlayer || !(ent instanceof NetPlayer)) return !0;
      const o = ent.acR || (ent.acR = { last: null, t: 0 }),
        n = performance.now(),
        p = [m.x, m.y - (net.minY || 0), m.z];
      if (!p.every(Number.isFinite)) return (roomFlag(net, "远端坐标非法", "", !1), !1);
      if (m.tp || !o.last) return ((o.last = p), (o.t = n), !0);
      const d = Math.hypot(p[0] - o.last[0], p[1] - o.last[1], p[2] - o.last[2]),
        dt = Math.max(1, n - o.t),
        v = (d / dt) * 1e3;
      ((o.last = p), (o.t = n));
      v > 60 && roomFlag(net, "远端超速", v.toFixed(0) + " 格/秒", !1);
      d > 24 && dt <= 100 && roomFlag(net, "远端瞬移", d.toFixed(0) + " 格", !1);
      return !0;
    } catch (e) {
      return !0;
    }
  }
  function roomSign(net, m) {
    try {
      const o = roomCtx(net);
      if (!o.sign || !SIGN_SET.has(m.t) || void 0 !== m._sig) return;
      const s = ++o.seq;
      m._sig = s.toString(36) + "." + fnv1a(JSON.stringify(m) + "|" + o.key + "|" + s).toString(36);
    } catch (e) {}
  }
  function roomSignOff(net) {
    try {
      const o = roomCtx(net);
      if (o.sign) {
        o.sign = !1;
        console.warn("anticheat: 服务器返回 error/kick，报文签名本会话自动关闭");
        "undefined" != typeof Telemetry && Telemetry.event &&
          Telemetry.event("ac", { where: "room", why: "sign-off" });
      }
    } catch (e) {}
  }
  return (
    "undefined" != typeof window &&
      window.addEventListener("load", () =>
        setInterval(() => {
          try {
            !(function check(t) {
              if (!t || "play" !== t.state) return;
              const o = !!t.net,
                n = !(!t.p2pGuest || "joined" !== t.p2pGuest.state);
              if (!o && !n) return;
              const r = scan(t).filter((t) => !e.has(t));
              if (!r.length) return;
              for (const t of r) e.add(t);
              const a = r.join(",");
              try {
                o && t.net.send && t.net.send({ t: "flag", what: a });
              } catch (e) {}
              try {
                n && t.p2pGuest.send({ t: "flag", what: a });
              } catch (e) {}
              "undefined" != typeof Telemetry &&
                Telemetry.event &&
                Telemetry.event("ac", { where: o ? "room" : "p2p-guest", what: a });
            })(window.game);
          } catch (e) {}
        }, 5e3),
      ),
    {
      p2pHit: function p2pHit(e, t, o, n) {
        const r = st(t),
          a = t.avatar,
          s = now();
        if (!a || !n) return 0;
        if (
          n === e.g.player ||
          n instanceof GuestAvatar ||
          "player" === n.mirrorType ||
          "player" === n.type
        )
          return (flag(e, t, "打玩家"), 0);
        if (((r.hits = r.hits.filter((e) => s - e < 1e3)), r.hits.push(s), r.hits.length > 20))
          return (21 === r.hits.length && flag(e, t, "太频繁"), 0);
        const c = a.netPos || a.pos,
          i = Math.hypot(
            n.pos[0] - c[0],
            n.pos[1] + (n.h || 1) / 2 - (c[1] + 1.5),
            n.pos[2] - c[2],
          );
        let l = +o.dmg;
        if (o.kind && "melee" !== o.kind)
          return i > 80 ? (flag(e, t, "距离 " + Math.round(i)), 0) : Math.min(l, 99);
        const p = ITEMS[a.heldId],
          f = p && p.key;
        if (i > (a.creative ? 5 : f && /_spear$/.test(f) ? 4.5 : 3) + (n.w || 0.6) / 2 + 2.2)
          return (flag(e, t, "距离 " + i.toFixed(1)), 0);
        if (s - r.swingT > 60) {
          r.iv = (r.iv || []).concat(Math.min(s - r.swingT, 5e3)).slice(-3);
          const e = r.iv.reduce((e, t) => e + t, 0) / r.iv.length,
            t = Math.min(e, r.iv[r.iv.length - 1] + 150);
          ((r.s = Math.min(
            1,
            (t / 50 + 0.5) /
              (20 /
                (function speedOf(e) {
                  const t = e && e.tool;
                  if (e && e.attackSpeed) return e.attackSpeed;
                  if (!t) return 4;
                  const o = e.key.split("_")[0];
                  switch (t.type) {
                    case "sword":
                      return 1.6;
                    case "pickaxe":
                      return 1.2;
                    case "shovel":
                      return 1;
                    case "axe":
                      return { wooden: 0.8, stone: 0.8, iron: 0.9 }[o] || 1;
                    case "hoe":
                      return { wooden: 1, stone: 2, iron: 3, golden: 1, diamond: 4 }[o] || 1;
                  }
                  return 4;
                })(p)),
          )),
            (r.swingT = s));
        }
        const d = r.s,
          h = (p && p.attack) || 1,
          u = n.type || n.mirrorType;
        let y =
          (h + 6) * (0.2 + d * d * 0.8) * 1.5 +
          (("undefined" != typeof UNDEAD && UNDEAD.has(u)) ||
          ("undefined" != typeof ARTHROPOD && ARTHROPOD.has(u))
            ? 12.5
            : 3) *
            d +
          1;
        if ("mace" === f) {
          track(t, a);
          const e = Math.max(...r.tops.map((e) => e[1])),
            o = Math.max(0, e - c[1]) + 2;
          y += (o <= 3 ? 4 * o : o <= 8 ? 12 + 2 * (o - 3) : o - 8 + 22) + 2.5 * o;
        }
        return (l > y && (flag(e, t, "伤害 " + Math.round(l) + ">" + Math.round(y)), (l = y)), l);
      },
      p2pState: function p2pState(e, t) {
        const o = t.avatar,
          n = t.state;
        if (!o) return;
        if (
          (track(t, o),
          !n || !Array.isArray(n.pos) || n.dead || "creative" === n.mode || "spectator" === n.mode)
        )
          return;
        const r = st(t),
          [a, s, c] = n.pos;
        if (n.flying) return void (++r.fly >= 3 && (flag(e, t, "生存模式下飞行", !0), (r.fly = 0)));
        r.fly = 0;
        const i = e.g.world,
          B = (e, t, o) =>
            i && i.getBlock
              ? i.getBlock(Math.floor(a + e), Math.floor(s + t), Math.floor(c + o))
              : 0,
          special = (e) => {
            const t = BLOCKS[e],
              o = (t && t.key) || "";
            return (
              ("undefined" != typeof IS_FLUID && IS_FLUID[e]) ||
              /ladder|vine|scaffolding|cobweb|powder_snow|bubble_column|slime_block|honey_block|_bed$/.test(
                o,
              )
            );
          };
        let l = !1,
          p = !!n.swim;
        for (const [e, t] of [
          [-0.3, -0.3],
          [0.3, -0.3],
          [-0.3, 0.3],
          [0.3, 0.3],
          [0, 0],
        ]) {
          const o = B(e, -0.1, t),
            n = BLOCKS[o];
          (n && n.solid && (l = !0),
            (special(o) || special(B(e, 0.2, t)) || special(B(e, 1.2, t))) && (p = !0));
        }
        const f =
          Array.isArray(n.armor) && n.armor.some((e) => ITEMS[e] && "elytra" === ITEMS[e].key);
        l || p || f || void 0 === r.lowY
          ? (r.lowY = s)
          : ((r.lowY = Math.min(r.lowY, s)),
            s - r.lowY > 4 &&
              (flag(e, t, "升高 " + (s - r.lowY).toFixed(1) + " 格", !0), (r.lowY = s)));
      },
      p2pFlag: function p2pFlag(e, t, o) {
        const n = st(t),
          r = String(o.what || "").slice(0, 80);
        n.flagged !== r &&
          ((n.flagged = r),
          e.g.ui.message("反作弊：" + t.name + " 的游戏里有作弊脚本（" + r + "）", "#FF5555"),
          "undefined" != typeof Telemetry &&
            Telemetry.event &&
            Telemetry.event("ac", { where: "p2p-host", what: r }));
      },
      scan: scan,
      roomOut: roomOut,
      roomIn: roomIn,
      roomSign: roomSign,
      roomSignOff: roomSignOff,
      roomReset: (net) => {
        try {
          roomCtx(net).jump = !0;
        } catch (e) {}
      },
      SIGN_SET: SIGN_SET,
    }
  );
})();
//# sourceURL=js/anticheat.js
