"use strict";
const Sound = {
    ctx: null,
    master: null,
    sfx: null,
    noiseBuf: null,
    volume: 0.8,
    listener: { x: 0, y: 0, z: 0, yaw: 0 },
    init() {
      if (this.ctx)
        return void (this.idle ? this.wake() : "suspended" === this.ctx.state && this.ctx.resume());
      try {
        if (navigator.audioSession) navigator.audioSession.type = "playback";
        else if (
          /iPhone|iPad|iPod/.test(navigator.userAgent) ||
          (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
        ) {
          const e = (this.unmute = document.createElement("audio"));
          (e.setAttribute("x-webkit-airplay", "deny"),
            (e.preload = "auto"),
            (e.loop = !0),
            (e.src =
              "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAAA"));
          const t = e.play();
          t && t.catch && t.catch(() => {});
        }
      } catch (e) {}
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return;
      }
      const e = this.ctx;
      ((this.master = e.createGain()),
        (this.master.gain.value = 1),
        this.master.connect(e.destination),
        (this.sfx = e.createGain()),
        (this.sfx.gain.value = this.volume),
        this.sfx.connect(this.master));
      const t = 2 * e.sampleRate;
      this.noiseBuf = e.createBuffer(1, t, e.sampleRate);
      const n = this.noiseBuf.getChannelData(0);
      for (let e = 0; e < t; e++) n[e] = 2 * Math.random() - 1;
      (this.packReady && this.predecode && this.predecode(), this.watch());
    },
    setVolume(e) {
      ((this.volume = e), this.sfx && (this.sfx.gain.value = e));
    },
    out(e, t = 1) {
      const n = this.ctx,
        s = n.createGain();
      let r = t;
      if (e) {
        const t = this.listener,
          o = e[0] - t.x,
          i = e[1] - t.y,
          a = e[2] - t.z,
          l = Math.hypot(o, i, a);
        if (((r *= Math.max(0, 1 - l / 20)), r <= 0.001)) return null;
        if (n.createStereoPanner) {
          const e = n.createStereoPanner(),
            r = o * Math.cos(t.yaw) - a * Math.sin(t.yaw);
          ((e.pan.value = 0.7 * clamp(r / (l + 0.5), -1, 1)), s.connect(e), e.connect(this.sfx));
        } else s.connect(this.sfx);
      } else s.connect(this.sfx);
      return ((s.gain.value = r), s);
    },
    noise(
      e,
      {
        dur: t = 0.15,
        vol: n = 0.5,
        type: s = "bandpass",
        freq: r = 1e3,
        q: o = 1,
        freqEnd: i,
        attack: a = 0.005,
        delay: l = 0,
      },
    ) {
      if (!this.ctx || this.idle) return;
      const c = this.ctx,
        h = this.out(e, n);
      if (!h) return;
      const u = c.currentTime + l,
        d = c.createBufferSource();
      ((d.buffer = this.noiseBuf), (d.playbackRate.value = 0.8 + 0.4 * Math.random()));
      const f = c.createBiquadFilter();
      ((f.type = s),
        f.frequency.setValueAtTime(r, u),
        (f.Q.value = o),
        i && f.frequency.exponentialRampToValueAtTime(i, u + t));
      const p = c.createGain();
      (p.gain.setValueAtTime(0, u),
        p.gain.linearRampToValueAtTime(1, u + a),
        p.gain.exponentialRampToValueAtTime(0.001, u + t),
        d.connect(f),
        f.connect(p),
        p.connect(h),
        d.start(u, 1.5 * Math.random()),
        d.stop(u + t + 0.05));
    },
    tone(
      e,
      {
        freq: t = 440,
        freqEnd: n,
        dur: s = 0.2,
        vol: r = 0.3,
        type: o = "sine",
        attack: i = 0.01,
        delay: a = 0,
        dest: l,
      },
    ) {
      if (!this.ctx || this.idle) return;
      const c = this.ctx,
        h = l || this.out(e, r);
      if (!h) return;
      const u = c.currentTime + a,
        d = c.createOscillator();
      ((d.type = o),
        d.frequency.setValueAtTime(t, u),
        n && d.frequency.exponentialRampToValueAtTime(n, u + s));
      const f = c.createGain();
      (f.gain.setValueAtTime(0, u),
        f.gain.linearRampToValueAtTime(l ? r : 1, u + i),
        f.gain.exponentialRampToValueAtTime(0.001, u + s),
        d.connect(f),
        f.connect(h),
        d.start(u),
        d.stop(u + s + 0.05));
    },
    MAT: {
      stone: { freq: 900, q: 0.8, dur: 0.12, type: "bandpass" },
      wood: { freq: 450, q: 2.5, dur: 0.13, type: "bandpass" },
      grass: { freq: 2400, q: 0.5, dur: 0.14, type: "highpass" },
      gravel: { freq: 1300, q: 0.6, dur: 0.16, type: "bandpass" },
      sand: { freq: 3e3, q: 0.4, dur: 0.16, type: "highpass" },
      snow: { freq: 3500, q: 0.4, dur: 0.18, type: "highpass" },
      glass: { freq: 3500, q: 3, dur: 0.1, type: "bandpass" },
      wool: { freq: 600, q: 0.4, dur: 0.15, type: "lowpass" },
      metal: { freq: 2e3, q: 6, dur: 0.15, type: "bandpass" },
    },
    block(e, t, n) {
      if (!this.ctx) return;
      const s = this.MAT[t] || this.MAT.stone;
      if ("step" === e) this.noise(n, { ...s, vol: 0.18, dur: 0.8 * s.dur });
      else if ("hit" === e) this.noise(n, { ...s, vol: 0.22, dur: 0.6 * s.dur });
      else if ("place" === e)
        (this.noise(n, { ...s, vol: 0.55, freq: 0.8 * s.freq }),
          "wood" === t &&
            this.tone(n, { freq: 180, freqEnd: 120, dur: 0.08, vol: 0.25, type: "triangle" }));
      else if (
        "break" === e &&
        (this.noise(n, { ...s, vol: 0.7, dur: 1.6 * s.dur }),
        this.noise(n, { ...s, vol: 0.4, dur: 1.2 * s.dur, delay: 0.04, freq: 0.7 * s.freq }),
        "glass" === t)
      )
        for (let e = 0; e < 4; e++)
          this.tone(n, {
            freq: 2e3 + 3e3 * Math.random(),
            dur: 0.15,
            vol: 0.12,
            delay: 0.03 * e,
            type: "sine",
          });
    },
    pop(e) {
      this.tone(e, {
        freq: 600 + 300 * Math.random(),
        freqEnd: 1400 + 300 * Math.random(),
        dur: 0.08,
        vol: 0.25,
        type: "sine",
      });
    },
    click() {
      this.tone(null, { freq: 800, freqEnd: 500, dur: 0.05, vol: 0.25, type: "square" });
    },
    hurt(e) {
      (this.tone(e, { freq: 330, freqEnd: 180, dur: 0.18, vol: 0.4, type: "sawtooth" }),
        this.noise(e, { freq: 600, dur: 0.12, vol: 0.3, type: "lowpass" }));
    },
    explode(e) {
      (this.noise(e, { type: "lowpass", freq: 1500, freqEnd: 60, dur: 1.8, vol: 1.2, q: 0.5 }),
        this.noise(e, { type: "lowpass", freq: 300, freqEnd: 40, dur: 2.5, vol: 1, q: 0.3 }));
    },
    fuse(e) {
      this.noise(e, { type: "highpass", freq: 4e3, dur: 1.2, vol: 0.4, attack: 0.05 });
    },
    fizz(e) {
      this.noise(e, { type: "highpass", freq: 3e3, dur: 0.5, vol: 0.4 });
    },
    splash(e) {
      this.noise(e, { type: "lowpass", freq: 2e3, freqEnd: 300, dur: 0.5, vol: 0.5 });
    },
    eat(e) {
      this.noise(e, {
        type: "bandpass",
        freq: 900 + 400 * Math.random(),
        q: 1.5,
        dur: 0.1,
        vol: 0.45,
      });
    },
    burp(e) {
      this.tone(e, { freq: 120, freqEnd: 80, dur: 0.3, vol: 0.4, type: "sawtooth" });
    },
    bow(e) {
      (this.tone(e, { freq: 300, freqEnd: 900, dur: 0.15, vol: 0.3, type: "triangle" }),
        this.noise(e, { freq: 2e3, dur: 0.15, vol: 0.2 }));
    },
    arrowHit(e) {
      this.noise(e, { freq: 800, dur: 0.08, vol: 0.4, q: 2 });
    },
    door(e, t) {
      (this.tone(e, {
        freq: t ? 200 : 160,
        freqEnd: t ? 140 : 100,
        dur: 0.18,
        vol: 0.4,
        type: "triangle",
      }),
        this.noise(e, { freq: 500, q: 3, dur: 0.15, vol: 0.3 }));
    },
    levelup() {
      [0, 4, 7, 12].forEach((e, t) =>
        this.tone(null, {
          freq: 523 * Math.pow(2, e / 12),
          dur: 0.35,
          vol: 0.18,
          type: "triangle",
          delay: 0.09 * t,
        }),
      );
    },
    toast() {
      [0, 7].forEach((e, t) =>
        this.tone(null, {
          freq: 880 * Math.pow(2, e / 12),
          dur: 0.3,
          vol: 0.15,
          type: "sine",
          delay: 0.12 * t,
        }),
      );
    },
    note(e, t) {
      this.tone(e, { freq: 185 * Math.pow(2, t / 12), dur: 0.8, vol: 0.4, type: "triangle" });
    },
    mob(e, t, n) {
      if (!this.ctx) return;
      const s = Math.random();
      switch (e) {
        case "pig":
          (this.tone(n, {
            freq: 260 + 60 * s,
            freqEnd: 180,
            dur: 0.25,
            vol: 0.35,
            type: "sawtooth",
          }),
            this.tone(n, {
              freq: 240,
              freqEnd: 160,
              dur: 0.2,
              vol: 0.25,
              type: "square",
              delay: 0.15,
            }));
          break;
        case "cow":
          this.tone(n, {
            freq: 140 + 20 * s,
            freqEnd: 110,
            dur: 0.9,
            vol: 0.4,
            type: "sawtooth",
            attack: 0.1,
          });
          break;
        case "sheep":
          for (let e = 0; e < 4; e++)
            this.tone(n, {
              freq: 420 + 50 * s,
              freqEnd: 400,
              dur: 0.12,
              vol: 0.25,
              type: "sawtooth",
              delay: 0.1 * e,
            });
          break;
        case "chicken":
          for (let e = 0; e < 2; e++)
            this.tone(n, {
              freq: 1100 + 300 * s,
              freqEnd: 700,
              dur: 0.08,
              vol: 0.2,
              type: "square",
              delay: 0.12 * e,
            });
          break;
        case "zombie":
          (this.tone(n, {
            freq: 110 + 30 * s,
            freqEnd: 80,
            dur: 0.9,
            vol: 0.45,
            type: "sawtooth",
            attack: 0.15,
          }),
            this.noise(n, { freq: 300, dur: 0.8, vol: 0.2, type: "lowpass", attack: 0.1 }));
          break;
        case "skeleton":
          for (let e = 0; e < 4; e++)
            this.noise(n, { freq: 2500, q: 5, dur: 0.05, vol: 0.35, delay: 0.07 * e });
          break;
        case "creeper":
          this.fuse(n);
          break;
        case "spider":
          (this.noise(n, { freq: 1200, q: 4, dur: 0.3, vol: 0.3 }),
            this.tone(n, { freq: 90, dur: 0.3, vol: 0.2, type: "sawtooth" }));
      }
      "hurt" === t &&
        this.tone(n, { freq: 500, freqEnd: 250, dur: 0.12, vol: 0.2, type: "square" });
    },
  },
  SOUND_CACHE_BYTES = 32 << 20;
