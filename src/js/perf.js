"use strict";
class FramePacer {
  constructor(e, t) {
    ((this.g = e),
      (this.frame = t),
      (this.refresh = 1e3 / 60),
      (this.rafD = []),
      (this.rafN = 0),
      (this.lastRaf = 0),
      (this.last = 0),
      (this.rest = 2),
      (this.backoff = 1),
      (this.chunkMs = 0),
      (this.touch =
        "undefined" != typeof TouchDevice &&
        ("phone" === TouchDevice.kind || "tablet" === TouchDevice.kind)),
      (this.mc = new MessageChannel()),
      (this.mc.port1.onmessage = () => {
        ((this.mcWait = !1), this.run(performance.now()));
      }),
      (this.rafCb = (e) => {
        ((this.rafWait = !1), this.onRaf(e));
      }),
      (this.timer = 0),
      (this.timerCb = () => {
        ((this.timer = 0), this.schedule());
      }),
      (this.due = 0),
      (this.tdue = 0),
      (this.lastInput = performance.now()),
      (this.keys = new Set()),
      (this.buttons = 0),
      (this.touches = 0),
      (this.capOn = !1),
      (this.cappedFrame = !1),
      (this.prevCapped = !1),
      (this.cappedT = -1e9),
      (this.afkOn = !1));
    const s = { capture: !0, passive: !0 },
      mark = () => this.input();
    for (const e of ["mousemove", "wheel", "touchmove"]) addEventListener(e, mark, s);
    (addEventListener(
      "keydown",
      (e) => {
        (this.keys.add(e.code), mark());
      },
      s,
    ),
      addEventListener(
        "keyup",
        (e) => {
          (this.keys.delete(e.code), mark());
        },
        s,
      ));
    for (const e of ["mousedown", "mouseup"])
      addEventListener(
        e,
        (e) => {
          ((this.buttons = 0 | e.buttons), mark());
        },
        s,
      );
    for (const e of ["touchstart", "touchend", "touchcancel"])
      addEventListener(
        e,
        (e) => {
          ((this.touches = e.touches ? e.touches.length : 0), mark());
        },
        s,
      );
    addEventListener("blur", () => {
      (this.keys.clear(), (this.buttons = 0), (this.touches = 0));
    });
  }
  input() {
    ((this.lastInput = performance.now()),
      this.afkOn &&
        ((this.afkOn = !1),
        (this.due = this.tdue = 0),
        this.timer && (clearTimeout(this.timer), (this.timer = 0), this.schedule())));
  }
  get afk() {
    if ("play" !== this.g.state || this.keys.size || this.buttons || this.touches) return 0;
    const e = performance.now() - this.lastInput;
    return e > 6e5 ? 2 : e > 6e4 ? 1 : 0;
  }
  frozen() {
    const e = this.g,
      t = e.ui && e.ui.screen;
    return !(
      !t ||
      !t.pauses ||
      e.net ||
      e.p2pHost ||
      e.p2pGuest ||
      ("function" == typeof CreditsScreen && t instanceof CreditsScreen)
    );
  }
  get hz() {
    return Math.round(1e3 / this.refresh);
  }
  get auto60() {
    return this.touch && this.refresh < 1e3 / 65;
  }
  get playLimit() {
    const e = this.g.settings.maxFps;
    return e > 0 ? e : -1 !== e && this.auto60 ? 60 : 0;
  }
  get limit() {
    const e = this.playLimit;
    if ("play" !== this.g.state)
      return (
        (this.capOn = this.afkOn = !1),
        this.free && this.g.ui && this.g.ui.screen === this.free ? 0 : e ? Math.min(e, 60) : 60
      );
    const t = this.afk,
      s = 2 === t ? 10 : 1 === t || this.frozen() ? 30 : 0;
    return ((this.afkOn = t > 0), (this.capOn = !!s && (!e || e > s)), this.capOn ? s : e);
  }
  get vsync() {
    return !1 !== this.g.settings.vsync || this.touch;
  }
  start() {
    this.schedule();
  }
  schedule() {
    if (this.timer) return;
    if (this.vsync || document.hidden) {
      if (this.rafWait) return;
      const e =
        this.due && !document.hidden ? this.due - performance.now() - 1.5 * this.refresh : 0;
      return e > 1.5 * this.refresh
        ? ((this.timer = setTimeout(this.timerCb, e)), void (this.lastRaf = 0))
        : ((this.rafWait = !0), void requestAnimationFrame(this.rafCb));
    }
    if (this.mcWait) return;
    const e = this.tdue ? this.tdue - performance.now() - 0.5 : 0;
    e > 0
      ? (this.timer = setTimeout(this.timerCb, e))
      : ((this.mcWait = !0), this.mc.port2.postMessage(0));
  }
  onRaf(e) {
    if (this.lastRaf) {
      const t = e - this.lastRaf;
      if (
        t > 2 &&
        t < 100 &&
        (this.rafD.push(t),
        this.rafD.length > 90 && this.rafD.shift(),
        this.rafD.length >= 10 && !(15 & ++this.rafN))
      ) {
        const e = [...this.rafD].sort((e, t) => e - t);
        this.refresh = e[Math.floor(0.2 * e.length)];
      }
    }
    if (((this.lastRaf = e), this.vsync && this.limit && 1e3 / this.limit > 1.05 * this.refresh)) {
      const t = 1e3 / this.limit;
      if (this.due && e < this.due - 0.5 * this.refresh) return void this.schedule();
      this.due = Math.max((this.due || e) + t, e - t);
    } else this.due = 0;
    this.run(e);
  }
  run(e) {
    const t = this.limit;
    if (!this.vsync && t && this.tdue && e < this.tdue - 0.5) return void this.schedule();
    if (!this.vsync) {
      const s = t ? 1e3 / t : 0;
      this.tdue = s ? (this.tdue && e - this.tdue < s ? this.tdue + s : e + s) : 0;
    }
    const s = this.capOn;
    ((this.cappedFrame = s || this.prevCapped),
      (this.prevCapped = s),
      this.cappedFrame && (this.cappedT = e));
    const i = this.last ? e - this.last : 1e3 / 60,
      n = this.target();
    (this.last && i > 1.5 * n && this.prevChunk > 0.3 && (this.vsync || t) && !this.cappedFrame
      ? (this.backoff = Math.max(0.25, 0.7 * this.backoff))
      : (this.backoff = Math.min(1, this.backoff + 0.01)),
      (this.last = e),
      (this.chunkMs = 0));
    const r = performance.now();
    this.frame(e, i);
    const h = performance.now() - r;
    ((this.rest += 0.1 * (Math.max(0, h - this.chunkMs) - this.rest)),
      (this.prevChunk = this.chunkMs),
      PerfMon.frame(i, h, this.chunkMs, this.g),
      this.schedule());
  }
  target() {
    const e = this.limit;
    return this.vsync ? Math.max(this.refresh, e ? 1e3 / e : 0) : e ? 1e3 / e : 1e3 / 240;
  }
  budget() {
    const e = this.target();
    return clamp((e - this.rest - Math.max(1, 0.15 * e)) * this.backoff, 0.5, 12);
  }
}
const PerfMon = {
    N: 240,
    i: 0,
    n: 0,
    dt: new Float32Array(240),
    cpu: new Float32Array(240),
    chunk: new Float32Array(240),
    render: new Float32Array(240),
    gpu: new Float32Array(240).fill(NaN),
    renderMs: 0,
    gpuOn: !1,
    queries: [],
    frame(e, t, s, i) {
      const n = this.i;
      ((this.dt[n] = e),
        (this.cpu[n] = t),
        (this.chunk[n] = s),
        (this.render[n] = this.renderMs),
        (this.gpu[n] = NaN),
        (this.i = (n + 1) % this.N),
        (this.n = Math.min(this.N, this.n + 1)),
        this.pollGpu(),
        this.rec && this.rec.push([e, t, s, this.renderMs]),
        DynRes.frame(i, e, t));
    },
    gpuBegin(e) {
      if (!this.gpuOn) return;
      if (e.isContextLost()) return ((this.queries.length = 0), void (this.cur = null));
      const t =
        void 0 !== this.ext
          ? this.ext
          : (this.ext = e.getExtension("EXT_disjoint_timer_query_webgl2"));
      if (!t || this.queries.length > 4) return;
      const s = e.createQuery();
      s && (e.beginQuery(t.TIME_ELAPSED_EXT, s), (this.cur = { q: s, i: this.i, gl: e }));
    },
    gpuEnd() {
      if (!this.cur) return;
      const e = this.cur.gl;
      (e.isContextLost() || (e.endQuery(this.ext.TIME_ELAPSED_EXT), this.queries.push(this.cur)),
        (this.cur = null));
    },
    pollGpu() {
      if (this.queries.length && this.queries[0].gl.isContextLost()) this.queries.length = 0;
      else
        for (; this.queries.length;) {
          const e = this.queries[0],
            t = e.gl;
          if (!t.getQueryParameter(e.q, t.QUERY_RESULT_AVAILABLE)) break;
          const s = !t.getParameter(this.ext.GPU_DISJOINT_EXT),
            i = t.getQueryParameter(e.q, t.QUERY_RESULT);
          (s &&
            ((this.gpu[e.i] = i / 1e6),
            (this.lastGpu = i / 1e6),
            this.rec && this.rec.gpu.push(i / 1e6)),
            t.deleteQuery(e.q),
            this.queries.shift());
        }
    },
    summary(e) {
      if (!e) {
        e = [];
        for (let t = 0; t < this.n; t++) {
          const s = (this.i - 1 - t + this.N) % this.N;
          e.push([this.dt[s], this.cpu[s], this.chunk[s], this.render[s]]);
        }
      }
      if (!e.length) return null;
      const t = e.map((e) => e[0]).sort((e, t) => e - t),
        avg = (t) => e.reduce((e, s) => e + s[t], 0) / e.length,
        q = (e) => t[Math.min(t.length - 1, Math.floor(t.length * e))],
        s = e.reduce((e, t) => e + t[0], 0);
      return {
        frames: e.length,
        fps: (1e3 * e.length) / s,
        avg: s / e.length,
        p50: q(0.5),
        p95: q(0.95),
        p99: q(0.99),
        max: t[t.length - 1],
        cpu: avg(1),
        chunk: avg(2),
        render: avg(3),
      };
    },
    gpuAvg(e) {
      const t = e || [...this.gpu].filter((e) => !isNaN(e));
      return t.length ? t.reduce((e, t) => e + t, 0) / t.length : null;
    },
    memory(e) {
      const t = {};
      performance.memory &&
        ((t.heap = performance.memory.usedJSHeapSize / 1048576),
        (t.heapLimit = performance.memory.jsHeapSizeLimit / 1048576));
      const s = performance.now();
      if (!this.memT || s - this.memT > 1e3) {
        this.memT = s;
        let t = 0;
        if (e.world)
          for (const s of e.world.chunks.values()) {
            for (const e of s.bs) e && (t += e.d.byteLength + (e.n >= 0 ? 512 : 0));
            for (const e of s.ms) e && (t += 4096);
            for (const e of s.ls) e && (t += 4096);
            t += 2600;
          }
        this.chunkMB = t / 1048576;
      }
      t.chunks = this.chunkMB;
      const i = e.renderer.arena;
      return ((t.mesh = i ? i.used / 1048576 : 0), (t.meshAlloc = i ? i.total / 1048576 : 0), t);
    },
    gpuName(e) {
      if (void 0 !== this.gpuNameS) return this.gpuNameS;
      let t = "";
      try {
        const s = e.getExtension("WEBGL_debug_renderer_info");
        t = s ? e.getParameter(s.UNMASKED_RENDERER_WEBGL) : e.getParameter(e.RENDERER);
      } catch (e) {}
      return (this.gpuNameS = String(t || "未知"));
    },
    gpuShort(e) {
      const t = this.gpuName(e),
        s =
          /^ANGLE \((?:[^,]*), (.*?)(?: \(0x[0-9A-Fa-f]+\))?(?: Direct3D.*| OpenGL.*| Metal.*| Vulkan.*)?, [^,]*\)$/.exec(
            t,
          );
      return (s ? s[1] : t).replace(/^(NVIDIA|AMD|Intel\(R\)) /, "").slice(0, 40);
    },
    lines(e) {
      const t = e.pacer,
        s = this.summary(),
        i = this.memory(e),
        n = e.renderer,
        r = e.chunkWorker,
        f1 = (e) => (null == e || isNaN(e) ? "-" : e.toFixed(1)),
        r0 = (e) => (null == e || isNaN(e) ? "-" : Math.round(e)),
        h = [],
        o = t.vsync
          ? "垂直同步" + (t.limit ? " " + t.limit : "")
          : t.limit
            ? "上限 " + t.limit
            : "无限制";
      (h.push(`${o} · 刷新 ${r0(1e3 / t.refresh)} Hz`),
        s &&
          (h.push(`帧 ${f1(s.avg)} ms  P95 ${f1(s.p95)}  最慢 ${f1(s.max)}`),
          h.push(
            `主线程 区块 ${f1(s.chunk)} 渲染 ${f1(s.render)} 其他 ${f1(s.cpu - s.chunk - s.render)}`,
          )));
      const a = this.gpuAvg();
      if (
        (h.push(
          `区块预算 ${f1(t.budget())} ms` +
            (t.backoff < 0.99 ? `（回退 ${r0(100 * t.backoff)}%）` : "") +
            "  显卡 " +
            (null == a ? (null === this.ext ? "-" : "…") : f1(a) + " ms"),
        ),
        r && r.stats)
      ) {
        const e = r.stats;
        h.push(
          `区块线程 ${r0((e.busy / e.span) * 100)}%  装饰 ${e.nDecorate}/s  网格 ${e.nMesh}/s`,
        );
      }
      MemMon.update();
      const Y = (e) => ({ text: e, color: "#FFFF55" });
      if (
        (h.push(
          Y(
            "运存 主线程 JS 堆：" +
              (null != MemMon.heap
                ? r0(MemMon.heap) + " / " + r0(MemMon.heapAlloc) + " MB"
                : "浏览器不提供"),
          ),
        ),
        null != MemMon.all && h.push(Y(`运存 全部 JS（含后台线程）：${r0(MemMon.all)} MB`)),
        h.push(`区块数据 ${r0(i.chunks)} MB`),
        h.push(`地形显存 ${r0(i.mesh)} / ${r0(i.meshAlloc)} MB`),
        h.push(
          `${n.canvas.width}x${n.canvas.height} (${r0(100 * n.resScale)}%)  ${PRESET_NAMES[e.settings.preset] || "自定义"}·${"fast" === e.settings.graphics ? "流畅" : "高品质"}`,
        ),
        e.net)
      ) {
        const t = e.net;
        h.push(
          `联机：区块 ${t.stats.chunks}  实体 ${t.ents.size}  未显示的实体 ${[...t.unknown.values()].reduce((e, t) => e + t, 0)}  缺少方块 ${t.missing.size} 种`,
        );
      }
      return (
        h.push(this.gpuShort(n.gl)),
        h.push(`${navigator.hardwareConcurrency || "?"} 线程 · ${TouchDevice.name}`),
        h
      );
    },
    drawGraph(e, t, s, i, n, r) {
      const h = r.pacer.target(),
        o = n / (3 * h);
      ((e.fillStyle = "rgba(0,0,0,0.45)"), e.fillRect(t, s - n, i, n));
      const a = Math.min(this.n, i),
        c = i / this.N;
      for (let r = 0; r < a; r++) {
        const a = (this.i - 1 - r + this.N) % this.N,
          u = this.dt[a],
          l = Math.min(n, u * o);
        ((e.fillStyle = u > 2 * h ? "#FF5555" : u > 1.25 * h ? "#FFFF55" : "#55FF55"),
          e.fillRect(t + i - (r + 1) * c, s - l, Math.max(1, c), l));
        const p = Math.min(l, this.chunk[a] * o);
        p > 0.5 &&
          ((e.fillStyle = "rgba(85,170,255,0.9)"),
          e.fillRect(t + i - (r + 1) * c, s - p, Math.max(1, c), p));
      }
      ((e.fillStyle = "#FFFFFF"),
        e.fillRect(t, s - h * o, i, 0.5),
        (e.fillStyle = "rgba(255,255,255,0.4)"),
        e.fillRect(t, s - 2 * h * o, i, 0.5),
        Font.draw(e, (1e3 / h).toFixed(0) + " fps", t + 2, s - h * o - 9, "#FFFFFF", !1),
        Font.draw(e, "绿：帧时间  蓝：区块加载", t + 2, s - n + 2, "#C0C0C0", !1));
    },
    record(e, t, s) {
      if (this.rec) return !1;
      ((this.rec = []), (this.rec.gpu = []));
      const i = this.gpuOn;
      return (
        (this.gpuOn = !0),
        setTimeout(() => {
          const n = this.rec;
          ((this.rec = null), (this.gpuOn = i), s(this.report(e, n, t)));
        }, t),
        !0
      );
    },
    report(e, t, s) {
      const i = this.summary(t),
        n = this.memory(e),
        r = e.pacer,
        h = e.settings,
        o = e.renderer,
        f1 = (e) => (null == e || isNaN(e) ? "-" : e.toFixed(2)),
        a = this.gpuAvg(t && t.gpu),
        c = r.target(),
        u = t ? t.filter((e) => e[0] > 1.5 * c).length : 0,
        l = [
          `土豆史诗 性能报告  ${new Date().toLocaleString()}`,
          `设备：${TouchDevice.name}，${navigator.hardwareConcurrency || "?"} 线程，内存 ${navigator.deviceMemory ? navigator.deviceMemory + " GB+" : "未知"}，${this.gpuName(o.gl)}`,
          `浏览器：${navigator.userAgent}`,
          `运行方式：${"file:" === location.protocol ? "直接打开文件（file://，没有后台线程）" : "本地服务器 " + location.host}；区块线程 ${e.chunkWorker && e.chunkWorker.ready && !e.chunkWorker.failed ? "可用" : "不可用"}，地形生成 ${"undefined" != typeof GenPool && GenPool.inline ? "在页面内" : (e.genPool ? e.genPool.workers.length : 0) + " 个线程"}`,
          `画面：${o.canvas.width}x${o.canvas.height}，缩放 ${Math.round(100 * o.resScale)}%，设备像素比 ${devicePixelRatio}`,
          `设置：画质 ${PRESET_NAMES[h.preset] || "自定义"}，渲染距离 ${h.renderDist}，光影 ${FX_NAMES[h.shaders || 0]}，图形 ${"fast" === h.graphics ? "流畅" : "高品质"}，${r.vsync ? "垂直同步" : "无垂直同步"}，最大帧率 ${r.playLimit || "无限制"}${h.maxFps > 0 ? "" : -1 === h.maxFps ? "（跟随屏幕）" : r.auto60 ? "（自动）" : ""}${r.afk ? "，无操作限制中" : ""}`,
          `状态：${e.state}，维度 ${e.dim}，已加载区块 ${e.world ? e.world.chunks.size : 0}，区段 ${o.sections.size}，可见 ${(o.visSections || []).length}`,
          "",
          `统计 ${s ? (s / 1e3).toFixed(0) + " 秒" : "最近 " + (i ? i.frames : 0) + " 帧"}：${i ? i.frames : 0} 帧，平均 ${i ? i.fps.toFixed(1) : "-"} fps`,
          i
            ? `帧时间 ms：平均 ${f1(i.avg)}，中位 ${f1(i.p50)}，P95 ${f1(i.p95)}，P99 ${f1(i.p99)}，最慢 ${f1(i.max)}；超过 1.5 倍目标 ${u} 帧`
            : "",
          i
            ? `主线程 ms/帧：总 ${f1(i.cpu)}，区块 ${f1(i.chunk)}，渲染 ${f1(i.render)}；显卡 ${null == a ? "无法测量" : f1(a)}`
            : "",
          `刷新间隔 ${f1(r.refresh)} ms，目标 ${f1(c)} ms，区块预算 ${f1(r.budget())} ms，回退 ${Math.round(100 * r.backoff)}%`,
          `区块任务耗时（主线程，ms/项）：${Object.entries(e.workCost || {})
            .map(([e, t]) => e + " " + t.toFixed(2))
            .join("，")}`,
        ],
        p = e.chunkWorker && e.chunkWorker.stats;
      (p &&
        l.push(
          `区块线程：忙 ${Math.round((p.busy / p.span) * 100)}%，每秒 装饰 ${p.nDecorate} / 完成 ${p.nFinish} / 网格 ${p.nMesh}，装饰 ${f1(p.decorate / Math.max(1, p.nDecorate))} ms/个，待装饰 ${p.protos} 个（${f1(p.protoMB)} MB）`,
        ),
        l.push(`地形生成线程 ${e.genPool ? e.genPool.workers.length : 0} 个`),
        l.push(
          `内存：JS 堆 ${n.heap ? n.heap.toFixed(0) + " / " + n.heapLimit.toFixed(0) + " MB" : "不可用"}${null != MemMon.all ? "，含后台线程 " + MemMon.all.toFixed(0) + " MB" : ""}，区块数据 ${f1(n.chunks)} MB，地形显存 ${f1(n.mesh)} MB（已分配 ${f1(n.meshAlloc)} MB）`,
        ));
      const m = e.errLog ? [...e.errLog.values()] : [];
      l.push(m.length ? `错误记录（${m.length} 种）：` : "错误记录：无");
      for (const e of m)
        l.push(
          `  [${e.where || "-"}] ${e.msg} ×${e.n}（${new Date(e.first).toLocaleTimeString()} 起）${e.stack ? "\n    " + e.stack : ""}`,
        );
      return l.filter((e) => "" !== e).join("\n");
    },
  },
  MemMon = {
    heap: null,
    heapAlloc: null,
    heapT: 0,
    all: null,
    allT: 0,
    busy: !1,
    update() {
      const e = performance.now();
      (performance.memory &&
        e - this.heapT > 250 &&
        ((this.heapT = e),
        (this.heap = performance.memory.usedJSHeapSize / 1048576),
        (this.heapAlloc = performance.memory.totalJSHeapSize / 1048576)),
        self.crossOriginIsolated &&
          performance.measureUserAgentSpecificMemory &&
          !this.busy &&
          !this.allFailed &&
          e - this.allT > 1e3 &&
          ((this.busy = !0),
          performance
            .measureUserAgentSpecificMemory()
            .then((e) => {
              ((this.all = e.bytes / 1048576), (this.allAt = performance.now()));
            })
            .catch(() => {
              this.allFailed = !0;
            })
            .finally(() => {
              ((this.busy = !1), (this.allT = performance.now()));
            })));
    },
  },
  DynRes = {
    scale: 1,
    t: 0,
    n: 0,
    sum: 0,
    cpuSum: 0,
    miss: 0,
    slow: 0,
    good: 0,
    skip: 0,
    lastRaise: 0,
    noRaiseUntil: 0,
    noDropUntil: 0,
    cpuBound: !1,
    trial: null,
    target(e) {
      const t = e.pacer,
        s = t.limit,
        i = e.settings.maxFps,
        n = t.vsync ? t.target() : s ? 1e3 / s : t.refresh,
        r = self.POTATO ? Math.max(n, 1e3 / 120) : n;
      return !t.touch || i > 0 || -1 === i ? r : Math.max(r, 1e3 / 60);
    },
    clear() {
      ((this.n = this.sum = this.cpuSum = this.miss = 0), (this.t = performance.now()));
    },
    reset(e) {
      (this.clear(),
        (this.slow = this.good = 0),
        (this.skip = 1),
        (this.trial = null),
        (this.cpuBound = !1),
        (this.noDropUntil = 0),
        1 !== this.scale && this.set(e, 1));
    },
    frame(e, t, s) {
      if (
        !e.settings.dynRes ||
        "play" !== e.state ||
        (e.ui.screen && e.ui.screen.pauses) ||
        (e.pacer && e.pacer.cappedFrame)
      )
        return (1 === this.scale || e.settings.dynRes || this.set(e, 1), void this.clear());
      const i = this.target(e);
      if (t > 4 * i) return ((this.skip = 2), void this.clear());
      (this.n++, (this.sum += t), (this.cpuSum += s), t > 1.5 * i && this.miss++);
      const n = performance.now();
      if (n - this.t < 1500 || this.n < 30) return;
      const r = this.sum / this.n,
        h = this.cpuSum / this.n,
        o = this.miss / this.n,
        a = PerfMon.gpuOn ? PerfMon.lastGpu : null;
      if ((this.clear(), this.skip > 0)) return void this.skip--;
      const c = r > 1.12 * i || o > 0.15,
        u = null != a ? a > 0.9 * i : c && h < 0.8 * i,
        l = r <= 1.05 * i && o < 0.05 && (null == a || a < 0.75 * i),
        p = this.trial;
      if (p) {
        if (((p.sum += r), ++p.n < 2)) return;
        if (((this.trial = null), p.sum / p.n > 0.93 * p.before))
          return (
            (this.noDropUntil = n + 6e4),
            (this.cpuBound = !0),
            (this.slow = this.good = 0),
            void this.set(e, p.from)
          );
      }
      ((this.cpuBound = (c && !u) || n < this.noDropUntil),
        (this.slow = u ? this.slow + 1 : 0),
        (this.good = l && !u ? this.good + 1 : 0),
        this.slow >= 2 && this.scale > 0.5 && n >= this.noDropUntil
          ? (n - this.lastRaise < 4e3 && (this.noRaiseUntil = n + 3e4),
            (this.trial = { from: this.scale, before: r, n: 0, sum: 0 }),
            (this.slow = 0),
            (this.good = 0),
            this.set(e, Math.max(0.5, Math.round(100 * (this.scale - 0.1)) / 100)))
          : this.good >= 2 &&
            this.scale < 1 &&
            n >= this.noRaiseUntil &&
            ((this.good = 0),
            (this.lastRaise = n),
            this.set(e, Math.min(1, Math.round(100 * (this.scale + 0.1)) / 100))));
    },
    set(e, t) {
      ((this.scale = t), e.applySettings());
    },
  },
  PRESET_NAMES = {
    auto: "自动",
    low: "低",
    medium: "中",
    high: "高",
    ultra: "极高",
    custom: "自定义",
  },
  PRESETS = {
    low: { renderDist: 6, resScale: 0.75, clouds: !1, graphics: "fast", shaders: 0, dynRes: !0 },
    medium: { renderDist: 8, resScale: 1, clouds: !0, graphics: "fast", dynRes: !0 },
    high: { renderDist: 12, resScale: 1, clouds: !0, graphics: "fancy", dynRes: !0 },
    ultra: { renderDist: 16, resScale: 1, clouds: !0, graphics: "fancy", dynRes: !1 },
  };
