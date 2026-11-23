"use strict";
const TELEMETRY_V = 1,
  GAME_BUILD = "2026.11.14a",
  Telemetry = {
    g: null,
    sid: Math.random().toString(36).slice(2, 10),
    seq: 0,
    t0: performance.now(),
    hist: new Uint16Array(201),
    frames: 0,
    sum: { cpu: 0, chunk: 0, render: 0, gpu: 0, gpuN: 0 },
    minuteAt: 0,
    playMs: 0,
    afkMs: 0,
    points: [],
    stalls: [],
    errors: new Map(),
    counts: {},
    events: [],
    rtt: [],
    lastFlush: performance.now(),
    pings: new Map(),
    pingSeq: 0,
    lastPing: 0,
    prevState: null,
    loadStart: 0,
    base: () => ("undefined" != typeof RoomService ? RoomService.base() : ""),
    on() {
      const t = this.g;
      if (
        !t ||
        !1 === t.settings.telemetry ||
        ("undefined" != typeof Live && !1 === Live.get("client.telemetry", !0)) ||
        !/^https?:$/.test(location.protocol) ||
        !this.base()
      )
        return !1;
      return (
        !(
          /^(localhost|127\.|\[::1\]|192\.168\.|10\.)/.test(location.hostname) ||
          /\.(localhost|test)$/.test(location.hostname)
        ) || new URLSearchParams(location.search).has("rooms")
      );
    },
    install() {
      if (this._id) return this._id;
      let t = null,
        e = !1;
      try {
        ((t = localStorage.getItem("mcjs-tid")),
          t ||
            ((t = [...crypto.getRandomValues(new Uint8Array(8))]
              .map((t) => t.toString(16).padStart(2, "0"))
              .join("")),
            localStorage.setItem("mcjs-tid", t),
            (e = !0)));
      } catch (e) {
        t = "nostore-" + this.sid;
      }
      return ((this._fresh = e), (this._id = t));
    },
    device() {
      const t = this.g,
        e = navigator.userAgent,
        s = /Edg\//.test(e)
          ? "edge"
          : /OPR\//.test(e)
            ? "opera"
            : /Firefox\//.test(e)
              ? "firefox"
              : /Chrome\//.test(e)
                ? "chrome"
                : /Safari\//.test(e)
                  ? "safari"
                  : "other",
        n = /Android/.test(e)
          ? "android"
          : /iPhone|iPad|iPod/.test(e)
            ? "ios"
            : /Windows/.test(e)
              ? "windows"
              : /Mac OS/.test(e)
                ? "mac"
                : /Linux/.test(e)
                  ? "linux"
                  : "other";
      let i = "";
      try {
        i = PerfMon.gpuName(t.renderer.gl);
      } catch (t) {}
      return {
        gpu: String(i).slice(0, 120),
        cores: navigator.hardwareConcurrency || 0,
        mem: navigator.deviceMemory || 0,
        sw: screen.width,
        sh: screen.height,
        dpr: Math.round(100 * (window.devicePixelRatio || 1)) / 100,
        hz: t.pacer ? Math.round(1e3 / t.pacer.refresh) : 0,
        browser: s,
        bver: (e.match(/(?:Chrome|Firefox|Version)\/(\d+)/) || [])[1] || "",
        os: n,
        touch: "undefined" != typeof TouchDevice ? TouchDevice.kind : "",
        bili: /BiliApp|bili-/i.test(e),
        lang: navigator.language || "",
      };
    },
    count(t, e = 1) {
      (Object.keys(this.counts).length < 300 || void 0 !== this.counts[t]) &&
        (this.counts[t] = (this.counts[t] || 0) + e);
    },
    event(t, e) {
      this.events.length < 200 &&
        this.events.push({ t: Math.round((performance.now() - this.t0) / 1e3), type: t, ...e });
    },
    error(t, e, s) {
      const n = (
          (
            String(s || "")
              .split("\n")
              .map((t) => t.trim())
              .find((t) => /\.js:\d+/.test(t)) || ""
          ).match(/([\w.-]+\.js):(\d+)/) || []
        )
          .slice(1, 3)
          .join(":"),
        i =
          (t ? t + ": " : "") +
          String(e || "")
            .replace(/https?:\/\/\S+/g, "<url>")
            .slice(0, 200) +
          (n ? " @" + n : ""),
        r = this.errors.get(i);
      r
        ? r.n++
        : this.errors.size < 50 &&
          this.errors.set(i, { n: 1, first: Math.round((performance.now() - this.t0) / 1e3) });
    },
    frame(t, e, s, n) {
      const i = this.g;
      i &&
        (i.state !== this.prevState && this.stateChanged(this.prevState, i.state),
        document.hidden
          ? (this.away = !0)
          : this.away || t > 1e4
            ? (this.away = !1)
            : "play" !== i.state ||
              (i.ui.screen && i.ui.screen.pauses) ||
              (i.pacer && i.pacer.cappedFrame
                ? (this.afkMs += t)
                : (this.hist[Math.min(200, 0 | t)]++,
                  this.frames++,
                  (this.playMs += t),
                  (this.sum.cpu += e),
                  (this.sum.chunk += s),
                  (this.sum.render += n),
                  PerfMon.gpuOn &&
                    null != PerfMon.lastGpu &&
                    ((this.sum.gpu += PerfMon.lastGpu), this.sum.gpuN++),
                  t > 100 &&
                    this.stalls.length < 100 &&
                    this.stalls.push({
                      t: Math.round((performance.now() - this.t0) / 1e3),
                      ms: Math.round(t),
                      cpu: Math.round(e),
                      chunk: Math.round(s),
                      ents: i.entities ? i.entities.length : 0,
                      dim: i.dim,
                      net: !!i.net,
                      screen: i.ui.screen ? i.ui.screen.constructor.name : "",
                    }),
                  this.playMs - this.minuteAt >= 6e4 &&
                    ((this.minuteAt = this.playMs), this.point()))));
    },
    stateChanged(t, e) {
      const s = performance.now();
      ((this.prevState = e),
        Crumbs.mark("s:" + e),
        "title" !== e ||
          this.titleAt ||
          ((this.titleAt = s), this.event("title", { ms: Math.round(s) })),
        ("loading" !== e && "switching" !== e) || (this.loadStart = s),
        "play" === e &&
          this.loadStart &&
          (this.event("enter", {
            ms: Math.round(s - this.loadStart),
            net: !!this.g.net,
            dim: this.g.dim,
          }),
          (this.loadStart = 0)));
    },
    point() {
      const t = this.g,
        e = this.hist,
        s = this.frames;
      if (!s) return;
      const pct = (t) => {
          let n = Math.ceil(s * t),
            i = 0;
          for (; i < 201 && ((n -= e[i]), !(n <= 0)); i++);
          return i;
        },
        n = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
        i = t.settings;
      (this.points.push({
        m: Math.round(this.playMs / 6e4),
        fps: Math.round((s / (this.playMs - (this.lastPointMs || 0))) * 1e3 * 10) / 10,
        p50: pct(0.5),
        p95: pct(0.95),
        p99: pct(0.99),
        cpu: +(this.sum.cpu / s).toFixed(2),
        chunk: +(this.sum.chunk / s).toFixed(2),
        render: +(this.sum.render / s).toFixed(2),
        gpu: this.sum.gpuN ? +(this.sum.gpu / this.sum.gpuN).toFixed(2) : null,
        mem: n,
        ents: t.entities ? t.entities.length : 0,
        chunks: t.world && t.world.chunks ? t.world.chunks.size : 0,
        rd: i.renderDist,
        dyn: "undefined" != typeof DynRes ? DynRes.scale : 1,
        res: i.resScale,
        preset: i.preset || "",
        shaders: i.shaders || 0,
        maxFps: i.maxFps || 0,
        vsync: !1 !== i.vsync,
        lim: t.pacer ? t.pacer.playLimit : 0,
        mode: t.net ? "room" : "single",
        dim: t.dim,
        gm: t.mode,
      }),
        (this.lastPointMs = this.playMs),
        e.fill(0),
        (this.frames = 0),
        (this.sum = { cpu: 0, chunk: 0, render: 0, gpu: 0, gpuN: 0 }),
        this.points.length > 60 && this.points.shift());
    },
    packet(t) {
      const e = this.rtt.length ? { rtt: this.rttSummary() } : null,
        s = {
          v: 1,
          kind: "session",
          id: this.install(),
          sid: this.sid,
          seq: this.seq++,
          build: GAME_BUILD,
          final: !!t,
          fresh: !!this._fresh,
          dur: Math.round((performance.now() - this.t0) / 1e3),
          play: Math.round((this.playMs + this.afkMs) / 1e3),
          dev: 1 === this.seq ? this.device() : void 0,
          points: this.points,
          stalls: this.stalls,
          errors: [...this.errors].map(([t, e]) => ({ k: t, ...e })),
          counts: this.counts,
          events: this.events,
          net: e,
        };
      return (
        (this.points = []),
        (this.stalls = []),
        (this.errors = new Map()),
        (this.counts = {}),
        (this.events = []),
        (this.rtt = []),
        s
      );
    },
    rttSummary() {
      const t = [...this.rtt].sort((t, e) => t - e);
      return {
        n: t.length,
        p50: t[t.length >> 1],
        p95: t[Math.floor(0.95 * t.length)],
        max: t[t.length - 1],
      };
    },
    hasData() {
      return (
        this.points.length ||
        this.stalls.length ||
        this.errors.size ||
        this.events.length ||
        Object.keys(this.counts).length ||
        this.rtt.length
      );
    },
    flush(t) {
      if (!this.on()) return;
      if ((t && this.frames > 600 && this.point(), !this.hasData() && this.seq > 0 && !t)) return;
      const e = JSON.stringify(this.packet(t)),
        s = this.base() + "/api/telemetry";
      if (!(e.length > 12e4)) {
        try {
          t && navigator.sendBeacon
            ? navigator.sendBeacon(s, new Blob([e], { type: "text/plain" }))
            : fetch(s, { method: "POST", body: e, keepalive: e.length < 6e4, mode: "cors" }).catch(
                () => {},
              );
        } catch (t) {}
        this.lastFlush = performance.now();
      }
    },
    tick() {
      const t = this.g,
        e = performance.now();
      if (t && t.net && e - this.lastPing > 1e4 && t.net.ws && 1 === t.net.ws.readyState) {
        this.lastPing = e;
        const s = ++this.pingSeq;
        (this.pings.set(s, e),
          t.net.send({ t: "ping", i: s }),
          this.pings.size > 20 && this.pings.delete(this.pings.keys().next().value));
      }
      e - this.lastFlush > 3e5 && this.flush(!1);
    },
    init(t) {
      ((this.g = t),
        (this.prevState = t.state),
        setInterval(() => {
          try {
            this.tick();
          } catch (t) {}
        }, 1e3),
        addEventListener("pagehide", () => this.flush(!0)),
        document.addEventListener("visibilitychange", () => {
          document.hidden && this.flush(!1);
        }),
        addEventListener("error", (t) =>
          this.error(
            "page",
            t.message,
            (t.error && t.error.stack) || (t.filename ? `${t.filename}:${t.lineno}` : ""),
          ),
        ),
        addEventListener("unhandledrejection", (t) =>
          this.error(
            "promise",
            (t.reason && t.reason.message) || String(t.reason),
            t.reason && t.reason.stack,
          ),
        ));
      try {
        t.renderer.canvas.addEventListener("webglcontextlost", () => {
          (this.event("contextlost", {}), Crumbs.mark("ctx"));
        });
      } catch (t) {}
      (this.install(), this._fresh && this.event("firstrun", {}));
      try {
        Crumbs.init(t);
      } catch (t) {}
      try {
        Instances.init(t);
      } catch (t) {}
      try {
        SensorProbe.init();
      } catch (t) {}
      "title" !== t.state ||
        this.titleAt ||
        ((this.titleAt = performance.now()), this.event("title", { ms: Math.round(this.titleAt) }));
    },
  };
