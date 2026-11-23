"use strict";
const biomeName = (t, s, e) => {
    const i = t.vbiomeAt && t.vbiomeAt(Math.floor(s), Math.floor(e));
    return (i && i.name) || "plains";
  },
  lerpRot = (t, s, e) => t + angDelta(s, t) * e,
  HORSE_COLORS = ["white", "creamy", "chestnut", "brown", "black", "gray", "darkbrown"],
  HORSE_MARKS = [null, "white", "whitefield", "whitedots", "blackdots"],
  HORSE_ARMOR = {
    leather_horse_armor: ["leather", 3],
    copper_horse_armor: ["copper", 4],
    iron_horse_armor: ["iron", 5],
    golden_horse_armor: ["gold", 7],
    diamond_horse_armor: ["diamond", 11],
    netherite_horse_armor: ["netherite", 19],
  };
class Horse extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a),
      (this.tame = !1),
      (this.temper = 0),
      (this.saddled = !1),
      (this.armorItem = null),
      (this.chest = !1),
      (this.chestInv = null),
      (this.eatT = 0),
      (this.rearT = 0),
      (this.mouthT = 0),
      (this.tailT = 0),
      (this.jumpCharge = 0),
      (this.jumping = !1),
      "horse" === s
        ? ((this.variant = randInt(0, 6) + 8 * randInt(0, 4)),
          (this.maxHealth = this.health = 15 + randInt(0, 8) + randInt(0, 9)),
          (this.spd =
            0.25 * (0.45 + 0.3 * Math.random() + 0.3 * Math.random() + 0.3 * Math.random())),
          (this.jumpStr = 0.4 + 0.2 * Math.random() + 0.2 * Math.random() + 0.2 * Math.random()))
        : "donkey" === s || "mule" === s
          ? ((this.spd = 0.175),
            (this.jumpStr = 0.5),
            (this.maxHealth = this.health = randInt(15, 30)))
          : ((this.spd = 0.2),
            (this.jumpStr = 0.4 + 0.6 * Math.random()),
            "skeleton_horse" === s && (this.tame = !0)));
  }
  extraSave() {
    return {
      tame: this.tame,
      temper: this.temper,
      sad: this.saddled,
      arm: this.armorItem,
      ch: this.chest,
      inv: this.chestInv,
      spd: this.spd,
      js: this.jumpStr,
      mh: this.maxHealth,
    };
  }
  extraLoad(t) {
    ((this.tame = t.tame),
      (this.temper = t.temper || 0),
      (this.saddled = t.sad),
      (this.armorItem = t.arm || null),
      (this.chest = !!t.ch),
      (this.chestInv = t.inv || null),
      t.spd && (this.spd = t.spd),
      t.js && (this.jumpStr = t.js),
      t.mh && (this.maxHealth = t.mh),
      this.tame && (this.persistent = !0));
  }
  get undead() {
    return "skeleton_horse" === this.type || "zombie_horse" === this.type;
  }
  canBreed() {
    return this.tame && !this.undead;
  }
  seat() {
    return [
      this.pos[0],
      this.pos[1] + (this.baby ? 0.5 : 1.1) - ("donkey" === this.type ? 0.2 : 0),
      this.pos[2],
    ];
  }
  dropsOnDeath() {
    return [this.armorItem, this.chest ? makeStack("chest", 1) : null, ...(this.chestInv || [])];
  }
  hurt(t, s) {
    this.armorItem &&
      HORSE_ARMOR[ITEMS[this.armorItem.id].key] &&
      (t *= 1 - HORSE_ARMOR[ITEMS[this.armorItem.id].key][1] / 25);
    const e = super.hurt(t, s);
    return (e && !this.rider && (this.rearT = 20), e);
  }
  preInteract(t, s) {
    const e = this.game,
      i = s && ITEMS[s.id].key;
    if (this.baby && !this.undead && s && isFood("horse_food", s.id)) return !1;
    if (t.sneaking && this.tame) return (e.ui.open(new HorseScreen(e, this)), !0);
    if ("saddle" === i && this.tame && !this.saddled && !this.baby)
      return (
        (this.saddled = !0),
        useOne(e, t),
        Sound.ev("entity.horse.saddle", this.pos, 0.5, 1),
        !0
      );
    if (i && HORSE_ARMOR[i] && "horse" === this.type && this.tame && !this.armorItem && !this.baby)
      return (
        (this.armorItem = { ...s, count: 1 }),
        useOne(e, t),
        Sound.ev("entity.horse.armor", this.pos, 0.5, 1),
        !0
      );
    if (
      "chest" === i &&
      ("donkey" === this.type || "mule" === this.type) &&
      this.tame &&
      !this.chest &&
      !this.baby
    )
      return (
        (this.chest = !0),
        (this.chestInv = new Array(15).fill(null)),
        useOne(e, t),
        Sound.ev("entity.donkey.chest", this.pos, 1, 1),
        !0
      );
    if (s && isFood("zombie_horse" === this.type ? "zombie_horse_food" : "horse_food", s.id)) {
      const s =
          {
            sugar: 1,
            wheat: 2,
            apple: 3,
            carrot: 3,
            golden_carrot: 4,
            golden_apple: 10,
            enchanted_golden_apple: 10,
            hay_block: 20,
            red_mushroom: 2,
          }[i] || 2,
        a =
          {
            sugar: 3,
            wheat: 3,
            apple: 3,
            carrot: 3,
            golden_carrot: 5,
            golden_apple: 10,
            enchanted_golden_apple: 10,
          }[i] || 0;
      let o = !1;
      return (
        this.health < this.maxHealth &&
          ((this.health = Math.min(this.maxHealth, this.health + s)), (o = !0)),
        !this.tame &&
          a &&
          this.temper < 100 &&
          ((this.temper = Math.min(100, this.temper + a)), (o = !0)),
        this.tame &&
          ("golden_carrot" === i || "golden_apple" === i || "enchanted_golden_apple" === i) &&
          this.breedCd <= 0 &&
          !this.loveT &&
          !this.undead &&
          ((this.loveT = 600), (o = !0)),
        !!o && (useOne(e, t), this.sound("eat"), (this.eatT = 20), (this.mouthT = 10), !0)
      );
    }
    return (
      !(this.baby || t.vehicle || (s && ITEMS[s.id].spawnEgg)) &&
      (t.mount(this), (t.yaw = this.yaw), !0)
    );
  }
  ridden(t, s) {
    const e = this.rider;
    if (!this.tame) {
      if (this.age % 10 == 0 && Math.random() < 0.15)
        if (100 * Math.random() < this.temper) {
          ((this.tame = !0), (this.persistent = !0), (this.owner = e));
          for (let t = 0; t < 7; t++)
            this.game.particles.spawn(
              "heart",
              this.pos[0] + (Math.random() - 0.5),
              this.pos[1] + this.h,
              this.pos[2] + (Math.random() - 0.5),
              0,
              0.02,
              0,
            );
        } else
          ((this.temper = Math.min(100, this.temper + 5)),
            e.dismount(),
            (this.rearT = 20),
            this.sound("angry"));
      return ((t.fwd = 0), void (this.limbAmt *= 0.9));
    }
    if (this.saddled)
      if (
        ((this.yaw = e.yaw),
        (this.bodyYaw = e.yaw),
        (this.headYaw = 0),
        (this.pitch = 0.5 * e.pitch),
        (t.fwd = s.fwd > 0 ? 1 : s.fwd < 0 ? -0.25 : 0),
        (t.strafe = 0.5 * (s.strafe || 0)),
        (this.riderSpeed = this.spd),
        s.jump && this.onGround)
      )
        ((this.jumpCharge = Math.min(1, this.jumpCharge + 0.1)), (this.chargingJump = !0));
      else if (this.chargingJump) {
        if (((this.chargingJump = !1), this.onGround && this.jumpCharge > 0)) {
          const s = this.jumpCharge >= 0.9 ? 1 : 0.4 + (0.4 * this.jumpCharge) / 0.9;
          ((this.vel[1] = this.jumpStr * s),
            (this.vel[0] += 0.4 * -Math.sin(this.yaw) * s * (t.fwd > 0 ? 1 : 0)),
            (this.vel[2] += 0.4 * -Math.cos(this.yaw) * s * (t.fwd > 0 ? 1 : 0)),
            this.sound("jump", 0.4),
            (this.mouthT = 10));
        }
        this.jumpCharge = 0;
      }
  }
  moveBy(t) {
    this.rider && this.tame && this.saddled
      ? this.travel(t.fwd, t.strafe, this.spd * this.spd * 4.6, !1)
      : super.moveBy(t);
  }
  afterMove() {
    (this.eatT > 0 && this.eatT--,
      this.rearT > 0 && this.rearT--,
      this.mouthT > 0 && this.mouthT--,
      !this.rider &&
        !this.target &&
        this.onGround &&
        0 === this.ctl.fwd &&
        Math.random() < 0.002 &&
        (this.eatT = 40));
  }
  get T2() {
    return this.T;
  }
  setupAnim(t, s) {
    horseAnim(t, this, s);
  }
  texKey(t) {
    if ("horse" !== this.type)
      return t.etex(
        "entity/horse/" +
          {
            donkey: "donkey",
            mule: "mule",
            skeleton_horse: "horse_skeleton",
            zombie_horse: "horse_zombie",
          }[this.type] +
          (this.baby ? "_baby" : ""),
      );
    const s = this.baby ? "_baby" : "",
      e = HORSE_COLORS[7 & this.variant] || "white",
      i = HORSE_MARKS[this.variant >> 3];
    return i
      ? t.etexMix(["entity/horse/horse_" + e + s, "entity/horse/horse_markings_" + i + s])
      : t.etex("entity/horse/horse_" + e + s);
  }
  drawLayers(t, s, e, i, a, o, h, r) {
    if (this.armorItem && !this.baby) {
      const t = EM.get(s, this.undead ? "undead_horse_armor#main" : "horse_armor#main"),
        a = HORSE_ARMOR[ITEMS[this.armorItem.id].key];
      if (t && a) {
        (EM.reset(t), EM.copy(e, t));
        const n = s.etex("entity/equipment/horse_body/" + a[0]);
        (s.drawEM(t, n, i, h, o, {
          overlay: r,
          tint:
            "leather" === a[0] ? dyeTintOf(this.armorItem, [160 / 255, 101 / 255, 64 / 255]) : null,
        }),
          "leather" === a[0] &&
            s.drawEM(t, s.etex("entity/equipment/horse_body/leather_overlay"), i, h, o, {
              overlay: r,
            }));
      }
    }
    if (this.saddled && !this.baby) {
      const t = EM.get(s, this.type + "#saddle");
      if (t) {
        (EM.reset(t), EM.copy(e, t));
        const a = !!this.rider;
        for (const s of ["left_saddle_line", "right_saddle_line"])
          t.parts[s] && (t.parts[s].visible = a);
        s.drawEM(t, s.etex("entity/equipment/" + this.type + "_saddle/saddle"), i, h, o, {
          overlay: r,
        });
      }
    }
  }
}
function dyeTintOf(t, s) {
  return t && null != t.color
    ? [((t.color >> 16) & 255) / 255, ((t.color >> 8) & 255) / 255, (255 & t.color) / 255]
    : s;
}
function horseAnim(t, s, e) {
  const i = t.parts,
    [a, o] = emLimbs(s, e),
    h = s.age + e,
    r = s.eatT > 0 ? Math.min(1, (40 - s.eatT + e) / 6, s.eatT / 6) : 0,
    n = s.rearT > 0 ? Math.sin(Math.min(1, (20 - s.rearT + e) / 20) * Math.PI) : 0,
    l = t.key.includes("_baby"),
    d = /^(donkey|mule)/.test(t.key),
    p = l ? 0.5 : 1,
    c =
      l && d
        ? { stand: Math.PI / 3, legY: 1, legZ: 0.5, legX: 0, tail: -Math.PI / 4 }
        : l
          ? { stand: Math.PI / 12, legY: 4, legZ: 0, legX: -Math.PI / 3, tail: -Math.PI / 2 }
          : { stand: Math.PI / 12, legY: 12, legZ: 4, legX: -Math.PI / 3, tail: 0 },
    m = n,
    u = 1 - m,
    g = s.mouthT > 0 ? 1 : 0,
    y = 1 - Math.max(m, r),
    f = clamp(-(s.headYaw || 0), -Math.PI / 9, Math.PI / 9);
  let _ = -(s.pitch || 0);
  o > 0.2 && (_ += 0.15 * Math.cos(0.8 * a) * o);
  const b = i.head_parts;
  if (b) {
    if (l && d) {
      const t = -Math.PI / 6;
      b.xRot =
        m * (Math.PI / 12 + t) +
        r * (Math.PI / 2 + 0.05 * Math.sin(h)) +
        y * (Math.PI / 6 + t + g * Math.sin(h) * 0.05);
    } else
      b.xRot =
        m * (Math.PI / 12 + _) +
        r * (2.1816616 + 0.05 * Math.sin(h)) +
        y * (Math.PI / 6 + _ + g * Math.sin(h) * 0.05);
    ((b.yRot = m * f + y * f),
      l && d
        ? ((b.y = lerp(b.y, -1.2, r)), (b.z = lerp(b.z, -3.6, m)))
        : ((b.y += lerp(lerp(0, l ? -2 : -8, m), l ? 2 : 7, r)), (b.z = lerp(b.z, -4, m))));
  }
  i.body && (i.body.xRot = m * (-Math.PI / 4) + u * i.body.xRot);
  const M = i.left_front_leg,
    w = i.right_front_leg,
    v = i.left_hind_leg,
    k = i.right_hind_leg;
  M && ((M.y -= c.legY * m), (M.z += c.legZ * m), w && ((w.y = M.y), (w.z = M.z)));
  const T = Math.cos((s.inWater ? 0.2 : 1) * a * 0.6662 + Math.PI),
    x = 0.8 * T * o,
    I = Math.cos(0.6 * h + Math.PI);
  (v && (v.xRot = c.stand * m - 0.5 * T * o * u),
    k && (k.xRot = c.stand * m + 0.5 * T * o * u),
    M && (M.xRot = (c.legX + I) * m + x * u),
    w && (w.xRot = (c.legX - I) * m - x * u),
    l && d && v && k && ((v.y = lerp(v.y, -0.3, m)), (k.y = lerp(v.y, -0.3, m))),
    i.tail &&
      ((i.tail.xRot = c.tail + Math.PI / 6 + 0.75 * o),
      (i.tail.y += o * p),
      (i.tail.z += 2 * o * p),
      (i.tail.yRot = s.tailT > 0 ? Math.cos(0.7 * h) : 0)),
    i.upper_mouth && s.mouthT > 0 && (i.upper_mouth.xRot = -0.2),
    i.left_chest && (i.left_chest.visible = !!s.chest),
    i.right_chest && (i.right_chest.visible = !!s.chest));
}
for (const t of ["horse", "donkey", "mule", "skeleton_horse", "zombie_horse"])
  defVMob(t, {
    cls: Horse,
    food: "zombie_horse" === t ? "zombie_horse_food" : "horse_food",
    babyTempt: !0,
    xp: 2,
    T: { hostile: !1, passive: !0 },
    sounds: "horse" === t ? { ambient: "entity.horse.ambient" } : null,
    shadowR: 0.75,
  });
