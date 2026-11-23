"use strict";
function lerpAngle(t, s, a) {
  let e = s - t;
  for (; e > Math.PI;) e -= 2 * Math.PI;
  for (; e < -Math.PI;) e += 2 * Math.PI;
  return t + e * a;
}
const wrapA = (t) => {
  for (; t > Math.PI;) t -= 2 * Math.PI;
  for (; t < -Math.PI;) t += 2 * Math.PI;
  return t;
};
((EnderDragon.prototype.latency = function (t, s) {
  const a = this.hist,
    e =
      0 === t
        ? [this.yaw, this.pos[1]]
        : a[Math.min(t - 1, a.length - 1)]
          ? [a[Math.min(t - 1, a.length - 1)][3], a[Math.min(t - 1, a.length - 1)][1]]
          : [this.yaw, this.pos[1]],
    o = a[Math.min(t, a.length - 1)],
    r = o ? [o[3], o[1]] : e;
  return [r[0] + wrapA(e[0] - r[0]) * s, lerp(r[1], e[1], s)];
}),
  (Game.prototype.drawDragon = function (t, s, a, e) {
    const o = this.renderer,
      r = o.gl,
      n = o.dragon,
      h = lerp(t.prevFlap, t.flap, a) * Math.PI * 2,
      i = "perch" === t.phase,
      c = "land" === t.phase || "takeoff" === t.phase,
      M = t.lightAt();
    M[0] = Math.max(M[0], 0.8);
    const p = t.deathTime > 0,
      l = {
        overlay:
          t.hurtTime > 0
            ? [1, 0, 0, 0.35]
            : p
              ? [1, 1, 1, Math.min(0.85, t.deathTime / 220)]
              : null,
      },
      lat = (s) => t.latency(s, a),
      d = lat(5),
      m = lat(6),
      w = lat(10),
      f = wrapA(d[0] - w[0]),
      u = d[0] + f / 2,
      g = d[1] - w[1];
    let y = Math.sin(h - 1) + 1;
    y = 0.05 * (y * y + 2 * y);
    const P = M4.create();
    (M4.translate(P, s[0], s[1] + 2.75 + 0.5 * y, s[2]),
      M4.rotY(P, lat(7)[0]),
      M4.rotX(P, clamp((10 * g * Math.PI) / 180, -0.7, 0.7) + (2 * y * Math.PI) / 180),
      M4.translate(P, 0, 0, -1.5));
    const I = M4.copy(P);
    (M4.translate(I, 0, 1, 0), M4.rotZ(I, clamp(1.5 * f, -0.8, 0.8)), M4.translate(I, 0, -1, 0));
    const at = (t, s, a, e) => {
        const o = M4.copy(t);
        return (M4.translate(o, s / 16, a / 16, e / 16), o);
      },
      draw = (t, s) => o.drawPart(t, "dragon", s, M, e, l);
    r.disable(r.CULL_FACE);
    const partPitch = (s, a) => {
      let e;
      if (c) {
        const a = Math.hypot(t.pos[0], t.pos[2]);
        return ((e = s / Math.max(a / 4, 1)), (7.5 * -e * Math.PI) / 180);
      }
      return i ? (7.5 * -s * Math.PI) / 180 : 6 === s ? 0 : (7.5 * (a[1] - m[1]) * Math.PI) / 180;
    };
    let b = 0,
      C = -16,
      A = -12;
    for (let t = 0; t < 5; t++) {
      const s = lat(5 - t),
        a = 1.5 * wrapA(s[0] - m[0]),
        e = 0.15 * Math.cos(0.45 * t + h) + clamp(partPitch(t, s), -1.2, 1.2),
        o = at(P, b, C, A);
      (M4.rotY(o, a),
        M4.rotX(o, e),
        M4.rotZ(o, 1.5 * -wrapA(s[0] - u)),
        draw(n.seg, o),
        (C += 10 * Math.sin(e)),
        (A -= Math.cos(a) * Math.cos(e) * 10),
        (b -= Math.sin(a) * Math.cos(e) * 10));
    }
    const L = lat(0),
      _ = at(P, b, C, A);
    (M4.rotY(_, wrapA(L[0] - m[0])),
      M4.rotX(_, clamp(partPitch(6, L), -1.2, 1.2)),
      M4.rotZ(_, -wrapA(L[0] - u)),
      draw(n.head, _));
    const X = at(_, 0, -4, -14);
    (M4.rotX(X, 0.2 * -(Math.sin(h) + 1)),
      draw(n.jaw, X),
      r.enable(r.BLEND),
      r.blendFunc(r.ONE, r.ONE),
      r.depthFunc(r.LEQUAL),
      o.drawPart(n.head, "dragon_eyes", _, [1, 1], e, { bright: !0 }),
      r.disable(r.BLEND),
      r.depthFunc(r.LESS),
      draw(n.body, I));
    for (const t of [1, -1]) {
      const s = at(I, 12 * t, -1, 2);
      (t < 0 && M4.scale(s, -1, 1, 1),
        M4.rotZ(s, 0.8 * (Math.sin(h) + 0.125)),
        M4.rotY(s, -0.25),
        M4.rotX(s, -(0.125 - 0.2 * Math.cos(h))),
        draw(n.wing, s));
      const a = at(s, 56, 0, 0);
      (M4.rotZ(a, 0.75 * -(Math.sin(h + 2) + 0.5)), draw(n.tip, a));
    }
    for (const t of [1, -1]) {
      const s = at(I, 12 * t, -16, 2);
      (M4.rotX(s, -(1.3 + 0.1 * y)), draw(n.fleg, s));
      const a = at(s, 0, -20, -1);
      (M4.rotX(a, 0.5 + 0.1 * y), draw(n.ftip, a));
      const e = at(a, 0, -23, 0);
      (M4.rotX(e, -(0.75 + 0.1 * y)), draw(n.ffoot, e));
      const o = at(I, 16 * t, -12, 42);
      (M4.rotX(o, -(1 + 0.1 * y)), draw(n.rleg, o));
      const r = at(o, 0, -32, -4);
      (M4.rotX(r, -(0.5 + 0.1 * y)), draw(n.rtip, r));
      const h = at(r, 0, -31, 4);
      (M4.rotX(h, -(0.75 + 0.1 * y)), draw(n.rfoot, h));
    }
    const E = lat(11);
    let T = 0,
      D = -6,
      F = 60,
      S = 0;
    for (let t = 0; t < 12; t++) {
      const s = lat(12 + t);
      S += 0.05 * Math.sin(0.45 * t + h);
      const a = Math.PI + 1.5 * wrapA(s[0] - E[0]),
        e = S + clamp((7.5 * (s[1] - E[1]) * Math.PI) / 180, -1, 1),
        o = at(P, T, D, F);
      (M4.rotY(o, a),
        M4.rotX(o, e),
        M4.rotZ(o, 1.5 * wrapA(s[0] - u)),
        draw(n.seg, o),
        (D += 10 * Math.sin(e)),
        (F -= Math.cos(a) * Math.cos(e) * 10),
        (T -= Math.sin(a) * Math.cos(e) * 10));
    }
    (r.enable(r.CULL_FACE), p && o.drawRays([s[0], s[1] + 2.5, s[2]], t.deathTime + a, 30, 4242));
  }),
  (Game.prototype.drawCrystal = function (t, s, a, e) {
    const o = this.renderer,
      r = o.gl,
      n = t.age + a + t.spin;
    let h = Math.sin(0.2 * n) / 2 + 0.5;
    h = 0.4 * (h * h + h) - 1.4;
    const i = [1, 1];
    if (t.showBase) {
      const t = M4.create();
      (M4.translate(t, s[0], s[1], s[2]),
        M4.scale(t, 2, 2, 2),
        o.drawPart(o.models.crystal_base.parts[0].mesh, "end_crystal", t, i, e, { bright: !0 }));
    }
    const c = [s[0], s[1] + 1.2 + 0.5 * h + 0.6, s[2]],
      M = (3 * n * Math.PI) / 180;
    r.disable(r.CULL_FACE);
    let p = 2;
    ([
      [o.models.crystal_glass, "end_crystal"],
      [o.models.crystal_glass, "end_crystal"],
      [o.models.crystal_core, "end_crystal"],
    ].forEach(([t, s], a) => {
      const r = M4.create();
      (M4.translate(r, c[0], c[1], c[2]),
        M4.rotY(r, M * (a % 2 ? -1 : 1)),
        M4.rotX(r, 0.785),
        M4.rotZ(r, 0.615),
        M4.scale(r, p, p, p),
        o.drawPart(t.parts[0].mesh, s, r, i, e, { bright: !0 }),
        (p *= 0.875));
    }),
      r.enable(r.CULL_FACE));
    const l = this.dragon(),
      d = t.beamTarget;
    if (
      (d &&
        o.drawBeam(
          [c[0], c[1], c[2]],
          [d[0] + 0.5, d[1] + 0.5, d[2] + 0.5],
          "end_crystal_beam",
          0.35,
          [1, 0.8, 1, 1],
          0.05 * -(this.worldTime + a),
        ),
      l && l.healer === t && 0 === l.deathTime)
    ) {
      const t = l.ipos(a);
      o.drawBeam(
        [c[0], c[1], c[2]],
        [t[0], t[1] + 2.5, t[2]],
        "end_crystal_beam",
        0.35,
        [1, 0.8, 1, 1],
        0.05 * -(this.worldTime + a),
      );
    }
  }),
  (Game.prototype.drawSpawners = function (t, s) {
    const a = this.player,
      e = this.world,
      o = Math.floor(a.pos[0]),
      r = Math.floor(a.pos[2]),
      n = this.renderer,
      h = Math.min(64, 16 * n.renderDist);
    ((this.spawnerDummies = this.spawnerDummies || {}),
      (this.spawnerSpin = this.spawnerSpin || new Map()));
    for (let i = (o - h) >> 4; i <= (o + h) >> 4; i++)
      for (let o = (r - h) >> 4; o <= (r + h) >> 4; o++) {
        const r = e.getChunk(i, o);
        if (r) {
          r.spawners ||
            ((r.spawners = []),
            r.findAll([127], (t) =>
              r.spawners.push([16 * i + (15 & t), t >> 8, 16 * o + ((t >> 4) & 15)]),
            ));
          for (const o of r.spawners) {
            const [r, h, i] = o;
            if (127 !== e.getBlock(r, h, i)) continue;
            if (!aabbInFrustum(n.planes, r, h, i, r + 1, h + 1, i + 1)) continue;
            const c = this.spawnerMob(r, h, i);
            if (!c) continue;
            let M = this.spawnerDummies[c];
            M ||
              ((M = this.spawnerDummies[c] = createMob(this, c, 0, 0, 0)),
              (M.displayMatrix = null));
            const p = o.join(","),
              l = this.spawnerSpin.get(p) || { spin: 0, prev: 0, t: -1 },
              d = Math.hypot(r + 0.5 - a.pos[0], h + 0.5 - a.pos[1], i + 0.5 - a.pos[2]) <= 16;
            if (l.t !== this.tickCount) {
              const t = l.t < 0 ? 0 : Math.min(20, this.tickCount - l.t);
              if (((l.t = this.tickCount), (l.prev = l.spin), d)) {
                const s = (this.spawnerT && this.spawnerT.get(p)) || 200;
                l.spin += (((1e3 * t) / (Math.max(0, s) + 200)) * Math.PI) / 180;
              }
              this.spawnerSpin.set(p, l);
            }
            const m = lerp(l.prev, l.spin, t);
            let w = 0.53125;
            const f = Math.max(M.w, M.h);
            f > 1 && (w /= f);
            const u = M4.create();
            (M4.translate(u, r + 0.5, h + 0.4, i + 0.5),
              M4.rotY(u, m),
              M4.translate(u, 0, -0.2, 0),
              M4.rotX(u, (-30 * Math.PI) / 180),
              M4.scale(u, w, w, w),
              (M.pos = [r + 0.5, h + 1.1, i + 0.5]));
            const g = M.lightAt();
            ((M.displayMatrix = u),
              (M.age = this.tickCount),
              (M.hurtTime = 0),
              (M.fire = 0),
              this.drawMob(M, M.pos, t, s, g),
              (M.displayMatrix = null));
          }
        }
      }
  }));
const CHEST_ROT = { 5: 0, 1: Math.PI / 2, 4: Math.PI, 0: -Math.PI / 2 };
Game.prototype.tickChestLids = function () {
  for (const t of this.openChests)
    this.chestLids.has(t) || this.chestLids.set(t, { o: 0, prev: 0 });
  for (const [t, s] of this.chestLids) {
    s.prev = s.o;
    const [a, e, o] = t.split(",").map(Number),
      r = this.world.getMeta(a, e, o),
      n = chestSeam(r),
      h = this.openChests.has(t) || (n && this.openChests.has(`${a + n[0]},${e},${o + n[1]}`));
    ((s.o = clamp(s.o + (h ? 0.1 : -0.1), 0, 1)),
      h || 0 !== s.o || 0 !== s.prev || this.chestLids.delete(t));
  }
};
//# sourceURL=js/draw2.js
