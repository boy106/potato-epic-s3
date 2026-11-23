"use strict";
function bindInput(e) {
  const t = e.canvas,
    n = e.ui,
    locked = () => document.pointerLockElement === t;
  (window.addEventListener("keydown", (t) => {
    if (document.activeElement === n.input) return;
    Sound.init();
    const s = t.code;
    if (
      ("Escape" !== s || t.repeat || (e.escHeld = performance.now()),
      ["Space", "Tab", "F1", "F3", "F5", "Slash", "KeyQ"].includes(s) ||
      (t.ctrlKey && ["KeyS", "KeyD", "KeyW", "KeyA"].includes(s))
        ? t.preventDefault()
        : !(
            self.POTATO &&
            t.ctrlKey &&
            /^(Key[A-Z]|Digit[0-9]|Space)$/.test(s) &&
            "KeyC" !== s &&
            "KeyV" !== s &&
            "KeyX" !== s
          ) ||
          (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) ||
          t.preventDefault(),
      n.screen)
    ) {
      if (n.key(t)) return;
      return void (
        ("Escape" === s ||
          (bindingsFor(e, s).includes("inventory") && n.screen instanceof ContainerScreen)) &&
        (n.screen.onEsc
          ? n.screen.onEsc()
          : "play" !== e.state || n.screen instanceof DeathScreen || n.close())
      );
    }
    if ("play" !== e.state) return;
    if (t.repeat && !s.startsWith("Digit")) return void (e.keys[s] = !0);
    e.keys[s] = !0;
    (e.player, performance.now());
    if ("Escape" !== s) {
      if (e.keys.F3 && "F3" !== s) {
        if (((e.f3Used = !0), "KeyH" === s))
          return (
            (e.settings.advTooltips = !e.settings.advTooltips),
            e.saveSettings(),
            void n.message(
              "[调试]：高级提示框：" + (e.settings.advTooltips ? "显示" : "隐藏"),
              "#FFFF55",
            )
          );
        if (self.POTATO && ("KeyN" === s || "F4" === s)) return void t.preventDefault();
        if ("KeyN" === s || "F4" === s)
          return e.cheats || e.net
            ? void e.requestMode(
                "KeyN" === s
                  ? "spectator" === e.mode
                    ? e.prevMode && "spectator" !== e.prevMode
                      ? e.prevMode
                      : "creative"
                    : "spectator"
                  : MODE_NEXT[e.mode],
              )
            : void n.message("[调试]：无法切换游戏模式；没有权限", "#FF5555");
        if ("KeyL" === s) return void e.perfReport();
        if ("KeyQ" === s)
          return void n.message(
            self.POTATO
              ? "F3 + H = 高级提示框，F3 + L = 记录 10 秒性能报告"
              : "F3 + H = 高级提示框，F3 + N = 旁观模式切换，F3 + F4 = 切换游戏模式，F3 + L = 记录 10 秒性能报告",
            "#FFFF55",
          );
      }
      "F3" === s && (e.f3Used = !1);
      for (const n of bindingsFor(e, s)) if (pressAction(e, n, t)) return void t.preventDefault();
    } else n.open(new PauseScreen(e));
  }),
    window.addEventListener("keyup", (t) => {
      ("F3" !== t.code ||
        !e.keys.F3 ||
        e.f3Used ||
        n.screen ||
        "play" !== e.state ||
        ((n.debug = !n.debug), (PerfMon.gpuOn = n.debug)),
        (e.keys[t.code] = !1),
        "Escape" === t.code &&
          ((e.escHeld = 0),
          e.escCapture &&
            ((e.escCapture = !1),
            "play" !== e.state ||
              n.screen ||
              ((e.clickToResume = performance.now()), e.capturePointer()))));
      for (const n of bindingsFor(e, t.code)) releaseAction(e, n);
    }));
  const releaseAll = () => {
    ((e.keys = {}),
      (e.rawMouse = [!1, !1, !1]),
      (e.mouseBtn = [!1, !1, !1]),
      (e.sprintToggle = !1));
  };
  (window.addEventListener("blur", releaseAll),
    document.addEventListener("pointerlockchange", () => {
      (locked() && (e.lockFails = 0),
        locked() ||
          (releaseAll(),
          "play" !== e.state || n.screen || touchOn(e) || n.open(new PauseScreen(e))));
    }),
    document.addEventListener("pointerlockerror", () => {
      e.lockSoftAt && performance.now() - e.lockSoftAt < 1500
        ? (e.lockSoftAt = 0)
        : (e.lockFails = (e.lockFails || 0) + 1);
    }));
  const freeMouse = () => e.lockFails > 0 && !locked() && !touchOn(e),
    syncButtons = (t, n) => {
      if ("number" == typeof t.buttons && e.rawMouse && (!locked() || (!n && t.buttons))) {
        for (let n = 0; n < 3; n++)
          if (e.rawMouse[n] && !(t.buttons & [1, 4, 2][n])) {
            e.rawMouse[n] = !1;
            for (const t of bindingsFor(e, "Mouse" + n)) releaseAction(e, t);
          }
        unlockIfUp();
      }
    },
    unlockIfUp = () => {
      !e.unlockOnUp ||
        (e.rawMouse && (e.rawMouse[0] || e.rawMouse[1] || e.rawMouse[2])) ||
        ((e.unlockOnUp = !1), n.screen && !n.screen.keepPointer && e.releasePointer());
    };
  let s = [0, 0],
    r = 0;
  const spike = (t, n) =>
    Math.abs(t) > 400 && Math.abs(n) >= 8 && n * t < 0 && !(e.lockRaw && locked());
  let o = null,
    i = 0,
    a = 0;
  const edgeTurn = (t) => {
    if (!o || !freeMouse() || n.screen || "play" !== e.state)
      return ((o = null), (a = 0), void (i = 0));
    const s = i ? Math.min(0.1, (t - i) / 1e3) : 0;
    i = t;
    const r = e.player,
      c = e.settings,
      d = 450 * (0.006 * c.sens + 6e-4) * s;
    ((r.yaw -= o[0] * d * (c.invertX ? -1 : 1)),
      (r.pitch = clamp(
        r.pitch - o[1] * d * (c.invertY ? -1 : 1),
        -Math.PI / 2 + 0.001,
        Math.PI / 2 - 0.001,
      )),
      (a = requestAnimationFrame(edgeTurn)));
  };
  let c = !1;
  (document.addEventListener("mouseout", (e) => {
    e.relatedTarget || ((o = null), (c = !0));
  }),
    window.addEventListener("blur", () => {
      ((o = null), (c = !0));
    }),
    window.addEventListener("mousemove", (t) => {
      if ((syncButtons(t, !0), (!locked() && !freeMouse()) || n.screen || "play" !== e.state))
        n.mouseMove(t);
      else {
        const n = e.player,
          i = e.settings,
          d = 0.006 * i.sens + 6e-4,
          l = performance.now(),
          u = l - r < 100 ? s : [0, 0];
        if (c && ((c = !1), !locked())) return;
        if (spike(t.movementX, u[0]) || spike(t.movementY, u[1])) return;
        if (
          ((s = [t.movementX, t.movementY]),
          (r = l),
          (n.yaw -= t.movementX * d * (i.invertX ? -1 : 1)),
          (n.pitch = clamp(
            n.pitch - t.movementY * d * (i.invertY ? -1 : 1),
            -Math.PI / 2 + 0.001,
            Math.PI / 2 - 0.001,
          )),
          locked())
        )
          o = null;
        else {
          const e = 2,
            n = t.clientX <= e ? -1 : t.clientX >= innerWidth - 1 - e ? 1 : 0,
            s = t.clientY <= e ? -1 : t.clientY >= innerHeight - 1 - e ? 1 : 0;
          ((o = n || s ? [n, s] : null), o && !a && (a = requestAnimationFrame(edgeTurn)));
        }
      }
    }),
    t.addEventListener("contextmenu", (e) => e.preventDefault()),
    n.canvas.addEventListener("contextmenu", (e) => e.preventDefault()),
    window.addEventListener(
      "contextmenu",
      (e) => {
        e.target !== n.input && e.preventDefault();
      },
      !0,
    ),
    window.addEventListener(
      "mousedown",
      (e) => {
        2 === e.button && e.target !== n.input && e.preventDefault();
      },
      !0,
    ));
  const d = /Edg\/|QIHU|360SE|360EE/i.test(navigator.userAgent || "");
  let l = !1;
  (window.addEventListener("mousedown", (t) => {
    if (t.target !== n.input)
      if ((Sound.init(), syncButtons(t), n.screen)) n.mouseDown(t);
      else if ("play" === e.state && (locked() || (e.capturePointer(), freeMouse()))) {
        (1 === t.button && t.preventDefault(),
          ((e.rawMouse || (e.rawMouse = [!1, !1, !1]))[t.button] = !0));
        for (const n of bindingsFor(e, "Mouse" + t.button)) pressAction(e, n, t);
        2 === t.button &&
          (() => {
            if (!d || l) return;
            l = !0;
            const t = e.settings.gestureTip || 0;
            t >= 3 ||
              ((e.settings.gestureTip = t + 1),
              e.saveSettings(),
              n.message(
                "[提示] 浏览器的「鼠标手势」会把按住右键拖动当成后退或关闭网页；用不到的话，可以在浏览器设置里搜索「鼠标手势」关掉",
                "#FFFF55",
              ));
          })();
      }
  }),
    window.addEventListener("mouseup", (t) => {
      (n.screen && n.mouseUp(t), e.rawMouse && (e.rawMouse[t.button] = !1));
      for (const n of bindingsFor(e, "Mouse" + t.button)) releaseAction(e, n);
      unlockIfUp();
    }),
    window.addEventListener(
      "wheel",
      (t) => {
        if (n.screen) return ((n.wheelShift = t.shiftKey), void n.wheel(t.deltaY));
        if ("play" !== e.state) return;
        const s = e.settings,
          r = s.scrollSens ?? 1,
          o = 0 !== t.deltaMode || Math.abs(t.deltaY) >= 50;
        e.scrollAcc =
          (e.scrollAcc || 0) +
          (s.discreteScroll || o ? Math.sign(t.deltaY) * r : (t.deltaY / 100) * r);
        const i = Math.trunc(e.scrollAcc);
        if (i) {
          e.scrollAcc -= i;
          const t = e.player;
          t.inv.sel = mod(t.inv.sel + i, 9);
        }
      },
      { passive: !0 },
    ),
    window.addEventListener("beforeunload", (t) => {
      "play" === e.state && (e.saveWorld(!0), t.preventDefault(), (t.returnValue = ""));
    }),
    document.addEventListener("visibilitychange", () => {
      document.hidden && "play" === e.state && e.saveWorld(!0);
    }));
}
((Renderer.prototype.playerPreview = function (e, t, n, s, r, o, i) {
  const a = this.gl,
    c = Math.max(2, t.scale),
    d = r * c,
    l = o * c,
    u = e.player,
    f = u
      ? [
          u.inv.sel,
          ...[u.inv.held, ...u.inv.slots.slice(36, 41)].map((e) =>
            e ? e.id + ":" + (e.dmg || 0) + ":" + (e.color ?? "") : 0,
          ),
        ].join("/")
      : "",
    p = u && "undefined" != typeof Capes ? Capes.of(e, u) : null,
    v = p && Capes.get(p),
    m = performance.now(),
    E =
      n +
      "," +
      s +
      "," +
      d +
      "," +
      l +
      "," +
      f +
      (u && "undefined" != typeof Skins ? Skins.texOf(e, u) + Skins.modelOf(e, u) + (p || "") : "");
  (this.pvWorn !== E && ((this.pvWorn = E), (this.pvWornT = m)),
    m - (this.pvAt || -1e9) > 500 && (this.pvForce = !0),
    (this.pvAt = m));
  const dyn = (e) => /^(compass|recovery_compass|clock)$/.test(keyOfStack(e) || ""),
    h =
      (i && void 0 !== i.yaw) ||
      !!(v && v.frames && v.frames.length > 1) ||
      m - this.pvWornT < 1500 ||
      !(!u || (!dyn(u.inv.held) && !dyn(u.inv.slots[40]))),
    F =
      (i && void 0 !== i.yaw
        ? "y" + i.yaw.toFixed(2)
        : Math.round(t.mouse.x) + "," + Math.round(t.mouse.y)) +
      "," +
      E +
      (h ? "," + Math.floor(m / 125) : "");
  if (this.pv && this.pv.sync && this.pv.W === d && this.pv.H === l) {
    const e = this.pv;
    if (a.getSyncParameter(e.sync, a.SYNC_STATUS) !== a.SIGNALED) return e.cv;
    (a.deleteSync(e.sync),
      (e.sync = null),
      a.bindBuffer(a.PIXEL_PACK_BUFFER, e.pbo),
      a.getBufferSubData(a.PIXEL_PACK_BUFFER, 0, e.px),
      a.bindBuffer(a.PIXEL_PACK_BUFFER, null));
    for (let t = 0; t < l; t++)
      e.img.data.set(e.px.subarray((l - 1 - t) * d * 4, (l - t) * d * 4), t * d * 4);
    (e.ctx.putImageData(e.img, 0, 0), (e.key = e.pendingKey));
  }
  if (this.pv && this.pv.key === F && !this.pvForce) return this.pv.cv;
  if (((this.pvForce = !1), !this.pv || this.pv.W !== d || this.pv.H !== l)) {
    this.pv &&
      (a.deleteFramebuffer(this.pv.fb),
      a.deleteTexture(this.pv.tex),
      a.deleteRenderbuffer(this.pv.rb),
      this.pv.pbo && a.deleteBuffer(this.pv.pbo),
      this.pv.sync && a.deleteSync(this.pv.sync));
    const e = a.createFramebuffer(),
      t = a.createTexture(),
      n = a.createRenderbuffer();
    (a.bindTexture(a.TEXTURE_2D, t),
      a.texImage2D(a.TEXTURE_2D, 0, a.RGBA, d, l, 0, a.RGBA, a.UNSIGNED_BYTE, null),
      a.bindRenderbuffer(a.RENDERBUFFER, n),
      a.renderbufferStorage(a.RENDERBUFFER, a.DEPTH_COMPONENT24, d, l),
      a.bindFramebuffer(a.FRAMEBUFFER, e),
      a.framebufferTexture2D(a.FRAMEBUFFER, a.COLOR_ATTACHMENT0, a.TEXTURE_2D, t, 0),
      a.framebufferRenderbuffer(a.FRAMEBUFFER, a.DEPTH_ATTACHMENT, a.RENDERBUFFER, n));
    const s = document.createElement("canvas");
    ((s.width = d), (s.height = l));
    const r = a.createBuffer();
    (a.bindBuffer(a.PIXEL_PACK_BUFFER, r),
      a.bufferData(a.PIXEL_PACK_BUFFER, d * l * 4, a.STREAM_READ),
      a.bindBuffer(a.PIXEL_PACK_BUFFER, null),
      (this.pv = {
        fb: e,
        tex: t,
        rb: n,
        pbo: r,
        W: d,
        H: l,
        cv: s,
        ctx: s.getContext("2d"),
        px: new Uint8Array(d * l * 4),
        img: s.getContext("2d").createImageData(d, l),
        first: !0,
      }));
  }
  const y = this.pv;
  (a.bindFramebuffer(a.FRAMEBUFFER, y.fb),
    a.viewport(0, 0, d, l),
    a.clearColor(0, 0, 0, 0),
    a.clear(a.COLOR_BUFFER_BIT | a.DEPTH_BUFFER_BIT),
    a.enable(a.DEPTH_TEST),
    a.enable(a.CULL_FACE));
  const w = M4.create();
  M4.ortho(w, -0.7, 0.7, -0.05, 1.95, -5, 5);
  const g = (t.mouse.x - (n + r / 2)) / 40,
    b = (t.mouse.y - (s + 0.25 * o)) / 40,
    M = M4.create();
  (M4.translate(M, 0, 0, 0),
    M4.rotY(M, i && void 0 !== i.yaw ? i.yaw : Math.PI + 0.7 * Math.atan(g)),
    M4.scale(M, 0.9375, 0.9375, 0.9375));
  const A = [1, 1],
    T = this.fxOn;
  this.fxOn = !1;
  const R = { day: 1, fogColor: [0, 0, 0], fogNear: 1e8, fogFar: 2e8, nightTint: [1, 1, 1] },
    P = this.camPos;
  this.camPos = [0, 0, 0];
  const S =
      i && void 0 !== i.yaw ? {} : { head: { ry: 0.5 * Math.atan(g), rx: 0.6 * -Math.atan(b) } },
    L = this.vp;
  this.vp = w;
  const k =
    u && e.heldAttach
      ? e.heldAttach(
          u,
          "undefined" != typeof Skins ? Skins.modelOf(e, u) : "steve",
          u.inv.held,
          u.inv.slots[40],
          A,
          R,
        )
      : null;
  a.disable(a.CULL_FACE);
  const _ = u && "undefined" != typeof Skins ? Skins.modelOf(e, u) : "steve";
  if (
    (this.drawModel(_, u && "undefined" != typeof Skins ? Skins.texOf(e, u) : "steve", M, S, A, R, {
      vp: w,
      attach: k,
      inv: !0,
    }),
    u && "undefined" != typeof Capes && Capes.draw(e, u, M, S, A, R, { vp: w, still: !0, inv: !0 }),
    a.enable(a.CULL_FACE),
    u &&
      (e.drawArmor(u.inv.slots.slice(36, 40), M, S, A, R, { vp: w, inv: !0 }),
      e.drawWings && e.drawWings(u, M, A, R, null, w)),
    (this.vp = L),
    (this.fxOn = T),
    (this.camPos = P),
    y.first)
  ) {
    ((y.first = !1), a.readPixels(0, 0, d, l, a.RGBA, a.UNSIGNED_BYTE, y.px));
    for (let e = 0; e < l; e++)
      y.img.data.set(y.px.subarray((l - 1 - e) * d * 4, (l - e) * d * 4), e * d * 4);
    (y.ctx.putImageData(y.img, 0, 0), (y.key = F));
  } else
    (a.bindBuffer(a.PIXEL_PACK_BUFFER, y.pbo),
      a.readPixels(0, 0, d, l, a.RGBA, a.UNSIGNED_BYTE, 0),
      a.bindBuffer(a.PIXEL_PACK_BUFFER, null),
      (y.sync = a.fenceSync(a.SYNC_GPU_COMMANDS_COMPLETE, 0)),
      a.flush(),
      (y.pendingKey = F));
  return (
    a.bindFramebuffer(a.FRAMEBUFFER, null),
    a.viewport(0, 0, this.canvas.width, this.canvas.height),
    y.cv
  );
}),
  window.addEventListener("load", async () => {
    const e = (window.game = new Game());
    try {
      await e.init();
    } catch (e) {
      console.error(e);
      // D-004 最小接线：失败终态（冻结加载条/装饰层淡出/#err 面板 + 重试）由 index.html 的 self.BOOT_FAIL 负责
      if (self.BOOT_FAIL) {
        self.BOOT_FAIL(e);
      } else {
        const t = document.getElementById("err");
        ((t.style.display = "block"),
          (t.textContent =
            "启动失败：" +
            ((e && e.message) || e) +
            "\n\n请使用最新版 Chrome / Edge / Firefox 浏览器打开，并确保已启用 WebGL2 / 硬件加速。"));
      }
    }
  }));
//# sourceURL=js/main.js
