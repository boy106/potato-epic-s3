"use strict";
const keyOf3 = (t) => (t && ITEMS[t.id] ? ITEMS[t.id].key : ""),
  LUCK = (t) => enchLevel(t, "luck_of_the_sea") || 0,
  isBundle = (t) => !!t && /(^|_)bundle$/.test(keyOf3(t)),
  bundleWeight = (t) =>
    isBundle(t)
      ? 4 +
        (t.bundle || []).reduce(
          (t, e) =>
            t +
            bundleWeight(e) * (isBundle(e) ? 1 : 0) +
            (isBundle(e) ? 0 : (64 / maxStack(e.id)) * e.count),
          0,
        )
      : (64 / maxStack(t.id)) * t.count,
  bundleFill = (t) =>
    (t.bundle || []).reduce(
      (t, e) => t + (isBundle(e) ? bundleWeight(e) : (64 / maxStack(e.id)) * e.count),
      0,
    );
function bundleInsert(t, e) {
  if (!e || (isBundle(e) && e === t)) return e;
  e.bundle && e.bundle.length && isBundle(e);
  const s = isBundle(e) ? bundleWeight(e) : 64 / maxStack(e.id),
    o = 64 - bundleFill(t),
    i = Math.min(e.count, Math.floor(o / s));
  if (i <= 0) return e;
  t.bundle = t.bundle || [];
  const a = t.bundle.find((t) => sameKind(t, e) && t.count < maxStack(t.id) && !isBundle(t));
  if (a) {
    const s = Math.min(i, maxStack(a.id) - a.count);
    ((a.count += s), i > s && t.bundle.unshift({ ...e, count: i - s }));
  } else t.bundle.unshift({ ...e, count: i });
  return (
    Sound.ev("item.bundle.insert", null, 0.8, 0.8 + 0.4 * Math.random()),
    e.count - i > 0 ? { ...e, count: e.count - i } : null
  );
}
function bundleTake(t) {
  if (!t.bundle || !t.bundle.length) return null;
  const e = t.bundle.shift();
  return (Sound.ev("item.bundle.remove_one", null, 0.8, 0.8 + 0.4 * Math.random()), e);
}
((() => {
  const t = ContainerScreen.prototype.clickSlot;
  ContainerScreen.prototype.clickSlot = function (e, s, o) {
    const i = s.get(),
      a = e.cursor;
    if (2 === o && !s.output) {
      if (isBundle(a) && i && !isBundle(i)) {
        const t = bundleInsert(a, i);
        return (s.set(t), void this.changed());
      }
      if (isBundle(a) && !i) {
        const t = bundleTake(a);
        return void (t && (s.set(t), this.changed()));
      }
      if (isBundle(i) && a) {
        const t = bundleInsert(i, a);
        return ((e.cursor = t), void this.changed());
      }
      if (isBundle(i) && !a && i.bundle && i.bundle.length)
        return ((e.cursor = bundleTake(i)), void this.changed());
    }
    return t.call(this, e, s, o);
  };
  const e = UI.prototype.itemLines;
  UI.prototype.itemLines = function (t) {
    const s = e.call(this, t);
    if (isBundle(t)) {
      const e = t.bundle || [];
      for (const t of e.slice(0, 8))
        s.push({
          text: (ITEMS[t.id] ? ITEMS[t.id].cn : "未知物品") + " x" + t.count,
          color: "#AAAAAA",
        });
      e.length > 8 && s.push({ text: "以及 " + (e.length - 8) + " 个物品…", color: "#AAAAAA" });
      const o = Math.round(bundleFill(t));
      s.push({ text: e.length ? o + "/64" : "空", color: o >= 64 ? "#FF5555" : "#AAAAAA" });
    }
    return s;
  };
})(),
  (() => {
    const t = Game.prototype.useEquipment;
    Game.prototype.useEquipment = function (e, s) {
      const o = this.player,
        i = s && s.key;
      if (!i) return t.call(this, e, s);
      if (isBundle(e) && e.bundle && e.bundle.length && !this.target) {
        for (const t of e.bundle) this.dropFromPlayer(t);
        return (
          (e.bundle = []),
          Sound.ev("item.bundle.drop_contents", o.pos, 0.8, 1),
          o.swing(),
          !0
        );
      }
      if ("fishing_rod" === i) return (this.useRod(e), !0);
      if ("spyglass" === i)
        return (this.startUsing(e, "main"), Sound.ev("item.spyglass.use", o.pos, 1, 1), !0);
      if ("goat_horn" === i) {
        if ((o.cooldowns || {})[i] > this.tickCount) return !0;
        const t =
          EXTRA.instrument &&
          EXTRA.instrument[(e.instrument || "ponder_goat_horn").replace("minecraft:", "")];
        return (
          Sound.ev(
            t ? t.sound_event.replace("minecraft:", "") : "item.goat_horn.sound.0",
            o.pos,
            16,
            1,
          ),
          ((o.cooldowns || (o.cooldowns = {}))[i] = this.tickCount + 140),
          this.startUsing(e, "main"),
          !0
        );
      }
      return "brush" === i && this.target
        ? (this.startUsing(e, "main"), !0)
        : "map" === i
          ? (this.newMap(e), !0)
          : "writable_book" === i
            ? (this.ui.open(new BookScreen(this, e, !0)), !0)
            : "written_book" === i
              ? (this.ui.open(new BookScreen(this, e, !1)), !0)
              : "knowledge_book" === i
                ? (useOne(this, o),
                  (this.ui.actionBar = {
                    text: "配方已解锁",
                    t: performance.now(),
                    color: "#FFFF55",
                  }),
                  !0)
                : t.call(this, e, s);
    };
    const e = Game.prototype.usingTick;
    Game.prototype.usingTick = function (t) {
      const s = keyOf3(t),
        o = this.player;
      return (
        "brush" === s && this.brushTick(t),
        "goat_horn" === s && o.useT > 140 && (o.usingItem = null),
        e.call(this, t)
      );
    };
    const s = Game.prototype.releaseUsing;
    Game.prototype.releaseUsing = function (t) {
      return (
        "spyglass" === keyOf3(t) && Sound.ev("item.spyglass.stop_using", this.player.pos, 1, 1),
        s.call(this, t)
      );
    };
    const o = Game.prototype.tickFov;
    Game.prototype.tickFov = function () {
      o.call(this);
      const t = this.player;
      t &&
        t.usingItem === ITEM_KEY.spyglass &&
        0 === this.perspective &&
        (this.fovMod = this.oFovMod + 0.5 * (0.1 - this.oFovMod));
    };
    const i = UI.prototype.drawHUD;
    UI.prototype.drawHUD = function () {
      const t = this.game,
        e = t.player;
      if (e && e.usingItem === ITEM_KEY.spyglass && 0 === t.perspective) {
        const e = t.renderer.images["@misc/spyglass_scope"] || this.img.spyglass_scope,
          s = Math.min(this.w, this.h),
          o = this.ctx;
        return (
          (o.fillStyle = "#000"),
          o.fillRect(0, 0, (this.w - s) / 2 + 1, this.h),
          o.fillRect((this.w + s) / 2 - 1, 0, (this.w - s) / 2 + 1, this.h),
          void (
            e &&
            ((o.imageSmoothingEnabled = !1),
            o.drawImage(e, (this.w - s) / 2, (this.h - s) / 2, s, s))
          )
        );
      }
      return i.call(this);
    };
  })());
