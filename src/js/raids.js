"use strict";
const RAID_MAX_OMEN = 5,
  RAID_COOLDOWN = 300,
  RAIDER_WAVES = [
    ["vindicator", [0, 0, 2, 0, 1, 4, 2, 5]],
    ["evoker", [0, 0, 0, 0, 0, 1, 1, 2]],
    ["pillager", [0, 4, 3, 3, 4, 4, 4, 2]],
    ["witch", [0, 0, 0, 0, 3, 0, 0, 1]],
    ["ravager", [0, 0, 0, 1, 0, 1, 0, 2]],
  ],
  RAIDER_TYPES = new Set(RAIDER_WAVES.map((t) => t[0]).concat(["illusioner"])),
  raidGroups = (t) => (1 === t ? 3 : 3 === t ? 7 : 5);
let VILLAGE_POI = null;
function villagePoi() {
  if (VILLAGE_POI) return VILLAGE_POI;
  const t = [];
  for (const s of BLOCKS)
    s &&
      (/_bed$/.test(s.key) ||
        "bell" === s.key ||
        ("undefined" != typeof JOB_SITES && JOB_SITES[s.key])) &&
      t.push(s.id);
  return (VILLAGE_POI = t);
}
function sectionHasPoi(t, s, i, e) {
  const o = t.getChunk(s, e),
    r = o && o.bs && o.bs[i],
    n = villagePoi();
  if (!r) return !1;
  if (r.n >= 0) {
    let t = !1;
    for (let s = 0; s < r.n; s++)
      if (n.includes(r.p[s])) {
        t = !0;
        break;
      }
    if (!t) return !1;
  }
  for (let t = 0; t < 4096; t++) if (n.includes(r.p[r.d[t]])) return !0;
  return !1;
}
function isVillage(t, s, i, e) {
  const o = t.world,
    r = s >> 4,
    n = i >> 4,
    a = e >> 4;
  for (let t = -1; t <= 1; t++)
    if (!(n + t < 0 || n + t >= SECTIONS))
      for (let s = -1; s <= 1; s++)
        for (let i = -1; i <= 1; i++) if (sectionHasPoi(o, r + s, n + t, a + i)) return !0;
  return !1;
}
function poiNear(t, s, i, e, o) {
  const r = t.world,
    n = villagePoi(),
    a = [];
  for (let t = (s - o) >> 4; t <= (s + o) >> 4; t++)
    for (let h = (e - o) >> 4; h <= (e + o) >> 4; h++) {
      const l = r.getChunk(t, h);
      l &&
        l.findAll(n, (r) => {
          const n = 16 * t + (15 & r),
            l = r >> 8,
            c = 16 * h + ((r >> 4) & 15);
          (n - s) ** 2 + (l - i) ** 2 + (c - e) ** 2 <= o * o && a.push([n, l, c]);
        });
    }
  return a;
}
class Raid {
  constructor(t, s) {
    ((this.g = t),
      (this.center = s),
      (this.omen = 0),
      (this.groups = 0),
      (this.numGroups = raidGroups(t.difficulty)),
      (this.cooldown = 300),
      (this.status = "ongoing"),
      (this.ticksActive = 0),
      (this.started = !1),
      (this.stopped = !1),
      (this.postTicks = 0),
      (this.celebT = 0),
      (this.raiders = new Set()),
      (this.heroes = new Set()),
      (this.totalHealth = 0),
      (this.spawnPos = null),
      (this.name = "袭击"),
      (this.progress = 0),
      (this.visible = !0));
  }
  save() {
    return {
      c: this.center,
      o: this.omen,
      gs: this.groups,
      n: this.numGroups,
      cd: this.cooldown,
      s: this.status,
      ta: this.ticksActive,
      st: this.started,
      pt: this.postTicks,
      ct: this.celebT,
      th: this.totalHealth,
    };
  }
  static load(t, s) {
    const i = new Raid(t, s.c);
    return (
      Object.assign(i, {
        omen: s.o,
        groups: s.gs,
        numGroups: s.n,
        cooldown: s.cd,
        status: s.s,
        ticksActive: s.ta,
        started: s.st,
        postTicks: s.pt,
        celebT: s.ct,
        totalHealth: s.th,
      }),
      (i.adopt = !0),
      i
    );
  }
  get over() {
    return "victory" === this.status || "loss" === this.status;
  }
  alive() {
    let t = 0;
    for (const s of this.raiders) s.dead || s.deathTime || t++;
    return t;
  }
  health() {
    let t = 0;
    for (const s of this.raiders) s.dead || s.deathTime || (t += s.health);
    return t;
  }
  hasBonus() {
    return this.omen > 1;
  }
  hasMoreWaves() {
    return this.hasBonus() ? this.groups <= this.numGroups : this.groups !== this.numGroups;
  }
  shouldSpawnBonus() {
    return this.groups === this.numGroups && 0 === this.alive() && this.hasBonus();
  }
  shouldSpawnGroup() {
    return (
      0 === this.cooldown &&
      (this.groups < this.numGroups || this.shouldSpawnBonus()) &&
      0 === this.alive()
    );
  }
  stop() {
    this.stopped = !0;
    for (const t of this.raiders) t.raid = null;
    this.raiders.clear();
  }
  absorbOmen(t) {
    const s = t.effectAmp("raid_omen");
    return !(s < 0) && ((this.omen = clamp(this.omen + s + 1, 0, 5)), !0);
  }
  tick() {
    const t = this.g;
    if (!this.stopped) {
      if (this.adopt) {
        this.adopt = !1;
        for (const s of t.entities)
          RAIDER_TYPES.has(s.type) &&
            !s.dead &&
            s.distTo &&
            Math.hypot(s.pos[0] - this.center[0], s.pos[2] - this.center[2]) < 112 &&
            this.join(s, this.groups);
      }
      if ("ongoing" === this.status) {
        if (0 === t.difficulty) return void this.stop();
        if (((this.visible = t.world.isLoaded(this.center[0], this.center[2])), !this.visible))
          return;
        if (!isVillage(t, ...this.center)) {
          const [s, i, e] = this.center;
          let o = null,
            r = 1 / 0;
          for (let n = -2; n <= 2; n++)
            for (let a = -2; a <= 2; a++)
              for (let h = -2; h <= 2; h++) {
                const l = s + 16 * n,
                  c = i + 16 * a,
                  d = e + 16 * h;
                if (c < 0 || c >= HEIGHT || !sectionHasPoi(t.world, l >> 4, c >> 4, d >> 4))
                  continue;
                const p = n * n + a * a + h * h;
                p < r && ((r = p), (o = [l, c, d]));
              }
          if (o) this.center = o;
          else {
            if (!(this.groups > 0)) return void this.stop();
            this.status = "loss";
          }
        }
        if (++this.ticksActive >= 48e3) return void this.stop();
        const s = this.alive();
        if (0 === s && this.hasMoreWaves())
          if (this.cooldown > 0)
            (this.spawnPos || this.cooldown % 5 != 0 || (this.spawnPos = this.findSpawn()),
              this.cooldown--,
              (this.progress = clamp((300 - this.cooldown) / 300, 0, 1)));
          else if (this.groups > 0) return ((this.cooldown = 300), void (this.name = "袭击"));
        if (this.ticksActive % 20 == 0) {
          for (const t of [...this.raiders]) t.dead && this.raiders.delete(t);
          this.name = s > 0 && s <= 2 ? `袭击 - 剩余${s}名袭击者` : "袭击";
        }
        s > 0 &&
          this.totalHealth > 0 &&
          (this.progress = clamp(this.health() / this.totalHealth, 0, 1));
        let i = !1;
        for (let t = 0; this.shouldSpawnGroup(); t++) {
          const s = this.spawnPos || this.findSpawn();
          if (
            (s ? ((this.started = !0), this.spawnGroup(s), i || (this.horn(s), (i = !0))) : t++,
            t > 5)
          )
            return void this.stop();
        }
        if (this.started && !this.hasMoreWaves() && 0 === this.alive())
          if (this.postTicks < 40) this.postTicks++;
          else {
            this.status = "victory";
            for (const t of this.heroes)
              t.dead ||
                0 !== t.deathTime ||
                t.spectator ||
                t.addEffect("hero_of_the_village", this.omen - 1, 48e3);
          }
        this.raidersTick();
      } else if (this.over) {
        if (++this.celebT >= 600) return void this.stop();
        (this.celebT % 20 == 0 &&
          ("victory" === this.status
            ? ((this.progress = 0), (this.name = "袭击 - 胜利"))
            : (this.name = "袭击 - 失败")),
          this.raidersTick());
      }
    }
  }
  findSpawn() {
    const t = this.g,
      s = t.world,
      [i, e, o] = this.center;
    for (let r = 0; r < 3; r++) {
      const n = 0 === r ? 2 : 2 - r;
      for (let a = 0; a < 20; a++) {
        const a = Math.random() * Math.PI * 2,
          h = i + Math.floor(32 * Math.cos(a) * n) + randInt(0, 4),
          l = o + Math.floor(32 * Math.sin(a) * n) + randInt(0, 4);
        if (!s.isLoaded(h, l) || !s.isLoaded(h + 10, l + 10) || !s.isLoaded(h - 10, l - 10))
          continue;
        let c = HEIGHT - 1;
        for (; c > 0 && !s.getBlock(h, c, l);) c--;
        const d = BLOCKS[s.getBlock(h, c, l)];
        if (
          d &&
          d.solid &&
          !(Math.abs(c + 1 - e) > 96) &&
          !BLOCKS[s.getBlock(h, c + 1, l)].solid &&
          !BLOCKS[s.getBlock(h, c + 2, l)].solid &&
          (!isVillage(t, h, c + 1, l) || r >= 2)
        )
          return [h, c + 1, l];
      }
    }
    return null;
  }
  bonusSpawns(t, s, i) {
    const e = this.g.difficulty,
      o = 1 === e,
      r = 2 === e;
    let n;
    if ("witch" === t) {
      if (o || s <= 2 || 4 === s) return 0;
      n = 1;
    } else if ("vindicator" === t || "pillager" === t) n = o ? randInt(0, 1) : r ? 1 : 2;
    else {
      if ("ravager" !== t) return 0;
      n = !o && i ? 1 : 0;
    }
    return n > 0 ? randInt(0, n) : 0;
  }
  spawnGroup(t) {
    const s = this.g,
      i = this.groups + 1,
      e = this.shouldSpawnBonus();
    let o = !1;
    this.totalHealth = 0;
    const make = (e) => {
      const o = createMob(s, e, t[0] + 0.5, t[1], t[2] + 0.5);
      return o ? (s.entities.push(o), this.join(o, i), o) : null;
    };
    for (const [t, s] of RAIDER_WAVES) {
      const r = s[e ? this.numGroups : i] + this.bonusSpawns(t, i, e);
      let n = 0;
      for (let s = 0; s < r; s++) {
        const s = make(t);
        if (
          s &&
          (o || "witch" === t || "ravager" === t || ((s.raidLeader = !0), (o = !0)),
          "ravager" === t)
        ) {
          const t =
            i === raidGroups(2)
              ? "pillager"
              : i >= raidGroups(3)
                ? 0 === n
                  ? "evoker"
                  : "vindicator"
                : null;
          if ((n++, t)) {
            const i = make(t);
            i && ((i.raidMount = s), (s.raidRider = i));
          }
        }
      }
    }
    ((this.spawnPos = null), this.groups++);
  }
  join(t, s) {
    ((t.raid = this),
      (t.raidWave = s),
      (t.persistent = !0),
      this.raiders.add(t),
      (this.totalHealth += t.maxHealth || t.health || 0));
  }
  horn(t) {
    const s = this.g.player,
      i = t[0] - s.pos[0],
      e = t[2] - s.pos[2],
      o = Math.hypot(i, e);
    if (Math.hypot(s.pos[0] - this.center[0], s.pos[2] - this.center[2]) > 96 && o > 64) return;
    const r = o > 13 ? 13 / o : 1;
    Sound.ev("event.raid.horn", [s.pos[0] + i * r, s.pos[1] + 1.6, s.pos[2] + e * r], 64, 1);
  }
  raidersTick() {
    for (const t of this.raiders) {
      const s = t.raidMount;
      s &&
        (s.dead || s.deathTime || t.dead
          ? ((t.raidMount = null), (t.riding = !1))
          : ((t.riding = !0),
            (t.pos = [s.pos[0], s.pos[1] + s.h - 0.6 + 0.0625, s.pos[2]]),
            (t.prev = [...t.pos]),
            (t.vel = [0, 0, 0]),
            (t.fallDist = 0),
            t.target || ((t.yaw = s.yaw), (t.bodyYaw = s.bodyYaw))));
    }
  }
}
((Game.prototype.raidAt = function (t, s, i) {
  let e = null,
    o = 9216;
  for (const r of this.raids || []) {
    if (r.stopped) continue;
    const n = (r.center[0] - t) ** 2 + (r.center[1] - s) ** 2 + (r.center[2] - i) ** 2;
    n < o && ((o = n), (e = r));
  }
  return e;
}),
  (Game.prototype.createOrExtendRaid = function (t, s) {
    if (t.spectator || "overworld" !== this.dim || this.net || !this.rule("raids")) return null;
    const i = poiNear(this, s[0], s[1], s[2], 64),
      e = i.length
        ? [0, 1, 2].map((t) => Math.floor(i.reduce((s, i) => s + i[t], 0) / i.length))
        : [...s];
    let o = this.raidAt(...e);
    return (
      o || ((o = new Raid(this, e)), (this.raids || (this.raids = [])).push(o)),
      (!o.started || o.omen < 5) && o.absorbOmen(t),
      o
    );
  }),
  (Game.prototype.raidBars = function () {
    const t = this.player,
      s = [];
    if (!t || "overworld" !== this.dim) return s;
    for (const i of this.raids || [])
      !i.stopped &&
        i.visible &&
        Math.hypot(t.pos[0] - i.center[0], t.pos[1] - i.center[1], t.pos[2] - i.center[2]) < 96 &&
        s.push({ name: i.name, progress: i.progress, color: "red", notch: 10 });
    return s;
  }),
  (() => {
    const t = Living.prototype.tickEffects;
    Living.prototype.tickEffects = function () {
      const s = this.game;
      if (
        this === s.player &&
        this.effects &&
        this.effects.size &&
        !s.net &&
        "overworld" === s.dim &&
        !this.spectator
      ) {
        const t = this.effects.get("raid_omen");
        t &&
          1 === t.dur &&
          (s.createOrExtendRaid(this, this.raidOmenPos || this.pos.map(Math.floor)),
          (this.raidOmenPos = null),
          this.removeEffect("raid_omen"));
        const i = this.effects.get("bad_omen");
        if (i && s.difficulty > 0 && (s.tickCount + 7) % 10 == 0) {
          const t = this.pos.map(Math.floor);
          if (isVillage(s, ...t)) {
            const e = s.raidAt(...t);
            (!e || e.omen < 5) &&
              (this.removeEffect("bad_omen"),
              this.addEffect("raid_omen", i.amp, 600),
              (this.raidOmenPos = t),
              Sound.ev("event.mob_effect.raid_omen", this.pos, 1, 1));
          }
        }
      }
      return t.call(this);
    };
    const s = Game.prototype.tick;
    Game.prototype.tick = function () {
      const t = s.call(this);
      if (
        this.raids &&
        this.raids.length &&
        !this.net &&
        "play" === this.state &&
        (!this.ui.screen || !this.ui.screen.pauses) &&
        "overworld" === this.dim
      ) {
        for (const t of this.raids) this.guard("raid", () => t.tick());
        this.raids = this.raids.filter((t) => !t.stopped);
      }
      return t;
    };
    const i = Living.prototype.die;
    ((Living.prototype.die = function (t) {
      const s = this.game;
      return (
        this.raid && t && (t.attacker === s.player || t.player) && this.raid.heroes.add(s.player),
        i.call(this, t)
      );
    }),
      (VMob.prototype.raidGoal = function (t) {
        const s = this.raid;
        if (!s || s.stopped || s.over || this.raidMount) return !1;
        const i = s.center[0] + 0.5 - this.pos[0],
          e = s.center[2] + 0.5 - this.pos[2],
          o = Math.hypot(i, e);
        if (o < 12) return !1;
        const r = Math.min(1, 15 / o);
        return (
          (t.goal = [this.pos[0] + i * r, s.center[1], this.pos[2] + e * r]),
          (t.mod = 1),
          !0
        );
      }));
    const e = Game.prototype.saveWorld;
    Game.prototype.saveWorld = function (t) {
      return (
        this.worldMeta &&
          "play" === this.state &&
          (this.worldMeta.raids = (this.raids || [])
            .filter((t) => !t.stopped)
            .map((t) => t.save())),
        e.call(this, t)
      );
    };
    const o = Game.prototype.loadWorld;
    Game.prototype.loadWorld = async function (t) {
      this.raids = [];
      const s = await o.call(this, t),
        i = this.worldMeta;
      return (
        (this.raids = i && Array.isArray(i.raids) ? i.raids.map((t) => Raid.load(this, t)) : []),
        s
      );
    };
  })(),
  (Game.prototype.patrolTick = function () {
    if (
      this.net ||
      "overworld" !== this.dim ||
      0 === this.difficulty ||
      !this.rule("spawn_patrols")
    )
      return;
    if ((void 0 === this.patrolNext && (this.patrolNext = 12e3), --this.patrolNext > 0)) return;
    this.patrolNext += 12e3 + randInt(0, 1199);
    const t = Math.floor(this.worldTime / 24e3),
      s = ((this.worldTime % 24e3) + 24e3) % 24e3;
    if (t < 5 || s >= 12e3 || 0 !== randInt(0, 4)) return;
    const i = this.player,
      e = this.world;
    if (i.spectator || i.deathTime > 0) return;
    const o = i.pos.map(Math.floor);
    for (let t = -1; t <= 1; t++)
      for (let s = -1; s <= 1; s++) if (isVillage(this, o[0] + 16 * t, o[1], o[2] + 16 * s)) return;
    let r = o[0] + (24 + randInt(0, 23)) * (Math.random() < 0.5 ? -1 : 1),
      n = o[2] + (24 + randInt(0, 23)) * (Math.random() < 0.5 ? -1 : 1);
    if (!e.isLoaded(r - 10, n - 10) || !e.isLoaded(r + 10, n + 10)) return;
    const a = Math.ceil([0, 0.75, 1.5, 2.25][this.difficulty]) + 1;
    for (let t = 0; t < a; t++) {
      let s = HEIGHT - 1;
      for (; s > 0 && (!e.getBlock(r, s, n) || /leaves$/.test(BLOCKS[e.getBlock(r, s, n)].key));)
        s--;
      const i = BLOCKS[e.getBlock(r, s, n)];
      if (
        i &&
        i.solid &&
        !BLOCKS[e.getBlock(r, s + 1, n)].solid &&
        !BLOCKS[e.getBlock(r, s + 2, n)].solid &&
        (15 & e.getLight(r, s + 1, n)) <= 8
      ) {
        const i = createMob(this, "pillager", r + 0.5, s + 1, n + 0.5);
        i && (0 === t && (i.patrolLeader = !0), this.entities.push(i));
      } else if (0 === t) return;
      ((r += randInt(0, 4) - randInt(0, 4)), (n += randInt(0, 4) - randInt(0, 4)));
    }
  }),
  (() => {
    const t = Game.prototype.tick;
    Game.prototype.tick = function () {
      const s = t.call(this);
      return (
        this.net ||
          "play" !== this.state ||
          (this.ui.screen && this.ui.screen.pauses) ||
          this.guard("patrols", () => this.patrolTick()),
        s
      );
    };
    const s = VMob.prototype.saveData,
      i = VMob.prototype.loadData;
    s &&
      i &&
      ((VMob.prototype.saveData = function () {
        const t = s.call(this);
        return (this.patrolLeader && t && (t.pl = 1), t);
      }),
      (VMob.prototype.loadData = function (t) {
        (i.call(this, t), t && t.pl && (this.patrolLeader = !0));
      }));
  })());
//# sourceURL=js/raids.js
