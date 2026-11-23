"use strict";
const RS_DIRS = {
    down: [0, -1, 0],
    up: [0, 1, 0],
    north: [0, 0, -1],
    south: [0, 0, 1],
    west: [-1, 0, 0],
    east: [1, 0, 0],
  },
  RS_DN = ["down", "up", "north", "south", "west", "east"],
  RS_H = ["north", "south", "west", "east"],
  RS_OPP = { down: "up", up: "down", north: "south", south: "north", west: "east", east: "west" },
  RS_CW = { north: "east", east: "south", south: "west", west: "north" },
  FACE_NAME = ["west", "east", "down", "up", "north", "south"],
  rsKey = (e, t, o) => e + "," + t + "," + o,
  prop = (e, t, o) => Features.propOf(e, t, o),
  rsk = (e) => (BLOCKS[e] ? BLOCKS[e].key : ""),
  isWire = (e) => !!BLOCKS[e] && void 0 !== BLOCKS[e].wirePower,
  wireP = (e) => (BLOCKS[e] && BLOCKS[e].wirePower) || 0,
  RS_PLATE = /pressure_plate$/,
  RS_BUTTON = /_button$/,
  RS = {
    wires: !0,
    mem: new Map(),
    queue: [],
    qi: 0,
    queued: new Set(),
    busy: !1,
    torchHist: new Map(),
    events: [],
    evSet: new Set(),
    pistonT: new Map(),
    meshDirty: !1,
  },
  RS_FULL = new Uint8Array(MAX_BLOCKS);
function rsFull(e) {
  if (!e) return !1;
  let t = RS_FULL[e];
  if (!t) {
    const o = BLOCKS[e];
    let r = !!SOLIDCUBE[e];
    if (!r && o && o.solid && !o.slab && !o.stairs && !o.fence && o.shape !== SH_CROSS)
      try {
        const e = o.boxes ? o.boxes(0) : null;
        r =
          !!e &&
          1 === e.length &&
          e[0][0] <= 0 &&
          e[0][1] <= 0 &&
          e[0][2] <= 0 &&
          e[0][3] >= 16 &&
          e[0][4] >= 16 &&
          e[0][5] >= 16;
      } catch (e) {
        r = !1;
      }
    RS_FULL[e] = t = r ? 1 : 2;
  }
  return 1 === t;
}
const RS_NONCOND =
  /^(redstone_block|observer|piston|sticky_piston|piston_head|moving_piston|slime_block|honey_block|daylight_detector|target_never|glass|.*_glass|ice|.*_leaves|tnt_never|soul_sand|mud|.*_shulker_box|shulker_box)$/;
function conductor(e) {
  return rsFull(e) && !RS_NONCOND.test(rsk(e));
}
const RS_SOURCE =
    /^(lever|redstone_torch|redstone_wall_torch|redstone_block|repeater|comparator|observer|daylight_detector|target|trapped_chest|detector_rail|tripwire_hook|lectern|sculk_sensor|calibrated_sculk_sensor|lightning_rod)$|_button$|pressure_plate$/,
  rsSource = (e) => RS_SOURCE.test(rsk(e)) || isWire(e);
