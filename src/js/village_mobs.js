"use strict";
(Object.assign(MOB_TYPES, {
  villager: {
    cn: "村民",
    hp: 20,
    w: 0.6,
    h: 1.95,
    speed: 0.22,
    model: "villager",
    passive: !0,
    drops: [],
    scale: 0.9375,
  },
  zombie_villager: {
    cn: "僵尸村民",
    hp: 20,
    w: 0.6,
    h: 1.95,
    speed: 0.23,
    model: "zombie_villager",
    hostile: !0,
    attack: 3,
    armor: 2,
    burns: !0,
    drops: [["rotten_flesh", 0, 2]],
    scale: 0.9375,
  },
  iron_golem: {
    cn: "铁傀儡",
    hp: 100,
    w: 1.4,
    h: 2.7,
    speed: 0.2,
    model: "iron_golem",
    drops: [
      ["iron_ingot", 3, 5],
      ["poppy", 0, 2],
    ],
    scale: 1,
  },
  cat: {
    cn: "猫",
    hp: 10,
    w: 0.6,
    h: 0.7,
    speed: 0.3,
    model: "cat",
    passive: !0,
    food: "cod",
    drops: [["string", 0, 2]],
    scale: 0.8,
  },
}),
  (() => {
    const t = createMob;
    createMob = function (e, i, s, o, a) {
      return "villager" === i
        ? new Villager(e, s, o, a)
        : "iron_golem" === i
          ? new IronGolem(e, s, o, a)
          : "cat" === i
            ? new Cat(e, s, o, a)
            : t(e, i, s, o, a);
    };
  })());
const VILLAGER_TYPES = ["desert", "jungle", "plains", "savanna", "snow", "swamp", "taiga"],
  PROFESSIONS = [
    "armorer",
    "butcher",
    "cartographer",
    "cleric",
    "farmer",
    "fisherman",
    "fletcher",
    "leatherworker",
    "librarian",
    "mason",
    "nitwit",
    "shepherd",
    "toolsmith",
    "weaponsmith",
  ],
  PROFESSION_CN = {
    none: "村民",
    armorer: "盔甲匠",
    butcher: "屠夫",
    cartographer: "制图师",
    cleric: "牧师",
    farmer: "农民",
    fisherman: "渔夫",
    fletcher: "制箭师",
    leatherworker: "皮匠",
    librarian: "图书管理员",
    mason: "石匠",
    nitwit: "傻子",
    shepherd: "牧羊人",
    toolsmith: "工具匠",
    weaponsmith: "武器匠",
  };
