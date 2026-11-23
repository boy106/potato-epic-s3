"use strict";
const chunkOf = (t, s, i) => t.chunks.get(ckey(s >> 4, i >> 4));
function cellB(t, s, i, e, h) {
  return e < 0
    ? "end" === t.dim
      ? 0
      : 6
    : e >= HEIGHT
      ? 0
      : s
        ? s.getB((e << 8) | ((15 & h) << 4) | (15 & i))
        : 0;
}
function cellWet(t, s, i, e) {
  return i >= 0 && i < HEIGHT && !!(t && t.wl && t.wl.has((i << 8) | ((15 & e) << 4) | (15 & s)));
}
function blockBy(t, s, i, e, h, o, a) {
  return ((h ^ i) | (a ^ e)) >> 4 ? t.getBlock(h, o, a) : cellB(t, s, h, o, a);
}
const _fullBoxes = [];
function fullCollisionAt(t, s, i, e) {
  blockBoxes(t, s + 0.01, i + 0.01, e + 0.01, s + 0.99, i + 0.99, e + 0.99, _fullBoxes, null);
  for (const t of _fullBoxes)
    if (
      t[0] <= s + 1e-6 &&
      t[1] <= i + 1e-6 &&
      t[2] <= e + 1e-6 &&
      t[3] >= s + 1 - 1e-6 &&
      t[4] >= i + 1 - 1e-6 &&
      t[5] >= e + 1 - 1e-6
    )
      return !0;
  return !1;
}
function blockBoxes(t, s, i, e, h, o, a, r, n) {
  const l = r.pool || (r.pool = []);
  let c = 0;
  const p = Math.floor(s),
    f = Math.floor(i) - 1,
    d = Math.floor(e),
    u = Math.floor(h),
    m = Math.floor(o),
    M = Math.floor(a);
  for (let s = p; s <= u; s++)
    for (let i = d; i <= M; i++) {
      const e = chunkOf(t, s, i);
      if (e)
        for (let h = f; h <= m; h++) {
          const o = cellB(t, e, s, h, i);
          if (!o) continue;
          const a = BLOCKS[o];
          if (a && (a.solid || a.collide))
            if (a.shape === SH_BOXES || a.shape === SH_MODEL) {
              const o = a.fence
                ? t.fenceMeta(s, h, i, a)
                : h >= 0 && h < HEIGHT
                  ? e.getM((h << 8) | ((15 & i) << 4) | (15 & s))
                  : 0;
              for (const t of a.collide ? a.collide(o, n, h) : a.boxes(o))
                c = boxPut(
                  r,
                  l,
                  c,
                  s + t[0] / 16,
                  h + t[1] / 16,
                  i + t[2] / 16,
                  s + t[3] / 16,
                  h + t[4] / 16,
                  i + t[5] / 16,
                );
            } else
              c =
                a.shape === SH_CACTUS
                  ? boxPut(
                      r,
                      l,
                      c,
                      s + 1 / 16,
                      h,
                      i + 1 / 16,
                      s + 15 / 16,
                      h + 15 / 16,
                      i + 15 / 16,
                    )
                  : boxPut(r, l, c, s, h, i, s + 1, h + 1, i + 1);
        }
      else c = boxPut(r, l, c, s, -1e3, i, s + 1, 1e3, i + 1);
    }
  return ((r.length = c), r);
}
function boxPut(t, s, i, e, h, o, a, r, n) {
  const l = s[i] || (s[i] = [0, 0, 0, 0, 0, 0]);
  return (
    (l[0] = e),
    (l[1] = h),
    (l[2] = o),
    (l[3] = a),
    (l[4] = r),
    (l[5] = n),
    (t[i] = l),
    i + 1
  );
}
const _boxes = [],
  _moveBoxes = [],
  _stepBoxes = [],
  _sightBoxes = [],
  _stepHs = [],
  _stepBox = [0, 0, 0, 0, 0, 0],
  _floorBoxes = [];
function cellTop(t, s, i, e, h) {
  if (!t.isLoaded(s, e)) return 1 / 0;
  const o = BLOCKS[t.getBlock(s, i, e)];
  if (!o || !o.solid || (h && o.climbable)) return null;
  blockBoxes(
    t,
    s + 0.001,
    i + 0.001,
    e + 0.001,
    s + 1 - 0.001,
    i + 1 - 0.001,
    e + 1 - 0.001,
    _floorBoxes,
  );
  let a = null;
  for (const t of _floorBoxes)
    t[1] >= i - 1e-7 && t[1] < i + 1 - 1e-7 && (null === a || t[4] - i > a) && (a = t[4] - i);
  return a;
}
function blockFloor(t, s, i, e, h) {
  let o = cellTop(t, s, i, e, h);
  if (null === o) {
    const a = cellTop(t, s, i - 1, e, h);
    o = null !== a && a >= 1 ? a - 1 : NaN;
  }
  return o < 1 ? o : NaN;
}
function standsFree(t, s, i, e, h) {
  const o = PLAYER_W / 2;
  return !t.collides([s - o, i, e - o, s + o, i + h, e + o]);
}
function dangerBlock(t, s, i, e) {
  const h = t.getBlock(s, i, e),
    o = BLOCKS[h];
  return (
    !!o &&
    (!!/^(fire|soul_fire|lava|magma_block|lava_cauldron|wither_rose|sweet_berry_bush|cactus|powder_snow)$/.test(
      o.key,
    ) ||
      (/campfire$/.test(o.key) &&
        !(
          "undefined" != typeof Features &&
          "false" === Features.propOf(h, t.getMeta(s, i, e), "lit")
        )))
  );
}
function safeStandAt(t, s, i, e, h) {
  const o = t.world;
  if (h && dangerBlock(o, s, i, e)) return null;
  const a = blockFloor(o, s, i, e, !0);
  if (!(a < 1)) return null;
  if (h && a <= 0 && dangerBlock(o, s, i - 1, e)) return null;
  if (!standsFree(t, s + 0.5, i + a, e + 0.5, PLAYER_H.stand)) return null;
  const portal = (t) => {
    const i = BLOCKS[o.getBlock(s, t, e)];
    return !!i && /^end_(portal|gateway)$/.test(i.key);
  };
  return portal(i) || portal(i + 1) ? null : [s + 0.5, i + a, e + 0.5];
}
class Entity {
  constructor(t, s, i, e, h, o) {
    ((this.game = t),
      (this.world = t.world),
      (this.pos = [s, i, e]),
      (this.prev = [s, i, e]),
      (this.vel = [0, 0, 0]),
      (this.w = h),
      (this.h = o),
      (this.yaw = 0),
      (this.pitch = 0),
      (this.prevYaw = 0),
      (this.onGround = !1),
      (this.collidedH = !1),
      (this.inWater = !1),
      (this.inLava = !1),
      (this.eyeInWater = !1),
      (this.dead = !1),
      (this.age = 0),
      (this.fallDist = 0),
      (this.stepHeight = 0),
      (this.id = Entity.nextId++));
  }
  box() {
    const t = this.w / 2;
    return [
      this.pos[0] - t,
      this.pos[1],
      this.pos[2] - t,
      this.pos[0] + t,
      this.pos[1] + this.h,
      this.pos[2] + t,
    ];
  }
  savePrev() {
    ((this.prev[0] = this.pos[0]),
      (this.prev[1] = this.pos[1]),
      (this.prev[2] = this.pos[2]),
      (this.prevYaw = this.yaw),
      (this.prevBodyYaw = this.bodyYaw));
  }
  ipos(t) {
    return [
      lerp(this.prev[0], this.pos[0], t),
      lerp(this.prev[1], this.pos[1], t),
      lerp(this.prev[2], this.pos[2], t),
    ];
  }
  collides(t) {
    blockBoxes(this.world, t[0], t[1], t[2], t[3], t[4], t[5], _boxes, this);
    for (const s of _boxes)
      if (t[0] < s[3] && t[3] > s[0] && t[1] < s[4] && t[4] > s[1] && t[2] < s[5] && t[5] > s[2])
        return !0;
    return !1;
  }
  static clip(t, s, i, e) {
    const h = e,
      o = (e + 1) % 3,
      a = (e + 2) % 3;
    for (const e of s)
      if (!(t[o] >= e[o + 3] || t[o + 3] <= e[o] || t[a] >= e[a + 3] || t[a + 3] <= e[a]))
        if (i > 0 && t[h + 3] <= e[h] + 1e-7) {
          const s = e[h] - t[h + 3];
          s < i && (i = s);
        } else if (i < 0 && t[h] >= e[h + 3] - 1e-7) {
          const s = e[h + 3] - t[h];
          s > i && (i = s);
        }
    return i;
  }
  move(t, s, i) {
    if (this.noClip) return ((this.pos[0] += t), (this.pos[1] += s), void (this.pos[2] += i));
    const e = this.stuckIn;
    if (
      (e &&
        ((this.stuckIn = null),
        (t *= e[0]),
        (s *= e[1]),
        (i *= e[2]),
        this.vel && (this.vel[0] = this.vel[1] = this.vel[2] = 0)),
      this.sneakEdge && this.onGround && !this.flying)
    ) {
      const s = 0.05,
        e = t,
        h = i,
        test = (t, s) => {
          const i = this.box();
          return this.collides([i[0] + t, i[1] - 0.6, i[2] + s, i[3] + t, i[1], i[5] + s]);
        };
      for (; 0 !== t && !test(t, 0);) Math.abs(t) < s ? (t = 0) : (t -= Math.sign(t) * s);
      for (; 0 !== i && !test(0, i);) Math.abs(i) < s ? (i = 0) : (i -= Math.sign(i) * s);
      for (; 0 !== t && 0 !== i && !test(t, i);)
        (Math.abs(t) < s ? (t = 0) : (t -= Math.sign(t) * s),
          Math.abs(i) < s ? (i = 0) : (i -= Math.sign(i) * s));
      this.vel && (t !== e && (this.vel[0] = 0), i !== h && (this.vel[2] = 0));
    }
    const h = t,
      o = s,
      a = i,
      r = this.box(),
      n = blockBoxes(
        this.world,
        Math.min(r[0], r[0] + t) - 0.01,
        Math.min(r[1], r[1] + s) - 0.01,
        Math.min(r[2], r[2] + i) - 0.01,
        Math.max(r[3], r[3] + t) + 0.01,
        Math.max(r[4], r[4] + s) + 0.01,
        Math.max(r[5], r[5] + i) + 0.01,
        _moveBoxes,
        this,
      ),
      l = n.length;
    if (this.game && this === this.game.player && !this.vehicle && "undefined" != typeof Boat)
      for (const t of this.game.entities)
        !t.dead &&
          Math.abs(t.pos[0] - r[0]) < 4 &&
          Math.abs(t.pos[2] - r[2]) < 4 &&
          (((t instanceof Boat || ("undefined" != typeof Minecart && t instanceof Minecart)) &&
            Math.abs(t.pos[1] - r[1]) < 4) ||
            ("undefined" != typeof HappyGhast &&
              t instanceof HappyGhast &&
              !t.baby &&
              0 === t.deathTime &&
              r[1] >= t.pos[1] + t.h - 1e-5 &&
              r[1] - t.pos[1] - t.h < 4)) &&
          n.push(t.box());
    ((s = Entity.clip(r, n, s, 1)),
      (r[1] += s),
      (r[4] += s),
      (t = Entity.clip(r, n, t, 0)),
      (r[0] += t),
      (r[3] += t),
      (i = Entity.clip(r, n, i, 2)),
      (r[2] += i),
      (r[5] += i));
    const c = o !== s && o < 0,
      p = this.onGround || c;
    if (this.stepHeight > 0 && p && (t !== h || i !== a)) {
      const e = this.box();
      c && ((e[1] += s), (e[4] += s));
      const o = blockBoxes(
        this.world,
        Math.min(e[0], e[0] + h) - 0.01,
        e[1] - 0.01,
        Math.min(e[2], e[2] + a) - 0.01,
        Math.max(e[3], e[3] + h) + 0.01,
        e[4] + this.stepHeight + 0.01,
        Math.max(e[5], e[5] + a) + 0.01,
        _stepBoxes,
        this,
      );
      for (let t = l; t < n.length; t++) o.push(n[t]);
      const p = _stepHs;
      p.length = 0;
      for (const t of o)
        for (let s = 1; s <= 4; s += 3) {
          const i = t[s] - e[1];
          i > 1e-7 && i <= this.stepHeight + 1e-7 && !p.includes(i) && p.push(i);
        }
      p.sort((t, s) => t - s);
      const f = _stepBox;
      for (const n of p) {
        for (let t = 0; t < 6; t++) f[t] = e[t];
        const l = Entity.clip(f, o, n, 1);
        ((f[1] += l), (f[4] += l));
        const c = Entity.clip(f, o, h, 0);
        ((f[0] += c), (f[3] += c));
        const p = Entity.clip(f, o, a, 2);
        if (((f[2] += p), (f[5] += p), c * c + p * p > t * t + i * i + 1e-6)) {
          s = f[1] - r[1] + s;
          for (let t = 0; t < 6; t++) r[t] = f[t];
          ((t = c), (i = p), (this.stepped = !0));
          break;
        }
      }
    }
    ((this.collidedH = Math.abs(t - h) > 1e-6 || Math.abs(i - a) > 1e-6),
      (this.onGround =
        (o < 0 && Math.abs(s - o) > 1e-7) || (this.stepped && o <= 0 && this.onGround)),
      (this.stepped = !1));
    const f = this.vel[1];
    if (Math.abs(s - o) > 1e-7) {
      const t = this.vel[1],
        i =
          this instanceof Living
            ? t <= 0 && this.effects && this.hasEffect("slow_falling")
              ? 0.01
              : 0.08
            : 0.04,
        e =
          o < 0 &&
          -t >= i &&
          !this.sneaking &&
          BLOCKS[
            this.world.getBlock(
              Math.floor((r[0] + r[3]) / 2),
              Math.floor(r[1] - 0.2),
              Math.floor((r[2] + r[5]) / 2),
            )
          ],
        h = e && e.bed ? clamp(s / o, 0, 1) : 0;
      this.vel[1] =
        e && e.bed ? (h * i - t) * (1 - 0.02 * h) * 0.75 * (this instanceof Living ? 1 : 0.8) : 0;
    }
    if (
      (Math.abs(t - h) > 1e-7 && (this.vel[0] = 0),
      Math.abs(i - a) > 1e-7 && (this.vel[2] = 0),
      (this.pos[0] = (r[0] + r[3]) / 2),
      (this.pos[1] = r[1]),
      (this.pos[2] = (r[2] + r[5]) / 2),
      this.onGround
        ? (this.fallDist > 0 && this.onLand(this.fallDist), (this.fallDist = 0))
        : s < 0 && (this.fallDist -= s),
      o < 0 && s !== o && s <= 0 && f < 0 && !this.sneaking && !this.sneakHeld)
    ) {
      const t =
          this instanceof Living
            ? this.effects && this.hasEffect("slow_falling")
              ? 0.01
              : 0.08
            : 0.04,
        i =
          -f >= t &&
          BLOCKS[
            this.world.getBlock(
              Math.floor(this.pos[0]),
              Math.floor(this.pos[1] - 0.2),
              Math.floor(this.pos[2]),
            )
          ];
      if (i && i.bounce) {
        const e = s / f,
          h = i.bounce * (this instanceof Living ? 1 : 0.8);
        this.vel[1] = (e * t - f) * (1 + (0.98 - 1) * e) * h;
      }
    }
  }
  onLand(t) {}
  bubbleColumn() {
    const t = this.world,
      s = Math.floor(this.pos[0]),
      i = Math.floor(this.pos[2]),
      e = Math.floor(this.pos[1] + 0.1),
      h = t.bubbleColumnAt(s, e, i);
    if (!h) return;
    const o = this.vel;
    t.getBlock(s, e + 1, i) === AIR
      ? (o[1] = h < 0 ? Math.max(-0.9, o[1] - 0.03) : Math.min(1.8, o[1] + 0.1))
      : ((o[1] = h < 0 ? Math.max(-0.3, o[1] - 0.03) : Math.min(0.7, o[1] + 0.06)),
        (this.fallDist = 0));
  }
  updateFluids() {
    const t = this.box();
    ((this.inWater = !1), (this.inLava = !1));
    const s = Math.floor(t[0] + 0.001),
      i = Math.floor(t[3] - 0.001),
      e = Math.floor(t[1] + 0.001),
      h = Math.floor(t[4] - 0.001),
      o = Math.floor(t[2] + 0.001),
      a = Math.floor(t[5] - 0.001),
      r = this.world,
      n = Math.floor(this.pos[0]),
      l = Math.floor(this.pos[2]);
    let c = null;
    for (let t = s; t <= i; t++)
      for (let s = o; s <= a; s++) {
        const i = chunkOf(r, t, s);
        t === n && s === l && (c = i || 0);
        for (let o = e; o <= h; o++) {
          const e = cellB(r, i, t, o, s);
          e === WATER || WLOG[e] || (e && cellWet(i, t, o, s))
            ? ((this.inWater = !0), (this.fallDist = 0))
            : e === LAVA || 2 === FLUID_MOD[e]
              ? (this.inLava = !0)
              : 1 === FLUID_MOD[e] && ((this.inWater = !0), (this.fallDist = 0));
        }
      }
    null === c && (c = chunkOf(r, n, l));
    const p = this.pos[1] + (this.eyeH || 0.85 * this.h),
      f = Math.floor(p),
      d = cellB(r, c, n, f, l);
    ((this.eyeInWater = !!(d === WATER || WLOG[d] || (d && cellWet(c, n, f, l))) && p < f + 0.9),
      this.vel &&
        !this.remote &&
        (this.inWater || this.inLava) &&
        this.fluidPushed() &&
        (this.inWater && this.fluidPush(WATER, 0.014, t, s, i, e, h, o, a),
        this.inLava &&
          this.fluidPush(
            LAVA,
            "nether" === this.world.dim ? 0.007 : 0.0023333333333333335,
            t,
            s,
            i,
            e,
            h,
            o,
            a,
          )));
  }
  waterDepth() {
    const t = this.world,
      s = Math.floor(this.pos[0]),
      i = Math.floor(this.pos[2]),
      e = Math.floor(this.pos[1]);
    let h = 0;
    for (let o = e; o <= e + 1; o++) {
      const e = t.fluidAmount(WATER, s, o, i);
      if (e <= 0) break;
      h = Math.max(h, o + (t.fluidAmount(WATER, s, o + 1, i) > 0 ? 1 : e / 9) - this.pos[1]);
    }
    return h;
  }
  fluidPushed() {
    return (
      !this.flying &&
      !/^(cod|salmon|pufferfish|tropical_fish|squid|glow_squid|dolphin|tadpole|boat|chest_boat)/.test(
        this.type || "",
      )
    );
  }
  fluidPush(t, s, i, e, h, o, a, r, n) {
    const l = this.world;
    let c = 0,
      p = 0,
      f = 0,
      d = 0,
      u = 0;
    for (let s = e; s <= h; s++)
      for (let e = o; e <= a; e++)
        for (let h = r; h <= n; h++) {
          const o = l.fluidAmount(t, s, e, h);
          if (o <= 0) continue;
          const a = e + (l.fluidAmount(t, s, e + 1, h) > 0 ? 1 : o / 9);
          if (a < i[1]) continue;
          u = Math.max(a - i[1], u);
          const r = l.fluidFlow(t, s, e, h),
            n = u < 0.4 ? u : 1;
          ((c += r[0] * n), (p += r[1] * n), (f += r[2] * n), d++);
        }
    let m = Math.hypot(c, p, f);
    if (!(m > 0)) return;
    (d > 0 && ((c /= d), (p /= d), (f /= d), (m /= d)),
      this !== this.game.player && ((c /= m), (p /= m), (f /= m), (m = 1)),
      (c *= s),
      (p *= s),
      (f *= s),
      (m *= s));
    const M = this.vel;
    if (Math.abs(M[0]) < 0.003 && Math.abs(M[2]) < 0.003 && m < 0.0045) {
      const t = 0.0045 / m;
      ((c *= t), (p *= t), (f *= t));
    }
    ((M[0] += c), (M[1] += p), (M[2] += f));
  }
  lightAt() {
    const t = this.world.getLight(
      Math.floor(this.pos[0]),
      Math.floor(this.pos[1] + 0.5 * this.h),
      Math.floor(this.pos[2]),
    );
    return [(t >> 4) / 15, (15 & t) / 15];
  }
  distTo(t) {
    const s = this.pos[0] - t.pos[0],
      i = this.pos[1] - t.pos[1],
      e = this.pos[2] - t.pos[2];
    return Math.sqrt(s * s + i * i + e * e);
  }
}
Entity.nextId = 1;
const speedFactorOf = (t) => (t && t.slow && "cobweb" !== t.key ? t.slow : 0),
  jumpFactorOf = (t) => {
    const s = t.world,
      i = Math.floor(t.pos[0]),
      e = Math.floor(t.pos[2]),
      h = BLOCKS[s.getBlock(i, Math.floor(t.pos[1]), e)];
    return h && h.jumpFactor
      ? h.jumpFactor
      : (BLOCKS[s.getBlock(i, Math.floor(t.pos[1] - 0.5), e)] || {}).jumpFactor || 1;
  },
  BERRY_STUCK = [0.8, 0.75, 0.8];