class HorseScreen extends ContainerScreen {
  constructor(t, s) {
    (super(t, "gui_horse", 176, 166, s.customName || s.T.cn), (this.h = s));
    const e = s instanceof Llama;
    if (
      (e ||
        this.slots.push({
          x: 8,
          y: 18,
          group: "container",
          max: 1,
          emptyIcon: "slot_saddle",
          accept: (t) => "saddle" === ITEMS[t.id].key,
          get: () => (s.saddled ? makeStack("saddle", 1) : null),
          set: (t) => {
            s.saddled = !!t;
          },
        }),
      "horse" === s.type &&
        this.slots.push({
          x: 8,
          y: 36,
          group: "container",
          max: 1,
          emptyIcon: "slot_horse_armor",
          accept: (t) => !!HORSE_ARMOR[ITEMS[t.id].key],
          get: () => s.armorItem,
          set: (t) => {
            s.armorItem = t;
          },
        }),
      e &&
        this.slots.push({
          x: 8,
          y: 36,
          group: "container",
          max: 1,
          emptyIcon: "slot_llama_armor",
          accept: (t) => /_carpet$/.test(ITEMS[t.id].key),
          get: () => s.carpet,
          set: (t) => {
            s.carpet = t;
          },
        }),
      (this.cols = e ? s.strength : 5),
      s.chest)
    )
      for (let t = 0; t < s.chestInv.length; t++)
        this.slots.push({
          x: 80 + (t % this.cols) * 18,
          y: 18 + 18 * Math.floor(t / this.cols),
          group: "container",
          get: () => s.chestInv[t],
          set: (e) => {
            s.chestInv[t] = e;
          },
        });
    this.addPlayerSlots(84, 142);
  }
  changed() {}
  stillValid() {
    (this.h.dead || this.h.distTo(this.game.player) > 8) && this.game.ui.close();
  }
  drawExtra(t) {
    (Font.draw(t.ctx, "物品栏", this.x + 8, this.y + 72, "#404040", !1),
      this.h.chest &&
        t.ctx.drawImage(
          t.img.horse_chest_slots,
          0,
          0,
          18 * this.cols,
          54,
          this.x + 79,
          this.y + 17,
          18 * this.cols,
          54,
        ));
    for (const s of this.slots)
      "container" === s.group &&
        s.emptyIcon &&
        t.sprite("slot_frame", this.x + s.x - 1, this.y + s.y - 1);
    const s = this.game.renderer.mobPreview(this.game, this.h, t, this.x + 26, this.y + 18, 52, 52);
    s && t.ctx.drawImage(s, this.x + 26, this.y + 18, 52, 52);
  }
}
class Camel extends Horse {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a),
      (this.tame = !0),
      (this.spd = 0.14),
      (this.jumpStr = 0.42),
      (this.sit = !1),
      (this.sitT = 0),
      (this.dashCd = 0),
      (this.maxHealth = this.health = this.T.hp));
  }
  extraSave() {
    return { ...super.extraSave(), sit: this.sit };
  }
  extraLoad(t) {
    (super.extraLoad(t), (this.sit = !!t.sit));
  }
  seat() {
    return [
      this.pos[0],
      this.pos[1] + (this.sit ? 0.6 : 1.85) * (this.baby ? 0.5 : 1),
      this.pos[2],
    ];
  }
  preInteract(t, s) {
    const e = this.game,
      i = s && ITEMS[s.id].key;
    return (
      (!s || !isFood(this.D.food, s.id)) &&
      ("saddle" !== i || this.saddled || this.baby
        ? t.sneaking
          ? (e.ui.open(new HorseScreen(e, this)), !0)
          : !(this.baby || t.vehicle || (s && ITEMS[s.id].spawnEgg)) &&
            (this.sit && this.standUp(), t.mount(this), (t.yaw = this.yaw), !0)
        : ((this.saddled = !0), useOne(e, t), this.sound("saddle", 0.5, 1), !0))
    );
  }
  sitDown() {
    this.sit ||
      ((this.sit = !0),
      (this.anims = { CAMEL_SIT: this.age }),
      (this.sitT = 40),
      this.sound("sit"));
  }
  standUp() {
    this.sit &&
      ((this.sit = !1),
      (this.anims = { CAMEL_STANDUP: this.age }),
      (this.sitT = 52),
      this.sound("stand"));
  }
  endDash() {
    null != this.anims.CAMEL_DASH &&
      this.onGround &&
      this.age - this.anims.CAMEL_DASH >= 5 &&
      delete this.anims.CAMEL_DASH;
  }
  think(t) {
    (this.endDash(),
      this.sitT > 0
        ? this.sitT--
        : this.sit
          ? (this.panic > 0 || Math.random() < 5e-4) && this.standUp()
          : !this.target && this.panic <= 0 && !this.loveT && Math.random() < 1 / 3e3
            ? this.sitDown()
            : VMob.prototype.think.call(this, t));
  }
  ridden(t, s) {
    if ((this.endDash(), this.sitT > 0)) return void this.sitT--;
    if (this.sit) return void ((s.fwd || s.jump) && this.standUp());
    if (!this.saddled) return;
    const e = this.rider;
    ((this.yaw = e.yaw),
      (this.bodyYaw = e.yaw),
      (this.headYaw = 0),
      (t.fwd = s.fwd > 0 ? (s.sprint ? 1.6 : 1) : s.fwd < 0 ? -0.3 : 0),
      this.dashCd > 0 && (this.dashCd--, 0 === this.dashCd && this.sound("dash_ready")),
      s.jump &&
        this.onGround &&
        this.dashCd <= 0 &&
        t.fwd > 0 &&
        ((this.vel[0] += 1.2 * -Math.sin(this.yaw)),
        (this.vel[2] += 1.2 * -Math.cos(this.yaw)),
        (this.vel[1] = 0.6),
        (this.dashCd = 55),
        (this.anims.CAMEL_DASH = this.age),
        this.sound("dash")));
  }
  moveBy(t) {
    this.rider && this.saddled
      ? !this.sit && this.sitT <= 0
        ? this.travel(t.fwd, 0, this.spd * this.spd * 4.6, !1)
        : this.travel(0, 0, 0, !1)
      : this.sit || this.sitT > 0
        ? this.travel(0, 0, 0, !1)
        : VMob.prototype.moveBy.call(this, t);
  }
  hurt(t, s) {
    const e = super.hurt(t, s);
    return (e && this.sit && this.standUp(), e);
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, a] = emLimbs(this, s),
      o = this.baby ? "CamelBabyAnimation.CAMEL_BABY_" : "CamelAnimation.CAMEL_";
    (e.head &&
      ((e.head.yRot = clamp(-(this.headYaw || 0), -0.52, 0.52)),
      (e.head.xRot = clamp(-(this.pitch || 0), -0.44, 0.44))),
      !this.sit && this.sitT <= 0 && EM.walk(t, o + "WALK", i, a, 2, 2.5));
    for (const e in this.anims)
      ("CAMEL_SIT" === e
        ? this.sit && this.sitT > 0
        : "CAMEL_STANDUP" !== e || (!this.sit && this.sitT > 0)) &&
        EM.anim(t, o + e.slice(6), (this.age - this.anims[e] + s) / 20);
    (this.sit && this.sitT <= 0 && EM.anim(t, o + "SIT_POSE", 0),
      !this.sit && this.sitT <= 0 && a < 0.05 && EM.anim(t, o + "IDLE", (this.age + s) / 20));
  }
  texKey(t) {
    return t.etex(
      "camel_husk" === this.type
        ? "entity/camel/camel_husk"
        : this.baby
          ? "entity/camel/camel_baby"
          : "entity/camel/camel",
    );
  }
  drawLayers(t, s, e, i, a, o, h, r) {
    if (!this.saddled || this.baby) return;
    const n = EM.get(s, ("camel_husk" === this.type ? "camel_husk" : "camel") + "#saddle");
    n &&
      (EM.reset(n),
      EM.copy(e, n),
      n.parts.reins && (n.parts.reins.visible = !!this.rider),
      s.drawEM(n, s.etex("entity/equipment/" + this.type + "_saddle/saddle"), i, h, o, {
        overlay: r,
      }));
  }
}
(defVMob("camel", { cls: Camel, food: "camel_food", layer: "camel#main", xp: 2, shadowR: 0.7 }),
  defVMob("camel_husk", {
    cls: Camel,
    food: "camel_husk_food",
    layer: "camel#main",
    xp: 5,
    T: { hostile: !1, passive: !0 },
    shadowR: 0.7,
  }));
const LLAMA_COLORS = ["creamy", "white", "brown", "gray"];
class Llama extends Horse {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a),
      (this.variant = randInt(0, 3)),
      (this.strength = Math.max(1, Math.min(5, randInt(1, 3) + (Math.random() < 0.04 ? 2 : 0)))),
      (this.carpet = null),
      (this.spd = 0.175),
      (this.maxHealth = this.health = randInt(15, 30)),
      "trader_llama" === s && (this.tame = !0));
  }
  extraSave() {
    return { ...super.extraSave(), str: this.strength, carpet: this.carpet };
  }
  extraLoad(t) {
    (super.extraLoad(t), (this.strength = t.str || 3), (this.carpet = t.carpet || null));
  }
  dropsOnDeath() {
    return [this.carpet, this.chest ? makeStack("chest", 1) : null, ...(this.chestInv || [])];
  }
  preInteract(t, s) {
    const e = this.game,
      i = s && ITEMS[s.id].key;
    if (s && isFood("llama_food", s.id)) {
      let s = !1;
      return (
        this.health < this.maxHealth &&
          ((this.health = Math.min(this.maxHealth, this.health + ("hay_block" === i ? 10 : 2))),
          (s = !0)),
        !this.tame &&
          this.temper < 100 &&
          ((this.temper = Math.min(100, this.temper + ("hay_block" === i ? 6 : 3))), (s = !0)),
        this.tame &&
          "hay_block" === i &&
          this.breedCd <= 0 &&
          !this.loveT &&
          !this.baby &&
          ((this.loveT = 600), (s = !0)),
        !!s && (useOne(e, t), this.sound("eat"), !0)
      );
    }
    return t.sneaking && this.tame
      ? (e.ui.open(new HorseScreen(e, this)), !0)
      : i && /_carpet$/.test(i) && this.tame && !this.carpet && !this.baby
        ? ((this.carpet = { ...s, count: 1 }),
          useOne(e, t),
          Sound.ev("entity.llama.swag", this.pos, 0.5, 1),
          !0)
        : "chest" !== i || !this.tame || this.chest || this.baby
          ? !(this.baby || t.vehicle || (s && ITEMS[s.id].spawnEgg)) &&
            (t.mount(this), (t.yaw = this.yaw), !0)
          : ((this.chest = !0),
            (this.chestInv = new Array(3 * this.strength).fill(null)),
            useOne(e, t),
            this.sound("chest"),
            !0);
  }
  ridden(t, s) {
    if (!this.tame) return super.ridden(t, s);
    VMob.prototype.think.call(this, t);
  }
  moveBy(t) {
    VMob.prototype.moveBy.call(this, t);
  }
  seat() {
    return [this.pos[0], this.pos[1] + (this.baby ? 0.6 : 1.2), this.pos[2]];
  }
  ranged(t, s, e) {
    (e > 8 && (t.goal = [s.pos[0], s.pos[1], s.pos[2]]),
      this.attackCd <= 0 && e < 10 && this.canSee(s) && ((this.attackCd = 40), spitAt(this, s)),
      this.anger <= 0 && (this.target = null));
  }
  findTarget() {
    this.target &&
      (this.target.dead || this.target.deathTime || this.anger <= 0) &&
      (this.target = null);
  }
  onAttacked(t) {
    this.panic = 0;
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, a] = emLimbs(this, s);
    (emHead(e.head, this, s),
      emQuad(t, i, a),
      e.right_chest && (e.right_chest.visible = !!this.chest),
      e.left_chest && (e.left_chest.visible = !!this.chest));
  }
  texKey(t) {
    return t.etex(
      "entity/llama/llama_" + LLAMA_COLORS[0 | this.variant] + (this.baby ? "_baby" : ""),
    );
  }
  drawLayers(t, s, e, i, a, o, h, r) {
    const n =
      "trader_llama" === this.type
        ? "trader_llama" + (this.baby ? "_baby" : "")
        : this.carpet && !this.baby
          ? ITEMS[this.carpet.id].key.replace(/_carpet$/, "")
          : null;
    if (!n) return;
    const l = EM.get(s, (this.baby ? "llama_baby" : "llama") + "#decor");
    l &&
      (EM.reset(l),
      EM.copy(e, l),
      s.drawEM(l, s.etex("entity/equipment/llama_body/" + n), i, h, o, { overlay: r }));
  }
}
class MobShot extends Entity {
  constructor(t, s, e, i, a, o, h = {}) {
    (super(t, s, e, i, 0.25, 0.25),
      (this.vel = a),
      (this.owner = o),
      (this.o = h),
      (this.spriteLayer = h.layer ?? T(h.sprite) ?? T("p_generic_0")));
  }
  tick() {
    (this.savePrev(), this.age++);
    const t = this.vel,
      s = this.game,
      e = [this.pos[0] + t[0], this.pos[1] + t[1], this.pos[2] + t[2]];
    for (const t of s.entities) {
      if (t === this || t === this.owner || !(t instanceof Living) || t.dead || t.deathTime)
        continue;
      const s = t.box();
      if (
        e[0] > s[0] - 0.2 &&
        e[0] < s[3] + 0.2 &&
        e[1] > s[1] - 0.2 &&
        e[1] < s[4] + 0.2 &&
        e[2] > s[2] - 0.2 &&
        e[2] < s[5] + 0.2
      )
        return (
          this.o.onHit
            ? this.o.onHit(t, this)
            : t.hurt(this.o.dmg ?? 1, {
                type: "mob",
                attacker: this.owner,
                knockFrom: this.pos,
                knock: this.o.knock ?? 0.1,
              }),
          void (this.dead = !0)
        );
    }
    if (
      (this.move(t[0], t[1], t[2]),
      this.collidedH || this.onGround || (0 === this.vel[1] && 0 !== t[1]) || this.age > 200)
    )
      return (this.o.onBlock && this.o.onBlock(this), void (this.dead = !0));
    ((t[0] *= 0.99), (t[1] = 0.99 * t[1] - (this.o.grav ?? 0.06)), (t[2] *= 0.99));
  }
}
function shootAt(t, s, e, i) {
  const a = t.game,
    o = t.pos[0] - Math.sin(t.bodyYaw) * t.w * 0.6,
    h = t.pos[1] + t.h * (i.yk || 0.8),
    r = t.pos[2] - Math.cos(t.bodyYaw) * t.w * 0.6,
    n = s.pos[0] - o,
    l = s.pos[1] + 0.5 * s.h - h,
    d = s.pos[2] - r,
    p = l + Math.hypot(n, d) * (i.arc ?? 0.2),
    c = Math.hypot(n, p, d) || 1,
    m = new MobShot(a, o, h, r, [(n / c) * e, (p / c) * e, (d / c) * e], t, i);
  return (a.entities.push(m), m);
}
function spitAt(t, s) {
  (shootAt(t, s, 1.5, { sprite: "p_generic_2", dmg: 1, grav: 0.06 }), t.sound("spit"));
}
(defVMob("llama", {
  cls: Llama,
  food: "llama_food",
  babyTempt: !0,
  xp: 2,
  layer: "llama#main",
  shadowR: 0.6,
}),
  defVMob("trader_llama", {
    cls: Llama,
    food: "llama_food",
    xp: 2,
    layer: "llama#main",
    soundType: "llama",
    shadowR: 0.6,
  }));
const PetMixin = {
  followOwner(t) {
    const s = this.owner;
    if (!s || this.sitting || s.dead || (s.vehicle && "fly" !== this.ai)) return !1;
    const e = this.distTo(s);
    if (e > 12 && s.onGround)
      for (let t = 0; t < 10; t++) {
        const t = Math.floor(s.pos[0]) + randInt(-3, 3),
          e = Math.floor(s.pos[2]) + randInt(-3, 3),
          i = Math.floor(s.pos[1]);
        if (
          !(Math.abs(t - s.pos[0]) < 2 && Math.abs(e - s.pos[2]) < 2) &&
          BLOCKS[this.world.getBlock(t, i - 1, e)].solid &&
          !BLOCKS[this.world.getBlock(t, i, e)].solid &&
          !BLOCKS[this.world.getBlock(t, i + 1, e)].solid
        )
          return ((this.pos = [t + 0.5, i, e + 0.5]), this.savePrev(), (this.goal = null), !0);
      }
    return (
      e > ("fly" === this.ai ? 4 : 6) &&
      ((t.goal = [s.pos[0], s.pos[1] + ("fly" === this.ai ? 1 : 0), s.pos[2]]),
      (t.mod = 1.2),
      (t.look = s),
      !0)
    );
  },
  huntTarget() {
    const t = this.owner;
    if (!t || this.sitting) return null;
    const s = t.lastHurtBy || t.lastAttacked;
    return s &&
      s !== this &&
      !s.dead &&
      !s.deathTime &&
      s.distTo &&
      s.distTo(this) < 16 &&
      s.owner !== t &&
      "creeper" !== s.type
      ? s
      : null;
  },
};
(() => {
  const t = Player.prototype.hurt;
  Player.prototype.hurt = function (s, e) {
    const i = t.call(this, s, e);
    return (
      i &&
        e &&
        e.attacker &&
        e.attacker !== this &&
        ((this.lastHurtBy = e.attacker), (this.lastHurtT = this.age)),
      i
    );
  };
  const s = Game.prototype.attack;
  Game.prototype.attack = function (t, ...e) {
    const i = s.call(this, t, ...e);
    return (t && t instanceof Living && (this.player.lastAttacked = t), i);
  };
})();
const tryTame = (t, s, e) => {
    const i = t.game;
    if (Math.random() < e) {
      ((t.owner = s), (t.persistent = !0), (t.sitting = !0), (t.target = null), (t.panic = 0));
      for (let s = 0; s < 7; s++)
        i.particles.spawn(
          "heart",
          t.pos[0] + (Math.random() - 0.5) * t.w,
          t.pos[1] + 0.8 * t.h,
          t.pos[2] + (Math.random() - 0.5) * t.w,
          0,
          0.02,
          0,
        );
      t.onTamed && t.onTamed();
    } else
      for (let s = 0; s < 7; s++)
        i.particles.spawn(
          "smoke",
          t.pos[0] + (Math.random() - 0.5) * t.w,
          t.pos[1] + 0.8 * t.h,
          t.pos[2] + (Math.random() - 0.5) * t.w,
          0,
          0.02,
          0,
        );
  },
  WOLF_BY_BIOME = [
    [/^snowy_taiga/, "ashen"],
    [/old_growth_pine_taiga/, "black"],
    [/old_growth_spruce_taiga/, "chestnut"],
    [/sparse_jungle/, "rusty"],
    [/^grove/, "snowy"],
    [/savanna_plateau/, "spotted"],
    [/wooded_badlands/, "striped"],
    [/^forest/, "woods"],
    [/taiga/, "pale"],
  ];