function attachedDir(e, t) {
  const o = prop(e, t, "face"),
    r = prop(e, t, "facing");
  return "floor" === o ? "up" : "ceiling" === o ? "down" : r;
}
function isDotMeta(e, t) {
  const o = BLOCKS[e] && BLOCKS[e].states && BLOCKS[e].states[t];
  return !!o && "none" === o.north && "none" === o.south && "none" === o.east && "none" === o.west;
}
function connectsTo(e, t, o, r, s) {
  const n = e.world,
    i = n.getBlock(t, o, r),
    c = rsk(i),
    a = n.getMeta(t, o, r);
  if (isWire(i)) return !0;
  if ("repeater" === c) {
    const e = prop(i, a, "facing");
    return e === s || e === RS_OPP[s];
  }
  return "observer" === c ? s === prop(i, a, "facing") : rsSource(i) && null !== s;
}
function dustSupported(e, t, o, r) {
  const s = e.world.getBlock(t, o - 1, r);
  return (
    rsFull(s) ||
    "hopper" === rsk(s) ||
    (BLOCKS[s] && BLOCKS[s].slab && !!(3 & e.world.getMeta(t, o - 1, r)))
  );
}
function wireMeta(e, t) {
  const o = BLOCKS[e].states.findIndex(
    (e) => e.north === t.north && e.south === t.south && e.east === t.east && e.west === t.west,
  );
  return o < 0 ? 0 : o;
}
((RS.signal = function (e, t, o, r, s) {
  const n = e.world,
    i = n.getBlock(t, o, r);
  if (!i) return 0;
  const c = n.getMeta(t, o, r),
    a = rsk(i);
  if (isWire(i)) {
    if (!RS.wires || "down" === s) return 0;
    const e = wireP(i);
    if (!e) return 0;
    if ("up" === s) return e;
    const t = prop(i, c, RS_OPP[s]);
    return t && "none" !== t ? e : (isDotMeta(i, c), 0);
  }
  if ("lever" === a || RS_BUTTON.test(a)) return "true" === prop(i, c, "powered") ? 15 : 0;
  if (RS_PLATE.test(a))
    return a.includes("weighted")
      ? +prop(i, c, "power") || 0
      : "true" === prop(i, c, "powered")
        ? 15
        : 0;
  if ("redstone_torch" === a) return "true" === prop(i, c, "lit") && "up" !== s ? 15 : 0;
  if ("redstone_wall_torch" === a)
    return "true" === prop(i, c, "lit") && s !== prop(i, c, "facing") ? 15 : 0;
  if ("redstone_block" === a) return 15;
  if ("repeater" === a)
    return "true" === prop(i, c, "powered") && prop(i, c, "facing") === s ? 15 : 0;
  if ("comparator" === a)
    return (prop(i, c, "facing") === s && (RS.mem.get(rsKey(t, o, r)) || {}).out) || 0;
  if ("observer" === a)
    return "true" === prop(i, c, "powered") && prop(i, c, "facing") === s ? 15 : 0;
  if ("daylight_detector" === a) return (RS.mem.get(rsKey(t, o, r)) || {}).power || 0;
  if ("target" === a) {
    const s = RS.mem.get(rsKey(t, o, r));
    return s && s.until > e.tickCount ? s.power : 0;
  }
  return "trapped_chest" === a
    ? e.openChests && e.openChests.has(rsKey(t, o, r))
      ? 1
      : 0
    : "detector_rail" === a
      ? "true" === prop(i, c, "powered")
        ? 15
        : 0
      : "tripwire_hook" === a && "true" === prop(i, c, "powered")
        ? 15
        : 0;
}),
  (RS.direct = function (e, t, o, r, s) {
    const n = e.world,
      i = n.getBlock(t, o, r);
    if (!i) return 0;
    const c = n.getMeta(t, o, r),
      a = rsk(i);
    return isWire(i)
      ? RS.signal(e, t, o, r, s)
      : "lever" === a || RS_BUTTON.test(a)
        ? attachedDir(i, c) === s
          ? RS.signal(e, t, o, r, s)
          : 0
        : RS_PLATE.test(a) || "trapped_chest" === a || "detector_rail" === a
          ? "up" === s
            ? RS.signal(e, t, o, r, s)
            : 0
          : "redstone_torch" === a || "redstone_wall_torch" === a
            ? "down" === s
              ? RS.signal(e, t, o, r, s)
              : 0
            : "repeater" === a ||
                "comparator" === a ||
                "observer" === a ||
                ("tripwire_hook" === a && prop(i, c, "facing") === s)
              ? RS.signal(e, t, o, r, s)
              : 0;
  }),
  (RS.directInto = function (e, t, o, r) {
    let s = 0;
    for (const n of RS_DN) {
      const i = RS_DIRS[n],
        c = RS.direct(e, t + i[0], o + i[1], r + i[2], n);
      if (c > s && ((s = c), s >= 15)) break;
    }
    return s;
  }),
  (RS.get = function (e, t, o, r, s) {
    const n = RS.signal(e, t, o, r, s);
    return conductor(e.world.getBlock(t, o, r)) ? Math.max(n, RS.directInto(e, t, o, r)) : n;
  }),
  (RS.has = (e, t, o, r, s) => RS.get(e, t, o, r, s) > 0),
  (RS.neighborSignal = function (e, t, o, r) {
    for (const s of RS_DN) {
      const n = RS_DIRS[s];
      if (RS.get(e, t + n[0], o + n[1], r + n[2], s) > 0) return !0;
    }
    return !1;
  }),
  (RS.bestNeighbor = function (e, t, o, r) {
    let s = 0;
    for (const n of RS_DN) {
      const i = RS_DIRS[n],
        c = RS.get(e, t + i[0], o + i[1], r + i[2], n);
      if (c > s && ((s = c), s >= 15)) break;
    }
    return s;
  }),
  (RS.qcPowered = function (e, t, o, r, s) {
    for (const n of RS_DN) {
      if (n === s) continue;
      const i = RS_DIRS[n];
      if (RS.get(e, t + i[0], o + i[1], r + i[2], n) > 0) return !0;
    }
    if (RS.get(e, t, o, r, "down") > 0) return !0;
    for (const s of RS_DN) {
      if ("down" === s) continue;
      const n = RS_DIRS[s];
      if (RS.get(e, t + n[0], o + 1 + n[1], r + n[2], s) > 0) return !0;
    }
    return !1;
  }),
  (RS.set = function (e, t, o, r, s, n) {
    const i = e.world;
    return (
      (i.getBlock(t, o, r) !== s || i.getMeta(t, o, r) !== n) &&
      (i.setBlock(t, o, r, s, n), RS.wake(t, o, r), !0)
    );
  }),
  (RS.setProp = function (e, t, o, r, s, n) {
    const i = e.world,
      c = i.getBlock(t, o, r);
    return RS.set(e, t, o, r, c, Features.withProp(c, i.getMeta(t, o, r), s, n));
  }),
  (RS.wake = function (e, t, o) {
    RS.enqueue(e, t, o);
    for (const r of RS_DN) {
      const s = RS_DIRS[r],
        n = e + s[0],
        i = t + s[1],
        c = o + s[2];
      RS.enqueue(n, i, c);
      for (const e of RS_DN) {
        const t = RS_DIRS[e];
        RS.enqueue(n + t[0], i + t[1], c + t[2]);
      }
    }
  }),
  (RS.enqueue = function (e, t, o) {
    const r = rsKey(e, t, o);
    RS.queued.has(r) || (RS.queued.add(r), RS.queue.push([e, t, o]));
  }),
  (RS.process = function (e) {
    if (RS.busy || !e.world) return;
    RS.busy = !0;
    let t = 0;
    try {
      for (;;) {
        for (; RS.qi < RS.queue.length && t++ < 6e4;) {
          const [t, o, r] = RS.queue[RS.qi++];
          (RS.queued.delete(rsKey(t, o, r)), RS.update(e, t, o, r));
        }
        if (t >= 6e4 || !RS.events.length) break;
        const [o, r, s] = RS.events.shift();
        (RS.evSet.delete(rsKey(o, r, s)), RS.pistonEvent(e, o, r, s));
      }
    } finally {
      ((RS.busy = !1),
        RS.qi >= RS.queue.length || RS.queue.length - RS.qi > 6e4
          ? ((RS.queue.length = 0), RS.queued.clear())
          : (RS.queue = RS.queue.slice(RS.qi)),
        (RS.qi = 0),
        RS.meshDirty && ((RS.meshDirty = !1), e.flushMesh && e.flushMesh()));
    }
  }),
  (RS.wireShape = function (e, t, o, r, s) {
    const n = e.world,
      i = n.getBlock(t, o, r),
      c = conductor(n.getBlock(t, o + 1, r)),
      a = {};
    for (const s of RS_H) {
      const i = RS_DIRS[s],
        l = t + i[0],
        u = r + i[2],
        p = n.getBlock(l, o, u);
      let d = "none";
      (!c && BLOCKS[p] && (BLOCKS[p].trapdoor || rsFull(p)) && isWire(n.getBlock(l, o + 1, u))
        ? (d = rsFull(p) ? "up" : "side")
        : (connectsTo(e, l, o, u, s) || (!conductor(p) && isWire(n.getBlock(l, o - 1, u)))) &&
          (d = "side"),
        (a[s] = d));
    }
    if (!RS_H.some((e) => "none" !== a[e]) && void 0 !== s && isDotMeta(i, s)) return a;
    const l = "none" !== a.north || "none" !== a.south,
      u = "none" !== a.east || "none" !== a.west;
    return (
      l || ("none" === a.east && (a.east = "side"), "none" === a.west && (a.west = "side")),
      u || ("none" === a.north && (a.north = "side"), "none" === a.south && (a.south = "side")),
      a
    );
  }),
  (RS.wirePower = function (e, t, o, r) {
    const s = e.world;
    RS.wires = !1;
    const n = RS.bestNeighbor(e, t, o, r);
    RS.wires = !0;
    let i = 0;
    if (n < 15) {
      const e = conductor(s.getBlock(t, o + 1, r));
      for (const n of RS_H) {
        const c = RS_DIRS[n],
          a = t + c[0],
          l = r + c[2],
          u = s.getBlock(a, o, l);
        ((i = Math.max(i, wireP(u))),
          conductor(u) && !e
            ? (i = Math.max(i, wireP(s.getBlock(a, o + 1, l))))
            : conductor(u) || (i = Math.max(i, wireP(s.getBlock(a, o - 1, l)))));
      }
    }
    return Math.max(n, i - 1);
  }),
  (RS.updateWire = function (e, t, o, r) {
    const s = e.world,
      n = s.getBlock(t, o, r),
      i = s.getMeta(t, o, r);
    if (!dustSupported(e, t, o, r)) return void e.breakRS(t, o, r);
    const c = RS.wirePower(e, t, o, r),
      a = wireMeta(n, RS.wireShape(e, t, o, r, i)),
      l = WIRE_ID[c];
    if (l !== n || a !== i) {
      const e = l !== n;
      (s.setBlock(t, o, r, l, a), e ? RS.wake(t, o, r) : RS.enqueue(t, o, r));
    }
  }),
  (RS.update = function (e, t, o, r) {
    const s = e.world;
    if (!s.isLoaded(t, r)) return;
    const n = s.getBlock(t, o, r);
    if (!n) return;
    const i = BLOCKS[n],
      c = i.key,
      a = s.getMeta(t, o, r);
    if (isWire(n)) return RS.updateWire(e, t, o, r);
    switch (c) {
      case "redstone_torch":
      case "redstone_wall_torch": {
        if (!RS.torchSupported(e, t, o, r, n, a)) return void e.breakRS(t, o, r);
        const i = RS.torchPowered(e, t, o, r, n, a);
        return void (("true" === prop(n, a, "lit")) === i && s.schedule(t, o, r, 2));
      }
      case "repeater": {
        if (!RS.diodeSupported(e, t, o, r)) return void e.breakRS(t, o, r);
        const i = RS.repeaterLocked(e, t, o, r, n, a);
        if (
          (i !== ("true" === prop(n, a, "locked")) &&
            RS.set(e, t, o, r, n, Features.withProp(n, a, "locked", i)),
          i)
        )
          return;
        return void (
          RS.diodeInput(e, t, o, r, n, a) > 0 !== ("true" === prop(n, a, "powered")) &&
          s.schedule(t, o, r, 2 * (+prop(n, a, "delay") || 1))
        );
      }
      case "comparator": {
        if (!RS.diodeSupported(e, t, o, r)) return void e.breakRS(t, o, r);
        const i = RS.comparatorOut(e, t, o, r, n, a);
        return void (
          (i === ((RS.mem.get(rsKey(t, o, r)) || {}).out || 0) &&
            i > 0 == ("true" === prop(n, a, "powered"))) ||
          s.schedule(t, o, r, 2)
        );
      }
      case "redstone_lamp": {
        const i = RS.neighborSignal(e, t, o, r),
          c = "true" === prop(n, a, "lit");
        return void (i && !c
          ? RS.setProp(e, t, o, r, "lit", "true")
          : !i && c && s.schedule(t, o, r, 4));
      }
      case "copper_bulb":
      case "exposed_copper_bulb":
      case "weathered_copper_bulb":
      case "oxidized_copper_bulb":
      case "waxed_copper_bulb":
      case "waxed_exposed_copper_bulb":
      case "waxed_weathered_copper_bulb":
      case "waxed_oxidized_copper_bulb": {
        const s = RS.neighborSignal(e, t, o, r);
        if (s !== ("true" === prop(n, a, "powered"))) {
          let i = Features.withProp(n, a, "powered", s);
          if (s) {
            const e = "true" !== prop(n, a, "lit");
            ((i = Features.withProp(n, i, "lit", e)),
              Sound.ev(
                e ? "block.copper_bulb.turn_on" : "block.copper_bulb.turn_off",
                [t + 0.5, o + 0.5, r + 0.5],
                1,
                1,
              ));
          }
          RS.set(e, t, o, r, n, i);
        }
        return;
      }
      case "tnt":
        return void (
          RS.neighborSignal(e, t, o, r) &&
          (s.setBlock(t, o, r, 0, 0),
          e.entities.push(new PrimedTNT(e, t, o, r)),
          Sound.ev("entity.tnt.primed", [t + 0.5, o, r + 0.5], 1, 1))
        );
      case "note_block":
        return RS.edge(e, t, o, r, RS.neighborSignal(e, t, o, r), () => {
          (Sound.note([t, o, r], a),
            e.particles.spawn("note", t + 0.5, o + 1.2, r + 0.5, 0, 0.02, 0, {
              col: [255, Math.round(10 * a), Math.round(255 - 10 * a)],
            }));
        });
      case "bell":
        return RS.edge(e, t, o, r, RS.neighborSignal(e, t, o, r), () =>
          Sound.ev("block.bell.use", [t + 0.5, o + 0.5, r + 0.5], 2, 1),
        );
      case "piston":
      case "sticky_piston":
        return RS.updatePiston(e, t, o, r, n, a);
      case "dispenser":
      case "dropper":
        return RS.edge(e, t, o, r, RS.qcPowered(e, t, o, r, null), () => s.schedule(t, o, r, 4));
      case "crafter": {
        const i = RS.neighborSignal(e, t, o, r),
          c = "true" === prop(n, a, "triggered");
        return void (i && !c
          ? (s.schedule(t, o, r, 4),
            RS.set(e, t, o, r, n, Features.withProp(n, a, "triggered", !0)))
          : !i && c && RS.set(e, t, o, r, n, Features.withProp(n, a, "triggered", !1)));
      }
      case "rail": {
        const i = !!RS.neighborSignal(e, t, o, r),
          c = RS.memOf(t, o, r);
        if (i === !!c.powered) return;
        c.powered = i;
        const l = "function" == typeof railJunctionShape ? railJunctionShape(s, t, o, r, i) : null;
        return void (l && l !== prop(n, a, "shape") && RS.setProp(e, t, o, r, "shape", l));
      }
      case "powered_rail":
      case "activator_rail": {
        const i = RS.neighborSignal(e, t, o, r) || RS.railChain(e, t, o, r, n, a);
        if (i !== ("true" === prop(n, a, "powered"))) {
          RS.setProp(e, t, o, r, "powered", i);
          for (const e of RS_H) {
            const i = RS_DIRS[e];
            for (const e of [-1, 0, 1])
              s.getBlock(t + i[0], o + e, r + i[2]) === n && RS.enqueue(t + i[0], o + e, r + i[2]);
          }
        }
        return;
      }
      case "daylight_detector":
      case "tripwire":
      case "tripwire_hook":
        return;
      case "hopper":
        return void (RS.memOf(t, o, r).locked = RS.neighborSignal(e, t, o, r));
    }
    if (i.door) {
      const n = 8 & a ? o - 1 : o,
        i = s.getMeta(t, n, r),
        l = RS.neighborSignal(e, t, n, r) || RS.neighborSignal(e, t, n + 1, r),
        u = RS.memOf(t, n, r);
      if (l !== !!u.powered && ((u.powered = l), !!(4 & i) !== l && "iron_door_never" !== c)) {
        const a = l ? 4 | i : -5 & i;
        (s.setMeta(t, n, r, a),
          s.setMeta(t, n + 1, r, 8 | a),
          Sound.door([t, o, r], l, c),
          e.flushMesh && e.flushMesh());
      }
      return;
    }
    if (i.trapdoor) {
      const n = RS.neighborSignal(e, t, o, r),
        i = RS.memOf(t, o, r);
      return void (
        n !== !!i.powered &&
        ((i.powered = n),
        !!(4 & a) !== n && (s.setMeta(t, o, r, n ? 4 | a : -5 & a), Sound.door([t, o, r], n, c)))
      );
    }
    if (i.gate) {
      const i = RS.neighborSignal(e, t, o, r),
        l = RS.memOf(t, o, r);
      i !== !!l.powered &&
        ((l.powered = i),
        ("true" === prop(n, a, "open")) !== i &&
          (s.setMeta(t, o, r, Features.withProp(n, a, "open", i)), Sound.door([t, o, r], i, c)));
    }
  }),
  (RS.memOf = (e, t, o) => {
    const r = rsKey(e, t, o);
    let s = RS.mem.get(r);
    return (s || RS.mem.set(r, (s = {})), s);
  }),
  (RS.edge = function (e, t, o, r, s, n) {
    const i = RS.memOf(t, o, r);
    s && !i.powered ? ((i.powered = !0), n()) : !s && i.powered && (i.powered = !1);
  }),
  (RS.torchAttach = function (e, t) {
    return "redstone_wall_torch" === rsk(e) ? RS_OPP[prop(e, t, "facing")] : "down";
  }),
  (RS.torchSupported = function (e, t, o, r, s, n) {
    if ("undefined" != typeof Features && e.survivalR)
      return Features.canSurvive(e.survivalR(), s, n, t, o, r);
    const i = RS.torchAttach(s, n),
      c = RS_DIRS[i];
    return rsFull(e.world.getBlock(t + c[0], o + c[1], r + c[2]));
  }),
  (RS.torchPowered = function (e, t, o, r, s, n) {
    const i = RS.torchAttach(s, n),
      c = RS_DIRS[i];
    return RS.has(e, t + c[0], o + c[1], r + c[2], i);
  }),
  (RS.diodeSupported = (e, t, o, r) => rsFull(e.world.getBlock(t, o - 1, r))),
  (RS.diodeInput = function (e, t, o, r, s, n) {
    const i = prop(s, n, "facing"),
      c = RS_DIRS[i],
      a = t + c[0],
      l = r + c[2],
      u = RS.get(e, a, o, l, i);
    return u >= 15 ? u : Math.max(u, wireP(e.world.getBlock(a, o, l)));
  }));
