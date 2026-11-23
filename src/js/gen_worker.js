"use strict";
!(function () {
  const e = "undefined" != typeof WorkerGlobalScope && self instanceof WorkerGlobalScope;
  function makeGenCore() {
    let e = null,
      t = null,
      r = null,
      n = null,
      d0 = "overworld";
    const s = {},
      genFor = (a) => {
        if (!e) throw new Error("generator not built" + (n ? ": " + n : ""));
        // "overworld" 语义 = 主世界生成器；SFE（dim:"sfe"）下重定向到 d0，避免误建空 settings 的 overworld 生成器
        if ("overworld" === a && "overworld" !== d0) a = d0;
        return (
          s[a] || (s[a] = a === d0 ? e : new WG.Generator(BigInt(t), self.WG_DATA, r, a))
        );
      };
    return async function handle(a, o) {
      try {
        if ("init" === a.type) {
          for (const e in s) delete s[e];
          ((e = null),
            (n = null),
            (t = a.seed),
            (r = a.palette),
            (d0 = a.dim || "overworld"),
            a.smap && self.SG && (SG.setStateMap(a.smap, a.swl), SG.setPalette(a.palette)),
            (e = new WG.Generator(BigInt(a.seed), self.WG_DATA, a.palette, d0)),
            (s[d0] = e),
            o({ type: "ready" }));
        } else if ("gen" === a.type) {
          const e = genFor(a.dim || "overworld"),
            t = performance.now();
          let r = null,
            n = null;
          const noStructs = (t) => {
            ((r = null), (e.beard = null), (n = "structures: " + String((t && t.stack) || t)));
          };
          if (!1 !== a.structures && self.SG && "end" !== e.dim)
            try {
              (await SG.ready, (r = SG.forChunk(e, a.cx, a.cz)), (e.beard = r.beard));
            } catch (e) {
              noStructs(e);
            }
          const s = performance.now();
          let l;
          try {
            l = e.generate(a.cx, a.cz);
          } catch (t) {
            if (!e.beard) throw t;
            (noStructs(t), (l = e.generate(a.cx, a.cz)));
          } finally {
            e.beard = null;
          }
          const i = performance.now();
          let c = null;
          if (r && r.starts.length)
            try {
              c = SG.place(e, a.cx, a.cz, l.blocks, l.meta, l.heightmap, r.starts);
            } catch (t) {
              (noStructs(t), (c = null), (l = e.generate(a.cx, a.cz)));
            }
          const f = new Uint8Array(256);
          for (let t = 0; t < 16; t++)
            for (let r = 0; r < 16; r++) {
              const n = 16 * a.cx + r,
                s = 16 * a.cz + t,
                o = "nether" === e.dim ? 40 : l.heightmap[16 * t + r] + 1;
              f[16 * t + r] = e.biomeIdx.get(e.biomeAt(n, o, s));
            }
          if (a.height && a.height > e.height) {
            const e = new Uint16Array(256 * a.height);
            (e.set(l.blocks), (l.blocks = e));
            const t = new Uint8Array(256 * a.height);
            (t.set(l.meta), (l.meta = t));
            const r = new Uint8Array(16 * (a.height >> 2));
            r.set(l.quartBiomes);
            for (let e = l.quartBiomes.length; e < r.length; e++) r[e] = r[e - 16];
            l.quartBiomes = r;
          }
          const d = {
            type: "chunk",
            cx: a.cx,
            cz: a.cz,
            id: a.id,
            blocks: l.blocks,
            qb: l.quartBiomes,
            hm: l.heightmap,
            sb: f,
            ms: [s - t, i - s, performance.now() - i],
          };
          n && (d.warn = n);
          const m = [l.blocks.buffer, l.quartBiomes.buffer, l.heightmap.buffer, f.buffer];
          (c && ((d.meta = l.meta), (d.sx = c), m.push(l.meta.buffer)), o(d, m));
        } else if ("locate" === a.type)
          (await SG.ready,
            o({
              type: "locate",
              id: a.id,
              r: SG.locate(genFor(a.dim || "overworld"), a.name, a.cx, a.cz),
            }));
        else if ("biomes" === a.type) {
          const e = genFor(a.dim || "overworld"),
            t = e.height >> 2,
            r = 16 * t,
            n = new Uint8Array(a.list.length * r);
          (e.rs.endChunk(),
            a.list.forEach(([s, a], o) => {
              for (let l = 0; l < t; l++)
                for (let t = 0; t < 4; t++)
                  for (let i = 0; i < 4; i++)
                    n[o * r + 4 * (4 * l + t) + i] = e.biomeIdx.get(
                      e.biomes.at(4 * s + i, (e.minY >> 2) + l, 4 * a + t),
                    );
            }),
            o({ type: "biomes", id: a.id, qy: t, data: n }, [n.buffer]));
        } else if ("spawn" === a.type) {
          const e = WG.findSpawn(genFor("overworld"));
          o({ type: "spawn", id: a.id, x: e[0], z: e[1] });
        }
      } catch (e) {
        ("init" !== a.type || n || (n = String((e && e.message) || e)),
          o({ type: "error", id: a.id, message: String((e && e.stack) || e) }));
      }
    };
  }
  if (
    (e &&
      importScripts(
        "worldgen_data.js",
        "sfe_mapdata.js",
        "blockdata.js",
        "modapi.js",
        ...(new URLSearchParams(self.location.search).get("mods") || "")
          .split(",")
          .filter((e) => /^[a-z0-9_]{1,32}$/.test(e))
          .map((e) => "../mods/" + e + "/data.js"),
        "worldgen.js",
        "structures_data.js",
        "structgen.js",
        "structtypes.js",
      ),
    e)
  ) {
    const e = makeGenCore();
    self.onmessage = (t) => e(t.data, (e, t) => self.postMessage(e, t || []));
  } else self.makeGenCore = makeGenCore;
})();
//# sourceURL=js/gen_worker.js