class FishingHook extends Entity {
  constructor(t, e, s) {
    const o = e,
      i = [o.pos[0], o.pos[1] + o.eye(), o.pos[2]];
    super(t, i[0], i[1], i[2], 0.25, 0.25);
    const a = t.lookDir();
    ((this.owner = e),
      (this.rod = s),
      (this.vel = [
        1.5 * a[0] + 0.02 * (Math.random() - 0.5),
        1.5 * a[1] + 0.1,
        1.5 * a[2] + 0.02 * (Math.random() - 0.5),
      ]),
      (this.wait = 0),
      (this.nibble = 0),
      (this.bite = 0),
      (this.hooked = null),
      (this.inWaterT = 0));
    const r = enchLevel(s, "lure") || 0;
    ((this.lure = r), this.resetWait());
  }
  resetWait() {
    ((this.wait = Math.max(20, randInt(100, 600) - 100 * this.lure)),
      (this.nibble = 0),
      (this.bite = 0));
  }
  tick() {
    (this.savePrev(), this.age++);
    const t = this.game,
      e = this.owner,
      s = this.vel;
    if (
      e.dead ||
      e.deathTime ||
      ("fishing_rod" !== keyOf3(e.inv.held) && "fishing_rod" !== keyOf3(e.inv.slots[40])) ||
      this.distTo(e) > 32
    )
      return ((this.dead = !0), void (e.fishHook = null));
    if (this.hooked)
      return this.hooked.dead
        ? void (this.hooked = null)
        : void (this.pos = [
            this.hooked.pos[0],
            this.hooked.pos[1] + 0.8 * this.hooked.h,
            this.hooked.pos[2],
          ]);
    if (!this.bobbing)
      for (const s of t.entities) {
        if (s === this || s === e || !(s instanceof Living) || s.dead || s.deathTime) continue;
        const t = s.box();
        if (
          this.pos[0] > t[0] - 0.1 &&
          this.pos[0] < t[3] + 0.1 &&
          this.pos[1] > t[1] - 0.1 &&
          this.pos[1] < t[4] + 0.1 &&
          this.pos[2] > t[2] - 0.1 &&
          this.pos[2] < t[5] + 0.1
        )
          return ((this.hooked = s), void s.hurt(1e-4, { type: "mob", attacker: e }));
      }
    const o = Math.floor(this.pos[0]),
      i = Math.floor(this.pos[1]),
      a = Math.floor(this.pos[2]),
      r = this.world.getBlock(o, i, a),
      l = this.world.waterAt(o, i, a);
    if (l && !this.bobbing)
      return (
        (this.bobbing = !0),
        (s[0] *= 0.3),
        (s[1] *= 0.2),
        (s[2] *= 0.3),
        void Sound.ev(
          "entity.fishing_bobber.splash",
          this.pos,
          0.25,
          1 + 0.4 * (Math.random() - 0.5),
        )
      );
    if (this.bobbing) {
      const t = r === WATER ? this.world.getMeta(o, i, a) : 0,
        e = l ? (this.world.waterAt(o, i + 1, a) ? 1 : (0 === t || t >= 8 ? 8 : 8 - t) / 9) : 0;
      let h = this.pos[1] + s[1] - i - e;
      (Math.abs(h) < 0.01 && (h += 0.1 * Math.sign(h)),
        (s[0] *= 0.9),
        (s[1] -= h * Math.random() * 0.2),
        (s[2] *= 0.9),
        l ? (this.inWaterT++, (this.openWater = !0), this.fishTick(o, i, a)) : (this.inWaterT = 0));
    }
    (l || this.onGround || (s[1] -= 0.03),
      this.move(s[0], s[1], s[2]),
      this.bobbing || (!this.onGround && !this.collidedH) || ((s[0] = 0), (s[1] = 0), (s[2] = 0)),
      (s[0] *= 0.92),
      (s[1] *= 0.92),
      (s[2] *= 0.92));
  }
  fishTick(t, e, s) {
    const o = this.game;
    if (this.bite > 0) return void (0 === --this.bite && this.resetWait());
    if (this.nibble > 0) {
      if (0 === --this.nibble) {
        ((this.vel[1] -= 0.2 * (0.6 + 0.4 * Math.random())),
          (this.bite = randInt(20, 40)),
          Sound.ev(
            "entity.fishing_bobber.splash",
            this.pos,
            0.25,
            1 + 0.4 * (Math.random() - 0.5),
          ));
        for (let t = 0; t < 8; t++)
          o.particles.spawn(
            "bubble",
            this.pos[0] + 0.3 * (Math.random() - 0.5),
            this.pos[1],
            this.pos[2] + 0.3 * (Math.random() - 0.5),
            0,
            0.1,
            0,
          );
      } else if (Math.random() < 0.3) {
        const t = Math.random() * Math.PI * 2,
          e = 0.05 * this.nibble;
        o.particles.spawn(
          "splash",
          this.pos[0] + Math.sin(t) * e,
          this.pos[1] + 0.1,
          this.pos[2] + Math.cos(t) * e,
          0,
          0.05,
          0,
        );
      }
      return;
    }
    const i = this.world.skyAt(t, e + 1, s) >= 15,
      a = o.weather > 0.3 && i;
    ((this.wait -= (a && Math.random() < 0.25 ? 2 : 1) * (i ? 1 : 0.5)),
      this.wait <= 0 && (this.nibble = randInt(20, 80)));
  }
  retrieve() {
    const t = this.game,
      e = this.owner;
    let s = 0;
    if (this.hooked) {
      const t = this.hooked,
        o = e.pos[0] - t.pos[0],
        i = e.pos[1] - t.pos[1],
        a = e.pos[2] - t.pos[2];
      ((t.vel[0] += 0.1 * o),
        (t.vel[1] += 0.1 * i + 0.08 * Math.sqrt(Math.hypot(o, i, a))),
        (t.vel[2] += 0.1 * a),
        (s = 5));
    } else if (this.bite > 0) {
      const o = rollLoot("gameplay/fishing", { e: this, luck: LUCK(this.rod), player: !0 });
      for (const s of o) {
        const o = new ItemEntity(t, this.pos[0], this.pos[1], this.pos[2], s, null),
          i = e.pos[0] - this.pos[0],
          a = e.pos[1] - this.pos[1],
          r = e.pos[2] - this.pos[2];
        ((o.vel = [0.1 * i, 0.1 * a + 0.08 * Math.sqrt(Math.hypot(i, a, r)), 0.1 * r]),
          t.entities.push(o));
      }
      (t.dropXp(e.pos[0], e.pos[1] + 0.5, e.pos[2] + 0.5, randInt(1, 6)),
        t.stats && (t.stats.fish = (t.stats.fish || 0) + 1),
        (s = 1));
    } else this.onGround && (s = 2);
    return ((this.dead = !0), (e.fishHook = null), s);
  }
  comp() {}
  drawSelf(t, e, s, o, i) {
    const a = t.renderer,
      r = a.gl,
      l = a.beTex("fishing_hook");
    if (!l) return;
    const h = a.camPos,
      c = h[0] - e[0],
      p = h[2] - e[2],
      u = Math.atan2(c, p),
      d = Math.atan2(h[1] - e[1], Math.hypot(c, p)),
      m = M4.create();
    (M4.translate(m, e[0], e[1] + 0.1, e[2]),
      M4.rotY(m, u),
      M4.rotX(m, -d),
      M4.rotX(m, Math.PI / 2),
      M4.scale(m, 0.25, 1, 0.25));
    const f = a.progTex;
    (r.useProgram(f.p),
      r.uniformMatrix4fv(f.u.u_vp, !1, a.vp),
      r.uniformMatrix4fv(f.u.u_model, !1, m));
    const g = 0.8 * Math.max(i[0], i[1] * o.day) + 0.2;
    (r.uniform4f(f.u.u_color, g, g, g, 1),
      f.u.u_cut && r.uniform1f(f.u.u_cut, 0.1),
      r.disable(r.CULL_FACE),
      r.activeTexture(r.TEXTURE0),
      r.bindTexture(r.TEXTURE_2D, a.entityTex[l]),
      r.bindVertexArray(a.quadVao),
      r.drawElements(r.TRIANGLES, 6, r.UNSIGNED_INT, 0),
      r.enable(r.CULL_FACE),
      f.u.u_cut && r.uniform1f(f.u.u_cut, 0));
    const y = this.owner,
      b = y.ipos ? y.ipos(s) : y.pos,
      k = 0 === t.perspective && y === t.player,
      _ = y.inv && "fishing_rod" !== keyOf3(y.inv.held) ? -1 : 1,
      w = [
        b[0],
        b[1] +
          (y === t.player && null != t.smoothEye
            ? t.smoothEye
            : y.eye
              ? y.eye()
              : y.sneaking
                ? 1.27
                : 1.62),
        b[2],
      ],
      M = y.swingT > 0 ? clamp((6 - y.swingT + s) / 6, 0, 1) : 0,
      v = Math.sin(Math.sqrt(M) * Math.PI);
    let x;
    if (k) {
      const e = y.yaw,
        s = t.lookDir(),
        o = [Math.cos(e), 0, -Math.sin(e)],
        i = [o[1] * s[2] - o[2] * s[1], o[2] * s[0] - o[0] * s[2], o[0] * s[1] - o[1] * s[0]],
        r = t.settings.fov || 70,
        l = 960 / r,
        h = 0.05 * Math.tan((r * Math.PI) / 360),
        c = (h * a.canvas.width) / a.canvas.height;
      x = [0, 1, 2].map((t) => (0.05 * s[t] + i[t] * h * -0.1 + o[t] * c * 0.525 * _) * l);
      const p = 0.5 * v,
        u = 0.7 * -v;
      ((x = [
        x[0] * Math.cos(p) + x[2] * Math.sin(p),
        x[1],
        x[2] * Math.cos(p) - x[0] * Math.sin(p),
      ]),
        (x = [
          x[0],
          x[1] * Math.cos(u) + x[2] * Math.sin(u),
          x[2] * Math.cos(u) - x[1] * Math.sin(u),
        ]));
    } else {
      const e = y === t.player && t.playerBodyYaw ? t.playerBodyYaw(s) : (y.bodyYaw ?? y.yaw),
        o = [Math.cos(e), -Math.sin(e)],
        i = [-Math.sin(e), -Math.cos(e)];
      x = [
        0.35 * o[0] * _ + 0.8 * i[0],
        (y.sneaking && !y.flying ? -0.1875 : 0) - 0.45,
        0.35 * o[1] * _ + 0.8 * i[1],
      ];
    }
    const S = [e[0], e[1] + 0.35, e[2]],
      A = [w[0] + x[0] - S[0], w[1] + x[1] - S[1], w[2] + x[2] - S[2]],
      I = [],
      at = (t) => [S[0] + A[0] * t, S[1] + A[1] * (t * t + t) * 0.5, S[2] + A[2] * t];
    for (let t = 0; t < 16; t++)
      for (const e of [t / 16, (t + 1) / 16]) I.push(...at(e), 0, 0, 0, 1);
    a.drawLines(I, [0, 0, 0, 1]);
  }
}
Game.prototype.useRod = function (t) {
  const e = this.player;
  if (e.fishHook && !e.fishHook.dead) {
    const t = e.fishHook.retrieve();
    (t && "creative" !== this.mode && this.damageHeld(t),
      Sound.ev("entity.fishing_bobber.retrieve", e.pos, 1, 0.4 / (0.4 * Math.random() + 0.8)));
  } else
    ((e.fishHook = new FishingHook(this, e, t)),
      this.entities.push(e.fishHook),
      Sound.ev("entity.fishing_bobber.throw", e.pos, 0.5, 0.4 / (0.4 * Math.random() + 0.8)));
  e.swing();
};
const MAP_PAL = (EXTRA.mappalette || []).map((t) => [
    (t >> 16) & 255,
    (t >> 8) & 255,
    255 & t,
    (t >>> 24) & 255,
  ]),
  mapColorOf = (t, e) => {
    const s = BLOCKS[t];
    if (!s) return 0;
    const o = EXTRA.mapcolors && EXTRA.mapcolors[s.key];
    return null == o ? (s.solid ? 11 : 0) : Array.isArray(o) ? (o[e] ?? o[0]) : o;
  };
