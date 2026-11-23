"use strict";
!(function () {
  const t = self,
    e = "undefined" != typeof window && "undefined" != typeof document,
    o = /^[a-z][a-z0-9_]{1,31}$/,
    r = (t.PotatoMod = t.PotatoMod || {});
  ((r.version = 1), (r.mods = r.mods || {}), (r.errors = r.errors || []));
  const mod = (t) =>
      r.mods[t] ||
      (r.mods[t] = { id: t, blocks: [], items: [], handlers: {}, commands: [], keys: [] }),
    fail = (t, e, o) => {
      const n = String((o && o.message) || o),
        s = r.errors[r.errors.length - 1];
      if (s && s.mod === t && s.where === e && s.message === n)
        return (s.count++, void (s.at = Date.now()));
      (r.errors.push({
        mod: t,
        where: e,
        message: n,
        stack: o && o.stack ? String(o.stack) : "",
        at: Date.now(),
        count: 1,
      }),
        r.errors.length > 200 && r.errors.shift());
      try {
        console.error("[模组 " + t + "] " + e + "：" + n, o);
      } catch (t) {}
      fail.tell(t, e, n);
    };
  ((fail.told = new Set()),
    (fail.waiting = []),
    (fail.tell = (o, r, n) => {
      const s = t.game,
        a = o + "|" + r;
      e &&
        !fail.told.has(a) &&
        (s && s.ui && s.ui.message && s.world && "play" === s.state
          ? (fail.told.add(a),
            s.ui.message("[模组 " + o + "] " + r + " 出错：" + n.slice(0, 120), "#FF5555"))
          : fail.waiting.some((t) => t[0] === o && t[1] === r) || fail.waiting.push([o, r, n]));
    }),
    (r._fail = fail));
  const guard = (t, e, o, ...r) => {
    try {
      return o(...r);
    } catch (o) {
      return void fail(t, e, o);
    }
  };
  r._prelude = function (t, e) {
    const o = mod(t);
    ((o.ids = e.ids || { blocks: {}, items: {} }),
      (o.textures = e.textures || []),
      (o.version = e.version || ""),
      (o.name = e.name || t));
  };
  const n = ["west", "east", "down", "up", "north", "south"],
    s = {
      gui: { r: [30, 225, 0], t: [0, 0, 0], s: [0.625, 0.625, 0.625] },
      ground: { r: [0, 0, 0], t: [0, 3, 0], s: [0.25, 0.25, 0.25] },
      fixed: { r: [0, 0, 0], t: [0, 0, 0], s: [0.5, 0.5, 0.5] },
      firstperson_righthand: { r: [0, 45, 0], t: [0, 0, 0], s: [0.4, 0.4, 0.4] },
      firstperson_lefthand: { r: [0, 225, 0], t: [0, 0, 0], s: [0.4, 0.4, 0.4] },
      thirdperson_righthand: { r: [75, 45, 0], t: [0, 2.5, 0], s: [0.375, 0.375, 0.375] },
    },
    a = {
      ground: { r: [0, 0, 0], t: [0, 2, 0], s: [0.5, 0.5, 0.5] },
      fixed: { r: [0, 180, 0], t: [0, 0, 0], s: [1, 1, 1] },
      firstperson_righthand: { r: [0, -90, 25], t: [1.13, 3.2, 1.13], s: [0.68, 0.68, 0.68] },
      thirdperson_righthand: { r: [0, 0, 0], t: [0, 3, 1], s: [0.55, 0.55, 0.55] },
      head: { r: [0, 180, 0], t: [0, 13, 7], s: [1, 1, 1] },
    },
    i = Object.assign({}, a, {
      firstperson_righthand: { r: [0, -90, 25], t: [1.13, 3.2, 1.13], s: [0.68, 0.68, 0.68] },
      thirdperson_righthand: { r: [0, -90, 55], t: [0, 4, 0.5], s: [0.85, 0.85, 0.85] },
      firstperson_lefthand: { r: [0, 90, -25], t: [1.13, 3.2, 1.13], s: [0.68, 0.68, 0.68] },
      thirdperson_lefthand: { r: [0, 90, -55], t: [0, 4, 0.5], s: [0.85, 0.85, 0.85] },
    }),
    l = ["pickaxe", "axe", "shovel", "hoe", "sword"],
    c = { head: 0, chest: 1, legs: 2, feet: 3 },
    dataImpl = function (e, r) {
      if (!o.test(e))
        throw new Error(
          "模组 id 不合规：" + e + "（小写字母开头，2-32 个小写字母 / 数字 / 下划线）",
        );
      const c = mod(e);
      if (c.def) return;
      if (((c.def = r = r || {}), !c.ids))
        throw new Error("模组 " + e + " 没有经过安装（缺少编号）：运行 node tools/install_mod.js");
      const chk = (t, o) => {
          if (
            "string" != typeof t ||
            !/^[a-z0-9_]+$/.test(t) ||
            !((t) => t === e || t.startsWith(e + "_"))(t)
          )
            throw new Error(
              o + "「" + t + "」的名字要以「" + e + "_」开头，只用小写字母、数字、下划线",
            );
        },
        texKey = (t) => e + ":" + t;
      if (((c.tiles = {}), t.ASSETS)) {
        const o = t.ASSETS,
          r = Math.ceil(o.count / o.cols) * o.cols;
        (c.textures.forEach((t, e) => {
          ((o.tiles[texKey(t)] = r + e), (c.tiles[t] = r + e));
        }),
          (o.count = r + c.textures.length),
          c.textures.length &&
            (o.extra || (o.extra = [])).push({
              files: c.textures.map((t) => "mods/" + e + "/textures/" + t + ".png"),
              at: r,
            }));
      }
      const tex = (t, e) => {
          if (null != t) {
            if ("string" != typeof t) throw new Error(e + "：贴图名要是字符串");
            if (t.startsWith("minecraft:")) return t.slice(10);
            if (!c.textures.includes(t)) throw new Error(e + "：没有贴图 textures/" + t + ".png");
            return texKey(t);
          }
        },
        d = { models: [], blocks: {}, items: {} },
        addModel = (t) => (d.models.push(t), d.models.length - 1),
        variant = (t) => ({ variants: [[{}, [{ m: t, x: 0, y: 0, uvlock: !1, w: 1 }]]] }),
        face = (t, e, o) => ({
          uv: e || [0, 0, 16, 16],
          tex: t,
          cull: o || null,
          tint: -1,
          rot: 0,
        }),
        u = r.blocks || {};
      for (const o in u) {
        const r = u[o],
          i = "方块 " + o;
        chk(o, "方块");
        const h = c.ids.blocks[o];
        if (void 0 === h)
          throw new Error(i + " 没有编号：改了方块以后要重新运行安装（node tools/install_mod.js）");
        const p = r.shape || "cube",
          f = {
            key: o,
            id: h,
            cn: String(r.name || o),
            hardness: r.hardness ?? 1.5,
            sound: "string" == typeof r.sound && /^[a-z_]+$/.test(r.sound) ? r.sound : "stone",
          };
        if (r.tool) {
          if (!l.includes(r.tool)) throw new Error(i + "：tool 只能是 " + l.join(" / "));
          f.tool = r.tool;
        }
        (r.level && (f.level = 0 | r.level),
          (r.needsTool ?? !!r.tool) && (f.needsTool = !0),
          r.light && (f.light = Math.max(0, Math.min(15, 0 | r.light))),
          r.slipperiness && (f.slip = +r.slipperiness),
          r.climbable && (f.climbable = !0),
          r.fuel && (f.fuel = 0 | r.fuel),
          r.xp && (f.xp = Array.isArray(r.xp) ? r.xp : [r.xp, r.xp]),
          r.replaceable && (f.replaceable = !0),
          "none" === r.drops || null === r.drops
            ? (f.drop = "none")
            : "string" == typeof r.drops
              ? (f.drop = r.drops)
              : r.drops &&
                r.drops.item &&
                ((f.ore = r.drops.item),
                (f.oreCount = [r.drops.min ?? 1, r.drops.max ?? r.drops.min ?? 1])));
        const m = r.textures || {},
          y = tex(r.texture || m.all, i),
          k = n.map((t) =>
            tex(
              m[t] || ("up" === t ? m.top : "down" === t ? m.bottom : m.side) || r.texture || m.all,
              i + " 的 " + t + " 面",
            ),
          );
        if ("cube" === p) {
          if (k.some((t) => !t))
            throw new Error(
              i + "：方块要有 texture，或者 textures 里的 all / top / bottom / side / 各个面",
            );
          ((f.kind = "cube"),
            (f.tex = k),
            (f.particle = y || k[0]),
            "cutout" === r.transparent ? (f.cutout = !0) : r.transparent && (f.translucent = !0));
          const t = addModel({
            name: e + ":block/" + o,
            ao: !0,
            gen: !1,
            light: "side",
            display: s,
            elements: [
              {
                from: [0, 0, 0],
                to: [16, 16, 16],
                shade: !0,
                faces: Object.fromEntries(n.map((t, e) => [t, face(k[e], null, t)])),
              },
            ],
          });
          ((d.blocks[o] = variant(t)), (d.items[o] = { m: t }));
        } else if ("cross" === p) {
          if (!y) throw new Error(i + "：cross 形状要有 texture");
          ((f.kind = "model"),
            (f.states = [{}]),
            (f.particle = y),
            (f.nonsolid = !0),
            !1 !== r.plant && (f.plant = !0));
          const pl = (t, e, o) => ({
              from: t,
              to: e,
              shade: !1,
              rot: { origin: [8, 8, 8], axis: "y", angle: 45, rescale: !0 },
              faces: Object.fromEntries(o.map((t) => [t, face(y)])),
            }),
            t = addModel({
              name: e + ":block/" + o,
              ao: !1,
              gen: !1,
              light: "side",
              display: {},
              elements: [
                pl([0.8, 0, 8], [15.2, 16, 8], ["north", "south"]),
                pl([8, 0, 0.8], [8, 16, 15.2], ["west", "east"]),
              ],
            });
          ((d.blocks[o] = variant(t)),
            (d.items[o] = {
              m: addModel({
                name: e + ":item/" + o,
                ao: !0,
                gen: !0,
                light: "front",
                display: a,
                layers: [y],
              }),
            }));
        } else {
          if ("model" !== p) throw new Error(i + "：shape 只能是 cube / cross / model");
          {
            const t = (r.model && r.model.elements) || [];
            if (!t.length) throw new Error(i + "：model 形状要有 model.elements");
            const a = t.map((t, e) => {
              const o = {};
              for (const r in t.faces || {}) {
                const s = t.faces[r],
                  a = "bottom" === r ? "down" : "top" === r ? "up" : r;
                if (!n.includes(a))
                  throw new Error(i + " 第 " + (e + 1) + " 个元件：面名 " + r + " 不对");
                if (
                  ((o[a] = {
                    uv: s.uv || null,
                    tex: tex(s.texture || y, i + " 第 " + (e + 1) + " 个元件的 " + r + " 面"),
                    cull: s.cullface || null,
                    tint: -1,
                    rot: s.rotation || 0,
                  }),
                  !o[a].uv)
                ) {
                  const [e, r, n] = t.from,
                    [s, i, l] = t.to;
                  o[a].uv =
                    "up" === a || "down" === a
                      ? [e, n, s, l]
                      : "north" === a || "south" === a
                        ? [e, 16 - i, s, 16 - r]
                        : [n, 16 - i, l, 16 - r];
                }
              }
              const r = t.rotation
                ? {
                    origin: t.rotation.origin || [8, 8, 8],
                    axis: t.rotation.axis || "y",
                    angle: t.rotation.angle || 0,
                    rescale: !!t.rescale || !!t.rotation.rescale,
                  }
                : void 0;
              return Object.assign(
                { from: t.from, to: t.to, shade: !1 !== t.shade, faces: o },
                r ? { rot: r } : {},
              );
            });
            ((f.kind = "model"),
              (f.states = [{}]),
              (f.particle = y || a[0].faces[Object.keys(a[0].faces)[0]].tex),
              !1 === r.solid && (f.nonsolid = !0),
              !0 === r.transparent && (f.translucent = !0));
            const l = addModel({
              name: e + ":block/" + o,
              ao: !1 !== r.ambientOcclusion,
              gen: !1,
              light: "side",
              display: s,
              elements: a,
            });
            ((d.blocks[o] = variant(l)), (d.items[o] = { m: l }));
          }
        }
        (t.BLOCK_DATA && t.BLOCK_DATA.push(f),
          c.blocks.push(o),
          !r.noItem && t.ITEM_DATA && t.ITEM_DATA.push({ key: o, stack: r.stack || 64, tab: e }),
          (c.blockOpts = c.blockOpts || {}),
          (c.blockOpts[o] = r));
      }
      const h = r.items || {};
      for (const o in h) {
        const r = h[o],
          n = "物品 " + o;
        if ((chk(o, "物品"), u[o])) throw new Error(n + "：和方块同名（方块已经自带物品）");
        const s = c.ids.items[o];
        if (void 0 === s)
          throw new Error(n + " 没有编号：改了物品以后要重新运行安装（node tools/install_mod.js）");
        const l = tex(r.texture, n);
        if (!l) throw new Error(n + "：要有 texture");
        const p = {
          key: o,
          id: s,
          cn: String(r.name || o),
          stack: r.durability || r.tool || r.armor ? 1 : Math.max(1, Math.min(64, r.stack || 64)),
          tab: e,
          tex: l,
        };
        (r.durability && (p.dur = 0 | r.durability),
          r.places && (p.places = r.places),
          r.glint && (p.glint = !0),
          r.rarity && (p.rar = r.rarity),
          r.food &&
            (p.food = Array.isArray(r.food)
              ? r.food
              : [r.food.hunger || 1, r.food.saturation || 0]),
          r.attack && ((p.atk = +r.attack), (p.aspd = +(r.attackSpeed || 1.6))),
          t.ITEM_DATA && t.ITEM_DATA.push(p),
          c.items.push(o),
          (d.items[o] = {
            m: addModel({
              name: e + ":item/" + o,
              ao: !0,
              gen: !0,
              light: "front",
              display: r.tool ? i : a,
              layers: [l],
            }),
          }),
          (c.itemOpts = c.itemOpts || {}),
          (c.itemOpts[o] = r));
      }
      if (
        ((t.MOD_VMODELS || (t.MOD_VMODELS = [])).push(d),
        t.Mods &&
          t.Mods.register &&
          t.Mods.register(e, {
            name: c.name,
            blocks: c.blocks.length,
            items: c.items.length,
            tiles: c.textures.length,
          }),
        t.RECIPE_DATA)
      ) {
        const e = t.RECIPE_DATA,
          ing = (t) =>
            "string" == typeof t ? t.replace(/^minecraft:/, "") : Array.isArray(t) ? t.map(ing) : t;
        for (const [t, o] of (r.recipes || []).entries()) {
          const r = "第 " + (t + 1) + " 个配方",
            n = o.result && String(o.result).replace(/^minecraft:/, "");
          if (!n) throw new Error(r + "：要有 result");
          switch (o.type) {
            case "shaped": {
              if (
                !Array.isArray(o.pattern) ||
                !o.pattern.length ||
                o.pattern.length > 3 ||
                o.pattern.some(
                  (t) => "string" != typeof t || t.length > 3 || t.length !== o.pattern[0].length,
                )
              )
                throw new Error(r + "：pattern 是 1-3 行、每行一样长（1-3 个字符）");
              const t = {};
              for (const e in o.key || {}) t[e] = ing(o.key[e]);
              e.crafting.push(["s", n, o.count || 1, o.pattern, t]);
              break;
            }
            case "shapeless": {
              const t = (o.ingredients || []).map(ing);
              if (!t.length || t.length > 9) throw new Error(r + "：ingredients 要有 1-9 个");
              e.crafting.push(["l", n, o.count || 1, t]);
              break;
            }
            case "smelting":
            case "blasting":
            case "smoking":
            case "campfire_cooking":
              e.cooking.push([
                o.type,
                ing(o.input),
                n,
                o.xp ?? 0.1,
                o.time ?? ("smelting" === o.type ? 200 : "campfire_cooking" === o.type ? 600 : 100),
              ]);
              break;
            case "stonecutting":
              e.stonecutting.push([ing(o.input), n, o.count || 1]);
              break;
            default:
              throw new Error(
                r +
                  "：type 只能是 shaped / shapeless / smelting / blasting / smoking / campfire_cooking / stonecutting",
              );
          }
        }
        for (const t in r.tags || {}) {
          const o = t.replace(/^minecraft:/, "");
          e.tags[o] = [...new Set([...(e.tags[o] || []), ...r.tags[t]])];
        }
      }
      if (t.WG_DATA && r.ores && r.ores.length && !t.WG_DATA["mod:" + e]) {
        const o = t.WG_DATA;
        o["mod:" + e] = !0;
        const n = [
            "nether_wastes",
            "soul_sand_valley",
            "crimson_forest",
            "warped_forest",
            "basalt_deltas",
          ],
          s = ["the_end", "end_highlands", "end_midlands", "small_end_islands", "end_barrens"],
          a = Object.keys(o.biome);
        r.ores.forEach((t, r) => {
          const i = "第 " + (r + 1) + " 种矿",
            l = t.dimension || "overworld";
          if (!t.block || !u[t.block]) throw new Error(i + "：block 要是这个模组自己的方块");
          const c =
              "nether" === l
                ? [
                    {
                      state: { Name: t.block },
                      target: {
                        predicate_type: "minecraft:tag_match",
                        tag: "minecraft:base_stone_nether",
                      },
                    },
                  ]
                : "end" === l
                  ? [
                      {
                        state: { Name: t.block },
                        target: {
                          predicate_type: "minecraft:block_match",
                          block: "minecraft:end_stone",
                        },
                      },
                    ]
                  : [
                      {
                        state: { Name: t.block },
                        target: {
                          predicate_type: "minecraft:tag_match",
                          tag: "minecraft:stone_ore_replaceables",
                        },
                      },
                      ...(t.deepslateBlock
                        ? [
                            {
                              state: { Name: t.deepslateBlock },
                              target: {
                                predicate_type: "minecraft:tag_match",
                                tag: "minecraft:deepslate_ore_replaceables",
                              },
                            },
                          ]
                        : []),
                    ],
            d = e + ":ore_" + r;
          ((o.configured_feature[d] = {
            type: "minecraft:ore",
            config: {
              discard_chance_on_air_exposure: t.airExposure ?? 0,
              size: Math.max(1, Math.min(64, t.size || 8)),
              targets: c,
            },
          }),
            (o.placed_feature[d] = {
              feature: d,
              placement: [
                { type: "minecraft:count", count: Math.max(1, Math.min(64, t.perChunk || 8)) },
                { type: "minecraft:in_square" },
                {
                  type: "minecraft:height_range",
                  height: {
                    type:
                      "triangle" === t.distribution ? "minecraft:trapezoid" : "minecraft:uniform",
                    min_inclusive: { absolute: t.minY ?? -64 },
                    max_inclusive: { absolute: t.maxY ?? 64 },
                  },
                },
                { type: "minecraft:biome" },
              ],
            }));
          const h = t.biomes
            ? t.biomes.map((t) => t.replace(/^minecraft:/, ""))
            : "nether" === l
              ? n
              : "end" === l
                ? s
                : a.filter((t) => !n.includes(t) && !s.includes(t) && "the_void" !== t);
          for (const t of h) {
            const e = o.biome[t] && o.biome[t].features;
            if (e) {
              for (; e.length <= 6;) e.push([]);
              e[6].includes(d) || e[6].push(d);
            }
          }
        });
      }
    };
  ((r.data = function (t, e) {
    try {
      dataImpl(t, e);
    } catch (e) {
      fail(t, "数据（data.js）", e);
    }
  }),
    (r._finish = function () {
      if (!r._finished) {
        r._finished = !0;
        for (const t in r.mods) {
          const e = r.mods[t];
          e.def &&
            guard(t, "加载", () => {
              for (const t of e.blocks) {
                const o = e.blockOpts[t],
                  r = BLOCKS[BID[t]];
                r && o.gravity && (r.gravity = !0);
              }
              for (const t of e.items) {
                const o = e.itemOpts[t],
                  r = ITEMS[ITEM_KEY[t]];
                if (r) {
                  if (o.tool) {
                    const e = o.tool.type || o.tool;
                    if (!l.includes(e))
                      throw new Error("物品 " + t + "：tool.type 只能是 " + l.join(" / "));
                    ((r.tool = { type: e, level: o.tool.level ?? 2, speed: o.tool.speed ?? 6 }),
                      "sword" === e && (r.tool.speed = 1.5));
                  }
                  if (
                    (o.attack &&
                      ((r.attack = +o.attack), (r.attackSpeed = +(o.attackSpeed || 1.6))),
                    o.durability && (r.durability = 0 | o.durability),
                    o.food &&
                      (r.food = Array.isArray(o.food)
                        ? o.food
                        : [o.food.hunger || 1, o.food.saturation || 0]),
                    o.alwaysEdible && "undefined" != typeof ALWAYS_EDIBLE && ALWAYS_EDIBLE.add(t),
                    o.fuel && (r.fuel = 0 | o.fuel),
                    o.armor)
                  ) {
                    const e = c[o.armor.slot];
                    if (void 0 === e)
                      throw new Error(
                        "物品 " + t + "：armor.slot 只能是 head / chest / legs / feet",
                      );
                    r.armor = {
                      slot: e,
                      points: o.armor.points || 0,
                      tough: o.armor.toughness || 0,
                      mat: "iron",
                    };
                  }
                  (o.enchantability && (r.enchantability = o.enchantability),
                    o.repairWith && (r.repair = o.repairWith));
                }
              }
              const o = e.def.tab || {},
                r = [...e.blocks, ...e.items];
              r.length &&
                "undefined" != typeof CREATIVE_TABS &&
                !CREATIVE_TABS.some((e) => e.id === t) &&
                CREATIVE_TABS.push({
                  id: t,
                  name: o.name || e.name || t,
                  icon: o.icon && void 0 !== ITEM_KEY[o.icon] ? o.icon : r[0],
                  get items() {
                    return creativeTabItems(t);
                  },
                });
            });
        }
        r._hook();
      }
    }));
  const oy = (t) => (t && t.world && t.world.minY) || 0,
    live = () => {
      const e = t.game;
      return e && e.world && "play" === e.state && !e.net && !e.p2pGuest ? e : null;
    },
    keyAt = (t, e, o, r) => {
      const n = t.world.getBlock(e, o, r);
      return n ? (BLOCKS[n] ? BLOCKS[n].key : "unknown") : "air";
    },
    stackInfo = (t) =>
      t && ITEMS[t.id] ? { item: ITEMS[t.id].key, count: t.count, damage: t.dmg || 0 } : null,
    itemId = (t) => {
      const e = ITEM_KEY[String(t).replace(/^minecraft:/, "")];
      if (void 0 === e) throw new Error("没有这个物品：" + t);
      return e;
    },
    d = {},
    emit = (t, e) => {
      const o = d[t];
      if (!o) return e;
      for (const [r, n] of o) if ((guard(r, t + " 事件", n, e), e.cancelled)) break;
      return e;
    },
    make = (t) => (
      (t.cancelled = !1),
      (t.cancel = () => {
        t.cancelled = !0;
      }),
      t
    );
  ((r._hook = function () {
    if (!e || r._hooked) return;
    r._hooked = !0;
    const t = Game.prototype,
      o = t.tick;
    t.tick = function () {
      const t = o.apply(this, arguments);
      if (!(live() !== this || (this.ui.screen && this.ui.screen.pauses))) {
        emit("tick", { tick: this.tickCount });
        for (const t of r._timers) this.tickCount % t.every === 0 && guard(t.mod, "定时器", t.fn);
        for (const t of r._keys) {
          const e = "function" == typeof bindDown && !this.ui.screen && bindDown(this, t.bind);
          (e && !t.was && guard(t.mod, "按键 " + t.name, t.down),
            !e && t.was && t.up && guard(t.mod, "按键 " + t.name, t.up),
            (t.was = e));
        }
      }
      return t;
    };
    const s = t.breakBlock;
    t.breakBlock = function (t, e, o, r, n) {
      if (r || live() !== this || (!d.blockBreak && !d.blockBroken))
        return s.apply(this, arguments);
      if (!this.world.getBlock(t, e, o)) return s.apply(this, arguments);
      const a = emit(
        "blockBreak",
        make({
          x: t,
          y: e + oy(this),
          z: o,
          block: keyAt(this, t, e, o),
          held: stackInfo(this.player.inv.held),
        }),
      );
      if (a.cancelled) return;
      const i = s.apply(this, arguments);
      return (
        this.world.getBlock(t, e, o) ||
          emit("blockBroken", { x: t, y: e + oy(this), z: o, block: a.block }),
        i
      );
    };
    const a = t.placeAt;
    t.placeAt = function (t, e, o, r) {
      const n = a.apply(this, arguments);
      return (
        live() === this &&
          d.blockPlace &&
          emit("blockPlace", {
            x: t,
            y: e + oy(this),
            z: o,
            block: BLOCKS[r] ? BLOCKS[r].key : "unknown",
          }),
        n
      );
    };
    const i = t.use;
    t.use = function () {
      if (live() !== this) return i.apply(this, arguments);
      const t = this.player,
        e = this.target,
        o = t.inv.held,
        s = o && ITEMS[o.id] ? ITEMS[o.id].key : null,
        swing = () => {
          (t.swing(), (this.useCd = 4));
        };
      if (e && !t.sneaking && !this.targetEntity) {
        const t = BLOCKS[e.id] && BLOCKS[e.id].key,
          s = r._useBlock[t];
        if (s) {
          const r = make({
            x: e.pos[0],
            y: e.pos[1] + oy(this),
            z: e.pos[2],
            face: n[e.face],
            block: t,
            held: stackInfo(o),
          });
          if ((guard(s.mod, "使用方块 " + t, s.fn, r), !r.cancelled)) return void swing();
        }
      }
      if (s && r._useItem[s]) {
        const t = r._useItem[s],
          a = make({
            item: s,
            held: stackInfo(o),
            target:
              e && !this.targetEntity
                ? {
                    x: e.pos[0],
                    y: e.pos[1] + oy(this),
                    z: e.pos[2],
                    face: n[e.face],
                    block: BLOCKS[e.id] && BLOCKS[e.id].key,
                  }
                : null,
            entity: this.targetEntity ? entInfo(this.targetEntity) : null,
          });
        if ((guard(t.mod, "使用物品 " + s, t.fn, a), !a.cancelled)) return void swing();
      }
      if (d.use) {
        const t = emit(
          "use",
          make({
            held: stackInfo(o),
            target:
              e && !this.targetEntity
                ? {
                    x: e.pos[0],
                    y: e.pos[1] + oy(this),
                    z: e.pos[2],
                    face: n[e.face],
                    block: BLOCKS[e.id] && BLOCKS[e.id].key,
                  }
                : null,
            entity: this.targetEntity ? entInfo(this.targetEntity) : null,
          }),
        );
        if (t.handled || t.cancelled) return void swing();
      }
      return i.apply(this, arguments);
    };
    const l = t.attack;
    if (
      ((t.attack = function (t) {
        if (live() !== this || !d.attack) return l.apply(this, arguments);
        return emit("attack", make({ entity: entInfo(t), held: stackInfo(this.player.inv.held) }))
          .cancelled
          ? void 0
          : l.apply(this, arguments);
      }),
      "undefined" != typeof Mob)
    ) {
      const t = Mob.prototype.die,
        e = (Mob.modDeath = function (t, e) {
          const o = t.game;
          d.entityDeath &&
            live() === o &&
            !t._modDead &&
            ((t._modDead = !0),
            emit("entityDeath", {
              entity: entInfo(t),
              byPlayer: !(!e || (e.attacker !== o.player && !e.player)),
            }));
        });
      Mob.prototype.die = function (o) {
        const r = t.apply(this, arguments);
        return (e(this, o), r);
      };
    }
    const c = t.onPlayerDeath;
    c &&
      (t.onPlayerDeath = function () {
        return (live() === this && emit("playerDeath", {}), c.apply(this, arguments));
      });
    const u = t.loadWorld;
    if (
      ((t.loadWorld = async function () {
        const t = await u.apply(this, arguments),
          e = this,
          wait = () => {
            if (live() === e) {
              for (const t of fail.waiting.splice(0)) fail.tell(...t);
              emit("worldLoad", {
                name: e.worldMeta && e.worldMeta.name,
                seed: e.worldMeta && e.worldMeta.seed,
              });
            } else "title" !== e.state && setTimeout(wait, 200);
          };
        return (setTimeout(wait, 0), t);
      }),
      "undefined" != typeof UI && UI.prototype.drawHUD)
    ) {
      const t = UI.prototype.drawHUD;
      UI.prototype.drawHUD = function () {
        const e = t.apply(this, arguments),
          o = this.game;
        if (d.hud && live() === o && !this.hideHud)
          for (const [t, e] of d.hud)
            (this.ctx.save(),
              guard(t, "hud 绘制", e, {
                ctx: this.ctx,
                width: this.w,
                height: this.h,
                text: (t, e, o, r) => Font.draw(this.ctx, String(t), e, o, r || "#FFFFFF"),
                textWidth: (t) => Font.width(String(t)),
                centerText: (t, e, o, r) => Font.center(this.ctx, String(t), e, o, r || "#FFFFFF"),
              }),
              this.ctx.restore());
        return e;
      };
    }
  }),
    (r._timers = []),
    (r._keys = []),
    (r._useBlock = {}),
    (r._useItem = {}));
  const entInfo = (e) =>
    e
      ? {
          type:
            e.type ||
            (e === (t.game && t.game.player) ? "player" : e.constructor && e.constructor.name),
          x: e.pos[0],
          y: e.pos[1] + oy(t.game),
          z: e.pos[2],
          health: e.health,
          _e: e,
        }
      : null;
  function makeApi(e) {
    const o = mod(e),
      g = () => t.game,
      need = () => {
        const t = live();
        if (!t) throw new Error("现在不在单人世界里");
        return t;
      },
      s = {
        id: e,
        on(t, o) {
          const r = [
            "tick",
            "blockBreak",
            "blockBroken",
            "blockPlace",
            "use",
            "attack",
            "entityDeath",
            "playerDeath",
            "worldLoad",
            "hud",
          ];
          if (!r.includes(t))
            throw new Error("没有这个事件：" + t + "（可以用：" + r.join(", ") + "）");
          return ((d[t] || (d[t] = [])).push([e, o]), s);
        },
        every: (t, o) => (r._timers.push({ mod: e, every: Math.max(1, 0 | t), fn: o }), s),
        onUseBlock(t, o) {
          if (void 0 === BID[t]) throw new Error("没有这个方块：" + t);
          return ((r._useBlock[t] = { mod: e, fn: o }), s);
        },
        onUseItem(t, o) {
          if (void 0 === ITEM_KEY[t]) throw new Error("没有这个物品：" + t);
          return ((r._useItem[t] = { mod: e, fn: o }), s);
        },
        command(r, n, a) {
          if (("function" == typeof n && ((a = n), (n = {})), !/^[a-z][a-z0-9_]*$/.test(r)))
            throw new Error("命令名只用小写字母、数字、下划线：" + r);
          if ("undefined" == typeof CMD_RUN) return s;
          if (CMD_RUN[r]) throw new Error("命令 /" + r + " 已经有了");
          return (
            (CMD_RUN[r] = function (t, o) {
              const n = guard(e, "命令 /" + r, a, o, {
                say: (t, e) => this.ui.message(String(t), e || "#FFFFFF"),
                x: t.pos[0],
                y: t.pos[1] + oy(this),
                z: t.pos[2],
              });
              "string" == typeof n && this.ui.message(n, "#FFFFFF");
            }),
            "undefined" != typeof CMDS_LOCAL &&
              CMDS_LOCAL.push([
                r,
                n.usage || "/" + r,
                n.description || "[" + (o.name || e) + "]",
                n.suggest || [],
              ]),
            n.cheats || (t.CMD_FREE || (t.CMD_FREE = new Set())).add(r),
            s
          );
        },
        key(t, n, a, i, l) {
          if (!/^[a-z][a-z0-9_]*$/.test(t))
            throw new Error("按键名只用小写字母、数字、下划线：" + t);
          const c = e + "." + t;
          if ("undefined" != typeof KEYBIND_CATS && !KEY_DEFAULT[c]) {
            let t = KEYBIND_CATS.find((t) => t[0] === (o.name || e));
            (t || KEYBIND_CATS.push((t = [o.name || e, []])),
              t[1].push([c, n, a || ""]),
              (KEY_DEFAULT[c] = a || ""),
              (KEY_CN[c] = n));
          }
          return (
            r._keys.push({ mod: e, name: t, bind: c, down: i || (() => {}), up: l, was: !1 }),
            s
          );
        },
        message(t, e) {
          const o = g();
          o && o.ui && o.ui.message(String(t), e || "#FFFFFF");
        },
        toast(t, e, o) {
          const r = g();
          r &&
            r.ui &&
            r.ui.toast(
              String(t),
              String(e || ""),
              o && void 0 !== ITEM_KEY[o] ? ITEM_KEY[o] : void 0,
            );
        },
        menu(t) {
          const o = need();
          class ModMenu extends MenuScreen {
            constructor() {
              (super(o, String(t.title || "")), (this.titleY = 30));
            }
            layout() {
              const r = o.ui,
                n = r.w / 2,
                a = t.buttons || [],
                i = Math.max(60, Math.floor(r.h / 2 - 10));
              ((this.widgets = a.map((o, r) => ({
                x: n - 100,
                y: i + 24 * r + 0 * (t.lines || []).length,
                w: 200,
                h: 20,
                label: String(o.label),
                onClick: () => guard(e, "菜单按钮", o.onClick || (() => s.closeMenu())),
              }))),
                (this.top = i));
            }
            drawExtra(e) {
              (t.lines || []).forEach((t, o) =>
                Font.center(e.ctx, String(t), e.w / 2, 50 + 11 * o, "#FFFFFF"),
              );
            }
            onEsc() {
              o.ui.close();
            }
          }
          return (o.ui.open(new ModMenu()), () => s.closeMenu());
        },
        closeMenu() {
          const t = g();
          t && t.ui.screen && t.ui.close();
        },
        run(t) {
          const r = need();
          let n = !0,
            s = [];
          const a = {
            pos: [...r.player.pos],
            rot: [r.player.yaw, r.player.pitch],
            entity: r.player,
            name: o.name || e,
            say: (t) => s.push(String(t)),
            fail: (t) => {
              ((n = !1), s.push(String(t)));
            },
          };
          return ((n = !1 !== cmdExec(r, String(t), a) && n), { ok: n, output: s });
        },
        assetUrl: (t) => "mods/" + e + "/assets/" + String(t).replace(/^\/+/, ""),
        playSound(t, e, o) {
          try {
            const r = new Audio(s.assetUrl(t));
            ((r.volume = Math.max(
              0,
              Math.min(
                1,
                (e ?? 1) * ("undefined" != typeof Sound && null != Sound.volume ? Sound.volume : 1),
              ),
            )),
              o && ((r.preservesPitch = !1), (r.playbackRate = Math.max(0.5, Math.min(2, o)))),
              r.play().catch(() => {}));
          } catch (t) {}
        },
        image(t) {
          const e = o.images || (o.images = {});
          if (!e[t]) {
            const o = new Image();
            ((o.src = s.assetUrl(t)), (e[t] = o));
          }
          return e[t].complete && e[t].naturalWidth ? e[t] : null;
        },
        world: {
          getBlock(t, e, o) {
            const r = need();
            return keyAt(r, Math.floor(t), Math.floor(e) - oy(r), Math.floor(o));
          },
          getState(t, e, o) {
            const r = need();
            return r.world.getMeta(Math.floor(t), Math.floor(e) - oy(r), Math.floor(o));
          },
          setBlock(t, e, o, r, n) {
            const s = need();
            ((t = Math.floor(t)),
              (e = Math.floor(e) - oy(s)),
              (o = Math.floor(o)),
              s.world.setBlock(
                t,
                e,
                o,
                "air" === r
                  ? 0
                  : ((t) => {
                      const e = BID[String(t).replace(/^minecraft:/, "")];
                      if (void 0 === e) throw new Error("没有这个方块：" + t);
                      return e;
                    })(r),
                0 | n,
              ),
              s.flushMesh && s.flushMesh());
          },
          isLoaded: (t, e) => need().world.isLoaded(Math.floor(t), Math.floor(e)),
          surfaceY(t, e) {
            const o = need();
            return o.world.surfaceY(Math.floor(t), Math.floor(e)) + oy(o);
          },
          get time() {
            return need().worldTime;
          },
          set time(t) {
            need().worldTime = +t;
          },
          get dimension() {
            return need().dim;
          },
          dropItem(t, e, o, r, n) {
            const s = need();
            s.dropItem(t, e - oy(s), o, makeStack(itemId(r), n || 1));
          },
          explode(t, e, o, r) {
            const n = need();
            n.explode(t, e - oy(n), o, Math.max(0.5, Math.min(10, +r || 3)));
          },
          lightning(t, e, o) {
            const r = need();
            r.strikeLightning(t, e - oy(r), o);
          },
          entities(t, e, o, r) {
            const n = need(),
              s = (r || 16) ** 2;
            return (
              (e -= oy(n)),
              n.entities
                .filter(
                  (r) =>
                    r &&
                    r.pos &&
                    (r.pos[0] - t) ** 2 + (r.pos[1] - e) ** 2 + (r.pos[2] - o) ** 2 <= s,
                )
                .map(entInfo)
            );
          },
          damage(t, e) {
            const o = need(),
              r = t && t._e;
            r && r.hurt && r.hurt(+e || 1, { type: "mod", attacker: o.player });
          },
          particle: (t, e, o, r, n) =>
            s.run(`particle ${t} ${e} ${o} ${r} 0.3 0.3 0.3 0.05 ${n || 8}`),
          sound(e, o, r, n, s, a) {
            "undefined" != typeof Sound &&
              Sound.ev(String(e), [o, r - oy(t.game), n], s ?? 1, a ?? 1);
          },
        },
        player: {
          get x() {
            return need().player.pos[0];
          },
          get y() {
            const t = need();
            return t.player.pos[1] + oy(t);
          },
          get z() {
            return need().player.pos[2];
          },
          get yaw() {
            return need().player.yaw;
          },
          get pitch() {
            return need().player.pitch;
          },
          get health() {
            return need().player.health;
          },
          set health(t) {
            const e = need().player;
            e.health = Math.max(0, Math.min(e.maxHealth, +t));
          },
          get maxHealth() {
            return need().player.maxHealth;
          },
          get food() {
            return need().player.food;
          },
          set food(t) {
            need().player.food = Math.max(0, Math.min(20, 0 | t));
          },
          get mode() {
            return need().mode;
          },
          get sneaking() {
            return !!need().player.sneaking;
          },
          get onGround() {
            return !!need().player.onGround;
          },
          get held() {
            return stackInfo(need().player.inv.held);
          },
          get target() {
            const t = need(),
              e = t.target;
            return e && !t.targetEntity
              ? {
                  x: e.pos[0],
                  y: e.pos[1] + oy(t),
                  z: e.pos[2],
                  face: n[e.face],
                  block: BLOCKS[e.id] && BLOCKS[e.id].key,
                }
              : null;
          },
          teleport(t, e, o) {
            const r = need(),
              n = r.player;
            ((n.pos[0] = t),
              (n.pos[1] = e - oy(r)),
              (n.pos[2] = o),
              (n.vel[0] = n.vel[1] = n.vel[2] = 0),
              n.savePrev && n.savePrev());
          },
          setVelocity(t, e, o) {
            const r = need().player;
            ((r.vel[0] = t), (r.vel[1] = e), (r.vel[2] = o));
          },
          give(t, e) {
            const o = need(),
              r = makeStack(itemId(t), e || 1),
              n = o.player.inv.add(r);
            n && o.dropFromPlayer && o.dropFromPlayer({ ...r, count: n });
          },
          take(t, e) {
            const o = need().player,
              r = itemId(t);
            let n = e || 1;
            if (o.inv.slots.reduce((t, e) => t + (e && e.id === r ? e.count : 0), 0) < n) return !1;
            for (let t = 0; t < o.inv.slots.length && n > 0; t++) {
              const e = o.inv.slots[t];
              if (e && e.id === r) {
                const r = Math.min(n, e.count);
                ((e.count -= r), (n -= r), e.count || (o.inv.slots[t] = null));
              }
            }
            return !0;
          },
          count(t) {
            const e = need().player,
              o = itemId(t);
            return e.inv.slots.reduce((t, e) => t + (e && e.id === o ? e.count : 0), 0);
          },
          damageHeld(t) {
            const e = need();
            e.damageHeld && e.damageHeld(t || 1);
          },
          consumeHeld(t) {
            const e = need(),
              o = e.player,
              r = o.inv.held;
            r &&
              "creative" !== e.mode &&
              ((r.count -= t || 1), r.count <= 0 && (o.inv.slots[o.inv.sel] = null));
          },
          addEffect(t, e, o) {
            need().player.addEffect(
              String(t),
              Math.max(0, (o || 1) - 1),
              Math.round(20 * (e || 10)),
            );
          },
          addXp(t) {
            need().addXp(0 | t);
          },
        },
        get store() {
          const t = need().worldMeta,
            o = t.modData || (t.modData = {});
          return o[e] || (o[e] = {});
        },
        get raw() {
          return { game: g(), BLOCKS: BLOCKS, ITEMS: ITEMS, BID: BID, ITEM_KEY: ITEM_KEY };
        },
      };
    return s;
  }
  r.code = function (t, o) {
    if (!e) return;
    const n = mod(t);
    n.code || ((n.code = !0), r._finished || r._finish(), guard(t, "启动", o, makeApi(t)));
  };
})();
//# sourceURL=js/modapi.js