function detectPreset(e) {
  const t = navigator.hardwareConcurrency || 4,
    s = navigator.deviceMemory || 8,
    i = PerfMon.gpuName(e).toLowerCase(),
    n = /swiftshader|llvmpipe|software|basic render|microsoft basic/.test(i),
    r = /nvidia|geforce|rtx|gtx|quadro|radeon (rx|pro)|rx \d{3,4}|arc\(tm\)|intel\(r\) arc/.test(i),
    h = /apple m\d|apple gpu/.test(i);
  return n
    ? "low"
    : "phone" === TouchDevice.kind
      ? s >= 8 && t >= 8
        ? "medium"
        : "low"
      : "tablet" === TouchDevice.kind
        ? s >= 6 && t >= 8
          ? "medium"
          : "low"
        : (r || h) && t >= 8 && s >= 8
          ? "high"
          : (t >= 8 && s >= 8) || t >= 4
            ? "medium"
            : "low";
}
function applyPreset(e, t) {
  const s = e.settings;
  s.preset = t;
  const i = PRESETS["auto" === t ? (s.autoPreset = detectPreset(e.renderer.gl)) : t];
  if (!i) return;
  const n = s.graphics;
  (Object.assign(s, i),
    void 0 === i.shaders && s.shaders && "low" === t && (s.shaders = 0),
    n !== s.graphics && e.graphicsChanged());
}
function initPresets(e, t) {
  const s = e.settings;
  s.preset || (t ? (s.preset = "custom") : (applyPreset(e, "auto"), e.saveSettings()));
}
function genWorkerCount() {
  const e = navigator.hardwareConcurrency || 4,
    t = navigator.deviceMemory || 8;
  return "phone" === TouchDevice.kind || e <= 4 || t < 4 ? 1 : e >= 12 && t >= 8 ? 3 : 2;
}
function copyText(e) {
  const old = () => {
    try {
      const t = document.createElement("textarea");
      ((t.value = e),
        (t.readOnly = !0),
        (t.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;"),
        document.body.appendChild(t),
        t.focus(),
        t.select(),
        t.setSelectionRange(0, e.length));
      const s = document.execCommand("copy");
      return (t.remove(), s);
    } catch (e) {
      return !1;
    }
  };
  return navigator.clipboard && navigator.clipboard.writeText
    ? navigator.clipboard.writeText(e).then(
        () => !0,
        () => old(),
      )
    : Promise.resolve(old());
}
((Game.prototype.graphicsChanged = function () {
  if (
    (setFastLeaves("fast" === this.settings.graphics),
    this.chunkWorker && this.chunkWorker.ready && this.chunkWorker.opts(),
    this.world)
  )
    for (const e of this.world.chunks.values()) e.dirty = ALL_SECTIONS;
}),
  (Game.prototype.perfReport = function (e = 1e4) {
    const t = this.ui;
    PerfMon.record(this, e, (e) => {
      (console.log(e),
        copyText(e).then((e) =>
          t.message(
            e
              ? "[调试]：性能报告已复制到剪贴板"
              : "[调试]：性能报告已输出到浏览器控制台（无法写入剪贴板）",
            "#FFFF55",
          ),
        ));
    }) && t.message(`[调试]：正在记录性能数据（${e / 1e3} 秒）…`, "#FFFF55");
  }),
  (Game.prototype.longRun = function (e = 60) {
    if (this.longRunTimer) return "已经在运行";
    if ("play" !== this.state || "creative" !== this.mode) return "先进入一个创造模式的世界";
    const t = this,
      s = t.ui,
      i = t.player,
      n = [],
      r = PerfMon.N,
      h = t.settings.renderDist,
      o = i.pos[1];
    let a = 0,
      c = PerfMon.i;
    const setRD = (e) => {
        t.settings.renderDist !== e && ((t.settings.renderDist = e), t.applySettings());
      },
      u = t.noLockPause;
    t.noLockPause = !0;
    const finish = () => {
      (clearInterval(t.longRunTimer),
        (t.longRunTimer = null),
        (t.longRunStop = null),
        (t.noLockPause = u),
        s.screen && s.open(null),
        setRD(h),
        (t.longRunRows = n));
      const e = Object.keys(n[0] || {}),
        i = [e.join(","), ...n.map((t) => e.map((e) => t[e]).join(","))].join("\n"),
        r = document.createElement("a");
      ((r.href = URL.createObjectURL(new Blob([i], { type: "text/csv" }))),
        (r.download = `longrun-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.csv`),
        r.click(),
        setTimeout(() => URL.revokeObjectURL(r.href), 5e3),
        s.message(`[调试]：长时间测试结束（${n.length} 秒），数据已下载`, "#FFFF55"));
    };
    return (
      (t.longRunTimer = setInterval(() => {
        a++;
        const u = (PerfMon.i - c + r) % r,
          l = [];
        for (let e = 0; e < u; e++) l.push(PerfMon.dt[(c + e) % r]);
        ((c = PerfMon.i), l.sort((e, t) => e - t));
        const p = l.reduce((e, t) => e + t, 0);
        let m = 0,
          d = 0;
        for (const e of t.entities) e instanceof Mob ? m++ : e instanceof ItemEntity && d++;
        const f = PerfMon.memory(t);
        (n.push({
          sec: a,
          fps: p ? +((1e3 * l.length) / p).toFixed(1) : 0,
          p99ms: l.length ? +l[Math.floor(0.99 * l.length)].toFixed(1) : 0,
          maxms: l.length ? +l[l.length - 1].toFixed(1) : 0,
          entities: t.entities.length,
          mobs: m,
          items: d,
          pending: t.pendingMobs ? t.pendingMobs.length : 0,
          chunks: t.world.chunks.size,
          sections: t.renderer.sections.size,
          heapMB: f.heap ? Math.round(f.heap) : "",
          meshMB: null != f.mesh ? +f.mesh.toFixed(1) : "",
          meshAllocMB: null != f.meshAlloc ? +f.meshAlloc.toFixed(1) : "",
          meshPages: t.renderer.arena ? t.renderer.arena.pages.length : "",
          resScale: DynRes.scale.toFixed(2),
          backoff: t.pacer.backoff.toFixed(2),
          renderDist: t.settings.renderDist,
          screen: s.screen ? s.screen.constructor.name : "",
        }),
          s.screen ||
            ((i.flying = !0),
            (i.pos[0] += 4),
            (i.pos[1] = Math.max(
              o,
              (t.world.isLoaded(Math.floor(i.pos[0]), Math.floor(i.pos[2]))
                ? t.world.surfaceY(Math.floor(i.pos[0]), Math.floor(i.pos[2]))
                : 0) + 12,
            )),
            (i.prev = [...i.pos]),
            (i.vel = [0, 0, 0])));
        const g = a % 180;
        (g % 20 == 5
          ? s.open(new CraftingScreen(t, 2))
          : g % 20 == 8 && s.screen instanceof CraftingScreen && s.open(null),
          g % 45 == 30
            ? s.open(new PauseScreen(t))
            : g % 45 == 32 && s.screen instanceof PauseScreen && s.open(null),
          g % 90 == 60 ? setRD(Math.min(16, h + 4)) : g % 90 == 70 && setRD(h),
          a >= 60 * e && finish());
      }, 1e3)),
      (t.longRunStop = finish),
      s.message(`[调试]：长时间测试开始（${e} 分钟）`, "#FFFF55"),
      "开始"
    );
  }));
//# sourceURL=js/perf.js