class Wolf extends VMob {
  constructor(t, s, e, i, a) {
    super(t, s, e, i, a);
    const o = biomeName(t, e, a);
    ((this.variant = (WOLF_BY_BIOME.find(([t]) => t.test(o)) || [0, "pale"])[1]),
      (this.collar = "red"),
      (this.armor = null),
      (this.persistent = !1),
      (this.beg = 0));
  }
  extraSave() {
    return { collar: this.collar, arm: this.armor };
  }
  extraLoad(t) {
    ((this.collar = t.collar || "red"),
      (this.armor = t.arm || null),
      this.owner && (this.persistent = !0));
  }
  get angry() {
    return !!this.target && this.anger > 0;
  }
  canBreed() {
    return !!this.owner && this.health >= this.maxHealth;
  }
  wantsPlayer() {
    return !1;
  }
  hurt(t, s) {
    if (this.armor && s && "void" !== s.type && "drown" !== s.type) {
      const s = 64;
      return (
        (this.armor.dmg = (this.armor.dmg || 0) + Math.max(1, Math.round(t))),
        this.armor.dmg >= s
          ? ((this.armor = null), Sound.ev("item.wolf_armor.break", this.pos, 1, 1))
          : Sound.ev("item.wolf_armor.damage", this.pos, 1, 1),
        (this.hurtTime = 10),
        !0
      );
    }
    const e = super.hurt(t, s);
    if (e && s && s.attacker && !this.owner)
      for (const t of this.game.entities)
        t instanceof Wolf &&
          !t.owner &&
          t !== this &&
          t.distTo(this) < 12 &&
          ((t.target = s.attacker), (t.anger = 400));
    return e;
  }
  dropsOnDeath() {
    return [this.armor];
  }
  huntTarget() {
    const t = PetMixin.huntTarget.call(this);
    if (t) return ((this.anger = 400), t);
    if (!this.owner && (this.age + this.id) % 40 == 0) {
      const t = this.game.entities.find(
        (t) =>
          !t.dead &&
          !t.deathTime &&
          ("sheep" === t.type ||
            "rabbit" === t.type ||
            "fox" === t.type ||
            "skeleton" === t.type ||
            "stray" === t.type ||
            ("turtle" === t.type && t.baby)) &&
          t.distTo(this) < 10,
      );
      if (t && Math.random() < 0.3) return ((this.anger = 300), t);
    }
    return null;
  }
  findTarget() {
    (this.target &&
      (this.target.dead ||
        this.target.deathTime ||
        this.anger <= 0 ||
        this.target === this.owner) &&
      (this.target = null),
      !this.target && this.huntTarget && (this.target = this.huntTarget()));
  }
  postInteract(t, s) {
    const e = this.game,
      i = s && ITEMS[s.id].key;
    if (this.owner === t) {
      if (i && /_dye$/.test(i)) return ((this.collar = i.replace(/_dye$/, "")), useOne(e, t), !0);
      if ("wolf_armor" === i && !this.armor && !this.baby)
        return (
          (this.armor = { ...s, count: 1 }),
          useOne(e, t),
          Sound.ev("item.armor.equip_wolf", this.pos, 1, 1),
          !0
        );
      if ("shears" === i && this.armor)
        return (
          e.dropItem(this.pos[0], this.pos[1] + 0.5, this.pos[2], this.armor),
          (this.armor = null),
          Sound.ev("item.armor.unequip_wolf", this.pos, 1, 1),
          !0
        );
      if ("armadillo_scute" === i && this.armor && this.armor.dmg)
        return (
          (this.armor.dmg = Math.max(0, this.armor.dmg - 16)),
          useOne(e, t),
          Sound.ev("item.wolf_armor.repair", this.pos, 1, 1),
          !0
        );
      if (s && isFood("wolf_food", s.id) && this.health < this.maxHealth)
        return (
          (this.health = Math.min(
            this.maxHealth,
            this.health + (ITEMS[s.id].food ? ITEMS[s.id].food[0] : 2),
          )),
          useOne(e, t),
          this.sound("eat"),
          !0
        );
      if (!s || !isFood("wolf_food", s.id))
        return ((this.sitting = !this.sitting), (this.target = null), (this.goal = null), !0);
    } else if (!this.owner && "bone" === i && !this.angry)
      return (useOne(e, t), tryTame(this, t, 1 / 3), !0);
    return !1;
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, a] = emLimbs(this, s);
    this.age;
    if (
      (emHead(e.head, this, s),
      e.head && this.beg > 0 && (e.head.zRot = 0.4 * this.beg),
      this.sitting)
    ) {
      const s = t.key.includes("_baby") ? 0.5 : 1;
      (e.body &&
        ((e.body.y += 4 * s),
        (e.body.z -= 2 * s),
        (e.body.xRot = Math.PI / 4 - (e.upper_body ? 0 : Math.PI / 2))),
        e.tail && ((e.tail.y += 9 * s), (e.tail.z -= 2 * s)));
      for (const t of ["right_hind_leg", "left_hind_leg"])
        e[t] && ((e[t].xRot = (3 * Math.PI) / 2), (e[t].y += 6.7 * s), (e[t].z -= 5 * s));
      for (const t of ["right_front_leg", "left_front_leg"])
        e[t] && ((e[t].xRot = 5.811947), (e[t].y += 1 * s));
      (e.right_front_leg && (e.right_front_leg.x += 0.01 * s),
        e.left_front_leg && (e.left_front_leg.x -= 0.01 * s),
        e.upper_body &&
          ((e.upper_body.y += 2),
          (e.upper_body.xRot = (2 * Math.PI) / 5),
          (e.upper_body.yRot = 0)));
    } else emQuad(t, i, a);
    (e.tail &&
      (e.tail.xRot = this.angry
        ? 1.5393804
        : this.owner
          ? (0.55 - 0.02 * (this.maxHealth - this.health)) * Math.PI
          : 0.62831855),
      e.tail && !this.sitting && (e.tail.yRot = 1.4 * Math.cos(0.6662 * i) * a));
  }
  texKey(t) {
    const s = this.baby ? "_baby" : "",
      e =
        "entity/wolf/wolf" +
        ("pale" === this.variant ? "" : "_" + this.variant) +
        (this.owner ? "_tame" : this.angry ? "_angry" : "");
    return this.owner
      ? t.etexMix([e + s, { p: "entity/wolf/wolf_collar" + s, c: dyeRGB(this.collar) }])
      : t.etex(e + s);
  }
  drawLayers(t, s, e, i, a, o, h, r) {
    if (!this.armor || this.baby) return;
    const n = EM.get(s, "wolf_armor#main");
    if (!n) return;
    (EM.reset(n),
      EM.copy(e, n),
      s.drawEM(n, s.etex("entity/equipment/wolf_body/armadillo_scute"), i, h, o, { overlay: r }),
      null != this.armor.color &&
        s.drawEM(n, s.etex("entity/equipment/wolf_body/armadillo_scute_overlay"), i, h, o, {
          overlay: r,
          tint: dyeTintOf(this.armor),
        }));
    const l = (this.armor.dmg || 0) / 64;
    l > 0.25 &&
      s.drawEMOver(
        n,
        s.etex(
          "entity/wolf/wolf_armor_crackiness_" + (l > 0.75 ? "high" : l > 0.5 ? "medium" : "low"),
        ),
        i,
        h,
        o,
        {},
      );
  }
}
(Object.assign(Wolf.prototype, { followOwner: PetMixin.followOwner }),
  defVMob("wolf", {
    cls: Wolf,
    food: "wolf_food",
    tameToBreed: !0,
    fights: !0,
    xp: 2,
    reach: 0.4,
    T: { attack: 4 },
    shadowR: 0.5,
    chaseMod: 1.3,
  }));
class Fox extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a),
      (this.variant = /snowy|frozen|grove|ice/.test(biomeName(t, e, a)) ? "snow" : "red"),
      (this.mouth =
        Math.random() < 0.2
          ? makeStack(
              pickW([
                ["emerald", 5],
                ["rabbit_foot", 10],
                ["rabbit_hide", 10],
                ["egg", 15],
                ["wheat", 20],
                ["leather", 20],
                ["feather", 20],
              ]),
              1,
            )
          : null),
      (this.sleeping = !1),
      (this.crouch = 0),
      (this.trusts = null));
  }
  extraSave() {
    return { var: this.variant, mouth: this.mouth, trust: this.trusts ? 1 : 0 };
  }
  extraLoad(t) {
    ((this.variant = t.var || "red"),
      (this.mouth = t.mouth || null),
      t.trust && (this.trusts = this.game.player));
  }
  dropsOnDeath() {
    return [this.mouth];
  }
  wantsPlayer() {
    return !1;
  }
  avoid(t) {
    const s = this.game.player;
    if (this.trusts === s || s.sneaking || s.creative) return !1;
    if (this.distTo(s) < 8) {
      this.sleeping = !1;
      const e = this.pos[0] - s.pos[0],
        i = this.pos[2] - s.pos[2],
        a = Math.hypot(e, i) || 1;
      return (
        (t.goal = [this.pos[0] + (e / a) * 6, this.pos[1], this.pos[2] + (i / a) * 6]),
        (t.mod = 1.6),
        !0
      );
    }
    return !1;
  }
  think(t) {
    const s = this.game;
    if (
      (s.isDay() &&
        !this.target &&
        this.panic <= 0 &&
        this.world.skyAt(
          Math.floor(this.pos[0]),
          Math.floor(this.pos[1] + 1),
          Math.floor(this.pos[2]),
        ) < 16 &&
        Math.random() < 0.01 &&
        (this.sleeping = !0),
      (!s.isDay() || this.panic > 0 || this.target) && (this.sleeping = !1),
      !this.sleeping)
    ) {
      if (!this.target && (this.age + this.id) % 60 == 0) {
        const t = s.entities.find(
          (t) =>
            !t.dead &&
            !t.deathTime &&
            ("chicken" === t.type ||
              "rabbit" === t.type ||
              "cod" === t.type ||
              "salmon" === t.type ||
              "tropical_fish" === t.type ||
              ("turtle" === t.type && t.baby)) &&
            t.distTo(this) < 10,
        );
        t && Math.random() < 0.3 && ((this.target = t), (this.anger = 200));
      }
      if (!this.mouth && this.age % 20 == 0) {
        const t = s.entities.find(
          (t) => t instanceof ItemEntity && !t.dead && t.distTo(this) < 1.5,
        );
        t &&
          ((this.mouth = { ...t.stack, count: 1 }),
          t.stack.count--,
          t.stack.count || (t.dead = !0));
      }
      (this.mouth &&
        ITEMS[this.mouth.id].food &&
        this.health < this.maxHealth &&
        Math.random() < 0.01 &&
        ((this.mouth = null),
        (this.health = Math.min(this.maxHealth, this.health + 4)),
        this.sound("eat")),
        VMob.prototype.think.call(this, t));
    }
  }
  findTarget() {
    this.target &&
      (this.target.dead || this.target.deathTime || this.anger <= 0) &&
      (this.target = null);
  }
  fight(t) {
    const s = this.target,
      e = this.distTo(s);
    if (
      (e < 5 && e > 2 && this.onGround && 0 === this.crouch && (this.crouch = 20), this.crouch > 0)
    ) {
      if ((this.crouch--, (t.look = s), 1 === this.crouch)) {
        const t = s.pos[0] - this.pos[0],
          e = s.pos[2] - this.pos[2],
          i = Math.hypot(t, e) || 1;
        ((this.vel[0] = (t / i) * 0.6),
          (this.vel[2] = (e / i) * 0.6),
          (this.vel[1] = 0.6),
          this.sound("bite"));
      }
    } else VMob.prototype.fight.call(this, t);
  }
  hurt(t, s) {
    return ((this.sleeping = !1), super.hurt(t, s));
  }
  postInteract(t, s) {
    return (
      s && isFood("fox_food", s.id) && !this.trusts && this.loveT > 0 && (this.trusts = t),
      !1
    );
  }
  spawnChild(t) {
    const s = super.spawnChild(t);
    return (
      (s.variant = Math.random() < 0.5 ? this.variant : t.variant),
      (s.trusts = this.game.player),
      s
    );
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, a] = emLimbs(this, s);
    if (this.sleeping) {
      (e.body && ((e.body.zRot = -Math.PI / 2), (e.body.y = 21)),
        e.head &&
          ((e.head.x = 1),
          (e.head.y = 19.49),
          (e.head.zRot = -2.0943952),
          (e.head.yRot = 0),
          (e.head.xRot = 0)),
        e.tail && ((e.tail.x = -1), (e.tail.y = 4), (e.tail.z = -1), (e.tail.xRot = -2.1816616)));
      for (const t of ["right_hind_leg", "left_hind_leg", "right_front_leg", "left_front_leg"])
        e[t] && (e[t].visible = !1);
    } else
      (emHead(e.head, this, s),
        emQuad(t, i, a),
        this.crouch > 0 && e.body && ((e.body.y += 2), e.head && (e.head.y += 2)));
  }
  texKey(t) {
    return t.etex(
      "entity/fox/fox" +
        ("snow" === this.variant ? "_snow" : "") +
        (this.sleeping ? "_sleep" : "") +
        (this.baby ? "_baby" : ""),
    );
  }
  attachments(t, s, e, i) {
    if (!this.mouth || this.sleeping) return null;
    const a = this.mouth;
    return {
      head: (s) => {
        (M4.translate(s, 1 / 16, 1.5 / 16, -0.4),
          M4.rotX(s, -Math.PI / 2),
          M4.scale(s, 0.75, 0.75, 0.75),
          t.drawGroundItem
            ? t.drawGroundItem(s, a, e, i)
            : t.drawHeldItem(s, a, !1, e, i, this, null));
      },
    };
  }
}
defVMob("fox", { cls: Fox, food: "fox_food", xp: 2, T: { attack: 2 }, shadowR: 0.4 });
class Goat extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a),
      (this.screaming = Math.random() < 0.02),
      (this.horns = [!0, !0]),
      (this.ramT = 0),
      (this.ramCd = 600 + randInt(0, 1200)));
  }
  extraSave() {
    return { scr: this.screaming, horns: this.horns };
  }
  extraLoad(t) {
    ((this.screaming = !!t.scr), (this.horns = t.horns || [!0, !0]));
  }
  sound(t, s, e) {
    super.sound(t, s, e);
  }
  ambientKind() {
    return this.screaming ? "screaming.ambient" : "ambient";
  }
  wantsPlayer() {
    return !1;
  }
  think(t) {
    if ((this.ramCd > 0 && this.ramCd--, this.ramT > 0)) {
      this.ramT--;
      const s = this.ramTarget;
      if (this.ramT > 20)
        return (
          (t.look = s),
          void (t.face = Math.atan2(-(s.pos[0] - this.pos[0]), -(s.pos[2] - this.pos[2])))
        );
      if (((t.fwd = 1), (t.mod = 3), s && !s.dead && this.distTo(s) < 1.5))
        (s.hurt(this.baby ? 1 : 2, {
          type: "mob",
          attacker: this,
          knockFrom: this.pos,
          knock: 1.6,
        }),
          (s.vel[1] = 0.4),
          this.sound(this.screaming ? "screaming.ram_impact" : "ram_impact"),
          (this.ramT = 0));
      else if (this.collidedH) {
        ((this.ramT = 0), this.sound(this.screaming ? "screaming.ram_impact" : "ram_impact"));
        const t = this.horns[0] ? 0 : this.horns[1] ? 1 : -1;
        t >= 0 &&
          Math.random() < 0.5 &&
          ((this.horns[t] = !1),
          this.game.dropItem(this.pos[0], this.pos[1] + 1, this.pos[2], makeStack("goat_horn", 1)),
          this.sound("horn_break"));
      }
      return;
    }
    if (this.ramCd <= 0 && !this.baby) {
      const t = this.game.player,
        s =
          !t.creative && this.distTo(t) < 12 && this.canSee(t)
            ? t
            : this.game.entities.find(
                (t) =>
                  t instanceof Mob &&
                  t !== this &&
                  "goat" !== t.type &&
                  t.distTo(this) < 12 &&
                  !t.dead,
              );
      if (s)
        return (
          (this.ramTarget = s),
          (this.ramT = 60),
          (this.ramCd = this.screaming ? 100 + randInt(0, 200) : 600 + randInt(0, 1200)),
          void this.sound(this.screaming ? "screaming.prepare_ram" : "prepare_ram")
        );
    }
    (this.onGround &&
      Math.random() < 0.003 &&
      !this.target &&
      ((this.vel[1] = 0.8),
      (this.vel[0] += 0.4 * (Math.random() - 0.5)),
      (this.vel[2] += 0.4 * (Math.random() - 0.5)),
      this.sound(this.screaming ? "screaming.long_jump" : "long_jump")),
      VMob.prototype.think.call(this, t));
  }
  postInteract(t, s) {
    return (
      !(!s || "bucket" !== ITEMS[s.id].key || this.baby) &&
      (swapHeld(this.game, t, "milk_bucket"),
      this.sound(this.screaming ? "screaming.milk" : "milk"),
      !0)
    );
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, a] = emLimbs(this, s);
    (emHead(e.head, this, s),
      emQuad(t, i, a),
      e.head &&
        this.ramT > 0 &&
        (e.head.xRot = this.ramT > 20 ? 0.6 * Math.min(1, (60 - this.ramT) / 10) : 0.6),
      e.left_horn && (e.left_horn.visible = this.horns[0] && !this.baby),
      e.right_horn && (e.right_horn.visible = this.horns[1] && !this.baby));
  }
  texKey(t) {
    return t.etex("entity/goat/goat" + (this.baby ? "_baby" : ""));
  }
}
defVMob("goat", { cls: Goat, food: "goat_food", xp: 2, jump: 0.5, fearless: !0, shadowR: 0.45 });
const PANDA_GENES = [
  ["normal", 15],
  ["lazy", 1],
  ["worried", 1],
  ["playful", 1],
  ["brown", 1],
  ["weak", 1],
  ["aggressive", 1],
];
class Panda extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a),
      (this.main = pickW(PANDA_GENES)),
      (this.hidden = pickW(PANDA_GENES)),
      (this.sit = 0),
      (this.rollT = 0),
      (this.sneezeT = 0),
      (this.eatT = 0),
      (this.holding = null));
  }
  extraSave() {
    return { m: this.main, h: this.hidden };
  }
  extraLoad(t) {
    ((this.main = t.m || "normal"), (this.hidden = t.h || "normal"));
  }
  get gene() {
    const t = this.main,
      s = this.hidden;
    return ("brown" !== t && "weak" !== t) || t === s ? t : "normal";
  }
  wantsPlayer() {
    return !1;
  }
  fight(t) {
    "aggressive" === this.gene || this.attacked
      ? VMob.prototype.fight.call(this, t)
      : (this.target = null);
  }
  onAttacked() {
    ((this.attacked = !0), "aggressive" !== this.gene && ((this.target = null), (this.panic = 60)));
  }
  think(t) {
    const s = this.game;
    if (this.rollT > 0) return (this.rollT--, void (t.fwd = 1));
    if (this.sit > 0)
      return (
        this.sit--,
        void (
          this.eatT > 0 &&
          0 === --this.eatT &&
          ((this.holding = null), (this.health = Math.min(this.maxHealth, this.health + 2)))
        )
      );
    if ("playful" === this.gene && this.onGround && Math.random() < 0.002)
      return ((this.rollT = 32), void this.sound("pre_sneeze"));
    if (
      (this.baby &&
        ("weak" === this.gene || Math.random() < 1 / 6e3) &&
        Math.random() < 1 / 300 &&
        ((this.sneezeT = 20), this.sound("pre_sneeze")),
      this.sneezeT > 0 && 0 === --this.sneezeT)
    ) {
      (this.sound("sneeze"),
        Math.random() < 0.01 &&
          s.dropItem(this.pos[0], this.pos[1] + 0.5, this.pos[2], makeStack("slime_ball", 1)));
      for (const t of s.entities)
        t instanceof Panda && t !== this && t.distTo(this) < 10 && t.onGround && (t.vel[1] = 0.4);
    }
    if (!this.holding && this.age % 20 == 0) {
      const e = s.entities.find(
        (t) =>
          t instanceof ItemEntity &&
          !t.dead &&
          "bamboo" === ITEMS[t.stack.id].key &&
          t.distTo(this) < 6,
      );
      if (e)
        return e.distTo(this) < 1.5
          ? ((this.holding = { ...e.stack, count: 1 }),
            e.stack.count--,
            e.stack.count || (e.dead = !0),
            (this.sit = 200),
            (this.eatT = 200),
            void this.sound("eat"))
          : void (t.goal = [...e.pos]);
    }
    "lazy" === this.gene && Math.random() < 1 / 400
      ? (this.sit = 200)
      : VMob.prototype.think.call(this, t);
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, a] = emLimbs(this, s);
    if ((emHead(e.head, this, s), emQuad(t, i, a), this.sit > 0 && e.body)) {
      ((e.body.xRot = 0.9),
        (e.body.y = 14),
        (e.body.z = 2),
        e.head && ((e.head.y = 5), (e.head.z = -6)));
      for (const t of ["right_front_leg", "left_front_leg"])
        e[t] &&
          ((e[t].xRot = (this.eatT > 0 ? 0.3 * Math.sin(0.6 * (this.age + s)) : 0) - 0.6),
          (e[t].y = 9),
          (e[t].z = -4));
      for (const t of ["right_hind_leg", "left_hind_leg"])
        e[t] && ((e[t].xRot = -1.4), (e[t].y = 21), (e[t].z = 6));
    }
    this.sneezeT > 0 && e.head && (e.head.xRot = -0.6 * (1 - this.sneezeT / 20));
  }
  preDraw(t, s) {
    this.rollT > 0 &&
      (M4.translate(t, 0, 0.6, 0),
      M4.rotX(t, (-(32 - this.rollT + s) / 32) * Math.PI * 2),
      M4.translate(t, 0, -0.6, 0));
  }
  texKey(t) {
    const s = this.gene,
      e = this.baby;
    return t.etex(
      "normal" === s
        ? e
          ? "entity/panda/panda_baby"
          : "entity/panda/panda"
        : e
          ? "entity/panda/" + s + "_panda_baby"
          : "entity/panda/panda_" + s,
    );
  }
  inheritFrom(t, s) {
    ((t.main = Math.random() < 0.5 ? this.main : this.hidden),
      (t.hidden = Math.random() < 0.5 ? s.main : s.hidden),
      Math.random() < 1 / 32 && (t.main = pickW(PANDA_GENES)));
  }
  attachments(t, s, e, i) {
    if (!this.holding) return null;
    const a = this.holding;
    return {
      head: (s) => {
        (M4.translate(s, 0, 0.3, -0.5),
          M4.rotX(s, -Math.PI / 2),
          t.drawHeldItem(s, a, !1, e, i, this, null));
      },
    };
  }
}
defVMob("panda", { cls: Panda, food: "panda_food", xp: 2, T: { attack: 6 }, shadowR: 0.8 });
class PolarBear extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a), (this.stand = 0));
  }
  wantsPlayer() {
    return !1;
  }
  findTarget() {
    super.findTarget();
    const t = this.game.player;
    (!this.target &&
      !this.baby &&
      !t.creative &&
      this.distTo(t) < 8 &&
      this.game.entities.some((t) => t instanceof PolarBear && t.baby && t.distTo(this) < 10) &&
      ((this.target = t), (this.anger = 200)),
      this.target === t &&
        this.anger <= 0 &&
        !this.game.entities.some((t) => t instanceof PolarBear && t.baby && t.distTo(this) < 10) &&
        (this.target = null));
  }
  onAttacked(t) {
    if (this.baby) {
      ((this.target = null), (this.panic = 60));
      for (const s of this.game.entities)
        s instanceof PolarBear &&
          !s.baby &&
          s.distTo(this) < 16 &&
          ((s.target = t.attacker), (s.anger = 400));
    }
  }
  melee(t) {
    (super.melee(t), (this.stand = 20), this.sound("warning"));
  }
  afterMove() {
    this.stand > 0 && this.stand--;
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, a] = emLimbs(this, s);
    (emHead(e.head, this, s), emQuad(t, i, a));
    const o =
      this.stand > 0
        ? Math.sin((Math.min(1, (20 - this.stand + s) / 10) * Math.PI) / 2) * (this.stand / 20)
        : 0;
    if (o > 0 && e.body) {
      ((e.body.xRot = Math.PI / 2 - o * Math.PI * 0.35),
        (e.body.y -= 9 * o),
        e.head && ((e.head.y -= 24 * o), (e.head.z += 13 * o)));
      for (const t of ["right_front_leg", "left_front_leg"])
        e[t] && ((e[t].y -= 20 * o), (e[t].z += 4 * o), (e[t].xRot -= o * Math.PI * 0.45));
    }
  }
  texKey(t) {
    return t.etex("entity/bear/polarbear" + (this.baby ? "_baby" : ""));
  }
}
defVMob("polar_bear", { cls: PolarBear, xp: 2, fights: !0, shadowR: 0.7 });
const BLOCK_RANDOM_TICK = {};
(() => {
  const t = Game.prototype.onRandomTick;
  Game.prototype.onRandomTick = function (s, e, i, a, o) {
    const h = BLOCKS[a] && BLOCK_RANDOM_TICK[BLOCKS[a].key];
    if (!h) return t.call(this, s, e, i, a, o);
    h(this, s, e, i, a, this.world.getMeta(s, e, i));
  };
})();
const bprop = (t, s, e, i, a) => {
    const o = t.getBlock(s, e, i);
    return Features.propOf(o, t.getMeta(s, e, i), a);
  },
  bsetProp = (t, s, e, i, a, o) => {
    const h = t.getBlock(s, e, i);
    t.setBlock(s, e, i, h, Features.withProp(h, t.getMeta(s, e, i), a, o));
  };