(Object.assign(Sound, {
  buffers: new Map(),
  pending: new Map(),
  packReady: !1,
  cacheBytes: 0,
  raw: new Map(),
  prefetch(e) {
    if (window.fetch)
      for (const t of e)
        this.raw.has(t) ||
          this.buffers.has(t) ||
          this.raw.set(
            t,
            fetch("sounds/sfx/" + t + this.ext)
              .then((e) => (e.ok ? e.arrayBuffer() : null))
              .catch(() => null),
          );
  },
  ext: ".m4a",
  loadPack() {
    if (window.SOUNDS) return ((this.packReady = !0), void this.predecode());
    const e = "file:" === location.protocol,
      t = document.createElement("script");
    ((t.src = e ? "js/sounds.js" : "js/sound_events.js"),
      (t.onload = () => {
        (!e && window.SOUND_EVENTS && (window.SOUNDS = { events: SOUND_EVENTS, files: null }),
          (this.packReady = !!window.SOUNDS),
          this.predecode());
      }),
      document.head.appendChild(t));
  },
  cached(e) {
    const t = this.buffers.get(e);
    return (t && (this.buffers.delete(e), this.buffers.set(e, t)), t);
  },
  remember(e, t) {
    (this.buffers.set(e, t), (this.cacheBytes += t.length * t.numberOfChannels * 4));
    for (const [e, t] of this.buffers) {
      if (this.cacheBytes <= 33554432) break;
      (this.buffers.delete(e), (this.cacheBytes -= t.length * t.numberOfChannels * 4));
    }
  },
  decode(e) {
    const t = this.cached(e);
    if (t) return Promise.resolve(t);
    if (this.pending.has(e)) return this.pending.get(e);
    if (!window.SOUNDS || !this.ctx) return Promise.resolve(null);
    let n;
    if (SOUNDS.files) {
      const t = SOUNDS.files[e];
      if (!t) return Promise.resolve(null);
      const s = atob(t),
        r = new Uint8Array(s.length);
      for (let e = 0; e < s.length; e++) r[e] = s.charCodeAt(e);
      n = Promise.resolve(r.buffer);
    } else
      n =
        this.raw.has(e) && !this.switched
          ? this.raw.get(e).then((e) => (e ? e.slice(0) : null))
          : fetch("sounds/sfx/" + e + this.ext).then((e) => (e.ok ? e.arrayBuffer() : null));
    const dec = (e) => e && new Promise((t) => this.ctx.decodeAudioData(e, t, () => t(null)));
    let s = !1;
    const r = n
      .then((e) => ((s = !!e), dec(e)))
      .catch(() => null)
      .then((t) =>
        t || !s || SOUNDS.files || this.switched
          ? t
          : ((this.switched = !0),
            (this.ext = ".m4a" === this.ext ? ".ogg" : ".m4a"),
            fetch("sounds/sfx/" + e + this.ext)
              .then((e) => (e.ok ? e.arrayBuffer() : null))
              .then(dec)
              .catch(() => null)),
      )
      .then((t) => (this.pending.delete(e), t && this.remember(e, t), t));
    return (this.pending.set(e, r), r);
  },
  async predecode() {
    if (!this.ctx || !this.packReady || this._predecoding) return;
    this._predecoding = !0;
    const e = new Set();
    for (const t in SOUNDS.events)
      if (
        /^(block\.(stone|grass|wood|gravel|sand|dirt|deepslate)\.(step|break|place|hit)|entity\.player\.(hurt|attack\.\w+)|entity\.generic\.eat|ui\.button\.click|entity\.item\.pickup)$/.test(
          t,
        )
      )
        for (const n of SOUNDS.events[t]) e.add(n.name);
    const t = [...e];
    for (let e = 0; e < t.length; e += 8)
      await Promise.all(t.slice(e, e + 8).map((e) => this.decode(e)));
  },
  ev(e, t, n = 1, s = 1) {
    if (!this.ctx || !this.packReady) return !1;
    const r = SOUNDS.events[e];
    if (!r || !r.length) return !1;
    if (this.idle) return !0;
    this.onPlay && this.onPlay(e, t, n);
    let o = 0;
    for (const e of r) o += e.weight || 1;
    let i = Math.random() * o,
      a = r[0];
    for (const e of r)
      if (((i -= e.weight || 1), i <= 0)) {
        a = e;
        break;
      }
    const play = (e) => {
        if (!e) return;
        const r = this.out(t, Math.min(1, n * (a.volume ?? 1)), Math.max(16, 16 * n));
        if (!r) return;
        const o = this.ctx.createBufferSource();
        ((o.buffer = e),
          (o.playbackRate.value = clamp(s * (a.pitch ?? 1), 0.5, 2)),
          o.connect(r),
          o.start());
      },
      l = this.cached(a.name);
    if (l) play(l);
    else {
      const e = performance.now();
      this.decode(a.name).then((t) => {
        performance.now() - e < 400 && play(t);
      });
    }
    return !0;
  },
  rr: () => Math.random() - Math.random(),
}),
  (Sound.out = function (e, t = 1, n = 20) {
    const s = this.ctx,
      r = s.createGain();
    let o = t;
    if (e) {
      const t = this.listener,
        i = e[0] - t.x,
        a = e[1] - t.y,
        l = e[2] - t.z,
        c = Math.hypot(i, a, l);
      if (((o *= Math.max(0, 1 - c / n)), o <= 0.001)) return null;
      if (s.createStereoPanner) {
        const e = s.createStereoPanner(),
          n = i * Math.cos(t.yaw) - l * Math.sin(t.yaw);
        ((e.pan.value = 0.7 * clamp(n / (c + 0.5), -1, 1)), r.connect(e), e.connect(this.sfx));
      } else r.connect(this.sfx);
    } else r.connect(this.sfx);
    return ((r.gain.value = o), r);
  }));
