// min
"use strict";
self.window = self;
const MODS_IN = (new URLSearchParams(self.location.search).get("mods") || "")
  .split(",")
  .filter((e) => /^[a-z0-9_]{1,32}$/.test(e));
(importScripts(
  "assets.js",
  "util.js",
  "worldgen_data.js",
  "worldgen.js",
  "blockdata.js",
  "modapi.js",
  ...MODS_IN.map((e) => "../mods/" + e + "/data.js"),
),
  importScripts(
    "blocks.js",
    "world.js",
    "mesher.js",
    "models.js",
    "vmodels.js",
    "structures_data.js",
    "structgen.js",
    "structtypes.js",
    "features.js",
    "trees.js",
  ),
  setWorldFormat(2),
  initAnimTable());
const VB_BASE = 32,
  seed32 = (e) => Number(BigInt.asIntN(32, BigInt(e)));
let W = null,
  epoch = 0,
  center = null;
const finished = new Map(),
  meshQ = [],
  skip = new Map(),
  host = {
    structureFeatures(e, s, t, o) {
      if (e.sx && e.sx.feat) for (const [r, c, n, a] of e.sx.feat) o(s, a, t, [r, c, n], a);
    },
  };
function reset(e) {
  ((epoch = e.epoch),
    (W = new World(seed32(e.seed), e.dim)),
    (W.gen2 = !0),
    (W.minY = e.minY),
    (W.seedStr = String(e.seed)),
    (W.structures = e.structures),
    (W.proto = new Map()),
    (W.spills = new Map()),
    finished.clear(),
    (center = null),
    skip.clear());
}
function addProto(e) {
  const s = ckey(e.cx, e.cz);
  if (!W || W.proto.has(s) || !e.blocks || !e.sb) return;
  finished.delete(s);
  const t = Chunk.from(e.cx, e.cz, e.blocks, e.meta || null);
  (Object.assign(t, { qb: e.qb, hm: e.hm, sx: e.sx || null, stage: 1 }),
    e.sx && e.sx.wl && e.sx.wl.length && (t.wl = new Set(e.sx.wl)));
  for (let s = 0; s < 256; s++) t.biome[s] = 32 + e.sb[s];
  if (e.sx && e.sx.refs) {
    const s = W.structRefs || (W.structRefs = new Map());
    for (const [t, o, r] of e.sx.refs)
      s.set(t + ":" + o[0] + "," + o[2], { name: t, box: o, f: r });
  }
  (W.proto.set(s, t), Features.applySpill(W, t, !1, decorated));
}
const decorated = (e) => {
  const s = W.proto.get(e);
  return s ? 2 === s.stage : finished.has(e);
};
function around(e, s) {
  for (let t = -1; t <= 1; t++)
    for (let o = -1; o <= 1; o++) {
      if (!t && !o) continue;
      const r = ckey(e.cx + t, e.cz + o),
        c = W.proto.get(r);
      if (c) {
        if (!s(c)) return !1;
      } else if (!finished.has(r)) return !1;
    }
  return !0;
}
function decorate(e) {
  if (!1 !== W.structures) for (const s of W.structuresFor(e.cx, e.cz)) s.apply(e);
  (Features.decorate(host, W, e), Features.applySpill(W, e, !0, decorated), (e.stage = 2));
}
function finish(e) {
  const s = ckey(e.cx, e.cz);
  (W.proto.delete(s), finished.set(s, e.biome));
  const t = new Uint8Array(2304);
  for (let s = -1; s <= 1; s++)
    for (let o = -1; o <= 1; o++) {
      const r = ckey(e.cx + s, e.cz + o),
        c = W.proto.get(r),
        n = c ? c.biome : finished.get(r);
      t.set(n || e.biome, 256 * (3 * (o + 1) + (s + 1)));
    }
  const o = e.sx || e.wl ? { loot: e.sx ? e.sx.loot : [], ent: e.sx ? e.sx.ent : [] } : null;
  (e.wl && e.wl.size && (o.wl = [...e.wl]), lightChunk(e, W.hasSky));
  const [r, c] = e.wire(!0);
  (c.push(t.buffer),
    postMessage(
      { type: "final", epoch: epoch, cx: e.cx, cz: e.cz, sec: r, biome: e.biome, sx: o, nb: t },
      c,
    ));
}
function prune() {
  if (!center) return;
  const e = center.R,
    s = [];
  for (const [t, o] of W.proto) {
    const r = o.cx - center.cx,
      c = o.cz - center.cz;
    r * r + c * c > (e + 5.5) * (e + 5.5) && (W.proto.delete(t), s.push(t));
  }
  for (const s of finished.keys()) {
    const t = (s % 65536) - 32768,
      o = Math.floor(s / 65536) - 32768 - center.cx,
      r = t - center.cz;
    o * o + r * r > (e + 8) * (e + 8) && finished.delete(s);
  }
  (Features.pruneSpill(W, (e) => W.proto.has(e) || finished.has(e)),
    s.length && postMessage({ type: "dropped", epoch: epoch, keys: s }));
}
const stats = { mesh: 0, decorate: 0, finish: 0, nMesh: 0, nDecorate: 0, nFinish: 0, busy: 0 };
let statsT = performance.now();
function timed(e, s) {
  const t = performance.now();
  (s(), (stats[e] += performance.now() - t), stats["n" + e[0].toUpperCase() + e.slice(1)]++);
}
function report(e, s) {
  (console.error("chunk worker: " + e, s),
    postMessage({
      type: "error",
      where: e,
      msg: String((s && s.message) || s),
      stack: String((s && s.stack) || ""),
    }));
}
function step() {
  if (meshQ.length)
    return (
      timed("mesh", () => {
        const e = meshQ.shift();
        let s;
        try {
          (Mesher.load(e), (s = Mesher.buildGathered(e.cx, e.sy, e.cz)));
        } catch (s) {
          return (
            report("mesh " + e.cx + "," + e.sy + "," + e.cz, s),
            void postMessage({ type: "mesh", id: e.id, error: String((s && s.message) || s) })
          );
        }
        const t = [];
        (s.opaque && t.push(s.opaque.buffer),
          s.trans && t.push(s.trans.buffer),
          postMessage(
            {
              type: "mesh",
              id: e.id,
              opaque: s.opaque,
              trans: s.trans,
              nOpaque: s.nOpaque,
              nTrans: s.nTrans,
              vis: s.vis,
            },
            t,
          ));
      }),
      !0
    );
  if (!W || !center) return !1;
  const e = center.R,
    s = (e + 1.5) * (e + 1.5),
    t = (e + 3) * (e + 3);
  let o = null,
    r = 1 / 0;
  for (const e of W.proto.values()) {
    const c = e.cx - center.cx,
      n = e.cz - center.cz,
      a = c * c + n * n;
    a > t ||
      a >= r ||
      ((2 === e.stage ? a <= s && around(e, (e) => 2 === e.stage) : around(e, () => !0)) &&
        ((o = e), (r = a)));
  }
  if (!o) return !1;
  const c = ckey(o.cx, o.cz),
    n = skip.get(c);
  if (n === o.stage)
    return 1 === n
      ? ((o.stage = 2), !0)
      : (W.proto.delete(c),
        finished.set(c, o.biome),
        postMessage({
          type: "final",
          epoch: epoch,
          cx: o.cx,
          cz: o.cz,
          broken: "skipped: a chunk worker hung finishing it",
        }),
        !0);
  if ((postMessage({ type: "work", k: c, s: o.stage }), 1 === o.stage)) {
    try {
      timed("decorate", () => decorate(o));
    } catch (e) {
      (report("decorate " + o.cx + "," + o.cz, e), (o.stage = 2));
    }
    postMessage({ type: "work" });
  } else
    try {
      timed("finish", () => finish(o));
    } catch (e) {
      report("finish " + o.cx + "," + o.cz, e);
      const s = ckey(o.cx, o.cz);
      (W.proto.delete(s),
        finished.set(s, o.biome),
        postMessage({
          type: "final",
          epoch: epoch,
          cx: o.cx,
          cz: o.cz,
          broken: String((e && e.message) || e),
        }));
    }
  return !0;
}
const mc = new MessageChannel();
let scheduled = !1;
function kick() {
  scheduled || ((scheduled = !0), mc.port2.postMessage(0));
}
mc.port1.onmessage = () => {
  scheduled = !1;
  const e = performance.now();
  let s = !1;
  try {
    for (; performance.now() - e < 8 && step();) s = !0;
  } catch (e) {
    report("step", e);
  }
  const t = performance.now();
  if (((stats.busy += t - e), t - statsT > 1e3)) {
    let e = 0;
    if (W)
      for (const s of W.proto.values()) {
        for (const t of s.bs) t && (e += t.d.byteLength + 512);
        for (const t of s.ms) t && (e += 4096);
      }
    postMessage(
      Object.assign(
        {
          type: "stats",
          span: t - statsT,
          protos: W ? W.proto.size : 0,
          protoMB: e / 1048576,
          meshQ: meshQ.length,
        },
        stats,
      ),
    );
    for (const e in stats) stats[e] = 0;
    statsT = t;
  }
  s && kick();
};
let pruneT = 0;
function handle(e) {
  switch (e.type) {
    case "reset":
      reset(e);
      break;
    case "opts":
      setFastLeaves(e.fastLeaves);
      break;
    case "proto":
      e.epoch === epoch && addProto(e);
      break;
    case "center":
      if (e.epoch !== epoch) break;
      ((center = e), performance.now() - pruneT > 500 && ((pruneT = performance.now()), prune()));
      break;
    case "unloaded": {
      const s = [];
      if (e.epoch === epoch && W)
        for (const t of e.keys) W.proto.has(t) ? s.push(t) : finished.delete(t);
      e.ask && postMessage({ type: "held", epoch: e.epoch, ask: e.ask, keys: s });
      break;
    }
    case "have":
      e.epoch === epoch &&
        W &&
        e.keys.forEach((s, t) => {
          (W.proto.delete(s), finished.set(s, e.biomes.slice(256 * t, 256 * t + 256)));
        });
      break;
    case "skip":
      e.keys.forEach((s, t) => skip.set(s, e.stages[t]));
      break;
    case "mesh":
      meshQ.push(e);
      break;
    case "ping":
      return void postMessage({ type: "pong" });
  }
  kick();
}
((onmessage = (e) => {
  const s = e.data;
  try {
    handle(s);
  } catch (e) {
    (report("message " + (s && s.type), e), kick());
  }
}),
  postMessage({ type: "ready" }));