function mapPicture(t) {
  if (!t || !t.px) return null;
  const e = mapPicture.cv || (mapPicture.cv = document.createElement("canvas"));
  ((e.width = 128), (e.height = 128));
  const s = e.getContext("2d"),
    o = s.createImageData(128, 128);
  for (let e = 0; e < 16384; e++) {
    const s = t.px[e],
      i = s >= 4 ? MAP_PAL[s] : null;
    i &&
      ((o.data[4 * e] = i[0]),
      (o.data[4 * e + 1] = i[1]),
      (o.data[4 * e + 2] = i[2]),
      (o.data[4 * e + 3] = 255));
  }
  return (s.putImageData(o, 0, 0), e);
}
function texQuad(t, e, s, o, i = 1, a = 1) {
  const r = t.gl,
    l = t.progTex,
    h = M4.copy(s);
  (M4.rotX(h, -Math.PI / 2),
    M4.rotZ(h, Math.PI),
    M4.scale(h, -i / 2, 1, a / 2),
    r.useProgram(l.p),
    r.uniformMatrix4fv(l.u.u_vp, !1, t.vp),
    r.uniformMatrix4fv(l.u.u_model, !1, h),
    r.uniform4f(l.u.u_color, o, o, o, 1),
    r.activeTexture(r.TEXTURE0),
    r.bindTexture(r.TEXTURE_2D, t.entityTex[e]),
    r.bindVertexArray(t.quadVao));
  const c = r.isEnabled(r.BLEND);
  (c || (r.enable(r.BLEND), r.blendFunc(r.SRC_ALPHA, r.ONE_MINUS_SRC_ALPHA)),
    r.disable(r.CULL_FACE),
    r.drawElements(r.TRIANGLES, 6, r.UNSIGNED_INT, 0),
    r.enable(r.CULL_FACE),
    c || r.disable(r.BLEND));
}
((Game.prototype.mapData = function (t) {
  const e = (this.worldMeta.maps || (this.worldMeta.maps = {}))[t];
  if (!e) return null;
  if (!e.px && ((e.px = new Uint8Array(16384)), e.data)) {
    const t = atob(e.data);
    for (let s = 0; s < t.length && s < 16384; s++) e.px[s] = t.charCodeAt(s);
  }
  return e;
}),
  (Game.prototype.newMap = function (t, e = 0, s = null) {
    const o = this.player,
      i = this.worldMeta.maps || (this.worldMeta.maps = {}),
      a = (this.worldMeta.nextMap = (this.worldMeta.nextMap || 0) + 1) - 1,
      r = 128 << e,
      l = s ? s.cx : Math.floor((o.pos[0] + 64) / r) * r + r / 2 - 64,
      h = s ? s.cz : Math.floor((o.pos[2] + 64) / r) * r + r / 2 - 64;
    if (
      ((i[a] = {
        cx: l,
        cz: h,
        scale: e,
        dim: this.dim || "overworld",
        locked: !1,
        px: new Uint8Array(16384),
      }),
      !t)
    )
      return a;
    return (
      (makeStack("filled_map", 1).mapId = a),
      swapHeld(this, o, "filled_map", { mapId: a }),
      Sound.ev("ui.cartography_table.take_result", o.pos, 1, 1),
      o.swing(),
      a
    );
  }),
  (Game.prototype.updateMap = function (t) {
    if (t.locked || (t.dim || "overworld") !== (this.dim || "overworld")) return;
    const e = this.player,
      s = this.world,
      o = 1 << t.scale,
      i = Math.floor((e.pos[0] - t.cx) / o) + 64,
      a = Math.floor((e.pos[2] - t.cz) / o) + 64,
      r = Math.floor(128 / o);
    t.col = ((t.col || 0) + 1) % 16;
    for (let e = i - r + 1; e < i + r; e++) {
      if ((15 & e) !== t.col || e < 0 || e >= 128) continue;
      let l = 0;
      for (let h = a - r - 1; h < a + r; h++) {
        if (h < -1 || h >= 128 || (e - i) ** 2 + (h - a) ** 2 > r * r) continue;
        const c = t.cx + (e - 64) * o,
          p = t.cz + (h - 64) * o;
        if (!s.isLoaded(c, p)) continue;
        let u = 0,
          d = 0,
          m = 0;
        const f = {};
        for (let t = 0; t < o; t++)
          for (let e = 0; e < o; e++) {
            let o = s.surfaceY(c + t, p + e, !0) + 1,
              i = 0;
            do {
              (o--, (i = s.getBlock(c + t, o, p + e)), WLOG[i] && (i = WATER));
            } while (o > -64 && (0 === i || 0 === mapColorOf(i, 0)));
            let a = mapColorOf(i, s.getMeta(c + t, o, p + e));
            if (i === WATER) {
              let i,
                a = o;
              for (; a > -64 && (IS_FLUID[(i = s.getBlock(c + t, a, p + e))] || WLOG[i]);)
                (a--, m++);
            }
            ((u += o), (f[a] = (f[a] || 0) + 1));
          }
        let g;
        if (
          ((u /= o * o),
          (m /= o * o),
          (d = +Object.keys(f).reduce((t, e) => (f[t] >= f[e] ? t : e))),
          12 === d)
        ) {
          const t = 0.1 * m + 0.2 * ((e + h) & 1);
          g = t < 0.5 ? 2 : t > 0.9 ? 0 : 1;
        } else {
          const t = (4 * (u - l)) / (o + 4) + 0.4 * (((e + h) & 1) - 0.5);
          g = t > 0.6 ? 2 : t < -0.6 ? 0 : 1;
        }
        if (((l = u), h < 0)) continue;
        const y = 4 * d + g;
        t.px[128 * h + e] !== y && ((t.px[128 * h + e] = y), (t.dirty = !0));
      }
    }
  }),
  (() => {
    const t = Game.prototype.tick;
    Game.prototype.tick = function (...e) {
      const s = t.apply(this, e),
        o = this.player;
      if (o && "play" === this.state && !this.net)
        for (const t of [o.inv.held, o.inv.slots[40]])
          if (t && "filled_map" === keyOf3(t) && null != t.mapId) {
            const e = this.mapData(t.mapId);
            e && this.updateMap(e);
          }
      return s;
    };
    const e = Game.prototype.collectDimSave;
    Game.prototype.collectDimSave = function () {
      for (const t in this.worldMeta.maps || {}) {
        const e = this.worldMeta.maps[t];
        if (e.px && !1 !== e.dirtySave) {
          let t = "";
          for (let s = 0; s < e.px.length; s++) t += String.fromCharCode(e.px[s]);
          e.data = btoa(t);
        }
      }
      const t = {};
      for (const e in this.worldMeta.maps || {})
        ((t[e] = this.worldMeta.maps[e].px), delete this.worldMeta.maps[e].px);
      try {
        return e.call(this);
      } finally {
        for (const e in t) this.worldMeta.maps[e].px = t[e];
      }
    };
  })(),
  (Renderer.prototype.mapTex = function (t, e) {
    const s = t.mapData(e);
    if (!s) return null;
    const o = "@map:" + e;
    if (!this.entityTex[o] || s.dirty) {
      const t = this._mapCanvas || (this._mapCanvas = document.createElement("canvas"));
      ((t.width = 128), (t.height = 128));
      const e = t.getContext("2d"),
        i = e.createImageData(128, 128);
      for (let t = 0; t < 16384; t++) {
        const e = s.px[t],
          o = e >= 4 ? MAP_PAL[e] : null;
        o &&
          ((i.data[4 * t] = o[0]),
          (i.data[4 * t + 1] = o[1]),
          (i.data[4 * t + 2] = o[2]),
          (i.data[4 * t + 3] = 255));
      }
      if ((e.putImageData(i, 0, 0), this.entityTex[o])) {
        const e = this.gl;
        (e.bindTexture(e.TEXTURE_2D, this.entityTex[o]),
          e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, e.RGBA, e.UNSIGNED_BYTE, t));
      } else this.entityTex[o] = this.tex2D(t, !1);
      s.dirty = !1;
    }
    return o;
  }),
  (Game.prototype.drawMapInFrame = function (t, e, s, o) {
    const i = this.renderer,
      a = null != t.mapId ? i.mapTex(this, t.mapId) : null,
      r = 0.85 * Math.max(s[0], s[1] * o.day) + 0.15,
      l = i.etex("map/map_background");
    if (l) {
      const t = M4.copy(e);
      (M4.translate(t, 0, 0, 0.002), texQuad(i, l, t, r, 1, 1));
    }
    if (a) {
      const t = M4.copy(e);
      (M4.translate(t, 0, 0, -0.002), texQuad(i, a, t, r, -7 / 8, -7 / 8));
    }
  }),
  (() => {
    const t = Game.prototype.drawHand;
    Game.prototype.drawHand = function (e, s) {
      const o = this.player,
        i = o.inv.held;
      if (!i || "filled_map" !== keyOf3(i) || 0 !== this.perspective) return t.call(this, e, s);
      const a = this.renderer,
        r = a.gl,
        l = Math.PI / 180;
      a.fxOn || r.clear(r.DEPTH_BUFFER_BIT);
      const h = M4.create();
      M4.perspective(h, (70 * Math.PI) / 180, a.canvas.width / a.canvas.height, 0.05, 10);
      const c = a.vp,
        p = a.camPos;
      ((a.vp = h), (a.camPos = [0, 0, 0]));
      const u = o.swingT > 0 ? clamp((6 - o.swingT + e) / 6, 0, 1) : 0,
        d = Math.sqrt(u),
        m = 1 - lerp(o.oHandH ?? 1, o.handH ?? 1, e),
        f = clamp(1 - -o.pitch / l / 45 + 0.1, 0, 1),
        g = 0.5 * -Math.cos(f * Math.PI) + 0.5,
        y = M4.create();
      (M4.translate(y, 0, (0.2 * Math.sin(u * Math.PI)) / 2, -0.4 * Math.sin(d * Math.PI)),
        M4.translate(y, 0, 0.04 - 1.2 * m - 0.5 * g, -0.72),
        M4.rotX(y, -85 * g * l));
      const b = o.lightAt(),
        k = { ...s, fogNear: 1e8, fogFar: 2e8 };
      if (!o.invisible)
        for (const t of [1, -1]) {
          const e = M4.copy(y);
          (M4.rotY(e, 90 * l),
            M4.rotY(e, 92 * l),
            M4.rotX(e, 45 * l),
            M4.rotZ(e, -41 * t * l),
            M4.translate(e, 0.3 * t, -1.1, 0.45),
            M4.translate(e, (-6 * t) / 16, 2 / 16, 0),
            M4.rotZ(e, Math.PI),
            a.drawModel(
              "undefined" != typeof Skins ? Skins.armOf(this, t < 0) : t > 0 ? "arm" : "arm_left",
              "undefined" != typeof Skins ? Skins.texOf(this, o) : "steve",
              e,
              null,
              b,
              k,
              { vp: h },
            ));
        }
      M4.rotX(y, 20 * Math.sin(d * Math.PI) * l);
      const _ = b,
        w = 0.8 * Math.max(_[0], _[1] * s.day) + 0.2,
        M = a.etex("map/map_background"),
        v = null != i.mapId ? a.mapTex(this, i.mapId) : null,
        x = 0.76;
      if ((M && texQuad(a, M, y, w, 0.843125, 0.843125), v)) {
        const t = M4.copy(y);
        (M4.translate(t, 0, 0, 0.003), texQuad(a, v, t, w, x, -x));
      }
      const S = null != i.mapId && this.mapData(i.mapId),
        A = a.etex("map/decorations/player");
      if (S && S.net && S.icons)
        for (const [t, e, s, o] of S.icons) {
          const i = a.etex("map/decorations/" + t);
          if (!i) continue;
          const r = M4.copy(y);
          (M4.translate(r, ((e / 128) * x) / 2, ((-s / 128) * x) / 2, 0.006),
            M4.rotZ(r, (-o * Math.PI) / 8),
            texQuad(a, i, r, 1, x / 16, x / 16));
        }
      else if (S && A) {
        const t = 1 << S.scale,
          e = (o.pos[0] - S.cx) / t / 64,
          s = (o.pos[2] - S.cz) / t / 64;
        if (Math.abs(e) < 1 && Math.abs(s) < 1) {
          const t = M4.copy(y);
          (M4.translate(t, (e * x) / 2, (-s * x) / 2, 0.006),
            M4.rotZ(t, o.yaw + Math.PI),
            texQuad(a, A, t, 1, x / 16, x / 16));
        }
      }
      ((a.vp = c), (a.camPos = p));
    };
    const e = UI.prototype.itemLines;
    UI.prototype.itemLines = function (t) {
      const s = e.call(this, t);
      if ("filled_map" === keyOf3(t) && null != t.mapId) {
        const e = this.game.mapData(t.mapId);
        (s.splice(1, 0, { text: "#" + t.mapId, color: "#AAAAAA" }),
          e &&
            s.push(
              { text: "比例尺 1:" + (1 << e.scale), color: "#AAAAAA" },
              { text: "(级别 " + e.scale + "/4)", color: "#AAAAAA" },
            ),
          e && e.locked && s.push({ text: "已锁定", color: "#AAAAAA" }));
      }
      return s;
    };
  })());
