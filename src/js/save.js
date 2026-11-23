"use strict";
const LS = {
    ok: (() => {
      try {
        const e = "__mcjs_test";
        return (localStorage.setItem(e, "1"), localStorage.removeItem(e), !0);
      } catch (e) {
        return !1;
      }
    })(),
    get(e) {
      try {
        const t = localStorage.getItem(e);
        return t ? JSON.parse(t) : null;
      } catch (e) {
        return null;
      }
    },
    set(e, t) {
      localStorage.setItem(e, JSON.stringify(t));
    },
    keys(e) {
      const t = [];
      for (let o = 0; o < localStorage.length; o++) {
        const r = localStorage.key(o);
        r.startsWith(e) && t.push(r);
      }
      return t;
    },
  },
  DB = {
    NAME: "mc-js-clone",
    STORES: { worlds: { keyPath: "id" }, chunks: void 0 },
    db: null,
    mem: { worlds: new Map(), chunks: new Map() },
    ok: !1,
    backend: "memory",
    opens: 0,
    blocked: !1,
    open() {
      return new Promise((e) => {
        let t = !1,
          o = 0;
        const fin = (r) => {
          t ||
            ((t = !0),
            clearTimeout(o),
            r
              ? ((this.ok = !0), (this.backend = "idb"))
              : (this.backend = LS.ok ? "local" : "memory"),
            e(r));
        };
        ((o = setTimeout(() => fin(!0), 8e3)),
          this.conn().then(
            () => fin(!0),
            () => {
              t ? this.db || this.opens || (this.backend = LS.ok ? "local" : "memory") : fin(!1);
            },
          ));
      });
    },
    took(e) {
      ((this.db = e),
        (e.onclose = () => {
          ((e.gone = !0), this.db === e && (this.db = null));
        }),
        (e.onversionchange = () => this.drop(e)));
    },
    drop(e) {
      e.gone = !0;
      try {
        e.close();
      } catch (e) {}
      this.db === e && (this.db = null);
    },
    conn() {
      if (this.db) return Promise.resolve(this.db);
      if (!this.reopening) {
        const e = (this.reopening = this.connect().then(
          (t) => (this.reopening === e && (this.reopening = null), this.took(t), this.opens++, t),
          (t) => {
            throw (this.reopening === e && (this.reopening = null), t);
          },
        ));
        e.catch(() => {});
      }
      return this.reopening;
    },
    async connect() {
      let e;
      for (let t = 0; ; t++) {
        let o,
          r = !1;
        try {
          o = await this.req(e, () => {
            r = !0;
          });
        } catch (o) {
          if (o && "VersionError" === o.name && t < 4) {
            e = void 0;
            continue;
          }
          throw o;
        }
        r && this.note(e ? "save_db_repaired" : this.opens ? "save_db_recreated" : "save_db_new");
        const n = Object.keys(this.STORES).filter((e) => !o.objectStoreNames.contains(e));
        if (!n.length) {
          if (!this.opens)
            try {
              localStorage.setItem("mcjs-db", "1");
            } catch (e) {}
          return o;
        }
        e = o.version + 1;
        try {
          o.close();
        } catch (e) {}
        if (t >= 4) throw new Error("存档数据库缺少 " + n.join("、") + "，修复失败");
      }
    },
    req(e, t) {
      return new Promise((o, r) => {
        let n;
        try {
          n = e ? indexedDB.open(this.NAME, e) : indexedDB.open(this.NAME);
        } catch (e) {
          return void r(e);
        }
        ((n.onupgradeneeded = () => {
          const e = n.result;
          for (const [t, o] of Object.entries(this.STORES))
            e.objectStoreNames.contains(t) || e.createObjectStore(t, o);
          t();
        }),
          (n.onsuccess = () => {
            this.blocked = !1;
            const e = n.result;
            ((e.onversionchange = () => {
              ((e.gone = !0), e.close());
            }),
              o(e));
          }),
          (n.onerror = () => {
            ((this.blocked = !1), r(n.error || new Error("打不开存档数据库")));
          }),
          (n.onblocked = () => {
            this.blocked = !0;
          }));
      });
    },
    note(e) {
      if ("save_db_new" === e) {
        let t = null;
        try {
          t = localStorage.getItem("mcjs-db");
        } catch (e) {}
        t && (e = "save_db_gone");
      }
      "undefined" != typeof Telemetry && Telemetry.count && Telemetry.count(e);
    },
    wait() {
      if (this.db) return Promise.resolve(this.db);
      const e = this.conn();
      return new Promise((t, o) => {
        let r = 15e3,
          n = performance.now(),
          s = 0;
        const step = () => {
          const e = performance.now();
          ((r -= Math.min(1500, e - n)),
            (n = e),
            r > 0
              ? (s = setTimeout(step, 1e3))
              : o(
                  new Error(
                    this.blocked
                      ? "存档数据库被另一个打开着的游戏页面占用：关掉其他游戏页面再试"
                      : "存档数据库没有响应，稍后再试",
                  ),
                ));
        };
        ((s = setTimeout(step, 1e3)),
          e.then(
            (e) => {
              (clearTimeout(s), t(e));
            },
            (e) => {
              (clearTimeout(s), o(e));
            },
          ));
      });
    },
    stale: (e) =>
      !!e &&
      (/^(InvalidStateError|NotFoundError|UnknownError|AbortError)$/.test(e.name) ||
        /clos(ing|ed)|lost|deleted/i.test(e.message || "")),
    nice(e) {
      if (
        e &&
        ("QuotaExceededError" === e.name || 22 === e.code || /quota/i.test(e.message || ""))
      ) {
        const e = new Error(
          "存储空间不够了：删掉不玩的世界，或清理设备的存储空间 (QuotaExceededError)",
        );
        return ((e.name = "QuotaExceededError"), e);
      }
      return e;
    },
    async tx(e, t, o) {
      for (let r = 0; ; r++) {
        let n = null;
        try {
          return ((n = await this.wait()), await this.tx1(n, e, t, o));
        } catch (e) {
          if (!n || r >= 2 || (!n.gone && !this.stale(e)))
            throw this.nice(e || new Error("存档数据库出错"));
          this.drop(n);
        }
      }
    },
    tx1: (e, t, o, r) =>
      new Promise((n, s) => {
        const i =
            "readwrite" === o
              ? e.transaction(t, o, { durability: "relaxed" })
              : e.transaction(t, o),
          c = i.objectStore(t);
        let a, l;
        try {
          l = r(c);
        } catch (e) {
          try {
            i.abort();
          } catch (e) {}
          throw e;
        }
        (l &&
          "onsuccess" in l &&
          (l.onsuccess = () => {
            a = l.result;
          }),
          (i.oncomplete = () => n(a)),
          (i.onerror = (e) =>
            s((e && e.target && e.target.error) || i.error || new Error("存档数据库出错"))),
          (i.onabort = () => s(i.error || new Error("数据库事务被中止"))));
      }),
    async listWorlds() {
      let e;
      return (
        (e =
          "idb" === this.backend
            ? await this.tx("worlds", "readonly", (e) => e.getAll())
            : "local" === this.backend
              ? LS.keys("mcjs:w:")
                  .map((e) => LS.get(e))
                  .filter(Boolean)
              : [...this.mem.worlds.values()]),
        (e || []).sort((e, t) => t.lastPlayed - e.lastPlayed)
      );
    },
    async getWorld(e) {
      return "idb" === this.backend
        ? this.tx("worlds", "readonly", (t) => t.get(e))
        : "local" === this.backend
          ? LS.get("mcjs:w:" + e)
          : this.mem.worlds.get(e);
    },
    async putWorld(e) {
      if ("idb" === this.backend)
        try {
          return await this.tx("worlds", "readwrite", (t) => t.put(e));
        } catch (t) {
          if (!t || "DataCloneError" !== t.name) throw t;
          return (
            "undefined" != typeof Telemetry &&
              Telemetry.count &&
              Telemetry.count("save_clone_fixed"),
            this.tx("worlds", "readwrite", (t) => t.put(this.plain(e)))
          );
        }
      if ("local" !== this.backend) this.mem.worlds.set(e.id, e);
      else
        try {
          LS.set("mcjs:w:" + e.id, e);
        } catch (e) {
          throw this.nice(e);
        }
    },
    plain(e, t = new Set()) {
      if (null === e || "object" != typeof e)
        return "function" == typeof e || "symbol" == typeof e ? void 0 : e;
      if (
        ArrayBuffer.isView(e) ||
        e instanceof ArrayBuffer ||
        e instanceof Date ||
        ("undefined" != typeof Blob && e instanceof Blob)
      )
        return e;
      if (t.has(e)) return;
      let o;
      if ((t.add(e), Array.isArray(e))) o = e.map((e) => this.plain(e, t));
      else if (e instanceof Map) {
        o = new Map();
        for (const [r, n] of e) {
          const e = this.plain(n, t);
          void 0 !== e && o.set(r, e);
        }
      } else if (e instanceof Set) {
        o = new Set();
        for (const r of e) {
          const e = this.plain(r, t);
          void 0 !== e && o.add(e);
        }
      } else {
        const r = Object.getPrototypeOf(e);
        if (null === r || null === Object.getPrototypeOf(r)) {
          o = {};
          for (const r of Object.keys(e)) {
            const n = this.plain(e[r], t);
            void 0 !== n && (o[r] = n);
          }
        }
      }
      return (t.delete(e), o);
    },
    async deleteWorld(e) {
      if ("idb" === this.backend) {
        await this.tx("worlds", "readwrite", (t) => t.delete(e));
        for (const t of [e, e + "~nether", e + "~end"])
          await this.tx("chunks", "readwrite", (e) =>
            e.delete(IDBKeyRange.bound(t + ":", t + ":￿")),
          );
      } else if ("local" === this.backend) {
        localStorage.removeItem("mcjs:w:" + e);
        for (const t of [e, e + "~nether", e + "~end"])
          for (const e of LS.keys("mcjs:c:" + t + ":")) localStorage.removeItem(e);
      } else {
        this.mem.worlds.delete(e);
        for (const t of [...this.mem.chunks.keys()])
          (t.startsWith(e + ":") || t.startsWith(e + "~")) && this.mem.chunks.delete(t);
      }
    },
    async loadChunks(e) {
      const t = new Map();
      if ("idb" === this.backend)
        await this.tx("chunks", "readonly", (o) => {
          t.clear();
          const r = o.openCursor(IDBKeyRange.bound(e + ":", e + ":￿"));
          r.onsuccess = () => {
            const e = r.result;
            if (e) {
              const [, o, r] = e.key.split(":");
              (t.set(ckey(+o, +r), e.value), e.continue());
            }
          };
        });
      else if ("local" === this.backend)
        for (const o of LS.keys("mcjs:c:" + e + ":")) {
          const [, , , e, r] = o.split(":"),
            n = LS.get(o);
          n && t.set(ckey(+e, +r), this.lsChunk(n));
        }
      else
        for (const [o, r] of this.mem.chunks)
          if (o.startsWith(e + ":")) {
            const [, e, n] = o.split(":");
            t.set(ckey(+e, +n), r);
          }
      return t;
    },
    async chunkKeys(e) {
      const t = new Set(),
        add = (e) => {
          const [, o, r] = e.split(":");
          t.add(ckey(+o, +r));
        };
      if ("idb" === this.backend)
        for (const t of (await this.tx("chunks", "readonly", (t) =>
          t.getAllKeys(IDBKeyRange.bound(e + ":", e + ":￿")),
        )) || [])
          add(t);
      else if ("local" === this.backend)
        for (const t of LS.keys("mcjs:c:" + e + ":")) add(t.slice(7));
      else for (const t of this.mem.chunks.keys()) t.startsWith(e + ":") && add(t);
      return t;
    },
    async getChunk(e, t, o) {
      const r = e + ":" + t + ":" + o;
      if ("idb" === this.backend) return this.tx("chunks", "readonly", (e) => e.get(r));
      if ("local" === this.backend) {
        const e = LS.get("mcjs:c:" + r);
        return e ? this.lsChunk(e) : void 0;
      }
      return this.mem.chunks.get(r);
    },
    lsChunk(e) {
      const t = { b: new Uint16Array(e.b), m: new Uint16Array(e.m) };
      return (e.w && e.w.length && (t.w = new Uint32Array(e.w)), t);
    },
    async putChunks(e, t) {
      if (t.length) {
        if ("idb" === this.backend)
          return this.tx("chunks", "readwrite", (o) => {
            for (const [r, n, s] of t) o.put(s, e + ":" + r + ":" + n);
          });
        if ("local" !== this.backend)
          for (const [o, r, n] of t) this.mem.chunks.set(e + ":" + o + ":" + r, n);
        else
          try {
            for (const [o, r, n] of t)
              LS.set(
                "mcjs:c:" + e + ":" + o + ":" + r,
                n.w && n.w.length
                  ? { b: Array.from(n.b), m: Array.from(n.m), w: Array.from(n.w) }
                  : { b: Array.from(n.b), m: Array.from(n.m) },
              );
          } catch (e) {
            throw this.nice(e);
          }
      }
    },
  };
function encodeChunk(e) {
  const t = {
    b: new Uint16Array(rleEncode(e.flatBlocks())),
    m: new Uint16Array(rleEncode(e.flatMeta())),
  };
  return (e.wl && e.wl.size && (t.w = Uint32Array.from(e.wl)), t);
}
function decodeChunk(e, t) {
  const o = 256 * HEIGHT;
  (t.packFrom(rleDecode(e.b, o), rleDecode(e.m, o)),
    (t.wl = e.w && e.w.length ? new Set(e.w) : null),
    (t.lit = !1));
}
//# sourceURL=js/save.js