function villagerTypeAt(t, e, i) {
  const s = t.vbiomeAt && t.vbiomeAt(Math.floor(e), Math.floor(i)),
    o = (s && s.name) || "plains";
  return /desert|badlands/.test(o)
    ? "desert"
    : /jungle|bamboo/.test(o)
      ? "jungle"
      : /savanna/.test(o)
        ? "savanna"
        : /snowy|frozen|ice|grove|jagged|frozen_peaks/.test(o)
          ? "snow"
          : /swamp|mangrove/.test(o)
            ? "swamp"
            : /taiga/.test(o)
              ? "taiga"
              : "plains";
}
const JOB_SITES = {
  composter: "farmer",
  smoker: "butcher",
  blast_furnace: "armorer",
  cartography_table: "cartographer",
  brewing_stand: "cleric",
  barrel: "fisherman",
  fletching_table: "fletcher",
  cauldron: "leatherworker",
  water_cauldron: "leatherworker",
  lava_cauldron: "leatherworker",
  powder_snow_cauldron: "leatherworker",
  lectern: "librarian",
  stonecutter: "mason",
  loom: "shepherd",
  smithing_table: "toolsmith",
  grindstone: "weaponsmith",
};
function villagerSkin(t, e, i, s) {
  const o = (e ? "zv_" : "v_") + i + "_" + s;
  if (t.entityTex[o]) return o;
  const a = t.images,
    r = a[e ? "zombie_villager" : "villager"];
  if (!r) return e ? "zombie" : "steve";
  const n = document.createElement("canvas");
  ((n.width = r.width), (n.height = r.height));
  const h = n.getContext("2d");
  h.drawImage(r, 0, 0);
  const l = a[(e ? "zvt_" : "vt_") + i];
  l && h.drawImage(l, 0, 0);
  const p = "none" !== s && a[(e ? "zvp_" : "vp_") + s];
  return (p && h.drawImage(p, 0, 0), (t.entityTex[o] = t.tex2D(n)), o);
}
const entityTexOf = (t, e) => (
  !t.entityTex[e] && t.images[e] && (t.entityTex[e] = t.tex2D(t.images[e])),
  e
);
class Villager extends Mob {
  constructor(t, e, i, s) {
    (super(t, "villager", e, i, s),
      (this.persistent = !0),
      (this.vtype = villagerTypeAt(t, e, s)),
      (this.profession =
        Math.random() < 0.6 ? PROFESSIONS[Math.floor(Math.random() * PROFESSIONS.length)] : "none"),
      (this.home = [e, i, s]),
      (this.shake = 0));
  }
  skin(t) {
    return villagerSkin(t, !1, this.vtype || "plains", this.profession || "none");
  }
  saveData() {
    return {
      t: this.vtype,
      p: this.profession,
      h: this.home,
      tr: this.trades,
      lv: this.vlevel,
      xp: this.vxp,
      rd: this.restockDay,
      j: this.job,
    };
  }
  loadData(t) {
    ((this.vtype = t.t || this.vtype),
      (this.profession = t.p || "none"),
      t.h && (this.home = t.h),
      t.tr && ((this.trades = t.tr), (this.vlevel = t.lv || 1), (this.vxp = t.xp || 0)),
      (this.restockDay = t.rd),
      (this.job = t.j));
  }
  tick() {
    const t = this.game;
    if (this.age % 10 == 0) {
      for (const e of t.entities)
        if (
          e instanceof Mob &&
          ("zombie" === e.type || "zombie_villager" === e.type) &&
          !e.dead &&
          e.distTo(this) < 8
        ) {
          this.panic = 60;
          break;
        }
      !this.panic &&
        !this.wander &&
        Math.hypot(this.pos[0] - this.home[0], this.pos[2] - this.home[2]) > 24 &&
        Math.random() < 0.2 &&
        ((this.wander = [this.home[0], this.home[1], this.home[2]]), (this.wanderT = 200));
    }
    if ((this.shake > 0 && this.shake--, !this.baby && this.age % 100 == 37)) {
      if (this.job && "none" !== this.profession) {
        const [t, e, i] = this.job.split(",").map(Number),
          s = BLOCKS[this.world.getBlock(t, e, i)];
        !this.world.isLoaded(t, i) ||
          (s && JOB_SITES[s.key] === this.profession) ||
          ((this.job = null),
          !this.vxp &&
            (this.vlevel || 1) <= 1 &&
            ((this.profession = "none"), (this.trades = null)));
      }
      "none" === this.profession
        ? this.findJob()
        : this.job ||
          "nitwit" === this.profession ||
          this.age % 400 != 37 ||
          this.findJob(this.profession);
    }
    super.tick();
  }
  findJob(t) {
    const e = this.game,
      i = this.world,
      s = new Set();
    for (const t of e.entities)
      t instanceof Villager && t !== this && !t.dead && t.job && s.add(t.job);
    for (const t of e.pendingMobs || [])
      "villager" !== t.type ||
        !t.x ||
        !t.x.j ||
        (null != t.health && t.health <= 0) ||
        s.add(t.x.j);
    const o = Math.floor(this.pos[0]),
      a = Math.floor(this.pos[1]),
      r = Math.floor(this.pos[2]);
    for (let n = 1; n <= 16; n++)
      for (let h = -n; h <= n; h++)
        for (let l = -n; l <= n; l++)
          if (Math.max(Math.abs(h), Math.abs(l)) === n)
            for (let n = -3; n <= 3; n++) {
              const p = BLOCKS[i.getBlock(o + h, a + n, r + l)],
                c = p && JOB_SITES[p.key],
                m = o + h + "," + (a + n) + "," + (r + l);
              if (!(!c || s.has(m) || (t && c !== t))) {
                if (((this.job = m), t)) return;
                ((this.profession = c), (this.trades = null));
                for (let t = 0; t < 6; t++)
                  e.particles.spawn(
                    "happy_villager",
                    this.pos[0] + (Math.random() - 0.5),
                    this.pos[1] + 1.5 + 0.5 * Math.random(),
                    this.pos[2] + (Math.random() - 0.5),
                    0,
                    0.05,
                    0,
                  );
                return;
              }
            }
  }
  interact(t) {
    return "undefined" == typeof MerchantScreen ||
      "none" === this.profession ||
      "nitwit" === this.profession ||
      this.baby
      ? ((this.shake = 40), Sound.ev("entity.villager.no", this.pos, 1, 1), !0)
      : (this.game.ui.open(new MerchantScreen(this.game, this)),
        Sound.ev("entity.villager.trade", this.pos, 1, 1),
        !0);
  }
  die(t) {
    const e = t && t.attacker,
      i = this.game.difficulty;
    if (
      e &&
      /^(zombie|zombie_villager|husk|drowned|zombified_piglin)$/.test(e.type) &&
      i >= 2 &&
      (3 === i || Math.random() < 0.5)
    ) {
      const e = createMob(this.game, "zombie_villager", this.pos[0], this.pos[1], this.pos[2]);
      return (
        (e.vtype = this.vtype),
        (e.profession = this.profession),
        (e.trades = this.trades),
        (e.vlevel = this.vlevel),
        (e.vxp = this.vxp),
        (e.yaw = this.yaw),
        (e.bodyYaw = this.bodyYaw),
        (e.headYaw = this.headYaw),
        this.baby && e.makeBaby(),
        this.customName && (e.customName = this.customName),
        (this.vxp || this.customName) && (e.persistent = !0),
        (this.dead = !0),
        Mob.modDeath && Mob.modDeath(this, t),
        this.game.addEntity(e),
        void Sound.ev("entity.zombie.infect", this.pos, 1, 1)
      );
    }
    super.die(t);
  }
  pose(t) {
    const e = 0.6662 * lerp(this.limbSwing - this.limbAmt, this.limbSwing, t),
      i = this.limbAmt,
      s = 1.4 * Math.cos(e) * i * 0.5,
      o = 1.4 * Math.cos(e + Math.PI) * i * 0.5,
      a = this.shake > 0 ? 0.3 * Math.sin(0.45 * (this.shake - t)) : 0;
    return { head: { ry: this.headYaw + a, rx: this.pitch }, rleg: { rx: s }, lleg: { rx: o } };
  }
}
class IronGolem extends Mob {
  constructor(t, e, i, s) {
    (super(t, "iron_golem", e, i, s),
      (this.persistent = !0),
      (this.attackAnim = 0),
      (this.noJump = !0),
      (this.stepHeight = 1));
  }
  skin(t) {
    const e = this.health / this.maxHealth,
      i = e < 0.25 ? "high" : e < 0.5 ? "medium" : e < 0.75 ? "low" : null;
    return (
      (i &&
        t.etexMix([
          "entity/iron_golem/iron_golem",
          "entity/iron_golem/iron_golem_crackiness_" + i,
        ])) ||
      entityTexOf(t, "iron_golem")
    );
  }
  tick() {
    const t = this.game;
    if (this.age % 20 == 0 && (!this.target || this.target.dead || this.target.deathTime > 0)) {
      this.target = null;
      let e = 16;
      for (const i of t.entities)
        if (
          i instanceof Mob &&
          i.T.hostile &&
          "creeper" !== i.type &&
          !i.dead &&
          0 === i.deathTime
        ) {
          const t = i.distTo(this);
          t < e && ((e = t), (this.target = i));
        }
    }
    const e = this.attackCd;
    if (
      ((this.T = this.target ? GOLEM_HUNT : MOB_TYPES.iron_golem),
      super.tick(),
      (this.T = MOB_TYPES.iron_golem),
      20 === this.attackCd && 20 !== e)
    ) {
      this.attackAnim = 10;
      const t = this.target;
      (t &&
        this.hitLanded &&
        t.vel &&
        (t.vel[1] += 0.4 * Math.max(0, 1 - ((t.T && t.T.kbRes) || 0))),
        Sound.ev("entity.iron_golem.attack", this.pos, 1, 1));
    }
    this.attackAnim > 0 && this.attackAnim--;
  }
  hurt(t, e) {
    e && e.knockFrom && (e = { ...e, knockFrom: null });
    const i = super.hurt(t, e);
    return (
      i && e && e.attacker && e.attacker !== this.game.player && (this.target = e.attacker),
      i
    );
  }
  pose(t) {
    const e = lerp(this.limbSwing - this.limbAmt, this.limbSwing, t),
      i = this.limbAmt,
      tri = (t, e) => (Math.abs((t % e) - 0.5 * e) - 0.25 * e) / (0.25 * e),
      s = { head: { ry: this.headYaw, rx: this.pitch } };
    if (
      ((s.rleg = { rx: -1.5 * tri(e, 13) * i }),
      (s.lleg = { rx: 1.5 * tri(e, 13) * i }),
      this.attackAnim > 0)
    ) {
      const e = (this.attackAnim - t) / 10,
        i = 2 - 4 * Math.abs(e - 0.5);
      ((s.rarm = { rx: i }), (s.larm = { rx: i }));
    } else
      ((s.rarm = { rx: (1.5 * tri(e, 13) - 0.2) * i }),
        (s.larm = { rx: (-0.2 - 1.5 * tri(e, 13)) * i }));
    return s;
  }
}
const GOLEM_HUNT = Object.assign({}, MOB_TYPES.iron_golem, { attack: 10, speed: 0.25 }),
  CAT_VARIANTS = [
    "tabby",
    "black",
    "red",
    "siamese",
    "british_shorthair",
    "calico",
    "persian",
    "ragdoll",
    "white",
    "jellie",
    "all_black",
  ];
