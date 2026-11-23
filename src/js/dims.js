"use strict";
const DIM_CN = { overworld: "主世界", nether: "下界", end: "末地" };
(Object.assign(ADVANCEMENTS, {
  nether: ["我们需要更深入", "obsidian"],
  fortress: ["阴森的要塞", "nether_bricks"],
  blaze_rod: ["与火共舞", "blaze_rod"],
  return_sender: ["见鬼去吧", "fire_charge"],
  eye_spy: ["隔墙有眼", "ender_eye"],
  the_end: ["结束了？", "end_stone"],
  free_end: ["解放末地", "dragon_egg"],
  next_gen: ["下一世代", "dragon_egg"],
}),
  (Game.prototype.makeWorld = function (t) {
    const e = new World(seed32(this.worldMeta ? this.worldMeta.seed : this.world.seed), t);
    return (
      ("overworld" !== t && "nether" !== t) ||
        !this.worldMeta ||
        2 !== this.worldMeta.gen ||
        ((e.gen2 = !0),
        (e.minY = "overworld" === t ? MIN_Y : 0),
        (e.seedStr = String(this.worldMeta.seed))),
      (e.grassMap = this.renderer.grassMap),
      (e.foliageMap = this.renderer.foliageMap),
      (e.listener = this),
      (e.flat = "overworld" === t && !(!this.worldMeta || !this.worldMeta.flat)),
      e.flat && (e.flatTop = this.worldMeta.flatClassic ? 3 : 60),
      (e.structures = !this.worldMeta || !1 !== this.worldMeta.structures),
      "end" === t &&
        (e.oldPodium = !(!this.worldMeta || !this.worldMeta.end || this.worldMeta.end.podium2)),
      e
    );
  }),
  (Game.prototype.dimStoreId = function (t) {
    return "overworld" === t ? this.worldMeta.id : this.worldMeta.id + "~" + t;
  }),
  (Game.prototype.initDims = async function (t) {
    ((this.dimData = {}),
      (this.dim = t.dim || "overworld"),
      (t.dims = t.dims || {}),
      t.dims.overworld ||
        (t.dims.overworld = { blockEntities: t.blockEntities || {}, mobs: t.mobs || [] }),
      (t.portals = t.portals || { overworld: [], nether: [] }),
      (t.end = t.end || { dragonKilled: !1, dragonSpawned: !1, credits: !1 }),
      t.end.dragonSpawned || t.end.dragonKilled || (t.end.podium2 = !0));
    const e = await this.loadDimData(this.dim);
    this.applyDim(e);
  }),
  (Game.prototype.loadDimData = async function (t) {
    if (this.dimData[t]) return this.dimData[t];
    const e = this.makeWorld(t);
    ((e.savedStore = this.dimStoreId(t)),
      (e.savedIndex = await DB.chunkKeys(e.savedStore)),
      (e.savedChunks = new Map()));
    const o = this.worldMeta.dims[t] || { blockEntities: {}, mobs: [] },
      s = {
        dim: t,
        world: e,
        entities: [],
        blockEntities: new Map(Object.entries(o.blockEntities || {})),
        pendingMobs: (o.mobs || []).slice(),
        dirtySaved: new Set(),
      };
    return ((this.dimData[t] = s), s);
  }),
  (Game.prototype.applyDim = function (t) {
    ((this.dim = t.dim),
      (this.world = t.world),
      (this.entities = t.entities),
      (this.blockEntities = t.blockEntities),
      (this.pendingMobs = t.pendingMobs),
      (this.dirtySaved = t.dirtySaved),
      (this.genQueue = []),
      (this._lastCC = null),
      (this.particles.list = []));
    for (const t of this.entities) t.world = this.world;
  }),
  (Game.prototype.stashDim = function () {
    const t = this.world,
      e = this.dimData[this.dim];
    for (const o of t.chunks.values()) {
      if (o.modified) {
        const s = ckey(o.cx, o.cz);
        (t.savedChunks.set(s, encodeChunk(o)),
          t.savedIndex && t.savedIndex.add(s),
          e.dirtySaved.add(s));
      }
      this.renderer.dropChunk(o.cx, o.cz);
    }
    (t.chunks.clear(),
      this.renderer.clearSections(),
      (e.entities = this.entities.filter(
        (t) => !(t.dead || (t instanceof ItemEntity && t.age > 5e3)),
      )),
      (e.pendingMobs = this.pendingMobs));
  }),
  (Game.prototype.changeDimension = async function (t, e, o) {
    if ("play" !== this.state) return;
    this.state = "switching";
    const s = new LoadingScreen(
      this,
      "nether" === t ? "正在进入下界…" : "end" === t ? "正在进入末地…" : "正在返回主世界…",
    );
    ((s.keepPointer = !0), this.ui.open(s), this.stashDim());
    const i = await this.loadDimData(t);
    this.applyDim(i);
    const n = this.player;
    ((n.world = this.world),
      (n.pos = [...e]),
      (n.prev = [...e]),
      (n.vel = [0, 0, 0]),
      (n.fallDist = 0),
      (n.fire = 0),
      (this.sleeping = null),
      (this.breaking = null),
      (this.onDimReady = o || null),
      (this.state = "loading"),
      Sound.ev("block.portal.travel", null, 0.25, 0.8 + 0.4 * Math.random()));
  }),
  (Game.prototype.collectDimSave = function () {
    const t = this.worldMeta,
      e = [],
      o = this.dimData[this.dim];
    ((o.entities = this.entities), (o.pendingMobs = this.pendingMobs));
    for (const [o, s] of Object.entries(this.dimData)) {
      const i = s.world,
        n = [];
      if (o === this.dim)
        for (const t of i.chunks.values())
          if (t.modified) {
            const e = encodeChunk(t),
              o = ckey(t.cx, t.cz);
            (i.savedChunks.set(o, e),
              i.savedIndex && i.savedIndex.add(o),
              n.push([t.cx, t.cz, e]),
              (t.modified = !1));
          }
      for (const t of s.dirtySaved) {
        const e = i.savedChunks.get(t);
        e && n.push([Math.floor(t / 65536) - 32768, (t % 65536) - 32768, e]);
      }
      s.dirtySaved.clear();
      const r = o === this.dim ? this.entities : s.entities;
      ((t.dims[o] = {
        blockEntities: Object.fromEntries(s.blockEntities),
        mobs: r
          .filter(
            (t) =>
              !t.dead &&
              !(t instanceof Mob && t.deathTime > 0) &&
              (this.isSavedEntity(t) ||
                (t instanceof Mob && !t.remote && !t.p2pMirror && !t.persistent)),
          )
          .map((t) => this.mobRecord(t))
          .concat(s.pendingMobs || []),
      }),
        e.push([this.dimStoreId(o), n]));
    }
    return ((t.dim = this.dim), delete t.blockEntities, delete t.mobs, e);
  }),
  (Game.prototype.isSavedEntity = function (t) {
    return (
      (t instanceof Mob && t.persistent) ||
      t instanceof EnderDragon ||
      t instanceof EndCrystal ||
      t.isVehicle ||
      t.keepSaved
    );
  }),
  (Game.prototype.mobRecord = function (t) {
    return {
      type: t.type,
      pos: [...t.pos],
      yaw: t.yaw,
      health: t.health,
      sheared: t.sheared,
      wool: t.woolColor,
      baby: t.baby ? t.growT : 0,
      size: "number" == typeof t.size ? t.size : void 0,
      x: t.saveData ? t.saveData() : void 0,
      ride: t.vehicleRef && !t.remote ? 1 : void 0,
      np: t instanceof Mob && !t.persistent ? 1 : void 0,
      ts: t.tsKey,
      dt: t.deathTime > 0 ? t.deathTime : void 0,
    };
  }),
  (Game.prototype.parkEntities = function (t) {
    const e = this.player,
      o = this.world,
      s = [];
    for (const i of this.entities) {
      const n = ckey(Math.floor(i.pos[0]) >> 4, Math.floor(i.pos[2]) >> 4);
      if (
        i.dead ||
        i === e ||
        i.alwaysTick ||
        i.remote ||
        !t.has(n) ||
        e.vehicle === i ||
        i.leashHolder === e
      )
        s.push(i);
      else if (this.isSavedEntity(i)) this.pendingMobs.push(this.mobRecord(i));
      else if (!(i instanceof Mob)) {
        const t = o.parked || (o.parked = new Map());
        (t.has(n) || t.set(n, []), t.get(n).push(i));
      }
    }
    this.entities = s;
  }),
  (Game.prototype.restoreMob = function (t) {
    const e = createMob(this, t.type, t.pos[0], t.pos[1], t.pos[2]);
    if (
      ((e.yaw = t.yaw || 0),
      null != t.health && null != e.health && (e.health = t.health),
      e instanceof Mob)
    ) {
      if (
        ((e.sheared = t.sheared),
        (e.woolColor = t.wool || 0),
        t.baby && (e.makeBaby(), (e.growT = t.baby)),
        t.size && e.setSize && (e.setSize(t.size), (e.health = t.health)),
        t.x && e.loadData && e.loadData(t.x),
        t.ride && (e.wantsRide = !0),
        (e.persistent = !t.np),
        t.ts)
      ) {
        e.tsKey = t.ts;
        const o = this._tsMobs || (this._tsMobs = new Map());
        (o.get(t.ts) || o.set(t.ts, []).get(t.ts)).push(e);
      }
    } else t.x && e.loadData && e.loadData(t.x);
    return (
      e instanceof Living &&
        null != t.health &&
        t.health <= 0 &&
        (e.deathTime = Math.max(1, t.dt || 1)),
      e
    );
  }),
  (Game.prototype.dimEnv = function (t) {
    if ("nether" === this.dim) {
      let e = [0.2, 8 / 255, 8 / 255];
      const o = 16 * this.renderer.renderDist,
        s = this.player;
      if (this.world.gen2 && s) {
        let t = 0,
          o = 0,
          i = 0,
          n = 0;
        for (let e = -8; e <= 8; e += 4)
          for (let r = -8; r <= 8; r += 4) {
            const a = this.vbiomeAt(Math.floor(s.pos[0]) + e, Math.floor(s.pos[2]) + r);
            a && a.fog && ((t += a.fog[0]), (o += a.fog[1]), (i += a.fog[2]), n++);
          }
        if (n) {
          const s = [t / n / 255, o / n / 255, i / n / 255],
            r = this._netherFog || s;
          ((this._netherFog = r.map((t, e) => t + 0.05 * (s[e] - t))), (e = this._netherFog));
        }
      }
      return Object.assign(t, {
        day: 0,
        fogColor: e,
        skyColor: e,
        starBright: 0,
        sunAlpha: 0,
        rain: 0,
        fogNear: 0.05 * o,
        fogFar: 0.5 * Math.min(o, 192),
        ambient: [0.55, 0.42, 0.38],
        nightTint: [1, 1, 1],
        cloudColor: [0, 0, 0],
        sky: "none",
      });
    }
    if ("end" === this.dim) {
      const e = [(160 / 255) * 0.15, (128 / 255) * 0.15, (160 / 255) * 0.15],
        o = 16 * this.renderer.renderDist;
      return Object.assign(t, {
        day: 0,
        fogColor: e,
        skyColor: e,
        starBright: 0,
        sunAlpha: 0,
        rain: 0,
        fogNear: o - clamp(o / 10, 4, 64),
        fogFar: o,
        ambient: [0.36, 0.33, 0.4],
        nightTint: [1, 1, 1],
        cloudColor: [0, 0, 0],
        sky: "end",
      });
    }
    return (
      (t.ambient = [
        0.03 + 0.11 * this.renderer.gamma,
        0.03 + 0.11 * this.renderer.gamma,
        0.03 + 0.11 * this.renderer.gamma,
      ]),
      (t.sky = "overworld"),
      t
    );
  }),
  (Game.prototype.tryLightPortal = function (t, e, o) {
    const s = this.world;
    if ("end" === this.dim) return !1;
    const isFrame = (t) => 28 === t,
      inner = (t) => 0 === t || 171 === t;
    for (const i of [0, 1]) {
      const n = 0 === i ? 1 : 0,
        r = 0 === i ? 0 : 1;
      if (!inner(s.getBlock(t, e, o))) return !1;
      let a = e;
      for (; a > e - 22 && inner(s.getBlock(t, a - 1, o));) a--;
      if (!isFrame(s.getBlock(t, a - 1, o))) continue;
      let l = 0;
      for (; l < 22 && inner(s.getBlock(t - n * (l + 1), a, o - r * (l + 1)));) l++;
      if (!isFrame(s.getBlock(t - n * (l + 1), a, o - r * (l + 1)))) continue;
      const h = t - n * l,
        d = o - r * l;
      let c = 0;
      for (; c < 22 && inner(s.getBlock(h + n * c, a, d + r * c));) c++;
      if (c < 2 || c > 21 || !isFrame(s.getBlock(h + n * c, a, d + r * c))) continue;
      let p = 0;
      for (; p < 22 && inner(s.getBlock(h, a + p, d));) p++;
      if (p < 3 || p > 21) continue;
      let f = !0;
      for (let t = 0; t < c && f; t++) {
        (isFrame(s.getBlock(h + n * t, a - 1, d + r * t)) &&
          isFrame(s.getBlock(h + n * t, a + p, d + r * t))) ||
          (f = !1);
        for (let e = 0; e < p && f; e++) inner(s.getBlock(h + n * t, a + e, d + r * t)) || (f = !1);
      }
      for (let t = 0; t < p && f; t++)
        (isFrame(s.getBlock(h - n, a + t, d - r)) &&
          isFrame(s.getBlock(h + n * c, a + t, d + r * c))) ||
          (f = !1);
      if (f) {
        for (let t = 0; t < c; t++)
          for (let e = 0; e < p; e++) s.setBlock(h + n * t, a + e, d + r * t, 170, i, 0);
        return (
          this.recordPortal(this.dim, [h, a, d, i]),
          Sound.ev("block.portal.trigger", [t, e, o], 0.4, 1.4),
          this.flushMesh(),
          !0
        );
      }
    }
    return !1;
  }),
  (Game.prototype.recordPortal = function (t, e) {
    const o = this.worldMeta.portals[t] || (this.worldMeta.portals[t] = []);
    o.some(
      (t) => Math.abs(t[0] - e[0]) < 4 && Math.abs(t[1] - e[1]) < 4 && Math.abs(t[2] - e[2]) < 4,
    ) || o.push(e);
  }),
  (Game.prototype.portalValid = function (t, e, o) {
    const s = this.world,
      i = 1 & s.getMeta(t, e, o),
      ok = (t) => 170 === t || 28 === t,
      n = 0 === i ? 1 : 0,
      r = 0 === i ? 0 : 1;
    return (
      ok(s.getBlock(t, e + 1, o)) &&
      ok(s.getBlock(t, e - 1, o)) &&
      ok(s.getBlock(t + n, e, o + r)) &&
      ok(s.getBlock(t - n, e, o - r))
    );
  }),
  (Game.prototype.tickPortals = function () {
    const t = this.player,
      e = this.world,
      o = t.box();
    t.portalT || (t.portalT = 0);
    let s = !1,
      i = !1;
    for (let t = Math.floor(o[0]); t <= Math.floor(o[3]); t++)
      for (let n = Math.floor(o[1]); n <= Math.floor(o[4]); n++)
        for (let r = Math.floor(o[2]); r <= Math.floor(o[5]); r++) {
          const a = e.getBlock(t, n, r);
          170 === a ? (s = !0) : 175 === a && o[1] < n + 0.75 && (i = !0);
        }
    if (i && !t.portalLock) return ((t.portalLock = !0), void this.enterEndPortal());
    (s && 0 === t.deathTime
      ? t.portalLock ||
        (0 === t.portalT && Sound.ev("block.portal.trigger", null, 0.25, 0.8 + 0.4 * Math.random()),
        t.portalT++,
        t.portalT >= (t.creative ? 1 : 80) &&
          ((t.portalLock = !0), (t.portalT = 0), this.useNetherPortal()))
      : ((t.portalT = Math.max(0, (t.portalT || 0) - 4)), i || s || (t.portalLock = !1)),
      (this.portalOverlay = Math.min(1, (t.portalT || 0) / 80)));
  }),
  (Game.prototype.useNetherPortal = function () {
    const t = this.player,
      e = "overworld" === this.dim,
      o = e ? "nether" : "overworld",
      s = e ? 1 / 8 : 8,
      i = Math.floor(t.pos[0] * s),
      n = Math.floor(t.pos[2] * s),
      r = this.worldMeta.portals[o] || [],
      a = e ? 16 : 128;
    let l = null,
      h = 1e9;
    for (const t of r) {
      const e = Math.hypot(t[0] - i, t[2] - n);
      e < a && e < h && ((h = e), (l = t));
    }
    const d = l ? [l[0] + 0.5, l[1], l[2] + 0.5] : [i + 0.5, e ? 70 : 80, n + 0.5];
    this.changeDimension(o, d, () => {
      const t = this.world;
      (l && 170 === t.getBlock(l[0], l[1], l[2])
        ? this.placeAtPortal(l)
        : this.placeAtPortal(this.buildPortalNear(l ? l[0] : i, l ? l[2] : n)),
        "nether" === o && this.grant("nether"));
    });
  }),
  (Game.prototype.placeAtPortal = function (t) {
    const e = this.player,
      [o, s, i, n] = t;
    ((e.pos = [o + (0 === n ? 1 : 0.5), s, i + (0 === n ? 0.5 : 1)]),
      (e.prev = [...e.pos]),
      (e.yaw = 0 === n ? 0 : Math.PI / 2),
      (e.portalLock = !0),
      (e.portalT = 0));
  }),
  (Game.prototype.buildPortalNear = function (t, e) {
    const o = this.world,
      s = "nether" === this.dim,
      fits = (t, e, s) => {
        for (let i = -1; i <= 2; i++)
          for (let n = -1; n <= 1; n++) {
            if (!SOLIDCUBE[o.getBlock(t + i, e - 1, s + n)]) return !1;
            for (let r = 0; r < 4; r++) {
              const a = o.getBlock(t + i, e + r, s + n);
              if (a && !REPLACEABLE[a]) return !1;
            }
          }
        return !0;
      };
    let i = null;
    const n = o.flat ? 1 : SEA;
    t: for (let r = 0; r <= 12; r += 2)
      for (let a = 0; a < (r ? 8 : 1); a++) {
        const l = t + Math.round(Math.cos((a / 8) * Math.PI * 2) * r),
          h = e + Math.round(Math.sin((a / 8) * Math.PI * 2) * r);
        if (s) {
          for (let t = 100; t > 33; t--)
            if (fits(l, t, h)) {
              i = [l, t, h];
              break t;
            }
        } else {
          const t = o.surfaceY(l, h) + 1;
          if (t > n && t < HEIGHT - 16 && fits(l, t, h)) {
            i = [l, t, h];
            break t;
          }
        }
      }
    if (!i) {
      let r = s ? 70 : Math.max(n + 2, o.surfaceY(t, e) + 1);
      i = [t, r, e];
      for (let s = -2; s <= 3; s++)
        for (let i = -2; i <= 2; i++) {
          o.setBlock(t + s, r - 1, e + i, 28, 0, 0);
          for (let n = 0; n < 5; n++) o.setBlock(t + s, r + n, e + i, 0, 0, 0);
        }
    }
    const [r, a, l] = i;
    for (let t = -1; t <= 2; t++)
      for (let e = -1; e <= 3; e++) {
        const s = -1 === t || 2 === t || -1 === e || 3 === e;
        o.setBlock(r + t, a + e, l, s ? 28 : 170, 0, 0);
      }
    for (let t = -1; t <= 2; t++)
      for (const e of [-1, 1]) {
        SOLIDCUBE[o.getBlock(r + t, a - 1, l + e)] || o.setBlock(r + t, a - 1, l + e, 28, 0, 0);
        for (let s = 0; s < 3; s++)
          o.getBlock(r + t, a + s, l + e) &&
            !REPLACEABLE[o.getBlock(r + t, a + s, l + e)] &&
            o.setBlock(r + t, a + s, l + e, 0, 0, 0);
      }
    const h = [r, a, l, 0];
    return (this.recordPortal(this.dim, h), h);
  }),
  (Game.prototype.fillEndFrame = function (t, e, o) {
    const s = this.world;
    s.setMeta(t, e, o, 4 | s.getMeta(t, e, o));
    for (const s of [this.player, ...this.entities]) {
      if (!s || s.dead || s.noClip || s.vehicle) continue;
      const i = s.box();
      i[0] < t + 0.75 &&
        i[3] > t + 0.25 &&
        i[2] < o + 0.75 &&
        i[5] > o + 0.25 &&
        i[1] < e + 1 &&
        i[4] > e + 13 / 16 &&
        ((s.pos[1] = e + 1), s.prev && (s.prev[1] = e + 1));
    }
    Sound.ev("block.end_portal_frame.fill", [t, e, o], 1, 1);
    for (let s = 0; s < 12; s++)
      this.particles.spawn(
        "smoke",
        t + 0.2 + 0.6 * Math.random(),
        e + 1,
        o + 0.2 + 0.6 * Math.random(),
        0,
        0.02,
        0,
      );
    const isEye = (t, e, o) => 174 === s.getBlock(t, e, o) && 4 & s.getMeta(t, e, o);
    for (let i = t - 2; i <= t + 2; i++)
      for (let t = o - 2; t <= o + 2; t++) {
        let o = !0;
        for (let s = -1; s <= 1 && o; s++)
          o =
            isEye(i + s, e, t - 2) &&
            isEye(i + s, e, t + 2) &&
            isEye(i - 2, e, t + s) &&
            isEye(i + 2, e, t + s);
        if (o) {
          for (let o = -1; o <= 1; o++)
            for (let n = -1; n <= 1; n++) s.setBlock(i + o, e, t + n, 175, 0);
          return (
            Sound.ev("block.end_portal.spawn", null, 1, 1),
            this.ui.message("末地传送门已激活！", "#AA55FF"),
            void this.flushMesh()
          );
        }
      }
  }),
  (Game.prototype.enterEndPortal = function () {
    "end" !== this.dim
      ? this.changeDimension("end", [100.5, 49, 0.5], () => {
          const t = this.world;
          for (let e = 98; e <= 102; e++)
            for (let o = -2; o <= 2; o++) {
              t.setBlock(e, 48, o, 28, 0, 0);
              for (let s = 49; s <= 51; s++) t.setBlock(e, s, o, 0, 0, 0);
            }
          const e = this.player;
          ((e.pos = [100.5, 49, 0.5]),
            (e.prev = [...e.pos]),
            (e.yaw = Math.PI / 2),
            this.grant("the_end"),
            this.setupDragonFight());
        })
      : this.leaveEnd();
  }),
  (Game.prototype.setupDragonFight = function () {
    const t = this.worldMeta.end,
      e = this.world;
    if (!t.dragonKilled && !t.dragonSpawned) {
      t.dragonSpawned = !0;
      for (const t of e.endPillars) {
        const e = new EndCrystal(this, t.x + 0.5, t.h + 2, t.z + 0.5);
        this.entities.push(e);
      }
      (this.entities.push(new EnderDragon(this, 0, 110, -60)),
        this.ui.message("末影龙出现了……", "#AA55FF"));
    }
  }),
  (Game.prototype.dragon = function () {
    return "end" === this.dim
      ? this.entities.find((t) => t instanceof EnderDragon && !t.dead)
      : null;
  }),
  (Game.prototype.onDragonKilled = function (t) {
    const e = this.world,
      o = this.worldMeta.end,
      s = !o.dragonKilled;
    o.dragonKilled = !0;
    const i = e.podiumY() - 1;
    for (let t = -3; t <= 3; t++)
      for (let o = -3; o <= 3; o++) {
        Math.hypot(t, o) <= 2.5 && (t || o) && e.setBlock(t, i + 1, o, 175, 0);
      }
    (s
      ? (e.setBlock(0, i + 5, 0, 176, 0), this.dropXp(0.5, i + 3, 0.5, 12e3))
      : this.dropXp(0.5, i + 3, 0.5, 500),
      this.grant("free_end"),
      this.ui.message("末影龙被击败了！中央的返回传送门已经开启。", "#FFFF55"),
      this.flushMesh());
  }),
  (Game.prototype.leaveEnd = function () {
    const t = this.worldMeta.end,
      go = () => {
        const t = this.player.spawn;
        this.changeDimension("overworld", [t[0] + 0.5, t[1], t[2] + 0.5], () => {
          ((this.player.respawnGround = !0), this.respawnSettle());
        });
      };
    t.dragonKilled && !t.credits
      ? ((t.credits = !0), this.ui.open(new CreditsScreen(this, go)))
      : go();
  }));