function spawnAt(t, s, e, i, a, o) {
  const h = createMob(t, s, e, i, a);
  return (o && h.makeBaby && h.makeBaby(), (h.persistent = !0), t.entities.push(h), h);
}
class Rabbit extends VMob {
  constructor(t, s, e, i, a) {
    super(t, s, e, i, a);
    const o = biomeName(t, e, a),
      h = 100 * Math.random();
    ((this.variant = /desert/.test(o)
      ? "gold"
      : /snowy|frozen|ice|grove|jagged/.test(o)
        ? h < 80
          ? "white"
          : "white_splotched"
        : h < 50
          ? "brown"
          : h < 90
            ? "salt"
            : "black"),
      (this.hopT = 0),
      (this.persistent = !1));
  }
  extraSave() {
    return { var: this.variant };
  }
  extraLoad(t) {
    this.variant = t.var || "brown";
  }
  avoid(t) {
    const s = this.game.player;
    if (
      s.creative ||
      s.sneaking ||
      this.distTo(s) > 8 ||
      (s.inv.held && isFood("rabbit_food", s.inv.held.id))
    )
      return !1;
    const e = this.pos[0] - s.pos[0],
      i = this.pos[2] - s.pos[2],
      a = Math.hypot(e, i) || 1;
    return (
      (t.goal = [this.pos[0] + (e / a) * 6, this.pos[1], this.pos[2] + (i / a) * 6]),
      (t.mod = 2.2),
      !0
    );
  }
  idle(t) {
    if (this.age % 40 == 0 && Math.random() < 0.1 && !1 !== this.game.rule("mob_griefing")) {
      const t = Math.floor(this.pos[0]),
        s = Math.floor(this.pos[1]),
        e = Math.floor(this.pos[2]),
        i = this.world.getBlock(t, s, e);
      if (BLOCKS[i] && "carrots" === BLOCKS[i].key) {
        const a = +(Features.propOf(i, this.world.getMeta(t, s, e), "age") || 0);
        a > 0 ? bsetProp(this.world, t, s, e, "age", a - 1) : this.world.setBlock(t, s, e, 0, 0);
      }
    }
    return !1;
  }
  moveBy(t) {
    (this.hopT > 0 && this.hopT--,
      (t.goal || t.fwd) &&
        this.onGround &&
        this.hopT <= 0 &&
        ((this.vel[1] = 0.5),
        (this.hopT = 10),
        (this.anims.HOP = this.age),
        this.sound("jump", 0.4)),
      !this.onGround || (t.goal && this.hopT > 6) || ((t.goal = null), (t.fwd = 0)),
      VMob.prototype.moveBy.call(this, t));
  }
  setupAnim(t, s) {
    const e = t.parts;
    e.head && ((e.head.yRot = -(this.headYaw || 0)), (e.head.xRot = 0.39 - (this.pitch || 0)));
    const i = this.baby ? "BabyRabbitAnimation." : "RabbitAnimation.";
    null != this.anims.HOP && EM.anim(t, i + "HOP", (this.age - this.anims.HOP + s) / 20);
  }
  texKey(t) {
    const s =
      "Toast" === this.customName ? "toast" : "evil" === this.variant ? "caerbannog" : this.variant;
    return t.etex("entity/rabbit/rabbit_" + s + (this.baby ? "_baby" : ""));
  }
  spawnChild(t) {
    const s = super.spawnChild(t);
    return ((s.variant = Math.random() < 0.5 ? this.variant : t.variant), s);
  }
}
defVMob("rabbit", { cls: Rabbit, food: "rabbit_food", xp: 2, shadowR: 0.3, stepSound: !1 });
class Ocelot extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a), (this.trusting = !1), (this.persistent = !1));
  }
  extraSave() {
    return { trust: this.trusting };
  }
  extraLoad(t) {
    ((this.trusting = !!t.trust), this.trusting && (this.persistent = !0));
  }
  canBreed() {
    return this.trusting;
  }
  avoid(t) {
    const s = this.game.player;
    if (this.trusting || s.creative || this.distTo(s) > 10) return !1;
    if (
      s.inv.held &&
      isFood("ocelot_food", s.inv.held.id) &&
      (s.sneaking || Math.hypot(s.vel[0], s.vel[2]) < 0.05)
    )
      return !1;
    const e = this.pos[0] - s.pos[0],
      i = this.pos[2] - s.pos[2],
      a = Math.hypot(e, i) || 1;
    return (
      (t.goal = [this.pos[0] + (e / a) * 8, this.pos[1], this.pos[2] + (i / a) * 8]),
      (t.mod = 1.6),
      !0
    );
  }
  huntTarget() {
    if ((this.age + this.id) % 60) return null;
    const t = this.game.entities.find(
      (t) =>
        !t.dead &&
        !t.deathTime &&
        ("chicken" === t.type || ("turtle" === t.type && t.baby)) &&
        t.distTo(this) < 10,
    );
    return t ? ((this.anger = 200), t) : null;
  }
  wantsPlayer() {
    return !1;
  }
  preInteract(t, s) {
    if (!this.trusting && s && isFood("ocelot_food", s.id)) {
      if ((useOne(this.game, t), this.sound("eat"), Math.random() < 1 / 3)) {
        ((this.trusting = !0), (this.persistent = !0));
        for (let t = 0; t < 7; t++)
          this.game.particles.spawn(
            "heart",
            this.pos[0] + (Math.random() - 0.5),
            this.pos[1] + 0.6,
            this.pos[2] + (Math.random() - 0.5),
            0,
            0.02,
            0,
          );
      } else
        for (let t = 0; t < 7; t++)
          this.game.particles.spawn(
            "smoke",
            this.pos[0] + (Math.random() - 0.5),
            this.pos[1] + 0.6,
            this.pos[2] + (Math.random() - 0.5),
            0,
            0.02,
            0,
          );
      return !0;
    }
    return !1;
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, a] = emLimbs(this, s);
    (emHead(e.head, this, s),
      emQuad(t, i, a),
      e.tail2 && (e.tail2.xRot = 1.7278761 + (Math.PI / 4) * Math.cos(i) * a));
  }
  texKey(t) {
    return t.etex("entity/cat/ocelot");
  }
}
defVMob("ocelot", {
  cls: Ocelot,
  food: "ocelot_food",
  xp: 2,
  scale: 1,
  shadowR: 0.4,
  T: { attack: 3 },
  stepSound: !1,
});
const STEW_FLOWERS = {
  dandelion: ["saturation", 7],
  poppy: ["night_vision", 100],
  blue_orchid: ["saturation", 7],
  allium: ["fire_resistance", 80],
  azure_bluet: ["blindness", 160],
  red_tulip: ["weakness", 180],
  orange_tulip: ["weakness", 180],
  white_tulip: ["weakness", 180],
  pink_tulip: ["weakness", 180],
  oxeye_daisy: ["regeneration", 160],
  cornflower: ["jump_boost", 120],
  lily_of_the_valley: ["poison", 240],
  wither_rose: ["wither", 160],
  torchflower: ["night_vision", 100],
  open_eyeblossom: ["blindness", 220],
  closed_eyeblossom: ["nausea", 140],
  cactus_flower: ["nausea", 140],
  golden_dandelion: ["saturation", 7],
};
class Mooshroom extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a), (this.variant = "red"), (this.stew = null));
  }
  extraSave() {
    return { var: this.variant, stew: this.stew };
  }
  extraLoad(t) {
    ((this.variant = t.var || "red"), (this.stew = t.stew || null));
  }
  compVal(t) {
    return "mooshroom/variant" === t ? this.variant : void 0;
  }
  postInteract(t, s) {
    const e = this.game,
      i = s && ITEMS[s.id].key;
    if ("shears" === i && !this.baby) {
      const t = createMob(e, "cow", this.pos[0], this.pos[1], this.pos[2]);
      ((t.yaw = t.bodyYaw = this.bodyYaw),
        (t.health = this.health),
        (t.persistent = !0),
        this.customName && (t.customName = this.customName),
        e.entities.push(t),
        (this.dead = !0),
        Sound.ev("entity.mooshroom.shear", this.pos, 1, 1));
      for (let t = 0; t < 5; t++)
        e.dropItem(
          this.pos[0],
          this.pos[1] + this.h,
          this.pos[2],
          makeStack(this.variant + "_mushroom", 1),
        );
      return (
        particleBurst(e, "explosion", this.pos[0], this.pos[1] + 0.5, this.pos[2], 1, 0.2),
        Sound.ev("entity.mooshroom.shear", this.pos, 1, 1),
        e.damageHeld(1),
        !0
      );
    }
    if ("bowl" === i && !this.baby)
      return (
        this.stew
          ? (swapHeld(e, t, "suspicious_stew", { stew: this.stew }),
            (this.stew = null),
            Sound.ev("entity.mooshroom.suspicious_milk", this.pos, 1, 1))
          : (swapHeld(e, t, "mushroom_stew"), Sound.ev("entity.mooshroom.milk", this.pos, 1, 1)),
        !0
      );
    if ("bucket" === i && !this.baby)
      return (swapHeld(e, t, "milk_bucket"), Sound.ev("entity.cow.milk", this.pos, 1, 1), !0);
    if (i && STEW_FLOWERS[i] && "brown" === this.variant && !this.stew) {
      ((this.stew = STEW_FLOWERS[i]),
        useOne(e, t),
        Sound.ev("entity.mooshroom.eat", this.pos, 1, 1));
      for (let t = 0; t < 4; t++)
        e.particles.spawn("smoke", this.pos[0], this.pos[1] + this.h, this.pos[2], 0, 0.05, 0);
      return !0;
    }
    return !1;
  }
  spawnChild(t) {
    const s = super.spawnChild(t);
    return (
      (s.variant =
        this.variant === t.variant
          ? Math.random() < 1 / 1024
            ? "red" === this.variant
              ? "brown"
              : "red"
            : this.variant
          : Math.random() < 0.5
            ? this.variant
            : t.variant),
      s
    );
  }
  texKey(t) {
    return t.etex("entity/cow/mooshroom_" + this.variant + (this.baby ? "_baby" : ""));
  }
  drawLayers(t, s, e, i, a, o, h, r) {
    if (this.baby || !t.blockMesh) return;
    const n = BID[this.variant + "_mushroom"];
    if (void 0 === n) return;
    const l = t.blockMesh(n, 0),
      d = Math.PI / 180,
      draw = (t, e) => {
        const a = M4.copy(i);
        (M4.scale(a, -1, -1, 1),
          M4.translate(a, 0, -1.501, 0),
          e &&
            (M4.translate(a, e.x / 16, e.y / 16, e.z / 16),
            e.zRot && M4.rotZ(a, e.zRot),
            e.yRot && M4.rotY(a, e.yRot),
            e.xRot && M4.rotX(a, e.xRot)));
        for (const [s, e] of t) "t" === s ? M4.translate(a, e[0], e[1], e[2]) : M4.rotY(a, e * d);
        (M4.scale(a, -1, -1, 1), M4.translate(a, -0.5, -0.5, -0.5), s.drawMesh(l, a, o, h));
      };
    (draw([
      ["t", [0.2, -0.35, 0.5]],
      ["r", -48],
    ]),
      draw([
        ["t", [0.2, -0.35, 0.5]],
        ["r", 42],
        ["t", [0.1, 0, -0.6]],
        ["r", -48],
      ]),
      e.parts.head &&
        draw(
          [
            ["t", [0, -0.7, -0.2]],
            ["r", -78],
          ],
          e.parts.head,
        ));
  }
}
defVMob("mooshroom", { cls: Mooshroom, food: "cow_food", xp: 2, shadowR: 0.7 });
class Armadillo extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a),
      (this.st = "idle"),
      (this.stT = 0),
      (this.shedT = 6e3 + randInt(0, 6e3)));
  }
  extraSave() {
    return { st: this.st };
  }
  extraLoad(t) {
    "scared" === t.st && (this.st = "scared");
  }
  get pre() {
    return this.baby ? "BabyArmadilloAnimation.ARMADILLO_BABY_" : "ArmadilloAnimation.ARMADILLO_";
  }
  threatened() {
    const t = this.game.player;
    if (this.lastHurtT && this.age - this.lastHurtT < 100) return !0;
    if (!t.creative && this.distTo(t) < 7 && (t.sprinting || t.vehicle || t.flying)) return !0;
    const s = this.pos[0],
      e = this.pos[1],
      i = this.pos[2];
    for (const t of this.game.entities) {
      if (t === this || !(t instanceof Mob)) continue;
      const a = t.pos[0] - s,
        o = t.pos[1] - e,
        h = t.pos[2] - i;
      if (a * a + o * o + h * h < 49 && ENTITY_TAGS.undead.includes(t.type)) return !0;
    }
    return !1;
  }
  roll(t) {
    ((this.st = t), (this.stT = 0), (this.anims = { [t]: this.age }));
  }
  think(t) {
    if ((this.stT++, --this.shedT <= 0 && !this.baby)) {
      this.shedT = 6e3 + randInt(0, 6e3);
      for (const t of rollLoot("gameplay/armadillo_shed", { e: this }))
        this.game.dropItem(this.pos[0], this.pos[1] + 0.3, this.pos[2], t);
      this.sound("scute_drop");
    }
    const s = this.threatened();
    return "idle" === this.st && s
      ? (this.roll("rolling"), void this.sound("roll"))
      : "rolling" !== this.st
        ? "scared" === this.st
          ? (!s &&
              this.stT > 100 &&
              Math.random() < 0.02 &&
              (this.roll("unrolling"), this.sound("unroll_start")),
            void (this.stT % 50 != 0 || s || (this.anims.peek = this.age)))
          : "unrolling" === this.st
            ? s
              ? void this.roll("rolling")
              : void (
                  this.stT > 30 &&
                  ((this.st = "idle"), (this.anims = {}), this.sound("unroll_finish"))
                )
            : void VMob.prototype.think.call(this, t)
        : void (this.stT > 10 && (this.st = "scared"));
  }
  hurt(t, s) {
    "scared" === this.st && (t = Math.max(0, (t - 1) / 2));
    const e = super.hurt(t, s);
    return (e && ((this.lastHurtT = this.age), (this.panic = 0)), e);
  }
  postInteract(t, s) {
    return (
      !(!s || "brush" !== ITEMS[s.id].key || this.baby) &&
      (this.game.dropItem(
        this.pos[0],
        this.pos[1] + 0.3,
        this.pos[2],
        makeStack("armadillo_scute", 1),
      ),
      this.sound("brush"),
      this.game.damageHeld(16),
      !0)
    );
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, a] = emLimbs(this, s),
      o = "scared" === this.st;
    e.cube && (e.cube.visible = o);
    for (const t of [
      "body",
      "right_front_leg",
      "left_front_leg",
      "right_hind_leg",
      "left_hind_leg",
    ])
      e[t] && (e[t].visible = !o);
    if ("idle" === this.st)
      (e.head &&
        ((e.head.yRot = clamp(-(this.headYaw || 0), -0.55, 0.55)),
        (e.head.xRot = clamp(-(this.pitch || 0), -0.4, 0.4))),
        EM.walk(t, this.pre + "WALK", i, a, 16.5, 2.5));
    else if ("rolling" === this.st) EM.anim(t, this.pre + "ROLL_UP", (this.stT + s) / 20);
    else if ("unrolling" === this.st) EM.anim(t, this.pre + "ROLL_OUT", (this.stT + s) / 20);
    else if (null != this.anims.peek) {
      e.cube && (e.cube.visible = !1);
      for (const t of ["body"]) e[t] && (e[t].visible = !0);
      EM.anim(t, this.pre + "PEEK", (this.age - this.anims.peek + s) / 20);
    }
  }
  texKey(t) {
    return t.etex("entity/armadillo/armadillo" + (this.baby ? "_baby" : ""));
  }
}
defVMob("armadillo", {
  cls: Armadillo,
  food: "armadillo_food",
  xp: 2,
  shadowR: 0.4,
  stepSound: !1,
});
class Sniffer extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a), (this.st = "idle"), (this.stT = 0), (this.digCd = 0));
  }
  get pre() {
    return "SnifferAnimation.SNIFFER_";
  }
  think(t) {
    if ((this.stT++, this.digCd > 0 && this.digCd--, "sniff" !== this.st))
      if ("dig" !== this.st) {
        if (
          "idle" === this.st &&
          !this.baby &&
          this.digCd <= 0 &&
          this.panic <= 0 &&
          !this.loveT &&
          Math.random() < 1 / 400
        )
          return ((this.st = "sniff"), (this.stT = 0), void this.sound("scenting"));
        ("idle" === this.st &&
          Math.random() < 1 / 600 &&
          ((this.anims.SNIFFSNIFF = this.age), this.sound("sniffing")),
          VMob.prototype.think.call(this, t));
      } else {
        if (100 === this.stT) {
          const t = this.pos[0] - 2.2 * Math.sin(this.bodyYaw),
            s = this.pos[2] - 2.2 * Math.cos(this.bodyYaw);
          for (const e of rollLoot("gameplay/sniffer_digging", { e: this }))
            this.game.dropItem(t, this.pos[1] + 0.2, s, e);
          this.sound("drop_seed");
        }
        this.stT > 160 &&
          ((this.st = "idle"), (this.stT = 0), (this.digCd = 4800), this.sound("digging_stop"));
      }
    else
      this.stT > 60 &&
        ((this.st = this.canDig() ? "dig" : "idle"),
        (this.stT = 0),
        "dig" === this.st && this.sound("digging"));
  }
  canDig() {
    const t = Math.floor(this.pos[0] - 2.2 * Math.sin(this.bodyYaw)),
      s = Math.floor(this.pos[2] - 2.2 * Math.cos(this.bodyYaw)),
      e = Math.floor(this.pos[1]) - 1,
      i = BLOCKS[this.world.getBlock(t, e, s)].key;
    return /^(dirt|grass_block|podzol|coarse_dirt|rooted_dirt|moss_block|pale_moss_block|mud|muddy_mangrove_roots)$/.test(
      i,
    );
  }
  spawnChild(t) {
    const s = this.game,
      e = Math.floor(this.pos[0]),
      i = Math.floor(this.pos[1]),
      a = Math.floor(this.pos[2]);
    return (
      void 0 !== BID.sniffer_egg &&
        0 === this.world.getBlock(e, i, a) &&
        (this.world.setBlock(e, i, a, BID.sniffer_egg, 0),
        Sound.ev("block.sniffer_egg.plop", this.pos, 1, 1)),
      s.dropXp(this.pos[0], this.pos[1] + 0.5, this.pos[2], randInt(1, 7)),
      null
    );
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, a] = emLimbs(this, s);
    (e.head &&
      ((e.head.yRot = clamp(-(this.headYaw || 0), -0.5, 0.5)),
      (e.head.xRot = clamp(-(this.pitch || 0), -0.3, 0.3))),
      "sniff" === this.st
        ? EM.anim(t, this.pre + "SNIFF_SEARCH", (this.stT + s) / 20)
        : "dig" === this.st
          ? EM.anim(t, this.pre + "DIG", (this.stT + s) / 20)
          : (EM.walk(t, this.pre + "WALK", i, a, 9, 100),
            null != this.anims.SNIFFSNIFF &&
              EM.anim(t, this.pre + "SNIFFSNIFF", (this.age - this.anims.SNIFFSNIFF + s) / 20)));
  }
  texKey(t) {
    return t.etex(this.baby ? "entity/sniffer/snifflet" : "entity/sniffer/sniffer");
  }
}
(defVMob("sniffer", { cls: Sniffer, food: "sniffer_food", xp: 2, shadowR: 1.4, turn: 0.15 }),
  (BLOCK_RANDOM_TICK.sniffer_egg = (t, s, e, i, a, o) => {
    const h = t.world,
      r = +(Features.propOf(a, o, "hatch") || 0),
      n = "moss_block" === BLOCKS[h.getBlock(s, e - 1, i)].key;
    if (!(Math.random() > (n ? 0.5 : 0.25))) {
      if (r < 2)
        return (
          bsetProp(h, s, e, i, "hatch", String(r + 1)),
          void Sound.ev("block.sniffer_egg.crack", [s + 0.5, e, i + 0.5], 1, 1)
        );
      (h.setBlock(s, e, i, 0, 0),
        Sound.ev("block.sniffer_egg.hatch", [s + 0.5, e, i + 0.5], 1, 1),
        spawnAt(t, "sniffer", s + 0.5, e, i + 0.5, !0));
    }
  }));
