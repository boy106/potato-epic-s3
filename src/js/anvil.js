"use strict";
const VanillaImport = (() => {
  const t = [
      { dim: "overworld", minY: -64, paths: ["dimensions/minecraft/overworld/region/", "region/"] },
      {
        dim: "nether",
        minY: 0,
        paths: ["dimensions/minecraft/the_nether/region/", "DIM-1/region/"],
      },
      { dim: "end", minY: 0, paths: ["dimensions/minecraft/the_end/region/", "DIM1/region/"] },
    ],
    strip = (t) => String(t).replace(/^minecraft:/, ""),
    compText = (t, e) => {
      if (null == t) return "";
      if ("string" == typeof t) {
        if (e && /^\s*[{"]/.test(t))
          try {
            return compText(JSON.parse(t));
          } catch (t) {}
        return t;
      }
      if ("object" != typeof t) return String(t);
      if (Array.isArray(t)) return t.map((t) => compText(t)).join("");
      const n = Object.keys(t);
      if (1 === n.length && "" === n[0]) return compText(t[""]);
      let o = null != t.text ? compText(t.text) : "";
      if (null == t.text && null != t.translate) {
        const e = Array.isArray(t.with) ? t.with.map((t) => compText(t)) : [];
        o =
          null != t.fallback
            ? String(t.fallback)
            : String(t.translate) + (e.length ? " " + e.join(", ") : "");
      }
      return o + (Array.isArray(t.extra) ? t.extra.map((t) => compText(t)).join("") : "");
    };
  async function fromFileList(t) {
    const e = [...t];
    if (1 === e.length && /\.zip$/i.test(e[0].name))
      return (async function fromZip(t) {
        const e = new Uint8Array(await t.arrayBuffer()),
          n = new DataView(e.buffer);
        let o = -1;
        for (let t = e.length - 22; t >= Math.max(0, e.length - 65557); t--)
          if (101010256 === n.getUint32(t, !0)) {
            o = t;
            break;
          }
        if (o < 0) throw new Error("不是有效的 zip 文件");
        let i = n.getUint16(o + 10, !0),
          r = n.getUint32(o + 16, !0);
        const a = new Map(),
          s = new TextDecoder();
        for (; i-- > 0 && 33639248 === n.getUint32(r, !0);) {
          const t = n.getUint16(r + 10, !0),
            o = n.getUint32(r + 20, !0),
            i = n.getUint16(r + 28, !0),
            l = n.getUint16(r + 30, !0),
            c = n.getUint16(r + 32, !0),
            u = n.getUint32(r + 42, !0),
            f = s.decode(e.subarray(r + 46, r + 46 + i)).replace(/\\/g, "/");
          if (((r += 46 + i + l + c), f.endsWith("/"))) continue;
          const m = u + 30 + n.getUint16(u + 26, !0) + n.getUint16(u + 28, !0),
            d = e.subarray(m, m + o);
          0 === t
            ? a.set(f, async () => d)
            : 8 === t && a.set(f, () => NBT.inflate(d, "deflate-raw"));
        }
        return rootAt(a);
      })(e[0]);
    const n = new Map();
    for (const t of e)
      n.set((t.webkitRelativePath || t.name).replace(/\\/g, "/"), () =>
        t.arrayBuffer().then((t) => new Uint8Array(t)),
      );
    return rootAt(n);
  }
  function rootAt(t) {
    let e = null;
    for (const n of t.keys())
      if (/(^|\/)level\.dat$/.test(n)) {
        const t = n.slice(0, -9);
        (null === e || t.length < e.length) && (e = t);
      }
    if (null === e)
      throw new Error(
        "没有找到 level.dat：请选择存档的世界文件夹（里面有 level.dat 和 region 或 dimensions）",
      );
    const n = new Map();
    for (const [o, i] of t) o.startsWith(e) && n.set(o.slice(e.length), i);
    return n;
  }
  async function readNbt(t, e) {
    const n = t.get(e);
    if (!n) return null;
    let o = await n();
    return (31 === o[0] && 139 === o[1] && (o = await NBT.inflate(o, "gzip")), NBT.parse(o));
  }
  const e = new Map(),
    n = new Map(),
    o = new Map(),
    i = { bubble_column: "water" };
  function stateOf(t) {
    let r = i[strip(t.Name)] || strip(t.Name);
    if (t.Properties) {
      const e = Object.keys(t.Properties).sort();
      e.length && (r += "[" + e.map((e) => e + "=" + t.Properties[e]).join(",") + "]");
    }
    let a = e.get(r);
    if (void 0 !== a && a[3]) {
      const e = strip(t.Name),
        i = "missing" === a[3] ? n : o;
      i.set(e, (i.get(e) || 0) + 1);
    }
    if (
      void 0 === a &&
      ((a = mapVanillaStateNear(r)),
      a ? a[2] && (a = [a[0], a[1], !0, "near"]) : (a = [0, 0, !1, "missing"]),
      e.set(r, a),
      a[3])
    ) {
      const e = strip(t.Name),
        i = "missing" === a[3] ? n : o;
      i.set(e, (i.get(e) || 0) + 1);
    }
    return a;
  }
  const stackOf = (t) => {
    const e = ITEM_KEY[strip(t.id)];
    if (void 0 === e) return null;
    const n = makeStack(e, t.count ?? t.Count ?? 1),
      o = t.components && t.components["minecraft:damage"];
    return (o && (n.dmg = o), n);
  };
  function convertChunk(t, e, n, o, i) {
    if (t.Level || !t.sections) return (i.old++, null);
    if ("full" !== strip(t.Status || "")) return (i.partial++, null);
    const r = new Uint16Array(256 * n),
      a = new Uint8Array(256 * n),
      s = [];
    for (const n of t.sections) {
      const t = n.block_states;
      if (!t || !t.palette || !t.palette.length) continue;
      const o = 256 * (16 * n.Y - e);
      if (o < 0 || o + 4096 > r.length) continue;
      const i = t.palette.map((t) => {
        const e = stateOf(t);
        return t.Properties && "true" === t.Properties.waterlogged
          ? e[0]
            ? canWaterlog(e[0], e[1])
              ? [e[0], e[1], e[2], e[3], !0]
              : e
            : [WATER, 0]
          : e;
      });
      if (1 === i.length || !t.data) {
        const [t, e, , , n] = i[0];
        if ((t && (r.fill(t, o, o + 4096), a.fill(e, o, o + 4096)), n))
          for (let t = 0; t < 4096; t++) s.push(o + t);
        continue;
      }
      const l = Math.max(4, 32 - Math.clz32(i.length - 1)),
        c = Math.floor(64 / l),
        u = (1 << l) - 1,
        f = t.data;
      for (let t = 0; t < 4096; t++) {
        const e = (t / c) | 0,
          n = (t - e * c) * l,
          m = f.lo(e),
          d = f.hi(e),
          p =
            i[
              n >= 32
                ? (d >>> (n - 32)) & u
                : n + l <= 32
                  ? (m >>> n) & u
                  : ((m >>> n) | (d << (32 - n))) & u
            ] || i[0];
        ((r[o + t] = p[0]), (a[o + t] = p[1]), p[4] && s.push(o + t));
      }
    }
    for (const a of t.block_entities || []) {
      const t = strip(a.id),
        s = a.x,
        l = a.y - e,
        c = a.z;
      if (l < 0 || l >= n) continue;
      const u = a.Items || [],
        f = BLOCKS[r[(l << 8) | ((15 & c) << 4) | (15 & s)]];
      if (f)
        if (("chest" !== t && "trapped_chest" !== t && "barrel" !== t) || "chest" !== f.key)
          if (("furnace" !== t && "blast_furnace" !== t && "smoker" !== t) || "furnace" !== f.onUse)
            "command_block" === t &&
              /^(chain_|repeating_)?command_block$/.test(f.key) &&
              (o[`${s},${l},${c}`] = {
                type: "command_block",
                pos: [s, l, c],
                command: String(a.Command || ""),
                success: 0 | a.SuccessCount,
                output: compText(a.LastOutput, !0),
                track: 0 !== a.TrackOutput,
                auto: !!a.auto,
                powered: !!a.powered,
                met: !!a.conditionMet,
              });
          else {
            const t = {
              type: "furnace",
              pos: [s, l, c],
              input: null,
              fuel: null,
              output: null,
              burn: 0,
              burnMax: 0,
              cook: 0,
            };
            for (const e of u) {
              const n = stackOf(e);
              0 === e.Slot
                ? (t.input = n)
                : 1 === e.Slot
                  ? (t.fuel = n)
                  : 2 === e.Slot && (t.output = n);
            }
            ((t.burn = Math.max(0, 0 | (a.lit_time_remaining ?? a.BurnTime ?? 0))),
              (t.burnMax = Math.max(t.burn, 0 | a.lit_total_time)),
              (t.cook = Math.max(0, 0 | (a.cooking_time_spent ?? a.CookTime ?? 0))),
              (o[`${s},${l},${c}`] = t),
              i.containers++);
          }
        else {
          const t = new Array(27).fill(null);
          for (const e of u) {
            const n = stackOf(e);
            n && e.Slot >= 0 && e.Slot < 27 && (t[e.Slot] = n);
          }
          const e = { type: "chest", pos: [s, l, c], slots: t };
          (!u.length && a.LootTable && (e.loot = strip(a.LootTable)),
            (o[`${s},${l},${c}`] = e),
            i.containers++);
        }
    }
    const l = { b: new Uint16Array(rleEncode(r)), m: new Uint16Array(rleEncode(a)) };
    return (
      s.length && ((l.w = Uint32Array.from(s)), (i.waterlogged = (i.waterlogged || 0) + s.length)),
      l
    );
  }
  async function regionChunks(t, e, n, o) {
    const i = new DataView(t.buffer, t.byteOffset, t.byteLength);
    for (let r = 0; r < 1024; r++) {
      const a = 4096 * (i.getUint32(4 * r) >>> 8);
      if (!a || a + 5 > t.length) continue;
      const s = i.getUint32(a),
        l = t[a + 4];
      let c = t.subarray(a + 5, a + 4 + s);
      if (128 & l) {
        const t = n.get(e + `c.${31 & r}.${r >> 5}.mcc`);
        if (!t) {
          await o(null, "external");
          continue;
        }
        c = await t();
      }
      const u = 127 & l;
      try {
        if (1 === u) c = await NBT.inflate(c, "gzip");
        else if (2 === u) c = await NBT.inflate(c, "deflate");
        else if (3 !== u) {
          await o(null, "compression " + u);
          continue;
        }
        await o(NBT.parse(c), null);
      } catch (t) {
        await o(null, "error");
      }
    }
  }
  const r = [2, 3, 4, 5, 0, 1],
    a = [5, 0, 4, 1],
    s = new Map(),
    slotsOf = (t, e) => {
      const n = new Array(e).fill(null);
      for (const o of t || []) {
        const t = stackOf(o);
        t && o.Slot >= 0 && o.Slot < e && (n[o.Slot] = t);
      }
      return n;
    },
    blockPosOf = (t, e) => {
      const n = t.block_pos || (void 0 !== t.TileX ? [t.TileX, t.TileY, t.TileZ] : null);
      return n ? [Number(n[0]), Number(n[1]) - e, Number(n[2])] : null;
    };
  function entityRecord(t, e, n, o) {
    const i = strip(e.id || ""),
      l = e.Pos;
    if (!l) return null;
    const c = [Number(l[0]), Number(l[1]) - n, Number(l[2])],
      u = e.Rotation ? Math.PI - (Number(e.Rotation[0]) * Math.PI) / 180 : 0;
    let f = /^(.+?)_(chest_)?(boat|raft)$/.exec(i);
    if (f)
      return {
        type: (f[2] ? "chest_boat:" : "boat:") + f[1],
        pos: c,
        yaw: u,
        x: {
          yaw: u,
          slots: f[2] ? slotsOf(e.Items, 27) : void 0,
          loot: e.LootTable ? strip(e.LootTable) : void 0,
        },
      };
    if (((f = /^(?:(chest|furnace|tnt|hopper)_)?minecart$/.exec(i)), f)) {
      const t = f[1] || "";
      return {
        type: "minecart:" + t,
        pos: c,
        yaw: u,
        x: {
          yaw: u,
          slots:
            "chest" === t ? slotsOf(e.Items, 27) : "hopper" === t ? slotsOf(e.Items, 5) : void 0,
          fuel: Number(e.Fuel || 0),
          enabled: void 0 === e.Enabled ? void 0 : !!e.Enabled,
          loot: e.LootTable ? strip(e.LootTable) : void 0,
        },
      };
    }
    if ("item_frame" === i || "glow_item_frame" === i) {
      const t = blockPosOf(e, n);
      return t
        ? {
            type: i,
            pos: [t[0] + 0.5, t[1], t[2] + 0.5],
            yaw: 0,
            x: {
              b: t,
              f: r[Number(e.Facing) || 0] ?? 4,
              it: e.Item ? stackOf(e.Item) : null,
              r: Number(e.ItemRotation || 0),
              t: i,
            },
          }
        : null;
    }
    if ("painting" === i) {
      const t = blockPosOf(e, n);
      return t
        ? {
            type: i,
            pos: [t[0] + 0.5, t[1], t[2] + 0.5],
            yaw: 0,
            x: {
              b: t,
              f: a[3 & Number(e.facing ?? e.Facing)],
              v: strip(e.variant || e.Motive || ""),
            },
          }
        : null;
    }
    if ("armor_stand" === i) {
      const t = e.equipment || {},
        n = e.ArmorItems || [],
        o = e.HandItems || [],
        st = (t) => (t && t.id ? stackOf(t) : null);
      return {
        type: i,
        pos: c,
        yaw: u,
        x: {
          g: [
            st(t.feet || n[0]),
            st(t.legs || n[1]),
            st(t.chest || n[2]),
            st(t.head || n[3]),
            st(t.mainhand || o[0]),
            st(t.offhand || o[1]),
          ],
          s: !!e.Small,
          a: !!e.ShowArms,
          y: u,
        },
      };
    }
    if (!s.has(i)) {
      let e = null;
      try {
        e = createMob(t, i, 0, -1e3, 0);
      } catch (t) {
        e = null;
      }
      s.set(i, e && e.type === i && e instanceof Mob ? { hostile: !(!e.T || !e.T.hostile) } : null);
    }
    const m = s.get(i);
    if (!m)
      return (
        /^(item|experience_orb|arrow|spectral_arrow|trident|falling_block|tnt|marker|area_effect_cloud|interaction|.*_display|lightning_bolt)$/.test(
          i,
        ) || o.entitiesMissing.set(i, (o.entitiesMissing.get(i) || 0) + 1),
        null
      );
    if (m.hostile && !e.PersistenceRequired && !e.CustomName) return null;
    const d = Number(e.Age || 0);
    return {
      type: i,
      pos: c,
      yaw: u,
      health: void 0 !== e.Health ? Number(e.Health) : void 0,
      sheared: !!e.Sheared,
      wool: Number(e.Color || 0),
      baby: d < 0 || e.IsBaby ? Math.max(1, Math.min(6e3, Math.ceil(-d / 4) || 6e3)) : 0,
      size: void 0 !== e.Size ? Number(e.Size) + 1 : void 0,
    };
  }
  return {
    run: async function run(e, i, r) {
      const a = await fromFileList(i);
      setWorldFormat(2);
      const s = HEIGHT,
        l = await readNbt(a, "level.dat");
      if (!l || !l.Data) throw new Error("level.dat 读取失败");
      const c = l.Data,
        u = await readNbt(
          a,
          "dimensions/minecraft/overworld/data/minecraft/world_gen_settings.dat",
        ),
        f =
          (u && u.data && u.data.seed) ??
          (c.WorldGenSettings && c.WorldGenSettings.seed) ??
          c.RandomSeed;
      if (void 0 === f) throw new Error("找不到世界种子");
      const m = (c.Version && c.Version.Name) || "未知版本";
      let d = null;
      c.spawn && c.spawn.pos
        ? (d = [c.spawn.pos[0], c.spawn.pos[1], c.spawn.pos[2]])
        : void 0 !== c.SpawnX && (d = [c.SpawnX, c.SpawnY, c.SpawnZ]);
      const p = "w" + Date.now().toString(36),
        h = { chunks: 0, old: 0, partial: 0, skipped: 0, containers: 0, regions: 0, perDim: {} };
      (n.clear(), o.clear());
      const g = {},
        w = [];
      for (const e of t) {
        const t = e.paths.find((t) =>
          [...a.keys()].some((e) => e.startsWith(t) && e.endsWith(".mca")),
        );
        if (t)
          for (const n of a.keys())
            n.startsWith(t) &&
              /^r\.-?\d+\.-?\d+\.mca$/.test(n.slice(t.length)) &&
              w.push({ d: e, dir: t, p: n });
      }
      if (!w.some((t) => "overworld" === t.d.dim))
        throw new Error("存档里没有主世界的区域文件（region/*.mca）");
      let y = 0,
        b = performance.now();
      for (const t of w) {
        const { d: e, dir: n, p: o } = t,
          i = "overworld" === e.dim ? p : p + "~" + e.dim,
          l = (g[e.dim] || (g[e.dim] = { blockEntities: {}, mobs: [] })).blockEntities,
          c = await a.get(o)();
        let u = [];
        (await regionChunks(c, n, a, async (t, n) => {
          if (!t) return void h.skipped++;
          const o = convertChunk(t, e.minY, s, l, h);
          o &&
            (u.push([t.xPos, t.zPos, o]),
            h.chunks++,
            (h.perDim[e.dim] = (h.perDim[e.dim] || 0) + 1),
            u.length >= 64 && (await DB.putChunks(i, u), (u = [])),
            performance.now() - b > 50 &&
              ((b = performance.now()),
              r && r(y / w.length, h),
              await new Promise((t) => setTimeout(t, 0))));
        }),
          u.length && (await DB.putChunks(i, u)),
          h.regions++,
          y++,
          r && r(y / w.length, h));
      }
      ((h.entities = 0), (h.entitiesMissing = new Map()));
      for (const n of t) {
        const t = n.paths
          .map((t) => t.replace(/region\/$/, "entities/"))
          .find((t) => [...a.keys()].some((e) => e.startsWith(t) && e.endsWith(".mca")));
        if (!t || !g[n.dim]) continue;
        const o = g[n.dim].mobs;
        for (const i of a.keys())
          i.startsWith(t) &&
            /^r\.-?\d+\.-?\d+\.mca$/.test(i.slice(t.length)) &&
            (await regionChunks(await a.get(i)(), t, a, async (t) => {
              for (const i of (t && t.Entities) || []) {
                let t = null;
                try {
                  t = entityRecord(e, i, n.minY, h);
                } catch (e) {
                  t = null;
                }
                t && (o.push(t), h.entities++);
              }
            }),
            performance.now() - b > 50 &&
              ((b = performance.now()), await new Promise((t) => setTimeout(t, 0))));
      }
      h.entitiesMissing = [...h.entitiesMissing].sort((t, e) => e[1] - t[1]);
      const k = ["survival", "creative", "survival", "spectator"][c.GameType ?? 0] || "survival",
        v = {
          id: p,
          name: (c.LevelName || "导入的世界") + "（导入）",
          seed: String(f),
          gen: 2,
          mode: k,
          flat: !1,
          created: Date.now(),
          lastPlayed: Date.now(),
          time: Number(c.DayTime ?? c.Time ?? 1000n) || 1e3,
          player: null,
          hardcore: !!(c.hardcore || (c.difficulty_settings && c.difficulty_settings.hardcore)),
          difficulty:
            { peaceful: 0, easy: 1, normal: 2, hard: 3 }[
              c.difficulty_settings && c.difficulty_settings.difficulty
            ] ??
            c.Difficulty ??
            2,
          cheats: !0,
          structures: !0,
          bonus: !1,
          spawn: d ? [d[0], d[1] - MIN_Y, d[2]] : null,
          dims: g,
          imported: {
            version: m,
            dataVersion: c.DataVersion,
            chunks: h.chunks,
            perDim: h.perDim,
            at: Date.now(),
          },
        };
      return (
        await DB.putWorld(v),
        (h.missing = [...n].sort((t, e) => e[1] - t[1])),
        (h.substituted = [...o].sort((t, e) => e[1] - t[1])),
        { meta: v, stats: h }
      );
    },
    fromFileList: fromFileList,
    convertChunk: convertChunk,
    regionChunks: regionChunks,
    stateOf: stateOf,
    missing: n,
  };
})();
//# sourceURL=js/anvil.js