const FLAMMABLE = new Set([
  5,
  14,
  15,
  25,
  26,
  46,
  47,
  48,
  49,
  50,
  51,
  58,
  60,
  87,
  104,
  105,
  106,
  107,
  115,
  116,
  178,
  39,
  40,
  45,
  ...Array.from({ length: 16 }, (t, e) => 128 + e),
]);
((Game.prototype.fireSupported = function (t, e, o) {
  const s = this.world,
    i = s.getBlock(t, e - 1, o);
  if (SOLIDCUBE[i] || 119 === i || 120 === i) return !0;
  for (const i of DIRS) if (FLAMMABLE.has(s.getBlock(t + i[0], e + i[1], o + i[2]))) return !0;
  return !1;
}),
  (Game.prototype.fireIdAt = function (t, e, o) {
    const s = this.world.getBlock(t, e - 1, o);
    return void 0 === BID.soul_fire || (s !== BID.soul_sand && s !== BID.soul_soil)
      ? 171
      : BID.soul_fire;
  }),
  (Game.prototype.fireTick = function (t, e, o) {
    const s = this.world,
      i = s.getBlock(t, e - 1, o);
    if (
      !(119 === i || 103 === i || ("end" === this.dim && 6 === i)) &&
      (("overworld" === this.dim && this.weather > 0.5 && s.skyAt(t, e, o) >= 15) ||
        Math.random() < 0.15)
    ) {
      let i = !1;
      for (const n of DIRS) FLAMMABLE.has(s.getBlock(t + n[0], e + n[1], o + n[2])) && (i = !0);
      if (!i || Math.random() < 0.3) return void s.setBlock(t, e, o, 0, 0);
    }
    for (const i of DIRS) {
      const n = t + i[0],
        r = e + i[1],
        a = o + i[2],
        l = s.getBlock(n, r, a);
      FLAMMABLE.has(l) &&
        Math.random() < 0.08 &&
        (26 === l
          ? (s.setBlock(n, r, a, 0, 0), this.addEntity(new PrimedTNT(this, n, r, a, 40)))
          : s.setBlock(n, r, a, Math.random() < 0.6 ? this.fireIdAt(n, r, a) : 0, 0));
    }
    for (let i = 0; i < 2; i++) {
      const i = t + ((3 * Math.random()) | 0) - 1,
        n = e + ((4 * Math.random()) | 0) - 1,
        r = o + ((3 * Math.random()) | 0) - 1;
      if (0 === s.getBlock(i, n, r) && this.fireSupported(i, n, r) && Math.random() < 0.3) {
        let t = !1;
        for (const e of DIRS) FLAMMABLE.has(s.getBlock(i + e[0], n + e[1], r + e[2])) && (t = !0);
        t && s.setBlock(i, n, r, this.fireIdAt(i, n, r), 0);
      }
    }
  }),
  (Game.prototype.lavaTick = function (t, e, o) {
    const s = this.world,
      i = Math.random;
    if (this.rule && 0 === this.rule("fire_spread_radius_around_player")) return;
    const burns = (t, e, o) => FLAMMABLE.has(s.getBlock(t, e, o)),
      n = (3 * i()) | 0;
    if (n > 0) {
      let r = t,
        a = e,
        l = o;
      for (let t = 0; t < n; t++) {
        if (
          ((r += ((3 * i()) | 0) - 1),
          a++,
          (l += ((3 * i()) | 0) - 1),
          !s.isLoaded(r, l) || a >= HEIGHT)
        )
          return;
        const t = s.getBlock(r, a, l);
        if (0 === t) {
          if (DIRS.some((t) => burns(r + t[0], a + t[1], l + t[2])))
            return void s.setBlock(r, a, l, this.fireIdAt(r, a, l), 0);
        } else if (BLOCKS[t].solid) return;
      }
    } else
      for (let n = 0; n < 3; n++) {
        const n = t + ((3 * i()) | 0) - 1,
          r = o + ((3 * i()) | 0) - 1;
        if (!s.isLoaded(n, r)) return;
        e + 1 < HEIGHT &&
          0 === s.getBlock(n, e + 1, r) &&
          burns(n, e, r) &&
          s.setBlock(n, e + 1, r, this.fireIdAt(n, e + 1, r), 0);
      }
  }));