class Turtle extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a),
      (this.homeP = [Math.floor(e), Math.floor(i), Math.floor(a)]),
      (this.hasEgg = !1),
      (this.digT = 0),
      (this.waterBreather = !0));
  }
  extraSave() {
    return { home: this.homeP, egg: this.hasEgg };
  }
  extraLoad(t) {
    (t.home && (this.homeP = t.home), (this.hasEgg = !!t.egg));
  }
  get ai() {
    return "amph";
  }
  spawnChild(t) {
    return (
      (this.hasEgg = !0),
      this.game.dropXp(this.pos[0], this.pos[1] + 0.5, this.pos[2], randInt(1, 7)),
      null
    );
  }
  think(t) {
    if (this.hasEgg) {
      const [s, e, i] = this.homeP;
      if (Math.hypot(s + 0.5 - this.pos[0], i + 0.5 - this.pos[2]) > 3 || this.inWater)
        return ((t.goal = [s + 0.5, e, i + 0.5]), void (t.mod = 1.2));
      const a = Math.floor(this.pos[0]),
        o = Math.floor(this.pos[1]),
        h = Math.floor(this.pos[2]);
      if (
        /sand$/.test(BLOCKS[this.world.getBlock(a, o - 1, h)].key) &&
        0 === this.world.getBlock(a, o, h)
      )
        return void (
          ++this.digT > 200 &&
          (this.world.setBlock(
            a,
            o,
            h,
            BID.turtle_egg,
            Features.withProp(BID.turtle_egg, 0, "eggs", String(randInt(1, 4))),
          ),
          Sound.ev("entity.turtle.lay_egg", this.pos, 0.3, 1),
          (this.hasEgg = !1),
          (this.digT = 0))
        );
    }
    if (!this.inWater && !this.hasEgg && Math.random() < 0.01) {
      const t = this.findWater();
      t && ((this.goal = t), (this.wanderT = 200));
    }
    VMob.prototype.think.call(this, t);
  }
  findWater() {
    for (let t = 0; t < 20; t++) {
      const t = Math.floor(this.pos[0]) + randInt(-10, 10),
        s = Math.floor(this.pos[2]) + randInt(-10, 10),
        e = Math.floor(this.pos[1]);
      for (let i = 2; i >= -3; i--)
        if (this.world.getBlock(t, e + i, s) === WATER) return [t + 0.5, e + i, s + 0.5];
    }
    return null;
  }
  onGrown() {
    this.game.dropItem(this.pos[0], this.pos[1] + 0.3, this.pos[2], makeStack("turtle_scute", 1));
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, a] = emLimbs(this, s);
    if ((emHead(e.head, this, s), this.inWater)) {
      for (const [t, s] of [
        ["right_hind_leg", 1],
        ["left_hind_leg", -1],
      ])
        e[t] && (e[t].xRot = 0.5 * Math.cos(0.6662 * i * 0.6) * a * s);
      for (const [t, s] of [
        ["right_front_leg", 1],
        ["left_front_leg", -1],
      ])
        e[t] && ((e[t].zRot = 0.5 * Math.cos(0.6662 * i * 0.6 + Math.PI) * a * s), (e[t].xRot = 0));
    } else {
      for (const [t, s] of [
        ["right_hind_leg", 1],
        ["left_hind_leg", -1],
      ])
        e[t] && (e[t].xRot = 2 * Math.cos(0.6662 * i * 5) * a * s);
      for (const [t, s] of [
        ["right_front_leg", 1],
        ["left_front_leg", -1],
      ])
        e[t] &&
          ((e[t].yRot = 8 * Math.cos(0.6662 * i * 5 + Math.PI) * a * s * 0.1), (e[t].zRot = 0));
    }
    (e.egg_belly && (e.egg_belly.visible = this.hasEgg && !this.baby),
      this.digT > 0 && e.egg_belly && (e.egg_belly.visible = !0));
  }
  texKey(t) {
    return t.etex("entity/turtle/turtle" + (this.baby ? "_baby" : ""));
  }
}
(defVMob("turtle", {
  cls: Turtle,
  food: "turtle_food",
  xp: 2,
  shadowR: 0.6,
  speed3: 1.2,
  landSpeedMul: 0.12,
  waterOk: !0,
  sinks: !0,
  walkUnderwater: !1,
  stepSound: !1,
  cull: (t) => "turtle_baby#main" === t.layerKey(),
}),
  (BLOCK_RANDOM_TICK.turtle_egg = (t, s, e, i, a, o) => {
    const h = t.world,
      r = +(Features.propOf(a, o, "hatch") || 0),
      n = +(Features.propOf(a, o, "eggs") || 1);
    if (!/sand$/.test(BLOCKS[h.getBlock(s, e - 1, i)].key)) return;
    if (!t.isDay() || Math.random() < 0.002) {
      if (r < 2)
        return (
          bsetProp(h, s, e, i, "hatch", String(r + 1)),
          void Sound.ev(
            "entity.turtle.egg_crack",
            [s + 0.5, e, i + 0.5],
            0.7,
            0.9 + 0.2 * Math.random(),
          )
        );
      (h.setBlock(s, e, i, 0, 0),
        Sound.ev("entity.turtle.egg_hatch", [s + 0.5, e, i + 0.5], 0.7, 1));
      for (let a = 0; a < n; a++) {
        spawnAt(t, "turtle", s + 0.3 + 0.1 * a, e, i + 0.3, !0).homeP = [s, e, i];
      }
    }
  }));
