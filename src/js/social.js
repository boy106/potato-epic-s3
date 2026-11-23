"use strict";
async function textOk(t, e, n) {
  return (
    !!(await Toy.checkText(e, n)).passed ||
    (Telemetry.count && Telemetry.count("text_blocked_" + n), !1)
  );
}
(() => {
  const t = NetClient.prototype.chat;
  NetClient.prototype.chat = async function (e) {
    if (String(e).startsWith("/") || (await textOk(this.g, e, "chat"))) return t.call(this, e);
    this.g.ui.message("这条消息包含不合适的内容，没有发出", "#FF5555");
  };
  const e = CreateRoomScreen.prototype.submit;
  CreateRoomScreen.prototype.submit = async function () {
    if (!this.busy) {
      if (await textOk(this.game, this.roomName, "room_name")) return e.call(this);
      this.say("房间名包含不合适的内容，换一个吧", !0);
    }
  };
  for (const t of [FeedbackScreen, ReportScreen]) {
    const e = t.prototype.submit;
    t.prototype.submit = async function () {
      return this.text &&
        String(this.text).trim() &&
        !(await textOk(this.game, this.text, t === FeedbackScreen ? "feedback" : "report"))
        ? ((this.note = "内容包含不合适的词，请修改后再发送"),
          (this.noteColor = "#FF5555"),
          void (this.say && this.say(this.note, !0)))
        : e.call(this);
    };
  }
})();
class InviteCardScreen extends MenuScreen {
  constructor(t, e) {
    (super(t, "邀请朋友"),
      (this.parent = e),
      (this.pauses = !1),
      (this.titleY = 8),
      (this.qr = null),
      (this.note = ""),
      (this.inToy = null));
    const n = this.R;
    Toy.ready().then((t) => {
      ((this.inToy = t),
        t &&
          n &&
          Toy.qrCode("index.html?room=" + n.code, 240)
            .then((t) => {
              if (t && t.base64) {
                const e = new Image();
                ((e.onload = () => {
                  this.qr = e;
                }),
                  (e.src = t.base64.startsWith("data:")
                    ? t.base64
                    : "data:image/png;base64," + t.base64));
              }
            })
            .catch(() => {}),
        this.game.ui.screen === this && this.layout());
    });
  }
  get R() {
    return this.game.net && this.game.net.room;
  }
  layout() {
    const t = this.game.ui,
      e = t.w / 2,
      n = this.R,
      i = t.h - 52;
    ((this.widgets = []),
      n &&
        this.widgets.push(
          {
            x: e - 152,
            y: i,
            w: 98,
            h: 20,
            gold: !0,
            label: "分享给朋友",
            enabled: !0 === this.inToy,
            tip: this.inToy ? ["发到 B站 私信、动态"] : ["在 B站 App 或网页里才能分享"],
            onClick: () => this.share(),
          },
          {
            x: e - 50,
            y: i,
            w: 98,
            h: 20,
            label: "复制链接",
            onClick: async () => {
              this.note = (await copyText(RoomService.link(n.code))) ? "链接已复制" : "复制失败";
            },
          },
          {
            x: e + 52,
            y: i,
            w: 100,
            h: 20,
            label: "复制邀请码",
            onClick: async () => {
              this.note = (await copyText(n.code)) ? "邀请码已复制" : "复制失败";
            },
          },
        ),
      this.widgets.push({
        x: e - 100,
        y: t.h - 28,
        w: 200,
        h: 20,
        label: "完成",
        onClick: () => this.game.ui.open(this.parent),
      }));
  }
  async share() {
    try {
      (await Toy.share("index.html?room=" + this.R.code),
        (this.note = "已打开分享"),
        Telemetry.count && Telemetry.count("invite_share"));
    } catch (t) {
      this.note = Toy.explain(t);
    }
  }
  drawExtra(t) {
    const e = t.ctx,
      n = t.w / 2,
      i = this.R;
    if (!i) return void Font.center(e, "不在房间里", n, 60, "#A0A0A0");
    const o = 230,
      s = t.h - 92,
      a = Math.floor(n - 115),
      c = 22;
    (drawCard(e, a, c, o, s, !0),
      Font.center(e, fitText(i.name, 214), n, 30, "#FFFFFF"),
      Font.center(e, "房主 " + i.owner, n, 42, "#A0A0A0"));
    const r = Math.min(s - 70, 90);
    (this.qr
      ? ((e.fillStyle = "#FFFFFF"),
        e.fillRect(n - r / 2 - 3, 54, r + 6, r + 6),
        e.drawImage(this.qr, n - r / 2, 57, r, r))
      : ((e.strokeStyle = "#555555"),
        e.strokeRect(n - r / 2 + 0.5, 57.5, r, r),
        Font.center(e, !1 === this.inToy ? "用邀请码加入" : "二维码…", n, 52 + r / 2, "#808080")),
      e.save(),
      e.translate(n, c + r + 44),
      e.scale(2, 2),
      Font.center(e, i.code, 0, 0, "#FFD24A"),
      e.restore(),
      Font.center(
        e,
        fitText("扫码或在「多人游戏」里输入邀请码加入", 218),
        n,
        c + r + 66,
        "#A0A0A0",
      ),
      this.note && Font.center(e, this.note, n, t.h - 64, "#80FF80"));
  }
  onEsc() {
    this.game.ui.open(this.parent);
  }
}
function showAnnounce(t, e) {
  let n = 0;
  try {
    n = +localStorage.getItem("mcjs-announce") || 0;
  } catch (t) {}
  if (e && !(e.id <= n)) {
    try {
      localStorage.setItem("mcjs-announce", String(e.id));
    } catch (t) {}
    (t.ui.message("[公告] " + e.text, "#FFAA00"),
      (t.ui.actionBar = { text: "公告：" + e.text, t: performance.now(), color: "#FFAA00" }),
      Sound.ev && Sound.ev("block.note_block.bell", null, 0.6, 1.2));
  }
}
((() => {
  const t = RoomScreen.prototype.layout;
  RoomScreen.prototype.layout = function () {
    t.call(this);
    if (!this.R) return;
    const e = this.widgets.findIndex((t) => "复制邀请码" === t.label),
      n = this.widgets.findIndex((t) => "复制链接" === t.label);
    if (e >= 0 && n >= 0) {
      const t = this.widgets[e],
        i = this.widgets[n];
      (this.widgets.splice(Math.max(e, n), 1),
        this.widgets.splice(Math.min(e, n), 1),
        this.widgets.push({
          x: t.x,
          y: t.y,
          w: i.x + i.w - t.x,
          h: t.h,
          gold: !0,
          label: "邀请朋友…",
          onClick: () => this.game.ui.open(new InviteCardScreen(this.game, this)),
        }));
    }
  };
})(),
  Toy.onPageClose(() => {
    const t = "undefined" != typeof game && game;
    try {
      t && t.net && t.net.close && t.net.close();
    } catch (t) {}
    try {
      Telemetry.flush && Telemetry.flush(!0);
    } catch (t) {}
  }).catch(() => {}),
  (() => {
    const t = Date.now(),
      every = () =>
        6e4 *
        Math.max(
          1,
          Math.min(60, ("undefined" != typeof Live && +Live.get("client.announceMin", 5)) || 5),
        ),
      tick = async () => {
        setTimeout(tick, every());
        const e = "undefined" != typeof game && game;
        if (
          !e ||
          "play" !== e.state ||
          e.net ||
          document.hidden ||
          "undefined" == typeof RoomService ||
          !RoomService.base()
        )
          return;
        let n = 0;
        try {
          n = +localStorage.getItem("mcjs-announce") || 0;
        } catch (t) {}
        try {
          const i = await RoomService.api("/api/announce?after=" + Math.max(n, t - 6e5));
          for (const t of i.list || []) showAnnounce(e, t);
          void 0 !== i.live &&
            "undefined" != typeof Live &&
            i.live !== Live.v &&
            Live.fetch(i.live);
        } catch (t) {}
      };
    setTimeout(tick, every());
  })());
//# sourceURL=js/social.js
