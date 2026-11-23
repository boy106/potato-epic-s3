"use strict";
class ToyError extends Error {
  constructor(e, t, o) {
    (super(t || e), (this.type = e), (this.code = o));
  }
}
const Toy = (() => {
  const e = "toy-sdk-rpc",
    t = 1987439458;
  let o = !1;
  try {
    o = window.parent && window.parent !== window;
  } catch (e) {
    o = !0;
  }
  let n = 1,
    i = null,
    r = null;
  const a = new Map(),
    s = { containerChange: [], pageClose: [] },
    l = {};
  let c = null;
  const newMockId = () => "mock-" + Math.random().toString(36).slice(2, 12),
    u =
      /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ||
      location.pathname.includes("/toy/preview/");
  try {
    if (!u)
      throw (null !== localStorage.getItem("toymock") && localStorage.removeItem("toymock"), 0);
    const e = new URLSearchParams(location.search).get("toymock");
    null !== e &&
      localStorage.setItem("toymock", "0" === e ? "" : localStorage.getItem("toymock") || "{}");
    const t = localStorage.getItem("toymock");
    (t &&
      (c = Object.assign(
        { env: "app", login: !0, follow: !1, triple: !1, deny: !1, nickname: "测试玩家" },
        JSON.parse(t),
      )),
      !c ||
        (c.openId && "mock-open-id-0001" !== c.openId) ||
        ((c.openId = newMockId()), localStorage.setItem("toymock", JSON.stringify(c))));
  } catch (e) {
    c = null;
  }
  const saveMock = () => {
    try {
      localStorage.setItem("toymock", JSON.stringify(c));
    } catch (e) {}
  };
  function ready() {
    if (c) return Promise.resolve("none" !== c.env);
    if (!o) return Promise.resolve(!1);
    if (!i) {
      let t;
      const o = new Promise((e) => {
        t = e;
      });
      i = { p: o, res: t };
      const send = () => {
        try {
          window.parent.postMessage({ ns: e, type: "ready" }, "*");
        } catch (e) {}
      };
      (send(), setTimeout(send, 500), setTimeout(send, 1500), setTimeout(() => t(!1), 4e3));
    }
    return i.p;
  }
  async function call(t, o = {}, i = 15e3) {
    if (c)
      return (async function mockCall(e, t) {
        await new Promise((e) => setTimeout(e, 250));
        const o = "mobileweb" === c.env || "none" === c.env;
        if ("none" === c.env) throw new ToyError("unsupported", "mock: 不在 Toy");
        switch (e) {
          case "getUserProfile":
            if (o) throw new ToyError("unsupported", "mock: 外部浏览器");
            if (!c.login) throw new ToyError("not_logged_in", "mock: 未登录");
            if (c.deny) throw new ToyError("user_denied", "mock: 拒绝授权");
            return { face: "", uname: c.nickname, toyOpenId: c.openId };
          case "authorRelation":
            if (o) return { status: "unsupported" };
            if (!c.login) throw new ToyError("not_logged_in", "mock: 未登录");
            return { following: !!c.follow };
          case "videoUserActions":
            if (o) return { status: "unsupported", items: [] };
            if (!c.login) throw new ToyError("not_logged_in", "mock: 未登录");
            return {
              items: (t.videos || t.aids || []).map((e) => {
                const t = c.videos && c.videos[e];
                return t
                  ? { bvid: e, like: !!t.like, coin: t.coin ? 1 : 0, favorite: !!t.fav }
                  : { bvid: e, like: !!c.triple, coin: c.triple ? 1 : 0, favorite: !!c.triple };
              }),
            };
          case "inputSafety":
            return {
              status: /违规|测试违禁/.test(t.text) ? "risky" : "ok",
              passed: !/违规|测试违禁/.test(t.text),
            };
          case "navigate":
            return (
              "video" === t.req.type && (c.pendingTriple = !0),
              "space" === t.req.type && (c.pendingFollow = !0),
              setTimeout(() => {
                (c.pendingTriple && (c.triple = !0),
                  c.pendingFollow && (c.follow = !0),
                  (c.pendingTriple = c.pendingFollow = !1),
                  saveMock(),
                  panel());
              }, 1500),
              null
            );
          case "share":
          case "containerSubscribe":
          case "playerSubscribe":
            return null;
          case "qrCode":
            return { base64: "", url: location.href };
          case "jsb":
            return "toy.getContainerState" === t.method
              ? {
                  deviceType: "phone",
                  orientation: "landscape",
                  immersive: !0,
                  safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
                  viewport: { width: innerWidth, height: innerHeight },
                }
              : "toy.getAbilities" === t.method
                ? {
                    abilities: o
                      ? []
                      : [
                          "getUserProfile",
                          "getAuthorRelation",
                          "getVideoUserActions",
                          "setContainerMode",
                          "sharePicture",
                        ],
                  }
                : null;
        }
        throw new ToyError("unsupported", "mock: " + e);
      })(t, o);
    if (!(await ready())) throw new ToyError("unsupported", "不在 B站 Toy 页面里");
    const r = "g" + n++;
    return new Promise((n, s) => {
      const l = setTimeout(() => {
        (a.delete(r), s(new ToyError("timeout", "宿主没有回应")));
      }, i);
      (a.set(r, { res: n, rej: s, t: l }),
        window.parent.postMessage(
          { ns: e, type: "request", id: r, payload: { kind: t, ...o } },
          "*",
        ));
    });
  }
  o &&
    !c &&
    window.addEventListener("message", function onMessage(t) {
      const o = t.data;
      if (o && "object" == typeof o && o.ns === e && t.source === window.parent) {
        if ("hello" === o.type) return ((r = o.meta || {}), void (i && i.res(!0)));
        if ("response" === o.type) {
          const e = a.get(o.id);
          if (!e) return;
          (a.delete(o.id), clearTimeout(e.t));
          const t = o.payload || {};
          return void (t.ok
            ? e.res(t.data)
            : e.rej(new ToyError(t.errorType || "unknown", t.error, t.code)));
        }
        if ("event" === o.type && o.payload)
          for (const e of s[o.payload.event] || [])
            try {
              e(o.payload.state);
            } catch (e) {
              console.warn("toy event", e);
            }
      }
    });
  const jsb = (e, t) => call("jsb", { method: e, params: t || {} });
  async function withBackoff(e) {
    let t = 1e3;
    for (let o = 0; ; o++)
      try {
        return await e();
      } catch (e) {
        if (!e || 307044 !== e.code || o >= 3) throw e;
        (await new Promise((e) => setTimeout(e, t + 500 * Math.random())), (t *= 2));
      }
  }
  const yes = (e) =>
    !0 === e || 1 === e || "1" === e || "true" === e || ("number" == typeof e && e > 0);
  function pick(e, t) {
    if (e && "object" == typeof e) {
      for (const o of t) if (void 0 !== e[o] && null !== e[o]) return e[o];
      for (const o of [
        "data",
        "relation",
        "result",
        "actions",
        "action",
        "user_action",
        "userAction",
        "status_info",
      ])
        if (e[o] && "object" == typeof e[o]) {
          const n = pick(e[o], t);
          if (void 0 !== n) return n;
        }
    }
  }
  function bvToAv(e) {
    try {
      const t = [...String(e)];
      if (12 !== t.length) return null;
      (([t[3], t[9]] = [t[9], t[3]]), ([t[4], t[7]] = [t[7], t[4]]));
      let o = 0n;
      for (const e of t.slice(3)) {
        const t = "FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf".indexOf(e);
        if (t < 0) return null;
        o = 58n * o + BigInt(t);
      }
      return Number((2251799813685247n & o) ^ 23442827791579n);
    } catch (e) {
      return null;
    }
  }
  const d = [
      "like",
      "liked",
      "is_like",
      "isLike",
      "is_liked",
      "isLiked",
      "has_like",
      "hasLike",
      "thumb_up",
      "thumbUp",
    ],
    p = [
      "coinCount",
      "coin_count",
      "coin",
      "coined",
      "coins",
      "is_coin",
      "isCoin",
      "is_coined",
      "isCoined",
      "has_coin",
      "hasCoin",
      "coin_number",
      "coinNumber",
      "multiply",
    ],
    f = [
      "favorite",
      "favorited",
      "favourite",
      "fav",
      "favored",
      "favoured",
      "is_fav",
      "isFav",
      "is_favorite",
      "isFavorite",
      "has_fav",
      "hasFav",
      "collect",
      "collected",
      "is_collect",
    ],
    yesVal = (e) =>
      e && "object" == typeof e
        ? ["status", "value", "count", "number", "num", "done", "state", "is", "has"].some(
            (t) => void 0 !== e[t] && yes(e[t]),
          )
        : yes(e);
  function yesOf(e, t, o, n = 0) {
    const i = pick(e, t);
    if (void 0 !== i && yesVal(i)) return !0;
    if (!e || "object" != typeof e || n > 2) return !1;
    for (const [i, r] of Object.entries(e))
      if (!/^(stat|stats)$/i.test(i) && !/count|total/i.test(i)) {
        if (o.test(i) && yesVal(r)) return !0;
        if (r && "object" == typeof r && yesOf(r, t, o, n + 1)) return !0;
      }
    return !1;
  }
  function itemsOf(e, t = 0) {
    if (Array.isArray(e)) return e.filter((e) => e && "object" == typeof e);
    if (!e || "object" != typeof e || t > 2) return [];
    const o = Object.keys(e);
    if (o.length && o.every((e) => /^(BV\w+|\d+)$/i.test(e)))
      return o
        .map((t) => {
          const o = e[t];
          return (o && "object" == typeof o && (o.__k = t), o);
        })
        .filter((e) => e && "object" == typeof e);
    for (const o of ["items", "list", "videos", "data", "result", "actions"])
      if (e[o] && "object" == typeof e[o]) {
        const n = itemsOf(e[o], t + 1);
        if (n.length) return n;
      }
    return [];
  }
  function videoOf(e, t, o, n) {
    const i = pick(e, ["bvid", "bv_id", "bvId", "bv"]);
    if (i && /^BV/i.test(String(i))) return String(i);
    const r = e.__k,
      a = pick(e, ["aid", "avid", "av_id", "avId", "oid"]);
    return r && /^BV/i.test(r)
      ? r
      : r && n[r]
        ? n[r]
        : void 0 !== a && n[String(a)]
          ? n[String(a)]
          : o[t] || null;
  }
  function tripleOf(e, t = [], o = {}) {
    if (!e || "unsupported" === e.status) return null;
    let n = itemsOf(e);
    if (
      (n.length ||
        (void 0 === pick(e, d) && void 0 === pick(e, p) && void 0 === pick(e, f)) ||
        (n = [e]),
      !n.length)
    )
      return null;
    const i = n.map((e, n) => {
        const i = {
          video: videoOf(e, n, t, o),
          like: yesOf(e, d, /like|thumb/i),
          coin: yesOf(e, p, /coin|multiply/i),
          fav: yesOf(e, f, /fav|collect/i),
        };
        return (
          (i.all = i.like && i.coin && i.fav),
          (i.n = (i.like ? 1 : 0) + (i.coin ? 1 : 0) + (i.fav ? 1 : 0)),
          i
        );
      }),
      r = i.find((e) => e.all),
      a = r || i.slice().sort((e, t) => t.n - e.n)[0];
    return { like: a.like, coin: a.coin, fav: a.fav, all: !!r, video: a.video, per: i };
  }
  const y = {
    ToyError: ToyError,
    AUTHOR_MID: t,
    VIDEOS: [],
    last: l,
    get mock() {
      return c;
    },
    phoneWeb:
      !c &&
      /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) &&
      !/BiliApp|BiliHarmony|bili-/i.test(navigator.userAgent),
    ready: ready,
    inToy: async () => ready(),
    async profile() {
      const e = await call("getUserProfile", {}, 3e4);
      return (
        (l.profile = e),
        {
          nickname: e.uname || e.nickname || "",
          avatar: e.face || e.avatar || "",
          toyOpenId: e.toyOpenId || e.toy_open_id || "",
        }
      );
    },
    async following() {
      const e = await withBackoff(() => call("authorRelation"));
      return (
        (l.relation = e),
        (function followingOf(e) {
          if (!e || "unsupported" === e.status) return null;
          const t = pick(e, [
            "following",
            "is_following",
            "isFollowing",
            "followed",
            "is_followed",
            "is_follow",
            "isFollow",
            "follow",
            "subscribed",
            "attention",
          ]);
          if (void 0 !== t) return yes(t) || "following" === t || "followed" === t;
          const o = pick(e, ["attribute", "relation_type", "relationType"]);
          return void 0 !== o
            ? 2 === o || 6 === o || "2" === o || "6" === o
            : !("string" != typeof e.status || !/^(following|followed|mutual)$/.test(e.status)) ||
                ("string" == typeof e.relation && /follow|mutual/.test(e.relation));
        })(e)
      );
    },
    async triple(e) {
      if (!e || !e.length) return null;
      const t = e.filter((e) => /^BV/i.test(e)),
        o = e
          .filter((e) => /^\d+$/.test(String(e)))
          .map(Number)
          .concat(t.map(bvToAv).filter(Boolean)),
        n = {};
      for (const e of t) {
        const t = bvToAv(e);
        t && (n[String(t)] = e);
      }
      const i = [];
      (t.length && i.push(["bv", () => call("videoUserActions", { videos: t })]),
        o.length && i.push(["av", () => call("videoUserActions", { aids: o })]),
        t.length && i.push(["app-bv", () => jsb("toy.getVideoUserActions", { videos: t })]),
        o.length && i.push(["app-av", () => jsb("toy.getVideoUserActions", { aids: o })]));
      let r = null;
      for (const [e, o] of i)
        try {
          let i = await withBackoff(o);
          (i && 0 === i.code && i.data && (i = i.data),
            (l.videoActions = i),
            (l.videoActionsHow = e));
          const r = tripleOf(i, t, n);
          if (null !== r) {
            let t = "";
            if (!r.all)
              try {
                t = JSON.stringify(i).slice(0, 600);
              } catch (e) {}
            return (
              "undefined" != typeof Telemetry &&
                Telemetry.event &&
                (Telemetry.event("triple_ok", { how: e, all: r.all, raw: t }),
                !r.all && Telemetry.flush && Telemetry.flush(!1)),
              r
            );
          }
        } catch (t) {
          ((r = r || t),
            (l.videoActionsErrs = (l.videoActionsErrs || [])
              .concat([`${e}: ${t.code || ""} ${t.message}`])
              .slice(-8)));
        }
      if (r) throw r;
      return null;
    },
    async checkText(e, t) {
      try {
        const o = await call("inputSafety", { text: String(e).slice(0, 500), scene: t });
        return { passed: "unavailable" === o.status || !!o.passed, status: o.status };
      } catch (e) {
        return { passed: !0, status: "unavailable" };
      }
    },
    navigate: (e, t) => call("navigate", { req: { type: e, id: String(t) } }),
    async openNative(e, t, o) {
      try {
        localStorage.setItem("mcjs-nav", JSON.stringify({ t: Date.now(), type: t }));
      } catch (e) {}
      this._navBack ||
        ((this._navBack = !0),
        document.addEventListener("visibilitychange", () => {
          document.hidden ||
            setTimeout(() => {
              try {
                localStorage.removeItem("mcjs-nav");
              } catch (e) {}
            }, 1500);
        }));
      try {
        const e = "undefined" != typeof game ? game : null;
        e &&
          "play" === e.state &&
          !e.net &&
          e.saveWorld &&
          (await Promise.race([e.saveWorld(!0), new Promise((e) => setTimeout(e, 2e3))]));
      } catch (e) {}
      if (
        ("undefined" != typeof Crumbs && Crumbs.mark("nav:" + t),
        /BiliApp|BiliHarmony/i.test(navigator.userAgent))
      ) {
        const left = () =>
            new Promise((e) => {
              if (document.hidden) return e(!0);
              let t = !1;
              const end = (o) => {
                  t ||
                    ((t = !0),
                    document.removeEventListener("visibilitychange", vis),
                    window.removeEventListener("blur", end1),
                    e(o));
                },
                vis = () => {
                  document.hidden && end(!0);
                },
                end1 = () => end(!0);
              (document.addEventListener("visibilitychange", vis),
                window.addEventListener("blur", end1),
                setTimeout(() => end(document.hidden), 1500));
            }),
          n = [
            {
              type: { video: 1, space: 2, search: 3, opus: 4, tribee: 5, toy: 6 }[t],
              id: String(o),
              extra: {},
            },
            { type: t, id: String(o) },
            { url: e },
          ].filter((e) => void 0 !== e.type || e.url);
        for (const e of n)
          try {
            if ((await jsb("toy.navigate", e), await left()))
              return void (
                "undefined" != typeof Telemetry &&
                Telemetry.event &&
                Telemetry.event("nav_native", {
                  form: e.url ? "url" : "number" == typeof e.type ? "sdk" : "type",
                })
              );
          } catch (e) {}
        "undefined" != typeof Telemetry &&
          Telemetry.event &&
          (Telemetry.event("nav_web", { type: t }), Telemetry.flush && Telemetry.flush(!1));
      }
      return this.navigate(t, o);
    },
    openVideo(e) {
      const t = /^BV/i.test(e) ? bvToAv(e) : Number(e);
      return t ? this.openNative("bilibili://video/" + t, "video", e) : this.navigate("video", e);
    },
    openAuthor() {
      return this.openNative("bilibili://space/" + t, "space", t);
    },
    backHint(e) {
      const t = /BiliApp|BiliHarmony/i.test(navigator.userAgent);
      return "triple" === e
        ? t
          ? "三连后按返回键回来（别点视频里的游戏入口）"
          : "完成三连后回到这里，会自动检查"
        : t
          ? "关注后按返回键回来，会自动检查"
          : "关注后回到这里，会自动检查";
    },
    share: (e) => call("share", { req: { path: e || "/" } }),
    qrCode: (e, t) => call("qrCode", { req: { path: e || "/", size: t || 240 } }),
    sharePicture: (e) => jsb("toy.sharePicture", e),
    saveImage: (e) => jsb("toy.saveImageToAlbum", e),
    setContainerMode: (e) => jsb("toy.setContainerMode", e),
    containerState: () => jsb("toy.getContainerState"),
    abilities: () => jsb("toy.getAbilities"),
    closeBrowser: () => jsb("toy.closeBrowser"),
    report: (e, t) => jsb("toy.reportAction", { action: e, ...(t || {}) }).catch(() => {}),
    async onContainerChange(e) {
      s.containerChange.push(e);
      try {
        await call("containerSubscribe", { op: "add" });
      } catch (e) {}
    },
    async onPageClose(e) {
      s.pageClose.push(e);
      try {
        await call("playerSubscribe", { op: "add", channel: "pageClose" });
      } catch (e) {}
    },
    explain(e) {
      const t = e && e.type;
      return "not_logged_in" === t
        ? "B站说你还没登录：在 B站 App 里登录后重新打开，或者用识别码登录"
        : "user_denied" === t
          ? "你拒绝了授权，可以再试一次"
          : "unsupported" === t
            ? "这里用不了：请在 B站 App 或电脑网页上打开"
            : "timeout" === t
              ? "B站页面没回应（不是网络问题）：请点同意授权，或重开游戏、用识别码登录"
              : "network_error" === t
                ? "连 B站 时网络出错，请稍后再试"
                : /unauthori[sz]ed/i.test((e && e.message) || "")
                  ? "这个页面没登录 B站：先登录 B站 再打开游戏，或者用识别码登录"
                  : e && 307044 === e.code
                    ? "请求太频繁，请稍后再试"
                    : "出错了：" + ((e && e.message) || "未知错误");
    },
  };
  function panel() {
    if (!c) return;
    let e = document.getElementById("toymock");
    e ||
      ((e = document.createElement("div")),
      (e.id = "toymock"),
      (e.style.cssText =
        "position:fixed;top:4px;right:4px;z-index:99;background:rgba(0,0,0,.75);color:#fff;font:12px sans-serif;padding:6px;border:1px solid #fb7299;border-radius:4px"),
      document.body.appendChild(e),
      e.addEventListener("change", (e) => {
        const t = e.target;
        ((c[t.name] = "checkbox" === t.type ? t.checked : t.value), saveMock());
      }),
      e.addEventListener("click", async (e) => {
        const t = e.target.name;
        if ("fresh" !== t && "newbie" !== t) return;
        const o = "undefined" != typeof game ? game : null;
        if ("newbie" === t && o && "play" === o.state) e.target.textContent = "请先退回标题界面";
        else {
          (Object.assign(c, { openId: newMockId(), login: !0, follow: !1, triple: !1, deny: !1 }),
            saveMock());
          try {
            "undefined" != typeof Account && (await Account.logout());
          } catch (e) {}
          if ("newbie" === t) {
            (o && (o.saveSettings = () => {}),
              "undefined" != typeof Account && (Account.save = () => {}));
            for (const e of Object.keys(localStorage))
              /^mcjs-(settings|account|room-key|tid|skin-)/.test(e) && localStorage.removeItem(e);
          }
          location.reload();
        }
      }));
    const cb = (e, t) =>
      `<label style="display:block"><input type="checkbox" name="${e}" ${c[e] ? "checked" : ""}> ${t}</label>`;
    e.innerHTML =
      `<b style="color:#fb7299">Toy 模拟</b><select name="env" style="display:block;margin:3px 0">${[
        ["app", "B站 App"],
        ["web", "电脑网页"],
        ["mobileweb", "手机外部浏览器"],
        ["none", "不在 Toy"],
      ]
        .map(([e, t]) => `<option value="${e}" ${c.env === e ? "selected" : ""}>${t}</option>`)
        .join("")}</select>` +
      cb("login", "已登录 B站") +
      cb("deny", "拒绝授权") +
      cb("follow", "已关注") +
      cb("triple", "已三连") +
      '<button name="fresh" style="display:block;width:100%;margin-top:4px;font:12px sans-serif" title="换一个从没玩过的 B站 用户（退出游戏账号并刷新；设置不变）">换新 B站 用户</button><button name="newbie" style="display:block;width:100%;margin-top:3px;font:12px sans-serif" title="模拟第一次打开游戏的新玩家：新 B站 用户、清空设置和首次进入记录（这台设备上的世界保留）">新玩家进入</button>';
  }
  return (
    c && (document.body ? panel() : addEventListener("DOMContentLoaded", panel)),
    (y.panel = panel),
    y
  );
})();
//# sourceURL=js/toy.js
