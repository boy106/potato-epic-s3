"use strict";
const CHUNK_VS =
    "#version 300 es\nlayout(location=0) in vec4 a_pos;\nlayout(location=1) in vec2 a_uv;\nlayout(location=2) in uvec2 a_tex;\nlayout(location=3) in vec4 a_col;\nlayout(location=4) in vec2 a_light;\nlayout(location=5) in uint a_anim;\nuniform mat4 u_vp; uniform mat4 u_model; uniform int u_sec; // u_sec: compact terrain section (anim in a_pos.w)\nuniform vec3 u_cam; uniform float u_tick; uniform vec3 u_lightOv; // x>=0: override sky/block\nout vec2 v_uv; flat out uint v_layer; flat out uint v_overlay; out vec4 v_col; out vec2 v_light; out float v_dist;\nvoid main(){\n  vec4 wp = u_model * vec4(a_pos.xyz,1.0);\n  gl_Position = u_vp * wp;\n  v_uv = a_uv;\n  uint layer = a_tex.x;\n  uint anim = u_sec == 1 ? uint(a_pos.w * 65535.0 + 0.5) : a_anim;\n  if (anim > 0u) layer += uint(floor(u_tick / 2.0)) % anim;\n  v_layer = layer; v_overlay = a_tex.y;\n  v_col = a_col;\n  v_light = u_lightOv.z > 0.5 ? u_lightOv.xy : a_light;\n  v_dist = length(wp.xz - u_cam.xz);\n  float dy = abs(wp.y - u_cam.y); v_dist = max(v_dist, dy * 0.5);\n}",
  CHUNK_FS =
    "#version 300 es\nprecision highp float; precision highp sampler2DArray;\nuniform sampler2DArray u_tex;\nuniform float u_day; uniform vec3 u_fogColor; uniform vec2 u_fog; uniform float u_alphaTest; uniform vec4 u_colorMul;\nuniform float u_gamma; uniform vec3 u_nightTint; uniform vec3 u_ambient;\nuniform uint u_portalLayer; uniform sampler2D u_portalTex; uniform float u_time; uniform vec2 u_res;\nuniform sampler2D u_lightmap;\nin vec2 v_uv; flat in uint v_layer; flat in uint v_overlay; in vec4 v_col; in vec2 v_light; in float v_dist;\nout vec4 o;\nfloat bright(float x){ float a = x / (4.0 - 3.0 * x); float b = 1.0 - pow(1.0 - x, 3.0); return mix(a, b, u_gamma); }\nvoid main(){\n  if (v_layer == u_portalLayer) { // (integers: a float compare rounds layers past 2048 together on half-precision phones)\n    vec2 sc = gl_FragCoord.xy / u_res.y;\n    vec3 col = vec3(0.035, 0.07, 0.09);\n    for (int i = 0; i < 6; i++) {\n      float fi = float(i), s = 0.6 + fi * 0.35, a = fi * 1.3;\n      mat2 r = mat2(cos(a), -sin(a), sin(a), cos(a));\n      vec2 uv = r * sc * s + vec2(u_time * 0.000012 * (fi + 2.0), u_time * 0.000018 * (7.0 - fi));\n      vec3 st = texture(u_portalTex, uv).rgb;\n      vec3 tint = vec3(0.4 + 0.1 * sin(fi), 0.6 + 0.15 * cos(fi * 2.0), 0.7 + 0.2 * sin(fi * 3.0)) * (0.5 + 0.12 * fi);\n      col += st * tint;\n    }\n    o = vec4(col, 1.0);\n    return;\n  }\n  vec4 t = texture(u_tex, vec3(v_uv, float(v_layer)));\n  vec3 c;\n  uint ovl = v_overlay & 0x7fffu;\n  if (v_overlay >= 0x8000u) t.a = 1.0; // 图形品质 流畅: leaves drawn solid\n  if (ovl > 0u) {\n    vec4 ov = texture(u_tex, vec3(v_uv, float(ovl)));\n    c = mix(t.rgb, ov.rgb * v_col.rgb, ov.a);\n  } else c = t.rgb * v_col.rgb;\n  if (t.a < u_alphaTest) discard;\n  // vanilla lightmap: x = block light, y = sky light (smoothly interpolated levels, like vanilla)\n  vec3 L = texture(u_lightmap, (vec2(v_light.y, v_light.x) * 15.0 + 0.5) / 16.0).rgb;\n  c *= L * v_col.a;\n  float f = clamp((v_dist - u_fog.x) / (u_fog.y - u_fog.x), 0.0, 1.0);\n  c = mix(c, u_fogColor, f);\n  o = vec4(c, t.a) * u_colorMul;\n}",
  ENT_VS =
    "#version 300 es\nlayout(location=0) in vec3 a_pos; layout(location=1) in vec2 a_uv; layout(location=2) in vec3 a_n;\nuniform mat4 u_vp; uniform mat4 u_model; uniform vec3 u_cam; uniform float u_inv;\nout vec2 v_uv; out float v_shade; out float v_dist;\nvoid main(){\n  vec4 wp = u_model * vec4(a_pos,1.0);\n  gl_Position = u_vp * wp;\n  v_uv = a_uv;\n  vec3 n = normalize(mat3(u_model) * a_n);\n  // vanilla entity lighting: two fixed directional lights, 0.4 ambient + 0.6 diffuse\n  vec3 L0 = normalize(vec3(0.2, 1.0, -0.7)), L1 = normalize(vec3(-0.2, 1.0, 0.7));\n  v_shade = min(1.0, 0.4 + 0.6 * (max(dot(n, L0), 0.0) + max(dot(n, L1), 0.0)));\n  // a preview in a menu (u_inv): lit from the viewer's side, front and back alike (it turns), the sides a little darker\n  if (u_inv > 0.5) { vec3 F0 = normalize(vec3(-0.3, 0.6, 1.0)), F1 = normalize(vec3(0.3, 0.6, -1.0)); v_shade = min(1.0, 0.55 + 0.5 * (max(dot(n, F0), 0.0) + max(dot(n, F1), 0.0))); }\n  v_dist = length(wp.xz - u_cam.xz);\n}",
  ENT_FS =
    "#version 300 es\nprecision highp float;\nuniform sampler2D u_tex; uniform vec2 u_light; uniform float u_day; uniform vec4 u_overlay; uniform vec3 u_tint;\nuniform vec3 u_fogColor; uniform vec2 u_fog; uniform float u_gamma; uniform vec3 u_nightTint; uniform vec3 u_ambient; uniform float u_bright; uniform float u_fade;\nuniform sampler2D u_lightmap;\nin vec2 v_uv; in float v_shade; in float v_dist; out vec4 o;\nfloat bright(float x){ float a = x / (4.0 - 3.0 * x); float b = 1.0 - pow(1.0 - x, 3.0); return mix(a, b, u_gamma); }\nvoid main(){\n  vec4 t = texture(u_tex, v_uv);\n  if (t.a < 0.1) discard;\n  vec3 c = t.rgb * u_tint;\n  c = mix(c, u_overlay.rgb, u_overlay.a);\n  vec3 L = texture(u_lightmap, (vec2(u_light.y, u_light.x) * 15.0 + 0.5) / 16.0).rgb;\n  L = mix(L, vec3(1.0), u_bright);\n  c *= L * mix(min(v_shade, 1.0), 1.0, u_bright);\n  float f = clamp((v_dist - u_fog.x) / (u_fog.y - u_fog.x), 0.0, 1.0);\n  o = vec4(mix(c, u_fogColor, f), t.a * (1.0 - u_fade));\n}",
  SKY_VS =
    "#version 300 es\nconst vec2 P[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));\nout vec2 v_p;\nvoid main(){ v_p = P[gl_VertexID]; gl_Position = vec4(P[gl_VertexID], 0.9999, 1.0); }",
  SKY_FS =
    "#version 300 es\nprecision highp float;\nuniform mat4 u_invVP; uniform vec3 u_sky; uniform vec3 u_fogColor; uniform vec3 u_sunDir; uniform vec4 u_sunset; uniform vec3 u_void; uniform float u_voidOn;\nin vec2 v_p; out vec4 o;\nvoid main(){\n  vec4 a = u_invVP * vec4(v_p, 1.0, 1.0);\n  vec3 d = normalize(a.xyz / a.w);\n  float h = d.y;\n  vec3 c = mix(u_fogColor, u_sky, smoothstep(0.0, 0.45, h));\n  // vanilla only draws the dark lower sky when the camera is below the horizon height (y 63)\n  if (h < 0.0 && u_voidOn > 0.5) c = mix(u_fogColor, u_void, smoothstep(-0.12, -0.6, h));\n  // sunrise / sunset glow\n  vec3 sd = normalize(vec3(u_sunDir.x, 0.0, u_sunDir.z) + vec3(0.0001));\n  float g = pow(max(dot(normalize(vec3(d.x, 0.0, d.z)), sd), 0.0), 3.0) * (1.0 - smoothstep(0.0, 0.5, abs(h - 0.05)));\n  c = mix(c, u_sunset.rgb, clamp(g * u_sunset.a, 0.0, 1.0));\n  o = vec4(c, 1.0);\n}",
  TEX_VS =
    "#version 300 es\nlayout(location=0) in vec3 a_pos; layout(location=1) in vec2 a_uv;\nuniform mat4 u_vp; uniform mat4 u_model;\nout vec2 v_uv;\nvoid main(){ v_uv = a_uv; gl_Position = u_vp * u_model * vec4(a_pos, 1.0); }",
  TEX_FS =
    "#version 300 es\nprecision highp float;\nuniform sampler2D u_tex; uniform vec4 u_color; uniform float u_cut; // u_cut: alpha below it discarded (0: none)\nin vec2 v_uv; out vec4 o;\nvoid main(){ vec4 t = texture(u_tex, v_uv); if (t.a < u_cut) discard; o = t * u_color; }",
  glintVS = (t) =>
    `#version 300 es\nlayout(location=0) in vec3 a_pos; layout(location=1) in vec2 a_uv;${t ? " layout(location=2) in uvec2 a_tex; flat out uint v_layer;" : ""}\nuniform mat4 u_vp; uniform mat4 u_model; uniform vec3 u_cam; uniform vec4 u_tm;\nout vec2 v_uv; out vec2 v_guv; out float v_dist;\nvoid main(){ vec4 wp = u_model * vec4(a_pos, 1.0); gl_Position = u_vp * wp; v_uv = a_uv;${t ? " v_layer = a_tex.x;" : ""}\n  vec2 p = a_uv * u_tm.z; float c = cos(u_tm.w), s = sin(u_tm.w); v_guv = vec2(p.x * c - p.y * s, p.x * s + p.y * c) + u_tm.xy;\n  v_dist = length(wp.xz - u_cam.xz); }`,
  glintFS = (t) =>
    `#version 300 es\nprecision highp float;${t ? " precision highp sampler2DArray;\nuniform sampler2DArray u_tex; flat in uint v_layer;" : "\nuniform sampler2D u_tex;"}\nuniform sampler2D u_glint; uniform vec2 u_fog; uniform float u_alpha;\nin vec2 v_uv; in vec2 v_guv; in float v_dist; out vec4 o;\nvoid main(){\n  if (${t ? "texture(u_tex, vec3(v_uv, float(v_layer))).a" : "texture(u_tex, v_uv).a"} < 0.1) discard;\n  vec4 c = texture(u_glint, v_guv); if (c.a < 0.1) discard;\n  float fade = (1.0 - clamp((v_dist - u_fog.x) / (u_fog.y - u_fog.x), 0.0, 1.0)) * u_alpha;\n  o = vec4(c.rgb * fade, c.a); }`,
  COL_VS =
    "#version 300 es\nlayout(location=0) in vec3 a_pos; layout(location=1) in vec4 a_col;\nuniform mat4 u_vp; uniform mat4 u_model; uniform vec3 u_cam; uniform float u_psize;\nout vec4 v_col; out float v_dist;\nvoid main(){ vec4 wp = u_model * vec4(a_pos,1.0); gl_Position = u_vp * wp; v_col = a_col; v_dist = length(wp.xz - u_cam.xz); gl_PointSize = u_psize; }",
  COL_FS =
    "#version 300 es\nprecision highp float;\nuniform vec4 u_color; uniform vec3 u_fogColor; uniform vec2 u_fog;\nin vec4 v_col; in float v_dist; out vec4 o;\nvoid main(){ vec4 c = v_col * u_color; float f = clamp((v_dist - u_fog.x) / (u_fog.y - u_fog.x), 0.0, 1.0); o = vec4(mix(c.rgb, u_fogColor, f), c.a * (1.0 - f * f)); }",
  AMB0 = [0.08, 0.08, 0.08];