const RS_SIDES = (e) => [RS_CW[e], RS_OPP[RS_CW[e]]];
((RS.repeaterLocked = function (e, t, o, r, s, n) {
  const i = e.world;
  for (const c of RS_SIDES(prop(s, n, "facing"))) {
    const s = RS_DIRS[c],
      n = i.getBlock(t + s[0], o, r + s[2]),
      a = rsk(n);
    if (("repeater" === a || "comparator" === a) && RS.signal(e, t + s[0], o, r + s[2], c) > 0)
      return !0;
  }
  return !1;
}),
  (RS.comparatorOut = function (e, t, o, r, s, n) {
    const i = e.world,
      c = prop(s, n, "facing"),
      a = RS_DIRS[c];
    let l = RS.diodeInput(e, t, o, r, s, n);
    const u = RS.analog(e, t + a[0], o, r + a[2]);
    if (null !== u) l = u;
    else if (l < 15 && conductor(i.getBlock(t + a[0], o, r + a[2]))) {
      const s = RS.analog(e, t + 2 * a[0], o, r + 2 * a[2]);
      null !== s && (l = s);
    }
    let p = 0;
    for (const s of RS_SIDES(c)) {
      const n = RS_DIRS[s],
        c = t + n[0],
        a = r + n[2],
        l = i.getBlock(c, o, a);
      (rsSource(l) || isWire(l)) &&
        (p = Math.max(
          p,
          "redstone_block" === rsk(l) ? 15 : isWire(l) ? wireP(l) : RS.direct(e, c, o, a, s),
        ));
    }
    return "subtract" === prop(s, n, "mode") ? Math.max(l - p, 0) : l >= p ? l : 0;
  }),
  (RS.analog = function (e, t, o, r) {
    const s = e.world,
      n = s.getBlock(t, o, r),
      i = rsk(n),
      c = s.getMeta(t, o, r),
      a = RS.container(e, t, o, r, "detector_rail" === i && "true" === prop(n, c, "powered"));
    if (a) {
      let e = 0,
        t = !1;
      for (let o = 0; o < a.size; o++) {
        const r = a.get(o);
        r && ((e += r.count / Math.min(a.max || 64, maxStack(r.id))), (t = !0));
      }
      return t ? Math.floor(1 + (e / a.size) * 14) : 0;
    }
    if ("cake" === i) return 2 * (7 - (+prop(n, c, "bites") || 0));
    if (/copper_bulb$/.test(i)) return "true" === prop(n, c, "lit") ? 15 : 0;
    if ("composter" === i) return +prop(n, c, "level") || 0;
    if (/cauldron$/.test(i))
      return "water_cauldron" === i || "powder_snow_cauldron" === i
        ? +prop(n, c, "level") || 0
        : "lava_cauldron" === i
          ? 3
          : 0;
    if ("end_portal_frame" === i) return "true" === prop(n, c, "eye") ? 15 : 0;
    if ("respawn_anchor" === i) return Math.floor((15 * (+prop(n, c, "charges") || 0)) / 4);
    if ("beehive" === i || "bee_nest" === i) return +prop(n, c, "honey_level") || 0;
    if ("jukebox" === i) {
      const s = e.blockEntities.get(rsKey(t, o, r));
      return s && s.disc ? 1 : 0;
    }
    return null;
  }),
  (RS.container = function (e, t, o, r, s = !0) {
    const n = e.world,
      i = n.getBlock(t, o, r),
      c = BLOCKS[i];
    if (!c) return s ? RS.vehicleContainer(e, t, o, r) : null;
    const a = c.key;
    rsKey(t, o, r);
    if (c.chestLike || "barrel" === a) {
      if ("ender_chest" === a) return null;
      const s = [e.getBlockEntity(t, o, r, "chest")];
      if (c.chestLike) {
        const c = chestSeam(n.getMeta(t, o, r));
        c &&
          n.getBlock(t + c[0], o, r + c[1]) === i &&
          s.push(e.getBlockEntity(t + c[0], o, r + c[1], "chest"));
      }
      const l = s.flatMap((e) => e.slots.map((t, o) => [e, o]));
      return {
        size: l.length,
        get: (e) => l[e][0].slots[l[e][1]],
        set: (e, t) => {
          l[e][0].slots[l[e][1]] = t;
        },
        canIn: () => !0,
        canOut: () => !0,
      };
    }
    if ("furnace" === c.onUse) {
      const s = e.getBlockEntity(t, o, r, "furnace"),
        n = ["input", "fuel", "output"];
      return {
        size: 3,
        get: (e) => s[n[e]],
        set: (e, t) => {
          s[n[e]] = t;
        },
        canIn: (e, t, o) => ("up" === o ? 0 === e : "down" !== o && 1 === e && fuelValue(t.id) > 0),
        canOut: (e, t) =>
          "down" === t && (2 === e || (1 === e && s.fuel && "bucket" === ITEMS[s.fuel.id].key)),
      };
    }
    if ("brewing_stand" === a) {
      const s = e.getBlockEntity(t, o, r, "brewing");
      s.bottles ||
        Object.assign(s, {
          bottles: [null, null, null],
          ingredient: null,
          fuel: null,
          fuelLeft: 0,
          brewTime: 0,
        });
      return {
        size: 5,
        max: 1,
        get: (e) => (e < 3 ? s.bottles[e] : 3 === e ? s.ingredient : s.fuel),
        set: (e, t) => {
          e < 3 ? (s.bottles[e] = t) : 3 === e ? (s.ingredient = t) : (s.fuel = t);
        },
        canIn: (e, t, o) =>
          "up" === o
            ? 3 === e
            : 4 === e
              ? t.id === ITEM_KEY.blaze_powder
              : e < 3 &&
                "function" == typeof isPotion &&
                (isPotion(t) || t.id === ITEM_KEY.glass_bottle),
        canOut: (e, t) => e < 3 && 0 === s.brewTime,
      };
    }
    if ("hopper" === a || "dispenser" === a || "dropper" === a || "crafter" === a) {
      const s = RS.be(e, t, o, r, a);
      return {
        size: s.slots.length,
        get: (e) => s.slots[e],
        set: (e, t) => {
          s.slots[e] = t;
        },
        canIn: (e) => "crafter" !== a || !(s.disabled || []).includes(e),
        canOut: () => !0,
      };
    }
    return SOLIDCUBE[i] || !s ? null : RS.vehicleContainer(e, t, o, r);
  }),
  (RS.vehicleContainer = function (e, t, o, r) {
    const s = [];
    for (const n of e.entities) {
      if (!n.isVehicle || !n.slots || n.dead) continue;
      const e = n.box();
      e[0] < t + 1 && e[3] > t && e[1] < o + 1 && e[4] > o && e[2] < r + 1 && e[5] > r && s.push(n);
    }
    if (!s.length) return null;
    const n = s[(Math.random() * s.length) | 0];
    n.unpackLoot && n.unpackLoot();
    const i = n.slots;
    return {
      size: i.length,
      get: (e) => i[e],
      set: (e, t) => {
        i[e] = t;
      },
      canIn: () => !0,
      canOut: () => !0,
    };
  }),
  (RS.be = function (e, t, o, r, s) {
    const n = rsKey(t, o, r);
    let i = e.blockEntities.get(n);
    return (
      (i && i.type === s) ||
        ((i = {
          type: s,
          pos: [t, o, r],
          slots: new Array("hopper" === s ? 5 : 9).fill(null),
          cd: 0,
        }),
        e.blockEntities.set(n, i)),
      i
    );
  }),
  (RS.insert = function (e, t, o) {
    let r = { ...t };
    for (let t = 0; t < e.size && r; t++) {
      const s = e.get(t);
      if (!s || !sameKind(s, r) || !e.canIn(t, r, o)) continue;
      const n = Math.min(e.max || 64, maxStack(r.id)) - s.count;
      if (n <= 0) continue;
      const i = Math.min(n, r.count);
      ((s.count += i), (r.count -= i), r.count || (r = null));
    }
    for (let t = 0; t < e.size && r; t++) {
      if (e.get(t) || !e.canIn(t, r, o)) continue;
      const s = Math.min(e.max || 64, maxStack(r.id), r.count);
      (e.set(t, { ...r, count: s }), (r.count -= s), r.count || (r = null));
    }
    return r;
  }),
  (RS.tick = function (e, t, o, r) {
    const s = e.world,
      n = s.getBlock(t, o, r),
      i = rsk(n),
      c = s.getMeta(t, o, r);
    if (!n) return !1;
    switch (i) {
      case "redstone_torch":
      case "redstone_wall_torch": {
        const i = RS.torchPowered(e, t, o, r, n, c),
          a = "true" === prop(n, c, "lit"),
          l = rsKey(t, o, r),
          u = (RS.torchHist.get(l) || []).filter((t) => e.tickCount - t < 60);
        return (
          a && i
            ? (u.push(e.tickCount),
              RS.torchHist.set(l, u),
              RS.set(e, t, o, r, n, Features.withProp(n, c, "lit", !1)),
              u.length >= 8 &&
                (Sound.ev("block.redstone_torch.burnout", [t + 0.5, o + 0.5, r + 0.5], 0.5, 2.6),
                s.schedule(t, o, r, 160)))
            : !a && !i && u.length < 8
              ? RS.set(e, t, o, r, n, Features.withProp(n, c, "lit", !0))
              : a ||
                i ||
                (RS.torchHist.set(l, u),
                u.length
                  ? s.schedule(t, o, r, 20)
                  : RS.set(e, t, o, r, n, Features.withProp(n, c, "lit", !0))),
          !0
        );
      }
      case "repeater": {
        if ("true" === prop(n, c, "locked")) return !0;
        const i = RS.diodeInput(e, t, o, r, n, c) > 0,
          a = "true" === prop(n, c, "powered");
        return (
          a && !i
            ? RS.set(e, t, o, r, n, Features.withProp(n, c, "powered", !1))
            : a ||
              (RS.set(e, t, o, r, n, Features.withProp(n, c, "powered", !0)),
              i || s.schedule(t, o, r, 2 * (+prop(n, c, "delay") || 1))),
          !0
        );
      }
      case "comparator": {
        const s = RS.comparatorOut(e, t, o, r, n, c),
          i = RS.memOf(t, o, r),
          a = s !== (i.out || 0);
        i.out = s;
        const l = Features.withProp(n, c, "powered", s > 0);
        return (l !== c ? RS.set(e, t, o, r, n, l) : a && RS.wake(t, o, r), !0);
      }
      case "redstone_lamp":
        return (
          RS.neighborSignal(e, t, o, r) ||
            "true" !== prop(n, c, "lit") ||
            RS.setProp(e, t, o, r, "lit", "false"),
          !0
        );
      case "observer":
        return (
          "true" === prop(n, c, "powered")
            ? RS.set(e, t, o, r, n, Features.withProp(n, c, "powered", !1))
            : (RS.set(e, t, o, r, n, Features.withProp(n, c, "powered", !0)),
              s.schedule(t, o, r, 2)),
          !0
        );
      case "dispenser":
      case "dropper":
        return (RS.dispense(e, t, o, r, n, c), !0);
      case "crafter":
        return (RS.craft(e, t, o, r, n, c), !0);
      case "piston":
      case "sticky_piston":
        return (RS.updatePiston(e, t, o, r, n, c), !0);
      case "detector_rail":
        return (RS.detectorCheck(e, t, o, r), !0);
      case "tripwire_hook":
      case "tripwire":
        return (RS.tripCheck(e, t, o, r), !0);
    }
    return RS_BUTTON.test(i)
      ? ("true" === prop(n, c, "powered") &&
          (RS.set(e, t, o, r, n, Features.withProp(n, c, "powered", !1)),
          Sound.ev(
            i.startsWith("stone") || i.includes("blackstone")
              ? "block.stone_button.click_off"
              : "block.wooden_button.click_off",
            [t + 0.5, o + 0.5, r + 0.5],
            0.3,
            0.5,
          )),
        !0)
      : !!RS_PLATE.test(i) && (RS.plateCheck(e, t, o, r), !0);
  }),
  (RS.entitiesIn = function (e, t, o) {
    const r = [];
    for (const s of [e.player, ...e.entities]) {
      if (!s || s.dead || s.deathTime > 0 || (s === e.player && "spectator" === e.mode)) continue;
      if (o && !o(s)) continue;
      const n = s.box();
      n[0] < t[3] &&
        n[3] > t[0] &&
        n[1] < t[4] &&
        n[4] > t[1] &&
        n[2] < t[5] &&
        n[5] > t[2] &&
        r.push(s);
    }
    return r;
  }),
  (RS.plateCheck = function (e, t, o, r) {
    const s = e.world,
      n = s.getBlock(t, o, r),
      i = rsk(n),
      c = s.getMeta(t, o, r),
      a = [t + 0.0625, o, r + 0.0625, t + 0.9375, o + 0.25, r + 0.9375],
      l = i.startsWith("stone") || i.includes("blackstone"),
      u = RS.entitiesIn(e, a, (e) => !l || e instanceof Living);
    if (i.includes("weighted")) {
      const a = u.reduce((e, t) => e + (t.stack ? t.stack.count : 1), 0),
        l = i.startsWith("light") ? Math.min(a, 15) : a ? Math.ceil(Math.min(a, 150) / 10) : 0,
        p = +prop(n, c, "power") || 0;
      return (
        l !== p &&
          (RS.set(e, t, o, r, n, Features.withProp(n, c, "power", l)),
          Sound.ev(
            l > p ? "block.metal_pressure_plate.click_on" : "block.metal_pressure_plate.click_off",
            [t + 0.5, o, r + 0.5],
            0.3,
            l > p ? 0.9 : 0.75,
          )),
        void (l > 0 && s.schedule(t, o, r, 10))
      );
    }
    const p = u.length > 0;
    (p !== ("true" === prop(n, c, "powered")) &&
      (RS.set(e, t, o, r, n, Features.withProp(n, c, "powered", p)),
      Sound.ev(
        l
          ? p
            ? "block.stone_pressure_plate.click_on"
            : "block.stone_pressure_plate.click_off"
          : p
            ? "block.wooden_pressure_plate.click_on"
            : "block.wooden_pressure_plate.click_off",
        [t + 0.5, o, r + 0.5],
        0.3,
        p ? 0.6 : 0.5,
      )),
      p && s.schedule(t, o, r, 20));
  }),
  (RS.detectorCheck = function (e, t, o, r) {
    const s = e.world,
      n = s.getBlock(t, o, r),
      i = s.getMeta(t, o, r),
      c =
        RS.entitiesIn(
          e,
          [t + 0.2, o, r + 0.2, t + 0.8, o + 0.8, r + 0.8],
          (e) => e instanceof Minecart,
        ).length > 0;
    (c !== ("true" === prop(n, i, "powered")) &&
      RS.set(e, t, o, r, n, Features.withProp(n, i, "powered", c)),
      c && s.schedule(t, o, r, 20));
  }),
  (RS.railChain = function (e, t, o, r, s, n) {
    const i = e.world,
      c = new Set([rsKey(t, o, r)]),
      walk = (t, o, r, n) => {
        if (n > 8) return !1;
        const a = i.getMeta(t, o, r),
          l = prop(s, a, "shape");
        for (const [a, u, p] of RAIL_EXITS[l] || [])
          for (const l of [u, 0, 1, -1]) {
            const u = t + a,
              d = o + l,
              S = r + p,
              h = rsKey(u, d, S);
            if (!c.has(h) && i.getBlock(u, d, S) === s) {
              if ((c.add(h), RS.neighborSignal(e, u, d, S) || walk(u, d, S, n + 1))) return !0;
              break;
            }
          }
        return !1;
      };
    return walk(t, o, r, 1);
  }),
  (RS.tripLine = function (e, t, o, r) {
    const s = e.world,
      n = s.getBlock(t, o, r),
      i = s.getMeta(t, o, r),
      c = prop(n, i, "facing"),
      a = RS_DIRS[c],
      l = [];
    for (let e = 1; e <= 41; e++) {
      const n = t + a[0] * e,
        i = r + a[2] * e,
        u = s.getBlock(n, o, i),
        p = rsk(u);
      if ("tripwire_hook" === p)
        return prop(u, s.getMeta(n, o, i), "facing") === RS_OPP[c] && l.length
          ? { other: [n, o, i], wire: l }
          : null;
      if ("tripwire" !== p) return null;
      l.push([n, o, i]);
    }
    return null;
  }),
  (RS.tripCheck = function (e, t, o, r) {
    const s = e.world,
      n = rsk(s.getBlock(t, o, r));
    if ("tripwire" === n) {
      for (const n of RS_H) {
        const i = RS_DIRS[n];
        for (let n = 1; n <= 41; n++) {
          const c = rsk(s.getBlock(t + i[0] * n, o, r + i[2] * n));
          if ("tripwire_hook" === c) {
            RS.tripCheck(e, t + i[0] * n, o, r + i[2] * n);
            break;
          }
          if ("tripwire" !== c) break;
        }
      }
      return;
    }
    if ("tripwire_hook" !== n) return;
    const i = RS.tripLine(e, t, o, r),
      c =
        !!i &&
        i.wire.some(([t, o, r]) => RS.entitiesIn(e, [t, o, r, t + 1, o + 0.15, r + 1]).length > 0);
    for (const n of i ? [[t, o, r], i.other] : [[t, o, r]]) {
      const t = s.getBlock(...n),
        o = s.getMeta(...n);
      let r = Features.withProp(t, o, "attached", !!i);
      ((r = Features.withProp(t, r, "powered", c)),
        r !== o &&
          (c !== ("true" === prop(t, o, "powered")) &&
            Sound.ev(
              c ? "block.tripwire.click_on" : "block.tripwire.click_off",
              [n[0] + 0.5, n[1] + 0.5, n[2] + 0.5],
              0.4,
              0.6,
            ),
          RS.set(e, ...n, t, r)));
    }
    if (i)
      for (const e of i.wire) {
        const t = s.getBlock(...e),
          o = s.getMeta(...e),
          r = Features.withProp(t, o, "attached", !0);
        r !== o && s.setMeta(...e, r);
      }
    c && s.schedule(t, o, r, 10);
  }),
  (RS.targetHit = function (e, t, o, r, s, n) {
    const i = s[0] - t,
      c = s[1] - o,
      a = s[2] - r,
      l =
        0.5 === Math.max(Math.abs(i - 0.5), Math.abs(c - 0.5), Math.abs(a - 0.5))
          ? Math.min(
              ...[
                [i, c],
                [c, a],
                [i, a],
              ].map(([e, t]) => Math.max(Math.abs(e - 0.5), Math.abs(t - 0.5))),
            )
          : 0.5,
      u = Math.max(1, Math.ceil(15 * clamp((0.5 - l) / 0.5, 0, 1)));
    (RS.mem.set(rsKey(t, o, r), { power: u, until: e.tickCount + (n ? 20 : 8) }),
      RS.wake(t, o, r),
      e.world.schedule(t, o, r, n ? 20 : 8));
  }));
