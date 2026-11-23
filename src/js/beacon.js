"use strict";
const BEACON_POWERS = [
    ["speed", "haste"],
    ["resistance", "jump_boost"],
    ["strength"],
    ["regeneration"],
  ],
  BEACON_BASE = new Set(
    ["iron_block", "gold_block", "emerald_block", "diamond_block", "netherite_block"]
      .map((e) => BID[e])
      .filter((e) => void 0 !== e),
  ),
  BEACON_PAY = /^(iron_ingot|gold_ingot|emerald|diamond|netherite_ingot)$/,
  beaconTier = (e) => BEACON_POWERS.findIndex((t) => t.includes(e)),
  BEAM_COLOR = new Int32Array(MAX_BLOCKS).fill(-1);
for (let e = 0; e < MAX_BLOCKS; e++) {
  const t = BLOCKS[e],
    n = t && /^(.+)_stained_glass(_pane)?$/.exec(t.key);
  n && void 0 !== DYE_RGB[n[1]] && (BEAM_COLOR[e] = DYE_RGB[n[1]]);
}
void 0 !== BID.beacon && (BEAM_COLOR[BID.beacon] = DYE_RGB.white);
const beamAvg = (e, t) =>
  (((((e >> 16) & 255) + ((t >> 16) & 255)) >> 1) << 16) |
  (((((e >> 8) & 255) + ((t >> 8) & 255)) >> 1) << 8) |
  (((255 & e) + (255 & t)) >> 1);
function beaconBeam(e, t, n, o) {
  const s = [];
  for (let i = n; i < HEIGHT; i++) {
    const c = i === n ? BID.beacon : e.getBlock(t, i, o),
      r = BEAM_COLOR[c],
      a = s[s.length - 1];
    if (r >= 0)
      s.length <= 1
        ? s.push({ y: i, h: 1, c: r })
        : r === a.c
          ? a.h++
          : s.push({ y: i, h: 1, c: beamAvg(a.c, r) });
    else {
      if (OPACITY[c] >= 15 && c !== BID.bedrock) return [];
      a.h++;
    }
  }
  return s;
}
function beaconLevels(e, t, n, o) {
  let s = 0;
  for (let i = 1; i <= 4; i++) {
    const c = n - i;
    if (c < 0) break;
    for (let n = t - i; n <= t + i; n++)
      for (let t = o - i; t <= o + i; t++) if (!BEACON_BASE.has(e.getBlock(n, c, t))) return s;
    s = i;
  }
  return s;
}
Game.prototype.beaconScan = function () {
  const e = this.world,
    t = BID.beacon,
    n = this.beacons || new Map(),
    o = new Map();
  if (e && void 0 !== t) {
    for (const s of e.chunks.values())
      for (let i = 0; i < s.bs.length; i++) {
        const c = s.bs[i];
        if (!c) continue;
        let r = -1;
        if (c.n < 0) r = t;
        else
          for (let e = 0; e < c.n; e++)
            if (c.p[e] === t) {
              r = e;
              break;
            }
        if (!(r < 0))
          for (let t = c.d.indexOf(r); t >= 0; t = c.d.indexOf(r, t + 1)) {
            const c = 16 * s.cx + (15 & t),
              r = 16 * i + (t >> 8),
              a = 16 * s.cz + ((t >> 4) & 15),
              h = c + "," + r + "," + a,
              l = n.get(h) || { pos: [c, r, a] };
            ((l.segs = beaconBeam(e, c, r, a)),
              (l.levels = beaconLevels(e, c, r, a)),
              void 0 === l.on && (l.on = l.levels > 0 && l.segs.length > 0),
              o.set(h, l));
          }
      }
    this.beacons = o;
  }
};
const _beaconTick = Game.prototype.tickFurnaces;
((Game.prototype.tickFurnaces = function () {
  if ((_beaconTick.call(this), this.net || !this.beacons)) return;
  if (((this.beaconT = ((this.beaconT || 0) + 1) % 80), this.beaconT)) return;
  const e = this.world,
    t = this.player;
  for (const [n, o] of this.beacons) {
    const [s, i, c] = o.pos;
    if (!e.isLoaded(s, c) || e.getBlock(s, i, c) !== BID.beacon) continue;
    ((o.levels = beaconLevels(e, s, i, c)), (o.segs = beaconBeam(e, s, i, c)));
    const r = o.levels > 0 && o.segs.length > 0,
      a = [s + 0.5, i + 0.5, c + 0.5];
    if (
      (r !== o.on &&
        (Sound.ev(r ? "block.beacon.activate" : "block.beacon.deactivate", a, 1, 1), (o.on = r)),
      !r)
    )
      continue;
    Sound.ev("block.beacon.ambient", a, 1, 1);
    const h = this.blockEntities.get(n);
    if (!h || !h.primary || !t || t.deathTime) continue;
    const l = o.levels,
      d = 10 * l + 10,
      b = 20 * (9 + 2 * l),
      u = l >= 4 && h.primary === h.secondary ? 1 : 0,
      p = t.pos;
    p[0] > s - d - 0.3 &&
      p[0] < s + 1 + d + 0.3 &&
      p[2] > c - d - 0.3 &&
      p[2] < c + 1 + d + 0.3 &&
      p[1] + 1.8 > i - d &&
      (t.addEffect(h.primary, u, b, !0),
      l >= 4 && h.secondary && h.secondary !== h.primary && t.addEffect(h.secondary, 0, b, !0));
  }
}),
  (Game.prototype.beaconEntity = function (e, t, n) {
    const o = `${e},${t},${n}`;
    let s = this.blockEntities.get(o);
    return (
      (s && "beacon" === s.type) ||
        ((s = { type: "beacon", pos: [e, t, n], primary: null, secondary: null }),
        this.blockEntities.set(o, s)),
      s
    );
  }));