const SPAWNER_MOBS = ["zombie", "skeleton", "spider", "blaze"];
((Game.prototype.spawnerMob = function (t, e, o) {
  const s = this.blockEntities.get(t + "," + e + "," + o);
  return s && "spawner" === s.type
    ? s.mob && MOB_TYPES[s.mob]
      ? s.mob
      : null
    : SPAWNER_MOBS[3 & this.world.getMeta(t, e, o)];
}),
  (Game.prototype.tickSpawners = function () {
    const t = this.player,
      e = this.world,
      o = Math.floor(t.pos[0]),
      s = Math.floor(t.pos[1]),
      i = Math.floor(t.pos[2]);
    this.spawnerT = this.spawnerT || new Map();
    for (let t = (o >> 4) - 1; t <= 1 + (o >> 4); t++)
      for (let n = (i >> 4) - 1; n <= 1 + (i >> 4); n++) {
        const r = e.getChunk(t, n);
        if (r) {
          r.spawners ||
            ((r.spawners = []),
            r.findAll([127], (e) =>
              r.spawners.push([16 * t + (15 & e), e >> 8, 16 * n + ((e >> 4) & 15)]),
            ));
          for (const t of r.spawners) {
            const [n, r, a] = t;
            if (127 !== e.getBlock(n, r, a)) continue;
            if (Math.hypot(n - o, r - s, a - i) > 16) continue;
            const l = this.spawnerMob(n, r, a);
            if (!l) continue;
            Math.random() < 0.3 &&
              this.particles.spawn(
                "flame",
                n + Math.random(),
                r + Math.random(),
                a + Math.random(),
                0,
                0.01,
                0,
              );
            const h = t.join(",");
            let d = this.spawnerT.get(h);
            if ((void 0 === d && (d = 20), (d -= 20), d > 0)) {
              this.spawnerT.set(h, d);
              continue;
            }
            this.spawnerT.set(h, 200 + 600 * Math.random());
            if (
              !(
                this.entities.filter(
                  (t) => t instanceof Mob && t.type === l && t.distTo({ pos: [n, r, a] }) < 9,
                ).length >= 6
              )
            )
              for (let t = 0; t < 4; t++) {
                const t = n + 8 * (Math.random() - 0.5),
                  o = r + ((3 * Math.random()) | 0) - 1,
                  s = a + 8 * (Math.random() - 0.5),
                  i = createMob(this, l, Math.floor(t) + 0.5, o, Math.floor(s) + 0.5);
                if (
                  !i.collides(i.box()) &&
                  (i.T.flying || BLOCKS[e.getBlock(Math.floor(t), o - 1, Math.floor(s))].solid)
                ) {
                  ((i.persistent = !1), this.entities.push(i));
                  for (let t = 0; t < 10; t++)
                    this.particles.spawn(
                      "smoke",
                      i.pos[0] + (Math.random() - 0.5),
                      i.pos[1] + Math.random() * i.h,
                      i.pos[2] + (Math.random() - 0.5),
                      0,
                      0.02,
                      0,
                    );
                }
              }
          }
        }
      }
  }),
  (Game.prototype.spawnMobsDim = function () {
    const t = this.player,
      e = this.world;
    if (0 === this.difficulty) return;
    if ("nether" === this.dim && e.gen2 && this.spawnNetherV) return this.spawnNetherV();
    const o = this.entities.filter((t) => t instanceof Mob && t.T.hostile).length;
    if ("end" === this.dim) {
      if (o >= 14) return;
      const s = Math.random() * Math.PI * 2,
        i = 16 + 40 * Math.random(),
        n = Math.floor(t.pos[0] + Math.sin(s) * i),
        r = Math.floor(t.pos[2] + Math.cos(s) * i);
      if (!e.isLoaded(n, r)) return;
      const a = e.surfaceY(n, r) + 1;
      if (a < 10 || 172 !== e.getBlock(n, a - 1, r)) return;
      const l = new Enderman(this, n + 0.5, a, r + 0.5);
      return void (l.collides(l.box()) || this.entities.push(l));
    }
    if (!("nether" !== this.dim || o >= 24))
      for (let o = 0; o < 2; o++) {
        const o = Math.random() * Math.PI * 2,
          s = 20 + 40 * Math.random(),
          i = Math.floor(t.pos[0] + Math.sin(o) * s),
          n = Math.floor(t.pos[2] + Math.cos(o) * s);
        if (!e.isLoaded(i, n)) continue;
        let r = Math.floor(t.pos[1]) + ((40 * Math.random()) | 0) - 20;
        for (r = clamp(r, 32, 120); r > 31 && 0 !== e.getBlock(i, r, n);) r++;
        for (; r > 31 && 0 === e.getBlock(i, r - 1, n);) r--;
        if (r <= 31 || 0 !== e.getBlock(i, r + 1, n) || !SOLIDCUBE[e.getBlock(i, r - 1, n)])
          continue;
        const a = Math.random();
        let l;
        if (e.inFortress(i, r, n) && a < 0.5) l = "blaze";
        else if (a < 0.55) l = "zombified_piglin";
        else if (a < 0.7) l = "magma_cube";
        else if (a < 0.82) l = "ghast";
        else {
          if (!(a < 0.88)) continue;
          l = "enderman";
        }
        if ("ghast" === l) {
          let t = !0;
          for (let o = 2; o < 8 && t; o++)
            for (let s = -2; s <= 2 && t; s += 2)
              for (let a = -2; a <= 2 && t; a += 2)
                0 !== e.getBlock(i + s, r + o, n + a) && (t = !1);
          if (!t || this.entities.filter((t) => t instanceof Ghast).length >= 3) continue;
          this.entities.push(new Ghast(this, i + 0.5, r + 3, n + 0.5));
          continue;
        }
        const h = "zombified_piglin" === l ? 2 + ((3 * Math.random()) | 0) : 1;
        for (let t = 0; t < h; t++) {
          const e = createMob(
            this,
            l,
            i + 0.5 + (t ? 3 * (Math.random() - 0.5) : 0),
            r,
            n + 0.5 + (t ? 3 * (Math.random() - 0.5) : 0),
          );
          ("magma_cube" === l && e.setSize([1, 2, 4][(3 * Math.random()) | 0]),
            e.collides(e.box()) || this.entities.push(e));
        }
      }
  }),
  (Game.prototype.checkEnderStare = function () {
    const t = this.player;
    if (t.creative || t.deathTime > 0) return;
    const e = [t.pos[0], t.pos[1] + t.eye(), t.pos[2]],
      o = this.lookDir();
    for (const s of this.entities) {
      if (!(s instanceof Enderman) || s.angry || s.deathTime > 0) continue;
      const i = s.pos[0] - e[0],
        n = s.pos[1] + 2.6 - e[1],
        r = s.pos[2] - e[2],
        a = Math.hypot(i, n, r);
      if (
        !(a > 64 || a < 0.5) &&
        (i * o[0] + n * o[1] + r * o[2]) / a > 1 - 0.025 / a &&
        s.canSee(t)
      ) {
        if (t.inv.slots[36] && "carved_pumpkin" === ITEMS[t.inv.slots[36].id].key) continue;
        (s.provoke(t),
          Sound.ev("entity.enderman.stare", s.pos, 1, 1),
          a > 8 &&
            teleportEntity(
              s,
              t.pos[0] + 4 * (Math.random() - 0.5),
              t.pos[1] + 1,
              t.pos[2] + 4 * (Math.random() - 0.5),
            ));
      }
    }
  }),
  (Game.prototype.nearestStronghold = function () {
    const t = this.player;
    let e = null,
      o = 1e9;
    const s =
      "overworld" === this.dim
        ? this.world
        : this.dimData.overworld && this.dimData.overworld.world;
    if (!s) return null;
    for (const i of s.strongholds()) {
      const s = Math.hypot(i.x - t.pos[0], i.z - t.pos[2]);
      s < o && ((o = s), (e = i));
    }
    return e;
  }),
  (Game.prototype.bedExplode = function (t, e, o) {
    const s = this.world,
      i = s.getMeta(t, e, o),
      n = [4, 1, 5, 0][3 & i],
      r = DIRS[4 & i ? OPP[n] : n];
    (s.setBlock(t + r[0], e, o + r[2], 0, 0, 0),
      s.setBlock(t, e, o, 0, 0),
      this.explode(t + 0.5, e + 0.5, o + 0.5, 5, null, !1, !0));
  }));
class CreditsScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, null),
      (this.onDone = e),
      (this.pauses = !0),
      (this.t = 0),
      (this.last = performance.now()),
      (this.bgDim = 0),
      (this.blurBg = !1));
    const o = [],
      s = window.MC_TEXTS || {},
      fmt = (t) => t.replace(/PLAYERNAME/g, "玩家");
    for (let t = 0; t < 6; t++) o.push({ t: "" });
    if ((o.push({ logo: !0 }, { t: "" }, { t: "" }), s["end.txt"]))
      for (const t of s["end.txt"].split("\n")) {
        let e = "#FFFFFF",
          s = fmt(t);
        const i = s.match(/^§(.)/);
        (i && (e = { 2: "#00AA00", 3: "#00AAAA", f: "#FFFFFF", 7: "#AAAAAA" }[i[1]] || "#FFFFFF"),
          (s = s.replace(/§k([^§]*)/g, (t, e) => "" + e + "").replace(/§./g, "")));
        for (const t of this.wrap(s, 274)) o.push({ t: t, col: e });
        o.push({ t: "" });
      }
    for (let t = 0; t < 4; t++) o.push({ t: "" });
    try {
      const t = JSON.parse(s["credits.json"] || "[]");
      for (const e of t) {
        o.push(
          { t: "" },
          { t: "============", col: "#FFFFFF", center: !0 },
          { t: e.section, col: "#FFFF55", center: !0 },
          { t: "============", col: "#FFFFFF", center: !0 },
          { t: "" },
        );
        for (const t of e.disciplines || []) {
          t.discipline && o.push({ t: t.discipline, col: "#AAAAAA", center: !0 }, { t: "" });
          for (const e of t.titles || []) {
            o.push({ t: e.title, col: "#777777", center: !0 });
            for (const t of e.names || []) o.push({ t: t, col: "#FFFFFF", center: !0 });
            o.push({ t: "" });
          }
        }
      }
    } catch (t) {}
    if (s["postcredits.txt"])
      for (const t of s["postcredits.txt"].split("\n"))
        for (const e of this.wrap(t.replace(/§./g, ""), 274))
          o.push({ t: e, col: "#FFFFFF", center: !0 });
    (o.push({ t: "" }, { t: "本作品为非官方复刻 · 感谢游玩！", col: "#FFFF55", center: !0 }),
      (this.lines = o));
  }
  wrap(t, e) {
    const o = [];
    let s = "";
    for (const i of t.split(" ")) {
      const t = s ? s + " " + i : i;
      Font.width(t.replace(/[\u0001\u0002]/g, "")) > e && s ? (o.push(s), (s = i)) : (s = t);
    }
    return (o.push(s), o);
  }
  layout() {}
  draw(t) {
    const e = t.ctx,
      o = performance.now(),
      s = Math.min(100, o - this.last);
    this.last = o;
    const i = this.held || {},
      n = i.Space || i.ControlLeft || i.ControlRight;
    ((this.t += s * (n ? 0.12 : 0.025)), (e.fillStyle = "#000"), e.fillRect(0, 0, t.w, t.h));
    const r = Math.floor(t.w / 2 - 137);
    let a = t.h - this.t;
    for (const o of this.lines) {
      if (a > -20 && a < t.h + 10)
        if (o.logo)
          ((e.imageSmoothingEnabled = !0),
            e.drawImage(t.img.logo, 0, 0, 1024, 256, t.w / 2 - 137, a - 10, 274, 68),
            (e.imageSmoothingEnabled = !1));
        else if (o.t) {
          let s = o.t;
          (s.includes("") &&
            (s = s.replace(/\u0001([^\u0002]*)\u0002/g, (t, e) =>
              e
                .split("")
                .map((t) =>
                  " " === t ? " " : String.fromCharCode(33 + ((90 * Math.random()) | 0)),
                )
                .join(""),
            )),
            o.center
              ? Font.center(e, s, t.w / 2, a, o.col || "#FFFFFF")
              : Font.draw(e, s, r, a, o.col || "#FFFFFF"));
        }
      a += o.logo ? 80 : 12;
    }
    (a < -20 && this.finish(), Font.draw(e, "按住空格加速 · Esc 跳过", 4, t.h - 12, "#555555"));
  }
  finish() {
    this.done ||
      ((this.done = !0),
      removeEventListener("keyup", this.unhold),
      removeEventListener("blur", this.unhold),
      (this.game.ui.screen = null),
      this.onDone());
  }
  onEsc() {
    this.finish();
  }
  key(t, e) {
    return "Escape" === e.key
      ? (this.finish(), !0)
      : (("Space" !== e.code && "ControlLeft" !== e.code && "ControlRight" !== e.code) ||
          (this.unhold ||
            ((this.unhold = (t) => {
              "blur" === t.type ? (this.held = {}) : this.held && delete this.held[t.code];
            }),
            addEventListener("keyup", this.unhold),
            addEventListener("blur", this.unhold)),
          ((this.held || (this.held = {}))[e.code] = !0)),
        !0);
  }
  mouseDown() {}
}
//# sourceURL=js/dims.js