const RS_IMMOVABLE =
  /^(obsidian|crying_obsidian|bedrock|barrier|end_portal_frame|end_portal|end_gateway|nether_portal|reinforced_deepslate|respawn_anchor|enchanting_table|ender_chest|beacon|command_block|chain_command_block|repeating_command_block|structure_block|jigsaw|moving_piston|piston_head|light|spawner|trial_spawner|vault|lodestone|conduit)$/;
function blockPushReaction(e, t, o, r) {
  const s = e.world,
    n = s.getBlock(t, o, r);
  if (!n) return "air";
  const i = BLOCKS[n],
    c = i.key;
  return IS_FLUID[n]
    ? "destroy"
    : RS_IMMOVABLE.test(c) || i.hardness < 0
      ? "block"
      : ("piston" !== c && "sticky_piston" !== c) ||
          "true" !== prop(n, s.getMeta(t, o, r), "extended")
        ? e.blockEntities.has(rsKey(t, o, r)) ||
          i.chestLike ||
          i.beRender ||
          "furnace" === i.onUse ||
          /^(hopper|dispenser|dropper|crafter|brewing_stand|jukebox|lectern|beehive|bee_nest|chiseled_bookshelf|decorated_pot|bell|campfire|soul_campfire)$/.test(
            c,
          ) ||
          i.be
          ? "block"
          : c.endsWith("glazed_terracotta")
            ? "push"
            : /^(end_rod|powder_snow|dead_\w+_coral(_fan|_wall_fan)?)$/.test(c)
              ? "move"
              : REPLACEABLE[n] ||
                  i.needsSupport ||
                  i.door ||
                  i.bed ||
                  !i.solid ||
                  isWire(n) ||
                  /^(repeater|comparator|lever|.*_button|redstone_torch|redstone_wall_torch|.*pressure_plate|cobweb|cactus|.*_carpet_never|flower_pot|.*_flower_pot|ladder|scaffolding|snow|.*_sign|.*_hanging_sign|.*_banner|dragon_egg|.*lantern|.*_bed|.*_head|.*_skull|melon|pumpkin_never|tripwire|tripwire_hook)$/.test(
                    c,
                  )
                ? "destroy"
                : "move"
        : "block";
}
const isSticky = (e) => {
  const t = rsk(e);
  return "slime_block" === t || "honey_block" === t;
};
function stickTogether(e, t) {
  const o = rsk(e),
    r = rsk(t);
  return (
    !(
      ("slime_block" === o && "honey_block" === r) ||
      ("honey_block" === o && "slime_block" === r)
    ) &&
    (isSticky(e) || isSticky(t))
  );
}
((RS.resolve = function (e, t, o, r, s, n) {
  const i = RS_DIRS[s],
    c = n ? i : RS_DIRS[RS_OPP[s]],
    a = n ? [t + i[0], o + i[1], r + i[2]] : [t + 2 * i[0], o + 2 * i[1], r + 2 * i[2]],
    l = [],
    u = [],
    p = new Set(),
    d = e.world,
    S = rsKey(t + i[0], o + i[1], r + i[2]),
    pushReaction = (t, o, r) => (n || rsKey(t, o, r) !== S ? blockPushReaction(e, t, o, r) : "air"),
    h = pushReaction(...a);
  if (!n && "move" !== h) return { toMove: l, toDestroy: u };
  if ("air" === h) return { toMove: l, toDestroy: u };
  if ("destroy" === h) return n ? { toMove: l, toDestroy: [a] } : { toMove: l, toDestroy: u };
  if ("block" === h) return null;
  const f = rsKey(t, o, r),
    addLine = (e) => {
      let [t, o, r] = e;
      if (p.has(rsKey(t, o, r))) return !0;
      const s = pushReaction(t, o, r);
      if ("air" === s || "destroy" === s) return !0;
      if ("block" === s) return !1;
      if (rsKey(t, o, r) === f) return !0;
      const n = [];
      let i = t,
        a = o,
        S = r;
      for (; isSticky(d.getBlock(i, a, S));) {
        const e = i - c[0],
          t = a - c[1],
          o = S - c[2],
          r = d.getBlock(e, t, o);
        if (rsKey(e, t, o) === f) break;
        if ("move" !== pushReaction(e, t, o) || !stickTogether(d.getBlock(i, a, S), r)) break;
        if ((n.push([e, t, o]), (i = e), (a = t), (S = o), l.length + n.length > 12)) return !1;
      }
      for (let e = n.length - 1; e >= 0; e--) {
        const t = rsKey(...n[e]);
        p.has(t) || (p.add(t), l.push(n[e]));
      }
      for (;;) {
        const e = rsKey(t, o, r);
        if ((p.has(e) || (p.add(e), l.push([t, o, r])), l.length > 12)) return !1;
        const s = t + c[0],
          n = o + c[1],
          i = r + c[2];
        if (rsKey(s, n, i) === f) return !1;
        const a = pushReaction(s, n, i);
        if ("air" === a) break;
        if ("destroy" === a) {
          u.push([s, n, i]);
          break;
        }
        if ("block" === a) return !1;
        if (p.has(rsKey(s, n, i))) break;
        ((t = s), (o = n), (r = i));
      }
      return !0;
    };
  if (!addLine(a)) return null;
  for (let e = 0; e < l.length; e++) {
    const t = l[e],
      o = d.getBlock(...t);
    if (isSticky(o))
      for (const e of RS_DN) {
        const r = RS_DIRS[e];
        if (
          (r[0] === c[0] && r[1] === c[1] && r[2] === c[2]) ||
          (r[0] === -c[0] && r[1] === -c[1] && r[2] === -c[2])
        )
          continue;
        const s = [t[0] + r[0], t[1] + r[1], t[2] + r[2]],
          n = d.getBlock(...s);
        if (
          !p.has(rsKey(...s)) &&
          "move" === pushReaction(...s) &&
          stickTogether(o, n) &&
          !addLine(s)
        )
          return null;
      }
  }
  return l.length > 12 ? null : { toMove: l, toDestroy: u };
}),
  (RS.updatePiston = function (e, t, o, r, s, n) {
    const i = prop(s, n, "facing"),
      c = "true" === prop(s, n, "extended");
    if (RS.qcPowered(e, t, o, r, i) === c) return;
    const a = rsKey(t, o, r);
    RS.evSet.has(a) || (RS.evSet.add(a), RS.events.push([t, o, r]));
  }),
  (RS.pistonEvent = function (e, t, o, r) {
    const s = e.world,
      n = s.getBlock(t, o, r),
      i = rsk(n);
    if ("piston" !== i && "sticky_piston" !== i) return;
    const c = s.getMeta(t, o, r),
      a = "true" === prop(n, c, "extended"),
      l = RS.qcPowered(e, t, o, r, prop(n, c, "facing"));
    if (l === a) return;
    const u = rsKey(t, o, r),
      p = e.tickCount;
    let d = RS.pistonT.get(u);
    if ((d && (d.t > p || p - d.t >= 3) && (RS.pistonT.delete(u), (d = null)), l && d && !d.ext))
      s.schedule(t, o, r, 3 - (p - d.t));
    else if (RS.pistonMove(e, t, o, r, n, c, l, !l && !!d && d.ext)) {
      if (RS.pistonT.size > 4096)
        for (const [e, t] of RS.pistonT) (t.t > p || p - t.t >= 3) && RS.pistonT.delete(e);
      RS.pistonT.set(u, { t: p, ext: l });
    }
  }),
  (RS.pistonMove = function (e, t, o, r, s, n, i, c) {
    const a = e.world,
      l = prop(s, n, "facing"),
      u = RS_DIRS[l],
      p = "sticky_piston" === rsk(s),
      d = [t + u[0], o + u[1], r + u[2]];
    let S = { toMove: [], toDestroy: [] };
    if ((i || (p && !c)) && ((S = RS.resolve(e, t, o, r, l, i)), !S)) return !1;
    const h = i ? u : RS_DIRS[RS_OPP[l]];
    for (const t of S.toDestroy) {
      const o = a.getBlock(...t);
      (o && !IS_FLUID[o] && e.dropBlockLoot(...t, o, a.getMeta(...t), null),
        a.setBlock(...t, 0, 0));
    }
    const f = S.toMove.map((e) => [e, a.getBlock(...e), a.getMeta(...e), a.isWaterlogged(...e)]),
      wallFan = (e) => /_wall_fan$/.test(rsk(e));
    (f.sort((e, t) => wallFan(t[1]) - wallFan(e[1])), i || a.setBlock(...d, 0, 0));
    for (const [e, , , t] of f) (t && a.setWaterlogged(...e, !1), a.setBlock(...e, 0, 0, 3));
    let R = 0;
    const k = BID.piston_head;
    i &&
      ((R = Features.withProp(k, 0, "facing", l)),
      (R = Features.withProp(k, R, "type", p ? "sticky" : "normal")),
      (R = Features.withProp(k, R, "short", "false")),
      a.setBlock(...d, k, R));
    for (const [e, t, o, r] of f
      .slice()
      .sort((e, t) => wallFan(e[1]) - wallFan(t[1]) || e[0][1] - t[0][1]))
      (a.setBlock(e[0] + h[0], e[1] + h[1], e[2] + h[2], t, o),
        r && a.setWaterlogged(e[0] + h[0], e[1] + h[1], e[2] + h[2], !0));
    const _ = new Set(f.map(([e]) => rsKey(e[0] + h[0], e[1] + h[1], e[2] + h[2])));
    i && _.add(rsKey(...d));
    for (const t of [e.player, ...e.entities]) {
      if (!t || t.dead) continue;
      const e = t.box(),
        o = Math.floor(t.pos[0]),
        r = Math.floor(t.pos[2]);
      for (let s = Math.floor(e[1]); s <= Math.floor(e[4] - 0.001); s++)
        if (_.has(rsKey(o, s, r))) {
          ((t.pos[0] += 1.01 * h[0]),
            (t.pos[1] += 1.01 * h[1]),
            (t.pos[2] += 1.01 * h[2]),
            f.some(([e, t]) => "slime_block" === rsk(t)) &&
              ((t.vel[0] += 0.5 * h[0]), (t.vel[1] += 0.5 * h[1]), (t.vel[2] += 0.5 * h[2])));
          break;
        }
    }
    i
      ? (RS.set(e, t, o, r, s, Features.withProp(s, n, "extended", !0)),
        Sound.ev(
          "block.piston.extend",
          [t + 0.5, o + 0.5, r + 0.5],
          0.5,
          0.7 + 0.25 * Math.random(),
        ))
      : (RS.set(e, t, o, r, s, Features.withProp(s, n, "extended", !1)),
        Sound.ev(
          "block.piston.contract",
          [t + 0.5, o + 0.5, r + 0.5],
          0.5,
          0.6 + 0.15 * Math.random(),
        ));
    for (const [e] of f) (RS.wake(...e), RS.wake(e[0] + h[0], e[1] + h[1], e[2] + h[2]));
    RS.wake(...d);
    for (const [t, o, r] of f) {
      if ("observer" !== rsk(o)) continue;
      const s = t[0] + h[0],
        n = t[1] + h[1],
        i = t[2] + h[2];
      a.getBlock(s, n, i) === o &&
        ("true" === prop(o, r, "powered")
          ? RS.set(e, s, n, i, o, Features.withProp(o, r, "powered", !1))
          : (a.ticks.delete(rsKey(s, n, i)), a.schedule(s, n, i, 4)));
    }
    return ((RS.meshDirty = !0), !0);
  }),
  (RS.observe = function (e, t, o, r) {
    const s = e.world;
    for (const e of RS_DN) {
      const n = RS_DIRS[e],
        i = t - n[0],
        c = o - n[1],
        a = r - n[2],
        l = s.getBlock(i, c, a);
      if ("observer" !== rsk(l)) continue;
      const u = s.getMeta(i, c, a);
      prop(l, u, "facing") === e && "true" !== prop(l, u, "powered") && s.schedule(i, c, a, 2);
    }
  }),
  (RS.dispense = function (e, t, o, r, s, n) {
    const i = e.world,
      c = RS.be(e, t, o, r, rsk(s)),
      a = prop(s, n, "facing"),
      l = RS_DIRS[a],
      u = c.slots.map((e, t) => (e ? t : -1)).filter((e) => e >= 0),
      p = [
        t + 0.5 + 0.7 * l[0],
        o + 0.5 + 0.7 * l[1] - (0 === l[1] ? 0.15 : 0),
        r + 0.5 + 0.7 * l[2],
      ];
    if (!u.length) return void Sound.ev("block.dispenser.fail", p, 1, 1.2);
    const d = u[Math.floor(Math.random() * u.length)],
      S = c.slots[d],
      h = ITEMS[S.id].key,
      take = (e = 1) => {
        ((S.count -= e), S.count <= 0 && (c.slots[d] = null));
      },
      f = [t + l[0], o + l[1], r + l[2]],
      shoot = (e) => [l[0] * e, l[1] * e + 0.1, l[2] * e];
    let R = !0;
    if ("dropper" === rsk(s)) {
      const t = RS.container(e, ...f);
      if (t) {
        RS.insert(t, { ...S, count: 1 }, RS_OPP[a]) ? (R = !1) : take();
      } else (e.dropItem(...p, { ...S, count: 1 }, shoot(0.2)), take());
    } else if (AMMO.has(h)) {
      const t = new Arrow(e, ...p, shoot(1.1), null);
      ((t.stack = { ...S, count: 1 }),
        "arrow" !== h && (t.tip = t.stack),
        e.entities.push(t),
        take(),
        Sound.ev("entity.arrow.shoot", p, 1, 1.2));
    } else if ("snowball" === h || "egg" === h) {
      const t = new Arrow(e, ...p, shoot(1.1), null);
      ((t.snowball = S.id), e.entities.push(t), take());
    } else if ("splash_potion" === h || "lingering_potion" === h)
      (e.entities.push(new ThrownPotion(e, ...p, shoot(0.5), null, { ...S, count: 1 })), take());
    else if ("fire_charge" === h)
      (e.entities.push(new Fireball(e, ...p, [0.1 * l[0], 0.1 * l[1], 0.1 * l[2]], null, !0)),
        take());
    else if ("tnt" === h) (e.entities.push(new PrimedTNT(e, ...f)), take());
    else if ("water_bucket" === h || "lava_bucket" === h) {
      const t = i.getBlock(...f);
      "water_bucket" === h && canWaterlog(t, i.getMeta(...f)) && !i.isWaterlogged(...f)
        ? (i.setWaterlogged(...f, !0),
          e.dowseCampfire && e.dowseCampfire(...f, "entity.generic.extinguish_fire"),
          (c.slots[d] = makeStack("bucket")))
        : !t || REPLACEABLE[t]
          ? (i.setBlock(...f, "water_bucket" === h ? WATER : LAVA, 0),
            (c.slots[d] = makeStack("bucket")))
          : (R = !1);
    } else if ("bucket" === h) {
      const s = i.getBlock(...f);
      if (!IS_FLUID[s] && i.isWaterlogged(...f)) {
        (i.setWaterlogged(...f, !1), take());
        const s = makeStack("water_bucket");
        RS.insert(RS.container(e, t, o, r), s, null) && e.dropItem(...p, s, shoot(0.2));
      } else if (IS_FLUID[s] && 0 === i.getMeta(...f)) {
        (i.setBlock(...f, 0, 0), take());
        const n = makeStack(s === WATER ? "water_bucket" : "lava_bucket");
        RS.insert(RS.container(e, t, o, r), n, null) && e.dropItem(...p, n, shoot(0.2));
      } else R = !1;
    } else if ("flint_and_steel" === h) {
      const t = i.getBlock(...f);
      ("tnt" === rsk(t)
        ? (i.setBlock(...f, 0, 0), e.entities.push(new PrimedTNT(e, ...f)))
        : !t && e.fireSupported(...f)
          ? i.setBlock(...f, e.fireIdAt(...f), 0)
          : (R = !1),
        R && ((S.dmg = (S.dmg || 0) + 1), S.dmg >= ITEMS[S.id].durability && (c.slots[d] = null)));
    } else if ("bone_meal" === h) {
      64 === i.getBlock(...f) && i.getMeta(...f) < 7
        ? (i.setMeta(...f, Math.min(7, i.getMeta(...f) + 2 + ((3 * Math.random()) | 0))),
          take(),
          e.flushMesh())
        : (R = !1);
    } else if (ITEMS[S.id].spawnEgg) {
      const t = createMob(e, ITEMS[S.id].spawnEgg, f[0] + 0.5, f[1], f[2] + 0.5);
      ((t.persistent = !0), e.entities.push(t), take());
    } else if ("undefined" != typeof BOAT_ITEM && BOAT_ITEM[h]) {
      const [t, o] = BOAT_ITEM[h],
        r = new Boat(
          e,
          f[0] + 0.5,
          f[1] + (IS_FLUID[i.getBlock(...f)] ? 0.5 : 0),
          f[2] + 0.5,
          t,
          o,
        );
      ((r.yaw = Math.atan2(-l[0], -l[2])), e.entities.push(r), take());
    } else if (
      "undefined" != typeof CART_ITEM &&
      void 0 !== CART_ITEM[h] &&
      isRail(i.getBlock(...f))
    )
      (e.entities.push(new Minecart(e, f[0] + 0.5, f[1] + 0.0625, f[2] + 0.5, CART_ITEM[h])),
        take());
    else if ("shears" === h) {
      const t = RS.entitiesIn(
        e,
        [f[0], f[1], f[2], f[0] + 1, f[1] + 1, f[2] + 1],
        (e) => "sheep" === e.type && !e.sheared && !e.baby,
      )[0];
      if (t) {
        t.sheared = !0;
        for (let o = 0, r = 1 + ((3 * Math.random()) | 0); o < r; o++)
          e.dropItem(t.pos[0], t.pos[1] + 1, t.pos[2], makeStack(woolKey(t.woolColor), 1));
        S.dmg = (S.dmg || 0) + 1;
      } else R = !1;
    } else if ("glass_bottle" === h) {
      if (i.getBlock(...f) === WATER) {
        take();
        const s = { id: ITEM_KEY.potion, count: 1, dmg: 0, pot: "water" };
        RS.insert(RS.container(e, t, o, r), s, null) && e.dropItem(...p, s, shoot(0.2));
      } else R = !1;
    } else (e.dropItem(...p, { ...S, count: 1 }, shoot(0.2)), take());
    if (R) {
      Sound.ev("block.dispenser.dispense", p, 1, 1);
      for (let t = 0; t < 5; t++)
        e.particles.spawn(
          "smoke",
          p[0],
          p[1],
          p[2],
          0.05 * l[0] + 0.02 * (Math.random() - 0.5),
          0.01,
          0.05 * l[2] + 0.02 * (Math.random() - 0.5),
        );
    } else Sound.ev("block.dispenser.fail", p, 1, 1.2);
  }),
  (RS.craftResult = function (e) {
    const t = e.slots.map((e) => (e ? { id: e.id, count: e.count } : null)),
      o = matchRecipe(t, 3);
    return o ? { id: o.result, count: o.count, dmg: 0 } : null;
  }),
  (RS.craft = function (e, t, o, r, s, n) {
    const i = RS.be(e, t, o, r, "crafter"),
      c = RS.craftResult(i),
      a = String(prop(s, n, "orientation") || "north_up").split("_")[0],
      l = RS_DIRS[a] || RS_DIRS.north,
      u = [t + 0.5 + 0.7 * l[0], o + 0.5 + 0.7 * l[1], r + 0.5 + 0.7 * l[2]];
    if (!c) return void Sound.ev("block.crafter.fail", u, 1, 1);
    for (let e = 0; e < 9; e++) {
      const t = i.slots[e];
      if (!t) continue;
      const o = ITEMS[t.id].key;
      "water_bucket" !== o && "lava_bucket" !== o && "milk_bucket" !== o
        ? (t.count--, t.count || (i.slots[e] = null))
        : (i.slots[e] = makeStack("bucket"));
    }
    const p = RS.container(e, t + l[0], o + l[1], r + l[2]),
      d = p ? RS.insert(p, c, RS_OPP[a]) : c;
    (d && e.dropItem(...u, d, [0.2 * l[0], 0.2 * l[1] + 0.05, 0.2 * l[2]]),
      Sound.ev("block.crafter.craft", u, 1, 1),
      (i.flash = e.tickCount + 6));
  }),
  (RS.hopperTick = function (e, t) {
    const o = e.world,
      [r, s, n] = t.pos;
    if ("hopper" !== rsk(o.getBlock(r, s, n))) return;
    if (t.cd > 0) return void t.cd--;
    const i = RS.memOf(r, s, n);
    if ((void 0 === i.locked && (i.locked = RS.neighborSignal(e, r, s, n)), i.locked)) return;
    const c = o.getBlock(r, s, n),
      a = prop(c, o.getMeta(r, s, n), "facing") || "down",
      l = RS_DIRS[a];
    let u = !1;
    const p = RS.container(e, r + l[0], s + l[1], n + l[2]);
    if (p)
      for (let e = 0; e < 5 && !u; e++) {
        const o = t.slots[e];
        if (!o) continue;
        RS.insert(p, { ...o, count: 1 }, RS_OPP[a]) ||
          (o.count--, o.count || (t.slots[e] = null), (u = !0));
      }
    const d = RS.container(e, r, s, n),
      S = RS.container(e, r, s + 1, n);
    if (S)
      for (let e = 0; e < S.size; e++) {
        const t = S.get(e);
        if (!t || !S.canOut(e, "down")) continue;
        if (!RS.insert(d, { ...t, count: 1 }, "up")) {
          (t.count--, t.count || S.set(e, null), (u = !0));
          break;
        }
      }
    else if (!conductor(o.getBlock(r, s + 1, n)) || "hopper" === rsk(o.getBlock(r, s + 1, n)))
      for (const t of e.entities) {
        if (!(t instanceof ItemEntity) || t.dead) continue;
        if (
          t.pos[0] < r ||
          t.pos[0] > r + 1 ||
          t.pos[2] < n ||
          t.pos[2] > n + 1 ||
          t.pos[1] < s + 0.6 ||
          t.pos[1] > s + 2
        )
          continue;
        const e = RS.insert(d, t.stack, "up");
        if (e) {
          if (e.count === t.stack.count) continue;
          t.stack = e;
        } else t.dead = !0;
        u = !0;
        break;
      }
    u && ((t.cd = 8), RS.wake(r, s, n));
  }),
  (RS.daylight = function (e) {
    const t = e.world,
      o = BID.daylight_detector;
    if (void 0 === o) return;
    const r = e.player,
      s = Math.floor(r.pos[0]) >> 4,
      n = Math.floor(r.pos[2]) >> 4,
      i = Math.min(8, e.renderer ? e.renderer.renderDist : 8),
      c = ((t.time % 24e3) / 24e3 - 0.25 + 1) % 1,
      a = ((2 * c + (0.5 - Math.cos(c * Math.PI) / 2)) / 3) * Math.PI * 2;
    let l = 1 - (2 * Math.cos(a) + 0.5);
    ((l = clamp(l, 0, 1)), (l = 1 - l), (l *= 1 - (5 * (e.weather || 0)) / 16), (l = 1 - l));
    const u = Math.floor(11 * l);
    for (let e = s - i; e <= s + i; e++)
      for (let r = n - i; r <= n + i; r++) {
        const s = t.getChunk(e, r);
        s &&
          s.findAll([o], (s) => {
            const n = 16 * e + (15 & s),
              i = s >> 8,
              c = 16 * r + ((s >> 4) & 15),
              l = t.getMeta(n, i, c);
            let p = t.skyAt(n, i, c) - u;
            if ("true" === prop(o, l, "inverted")) p = 15 - p;
            else if (p > 0) {
              let e = a;
              ((e += 0.2 * ((e < Math.PI ? 0 : 2 * Math.PI) - e)),
                (p = Math.round(p * Math.cos(e))));
            }
            p = clamp(p, 0, 15);
            const d = RS.memOf(n, i, c);
            d.power !== p && ((d.power = p), RS.wake(n, i, c));
          });
      }
  }),
  (RS.refreshComparators = function (e) {
    const t = e.world,
      o = BID.comparator;
    if (void 0 === o) return;
    const r = e.player,
      s = Math.floor(r.pos[0]) >> 4,
      n = Math.floor(r.pos[2]) >> 4,
      i = Math.min(6, e.renderer ? e.renderer.renderDist : 6);
    for (let e = s - i; e <= s + i; e++)
      for (let r = n - i; r <= n + i; r++) {
        const s = t.getChunk(e, r);
        s && s.findAll([o], (t) => RS.enqueue(16 * e + (15 & t), t >> 8, 16 * r + ((t >> 4) & 15)));
      }
  }),
  (Game.prototype.breakRS = function (e, t, o) {
    const r = this.world,
      s = r.getBlock(e, t, o);
    s &&
      (this.dropBlockLoot(e, t, o, s, r.getMeta(e, t, o), null),
      r.setBlock(e, t, o, 0, 0),
      RS.wake(e, t, o));
  }));