class CartographyScreen extends StationScreen {
  constructor(t, e, s) {
    (super(t, "gui_cartography_table", s || "制图台", e),
      this.own(0, 15, 15, { accept: (t) => "filled_map" === keyOf3(t) }),
      this.own(1, 15, 52, { accept: (t) => /^(map|paper|glass_pane)$/.test(keyOf3(t)) }),
      this.slots.push({
        x: 145,
        y: 39,
        output: !0,
        get: () => this.result,
        set: () => {},
        onTake: () => this.take(),
      }),
      this.addPlayerSlots(84, 142),
      this.changed());
  }
  changed() {
    const t = this.S(0),
      e = this.S(1);
    if (((this.result = null), (this.mode = null), !t || !e)) return;
    const s = this.game.mapData(t.mapId),
      o = keyOf3(e);
    "map" === o
      ? ((this.result = { ...t, count: 2 }), (this.mode = "copy"))
      : "paper" === o && s && s.scale < 4 && !s.locked
        ? ((this.result = { ...t, count: 1, zoom: !0 }), (this.mode = "zoom"))
        : "glass_pane" === o &&
          s &&
          !s.locked &&
          ((this.result = { ...t, count: 1, lock: !0 }), (this.mode = "lock"));
  }
  takeOutput(t, e, s) {
    if (!e.output || ("zoom" !== this.mode && "lock" !== this.mode))
      return super.takeOutput(t, e, s);
    const o = this.game.player.inv;
    for (
      ;
      this.result &&
      ("zoom" === this.mode || "lock" === this.mode) &&
      (s ? o.slots.slice(0, 36).some((t) => !t) : !t.cursor);
    ) {
      const e = this.make();
      if ((s ? o.add(e) : (t.cursor = e), this.take(), this.changed(), !s)) break;
    }
  }
  make() {
    const t = this.game,
      e = this.S(0),
      s = t.mapData(e.mapId),
      o = t.newMap(
        null,
        "zoom" === this.mode ? s.scale + 1 : s.scale,
        "zoom" === this.mode ? null : s,
      ),
      i = t.mapData(o);
    if (((i.dim = s.dim), "zoom" === this.mode)) {
      const t = 128 << i.scale;
      ((i.cx = Math.floor((s.cx + 64) / t) * t + t / 2 - 64),
        (i.cz = Math.floor((s.cz + 64) / t) * t + t / 2 - 64));
    } else (i.px.set(s.px), (i.locked = !0));
    return { ...e, count: 1, mapId: o };
  }
  take() {
    for (const t of [0, 1]) {
      const e = this.held[t];
      e && (e.count--, e.count || (this.held[t] = null));
    }
    Sound.ev("ui.cartography_table.take_result", null, 1, 1);
  }
  drawMore(t) {
    const e = this.S(0);
    if (!e) return;
    const s = this.game.mapData(e.mapId),
      o = t.ctx,
      i = this.x,
      a = this.y,
      pic = (t, e, r) => {
        const l = mapPicture(s);
        l &&
          ((o.imageSmoothingEnabled = !1),
          o.drawImage(l, i + t, a + e, Math.round(128 * r), Math.round(128 * r)));
      };
    ("zoom" === this.mode
      ? (t.sprite("cartography_table_scaled_map", i + 67, a + 13, 66, 66), pic(85, 31, 0.226))
      : "copy" === this.mode
        ? (t.sprite("cartography_table_duplicated_map", i + 83, a + 13, 50, 66),
          pic(86, 16, 0.34),
          t.sprite("cartography_table_duplicated_map", i + 67, a + 29, 50, 66),
          pic(70, 32, 0.34))
        : (t.sprite("cartography_table_map", i + 67, a + 13, 66, 66), pic(71, 17, 0.45)),
      "lock" === this.mode && t.sprite("cartography_table_locked", i + 118, a + 60),
      s && s.locked && this.S(1) && t.sprite("cartography_table_error", i + 35, a + 31));
  }
}
"undefined" != typeof WORKSTATIONS &&
  ((WORKSTATIONS.cartography = (t, e, s) => new CartographyScreen(t, e, s.cn)),
  void 0 !== BID.cartography_table && (BLOCKS[BID.cartography_table].onUse = "cartography"));