class Living extends Entity {
  constructor(t, s, i, e, h, o, a) {
    (super(t, s, i, e, h, o),
      (this.health = a),
      (this.maxHealth = a),
      (this.hurtTime = 0),
      (this.invuln = 0),
      (this.deathTime = 0),
      (this.fire = 0),
      (this.air = 300),
      (this.limbSwing = 0),
      (this.limbAmt = 0),
      (this.bodyYaw = 0),
      (this.headYaw = 0),
      (this.stepHeight = 0.6),
      (this.slowFall = !1));
  }
  hurt(t, s) {
    if (this.dead || this.deathTime > 0) return !1;
    if (this.fireproof && s && ("fire" === s.type || "lava" === s.type)) return !1;
    if (this.invuln > 10 && t <= this.lastDamage) return !1;
    const i = this.invuln > 10 ? t - this.lastDamage : t;
    if (
      ((this.lastDamage = t),
      (this.invuln = 20),
      (this.hurtTime = 10),
      (this.health -= this.reduceDamage ? this.reduceDamage(i, s) : i),
      s && s.knockFrom && (s.knock ?? 0.4) > 0)
    ) {
      const t = this.pos[0] - s.knockFrom[0],
        i = this.pos[2] - s.knockFrom[2],
        e = Math.hypot(t, i) || 1,
        h = s.knock ?? 0.4;
      ((this.vel[0] = this.vel[0] / 2 + (t / e) * h),
        (this.vel[2] = this.vel[2] / 2 + (i / e) * h),
        this.onGround && (this.vel[1] = Math.min(0.4, this.vel[1] / 2 + 0.36)));
    }
    return (this.onHurt(s), this.health <= 0 && ((this.health = 0), this.die(s)), !0);
  }
  onHurt() {}
  die() {
    this.deathTime = 1;
  }
  baseTick() {
    (this.age++,
      this.hurtTime > 0 && this.hurtTime--,
      this.invuln > 0 && this.invuln--,
      this.impulseGrace > 0 && this.impulseGrace--,
      this.updateFluids(),
      this.inWater && this.bubbleColumn(),
      this.inLava && !this.fireproof && (this.hurt(4, { type: "lava" }), (this.fire = 300)));
    const t = this.world,
      s = Math.floor(this.pos[0]),
      i = Math.floor(this.pos[2]),
      e = chunkOf(t, s, i);
    {
      const h = this.box();
      this.inWeb = !1;
      let o = 0,
        a = !1;
      const r = Math.floor(h[1]),
        n = Math.floor(h[4] - 0.001);
      for (let l = Math.floor(h[0]); l <= Math.floor(h[3] - 0.001); l++)
        for (let c = Math.floor(h[2]); c <= Math.floor(h[5] - 0.001); c++) {
          const h = ((l ^ s) | (c ^ i)) >> 4 ? chunkOf(t, l, c) : e;
          for (let s = r; s <= n; s++) {
            const i = cellB(t, h, l, s, c);
            if (177 === i) this.inWeb = !0;
            else if ((171 === i || (i && i === BID.soul_fire)) && !this.fireproof)
              (this.fire < 160 && (this.fire = 160),
                this.age % 10 == 0 && this.hurt(171 === i ? 1 : 2, { type: "fire" }));
            else if (i === BID.sweet_berry_bush)
              o = Math.max(o, "0" !== Features.propOf(i, t.getMeta(l, s, c), "age") ? 2 : 1);
            else if (
              i === BID.honey_block &&
              !this.onGround &&
              this.pos[1] <= s + 0.9375 - 1e-7 &&
              this.vel[1] / 0.98 + 0.08 < -0.08
            ) {
              const t = 0.4375 + this.w / 2;
              (Math.abs(l + 0.5 - this.pos[0]) + 1e-7 > t ||
                Math.abs(c + 0.5 - this.pos[2]) + 1e-7 > t) &&
                (a = !0);
            }
          }
        }
      const l = this.lastTickPos || (this.lastTickPos = [this.pos[0], this.pos[1], this.pos[2]]);
      if (
        (o &&
          "fox" !== this.type &&
          "bee" !== this.type &&
          !this.noClip &&
          (this.flying || ((this.stuckIn = BERRY_STUCK), (this.fallDist = 0)),
          2 === o &&
            (Math.abs(this.pos[0] - l[0]) >= 0.003 || Math.abs(this.pos[2] - l[2]) >= 0.003) &&
            this.hurt(1, { type: "berry" })),
        (l[0] = this.pos[0]),
        (l[1] = this.pos[1]),
        (l[2] = this.pos[2]),
        a)
      ) {
        const t = this.vel,
          s = t[1] / 0.98 + 0.08;
        if (s < -0.13) {
          const i = -0.05 / s;
          ((t[0] *= i), (t[2] *= i));
        }
        ((t[1] = -0.1274),
          (this.fallDist = 0),
          Math.random() < 0.2 && Sound.ev("block.honey_block.slide", this.pos, 1, 1));
      }
    }
    (null == this.impulseY ||
      this.impulseGrace > 0 ||
      !(
        this.onGround ||
        this.inWater ||
        this.inLava ||
        this.inWeb ||
        this.gliding ||
        this.onLadder(e, s, i)
      ) ||
      (this.impulseY = null),
      this.fireproof && (this.fire = 0),
      this.fire > 0 &&
        (this.fire--,
        this.inWater ? (this.fire = 0) : this.fire % 20 == 0 && this.hurt(1, { type: "fire" }),
        Math.random() < 0.3 &&
          this.game.particles.spawn(
            "flame",
            this.pos[0] + (Math.random() - 0.5) * this.w,
            this.pos[1] + Math.random() * this.h,
            this.pos[2] + (Math.random() - 0.5) * this.w,
            0,
            0.02,
            0,
          )));
    const h =
      this.eyeInWater &&
      this.world.bubbleColumnAt(
        Math.floor(this.pos[0]),
        Math.floor(this.pos[1] + ("function" == typeof this.eye ? this.eye() : 0.85 * this.h)),
        Math.floor(this.pos[2]),
      );
    if (!this.eyeInWater || this.waterBreather || h) this.air = Math.min(300, this.air + 4);
    else {
      const t = this.inv ? armorEnch(this, "respiration", [39]) : 0;
      ((!t || Math.random() < 1 / (t + 1)) && this.air--,
        this.air <= -20 && ((this.air = 0), this.hurt(2, { type: "drown" })));
    }
    {
      const h = this.w / 2,
        o = this.pos[0],
        a = this.pos[2],
        r = Math.floor(this.pos[1] + 0.3);
      (37 !== blockBy(t, e, s, i, Math.floor(o - h - 0.01), r, Math.floor(a)) &&
        37 !== blockBy(t, e, s, i, Math.floor(o + h + 0.01), r, Math.floor(a)) &&
        37 !== blockBy(t, e, s, i, Math.floor(o), r, Math.floor(a - h - 0.01)) &&
        37 !== blockBy(t, e, s, i, Math.floor(o), r, Math.floor(a + h + 0.01)) &&
        37 !== blockBy(t, e, s, i, Math.floor(o), Math.floor(this.pos[1]), Math.floor(a))) ||
        this.hurt(1, { type: "cactus" });
    }
    (this.onGround &&
      103 ===
        blockBy(
          t,
          e,
          s,
          i,
          Math.floor(this.pos[0]),
          Math.floor(this.pos[1] - 0.1),
          Math.floor(this.pos[2]),
        ) &&
      !this.sneaking &&
      this.hurt(1, { type: "hotFloor" }),
      this.pos[1] < -40 && this.hurt(4, { type: "void" }));
  }
  onLand(t) {
    if (this.slowFall) return;
    null != this.impulseY &&
      ((!((t = Math.min(t, this.impulseY - this.pos[1])) <= 0) && this.impulseGrace > 0) ||
        (this.impulseY = null));
    const s = this.world.getBlock(
      Math.floor(this.pos[0]),
      Math.floor(this.pos[1] - 0.2),
      Math.floor(this.pos[2]),
    );
    if (
      63 === s &&
      !this.game.net &&
      !this.remote &&
      Math.random() < t - 0.5 &&
      this.w * this.w * this.h > 0.512 &&
      (this instanceof Player || !this.game.rule || !1 !== this.game.rule("mob_griefing"))
    ) {
      const t = Math.floor(this.pos[0]),
        s = Math.floor(this.pos[1] - 0.2),
        i = Math.floor(this.pos[2]);
      this.world.setBlock(t, s, i, 3, 0);
      for (const e of [this.game.player, ...this.game.entities])
        e &&
          e.pos[1] >= s + 0.5 &&
          e.pos[1] < s + 1 &&
          Math.abs(e.pos[0] - t - 0.5) < 0.5 + e.w / 2 &&
          Math.abs(e.pos[2] - i - 0.5) < 0.5 + e.w / 2 &&
          ((e.pos[1] = s + 1), e.prev && (e.prev[1] = Math.max(e.prev[1], s + 1)));
      this.game.flushMesh && this.game.flushMesh();
    }
    if (t > 1.5 && s && BLOCKS[s].shape !== SH_LIQUID) {
      const i = Math.min(30, Math.floor(3 * t));
      for (let t = 0; t < i; t++)
        this.game.particles.spawn(
          "block",
          this.pos[0] + (Math.random() - 0.5) * this.w,
          this.pos[1] + 0.1,
          this.pos[2] + (Math.random() - 0.5) * this.w,
          0.3 * (Math.random() - 0.5),
          0.1 + 0.1 * Math.random(),
          0.3 * (Math.random() - 0.5),
          {
            id: s,
            meta: 0,
            tint: this.game.blockTintAt(Math.floor(this.pos[0]), Math.floor(this.pos[2]), s, 0),
          },
        );
      t > 3 && Sound.block("step", BLOCKS[s].sound, this.pos);
    }
    const i = this.effects ? this.effectAmp("jump_boost") + 1 : 0;
    (s && BLOCKS[s].bed && (t *= 0.5), !this.inWater && t > 3 + i && this.updateFluids());
    const e =
        s && "pointed_dripstone" === BLOCKS[s].key && "undefined" != typeof Features
          ? this.world.getMeta(
              Math.floor(this.pos[0]),
              Math.floor(this.pos[1] - 0.2),
              Math.floor(this.pos[2]),
            )
          : -1,
      h =
        e >= 0 &&
        "tip" === Features.propOf(s, e, "thickness") &&
        "up" === Features.propOf(s, e, "vertical_direction"),
      o = BLOCKS[s],
      a = o ? ("honey_block" === o.key ? 0.2 : o.bounce || "powder_snow" === o.key ? 0 : 1) : 1,
      r = h ? Math.floor(2 * (t - 0.5 - i) + 1e-6) : Math.ceil((t - 3 - i) * a);
    (h || t > 3 + i) &&
      r > 0 &&
      !this.inWater &&
      87 !== s &&
      a > 0 &&
      ((this.impulseY = null),
      this.hurt(r, { type: "fall" }),
      Sound.ev(
        (this === this.game.player ? "entity.player." : "entity.generic.") +
          (r > 4 ? "big_fall" : "small_fall"),
        this.pos,
        1,
        1,
      ),
      BLOCKS[s] && Sound.block("fall", BLOCKS[s].sound, this.pos));
  }
  travel(t, s, i, e) {
    const h = this.vel;
    if (
      (this.inWeb && ((h[0] *= 0.25), (h[2] *= 0.25), (h[1] *= 0.05), (this.fallDist = 0)),
      this.inWater || this.inLava)
    ) {
      const o = this.inWater;
      let a = o ? (this.sprinting ? 0.9 : 0.8) : 0.5,
        r = 0.02 * (this.waterSpeed || 1);
      if (o && this.waterEfficiency) {
        let t = this.waterEfficiency();
        (this.onGround || (t *= 0.5), t > 0 && ((a += (0.54600006 - a) * t), (r += (i - r) * t)));
      }
      if ((this.accel(t, s, r), this.swimming && o)) {
        const t = Math.sin(this.pitch),
          s = t < -0.2 ? 0.085 : 0.06,
          i = this.world.waterAt(
            Math.floor(this.pos[0]),
            Math.floor(this.pos[1] + 0.9),
            Math.floor(this.pos[2]),
          );
        (t <= 0 || e || i) && (h[1] += (t - h[1]) * s);
      } else e && (h[1] += 0.04);
      if (
        (this.move(h[0], h[1], h[2]),
        o
          ? ((h[0] *= a),
            (h[1] *= 0.8),
            (h[2] *= a),
            this.sprinting ||
              (h[1] = Math.abs(h[1] - 0.005) < 0.003 && h[1] <= 0 ? -0.003 : h[1] - 0.005))
          : ((h[0] *= a), (h[1] *= a), (h[2] *= a), (h[1] -= 0.02)),
        this.collidedH && e)
      ) {
        const t = this.box();
        this.collides([
          t[0] + h[0],
          t[1] + 0.6,
          t[2] + h[2],
          t[3] + h[0],
          t[4] + 0.6,
          t[5] + h[2],
        ]) || (h[1] = 0.3);
      }
      return;
    }
    const o = this.world,
      a = Math.floor(this.pos[0]),
      r = Math.floor(this.pos[2]),
      n = chunkOf(o, a, r),
      l = cellB(o, n, a, Math.floor(this.pos[1] - 0.5), r),
      c = this.onGround ? (BLOCKS[l] ? BLOCKS[l].slip : 0.6) : 1,
      p = this.onGround ? 0.91 * c : 0.91,
      f = this.onGround ? i * (0.21600002 / (c * c * c)) : this.airSpeed || 0.02;
    (this.accel(t, s, f),
      this.onLadder(n, a, r) &&
        ((h[0] = clamp(h[0], -0.15, 0.15)),
        (h[2] = clamp(h[2], -0.15, 0.15)),
        (h[1] = Math.max(h[1], -0.15)),
        this.sneaking && h[1] < 0 && (h[1] = 0),
        (this.fallDist = 0)),
      this.move(h[0], h[1], h[2]),
      this.onLadder(n, a, r) && (this.collidedH || e) && (h[1] = 0.2));
    const d = this.effects ? this.effectAmp("levitation") : -1,
      u = this.effects && this.hasEffect("slow_falling");
    if (
      (d >= 0
        ? ((h[1] += 0.2 * (0.05 * (d + 1) - h[1])), (this.fallDist = 0))
        : ((h[1] -= (u && h[1] <= 0 ? 0.01 : 0.08) * (this.gravK || 1)), (h[1] *= 0.98)),
      u && (this.fallDist = 0),
      this.slowFall && h[1] < -0.1 && ((h[1] = -0.1), (this.fallDist = 0)),
      (h[0] *= p),
      (h[2] *= p),
      this.onGround && !this.flying && !this.soulSpeedOn)
    ) {
      const t =
          BLOCKS[
            blockBy(
              o,
              n,
              a,
              r,
              Math.floor(this.pos[0]),
              Math.floor(this.pos[1] + 0.01),
              Math.floor(this.pos[2]),
            )
          ],
        s = speedFactorOf(t) || speedFactorOf(BLOCKS[l]);
      s && ((h[0] *= s), (h[2] *= s));
    }
    if (this.onGround && !this.sneaking && Math.abs(h[1]) < 0.1) {
      const t =
        BLOCKS[
          blockBy(
            o,
            n,
            a,
            r,
            Math.floor(this.pos[0]),
            Math.floor(this.pos[1] - 0.2),
            Math.floor(this.pos[2]),
          )
        ];
      if (t && t.bounce) {
        const t = 0.4 + 0.2 * Math.abs(h[1]);
        ((h[0] *= t), (h[2] *= t));
      }
    }
  }
  accel(t, s, i) {
    let e = t * t + s * s;
    if (e < 1e-4) return;
    ((e = Math.sqrt(e)), e < 1 && (e = 1), (t *= i / e), (s *= i / e));
    const h = Math.sin(this.yaw),
      o = Math.cos(this.yaw);
    ((this.vel[0] += -h * t + o * s), (this.vel[2] += -o * t - h * s));
  }
  onLadder(t, s, i) {
    const e = Math.floor(this.pos[0]),
      h = Math.floor(this.pos[1]),
      o = Math.floor(this.pos[2]),
      a = void 0 === s ? this.world.getBlock(e, h, o) : blockBy(this.world, t, s, i, e, h, o);
    return a && BLOCKS[a].climbable;
  }
  animate() {
    const t = this.pos[0] - this.prev[0],
      s = this.pos[2] - this.prev[2],
      i = Math.min(1, 4 * Math.hypot(t, s));
    ((this.limbAmt += 0.4 * (i - this.limbAmt)), (this.limbSwing += this.limbAmt));
  }
}
class Inventory {
  constructor() {
    ((this.slots = new Array(41).fill(null)), (this.sel = 0));
  }
  get held() {
    return this.slots[this.sel];
  }
  add(t, s) {
    if (!t) return 0;
    if (!(ITEMS[t.id] && t.count > 0)) {
      const s = knownStack(t, null, "inventory");
      if (!s) return t.count > 0 ? t.count : 0;
      t = s;
    }
    let i = t.count;
    const e = maxStack(t.id),
      h = s || [];
    if (!s) for (let t = 0; t < 36; t++) h.push(t);
    for (const o of s ? h : [this.sel, 40, ...h]) {
      const s = this.slots[o];
      if (s && sameKind(s, t) && s.count < e && !ITEMS[s.id].durability) {
        const t = Math.min(i, e - s.count);
        if (((s.count += t), (i -= t), !i)) return 0;
      }
    }
    for (const s of h)
      if (!this.slots[s]) {
        const h = Math.min(i, e);
        if (((this.slots[s] = { ...t, count: h, dmg: t.dmg || 0 }), (i -= h), !i)) return 0;
      }
    return i;
  }
  count(t) {
    let s = 0;
    for (let i = 0; i < 36; i++)
      this.slots[i] && this.slots[i].id === t && (s += this.slots[i].count);
    return s;
  }
  remove(t, s) {
    for (let i = 0; i < 36 && s > 0; i++) {
      const e = this.slots[i];
      if (e && e.id === t) {
        const t = Math.min(s, e.count);
        ((e.count -= t), (s -= t), e.count || (this.slots[i] = null));
      }
    }
  }
  armorPoints() {
    let t = 0;
    for (let s = 36; s < 40; s++) {
      const i = this.slots[s];
      i && ITEMS[i.id].armor && (t += ITEMS[i.id].armor.points);
    }
    return t;
  }
  armorToughness() {
    let t = 0;
    for (let s = 36; s < 40; s++) {
      const i = this.slots[s];
      i && ITEMS[i.id].armor && (t += ITEMS[i.id].armor.tough || 0);
    }
    return t;
  }
  toJSON() {
    return { slots: this.slots, sel: this.sel };
  }
}
const PLAYER_W = Math.fround(0.6),
  PLAYER_H = { stand: Math.fround(1.8), crouch: Math.fround(1.5), swim: Math.fround(0.6), prone: Math.fround(0.6) }; // W12a: prone 复用 swim 高度（07-§3.1）