const RS_USE = {
  lever(e, t, o, r) {
    const s = e.world.getBlock(t, o, r),
      n = e.world.getMeta(t, o, r),
      i = "true" !== prop(s, n, "powered");
    return (
      RS.set(e, t, o, r, s, Features.withProp(s, n, "powered", i)),
      Sound.ev("block.lever.click", [t + 0.5, o + 0.5, r + 0.5], 0.3, i ? 0.6 : 0.5),
      RS.process(e),
      !0
    );
  },
  button(e, t, o, r) {
    const s = e.world.getBlock(t, o, r),
      n = e.world.getMeta(t, o, r),
      i = rsk(s);
    if ("true" === prop(s, n, "powered")) return !0;
    RS.set(e, t, o, r, s, Features.withProp(s, n, "powered", !0));
    const c = i.startsWith("stone") || i.includes("blackstone");
    return (
      e.world.schedule(t, o, r, c ? 20 : 30),
      Sound.ev(
        c ? "block.stone_button.click_on" : "block.wooden_button.click_on",
        [t + 0.5, o + 0.5, r + 0.5],
        0.3,
        0.6,
      ),
      RS.process(e),
      !0
    );
  },
  repeater(e, t, o, r) {
    const s = e.world.getBlock(t, o, r),
      n = e.world.getMeta(t, o, r),
      i = ((+prop(s, n, "delay") || 1) % 4) + 1;
    return (RS.set(e, t, o, r, s, Features.withProp(s, n, "delay", i)), RS.process(e), !0);
  },
  comparator(e, t, o, r) {
    const s = e.world.getBlock(t, o, r),
      n = e.world.getMeta(t, o, r),
      i = "subtract" !== prop(s, n, "mode");
    return (
      RS.set(e, t, o, r, s, Features.withProp(s, n, "mode", i ? "subtract" : "compare")),
      Sound.ev("block.comparator.click", [t + 0.5, o + 0.5, r + 0.5], 0.3, i ? 0.55 : 0.5),
      e.world.schedule(t, o, r, 2),
      RS.process(e),
      !0
    );
  },
  daylight(e, t, o, r) {
    const s = e.world.getBlock(t, o, r),
      n = e.world.getMeta(t, o, r);
    return (
      RS.set(e, t, o, r, s, Features.withProp(s, n, "inverted", "true" !== prop(s, n, "inverted"))),
      RS.daylight(e),
      RS.process(e),
      !0
    );
  },
  wire(e, t, o, r) {
    const s = e.world,
      n = s.getBlock(t, o, r),
      i = s.getMeta(t, o, r),
      c = isWire(n) && BLOCKS[n].states && BLOCKS[n].states[i];
    if (!c) return !1;
    const a = RS_H.every((e) => "side" === c[e]),
      l = isDotMeta(n, i);
    if (!a && !l) return !1;
    const u = {};
    for (const e of RS_H) u[e] = a ? "none" : "side";
    return (s.setBlock(t, o, r, n, wireMeta(n, u)), RS.wake(t, o, r), RS.process(e), !0);
  },
  container(e, t, o, r) {
    const s = rsk(e.world.getBlock(t, o, r)),
      n = RS.be(e, t, o, r, s);
    return (
      e.ui.open(
        "hopper" === s
          ? new HopperScreen(e, n)
          : "crafter" === s
            ? new CrafterScreen(e, n)
            : new DispenserScreen(e, n, BLOCKS[e.world.getBlock(t, o, r)].cn),
      ),
      !0
    );
  },
};
for (const e of BLOCKS) {
  if (!e) continue;
  const t = e.key;
  "lever" === t
    ? (e.onUse = RS_USE.lever)
    : RS_BUTTON.test(t)
      ? (e.onUse = RS_USE.button)
      : "repeater" === t
        ? (e.onUse = RS_USE.repeater)
        : "comparator" === t
          ? (e.onUse = RS_USE.comparator)
          : "daylight_detector" === t
            ? (e.onUse = RS_USE.daylight)
            : void 0 !== e.wirePower
              ? (e.onUse = RS_USE.wire)
              : /^(hopper|dispenser|dropper|crafter)$/.test(t) && (e.onUse = RS_USE.container);
}
class DispenserScreen extends ContainerScreen {
  constructor(e, t, o) {
    (super(e, "gui_dispenser", 176, 166, o || "发射器"),
      (this.be = t),
      (this.titleX = 88 - Math.floor(Font.width(this.title) / 2)));
    for (let e = 0; e < 9; e++)
      this.slots.push({
        x: 62 + (e % 3) * 18,
        y: 17 + 18 * Math.floor(e / 3),
        group: "container",
        get: () => t.slots[e],
        set: (o) => {
          t.slots[e] = o;
        },
      });
    this.addPlayerSlots(84, 142);
  }
  drawExtra(e) {
    Font.draw(e.ctx, "物品栏", this.x + 8, this.y + 72, "#404040", !1);
  }
}
class HopperScreen extends ContainerScreen {
  constructor(e, t) {
    (super(e, "gui_hopper", 176, 133, "漏斗"), (this.be = t));
    for (let e = 0; e < 5; e++)
      this.slots.push({
        x: 44 + 18 * e,
        y: 20,
        group: "container",
        get: () => t.slots[e],
        set: (o) => {
          t.slots[e] = o;
        },
      });
    this.addPlayerSlots(51, 109);
  }
  drawExtra(e) {
    Font.draw(e.ctx, "物品栏", this.x + 8, this.y + 39, "#404040", !1);
  }
}
class CrafterScreen extends ContainerScreen {
  constructor(e, t) {
    (super(e, "gui_crafter", 176, 166, "合成器"), (this.be = t), (t.disabled = t.disabled || []));
    for (let e = 0; e < 9; e++)
      this.slots.push({
        x: 26 + (e % 3) * 18,
        y: 17 + 18 * Math.floor(e / 3),
        group: "container",
        idx: e,
        accept: () => !t.disabled.includes(e),
        get: () => t.slots[e],
        set: (o) => {
          t.slots[e] = o;
        },
      });
    this.addPlayerSlots(84, 142);
  }
  mouseDown(e, t, o, r, s) {
    const n = this.slotAt(t, o);
    if (n && void 0 !== n.idx && !n.get() && !e.cursor && 0 === r) {
      const e = this.be.disabled,
        t = e.indexOf(n.idx);
      return (t >= 0 ? e.splice(t, 1) : e.push(n.idx), void Sound.click());
    }
    super.mouseDown(e, t, o, r, s);
  }
  drawExtra(e) {
    for (const t of this.slots)
      void 0 !== t.idx &&
        this.be.disabled.includes(t.idx) &&
        e.sprite("crafter_disabled_slot", this.x + t.x - 1, this.y + t.y - 1);
    const t = RS.craftResult(this.be);
    t && e.drawItem(t, this.x + 134, this.y + 35);
    const [o, r, s] = this.be.pos,
      n = this.game.world.getBlock(o, r, s);
    (e.sprite(
      "true" === prop(n, this.game.world.getMeta(o, r, s), "triggered")
        ? "crafter_powered_redstone"
        : "crafter_unpowered_redstone",
      this.x + 97,
      this.y + 34,
    ),
      Font.draw(e.ctx, "物品栏", this.x + 8, this.y + 72, "#404040", !1));
  }
}
const RS_IDS = new Set();
for (const e of BLOCKS)
  e &&
    (rsSource(e.id) ||
      /^(redstone_lamp|piston|sticky_piston|piston_head|tnt|note_block|bell|dispenser|dropper|hopper|crafter|powered_rail|activator_rail|daylight_detector|tripwire|tripwire_hook|target)$|copper_bulb$/.test(
        e.key,
      ) ||
      e.door ||
      e.trapdoor ||
      e.gate) &&
    RS_IDS.add(e.id);