const ARMOR_EQUIP = {
  leather: "leather",
  chainmail: "chain",
  iron: "iron",
  golden: "gold",
  diamond: "diamond",
  netherite: "netherite",
  copper: "copper",
};
function armorEquipSound(e) {
  if ("elytra" === e) return "item.armor.equip_elytra";
  if ("turtle_helmet" === e) return "item.armor.equip_turtle";
  const t = /^([a-z]+)_(helmet|chestplate|leggings|boots)$/.exec(e);
  return "item.armor.equip_" + ((t && ARMOR_EQUIP[t[1]]) || "generic");
}
((Sound.loops = new Set()),
  (Sound.loop = function (e) {
    const t = this,
      n = { update() {}, stop() {} },
      s = window.SOUNDS && SOUNDS.events[e];
    if (!t.ctx || !t.packReady || !s || !s.length || t.idle) return n;
    const r = s[0],
      o = t.ctx,
      i = o.createGain(),
      a = o.createStereoPanner ? o.createStereoPanner() : null;
    ((i.gain.value = 0), a ? (i.connect(a), a.connect(t.sfx)) : i.connect(t.sfx));
    let l = null,
      c = !1,
      h = performance.now(),
      u = 1;
    return (
      t.decode(r.name).then((e) => {
        e &&
          !c &&
          ((l = o.createBufferSource()),
          (l.buffer = e),
          (l.loop = !0),
          (l.playbackRate.value = u),
          l.connect(i),
          l.start());
      }),
      (n.update = (e, n, s) => {
        h = performance.now();
        let c = n * (r.volume ?? 1),
          d = 0;
        if (e) {
          const n = t.listener,
            s = e[0] - n.x,
            r = e[1] - n.y,
            o = e[2] - n.z,
            i = Math.hypot(s, r, o);
          ((c *= Math.max(0, 1 - i / 16)),
            (d = 0.7 * clamp((s * Math.cos(n.yaw) - o * Math.sin(n.yaw)) / (i + 0.5), -1, 1)));
        }
        (i.gain.setTargetAtTime(c, o.currentTime, 0.05),
          a && (a.pan.value = d),
          (u = clamp(s * (r.pitch ?? 1), 0.5, 2)),
          l && (l.playbackRate.value = u));
      }),
      (n.live = !0),
      (n.stop = () => {
        if (!c) {
          if (((c = !0), (n.live = !1), t.loops.delete(n), l))
            try {
              l.stop();
            } catch (e) {}
          i.disconnect();
        }
      }),
      (n.stale = () => performance.now() - h > 500),
      t.loops.add(n),
      t.loopSweep ||
        (t.loopSweep = setInterval(() => {
          for (const e of t.loops) e.stale() && e.stop();
          t.loops.size || (clearInterval(t.loopSweep), (t.loopSweep = 0));
        }, 250)),
      n
    );
  }),
  Object.assign(Sound, {
    idle: null,
    pauseT: 0,
    sleep(e) {
      if (!this.idle && this.ctx) {
        this.idle = e;
        try {
          this.ctx.suspend().catch(() => {});
        } catch (e) {}
      }
    },
    wake() {
      if (this.idle) {
        ((this.idle = null), (this.pauseT = performance.now()));
        try {
          this.ctx.resume().catch(() => {});
        } catch (e) {}
      }
    },
    watch() {
      (document.addEventListener("visibilitychange", () => {
        document.hidden ? this.sleep("hidden") : "hidden" === this.idle && this.wake();
      }),
        setInterval(() => {
          const e = "undefined" != typeof game && game,
            t = e && e.ui && e.ui.screen,
            n = performance.now();
          if (!(e && "play" === e.state && t && t.pauses) || e.net || e.p2pHost || e.p2pGuest)
            return ((this.pauseT = n), void ("pause" === this.idle && this.wake()));
          !this.idle && !this.loops.size && n - this.pauseT > 5e3 && this.sleep("pause");
        }, 1e3));
    },
  }),
  (() => {
    const e = Sound,
      wrap = (t, n) => {
        const s = e[t];
        e[t] = function (...e) {
          if (!1 === n.apply(this, e)) return s.apply(this, e);
        };
      },
      t = {
        stone: "stone",
        wood: "wood",
        grass: "grass",
        gravel: "gravel",
        sand: "sand",
        snow: "snow",
        glass: "glass",
        wool: "wool",
        metal: "metal",
        netherrack: "netherrack",
        nether_bricks: "nether_bricks",
        soul_sand: "soul_sand",
        hard_crop: "wood",
        glow_lichen: "vine",
        lily_pad: "big_dripleaf",
        fire: "wool",
        beehive: "wood",
      };
    (wrap("block", function (e, n, s) {
      if ("lily_pad" === n && "place" === e) return this.ev("block.lily_pad.place", s, 1, 0.8);
      const r =
          t[n] ||
          (window.SOUNDS && SOUNDS.events["block." + n + "." + e]
            ? n
            : /grass|moss|leaves|sapling|vine|lichen|berry|dripleaf|roots|azalea|blossom|petals|litter|flower|lily|crop|fungus|sprouts/.test(
                  n,
                )
              ? "grass"
              : /wood|stem|bamboo|beehive/.test(n)
                ? "wood"
                : "stone"),
        o = {
          break: [1, 0.8],
          step: [0.15, 1],
          place: [1, 0.8],
          hit: [0.25, 0.5],
          fall: [0.5, 0.75],
        }[e] || [1, 1];
      return this.ev("block." + r + "." + e, s, o[0], o[1]);
    }),
      wrap("pop", function (e) {
        return this.ev("entity.item.pickup", e, 0.2, 2 * (0.7 * this.rr() + 1));
      }),
      wrap("click", function () {
        return this.ev("ui.button.click", null, 0.25, 1);
      }),
      wrap("hurt", function (e) {
        return this.ev("entity.player.hurt", e, 1, 1 + 0.2 * this.rr());
      }),
      wrap("explode", function (e) {
        return this.ev("entity.generic.explode", e, 4, 0.7 * (1 + 0.2 * this.rr()));
      }),
      wrap("fuse", function (e) {
        return this.ev("entity.tnt.primed", e, 1, 1);
      }),
      wrap("fizz", function (e) {
        return this.ev("block.lava.extinguish", e, 0.5, 2.6 + 0.8 * this.rr());
      }),
      wrap("splash", function (e) {
        return this.ev("entity.player.splash", e, 0.6, 1 + 0.4 * this.rr());
      }),
      wrap("eat", function (e) {
        return this.ev("entity.generic.eat", e, 0.5, 1 + 0.4 * this.rr());
      }),
      wrap("burp", function (e) {
        return this.ev("entity.player.burp", e, 0.5, 0.1 * Math.random() + 0.9);
      }),
      wrap("bow", function (e) {
        return this.ev("entity.arrow.shoot", e, 1, 1 / (0.4 * Math.random() + 1.2) + 0.5);
      }),
      wrap("arrowHit", function (e) {
        return this.ev("entity.arrow.hit", e, 1, 1.2 / (0.2 * Math.random() + 0.9));
      }),
      wrap("door", function (e, t, n) {
        const s = n || "",
          r = /trapdoor$/.test(s) ? "trapdoor" : /fence_gate$/.test(s) ? "fence_gate" : "door",
          o = /^iron_/.test(s)
            ? "iron"
            : /copper/.test(s)
              ? "copper"
              : /^cherry_/.test(s)
                ? "cherry_wood"
                : /^bamboo_/.test(s)
                  ? "bamboo_wood"
                  : /^(crimson|warped)_/.test(s)
                    ? "nether_wood"
                    : "",
          i = o ? o + "_" + r : "fence_gate" === r ? "fence_gate" : "wooden_" + r;
        return this.ev("block." + i + (t ? ".open" : ".close"), e, 1, 0.1 * Math.random() + 0.9);
      }),
      wrap("levelup", function () {
        return this.ev("entity.player.levelup", null, 0.75, 1);
      }),
      wrap("toast", function () {
        return this.ev("ui.toast.in", null, 1, 1);
      }),
      wrap("note", function (e, t) {
        return this.ev("block.note_block.harp", e, 3, Math.pow(2, (t - 12) / 12));
      }));
    const n = {
        trader_llama: "llama",
        mooshroom: "cow",
        cave_spider: "spider",
        giant: "zombie",
        pufferfish: "puffer_fish",
      },
      s = {
        sniffer: "idle",
        turtle: "ambient_land",
        axolotl: "idle_air",
        allay: "ambient_without_item",
        breeze: "idle_ground",
      };
    (wrap("mob", function (e, t, r) {
      if ("creeper" === e && "idle" === t) return !0;
      const o = "idle" === t ? s[e] || "ambient" : t,
        i = "ghast" === (e = n[e] || e) || "ender_dragon" === e ? 5 : 1;
      return this.ev("entity." + e + "." + o, r, i, 1 + 0.2 * this.rr());
    }),
      (e.warmMob = function (e) {
        if (!this.ctx || !this.packReady || (this._warmed || (this._warmed = new Set())).has(e))
          return;
        this._warmed.add(e);
        const t = new RegExp("^entity\\." + (n[e] || e) + "\\.(ambient\\w*|idle\\w*|hurt|death)$"),
          s = [];
        for (const e in SOUNDS.events)
          if (t.test(e)) for (const t of SOUNDS.events[e]) s.push(t.name);
        (async () => {
          for (let e = 0; e < s.length; e += 4)
            await Promise.all(s.slice(e, e + 4).map((e) => this.decode(e)));
        })();
      }),
      (e.xp = function () {
        this.ev("entity.experience_orb.pickup", null, 0.1, 0.5 + 0.9 * Math.random()) ||
          this.tone(null, { freq: 1200 + 400 * Math.random(), dur: 0.12, vol: 0.12, type: "sine" });
      }),
      (e.chest = function (e, t) {
        this.ev(t ? "block.chest.open" : "block.chest.close", e, 0.5, 0.1 * Math.random() + 0.9) ||
          this.door(e, t);
      }));
  })());
//# sourceURL=js/audio.js