class Player extends Living {
  constructor(t, s, i, e) {
    (super(t, s, i, e, PLAYER_W, PLAYER_H.stand, 20),
      (this.eyeH = 1.62),
      (this.inv = new Inventory()),
      (this.food = 20),
      (this.saturation = 5),
      (this.exhaustion = 0),
      (this.foodTimer = 0),
      (this.flying = !1),
      (this.sprinting = !1),
      (this.sneaking = !1),
      (this.spawn = [s, i, e]),
      (this.bob = 0),
      (this.prevBob = 0),
      (this.bobAmt = 0),
      (this.swingT = 0),
      (this.useT = 0),
      (this.xp = 0),
      (this.distWalked = 0));
  }
  swing() {
    this.swingT <= 3 && (this.swingT = 6);
  }
  get creative() {
    return "creative" === this.game.mode || "spectator" === this.game.mode;
  }
  get spectator() {
    return "spectator" === this.game.mode;
  }
  eye() {
    return this.game && this.game.sleeping && this === this.game.player
      ? 0.2
      : "swim" === this.pose
        ? 0.4
        : "prone" === this.pose
          ? 0.5 // W12a: 趴姿 eye≈0.5（07-§3.1）
          : this.sneaking && !this.flying
            ? 1.27
            : 1.62;
  }
  reduceDamage(t, s) {
    if (this.creative && s && "void" !== s.type) return 0;
    const i = protectionPoints(this, s);
    if (s && ["fall", "drown", "starve", "void", "fire"].includes(s.type)) return t * (1 - i / 25);
    const e = this.inv.armorPoints();
    if (e) {
      const s = Math.max(1, Math.floor(t / 4));
      for (let t = 36; t < 40; t++) {
        const i = this.inv.slots[t];
        if (!i || !ITEMS[i.id].durability) continue;
        let e = 0;
        for (let t = 0; t < s; t++) unbreakingSkips(i, !0) || e++;
        ((i.dmg = (i.dmg || 0) + e),
          i.dmg >= ITEMS[i.id].durability &&
            ((this.inv.slots[t] = null),
            Sound.ev("entity.item.break", this.pos, 0.8, 0.8 + 0.4 * Math.random())));
      }
    }
    const h = this.inv.armorToughness();
    return t * (1 - clamp(e - (4 * t) / (h + 8), 0.2 * e, 20) / 25) * (1 - i / 25);
  }
  hurt(t, s) {
    if (this.spectator || (this.creative && (!s || "void" !== s.type))) return !1;
    if (this.game.gameOver) return !1;
    if (s && s.attacker && s.attacker !== this && s.attacker.T) {
      const s = this.game.difficulty;
      if (0 === s) return !1;
      1 === s ? (t = Math.min(t / 2 + 1, t)) : 3 === s && (t = (3 * t) / 2);
    }
    const i = super.hurt(t, s);
    i && (this.exhaust(0.1), Sound.hurt(null), this.game.onPlayerHurt(s));
    const e =
      i && s && s.attacker && s.attacker !== this && "mob" === s.type
        ? armorEnch(this, "thorns")
        : 0;
    return (
      e &&
        Math.random() < 0.15 * e &&
        s.attacker.hurt(e > 10 ? e - 10 : 1 + Math.floor(4 * Math.random()), {
          type: "thorns",
          attacker: this,
          knockFrom: this.pos,
        }),
      i
    );
  }
  die(t) {
    (super.die(t), this.game.onPlayerDeath(t));
  }
  exhaust(t) {
    this.creative || (this.exhaustion += t);
  }
  handsTick() {
    this.xpDelay > 0 && this.xpDelay--;
    const t = this.inv.held ? this.inv.held.id : -1;
    t !== this.lastHeldId
      ? ((this.lastHeldId = t), (this.attackT = 0))
      : (this.attackT = (this.attackT || 0) + 1);
    const s = this.game.attackStrength(1);
    ((this.oHandH = this.handH ?? 1),
      void 0 === this.handItem && (this.handItem = t),
      (this.handH =
        this.oHandH + clamp((this.handItem === t ? s * s * s : 0) - this.oHandH, -0.4, 0.4)),
      this.handH < 0.1 && (this.handItem = t));
  }
  hungerTick() {
    if (this.creative || this.game.net)
      ((this.food = 20),
        this.pos[1] >= -40 && (this.health = this.maxHealth),
        (this.air = 300),
        (this.fire = 0));
    else if (
      (0 === this.game.difficulty &&
        (this.age % 20 == 0 &&
          this.health < this.maxHealth &&
          (this.health = Math.min(this.maxHealth, this.health + 1)),
        this.age % 10 == 0 && this.food < 20 && this.food++),
      this.exhaustion >= 4 &&
        ((this.exhaustion -= 4),
        this.saturation > 0
          ? (this.saturation = Math.max(0, this.saturation - 1))
          : (this.food = Math.max(0, this.food - 1))),
      this.foodTimer++,
      this.food >= 18 && this.health < this.maxHealth)
    )
      this.foodTimer >= (this.saturation > 0 && 20 === this.food ? 10 : 80) &&
        ((this.health = Math.min(this.maxHealth, this.health + 1)),
        this.exhaust(6),
        (this.foodTimer = 0));
    else if (this.food <= 0) {
      if (this.foodTimer >= 80) {
        const t = this.game.difficulty;
        ((this.health > 10 || 3 === t || (this.health > 1 && 2 === t)) &&
          this.hurt(1, { type: "starve" }),
          (this.foodTimer = 0));
      }
    } else this.foodTimer = 0;
    this.swingT > 0 && this.swingT--;
  }
  tick(t) {
    if ((this.savePrev(), this.baseTick(), this.deathTime > 0)) return void this.deathTime++;
    const s = this.creative;
    (!s && this.flying && (this.flying = !1), (this.sneakHeld = !!t.sneak));
    const i = this.world.waterAt(
      Math.floor(this.pos[0]),
      Math.floor(this.pos[1] + this.eye()),
      Math.floor(this.pos[2]),
    );
    this.flying
      ? (this.swimming = !1)
      : this.swimming
        ? (this.swimming = this.sprinting && this.inWater)
        : (this.swimming = this.sprinting && i && this.inWater && t.fwd > 0);
    const fits = (t) => {
      const s = this.h;
      this.h = t;
      const i = this.box();
      ((this.h = s), blockBoxes(this.world, i[0], i[1], i[2], i[3], i[4], i[5], _boxes));
      for (const t of _boxes) {
        if (!(
          i[0] < t[3] &&
          i[3] > t[0] &&
          i[1] < t[4] &&
          i[4] > t[1] &&
          i[2] < t[5] &&
          i[5] > t[2]
        ))
          continue;
        const s =
          BLOCKS[
            this.world.getBlock(
              Math.floor((t[0] + t[3]) / 2),
              Math.floor((t[1] + t[4]) / 2),
              Math.floor((t[2] + t[5]) / 2),
            )
          ];
        if (!s || !s.door) return !1;
      }
      return !0;
    };
    let e = "stand";
    (this.spectator
      ? ((this.flying = !0), (this.noClip = !0), (this.swimming = !1))
      : this.swimming || (this.gliding && !this.glideFlip)
        ? (e = "swim")
        : t.prone && !this.flying && !this.inWater && fits(PLAYER_H.prone) // W12a: 趴姿（07-§3.1，水中禁趴）
          ? (e = "prone")
          : t.sneak && !this.flying && fits(PLAYER_H.crouch)
            ? (e = "crouch")
            : this.noClip || fits(PLAYER_H.stand) ||
              (e = fits(PLAYER_H.crouch) ? "crouch" : this.proning && fits(PLAYER_H.prone) ? "prone" : "swim"), // W12a: 起立空间不足保持趴（07-§3.1）
      (this.pose = e),
      this.handsTick(),
      (this.prevSwimAmt = this.swimAmt || 0),
      (this.swimAmt = clamp(this.prevSwimAmt + ("swim" === e ? 0.09 : -0.09), 0, 1)),
      (this.crawling = "swim" === e && !this.swimming),
      (this.sneaking = "crouch" === e),
      (this.proning = "prone" === e), // W12a: 趴姿标志（07-§3）
      (this.sneakEdge = this.sneaking || this.proning), // W12a: 趴姿沿用潜行边缘保护（07-§3.2）
      (this.h = PLAYER_H[e]));
    const h = s || this.food > 6;
    (t.sprint && t.fwd > 0 && h && !this.sneaking && !this.crawling && !this.proning && (this.sprinting = !0), // W12a: 趴姿禁冲刺（07-§3.2）
      (t.fwd <= 0 || (this.collidedH && !this.swimming) || !h || this.sneaking || this.crawling || this.proning) &&
        (this.sprinting = !1));
    const o =
      (0.1 + (this.speedBonus ? this.speedBonus() : 0)) *
      (this.sprinting ? 1.3 : 1) *
      effectSpeedFactor(this) *
      (this.speedK || 1);
    let a = 0.98 * t.fwd,
      r = 0.98 * t.strafe;
    if (this.sneaking || this.crawling) {
      const t = this.sneakSpeed ? this.sneakSpeed() : 0.3;
      ((a *= t), (r *= t));
    }
    if (this.proning) {
      const t = self.SURV && SURV.TUNE ? SURV.TUNE.proneSpd : 0.25; // W12a: 趴姿移速 ×0.25（07-§3.2）
      ((a *= t), (r *= t));
    }
    if (
      (!(this.useT > 0 && this.usingItem) ||
        (ITEMS[this.usingItem] && /_spear$/.test(ITEMS[this.usingItem].key)) ||
        ((a *= 0.2), (r *= 0.2)),
      (this.airSpeed = this.sprinting ? 0.026 : 0.02),
      (this.slowFall = !1),
      this.flying)
    ) {
      const s = this.vel;
      this.accel(a, r, this.sprinting ? 0.1 : 0.05);
      let i = 0;
      (t.jump && (i += 0.375),
        t.sneak && (i -= 0.375),
        (s[1] += 0.4 * (i - s[1])),
        this.move(s[0], s[1], s[2]),
        (s[0] *= 0.91),
        (s[2] *= 0.91),
        (s[1] *= 0.6),
        this.onGround && t.sneak && !this.spectator && (this.flying = !1),
        (this.fallDist = 0));
    } else if (this.survDiveT > 0) {
      // W12a: 飞扑运动结算（07-§4.2 定死：峰值 7 方块/s、阻力 ×0.99、重力 −0.05/tick、方向锁定）
      --this.survDiveT;
      const dv = this.survDiveDir, exp = Math.hypot(dv[0], dv[2]);
      ((this.vel[0] = dv[0]), (this.vel[1] = this.survDiveVy), (this.vel[2] = dv[2]),
        this.move(this.vel[0], this.vel[1], this.vel[2]),
        (this.survDiveVy -= 0.05), (dv[0] *= 0.99), (dv[2] *= 0.99));
      const got = Math.hypot(this.pos[0] - this.prev[0], this.pos[2] - this.prev[2]);
      const reason =
        this.inWater ? "water" :                                  // 扑入水 → swim（07-§4.4）
        got < exp * (self.SURV && SURV.TUNE ? SURV.TUNE.diveWallK : 0.4) ? "wall" : // 撞墙（水平骤降 >60%）
        this.survDiveT <= 0 ? "land" : null;
      if (reason) {
        this.survDiveT = 0;
        this.onSurvDiveEnd && this.onSurvDiveEnd(reason);         // 落地强制接趴/撞墙扣体力由 survival 侧处理
      }
    } else {
      t.jump &&
        this.onGround &&
        !this.inWater &&
        !this.inLava &&
        !this.proning && // W12a: 趴姿跳跃键语义 = 起立（survival 侧消费），不跳（07-§3.1）
        ((this.vel[1] = 0.42 * jumpFactorOf(this) + effectJumpBoost(this)),
        this.sprinting
          ? ((this.vel[0] += 0.2 * -Math.sin(this.yaw)),
            (this.vel[2] += 0.2 * -Math.cos(this.yaw)),
            this.exhaust(0.2))
          : this.exhaust(0.05),
        (this.jumpT = 0), this.onSurvJump && this.onSurvJump()); // W12a: 跳跃体力消耗钩子（07-§2.2）
      const s = this.onGround;
      if (
        (this.travel(a, r, o, t.jump),
        this.game.settings.autoJump &&
          s &&
          this.vel[1] <= 0 &&
          this.collidedH &&
          (t.fwd || t.strafe) &&
          !this.sneaking &&
          !this.inWater)
      ) {
        const s = this.yaw,
          i = -Math.sin(s) * t.fwd + Math.cos(s) * t.strafe,
          e = -Math.cos(s) * t.fwd - Math.sin(s) * t.strafe,
          h = Math.hypot(i, e) || 1,
          o = this.w / 2 + 0.3,
          a = Math.floor(this.pos[0] + (i / h) * o),
          r = Math.floor(this.pos[2] + (e / h) * o),
          n = Math.floor(this.pos[1] + 0.5),
          solid = (t) => {
            const s = BLOCKS[this.world.getBlock(a, t, r)];
            return s && s.solid;
          };
        blockBoxes(this.world, a + 0.01, n + 0.01, r + 0.01, a + 0.99, n + 0.99, r + 0.99, _boxes);
        let l = n;
        for (const t of _boxes)
          t[0] < a + 1 && t[3] > a && t[2] < r + 1 && t[5] > r && (l = Math.max(l, t[4]));
        solid(n) &&
          !solid(n + 1) &&
          !solid(n + 2) &&
          l <= n + 1.01 &&
          ((this.vel[1] = 0.42 * jumpFactorOf(this)), this.exhaust(0.05));
      }
    }
    const n = this.pos[0] - this.prev[0],
      l = this.pos[2] - this.prev[2];
    if (this.sprinting && this.onGround && !this.inWater) {
      const t = this.world.getBlock(
        Math.floor(this.pos[0]),
        Math.floor(this.pos[1] - 0.2),
        Math.floor(this.pos[2]),
      );
      t &&
        BLOCKS[t].shape !== SH_LIQUID &&
        this.game.particles.spawn(
          "block",
          this.pos[0] + 0.6 * (Math.random() - 0.5),
          this.pos[1] + 0.1,
          this.pos[2] + 0.6 * (Math.random() - 0.5),
          2 * -n,
          0.15,
          2 * -l,
          {
            id: t,
            meta: this.world.getMeta(
              Math.floor(this.pos[0]),
              Math.floor(this.pos[1] - 0.2),
              Math.floor(this.pos[2]),
            ),
            tint: this.game.blockTintAt(
              Math.floor(this.pos[0]),
              Math.floor(this.pos[2]),
              t,
              this.world.getMeta(
                Math.floor(this.pos[0]),
                Math.floor(this.pos[1] - 0.2),
                Math.floor(this.pos[2]),
              ),
            ),
          },
        );
    }
    const c = Math.hypot(n, l);
    if (this.onGround && !this.flying) {
      if (
        ((this.distWalked += c),
        this.sprinting && this.exhaust(0.1 * c),
        this.distWalked > 1.7 && !this.sneaking)
      ) {
        this.distWalked = 0;
        const t = this.world.getBlock(
          Math.floor(this.pos[0]),
          Math.floor(this.pos[1] - 0.2),
          Math.floor(this.pos[2]),
        );
        t &&
          BLOCKS[t] &&
          Sound.block("step", BLOCKS[t].sound, [this.pos[0], this.pos[1], this.pos[2]]);
      }
    } else if (
      this.inWater &&
      ((this.swimDist = (this.swimDist || 0) + 0.6 * c), this.swimDist > 1)
    ) {
      this.swimDist = 0;
      const t = this.vel;
      Sound.ev(
        "entity.player.swim",
        null,
        Math.min(1, 0.35 * Math.sqrt(t[0] * t[0] * 0.2 + t[1] * t[1] + t[2] * t[2] * 0.2)),
        1 + 0.4 * (Math.random() - Math.random()),
      );
    }
    ((this.prevBob = this.bob), (this.prevBobAmt = this.bobAmt));
    const p = this.onGround && !this.flying ? Math.min(0.1, c) : 0;
    ((this.bobAmt += 0.4 * (p - this.bobAmt)), (this.bob += c), this.hungerTick(), this.animate());
  }
}
const WATER_MOBS =
    /^(cod|salmon|pufferfish|tropical_fish|squid|glow_squid|dolphin|axolotl|turtle|frog|tadpole|drowned|guardian|elder_guardian|nautilus|zombie_nautilus)$/,
  SINKING_MOBS =
    /^(zombie|zombie_villager|husk|drowned|giant|skeleton|stray|bogged|parched|wither_skeleton|zombified_piglin)$/,
  UNDEAD_MOBS =
    /^(zombie|zombie_villager|husk|drowned|zombified_piglin|zombie_horse|zombie_nautilus|camel_husk|skeleton|stray|bogged|parched|wither_skeleton|skeleton_horse|phantom|wither|zoglin)$/;