const frogVariantAt = (t, s, e) => {
  const i = biomeName(t, s, e);
  return /desert|badlands|jungle|savanna|mangrove|warm|nether|crimson|warped|basalt|soul/.test(i)
    ? "warm"
    : /snowy|frozen|ice|grove|jagged|deep_dark|peaks|cold/.test(i)
      ? "cold"
      : "temperate";
};
class Frog extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a),
      (this.variant = frogVariantAt(t, e, a)),
      (this.tongueT = 0),
      (this.jumpT = 0),
      (this.croakT = 0));
  }
  extraSave() {
    return { var: this.variant };
  }
  extraLoad(t) {
    this.variant = t.var || "temperate";
  }
  compVal(t) {
    return "frog/variant" === t ? "minecraft:" + this.variant : void 0;
  }
  get ai() {
    return "amph";
  }
  wantsPlayer() {
    return !1;
  }
  huntTarget() {
    return (this.age + this.id) % 20
      ? null
      : this.game.entities.find(
          (t) =>
            !t.dead &&
            !t.deathTime &&
            (("slime" === t.type && 1 === (t.size || 1)) ||
              ("magma_cube" === t.type && 1 === (t.size || 1))) &&
            t.distTo(this) < 10,
        ) || null;
  }
  findTarget() {
    (this.target && (this.target.dead || this.target.deathTime) && (this.target = null),
      this.target || (this.target = this.huntTarget()));
  }
  fight(t) {
    const s = this.target,
      e = this.distTo(s);
    if (((t.look = s), this.tongueT > 0)) {
      if (5 === --this.tongueT && !s.dead) {
        s.dead = !0;
        const t = rollLoot(s.type, { e: s, src: { attacker: this }, player: !1 });
        for (const s of t) this.game.dropItem(this.pos[0], this.pos[1] + 0.3, this.pos[2], s);
        (this.sound("eat"), (this.target = null));
      }
    } else {
      if (e < 3)
        return (
          (this.tongueT = 10),
          (this.anims = { TONGUE: this.age }),
          void this.sound("tongue")
        );
      ((t.goal = [s.pos[0], s.pos[1], s.pos[2]]), (t.mod = 1.2));
    }
  }
  moveBy(t) {
    if (this.inWater) return VMob.prototype.moveBy.call(this, t);
    if (
      (this.jumpT > 0 && this.jumpT--,
      t.goal &&
        this.onGround &&
        this.jumpT <= 0 &&
        Math.hypot(t.goal[0] - this.pos[0], t.goal[2] - this.pos[2]) > 1.5 &&
        Math.random() < 0.08)
    ) {
      const s = t.goal[0] - this.pos[0],
        e = t.goal[2] - this.pos[2],
        i = Math.hypot(s, e);
      return (
        (this.yaw = Math.atan2(-s, -e)),
        (this.vel[0] = (s / i) * 0.35),
        (this.vel[2] = (e / i) * 0.35),
        (this.vel[1] = 0.5),
        (this.jumpT = 30),
        (this.anims = { JUMP: this.age }),
        this.sound("long_jump"),
        this.travel(0, 0, 0, !1)
      );
    }
    if (!this.onGround) return this.travel(0, 0, 0, !1);
    VMob.prototype.moveBy.call(this, t);
  }
  afterMove() {
    Math.random() < 1 / 400 &&
      this.onGround &&
      !this.inWater &&
      ((this.anims.CROAK = this.age), this.sound("ambient"));
  }
  spawnChild(t) {
    const s = this.game,
      e = this.world,
      i = Math.floor(this.pos[0]),
      a = Math.floor(this.pos[1]),
      o = Math.floor(this.pos[2]);
    for (let t = 0; t < 40; t++) {
      const t = i + randInt(-4, 4),
        h = o + randInt(-4, 4);
      for (let i = a + 2; i >= a - 3; i--)
        if (
          e.getBlock(t, i, h) === WATER &&
          0 === e.getBlock(t, i + 1, h) &&
          void 0 !== BID.frogspawn
        )
          return (
            e.setBlock(t, i + 1, h, BID.frogspawn, 0),
            Sound.ev("entity.frog.lay_spawn", [t, i, h], 1, 1),
            s.dropXp(this.pos[0], this.pos[1] + 0.5, this.pos[2], randInt(1, 7)),
            null
          );
    }
    return null;
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, a] = emLimbs(this, s);
    this.inWater
      ? EM.walk(
          t,
          a > 0.1 ? "FrogAnimation.FROG_SWIM" : "FrogAnimation.FROG_IDLE_WATER",
          a > 0.1 ? i : this.age + s,
          a > 0.1 ? a : 1,
          1,
          2.5,
        )
      : EM.walk(t, "FrogAnimation.FROG_WALK", i, a, 1.5, 2.5);
    for (const e in this.anims)
      EM.anim(t, "FrogAnimation.FROG_" + e, (this.age - this.anims[e] + s) / 20);
    e.croaking_body && null == this.anims.CROAK && (e.croaking_body.visible = !1);
  }
  texKey(t) {
    return t.etex("entity/frog/frog_" + this.variant);
  }
}
defVMob("frog", {
  cls: Frog,
  food: "frog_food",
  xp: 2,
  shadowR: 0.3,
  waterOk: !0,
  swimAcc: 0.011,
  stepSound: !1,
});
class Tadpole extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a), (this.grow = 24e3), (this.waterBreather = !0));
  }
  extraSave() {
    return { grow: this.grow };
  }
  extraLoad(t) {
    t.grow && (this.grow = t.grow);
  }
  think(t) {
    if (--this.grow <= 0) {
      const t = createMob(this.game, "frog", this.pos[0], this.pos[1], this.pos[2]);
      return (
        (t.variant = frogVariantAt(this.game, this.pos[0], this.pos[2])),
        (t.persistent = !0),
        this.game.entities.push(t),
        (this.dead = !0),
        void Sound.ev("entity.tadpole.grow_up", this.pos, 0.15, 1)
      );
    }
    VMob.prototype.think.call(this, t);
  }
  preInteract(t, s) {
    return s && "slime_ball" === ITEMS[s.id].key
      ? ((this.grow -= Math.floor(2400)),
        useOne(this.game, t),
        this.game.particles.spawn(
          "happy_villager",
          this.pos[0],
          this.pos[1] + 0.3,
          this.pos[2],
          0,
          0.05,
          0,
        ),
        !0)
      : !(!s || "water_bucket" !== ITEMS[s.id].key) &&
          (swapHeld(this.game, t, "tadpole_bucket", { mob: { grow: this.grow } }),
          (this.dead = !0),
          Sound.ev("item.bucket.fill_tadpole", this.pos, 1, 1),
          !0);
  }
  setupAnim(t, s) {
    const e = t.parts;
    e.tail &&
      (e.tail.yRot =
        0.25 * -Math.sin((this.age + s) * (this.inWater ? 1.3 : 1.7)) * (this.inWater ? 1 : 2));
  }
  texKey(t) {
    return t.etex("entity/tadpole/tadpole");
  }
}
(defVMob("tadpole", {
  cls: Tadpole,
  ai: "swim",
  xp: 0,
  shadowR: 0.15,
  dryOut: 100,
  stepSound: !1,
  swimAcc: 0.005,
  panicMod: 2,
}),
  (BLOCK_RANDOM_TICK.frogspawn = (t, s, e, i) => {
    if (!(Math.random() > 0.15)) {
      (t.world.setBlock(s, e, i, 0, 0),
        Sound.ev("block.frogspawn.hatch", [s + 0.5, e, i + 0.5], 1, 1));
      for (let a = 0, o = randInt(2, 6); a < o; a++)
        spawnAt(t, "tadpole", s + Math.random(), e - 0.5, i + Math.random());
    }
  }));
class Bat extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a), (this.resting = !1), (this.persistent = !1));
  }
  think(t) {
    const s = this.world,
      e = Math.floor(this.pos[0]),
      i = Math.floor(this.pos[1] + this.h + 0.1),
      a = Math.floor(this.pos[2]);
    if (this.resting) {
      this.vel = [0, 0, 0];
      const t = this.game.player;
      return void (
        (!SOLIDCUBE[s.getBlock(e, i, a)] ||
          (!t.sneaking && this.distTo(t) < 4 && !t.creative) ||
          Math.random() < 5e-4) &&
        ((this.resting = !1), (this.anims = {}), this.sound("takeoff", 0.05))
      );
    }
    ((!this.goal || this.near(this.goal, 2) || Math.random() < 0.03) &&
      (this.goal = [
        this.pos[0] + randInt(-7, 7),
        this.pos[1] + randInt(-2, 4),
        this.pos[2] + randInt(-7, 7),
      ]),
      (t.goal = this.goal),
      SOLIDCUBE[s.getBlock(e, i, a)] &&
        Math.random() < 0.01 &&
        ((this.resting = !0), (this.pos[1] = i - this.h), (this.goal = null)));
  }
  setupAnim(t, s) {
    this.resting
      ? EM.anim(t, "BatAnimation.BAT_RESTING", (this.age + s) / 20)
      : EM.anim(t, "BatAnimation.BAT_FLYING", (this.age + s) / 20);
    const e = t.parts;
    e.head &&
      !this.resting &&
      ((e.head.yRot = -(this.headYaw || 0)), (e.head.xRot = -(this.pitch || 0)));
  }
  texKey(t) {
    return t.etex("entity/bat/bat");
  }
  preDraw(t, s) {
    this.resting || M4.translate(t, 0, 0.1 * Math.cos(0.3 * (this.age + s)), 0);
  }
}
defVMob("bat", {
  cls: Bat,
  ai: "fly",
  xp: 0,
  scale: 1,
  shadowR: 0.2,
  speed3: 1.4,
  idleT: 80,
  stepSound: !1,
  vol: 0.1,
  cull: !0,
});
const PARROT_COLORS = ["red_blue", "blue", "green", "yellow_blue", "grey"];
class Parrot extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a), (this.variant = randInt(0, 4)), (this.flapT = 0), (this.dance = !1));
  }
  extraSave() {
    return { var: this.variant };
  }
  extraLoad(t) {
    ((this.variant = 0 | t.var), this.owner && (this.persistent = !0));
  }
  get ai() {
    return (this.onGround && !this.goal && !this.owner) || this.sitting ? "ground" : "fly";
  }
  wantsPlayer() {
    return !1;
  }
  canBreed() {
    return !1;
  }
  think(t) {
    const s = this.game,
      e = s.player;
    if (
      ((this.dance = !(
        !s.jukeboxes ||
        ![...s.jukeboxes.values()].some(
          (t) =>
            t.playing &&
            Math.hypot(t.x + 0.5 - this.pos[0], t.y - this.pos[1], t.z + 0.5 - this.pos[2]) < 3.5,
        )
      )),
      !this.dance && !this.sitting)
    ) {
      if (
        this.owner === e &&
        !e.shoulder &&
        this.distTo(e) < 2 &&
        e.onGround &&
        !e.inWater &&
        !this.baby &&
        Math.random() < 0.05 &&
        this.age > (this.offShoulderT || 0) + 60
      )
        return (
          (e.shoulder = { variant: this.variant, name: this.customName, health: this.health }),
          (this.dead = !0),
          void Sound.ev("entity.parrot.step", this.pos, 0.5, 1)
        );
      if (
        (!this.owner || !PetMixin.followOwner.call(this, t)) &&
        ((!this.goal || this.near(this.goal, 1.5) || Math.random() < 0.01) &&
          (this.goal = this.randomGoal(8, 4)),
        (t.goal = this.goal),
        Math.random() < 1 / 400)
      ) {
        const t = s.entities.find((t) => t instanceof Mob && t.T.hostile && t.distTo(this) < 20);
        t && Sound.ev("entity.parrot.imitate." + t.type, this.pos, 0.7, 1.8);
      }
    }
  }
  preInteract(t, s) {
    const e = this.game;
    return "cookie" === (s && ITEMS[s.id].key)
      ? (useOne(e, t), this.hurt(1e3, { type: "poison", attacker: t }), !0)
      : !this.owner && s && isFood("parrot_food", s.id)
        ? (useOne(e, t), this.sound("eat"), tryTame(this, t, 0.1), !0)
        : !(this.owner !== t || (s && isFood("parrot_food", s.id))) &&
          ((this.sitting = !this.sitting), (this.goal = null), !0);
  }
  setupAnim(t, s) {
    parrotAnim(
      t,
      this,
      s,
      this.dance ? "party" : this.sitting ? "sit" : this.onGround ? "stand" : "fly",
    );
  }
  texKey(t) {
    return t.etex("entity/parrot/parrot_" + PARROT_COLORS[0 | this.variant]);
  }
}
function parrotAnim(t, s, e, i) {
  const a = t.parts,
    o = (s.age || 0) + e,
    [h, r] = emLimbs(s, e);
  if (
    (a.head && ((a.head.xRot = -(s.pitch || 0)), (a.head.yRot = -(s.headYaw || 0))), "fly" === i)
  ) {
    const t = 0.6 * Math.sin(0.9 * o) + 0.7;
    (a.left_wing && (a.left_wing.zRot = -0.0873 - t),
      a.right_wing && (a.right_wing.zRot = 0.0873 + t),
      a.left_leg && (a.left_leg.xRot = 0.7),
      a.right_leg && (a.right_leg.xRot = 0.7));
  } else if ("sit" === i || "shoulder" === i) {
    for (const t of ["head", "body", "tail", "left_wing", "right_wing"]) a[t] && (a[t].y += 1.9);
    for (const t of ["left_leg", "right_leg"])
      a[t] && ((a[t].y += 1.9), (a[t].xRot = Math.PI / 2), (a[t].z -= 1));
    a.tail && (a.tail.xRot += Math.PI / 6);
  } else if ("party" === i) {
    const t = 0.15 * Math.sin(0.4 * o);
    for (const s of ["head", "body", "tail", "left_wing", "right_wing"])
      a[s] && ((a[s].y += 8 * t), (a[s].x += 1.2 * Math.cos(0.4 * o)));
    a.head && (a.head.zRot = 0.4 * Math.cos(0.4 * o));
  } else
    (a.left_leg && (a.left_leg.xRot = 1.4 * Math.cos(0.6662 * h) * r),
      a.right_leg && (a.right_leg.xRot = 1.4 * Math.cos(0.6662 * h + Math.PI) * r));
}
(defVMob("parrot", {
  cls: Parrot,
  food: "parrot_food",
  xp: 2,
  shadowR: 0.3,
  speed3: 1,
  hover: !0,
  stepSound: !1,
}),
  (() => {
    const t = Player.prototype.tick;
    Player.prototype.tick = function (s) {
      const e = t.call(this, s),
        i = this.shoulder;
      if (
        i &&
        (this.inWater ||
          this.flying ||
          this.fallDist > 0.5 ||
          this.hurtTime > 0 ||
          (this.sneaking && s && s.jump) ||
          this.deathTime)
      ) {
        const t = createMob(this.game, "parrot", this.pos[0], this.pos[1] + 1.5, this.pos[2]);
        ((t.variant = i.variant),
          (t.owner = this),
          (t.persistent = !0),
          i.name && (t.customName = i.name),
          i.health && (t.health = i.health),
          (t.offShoulderT = t.age),
          this.game.entities.push(t),
          (this.shoulder = null));
      }
      return e;
    };
    const s = Game.prototype.drawMob;
    Game.prototype.drawMob = function (t, e, i, a, o) {
      const h = s.call(this, t, e, i, a, o);
      if (t === this.player && t.shoulder && 0 !== this.perspective) {
        const s = this.renderer,
          h = EM.get(s, "parrot#main"),
          r = s.etex("entity/parrot/parrot_" + PARROT_COLORS[0 | t.shoulder.variant]);
        if (h && r) {
          const n = M4.create();
          (M4.translate(n, e[0], e[1], e[2]),
            M4.rotY(n, t.yaw),
            t.sneaking && M4.translate(n, 0, -0.2, 0),
            M4.translate(n, 0.4, 1.3625, 0),
            EM.reset(h),
            parrotAnim(
              h,
              { age: this.player.age, pitch: 0, headYaw: 0, limbAmt: 0, limbSwing: 0 },
              i,
              "shoulder",
            ),
            s.drawEM(h, r, n, [o[0], o[1]], a, {}));
        }
      }
      return h;
    };
  })());
const isFlower = (t) =>
    /^(dandelion|poppy|blue_orchid|allium|azure_bluet|\w+_tulip|oxeye_daisy|cornflower|lily_of_the_valley|wither_rose|sunflower|lilac|rose_bush|peony|torchflower|pitcher_plant|pink_petals|wildflowers|flowering_azalea|flowering_azalea_leaves|spore_blossom|cherry_leaves|mangrove_propagule|chorus_flower|open_eyeblossom|cactus_flower|golden_dandelion)$/.test(
      t,
    ),
  isHive = (t) => "beehive" === t || "bee_nest" === t;