const _rsNeighbor = Game.prototype.onNeighborUpdate;
Game.prototype.onNeighborUpdate = function (e, t, o, r) {
  (_rsNeighbor.call(this, e, t, o, r),
    !this.net &&
      RS_IDS.has(this.world.getBlock(e, t, o)) &&
      (RS.enqueue(e, t, o), RS.process(this)));
};
const _rsChanged = Game.prototype.onBlockChanged;
Game.prototype.onBlockChanged = function (e, t, o, r, s, n) {
  if ((_rsChanged.call(this, e, t, o, r, s, n), this.net || !this.world)) return;
  if ((RS.observe(this, e, t, o), r === s)) return;
  const i = rsk(r),
    c = rsk(s),
    a = this.world;
  if (
    ("piston" === i || "sticky_piston" === i) &&
    "true" === Features.propOf(r, n, "extended") &&
    c !== i
  ) {
    const s = RS_DIRS[Features.propOf(r, n, "facing")];
    s &&
      "piston_head" === rsk(a.getBlock(e + s[0], t + s[1], o + s[2])) &&
      a.setBlock(e + s[0], t + s[1], o + s[2], 0, 0);
  }
  if ("piston_head" === i && c !== i && !RS.busy) {
    const s = RS_DIRS[Features.propOf(r, n, "facing")];
    if (s) {
      const r = e - s[0],
        n = t - s[1],
        i = o - s[2],
        c = a.getBlock(r, n, i);
      /^(sticky_)?piston$/.test(rsk(c)) &&
        "true" === prop(c, a.getMeta(r, n, i), "extended") &&
        (this.breakBlock ? this.breakBlock(r, n, i, !0) : a.setBlock(r, n, i, 0, 0));
    }
  }
  (("hopper" !== c && "dispenser" !== c && "dropper" !== c && "crafter" !== c) ||
    RS.be(this, e, t, o, c),
    (RS_IDS.has(s) ||
      RS_IDS.has(r) ||
      (BLOCKS[r] && void 0 !== BLOCKS[r].wirePower) ||
      isWire(s)) &&
      (RS.wake(e, t, o), RS.process(this)));
};
const _rsSetMeta = World.prototype.setMeta;
((World.prototype.setMeta = function (e, t, o, r) {
  const s = this.getMeta(e, t, o);
  (_rsSetMeta.call(this, e, t, o, r),
    s !== r &&
      this.listener &&
      this.listener.onMetaChanged &&
      this.listener.onMetaChanged(e, t, o));
}),
  (Game.prototype.onMetaChanged = function (e, t, o) {
    this.net || RS.observe(this, e, t, o);
  }));