function zombiePrey(t) {
  let s = null,
    i = 16;
  for (const e of t.game.entities) {
    if (e === t || e.dead || e.deathTime || !(e instanceof Living)) continue;
    const h = "villager" === e.type || "wandering_trader" === e.type;
    if (!h && "iron_golem" !== e.type && ("turtle" !== e.type || !e.baby || e.inWater)) continue;
    const o = t.distTo(e);
    o < i && (h || t.canSee(e)) && ((s = e), (i = o));
  }
  return s;
}
const PATH_OPEN_SOLID =
    /carpet$|candle$|^(ladder|scaffolding|daylight_detector|turtle_egg|pitcher_crop|item_frame|glow_item_frame)$/,
  PATH_TYPE = new Int8Array(MAX_BLOCKS).fill(-1);
function pathTypeOf(t) {
  const s = BLOCKS[t],
    i = (s && s.key) || "";
  return s
    ? IS_FLUID[t]
      ? t === LAVA || 2 === FLUID_MOD[t]
        ? 3
        : 2
      : s.waterlogged
        ? 2
        : /^(fire|soul_fire|magma_block|lava_cauldron)$/.test(i)
          ? 3
          : /^(cactus|sweet_berry_bush|wither_rose|pointed_dripstone|sulfur_spike)$/.test(i)
            ? 4
            : s.trapdoor || /trapdoor$|^(lily_pad|big_dripleaf|honey_block|powder_snow)$/.test(i)
              ? 5
              : /campfire$/.test(i) || s.gate
                ? -2
                : (s.solid ? !PATH_OPEN_SOLID.test(i) : /rail$|^cocoa$/.test(i))
                  ? 1
                  : 0
    : 1;
}
function pathTypeAt(t, s, i, e) {
  const h = t.getBlock(s, i, e);
  if (!h) return 0;
  let o = PATH_TYPE[h];
  if ((-1 === o && (o = PATH_TYPE[h] = pathTypeOf(h)), -2 === o)) {
    const a = BLOCKS[h].states && BLOCKS[h].states[t.getMeta(s, i, e)];
    if (!BLOCKS[h].gate) return a && "true" === a.lit ? 3 : 1;
    if (!a || "true" !== a.open) return 1;
    o = 0;
  }
  return 0 === o && t.isWaterlogged(s, i, e) ? 2 : o;
}
function walkableAt(t, s, i, e) {
  if (0 !== pathTypeAt(t, s, i, e) || 1 !== pathTypeAt(t, s, i - 1, e)) return !1;
  for (let h = -1; h <= 1; h++)
    for (let o = -1; o <= 1; o++)
      if (h || o)
        for (let a = -1; a <= 1; a++) {
          const r = pathTypeAt(t, s + h, i + a, e + o);
          if (r >= 2 && r <= 4) return !1;
        }
  return !0;
}
const MOB_TYPES = {
  pig: {
    cn: "猪",
    hp: 10,
    w: 0.9,
    h: 0.9,
    speed: 0.25,
    model: "pig",
    passive: !0,
    food: "carrot",
    drops: [["porkchop", 1, 3, "cooked_porkchop"]],
    scale: 1,
  },
  cow: {
    cn: "牛",
    hp: 10,
    w: 0.9,
    h: 1.4,
    speed: 0.2,
    model: "cow",
    passive: !0,
    food: "wheat",
    drops: [
      ["beef", 1, 3, "cooked_beef"],
      ["leather", 0, 2],
    ],
    scale: 1,
  },
  sheep: {
    cn: "羊",
    hp: 8,
    w: 0.9,
    h: 1.3,
    speed: 0.23,
    model: "sheep",
    passive: !0,
    food: "wheat",
    drops: [["mutton", 1, 2, "cooked_mutton"]],
    scale: 1,
  },
  chicken: {
    cn: "鸡",
    hp: 4,
    w: 0.4,
    h: 0.7,
    speed: 0.25,
    model: "chicken",
    passive: !0,
    food: "wheat_seeds",
    drops: [
      ["chicken", 1, 1, "cooked_chicken"],
      ["feather", 0, 2],
    ],
    scale: 1,
  },
  zombie: {
    cn: "僵尸",
    hp: 20,
    w: 0.6,
    h: 1.95,
    speed: 0.23,
    model: "zombie",
    hostile: !0,
    attack: 3,
    armor: 2,
    burns: !0,
    drops: [["rotten_flesh", 0, 2]],
    scale: 0.9375,
  },
  skeleton: {
    cn: "骷髅",
    hp: 20,
    w: 0.6,
    h: 1.99,
    speed: 0.25,
    model: "skeleton",
    hostile: !0,
    burns: !0,
    ranged: !0,
    drops: [
      ["bone", 0, 2],
      ["arrow", 0, 2],
    ],
    scale: 0.9375,
  },
  creeper: {
    cn: "苦力怕",
    hp: 20,
    w: 0.6,
    h: 1.7,
    speed: 0.25,
    model: "creeper",
    hostile: !0,
    drops: [["gunpowder", 0, 2]],
    scale: 1,
  },
  spider: {
    cn: "蜘蛛",
    hp: 16,
    w: 1.4,
    h: 0.9,
    speed: 0.3,
    model: "spider",
    hostile: !0,
    attack: 2,
    climbs: !0,
    drops: [["string", 0, 2]],
    scale: 1,
  },
};
class Mob extends Living {
  constructor(t, s, i, e, h) {
    const o = MOB_TYPES[s];
    if (
      (super(t, i, e, h, o.w, o.h, o.hp),
      (this.type = s),
      (this.T = o),
      (this.fireproof = !!o.fireproof),
      (this.yaw = Math.random() * Math.PI * 2),
      (this.bodyYaw = this.yaw),
      (this.target = null),
      (this.wander = null),
      (this.wanderT = 0),
      (this.panic = 0),
      (this.attackCd = 0),
      (this.fuse = -1),
      (this.prevFuse = -1),
      (this.sheared = !1),
      (this.woolColor = 0),
      (this.persistent = !!o.passive),
      (this.idleSound = 100 + 300 * Math.random()),
      (this.stuck = 0),
      (this.eggT = 6e3 + 6e3 * Math.random()),
      (this.waterSpeed = 1.5),
      (this._seeAge = -1),
      (this._seeOf = null),
      (this._see = !1),
      UNDEAD_MOBS.test(s) && (this.waterBreather = !0),
      "chicken" === s && (this.slowFall = !0),
      "sheep" === s)
    ) {
      const t = Math.random();
      this.woolColor =
        t < 0.05 ? 15 : t < 0.1 ? 7 : t < 0.15 ? 8 : t < 0.18 ? 12 : t < 0.182 ? 6 : 0;
    }
  }
  hurt(t, s) {
    if (this.T.armor && t > 0 && (!s || ("void" !== s.type && !s.bypass))) {
      const i =
        s && s.attacker && s.attacker.inv && "function" == typeof enchLevel
          ? enchLevel(s.attacker.inv.held, "breach")
          : 0;
      t *= 1 - (Math.min(20, this.T.armor) * Math.max(0, 1 - 0.15 * i)) / 25;
    }
    const i = super.hurt(t, s);
    return (
      i &&
        (this.xzDummy || Sound.mob(this.type, this.health <= 0 ? "death" : "hurt", this.pos),
        this.T.passive && (this.panic = 100),
        s && s.attacker && !this.T.passive && (this.target = s.attacker),
        "spider" === this.type && s && s.attacker && (this.target = s.attacker)),
      i
    );
  }
  die(t) {
    (super.die(t), t && (t.attacker === this.game.player || t.player) && this.game.stats.kills++);
    const s = Math.random;
    if (!this.baby)
      for (const [i, e, h, o] of this.T.drops) {
        const a =
          e +
          Math.floor(s() * (h - e + 1)) +
          (t && t.looting ? Math.floor(s() * (t.looting + 1)) : 0);
        a > 0 &&
          this.game.dropItem(
            this.pos[0],
            this.pos[1] + 0.5,
            this.pos[2],
            makeStack(this.fire > 0 && o ? o : i, a),
          );
      }
    ("sheep" !== this.type ||
      this.sheared ||
      this.game.dropItem(
        this.pos[0],
        this.pos[1] + 0.5,
        this.pos[2],
        makeStack(woolKey(this.woolColor), 1),
      ),
      "creeper" === this.type &&
        t &&
        "arrow" === t.type &&
        Math.random() < 0.2 &&
        this.game.dropItem(this.pos[0], this.pos[1] + 0.5, this.pos[2], makeStack("tnt", 1)),
      this.game.onMobKilled(this, t));
  }
  deathTick() {
    if (this.deathTime <= 0) return !1;
    if (
      (this.deathTime++,
      this.T.flying ? this.move(0, -0.05, 0) : this.travel(0, 0, 0, !1),
      this.deathTime > 20)
    ) {
      this.dead = !0;
      for (let t = 0; t < 12; t++)
        this.game.particles.spawn(
          "poof",
          this.pos[0] + (Math.random() - 0.5) * this.w,
          this.pos[1] + Math.random() * this.h,
          this.pos[2] + (Math.random() - 0.5) * this.w,
          0.1 * (Math.random() - 0.5),
          0.1 * Math.random(),
          0.1 * (Math.random() - 0.5),
        );
      this.onRemoved && this.onRemoved();
    }
    return !0;
  }
  tick() {
    if ((this.savePrev(), this.baseTick(), this.deathTick())) return;
    const t = this.game,
      s = t.player,
      i = this.T;
    let e = 0,
      h = !1,
      o = 1,
      a = 0,
      r = null;
    const n = this.distTo(s),
      l = (i.burns || "spider" === this.type) && t.isDay();
    if (!this.persistent && (n > 100 || (n > 40 && this.age > 600 && Math.random() < 0.001)))
      return void (this.dead = !0);
    if (i.burns && l && !this.inWater && this.age % 20 == 0) {
      this.world.skyAt(
        Math.floor(this.pos[0]),
        Math.floor(this.pos[1] + this.h),
        Math.floor(this.pos[2]),
      ) >= 15 &&
        t.weather < 0.5 &&
        (this.fire = Math.max(this.fire, 160));
    }
    (n < 32 && Sound.warmMob && Sound.warmMob(this.type),
      --this.idleSound < 0 &&
        ((this.idleSound = 200 + 400 * Math.random()),
        n < 20 && Sound.mob(this.type, "idle", this.pos)),
      this.attackCd > 0 && this.attackCd--);
    const c = 0 === s.deathTime && !s.creative;
    if (i.hostile) {
      (("spider" === this.type && l && !this.target) ||
        ((!this.target || this.target === this.prey) &&
          c &&
          n < seenWithin(s, 16) &&
          this.sees(s) &&
          (this.target = s)),
        this.target &&
          (this.target.dead ||
            this.target.deathTime > 0 ||
            (this.target === s && (!c || n > 24)) ||
            (this.target !== s && this.distTo(this.target) > 24)) &&
          (this.target = null),
        "spider" === this.type &&
          l &&
          this.target &&
          !this.provoked &&
          this.age % 100 == 0 &&
          (this.target = null),
        this.target ||
          ("zombie" !== this.type && "zombie_villager" !== this.type) ||
          (this.age + this.id) % 10 != 0 ||
          (this.target = this.prey = zombiePrey(this)));
      const t = this.target;
      t &&
        ((t === this.prey && ("villager" === t.type || "wandering_trader" === t.type)) ||
        this.sees(t)
          ? (this.unseenT = 0)
          : ++this.unseenT > 60 && (this.target = null));
    }
    if (this.target) {
      const t = this.target,
        s = t.pos[0] - this.pos[0],
        h = t.pos[2] - this.pos[2],
        o = Math.hypot(s, h),
        n = Math.atan2(-s, -h);
      if (((r = t), i.ranged)) {
        this.turnTo(n, 0.3);
        const s = this.sees(t);
        ((this.seeT = s ? Math.max(0, this.seeT || 0) + 1 : Math.min(0, this.seeT || 0) - 1),
          o <= 15 && this.seeT >= 20
            ? ((this.strafeT = (this.strafeT ?? -1) + 1),
              this.strafeT >= 20 &&
                (Math.random() < 0.3 && (this.strafeCw = !this.strafeCw),
                Math.random() < 0.3 && (this.strafeBack = !this.strafeBack),
                (this.strafeT = 0)),
              o > 13 ? (this.strafeBack = !1) : o < 7.5 && (this.strafeBack = !0),
              (e = this.strafeBack ? -0.5 : 0.5),
              (a = this.strafeCw ? 0.5 : -0.5))
            : ((e = 1), (this.strafeT = -1)),
          this.attackCd <= 0 &&
            o < 16 &&
            s &&
            (this.shoot(t), (this.attackCd = 40 + Math.floor(20 * Math.random()))));
      } else if ("creeper" === this.type) {
        this.turnTo(n, 0.4);
        const s = this.distTo(t);
        (s < 3 && this.sees(t)
          ? this.fuse < 0 && ((this.fuse = 0), Sound.fuse(this.pos))
          : this.fuse >= 0 &&
            !this.ignited &&
            (s > 7 || !this.sees(t)) &&
            (this.fuse = Math.max(-1, this.fuse - 2)),
          this.fuse < 0 && (e = 1));
      } else {
        (this.turnTo(n, 0.4),
          (e = 1),
          "spider" === this.type &&
            this.onGround &&
            o < 4 &&
            o > 1.5 &&
            Math.random() < 0.1 &&
            ((this.vel[1] = 0.4), (this.vel[0] += (s / o) * 0.3), (this.vel[2] += (h / o) * 0.3)));
        const a = this.w / 2 + t.w / 2 + 0.6,
          r = Math.min(this.pos[1], this.jumpFromY ?? this.pos[1]);
        o < a &&
          t.pos[1] < r + this.h &&
          t.pos[1] + t.h > r &&
          this.attackCd <= 0 &&
          ((this.attackCd = 20),
          (this.swingT = 6),
          (this.hitLanded = t.hurt(i.attack, {
            type: "mob",
            attacker: this,
            knockFrom: this.pos,
          })));
      }
    } else if (this.panic > 0)
      (this.panic--,
        (o = 1.6),
        (!this.wander || this.wanderT <= 0 || this.age % 20 == 0) && this.pickWander(6));
    else {
      const t = s.inv.held;
      i.passive && t && i.food && t.id === item(i.food) && n < 8 && n > 2
        ? ((r = s),
          this.turnTo(Math.atan2(-(s.pos[0] - this.pos[0]), -(s.pos[2] - this.pos[2])), 0.3),
          (e = 1))
        : (!(this.lookT > 0) &&
            n < 8 &&
            Math.random() < 0.02 &&
            (this.lookT = 40 + Math.floor(40 * Math.random())),
          this.lookT > 0 && (n < 8 ? (this.lookT--, (r = s)) : (this.lookT = 0)));
    }
    if (
      (this.fuse >= 0 &&
        !this.target &&
        "creeper" === this.type &&
        !this.ignited &&
        (this.fuse = Math.max(-1, this.fuse - 2)),
      this.creeperTick())
    )
      return;
    const p = this.inWater && SINKING_MOBS.test(this.type);
    if (
      (!this.target &&
        this.inWater &&
        this.landMob &&
        !this.wander &&
        this.age % 10 == 0 &&
        this.pickWander(12, p ? this.waterTop() : void 0),
      !this.target && 0 === e)
    )
      if (this.wander) {
        this.wanderT--;
        const t = this.wander[0] - this.pos[0],
          s = this.wander[2] - this.pos[2];
        Math.hypot(t, s) < 0.8 || this.wanderT <= 0
          ? (this.wander = null)
          : (this.turnTo(Math.atan2(-t, -s), 0.25), (e = 1));
      } else Math.random() < (this.panic > 0 ? 1 : 0.008) && this.pickWander(10);
    if (a) {
      const t = Math.sin(this.yaw),
        s = Math.cos(this.yaw),
        i = -t * e + s * a,
        h = -s * e - t * a,
        o = Math.hypot(i, h) || 1,
        r = this.w / 2 + 0.5,
        n = Math.floor(this.pos[0] + (i / o) * r),
        l = Math.floor(this.pos[2] + (h / o) * r),
        c = Math.floor(this.pos[1]);
      walkableAt(this.world, n, c, l) || ((e = 1), (a = 0));
    }
    if (e > 0) {
      const t = this.pos[0] - Math.sin(this.yaw) * (this.w / 2 + 0.5),
        s = this.pos[2] - Math.cos(this.yaw) * (this.w / 2 + 0.5),
        o = Math.floor(t),
        a = Math.floor(s),
        r = Math.floor(this.pos[1]),
        n = chunkOf(this.world, o, a);
      let l = 0,
        c = cellB(this.world, n, o, r - 1, a);
      for (; l < 5 && !BLOCKS[c].solid && !IS_FLUID[c];)
        (l++, (c = cellB(this.world, n, o, r - 1 - l, a)));
      const p = c === LAVA || cellB(this.world, n, o, r, a) === LAVA,
        f =
          !this.target &&
          this.landMob &&
          !this.inWater &&
          !!this.wander &&
          (this.world.waterAt(o, r, a) || this.world.waterAt(o, r - 1 - l, a));
      ((p || f || (l > 3 && !this.target)) && ((e = 0), (this.wander = null)),
        this.collidedH && this.onGround && !this.noJump && (h = !0),
        this.collidedH && i.climbs && ((this.vel[1] = 0.2), (this.fallDist = 0)));
    }
    (this.inWater && (this.collidedH || (this.vel[1] < 0.02 && !p)) && (h = !0),
      e > 0 && Math.hypot(this.pos[0] - this.prev[0], this.pos[2] - this.prev[2]) < 0.01
        ? ++this.stuck > 30 &&
          ((this.yaw += 2 * (Math.random() - 0.5)), (this.stuck = 0), (this.wander = null))
        : (this.stuck = 0),
      !h || !this.onGround || (p && this.waterDepth() > 0.4)
        ? this.onGround && (this.jumpFromY = void 0)
        : ((this.vel[1] = 0.42), (this.jumpFromY = this.pos[1])));
    const f = i.speed * i.speed * o * (this.fuse >= 0 ? 0.4 : 1);
    this.travel(e, a, f, h);
    let d = this.yaw - this.bodyYaw;
    for (; d > Math.PI;) d -= 2 * Math.PI;
    for (; d < -Math.PI;) d += 2 * Math.PI;
    if (((this.bodyYaw += 0.3 * d), r)) {
      const t = r.pos[0] - this.pos[0],
        s = r.pos[2] - this.pos[2];
      let i = Math.atan2(-t, -s) - this.bodyYaw;
      for (; i > Math.PI;) i -= 2 * Math.PI;
      for (; i < -Math.PI;) i += 2 * Math.PI;
      this.headYaw += 0.3 * (clamp(i, -1.2, 1.2) - this.headYaw);
      const e = r.pos[1] + (r.eyeH || 1) - (this.pos[1] + 0.85 * this.h);
      this.pitch = clamp(Math.atan2(e, Math.hypot(t, s)), -0.8, 0.8);
    } else ((this.headYaw *= 0.9), (this.pitch *= 0.9));
    if (
      ("chicken" === this.type &&
        --this.eggT < 0 &&
        ((this.eggT = 6e3 + 6e3 * Math.random()),
        this.game.dropItem(this.pos[0], this.pos[1] + 0.3, this.pos[2], makeStack("egg", 1)),
        Sound.pop(this.pos)),
      "sheep" === this.type && this.sheared && Math.random() < 0.002)
    ) {
      const t = Math.floor(this.pos[0]),
        s = Math.floor(this.pos[1] - 0.5),
        i = Math.floor(this.pos[2]);
      2 === this.world.getBlock(t, s, i) &&
        (this.world.setBlock(t, s, i, 3, 0), (this.sheared = !1), (this.eatT = 40));
    }
    (this.eatT > 0 && this.eatT--,
      this.loveT > 0 &&
        (this.loveT--,
        this.age % 10 == 0 &&
          this.game.particles.spawn(
            "heart",
            this.pos[0] + (Math.random() - 0.5) * this.w,
            this.pos[1] + this.h,
            this.pos[2] + (Math.random() - 0.5) * this.w,
            0,
            0.02,
            0,
          )),
      this.baby &&
        --this.growT <= 0 &&
        ((this.baby = !1), (this.w = this.T.w), (this.h = this.T.h)),
      this.swingT > 0 && this.swingT--,
      this.animate());
  }
  makeBaby() {
    return (
      (this.baby = !0),
      (this.growT = 6e3),
      (this.w = 0.5 * this.T.w),
      (this.h = 0.5 * this.T.h),
      this
    );
  }
  creeperTick() {
    if ("creeper" !== this.type || this.fuse < 0) return ((this.prevFuse = this.fuse), !1);
    if (((this.prevFuse = this.fuse), this.fuse++, this.fuse >= 30)) {
      this.dead = !0;
      const t = this.world,
        s = Math.floor(this.pos[0]),
        i = Math.floor(this.pos[2]),
        e =
          t.waterAt(s, Math.floor(this.pos[1]), i) ||
          (!this.onGround && t.waterAt(s, Math.floor(this.pos[1] - 0.2), i));
      return (
        this.game.explode(this.pos[0], this.pos[1] + 0.8, this.pos[2], 3, this, e, !1, !0),
        !0
      );
    }
    return !1;
  }
  turnTo(t, s) {
    let i = t - this.yaw;
    for (; i > Math.PI;) i -= 2 * Math.PI;
    for (; i < -Math.PI;) i += 2 * Math.PI;
    this.yaw += clamp(i, -s, s);
  }
  get landMob() {
    return !(
      WATER_MOBS.test(this.type || "") ||
      this.flies ||
      ("undefined" != typeof FlyingMob && this instanceof FlyingMob)
    );
  }
  dryGround(t, s, i) {
    const e = this.world,
      h = Math.floor(t),
      o = Math.floor(i);
    for (let t = s + 2; t >= s - 4; t--) {
      const s = BLOCKS[e.getBlock(h, t - 1, o)];
      if (s && s.solid && !BLOCKS[e.getBlock(h, t, o)]?.solid)
        return e.waterAt(h, t, o) || e.waterAt(h, t - 1, o) || e.getBlock(h, t, o) === LAVA
          ? null
          : t;
    }
    return null;
  }
  waterTop() {
    const t = this.world,
      s = Math.floor(this.pos[0]),
      i = Math.floor(this.pos[2]);
    let e = Math.floor(this.pos[1]);
    for (let h = 0; h < 32 && t.waterAt(s, e, i); h++) e++;
    return e;
  }
  pickWander(t, s = Math.floor(this.pos[1])) {
    const i = this.landMob;
    for (let e = 0; e < (i ? 10 : 1); e++) {
      const e = Math.random() * Math.PI * 2,
        h = 3 + Math.random() * t,
        o = this.pos[0] + Math.sin(e) * h,
        a = this.pos[2] + Math.cos(e) * h,
        r = i ? this.dryGround(o, s, a) : s;
      if (null !== r) return ((this.wander = [o, r, a]), (this.wanderT = 120), !0);
    }
    return !1;
  }
  canSee(t) {
    const s = this.world,
      i = this.pos[0],
      e = this.pos[1] + (this.eyeH || 0.85 * this.h),
      h = this.pos[2],
      o = t.pos[0] - i,
      a = t.pos[1] + ("function" == typeof t.eye ? t.eye() : t.eyeH || 0.85 * t.h) - e,
      r = t.pos[2] - h;
    if (o * o + a * a + r * r > 16384) return !1;
    const n = o > 0 ? 1 : o < 0 ? -1 : 0,
      l = a > 0 ? 1 : a < 0 ? -1 : 0,
      c = r > 0 ? 1 : r < 0 ? -1 : 0,
      p = 1 / o,
      f = 1 / a,
      d = 1 / r;
    let u = Math.floor(i),
      m = Math.floor(e),
      M = Math.floor(h),
      g = n > 0 ? (u + 1 - i) * p : n < 0 ? (u - i) * p : 1 / 0,
      k = l > 0 ? (m + 1 - e) * f : l < 0 ? (m - e) * f : 1 / 0,
      b = c > 0 ? (M + 1 - h) * d : c < 0 ? (M - h) * d : 1 / 0;
    const w = Math.abs(p),
      y = Math.abs(f),
      v = Math.abs(d);
    for (let t = 0; t < 512; t++) {
      const t = BLOCKS[s.getBlock(u, m, M)];
      if (t && t.solid) {
        if (t.shape === SH_CUBE) return !1;
        for (const t of blockBoxes(s, u, m + 1, M, u + 0.5, m + 0.5, M + 0.5, _sightBoxes)) {
          let s = 0,
            o = 1;
          if (0 === n) {
            if (i <= t[0] || i >= t[3]) continue;
          } else {
            let e = (t[0] - i) * p,
              h = (t[3] - i) * p;
            if (e > h) {
              const t = e;
              ((e = h), (h = t));
            }
            (e > s && (s = e), h < o && (o = h));
          }
          if (0 === l) {
            if (e <= t[1] || e >= t[4]) continue;
          } else {
            let i = (t[1] - e) * f,
              h = (t[4] - e) * f;
            if (i > h) {
              const t = i;
              ((i = h), (h = t));
            }
            (i > s && (s = i), h < o && (o = h));
          }
          if (0 === c) {
            if (h <= t[2] || h >= t[5]) continue;
          } else {
            let i = (t[2] - h) * d,
              e = (t[5] - h) * d;
            if (i > e) {
              const t = i;
              ((i = e), (e = t));
            }
            (i > s && (s = i), e < o && (o = e));
          }
          if (s < o) return !1;
        }
      }
      if (g <= k && g <= b) {
        if (g > 1) break;
        ((u += n), (g += w));
      } else if (k <= b) {
        if (k > 1) break;
        ((m += l), (k += y));
      } else {
        if (b > 1) break;
        ((M += c), (b += v));
      }
    }
    return !0;
  }
  sees(t) {
    return (
      (this._seeAge === this.age && this._seeOf === t) ||
        ((this._seeAge = this.age), (this._seeOf = t), (this._see = this.canSee(t))),
      this._see
    );
  }
  shoot(t) {
    const s = this.pos[0],
      i = this.pos[1] + 1.5,
      e = this.pos[2],
      h = t.pos[0] - s,
      o = t.pos[2] - e,
      a = Math.hypot(h, o),
      r = t.pos[1] + 1.2 - i + 0.2 * a * 0.5,
      n = Math.hypot(h, r, o),
      l = 0.08,
      c = new Arrow(
        this.game,
        s,
        i,
        e,
        [
          (h / n) * 1.6 + (Math.random() - 0.5) * l,
          (r / n) * 1.6 + (Math.random() - 0.5) * l,
          (o / n) * 1.6 + (Math.random() - 0.5) * l,
        ],
        this,
      );
    (this.game.addEntity(c), Sound.bow(this.pos), (this.swingT = 6));
  }
  pose(t) {
    const s = 0.6662 * lerp(this.limbSwing - this.limbAmt, this.limbSwing, t),
      i = this.limbAmt,
      e = 1.4 * Math.cos(s) * i,
      h = 1.4 * Math.cos(s + Math.PI) * i,
      o = { head: { ry: this.headYaw, rx: this.pitch } };
    switch (this.T.model) {
      case "zombie":
      case "skeleton": {
        const t =
          "zombie" === this.type
            ? Math.PI / 2 + 0.05 * Math.sin(0.067 * this.age)
            : this.target
              ? Math.PI / 2
              : 0;
        ((o.rarm = {
          rx:
            t +
            ("zombie" === this.type ? 0 : 0.5 * h) +
            (this.swingT > 0 ? 0.6 * Math.sin((this.swingT / 6) * Math.PI) : 0),
        }),
          (o.larm = {
            rx: t + ("zombie" === this.type ? 0.05 * Math.sin(0.067 * this.age + 1) : 0.5 * e),
          }),
          (o.rleg = { rx: e }),
          (o.lleg = { rx: h }),
          "skeleton" === this.type &&
            this.target &&
            ((o.rarm = { ry: 0.1 + this.headYaw, rx: Math.PI / 2 + this.pitch, zx: !0 }),
            (o.larm = { ry: -0.5 + this.headYaw, rx: Math.PI / 2 + this.pitch, zx: !0 })));
        break;
      }
      case "creeper":
        ((o.leg0 = { rx: e }), (o.leg1 = { rx: h }), (o.leg2 = { rx: h }), (o.leg3 = { rx: e }));
        break;
      case "chicken": {
        ((o.leg0 = { rx: e }), (o.leg1 = { rx: h }));
        const t = this.onGround ? 0 : 0.8 * Math.sin(1.5 * this.age) + 0.8;
        ((o.wing0 = { rz: -t }), (o.wing1 = { rz: t }));
        break;
      }
      case "spider": {
        const t = [-Math.PI / 4, -Math.PI / 8, Math.PI / 8, Math.PI / 4],
          e = [-Math.PI / 4, -0.58119464, -0.58119464, -Math.PI / 4],
          h = [1.5 * Math.PI, Math.PI / 2, Math.PI, 0];
        for (let a = 0; a < 8; a++) {
          const r = a >> 1,
            n = a % 2 == 0 ? 1 : -1,
            l = 0.4 * -Math.cos(2 * s + h[r]) * i,
            c = Math.abs(0.4 * Math.sin(s + h[r])) * i;
          o["leg" + a] = { ry: -n * (t[r] + l), rz: n * (e[r] + c), zx: !0 };
        }
        break;
      }
      default:
        ((o.leg0 = { rx: e }),
          (o.leg1 = { rx: h }),
          (o.leg2 = { rx: h }),
          (o.leg3 = { rx: e }),
          "sheep" === this.type && this.eatT > 0 && (o.head.rx = -0.9));
    }
    return o;
  }
}
function knownStack(t, s, i) {
  if (null == t) return null;
  if (t && "object" == typeof t && ITEMS[t.id] && t.count > 0) return t;
  if (t && "object" == typeof t && ITEMS[t.id]) return null;
  const e = t && "object" == typeof t && t.count > 0 ? fixSavedStack(t) : null;
  if (e && ITEMS[e.id]) return e;
  const h = s || ("undefined" != typeof window && window.game),
    o = knownStack.seen || (knownStack.seen = new Set()),
    a = String(new Error().stack || "")
      .split("\n")
      .slice(2, 6)
      .map((t) => (t.match(/([\w.-]+\.js):(\d+)/) || []).slice(1, 3).join(":"))
      .filter(Boolean)
      .join("<"),
    r = t && "object" == typeof t ? String(t.id) + "x" + String(t.count) : typeof t,
    n = i + r + a;
  return (
    h &&
      h.reportError &&
      !o.has(n) &&
      o.size < 50 &&
      (o.add(n), h.reportError(i, new Error("unknown item " + r + " from " + a), !0)),
    null
  );
}
Object.defineProperty(Mob.prototype, "target", {
  get() {
    const t = this._target;
    return t instanceof Player && (t.creative || t.spectator) ? ((this._target = null), null) : t;
  },
  set(t) {
    const s = t instanceof Player && (t.creative || t.spectator) ? null : t || null;
    (s !== this._target && (this.unseenT = 0), (this._target = s));
  },
  configurable: !0,
});
const ITEM_FIREPROOF =
  /^(ancient_debris|netherite_(axe|block|boots|chestplate|helmet|hoe|horse_armor|ingot|leggings|nautilus_armor|pickaxe|scrap|shovel|spear|sword))$/;