class Bee extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a),
      (this.nectar = !1),
      (this.stung = !1),
      (this.hive = null),
      (this.flower = null),
      (this.pollT = 0),
      (this.stingT = 0),
      (this.persistent = !0));
  }
  extraSave() {
    return { nec: this.nectar, hive: this.hive, st: this.stung };
  }
  extraLoad(t) {
    ((this.nectar = !!t.nec), (this.hive = t.hive || null), (this.stung = !!t.st));
  }
  get angry() {
    return this.anger > 0 && !!this.target;
  }
  wantsPlayer() {
    return !1;
  }
  onAttacked(t) {
    for (const s of this.game.entities)
      s instanceof Bee &&
        s !== this &&
        s.distTo(this) < 16 &&
        !s.stung &&
        ((s.target = t.attacker), (s.anger = 400));
  }
  findTarget() {
    this.target &&
      (this.target.dead || this.target.deathTime || this.anger <= 0) &&
      (this.target = null);
  }
  melee(t) {
    if (
      !this.stung &&
      ((this.attackCd = 20), t.hurt(2, { type: "mob", attacker: this, knockFrom: this.pos }))
    ) {
      const s = this.game.difficulty;
      (s >= 2 && t.addEffect && t.addEffect("poison", 0, 20 * (3 === s ? 18 : 10)),
        (this.stung = !0),
        (this.stingT = 1200 + randInt(0, 100)),
        (this.target = null),
        (this.anger = 0),
        this.sound("sting"));
    }
  }
  think(t) {
    const s = this.game,
      e = this.world;
    if (this.stung && --this.stingT <= 0) return void this.hurt(1e3, { type: "generic" });
    if (this.target) return void this.fight(t);
    if (!this.hive && this.age % 100 == 0) {
      const t = Math.floor(this.pos[0]),
        s = Math.floor(this.pos[1]),
        i = Math.floor(this.pos[2]);
      for (let a = -10; a <= 10 && !this.hive; a++)
        for (let o = -5; o <= 5 && !this.hive; o++)
          for (let h = -10; h <= 10 && !this.hive; h++)
            isHive(BLOCKS[e.getBlock(t + a, s + o, i + h)].key) &&
              (this.hive = [t + a, s + o, i + h]);
    }
    const i = !s.isDay() || s.weather > 0.5;
    if (this.hive && (this.nectar || i)) {
      const [i, a, o] = this.hive;
      return isHive(BLOCKS[e.getBlock(i, a, o)].key)
        ? Math.hypot(i + 0.5 - this.pos[0], a + 0.5 - this.pos[1], o + 0.5 - this.pos[2]) < 1.6
          ? void beeEnterHive(s, this)
          : void (t.goal = [i + 0.5, a + 0.5, o + 0.5])
        : void (this.hive = null);
    }
    if (!this.nectar && !i) {
      if (this.flower) {
        const [s, i, a] = this.flower;
        if (!isFlower(BLOCKS[e.getBlock(s, i, a)].key)) return void (this.flower = null);
        const o = Math.hypot(s + 0.5 - this.pos[0], i + 0.6 - this.pos[1], a + 0.5 - this.pos[2]);
        return (
          (t.goal = [s + 0.5, i + 0.6, a + 0.5]),
          void (
            o < 0.8 &&
            ++this.pollT > 400 &&
            ((this.nectar = !0), (this.flower = null), (this.pollT = 0))
          )
        );
      }
      if (this.age % 40 == 0) {
        const t = Math.floor(this.pos[0]),
          s = Math.floor(this.pos[1]),
          i = Math.floor(this.pos[2]);
        for (let a = 0; a < 40; a++) {
          const a = t + randInt(-8, 8),
            o = s + randInt(-3, 3),
            h = i + randInt(-8, 8);
          if (isFlower(BLOCKS[e.getBlock(a, o, h)].key)) {
            this.flower = [a, o, h];
            break;
          }
        }
      }
    }
    if (this.nectar && this.age % 30 == 0) {
      const t = Math.floor(this.pos[0]),
        s = Math.floor(this.pos[2]);
      for (let i = 1; i <= 2; i++) {
        const a = Math.floor(this.pos[1]) - i,
          o = e.getBlock(t, a, s),
          h = Features.propOf(o, e.getMeta(t, a, s), "age");
        if (
          null != h &&
          /^(wheat|carrots|potatoes|beetroots|melon_stem|pumpkin_stem|sweet_berry_bush|cave_vines)$/.test(
            BLOCKS[o].key,
          ) &&
          Math.random() < 0.3
        ) {
          +h < ("beetroots" === BLOCKS[o].key || "sweet_berry_bush" === BLOCKS[o].key ? 3 : 7) &&
            bsetProp(e, t, a, s, "age", String(+h + 1));
        }
      }
    }
    ((!this.goal || this.near(this.goal, 1.2) || Math.random() < 0.01) &&
      (this.goal = this.randomGoal(8, 3)),
      (t.goal = this.goal));
  }
  setupAnim(t, s) {
    const e = t.parts,
      i = this.age + s,
      a = Math.cos(2.1 * i) * Math.PI * 0.15;
    (e.right_wing && ((e.right_wing.xRot = 0), (e.right_wing.zRot = a)),
      e.left_wing && ((e.left_wing.xRot = 0), (e.left_wing.zRot = -a)));
    for (const t of ["front_legs", "middle_legs", "back_legs"]) e[t] && (e[t].xRot = Math.PI / 4);
    (e.bone &&
      !this.angry &&
      ((e.bone.xRot = 0.1 + 0.05 * Math.cos(0.18 * i)), (e.bone.y = 19 - 0.9 * Math.cos(0.18 * i))),
      e.stinger && (e.stinger.visible = !this.stung));
  }
  texKey(t) {
    return t.etex(
      "entity/bee/bee" +
        (this.angry ? "_angry" : "") +
        (this.nectar ? "_nectar" : "") +
        (this.baby ? "_baby" : ""),
    );
  }
  ambientKind() {
    return this.angry ? "loop_aggressive" : "loop";
  }
}
function beeEnterHive(t, s) {
  const [e, i, a] = s.hive,
    o = t.getBlockEntity(e, i, a, "hive");
  if (((o.bees = o.bees || []), o.bees.length >= 3)) s.goal = null;
  else {
    if ((o.bees.push({ nec: s.nectar, t: 0, name: s.customName, h: s.health }), s.nectar)) {
      const s = +(bprop(t.world, e, i, a, "honey_level") || 0);
      s < 5 && bsetProp(t.world, e, i, a, "honey_level", String(s + 1));
    }
    ((s.dead = !0), Sound.ev("block.beehive.enter", [e + 0.5, i + 0.5, a + 0.5], 1, 1));
  }
}
(defVMob("bee", {
  cls: Bee,
  ai: "fly",
  food: "bee_food",
  xp: 2,
  shadowR: 0.3,
  speed3: 1,
  idleT: 60,
  stepSound: !1,
  vol: 0.3,
}),
  (() => {
    const t = Game.prototype.tick;
    Game.prototype.tick = function (...s) {
      const e = t.apply(this, s);
      if (this.net || !this.blockEntities || this.tickCount % 20) return e;
      const i = this.isDay() && this.weather < 0.5;
      for (const t of this.blockEntities.values()) {
        if ("hive" !== t.type || !t.bees || !t.bees.length) continue;
        const [s, e, a] = t.pos;
        if (!this.world.isLoaded(s, a) || !isHive(BLOCKS[this.world.getBlock(s, e, a)].key))
          continue;
        for (const s of t.bees) s.t += 20;
        if (!i) continue;
        const o = t.bees.filter((t) => t.t > 600);
        t.bees = t.bees.filter((t) => t.t <= 600);
        for (const t of o) {
          const i = createMob(this, "bee", s + 0.5, e + 1.1, a + 0.5);
          ((i.hive = [s, e, a]),
            (i.nectar = !1),
            t.name && (i.customName = t.name),
            t.h && (i.health = t.h),
            this.entities.push(i),
            Sound.ev("block.beehive.exit", [s + 0.5, e + 0.5, a + 0.5], 1, 1));
        }
      }
      return e;
    };
  })());
class Allay extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a),
      (this.item = null),
      (this.liked = null),
      (this.throwCd = 0),
      (this.dance = !1),
      (this.persistent = !0));
  }
  extraSave() {
    return { item: this.item, liked: this.liked ? 1 : 0 };
  }
  extraLoad(t) {
    ((this.item = t.item || null), t.liked && (this.liked = this.game.player));
  }
  wantsPlayer() {
    return !1;
  }
  hurt(t, s) {
    return (!s || s.attacker !== this.liked) && super.hurt(t, s);
  }
  think(t) {
    const s = this.game;
    ((this.dance = !(
      !s.jukeboxes ||
      ![...s.jukeboxes.values()].some(
        (t) =>
          t.playing &&
          Math.hypot(t.x + 0.5 - this.pos[0], t.y - this.pos[1], t.z + 0.5 - this.pos[2]) < 8,
      )
    )),
      this.throwCd > 0 && this.throwCd--);
    const e = this.liked;
    if (this.item && e && !e.dead) {
      const i = this.carried;
      if (i && this.distTo(e) < 2.5 && this.throwCd <= 0)
        return (
          s.dropItem(this.pos[0], this.pos[1] + 0.3, this.pos[2], i, [
            0.1 * (e.pos[0] - this.pos[0]),
            0.2,
            0.1 * (e.pos[2] - this.pos[2]),
          ]),
          (this.carried = null),
          (this.throwCd = 60),
          void this.sound("throw")
        );
      if (!i || i.count < maxStack(i.id)) {
        const e = s.entities.find(
          (t) =>
            t instanceof ItemEntity &&
            !t.dead &&
            t.pickup <= 0 &&
            sameKind(t.stack, this.item) &&
            t.distTo(this) < 32,
        );
        if (e)
          return this.distTo(e) < 1.2
            ? (i ? (i.count += e.stack.count) : (this.carried = { ...e.stack }),
              (e.dead = !0),
              void this.sound("item_taken"))
            : void (t.goal = [e.pos[0], e.pos[1] + 0.5, e.pos[2]]);
      }
      return this.distTo(e) > 3
        ? ((t.goal = [e.pos[0], e.pos[1] + 1.5, e.pos[2]]), void (t.mod = i ? 1.4 : 1))
        : void (t.look = e);
    }
    ((!this.goal || this.near(this.goal, 1.2) || Math.random() < 0.01) &&
      (this.goal = this.randomGoal(8, 3)),
      (t.goal = this.goal));
  }
  preInteract(t, s) {
    const e = this.game;
    return !this.item && s
      ? ((this.item = { ...s, count: 1 }),
        (this.liked = t),
        useOne(e, t),
        this.sound("item_given"),
        !0)
      : !(!this.item || s) &&
          (e.dropItem(this.pos[0], this.pos[1] + 0.5, this.pos[2], this.item),
          this.carried && e.dropItem(this.pos[0], this.pos[1] + 0.5, this.pos[2], this.carried),
          (this.item = null),
          (this.carried = null),
          (this.liked = null),
          this.sound("item_taken"),
          !0);
  }
  dropsOnDeath() {
    return [this.item, this.carried];
  }
  setupAnim(t, s) {
    const e = t.parts,
      i = this.age + s,
      a = 0.5 * Math.cos(0.9 * i) + 0.6;
    if (
      (e.right_wing &&
        ((e.right_wing.yRot = 0.4 * a - 0.785),
        (e.right_wing.xRot = 0.43),
        (e.right_wing.zRot = -0.47)),
      e.left_wing &&
        ((e.left_wing.yRot = 0.785 - 0.4 * a),
        (e.left_wing.xRot = 0.43),
        (e.left_wing.zRot = 0.47)),
      e.head && ((e.head.yRot = -(this.headYaw || 0)), (e.head.xRot = -(this.pitch || 0))),
      e.body && (e.body.xRot = 0.2),
      this.item)
    )
      for (const t of ["right_arm", "left_arm"])
        e[t] && ((e[t].xRot = -1), (e[t].yRot = "right_arm" === t ? 0.2 : -0.2));
    (this.dance &&
      e.head &&
      ((e.head.zRot = 0.3 * Math.sin(0.5 * i)), e.body && (e.body.yRot = 0.4 * Math.sin(0.25 * i))),
      e.root && (e.root.y = 23.5 + 0.8 * Math.cos(0.15 * i)));
  }
  texKey(t) {
    return t.etex("entity/allay/allay");
  }
  attachments(t, s, e, i) {
    const a = this.carried || this.item;
    return a
      ? {
          body: (s) => {
            (M4.translate(s, 0, 0.3, -0.3),
              M4.scale(s, 0.6, 0.6, 0.6),
              t.drawHeldItem(s, a, !1, e, i, this, null));
          },
        }
      : null;
  }
}
defVMob("allay", { cls: Allay, ai: "fly", xp: 0, shadowR: 0.25, bright: !1, stepSound: !1 });
class SnowGolem extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a), (this.pumpkin = !0));
  }
  extraSave() {
    return { pk: this.pumpkin };
  }
  extraLoad(t) {
    this.pumpkin = !1 !== t.pk;
  }
  wantsPlayer() {
    return !1;
  }
  huntTarget() {
    return (this.age + this.id) % 10
      ? null
      : this.game.entities.find(
          (t) =>
            t instanceof Mob &&
            t.T.hostile &&
            "creeper" !== t.type &&
            !t.dead &&
            !t.deathTime &&
            t.distTo(this) < 10 &&
            this.canSee(t),
        ) || null;
  }
  findTarget() {
    (this.target &&
      (this.target.dead || this.target.deathTime || this.distTo(this.target) > 16) &&
      (this.target = null),
      this.target || (this.target = this.huntTarget()));
  }
  ranged(t, s, e) {
    (e > 8 && (t.goal = [s.pos[0], s.pos[1], s.pos[2]]),
      this.attackCd <= 0 &&
        e < 10 &&
        ((this.attackCd = 20),
        shootAt(this, s, 1.6, {
          layer: ITEMS[ITEM_KEY.snowball].tex,
          grav: 0.03,
          arc: 0.2,
          yk: 0.85,
          onHit: (t) => {
            t.hurt("blaze" === t.type ? 3 : 1e-4, {
              type: "mob",
              attacker: this,
              knockFrom: this.pos,
              knock: 0.4,
            });
          },
        }),
        Sound.ev("entity.snow_golem.shoot", this.pos, 1, 0.4 / (0.4 * Math.random() + 0.8))));
  }
  afterMove() {
    const t = this.game,
      s = this.world,
      e = Math.floor(this.pos[0]),
      i = Math.floor(this.pos[1]),
      a = Math.floor(this.pos[2]),
      o = biomeName(t, e, a),
      h = /desert|badlands|savanna|jungle|nether|crimson|warped|basalt|soul|mangrove|warm/.test(o);
    ((h || this.inWater || (t.weather > 0.5 && s.skyAt(e, i + 2, a) >= 15)) &&
      this.age % 20 == 0 &&
      this.hurt(1, { type: "melt" }),
      !h &&
        !1 !== t.rule("mob_griefing") &&
        void 0 !== BID.snow &&
        0 === s.getBlock(e, i, a) &&
        SOLIDCUBE[s.getBlock(e, i - 1, a)] &&
        this.age % 4 == 0 &&
        s.setBlock(e, i, a, BID.snow, 0));
  }
  postInteract(t, s) {
    return (
      !(!s || "shears" !== ITEMS[s.id].key || !this.pumpkin) &&
      ((this.pumpkin = !1),
      this.game.dropItem(
        this.pos[0],
        this.pos[1] + 1.7,
        this.pos[2],
        makeStack("carved_pumpkin", 1),
      ),
      Sound.ev("entity.snow_golem.shear", this.pos, 1, 1),
      this.game.damageHeld(1),
      !0)
    );
  }
  setupAnim(t, s) {
    const e = t.parts;
    (emHead(e.head, this, s),
      e.upper_body && (e.upper_body.yRot = 0.25 * (e.head ? e.head.yRot : 0)));
    const i = Math.sin(e.upper_body ? e.upper_body.yRot : 0),
      a = Math.cos(e.upper_body ? e.upper_body.yRot : 0);
    (e.left_arm &&
      ((e.left_arm.x = 5 * a), (e.left_arm.z = 5 * -i), (e.left_arm.yRot = e.upper_body.yRot)),
      e.right_arm &&
        ((e.right_arm.x = 5 * -a),
        (e.right_arm.z = 5 * i),
        (e.right_arm.yRot = e.upper_body.yRot + Math.PI)));
  }
  texKey(t) {
    return t.etex("entity/snow_golem/snow_golem");
  }
  drawLayers(t, s, e, i, a, o, h) {
    if (!this.pumpkin || !t.blockMesh || void 0 === BID.carved_pumpkin) return;
    const r = e.parts.head;
    if (!r) return;
    const n = M4.copy(i);
    (M4.scale(n, -1, -1, 1),
      M4.translate(n, 0, -1.501, 0),
      M4.translate(n, r.x / 16, r.y / 16, r.z / 16),
      M4.rotY(n, r.yRot),
      M4.rotX(n, r.xRot),
      M4.translate(n, 0, -0.34375, 0),
      M4.rotY(n, Math.PI),
      M4.scale(n, 0.625, -0.625, -0.625),
      M4.translate(n, -0.5, -0.5, -0.5),
      s.drawMesh(t.blockMesh(BID.carved_pumpkin, 0), n, o, h));
  }
}
defVMob("snow_golem", {
  cls: SnowGolem,
  xp: 0,
  shadowR: 0.4,
  T: { passive: !1, hostile: !1 },
  immune: ["fall"],
});
const GOLEM_OX = ["", "_exposed", "_weathered", "_oxidized"];
class CopperGolem extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a),
      (this.ox = 0),
      (this.waxed = !1),
      (this.oxT = 24e3 + randInt(0, 24e3)),
      (this.carry = null),
      (this.task = null),
      (this.taskT = 0));
  }
  extraSave() {
    return { ox: this.ox, wax: this.waxed, carry: this.carry };
  }
  extraLoad(t) {
    ((this.ox = 0 | t.ox), (this.waxed = !!t.wax), (this.carry = t.carry || null));
  }
  wantsPlayer() {
    return !1;
  }
  dropsOnDeath() {
    return [this.carry];
  }
  chestsNear(t) {
    const s = this.game,
      e = [];
    for (const i of s.blockEntities.values()) {
      if ("chest" !== i.type || !i.slots) continue;
      const [s, a, o] = i.pos;
      if (
        Math.abs(s - this.pos[0]) > 16 ||
        Math.abs(a - this.pos[1]) > 8 ||
        Math.abs(o - this.pos[2]) > 16
      )
        continue;
      const h = BLOCKS[this.world.getBlock(s, a, o)].key;
      /copper_chest$/.test(h) === t && /chest$/.test(h) && e.push(i);
    }
    return e.sort(
      (t, s) =>
        Math.hypot(t.pos[0] - this.pos[0], t.pos[2] - this.pos[2]) -
        Math.hypot(s.pos[0] - this.pos[0], s.pos[2] - this.pos[2]),
    );
  }
  think(t) {
    if (
      (!this.waxed &&
        this.ox < 3 &&
        --this.oxT <= 0 &&
        (this.ox++, (this.oxT = 24e3 + randInt(0, 24e3))),
      3 === this.ox &&
        !this.waxed &&
        Math.random() < 5e-5 &&
        void 0 !== BID.oxidized_copper_golem_statue)
    ) {
      const t = Math.floor(this.pos[0]),
        s = Math.floor(this.pos[1]),
        e = Math.floor(this.pos[2]);
      if (0 === this.world.getBlock(t, s, e))
        return (
          this.world.setBlock(t, s, e, BID.oxidized_copper_golem_statue, 0),
          void (this.dead = !0)
        );
    }
    if (this.taskT > 0) return void this.taskT--;
    const s = [1, 0.9, 0.8, 0.7][this.ox];
    if (this.age % 20 == 0 && !this.task)
      if (this.carry) {
        const t =
          this.chestsNear(!1).find(
            (t) =>
              t.slots.some((t) => t && sameKind(t, this.carry) && t.count < maxStack(t.id)) ||
              t.slots.every((t) => !t),
          ) || this.chestsNear(!1).find((t) => t.slots.some((t) => !t));
        t && (this.task = { be: t, take: !1 });
      } else {
        const t = this.chestsNear(!0).find((t) => t.slots.some((t) => t));
        t && (this.task = { be: t, take: !0 });
      }
    if (this.task) {
      const e = this.task.be,
        [i, a, o] = e.pos;
      if (
        Math.hypot(i + 0.5 - this.pos[0], o + 0.5 - this.pos[2]) < 1.8 &&
        Math.abs(a - this.pos[1]) < 2
      ) {
        if (((t.look = [i + 0.5, a + 0.5, o + 0.5]), this.task.take)) {
          const t = e.slots.findIndex((t) => t);
          if (t >= 0) {
            const s = e.slots[t],
              i = Math.min(16, s.count);
            ((this.carry = { ...s, count: i }),
              (s.count -= i),
              s.count || (e.slots[t] = null),
              (this.anims = { CHEST_INTERACTION_NOITEM_GET: this.age }),
              Sound.ev("entity.copper_golem.item_get", this.pos, 1, 1));
          }
        } else {
          const t = chestInsert(e.slots, this.carry);
          ((this.carry = t ? { ...this.carry, count: t } : null),
            (this.anims = { CHEST_INTERACTION_ITEM_DROP: this.age }),
            Sound.ev("entity.copper_golem.item_drop", this.pos, 1, 1));
        }
        return ((this.task = null), void (this.taskT = 60));
      }
      return ((t.goal = [i + 0.5, a, o + 0.5]), void (t.mod = s));
    }
    (VMob.prototype.think.call(this, t), (t.mod *= s));
  }
  postInteract(t, s) {
    const e = this.game,
      i = s && ITEMS[s.id].key;
    if ("honeycomb" === i && !this.waxed)
      return (
        (this.waxed = !0),
        useOne(e, t),
        Sound.ev("item.honeycomb.wax_on", this.pos, 1, 1),
        !0
      );
    if (i && /_axe$/.test(i)) {
      if (this.waxed)
        return (
          (this.waxed = !1),
          Sound.ev("item.axe.wax_off", this.pos, 1, 1),
          e.damageHeld(1),
          !0
        );
      if (this.ox > 0)
        return (this.ox--, Sound.ev("item.axe.scrape", this.pos, 1, 1), e.damageHeld(1), !0);
    }
    return !1;
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, a] = emLimbs(this, s),
      o = "CopperGolemAnimation.COPPER_GOLEM_";
    (emHead(e.head, this, s),
      a > 0.05
        ? EM.walk(t, o + (this.carry ? "WALK_ITEM" : "WALK"), i, a, 2, 2.5)
        : EM.anim(t, o + "IDLE", (this.age + s) / 20));
    for (const e in this.anims) EM.anim(t, o + e, (this.age - this.anims[e] + s) / 20);
  }
  texKey(t) {
    return t.etex("entity/copper_golem/copper_golem" + GOLEM_OX[this.ox]);
  }
  drawLayers(t, s, e, i, a, o) {
    const h = s.etex("entity/copper_golem/copper_golem_eyes" + GOLEM_OX[this.ox]),
      r = EM.get(s, "copper_golem#eyes");
    h && r && (EM.reset(r), EM.copy(e, r), s.drawEMGlow(r, h, i, o, {}));
  }
  attachments(t, s, e, i) {
    const a = this.carry;
    return a
      ? {
          body: (s) => {
            (M4.translate(s, 0, 0.1, -0.35),
              M4.scale(s, 0.7, 0.7, 0.7),
              t.drawHeldItem(s, a, !1, e, i, this, null));
          },
        }
      : null;
  }
}
function chestInsert(t, s) {
  let e = s.count;
  for (const i of t)
    if (i && sameKind(i, s) && i.count < maxStack(i.id)) {
      const t = Math.min(e, maxStack(i.id) - i.count);
      if (((i.count += t), (e -= t), !e)) return 0;
    }
  for (let i = 0; i < t.length; i++) if (!t[i]) return ((t[i] = { ...s, count: e }), 0);
  return e;
}
defVMob("copper_golem", { cls: CopperGolem, xp: 0, shadowR: 0.35, T: { passive: !0 } });
const WT_SELL = [
    ["sea_pickle", 1, 2],
    ["slime_ball", 1, 4],
    ["glowstone", 1, 2],
    ["nautilus_shell", 5, 1],
    ["fern", 1, 1],
    ["sugar_cane", 1, 1],
    ["pumpkin", 1, 1],
    ["kelp", 3, 1],
    ["cactus", 3, 1],
    ["dandelion", 1, 1],
    ["poppy", 1, 1],
    ["blue_orchid", 1, 1],
    ["allium", 1, 1],
    ["azure_bluet", 1, 1],
    ["red_tulip", 1, 1],
    ["orange_tulip", 1, 1],
    ["white_tulip", 1, 1],
    ["pink_tulip", 1, 1],
    ["oxeye_daisy", 1, 1],
    ["cornflower", 1, 1],
    ["lily_of_the_valley", 1, 1],
    ["open_eyeblossom", 1, 1],
    ["wheat_seeds", 1, 1],
    ["beetroot_seeds", 1, 1],
    ["pumpkin_seeds", 1, 1],
    ["melon_seeds", 1, 1],
    ["acacia_sapling", 5, 1],
    ["birch_sapling", 5, 1],
    ["dark_oak_sapling", 5, 1],
    ["jungle_sapling", 5, 1],
    ["oak_sapling", 5, 1],
    ["spruce_sapling", 5, 1],
    ["cherry_sapling", 5, 1],
    ["pale_oak_sapling", 5, 1],
    ["mangrove_propagule", 5, 1],
    ["red_dye", 1, 3],
    ["white_dye", 1, 3],
    ["blue_dye", 1, 3],
    ["pink_dye", 1, 3],
    ["black_dye", 1, 3],
    ["green_dye", 1, 3],
    ["light_gray_dye", 1, 3],
    ["magenta_dye", 1, 3],
    ["yellow_dye", 1, 3],
    ["gray_dye", 1, 3],
    ["purple_dye", 1, 3],
    ["light_blue_dye", 1, 3],
    ["lime_dye", 1, 3],
    ["orange_dye", 1, 3],
    ["brown_dye", 1, 3],
    ["cyan_dye", 1, 3],
    ["brain_coral_block", 3, 1],
    ["bubble_coral_block", 3, 1],
    ["fire_coral_block", 3, 1],
    ["horn_coral_block", 3, 1],
    ["tube_coral_block", 3, 1],
    ["vine", 1, 3],
    ["brown_mushroom", 1, 3],
    ["red_mushroom", 1, 3],
    ["lily_pad", 1, 5],
    ["small_dripleaf", 1, 2],
    ["sand", 1, 8],
    ["red_sand", 1, 4],
    ["pointed_dripstone", 1, 2],
    ["rooted_dirt", 1, 2],
    ["moss_block", 1, 2],
    ["pale_moss_block", 1, 2],
    ["firefly_bush", 1, 1],
    ["wildflowers", 1, 1],
    ["leaf_litter", 1, 1],
    ["packed_ice", 3, 1],
    ["blue_ice", 6, 1],
    ["gunpowder", 1, 1],
    ["podzol", 3, 3],
    ["name_tag", 5, 1],
    ["tropical_fish_bucket", 5, 1],
    ["pufferfish_bucket", 5, 1],
  ],
  WT_BUY = [
    ["water_bucket", 1, 2],
    ["milk_bucket", 1, 2],
    ["fermented_spider_eye", 1, 3],
    ["baked_potato", 4, 1],
    ["hay_block", 1, 1],
  ];