const _rsFire = Game.prototype.fireTick;
Game.prototype.blockTick = function (e, t, o) {
  if (this.net) return !1;
  const r = RS.tick(this, e, t, o);
  return (RS.process(this), r);
};
const _rsTickScheduled = World.prototype.tickScheduled;
World.prototype.tickScheduled = function () {
  if (!this.ticks.size) return;
  const e = this.listener;
  if (!e || !e.blockTick) return _rsTickScheduled.call(this);
  const t = [];
  for (const [e, o] of this.ticks)
    o.t <= this.time &&
      RS_IDS.has(this.getBlock(o.x, o.y, o.z)) &&
      (t.push(o), this.ticks.delete(e));
  for (const o of t) e.blockTick(o.x, o.y, o.z);
  return _rsTickScheduled.call(this);
};
const _rsGameTick = Game.prototype.tick;
Game.prototype.tick = function () {
  if (
    (_rsGameTick.call(this),
    this.net || "play" !== this.state || !this.world || (this.ui.screen && this.ui.screen.pauses))
  )
    return;
  const e = this.world;
  for (const t of [this.player, ...this.entities]) {
    if (!t || t.dead) continue;
    const o = Math.floor(t.pos[0]),
      r = Math.floor(t.pos[1] + 0.01),
      s = Math.floor(t.pos[2]),
      n = e.getBlock(o, r, s),
      i = rsk(n);
    if (RS_PLATE.test(i)) {
      const t = e.getMeta(o, r, s);
      "true" === prop(n, t, "powered") || +prop(n, t, "power") > 0 || RS.plateCheck(this, o, r, s);
    } else if ("tripwire" === i) {
      !1 || RS.tripCheck(this, o, r, s);
    } else
      "detector_rail" === i &&
        t instanceof Minecart &&
        "true" !== prop(n, e.getMeta(o, r, s), "powered") &&
        RS.detectorCheck(this, o, r, s);
  }
  for (const t of this.blockEntities.values())
    "hopper" === t.type && e.isLoaded(t.pos[0], t.pos[2]) && RS.hopperTick(this, t);
  (this.tickCount % 20 == 0 && RS.daylight(this),
    this.tickCount % 10 == 5 && RS.refreshComparators(this),
    RS.process(this));
};
const _rsPlaceState = Game.prototype.placeState;
((Game.prototype.placeState = function (e, t, o) {
  let r = _rsPlaceState.call(this, e, t, o);
  const s = e.key;
  if ("observer" === s) {
    const t = this.lookDir(),
      o = Math.abs(t[0]),
      s = Math.abs(t[1]),
      n = Math.abs(t[2]);
    r = Features.withProp(
      e.id,
      r,
      "facing",
      s > o && s > n
        ? t[1] > 0
          ? "up"
          : "down"
        : o > n
          ? t[0] > 0
            ? "east"
            : "west"
          : t[2] > 0
            ? "south"
            : "north",
    );
  }
  return (
    "tripwire_hook" === s &&
      2 !== t.face &&
      3 !== t.face &&
      (r = Features.withProp(e.id, r, "facing", FACE_NAME[t.face])),
    ("redstone_torch" !== s && "redstone_wall_torch" !== s) ||
      (r = Features.withProp(e.id, r, "lit", !0)),
    "hopper" === s &&
      (r = Features.withProp(
        e.id,
        r,
        "facing",
        3 === t.face || 2 === t.face ? "down" : FACE_NAME[[1, 0, 2, 3, 5, 4][t.face]],
      )),
    r
  );
}),
  (RS.settleChunk = function (e, t) {
    const o = [...RS_IDS].filter((e) => {
      const t = rsk(e);
      return /^(redstone_torch|redstone_wall_torch|repeater|comparator|observer|redstone_lamp|piston|sticky_piston|hopper)$/.test(
        t,
      );
    });
    t.findAll(o, (e) => RS.enqueue(16 * t.cx + (15 & e), e >> 8, 16 * t.cz + ((e >> 4) & 15)));
  }));