class BookScreen {
  constructor(t, e, s, o) {
    ((this.game = t),
      (this.st = e),
      (this.edit = s),
      (this.lectern = o),
      (this.pages = e.pages ? [...e.pages] : [""]),
      (this.page = (o && o.page) || 0),
      (this.signing = !1),
      (this.title = ""));
  }
  layout() {
    const t = this.game.ui;
    ((this.x = Math.floor((t.w - 192) / 2)), (this.y = 2), this.edit && this.focus());
  }
  focus() {
    const t = this.game.ui,
      e = this;
    if (this.signing)
      return (
        this.hideArea(),
        t.showInput(this.x + 36 + 10, this.y + 50, 100, 12, this.title, () => e.sign(), {
          max: 32,
          onInput: (t) => {
            e.title = t;
          },
          onEsc: () => t.close(),
        }),
        void (t.inputBox = null)
      );
    t.hideInput();
    let s = t.bookArea;
    (s ||
      ((s = t.bookArea = document.createElement("textarea")),
      Object.assign(s.style, {
        position: "fixed",
        left: "-2000px",
        top: "0",
        width: "200px",
        height: "200px",
        opacity: "0",
      }),
      document.body.appendChild(s)),
      (s.value = this.pages[this.page] || ""),
      (s.style.display = "block"),
      (s.oninput = () => {
        let t = s.value.slice(0, 1024);
        for (; e.wrap(t, !0).length > 14;) t = t.slice(0, -1);
        (t !== s.value && (s.value = t), (e.pages[e.page] = t), e.save());
      }),
      (s.onkeydown = (s) => {
        (s.stopPropagation(),
          "Escape" === s.key && t.close(),
          "PageUp" === s.key && e.page > 0 && (e.page--, e.turned()),
          "PageDown" === s.key &&
            (e.page === e.pages.length - 1 && e.pages.length < 100 && e.pages.push(""),
            e.page++,
            e.turned()));
      }),
      setTimeout(() => s.focus(), 0));
  }
  hideArea() {
    const t = this.game.ui.bookArea;
    t && ((t.style.display = "none"), (t.oninput = null), (t.onkeydown = null), t.blur());
  }
  save() {
    this.edit && !this.signing && (this.st.pages = [...this.pages]);
  }
  close() {
    const t = this.game.ui;
    (this.hideArea(), t.hideInput(), this.save(), this.edit && !this.signed && this.netSend(null));
  }
  netSend(t) {
    const e = this.game;
    if (!e.net) return;
    const s = e.player,
      o = s.inv.slots.indexOf(this.st);
    e.net.send({ t: "book", slot: o < 0 ? s.inv.sel : o, pages: this.pages, title: t });
  }
  key(t, e) {
    return !0;
  }
  btns() {
    const t = this.x,
      e = this.y,
      s = [];
    return (
      this.page > 0 &&
        s.push({ x: t + 43, y: e + 154, w: 23, h: 13, act: "prev", sprite: "page_backward" }),
      (this.page < this.pages.length - 1 ||
        (this.edit && this.pages.length < 100 && this.pages[this.page])) &&
        s.push({ x: t + 116, y: e + 154, w: 23, h: 13, act: "next", sprite: "page_forward" }),
      this.edit
        ? s.push(
            {
              x: t + 1,
              y: e + 196,
              w: 94,
              h: 20,
              act: "sign",
              label: this.signing ? "署名并关闭" : "署名",
            },
            {
              x: t + 98,
              y: e + 196,
              w: 94,
              h: 20,
              act: this.signing ? "cancel" : "done",
              label: this.signing ? "取消" : "完成",
            },
          )
        : this.lectern
          ? s.push(
              { x: t + 1, y: e + 196, w: 94, h: 20, act: "take", label: "取书" },
              { x: t + 98, y: e + 196, w: 94, h: 20, act: "done", label: "完成" },
            )
          : s.push({ x: t + 48, y: e + 196, w: 96, h: 20, act: "done", label: "完成" }),
      s
    );
  }
  mouseDown(t, e, s) {
    for (const o of this.btns())
      if (t.hit(o, e, s)) {
        if (
          (Sound.click && Sound.click(),
          "prev" === o.act && (this.page--, this.turned()),
          "next" === o.act &&
            (this.page === this.pages.length - 1 && this.pages.push(""),
            this.page++,
            this.turned()),
          "done" === o.act && t.close(),
          "sign" === o.act && (this.signing ? this.sign() : ((this.signing = !0), this.focus())),
          "cancel" === o.act && ((this.signing = !1), this.focus()),
          "take" === o.act)
        ) {
          const e = this.game,
            s = this.lectern;
          (s &&
            s.book &&
            (e.player.inv.add(s.book) && e.dropFromPlayer(s.book),
            (s.book = null),
            bsetProp(e.world, ...s.pos, "has_book", "false")),
            t.close());
        }
        return;
      }
  }
  turned() {
    (this.lectern
      ? ((this.lectern.page = this.page), Sound.ev("item.book.page_turn", this.lectern.pos, 1, 1))
      : Sound.ev("item.book.page_turn", null, 1, 1),
      this.edit && this.focus());
  }
  sign() {
    if (!this.title.trim()) return;
    const t = this.game,
      e = t.player,
      s = this.st;
    if (t.net) return ((this.signed = !0), this.netSend(this.title.trim()), void t.ui.close());
    const o = {
        ...makeStack("written_book", 1),
        pages: this.pages.filter((t, e) => t || 0 === e),
        title: this.title.trim(),
        author: t.playerName || (t.worldMeta && t.worldMeta.playerName) || "玩家",
        gen: 0,
      },
      i = e.inv.slots.indexOf(s);
    (i >= 0 && (e.inv.slots[i] = o), t.ui.close());
  }
  wrap(t) {
    const e = [];
    for (const s of String(t).split("\n")) {
      let t = "";
      for (const o of s) (Font.width(t + o) > 114 && (e.push(t), (t = "")), (t += o));
      e.push(t);
    }
    return e.slice(0, 14);
  }
  draw(t) {
    const e = t.ctx,
      s = this.x,
      o = this.y,
      i = this.game.renderer.images["@gui/book"] || t.img.book_gui;
    if (
      (i
        ? e.drawImage(i, 0, 0, 192, 192, s, o, 192, 192)
        : ((e.fillStyle = "#F5EBD0"), e.fillRect(s + 20, o, 150, 180)),
      this.signing)
    )
      (Font.center(e, "输入书名：", s + 96, o + 34, "#000000", !1),
        Font.center(
          e,
          this.title + (Math.floor(performance.now() / 300) % 2 ? "_" : ""),
          s + 96,
          o + 50,
          "#000000",
          !1,
        ),
        Font.center(e, "作者：" + (this.game.playerName || "玩家"), s + 96, o + 62, "#444444", !1),
        Font.center(e, "注意！署名后此书将不可再编辑。", s + 96, o + 82, "#000000", !1));
    else {
      const t = "第 " + (this.page + 1) + " 页，共 " + Math.max(this.pages.length, 1) + " 页";
      Font.draw(e, t, s + 148 - Font.width(t), o + 16, "#000000", !1);
      const i = this.wrap(this.pages[this.page] || "");
      if (
        (i.forEach((t, i) => Font.draw(e, t, s + 36, o + 32 + 9 * i, "#000000", !1)),
        this.edit && Math.floor(performance.now() / 300) % 2)
      ) {
        const t = i[i.length - 1] || "";
        Font.draw(e, "_", s + 36 + Font.width(t), o + 32 + 9 * (i.length - 1), "#000000", !1);
      }
    }
    for (const s of this.btns())
      if (s.sprite) {
        const o = t.hit(s);
        (t.sprite("widget_" + s.sprite + (o ? "_highlighted" : ""), s.x, s.y),
          t.img["widget_" + s.sprite] ||
            Font.draw(
              e,
              "prev" === s.act ? "<" : ">",
              s.x + 8,
              s.y + 3,
              o ? "#AA0000" : "#000000",
              !1,
            ));
      } else t.button(s);
  }
}
((() => {
  const t = UI.prototype.itemLines;
  UI.prototype.itemLines = function (e) {
    const s = t.call(this, e);
    return (
      "written_book" === keyOf3(e) &&
        e.title &&
        ((s[0] = { text: e.title, color: "#FFFF55" }),
        s.splice(
          1,
          0,
          { text: "作者：" + (e.author || "?"), color: "#AAAAAA" },
          { text: ["原稿", "原稿的副本", "副本的副本", "破烂不堪"][0 | e.gen], color: "#AAAAAA" },
        )),
      s
    );
  };
})(),
  (() => {
    const t = Game.prototype.use;
    Game.prototype.use = function () {
      const e = this.player,
        s = this.target,
        o = e.inv.held;
      if (s && !this.targetEntity && "lectern" === BLOCKS[s.id].key && !this.net) {
        const t = this.getBlockEntity(...s.pos, "lectern");
        if (((t.pos = [...s.pos]), t.book))
          return void this.ui.open(new BookScreen(this, t.book, !1, t));
        if (o && /^(writable_book|written_book)$/.test(keyOf3(o)) && !e.sneaking)
          return (
            (t.book = { ...o, count: 1 }),
            (t.page = 0),
            useOne(this, e),
            bsetProp(this.world, ...s.pos, "has_book", "true"),
            Sound.ev("item.book.put", s.pos, 1, 1),
            void e.swing()
          );
      }
      return t.call(this);
    };
  })());
