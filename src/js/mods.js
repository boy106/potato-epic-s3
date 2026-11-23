"use strict";
const Mods = {
  KEY: "mcjs-mods",
  active: [],
  always: [],
  BOOT: "mcjs-mods-boot",
  boot: null,
  index: null,
  defs: {},
  state() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) || "{}") || {};
    } catch (t) {
      return {};
    }
  },
  save(t) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(t));
    } catch (t) {}
  },
  init() {
    const t = this.state(),
      ok = (t) => /^[a-z0-9_]{1,32}$/.test(t),
      e = "undefined" != typeof location && /[?&]nomods\b/.test(location.search);
    this.always = (("undefined" != typeof self && self.MODS_ALWAYS) || []).filter(ok);
    let i = null;
    try {
      ((i = JSON.parse(sessionStorage.getItem(this.BOOT) || "null")),
        sessionStorage.removeItem(this.BOOT));
    } catch (t) {
      i = null;
    }
    try {
      const t = JSON.parse(localStorage.getItem(this.BOOT) || "null");
      (localStorage.removeItem(this.BOOT),
        !i && t && t.req && Math.abs(Date.now() - t.t) < 6e4 && (i = t.req));
    } catch (t) {}
    const s =
      !e && "undefined" != typeof location && /[?&]modtest=([a-z0-9_,]+)/.exec(location.search);
    ((this.testing = s ? s[1].split(",").filter(ok) : []),
      !i &&
        this.testing.length &&
        (i = {
          mods: this.testing,
          create: ["模组测试", "potato", "creative", !1, { cheats: !0, difficulty: 2 }],
        }),
      i && Array.isArray(i.mods)
        ? ((this.boot = i),
          (this.active = e
            ? []
            : [
                ...new Set(
                  i.mods.filter(
                    (e) =>
                      ok(e) &&
                      (this.always.includes(e) ||
                        this.testing.includes(e) ||
                        (t.downloaded && t.downloaded[e])),
                  ),
                ),
              ]))
        : (this.active = []),
      self.POTATO && (this.active = [...new Set([...this.always, ...this.active])]));
  },
  same: (t, e) => [...new Set(t || [])].sort().join(",") === [...new Set(e || [])].sort().join(","),
  reloadWith(t, e) {
    const i = { mods: [...new Set(t || [])], ...(e || {}) };
    try {
      sessionStorage.setItem(this.BOOT, JSON.stringify(i));
    } catch (t) {}
    try {
      localStorage.setItem(this.BOOT, JSON.stringify({ t: Date.now(), req: i }));
    } catch (t) {}
    location.reload();
  },
  downloaded() {
    return ((this.index && this.index.mods) || []).filter((t) => this.isDownloaded(t.id));
  },
  nameOf(t) {
    const e = this.index && (this.index.mods || []).find((e) => e.id === t);
    return (e && e.name) || t;
  },
  dir: (t) => "mods/" + t + "/",
  stage(t) {
    for (const e of this.active)
      ((self.BOOT_EXTRA = (self.BOOT_EXTRA || 0) + 1),
        document.write('<script src="' + this.dir(e) + t + '.js"><\/script>'));
  },
  workerQuery() {
    return this.active.length ? "?mods=" + this.active.join(",") : "";
  },
  has(t) {
    return this.active.includes(t);
  },
  register(t, e) {
    this.defs[t] = Object.assign({ id: t }, e);
  },
  async loadIndex() {
    if (this.index) return this.index;
    const t = await fetch("mods/index.json", { cache: "no-cache" });
    if (!t.ok) throw new Error("读取模组列表失败（" + t.status + "）");
    return (this.index = await t.json());
  },
  isDownloaded(t) {
    const e = this.state();
    return (
      this.always.includes(t) ||
      (this.testing || []).includes(t) ||
      !(!e.downloaded || !e.downloaded[t])
    );
  },
  dl: null,
  download(t, e, i = !1) {
    const s = this.dl;
    if (s && s.id === t.id)
      return (
        e && s.listeners.push(e),
        !i && s.background && ((s.background = !1), s.more(4)),
        s.promise
      );
    if (s) return Promise.reject(new Error("正在下载另一个模组"));
    const o = this.state(),
      n = (o.partial && o.partial[t.id]) || {},
      a = n.version === t.version,
      d = a ? new Set(n.files || []) : new Set(),
      r = (this.dl = {
        id: t.id,
        total: t.size || 0,
        done: a ? Math.min(n.bytes || 0, t.size || 0) : 0,
        background: i,
        listeners: e ? [e] : [],
      }),
      tell = () => {
        for (const t of r.listeners) t(r.done, r.total);
      },
      remember = (e, i) => {
        const s = this.state(),
          o = (s.partial || (s.partial = {}))[t.id] || { version: t.version, files: [], bytes: 0 };
        (o.version !== t.version && ((o.version = t.version), (o.files = []), (o.bytes = 0)),
          o.files.push(e),
          (o.bytes += i),
          (s.partial[t.id] = o),
          this.save(s));
      },
      l = t.files.filter((t) => !d.has(t)),
      one = async (e) => {
        const i = await fetch(this.dir(t.id) + e, { cache: "no-cache" });
        if (!i.ok) throw new Error(e + "：" + i.status);
        let s = 0;
        const o = i.body && i.body.getReader ? i.body.getReader() : null;
        if (o)
          for (;;) {
            const { done: t, value: e } = await o.read();
            if (t) break;
            ((s += e.length), (r.done += e.length), tell());
          }
        else ((s = (await i.arrayBuffer()).byteLength), (r.done += s), tell());
        remember(e, s);
      };
    let c = 0,
      h = null;
    const f = [],
      worker = async () => {
        for (; c < l.length && !h;)
          try {
            await one(l[c++]);
          } catch (t) {
            h = h || t;
          }
      };
    return (
      (r.more = (t) => {
        for (let e = 0; e < t; e++) f.push(worker());
      }),
      r.more(Math.min(i ? 2 : 6, l.length || 1)),
      (r.promise = (async () => {
        try {
          for (let t = 0; t < f.length; t++) await f[t];
          if (h) throw h;
          const e = this.state();
          if (r.background) {
            const i = (e.partial || (e.partial = {}))[t.id] || {
              version: t.version,
              files: [],
              bytes: 0,
            };
            ((i.complete = !0), (e.partial[t.id] = i));
          } else
            (((e.downloaded || (e.downloaded = {}))[t.id] = t.version),
              e.partial && delete e.partial[t.id],
              e.removed && (e.removed = e.removed.filter((e) => e !== t.id)),
              t.tutorial && t.tutorial.mod && (e.downloaded[t.tutorial.mod] = "with " + t.id));
          (this.save(e), (r.done = r.total), tell());
        } finally {
          this.dl === r && (this.dl = null);
        }
      })()),
      r.promise
    );
  },
  async prefetch() {
    try {
      const t = navigator.connection;
      if (t && (t.saveData || /2g/.test(t.effectiveType || ""))) return;
      const e = await this.loadIndex(),
        i = this.state();
      for (const t of e.mods || []) {
        if (t.hidden || this.dl || this.isDownloaded(t.id) || (i.removed || []).includes(t.id))
          continue;
        const e = i.partial && i.partial[t.id];
        (e && e.version === t.version && e.complete) ||
          (await this.download(t, null, !0).catch(() => {}));
      }
    } catch (t) {}
  },
  markDownloaded(t) {
    const e = this.state();
    (((e.downloaded || (e.downloaded = {}))[t] = e.downloaded[t] || "marked"), this.save(e));
  },
  TUTORIALS: {
    tcdemo: { mod: "tcdemo", name: "匠魂教程地图", seed: "tcdemo" },
    fddemo: { mod: "fddemo", name: "农夫乐事教程地图", seed: "fddemo" },
  },
  tutorials() {
    const t = Object.assign({}, this.TUTORIALS);
    for (const e of (this.index && this.index.mods) || [])
      e.tutorial && e.tutorial.mod && (t[e.tutorial.mod] = e.tutorial);
    return t;
  },
  isTutorial(t) {
    return !!this.tutorials()[t];
  },
  tutorialOf(t) {
    if (!t) return null;
    if (t.tutorialMap) return t.tutorialMap;
    const e = this.tutorials();
    for (const i of t.mods || []) {
      const s = e[i];
      if (
        s &&
        t.flat &&
        (t.name === s.name || ("function" == typeof hashStr && t.seed === hashStr(s.seed)))
      )
        return i;
    }
    return null;
  },
  ownMods(t, e) {
    const i = this.tutorialOf(t);
    return (e || (t && t.mods) || []).filter((t) => !this.isTutorial(t) || t === i);
  },
  listed(t) {
    const e = "undefined" != typeof Live ? Live.get("mods.hidden", []) : [];
    return ((t || this.index || {}).mods || []).filter((t) => !t.hidden && !e.includes(t.id));
  },
  remove(t) {
    const e = this.index && (this.index.mods || []).find((e) => e.id === t);
    if (e && e.tutorial && e.tutorial.mod) {
      const t = this.state();
      (t.downloaded && delete t.downloaded[e.tutorial.mod], this.save(t));
    }
    const i = this.state();
    (i.downloaded && delete i.downloaded[t],
      i.partial && delete i.partial[t],
      (i.enabled = (i.enabled || []).filter((e) => e !== t)),
      (i.removed = [...new Set([...(i.removed || []), t])]),
      this.save(i));
  },
};
(Mods.init(),
  "undefined" != typeof window &&
    "undefined" != typeof document &&
    window.addEventListener("load", () => {
      const go = () => Mods.prefetch();
      setTimeout(
        () => (window.requestIdleCallback ? requestIdleCallback(go, { timeout: 1e4 }) : go()),
        8e3,
      );
    }));
//# sourceURL=js/mods.js