const _rsArrowTick = Arrow.prototype.tick;
Arrow.prototype.tick = function () {
  const e = this.stuck;
  (_rsArrowTick.call(this),
    !e &&
      this.stuck &&
      this.stuckAt &&
      !this.game.net &&
      "target" === rsk(this.game.world.getBlock(...this.stuckAt)) &&
      RS.targetHit(this.game, ...this.stuckAt, this.pos, !0));
};
const _rsChestOpen = ChestScreen.prototype.close;
ChestScreen.prototype.close = function () {
  _rsChestOpen.call(this);
  for (const e of this.bes || []) {
    const [t, o, r] = e.pos;
    "trapped_chest" === rsk(this.game.world.getBlock(t, o, r)) &&
      (RS.wake(t, o, r), RS.process(this.game));
  }
};
const _rsOpenUI = UI.prototype.open;
UI.prototype.open = function (e) {
  const t = _rsOpenUI.call(this, e),
    o = this.game;
  if (e instanceof ChestScreen && !o.net)
    for (const t of e.bes || []) {
      const [e, r, s] = t.pos;
      "trapped_chest" === rsk(o.world.getBlock(e, r, s)) && (RS.wake(e, r, s), RS.process(o));
    }
  return t;
};
//# sourceURL=js/redstone.js