class WanderingTrader extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a),
      (this.despawnT = 48e3),
      (this.trades = null),
      (this.profession = "none"),
      (this.vlevel = 1),
      (this.drinkT = 0),
      (this.invis = !1));
  }
  extraSave() {
    return { dt: this.despawnT, tr: this.trades };
  }
  extraLoad(t) {
    ((this.despawnT = t.dt || 24e3), (this.trades = t.tr || null));
  }
  offers() {
    if (!this.trades) {
      const has = (t) => void 0 !== ITEM_KEY[t],
        pick = (t, s) =>
          t
            .filter((t) => has(t[0]))
            .sort(() => Math.random() - 0.5)
            .slice(0, s);
      this.trades = [
        ...pick(WT_BUY, 2).map(([t, s, e]) => ({
          a: t,
          an: s,
          r: "emerald",
          rn: e,
          uses: 2,
          used: 0,
          xp: 1,
        })),
        ...pick(WT_SELL, 5).map(([t, s, e]) => ({
          a: "emerald",
          an: s,
          r: t,
          rn: e,
          uses: 8,
          used: 0,
          xp: 1,
        })),
      ];
    }
    return this.trades;
  }
  gainXp() {}
  wantsPlayer() {
    return !1;
  }
  think(t) {
    const s = this.game;
    if (--this.despawnT <= 0 && !this.customName) {
      this.dead = !0;
      for (const t of s.entities) t.leashHolder === this && ((t.leashHolder = null), (t.dead = !0));
    } else {
      if (!(this.drinkT > 0))
        return !s.isDay() !== this.invis && Math.random() < 0.05
          ? ((this.drinkT = 32),
            void Sound.ev(
              this.invis
                ? "entity.wandering_trader.drink_milk"
                : "entity.wandering_trader.drink_potion",
              this.pos,
              1,
              1,
            ))
          : void (s.ui.screen instanceof MerchantScreen && s.ui.screen.v === this
              ? (t.look = s.player)
              : VMob.prototype.think.call(this, t));
      0 === --this.drinkT && (this.invis = !s.isDay());
    }
  }
  preInteract(t, s) {
    return (
      (!s || !ITEMS[s.id].spawnEgg) &&
      (!s || "name_tag" !== ITEMS[s.id].key) &&
      (this.game.ui.open(new TraderScreen(this.game, this)), this.sound("trade"), !0)
    );
  }
  setupAnim(t, s) {
    const e = t.parts,
      [i, a] = emLimbs(this, s);
    (emHead(e.head, this, s),
      e.right_leg && (e.right_leg.xRot = 1.4 * Math.cos(0.6662 * i) * a * 0.5),
      e.left_leg && (e.left_leg.xRot = 1.4 * Math.cos(0.6662 * i + Math.PI) * a * 0.5),
      e.head && this.drinkT > 0 && (e.head.xRot = -0.6));
  }
  texKey(t) {
    return t.etex("entity/wandering_trader/wandering_trader");
  }
  drawVM(t, s, e, i, a, o, h) {
    (this.invis && this.drinkT <= 0) || super.drawVM(t, s, e, i, a, o, h);
  }
}
class TraderScreen extends MerchantScreen {
  get title2() {
    return "流浪商人";
  }
}
(defVMob("wandering_trader", {
  cls: WanderingTrader,
  xp: 0,
  shadowR: 0.4,
  T: { passive: !0 },
  panicMod: 1.6,
}),
  (Game.prototype.trySpawnTrader = function () {
    const t = this.player,
      s = this.world;
    if (!(
      ("overworld" !== this.dim && this.dim) ||
      this.entities.some((t) => t instanceof WanderingTrader) ||
      ((this.traderChance = Math.min(75, (this.traderChance || 25) + 25)),
      1e3 * Math.random() >= this.traderChance)
    ))
      for (let e = 0; e < 10; e++) {
        const e = Math.floor(t.pos[0]) + randInt(-32, 32),
          i = Math.floor(t.pos[2]) + randInt(-32, 32);
        if (!s.isLoaded(e, i) || Math.hypot(e - t.pos[0], i - t.pos[2]) < 12) continue;
        const a = s.surfaceY(e, i) + 1;
        if (IS_FLUID[s.getBlock(e, a - 1, i)] || 0 !== s.getBlock(e, a, i)) continue;
        const o = spawnAt(this, "wandering_trader", e + 0.5, a, i + 0.5);
        for (let t = 0; t < 2; t++) {
          spawnAt(this, "trader_llama", e + 0.5 + (t ? 2 : -2), a, i + 0.5).leashHolder = o;
        }
        return void (this.traderChance = 25);
      }
  }));
class HappyGhast extends VMob {
  constructor(t, s, e, i, a) {
    (super(t, s, e, i, a), (this.harness = null), (this.persistent = !0));
  }
  extraSave() {
    return { har: this.harness };
  }
  extraLoad(t) {
    this.harness = t.har || null;
  }
  wantsPlayer() {
    return !1;
  }
  seat() {
    return [this.pos[0], this.pos[1] + this.h + 0.05, this.pos[2]];
  }
  onLand() {}
  dropsOnDeath() {
    return [this.harness];
  }
  think(t) {
    const s = this.game.player,
      e = s.vehicle || s,
      i = this.box();
    return !s.spectator &&
      !(e instanceof HappyGhast) &&
      e.pos[0] >= i[0] - 1 &&
      e.pos[0] < i[3] + 1 &&
      e.pos[2] >= i[2] - 1 &&
      e.pos[2] < i[5] + 1 &&
      e.pos[1] >= i[4] - 1e-5 &&
      e.pos[1] < i[4] + this.h / 2
      ? ((this.vel[0] = this.vel[1] = this.vel[2] = 0), (this.goal = null), void (t.look = s))
      : s.inv.held &&
          ("snowball" === ITEMS[s.inv.held.id].key || /_harness$/.test(ITEMS[s.inv.held.id].key)) &&
          this.distTo(s) < 16 &&
          this.distTo(s) > 4
        ? ((t.goal = [s.pos[0], s.pos[1] + 2, s.pos[2]]), void (t.look = s))
        : void (this.harness && this.distTo(s) < 8
            ? (t.look = s)
            : ((!this.goal || this.near(this.goal, 2) || Math.random() < 0.005) &&
                (this.goal = this.randomGoal(12, 4)),
              (t.goal = this.goal),
              (t.mod = 0.6)));
  }
  ridden(t, s) {
    const e = this.rider;
    this.yaw = e.yaw;
    const i = s.fwd || 0,
      a = s.strafe || 0,
      o = Math.sin(e.pitch),
      h = 0.035,
      r = (-Math.sin(e.yaw) * i + Math.cos(e.yaw) * a) * Math.cos(e.pitch),
      n = (-Math.cos(e.yaw) * i - Math.sin(e.yaw) * a) * Math.cos(e.pitch);
    ((this.vel[0] += r * h),
      (this.vel[2] += n * h),
      (this.vel[1] += (i * o + (s.jump ? 0.6 : 0)) * h));
  }
  moveBy(t) {
    if (this.rider && this.harness) {
      this.move(this.vel[0], this.vel[1], this.vel[2]);
      for (let t = 0; t < 3; t++) this.vel[t] *= 0.91;
      this.bodyYaw += 0.3 * angDelta(this.yaw, this.bodyYaw);
    } else VMob.prototype.moveBy.call(this, t);
  }
  preInteract(t, s) {
    const e = this.game,
      i = s && ITEMS[s.id].key;
    return "snowball" === i && this.health < this.maxHealth
      ? ((this.health = Math.min(this.maxHealth, this.health + 1)),
        useOne(e, t),
        this.sound("eat"),
        !0)
      : i && /_harness$/.test(i) && !this.harness && !this.baby
        ? ((this.harness = { ...s, count: 1 }),
          useOne(e, t),
          Sound.ev("entity.happy_ghast.equip", this.pos, 1, 1),
          !0)
        : "shears" === i && this.harness && !this.rider
          ? (e.dropItem(this.pos[0], this.pos[1] + 1, this.pos[2], this.harness),
            (this.harness = null),
            Sound.ev("entity.happy_ghast.unequip", this.pos, 1, 1),
            !0)
          : !(!this.harness || t.vehicle || this.rider) && (t.mount(this), !0);
  }
  setupAnim(t, s) {
    const e = t.parts,
      i = this.age + s;
    for (let t = 0; t < 9; t++) {
      const s = e["tentacle" + t];
      s && (s.xRot = 0.2 * Math.sin(0.3 * i + t) + 0.4);
    }
  }
  texKey(t) {
    return t.etex("entity/ghast/happy_ghast" + (this.baby ? "_baby" : ""));
  }
  drawLayers(t, s, e, i, a, o, h, r) {
    if (!this.harness || this.baby) return;
    const n = EM.get(s, "happy_ghast_harness#main"),
      l = ITEMS[this.harness.id].key.replace(/_harness$/, "");
    if (n) {
      (EM.reset(n), n.parts.goggles && (n.parts.goggles.y = this.rider ? 14 : 12.5));
      const t = s.gl,
        e = t.isEnabled(t.POLYGON_OFFSET_FILL);
      (t.enable(t.POLYGON_OFFSET_FILL),
        t.polygonOffset(-1, -1),
        t.depthFunc(t.LEQUAL),
        s.drawEM(n, s.etex("entity/equipment/happy_ghast_body/" + l + "_harness"), i, h, o, {
          overlay: r,
        }),
        t.depthFunc(t.LESS),
        e || t.disable(t.POLYGON_OFFSET_FILL));
    }
    if (this.rider) {
      const t = EM.get(s, "happy_ghast_ropes#main");
      t &&
        (EM.reset(t),
        EM.copy(e, t),
        s.drawEM(t, s.etex("entity/ghast/happy_ghast_ropes"), i, h, o, { overlay: r }));
    }
  }
}
(defVMob("happy_ghast", {
  cls: HappyGhast,
  ai: "fly",
  food: "happy_ghast_food",
  xp: 0,
  scale: 1,
  shadowR: 2,
  T: { passive: !0, hostile: !1 },
  speed3: 0.6,
  babyTempt: !0,
}),
  (BLOCK_RANDOM_TICK.dried_ghast = (t, s, e, i, a, o) => {
    const h = t.world,
      r = +(Features.propOf(a, o, "hydration") || 0);
    if ("true" === Features.propOf(a, o, "waterlogged") || h.getBlock(s, e + 1, i) === WATER) {
      if (!(Math.random() > 0.4)) {
        if (r < 3)
          return (
            bsetProp(h, s, e, i, "hydration", String(r + 1)),
            void Sound.ev("block.dried_ghast.transition", [s + 0.5, e, i + 0.5], 1, 1)
          );
        (h.setBlock(s, e, i, WATER, 0),
          Sound.ev("entity.ghastling.spawn", [s + 0.5, e, i + 0.5], 1, 1),
          spawnAt(t, "happy_ghast", s + 0.5, e, i + 0.5, !0));
      }
    } else r > 0 && Math.random() < 0.3 && bsetProp(h, s, e, i, "hydration", String(r - 1));
  }));
//# sourceURL=js/mobs_animals.js