(() => {
  const t = Game.prototype.init;
  Game.prototype.init = async function (...e) {
    const s = await t.apply(this, e);
    try {
      Telemetry.init(this);
    } catch (t) {}
    return s;
  };
  const e = PerfMon.frame;
  PerfMon.frame = function (t, s, n, i) {
    const r = e.call(this, t, s, n, i);
    try {
      Telemetry.frame(t, s, n, this.renderMs || 0);
    } catch (t) {}
    return r;
  };
  const s = Game.prototype.render;
  Game.prototype.render = function (t, e) {
    const n = this.renderer;
    if (n && n.lost) n.lostFrame && n.lostFrame(this);
    else {
      n && (n.inFrame = !0);
      try {
        return s.call(this, t, e);
      } finally {
        n && (n.inFrame = !1);
      }
    }
  };
  const n = Game.prototype.reportError;
  Game.prototype.reportError = function (t, e, s) {
    return (Telemetry.error(t, (e && e.message) || e, e && e.stack), n.call(this, t, e, s));
  };
  const i = UI.prototype.open;
  UI.prototype.open = function (t) {
    return (
      t &&
        t.constructor &&
        (Telemetry.count("screen:" + t.constructor.name),
        Crumbs.mark("o:" + t.constructor.name.replace(/Screen$/, ""))),
      i.call(this, t)
    );
  };
  const r = Game.prototype.onPlayerDeath;
  Game.prototype.onPlayerDeath = function (t) {
    return (Telemetry.count("death:" + ((t && t.type) || "other")), r.call(this, t));
  };
  const o = Game.prototype.loadWorld;
  Game.prototype.loadWorld = function (...t) {
    return (Telemetry.count("world:load"), o.apply(this, t));
  };
  const a = Game.prototype.createWorld;
  if (
    ((Game.prototype.createWorld = function (...t) {
      return (Telemetry.count("world:create:" + (t[2] || "")), a.apply(this, t));
    }),
    "function" == typeof cmdExec)
  ) {
    const t = cmdExec;
    cmdExec = function (e, s, n) {
      return (
        n ||
          Telemetry.count(
            "cmd:" +
              String(s)
                .slice(1)
                .split(/\s+/)[0]
                .replace(/^minecraft:/, "")
                .slice(0, 20),
          ),
        t(e, s, n)
      );
    };
  }
  if ("undefined" != typeof NetClient) {
    const t = NetClient.prototype.onMessage;
    NetClient.prototype.onMessage = function (e) {
      if (e && "pong" === e.t) {
        const t = Telemetry.pings.get(e.i);
        return void (
          t &&
          (Telemetry.pings.delete(e.i),
          Telemetry.rtt.length < 500 && Telemetry.rtt.push(Math.round(performance.now() - t)))
        );
      }
      return (
        e && "notice" === e.t && !this.roomWaitAt && (this.roomWaitAt = performance.now()),
        e &&
          "room" === e.t &&
          (Telemetry.event("room", {
            wait: this.roomWaitAt ? Math.round(performance.now() - this.roomWaitAt) : 0,
          }),
          Telemetry.count("net:room")),
        t.call(this, e)
      );
    };
    const e = NetClient.prototype.fail;
    NetClient.prototype.fail = function (t) {
      return (
        Telemetry.count("net:fail"),
        Telemetry.event("netfail", { why: String(t || "").slice(0, 80) }),
        e.call(this, t)
      );
    };
  }
  const h = Game.prototype.resize;
  Game.prototype.resize = function (...t) {
    try {
      Crumbs.mark("rs:" + innerWidth + "x" + innerHeight);
    } catch (t) {}
    return h.apply(this, t);
  };
  const c = UI.prototype.showInput,
    l = UI.prototype.hideInput;
  ((UI.prototype.showInput = function (...t) {
    try {
      "block" !== this.input.style.display && Crumbs.mark("kb+");
    } catch (t) {}
    return c.apply(this, t);
  }),
    (UI.prototype.hideInput = function (...t) {
      try {
        "block" === this.input.style.display && Crumbs.mark("kb-");
      } catch (t) {}
      return l.apply(this, t);
    }));
  const d = Game.prototype.reportError;
  Game.prototype.reportError = function (t, e, s) {
    try {
      Crumbs.mark("e:" + String(t || "").slice(0, 14));
    } catch (t) {}
    return d.call(this, t, e, s);
  };
})();
const Crumbs = {
    KEY: "mcjs-crumbs",
    marks: [],
    g: null,
    lastW: 0,
    mark(t) {
      (this.marks.push(Math.round((performance.now() - Telemetry.t0) / 1e3) + ":" + t),
        this.marks.length > 10 && this.marks.shift(),
        this.g && performance.now() - this.lastW > 200 && this.save());
    },
    read() {
      try {
        const t = JSON.parse(localStorage.getItem(this.KEY) || "{}");
        return t && "object" == typeof t ? t : {};
      } catch (t) {
        return {};
      }
    },
    save(t) {
      const e = this.g;
      if (e) {
        this.lastW = performance.now();
        try {
          const s = e.renderer,
            n = e.ui,
            i = n && n.screen,
            r = n && n.input,
            o = {
              at: Date.now(),
              up: Math.round((performance.now() - Telemetry.t0) / 1e3),
              v: GAME_BUILD,
              st: e.state,
              sc: i ? i.constructor.name : "",
              hid: !!document.hidden,
              gl: s ? s.canvas.width + "x" + s.canvas.height : "",
              ui: n && n.canvas ? n.canvas.width + "x" + n.canvas.height : "",
              rs: s ? s.resScale : 0,
              sec: s && s.sections ? s.sections.size : 0,
              mb: s && s.arena ? Math.round(s.arena.total / 1048576) : 0,
              ent: e.entities ? e.entities.length : 0,
              net: !!e.net,
              kb: !(!r || document.activeElement !== r),
              lost: !(!s || !s.lost),
              old: !!Instances.stale,
              mk: this.marks.join(" "),
              end: t ? 1 : 0,
            },
            a = this.read();
          a[Telemetry.sid] = o;
          const h = Object.keys(a);
          if (h.length > 4)
            for (const t of h.sort((t, e) => a[t].at - a[e].at).slice(0, h.length - 4)) delete a[t];
          localStorage.setItem(this.KEY, JSON.stringify(a));
        } catch (t) {}
      }
    },
    init(t) {
      this.g = t;
      const e = this.read(),
        s = Date.now();
      for (const [t, n] of Object.entries(e))
        t !== Telemetry.sid &&
          n &&
          "object" == typeof n &&
          ((!n.end && s - n.at < 5e3) ||
            (!n.end &&
              s - n.at < 216e5 &&
              Telemetry.event("died", {
                ago: Math.round((s - n.at) / 1e3),
                up: n.up,
                v: n.v,
                st: n.st,
                sc: n.sc,
                hid: n.hid,
                gl: n.gl,
                ui: n.ui,
                rs: n.rs,
                sec: n.sec,
                mb: n.mb,
                ent: n.ent,
                net: n.net,
                kb: n.kb,
                lost: n.lost,
                old: n.old,
                mk: String(n.mk || "").slice(0, 260),
              }),
            delete e[t]));
      try {
        localStorage.setItem(this.KEY, JSON.stringify(e));
      } catch (t) {}
      (Telemetry.events.some((t) => "died" === t.type) &&
        setTimeout(() => Telemetry.flush(!1), 4e3),
        setInterval(() => this.save(), 2e3),
        addEventListener("pagehide", () => this.save(!0)),
        document.addEventListener("visibilitychange", () => {
          this.mark(document.hidden ? "hid" : "vis");
        }),
        document.addEventListener("fullscreenchange", () => this.mark("fs")),
        document.addEventListener("webkitfullscreenchange", () => this.mark("fs")),
        this.save());
    },
  },
  Instances = {
    stale: !1,
    leaving: !1,
    at: 0,
    ch: null,
    g: null,
    key: () => "mcjs-inst:" + location.pathname,
    init(t) {
      this.g = t;
      try {
        ((this.ch = new BroadcastChannel(this.key())),
          (this.ch.onmessage = (t) => this.heard(t.data)));
      } catch (t) {}
      if (
        (addEventListener("storage", (t) => {
          if (t.key === this.key() && t.newValue)
            try {
              this.heard(JSON.parse(t.newValue));
            } catch (t) {}
        }),
        document.addEventListener("visibilitychange", () => {
          document.hidden || this.shown();
        }),
        "undefined" != typeof DB)
      )
        for (const t of ["putChunks", "putWorld"]) {
          const e = DB[t];
          "function" == typeof e &&
            (DB[t] = function (...t) {
              return Instances.stale ? Promise.resolve() : e.apply(this, t);
            });
        }
      document.hidden || this.announce();
    },
    announce() {
      this.at = Date.now();
      const t = { t: "hello", id: Telemetry.sid, at: this.at };
      try {
        localStorage.setItem(this.key(), JSON.stringify(t));
      } catch (t) {}
      try {
        this.ch && this.ch.postMessage(t);
      } catch (t) {}
    },
    shown() {
      if (this.stale || this.leaving) return;
      let t = null;
      try {
        t = JSON.parse(localStorage.getItem(this.key()) || "null");
      } catch (t) {}
      t && t.id !== Telemetry.sid && t.at > this.at && this.at ? this.goStale() : this.announce();
    },
    heard(t) {
      !t ||
        "hello" !== t.t ||
        t.id === Telemetry.sid ||
        this.stale ||
        this.leaving ||
        (this.at &&
          (t.at > this.at || (t.at === this.at && t.id > Telemetry.sid)) &&
          this.goStale());
    },
    async goStale() {
      if (this.stale || this.leaving) return;
      this.leaving = !0;
      const t = this.g;
      try {
        (Crumbs.mark("old"),
          Telemetry.count("inst_old"),
          Telemetry.event("inst_old", { st: t.state, hid: !!document.hidden }));
      } catch (t) {}
      try {
        "play" !== t.state ||
          t.net ||
          document.hidden ||
          !t.saveWorld ||
          (await Promise.race([t.saveWorld(!0), new Promise((t) => setTimeout(t, 3e3))]));
      } catch (t) {}
      this.stale = !0;
      try {
        "play" !== t.state ||
          t.net ||
          !t.ui ||
          (t.ui.screen && t.ui.screen.pauses) ||
          "undefined" == typeof PauseScreen ||
          t.ui.open(new PauseScreen(t));
      } catch (t) {}
      try {
        t.net && t.net.close && t.net.close();
      } catch (t) {}
      try {
        t.releasePointer && t.releasePointer();
      } catch (t) {}
      try {
        Sound.sleep && Sound.sleep("old");
      } catch (t) {}
      try {
        this.notice();
      } catch (t) {}
    },
    notice() {
      if (this.el || "undefined" == typeof document) return;
      const t = (this.el = document.createElement("div"));
      t.style.cssText =
        'position:absolute;left:0;top:0;width:100%;height:100%;z-index:60;box-sizing:border-box;padding:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.9);color:#fff;font:15px "Microsoft YaHei",sans-serif;text-align:center';
      const line = (e, s) => {
        const n = document.createElement("div");
        return ((n.textContent = e), s && (n.style.cssText = s), t.appendChild(n), n);
      };
      (line("游戏在另一个页面里打开了", "font-size:22px;font-weight:bold;margin-bottom:6px"),
        line("这个页面已经停下，不会再存档，免得覆盖另一个页面的进度"));
      const e = line(
        "点这里在这个页面继续（会重新载入）",
        "margin-top:14px;padding:10px 28px;border:2px solid #fff;background:rgba(255,255,255,0.12)",
      );
      let s = !1;
      t.addEventListener("pointerup", (t) => {
        if ((t.preventDefault(), t.stopPropagation(), !s)) {
          ((s = !0), (e.textContent = "正在重新载入…"));
          try {
            (Telemetry.count("inst_reload"), Telemetry.flush(!1));
          } catch (t) {}
          try {
            this.g.state = "boot";
          } catch (t) {}
          location.reload();
        }
      });
      for (const e of [
        "touchstart",
        "touchmove",
        "touchend",
        "pointerdown",
        "mousedown",
        "wheel",
        "keydown",
      ])
        t.addEventListener(e, (t) => t.stopPropagation(), { passive: !0 });
      (document.getElementById("stage") || document.body).appendChild(t);
    },
  },
  SensorProbe = {
    key: "mcjs-sensor",
    lastInput: 0,
    tries: 0,
    init() {
      try {
        if (localStorage.getItem(this.key) === GAME_BUILD) return;
      } catch (t) {}
      for (const t of ["pointerdown", "touchstart", "mousedown", "keydown"])
        addEventListener(
          t,
          () => {
            this.lastInput = performance.now();
          },
          { capture: !0, passive: !0 },
        );
      setTimeout(() => this.attempt(), 8e3);
    },
    attempt() {
      if (this.done) return;
      performance.now() - this.lastInput > 6e3 &&
      !(navigator.userActivation && navigator.userActivation.isActive) &&
      !document.hidden &&
      Telemetry.on()
        ? this.run().then(
            (t) => Telemetry.event("sensor", t),
            () => {},
          )
        : ++this.tries < 45 && setTimeout(() => this.attempt(), 4e3);
    },
    async run(t = 3e3) {
      this.done = !0;
      try {
        localStorage.setItem(this.key, GAME_BUILD);
      } catch (t) {}
      const e = window,
        s = e.DeviceOrientationEvent,
        n = e.DeviceMotionEvent,
        wait = (t) => new Promise((e) => setTimeout(e, t)),
        i = { fr: e.top !== e.self ? 1 : 0, sec: e.isSecureContext ? 1 : 0, api: "" };
      [
        ["o", !!s],
        ["m", !!n],
        ["r", s && "function" == typeof s.requestPermission],
        ["R", n && "function" == typeof n.requestPermission],
        ["a", "ondeviceorientationabsolute" in e],
        ["s", "function" == typeof e.Gyroscope],
      ].forEach(([t, e]) => {
        e && (i.api += t);
      });
      const r = document.permissionsPolicy || document.featurePolicy;
      r &&
        "function" == typeof r.allowsFeature &&
        (i.fp = ["gyroscope", "accelerometer", "magnetometer"]
          .map((t) => {
            try {
              return r.allowsFeature(t) ? 1 : 0;
            } catch (t) {
              return "x";
            }
          })
          .join(""));
      const o = performance.now();
      let a = !!document.hidden;
      const h = { at: -1, n: 0, v: 0 },
        c = { at: -1, n: 0, v: 0, iv: 0 },
        onO = (t) => {
          (h.at < 0 && (h.at = Math.round(performance.now() - o)),
            h.n++,
            (null == t.alpha && null == t.beta && null == t.gamma) || (h.v = 1));
        },
        onM = (t) => {
          (c.at < 0 &&
            ((c.at = Math.round(performance.now() - o)), (c.iv = Math.round(+t.interval || 0))),
            c.n++);
          const e = t.accelerationIncludingGravity,
            s = t.rotationRate;
          ((e && null != e.x) || (s && null != s.alpha)) && (c.v = 1);
        },
        onV = () => {
          document.hidden && (a = !0);
        };
      (addEventListener("deviceorientation", onO, { passive: !0 }),
        addEventListener("devicemotion", onM, { passive: !0 }),
        document.addEventListener("visibilitychange", onV));
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const q = async (t) => {
            try {
              const e = await Promise.race([navigator.permissions.query({ name: t }), wait(1500)]);
              return e ? e.state : "slow";
            } catch (t) {
              return "x";
            }
          };
          i.pq = (await q("gyroscope")) + "/" + (await q("accelerometer"));
        }
        const ask = async (t) => {
          if (t && "function" == typeof t.requestPermission)
            try {
              return String(
                await Promise.race([t.requestPermission(), wait(3e3).then(() => "slow")]),
              );
            } catch (t) {
              return (
                "err:" + ((t && t.name) || "") + ":" + String((t && t.message) || "").slice(0, 100)
              );
            }
        };
        ((i.rp = await ask(s)),
          (i.rpm = await ask(n)),
          await wait(
            Math.max(
              t - (performance.now() - o),
              "granted" === i.rp || "granted" === i.rpm ? 1500 : 0,
            ),
          ));
      } finally {
        (removeEventListener("deviceorientation", onO),
          removeEventListener("devicemotion", onM),
          document.removeEventListener("visibilitychange", onV));
      }
      return Object.assign(i, {
        oe: h.at,
        on: h.n,
        ov: h.v,
        me: c.at,
        mn: c.n,
        mv: c.v,
        mi: c.iv,
        hid: a ? 1 : 0,
      });
    },
  },
  FEEDBACK_KINDS = [
    ["bug", "错误（bug）"],
    ["lag", "卡顿 / 性能"],
    ["idea", "建议"],
    ["other", "其他"],
  ];
