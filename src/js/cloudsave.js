"use strict";
const CloudSave = (() => {
  const t = new Map();
  let e = 0;
  const lsKey = (t) => "mcjs-cloud-dirty-" + t;
  function dirtyOf(e) {
    let o = t.get(e);
    if (!o) {
      o = new Set();
      try {
        for (const t of JSON.parse(localStorage.getItem(lsKey(e)) || "[]")) o.add(t);
      } catch (t) {}
      t.set(e, o);
    }
    return o;
  }
  let o = null;
  const persist = () => {
      (clearTimeout(o),
        (o = setTimeout(() => {
          for (const [e, o] of t)
            try {
              o.size
                ? localStorage.setItem(lsKey(e), JSON.stringify([...o]))
                : localStorage.removeItem(lsKey(e));
            } catch (t) {}
        }, 500)));
    },
    sidOf = (t, e) => ("o" === e ? t : t + "~" + ("n" === e ? "nether" : "end")),
    n = DB.putChunks.bind(DB);
  async function encode(t) {
    const e = new Uint8Array(t.b.buffer, t.b.byteOffset, t.b.byteLength),
      o = new Uint8Array(t.m.buffer, t.m.byteOffset, t.m.byteLength),
      n = t.w ? new Uint8Array(t.w.buffer, t.w.byteOffset, t.w.byteLength) : new Uint8Array(0),
      s = new Uint8Array(12 + e.length + o.length + n.length),
      a = new DataView(s.buffer);
    return (
      a.setUint32(0, t.b.length),
      a.setUint32(4, t.m.length),
      a.setUint32(8, t.w ? t.w.length : 0),
      s.set(e, 12),
      s.set(o, 12 + e.length),
      s.set(n, 12 + e.length + o.length),
      NBT.deflate(s, "deflate")
    );
  }
  async function decode(t) {
    const e = await NBT.inflate(t, "deflate"),
      o = new DataView(e.buffer, e.byteOffset, e.byteLength),
      n = o.getUint32(0),
      s = o.getUint32(4),
      a = o.getUint32(8),
      copy = (t, o, n, s) => {
        const a = new n(o);
        return (new Uint8Array(a.buffer).set(e.subarray(t, t + o * s)), a);
      },
      i = { b: copy(12, n, Uint16Array, 2), m: copy(12 + 2 * n, s, Uint16Array, 2) };
    return (a && (i.w = copy(12 + 2 * n + 2 * s, a, Uint32Array, 4)), i);
  }
  function pack(t, e) {
    const o = new TextEncoder(),
      n = o.encode(JSON.stringify(t));
    let s = 12 + n.length;
    for (const [t, o] of e) s += 6 + t.length + o.length;
    const a = new Uint8Array(s),
      i = new DataView(a.buffer);
    (a.set(o.encode("OMCC")),
      i.setUint32(4, n.length),
      a.set(n, 8),
      i.setUint32(8 + n.length, e.length));
    let r = 12 + n.length;
    for (const [t, n] of e)
      (i.setUint16(r, t.length),
        a.set(o.encode(t), r + 2),
        (r += 2 + t.length),
        i.setUint32(r, n.length),
        a.set(n, r + 4),
        (r += 4 + n.length));
    return a;
  }
  async function post(t, e) {
    let o;
    const n = new TextEncoder().encode("OPMCT" + Account.token),
      s = new Uint8Array(n.length + e.length);
    (s.set(n), s.set(e, n.length));
    try {
      o = await fetch(RoomService.base() + t, { method: "POST", body: s });
    } catch (t) {
      throw new Error("游戏正在更新中…请稍后（云存档暂时没有同步）");
    }
    const a = await o.json().catch(() => ({ error: "游戏正在更新中…请稍后" }));
    return { status: o.status, j: a };
  }
  DB.putChunks = async function (t, o) {
    const s = await n(t, o);
    if (!e && o.length) {
      const [e, n] = ((t) => {
          const e = t.indexOf("~");
          return e < 0 ? [t, "o"] : [t.slice(0, e), "nether" === t.slice(e + 1) ? "n" : "e"];
        })(t),
        s = dirtyOf(e);
      for (const [t, e] of o) s.add(`${n}:${t}:${e}`);
      persist();
    }
    return s;
  };
  const metaOut = (t) => {
    const e = { ...t };
    return (delete e.cloud, e);
  };
  let s = !1;
  return {
    get busy() {
      return s;
    },
    dirtyCount: (t) => dirtyOf(t).size,
    async sync(t, e = {}) {
      if (!Account.loggedIn || !t || !RoomService.base()) return { skipped: !0 };
      if (s) return { busy: !0 };
      s = !0;
      try {
        const o = t.cloud || {},
          n = !o.rev || e.force,
          s = dirtyOf(t.id);
        let a;
        if (n) {
          a = [];
          for (const e of ["o", "n", "e"])
            for (const o of await DB.chunkKeys(sidOf(t.id, e)))
              a.push(`${e}:${Math.floor(o / 65536) - 32768}:${(o % 65536) - 32768}`);
        } else a = [...s];
        if (!n && !a.length && o.played === t.lastPlayed) return { upToDate: !0 };
        let i = o.rev || 0,
          r = !0,
          c = null,
          l = 0,
          d = 0;
        do {
          const o = [];
          let n = 0;
          for (; l < a.length && n < 6291456; l++) {
            const [e, s, i] = a[l].split(":"),
              r = await DB.getChunk(sidOf(t.id, e), +s, +i);
            if (!r) continue;
            const c = await encode(r);
            (o.push([a[l], c]), (n += c.length));
          }
          const s = {
              wid: t.id,
              meta: metaOut(t),
              base: i,
              device: Account.device(),
              force: !!e.force && r,
              replace: !!e.force && r,
            },
            { status: h, j: u } = await post("/api/cloud/push", pack(s, o));
          if (u.conflict) return { conflict: !0, cloud: u };
          if (u.full) return { full: !0, used: u.used, quota: u.quota };
          if (200 !== h) throw new Error(u.error || "云存档同步失败");
          ((i = u.rev),
            (c = u),
            (r = !1),
            (d += o.length),
            e.progress && e.progress(a.length ? l / a.length : 1));
        } while (l < a.length);
        for (const t of a) s.delete(t);
        (persist(),
          (t.cloud = {
            rev: i,
            at: Date.now(),
            played: t.lastPlayed,
            size: c.size,
            expires: c.expires,
          }));
        const h = await DB.getWorld(t.id).catch(() => null);
        return (
          h && (await DB.putWorld(Object.assign(h, { cloud: t.cloud }))),
          "undefined" != typeof game &&
            game.worldMeta &&
            game.worldMeta.id === t.id &&
            game.worldMeta !== t &&
            (game.worldMeta.cloud = t.cloud),
          { ok: !0, sent: d, rev: i, used: c.used, quota: c.quota }
        );
      } finally {
        s = !1;
      }
    },
    list: async () => Account.api("/api/cloud"),
    async download(t, o) {
      const n = await DB.getWorld(t),
        s = (n && n.cloud && !dirtyOf(t).size && n.cloud.rev) || 0,
        a = await fetch(RoomService.base() + "/api/cloud/" + t, {
          method: "POST",
          body: JSON.stringify({ _t: Account.token, since: s }),
        });
      if (!a.ok) throw new Error("下载失败");
      const { head: i, chunks: r } = (function unpack(t) {
        const e = new DataView(t.buffer, t.byteOffset, t.byteLength),
          o = new TextDecoder();
        if ("OMCC" !== o.decode(t.subarray(0, 4))) throw new Error("云端数据不对");
        const n = e.getUint32(4),
          s = JSON.parse(o.decode(t.subarray(8, 8 + n)));
        let a = 8 + n;
        const i = e.getUint32(a);
        a += 4;
        const r = [];
        for (let n = 0; n < i; n++) {
          const n = e.getUint16(a),
            s = o.decode(t.subarray(a + 2, a + 2 + n));
          a += 2 + n;
          const i = e.getUint32(a);
          (r.push([s, t.subarray(a + 4, a + 4 + i)]), (a += 4 + i));
        }
        return { head: s, chunks: r };
      })(new Uint8Array(await a.arrayBuffer()));
      e++;
      try {
        s || (await DB.deleteWorld(t));
        const e = { o: [], n: [], e: [] };
        let n = 0;
        for (const [t, s] of r) {
          const [a, i, c] = t.split(":");
          (e[a].push([+i, +c, await decode(s)]),
            ++n % 50 == 0 && (o && o(n / r.length), await new Promise((t) => setTimeout(t, 0))));
        }
        for (const o of ["o", "n", "e"])
          for (let n = 0; n < e[o].length; n += 64)
            await DB.putChunks(sidOf(t, o), e[o].slice(n, n + 64));
        const a = Object.assign({}, i.meta, {
          id: t,
          cloud: { rev: i.rev, at: Date.now(), played: i.meta.lastPlayed },
        });
        return (await DB.putWorld(a), dirtyOf(t).clear(), persist(), a);
      } finally {
        e--;
      }
    },
    async remove(t) {
      await Account.api("/api/cloud/" + t + "/delete", {});
      const e = await DB.getWorld(t);
      e && e.cloud && (delete e.cloud, await DB.putWorld(e));
    },
    touch(t) {
      Account.loggedIn &&
        RoomService.base() &&
        Account.api("/api/cloud/" + t + "/touch", {}).catch(() => {});
    },
  };
})();
(() => {
  const say = (t, e) => {
      !e ||
        e.skipped ||
        e.upToDate ||
        e.busy ||
        (e.ok
          ? t.ui.message("云存档已同步", "#AAAAAA")
          : e.full
            ? t.ui.message(
                `云存档空间满了（${(e.used / 1048576).toFixed(0)} / ${(e.quota / 1048576).toFixed(0)} MB）：存档列表 → 云端存档 里删掉不要的`,
                "#FFAA00",
              )
            : e.conflict &&
              t.ui.message("这个世界在别的设备上也改过：下次进入时选择保留哪一份", "#FFAA00"));
    },
    t = Game.prototype.quitToTitle;
  ((Game.prototype.quitToTitle = async function () {
    const e = !this.net && this.worldMeta ? this.worldMeta : null,
      o = await t.call(this);
    return (
      e &&
        DB.getWorld(e.id)
          .catch(() => null)
          .then((t) => CloudSave.sync(t || e))
          .then(
            (t) => say(this, t),
            (t) => this.ui.message(t.message, "#FF5555"),
          ),
      o
    );
  }),
    setInterval(() => {
      const t = "undefined" != typeof game && game;
      t &&
        "play" === t.state &&
        !t.net &&
        t.worldMeta &&
        Account.loggedIn &&
        (Date.now() - (t.cloudAt || t.worldMeta.lastPlayed || 0) < 6e5 ||
          ((t.cloudAt = Date.now()),
          t
            .saveWorld(!0)
            .then(() => CloudSave.sync(t.worldMeta))
            .then(
              (e) => say(t, e),
              () => {},
            )));
    }, 6e4));
  const closing = () => {
    const t = "undefined" != typeof game && game;
    t &&
      "play" === t.state &&
      !t.net &&
      t.worldMeta &&
      t
        .saveWorld(!0)
        .then(() => CloudSave.sync(t.worldMeta))
        .catch(() => {});
  };
  (Toy.onPageClose(closing).catch(() => {}),
    document.addEventListener("visibilitychange", () => {
      document.hidden && closing();
    }));
})();
class CloudScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, "云端存档"),
      (this.parent = e),
      (this.pauses = !1),
      (this.titleY = 8),
      (this.data = null),
      (this.local = new Map()),
      (this.note = ""),
      (this.noteColor = "#A0A0A0"),
      (this.confirm = null),
      this.load());
  }
  say(t, e) {
    ((this.note = t), (this.noteColor = e ? "#FF6060" : "#A0A0A0"));
  }
  async load() {
    try {
      this.data = await CloudSave.list();
      for (const t of await DB.listWorlds()) this.local.set(t.id, t);
    } catch (t) {
      ((this.data = { worlds: [], used: 0, quota: 0 }), this.say(t.message, !0));
    }
    this.game.ui.screen === this && this.layout();
  }
  rows() {
    return Math.max(2, Math.floor((this.game.ui.h - 40 - 64) / 26));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      o = (this.data && this.data.worlds) || [],
      n = this.rows();
    ((this.widgets = []),
      o.slice(0, n).forEach((t, o) => {
        const n = 36 + 26 * o,
          s = this.local.get(t.wid),
          a = !s || !s.cloud || s.cloud.rev < t.rev;
        this.widgets.push(
          {
            x: e + 62,
            y: n,
            w: 48,
            h: 20,
            label: s ? (a ? "更新" : "已同步") : "下载",
            enabled: a,
            tip: [s ? "用云端的版本替换这台设备上的" : "下载到这台设备"],
            onClick: () => this.down(t),
          },
          {
            x: e + 112,
            y: n,
            w: 48,
            h: 20,
            label: this.confirm === t.wid ? "确定？" : "删除",
            tip: ["只删云端的这一份，这台设备上的不动"],
            onClick: () => this.del(t),
          },
        );
      }),
      this.widgets.push({
        x: e - 100,
        y: t.h - 28,
        w: 200,
        h: 20,
        label: "完成",
        onClick: () => this.back(),
      }));
  }
  back() {
    const t = this.parent;
    (t instanceof WorldListScreen &&
      DB.listWorlds()
        .then((e) => {
          ((t.worlds = e), (t.sel = -1), this.game.ui.screen === t && t.layout());
        })
        .catch(() => {}),
      this.game.ui.open(t));
  }
  async down(t) {
    const e = this.local.get(t.wid),
      go = async () => {
        (this.say("正在下载 " + t.name + "…"), this.layout());
        try {
          (await CloudSave.download(t.wid, (e) =>
            this.say(`正在下载 ${t.name}… ${Math.round(100 * e)}%`),
          ),
            this.say("已下载：" + t.name),
            await this.load());
        } catch (t) {
          this.say(t.message, !0);
        }
        this.game.ui.open(this);
      };
    e && CloudSave.dirtyCount(t.wid)
      ? this.game.ui.open(
          new ConfirmScreen(
            this.game,
            "用云端的版本替换？",
            `这台设备上的“${e.name}”有还没上传的改动，替换后会丢失`,
            "替换",
            (t) => (t ? go() : this.game.ui.open(this)),
          ),
        )
      : go();
  }
  async del(t) {
    if (this.confirm !== t.wid) return ((this.confirm = t.wid), void this.layout());
    this.confirm = null;
    try {
      (await CloudSave.remove(t.wid), this.say("已从云端删除：" + t.name), await this.load());
    } catch (t) {
      this.say(t.message, !0);
    }
  }
  drawExtra(t) {
    const e = t.ctx,
      o = t.w / 2,
      n = this.data;
    n
      ? (Font.center(
          e,
          `已用 ${(n.used / 1048576).toFixed(1)} / ${(n.quota / 1048576).toFixed(0)} MB　·　${n.expireDays} 天没打开的云端存档会自动删除（设备上的不受影响）`,
          o,
          20,
          "#A0A0A0",
        ),
        n.worlds.length ||
          Font.center(e, "云端还没有存档：登录后玩单人世界，退出时会自动上传", o, 60, "#A0A0A0"),
        n.worlds.slice(0, this.rows()).forEach((t, n) => {
          const s = 36 + 26 * n,
            a = Math.max(0, Math.ceil((t.expires - Date.now()) / 864e5));
          ((e.fillStyle = "rgba(0,0,0,0.35)"),
            e.fillRect(o - 160, s, 220, 20),
            Font.draw(e, fitText(t.name, 150), o - 157, s + 2, "#FFFFFF"),
            Font.draw(
              e,
              fitText(
                `${(t.size / 1048576).toFixed(1)} MB · ${new Date(t.updated).toLocaleDateString()} · ${t.device || ""}`,
                214,
              ),
              o - 157,
              s + 11,
              "#909090",
            ),
            Font.draw(e, `${a}天`, o + 34, s + 2, a <= 2 ? "#FF8080" : "#80FF80"));
        }),
        this.note && Font.center(e, fitText(this.note, t.w - 8), o, t.h - 40, this.noteColor))
      : Font.center(e, "正在读取…", o, 50, "#A0A0A0");
  }
  onEsc() {
    this.back();
  }
}
class CloudConflictScreen extends MenuScreen {
  constructor(t, e, o, n) {
    (super(t, "存档在两台设备上都改过"),
      (this.meta = e),
      (this.cloud = o),
      (this.then = n),
      (this.pauses = !1),
      (this.busy = !1),
      (this.note = ""));
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      o = Math.floor(t.h / 2);
    this.widgets = [
      {
        x: e - 152,
        y: o,
        w: 148,
        h: 20,
        label: "用云端的",
        enabled: !this.busy,
        tip: ["这台设备上没上传的改动会丢失"],
        onClick: () => this.pick(!0),
      },
      {
        x: e + 4,
        y: o,
        w: 148,
        h: 20,
        label: "用这台设备的",
        enabled: !this.busy,
        tip: ["云端的那份会被这台设备上的替换"],
        onClick: () => this.pick(!1),
      },
      {
        x: e - 100,
        y: o + 30,
        w: 200,
        h: 20,
        label: "先不管（只玩这台设备上的）",
        enabled: !this.busy,
        onClick: () => this.then(!1),
      },
    ];
  }
  async pick(t) {
    ((this.busy = !0),
      (this.note = t ? "正在下载云端的版本…" : "正在上传这台设备上的版本…"),
      this.layout());
    try {
      if (t) await CloudSave.download(this.meta.id);
      else {
        if ((await CloudSave.sync(this.meta, { force: !0 })).full)
          throw new Error("云存档空间不够了");
      }
      this.then(!0);
    } catch (t) {
      ((this.busy = !1), (this.note = t.message), this.layout());
    }
  }
  drawExtra(t) {
    const e = t.ctx,
      o = t.w / 2,
      n = Math.floor(t.h / 2) - 44,
      s = this.cloud || {};
    (Font.center(e, `“${this.meta.name}”`, o, n, "#FFFFFF"),
      Font.center(
        e,
        fitText(
          `云端：${s.updated ? new Date(s.updated).toLocaleString() : "?"}，来自 ${s.device || "另一台设备"}`,
          t.w - 8,
        ),
        o,
        n + 14,
        "#A0A0A0",
      ),
      Font.center(
        e,
        fitText(`这台设备：${new Date(this.meta.lastPlayed).toLocaleString()}`, t.w - 8),
        o,
        n + 26,
        "#A0A0A0",
      ),
      this.note && Font.center(e, this.note, o, n + 92, "#FFD24A"));
  }
  onEsc() {}
}
((() => {
  const t = Game.prototype.loadWorld;
  Game.prototype.loadWorld = async function (e, ...o) {
    if (Account.loggedIn && RoomService.base() && !this.cloudChecked)
      try {
        const t = await DB.getWorld(e),
          n = (await CloudSave.list()).worlds.find((t) => t.wid === e);
        if (t && n && (!t.cloud || n.rev > t.cloud.rev)) {
          const s = this;
          if (!t.cloud || CloudSave.dirtyCount(e))
            return s.ui.open(
              new CloudConflictScreen(s, t, n, () => {
                ((s.cloudChecked = !0), s.loadWorld(e, ...o));
              }),
            );
          (s.ui.open(new LoadingScreen(s, "正在下载云端的新版本…")), await CloudSave.download(e));
        }
        CloudSave.touch(e);
      } catch (t) {}
    return ((this.cloudChecked = !1), t.call(this, e, ...o));
  };
})(),
  (() => {
    const t = WorldListScreen.prototype.layout;
    WorldListScreen.prototype.layout = function () {
      t.call(this);
      const e = this.game.ui.w / 2,
        o = this.game;
      Account.loggedIn &&
        this.widgets.push({
          x: e + 104,
          y: 22,
          w: 56,
          h: 20,
          label: "云端…",
          tip: ["云端存档：换设备也能接着玩"],
          onClick: () => {
            (o.ui.hideInput(), o.ui.open(new CloudScreen(o, this)));
          },
        });
    };
    const e = WorldListScreen.prototype.drawExtra;
    WorldListScreen.prototype.drawExtra = function (t) {
      if ((e.call(this, t), !Account.loggedIn || !this.worlds)) return;
      const o = t.ctx,
        n = t.w / 2,
        s = Math.floor(n - this.rowW / 2) + 2,
        a = this.listTop,
        i = this.listBottom,
        r = this.shown(),
        c = Math.floor((i - a - 4) / 36);
      (o.save(),
        o.beginPath(),
        o.rect(0, a, t.w, i - a),
        o.clip(),
        r.slice(this.scroll, this.scroll + c + 1).forEach((t, e) => {
          const n = a + 4 + 36 * e,
            i = t.cloud,
            r = CloudSave.dirtyCount(t.id),
            c = i ? (r ? "☁ 有改动" : "☁ 已同步") : "☁ 未上传",
            l = i ? (r ? "#FFD24A" : "#80C0FF") : "#808080";
          if ((Font.draw(o, c, s + this.rowW - 8 - Font.width(c), n + 1, l), i && i.expires)) {
            const t = Math.max(0, Math.ceil((i.expires - Date.now()) / 864e5)),
              e = `云端保留 ${t} 天`;
            Font.draw(
              o,
              e,
              s + this.rowW - 8 - Font.width(e),
              n + 12,
              t <= 2 ? "#FF8080" : "#707070",
            );
          }
        }),
        o.restore());
    };
    const o = Game.prototype.startTitle;
    Game.prototype.startTitle = function (...t) {
      const e = o.apply(this, t);
      return (
        Account.loggedIn &&
          RoomService.base() &&
          !this.cloudWarned &&
          ((this.cloudWarned = !0),
          CloudSave.list()
            .then((t) => {
              const e = t.worlds.filter((t) => t.expires - Date.now() < 1728e5);
              e.length &&
                (this.titleNote = {
                  text: `云端存档“${e[0].name}”${e.length > 1 ? ` 等 ${e.length} 个` : ""}快要过期了：打开玩一下就会重新保留 ${t.expireDays} 天`,
                  color: "#FFD24A",
                });
            })
            .catch(() => {})),
        e
      );
    };
    const n = TitleScreen.prototype.drawExtra;
    TitleScreen.prototype.drawExtra = function (t) {
      n.call(this, t);
      const e = this.game.titleNote;
      e
        ? Font.center(t.ctx, fitText(e.text, t.w - 8), t.w / 2, t.h - 22, e.color)
        : Account.loggedIn ||
          Font.center(
            t.ctx,
            fitText("登录后可以联机、云存档、换皮肤和披风", t.w - 8),
            t.w / 2,
            t.h - 22,
            "#A0A0A0",
          );
    };
  })());
//# sourceURL=js/cloudsave.js
