"use strict";
((Renderer.prototype.initModels2 = function () {
  const e = this.models,
    P = (e, t, r) => ({ parts: this.packParts(r, e, t) });
  e.enderman = P(64, 32, [
    { name: "head", pivot: [0, 38, 0], boxes: [[0, 0, -4, 0, -4, 8, 8, 8]] },
    { name: "jaw", pivot: [0, 38, 0], boxes: [[0, 16, -4, 0, -4, 8, 8, 8, -0.5]] },
    { name: "body", pivot: [0, 26, 0], boxes: [[32, 16, -4, 0, -2, 8, 12, 4]] },
    { name: "rarm", pivot: [5, 37, 0], boxes: [[56, 0, -1, -29, -1, 2, 30, 2]] },
    { name: "larm", pivot: [-5, 37, 0], boxes: [[56, 0, -1, -29, -1, 2, 30, 2, 0, !0]] },
    { name: "rleg", pivot: [2, 30, 0], boxes: [[56, 0, -1, -30, -1, 2, 30, 2]] },
    { name: "lleg", pivot: [-2, 30, 0], boxes: [[56, 0, -1, -30, -1, 2, 30, 2, 0, !0]] },
  ]);
  const t = [];
  for (let e = 0; e < 12; e++)
    t.push({ name: "rod" + e, pivot: [0, 0, 0], boxes: [[0, 16, -1, 0, -1, 2, 8, 2]] });
  e.blaze = P(64, 32, [
    { name: "head", pivot: [0, 20, 0], boxes: [[0, 0, -4, 0, -4, 8, 8, 8]] },
    ...t,
  ]);
  const r = [],
    a = RNG(1234);
  for (let e = 0; e < 9; e++) {
    const t = 5 * ((e % 3) - 1) + 0.5 * (((e / 3) | 0) % 2 ? 1.5 : -1.5),
      o = 5 * (((e / 3) | 0) - 1),
      i = 9 + a.int(5);
    r.push({ name: "t" + e, pivot: [t, 1, o], boxes: [[0, 0, -1, -i, -1, 2, i, 2]] });
  }
  ((e.ghast = P(64, 32, [
    { name: "body", pivot: [0, 0, 0], boxes: [[0, 0, -8, 0, -8, 16, 16, 16]] },
    ...r,
  ])),
    (e.zombified_piglin = P(64, 64, [
      {
        name: "head",
        pivot: [0, 24, 0],
        boxes: [
          [0, 0, -5, 0, -4, 10, 8, 8],
          [31, 1, -2, 0, -5, 4, 4, 1],
        ],
      },
      { name: "rear", pivot: [5, 30, 0], boxes: [[51, 6, 0, -5, -2, 1, 5, 4]] },
      { name: "lear", pivot: [-5, 30, 0], boxes: [[39, 6, -1, -5, -2, 1, 5, 4, 0, !0]] },
      { name: "body", pivot: [0, 12, 0], boxes: [[16, 16, -4, 0, -2, 8, 12, 4]] },
      { name: "rarm", pivot: [6, 22, 0], boxes: [[40, 16, -2, -10, -2, 4, 12, 4]] },
      { name: "larm", pivot: [-6, 22, 0], boxes: [[32, 48, -2, -10, -2, 4, 12, 4]] },
      { name: "rleg", pivot: [2, 12, 0], boxes: [[0, 16, -2, -12, -2, 4, 12, 4]] },
      { name: "lleg", pivot: [-2, 12, 0], boxes: [[16, 48, -2, -12, -2, 4, 12, 4]] },
    ])));
  const o = [];
  for (let e = 0; e < 8; e++)
    o.push({
      name: "s" + e,
      pivot: [0, 7 - e, 0],
      boxes: [[e < 4 ? 0 : 32, (e % 4) * 9, -4, 0, -4, 8, 1, 8]],
    });
  e.magma_cube = P(64, 64, [
    ...o,
    { name: "core", pivot: [0, 2, 0], boxes: [[24, 40, -2, 0, -2, 4, 4, 4]] },
  ]);
  const chest = (e, t, r, a) => [
    { name: "bottom", pivot: [0, 0, 0], boxes: [[0, 19, e, -10, 1, t, 10, 14]] },
    { name: "lid", pivot: [0, -9, 1], boxes: [[0, 0, e, -5, 0, t, 5, 14]] },
    { name: "lock", pivot: [0, -9, 1], boxes: [[0, 0, r, -2, 14, a, 4, 1]] },
  ];
  ((e.chest = P(64, 64, chest(-15, 14, -9, 2))),
    (e.chest_left = P(64, 64, chest(-15, 15, -1, 1))),
    (e.chest_right = P(64, 64, chest(-16, 15, -16, 1))),
    (e.crystal_base = P(64, 32, [
      { name: "b", pivot: [0, 0, 0], boxes: [[0, 16, -6, 0, -6, 12, 4, 12]] },
    ])),
    (e.crystal_glass = P(64, 32, [
      { name: "g", pivot: [0, 0, 0], boxes: [[0, 0, -4, -4, -4, 8, 8, 8]] },
    ])),
    (e.crystal_core = P(64, 32, [
      { name: "c", pivot: [0, 0, 0], boxes: [[32, 0, -4, -4, -4, 8, 8, 8]] },
    ])));
  const D = (e) => this.makeModelPart(e, 256, 256);
  ((this.dragon = {
    body: D([
      [0, 0, -12, -24, -8, 24, 24, 64],
      [220, 53, -1, 0, -2, 2, 6, 12],
      [220, 53, -1, 0, 18, 2, 6, 12],
      [220, 53, -1, 0, 38, 2, 6, 12],
    ]),
    seg: D([
      [192, 104, -5, -5, -5, 10, 10, 10],
      [48, 0, -1, 5, -3, 2, 4, 6],
    ]),
    head: D([
      [112, 30, -8, -8, -16, 16, 16, 16],
      [176, 44, -6, -4, -30, 12, 5, 16],
      [0, 0, -5, 8, -10, 2, 4, 6],
      [0, 0, 3, 8, -10, 2, 4, 6, 0, !0],
      [112, 0, -5, 1, -28, 2, 2, 4],
      [112, 0, 3, 1, -28, 2, 2, 4, 0, !0],
    ]),
    jaw: D([[176, 65, -6, -4, -16, 12, 4, 16]]),
    wing: D([
      [112, 88, 0, -4, -4, 56, 8, 8],
      [-56, 88, 0, 0, 2, 56, 0, 56],
    ]),
    tip: D([
      [112, 136, 0, -2, -2, 56, 4, 4],
      [-56, 144, 0, 0, 2, 56, 0, 56],
    ]),
    fleg: D([[112, 104, -4, -20, -4, 8, 24, 8]]),
    ftip: D([[226, 138, -3, -23, -3, 6, 24, 6]]),
    ffoot: D([[144, 104, -4, -4, -12, 8, 4, 16]]),
    rleg: D([[0, 0, -8, -28, -8, 16, 32, 16]]),
    rtip: D([[196, 0, -6, -30, 0, 12, 32, 12]]),
    rfoot: D([[112, 0, -9, -6, -20, 18, 6, 24]]),
  }),
    (this.spriteBuf = new MeshBuffer(256)),
    (this.spriteGL = this.makeDynamic()));
}),
  (Renderer.prototype.drawPart = function (e, t, r, a, o, i = {}) {
    const s = this.gl,
      n = this.entBegin(t, a, o, i);
    (s.uniformMatrix4fv(n.u.u_model, !1, r), s.bindVertexArray(e.vao));
    const b = e.off || 0;
    (this.shRec &&
      !i.vp &&
      this.shRec.push({
        vao: e.vao,
        n: e.n,
        off: b,
        m: new Float32Array(r),
        tex: this.entityTex[t],
      }),
      this.shRecOnly || s.drawElements(s.TRIANGLES, 1.5 * e.n, s.UNSIGNED_INT, b),
      this.unit0());
  }),
  (Renderer.prototype.drawBeam = function (e, t, r, a, o, i, s) {
    const n = this.gl,
      b = this.progTex,
      h = this.camPos,
      f = t[0] - e[0],
      u = t[1] - e[1],
      p = t[2] - e[2],
      l = Math.hypot(f, u, p) || 1,
      A = (e[0] + t[0]) / 2 - h[0],
      d = (e[1] + t[1]) / 2 - h[1],
      m = (e[2] + t[2]) / 2 - h[2];
    let x = u * m - p * d,
      y = p * A - f * m,
      c = f * d - u * A;
    const v = Math.hypot(x, y, c) || 1;
    ((x *= a / v), (y *= a / v), (c *= a / v));
    const R = i,
      _ = i + l / 4,
      E = new Float32Array([
        e[0] - x,
        e[1] - y,
        e[2] - c,
        0,
        R,
        e[0] + x,
        e[1] + y,
        e[2] + c,
        1,
        R,
        t[0] + x,
        t[1] + y,
        t[2] + c,
        1,
        _,
        t[0] - x,
        t[1] - y,
        t[2] - c,
        0,
        _,
      ]);
    (this.beamVao ||
      ((this.beamVao = n.createVertexArray()),
      n.bindVertexArray(this.beamVao),
      (this.beamBuf = n.createBuffer()),
      n.bindBuffer(n.ARRAY_BUFFER, this.beamBuf),
      n.enableVertexAttribArray(0),
      n.vertexAttribPointer(0, 3, n.FLOAT, !1, 20, 0),
      n.enableVertexAttribArray(1),
      n.vertexAttribPointer(1, 2, n.FLOAT, !1, 20, 12),
      n.bindBuffer(n.ELEMENT_ARRAY_BUFFER, this.quadIdx)),
      n.bindVertexArray(this.beamVao),
      n.bindBuffer(n.ARRAY_BUFFER, this.beamBuf),
      n.bufferData(n.ARRAY_BUFFER, E, n.DYNAMIC_DRAW),
      n.useProgram(b.p),
      n.uniformMatrix4fv(b.u.u_vp, !1, this.vp),
      n.uniformMatrix4fv(b.u.u_model, !1, this.identity),
      n.uniform4fv(b.u.u_color, o),
      n.activeTexture(n.TEXTURE0),
      n.bindTexture(n.TEXTURE_2D, this.entityTex[r]),
      n.enable(n.BLEND),
      n.blendFunc(n.SRC_ALPHA, "alpha" === s ? n.ONE_MINUS_SRC_ALPHA : n.ONE),
      n.depthMask(!1),
      n.disable(n.CULL_FACE),
      n.drawElements(n.TRIANGLES, 6, n.UNSIGNED_INT, 0),
      n.depthMask(!0),
      n.enable(n.CULL_FACE),
      n.disable(n.BLEND));
  }),
  (Renderer.prototype.drawRays = function (e, t, r, a) {
    const o = this.gl,
      i = this.progCol,
      s = RNG(a),
      n = [],
      b = Math.min(1, t / 200);
    for (let t = 0; t < r * b + 1; t++) {
      let t = 2 * s() - 1,
        r = 2 * s() - 1,
        a = 2 * s() - 1;
      const o = Math.hypot(t, r, a) || 1;
      ((t /= o), (r /= o), (a /= o));
      const i = (20 + 40 * s()) * (0.3 + b),
        h = (2 + 4 * s()) * (0.5 + b),
        f = -a,
        u = t,
        p = [e[0] + t * i, e[1] + r * i, e[2] + a * i],
        l = [p[0] + f * h, p[1], p[2] + u * h],
        A = [p[0] - f * h, p[1] + 0.5 * h, p[2] - u * h];
      n.push(
        e[0],
        e[1],
        e[2],
        1,
        1,
        1,
        0.9 * (1 - 0.3 * b),
        l[0],
        l[1],
        l[2],
        0.8,
        0.4,
        1,
        0,
        A[0],
        A[1],
        A[2],
        0.8,
        0.4,
        1,
        0,
      );
    }
    (this.rayVao ||
      ((this.rayVao = o.createVertexArray()),
      o.bindVertexArray(this.rayVao),
      (this.rayBuf = o.createBuffer()),
      o.bindBuffer(o.ARRAY_BUFFER, this.rayBuf),
      o.enableVertexAttribArray(0),
      o.vertexAttribPointer(0, 3, o.FLOAT, !1, 28, 0),
      o.enableVertexAttribArray(1),
      o.vertexAttribPointer(1, 4, o.FLOAT, !1, 28, 12)),
      o.bindVertexArray(this.rayVao),
      o.bindBuffer(o.ARRAY_BUFFER, this.rayBuf),
      o.bufferData(o.ARRAY_BUFFER, new Float32Array(n), o.DYNAMIC_DRAW),
      o.useProgram(i.p),
      o.uniformMatrix4fv(i.u.u_vp, !1, this.vp),
      o.uniformMatrix4fv(i.u.u_model, !1, this.identity),
      o.uniform4f(i.u.u_color, 1, 1, 1, 1),
      o.uniform3fv(i.u.u_cam, this.camPos),
      o.uniform2f(i.u.u_fog, 1e9, 2e9),
      o.uniform1f(i.u.u_psize, 1),
      o.enable(o.BLEND),
      o.blendFunc(o.SRC_ALPHA, o.ONE),
      o.depthMask(!1),
      o.disable(o.CULL_FACE),
      o.drawArrays(o.TRIANGLES, 0, n.length / 7),
      o.depthMask(!0),
      o.enable(o.CULL_FACE),
      o.disable(o.BLEND));
  }),
  (Renderer.prototype.drawEndSky = function () {
    const e = this.gl,
      t = this.progTex;
    if (!this.endSkyVao) {
      const t = 100,
        r = 16,
        a = [],
        quad = (e, t, o, i) => {
          a.push(...e, 0, 0, ...t, r, 0, ...o, r, r, ...i, 0, r);
        };
      (quad([-t, -t, -t], [t, -t, -t], [t, -t, t], [-t, -t, t]),
        quad([-t, t, t], [t, t, t], [t, t, -t], [-t, t, -t]),
        quad([-t, -t, t], [t, -t, t], [t, t, t], [-t, t, t]),
        quad([t, -t, -t], [-t, -t, -t], [-t, t, -t], [t, t, -t]),
        quad([-t, -t, -t], [-t, -t, t], [-t, t, t], [-t, t, -t]),
        quad([t, -t, t], [t, -t, -t], [t, t, -t], [t, t, t]),
        (this.endSkyVao = e.createVertexArray()),
        e.bindVertexArray(this.endSkyVao));
      const o = e.createBuffer();
      (e.bindBuffer(e.ARRAY_BUFFER, o),
        e.bufferData(e.ARRAY_BUFFER, new Float32Array(a), e.STATIC_DRAW),
        e.enableVertexAttribArray(0),
        e.vertexAttribPointer(0, 3, e.FLOAT, !1, 20, 0),
        e.enableVertexAttribArray(1),
        e.vertexAttribPointer(1, 2, e.FLOAT, !1, 20, 12),
        e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, this.quadIdx));
    }
    (e.disable(e.DEPTH_TEST),
      e.depthMask(!1),
      e.disable(e.CULL_FACE),
      e.useProgram(t.p),
      e.uniformMatrix4fv(t.u.u_vp, !1, this.vpNoTranslate()),
      e.uniformMatrix4fv(t.u.u_model, !1, this.identity),
      e.uniform4f(t.u.u_color, 0.16, 0.16, 0.16, 1),
      e.activeTexture(e.TEXTURE0),
      e.bindTexture(e.TEXTURE_2D, this.entityTex.end_sky),
      e.bindVertexArray(this.endSkyVao),
      e.drawElements(e.TRIANGLES, 36, e.UNSIGNED_INT, 0),
      e.enable(e.DEPTH_TEST),
      e.depthMask(!0),
      e.enable(e.CULL_FACE));
  }),
  (Renderer.prototype.drawSprites = function (e, t, r, a) {
    if (!e.length) return;
    const o = this.spriteBuf;
    o.reset();
    const i = Math.hypot(r[0], r[2]) || 1,
      s = [r[0] / i, 0, r[2] / i],
      n = [0, 1, 0],
      b = [r[1] * a[2] - r[2] * a[1], r[2] * a[0] - r[0] * a[2], r[0] * a[1] - r[1] * a[0]];
    for (const t of e) {
      const e = t.cyl ? s : r,
        i = t.cyl ? n : a,
        h = t.w || t.size,
        f = t.h || t.size,
        u = [e[0] * h, e[1] * h, e[2] * h],
        p = [i[0] * f, i[1] * f, i[2] * f],
        l = t.front || 0,
        A = t.pos[0] + b[0] * l,
        d = t.pos[1] + b[1] * l,
        m = t.pos[2] + b[2] * l,
        x = t.col || [255, 255, 255],
        y = t.bright ? 255 : 200,
        c = t.anim || 0;
      (o.v(
        A - u[0] - p[0],
        d - u[1] - p[1],
        m - u[2] - p[2],
        0,
        1,
        t.layer,
        0,
        x[0],
        x[1],
        x[2],
        255,
        y,
        y,
        c,
      ),
        o.v(
          A + u[0] - p[0],
          d + u[1] - p[1],
          m + u[2] - p[2],
          1,
          1,
          t.layer,
          0,
          x[0],
          x[1],
          x[2],
          255,
          y,
          y,
          c,
        ),
        o.v(
          A + u[0] + p[0],
          d + u[1] + p[1],
          m + u[2] + p[2],
          1,
          0,
          t.layer,
          0,
          x[0],
          x[1],
          x[2],
          255,
          y,
          y,
          c,
        ),
        o.v(
          A - u[0] + p[0],
          d - u[1] + p[1],
          m - u[2] + p[2],
          0,
          0,
          t.layer,
          0,
          x[0],
          x[1],
          x[2],
          255,
          y,
          y,
          c,
        ));
    }
    this.drawDynamic(
      o,
      this.spriteGL,
      { ...t, fogNear: 1e8, fogFar: 2e8 },
      { noCull: !0, alphaTest: 0.1 },
    );
  }));
//# sourceURL=js/render2.js