const SONGS = EXTRA.jukebox_song || {},
  discSong = (t) => {
    const e = keyOf3(t);
    if (!/^music_disc_/.test(e)) return null;
    const s = e.replace(/^music_disc_/, "");
    return SONGS[s] ? { key: s, ...SONGS[s] } : null;
  };
function defaultArchaeology(t, e, s, o) {
  const i = biomeName(t, e, s);
  return /warm_ocean|lukewarm/.test(i)
    ? "archaeology/ocean_ruin_warm"
    : /ocean/.test(i)
      ? "archaeology/ocean_ruin_cold"
      : o
        ? /desert/.test(i)
          ? "archaeology/desert_pyramid"
          : "archaeology/desert_well"
        : Math.random() < 0.1
          ? "archaeology/trail_ruins_rare"
          : "archaeology/trail_ruins_common";
}
((Game.prototype.jukeboxPlay = function (t, e) {
  this.jukeboxes = this.jukeboxes || new Map();
  const s = t.join(","),
    o = discSong(e);
  if ((this.jukeboxStop(t), !o)) return;
  const i = { x: t[0], y: t[1], z: t[2], playing: !0, song: o, t0: this.tickCount };
  this.jukeboxes.set(s, i);
  for (let e = 0; e < 4; e++)
    this.particles.spawn("note", t[0] + 0.5, t[1] + 1.2, t[2] + 0.5, 0, 0.05, 0, {
      col: [255, 80, 200],
    });
}),
  (Game.prototype.jukeboxStop = function (t) {
    const e = t.join(",");
    this.jukeboxes && this.jukeboxes.get(e) && this.jukeboxes.delete(e);
  }),
  (() => {
    const t = Game.prototype.use;
    Game.prototype.use = function () {
      const e = this.player,
        s = this.target,
        o = e.inv.held;
      if (s && !this.targetEntity && "jukebox" === BLOCKS[s.id].key && !this.net) {
        const t = this.getBlockEntity(...s.pos, "jukebox");
        if (t.disc)
          return (
            this.dropItem(s.pos[0] + 0.5, s.pos[1] + 1.1, s.pos[2] + 0.5, t.disc),
            (t.disc = null),
            this.jukeboxStop(s.pos),
            void e.swing()
          );
        if (o && discSong(o) && !e.sneaking)
          return (
            (t.disc = { ...o, count: 1 }),
            useOne(this, e),
            this.jukeboxPlay(s.pos, t.disc),
            void e.swing()
          );
      }
      return t.call(this);
    };
    const e = Game.prototype.dropBlockLoot;
    Game.prototype.dropBlockLoot = function (t, s, o, i, a, r, ...l) {
      const h = t + "," + s + "," + o,
        c = BLOCKS[i];
      if (c && "jukebox" === c.key) {
        const e = this.blockEntities.get(h);
        (e && e.disc && (this.dropItem(t + 0.5, s + 0.5, o + 0.5, e.disc), (e.disc = null)),
          this.jukeboxStop([t, s, o]));
      }
      if (c && "lectern" === c.key) {
        const e = this.blockEntities.get(h);
        e && e.book && (this.dropItem(t + 0.5, s + 0.5, o + 0.5, e.book), (e.book = null));
      }
      return e.call(this, t, s, o, i, a, r, ...l);
    };
    const s = Game.prototype.tick;
    Game.prototype.tick = function (...t) {
      const e = s.apply(this, t);
      if (!this.jukeboxes || !this.player) return e;
      for (const [t, e] of this.jukeboxes) {
        if ("jukebox" !== BLOCKS[this.world.getBlock(e.x, e.y, e.z)].key) {
          this.jukeboxStop([e.x, e.y, e.z]);
          continue;
        }
        const t = Math.hypot(
          this.player.pos[0] - e.x - 0.5,
          this.player.pos[1] - e.y,
          this.player.pos[2] - e.z - 0.5,
        );
        ((this.tickCount - e.t0) / 20 > e.song.length_in_seconds && (e.playing = !1),
          e.playing &&
            this.tickCount % 20 == 0 &&
            t < 32 &&
            this.particles.spawn("note", e.x + 0.5, e.y + 1.2, e.z + 0.5, 0, 0.05, 0, {
              col: [
                (255 * Math.random()) | 0,
                (255 * Math.random()) | 0,
                (255 * Math.random()) | 0,
              ],
            }));
      }
      return e;
    };
  })(),
  (() => {
    const t = UI.prototype.itemLines;
    UI.prototype.itemLines = function (e) {
      const s = t.call(this, e),
        o = discSong(e);
      return (
        o &&
          s.splice(1, 0, { text: zhT("jukebox_song.minecraft." + o.key, o.key), color: "#AAAAAA" }),
        "goat_horn" === keyOf3(e) &&
          s.splice(1, 0, {
            text: zhT(
              "instrument.minecraft." +
                (e.instrument || "ponder_goat_horn").replace("minecraft:", ""),
              "",
            ),
            color: "#AAAAAA",
          }),
        s
      );
    };
  })(),
  (Game.prototype.brushTick = function (t) {
    const e = this.player,
      s = this.target;
    if (!s || this.targetEntity) return void (e.usingItem = null);
    if (e.useT % 10 != 5) return;
    const [o, i, a] = s.pos,
      r = BLOCKS[s.id],
      l = this.world,
      h = "suspicious_sand" === r.key || "suspicious_gravel" === r.key,
      c = /sand/.test(r.key);
    Sound.ev(
      c
        ? "item.brush.brushing.sand"
        : /gravel/.test(r.key)
          ? "item.brush.brushing.gravel"
          : "item.brush.brushing.generic",
      s.pos,
      1,
      1,
    );
    for (let t = 0; t < 4; t++)
      this.particles.spawn(
        "block",
        o + 0.5 + 0.55 * DIRS[s.face][0],
        i + 0.5 + 0.55 * DIRS[s.face][1],
        a + 0.5 + 0.55 * DIRS[s.face][2],
        0.1 * (Math.random() - 0.5),
        0.05,
        0.1 * (Math.random() - 0.5),
        { id: s.id, meta: l.getMeta(o, i, a) },
      );
    if (!h) return;
    const p = this.getBlockEntity(o, i, a, "brushable");
    p.brush = (p.brush || 0) + 1;
    const u = Math.min(3, Math.floor(p.brush / 2));
    if (p.brush < 8) return void bsetProp(l, o, i, a, "dusted", String(u));
    const d = p.loot || defaultArchaeology(this, o, a, c);
    for (const t of rollLoot(d, { e: e, player: !0 })) this.dropItem(o + 0.5, i + 1.1, a + 0.5, t);
    (this.blockEntities.delete(o + "," + i + "," + a),
      l.setBlock(o, i, a, BID[c ? "sand" : "gravel"], 0),
      Sound.ev(
        c ? "item.brush.brushing.sand.complete" : "item.brush.brushing.gravel.complete",
        s.pos,
        1,
        1,
      ),
      this.damageHeld(1),
      (e.usingItem = null),
      this.flushMesh());
  }),
  (() => {
    const t = Game.prototype.use;
    Game.prototype.use = function () {
      const e = this.player,
        s = this.target,
        o = e.inv.held,
        i = keyOf3(o);
      if (s && !this.targetEntity && "vault" === BLOCKS[s.id].key && !this.net) {
        const [t, o, a] = s.pos,
          r = "true" === Features.propOf(s.id, this.world.getMeta(t, o, a), "ominous"),
          l = this.getBlockEntity(t, o, a, "vault");
        l.rewarded = l.rewarded || [];
        return i !== (r ? "ominous_trial_key" : "trial_key") ||
          l.rewarded.includes("player") ||
          l.eject
          ? (Sound.ev("block.vault.insert_item_fail", s.pos, 1, 1), void e.swing())
          : (useOne(this, e),
            l.rewarded.push("player"),
            (l.eject = rollLoot(
              r ? "chests/trial_chambers/reward_ominous" : "chests/trial_chambers/reward",
              { e: e, player: !0 },
            )),
            (l.ejectT = 0),
            bsetProp(this.world, t, o, a, "vault_state", "unlocking"),
            Sound.ev("block.vault.insert_item", s.pos, 1, 1),
            void e.swing());
      }
      return t.call(this);
    };
    const e = Game.prototype.tick;
    Game.prototype.tick = function (...t) {
      const s = e.apply(this, t);
      if (!this.blockEntities || this.net || "play" !== this.state) return s;
      for (const t of this.blockEntities.values())
        if ("vault" === t.type && t.eject) {
          const [e, s, o] = t.pos;
          if (++t.ejectT % 20 != 0) continue;
          20 === t.ejectT && bsetProp(this.world, e, s, o, "vault_state", "ejecting");
          const i = t.eject.shift();
          if (i) {
            const a = new ItemEntity(this, e + 0.5, s + 1.1, o + 0.5, i, [
              0.1 * (Math.random() - 0.5),
              0.2,
              0.1 * (Math.random() - 0.5),
            ]);
            (this.entities.push(a),
              Sound.ev("block.vault.eject_item", t.pos, 1, 0.8 + 0.4 * Math.random()));
          } else
            ((t.eject = null),
              bsetProp(this.world, e, s, o, "vault_state", "inactive"),
              Sound.ev("block.vault.deactivate", t.pos, 1, 1));
        }
      return (this.tickCount % 2 == 0 && this.tickTrialSpawners(), s);
    };
  })());
