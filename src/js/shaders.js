"use strict";
const FX_NAMES = ["关", "低", "中", "高", "极限"],
  FX_CFG = [
    null,
    { shadow: 0, casc: null, taps: 0, vl: 0, ssr: 0, taa: 0, clouds: 1 },
    { shadow: 1024, casc: [16, 44, 110], taps: 3, vl: 0, ssr: 0, taa: 1, clouds: 1 },
    { shadow: 2048, casc: [20, 56, 150], taps: 4, vl: 10, ssr: 1, taa: 1, clouds: 1 },
    { shadow: 2048, casc: [20, 56, 150], taps: 8, vl: 16, ssr: 1, taa: 1, clouds: 1 },
  ],
  MAT_LEAVES = 1,
  MAT_PLANT = 2,
  MAT_WATER = 3,
  MAT_EMIT = 4,
  MAT_LAVA = 5,
  MAT_PLANT_STILL = 6,
  MAT_PLANT_LOW = 7,
  MAT_PLANT_UP = 8,
  PLANT_WAVE =
    "\n  if (mat == 2 || mat == 7 || mat == 8) {\n    float k = a_uv.y < 0.1 ? (mat == 7 ? 0.5 : 1.0) : (mat == 8 && a_uv.y > 0.9 ? 0.5 : 0.0);\n    vec3 p0 = wp.xyz;\n    wp.x += (sin(t * 1.9 + p0.x * 0.55 + p0.z * 0.45) * 0.09 + sin(t * 3.7 + p0.x * 1.3) * 0.03) * k;\n    wp.z += cos(t * 1.6 + p0.z * 0.5 + p0.x * 0.35) * 0.06 * k;\n  }",
  PBR_STONE = 1,
  PBR_ROUGH = 2,
  PBR_POLISHED = 3,
  PBR_METAL = 4,
  PBR_GEM = 5,
  PBR_ORE = 6,
  PBR_SAND = 7,
  PBR_DIRT = 8,
  PBR_GRASS = 9,
  PBR_SNOW = 10,
  PBR_ICE = 11,
  PBR_WOOD = 12,
  PBR_OBSIDIAN = 13,
  PBR_CONCRETE = 14,
  PBR_NETHERRACK = 15,
  FX_SKY =
    "\nuniform vec3 u_skyUp, u_skyUpMoon, u_skyMid, u_skyMidSun, u_skyDown, u_skyBand, u_glareCol, u_sunVec;\nuniform vec4 u_skyK; // band strength, rain^2, night glow (nightFactorM), sun visibility\nfloat pow2f(float x){ return x * x; }\nfloat sstep1(float x){ return x * x * (3.0 - 2.0 * x); }\nvec3 fxSky(vec3 d, bool glare, bool ground){\n  float VdotU = d.y, VdotS = dot(d, u_sunVec), nfM = u_skyK.z;\n  float s1 = pow2f(max(VdotS, 0.0)), s2 = s1 * s1, s3 = pow2f(pow2f(max(-VdotS, 0.0)));\n  float up0 = max(VdotU, 0.0);\n  vec3 upC = u_skyUp + u_skyUpMoon * s3;\n  vec3 midC = u_skyMid + u_skyMidSun * s2;\n  float m1 = pow(pow2f(1.0 - up0), 1.0 - s2 * 0.4);\n  m1 = mix(m1, 1.0, u_skyK.y * 0.15);\n  vec3 c = mix(upC, midC, m1);\n  float m2 = pow2f(1.0 - abs(VdotU)); m2 = m2 * m2 * (3.0 - 2.0 * m2);\n  m2 *= (0.7 - nfM + s1 * (0.3 + nfM)) * u_skyK.x;\n  c = mix(c, u_skyBand * (1.0 + s1 * 0.3), m2);\n  float m3 = sstep1(min(max(-VdotU + 0.08, 0.0) / 0.35, 1.0));\n  vec3 gm = mix(vec3(m3), vec3(m3 * m3, sqrt(m3), pow(m3, 1.0 / 3.0)), 0.75 - 0.5 * sqrt(u_skyK.y));\n  c = mix(c, u_skyDown, gm);\n  if (ground) c *= sstep1(pow2f(1.0 + min(VdotU, 0.0)));\n  if (glare) {\n    float vs = u_skyK.w > 0.5 ? VdotS : -VdotS;\n    if (vs > 0.0) {\n      float v4 = pow(vs, 3.0);\n      c += u_glareCol * (0.075 / (1.0 - 0.925 * v4) - 0.075) * 0.7;\n    }\n  }\n  return c;\n}\n",
  FX_COMMON =
    "\nuniform vec3 u_sunDir; // towards the light (sun by day, moon by night)\nuniform vec3 u_lightCol; uniform vec3 u_ambCol; uniform vec3 u_hlCol; uniform vec3 u_blkCol;\nuniform vec4 u_tf;  // noon factor, sun visibility^2, rain, shadow time (the light fading out around sunrise / sunset)\nuniform vec4 u_tf2; // screen brightness setting, night vision, (1 - noon)^2, dimension (0 overworld, 1 nether, 2 end)\nuniform float u_eyeWater; uniform float u_frame;\nuniform highp sampler2DArrayShadow u_shadow; uniform mat4 u_shadowVP[4];\nuniform int u_shadowOn; uniform int u_taps; uniform float u_shadowSize; uniform float u_shadowTexelW[4]; uniform float u_shadowRange[4];\nuniform int u_entShadow; // layer 3: the entities around the camera, redrawn every frame\nuniform vec3 u_fxCam;\nconst vec2 POISSON[8] = vec2[8](vec2(-0.613392, 0.617481), vec2(0.170019, -0.040254), vec2(-0.299417, 0.791925), vec2(0.645680, 0.493210),\n  vec2(-0.651784, 0.717887), vec2(0.421003, 0.027070), vec2(-0.817194, -0.271096), vec2(0.977050, -0.108615));\nfloat hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }\nfloat ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }\nfloat lum(vec3 c){ return dot(c, vec3(0.2125, 0.7154, 0.0721)); }\nfloat pow1_5(float x){ return x - x * (1.0 - x) * (1.0 - x); }\n// one cascade, a soft edge of a few texels; the rotation changes every frame so TAA smooths the taps\nfloat cascadeShadow(int i, vec3 s, float tw, float range, mat2 R){\n  float texel = 1.0 / u_shadowSize, layer = float(i), bias = tw * 1.5 / range;\n  if (u_taps <= 1) return texture(u_shadow, vec4(s.xy, layer, s.z - bias));\n  float rad = max(1.0, 0.07 / tw), sum = 0.0;\n  for (int k = 0; k < 8; k++) { if (k >= u_taps) break; sum += texture(u_shadow, vec4(s.xy + R * POISSON[k] * texel * rad, layer, s.z - bias)); }\n  return sum / float(u_taps);\n}\n// the light reaching wp: the finest terrain cascade that holds it (outside them all the caller's sky light, faded\n// towards that at the edge of the last one), and the shadows of the entities near the camera\nfloat shadowAt(vec3 wp, vec3 n, float skyFallback){\n  float ndl = dot(n, u_sunDir), ang = (ign(gl_FragCoord.xy) + u_frame * 0.618034) * 6.2831;\n  mat2 R = mat2(cos(ang), sin(ang), -sin(ang), cos(ang));\n  float v = skyFallback;\n  for (int i = 0; i < 3; i++) {\n    float tw = u_shadowTexelW[i];\n    vec4 sp = u_shadowVP[i] * vec4(wp + n * tw * (1.2 + 1.8 * (1.0 - abs(ndl))), 1.0);\n    vec3 s = sp.xyz / sp.w * 0.5 + 0.5;\n    vec2 e = abs(s.xy - 0.5) * 2.0;\n    if (max(e.x, e.y) > 0.97 || s.z > 1.0) continue;\n    v = cascadeShadow(i, s, tw, u_shadowRange[i], R);\n    if (i == 2) v = mix(v, skyFallback, smoothstep(0.8, 0.97, max(e.x, e.y)));\n    break;\n  }\n  if (u_entShadow == 1 && v > 0.0) {\n    float tw = u_shadowTexelW[3];\n    vec4 sp = u_shadowVP[3] * vec4(wp + n * tw * (1.5 + 1.5 * (1.0 - abs(ndl))), 1.0);\n    vec3 s = sp.xyz / sp.w * 0.5 + 0.5;\n    vec2 e = abs(s.xy - 0.5) * 2.0;\n    if (max(e.x, e.y) < 0.98 && s.z <= 1.0) v = min(v, mix(cascadeShadow(3, s, tw, u_shadowRange[3], R), 1.0, smoothstep(0.85, 0.98, max(e.x, e.y))));\n  }\n  return v;\n}\nfloat ggx(vec3 n, vec3 V, vec3 L, float smoothG){\n  float sm = smoothG * 0.9 + 0.1; sm = sm * (2.0 - sm);\n  float rp = 1.35 - sm, rough = rp * rp * rp * rp;\n  vec3 h = normalize(L + V);\n  float nh = max(dot(n, h), 0.0), lh = max(dot(L, h), 0.0), nl = max(dot(n, L), 0.0);\n  float den = nh * nh * (rough - 1.0) + 1.0;\n  float D = rough / (3.14159265 * den * den);\n  float F = exp2((-5.55473 * lh - 6.98316) * lh) * 0.95 + 0.05;\n  float nlm = 1.0 - pow(max(1.0 - nl, 0.0), 8.0); // (nl can round past 1: pow of a negative is NaN on many GPUs)\n  float sp = max(nlm * D * F / max(lh * lh, 0.01), 0.0);\n  return sp / (0.125 * sp + 1.0);\n}\n// alb: display-space albedo; lm: (sky, block) light 0..1; vao: vanilla AO (1 = open); sub: 0 solid, 1 plant, 2 leaves.\n// Returns the lit colour (display space, can go above 1)\nvec3 fxShade(vec3 alb, vec3 n, vec3 wp, vec3 V, vec2 lm0, float vao, int sub, float smoothG, float hlMult, float emission, bool noDir){\n  vec2 lm = clamp(lm0.yx * 0.94 + 0.03, 0.0, 1.0); // (block, sky)\n  int dim = int(u_tf2.w + 0.5);\n  bool ow = dim == 0;\n  float vsB = u_tf2.x, noon = u_tf.x, sunVis2 = u_tf.y, rain = u_tf.z;\n  float NdotU = n.y, NdotL = dot(n, u_sunDir);\n  float lmY2 = lm.y * lm.y, lmYM = sstep1(lm.y);\n  float aE = abs(n.x), aN = abs(n.z), aE2 = aE * aE;\n  vec3 lightC = u_lightCol, ambC = u_ambCol;\n  float skyLSM = ow ? lmY2 * lmY2 * lmY2 * lmY2 : 1.0;\n  float NdotLM = sub != 0 ? 1.0 : max(NdotL + 0.4, 0.0) * 0.714;\n  float shadow = 0.0, subHL = 0.0;\n  if (NdotLM > 0.0001 && u_tf.w > 0.0001 && dim != 1) {\n    float sm = skyLSM;\n    if (u_shadowOn == 1) sm = shadowAt(wp, sub != 0 ? u_sunDir : n, skyLSM) * min(lm.y * 10.0 - 0.3, 1.0);\n    if (sub != 0) subHL = pow(max(dot(-V, u_sunDir), 0.0), 10.0) * (sub == 1 ? 0.8 : 0.6) * float(u_eyeWater < 0.5);\n    shadow = max(sm, 0.0) * NdotLM * u_tf.w;\n  }\n  float shF = min(shadow, 1.0);\n  // block light: a steep part near the source and a calm one further out, warm\n  float lx = lm.x;\n  float lxM = pow(lx * lx * lx * lx * lx * lx * lx * lx * (3.8 - 0.6 * vsB) + lx * (1.8 + 0.6 * vsB), 2.25);\n  vec3 blockL = lxM * u_blkCol;\n  emission *= 1.0 - 0.25 * lmYM * (1.0 - rain) * sqrt(sunVis2);\n  vec3 minL = vec3(0.005625 + vsB * 0.043) * vec3(0.45, 0.475, 0.6) * (1.0 - lmYM) + u_tf2.y * vec3(0.5, 0.5, 0.75);\n  if (!ow) minL = u_tf2.y * vec3(0.5, 0.5, 0.75);\n  float ambMult = ow ? mix(lmYM, lmYM * lmYM * lmYM, rain) : 1.0;\n  if (ow && u_eyeWater < 0.5) {\n    // under daylight the block light counts for less; at night things close by are a little brighter\n    float lxF = (sunVis2 * 0.4 + (0.6 - 0.6 * u_tf2.z)) * (6.0 - 5.0 * rain);\n    lxF *= lmY2 + lmY2 * 2.0 * shF * shF;\n    lxF = emission > 0.0 ? 0.0 : lxF;\n    blockL *= pow(lxM / 60.0 + 0.001, 0.09 * lxF);\n    float rainLF = 0.1 * rain, dist = distance(wp, u_fxCam);\n    float lft = 1.0 + max(96.0 - dist, 0.0) * (0.002 * (1.0 - sunVis2) + 0.0104 * rainLF) - rainLF;\n    ambMult *= lft; lightC *= lft;\n  }\n  float dirShade = 1.0;\n  if (!noDir) {\n    float NdotUM = dim == 1 ? 0.75 + abs(NdotU + 0.5) * 0.16666 : 0.75 + NdotU * 0.25;\n    dirShade = NdotUM * (1.0 - 0.1 * aE2) * (1.0 + 0.075 * aN);\n    if (ow) {\n      // the sun crosses east to west: the east / west faces catch more of it, north / south a little of the sky\n      lightC *= 1.0 + aE2 * 0.75;\n      ambC = mix(ambC, lightC, (0.05 + 0.03 * float(sub)) * aN * lmY2);\n      lightC *= 1.0 + max(1.0 - float(sub), 0.0) * pow(noon, 20.0) * (aN * aN * 0.8 - aE2 * 0.2);\n    } else if (dim == 1) {\n      dirShade *= dirShade;\n      ambC += vec3(0.15, 0.06, 0.01) * pow2f(aN * 0.5 + max(-NdotU, 0.0)) * (0.7 + 0.35 * vsB);\n    }\n  }\n  vec3 scene = lightC * shadow + ambC * ambMult;\n  float ao = vao;\n  if (sub != 0) ao = mix(min(ao * 1.15, 1.0), 1.0, shF);\n  else {\n    ao = min(ao + 0.08, 1.0);\n    if (ow) ao = pow(pow1_5(ao), 1.0 + dot(scene, scene) * 0.02 + max(NdotU, 0.0) * (0.15 + 0.25 * pow2f(noon * lmY2 * lmY2)));\n    else if (dim == 1) ao = pow(pow1_5(ao), 1.0 + max(NdotU, 0.0) * 0.5);\n    else ao = pow(ao, 0.75 + max(NdotU, 0.0) * 0.25);\n    ao = ao * 0.9 + 0.1;\n  }\n  vec3 hl = vec3(0.0);\n  if (dim != 1 && shadow > 0.0) {\n    float spec = ggx(n, V, u_sunDir, smoothG) * hlMult;\n    hl = vec3(u_eyeWater < 0.5 ? shadow : pow(shadow, 0.25) * 0.35) * (subHL + spec) * u_hlCol;\n  }\n  vec3 fd = pow2f(dirShade * ao) * (blockL + scene * scene + minL) + emission * emission;\n  return alb * sqrt(max(fd, vec3(0.0))) + hl;\n}\n",
  FX_MATERIAL =
    "\nvoid fxMaterial(int cls, inout vec3 c, out float sG, out float hl, out float sD, out float metal){\n  sG = 0.0; hl = 1.0; sD = 0.0; metal = 0.0;\n  float l = lum(c), g4 = c.g * c.g * c.g * c.g, mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));\n  if (cls == 1) { sG = min(g4 * 2.0, 1.0); sD = sG; }\n  else if (cls == 2) { sG = min(l * l * l * l * 1.1, 1.0) * 0.75; sD = sG; }\n  else if (cls == 3) { sG = 0.1 + l * 0.4; sD = sG; hl = 1.5; }\n  else if (cls == 4) { float r4 = l * l * l * l; sG = min(r4 * 0.8 + 0.25, 1.0); hl = sG * 3.0; sD = sG; metal = 1.0; c *= 0.6 + 0.5 * l; }\n  else if (cls == 5) { float f = max(c.g, 0.8); sG = f - g4 * 0.4; hl = 3.0 * max(f * f * f * f, 0.2); sD = f * f * 0.6; metal = 0.5; c *= 0.7 + 0.4 * l; }\n  else if (cls == 6) {\n    if (mx - mn > 0.18 || mx > 0.85) { sG = 0.85; hl = 2.5; sD = 0.5; metal = 0.5; }\n    else { sG = min(g4 * 2.0, 1.0); sD = sG; }\n  }\n  else if (cls == 7) { sG = min(pow(c.g, 16.0) * 2.0, 1.0); sD = sG; hl = 2.0; }\n  else if (cls == 8) { sG = c.r * 0.1 + 0.1; }\n  else if (cls == 9) { sG = c.g * c.g; }\n  else if (cls == 10) { sG = (1.0 - pow(c.g, 64.0) * 0.3) * 0.4; sD = sG; hl = 2.0; }\n  else if (cls == 11) { sG = 0.85; sD = 0.65; hl = 2.0; }\n  else if (cls == 12) { sG = l * l * 0.45; sD = sG * 0.4; }\n  else if (cls == 13) { float f = max(0.3 - abs(c.r - 0.3), 0.0) * 1.5; sG = min(f, 1.0); hl = 2.0 + min(f * 2.0, 1.0) * 1.5; sD = min(f + 0.07, 1.0); metal = 0.5; }\n  else if (cls == 14) { sG = 0.3; sD = 0.15; }\n  else if (cls == 15) { sG = c.r * 0.2; }\n}\n",
  FXCHUNK_VS = `#version 300 es\nlayout(location=0) in vec4 a_pos;\nlayout(location=1) in vec2 a_uv;\nlayout(location=2) in uvec2 a_tex;\nlayout(location=3) in vec4 a_col;\nlayout(location=4) in vec2 a_light;\nlayout(location=5) in uint a_anim;\nuniform mat4 u_vp; uniform mat4 u_model; uniform int u_sec;\nuniform vec3 u_cam; uniform float u_tick; uniform vec3 u_lightOv; uniform float u_time; uniform float u_wave;\ninvariant gl_Position; // the depth pre-pass runs this same vertex shader and must land on the same depths\nuniform highp sampler2D u_mat;\nout vec2 v_uv; flat out uint v_layer; flat out uint v_overlay; out vec4 v_col; out vec2 v_light; out float v_dist;\nout vec3 v_wpos; flat out int v_mat; flat out int v_cls;\nvoid main(){\n  vec4 wp = u_model * vec4(a_pos.xyz,1.0);\n  vec4 mt = texelFetch(u_mat, ivec2(int(a_tex.x) & 1023, int(a_tex.x) >> 10), 0);\n  int mat = int(mt.r * 255.0 + 0.5);\n  if (u_wave > 0.0) {\n    float t = u_time * 0.001;\n    if (mat == 1) {\n      wp.x += sin(t * 1.6 + wp.z * 0.7 + wp.y * 0.4) * 0.035;\n      wp.z += cos(t * 1.25 + wp.x * 0.6 + wp.y * 0.3) * 0.035;\n      wp.y += sin(t * 2.1 + wp.x * 0.9 + wp.z * 0.8) * 0.018;\n    } else if (mat == 3 && fract(wp.y) > 0.5) {\n      wp.y += (sin(t * 1.4 + wp.x * 0.85 + wp.z * 0.3) + cos(t * 1.1 + wp.z * 0.75 - wp.x * 0.2)) * 0.022 - 0.045;\n    }${PLANT_WAVE}\n  }\n  gl_Position = u_vp * wp;\n  v_uv = a_uv;\n  uint layer = a_tex.x;\n  uint anim = u_sec == 1 ? uint(a_pos.w * 65535.0 + 0.5) : a_anim;\n  if (anim > 0u) layer += uint(floor(u_tick / 2.0)) % anim;\n  v_layer = layer; v_overlay = a_tex.y;\n  v_col = a_col;\n  v_light = u_lightOv.z > 0.5 ? u_lightOv.xy : a_light;\n  v_dist = length(wp.xz - u_cam.xz);\n  float dy = abs(wp.y - u_cam.y); v_dist = max(v_dist, dy * 0.5);\n  v_wpos = wp.xyz; v_mat = mat; v_cls = int(mt.g * 255.0 + 0.5);\n}`,
  FXDEPTH_FS =
    "#version 300 es\nprecision highp float; precision highp sampler2DArray;\nuniform sampler2DArray u_tex; uniform float u_alphaTest;\nin vec2 v_uv; flat in uint v_layer; flat in uint v_overlay;\nout vec4 o;\nvoid main(){ if (v_overlay < 0x8000u && texture(u_tex, vec3(v_uv, float(v_layer))).a < u_alphaTest) discard; o = vec4(0.0); }",
  FXCHUNK_FS = `#version 300 es\nprecision highp float; precision highp sampler2DArray;\nuniform sampler2DArray u_tex;\nuniform float u_day; uniform vec3 u_fogColor; uniform vec2 u_fog; uniform float u_alphaTest; uniform vec4 u_colorMul;\nuniform float u_gamma; uniform vec3 u_nightTint; uniform vec3 u_ambient;\nuniform uint u_portalLayer; uniform sampler2D u_portalTex; uniform float u_time; uniform vec2 u_res;\nuniform vec3 u_cam; uniform int u_pass; uniform mat4 u_vp; uniform mat4 u_invVP;\nuniform sampler2D u_sceneColor; uniform highp sampler2D u_sceneDepth; uniform vec2 u_nf; uniform int u_ssr;\nuniform sampler2D u_waveTex;\n${FX_SKY}\n${FX_COMMON}\n${FX_MATERIAL}\nin vec2 v_uv; flat in uint v_layer; flat in uint v_overlay; in vec4 v_col; in vec2 v_light; in float v_dist;\nin vec3 v_wpos; flat in int v_mat; flat in int v_cls;\nout vec4 o;\nfloat linZ(float d){ float z = d * 2.0 - 1.0; return 2.0 * u_nf.x * u_nf.y / (u_nf.y + u_nf.x - z * (u_nf.y - u_nf.x)); }\n#ifdef FX_TRANSLUCENT\n// screen-space reflection along R from the surface at wp; a = 0 when it leaves the screen without a hit\nvec4 ssr(vec3 wp, vec3 R){\n  vec3 rp = wp; float stepL = 0.35;\n  for (int i = 0; i < 32; i++) {\n    rp += R * stepL; stepL *= 1.12;\n    vec4 cp = u_vp * vec4(rp, 1.0);\n    if (cp.w <= 0.0) break;\n    vec3 nd = cp.xyz / cp.w; vec2 uv = nd.xy * 0.5 + 0.5;\n    if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) break;\n    float sd = texture(u_sceneDepth, uv).r;\n    if (sd >= 0.99999) continue;\n    float rd = linZ(nd.z * 0.5 + 0.5), sz = linZ(sd);\n    if (rd > sz && rd - sz < stepL * 2.5 + 0.5) {\n      vec2 ed = abs(uv - 0.5) * 2.0;\n      return vec4(texture(u_sceneColor, uv).rgb, 1.0 - smoothstep(0.75, 1.0, max(ed.x, ed.y)));\n    }\n  }\n  return vec4(0.0);\n}\n#endif\nvoid main(){\n  if (v_layer == u_portalLayer) { // (integers: see render.js CHUNK_FS)\n    vec2 sc = gl_FragCoord.xy / u_res.y;\n    vec3 col = vec3(0.035, 0.07, 0.09);\n    for (int i = 0; i < 6; i++) {\n      float fi = float(i), s = 0.6 + fi * 0.35, a = fi * 1.3;\n      mat2 r = mat2(cos(a), -sin(a), sin(a), cos(a));\n      vec2 uv = r * sc * s + vec2(u_time * 0.000012 * (fi + 2.0), u_time * 0.000018 * (7.0 - fi));\n      col += texture(u_portalTex, uv).rgb * vec3(0.4 + 0.1 * sin(fi), 0.6 + 0.15 * cos(fi * 2.0), 0.7 + 0.2 * sin(fi * 3.0)) * (0.5 + 0.12 * fi);\n    }\n    o = vec4(col * 1.3, 1.0);\n    return;\n  }\n  vec4 t = texture(u_tex, vec3(v_uv, float(v_layer)));\n  vec3 c;\n  uint ovl = v_overlay & 0x7fffu;\n  if (v_overlay >= 0x8000u) t.a = 1.0; // 图形品质 流畅: leaves drawn solid\n  int cls = v_cls;\n  if (ovl > 0u) {\n    vec4 ov = texture(u_tex, vec3(v_uv, float(ovl)));\n    c = mix(t.rgb, ov.rgb * v_col.rgb, ov.a);\n    if (ov.a > 0.5) cls = 9;\n  } else c = t.rgb * v_col.rgb;\n  if (t.a < u_alphaTest) discard;\n  // (a zero cross product - a sliver of a triangle, or far out where a phone's half precision loses the position's low\n  // bits - normalized to NaN; and a single NaN pixel spreads through the bloom chain into a black patch). The length\n  // squared goes as the pixel's size in blocks to the 4th: a wall a block away on a 2560 wide screen is ~1e-13, a\n  // spyglass far less - a cut at 1e-12 lit those walls as floors (the whole wall 42 levels off at FOV 10), so only\n  // what is next to zero is left out\n  vec3 nc = cross(dFdx(v_wpos), dFdy(v_wpos)); float nl2 = dot(nc, nc);\n  vec3 n = nl2 > 1e-30 ? nc * inversesqrt(nl2) : vec3(0.0, 1.0, 0.0);\n  vec3 V = normalize(u_cam - v_wpos);\n  if (dot(n, V) < 0.0) n = -n;\n  // the mesher's shade is vanilla's face shading (top 1, north / south 0.8, east / west 0.6, bottom 0.5) times its\n  // AO; the lighting here shades by direction itself, so only the AO is kept\n  vec3 an = abs(n);\n  float faceShade = an.y > 0.5 ? (n.y > 0.0 ? 1.0 : 0.5) : an.z > an.x ? 0.8 : 0.6;\n  float ao = clamp(v_col.a / faceShade, 0.0, 1.0);\n  vec3 lit;\n  float alpha = t.a;\n  bool open = u_tf2.w < 0.5 && u_eyeWater < 0.5;\n#ifdef FX_TRANSLUCENT\n  if (v_mat == 3) {\n    // ---- water: the vanilla texture tinted by the biome colour, clearer where shallow, foam along shores,\n    // sun highlight and reflections (screen space, else the sky)\n    vec2 suv = gl_FragCoord.xy / u_res;\n    vec3 tint = v_col.rgb;\n    vec3 glM = vec3(tint.r, max(tint.g, 0.39), tint.b); glM = glM * (2.0 - glM) * vec3(1.0, 0.85, 0.8);\n    vec3 cP = t.rgb;\n    vec3 wc = cP * cP * glM;\n    float fn = texture(u_waveTex, (floor(v_wpos.xz * 16.0) / 16.0) * 0.05 + vec2(u_time * 0.00002, -u_time * 0.00001)).a - 0.5;\n    wc = pow(wc, vec3(1.0 + fn * 0.25));\n    alpha = t.a * (2.0 - t.a);\n    float reflectMult = 1.0;\n    float fres = clamp(1.0 - dot(n, V), 0.0, 1.0), fres2 = fres * fres, fres4 = fres2 * fres2;\n    if (u_eyeWater < 0.5) {\n      float bd = texture(u_sceneDepth, suv).r;\n      float front = linZ(gl_FragCoord.z), back = linZ(bd);\n      float k = length(v_wpos - u_cam) / max(front, 1e-3);\n      float wFog = bd >= 0.99999 ? 1.0 : 1.0 - exp(-max(back - front, 0.0) * k * 0.075);\n      alpha *= 0.25 + 0.75 * wFog;\n      float wf2 = 1.0 - pow2f(pow2f(1.0 - wFog));\n      wc *= 2.5 - wf2 - 0.5 * v_light.x;\n      if (n.y > 0.99 && bd < 0.99999) {\n        vec4 fp = u_invVP * vec4(suv * 2.0 - 1.0, bd * 2.0 - 1.0, 1.0);\n        float yDif = fp.y / fp.w - v_wpos.y;\n        float cpm = dot(cP, cP), thr = min(cpm * cpm * 1.6, 1.2);\n        float foam = pow2f(clamp((thr + yDif) / thr, 0.0, 1.0)) * (0.4 + 0.25 * v_light.x) * clamp((fract(v_wpos.y) - 0.7) * 10.0, 0.0, 1.0);\n        wc = mix(wc, vec3(0.9, 0.95, 1.05), foam);\n        alpha = mix(alpha, 1.0, foam);\n        reflectMult = 1.0 - foam;\n      }\n    } else reflectMult = 0.5;\n    reflectMult *= 0.5 + 0.5 * max(n.y, 0.0);\n    float hl = min(pow2f(pow2f(dot(cP, cP) * 0.4)), 0.5) * (16.0 - 15.0 * fres2) * (u_skyK.w > 0.5 ? 0.85 : 0.425);\n    lit = fxShade(wc, n, v_wpos, V, v_light, 1.0, 0, 0.5, hl, 0.0, true);\n    vec3 R = reflect(-V, n);\n    vec3 refl = open ? fxSky(R, true, true) * sstep1(v_light.x) : u_fogColor * 0.5;\n    if (u_ssr == 1) { vec4 s = ssr(v_wpos, R); refl = mix(refl, s.rgb, s.a); }\n    float fresM = (fres * fres2 * 0.85 + 0.15) * reflectMult;\n    lit = mix(lit, refl, fresM);\n    alpha = mix(alpha, 1.0, fres4);\n  } else\n#endif\n  {\n    float sG, hl, sD, metal; int sub = 0; float emission = 0.0; bool noDir = false;\n    fxMaterial(cls, c, sG, hl, sD, metal);\n    vec2 lm = v_light;\n    if (v_mat == 1) {\n      sub = 2;\n      float f = min(pow2f(c.g - 0.15 * (c.r + c.b)) * 2.5, 1.0);\n      sG = f * 0.4; hl = (f * 4.0 + 2.0) * (1.0 - pow2f(pow2f(clamp(1.0 - dot(n, V), 0.0, 1.0))));\n    } else if (v_mat == 2 || (v_mat >= 6 && v_mat <= 8)) sub = 1;\n    else if (v_mat == 5) { emission = lum(c) * 7.48 + 0.5; lm = vec2(0.0); noDir = true; c *= 0.84; }\n    else if (v_mat == 4) emission = 2.6 * smoothstep(0.3, 0.92, max(c.r, max(c.g, c.b)));\n    lit = fxShade(c, n, v_wpos, V, lm, ao, sub, sG, hl, emission, noDir);\n#ifdef FX_TRANSLUCENT\n    // glass, ice, stained glass: a sky reflection at grazing angles\n    float fr = clamp(1.0 - dot(n, V), 0.0, 1.0);\n    if (open) lit = mix(lit, fxSky(reflect(-V, n), true, true) * sstep1(v_light.x), (fr * fr * fr * 0.85 + 0.15) * 0.5);\n#else\n    // (rough blocks - stone, dirt - only get the sun highlight: a sky reflection made them look wet and blue)\n    if (sD > 0.25 && open && v_light.x > 0.5) {\n      // smooth blocks pick up a little of the sky (tinted by metals): the horizon colour blending up into the zenith\n      vec3 R = reflect(-V, n);\n      float fr = clamp(1.0 - dot(n, V), 0.0, 1.0);\n      float k = (fr * fr * fr * 0.85 + 0.15) * sD * sD * smoothstep(0.5, 1.0, v_light.x);\n      vec3 refl = mix(u_skyMid, u_skyUp, sD * sqrt(max(R.y, 0.0))) * mix(vec3(1.0), c * 1.5, metal);\n      lit = mix(lit, refl * min(lum(lit) * 3.0 + 0.3, 1.0), k * (0.35 + 0.65 * metal));\n    }\n#endif\n  }\n  float f = clamp((v_dist - u_fog.x) / (u_fog.y - u_fog.x), 0.0, 1.0);\n  lit = mix(lit, u_fogColor, f);\n  o = vec4(lit, alpha) * u_colorMul;\n}`,
  FXENT_VS =
    "#version 300 es\nlayout(location=0) in vec3 a_pos; layout(location=1) in vec2 a_uv; layout(location=2) in vec3 a_n;\nuniform mat4 u_vp; uniform mat4 u_model; uniform vec3 u_cam;\nout vec2 v_uv; out vec3 v_n; out vec3 v_wpos; out float v_dist;\nvoid main(){\n  vec4 wp = u_model * vec4(a_pos,1.0);\n  gl_Position = u_vp * wp;\n  v_uv = a_uv; v_n = mat3(u_model) * a_n; v_wpos = wp.xyz;\n  v_dist = length(wp.xz - u_cam.xz);\n}",
  FXENT_FS = `#version 300 es\nprecision highp float;\nuniform sampler2D u_tex; uniform vec2 u_light; uniform float u_day; uniform vec4 u_overlay; uniform vec3 u_tint;\nuniform vec3 u_fogColor; uniform vec2 u_fog; uniform float u_gamma; uniform vec3 u_nightTint; uniform vec3 u_ambient; uniform float u_bright; uniform float u_fade;\nuniform vec3 u_cam;\n${FX_SKY}\n${FX_COMMON}\nin vec2 v_uv; in vec3 v_n; in vec3 v_wpos; in float v_dist; out vec4 o;\nvoid main(){\n  vec4 t = texture(u_tex, v_uv);\n  if (t.a < 0.1) discard;\n  vec3 c = t.rgb * u_tint;\n  c = mix(c, u_overlay.rgb, u_overlay.a);\n  float nl2 = dot(v_n, v_n);\n  vec3 n = nl2 > 1e-12 ? v_n * inversesqrt(nl2) : vec3(0.0, 1.0, 0.0); // (a model's zero normal: no NaN, see FXCHUNK_FS)\n  vec3 V = normalize(u_cam - v_wpos);\n  if (dot(n, V) < 0.0) n = -n;\n  // the hand is drawn around the camera at the origin: its light is the light where the camera is\n  bool hand = dot(u_cam, u_cam) < 1e-8 && dot(u_fxCam, u_fxCam) > 1e-6;\n  vec3 wp = hand ? u_fxCam : v_wpos;\n  vec3 lit = fxShade(c, n, wp, V, u_light, 1.0, 0, 0.0, 1.0, 0.0, false);\n  vec3 disp = mix(lit, c * 1.1, u_bright);\n  float f = clamp((v_dist - u_fog.x) / (u_fog.y - u_fog.x), 0.0, 1.0);\n  o = vec4(mix(disp, u_fogColor, f), t.a * (1.0 - u_fade));\n}`,
  FXSHADOW_VS = `#version 300 es\nlayout(location=0) in vec3 a_pos; layout(location=1) in vec2 a_uv; layout(location=2) in uvec2 a_tex;\nuniform mat4 u_vp; uniform mat4 u_model; uniform float u_time; uniform highp sampler2D u_mat;\nout vec2 v_uv; flat out uint v_layer; flat out uint v_ov;\nvoid main(){\n  vec3 wp = (u_model * vec4(a_pos, 1.0)).xyz;\n  int mat = int(texelFetch(u_mat, ivec2(int(a_tex.x) & 1023, int(a_tex.x) >> 10), 0).r * 255.0 + 0.5);\n  float t = u_time * 0.001;\n  if (mat == 1) { wp.x += sin(t * 1.6 + wp.z * 0.7 + wp.y * 0.4) * 0.035; wp.z += cos(t * 1.25 + wp.x * 0.6 + wp.y * 0.3) * 0.035; }\n${PLANT_WAVE}\n  gl_Position = u_vp * vec4(wp, 1.0);\n  v_uv = a_uv; v_layer = a_tex.x; v_ov = a_tex.y;\n}`,
  FXSHADOW_FS =
    "#version 300 es\nprecision highp float; precision highp sampler2DArray;\nuniform sampler2DArray u_tex;\nin vec2 v_uv; flat in uint v_layer; flat in uint v_ov; out vec4 o;\nvoid main(){ if (v_ov < 0x8000u && texture(u_tex, vec3(v_uv, float(v_layer))).a < 0.35) discard; o = vec4(1.0); }",
  FXENTSHADOW_VS =
    "#version 300 es\nlayout(location=0) in vec3 a_pos; layout(location=1) in vec2 a_uv;\nuniform mat4 u_vp; uniform mat4 u_model; out vec2 v_uv;\nvoid main(){ gl_Position = u_vp * u_model * vec4(a_pos, 1.0); v_uv = a_uv; }",
  FXENTSHADOW_FS =
    "#version 300 es\nprecision highp float;\nuniform sampler2D u_tex; in vec2 v_uv; out vec4 o;\nvoid main(){ if (texture(u_tex, v_uv).a < 0.1) discard; o = vec4(1.0); }",
  POST_VS =
    "#version 300 es\nconst vec2 P[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));\nout vec2 v_uv;\nvoid main(){ v_uv = P[gl_VertexID] * 0.5 + 0.5; gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }",
  POST_HEAD =
    "#version 300 es\nprecision highp float;\nin vec2 v_uv; out vec4 o;\nuniform vec2 u_texel; uniform vec2 u_nf; uniform mat4 u_invVP; uniform vec3 u_cam; uniform float u_frame;\nvec3 worldPos(vec2 uv, float d){ vec4 p = u_invVP * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return p.xyz / p.w; }\nfloat ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }\nfloat lum(vec3 c){ return dot(c, vec3(0.2125, 0.7154, 0.0721)); }\n",
  VOL_FS =
    POST_HEAD +
    "\nuniform highp sampler2D u_depth; uniform highp sampler2DArrayShadow u_shadow; uniform mat4 u_shadowVP[3]; uniform vec3 u_sunDir; uniform float u_shadowRange[3];\nuniform vec3 u_vlCol; uniform int u_samples; uniform float u_maxD; uniform float u_shadowD; uniform vec4 u_vlK; // night, eye sky light, sun up, -\nfloat volLit(vec3 wp){\n  for (int i = 1; i < 3; i++) {\n    vec4 sp = u_shadowVP[i] * vec4(wp, 1.0); vec3 s = sp.xyz / sp.w * 0.5 + 0.5;\n    if (s.x < 0.0 || s.y < 0.0 || s.x > 1.0 || s.y > 1.0) continue;\n    return texture(u_shadow, vec4(s.xy, float(i), s.z - 0.5 / u_shadowRange[i]));\n  }\n  return u_vlK.y;\n}\nfloat wgt(float d){ float x = pow(clamp(d / u_maxD, 0.0, 1.0), 0.9); return x * x * (3.0 - 2.0 * x); }\nvoid main(){\n  float d = texture(u_depth, v_uv).r;\n  if (d < 0.01) { o = vec4(0.0); return; }\n  bool sky = d >= 0.99999;\n  vec3 ray = worldPos(v_uv, min(d, 0.99999)) - u_cam;\n  float lv = sky ? u_maxD : length(ray); vec3 dir = normalize(ray);\n  float rayEnd = min(lv, u_maxD), thr = min(u_shadowD, u_maxD);\n  float jit = fract(ign(gl_FragCoord.xy) + u_frame * 0.618034);\n  float acc = 0.0, last = 0.0, lastD = 1.0;\n  for (int i = 0; i < 16; i++) {\n    if (i >= u_samples) break;\n    float tt = (float(i) + jit) / float(u_samples);\n    float nd = tt * tt * thr;\n    if (nd >= rayEnd) break;\n    lastD = volLit(u_cam + dir * nd);\n    acc += lastD * (wgt(nd) - wgt(last));\n    last = nd;\n  }\n  // the rest of the way: past the shadow maps lit by how open the sky is where the camera is\n  acc += (rayEnd > thr ? u_vlK.y : lastD) * (wgt(rayEnd) - wgt(last));\n  float VdotL = dot(dir, u_sunDir), VdotU = max(dir.y, 0.0);\n  float vdlm = max((VdotL + 1.0) * 0.5, 0.0);\n  float vdum = 1.0 - VdotU; vdum *= vdum; vdum = vdum * vdum * (3.0 - 2.0 * vdum);\n  vdum = pow(vdum, min(lv / u_maxD, 1.0) * 3.0);\n  float m = mix(vdum * vdlm, 1.0, 0.4 * u_vlK.x);\n  if (u_vlK.z < 0.5) m *= 0.3 + 0.4 * u_vlK.w + 0.5 * max(u_maxD - lv, 0.0) / u_maxD;\n  o = vec4(u_vlCol * acc * m, 1.0);\n}",
  CLOUD_FS =
    POST_HEAD +
    `\nuniform highp sampler2D u_depth; uniform sampler2D u_cloudNoise;\nuniform vec4 u_cloud; // wind, altitude (middle), view limit, rain\nuniform vec3 u_cAmb; uniform vec3 u_cLight;\n${FX_SKY}\nconst float ST = 16.0, TALL = 32.0, NARROW = 0.00012;\nfloat noise3(vec3 p){\n  p.z = fract(p.z) * 128.0;\n  float iz = floor(p.z), fz = p.z - iz;\n  float a = textureLod(u_cloudNoise, p.xy + vec2(23.0, 29.0) * iz / 128.0, 0.0).r;\n  float b = textureLod(u_cloudNoise, p.xy + vec2(23.0, 29.0) * (iz + 1.0) / 128.0, 0.0).r;\n  return mix(a, b, fz);\n}\nfloat cloudNoise(vec3 p, float relY){\n  vec3 q = p * NARROW;\n  float wind = u_cloud.x, n = 0.0, w = 1.0, tot = 0.0;\n  for (int i = 0; i < 4; i++) { n += noise3(q - vec3(0.0, 0.0, wind)) * w; tot += w; q *= 3.0; wind *= 0.5; w *= 0.5; }\n  n /= tot; n *= n;\n  n *= 1.14 * (0.8 + 0.1 * clamp(-relY / TALL, 0.0, 1.0) + 0.4 * u_cloud.w);\n  float th = clamp(abs(u_cloud.y - p.y) / ST, 0.001, 0.999); th *= th; th *= th; th *= th;\n  return n - (th * 0.2 + 0.25);\n}\nvoid main(){\n  float d = texture(u_depth, v_uv).r;\n  if (d < 0.01) { o = vec4(0.0); return; }\n  vec3 ray = worldPos(v_uv, min(d, 0.99999)) - u_cam;\n  float sceneDist = d >= 0.99999 ? 1e9 : length(ray);\n  vec3 dir = normalize(ray);\n  float alt = u_cloud.y, y0 = alt - ST, y1 = alt + ST, t0, t1;\n  if (abs(dir.y) < 1e-4) {\n    if (u_cam.y < y0 || u_cam.y > y1) { o = vec4(0.0); return; }\n    t0 = 0.0; t1 = u_cloud.z;\n  } else {\n    float ta = (y0 - u_cam.y) / dir.y, tb = (y1 - u_cam.y) / dir.y;\n    t0 = max(min(ta, tb), 0.0); t1 = max(ta, tb);\n  }\n  float lim = u_cloud.z, hxz = max(length(dir.xz), 1e-4);\n  t1 = min(min(t1, lim / hxz), sceneDist);\n  if (t1 <= t0) { o = vec4(0.0); return; }\n  float stepL = max(32.0, (t1 - t0) / 48.0);\n  int n = int((t1 - t0) / stepL) + 1;\n  float jit = fract(ign(gl_FragCoord.xy) + u_frame * 0.618034);\n  float VdotS = dot(dir, u_sunVec), sunVis = u_skyK.w, rain = u_cloud.w;\n  float v1 = max(sunVis > 0.5 ? VdotS : -VdotS, 0.0), v1m = v1 * (1.0 - rain);\n  float v2 = v1 * v1 * abs(sunVis - 0.5) * 2.0, v3 = v2 * (2.5 + rain) + 1.5 * rain, v4 = pow(v1m, 100.0) * sunVis;\n  float edge = 0.5 + 10.0 * pow(v1m, 90.0);\n  vec3 sky = fxSky(dir, true, false), col = vec3(0.0);\n  float a = 0.0;\n  for (int i = 0; i < 48; i++) {\n    if (i >= n) break;\n    float t = t0 + (float(i) + jit) * stepL;\n    if (t > t1) break;\n    vec3 p = u_cam + dir * t;\n    float cn = cloudNoise(p, p.y - u_cam.y);\n    if (cn <= 0.00001) continue;\n    float op = min(cn * 8.0, 1.0);\n    float sh = 1.0 - (y1 - p.y) / TALL;\n    sh *= 1.0 + 0.2 * v3 * (1.0 - op) + v4;\n    vec3 c = u_cAmb * (0.4 + 0.6 * sh) + u_cLight * sh;\n    float ratio = clamp((lim - length(p.xz - u_cam.xz)) / lim, 0.0, 1.0);\n    float p15 = ratio - ratio * (1.0 - ratio) * (1.0 - ratio);\n    c = mix(sky, c, p15 * p15 * 0.69 * 0.69);\n    col = mix(col, c, 1.0 - min(a, 1.0));\n    a += op * pow(min(ratio, 0.8) * 1.25, edge);\n    if (a > 0.9) { a = 1.0; break; }\n  }\n  a = min(a, 1.0);\n  o = vec4(col * a, a);\n}`,
  COMPOSE_FS =
    POST_HEAD +
    `\nuniform sampler2D u_color; uniform highp sampler2D u_depth; uniform highp sampler2D u_depthO; uniform sampler2D u_clouds; uniform sampler2D u_vol;\nuniform int u_useClouds, u_useVol, u_skyOn, u_fogOn; uniform vec2 u_cloudSlab;\nuniform vec3 u_sunDisc; uniform float u_renderD; uniform float u_yOff;\nuniform vec4 u_fogK;  // rain, eye sky light (smoothed), cave factor, screen brightness\nuniform vec4 u_atmK;  // inverse night factor, sun visibility^2, noon, sun factor\nuniform vec3 u_nightUp; uniform vec3 u_dayDownFog;\nuniform vec4 u_misc;  // rainbow, underwater, aurora, bloom fog mult\nuniform sampler2D u_noise; uniform float u_time;\n${FX_SKY}\nfloat altF(float y){ float a = 1.0 - clamp(y - 63.1, 0.0, 60.0) / 60.0; return a * a; }\nvec3 rainbow(vec3 dir){\n  float a = dot(dir, -u_sunVec);\n  float x = (a - 0.715) / 0.055; // 0..1 across the bow (about 42 degrees from the point opposite the sun)\n  if (x < 0.0 || x > 1.0) return vec3(0.0);\n  vec3 c = clamp(abs(fract(x * 0.8 + vec3(0.0, 0.333, 0.667)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);\n  return c * sin(x * 3.14159) * smoothstep(-0.05, 0.25, dir.y);\n}\n// aurora: a few thin bands in a sheet high up, swaying (snowy biomes at night)\nvec3 aurora(vec3 dir){\n  if (dir.y < 0.05) return vec3(0.0);\n  vec3 acc = vec3(0.0);\n  for (int i = 0; i < 8; i++) {\n    float h = 1.0 + float(i) * 0.06;\n    vec2 p = dir.xz / dir.y * h * 0.35 + vec2(u_time * 0.000004, 0.0);\n    float n = textureLod(u_noise, p * 0.6, 0.0).a;\n    float band = (1.0 - smoothstep(0.0, 0.035, abs(n - 0.5))) * textureLod(u_noise, p * 0.13 + 0.3, 0.0).b;\n    acc += mix(vec3(0.1, 1.0, 0.45), vec3(0.6, 0.25, 1.0), float(i) / 7.0) * band;\n  }\n  return acc * 0.06 * smoothstep(0.05, 0.3, dir.y);\n}\n// the sky in direction dir: (not darkened below the horizon: the border fog fades the terrain into this same colour)\nvec3 skyCol(vec3 dir){\n  vec3 s = fxSky(dir, true, false);\n  float mu = dot(dir, u_sunVec);\n  s += u_sunDisc * smoothstep(0.99955, 0.99975, mu);\n  if (u_misc.x > 0.0) s += rainbow(dir) * u_misc.x * 0.12;\n  if (u_misc.z > 0.0) s += aurora(dir) * u_misc.z;\n  return s;\n}\nvoid main(){\n  vec4 c4 = texture(u_color, v_uv);\n  vec3 c = c4.rgb;\n  float d = texture(u_depth, v_uv).r;\n  bool hand = d < 0.01, sky = d >= 0.99999;\n  vec3 ray = worldPos(v_uv, sky ? 0.99999 : d) - u_cam; vec3 dir = normalize(ray);\n  float dist = length(ray);\n  float bf = 1.0;\n  if (!hand) {\n    // translucent blocks (stained glass, ice ...) with only sky behind them: the sky by what they let through (alpha:\n    // render.js drawTranslucent), it was black\n    if (!sky && u_skyOn == 1 && texture(u_depthO, v_uv).r >= 0.99999) c += skyCol(dir) * clamp(c4.a, 0.0, 1.0);\n    if (sky && u_skyOn == 1) {\n      c += skyCol(dir);\n    } else if (!sky && u_fogOn == 1) {\n      float rain = u_fogK.x;\n      // cave fog\n      float cave = u_fogK.z;\n      if (cave > 0.0) c = mix(c, vec3(0.13, 0.13, 0.15) * (0.7 + 0.3 * u_fogK.w), cave * (0.9 - 0.9 * exp(-dist * 0.015)));\n      // atmospheric haze, thickest low down\n      float rdf = min(192.0 / u_renderD, 1.0);\n      float fog = 1.0 - exp(-pow(dist * (0.001 - 0.0007 * rain), 2.0 - rain * rain) * dist * rdf);\n      float wy = u_cam.y + ray.y + u_yOff;\n      float afr = altF(wy), af = afr * 0.9 + 0.1;\n      fog *= 0.95 - 0.1 - 0.15 * (1.0 - rain);\n      float caf = altF(u_cam.y + u_yOff + 15.0);\n      af = mix(af, 1.0, 0.8 * caf); af *= 1.0 - 0.5 * caf * (1.0 - rain);\n      fog *= 0.2 + 0.8 * (1.0 - pow(1.0 - u_fogK.y, 4.0));\n      fog *= (1.0 - cave) * af;\n      if (fog > 0.0) {\n        float VdotS = dot(dir, u_sunVec);\n        float nfm = 2.5 - 0.625 * max(afr * afr * afr * afr, rain);\n        float blend = pow(u_atmK.x, 4.0 - VdotS - 2.5 * u_atmK.y);\n        vec3 fc = mix(u_nightUp * (nfm - blend * nfm), u_dayDownFog, blend);\n        c = mix(c, fc, clamp(fog, 0.0, 1.0));\n      }\n      // border fog: into the sky at the edge of the render distance\n      float bd = max(length(ray.xz), abs(ray.y)) / u_renderD;\n      bd *= bd; bd *= bd; bd *= bd; bd *= bd;\n      bd = 1.0 - exp(-3.0 * bd);\n      if (bd > 0.0) c = mix(c, fxSky(dir, true, false), bd);\n      if (u_misc.x > 0.0 && dist > 48.0) c += rainbow(dir) * u_misc.x * 0.12 * smoothstep(48.0, 128.0, dist);\n    }\n    if (u_useClouds == 1) {\n      float slab = abs(dir.y) < 1e-4 ? 0.0 : ((dir.y > 0.0 ? u_cloudSlab.x : u_cloudSlab.y) - u_cam.y) / dir.y;\n      if (sky || dist > max(slab, 0.0)) { vec4 cl = texture(u_clouds, v_uv); c = c * (1.0 - cl.a) + cl.rgb; }\n    }\n    float lv = sky ? 400.0 : dist;\n    float bfog = 1.0 - exp(-lv * 0.02); bfog *= bfog; bfog *= bfog;\n    bf = 1.0 + bfog * u_misc.w;\n  }\n  if (u_misc.y > 0.5) c *= vec3(0.80, 0.87, 0.97) * 0.85;\n  vec3 lin = pow(max(c, vec3(0.0)), vec3(2.2));\n  if (u_useVol == 1 && !hand) lin += texture(u_vol, v_uv).rgb * (u_misc.y > 0.5 ? 0.25 : 1.0);\n  // a NaN (or infinite) pixel stops here: the bloom below spreads a single one into a black patch\n  lin = mix(vec3(0.0), lin, lessThan(abs(lin), vec3(1e30)));\n  o = vec4(lin, bf);\n}`,
  DOWN0_FS =
    POST_HEAD +
    "\nuniform sampler2D u_src;\nvoid main(){\n  vec4 a = texture(u_src, v_uv + vec2(-0.5, -0.5) * u_texel), b = texture(u_src, v_uv + vec2(0.5, -0.5) * u_texel);\n  vec4 c = texture(u_src, v_uv + vec2(-0.5, 0.5) * u_texel), d = texture(u_src, v_uv + vec2(0.5, 0.5) * u_texel);\n  vec3 s = a.rgb * a.a + b.rgb * b.a + c.rgb * c.a + d.rgb * d.a;\n  o = vec4(min(s * 0.25, vec3(64.0)), 1.0);\n}",
  DOWN_FS =
    POST_HEAD +
    "\nuniform sampler2D u_src;\nvoid main(){\n  vec3 c = texture(u_src, v_uv).rgb * 4.0;\n  c += texture(u_src, v_uv + vec2(-1.0, -1.0) * u_texel).rgb + texture(u_src, v_uv + vec2(1.0, -1.0) * u_texel).rgb;\n  c += texture(u_src, v_uv + vec2(-1.0, 1.0) * u_texel).rgb + texture(u_src, v_uv + vec2(1.0, 1.0) * u_texel).rgb;\n  o = vec4(c / 8.0, 1.0);\n}",
  UP_FS =
    POST_HEAD +
    "\nuniform sampler2D u_src; uniform sampler2D u_add;\nvoid main(){\n  vec3 c = vec3(0.0);\n  c += texture(u_src, v_uv + vec2(-2.0, 0.0) * u_texel).rgb + texture(u_src, v_uv + vec2(2.0, 0.0) * u_texel).rgb;\n  c += texture(u_src, v_uv + vec2(0.0, -2.0) * u_texel).rgb + texture(u_src, v_uv + vec2(0.0, 2.0) * u_texel).rgb;\n  c += (texture(u_src, v_uv + vec2(-1.0, 1.0) * u_texel).rgb + texture(u_src, v_uv + vec2(1.0, 1.0) * u_texel).rgb\n     + texture(u_src, v_uv + vec2(-1.0, -1.0) * u_texel).rgb + texture(u_src, v_uv + vec2(1.0, -1.0) * u_texel).rgb) * 2.0;\n  o = vec4(c / 12.0 + texture(u_add, v_uv).rgb, 1.0);\n}",
  LOTTES_A = 1.05,
  LOTTES_HM = Math.pow(8, 1.05),
  LOTTES_MI = Math.pow(0.25, 1.05),
  LOTTES_B = (0.25 * LOTTES_HM - LOTTES_MI) / (0.25 * (LOTTES_HM - LOTTES_MI)),
  LOTTES_C = (LOTTES_MI * (LOTTES_HM - 0.25 * LOTTES_HM)) / (0.25 * (LOTTES_HM - LOTTES_MI)),
  GRADE_FS =
    POST_HEAD +
    `\nuniform sampler2D u_src; uniform sampler2D u_bloom; uniform float u_bloomK;\nvec3 lottes(vec3 x){ vec3 xa = pow(max(x, vec3(0.0)), vec3(${(1.05).toFixed(4)})); return xa / (xa * ${LOTTES_B.toFixed(6)} + ${LOTTES_C.toFixed(6)}); }\nvec3 toSRGB(vec3 c){ return mix(1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, 12.92 * c, vec3(lessThan(c, vec3(0.0031308)))); }\nvoid main(){\n  vec3 c = texture(u_src, v_uv).rgb;\n  c = mix(c, texture(u_bloom, v_uv).rgb * 0.2, u_bloomK);\n  float L0 = lum(c);\n  vec3 t = toSRGB(clamp(lottes(c), 0.0, 1.0));\n  float dark = 1.0 - smoothstep(0.0, 0.1, L0);\n  t = mix(t, pow(max(c, vec3(0.0)), vec3(1.0 / 2.2)), dark * 0.75);\n  t = mix(t, vec3(1.0), smoothstep(0.0, 16.0, L0));\n  t = mix(t, vec3(lum(t)), dark * 0.25);\n  t = clamp(t, 0.0, 1.0);\n  // a little more saturation\n  float gv = (t.r + t.g + t.b) / 3.0;\n  t = t * 1.07 - gv * 0.07;\n  vec2 q = v_uv - 0.5; t *= 1.0 - dot(q, q) * 0.3;\n  t = clamp(t, 0.0, 1.0);\n  o = vec4(t, dot(t, vec3(0.299, 0.587, 0.114)));\n}`,
  TAA_FS =
    POST_HEAD +
    "\nuniform sampler2D u_cur; uniform sampler2D u_hist; uniform highp sampler2D u_depth; uniform mat4 u_invVPU; uniform mat4 u_prevVP; uniform float u_reset;\nvoid main(){\n  vec4 cur = texture(u_cur, v_uv);\n  vec3 mn = cur.rgb, mx = cur.rgb;\n  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {\n    if (x == 0 && y == 0) continue;\n    vec3 s = texture(u_cur, v_uv + vec2(x, y) * u_texel).rgb; mn = min(mn, s); mx = max(mx, s);\n  }\n  float d = texture(u_depth, v_uv).r;\n  vec2 puv = v_uv;\n  if (d >= 0.01) {\n    vec4 p = u_invVPU * vec4(v_uv * 2.0 - 1.0, min(d, 0.99999) * 2.0 - 1.0, 1.0); p /= p.w;\n    vec4 pc = u_prevVP * vec4(p.xyz, 1.0);\n    puv = pc.xy / pc.w * 0.5 + 0.5;\n  }\n  float w = 0.9;\n  vec2 vel = (puv - v_uv) / u_texel;\n  w = mix(w, 0.65, clamp(length(vel) / 32.0, 0.0, 1.0));\n  if (u_reset > 0.5 || puv.x < 0.0 || puv.y < 0.0 || puv.x > 1.0 || puv.y > 1.0) w = 0.0;\n  vec3 h = clamp(texture(u_hist, puv).rgb, mn, mx);\n  vec3 r = mix(cur.rgb, h, w);\n  o = vec4(r, dot(r, vec3(0.299, 0.587, 0.114)));\n}",
  FINAL_FS =
    POST_HEAD +
    "\nuniform sampler2D u_src; uniform int u_fxaa; uniform float u_sharp;\nvoid main(){\n  vec3 rgbM = texture(u_src, v_uv).rgb;\n  vec3 res = rgbM;\n  if (u_fxaa == 1) {\n    float lM = texture(u_src, v_uv).a;\n    float lNW = texture(u_src, v_uv + vec2(-1.0, -1.0) * u_texel).a, lNE = texture(u_src, v_uv + vec2(1.0, -1.0) * u_texel).a;\n    float lSW = texture(u_src, v_uv + vec2(-1.0, 1.0) * u_texel).a, lSE = texture(u_src, v_uv + vec2(1.0, 1.0) * u_texel).a;\n    float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));\n    if (lMax - lMin >= max(0.0312, lMax * 0.125)) {\n      vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));\n      float red = max((lNW + lNE + lSW + lSE) * 0.03125, 1.0 / 128.0);\n      dir = clamp(dir / (min(abs(dir.x), abs(dir.y)) + red), vec2(-8.0), vec2(8.0)) * u_texel;\n      vec3 a = 0.5 * (texture(u_src, v_uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture(u_src, v_uv + dir * (2.0 / 3.0 - 0.5)).rgb);\n      vec3 b = a * 0.5 + 0.25 * (texture(u_src, v_uv - dir * 0.5).rgb + texture(u_src, v_uv + dir * 0.5).rgb);\n      float lB = dot(b, vec3(0.299, 0.587, 0.114));\n      res = (lB < lMin || lB > lMax) ? a : b;\n    }\n  }\n  if (u_sharp > 0.0) {\n    vec3 nb = texture(u_src, v_uv + vec2(u_texel.x, 0.0)).rgb + texture(u_src, v_uv - vec2(u_texel.x, 0.0)).rgb\n            + texture(u_src, v_uv + vec2(0.0, u_texel.y)).rgb + texture(u_src, v_uv - vec2(0.0, u_texel.y)).rgb;\n    res += (rgbM - nb * 0.25) * u_sharp;\n  }\n  o = vec4(clamp(res, 0.0, 1.0), 1.0);\n}";
