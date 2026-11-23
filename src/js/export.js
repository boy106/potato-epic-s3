"use strict";
const RoomExport = (() => {
  const t = 4903,
    e = 100 << 20,
    n = [
      {
        dim: "overworld",
        vdim: "minecraft:overworld",
        dir: "dimensions/minecraft/overworld/",
        minY: -64,
        height: 384,
      },
      {
        dim: "nether",
        vdim: "minecraft:the_nether",
        dir: "dimensions/minecraft/the_nether/",
        minY: 0,
        height: 256,
      },
      {
        dim: "end",
        vdim: "minecraft:the_end",
        dir: "dimensions/minecraft/the_end/",
        minY: 0,
        height: 256,
      },
    ],
    ns = (t) => (String(t).includes(":") ? String(t) : "minecraft:" + t),
    ceilLog2 = (t) => 32 - Math.clz32(t - 1),
    pause = () => new Promise((t) => setTimeout(t, 0));
  const o = new Map(),
    mapOf = (t) => {
      try {
        return mapVanillaState(t);
      } catch (t) {
        return null;
      }
    };
  function statesOf(t) {
    let e = o.get(t);
    if (e) return e;
    ((e = []), o.set(t, e));
    const n = VSTATES[t];
    if (void 0 === n) return e;
    if (0 === n) {
      const n = mapOf(t);
      return (n && e.push([n[0], n[1], null]), e);
    }
    const s = n[0],
      r = s.map(() => 0);
    for (;;) {
      const n = {};
      s.forEach(([t, e], o) => {
        n[t] = e[r[o]];
      });
      const o = mapOf(t + "[" + s.map(([t]) => t + "=" + n[t]).join(",") + "]");
      o && e.push([o[0], o[1], n]);
      let a = s.length - 1;
      for (; a >= 0 && ++r[a] >= s[a][1].length;) ((r[a] = 0), a--);
      if (a < 0) break;
    }
    return e;
  }
  let s = null;
  const r = new Map();
  function stateFor(t, e) {
    let n = r.get(t);
    if (!n) {
      ((n = new Map()), r.set(t, n));
      const e = BLOCKS[t];
      if (e)
        for (const o of (function candidates(t) {
          if (!s) {
            s = {};
            for (const [t, e] of Object.entries(STATE_ALIAS)) (s[e] || (s[e] = [])).push(t);
          }
          const e = new Set([t.key]);
          for (let n = 0; n < 2; n++)
            try {
              e.add(vanillaState(t, n, null).key);
            } catch (t) {}
          for (const n of s[t.key] || []) e.add(n);
          return (
            "lit_furnace" === t.key && e.add("furnace"),
            [...e].filter((t) => void 0 !== VSTATES[t])
          );
        })(e)) {
          const s = VSTATES[o],
            r = s ? Object.fromEntries(s[0].map(([t, e], n) => [t, e[s[1][n]]])) : {};
          for (const [s, a, i] of statesOf(o)) {
            if (s !== t) continue;
            let c = null;
            try {
              c = vanillaState(e, a, null);
            } catch (t) {}
            let l = c && c.key === o ? 1e3 : 0;
            if (i)
              for (const t in i)
                (c && void 0 !== c.p[t] && String(c.p[t]) === i[t] && (l += 10),
                  r[t] === i[t] && (l += 1));
            const f = n.get(a);
            (!f || l > f.sc) && n.set(a, { sc: l, name: o, props: i });
          }
        }
    }
    return n.get(e) || n.get(0) || n.values().next().value || null;
  }
  const a = new Map();
  let i = 0;
  const keyOf = (t, e) =>
    t +
    (e
      ? "[" +
        Object.keys(e)
          .map((t) => t + "=" + e[t])
          .join(",") +
        "]"
      : "");
  function makeEntry(t, e) {
    return {
      key: keyOf(t, e),
      name: t,
      props: e,
      nbt: e ? { Name: ns(t), Properties: e } : { Name: ns(t) },
      sec: -1,
      pi: 0,
    };
  }
  function entryOf(t, e, n) {
    const o = 256 * t + e;
    let s = a.get(o);
    if (s) return s;
    const r = t ? stateFor(t, e) : null,
      i = BLOCKS[t];
    if (r) {
      const t = r.props && { ...r.props };
      (t && "7" === t.distance && "false" === t.persistent && (t.distance = "1"),
        (s = makeEntry(r.name, t)),
        (s.ctx = !!((i && (i.stairs || i.fence)) || (r.props && "snowy" in r.props))),
        (s.wl = !(!r.props || !("waterlogged" in r.props))),
        (s.b = i));
    } else
      (t && i && n.missing.set(i.key, (n.missing.get(i.key) || 0) + 1),
        (s = makeEntry("air", null)));
    return (a.set(o, s), s);
  }
  function cellEntry(t, e, n, o) {
    const s = { ...t.props };
    if (t.b.stairs || t.b.fence) {
      let n = null;
      try {
        n = vanillaState(t.b, e, o);
      } catch (t) {}
      if (n) for (const t in n.p) t in s && (s[t] = String(n.p[t]));
    }
    return (
      "snowy" in s &&
        (s.snowy = [BID.snow, BID.snow_block].includes(o(0, 1, 0)[0]) ? "true" : "false"),
      n && t.wl && (s.waterlogged = "true"),
      makeEntry(t.name, s)
    );
  }
  function pack(t, e, n) {
    const o = Math.floor(64 / n),
      s = new Uint32Array(2 * Math.ceil(e / o));
    for (let r = 0; r < e; r++) {
      const e = (r / o) | 0,
        a = (r - e * o) * n,
        i = t[r];
      a >= 32
        ? (s[2 * e] |= i << (a - 32))
        : ((s[2 * e + 1] |= i << a), a + n > 32 && (s[2 * e] |= i >>> (32 - a)));
    }
    return new NBT.Longs(s);
  }
  function itemNbt(t, e) {
    if (!(t && t.count > 0)) return null;
    const n = t.unk || (ITEMS[t.id] && ITEMS[t.id].key);
    if (!n) return null;
    const o = {};
    (void 0 !== e && (o.Slot = NBT.byte(e)), (o.id = ns(n)), (o.count = t.count));
    const s = {};
    return (
      t.dmg && (s["minecraft:damage"] = 0 | t.dmg),
      t.name && (s["minecraft:custom_name"] = String(t.name)),
      t.e &&
        t.e.length &&
        (s["enchanted_book" === n ? "minecraft:stored_enchantments" : "minecraft:enchantments"] =
          Object.fromEntries(t.e.map(([t, e]) => [ns(t), 0 | e]))),
      t.pot && (s["minecraft:potion_contents"] = { potion: ns(t.pot) }),
      null != t.color && (s["minecraft:dyed_color"] = 0 | t.color),
      t.pv && (s["minecraft:painting/variant"] = ns(t.pv)),
      t.instrument && (s["minecraft:instrument"] = ns(t.instrument)),
      t.base && (s["minecraft:base_color"] = String(t.base)),
      t.patterns &&
        t.patterns.length &&
        (s["minecraft:banner_patterns"] = t.patterns.map(([t, e]) => ({
          color: String(e),
          pattern: ns(t),
        }))),
      Object.keys(s).length && (o.components = s),
      o
    );
  }
  const itemList = (t, e = 0) => (t || []).map((t, n) => itemNbt(t, n + e)).filter(Boolean);
  function blockEntityNbt(t, e, n, o, s) {
    const r = { id: "", x: n, y: o, z: s, keepPacked: NBT.byte(0) };
    switch (t.type) {
      case "chest":
        return (
          (r.id = ns(
            "barrel" === e || "trapped_chest" === e
              ? e
              : /shulker_box$/.test(e)
                ? "shulker_box"
                : "chest",
          )),
          (r.Items = itemList(t.slots)),
          t.loot && !r.Items.length && (r.LootTable = ns(t.loot)),
          r
        );
      case "furnace":
        return (
          (r.id = ns(["furnace", "smoker", "blast_furnace"].includes(e) ? e : "furnace")),
          (r.Items = [itemNbt(t.input, 0), itemNbt(t.fuel, 1), itemNbt(t.output, 2)].filter(
            Boolean,
          )),
          (r.lit_time_remaining = NBT.short(Math.min(32767, 0 | t.burn))),
          (r.lit_total_time = NBT.short(Math.min(32767, 0 | t.burnMax))),
          (r.cooking_time_spent = NBT.short(0 | t.cook)),
          (r.cooking_total_time = NBT.short("furnace" === e ? 200 : 100)),
          r
        );
      case "hopper":
      case "dispenser":
      case "dropper":
        return (
          (r.id = ns(t.type)),
          (r.Items = itemList(t.slots)),
          "hopper" === t.type && (r.TransferCooldown = 0),
          r
        );
      case "brewing":
        return t.bottles
          ? ((r.id = ns("brewing_stand")),
            (r.Items = [
              ...t.bottles.map((t, e) => itemNbt(t, e)),
              itemNbt(t.ingredient, 3),
              itemNbt(t.fuel, 4),
            ].filter(Boolean)),
            (r.BrewTime = NBT.short(0 | t.brewTime)),
            (r.Fuel = NBT.byte(Math.min(127, 0 | t.fuelLeft))),
            r)
          : null;
      case "sign": {
        if (!t.text) return null;
        const side = (t) => ({
          messages: [0, 1, 2, 3].map((e) => String((t && t.l && t.l[e]) || "")),
          color: (t && t.c) || "black",
          has_glowing_text: NBT.byte(t && t.g ? 1 : 0),
        });
        return (
          (r.id = ns(/hanging_sign$/.test(e) ? "hanging_sign" : "sign")),
          (r.front_text = side(t.text.f)),
          (r.back_text = side(t.text.b)),
          (r.is_waxed = NBT.byte(t.waxed ? 1 : 0)),
          r
        );
      }
      case "banner":
        return (
          (r.id = ns("banner")),
          (r.patterns = (t.patterns || []).map(([t, e]) => ({ color: String(e), pattern: ns(t) }))),
          t.name && (r.CustomName = String(t.name)),
          r
        );
      case "command_block":
        return /command_block$/.test(e)
          ? ((r.id = ns("command_block")),
            (r.Command = String(t.command || "")),
            (r.SuccessCount = 0 | t.success),
            (r.TrackOutput = NBT.byte(!1 === t.track ? 0 : 1)),
            !1 !== t.track && t.output && (r.LastOutput = String(t.output)),
            (r.UpdateLastExecution = NBT.byte(1)),
            (r.powered = NBT.byte(t.powered ? 1 : 0)),
            (r.conditionMet = NBT.byte(t.met ? 1 : 0)),
            (r.auto = NBT.byte(t.auto ? 1 : 0)),
            r)
          : null;
      case "pot":
        return (
          (r.id = ns("decorated_pot")),
          t.sherds && (r.sherds = t.sherds.map((t) => ns("number" == typeof t ? ITEMS[t].key : t))),
          r
        );
    }
    return null;
  }
  const c = [2, 3, 4, 5, 0, 1],
    l = [5, 0, 4, 1],
    uuid = () => {
      const t = new Int32Array(4);
      return (crypto.getRandomValues(t), t);
    },
    degOf = (t) => {
      let e = (180 * (Math.PI - (t || 0))) / Math.PI;
      return ((e = (((e % 360) + 540) % 360) - 180), e);
    };
  function entityNbt(t, e) {
    const n = String(t.type || ""),
      o = t.pos;
    if (!o) return null;
    const s = t.x || {},
      base = (n) => ({
        id: ns(n),
        Pos: [o[0], o[1] + e, o[2]].map(NBT.double),
        Motion: [0, 0, 0].map(NBT.double),
        Rotation: [NBT.float(degOf(t.yaw)), NBT.float(0)],
        UUID: uuid(),
        OnGround: NBT.byte(1),
        Fire: NBT.short(-1),
        Air: NBT.short(300),
      });
    let r = /^(chest_boat|boat):(.+)$/.exec(n);
    if (r) {
      const t = r[2],
        e = "bamboo" === t,
        n = base(t + ("chest_boat" === r[1] ? "_chest" : "") + (e ? "_raft" : "_boat"));
      return (
        "chest_boat" === r[1] &&
          ((n.Items = itemList(s.slots)), s.loot && !n.Items.length && (n.LootTable = ns(s.loot))),
        n
      );
    }
    if (((r = /^minecart:(.*)$/.exec(n)), r)) {
      const t = base((r[1] ? r[1] + "_" : "") + "minecart");
      return (
        ("chest" !== r[1] && "hopper" !== r[1]) ||
          ((t.Items = itemList(s.slots)), s.loot && !t.Items.length && (t.LootTable = ns(s.loot))),
        "furnace" === r[1] && (t.Fuel = NBT.short(0 | s.fuel)),
        "hopper" === r[1] && void 0 !== s.enabled && (t.Enabled = NBT.byte(s.enabled ? 1 : 0)),
        t
      );
    }
    if ("item_frame" === n || "glow_item_frame" === n) {
      if (!s.b) return null;
      const t = base(n);
      ((t.block_pos = Int32Array.of(s.b[0], s.b[1] + e, s.b[2])),
        (t.Facing = NBT.byte(Math.max(0, c.indexOf(s.f)))));
      const o = itemNbt(s.it);
      return (o && ((t.Item = o), (t.ItemRotation = NBT.byte(0 | s.r))), t);
    }
    if ("painting" === n) {
      if (!s.b || !s.v) return null;
      const t = base(n);
      return (
        (t.block_pos = Int32Array.of(s.b[0], s.b[1] + e, s.b[2])),
        (t.facing = NBT.byte(Math.max(0, l.indexOf(s.f)))),
        (t.variant = ns(s.v)),
        t
      );
    }
    if ("armor_stand" === n) {
      const t = base(n),
        e = s.g || [],
        o = {};
      return (
        ["feet", "legs", "chest", "head", "mainhand", "offhand"].forEach((t, n) => {
          const s = itemNbt(e[n]);
          s && (o[t] = s);
        }),
        (t.equipment = o),
        (t.Small = NBT.byte(s.s ? 1 : 0)),
        (t.ShowArms = NBT.byte(s.a ? 1 : 0)),
        t
      );
    }
    if (!self.VENTITIES.includes(n) || /^(ender_dragon|end_crystal|player)$/.test(n)) return null;
    const a = base(n);
    return (
      t.np || (a.PersistenceRequired = NBT.byte(1)),
      void 0 !== t.health && (a.Health = NBT.float(t.health)),
      t.baby &&
        (/zombie|piglin|zoglin/.test(n)
          ? (a.IsBaby = NBT.byte(1))
          : (a.Age = -Math.max(1, 4 * t.baby))),
      "sheep" === n &&
        ((a.Color = NBT.byte(0 | t.wool)), (a.Sheared = NBT.byte(t.sheared ? 1 : 0))),
      ("slime" !== n && "magma_cube" !== n) || !t.size || (a.Size = Math.max(0, t.size - 1)),
      a
    );
  }
  const xpNeeded = (t) => (t >= 30 ? 112 + 9 * (t - 30) : t >= 15 ? 37 + 5 * (t - 15) : 7 + 2 * t);
  function regionFile(t) {
    let e = 2;
    const n = t.map(([t, n, o]) => {
        const s = Math.ceil((o.length + 5) / 4096),
          r = e;
        return ((e += s), [t, n, o, r, s]);
      }),
      o = new Uint8Array(4096 * e),
      s = new DataView(o.buffer),
      r = (Date.now() / 1e3) | 0;
    for (const [t, e, a, i, c] of n) {
      const n = (31 & t) + 32 * (31 & e);
      (s.setUint32(4 * n, (i << 8) | c),
        s.setUint32(4096 + 4 * n, r),
        s.setUint32(4096 * i, a.length + 1),
        (o[4096 * i + 4] = 2),
        o.set(a, 4096 * i + 5));
    }
    return o;
  }
  return {
    build: async function build(o, s) {
      if (!o || 2 !== o.gen) throw new Error("只有新版地形的存档能用来开房间");
      if (o.flat) throw new Error("超平坦世界暂时不能用来开房间");
      (await (function loadStates() {
        return self.VSTATES
          ? Promise.resolve()
          : new Promise((t, e) => {
              const n = document.createElement("script");
              ((n.src = "js/vstates_data.js"),
                (n.onload = t),
                (n.onerror = () => e(new Error("方块数据加载失败，请检查网络"))),
                document.head.appendChild(n));
            });
      })(),
        setWorldFormat(2));
      const r = { chunks: 0, entities: 0, blockEntities: 0, missing: new Map(), skipped: 0 },
        a = new Map();
      let c = 0;
      const add = (t, n) => {
          if ((a.set(t, n), (c += n.length + t.length + 6), c > e))
            throw new Error("存档太大了（超过 100 MB），不能用来开房间");
        },
        l = new GenPool(o.seed);
      try {
        await l.ready;
        const e = [];
        for (const t of n) {
          const n = "overworld" === t.dim ? o.id : o.id + "~" + t.dim,
            s = [...(await DB.chunkKeys(n))].map((t) => [
              Math.floor(t / 65536) - 32768,
              (t % 65536) - 32768,
            ]);
          e.push({ D: t, sid: n, keys: s });
        }
        const a = e.reduce((t, e) => t + e.keys.length, 0) || 1;
        let c = 0,
          f = performance.now();
        for (const { D: n, sid: m, keys: u } of e) {
          const e = (o.dims && o.dims[n.dim]) || { blockEntities: {}, mobs: [] };
          if (!u.length && !(e.mobs || []).length) continue;
          const p = new Map();
          await Promise.all(
            Array.from(
              { length: Math.ceil(u.length / 16) },
              (t, e) =>
                new Promise((t) => {
                  const o = u.slice(16 * e, 16 * e + 16);
                  l.request({ type: "biomes", list: o, dim: n.dim }, (e) => {
                    const n = 16 * e.qy;
                    (e.data &&
                      o.forEach(([t, o], s) =>
                        p.set(t + "," + o, e.data.subarray(s * n, s * n + n)),
                      ),
                      t());
                  });
                }),
            ),
          );
          const d = 256 * HEIGHT,
            h = new Map(),
            b = new Set(u.map(([t, e]) => t + "," + e)),
            chunk = async (t, e) => {
              const n = t + "," + e;
              if (h.has(n)) return h.get(n);
              let o = null;
              if (b.has(n)) {
                const n = await DB.getChunk(m, t, e);
                n &&
                  (o = {
                    B: rleDecode(n.b, d),
                    M: rleDecode(n.m, d),
                    W: n.w && n.w.length ? new Set(n.w) : null,
                  });
              }
              return (h.set(n, o), h.size > 40 && h.delete(h.keys().next().value), o);
            },
            g = new Map();
          for (const [t, e] of u) {
            const n = (t >> 5) + "," + (e >> 5);
            (g.get(n) || g.set(n, []).get(n)).push([t, e]);
          }
          const y = new Map();
          for (const [t, n] of Object.entries(e.blockEntities || {})) {
            const [e, , o] = t.split(",").map(Number),
              s = (e >> 4) + "," + (o >> 4);
            (y.get(s) || y.set(s, []).get(s)).push(n);
          }
          const w = n.height >> 4,
            T = self.WG_DATA.biome_order;
          for (const [e, o] of g) {
            o.sort((t, e) => t[1] - e[1] || t[0] - e[0]);
            const l = [];
            for (const [e, m] of o) {
              const o = await chunk(e, m);
              if (!o) {
                r.skipped++;
                continue;
              }
              for (let t = -1; t <= 1; t++)
                for (let n = -1; n <= 1; n++) (n || t) && (await chunk(e + n, m + t));
              const near = (t, n) => h.get(e + Math.floor(t / 16) + "," + (m + Math.floor(n / 16))),
                u = [],
                d = p.get(e + "," + m);
              for (let t = 0; t < w; t++) {
                const e = 4096 * t,
                  s = ++i,
                  a = [],
                  c = new Uint16Array(4096),
                  l = new Map();
                for (let t = 0; t < 4096; t++) {
                  const n = e + t,
                    i = o.B[n],
                    f = o.M[n];
                  let m = entryOf(i, f, r);
                  const u = !(!o.W || !o.W.has(n));
                  if (m.ctx || (u && m.wl)) {
                    const e = 15 & t,
                      s = (t >> 4) & 15,
                      r = n >> 8,
                      a = cellEntry(m, f, u, (t, n, a) => {
                        const i = r + n,
                          c = e + t,
                          l = s + a;
                        if (i < 0 || i >= HEIGHT) return [0, 0];
                        const f = c >= 0 && c < 16 && l >= 0 && l < 16 ? o : near(c, l);
                        if (!f) return [0, 0];
                        const m = (i << 8) | ((15 & l) << 4) | (15 & c);
                        return [f.B[m], f.M[m]];
                      });
                    m = l.get(a.key) || (l.set(a.key, a), a);
                  }
                  (m.sec !== s && ((m.sec = s), (m.pi = a.length), a.push(m.nbt)), (c[t] = m.pi));
                }
                const f =
                  1 === a.length
                    ? { palette: a }
                    : { palette: a, data: pack(c, 4096, Math.max(4, ceilLog2(a.length))) };
                let m = { palette: [ns("plains")] };
                if (d) {
                  const e = [],
                    n = new Map(),
                    o = new Uint8Array(64);
                  for (let s = 0; s < 64; s++) {
                    const r = d[64 * t + s];
                    let a = n.get(r);
                    (void 0 === a && ((a = e.length), n.set(r, a), e.push(ns(T[r]))), (o[s] = a));
                  }
                  m =
                    1 === e.length
                      ? { palette: e }
                      : { palette: e, data: pack(o, 64, ceilLog2(e.length)) };
                }
                u.push({ Y: NBT.byte((n.minY >> 4) + t), block_states: f, biomes: m });
              }
              const b = [];
              for (const t of y.get(e + "," + m) || []) {
                const [e, s, a] = t.pos || [];
                if (void 0 === s || s < 0 || s >= n.height) continue;
                const i = stateFor(
                  o.B[(s << 8) | ((15 & a) << 4) | (15 & e)],
                  o.M[(s << 8) | ((15 & a) << 4) | (15 & e)],
                );
                let c = null;
                try {
                  c = blockEntityNbt(t, i ? i.name : "", e, s + n.minY, a);
                } catch (t) {
                  c = null;
                }
                c && (b.push(c), r.blockEntities++);
              }
              const g = {
                DataVersion: t,
                xPos: e,
                yPos: n.minY >> 4,
                zPos: m,
                Status: "minecraft:full",
                LastUpdate: 0n,
                InhabitedTime: 0n,
                isLightOn: NBT.byte(0),
                sections: u,
                block_entities: b,
                block_ticks: [],
                fluid_ticks: [],
                PostProcessing: [],
                structures: { References: {}, starts: {} },
              };
              (l.push([31 & e, 31 & m, await NBT.deflate(NBT.write(g), "deflate")]),
                r.chunks++,
                c++,
                performance.now() - f > 40 &&
                  ((f = performance.now()),
                  s && s(c / a, `正在转换区块 ${c} / ${a}`),
                  await pause()));
            }
            if (l.length) {
              const [t, o] = e.split(",");
              add(`${n.dir}region/r.${t}.${o}.mca`, regionFile(l));
            }
          }
          const N = new Map();
          for (const t of e.mobs || []) {
            let e = null;
            try {
              e = entityNbt(t, n.minY);
            } catch (t) {
              e = null;
            }
            if (!e) continue;
            const o = Math.floor(t.pos[0]) >> 4,
              s = Math.floor(t.pos[2]) >> 4,
              a = o + "," + s;
            ((N.get(a) || N.set(a, { cx: o, cz: s, list: [] }).get(a)).list.push(e), r.entities++);
          }
          const B = new Map();
          for (const { cx: e, cz: n, list: o } of N.values()) {
            const s = await NBT.deflate(
                NBT.write({ DataVersion: t, Position: Int32Array.of(e, n), Entities: o }),
                "deflate",
              ),
              r = (e >> 5) + "," + (n >> 5);
            (B.get(r) || B.set(r, []).get(r)).push([31 & e, 31 & n, s]);
          }
          for (const [t, e] of B) {
            const [o, s] = t.split(",");
            add(`${n.dir}entities/r.${o}.${s}.mca`, regionFile(e));
          }
        }
      } finally {
        l.terminate();
      }
      const f = (function playerNbt(e) {
        const o = e.player;
        if (!o || !o.pos) return null;
        const s = n.find((t) => t.dim === (e.dim || "overworld")) || n[0],
          r = o.inv || [],
          a = {},
          i = Math.max(0, 0 | o.xp);
        let c = 0,
          l = 0;
        for (; l + xpNeeded(c) <= i;) ((l += xpNeeded(c)), c++);
        return (
          [
            ["head", 36],
            ["chest", 37],
            ["legs", 38],
            ["feet", 39],
            ["offhand", 40],
          ].forEach(([t, e]) => {
            const n = itemNbt(r[e]);
            n && (a[t] = n);
          }),
          {
            DataVersion: t,
            Dimension: s.vdim,
            Pos: [o.pos[0], o.pos[1] + s.minY, o.pos[2]].map(NBT.double),
            Motion: [0, 0, 0].map(NBT.double),
            Rotation: [NBT.float(degOf(o.yaw)), NBT.float((180 * -(o.pitch || 0)) / Math.PI)],
            OnGround: NBT.byte(1),
            FallFlying: NBT.byte(0),
            Health: NBT.float(Math.max(1, o.health ?? 20)),
            foodLevel: o.food ?? 20,
            foodSaturationLevel: NBT.float(o.sat ?? 5),
            XpLevel: c,
            XpP: NBT.float((i - l) / xpNeeded(c)),
            XpTotal: i,
            AbsorptionAmount: NBT.float(o.absorption || 0),
            SelectedItemSlot: 0 | o.sel,
            Inventory: itemList(r.slice(0, 36)),
            equipment: a,
            active_effects: (o.effects || []).map(([t, e, n, o]) => ({
              id: ns(t),
              amplifier: NBT.byte(0 | e),
              duration: 0 | n,
              ambient: NBT.byte(o ? 1 : 0),
              show_particles: NBT.byte(1),
              show_icon: NBT.byte(1),
            })),
          }
        );
      })(o);
      f && add("player.dat", await NBT.deflate(NBT.write(f), "gzip"));
      const m = {};
      for (const [t, e] of Object.entries(o.gameRules || {}))
        /^[a-z_]{1,48}$/.test(t) && ("boolean" == typeof e || Number.isInteger(e)) && (m[t] = e);
      const u = {
        name: o.name,
        seed: String(o.seed),
        time: Math.max(0, Math.floor(o.time || 0)) % 24e3,
        spawn: o.spawn
          ? [Math.floor(o.spawn[0]), Math.floor(o.spawn[1]) + n[0].minY, Math.floor(o.spawn[2])]
          : null,
        rules: m,
      };
      return (
        add("world.json", new TextEncoder().encode(JSON.stringify(u))),
        s && s(1, "转换完成"),
        { files: a, info: u, stats: r, bytes: c }
      );
    },
    packFiles: function packFiles(t) {
      const e = new TextEncoder(),
        n = [];
      let o = 8;
      for (const [s, r] of t) {
        const t = e.encode(s);
        (n.push([t, r]), (o += 6 + t.length + r.length));
      }
      const s = new Uint8Array(o),
        r = new DataView(s.buffer);
      (s.set(e.encode("OMCW")), r.setUint32(4, n.length));
      let a = 8;
      for (const [t, e] of n)
        (r.setUint16(a, t.length),
          s.set(t, a + 2),
          (a += 2 + t.length),
          r.setUint32(a, e.length),
          s.set(e, a + 4),
          (a += 4 + e.length));
      return s;
    },
    MAX_BYTES: e,
    stateFor: stateFor,
  };
})();
//# sourceURL=js/export.js
