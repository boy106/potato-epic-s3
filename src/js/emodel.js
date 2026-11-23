"use strict";
const EM = {
    models: {},
    get(t, e) {
      if (e in this.models) return this.models[e];
      const o = window.ENTITY_DATA && ENTITY_DATA.layers[e];
      if (!o) return (this.models[e] = null);
      const n = {},
        a = [],
        mk = (t, e) => {
          const o = { name: t, ip: e.slice(0, 6), is: e[6] || null, mesh: null, kids: [] };
          if ((e[7] && a.push([o, e[7]]), e[8])) for (const t in e[8]) o.kids.push(mk(t, e[8][t]));
          return (t && !n[t] && (n[t] = o), o);
        },
        i = { key: e, tw: o.tw, th: o.th, root: mk("", o.root), parts: n };
      (emPack(t, a), (i.all = []));
      const walk = (t) => {
        (i.all.push(t), t.kids.forEach(walk));
      };
      return (walk(i.root), this.reset(i), (this.models[e] = i));
    },
    has: (t) => !(!window.ENTITY_DATA || !ENTITY_DATA.layers[t]),
    reset(t) {
      for (const e of t.all)
        ((e.x = e.ip[0]),
          (e.y = e.ip[1]),
          (e.z = e.ip[2]),
          (e.xRot = e.ip[3]),
          (e.yRot = e.ip[4]),
          (e.zRot = e.ip[5]),
          (e.xScale = e.is ? e.is[0] : 1),
          (e.yScale = e.is ? e.is[1] : 1),
          (e.zScale = e.is ? e.is[2] : 1),
          (e.visible = !0),
          (e.skipDraw = !1));
    },
    copy(t, e) {
      for (const o of e.all) {
        const e = t.parts[o.name];
        e &&
          ((o.x = e.x),
          (o.y = e.y),
          (o.z = e.z),
          (o.xRot = e.xRot),
          (o.yRot = e.yRot),
          (o.zRot = e.zRot),
          (o.xScale = e.xScale),
          (o.yScale = e.yScale),
          (o.zScale = e.zScale),
          (o.visible = e.visible));
      }
    },
    anim(t, e, o, n = 1) {
      const a = ENTITY_DATA.anims[e];
      if (!a || !t) return;
      const i = a.loop ? o % a.len : o;
      for (const e in a.bones) {
        const o = t.parts[e];
        if (o)
          for (const t of a.bones[e]) {
            const e = emSample(t.k, i);
            "rot" === t.t
              ? ((o.xRot += e[0] * n), (o.yRot += e[1] * n), (o.zRot += e[2] * n))
              : "pos" === t.t
                ? ((o.x += e[0] * n), (o.y += e[1] * n), (o.z += e[2] * n))
                : ((o.xScale += e[0] * n), (o.yScale += e[1] * n), (o.zScale += e[2] * n));
          }
      }
    },
    walk(t, e, o, n, a = 1, i = 1) {
      this.anim(t, e, 0.05 * o * a, Math.min(n * i, 1));
    },
    state(t, e, o, n, a = 1) {
      const i = e.anims && e.anims[o];
      null != i && this.anim(t, o, (e.age - i + n) / 20, a);
    },
  },
  _emV = [0, 0, 0];