function lookAtM(e, t, n, o) {
  let a = t[0] - n[0],
    s = t[1] - n[1],
    i = t[2] - n[2],
    r = Math.hypot(a, s, i);
  ((a /= r), (s /= r), (i /= r));
  let u = o[1] * i - o[2] * s,
    l = o[2] * a - o[0] * i,
    c = o[0] * s - o[1] * a;
  ((r = Math.hypot(u, l, c)), (u /= r), (l /= r), (c /= r));
  const f = s * c - i * l,
    _ = i * u - a * c,
    m = a * l - s * u;
  return (
    e.set([
      u,
      f,
      a,
      0,
      l,
      _,
      s,
      0,
      c,
      m,
      i,
      0,
      -(u * t[0] + l * t[1] + c * t[2]),
      -(f * t[0] + _ * t[1] + m * t[2]),
      -(a * t[0] + s * t[1] + i * t[2]),
      1,
    ]),
    e
  );
}
const V3 = {
  mix: (e, t, n) => [e[0] + (t[0] - e[0]) * n, e[1] + (t[1] - e[1]) * n, e[2] + (t[2] - e[2]) * n],
  mul: (e, t) => [e[0] * t[0], e[1] * t[1], e[2] * t[2]],
  sc: (e, t) => [e[0] * t, e[1] * t, e[2] * t],
  add: (e, t) => [e[0] + t[0], e[1] + t[1], e[2] + t[2]],
  pow: (e, t) => [
    Math.pow(Math.max(e[0], 0), t[0] ?? t),
    Math.pow(Math.max(e[1], 0), t[1] ?? t),
    Math.pow(Math.max(e[2], 0), t[2] ?? t),
  ],
  max: (e, t) => [Math.max(e[0], t[0]), Math.max(e[1], t[1]), Math.max(e[2], t[2])],
  norm: (e) => {
    const t = Math.hypot(e[0], e[1], e[2]) || 1;
    return [e[0] / t, e[1] / t, e[2] / t];
  },
};
function halton(e, t) {
  let n = 1,
    o = 0;
  for (; e > 0;) ((n /= t), (o += n * (e % t)), (e = Math.floor(e / t)));
  return o;
}
class ShaderPack {
  constructor(e) {
    ((this.r = e), (this.level = 0), (this.ok = !0));
    const t = e.gl;
    ((this.floatOK = !!t.getExtension("EXT_color_buffer_float")),
      t.getExtension("OES_texture_float_linear"));
    try {
      ((this.pChunk = compile(t, FXCHUNK_VS, FXCHUNK_FS)),
        (this.pChunkT = compile(
          t,
          FXCHUNK_VS,
          FXCHUNK_FS.replace("#version 300 es\n", "#version 300 es\n#define FX_TRANSLUCENT\n"),
        )),
        (this.pDepth = compile(t, FXCHUNK_VS, FXDEPTH_FS)),
        (this.pEnt = compile(t, FXENT_VS, FXENT_FS)),
        (this.pShadow = compile(t, FXSHADOW_VS, FXSHADOW_FS)),
        (this.pEntShadow = compile(t, FXENTSHADOW_VS, FXENTSHADOW_FS)));
      const P = (e) => compile(t, POST_VS, e);
      ((this.pVol = P(VOL_FS)),
        (this.pCloud = P(CLOUD_FS)),
        (this.pCompose = P(COMPOSE_FS)),
        (this.pDown0 = P(DOWN0_FS)),
        (this.pDown = P(DOWN_FS)),
        (this.pUp = P(UP_FS)),
        (this.pGrade = P(GRADE_FS)),
        (this.pTAA = P(TAA_FS)),
        (this.pFinal = P(FINAL_FS)));
    } catch (e) {
      return (console.warn("shader pack unavailable", e), void (this.ok = !1));
    }
    ((this.targets = {}),
      (this.size = [0, 0]),
      (this.shadowSize = 0),
      (this.cmpSampler = t.createSampler()),
      t.samplerParameteri(this.cmpSampler, t.TEXTURE_COMPARE_MODE, t.COMPARE_REF_TO_TEXTURE),
      t.samplerParameteri(this.cmpSampler, t.TEXTURE_COMPARE_FUNC, t.LEQUAL),
      t.samplerParameteri(this.cmpSampler, t.TEXTURE_MIN_FILTER, t.LINEAR),
      t.samplerParameteri(this.cmpSampler, t.TEXTURE_MAG_FILTER, t.LINEAR),
      t.samplerParameteri(this.cmpSampler, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE),
      t.samplerParameteri(this.cmpSampler, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE),
      (this.shadowVP = new Float32Array(64)),
      (this.shadowTexelW = new Float32Array([0.1, 0.1, 0.1, 0.1])),
      (this.shadowRange = new Float32Array([1, 1, 1, 1])),
      (this.entRec = null),
      (this.entShadowOn = !1),
      (this.invVP = M4.create()),
      (this.invVPU = M4.create()),
      (this.vpU = M4.create()),
      (this.prevVP = M4.create()),
      (this.frameN = 0),
      (this.histOK = !1),
      (this.histI = 0),
      (this.wet = 0),
      (this.eyeSky = 1),
      (this.snowy = 0),
      (this.dry = 0),
      (this.lastT = performance.now()),
      this.buildMaterials());
  }
  buildMaterials() {
    const e = this.r.gl,
      t = new Uint8Array(16384),
      frames = (e) => Math.max(1, ANIM_FRAMES[e] || 1),
      mark = (e, n) => {
        if (!(null == e || e < 0)) for (let o = 0, a = frames(e); o < a; o++) t[4 * (e + o)] = n;
      },
      n = [];
    for (const e in ASSETS.tiles) n[ASSETS.tiles[e]] = e;
    const o = new Set();
    for (const e of BLOCKS)
      if (e && e.tex && e.shape === SH_CUBE) for (const t of [].concat(e.tex)) o.add(t);
    const modelLayers = (e) => {
        const t = new Set();
        for (let n = 0; n < 16; n++)
          try {
            if (e.model) {
              for (const o of e.model(n).els) for (const e in o.faces) t.add(o.faces[e][4]);
              continue;
            }
            const o = vanillaState(e, n, null);
            if (VM.has(o.key))
              for (const e of VM.select(o.key, o.p, 0)) for (const n of e) t.add(n.layer);
          } catch (e) {}
        return t;
      },
      a = new Set();
    for (const e of BLOCKS)
      if (e && e.tex && !(e.light >= 10)) for (const t of [].concat(e.tex)) a.add(t);
    for (const e of BLOCKS) {
      if (!e || !e.tex) continue;
      const t = Array.isArray(e.tex) ? e.tex : [e.tex];
      let s = 0;
      if (
        (e.key.endsWith("leaves")
          ? (s = 1)
          : e.shape === SH_CROSS || e.shape === SH_CROP
            ? (s = "sugar_cane" === e.key ? 6 : 2)
            : e.id === WATER
              ? (s = 3)
              : e.id === LAVA || "magma_block" === e.key
                ? (s = 5)
                : e.light >= 10 && (s = 4),
        s)
      )
        if (e.shape === SH_MODEL) {
          const t = modelLayers(e),
            a = [...t].map((e) => n[e] || "");
          for (const e of t) {
            const t = n[e] || "";
            o.has(e) ||
              t.startsWith("cauldron_") ||
              a.some((e) => e !== t && e.replace(/_lit|_on$/, "") === t) ||
              mark(e, s);
          }
        } else for (const e of t) (4 === s && a.has(e)) || mark(e, s);
    }
    const s =
      /^(weeping|twisting|cave)_vines|^kelp|seagrass|^hanging_roots$|dripleaf_stem|^bamboo$|hanging_moss/;
    for (const e of BLOCKS) {
      if (!e || e.shape !== SH_MODEL || e.solid || !e.needsSupport || e.light >= 10) continue;
      const t = new Map();
      let n = !0;
      for (let o = 0, a = e.states ? e.states.length : 1; o < a && n; o++) {
        let a = null;
        try {
          a = vanillaState(e, o, null);
        } catch (e) {
          continue;
        }
        if (!VM.has(a.key)) {
          n = !1;
          break;
        }
        for (const e of VM.select(a.key, a.p, 0))
          for (const o of e) (o.dir >= 0 && (n = !1), t.set(o.layer, a.p && a.p.half));
      }
      if (!n) continue;
      const o = s.test(e.key) || /^(melon|pumpkin)_stem$/.test(e.key);
      for (const [e, n] of t) mark(e, o ? 6 : "upper" === n ? 8 : "lower" === n ? 7 : 2);
    }
    for (const e of ["water_still", "water_flow"])
      void 0 !== ASSETS.tiles[e] && mark(ASSETS.tiles[e], 3);
    for (const e of ["lava_still", "lava_flow"])
      void 0 !== ASSETS.tiles[e] && mark(ASSETS.tiles[e], 5);
    for (const e of [
      "fire_0",
      "fire_1",
      "torch",
      "glowstone",
      "jack_o_lantern",
      "furnace_front_on",
    ])
      void 0 !== ASSETS.tiles[e] && mark(ASSETS.tiles[e], 4);
    const i = [
      [
        /^(raw_)?(iron|gold|copper|exposed_copper|netherite)_block|^(cut|chiseled)_copper|^exposed_(cut|chiseled)_copper|copper_(bulb|grate|door|trapdoor)|^iron_(bars|door|trapdoor)|^(anvil|chipped_anvil|damaged_anvil)|chain$|^lantern|^soul_lantern|^cauldron|^hopper|^heavy_core|^lightning_rod|rail/,
        4,
      ],
      [
        /^(diamond|emerald|lapis|amethyst|redstone)_block|^budding_amethyst|^amethyst_cluster|^(large|medium|small)_amethyst_bud|^beacon/,
        5,
      ],
      [/_ore$|^ancient_debris|^gilded_blackstone/, 6],
      [/obsidian/, 13],
      [/^(packed_|blue_)?ice$|^frosted_ice/, 11],
      [/^snow|^powder_snow|grass_block_snow/, 10],
      [/^(red_)?sand$|^suspicious_sand/, 7],
      [
        /^polished_|^smooth_|^quartz|^chiseled_quartz|^calcite|^purpur|^prismarine_bricks|^dark_prismarine|^end_stone_bricks|_glazed_terracotta$|^bone_block|^dripstone|^chiseled_polished/,
        3,
      ],
      [/_concrete$/, 14],
      [
        /^(stone|cobblestone|mossy_cobblestone|stone_bricks|mossy_stone_bricks|cracked_stone_bricks|chiseled_stone_bricks|smooth_stone|furnace_|dispenser|dropper|observer|piston|grindstone|stonecutter|infested)/,
        1,
      ],
      [
        /^(granite|diorite|andesite|tuff|deepslate|cobbled_deepslate|chiseled_deepslate|cracked_deepslate|blackstone|basalt|end_stone|sandstone|red_sandstone|cut_sandstone|cut_red_sandstone|chiseled_sandstone|chiseled_red_sandstone|bricks|mud_bricks|terracotta|.*_terracotta|gravel|clay|packed_mud|chiseled_tuff)/,
        2,
      ],
      [
        /^(dirt|coarse_dirt|rooted_dirt|podzol|mycelium|farmland|dirt_path|mud$|soul_soil|soul_sand|grass_block_side|grass_side_base)/,
        8,
      ],
      [/^grass_block_top|^moss_block|^moss_carpet/, 9],
      [
        /_planks$|_log$|_log_top$|_wood$|^stripped_|_stem$|_stem_top$|_hyphae$|^bookshelf|^barrel|^crafting_table|_door_(top|bottom)$|_trapdoor$|^chest_|^composter|^bamboo_block|^bamboo_mosaic/,
        12,
      ],
      [
        /^netherrack|^nether_bricks|^red_nether_bricks|^crimson_nylium|^warped_nylium|^cracked_nether_bricks|^chiseled_nether_bricks/,
        15,
      ],
    ];
    for (const e in ASSETS.tiles) {
      const n = ASSETS.tiles[e];
      if (!e.startsWith("i_"))
        for (const [o, a] of i)
          if (o.test(e)) {
            for (let e = 0, o = frames(n); e < o; e++) t[4 * (n + e) + 1] = a;
            break;
          }
    }
    ((this.matTex = e.createTexture()),
      e.bindTexture(e.TEXTURE_2D, this.matTex),
      e.texImage2D(e.TEXTURE_2D, 0, e.RGBA8, 1024, 4, 0, e.RGBA, e.UNSIGNED_BYTE, t),
      e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.NEAREST),
      e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.NEAREST));
  }
  tex(e, t, n) {
    const o = this.r.gl,
      a = o.createTexture();
    o.bindTexture(o.TEXTURE_2D, a);
    const s = {
      hdr: this.floatOK ? [o.RGBA16F, o.RGBA, o.HALF_FLOAT] : [o.RGBA8, o.RGBA, o.UNSIGNED_BYTE],
      ldr: [o.RGBA8, o.RGBA, o.UNSIGNED_BYTE],
      depth: [o.DEPTH_COMPONENT24, o.DEPTH_COMPONENT, o.UNSIGNED_INT],
    }[n];
    o.texImage2D(o.TEXTURE_2D, 0, s[0], e, t, 0, s[1], s[2], null);
    const i = "depth" === n ? o.NEAREST : o.LINEAR;
    return (
      o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MIN_FILTER, i),
      o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MAG_FILTER, i),
      o.texParameteri(o.TEXTURE_2D, o.TEXTURE_WRAP_S, o.CLAMP_TO_EDGE),
      o.texParameteri(o.TEXTURE_2D, o.TEXTURE_WRAP_T, o.CLAMP_TO_EDGE),
      a
    );
  }
  fbo(e, t) {
    const n = this.r.gl,
      o = n.createFramebuffer();
    return (
      n.bindFramebuffer(n.FRAMEBUFFER, o),
      e && n.framebufferTexture2D(n.FRAMEBUFFER, n.COLOR_ATTACHMENT0, n.TEXTURE_2D, e, 0),
      t && n.framebufferTexture2D(n.FRAMEBUFFER, n.DEPTH_ATTACHMENT, n.TEXTURE_2D, t, 0),
      e || (n.drawBuffers([n.NONE]), n.readBuffer(n.NONE)),
      o
    );
  }
  target(e, t, n, o) {
    const a = this.targets[e];
    if (a && a.w === t && a.h === n) return a;
    const s = this.r.gl;
    a && (s.deleteTexture(a.tex), s.deleteFramebuffer(a.fb));
    const i = this.tex(t, n, o);
    return (
      e.startsWith("hist") && (this.histOK = !1),
      (this.targets[e] = { tex: i, fb: this.fbo(i, null), w: t, h: n })
    );
  }
  ensure() {
    const e = this.r.gl,
      t = this.r.canvas.width,
      n = this.r.canvas.height;
    if (this.size[0] !== t || this.size[1] !== n) {
      for (const t in this.targets)
        (e.deleteTexture(this.targets[t].tex), e.deleteFramebuffer(this.targets[t].fb));
      this.targets = {};
      for (const t of ["sceneColor", "sceneDepth", "copyColor", "copyDepth"])
        this[t] && e.deleteTexture(this[t]);
      for (const t of ["sceneFB", "copyFB"]) this[t] && e.deleteFramebuffer(this[t]);
      ((this.sceneColor = this.tex(t, n, "hdr")),
        (this.sceneDepth = this.tex(t, n, "depth")),
        (this.sceneFB = this.fbo(this.sceneColor, this.sceneDepth)),
        (this.copyColor = this.tex(t, n, "hdr")),
        (this.copyDepth = this.tex(t, n, "depth")),
        (this.copyFB = this.fbo(this.copyColor, this.copyDepth)),
        (this.size = [t, n]),
        (this.histOK = !1));
    }
    const o = FX_CFG[this.level];
    if (o.shadow !== this.shadowSize) {
      if (this.shadowTex) {
        e.deleteTexture(this.shadowTex);
        for (const t of this.shadowFB) e.deleteFramebuffer(t);
        this.shadowTex = null;
      }
      (o.shadow &&
        ((this.shadowTex = this.depthArray(o.shadow, 4)),
        (this.shadowFB = [0, 1, 2, 3].map((t) => {
          const n = e.createFramebuffer();
          return (
            e.bindFramebuffer(e.FRAMEBUFFER, n),
            e.framebufferTextureLayer(e.FRAMEBUFFER, e.DEPTH_ATTACHMENT, this.shadowTex, 0, t),
            e.drawBuffers([e.NONE]),
            e.readBuffer(e.NONE),
            n
          );
        }))),
        (this.shadowSize = o.shadow),
        (this.shadowCache = null));
    }
    (this.lastLevel !== this.level && ((this.lastLevel = this.level), (this.histOK = !1)),
      e.bindFramebuffer(e.FRAMEBUFFER, null));
  }
  atmos(e, t) {
    const n = this.r,
      o = e.sunDir[1],
      a = "overworld" === e.sky && "overworld" === t.dim,
      s = performance.now(),
      i = Math.min(0.25, (s - this.lastT) / 1e3);
    this.lastT = s;
    const c01 = (e) => Math.max(0, Math.min(1, e)),
      sqrt2 = (e) => 1 - Math.pow(1 - c01(e), 4),
      r = c01((o + 0.0625) / 0.125),
      u = r * r,
      l = c01(o < 0 ? (o + 0.375) / 0.75 : (o + 0.03125) / 0.0625),
      c = Math.sqrt(Math.max(o, 0)),
      f = Math.max(-o, 0),
      _ = 1 - c,
      m = _ * _,
      h = Math.pow(2 * Math.abs(r - 0.5), 4),
      v = e.rain || 0,
      d = v * v,
      p = 1 - v,
      x = c01(n.gamma);
    this.wet = v > this.wet ? v : Math.max(v, this.wet - i / 90);
    const T = 1 - Math.exp(0.5 * -i),
      w = e.temp ?? 0.8;
    ((this.snowy += ((w < 0.15 ? 1 : 0) - this.snowy) * T),
      (this.dry += ((w > 1 ? 1 : 0) - this.dry) * T));
    const y = e.skyColor || [0.5, 0.7, 1],
      E = {},
      b = sqrt2(f),
      S = 0.4 * sqrt2(b),
      R = y.map(Math.sqrt),
      D = p * p,
      V = V3.mix(V3.max(R, [0.63, 0.67, 0.73]), R, D),
      A = V3.mix(V3.max(y, V3.sc([0.265, 0.295, 0.35], l)), y, D),
      M = V3.add(
        V3.add([-0.1, -0.4, -0.6], V3.sc([0, 0.06, 0.12], c)),
        V3.sc([-0.1, 0.3, 0.6], this.snowy),
      ),
      F = V3.add(
        V3.add([-0.15, -0.3, -0.42], V3.sc([0, 0.02, 0.08], c)),
        V3.add(V3.sc([-0.25, -0.01, 0.25], this.snowy), V3.sc([-0.05, -0.09, -0.1], this.dry)),
      ),
      k = V3.mul(V3.pow(V, 2.9), V3.add([0.85, 0.92, 0.81], V3.sc([0.1, 0, 0.1], v))),
      U = V3.add(V3.mul(V3.pow(V, 1.5), V3.add([1.3, 1.3, 1.3], V3.sc(M, v))), V3.sc(k, 0.65)),
      N = V3.add(V3.mul(V, V3.add([0.9, 0.9, 0.9], V3.sc(F, v))), V3.sc(k, 0.25)),
      L = V3.mul(A, V3.add([0.72, 0.522, 0.47], V3.sc([0.1, 0.2, 0.35], d))),
      O = V3.mul(A, V3.add([1.8, 1.3, 1.2], V3.sc([0.15, 0.25, -0.05], d))),
      C = V3.add([1.45, 0.86, 0.5], V3.sc([-0.8, -0.3, 0], v)),
      X = V3.add(V3.sc(C, 0.5), V3.sc(O, 0.25)),
      z = V3.mix(k, L, m),
      B = V3.mix(U, O, m),
      I = V3.mix(N, X, m),
      G = V3.add(V3.sc([0.07 * 0.9, 0.14 * 0.9, 0.216], 1 - 0.5 * v), y),
      W = V3.sc(V3.pow(G, 0.9), 0.45),
      H = V3.sc(W.map(Math.sqrt), 0.65),
      K = V3.mul(H, [0.82, 0.82, 0.88]);
    ((E.skyUp = V3.mix(V3.sc(W, 1.5 - 0.5 * b), z, l)),
      (E.skyUpMoon = V3.sc(W, 1.5 * S * (1 - l))),
      (E.skyMid = V3.mix(V3.sc(H, 3 - 2 * b), B, l)),
      (E.skyMidSun = V3.sc(B, 0.3 * l)),
      (E.skyDown = V3.mix(K, I, 0.5 * (l + r))),
      (E.skyBand = C),
      (E.skyK = [_ * l * p, d, S, r]));
    let Y = V3.mix([0.38 * 0.3, 0.12, 0.15], V3.add([1.5, 0.7, 0.3], V3.sc([0, 0.5, 0.5], c)), r);
    const $ = (Y[0] + Y[1] + Y[2]) / 3;
    ((Y = V3.sc(V3.mix(Y, [$, $, $], 0.5 * v), (1 - 0.6 * v) * h)),
      (E.glare = Y),
      (E.nightUp = W),
      (E.dayDownFog = V3.sc(I, 0.9 + 0.3 * c)));
    const q = V3.sc([0.65, 0.55, 0.375], 2.05),
      j = V3.sc(V3.pow(y, 0.75), 0.85),
      Z = V3.sc(V3.pow([0.64, 0.45, 0.3], 1.5 + _), 5),
      Q = V3.mul(j, [1.1495, 0.874, 0.722]),
      J = V3.sc([0.15, 0.14, 0.2], 0.9 * (0.4 + 0.4 * x)),
      ee = V3.sc([0.09, 0.12, 0.17], 0.9 * (1.55 + 0.77 * x)),
      te = V3.add(V3.sc([-0.06, 0, 0.04], this.snowy), V3.sc([0.01, -0.035, -0.06], this.dry)),
      ne = V3.add(V3.add(V3.sc([0.21, 0.16, 0.13], 0.85), V3.sc([0, 0.02, 0.06], c)), te),
      oe = V3.sc([0.2, 0.2, 0.25], 1.8 + 0.5 * x),
      ae = V3.sc([0.03, 0.035, 0.05], 0.5 + 0.5 * x),
      se = V3.sc([0.16, 0.2, 0.3], 0.75 + 0.6 * x),
      ie = 0.2 * this.snowy + 0.2 * this.dry,
      re = V3.mix(J, V3.mix(Z, q, c), u),
      ue = V3.mix(ee, V3.mix(Q, j, c), u),
      le = V3.sc(V3.mix(ae, V3.sc(ne, 1 - ie), u), 2.5),
      ce = V3.mix(se, V3.sc(oe, 1 + ie), u);
    let fe = V3.mix(re, le, v),
      _e = V3.mix(ue, ce, v),
      me = 0;
    if ("nether" === t.dim) {
      ((me = 1), (fe = [0, 0, 0]));
      const t = e.fogColor,
        n = V3.norm(V3.add(t, [1e-4, 1e-4, 1e-4]));
      _e = V3.sc(
        V3.add(V3.add(V3.sc(t, 0.6), V3.sc(n, 0.2)), [0.075, 0.03, 0.005]),
        0.9 + 0.45 * x,
      );
    } else if ("end" === t.dim) {
      me = 2;
      const e = [0.68, 0.51, 1.07];
      ((fe = V3.sc(e, 0.35 - 0.2 * x)), (_e = V3.sc(e, 0.2 + 0.2 * x)));
    } else a || (fe = [0, 0, 0]);
    ((E.light = fe),
      (E.amb = _e),
      (E.dim = me),
      (E.hl =
        1 === me
          ? [0, 0, 0]
          : V3.sc(V3.norm(V3.pow(fe, 0.37)), (0.3 + 1.5 * (me ? 1 : u)) * (1 - 0.85 * v))),
      (E.blk = [0.1775, 0.104, 0.077]));
    const he = V3.mix(H, B, l),
      ve = V3.sc([0.11, 0.14, 0.2], 0.9),
      de = V3.mix(ve, V3.mix(Z, q, c), u),
      pe = V3.mix(de, le, v);
    ((E.cAmb = V3.sc(
      V3.mix(V3.sc(_e, u * (0.55 + 0.17 * c) + 0.35), V3.sc(he, 0.5), v),
      1 - 0.25 * v,
    )),
      (E.cLight = V3.mix(V3.sc(pe, 1.3), V3.sc(he, 0.45), c * v)));
    const xe = V3.sc(V3.pow([0.62, 0.39, 0.24], 1.5 + _), 6.8);
    let Te = V3.mix(V3.mix([0.08, 0.12, 0.23], V3.mix(xe, [0.4, 0.75, 1.3], c * c), u), le, v);
    const we = (1 - r) * v;
    (r < 0.5 &&
      (Te = V3.sc(V3.norm(V3.pow(Te, 1 - Math.max(0, 1 - 1.5 * f) + v)), 0.0766 + 0.0766 * x)),
      (Te = V3.pow(Te, 0.5 + (0.5 + 0.25 * r) * _ * p + 0.3 * v)),
      (Te = V3.sc(Te, 1 - (0.3 + 0.3 * c) * v - 0.5 * we + r * m * p)));
    let ye =
      c01((Math.abs(o) - 0.05) / 0.15) * (d + (1 - d) * (0.875 * m + 0.125)) * (1.4 - 0.4 * v);
    ((E.vl = a ? V3.sc(Te, ye) : [0, 0, 0]), (E.rainyNight = we));
    const Ee = c01((o + 0.1) / 0.15);
    E.sunDisc = V3.sc(V3.mix([3.2, 1.3, 0.45], [2.6, 2.3, 1.9], c01(o / 0.5)), 4 * Ee * p);
    let ge = 1;
    try {
      t.player &&
        t.world &&
        "play" === t.state &&
        (ge =
          t.world.skyAt(Math.floor(n.camPos[0]), Math.floor(n.camPos[1]), Math.floor(n.camPos[2])) /
          15);
    } catch (e) {}
    return (
      (this.eyeSky += (ge - this.eyeSky) * (1 - Math.exp(2 * -i))),
      (E.cave = a ? Math.min(c01(1 - (n.camPos[1] + (n.yOff || 0)) / 61.9), 1 - this.eyeSky) : 0),
      (E.bloomFog = a ? (8 * d + 3 * (1 - l)) * this.eyeSky + 14 * E.cave : 1 === me ? 14 : 0),
      (E.bloomFog *= 0.9999996),
      (E.rainbow = a ? c01(2 * (this.wet - v)) * r * p : 0),
      (E.aurora = a ? this.snowy * c01(3 * f) * p : 0),
      Object.assign(E, {
        sunVis: r,
        sunVis2: u,
        sunFactor: l,
        noon: c,
        night: f,
        invNoon2: m,
        shadowTime: h,
        rain: v,
        vsB: x,
      }),
      E
    );
  }
  begin(e, t) {
    const n = this.r,
      o = n.gl,
      a = FX_CFG[this.level];
    (this.ensure(), (this.env = e), (this.cfg = a), (this.game = t), this.frameN++);
    const s = e.sunDir,
      i = "overworld" === e.sky && "overworld" === t.dim,
      r = (this.A = this.atmos(e, t)),
      u = s[1] >= 0,
      l = "end" === t.dim ? [0.3, 0.85, 0.42] : u ? s : [-s[0], -s[1], -s[2]];
    ((this.sunDir = normalize3([l[0], Math.max(l[1], 0.02), l[2] + 1e-4])),
      (this.sunVec = normalize3([s[0], s[1], s[2] + 1e-4])),
      (this.sunDiscCol = i ? r.sunDisc : null),
      (this.shadowOn = !!(a.shadow && i && r.shadowTime > 0.001 && this.shadowTex)));
    const c = n.yOff || 0,
      f = self.POTATO && t.worldMeta && t.worldMeta.sky;
    if (
      ((this.cloud = new Float32Array([
        (0.05 * e.tick * 6e-4) % 8,
        192 - c,
        f ? 900 : 4e3,
        e.rain || 0,
      ])),
      (this.cloudsOn = !(!(a.clouds && i && n.showClouds) || t.headInWater || t.headInLava)),
      (this.special = !!(t.headInWater || t.headInLava || e.fogFar < 20 || "overworld" !== e.sky)),
      (this.renderD = e.fogFar),
      this.special || ((e.fogNear = 1e8), (e.fogFar = 2e8)),
      (this.taa = !!a.taa),
      M4.mul(this.vpU, n.proj, n.view),
      this.taa)
    ) {
      const e = (this.frameN % 8) + 1,
        t = (2 * (halton(e, 2) - 0.5)) / this.size[0],
        o = (2 * (halton(e, 3) - 0.5)) / this.size[1];
      for (const e of [n.proj, n.vp])
        for (let n = 0; n < 4; n++)
          ((e[4 * n] += t * e[4 * n + 3]), (e[4 * n + 1] += o * e[4 * n + 3]));
    }
    (this.shadowOn ? (this.renderShadow(a), this.renderEntityShadow(a)) : (this.entShadowOn = !1),
      this.invVP.set(invert4(n.vp)),
      this.invVPU.set(invert4(this.vpU)),
      o.bindFramebuffer(o.FRAMEBUFFER, this.sceneFB),
      o.viewport(0, 0, this.size[0], this.size[1]),
      this.setLightUniforms(this.pEnt));
    for (const e of [this.pChunk, this.pChunkT])
      (this.setLightUniforms(e),
        o.uniform1f(e.u.u_wave, 1),
        o.uniform1i(e.u.u_mat, 5),
        o.uniform2f(e.u.u_nf, n.near, n.far),
        o.uniform1i(e.u.u_ssr, a.ssr),
        o.uniformMatrix4fv(e.u.u_invVP, !1, this.invVP),
        o.uniform1i(e.u.u_sceneColor, 6),
        o.uniform1i(e.u.u_sceneDepth, 7));
    (o.activeTexture(o.TEXTURE5),
      o.bindTexture(o.TEXTURE_2D, this.matTex),
      o.activeTexture(o.TEXTURE0),
      (n.fxOn = !0));
  }
  setSky(e) {
    const t = this.r.gl,
      n = this.A;
    (t.uniform3fv(e.u.u_skyUp, n.skyUp),
      t.uniform3fv(e.u.u_skyUpMoon, n.skyUpMoon),
      t.uniform3fv(e.u.u_skyMid, n.skyMid),
      t.uniform3fv(e.u.u_skyMidSun, n.skyMidSun),
      t.uniform3fv(e.u.u_skyDown, n.skyDown),
      t.uniform3fv(e.u.u_skyBand, n.skyBand),
      t.uniform3fv(e.u.u_glareCol, n.glare),
      t.uniform3fv(e.u.u_sunVec, this.sunVec),
      t.uniform4fv(e.u.u_skyK, n.skyK));
  }
  setLightUniforms(e) {
    const t = this.r.gl,
      n = this.A;
    (t.useProgram(e.p),
      this.setSky(e),
      t.uniform3fv(e.u.u_sunDir, this.sunDir),
      t.uniform3fv(e.u.u_lightCol, n.light),
      t.uniform3fv(e.u.u_ambCol, n.amb),
      t.uniform3fv(e.u.u_hlCol, n.hl),
      t.uniform3fv(e.u.u_blkCol, n.blk),
      t.uniform4f(e.u.u_tf, n.noon, n.sunVis2, n.rain, 2 === n.dim ? 1 : n.shadowTime),
      t.uniform4f(e.u.u_tf2, n.vsB, this.env.nightVision || 0, n.invNoon2, n.dim),
      t.uniform1f(e.u.u_eyeWater, this.game && this.game.headInWater ? 1 : 0),
      t.uniform1f(e.u.u_frame, this.taa ? this.frameN % 64 : 0),
      t.uniform1i(e.u.u_shadowOn, this.shadowOn ? 1 : 0),
      t.uniform1i(e.u.u_taps, this.cfg.taps),
      t.uniform1f(e.u.u_shadowSize, this.shadowSize || 1),
      t.uniform1fv(e.u["u_shadowTexelW[0]"], this.shadowTexelW),
      t.uniform1fv(e.u["u_shadowRange[0]"], this.shadowRange),
      t.uniformMatrix4fv(e.u["u_shadowVP[0]"], !1, this.shadowVP),
      t.uniform1i(e.u.u_entShadow, this.entShadowOn ? 1 : 0),
      e.u.u_fxCam && t.uniform3fv(e.u.u_fxCam, this.r.camPos),
      e.u.u_waveTex &&
        (t.uniform1i(e.u.u_waveTex, 11),
        t.activeTexture(t.TEXTURE11),
        t.bindTexture(t.TEXTURE_2D, this.noiseTex())),
      t.uniform1i(e.u.u_shadow, 3));
    const o = this.shadowTex || this.dummyDepth();
    (t.activeTexture(t.TEXTURE3),
      t.bindTexture(t.TEXTURE_2D_ARRAY, o),
      t.bindSampler(3, this.cmpSampler),
      t.activeTexture(t.TEXTURE0));
  }
  depthArray(e, t) {
    const n = this.r.gl,
      o = n.createTexture();
    return (
      n.bindTexture(n.TEXTURE_2D_ARRAY, o),
      n.texStorage3D(n.TEXTURE_2D_ARRAY, 1, n.DEPTH_COMPONENT24, e, e, t),
      n.texParameteri(n.TEXTURE_2D_ARRAY, n.TEXTURE_MIN_FILTER, n.NEAREST),
      n.texParameteri(n.TEXTURE_2D_ARRAY, n.TEXTURE_MAG_FILTER, n.NEAREST),
      n.texParameteri(n.TEXTURE_2D_ARRAY, n.TEXTURE_WRAP_S, n.CLAMP_TO_EDGE),
      n.texParameteri(n.TEXTURE_2D_ARRAY, n.TEXTURE_WRAP_T, n.CLAMP_TO_EDGE),
      n.bindTexture(n.TEXTURE_2D_ARRAY, null),
      o
    );
  }
  cloudNoiseTex() {
    if (this._cnoise) return this._cnoise;
    const e = this.r.gl,
      t = new Uint8Array(16384);
    let n = 20261023;
    for (let e = 0; e < t.length; e++)
      ((n = (16807 * n) % 2147483647), (t[e] = (n / 2147483647) * 255));
    const o = e.createTexture();
    return (
      e.bindTexture(e.TEXTURE_2D, o),
      e.texImage2D(e.TEXTURE_2D, 0, e.R8, 128, 128, 0, e.RED, e.UNSIGNED_BYTE, t),
      e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.LINEAR),
      e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.LINEAR),
      e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.REPEAT),
      e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.REPEAT),
      (this._cnoise = o)
    );
  }
  noiseTex() {
    if (this._noise) return this._noise;
    const e = this.r.gl,
      t = 128,
      fbm = (e) => {
        const n = new Float32Array(16384);
        let o = 0.5,
          a = 0;
        for (let s = 4, i = 0; s <= 64; s *= 2, i++) {
          const r = new Float32Array(s * s);
          let u = e + 101 * i;
          for (let e = 0; e < r.length; e++)
            ((u = (16807 * u) % 2147483647), (r[e] = u / 2147483647));
          const l = t / s,
            g = (e, t) => r[(t % s) * s + (e % s)];
          for (let e = 0; e < t; e++)
            for (let a = 0; a < t; a++) {
              const s = a / l,
                i = e / l,
                r = Math.floor(s),
                u = Math.floor(i),
                c = s - r,
                f = i - u,
                _ = c * c * (3 - 2 * c),
                m = f * f * (3 - 2 * f),
                h = g(r, u) + (g(r + 1, u) - g(r, u)) * _,
                v = g(r, u + 1) + (g(r + 1, u + 1) - g(r, u + 1)) * _;
              n[e * t + a] += (h + (v - h) * m) * o;
            }
          ((a += o), (o *= 0.55));
        }
        for (let e = 0; e < n.length; e++) n[e] /= a;
        return n;
      },
      n = fbm(1234),
      o = fbm(98765),
      a = new Uint8Array(65536),
      c8 = (e) => Math.max(0, Math.min(255, e)),
      at = (e, o) => n[((o + t) % t) * t + ((e + t) % t)];
    for (let e = 0; e < t; e++)
      for (let s = 0; s < t; s++) {
        const i = 6 * (at(s + 1, e) - at(s - 1, e)),
          r = 6 * (at(s, e + 1) - at(s, e - 1)),
          u = Math.hypot(i, 1, r),
          l = 4 * (e * t + s);
        ((a[l] = c8((-i / u) * 127.5 + 127.5)),
          (a[l + 1] = c8((-r / u) * 127.5 + 127.5)),
          (a[l + 2] = c8(255 * n[e * t + s])),
          (a[l + 3] = c8(255 * o[e * t + s])));
      }
    const s = e.createTexture();
    return (
      e.bindTexture(e.TEXTURE_2D, s),
      e.texImage2D(e.TEXTURE_2D, 0, e.RGBA8, t, t, 0, e.RGBA, e.UNSIGNED_BYTE, a),
      e.generateMipmap(e.TEXTURE_2D),
      e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_LINEAR),
      e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.LINEAR),
      e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.REPEAT),
      e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.REPEAT),
      (this._noise = s)
    );
  }
  dummyDepth() {
    return (this._dummy || (this._dummy = this.depthArray(1, 4)), this._dummy);
  }
  renderShadow(e) {
    const t = this.r,
      n = t.gl,
      o = t.camPos,
      a = this.sunDir,
      s = e.shadow,
      i = Math.max(48, 16 * (t.renderDist || 8)),
      r = e.casc.map((e) => Math.min(e, i)),
      u = t.view,
      l = [-u[2], 0, -u[10]],
      c = Math.hypot(l[0], l[2]) || 1,
      f = this.shadowCache || (this.shadowCache = [null, null, null]);
    if (t.shadowDirty) {
      for (const e of f) e && (e.dirty = !0);
      t.shadowDirty = !1;
    }
    const _ = [4, 8, 16],
      m = [3, 6, 12];
    let h = !1;
    for (let e = 0; e < 3; e++) {
      const i = r[e],
        u = f[e];
      if (
        u &&
        u.size === s &&
        u.half === i &&
        this.frameN - u.frame < _[e] &&
        !(u.dirty && this.frameN - u.frame >= m[e]) &&
        Math.hypot(o[0] - u.cam[0], o[1] - u.cam[1], o[2] - u.cam[2]) < 0.1 * i &&
        a[0] * u.sun[0] + a[1] * u.sun[1] + a[2] * u.sun[2] > 0.99999
      )
        continue;
      f[e] = { cam: [...o], sun: [...a], frame: this.frameN, size: s, half: i, dirty: !1 };
      const v = [o[0] + (l[0] / c) * i * 0.4, o[1], o[2] + (l[2] / c) * i * 0.4],
        d = 2 * i + 300,
        p = M4.create(),
        x = M4.create();
      lookAtM(
        p,
        [a[0] * (i + 150), a[1] * (i + 150), a[2] * (i + 150)],
        [0, 0, 0],
        Math.abs(a[1]) > 0.99 ? [1, 0, 0] : [0, 0, 1],
      );
      const T = [
          p[0] * v[0] + p[4] * v[1] + p[8] * v[2] + p[12],
          p[1] * v[0] + p[5] * v[1] + p[9] * v[2] + p[13],
          p[2] * v[0] + p[6] * v[1] + p[10] * v[2] + p[14],
        ],
        w = (2 * i) / s;
      ((T[0] = Math.floor(T[0] / w) * w),
        (T[1] = Math.floor(T[1] / w) * w),
        M4.ortho(x, T[0] - i, T[0] + i, T[1] - i, T[1] + i, -T[2] - d / 2, -T[2] + d / 2));
      const y = M4.create();
      (M4.mul(y, x, p),
        this.shadowVP.set(y, 16 * e),
        (this.shadowTexelW[e] = w),
        (this.shadowRange[e] = d),
        h ||
          ((h = !0),
          n.enable(n.DEPTH_TEST),
          n.depthMask(!0),
          n.disable(n.CULL_FACE),
          n.disable(n.BLEND),
          n.enable(n.POLYGON_OFFSET_FILL),
          n.polygonOffset(1.5, 3),
          n.useProgram(this.pShadow.p),
          n.uniform1f(this.pShadow.u.u_time, t.frameTime ?? performance.now() % 1e7),
          n.uniform1i(this.pShadow.u.u_tex, 0),
          n.uniform1i(this.pShadow.u.u_mat, 5),
          n.activeTexture(n.TEXTURE5),
          n.bindTexture(n.TEXTURE_2D, this.matTex),
          n.activeTexture(n.TEXTURE3),
          n.bindTexture(n.TEXTURE_2D_ARRAY, null),
          n.activeTexture(n.TEXTURE0),
          n.bindTexture(n.TEXTURE_2D_ARRAY, t.texArray)),
        this.drawShadowCascade(e, y, v, i, s));
    }
    h && (n.disable(n.POLYGON_OFFSET_FILL), n.enable(n.CULL_FACE));
  }
  renderEntityShadow(e) {
    const t = this.r,
      n = t.gl,
      o = this.entRec,
      a = t.camPos,
      s = this.sunDir,
      i = e.shadow,
      r = 32;
    if (((this.entShadowOn = !1), !o || !o.length)) return;
    const u = M4.create(),
      l = M4.create();
    lookAtM(
      u,
      [182 * s[0], 182 * s[1], 182 * s[2]],
      [0, 0, 0],
      Math.abs(s[1]) > 0.99 ? [1, 0, 0] : [0, 0, 1],
    );
    const c = [
        u[0] * a[0] + u[4] * a[1] + u[8] * a[2] + u[12],
        u[1] * a[0] + u[5] * a[1] + u[9] * a[2] + u[13],
        u[2] * a[0] + u[6] * a[1] + u[10] * a[2] + u[14],
      ],
      f = 64 / i;
    ((c[0] = Math.floor(c[0] / f) * f),
      (c[1] = Math.floor(c[1] / f) * f),
      M4.ortho(l, c[0] - r, c[0] + r, c[1] - r, c[1] + r, -c[2] - 182, 182 - c[2]));
    const _ = M4.create();
    (M4.mul(_, l, u),
      this.shadowVP.set(_, 48),
      (this.shadowTexelW[3] = f),
      (this.shadowRange[3] = 364),
      n.bindFramebuffer(n.FRAMEBUFFER, this.shadowFB[3]),
      n.viewport(0, 0, i, i),
      n.clear(n.DEPTH_BUFFER_BIT),
      n.enable(n.DEPTH_TEST),
      n.depthMask(!0),
      n.disable(n.CULL_FACE),
      n.disable(n.BLEND),
      n.enable(n.POLYGON_OFFSET_FILL),
      n.polygonOffset(1.5, 3),
      n.activeTexture(n.TEXTURE3),
      n.bindTexture(n.TEXTURE_2D_ARRAY, null));
    const m = this.pEntShadow,
      h = this.pShadow;
    let v = null,
      d = null;
    for (const e of o) {
      const o = e.m[12] - a[0],
        s = e.m[14] - a[2];
      o * o + s * s > 1600 ||
        (e.tex
          ? (v !== m &&
              ((v = m),
              n.useProgram(m.p),
              n.uniformMatrix4fv(m.u.u_vp, !1, _),
              n.uniform1i(m.u.u_tex, 1)),
            n.activeTexture(n.TEXTURE1),
            n.bindTexture(n.TEXTURE_2D, e.tex),
            n.uniformMatrix4fv(m.u.u_model, !1, e.m))
          : (v !== h &&
              ((v = h),
              n.useProgram(h.p),
              n.uniformMatrix4fv(h.u.u_vp, !1, _),
              n.uniform1f(h.u.u_time, t.frameTime ?? performance.now() % 1e7),
              n.uniform1i(h.u.u_tex, 0),
              n.uniform1i(h.u.u_mat, 5),
              n.activeTexture(n.TEXTURE5),
              n.bindTexture(n.TEXTURE_2D, this.matTex),
              n.activeTexture(n.TEXTURE0),
              n.bindTexture(n.TEXTURE_2D_ARRAY, t.texArray)),
            n.uniformMatrix4fv(h.u.u_model, !1, e.m)),
        e.vao !== d && ((d = e.vao), n.bindVertexArray(d)),
        n.drawElements(n.TRIANGLES, 1.5 * e.n, n.UNSIGNED_INT, e.off || 0));
    }
    (n.disable(n.POLYGON_OFFSET_FILL),
      n.enable(n.CULL_FACE),
      n.activeTexture(n.TEXTURE0),
      n.bindTexture(n.TEXTURE_2D_ARRAY, t.texArray),
      (t.tex1 = null),
      (this.entShadowOn = !0));
  }
  drawShadowCascade(e, t, n, o, a) {
    const s = this.r,
      i = s.gl,
      r = this.pShadow;
    (i.bindFramebuffer(i.FRAMEBUFFER, this.shadowFB[e]),
      i.viewport(0, 0, a, a),
      i.clear(i.DEPTH_BUFFER_BIT),
      i.uniformMatrix4fv(r.u.u_vp, !1, t));
    const u = frustumPlanes(t),
      l = (1.42 * o + 24) * (1.42 * o + 24),
      c = this.casList || (this.casList = []);
    c.length = 0;
    for (const e of s.sections.values()) {
      if (!e.o) continue;
      const t = e.x + 8 - n[0],
        o = e.z + 8 - n[2];
      t * t + o * o > l ||
        (aabbInFrustum(u, e.x, e.y, e.z, e.x + 16, e.y + 16, e.z + 16) && c.push(e));
    }
    (c.sort((e, t) => e.o.a.pg.id - t.o.a.pg.id), s.secDraw(r, c, !0, !1));
  }
  copyScene() {
    const e = this.r.gl,
      [t, n] = this.size;
    (e.bindFramebuffer(e.READ_FRAMEBUFFER, this.sceneFB),
      e.bindFramebuffer(e.DRAW_FRAMEBUFFER, this.copyFB),
      e.blitFramebuffer(0, 0, t, n, 0, 0, t, n, e.COLOR_BUFFER_BIT | e.DEPTH_BUFFER_BIT, e.NEAREST),
      e.bindFramebuffer(e.FRAMEBUFFER, this.sceneFB),
      e.activeTexture(e.TEXTURE6),
      e.bindTexture(e.TEXTURE_2D, this.copyColor),
      e.activeTexture(e.TEXTURE7),
      e.bindTexture(e.TEXTURE_2D, this.copyDepth),
      e.activeTexture(e.TEXTURE0),
      (this.copied = !0));
  }
  pass(e, t, n) {
    const o = this.r.gl;
    (o.bindFramebuffer(o.FRAMEBUFFER, t ? t.fb : null),
      o.viewport(0, 0, t ? t.w : this.size[0], t ? t.h : this.size[1]),
      o.useProgram(e.p));
    let a = 0;
    (e.u.u_texel &&
      o.uniform2f(e.u.u_texel, 1 / (t ? t.w : this.size[0]), 1 / (t ? t.h : this.size[1])),
      e.u.u_nf && o.uniform2f(e.u.u_nf, this.r.near, this.r.far),
      e.u.u_invVP && o.uniformMatrix4fv(e.u.u_invVP, !1, this.invVP),
      e.u.u_cam && o.uniform3fv(e.u.u_cam, this.r.camPos),
      e.u.u_frame && o.uniform1f(e.u.u_frame, this.taa ? this.frameN % 64 : 0),
      n((t, n) => {
        (o.activeTexture(o.TEXTURE0 + a),
          o.bindTexture(o.TEXTURE_2D, n),
          o.bindSampler(a, null),
          e.u[t] && o.uniform1i(e.u[t], a),
          a++);
      }, e),
      o.bindVertexArray(this.r.emptyVao),
      o.drawArrays(o.TRIANGLES, 0, 3));
  }
  end() {
    const e = this.r,
      t = e.gl,
      n = this.cfg,
      [o, a] = this.size,
      s = this.A,
      i = this.env,
      r = this.game;
    ((e.fxOn = !1),
      (e.ufEpoch = (e.ufEpoch || 0) + 1),
      this.copied || this.copyScene(),
      (this.copied = !1),
      t.disable(t.DEPTH_TEST),
      t.disable(t.BLEND),
      t.disable(t.CULL_FACE),
      t.depthMask(!1));
    const u = this.sceneColor,
      l = this.sceneDepth,
      c = Math.max(1, o >> 1),
      f = Math.max(1, a >> 1);
    let _ = null,
      m = null;
    if (n.vl && this.shadowOn && s.vl[0] + s.vl[1] + s.vl[2] > 0.002) {
      const e = this.target("vol", c, f, "hdr");
      (this.pass(this.pVol, e, (e, o) => {
        (e("u_depth", l),
          t.activeTexture(t.TEXTURE5),
          t.bindTexture(t.TEXTURE_2D_ARRAY, this.shadowTex),
          t.bindSampler(5, this.cmpSampler),
          t.uniform1i(o.u.u_shadow, 5),
          t.uniformMatrix4fv(o.u["u_shadowVP[0]"], !1, this.shadowVP.subarray(0, 48)),
          t.uniform3fv(o.u.u_sunDir, this.sunDir),
          t.uniform1fv(o.u["u_shadowRange[0]"], this.shadowRange.subarray(0, 3)),
          t.uniform3fv(o.u.u_vlCol, s.vl),
          t.uniform1i(o.u.u_samples, n.vl),
          t.uniform1f(o.u.u_maxD, Math.max(128, 0.98 * this.renderD)),
          t.uniform1f(o.u.u_shadowD, n.casc[2]),
          t.uniform4f(
            o.u.u_vlK,
            s.rainyNight,
            this.eyeSky,
            s.sunVis > 0.5 ? 1 : 0,
            s.rain * s.rain,
          ));
      }),
        t.bindSampler(5, null),
        t.activeTexture(t.TEXTURE5),
        t.bindTexture(t.TEXTURE_2D_ARRAY, null),
        t.activeTexture(t.TEXTURE0),
        (_ = e.tex));
    }
    if (this.cloudsOn) {
      const e = this.target("clouds", c, f, "hdr");
      (this.pass(this.pCloud, e, (e, n) => {
        (e("u_depth", l),
          e("u_cloudNoise", this.cloudNoiseTex()),
          this.setSky(n),
          t.uniform4fv(n.u.u_cloud, this.cloud),
          t.uniform3fv(n.u.u_cAmb, s.cAmb),
          t.uniform3fv(n.u.u_cLight, s.cLight));
      }),
        (m = e.tex));
    }
    const h = this.target("lin", o, a, "hdr"),
      v = this.blackTex(),
      d = "overworld" !== i.sky || r.headInWater || r.headInLava ? 0 : 1;
    this.pass(this.pCompose, h, (n, o) => {
      (n("u_color", u),
        n("u_depth", l),
        n("u_depthO", this.copyDepth),
        n("u_clouds", m || v),
        n("u_vol", _ || v),
        n("u_noise", this.noiseTex()),
        this.setSky(o),
        t.uniform1i(o.u.u_useClouds, m ? 1 : 0),
        t.uniform1i(o.u.u_useVol, _ ? 1 : 0),
        t.uniform1i(o.u.u_skyOn, d),
        t.uniform1i(o.u.u_fogOn, this.special || "overworld" !== i.sky ? 0 : 1),
        t.uniform2f(o.u.u_cloudSlab, this.cloud[1] - 16, this.cloud[1] + 16),
        t.uniform3fv(o.u.u_sunDisc, s.sunDisc),
        t.uniform1f(o.u.u_renderD, Math.max(32, this.renderD - 12)),
        t.uniform1f(o.u.u_yOff, e.yOff || 0),
        t.uniform4f(o.u.u_fogK, s.rain, this.eyeSky, s.cave, s.vsB),
        t.uniform4f(o.u.u_atmK, 1 - s.night, s.sunVis2, s.noon, s.sunFactor),
        t.uniform3fv(o.u.u_nightUp, s.nightUp),
        t.uniform3fv(o.u.u_dayDownFog, s.dayDownFog),
        t.uniform4f(
          o.u.u_misc,
          s.rainbow,
          r.headInWater ? 1 : 0,
          s.aurora,
          this.special ? 0 : s.bloomFog,
        ),
        t.uniform1f(o.u.u_time, e.frameTime ?? performance.now() % 1e7));
    });
    const p = this.target("b0", c, f, "hdr");
    this.pass(this.pDown0, p, (e) => e("u_src", h.tex));
    const x = [p];
    for (let e = 1; e <= 5; e++) {
      const t = x[e - 1],
        n = this.target("b" + e, Math.max(1, t.w >> 1), Math.max(1, t.h >> 1), "hdr");
      (this.pass(this.pDown, n, (e) => e("u_src", t.tex)), x.push(n));
    }
    for (let e = 5; e >= 2; e--) {
      const t = x[e],
        n = this.target("u" + (e - 1), x[e - 1].w, x[e - 1].h, "hdr");
      (this.pass(this.pUp, n, (n) => {
        (n("u_src", t.tex), n("u_add", x[e - 1].tex));
      }),
        (x[e - 1] = n));
    }
    const T = x[1].tex,
      w = this.target("ldr", o, a, "ldr");
    this.pass(this.pGrade, w, (e, n) => {
      (e("u_src", h.tex), e("u_bloom", T), t.uniform1f(n.u.u_bloomK, 0.12));
    });
    let y = w;
    if (this.taa) {
      const e = this.target("hist" + this.histI, o, a, "ldr"),
        n = this.target("hist" + (1 - this.histI), o, a, "ldr");
      (this.pass(this.pTAA, e, (e, o) => {
        (e("u_cur", w.tex),
          e("u_hist", n.tex),
          e("u_depth", l),
          t.uniformMatrix4fv(o.u.u_invVPU, !1, this.invVPU),
          t.uniformMatrix4fv(o.u.u_prevVP, !1, this.prevVP),
          t.uniform1f(o.u.u_reset, this.histOK ? 0 : 1));
      }),
        (this.histOK = !0),
        (this.histI = 1 - this.histI),
        (y = e));
    } else this.histOK = !1;
    (this.prevVP.set(this.vpU),
      this.pass(this.pFinal, null, (e, n) => {
        (e("u_src", y.tex),
          t.uniform1i(n.u.u_fxaa, this.taa ? 0 : 1),
          t.uniform1f(n.u.u_sharp, this.taa ? 0.25 : 0.125));
      }),
      t.bindFramebuffer(t.FRAMEBUFFER, null),
      t.viewport(0, 0, o, a),
      t.enable(t.DEPTH_TEST),
      t.depthMask(!0),
      t.enable(t.CULL_FACE));
    for (let e = 0; e < 8; e++) t.bindSampler(e, null);
    t.activeTexture(t.TEXTURE0);
  }
  blackTex() {
    if (!this._black) {
      const e = this.r.gl;
      ((this._black = e.createTexture()),
        e.bindTexture(e.TEXTURE_2D, this._black),
        e.texImage2D(
          e.TEXTURE_2D,
          0,
          e.RGBA8,
          1,
          1,
          0,
          e.RGBA,
          e.UNSIGNED_BYTE,
          new Uint8Array([0, 0, 0, 0]),
        ));
    }
    return this._black;
  }
}
function smoothstep01(e, t, n) {
  const o = clamp((n - e) / (t - e), 0, 1);
  return o * o * (3 - 2 * o);
}
function normalize3(e) {
  const t = Math.hypot(e[0], e[1], e[2]) || 1;
  return [e[0] / t, e[1] / t, e[2] / t];
}
//# sourceURL=js/shaders.js