class Cat extends Mob {
  constructor(t, e, i, s) {
    (super(t, "cat", e, i, s),
      (this.variant = CAT_VARIANTS[Math.floor(Math.random() * CAT_VARIANTS.length)]),
      (this.persistent = !0));
  }
  skin(t) {
    return (
      (this.owner &&
        t.etexMix([
          "entity/cat/cat_" + this.variant,
          { p: "entity/cat/cat_collar", c: dyeRGB(this.collar || "red") },
        ])) ||
      entityTexOf(t, "cat_" + this.variant)
    );
  }
  saveData() {
    return {
      v: this.variant,
      own: this.owner ? 1 : 0,
      sit: this.sitting ? 1 : 0,
      col: this.collar,
    };
  }
  loadData(t) {
    (t.v && (this.variant = t.v),
      t.own && (this.owner = this.game.player),
      (this.sitting = !!t.sit),
      t.col && (this.collar = t.col));
  }
  interact(t, e) {
    const i = this.game,
      s = e && ITEMS[e.id] && ITEMS[e.id].key,
      o = "cod" === s || "salmon" === s;
    if (Mob.prototype.interact && Mob.prototype.interact.call(this, t, e)) return !0;
    if (!this.owner)
      return (
        !!o &&
        (useOne(i, t),
        Sound.ev("entity.cat.eat", this.pos, 1, 1),
        tryTame(this, t, 1 / 3),
        this.owner && (this.sitT = void 0),
        !0)
      );
    if (this.owner !== t) return !1;
    if (s && /_dye$/.test(s))
      return this.collar !== s.slice(0, -4) && ((this.collar = s.slice(0, -4)), useOne(i, t), !0);
    if (o && this.health < this.maxHealth)
      return (
        (this.health = Math.min(this.maxHealth, this.health + 2)),
        useOne(i, t),
        Sound.ev("entity.cat.eat", this.pos, 1, 1),
        !0
      );
    if (o && !this.baby && !this.loveT) {
      ((this.loveT = 600), useOne(i, t), Sound.ev("entity.cat.eat", this.pos, 1, 1));
      const e = i.entities.find(
        (t) =>
          t !== this &&
          t instanceof Cat &&
          t.owner &&
          t.loveT > 0 &&
          !t.baby &&
          !t.dead &&
          t.distTo(this) < 8,
      );
      if (e) {
        this.loveT = e.loveT = 0;
        const t = createMob(
          i,
          "cat",
          (this.pos[0] + e.pos[0]) / 2,
          this.pos[1],
          (this.pos[2] + e.pos[2]) / 2,
        ).makeBaby();
        ((t.variant = Math.random() < 0.5 ? this.variant : e.variant),
          (t.owner = this.owner),
          i.entities.push(t),
          i.dropXp(t.pos[0], t.pos[1] + 0.5, t.pos[2], 1 + ((7 * Math.random()) | 0)));
      }
      return !0;
    }
    return !o && ((this.sitting = !this.sitting), (this.sitT = void 0), (this.wander = null), !0);
  }
  hurt(t, e) {
    const i = super.hurt(t, e);
    return (i && (this.sitting = !1), i);
  }
  tick() {
    if (
      (this.sitting
        ? (this.sitT = 2)
        : !this.panic &&
          void 0 === this.sitT &&
          !this.owner &&
          Math.random() < 0.002 &&
          (this.sitT = 200 + 400 * Math.random()),
      void 0 !== this.sitT)
    )
      --this.sitT <= 0 || this.panic ? (this.sitT = void 0) : (this.wander = null);
    else if (this.owner && this.age % 10 == 0) {
      const t = {};
      PetMixin.followOwner.call(this, t) && t.goal && ((this.wander = t.goal), (this.wanderT = 20));
    }
    const t = this.T;
    (void 0 !== this.sitT && (this.T = Cat.SIT_T || (Cat.SIT_T = { ...t, speed: 0 })),
      super.tick(),
      (this.T = t));
  }
  pose(t) {
    const e = 0.6662 * lerp(this.limbSwing - this.limbAmt, this.limbSwing, t),
      i = this.limbAmt,
      s = Math.cos(e) * i,
      o = Math.cos(e + Math.PI) * i,
      a = {
        head: { ry: this.headYaw, rx: this.pitch },
        lfleg: { rx: s },
        rfleg: { rx: o },
        lhleg: { rx: o },
        rhleg: { rx: s },
      };
    if (void 0 !== this.sitT) {
      const t = 1 / 16;
      ((a.body = { rx: Math.PI / 4, t: [0, 4 * t, 5 * t] }),
        (a.head.t = [0, 3.3 * t, 1 * t]),
        (a.lhleg = { rx: Math.PI / 2, t: [0, -3 * t, -4 * t] }),
        (a.rhleg = { rx: Math.PI / 2, t: [0, -3 * t, -4 * t] }),
        (a.lfleg = { rx: Math.PI / 20, t: [0, -2 * t, -2 * t] }),
        (a.rfleg = { rx: Math.PI / 20, t: [0, -2 * t, -2 * t] }),
        (a.tail1 = { rx: -0.8278761, t: [0, -8 * t, -2 * t] }),
        (a.tail2 = { rx: 1.7 - 2.670354, t: [0, -2 * t, -0.8 * t] }));
    }
    return a;
  }
}
((() => {
  const t = createMob;
  createMob = function (e, i, s, o, a) {
    if ("zombie_villager" === i) {
      const t = new Mob(e, "zombie_villager", s, o, a);
      return (
        (t.vtype = villagerTypeAt(e, s, a)),
        (t.profession = "none"),
        (t.skin = (e) => villagerSkin(e, !0, t.vtype || "plains", t.profession || "none")),
        (t.saveData = function () {
          const t = (Mob.prototype.saveData && Mob.prototype.saveData.call(this)) || {};
          return (
            (t.t = this.vtype),
            (t.p = this.profession),
            this.trades && ((t.tr = this.trades), (t.lv = this.vlevel), (t.xp = this.vxp)),
            this.customName && (t.name = this.customName),
            t
          );
        }),
        (t.makeBaby = function () {
          return (Mob.prototype.makeBaby.call(this), (this.growT = 1e12), this);
        }),
        (t.tick = function () {
          return (this.baby && (this.growT = 1e12), Mob.prototype.tick.call(this));
        }),
        (t.loadData = function (t) {
          (Mob.prototype.loadData && Mob.prototype.loadData.call(this, t),
            t &&
              (t.t && (this.vtype = t.t),
              t.p && (this.profession = t.p),
              t.tr && ((this.trades = t.tr), (this.vlevel = t.lv || 1), (this.vxp = t.xp || 0)),
              t.name && (this.customName = t.name)));
        }),
        (t.pose = (e) => {
          const i = 0.6662 * lerp(t.limbSwing - t.limbAmt, t.limbSwing, e),
            s = t.limbAmt,
            o = Math.PI / 2 + 0.05 * Math.sin(0.067 * t.age);
          return {
            head: { ry: t.headYaw, rx: t.pitch },
            rarm: { rx: o + (t.swingT > 0 ? 0.6 * Math.sin((t.swingT / 6) * Math.PI) : 0) },
            larm: { rx: o },
            rleg: { rx: 1.4 * Math.cos(i) * s },
            lleg: { rx: 1.4 * Math.cos(i + Math.PI) * s },
          };
        }),
        t
      );
    }
    return t(e, i, s, o, a);
  };
})(),
  (() => {
    const t = Renderer.prototype.initModels2;
    Renderer.prototype.initModels2 = function () {
      t.call(this);
      const e = this.models,
        P = (t, e, i) => {
          for (const s of i) s.mesh = this.makeModelPart(s.boxes, t, e);
          return { parts: i };
        },
        i = [
          { name: "head", pivot: [0, 24, 0], boxes: [[0, 0, -4, 0, -4, 8, 10, 8]] },
          {
            name: "hat",
            parent: "head",
            pivot: [0, 0, 0],
            boxes: [[32, 0, -4, 0, -4, 8, 10, 8, 0.51]],
          },
          {
            name: "hat_rim",
            parent: "hat",
            pivot: [0, 0, 0],
            rotX: Math.PI / 2,
            boxes: [[30, 47, -8, -8, -6, 16, 16, 1]],
          },
          { name: "nose", parent: "head", pivot: [0, 2, 0], boxes: [[24, 0, -1, -3, -6, 2, 4, 2]] },
          { name: "body", pivot: [0, 24, 0], boxes: [[16, 20, -4, -12, -3, 8, 12, 6]] },
          {
            name: "jacket",
            parent: "body",
            pivot: [0, 0, 0],
            boxes: [[0, 38, -4, -20, -3, 8, 20, 6, 0.5]],
          },
          { name: "rleg", pivot: [2, 12, 0], boxes: [[0, 22, -2, -12, -2, 4, 12, 4]] },
          { name: "lleg", pivot: [-2, 12, 0], boxes: [[0, 22, -2, -12, -2, 4, 12, 4, 0, !0]] },
        ];
      ((e.villager = P(64, 64, [
        ...i,
        {
          name: "arms",
          pivot: [0, 21, -1],
          rotX: 0.75,
          boxes: [
            [44, 22, 4, -6, -2, 4, 8, 4],
            [44, 22, -8, -6, -2, 4, 8, 4, 0, !0],
            [40, 38, -4, -6, -2, 8, 4, 4],
          ],
        },
      ])),
        (e.zombie_villager = P(64, 64, [
          ...i.map((t) => ({ ...t, boxes: t.boxes.map((t) => t.slice()) })),
          { name: "rarm", pivot: [5, 22, 0], boxes: [[44, 22, -1, -10, -2, 4, 12, 4]] },
          { name: "larm", pivot: [-5, 22, 0], boxes: [[44, 22, -3, -10, -2, 4, 12, 4, 0, !0]] },
        ])),
        (e.iron_golem = P(128, 128, [
          {
            name: "head",
            pivot: [0, 31, -2],
            boxes: [
              [0, 0, -4, 2, -5.5, 8, 10, 8],
              [24, 0, -1, 1, -7.5, 2, 4, 2],
            ],
          },
          {
            name: "body",
            pivot: [0, 31, 0],
            boxes: [
              [0, 40, -9, -10, -6, 18, 12, 11],
              [0, 70, -4.5, -15, -3, 9, 5, 6, 0.5],
            ],
          },
          { name: "rarm", pivot: [0, 31, 0], boxes: [[60, 21, 9, -27.5, -3, 4, 30, 6]] },
          { name: "larm", pivot: [0, 31, 0], boxes: [[60, 58, -13, -27.5, -3, 4, 30, 6]] },
          { name: "rleg", pivot: [4, 13, 0], boxes: [[37, 0, -2.5, -13, -3, 6, 16, 5]] },
          { name: "lleg", pivot: [-5, 13, 0], boxes: [[60, 0, -2.5, -13, -3, 6, 16, 5, 0, !0]] },
        ])),
        (e.cat = P(64, 32, [
          {
            name: "head",
            pivot: [0, 9, -9],
            boxes: [
              [0, 0, -2.5, -2, -3, 5, 4, 5],
              [0, 24, -1.5, -1.999, -4, 3, 2, 2],
              [0, 10, 1, 2, 0, 1, 1, 2],
              [6, 10, -2, 2, 0, 1, 1, 2],
            ],
          },
          {
            name: "body",
            pivot: [0, 12, -10],
            rotX: -Math.PI / 2,
            boxes: [[20, 0, -2, -19, -8, 4, 16, 6]],
          },
          { name: "tail1", pivot: [0, 9, 8], rotX: -0.9, boxes: [[0, 15, -0.5, -8, 0, 1, 8, 1]] },
          { name: "tail2", pivot: [0, 4, 14], rotX: -1.7, boxes: [[4, 15, -0.5, -8, 0, 1, 8, 1]] },
          { name: "lhleg", pivot: [-1.1, 6, 5], boxes: [[8, 13, -1, -6, 1, 2, 6, 2]] },
          { name: "rhleg", pivot: [1.1, 6, 5], boxes: [[8, 13, -1, -6, 1, 2, 6, 2]] },
          { name: "lfleg", pivot: [-1.2, 9.9, -5], boxes: [[40, 0, -1, -10, 0, 2, 10, 2]] },
          { name: "rfleg", pivot: [1.2, 9.9, -5], boxes: [[40, 0, -1, -10, 0, 2, 10, 2]] },
        ])));
    };
  })());
for (const [t, e] of [
  ["villager", "村民"],
  ["zombie_villager", "僵尸村民"],
  ["iron_golem", "铁傀儡"],
  ["cat", "猫"],
])
  defItem(t + "_spawn_egg", e + "刷怪蛋", { spawnEgg: t });
//# sourceURL=js/village_mobs.js
