"use strict";
const Skins = (() => {
  const e = new Map(),
    t = new Map();
  let s = null;
  function presets() {
    return self.SKIN_PRESETS
      ? Promise.resolve(self.SKIN_PRESETS)
      : (s ||
          (s = new Promise((e) => {
            const t = document.createElement("script");
            ((t.src = "js/skins_data.js"),
              (t.onload = () => e(self.SKIN_PRESETS || [])),
              (t.onerror = () => e([])),
              document.head.appendChild(t));
          })),
        s);
  }
  function normalize(e) {
    const t = document.createElement("canvas");
    ((t.width = 64), (t.height = 64));
    const s = t.getContext("2d");
    if (((s.imageSmoothingEnabled = !1), s.drawImage(e, 0, 0), 32 === e.height)) {
      const copy = (e, t, o, i, n, a) => {
        const l = s.getImageData(e, t, n, a),
          r = s.createImageData(n, a);
        for (let e = 0; e < a; e++)
          for (let t = 0; t < n; t++)
            for (let s = 0; s < 4; s++)
              r.data[4 * (e * n + t) + s] = l.data[4 * (e * n + (n - 1 - t)) + s];
        s.putImageData(r, e + o, t + i);
      };
      (copy(4, 16, 16, 32, 4, 4),
        copy(8, 16, 16, 32, 4, 4),
        copy(0, 20, 24, 32, 4, 12),
        copy(4, 20, 16, 32, 4, 12),
        copy(8, 20, 8, 32, 4, 12),
        copy(12, 20, 16, 32, 4, 12),
        copy(44, 16, -8, 32, 4, 4),
        copy(48, 16, -8, 32, 4, 4),
        copy(40, 20, 0, 32, 4, 12),
        copy(44, 20, -8, 32, 4, 12),
        copy(48, 20, -16, 32, 4, 12),
        copy(52, 20, -8, 32, 4, 12));
    }
    const o = s.getImageData(0, 0, 64, 64),
      i = o.data,
      A = (e, t) => i[4 * (64 * t + e) + 3],
      opaque = (e, t, s, o) => {
        for (let n = t; n < o; n++) for (let t = e; t < s; t++) i[4 * (64 * n + t) + 3] = 255;
      };
    (opaque(0, 0, 32, 16), opaque(0, 16, 64, 32), opaque(16, 48, 48, 64));
    let n = !0;
    for (let e = 0; e < 16 && n; e++)
      for (let t = 32; t < 64; t++)
        if (A(t, e) < 128) {
          n = !1;
          break;
        }
    if (n) for (let e = 0; e < 16; e++) for (let t = 32; t < 64; t++) i[4 * (64 * e + t) + 3] = 0;
    return (s.putImageData(o, 0, 0), t);
  }
  function load(s) {
    if (e.has(s)) return Promise.resolve(e.get(s));
    if (t.has(s)) return t.get(s);
    const o = (async () => {
      let t,
        o = !1;
      if (s.startsWith("p:")) {
        const e = [...(self.SKINS_BUILTIN || []), ...(await presets())].find(
          (e) => e.id === s.slice(2),
        );
        if (!e) throw new Error("没有这个皮肤");
        ((t = e.png), (o = e.slim));
      } else {
        if (!s.startsWith("m:")) throw new Error("皮肤编号不对");
        {
          let e = null;
          try {
            e = JSON.parse(localStorage.getItem("mcjs-skin-" + s.slice(2).toLowerCase()) || "null");
          } catch (e) {}
          if (!e || Date.now() - e.at > 864e5) {
            ((e = await RoomService.api("/api/skin?name=" + encodeURIComponent(s.slice(2)))),
              (e.at = Date.now()));
            try {
              localStorage.setItem("mcjs-skin-" + s.slice(2).toLowerCase(), JSON.stringify(e));
            } catch (e) {}
          }
          ((t = "data:image/png;base64," + e.png), (o = e.slim));
        }
      }
      const i = normalize(
        await ((e) =>
          new Promise((t, s) => {
            const o = new Image();
            ((o.onload = () => t(o)),
              (o.onerror = () => s(new Error("皮肤图片读不出来"))),
              (o.src = e));
          }))(t),
      );
      return ((i.slim = o), e.set(s, i), i);
    })();
    return (t.set(s, o), o.catch(() => t.delete(s)), o);
  }
  let o = null;
  function lookOf(e, t) {
    const s = (function lookOf0(e, t) {
      if (t === e.player) {
        if (o) return o;
        const e = Account.data && Account.data.skin;
        return e
          ? e.skin && e.skin.startsWith("m:") && !Account.has("skin")
            ? { skin: null, slim: !1, cape: e.cape }
            : e
          : self.DEFAULT_LOOK || null;
      }
      return t.look || self.DEFAULT_LOOK || null;
    })(e, t);
    return self.LOOK_FILTER ? self.LOOK_FILTER(s) : s;
  }
  function initModels(e) {
    if (e.models.steve_slim) return;
    const P = (t) => {
      for (const s of t) s.mesh = e.makeModelPart(s.boxes, 64, 64);
      return { parts: t };
    };
    ((e.models.steve_slim = P(
      e.models.steve.parts.map((e) =>
        "rarm" === e.name
          ? {
              name: "rarm",
              pivot: [5.5, 22, 0],
              boxes: [
                [40, 16, -1.5, -10, -2, 3, 12, 4],
                [40, 32, -1.5, -10, -2, 3, 12, 4, 0.25],
              ],
            }
          : "larm" === e.name
            ? {
                name: "larm",
                pivot: [-5.5, 22, 0],
                boxes: [
                  [32, 48, -1.5, -10, -2, 3, 12, 4],
                  [48, 48, -1.5, -10, -2, 3, 12, 4, 0.25],
                ],
              }
            : {
                name: e.name,
                pivot: e.pivot,
                boxes: e.boxes,
                rotX: e.rotX,
                rotY: e.rotY,
                parent: e.parent,
              },
      ),
    )),
      (e.models.arm_slim = P([
        {
          name: "arm",
          pivot: [0, 0, 0],
          boxes: [
            [40, 16, -1.5, -10, -2, 3, 12, 4],
            [40, 32, -1.5, -10, -2, 3, 12, 4, 0.25],
          ],
        },
      ])),
      (e.models.arm_left_slim = P([
        {
          name: "arm",
          pivot: [0, 0, 0],
          boxes: [
            [32, 48, -1.5, -10, -2, 3, 12, 4],
            [48, 48, -1.5, -10, -2, 3, 12, 4, 0.25],
          ],
        },
      ])));
  }
  // ---------------------------------------------------------------- W12c（GDD-10 §1）：皮肤槽位常态化
  // 槽位清单 = GUN_CN × 8 + MELEE（近战类排序置于 8 类枪之后，与 potato.js 皮肤页 knife 页签键对齐）。
  // melee 数据源 self.SKIN_MELEE（js/skins_data.js，W12c）；涂装/刀具中文名对齐 xzguns bundle.js 既有语料；
  // tileIndex 运行期对 ASSETS.tiles 校验（tiles.webp 既有索引，零新增资源）。
  function meleeSlot() {
    const d = self.SKIN_MELEE;
    if (!d) return null;
    const rules = (self.XZ && self.XZ.skins && self.XZ.skins.rules) || null;
    const tileIdx = (name) => {
      try { return self.ASSETS && ASSETS.tiles ? (ASSETS.tiles[name] != null ? ASSETS.tiles[name] : null) : null; }
      catch (e) { return null; }
    };
    const knives = [];
    for (const k in d.knives) {
      const src = d.knives[k];
      const knife = {
        key: k,
        cn: (rules && rules.KNIFE_CN && rules.KNIFE_CN[k]) || src.cn || k,
        desc: src.desc || "",
        paints: [],
      };
      for (const p of src.paints || [])
        knife.paints.push({
          key: p.key,
          name: p.name,
          cn: (rules && rules.PAINT_CN && rules.PAINT_CN[p.key]) || p.key,
          price: (rules && rules.PAINT_PRICE) || p.price || 300,
          tile: p.tile,
          glow: p.glow || null,
          tileIndex: tileIdx(p.tile),
          voucher: p.voucher || null,
          desc: p.desc || "",
        });
      knives.push(knife);
    }
    return { key: d.key, cn: d.cn, how: d.how || "", knives };
  }
  function slots() {
    const out = [];
    const rules = (self.XZ && self.XZ.skins && self.XZ.skins.rules) || null;
    if (rules && rules.GUN_CN)
      for (const k in rules.GUN_CN) out.push({ kind: "gun", key: k, cn: rules.GUN_CN[k] });
    const m = meleeSlot();
    if (m) out.push({ kind: "melee", key: m.key, cn: m.cn, how: m.how, knives: m.knives });
    return out;
  }
  return {
    presets: presets,
    load: load,
    normalize: normalize,
    slots: slots,
    meleeSlot: meleeSlot,
    modelOf(e, t) {
      const s = lookOf(e, t);
      return s && s.slim ? (initModels(e.renderer), "steve_slim") : "steve";
    },
    texOf(t, s) {
      const o = lookOf(t, s);
      return (function tex(t, s) {
        if (!s) return "steve";
        const o = ((e) => "skin_" + e.replace(/[^A-Za-z0-9_:]/g, "_"))(s);
        if (t.entityTex[o]) return o;
        const i = e.get(s);
        return i ? ((t.entityTex[o] = t.tex2D(i, !1)), o) : (load(s).catch(() => {}), "steve");
      })(t.renderer, o && o.skin);
    },
    armOf(e, t) {
      const s = lookOf(e, e.player);
      return s && s.slim
        ? (initModels(e.renderer), t ? "arm_left_slim" : "arm_slim")
        : t
          ? "arm_left"
          : "arm";
    },
    setPreview(e) {
      o = e;
    },
    preview: () => o,
    mine(e) {
      const t = lookOf(e, e.player) || {};
      return {
        skin: t.skin || null,
        slim: !!t.slim,
        cape: Capes.of(e, e.player),
        ...("undefined" != typeof Cosmetics ? Cosmetics.mine(e) : {}),
      };
    },
  };
})();
(() => {
  const word = (e) => !e || /^[a-z]{3,16}$/.test(String(e)),
    e = NetClient.prototype.onMessage;
  ((NetClient.prototype.onMessage = function (t) {
    if (t && "look" === t.t) {
      if (
        !(s = t.look) ||
        "object" != typeof s ||
        (null !== s.skin && !/^(p:[a-z_]{3,20}|m:[A-Za-z0-9_]{3,16})$/.test(s.skin || "")) ||
        (s.cape && !Capes.info(s.cape)) ||
        !word(s.hat) ||
        !word(s.pet) ||
        !word(s.pre)
      )
        return;
      (this.looks || (this.looks = new Map())).set(String(t.name), {
        skin: t.look.skin || null,
        slim: !!t.look.slim,
        cape: t.look.cape || null,
        hat: t.look.hat || null,
        pet: t.look.pet || null,
        pre: t.look.pre || null,
      });
      for (const e of this.g.entities)
        "player" === e.type && e.name === t.name && (e.look = this.looks.get(t.name));
      return;
    }
    var s;
    const o = e.call(this, t);
    return (t && "room" === t.t && this.sendLook(), o);
  }),
    (NetClient.prototype.sendLook = function () {
      try {
        this.send({ t: "look", look: Skins.mine(this.g) });
      } catch (e) {}
    }));
  const t = Game.prototype.drawMob;
  Game.prototype.drawMob = function (e, s, o, i, n) {
    return (
      "player" === e.type &&
        e !== this.player &&
        !e.look &&
        this.net &&
        this.net.looks &&
        (e.look = this.net.looks.get(e.name) || null),
      t.call(this, e, s, o, i, n)
    );
  };
})();
class WardrobeScreen extends FormScreen {
  constructor(e, t) {
    (super(e, "皮肤和装饰", t), (this.titleY = 8));
    const s = (Account.data && Account.data.skin) || {};
    ((this.look = {
      skin: s.skin || null,
      slim: !!s.slim,
      cape: s.cape || null,
      hat: s.hat || null,
      pet: s.pet || null,
      pre: s.pre || null,
    }),
      (this.tab = "skin"),
      (this.page = 0),
      (this.mojang = s.skin && s.skin.startsWith("m:") ? s.skin.slice(2) : ""),
      (this.list = []),
      (this.yaw = 0.5),
      (this.drag = null),
      (this.busy = !1),
      Skins.presets().then((e) => {
        this.list = e;
        for (const t of e) Skins.load("p:" + t.id).catch(() => {});
        this.game.ui.screen === this && this.layout();
      }),
      Account.loadGate());
  }
  get dirty() {
    const e = (Account.data && Account.data.skin) || {};
    return (
      (e.skin || null) !== this.look.skin ||
      !!e.slim !== this.look.slim ||
      ["cape", "hat", "pet", "pre"].some((t) => (e[t] || null) !== (this.look[t] || null))
    );
  }
  toCheckin(e) {
    if (this.giftOf(e) && "undefined" != typeof NewsBoard)
      return void NewsBoard.open(this.game, this, !1);
    const t = "undefined" != typeof Cosmetics && Cosmetics.info(e);
    t && "mods" === t.go && "function" == typeof openModsScreen
      ? openModsScreen(this.game, this)
      : t && "shareholders" === t.go && "function" == typeof openShareholders
        ? openShareholders(this.game, this)
        : t && t.how
          ? this.say(t.how[0])
          : "undefined" != typeof CheckinScreen && "undefined" != typeof Checkin && Checkin.shown()
            ? this.game.ui.open(new CheckinScreen(this.game, this))
            : this.say("签到活动奖励：活动期间每天登录签到，累计签到就能领");
  }
  giftOf(e) {
    return (
      !!e &&
      "undefined" != typeof NewsBoard &&
      (NewsBoard.list || []).some((t) => t.gift === e && !t.draft)
    );
  }
  evHow(e) {
    if (this.giftOf(e)) return ["公告里的礼物", "点一下去领取"];
    const t = "undefined" != typeof Cosmetics && Cosmetics.info(e);
    if (t && t.how) return t.how;
    const s = "undefined" != typeof Checkin && Checkin.st,
      o = (s && s.event && Array.isArray(s.event.rewards) ? s.event.rewards : []).indexOf(e);
    return [
      o >= 0 ? "签到第 " + (o + 1) + " 天" : "签到活动奖励",
      ...("undefined" != typeof Checkin && Checkin.shown() ? ["点一下去签到"] : []),
    ];
  }
  pv() {
    const e = this.game.ui;
    return { x: Math.max(8, Math.floor(e.w / 2 - 190)), y: 26, w: 110, h: 170 };
  }
  layout() {
    const e = this.game.ui,
      t = this.game,
      s = this.pv(),
      o = s.x + s.w + 10,
      i = Math.min(270, e.w - o - 8);
    ((this.fields = {}), (this.widgets = []));
    const n = [
        ["skin", "皮肤"],
        ["cape", "披风"],
        ["hat", "帽子"],
        ["pet", "宠物"],
        ["pre", "前缀"],
      ],
      a = i / n.length;
    n.forEach(([e, t], s) =>
      this.widgets.push({
        x: Math.round(o + s * a),
        y: 24,
        w: Math.round(o + (s + 1) * a) - Math.round(o + s * a) - 2,
        h: 18,
        label: t,
        color: this.tab === e ? "#FFFF55" : void 0,
        onClick: () => {
          ((this.tab = e), (this.page = 0), this.layout());
        },
      }),
    );
    const l = 30,
      r = Math.max(3, Math.floor(i / l));
    if ("skin" === this.tab) {
      const e = [{ id: null, name: "默认（史蒂夫）" }, ...this.list.filter((e) => e.own)];
      e.forEach((e, t) => {
        const s = o + (t % r) * l,
          i = 48 + 32 * Math.floor(t / r);
        this.widgets.push({
          x: s,
          y: i,
          w: 28,
          h: 28,
          label: "",
          skinIcon: e.id,
          sel: (e.id ? "p:" + e.id : null) === this.look.skin,
          tip: [e.name + (e.id ? (e.slim ? "（纤细）" : "（经典）") : "")],
          onClick: () => {
            ((this.look.skin = e.id ? "p:" + e.id : null),
              (this.look.slim = !!e.slim),
              this.layout());
          },
        });
      });
      const s = 48 + 32 * Math.ceil(e.length / r) + 6;
      (this.widgets.push({
        x: o,
        y: s,
        w: i,
        h: 18,
        label: () => "手臂：" + (this.look.slim ? "纤细（3 像素，Alex）" : "经典（4 像素，Steve）"),
        onClick: () => {
          this.look.slim = !this.look.slim;
        },
      }),
        Account.has("skin")
          ? (this.addField(
              "mojang",
              o,
              s + 36,
              i - 54,
              "按玩家名使用皮肤（输入玩家名）",
              16,
              nameOnly,
            ),
            this.widgets.push({
              x: o + i - 50,
              y: s + 36,
              w: 50,
              h: 20,
              label: () => (this.busy ? "…" : "使用"),
              enabled: !this.busy,
              onClick: () => this.useMojang(),
            }))
          : this.widgets.push({
              x: o,
              y: s + 26,
              w: i,
              h: 20,
              gold: !0,
              label: "解锁：按玩家名使用皮肤",
              onClick: () => t.ui.open(new UnlockScreen(t, this)),
            }));
    } else if ("cape" === this.tab) {
      [
        { id: null, name: "不穿披风" },
        ...Capes.list.filter((e) => !e.admin || Capes.unlocked(e.id)),
      ].forEach((e, s) => {
        const i = o + (s % r) * l,
          n = 48 + 42 * Math.floor(s / r),
          a = e.id && !Capes.unlocked(e.id),
          h = e.ev
            ? this.evHow("cape:" + e.id)
            : [e.anim ? "关注 UP 主解锁" : "给视频三连解锁", "点一下去解锁"];
        this.widgets.push({
          x: i,
          y: n,
          w: 28,
          h: 38,
          label: "",
          capeIcon: e.id,
          locked: a,
          sel: e.id === this.look.cape,
          tip: [e.name + (e.anim ? "（动态）" : ""), ...(a ? h : [])],
          onClick: () => {
            a && e.ev
              ? this.toCheckin("cape:" + e.id)
              : a
                ? t.ui.open(
                    new UnlockScreen(
                      t,
                      this,
                      e.anim ? "关注 UP 主就能穿上动态披风" : "给视频三连就能穿上静态披风",
                    ),
                  )
                : ((this.look.cape = e.id), this.layout());
          },
        });
      });
    } else {
      const e = this.tab,
        t = "undefined" != typeof Cosmetics ? Cosmetics : null;
      [
        { id: null, name: { hat: "不戴帽子", pet: "不带宠物", pre: "不用前缀" }[e] },
        ...(t ? t.LIST.filter((t) => t.kind === e) : []),
      ].forEach((s, i) => {
        const n = o + (i % r) * l,
          a = 48 + 32 * Math.floor(i / r),
          h = s.id ? s.id.split(":")[1] : null,
          c = !!s.id && !t.has(s.id);
        this.widgets.push({
          x: n,
          y: a,
          w: 28,
          h: 28,
          label: "",
          cosIcon: s.id,
          locked: c,
          sel: h === (this.look[e] || null),
          tip: [s.name, ...(c ? this.evHow(s.id) : [])],
          onClick: () => {
            c ? this.toCheckin(s.id) : ((this.look[e] = h), this.layout());
          },
        });
      });
    }
    this.widgets.push(
      {
        x: s.x,
        y: e.h - 28,
        w: 110,
        h: 20,
        label: () => (this.busy ? "正在保存…" : this.dirty ? "保存" : "已保存"),
        gold: this.dirty,
        enabled: !this.busy && this.dirty,
        onClick: () => this.saveLook(),
      },
      { x: s.x + 116, y: e.h - 28, w: 110, h: 20, label: "返回", onClick: () => this.back() },
    );
  }
  async useMojang() {
    const e = nameOnly(this.mojang || "");
    if (e.length < 3) this.say("输入玩家名（3–16 个英文字母、数字或下划线）", !0);
    else {
      ((this.busy = !0), this.say("正在查找 " + e + " 的皮肤…"), this.layout());
      try {
        const t = await Skins.load("m:" + e);
        ((this.look.skin = "m:" + e),
          (this.look.slim = !!t.slim),
          this.say("找到了：" + e + (t.slim ? "（纤细手臂）" : "（经典手臂）")));
      } catch (e) {
        this.say(e.message, !0);
      }
      ((this.busy = !1), this.layout());
    }
  }
  async saveLook() {
    if (Account.loggedIn) {
      ((this.busy = !0), this.layout());
      try {
        (await Account.update({ skin: { ...this.look } }),
          this.say("已保存"),
          this.game.net && this.game.net.sendLook());
      } catch (e) {
        this.say(e.message, !0);
      }
      ((this.busy = !1), this.layout());
    } else this.game.ui.open(new LoginScreen(this.game, () => this.game.ui.open(this)));
  }
  back() {
    (Skins.setPreview(null), super.back());
  }
  mouseDown(e, t, s, o) {
    const i = this.pv();
    t >= i.x && t < i.x + i.w && s >= i.y && s < i.y + i.h
      ? (this.drag = { x: t, yaw: this.yaw })
      : super.mouseDown(e, t, s, o);
  }
  mouseMove(e, t, s) {
    this.drag && e.mouse.down
      ? (this.yaw = this.drag.yaw + 0.03 * (t - this.drag.x))
      : super.mouseMove(e, t, s);
  }
  mouseUp(e) {
    ((this.drag = null), super.mouseUp(e));
  }
  draw(e) {
    const t = this.widgets.filter(
        (e) => void 0 !== e.skinIcon || void 0 !== e.capeIcon || void 0 !== e.cosIcon,
      ),
      s = this.widgets.filter((e) => e.tip);
    for (const e of s) ((e.tip0 = e.tip), (e.tip = null));
    try {
      super.draw(e);
    } finally {
      for (const e of s) ((e.tip = e.tip0), delete e.tip0);
    }
    const o = e.ctx;
    for (const e of t)
      if (
        ((o.strokeStyle = e.sel ? "#FFFFFF" : "#555555"),
        (o.lineWidth = 1),
        o.strokeRect(e.x + 0.5, e.y + 0.5, e.w - 1, e.h - 1),
        void 0 !== e.skinIcon)
      ) {
        const t = e.skinIcon ? this.faceOf("p:" + e.skinIcon) : this.game.renderer.images.steve;
        t &&
          (o.drawImage(t, 8, 8, 8, 8, e.x + 4, e.y + 4, e.w - 8, e.h - 8),
          o.drawImage(t, 40, 8, 8, 8, e.x + 3, e.y + 3, e.w - 6, e.h - 6));
      } else
        e.capeIcon
          ? (Capes.drawFlat(o, e.capeIcon, e.x + 4, e.y + 3, 2, e.locked),
            e.locked && drawIcon(o, "lock", e.x + e.w - 11, e.y + e.h - 11, 1, "#FFD24A"))
          : e.cosIcon
            ? (Cosmetics.drawIcon(o, e.cosIcon, e.x + 2, e.y + 2, e.w - 4, e.locked),
              e.locked && drawIcon(o, "lock", e.x + e.w - 11, e.y + e.h - 11, 1, "#FFD24A"))
            : Font.center(o, "无", e.x + e.w / 2, e.y + e.h / 2 - 4, "#A0A0A0");
    for (const t of s)
      e.hit(t) &&
        e.tooltip(
          t.tip.map((e) => ({ text: e })),
          e.mouse.x,
          e.mouse.y,
        );
  }
  faceOf(e) {
    const t = this.faceCache || (this.faceCache = new Map());
    return t.has(e)
      ? t.get(e)
      : (Skins.load(e)
          .then((s) => t.set(e, s))
          .catch(() => {}),
        null);
  }
  drawExtra(e) {
    const t = e.ctx,
      s = this.pv(),
      o = this.game;
    (drawCard(t, s.x - 2, s.y - 2, s.w + 4, s.h + 4, !1),
      this.drag || (this.yaw += 0.01),
      Skins.setPreview(this.look));
    const i = o.renderer.playerPreview(o, e, s.x, s.y, s.w, s.h, { yaw: this.yaw });
    (Skins.setPreview(null),
      i && ((t.imageSmoothingEnabled = !1), t.drawImage(i, s.x, s.y, s.w, s.h)),
      "pre" === this.tab &&
        "undefined" != typeof Cosmetics &&
        Font.center(
          t,
          fitText(
            Cosmetics.preChar(this.look.pre) + ((Account.loggedIn && Account.name) || "玩家"),
            s.w - 4,
          ),
          s.x + s.w / 2,
          s.y + 4,
          "#FFFFFF",
        ),
      Font.center(t, "拖动可以转动", s.x + s.w / 2, s.y + s.h + 4, "#808080"),
      this.drawFields(e),
      Account.loggedIn ||
        Font.center(
          t,
          fitText("登录后才能保存（换设备、联机时别人也能看到）", e.w - 8),
          e.w / 2,
          e.h - 42,
          "#FFD24A",
        ));
  }
}
//# sourceURL=js/skins.js