function stackGlint(t) {
  const e = t && ITEMS[t.id];
  return !!e && !!(t.g || (!1 !== t.g && ((t.e && t.e.length) || e.glint)));
}
let TEX_STACK = 1;
function compile(t, e, i) {
  if (i.includes("uniform sampler2DArray u_tex;")) {
    const t = TEX_STACK;
    if (
      ((i = i.replace(/texture\(u_tex, vec3\(v_uv, float\(([^()]+)\)\)\)/g, "texLayer(v_uv, $1)")),
      /texture\(u_tex, vec3\(/.test(i))
    )
      throw new Error("tile lookup not through texLayer");
    i = i.replace(
      "uniform sampler2DArray u_tex;",
      t > 1
        ? `uniform sampler2DArray u_tex;\nvec4 texLayer(vec2 uv, uint l) { vec2 s = vec2(1.0, 1.0 / ${t}.0), gx = dFdx(uv) * s, gy = dFdy(uv) * s;\n  return textureGrad(u_tex, vec3(uv.x, (clamp(uv.y, 0.015625, 0.984375) + float(l % ${t}u)) / ${t}.0, float(l / ${t}u)), gx, gy); }`
        : "uniform sampler2DArray u_tex;\nvec4 texLayer(vec2 uv, uint l) { return texture(u_tex, vec3(uv, float(l))); }",
    );
  }
  const mk = (e, i) => {
      const o = t.createShader(e);
      if ((t.shaderSource(o, i), t.compileShader(o), !t.getShaderParameter(o, t.COMPILE_STATUS)))
        throw new Error(t.getShaderInfoLog(o) + "\n" + i);
      return o;
    },
    o = t.createProgram();
  if (
    (t.attachShader(o, mk(t.VERTEX_SHADER, e)),
    t.attachShader(o, mk(t.FRAGMENT_SHADER, i)),
    t.linkProgram(o),
    !t.getProgramParameter(o, t.LINK_STATUS))
  )
    throw new Error(t.getProgramInfoLog(o));
  const n = {},
    a = t.getProgramParameter(o, t.ACTIVE_UNIFORMS);
  for (let e = 0; e < a; e++) {
    const i = t.getActiveUniform(o, e);
    n[i.name] = t.getUniformLocation(o, i.name);
  }
  return { p: o, u: n };
}
function loadImage(t) {
  return new Promise((e, i) => {
    const o = new Image();
    ((o.onload = () => e(o)), (o.onerror = i), (o.src = t));
  });
}
const ARENA_PAGE = 8 << 20,
  ARENA_ALIGN = 768;
class VertexArena {
  constructor(t, e) {
    ((this.gl = t),
      (this.mkVao = e),
      (this.pages = []),
      (this.used = 0),
      (this.total = 0),
      (this.pagedUsed = 0),
      (this.pagedTotal = 0),
      (this.pageN = 0));
  }
  newPage(t) {
    const e = this.gl,
      i = e.createBuffer();
    (e.bindBuffer(e.ARRAY_BUFFER, i), e.bufferData(e.ARRAY_BUFFER, t, e.STATIC_DRAW));
    const o = {
      buf: i,
      size: t,
      free: [[0, t]],
      used: 0,
      allocs: new Set(),
      id: this.pageN++,
      vao: this.mkVao(i),
    };
    return (this.pages.push(o), (this.total += t), o);
  }
  fit(t, e) {
    for (const i of this.pages) {
      if (i.solo || i === e || i.size - i.used < t) continue;
      const o = i.free;
      for (let e = 0; e < o.length; e++) {
        if (o[e][1] < t) continue;
        const n = o[e][0];
        return (
          o[e][1] === t ? o.splice(e, 1) : ((o[e][0] += t), (o[e][1] -= t)),
          (i.used += t),
          { pg: i, off: n, size: t }
        );
      }
    }
    return null;
  }
  alloc(t) {
    const e = 768 * Math.ceil(t / 768);
    if (((this.used += e), e > 4194304)) {
      const t = this.newPage(e);
      return ((t.free = []), (t.used = e), (t.solo = !0), { pg: t, off: 0, size: e });
    }
    let i = this.fit(e, null);
    if (!i) {
      const t = this.newPage(8388608);
      ((this.pagedTotal += 8388608),
        (t.free[0][0] = e),
        (t.free[0][1] -= e),
        (t.used = e),
        (i = { pg: t, off: 0, size: e }));
    }
    return ((this.pagedUsed += e), i.pg.allocs.add(i), i);
  }
  free(t) {
    ((this.used -= t.size),
      t.pg.solo || ((this.pagedUsed -= t.size), t.pg.allocs.delete(t)),
      this.release(t.pg, t.off, t.size));
  }
  release(t, e, i) {
    if (((t.used -= i), 0 === t.used && (t.solo || this.pages.filter((t) => !t.solo).length > 1)))
      return (
        this.gl.deleteVertexArray(t.vao),
        this.gl.deleteBuffer(t.buf),
        (this.total -= t.size),
        t.solo || (this.pagedTotal -= t.size),
        void this.pages.splice(this.pages.indexOf(t), 1)
      );
    const o = t.free;
    let n = 0;
    for (; n < o.length && o[n][0] < e;) n++;
    (o.splice(n, 0, [e, i]),
      n + 1 < o.length &&
        o[n][0] + o[n][1] === o[n + 1][0] &&
        ((o[n][1] += o[n + 1][1]), o.splice(n + 1, 1)),
      n > 0 && o[n - 1][0] + o[n - 1][1] === o[n][0] && ((o[n - 1][1] += o[n][1]), o.splice(n, 1)));
  }
  compact(t = 1 << 20) {
    if (this.pagedTotal - this.pagedUsed < 12582912 || this.pagedTotal < 1.3 * this.pagedUsed)
      return 0;
    let e = null;
    for (const t of this.pages) t.solo || (e && !(t.used < e.used)) || (e = t);
    if (!e) return 0;
    const i = this.gl;
    let o = 0;
    for (const n of e.allocs) {
      if (o >= t) break;
      const a = this.fit(n.size, e);
      if (!a) break;
      (i.bindBuffer(i.COPY_READ_BUFFER, e.buf),
        i.bindBuffer(i.COPY_WRITE_BUFFER, a.pg.buf),
        i.copyBufferSubData(i.COPY_READ_BUFFER, i.COPY_WRITE_BUFFER, n.off, a.off, n.size));
      const r = n.off;
      (e.allocs.delete(n),
        (n.pg = a.pg),
        (n.off = a.off),
        a.pg.allocs.add(n),
        n.vao && this.onMove && this.onMove(n),
        this.release(e, r, n.size),
        (o += n.size));
    }
    return (i.bindBuffer(i.COPY_READ_BUFFER, null), i.bindBuffer(i.COPY_WRITE_BUFFER, null), o);
  }
}
class Renderer {
  constructor(t) {
    this.canvas = t;
    const e = t.getContext("webgl2", {
      antialias: !1,
      alpha: !1,
      preserveDrawingBuffer: !1,
      powerPreference: "high-performance",
    });
    if (!e) throw new Error("WebGL2 不可用");
    ((this.gl = e),
      (this.lost = !1),
      t.addEventListener(
        "webglcontextlost",
        (t) => {
          (t.preventDefault(), this.onContextLost());
        },
        !1,
      ),
      t.addEventListener("webglcontextrestored", () => this.onContextRestored(), !1),
      (this.resize = function () {
        if (!1 !== this.inFrame) return Object.getPrototypeOf(this).resize.call(this);
      }),
      (this.aniso = e.getExtension("EXT_texture_filter_anisotropic")));
    const i =
        +new URLSearchParams(location.search).get("texsplit") ||
        e.getParameter(e.MAX_ARRAY_TEXTURE_LAYERS),
      o = Math.min(i, 2048);
    ((TEX_STACK = Math.ceil(ASSETS.count / o)),
      (this.progChunk = compile(e, CHUNK_VS, CHUNK_FS)),
      (this.progEnt = compile(e, ENT_VS, ENT_FS)),
      (this.progSky = compile(e, SKY_VS, SKY_FS)),
      (this.progTex = compile(e, TEX_VS, TEX_FS)),
      (this.progCol = compile(e, COL_VS, COL_FS)),
      (this.proj = M4.create()),
      (this.view = M4.create()),
      (this.vp = M4.create()),
      (this.identity = M4.create()),
      (this.fov = 70),
      (this.renderDist = 8),
      (this.camPos = [0, 0, 0]),
      (this.sections = new Map()),
      (this.secVis = new Map()),
      (this.cols = new Map()),
      (this.cullDirty = !0),
      (this.emptyVao = e.createVertexArray()),
      (this.gamma = 0.5),
      (this.entityTex = {}),
      (this.modelCache = {}),
      (this.particleBuf = new MeshBuffer(4096)),
      (this.particleGL = this.makeDynamic()),
      (this.miscBuf = new MeshBuffer(1024)),
      (this.miscGL = this.makeDynamic()),
      (this.ufEpoch = 0),
      (this.texEp = -1),
      (this.matI = 0));
    const n = new URLSearchParams(location.search).get("meshvao");
    this.meshVao = null !== n ? "1" === n : "undefined" != typeof WEBKIT_GL && WEBKIT_GL;
  }
  get inFrame() {
    return this._inFrame;
  }
  set inFrame(t) {
    ((this._inFrame = t), t && ((this.matI = 0), this.ufEpoch++));
  }
  async init() {
    const t = this.gl,
      e = ASSETS.count,
      i = (this.stripCols = ASSETS.cols || 1),
      o = ASSETS.extra || [],
      n = Math.ceil(e / i),
      tele = (t) => {
        let e = 0;
        const f = () =>
          "undefined" != typeof Telemetry && Telemetry.count
            ? Telemetry.count(t)
            : ++e < 20 && setTimeout(f, 3e3);
        f();
      };
    let a, r;
    for (let t = 0; ; t++) {
      const e = await loadImage(ASSETS.strip);
      ((a = document.createElement("canvas")),
        (a.width = e.width),
        (a.height = Math.max(e.height, 16 * n)),
        (r = a.getContext("2d", { willReadFrequently: !0 })),
        r.drawImage(e, 0, 0));
      const i = r.getImageData(0, 0, e.width, e.height).data;
      let o = !1;
      for (let t = 3; t < i.length; t += 4)
        if (i[t]) {
          o = !0;
          break;
        }
      if (o || t >= 3) {
        t && tele(o ? "tex_src_retry_ok" : "tex_src_empty");
        break;
      }
      await new Promise((t) => setTimeout(t, 250));
    }
    for (const t of o) {
      if (t.src) {
        const e = await loadImage(t.src);
        r.drawImage(e, 0, 16 * Math.floor(t.at / i));
        continue;
      }
      (await Promise.all(t.files.map((t) => loadImage(t).catch(() => null)))).forEach((e, o) => {
        if (!e) return;
        const n = t.at + o;
        r.drawImage(
          e,
          0,
          0,
          Math.min(16, e.width),
          Math.min(16, e.width),
          (n % i) * 16,
          16 * Math.floor(n / i),
          16,
          16,
        );
      });
    }
    const s = r.getImageData(0, 0, a.width, a.height).data,
      l = new Uint8ClampedArray(1024 * e);
    for (let t = 0; t < e; t++) {
      const e = (t % i) * 16,
        o = 16 * Math.floor(t / i);
      for (let i = 0; i < 16; i++)
        l.set(
          s.subarray(4 * ((o + i) * a.width + e), 4 * ((o + i) * a.width + e + 16)),
          64 * (16 * t + i),
        );
    }
    ((this.stripCanvas = a), (_spriteAlpha = new Uint8Array(256 * e)));
    for (let t = 0; t < 256 * e; t++) _spriteAlpha[t] = l[4 * t + 3];
    this.tileData = l;
    const u = TEX_STACK,
      c = Math.ceil(e / u),
      h = t.createTexture();
    (t.bindTexture(t.TEXTURE_2D_ARRAY, h),
      t.texStorage3D(t.TEXTURE_2D_ARRAY, 5, t.RGBA8, 16, 16 * u, c));
    const upload = (e, i, o) => {
      const n = c * u * i * i * 4;
      if (o.length < n) {
        const t = new Uint8Array(n);
        (t.set(o), (o = t));
      }
      t.texSubImage3D(t.TEXTURE_2D_ARRAY, e, 0, 0, 0, i, i * u, c, t.RGBA, t.UNSIGNED_BYTE, o);
    };
    let m = new Uint8Array(l.buffer.slice(0)),
      _ = 16;
    for (let t = 0; t < 256 * e; t++)
      0 === m[4 * t + 3] && (m[4 * t] = m[4 * t + 1] = m[4 * t + 2] = 0);
    (this.fillTransparent(m, 16, e), upload(0, 16, m));
    const d = new Uint8Array(e),
      v = new Set();
    for (const t of BLOCKS)
      if (t && t.key && t.key.endsWith("leaves"))
        for (const e of Array.isArray(t.tex) ? t.tex : [t.tex]) v.add(e);
    for (let t = 0; t < e; t++) {
      if (v.has(t)) continue;
      let e = !0,
        i = !1;
      for (let o = 256 * t; o < 256 * (t + 1); o++) {
        const t = m[4 * o + 3];
        if (0 !== t && 255 !== t) {
          e = !1;
          break;
        }
        0 === t && (i = !0);
      }
      d[t] = e && i ? 1 : 0;
    }
    for (let t = 1; t < 5; t++) {
      const i = _ >> 1,
        o = new Uint8Array(i * i * e * 4);
      for (let t = 0; t < e; t++)
        for (let e = 0; e < i; e++)
          for (let n = 0; n < i; n++) {
            let a = 0,
              r = 0,
              s = 0,
              l = 0,
              u = 0;
            if (d[t]) {
              const a = 4 * ((t * _ + 2 * e) * _ + 2 * n),
                r = 4 * ((t * i + e) * i + n);
              ((o[r] = m[a]), (o[r + 1] = m[a + 1]), (o[r + 2] = m[a + 2]), (o[r + 3] = m[a + 3]));
              continue;
            }
            for (let i = 0; i < 2; i++)
              for (let o = 0; o < 2; o++) {
                const c = 4 * ((t * _ + 2 * e + i) * _ + 2 * n + o),
                  h = m[c + 3];
                l += h;
                const d = h + 1;
                ((a += m[c] * d), (r += m[c + 1] * d), (s += m[c + 2] * d), (u += d));
              }
            const c = 4 * ((t * i + e) * i + n);
            ((o[c] = a / u), (o[c + 1] = r / u), (o[c + 2] = s / u), (o[c + 3] = l / 4));
          }
      (upload(t, i, o), (m = o), (_ = i));
    }
    (t.bindTexture(t.TEXTURE_2D_ARRAY, h),
      t.texParameteri(t.TEXTURE_2D_ARRAY, t.TEXTURE_MIN_FILTER, t.NEAREST_MIPMAP_LINEAR),
      t.texParameteri(t.TEXTURE_2D_ARRAY, t.TEXTURE_MAG_FILTER, t.NEAREST),
      t.texParameteri(t.TEXTURE_2D_ARRAY, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE),
      t.texParameteri(t.TEXTURE_2D_ARRAY, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE),
      t.texParameteri(t.TEXTURE_2D_ARRAY, t.TEXTURE_MAX_LEVEL, 4),
      (this.texArray = h),
      initAnimTable(),
      (this.portalLayer = T("end_portal_marker")));
    try {
      this.texSelfTest(e, l);
    } catch (t) {}
    this.images = {};
    const p = Object.keys(ASSETS.images),
      g = await Promise.all(p.map((t) => loadImage(ASSETS.images[t])));
    if (
      (p.forEach((t, e) => {
        this.images[t] = g[e];
      }),
      ASSETS.dropped && ASSETS.dropped.length)
    ) {
      const t = document.createElement("canvas");
      t.width = t.height = 1;
      for (const e of ASSETS.dropped) this.images[e] || (this.images[e] = t);
    }
    for (const t of [
      "pig",
      "cow",
      "sheep",
      "sheep_wool",
      "chicken",
      "zombie",
      "skeleton",
      "creeper",
      "spider",
      "spider_eyes",
      "steve",
      "sun",
      "moon0",
      "moon1",
      "moon2",
      "moon3",
      "moon4",
      "moon5",
      "moon6",
      "moon7",
      "arrow_entity",
      "shadow",
      "rain",
      "snowfall",
      "chest_normal",
      "chest_left",
      "chest_right",
      "armor_leather",
      "armor_leather_overlay",
      "armor_leather_legs",
      "armor_leather_legs_overlay",
      "armor_iron",
      "armor_iron_legs",
      "armor_diamond",
      "armor_diamond_legs",
      "enderman",
      "enderman_eyes",
      "blaze",
      "ghast",
      "ghast_shooting",
      "zombified_piglin",
      "magma_cube",
      "piglin",
      "hoglin",
      "strider",
      "strider_cold",
      "armor_golden",
      "armor_golden_legs",
      "dragon",
      "dragon_eyes",
      "dragon_exploding",
      "end_crystal",
      "end_crystal_beam",
      "end_portal_tex",
      "end_sky",
      "beacon_beam",
    ])
      this.entityTex[t] = this.tex2D(
        this.images[t],
        [
          "rain",
          "snowfall",
          "end_portal_tex",
          "end_sky",
          "end_crystal_beam",
          "beacon_beam",
        ].includes(t),
      );
    const cm = (t) => {
      const e = document.createElement("canvas");
      ((e.width = 256), (e.height = 256));
      const i = e.getContext("2d", { willReadFrequently: !0 });
      return (i.drawImage(t, 0, 0), i.getImageData(0, 0, 256, 256).data);
    };
    ((this.grassMap = cm(this.images.grass_color)),
      (this.foliageMap = cm(this.images.foliage_color)));
    {
      const t = document.createElement("canvas");
      ((t.width = 256), (t.height = 256));
      const e = t.getContext("2d", { willReadFrequently: !0 });
      e.drawImage(this.images.clouds, 0, 0);
      const i = e.getImageData(0, 0, 256, 256).data;
      this.cloudMap = new Uint8Array(65536);
      for (let t = 0; t < 65536; t++) this.cloudMap[t] = i[4 * t + 3] > 128 ? 1 : 0;
    }
    const E = 1 << 18,
      x = new Uint32Array(1572864);
    for (let t = 0; t < E; t++) {
      const e = 4 * t,
        i = 6 * t;
      ((x[i] = e),
        (x[i + 1] = e + 1),
        (x[i + 2] = e + 2),
        (x[i + 3] = e),
        (x[i + 4] = e + 2),
        (x[i + 5] = e + 3));
    }
    ((this.quadIdx = t.createBuffer()),
      t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, this.quadIdx),
      t.bufferData(t.ELEMENT_ARRAY_BUFFER, x, t.STATIC_DRAW),
      this.initStars(),
      (this.lineVao = t.createVertexArray()),
      (this.lineBuf = t.createBuffer()),
      (this.cloudGL = null),
      (this.cloudKey = ""),
      this.initModels(),
      this.initModels2(),
      (this.fx = new ShaderPack(this)));
  }
  fillTransparent(t, e, i) {
    for (let o = 0; o < i; o++)
      for (let i = 0; i < 2; i++)
        for (let i = 0; i < e; i++)
          for (let n = 0; n < e; n++) {
            const a = 4 * ((o * e + i) * e + n);
            if (0 !== t[a + 3]) continue;
            let r = 0,
              s = 0,
              l = 0,
              u = 0;
            for (const [a, c] of [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ]) {
              const h = n + a,
                m = i + c;
              if (h < 0 || m < 0 || h >= e || m >= e) continue;
              const _ = 4 * ((o * e + m) * e + h);
              (t[_ + 3] || t[_] || t[_ + 1] || t[_ + 2]) &&
                ((r += t[_]), (s += t[_ + 1]), (l += t[_ + 2]), u++);
            }
            u && ((t[a] = r / u), (t[a + 1] = s / u), (t[a + 2] = l / u));
          }
  }
  tex2D(t, e) {
    const i = this.gl,
      o = i.createTexture();
    return (
      (this.texEp = -1),
      i.bindTexture(i.TEXTURE_2D, o),
      i.texImage2D(i.TEXTURE_2D, 0, i.RGBA, i.RGBA, i.UNSIGNED_BYTE, t),
      i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MIN_FILTER, i.NEAREST),
      i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MAG_FILTER, i.NEAREST),
      i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_S, e ? i.REPEAT : i.CLAMP_TO_EDGE),
      i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_T, e ? i.REPEAT : i.CLAMP_TO_EDGE),
      o
    );
  }
  setupChunkAttribs() {
    const t = this.gl;
    (t.enableVertexAttribArray(0),
      t.vertexAttribPointer(0, 3, t.FLOAT, !1, VSTRIDE, 0),
      t.enableVertexAttribArray(1),
      t.vertexAttribPointer(1, 2, t.FLOAT, !1, VSTRIDE, 12),
      t.enableVertexAttribArray(2),
      t.vertexAttribIPointer(2, 2, t.UNSIGNED_SHORT, VSTRIDE, 20),
      t.enableVertexAttribArray(3),
      t.vertexAttribPointer(3, 4, t.UNSIGNED_BYTE, !0, VSTRIDE, 24),
      t.enableVertexAttribArray(4),
      t.vertexAttribPointer(4, 2, t.UNSIGNED_BYTE, !0, VSTRIDE, 28),
      t.enableVertexAttribArray(5),
      t.vertexAttribIPointer(5, 1, t.UNSIGNED_BYTE, VSTRIDE, 30));
  }
  setupSectionAttribs(t = 0) {
    const e = this.gl,
      i = SVSTRIDE;
    (e.enableVertexAttribArray(0),
      e.vertexAttribPointer(0, 4, e.UNSIGNED_SHORT, !0, i, t),
      e.enableVertexAttribArray(1),
      e.vertexAttribPointer(1, 2, e.HALF_FLOAT, !1, i, t + 8),
      e.enableVertexAttribArray(2),
      e.vertexAttribIPointer(2, 2, e.UNSIGNED_SHORT, i, t + 12),
      e.enableVertexAttribArray(3),
      e.vertexAttribPointer(3, 4, e.UNSIGNED_BYTE, !0, i, t + 16),
      e.enableVertexAttribArray(4),
      e.vertexAttribPointer(4, 2, e.UNSIGNED_BYTE, !0, i, t + 20),
      e.disableVertexAttribArray(5),
      e.vertexAttribI4ui(5, 0, 0, 0, 0));
  }
  makeSectionMesh(t) {
    const e = this.gl,
      i = (
        this.arena ||
        (this.arena = new VertexArena(e, (t) => {
          const i = e.createVertexArray();
          return (
            e.bindVertexArray(i),
            e.bindBuffer(e.ARRAY_BUFFER, t),
            this.setupSectionAttribs(0),
            e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, this.quadIdx),
            e.bindVertexArray(null),
            i
          );
        }))
      ).alloc(t.byteLength);
    return (
      e.bindBuffer(e.ARRAY_BUFFER, i.pg.buf),
      e.bufferSubData(e.ARRAY_BUFFER, i.off, t),
      this.meshVao &&
        (this.arena.onMove || (this.arena.onMove = (t) => this.pointMeshVao(t)),
        (i.vao = e.createVertexArray()),
        this.pointMeshVao(i)),
      { a: i }
    );
  }
  pointMeshVao(t) {
    const e = this.gl;
    (e.bindVertexArray(t.vao),
      e.bindBuffer(e.ARRAY_BUFFER, t.pg.buf),
      this.setupSectionAttribs(t.off),
      e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, this.quadIdx),
      e.bindVertexArray(null));
  }
  secDraw(t, e, i, o) {
    const n = this.gl,
      a = t.u.u_model,
      r = e.length;
    let s = null,
      l = 0;
    for (let t = 0; t < r; t++) {
      const u = e[o ? r - 1 - t : t],
        c = i ? u.o : u.t;
      if (!c) continue;
      const h = c.a,
        m = i ? u.n : u.tn;
      (n.uniformMatrix4fv(a, !1, u.m),
        h.vao
          ? (n.bindVertexArray(h.vao),
            (s = null),
            n.drawElements(n.TRIANGLES, 1.5 * m, n.UNSIGNED_INT, 0),
            (l += m / 2))
          : (h.pg !== s && ((s = h.pg), n.bindVertexArray(s.vao)),
            n.drawElements(n.TRIANGLES, 1.5 * m, n.UNSIGNED_INT, h.off / 4),
            (l += m / 2)));
    }
    return l;
  }
  makeVao(t) {
    const e = this.gl,
      i = e.createVertexArray();
    e.bindVertexArray(i);
    const o = e.createBuffer();
    return (
      e.bindBuffer(e.ARRAY_BUFFER, o),
      e.bufferData(e.ARRAY_BUFFER, t, e.STATIC_DRAW),
      this.setupChunkAttribs(),
      e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, this.quadIdx),
      e.bindVertexArray(null),
      { vao: i, buf: o }
    );
  }
  makeDynamic() {
    return { vao: null, buf: null };
  }
  uploadDynamic(t, e) {
    const i = this.gl;
    (t.vao
      ? (i.bindVertexArray(t.vao), i.bindBuffer(i.ARRAY_BUFFER, t.buf))
      : ((t.vao = i.createVertexArray()),
        i.bindVertexArray(t.vao),
        (t.buf = i.createBuffer()),
        i.bindBuffer(i.ARRAY_BUFFER, t.buf),
        this.setupChunkAttribs(),
        i.bindBuffer(i.ELEMENT_ARRAY_BUFFER, this.quadIdx)),
      i.bufferData(i.ARRAY_BUFFER, e.u8.subarray(0, e.n * VSTRIDE), i.DYNAMIC_DRAW),
      i.bindVertexArray(null));
  }
  meshToGL(t) {
    return (t.gl || ((t.gl = this.makeVao(t.u8.subarray(0, t.n * VSTRIDE))), (t.gl.n = t.n)), t.gl);
  }
  setSection(t, e, i, o, n) {
    this.gl;
    const a = this.sections.get(t);
    if ((a && this.freeSection(a), !n.opaque && !n.trans)) return void this.sections.delete(t);
    const r = { x: 16 * e, y: 16 * i, z: 16 * o, n: n.nOpaque, tn: n.nTrans },
      s = 65535 / SV_SCALE;
    ((r.m = new Float32Array([s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, r.x - 8, r.y - 8, r.z - 8, 1])),
      n.opaque && (r.o = this.makeSectionMesh(n.opaque)),
      n.trans && (r.t = this.makeSectionMesh(n.trans)),
      this.sections.set(t, r),
      (this.cullDirty = !0),
      Math.abs(r.x + 8 - this.camPos[0]) < 240 &&
        Math.abs(r.z + 8 - this.camPos[2]) < 240 &&
        (this.shadowDirty = !0),
      (this.col(e, o).s[i] = r),
      this.cullList && this.cullSeenAt(e, i, o) && this.cullList.push(r));
  }
  setSectionVis(t, e) {
    void 0 === e || e === VIS_ALL ? this.secVis.delete(t) : this.secVis.set(t, e);
    const i = Math.floor(t / 32);
    ((this.col(Math.floor(i / 65536) - 32768, (i % 65536) - 32768).v[t - 32 * i] =
      void 0 === e ? VIS_ALL : e),
      (this.cullDirty = !0));
  }
  clearSections() {
    for (const t of this.sections.values()) this.freeSection(t);
    (this.sections.clear(),
      this.secVis.clear(),
      this.cols.clear(),
      (this.cullDirty = !0),
      (this.shadowDirty = !0));
  }
  col(t, e) {
    const i = ckey(t, e);
    let o = this.cols.get(i);
    return (
      o ||
        ((o = { s: new Array(SECTIONS).fill(null), v: new Uint16Array(SECTIONS).fill(VIS_ALL) }),
        this.cols.set(i, o)),
      o
    );
  }
  freeSection(t) {
    t.dead = !0;
    const e = this.cols.get(ckey(t.x >> 4, t.z >> 4));
    (e && e.s[t.y >> 4] === t && (e.s[t.y >> 4] = null),
      t.o && (this.arena.free(t.o.a), t.o.a.vao && this.gl.deleteVertexArray(t.o.a.vao)),
      t.t && (this.arena.free(t.t.a), t.t.a.vao && this.gl.deleteVertexArray(t.t.a.vao)));
  }
  dropChunk(t, e) {
    for (let i = 0; i < SECTIONS; i++) {
      const o = 32 * ckey(t, e) + i,
        n = this.sections.get(o);
      (n && (this.freeSection(n), this.sections.delete(o)), this.secVis.delete(o));
    }
    (this.cols.delete(ckey(t, e)), (this.cullDirty = !0));
  }
  updateCulling() {
    const t = this.camPos,
      e = this.renderDist,
      i = performance.now(),
      o = Math.floor(t[0]) >> 4,
      n = Math.floor(t[1]) >> 4,
      a = Math.floor(t[2]) >> 4;
    if (this.noCull || n < 0 || n >= SECTIONS)
      return ((this.cullKey = null), (this.cullList = null));
    const r = 1e6 * o + 1e3 * n + a + 1e12 * e;
    if (r === this.cullKey && (!this.cullDirty || i - this.cullT < 100)) return this.cullList;
    ((this.cullKey = r), (this.cullT = i), (this.cullDirty = !1));
    const s = e + 2,
      l = 2 * s + 1,
      u = l * l * SECTIONS;
    let c = this.cullGrid;
    !c || c.length < u ? (c = this.cullGrid = new Uint8Array(u)) : c.fill(0, 0, u);
    const h =
      this.cullCols && this.cullCols.length >= l * l
        ? this.cullCols
        : (this.cullCols = new Array(l * l));
    (h.fill(void 0, 0, l * l), (this.cullCenter = [o, a, s, l]));
    const m = [],
      _ =
        this.cullQ ||
        (this.cullQ = {
          x: new Int32Array(65536),
          y: new Int8Array(65536),
          z: new Int32Array(65536),
          f: new Int8Array(65536),
          d: new Uint8Array(65536),
        }),
      d = (e + 1) * (e + 1);
    let v = 0,
      p = 0;
    const push = (t, e, i, o, n) => {
      if (p >= _.x.length)
        for (const t of ["x", "y", "z", "f", "d"]) {
          const e = new _[t].constructor(2 * _[t].length);
          (e.set(_[t]), (_[t] = e));
        }
      ((_.x[p] = t), (_.y[p] = e), (_.z[p] = i), (_.f[p] = o), (_.d[p] = n), p++);
    };
    for (c[(s * l + s) * SECTIONS + n] = 1, push(o, n, a, -1, 0); v < p;) {
      const t = _.x[v],
        e = _.y[v],
        i = _.z[v],
        n = _.f[v],
        r = _.d[v];
      v++;
      const u = (t - o + s) * l + (i - a + s);
      let p = h[u];
      void 0 === p && (p = h[u] = this.cols.get(ckey(t, i)) || null);
      let g = VIS_ALL;
      if (p) {
        const t = p.s[e];
        (t && m.push(t), (g = p.v[e]));
      }
      for (let u = 0; u < 6; u++) {
        if (r & (1 << (1 ^ u))) continue;
        if (n >= 0 && !(g & (1 << VIS_PAIR[6 * n + u]))) continue;
        const h = t + (0 === u ? -1 : 1 === u ? 1 : 0),
          m = e + (2 === u ? -1 : 3 === u ? 1 : 0),
          _ = i + (4 === u ? -1 : 5 === u ? 1 : 0);
        if (m < 0 || m >= SECTIONS || (h - o) * (h - o) + (_ - a) * (_ - a) > d) continue;
        const v = ((h - o + s) * l + (_ - a + s)) * SECTIONS + m;
        c[v] || ((c[v] = 1), push(h, m, _, 1 ^ u, r | (1 << u)));
      }
    }
    return (this.cullList = m);
  }
  cullSeenAt(t, e, i) {
    const o = this.cullCenter;
    if (!o) return !1;
    const n = t - o[0] + o[2],
      a = i - o[1] + o[2];
    return (
      n >= 0 && a >= 0 && n < o[3] && a < o[3] && !!this.cullGrid[(n * o[3] + a) * SECTIONS + e]
    );
  }
  resize() {
    const t = Math.min(window.devicePixelRatio || 1, 2);
    let e = Math.floor(window.innerWidth * t * this.resScale),
      i = Math.floor(window.innerHeight * t * this.resScale);
    (this.forceSize && ([e, i] = this.forceSize),
      (e = Math.max(1, e)),
      (i = Math.max(1, i)),
      (this.canvas.width === e && this.canvas.height === i) ||
        ((this.canvas.width = e), (this.canvas.height = i)));
  }
  onContextLost() {
    if (this.lost) return;
    this.lost = !0;
    const t = "undefined" != typeof window ? window.game : null;
    try {
      "undefined" != typeof Telemetry && Telemetry.count && Telemetry.count("gl:lost");
    } catch (t) {}
    try {
      !t ||
        "play" !== t.state ||
        t.net ||
        !t.ui ||
        (t.ui.screen && t.ui.screen.pauses) ||
        "undefined" == typeof PauseScreen ||
        t.ui.open(new PauseScreen(t));
    } catch (t) {}
    try {
      t && t.releasePointer && t.releasePointer();
    } catch (t) {}
    const e = !(!t || "play" !== t.state),
      i = !(!t || !t.net),
      o = performance.now();
    let n = Promise.resolve();
    try {
      e && !i && t.saveWorld && (n = Promise.resolve(t.saveWorld(!0)));
    } catch (t) {
      n = Promise.reject(t);
    }
    this.lostSave = n = n.then(
      () =>
        !(
          t &&
          t.ui &&
          t.ui.chat &&
          t.ui.chat.some((t) => t.t >= o && String(t.text).startsWith("保存失败"))
        ),
      () => !1,
    );
    try {
      this.lostNotice(t, e, i, n);
    } catch (t) {}
  }
  lostFrame(t) {
    if ("play" === t.state && !t.net && t.ui && !t.ui.screen && "undefined" != typeof PauseScreen)
      try {
        t.ui.open(new PauseScreen(t));
      } catch (t) {}
  }
  onContextRestored() {
    try {
      "undefined" != typeof Telemetry &&
        Telemetry.count &&
        (Telemetry.count("gl:restored"), Telemetry.event("contextrestored", {}));
    } catch (t) {}
    if (this.lostEl) {
      const t = this.lostEl.querySelector("[data-k=gpu]");
      t && (t.textContent = "显卡已经恢复，重新加载就能继续玩");
    }
  }
  lostNotice(t, e, i, o) {
    if (this.lostEl || "undefined" == typeof document) return;
    const n = (this.lostEl = document.createElement("div"));
    n.style.cssText =
      'position:absolute;left:0;top:0;width:100%;height:100%;z-index:50;box-sizing:border-box;padding:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.88);color:#fff;font:16px "Microsoft YaHei",sans-serif;text-align:center;line-height:1.6;cursor:pointer;touch-action:manipulation;-webkit-user-select:none;user-select:none';
    const line = (t, e, i) => {
      const o = document.createElement("div");
      return (
        (o.textContent = t),
        e && (o.style.cssText = e),
        i && (o.dataset.k = i),
        n.appendChild(o),
        o
      );
    };
    (line("画面中断了", "font-size:22px;font-weight:bold;margin-bottom:6px"),
      line("显卡把游戏画面收回了（切到后台、显存不够或显卡驱动重启时会这样）", null, "gpu"));
    const a = line(
      i ? "联机房间：重新加载后再进入房间" : e ? "正在保存世界…" : "",
      "color:#FFFF55",
    );
    e &&
      !i &&
      o.then((t) => {
        ((a.textContent = t ? "世界已保存" : "保存失败：会回到最近一次自动保存"),
          (a.style.color = t ? "#55FF55" : "#FF5555"));
      });
    const r = line(
      "点这里重新加载",
      "margin-top:14px;padding:10px 28px;border:2px solid #fff;background:rgba(255,255,255,0.12)",
    );
    t &&
      t.settings &&
      t.settings.shaders > 0 &&
      line(
        "经常出现的话，可以在 选项 → 视频设置 → 光影 调低或关闭",
        "margin-top:12px;font-size:13px;color:#C0C0C0",
      );
    const reload = () => {
      try {
        "undefined" != typeof Telemetry &&
          Telemetry.count &&
          (Telemetry.count("gl:reload"), Telemetry.flush(!1));
      } catch (t) {}
      (t && (t.state = "boot"), location.reload());
    };
    n.addEventListener("pointerup", (t) => {
      if ((t.preventDefault(), t.stopPropagation(), n.dataset.going)) return;
      ((n.dataset.going = "1"), (r.textContent = "正在重新加载…"));
      const e = setTimeout(reload, 4e3);
      o.then(() => {
        (clearTimeout(e), reload());
      });
    });
    for (const t of ["touchstart", "touchmove", "touchend", "pointerdown", "mousedown", "wheel"])
      n.addEventListener(t, (t) => t.stopPropagation(), { passive: !0 });
    (document.getElementById("stage") || document.body).appendChild(n);
  }
  initStars() {
    const t = this.gl,
      e = RNG(10842),
      i = [];
    for (let t = 0; t < 1500; t++) {
      let t = 2 * e() - 1,
        o = 2 * e() - 1,
        n = 2 * e() - 1;
      const a = Math.hypot(t, o, n);
      if (a > 1 || a < 0.01) continue;
      ((t /= a), (o /= a), (n /= a));
      const r = 0.5 + 0.5 * e();
      i.push(100 * t, 100 * o, 100 * n, r, r, r, 1);
    }
    ((this.starCount = i.length / 7),
      (this.starVao = t.createVertexArray()),
      t.bindVertexArray(this.starVao));
    const o = t.createBuffer();
    (t.bindBuffer(t.ARRAY_BUFFER, o),
      t.bufferData(t.ARRAY_BUFFER, new Float32Array(i), t.STATIC_DRAW),
      t.enableVertexAttribArray(0),
      t.vertexAttribPointer(0, 3, t.FLOAT, !1, 28, 0),
      t.enableVertexAttribArray(1),
      t.vertexAttribPointer(1, 4, t.FLOAT, !1, 28, 12),
      t.bindVertexArray(null),
      (this.quadVao = t.createVertexArray()),
      t.bindVertexArray(this.quadVao));
    const n = t.createBuffer();
    (t.bindBuffer(t.ARRAY_BUFFER, n),
      t.bufferData(
        t.ARRAY_BUFFER,
        new Float32Array([-1, 0, -1, 0, 0, 1, 0, -1, 1, 0, 1, 0, 1, 1, 1, -1, 0, 1, 0, 1]),
        t.STATIC_DRAW,
      ),
      t.enableVertexAttribArray(0),
      t.vertexAttribPointer(0, 3, t.FLOAT, !1, 20, 0),
      t.enableVertexAttribArray(1),
      t.vertexAttribPointer(1, 2, t.FLOAT, !1, 20, 12),
      t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, this.quadIdx),
      t.bindVertexArray(null));
  }
  cloudRange() {
    const t = "undefined" != typeof window ? window.game : null;
    return self.POTATO && t && t.worldMeta && t.worldMeta.sky
      ? 160
      : Math.max(256, 16 * this.renderDist * 2 + 64);
  }
  buildClouds(t, e, i) {
    const o = 12,
      n = Math.ceil(this.cloudRange() / o) + 2,
      a = Math.floor((t + i) / o),
      r = Math.floor(e / o),
      s = a + "," + r + "," + n;
    if (s === this.cloudKey) return;
    this.cloudKey = s;
    const l = this.cloudMap,
      at = (t, e) => l[256 * mod(e, 256) + mod(t, 256)],
      u = [],
      push = (t, e, i, o) => u.push(t, e, i, o, o, o, 1);
    for (let t = r - n; t <= r + n; t++)
      for (let e = a - n; e <= a + n; e++) {
        if (!at(e, t) || (e - a) * (e - a) + (t - r) * (t - r) > n * n) continue;
        const i = e * o,
          s = i + o,
          l = t * o,
          u = l + o;
        (push(i, 4, l, 1),
          push(i, 4, u, 1),
          push(s, 4, u, 1),
          push(s, 4, l, 1),
          push(i, 0, l, 0.7),
          push(s, 0, l, 0.7),
          push(s, 0, u, 0.7),
          push(i, 0, u, 0.7),
          at(e - 1, t) ||
            (push(i, 0, l, 0.85), push(i, 0, u, 0.85), push(i, 4, u, 0.85), push(i, 4, l, 0.85)),
          at(e + 1, t) ||
            (push(s, 0, u, 0.85), push(s, 0, l, 0.85), push(s, 4, l, 0.85), push(s, 4, u, 0.85)),
          at(e, t - 1) ||
            (push(s, 0, l, 0.8), push(i, 0, l, 0.8), push(i, 4, l, 0.8), push(s, 4, l, 0.8)),
          at(e, t + 1) ||
            (push(i, 0, u, 0.8), push(s, 0, u, 0.8), push(s, 4, u, 0.8), push(i, 4, u, 0.8)));
      }
    const c = this.gl;
    if (!this.cloudGL) {
      const t = c.createVertexArray();
      c.bindVertexArray(t);
      const e = c.createBuffer();
      (c.bindBuffer(c.ARRAY_BUFFER, e),
        c.enableVertexAttribArray(0),
        c.vertexAttribPointer(0, 3, c.FLOAT, !1, 28, 0),
        c.enableVertexAttribArray(1),
        c.vertexAttribPointer(1, 4, c.FLOAT, !1, 28, 12),
        c.bindBuffer(c.ELEMENT_ARRAY_BUFFER, this.quadIdx),
        c.bindVertexArray(null),
        (this.cloudGL = { vao: t, buf: e, n: 0 }));
    }
    (c.bindBuffer(c.ARRAY_BUFFER, this.cloudGL.buf),
      c.bufferData(c.ARRAY_BUFFER, new Float32Array(u), c.DYNAMIC_DRAW),
      (this.cloudGL.n = u.length / 7));
  }
  boxGeom(t, e, i, o, n, a, r, s, l, u, c, h, m) {
    const _ = o - u,
      d = n - u,
      v = a - u,
      p = o + r + u,
      g = n + s + u,
      E = a + l + u,
      x = [
        [
          [p, d, v],
          [_, d, v],
          [_, g, v],
          [p, g, v],
          e + l,
          e + l + r,
          i + l + s,
          i + l,
          [0, 0, -1],
        ],
        [
          [_, d, E],
          [p, d, E],
          [p, g, E],
          [_, g, E],
          e + 2 * l + r,
          e + 2 * l + 2 * r,
          i + l + s,
          i + l,
          [0, 0, 1],
        ],
        [[p, d, E], [p, d, v], [p, g, v], [p, g, E], e, e + l, i + l + s, i + l, [1, 0, 0]],
        [
          [_, d, v],
          [_, d, E],
          [_, g, E],
          [_, g, v],
          e + l + r,
          e + 2 * l + r,
          i + l + s,
          i + l,
          [-1, 0, 0],
        ],
        [[p, g, v], [_, g, v], [_, g, E], [p, g, E], e + l, e + l + r, i + l, i, [0, 1, 0]],
        [
          [p, d, E],
          [_, d, E],
          [_, d, v],
          [p, d, v],
          e + l + r,
          e + l + 2 * r,
          i + l,
          i,
          [0, -1, 0],
        ],
      ];
    for (const e of x) {
      const i = e[4],
        o = e[5],
        n = [
          [i, e[6]],
          [o, e[6]],
          [o, e[7]],
          [i, e[7]],
        ];
      for (const i of m ? [0, 3, 2, 1] : [0, 1, 2, 3]) {
        const o = e[i],
          a = m ? _ + p - o[0] : o[0];
        t.push(
          a / 16,
          o[1] / 16,
          o[2] / 16,
          n[i][0] / c,
          n[i][1] / h,
          m ? -e[8][0] : e[8][0],
          e[8][1],
          e[8][2],
        );
      }
    }
  }
  makeModelPart(t, e, i, o) {
    const n = [];
    for (const o of t)
      this.boxGeom(n, o[0], o[1], o[2], o[3], o[4], o[5], o[6], o[7], o[8] || 0, e, i, o[9]);
    return (o && o(n), { vao: this.modelVao(n), n: n.length / 8 });
  }
  packParts(t, e, i) {
    const o = [],
      n = [];
    for (const a of t) {
      const t = o.length / 8;
      for (const t of a.boxes)
        this.boxGeom(o, t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8] || 0, e, i, t[9]);
      n.push(t);
    }
    const a = this.modelVao(o);
    return (
      t.forEach((e, i) => {
        const r = i + 1 < t.length ? n[i + 1] : o.length / 8;
        e.mesh = { vao: a, n: r - n[i], off: (n[i] / 4) * 24 };
      }),
      t
    );
  }
  modelVao(t) {
    const e = this.gl,
      i = e.createVertexArray();
    e.bindVertexArray(i);
    const o = e.createBuffer();
    return (
      e.bindBuffer(e.ARRAY_BUFFER, o),
      e.bufferData(e.ARRAY_BUFFER, new Float32Array(t), e.STATIC_DRAW),
      e.enableVertexAttribArray(0),
      e.vertexAttribPointer(0, 3, e.FLOAT, !1, 32, 0),
      e.enableVertexAttribArray(1),
      e.vertexAttribPointer(1, 2, e.FLOAT, !1, 32, 12),
      e.enableVertexAttribArray(2),
      e.vertexAttribPointer(2, 3, e.FLOAT, !1, 32, 20),
      e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, this.quadIdx),
      e.bindVertexArray(null),
      i
    );
  }
  initModels() {
    const t = (this.models = {}),
      P = (t, e, i) => ({ parts: this.packParts(i, t, e) }),
      e = -Math.PI / 2,
      humanoid = (t, e, i, o, n, a, r) => [
        {
          name: "head",
          pivot: [0, 24, 0],
          boxes: [[0, 0, -4, 0, -4, 8, 8, 8], ...(r ? [[32, 0, -4, 0, -4, 8, 8, 8, 0.5]] : [])],
        },
        { name: "body", pivot: [0, 12, 0], boxes: [[16, 16, -4, 0, -2, 8, 12, 4]] },
        {
          name: "rarm",
          pivot: [4 + t / 2, 22, 0],
          boxes: [[40, 16, -t / 2, -10, -t / 2, t, 12, t]],
        },
        {
          name: "larm",
          pivot: [-4 - t / 2, 22, 0],
          boxes: [[e, i, -t / 2, -10, -t / 2, t, 12, t, 0, a]],
        },
        { name: "rleg", pivot: [2, 12, 0], boxes: [[0, 16, -t / 2, -12, -t / 2, t, 12, t]] },
        { name: "lleg", pivot: [-2, 12, 0], boxes: [[o, n, -t / 2, -12, -t / 2, t, 12, t, 0, a]] },
      ];
    ((t.zombie = P(64, 64, humanoid(4, 40, 16, 0, 16, !0, !0))),
      (t.steve = P(
        64,
        64,
        humanoid(4, 32, 48, 16, 48, !1, !0).map((t) => {
          const e = {
            body: [16, 32],
            rarm: [40, 32],
            larm: [48, 48],
            rleg: [0, 32],
            lleg: [0, 48],
          }[t.name];
          return e
            ? { ...t, boxes: [...t.boxes, [e[0], e[1], ...t.boxes[0].slice(2, 8), 0.25]] }
            : t;
        }),
      )),
      (t.skeleton = P(64, 32, humanoid(2, 40, 16, 0, 16, !0, !1))),
      (t.creeper = P(64, 32, [
        { name: "head", pivot: [0, 18, 0], boxes: [[0, 0, -4, 0, -4, 8, 8, 8]] },
        { name: "body", pivot: [0, 6, 0], boxes: [[16, 16, -4, 0, -2, 8, 12, 4]] },
        { name: "leg0", pivot: [2, 6, 4], boxes: [[0, 16, -2, -6, -2, 4, 6, 4]] },
        { name: "leg1", pivot: [-2, 6, 4], boxes: [[0, 16, -2, -6, -2, 4, 6, 4]] },
        { name: "leg2", pivot: [2, 6, -4], boxes: [[0, 16, -2, -6, -2, 4, 6, 4]] },
        { name: "leg3", pivot: [-2, 6, -4], boxes: [[0, 16, -2, -6, -2, 4, 6, 4]] },
      ])));
    const legs4 = (t, e, i, o, n) => [
      { name: "leg0", pivot: [o, t, e], boxes: [[0, 16, -2, -n, -2, 4, n, 4]] },
      { name: "leg1", pivot: [-o, t, e], boxes: [[0, 16, -2, -n, -2, 4, n, 4]] },
      { name: "leg2", pivot: [o, t, i], boxes: [[0, 16, -2, -n, -2, 4, n, 4]] },
      { name: "leg3", pivot: [-o, t, i], boxes: [[0, 16, -2, -n, -2, 4, n, 4]] },
    ];
    ((t.pig = P(64, 64, [
      {
        name: "head",
        pivot: [0, 12, -6],
        boxes: [
          [0, 0, -4, -4, -8, 8, 8, 8],
          [16, 16, -2, -3, -9, 4, 3, 1],
        ],
      },
      { name: "body", pivot: [0, 10, 0], boxes: [[28, 8, -5, -8, -4, 10, 16, 8]], rotX: e },
      ...legs4(6, 7, -5, 3, 6),
    ])),
      (t.cow = P(64, 64, [
        {
          name: "head",
          pivot: [0, 20, -8],
          boxes: [
            [0, 0, -4, -4, -6, 8, 8, 6],
            [1, 33, -3, -4, -7, 6, 3, 1],
            [22, 0, 4, 2, -5, 1, 3, 1],
            [22, 0, -5, 2, -5, 1, 3, 1],
          ],
        },
        {
          name: "body",
          pivot: [0, 17, 1],
          boxes: [
            [18, 4, -6, -9, -5, 12, 18, 10],
            [52, 0, -2, -9, -6, 4, 6, 1],
          ],
          rotX: e,
        },
        ...legs4(12, 7, -5, 4, 12),
      ])),
      (t.sheep = P(64, 32, [
        { name: "head", pivot: [0, 18, -8], boxes: [[0, 0, -3, -2, -6, 6, 6, 8]] },
        { name: "body", pivot: [0, 15, 0], boxes: [[28, 8, -4, -8, -3, 8, 16, 6]], rotX: e },
        ...legs4(12, 7, -5, 3, 12),
      ])),
      (t.sheep_wool = P(64, 32, [
        { name: "head", pivot: [0, 18, -8], boxes: [[0, 0, -3, -2, -4, 6, 6, 6, 0.6]] },
        { name: "body", pivot: [0, 15, 0], boxes: [[28, 8, -4, -8, -3, 8, 16, 6, 1.75]], rotX: e },
        { name: "leg0", pivot: [3, 12, 7], boxes: [[0, 16, -2, -6, -2, 4, 6, 4, 0.5]] },
        { name: "leg1", pivot: [-3, 12, 7], boxes: [[0, 16, -2, -6, -2, 4, 6, 4, 0.5]] },
        { name: "leg2", pivot: [3, 12, -5], boxes: [[0, 16, -2, -6, -2, 4, 6, 4, 0.5]] },
        { name: "leg3", pivot: [-3, 12, -5], boxes: [[0, 16, -2, -6, -2, 4, 6, 4, 0.5]] },
      ])),
      (t.chicken = P(64, 32, [
        {
          name: "head",
          pivot: [0, 9, -4],
          boxes: [
            [0, 0, -2, 0, -2, 4, 6, 3],
            [14, 0, -2, 2, -4, 4, 2, 2],
            [14, 4, -1, 0, -3, 2, 2, 2],
          ],
        },
        { name: "body", pivot: [0, 8, 0], boxes: [[0, 9, -3, -4, -3, 6, 8, 6]], rotX: e },
        { name: "leg0", pivot: [1.5, 5, 1], boxes: [[26, 0, -1.5, -5, -3, 3, 5, 3]] },
        { name: "leg1", pivot: [-1.5, 5, 1], boxes: [[26, 0, -1.5, -5, -3, 3, 5, 3]] },
        { name: "wing0", pivot: [4, 11, 0], boxes: [[24, 13, -1, -4, -3, 1, 4, 6]] },
        { name: "wing1", pivot: [-4, 11, 0], boxes: [[24, 13, 0, -4, -3, 1, 4, 6]] },
      ])));
    const i = [];
    for (let t = 0; t < 8; t++) {
      const e = t % 2 == 0,
        o = t >> 1;
      i.push({
        name: "leg" + t,
        pivot: [e ? 4 : -4, 9, -1 + o],
        boxes: [[18, 0, e ? -1 : -15, -1, -1, 16, 2, 2]],
      });
    }
    ((t.spider = P(64, 32, [
      { name: "head", pivot: [0, 9, -3], boxes: [[32, 4, -4, -4, -8, 8, 8, 8]] },
      { name: "neck", pivot: [0, 9, 0], boxes: [[0, 0, -3, -3, -3, 6, 6, 6]] },
      { name: "body", pivot: [0, 9, 9], boxes: [[0, 12, -5, -4, -6, 10, 8, 12]] },
      ...i,
    ])),
      (t.arm = P(64, 64, [
        {
          name: "arm",
          pivot: [0, 0, 0],
          boxes: [
            [40, 16, -2, -10, -2, 4, 12, 4],
            [40, 32, -2, -10, -2, 4, 12, 4, 0.25],
          ],
        },
      ])),
      (t.arm_left = P(64, 64, [
        {
          name: "arm",
          pivot: [0, 0, 0],
          boxes: [
            [32, 48, -2, -10, -2, 4, 12, 4],
            [48, 48, -2, -10, -2, 4, 12, 4, 0.25],
          ],
        },
      ])));
    const armour = (t) => [
      { name: "head", pivot: [0, 24, 0], boxes: [[0, 0, -4, 0, -4, 8, 8, 8, t]] },
      { name: "body", pivot: [0, 12, 0], boxes: [[16, 16, -4, 0, -2, 8, 12, 4, t]] },
      { name: "rarm", pivot: [6, 22, 0], boxes: [[40, 16, -2, -10, -2, 4, 12, 4, t]] },
      { name: "larm", pivot: [-6, 22, 0], boxes: [[40, 16, -2, -10, -2, 4, 12, 4, t, !0]] },
      { name: "rleg", pivot: [2, 12, 0], boxes: [[0, 16, -2, -12, -2, 4, 12, 4, t]] },
      { name: "lleg", pivot: [-2, 12, 0], boxes: [[0, 16, -2, -12, -2, 4, 12, 4, t, !0]] },
    ];
    ((t.armor_outer = P(64, 32, armour(1))), (t.armor_inner = P(64, 32, armour(0.5))));
  }
  texSelfTest(t, e) {
    const i = this.gl,
      o = t > 2048 ? 2048 : 0,
      opaque = (t, i) => {
        const o = [];
        for (let n = t; n < i && o.length < 3; n++) {
          let t = !0;
          for (let i = 256 * n; i < 256 * (n + 1); i += 17)
            if (e[4 * i + 3] < 255) {
              t = !1;
              break;
            }
          t && o.push(n);
        }
        return o;
      },
      n = [...opaque(1, o || t), ...(o ? opaque(o, t) : [])];
    if (!n.length) return;
    const a = compile(
        i,
        "#version 300 es\nvoid main(){ gl_Position = vec4(vec2(gl_VertexID & 1, gl_VertexID >> 1) * 4.0 - 1.0, 0.0, 1.0); }",
        "#version 300 es\nprecision highp float; precision highp sampler2DArray;\nuniform sampler2DArray u_tex;\nuniform uint u_l; out vec4 o;\nvoid main(){ vec2 v_uv = vec2(0.53, 0.53); o = texture(u_tex, vec3(v_uv, float(u_l))); }",
      ),
      r = i.createFramebuffer(),
      s = i.createTexture();
    (i.bindTexture(i.TEXTURE_2D, s),
      i.texStorage2D(i.TEXTURE_2D, 1, i.RGBA8, 1, 1),
      i.bindFramebuffer(i.FRAMEBUFFER, r),
      i.framebufferTexture2D(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0, i.TEXTURE_2D, s, 0),
      i.viewport(0, 0, 1, 1),
      i.useProgram(a.p),
      i.disable(i.DEPTH_TEST),
      i.disable(i.BLEND),
      i.activeTexture(i.TEXTURE0),
      i.bindTexture(i.TEXTURE_2D_ARRAY, this.texArray),
      i.uniform1i(a.u.u_tex, 0),
      i.bindVertexArray(null));
    const l = new Uint8Array(4),
      u = [];
    for (const t of n) {
      (i.uniform1ui(a.u.u_l, t),
        i.clearColor(1, 0, 1, 1),
        i.clear(i.COLOR_BUFFER_BIT),
        i.drawArrays(i.TRIANGLES, 0, 3),
        i.readPixels(0, 0, 1, 1, i.RGBA, i.UNSIGNED_BYTE, l));
      const n = 4 * (256 * t + 128 + 8),
        r = Math.abs(l[0] - e[n]) + Math.abs(l[1] - e[n + 1]) + Math.abs(l[2] - e[n + 2]);
      u.push({ second: !!o && t >= o, ok: r < 24, black: l[0] + l[1] + l[2] < 12 });
    }
    (i.bindFramebuffer(i.FRAMEBUFFER, null),
      i.deleteFramebuffer(r),
      i.deleteTexture(s),
      i.deleteProgram(a.p),
      i.enable(i.DEPTH_TEST));
    const c = u.filter((t) => !t.second),
      h = u.filter((t) => t.second);
    this.texTest = {
      first: c.every((t) => t.ok),
      second: h.length ? h.every((t) => t.ok) : null,
      black2: h.some((t) => t.black),
    };
    const report = () => {
      if ("undefined" == typeof Telemetry || !Telemetry.count) return setTimeout(report, 3e3);
      (Telemetry.count("tex1_" + (this.texTest.first ? "ok" : "bad")),
        null !== this.texTest.second &&
          Telemetry.count(
            "tex2_" + (this.texTest.second ? "ok" : this.texTest.black2 ? "black" : "bad"),
          ));
    };
    setTimeout(report, 3e3);
  }
  lightmapTex() {
    if (!this._lm) {
      const t = this.gl;
      ((this._lm = t.createTexture()),
        (this._lmData = new Uint8Array(1024).fill(255)),
        t.bindTexture(t.TEXTURE_2D, this._lm),
        t.texImage2D(t.TEXTURE_2D, 0, t.RGBA8, 16, 16, 0, t.RGBA, t.UNSIGNED_BYTE, this._lmData),
        t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.LINEAR),
        t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.LINEAR),
        t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE),
        t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE));
    }
    return this._lm;
  }
  updateLightmap(t, e) {
    const i = this.gl,
      o = this.lightmapTex(),
      n = this._lmData,
      a = this.gamma,
      r = t.nightVision > 0 ? t.nightVision : 0,
      s = "nether" === e ? 0.1 : 0,
      l = "end" === e;
    let u = 1;
    if ("overworld" === e && void 0 !== t.celestial) {
      let e = 1 - (2 * Math.cos(t.celestial * Math.PI * 2) + 0.2);
      ((e = 1 - clamp(e, 0, 1)), (e *= 1 - (5 * (t.rain || 0)) / 16), (u = 0.8 * e + 0.2));
    }
    const c = Math.floor(performance.now() / 50);
    c !== this._lmTick &&
      ((this._lmTick = c),
      (this.flicker =
        0.9 *
        ((this.flicker || 0) +
          (Math.random() - Math.random()) * Math.random() * Math.random() * 0.1)));
    const h = this._lmIn || (this._lmIn = { skyD: NaN, fl: NaN, gamma: NaN, nv: NaN, dim: null });
    if (h.skyD === u && h.fl === this.flicker && h.gamma === a && h.nv === r && h.dim === e) return;
    ((h.skyD = u), (h.fl = this.flicker), (h.gamma = a), (h.nv = r), (h.dim = e));
    const m = 0.95 * u + 0.05,
      _ = u + 0.35 * (1 - u),
      d = this.flicker + 1.5,
      v = this._lmS || (this._lmS = new Float64Array(16)),
      p = this._lmB || (this._lmB = new Float64Array(16));
    for (let t = 0; t < 16; t++) {
      const e = t / 15,
        i = e / (4 - 3 * e),
        o = i + s * (1 - i);
      ((v[t] = o * m), (p[t] = o * d));
    }
    for (let t = 0; t < 16; t++) {
      const e = v[t];
      for (let i = 0; i < 16; i++) {
        const o = p[i];
        let s = o,
          u = o * (0.6 * (0.6 * o + 0.4) + 0.4),
          c = o * (o * o * 0.6 + 0.4);
        if (
          (l
            ? ((s = clamp(s + 0.25 * (0.99 - s), 0, 1)),
              (u = clamp(u + 0.25 * (1.12 - u), 0, 1)),
              (c = clamp(c + 0.25 * (1 - c), 0, 1)))
            : ((s += _ * e),
              (s += 0.04 * (0.75 - s)),
              (u += _ * e),
              (u += 0.04 * (0.75 - u)),
              (c += e),
              (c += 0.04 * (0.75 - c))),
          (s = clamp(s, 0, 1)),
          (u = clamp(u, 0, 1)),
          (c = clamp(c, 0, 1)),
          r > 0)
        ) {
          const t = Math.max(s, u, c);
          t > 0 && ((s += (s / t - s) * r), (u += (u / t - u) * r), (c += (c / t - c) * r));
        }
        ((s += (1 - Math.pow(1 - s, 4) - s) * a),
          (u += (1 - Math.pow(1 - u, 4) - u) * a),
          (c += (1 - Math.pow(1 - c, 4) - c) * a),
          (s = clamp(s + 0.04 * (0.75 - s), 0, 1)),
          (u = clamp(u + 0.04 * (0.75 - u), 0, 1)),
          (c = clamp(c + 0.04 * (0.75 - c), 0, 1)));
        const h = 4 * (16 * t + i);
        ((n[h] = 255 * s), (n[h + 1] = 255 * u), (n[h + 2] = 255 * c), (n[h + 3] = 255));
      }
    }
    (i.activeTexture(i.TEXTURE8),
      i.bindTexture(i.TEXTURE_2D, o),
      i.texSubImage2D(i.TEXTURE_2D, 0, 0, 0, 16, 16, i.RGBA, i.UNSIGNED_BYTE, n),
      i.activeTexture(i.TEXTURE0));
  }
  setCamera(t, e, i, o, n) {
    const a = this.canvas.width,
      r = this.canvas.height;
    ((this.frameTime = performance.now() % 1e7),
      (this.near = 0.05),
      (this.far = Math.max(256, 16 * this.renderDist * 1.6 + 64, this.cloudRange() + 160)),
      M4.perspective(this.proj, (o * Math.PI) / 180, a / r, this.near, this.far));
    const s = M4.identity(this.view);
    (n && n(s),
      M4.rotX(s, -i),
      M4.rotY(s, -e),
      M4.translate(s, -t[0], -t[1], -t[2]),
      M4.mul(this.vp, this.proj, s),
      (this.camPos = t),
      (this.planes = frustumPlanes(this.vp)),
      this.ufEpoch++,
      (this.matI = 0),
      (this.shOn = !1),
      (this.shN = 0));
  }
  ufState(t) {
    let e = t.st;
    return (
      (e && e.ep === this.ufEpoch) ||
        (e = t.st =
          {
            ep: this.ufEpoch,
            vp: null,
            cx: NaN,
            cy: NaN,
            cz: NaN,
            tick: NaN,
            day: NaN,
            f0: NaN,
            f1: NaN,
            f2: NaN,
            fn: NaN,
            ff: NaN,
            gam: NaN,
            n0: NaN,
            n1: NaN,
            n2: NaN,
            a0: NaN,
            a1: NaN,
            a2: NaN,
            pl: NaN,
            time: NaN,
            rw: NaN,
            rh: NaN,
            mId: !1,
            at: NaN,
            c0: NaN,
            c1: NaN,
            c2: NaN,
            c3: NaN,
            l0: NaN,
            l1: NaN,
            l2: NaN,
            o0: NaN,
            o1: NaN,
            o2: NaN,
            o3: NaN,
            t0: NaN,
            t1: NaN,
            t2: NaN,
            inv: NaN,
            fade: NaN,
          }),
      this.texEp !== this.ufEpoch && this.bindFrameTex(),
      e
    );
  }
  bindFrameTex() {
    const t = this.gl;
    ((this.texEp = this.ufEpoch),
      (this.tex1 = null),
      this.entityTex.end_portal_tex &&
        (t.activeTexture(t.TEXTURE2), t.bindTexture(t.TEXTURE_2D, this.entityTex.end_portal_tex)),
      t.activeTexture(t.TEXTURE8),
      t.bindTexture(t.TEXTURE_2D, this.lightmapTex()),
      t.activeTexture(t.TEXTURE0),
      t.bindTexture(t.TEXTURE_2D_ARRAY, this.texArray));
  }
  ufFrame(t, e, i, o) {
    const n = this.gl,
      a = t.u,
      r = this.camPos,
      s = o.fogColor,
      l = o.nightTint,
      u = o.ambient || AMB0;
    (e.vp !== i && ((e.vp = i), n.uniformMatrix4fv(a.u_vp, !1, i)),
      (e.cx === r[0] && e.cy === r[1] && e.cz === r[2]) ||
        ((e.cx = r[0]), (e.cy = r[1]), (e.cz = r[2]), n.uniform3f(a.u_cam, r[0], r[1], r[2])),
      e.day !== o.day && ((e.day = o.day), a.u_day && n.uniform1f(a.u_day, o.day)),
      (e.f0 === s[0] && e.f1 === s[1] && e.f2 === s[2]) ||
        ((e.f0 = s[0]), (e.f1 = s[1]), (e.f2 = s[2]), n.uniform3f(a.u_fogColor, s[0], s[1], s[2])),
      (e.fn === o.fogNear && e.ff === o.fogFar) ||
        ((e.fn = o.fogNear), (e.ff = o.fogFar), n.uniform2f(a.u_fog, o.fogNear, o.fogFar)),
      e.gam !== this.gamma &&
        ((e.gam = this.gamma), a.u_gamma && n.uniform1f(a.u_gamma, this.gamma)),
      (e.n0 === l[0] && e.n1 === l[1] && e.n2 === l[2]) ||
        ((e.n0 = l[0]),
        (e.n1 = l[1]),
        (e.n2 = l[2]),
        a.u_nightTint && n.uniform3f(a.u_nightTint, l[0], l[1], l[2])),
      (e.a0 === u[0] && e.a1 === u[1] && e.a2 === u[2]) ||
        ((e.a0 = u[0]),
        (e.a1 = u[1]),
        (e.a2 = u[2]),
        a.u_ambient && n.uniform3f(a.u_ambient, u[0], u[1], u[2])));
  }
  useChunkProg(t, e = !1, i = 0.5, o = null, n = null) {
    const a = this.gl,
      r = e && this.fxOn ? ("trans" === e ? this.fx.pChunkT : this.fx.pChunk) : this.progChunk,
      s = r.u;
    a.useProgram(r.p);
    const l = this.ufState(r);
    (r.units ||
      ((r.units = !0), a.uniform1i(s.u_portalTex, 2), s.u_lightmap && a.uniform1i(s.u_lightmap, 8)),
      this.ufFrame(r, l, this.vp, t),
      l.tick !== t.tick && ((l.tick = t.tick), a.uniform1f(s.u_tick, t.tick)));
    const u = this.portalLayer ?? 65535;
    l.pl !== u && ((l.pl = u), a.uniform1ui(s.u_portalLayer, u));
    const c = this.frameTime ?? performance.now() % 1e7;
    l.time !== c && ((l.time = c), a.uniform1f(s.u_time, c));
    const h = this.canvas.width,
      m = this.canvas.height;
    return (
      (l.rw === h && l.rh === m) || ((l.rw = h), (l.rh = m), a.uniform2f(s.u_res, h, m)),
      l.mId || ((l.mId = !0), a.uniformMatrix4fv(s.u_model, !1, this.identity)),
      this.chunkAlpha(r, i),
      this.chunkColor(r, o),
      n ? this.chunkLight(r, n[0], n[1], 1) : this.chunkLight(r, 0, 0, 0),
      s.u_pass && a.uniform1i(s.u_pass, 0),
      r
    );
  }
  chunkAlpha(t, e) {
    const i = t.st;
    i.at !== e && ((i.at = e), this.gl.uniform1f(t.u.u_alphaTest, e));
  }
  chunkColor(t, e) {
    const i = t.st,
      o = e ? e[0] : 1,
      n = e ? e[1] : 1,
      a = e ? e[2] : 1,
      r = e ? e[3] : 1;
    (i.c0 === o && i.c1 === n && i.c2 === a && i.c3 === r) ||
      ((i.c0 = o),
      (i.c1 = n),
      (i.c2 = a),
      (i.c3 = r),
      this.gl.uniform4f(t.u.u_colorMul, o, n, a, r));
  }
  chunkLight(t, e, i, o) {
    const n = t.st;
    (n.l0 === e && n.l1 === i && n.l2 === o) ||
      ((n.l0 = e), (n.l1 = i), (n.l2 = o), this.gl.uniform3f(t.u.u_lightOv, e, i, o));
  }
  chunkModel(t, e) {
    ((t.st.mId = e === this.identity), this.gl.uniformMatrix4fv(t.u.u_model, !1, e));
  }
  mat(t) {
    const e = this.matP || (this.matP = []);
    let i = e[this.matI];
    if (!i) {
      if (this.matI >= 16384) return t ? new Float32Array(t) : M4.create();
      i = e[this.matI] = new Float32Array(16);
    }
    return (this.matI++, t ? i.set(t) : (i.fill(0), (i[0] = i[5] = i[10] = i[15] = 1)), i);
  }
  drawSky(t) {
    const e = this.gl,
      i = this.progSky;
    (e.disable(e.DEPTH_TEST), e.depthMask(!1), e.useProgram(i.p), e.disable(e.CULL_FACE));
    const o = this.vpNoTranslate(),
      n = invert4(o, this.mat());
    (e.uniformMatrix4fv(i.u.u_invVP, !1, n),
      e.uniform3fv(i.u.u_sky, t.skyColor),
      e.uniform3fv(i.u.u_fogColor, t.fogColor),
      e.uniform3fv(i.u.u_sunDir, t.sunDir),
      e.uniform4fv(i.u.u_sunset, t.sunset),
      e.uniform3fv(i.u.u_void, t.voidColor),
      e.uniform1f(i.u.u_voidOn, this.camPos[1] + (this.yOff || 0) < (t.horizon ?? 63) ? 1 : 0));
    const a = this.fxOn && this.fx && this.fx.sunDiscCol;
    if (
      (a
        ? (e.clearColor(0, 0, 0, 1), e.clear(e.COLOR_BUFFER_BIT))
        : (e.bindVertexArray(this.emptyVao), e.drawArrays(e.TRIANGLES, 0, 3)),
      t.starBright > 0.01)
    ) {
      const i = this.progCol;
      e.useProgram(i.p);
      const n = this.mat();
      (M4.rotY(n, -Math.PI / 2),
        M4.rotX(n, t.celestial * Math.PI * 2),
        e.uniformMatrix4fv(i.u.u_vp, !1, o),
        e.uniformMatrix4fv(i.u.u_model, !1, n),
        e.uniform4f(i.u.u_color, 1, 1, 1, t.starBright),
        e.uniform3f(i.u.u_cam, 0, 0, 0),
        e.uniform2f(i.u.u_fog, 1e9, 2e9),
        e.uniform3fv(i.u.u_fogColor, t.fogColor),
        e.uniform1f(i.u.u_psize, Math.max(1, this.canvas.height / 700)),
        e.enable(e.BLEND),
        e.blendFunc(e.SRC_ALPHA, e.ONE),
        e.bindVertexArray(this.starVao),
        e.drawArrays(e.POINTS, 0, this.starCount));
    }
    const r = this.progTex;
    (e.useProgram(r.p),
      e.enable(e.BLEND),
      e.blendFunc(e.SRC_ALPHA, e.ONE),
      e.uniformMatrix4fv(r.u.u_vp, !1, o),
      e.bindVertexArray(this.quadVao),
      e.activeTexture(e.TEXTURE0));
    const s = t.celestial * Math.PI * 2;
    for (const i of ["sun", "moon"]) {
      if ("sun" === i && a) continue;
      const o = this.mat();
      (M4.rotY(o, -Math.PI / 2),
        M4.rotX(o, s + ("moon" === i ? Math.PI : 0)),
        M4.translate(o, 0, 100, 0),
        M4.scale(o, "sun" === i ? 30 : 20, 1, "sun" === i ? 30 : 20),
        e.uniformMatrix4fv(r.u.u_model, !1, o));
      const n = this.fxOn ? 1.4 : 1;
      (e.uniform4f(r.u.u_color, n, n, n, "sun" === i ? t.sunAlpha : 1 - 0.9 * t.rain),
        e.bindTexture(e.TEXTURE_2D, this.entityTex["sun" === i ? "sun" : "moon" + t.moonPhase]),
        e.drawElements(e.TRIANGLES, 6, e.UNSIGNED_INT, 0));
    }
    (e.disable(e.BLEND), e.enable(e.DEPTH_TEST), e.depthMask(!0), e.enable(e.CULL_FACE));
  }
  vpNoTranslate() {
    const t = this.mat(this.view);
    return ((t[12] = t[13] = t[14] = 0), mul4(this.mat(), this.proj, t));
  }
  drawTerrain(t) {
    const e = this.gl;
    this.arena && this.arena.compact();
    const i = this.useChunkProg(t, !0);
    (e.enable(e.DEPTH_TEST), e.enable(e.CULL_FACE), e.cullFace(e.BACK), e.disable(e.BLEND));
    const o = this.camPos,
      n = 16 * (this.renderDist + 1);
    i.u.u_sec && e.uniform1i(i.u.u_sec, 1);
    const a = "undefined" != typeof window ? window.game : null,
      r = this.fxOn && this.fx;
    let s =
      ("none" === t.sky ||
        (a && a.renderer === this && (a.headInWater || a.headInLava || (a.headInPowder && !r)))) &&
      t.fogFar > 0 &&
      t.fogFar < n
        ? t.fogFar + 1
        : 0;
    s &&
      r &&
      r.cfg &&
      r.cfg.vl &&
      r.shadowOn &&
      r.A &&
      r.A.vl[0] + r.A.vl[1] + r.A.vl[2] > 0.002 &&
      (s = Math.max(s, Math.max(128, 0.98 * r.renderD) + 1));
    const l = [],
      u = this.updateCulling() || this.sections.values();
    for (const t of u) {
      if (t.dead) continue;
      const e = t.x + 8 - o[0],
        i = t.z + 8 - o[2];
      if (!(e * e + i * i > n * n)) {
        if (s) {
          const n = Math.max(0, Math.abs(e) - 8),
            a = Math.max(0, Math.abs(i) - 8),
            r = Math.max(0, Math.abs(t.y + 8 - o[1]) - 8);
          if (n * n + a * a > s * s || 0.5 * r > s) continue;
        }
        aabbInFrustum(this.planes, t.x, t.y, t.z, t.x + 16, t.y + 16, t.z + 16) &&
          ((t.d = e * e + i * i + (t.y + 8 - o[1]) ** 2), l.push(t));
      }
    }
    l.sort((t, e) => t.d - e.d);
    const c = this.opq || (this.opq = []);
    c.length = 0;
    for (const t of l) t.o && ((t.band = Math.floor(Math.sqrt(t.d) / 48)), c.push(t));
    c.sort((t, e) => t.band - e.band || t.o.a.pg.id - e.o.a.pg.id || t.d - e.d);
    const h = this.fxOn && this.fx.pDepth;
    if (h) {
      const o = this.fx.pDepth;
      (e.useProgram(o.p),
        e.uniformMatrix4fv(o.u.u_vp, !1, this.vp),
        e.uniform3fv(o.u.u_cam, this.camPos),
        e.uniform1f(o.u.u_tick, t.tick),
        e.uniform1f(o.u.u_time, this.frameTime),
        e.uniform1f(o.u.u_wave, 1),
        e.uniform1i(o.u.u_sec, 1),
        e.uniform1i(o.u.u_mat, 5),
        e.uniform1i(o.u.u_tex, 0),
        e.uniform1f(o.u.u_alphaTest, 0.5),
        e.colorMask(!1, !1, !1, !1),
        this.secDraw(o, c, !0, !1),
        e.colorMask(!0, !0, !0, !0),
        e.useProgram(i.p),
        e.depthFunc(e.LEQUAL),
        e.depthMask(!1));
    }
    ((i.st.mId = !1), h || e.depthFunc(e.LEQUAL));
    const m = this.secDraw(i, c, !0, !1);
    (e.depthFunc(e.LESS),
      h && e.depthMask(!0),
      this.chunkModel(i, this.identity),
      i.u.u_sec && e.uniform1i(i.u.u_sec, 0),
      (this.visSections = l),
      (this.stats = { sections: l.length, tris: m }));
  }
  drawTranslucent(t) {
    const e = this.gl;
    this.fxOn && this.fx.copyScene();
    const i = this.useChunkProg(t, "trans", 0.01);
    (i.u.u_pass && e.uniform1i(i.u.u_pass, 1),
      e.enable(e.BLEND),
      e.blendFunc(e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA),
      this.fxOn &&
        e.blendFuncSeparate(e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA, e.ZERO, e.ONE_MINUS_SRC_ALPHA),
      e.disable(e.CULL_FACE),
      e.depthMask(!1),
      i.u.u_sec && e.uniform1i(i.u.u_sec, 1));
    const o = this.visSections || [];
    if (
      ((i.st.mId = !1),
      this.secDraw(i, o, !1, !0),
      this.chunkModel(i, this.identity),
      i.u.u_sec && e.uniform1i(i.u.u_sec, 0),
      this.fxOn)
    ) {
      const i = this.fx.pDepth;
      (e.useProgram(i.p),
        e.disable(e.BLEND),
        e.colorMask(!1, !1, !1, !1),
        e.depthMask(!0),
        e.uniformMatrix4fv(i.u.u_vp, !1, this.vp),
        e.uniform3fv(i.u.u_cam, this.camPos),
        e.uniform1f(i.u.u_tick, t.tick),
        e.uniform1f(i.u.u_time, this.frameTime),
        e.uniform1f(i.u.u_wave, 1),
        e.uniform1i(i.u.u_sec, 1),
        e.uniform1i(i.u.u_mat, 5),
        e.uniform1i(i.u.u_tex, 0),
        e.uniform1f(i.u.u_alphaTest, 0.01),
        this.secDraw(i, o, !1, !1),
        e.colorMask(!0, !0, !0, !0),
        e.uniform1i(i.u.u_sec, 0));
    }
    (e.depthMask(!0),
      e.enable(e.CULL_FACE),
      e.blendFunc(e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA),
      e.disable(e.BLEND));
  }
  drawClouds(t, e, i) {
    if (!this.showClouds) return;
    if (this.fxOn) return;
    const o = this.cloudRange(),
      n = 192 - (this.yOff || 0),
      a = this.camPos[1],
      r = "undefined" != typeof window ? window.game : null;
    let s = 0.45 * o,
      l = o;
    if (
      (r && r.renderer === this && (r.headInWater || r.headInLava || r.headInPowder)) ||
      t.fogFar < 16 * this.renderDist - 1
    ) {
      const e = Math.max(0, n - a, a - n - 4),
        i = t.fogFar,
        o = Math.min(t.fogNear, i - 0.01);
      if (e >= i) return;
      const r = clamp((e - o) / (i - o), 0, 0.99);
      ((l = Math.sqrt(i * i - e * e)), (s = (-r * l) / (1 - r)));
    }
    const u = 0.03 * t.tick;
    this.buildClouds(e, i, u);
    const c = this.gl,
      h = this.progCol;
    c.useProgram(h.p);
    const m = this.mat();
    (M4.translate(m, -u, n, 0),
      c.uniformMatrix4fv(h.u.u_vp, !1, this.vp),
      c.uniformMatrix4fv(h.u.u_model, !1, m));
    const _ = t.cloudColor;
    (c.uniform4f(h.u.u_color, _[0], _[1], _[2], 0.8),
      c.uniform3fv(h.u.u_cam, this.camPos),
      c.uniform3fv(h.u.u_fogColor, t.fogColor),
      c.uniform2f(h.u.u_fog, s, l),
      c.uniform1f(h.u.u_psize, 1),
      c.enable(c.BLEND),
      c.blendFunc(c.SRC_ALPHA, c.ONE_MINUS_SRC_ALPHA),
      c.enable(c.CULL_FACE),
      c.bindVertexArray(this.cloudGL.vao),
      c.colorMask(!1, !1, !1, !1),
      c.drawElements(c.TRIANGLES, 1.5 * this.cloudGL.n, c.UNSIGNED_INT, 0),
      c.colorMask(!0, !0, !0, !0),
      c.depthFunc(c.LEQUAL),
      c.drawElements(c.TRIANGLES, 1.5 * this.cloudGL.n, c.UNSIGNED_INT, 0),
      c.depthFunc(c.LESS),
      c.disable(c.BLEND));
  }
  drawMesh(t, e, i, o, n = {}) {
    const a = this.gl,
      r = this.meshToGL(t),
      s = this.useChunkProg(i, !1, 0.1, n.color, o);
    (this.chunkModel(s, e),
      a.bindVertexArray(r.vao),
      this.shRec && this.shRec.push({ vao: r.vao, n: r.n, m: new Float32Array(e) }),
      this.shRecOnly || a.drawElements(a.TRIANGLES, 1.5 * r.n, a.UNSIGNED_INT, 0),
      n.glint && this.drawGlint([[r.vao, r.n, 0, e]], n.glint, i, this.vp, !0));
  }
  drawGlint(t, e, i, o, n) {
    if (this.shRecOnly || !t.length) return;
    const a = this.gl,
      r = this.glintTex("armor" === e);
    if (!r) return;
    const s = n ? "C" : "E",
      l =
        (this.progGlint || (this.progGlint = {}))[s] ||
        (this.progGlint[s] = compile(a, glintVS(n), glintFS(n))),
      u = l.u;
    (a.useProgram(l.p),
      a.uniformMatrix4fv(u.u_vp, !1, o || this.vp),
      a.uniform3f(u.u_cam, this.camPos[0], this.camPos[1], this.camPos[2]));
    const c = 4 * performance.now(),
      h = "item" === e ? 0.125 : "armor" === e ? 0.16 : 0.5;
    (a.uniform4f(u.u_tm, (-c % 11e4) / 11e4, (c % 3e4) / 3e4, h, Math.PI / 18),
      a.uniform2f(u.u_fog, i.fogNear, i.fogFar),
      a.uniform1f(u.u_alpha, 0.75),
      a.uniform1i(u.u_tex, n ? 0 : 1),
      a.uniform1i(u.u_glint, 4),
      a.activeTexture(a.TEXTURE4),
      a.bindTexture(a.TEXTURE_2D, r),
      a.activeTexture(this.u1 ? a.TEXTURE1 : a.TEXTURE0));
    const m = a.isEnabled(a.BLEND),
      _ = a.isEnabled(a.CULL_FACE),
      d = a.getParameter(a.DEPTH_FUNC),
      v = [a.BLEND_SRC_RGB, a.BLEND_DST_RGB, a.BLEND_SRC_ALPHA, a.BLEND_DST_ALPHA].map((t) =>
        a.getParameter(t),
      );
    (a.enable(a.BLEND),
      a.blendFuncSeparate(a.SRC_COLOR, a.ONE, a.ZERO, a.ONE),
      a.depthFunc(a.LEQUAL),
      a.depthMask(!1),
      a.disable(a.CULL_FACE),
      a.enable(a.POLYGON_OFFSET_FILL),
      a.polygonOffset(-1, -1));
    for (const [e, i, o, n] of t)
      (a.bindVertexArray(e),
        a.uniformMatrix4fv(u.u_model, !1, n),
        a.drawElements(a.TRIANGLES, 1.5 * i, a.UNSIGNED_INT, o));
    (a.disable(a.POLYGON_OFFSET_FILL),
      a.depthMask(!0),
      a.depthFunc(d),
      a.blendFuncSeparate(v[0], v[1], v[2], v[3]),
      m || a.disable(a.BLEND),
      _ && a.enable(a.CULL_FACE));
  }
  glintTex(t) {
    const e = t ? "armor" : "item",
      i = this._glint || (this._glint = {});
    if (void 0 !== i[e]) return i[e];
    i[e] = null;
    const o = "undefined" != typeof window && window.ETEX && ETEX["misc/enchanted_glint_" + e];
    if (o) {
      const t = new Image();
      ((t.onload = () => {
        const o = this.gl,
          n = this.tex2D(t, !0);
        (o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MIN_FILTER, o.LINEAR),
          o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MAG_FILTER, o.LINEAR),
          (i[e] = n));
      }),
        (t.src = o));
    }
    return null;
  }
  drawModel(t, e, i, o, n, a, r = {}) {
    const s = this.gl,
      l = this.entBegin(e, n, a, r),
      u = this.models[t],
      c = [],
      h = {},
      m = !this.shRecOnly && !r.hidden && !r.glintOnly;
    let _ = null,
      d = null;
    for (const t of u.parts) {
      const n = o && o[t.name];
      if (n && n.hidden) continue;
      const a = this.mat(t.parent && h[t.parent] ? h[t.parent] : i);
      (M4.translate(a, t.pivot[0] / 16, t.pivot[1] / 16, t.pivot[2] / 16),
        n &&
          (n.t && M4.translate(a, n.t[0], n.t[1], n.t[2]),
          n.zx
            ? (n.rz && M4.rotZ(a, n.rz), n.ry && M4.rotY(a, n.ry), n.rx && M4.rotX(a, n.rx))
            : (n.ry && M4.rotY(a, n.ry), n.rx && M4.rotX(a, n.rx), n.rz && M4.rotZ(a, n.rz))),
        t.rotY && M4.rotY(a, t.rotY),
        t.rotX && M4.rotX(a, t.rotX),
        t.rotZ && M4.rotZ(a, t.rotZ),
        (h[t.name] = a));
      const u = t.mesh,
        v = u.off || 0;
      (!this.shRec ||
        r.vp ||
        r.hidden ||
        r.glintOnly ||
        this.shRec.push({
          vao: u.vao,
          n: u.n,
          off: v,
          m: new Float32Array(a),
          tex: this.entityTex[e],
        }),
        m &&
          u.n &&
          (u.vao !== _ && ((_ = u.vao), s.bindVertexArray(_)),
          s.uniformMatrix4fv(l.u.u_model, !1, a),
          s.drawElements(s.TRIANGLES, 1.5 * u.n, s.UNSIGNED_INT, v)),
        r.glint && u.n && !r.hidden && (d || (d = [])).push([u.vao, u.n, v, a]),
        r.attach && r.attach[t.name] && c.push([r.attach[t.name], this.mat(a)]));
    }
    (d && this.drawGlint(d, r.glint, a, r.vp || this.vp, !1), this.unit0());
    for (const [t, e] of c) t(e);
  }
  entBegin(t, e, i, o = {}) {
    const n = this.gl,
      a = this.fxOn ? this.fx.pEnt : this.progEnt,
      r = a.u;
    n.useProgram(a.p);
    const s = this.ufState(a);
    (a.units ||
      ((a.units = !0), n.uniform1i(r.u_tex, 1), r.u_lightmap && n.uniform1i(r.u_lightmap, 8)),
      this.ufFrame(a, s, o.vp || this.vp, i),
      (s.l0 === e[0] && s.l1 === e[1]) ||
        ((s.l0 = e[0]), (s.l1 = e[1]), n.uniform2f(r.u_light, e[0], e[1])));
    const l = o.overlay,
      u = l ? l[0] : 0,
      c = l ? l[1] : 0,
      h = l ? l[2] : 0,
      m = l ? l[3] : 0;
    (s.o0 === u && s.o1 === c && s.o2 === h && s.o3 === m) ||
      ((s.o0 = u), (s.o1 = c), (s.o2 = h), (s.o3 = m), n.uniform4f(r.u_overlay, u, c, h, m));
    const _ = o.tint,
      d = _ ? _[0] : 1,
      v = _ ? _[1] : 1,
      p = _ ? _[2] : 1;
    ((s.t0 === d && s.t1 === v && s.t2 === p) ||
      ((s.t0 = d), (s.t1 = v), (s.t2 = p), n.uniform3f(r.u_tint, d, v, p)),
      n.uniform1f(r.u_bright, o.bright ? 1 : 0));
    const g = o.inv ? 1 : 0,
      E = 1 - (o.alpha ?? 1);
    (r.u_inv && s.inv !== g && ((s.inv = g), n.uniform1f(r.u_inv, g)),
      r.u_fade && s.fade !== E && ((s.fade = E), n.uniform1f(r.u_fade, E)));
    const x = this.entityTex[t];
    return (
      this.tex1 !== x &&
        ((this.tex1 = x),
        n.activeTexture(n.TEXTURE1),
        n.bindTexture(n.TEXTURE_2D, x),
        (this.u1 = !0)),
      a
    );
  }
  unit0() {
    this.u1 && ((this.u1 = !1), this.gl.activeTexture(this.gl.TEXTURE0));
  }
  beginShadows() {
    ((this.shOn = !0), (this.shVp = this.vp), (this.shN = 0));
  }
  queueShadow(t, e, i, o, n) {
    let a = this.shQ;
    if (!a || 28 * (this.shN + 1) > a.length) {
      const t = new Float32Array(Math.max(1792, a ? 2 * a.length : 0));
      (a && t.set(a), (a = this.shQ = t));
    }
    const r = 28 * this.shN++,
      s = e + 0.01;
    for (let e = 0; e < 4; e++) {
      const l = r + 7 * e;
      ((a[l] = t),
        (a[l + 1] = s),
        (a[l + 2] = i),
        (a[l + 3] = 0 === e || 3 === e ? -1 : 1),
        (a[l + 4] = e < 2 ? -1 : 1),
        (a[l + 5] = o),
        (a[l + 6] = n));
    }
  }
  flushShadows() {
    const t = this.shN;
    if (((this.shOn = !1), (this.shN = 0), !t)) return;
    const e = this.gl;
    let i = this.progShadow;
    (i ||
      ((i = this.progShadow =
        compile(
          e,
          "#version 300 es\nlayout(location=0) in vec3 a_c; layout(location=1) in vec4 a_o;\nuniform mat4 u_vp; out vec2 v_uv; flat out float v_a;\nvoid main(){ mat4 m = mat4(a_o.z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, a_o.z, 0.0, a_c.x, a_c.y, a_c.z, 1.0);\n  v_uv = a_o.xy * 0.5 + 0.5; v_a = a_o.w; gl_Position = u_vp * m * vec4(a_o.x, 0.0, a_o.y, 1.0); }",
          "#version 300 es\nprecision highp float;\nuniform sampler2D u_tex; in vec2 v_uv; flat in float v_a; out vec4 o;\nvoid main(){ vec4 t = texture(u_tex, v_uv); o = t * vec4(1.0, 1.0, 1.0, v_a); }",
        )),
      (i.vao = e.createVertexArray()),
      e.bindVertexArray(i.vao),
      (i.buf = e.createBuffer()),
      e.bindBuffer(e.ARRAY_BUFFER, i.buf),
      e.enableVertexAttribArray(0),
      e.vertexAttribPointer(0, 3, e.FLOAT, !1, 28, 0),
      e.enableVertexAttribArray(1),
      e.vertexAttribPointer(1, 4, e.FLOAT, !1, 28, 12),
      e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, this.quadIdx),
      e.useProgram(i.p),
      e.uniform1i(i.u.u_tex, 0)),
      e.useProgram(i.p),
      e.uniformMatrix4fv(i.u.u_vp, !1, this.shVp),
      e.bindVertexArray(i.vao),
      e.bindBuffer(e.ARRAY_BUFFER, i.buf),
      e.bufferData(e.ARRAY_BUFFER, this.shQ.subarray(0, 28 * t), e.STREAM_DRAW),
      e.enable(e.BLEND),
      e.blendFunc(e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA),
      e.depthMask(!1),
      e.enable(e.POLYGON_OFFSET_FILL),
      e.polygonOffset(-1, -1),
      e.enable(e.CULL_FACE),
      e.activeTexture(e.TEXTURE0),
      e.bindTexture(e.TEXTURE_2D, this.entityTex.shadow),
      e.drawElements(e.TRIANGLES, 6 * t, e.UNSIGNED_INT, 0),
      e.disable(e.POLYGON_OFFSET_FILL),
      e.depthMask(!0),
      e.disable(e.BLEND));
  }
  drawShadow(t, e, i, o, n) {
    if (this.shOn && this.vp === this.shVp) return this.queueShadow(t, e, i, o, n);
    const a = this.gl,
      r = this.progTex;
    a.useProgram(r.p);
    const s = this.mat();
    (M4.translate(s, t, e + 0.01, i),
      M4.scale(s, o, 1, o),
      a.uniformMatrix4fv(r.u.u_vp, !1, this.vp),
      a.uniformMatrix4fv(r.u.u_model, !1, s),
      a.uniform4f(r.u.u_color, 1, 1, 1, n),
      a.enable(a.BLEND),
      a.blendFunc(a.SRC_ALPHA, a.ONE_MINUS_SRC_ALPHA),
      a.depthMask(!1),
      a.enable(a.POLYGON_OFFSET_FILL),
      a.polygonOffset(-1, -1),
      a.activeTexture(a.TEXTURE0),
      a.bindTexture(a.TEXTURE_2D, this.entityTex.shadow),
      a.bindVertexArray(this.quadVao),
      a.drawElements(a.TRIANGLES, 6, a.UNSIGNED_INT, 0),
      a.disable(a.POLYGON_OFFSET_FILL),
      a.depthMask(!0),
      a.disable(a.BLEND));
  }
  drawDynamic(t, e, i, o = {}) {
    if (!t.n) return;
    const n = this.gl;
    (this.uploadDynamic(e, t),
      this.useChunkProg(i, !1, o.alphaTest ?? 0.1, o.colorMul || null),
      "mul" === o.blend
        ? (n.enable(n.BLEND),
          n.blendFunc(n.DST_COLOR, n.SRC_COLOR),
          n.depthMask(!1),
          n.enable(n.POLYGON_OFFSET_FILL),
          n.polygonOffset(-2, -2))
        : "alpha" === o.blend &&
          (n.enable(n.BLEND), n.blendFunc(n.SRC_ALPHA, n.ONE_MINUS_SRC_ALPHA), n.depthMask(!1)),
      o.noCull && n.disable(n.CULL_FACE),
      n.bindVertexArray(e.vao),
      n.drawElements(n.TRIANGLES, 1.5 * t.n, n.UNSIGNED_INT, 0),
      n.disable(n.BLEND),
      n.depthMask(!0),
      n.disable(n.POLYGON_OFFSET_FILL),
      n.enable(n.CULL_FACE));
  }
  drawLines(t, e) {
    const i = this.gl,
      o = this.progCol;
    (i.useProgram(o.p),
      i.uniformMatrix4fv(o.u.u_vp, !1, this.vp),
      i.uniformMatrix4fv(o.u.u_model, !1, this.identity),
      i.uniform4fv(o.u.u_color, e),
      i.uniform3fv(o.u.u_cam, this.camPos),
      i.uniform2f(o.u.u_fog, 1e9, 2e9),
      i.uniform1f(o.u.u_psize, 1),
      i.bindVertexArray(this.lineVao),
      i.bindBuffer(i.ARRAY_BUFFER, this.lineBuf),
      i.bufferData(i.ARRAY_BUFFER, new Float32Array(t), i.DYNAMIC_DRAW),
      i.enableVertexAttribArray(0),
      i.vertexAttribPointer(0, 3, i.FLOAT, !1, 28, 0),
      i.enableVertexAttribArray(1),
      i.vertexAttribPointer(1, 4, i.FLOAT, !1, 28, 12),
      i.enable(i.BLEND),
      i.blendFunc(i.SRC_ALPHA, i.ONE_MINUS_SRC_ALPHA),
      i.drawArrays(i.LINES, 0, t.length / 7),
      i.disable(i.BLEND));
  }
  buildIcons() {
    const t = this.gl,
      e = 64,
      i = ITEMS.map((t, e) => (t ? e : -1)).filter((t) => t >= 0),
      o = 32,
      n = Math.ceil(i.length / o),
      a = (this.iconSlot = new Int16Array(ITEMS.length).fill(-1));
    i.forEach((t, e) => {
      a[t] = e;
    });
    const r = document.createElement("canvas");
    ((r.width = 2048), (r.height = n * e));
    const s = r.getContext("2d");
    s.imageSmoothingEnabled = !1;
    const l = 2048,
      u = Math.min(n, 16) * e,
      c = t.createFramebuffer(),
      h = t.createTexture(),
      m = t.createRenderbuffer();
    (t.bindTexture(t.TEXTURE_2D, h),
      t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, l, u, 0, t.RGBA, t.UNSIGNED_BYTE, null),
      t.bindRenderbuffer(t.RENDERBUFFER, m),
      t.renderbufferStorage(t.RENDERBUFFER, t.DEPTH_COMPONENT24, l, u),
      t.bindFramebuffer(t.FRAMEBUFFER, c),
      t.framebufferTexture2D(t.FRAMEBUFFER, t.COLOR_ATTACHMENT0, t.TEXTURE_2D, h, 0),
      t.framebufferRenderbuffer(t.FRAMEBUFFER, t.DEPTH_ATTACHMENT, t.RENDERBUFFER, m));
    const _ = new Uint8Array(l * u * 4),
      d = s.createImageData(l, u);
    let v = -1,
      p = 0;
    const at = (i, o) => {
        const n = u - (o - v * u) - e;
        (t.bindFramebuffer(t.FRAMEBUFFER, c),
          t.viewport(i, n, e, e),
          t.scissor(i, n, e, e),
          t.enable(t.SCISSOR_TEST),
          t.clearColor(0, 0, 0, 0),
          t.clear(t.COLOR_BUFFER_BIT | t.DEPTH_BUFFER_BIT),
          p++);
      },
      g = [],
      flush = () => {
        if (v >= 0) {
          if (p) {
            (t.disable(t.SCISSOR_TEST),
              t.bindFramebuffer(t.FRAMEBUFFER, c),
              t.readPixels(0, 0, l, u, t.RGBA, t.UNSIGNED_BYTE, _));
            const e = 8192;
            for (let t = 0; t < u; t++) d.data.set(_.subarray((u - 1 - t) * e, (u - t) * e), t * e);
          } else d.data.fill(0);
          for (const t of g) t();
          (p || g.length) && s.putImageData(d, 0, v * u);
        }
        ((g.length = 0), (p = 0));
      },
      E = { tick: 0, day: 1, fogColor: [0, 0, 0], fogNear: 1e8, fogFar: 2e8, nightTint: [1, 1, 1] },
      x = this.vp,
      A = this.camPos;
    this.camPos = [0, 0, 0];
    const b = M4.create();
    (M4.ortho(b, -0.5, 0.5, -0.5, 0.5, -10, 10), (this.vp = b));
    const y = "undefined" != typeof VM && VM.ready ? VM.data : null;
    for (const n of i) {
      const i = ITEMS[n],
        r = (a[n] % o) * e,
        s = Math.floor(a[n] / o) * e,
        h = Math.floor(a[n] / o / 16),
        m = s - h * u;
      h !== v &&
        (flush(),
        (v = h),
        t.disable(t.SCISSOR_TEST),
        t.bindFramebuffer(t.FRAMEBUFFER, c),
        t.viewport(0, 0, l, u),
        t.clearColor(0, 0, 0, 0),
        t.clear(t.COLOR_BUFFER_BIT | t.DEPTH_BUFFER_BIT));
      const _ = void 0 !== i.block ? BLOCKS[i.block] : null,
        p = y && y.items[i.key],
        x = p ? (void 0 !== p.gui ? p.gui : p.m) : void 0,
        A = void 0 !== x ? y.models[x] : null,
        R = p ? this.itemTint(p.tints) : null,
        S = "shield" === i.key && this.shieldIcon;
      if (S || (_ && ((_.be && "invisible" !== _.be) || _.chestLike))) {
        (at(r, s),
          t.enable(t.DEPTH_TEST),
          t.disable(t.CULL_FACE),
          S ? this.shieldIcon(A && A.display && A.display.gui, E, b) : this.beIcon(_, E, b));
        continue;
      }
      if (A && A.gen && A.layers && A.layers.length) {
        const t = A.layers.map((t, e) => (p ? this.itemTint(p.tints, e) : null));
        g.push(() => A.layers.forEach((i, o) => this.flatInto(d.data, l, T(i), r, m, e, t[o])));
        continue;
      }
      if (!A) {
        if (
          !i.block ||
          i.flat ||
          (_ && (_.shape === SH_CROSS || _.shape === SH_TORCH || _.ladder || _.door))
        ) {
          const t = i.block ? (i.flat ? T(i.flat) : _.tex[0]) : i.tex,
            o = _ && "grass" === _.tint ? [124, 189, 107] : null;
          g.push(() => this.flatInto(d.data, l, t, r, m, e, o));
          continue;
        }
      }
      const M = (A && A.display.gui) || { r: [30, 225, 0], t: [0, 0, 0], s: [0.625, 0.625, 0.625] },
        F = M4.create();
      (M4.rotX(F, (M.r[0] * Math.PI) / 180),
        M4.rotY(F, (M.r[1] * Math.PI) / 180),
        M4.rotZ(F, (M.r[2] * Math.PI) / 180));
      const N = M4.create();
      let L;
      if (
        (M4.translate(N, M.t[0] / 16, M.t[1] / 16, M.t[2] / 16),
        M4.mul(N, N, F),
        M4.scale(N, M.s[0], M.s[1], M.s[2]),
        M4.translate(N, -0.5, -0.5, -0.5),
        _ && _.bed)
      )
        L = Mesher.multi([
          [i.block, 4, 0, 0, 0],
          [i.block, 0, 0, 0, 1],
        ]);
      else if (A && A.elements && A.elements.length) L = this.iconMesh(VM.bake(x), F, R, A.light);
      else {
        if (!_) {
          const t = i.tex;
          g.push(() => this.flatInto(d.data, l, t, r, m, e, null));
          continue;
        }
        {
          let t = 0;
          (_.facing && (t = 4), _.stairs && (t = 0), (L = Mesher.single(n, t)));
        }
      }
      (at(r, s),
        this.useChunkProg(E),
        t.enable(t.DEPTH_TEST),
        t.disable(t.CULL_FACE),
        t.enable(t.BLEND),
        t.blendFunc(t.SRC_ALPHA, t.ONE_MINUS_SRC_ALPHA),
        t.depthFunc(t.LEQUAL),
        this.drawMesh(L, N, E, [1, 0]),
        t.depthFunc(t.LESS),
        L.gl && (t.deleteVertexArray(L.gl.vao), t.deleteBuffer(L.gl.buf)));
    }
    (flush(),
      t.disable(t.SCISSOR_TEST),
      t.disable(t.BLEND),
      t.enable(t.CULL_FACE),
      t.bindFramebuffer(t.FRAMEBUFFER, null),
      t.deleteFramebuffer(c),
      t.deleteTexture(h),
      t.deleteRenderbuffer(m),
      (this.vp = x),
      (this.camPos = A),
      (this.iconAtlas = r),
      (this.iconCols = o),
      (this.iconSize = e));
  }
  iconXY(t) {
    const e = this.iconSlot[t] ?? -1,
      i = this.iconSize,
      o = this.iconCols;
    return e < 0 ? [0, 0] : [(e % o) * i, Math.floor(e / o) * i];
  }
  beIcon(t, e, i) {
    const o = t.chestLike ? "chest" : t.be,
      [n, a, r] = {
        head: [45, 1.1, 8],
        wall_head: [45, 1.1, 8],
        banner: [20, 0.36, 42],
        wall_banner: [20, 0.36, 42],
        decorated_pot: [225, 0.55, 20],
        conduit: [225, 1.2, 16],
        golem_statue: [225, 0.6, 24],
        shulker_box: [225, 0.625, 16],
        chest: [225, 0.625, 14],
      }[o] || [225, 0.625, 16],
      s = M4.create();
    (M4.rotX(s, (30 * Math.PI) / 180),
      M4.rotY(s, (n * Math.PI) / 180),
      M4.scale(s, a, a, a),
      M4.translate(s, 0, -r / 32, 0));
    const l = [1, 0],
      u = { ...e, ambient: [0.3, 0.3, 0.3] };
    if (t.chestLike) {
      const e = new Float32Array(s);
      (M4.translate(e, -0.5, 0, -0.5), M4.scale(e, -1, -1, 1), this.initBEModels());
      const o = this.beTex(chestTexBase(t.key)) || "chest_normal";
      return void this.drawModel("chest", o, e, null, l, u, { vp: i });
    }
    const c = new Float32Array(s);
    M4.translate(c, -0.5, 0, -0.5);
    const h = t.states
      ? t.states.findIndex(
          (t) =>
            !(
              (void 0 !== t.rotation && "0" !== t.rotation) ||
              (void 0 !== t.facing && "south" !== t.facing && "up" !== t.facing)
            ),
        )
      : 0;
    this.drawBE(t, Math.max(0, h), 0, 0, 0, l, u, { vp: i, base: c });
  }
  itemModel(t) {
    this._itemModels || (this._itemModels = new Map());
    let e = this._itemModels.get(t);
    if (void 0 !== e) return e;
    e = null;
    const i = "undefined" != typeof VM && VM.ready ? VM.data : null,
      o = ITEMS[t],
      n = i && o && i.items[o.key];
    if (n && void 0 !== n.m) {
      const t = i.models[n.m];
      if (
        ((e = { model: t, gen: !!t.gen, mesh: null }),
        void 0 !== o.block && BLOCKS[o.block] && BLOCKS[o.block].bed)
      )
        e.mesh = Mesher.multi([
          [o.block, 4, 0, 0, 0],
          [o.block, 0, 0, 0, 1],
        ]);
      else if (!t.gen && t.elements && t.elements.length) {
        const t = VM.bake(n.m),
          i = this.itemTint(n.tints),
          o = new MeshBuffer(4 * t.length + 4);
        for (const e of t) {
          const t = e.shade ? (e.dir >= 0 ? FACE_SHADE[e.dir] : 0.85) : 1,
            n = e.tint >= 0 && i ? i : [255, 255, 255];
          for (let i = 0; i < 4; i++)
            o.v(
              e.p[i][0],
              e.p[i][1],
              e.p[i][2],
              e.uv[i][0],
              e.uv[i][1],
              e.layer,
              0,
              n[0],
              n[1],
              n[2],
              Math.round(255 * t),
              255,
              255,
              e.anim,
            );
        }
        e.mesh = o;
      }
    }
    return (this._itemModels.set(t, e), e);
  }
  iconMesh(t, e, i, o) {
    const n = new MeshBuffer(4 * t.length + 4);
    for (const a of t) {
      const t = a.n,
        r = e[0] * t[0] + e[4] * t[1] + e[8] * t[2],
        s = e[1] * t[0] + e[5] * t[1] + e[9] * t[2];
      let l = 1;
      "front" !== o && (l = s > 0.45 ? 1 : r < 0 ? 0.65 : 0.41);
      const u = a.tint >= 0 && i ? i : [255, 255, 255];
      for (let t = 0; t < 4; t++)
        n.v(
          a.p[t][0],
          a.p[t][1],
          a.p[t][2],
          a.uv[t][0],
          a.uv[t][1],
          a.layer,
          0,
          u[0],
          u[1],
          u[2],
          Math.round(255 * l),
          255,
          255,
          a.anim,
        );
    }
    return n;
  }
  itemTint(t, e = 0) {
    const i = t && t[e];
    if (!i) return null;
    const o = (i.type || "").replace("minecraft:", ""),
      rgb = (t) => (16777215 & ~(t >>>= 0) ? [(t >> 16) & 255, (t >> 8) & 255, 255 & t] : null);
    if ("constant" === o) return rgb(i.value);
    if ("grass" === o || "foliage" === o) {
      const t = this.images["grass" === o ? "grass_color" : "foliage_color"];
      if ((this._cmap || (this._cmap = {}), !this._cmap[o])) {
        const e = document.createElement("canvas");
        e.width = e.height = 256;
        const i = e.getContext("2d");
        (i.drawImage(t, 0, 0), (this._cmap[o] = i.getImageData(0, 0, 256, 256).data));
      }
      const e = clamp(i.temperature ?? 0.5, 0, 1),
        n = clamp(i.downfall ?? 1, 0, 1) * e,
        a = 4 * (256 * Math.floor(255 * (1 - n)) + Math.floor(255 * (1 - e))),
        r = this._cmap[o];
      return [r[a], r[a + 1], r[a + 2]];
    }
    return void 0 !== i.default ? rgb(i.default) : null;
  }
  tileXY(t) {
    const e = this.stripCols;
    return [(t % e) * 16, 16 * Math.floor(t / e)];
  }
  setLayer(t, e) {
    const i = this.gl,
      o = TEX_STACK,
      n = Math.floor(t / o),
      a = t % o,
      r = i.getParameter(i.ACTIVE_TEXTURE);
    (i.activeTexture(i.TEXTURE0), i.bindTexture(i.TEXTURE_2D_ARRAY, this.texArray));
    let s = e,
      l = 16;
    for (let t = 0; t < 5; t++) {
      i.texSubImage3D(i.TEXTURE_2D_ARRAY, t, 0, a * l, n, l, l, 1, i.RGBA, i.UNSIGNED_BYTE, s);
      const e = l >> 1;
      if (!e) break;
      const o = new Uint8Array(e * e * 4);
      for (let t = 0; t < e; t++)
        for (let i = 0; i < e; i++)
          o.set(s.subarray(4 * (2 * t * l + 2 * i), 4 * (2 * t * l + 2 * i) + 4), 4 * (t * e + i));
      ((s = o), (l = e));
    }
    i.activeTexture(r);
    for (let i = 0; i < 256; i++) _spriteAlpha[256 * t + i] = e[4 * i + 3];
    ItemMeshCache.delete(t);
    const u = new ImageData(new Uint8ClampedArray(e), 16, 16),
      [c, h] = this.tileXY(t);
    (this.stripCanvas.getContext("2d").putImageData(u, c, h),
      this.tileData &&
        1024 * (t + 1) <= this.tileData.length &&
        this.tileData.set(e.subarray ? e.subarray(0, 1024) : e, 1024 * t));
  }
  flatInto(t, e, i, o, n, a, r) {
    const s = this.tileData;
    if (!s || !(i >= 0 && 1024 * (i + 1) <= s.length)) return;
    const l = a - 8,
      u = 1024 * i,
      c = t.length / 4 / e;
    for (let i = 0; i < l; i++) {
      const a = n + 4 + i;
      if (a < 0 || a >= c) continue;
      const h = Math.min(15, Math.floor((16 * i) / l));
      let m = 4 * (a * e + o + 4);
      for (let e = 0; e < l; e++, m += 4) {
        const i = u + 4 * (16 * h + Math.min(15, Math.floor((16 * e) / l))),
          o = s[i + 3];
        if (!o) continue;
        let n = s[i],
          a = s[i + 1],
          c = s[i + 2];
        r && ((n = (n * r[0]) / 255), (a = (a * r[1]) / 255), (c = (c * r[2]) / 255));
        const _ = t[m + 3];
        if (255 === o || !_) {
          ((t[m] = n), (t[m + 1] = a), (t[m + 2] = c), (t[m + 3] = o));
          continue;
        }
        const d = o / 255,
          v = (_ / 255) * (1 - d),
          p = d + v;
        ((t[m] = (n * d + t[m] * v) / p),
          (t[m + 1] = (a * d + t[m + 1] * v) / p),
          (t[m + 2] = (c * d + t[m + 2] * v) / p),
          (t[m + 3] = 255 * p));
      }
    }
  }
  drawFlatIcon(t, e, i, o, n, a) {
    t.imageSmoothingEnabled = !1;
    const r = this.tileData;
    if (!r || !(e >= 0 && 1024 * (e + 1) <= r.length)) {
      const r = document.createElement("canvas");
      ((r.width = 16), (r.height = 16));
      const s = r.getContext("2d");
      if ((s.drawImage(this.stripCanvas, ...this.tileXY(e), 16, 16, 0, 0, 16, 16), a)) {
        const t = s.getImageData(0, 0, 16, 16);
        for (let e = 0; e < 1024; e += 4)
          ((t.data[e] = (t.data[e] * a[0]) / 255),
            (t.data[e + 1] = (t.data[e + 1] * a[1]) / 255),
            (t.data[e + 2] = (t.data[e + 2] * a[2]) / 255));
        s.putImageData(t, 0, 0);
      }
      return void t.drawImage(r, 0, 0, 16, 16, i + 4, o + 4, n - 8, n - 8);
    }
    const s =
      this._flatTile ||
      (this._flatTile = { c: document.createElement("canvas"), d: new ImageData(16, 16) });
    16 !== s.c.width && ((s.c.width = 16), (s.c.height = 16));
    const l = 1024 * e,
      u = r,
      c = s.d.data;
    if (a)
      for (let t = 0; t < 1024; t += 4)
        ((c[t] = (u[l + t] * a[0]) / 255),
          (c[t + 1] = (u[l + t + 1] * a[1]) / 255),
          (c[t + 2] = (u[l + t + 2] * a[2]) / 255),
          (c[t + 3] = u[l + t + 3]));
    else c.set(u.subarray(l, l + 1024));
    (s.c.getContext("2d").putImageData(s.d, 0, 0),
      t.drawImage(s.c, 0, 0, 16, 16, i + 4, o + 4, n - 8, n - 8));
  }
}
function mul4(t, e, i) {
  for (let o = 0; o < 4; o++) {
    const n = i[4 * o],
      a = i[4 * o + 1],
      r = i[4 * o + 2],
      s = i[4 * o + 3];
    for (let i = 0; i < 4; i++)
      t[4 * o + i] = e[i] * n + e[4 + i] * a + e[8 + i] * r + e[12 + i] * s;
  }
  return t;
}
function invert4(t, e) {
  const i = e || new Float32Array(16);
  ((i[0] =
    t[5] * t[10] * t[15] -
    t[5] * t[11] * t[14] -
    t[9] * t[6] * t[15] +
    t[9] * t[7] * t[14] +
    t[13] * t[6] * t[11] -
    t[13] * t[7] * t[10]),
    (i[4] =
      -t[4] * t[10] * t[15] +
      t[4] * t[11] * t[14] +
      t[8] * t[6] * t[15] -
      t[8] * t[7] * t[14] -
      t[12] * t[6] * t[11] +
      t[12] * t[7] * t[10]),
    (i[8] =
      t[4] * t[9] * t[15] -
      t[4] * t[11] * t[13] -
      t[8] * t[5] * t[15] +
      t[8] * t[7] * t[13] +
      t[12] * t[5] * t[11] -
      t[12] * t[7] * t[9]),
    (i[12] =
      -t[4] * t[9] * t[14] +
      t[4] * t[10] * t[13] +
      t[8] * t[5] * t[14] -
      t[8] * t[6] * t[13] -
      t[12] * t[5] * t[10] +
      t[12] * t[6] * t[9]),
    (i[1] =
      -t[1] * t[10] * t[15] +
      t[1] * t[11] * t[14] +
      t[9] * t[2] * t[15] -
      t[9] * t[3] * t[14] -
      t[13] * t[2] * t[11] +
      t[13] * t[3] * t[10]),
    (i[5] =
      t[0] * t[10] * t[15] -
      t[0] * t[11] * t[14] -
      t[8] * t[2] * t[15] +
      t[8] * t[3] * t[14] +
      t[12] * t[2] * t[11] -
      t[12] * t[3] * t[10]),
    (i[9] =
      -t[0] * t[9] * t[15] +
      t[0] * t[11] * t[13] +
      t[8] * t[1] * t[15] -
      t[8] * t[3] * t[13] -
      t[12] * t[1] * t[11] +
      t[12] * t[3] * t[9]),
    (i[13] =
      t[0] * t[9] * t[14] -
      t[0] * t[10] * t[13] -
      t[8] * t[1] * t[14] +
      t[8] * t[2] * t[13] +
      t[12] * t[1] * t[10] -
      t[12] * t[2] * t[9]),
    (i[2] =
      t[1] * t[6] * t[15] -
      t[1] * t[7] * t[14] -
      t[5] * t[2] * t[15] +
      t[5] * t[3] * t[14] +
      t[13] * t[2] * t[7] -
      t[13] * t[3] * t[6]),
    (i[6] =
      -t[0] * t[6] * t[15] +
      t[0] * t[7] * t[14] +
      t[4] * t[2] * t[15] -
      t[4] * t[3] * t[14] -
      t[12] * t[2] * t[7] +
      t[12] * t[3] * t[6]),
    (i[10] =
      t[0] * t[5] * t[15] -
      t[0] * t[7] * t[13] -
      t[4] * t[1] * t[15] +
      t[4] * t[3] * t[13] +
      t[12] * t[1] * t[7] -
      t[12] * t[3] * t[5]),
    (i[14] =
      -t[0] * t[5] * t[14] +
      t[0] * t[6] * t[13] +
      t[4] * t[1] * t[14] -
      t[4] * t[2] * t[13] -
      t[12] * t[1] * t[6] +
      t[12] * t[2] * t[5]),
    (i[3] =
      -t[1] * t[6] * t[11] +
      t[1] * t[7] * t[10] +
      t[5] * t[2] * t[11] -
      t[5] * t[3] * t[10] -
      t[9] * t[2] * t[7] +
      t[9] * t[3] * t[6]),
    (i[7] =
      t[0] * t[6] * t[11] -
      t[0] * t[7] * t[10] -
      t[4] * t[2] * t[11] +
      t[4] * t[3] * t[10] +
      t[8] * t[2] * t[7] -
      t[8] * t[3] * t[6]),
    (i[11] =
      -t[0] * t[5] * t[11] +
      t[0] * t[7] * t[9] +
      t[4] * t[1] * t[11] -
      t[4] * t[3] * t[9] -
      t[8] * t[1] * t[7] +
      t[8] * t[3] * t[5]),
    (i[15] =
      t[0] * t[5] * t[10] -
      t[0] * t[6] * t[9] -
      t[4] * t[1] * t[10] +
      t[4] * t[2] * t[9] +
      t[8] * t[1] * t[6] -
      t[8] * t[2] * t[5]));
  let o = t[0] * i[0] + t[1] * i[4] + t[2] * i[8] + t[3] * i[12];
  o = 1 / o;
  for (let t = 0; t < 16; t++) i[t] *= o;
  return i;
}
//# sourceURL=js/render.js