class ItemEntity extends Entity {
  static SIDES = [
    [0, 0, -1, 2, -1],
    [0, 0, 1, 2, 1],
    [-1, 0, 0, 0, -1],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 1],
  ];
  closestSpace() {
    const t = this.pos[0],
      s = this.pos[1] + this.h / 2,
      i = this.pos[2],
      e = Math.floor(t),
      h = Math.floor(s),
      o = Math.floor(i),
      a = [t - e, s - h, i - o],
      r = this.vel;
    let n = 4,
      l = 1 / 0;
    for (let t = 0; t < 5; t++) {
      const [s, i, r, c, p] = ItemEntity.SIDES[t];
      if (fullCollisionAt(this.world, e + s, h + i, o + r)) continue;
      const f = p > 0 ? 1 - a[c] : a[c];
      f < l && ((l = f), (n = t));
    }
    const [, , , c, p] = ItemEntity.SIDES[n];
    ((r[0] *= 0.75), (r[1] *= 0.75), (r[2] *= 0.75), (r[c] = p * (0.2 * Math.random() + 0.1)));
  }
  constructor(t, s, i, e, h, o) {
    super(t, s, i, e, 0.25, 0.25);
    const a = knownStack(h, t, "item entity");
    ((this.stack = a || h),
      a || (this.dead = !0),
      (this.pickup = 10),
      (this.bobOff = Math.random() * Math.PI * 2),
      (this.vel = o || [0.2 * (Math.random() - 0.5), 0.2, 0.2 * (Math.random() - 0.5)]));
  }
  static near(t, s) {
    let i = t.itemCells;
    if (!i || i.t !== t.tickCount || i.list !== t.entities) {
      i = t.itemCells = { t: t.tickCount, list: t.entities, m: new Map() };
      for (const s of t.entities)
        if (s instanceof ItemEntity && !s.dead) {
          const t = ItemEntity.cell(s.pos[0], s.pos[1], s.pos[2]),
            e = i.m.get(t);
          e ? e.push(s) : i.m.set(t, [s]);
        }
    }
    const e = [],
      h = Math.floor(s.pos[0] / 2),
      o = Math.floor(s.pos[1] / 2),
      a = Math.floor(s.pos[2] / 2);
    for (let t = -1; t <= 1; t++)
      for (let s = -1; s <= 1; s++)
        for (let r = -1; r <= 1; r++) {
          const n = i.m.get(ItemEntity.cell(2 * (h + t), 2 * (o + s), 2 * (a + r)));
          if (n) for (const t of n) e.push(t);
        }
    return e;
  }
  static cell(t, s, i) {
    return (
      (2047 & Math.floor(t / 2)) +
      2048 * (2047 & Math.floor(i / 2)) +
      4194304 * (255 & Math.floor(s / 2))
    );
  }
  burns() {
    const t = this.world,
      s = this.pos,
      i = this.w / 2,
      e = Math.floor(s[0] + i - 1e-5),
      h = Math.floor(s[1] + this.h - 1e-5),
      o = Math.floor(s[2] + i - 1e-5);
    let a = 0;
    for (let r = Math.floor(s[0] - i + 1e-5); r <= e; r++)
      for (let e = Math.floor(s[1] + 1e-5); e <= h; e++)
        for (let h = Math.floor(s[2] - i + 1e-5); h <= o; h++) {
          const s = t.getBlock(r, e, h);
          37 === s
            ? (a += 1)
            : (171 === s || (s && s === BID.soul_fire)) &&
              !this.fireproof() &&
              ((a += 171 === s ? 1 : 2), (this.burn = 160));
        }
    return (
      this.burn > 0 &&
        (this.burn--, this.inWater ? (this.burn = 0) : this.burn % 20 == 0 && (a += 1)),
      !!a && ((this.health = (this.health ?? 5) - a), !(this.health > 0) && ((this.dead = !0), !0))
    );
  }
  fireproof() {
    const t = this.stack.id;
    return (
      this.fpId !== t && ((this.fpId = t), (this.fp = ITEM_FIREPROOF.test(ITEMS[t].key))),
      this.fp
    );
  }
  tick() {
    (this.savePrev(), this.age++);
    const t = this.stack;
    if (!t || !ITEMS[t.id]) return void (this.dead = !0);
    (this.pickup > 0 && this.pickup--, this.updateFluids());
    const s = this.vel;
    this.inWater && this.waterDepth() > 0.1
      ? ((s[0] *= 0.99), (s[2] *= 0.99), s[1] < 0.06 && (s[1] += 5e-4), this.bubbleColumn())
      : ((s[1] -= 0.04), this.inWater && this.bubbleColumn());
    const i = this.box(),
      e = this.collides([
        i[0] + 1e-7,
        i[1] + 1e-7,
        i[2] + 1e-7,
        i[3] - 1e-7,
        i[4] - 1e-7,
        i[5] - 1e-7,
      ]);
    if (
      (e && this.closestSpace(),
      e || !this.onGround || s[0] * s[0] + s[2] * s[2] > 1e-5 || (this.age + this.id) % 4 == 0)
    ) {
      e
        ? ((this.pos[0] += s[0]),
          (this.pos[1] += s[1]),
          (this.pos[2] += s[2]),
          (this.onGround = !1))
        : this.move(s[0], s[1], s[2]);
      const t = this.onGround ? 0.588 : 0.98;
      ((s[0] *= t), (s[2] *= t), (s[1] *= 0.98), this.onGround && s[1] < 0 && (s[1] *= -0.5));
    }
    if (this.inLava) return ((this.dead = !0), void Sound.fizz(this.pos));
    if (this.burns()) return;
    if (this.age > 6e3) return void (this.dead = !0);
    if (this.age % 20 == 0 && t.count < maxStack(t.id))
      for (const s of ItemEntity.near(this.game, this)) {
        if (s === this || s.dead || !s.stack) continue;
        const i = s.pos[0] - this.pos[0],
          e = s.pos[1] - this.pos[1],
          h = s.pos[2] - this.pos[2];
        i * i + e * e + h * h >= 1.44 ||
          t.count + s.stack.count > maxStack(t.id) ||
          !sameKind(s.stack, t) ||
          ((t.count += s.stack.count),
          (s.dead = !0),
          (this.age = Math.min(this.age, s.age)),
          (this.pickup = Math.max(this.pickup, s.pickup)));
      }
    const h = this.game.player;
    if (this.pickup <= 0 && 0 === h.deathTime) {
      const t = h.box();
      if (
        this.pos[0] > t[0] - 1 &&
        this.pos[0] < t[3] + 1 &&
        this.pos[1] > t[1] - 0.5 &&
        this.pos[1] < t[4] + 0.5 &&
        this.pos[2] > t[2] - 1 &&
        this.pos[2] < t[5] + 1
      ) {
        const t = h.inv.add(this.stack);
        (t < this.stack.count &&
          (this.game.onPickup(this.stack.id, this.stack.count - t),
          Sound.pop(this.pos),
          this.game.particles.pickupAnim(this, h)),
          0 === t ? (this.dead = !0) : (this.stack.count = t));
      }
    }
  }
}
class FallingBlock extends Entity {
  constructor(t, s, i, e, h, o) {
    (super(t, s + 0.5, i, e + 0.5, 0.98, 0.98), (this.blockId = h), (this.meta = o), (this.y0 = i));
  }
  tick() {
    if (
      (this.savePrev(),
      this.age++,
      (this.vel[1] = 0.98 * (this.vel[1] - 0.04)),
      this.move(0, this.vel[1], 0),
      this.onGround || this.age > 600)
    ) {
      this.dead = !0;
      const t = Math.floor(this.pos[0]),
        s = Math.floor(this.pos[2]);
      let i = Math.floor(this.pos[1] + 0.5);
      const free = (i) => {
        const e = this.world.getBlock(t, i, s);
        return 0 === e || REPLACEABLE[e];
      };
      for (
        let e = 0;
        e < 8 && this.onGround && !free(i) && SOLIDCUBE[this.world.getBlock(t, i, s)];
        e++
      )
        i++;
      if (this.hurts && this.onGround) {
        const t = Math.ceil(this.y0 - this.pos[1] - 1),
          s = Math.min(Math.floor(t * this.hurts[0]), this.hurts[1]),
          i = this.box();
        if (s > 0)
          for (const t of [this.game.player, ...this.game.entities]) {
            if (!(t instanceof Living) || t.dead || t.deathTime > 0) continue;
            const e = t.box();
            e[0] < i[3] &&
              e[3] > i[0] &&
              e[1] < i[4] &&
              e[4] > i[1] &&
              e[2] < i[5] &&
              e[5] > i[2] &&
              t.hurt(s, { type: "falling_stalactite" });
          }
      }
      !free(i) || (this.game.supported && !this.game.supported(t, i, s, this.blockId, this.meta))
        ? this.game.dropItem(this.pos[0], this.pos[1], this.pos[2], makeStack(this.blockId, 1))
        : (this.world.setBlock(t, i, s, this.blockId, this.meta),
          Sound.block("place", BLOCKS[this.blockId].sound, this.pos));
    }
  }
}
class PrimedTNT extends Entity {
  constructor(t, s, i, e, h = 80) {
    (super(t, s + 0.5, i, e + 0.5, 0.98, 0.98), (this.fuse = h));
    const o = Math.random() * Math.PI * 2;
    ((this.vel = [0.02 * -Math.sin(o), 0.2, 0.02 * -Math.cos(o)]), Sound.fuse(this.pos));
  }
  tick() {
    (this.savePrev(),
      this.age++,
      this.updateFluids(),
      (this.vel[1] -= 0.04),
      this.move(this.vel[0], this.vel[1], this.vel[2]),
      (this.vel[0] *= 0.98),
      (this.vel[1] *= 0.98),
      (this.vel[2] *= 0.98),
      this.onGround && ((this.vel[0] *= 0.7), (this.vel[2] *= 0.7), (this.vel[1] *= -0.5)),
      Math.random() < 0.5 &&
        this.game.particles.spawn("smoke", this.pos[0], this.pos[1] + 1.1, this.pos[2], 0, 0.02, 0),
      --this.fuse <= 0 &&
        ((this.dead = !0),
        this.game.explode(this.pos[0], this.pos[1] + 0.49, this.pos[2], 4, this, this.inWater)));
  }
}
class Arrow extends Entity {
  constructor(t, s, i, e, h, o) {
    (super(t, s, i, e, 0.5, 0.5),
      (this.vel = h),
      (this.shooter = o),
      (this.stuck = !1),
      (this.life = 0),
      (this.fromPlayer = o === t.player),
      this.updateRot());
  }
  breakSnowball() {
    for (let t = 0; t < 8; t++)
      this.game.particles.spawn(
        "block",
        this.pos[0],
        this.pos[1],
        this.pos[2],
        0.2 * (Math.random() - 0.5),
        0.2 * Math.random(),
        0.2 * (Math.random() - 0.5),
        { id: 1, layer: ITEMS[this.snowball].tex },
      );
    if ("egg" === ITEMS[this.snowball].key && Math.random() < 0.125) {
      const t = new Mob(this.game, "chicken", this.pos[0], this.pos[1], this.pos[2]).makeBaby();
      ((t.persistent = !0), this.game.addEntity(t));
    }
  }
  updateRot() {
    const t = this.vel;
    ((this.yaw = Math.atan2(-t[0], -t[2])),
      (this.pitch = Math.atan2(t[1], Math.hypot(t[0], t[2]))));
  }
  lightTnt(t, s, i) {
    const e = this.game;
    this.fire > 0 &&
      !this.snowball &&
      !e.net &&
      !e.p2pGuest &&
      26 === this.world.getBlock(t, s, i) &&
      ((this.shooter instanceof Mob && !1 === e.rule("mob_griefing")) ||
        (this.world.setBlock(t, s, i, 0, 0), e.entities.push(new PrimedTNT(e, t, s, i))));
  }
  tick() {
    if ((this.savePrev(), this.age++, this.stuck)) {
      ++this.life > 1200 && (this.dead = !0);
      const t = this.stuckAt,
        s = this.world.getBlock(t[0], t[1], t[2]);
      if (!s || IS_FLUID[s])
        return (
          (this.stuck = !1),
          (this.life = 0),
          void (this.vel = this.vel.map((t) => t * Math.random() * 0.2))
        );
      if (this.fromPlayer && this.age > 10) {
        const t = this.game.player;
        this.distTo(t) < 1.5 &&
          (this.noPickup
            ? t.creative
            : 0 === t.inv.add(this.stack ? { ...this.stack, count: 1 } : makeStack("arrow", 1))) &&
          ((this.dead = !0), Sound.pop(this.pos));
      }
      return;
    }
    const t = this.vel,
      s = Math.ceil(Math.hypot(t[0], t[1], t[2]) / 0.25),
      i = [],
      e = this.pos,
      h = this.shooter,
      o = Math.min(e[0], e[0] + t[0]) - 0.2,
      a = Math.max(e[0], e[0] + t[0]) + 0.2,
      r = Math.min(e[1], e[1] + t[1]) - 0.05,
      n = Math.max(e[1], e[1] + t[1]) + 0.05,
      l = Math.min(e[2], e[2] + t[2]) - 0.2,
      c = Math.max(e[2], e[2] + t[2]) + 0.2,
      reach = (t) => {
        if (t === h || t === this || (!(t instanceof Living) && !t.hittable)) return;
        if (t.parts) return void i.push(t);
        const s = t.box();
        s[3] > o && s[0] < a && s[4] > r && s[1] < n && s[5] > l && s[2] < c && i.push(t);
      };
    for (const t of this.game.entities) reach(t);
    reach(this.game.player);
    for (let e = 0; e < s; e++) {
      const e = this.pos[0] + t[0] / s,
        h = this.pos[1] + t[1] / s,
        o = this.pos[2] + t[2] / s;
      {
        blockBoxes(this.world, e - 0.02, h - 0.02, o - 0.02, e + 0.02, h + 0.02, o + 0.02, _boxes);
        let t = !1;
        for (const s of _boxes)
          if (e > s[0] && e < s[3] && h > s[1] && h < s[4] && o > s[2] && o < s[5]) {
            t = !0;
            break;
          }
        const s = this.world.getBlock(Math.floor(e), Math.floor(h), Math.floor(o));
        if (t && s && !IS_FLUID[s])
          return this.snowball
            ? (this.breakSnowball(), void (this.dead = !0))
            : ((this.stuck = !0),
              (this.stuckAt = [Math.floor(e), Math.floor(h), Math.floor(o)]),
              Sound.arrowHit(this.pos),
              void this.lightTnt(...this.stuckAt));
      }
      const inB = (t) =>
        e > t[0] - 0.15 &&
        e < t[3] + 0.15 &&
        h > t[1] &&
        h < t[4] &&
        o > t[2] - 0.15 &&
        o < t[5] + 0.15;
      for (const s of i) {
        if (s.dead || s.deathTime > 0) continue;
        const i = s.parts ? s.parts().find((t) => inB(t.box)) : inB(s.box());
        if (i) {
          if (this.hitSet && this.hitSet.has(s)) continue;
          let e = this.snowball
            ? "blaze" === s.type
              ? 3
              : 0
            : Math.ceil(Math.hypot(t[0], t[1], t[2]) * (this.baseDmg || 2));
          if (
            (this.trident && (e = 8 + (s.inWater ? 2.5 * enchLevel(this.stack, "impaling") : 0)),
            this.fire > 0 &&
              !this.snowball &&
              !s.fireproof &&
              s instanceof Living &&
              (s.fire = Math.max(s.fire || 0, 100)),
            this.snowball && this.breakSnowball(),
            s.parts)
          ) {
            const h = { type: "arrow", attacker: this.shooter, player: this.fromPlayer };
            return (
              s.hurtPart(i, e, h),
              this.snowball || Sound.arrowHit(this.pos),
              h.deflected && !this.snowball
                ? ((t[0] *= -0.1),
                  (t[1] *= -0.1),
                  (t[2] *= -0.1),
                  this.updateRot(),
                  void (this.hitSet || (this.hitSet = new Set())).add(s))
                : void (this.dead = !0)
            );
          }
          const h = s.hurt(e, {
            type: this.trident ? "trident" : "arrow",
            attacker: this.shooter,
            knockFrom: [this.pos[0] - t[0], 0, this.pos[2] - t[2]],
            knock: 0.3 + 0.6 * (this.punch || 0),
            player: this.fromPlayer,
            fire: this.fire > 0 && !this.snowball,
            speed2: t[0] * t[0] + t[1] * t[1] + t[2] * t[2],
            hitY: this.pos[1], // W12a: 命中高度 → 损伤轨部位分类（07-§5.3）
          });
          if (h && s.addEffect) {
            if (this.tip && this.tip.pot && "undefined" != typeof POTIONS)
              for (const [t, i, e] of POTIONS[this.tip.pot] || [])
                "instant_health" === t || "instant_damage" === t
                  ? s.addEffect(t, e, 1)
                  : i / 8 >= 1 && s.addEffect(t, e, Math.floor(i / 8));
            this.tip &&
              "spectral_arrow" === ITEMS[this.tip.id].key &&
              s.addEffect("glowing", 0, 200);
          }
          if (
            (h && this.onHit && this.onHit(s),
            this.snowball || Sound.arrowHit(this.pos),
            (this.hitSet || (this.hitSet = new Set())).add(s),
            this.trident)
          )
            return;
          if (this.pierce > 0) {
            this.pierce--;
            continue;
          }
          return void (this.dead = !0);
        }
      }
      const a = Math.floor(e),
        r = Math.floor(h),
        n = Math.floor(o),
        l = this.world.getBlock(a, r, n);
      if (l && BLOCKS[l].solid)
        return this.snowball
          ? (this.breakSnowball(), void (this.dead = !0))
          : ((this.stuck = !0),
            (this.stuckAt = [a, r, n]),
            Sound.arrowHit(this.pos),
            void this.lightTnt(a, r, n));
      ((this.pos[0] = e), (this.pos[1] = h), (this.pos[2] = o));
    }
    this.updateFluids();
    const p = this.inWater ? 0.6 : 0.99;
    ((t[0] *= p),
      (t[1] = t[1] * p - 0.05),
      (t[2] *= p),
      this.updateRot(),
      this.age > 400 && (this.dead = !0));
  }
}
class Particles {
  constructor(t) {
    ((this.game = t), (this.list = []), (this.pickups = []));
  }
  spawn(t, s, i, e, h, o, a, r) {
    if (this.list.length > 3e3)
      return (
        this.spare ||
        (this.spare = {
          type: t,
          x: s,
          y: i,
          z: e,
          px: s,
          py: i,
          pz: e,
          vx: 0,
          vy: 0,
          vz: 0,
          age: 0,
          life: 0,
          size: 0,
          grav: 0,
          layer: 0,
          u0: 0,
          v0: 0,
          us: 1,
          col: [255, 255, 255],
          bright: !1,
          frames: 0,
          base: 0,
        })
      );
    const n = {
        type: t,
        x: s,
        y: i,
        z: e,
        px: s,
        py: i,
        pz: e,
        vx: h,
        vy: o,
        vz: a,
        age: 0,
        life: 20,
        size: 0.1,
        grav: 0,
        layer: 0,
        u0: 0,
        v0: 0,
        us: 1,
        col: [255, 255, 255],
        bright: !1,
        frames: 0,
        base: 0,
      },
      l = Math.random;
    switch (t) {
      case "block": {
        const t = BLOCKS[r.id];
        ((n.layer =
          r.layer ?? (t.texFn && !t.particleOwn ? t.texFn.call(t, 0, r.meta || 0) : t.particle)),
          (n.us = 0.25),
          (n.u0 = 0.75 * l()),
          (n.v0 = 0.75 * l()),
          (n.life = 4 / (0.9 * l() + 0.1)),
          (n.grav = 0.04),
          (n.size = 0.05 + 0.05 * l()));
        const i =
          void 0 !== r.tint
            ? r.tint
            : t.tint && null == r.layer
              ? this.game.blockTintAt(Math.floor(s), Math.floor(e), r.id, r.meta || 0)
              : null;
        i && (n.col = i);
        break;
      }
      case "smoke":
        ((n.frames = 12),
          (n.base = T("p_big_smoke_0")),
          (n.life = 20 + 20 * l()),
          (n.size = 0.15 + 0.15 * l()),
          (n.grav = -0.002),
          (n.col = [80, 80, 80]));
        break;
      case "poof":
        ((n.frames = 8),
          (n.base = T("p_generic_0")),
          (n.life = 16 + 8 * l()),
          (n.size = 0.15 + 0.1 * l()),
          (n.col = [230, 230, 230]),
          (n.reverse = !0));
        break;
      case "explosion":
        ((n.frames = 16),
          (n.base = T("p_explosion_0")),
          (n.life = 8 + 8 * l()),
          (n.size = 1 + 0.8 * l()),
          (n.bright = !0));
        break;
      case "flame":
        ((n.layer = T("p_flame")),
          (n.life = 10 + 10 * l()),
          (n.size = 0.06 + 0.04 * l()),
          (n.bright = !0));
        break;
      case "lava":
        ((n.layer = T("p_lava")), (n.life = 30), (n.size = 0.08), (n.grav = 0.04), (n.bright = !0));
        break;
      case "splash":
        ((n.layer = T("p_splash_" + ((4 * l()) | 0))),
          (n.life = 10),
          (n.size = 0.08),
          (n.grav = 0.04),
          (n.col = [80, 120, 230]));
        break;
      case "bubble":
        ((n.layer = T("p_bubble")), (n.life = 20 + 20 * l()), (n.size = 0.05), (n.grav = -0.01));
        break;
      case "sweep": {
        ((n.frames = 8), (n.base = T("p_sweep_0")), (n.life = 4), (n.size = 1), (n.grav = 0));
        const t = (150 + 100 * l()) | 0;
        ((n.col = [t, t, t]), (n.bright = !0));
        break;
      }
      case "soul":
        ((n.frames = 11),
          (n.base = T("p_soul_0")),
          (n.life = 22),
          (n.size = 0.12),
          (n.grav = -0.002),
          (n.bright = !0));
        break;
      case "crit":
        ((n.layer = T("p_critical_hit")),
          (n.life = 12),
          (n.size = 0.08),
          (n.grav = 0.02),
          (n.bright = !0));
        break;
      case "heart":
        ((n.layer = T("p_heart")),
          (n.life = 20),
          (n.size = 0.15),
          (n.grav = -0.005),
          (n.bright = !0));
        break;
      case "happy_villager":
        ((n.layer = T("p_glint")),
          (n.life = 20),
          (n.size = 0.1),
          (n.grav = -0.002),
          (n.bright = !0));
        break;
      case "note":
        ((n.layer = T("p_note")), (n.life = 20), (n.size = 0.15), (n.bright = !0), (n.col = r.col));
        break;
      case "damage":
        ((n.layer = T("p_damage")), (n.life = 15), (n.size = 0.1), (n.grav = 0.02));
        break;
      case "glint":
        ((n.layer = T("p_glint")), (n.life = 20), (n.size = 0.08), (n.bright = !0));
        break;
      case "marker":
        ((n.layer = r.layer), (n.life = 80), (n.size = 0.5));
        break;
      case "effect":
        ((n.frames = 3),
          (n.base = T("p_effect_0")),
          (n.life = Math.floor(8 / (0.8 * l() + 0.2))),
          (n.size = 0.06 + 0.04 * l()),
          (n.col = r.col || [255, 255, 255]));
        break;
      case "bone_meal":
        ((n.layer = T("p_effect_" + ((3 * l()) | 0))),
          (n.life = 20),
          (n.size = 0.08),
          (n.col = [120, 220, 90]),
          (n.bright = !0));
        break;
      case "rain":
        ((n.layer = T("p_splash_" + ((4 * l()) | 0))),
          (n.life = 6),
          (n.size = 0.06),
          (n.grav = 0.04),
          (n.col = [100, 140, 230]));
        break;
      case "portal":
        ((n.frames = 8),
          (n.base = T("p_generic_0")),
          (n.life = 30 + 20 * l()),
          (n.size = 0.06 + 0.05 * l()),
          (n.reverse = !0),
          (n.bright = !0));
        {
          const t = 0.6 * l() + 0.4;
          n.col = [Math.round(230 * t), Math.round(80 * t), 255];
        }
        ((n.vx *= 0.5), (n.vy = 0.5 * n.vy - 0.01), (n.vz *= 0.5));
        break;
      case "breath":
        ((n.frames = 8),
          (n.base = T("p_generic_0")),
          (n.life = 20 + 20 * l()),
          (n.size = 0.12 + 0.08 * l()),
          (n.reverse = !0),
          (n.bright = !0),
          (n.col = [200, (60 + 60 * l()) | 0, 255]));
    }
    return (this.list.push(n), n);
  }
  blockBreak(t, s, i, e, h) {
    const o = this.game.blockTintAt(t, i, e, h);
    for (let a = 0; a < 4; a++)
      for (let r = 0; r < 4; r++)
        for (let n = 0; n < 4; n++) {
          const l = t + (a + 0.5) / 4,
            c = s + (r + 0.5) / 4,
            p = i + (n + 0.5) / 4;
          this.spawn(
            "block",
            l,
            c,
            p,
            0.3 * (l - t - 0.5) + 0.05 * (Math.random() - 0.5),
            0.3 * (c - s - 0.5) + 0.1 * Math.random(),
            0.3 * (p - i - 0.5),
            { id: e, meta: h, tint: o },
          );
        }
  }
  blockHit(t, s, i, e, h, o) {
    const a = DIRS[e],
      r = t + 0.5 + 0.52 * a[0] + (a[0] ? 0 : 0.9 * (Math.random() - 0.5)),
      n = s + 0.5 + 0.52 * a[1] + (a[1] ? 0 : 0.9 * (Math.random() - 0.5)),
      l = i + 0.5 + 0.52 * a[2] + (a[2] ? 0 : 0.9 * (Math.random() - 0.5)),
      c = this.game.blockTintAt(t, i, h, o);
    this.spawn("block", r, n, l, 0.05 * a[0], 0.05 + 0.05 * a[1], 0.05 * a[2], {
      id: h,
      meta: o,
      tint: c,
    });
  }
  pickupAnim(t, s) {
    this.pickups.push({ stack: { ...t.stack }, from: [...t.pos], t: 0, target: s });
  }
  tick() {
    const t = this.game.world;
    for (const s of this.list) {
      ((s.px = s.x), (s.py = s.y), (s.pz = s.z), s.age++, (s.vy -= s.grav));
      let i = s.x + s.vx,
        e = s.y + s.vy,
        h = s.z + s.vz;
      if (s.grav > 0) {
        const o = t.getBlock(Math.floor(i), Math.floor(e), Math.floor(h));
        o &&
          SOLIDCUBE[o] &&
          (s.vy < 0
            ? ((e = s.y), (s.vy = 0), (s.vx *= 0.7), (s.vz *= 0.7))
            : ((i = s.x), (h = s.z)));
      }
      ((s.x = i),
        (s.y = e),
        (s.z = h),
        (s.vx *= 0.98),
        (s.vy *= 0.98),
        (s.vz *= 0.98),
        ("smoke" !== s.type && "explosion" !== s.type) || ((s.vx *= 0.9), (s.vz *= 0.9)),
        "bubble" === s.type &&
          t.getBlock(Math.floor(s.x), Math.floor(s.y), Math.floor(s.z)) !== WATER &&
          (s.age = s.life),
        "lava" === s.type && Math.random() < 0.1 && this.spawn("smoke", s.x, s.y, s.z, 0, 0.01, 0),
        s.age % 4 == 1 &&
          (s.light = t.getLight(Math.floor(s.x), Math.floor(s.y), Math.floor(s.z))));
    }
    this.list = this.list.filter((t) => t.age < t.life);
    for (const t of this.pickups) t.t++;
    this.pickups = this.pickups.filter((t) => t.t < 3);
  }
  build(t, s, i, e, h) {
    t.reset();
    for (const i of this.list) {
      const o = lerp(i.px, i.x, s),
        a = lerp(i.py, i.y, s),
        r = lerp(i.pz, i.z, s);
      let n = i.layer;
      if (i.frames) {
        const t = Math.min(i.frames - 1, Math.floor(((i.age + s) / i.life) * i.frames));
        n = i.base + (i.reverse ? i.frames - 1 - t : t);
      }
      const l = i.size,
        c = e[0] * l,
        p = e[1] * l,
        f = e[2] * l,
        d = h[0] * l,
        u = h[1] * l,
        m = h[2] * l,
        M = i.light ?? 240,
        g = i.bright ? 255 : 17 * (M >> 4),
        k = i.bright ? 255 : 17 * (15 & M),
        b = i.u0,
        w = i.v0,
        y = b + i.us,
        v = w + i.us,
        T = i.col;
      (t.v(o - c - d, a - p - u, r - f - m, b, v, n, 0, T[0], T[1], T[2], 255, g, k, 0),
        t.v(o + c - d, a + p - u, r + f - m, y, v, n, 0, T[0], T[1], T[2], 255, g, k, 0),
        t.v(o + c + d, a + p + u, r + f + m, y, w, n, 0, T[0], T[1], T[2], 255, g, k, 0),
        t.v(o - c + d, a - p + u, r - f + m, b, w, n, 0, T[0], T[1], T[2], 255, g, k, 0));
    }
  }
}
const XP_SIZES = [2477, 1237, 617, 307, 149, 73, 37, 17, 7, 3, 1];
class ExperienceOrb extends Entity {
  constructor(t, s, i, e, h) {
    (super(t, s, i, e, 0.5, 0.5),
      (this.value = h),
      (this.vel = [
        2 * (0.2 * Math.random() - 0.1),
        0.2 * Math.random() * 2,
        2 * (0.2 * Math.random() - 0.1),
      ]),
      (this.icon =
        h >= 2477
          ? 10
          : h >= 1237
            ? 9
            : h >= 617
              ? 8
              : h >= 307
                ? 7
                : h >= 149
                  ? 6
                  : h >= 73
                    ? 5
                    : h >= 37
                      ? 4
                      : h >= 17
                        ? 3
                        : h >= 7
                          ? 2
                          : h >= 3
                            ? 1
                            : 0));
  }
  tick() {
    (this.savePrev(), this.age++, this.updateFluids());
    const t = this.vel,
      s = this.game,
      i = s.player;
    if (
      (this.inWater
        ? ((t[0] *= 0.99), (t[2] *= 0.99), t[1] < 0.06 && (t[1] += 5e-4))
        : (t[1] -= 0.03),
      this.inLava &&
        ((t[1] = 0.2),
        (t[0] = 0.2 * (Math.random() - Math.random())),
        (t[2] = 0.2 * (Math.random() - Math.random()))),
      this.collides(this.box()) && ItemEntity.prototype.closestSpace.call(this),
      0 === i.deathTime && "spectator" !== s.mode)
    ) {
      const s = i.pos[0] - this.pos[0],
        e = i.pos[1] + i.eye() / 2 - this.pos[1],
        h = i.pos[2] - this.pos[2],
        o = Math.hypot(s, e, h);
      if (o < 8) {
        let i = 1 - o / 8;
        ((i *= i),
          (t[0] += (s / o) * i * 0.1),
          (t[1] += (e / o) * i * 0.1),
          (t[2] += (h / o) * i * 0.1));
      }
    }
    this.move(t[0], t[1], t[2]);
    const e = this.onGround ? 0.588 : 0.98;
    if (
      ((t[0] *= e), (t[1] *= 0.98), (t[2] *= e), this.onGround && (t[1] *= -0.9), this.age >= 6e3)
    )
      this.dead = !0;
    else if (0 === i.deathTime && "spectator" !== s.mode && (i.xpDelay || 0) <= 0) {
      const t = i.box();
      if (
        this.pos[0] > t[0] - 0.25 &&
        this.pos[0] < t[3] + 0.25 &&
        this.pos[1] > t[1] - 0.25 &&
        this.pos[1] < t[4] + 0.25 &&
        this.pos[2] > t[2] - 0.25 &&
        this.pos[2] < t[5] + 0.25
      ) {
        ((i.xpDelay = 2),
          Sound.ev(
            "entity.experience_orb.pickup",
            null,
            0.1,
            0.35 * (Math.random() - Math.random()) + 0.9,
          ));
        let t = this.value;
        const e = [i.inv.sel, 36, 37, 38, 39, 40]
          .map((t) => i.inv.slots[t])
          .filter((t) => t && t.dmg > 0 && enchLevel(t, "mending"));
        if (e.length) {
          const s = e[Math.floor(Math.random() * e.length)],
            i = Math.min(2 * t, s.dmg);
          ((s.dmg -= i), (t -= Math.ceil(i / 2)));
        }
        (t > 0 && s.addXp(t), (this.dead = !0));
      }
    }
  }
}
//# sourceURL=js/entity.js