const _beaconDraw = Game.prototype.drawChests;
Game.prototype.drawChests = function (e, t) {
  _beaconDraw.call(this, e, t);
  const n = performance.now();
  if (
    ((!this.beaconAt || n - this.beaconAt > 1e3) && ((this.beaconAt = n), this.beaconScan()),
    !this.beacons || !this.beacons.size)
  )
    return;
  const o = this.renderer,
    s = (this.worldTime % 40) + e,
    i = o.camPos;
  for (const e of this.beacons.values()) {
    if (!e.levels || !e.segs.length) continue;
    const [t, , n] = e.pos;
    Math.hypot(t + 0.5 - i[0], n + 0.5 - i[2]) > 16 * (this.settings.renderDist || 12) + 32 ||
      e.segs.forEach((i, c) => {
        const r = c === e.segs.length - 1 ? i.y + 1024 : i.y + i.h,
          a = [((i.c >> 16) & 255) / 255, ((i.c >> 8) & 255) / 255, (255 & i.c) / 255],
          h = [t + 0.5, i.y, n + 0.5],
          l = [t + 0.5, r, n + 0.5],
          d = 0.2 * -s + i.y / 4;
        (o.drawBeam(h, l, "beacon_beam", 0.2, [a[0], a[1], a[2], 1], d, "alpha"),
          o.drawBeam(h, l, "beacon_beam", 0.25, [a[0], a[1], a[2], 0.125], 0.5 * d, "alpha"));
      });
  }
};
class BeaconScreen extends StationScreen {
  constructor(e, t, n) {
    (super(e, "gui_beacon", "", t),
      (this.gw = 230),
      (this.gh = 219),
      (this.view = n),
      this.own(0, 136, 110, { accept: (e) => BEACON_PAY.test(ITEMS[e.id].key), max: 1 }),
      this.addPlayerSlots(137, 195));
    for (const e of this.slots) ("main" !== e.group && "hotbar" !== e.group) || (e.x += 28);
    ((this.primary = n.primary), (this.secondary = n.secondary));
  }
  buttons() {
    const e = [];
    for (let t = 0; t <= 2; t++) {
      const n = BEACON_POWERS[t],
        o = n.length,
        s = 22 * o + 2 * (o - 1);
      n.forEach((n, o) =>
        e.push({ kind: "p", e: n, x: 76 + 24 * o - Math.floor(s / 2), y: 22 + 25 * t, tier: t }),
      );
    }
    const t = BEACON_POWERS[3].length + 1,
      n = 22 * t + 2 * (t - 1);
    return (
      BEACON_POWERS[3].forEach((t, o) =>
        e.push({ kind: "s", e: t, x: 167 + 24 * o - Math.floor(n / 2), y: 47, tier: 3 }),
      ),
      e.push({
        kind: "up",
        e: this.primary,
        x: 167 + 24 * (t - 1) - Math.floor(n / 2),
        y: 47,
        tier: 3,
      }),
      e.push({ kind: "ok", x: 164, y: 107 }, { kind: "no", x: 190, y: 107 }),
      e
    );
  }
  levels() {
    return this.view.levels;
  }
  active(e) {
    const t = this.levels();
    return "p" === e.kind
      ? e.tier < t
      : "s" === e.kind || "up" === e.kind
        ? t >= 4 && !!this.primary && !!e.e
        : "ok" !== e.kind || (!!this.S(0) && !!this.primary);
  }
  selected(e) {
    return (
      ("p" === e.kind && e.e === this.primary) ||
      ("s" === e.kind && e.e === this.secondary) ||
      ("up" === e.kind && !!e.e && e.e === this.secondary)
    );
  }
  buttonIndex(e, t) {
    return this.buttons().findIndex(
      (n) =>
        e >= this.x + n.x && t >= this.y + n.y && e < this.x + n.x + 22 && t < this.y + n.y + 22,
    );
  }
  buttonAt(e, t) {
    return this.buttons()[this.buttonIndex(e, t)] || null;
  }
  press(e) {
    e &&
      this.active(e) &&
      (Sound.click && Sound.click(),
      "p" === e.kind
        ? ((this.primary = e.e),
          this.secondary &&
            "regeneration" !== this.secondary &&
            this.secondary !== e.e &&
            (this.secondary = null))
        : "s" === e.kind || "up" === e.kind
          ? (this.secondary = e.e)
          : "ok" === e.kind
            ? this.confirm()
            : this.game.ui.close());
  }
  confirm() {
    const e = this.game;
    if (this.view.send) return (this.view.send(this.primary, this.secondary), void e.ui.close());
    const t = e.beaconEntity(...this.pos),
      n = this.held[0];
    n &&
      (n.count--,
      n.count || (this.held[0] = null),
      (t.primary = this.primary),
      (t.secondary = this.secondary),
      Sound.ev(
        "block.beacon.power_select",
        [this.pos[0] + 0.5, this.pos[1] + 0.5, this.pos[2] + 0.5],
        1,
        1,
      ),
      e.ui.close());
  }
  mouseDown(e, t, n, o, s) {
    const i = this.buttonAt(t, n);
    i ? 0 === o && this.press(i) : super.mouseDown(e, t, n, o, s);
  }
  offerAt(e, t) {
    return this.buttonIndex(e, t);
  }
  pick(e) {
    this.press(this.buttons()[e]);
  }
  drawExtra(e) {
    const t = e.ctx;
    (Font.center(t, "主效果", this.x + 62, this.y + 10, "#E0E0E0", !0),
      Font.center(t, "辅助效果", this.x + 169, this.y + 10, "#E0E0E0", !0));
    let n = null;
    for (const o of this.buttons()) {
      const s = this.x + o.x,
        i = this.y + o.y,
        c = this.active(o),
        r = e.hit({ x: s, y: i, w: 22, h: 22 });
      (e.sprite(
        c
          ? this.selected(o)
            ? "beacon_button_selected"
            : r
              ? "beacon_button_highlighted"
              : "beacon_button"
          : "beacon_button_disabled",
        s,
        i,
      ),
        "ok" !== o.kind && "no" !== o.kind
          ? o.e &&
            (e.img["eff_" + o.e] &&
              ((t.globalAlpha = c ? 1 : 0.5),
              e.sprite("eff_" + o.e, s + 2, i + 2, 18, 18),
              (t.globalAlpha = 1)),
            r && (n = [{ text: EFFECTS[o.e].cn + ("up" === o.kind ? " II" : "") }]))
          : (e.sprite("ok" === o.kind ? "beacon_confirm" : "beacon_cancel", s + 2, i + 2),
            r && (n = [{ text: "ok" === o.kind ? "完成" : "取消" }])));
    }
    (["netherite_ingot", "emerald", "diamond", "gold_ingot", "iron_ingot"].forEach((t, n) => {
      void 0 !== ITEM_KEY[t] &&
        e.drawItem({ id: ITEM_KEY[t], count: 1 }, this.x + [20, 41, 63, 86, 108][n], this.y + 109);
    }),
      (this.tip = n));
  }
  draw(e) {
    (super.draw(e), this.tip && !e.cursor && e.tooltip(this.tip, e.mouse.x, e.mouse.y));
  }
}
((WORKSTATIONS.beacon = (e, t) => {
  const n = e.beaconEntity(...t),
    o = t.join(","),
    s = {
      primary: n.primary,
      secondary: n.secondary,
      get levels() {
        const n = e.beacons && e.beacons.get(o);
        return n ? n.levels : beaconLevels(e.world, ...t);
      },
    };
  return new BeaconScreen(e, t, s);
}),
  void 0 !== BID.beacon && (BLOCKS[BID.beacon].onUse = "beacon"),
  (NET_STATION.beacon = (e, t) => {
    const n = t.props,
      eff = (e) => (e > 0 && EFFECT_LIST[e - 1] ? EFFECT_LIST[e - 1][0] : null),
      o = new BeaconScreen(e.g, null, {
        get levels() {
          return n[0] || 0;
        },
        primary: eff(n[1]),
        secondary: eff(n[2]),
        send: (t, n) =>
          e.send({ t: "beacon", p: t ? EFFECTS[t].id : null, s: n ? EFFECTS[n].id : null }),
      });
    let s = (0 | n[1]) + "," + (0 | n[2]);
    const i = o.drawExtra;
    return (
      (o.drawExtra = function (e) {
        const t = (0 | n[1]) + "," + (0 | n[2]);
        (t !== s && ((s = t), (this.primary = eff(n[1])), (this.secondary = eff(n[2]))),
          i.call(this, e));
      }),
      o
    );
  }));
//# sourceURL=js/beacon.js