async function postFeedback(t, e, s, n, i) {
  if (!Telemetry.base()) return "没有设置联机服务器，无法发送";
  Telemetry.frames > 120 && Telemetry.point();
  const r = {
    build: GAME_BUILD,
    id: Telemetry.install(),
    dev: Telemetry.device(),
    perf: Telemetry.points.slice(-5),
    stalls: Telemetry.stalls.slice(-10),
    errors: [...Telemetry.errors].slice(-10).map(([t, e]) => ({ k: t, ...e })),
    mode: t.net ? "room" : "play" === t.state ? "single" : t.state,
    room: t.net && t.net.room ? t.net.room.code : null,
    dim: t.dim,
    settings: {
      rd: t.settings.renderDist,
      preset: t.settings.preset,
      shaders: t.settings.shaders,
      dyn: t.settings.dynRes,
    },
    ...(i && "object" == typeof i ? i : {}),
  };
  try {
    const t = await fetch(Telemetry.base() + "/api/feedback", {
        method: "POST",
        body: JSON.stringify({ v: 1, kind: e, text: s, shot: n, ctx: r }),
      }),
      i = await t.json().catch(() => ({ error: "游戏正在更新中…请稍后" }));
    return !t.ok || i.error ? i.error || "HTTP " + t.status : null;
  } catch (t) {
    return "游戏正在更新中…请稍后";
  }
}
class FeedbackScreen extends FormScreen {
  constructor(t, e, s) {
    (super(t, "反馈问题", e),
      (this.pauses = "play" === t.state && !t.net),
      (this.kind = 0),
      (this.text = ""),
      (this.withShot = !!s),
      (this.shot = s || null),
      (this.sending = !1),
      (this.done = !1));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      s = Math.max(40, Math.floor(t.h / 2) - 80);
    (this.addField("text", e - 150, s + 36, 300, "描述（最多 500 字）", 500),
      (this.widgets = this.done
        ? [
            { text: this.note, x: e, y: s + 60, color: this.noteColor },
            { x: e - 100, y: s + 90, w: 200, h: 20, label: "完成", onClick: () => this.back() },
          ]
        : [
            {
              x: e - 150,
              y: s,
              w: 300,
              h: 20,
              label: () => "类型：" + FEEDBACK_KINDS[this.kind][1],
              onClick: () => {
                this.kind = (this.kind + 1) % FEEDBACK_KINDS.length;
              },
            },
            {
              x: e - 150,
              y: s + 64,
              w: 300,
              h: 20,
              label: () => "附带截图：" + (this.withShot ? "是" : "否"),
              enabled: !!this.shot,
              tip: this.shot ? ["打开这个界面之前的游戏画面"] : ["没有可用的画面"],
              onClick: () => {
                this.withShot = !this.withShot;
              },
            },
            {
              x: e - 150,
              y: s + 126,
              w: 145,
              h: 20,
              label: () => (this.sending ? "发送中…" : "发送"),
              enabled: !this.sending,
              onClick: () => this.submit(),
            },
            { x: e + 5, y: s + 126, w: 145, h: 20, label: "取消", onClick: () => this.back() },
          ]),
      this.done || this.focus("text"));
  }
  drawExtra(t) {
    if (this.done) return;
    this.drawFields(t);
    const e = Math.max(40, Math.floor(t.h / 2) - 80);
    (Font.center(
      t.ctx,
      "会一起发送：游戏版本、设备和显卡、最近几分钟的帧率、",
      t.w / 2,
      e + 90,
      "#A0A0A0",
    ),
      Font.center(t.ctx, "单机还是房间、最近的报错", t.w / 2, e + 100, "#A0A0A0"),
      Font.center(t.ctx, "不会发送你的名字、聊天记录或存档", t.w / 2, e + 110, "#A0A0A0"));
  }
  back() {
    (this.game.ui.hideInput(), this.game.ui.open(this.parent));
  }
  onEsc() {
    this.back();
  }
  async submit() {
    const t = this.game,
      e = String(this.text || "").trim();
    if (e.length < 2) return ((this.note = "请先写几句描述"), void (this.noteColor = "#FF5555"));
    if (!Telemetry.base())
      return ((this.note = "没有设置联机服务器，无法发送"), void (this.noteColor = "#FF5555"));
    ((this.sending = !0), (this.note = ""), t.ui.hideInput());
    const s = await postFeedback(
      t,
      FEEDBACK_KINDS[this.kind][0],
      e,
      this.withShot ? this.shot : null,
    );
    ((this.sending = !1),
      (this.done = !0),
      (this.note = s ? "发送失败：" + s : "已发送，谢谢你的反馈！"),
      (this.noteColor = s ? "#FF5555" : "#55FF55"),
      s || (this.text = ""),
      this.layout());
  }
}
function feedbackShot(t) {
  try {
    if ("play" === t.state) {
      const e = t.ui.screen;
      t.ui.screen = null;
      try {
        t.render(t.lastA || 0, performance.now());
      } finally {
        t.ui.screen = e;
      }
    }
    const e = t.renderer.canvas,
      s = Math.min(1, 960 / e.width),
      n = document.createElement("canvas");
    ((n.width = Math.round(e.width * s)),
      (n.height = Math.round(e.height * s)),
      n.getContext("2d").drawImage(e, 0, 0, n.width, n.height));
    const i = n.toDataURL("image/jpeg", 0.7);
    return i.length > 30 && i.length < 9e5 ? i : null;
  } catch (t) {
    return null;
  }
}
class TelemetryScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, "遥测数据"),
      (this.parent = e),
      (this.pauses = "play" === t.state),
      (this.titleY = 12));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      s = this.game,
      n = s.settings;
    this.widgets = [
      {
        x: e - 155,
        y: t.h - 80,
        w: 310,
        h: 20,
        label: () => "上传匿名统计数据：" + (!1 !== n.telemetry ? "开" : "关"),
        onClick: () => {
          ((n.telemetry = !1 === n.telemetry), s.saveSettings());
        },
      },
      {
        x: e - 155,
        y: t.h - 55,
        w: 150,
        h: 20,
        label: "反馈问题…",
        onClick: () => s.ui.open(new FeedbackScreen(s, this, null)),
      },
      {
        x: e + 5,
        y: t.h - 55,
        w: 150,
        h: 20,
        label: "完成",
        onClick: () => s.ui.open(this.parent),
      },
    ];
  }
  drawExtra(t) {
    [
      "为了让游戏更流畅、少出错，游戏会把匿名的统计数据发到我们的服务器：",
      "",
      "• 设备：显卡型号、处理器线程数、内存档位、屏幕和刷新率、浏览器和系统",
      "• 性能：每分钟的帧率和卡顿、内存、实体和区块数量、画质设置",
      "• 出错：报错信息（只有出错的代码位置）",
      "• 使用：打开过哪些界面、用过哪些命令（只有名字）、联机延迟和掉线",
      "",
      "不收集：你的名字、聊天内容、存档、IP 地址（服务器只保存打乱后的编号）。",
      "数据只用来改进游戏和写研究报告，原始数据保存 180 天。",
    ].forEach((e, s) =>
      Font.draw(
        t.ctx,
        e,
        Math.round(t.w / 2 - 155),
        34 + 11 * s,
        e.startsWith("不收集") ? "#FFFF55" : "#E0E0E0",
      ),
    );
  }
  onEsc() {
    this.game.ui.open(this.parent);
  }
}
//# sourceURL=js/telemetry.js