function emSample(t, e) {
  let o = 0;
  for (; o + 1 < t.length && t[o + 1][0] < e;) o++;
  t.length > 1 && t[0][0] >= e && (o = 0);
  const n = Math.min(t.length - 1, o + 1),
    a = t[n][0] - t[o][0],
    i = a > 0 ? clamp((e - t[o][0]) / a, 0, 1) : 0;
  if (0 === t[n][1]) for (let e = 0; e < 3; e++) _emV[e] = lerp(t[o][5 + e], t[n][2 + e], i);
  else {
    const e = t[Math.max(0, o - 1)],
      a = t[o],
      s = t[n],
      r = t[Math.min(t.length - 1, n + 1)];
    for (let t = 0; t < 3; t++) {
      const o = e[5 + t],
        n = a[5 + t],
        h = s[5 + t],
        l = r[5 + t];
      _emV[t] =
        0.5 *
        (2 * n +
          (-o + h) * i +
          (2 * o - 5 * n + 4 * h - l) * i * i +
          (3 * n - o - 3 * h + l) * i * i * i);
    }
  }
  return _emV;
}
function emPack(t, e) {
  if (!e.length) return;
  let o = 0;
  for (const [, t] of e) o += t.length;
  const n = t.gl,
    a = new Float32Array(32 * o);
  let i = 0;
  for (const [t, o] of e) {
    t.mesh = { vao: null, n: 4 * o.length, off: (i / 32) * 24 };
    for (const t of o)
      for (let e = 0; e < 4; e++) {
        const o = 3 + 5 * e;
        ((a[i++] = t[o] / 16),
          (a[i++] = t[o + 1] / 16),
          (a[i++] = t[o + 2] / 16),
          (a[i++] = t[o + 3]),
          (a[i++] = t[o + 4]),
          (a[i++] = t[0]),
          (a[i++] = t[1]),
          (a[i++] = t[2]));
      }
  }
  const s = n.createVertexArray();
  n.bindVertexArray(s);
  const r = n.createBuffer();
  (n.bindBuffer(n.ARRAY_BUFFER, r),
    n.bufferData(n.ARRAY_BUFFER, a, n.STATIC_DRAW),
    n.enableVertexAttribArray(0),
    n.vertexAttribPointer(0, 3, n.FLOAT, !1, 32, 0),
    n.enableVertexAttribArray(1),
    n.vertexAttribPointer(1, 2, n.FLOAT, !1, 32, 12),
    n.enableVertexAttribArray(2),
    n.vertexAttribPointer(2, 3, n.FLOAT, !1, 32, 20),
    n.bindBuffer(n.ELEMENT_ARRAY_BUFFER, t.quadIdx),
    n.bindVertexArray(null));
  for (const [t] of e) t.mesh.vao = s;
}
function emHead(t, e, o) {
  t && ((t.yRot = -(e.headYaw || 0)), (t.xRot = -(e.pitch || 0)));
}
function emLimbs(t, e) {
  const o = t.limbAmt || 0;
  return [(t.limbSwing || 0) - o * (1 - e), Math.min(1, o)];
}
function emQuad(
  t,
  e,
  o,
  n = ["right_hind_leg", "left_hind_leg", "right_front_leg", "left_front_leg"],
) {
  const a = t.parts,
    i = 1.4 * Math.cos(0.6662 * e) * o,
    s = 1.4 * Math.cos(0.6662 * e + Math.PI) * o;
  (a[n[0]] && (a[n[0]].xRot = i),
    a[n[1]] && (a[n[1]].xRot = s),
    a[n[2]] && (a[n[2]].xRot = s),
    a[n[3]] && (a[n[3]].xRot = i));
}
function emHumanoid(t, e, o, n = {}) {
  const a = t.parts,
    [i, s] = emLimbs(e, o);
  emHead(a.head, e, o);
  const r = a.right_arm,
    h = a.left_arm,
    l = a.right_leg,
    c = a.left_leg;
  (r && ((r.xRot = 2 * Math.cos(0.6662 * i + Math.PI) * s * 0.5), (r.zRot = 0), (r.yRot = 0)),
    h && ((h.xRot = 2 * Math.cos(0.6662 * i) * s * 0.5), (h.zRot = 0), (h.yRot = 0)),
    l && ((l.xRot = 1.4 * Math.cos(0.6662 * i) * s), (l.yRot = 0), (l.zRot = 0)),
    c && ((c.xRot = 1.4 * Math.cos(0.6662 * i + Math.PI) * s), (c.yRot = 0), (c.zRot = 0)),
    e.riding &&
      l &&
      c &&
      (r && (r.xRot -= Math.PI / 5),
      h && (h.xRot -= Math.PI / 5),
      (l.xRot = -1.4137167),
      (l.yRot = Math.PI / 10),
      (l.zRot = 0.07853982),
      (c.xRot = -1.4137167),
      (c.yRot = -Math.PI / 10),
      (c.zRot = -0.07853982)));
  const R = e.age + o;
  if (n.zombie && r && h) {
    const t = e.swingT > 0 ? Math.sin((1 - e.swingT / 6) * Math.PI) : 0,
      o = Math.sin(t * Math.PI),
      n = Math.sin((1 - (1 - t) * (1 - t)) * Math.PI),
      a = -Math.PI / (e.aggressive || e.target ? 1.5 : 2.25);
    ((r.zRot = 0),
      (h.zRot = 0),
      (r.yRot = -(0.1 - 0.6 * o)),
      (h.yRot = 0.1 - 0.6 * o),
      (r.xRot = a + 1.2 * o - 0.4 * n),
      (h.xRot = a + 1.2 * o - 0.4 * n));
  } else if (e.swingT > 0 && r) {
    const t = 1 - e.swingT / 6,
      o = Math.sin(Math.sqrt(t) * Math.PI);
    ((r.xRot -= 1.2 * o + Math.sin(t * Math.PI) * -(a.head ? a.head.xRot - 0.7 : 0) * 0.75),
      (r.yRot += a.body ? 0.2 * Math.sin(Math.sqrt(t) * Math.PI * 2) : 0));
  }
  (n.bow &&
    r &&
    h &&
    ((r.yRot = -0.1 + a.head.yRot),
    (h.yRot = 0.1 + a.head.yRot + 0.4),
    (r.xRot = -Math.PI / 2 + a.head.xRot),
    (h.xRot = -Math.PI / 2 + a.head.xRot)),
    r && ((r.zRot += 0.05 * Math.cos(0.09 * R) + 0.05), (r.xRot += 0.05 * Math.sin(0.067 * R))),
    h && ((h.zRot -= 0.05 * Math.cos(0.09 * R) + 0.05), (h.xRot -= 0.05 * Math.sin(0.067 * R))));
}
((Renderer.prototype.etex = function (t) {
  const e = "@" + t;
  if (this.entityTex[e]) return e;
  if ((this._etexWait || (this._etexWait = new Set()), this._etexWait.has(e))) return null;
  const o = window.ETEX && ETEX[t];
  if (!o) return null;
  this._etexWait.add(e);
  const n = new Image();
  return (
    (n.onload = () => {
      ((this.images[e] = n), (this.entityTex[e] = this.tex2D(n, !1)));
    }),
    (n.src = o),
    null
  );
}),
  (Renderer.prototype.etexMix = function (t) {
    const e =
      "@mix:" +
      t.map((t) => ("string" == typeof t ? t : t.p + (t.c ? "*" + t.c.join(",") : ""))).join("|");
    if (this.entityTex[e]) return e;
    const o = t.map((t) => {
      const e = "string" == typeof t ? t : t.p;
      return (this.etex(e), this.images["@" + e]);
    });
    if (o.some((t) => !t)) return null;
    const n = document.createElement("canvas");
    ((n.width = o[0].width), (n.height = o[0].height));
    const a = n.getContext("2d");
    return (
      t.forEach((t, e) => {
        const i = o[e];
        if ("string" != typeof t && t.c) {
          const e = document.createElement("canvas");
          ((e.width = i.width), (e.height = i.height));
          const o = e.getContext("2d");
          o.drawImage(i, 0, 0);
          const s = o.getImageData(0, 0, e.width, e.height),
            r = s.data;
          for (let e = 0; e < r.length; e += 4)
            ((r[e] *= t.c[0]), (r[e + 1] *= t.c[1]), (r[e + 2] *= t.c[2]));
          (o.putImageData(s, 0, 0), a.drawImage(e, 0, 0, n.width, n.height));
        } else a.drawImage(i, 0, 0, n.width, n.height);
      }),
      (this.entityTex[e] = this.tex2D(n, !1)),
      e
    );
  }),
  (Renderer.prototype.drawEM = function (t, e, o, n, a, i = {}) {
    if (!t || !e || !this.entityTex[e]) return;
    const s = this.gl,
      r = this.entBegin(e, n, a, i),
      h = this.mat(o);
    (M4.scale(h, -1, -1, 1), M4.translate(h, 0, -1.501, 0));
    (!0 === i.cull ? s.enable(s.CULL_FACE) : s.disable(s.CULL_FACE), s.depthFunc(s.LEQUAL));
    const l = [],
      c = i.glint ? [] : null;
    let R = null;
    const rec = (t, e) => {
      if (!t.visible) return;
      const o = this.mat(e);
      (M4.translate(o, t.x / 16, t.y / 16, t.z / 16),
        t.zRot && M4.rotZ(o, t.zRot),
        t.yRot && M4.rotY(o, t.yRot),
        t.xRot && M4.rotX(o, t.xRot),
        (1 === t.xScale && 1 === t.yScale && 1 === t.zScale) ||
          M4.scale(o, t.xScale, t.yScale, t.zScale),
        t.mesh &&
          !t.skipDraw &&
          (i.glintOnly ||
            (s.uniformMatrix4fv(r.u.u_model, !1, o),
            t.mesh.vao !== R && ((R = t.mesh.vao), s.bindVertexArray(R)),
            s.drawElements(s.TRIANGLES, 1.5 * t.mesh.n, s.UNSIGNED_INT, t.mesh.off)),
          c && c.push([t.mesh.vao, t.mesh.n, t.mesh.off, o])),
        i.attach && i.attach[t.name] && l.push([i.attach[t.name], this.mat(o)]));
      for (const e of t.kids) rec(e, o);
    };
    (rec(t.root, h),
      c && this.drawGlint(c, i.glint, a, i.vp || this.vp, !1),
      s.enable(s.CULL_FACE),
      s.depthFunc(s.LESS),
      this.unit0());
    for (const [t, e] of l) t(e);
  }),
  (Renderer.prototype.drawEMGlow = function (t, e, o, n, a = {}) {
    const i = this.gl;
    (i.enable(i.BLEND),
      i.blendFunc(i.ONE, i.ONE),
      i.depthFunc(i.LEQUAL),
      i.depthMask(!1),
      this.drawEM(t, e, o, [1, 1], n, { ...a, bright: !0 }),
      i.disable(i.BLEND),
      i.depthFunc(i.LESS),
      i.depthMask(!0));
  }),
  (Renderer.prototype.drawEMOver = function (t, e, o, n, a, i = {}) {
    const s = this.gl;
    (s.enable(s.BLEND),
      s.blendFunc(s.SRC_ALPHA, s.ONE_MINUS_SRC_ALPHA),
      s.depthFunc(s.LEQUAL),
      this.drawEM(t, e, o, n, a, i),
      s.disable(s.BLEND),
      s.depthFunc(s.LESS));
  }));
//# sourceURL=js/emodel.js
