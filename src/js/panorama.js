"use strict";
const PANO_FACES = [
  { yaw: 0, pitch: 0 },
  { yaw: Math.PI / 2, pitch: 0 },
  { yaw: Math.PI, pitch: 0 },
  { yaw: -Math.PI / 2, pitch: 0 },
  { yaw: 0, pitch: Math.PI / 2 },
  { yaw: 0, pitch: -Math.PI / 2 },
];
function panoBasis(t, a) {
  return [
    [Math.cos(t), 0, -Math.sin(t)],
    [Math.sin(t) * Math.sin(a), Math.cos(a), Math.cos(t) * Math.sin(a)],
    [-Math.sin(t) * Math.cos(a), Math.sin(a), -Math.cos(t) * Math.cos(a)],
  ];
}
const Panorama = {
  img: null,
  load() {
    const t = window.PANORAMA;
    t && !this.img && ((this.img = new Image()), (this.img.src = t.img));
  },
  ready() {
    return !!(this.img && this.img.complete && this.img.naturalWidth);
  },
};
(Panorama.load(),
  (Renderer.prototype.drawPanorama = function (t, a, e, n) {
    const o = this.gl;
    if (!this.pano) {
      const t =
          "#version 300 es\n      out vec2 v;\n      void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0; v = p; gl_Position = vec4(p, 0.0, 1.0); }",
        a =
          "#version 300 es\n      precision highp float;\n      in vec2 v; out vec4 o;\n      uniform mat3 u_rot; uniform vec2 u_tan; uniform vec3 u_R[6], u_U[6], u_F[6];\n      uniform sampler2D u_tex; uniform vec2 u_texel; uniform float u_alpha;\n      void main() {\n        vec3 d = normalize(u_rot * vec3(v * u_tan, 1.0));\n        int f = 0; float best = -2.0;\n        for (int i = 0; i < 6; i++) { float t = dot(d, u_F[i]); if (t > best) { best = t; f = i; } }\n        vec2 c = vec2(dot(d, u_R[f]), dot(d, u_U[f])) / best;\n        vec2 uv = clamp(vec2(c.x * 0.5 + 0.5, 0.5 - c.y * 0.5), u_texel, 1.0 - u_texel);\n        uv = (uv + vec2(float(f % 3), float(f / 3))) / vec2(3.0, 2.0);\n        o = vec4(texture(u_tex, uv).rgb, u_alpha);\n      }",
        sh = (t, a) => {
          const e = o.createShader(t);
          if (
            (o.shaderSource(e, a), o.compileShader(e), !o.getShaderParameter(e, o.COMPILE_STATUS))
          )
            throw new Error(o.getShaderInfoLog(e));
          return e;
        },
        e = o.createProgram();
      (o.attachShader(e, sh(o.VERTEX_SHADER, t)),
        o.attachShader(e, sh(o.FRAGMENT_SHADER, a)),
        o.linkProgram(e));
      const n = {};
      for (const t of ["u_rot", "u_tan", "u_R", "u_U", "u_F", "u_tex", "u_texel", "u_alpha"])
        n[t] = o.getUniformLocation(e, t);
      const i = o.createTexture();
      (o.bindTexture(o.TEXTURE_2D, i),
        o.texImage2D(o.TEXTURE_2D, 0, o.RGBA, o.RGBA, o.UNSIGNED_BYTE, Panorama.img),
        o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MIN_FILTER, o.LINEAR),
        o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MAG_FILTER, o.LINEAR),
        o.texParameteri(o.TEXTURE_2D, o.TEXTURE_WRAP_S, o.CLAMP_TO_EDGE),
        o.texParameteri(o.TEXTURE_2D, o.TEXTURE_WRAP_T, o.CLAMP_TO_EDGE));
      const r = PANO_FACES.map((t) => panoBasis(t.yaw, t.pitch));
      this.pano = {
        p: e,
        u: n,
        tex: i,
        vao: o.createVertexArray(),
        R: new Float32Array(r.flatMap((t) => t[0])),
        U: new Float32Array(r.flatMap((t) => t[1])),
        F: new Float32Array(r.flatMap((t) => t[2])),
        texel: [0.5 / (Panorama.img.naturalWidth / 3), 0.5 / (Panorama.img.naturalHeight / 2)],
      };
    }
    const i = this.pano,
      r = panoBasis(t, a),
      h = Math.tan((e * Math.PI) / 360);
    (o.useProgram(i.p),
      o.uniformMatrix3fv(i.u.u_rot, !1, new Float32Array([...r[0], ...r[1], ...r[2]])),
      o.uniform2f(i.u.u_tan, (h * this.canvas.width) / this.canvas.height, h),
      o.uniform3fv(i.u.u_R, i.R),
      o.uniform3fv(i.u.u_U, i.U),
      o.uniform3fv(i.u.u_F, i.F),
      o.uniform2f(i.u.u_texel, i.texel[0], i.texel[1]),
      o.uniform1f(i.u.u_alpha, n),
      o.activeTexture(o.TEXTURE0),
      o.bindTexture(o.TEXTURE_2D, i.tex),
      o.uniform1i(i.u.u_tex, 0),
      o.disable(o.DEPTH_TEST),
      o.disable(o.CULL_FACE),
      o.depthMask(!1),
      n < 1
        ? (o.enable(o.BLEND), o.blendFunc(o.SRC_ALPHA, o.ONE_MINUS_SRC_ALPHA))
        : o.disable(o.BLEND),
      o.bindVertexArray(i.vao),
      o.drawArrays(o.TRIANGLES, 0, 3),
      o.bindVertexArray(null),
      o.disable(o.BLEND),
      o.depthMask(!0),
      o.enable(o.DEPTH_TEST),
      o.enable(o.CULL_FACE));
  }),
  (Game.prototype.titleWorldReady = function () {
    const t = this.world,
      a = Math.floor(this.titleCam[0]) >> 4,
      e = Math.floor(this.titleCam[2]) >> 4;
    for (let n = -6; n <= 6; n++)
      for (let o = -6; o <= 6; o++) {
        if (n * n + o * o > 36) continue;
        const i = t.chunks.get(ckey(a + n, e + o));
        if (!i || i.dirty) return !1;
      }
    return !0;
  }),
  (Game.prototype.updatePanorama = function (t) {
    this.panoAlpha > 0 &&
      ((this.panoT = (this.panoT || 0) + t),
      !this.panoFading && (this.titleWorldReady() || this.panoT > 2e4) && (this.panoFading = !0),
      this.panoFading && (this.panoAlpha = Math.max(0, this.panoAlpha - t / 1e3)));
  }),
  (Game.prototype.capturePanorama = function (t = 512) {
    const a = this.renderer,
      e = document.createElement("canvas");
    ((e.width = 3 * t), (e.height = 2 * t));
    const n = e.getContext("2d"),
      o = this.panoAlpha;
    return (
      (this.panoAlpha = 0),
      (a.forceSize = [t, t]),
      PANO_FACES.forEach((e, o) => {
        ((this.panoCam = e),
          this.render(0, performance.now()),
          n.drawImage(a.canvas, (o % 3) * t, Math.floor(o / 3) * t, t, t));
      }),
      (this.panoCam = null),
      (a.forceSize = null),
      (this.panoAlpha = o),
      {
        seed: this.world.seedStr,
        pos: this.titleCam.map((t) => +t.toFixed(2)),
        img: e.toDataURL("image/jpeg", 0.86),
      }
    );
  }));
//# sourceURL=js/panorama.js