const TS_KEYS = Object.keys(EXTRA.trial_spawner || {});
((Game.prototype.tickTrialSpawners = function () {
  const t = this.player,
    e = this.world;
  if (t && 0 !== this.difficulty) {
    if (this.tickCount % 40 == 0) {
      const s = Math.floor(t.pos[0]),
        o = Math.floor(t.pos[1]),
        i = Math.floor(t.pos[2]);
      if (((this._ts = []), void 0 !== BID.trial_spawner))
        for (let t = -14; t <= 14; t++)
          for (let a = -6; a <= 6; a++)
            for (let r = -14; r <= 14; r++)
              e.getBlock(s + t, o + a, i + r) === BID.trial_spawner &&
                this._ts.push([s + t, o + a, i + r]);
      const a = this._tsSeen || new Map();
      this._tsSeen = new Map(
        this._ts.map(([t, e, s]) => {
          const o = this.dim + ":" + t + "," + e + "," + s;
          return [o, a.get(o) ?? this.tickCount];
        }),
      );
    }
    for (const [s, o, i] of this._ts || []) {
      const a = this.getBlockEntity(s, o, i, "trial_spawner");
      a.pos = [s, o, i];
      const r = "true" === Features.propOf(BID.trial_spawner, e.getMeta(s, o, i), "ominous");
      if (!a.config) {
        const t = TS_KEYS.filter((t) => t.endsWith(r ? "/ominous" : "/normal"));
        a.config = t[(Math.random() * t.length) | 0];
      }
      const l = EXTRA.trial_spawner[a.config] || {},
        h = this.tickCount;
      if (a.cooldown && h < a.cooldown) continue;
      a.cooldown &&
        ((a.cooldown = 0), bsetProp(e, s, o, i, "trial_spawner_state", "waiting_for_players"));
      const c =
          Math.hypot(t.pos[0] - s - 0.5, t.pos[1] - o, t.pos[2] - i - 0.5) < 14 && !t.creative,
        p = this._tsMobs || (this._tsMobs = new Map()),
        u = this.dim + ":" + s + "," + o + "," + i;
      if (("mobs" in a && delete a.mobs, !a.active)) {
        if (!c) continue;
        (p.delete(u + "#" + (a.trial || 0)),
          (a.trial = (a.trial || 0) + 1),
          (a.active = !0),
          (a.spawned = 0),
          (a.total = (l.total_mobs || 6) + 0 * (l.total_mobs_added_per_player || 2)),
          bsetProp(e, s, o, i, "trial_spawner_state", "active"),
          Sound.ev("block.trial_spawner.detect_player", [s, o, i], 1, 1));
      }
      const d47 = (t) => (t[0] - s - 0.5) ** 2 + (t[1] - o) ** 2 + (t[2] - i - 0.5) ** 2 <= 2209,
        d = u + "#" + (a.trial || 0),
        m = p.get(d) || [],
        f = m.filter(
          (t) => !t.dead && 0 === t.deathTime && this.entities.includes(t) && d47(t.pos),
        );
      for (const t of m) f.includes(t) || delete t.tsKey;
      p.set(d, f);
      const g = h - ((this._tsSeen && this._tsSeen.get(u)) ?? h) < 200,
        y = (this.pendingMobs || []).reduce(
          (t, e) => (e.ts !== d ? t : g && d47(e.pos) ? t + 1 : (delete e.ts, t)),
          0,
        );
      if (a.spawned < a.total) {
        if (
          f.length < (l.simultaneous_mobs || 2) &&
          h - (a.lastSpawn || 0) >= (l.ticks_between_spawn || 40) &&
          f.length + y < (l.simultaneous_mobs || 2)
        ) {
          const e = l.spawn_potentials || [
              { data: { entity: { id: "minecraft:zombie" } }, weight: 1 },
            ],
            r = pickW(e.map((t) => [t.data.entity.id.replace("minecraft:", ""), t.weight || 1])),
            c = s + 0.5 + randInt(-4, 4),
            p = i + 0.5 + randInt(-4, 4);
          if (MOB_TYPES[r] || "zombie" === r) {
            const e = createMob(this, r, c, o, p);
            if (
              ((e.persistent = !0),
              (e.target = t),
              (e.tsKey = d),
              a.config.includes("baby_zombie") && e.makeBaby && e.makeBaby(),
              !e.collides(e.box()))
            ) {
              (this.entities.push(e),
                f.push(e),
                a.spawned++,
                (a.lastSpawn = h),
                Sound.ev("block.trial_spawner.spawn_mob", [s, o, i], 1, 1));
              for (let t = 0; t < 10; t++)
                this.particles.spawn(
                  "flame",
                  c + (Math.random() - 0.5),
                  o + 2 * Math.random(),
                  p + (Math.random() - 0.5),
                  0,
                  0.02,
                  0,
                );
            }
          }
        }
      } else if (!f.length && !y) {
        const c = l.loot_tables_to_eject || [
            {
              data: "minecraft:spawners/" + (r ? "ominous/" : "") + "trial_chamber/consumables",
              weight: 1,
            },
            {
              data: "minecraft:spawners/" + (r ? "ominous/" : "") + "trial_chamber/key",
              weight: 1,
            },
          ],
          p = pickW(c.map((t) => [String(t.data).replace("minecraft:", ""), t.weight || 1]));
        for (const e of rollLoot(p, { e: t, player: !0 }))
          this.dropItem(s + 0.5, o + 1.2, i + 0.5, e);
        (Sound.ev("block.trial_spawner.eject_item", [s, o, i], 1, 1),
          (a.active = !1),
          (a.cooldown = h + (l.target_cooldown_length || 36e3)),
          bsetProp(e, s, o, i, "trial_spawner_state", "cooldown"));
      }
    }
  }
}),
  (() => {
    if ("undefined" == typeof WanderingTrader || !EXTRA.trade_set) return;
    const tagList = (t) =>
        ((EXTRA.tags && EXTRA.tags["villager_trade:" + t]) || []).flatMap((t) =>
          "string" == typeof t
            ? "#" === t[0]
              ? tagList(t.slice(11))
              : [t.replace("minecraft:", "")]
            : [],
        ),
      toOffer = (t) => {
        const e = EXTRA.villager_trade[t];
        if (!e || !e.wants || !e.gives) return null;
        const id = (t) => String(t.id).replace("minecraft:", ""),
          n = (t) =>
            "number" == typeof t.count ? t.count : t.count ? Math.round(lootNum(t.count)) : 1,
          s = {
            a: id(e.wants),
            an: n(e.wants),
            r: id(e.gives),
            rn: n(e.gives),
            uses: e.max_uses || 1,
            used: 0,
            xp: e.xp || 1,
          };
        return (
          e.additional_wants && ((s.b = id(e.additional_wants)), (s.bn = n(e.additional_wants))),
          void 0 === ITEM_KEY[s.a] || void 0 === ITEM_KEY[s.r] || (s.b && void 0 === ITEM_KEY[s.b])
            ? null
            : s
        );
      },
      t = WanderingTrader.prototype.offers;
    WanderingTrader.prototype.offers = function () {
      if (!this.trades) {
        const t = [];
        for (const e of [
          "wandering_trader/buying",
          "wandering_trader/common",
          "wandering_trader/uncommon",
        ]) {
          const s = EXTRA.trade_set[e];
          if (!s) continue;
          const o = tagList(String(s.trades).replace(/^#minecraft:/, ""))
              .map(toOffer)
              .filter(Boolean),
            i = "number" == typeof s.amount ? s.amount : Math.round(lootNum(s.amount));
          for (let e = 0; e < i && o.length; e++)
            t.push(o.splice((Math.random() * o.length) | 0, 1)[0]);
        }
        t.length && (this.trades = t);
      }
      return this.trades || t.call(this);
    };
  })());
//# sourceURL=js/items3.js
