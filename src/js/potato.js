"use strict";
if (/[?&]trace\b/.test(location.search)) {
  const t = (self.__TRACE = {
      images: new Set(),
      etex: new Set(),
      layers: new Set(),
      types: new Set(),
      vm: new Set(),
      vblocks: new Set(),
      vitems: new Set(),
    }),
    wrap = (t, e) => new Proxy(t, { get: (t, a) => ("string" == typeof a && e.add(a), t[a]) }),
    e = setInterval(() => {
      const a = self.game,
        o = a && a.renderer;
      if (!(o && o.images && o.entityTex && "undefined" != typeof VM && VM.ready)) return;
      (clearInterval(e),
        (o.images = wrap(o.images, t.images)),
        (o.entityTex = wrap(o.entityTex, t.etex)),
        self.ENTITY_DATA &&
          ((ENTITY_DATA.layers = wrap(ENTITY_DATA.layers, t.layers)),
          (ENTITY_DATA.types = wrap(ENTITY_DATA.types, t.types))));
      const s = VM.data;
      (s &&
        ((s.models = wrap(s.models, t.vm)),
        (s.blocks = wrap(s.blocks, t.vblocks)),
        (s.items = wrap(s.items, t.vitems))),
        console.log("[trace] on"));
    }, 100);
  self.__traceDump = () => {
    const e = {};
    for (const a in t) e[a] = [...t[a]].sort();
    return e;
  };
}
(() => {
  if (!self.POTATO || "undefined" == typeof Game) return;
  ((self.SKINS_BUILTIN = [
    {
      id: "penguin",
      name: "企鹅",
      slim: !0,
      png: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAGBklEQVR4Xu1aS3IbNxAld7KysRw7icWqaCfvHWUX3yC6jHOT2LmDc43kCtE9FGfPcTWAbjQeGp8BMSylyq/qlUaDRk+/NxgMCHK3a+D6+sflMEDuJ4lWYi9HBlTj78/eLDVK4ChQ2OH6RsRZ1G107LPsG4p6YCdAwcKLN8uHfgPs5AQUeDjcpP8X6eMkEaB8xXXIhD/zwvlYAhG9BTgxBxRXZjI6DmUDZkGLtSiBo0CByNrjQOy3eiVCWif0IhfO533UCUBByBRHOWJIohpqHkmbP8BQLXi32y2fP7xLTJBABibQsNpQMDLBMbdAEm0EL3IvBhD52DQgwNJqovX8E1C0nDgOGFCrzGjjO53ztmoAwaVzQhoic9ZfhWvIxWwOZV7iY1qQfsWVRPa+Bv0EmeUAs/Pbiv/3YrBfUhwUzMCY3nZiZgBQCjkX0CcsiGmh3paOnnhcpxRCwOLOASlGDU2H47Lsw6zq8HCfkmb4vWoXg1h8nwk1jXtyZGtTsCCiMa8vnz++S2gB8zQZVoonaVzdGTpkRcEQz61AxAjMgxOexb+++amPl8Y5g38XjjOGfE0D+nF0fVuTHjJ/f3vW1/j+HX8aKcetegTDyNDFXT3/1g33/8Kwp78+qgzqY/Hn95+Wu/d/urw0b/BffUyfNCWRASoR8zIlSLD62fDQd5AS47MvgQVgYcw7ZQCT1u0kXF9TElnYl/PrGBudDbpASlwzwErphX6CAl/Isc5vURIVcHWl80ZKgAmr0gJ8If4VRomd8D9sAyzc/WYZEImCkZKoAMkFRkiAiYoBWEDkjVzkuboQUcfxOT3B0Oyq44WqaIz/7tXrhFnflRSBLYgY45WFSZlWjAi68IJ0DDGKeuGMiAbcVuPRGMeX2qD4eGmKwBayFZsyApMyY1wcJUR9R/nVqIF5JP6SDQi1hBoy4a9+kGPOgaOTKQJbYLFIn8h2N4/zzA1IoWP1KIgGpMwMeBmPk1yBzoxwQ0RgC+lF09GAF3C80iMg9iO0DNCgPjpeX1czMyEYkdUFFIEt4AU140Xj0CP6dmXWwa8e1xhA736KpRVfaQR45h+qqAYUrEntIrAFSlhavmrRmhhHJIgBl2+DzDKoD8fTmh3zOYZ5Bs/TDUHRmlSjCGzBFF+chHoNaI8A6kOxbgSUDGAmj5snitbiqV0EtkDBlgl0TkSryadmwBrwNTBPL73gfJIeMoCIGx7Hh/sgOH3+ZxqQMx/uJTrBxrKY20VgBW596AT/A7s9gfozQNKm4vmCj4+PwhJ0DPdbT2+SJX6tAQ4iktf7at3fQ10cD+ko9F8Q3X+HmaWFTjr8w7EyRQSOoPLRoYIz7N+tRSJkpSoXXtQUztqNgHJQuaWMkT5fsTWsu2KdG0F3nu7AiNClv2d/5BhG8nMf/9fOYJ89BfMznoRYzmBh3G2wu+DU/pvhaRTWWUVnWMTqDvORlVB8fW6JeMW5156b7Su2x8Q7RqmSdBNzP2nQp7y0wInKzVTmyfMi+bgbOFYBi5ktana+GXiKNT0VrPKGgpn/d9BmhN7Q8Bsnv8gGCutloGa/qUEbHOl+nwRkPc6InkvbBkRKYAG0A2TtAknACLLR1aNkDVS+EQN0OSicKQFTMNsABfnqbIUBGijcMmCj8jvSGiFYKNGLjxugpf1/7Ee0hn88H+cFKWAOSJmhrgNYKJEFauGWCdiP+T18D4GkGCmAKh8rfQ6weCIKLRH7MVEwkmKkgEH0edYRhcUzUaxF7MMUsfCVHJNipICeIqdDXVO+jFBfSqDQEjke6YXnX8nZBgRwTU0/eLOiGcioB2JxRBRqfbtLkySLcVQGmjkCuY8UUEK97HnQwpm24JwsBulyQCxPotxHCmAUBRcb5kALZ2LxJeY/dfGvOYzT5GtIAVvB/DhsmJmID5MWFl2i/6VHuubHhRSSX5FSwBbAfQH6rYA0ArRwJvYnigj1eJR+6iKxBik/xfirG3fkZDR3dNNWFkhfq/OvylH88vBrIJ6/B/F+NFiLJs1owLlQccSt8Vf+pkAzMUA+CmtTbEoBAZUSq61fAGVShQGcUPkiAAAAAElFTkSuQmCC",
    },
    {
      id: "scarecrow",
      name: "稻草人",
      slim: !1,
      hidden: !0,
      png: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAh1BMVEUAAAAjHRMnJycpIhczKhk6Lxw6MB47Lxs+Mh1ENyBGPSxHLi1LQjFSSDVTNi1ZUDtbPC5jQS5sSC5xSy58Uy+BVy+CdFWEWS+HNRyIXC+KcyCLcRCSQSOUfRCUgB6ei2CkUSulSSyrkiWsjQiwmGS9pRC/pW6/qzHJrXDLtjDNsgjTuH3mzJRisXMtAAAAAXRSTlMAQObYZgAAAyFJREFUWMPtV3F/ojAM1VFFbt6OynAnCHW0FrB8/893L4Xq5Nah7t+llLT8zGsS2vCczQY5FlIWuSycnt0r+VGSrXT6bgDYnORRSqfv9wDe5yf0Qd8NUOQFxZ87/UAOsLbMT04/koPjyb6DXt8PcMTLk0Xh9M2GVV3W1DPqbTnMqta1SYCMDCoyRCOAiiCyqrIgZT3tQZVVWUm9Ii/6cQUpyatqGmB/OBz2f/f794Md7TEmfXjf93o6BKxXDi07a/hRWm/KGwCsSTukss0cBGKgcCYB8PPWJqymlPXjIakEM/0WKmc+ZH2YtxnN0G7aCxHrm5t3v6x04SDuuTZa0179D2Cwj6YADITqxScAUUR9EkBoQ/XikxAYoz4ZwsuzpnpxZRywkIVRhBtdYbjdbpXQ6z+/16ZRmAhlFELHMy10wrXWxtB1cR9GqyhakWYWQCjd6PW66YzaCpoZC6EVIGKtMMYjdQagVVdA6AEY2woE2jVCmM5oAQAsqYGiBIehUnaI/tEDFoUEwMKAsaAH6JTouqYHwIo7DvvXHYUhlBAJbpcc9ACrAKsHEACopuu0gAMDgBI7LmKepfHbJo1TnsY7np4B5lgYCVjR6iELKASlOyTQ6EYJmwOlFNc8zdNCpoDgJa8+AgRsjsUBEAThIrQAyhjRINM9ACCE0fGbPO7ofPCkzmR52Y2hBXgOg3kAZ5ADOK1M89zACRvCCwWhlasXTl+SCMMw4SyYPz1hOCcAYXjSaOw7gVnC8RqVuK4X5eWY8xQrv8Zs/hRvYqTHbqQmboFiNG2kOqF9pFy9cPoMkKQJclruNunmLUmKFjuaLRYRrsYIGi+XCGW5uKoX9Ydjbk//rtBFVciiLmq7LxYRW0TLhjYZzthS4XauF75qTV/U2XeEvmrfApCPfJGvQniEE/zIj/zI7Mt6cDMv8NWDm3mBrx7czAt89eAmXuCTMV/w8gKfjPmClxf4ZMwXvLzgCw+u+IKXF3hzMOILXl7gkzFf8PICL8CIL3h5gTeJI77g5QXeJI74gpcX+GTMF7y8wCdjvuDlBf6/gdd8YYoX/AMhnqLFr/RkuQAAAABJRU5ErkJggg==",
    },
  ]),
    (self.DEFAULT_LOOK = { skin: "p:penguin", slim: !0 }));
  const now = () => performance.now(),
    potLogged = () =>
      self.XZ && XZ.logged ? XZ.logged() : "undefined" != typeof Account && Account.loggedIn,
    potName = () =>
      self.XZ && XZ.acctName
        ? XZ.acctName()
        : ("undefined" != typeof Account && Account.loggedIn && Account.name) || "",
    potGuest = () => !!(self.XZ && XZ.isGuest && XZ.isGuest()),
    t = /[?&]lobbyscene\b/.test(location.search),
    e =
      ((a = 0.2),
      (o = 0.9),
      (s = 0.25),
      (i = 1),
      (t) => {
        let e = 0,
          l = 1,
          r = t;
        for (let o = 0; o < 24; o++)
          ((r = (e + l) / 2),
            3 * (1 - r) * (1 - r) * r * a + 3 * (1 - r) * r * r * s + r * r * r < t
              ? (e = r)
              : (l = r));
        return 3 * (1 - r) * (1 - r) * r * o + 3 * (1 - r) * r * r * i + r * r * r;
      });
  var a, o, s, i;
  const l = { cx: 0.47, foot: 0.03, tall: 0.84 },
    r = { pos: [0.5, 6.2, 12], yaw: 0, pitch: 0.02, fov: 62 },
    d = (() => {
      const t = 44,
        e = 16,
        a = "M6,0H38L44,6V94L38,100H6L0,94V6Z",
        o = "M0,0H38L44,6V52L38,58H16V100H0Z M16,15V43H28V15Z",
        g = (t, ...e) => ({ w: t, p: e });
      return {
        A: g(t, "M6,0H38L44,6V100H28V57.5H16V100H0V6Z M16,15V42.5H28V15Z"),
        B: g(t, "M0,0H38L44,6V46L40,50L44,54V94L38,100H0Z M16,15V42.5H28V15Z M16,57.5V85H28V57.5Z"),
        C: g(t, "M6,0H44V15H16V85H44V100H6L0,94V6Z"),
        D: g(t, "M0,0H32L44,12V88L32,100H0Z M16,15V85H28V15Z"),
        E: g(t, "M0,0H44V15H16V42.5H38V57.5H16V85H44V100H0Z"),
        F: g(t, "M0,0H44V15H16V42.5H38V57.5H16V100H0Z"),
        G: g(t, "M6,0H44V15H16V85H28V57.5H22V42.5H44V100H6L0,94V6Z"),
        H: g(t, "M0,0H16V42.5H28V0H44V100H28V57.5H16V100H0Z"),
        I: g(e, "M0,0H16V100H0Z"),
        J: g(t, "M28,0H44V94L38,100H6L0,94V60H16V85H28Z"),
        K: g(t, "M0,0H16V100H0Z", "M28,0H44L16,58V40Z", "M16,44L44,100H28L16,66Z"),
        L: g(t, "M0,0H16V85H44V100H0Z"),
        M: g(56, "M0,0H16L28,26L40,0H56V100H40V36L28,56L16,36V100H0Z"),
        N: g(t, "M0,0H16L28,62V0H44V100H28L16,38V100H0Z"),
        O: g(t, a + " M16,15V85H28V15Z"),
        P: g(t, o),
        Q: g(t, a + " M16,15V85H28V15Z", "M22,72L44,96V100H30L16,86Z"),
        R: g(t, o, "M28,52H44V100H28Z"),
        S: g(t, "M6,0H44V15H16V42.5H38L44,48.5V94L38,100H0V85H28V57.5H6L0,51.5V6Z"),
        T: g(t, "M0,0H44V15H30V100H14V15H0Z"),
        U: g(t, "M0,0H16V85H28V0H44V94L38,100H6L0,94Z"),
        V: g(t, "M0,0H16V70L22,84L28,70V0H44V76L26,100H18L0,76Z"),
        W: g(56, "M0,0H16V64L28,44L40,64V0H56V100H40L28,80L16,100H0Z"),
        X: g(t, "M0,0H16L44,100H28Z", "M28,0H44L16,100H0Z"),
        Y: g(t, "M0,0H16V36H28V0H44V50L30,58V100H14V58L0,50Z"),
        Z: g(t, "M0,0H44V15L18,85H44V100H0V85L26,15H0Z"),
        0: g(t, a + " M16,15V85H28V15Z"),
        1: g(t, "M6,0H30V85H40V100H4V85H14V18H6Z"),
        2: g(t, "M0,0H38L44,6V58H16V85H44V100H0V42H28V15H0Z"),
        3: g(t, "M0,0H38L44,6V94L38,100H0V85H28V57.5H10V42.5H28V15H0Z"),
        4: g(t, "M0,0H16V42.5H28V0H44V100H28V57.5H0Z"),
        5: g(t, "M0,0H44V15H16V42.5H38L44,48.5V94L38,100H0V85H28V57.5H0Z"),
        6: g(t, "M6,0H44V15H16V42H38L44,48V94L38,100H6L0,94V6Z M16,58V85H28V58Z"),
        7: g(t, "M0,0H44V15L26,100H10L28,15H0Z"),
        8: g(t, a + " M16,15V42.5H28V15Z M16,57.5V85H28V57.5Z"),
        9: g(t, "M6,0H38L44,6V94L38,100H0V85H28V57.5H6L0,51.5V6Z M16,15V42.5H28V15Z"),
        "·": g(16, "M0,42H16V58H0Z"),
        "-": g(30, "M0,43H30V57H0Z"),
        "/": g(t, "M28,0H44L16,100H0Z"),
        "+": g(t, "M15,26H29V74H15Z M4,43H40V57H4Z"),
        ">": g(t, "M0,0H16L44,44V56L16,100H0L24,50Z"),
      };
    })();
  function blockText(t, e = {}) {
    const a = e.gap ?? 10,
      o = e.space ?? 30;
    let s = 0;
    const i = [];
    for (const e of String(t).toUpperCase()) {
      if (" " === e) {
        s += o;
        continue;
      }
      const t = d[e];
      if (t) {
        for (const e of t.p)
          i.push(`<path transform="translate(${s},0)" d="${e}" fill-rule="evenodd"/>`);
        s += t.w + a;
      }
    }
    const l = Math.max(1, s - a);
    return `<svg class="bt${e.cls ? " " + e.cls : ""}" viewBox="0 0 ${l} 100" style="height:1em;width:${(l / 100).toFixed(3)}em" fill="currentColor" aria-label="${t}">${i.join("")}</svg>`;
  }
  function buildScene(t) {
    const e = t.world;
    for (const [t, a] of [
      [-48, -64],
      [48, -64],
      [-48, 14],
      [48, 14],
      [0, 0],
    ])
      if (!e.isLoaded(t, a)) return !1;
    const set = (t, a, o, s, i, l) =>
        e.setBlock(
          t,
          a,
          o,
          "air" === s
            ? 0
            : ((t, e) => (void 0 !== BID[t] ? BID[t] : void 0 !== BID[e] ? BID[e] : 1))(s, i),
          l || 0,
        ),
      fill = (t, e, a, o, s, i, l, r, d) => {
        for (let u = Math.min(t, o); u <= Math.max(t, o); u++)
          for (let t = Math.min(e, s); t <= Math.max(e, s); t++)
            for (let e = Math.min(a, i); e <= Math.max(a, i); e++) set(u, t, e, l, r, d);
      },
      a = ((o = 11), () => (o = (1664525 * o + 1013904223) >>> 0) / 4294967296);
    var o;
    for (let t = -40; t <= 40; t++)
      for (let e = -62; e <= 12; e++) {
        set(
          t,
          3,
          e,
          (t + 700) % 7 == 3 || (e + 700) % 7 == 3 ? "iron_block" : "smooth_quartz",
          "quartz_block",
        );
      }
    (fill(-18, 3, -33, 18, 3, -30, "iron_block"),
      fill(-17, 3, -32, 17, 3, -31, "water"),
      fill(-17, 2, -32, 17, 2, -31, "black_concrete", "stone"));
    const s = -48,
      i = -40;
    (fill(-26, 4, s, 26, 17, i, "white_concrete", "quartz_block"),
      fill(-26, 7, i, 26, 12, i, "light_blue_stained_glass", "glass"));
    for (let t = -26; t <= 26; t += 4) fill(t, 7, i, t, 12, i, "white_concrete", "quartz_block");
    (fill(-26, 14, i, 26, 16, i, "black_concrete", "coal_block"),
      fill(-26, 15, i, 26, 15, i, "orange_concrete", "orange_wool"),
      fill(-26, 17, i, 26, 17, i, "sea_lantern", "glowstone"),
      fill(-5, 4, i, 5, 13, i, "orange_concrete", "orange_wool"),
      fill(-4, 4, i, 4, 12, -46, "air"),
      fill(-4, 4, -47, 4, 12, -47, "white_concrete", "quartz_block"),
      fill(-3, 5, -47, 3, 11, -47, "light_blue_stained_glass", "glass"),
      fill(-4, 13, -46, 4, 13, -41, "white_concrete", "quartz_block"),
      fill(-3, 12, -45, 3, 12, -42, "sea_lantern", "glowstone"),
      fill(-4, 3, -46, 4, 3, i, "smooth_quartz", "quartz_block"),
      fill(-17, 18, s, 17, 22, -44, "white_concrete", "quartz_block"),
      fill(-17, 19, -44, 17, 21, -44, "light_blue_stained_glass", "glass"));
    for (let t = -17; t <= 17; t += 4)
      fill(t, 19, -44, t, 21, -44, "white_concrete", "quartz_block");
    (fill(30, 4, -56, 35, 33, -51, "white_concrete", "quartz_block"),
      fill(30, 28, -51, 35, 29, -51, "orange_concrete", "orange_wool"));
    for (let t = 7; t < 26; t += 3)
      fill(31, t, -51, 34, t, -51, "light_blue_stained_glass", "glass");
    (fill(32, 34, -54, 32, 41, -54, "iron_bars", "iron_block"),
      set(32, 42, -54, "sea_lantern", "glowstone"));
    const cont = (t, e, a, o, s, i) => {
      for (let l = 0; l < o; l++)
        for (let o = 0; o < 3; o++)
          for (let r = 0; r < 3; r++) {
            const [d, u] = "x" === i ? [t + l, a + o] : [t + o, a + l];
            set(
              d,
              e + r,
              u,
              l % 2 && 1 === r
                ? "white_concrete" === s
                  ? "light_gray_concrete"
                  : "white_concrete"
                : s,
              "white_wool",
            );
          }
    };
    (cont(-26, 4, -20, 8, "orange_concrete", "x"),
      cont(-25, 7, -20, 6, "light_blue_concrete", "x"),
      cont(-17, 4, -14, 6, "white_concrete", "z"));
    for (const t of [10, 15, 20]) fill(t, 4, -18, t + 3, 5, -18, "white_concrete", "quartz_block");
    for (const t of [10, 15, 20])
      fill(t, 5, -18, t + 3, 5, -18, "cyan_concrete", "light_blue_wool");
    for (const [t, e] of [
      [11, -25],
      [17, -27],
      [22, -24],
    ]) {
      fill(t, 4, e, t, 5, e, "iron_block");
      for (let a = -1; a <= 1; a++)
        for (let o = 0; o <= 2; o++)
          set(
            t + a,
            6 + o,
            e,
            0 === a && 1 === o ? "orange_concrete" : "white_concrete",
            "white_wool",
          );
    }
    for (const t of [-6, -16, -26])
      for (const e of [-8, 9])
        (fill(e, 4, t, e, 7, t, "quartz_pillar", "quartz_block"),
          set(e, 8, t, "sea_lantern", "glowstone"));
    const planter = (t, e, o, s) => {
        (fill(t, 4, e, o, 4, s, "smooth_quartz", "quartz_block"),
          fill(t + 1, 4, e + 1, o - 1, 4, s - 1, "grass_block"));
        for (let i = t + 1; i < o; i++)
          for (let t = e + 1; t < s; t++)
            a() < 0.4 &&
              set(
                i,
                5,
                t,
                ["short_grass", "oxeye_daisy", "azure_bluet", "cornflower", "short_grass"][
                  (5 * a()) | 0
                ],
                "short_grass",
              );
      },
      birch = (t, o, s) => {
        for (let i = -2; i <= 2; i++)
          for (let l = -2; l <= 2; l++)
            for (let r = s - 2; r <= s + 1; r++) {
              const d = r >= s ? 1.3 : 2.3;
              Math.hypot(i, l) > d + (a() < 0.3 ? 0.4 : 0) ||
                (0 === e.getBlock(t + i, 5 + r, o + l) && set(t + i, 5 + r, o + l, "birch_leaves"));
            }
        fill(t, 5, o, t, 4 + s, o, "birch_log");
      };
    return (
      planter(-12, -38, -7, -34),
      birch(-10, -36, 6),
      planter(8, -38, 13, -34),
      birch(10, -36, 6),
      planter(-34, -10, -28, -3),
      birch(-31, -7, 6),
      planter(27, -12, 33, -5),
      birch(30, -9, 7),
      planter(-6, -12, -3, -9),
      planter(4, -12, 7, -9),
      t.flushMesh && t.flushMesh(),
      !0
    );
  }
  const u = Math.sin,
    PORT = () =>
      self.LOBBY_PORT || {
        r: [0.58, 0.6, -0.05],
        l: [1.02, -0.7, 0.1],
        gun: [38, 0, 20],
        gt: [0, 0, 0],
      },
    b = {
      idle: (t) => {
        const e = PORT(),
          a = 0.035 * u(1.8 * t);
        return {
          head: { rx: 0.04 * u(1.1 * t), ry: 0.1 * u(0.6 * t) },
          rarm: { rx: e.r[0] + a, ry: e.r[1], rz: e.r[2] },
          larm: { rx: e.l[0] + a, ry: e.l[1], rz: e.l[2] },
        };
      },
      look: (t) => {
        const e = PORT(),
          a = 0.03 * u(1.8 * t);
        return {
          head: { ry: 0.5 * u(0.9 * t), rx: 0.06 * u(1.7 * t) },
          rarm: { rx: e.r[0] + a, ry: e.r[1], rz: e.r[2] },
          larm: { rx: e.l[0] + a, ry: e.l[1], rz: e.l[2] },
        };
      },
    },
    h = ["idle", "idle", "look"];
  function poseAt(t) {
    const e = h.length,
      a = Math.floor(t / 3.2) % e,
      o = (t % 3.2) / 3.2,
      s = b[h[a]](t);
    if (o < 0.8) return s;
    const i = (o - 0.8) / 0.2;
    return ((t, e, a) => {
      const o = {};
      for (const s of new Set([...Object.keys(t), ...Object.keys(e)])) {
        const i = t[s] || {},
          l = e[s] || {};
        o[s] = {
          rx: (i.rx || 0) * (1 - a) + (l.rx || 0) * a,
          ry: (i.ry || 0) * (1 - a) + (l.ry || 0) * a,
          rz: (i.rz || 0) * (1 - a) + (l.rz || 0) * a,
        };
      }
      return o;
    })(s, b[h[(a + 1) % e]](t), i * i * (3 - 2 * i));
  }
  let p = !1;
  const v = self.preItemDisplay;
  self.preItemDisplay = function (t, e, a, o, s, i) {
    if (p) {
      const t = PORT(),
        a = Math.PI / 180;
      return (
        t.gt && M4.translate(e, t.gt[0], t.gt[1], t.gt[2]),
        M4.rotX(e, t.gun[0] * a),
        M4.rotY(e, t.gun[1] * a),
        void M4.rotZ(e, t.gun[2] * a)
      );
    }
    return v ? v.apply(this, arguments) : void 0;
  };
  const m = { ok: null, bp: null, cp: null, vao: null, cvao: null, u: {}, cu: {} },
    y = [
      [-3.2, 2.4, -4.5, 0.95, 0, 0.3, 0],
      [3.4, 3, -5.5, 1.15, 1, -0.22, 1.3],
      [5, 1, -3.6, 0.75, 2, 0.35, 2.1],
      [-5.2, 0.9, -6.5, 1.2, 1, 0.18, 0.7],
      [1.4, 4, -8.5, 0.85, 0, -0.26, 2.9],
      [-1.6, 3.7, -10, 1, 2, 0.2, 4],
      [6.8, 3.3, -9.5, 0.95, 0, -0.17, 5.1],
      [-6.6, 3.2, -10.5, 1.1, 1, 0.21, 3.3],
      [2.6, 0.6, -2.4, 0.5, 0, 0.42, 1.8],
    ],
    w = [
      [-6.2, -9.5, 3.4, 7.2, 0.35, 0.42],
      [6.6, -11.5, 4.2, 5.6, 0.35, -0.38],
      [0.6, -15.5, 7.5, 3.6, 0.4, 0],
    ],
    k = [0.055, 0.06, 0.065],
    x = { g: new Float32Array(3), f: new Float32Array(3), e: new Float32Array(3) };
  function drawStudio(t, e) {
    const a = t.gl;
    if (null === m.ok)
      try {
        (!(function studioInit(t) {
          const sh = (e, a) => {
              const o = t.createShader(e);
              if (
                (t.shaderSource(o, a),
                t.compileShader(o),
                !t.getShaderParameter(o, t.COMPILE_STATUS))
              )
                throw new Error(t.getShaderInfoLog(o));
              return o;
            },
            prog = (e, a) => {
              const o = t.createProgram();
              if (
                (t.attachShader(o, sh(t.VERTEX_SHADER, e)),
                t.attachShader(o, sh(t.FRAGMENT_SHADER, a)),
                t.linkProgram(o),
                !t.getProgramParameter(o, t.LINK_STATUS))
              )
                throw new Error(t.getProgramInfoLog(o));
              return o;
            };
          m.bp = prog(
            "#version 300 es\n      out vec2 v; void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0; v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }",
            "#version 300 es\n      precision highp float; in vec2 v; out vec4 o;\n      uniform vec2 u_res; uniform float u_hz; uniform vec3 u_stand; uniform vec2 u_par; uniform vec4 u_sh[12]; uniform float u_t; uniform vec3 u_g;\n      float ell(vec2 p, vec2 c, vec2 r) { vec2 d = (p - c) / r; return dot(d, d); }\n      // (a grid's lines, a pixel or two wide whatever the distance, and a soft glow round them; x / y: how strong each)\n      vec2 grid(vec2 q) { vec2 d = 0.5 - abs(fract(q) - 0.5), fw = max(fwidth(q), vec2(1e-5)); vec2 l = 1.0 - smoothstep(vec2(0.0), fw * 1.4, d); vec2 g = exp(-d / (fw * 7.0)); float far = 1.0 - smoothstep(0.12, 0.45, max(fw.x, fw.y)); return vec2(max(l.x, l.y), max(g.x, g.y)) * far; }\n      void main() {\n        float ar = u_res.x / u_res.y; vec2 p = v; float hz = u_hz;\n        // the wall: charcoal, darker up high; a faint grid on it\n        float up = clamp((p.y - hz) / max(1.0 - hz, 0.01), 0.0, 1.0);\n        vec3 wall = mix(vec3(0.115, 0.125, 0.13), vec3(0.04, 0.045, 0.05), smoothstep(0.0, 1.0, up));\n        vec2 wg = grid(vec2((p.x - 0.5 - u_par.x * 0.008) * ar * 7.0, (p.y - hz) * 7.0));\n        wall += u_g * (wg.x * 0.07 + wg.y * 0.02) * (1.0 - up * 0.7);\n        // the floor: lighter toward the viewer; its grid in green, moving slowly toward the viewer, fading into the distance\n        float below = hz - p.y;\n        vec3 floorC = mix(vec3(0.05, 0.055, 0.06), vec3(0.10, 0.11, 0.115), smoothstep(0.0, hz, below));\n        float zf = 0.16 / max(below, 0.004), xf = (p.x - 0.5 - u_par.x * 0.02) * ar * zf;\n        vec2 fg = grid(vec2(xf * 4.0, zf * 3.2 - u_t * 0.3));\n        // (a scan line sweeping over the floor toward the viewer every ~12 s, the lines brighter under it)\n        float sp = mix(14.0, 0.6, fract(u_t / 12.0)), pulse = exp(-pow((zf - sp) * 0.9, 2.0));\n        float fade = smoothstep(16.0, 1.0, zf);\n        floorC += u_g * (fg.x * (0.55 + 1.2 * pulse) + fg.y * (0.16 + 0.3 * pulse)) * fade;\n        floorC += u_g * 0.035 * pulse * fade;\n        // the line between them: a green haze along the horizon\n        float k = smoothstep(-0.004, 0.004, p.y - hz);\n        vec3 c = mix(floorC, wall, k);\n        c += u_g * (0.16 * exp(-pow((p.y - hz) / 0.012, 2.0)) + 0.07 * exp(-pow((p.y - hz) / 0.08, 2.0)));\n        // the floating cubes' and the panels' shadows on the floor\n        for (int i = 0; i < 12; i++) { vec4 s = u_sh[i]; if (s.w <= 0.0) continue; c *= 1.0 - min(0.6, s.w * 0.45 * exp(-ell(p * vec2(ar, 1.0), vec2(s.x * ar, s.y), vec2(s.z, s.z * 0.28)))); }\n        // the stand: a dark round plinth - its top an ellipse at the feet, a green ring of light round it, a glow on the floor\n        vec2 sc = u_stand.xy; float rx = u_stand.z, ry = rx * 0.2 * ar, hb = 0.022;\n        vec2 q = p * vec2(ar, 1.0), cq = sc * vec2(ar, 1.0);\n        float halo = exp(-ell(q, cq - vec2(0.0, hb * 0.5), vec2(rx * 1.9, ry * 2.6)));\n        c += u_g * 0.10 * halo;\n        float topE = ell(q, cq, vec2(rx, ry)), botE = ell(q, cq - vec2(0.0, hb), vec2(rx, ry));\n        bool side = (q.y < cq.y && q.y > cq.y - hb && abs(q.x - cq.x) < rx) || botE < 1.0;\n        if (side && topE >= 1.0) { float sx = (q.x - cq.x) / rx; c = mix(vec3(0.06, 0.065, 0.07), vec3(0.11, 0.12, 0.125), 0.5 + 0.5 * cos(sx * 1.5));\n          c += u_g * 0.5 * exp(-pow((botE - 1.0) / 0.08, 2.0)); }   // (the ring at its foot)\n        if (topE < 1.0) { c = mix(vec3(0.14, 0.15, 0.155), vec3(0.09, 0.095, 0.10), smoothstep(0.1, 1.0, topE));\n          c += u_g * (0.9 * exp(-pow((sqrt(topE) - 0.97) / 0.025, 2.0)) + 0.06 * smoothstep(0.5, 1.0, topE));   // (the ring of light at its edge)\n          c -= 0.06 * exp(-ell(q, cq, vec2(rx * 0.32, ry * 0.42))); }   // (the feet's contact shadow)\n        // the vignette\n        vec2 vc = (p - 0.5) * vec2(ar, 1.0); c *= 1.0 - 0.38 * smoothstep(0.3, 1.25, length(vc));\n        o = vec4(max(c, vec3(0.0)), 1.0);\n      }",
          );
          for (const e of ["u_res", "u_hz", "u_stand", "u_par", "u_sh", "u_t", "u_g"])
            m.u[e] = t.getUniformLocation(m.bp, e);
          m.cp = prog(
            "#version 300 es\n      layout(location=0) in vec3 a_p; layout(location=1) in vec3 a_n;\n      uniform mat4 u_vp; uniform mat4 u_m; out vec3 v_n; out vec3 v_lp; out float v_d;\n      void main() { vec4 w = u_m * vec4(a_p, 1.0); v_n = mat3(u_m) * a_n; v_lp = a_p; vec4 cp = u_vp * w; v_d = cp.w; gl_Position = cp; }",
            "#version 300 es\n      precision highp float; in vec3 v_n; in vec3 v_lp; in float v_d; out vec4 o; uniform vec3 u_c; uniform vec3 u_f; uniform vec3 u_bg;\n      void main() {\n        vec3 n = normalize(v_n), L = normalize(vec3(-0.45, 0.85, 0.5));\n        float sh = 0.55 + 0.45 * max(dot(n, L), 0.0);\n        vec3 a = abs(v_lp) * 2.0; float m1 = max(a.x, max(a.y, a.z)), m2 = a.x + a.y + a.z - m1 - min(a.x, min(a.y, a.z));\n        float fw = max(fwidth(m2), 1e-4);\n        float line = smoothstep(1.0 - fw * 2.6, 1.0 - fw * 0.6, m2), glow = exp(-(1.0 - m2) / (fw * 9.0));\n        vec3 c = u_f * sh + u_c * (line * 1.1 + glow * 0.35);\n        float fog = clamp((v_d - 7.0) / 20.0, 0.0, 0.65);\n        o = vec4(mix(c, u_bg, fog), 1.0);\n      }",
          );
          for (const e of ["u_vp", "u_m", "u_c", "u_f", "u_bg"])
            m.cu[e] = t.getUniformLocation(m.cp, e);
          m.vao = t.createVertexArray();
          const e = [
              [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
              ],
              [
                [-1, 0, 0],
                [0, 0, 1],
                [0, 1, 0],
              ],
              [
                [0, 1, 0],
                [0, 0, 1],
                [1, 0, 0],
              ],
              [
                [0, -1, 0],
                [1, 0, 0],
                [0, 0, 1],
              ],
              [
                [0, 0, 1],
                [1, 0, 0],
                [0, 1, 0],
              ],
              [
                [0, 0, -1],
                [0, 1, 0],
                [1, 0, 0],
              ],
            ],
            a = [];
          for (const [t, o, s] of e) {
            const c = (e, a) => [
              0.5 * t[0] + 0.5 * (o[0] * e + s[0] * a),
              0.5 * t[1] + 0.5 * (o[1] * e + s[1] * a),
              0.5 * t[2] + 0.5 * (o[2] * e + s[2] * a),
            ];
            for (const [e, o] of [
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, -1],
              [1, 1],
              [-1, 1],
            ])
              a.push(...c(e, o), ...t);
          }
          ((m.cvao = t.createVertexArray()), t.bindVertexArray(m.cvao));
          const o = t.createBuffer();
          (t.bindBuffer(t.ARRAY_BUFFER, o),
            t.bufferData(t.ARRAY_BUFFER, new Float32Array(a), t.STATIC_DRAW),
            t.enableVertexAttribArray(0),
            t.vertexAttribPointer(0, 3, t.FLOAT, !1, 24, 0),
            t.enableVertexAttribArray(1),
            t.vertexAttribPointer(1, 3, t.FLOAT, !1, 24, 12),
            t.bindVertexArray(null));
        })(a),
          (m.ok = !0));
      } catch (t) {
        (console.warn("studio", t), (m.ok = !1));
      }
    if (!m.ok) return !1;
    const o = t.canvas.width,
      s = t.canvas.height,
      i = o / s,
      r = now() / 1e3,
      d = e.layout || l,
      u = [
        0.35 * Math.sin(0.11 * r) + 0.5 * e.sx,
        1.6 + 0.08 * Math.sin(0.07 * r) - 0.25 * e.sy,
        6.5,
      ],
      b = 0.02 * Math.sin(0.09 * r) + 0.03 * e.sx,
      h = 0.015 * e.sy - 0.05,
      p = M4.create();
    (M4.perspective(p, 0.75, i, 0.1, 60),
      M4.rotX(p, -h),
      M4.rotY(p, -b),
      M4.translate(p, -u[0], -u[1], -u[2]));
    const toScreen = (t, e, a) => {
        const o = p,
          s = o[3] * t + o[7] * e + o[11] * a + o[15];
        return [
          ((o[0] * t + o[4] * e + o[8] * a + o[12]) / s) * 0.5 + 0.5,
          ((o[1] * t + o[5] * e + o[9] * a + o[13]) / s) * 0.5 + 0.5,
          s,
        ];
      },
      v = Math.max(0.2, Math.min(0.75, toScreen(0, 0, -400)[1])),
      S = (function studioGreen(t) {
        const e = 0.5 + 0.5 * Math.sin(t * ((2 * Math.PI) / 40)),
          a = 0.92 + 0.08 * Math.sin(0.9 * t),
          o = [0.24, 1, 0.38],
          s = [0.12, 1, 0.55];
        for (let t = 0; t < 3; t++) x.g[t] = (o[t] + (s[t] - o[t]) * e) * a;
        return x.g;
      })(r),
      F = new Float32Array(48);
    (y.forEach(([t, e, a, o], s) => {
      const i = toScreen(t, 0, a);
      i[2] > 0 &&
        ((F[4 * s] = i[0]),
        (F[4 * s + 1] = i[1]),
        (F[4 * s + 2] = (1.4 * o) / i[2]),
        (F[4 * s + 3] = 1 * Math.max(0, 1 - e / 6)));
    }),
      w.forEach(([t, e, a], o) => {
        const s = toScreen(t, 0, e + 0.25),
          i = 9 + o;
        s[2] > 0 &&
          ((F[4 * i] = s[0]),
          (F[4 * i + 1] = s[1]),
          (F[4 * i + 2] = (0.75 * a) / s[2]),
          (F[4 * i + 3] = 1.6));
      }),
      a.disable(a.DEPTH_TEST),
      a.disable(a.CULL_FACE),
      a.disable(a.BLEND),
      a.depthMask(!1),
      a.useProgram(m.bp),
      a.uniform2f(m.u.u_res, o, s),
      a.uniform1f(m.u.u_hz, v),
      a.uniform2f(m.u.u_par, e.sx || 0, e.sy || 0),
      a.uniform1f(m.u.u_t, r),
      a.uniform3fv(m.u.u_g, S),
      a.uniform3f(m.u.u_stand, d.cx, d.foot - 0.004, Math.max(0.05, 0.16 * d.tall)),
      a.uniform4fv(m.u.u_sh, F),
      a.bindVertexArray(m.vao),
      a.drawArrays(a.TRIANGLES, 0, 3),
      a.enable(a.DEPTH_TEST),
      a.depthMask(!0),
      a.disable(a.CULL_FACE),
      a.clear(a.DEPTH_BUFFER_BIT),
      a.useProgram(m.cp),
      a.uniformMatrix4fv(m.cu.u_vp, !1, p),
      a.bindVertexArray(m.cvao),
      a.uniform3fv(m.cu.u_bg, k));
    const set = (t, e) => {
      (a.uniform3fv(m.cu.u_f, t), a.uniform3fv(m.cu.u_c, e));
    };
    for (let t = 0; t < 3; t++) ((x.f[t] = 0.42 * S[t]), (x.e[t] = 0.7 * S[t] + 0.3));
    set([0.075, 0.08, 0.085], [0.8 * S[0], 0.8 * S[1], 0.8 * S[2]]);
    for (const [t, e, o, s, i, l] of w) {
      const r = M4.create();
      (M4.translate(r, t, s / 2, e),
        M4.rotY(r, l),
        M4.scale(r, o, s, i),
        a.uniformMatrix4fv(m.cu.u_m, !1, r),
        a.drawArrays(a.TRIANGLES, 0, 36));
    }
    for (const [t, e, o, s, i, l, d] of y) {
      2 === i
        ? set(x.f, x.e)
        : 1 === i
          ? set([0.15, 0.16, 0.165], x.e)
          : set([0.09, 0.095, 0.1], S);
      const u = M4.create();
      (M4.translate(u, t, e + 0.12 * Math.sin(0.6 * r + d), o),
        M4.rotY(u, r * l + d),
        M4.rotX(u, 0.5 + 0.3 * Math.sin(r * l * 0.7 + d)),
        M4.rotZ(u, 0.3 + 0.2 * d),
        M4.scale(u, s, s, s),
        a.uniformMatrix4fv(m.cu.u_m, !1, u),
        a.drawArrays(a.TRIANGLES, 0, 36));
    }
    return (
      a.bindVertexArray(null),
      a.clear(a.DEPTH_BUFFER_BIT),
      a.depthMask(!0),
      a.enable(a.DEPTH_TEST),
      a.enable(a.CULL_FACE),
      !0
    );
  }
  const S = { img: null, tex: null, prog: null, vao: null };
  function drawFigure(t, e) {
    const a = t.renderer,
      o = a.gl,
      s = t.player;
    if (!s || "undefined" == typeof Skins) return;
    e.relax ||
      (function arm(t) {
        const e = t.player,
          a = self.XZ;
        if (!e || !a || !a.R || "undefined" == typeof ITEM_KEY) return;
        const o = ITEM_KEY[a.R.keys.ar];
        if (void 0 === o) return;
        if (e.inv.slots[0] && e.inv.slots[0].id === o) return;
        const s = { id: o, count: 1, dmg: 0 };
        (a.setRounds && a.cap && a.setRounds(s, a.cap(s)), (e.inv.slots[0] = s), (e.inv.sel = 0));
      })(t);
    const i = s.inv.slots[0];
    e.relax && (s.inv.slots[0] = null);
    const r = a.canvas.width / a.canvas.height;
    e.step();
    const d = e.layout || l,
      b = 2 / d.tall,
      h = -d.foot * b,
      v = h + b,
      m = (b * r) / 2,
      y = (d.cx - 0.5) * b * r,
      w = M4.create();
    M4.ortho(w, -m - y, m - y, h, v, -6, 6);
    const k = (now() - e.t0) / 1e3,
      x = e.relax
        ? {
            head: { rx: 0.04 * u(1.1 * k), ry: 0.12 * u(0.6 * k) },
            rarm: { rx: 0.05 * u(1.2 * k), rz: -0.07 - 0.03 * u(1.8 * k) },
            larm: { rx: -0.05 * u(1.2 * k), rz: 0.07 + 0.03 * u(1.8 * k) },
          }
        : poseAt(k);
    ((x.head = x.head || {}),
      (x.head.ry = (x.head.ry || 0) - 0.35 * e.sx),
      (x.head.rx = (x.head.rx || 0) - 0.2 * e.sy));
    const S = M4.create();
    (M4.translate(S, 0, 0.02 * Math.max(0, u(1.8 * k)) * 0, 0),
      M4.rotY(S, e.yaw),
      M4.scale(S, 0.9375, 0.9375, 0.9375));
    const F = [1, 1],
      A = { day: 1, fogColor: [0, 0, 0], fogNear: 1e8, fogFar: 2e8, nightTint: [1, 1, 1] },
      E = a.fxOn,
      C = a.camPos,
      T = a.vp;
    ((a.fxOn = !1),
      (a.camPos = [0, 0, 0]),
      (a.vp = w),
      o.clear(o.DEPTH_BUFFER_BIT),
      o.enable(o.DEPTH_TEST),
      o.disable(o.CULL_FACE),
      (p = !0));
    try {
      const e = Skins.modelOf(t, s),
        o = t.heldAttach ? t.heldAttach(s, e, s.inv.held, null, F, A) : null;
      if (
        (a.drawModel(e, Skins.texOf(t, s), S, x, F, A, { vp: w, attach: o, inv: !0 }),
        "undefined" != typeof Capes)
      )
        try {
          Capes.draw(t, s, S, x, F, A, { vp: w, still: !0, inv: !0 });
        } catch (t) {}
    } catch (t) {
      e.err || ((e.err = !0), console.error("lobby figure", t));
    } finally {
      ((p = !1),
        (a.fxOn = E),
        (a.camPos = C),
        (a.vp = T),
        o.enable(o.CULL_FACE),
        e.relax && (s.inv.slots[0] = i));
    }
  }
  const F = {
    live: t,
    built: !1,
    mx: 0,
    my: 0,
    sx: 0,
    sy: 0,
    yaw: Math.PI + 0.3,
    drag: null,
    t0: 0,
    layout: null,
    face: Math.PI + 0.3,
    tw: null,
    moveTo(t, e, a = 520) {
      const o = Object.assign({}, this.layout || l);
      ((this.tw = {
        from: o,
        to: Object.assign({}, l, t),
        t0: now(),
        ms: a,
        y0: this.yaw,
        y1: void 0 === e ? this.face : e,
      }),
        void 0 !== e && (this.face = e));
    },
    start(t) {
      ((this.layout = null),
        (this.tw = null),
        (this.face = Math.PI + 0.3),
        (this.built = !1),
        (this.mx = this.my = this.sx = this.sy = 0),
        (this.t0 = now()),
        (this.yaw = Math.PI + 0.3),
        (t.titleCam = [...r.pos]),
        (t.titleYaw = r.yaw),
        (t.titlePitch = r.pitch),
        (t.titleFov = r.fov));
    },
    step() {
      const t = this.tw;
      if (!t) return;
      const a = Math.min(1, (now() - t.t0) / t.ms),
        o = e(a);
      ((this.layout = {
        cx: t.from.cx + (t.to.cx - t.from.cx) * o,
        foot: t.from.foot + (t.to.foot - t.from.foot) * o,
        tall: t.from.tall + (t.to.tall - t.from.tall) * o,
      }),
        this.drag || (this.yaw = t.y0 + (t.y1 - t.y0) * o),
        a >= 1 && (this.tw = null));
    },
    frame(t, e) {
      this.live && !this.built && (this.built = buildScene(t));
      const a = 1 - Math.exp(-e / 220);
      ((this.sx += (this.mx - this.sx) * a),
        (this.sy += (this.my - this.sy) * a),
        this.tw || this.drag || (this.yaw += (this.face - this.yaw) * (1 - Math.exp(-e / 1800))),
        this.step());
    },
  };
  Game.prototype.startTitle = function () {
    ((this.state = "title"),
      (this.saveQ = null),
      this.ui && (this.ui.pinned = null),
      (this.pendingPin = null),
      (this.titleScene = null),
      this.setupWorld(20261116, !1),
      (this.world.flat = !0),
      (this.world.flatTop = 3),
      (this.world.structures = !1),
      (this.player = new Player(this, 0.5, 5, 0.5)),
      (this.panoAlpha = 0),
      (this.panoT = 0),
      (this.panoFading = !1),
      (this.titleGround = !1),
      (this.worldTime = 4500),
      (this.weather = 0),
      (this.rainTarget = 0),
      (this.lobby = F),
      F.start(this),
      this.ui.open(new LobbyScreen(this)));
    {
      const t = this.settings,
        e = "undefined" != typeof LEGAL ? LEGAL.v : 0;
      let a = null;
      try {
        ((a = sessionStorage.getItem("potato:after")), sessionStorage.removeItem("potato:after"));
      } catch (t) {}
      "settings" === a && t.onboarded
        ? setTimeout(() => {
            "title" === this.state &&
              this.ui.open(new PotatoSettings(this, this.ui.screen, "video"));
          }, 150)
        : (!t.onboarded || (t.legalV || 0) < e) &&
          setTimeout(() => {
            "title" !== this.state ||
              this.ui.screen instanceof PotatoWelcome ||
              (!t.onboarded && (t.legalV || 0) >= e && !t.potBench && self.PotatoQuality
                ? self.PotatoQuality.run(this, "onboard")
                : this.ui.open(
                    new PotatoWelcome(
                      this,
                      !t.onboarded,
                      !t.onboarded && (t.legalV || 0) >= e ? (t.potDevice ? 1 : "device") : 0,
                    ),
                  ));
          }, 150);
    }
  };
  const A = Game.prototype.render;
  Game.prototype.render = function (t, e) {
    const a = this.lobby;
    if ("title" !== this.state || !a || a.live) return A.call(this, t, e);
    const o = this.renderer,
      s = o.gl;
    (s.bindFramebuffer(s.FRAMEBUFFER, null),
      s.viewport(0, 0, o.canvas.width, o.canvas.height),
      s.clearColor(0.62, 0.8, 0.95, 1),
      s.clear(s.COLOR_BUFFER_BIT | s.DEPTH_BUFFER_BIT),
      drawStudio(o, a) ||
        (!(function loadBg() {
          S.img || ((S.img = new Image()), (S.img.src = "potato/bg.jpg"));
        })(),
        (function drawBg(t, e, a) {
          const o = t.gl,
            s = S.img;
          if (!s || !s.complete || !s.naturalWidth) return !1;
          if (!S.prog) {
            const t =
                "#version 300 es\n        uniform vec4 u_r; out vec2 v;\n        void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0; v = vec2(p.x, -p.y) * 0.5 * u_r.xy + 0.5 + u_r.zw; gl_Position = vec4(p, 0.0, 1.0); }",
              e =
                "#version 300 es\n        precision mediump float; in vec2 v; out vec4 o; uniform sampler2D u_t;\n        void main() { o = vec4(texture(u_t, v).rgb, 1.0); }",
              sh = (t, e) => {
                const a = o.createShader(t);
                return (o.shaderSource(a, e), o.compileShader(a), a);
              },
              a = o.createProgram();
            (o.attachShader(a, sh(o.VERTEX_SHADER, t)),
              o.attachShader(a, sh(o.FRAGMENT_SHADER, e)),
              o.linkProgram(a),
              (S.prog = a),
              (S.uR = o.getUniformLocation(a, "u_r")),
              (S.uT = o.getUniformLocation(a, "u_t")),
              (S.vao = o.createVertexArray()),
              (S.tex = o.createTexture()),
              o.bindTexture(o.TEXTURE_2D, S.tex),
              o.texImage2D(o.TEXTURE_2D, 0, o.RGBA, o.RGBA, o.UNSIGNED_BYTE, s),
              o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MIN_FILTER, o.LINEAR),
              o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MAG_FILTER, o.LINEAR),
              o.texParameteri(o.TEXTURE_2D, o.TEXTURE_WRAP_S, o.CLAMP_TO_EDGE),
              o.texParameteri(o.TEXTURE_2D, o.TEXTURE_WRAP_T, o.CLAMP_TO_EDGE));
          }
          const i = t.canvas.width,
            l = t.canvas.height,
            r = s.naturalWidth / s.naturalHeight,
            d = i / l;
          let u = 1,
            b = 1;
          return (
            d > r ? (b = r / d) : (u = d / r),
            (u *= 0.96),
            (b *= 0.96),
            o.useProgram(S.prog),
            o.uniform4f(S.uR, u, b, 0.015 * -e, 0.01 * -a),
            o.activeTexture(o.TEXTURE0),
            o.bindTexture(o.TEXTURE_2D, S.tex),
            o.uniform1i(S.uT, 0),
            o.disable(o.DEPTH_TEST),
            o.disable(o.CULL_FACE),
            o.disable(o.BLEND),
            o.depthMask(!1),
            o.bindVertexArray(S.vao),
            o.drawArrays(o.TRIANGLES, 0, 3),
            o.bindVertexArray(null),
            o.depthMask(!0),
            o.enable(o.DEPTH_TEST),
            o.enable(o.CULL_FACE),
            !0
          );
        })(o, a.sx, a.sy)),
      drawFigure(this, a),
      this.ui.draw());
  };
  const E = Game.prototype.createWorld;
  Game.prototype.createWorld = function (t, e, a, o, s) {
    return E.call(this, t, e, a, o, Object.assign({}, s, { structures: !1 }));
  };
  const C = Game.prototype.setupWorld;
  ((Game.prototype.setupWorld = function (...t) {
    return (
      (this.lobby = null),
      (this.titlePitch = null),
      (this.titleFov = null),
      C.apply(this, t)
    );
  }),
    (self.Potato = {
      Lobby: F,
      buildScene: buildScene,
      blockText: blockText,
      async capture(t, e = {}) {
        const a = game,
          o = a.renderer,
          s = a.settings.shaders,
          i = e.w || 2400,
          l = e.h || 1350,
          d = [a.titleCam, a.titleYaw, a.titlePitch, a.titleFov, a.worldTime];
        (Object.assign(a, {
          titleCam: e.pos || r.pos,
          titleYaw: e.yaw ?? r.yaw,
          titlePitch: e.pitch ?? r.pitch,
          titleFov: e.fov || r.fov,
          worldTime: e.time || 4500,
        }),
          (a.settings.shaders = e.shaders ?? 4),
          (o.forceSize = [i, l]));
        try {
          for (let t = 0; t < 48; t++)
            (a.render(0, now()), await new Promise((t) => setTimeout(t, 16)));
          a.render(0, now());
          const e = o.canvas.toDataURL("image/jpeg", 0.92),
            s = await fetch("http://127.0.0.1:8842/" + t + ".jpg", { method: "POST", body: e });
          return await s.text();
        } finally {
          ((o.forceSize = null),
            ([a.titleCam, a.titleYaw, a.titlePitch, a.titleFov, a.worldTime] = d),
            (a.settings.shaders = s));
        }
      },
    }));
  const pix = (t, e) => {
      const a = t.length,
        o = t[0].length;
      let s = "";
      return (
        t.forEach((t, e) => {
          for (let a = 0; a < o; a++) "." !== t[a] && (s += `M${a},${e}h1v1h-1z`);
        }),
        `<svg viewBox="0 0 ${o} ${a}" shape-rendering="crispEdges"><path d="${s}" fill="${e}"/></svg>`
      );
    },
    T =
      '<svg viewBox="0 0 12 12" shape-rendering="crispEdges"><path fill="#fff" d="M4 1h1v1H4zM7 1h1v1H7zM5 2h2v1H5zM3 3h6v1H3zM2 4h8v5H2zM3 9h6v1H3zM1 5h1v1H1zM10 5h1v1h-1zM1 7h1v1H1zM10 7h1v1h-1zM0 4h1v1H0zM11 4h1v1h-1zM0 9h1v1H0zM11 9h1v1h-1z"/><path fill="#FF5A1F" d="M5.5 4h1v5h-1zM3 5h1v1H3zM8 5h1v1H8z"/></svg>',
    M = pix(
      [
        "..X..X..",
        ".XXXXXX.",
        "XXX..XXX",
        ".X....X.",
        ".X....X.",
        "XXX..XXX",
        ".XXXXXX.",
        "..X..X..",
      ],
      "#111",
    ),
    $ = pix(
      [
        "XXX..XXX",
        "X......X",
        "X......X",
        "........",
        "........",
        "X......X",
        "X......X",
        "XXX..XXX",
      ],
      "#111",
    );
  (pix(
    [
      "XXXXXXXX",
      "X......X",
      "X.X.X..X",
      "X......X",
      "XXXXXXXX",
      ".XX.....",
      ".X......",
      "........",
    ],
    "#111",
  ),
    new Map());
  function itemPic(t, e, a = 128) {
    try {
      const o = t.renderer,
        s = o.iconSize,
        i = ITEM_KEY[e];
      if (void 0 === i || !o.iconAtlas) return "";
      const l = document.createElement("canvas");
      l.width = l.height = a;
      const r = l.getContext("2d");
      return (
        (r.imageSmoothingEnabled = !1),
        r.drawImage(o.iconAtlas, ...o.iconXY(i), s, s, 0, 0, a, a),
        l.toDataURL()
      );
    } catch (t) {
      return "";
    }
  }
  const z = new Map(),
    P = new Map();
  function hiCanvas(t, e, a = 256) {
    if (z.has(e)) return z.get(e);
    let o = null;
    try {
      const s = t.renderer,
        i = s && s.gl,
        l = ITEM_KEY[e],
        r = void 0 !== l ? ITEMS[l] : null,
        d = r && void 0 !== r.block ? BLOCKS[r.block] : null,
        u = "undefined" != typeof VM && VM.ready ? VM.data : null,
        b = u && r ? u.items[r.key] : null,
        h = b ? (void 0 !== b.gui ? b.gui : b.m) : void 0,
        p = void 0 !== h ? u.models[h] : null;
      if ("potato" === e && s && s.iconAtlas && void 0 !== l) {
        const t = document.createElement("canvas");
        t.width = t.height = a;
        const i = t.getContext("2d"),
          r = a / 2;
        (i.save(), i.translate(r, 1.08 * r));
        for (let t = 0; t < 12; t++) {
          i.rotate(Math.PI / 6);
          const t = i.createLinearGradient(0, 0, 0, -r);
          (t.addColorStop(0, "rgba(255,214,90,.75)"),
            t.addColorStop(1, "rgba(255,214,90,0)"),
            (i.fillStyle = t),
            i.beginPath(),
            i.moveTo(0.035 * -a, 0),
            i.lineTo(0, 0.98 * -r),
            i.lineTo(0.035 * a, 0),
            i.closePath(),
            i.fill());
        }
        i.restore();
        const d = i.createRadialGradient(r, 1.08 * r, 0, r, 1.08 * r, 0.62 * r);
        (d.addColorStop(0, "rgba(255,240,170,.95)"),
          d.addColorStop(0.45, "rgba(255,196,60,.55)"),
          d.addColorStop(1, "rgba(255,170,30,0)"),
          (i.fillStyle = d),
          i.fillRect(0, 0, a, a));
        const u = Math.round(0.86 * a),
          b = Math.round(r - u / 2),
          h = Math.round(1.16 * r - u / 2),
          p = document.createElement("canvas");
        p.width = p.height = u;
        const v = p.getContext("2d");
        ((v.imageSmoothingEnabled = !1),
          v.drawImage(s.iconAtlas, ...s.iconXY(l), s.iconSize, s.iconSize, 0, 0, u, u),
          (v.globalCompositeOperation = "source-in"),
          (v.fillStyle = "#FFD54A"),
          v.fillRect(0, 0, u, u));
        const m = Math.max(2, Math.round(0.018 * a));
        for (const [t, e] of [
          [-m, 0],
          [m, 0],
          [0, -m],
          [0, m],
          [-m, -m],
          [m, m],
          [-m, m],
          [m, -m],
        ])
          i.drawImage(p, b + t, h + e);
        (i.save(),
          (i.shadowColor = "#FFE27A"),
          (i.shadowBlur = 0.06 * a),
          (i.imageSmoothingEnabled = !1),
          i.drawImage(s.iconAtlas, ...s.iconXY(l), s.iconSize, s.iconSize, b, h, u, u),
          i.restore());
        const y = ["G...G...G", "GG.GGG.GG", "GGGGGGGGG", "GRGGBGGRG", "GGGGGGGGG"],
          w = { G: "#FFD54A", R: "#FF3B4E", B: "#3EC1FF" },
          k = Math.round(0.045 * a),
          x = y[0].length * k,
          S = Math.round(r - x / 2),
          F = Math.round(h + 0.3 * u - y.length * k);
        ((i.fillStyle = "#7A4E00"),
          y.forEach((t, e) => {
            for (let a = 0; a < t.length; a++)
              "." !== t[a] && i.fillRect(S + a * k - 2, F + e * k - 2, k + 4, k + 4);
          }),
          y.forEach((t, e) => {
            for (let a = 0; a < t.length; a++)
              "." !== t[a] && ((i.fillStyle = w[t[a]]), i.fillRect(S + a * k, F + e * k, k, k));
          }),
          (i.fillStyle = "rgba(255,255,255,.55)"),
          i.fillRect(S + k, F + 2 * k, x - 2 * k, Math.max(2, 0.35 * k)));
        const star = (t, e, a) => {
          ((i.fillStyle = "#FFF6CF"),
            i.beginPath(),
            i.moveTo(t, e - a),
            i.lineTo(t + 0.22 * a, e - 0.22 * a),
            i.lineTo(t + a, e),
            i.lineTo(t + 0.22 * a, e + 0.22 * a),
            i.lineTo(t, e + a),
            i.lineTo(t - 0.22 * a, e + 0.22 * a),
            i.lineTo(t - a, e),
            i.lineTo(t - 0.22 * a, e - 0.22 * a),
            i.closePath(),
            i.fill());
        };
        return (
          star(0.2 * a, 0.3 * a, 0.07 * a),
          star(0.82 * a, 0.4 * a, 0.055 * a),
          star(0.76 * a, 0.82 * a, 0.045 * a),
          star(0.18 * a, 0.78 * a, 0.035 * a),
          (o = t),
          z.set(e, o),
          o
        );
      }
      if (
        d &&
        (!p || !p.gen) &&
        (!d.be || "invisible" === d.be) &&
        !d.chestLike &&
        i &&
        i.renderbufferStorageMultisample
      ) {
        const t = i.createFramebuffer(),
          e = i.createRenderbuffer(),
          r = i.createRenderbuffer(),
          u = Math.min(4, i.getParameter(i.MAX_SAMPLES) || 4);
        (i.bindRenderbuffer(i.RENDERBUFFER, e),
          i.renderbufferStorageMultisample(i.RENDERBUFFER, u, i.RGBA8, a, a),
          i.bindRenderbuffer(i.RENDERBUFFER, r),
          i.renderbufferStorageMultisample(i.RENDERBUFFER, u, i.DEPTH_COMPONENT24, a, a),
          i.bindFramebuffer(i.FRAMEBUFFER, t),
          i.framebufferRenderbuffer(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0, i.RENDERBUFFER, e),
          i.framebufferRenderbuffer(i.FRAMEBUFFER, i.DEPTH_ATTACHMENT, i.RENDERBUFFER, r));
        const v = i.createFramebuffer(),
          m = i.createTexture();
        (i.bindTexture(i.TEXTURE_2D, m),
          i.texImage2D(i.TEXTURE_2D, 0, i.RGBA, a, a, 0, i.RGBA, i.UNSIGNED_BYTE, null),
          i.bindFramebuffer(i.FRAMEBUFFER, v),
          i.framebufferTexture2D(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0, i.TEXTURE_2D, m, 0));
        const y = s.vp,
          w = s.camPos,
          k = s.fxOn;
        try {
          (i.bindFramebuffer(i.FRAMEBUFFER, t),
            i.viewport(0, 0, a, a),
            i.disable(i.SCISSOR_TEST),
            i.clearColor(0, 0, 0, 0),
            i.clear(i.COLOR_BUFFER_BIT | i.DEPTH_BUFFER_BIT));
          const e = {
              tick: 0,
              day: 1,
              fogColor: [0, 0, 0],
              fogNear: 1e8,
              fogFar: 2e8,
              nightTint: [1, 1, 1],
            },
            r = M4.create();
          (M4.ortho(r, -0.5, 0.5, -0.5, 0.5, -10, 10),
            (s.vp = r),
            (s.camPos = [0, 0, 0]),
            (s.fxOn = !1));
          const u = (p && p.display && p.display.gui) || {
              r: [30, 225, 0],
              t: [0, 0, 0],
              s: [0.625, 0.625, 0.625],
            },
            m = M4.create();
          (M4.rotX(m, (u.r[0] * Math.PI) / 180),
            M4.rotY(m, (u.r[1] * Math.PI) / 180),
            M4.rotZ(m, (u.r[2] * Math.PI) / 180));
          const y = M4.create();
          (M4.translate(y, u.t[0] / 16, u.t[1] / 16, u.t[2] / 16),
            M4.mul(y, y, m),
            M4.scale(y, u.s[0], u.s[1], u.s[2]),
            M4.translate(y, -0.5, -0.5, -0.5));
          const w =
            p && p.elements && p.elements.length
              ? s.iconMesh(VM.bake(h), m, b ? s.itemTint(b.tints) : null, p.light)
              : Mesher.single(l, d.facing ? 4 : 0);
          (s.useChunkProg(e),
            i.enable(i.DEPTH_TEST),
            i.disable(i.CULL_FACE),
            i.enable(i.BLEND),
            i.blendFunc(i.SRC_ALPHA, i.ONE_MINUS_SRC_ALPHA),
            i.depthFunc(i.LEQUAL),
            s.drawMesh(w, y, e, [1, 0]),
            i.depthFunc(i.LESS),
            w.gl && (i.deleteVertexArray(w.gl.vao), i.deleteBuffer(w.gl.buf)),
            i.bindFramebuffer(i.READ_FRAMEBUFFER, t),
            i.bindFramebuffer(i.DRAW_FRAMEBUFFER, v),
            i.blitFramebuffer(0, 0, a, a, 0, 0, a, a, i.COLOR_BUFFER_BIT, i.NEAREST),
            i.bindFramebuffer(i.FRAMEBUFFER, v));
          const k = new Uint8Array(a * a * 4);
          i.readPixels(0, 0, a, a, i.RGBA, i.UNSIGNED_BYTE, k);
          for (let t = 0; t < k.length; t += 4) {
            const e = k[t + 3];
            if (e > 0 && e < 255) {
              const a = 255 / e;
              ((k[t] = Math.min(255, k[t] * a)),
                (k[t + 1] = Math.min(255, k[t + 1] * a)),
                (k[t + 2] = Math.min(255, k[t + 2] * a)));
            }
          }
          const x = document.createElement("canvas");
          x.width = x.height = a;
          const S = x.getContext("2d"),
            F = S.createImageData(a, a);
          for (let t = 0; t < a; t++)
            F.data.set(k.subarray((a - 1 - t) * a * 4, (a - t) * a * 4), t * a * 4);
          (S.putImageData(F, 0, 0), (o = x));
        } finally {
          ((s.vp = y),
            (s.camPos = w),
            (s.fxOn = k),
            i.bindFramebuffer(i.FRAMEBUFFER, null),
            i.disable(i.BLEND),
            i.enable(i.CULL_FACE),
            i.viewport(0, 0, i.drawingBufferWidth, i.drawingBufferHeight),
            i.deleteFramebuffer(t),
            i.deleteFramebuffer(v),
            i.deleteRenderbuffer(e),
            i.deleteRenderbuffer(r),
            i.deleteTexture(m));
        }
      }
      if (!o && void 0 !== l && s && s.iconAtlas) {
        const t = document.createElement("canvas");
        t.width = t.height = a;
        const e = t.getContext("2d");
        ((e.imageSmoothingEnabled = !1),
          e.drawImage(s.iconAtlas, ...s.iconXY(l), s.iconSize, s.iconSize, 0, 0, a, a),
          (o = t));
      }
    } catch (t) {
      (console.warn("tier icon", e, t), (o = null));
    }
    return (o && z.set(e, o), o);
  }
  const B = [
      "oak_log",
      "stone",
      "gold_block",
      "diamond_block",
      "emerald_block",
      "redstone_block",
      "potato",
    ],
    R = [
      { b: "#B9874B", l: "#E2B477", d: "#7A5329", f: "#C9A26A" },
      { b: "#9EA3A8", l: "#D3D7DB", d: "#656A70", f: "#B4B4B4" },
      { b: "#F2C230", l: "#FFE892", d: "#B07F0A", f: "#F5D33F" },
      { b: "#4FD8E8", l: "#C8F9FF", d: "#1B86A0", f: "#5CE8DD" },
      { b: "#2ECC71", l: "#A6F5C2", d: "#11774A", f: "#41E07A" },
      { b: "#F0384B", l: "#FFA3AE", d: "#951326", f: "#FF4A5A" },
      { b: "#FFC94A", l: "#FFF2B0", d: "#C3850C", f: "#FFC94A" },
    ],
    D = new Map(),
    I = new Map();
  function potatoPts(t, e, a, o, s, i = 1) {
    const l = [];
    for (let r = 0; r < 16; r++) {
      const d = (r / 16) * Math.PI * 2,
        u = (1 + 0.07 * Math.sin(3 * d + 0.5) + 0.04 * Math.sin(5 * d + 1.3)) * i,
        b = Math.cos(d) * a * u,
        h = Math.sin(d) * o * u;
      l.push([t + b * Math.cos(s) - h * Math.sin(s), e + b * Math.sin(s) + h * Math.cos(s)]);
    }
    return l;
  }
  function blob(t, e) {
    const a = e.length,
      mid = (t, e) => [(t[0] + e[0]) / 2, (t[1] + e[1]) / 2],
      o = mid(e[a - 1], e[0]);
    (t.beginPath(), t.moveTo(o[0], o[1]));
    for (let o = 0; o < a; o++) {
      const s = e[o],
        i = mid(s, e[(o + 1) % a]);
      t.quadraticCurveTo(s[0], s[1], i[0], i[1]);
    }
    t.closePath();
  }
  function poly(t, e) {
    (t.beginPath(),
      e.forEach((e, a) => (a ? t.lineTo(e[0], e[1]) : t.moveTo(e[0], e[1]))),
      t.closePath());
  }
  const ink = (t, e) => {
    ((t.lineJoin = "round"),
      (t.lineCap = "round"),
      (t.strokeStyle = "#15171C"),
      (t.lineWidth = e),
      t.stroke());
  };
  function hexPts(t, e, a, o) {
    const s = [];
    for (let i = 0; i < 6; i++) {
      const l = -Math.PI / 2 + (i * Math.PI) / 3;
      if (!o) {
        s.push([t + Math.cos(l) * a, e + Math.sin(l) * a]);
        continue;
      }
      const r = l - 0.16,
        d = l + 0.16;
      s.push(
        [t + Math.cos(r) * a * 0.94, e + Math.sin(r) * a * 0.94],
        [t + Math.cos(d) * a * 0.94, e + Math.sin(d) * a * 0.94],
      );
    }
    return s;
  }
  function shieldPath(t, e, a, o) {
    (t.beginPath(),
      t.moveTo(50 - e, a + 7),
      t.quadraticCurveTo(50 - e, a, 50 - e + 7, a),
      t.lineTo(44, a),
      t.lineTo(50, a - 4),
      t.lineTo(56, a),
      t.lineTo(50 + e - 7, a),
      t.quadraticCurveTo(50 + e, a, 50 + e, a + 7),
      t.lineTo(50 + e, 54),
      t.quadraticCurveTo(50 + e, 76, 50, o),
      t.quadraticCurveTo(50 - e, 76, 50 - e, 54),
      t.closePath());
  }
  function wing(t, e, a, o, s) {
    for (let i = a - 1; i >= 0; i--) {
      (t.save(), t.translate(50 + 25 * e, 40 + 8 * i), t.rotate(e * (0.38 * i - 0.5)));
      const a = o - 3.5 * i;
      (t.beginPath(),
        t.moveTo(0, -3.4),
        t.quadraticCurveTo(e * a * 0.6, -6.5, e * a, 0),
        t.quadraticCurveTo(e * a * 0.6, 5, 0, 3.4),
        t.closePath(),
        (t.fillStyle = i % 2 ? s.b : s.l),
        t.fill(),
        ink(t, 2.4),
        t.beginPath(),
        t.moveTo(3 * e, 0),
        t.lineTo(e * a * 0.78, -0.6),
        (t.strokeStyle = s.d),
        (t.lineWidth = 1.2),
        t.stroke(),
        t.restore());
    }
  }
  function sparkle(t, e, a, o, s) {
    (t.beginPath(),
      t.moveTo(e, a - o),
      t.quadraticCurveTo(e, a, e + o, a),
      t.quadraticCurveTo(e, a, e, a + o),
      t.quadraticCurveTo(e, a, e - o, a),
      t.quadraticCurveTo(e, a, e, a - o),
      t.closePath(),
      (t.fillStyle = s),
      t.fill());
  }
  function drawBadge(t, e) {
    const a = R[e];
    if (6 === e) {
      (t.save(), t.translate(50, 50));
      for (let e = 0; e < 16; e++)
        (t.rotate(Math.PI / 8),
          t.beginPath(),
          t.moveTo(-5.5, -16),
          t.lineTo(0, e % 2 ? -44 : -50),
          t.lineTo(5.5, -16),
          t.closePath(),
          (t.fillStyle = e % 2 ? "#FFE07A" : "#FFB21E"),
          t.fill(),
          ink(t, 1.6));
      t.restore();
    }
    if (e >= 3) {
      const o = 3 === e ? 2 : 3,
        s = 3 === e ? 22 : 4 === e ? 25 : 28;
      (wing(t, -1, o, s, a), wing(t, 1, o, s, a));
    }
    e <= 1 ? poly(t, hexPts(50, 51, 40, 1 === e)) : shieldPath(t, e >= 5 ? 30 : 28, 14, 91);
    const o = t.createLinearGradient(20, 10, 80, 92);
    if (
      (o.addColorStop(0, "#2B303B"),
      o.addColorStop(1, "#14171D"),
      (t.fillStyle = o),
      t.fill(),
      ink(t, 4.2),
      t.save(),
      e <= 1
        ? poly(t, hexPts(50, 51, 33, 1 === e))
        : (t.translate(50, 52),
          t.scale(0.8, 0.8),
          t.translate(-50, -52),
          shieldPath(t, e >= 5 ? 30 : 28, 14, 91)),
      (t.strokeStyle = a.f),
      (t.lineWidth = e <= 1 ? 2.6 : 3.2),
      t.stroke(),
      t.restore(),
      2 === e)
    )
      for (const e of [-1, 1])
        (t.beginPath(),
          t.moveTo(50 + 28 * e, 36),
          t.lineTo(50 + 41 * e, 30),
          t.lineTo(50 + 28 * e, 48),
          t.closePath(),
          (t.fillStyle = a.b),
          t.fill(),
          ink(t, 2.6));
    e >= 4 &&
      (t.beginPath(),
      t.moveTo(24, 80),
      t.lineTo(76, 80),
      t.lineTo(72, 87),
      t.lineTo(76, 94),
      t.lineTo(24, 94),
      t.lineTo(28, 87),
      t.closePath(),
      (t.fillStyle = a.d),
      t.fill(),
      ink(t, 2.6),
      t.beginPath(),
      t.moveTo(30, 87),
      t.lineTo(70, 87),
      (t.strokeStyle = a.l),
      (t.lineWidth = 1.2),
      t.stroke());
    const s = potatoPts(50, 53, 23.5, 18, -0.32),
      i = e >= 3 && e <= 5;
    blob(t, s);
    const l = t.createLinearGradient(32, 38, 68, 68);
    if (
      (l.addColorStop(0, a.l),
      l.addColorStop(0.45, a.b),
      l.addColorStop(1, a.d),
      (t.fillStyle = l),
      t.fill(),
      t.save(),
      blob(t, s),
      t.clip(),
      0 === e)
    ) {
      ((t.strokeStyle = "rgba(90,55,20,0.55)"), (t.lineWidth = 1.3));
      for (let e = 4; e < 24; e += 4.5)
        (t.beginPath(), t.ellipse(60, 58, 1.3 * e, 0.75 * e, -0.32, 0, 2 * Math.PI), t.stroke());
    } else if (1 === e) {
      ((t.strokeStyle = "rgba(60,64,70,0.7)"),
        (t.lineWidth = 1.4),
        t.beginPath(),
        t.moveTo(38, 46),
        t.lineTo(45, 51),
        t.lineTo(43, 58),
        t.moveTo(45, 51),
        t.lineTo(53, 49),
        t.moveTo(58, 60),
        t.lineTo(64, 56),
        t.lineTo(66, 62),
        t.stroke(),
        (t.fillStyle = "rgba(255,255,255,0.35)"));
      for (const [e, a] of [
        [54, 44],
        [61, 50],
        [40, 57],
        [50, 61],
      ])
        t.fillRect(e, a, 1.6, 1.6);
    } else if (i) {
      const e = 50,
        a = 53;
      for (let o = 0; o < s.length; o++) {
        const i = s[o],
          l = s[(o + 1) % s.length];
        (t.beginPath(),
          t.moveTo(e, a),
          t.lineTo(i[0], i[1]),
          t.lineTo(l[0], l[1]),
          t.closePath(),
          (t.fillStyle = o % 2 ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.16)"),
          t.fill());
      }
      const o = potatoPts(50, 52, 23.5, 18, -0.32, 0.5);
      (poly(t, o),
        (t.fillStyle = "rgba(255,255,255,0.32)"),
        t.fill(),
        (t.strokeStyle = "rgba(255,255,255,0.75)"),
        (t.lineWidth = 1),
        t.stroke(),
        (t.strokeStyle = "rgba(255,255,255,0.35)"),
        (t.lineWidth = 0.8));
      for (let e = 0; e < o.length; e += 2)
        (t.beginPath(), t.moveTo(o[e][0], o[e][1]), t.lineTo(s[e][0], s[e][1]), t.stroke());
    } else
      ((t.fillStyle = "rgba(255,255,255,0.45)"),
        t.beginPath(),
        t.moveTo(30, 52),
        t.lineTo(48, 34),
        t.lineTo(55, 34),
        t.lineTo(37, 52),
        t.closePath(),
        t.fill(),
        (t.fillStyle = "rgba(255,255,255,0.25)"),
        t.beginPath(),
        t.moveTo(41, 60),
        t.lineTo(60, 41),
        t.lineTo(63, 41),
        t.lineTo(44, 60),
        t.closePath(),
        t.fill());
    if (!i) {
      t.fillStyle =
        0 === e ? "rgba(80,45,15,0.75)" : 1 === e ? "rgba(55,58,64,0.8)" : "rgba(150,95,5,0.75)";
      for (const [e, a, o] of [
        [42, 49, 1.6],
        [56, 46, 1.3],
        [59, 58, 1.7],
        [47, 59, 1.2],
      ])
        (t.beginPath(), t.ellipse(e, a, 1.3 * o, o, -0.3, 0, 2 * Math.PI), t.fill());
    }
    if (
      (t.restore(),
      blob(t, s),
      ink(t, 3.2),
      (t.fillStyle = "rgba(255,255,255,0.55)"),
      t.beginPath(),
      t.ellipse(41, 44, 4.2, 2.2, -0.6, 0, 2 * Math.PI),
      t.fill(),
      e >= 3 &&
        (sparkle(t, 68, 36, 4.2, "#FFFFFF"), sparkle(t, 33, 66, 2.6, "rgba(255,255,255,0.85)")),
      6 === e &&
        (function crown(t, e, a, o) {
          (t.beginPath(),
            t.moveTo(e - o, a),
            t.lineTo(e - o - 1.5, a - 9),
            t.lineTo(e - 0.45 * o, a - 4.5),
            t.lineTo(e, a - 12),
            t.lineTo(e + 0.45 * o, a - 4.5),
            t.lineTo(e + o + 1.5, a - 9),
            t.lineTo(e + o, a),
            t.closePath());
          const s = t.createLinearGradient(e, a - 12, e, a);
          (s.addColorStop(0, "#FFF2B0"),
            s.addColorStop(1, "#E9A913"),
            (t.fillStyle = s),
            t.fill(),
            ink(t, 2.4));
          for (const [s, i, l] of [
            [e - 0.62 * o, a - 3, "#FF4A5A"],
            [e, a - 4.5, "#4FD8E8"],
            [e + 0.62 * o, a - 3, "#2ECC71"],
          ])
            (t.beginPath(),
              t.arc(s, i, 1.7, 0, 2 * Math.PI),
              (t.fillStyle = l),
              t.fill(),
              ink(t, 1));
        })(t, 50, 37, 14),
      e <= 2)
    )
      for (let o = 0; o <= e; o++) {
        const e = 77 + 4.2 * o;
        (t.beginPath(),
          t.moveTo(42, e),
          t.lineTo(50, e + 3.6),
          t.lineTo(58, e),
          (t.strokeStyle = a.f),
          (t.lineWidth = 2.2),
          (t.lineCap = "round"),
          (t.lineJoin = "round"),
          t.stroke());
      }
  }
  function tierBadge(t) {
    if (D.has(t)) return D.get(t);
    const e = 256,
      a = document.createElement("canvas");
    a.width = a.height = e;
    const o = a.getContext("2d");
    (o.scale(2.56, 2.56), o.translate(2, 0), o.scale(0.94, 0.94), drawBadge(o, t));
    const s = document.createElement("canvas");
    s.width = s.height = e;
    const i = s.getContext("2d");
    return (
      (i.shadowColor = "rgba(0,0,0,0.38)"),
      (i.shadowOffsetX = 7),
      (i.shadowOffsetY = 7),
      (i.shadowBlur = 0),
      i.drawImage(a, -4, -4),
      D.set(t, s),
      s
    );
  }
  const _ = [],
    timg = (t) =>
      _[t] ||
      (_[t] = (() => {
        const e = new Image();
        return ((e.decoding = "async"), (e.src = "potato/tiers/" + t + ".webp"), e);
      })()),
    badgeOf = (t) => {
      const e = B.indexOf(t);
      return e < 0
        ? null
        : ((t) => {
            if (t < 0 || t >= B.length) return null;
            const e = timg(t);
            return e.complete && e.naturalWidth ? e : null;
          })(e) || tierBadge(e);
    },
    tierCanvas = (t) => badgeOf(t) || (self.game ? hiCanvas(self.game, t) : null);
  {
    const me = setInterval(() => {
      self.XZ && (clearInterval(me), (self.XZ.tierCanvas = tierCanvas));
    }, 200);
  }
  const tierPic = (t, e) =>
      ((t) => {
        const e = B.indexOf(t);
        if (e < 0) return "";
        if (!timg(e).complete || timg(e).naturalWidth) return "potato/tiers/" + e + ".webp";
        if (I.has(t)) return I.get(t);
        const a = tierBadge(e).toDataURL();
        return (I.set(t, a), a);
      })(e.k) ||
      ((t, e) => {
        if (P.has(e)) return P.get(e);
        const a = hiCanvas(t, e),
          o = a ? a.toDataURL() : "";
        return (o && P.set(e, o), o);
      })(t, e.k) ||
      itemPic(t, e.k),
    item = (t, e, a, o, s, i, l) =>
      `<div class="itw sh"><div class="blk cut it ${t}" data-a="${l}" style="--c:${o}">\n      <div class="tag"><i></i>${blockText(e, { cls: "num" })}${blockText(a)}</div><div class="ttl">${s}</div><div class="sub">${i}</div>${blockText(">", { cls: "arr" })}</div></div>`,
    host = () => ("undefined" != typeof Stage && Stage.el) || document.body,
    fitVars = () => {
      const t = "undefined" != typeof Stage && Stage.el ? Stage.w() : innerWidth,
        e = "undefined" != typeof Stage && Stage.el ? Stage.h() : innerHeight,
        a = document.documentElement;
      if (
        (a.style.setProperty("--pvw", t / 100 + "px"),
        a.style.setProperty("--pvh", e / 100 + "px"),
        a.classList.toggle("p-narrow", t / Math.max(1, e) <= 4 / 3),
        a.classList.toggle("p-short", e <= 520 && t > e),
        "undefined" != typeof Stage && Stage.el)
      )
        for (const t of ["lobby", "boot"]) {
          const e = document.getElementById(t);
          e && e.parentNode !== Stage.el && Stage.el.appendChild(e);
        }
      self.fitBoot && self.fitBoot();
    };
  if ("undefined" != typeof Stage) {
    const ye = Stage.update;
    Stage.update = function () {
      const t = ye.apply(this, arguments);
      try {
        fitVars();
      } catch (t) {}
      return t;
    };
  }
  (addEventListener("resize", () => {
    try {
      fitVars();
    } catch (t) {}
  }),
    fitVars());
  const sp = (t) =>
      "undefined" != typeof Stage && Stage.toStage
        ? Stage.toStage(t.clientX, t.clientY)
        : [t.clientX, t.clientY],
    sw = () => ("undefined" != typeof Stage && Stage.el ? Stage.w() : innerWidth),
    sh = () => ("undefined" != typeof Stage && Stage.el ? Stage.h() : innerHeight),
    ensureCss = () => {
      if (!document.getElementById("lobby-css")) {
        const t = document.createElement("style");
        ((t.id = "lobby-css"),
          (t.textContent =
            '\n  #lobby { position: absolute; inset: 0; z-index: 4; pointer-events: none; color: #111; perspective: 1600px; -webkit-user-select: none; user-select: none; overflow: hidden;\n    font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif; --ink: #111; --paper: #F4F1EA; --or: #FF5A1F; --u: min(var(--pvw, 1vw), calc(var(--pvh, 1vh) * 1.78)); }\n  #lobby * { box-sizing: border-box; }\n  #lobby svg.bt { display: inline-block; vertical-align: -0.08em; overflow: visible; }\n  #lobby .cut { clip-path: polygon(calc(var(--u) * 1.2) 0, 100% 0, 100% calc(100% - var(--u) * 1.2), calc(100% - var(--u) * 1.2) 100%, 0 100%, 0 calc(var(--u) * 1.2)); }\n  #lobby .blk { position: relative; pointer-events: auto; background: var(--paper); }\n  #lobby .sh { filter: drop-shadow(calc(var(--u) * .55) calc(var(--u) * .55) 0 rgba(17,17,17,.92)); }\n  #lobby .lb-stage { position: absolute; inset: 0; transform-style: preserve-3d; }\n  #lobby .lb-drag { position: absolute; left: 36%; right: 38%; top: 14%; bottom: 6%; pointer-events: auto; cursor: grab; }\n  #lobby .lb-drag:active { cursor: grabbing; }\n  /* the logo board */\n  #lobby .lb-logo { position: absolute; left: calc(var(--u) * 3); top: calc(var(--u) * 3); width: calc(var(--u) * 36); transform: rotateY(13deg); transform-origin: left center; }\n  #lobby .lb-logo .blk { border: calc(var(--u) * .35) solid var(--ink); padding: calc(var(--u) * 2.2) calc(var(--u) * 2.4) calc(var(--u) * 1.6); }\n  #lobby .lb-logo img { display: block; width: 100%; height: auto; }\n  /* the menu on the right */\n  #lobby .lb-menu { position: absolute; right: calc(var(--u) * 3); top: calc(var(--u) * 3); bottom: calc(var(--u) * 7.5); width: calc(var(--u) * 38);\n    transform: rotateY(-12deg); transform-origin: right center; display: flex; flex-direction: column; gap: calc(var(--u) * 1.4); }\n  #lobby .it { cursor: pointer; border: calc(var(--u) * .3) solid var(--ink); transition: transform .12s ease; display: block; }\n  #lobby .itw { transition: filter .12s ease, transform .12s ease; }\n  #lobby .itw:hover { transform: translate(calc(var(--u) * -.35), calc(var(--u) * -.35)); filter: drop-shadow(calc(var(--u) * .9) calc(var(--u) * .9) 0 var(--or)); }\n  #lobby .itw:active { transform: translate(calc(var(--u) * .2), calc(var(--u) * .2)); filter: drop-shadow(calc(var(--u) * .25) calc(var(--u) * .25) 0 var(--ink)); }\n  #lobby .tag { display: flex; align-items: center; gap: calc(var(--u) * .7); font-size: calc(var(--u) * 1.05); color: var(--ink); }\n  #lobby .tag i { width: calc(var(--u) * .9); height: calc(var(--u) * .9); background: var(--c, var(--ink)); display: inline-block; }\n  #lobby .tag .num { color: var(--or); }\n  #lobby .ttl { font-weight: 900; letter-spacing: .04em; line-height: 1; margin-top: calc(var(--u) * .9); font-size: calc(var(--u) * 3.3); }\n  #lobby .sub { margin-top: calc(var(--u) * .7); font-size: calc(var(--u) * 1.15); color: #4A4A4A; font-weight: 700; }\n  #lobby .it { padding: calc(var(--u) * 1.4) calc(var(--u) * 1.8); }\n  #lobby .arr { position: absolute; right: calc(var(--u) * 1.6); top: 50%; transform: translateY(-50%); font-size: calc(var(--u) * 2); color: var(--ink); }\n  #lobby .itw:hover .arr { color: var(--or); }\n  /* 01: the big one */\n  #lobby .rank { padding: 0; display: grid; grid-template-columns: 1fr; }\n  #lobby .aibig { --tc: #FF5AA5; } #lobby .aibig .go { background: #FF5AA5; }\n  #lobby .rk2 .sub { display: flex; align-items: center; gap: calc(var(--u) * .5); min-width: 0; } #lobby .rk2 .sub b { font-weight: 900; color: var(--tc, #111); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }\n  #lobby .lb-menu .row2 { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } #lobby .lb-menu .row2 > .itw { min-width: 0; }\n  #lobby .rk2 .lb-tier-ic { width: calc(var(--u) * 1.9); height: auto; image-rendering: pixelated; }\n  #lobby .rank .top { padding: calc(var(--u) * 1.6) calc(var(--u) * 1.8) calc(var(--u) * 1.2); }\n  #lobby .rank .tier { display: flex; align-items: center; gap: calc(var(--u) * 1.2); margin-top: calc(var(--u) * 1.3); }\n  #lobby .rank .tier img { width: calc(var(--u) * 4.2); height: auto; image-rendering: pixelated; }\n  #lobby .rank .tier b { display: block; font-size: calc(var(--u) * 1.5); font-weight: 900; }\n  #lobby .rank .tier span { display: block; font-size: calc(var(--u) * 1.05); color: #4A4A4A; font-weight: 700; margin-top: calc(var(--u) * .3); }\n  #lobby .segs { display: flex; gap: calc(var(--u) * .3); margin-top: calc(var(--u) * .6); }\n  #lobby .segs i { width: calc(var(--u) * 1.3); height: calc(var(--u) * .9); background: #D9D4C7; display: block; }\n  #lobby .segs i.on { background: var(--tc, var(--or)); outline: calc(var(--u) * .15) solid var(--ink); outline-offset: calc(var(--u) * -.15); }\n  #lobby .rank .go { background: var(--or); color: #fff; border-top: calc(var(--u) * .3) solid var(--ink); display: flex; align-items: center; justify-content: space-between;\n    padding: calc(var(--u) * 1.3) calc(var(--u) * 1.8); }\n  #lobby .rank .go .gt { font-weight: 900; font-size: calc(var(--u) * 3.6); letter-spacing: .06em; line-height: 1; color: #fff; }\n  #lobby .rank .go .bt { height: calc(var(--u) * 2.6); color: #111; }\n  #lobby .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--u) * 1.4); }\n  #lobby .row2 .ttl { font-size: calc(var(--u) * 2.6); }\n  /* corners: the account, the buttons, the line at the bottom */\n  #lobby .lb-tools { position: absolute; bottom: calc(var(--u) * 2.6); right: calc(var(--u) * 3); display: flex; gap: calc(var(--u) * .9); pointer-events: auto; }\n  #lobby .tb { width: calc(var(--u) * 4.2); height: calc(var(--u) * 4.2); border: calc(var(--u) * .3) solid var(--ink); background: var(--paper); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }\n  #lobby .tb svg { width: 56%; height: 56%; }\n  #lobby .tb:hover { background: #fff; }\n  #lobby .tb.lb-coin { width: auto; padding: 0 calc(var(--u) * 1.1); gap: calc(var(--u) * .6); font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.3); color: #111; position: relative; }\n  #lobby .lb-coin i { width: calc(var(--u) * 1.5); height: calc(var(--u) * 1.15); background: #C99A5B; border: calc(var(--u) * .2) solid #6E4A2C; border-radius: 50%; }\n  #lobby .lb-coin .lb-dot { position: absolute; right: calc(var(--u) * -.5); top: calc(var(--u) * -.5); width: calc(var(--u) * 1); height: calc(var(--u) * 1); background: #E0301E; border: calc(var(--u) * .2) solid #111; display: none; }\n  #lobby .lb-coin.dot .lb-dot { display: block; }\n  #lobby .lb-me { position: absolute; left: calc(var(--u) * 3); bottom: calc(var(--u) * 2.6); display: flex; align-items: stretch; pointer-events: auto; cursor: pointer;\n    border: calc(var(--u) * .3) solid var(--ink); background: var(--paper); }\n  #lobby .lb-me .dot { width: calc(var(--u) * 1.2); background: #19C79A; border-right: calc(var(--u) * .3) solid var(--ink); }\n  #lobby .lb-me.out .dot { background: var(--or); }\n  #lobby .lb-me .nm { padding: calc(var(--u) * .9) calc(var(--u) * 1.4); font-weight: 900; font-size: calc(var(--u) * 1.4); }\n  #lobby .lb-me .nm small { display: block; font-size: calc(var(--u) * .85); font-weight: 700; color: #555; margin-top: calc(var(--u) * .2); }\n  #lobby .lb-foot { position: absolute; right: calc(var(--u) * 29); bottom: calc(var(--u) * 3.6); display: flex; justify-content: flex-end; gap: calc(var(--u) * 2);\n    font-size: calc(var(--u) * .9); color: #6FF0A0; align-items: center; opacity: .85; }\n  #lobby .lb-foot .r { height: calc(var(--u) * .2); background: #2FE07E; flex: 0 0 calc(var(--u) * 12); box-shadow: 0 0 calc(var(--u) * .6) rgba(47,224,126,.6); }\n  /* the pause menu */\n  #lobby.pz { background: rgba(244,241,234,.18); }\n  #lobby.pz.live { background: rgba(6,8,12,.32); }\n  #lobby.pz.live .pzm { background: rgba(14,16,20,.86); }\n  #lobby .pzl-wrap { width: calc(var(--u) * 46); max-height: 94vh; gap: calc(var(--u) * .8); }\n  /* (the in-match menu\'s own buttons take the press - #lobby lets presses through to the game: 回到游戏, the settings, 离开对局 went\n     to the game under them and the menu could not be left on a phone; a player 11-20 「为什么点击认输认输不了，直接卡在那个界面了」) */\n  #lobby .pzl-go, #lobby .pzl-row, #lobby .pzl-row button, #lobby .pzl-quit, #lobby .pzm, #lobby .pzm button { pointer-events: auto; touch-action: manipulation; }\n  #lobby .pzl-go, #lobby .pzl-row button, #lobby .pzl-quit { font: inherit; font-weight: 900; cursor: pointer; border: 0; color: #F2EFE9; }\n  #lobby .pzl-go { display: flex; justify-content: space-between; align-items: center; font-size: calc(var(--u) * 1.9); padding: calc(var(--u) * .8) calc(var(--u) * 1.3); background: #FF5A1F; box-shadow: calc(var(--u) * .4) calc(var(--u) * .4) 0 rgba(0,0,0,.55); }\n  #lobby .pzl-go em { font-style: normal; }\n  #lobby .pzl-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: calc(var(--u) * .6); }\n  #lobby .pzl-row button { font-size: calc(var(--u) * 1.05); padding: calc(var(--u) * .75) 0; background: rgba(244,241,234,.92); color: #141414; box-shadow: calc(var(--u) * .3) calc(var(--u) * .3) 0 rgba(0,0,0,.5); }\n  #lobby .pzl-row button:hover, #lobby .pzl-go:hover { transform: translate(calc(var(--u) * -.15), calc(var(--u) * -.2)); }\n  #lobby .pzl-quit { font-size: calc(var(--u) * 1.05); padding: calc(var(--u) * .7) 0; background: rgba(14,16,20,.86); border: 1px solid #E8423F; color: #FF8A80; }\n  #lobby .pzl-quit:hover { background: #E8423F; color: #fff; }\n  #lobby .pzm { display: flex; flex-direction: column; gap: calc(var(--u) * .55); padding: calc(var(--u) * 1) calc(var(--u) * 1.3); border-left: calc(var(--u) * .35) solid #2FE07E; }\n  #lobby .pzm-top { display: flex; align-items: baseline; gap: calc(var(--u) * 1); } #lobby .pzm-st { font-size: calc(var(--u) * 1.7); font-weight: 900; color: #F2EFE9; }\n  #lobby .pzm-sc { font-size: calc(var(--u) * 1.05); color: #CFCBC2; font-weight: 700; }\n  #lobby .pzm-lat { display: flex; flex-wrap: wrap; gap: calc(var(--u) * .4) calc(var(--u) * 1.2); align-items: baseline; font-size: calc(var(--u) * .95); }\n  #lobby .pzm-lat .k { color: #8E8A82; font-weight: 800; } #lobby .pzm-lat .p i { font-style: normal; color: #CFCBC2; margin-right: calc(var(--u) * .4); } #lobby .pzm-lat .p b { font-weight: 900; }\n  #lobby .pzm-note { font-size: calc(var(--u) * .9); color: #9AA4B8; font-weight: 700; } #lobby .pzm-note.warn { color: #FFD24A; }\n  #lobby .pzm-btns { display: flex; gap: calc(var(--u) * .7); }\n  #lobby .pzm-kick { font: inherit; font-size: calc(var(--u) * .8); font-weight: 900; margin-left: calc(var(--u) * .5); padding: 0 calc(var(--u) * .5); cursor: pointer; color: #FF8A80; background: transparent; border: 1px solid #E8423F; }\n  #lobby .pzm-kick.on, #lobby .pzm-kick:hover { background: #E8423F; color: #fff; }\n  #lobby .pzm-btns button { flex: 1; font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.05); padding: calc(var(--u) * .65) 0; cursor: pointer; color: #F2EFE9; background: rgba(255,255,255,.08); border: 1px solid rgba(242,239,233,.25); }\n  #lobby .pzm-btns button:hover:not([disabled]) { border-color: #2FE07E; } #lobby .pzm-btns button[disabled] { opacity: .45; cursor: default; }\n  #lobby .pzm-btns button.gold { background: #FFB020; color: #111; border-color: #FFB020; } #lobby .pzm-btns button.red { background: #E8423F; border-color: #E8423F; }\n  #lobby .pz-wrap { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: calc(var(--u) * 52); display: flex; flex-direction: column; gap: calc(var(--u) * 1.3); }\n  #lobby .pz-head { display: flex; align-items: center; gap: calc(var(--u) * 1.2); font-size: calc(var(--u) * 2.4); color: #111; }\n  #lobby .pz-head svg.bt { background: var(--paper); padding: calc(var(--u) * .45); border: calc(var(--u) * .3) solid var(--ink); height: 1.7em; width: auto; box-sizing: content-box; }\n  #lobby .pz-head span { font-size: calc(var(--u) * 1.2); font-weight: 800; color: #222; background: var(--paper); padding: calc(var(--u) * .5) calc(var(--u) * .9); border: calc(var(--u) * .25) solid var(--ink); }\n  #lobby .pz-go { background: var(--or); color: #fff; } #lobby .pz-go .tag, #lobby .pz-go .arr, #lobby .pz-go .tag .num { color: #fff; } #lobby .pz-go .tag i { background: #fff; }\n  #lobby .pz-quit { background: #111; color: var(--paper); } #lobby .pz-quit .tag, #lobby .pz-quit .arr { color: var(--paper); } #lobby .pz-quit .tag i { background: var(--or); }\n  #lobby .pz-quit .ttl { font-size: calc(var(--u) * 2.4); }\n  #lobby .pz-fov { display: flex; align-items: center; gap: calc(var(--u) * 1.4); border: calc(var(--u) * .3) solid var(--ink); padding: calc(var(--u) * 1) calc(var(--u) * 1.8); pointer-events: auto; }\n  #lobby .pz-fov .lbl { font-weight: 900; font-size: calc(var(--u) * 1.5); }\n  #lobby .pz-fov input { flex: 1; accent-color: #FF5A1F; height: calc(var(--u) * 1.6); }\n  #lobby .pz-fov .v { font-weight: 900; font-size: calc(var(--u) * 1.6); min-width: 2.2em; text-align: right; }\n  /* coming in and going (the user 11-16: 「这种UI弹出的时候都要做好丝滑的UI」) */\n  @keyframes lbFade { from { opacity: 0; } }\n  @keyframes lbOut { to { opacity: 0; } }\n  @keyframes lbUp { from { opacity: 0; transform: translateY(calc(var(--u) * 2.2)) scale(.98); } }\n  @keyframes lbL { from { opacity: 0; transform: translateX(calc(var(--u) * -5)); } }\n  @keyframes lbR { from { opacity: 0; transform: translateX(calc(var(--u) * 5)); } }\n  #lobby { animation: lbFade .2s ease-out backwards; }\n  #lobby.out { animation: lbOut .16s ease-in forwards; }\n  #lobby.out, #lobby.out * { pointer-events: none !important; }\n  #lobby .lb-logo > .blk { animation: lbL .5s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby.noanim, #lobby.noanim * { animation: none !important; }\n  #lobby .lb-logo.fx > .blk { animation: none; transition: background-color .28s ease, border-color .28s ease; }\n  #lobby .lb-logo.fx { transition: filter .3s ease; }\n  #lobby .lb-logo.pop > .blk { animation: lbPop .38s cubic-bezier(.2,.9,.25,1.3); } @keyframes lbPop { from { transform: scale(.94); } }\n  #lobby .lb-logo.morph { filter: none; } #lobby .lb-logo.morph > .blk { background-color: transparent; border-color: transparent; }\n  #lobby .lb-logo .lb-ov { position: absolute; pointer-events: none; transition: opacity .45s ease .08s; }\n  #lobby .lb-logo.wait { opacity: 0; } #lobby .lb-logo.wait > .blk, #lobby .lb-logo.land > .blk { animation: none; }\n  #lobby .lb-logo.land { animation: lbFade .25s ease-out backwards; }\n  #lobby .lb-menu > * { animation: lbR .45s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .lb-menu > :nth-child(2) { animation-delay: .06s; } #lobby .lb-menu > :nth-child(3) { animation-delay: .12s; }\n  #lobby .lb-me, #lobby .lb-tools, #lobby .lb-foot { animation: lbUp .45s .15s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .pz-wrap > * { animation: lbUp .34s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .pz-wrap > :nth-child(2) { animation-delay: .03s; } #lobby .pz-wrap > :nth-child(3) { animation-delay: .06s; }\n  #lobby .pz-wrap > :nth-child(4) { animation-delay: .09s; } #lobby .pz-wrap > :nth-child(5) { animation-delay: .12s; }\n  #lobby .pz-wrap > :nth-child(n+6) { animation-delay: .15s; }\n  #lobby .op-grid > * { animation: lbUp .3s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(min(var(--i, 0), 12) * 22ms); }\n  /* leaving the lobby (the user 11-17: the buttons vanished at once - they go out as they came in): the menu off to the right one\n     after another, the logo off to the left, the corners down; the screen opened meanwhile comes in over it */\n  @keyframes lbRx { to { opacity: 0; transform: translateX(calc(var(--u) * 7)); } }\n  @keyframes lbLx { to { opacity: 0; transform: translateX(calc(var(--u) * -6)); } }\n  @keyframes lbDx { to { opacity: 0; transform: translateY(calc(var(--u) * 2.4)); } }\n  #lobby.lbx, #lobby.lbx * { pointer-events: none !important; }\n  #lobby.lbx .lb-menu > * { animation: lbRx .26s cubic-bezier(.55,0,.8,.3) forwards !important; }\n  #lobby.lbx .lb-menu > :nth-child(2) { animation-delay: .04s !important; } #lobby.lbx .lb-menu > :nth-child(3) { animation-delay: .08s !important; }\n  #lobby.lbx .lb-logo, #lobby.lbx .lb-sh, #lobby.lbx .lb-bug { animation: lbLx .28s cubic-bezier(.55,0,.8,.3) forwards !important; }\n  /* 反馈 BUG under the logo (the user 11-20 「把那个反馈 bug 放到主界面 logo 下面 … 做的显眼一点」): the logo\'s tilt, orange, in after it */\n  #lobby .lb-bug { position: absolute; left: calc(var(--u) * 3); top: calc(var(--u) * 27.4); width: calc(var(--u) * 26); transform: rotateY(13deg); transform-origin: left center; pointer-events: auto; cursor: pointer;\n    font: inherit; color: #fff; text-align: left; background: var(--or); border: calc(var(--u) * .3) solid var(--ink); box-shadow: calc(var(--u) * .45) calc(var(--u) * .45) 0 #111;\n    display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0 calc(var(--u) * 1); padding: calc(var(--u) * .7) calc(var(--u) * 1.1);\n    transition: transform .15s ease, box-shadow .15s ease, background-color .15s ease; animation: lbL .5s .14s cubic-bezier(.2,.9,.25,1) backwards; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }\n  #lobby .lb-bug:hover { background: #FF6E37; transform: rotateY(13deg) translate(calc(var(--u) * -.2), calc(var(--u) * -.2)); box-shadow: calc(var(--u) * .75) calc(var(--u) * .75) 0 #111; }\n  #lobby .lb-bug:active { transform: rotateY(13deg) translate(calc(var(--u) * .15), calc(var(--u) * .15)); box-shadow: calc(var(--u) * .2) calc(var(--u) * .2) 0 #111; transition-duration: .05s; }\n  #lobby .lb-bug .ic { width: calc(var(--u) * 3.2); height: calc(var(--u) * 3.2); background: #111; display: grid; place-items: center; animation: bugNudge 3.2s ease-in-out 1.4s infinite; }\n  #lobby .lb-bug .ic svg { width: 68%; height: 68%; }\n  #lobby .lb-bug b { display: block; font-size: calc(var(--u) * 1.75); font-weight: 900; letter-spacing: .05em; line-height: 1.1; }\n  #lobby .lb-bug small { display: block; font-size: calc(var(--u) * .92); font-weight: 800; opacity: .92; margin-top: calc(var(--u) * .15); }\n  #lobby .lb-bug em { font-style: normal; font-size: calc(var(--u) * 2.2); font-weight: 900; transition: transform .15s ease; }\n  #lobby .lb-bug:hover em { transform: translateX(calc(var(--u) * .3)); }\n  @keyframes bugNudge { 0%, 84%, 100% { transform: none; } 88% { transform: rotate(-14deg) scale(1.06); } 92% { transform: rotate(11deg) scale(1.06); } 96% { transform: rotate(-5deg); } }\n  #lobby.lbx .lb-me, #lobby.lbx .lb-tools, #lobby.lbx .lb-foot { animation: lbDx .24s cubic-bezier(.55,0,.8,.3) forwards !important; }\n  #lobby.lbx ~ #lobby { animation-delay: .14s; }\n  canvas#gl { transition: filter .22s ease, transform .22s ease; }\n  /* the settings pages, the key bindings, any other menu (the same blocks) */\n  #lobby .op-wrap { width: calc(var(--u) * 64); max-height: calc(var(--pvh, 1vh) * 100 - var(--u) * 6); }\n  #lobby .op-body { pointer-events: auto; overflow-y: auto; overscroll-behavior: contain; max-height: calc(var(--pvh, 1vh) * 100 - var(--u) * 22); padding: calc(var(--u) * .4) calc(var(--u) * 1.2) calc(var(--u) * 1.2) calc(var(--u) * .4); }\n  #lobby .op-body, #lobby .op-body * { touch-action: pan-y; }\n  #lobby input[type=range] { touch-action: pan-y pinch-zoom; }\n  #lobby .op-body::-webkit-scrollbar { width: calc(var(--u) * .7); } #lobby .op-body::-webkit-scrollbar-thumb { background: #111; }\n  #lobby .op-grid { display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--u) * 1); }\n  #lobby .op-grid .wide, #lobby .op-grid .cat { grid-column: 1 / 3; }\n  #lobby .op-btn, #lobby .op-sl, #lobby .kb-row, #lobby .sk-btn { pointer-events: auto; position: relative; background: var(--paper); border: calc(var(--u) * .3) solid var(--ink);\n    filter: drop-shadow(calc(var(--u) * .4) calc(var(--u) * .4) 0 rgba(17,17,17,.9)); font: inherit; color: #111; text-align: left;\n    padding: calc(var(--u) * .9) calc(var(--u) * 1.3); font-weight: 900; font-size: calc(var(--u) * 1.35); cursor: pointer; transition: transform .1s ease, filter .1s ease, background .1s ease; }\n  #lobby .op-btn:hover:not(:disabled), #lobby .sk-btn:hover:not(:disabled) { transform: translate(calc(var(--u) * -.25), calc(var(--u) * -.25)); filter: drop-shadow(calc(var(--u) * .7) calc(var(--u) * .7) 0 var(--or)); }\n  #lobby .op-btn:active:not(:disabled), #lobby .sk-btn:active:not(:disabled) { transform: translate(calc(var(--u) * .15), calc(var(--u) * .15)); filter: drop-shadow(calc(var(--u) * .2) calc(var(--u) * .2) 0 #111); }\n  #lobby .op-btn:disabled, #lobby .sk-btn:disabled { opacity: .45; cursor: default; }\n  #lobby .op-btn small, #lobby .op-sl small { display: block; font-size: calc(var(--u) * .9); font-weight: 700; color: #555; margin-top: calc(var(--u) * .3); }\n  #lobby .op-sl { cursor: default; }\n  #lobby .op-sl input, #lobby .sk-sl input { width: 100%; accent-color: #FF5A1F; margin-top: calc(var(--u) * .6); height: calc(var(--u) * 1.4); }\n  #lobby .op-foot { display: flex; gap: calc(var(--u) * 1); }\n  #lobby .op-foot > * { flex: 1; }\n  #lobby .op-go { background: var(--or); color: #fff; text-align: center; }\n  #lobby .op-dark { background: #111; color: var(--paper); text-align: center; }\n  #lobby .cat { font-weight: 900; font-size: calc(var(--u) * 1.15); color: #111; background: var(--paper); border: calc(var(--u) * .25) solid #111; justify-self: start; padding: calc(var(--u) * .3) calc(var(--u) * .9); margin-top: calc(var(--u) * .6); }\n  #lobby .kb-row { display: grid; grid-template-columns: 1fr auto auto; gap: calc(var(--u) * .8); align-items: center; cursor: default; padding: calc(var(--u) * .5) calc(var(--u) * .6) calc(var(--u) * .5) calc(var(--u) * 1.3); }\n  #lobby .kb-row .k { min-width: calc(var(--u) * 9); text-align: center; background: #fff; border: calc(var(--u) * .25) solid #111; padding: calc(var(--u) * .5) calc(var(--u) * .8); cursor: pointer; font: inherit; font-weight: 900; }\n  #lobby .kb-row .k.dup { color: #E0301E; } #lobby .kb-row .k.wait { background: var(--or); color: #fff; animation: kbPulse .8s ease-in-out infinite alternate; }\n  @keyframes kbPulse { to { filter: brightness(1.15); } }\n  #lobby .kb-row .r { background: transparent; border: 0; font: inherit; font-size: calc(var(--u) * 1.05); font-weight: 800; color: #555; cursor: pointer; }\n  #lobby .kb-row .r:disabled { opacity: .3; cursor: default; }\n  #lobby .sk-lines { pointer-events: auto; background: var(--paper); border: calc(var(--u) * .3) solid #111; padding: calc(var(--u) * 1.2) calc(var(--u) * 1.6); display: flex; flex-direction: column; gap: calc(var(--u) * .45);\n    filter: drop-shadow(calc(var(--u) * .5) calc(var(--u) * .5) 0 rgba(17,17,17,.92)); font-size: calc(var(--u) * 1.25); font-weight: 700; line-height: 1.35; }\n  #lobby .sk-lines .c-grey { color: #666; } #lobby .sk-lines .c-warn { color: #D9480F; } #lobby .sk-lines .c-bad { color: #E0301E; } #lobby .sk-lines .c-good { color: #0E9F6E; }\n  #lobby .sk-lines .first { font-size: calc(var(--u) * 1.45); font-weight: 900; }\n  #lobby .pz-head.big span { font-size: calc(var(--u) * 2); padding: calc(var(--u) * .6) calc(var(--u) * 1.3); border-width: calc(var(--u) * .3); }\n  #lobby .op-body { max-height: calc(var(--pvh, 1vh) * 100 - var(--u) * 17); }\n  #lobby .sk-row { display: flex; gap: calc(var(--u) * 1); } #lobby .sk-row > * { flex: 1; }\n  #lobby .sk-btn { text-align: center; }\n  #lobby .sk-field { pointer-events: auto; display: flex; flex-direction: column; gap: calc(var(--u) * .4); font-weight: 800; font-size: calc(var(--u) * 1.1); }\n  #lobby .sk-field input { font: inherit; font-size: calc(var(--u) * 1.5); font-weight: 800; padding: calc(var(--u) * .8) calc(var(--u) * 1.1); border: calc(var(--u) * .3) solid #111; background: #fff; outline: none; }\n  #lobby .sk-field input:focus { box-shadow: 0 0 0 calc(var(--u) * .3) var(--or); }\n  #lobby .sk-note { pointer-events: none; font-weight: 800; font-size: calc(var(--u) * 1.15); background: var(--paper); border: calc(var(--u) * .25) solid #111; padding: calc(var(--u) * .5) calc(var(--u) * .9); }\n  /* the wardrobe: a locker */\n  #lobby.wd .wd-drag { left: 62%; right: 2%; top: 10%; bottom: 4%; }\n  #lobby .wd-tagline { position: absolute; left: calc(var(--u) * 3); top: calc(var(--u) * 2.6); display: flex; align-items: center; gap: calc(var(--u) * 1.2); font-size: calc(var(--u) * 2.6); animation: lbL .5s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .wd-tagline svg.bt { background: #111; color: var(--paper); padding: calc(var(--u) * .5) calc(var(--u) * .7); height: 1.3em; width: auto; box-sizing: content-box; }\n  #lobby .wd-who { font-size: calc(var(--u) * 1.15); font-weight: 800; background: var(--paper); border: calc(var(--u) * .25) solid #111; padding: calc(var(--u) * .45) calc(var(--u) * .9); max-width: calc(var(--u) * 46); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n  #lobby .wd-rail { position: absolute; left: calc(var(--u) * 3); top: calc(var(--u) * 9); bottom: calc(var(--u) * 3); width: calc(var(--u) * 11); display: flex; flex-direction: column; gap: calc(var(--u) * .7); }\n  #lobby .wd-tab { pointer-events: auto; position: relative; text-align: left; font: inherit; color: #111; background: var(--paper); border: calc(var(--u) * .3) solid #111; padding: calc(var(--u) * .8) calc(var(--u) * 1) calc(var(--u) * .8) calc(var(--u) * 1.4);\n    cursor: pointer; display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: calc(var(--u) * .6); align-items: center; transition: transform .12s ease, background .12s ease;\n    animation: lbL .45s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(var(--i) * 45ms); }\n  #lobby .wd-tab small { font-size: calc(var(--u) * .9); color: var(--or); grid-row: 1; } #lobby .wd-tab span { font-size: calc(var(--u) * 1.15); grid-row: 1; }\n  #lobby .wd-tab b { grid-column: 1 / 3; font-size: calc(var(--u) * 1.6); font-weight: 900; margin-top: calc(var(--u) * .2); }\n  #lobby .wd-tab em { position: absolute; right: calc(var(--u) * .7); bottom: calc(var(--u) * .6); font-style: normal; font-size: calc(var(--u) * .85); color: #777; font-weight: 800; }\n  #lobby .wd-tab::before { content: \'\'; position: absolute; left: 0; top: 0; bottom: 0; width: calc(var(--u) * .45); background: transparent; transition: background .12s ease; }\n  #lobby .wd-tab:hover { transform: translateX(calc(var(--u) * .4)); }\n  #lobby .wd-tab.on { background: #111; color: var(--paper); transform: translateX(calc(var(--u) * .8)); } #lobby .wd-tab.on::before { background: var(--or); } #lobby .wd-tab.on em { color: #AAA; }\n  #lobby .wd-main { position: absolute; left: calc(var(--u) * 16); top: calc(var(--u) * 9); bottom: calc(var(--u) * 3); width: calc(var(--u) * 46); display: flex; flex-direction: column; gap: calc(var(--u) * 1.1);\n    animation: lbUp .45s .05s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .wd-grid { pointer-events: auto; flex: 0 1 auto; min-height: 0; overflow-y: auto; touch-action: pan-y; align-content: start; display: grid; grid-template-columns: repeat(4, 1fr); gap: calc(var(--u) * .9);\n    padding: calc(var(--u) * 1.2); background: rgba(17,17,17,.82); border: calc(var(--u) * .3) solid #111; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }\n  #lobby .wd-it { pointer-events: auto; position: relative; font: inherit; color: #111; background: var(--paper); border: calc(var(--u) * .25) solid #111; padding: calc(var(--u) * .5) calc(var(--u) * .5) calc(var(--u) * .7);\n    cursor: pointer; transition: transform .1s ease, box-shadow .1s ease; animation: lbUp .28s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(min(var(--i, 0), 16) * 18ms); }\n  #lobby .wd-it .pic { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; margin-bottom: calc(var(--u) * .5);\n    background: repeating-linear-gradient(135deg, #ECE8DE 0 7px, #E3DED2 7px 14px); }\n  #lobby .wd-it .pic img { max-height: 84%; max-width: 84%; image-rendering: pixelated; }\n  #lobby .wd-it b { display: block; font-size: calc(var(--u) * 1.05); font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; }\n  #lobby .wd-it .eq { position: absolute; left: calc(var(--u) * .4); top: calc(var(--u) * .4); font-style: normal; font-size: calc(var(--u) * .75); font-weight: 900; background: var(--or); color: #fff; padding: 0 calc(var(--u) * .4); }\n  #lobby .wd-it:hover { transform: translateY(calc(var(--u) * -.3)); box-shadow: 0 calc(var(--u) * .5) 0 var(--or); }\n  #lobby .wd-it.sel { box-shadow: 0 0 0 calc(var(--u) * .35) var(--or); } #lobby .wd-it.on { background: #FFF6EE; }\n  #lobby .wd-it.lk .pic { filter: grayscale(1) opacity(.55); } #lobby .wd-it.lk::after { content: \'LOCK\'; position: absolute; right: calc(var(--u) * .4); top: calc(var(--u) * .4); font-size: calc(var(--u) * .7); font-weight: 900; background: #111; color: var(--paper); padding: 0 calc(var(--u) * .35); }\n  #lobby .wd-none svg.bt { height: calc(var(--u) * 1.4); color: #B9B3A6; }\n  #lobby .wd-armpic { display: flex; gap: 12%; height: 70%; align-items: stretch; } #lobby .wd-armpic i { display: block; background: #222; border: 2px solid #111; }\n  #lobby .wd-armpic.slim i { width: calc(var(--u) * 1.3); } #lobby .wd-armpic.wide i { width: calc(var(--u) * 1.8); } #lobby .wd-armpic i:nth-child(2) { background: #F4F1EA; }\n  #lobby .wd-face { image-rendering: pixelated; }\n  #lobby .wd-card { pointer-events: auto; display: grid; grid-template-columns: calc(var(--u) * 9) 1fr auto; gap: calc(var(--u) * 1.3); align-items: center; background: var(--paper); border: calc(var(--u) * .3) solid #111;\n    padding: calc(var(--u) * 1) calc(var(--u) * 1.2); filter: drop-shadow(calc(var(--u) * .5) calc(var(--u) * .5) 0 rgba(17,17,17,.92)); }\n  #lobby .wd-big { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: #111; }\n  #lobby .wd-big img { max-height: 84%; max-width: 84%; image-rendering: pixelated; } #lobby .wd-big .wd-armpic i { border-color: #F4F1EA; } #lobby .wd-big .wd-none svg.bt { color: #555; }\n  #lobby .wd-info small { display: block; font-size: calc(var(--u) * .95); font-weight: 800; color: var(--or); } #lobby .wd-info b { display: block; font-size: calc(var(--u) * 2.2); font-weight: 900; line-height: 1.15; }\n  #lobby .wd-info span { display: block; font-size: calc(var(--u) * 1.05); color: #555; font-weight: 700; margin-top: calc(var(--u) * .2); }\n  #lobby .wd-eq { pointer-events: auto; font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.4); padding: calc(var(--u) * .9) calc(var(--u) * 1.6); background: var(--or); color: #fff; border: calc(var(--u) * .3) solid #111; cursor: pointer; }\n  #lobby .wd-eq:disabled { background: #DDD8CC; color: #777; cursor: default; } #lobby .wd-eq.lk { background: #111; }\n  #lobby .wd-seg { pointer-events: auto; display: grid; grid-template-columns: auto auto auto; align-items: center; border: calc(var(--u) * .3) solid #111; background: #111; }\n  #lobby .wd-seg small { color: #AAA; font-size: calc(var(--u) * .95); font-weight: 800; padding: 0 calc(var(--u) * .9); }\n  #lobby .wd-seg button { font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.5); padding: calc(var(--u) * .8) calc(var(--u) * 1.6); border: 0; background: #2A2A2A; color: #CCC; cursor: pointer; transition: background .15s ease, color .15s ease; }\n  #lobby .wd-seg button.on { background: var(--or); color: #fff; }\n  #lobby .wd-foot { margin-top: auto; display: grid; grid-template-columns: 1fr auto auto; gap: calc(var(--u) * .8); align-items: center; }\n  #lobby .wd-foot .op-btn { padding-left: calc(var(--u) * 2); padding-right: calc(var(--u) * 2); }\n  #lobby .wd-msg { font-size: calc(var(--u) * 1.05); font-weight: 800; color: #111; text-shadow: 0 0 4px #fff, 0 0 2px #fff; }\n  #lobby .wd-stamp { position: absolute; right: calc(var(--u) * 3); top: calc(var(--u) * 2.6); display: flex; flex-direction: column; align-items: flex-end; gap: calc(var(--u) * .5); font-size: calc(var(--u) * 1.6);\n    color: var(--paper); text-shadow: none; animation: lbR .5s .1s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .wd-stamp svg.bt { background: #111; padding: calc(var(--u) * .4) calc(var(--u) * .7); height: 1.2em; width: auto; box-sizing: content-box; color: var(--or); }\n  #lobby .wd-stamp span { font-size: calc(var(--u) * 1); font-weight: 800; color: #111; background: var(--paper); border: calc(var(--u) * .25) solid #111; padding: calc(var(--u) * .3) calc(var(--u) * .8); }\n  /* 天梯排位: dark, a HUD */\n  @keyframes shine { 0%, 100% { filter: drop-shadow(0 0 calc(var(--u) * .6) rgba(255,200,70,.9)) brightness(1.05); } 50% { filter: drop-shadow(0 0 calc(var(--u) * 1.6) rgba(255,220,110,1)) brightness(1.3); } }\n  #lobby img.shine { animation: shine 1.6s ease-in-out infinite !important; }\n  #lobby.rk { --tc: #FF5A1F; color: #F2EFE9; }\n  #lobby .rk-dim { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(10,11,14,.93) 0%, rgba(10,11,14,.88) 58%, rgba(10,11,14,.35) 76%, rgba(10,11,14,0) 90%),\n    linear-gradient(rgba(242,239,233,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(242,239,233,.04) 1px, transparent 1px); background-size: 100% 100%, calc(var(--u) * 4.2) calc(var(--u) * 4.2), calc(var(--u) * 4.2) calc(var(--u) * 4.2);\n    animation: lbFade .35s ease backwards; }\n  #lobby .rk-wrap { position: absolute; left: calc(var(--u) * 3.5); top: calc(var(--u) * 2.4); bottom: calc(var(--u) * 2.4); width: calc(var(--u) * 70); display: flex; flex-direction: column; gap: calc(var(--u) * 1.1); }\n  #lobby .rk-wrap > * { animation: lbUp .45s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .rk-wrap > :nth-child(2) { animation-delay: .05s; } #lobby .rk-wrap > :nth-child(3) { animation-delay: .1s; } #lobby .rk-wrap > :nth-child(4) { animation-delay: .15s; } #lobby .rk-wrap > :nth-child(5) { animation-delay: .2s; }\n  #lobby .rk-head { display: flex; align-items: flex-end; gap: calc(var(--u) * 2); }\n  #lobby .rk-title { display: flex; align-items: flex-start; font-size: calc(var(--u) * 4); color: #F2EFE9; line-height: 1; }\n  #lobby .rk-title i { font-style: normal; font-size: calc(var(--u) * 1.2); font-weight: 900; background: var(--or); color: #111; padding: 0 calc(var(--u) * .5); margin-left: calc(var(--u) * .6); }\n  #lobby .rk-modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: calc(var(--u) * 1.1); min-height: 0; pointer-events: auto; }\n  #lobby .rk-mode { position: relative; font: inherit; color: #F2EFE9; text-align: left; cursor: pointer; display: flex; flex-direction: column; gap: calc(var(--u) * .3); overflow: hidden;\n    background: rgba(0,0,0,.34); border: 1px solid rgba(242,239,233,.16); border-top: calc(var(--u) * .4) solid var(--mc); padding: calc(var(--u) * .9) calc(var(--u) * 1.1) calc(var(--u) * 1);\n    transition: transform .18s cubic-bezier(.2,.9,.25,1), border-color .18s ease, background .18s ease, box-shadow .18s ease; animation: lbUp .4s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(var(--i) * 60ms + .1s); }\n  #lobby .rk-mode::after { content: \'\'; position: absolute; right: calc(var(--u) * -3); bottom: calc(var(--u) * -3); width: calc(var(--u) * 9); height: calc(var(--u) * 9); background: var(--mc); opacity: .07; transform: rotate(45deg); transition: opacity .18s ease; pointer-events: none; }\n  #lobby .rk-mode:hover { transform: translateY(calc(var(--u) * -.3)); border-color: var(--mc); }\n  #lobby .rk-mode.on { background: rgba(10,11,14,.72); border-color: var(--mc); box-shadow: calc(var(--u) * .5) calc(var(--u) * .5) 0 var(--mc); transform: translate(calc(var(--u) * -.25), calc(var(--u) * -.35)); }\n  #lobby .rk-mode.on::after { opacity: .16; }\n  #lobby .rk-mode .mk-top { display: flex; align-items: center; justify-content: space-between; gap: calc(var(--u) * .5); }\n  #lobby .rk-mode .mk-n { font-size: calc(var(--u) * 2.1); color: var(--mc); line-height: 1; }\n  #lobby .rk-mode .mk-ck { font-style: normal; font-size: calc(var(--u) * .8); font-weight: 900; background: var(--mc); color: #111; padding: 0 calc(var(--u) * .45); opacity: 0; transform: scale(.7); transition: opacity .15s ease, transform .15s ease; }\n  #lobby .rk-mode.on .mk-ck { opacity: 1; transform: none; }\n  #lobby .rk-mode em { font-style: normal; font-size: calc(var(--u) * .8); font-weight: 900; background: #3A3F48; color: #F2EFE9; padding: 0 calc(var(--u) * .45); }\n  #lobby .rk-mode .mk-art { flex: 1; min-height: calc(var(--u) * 5.2); display: flex; align-items: center; justify-content: center; gap: calc(var(--u) * .7); }\n  #lobby .rk-mode .mk-art img { width: calc(var(--u) * 3); height: calc(var(--u) * 3); image-rendering: pixelated; border: calc(var(--u) * .22) solid #E8423F; background: #111; box-shadow: calc(var(--u) * .25) calc(var(--u) * .25) 0 rgba(0,0,0,.6); }\n  #lobby .rk-mode .mk-art .b img { border-color: #3E7BFA; transform: scaleX(-1); }\n  #lobby .rk-mode .mk-art .pr { display: flex; } #lobby .rk-mode .mk-art .pr img + img { margin-left: calc(var(--u) * -1); }\n  #lobby .rk-mode .mk-art .vs { font-weight: 900; font-size: calc(var(--u) * 1.4); color: var(--mc); font-style: italic; }\n  #lobby .rk-mode .mk-art svg { height: calc(var(--u) * 5.4); width: auto; }\n  #lobby .rk-mode b.mk-t { font-size: calc(var(--u) * 1.6); font-weight: 900; line-height: 1.15; }\n  #lobby .rk-mode small { font-size: calc(var(--u) * .88); color: #A9A59C; font-weight: 700; }\n  #lobby .rk-mode ul { margin: calc(var(--u) * .35) 0 0; padding: calc(var(--u) * .5) 0 0; border-top: 1px dashed rgba(242,239,233,.16); list-style: none; font-size: calc(var(--u) * .86); color: #CFCBC2; font-weight: 700; line-height: 1.6; }\n  #lobby .rk-mode li { white-space: nowrap; } #lobby .rk-mode li::before { content: \'\'; display: inline-block; width: calc(var(--u) * .42); height: calc(var(--u) * .42); background: var(--mc); margin-right: calc(var(--u) * .45); vertical-align: middle; }\n  #lobby .rk-mode.soon .mk-art, #lobby .rk-mode.soon ul { opacity: .5; }\n  #lobby .rk-pp { position: absolute; inset: 0; z-index: 6; display: flex; align-items: center; justify-content: center; background: rgba(8,9,12,.6); pointer-events: auto; animation: lbFade .2s ease-out; }\n  #lobby .rk-ppc { width: calc(var(--u) * 34); background: #F2EFE9; color: #111; border: calc(var(--u) * .3) solid #111; box-shadow: calc(var(--u) * .7) calc(var(--u) * .7) 0 #19C79A; padding: calc(var(--u) * 1.4) calc(var(--u) * 1.6); display: flex; flex-direction: column; gap: calc(var(--u) * .8); animation: lbUp .3s cubic-bezier(.2,.9,.25,1); }\n  #lobby .rk-ppc b { font-size: calc(var(--u) * 1.8); font-weight: 900; } #lobby .rk-ppc small { font-size: calc(var(--u) * .95); color: #4A4740; font-weight: 800; line-height: 1.6; }\n  #lobby .rk-ppr { display: flex; gap: calc(var(--u) * .6); } #lobby .rk-ppi { flex: 1; font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.3); padding: calc(var(--u) * .5) calc(var(--u) * .8); border: calc(var(--u) * .25) solid #111; background: #fff; text-transform: uppercase; }\n  #lobby .ai-seg small { display: block; font-size: calc(var(--u) * .8); font-weight: 900; opacity: .75; letter-spacing: .02em; }\n  #lobby .ai-seg.gold { background: linear-gradient(180deg, #FFE68F, #F2B705); border-color: #7A5600; color: #3A2800; box-shadow: 0 0 calc(var(--u) * 1.2) rgba(242,183,5,.55); }\n  #lobby .ai-seg.gold small { opacity: 1; color: #6B4700; }\n  #lobby .ai-pts { font-weight: 900; font-size: calc(var(--u) * 1.0); line-height: 1.55; padding: calc(var(--u) * .5) calc(var(--u) * .8); border-left: calc(var(--u) * .4) solid #F2B705; background: #FFF6D6; color: #5A4300; }\n  #lobby .ai-pts.no { border-left-color: #8A877F; background: #E8E5DE; color: #4A4740; }\n  #lobby .rk-aipts { display: block; margin-top: calc(var(--u) * .35); color: #FFD24A !important; font-weight: 900 !important; }\n  #lobby .rk-ppm { min-height: 1.6em; font-weight: 900; font-size: calc(var(--u) * 1.1); } #lobby .rk-ppcode { font: 900 calc(var(--u) * 2.2)/1 "Bahnschrift", "Arial Black", sans-serif; color: #19C79A; letter-spacing: .1em; }\n  #lobby .rk-go:disabled { filter: grayscale(1); opacity: .55; cursor: default; transform: none; }\n  #lobby .rk-sub b { display: block; font-size: calc(var(--u) * 1.8); font-weight: 900; } #lobby .rk-sub span { font-size: calc(var(--u) * 1.05); color: #A9A59C; font-weight: 700; letter-spacing: .05em; }\n  #lobby .rk-hero { display: grid; grid-template-columns: calc(var(--u) * 10.5) 1fr auto; gap: calc(var(--u) * 2); align-items: center; padding: calc(var(--u) * .9) calc(var(--u) * 1.8);\n    border: 1px solid rgba(242,239,233,.16); border-left: calc(var(--u) * .5) solid var(--tc); background: linear-gradient(90deg, color-mix(in srgb, var(--tc) 16%, transparent), transparent 70%); }\n  #lobby .rk-emb { position: relative; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; }\n  #lobby .rk-ring { position: absolute; inset: -12%; color: color-mix(in srgb, var(--tc) 60%, transparent); animation: btSpinR 16s linear infinite; }\n  @keyframes btSpinR { to { transform: rotate(360deg); } }\n  #lobby .rk-emb img { width: 76%; image-rendering: pixelated; filter: drop-shadow(0 calc(var(--u) * .6) calc(var(--u) * 1) rgba(0,0,0,.6)); animation: hop 2.4s ease-in-out infinite; }\n  @keyframes hop { 50% { transform: translateY(calc(var(--u) * -.6)); } }\n  #lobby .rk-who small { display: block; font-size: calc(var(--u) * 1); color: #A9A59C; font-weight: 800; letter-spacing: .1em; }\n  #lobby .rk-tn { display: block; font-size: calc(var(--u) * 3.6); font-weight: 900; line-height: 1.05; color: var(--tc); text-shadow: 0 0 calc(var(--u) * 2) color-mix(in srgb, var(--tc) 45%, transparent); }\n  #lobby .rk-sc { display: flex; align-items: baseline; gap: calc(var(--u) * .4); margin-top: calc(var(--u) * .2); }\n  #lobby .rk-score { font: 900 calc(var(--u) * 3) / 1 "Bahnschrift", "DIN Alternate", "Arial Narrow", sans-serif; font-variant-numeric: tabular-nums; } #lobby .rk-sc em { font-style: normal; color: #A9A59C; font-weight: 800; }\n  #lobby .rk-segs { margin-top: calc(var(--u) * .9); } #lobby .rk-segs i { background: rgba(242,239,233,.14); width: calc(var(--u) * 1.6); height: calc(var(--u) * .8); }\n  #lobby .rk-segs i.on { background: var(--tc); box-shadow: 0 0 calc(var(--u) * .8) color-mix(in srgb, var(--tc) 70%, transparent); outline: none; }\n  #lobby .rk-next { margin-top: calc(var(--u) * .6); font-size: calc(var(--u) * 1.1); color: #CFCBC2; font-weight: 700; }\n  #lobby .rk-stats { display: grid; grid-template-columns: repeat(3, calc(var(--u) * 7.5)); gap: calc(var(--u) * .7); }\n  #lobby .rk-stats div { border: 1px solid rgba(242,239,233,.2); padding: calc(var(--u) * .9) 0; text-align: center; background: rgba(0,0,0,.25); }\n  #lobby .rk-stats b { display: block; font: 900 calc(var(--u) * 2.6) / 1.1 "Bahnschrift", "Arial Narrow", sans-serif; color: var(--or); } #lobby .rk-stats small { font-size: calc(var(--u) * .95); color: #A9A59C; font-weight: 800; }\n  #lobby .rk-track { position: relative; height: calc(var(--u) * 8.6); margin: 0 calc(var(--u) * 3.2); }\n  #lobby .rk-track .ln { position: absolute; left: 0; right: 0; top: calc(var(--u) * 2.1); height: calc(var(--u) * .5); background: rgba(242,239,233,.15); }\n  #lobby .rk-track .ln i { display: block; height: 100%; background: linear-gradient(90deg, var(--or), var(--tc)); box-shadow: 0 0 calc(var(--u) * 1) var(--or); animation: grow 1s .25s cubic-bezier(.2,.9,.25,1) backwards; transform-origin: left; }\n  @keyframes grow { from { transform: scaleX(0); } }\n  #lobby .rk-track .nd { position: absolute; left: var(--x); top: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; width: calc(var(--u) * 8);\n    animation: lbUp .4s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(.2s + var(--i) * 60ms); }\n  #lobby .rk-track .ic { width: calc(var(--u) * 4.6); height: calc(var(--u) * 4.6); display: flex; align-items: center; justify-content: center; background: #15171C; border: calc(var(--u) * .25) solid rgba(242,239,233,.25); transform: rotate(45deg); }\n  #lobby .rk-track .ic img { width: 78%; transform: rotate(-45deg); image-rendering: pixelated; opacity: .55; filter: grayscale(.6); }\n  #lobby .rk-track .nd.past .ic { border-color: var(--c); } #lobby .rk-track .nd.past .ic img { opacity: 1; filter: none; }\n  #lobby .rk-track .nd.me .ic { border-color: var(--c); background: color-mix(in srgb, var(--c) 25%, #15171C); box-shadow: 0 0 0 calc(var(--u) * .4) rgba(0,0,0,.5), 0 0 calc(var(--u) * 2) var(--c); animation: pulse 1.4s ease-in-out infinite; }\n  #lobby .rk-track .nd.me .ic img, #lobby .rk-track .nd.top .ic img { opacity: 1; filter: none; }\n  @keyframes pulse { 50% { box-shadow: 0 0 0 calc(var(--u) * .8) rgba(0,0,0,.4), 0 0 calc(var(--u) * 3.4) var(--c); } }\n  #lobby .rk-track b { margin-top: calc(var(--u) * 1.1); font-size: calc(var(--u) * 1.15); font-weight: 900; white-space: nowrap; color: #CFCBC2; } #lobby .rk-track .nd.me b { color: var(--c); }\n  #lobby .rk-track small { font-size: calc(var(--u) * .85); color: #8E8A82; font-weight: 800; font-family: "Bahnschrift", "Arial Narrow", sans-serif; }\n  #lobby .rk-low { flex: 1; min-height: calc(var(--u) * 16); display: grid; grid-template-columns: 1fr calc(var(--u) * 24); gap: calc(var(--u) * 1.4); }\n  #lobby .rk-panel { pointer-events: auto; border: 1px solid rgba(242,239,233,.16); background: rgba(0,0,0,.28); padding: calc(var(--u) * 1.2) calc(var(--u) * 1.4); min-height: 0; display: flex; flex-direction: column; }\n  #lobby .rk-cap { display: flex; align-items: center; gap: calc(var(--u) * .9); font-size: calc(var(--u) * 1.3); margin-bottom: calc(var(--u) * 1); color: var(--or); }\n  #lobby .rk-cap span { font-size: calc(var(--u) * 1.05); font-weight: 800; color: #A9A59C; }\n  #lobby .rk-rounds { display: grid; grid-template-columns: repeat(5, 1fr); gap: calc(var(--u) * .7); }\n  #lobby .rk-rd { position: relative; background: rgba(242,239,233,.06); border: 1px solid rgba(242,239,233,.18); padding: calc(var(--u) * .6) calc(var(--u) * .5) calc(var(--u) * .8); text-align: center;\n    animation: lbUp .35s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(.3s + var(--i) * 60ms); transition: background .15s ease, border-color .15s ease; }\n  #lobby .rk-rd:hover { background: rgba(255,90,31,.14); border-color: var(--or); }\n  #lobby .rk-rd i { position: absolute; left: calc(var(--u) * .5); top: calc(var(--u) * .4); font-size: calc(var(--u) * .95); color: var(--or); }\n  #lobby .rk-rd .gp { aspect-ratio: 1.6; display: flex; align-items: center; justify-content: center; } #lobby .rk-rd .gp img { width: 90%; image-rendering: pixelated; filter: drop-shadow(0 calc(var(--u) * .3) calc(var(--u) * .4) rgba(0,0,0,.6)); }\n  #lobby .rk-rd b { font-size: calc(var(--u) * 1.2); font-weight: 900; }\n  #lobby .rk-rules { display: flex; flex-wrap: wrap; gap: calc(var(--u) * .5) calc(var(--u) * 1.6); margin-top: auto; padding-top: calc(var(--u) * 1); font-size: calc(var(--u) * 1); font-weight: 700; color: #CFCBC2; }\n  #lobby .rk-rules span::before { content: \'\'; display: inline-block; width: calc(var(--u) * .55); height: calc(var(--u) * .55); background: var(--or); margin-right: calc(var(--u) * .5); vertical-align: middle; }\n  #lobby .rk-list { overflow-y: auto; display: flex; flex-direction: column; gap: calc(var(--u) * .3); touch-action: pan-y; }\n  #lobby .rk-row { display: grid; grid-template-columns: calc(var(--u) * 2.2) calc(var(--u) * 2.2) 1fr auto; align-items: center; gap: calc(var(--u) * .8); font-size: calc(var(--u) * 1.1); padding: calc(var(--u) * .35) calc(var(--u) * .4);\n    border-bottom: 1px solid rgba(242,239,233,.08); animation: lbUp .3s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(var(--i) * 30ms); }\n  #lobby .rk-row i { font-style: normal; font-weight: 900; text-align: center; color: #A9A59C; } #lobby .rk-row.top3 i { background: var(--or); color: #111; }\n  #lobby .rk-row img { width: calc(var(--u) * 2.2); image-rendering: pixelated; } #lobby .rk-row b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } #lobby .rk-row span { font-weight: 900; color: var(--or); font-family: "Bahnschrift", "Arial Narrow", sans-serif; }\n  #lobby .rk-empty { font-size: calc(var(--u) * 1.05); color: #8E8A82; font-weight: 700; padding: calc(var(--u) * 1) 0; }\n  #lobby .rk-foot { display: grid; grid-template-columns: calc(var(--u) * 12) 1fr; gap: calc(var(--u) * 1.2); }\n  #lobby .rk-back { pointer-events: auto; cursor: pointer; font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.4); color: #F2EFE9; background: transparent; border: 1px solid rgba(242,239,233,.4);\n    display: flex; align-items: center; justify-content: center; gap: calc(var(--u) * .8); transition: background .15s ease; } #lobby .rk-back:hover { background: rgba(242,239,233,.1); }\n  #lobby .rk-go { pointer-events: auto; cursor: pointer; position: relative; overflow: hidden; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: calc(var(--u) * 1.6); font: inherit; color: #111; border: 0;\n    padding: calc(var(--u) * 1) calc(var(--u) * 2.2); font-size: calc(var(--u) * 2.8); font-weight: 900; letter-spacing: .06em; text-align: left;\n    background: repeating-linear-gradient(-55deg, #FF5A1F 0 calc(var(--u) * 2.2), #FF6E37 calc(var(--u) * 2.2) calc(var(--u) * 4.4)); background-size: 200% 100%; animation: stripes 1.4s linear infinite;\n    clip-path: polygon(calc(var(--u) * 1.4) 0, 100% 0, 100% calc(100% - calc(var(--u) * 1.4)), calc(100% - calc(var(--u) * 1.4)) 100%, 0 100%, 0 calc(var(--u) * 1.4)); transition: filter .15s ease, transform .15s ease; }\n  @keyframes stripes { to { background-position: calc(var(--u) * -10) 0; } }\n  #lobby .rk-go em { font-style: normal; font-size: calc(var(--u) * 1.05); font-weight: 800; letter-spacing: 0; opacity: .75; }\n  #lobby .rk-go svg.bt { height: .75em; }\n  #lobby .rk-go:hover { filter: brightness(1.08); transform: translateX(calc(var(--u) * .4)); } #lobby .rk-go:active { transform: translateX(calc(var(--u) * .1)) scale(.995); }\n  #lobby .lb-tier-ic.shine { animation: shine 1.6s ease-in-out infinite; }\n  #lobby .lb-tier-ic, #lobby .rk-ic, #lobby .rk-track img, #lobby .rk-row img, #lobby .rs-tier img, #lobby img.tier-hi { image-rendering: auto !important; }\n  .p-narrow #lobby { --u: min(calc(var(--pvw, 1vw) * 1.35), calc(var(--pvh, 1vh) * 1.6)); } .p-narrow #lobby .lb-menu { width: calc(var(--u) * 44); top: auto; bottom: calc(var(--u) * 7.5); }\n  '),
          document.head.appendChild(t));
      }
    };
  class LobbyScreen extends MenuScreen {
    constructor(t) {
      (super(t, null),
        (this.blurBg = !1),
        (this.bgDim = 0),
        (this.pauses = !1),
        (this.rec = null),
        (this.el = null));
    }
    layout() {
      const t = this.game;
      (this.el || this.mount(), this.refresh());
      const e = "undefined" != typeof Mods && Mods.boot;
      e &&
        !e.done &&
        (e.open || e.create) &&
        ((e.done = !0),
        setTimeout(() => {
          e.open ? t.loadWorld(e.open) : t.createWorld(...e.create);
        }, 0));
    }
    mount() {
      const e = this.game;
      ensureCss();
      const a = (this.el = document.createElement("div"));
      ((a.id = "lobby"),
        t && (a.style.display = "none"),
        (a.innerHTML = `<div class="lb-stage">\n        <div class="lb-drag" title="拖动转一转"></div>\n        <button class="lb-bug" data-a="bug"><span class="ic">${T}</span><span class="tx"><b>反馈 BUG</b><small>遇到问题？直接发给开发者</small></span><em>›</em></button>\n        <div class="lb-logo sh"><div class="blk cut"><img src="potato/logo.svg" alt="土豆史诗 POTATO EPIC"></div></div>\n        <div class="lb-menu">\n          <div class="itw sh"><div class="blk cut it rank aibig" data-a="ai">\n            <div class="top"><div class="tag"><i style="background:#FF5AA5"></i>${blockText("01", { cls: "num" })}${blockText("VS AI")}</div>\n              <div class="ttl">人机对战</div>\n              <div class="tier"><div><b>随时开打 · 不卡顿 · 不排队</b><span>1V1 / 2V2 / 淘汰赛 / 乱斗 · 赢了也加天梯分</span></div></div></div>\n            <div class="go"><span class="gt">开始对战</span>${blockText("GO >")}</div></div></div>\n          <div class="row2">\n            <div class="itw sh"><div class="blk cut it rk2" data-a="rank" style="--c:#FF5A1F">\n              <div class="tag"><i></i>${blockText("02", { cls: "num" })}${blockText("RANKED")}</div><div class="ttl">天梯排位</div>\n              <div class="sub"><img class="lb-tier-ic" alt=""><b class="lb-tier">未登录</b><span class="lb-score" hidden></span><div class="segs lb-segs" hidden></div></div>${blockText(">", { cls: "arr" })}</div></div>\n            ${item("", "03", "CUSTOM", "#19C79A", "好友约战", "自定义房间 · 房间码", "friend")}\n          </div>\n          <div class="row2">\n            ${item("", "04", "RANGE", "#2EA6F0", "靶场训练", "清房 · 自由射击", "range")}\n            ${item("", "05", "WARDROBE", "#8F6BF2", "衣柜", "皮肤 · 枪皮 · 披风 · 装饰", "armory")}\n          </div>\n          <div class="row2">\n            ${item("", "06", "SFE", "#F5A623", "搜打撤", "PVE · 搜物资 · 撤离变现", "sfe")}\n          </div>\n        </div>\n        </div>\n        <div class="lb-tools"><button class="tb cut lb-sign" data-a="sign" title="薯光丰收节 · 签到"><b>签到</b><span class="lb-dot"></span></button><button class="tb cut lb-coin" data-a="guns" title="土豆币 · 枪皮"><i></i><b class="lb-cn">—</b></button>${fsSupported() ? `<button class="tb cut" data-a="full" title="全屏">${$}</button>` : ""}<button class="tb cut" data-a="options" title="设置">${M}</button></div>\n\n        <div class="lb-me cut" data-a="account"><div class="dot"></div><div class="nm"><span class="lb-name">登录</span><small class="lb-hint">登录后可以排位、约战</small></div></div>\n        <div class="lb-foot"><span class="r"></span>${blockText("POTATO EPIC · VOXEL SHOOTER · 2026")}</div>`),
        host().appendChild(a),
        shCss(),
        (this.shStop = self.Potato.lobbyShare(a)));
      {
        const RM = () => self.XZ && self.XZ.pmRoom && self.XZ.pmRoom();
        RM() &&
          "lobby" === RM().st &&
          setTimeout(() => {
            e.ui.screen === this &&
              RM() &&
              "lobby" === RM().st &&
              e.ui.open(new PotatoCustom(e, new LobbyScreen(e)));
          }, 80);
      }
      (a.addEventListener("click", (t) => {
        const e = t.target.closest("[data-a]");
        e && this.act(e.dataset.a, e);
      }),
        (this.onMove = (t) => {
          const o = e.lobby;
          if (!o) return;
          const [s, i] = sp(t);
          ((o.mx = (s / sw()) * 2 - 1),
            (o.my = (i / sh()) * 2 - 1),
            o.drag && (o.yaw = o.drag.yaw + 0.012 * (s - o.drag.x)));
          const l = a.querySelector(".lb-stage");
          l &&
            (l.style.transform = `rotateY(${(1.6 * -o.mx).toFixed(2)}deg) rotateX(${(1.2 * o.my).toFixed(2)}deg)`);
        }),
        (this.onUp = () => {
          e.lobby && (e.lobby.drag = null);
        }),
        addEventListener("pointermove", this.onMove),
        addEventListener("pointerup", this.onUp),
        addEventListener("pointercancel", this.onUp),
        a.querySelector(".lb-drag").addEventListener("pointerdown", (t) => {
          (e.lobby && (e.lobby.drag = { x: sp(t)[0], yaw: e.lobby.yaw }), t.preventDefault());
        }));
    }
    refresh() {
      const t = this.el;
      if (!t) return;
      const e = self.XZ && self.XZ.skins;
      if (e) {
        this.unsub || ((this.unsub = e.sub(() => this.refresh())), e.load());
        const a = e.v,
          o = t.querySelector(".lb-coin");
        o && (o.querySelector(".lb-cn").textContent = a ? a.coins : "—");
        const s = t.querySelector(".lb-sign");
        s && s.classList.toggle("dot", !!(a && a.sign ? !a.sign.signed : a && !a.signed));
      }
      const q = (e) => t.querySelector(e),
        a = "undefined" != typeof Account && Account.loggedIn,
        o = potGuest();
      ((q(".lb-name").textContent = a && Account.loggedIn ? Account.name : o ? potName() : "登录"),
        (q(".lb-hint").textContent = a
          ? "已登录 · 点这里管理账号"
          : o
            ? "测试版游客 · 可以排位 · 点这里登录账号"
            : "登录后可以排位、约战"),
        q(".lb-me").classList.toggle("out", !a && !o));
      const s = self.XZ && self.XZ.ladder,
        segs = (t, e) => {
          ((q(".lb-segs").innerHTML = Array.from(
            { length: 10 },
            (e, a) => `<i class="${a < t ? "on" : ""}"></i>`,
          ).join("")),
            q(".rk2").style.setProperty("--tc", e));
        };
      if (!a && !o) {
        ((q(".lb-tier").textContent = "未登录"),
          (q(".lb-score").textContent = "登录后开始排位"),
          segs(0, "#FF5A1F"));
        const t = itemPic(this.game, "stone");
        return void (t && (q(".lb-tier-ic").src = t));
      }
      (((t) => {
        if (!s) return;
        const e = s.tierOf(t),
          a = s.TIERS.indexOf(e),
          o = s.TIERS[a + 1];
        ((q(".lb-tier").textContent =
          (s.tierName ? s.tierName(t, this.rec && this.rec.rank) : e.n) + " · " + t + " 分"),
          (q(".lb-score").textContent = o
            ? "距离" + o.n + "还差 " + (o.lo - t) + " 分"
            : "最高段位"),
          segs(
            o ? Math.max(1, Math.min(10, Math.round(((t - e.lo) / (o.lo - e.lo)) * 10))) : 10,
            e.col,
          ));
        const i = tierPic(this.game, e);
        (i && (q(".lb-tier-ic").src = i), q(".lb-tier-ic").classList.toggle("shine", !!e.glow));
      })(this.rec ? this.rec.score : s ? s.START : 100),
        this.rec ||
          this.asked ||
          ((this.asked = !0),
          o && self.XZ && XZ.guestFetch
            ? XZ.guestFetch()
                .then((t) => {
                  t.rec &&
                    void 0 !== t.rec.score &&
                    ((this.rec = t.rec), this.el && this.refresh());
                })
                .catch(() => {})
            : Account.api("/api/ladder/me")
                .then((t) => {
                  t && t.me && ((this.rec = t.me), this.el && this.refresh());
                })
                .catch(() => {})));
    }
    act(t, e) {
      const a = this.game,
        back = () => new LobbyScreen(a);
      if ("rank" === t) a.ui.open(new PotatoRanked(a, back()));
      else if ("friend" === t) a.ui.open(new PotatoCustom(a, back()));
      else if ("range" === t) openRange(a);
      else if ("sfe" === t) self.SFE_RULES && SFE_RULES.openPrep(a);
      else if ("tour" === t) {
        if (!potLogged()) return void a.ui.open(new LoginScreen(a, () => a.ui.open(back())));
        self.XZ &&
          self.XZ.tourStart &&
          (a.lobby && a.lobby.moveTo(l, Math.PI + 0.3, 400), self.XZ.tourStart(a));
      } else
        "armory" === t
          ? openWardrobe(a, back())
          : "share" === t
            ? a.ui.open(new PotatoShare(a, back()))
            : "ai" === t
              ? this.aiPick()
              : "aimode" === t || "aidiff" === t || "aigo" === t || "aiclose" === t
                ? this.aiAct(t, e)
                : "guns" === t
                  ? a.ui.open(new PotatoGunSkins(a, back()))
                  : "sign" === t
                    ? a.ui.open(new PotatoCheckin(a, back()))
                    : "options" === t
                      ? a.ui.open(new OptionsScreen(a, back()))
                      : "feedback" === t || "bug" === t
                        ? a.ui.open(new PotatoBug(a, back(), null))
                        : "full" === t
                          ? toggleFullscreen()
                          : "account" === t &&
                            a.ui.open(
                              Account.loggedIn
                                ? new AccountScreen(a, back())
                                : new LoginScreen(a, () => a.ui.open(back())),
                            );
    }
    aiPick() {
      if (!this.el || this.el.querySelector(".rk-pp")) return;
      ((this.aiMode = this.aiMode || "1v1"), (this.aiDiff = this.aiDiff || "normal"));
      const t = document.createElement("div");
      t.className = "rk-pp";
      const seg = (t, e, a, o, s) =>
        `<button class="shp-btn sm ai-seg${s ? " " + s : ""}" data-a="${t}" data-v="${e}">${a}${o ? `<small>${o}</small>` : ""}</button>`;
      ((t.innerHTML = `<div class="rk-ppc" style="box-shadow: calc(var(--u) * .7) calc(var(--u) * .7) 0 #FF5AA5"><b>人机对战</b><small>和电脑对手打，赢了也能加天梯分（${Ct} 分以下）。困难档的机器人会找掩体、听枪声找人。</small>\n        <div class="rk-ppr">${seg("aimode", "1v1", "1V1")}${seg("aimode", "2v2", "2V2 · 带机器人队友")}</div>\n        <div class="rk-ppr">${seg("aimode", "tour", "8 人淘汰赛")}${seg("aimode", "ffa", "乱斗 · 6 人混战")}</div>\n        <div class="rk-ppr">${seg("aidiff", "easy", "简单", "加分 ×10%")}${seg("aidiff", "normal", "普通", "加分 ×25%")}${seg("aidiff", "hard", "困难", "加排位分 ×50%", "gold")}</div>\n        <div class="ai-pts"></div>\n        <button class="shp-btn go" data-a="aigo">开始</button><button class="shp-btn sm" data-a="aiclose">关闭</button></div>`),
        this.el.appendChild(t),
        shCss(),
        this.aiMark());
    }
    aiMark() {
      const t = this.el && this.el.querySelector(".rk-pp");
      if (!t) return;
      t.querySelectorAll(".ai-seg").forEach((t) => {
        const e = t.dataset.v === ("aimode" === t.dataset.a ? this.aiMode : this.aiDiff),
          a = t.classList.contains("gold");
        ((t.style.background = e ? "#111" : ""),
          (t.style.color = e ? (a ? "#FFD24A" : "#F2EFE9") : ""),
          a && (t.style.borderColor = e ? "#F2B705" : ""));
      });
      const e = t.querySelector(".ai-pts");
      if (!e) return;
      const a = Et[this.aiDiff] || 25,
        o = { easy: "简单", normal: "普通", hard: "困难" }[this.aiDiff] || "普通",
        s =
          "ffa" === this.aiMode
            ? "乱斗不加天梯分：只是图个痛快"
            : potLogged()
              ? `赢了加天梯分：${o} = 排位胜场的 ${a}%${"tour" === this.aiMode ? "（淘汰赛每赢一场都算）" : ""} · 输了不扣分 · ${Ct} 分以上不再加`
              : "登录后，人机赢了也能加天梯分";
      ((e.textContent = s), e.classList.toggle("no", "ffa" === this.aiMode || !potLogged()));
    }
    aiAct(t, e) {
      const a = this.el && this.el.querySelector(".rk-pp"),
        o = this.game;
      if ("aiclose" !== t) {
        if ("aimode" === t) return ((this.aiMode = e.dataset.v), void this.aiMark());
        if ("aidiff" === t) return ((this.aiDiff = e.dataset.v), void this.aiMark());
        if ("aigo" === t) {
          (a && a.remove(), o.lobby && o.lobby.moveTo(l, Math.PI + 0.3, 400));
          const t = self.XZ;
          if (!t || !t.ladderStart) return;
          if ("1v1" === this.aiMode || "2v2" === this.aiMode)
            try {
              sessionStorage.setItem(
                "potato:aiLast",
                JSON.stringify({ team: "2v2" === this.aiMode, diff: this.aiDiff }),
              );
            } catch (t) {}
          "tour" === this.aiMode && t.aiTourStart
            ? t.aiTourStart(o, this.aiDiff)
            : "ffa" === this.aiMode
              ? t.ladderStart(o, { ai: { ffa: !0, diff: this.aiDiff } })
              : t.ladderStart(o, { ai: { team: "2v2" === this.aiMode, diff: this.aiDiff } });
        }
      } else a && a.remove();
    }
    close() {
      if (
        (this.shStop && (this.shStop(), (this.shStop = null)),
        this.unsub && (this.unsub(), (this.unsub = null)),
        this.el)
      ) {
        const t = this.el;
        ((this.el = null), t.classList.add("lbx"), setTimeout(() => t.remove(), 380));
      }
      (removeEventListener("pointermove", this.onMove),
        removeEventListener("pointerup", this.onUp),
        removeEventListener("pointercancel", this.onUp));
    }
    draw(t) {}
    key(t, e) {
      return !1;
    }
  }
  ((self.LobbyScreen = LobbyScreen), (TitleScreen = LobbyScreen));
  const O = UI.prototype.close;
  async function openRange(t) {
    const e = "xzrange",
      a = "靶场",
      o = "xzrange",
      s = 1,
      i = "survival";
    let l = [];
    try {
      l = await DB.listWorlds();
    } catch (t) {}
    const r = l.find((t) => "xzrange" === Mods.tutorialOf(t) && t.sky >= 4);
    if (r) {
      if ("survival" !== r.mode)
        try {
          const t = await DB.getWorld(r.id);
          t && ((t.mode = "survival"), await DB.putWorld(t));
        } catch (t) {}
      t.loadWorld(r.id);
    } else t.createWorld(a, o, i, !0, { cheats: !0, difficulty: s, tutorialMap: e });
  }
  UI.prototype.close = function () {
    (O.call(this),
      "title" === this.game.state &&
        this.game.lobby &&
        !this.screen &&
        this.open(new LobbyScreen(this.game)));
  };
  const inRange = (t) => !(!(t && t.world && t.world.xzRange) || t.net);
  self.XZ && (self.XZ.freeHere = inRange);
  const U = Player.prototype.hurt;
  Player.prototype.hurt = function (t, e) {
    return !(inRange(this.game) && (!e || "void" !== e.type)) && U.call(this, t, e);
  };
  const V = Player.prototype.tick;
  Player.prototype.tick = function (...t) {
    const e = V.apply(this, t),
      a = this.game;
    return (
      inRange(a) &&
        this === a.player &&
        ((this.food = 20),
        (this.saturation = 5),
        (this.exhaustion = 0),
        "creative" === a.mode && ((a.mode = "survival"), (this.flying = !1))),
      e
    );
  };
  const N = UI.prototype.open;
  if (
    ((UI.prototype.open = function (t) {
      if ("undefined" != typeof CreativeScreen && t instanceof CreativeScreen) {
        const e = this.game;
        t = e.net ? e.net.inventoryScreen() : new CraftingScreen(e, 2);
      }
      return (
        "undefined" != typeof CraftingScreen &&
          t instanceof CraftingScreen &&
          "play" === this.game.state &&
          !this.game.net &&
          self.PotatoLoadout &&
          (t = new self.PotatoLoadout(this.game)),
        N.call(this, t)
      );
    }),
    "undefined" != typeof TouchControls)
  ) {
    const we = TouchControls.prototype.onStart;
    TouchControls.prototype.onStart = function (t) {
      const e = t.target;
      return e && e.closest && e.closest("#lobby")
        ? ((this.ui.lastTouch = performance.now()), void Sound.init())
        : we.call(this, t);
    };
  }
  const j = /^<[^<>\n]{1,40}> /,
    G = UI.prototype.message;
  UI.prototype.message = function (t, e) {
    const a = String(null == t ? "" : t);
    if (j.test(a) || a.startsWith("保存失败")) return G.call(this, t, e);
    const o = a.trim();
    o &&
      (this.actionBar = {
        text: o.length > 60 ? o.slice(0, 59) + "…" : o,
        t: performance.now(),
        color: e || "#FFFFFF",
      });
  };
  for (const ke of ["welcome", "modTips"])
    Object.defineProperty(Game.prototype, ke, { configurable: !0, get: () => null, set(t) {} });
  const matchOn = (t) => !!(self.XZ && XZ.match && XZ.match.on(t));
  class PotatoPause extends MenuScreen {
    constructor(t) {
      (super(t, null),
        (this.live = matchOn(t) && !(self.XZ && XZ.match && XZ.match.ai && XZ.match.ai())),
        (this.pauses = !this.live),
        (this.blurBg = !this.live),
        (this.el = null),
        (this.sure = !1));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      const t = this.game,
        e = t.settings;
      ensureCss();
      const a = (this.el = document.createElement("div"));
      ((a.id = "lobby"), (a.className = "pz" + (this.live ? " live" : "")));
      const o = !(!t.worldMeta || !t.worldMeta.xzduel),
        s = !!(t.ui.touch && t.ui.touch.on && t.ui.touch.on());
      (this.live
        ? (a.innerHTML = `<div class="pz-wrap pzl-wrap">\n        <div class="pz-head">${blockText("MATCH")}<span>对局进行中 · 游戏不会停</span></div>\n        <div class="sh"><div class="blk cut pzm"><div class="pzm-top"><b class="pzm-st">对局中</b><span class="pzm-sc"></span></div><div class="pzm-lat"></div><div class="pzm-note"></div><div class="pzm-btns"></div></div></div>\n        <button class="pzl-go" data-a="resume">回到游戏<em>›</em></button>\n        <div class="pzl-row"><button data-a="video">视频设置</button><button data-a="controls">${s ? "触控设置" : "操作与键位"}</button><button data-a="sound">声音</button><button data-a="feedback">反馈问题</button></div>\n        <button class="pzl-quit" data-a="quit">离开对局（算认输）</button>\n      </div>`)
        : (a.innerHTML = `<div class="pz-wrap">\n        <div class="pz-head">${blockText(this.live ? "MATCH" : "PAUSED")}<span>${this.live ? "对局进行中 · 游戏不会停" : "游戏暂停 · " + ((t.worldMeta && t.worldMeta.name) || "")}</span></div>\n        ${this.live ? '<div class="sh"><div class="blk cut pzm"><div class="pzm-top"><b class="pzm-st">对局中</b><span class="pzm-sc"></span></div><div class="pzm-lat"></div><div class="pzm-note"></div><div class="pzm-btns"></div></div></div>' : ""}\n        <div class="itw sh"><div class="blk cut it pz-go" data-a="resume"><div class="tag"><i></i>${blockText("01", { cls: "num" })}${blockText("RESUME")}</div><div class="ttl">回到游戏</div>${blockText(">", { cls: "arr" })}</div></div>\n        <div class="row2">\n          ${item("", "02", "VIDEO", "#2EA6F0", "视频设置", "画质 · 光影 · 帧率", "video")}\n          ${(() => {
            const e = !!(t.ui.touch && t.ui.touch.on && t.ui.touch.on());
            return item(
              "",
              "03",
              e ? "TOUCH" : "CONTROLS",
              "#19C79A",
              e ? "触控设置" : "操作与键位",
              e ? "键位方案 · 按钮布局 · 灵敏度" : "灵敏度 · 按键",
              "controls",
            );
          })()}\n        </div>\n        <div class="row2">\n          ${item("", "04", "SOUND", "#8F6BF2", "声音", "音量 · 字幕", "sound")}\n          ${item("", "05", "FEEDBACK", "#FFB020", "反馈问题", "附上现在的画面", "feedback")}\n        </div>\n        <div class="sh"><div class="blk cut pz-fov"><span class="lbl">视场角</span><input type="range" min="30" max="110" step="1" value="${Math.round(e.fov)}"><b class="v">${Math.round(e.fov)}</b></div></div>\n        <div class="itw sh"><div class="blk cut it pz-quit" data-a="quit"><div class="tag"><i></i>${blockText("06", { cls: "num" })}${blockText("LOBBY")}</div><div class="ttl">${o ? "离开对局，回大厅" : "保存并回到大厅"}</div>${blockText(">", { cls: "arr" })}</div></div>\n      </div>`),
        host().appendChild(a),
        a.addEventListener("click", (e) => {
          const a = e.target.closest("[data-a]");
          if (a) {
            if ("mkick" === a.dataset.a) {
              const e = +a.dataset.pid,
                o = self.XZ && XZ.match;
              return this.kickSure !== e
                ? ((this.kickSure = e), void this.fillMatch())
                : ((this.kickSure = null), o && o.kick && o.kick(t, e), void this.fillMatch());
            }
            this.act(a.dataset.a);
          }
        }),
        this.live &&
          (this.fillMatch(),
          (this.tm = setInterval(() => {
            if (!matchOn(t))
              return (clearInterval(this.tm), void (t.ui.screen === this && t.ui.close()));
            this.fillMatch();
          }, 250))));
      const i = a.querySelector(".pz-fov input"),
        l = a.querySelector(".pz-fov .v");
      i &&
        (i.addEventListener("input", () => {
          ((e.fov = +i.value), (l.textContent = i.value));
        }),
        i.addEventListener("change", () => {
          t.saveSettings();
        }));
    }
    fillMatch() {
      const t = this.el,
        e = self.XZ && XZ.match;
      if (!t || !e) return;
      const a = e.state(),
        q = (e) => t.querySelector(e);
      ((q(".pzm-st").textContent = a.paused
        ? "暂停中"
        : "prep" === a.ph
          ? "准备中"
          : "end" === a.ph
            ? "本局结束"
            : "对局中"),
        (q(".pzm-sc").textContent =
          "比分 " +
          a.w +
          " : " +
          a.l +
          " · 第 " +
          (a.i + 1) +
          " / " +
          a.n +
          " 局" +
          (a.gun ? " · " + a.gun : "")));
      const o = e.lat(),
        s = "undefined" != typeof Account && Account.data && Account.data.super,
        i =
          '<span class="k">延迟</span>' +
          (o.length
            ? o
                .map((t) => {
                  return `<span class="p"><i>${esc(t.name)}${t.host ? "（房主）" : ""}${t.team ? " · 队友" : ""}</i><b style="color:${((e = t.ms), null == e ? "#9AA4B8" : e < 80 ? "#3DDC84" : e < 150 ? "#FFD24A" : "#FF7A6B")}">${null == t.ms ? "—" : t.ms + " ms"}</b>${s ? `<button class="pzm-kick ${this.kickSure === t.pid ? "on" : ""}" data-a="mkick" data-pid="${t.pid}">${this.kickSure === t.pid ? "确认踢出" : "踢出"}</button>` : ""}</span>`;
                  var e;
                })
                .join("")
            : '<span class="p"><b>—</b></span>');
      q(".pzm-lat").__h !== i && ((q(".pzm-lat").__h = i), (q(".pzm-lat").innerHTML = i));
      const l = a.draw,
        r = a.paused
          ? "暂停还剩 " + a.pauseLeft + " 秒"
          : l && !l.mine
            ? "对手求和：接受后这场算平局，" + l.left + " 秒内不回应视为拒绝"
            : a.req && !a.req.mine
              ? "对手请求暂停 30 秒，" + a.req.left + " 秒内不回应视为拒绝"
              : this.sure
                ? "再点一次「确认认输」：剩下的局都算对手赢"
                : l
                  ? "已求和，等待对手回应 " + l.left + " 秒"
                  : a.req
                    ? "已请求暂停，等待对手回应 " + a.req.left + " 秒"
                    : a.cool
                      ? "刚请求过暂停，稍后才能再请求"
                      : "暂停、求和都要对手同意";
      ((q(".pzm-note").textContent = r),
        q(".pzm-note").classList.toggle(
          "warn",
          !!(this.sure || (a.req && !a.req.mine) || (l && !l.mine)),
        ));
      const btn = (t, e, a = !0, o = "") =>
          `<button data-a="${t}" class="${o}" ${a ? "" : "disabled"}>${e}</button>`,
        d =
          l && !l.mine
            ? btn("mdyes", "同意平局", !0, "gold") + btn("mdno", "拒绝")
            : a.req && !a.req.mine
              ? btn("maccept", "接受暂停", !0, "gold") + btn("mrefuse", "拒绝")
              : btn(
                  "mpause",
                  a.paused ? "暂停中" : a.req ? "等待回应…" : a.cool ? "稍后再请求" : "请求暂停",
                  a.canAsk,
                ) +
                (a.team
                  ? ""
                  : btn("mdraw", l ? "等待回应…" : a.drawCool ? "稍后再求和" : "求和", a.canDraw)) +
                btn("msurr", this.sure ? "确认认输" : "认输", !0, this.sure ? "red" : "");
      q(".pzm-btns").__h !== d && ((q(".pzm-btns").__h = d), (q(".pzm-btns").innerHTML = d));
    }
    act(t) {
      const e = this.game,
        back = () => new PotatoPause(e),
        a = self.XZ && XZ.match;
      return a && "mpause" === t
        ? (a.askPause(e), void this.fillMatch())
        : !a || ("maccept" !== t && "mrefuse" !== t)
          ? a && "msurr" === t
            ? this.sure
              ? (a.surrender(e), void e.ui.close())
              : ((this.sure = !0), void this.fillMatch())
            : a && "mdraw" === t
              ? (a.offerDraw(e), void this.fillMatch())
              : !a || ("mdyes" !== t && "mdno" !== t)
                ? "quit" === t && this.live && a && a.quit
                  ? (a.quit(e), e.ui.close(), void setTimeout(() => e.quitToTitle(), 600))
                  : void ("resume" === t
                      ? e.ui.close()
                      : "video" === t
                        ? e.ui.open(new PotatoSettings(e, back(), "video"))
                        : "controls" === t
                          ? e.ui.open(new PotatoSettings(e, back(), "controls"))
                          : "sound" === t
                            ? e.ui.open(new PotatoSettings(e, back(), "sound"))
                            : "feedback" === t || "bug" === t
                              ? e.ui.open(new PotatoBug(e, back(), null))
                              : "quit" === t && (e.ui.close(), e.quitToTitle()))
                : (a.answerDraw(e, "mdyes" === t), void this.fillMatch())
          : (a.answer(e, "maccept" === t), void this.fillMatch());
    }
    close() {
      (clearInterval(this.tm), this.el && (unmount(this.el), (this.el = null)));
    }
    draw(t) {
      this.live || t.menuBackground();
    }
    onEsc() {
      this.game.ui.close();
    }
  }
  function unmount(t) {
    t && (t.classList.add("out"), setTimeout(() => t.remove(), 170));
  }
  ((self.PotatoPause = PotatoPause), (PauseScreen = PotatoPause));
  const esc = (t) =>
      String(null == t ? "" : t).replace(
        /[&<>"]/g,
        (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[t],
      ),
    lab = (t) => ("function" == typeof t ? t() : t) || "",
    backTo = (t, e) => {
      e ? t.ui.open(e) : "play" === t.state ? t.ui.close() : t.ui.open(new LobbyScreen(t));
    },
    K = [/^攻击\/摧毁/, /^使用物品\/放置方块/, /^自动跳跃/, /^操作方式/, /^图形品质/, /^渲染距离/],
    Q = [
      [/潜行/g, "下蹲"],
      [/疾跑/g, "冲刺"],
      [/离散滚动/g, "滚轮逐格换枪"],
      [/，以刻为单位/g, "（1 刻 = 0.05 秒）"],
      [/渲染距离、分辨率、云、图形品质/g, "分辨率、光影、帧率"],
      [/区块/g, "段"],
    ],
    potWords = (t) => Q.reduce((t, [e, a]) => t.replace(e, a), String(t || "")),
    J = {
      video: "VIDEO",
      controls: "CONTROLS",
      mouse: "MOUSE",
      touch: "TOUCH",
      sound: "SOUND",
      access: "ACCESS",
      cos: "LOOK",
    };
  class PotatoOptions extends MenuScreen {
    constructor(t, e, a, o) {
      (super(t, null),
        (this.potato = !0),
        (this.parent = e),
        (this.ttl = a || "设置"),
        (this.page = o),
        (this.pauses = "play" === t.state),
        (this.blurBg = !0),
        (this.el = null),
        (this.L = Object.create(OptionsListScreen.prototype)),
        Object.assign(this.L, { game: t, parent: e, title: this.ttl, page: o, widgets: [] }));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      this.game;
      ensureCss();
      const t = (this.opts = (this.L.options() || []).filter(
          (t) => !K.some((e) => e.test(lab(t.label))),
        )),
        e = (this.el = document.createElement("div"));
      ((e.id = "lobby"),
        (e.className = "pz op"),
        (e.innerHTML = `<div class="pz-wrap op-wrap">\n        <div class="pz-head">${blockText(J[this.page] || "SETTINGS")}<span>${esc(this.ttl)}</span></div>\n        <div class="op-body"><div class="op-grid">${t.map((t, e) => (t.slider ? `<div class="op-sl ${!1 !== t.wide ? "wide" : ""}" style="--i:${e}" data-i="${e}"><span class="t"></span><input type="range" min="0" max="1000" value="${Math.round(1e3 * (t.value || 0))}">${t.tip ? `<small>${esc(potWords(t.tip[0]))}</small>` : ""}</div>` : `<button class="op-btn ${t.wide ? "wide" : ""}" style="--i:${e}" data-i="${e}" ${!1 === t.enabled ? "disabled" : ""} ${t.tip ? `title="${esc(potWords(t.tip.join("\n")))}"` : ""}><span class="t"></span>${t.tip ? `<small>${esc(potWords(t.tip[0]))}</small>` : ""}</button>`)).join("")}</div></div>\n        <div class="op-foot"><button class="op-btn op-go" data-a="done">完成</button></div></div>`),
        host().appendChild(e),
        this.relabel(),
        e.addEventListener("click", (e) => {
          if (e.target.closest('[data-a="done"]')) return void this.done();
          const a = e.target.closest("button.op-btn[data-i]");
          if (!a) return;
          const o = t[+a.dataset.i];
          o && o.onClick && !1 !== o.enabled && (o.onClick(), this.el && this.relabel());
        }),
        e.addEventListener("input", (e) => {
          const a = e.target.closest(".op-sl");
          if (!a) return;
          const o = t[+a.dataset.i];
          o &&
            o.onChange &&
            ((o.value = +e.target.value / 1e3), o.onChange(o.value), this.relabel());
        }));
    }
    relabel() {
      this.el &&
        this.el.querySelectorAll("[data-i]").forEach((t) => {
          const e = this.opts[+t.dataset.i],
            a = t.querySelector(".t");
          e && a && (a.textContent = potWords(lab(e.label)));
        });
    }
    done() {
      (this.game.saveSettings(), backTo(this.game, this.parent));
    }
    onEsc() {
      this.done();
    }
    close() {
      this.el && (unmount(this.el), (this.el = null));
    }
    draw(t) {
      t.menuBackground();
    }
    mouseDown() {}
  }
  class PotatoKeys extends MenuScreen {
    constructor(t, e) {
      (super(t, null),
        (this.potato = !0),
        (this.parent = e),
        (this.pauses = "play" === t.state),
        (this.blurBg = !0),
        (this.sel = null),
        (this.el = null));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      const t = this.game,
        e = t.settings;
      (e.keys || (e.keys = {}), ensureCss());
      let a = "",
        o = 0;
      for (const [t, e] of KEYBIND_CATS) {
        a += `<div class="cat" style="--i:${o++}">${esc(t)}</div>`;
        for (const [t] of e)
          ("companion" !== t || ("undefined" != typeof Companion && Companion.shown)) &&
            (a += `<div class="kb-row wide" style="--i:${o++}"><span>${esc(KEY_CN[t])}</span><button class="k" data-k="${t}"></button><button class="r" data-r="${t}">重置</button></div>`);
      }
      const s = (this.el = document.createElement("div"));
      ((s.id = "lobby"),
        (s.className = "pz op"),
        (s.innerHTML = `<div class="pz-wrap op-wrap"><div class="pz-head">${blockText("KEYS")}<span>按键绑定 · 点按键后按下新的键（Esc 清空）</span></div>\n        <div class="op-body"><div class="op-grid">${a}</div></div>\n        <div class="op-foot"><button class="op-btn op-dark" data-a="reset">重置按键</button><button class="op-btn op-go" data-a="done">完成</button></div></div>`),
        host().appendChild(s),
        this.refresh(),
        s.addEventListener("click", (a) => {
          const o = a.target,
            s = o.closest("[data-a]"),
            i = o.closest("[data-k]"),
            l = o.closest("[data-r]");
          return s && "done" === s.dataset.a
            ? this.back()
            : s && "reset" === s.dataset.a
              ? ((e.keys = {}), (this.sel = null), t.saveSettings(), this.refresh())
              : i
                ? ((this.sel = i.dataset.k), (this.selAt = performance.now()), this.refresh())
                : void (l && (delete e.keys[l.dataset.r], t.saveSettings(), this.refresh()));
        }),
        (this.onDown = (t) => {
          this.sel &&
            performance.now() - this.selAt > 200 &&
            (t.preventDefault(), t.stopPropagation(), this.bind("Mouse" + t.button));
        }),
        addEventListener("pointerdown", this.onDown, !0));
    }
    refresh() {
      const t = this.game;
      this.el &&
        (this.el.querySelectorAll("[data-k]").forEach((e) => {
          const a = e.dataset.k,
            o = keyOf(t, a),
            s = !!o && bindingsFor(t, o).length > 1;
          ((e.textContent = this.sel === a ? "按下新的键…" : keyLabel(o)),
            e.classList.toggle("wait", this.sel === a),
            e.classList.toggle("dup", s && this.sel !== a),
            (e.title = s
              ? "这个键也用于：" +
                bindingsFor(t, o)
                  .filter((t) => t !== a)
                  .map((t) => KEY_CN[t])
                  .join("、")
              : ""));
        }),
        this.el.querySelectorAll("[data-r]").forEach((e) => {
          e.disabled = keyOf(t, e.dataset.r) === KEY_DEFAULT[e.dataset.r];
        }));
    }
    bind(t) {
      const e = this.game;
      ((e.settings.keys[this.sel] = t), (this.sel = null), e.saveSettings(), this.refresh());
    }
    key(t, e) {
      return this.sel
        ? (this.bind("Escape" === e.code ? "" : e.code), !0)
        : "Escape" === e.key && (this.back(), !0);
    }
    mouseDown(t, e, a, o) {
      this.sel && performance.now() - this.selAt > 200 && this.bind("Mouse" + o);
    }
    back() {
      (this.game.saveSettings(), backTo(this.game, this.parent));
    }
    onEsc() {
      this.back();
    }
    close() {
      (removeEventListener("pointerdown", this.onDown, !0),
        this.el && (unmount(this.el), (this.el = null)));
    }
    draw(t) {
      t.menuBackground();
    }
  }
  class PotatoHub extends MenuScreen {
    constructor(t, e) {
      (super(t, null),
        (this.potato = !0),
        (this.parent = e),
        (this.pauses = "play" === t.state),
        (this.blurBg = !0),
        (this.el = null));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      const t = this.game,
        e = t.settings;
      ensureCss();
      const a = (this.el = document.createElement("div"));
      ((a.id = "lobby"),
        (a.className = "pz"),
        (a.innerHTML = `<div class="pz-wrap">\n        <div class="pz-head">${blockText("SETTINGS")}<span>设置</span></div>\n        <div class="row2">${item("", "01", "VIDEO", "#2EA6F0", "视频设置", "画质 · 光影 · 帧率", "video")}${item("", "02", "CONTROLS", "#19C79A", "操作与键位", "灵敏度 · 按键 · 触控", "controls")}</div>\n        <div class="row2">${item("", "03", "SOUND", "#8F6BF2", "声音", "音量 · 字幕", "sound")}${item("", "04", "ACCESS", "#FFB020", "辅助功能", "视场角效果", "access")}</div>\n        <div class="sh"><div class="blk cut pz-fov"><span class="lbl">视场角</span><input type="range" min="30" max="110" step="1" value="${Math.round(e.fov)}"><b class="v">${Math.round(e.fov)}</b></div></div>\n        <div class="itw sh"><div class="blk cut it pz-go" data-a="done"><div class="tag"><i></i>${blockText("OK", { cls: "num" })}${blockText("DONE")}</div><div class="ttl">完成</div>${blockText(">", { cls: "arr" })}</div></div>\n      </div>`),
        host().appendChild(a),
        a.addEventListener("click", (t) => {
          const e = t.target.closest("[data-a]");
          e && this.act(e.dataset.a);
        }));
      const o = a.querySelector("input"),
        s = a.querySelector(".pz-fov .v");
      (o.addEventListener("input", () => {
        ((e.fov = +o.value), (s.textContent = o.value));
      }),
        o.addEventListener("change", () => t.saveSettings()));
    }
    act(t) {
      const e = this.game,
        a = { video: "视频设置", controls: "操作与键位", sound: "声音", access: "辅助功能" };
      a[t]
        ? e.ui.open(new PotatoOptions(e, (() => new PotatoHub(e, this.parent))(), a[t], t))
        : "done" === t && (e.saveSettings(), backTo(e, this.parent));
    }
    onEsc() {
      this.act("done");
    }
    close() {
      this.el && (unmount(this.el), (this.el = null));
    }
    draw(t) {
      t.menuBackground();
    }
    mouseDown() {}
  }
  ((self.PotatoOptions = PotatoOptions),
    (self.PotatoKeys = PotatoKeys),
    (self.PotatoHub = PotatoHub));
  const optList = (t, e) => {
      const a = Object.create(OptionsListScreen.prototype);
      Object.assign(a, { game: t, parent: null, title: "", page: e, widgets: [] });
      try {
        return a.options() || [];
      } catch (t) {
        return [];
      }
    },
    tt = [
      [/^视角摇晃/, "镜头晃动"],
      [/^潜行/, "蹲"],
      [/^疾跑/, "冲刺"],
      [/^摇杆推满疾跑/, "摇杆推满冲刺"],
      [/^离散滚动/, "滚轮逐格换枪"],
      [/^触屏操作/, "触屏操作"],
      [/^鼠标灵敏度/, "鼠标灵敏度"],
      [/^视场角效果/, "受击 / 冲刺时视野变化"],
    ],
    touchIsOn = (t) => !!(t.ui && t.ui.touch && t.ui.touch.on && t.ui.touch.on()),
    setDevice = (t, e) => {
      const a = t.settings;
      ("phone" === e ? (a.touch = !0) : delete a.touch,
        (a.touchPick = e),
        (a.potDevice = e),
        (t.touchAuto = void 0),
        t.saveSettings(),
        t.applySettings && t.applySettings());
      try {
        t.ui && t.ui.touch && t.ui.touch.reset && t.ui.touch.reset();
      } catch (t) {}
    };
  ((self.Potato.setDevice = setDevice),
    addEventListener(
      "pointerdown",
      (t) => {
        const e = "undefined" != typeof game ? game : null;
        if (
          self.POTATO &&
          e &&
          e.settings &&
          "mouse" === t.pointerType &&
          !((0 | navigator.maxTouchPoints) > 0) &&
          touchIsOn(e)
        ) {
          setDevice(e, "pc");
          try {
            e.ui.message &&
              e.ui.message("这台电脑没有触屏：已换回电脑操控（键盘 + 鼠标）", "#7CFFB2");
          } catch (t) {}
        }
      },
      !0,
    ));
  const deviceRow = (t) => ({
      label: () => "操控方式：" + (touchIsOn(t) ? "手机触屏" : "电脑键鼠"),
      tip: ["手机触屏：屏幕上的虚拟按键；电脑键鼠：键盘 + 鼠标。选错了点这里换"],
      onClick: () => setDevice(t, touchIsOn(t) ? "pc" : "phone"),
    }),
    et = [
      ["general", "常规", "GENERAL"],
      ["touch", "触屏", "TOUCH"],
      ["controls", "操作", "CONTROLS"],
      ["cross", "准星", "CROSSHAIR"],
      ["video", "画面", "VIDEO"],
      ["sound", "声音", "AUDIO"],
      ["account", "账号", "ACCOUNT"],
    ],
    ot = [
      [
        "2",
        "二指",
        "双拇指：左摇杆，右边开火（按住可转视角）",
        [
          [18, 70, 10],
          [82, 70, 12],
        ],
      ],
      [
        "3",
        "三指",
        "加左上开火键：左手食指开火，右拇指瞄准",
        [
          [18, 70, 10],
          [82, 70, 12],
          [16, 32, 8],
        ],
      ],
      [
        "4",
        "四指",
        "再把跳和蹲移到右上：右手食指跳蹲",
        [
          [18, 70, 10],
          [82, 70, 12],
          [16, 32, 8],
          [86, 30, 6],
          [72, 34, 6],
        ],
      ],
    ],
    tpPic = (t) =>
      `<svg viewBox="0 0 100 60"><rect x="2" y="2" width="96" height="56" rx="8" fill="#1B1E25" stroke="#F2EFE9" stroke-width="2.5"/>${t.map(([t, e, a], o) => `<circle cx="${t}" cy="${0.6 * e}" r="${0.6 * a}" fill="${o >= 2 ? "#FF6A1A" : "rgba(242,239,233,.25)"}" stroke="#F2EFE9" stroke-width="1.6"/>`).join("")}</svg>`;
  class PotatoSettings extends MenuScreen {
    constructor(t, e, a) {
      (super(t, null),
        (this.potato = !0),
        (this.parent = e),
        (this.pauses = "play" === t.state),
        (this.blurBg = !0),
        (this.el = null),
        (this.rows = []));
      const o = !!(t.ui && t.ui.touch && t.ui.touch.on && t.ui.touch.on());
      this.tab =
        "keys" === a
          ? "controls"
          : "controls" === a && o
            ? "touch"
            : a || (o ? "touch" : "general");
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      const t = this.game;
      (ensureCss(),
        (() => {
          if (!document.getElementById("st-css2")) {
            const t = document.createElement("style");
            ((t.id = "st-css2"),
              (t.textContent =
                "\n  #lobby .st-tp { display: grid; grid-template-columns: repeat(3, 1fr); gap: calc(var(--u) * .8); margin: calc(var(--u) * .4) 0 calc(var(--u) * .8); }\n  #lobby .st-tpc { font: inherit; text-align: left; cursor: pointer; background: #23262E; color: var(--paper); border: calc(var(--u) * .2) solid #3A3F49; padding: calc(var(--u) * .7); display: flex; flex-direction: column; gap: calc(var(--u) * .3); transition: transform .12s ease, border-color .12s ease; }\n  #lobby .st-tpc svg { width: 100%; height: auto; display: block; }\n  #lobby .st-tpc b { font-size: calc(var(--u) * 1.5); font-weight: 900; } #lobby .st-tpc small { color: #A9A59C; font-weight: 700; font-size: calc(var(--u) * .85); line-height: 1.35; }\n  #lobby .st-tpc:hover { transform: translateY(calc(var(--u) * -.2)); } #lobby .st-tpc.on { border-color: var(--or); box-shadow: calc(var(--u) * .35) calc(var(--u) * .35) 0 var(--or); } #lobby .st-tpc.on b { color: var(--or); }\n  #lobby .st-nav button.hot::after { content: ''; display: inline-block; width: calc(var(--u) * .55); height: calc(var(--u) * .55); border-radius: 50%; background: var(--or); margin-left: calc(var(--u) * .4); vertical-align: middle; }\n  #lobby .st-row.big { background: rgba(255,106,26,.12); border-left: calc(var(--u) * .3) solid var(--or); } #lobby .st-row.big b { color: var(--paper); }"),
              document.head.appendChild(t));
          }
          if (!document.getElementById("st-css")) {
            const t = document.createElement("style");
            ((t.id = "st-css"),
              (t.textContent =
                "\n  #lobby.st .rk-wrap { width: auto; right: calc(var(--u) * 3.5); }\n  #lobby.st .rk-dim { background: rgba(10,11,14,.9); }\n  #lobby .st-body { display: grid; grid-template-columns: calc(var(--u) * 15) 1fr; gap: calc(var(--u) * 1.2); flex: 1; min-height: 0; }\n  #lobby .st-nav { display: flex; flex-direction: column; gap: calc(var(--u) * .3); pointer-events: auto; }\n  #lobby .st-nav button { font: inherit; text-align: left; font-weight: 800; font-size: calc(var(--u) * 1.3); padding: calc(var(--u) * .8) calc(var(--u) * 1.2); border: 0; border-left: calc(var(--u) * .35) solid transparent;\n    background: transparent; color: #A9A59C; cursor: pointer; transition: background .15s ease, color .15s ease; display: flex; justify-content: space-between; align-items: baseline; }\n  #lobby .st-nav button small { font-size: calc(var(--u) * .75); letter-spacing: .14em; opacity: .7; }\n  #lobby .st-nav button:hover { background: rgba(242,239,233,.05); color: #F2EFE9; }\n  #lobby .st-nav button.on { background: rgba(242,239,233,.08); color: #fff; border-left-color: var(--or); }\n  #lobby .st-pan { border: 1px solid rgba(242,239,233,.14); background: rgba(242,239,233,.03); overflow-y: auto; overscroll-behavior: contain; pointer-events: auto; padding: calc(var(--u) * .6) calc(var(--u) * 1.6); }\n  #lobby .st-sec { font-size: calc(var(--u) * .9); color: var(--or); font-weight: 900; letter-spacing: .14em; margin: calc(var(--u) * 1.2) 0 calc(var(--u) * .3); }\n  #lobby .st-row { display: grid; grid-template-columns: 1fr calc(var(--u) * 24); align-items: center; gap: calc(var(--u) * 1); min-height: calc(var(--u) * 3.6); border-bottom: 1px solid rgba(242,239,233,.08); animation: lbUp .3s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(var(--i, 0) * 18ms); }\n  #lobby .st-row > span b { display: block; font-size: calc(var(--u) * 1.25); font-weight: 800; } #lobby .st-row > span small { display: block; font-size: calc(var(--u) * .85); color: #8A877F; font-weight: 700; }\n  #lobby .st-row button { font: inherit; font-weight: 800; font-size: calc(var(--u) * 1.15); padding: calc(var(--u) * .55) calc(var(--u) * 1); border: 1px solid rgba(242,239,233,.2); background: rgba(242,239,233,.06); color: #F2EFE9; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: calc(var(--u) * 1); }\n  #lobby .st-row button:hover { border-color: var(--or); } #lobby .st-row button em { font-style: normal; color: #8A877F; }\n  #lobby .st-row button[disabled] { opacity: .4; cursor: default; }\n  #lobby .st-row .sl { display: grid; grid-template-columns: 1fr calc(var(--u) * 5.5); align-items: center; gap: calc(var(--u) * .8); }\n  #lobby .st-row .sl b { text-align: right; font-size: calc(var(--u) * 1.15); font-weight: 900; }\n  #lobby .st-row input[type=range] { width: 100%; accent-color: var(--or); }\n  #lobby .st-cross { display: flex; align-items: center; justify-content: center; height: calc(var(--u) * 11); margin: calc(var(--u) * .8) 0; background: repeating-conic-gradient(#3A3F48 0 25%, #4A505A 0 50%) 0 0 / calc(var(--u) * 2.4) calc(var(--u) * 2.4); border: 1px solid rgba(242,239,233,.14); }\n  #lobby .st-cross canvas { position: static; width: calc(var(--u) * 10); height: calc(var(--u) * 10); image-rendering: pixelated; }   /* (static: the page's own canvas rule made it absolute - it sat over the title, the user 11-19 「准星位置不对」) */\n  #lobby .st-foot { display: flex; gap: calc(var(--u) * 1); }"),
              document.head.appendChild(t));
          }
        })());
      const e = (this.el = document.createElement("div"));
      ((e.id = "lobby"),
        (e.className = "rk st"),
        (e.innerHTML = `<div class="rk-dim"></div><div class="rk-wrap">\n        <div class="rk-head"><div class="rk-title">${blockText("SETTINGS")}</div><div class="rk-sub"><b>设置</b><span>改动立即生效</span></div></div>\n        <div class="st-body"><div class="st-nav">${et.map(([e, a, o]) => `<button data-tab="${e}" class="${"touch" === e && t.ui.touch && t.ui.touch.on && t.ui.touch.on() ? "hot" : ""}">${a}<small>${o}</small></button>`).join("")}</div><div class="st-pan"></div></div>\n        <div class="rk-foot st-foot"><button class="rk-back" data-a="done">${blockText("<")}<span>完成</span></button></div>\n      </div>`),
        host().appendChild(e),
        e.addEventListener("click", (e) => {
          const a = e.target.closest("[data-tab]");
          if (a) return ((this.tab = a.dataset.tab), void this.fill());
          const o = e.target.closest("[data-tp]");
          if (o) {
            const e = t.settings;
            return (
              (e.potTouchPreset = o.dataset.tp),
              (e.touchLayout = {}),
              (e.touchScale = {}),
              t.saveSettings(),
              t.ui.touch && (t.ui.touch.L = null),
              void this.fill()
            );
          }
          const gm = e.target.closest("[data-gm]");
          if (gm) {
            const r = this.rows[+gm.dataset.r];
            return (
              r && r.onSeg && !1 !== r.enabled && r.onSeg(+gm.dataset.gm),
              void (this.el && this.fill())
            );
          }
          const s = e.target.closest("[data-a]");
          if (s && "done" === s.dataset.a) return void this.done();
          const i = e.target.closest("button[data-r]");
          if (i) {
            const t = this.rows[+i.dataset.r];
            t && t.onClick && !1 !== t.enabled && (t.onClick(), this.el && this.relabel());
          }
        }),
        e.addEventListener("input", (t) => {
          const e = t.target.closest("[data-r]");
          if (!e) return;
          const a = this.rows[+e.dataset.r];
          a &&
            a.onChange &&
            ((a.value = +t.target.value / 1e3), a.onChange(a.value), this.relabel());
        }),
        this.fill());
    }
    build() {
      const t = this.game,
        e = t.settings,
        a = self.XZ,
        o = [],
        pick = (e, ...a) => {
          const s = optList(t, e);
          for (const t of a) {
            const e = s.find((e) => String(lab(e.label)).startsWith(t));
            e && o.push(e);
          }
        },
        sec = (t) => o.push({ sec: t }),
        s = !!(t.ui && t.ui.touch && t.ui.touch.on && t.ui.touch.on()),
        pickAs = (e, a, s) => {
          const i = optList(t, e).find((t) => String(lab(t.label)).startsWith(a));
          i && o.push(Object.assign({}, i, { label: () => String(lab(i.label)).replace(a, s) }));
        };
      if ("general" === this.tab) {
        if ((sec("显示"), pick("video", "界面尺寸", "全屏"), sec("对局"), a)) {
          const e = a.set(t);
          o.push(
            {
              label: () => "击杀提示：" + (e.kills ? "开" : "关"),
              onClick: () => {
                e.kills = !e.kills;
              },
            },
            {
              label: () => "命中标记：" + (e.marks ? "开" : "关"),
              onClick: () => {
                e.marks = !e.marks;
              },
            },
          );
        }
        o.push({
          label: () => "显示帧率和延迟：" + (e.potatoNet ? "开" : "关"),
          onClick: () => {
            e.potatoNet = !e.potatoNet;
          },
        });
      } else if ("touch" === this.tab) {
        const a = e.potTouchPreset || "2";
        (o.push({
          html: `<div class="st-sec">键位方案</div><div class="st-tp">${ot.map(([t, e, o, s]) => `<button class="st-tpc ${a === t ? "on" : ""}" data-tp="${t}">${tpPic(s)}<b>${e}</b><small>${esc(o)}</small></button>`).join("")}</div>`,
        }),
          o.push({
            label: "自定义按键（拖动位置、调大小）",
            big: !0,
            onClick: () =>
              t.ui.open(new TouchLayoutScreen(t, new PotatoSettings(t, this.parent, "touch"))),
          }),
          sec("灵敏度"),
          pick("touch", "视角灵敏度"),
          // W5b 陀螺仪（GDD-05 §2）：桌面端/无传感器整组隐藏；对战类对局中锁定（§6.2，判定对齐黑市平板惯例 matchOn）
          self.Gyro &&
            Gyro.groupVisible(t) &&
            (() => {
              const gyLock = Gyro.matchLocked(t),
                gyRe = () => this.fill();
              (sec("陀螺仪" + (gyLock ? "（对局中锁定）" : "")),
                o.push(
                  {
                    seg: !0,
                    label: () => "陀螺仪档位",
                    options: [
                      [0, "关闭"],
                      [1, "开镜开启"],
                      [2, "总是开启"],
                    ],
                    get: () => Gyro.getMode(t),
                    onSeg: (v) => Gyro.uiPickMode(t, v, gyRe),
                    enabled: !gyLock,
                  },
                  {
                    slider: !0,
                    value: (Gyro.getSens(t, "base") - 10) / 290,
                    label: () => "基础灵敏度：" + Gyro.getSens(t, "base") + "%",
                    onChange: (v) => Gyro.setSens(t, "base", v),
                    enabled: !gyLock && 0 !== Gyro.getMode(t),
                  },
                  {
                    slider: !0,
                    value: (Gyro.getSens(t, "ads") - 10) / 290,
                    label: () => "开镜灵敏度：" + Gyro.getSens(t, "ads") + "%",
                    onChange: (v) => Gyro.setSens(t, "ads", v),
                    enabled: !gyLock && 0 !== Gyro.getMode(t),
                  },
                ),
                o.push({
                  html: '<div class="gy-note"><small>开镜开启：仅开镜时生效；总是开启：全程生效（需设备支持）</small></div>',
                }),
                // W9 真机诊断：轴向反转自查开关（存储 gyroFlip 位掩码，随 potato-settings 持久化）
                o.push(
                  {
                    label: () => "陀螺仪左右反转：" + (Gyro.getFlip(t) & 1 ? "开" : "关"),
                    onClick: () => Gyro.toggleFlip(t, 1),
                    enabled: !gyLock,
                  },
                  {
                    label: () => "陀螺仪上下反转：" + (Gyro.getFlip(t) & 2 ? "开" : "关"),
                    onClick: () => Gyro.toggleFlip(t, 2),
                    enabled: !gyLock,
                  },
                ),
                o.push({
                  label: "恢复默认",
                  onClick: () => Gyro.resetDefaults(t, gyRe),
                }));
            })(),
          sec("按钮"),
          o.push(deviceRow(t)),
          pick("touch", "按钮大小", "按钮不透明度", "动态摇杆"),
          sec("其他"),
          pick("touch", "震动", "竖着拿手机时旋转画面"));
      } else if ("controls" === this.tab)
        (sec("操控方式"),
          o.push(deviceRow(t)),
          sec("鼠标"),
          o.push({
            slider: !0,
            value: (e.fov - 30) / 80,
            label: () => "视场角：" + Math.round(e.fov),
            onChange: (t) => {
              e.fov = Math.round(30 + 80 * t);
            },
          }),
          pick("mouse", "鼠标灵敏度", "反转鼠标Y轴", "原始输入"),
          pick("xzguns", "开镜方式"),
          pickAs("controls", "潜行", "下蹲"),
          sec("键位"),
          o.push({
            label: "编辑按键…",
            big: !0,
            onClick: () =>
              t.ui.open(new PotatoKeys(t, new PotatoSettings(t, this.parent, "controls"))),
          }));
      else if ("cross" === this.tab && a) {
        const e = a.set(t),
          num = (t, a, s, i, l = (t) => t) =>
            o.push({
              slider: !0,
              value: (e[t] - s) / (i - s),
              label: () => a + "：" + l(e[t]),
              onChange: (a) => {
                ((e[t] = Math.round(s + a * (i - s))), this.preview());
              },
            });
        (o.push({ html: '<div class="st-cross"><canvas width="64" height="64"></canvas></div>' }),
          sec("样式"),
          o.push({
            label: () => "形状：" + a.CROSS[e.cross],
            onClick: () => {
              ((e.cross = (e.cross + 1) % a.CROSS.length), this.preview());
            },
          }),
          o.push({
            label: () => "颜色：" + a.COLORS[e.color][0],
            onClick: () => {
              ((e.color = (e.color + 1) % (a.COLORS.length - 1)), this.preview());
            },
          }),
          num("alpha", "不透明度", 10, 100, (t) => t + "%"),
          num("size", "线长", 0, 64),
          num("thick", "粗细", 1, 16),
          num("gap", "间距", 0, 48),
          o.push({
            label: () => "中心点：" + (e.dot ? "开" : "关"),
            onClick: () => {
              ((e.dot = !e.dot), this.preview());
            },
          }),
          num("dotSize", "中心点大小", 1, 16),
          o.push({
            label: () => "描边：" + (e.outline ? "开" : "关"),
            onClick: () => {
              ((e.outline = !e.outline), this.preview());
            },
          }),
          o.push({
            label: () => "开枪时张开：" + (e.dyn ? "开" : "关"),
            onClick: () => {
              e.dyn = !e.dyn;
            },
          }),
          sec("分享"),
          o.push({
            label: "复制准星代码",
            onClick: () => {
              const t = a.crossCode(e);
              try {
                navigator.clipboard.writeText(t);
              } catch (t) {}
              try {
                window.prompt("准星代码（复制下面这串）", t);
              } catch (t) {}
            },
          }),
          o.push({
            label: "粘贴准星代码",
            onClick: () => {
              let t = null;
              try {
                t = window.prompt("粘贴准星代码（XZ1- 开头）", "");
              } catch (t) {}
              const o = t && a.crossFromCode(t);
              o && (Object.assign(e, o), this.fill());
            },
          }),
          o.push({
            label: "恢复默认准星",
            onClick: () => {
              for (const t of [
                "cross",
                "color",
                "r",
                "g",
                "b",
                "alpha",
                "size",
                "thick",
                "gap",
                "dot",
                "dotSize",
                "outline",
                "outW",
                "dyn",
              ])
                e[t] = a.CROSS_DEF[t];
              this.fill();
            },
          }));
      } else if ("video" === this.tab)
        (sec("画质"),
          pick("video", "画质预设", "自动画质", "光影", "渲染分辨率", "动态分辨率"),
          self.PotatoQuality &&
            o.push({
              label: "重新检测画质（在竞技场里测一遍）",
              big: !0,
              onClick: () =>
                self.PotatoQuality.run(t, () =>
                  t.ui.open(new PotatoSettings(t, this.parent, "video")),
                ),
            }),
          sec("帧率"),
          pick("video", "最大帧率", "垂直同步"),
          s && pick("touch", "帧率上限"),
          sec("画面"),
          pick("video", "亮度"),
          pickAs("video", "视角摇晃", "镜头晃动"));
      else if ("sound" === this.tab)
        (sec("音量"),
          pick("sound", "主音量"),
          o.push({
            label: () => "大厅音乐：" + (!1 === e.potMusic ? "关" : "开"),
            onClick: () => {
              e.potMusic = !1 === e.potMusic;
            },
          }));
      else if ("account" === this.tab) {
        const e = "undefined" != typeof Account && Account.loggedIn;
        (sec("账号"),
          o.push({
            label: e ? "账号与个人识别码…" : "登录…",
            onClick: () =>
              t.ui.open(
                e && "undefined" != typeof AccountScreen
                  ? new AccountScreen(t, new PotatoSettings(t, this.parent, "account"))
                  : new LoginScreen(t, () =>
                      t.ui.open(new PotatoSettings(t, this.parent, "account")),
                    ),
              ),
          }),
          sec("其他"),
          o.push({
            label: "反馈问题…",
            onClick: () =>
              t.ui.open(new FeedbackScreen(t, new PotatoSettings(t, this.parent, "account"), null)),
          }),
          "undefined" != typeof AgreementScreen &&
            o.push({
              label: "用户协议",
              onClick: () => {
                t.ui.open(
                  new AgreementScreen(
                    t,
                    () => t.ui.open(new PotatoSettings(t, this.parent, "account")),
                    !0,
                  ),
                );
              },
            }),
          o.push({
            html: '<div class="st-row"><span><b>土豆史诗</b><small>独立制作 · 永久免费 · 仅在 B站 Toy 平台发布</small></span><span></span></div>',
          }));
      }
      return o;
    }
    fill() {
      const t = this.el;
      if (!t) return;
      t.querySelectorAll("[data-tab]").forEach((t) =>
        t.classList.toggle("on", t.dataset.tab === this.tab),
      );
      const e = (this.rows = this.build());
      let a = 0;
      ((t.querySelector(".st-pan").innerHTML = e
        .map((t, e) =>
          t.html
            ? t.html
            : t.sec
              ? `<div class="st-sec">${esc(t.sec)}</div>`
              : t.seg
                ? `<div class="st-row${!1 === t.enabled ? " gy-lock" : ""}" style="--i:${a++}" data-r="${e}"><span><b class="t"></b></span><div class="st-seg">${t.options.map((s) => `<button data-gm="${s[0]}" data-r="${e}" class="${t.get() === s[0] ? "on" : ""}" ${!1 === t.enabled ? "disabled" : ""}>${esc(s[1])}</button>`).join("")}</div></div>`
                : t.slider
                  ? `<div class="st-row" style="--i:${a++}" data-r="${e}"><span><b class="t"></b>${t.tip ? `<small>${esc(t.tip[0])}</small>` : ""}</span><div class="sl"><input type="range" min="0" max="1000" value="${Math.round(1e3 * (t.value || 0))}" ${!1 === t.enabled ? "disabled" : ""}><b class="v"></b></div></div>`
                  : `<div class="st-row${t.big ? " big" : ""}" style="--i:${a++}"><span><b class="t"></b>${t.tip ? `<small>${esc(t.tip[0])}</small>` : ""}</span><button data-r="${e}" ${!1 === t.enabled ? "disabled" : ""}><span class="v"></span><em>›</em></button></div>`,
        )
        .join("")),
        this.relabel(),
        this.preview());
    }
    relabel() {
      this.el &&
        this.el.querySelectorAll(".st-row").forEach((t) => {
          const e = t.querySelector("[data-r]") || t,
            a = this.rows[+(e.dataset.r ?? t.dataset.r)];
          if (!a || a.html) return;
          let o = String(lab(a.label));
          for (const [t, e] of tt) o = o.replace(t, e);
          const s = o.search(/[：:]/),
            i = s >= 0 ? o.slice(0, s) : o,
            l = s >= 0 ? o.slice(s + 1) : "",
            r = t.querySelector(".t"),
            d = t.querySelector(".v");
          (r && (r.textContent = i.replace(/…$/, "")),
            d && (d.textContent = l || (/…$/.test(o) ? "打开" : "执行")));
        });
    }
    preview() {
      const t = this.el && this.el.querySelector(".st-cross canvas"),
        e = self.XZ;
      if (!t || !e) return;
      const a = t.getContext("2d"),
        o = e.set(this.game);
      a.clearRect(0, 0, 64, 64);
      const s = e.crossColor(o),
        i = 0.75,
        l = 32,
        r = 32,
        d = o.size * i,
        u = Math.max(0.5, o.thick * i),
        b = o.gap * i;
      a.globalAlpha = o.alpha / 100;
      const bar = (t, e, i, l) => {
        (o.outline && ((a.fillStyle = "#000"), a.fillRect(t - 0.5, e - 0.5, i + 1, l + 1)),
          (a.fillStyle = s),
          a.fillRect(t, e, i, l));
      };
      if (
        (0 === o.cross || 1 === o.cross
          ? (0 === o.cross && bar(l - u / 2, r - b - d, u, d),
            bar(l - u / 2, r + b, u, d),
            bar(l - b - d, r - u / 2, d, u),
            bar(l + b, r - u / 2, d, u))
          : 2 === o.cross
            ? ((a.strokeStyle = s),
              (a.lineWidth = u),
              a.beginPath(),
              a.arc(l, r, b + d / 2, 0, 2 * Math.PI),
              a.stroke())
            : 4 === o.cross &&
              ((a.strokeStyle = s),
              (a.lineWidth = u),
              a.strokeRect(l - b - d / 2, r - b - d / 2, 2 * (b + d / 2), 2 * (b + d / 2))),
        o.dot || 3 === o.cross)
      ) {
        const t = Math.max(1, o.dotSize * i);
        bar(l - t / 2, r - t / 2, t, t);
      }
    }
    done() {
      (this.game.saveSettings(), backTo(this.game, this.parent));
    }
    onEsc() {
      this.done();
    }
    close() {
      this.el && (unmount(this.el), (this.el = null));
    }
    draw(t) {
      t.menuBackground();
    }
    mouseDown() {}
  }
  self.PotatoSettings = PotatoSettings;
  const gateOf = () => {
    const t = self.XZ && XZ.skins && XZ.skins.v,
      e = "undefined" != typeof Account && Account.gate;
    return (t && t.gate) || (e && e.potato) || "off";
  };
  self.Potato.needFor = (t) => ("triple" === gateOf() ? "both" : "follow");
  const pgFollow = () =>
      !(
        "undefined" == typeof Account ||
        !Account.data ||
        !(Account.data.super || (Account.data.unlocks && Account.data.unlocks.follow))
      ),
    pgTriple = () =>
      !(
        "undefined" == typeof Account ||
        !Account.data ||
        !(Account.data.super || (Account.data.unlocks && Account.data.unlocks.triple))
      ),
    pgDone = (t) =>
      "undefined" != typeof Account &&
      ("both" === t ? pgFollow() && pgTriple() : "triple" === t ? pgTriple() : pgFollow());
  self.Potato.allDone = () => pgDone(self.Potato.needFor("any"));
  class PotatoGet extends MenuScreen {
    constructor(t, e, a = {}) {
      (super(t, null),
        (this.potato = !0),
        (this.parent = e),
        (this.pauses = !1),
        (this.blurBg = !0),
        (this.el = null),
        (this.need = a.need || "follow"),
        (this.what = a.what || ""),
        (this.intro = !!a.intro),
        (this.then = a.then || null),
        (this.note = ""),
        (this.noteK = ""),
        (this.inToy = null),
        (this.went = null),
        (this.retries = 0),
        "undefined" != typeof Toy &&
          Toy.ready &&
          Toy.ready()
            .then((t) => {
              ((this.inToy = t), this.render());
            })
            .catch(() => {
              ((this.inToy = !1), this.render());
            }),
        "undefined" != typeof Account &&
          Account.loadGate &&
          Account.loadGate()
            .then(() => this.render())
            .catch(() => {}),
        (this.onBack = () => {
          "visible" === document.visibilityState &&
            this.went &&
            this.game.ui.screen === this &&
            ((this.went = null), (this.retries = 3), setTimeout(() => this.check(!0), 600));
        }),
        document.addEventListener("visibilitychange", this.onBack),
        window.addEventListener("focus", this.onBack));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      (ensureCss(),
        (() => {
          if (document.getElementById("pg-css")) return;
          const t = document.createElement("style");
          ((t.id = "pg-css"),
            (t.textContent =
              "\n  /* (#lobby lets touches through to the game by default - each layer takes them itself: this one's card never did, every button\n     pressed the canvas behind it, nothing answered and the lobby's 关注 + 三连 window couldn't be shut - 「那些按钮按不了」 11-20) */\n  #lobby.pg { background: rgba(10,12,18,.55); pointer-events: auto; }\n  #lobby .pg-card { pointer-events: auto; }\n  #lobby .pg-card { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: min(calc(var(--u) * 62), 92vw); background: var(--paper); border: calc(var(--u) * .3) solid #111; box-shadow: calc(var(--u) * .8) calc(var(--u) * .8) 0 #111; padding: calc(var(--u) * 1.8) calc(var(--u) * 2.2); animation: lbUp .4s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .pg-tag { display: inline-block; background: var(--or); color: #fff; font-weight: 900; font-size: max(11px, calc(var(--u) * 1)); padding: calc(var(--u) * .2) calc(var(--u) * .7); letter-spacing: .1em; }\n  #lobby .pg-title { font-size: max(18px, calc(var(--u) * 2.6)); font-weight: 900; margin-top: calc(var(--u) * .6); line-height: 1.15; }\n  #lobby .pg-title small { display: block; font-size: max(12px, calc(var(--u) * 1.1)); color: #6B675F; font-weight: 800; margin-top: calc(var(--u) * .4); }\n  #lobby .pg-gives { display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--u) * .6); margin-top: calc(var(--u) * 1.2); }\n  #lobby .pg-gives div { background: #fff; border: calc(var(--u) * .2) solid #111; padding: calc(var(--u) * .6) calc(var(--u) * .8); font-weight: 900; font-size: max(12px, calc(var(--u) * 1.15)); display: flex; align-items: center; gap: calc(var(--u) * .6); }\n  #lobby .pg-gives div i { font-style: normal; width: calc(var(--u) * 1.8); height: calc(var(--u) * 1.8); min-width: 14px; min-height: 14px; background: var(--or); color: #fff; display: grid; place-items: center; font-size: max(10px, calc(var(--u) * .9)); }\n  #lobby .pg-gives div.me { border-color: var(--or); box-shadow: inset 0 0 0 calc(var(--u) * .15) var(--or); }\n  #lobby .pg-steps { margin-top: calc(var(--u) * 1.2); display: grid; gap: calc(var(--u) * .5); font-size: max(12px, calc(var(--u) * 1.1)); font-weight: 800; color: #333; }\n  #lobby .pg-steps b { display: inline-grid; place-items: center; width: calc(var(--u) * 1.7); height: calc(var(--u) * 1.7); min-width: 14px; min-height: 14px; background: #111; color: #fff; margin-right: calc(var(--u) * .6); font-size: max(10px, calc(var(--u) * .9)); }\n  #lobby .pg-steps .ok b { background: #1E9E57; }\n  #lobby .pg-btns { display: flex; gap: calc(var(--u) * .8); margin-top: calc(var(--u) * 1.5); flex-wrap: wrap; }\n  #lobby .pg-b { font: inherit; font-weight: 900; font-size: max(13px, calc(var(--u) * 1.3)); padding: calc(var(--u) * .8) calc(var(--u) * 1.6); border: calc(var(--u) * .25) solid #111; background: #fff; color: #111; cursor: pointer; }\n  #lobby .pg-b.go { background: var(--or); color: #fff; flex: 1; }\n  #lobby .pg-b:disabled { opacity: .45; cursor: default; }\n  #lobby .pg-note { margin-top: calc(var(--u) * 1); min-height: 1.3em; font-weight: 800; font-size: max(12px, calc(var(--u) * 1.05)); color: #6B675F; }\n  #lobby .pg-note.bad { color: #D0402A; } #lobby .pg-note.good { color: #1E9E57; }"),
            document.head.appendChild(t));
        })());
      const t = (this.el = document.createElement("div"));
      ((t.id = "lobby"),
        (t.className = "pg"),
        host().appendChild(t),
        t.addEventListener("click", (t) => {
          const e = t.target.closest("[data-a]");
          if (!e || e.disabled) return;
          const a = e.dataset.a,
            o = this.game;
          "go" === a
            ? this.go()
            : "check" === a
              ? this.check(!1)
              : "login" === a
                ? o.ui.open(
                    new LoginScreen(
                      o,
                      () =>
                        o.ui.open(
                          new PotatoGet(o, this.parent, {
                            need: this.need,
                            what: this.what,
                            intro: this.intro,
                            then: this.then,
                          }),
                        ),
                      () => this.leave(),
                    ),
                  )
                : ("later" !== a && "back" !== a) || this.leave();
        }),
        this.render());
    }
    leave() {
      const t = this.game;
      if (this.then) {
        const t = this.then;
        ((this.then = null), t());
      } else t.ui.open(this.parent || new LobbyScreen(t));
    }
    say(t, e) {
      ((this.note = t), (this.noteK = e || ""), this.render());
    }
    render() {
      const t = this.el;
      if (!t) return;
      const e = "undefined" != typeof Account && Account.loggedIn,
        a = e && pgDone(this.need),
        o = "both" === this.need,
        s = "triple" === this.need || (o && e && pgFollow()),
        i = !1 !== this.inToy,
        l = e && pgFollow(),
        r = e && pgTriple(),
        d = o
          ? this.intro
            ? "关注 + 三连，全部免费解锁"
            : "关注 + 三连就能获得"
          : this.intro
            ? "关注 UP 主，免费获得这些"
            : s
              ? "给新视频三连就能获得"
              : "关注 UP 主就能获得",
        u = ((t) => {
          const e = gateOf();
          if ("both" === t)
            return [
              ["排", "天梯排位（1V1 · 2V2 · 淘汰赛）"],
              ["枪", "薯核 CORE 8 把特效枪皮"],
              ["刀", "折叠刀 · 爪刀 · 战斧 · 飞镖"],
              ["披", "全部动态 / 静态披风"],
            ];
          if ("triple" === t)
            return [
              ["枪", "薯核 CORE 8 把特效枪皮"],
              ["刀", "折叠刀 · 爪刀 · 战斧 · 飞镖"],
            ];
          const a = [];
          return (
            "follow" === e &&
              a.push(["枪", "薯核 CORE 8 把特效枪皮"], ["刀", "折叠刀 · 爪刀 · 战斧 · 飞镖"]),
            a.push(["披", "全部动态 / 静态披风"]),
            "off" !== e && a.push(["排", "天梯排位（1V1 · 2V2 · 淘汰赛）"]),
            a
          );
        })(this.need),
        b = this.what,
        h = o
          ? `<div class="${l ? "ok" : ""}"><b>${l ? "✓" : "1"}</b>关注 UP 主「土豆味小哲」（在 B站 App 里）</div><div class="${r ? "ok" : ""}"><b>${r ? "✓" : "2"}</b>给新视频三连：点赞 + 投币 + 收藏（在 B站 App 里，同一个视频）</div><div class="${a ? "ok" : ""}"><b>${a ? "✓" : "3"}</b>回到游戏自动检查，马上全部解锁</div>`
          : `<div class="${a ? "ok" : ""}"><b>${a ? "✓" : "1"}</b>${s && !o ? "点「去三连新视频」，给视频点赞、投币、收藏（同一个视频）" : "点「去关注 UP 主」，在 B站 App 里 UP 主「土豆味小哲」的空间点关注"}</div><div class="${a ? "ok" : ""}"><b>${a ? "✓" : "2"}</b>回到游戏点「检查」，马上就能用（回来时也会自动检查）</div>`;
      t.innerHTML = `<div class="pg-card"><span class="pg-tag">${this.intro ? (o ? "解锁全部" : "衣柜") : "去获取"}</span>\n        <div class="pg-title">${d}<small>${b ? "你想要的：" + esc(b) + " · " : ""}${o ? "完全免费，做一次永久有效 · 靶场、人机、好友约战一直免费" : s ? "完全免费，三连一次永久有效" : "完全免费，关注一次就够了"}</small></div>\n        <div class="pg-gives">${u.map(([t, e]) => `<div class="${b && e.includes(b.split(" · ")[0]) ? "me" : ""}"><i>${t}</i>${esc(e)}</div>`).join("")}</div>\n        <div class="pg-steps">${e ? "" : "<div><b>0</b>先登录（B站 一键登录）</div>"}${h}</div>\n        <div class="pg-btns">${e ? (a ? `<button class="pg-b go" data-a="back">${this.intro && !o ? "进入衣柜" : "好的"}</button>` : `<button class="pg-b go" data-a="go" ${i ? "" : "disabled"}>${s ? "去三连新视频" : "去关注 UP 主"}</button><button class="pg-b" data-a="check" ${!i || ("undefined" != typeof Account && Account.checking) ? "disabled" : ""}>${"undefined" != typeof Account && Account.checking ? "正在检查…" : o ? "我完成了，检查" : s ? "我已三连，检查" : "我已关注，检查"}</button>`) : '<button class="pg-b go" data-a="login">先登录</button>'}\n          ${a ? "" : `<button class="pg-b" data-a="${this.intro ? "later" : "back"}">${this.intro ? "暂时不用" : "返回"}</button>`}</div>\n        <div class="pg-note ${this.noteK}">${esc(this.note || (a ? "已经全部解锁了 🎉" : e && !1 === this.inToy ? "要在 B站 App 里打开游戏，才能关注、三连和检查" : ""))}</div></div>`;
    }
    async go() {
      if ("undefined" != typeof Toy) {
        this.went = this.need;
        try {
          const t = "triple" === this.need || ("both" === this.need && pgFollow());
          (t ? await Toy.openVideo(Account.pickVideo()) : await Toy.openAuthor(),
            this.say(
              Toy.backHint ? Toy.backHint(t ? "triple" : "follow") : "完成后回到游戏点「检查」",
            ),
            setTimeout(() => {
              this.went &&
                this.game.ui.screen === this &&
                ((this.went = null), (this.retries = 3), this.check(!0));
            }, 8e3));
        } catch (t) {
          ((this.went = null), this.say(Toy.explain ? Toy.explain(t) : t.message, "bad"));
        }
      }
    }
    async check(t) {
      if ("undefined" != typeof Account && Account.loggedIn) {
        this.render();
        try {
          const e = await Account.checkUnlocks();
          if ((this.render(), !e)) return;
          if (pgDone(this.need))
            return (
              self.XZ && XZ.skins && XZ.skins.load && XZ.skins.load(!0),
              this.say(
                "both" === this.need
                  ? "全部解锁了！排位、薯核、刀、披风都可以用了"
                  : "获取成功！" + (this.what ? "「" + this.what + "」" : "") + "已经可以用了",
                "good",
              ),
              void setTimeout(() => {
                this.game.ui.screen === this && this.leave();
              }, 1200)
            );
          if (
            (this.retries > 0 &&
              e.inToy &&
              (this.retries--,
              setTimeout(() => {
                this.game.ui.screen === this && this.check(this.retries > 0);
              }, 4e3)),
            e.inToy)
          )
            if (e.own) {
              if (e.error && null === e.follow && null === e.triple)
                this.say(Toy.explain ? Toy.explain(e.error) : String(e.error), "bad");
              else if (!t)
                if ("both" !== this.need || pgFollow())
                  if ("triple" === this.need || "both" === this.need) {
                    const t = Account.tripleParts,
                      e = [];
                    (t &&
                      !t.all &&
                      (t.like || e.push("点赞"), t.coin || e.push("投币"), t.fav || e.push("收藏")),
                      this.say(
                        e.length
                          ? "还差：" + e.join("、") + "（要在同一个视频上，刚操作完可能要等几秒）"
                          : "还没查到三连，过几秒再点检查",
                        "bad",
                      ));
                  } else this.say("还没查到关注（刚关注完可能要等几秒，再点一次检查）", "bad");
                else this.say("还没查到关注（刚关注完可能要等几秒，再点一次检查）", "bad");
            } else
              this.say(
                "这里登录的不是你自己的 B站：用你的 B站 关注后，在那台设备打开一次游戏就会同步",
                "bad",
              );
          else this.say("要在 B站 App 或电脑网页里打开游戏，才能关注和检查", "bad");
        } catch (t) {
          this.say(t.message, "bad");
        }
      }
    }
    draw(t) {}
    mouseDown() {}
    onEsc() {
      this.leave();
    }
    close() {
      (document.removeEventListener("visibilitychange", this.onBack),
        window.removeEventListener("focus", this.onBack),
        this.el && (unmount(this.el), (this.el = null)));
    }
  }
  self.PotatoGet = PotatoGet;
  const nt = [
      ["bug", "BUG", "出错、卡住、点不动"],
      ["lag", "卡顿", "掉帧、延迟高"],
      ["idea", "建议", "想加什么、想改什么"],
      ["other", "其他", "别的事"],
    ],
    fbCss = () => {
      if (document.getElementById("fb-css")) return;
      const t = document.createElement("style");
      ((t.id = "fb-css"),
        (t.textContent =
          "\n  #lobby.fb { background: rgba(10,12,18,.6); pointer-events: auto; display: flex; align-items: center; justify-content: center; animation: lbFade .22s ease-out; }\n  #lobby.fb.out { animation: lbOut .2s ease-in forwards; }\n  #lobby .fb-card { position: relative; width: min(calc(var(--u) * 64), 94vw); max-height: calc(100% - 16px); overflow-y: auto; overscroll-behavior: contain; background: var(--paper); border: calc(var(--u) * .3) solid #111;\n    box-shadow: calc(var(--u) * .8) calc(var(--u) * .8) 0 var(--or); padding: calc(var(--u) * 1.6) calc(var(--u) * 2.1); animation: lbUp .4s cubic-bezier(.2,.9,.25,1); pointer-events: auto; box-sizing: border-box; }\n  #lobby.fb.out .fb-card { animation: fbOut .2s ease-in forwards; } @keyframes fbOut { to { opacity: 0; transform: translateY(calc(var(--u) * 1.6)) scale(.98); } }\n  #lobby .fb-card > * { animation: lbUp .34s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(var(--i, 0) * 45ms + 60ms); }\n  #lobby .fb-top { display: flex; align-items: center; gap: calc(var(--u) * 1); }\n  #lobby .fb-top .ic { width: max(26px, calc(var(--u) * 3)); height: max(26px, calc(var(--u) * 3)); background: #111; display: grid; place-items: center; flex: 0 0 auto; }\n  #lobby .fb-top .ic svg { width: 70%; height: 70%; }\n  #lobby .fb-tag { display: inline-block; background: var(--or); color: #fff; font-weight: 900; font-size: max(11px, calc(var(--u) * .95)); padding: calc(var(--u) * .2) calc(var(--u) * .7); letter-spacing: .1em; }\n  #lobby .fb-title { font-size: max(17px, calc(var(--u) * 2.3)); font-weight: 900; line-height: 1.15; margin-top: calc(var(--u) * .2); }\n  #lobby .fb-sub { font-size: max(11px, calc(var(--u) * 1)); color: #6B675F; font-weight: 800; margin-top: calc(var(--u) * .5); }\n  #lobby .fb-kinds { display: grid; grid-template-columns: repeat(4, 1fr); gap: calc(var(--u) * .6); margin-top: calc(var(--u) * 1.1); }\n  #lobby .fb-k { font: inherit; text-align: left; cursor: pointer; background: #fff; color: #111; border: calc(var(--u) * .22) solid #111; padding: calc(var(--u) * .5) calc(var(--u) * .7); touch-action: manipulation; min-width: 0;\n    transition: background-color .15s ease, color .15s ease, transform .15s ease, box-shadow .15s ease; -webkit-tap-highlight-color: transparent; }\n  #lobby .fb-k b { display: block; font-weight: 900; font-size: max(13px, calc(var(--u) * 1.3)); }\n  #lobby .fb-k small { display: block; font-weight: 800; font-size: max(10px, calc(var(--u) * .8)); color: #7A766D; margin-top: 2px; transition: color .15s ease; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n  #lobby .fb-k:hover { transform: translateY(calc(var(--u) * -.15)); }\n  #lobby .fb-k.on { background: #111; color: #fff; box-shadow: calc(var(--u) * .35) calc(var(--u) * .35) 0 var(--or); transform: translate(calc(var(--u) * -.15), calc(var(--u) * -.15)); }\n  #lobby .fb-k.on small { color: #CFCBC2; }\n  #lobby .fb-box { position: relative; margin-top: calc(var(--u) * 1); }\n  #lobby .fb-text { display: block; width: 100%; box-sizing: border-box; min-height: max(84px, calc(var(--u) * 9)); resize: none; font: inherit; font-weight: 700; font-size: max(13px, calc(var(--u) * 1.15)); line-height: 1.45; color: #111;\n    background: #fff; border: calc(var(--u) * .22) solid #111; border-radius: 0; padding: calc(var(--u) * .8) calc(var(--u) * 1) calc(var(--u) * 1.6); outline: none; transition: border-color .15s ease, box-shadow .15s ease; -webkit-user-select: text; user-select: text; }\n  #lobby .fb-text:focus { border-color: var(--or); box-shadow: 0 0 0 calc(var(--u) * .25) rgba(255,90,31,.25); }\n  #lobby .fb-text.bad { animation: wlShake .35s; border-color: #D0402A; }\n  #lobby .fb-n { position: absolute; right: calc(var(--u) * .7); bottom: calc(var(--u) * .5); font-size: max(10px, calc(var(--u) * .8)); font-weight: 800; color: #9A968D; pointer-events: none; }\n  #lobby .fb-shot { display: flex; align-items: center; gap: calc(var(--u) * .9); margin-top: calc(var(--u) * .9); font: inherit; font-weight: 800; font-size: max(12px, calc(var(--u) * 1)); color: #111; background: transparent; border: 0; padding: 0; cursor: pointer; text-align: left; }\n  #lobby .fb-shot img { width: max(64px, calc(var(--u) * 8)); aspect-ratio: 16 / 9; object-fit: cover; border: calc(var(--u) * .2) solid #111; transition: opacity .15s ease, filter .15s ease; }\n  #lobby .fb-shot.off img { opacity: .35; filter: grayscale(1); }\n  #lobby .fb-shot i { width: max(16px, calc(var(--u) * 1.6)); height: max(16px, calc(var(--u) * 1.6)); border: calc(var(--u) * .22) solid #111; background: #fff; display: grid; place-items: center; font-style: normal; font-size: .8em; flex: 0 0 auto; transition: background-color .15s ease; color: #fff; }\n  #lobby .fb-shot:not(.off) i { background: var(--or); } #lobby .fb-shot:not(.off) i::after { content: '✓'; }\n  #lobby .fb-btns { display: flex; gap: calc(var(--u) * .8); margin-top: calc(var(--u) * 1.2); }\n  #lobby .fb-b { font: inherit; font-weight: 900; font-size: max(13px, calc(var(--u) * 1.3)); padding: calc(var(--u) * .8) calc(var(--u) * 1.6); border: calc(var(--u) * .25) solid #111; background: #fff; color: #111; cursor: pointer;\n    transition: transform .12s ease, box-shadow .12s ease, background-color .15s ease, opacity .15s ease; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }\n  #lobby .fb-b.go { flex: 1; background: var(--or); color: #fff; box-shadow: calc(var(--u) * .35) calc(var(--u) * .35) 0 #111; display: flex; align-items: center; justify-content: center; gap: calc(var(--u) * .7); }\n  #lobby .fb-b.go:hover:not(:disabled) { transform: translate(calc(var(--u) * -.12), calc(var(--u) * -.12)); box-shadow: calc(var(--u) * .5) calc(var(--u) * .5) 0 #111; }\n  #lobby .fb-b.go:active:not(:disabled) { transform: translate(calc(var(--u) * .15), calc(var(--u) * .15)); box-shadow: 0 0 0 #111; }\n  #lobby .fb-b:disabled { opacity: .65; cursor: default; }\n  #lobby .fb-b .sp { width: 1em; height: 1em; box-sizing: border-box; border: .18em solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: btSpinR .7s linear infinite; }\n  #lobby .fb-note { margin-top: calc(var(--u) * .8); min-height: 1.3em; font-weight: 800; font-size: max(11px, calc(var(--u) * .95)); color: #6B675F; transition: color .15s ease; }\n  #lobby .fb-note.bad { color: #D0402A; }\n  #lobby .fb-ok { text-align: center; padding: calc(var(--u) * 1.4) 0 calc(var(--u) * .4); }\n  #lobby .fb-ok .ck { width: max(54px, calc(var(--u) * 6)); height: max(54px, calc(var(--u) * 6)); margin: 0 auto; background: var(--or); border: calc(var(--u) * .3) solid #111; box-shadow: calc(var(--u) * .5) calc(var(--u) * .5) 0 #111; display: grid; place-items: center; animation: fbPop .5s cubic-bezier(.2,.9,.25,1.4) backwards .05s; }\n  #lobby .fb-ok .ck svg { width: 62%; height: 62%; } #lobby .fb-ok .ck path { stroke-dasharray: 30; stroke-dashoffset: 30; animation: fbDraw .4s ease-out forwards .35s; }\n  #lobby .fb-ok b { display: block; font-size: max(18px, calc(var(--u) * 2.2)); font-weight: 900; margin-top: calc(var(--u) * 1.2); animation: lbUp .35s cubic-bezier(.2,.9,.25,1) backwards .3s; }\n  #lobby .fb-ok small { display: block; font-size: max(12px, calc(var(--u) * 1.05)); font-weight: 800; color: #6B675F; margin-top: calc(var(--u) * .4); animation: lbUp .35s cubic-bezier(.2,.9,.25,1) backwards .38s; }\n  #lobby .fb-ok .fb-b { margin: calc(var(--u) * 1.4) auto 0; min-width: 40%; animation: lbUp .35s cubic-bezier(.2,.9,.25,1) backwards .46s; }\n  #lobby .fb-ok > * { animation-delay: 0s; }\n  @keyframes fbPop { from { transform: scale(.3) rotate(-12deg); opacity: 0; } } @keyframes fbDraw { to { stroke-dashoffset: 0; } }\n  @media (max-height: 460px) { #lobby .fb-sub { display: none; } #lobby .fb-text { min-height: 60px; } #lobby .fb-kinds { margin-top: 8px; } #lobby .fb-k small { display: none; } }"),
        document.head.appendChild(t));
    };
  class PotatoBug extends MenuScreen {
    constructor(t, e, a) {
      (super(t, null),
        (this.potato = !0),
        (this.parent = e),
        (this.el = null),
        (this.blurBg = !1),
        (this.bgDim = 0),
        (this.pauses = !(
          "play" !== t.state ||
          t.net ||
          (self.XZ && XZ.match && XZ.match.on && XZ.match.on(t) && (!XZ.match.ai || !XZ.match.ai()))
        )),
        (this.kind = 0),
        (this.text = ""),
        (this.sending = !1),
        (this.done = !1));
      let o = a || null;
      if (!o && "play" === t.state && "function" == typeof feedbackShot)
        try {
          o = feedbackShot(t);
        } catch (t) {}
      ((this.shot = o), (this.withShot = !!o));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      (ensureCss(), fbCss());
      const t = (this.el = document.createElement("div"));
      ((t.id = "lobby"),
        (t.className = "fb"),
        host().appendChild(t),
        t.addEventListener("click", (e) => {
          if (e.target === t && !this.sending) return void this.back();
          const a = e.target.closest("[data-a]");
          if (!a || a.disabled) return;
          const o = a.dataset.a;
          "kind" === o
            ? ((this.kind = +a.dataset.i),
              t
                .querySelectorAll(".fb-k")
                .forEach((t, e) => t.classList.toggle("on", e === this.kind)))
            : "shot" === o
              ? ((this.withShot = !this.withShot), a.classList.toggle("off", !this.withShot))
              : "send" === o
                ? this.send()
                : "back" === o && this.back();
        }),
        this.render());
    }
    render() {
      const t = this.el;
      if (!t) return;
      const e = "undefined" != typeof Account && Account.loggedIn;
      if (this.done)
        return void (t.innerHTML =
          '<div class="fb-card"><div class="fb-ok"><div class="ck"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="square"/></svg></div>\n          <b>已收到，谢谢你！</b><small>开发者会逐条看，修好了会写在更新说明里</small><button class="fb-b go" data-a="back">好的</button></div></div>');
      let a = 0;
      const n = () => `style="--i:${a++}"`;
      t.innerHTML = `<div class="fb-card">\n        <div class="fb-top" ${n()}><span class="ic">${T}</span><div><span class="fb-tag">反馈 BUG</span><div class="fb-title">遇到问题了？直接告诉开发者</div></div></div>\n        <div class="fb-sub" ${n()}>说清楚在哪、做了什么、出了什么事，修得最快。会一起发送：游戏版本、设备、最近的帧率和报错${e ? "、你的游戏名（方便回复你）" : ""}；不会发送聊天和存档。</div>\n        <div class="fb-kinds" ${n()}>${nt.map(([, t, e], a) => `<button class="fb-k ${a === this.kind ? "on" : ""}" data-a="kind" data-i="${a}"><b>${t}</b><small>${e}</small></button>`).join("")}</div>\n        <div class="fb-box" ${n()}><textarea class="fb-text" maxlength="500" placeholder="比如：在靶场换了枪皮，回来以后不能移动、不能开镜"></textarea><span class="fb-n">0 / 500</span></div>\n        ${this.shot ? `<button class="fb-shot ${this.withShot ? "" : "off"}" data-a="shot" ${n()}><i></i><img src="${this.shot}" alt="">附上刚才的游戏画面</button>` : ""}\n        <div class="fb-btns" ${n()}><button class="fb-b go" data-a="send">发送给开发者</button><button class="fb-b" data-a="back">取消</button></div>\n        <div class="fb-note" ${n()}></div></div>`;
      const o = t.querySelector(".fb-text"),
        s = t.querySelector(".fb-n");
      ((o.value = this.text),
        (s.textContent = o.value.length + " / 500"),
        o.addEventListener("input", () => {
          ((this.text = o.value),
            (s.textContent = o.value.length + " / 500"),
            o.classList.remove("bad"));
        }),
        ["keydown", "keyup", "keypress"].forEach((t) =>
          o.addEventListener(t, (e) => {
            (e.stopPropagation(),
              "keydown" === t && "Escape" === e.key && (e.preventDefault(), this.back()),
              "keydown" === t &&
                "Enter" === e.key &&
                (e.ctrlKey || e.metaKey) &&
                (e.preventDefault(), this.send()));
          }),
        ));
      !!(this.game.ui.touch && this.game.ui.touch.on && this.game.ui.touch.on()) ||
        setTimeout(() => {
          try {
            this.el && this.el.contains(o) && o.focus({ preventScroll: !0 });
          } catch (t) {}
        }, 420);
    }
    say(t, e) {
      const a = this.el && this.el.querySelector(".fb-note");
      a && ((a.textContent = t), a.classList.toggle("bad", !!e));
    }
    async send() {
      if (this.sending || this.done || !this.el) return;
      const t = String(this.text || "").trim(),
        e = this.el.querySelector(".fb-text");
      if (t.length < 2) {
        if (e) {
          (e.classList.remove("bad"), e.offsetWidth, e.classList.add("bad"));
          try {
            e.focus();
          } catch (t) {}
        }
        return void this.say("先写几句：哪里出了什么问题", !0);
      }
      const a = this.el.querySelector('[data-a="send"]');
      ((this.sending = !0),
        a && ((a.disabled = !0), (a.innerHTML = '<span class="sp"></span>正在发送…')),
        this.say(""));
      const o = this.game,
        s = self.XZ,
        i =
          "play" !== o.state
            ? "lobby"
            : s && s.match && s.match.on && s.match.on(o)
              ? "match"
              : o.world && o.world.xzRange
                ? "range"
                : (o.worldMeta && o.worldMeta.name) || "world",
        l =
          "undefined" != typeof Account && Account.loggedIn && Account.data
            ? { acct: Account.name, acctId: Account.data.id }
            : {},
        r = {
          src: "potato-bug",
          where: i,
          touch: !!(o.ui.touch && o.ui.touch.on && o.ui.touch.on()),
          ua: String(navigator.userAgent || "").slice(0, 200),
          ...l,
        };
      let d = null;
      try {
        d = await postFeedback(o, nt[this.kind][0], t, this.withShot ? this.shot : null, r);
      } catch (t) {
        d = (t && t.message) || "发送失败";
      }
      if (((this.sending = !1), d))
        return (
          a && ((a.disabled = !1), (a.textContent = "再试一次")),
          void this.say("没发出去：" + d, !0)
        );
      ((this.done = !0), (this.text = ""), this.render());
    }
    back() {
      if (this.sending) return;
      const t = this.game;
      this.parent
        ? t.ui.open(this.parent)
        : "play" === t.state
          ? t.ui.close()
          : t.ui.open(new LobbyScreen(t));
    }
    onEsc() {
      this.back();
    }
    close() {
      this.el && (unmount(this.el), (this.el = null));
    }
  }
  self.PotatoBug = PotatoBug;
  const capCss = () => {
    if (document.getElementById("cap-css")) return;
    const t = document.createElement("style");
    ((t.id = "cap-css"),
      (t.textContent =
        '\n  #lobby.capw { z-index: 9; }\n  #pot-capbar { position: absolute; left: 50%; top: max(10px, calc(var(--pvh, 1vh) * 12)); transform: translateX(-50%); z-index: 7; display: flex; align-items: center; gap: 10px; padding: 6px 8px 6px 12px; background: rgba(14,16,20,.88); color: #F2EFE9;\n    border-left: 4px solid #FFB020; font: 800 13px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif; pointer-events: none; animation: capIn .32s cubic-bezier(.2,.9,.25,1); box-shadow: 0 6px 18px rgba(0,0,0,.35); white-space: nowrap; }\n  #pot-capbar b { color: #FFD24A; font-weight: 900; } #pot-capbar i { font-style: normal; width: 8px; height: 8px; background: #FFB020; animation: capBlink 1.2s ease-in-out infinite; }\n  #pot-capbar button { pointer-events: auto; font: inherit; font-size: 12px; color: #F2EFE9; background: transparent; border: 1px solid rgba(242,239,233,.35); padding: 3px 9px; cursor: pointer; transition: border-color .15s ease, background-color .15s ease; }\n  #pot-capbar button:hover { border-color: #FF5A1F; background: rgba(255,90,31,.15); }\n  #pot-capbar.out { animation: capOut .2s ease-in forwards; }\n  @keyframes capIn { from { opacity: 0; transform: translate(-50%, -14px); } } @keyframes capOut { to { opacity: 0; transform: translate(-50%, -14px); } } @keyframes capBlink { 50% { opacity: .25; } }\n  #lobby.ct { background: rgba(10,12,18,.58); pointer-events: auto; display: flex; align-items: center; justify-content: center; animation: lbFade .2s ease-out; }\n  #lobby.ct.out { animation: lbOut .2s ease-in forwards; } #lobby.ct.out .ct-card { animation: fbOut .2s ease-in forwards; }\n  #lobby .ct-card { width: min(calc(var(--u) * 44), 92vw); box-sizing: border-box; background: var(--paper); border: calc(var(--u) * .3) solid #111; box-shadow: calc(var(--u) * .8) calc(var(--u) * .8) 0 var(--or);\n    padding: calc(var(--u) * 1.8) calc(var(--u) * 2.2); text-align: center; animation: ctPop .45s cubic-bezier(.2,.9,.25,1.3); pointer-events: auto; }\n  #lobby .ct-card > * { animation: lbUp .34s cubic-bezier(.2,.9,.25,1) backwards; } #lobby .ct-card > :nth-child(2) { animation-delay: .06s; } #lobby .ct-card > :nth-child(3) { animation-delay: .12s; } #lobby .ct-card > :nth-child(4) { animation-delay: .18s; }\n  #lobby .ct-tag { display: inline-block; background: var(--or); color: #fff; font-weight: 900; font-size: max(11px, calc(var(--u) * .95)); padding: calc(var(--u) * .2) calc(var(--u) * .7); letter-spacing: .1em; }\n  #lobby .ct-title { font-size: max(20px, calc(var(--u) * 2.8)); font-weight: 900; margin-top: calc(var(--u) * .6); }\n  #lobby .ct-n { font: 900 max(34px, calc(var(--u) * 5))/1 "Bahnschrift", "Arial Black", sans-serif; color: var(--or); margin-top: calc(var(--u) * .6); }\n  #lobby .ct-n.low { animation: capBlink .5s ease-in-out infinite; }\n  #lobby .ct-sub { font-size: max(12px, calc(var(--u) * 1.05)); font-weight: 800; color: #6B675F; margin-top: calc(var(--u) * .4); }\n  #lobby .ct-card .fb-btns { justify-content: center; }\n  @keyframes ctPop { from { transform: scale(.82); opacity: 0; } }'),
      document.head.appendChild(t));
  };
  class PotatoCapTurn extends MenuScreen {
    constructor(t, e) {
      (super(t, null),
        (this.potato = !0),
        (this.parent = e),
        (this.el = null),
        (this.blurBg = !1),
        (this.bgDim = 0),
        (this.pauses = !(
          "play" !== t.state ||
          t.net ||
          (self.XZ && XZ.match && XZ.match.on && XZ.match.on(t) && (!XZ.match.ai || !XZ.match.ai()))
        )));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      (ensureCss(), fbCss(), capCss());
      const t = (this.el = document.createElement("div"));
      ((t.id = "lobby"),
        (t.className = "ct"),
        host().appendChild(t),
        (t.innerHTML =
          '<div class="ct-card"><span class="ct-tag">排到你了</span><div class="ct-title">对局有空位了！</div><div class="ct-n">60</div>\n        <div><div class="ct-sub">秒内进入，超时会让给后面排队的人</div><div class="fb-btns"><button class="fb-b go" data-a="go">进入对局</button><button class="fb-b" data-a="skip">放弃</button></div></div></div>'),
        t.addEventListener("click", (t) => {
          const e = t.target.closest("[data-a]");
          e && ("go" === e.dataset.a ? this.go() : "skip" === e.dataset.a && this.skip());
        }));
      try {
        self.XZ &&
          XZ.sound &&
          XZ.sound("drill_go", this.game.player ? this.game.player.pos : null, 0.9, 1.1);
      } catch (t) {}
      ((this.tm = setInterval(() => this.tick(), 250)), this.tick());
    }
    tick() {
      const t = self.XZ && XZ.capState && XZ.capState(),
        e = this.el && this.el.querySelector(".ct-n");
      t && null != t.turn
        ? (e && ((e.textContent = String(t.turn)), e.classList.toggle("low", t.turn <= 10)),
          t.turn <= 0 && this.skip())
        : this.leave();
    }
    leave() {
      clearInterval(this.tm);
      const t = this.game;
      t.ui.screen === this &&
        (this.parent && "play" !== t.state ? t.ui.open(this.parent) : t.ui.close());
    }
    go() {
      clearInterval(this.tm);
      const t = this.game;
      (t.ui.screen === this && t.ui.close(), self.XZ && XZ.capGo && XZ.capGo(t));
    }
    skip() {
      (clearInterval(this.tm), self.XZ && XZ.capSkip && XZ.capSkip(this.game), this.leave());
    }
    onEsc() {}
    close() {
      (clearInterval(this.tm), this.el && (unmount(this.el), (this.el = null)));
    }
  }
  self.PotatoCapTurn = PotatoCapTurn;
  class PotatoAiBack extends MenuScreen {
    constructor(t, e, a) {
      (super(t, null),
        (this.potato = !0),
        (this.parent = e),
        (this.label = a || ""),
        (this.el = null),
        (this.blurBg = !1),
        (this.bgDim = 0),
        (this.pauses = !1));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      (ensureCss(), fbCss(), capCss());
      const t = (this.el = document.createElement("div"));
      ((t.id = "lobby"),
        (t.className = "ct"),
        host().appendChild(t),
        (t.innerHTML = `<div class="ct-card"><span class="ct-tag" style="background:#FF5AA5">人机对局还在</span><div class="ct-title">回到刚才的人机对局？</div>\n        <div class="ct-sub" style="margin-top:calc(var(--u) * .9)">${esc(this.label)}</div>\n        <div><div class="ct-sub">从刚才那一局重新开始，比分保留</div><div class="fb-btns"><button class="fb-b go" data-a="go">继续人机对局</button><button class="fb-b" data-a="no">不了</button></div></div></div>`),
        t.addEventListener("click", (t) => {
          const e = t.target.closest("[data-a]");
          if (!e) return;
          const a = this.game,
            o = self.XZ;
          "go" === e.dataset.a
            ? o && o.aiResume && o.aiResume(a)
            : (o && o.aiDrop && o.aiDrop(), a.ui.open(this.parent || new LobbyScreen(a)));
        }));
    }
    onEsc() {}
    close() {
      this.el && (unmount(this.el), (this.el = null));
    }
  }
  {
    const xe = setInterval(() => {
      const t = self.XZ;
      t &&
        t.duel &&
        (clearInterval(xe),
        (t.onAiResume = (t, e) => {
          t.ui.screen instanceof PotatoAiBack || t.ui.open(new PotatoAiBack(t, t.ui.screen, e));
        }));
    }, 300);
  }
  {
    const Se = setInterval(() => {
      const t = self.XZ;
      if (!t || !t.capState) return;
      (clearInterval(Se),
        (t.onCapTurn = (e) => {
          const a = t.capState();
          a && null != a.turn
            ? e.ui.screen instanceof PotatoCapTurn || e.ui.open(new PotatoCapTurn(e, e.ui.screen))
            : e.ui.screen instanceof PotatoCapTurn && e.ui.screen.leave();
        }));
      let e = null;
      setInterval(() => {
        const a = t.capState(),
          o = !(!a || !a.away || null != a.turn);
        if (
          (o &&
            !e &&
            (capCss(),
            ensureCss(),
            (e = document.createElement("div")),
            (e.id = "lobby"),
            (e.className = "capw"),
            (e.innerHTML =
              '<div id="pot-capbar"><i></i><span class="t"></span><button data-a="x">取消排队</button></div>'),
            e.querySelector("button").addEventListener("click", () => {
              "undefined" != typeof game && t.capSkip(game);
            }),
            host().appendChild(e)),
          e && o)
        ) {
          const t =
              "人满排队中 · " +
              (null != a.ahead ? "前面还有 <b>" + a.ahead + "</b> 人" : "排队中") +
              " · 轮到你会弹窗提醒",
            o = e.querySelector(".t");
          o.innerHTML !== t && (o.innerHTML = t);
        }
        if (e && !o) {
          const t = e;
          e = null;
          const a = t.querySelector("#pot-capbar");
          (a && a.classList.add("out"), setTimeout(() => t.remove(), 220));
        }
      }, 500);
    }, 300);
  }
  try {
    "undefined" != typeof FeedbackScreen &&
      (FeedbackScreen = function (t, e, a) {
        return new PotatoBug(t, e, a);
      });
  } catch (Fe) {}
  try {
    "undefined" != typeof UnlockScreen &&
      (UnlockScreen = function (t, e) {
        return new PotatoGet(t, e, { need: self.Potato.needFor("any") });
      });
  } catch (Ae) {}
  {
    let Ee = !1;
    setInterval(() => {
      const t = "undefined" != typeof game ? game : null;
      !Ee &&
        t &&
        t.ui &&
        t.ui.screen instanceof LobbyScreen &&
        "undefined" != typeof Account &&
        Account.loggedIn &&
        Account.data &&
        ("triple" !== gateOf() ||
          (self.XZ && XZ.isGuest && XZ.isGuest()) ||
          ((Ee = !0),
          pgDone("both") || t.ui.open(new PotatoGet(t, t.ui.screen, { need: "both", intro: !0 }))));
    }, 2500);
  }
  {
    let Ce = 0;
    setInterval(() => {
      const e = "undefined" != typeof game ? game : null;
      if (!e || !e.ui || "title" !== e.state || t) return void (Ce = 0);
      const a = e.ui.screen;
      if (
        !a ||
        (Object.prototype.hasOwnProperty.call(a, "el") &&
          "function" == typeof a.mount &&
          (!a.el || !a.el.isConnected))
      ) {
        if (!(++Ce < 2)) {
          Ce = 0;
          try {
            a ? ((a.el = null), a.layout()) : e.ui.open(new LobbyScreen(e));
          } catch (t) {
            try {
              e.ui.open(new LobbyScreen(e));
            } catch (t) {}
          }
        }
      } else Ce = 0;
    }, 1500);
  }
  const openWardrobe = (t, e) => {
      const W = () => t.ui.open(new PotatoWardrobe(t, e));
      if (!!(self.XZ && XZ.isGuest && XZ.isGuest()) || pgDone(self.Potato.needFor("cape")))
        return W();
      t.ui.open(new PotatoGet(t, e, { intro: !0, then: W }));
    },
    st = new Set([
      "ChatScreen",
      "QuickChatScreen",
      "TouchLayoutScreen",
      "HelpScreen",
      "AdvancementsScreen",
      "StatsScreen",
      "WorldListScreen",
      "CreateWorldScreen",
      "EditWorldScreen",
      "LoadingModsScreen",
    ]),
    skinnable = (t) =>
      t instanceof MenuScreen &&
      !t.potato &&
      !t.__skin &&
      !st.has(t.constructor.name) &&
      !((t) => {
        for (
          let e = Object.getPrototypeOf(t);
          e && e !== MenuScreen.prototype;
          e = Object.getPrototypeOf(e)
        )
          if (Object.prototype.hasOwnProperty.call(e, "draw")) return !0;
        return !1;
      })(t);
  let it = null;
  const lt = Font.draw;
  Font.draw = function (t, e, a, o, s, i) {
    if (!it) return lt.apply(this, arguments);
    it.push({ t: String(e), y: +o || 0, x: +a || 0, c: s });
  };
  const rt = document.createElement("canvas");
  rt.width = rt.height = 4;
  const ct = rt.getContext("2d"),
    colCls = (t) => (
      (t = String(t || "").toUpperCase()),
      /FF55|FF60|FF6B|E030/.test(t)
        ? "c-bad"
        : /FFD2|FFFF55|FFFF00|FFC2|FFAA|FFB0/.test(t)
          ? "c-warn"
          : /55FF|7CFF|5CFF/.test(t)
            ? "c-good"
            : /A0A0|AAAA|7070|8080|9090|6060/.test(t)
              ? "c-grey"
              : ""
    ),
    dt = /完成|确定|确认|登录|开始|继续|加入|保存|提交|发送|好的|同意|重生|领取|一键/,
    ut = /取消|返回|退出|离线|不要|拒绝|关闭/;
  function skin(t) {
    const e = t.game;
    let a = null,
      o = "",
      s = [];
    t.__skin = !0;
    e.ui;
    ((t.draw = function (e) {
      this.blurBg
        ? e.menuBackground()
        : this.bgDim
          ? e.dim(Math.max(this.bgDim, 0.35))
          : e.dim(0.35);
      const i = (() => {
        const e = [],
          a = [];
        for (const o of t.widgets || [])
          o &&
            (o.slider
              ? a.push({ kind: "sl", label: lab(o.label), v: o.value, y: o.y, src: o })
              : o.text
                ? e.push({ t: lab(o.text), c: o.color })
                : o.onClick &&
                  a.push({
                    kind: "btn",
                    label: lab(o.label) || (o.tip && o.tip[0]) || "…",
                    y: o.y,
                    enabled: !1 !== o.enabled,
                    tip: o.tip ? o.tip.join("\n") : "",
                    src: o,
                  }));
        return {
          title: t.title || "",
          lines: [],
          texts: e,
          w: a,
          fields: Object.entries(t.fields || {}).map(([t, e]) => ({
            k: t,
            label: e.label,
            max: e.max,
          })),
        };
      })();
      it = [];
      const l = e.ctx,
        r = this.drawFields;
      ((e.ctx = ct), r && (this.drawFields = () => {}));
      try {
        this.drawExtra && this.drawExtra(e);
      } catch (t) {
      } finally {
        ((e.ctx = l), r && (this.drawFields = r));
      }
      const d = new Set();
      ((i.lines = it
        .filter((t) => t.t.trim() && !d.has(t.t) && d.add(t.t))
        .sort((t, e) => t.y - e.y)),
        (it = null));
      const u = JSON.stringify([
        i.title,
        i.lines.length,
        i.texts.length,
        i.fields.map((t) => t.k),
        i.w.map((t) => t.kind + Math.round(t.y / 4)),
      ]);
      ((u === o && a) ||
        ((o = u),
        ((e) => {
          (a && a.remove(),
            (a = document.createElement("div")),
            (a.id = "lobby"),
            (a.className = "pz op"));
          let o = 0;
          const i = [],
            l = new Map();
          (e.w.forEach((t, e) => {
            if ("btn" === t.kind || "sl" === t.kind) {
              const a = "sl" === t.kind ? "sl" + e : String(Math.round(t.y / 4));
              (l.has(a) || (l.set(a, []), i.push(l.get(a))), l.get(a).push(e));
            }
          }),
            (a.innerHTML = `<div class="pz-wrap op-wrap">\n        ${e.title ? `<div class="pz-head big"><span>${esc(e.title)}</span></div>` : ""}\n        ${e.lines.length ? `<div class="sk-lines">${e.lines.map((t, e) => `<div class="${colCls(t.c)}${0 === e ? " first" : ""}" data-l="${e}"></div>`).join("")}</div>` : ""}\n        ${e.fields.map((t) => `<label class="sk-field" style="--i:${o++}"><span>${esc(t.label)}</span><input data-f="${esc(t.k)}" ${t.max ? `maxlength="${t.max}"` : ""} autocomplete="off" spellcheck="false"></label>`).join("")}\n        ${e.texts.length ? `<div class="sk-lines">${e.texts.map((t, e) => `<div class="${colCls(t.c)}" data-t="${e}"></div>`).join("")}</div>` : ""}\n        ${i
              .map(
                (t) =>
                  `<div class="sk-row">${t
                    .map((t) => {
                      const a = e.w[t];
                      return "sl" === a.kind
                        ? `<div class="op-sl sk-sl" data-w="${t}"><span class="t"></span><input type="range" min="0" max="1000" value="${Math.round(1e3 * (a.v || 0))}"></div>`
                        : `<button class="sk-btn ${dt.test(a.label) ? "op-go" : ut.test(a.label) ? "op-dark" : ""}" data-w="${t}" ${a.tip ? `title="${esc(a.tip)}"` : ""}><span class="t"></span></button>`;
                    })
                    .join("")}</div>`,
              )
              .join("")}\n        <div class="sk-note" style="display:none"></div></div>`),
            host().appendChild(a),
            a.addEventListener("click", (t) => {
              const e = t.target.closest("button[data-w]");
              if (!e) return;
              const a = s[+e.dataset.w];
              a && !1 !== a.enabled && a.onClick && a.onClick();
            }),
            a.addEventListener("input", (e) => {
              const a = e.target.dataset && e.target.dataset.f;
              if (void 0 !== a) {
                const o = t.fields[a];
                let s = e.target.value;
                return (
                  o &&
                    o.filter &&
                    ((s = o.filter(s)), s !== e.target.value && (e.target.value = s)),
                  (t[a] = s),
                  void (t.field = a)
                );
              }
              const o = e.target.closest("[data-w]"),
                i = o && s[+o.dataset.w];
              i &&
                i.slider &&
                ((i.value = +e.target.value / 1e3), i.onChange && i.onChange(i.value));
            }),
            a.addEventListener("keydown", (e) => {
              e.target.dataset &&
                void 0 !== e.target.dataset.f &&
                (e.stopPropagation(),
                "Enter" === e.key
                  ? (e.preventDefault(), t.submit && t.submit())
                  : "Escape" === e.key &&
                    (e.preventDefault(), t.onEsc ? t.onEsc() : t.back && t.back()));
            }),
            a.querySelectorAll("input[data-f]").forEach((e) => {
              e.value = t[e.dataset.f] || "";
            }));
          const r =
            (t.field && a.querySelector(`input[data-f="${t.field}"]`)) ||
            a.querySelector("input[data-f]");
          r &&
            setTimeout(() => {
              try {
                r.focus({ preventScroll: !0 });
              } catch (t) {}
            }, 30);
        })(i)),
        (s = i.w.map((t) => t.src)),
        a.querySelectorAll("[data-l]").forEach((t) => {
          const e = i.lines[+t.dataset.l];
          e && t.textContent !== e.t && (t.textContent = e.t);
        }),
        a.querySelectorAll("[data-t]").forEach((t) => {
          const e = i.texts[+t.dataset.t];
          e && t.textContent !== e.t && (t.textContent = e.t);
        }),
        a.querySelectorAll("[data-w]").forEach((t) => {
          const e = i.w[+t.dataset.w];
          if (!e) return;
          const a = t.querySelector(".t");
          (a && a.textContent !== e.label && (a.textContent = e.label),
            "btn" === e.kind && (t.disabled = !e.enabled));
        }));
      const b = a.querySelector(".sk-note"),
        h = this.note || "";
      b &&
        (b.textContent !== h && (b.textContent = h),
        (b.style.display = h ? "" : "none"),
        (b.style.color = "#FF6060" === this.noteColor ? "#E0301E" : "#333"));
    }),
      (t.mouseDown = function () {}),
      (t.focus = function (t) {
        this.field = t;
        const e = a && a.querySelector(`input[data-f="${t}"]`);
        if (e)
          try {
            e.focus();
          } catch (t) {}
      }));
    const i = t.close;
    return (
      (t.close = function () {
        if ((a && (unmount(a), (a = null), (o = "")), i)) return i.apply(this, arguments);
      }),
      t
    );
  }
  const bt = UI.prototype.showInput;
  UI.prototype.showInput = function (...t) {
    if (!this.screen || !this.screen.__skin) return bt.apply(this, t);
  };
  const ht = UI.prototype.open;
  UI.prototype.open = function (t) {
    const e = this.game;
    return (
      t &&
        !t.potato &&
        (t instanceof OptionsListScreen
          ? (t = new PotatoOptions(e, t.parent, t.title, t.page))
          : t instanceof KeyBindsScreen
            ? (t = new PotatoKeys(e, t.parent))
            : t instanceof OptionsScreen
              ? (t = new PotatoSettings(e, t.parent))
              : skinnable(t) && skin(t)),
      ht.call(this, t)
    );
  };
  let pt = null;
  Sound.click = function () {
    const t = this.ctx;
    if (!t || this.idle) return;
    if (("suspended" === t.state && t.resume(), !pt)) {
      const e = Math.floor(0.05 * t.sampleRate);
      pt = t.createBuffer(1, e, t.sampleRate);
      const a = pt.getChannelData(0);
      for (let o = 0; o < e; o++) {
        const e = o / t.sampleRate,
          s = Math.exp(95 * -e) * Math.min(1, e / 0.0012);
        a[o] =
          (0.45 * Math.sin(2 * Math.PI * 2100 * e) + 0.55 * Math.sin(2 * Math.PI * 760 * e)) *
          s *
          0.8;
      }
    }
    const e = t.createBufferSource(),
      a = t.createGain();
    ((e.buffer = pt),
      (a.gain.value = 0.55),
      e.connect(a),
      a.connect(this.sfx || t.destination),
      e.start());
  };
  const wake = () => {
    try {
      Sound.init();
    } catch (t) {}
  };
  (addEventListener("pointerdown", wake, { capture: !0, passive: !0 }),
    addEventListener("keydown", wake, { capture: !0, passive: !0 }),
    addEventListener(
      "pointerdown",
      (t) => {
        const e =
          t.target &&
          t.target.closest &&
          t.target.closest("#lobby [data-a], #lobby button, #lobby .it");
        if (e && !e.disabled && !e.closest("#lobby.out"))
          try {
            Sound.click();
          } catch (t) {}
      },
      !0,
    ));
  const ft = "p:penguin",
    gt = "p:scarecrow";
  if (
    ((self.LOOK_FILTER = (t) =>
      t
        ? t.skin === ft || t.skin === gt
          ? t
          : Object.assign({}, t, { skin: ft, slim: !0 })
        : self.DEFAULT_LOOK),
    "undefined" != typeof Skins && Skins.load)
  ) {
    const Te = Skins.load.bind(Skins);
    Skins.load = (t, ...e) =>
      String(t || "").startsWith("m:")
        ? Promise.reject(new Error("土豆史诗只用自己的皮肤"))
        : Te(t, ...e);
  }
  const vt = new Map();
  let mt = "";
  const faceIcon = () => (
      mt ||
        Skins.load(ft)
          .then((t) => {
            const e = document.createElement("canvas");
            e.width = e.height = 48;
            const a = e.getContext("2d");
            ((a.imageSmoothingEnabled = !1),
              a.drawImage(t, 8, 8, 8, 8, 0, 0, 48, 48),
              a.drawImage(t, 40, 8, 8, 8, 0, 0, 48, 48),
              (mt = e.toDataURL()),
              document.querySelectorAll("img.wd-face").forEach((t) => {
                t.src = mt;
              }));
          })
          .catch(() => {}),
      mt
    ),
    yt = [
      ["skin", "皮肤", "SKIN"],
      ["cape", "披风", "CAPE"],
      ["hat", "帽子", "HAT"],
      ["pet", "宠物", "PET"],
      ["pre", "前缀", "TAG"],
      ["gun", "枪皮", "GUNS"],
    ];
  class PotatoWardrobe extends MenuScreen {
    constructor(t, e) {
      (super(t, null),
        (this.potato = !0),
        (this.parent = e),
        (this.pauses = !1),
        (this.blurBg = !1),
        (this.bgDim = 0),
        (this.el = null));
      const a = ("undefined" != typeof Account && Account.data && Account.data.skin) || {};
      ((this.look = {
        skin: ft,
        slim: a.skin !== ft || !!a.slim,
        cape: a.cape || null,
        hat: a.hat || null,
        pet: a.pet || null,
        pre: a.pre || null,
      }),
        (this.tab = "skin"),
        (this.sel = 0),
        (this.busy = !1),
        (this.msg = ""),
        Skins.setPreview(this.look));
    }
    get dirty() {
      const t = ("undefined" != typeof Account && Account.data && Account.data.skin) || {};
      return (
        (t.skin || null) !== this.look.skin ||
        !!t.slim !== this.look.slim ||
        ["cape", "hat", "pet", "pre"].some((e) => (t[e] || null) !== (this.look[e] || null))
      );
    }
    items(t = this.tab) {
      const e = "undefined" != typeof Cosmetics ? Cosmetics : null;
      if ("gun" === t) {
        const t = self.XZ && self.XZ.skins;
        return t ? t.rules.IDS.map((e) => ({ v: e, locked: !t.owns(e) })) : [];
      }
      if ("skin" === t)
        return [
          ...(self.SKINS_BUILTIN || [])
            .filter((t) => !t.hidden)
            .map((t) => ({
              v: "p:" + t.id,
              name: t.name,
              sub: "初始皮肤 · 手臂粗细在右边切换",
              on: this.look.skin === "p:" + t.id,
              face: !0,
              kind: "skin",
            })),
        ];
      if ("cape" === t) {
        const t =
          "undefined" != typeof Capes
            ? Capes.list.filter((t) => !t.admin || Capes.unlocked(t.id))
            : [];
        return [
          { v: null, name: "不穿披风", sub: "什么都不穿", on: !this.look.cape },
          ...t.map((t) => ({
            v: t.id,
            name: t.name,
            sub: t.anim ? "动态披风" : "静态披风",
            on: this.look.cape === t.id,
            locked: !Capes.unlocked(t.id),
            icon: ["cape", t.id],
            how: t.ev ? "ev:cape:" + t.id : "关注 UP 主就能穿上（动态、静态披风都是）",
          })),
        ];
      }
      return [
        {
          v: null,
          name: { hat: "不戴帽子", pet: "不带宠物", pre: "不用前缀" }[t],
          sub: "空着",
          on: !this.look[t],
        },
        ...(e ? e.LIST.filter((e) => e.kind === t) : []).map((a) => {
          const o = a.id.split(":")[1],
            s = e.info && e.info(a.id);
          return {
            v: o,
            id: a.id,
            name: a.name,
            sub: (s && s.how && s.how[0]) || { hat: "帽子", pet: "宠物", pre: "名字前缀" }[t],
            on: this.look[t] === o,
            locked: !e.has(a.id),
            icon: ["cos", a.id],
            how: "ev:" + a.id,
          };
        }),
      ];
    }
    nameOf(t) {
      const e = this.items(t).find((t) => t.on && !t.arm);
      return e ? e.name : "无";
    }
    pic(t, e) {
      if (t.face) return `<img class="wd-face" src="${faceIcon()}" alt="">`;
      if (t.arm) return `<span class="wd-armpic ${t.v}"><i></i><i></i><i></i></span>`;
      if (t.icon) {
        const e = (function iconOf(t, e, a) {
          const o = t + ":" + e + ":" + !!a;
          if (vt.has(o)) return vt.get(o);
          let s = "";
          try {
            const o = document.createElement("canvas"),
              i = o.getContext("2d");
            ("cape" === t
              ? ((o.width = 48),
                (o.height = 72),
                (i.imageSmoothingEnabled = !1),
                Capes.drawFlat(i, e, 4, 2, 4, a))
              : "cos" === t &&
                ((o.width = o.height = 96),
                (i.imageSmoothingEnabled = !1),
                Cosmetics.drawIcon(i, e, 0, 0, 96, a)),
              (s = o.toDataURL()));
          } catch (t) {}
          return (vt.set(o, s), s);
        })(t.icon[0], t.icon[1], t.locked);
        if (e) return `<img src="${e}" alt="">`;
      }
      return `<span class="wd-none">${blockText("NONE")}</span>`;
    }
    layout() {
      this.el ? this.fill() : this.mount();
    }
    mount() {
      const t = this.game;
      (ensureCss(),
        t.lobby && (t.lobby.moveTo({ cx: 0.78, tall: 0.8 }, Math.PI - 0.42), (t.lobby.relax = !0)));
      const e = (this.el = document.createElement("div"));
      ((e.id = "lobby"),
        (e.className = "wd"),
        (e.innerHTML = `<div class="lb-drag wd-drag" title="拖动转一转"></div>\n        <div class="wd-tagline">${blockText("WARDROBE")}<span class="wd-who"></span></div>\n        <div class="wd-rail">${yt.map(([t, e, a], o) => `<button class="wd-tab" data-tab="${t}" style="--i:${o}"><small>${blockText("0" + (o + 1))}</small><span>${blockText(a)}</span><b>${e}</b><em></em></button>`).join("")}</div>\n        <div class="wd-main">\n          <div class="wd-grid"></div>\n          <div class="wd-card"><div class="wd-big"></div><div class="wd-info"><small class="wd-k"></small><b class="wd-n"></b><span class="wd-h"></span></div><button class="wd-eq"></button>\n            <div class="wd-seg" style="display:none"><small>手臂</small><button data-arm="slim">细</button><button data-arm="wide">粗</button></div></div>\n          <div class="wd-foot"><span class="wd-msg"></span><button class="op-btn op-dark" data-a="back">返回大厅</button><button class="op-btn op-go" data-a="save"></button></div>\n        </div>\n        <div class="wd-stamp">${blockText("POTATO EPIC")}<span>衣柜 · 拖动右边的人转一转</span></div>`),
        host().appendChild(e),
        e.addEventListener("click", (e) => {
          const a = e.target,
            o = a.closest("[data-tab]");
          if (o)
            return "gun" === o.dataset.tab
              ? void t.ui.open(new PotatoGunSkins(t, this.parent))
              : ((this.tab = o.dataset.tab),
                (this.sel = Math.max(
                  0,
                  this.items().findIndex((t) => t.on),
                )),
                void this.fill());
          const s = a.closest("[data-it]");
          if (s) return ((this.sel = +s.dataset.it), void this.pick(this.sel));
          if (a.closest(".wd-eq")) return void this.pick(this.sel);
          const i = a.closest("[data-a]");
          i && "save" === i.dataset.a ? this.save() : i && "back" === i.dataset.a && this.back();
        }),
        (this.onMove = (e) => {
          const a = t.lobby;
          if (!a) return;
          const [o, s] = sp(e);
          ((a.mx = (o / sw()) * 2 - 1),
            (a.my = (s / sh()) * 2 - 1),
            a.drag && (a.yaw = a.drag.yaw + 0.012 * (o - a.drag.x)));
        }),
        (this.onUp = () => {
          t.lobby && (t.lobby.drag = null);
        }),
        addEventListener("pointermove", this.onMove),
        addEventListener("pointerup", this.onUp),
        addEventListener("pointercancel", this.onUp),
        e.querySelector(".wd-drag").addEventListener("pointerdown", (e) => {
          (t.lobby && (t.lobby.drag = { x: sp(e)[0], yaw: t.lobby.yaw }), e.preventDefault());
        }),
        (this.sel = Math.max(
          0,
          this.items().findIndex((t) => t.on),
        )),
        this.fill());
    }
    fill() {
      const t = this.el;
      if (!t) return;
      ((this.list = this.items()),
        (t.querySelector(".wd-who").textContent =
          (("undefined" != typeof Account && Account.loggedIn && Account.name) || "未登录") +
          " · " +
          [
            "企鹅",
            (this.look.slim ? "细" : "粗") + "手臂",
            this.nameOf("cape"),
            this.nameOf("hat"),
            this.nameOf("pet"),
            this.nameOf("pre"),
          ].join(" / ")),
        t.querySelectorAll("[data-tab]").forEach((t) => {
          t.classList.toggle("on", t.dataset.tab === this.tab);
          const e = this.items(t.dataset.tab).filter((t) => null !== t.v && !t.arm),
            a = e.filter((t) => !t.locked).length;
          t.querySelector("em").textContent = a + " / " + e.length;
        }),
        (t.querySelector(".wd-grid").innerHTML = this.list
          .map(
            (t, e) =>
              `<button class="wd-it ${t.on ? "on" : ""} ${t.locked ? "lk" : ""} ${e === this.sel ? "sel" : ""}" data-it="${e}" style="--i:${e}">\n        <div class="pic">${this.pic(t)}</div><b>${esc(t.name)}</b>${t.on ? '<i class="eq">已装备</i>' : ""}</button>`,
          )
          .join("")));
      const e = this.list[this.sel] || this.list[0];
      if (e) {
        ((t.querySelector(".wd-big").innerHTML = this.pic(e, !0)),
          (t.querySelector(".wd-k").textContent =
            (yt.find((t) => t[0] === this.tab) || [])[1] +
            (e.locked ? " · 未解锁" : e.on ? " · 已装备" : "")),
          (t.querySelector(".wd-n").textContent = e.name),
          (t.querySelector(".wd-h").textContent = e.locked
            ? e.how && !e.how.startsWith("ev:")
              ? e.how
              : e.sub || "活动奖励"
            : e.sub || ""));
        const a = t.querySelector(".wd-eq");
        ((a.textContent = e.locked ? "去获取" : e.on ? "已装备" : "装备"),
          (a.disabled = !e.locked && e.on),
          a.classList.toggle("lk", !!e.locked));
        const o = t.querySelector(".wd-seg");
        ((a.style.display = "skin" === e.kind ? "none" : ""),
          (o.style.display = "skin" === e.kind ? "" : "none"),
          o
            .querySelectorAll("[data-arm]")
            .forEach((t) =>
              t.classList.toggle("on", ("slim" === t.dataset.arm) == !!this.look.slim),
            ));
      }
      this.foot();
    }
    foot() {
      if (!this.el) return;
      const t = this.el.querySelector('[data-a="save"]');
      ((t.textContent = this.busy ? "正在保存…" : this.dirty ? "保存外观" : "已保存"),
        (t.disabled = this.busy || !this.dirty),
        (this.el.querySelector(".wd-msg").textContent =
          this.msg || ("undefined" != typeof Account && Account.loggedIn ? "" : "登录后才能保存")));
    }
    changed() {
      (Skins.setPreview(this.look), this.fill());
    }
    pick(t) {
      const e = this.list[t],
        a = this.game;
      if (e) {
        if (e.locked)
          return e.how && e.how.startsWith("ev:")
            ? (WardrobeScreen.prototype.toCheckin.call(
                Object.assign(Object.create(WardrobeScreen.prototype), {
                  game: a,
                  parent: this.parent,
                  say: (t) => {
                    ((this.msg = t), this.foot());
                  },
                }),
                e.how.slice(3),
              ),
              void this.fill())
            : void a.ui.open(
                new PotatoGet(a, this, {
                  need: self.Potato.needFor("gun" === this.tab ? "core" : "cape"),
                  what: e.name || "",
                }),
              );
        (e.arm
          ? (this.look.slim = "slim" === e.v)
          : "skin" === this.tab
            ? (this.look.skin = e.v)
            : (this.look[this.tab] = e.v),
          (this.msg = ""),
          this.changed());
      }
    }
    async save() {
      const t = this.game;
      if (Account.loggedIn) {
        ((this.busy = !0), this.foot());
        try {
          (await Account.update({ skin: { ...this.look } }),
            (this.msg = "已保存"),
            t.net && t.net.sendLook());
        } catch (t) {
          this.msg = t.message;
        }
        ((this.busy = !1), this.foot());
      } else t.ui.open(new LoginScreen(t, () => t.ui.open(this)));
    }
    back() {
      (Skins.setPreview(null),
        this.game.lobby && (this.game.lobby.moveTo(l, Math.PI + 0.3), (this.game.lobby.relax = !1)),
        backTo(this.game, this.parent));
    }
    onEsc() {
      this.back();
    }
    close() {
      (removeEventListener("pointermove", this.onMove),
        removeEventListener("pointerup", this.onUp),
        removeEventListener("pointercancel", this.onUp),
        this.el && (unmount(this.el), (this.el = null)));
    }
    draw(t) {}
    mouseDown() {}
  }
  self.PotatoWardrobe = PotatoWardrobe;
  const ensureGsCss = () => {
      if ((ensureCss(), !document.getElementById("gs-css"))) {
        const t = document.createElement("style");
        ((t.id = "gs-css"),
          (t.textContent =
            "\n  #lobby.gs .wd-drag { display: none; }\n  #lobby .gs-coin { pointer-events: auto; cursor: help; font-size: calc(var(--u) * 1.15); font-weight: 900; background: #111; color: #FFD36B; padding: calc(var(--u) * .45) calc(var(--u) * 1); display: flex; align-items: center; gap: calc(var(--u) * .6); box-shadow: calc(var(--u) * .35) calc(var(--u) * .35) 0 var(--or); }\n  #lobby .gs-coin i { width: calc(var(--u) * 1.3); height: calc(var(--u) * 1); background: #C99A5B; border: calc(var(--u) * .18) solid #6E4A2C; border-radius: 50%; }\n  #lobby .gs-coin small { color: #A9A59C; font-size: calc(var(--u) * .85); font-weight: 800; }\n  #lobby .gs-fr { pointer-events: auto; cursor: pointer; font: inherit; font-weight: 900; font-size: calc(var(--u) * 1); padding: calc(var(--u) * .45) calc(var(--u) * 1); background: #F2EFE9; color: #111; border: calc(var(--u) * .22) solid #111; box-shadow: calc(var(--u) * .3) calc(var(--u) * .3) 0 #B07A1C; margin-left: calc(var(--u) * .6); }\n  #lobby .gs-fr.on { background: #FFF1C9; } #lobby .gs-fr:hover { transform: translateY(calc(var(--u) * -.12)); }\n  /* (the user 11-19 「变成左边一排是枪型（可滑动）右边是枪皮」: the guns a column down the left that scrolls - a fade at its foot\n     while there is more -, the skins, the card and the foot to its right) */\n  #lobby .gs-main { position: absolute; left: calc(var(--u) * 16); top: calc(var(--u) * 9); bottom: calc(var(--u) * 3); width: calc(var(--u) * 46); display: grid; grid-template-columns: calc(var(--u) * 9.6) minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto auto; gap: calc(var(--u) * 1) calc(var(--u) * 1.1); pointer-events: none; animation: lbUp .45s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .gs-main > .gs-grid { grid-column: 2; grid-row: 1; } #lobby .gs-main > .gs-card { grid-column: 2; grid-row: 2; } #lobby .gs-main > .wd-foot { grid-column: 2; grid-row: 3; }\n  #lobby .gs-guns { pointer-events: auto; grid-column: 1; grid-row: 1 / 4; display: flex; flex-direction: column; gap: calc(var(--u) * .55); overflow-y: auto; overflow-x: hidden; touch-action: pan-y; overscroll-behavior: contain; padding: 0 calc(var(--u) * .5) calc(var(--u) * .6) 0; scrollbar-width: thin; scrollbar-color: #111 transparent; }\n  #lobby .gs-guns.more { -webkit-mask-image: linear-gradient(#000 82%, transparent); mask-image: linear-gradient(#000 82%, transparent); }\n  #lobby .gs-gun { flex: 0 0 auto; position: relative; font: inherit; display: flex; align-items: center; gap: calc(var(--u) * .5); padding: calc(var(--u) * .35) calc(var(--u) * .5); background: var(--paper); border: calc(var(--u) * .25) solid #111; cursor: pointer; font-weight: 900; font-size: calc(var(--u) * 1); color: #111; text-align: left; transition: transform .12s ease; }\n  #lobby .gs-gun img { width: calc(var(--u) * 3); height: calc(var(--u) * 3); object-fit: contain; image-rendering: pixelated; flex: 0 0 auto; }\n  #lobby .gs-gun:hover { transform: translateX(calc(var(--u) * .25)); } #lobby .gs-gun.on { background: #111; color: var(--paper); box-shadow: calc(var(--u) * .35) calc(var(--u) * .35) 0 var(--or); transform: translateX(calc(var(--u) * .35)); }\n  #lobby .gs-gun em { margin-left: auto; font-style: normal; font-size: calc(var(--u) * .8); color: var(--or); }\n  #lobby .gs-grid { pointer-events: auto; flex: 1 1 auto; min-height: 0; overflow-y: auto; touch-action: pan-y; display: grid; grid-template-columns: repeat(3, 1fr); gap: calc(var(--u) * .8); align-content: start; padding: calc(var(--u) * .5) calc(var(--u) * .5) calc(var(--u) * .3) 0; }\n  #lobby .gs-it { pointer-events: auto; position: relative; font: inherit; color: #111; background: var(--paper); border: calc(var(--u) * .25) solid #111; padding: calc(var(--u) * .4) calc(var(--u) * .5) calc(var(--u) * .5); cursor: pointer; transition: transform .12s ease, box-shadow .12s ease; animation: lbUp .35s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(var(--i) * 25ms); }\n  #lobby .gs-it .pic { height: calc(var(--u) * 5.2); display: flex; align-items: center; justify-content: center; background: #E9E4D8; margin-bottom: calc(var(--u) * .4); }\n  #lobby .gs-it .pic img { height: 100%; image-rendering: pixelated; }\n  #lobby .gs-it b { display: block; font-size: calc(var(--u) * 1); font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; }\n  #lobby .gs-it .set { position: absolute; right: calc(var(--u) * .3); top: calc(var(--u) * .3); font-style: normal; font-size: calc(var(--u) * .7); font-weight: 900; color: #fff; background: var(--sc); padding: 0 calc(var(--u) * .35); clip-path: polygon(8% 0, 100% 0, 92% 100%, 0 100%); }\n  #lobby .gs-it .eq { position: absolute; left: calc(var(--u) * .3); top: calc(var(--u) * .3); font-style: normal; font-size: calc(var(--u) * .7); font-weight: 900; background: var(--or); color: #fff; padding: 0 calc(var(--u) * .35); }\n  #lobby .gs-it:hover { transform: translateY(calc(var(--u) * -.25)); box-shadow: 0 calc(var(--u) * .45) 0 var(--or); }\n  #lobby .gs-it.sel { box-shadow: 0 0 0 calc(var(--u) * .35) var(--or); } #lobby .gs-it.lk .pic img { filter: grayscale(1) opacity(.5); }\n  #lobby .gs-it.lk::after { content: 'LOCK'; position: absolute; left: calc(var(--u) * .3); bottom: calc(var(--u) * 2.1); font-size: calc(var(--u) * .65); font-weight: 900; background: #111; color: var(--paper); padding: 0 calc(var(--u) * .3); }\n  #lobby .gs-pips { display: flex; gap: calc(var(--u) * .2); justify-content: center; margin-top: calc(var(--u) * .3); } #lobby .gs-pips i { width: calc(var(--u) * 1.3); height: calc(var(--u) * .38); background: #D5CFC2; } #lobby .gs-pips i.on { background: var(--or); }\n  #lobby .gs-card { pointer-events: auto; background: var(--paper); border: calc(var(--u) * .3) solid #111; padding: calc(var(--u) * .9) calc(var(--u) * 1.1); display: grid; grid-template-columns: 1fr auto; gap: calc(var(--u) * .7) calc(var(--u) * 1.1); box-shadow: calc(var(--u) * .5) calc(var(--u) * .5) 0 #111; }\n  #lobby .gs-nm small { display: block; color: var(--or); font-weight: 800; font-size: calc(var(--u) * .9); } #lobby .gs-nm b { display: block; font-size: calc(var(--u) * 1.9); font-weight: 900; line-height: 1.15; }\n  #lobby .gs-nm span { display: block; color: #555; font-weight: 700; font-size: calc(var(--u) * .95); margin-top: calc(var(--u) * .2); }\n  #lobby .gs-btns { display: flex; flex-direction: column; gap: calc(var(--u) * .5); justify-content: center; }\n  #lobby .gs-btn { font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.15); padding: calc(var(--u) * .5) calc(var(--u) * 1.2); border: calc(var(--u) * .3) solid #111; background: var(--or); color: #fff; cursor: pointer; white-space: nowrap; transition: transform .1s ease, box-shadow .1s ease; }\n  #lobby .gs-btn small { display: block; font-size: calc(var(--u) * .75); font-weight: 800; opacity: .85; }\n  #lobby .gs-paints { display: flex; flex-wrap: wrap; gap: calc(var(--u) * .4); }\n  #lobby .gs-pt { pointer-events: auto; cursor: pointer; font: inherit; font-weight: 900; font-size: calc(var(--u) * .9); padding: calc(var(--u) * .3) calc(var(--u) * .7); border: calc(var(--u) * .2) dashed #8A867D; background: transparent; color: #3A3730; display: inline-flex; align-items: baseline; gap: calc(var(--u) * .35); transition: transform .12s ease; }\n  #lobby .gs-pt small { font-size: .78em; color: #B07A1E; font-weight: 900; } #lobby .gs-pt.own { border-style: solid; border-color: #111; color: #111; }\n  #lobby .gs-pt:hover { transform: translateY(calc(var(--u) * -.12)); } #lobby .gs-pt.on { background: #111; color: #F2EFE9; border-style: solid; border-color: #111; } #lobby .gs-pt.on small { color: #FFC54A; }\n  #lobby .gs-btn:hover:not(:disabled) { transform: translate(calc(var(--u) * -.2), calc(var(--u) * -.2)); box-shadow: calc(var(--u) * .4) calc(var(--u) * .4) 0 #111; }\n  #lobby .gs-btn.dk { background: #111; } #lobby .gs-btn:disabled { background: #DDD8CC; color: #777; cursor: default; }\n  #lobby .gs-steps { grid-column: 1 / 3; display: grid; grid-template-columns: repeat(4, 1fr); gap: calc(var(--u) * .45); }\n  #lobby .gs-step { border: calc(var(--u) * .2) solid #111; padding: calc(var(--u) * .3) calc(var(--u) * .45); font-size: calc(var(--u) * .78); font-weight: 800; background: #fff; color: #8A877F; line-height: 1.35; }\n  #lobby .gs-step b { display: block; font-size: calc(var(--u) * 1); color: #111; } #lobby .gs-step.on { background: #111; color: #CFCBC2; } #lobby .gs-step.on b { color: var(--or); }\n  #lobby .gs-step.pick { cursor: pointer; transition: transform .12s ease; } #lobby .gs-step.pick:hover { transform: translateY(calc(var(--u) * -.15)); }\n  #lobby .gs-step.on:not(.use) { background: #2A2D33; } #lobby .gs-step.use { box-shadow: 0 0 0 calc(var(--u) * .25) var(--or); }\n  #lobby .gs-stage { position: absolute; left: calc(var(--u) * 64.5); right: calc(var(--u) * 3); top: calc(var(--u) * 9); bottom: calc(var(--u) * 3); display: flex; flex-direction: column; gap: calc(var(--u) * 1); pointer-events: none; animation: lbL .5s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .gs-view { pointer-events: auto; position: relative; flex: 1 1 auto; min-height: 0; background: #15171C; border: calc(var(--u) * .3) solid #111; box-shadow: calc(var(--u) * .6) calc(var(--u) * .6) 0 var(--sc, var(--or)); overflow: hidden; }\n  #lobby .gs-view::before { content: ''; position: absolute; left: -10%; right: -10%; top: 54%; height: calc(var(--u) * 6); background: var(--sc, var(--or)); opacity: .2; transform: skewY(-7deg); }\n  #lobby .gs-view::after { content: ''; position: absolute; left: -10%; right: -10%; top: calc(54% + var(--u) * 7); height: calc(var(--u) * 1); background: var(--sc, var(--or)); opacity: .35; transform: skewY(-7deg); }\n  #lobby .gs-view canvas { position: absolute; inset: 0; width: 100%; height: 100%; cursor: grab; z-index: 1; }\n  #lobby .gs-view .tg { position: absolute; left: calc(var(--u) * 1.2); top: calc(var(--u) * 1); z-index: 2; color: var(--paper); font-size: calc(var(--u) * 2.4); pointer-events: none; }\n  #lobby .gs-view .tg small { display: block; font-size: calc(var(--u) * 1); color: var(--sc, var(--or)); font-weight: 900; margin-top: calc(var(--u) * .3); letter-spacing: .1em; }\n  #lobby .gs-view .lv { position: absolute; right: calc(var(--u) * 1.2); top: calc(var(--u) * 1); z-index: 2; font-size: calc(var(--u) * 2.4); color: var(--or); pointer-events: none; }\n  #lobby .gs-view .hint { position: absolute; left: calc(var(--u) * 1.2); bottom: calc(var(--u) * .8); z-index: 2; color: #8A877F; font-size: calc(var(--u) * .9); font-weight: 800; pointer-events: none; }\n  /* (the user 11-19 「玩家不知道这个枪皮能拖动」: a hand swinging over the preview, plain words, until it is first dragged) */\n  #lobby .gs-drag { position: absolute; left: 50%; bottom: calc(var(--u) * 4.2); z-index: 3; pointer-events: none; display: flex; align-items: center; gap: calc(var(--u) * .5); max-width: 88%; width: max-content; text-align: center; line-height: 1.25; transform: translateX(-50%); background: rgba(17,17,17,.86); color: var(--paper); border: calc(var(--u) * .2) solid var(--sc, var(--or)); box-shadow: calc(var(--u) * .35) calc(var(--u) * .35) 0 var(--sc, var(--or)); padding: calc(var(--u) * .45) calc(var(--u) * .9); font-weight: 900; font-size: calc(var(--u) * 1); transition: opacity .45s ease, transform .45s ease; animation: gsDragIn .5s .35s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .gs-drag.gone { opacity: 0; transform: translateX(-50%) translateY(calc(var(--u) * 1)); }\n  #lobby .gs-drag svg { width: calc(var(--u) * 2.3); height: calc(var(--u) * 2.3); flex: 0 0 auto; color: var(--sc, var(--or)); animation: gsSwipe 1.5s ease-in-out infinite; }\n  #lobby .gs-drag i { font-style: normal; color: var(--sc, var(--or)); font-size: 1.3em; animation: gsArrow 1.5s ease-in-out infinite; } #lobby .gs-drag i.r { animation-delay: .75s; }\n  @keyframes gsSwipe { 0%, 100% { transform: translateX(calc(var(--u) * -.7)) rotate(-10deg); } 50% { transform: translateX(calc(var(--u) * .7)) rotate(10deg); } }\n  @keyframes gsArrow { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }\n  @keyframes gsDragIn { from { opacity: 0; transform: translateX(-50%) translateY(calc(var(--u) * 1.2)); } }\n  #lobby .gs-ev { pointer-events: auto; background: var(--paper); border: calc(var(--u) * .3) solid #111; padding: calc(var(--u) * .7) calc(var(--u) * 1); display: grid; grid-template-columns: 1fr; gap: calc(var(--u) * .55); box-shadow: calc(var(--u) * .5) calc(var(--u) * .5) 0 #111; }\n  #lobby .gs-ev .t b { font-size: calc(var(--u) * 1.3); font-weight: 900; } #lobby .gs-ev .t small { display: block; color: #555; font-weight: 700; font-size: calc(var(--u) * .85); }\n  #lobby .gs-days { display: grid; grid-template-columns: repeat(9, 1fr); gap: calc(var(--u) * .35); }\n  #lobby .gs-day { border: calc(var(--u) * .2) solid #111; background: #fff; height: calc(var(--u) * 3.6); display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: calc(var(--u) * .7); font-weight: 900; color: #999; }\n  #lobby .gs-day img { height: calc(var(--u) * 2.1); max-width: 92%; object-fit: contain; image-rendering: pixelated; filter: grayscale(1) opacity(.45); }\n  #lobby .gs-day.on { background: #FFF1E2; color: var(--or); } #lobby .gs-day.on img { filter: none; } #lobby .gs-day.nx { box-shadow: inset 0 0 0 calc(var(--u) * .2) var(--or); }\n  #lobby .gs-day .fr { font-size: calc(var(--u) * .95); color: #B07A1C; } #lobby .gs-day.on .fr { color: #E08A10; }\n  #lobby .gs-ev .acts { display: flex; gap: calc(var(--u) * .5); justify-content: flex-end; } #lobby .gs-ev .acts .gs-btn { flex: 0 0 auto; }\n  #lobby .gs-ev { display: none; }\n  /* (a phone on its side - the user 11-18 「手机端衣柜过于拥挤 枪型刀型显示不全」: bigger units; the rail narrow; the guns\n     one row and the skins one row, each sliding sideways; the card under them; the preview the right third) */\n  .p-short #lobby.gs { --u: calc(var(--pvh, 1vh) * 2); }\n  .p-short #lobby.gs .wd-tagline { left: calc(var(--u) * 1.2); top: calc(var(--u) * .9); font-size: calc(var(--u) * 1.8); }\n  .p-short #lobby.gs .wd-rail { left: calc(var(--u) * 1.2); top: calc(var(--u) * 5.6); bottom: calc(var(--u) * 1.2); width: calc(var(--u) * 7); gap: calc(var(--u) * .4); overflow-y: auto; }\n  .p-short #lobby.gs .wd-tab small, .p-short #lobby.gs .wd-tab span, .p-short #lobby.gs .wd-tab em { display: none; }\n  .p-short #lobby.gs .wd-tab { padding: calc(var(--u) * .45) calc(var(--u) * .3); min-height: 0; }\n  .p-short #lobby.gs .wd-tab b { font-size: calc(var(--u) * 1.35); }\n  .p-short #lobby .gs-main { left: calc(var(--u) * 9.4); top: calc(var(--u) * 5.6); bottom: calc(var(--u) * 1.2); width: auto; right: calc(var(--u) * 35.5); gap: calc(var(--u) * .55); grid-template-columns: calc(var(--u) * 8) minmax(0, 1fr); }\n  .p-short #lobby .gs-guns { gap: calc(var(--u) * .4); padding: 0 calc(var(--u) * .35) calc(var(--u) * .5) 0; scrollbar-width: none; }\n  .p-short #lobby .gs-gun { flex-direction: column; gap: calc(var(--u) * .1); padding: calc(var(--u) * .25) calc(var(--u) * .3); font-size: calc(var(--u) * 1.15); text-align: center; }\n  .p-short #lobby .gs-gun img { width: calc(var(--u) * 4.6); height: calc(var(--u) * 2.8); }\n  .p-short #lobby .gs-gun em { position: absolute; right: calc(var(--u) * .2); top: calc(var(--u) * .1); margin: 0; }\n  .p-short #lobby .gs-grid { flex: 0 0 auto; display: grid; grid-auto-flow: column; grid-template-columns: none; grid-auto-columns: calc(var(--u) * 12); grid-template-rows: auto; overflow-x: auto; overflow-y: hidden; touch-action: pan-x; padding: calc(var(--u) * .3) 0 calc(var(--u) * .45); scrollbar-width: none; }\n  .p-short #lobby .gs-it .pic { height: calc(var(--u) * 4.6); }\n  .p-short #lobby .gs-it b { font-size: calc(var(--u) * 1.2); }\n  .p-short #lobby .gs-it .set, .p-short #lobby .gs-it .eq { font-size: calc(var(--u) * .9); }\n  .p-short #lobby .gs-card { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: calc(var(--u) * .6) calc(var(--u) * .8); gap: calc(var(--u) * .5) calc(var(--u) * .8); }\n  .p-short #lobby .gs-card .gs-steps { display: none; }\n  .p-short #lobby .gs-pt { font-size: calc(var(--u) * 1.1); }\n  .p-short #lobby .gs-main .wd-foot { flex: 0 0 auto; }\n  .p-short #lobby .gs-stage { left: auto; right: calc(var(--u) * 1.2); width: calc(var(--u) * 33); top: calc(var(--u) * 5.6); bottom: calc(var(--u) * 1.2); }\n  .p-short #lobby .gs-view .hint { display: none; }\n  .p-short #lobby .gs-drag { bottom: calc(var(--u) * 1.4); font-size: calc(var(--u) * 1.1); }\n  .p-short #lobby .gs-view .tg { font-size: calc(var(--u) * 1.8); }"),
          document.head.appendChild(t));
      }
    },
    wt = ["pistol", "revolver", "smg", "ar", "rifle", "sniper", "shotgun", "lmg"],
    kt = { harvest: "#6FAE3E", rank: "#8F6BF2", core: "#14B8C8" },
    xt = {
      harvest: [
        "无特效",
        "击杀：冒出一颗土豆芽，叶子弹开",
        "检视：把枪抛起转一圈接住",
        "终结：对手「噗」地变成一堆滚落的土豆",
      ],
      rank: [
        "无特效",
        "击杀：宝石碎裂闪光（段位颜色）",
        "检视：宝石面朝镜头，一道光扫过枪身",
        "终结：对手化成段位颜色的宝石碎片四散",
      ],
      core: [
        "无特效",
        "击杀：全息故障风图标（RGB 错位、扫描线）",
        "检视：枪身分层展开，露出发光的内部结构",
        "终结：对手像素化溶解成青色方块向上飘散",
      ],
    },
    St = new Map();
  function skinPic(t, e, a) {
    const o = e + "|" + (a || "");
    if (St.has(o)) return St.get(o);
    let s = "";
    try {
      const o = self.XZ,
        i = ITEM_KEY[o.R.keys[e]],
        l = o.g3Icon && o.g3Icon(t.renderer, { id: i, count: 1, xzSkin: a || null });
      s = l ? l.toDataURL() : "";
    } catch (t) {}
    return (s && St.set(o, s), s);
  }
  function knifePic(t, e, a) {
    const o = self.XZ,
      s = o && o.knifeSkinId ? o.knifeSkinId(e, a) : null,
      i = "K" + e + "|" + (s || "");
    if (St.has(i)) return St.get(i);
    let l = "";
    try {
      const a = ITEM_KEY[o.R.keys[e] || e],
        i = o.g3Icon && o.g3Icon(t.renderer, { id: a, count: 1, xzSkin: s });
      l = i ? i.toDataURL() : "";
    } catch (t) {}
    return (l && St.set(i, l), l);
  }
  function demoLights(t, e) {
    const a = (e % 7) / 7,
      o = a < 0.8 ? 1 - a / 0.8 : (a - 0.8) / 0.2,
      s = e % 0.9 < 0.12 && a < 0.8 ? 1 - (e % 0.9) / 0.12 : 0,
      i = a >= 0.8 ? (a - 0.8) / 0.2 : -1,
      l = Math.max(0, Math.round(6 * o));
    return {
      a: [o, o < 0.08 && a < 0.8 ? 1 : 0, s, i],
      b: [
        "lmg" === t ? Math.min(1, 1.3 * a) : 0,
        0.5 + 0.5 * Math.sin(1.3 * e),
        1,
        "rifle" === t && e % 3 < 0.25 ? 1 : 0,
      ],
      c: ["shotgun" === t ? Math.exp((-e % 1.5) / 0.32) : 0, l, -1, 0],
    };
  }
  class PotatoGunSkins extends MenuScreen {
    constructor(t, e, a, o) {
      (super(t, null),
        (this.potato = !0),
        (this.parent = e),
        (this.pauses = !1),
        (this.blurBg = !1),
        (this.bgDim = 0),
        (this.el = null),
        (this.gun = a || "ar"),
        (this.sel = void 0 === o ? void 0 : o),
        (this.busy = !1),
        (this.msg = ""),
        (this.yaw = 70),
        (this.spin = !0));
    }
    get S() {
      return self.XZ && self.XZ.skins;
    }
    layout() {
      this.el || this.mount();
    }
    can() {
      return "undefined" != typeof Account && Account.loggedIn;
    }
    mount() {
      const t = this.game,
        e = this.S;
      (ensureGsCss(),
        t.lobby && (t.lobby.moveTo({ cx: 1.5, tall: 0.8 }, Math.PI - 0.42), (t.lobby.relax = !0)));
      const a = (this.el = document.createElement("div"));
      ((a.id = "lobby"),
        (a.className = "wd gs"),
        (a.innerHTML = `<div class="wd-tagline">${blockText("GUN SKINS")}<span class="gs-coin" title=""><i></i><b class="gs-n">—</b><small class="gs-t"></small></span><button class="gs-fr" data-a="frame" hidden></button></div>\n        <div class="wd-rail">${yt.map(([t, e, a], o) => `<button class="wd-tab ${"gun" === t ? "on" : ""}" data-tab="${t}" style="--i:${o}"><small>${blockText("0" + (o + 1))}</small><span>${blockText(a)}</span><b>${e}</b><em></em></button>`).join("")}</div>\n        <div class="gs-main"><div class="gs-guns"></div><div class="gs-grid"></div><div class="gs-card"></div>\n          <div class="wd-foot"><span class="wd-msg"></span><button class="op-btn op-dark" data-a="back">返回大厅</button></div></div>\n        <div class="gs-stage"><div class="gs-view"><canvas></canvas><div class="tg"></div><div class="lv"></div><div class="hint">拖动转一转 · 灯光演示：弹药耗尽→换弹充能</div>\n          <div class="gs-drag"><i>‹</i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11.5V5a1.6 1.6 0 0 1 3.2 0v5.5m0-1.2a1.6 1.6 0 0 1 3.2 0v2m0-.9a1.6 1.6 0 0 1 3.2 0v4.1A6.5 6.5 0 0 1 12.1 21h-.9a5.6 5.6 0 0 1-4.5-2.3l-2.9-3.9a1.6 1.6 0 0 1 2.5-2L9 15"/></svg><span>按住拖动 · 旋转查看</span><i class="r">›</i></div></div><div class="gs-ev"></div></div>`),
        host().appendChild(a),
        (a.querySelector(".gs-coin").title =
          "天梯 / 淘汰赛每分钟 " +
          e.rules.RATE.ranked +
          " 币，好友约战 / 靶场每分钟 " +
          e.rules.RATE.range +
          " 币；每天第一次赢 +" +
          e.rules.FIRST_WIN +
          (e.rules.CAP > 0 ? "；每天最多 " + e.rules.CAP + " 币" : "；每天不设上限") +
          "（签到另算：" +
          e.rules.STREAK[0] +
          " 起，连签第 7 天起每天 " +
          e.rules.STREAK[e.rules.STREAK.length - 1] +
          "）"),
        a.addEventListener("click", (a) => {
          const o = a.target,
            s = o.closest("[data-tab]");
          if (s) {
            if ("gun" !== s.dataset.tab) {
              this.stop();
              const e = new PotatoWardrobe(t, this.parent);
              ((e.tab = s.dataset.tab),
                (e.sel = Math.max(
                  0,
                  e.items().findIndex((t) => t.on),
                )),
                t.ui.open(e));
            }
            return;
          }
          const i = o.closest("[data-gun]");
          if (i) return ((this.gun = i.dataset.gun), (this.sel = void 0), void this.fill());
          const l = o.closest("[data-sk]");
          if (l)
            return ((this.sel = l.dataset.sk || null), (this.paint = void 0), void this.fill());
          const r = o.closest("[data-lv]");
          if (r && this.sel && e.setLevel)
            return (
              e.setLevel(this.sel, +r.dataset.lv),
              Sound && Sound.click && Sound.click(),
              void this.fill()
            );
          const d = o.closest("[data-a]");
          d && this.act(d.dataset.a);
        }));
      const o = a.querySelector(".gs-view canvas"),
        s = a.querySelector(".gs-drag");
      {
        let t = !1;
        try {
          t = !!localStorage.getItem("potato_gs_dragged");
        } catch (t) {}
        t &&
          setTimeout(() => {
            s && s.classList.add("gone");
          }, 3500);
      }
      (o.addEventListener("pointerdown", (t) => {
        ((this.drag = { x: sp(t)[0], yaw: this.yaw }),
          (this.spin = !1),
          o.setPointerCapture(t.pointerId),
          t.preventDefault(),
          (() => {
            s && s.classList.add("gone");
            try {
              localStorage.setItem("potato_gs_dragged", "1");
            } catch (t) {}
          })());
      }),
        o.addEventListener("pointermove", (t) => {
          this.drag && (this.yaw = this.drag.yaw + 0.5 * (sp(t)[0] - this.drag.x));
        }));
      const up = () => {
        this.drag = null;
      };
      (o.addEventListener("pointerup", up),
        o.addEventListener("pointercancel", up),
        (this.unsub = e.sub(() => this.fill())),
        e.load(!0),
        this.fill());
      const loop = () => {
        this.el && ((this.raf = requestAnimationFrame(loop)), this.draw3d());
      };
      this.raf = requestAnimationFrame(loop);
    }
    list(t = this.gun) {
      const e = this.S,
        a = e.rules,
        o = a.IDS.filter((e) => a.parse(e).gun === t);
      return [null, ...o.filter((t) => e.owns(t)), ...o.filter((t) => !e.owns(t))];
    }
    how(t) {
      const e = this.S.rules,
        a = e.parse(t);
      return a
        ? "harvest" === a.set
          ? "免费送给所有人"
          : "rank" === a.set
            ? "本赛季达到「" + e.TIER_CN[a.tier] + "」段位解锁"
            : e.coreHow
              ? e.coreHow(gateOf())
              : "关注 UP 主解锁（8 把枪一起）"
        : "";
    }
    fill() {
      const t = this.el,
        e = this.game,
        a = this.S;
      if (!t || !a) return;
      const o = a.rules,
        s = a.v,
        q = (e) => t.querySelector(e);
      ((q(".gs-n").textContent = s ? s.coins : "—"),
        (q(".gs-t").textContent = s
          ? s.cap > 0
            ? "今日 " + s.today + " / " + s.cap
            : "今日已得 " + s.today
          : this.can()
            ? "读取中…"
            : "登录后可用"));
      {
        const t = q(".gs-fr");
        if (t) {
          const e = !!(s && s.frames && s.frames.includes("harvest"));
          ((t.hidden = !e || !this.can()),
            (t.textContent =
              s && "harvest" === s.frame ? "取下「丰收」名牌框" : "戴上「丰收」名牌框"),
            t.classList.toggle("on", !(!s || "harvest" !== s.frame)));
        }
      }
      t.querySelectorAll("[data-tab]").forEach((t) => {
        if ("gun" !== t.dataset.tab)
          try {
            const a = Object.assign(Object.create(PotatoWardrobe.prototype), { look: {}, game: e })
              .items(t.dataset.tab)
              .filter((t) => null !== t.v && !t.arm);
            t.querySelector("em").textContent =
              a.filter((t) => !t.locked).length + " / " + a.length;
          } catch (t) {}
        else t.querySelector("em").textContent = (s ? s.own.length : 0) + " / " + o.IDS.length;
      });
      const i =
        wt
          .map((t) => {
            const s = a.equipped(t);
            return `<button class="gs-gun ${t === this.gun ? "on" : ""}" data-gun="${t}"><img src="${skinPic(e, t, s)}" alt=""><span>${esc(o.GUN_CN[t])}</span>${s ? "<em>皮</em>" : ""}</button>`;
          })
          .join("") +
        (o.KNIVES
          ? (() => {
              const t = (s && s.kn) || { key: "knife_combat", paint: null };
              return `<button class="gs-gun ${"knife" === this.gun ? "on" : ""}" data-gun="knife"><img src="${knifePic(e, t.key, t.paint)}" alt=""><span>刀</span>${t.paint ? "<em>涂</em>" : ""}</button>`;
            })()
          : "");
      {
        const t = q(".gs-guns");
        if (t.__h !== i) {
          const e = t.scrollTop;
          ((t.innerHTML = i), (t.__h = i), (t.scrollTop = e));
        }
        if (!t.__sc) {
          t.__sc = !0;
          const more = () =>
            t.classList.toggle("more", t.scrollTop + t.clientHeight < t.scrollHeight - 4);
          (t.addEventListener("scroll", more, { passive: !0 }),
            setTimeout(more, 60),
            addEventListener("resize", more));
        }
      }
      {
        const t = q(".gs-view .hint");
        t &&
          (t.textContent =
            "knife" === this.gun ? "拖动转一转" : "拖动转一转 · 灯光演示：弹药耗尽→换弹充能");
      }
      if ("knife" === this.gun) return (this.fillKnife(), void this.foot());
      const l = this.list();
      (void 0 === this.sel &&
        (this.sel = a.equipped(this.gun) || l.find((t) => t && a.owns(t)) || null),
        (q(".gs-grid").innerHTML = l
          .map((t, s) => {
            const i = t ? o.parse(t) : null,
              l = !t || a.owns(t),
              r = t ? a.level(t) : 0,
              d = (a.equipped(this.gun) || null) === t;
            return `<button class="gs-it ${l ? "" : "lk"} ${t === this.sel ? "sel" : ""}" data-sk="${t || ""}" style="--i:${s};--sc:${i ? kt[i.set] : "#888"}">\n          ${i ? `<i class="set">${"rank" === i.set ? "晋升" : "core" === i.set ? "CORE" : "丰收节"}</i>` : ""}${d ? '<i class="eq">装备中</i>' : ""}\n          <div class="pic"><img src="${skinPic(e, this.gun, t)}" alt=""></div><b>${t ? esc(a.name(t).replace("晋升 · ", "")) : "默认涂装"}</b>\n          <div class="gs-pips">${t ? [1, 2, 3, 4].map((t) => `<i class="${t <= r && l ? "on" : ""}"></i>`).join("") : ""}</div></button>`;
          })
          .join("")));
      const r = this.sel,
        d = r ? o.parse(r) : null,
        u = !r || a.owns(r),
        b = r ? (a.maxLevel ? a.maxLevel(r) : a.level(r)) : 1,
        h = r ? a.level(r) : 1,
        p = (a.equipped(this.gun) || null) === r,
        v = r && b < 4 ? o.PRICE[b] : 0,
        m = s ? s.coins : 0;
      q(".gs-card").innerHTML =
        `<div class="gs-nm"><small>${d ? ("rank" === d.set ? "晋升 · 段位皮" : "core" === d.set ? "薯核 CORE · 三连皮" : "薯光丰收节 · 活动皮") : "默认"} · ${esc(o.GUN_CN[this.gun])}${u ? "" : " · 未解锁"}</small>\n          <b>${r ? esc(a.name(r)) : "默认涂装"}</b><span>${r ? (u ? (h < b ? "已解锁 " + b + " 级 · 正在使用 " + h + " 级（" + esc(xt[d.set][h - 1]) + "）" : "当前 " + b + " 级 · " + esc(xt[d.set][b - 1])) + (b > 1 ? " · 点下面的等级切换" : "") : esc(this.how(r))) : "枪械本来的样子"}</span></div>\n        <div class="gs-btns">${u ? `<button class="gs-btn" data-a="equip" ${p || this.busy || !this.can() ? "disabled" : ""}>${p ? "已装备" : "装备"}</button>` : d && "core" === d.set ? `<button class="gs-btn dk" data-a="triple">去获取<small>${"triple" === gateOf() ? "关注 + 三连" : "关注 UP 主"}</small></button>` : d && "rank" === d.set ? `<button class="gs-btn dk" data-a="rank">去获取<small>打排位到「${esc(o.TIER_CN[d.tier])}」</small></button>` : `<button class="gs-btn dk" disabled>${d && "harvest" === d.set ? "签到领取" : "未解锁"}</button>`}\n          ${r && u ? (b >= 4 ? '<button class="gs-btn dk" disabled>已满级</button>' : `<button class="gs-btn dk" data-a="up" ${this.busy || m < v || !this.can() ? "disabled" : ""}>升到 ${b + 1} 级<small>${v} 土豆币${m < v ? " · 还差 " + (v - m) : ""}</small></button>`) : ""}</div>\n        ${d ? `<div class="gs-steps">${[1, 2, 3, 4].map((t) => `<div class="gs-step ${u && t <= b ? "on" : ""} ${u && t === h ? "use" : ""} ${u && t <= b && b > 1 ? "pick" : ""}" ${u && t <= b && b > 1 ? `data-lv="${t}"` : ""}><b>${t} 级${u && t === h ? " · 使用中" : t > 1 && !(u && t <= b) ? " · " + o.PRICE.slice(1, t).reduce((t, e) => t + e, 0) + " 币" : ""}</b>${esc(xt[d.set][t - 1])}</div>`).join("")}</div>` : ""}`;
      (q(".gs-view").style.setProperty(
        "--sc",
        d
          ? "rank" === d.set
            ? (self.XZ.skinUtil && self.XZ.skinUtil.TIER_COL[d.tier]) || kt.rank
            : kt[d.set]
          : "#FF5A1F",
      ),
        (q(".gs-view .tg").innerHTML =
          blockText(d ? o.SETS[d.set].en : "DEFAULT") +
          `<small>${r ? esc(a.name(r)) : "默认涂装"} · ${esc(o.GUN_CN[this.gun])}</small>`),
        (q(".gs-view .lv").innerHTML = r && u ? blockText("LV " + h) : ""));
      const y = s && s.event,
        w = s ? s.days : 0;
      if (y) {
        const t = Math.max(0, Math.ceil((y.end - Date.now()) / 864e5));
        q(".gs-ev").innerHTML =
          `<div class="t"><b>薯光丰收节 · 签到 ${Math.min(w, y.days)} / ${y.days} 天${w >= y.days ? " · 奖励已领完" : ""}</b><small>${y.open ? "累计签到（不用连续）· 每天 +" + o.CHECKIN + " 土豆币 · 还剩 " + t + " 天" : "活动不在进行中"}</small></div>\n          <div class="acts">${s.frames.includes("harvest") ? `<button class="gs-btn dk" data-a="frame">${"harvest" === s.frame ? "取下名牌框" : "戴上「丰收」名牌框"}</button>` : ""}<button class="gs-btn" data-a="sign" ${!y.open || s.signed || this.busy || !this.can() ? "disabled" : ""}>${s.signed ? "今天已签到" : "签到"}<small>+${o.CHECKIN} 土豆币</small></button></div>\n          <div class="gs-days">${o.HARVEST.map((t, a) => `<div class="gs-day ${a < w ? "on" : ""} ${a !== w || s.signed ? "" : "nx"}" title="第 ${a + 1} 天：${esc(o.GUN_CN[t])}"><img src="${skinPic(e, t, "harvest:" + t)}" alt="">第 ${a + 1} 天</div>`).join("")}\n            <div class="gs-day ${w >= 9 ? "on" : ""} ${8 !== w || s.signed ? "" : "nx"}" title="第 9 天：「丰收」名牌框（匹配界面用）"><span class="fr">丰收</span>名牌框</div></div>`;
      } else
        q(".gs-ev").innerHTML =
          `<div class="t"><b>薯光丰收节</b><small>${this.can() ? "读取中…" : "登录后可以签到领皮肤"}</small></div>`;
      this.foot();
    }
    fillKnife() {
      const t = this.el,
        e = this.game,
        a = this.S,
        o = a.rules,
        s = a.v,
        q = (e) => t.querySelector(e),
        own = (t) => !!(s && s.knives && s.knives.includes(t)) || "knife_combat" === t,
        i = (s && s.kn) || { key: "knife_combat", paint: null };
      (o.KNIVES.includes(this.sel) || ((this.sel = i.key), (this.paint = i.paint)),
        void 0 === this.paint && (this.paint = this.sel === i.key ? i.paint : null),
        (q(".gs-grid").innerHTML = o.KNIVES.map((t, a) => {
          const s = own(t),
            l = i.key === t,
            r = l ? i.paint : null;
          return `<button class="gs-it ${s ? "" : "lk"} ${t === this.sel ? "sel" : ""}" data-sk="${t}" style="--i:${a};--sc:#C9A15B">${"knife_combat" === t ? '<i class="set">初始</i>' : ""}${l ? '<i class="eq">装备中</i>' : ""}\n          <div class="pic"><img src="${knifePic(e, t, r)}" alt=""></div><b>${esc(o.KNIFE_CN[t])}</b><div class="gs-pips"></div></button>`;
        }).join("")));
      const l = this.sel,
        r = own(l),
        d = ((t) => (s && s.kp && s.kp[t]) || [])(l),
        u = this.paint,
        b = !u || d.includes(u),
        h = i.key === l && (i.paint || null) === (u || null),
        p = s ? s.coins : 0;
      ((q(".gs-card").innerHTML =
        `<div class="gs-nm"><small>刀 · 所有刀伤害一样${r ? "" : " · 未解锁"}</small><b>${esc(o.KNIFE_CN[l])}${u ? " · " + esc(o.PAINT_CN[u]) : ""}</b><span>${r ? "已拥有 · " + esc(o.knifeHow ? o.knifeHow(l, gateOf()) : o.KNIFE_HOW[l]) : "解锁：" + esc(o.knifeHow ? o.knifeHow(l, gateOf()) : o.KNIFE_HOW[l])}</span></div>\n        <div class="gs-paints"><button class="gs-pt ${u ? "" : "on"}" data-pt="">原色</button>${o.PAINTS.map((t) => `<button class="gs-pt ${u === t ? "on" : ""} ${d.includes(t) ? "own" : ""}" data-pt="${t}">${esc(o.PAINT_CN[t])}${d.includes(t) ? "" : "<small>" + o.PAINT_PRICE + "</small>"}</button>`).join("")}</div>\n        <div class="gs-btns">${r ? (b ? `<button class="gs-btn" data-a="kequip" ${h || this.busy || !this.can() ? "disabled" : ""}>${h ? "已装备" : "装备"}</button>` : `<button class="gs-btn" data-a="kpaint" ${this.busy || p < o.PAINT_PRICE || !this.can() ? "disabled" : ""}>买涂装<small>${o.PAINT_PRICE} 土豆币${p < o.PAINT_PRICE ? "（不够）" : ""}</small></button>`) : `<button class="gs-btn dk" data-a="triple" data-k="knife">去获取<small>${"triple" === gateOf() ? "关注 + 三连" : "关注 UP 主"}</small></button>`}</div>\n        <div class="gs-steps"><div class="gs-step on"><b>轻击 · 左键</b>7 伤害，背后 14</div><div class="gs-step on"><b>重击 · 右键</b>13 伤害，背后 20（一刀倒）</div><div class="gs-step on"><b>检视 · F</b>每把刀各有一套动作</div></div>`),
        t.querySelectorAll(".gs-pt").forEach((t) =>
          t.addEventListener("click", (e) => {
            (e.stopPropagation(), (this.paint = t.dataset.pt || null), this.fill());
          }),
        ));
      (q(".gs-view").style.setProperty("--sc", "#C9A15B"),
        (q(".gs-view .tg").innerHTML =
          blockText("KNIFE") +
          `<small>${esc(o.KNIFE_CN[l])}${u ? " · " + esc(o.PAINT_CN[u]) : ""}</small>`),
        (q(".gs-view .lv").innerHTML = ""));
    }
    foot() {
      if (!this.el) return;
      const t = this.S;
      this.el.querySelector(".wd-msg").textContent =
        this.msg ||
        (this.can()
          ? t && !t.v && t.err
            ? "读不到皮肤和土豆币：" + t.err
            : ""
          : "登录后才能领取、装备和升级皮肤");
    }
    async act(t) {
      const e = this.game,
        a = this.S;
      if ("back" !== t) {
        if ("triple" === t) {
          const t = "knife" === this.gun,
            a = this.S.rules;
          return void e.ui.open(
            new PotatoGet(e, this, {
              need: self.Potato.needFor(t ? "knife" : "core"),
              what: t ? a.KNIFE_CN[this.sel] || "刀" : "薯核 CORE · " + (a.GUN_CN[this.gun] || ""),
            }),
          );
        }
        if ("rank" !== t)
          if (this.can()) {
            ((this.busy = !0), (this.msg = ""), this.fill());
            try {
              if ("kequip" === t)
                (await a.knife(this.sel, this.paint || null),
                  (this.msg =
                    "每局都会带：" +
                    a.rules.KNIFE_CN[this.sel] +
                    (this.paint ? " · " + a.rules.PAINT_CN[this.paint] : "")));
              else if ("kpaint" === t)
                (await a.paint(this.sel, this.paint),
                  (this.msg = "买到了涂装「" + a.rules.PAINT_CN[this.paint] + "」，点装备就能用"),
                  Sound && Sound.click && Sound.click());
              else if ("equip" === t)
                (await a.equip(this.gun, this.sel),
                  (this.msg = this.sel ? "已装备：" + a.name(this.sel) : "已换回默认涂装"));
              else if ("up" === t) {
                const t = await a.upgrade(this.sel);
                ((this.msg =
                  "升到 " + t.level + " 级！" + xt[a.rules.parse(this.sel).set][t.level - 1]),
                  Sound && Sound.click && Sound.click());
              } else if ("sign" === t) {
                const t = await a.checkin();
                this.msg =
                  "签到第 " +
                  t.day +
                  " 天" +
                  (t.reward
                    ? "：获得" +
                      (t.reward.startsWith("frame:")
                        ? "「丰收」名牌框"
                        : a.name(t.reward) + " · " + a.rules.GUN_CN[a.rules.parse(t.reward).gun])
                    : "") +
                  (t.add ? " · +" + t.add + " 土豆币" : "");
              } else if ("frame" === t) {
                const t = a.v;
                (await a.frame(t && "harvest" === t.frame ? null : "harvest"),
                  (this.msg = a.v && a.v.frame ? "匹配界面会显示「丰收」名牌框" : "已取下名牌框"));
              }
            } catch (t) {
              this.msg = t.message;
            }
            ((this.busy = !1), this.fill());
          } else e.ui.open(new LoginScreen(e, () => e.ui.open(this)));
        else e.ui.open(new PotatoRanked(e, this));
      } else this.back();
    }
    draw3d() {
      const t = this.el,
        e = self.XZ;
      if (!t || !e || !e.skinPreview) return;
      const a = t.querySelector(".gs-view canvas"),
        o = a.getBoundingClientRect(),
        s = Math.min(2, devicePixelRatio || 1),
        i = Math.max(64, Math.min(960, Math.round(o.width * s))),
        l = Math.max(64, Math.min(640, Math.round(o.height * s))),
        r = performance.now() / 1e3;
      this.spin && (this.yaw = 70 + 38 * Math.sin(0.45 * r));
      try {
        if ("knife" === this.gun) {
          const t = this.sel || "knife_combat";
          e.skinPreview(
            this.game.renderer,
            t,
            e.knifeSkinId ? e.knifeSkinId(t, this.paint) : null,
            { w: i, h: l, yaw: this.yaw, pitch: 12, zoom: 0.8, U: demoLights("pistol", r), cv: a },
          );
        } else
          e.skinPreview(this.game.renderer, this.gun, this.sel || null, {
            w: i,
            h: l,
            yaw: this.yaw,
            pitch: 12,
            zoom: 0.92,
            U: demoLights(this.gun, r),
            cv: a,
          });
      } catch (t) {}
    }
    stop() {
      (this.raf && cancelAnimationFrame(this.raf),
        (this.raf = 0),
        this.unsub && this.unsub(),
        (this.unsub = null));
    }
    back() {
      this.stop();
      const t = this.game;
      ("undefined" != typeof Skins && Skins.setPreview && Skins.setPreview(null),
        t.lobby && (t.lobby.moveTo(l, Math.PI + 0.3), (t.lobby.relax = !1)),
        backTo(t, this.parent));
    }
    onEsc() {
      this.back();
    }
    close() {
      (this.stop(), this.el && (unmount(this.el), (this.el = null)));
    }
    draw(t) {}
    mouseDown() {}
  }
  self.PotatoGunSkins = PotatoGunSkins;
  const ciCss = () => {
    if ((ensureCss(), !document.getElementById("ci-css"))) {
      const t = document.createElement("style");
      ((t.id = "ci-css"),
        (t.textContent =
          '\n  #lobby.ci .ci-dim { position: absolute; inset: 0; background: rgba(8,9,12,.62); pointer-events: auto; animation: lbFade .2s ease-out; }\n  #lobby .ci-card { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(calc(var(--u) * 78), calc(var(--pvw, 1vw) * 94)); max-height: calc(var(--pvh, 1vh) * 92); overflow-y: auto;\n    background: #F2EFE9; color: #111; border: calc(var(--u) * .35) solid #111; box-shadow: calc(var(--u) * .8) calc(var(--u) * .8) 0 #6FAE3E; padding: calc(var(--u) * 1.4) calc(var(--u) * 1.8);\n    display: flex; flex-direction: column; gap: calc(var(--u) * 1); pointer-events: auto; animation: ciIn .35s cubic-bezier(.2,.9,.25,1); }\n  @keyframes ciIn { from { opacity: 0; transform: translate(-50%, -46%) scale(.96); } }\n  #lobby .ci-top { display: flex; align-items: flex-end; gap: calc(var(--u) * 1.2); flex-wrap: wrap; }\n  #lobby .ci-top .rk-title { font-size: calc(var(--u) * 3); color: #111; }\n  #lobby .ci-top b { font-size: calc(var(--u) * 1.8); font-weight: 900; } #lobby .ci-top small { display: block; font-size: calc(var(--u) * .95); color: #5A574F; font-weight: 800; }\n  #lobby .ci-prog { margin-left: auto; text-align: right; } #lobby .ci-prog b { font: 900 calc(var(--u) * 2.6)/1 "Bahnschrift", "Arial Black", sans-serif; color: #6FAE3E; } #lobby .ci-prog b em { font-style: normal; font-size: .5em; color: #111; }\n  #lobby .ci-days { display: grid; grid-template-columns: repeat(9, 1fr); gap: calc(var(--u) * .5); }\n  #lobby .ci-day { position: relative; background: #fff; border: calc(var(--u) * .22) solid #111; padding: calc(var(--u) * .4) calc(var(--u) * .25) calc(var(--u) * .5); text-align: center; display: flex; flex-direction: column; align-items: center; gap: calc(var(--u) * .25); min-width: 0; }\n  #lobby .ci-day i { font-style: normal; font-size: calc(var(--u) * .8); font-weight: 900; color: #6A665E; }\n  #lobby .ci-day img { width: 100%; aspect-ratio: 1.4; object-fit: contain; image-rendering: pixelated; }\n  #lobby .ci-day span { font-size: calc(var(--u) * .78); font-weight: 900; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }\n  #lobby .ci-day em { font-style: normal; font-size: calc(var(--u) * .72); font-weight: 900; background: #C9A15B; color: #111; padding: 0 calc(var(--u) * .3); white-space: nowrap; }\n  #lobby .ci-day .fr { width: 100%; aspect-ratio: 1.4; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: calc(var(--u) * 1.1); border: calc(var(--u) * .25) solid #6FAE3E; color: #4E8A24; background: #F3F8EA; }\n  #lobby .ci-day.on { background: #E9F3DC; border-color: #6FAE3E; } #lobby .ci-day.on::after { content: \'✓\'; position: absolute; right: calc(var(--u) * .25); top: 0; color: #4E8A24; font-weight: 900; font-size: calc(var(--u) * 1.1); }\n  #lobby .ci-day.nx { box-shadow: 0 0 0 calc(var(--u) * .3) #FF5A1F; animation: ciPulse 1.4s ease-in-out infinite; }\n  @keyframes ciPulse { 50% { box-shadow: 0 0 0 calc(var(--u) * .55) rgba(255,90,31,.35); } }\n  #lobby .ci-foot { display: flex; align-items: center; gap: calc(var(--u) * 1); flex-wrap: wrap; }\n  #lobby .ci-msg { flex: 1; min-width: calc(var(--u) * 20); font-weight: 900; font-size: calc(var(--u) * 1.05); color: #4E8A24; } #lobby .ci-msg.bad { color: #C8321F; }\n  #lobby .ci-btn { pointer-events: auto; cursor: pointer; font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.5); padding: calc(var(--u) * .6) calc(var(--u) * 2); border: calc(var(--u) * .3) solid #111; background: #FF5A1F; color: #111; box-shadow: calc(var(--u) * .4) calc(var(--u) * .4) 0 #111; transition: transform .12s ease; }\n  #lobby .ci-btn small { display: block; font-size: .6em; } #lobby .ci-btn:hover { transform: translateY(calc(var(--u) * -.15)); } #lobby .ci-btn:disabled { background: #D8D3C8; cursor: default; transform: none; }\n  #lobby .ci-btn.lt { background: transparent; font-size: calc(var(--u) * 1.1); box-shadow: none; }\n  #lobby .tb.lb-sign { width: auto; padding: 0 calc(var(--u) * 1.1); font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.3); color: #111; position: relative; }\n  #lobby .lb-sign .lb-dot { position: absolute; right: calc(var(--u) * -.5); top: calc(var(--u) * -.5); width: calc(var(--u) * 1); height: calc(var(--u) * 1); background: #E0301E; border: calc(var(--u) * .2) solid #111; display: none; }\n  #lobby .lb-sign.dot .lb-dot { display: block; } #lobby .lb-sign.dot { background: #FFD24A; }\n  .p-short #lobby .ci-day span, .p-short #lobby .ci-day em { font-size: calc(var(--u) * .95); }\n  /* (the new sign-in: a week of coin piles growing day by day) */\n  #lobby .ci2 { box-shadow: calc(var(--u) * .8) calc(var(--u) * .8) 0 #F2B705; overflow: visible; }\n  #lobby .ci2 .ci-prog b { color: #E08A10; } #lobby .ci2 .ci-prog small { display: block; color: #6A665E; font-weight: 800; font-size: calc(var(--u) * .85); }\n  #lobby .ci2-days { display: grid; grid-template-columns: repeat(6, 1fr) 1.35fr; gap: calc(var(--u) * .6); align-items: end; }\n  #lobby .ci2-day { position: relative; background: #fff; border: calc(var(--u) * .22) solid #111; padding: calc(var(--u) * .5) calc(var(--u) * .3) calc(var(--u) * .55); display: flex; flex-direction: column; align-items: center; gap: calc(var(--u) * .35); animation: lbUp .4s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(var(--i) * 45ms); }\n  #lobby .ci2-day i { font-style: normal; font-size: calc(var(--u) * .8); font-weight: 900; color: #6A665E; white-space: nowrap; }\n  #lobby .ci2-day span { font: 900 calc(var(--u) * 1.35)/1 "Bahnschrift", "Arial Black", sans-serif; color: #111; }\n  #lobby .ci2-day .pile { position: relative; width: calc(var(--u) * 3.2); height: calc(var(--u) * 3.4); }\n  #lobby .ci2-day .pile b { position: absolute; left: 50%; bottom: calc(var(--k) * var(--u) * .5); width: calc(var(--u) * 2.6); height: calc(var(--u) * 1.1); margin-left: calc(var(--u) * -1.3 + (var(--k) - 2) * var(--u) * .08); border-radius: 50%; background: radial-gradient(ellipse at 40% 35%, #FFE89A 0 30%, #F2B705 55%, #B57B06 100%); border: calc(var(--u) * .15) solid #6E4A08; }\n  #lobby .ci2-day.big { background: #FFF6DC; border-color: #B57B06; } #lobby .ci2-day.big span { color: #B57B06; font-size: calc(var(--u) * 1.7); }\n  #lobby .ci2-day.done { background: #FFF1C9; border-color: #E0A417; } #lobby .ci2-day.done::after { content: \'✓\'; position: absolute; right: calc(var(--u) * .3); top: calc(var(--u) * .1); font-weight: 900; color: #B57B06; font-size: calc(var(--u) * 1.1); }\n  #lobby .ci2-day.now { box-shadow: 0 0 0 calc(var(--u) * .3) #FF5A1F; animation: lbUp .4s cubic-bezier(.2,.9,.25,1) backwards, ciPulse 1.4s ease-in-out .5s infinite; transform: translateY(calc(var(--u) * -.4)); }\n  #lobby .ci2-note { font-size: calc(var(--u) * .85); font-weight: 800; color: #6A665E; }\n  #lobby .ci2-burst { position: absolute; left: 50%; top: 55%; pointer-events: none; }\n  #lobby .ci2-burst b { position: absolute; width: calc(var(--u) * 1.4); height: calc(var(--u) * 1.4); border-radius: 50%; background: radial-gradient(circle at 40% 35%, #FFE89A 0 30%, #F2B705 60%, #B57B06 100%); border: calc(var(--u) * .12) solid #6E4A08; animation: ciCoin 1s cubic-bezier(.2,.8,.3,1) var(--d) forwards; opacity: 0; }\n  @keyframes ciCoin { 0% { opacity: 1; transform: rotate(var(--a)) translateY(0) scale(.6); } 70% { opacity: 1; } 100% { opacity: 0; transform: rotate(var(--a)) translateY(calc(var(--u) * -9)) scale(1); } }\n  #lobby .ci2-burst em { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); font: 900 calc(var(--u) * 3.4)/1 "Bahnschrift", "Arial Black", sans-serif; color: #E08A10; -webkit-text-stroke: calc(var(--u) * .12) #111; font-style: normal; animation: ciPlus 1.2s ease-out forwards; }\n  @keyframes ciPlus { 0% { opacity: 0; transform: translate(-50%, -20%) scale(.6); } 20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); } 100% { opacity: 0; transform: translate(-50%, -160%) scale(1); } }\n  .p-short #lobby .ci2-day span { font-size: calc(var(--u) * 1.2); } .p-short #lobby .ci2-day i { font-size: calc(var(--u) * .9); }\n  '),
        document.head.appendChild(t));
    }
  };
  ciCss();
  class PotatoCheckin extends MenuScreen {
    constructor(t, e) {
      (super(t, null),
        (this.potato = !0),
        (this.parent = e),
        (this.pauses = !1),
        (this.blurBg = !1),
        (this.bgDim = 0),
        (this.el = null),
        (this.msg = ""),
        (this.bad = !1),
        (this.busy = !1));
    }
    get S() {
      return self.XZ && self.XZ.skins;
    }
    can() {
      return "undefined" != typeof Account && Account.loggedIn;
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      const t = this.game;
      (ciCss(), ensureGsCss());
      const e = (this.el = document.createElement("div"));
      ((e.id = "lobby"),
        (e.className = "ci"),
        host().appendChild(e),
        e.addEventListener("click", (e) => {
          if (e.target.classList.contains("ci-dim")) return void this.back();
          const a = e.target.closest("[data-a]");
          a &&
            ("back" === a.dataset.a
              ? this.back()
              : "sign" === a.dataset.a
                ? this.sign()
                : "login" === a.dataset.a &&
                  t.ui.open(
                    new LoginScreen(t, () => t.ui.open(new PotatoCheckin(t, this.parent))),
                  ));
        }));
      const a = this.S;
      (a && ((this.unsub = a.sub(() => this.render())), a.load(!0)), this.render());
    }
    render() {
      const t = this.el,
        e = this.S;
      if (!t) return;
      const a = e && e.v,
        o = (a && a.sign) || { signed: !1, streak: 0, total: 0, next: 30 },
        s = (a && a.streak) || [300, 400, 500, 600, 700, 800, 1e3],
        i = 0 | o.streak,
        l = o.signed ? i : i + 1,
        r = Math.min(7, l),
        d = s
          .map((t, e) => {
            const a = e + 1,
              s = a < r || (a === r && o.signed),
              i = a === r,
              l = Math.min(5, 1 + Math.floor(0.7 * e));
            return `<div class="ci2-day ${s ? "done" : ""} ${i && !o.signed ? "now" : ""} ${7 === a ? "big" : ""}" style="--i:${e}"><i>${7 === a ? "第 7 天起" : "第 " + a + " 天"}</i>\n          <div class="pile">${Array.from({ length: l }, (t, e) => `<b style="--k:${e}"></b>`).join("")}</div><span>+${t}</span></div>`;
          })
          .join("");
      let u;
      if (
        ((u = this.can()
          ? a
            ? o.signed
              ? `<button class="ci-btn" disabled>今天已签到<small>明天 +${o.next} 土豆币</small></button>`
              : `<button class="ci-btn" data-a="sign" ${this.busy ? "disabled" : ""}>签到<small>+${o.next} 土豆币</small></button>`
            : '<button class="ci-btn" disabled>读取中…</button>'
          : '<button class="ci-btn" data-a="login">登录后签到</button>'),
        (t.innerHTML = `<div class="ci-dim"></div><div class="ci-card ci2">\n        <div class="ci-top"><div class="rk-title">${blockText("CHECK-IN")}</div><div><b>每日签到</b><small>连续签到土豆币越来越多 · 第 7 天起每天 ${s[6]} · 断签从第 1 天重新开始</small></div>\n          <div class="ci-prog"><b>${i}<em> 天连续</em></b><small>累计签到 ${0 | o.total} 天${a ? " · 土豆币 " + a.coins : ""}</small></div></div>\n        <div class="ci2-days">${d}</div>\n        <div class="ci2-note">土豆币靠签到和游玩获得（天梯、淘汰赛每分钟 5 个，约战、靶场每分钟 3 个，每天第一次赢 +50），用来升级枪皮</div>\n        <div class="ci-foot"><div class="ci-msg ${this.bad ? "bad" : ""}">${esc(this.msg || (e && !a && e.err ? "读不到签到记录：" + e.err : ""))}</div>${u}<button class="ci-btn lt" data-a="back">关闭</button></div>\n        ${this.burst ? `<div class="ci2-burst">${Array.from({ length: 14 }, (t, e) => `<b style="--a:${25.7 * e}deg;--d:${(e % 3) * 0.06}s"></b>`).join("")}<em>+${this.burst}</em></div>` : ""}</div>`),
        this.burst)
      ) {
        const t = this.burst;
        setTimeout(() => {
          this.burst === t && (this.burst = 0);
        }, 1300);
      }
    }
    async sign() {
      const t = this.S;
      if (t && !this.busy) {
        ((this.busy = !0), (this.msg = ""), (this.bad = !1), this.render());
        try {
          const e = await t.checkin();
          ((this.msg =
            "签到成功！连续 " +
            e.day +
            " 天，+" +
            e.add +
            " 土豆币" +
            (e.add < e.want ? "（今天的土豆币已到上限）" : "")),
            (this.burst = e.add || 0));
          try {
            Sound && Sound.click && Sound.click();
          } catch (t) {}
        } catch (t) {
          ((this.msg = t.message), (this.bad = !0));
        }
        ((this.busy = !1), this.render());
      }
    }
    back() {
      backTo(this.game, this.parent);
    }
    onEsc() {
      this.back();
    }
    close() {
      (this.unsub && (this.unsub(), (this.unsub = null)),
        this.el && (unmount(this.el), (this.el = null)));
    }
    draw(t) {}
    mouseDown() {}
  }
  self.PotatoCheckin = PotatoCheckin;
  const Ft = UI.prototype.open;
  UI.prototype.open = function (t) {
    return (
      t &&
        !t.potato &&
        "undefined" != typeof WardrobeScreen &&
        t instanceof WardrobeScreen &&
        (t = new PotatoWardrobe(this.game, t.parent)),
      Ft.call(this, t)
    );
  };
  const At = [
      {
        id: "1v1",
        col: "#FF5A1F",
        tag: "1V1",
        t: "天梯 1V1",
        s: "单挑 · 同段位优先",
        sub: "第一赛季 · 五局三胜 · 打满五局",
        go: "开始匹配",
        em: "同段位优先 · 平均 1 分钟内",
        rules: ["五局三胜，打满五局", "段位越高，加分越少", "赢强者多加，输弱者多扣"],
      },
      {
        id: "2v2",
        col: "#19C79A",
        tag: "2V2",
        t: "2V2 组队",
        s: "好友组队 · 随机匹配",
        sub: "第一赛季 · 两人一队 · 打满五局",
        go: "开始匹配",
        em: "可以和好友组队，也可以随机匹配",
        rules: ["和好友组队或随机匹配", "队友之间没有伤害", "一方全倒，这局结束"],
      },
      {
        id: "tour",
        col: "#FFB020",
        tag: "8P",
        t: "8 人淘汰赛",
        s: "八强 → 半决赛 → 决赛",
        sub: "8 人 · 单败淘汰 · 每场先胜 3 局",
        go: "报名淘汰赛",
        em: "凑满 8 人开赛",
        rules: ["每场先胜 3 局，输一场就出局", "每局随机抽一把枪", "同轮出局按伤害排名"],
      },
    ],
    mkFace = () => `<img class="wd-face" src="${faceIcon()}" alt="">`;
  const Et = { easy: 10, normal: 25, hard: 50 },
    Ct = 800;
  class PotatoRanked extends MenuScreen {
    constructor(t, e) {
      (super(t, null),
        (this.potato = !0),
        (this.parent = e),
        (this.pauses = !1),
        (this.blurBg = !1),
        (this.bgDim = 0),
        (this.el = null),
        (this.rec = null),
        (this.top = null));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      const t = this.game,
        e = self.XZ && self.XZ.ladder;
      self.XZ;
      (ensureCss(),
        t.lobby && t.lobby.moveTo({ cx: 0.87, tall: 0.74, foot: 0.04 }, Math.PI - 0.55));
      const a = (this.el = document.createElement("div"));
      ((a.id = "lobby"), (a.className = "rk"));
      e && e.ROUNDS;
      ((a.innerHTML = `<div class="rk-dim"></div><div class="rk-wrap">\n        <div class="rk-head"><div class="rk-title">${blockText("RANKED")}<i class="rk-mt">1V1</i></div><div class="rk-sub"><b>天梯排位</b><span class="rk-ms">第一赛季 · 五局三胜 · 打满五局</span><span class="rk-aipts">人机对战赢了也加天梯分：简单 ×10% · 普通 ×25% · 困难 ×50%（${Ct} 分以下 · 乱斗除外）</span></div></div>\n        <div class="rk-hero">\n          <div class="rk-emb"><svg class="rk-ring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="84" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="100" cy="100" r="66" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 7"/><path d="M100 2v30M100 168v30M2 100h30M168 100h30" stroke="currentColor" stroke-width="4"/></svg><img class="rk-ic" alt=""></div>\n          <div class="rk-who"><small>当前段位</small><b class="rk-tn">—</b><div class="rk-sc"><span class="rk-score">—</span><em>分</em></div>\n            <div class="segs rk-segs"></div><div class="rk-next">—</div></div>\n          <div class="rk-stats"><div><b class="rk-g">0</b><small>场次</small></div><div><b class="rk-w">0</b><small>胜场</small></div><div><b class="rk-r">—</b><small>胜率</small></div></div>\n        </div>\n        <div class="rk-track"></div>\n        <div class="rk-low">\n          <div class="rk-modes">${At.map(
        (t, e) =>
          `<button class="rk-mode" data-m="${t.id}" style="--mc:${t.col};--i:${e}">\n            <div class="mk-top"><span class="mk-n">${blockText(t.tag)}</span><i class="mk-ck">已选择</i></div>\n            <div class="mk-art">${(function modeArt(
            t,
          ) {
            if ("1v1" === t)
              return `<span>${mkFace()}</span><span class="vs">VS</span><span class="b">${mkFace()}</span>`;
            if ("2v2" === t)
              return `<span class="pr">${mkFace()}${mkFace()}</span><span class="vs">VS</span><span class="pr b">${mkFace()}${mkFace()}</span>`;
            let e = "";
            const a = [6, 18, 30, 42, 54, 66, 78, 90];
            a.forEach((t) => {
              e += `<rect x="2" y="${t - 4}" width="8" height="8" fill="#111" stroke="#F2EFE9" stroke-width="1.5"/>`;
            });
            const L = (t) =>
                t
                  .map((e, o) =>
                    o % 2
                      ? ""
                      : `<path d="M${10 + (t === a ? 0 : 16 * t.lv)} ${e}h8V${t[o + 1]}h-8M${18 + (t === a ? 0 : 16 * t.lv)} ${(e + t[o + 1]) / 2}h8" fill="none" stroke="#FFB020" stroke-width="1.6"/>`,
                  )
                  .join(""),
              o = a,
              s = [12, 36, 60, 84];
            s.lv = 1;
            const i = [24, 72];
            return (
              (i.lv = 2),
              (e += L(o) + L(s) + L(i)),
              (e +=
                '<g transform="translate(62 30)"><path d="M4 0h28v10a14 14 0 0 1-28 0z" fill="#FFB020"/><path d="M4 4H0v4a6 6 0 0 0 6 6M32 4h4v4a6 6 0 0 1-6 6" fill="none" stroke="#FFB020" stroke-width="2.5"/><rect x="14" y="24" width="8" height="8" fill="#FFB020"/><rect x="8" y="32" width="20" height="5" fill="#FFB020"/></g>'),
              `<svg viewBox="0 0 100 96">${e}</svg>`
            );
          })(
            t.id,
          )}</div>\n            <b class="mk-t">${t.t}</b><small>${t.s}</small>\n            <ul>${t.rules.map((t) => `<li>${t}</li>`).join("")}</ul></button>`,
      ).join(
        "",
      )}</div>\n          <div class="rk-panel rk-board"><div class="rk-cap">${blockText("TOP 10")}<span>排行榜</span></div><div class="rk-list"><div class="rk-empty">正在读取排行榜…</div></div></div>\n        </div>\n        <div class="rk-foot"><button class="rk-back" data-a="back">${blockText("<")}<span>返回</span></button><button class="rk-back rk-party" data-a="party" style="display:none"><span>组队</span></button><button class="rk-go" data-a="go"><span>开始匹配</span><em>同段位优先 · 平均 1 分钟内</em>${blockText("GO >")}</button></div>\n      </div>`),
        host().appendChild(a),
        a.addEventListener("click", (t) => {
          const e = t.target.closest("[data-m]");
          if (e) return void this.setMode(e.dataset.m);
          const a = t.target.closest("[data-a]");
          a &&
            ("go" === a.dataset.a
              ? this.go()
              : "party" === a.dataset.a
                ? this.party()
                : "pjoin" === a.dataset.a
                  ? this.partyJoin()
                  : "pmake" === a.dataset.a
                    ? this.partyMake()
                    : "pclose" === a.dataset.a
                      ? this.partyClose()
                      : "pcopy" === a.dataset.a
                        ? this.partyCopy()
                        : this.back());
        }),
        this.setMode(PotatoRanked.mode || "1v1"),
        this.fill(),
        this.loadBoard());
    }
    loadBoard(t = 0) {
      if (!this.el) return;
      const e = self.XZ,
        again = () => {
          this.el &&
            t < 4 &&
            (!this.top || !this.top.length || (potLogged() && !this.rec)) &&
            setTimeout(() => this.loadBoard(t + 1), 1500 * (t + 1));
        },
        pub = () =>
          e && e.pmTop
            ? e
                .pmTop()
                .then((t) => {
                  t &&
                    t.top &&
                    this.el &&
                    !(this.top && this.top.length && this.rec) &&
                    ((this.top = t.top), this.fill());
                })
                .catch(() => {})
            : Promise.resolve();
      "undefined" != typeof Account && Account.loggedIn
        ? Account.api("/api/ladder/top")
            .then((t) => {
              t &&
                this.el &&
                (t.top && t.top.length && (this.top = t.top),
                t.me && (this.rec = t.me),
                this.fill());
            })
            .catch(() => {})
            .then(() => (this.top && this.top.length ? null : pub()))
            .then(again)
        : potGuest() && e && e.guestFetch
          ? (e
              .guestFetch()
              .then((t) => {
                t.rec &&
                  void 0 !== t.rec.score &&
                  this.el &&
                  ((this.rec = { ...t.rec, name: t.name }), this.fill());
              })
              .catch(() => {}),
            pub().then(again))
          : pub().then(again);
    }
    fill() {
      const t = this.el,
        e = this.game,
        a = self.XZ && self.XZ.ladder;
      if (!t || !a) return;
      const q = (e) => t.querySelector(e),
        o = potLogged(),
        s = this.rec ? this.rec.score : a.START,
        i = a.tierOf(s),
        l = a.TIERS.indexOf(i),
        r = a.TIERS[l + 1];
      (t.style.setProperty("--tc", i.col),
        (q(".rk-ic").src = tierPic(e, i)),
        q(".rk-ic").classList.toggle("shine", !!i.glow));
      const d =
        (this.rec && this.rec.rank) ||
        (this.top && "undefined" != typeof Account
          ? this.top.findIndex((t) => t.name === Account.name) + 1
          : 0);
      ((q(".rk-tn").textContent = o ? (a.tierName ? a.tierName(s, d) : i.n) : "未登录"),
        (q(".rk-score").textContent = o ? s : "—"));
      const u = r ? Math.max(1, Math.min(12, Math.round(((s - i.lo) / (r.lo - i.lo)) * 12))) : 12;
      ((q(".rk-segs").innerHTML = Array.from(
        { length: 12 },
        (t, e) => `<i class="${o && e < u ? "on" : ""}" style="--i:${e}"></i>`,
      ).join("")),
        (q(".rk-next").textContent = o
          ? r
            ? "距离「" + r.n + "」还差 " + (r.lo - s) + " 分"
            : "已经是最高段位"
          : "登录后开始排位 · 新玩家从石头 100 分起步"));
      const b = this.rec || { games: 0, wins: 0 };
      ((q(".rk-g").textContent = b.games || 0),
        (q(".rk-w").textContent = b.wins || 0),
        (q(".rk-r").textContent = b.games ? Math.round((b.wins / b.games) * 100) + "%" : "—"));
      const h = a.TIERS.length,
        p = o ? l + (r ? Math.min(0.999, (s - i.lo) / (r.lo - i.lo)) : 0) : -1;
      ((q(".rk-track").innerHTML =
        `<div class="ln"><i style="width:${(Math.max(0, p) / (h - 1)) * 100}%"></i></div>` +
        a.TIERS.map(
          (t, a) =>
            `<div class="nd ${o && a === l ? "me" : ""} ${o && a < l ? "past" : ""} ${t.glow ? "top" : ""}" style="--x:${(a / (h - 1)) * 100}%;--c:${t.col};--i:${a}">\n        <div class="ic"><img class="${t.glow ? "shine" : ""}" src="${tierPic(e, t)}" alt=""></div><b>${esc(t.n)}</b><small>${t.lo}+</small></div>`,
        ).join("")),
        this.top &&
          (q(".rk-list").innerHTML = this.top.length
            ? this.top
                .slice(0, 10)
                .map((t, o) => {
                  const s = a.tierOf(t.score);
                  return `<div class="rk-row ${o < 3 ? "top3" : ""}" style="--i:${o}"><i>${o + 1}</i><img class="${s.glow ? "shine" : ""}" src="${tierPic(e, s)}" alt=""><b>${esc(t.name)}</b><span>${t.score}</span></div>`;
                })
                .join("")
            : '<div class="rk-empty">还没有人打完一场天梯 · 来做第一个</div>'));
    }
    setMode(t) {
      const e = At.find((e) => e.id === t) || At[0],
        a = this.el;
      if (((this.mode = PotatoRanked.mode = e.id), !a)) return;
      const o = !1,
        q = (t) => a.querySelector(t);
      (a
        .querySelectorAll(".rk-mode")
        .forEach((t) => t.classList.toggle("on", t.dataset.m === e.id)),
        (q(".rk-mt").textContent = e.tag),
        (q(".rk-ms").textContent = e.sub));
      const s = q(".rk-party"),
        i = "2v2" === e.id && !!(self.XZ && self.XZ.pmOn && self.XZ.pmOn());
      s &&
        ((s.style.display = i ? "" : "none"),
        (q(".rk-foot").style.gridTemplateColumns = i
          ? "calc(var(--u) * 12) calc(var(--u) * 10) 1fr"
          : ""));
      const l = q(".rk-go");
      ((l.disabled = o),
        (l.querySelector("span").textContent = e.go),
        (l.querySelector("em").textContent = e.em));
    }
    party() {
      if (this.el.querySelector(".rk-pp")) return;
      const t = document.createElement("div");
      ((t.className = "rk-pp"),
        (t.innerHTML =
          '<div class="rk-ppc"><b>2V2 组队</b><small>创建队伍后把组队码发给好友；好友在这里输入组队码加入，两人到齐就开始找对手</small>\n        <button class="shp-btn go" data-a="pmake">创建队伍</button>\n        <div class="rk-ppr"><input class="rk-ppi" maxlength="6" placeholder="输入组队码（T 开头）"><button class="shp-btn" data-a="pjoin">加入</button></div>\n        <div class="rk-ppm"></div><button class="shp-btn sm" data-a="pclose">关闭</button></div>'),
        this.el.appendChild(t),
        shCss(),
        ["keydown", "keyup"].forEach((e) =>
          t.querySelector(".rk-ppi").addEventListener(e, (t) => t.stopPropagation()),
        ));
    }
    partyClose() {
      const t = this.el && this.el.querySelector(".rk-pp");
      t && t.remove();
    }
    async partyMake() {
      const t = this.el.querySelector(".rk-ppm"),
        e = this.game;
      if (potLogged() || new URLSearchParams(location.search).get("pmdev")) {
        t.textContent = "正在创建…";
        try {
          const a = await self.XZ.pmPartyCreate(e);
          ((this.pcode = a),
            (t.innerHTML = `组队码 <b class="rk-ppcode">${esc(a)}</b> <button class="shp-btn sm" data-a="pcopy">复制</button>`),
            setTimeout(() => {
              (this.partyClose(),
                e.lobby && e.lobby.moveTo(l, Math.PI + 0.3, 400),
                self.XZ.ladderStart(e, { team: { party: a } }));
            }, 1600));
        } catch (e) {
          t.textContent = e.message;
        }
      } else t.textContent = "先登录才能组队";
    }
    partyCopy() {
      try {
        navigator.clipboard.writeText(this.pcode || "");
      } catch (t) {}
    }
    partyJoin() {
      const t = this.game,
        e = String(this.el.querySelector(".rk-ppi").value || "")
          .trim()
          .toUpperCase(),
        a = this.el.querySelector(".rk-ppm");
      /^T[A-Z0-9]{5}$/.test(e)
        ? (this.partyClose(),
          t.lobby && t.lobby.moveTo(l, Math.PI + 0.3, 400),
          self.XZ.ladderStart(t, { team: { party: e } }))
        : (a.textContent = "组队码是 T 开头的 6 位字母和数字");
    }
    go() {
      const t = this.game,
        e = self.XZ;
      potLogged()
        ? (t.lobby && t.lobby.moveTo(l, Math.PI + 0.3, 400),
          e &&
            ("tour" === this.mode
              ? e.tourStart && e.tourStart(t)
              : "2v2" === this.mode
                ? e.ladderStart && e.ladderStart(t, { team: {} })
                : e.ladderStart && e.ladderStart(t)))
        : t.ui.open(new LoginScreen(t, () => t.ui.open(new PotatoRanked(t, this.parent))));
    }
    back() {
      const t = this.game;
      (t.lobby && t.lobby.moveTo(l, Math.PI + 0.3), backTo(t, this.parent));
    }
    onEsc() {
      this.back();
    }
    close() {
      this.el && (unmount(this.el), (this.el = null));
    }
    draw(t) {}
    mouseDown() {}
  }
  self.PotatoRanked = PotatoRanked;
  const Tt = [
      ["head", "只能爆头", "打身体不掉血"],
      ["one", "一枪倒", "打中就倒，不论部位"],
      ["half", "伤害减半", "血更厚，打得更久"],
      ["low", "低重力", "跳得更高，摔不疼"],
      ["fast", "极速", "移动快 40%"],
      ["inf", "无限子弹", "弹匣永远是满的"],
    ],
    Mt = [
      [3, "三局两胜"],
      [5, "五局三胜"],
      [7, "七局四胜"],
    ],
    $t = { mode: "1v1", map: "std", sky: "rand", n: 5, gun: "rot", rules: {} },
    zt = {
      stone_bricks: "#8C8C8C",
      oak_planks: "#B8945F",
      gray_concrete: "#5F636A",
      quartz_block: "#E8E4DC",
      barrel: "#8B6A3E",
      spruce_planks: "#7A5A3A",
      dark_oak_planks: "#5A4330",
      orange_concrete: "#E0651A",
      white_concrete: "#D8DCDD",
      lime_concrete: "#5EA918",
      iron_block: "#C8C8C8",
      blue_concrete: "#3A4AAF",
      polished_andesite: "#8C918C",
      bricks: "#A0604E",
    },
    shade = (t, e) => {
      const a = parseInt(t.slice(1), 16),
        f = (t) => Math.max(0, Math.min(255, Math.round(e >= 0 ? t + (255 - t) * e : t * (1 + e))));
      return `rgb(${f(a >> 16)},${f((a >> 8) & 255)},${f(255 & a)})`;
    },
    Pt = {};
  let Lt = null;
  class PotatoCustom extends MenuScreen {
    constructor(t, e) {
      (super(t, null),
        (this.potato = !0),
        (this.parent = e),
        (this.pauses = !1),
        (this.blurBg = !1),
        (this.bgDim = 0),
        (this.el = null));
      const a = self.XZ && self.XZ.pmRoom && self.XZ.pmRoom();
      ((this.room = a || null),
        (this.opts = a
          ? Object.assign({}, a.opts, { rules: Object.assign({}, a.opts.rules) })
          : (() => {
              try {
                const t = JSON.parse(localStorage.getItem("potato:room") || "null");
                if (t && "object" == typeof t)
                  return Object.assign({}, $t, t, { rules: Object.assign({}, t.rules) });
              } catch (t) {}
              return Object.assign({}, $t, { rules: {} });
            })()),
        (this.diff = "normal"),
        (this.msg = ""),
        (this.bad = !1));
    }
    layout() {
      this.el || this.mount();
    }
    net() {
      const t = self.XZ;
      return !!(t && t.pmOn && t.pmOn() && t.roomSend);
    }
    signed() {
      return potLogged() || !!new URLSearchParams(location.search).get("pmdev");
    }
    owner() {
      return !this.room || !!this.room.owner;
    }
    mount() {
      const t = this.game,
        e = self.XZ;
      ((() => {
        if ((ensureCss(), !document.getElementById("cr-css"))) {
          const t = document.createElement("style");
          ((t.id = "cr-css"),
            (t.textContent =
              '\n  #lobby.cr .rk-wrap { width: auto; right: calc(var(--u) * 3.5); }\n  #lobby.cr .rk-dim { background: linear-gradient(90deg, rgba(10,11,14,.94), rgba(10,11,14,.86)); }\n  #lobby .cr-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr calc(var(--u) * 31); gap: calc(var(--u) * 1.4); }\n  #lobby .cr-set { pointer-events: auto; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: calc(var(--u) * .95); padding-right: calc(var(--u) * .6); scrollbar-width: thin; }\n  #lobby .cr-set.ro { pointer-events: none; } #lobby .cr-set.ro .cr-row { filter: saturate(.75); }\n  #lobby .cr-ro { display: none; font-size: calc(var(--u) * .95); font-weight: 800; color: #FFB020; } #lobby .cr-set.ro .cr-ro { display: block; }\n  #lobby .cr-row { display: grid; grid-template-columns: calc(var(--u) * 6.5) 1fr; gap: calc(var(--u) * 1); align-items: start; animation: lbUp .4s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(var(--i) * 45ms + .05s); }\n  #lobby .cr-k { font-weight: 900; font-size: calc(var(--u) * 1.1); color: #A9A59C; letter-spacing: .12em; padding-top: calc(var(--u) * .5); display: flex; align-items: center; gap: calc(var(--u) * .5); white-space: nowrap; }\n  #lobby .cr-k::before { content: \'\'; width: calc(var(--u) * .55); height: calc(var(--u) * .55); background: var(--or); flex: none; }\n  #lobby .cr-chips { display: flex; flex-wrap: wrap; gap: calc(var(--u) * .5); }\n  #lobby .cr-c { pointer-events: auto; cursor: pointer; font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.05); color: #F2EFE9; background: rgba(242,239,233,.05); border: 1px solid rgba(242,239,233,.2);\n    padding: calc(var(--u) * .42) calc(var(--u) * .85); display: inline-flex; align-items: center; gap: calc(var(--u) * .5); transition: background .15s ease, border-color .15s ease, transform .15s ease, box-shadow .15s ease; }\n  #lobby .cr-c:hover { border-color: rgba(242,239,233,.55); transform: translateY(calc(var(--u) * -.15)); }\n  #lobby .cr-c.on { background: var(--or); border-color: var(--or); color: #111; box-shadow: calc(var(--u) * .3) calc(var(--u) * .3) 0 rgba(0,0,0,.6); }\n  #lobby .cr-c small { font-weight: 700; font-size: .8em; opacity: .72; }\n  #lobby .cr-c .sw { width: calc(var(--u) * 1.7); height: calc(var(--u) * 1.15); border: 1px solid rgba(0,0,0,.45); box-shadow: inset 0 0 0 1px rgba(255,255,255,.15); }\n  #lobby .cr-c img { height: calc(var(--u) * 2.3); margin: calc(var(--u) * -.45) calc(var(--u) * -.2); image-rendering: pixelated; filter: drop-shadow(0 0 calc(var(--u) * .25) rgba(255,255,255,.35)); }\n  #lobby .cr-mapl { display: grid; grid-template-columns: repeat(5, 1fr); gap: calc(var(--u) * .6); }\n  #lobby .cr-map { pointer-events: auto; cursor: pointer; font: inherit; color: #F2EFE9; text-align: left; background: rgba(0,0,0,.3); border: 1px solid rgba(242,239,233,.16); padding: calc(var(--u) * .4);\n    display: flex; flex-direction: column; gap: calc(var(--u) * .25); transition: transform .18s cubic-bezier(.2,.9,.25,1), border-color .15s ease, box-shadow .18s ease; }\n  #lobby .cr-map img { width: 100%; aspect-ratio: 43 / 27; image-rendering: pixelated; display: block; }\n  #lobby .cr-map b { font-size: calc(var(--u) * 1.02); font-weight: 900; white-space: nowrap; } #lobby .cr-map small { font-size: calc(var(--u) * .72); color: #A9A59C; font-weight: 800; letter-spacing: .12em; }\n  #lobby .cr-map:hover { transform: translateY(calc(var(--u) * -.25)); border-color: rgba(242,239,233,.5); }\n  #lobby .cr-map.on { border-color: var(--or); box-shadow: calc(var(--u) * .4) calc(var(--u) * .4) 0 var(--or); transform: translate(calc(var(--u) * -.2), calc(var(--u) * -.3)); }\n  #lobby .cr-mapd { font-size: calc(var(--u) * .95); color: #CFCBC2; font-weight: 700; margin-top: calc(var(--u) * .55); min-height: 1.5em; }\n  #lobby .cr-rules { display: grid; grid-template-columns: repeat(3, 1fr); gap: calc(var(--u) * .5); }\n  #lobby .cr-rule { pointer-events: auto; cursor: pointer; font: inherit; color: #F2EFE9; text-align: left; position: relative; background: rgba(242,239,233,.04); border: 1px solid rgba(242,239,233,.16);\n    padding: calc(var(--u) * .5) calc(var(--u) * .7) calc(var(--u) * .5) calc(var(--u) * 2.5); transition: background .15s ease, border-color .15s ease; }\n  #lobby .cr-rule:hover { border-color: rgba(242,239,233,.45); }\n  #lobby .cr-rule b { display: block; font-size: calc(var(--u) * 1.05); font-weight: 900; } #lobby .cr-rule small { display: block; font-size: calc(var(--u) * .8); color: #A9A59C; font-weight: 700; white-space: nowrap; }\n  #lobby .cr-rule i { position: absolute; left: calc(var(--u) * .75); top: 50%; width: calc(var(--u) * 1.1); height: calc(var(--u) * 1.1); margin-top: calc(var(--u) * -.55); border: calc(var(--u) * .18) solid rgba(242,239,233,.5); transition: background .15s ease, border-color .15s ease; }\n  #lobby .cr-rule.on { border-color: #19C79A; background: rgba(25,199,154,.13); } #lobby .cr-rule.on i { background: #19C79A; border-color: #19C79A; box-shadow: inset 0 0 0 calc(var(--u) * .2) #111; }\n  #lobby .cr-side { pointer-events: auto; min-height: 0; display: flex; flex-direction: column; gap: calc(var(--u) * .85); border: 1px solid rgba(242,239,233,.16); background: rgba(0,0,0,.32); padding: calc(var(--u) * 1.2); overflow-y: auto; animation: lbUp .45s cubic-bezier(.2,.9,.25,1) .12s backwards; }\n  #lobby .cr-cap2 { font-weight: 900; font-size: calc(var(--u) * 1.15); letter-spacing: .1em; display: flex; justify-content: space-between; align-items: baseline; gap: calc(var(--u) * .6); }\n  #lobby .cr-cap2 small { color: #A9A59C; font-size: .8em; letter-spacing: 0; font-weight: 700; }\n  #lobby .cr-codebox { background: #F2EFE9; color: #111; padding: calc(var(--u) * .7) calc(var(--u) * 1); display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 0 calc(var(--u) * .6); box-shadow: calc(var(--u) * .5) calc(var(--u) * .5) 0 var(--or); animation: crIn .4s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .cr-codebox small { grid-column: 1 / -1; font-size: calc(var(--u) * .82); font-weight: 900; color: #6A665E; letter-spacing: .12em; }\n  #lobby .cr-rc { font: 900 calc(var(--u) * 3)/1.05 "Bahnschrift", "Arial Black", sans-serif; letter-spacing: .12em; }\n  @keyframes crIn { from { opacity: 0; transform: scale(.92) rotate(-1.5deg); } }\n  #lobby .cr-btn { pointer-events: auto; cursor: pointer; font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.02); padding: calc(var(--u) * .48) calc(var(--u) * .95); border: calc(var(--u) * .2) solid #111; background: #111; color: #F2EFE9; transition: transform .12s ease, background .12s ease, border-color .12s ease; white-space: nowrap; }\n  #lobby .cr-btn:hover { transform: translateY(calc(var(--u) * -.12)); } #lobby .cr-btn.lt { background: transparent; border-color: rgba(242,239,233,.45); } #lobby .cr-btn.lt:hover { border-color: #F2EFE9; }\n  #lobby .cr-btn.or { background: var(--or); border-color: var(--or); color: #111; } #lobby .cr-btn:disabled { opacity: .45; cursor: default; transform: none; }\n  #lobby .cr-teams { display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--u) * .7); }\n  #lobby .cr-team { display: flex; flex-direction: column; gap: calc(var(--u) * .45); min-width: 0; }\n  #lobby .cr-tn { font-weight: 900; font-size: calc(var(--u) * .95); letter-spacing: .16em; padding: calc(var(--u) * .2) calc(var(--u) * .6); color: #111; display: flex; justify-content: space-between; }\n  #lobby .cr-team.h .cr-tn { background: #E8423F; } #lobby .cr-team.g .cr-tn { background: #3E7BFA; }\n  #lobby .cr-slot { position: relative; display: flex; align-items: center; gap: calc(var(--u) * .5); padding: calc(var(--u) * .45); background: rgba(242,239,233,.07); border: 1px solid rgba(242,239,233,.14); min-height: calc(var(--u) * 3.4); animation: crIn .35s cubic-bezier(.2,.9,.25,1) backwards; min-width: 0; }\n  #lobby .cr-slot img, #lobby .cr-slot .ph { width: calc(var(--u) * 2.3); height: calc(var(--u) * 2.3); image-rendering: pixelated; background: #111; flex: none; }\n  #lobby .cr-slot .ph { background: linear-gradient(135deg, #3A3F48, #1A1C21); }\n  #lobby .cr-slot b { font-size: calc(var(--u) * .98); font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 1; }\n  #lobby .cr-slot em { font-style: normal; font-size: calc(var(--u) * .7); font-weight: 900; padding: 0 calc(var(--u) * .3); background: #FFB020; color: #111; flex: none; } #lobby .cr-slot em.me { background: #F2EFE9; }\n  #lobby .cr-slot.empty { border-style: dashed; color: #807C73; justify-content: center; font-weight: 800; font-size: calc(var(--u) * .88); background: transparent; }\n  #lobby .cr-slot.empty i { font-style: normal; font-weight: 900; font-size: calc(var(--u) * 1.3); animation: crPulse 1.6s ease-in-out infinite; }\n  #lobby .cr-slot.bot { border-style: dashed; color: #A9A59C; } #lobby .cr-slot.off { opacity: .45; }\n  #lobby .cr-kick { pointer-events: auto; cursor: pointer; border: 0; background: transparent; color: #A9A59C; font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.1); padding: 0 calc(var(--u) * .2); flex: none; } #lobby .cr-kick:hover { color: #FF5A4A; }\n  @keyframes crPulse { 50% { opacity: .3; } }\n  #lobby .cr-sub { font-size: calc(var(--u) * .9); color: #A9A59C; font-weight: 700; line-height: 1.6; }\n  #lobby .cr-jr { display: flex; gap: calc(var(--u) * .5); }\n  #lobby .cr-code { flex: 1; min-width: 0; font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.35); padding: calc(var(--u) * .4) calc(var(--u) * .7); border: calc(var(--u) * .2) solid rgba(242,239,233,.7); background: rgba(242,239,233,.08); color: #F2EFE9; text-transform: uppercase; letter-spacing: .12em; pointer-events: auto; outline: none; }\n  #lobby .cr-code:focus { border-color: var(--or); }\n  #lobby .cr-msg { min-height: 1.5em; font-weight: 900; font-size: calc(var(--u) * .98); color: #FFB020; } #lobby .cr-msg.bad { color: #FF6B5A; }\n  #lobby .cr-hr { height: 1px; background: rgba(242,239,233,.14); flex: none; }\n  #lobby .cr-sum { display: flex; flex-wrap: wrap; gap: calc(var(--u) * .4); } #lobby .cr-sum span { font-size: calc(var(--u) * .82); font-weight: 900; padding: calc(var(--u) * .1) calc(var(--u) * .45); background: rgba(242,239,233,.1); }\n  #lobby .cr-sum span.r { background: rgba(25,199,154,.22); color: #7CF0CF; }\n  '),
            document.head.appendChild(t));
        }
      })(),
        t.lobby && t.lobby.moveTo({ cx: 1.3, tall: 0.74, foot: 0.04 }, Math.PI - 0.55));
      const a = (e && e.duelMaps) || [],
        o = (self.Potato && self.Potato.SKIES, (e && e.duelGuns) || []);
      if (!Lt) {
        Lt = {};
        for (const [a] of o)
          try {
            const o = ITEM_KEY[e.R.keys[a]],
              s = e.g3Icon && e.g3Icon(t.renderer, { id: o, count: 1 });
            Lt[a] = s ? s.toDataURL() : "";
          } catch (t) {
            Lt[a] = "";
          }
      }
      const chip = (t, e, a) => `<button class="cr-c" data-g="${t}" data-v="${e}">${a}</button>`,
        row = (t, e, a, o = "") =>
          `<div class="cr-row ${o}" style="--i:${t}"><div class="cr-k">${e}</div><div>${a}</div></div>`,
        s = (this.el = document.createElement("div"));
      ((s.id = "lobby"),
        (s.className = "rk cr"),
        (s.innerHTML = `<div class="rk-dim"></div><div class="rk-wrap">\n        <div class="rk-head"><div class="rk-title">${blockText("CUSTOM")}<i class="rk-mt cr-mt">1V1</i></div><div class="rk-sub"><b>自定义房间</b><span class="cr-hs">好友约战 · 不计分 · 房主定规则</span></div></div>\n        <div class="cr-body">\n          <div class="cr-set"><div class="cr-ro">只有房主可以改设置 · 下面是这一场的规则</div>\n            ${row(0, "模式", `<div class="cr-chips">${chip("mode", "1v1", "1V1 <small>单挑</small>")}${chip("mode", "2v2", "2V2 <small>两人一队</small>")}</div>`)}\n            ${row(
          1,
          "地图",
          `<div class="cr-mapl">${a
            .map(
              (t) =>
                `<button class="cr-map" data-map="${t.id}"><img src="${(function mapPlan(t) {
                  if (Pt[t.id]) return Pt[t.id];
                  const e = document.createElement("canvas");
                  ((e.width = 258), (e.height = 162));
                  const a = e.getContext("2d"),
                    X = (t) => 6 * (t + 21),
                    Z = (t) => 6 * (t + 13);
                  ((a.fillStyle = "#25282E"),
                    a.fillRect(0, 0, e.width, e.height),
                    (a.fillStyle = "#2B2F36"));
                  for (let t = -20; t <= 20; t++)
                    for (let e = -12; e <= 12; e++) (t + e) & 1 && a.fillRect(X(t), Z(e), 6, 6);
                  ((a.fillStyle = "#3C414B"),
                    a.fillRect(X(0), Z(-12), 6, 150),
                    (a.fillStyle = "#B8322E"),
                    a.fillRect(X(-20), Z(-2), 30, 30),
                    (a.fillStyle = "#2F5BC8"),
                    a.fillRect(X(16), Z(-2), 30, 30));
                  const o = new Map();
                  for (const [e, a, s, i, l, r, , d] of t.cover)
                    for (let t = e; t <= s; t++)
                      for (let e = a; e <= i; e++) {
                        const a = d + l - 1,
                          s = o.get(t + "," + e);
                        (!s || a > s.t) && o.set(t + "," + e, { t: a, b: r });
                      }
                  a.fillStyle = "rgba(0,0,0,.42)";
                  for (const [t, e] of o) {
                    const [o, s] = t.split(",").map(Number),
                      i = 6 * 0.3 * e.t;
                    a.fillRect(X(o) + i, Z(s) + i, 6, 6);
                  }
                  for (const [t, e] of o) {
                    const [o, s] = t.split(",").map(Number);
                    ((a.fillStyle = shade(zt[e.b] || "#8C8C8C", 0.13 * (e.t - 2))),
                      a.fillRect(X(o), Z(s), 6, 6),
                      (a.fillStyle = "rgba(0,0,0,.18)"),
                      a.fillRect(X(o), Z(s) + 6 - 1, 6, 1));
                  }
                  a.fillStyle = "rgba(140,215,255,.9)";
                  for (const [e, , o] of t.glass) a.fillRect(X(e) + 1.5, Z(o) + 1.5, 3, 3);
                  return (
                    (a.strokeStyle = "#7A7F88"),
                    (a.lineWidth = 6),
                    a.strokeRect(3, 3, e.width - 6, e.height - 6),
                    (Pt[t.id] = e.toDataURL())
                  );
                })(t)}" alt=""><b>${esc(t.name)}</b><small>${t.en}</small></button>`,
            )
            .join("")}</div><div class="cr-mapd"></div>`,
        )}\n            ${row(3, "局数", `<div class="cr-chips">${Mt.map(([t, e]) => chip("n", t, e)).join("")}</div>`)}\n            ${row(4, "武器", `<div class="cr-chips">${chip("gun", "rot", "轮换 <small>每局换一把</small>")}${chip("gun", "rand", "随机 <small>每局抽一把</small>")}${o.map(([t, e]) => chip("gun", t, `${Lt[t] ? `<img src="${Lt[t]}" alt="">` : ""}${esc(e)}`)).join("")}</div>`)}\n            ${row(5, "娱乐规则", `<div class="cr-rules">${Tt.map(([t, e, a]) => `<button class="cr-rule" data-r="${t}"><i></i><b>${e}</b><small>${a}</small></button>`).join("")}</div>`)}\n          </div>\n          <div class="cr-side"></div>\n        </div>\n        <div class="rk-foot"><button class="rk-back" data-a="back">${blockText("<")}<span>返回</span></button><button class="rk-go" data-a="go"><span>创建房间</span><em></em>${blockText("GO >")}</button></div>\n      </div>`),
        host().appendChild(s),
        s.addEventListener("click", (t) => this.click(t)),
        ["keydown", "keyup", "keypress"].forEach((t) =>
          s.addEventListener(t, (e) => {
            e.target &&
              e.target.classList &&
              e.target.classList.contains("cr-code") &&
              (e.stopPropagation(), "keydown" === t && "Enter" === e.key && this.join());
          }),
        ),
        this.render());
    }
    click(t) {
      const e = t.target,
        a = e.closest(".cr-c"),
        o = e.closest(".cr-map"),
        s = e.closest(".cr-rule"),
        i = e.closest("[data-a]");
      if (a) {
        const t = a.dataset.g,
          e = a.dataset.v;
        return "diff" === t
          ? ((this.diff = e), void this.render())
          : void this.set(t, "n" === t ? +e : e);
      }
      if (o) return void this.set("map", o.dataset.map);
      if (s) {
        const t = Object.assign({}, this.opts.rules);
        return (
          (t[s.dataset.r] = !t[s.dataset.r]),
          t[s.dataset.r] || delete t[s.dataset.r],
          void this.set("rules", t)
        );
      }
      if (!i) return;
      const l = i.dataset.a;
      "back" === l
        ? this.back()
        : "go" === l
          ? this.go()
          : "join" === l
            ? this.join()
            : "solo" === l
              ? this.solo()
              : "copy" === l
                ? this.copy()
                : "team" === l
                  ? this.send({ op: "team" })
                  : "kick" === l
                    ? this.send({ op: "kick", i: +i.dataset.i })
                    : "login" === l && g0Login(this.game, this);
    }
    set(t, e) {
      this.owner() &&
        ((this.opts = Object.assign({}, this.opts, { [t]: e })),
        ((t) => {
          try {
            localStorage.setItem("potato:room", JSON.stringify(t));
          } catch (t) {}
        })(this.opts),
        this.room && this.send({ op: "set", opts: this.opts }),
        this.render());
    }
    async send(t) {
      try {
        await self.XZ.roomSend(this.game, t);
      } catch (t) {
        this.say(t.message, !0);
      }
    }
    say(t, e) {
      ((this.msg = t || ""), (this.bad = !!e));
      const a = this.el && this.el.querySelector(".cr-msg");
      a && ((a.textContent = this.msg), a.classList.toggle("bad", this.bad));
    }
    onRoom(t, e) {
      const a = this.room;
      ((this.room = t || null),
        t
          ? ((this.opts = Object.assign({}, t.opts, { rules: Object.assign({}, t.opts.rules) })),
            a || this.say(t.owner ? "房间已创建：把房间码发给好友" : "已加入房间：等房主开始"))
          : e && this.say(e, !0),
        this.render());
    }
    render() {
      const t = this.el;
      if (!t) return;
      const q = (e) => t.querySelector(e),
        e = this.opts,
        a = this.room,
        o = self.XZ,
        s = (o && o.duelMaps) || [],
        i = this.owner(),
        l = "2v2" === e.mode ? 2 : 1;
      (q(".cr-set").classList.toggle("ro", !i),
        t.querySelectorAll(".cr-c[data-g]").forEach((t) => {
          const a = t.dataset.g;
          "diff" !== a && t.classList.toggle("on", String(e[a]) === t.dataset.v);
        }),
        t
          .querySelectorAll(".cr-map")
          .forEach((t) => t.classList.toggle("on", t.dataset.map === e.map)),
        t
          .querySelectorAll(".cr-rule")
          .forEach((t) => t.classList.toggle("on", !(!e.rules || !e.rules[t.dataset.r]))));
      const r = s.find((t) => t.id === e.map) || s[0];
      ((q(".cr-mapd").textContent = r ? r.desc : ""),
        (q(".cr-mt").textContent = "2v2" === e.mode ? "2V2" : "1V1"));
      const d = Tt.filter(([t]) => e.rules && e.rules[t]).map(([, t]) => t),
        u = (Mt.find(([t]) => t === e.n) || Mt[1])[1],
        b =
          "rot" === e.gun
            ? "武器轮换"
            : "rand" === e.gun
              ? "随机武器"
              : (((o && o.duelGuns) || []).find(([t]) => t === e.gun) || [0, ""])[1] + " 专场",
        h = `<div class="cr-sum"><span>${"2v2" === e.mode ? "2V2" : "1V1"}</span><span>${esc(r ? r.name : "")}</span><span>${u}</span><span>${esc(b)}</span>${d.map((t) => `<span class="r">${t}</span>`).join("")}</div>`,
        p = `<div class="cr-chips">${[
          ["easy", "简单"],
          ["normal", "普通"],
          ["hard", "困难"],
        ]
          .map(
            ([t, e]) =>
              `<button class="cr-c ${this.diff === t ? "on" : ""}" data-g="diff" data-v="${t}">${e}</button>`,
          )
          .join("")}</div>`,
        v = q(".rk-go"),
        m = v.querySelector("span"),
        y = v.querySelector("em"),
        w = q(".rk-back span");
      let k = "";
      if (a) {
        const t = faceIcon(),
          e = a.members[a.me] || {},
          o = t ? `<img src="${t}" alt="">` : '<i class="ph"></i>';
        t ||
          this.faceWait ||
          ((this.faceWait = !0),
          setTimeout(() => {
            this.el && this.render();
          }, 800));
        const slots = (t) => {
            const e = a.members
                .map((t, e) => Object.assign({ i: e }, t))
                .filter((e) => e.team === t),
              s = [];
            for (let t = 0; t < l; t++) {
              const i = e[t];
              s.push(
                i
                  ? `<div class="cr-slot ${i.on ? "" : "off"}" style="animation-delay:${60 * t}ms">${o}<b>${esc(i.name)}</b>${i.owner ? "<em>房主</em>" : ""}${i.i === a.me ? '<em class="me">你</em>' : ""}${a.owner && i.i !== a.me ? `<button class="cr-kick" data-a="kick" data-i="${i.i}" title="请他离开">×</button>` : ""}</div>`
                  : '<div class="cr-slot empty"><i>+</i>&nbsp;等待加入</div>',
              );
            }
            return s.join("");
          },
          s = a.members.filter((t) => "h" === t.team).length,
          i = a.members.length - s,
          r = s === l && i === l;
        ((k = `<div class="cr-codebox"><small>房间码 · ROOM CODE</small><b class="cr-rc">${esc(a.code)}</b><button class="cr-btn" data-a="copy">复制</button></div>\n          <div class="cr-sub">把房间码发给好友：好友在「好友约战」里输入就能进来。</div>\n          <div class="cr-cap2">队伍<small>${a.members.length} / ${2 * l} 人</small></div>\n          <div class="cr-teams"><div class="cr-team h"><div class="cr-tn"><span>红队</span><span>${s}/${l}</span></div>${slots("h")}</div><div class="cr-team g"><div class="cr-tn"><span>蓝队</span><span>${i}/${l}</span></div>${slots("g")}</div></div>\n          <button class="cr-btn lt" data-a="team" ${a.members.filter((t) => t.team !== e.team).length >= l ? "disabled" : ""}>换到${"h" === e.team ? "蓝队" : "红队"}</button>\n          <div class="cr-hr"></div><div class="cr-cap2">这一场</div>${h}\n          ${a.owner && 1 === a.members.length ? `<div class="cr-hr"></div><div class="cr-cap2">等好友的时候<small>空位由人机补上</small></div>${p}<button class="cr-btn lt" data-a="solo">和人机先打一局</button>` : ""}\n          <div class="cr-msg"></div>`),
          (w.textContent = "离开房间"),
          a.owner
            ? ((m.textContent = "开始比赛"),
              (v.disabled = !r),
              (y.textContent = r
                ? "两边都到齐了 · 不计分"
                : 2 === l
                  ? "两边各 2 人才能开始"
                  : "等好友进房间"))
            : ((m.textContent = "等房主开始"),
              (v.disabled = !0),
              (y.textContent = "房主点开始后自动进入比赛")));
      } else {
        const t = this.net(),
          e = this.signed();
        ((k = `<div class="cr-cap2">好友房间<small>${t ? "房间码 · 直连对战" : ""}</small></div>\n          ${t && e ? '<div class="cr-sub">左边设好规则，点「创建房间」拿到房间码发给好友；有房间码就在下面输入加入。</div>\n            <div class="cr-jr"><input class="cr-code" maxlength="6" placeholder="房间码 R…" spellcheck="false" autocomplete="off"><button class="cr-btn or" data-a="join">加入</button></div>' : t ? '<div class="cr-sub">登录后可以创建好友房间，或者输入好友的房间码加入。</div><button class="cr-btn or" data-a="login">登录</button>' : '<div class="cr-sub">现在连不上对战服务器：可以先用这些规则和人机打。</div>'}\n          <div class="cr-hr"></div><div class="cr-cap2">人机试玩<small>同样的规则 · 空位由人机补上</small></div>${p}\n          ${t && e ? '<button class="cr-btn lt" data-a="solo">和人机开打</button>' : ""}\n          <div class="cr-hr"></div><div class="cr-cap2">这一场</div>${h}\n          <div class="cr-msg"></div>`),
          (w.textContent = "返回"),
          t && e
            ? ((m.textContent = "创建房间"),
              (v.disabled = !1),
              (y.textContent = "拿到房间码发给好友 · 不计分"))
            : ((m.textContent = "和人机开打"),
              (v.disabled = !1),
              (y.textContent =
                "难度：" +
                { easy: "简单", normal: "普通", hard: "困难" }[this.diff] +
                " · 不计分")));
      }
      const x = q(".cr-side"),
        S = x.querySelector(".cr-code"),
        F = S ? S.value : "";
      x.innerHTML = k;
      const A = x.querySelector(".cr-code");
      (A && F && (A.value = F), this.say(this.msg, this.bad));
    }
    go() {
      const t = this.room;
      if (!t)
        return this.net() && this.signed()
          ? (this.say("正在创建房间…"), void this.send({ op: "make", opts: this.opts }))
          : void this.solo();
      t.owner && this.send({ op: "start" });
    }
    join() {
      const t = this.el && this.el.querySelector(".cr-code"),
        e = String((t && t.value) || "")
          .trim()
          .toUpperCase();
      /^R[A-Z0-9]{5}$/.test(e)
        ? (this.say("正在加入…"), this.send({ op: "join", code: e }))
        : this.say("房间码是 R 开头的 6 位字母和数字", !0);
    }
    solo() {
      const t = this.game,
        e = self.XZ;
      if (!e || !e.ladderStart || !e.customMatchOpts) return;
      const a = e.customMatchOpts(this.opts);
      (t.lobby && t.lobby.moveTo(l, Math.PI + 0.3, 400),
        e.ladderStart(t, { ai: { team: "2v2" === a.mode, diff: this.diff }, opt: a }));
    }
    copy() {
      const t = this.room;
      if (!t) return;
      const e = "来土豆史诗和我打一局！房间码 " + t.code + "（好友约战里输入）";
      try {
        navigator.clipboard.writeText(e).then(
          () => this.say("已复制：" + t.code),
          () => this.say("复制失败，房间码 " + t.code, !0),
        );
      } catch (e) {
        this.say("房间码 " + t.code);
      }
    }
    back() {
      const t = this.game;
      (this.room && (this.send({ op: "leave" }), (this.room = null)),
        t.lobby && t.lobby.moveTo(l, Math.PI + 0.3),
        backTo(t, this.parent));
    }
    onEsc() {
      this.back();
    }
    close() {
      this.el && (unmount(this.el), (this.el = null));
    }
    draw(t) {}
    mouseDown() {}
  }
  self.PotatoCustom = PotatoCustom;
  const Bt = {
    low: "分辨率 75% · 最省电",
    medium: "大多数设备",
    high: "更清晰",
    ultra: "最清晰 · 不降分辨率",
  };
  self.PotatoQuality = {
    run(t, e) {
      try {
        sessionStorage.setItem("potato:bench", e || "lobby");
      } catch (t) {}
      (t.ui.screen && t.ui.close(),
        self.XZ && self.XZ.ladderStart && self.XZ.ladderStart(t, { bench: !0 }));
    },
    inArena(t, e) {
      const a = (function makeQS() {
        return (
          Rt ||
          ("undefined" == typeof QualityScreen
            ? null
            : ((Rt = class PotatoQualityScreen extends QualityScreen {
                constructor(t, e) {
                  (super(t, e),
                    (this.potato = !0),
                    (this.el = null),
                    (this.hud0 = t.ui.hideHud),
                    (t.ui.hideHud = !0),
                    (this.bgDim = 0),
                    (this.shown = null));
                }
                finish() {
                  if ("detect" === this.phase) {
                    ((this.game.settings.maxFps = this.hw.phone && this.hz > 65 ? 60 : -1),
                      this.game.saveSettings());
                  }
                  super.finish();
                }
                fpsOpts() {
                  const t = this.hz,
                    e = [{ v: -1, n: "跟随屏幕", sub: t + " Hz" }];
                  for (const a of [240, 165, 144, 120, 90, 60, 30])
                    a < t - 5 &&
                      e.push({
                        v: a,
                        n: a + " 帧",
                        sub: 60 === a ? "省电" : 30 === a ? "最省电" : "",
                      });
                  return e;
                }
                fpsNow() {
                  const t = this.game.settings.maxFps;
                  return t > 0
                    ? t >= this.hz - 5
                      ? -1
                      : t
                    : -1 === t
                      ? -1
                      : this.hw.phone && this.hz > 65
                        ? 60
                        : -1;
                }
                layout() {
                  ((this.widgets = []), this.el ? this.render() : this.mount());
                }
                mount() {
                  (ensureCss(),
                    (() => {
                      if (document.getElementById("pq-css")) return;
                      const t = document.createElement("style");
                      ((t.id = "pq-css"),
                        (t.textContent =
                          "\n  #lobby.pq { pointer-events: none; }\n  #lobby .pq-panel { pointer-events: auto; position: absolute; left: 50%; bottom: calc(var(--u) * 2.4); transform: translateX(-50%); width: min(calc(var(--u) * 78), 94vw); background: var(--paper); border: calc(var(--u) * .3) solid #111; box-shadow: calc(var(--u) * .6) calc(var(--u) * .6) 0 #111; padding: calc(var(--u) * 1.2) calc(var(--u) * 1.6); animation: lbUp .45s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .pq-hd { display: flex; align-items: baseline; gap: calc(var(--u) * 1); } #lobby .pq-hd b { font-size: calc(var(--u) * 2); font-weight: 900; } #lobby .pq-hd span { color: #6B675F; font-weight: 800; font-size: calc(var(--u) * 1); }\n  #lobby .pq-hd .fps { margin-left: auto; font-size: calc(var(--u) * 1.3); color: var(--or); font-weight: 900; }\n  #lobby .pq-bar { height: calc(var(--u) * .8); background: #DDD8CC; margin-top: calc(var(--u) * .9); position: relative; overflow: hidden; } #lobby .pq-bar i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--or); transition: width .3s ease; }\n  #lobby .pq-row { display: grid; gap: calc(var(--u) * .6); margin-top: calc(var(--u) * .8); }\n  #lobby .pq-row h4 { margin: 0; font-size: calc(var(--u) * .9); color: var(--or); letter-spacing: .14em; font-weight: 900; grid-column: 1 / -1; }\n  #lobby .pq-c { font: inherit; text-align: left; position: relative; cursor: pointer; background: #fff; border: calc(var(--u) * .22) solid #111; padding: calc(var(--u) * .5) calc(var(--u) * .7); transition: transform .12s ease; }\n  #lobby .pq-c b { display: block; font-size: calc(var(--u) * 1.2); font-weight: 900; } #lobby .pq-c small { display: block; color: #6B675F; font-weight: 700; font-size: calc(var(--u) * .78); }\n  #lobby .pq-c em { position: absolute; right: calc(var(--u) * .4); top: calc(var(--u) * .35); font-style: normal; font-size: calc(var(--u) * .8); font-weight: 900; color: #1E9E57; }\n  #lobby .pq-c.rec::before { content: '推荐'; position: absolute; left: calc(var(--u) * -.2); top: calc(var(--u) * -1); background: #1E9E57; color: #fff; font-size: calc(var(--u) * .7); font-weight: 900; padding: 0 calc(var(--u) * .4); }\n  #lobby .pq-c:hover:not(:disabled) { transform: translateY(calc(var(--u) * -.2)); } #lobby .pq-c.on { background: #111; color: var(--paper); box-shadow: calc(var(--u) * .3) calc(var(--u) * .3) 0 var(--or); } #lobby .pq-c.on small { color: #B9B4AA; }\n  #lobby .pq-c:disabled { opacity: .4; cursor: default; } #lobby .pq-c.slow em { color: #E0504A; }\n  #lobby .pq-go { font: inherit; margin-top: calc(var(--u) * 1); float: right; font-weight: 900; font-size: calc(var(--u) * 1.2); padding: calc(var(--u) * .5) calc(var(--u) * 2); border: calc(var(--u) * .3) solid #111; background: var(--or); color: #fff; cursor: pointer; }\n  #lobby .pq-note { color: #6B675F; font-weight: 700; font-size: calc(var(--u) * .85); margin-top: calc(var(--u) * 1.3); }"),
                        document.head.appendChild(t));
                    })());
                  const t = (this.el = document.createElement("div"));
                  ((t.id = "lobby"),
                    (t.className = "pq"),
                    host().appendChild(t),
                    t.addEventListener("click", (t) => {
                      const e = t.target.closest("[data-q],[data-s]");
                      if (e && !e.disabled)
                        return (
                          e.dataset.q ? (this.q = e.dataset.q) : (this.sh = +e.dataset.s),
                          this.apply(),
                          void this.render()
                        );
                      const a = t.target.closest("[data-f]");
                      if (a)
                        return (
                          (this.game.settings.maxFps = +a.dataset.f),
                          this.game.saveSettings(),
                          void this.render()
                        );
                      if (t.target.closest('[data-a="go"]')) {
                        const t = this.next;
                        ((this.next = null), t && t());
                      }
                    }),
                    this.render());
                }
                render() {
                  const t = this.el;
                  if (!t) return;
                  if (((this.shown = this.phase), "pick" !== this.phase))
                    return void (t.innerHTML =
                      '<div class="pq-panel"><div class="pq-hd"><b>画质检测</b><span class="st">正在载入竞技场…</span><span class="fps"></span></div><div class="pq-bar"><i style="width:0"></i></div>\n            <div class="pq-note">在竞技场里实际跑一遍，按你的设备推荐画质和光影（约 10 秒），之后在 设置 → 画面 里随时可以改。</div></div>');
                  const e = this.fxOk,
                    a = SHADER_CARDS.find((t) => t.lv === this.sh) || SHADER_CARDS[0],
                    o = QUALITY_CARDS.find((t) => t.id === this.q) || QUALITY_CARDS[0],
                    fps = (t, e) => this.estimate(t, e),
                    s = Math.min(55, 0.9 * this.gameFps);
                  t.innerHTML = `<div class="pq-panel"><div class="pq-hd"><b>检测完成</b><span>${esc(this.hw.gpu)}</span><span class="fps">预计 ${fps(o, a)} 帧</span></div>\n          <div class="pq-row" style="grid-template-columns:repeat(${QUALITY_CARDS.length},1fr)"><h4>画质</h4>${QUALITY_CARDS.map(
                    (t) => {
                      const e = fps(t, a);
                      return `<button class="pq-c ${t.id === this.q ? "on" : ""} ${this.rec && this.rec.q === t.id ? "rec" : ""} ${e < s ? "slow" : ""}" data-q="${t.id}"><b>${t.name}</b><small>${Bt[t.id] || t.sub}</small><em>${e} 帧</em></button>`;
                    },
                  ).join(
                    "",
                  )}</div>\n          <div class="pq-row" style="grid-template-columns:repeat(${SHADER_CARDS.length},1fr)"><h4>光影${e ? (this.hw.phone ? " · 手机开光影更耗电发热" : "") : " · 这台设备不支持光影"}</h4>${SHADER_CARDS.map(
                    (t) => {
                      const a = fps(o, t),
                        i = t.lv && !e;
                      return `<button class="pq-c ${t.lv === this.sh ? "on" : ""} ${this.rec && this.rec.sh === t.lv ? "rec" : ""} ${a < s ? "slow" : ""}" data-s="${t.lv}" ${i ? "disabled" : ""}><b>${t.name}</b><small>${t.sub}</small><em>${i ? "—" : a + " 帧"}</em></button>`;
                    },
                  ).join("")}</div>\n          ${(() => {
                    const t = this.fpsOpts(),
                      e = this.fpsNow(),
                      a = this.hw.phone && this.hz > 65 ? 60 : -1;
                    return `<div class="pq-row" style="grid-template-columns:repeat(${t.length},1fr)"><h4>帧率上限 · 屏幕 ${this.hz} Hz</h4>${t.map((t) => `<button class="pq-c ${t.v === e ? "on" : ""} ${t.v === a ? "rec" : ""}" data-f="${t.v}"><b>${t.n}</b><small>${t.sub || "&nbsp;"}</small></button>`).join("")}</div>`;
                  })()}\n          <button class="pq-go" data-a="go">就这样</button><div class="pq-note">绿色「推荐」是测出来最合适的；红色帧数表示可能会卡。之后在 设置 → 画面 里都能改。</div></div>`;
                }
                draw(t) {
                  this.tick();
                  const e = this.game.player;
                  if (
                    (e && ((e.yaw += 0.0022), (e.pitch = 0.1)),
                    this.phase !== this.shown && this.render(),
                    "detect" === this.phase && this.el)
                  ) {
                    const t = this.levels.length,
                      e = this.benchFrom
                        ? Math.min(
                            0.999,
                            (this.li + Math.min(1, (performance.now() - this.lt0) / 2e3)) / t,
                          )
                        : 0,
                      a = this.el.querySelector(".pq-bar i"),
                      o = this.el.querySelector(".st"),
                      s = this.el.querySelector(".fps");
                    if (
                      (a && (a.style.width = (100 * e).toFixed(1) + "%"),
                      o &&
                        (o.textContent = this.benchFrom
                          ? "检测中 · 光影「" +
                            ((SHADER_CARDS.find((t) => t.lv === this.levels[this.li]) || {}).name ||
                              "") +
                            "」"
                          : "正在载入竞技场…"),
                      s && this.got && this.got.length)
                    ) {
                      const t = this.got.slice().sort((t, e) => t - e),
                        e = t[t.length >> 1];
                      s.textContent = Math.round(1e3 / Math.max(1, e)) + " 帧";
                    }
                  }
                }
                onEsc() {}
                mouseDown() {}
                close() {
                  (this.unhook && this.unhook(),
                    this.el && (unmount(this.el), (this.el = null)),
                    (this.game.ui.hideHud = this.hud0));
                }
              }),
              Rt))
        );
      })();
      a
        ? t.ui.open(
            new a(t, () => {
              let a = "lobby";
              try {
                ((a = sessionStorage.getItem("potato:bench") || "lobby"),
                  sessionStorage.removeItem("potato:bench"),
                  sessionStorage.setItem("potato:after", a));
              } catch (t) {}
              ((t.settings.potBench = !0), t.saveSettings(), t.ui.close(), e());
            }),
          )
        : e();
    },
  };
  let Rt = null;
  class PotatoWelcome extends MenuScreen {
    constructor(t, e, a) {
      (super(t, null),
        (this.potato = !0),
        (this.pauses = !1),
        (this.blurBg = !1),
        (this.bgDim = 0),
        (this.el = null),
        (this.first = e),
        (this.step = a || 0),
        (this.tab = "agreement"),
        (this.ok = !1));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      const t = this.game;
      ((() => {
        if ((ensureCss(), !document.getElementById("wl-css"))) {
          const t = document.createElement("style");
          ((t.id = "wl-css"),
            (t.textContent =
              "\n  #lobby.wl .wl-dim { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(10,11,14,.94) 0%, rgba(10,11,14,.84) 55%, rgba(10,11,14,.25) 88%); pointer-events: auto; animation: lbFade .3s ease-out; }\n  #lobby .wl-wrap { position: absolute; left: calc(var(--u) * 5); top: 50%; transform: translateY(-50%); width: calc(var(--u) * 54); display: flex; flex-direction: column; gap: calc(var(--u) * 1.3); pointer-events: auto; }\n  #lobby .wl-wrap > * { animation: lbUp .45s cubic-bezier(.2,.9,.25,1) backwards; } #lobby .wl-wrap > :nth-child(2) { animation-delay: .06s; } #lobby .wl-wrap > :nth-child(3) { animation-delay: .12s; }\n  #lobby .wl-hi { font-size: calc(var(--u) * 4.4); color: #F2EFE9; line-height: 1; display: flex; align-items: flex-end; gap: calc(var(--u) * 1.2); }\n  #lobby .wl-hi b { font-size: calc(var(--u) * 1.6); font-weight: 900; color: var(--or); letter-spacing: .08em; }\n  #lobby .wl-sub { font-size: calc(var(--u) * 1.25); font-weight: 800; color: #CFCBC2; line-height: 1.6; }\n  #lobby .wl-card { background: #F2EFE9; color: #111; border: calc(var(--u) * .3) solid #111; box-shadow: calc(var(--u) * .8) calc(var(--u) * .8) 0 var(--or); padding: calc(var(--u) * 1.3) calc(var(--u) * 1.6); display: flex; flex-direction: column; gap: calc(var(--u) * .9); }\n  #lobby .wl-tabs { display: flex; gap: calc(var(--u) * .5); }\n  #lobby .wl-tab { font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.1); padding: calc(var(--u) * .3) calc(var(--u) * .9); border: calc(var(--u) * .2) solid #111; background: transparent; color: #111; cursor: pointer; }\n  #lobby .wl-tab.on { background: #111; color: #F2EFE9; }\n  #lobby .wl-text { height: calc(var(--u) * 16); overflow-y: auto; font-size: calc(var(--u) * .95); line-height: 1.7; font-weight: 600; color: #3A3730; border-top: 1px solid rgba(0,0,0,.15); border-bottom: 1px solid rgba(0,0,0,.15); padding: calc(var(--u) * .6) calc(var(--u) * .6) calc(var(--u) * .6) 0; scrollbar-width: thin; }\n  #lobby .wl-text p { margin: 0 0 .35em; } #lobby .wl-text p:first-child { font-weight: 900; color: #111; }\n  /* (a short screen - a phone on its side in the app, its bars taken off: the card ran off the bottom, the tick box and 同意并继续\n     out of reach and nothing to scroll - 「有人反应用户协议同意不了」 11-20: never taller than the screen, the text the part that\n     gives way (it scrolls itself), the words above it dropped when short, the whole scrolled if still too tall) */\n  #lobby .wl-wrap { max-height: calc(100% - 12px); overflow-y: auto; overscroll-behavior: contain; }\n  #lobby .wl-card { min-height: 0; flex: 0 1 auto; }\n  #lobby .wl-text { height: auto; flex: 1 1 calc(var(--u) * 16); max-height: calc(var(--u) * 16); min-height: calc(var(--u) * 4.5); }\n  @media (max-height: 470px) { #lobby .wl-sub { display: none; } #lobby .wl-hi { font-size: calc(var(--u) * 2.8); } #lobby .wl-wrap { gap: calc(var(--u) * .7); } #lobby .wl-card { gap: calc(var(--u) * .6); padding: calc(var(--u) * .9) calc(var(--u) * 1.3); } }\n  #lobby .wl-ck { display: flex; align-items: center; gap: calc(var(--u) * .7); font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.15); cursor: pointer; user-select: none; color: inherit; background: transparent; border: 0; width: 100%; text-align: left; min-height: 40px; padding: 6px 0; margin-bottom: 6px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }\n  #lobby .wl-ck i { position: relative; width: calc(var(--u) * 1.5); height: calc(var(--u) * 1.5); border: calc(var(--u) * .22) solid #111; flex: none; transition: background .12s ease; }\n  #lobby .wl-ck.on i { background: var(--or); }\n  #lobby .wl-ck.on i::after { content: ''; position: absolute; left: 32%; top: 8%; width: 28%; height: 56%; border: solid #111; border-width: 0 calc(var(--u) * .25) calc(var(--u) * .25) 0; transform: rotate(45deg); }\n  #lobby .wl-ck.shake { animation: wlShake .35s; } @keyframes wlShake { 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }\n  #lobby .wl-go { font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.6); padding: calc(var(--u) * .65) calc(var(--u) * 1.4); border: 0; background: #111; color: #F2EFE9; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: opacity .15s ease, transform .15s ease; }\n  #lobby .wl-go:hover { transform: translateY(calc(var(--u) * -.15)); } #lobby .wl-go.dis { opacity: .4; } #lobby .wl-go svg.bt { height: .7em; }\n  #lobby .wl-two { display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--u) * 1.1); }\n  #lobby .wl-three { grid-template-columns: repeat(3, 1fr); } #lobby .wl-tp .pic svg { width: 100%; height: auto; display: block; margin-bottom: calc(var(--u) * .5); } #lobby .wl-pick.on { border-color: var(--mc); box-shadow: inset 0 0 0 2px var(--mc); }\n  #lobby .wl-pick { position: relative; overflow: hidden; font: inherit; text-align: left; cursor: pointer; background: rgba(0,0,0,.38); color: #F2EFE9; border: 1px solid rgba(242,239,233,.2); border-top: calc(var(--u) * .45) solid var(--mc);\n    padding: calc(var(--u) * 1.2); display: flex; flex-direction: column; gap: calc(var(--u) * .45); transition: transform .18s cubic-bezier(.2,.9,.25,1), box-shadow .18s ease, border-color .18s ease; animation: lbUp .4s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(var(--i) * 80ms + .1s); }\n  #lobby .wl-pick::after { content: ''; position: absolute; right: calc(var(--u) * -3); bottom: calc(var(--u) * -3); width: calc(var(--u) * 9); height: calc(var(--u) * 9); background: var(--mc); opacity: .08; transform: rotate(45deg); pointer-events: none; }\n  #lobby .wl-pick:hover { transform: translate(calc(var(--u) * -.25), calc(var(--u) * -.35)); box-shadow: calc(var(--u) * .5) calc(var(--u) * .5) 0 var(--mc); border-color: var(--mc); }\n  #lobby .wl-pick em { align-self: flex-start; font-style: normal; font-size: calc(var(--u) * .82); font-weight: 900; background: var(--mc); color: #111; padding: 0 calc(var(--u) * .45); }\n  #lobby .wl-pick b { font-size: calc(var(--u) * 2.1); font-weight: 900; } #lobby .wl-pick small { font-size: calc(var(--u) * .95); color: #CFCBC2; font-weight: 700; line-height: 1.6; }\n  #lobby .wl-pick .n { font-size: calc(var(--u) * 2.4); color: var(--mc); line-height: 1; }\n  #lobby .wl-steps { display: flex; flex-wrap: wrap; gap: calc(var(--u) * .35); } #lobby .wl-steps span { font-size: calc(var(--u) * .82); font-weight: 900; background: rgba(242,239,233,.1); padding: calc(var(--u) * .05) calc(var(--u) * .45); }\n  "),
            document.head.appendChild(t));
        }
      })(),
        t.lobby && t.lobby.moveTo({ cx: 0.8, tall: 0.8, foot: 0.04 }, Math.PI - 0.45));
      const e = (this.el = document.createElement("div"));
      ((e.id = "lobby"),
        (e.className = "wl"),
        host().appendChild(e),
        e.addEventListener("click", (t) => {
          const a = t.target.closest("[data-t]");
          if (a) return ((this.tab = a.dataset.t), void this.render());
          const o = t.target.closest("[data-a]");
          if (!o) return;
          const s = o.dataset.a;
          "ck" === s
            ? ((this.ok = !this.ok),
              o.classList.toggle("on", this.ok),
              o.setAttribute("aria-checked", this.ok ? "true" : "false"),
              e.querySelector(".wl-go").classList.toggle("dis", !this.ok))
            : "agree" === s
              ? this.agree()
              : "tut" === s
                ? this.pick(!0)
                : "skip" === s
                  ? this.pick(!1)
                  : "pc" === s || "phone" === s
                    ? this.device(s)
                    : s.startsWith("tp") && this.preset(s.slice(2));
        }),
        this.render());
    }
    render() {
      const t = this.el;
      if (!t) return;
      const e = this.game.settings,
        a = !this.first && (e.legalV || 0) > 0,
        o = "undefined" != typeof LEGAL ? LEGAL : { agreement: [], privacy: [] };
      if (0 === this.step)
        t.innerHTML = `<div class="wl-dim"></div><div class="wl-wrap">\n          <div class="wl-hi">${blockText("WELCOME")}<b>土豆史诗</b></div>\n          <div class="wl-sub">${a ? "用户协议和隐私说明更新了，请再看一下。" : "体素风格的网页射击游戏：天梯排位、好友约战、靶场训练，永久免费。<br>开始之前，请先看一下用户协议和隐私说明。"}</div>\n          <div class="wl-card">\n            <div class="wl-tabs"><button class="wl-tab ${"agreement" === this.tab ? "on" : ""}" data-t="agreement">用户协议</button><button class="wl-tab ${"privacy" === this.tab ? "on" : ""}" data-t="privacy">隐私说明</button></div>\n            <div class="wl-text">${(o[this.tab] || []).map((t) => `<p>${esc(t)}</p>`).join("")}</div>\n            <button type="button" role="checkbox" aria-checked="${this.ok ? "true" : "false"}" class="wl-ck ${this.ok ? "on" : ""}" data-a="ck"><i></i>我已阅读并同意《用户协议》和《隐私说明》</button>\n            <button class="wl-go ${this.ok ? "" : "dis"}" data-a="agree"><span>同意并继续</span>${blockText(">")}</button>\n          </div></div>`;
      else if ("device" === this.step) {
        const e = "undefined" != typeof TouchDevice && TouchDevice.defaultOn ? "phone" : "pc";
        t.innerHTML = `<div class="wl-dim"></div><div class="wl-wrap">\n          <div class="wl-hi">${blockText("DEVICE")}<b>你用什么设备玩？</b></div>\n          <div class="wl-sub">选手机会打开触屏按键，并让你挑一套键位方案；以后在 设置 → 触屏 里随时可以改。</div>\n          <div class="wl-two">\n            <button class="wl-pick" data-a="pc" style="--mc:#2EA6F0;--i:0">${"pc" === e ? "<em>检测到</em>" : ""}<span class="n">${blockText("PC")}</span><b>用电脑玩</b><small>键盘 + 鼠标</small></button>\n            <button class="wl-pick" data-a="phone" style="--mc:#19C79A;--i:1">${"phone" === e ? "<em>检测到</em>" : ""}<span class="n">${blockText("M")}</span><b>用手机玩</b><small>触屏操作（平板也选这个）</small></button>\n          </div></div>`;
      } else if ("preset" === this.step) {
        const e = this.game.settings.potTouchPreset || "2";
        t.innerHTML = `<div class="wl-dim"></div><div class="wl-wrap">\n          <div class="wl-hi">${blockText("TOUCH")}<b>选一套键位</b></div>\n          <div class="wl-sub">没玩过手机射击游戏就选二指；进游戏后在 设置 → 触屏 → 编辑按钮布局 里还能拖动、缩放每个按钮。</div>\n          <div class="wl-two wl-three">${ot.map(([t, a, o, s], i) => `<button class="wl-pick wl-tp ${t === e ? "on" : ""}" data-a="tp${t}" style="--mc:${["#19C79A", "#2EA6F0", "#FF5A1F"][i]};--i:${i}">${"2" === t ? "<em>推荐新手</em>" : ""}<div class="pic">${tpPic(s)}</div><b>${a}</b><small>${esc(o)}</small></button>`).join("")}</div></div>`;
      } else {
        const e = ["移动", "跳跃 · 下蹲", "滑铲", "开火", "开镜", "换弹", "爆头", "急停", "连杀"];
        t.innerHTML = `<div class="wl-dim"></div><div class="wl-wrap">\n          <div class="wl-hi">${blockText("READY?")}<b>第一次玩？</b></div>\n          <div class="wl-sub">先花两分钟熟悉操作，再去天梯和好友对枪。</div>\n          <div class="wl-two">\n            <button class="wl-pick" data-a="tut" style="--mc:#19C79A;--i:0"><em>推荐 · 约 2 分钟</em><span class="n">${blockText("01")}</span><b>新手训练</b><small>在靶场里一步一步来，枪直接发到手上：</small><div class="wl-steps">${e.map((t) => `<span>${t}</span>`).join("")}</div></button>\n            <button class="wl-pick" data-a="skip" style="--mc:#FF5A1F;--i:1"><em>玩过射击游戏</em><span class="n">${blockText("02")}</span><b>直接进大厅</b><small>以后想练：靶场的训练控制台里随时可以开始「教学」。</small></button>\n          </div></div>`;
      }
    }
    agree() {
      if (!this.ok) {
        this.ok = !0;
        const t = this.el.querySelector(".wl-ck"),
          e = this.el.querySelector(".wl-go");
        if (
          (t &&
            (t.classList.add("on"),
            t.setAttribute("aria-checked", "true"),
            t.classList.remove("shake"),
            t.offsetWidth,
            t.classList.add("shake")),
          e)
        ) {
          e.classList.remove("dis");
          const t = e.querySelector("span");
          t && (t.textContent = "已勾选同意 · 再点一次继续");
        }
        return;
      }
      const t = this.game,
        e = t.settings;
      if (("undefined" != typeof LEGAL && (e.legalV = LEGAL.v), t.saveSettings(), this.first))
        return !e.potBench && self.PotatoQuality
          ? void self.PotatoQuality.run(t, "onboard")
          : ((this.step = e.potDevice ? 1 : "device"), void this.render());
      (t.lobby && t.lobby.moveTo(l, Math.PI + 0.3), t.ui.close());
    }
    device(t) {
      const e = this.game,
        a = e.settings,
        o = "phone" === t;
      (o ? (a.touch = !0) : delete a.touch,
        (a.touchPick = t),
        (a.potDevice = t),
        (e.touchAuto = void 0),
        e.saveSettings(),
        e.applySettings && e.applySettings());
      try {
        "undefined" != typeof Telemetry && Telemetry.count && Telemetry.count("device_" + t);
      } catch (t) {}
      ((this.step = o ? "preset" : 1), this.render());
    }
    preset(t) {
      const e = this.game,
        a = e.settings;
      ((a.potTouchPreset = t),
        (a.touchLayout = {}),
        (a.touchScale = {}),
        e.saveSettings(),
        e.ui.touch && (e.ui.touch.L = null),
        (this.step = 1),
        this.render());
    }
    pick(t) {
      const e = this.game,
        a = e.settings;
      (Object.assign(a, {
        onboarded: !0,
        playerKind: t ? "new" : "vet",
        seenBuild: "undefined" != typeof GAME_BUILD ? GAME_BUILD : a.seenBuild,
      }),
        e.saveSettings());
      try {
        "undefined" != typeof Telemetry &&
          Telemetry.count &&
          Telemetry.count(t ? "potato_tut" : "potato_skip");
      } catch (t) {}
      if ((e.lobby && e.lobby.moveTo(l, Math.PI + 0.3, 400), t)) {
        try {
          sessionStorage.setItem("potato:tut", "1");
        } catch (t) {}
        openRange(e);
      } else e.ui.close();
    }
    onEsc() {}
    close() {
      this.el && (unmount(this.el), (this.el = null));
    }
    draw(t) {}
    mouseDown() {}
  }
  self.PotatoWelcome = PotatoWelcome;
  const g0Login = (t, e) => {
    "undefined" != typeof LoginScreen &&
      t.ui.open(new LoginScreen(t, () => t.ui.open(new PotatoCustom(t, e.parent))));
  };
  {
    const Me = setInterval(() => {
      const t = self.XZ;
      t &&
        t.roomSend &&
        (clearInterval(Me),
        (t.onRoom = (t, e, a) => {
          const o = t && t.ui && t.ui.screen;
          o instanceof PotatoCustom
            ? o.onRoom(e, a)
            : e && "lobby" === e.st && "title" === t.state && o instanceof LobbyScreen
              ? t.ui.open(new PotatoCustom(t, new LobbyScreen(t)))
              : !e && a && t && t.ui && t.ui.message(a, "#FFAA55");
        }),
        (t.onRoomError = (t) => {
          const e = self.game,
            a = e && e.ui && e.ui.screen;
          a instanceof PotatoCustom
            ? a.say(t, !0)
            : e && e.ui && e.ui.message("房间：" + t, "#FF5555");
        }));
    }, 400);
  }
  class PotatoLoadout extends MenuScreen {
    constructor(t) {
      (super(t, null),
        (this.potato = !0),
        (this.pauses = !1),
        (this.blurBg = !1),
        (this.bgDim = 0),
        (this.el = null),
        (this.pick = t.player ? t.player.inv.sel : 0));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      const t = this.game;
      (ensureCss(),
        (() => {
          if (!document.getElementById("lo-css")) {
            const t = document.createElement("style");
            ((t.id = "lo-css"),
              (t.textContent =
                "\n  #lobby.lo .lo-body { display: grid; grid-template-columns: calc(var(--u) * 19) 1fr calc(var(--u) * 22); gap: calc(var(--u) * 1.1); flex: 1; min-height: 0; }\n  #lobby.lo .rk-wrap { width: auto; right: calc(var(--u) * 3.5); }\n  #lobby.lo .rk-dim { background: rgba(10,11,14,.86); }\n  #lobby .lo-pan { border: 1px solid rgba(242,239,233,.16); background: rgba(242,239,233,.03); padding: calc(var(--u) * 1); display: flex; flex-direction: column; gap: calc(var(--u) * .6); min-height: 0; pointer-events: auto; }\n  #lobby .lo-cap { font-size: calc(var(--u) * .95); color: #A9A59C; font-weight: 800; letter-spacing: .12em; display: flex; gap: calc(var(--u) * .6); align-items: center; }\n  #lobby .lo-cap::before { content: ''; width: calc(var(--u) * .6); height: calc(var(--u) * .6); background: var(--or); }\n  #lobby .lo-slots { display: flex; flex-direction: column; gap: calc(var(--u) * .5); overflow-y: auto; min-height: 0; flex: 1; }\n  #lobby .lo-slot { display: grid; grid-template-columns: calc(var(--u) * 2) calc(var(--u) * 6.5) 1fr; align-items: center; gap: calc(var(--u) * .7); padding: calc(var(--u) * .6); cursor: pointer;\n    border: 1px solid rgba(242,239,233,.12); background: rgba(242,239,233,.04); transition: background .15s ease, border-color .15s ease; }\n  #lobby .lo-slot:hover { background: rgba(242,239,233,.08); } #lobby .lo-slot.on { border-color: var(--or); background: rgba(255,90,31,.12); }\n  #lobby .lo-slot i { font-style: normal; font-weight: 900; font-size: calc(var(--u) * 1.3); color: #A9A59C; } #lobby .lo-slot.on i { color: var(--or); }\n  #lobby .lo-slot img { width: 100%; image-rendering: pixelated; } #lobby .lo-slot b { display: block; font-size: calc(var(--u) * 1.15); font-weight: 900; }\n  #lobby .lo-slot small { display: block; font-size: calc(var(--u) * .85); color: #A9A59C; font-weight: 700; }\n  #lobby .lo-slot.empty { opacity: .55; border-style: dashed; }\n  #lobby .lo-view { align-items: center; justify-content: center; text-align: center; }\n  #lobby .lo-big { width: 86%; max-height: 60%; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(0 calc(var(--u) * 1) calc(var(--u) * 1.6) rgba(0,0,0,.6)); animation: hop 2.6s ease-in-out infinite; }\n  #lobby .lo-name { font-size: calc(var(--u) * 2.6); font-weight: 900; } #lobby .lo-tag { font-size: calc(var(--u) * 1); color: #A9A59C; font-weight: 700; letter-spacing: .06em; }\n  #lobby .lo-hold { margin-top: calc(var(--u) * .4); font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.2); padding: calc(var(--u) * .6) calc(var(--u) * 2.2); border: 0; background: var(--or); color: #fff; cursor: pointer; }\n  #lobby .lo-hold[disabled] { background: #2A2B30; color: #8A877F; cursor: default; }\n  #lobby .lo-stat { display: grid; grid-template-columns: calc(var(--u) * 4.2) 1fr calc(var(--u) * 3.2); align-items: center; gap: calc(var(--u) * .6); font-size: calc(var(--u) * 1); font-weight: 800; }\n  #lobby .lo-stat .bar { height: calc(var(--u) * .55); background: rgba(242,239,233,.1); } #lobby .lo-stat .bar i { display: block; height: 100%; background: var(--or); transition: width .3s cubic-bezier(.2,.9,.25,1); }\n  #lobby .lo-stat em { font-style: normal; text-align: right; color: #D8D4CC; }\n  #lobby .lo-note { font-size: calc(var(--u) * .9); color: #A9A59C; font-weight: 700; line-height: 1.5; margin-top: auto; }\n  #lobby .lo-rack { display: grid; grid-template-columns: repeat(auto-fill, minmax(calc(var(--u) * 8.5), 1fr)); gap: calc(var(--u) * .5); overflow-y: auto; }\n  #lobby .lo-gun { border: 1px solid rgba(242,239,233,.12); background: rgba(242,239,233,.04); padding: calc(var(--u) * .4); cursor: pointer; text-align: center; transition: background .15s ease; }\n  #lobby .lo-gun:hover { background: rgba(255,90,31,.14); } #lobby .lo-gun img { width: 100%; image-rendering: pixelated; } #lobby .lo-gun b { display: block; font-size: calc(var(--u) * .9); font-weight: 800; }\n  #lobby .lo-pan.pick { max-height: calc(var(--pvh, 1vh) * 26); }\n  #lobby .lo-skins { display: flex; flex-wrap: wrap; gap: calc(var(--u) * .45); justify-content: center; margin-top: calc(var(--u) * .4); }\n  #lobby .lo-sk { font: inherit; font-size: calc(var(--u) * .85); font-weight: 800; color: #F2EFE9; background: rgba(242,239,233,.06); border: 1px solid rgba(242,239,233,.2); padding: calc(var(--u) * .25) calc(var(--u) * .7); cursor: pointer; display: flex; align-items: center; gap: calc(var(--u) * .35); }\n  #lobby .lo-sk img { height: calc(var(--u) * 1.8); image-rendering: pixelated; } #lobby .lo-sk em { font-style: normal; color: var(--or); }\n  #lobby .lo-sk.on { border-color: var(--or); background: rgba(255,90,31,.18); } #lobby .lo-sk:hover { border-color: var(--or); }\n  #lobby .lo-skc { font-size: calc(var(--u) * .85); color: #A9A59C; font-weight: 800; margin-top: calc(var(--u) * .3); }"),
              document.head.appendChild(t));
          }
        })());
      const e = self.XZ,
        a = !!(e && e.free && e.free(t)),
        o = !(!t.worldMeta || !t.worldMeta.xzduel),
        s = (this.el = document.createElement("div"));
      ((s.id = "lobby"),
        (s.className = "rk lo"),
        (s.innerHTML = `<div class="rk-dim"></div><div class="rk-wrap">\n        <div class="rk-head"><div class="rk-title">${blockText("LOADOUT")}</div><div class="rk-sub"><b>装备</b><span>${o ? "天梯 · 统一装备 · 只能查看" : a ? "训练场 · 从下面的枪架随意换枪" : "你身上的武器"}</span></div></div>\n        <div class="lo-body">\n          <div class="lo-pan"><div class="lo-cap">武器栏</div><div class="lo-slots"></div></div>\n          <div class="lo-pan lo-view"><img class="lo-big" alt=""><div class="lo-name"></div><div class="lo-tag"></div><button class="lo-hold" data-a="hold">拿在手上</button><div class="lo-skins"></div><div class="lo-skc"></div></div>\n          <div class="lo-pan"><div class="lo-cap">属性</div><div class="lo-stats"></div><div class="lo-note"></div></div>\n        </div>\n        ${a && !o ? '<div class="lo-pan pick"><div class="lo-cap lo-rcap">枪架</div><div class="lo-rack"></div></div>' : ""}\n        <div class="rk-foot"><button class="rk-back" data-a="back">${blockText("<")}<span>返回 · B</span></button></div>\n      </div>`),
        host().appendChild(s),
        s.addEventListener("click", (e) => {
          const a = e.target.closest("[data-a]");
          if (!a) return;
          const o = a.dataset.a;
          if ("back" === o) this.back();
          else if ("slot" === o) ((this.pick = +a.dataset.i), this.fill());
          else if ("hold" === o) {
            const e = t.player;
            e.inv.slots[this.pick] && ((e.inv.sel = this.pick), this.back());
          } else if ("gun" === o) this.put(a.dataset.k);
          else if ("skin" === o) this.wear(a.dataset.g, a.dataset.s || null);
          else if ("skins" === o) {
            const e = self.XZ,
              a = e && e.skinGunOf(t.player.inv.slots[this.pick]);
            t.ui.open(new PotatoGunSkins(t, this, a || "ar"));
          }
        }),
        e && e.skins && ((this.unsub = e.skins.sub(() => this.fill())), e.skins.load()),
        this.fill());
    }
    pic(t) {
      try {
        const e = self.XZ,
          a = ITEM_KEY[e.R.keys[t] || t],
          o = e.g3Icon && e.g3Icon(this.game.renderer, { id: a, count: 1 });
        return o ? o.toDataURL() : "";
      } catch (t) {
        return "";
      }
    }
    picOf(t) {
      const e = self.XZ,
        a = e && e.key(t);
      if (!a) return "";
      if (e.gun(t) && e.skinOf && e.skinOf(t))
        try {
          const a = e.g3Icon(this.game.renderer, t);
          if (a) return a.toDataURL();
        } catch (t) {}
      const o = Object.keys(e.R.guns).find((t) => (e.R.keys[t] || t) === a);
      return this.pic(o || a);
    }
    slots() {
      return [0, 1, 2, 3];
    }
    fill() {
      const t = this.el,
        e = this.game.player,
        a = self.XZ;
      if (!t) return;
      const q = (e) => t.querySelector(e),
        o = this.slots();
      (o.includes(this.pick) || (this.pick = o[0] ?? 0),
        (q(".lo-slots").innerHTML = o
          .map((t) => {
            const o = e.inv.slots[t],
              s = o && a.gun(o),
              i = o && ITEMS[o.id];
            return o
              ? `<div class="lo-slot ${t === this.pick ? "on" : ""}" data-a="slot" data-i="${t}"><i>${t + 1}</i><img src="${this.picOf(o)}" alt=""><div><b>${esc(s ? s.cn : i.cn || i.key)}</b><small>${s ? a.rounds(o) + " / " + a.cap(o) + " 发" : "工具"}</small></div></div>`
              : `<div class="lo-slot empty ${t === this.pick ? "on" : ""}" data-a="slot" data-i="${t}"><i>${t + 1}</i><div></div><div><b>${["长枪", "短枪", "刀", "平板"][t]} · 空</b><small>${t < 2 ? "从枪架选一把" : ""}</small></div></div>`;
          })
          .join("")));
      const s = t.querySelector(".lo-rack"),
        i = t.querySelector(".lo-rcap");
      if (s) {
        const t = self.Potato.SHORT,
          e = Object.keys(a.R.guns).filter((e) =>
            1 === this.pick ? t.includes(e) : 0 === this.pick && !t.includes(e),
          );
        i.textContent =
          0 === this.pick
            ? "长枪 · 点一把换进第 1 格"
            : 1 === this.pick
              ? "短枪 · 点一把换进第 2 格"
              : 2 === this.pick
                ? "刀 · 在「枪皮 → 刀」里换刀和涂装"
                : "平板 · 按 4 拿出来：训练、设置、辅助";
        const o = e
          .map((t) => {
            const e = a.R.guns[t];
            return `<div class="lo-gun" data-a="gun" data-k="${t}"><img src="${this.pic(t)}" alt=""><b>${esc(e.cn)}</b></div>`;
          })
          .join("");
        s.__h !== o && ((s.__h = o), (s.innerHTML = o));
      }
      const l = e.inv.slots[this.pick],
        r = l && a.gun(l),
        d = l && ITEMS[l.id];
      ((q(".lo-big").src = l ? this.picOf(l) : ""),
        (q(".lo-big").style.visibility = l ? "" : "hidden"),
        (q(".lo-name").textContent = l ? (r ? r.cn : d.cn || d.key) : "空位"),
        (q(".lo-tag").textContent = r
          ? (r.auto ? "全自动" : "半自动") +
            " · " +
            (a.R.ammo[r.ammo] ? a.R.ammo[r.ammo].cn : r.ammo)
          : ""));
      const u = q(".lo-hold");
      ((u.disabled = !l || e.inv.sel === this.pick),
        (u.textContent = l ? (e.inv.sel === this.pick ? "正在使用" : "拿在手上") : "空位"));
      const b = Object.values(a.R.guns),
        mx = (t) => Math.max(...b.map(t)),
        h = r
          ? [
              [
                "伤害",
                r.dmg * (r.pellets || 1),
                mx((t) => t.dmg * (t.pellets || 1)),
                String(r.dmg) + (r.pellets > 1 ? "×" + r.pellets : ""),
              ],
              ["射速", r.rate, mx((t) => t.rate), r.rate + "/秒"],
              ["精准", 8 - Math.min(8, r.spread[0]), 8, r.spread[0] + "°"],
              ["开镜", 8 - Math.min(8, 2 * r.spread[1]), 8, r.spread[1] + "°"],
              ["后坐", 10 - Math.min(10, r.recoil), 10, String(r.recoil)],
              ["弹匣", Math.sqrt(a.cap(l)), Math.sqrt(mx((t) => t.cap)), a.cap(l) + " 发"],
              ["穿透", r.pen, mx((t) => t.pen), String(r.pen)],
            ]
          : [];
      ((q(".lo-stats").innerHTML =
        h
          .map(
            ([t, e, a, o]) =>
              `<div class="lo-stat"><span>${t}</span><div class="bar"><i style="width:${Math.max(4, Math.min(100, (e / a) * 100))}%"></i></div><em>${esc(o)}</em></div>`,
          )
          .join("") || '<div class="lo-note">选一把枪看它的属性</div>'),
        (q(".lo-note").textContent = r
          ? "腰射看「精准」，开镜看「开镜」；数字是散布角度，越小越准。移动、跳跃时散布会变大。"
          : ""));
      const p = a.skins,
        v = r && a.skinGunOf(l);
      if (p && v) {
        const t = p.rules.IDS.filter((t) => p.rules.parse(t).gun === v && p.owns(t)),
          e = p.equipped(v);
        ((q(".lo-skins").innerHTML =
          [null, ...t]
            .map(
              (t) =>
                `<button class="lo-sk ${(e || null) === t ? "on" : ""}" data-a="skin" data-g="${v}" data-s="${t || ""}">${t ? esc(p.name(t).replace("晋升 · ", "")) + " <em>" + p.level(t) + "级</em>" : "默认"}</button>`,
            )
            .join("") + '<button class="lo-sk" data-a="skins">全部枪皮 ›</button>'),
          (q(".lo-skc").textContent =
            "枪皮只有你自己看得到 · 终结特效全场可见" + (p.v ? " · 土豆币 " + p.v.coins : "")));
      } else ((q(".lo-skins").innerHTML = ""), (q(".lo-skc").textContent = ""));
    }
    wear(t, e) {
      const a = self.XZ;
      a &&
        a.skins &&
        a.skins
          .equip(t, e)
          .then(() => this.fill())
          .catch((t) => {
            const e = this.el && this.el.querySelector(".lo-skc");
            e && (e.textContent = t.message);
          });
    }
    put(t) {
      const e = this.game,
        a = self.XZ,
        o = ITEM_KEY[a.R.keys[t] || t];
      if (void 0 === o) return;
      const s = { id: o, count: 1, dmg: 0 };
      (a.setRounds(s, a.cap(s)),
        self.Potato.give(e, s) &&
          ((this.pick = self.Potato.slotOf(s)),
          Sound && Sound.click && Sound.click(),
          this.fill()));
    }
    back() {
      const t = this.game;
      "play" === t.state ? t.ui.close() : backTo(t, null);
    }
    onEsc() {
      this.back();
    }
    keyDown(t) {
      if ("function" == typeof keyOf && t === keyOf(this.game, "inventory"))
        return (this.back(), !0);
    }
    close() {
      (this.unsub && (this.unsub(), (this.unsub = null)),
        this.el && (unmount(this.el), (this.el = null)));
    }
    draw(t) {}
    mouseDown() {}
  }
  self.PotatoLoadout = PotatoLoadout;
  const Dt = ["pistol", "revolver"],
    gunKeyOf = (t) => {
      const e = self.XZ;
      if (!e || !e.R || !t) return null;
      const a = e.key(t);
      return Object.keys(e.R.guns).find((t) => (e.R.keys[t] || t) === a) || null;
    },
    slotOf = (t) => {
      const e = self.XZ;
      if (!t || !e || !e.R) return -1;
      if (e.isKnife && e.isKnife(t)) return 2;
      if (e.isTablet && e.isTablet(t)) return 3;
      const a = gunKeyOf(t);
      return a ? (Dt.includes(a) ? 1 : 0) : -1;
    },
    potWorld = (t) => !!(self.POTATO && t && "play" === t.state && t.player && skyMeta());
  if (
    ((self.Potato.slotOf = slotOf),
    (self.Potato.SHORT = Dt),
    (self.Potato.give = (t, e) => {
      const a = t.player,
        o = slotOf(e);
      if (!a || o < 0) return !1;
      if (((a.inv.slots[o] = e), (a.inv.sel = o), o < 2 && t.world && t.world.xzRange)) {
        const a = t.settings,
          s = gunKeyOf(e);
        ((a.potLoad = Object.assign({}, a.potLoad || {}, { [o ? "short" : "long"]: s })),
          t.saveSettings());
      }
      return !0;
    }),
    "undefined" != typeof Inventory)
  ) {
    const $e = Inventory.prototype.add;
    Inventory.prototype.add = function (t, e) {
      const a = self.game;
      if (!t || !potWorld(a) || this !== a.player.inv) return $e.apply(this, arguments);
      const o = slotOf(t);
      return o >= 0 ? ((this.slots[o] = t), 0) : 0;
    };
  }
  {
    const ze = Game.prototype.tick;
    Game.prototype.tick = function () {
      const t = ze.apply(this, arguments);
      try {
        potWorld(this) &&
          self.XZ &&
          self.XZ.R &&
          (0 | this.tickCount) % 10 == 0 &&
          (!(function tidyInv(t) {
            const e = t.player.inv,
              a = e.slots;
            for (let t = 0; t < a.length; t++) {
              if (t >= 36 && t < 40) continue;
              const e = a[t];
              if (!e) continue;
              const o = slotOf(e);
              o !== t && ((a[t] = null), o >= 0 && !a[o] && (a[o] = e));
            }
            if (e.sel > 3 || !a[e.sel]) {
              const t = [0, 1, 2, 3].find((t) => a[t]);
              e.sel = t ?? 0;
            }
            const o = self.XZ;
            if (a[2] && o && o.myKnife && o.knifeStack) {
              const t = o.myKnife(),
                e = o.key(a[2]),
                s = (a[2].xz && a[2].xz.paint) || null;
              if (e !== (o.R.keys[t.key] || t.key) || s !== (t.paint || null)) {
                const t = o.knifeStack();
                t && (a[2] = t);
              }
            }
            t.ui && t.ui.cursor && slotOf(t.ui.cursor) < 0 && (t.ui.cursor = null);
          })(this),
          this.world &&
            this.world.xzRange &&
            !this.net &&
            (function rangeKit(t) {
              const e = self.XZ,
                a = t.player.inv.slots,
                o = t.settings.potLoad || {},
                mk = (t) => {
                  const a = ITEM_KEY[e.R.keys[t] || t];
                  if (void 0 === a) return null;
                  const o = { id: a, count: 1, dmg: 0 };
                  return (e.setRounds(o, e.cap(o)), o);
                };
              (a[0] ||
                (a[0] = mk(o.long && !Dt.includes(o.long) && e.R.guns[o.long] ? o.long : "ar")),
                a[1] || (a[1] = mk(o.short && Dt.includes(o.short) ? o.short : "pistol")),
                !a[2] && e.knifeStack && (a[2] = e.knifeStack()));
            })(this));
      } catch (t) {}
      return t;
    };
  }
  if ("undefined" != typeof Game && Game.prototype.explode) {
    const Pe = Game.prototype.explode;
    Game.prototype.explode = function (t, e, a, o, s, i, l, r) {
      if (!self.POTATO) return Pe.apply(this, arguments);
      const d = this.world,
        u = self.XZ;
      if (!!!(d && d.xzRange && u && u.rangeZone)) return Pe.call(this, t, e, a, o, s, !0, !1, r);
      const b = Object.prototype.hasOwnProperty.call(d, "setBlock"),
        h = d.setBlock,
        p = Object.prototype.hasOwnProperty.call(this, "dropBlockLoot"),
        v = this.dropBlockLoot;
      ((d.setBlock = function (t, e, a, o) {
        if (o || u.rangeZone(t, e, a)) return h.apply(this, arguments);
      }),
        (this.dropBlockLoot = () => {}));
      try {
        return Pe.call(this, t, e, a, o, s, !1, !1, r);
      } finally {
        (b ? (d.setBlock = h) : delete d.setBlock,
          p ? (this.dropBlockLoot = v) : delete this.dropBlockLoot);
      }
    };
  }
  if ("undefined" != typeof Game && Game.prototype.breakSpeed) {
    const Le = Game.prototype.breakSpeed;
    Game.prototype.breakSpeed = function () {
      return self.POTATO ? 0 : Le.apply(this, arguments);
    };
    const Be = Game.prototype.breakBlock;
    Game.prototype.breakBlock = function (t, e, a, o) {
      if (!self.POTATO || o || "creative" !== this.mode || (this.world && this.world.xzRange))
        return Be.apply(this, arguments);
      this.breaking = null;
    };
    const Re = Game.prototype.placeAt;
    Re &&
      (Game.prototype.placeAt = function () {
        if (!self.POTATO) return Re.apply(this, arguments);
      });
  }
  {
    const De = setInterval(() => {
      const t = self.XZ;
      if (!t || !t.R || !t.takeAmmo) return;
      clearInterval(De);
      const e = t.ammoCount,
        a = t.takeAmmo;
      ((t.ammoCount = (t, a) => (self.POTATO && t && t.potAmmo ? 0 | t.potAmmo[a] : e(t, a))),
        (t.takeAmmo = (t, e, o) => {
          if (!(self.POTATO && t && t.potAmmo)) return a(t, e, o);
          const s = Math.min(o, 0 | t.potAmmo[e]);
          return ((t.potAmmo[e] = (0 | t.potAmmo[e]) - s), s);
        }));
    }, 200);
  }
  if ("undefined" != typeof Account && Account.settingsChanged && "undefined" != typeof Game) {
    let Ie = !0;
    try {
      Ie = !localStorage.getItem("potato-settings");
    } catch (He) {}
    const kind = () =>
        ("undefined" != typeof TouchDevice && "phone" === TouchDevice.kind) ||
        /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)
          ? "phone"
          : "pc",
      _e = Game.prototype.saveSettings;
    ((Game.prototype.saveSettings = function () {
      return (this.potApplying || (this.settings.potT = Date.now()), _e.apply(this, arguments));
    }),
      (Account.settingsChanged = function (t) {
        if (!this.loggedIn || "undefined" == typeof game || !game.settings) return;
        (clearTimeout(this.setT), (this.setT = null));
        const go = () => {
          this.setT = null;
          const t = {};
          for (const e of ACCOUNT_SETTINGS)
            void 0 !== game.settings[e] && (t[e] = game.settings[e]);
          let e = {};
          try {
            e = JSON.parse(JSON.stringify(game.settings));
          } catch (t) {}
          const a = (this.data && this.data.settings && this.data.settings.potDev) || {};
          ((t.potDev = Object.assign({}, a, { [kind()]: e })),
            (t.potT = game.settings.potT || Date.now()),
            JSON.stringify(t).length > 15e3 &&
              ((t.potDev = { [kind()]: e }), JSON.stringify(t).length > 15e3 && delete t.potDev),
            this.data && (this.data.settings = t),
            this.update({ settings: t }).catch(() => {}));
        };
        t ? go() : (this.setT = setTimeout(go, 1500));
      }),
      (Account.applySettings = function () {
        const t = this.data && this.data.settings,
          e = "undefined" != typeof game ? game : null;
        if (!t || !e || !e.settings || this.appliedFor === this.data.id) return;
        this.appliedFor = this.data.id;
        const a = e.settings.potT || 0,
          o = t.potT || 0;
        if ((o && a >= o) || (!o && !Ie)) return void (a > o && this.settingsChanged(!0));
        const s = t.potDev && t.potDev[kind()];
        if (s && "object" == typeof s) for (const t in s) e.settings[t] = s[t];
        else for (const a of ACCOUNT_SETTINGS) void 0 !== t[a] && (e.settings[a] = t[a]);
        e.potApplying = !0;
        try {
          e.saveSettings();
        } finally {
          e.potApplying = !1;
        }
        try {
          e.graphicsChanged && e.graphicsChanged();
        } catch (t) {}
      }));
    const flush = () => {
      Account.setT && Account.settingsChanged(!0);
    };
    (document.addEventListener("visibilitychange", () => {
      "hidden" === document.visibilityState && flush();
    }),
      addEventListener("pagehide", flush));
  }
  if ("undefined" != typeof Account && Account.has) {
    const qe = Account.has.bind(Account),
      Xe = new Set(["skin", "online", "jing"]);
    ((Account.has = function (t) {
      return "anim" === t || "static" === t
        ? "off" === gateOf() || ("triple" === gateOf() ? pgDone("both") : qe("anim"))
        : !!Xe.has(t) || qe(t);
    }),
      (Account.allUnlocked = () => !0));
  }
  const It = Game.prototype.drawMob;
  if (
    ((Game.prototype.drawMob = function (t) {
      if (!t || !t.xzDummy || "undefined" == typeof NetPlayer) return It.apply(this, arguments);
      const e = t.type,
        a = t.look,
        H = (e) => Object.prototype.hasOwnProperty.call(t, e),
        o = H("pose"),
        s = t.pose,
        i = H("skin"),
        l = t.skin;
      ((t.type = "player"),
        (t.look = { skin: gt, slim: !1 }),
        (t.pose = NetPlayer.prototype.pose),
        (t.skin = null));
      try {
        return It.apply(this, arguments);
      } finally {
        ((t.type = e),
          (t.look = a),
          o ? (t.pose = s) : delete t.pose,
          i ? (t.skin = l) : delete t.skin);
      }
    }),
    "undefined" != typeof Skins)
  )
    try {
      (Skins.load(ft).catch(() => {}), Skins.load(gt).catch(() => {}));
    } catch (Oe) {}
  if ("undefined" != typeof UI && UI.prototype.drawHUD) {
    const Ue = UI.prototype.drawHUD,
      Ve = /^(heart_(?!vehicle)|food_|armor_|air|hotbar|xp_|jump_bar)/,
      Ne = 81,
      Ze = 8,
      je = 3,
      touchOn = (t) => !!(t.touch && t.touch.on && t.touch.on()),
      ease = (t, e, a, o) => e + (t - e) * Math.exp(-a / o),
      Ge = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
      plate = (t, e, a, o, s, i) => {
        (t.beginPath(),
          i
            ? (t.moveTo(e, a),
              t.lineTo(e + o - je, a),
              t.lineTo(e + o, a + s),
              t.lineTo(e + je, a + s))
            : (t.moveTo(e + je, a),
              t.lineTo(e + o, a),
              t.lineTo(e + o - je, a + s),
              t.lineTo(e, a + s)),
          t.closePath());
      },
      fill = (t, e, a, o, s, i, l) => {
        i <= 0 || ((t.fillStyle = l), t.fillRect(e, a, o * Math.min(1, i), s));
      },
      grad = (t, e, a, o, s) => {
        const i = t.createLinearGradient(0, e, 0, e + a);
        return (i.addColorStop(0, o), i.addColorStop(1, s), i);
      };
    function drawNote(t, e) {
      const a = e ? performance.now() - e.t : 1e9;
      if (a > 2500) return;
      const o = t.ctx,
        s = a > 2e3 ? 1 - (a - 2e3) / 500 : 1,
        i = t.h - 50;
      (o.save(),
        (o.globalAlpha = s),
        (o.font = "700 6.5px " + Ye),
        (o.textAlign = "center"),
        (o.textBaseline = "middle"));
      const l = o.measureText(e.text).width + 16;
      ((o.fillStyle = "rgba(12,13,16,.72)"),
        o.fillRect(t.w / 2 - l / 2, i - 6, l, 12),
        (o.fillStyle = "#FF5A1F"),
        o.fillRect(t.w / 2 - l / 2, i - 6, 1.5, 12));
      const r = String(e.color || "").toUpperCase();
      ((o.fillStyle = /FF55|FF6B|FF7A/.test(r)
        ? "#FF8A7A"
        : /FFFF55|FFAA/.test(r)
          ? "#FFD36B"
          : /55FF/.test(r)
            ? "#7FE3A6"
            : "#F2EFE9"),
        o.fillText(e.text, t.w / 2, i + 0.5),
        o.restore());
    }
    function drawWeapons(t, e, a) {
      const o = t.ctx;
      o.textBaseline = "alphabetic";
      for (const [e, s] of cardRects(t, a).entries()) {
        const i = a.inv.slots[s.i],
          l = s.i === a.inv.sel;
        ((o.fillStyle = l ? "rgba(14,14,16,.82)" : "rgba(14,14,16,.5)"),
          o.fillRect(s.x, s.y, s.w, s.h),
          l && ((o.fillStyle = "#FF5A1F"), o.fillRect(s.x, s.y, s.w, 1.5)),
          o.save(),
          o.translate(s.x + s.w - 17, s.y + (s.h - 16) / 2),
          delete t.drawItem);
        try {
          t.drawItem(i, 0, 0);
        } catch (t) {}
        (o.restore(),
          (o.font = "700 5.5px " + Ke),
          (o.fillStyle = l ? "#FFFFFF" : "rgba(255,255,255,.55)"),
          (o.textAlign = "left"),
          o.fillText(String(e + 1), s.x + 3, s.y + 7));
      }
      o.textAlign = "left";
    }
    function cardRects(t, e) {
      const a = self.XZ,
        o = t.w,
        s = t.h,
        i = t.safe ? t.safe() : { b: 0 },
        l = [];
      for (let t = 0; t < 9; t++) {
        const o = e.inv.slots[t];
        o && ((a && a.isAmmo && a.isAmmo(o)) || l.push({ i: t }));
      }
      const r = s - 8 - (i.b || 0) - 18;
      let d = Math.round(o / 2 - (33 * l.length - 3) / 2);
      for (const t of l) (Object.assign(t, { x: d, y: r, w: 30, h: 18 }), (d += 33));
      return l;
    }
    if (
      ((UI.prototype.drawHUD = function (...t) {
        const e = this.game,
          a = e && e.player;
        if (!!(!a || this.hideHud || "spectator" === e.mode || a.creative))
          return ((this.__hb = null), Ue.apply(this, t));
        const o = !touchOn(this),
          s = Ve;
        ((this.sprite = function (t) {
          return s.test(t) ? void 0 : UI.prototype.sprite.apply(this, arguments);
        }),
          (this.drawItem = function () {}),
          (this.lastSel = a.inv.sel),
          (this.itemNameT = -1e9));
        const i = this.actionBar;
        let l;
        this.actionBar = null;
        try {
          l = Ue.apply(this, t);
        } finally {
          (delete this.sprite, delete this.drawItem, (this.actionBar = i));
        }
        const r = this.ctx;
        r.save();
        try {
          (drawBars(this, e, a, o), drawWeapons(this, e, a), drawNote(this, i));
        } catch (t) {
        } finally {
          r.restore();
        }
        return l;
      }),
      (self.Potato.cardRects = cardRects),
      "function" == typeof pressAction)
    ) {
      const We = pressAction;
      pressAction = function (t, e) {
        if (
          self.POTATO &&
          "string" == typeof e &&
          e.startsWith("hotbar.") &&
          t &&
          t.player &&
          t.ui &&
          "play" === t.state
        ) {
          const a = cardRects(t.ui, t.player)[(+e.slice(7) || 0) - 1];
          return (a && (t.player.inv.sel = a.i), !1);
        }
        return We.apply(this, arguments);
      };
    }
    const Ye = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
      Ke = '"Bahnschrift","DIN Alternate","Arial Narrow",' + Ye;
    function drawBars(t, e, a, o) {
      const s = t.ctx,
        i = t.w,
        l = t.h,
        r = t.safe ? t.safe() : { l: 0, b: 0 },
        d = o ? 10 + r.l : Math.floor(i / 2 - Ne / 2),
        u = o ? l - 10 - Ze - r.b : l - 8 - (r.b || 0) - 18 - 7 - Ze,
        b = performance.now(),
        h = Math.max(1, a.maxHealth || 20),
        p = Math.max(0, a.health),
        v = Math.max(0, a.absorption || 0);
      let m = t.__hb;
      m || (m = t.__hb = { cur: p, trail: p, hold: 0, hit: -1e9, t: b });
      const y = Math.min(0.5, (b - m.t) / 1e3);
      ((m.t = b),
        p < m.cur - 0.01 && ((m.trail = Math.max(m.trail, m.cur)), (m.hold = b + 350), (m.hit = b)),
        (m.cur = p < m.cur ? ease(m.cur, p, y, 0.045) : ease(m.cur, p, y, 0.16)),
        b > m.hold && (m.trail = ease(m.trail, m.cur, y, 0.12)),
        m.trail < m.cur && (m.trail = m.cur));
      const w = p / h <= 0.3,
        k =
          (a.hasEffect && a.hasEffect("poison")
            ? ["#A6D84A", "#6E9C22"]
            : a.hasEffect && a.hasEffect("wither")
              ? ["#6A6A6A", "#353535"]
              : (a.frozenT || 0) >= 140
                ? ["#BFE8FF", "#6BBCE8"]
                : null) || (w ? ["#FF5A4A", "#D61F1F"] : ["#FF8A3D", "#FF4F14"]),
        x = Math.max(0, 1 - (b - m.hit) / 280),
        S = w ? 0.5 + 0.5 * Math.sin(b / 140) : 0;
      if (
        (s.save(),
        plate(s, d, u, Ne, Ze, !1),
        w &&
          ((s.shadowColor = "rgba(255,40,40," + (0.35 + 0.5 * S).toFixed(2) + ")"),
          (s.shadowBlur = 6)),
        (s.fillStyle = "rgba(14,14,16,.72)"),
        s.fill(),
        (s.shadowBlur = 0),
        s.clip(),
        fill(s, d, u, Ne, Ze, m.trail / h, "rgba(255,236,200,.92)"),
        fill(s, d, u, Ne, Ze, m.cur / h, grad(s, u, Ze, k[0], k[1])),
        fill(s, d, u, Ne, 0.38 * Ze, m.cur / h, "rgba(255,255,255,.18)"),
        a.hasEffect && a.hasEffect("regeneration"))
      ) {
        const t = (b / 1100) % 1,
          e = d + Ne * Math.min(1, m.cur / h) * t,
          a = s.createLinearGradient(e - 8, 0, e + 8, 0);
        (a.addColorStop(0, "rgba(255,255,255,0)"),
          a.addColorStop(0.5, "rgba(255,255,255,.4)"),
          a.addColorStop(1, "rgba(255,255,255,0)"),
          (s.fillStyle = a),
          s.fillRect(e - 8, u, 16, Ze));
      }
      (v > 0 && fill(s, d, u, Ne, 1.5, v / h, "#FFD84A"),
        x > 0 &&
          ((s.fillStyle = "rgba(255,255,255," + (0.22 * x).toFixed(2) + ")"),
          s.fillRect(d, u, Ne, Ze)),
        s.restore(),
        plate(s, d, u, Ne, Ze, !1),
        (s.lineWidth = 0.6),
        (s.strokeStyle =
          x > 0 ? "rgba(255,255,255," + (0.4 + 0.6 * x).toFixed(2) + ")" : "rgba(0,0,0,.85)"),
        s.stroke(),
        (s.font = "900 6.4px " + Ge),
        (s.textBaseline = "middle"),
        (s.textAlign = "left"));
      const F = String(Math.ceil(p + v));
      ((s.lineWidth = 1.6),
        (s.strokeStyle = "rgba(0,0,0,.75)"),
        (s.lineJoin = "round"),
        s.strokeText(F, d + je + 2.5, u + Ze / 2 + 0.4),
        (s.fillStyle = "#FFFFFF"),
        s.fillText(F, d + je + 2.5, u + Ze / 2 + 0.4));
      const A = a.inv && a.inv.armorPoints ? a.inv.armorPoints() : 0;
      if (
        (A > 0 &&
          ((s.fillStyle = "rgba(14,14,16,.7)"),
          s.fillRect(d + je, u - 3.2, Ne - je, 2),
          (s.fillStyle = "#D5DDE4"),
          s.fillRect(d + je, u - 3.2, (Ne - je) * Math.min(1, A / 20), 2)),
        a.eyeInWater || a.air < 300)
      ) {
        const t = Math.max(0, Math.min(1, (a.air || 0) / 300)),
          e = Ne - je,
          o = u - (A > 0 ? 6.4 : 3.2);
        ((s.fillStyle = "rgba(14,14,16,.7)"),
          s.fillRect(d + je, o, e, 2),
          (s.fillStyle = "#5BC8FF"),
          s.fillRect(d + je, o, e * t, 2));
      }
    }
  }
  if ("undefined" != typeof UI) {
    const Qe = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
      Je = '"Bahnschrift","DIN Alternate","Arial Narrow",' + Qe,
      ta = 5,
      ea = 8.2,
      aa = 30,
      panel = (t, e, a, o, s) => {
        (t.beginPath(),
          t.moveTo(e, a),
          t.lineTo(e + o - 5, a),
          t.lineTo(e + o, a + 5),
          t.lineTo(e + o, a + s),
          t.lineTo(e, a + s),
          t.closePath(),
          (t.fillStyle = "rgba(14,14,16,.8)"),
          t.fill(),
          (t.lineWidth = 0.5),
          (t.strokeStyle = "rgba(242,239,233,.12)"),
          t.stroke(),
          (t.fillStyle = "#FF5A1F"),
          t.fillRect(e, a, 1.5, s));
      },
      measure = (t, e) => {
        let a = 60;
        for (const o of e) {
          t.font = "800 6px " + Qe;
          let e = t.measureText(o.h[0]).width;
          ((t.font = "700 4.6px " + Je),
            (e += 4 + t.measureText(o.h[1]).width),
            (a = Math.max(a, e + 6)));
          for (const e of o.rows)
            ((t.font = (e[3] ? "700 10px " : "600 5.8px ") + Je),
              (a = Math.max(a, aa + t.measureText(e[1]).width + (e[3] ? 16 : 0))));
        }
        return a + 2 * ta;
      },
      height = (t) =>
        t.reduce((t, e) => t + 10 + e.rows.reduce((t, e) => t + (e[3] ? 13 : ea), 0) + 3, ta),
      draw = (t, e, a, o, s) => {
        panel(t, e, a, o, height(s));
        let i = a + ta;
        ((t.textBaseline = "top"),
          (t.textAlign = "left"),
          s.forEach((a, s) => {
            (s &&
              ((t.fillStyle = "rgba(242,239,233,.10)"), t.fillRect(e + ta, i - 2, o - 2 * ta, 0.5)),
              (t.fillStyle = "#FF5A1F"),
              t.fillRect(e + ta, i + 1.6, 2.6, 2.6),
              (t.font = "800 6px " + Qe),
              (t.fillStyle = "#F2EFE9"),
              t.fillText(a.h[0], e + ta + 5, i));
            const l = t.measureText(a.h[0]).width;
            ((t.font = "700 4.6px " + Je),
              (t.fillStyle = "rgba(242,239,233,.38)"),
              t.fillText(a.h[1], e + ta + 5 + l + 3, i + 1.2),
              (i += 10));
            for (const o of a.rows)
              if (
                ((t.font = "600 4.8px " + Qe),
                (t.fillStyle = "rgba(242,239,233,.45)"),
                t.fillText(o[0], e + ta, i + (o[3] ? 4 : 0.8)),
                o[3])
              ) {
                ((t.font = "700 10px " + Je),
                  (t.fillStyle = o[2] || "#FF8A3D"),
                  t.fillText(o[1], e + ta + aa, i));
                const a = t.measureText(o[1]).width;
                ((t.font = "700 4.6px " + Je),
                  (t.fillStyle = "rgba(242,239,233,.5)"),
                  t.fillText(o[3], e + ta + aa + a + 2.5, i + 4.6),
                  (i += 13));
              } else
                ((t.font = "600 5.8px " + Je),
                  (t.fillStyle = o[2] || "#F2EFE9"),
                  t.fillText(o[1], e + ta + aa, i),
                  (i += ea));
            i += 3;
          }));
      },
      graph = (t, e, a, o, s, i) => {
        const l = PerfMon,
          r = i.pacer.target(),
          d = (s - 12) / (3 * r);
        (panel(t, e, a - s, o, s),
          (t.textBaseline = "top"),
          (t.font = "800 5.4px " + Qe),
          (t.fillStyle = "#F2EFE9"),
          t.fillText("帧时间", e + ta, a - s + 3),
          (t.font = "700 4.4px " + Je),
          (t.fillStyle = "rgba(242,239,233,.45)"),
          t.fillText("FRAME · 绿 正常  黄 偏慢  红 卡顿  蓝 区块", e + ta + 20, a - s + 3.8));
        const u = e + ta,
          b = o - 2 * ta,
          h = a - 3,
          p = Math.min(l.n, l.N),
          v = b / l.N;
        for (let e = 0; e < p; e++) {
          const a = (l.i - 1 - e + l.N) % l.N,
            o = l.dt[a],
            i = Math.min(s - 14, o * d),
            p = u + b - (e + 1) * v;
          ((t.fillStyle = o > 2 * r ? "#FF4F3A" : o > 1.25 * r ? "#FFC94A" : "#2FD38A"),
            t.fillRect(p, h - i, Math.max(0.6, v - 0.2), i));
          const m = Math.min(i, (l.chunk[a] || 0) * d);
          m > 0.4 && ((t.fillStyle = "#4AA8FF"), t.fillRect(p, h - m, Math.max(0.6, v - 0.2), m));
        }
        ((t.fillStyle = "rgba(255,255,255,.75)"),
          t.fillRect(u, h - r * d, b, 0.4),
          (t.fillStyle = "rgba(255,255,255,.3)"),
          t.fillRect(u, h - 2 * r * d, b, 0.4),
          (t.font = "700 4.6px " + Je),
          (t.fillStyle = "rgba(255,255,255,.8)"),
          (t.textAlign = "right"),
          t.fillText((1e3 / r).toFixed(0) + " FPS", u + b, h - r * d - 5.5),
          (t.textAlign = "left"));
      };
    UI.prototype.drawDebug = function () {
      const t = this.game,
        e = t.player,
        a = this.ctx,
        o = this.w,
        s = this.h;
      if (e && t.world) {
        a.save();
        try {
          const i = Math.floor(e.pos[0]),
            l = Math.floor(e.pos[1]),
            r = Math.floor(e.pos[2]),
            d = t.world.minY || 0,
            u = (((((180 * -e.yaw) / Math.PI) % 360) + 540) % 360) - 180,
            b = ["南 +Z", "西 -X", "北 -Z", "东 +X"][Math.round(((u + 180) % 360) / 90) % 4],
            h = t.world.getLight(i, l, r),
            p = t.dayTime(),
            v = t.renderer.stats || {},
            m = t.fps || 0,
            y = m >= 55 ? "#2FD38A" : m >= 30 ? "#FFC94A" : "#FF4F3A",
            w = [
              ["帧率", String(m), y, "FPS"],
              ["渲染", `区段 ${v.sections || 0} · 三角形 ${v.tris || 0}`],
            ];
          "undefined" != typeof DynRes &&
            t.settings.dynRes &&
            w.push(["渲染比例", Math.round(100 * DynRes.scale) + "%"]);
          const k = [
            { h: ["性能", "PERFORMANCE"], rows: w },
            {
              h: ["位置", "POSITION"],
              rows: [
                [
                  "坐标",
                  `${e.pos[0].toFixed(2)}  ${(e.pos[1] + d).toFixed(2)}  ${e.pos[2].toFixed(2)}`,
                ],
                ["方块", `${i}  ${l + d}  ${r}`],
                ["区块", `${i >> 4}  ${r >> 4}`],
                ["朝向", `${b}  ${u.toFixed(1)}° / ${((180 * e.pitch) / Math.PI).toFixed(1)}°`],
              ],
            },
            {
              h: ["场景", "WORLD"],
              rows: [
                ["区块", `已加载 ${t.world.chunks.size} · 待生成 ${t.genQueueLen || 0}`],
                [
                  "实体",
                  `${t.entities.length} · 粒子 ${t.particles ? t.particles.list.length : 0}`,
                ],
                ["光照", `天空 ${h >> 4} · 方块 ${15 & h}`],
                [
                  "时间",
                  `${String(Math.floor((p / 1e3 + 6) % 24)).padStart(2, "0")}:${String(Math.floor((p % 1e3) * 0.06)).padStart(2, "0")}`,
                ],
              ],
            },
          ];
          if (t.target) {
            const e = BLOCKS[t.world.getBlock(...t.target.pos)];
            k.push({
              h: ["准星", "TARGET"],
              rows: [
                ["方块", `${e ? e.cn || e.key : "?"}`],
                ["位置", `${t.target.pos[0]}  ${t.target.pos[1] + d}  ${t.target.pos[2]}`],
              ],
            });
          }
          PerfMon.gpuOn = !0;
          const x = [
              {
                h: ["设备", "SYSTEM"],
                rows: PerfMon.lines(t)
                  .map((t) => {
                    const e = "string" == typeof t ? t : t.text,
                      a = "string" == typeof t ? null : "#FFC94A",
                      o = /^(\S+)[\s：:]+(.*)$/.exec(e);
                    return o && o[1].length <= 6 && !/[\d.(]/.test(o[1])
                      ? [o[1], o[2].replace(/^·\s*/, ""), a]
                      : ["", e, a];
                  })
                  .filter((t) => t[1]),
              },
            ],
            S = measure(a, k),
            F = measure(a, x),
            A = 4;
          (draw(a, 4, A, S, k),
            S + F + 16 > o ? draw(a, 4, A + height(k) + 4, F, x) : draw(a, o - F - 4, A, F, x),
            graph(a, 4, s - 4, Math.max(80, Math.min(170, Math.floor(o / 2) - 91 - 10)), 46, t));
        } finally {
          a.restore();
        }
      }
    };
  }
  const _t = {
    range: { x0: -55, x1: 55, z0: -169, z1: 31 },
    arena: { x0: -21, x1: 21, z0: -13, z1: 13 },
  };
  let Ht = !1;
  const qt = Game.prototype.createWorld;
  if (
    ((Game.prototype.createWorld = async function (...t) {
      Ht = !0;
      try {
        return await qt.apply(this, t);
      } finally {
        Ht = !1;
      }
    }),
    "undefined" != typeof DB && DB.putWorld)
  ) {
    const oa = DB.putWorld.bind(DB);
    DB.putWorld = function (t, ...e) {
      return (Ht && t && !t.sky && (t.sky = 4), oa(t, ...e));
    };
  }
  const skyMeta = () => {
      const t = "undefined" != typeof game ? game : null,
        e = t && t.worldMeta;
      return e && e.sky ? e : null;
    },
    Xt = World.prototype.generateFlat;
  ((World.prototype.generateFlat = function (t, e) {
    const a = skyMeta();
    if (!a || "overworld" !== this.dim) return Xt.call(this, t, e);
    const o = a.xzduel || "天梯竞技场" === a.name ? _t.arena : _t.range,
      s = this.flatTop || 3,
      i = BID.smooth_stone ?? 1,
      l = BID.gray_concrete ?? 1,
      r = new Chunk(t, e).beginFlat();
    for (let a = 0; a < 16; a++)
      for (let d = 0; d < 16; d++) {
        const u = 16 * t + d,
          b = 16 * e + a;
        (u >= o.x0 &&
          u <= o.x1 &&
          b >= o.z0 &&
          b <= o.z1 &&
          ((r.blocks[(s << 8) | (a << 4) | d] = i), (r.blocks[((s - 1) << 8) | (a << 4) | d] = l)),
          (r.biome[16 * a + d] = BI.PLAINS),
          this.tintFor(this.grassMap, 0.3, 0.2, r.grass, 3 * (16 * a + d)),
          this.tintFor(this.foliageMap, 0.3, 0.2, r.foliage, 3 * (16 * a + d)));
      }
    return (r.recount(), r);
  }),
    (self.Potato.sky = () => null));
  const Ot = Game.prototype.env;
  Game.prototype.env = function (t) {
    "play" === this.state && "overworld" === this.dim && skyMeta() && (this.worldTime = 6e3);
    const e = Ot.call(this, t);
    return (this.renderer && (this.renderer.showClouds = this.settings.clouds), e);
  };
  const Ut = Game.prototype.tick;
  Game.prototype.tick = function () {
    const t = Ut.apply(this, arguments);
    return (
      "play" === this.state &&
        skyMeta() &&
        "overworld" === this.dim &&
        ((this.worldTime = 6e3 + (this.worldTime, 0)),
        (this.weather = 0),
        this.worldMeta && ((this.worldMeta.rainTarget = 0), (this.worldMeta.thunder = 0))),
      t
    );
  };
  const Vt = { x: -9999, y: -9999, w: 1, h: 1 };
  self.POTATO_TOUCH = function (t, e) {
    const { W: a, H: o, B: s, gp: i, sf: l } = e,
      r = e.m,
      d = a - r - (l.r || 0),
      u = o - r - (l.b || 0);
    ((t.sneak = { x: d - s, y: u - s, w: s, h: s }),
      (t.jump = { x: d - s, y: u - 2 * s - 4 * i, w: s, h: s }),
      t.descend && (t.descend = { x: d - 2 * s - 3 * i, y: u - s, w: s, h: s }),
      (t.sprint = void 0));
    const b = Math.round(1.5 * s);
    (t.attack && (t.attack = { x: d - s - 6 * i - b, y: u - b - Math.round(0.5 * s), w: b, h: b }),
      t.use &&
        t.attack &&
        (t.use = {
          x: t.attack.x + Math.round((b - s) / 2),
          y: t.attack.y - s - 4 * i,
          w: s,
          h: s,
        }),
      t.interact &&
        ((t.interact.x = d - t.interact.w), (t.interact.y = t.jump.y - t.interact.h - 3 * i)),
      (t.f3 = Vt),
      (t.view = Vt),
      (t.descend = void 0),
      (t.interact = void 0),
      (t.emote = Vt));
    const h = Math.round(0.8 * s),
      p = t.stickHome ? t.stickHome.x - t.stickR : r + (l.l || 0),
      v = t.stickHome ? t.stickHome.y - t.stickR - h - 6 * i : u - 4 * s;
    ((t.potato_leanL = { x: p, y: v, w: h, h: h }),
      (t.potato_leanR = { x: p + h + 4 * i, y: v, w: h, h: h }),
      t.chat &&
        t.chat.x > 0 &&
        (t.potato_score = { x: t.chat.x - t.chat.w - i, y: t.chat.y, w: t.chat.w, h: t.chat.h }));
    const m = this.g,
      y = m && m.player && self.Potato.cardRects ? self.Potato.cardRects(this.ui, m.player) : [];
    if (t.hotbar && ((t.hotbar = Vt), (t.wcards = y), t.inv && y.length)) {
      const e = y[y.length - 1];
      t.inv = { x: e.x + e.w + 4, y: e.y, w: 20, h: e.h };
    }
    t.potato_walk = { x: p + 2 * (h + 4 * i), y: v, w: h, h: h };
    const w = (m && m.settings.potTouchPreset) || "2",
      k = Math.round(1.25 * s);
    if (
      ((t.potato_fireL = Vt),
      ("3" !== w && "4" !== w) ||
        (t.potato_fireL = { x: r + (l.l || 0) + 6 * i, y: Math.round(0.3 * o), w: k, h: k }),
      "4" === w)
    ) {
      const e = Math.round(0.3 * o);
      ((t.jump = { x: d - s, y: e, w: s, h: s }),
        (t.sneak = { x: d - 2 * s - 5 * i, y: e + Math.round(0.35 * s), w: s, h: s }));
    }
  };
  const Nt = {
      fire: "M12 2.8c2.1 2 3.2 4.6 3.2 7.4v7.6H8.8v-7.6c0-2.8 1.1-5.4 3.2-7.4z M8.8 14.2h6.4 M7.6 21.2h8.8",
      aim: "M12 4.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 1 0 0-15z M12 1.8v5 M12 17.2v5 M1.8 12h5 M17.2 12h5",
      reload: "M19.5 12a7.5 7.5 0 1 1-2.2-5.3 M19.8 3.6v4.6h-4.6",
      inspect:
        "M2.2 12s3.5-6.4 9.8-6.4S21.8 12 21.8 12s-3.5 6.4-9.8 6.4S2.2 12 2.2 12z M12 9.2a2.8 2.8 0 1 0 0 5.6a2.8 2.8 0 1 0 0-5.6z",
      jump: "M6 13.5l6-6 6 6 M6 19l6-6 6 6",
      crouch: "M6 5.5l6 6 6-6 M6 11l6 6 6-6 M4.5 21h15",
      pause: "M9 5v14 M15 5v14",
      chat: "M4 4.8h16v10.4H9.6L5.2 19.4v-4.2H4z",
      inv: "M4.5 8.5h15v11h-15z M9 8.5V6.6a3 3 0 0 1 6 0v1.9 M4.5 13h15",
      leanL: "M17 3.5v17 M11.5 7.5L6.5 12l5 4.5 M6.8 12H14",
      leanR: "M7 3.5v17 M12.5 7.5l5 4.5-5 4.5 M17.2 12H10",
      score: "M4 6h16 M4 12h16 M4 18h16 M8 3.5v17",
      walk: "M8.2 3.6c1.8 0 2.8 1.9 2.8 4.4s-1 4.6-2.8 4.6S5.4 10.5 5.4 8s1-4.4 2.8-4.4z M6.2 14.8h3.9 M15.8 8.4c1.8 0 2.8 1.9 2.8 4.4s-1 4.6-2.8 4.6s-2.8-2.1-2.8-4.6s1-4.4 2.8-4.4z M13.8 19.6h3.9",
      close: "M6 6l12 12 M18 6L6 18",
      use: "M12 4v16 M4 12h16",
    },
    Zt = {
      attack: "fire",
      xz_fire: "fire",
      potato_fireL: "fire",
      use: "aim",
      xz_aim: "aim",
      xz_reload: "reload",
      xz_inspect: "inspect",
      jump: "jump",
      sneak: "crouch",
      sneakOn: "crouch",
      pause: "pause",
      chat: "chat",
      inv: "inv",
      potato_leanL: "leanL",
      potato_leanR: "leanR",
      potato_score: "score",
      potato_walk: "walk",
      close: "close",
    },
    jt = new Map();
  if (
    ((self.POTATO_BTN = function (t, e, a, o, s, i, l, r) {
      if (!(o >= 6 && s >= 6)) return;
      (t.save(), (t.imageSmoothingEnabled = !0));
      const d = e + o / 2,
        u = a + s / 2,
        b = Math.min(o, s) / 2 - 1,
        h = !!r && o > 1.3 * s,
        p = t.globalAlpha;
      if ((t.beginPath(), h)) {
        const i = s / 2 - 1;
        (t.moveTo(e + i + 1, a + 1),
          t.arcTo(e + o - 1, a + 1, e + o - 1, a + s - 1, i),
          t.arcTo(e + o - 1, a + s - 1, e + 1, a + s - 1, i),
          t.arcTo(e + 1, a + s - 1, e + 1, a + 1, i),
          t.arcTo(e + 1, a + 1, e + o - 1, a + 1, i),
          t.closePath());
      } else t.arc(d, u, b, 0, 2 * Math.PI);
      ((t.fillStyle = l ? "rgba(255,122,26,0.55)" : "rgba(14,16,22,0.42)"),
        t.fill(),
        (t.lineWidth = Math.max(1, 0.07 * b)),
        (t.strokeStyle = l ? "rgba(255,190,130,0.95)" : "rgba(255,255,255,0.72)"),
        t.stroke());
      const v = Zt[i];
      if (r && !v)
        return (
          (t.globalAlpha = p),
          Font.center(t, r, d, Math.round(u - 4.5), "#FFFFFF", !0),
          void t.restore()
        );
      if (v && Nt[v]) {
        let e = jt.get(v);
        e || ((e = new Path2D(Nt[v])), jt.set(v, e));
        const a = (1.15 * b) / 24;
        (t.translate(d - 12 * a, u - 12 * a),
          t.scale(a, a),
          (t.lineCap = "round"),
          (t.lineJoin = "round"),
          (t.strokeStyle = "rgba(0,0,0,0.35)"),
          (t.lineWidth = 3.4),
          t.translate(0.4, 0.6),
          t.stroke(e),
          t.translate(-0.4, -0.6),
          (t.strokeStyle = "#FFFFFF"),
          (t.lineWidth = 2.2),
          t.stroke(e),
          "sneakOn" === i &&
            ((t.fillStyle = "#FFB070"),
            t.beginPath(),
            t.arc(19.5, 4.5, 2.4, 0, 2 * Math.PI),
            t.fill()));
      } else r && Font.center(t, r, d, Math.round(u - 4.5), "#FFFFFF", !0);
      t.restore();
    }),
    (self.POTATO_STICK = function (t, e, a, o, s, i, l) {
      (t.save(),
        (t.imageSmoothingEnabled = !0),
        t.beginPath(),
        t.arc(e, a, o, 0, 2 * Math.PI),
        (t.fillStyle = "rgba(14,16,22,0.32)"),
        t.fill(),
        (t.lineWidth = Math.max(1, 0.045 * o)),
        (t.strokeStyle = "rgba(255,255,255,0.6)"),
        t.stroke(),
        t.beginPath(),
        t.arc(e, a, 0.62 * o, 0, 2 * Math.PI),
        (t.strokeStyle = "rgba(255,255,255,0.18)"),
        t.stroke(),
        (t.strokeStyle = "rgba(255,255,255,0.55)"),
        (t.lineWidth = Math.max(1, 0.05 * o)),
        (t.lineCap = "round"),
        (t.lineJoin = "round"));
      for (let s = 0; s < 4; s++) {
        const i = (s * Math.PI) / 2,
          l = 0.82 * o,
          r = 0.09 * o,
          d = e + Math.cos(i) * l,
          u = a + Math.sin(i) * l,
          b = Math.cos(i),
          h = Math.sin(i);
        (t.beginPath(),
          t.moveTo(d - b * r - h * r, u - h * r + b * r),
          t.lineTo(d, u),
          t.lineTo(d - b * r + h * r, u - h * r - b * r),
          t.stroke());
      }
      const r = 0.42 * o;
      (t.beginPath(), t.arc(s, i, r, 0, 2 * Math.PI));
      const d = t.createRadialGradient(s - 0.3 * r, i - 0.35 * r, 0.1 * r, s, i, r);
      (d.addColorStop(0, l ? "#FFD2A8" : "#FFFFFF"),
        d.addColorStop(1, l ? "#FF8A2E" : "#C9CDD6"),
        (t.fillStyle = d),
        (t.globalAlpha *= 0.9),
        t.fill(),
        (t.lineWidth = Math.max(1, 0.08 * r)),
        (t.strokeStyle = "rgba(0,0,0,0.35)"),
        t.stroke(),
        t.restore());
    }),
    "undefined" != typeof TouchControls)
  ) {
    const na = TouchControls.prototype.startPlay;
    TouchControls.prototype.startPlay = function (t) {
      const e = this.layout(),
        a = this.g;
      for (const o of Gt)
        if (e[o] && e[o].x > -1e3 && this.hitL(e[o], t.x, t.y, 0))
          return (
            (t.kind = "pothold"),
            (t.potBtn = o),
            void ((a.touchHeld || (a.touchHeld = {}))[o] = !0)
          );
      const o = a.touchHeld || (a.touchHeld = {});
      if (e.potato_walk && e.potato_walk.x > -1e3 && this.hitL(e.potato_walk, t.x, t.y, 0))
        return ((t.kind = "none"), void (o.potato_walk = !o.potato_walk));
      if (e.potato_fireL && e.potato_fireL.x > -1e3 && this.hitL(e.potato_fireL, t.x, t.y, 0))
        return (
          (t.kind = "abtn"),
          (t.holdBtn = 0),
          (t.noTurn = !0),
          (t.holding = !0),
          (a.mouseBtn[0] = !0),
          (a.mouseClicked0 = !0),
          void (a.attackCd = Math.min(a.attackCd, 0))
        );
      for (const o of e.wcards || [])
        if (this.hitL(o, t.x, t.y, 1)) {
          if (
            ((t.kind = "none"),
            a.player.inv.sel !== o.i && ((a.player.inv.sel = o.i), a.onSlotChange))
          )
            try {
              a.onSlotChange();
            } catch (t) {}
          return;
        }
      return na.call(this, t);
    };
  }
  const Gt = ["potato_leanL", "potato_leanR", "potato_score"];
  if ("undefined" != typeof TouchControls) {
    const sa = TouchControls.prototype.endPlay;
    TouchControls.prototype.endPlay = function (t, e) {
      if (!t || "pothold" !== t.kind) return sa.apply(this, arguments);
      this.g.touchHeld && (this.g.touchHeld[t.potBtn] = !1);
    };
    const ia = [
        "..............",
        ".......##.....",
        "......####....",
        "......####....",
        ".......##.....",
        "......###.#...",
        ".....####.#...",
        "....#.###.#...",
        "....#.###.#...",
        "......###.#...",
        ".....##.#.#...",
        ".....#..#.#...",
        "....##..#.#...",
        "..............",
      ],
      flip = (t) => t.map((t) => t.split("").reverse().join("")),
      la = [
        "..............",
        ".############.",
        ".#..........#.",
        ".#.##.#####.#.",
        ".#..........#.",
        ".#.##.#####.#.",
        ".#..........#.",
        ".#.##.#####.#.",
        ".#..........#.",
        ".#.##.#####.#.",
        ".#..........#.",
        ".############.",
        "..............",
        "..............",
      ],
      ra = setInterval(() => {
        "undefined" != typeof TOUCH_ICONS &&
          (clearInterval(ra),
          Object.assign(TOUCH_ICONS, {
            potato_leanL: flip(ia),
            potato_leanR: ia,
            potato_score: la,
          }));
      }, 300),
      ca = TouchControls.prototype.draw;
    TouchControls.prototype.draw = function (t) {
      ca.call(this, t);
      const e = this.L,
        a = this.g;
      if (!self.POTATO || !e || t.screen || !this.on() || "play" !== a.state) return;
      const o = t.ctx;
      (o.save(), (o.globalAlpha = a.settings.touchOpacity ?? 0.7));
      for (const t of Gt)
        e[t] && e[t].x > -1e3 && this.btn(o, e[t], t, !(!a.touchHeld || !a.touchHeld[t]));
      (e.potato_walk &&
        e.potato_walk.x > -1e3 &&
        this.btn(o, e.potato_walk, "potato_walk", !(!a.touchHeld || !a.touchHeld.potato_walk)),
        e.potato_fireL &&
          e.potato_fireL.x > -1e3 &&
          this.btn(o, e.potato_fireL, "potato_fireL", !!a.mouseBtn[0]),
        o.restore());
    };
    const da = setInterval(() => {
      if ("undefined" == typeof TouchLayoutScreen) return;
      clearInterval(da);
      const t = TouchLayoutScreen.prototype.ids,
        e = ["dpad", "descend", "sprint", "interact", "emote", "f3", "view", "use"];
      ((TouchLayoutScreen.prototype.ids = function () {
        const a = t.call(this),
          o = this.game && this.game.settings.potTouchPreset;
        return self.POTATO
          ? [
              ...a.filter((t) => !e.includes(t)),
              ...Gt,
              "potato_walk",
              ...("3" === o || "4" === o ? ["potato_fireL"] : []),
            ]
          : a;
      }),
        self.POTATO &&
          (TouchLayoutScreen.names = Object.assign(TouchLayoutScreen.names || {}, {
            sneak: "蹲 / 滑铲",
            attack: "开火",
            inv: "装备",
            potato_leanL: "左探头",
            potato_leanR: "右探头",
            potato_score: "比分表",
            potato_walk: "静步",
            potato_fireL: "左侧开火",
          })));
    }, 300);
  }
  const Yt = {
      stick: "摇杆",
      jump: "跳跃",
      sneak: "蹲 / 滑铲",
      attack: "开火",
      inv: "装备",
      pause: "暂停",
      chat: "聊天",
    },
    tlName = (t) => (TouchLayoutScreen.names || {})[t] || Yt[t] || t,
    Kt = setInterval(() => {
      if ("undefined" == typeof TouchLayoutScreen) return;
      if ((clearInterval(Kt), !self.POTATO)) return;
      const t = TouchLayoutScreen.prototype;
      ((t.layout = function () {
        ((this.widgets = []), this.el ? this.tlRender() : this.tlMount());
      }),
        (t.tlMount = function () {
          (ensureCss(),
            (() => {
              if (document.getElementById("tl-css")) return;
              const t = document.createElement("style");
              ((t.id = "tl-css"),
                (t.textContent =
                  "\n  #lobby.tl { pointer-events: none; }\n  #lobby .tl-bar { pointer-events: auto; position: absolute; left: 50%; top: calc(var(--u) * 1.2); transform: translateX(-50%); width: min(calc(var(--u) * 66), 62vw); background: rgba(14,16,22,.88); border: calc(var(--u) * .2) solid rgba(255,255,255,.22); border-radius: calc(var(--u) * 1); padding: calc(var(--u) * .8) calc(var(--u) * 1.2); color: #fff; animation: lbUp .35s cubic-bezier(.2,.9,.25,1) backwards; box-shadow: 0 calc(var(--u) * .6) calc(var(--u) * 2) rgba(0,0,0,.35); }\n  #lobby .tl-hd { display: flex; align-items: center; gap: calc(var(--u) * .8); }\n  #lobby .tl-hd .tl-grip { flex: 0 0 auto; overflow: visible; display: flex; align-items: center; gap: 3px; cursor: grab; touch-action: none; user-select: none; font-size: max(11px, calc(var(--u) * .9)); font-weight: 900; color: #FFD24A;\n    padding: max(4px, calc(var(--u) * .45)) max(8px, calc(var(--u) * .8)); border-radius: calc(var(--u) * 2); background: rgba(255,210,74,.12); border: calc(var(--u) * .15) dashed rgba(255,210,74,.6); }\n  #lobby .tl-hd .tl-grip i { width: 3px; height: 12px; background: #FFD24A; border-radius: 2px; opacity: .8; } #lobby .tl-grip i:last-of-type { margin-right: 3px; }\n  #lobby .tl-bar.drag { cursor: grabbing; box-shadow: 0 calc(var(--u) * 1) calc(var(--u) * 3) rgba(0,0,0,.5); outline: 2px solid rgba(255,210,74,.7); }\n  #lobby .tl-bar.drag .tl-grip { cursor: grabbing; }\n  #lobby .tl-bar.fold .tl-row { display: none; } #lobby .tl-bar.fold .tl-hd > span:not(.tl-grip) { display: none; }\n  #lobby .tl-hd b { font-size: max(15px, calc(var(--u) * 1.7)); font-weight: 900; white-space: nowrap; }\n  #lobby .tl-hd span { flex: 1; font-size: max(11px, calc(var(--u) * .95)); color: #B9BFCC; font-weight: 700; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n  #lobby .tl-b { font: inherit; font-weight: 900; font-size: max(12px, calc(var(--u) * 1.1)); padding: max(5px, calc(var(--u) * .5)) max(11px, calc(var(--u) * 1.2)); border-radius: calc(var(--u) * 2); border: calc(var(--u) * .15) solid rgba(255,255,255,.35); background: rgba(255,255,255,.08); color: #fff; cursor: pointer; white-space: nowrap; }\n  #lobby .tl-b.go { background: var(--or); border-color: var(--or); }\n  #lobby .tl-b:active { transform: scale(.96); }\n  #lobby .tl-row { display: flex; align-items: center; gap: calc(var(--u) * .9); margin-top: max(6px, calc(var(--u) * .7)); font-size: max(12px, calc(var(--u) * 1.05)); font-weight: 800; }\n  #lobby .tl-row label { white-space: nowrap; color: #DDE2EC; min-width: calc(var(--u) * 7); }\n  #lobby .tl-row label i { font-style: normal; color: var(--or); }\n  #lobby .tl-row input[type=range] { flex: 1; min-width: 0; accent-color: var(--or); height: max(22px, calc(var(--u) * 2)); }\n  #lobby .tl-row em { font-style: normal; min-width: calc(var(--u) * 3.6); text-align: right; color: #fff; }\n  #lobby .tl-row.dim { color: #8F96A3; font-weight: 700; }"),
                document.head.appendChild(t));
            })());
          const t = (this.el = document.createElement("div"));
          ((t.id = "lobby"),
            (t.className = "tl"),
            host().appendChild(t),
            t.addEventListener("click", (t) => {
              const e = t.target.closest("[data-a]");
              if (!e) return;
              const a = e.dataset.a,
                o = this.game.settings;
              if ("reset" === a) ((o.touchLayout = {}), (o.touchScale = {}), this.tlRender());
              else if ("save" === a) this.save();
              else if ("cancel" === a) this.discard();
              else if ("fold" === a) ((this.fold = !this.fold), this.tlRender());
              else if ("one" === a && this.sel) {
                const t = Object.assign({}, o.touchLayout || {}),
                  e = Object.assign({}, o.touchScale || {});
                (delete t[this.sel],
                  delete e[this.sel],
                  (o.touchLayout = t),
                  (o.touchScale = e),
                  this.tlRender());
              }
            }),
            t.addEventListener("pointerdown", (e) => {
              const a = e.target.closest(".tl-grip");
              if (!a) return;
              const o = t.querySelector(".tl-bar");
              if (!o) return;
              e.preventDefault();
              try {
                a.setPointerCapture(e.pointerId);
              } catch (t) {}
              const s = t.getBoundingClientRect(),
                i = o.getBoundingClientRect(),
                l = e.clientX - i.left,
                r = e.clientY - i.top;
              o.classList.add("drag");
              const mv = (t) => {
                  const e = Math.max(0, Math.min(s.width - i.width, t.clientX - s.left - l)),
                    a = Math.max(0, Math.min(s.height - i.height, t.clientY - s.top - r));
                  ((this.barPos = { x: e / s.width, y: a / s.height }), this.tlPlace());
                },
                up = () => {
                  (a.removeEventListener("pointermove", mv),
                    a.removeEventListener("pointerup", up),
                    a.removeEventListener("pointercancel", up),
                    o.classList.remove("drag"),
                    this.barPos &&
                      ((this.game.settings.touchBarPos = this.barPos), this.game.saveSettings()));
                };
              (a.addEventListener("pointermove", mv),
                a.addEventListener("pointerup", up),
                a.addEventListener("pointercancel", up));
            }),
            t.addEventListener("input", (t) => {
              const e = t.target,
                a = this.game.settings;
              ("size" === e.dataset.s && this.sel
                ? this.setScale(this.sel, +e.value / 100)
                : "op" === e.dataset.s && (a.touchOpacity = +e.value / 100),
                this.tlVals());
            }),
            this.tlRender());
        }),
        (t.tlRender = function () {
          const t = this.el;
          if (!t) return;
          const e = this.game.settings,
            a = this.sel,
            o = a ? Math.round(100 * this.scaleOf(a)) : 100,
            s = Math.round(100 * (e.touchOpacity ?? 0.7));
          ((t.innerHTML = `<div class="tl-bar ${this.fold ? "fold" : ""}"><div class="tl-hd"><span class="tl-grip" title="按住拖动面板"><i></i><i></i><i></i>拖动</span><b>自定义按键</b><span>${a ? "拖动换位置 · 下面的滑块调大小" : "拖动按钮换位置 · 点一个按钮调它的大小"}</span>\n          <button class="tl-b" data-a="fold">${this.fold ? "展开" : "收起"}</button><button class="tl-b" data-a="reset">全部重置</button>${this.done ? "" : '<button class="tl-b" data-a="cancel">取消</button>'}<button class="tl-b go" data-a="save">${this.done ? "完成" : "保存"}</button></div>\n        ${a ? `<div class="tl-row"><label><i>${esc(tlName(a))}</i> 大小</label><input type="range" data-s="size" min="50" max="300" step="5" value="${Math.min(300, o)}"><em class="tl-sz">${o}%</em><button class="tl-b" data-a="one">恢复</button></div>` : '<div class="tl-row dim">先点一个按钮，这里就能用滑块调它的大小</div>'}\n        <div class="tl-row"><label>按钮不透明度</label><input type="range" data-s="op" min="20" max="100" step="5" value="${s}"><em class="tl-op">${s}%</em></div></div>`),
            this.tlPlace());
        }),
        (t.tlPlace = function () {
          const t = this.el,
            e = t && t.querySelector(".tl-bar");
          if (!e) return;
          const a = this.barPos || this.game.settings.touchBarPos;
          if (!(a && a.x >= 0 && a.y >= 0)) return;
          const o = t.getBoundingClientRect(),
            s = e.getBoundingClientRect();
          ((e.style.left = Math.max(0, Math.min(o.width - s.width, a.x * o.width)) + "px"),
            (e.style.top = Math.max(0, Math.min(o.height - s.height, a.y * o.height)) + "px"),
            (e.style.transform = "none"));
        }),
        (t.tlVals = function () {
          const t = this.el;
          if (!t) return;
          const e = t.querySelector(".tl-sz"),
            a = t.querySelector(".tl-op");
          (e && this.sel && (e.textContent = Math.round(100 * this.scaleOf(this.sel)) + "%"),
            a &&
              (a.textContent = Math.round(100 * (this.game.settings.touchOpacity ?? 0.7)) + "%"));
        }),
        (t.close = function () {
          this.el && (unmount(this.el), (this.el = null));
        }),
        (t.drawExtra = function (t) {
          const e = t.ctx,
            a = this.rects(),
            o = this.game.settings.touchOpacity ?? 0.7;
          for (const s in a) {
            const i = a[s],
              l = this.sel === s,
              r = !(!this.drag || this.drag.id !== s),
              d = i.x + i.w / 2,
              u = i.y + i.h / 2,
              b = Math.max(i.w, i.h) / 2;
            (e.save(),
              (e.globalAlpha = Math.max(o, 0.35)),
              "stick" === s
                ? self.POTATO_STICK(e, d, u, i.w / 2, d, u, !1)
                : self.POTATO_BTN(e, i.x, i.y, i.w, i.h, s, r),
              e.restore(),
              (l || r) &&
                (e.save(),
                (e.strokeStyle = "#FF7A1A"),
                (e.lineWidth = 2),
                e.setLineDash([4, 3]),
                e.beginPath(),
                e.arc(d, u, b + 3, 0, 2 * Math.PI),
                e.stroke(),
                e.restore()));
            const h = tlName(s),
              p = Font.width(h) + 8,
              v = i.y + i.h + 12 <= t.h ? i.y + i.h + 2 : i.y - 12;
            ((e.fillStyle = l ? "rgba(255,122,26,0.9)" : "rgba(10,12,18,0.72)"),
              e.fillRect(Math.round(d - p / 2), v, p, 10),
              Font.center(e, h, d, v + 1, "#FFFFFF", !1));
          }
        }));
    }, 300),
    Wt = setInterval(() => {
      "undefined" != typeof TOUCH_ICONS &&
        TOUCH_ICONS.xz_fire &&
        ((TOUCH_ICONS.attack = TOUCH_ICONS.xz_fire), clearInterval(Wt));
    }, 300);
  "undefined" == typeof KEYBIND_CATS ||
    KEY_DEFAULT.potato_walk ||
    (KEYBIND_CATS.push(["移动", [["potato_walk", "静步", "AltLeft"]]]),
    (KEY_DEFAULT.potato_walk = "AltLeft"),
    (KEY_CN.potato_walk = "静步"));
  const Qt = {
    run: 0.36,
    sprint: 0.36,
    walk: 0.14,
    crouch: 0.1,
    slide: 0.56,
    slideT: 20,
    slideCd: 20,
  };
  if ("undefined" != typeof Player) {
    const ua = Player.prototype.travel;
    Player.prototype.travel = function (t, e, a, o) {
      if (
        ((s = this),
        !self.POTATO ||
          !s.game ||
          s !== s.game.player ||
          s.flying ||
          s.inWater ||
          s.inLava ||
          s.noClip ||
          !skyMeta())
      )
        return ((this.potV = null), ua.apply(this, arguments));
      var s;
      const i = this.game,
        l = this.vel,
        r = this.potV || (this.potV = [l[0], l[2]]),
        d = 0 | i.tickCount,
        u = performance.now(),
        b = "function" == typeof bindDown && !i.ui.screen && bindDown(i, "potato_shift");
      b && !this.potShAt && (this.potShAt = u);
      const h = b && u - this.potShAt > 180,
        p = !b && this.potShAt && u - this.potShAt <= 180;
      b || (this.potShAt = 0);
      const slideEnd = () => {
          const t = i.touchHeld;
          (this.potSlide && this.potSlide.touch && t && t.sneak && (t.sneak = !1),
            (this.potSlide = null));
        },
        v = !!(self.XZ && XZ.frozen && XZ.frozen(i));
      v &&
        (slideEnd(), (this.potSlideJump = 0), (r[0] = 0), (r[1] = 0), (t = 0), (e = 0), (o = !1));
      const m = Math.hypot(r[0], r[1]),
        y =
          this.sneaking &&
          !this.potSn &&
          m > 0.25 &&
          i.ui &&
          i.ui.touch &&
          i.ui.touch.on &&
          i.ui.touch.on();
      if (!v && ((p && m > 0.15) || y) && this.onGround && d >= (this.potSlideCd || 0)) {
        const t = m || 1;
        ((this.potSlide = { t: Qt.slideT, dx: r[0] / t, dz: r[1] / t, touch: !!y }),
          (this.potSlideCd = d + Qt.slideT + Qt.slideCd));
      }
      if (this.potSlide && o && this.onGround) {
        const t = Math.min(Qt.slide, 1.12 * Math.max(Math.hypot(r[0], r[1]), Qt.run));
        ((r[0] = this.potSlide.dx * t),
          (r[1] = this.potSlide.dz * t),
          slideEnd(),
          (this.potSlideJump = d + 16),
          (this.potSlideCd = Math.min(this.potSlideCd || 0, d + Qt.slideCd)));
      }
      let w, k;
      if (
        (this.potSlide && --this.potSlide.t <= 0 && slideEnd(),
        this.potSlideJump &&
          (d > this.potSlideJump || (this.onGround && d > this.potSlideJump - 14)) &&
          (this.potSlideJump = 0),
        (this.potSn = this.sneaking),
        (this.potWalk = h || !(!i.touchHeld || !i.touchHeld.potato_walk)),
        this.potSlide)
      ) {
        const t = this.potSlide.t / Qt.slideT,
          e = 1.4 * Qt.walk + (Qt.slide - 1.4 * Qt.walk) * (1 - Math.pow(1 - t, 2.2)) * t;
        ((w = [this.potSlide.dx * e, this.potSlide.dz * e]), (k = this.onGround ? 0.35 : 0.04));
      } else {
        const a = Math.hypot(t, e),
          o = self.XZ,
          s = this.inv && this.inv.held,
          i =
            (this.speedK || 1) *
            (o && o.isKnife && o.isKnife(s) ? 1.08 : o && o.isGun && o.isGun(s) ? 0.95 : 1),
          l = (this.sneaking ? Qt.crouch : this.potWalk ? Qt.walk : Qt.run) * i,
          r = a > 0.001 ? l * Math.min(1, a / (this.sneaking ? 0.294 : 0.98)) : 0,
          d = a > 0.001 ? t / a : 0,
          u = a > 0.001 ? e / a : 0,
          b = this.yaw;
        ((w = [(-Math.sin(b) * d + Math.cos(b) * u) * r, (-Math.cos(b) * d - Math.sin(b) * u) * r]),
          (k = this.potSlideJump
            ? 0.015
            : this.onGround
              ? a > 0.001
                ? 0.62
                : 0.82
              : a > 0.001
                ? 0.07
                : 0.01));
      }
      ((r[0] += (w[0] - r[0]) * k), (r[1] += (w[1] - r[1]) * k), (l[0] = r[0]), (l[2] = r[1]));
      const x = this.pos[0],
        S = this.pos[2];
      (ua.call(this, 0, 0, 0, o),
        Math.abs(this.pos[0] - x) < 0.5 * Math.abs(r[0]) && (r[0] = 0),
        Math.abs(this.pos[2] - S) < 0.5 * Math.abs(r[1]) && (r[1] = 0),
        (l[0] = r[0]),
        (l[2] = r[1]),
        (this.potWalkQuiet = !this.potSlide && !!this.potWalk));
    };
  }
  const Jt = Game.prototype.readInput;
  ((Game.prototype.readInput = function () {
    const t = Jt.apply(this, arguments),
      e = this.player;
    return (
      self.POTATO &&
        e &&
        skyMeta() &&
        ((t.sprint = !1),
        (e.potSlide ||
          ("function" == typeof bindDown && !this.ui.screen && bindDown(this, "potato_crouch2"))) &&
          (t.sneak = !0)),
      t
    );
  }),
    (self.Potato.MV = Qt));
  {
    const ba = Game.prototype.viewDist;
    Game.prototype.viewDist = function () {
      return Math.min(
        ba.call(this),
        ((t = this),
        self.POTATO && t.worldMeta
          ? t.worldMeta.xzduel
            ? self.XZ && XZ.match && XZ.match.ffa && XZ.match.ffa()
              ? 5
              : 4
            : t.world && t.world.xzRange
              ? 6
              : 1 / 0
          : 1 / 0),
      );
      var t;
    };
  }
  {
    const ha = Game.prototype.tick;
    Game.prototype.tick = function () {
      const t = ha.apply(this, arguments),
        e = this.renderer,
        a = this.viewDist();
      return (e && "play" === this.state && e.renderDist !== a && (e.renderDist = a), t);
    };
  }
  let te = null;
  const fpArms = (t) => {
    if (!self.POTATO) return null;
    if (te && t.entityTex[te]) return te;
    const e = document.createElement("canvas");
    e.width = e.height = 64;
    const a = e.getContext("2d"),
      paint = (t, e) => {
        for (let o = 0; o < 16; o++)
          for (let s = 0; s < 16; s++) {
            const i = o - 4,
              l = (7 * s + 13 * o) % 5;
            let r;
            ((r =
              o < 4
                ? s >= 8
                  ? "#2A2522"
                  : "#3A3F4A"
                : i >= 9
                  ? 9 === i && s % 4 == 1
                    ? "#5A4E46"
                    : 11 === i
                      ? "#1F1B19"
                      : 0 === l
                        ? "#332D29"
                        : "#2A2522"
                  : 7 === i
                    ? "#FF6A2A"
                    : 8 === i
                      ? "#C9481C"
                      : 0 === l
                        ? "#4A505C"
                        : 1 === l
                          ? "#323742"
                          : i < 2
                            ? "#353A45"
                            : "#3D4350"),
              (a.fillStyle = r),
              a.fillRect(t + s, e + o, 1, 1));
          }
      };
    return (
      paint(40, 16),
      paint(32, 48),
      (te = "potato_fp_arms"),
      (t.entityTex[te] = t.tex2D(e, !1)),
      te
    );
  };
  {
    const pa = setInterval(() => {
      self.XZ && (clearInterval(pa), (self.XZ.fpArms = fpArms));
    }, 200);
  }
  const ee = { m: null, shots: 0, hits: 0, heads: 0, dmg: 0, kills: 0, stops: 0, assists: 0 };
  let ae = null;
  const duelOn = (t) =>
      !!(
        t &&
        t.worldMeta &&
        t.worldMeta.xzduel &&
        self.XZ &&
        self.XZ.duel &&
        "play" === self.XZ.duel.st
      ),
    psFor = () => {
      const t = self.XZ && self.XZ.duel;
      return (
        t &&
          t.m &&
          ee.m !== t.m &&
          Object.assign(ee, {
            m: t.m,
            shots: 0,
            hits: 0,
            heads: 0,
            dmg: 0,
            kills: 0,
            stops: 0,
            assists: 0,
            rd: [0, 0, 0, 0, 0],
          }),
        ee
      );
    };
  "undefined" == typeof KEYBIND_CATS ||
    KEY_DEFAULT.potato_score ||
    (KEYBIND_CATS.push(["对局", [["potato_score", "比分表", "Tab"]]]),
    (KEY_DEFAULT.potato_score = "Tab"),
    (KEY_CN.potato_score = "比分表"));
  const oe = setInterval(() => {
    const t = self.XZ;
    if (!t || !t.onHitEntity || !t.duel) return;
    clearInterval(oe);
    const e = t.onFired;
    t.onFired = function (t, a) {
      if ((e && e.apply(this, arguments), a === t.player && duelOn(t))) {
        const t = psFor();
        (t.shots++,
          a.prev && Math.hypot(a.pos[0] - a.prev[0], a.pos[2] - a.prev[2]) < 0.05 && t.stops++);
      }
    };
    const a = t.onHitEntity;
    t.onHitEntity = function (t, e, o, s, i, l) {
      const r = a.apply(this, arguments);
      if (e === t.player && o && o.xzDuel && duelOn(t)) {
        const t = psFor(),
          e = Math.max(0, Math.min(40, +i || 0)),
          a = self.XZ.duel;
        (t.hits++, s && t.heads++, (t.dmg += e), l && t.kills++);
        const o = a.m ? a.m.i : 0,
          r = t.rd || (t.rd = [0, 0, 0, 0, 0]);
        r[o] = (r[o] || 0) + e;
      }
      return r;
    };
  }, 300);
  (setInterval(() => {
    const t = self.XZ && self.XZ.duel && self.XZ.duel.link,
      e = t && t.pc;
    e && e.getStats
      ? e
          .getStats()
          .then((t) => {
            let e = null;
            (t.forEach((t) => {
              "candidate-pair" === t.type &&
                (t.nominated || t.selected) &&
                "succeeded" === t.state &&
                null != t.currentRoundTripTime &&
                (e = Math.round(1e3 * t.currentRoundTripTime));
            }),
              (ae = e));
          })
          .catch(() => {})
      : (ae = null);
  }, 2e3),
    (self.Potato.stats = () => Object.assign({ ping: ae }, ee)),
    (self.Potato.assist = () => {
      psFor().assists++;
    }));
  const ne = UI.prototype.drawHUD;
  UI.prototype.drawHUD = function (...t) {
    const e = ne.apply(this, t),
      a = this.game;
    if (!self.POTATO || !a || "play" !== a.state || this.hideHud) return e;
    const o = this.ctx;
    o.save();
    try {
      if (a.settings.potatoNet) {
        const t = (a.fps || 0) + " FPS" + (null != ae ? "  ·  " + ae + " ms" : ""),
          e = !!(this.touch && this.touch.on && this.touch.on()),
          s = this.safe ? this.safe() : { l: 0, t: 0, b: 0 },
          i = 10 + (s.l || 0),
          l = e ? 64 + (s.t || 0) : this.h - 10 - 8 - (s.b || 0) - 13;
        ((o.font = '700 5.5px "Bahnschrift","DIN Alternate","Arial Narrow",sans-serif'),
          (o.textAlign = "left"),
          (o.textBaseline = "top"),
          (o.fillStyle = "rgba(0,0,0,.45)"));
        const r = o.measureText(t).width + 8;
        (o.fillRect(i, l, r, 9),
          (o.fillStyle =
            (a.fps || 0) >= 50 ? "#9BF2C0" : (a.fps || 0) >= 30 ? "#FFD36B" : "#FF7A6B"),
          o.fillText(t, i + 4, l + 1.5));
      }
      "function" == typeof bindDown &&
        bindDown(a, "potato_score") &&
        duelOn(a) &&
        (function drawScore(t, e) {
          const a = self.XZ,
            o = a.duel,
            s = t.ctx,
            i = t.w,
            l = t.h,
            r = psFor(),
            d = a.match && a.match.ffa && a.match.ffa();
          if (d) {
            const t = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
              e = '"Bahnschrift","DIN Alternate","Arial Narrow",' + t,
              a = d.list,
              o = Math.min(i - 20, 230),
              r = 40 + 16 * a.length,
              u = Math.round(i / 2 - o / 2),
              b = Math.round(0.16 * l);
            return (
              (s.fillStyle = "rgba(12,13,16,.86)"),
              s.fillRect(u, b, o, r),
              (s.fillStyle = "#FF5A1F"),
              s.fillRect(u, b, o, 1.5),
              (s.textBaseline = "alphabetic"),
              (s.textAlign = "left"),
              (s.font = "900 7px " + t),
              (s.fillStyle = "#F2EFE9"),
              s.fillText("乱斗 · 先到 " + d.goal + " 杀", u + 8, b + 13),
              (s.font = "700 4.8px " + t),
              (s.fillStyle = "#8A877F"),
              s.fillText("玩家", u + 20, b + 28),
              (s.textAlign = "right"),
              s.fillText("击杀", u + 0.72 * o, b + 28),
              s.fillText("阵亡", u + o - 10, b + 28),
              void a.forEach((a, i) => {
                const l = b + 32 + 16 * i;
                ((s.fillStyle = a.me ? "rgba(255,90,31,.16)" : "rgba(242,239,233,.05)"),
                  s.fillRect(u + 4, l, o - 8, 14),
                  (s.textAlign = "left"),
                  (s.font = "800 5.5px " + e),
                  (s.fillStyle = 0 === i ? "#FFD24A" : "#A9A59C"),
                  s.fillText(String(i + 1), u + 9, l + 9.5),
                  (s.font = "800 6px " + t),
                  (s.fillStyle = a.me ? "#FFFFFF" : "#D8D4CC"),
                  s.fillText(String(a.name).slice(0, 14), u + 20, l + 9.5),
                  (s.textAlign = "right"),
                  (s.font = "800 6px " + e),
                  (s.fillStyle = "#9BF2C0"),
                  s.fillText(String(a.k), u + 0.72 * o, l + 9.5),
                  (s.fillStyle = "#FF8A7A"),
                  s.fillText(String(a.d), u + o - 10, l + 9.5));
              })
            );
          }
          const u = (o.m && o.m.res) || [],
            mine = (t) => ("d" === t ? "d" : ("h" === t) === o.host ? "w" : "l"),
            b = u.filter((t) => "w" === mine(t)).length,
            h = u.filter((t) => "l" === mine(t)).length,
            p = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
            v = '"Bahnschrift","DIN Alternate","Arial Narrow",' + p,
            m = Math.min(i - 20, 230),
            y = 92,
            w = Math.round(i / 2 - m / 2),
            k = Math.round(0.18 * l);
          ((s.fillStyle = "rgba(12,13,16,.86)"),
            s.fillRect(w, k, m, y),
            (s.fillStyle = "#FF5A1F"),
            s.fillRect(w, k, m, 1.5),
            (s.textBaseline = "alphabetic"),
            (s.textAlign = "left"),
            (s.font = "900 7px " + p),
            (s.fillStyle = "#F2EFE9"),
            s.fillText(o.friend ? "好友约战" : "天梯排位", w + 8, k + 13),
            (s.font = "700 5px " + p),
            (s.fillStyle = "#A9A59C"));
          const x = self.XZ && self.XZ.duelRounds ? self.XZ.duelRounds() : { n: 5, win: 3 };
          (s.fillText(
            "第 " + Math.min(u.length + 1, x.n) + " 局 · 先赢 " + x.win + " 局",
            w + 8,
            k + 21,
          ),
            (s.textAlign = "right"),
            (s.font = "800 13px " + v),
            (s.fillStyle = "#9BF2C0"),
            s.fillText(String(b), w + m - 34, k + 18),
            (s.fillStyle = "#A9A59C"),
            (s.font = "800 9px " + v),
            s.fillText(":", w + m - 24, k + 17),
            (s.font = "800 13px " + v),
            (s.fillStyle = "#FF8A7A"),
            s.fillText(String(h), w + m - 8, k + 18));
          const S = [
            ["玩家", 8, "left"],
            ["击杀", 0.46 * m, "right"],
            ["阵亡", 0.58 * m, "right"],
            ["伤害", 0.71 * m, "right"],
            ["命中", 0.85 * m, "right"],
            ["延迟", m - 8, "right"],
          ];
          ((s.font = "700 4.8px " + p), (s.fillStyle = "#8A877F"));
          for (const [t, e, a] of S) ((s.textAlign = a), s.fillText(t, w + e, k + 36));
          const F = potName() || "我",
            A = (o.opp && o.opp.name) || "对手";
          [
            [
              F,
              b,
              h,
              Math.round(r.dmg),
              r.shots ? Math.round((r.hits / r.shots) * 100) + "%" : "—",
              null != ae ? ae + "ms" : "—",
              !0,
            ],
            [A, h, b, "—", "—", null != ae ? ae + "ms" : "—", !1],
          ].forEach((t, e) => {
            const a = k + 44 + 20 * e;
            ((s.fillStyle = t[6] ? "rgba(255,90,31,.14)" : "rgba(242,239,233,.05)"),
              s.fillRect(w + 4, a, m - 8, 17),
              (s.font = "800 6px " + p),
              (s.textAlign = "left"),
              (s.fillStyle = t[6] ? "#FFFFFF" : "#D8D4CC"),
              s.fillText(String(t[0]).slice(0, 12), w + 8, a + 11.5),
              (s.font = "700 6px " + v),
              (s.fillStyle = "#F2EFE9"),
              [t[1], t[2], t[3], t[4], t[5]].forEach((t, e) => {
                ((s.textAlign = "right"), s.fillText(String(t), w + S[e + 1][1], a + 11.5));
              }));
          });
        })(this);
    } catch (t) {
    } finally {
      o.restore();
    }
    return e;
  };
  const se = [
    [95, "S+", "#FFE27A"],
    [85, "S", "#FFC94A"],
    [70, "A", "#3DDC84"],
    [55, "B", "#5CB8FF"],
    [40, "C", "#C8C4BC"],
    [0, "D", "#8A877F"],
  ];
  function rateMatch(t, e, a = 5) {
    const cl = (t) => Math.max(0, Math.min(1, t || 0)),
      pct = (t, e) => (e ? Math.round((t / e) * 100) + "%" : "—"),
      o = [
        ["回合胜率", 30, cl(e / a), e + " / " + a],
        ["伤害", 20, cl((t.dmg || 0) / (20 * a)), String(Math.round(t.dmg || 0))],
        ["命中率", 15, t.shots ? cl(t.hits / t.shots / 0.6) : 0, pct(t.hits, t.shots)],
        [
          "击杀 / 助攻",
          15,
          cl(((t.kills || 0) + 0.5 * (t.assists || 0)) / a),
          (t.kills || 0) + " / " + (t.assists || 0),
        ],
        ["爆头率", 10, t.hits ? cl(t.heads / t.hits / 0.4) : 0, pct(t.heads, t.hits)],
        ["急停", 10, t.shots ? cl((t.stops || 0) / t.shots / 0.8) : 0, pct(t.stops || 0, t.shots)],
      ],
      s = Math.round(o.reduce((t, e) => t + e[1] * e[2], 0)),
      i = se.find((t) => s >= t[0]);
    return { score: s, grade: i[1], col: i[2], parts: o };
  }
  self.Potato.rate = rateMatch;
  const ie =
    '\n  /* (the user 11-17 「结算界面好丑 很空旷 背景也没什么颜色」: the lobby\'s own language - paper cards, black rules, hard shadows -\n     over a bold slanted band in the result\'s colour on this side, the other side\'s navy, the result\'s word huge behind) */\n  #lobby .r2-bg { position: absolute; inset: 0; overflow: hidden; background: #15171D; pointer-events: none; }\n  #lobby .r2-bg .bl { position: absolute; left: -6%; top: 0; bottom: 0; width: 50%; background: var(--band);\n    background-image: repeating-linear-gradient(-55deg, rgba(255,255,255,.08) 0 calc(var(--u) * 1.1), transparent 0 calc(var(--u) * 2.2)); clip-path: polygon(0 0, 100% 0, 80% 100%, 0 100%);\n    animation: r2L .55s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .r2-bg .br { position: absolute; right: -6%; top: 0; bottom: 0; width: 44%; background: #1D2741; clip-path: polygon(24% 0, 100% 0, 100% 100%, 0 100%);\n    background-image: repeating-linear-gradient(-55deg, rgba(62,123,250,.12) 0 calc(var(--u) * 1.1), transparent 0 calc(var(--u) * 2.2)); animation: r2R .55s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .r2-bg .br::before { content: \'\'; position: absolute; left: 0; top: 0; bottom: 0; width: calc(var(--u) * .8); background: #3E7BFA; }\n  @keyframes r2L { from { transform: translateX(-30%); } } @keyframes r2R { from { transform: translateX(30%); } }\n  #lobby .r2-bg .wm { position: absolute; left: -10%; top: 26%; white-space: nowrap; font: italic 900 calc(var(--u) * 15)/1 "Bahnschrift", "Arial Black", sans-serif; letter-spacing: .04em;\n    color: rgba(255,255,255,.07); transform: rotate(-7deg); animation: r2Wm 40s linear infinite; }\n  #lobby .r2-bg .wm.b { top: 64%; color: rgba(0,0,0,.22); animation-direction: reverse; }\n  @keyframes r2Wm { to { transform: rotate(-7deg) translateX(-25%); } }\n  #lobby .r2-wrap { position: absolute; inset: calc(var(--u) * 2) calc(var(--u) * 2.6); display: flex; flex-direction: column; gap: calc(var(--u) * .9); }\n  #lobby .r2-top { display: flex; align-items: center; gap: calc(var(--u) * 2); animation: lbUp .45s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .r2-res .rk-title { font-size: calc(var(--u) * 4.6); color: #FFF8EE; filter: drop-shadow(calc(var(--u) * .35) calc(var(--u) * .35) 0 #111); }\n  #lobby .r2-res .sub { display: flex; gap: calc(var(--u) * .8); align-items: center; margin-top: calc(var(--u) * .5); }\n  #lobby .r2-res .sub b { font-size: calc(var(--u) * 1.7); font-weight: 900; background: #111; color: var(--rc); padding: 0 calc(var(--u) * .8); }\n  #lobby .r2-res .sub span { font-size: calc(var(--u) * 1.05); font-weight: 900; background: #F2EFE9; color: #111; padding: calc(var(--u) * .1) calc(var(--u) * .7); }\n  #lobby .r2-score { margin-left: auto; background: #F2EFE9; color: #111; border: calc(var(--u) * .3) solid #111; box-shadow: calc(var(--u) * .5) calc(var(--u) * .5) 0 #111;\n    padding: 0 calc(var(--u) * 1.6); font: 900 calc(var(--u) * 4.6)/1.25 "Bahnschrift", "Arial Black", sans-serif; display: flex; align-items: center; }\n  #lobby .r2-score .w { color: #1E9E57; } #lobby .r2-score .l { color: #D6402F; } #lobby .r2-score i { font-style: normal; color: #9A968E; margin: 0 calc(var(--u) * .4); }\n  #lobby .r2-mid { flex: 1; min-height: 0; display: grid; grid-template-columns: 1.3fr minmax(0, .82fr) 1.3fr; gap: calc(var(--u) * 1.2); align-items: stretch; }\n  #lobby .r2-side { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; min-height: 0; animation: lbFade .6s ease-out .25s backwards; }\n  #lobby .r2-side.me { --sc: #FF5A1F; } #lobby .r2-side.op { --sc: #3E7BFA; }\n  #lobby .r2-fw { flex: 1; min-height: 0; width: 100%; position: relative; }\n  #lobby .r2-fig { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; object-position: center bottom; image-rendering: pixelated; filter: drop-shadow(calc(var(--u) * .5) calc(var(--u) * .4) 0 rgba(0,0,0,.35)); }\n  #lobby .r2-nm { position: relative; z-index: 1; width: 86%; background: #111; color: #F2EFE9; border-left: calc(var(--u) * .6) solid var(--sc); box-shadow: calc(var(--u) * .4) calc(var(--u) * .4) 0 rgba(0,0,0,.45);\n    padding: calc(var(--u) * .45) calc(var(--u) * .9); display: flex; align-items: center; justify-content: space-between; gap: calc(var(--u) * .6); }\n  #lobby .r2-nm b { font-size: calc(var(--u) * 1.35); font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n  #lobby .r2-nm small { font-size: calc(var(--u) * .95); color: #CFCBC2; font-weight: 800; white-space: nowrap; }\n  #lobby .r2-card { position: relative; background: #F2EFE9; color: #111; border: calc(var(--u) * .3) solid #111; box-shadow: calc(var(--u) * .7) calc(var(--u) * .7) 0 var(--gcs);\n    padding: calc(var(--u) * 1) calc(var(--u) * 1.3); display: flex; flex-direction: column; min-height: 0; align-self: center; pointer-events: auto; animation: lbUp .5s cubic-bezier(.2,.9,.25,1) .1s backwards; }\n  #lobby .r2-mvp { margin-top: calc(var(--u) * 1); display: flex; align-items: center; gap: calc(var(--u) * .8); background: #111; color: #F2EFE9; padding: calc(var(--u) * .5) calc(var(--u) * .8); }\n  #lobby .r2-mvp i, #lobby .r2-nm i, #lobby .r2-rd i { font-style: normal; font-weight: 900; background: #FFC94A; color: #111; padding: 0 calc(var(--u) * .4); letter-spacing: .06em; }\n  #lobby .r2-mvp b { font-size: calc(var(--u) * 1.3); font-weight: 900; } #lobby .r2-mvp span { margin-left: auto; font-size: calc(var(--u) * .95); color: #A9A59C; font-weight: 800; }\n  #lobby .r2-nm i { font-size: calc(var(--u) * .9); margin-right: calc(var(--u) * .4); animation: r2Stamp .45s cubic-bezier(.3,1.6,.5,1) 1.6s backwards; }\n  #lobby .r2-rd i { display: block; font-size: calc(var(--u) * .72); margin: calc(var(--u) * .15) calc(var(--u) * .25) 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n  #lobby .r2-card::before { content: \'\'; position: absolute; left: 0; top: 0; right: 0; height: calc(var(--u) * .45); background: var(--gcs); }\n  #lobby .r2-cap { font-size: calc(var(--u) * .95); color: #6A665E; font-weight: 900; letter-spacing: .14em; }\n  #lobby .r2-gr { display: flex; align-items: center; justify-content: center; gap: calc(var(--u) * 1); margin: calc(var(--u) * .3) 0 calc(var(--u) * .7); }\n  #lobby .r2-g { font-family: "Bahnschrift", "Arial Black", sans-serif; font-weight: 900; font-style: italic; font-size: calc(var(--u) * 6.6); line-height: .95; color: var(--gc); min-width: 1.45em; text-align: center;\n    -webkit-text-stroke: calc(var(--u) * .28) #111; paint-order: stroke fill; text-shadow: calc(var(--u) * .45) calc(var(--u) * .45) 0 #111; animation: r2Stamp .5s cubic-bezier(.3,1.6,.5,1) 1.25s backwards; }\n  #lobby .r2-g.glow { animation: r2Stamp .5s cubic-bezier(.3,1.6,.5,1) 1.25s backwards, r2Glow 1.6s ease-in-out 1.8s infinite; }\n  @keyframes r2Stamp { from { opacity: 0; transform: scale(2.6) rotate(-14deg); } 60% { opacity: 1; } }\n  @keyframes r2Glow { 50% { filter: drop-shadow(0 0 calc(var(--u) * 1.2) var(--gc)) brightness(1.12); } }\n  #lobby .r2-n { white-space: nowrap; } #lobby .r2-n b { font: 900 calc(var(--u) * 3.8)/1 "Bahnschrift", "Arial Black", sans-serif; color: #111; }\n  #lobby .r2-n small { font-size: calc(var(--u) * 1.15); color: #8A877F; font-weight: 900; margin-left: calc(var(--u) * .3); }\n  #lobby .r2-n em { display: block; font-style: normal; font-size: calc(var(--u) * 1); font-weight: 900; margin-top: calc(var(--u) * .3); background: #111; color: var(--gcs); padding: 0 calc(var(--u) * .5); width: max-content; }\n  #lobby .r2-parts { display: flex; flex-direction: column; gap: calc(var(--u) * .6); }\n  #lobby .r2-p { display: grid; grid-template-columns: calc(var(--u) * 5.6) 1fr auto; align-items: center; gap: calc(var(--u) * .6); font-size: calc(var(--u) * .92); font-weight: 900; }\n  #lobby .r2-p span { color: #333; } #lobby .r2-p em { font-style: normal; text-align: right; color: #111; font-family: "Bahnschrift", sans-serif; white-space: nowrap; }\n  #lobby .r2-p em small { display: none; }\n  #lobby .r2-bar { height: calc(var(--u) * 1.2); background: #DDD8CE; border: 1px solid #111; position: relative; overflow: hidden; }\n  #lobby .r2-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: var(--w); background: var(--gcs); transform-origin: left; animation: grow .7s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(.35s + var(--i) * 110ms); }\n  #lobby .r2-stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: calc(var(--u) * .8); }\n  #lobby .r2-stats div { background: #111; border-top: calc(var(--u) * .4) solid var(--c); padding: calc(var(--u) * .45) calc(var(--u) * .9); box-shadow: calc(var(--u) * .35) calc(var(--u) * .35) 0 rgba(0,0,0,.45);\n    display: flex; align-items: baseline; justify-content: space-between; animation: lbUp .4s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(.45s + var(--i) * 50ms); }\n  #lobby .r2-stats b { font: 900 calc(var(--u) * 2.1)/1.1 "Bahnschrift", "Arial Black", sans-serif; color: #F2EFE9; } #lobby .r2-stats small { font-size: calc(var(--u) * .95); color: #A9A59C; font-weight: 900; }\n  #lobby .r2-bot { display: grid; grid-template-columns: auto 1fr auto; gap: calc(var(--u) * 1.4); align-items: center; animation: lbUp .45s cubic-bezier(.2,.9,.25,1) .3s backwards; }\n  #lobby .r2-rds { display: flex; gap: calc(var(--u) * .5); }\n  #lobby .r2-rd { width: calc(var(--u) * 6); padding: calc(var(--u) * .25) 0 calc(var(--u) * .3); background: #F2EFE9; border: calc(var(--u) * .22) solid #111; border-top-width: calc(var(--u) * .5); text-align: center; color: #111; }\n  #lobby .r2-rd.x { opacity: .45; } #lobby .r2-rd.w { border-top-color: #1E9E57; } #lobby .r2-rd.l { border-top-color: #D6402F; } #lobby .r2-rd.d { border-top-color: #8A877F; }\n  #lobby .r2-rd img { width: 80%; height: calc(var(--u) * 2.2); object-fit: contain; image-rendering: pixelated; display: block; margin: 0 auto; }\n  #lobby .r2-rd b { font-size: calc(var(--u) * .95); font-weight: 900; } #lobby .r2-rd.w b { color: #1E9E57; } #lobby .r2-rd.l b { color: #D6402F; }\n  #lobby .rs-out { justify-self: center; text-align: center; font-weight: 900; font-size: calc(var(--u) * 1.4); background: #111; color: #F2EFE9; padding: calc(var(--u) * .4) calc(var(--u) * 1.4); box-shadow: calc(var(--u) * .35) calc(var(--u) * .35) 0 rgba(0,0,0,.45); }\n  #lobby .rs-out img { height: calc(var(--u) * 2.2); vertical-align: middle; }\n  #lobby .rs-out small { display: block; font-size: calc(var(--u) * .9); color: #A9A59C; font-weight: 800; }\n  #lobby .rs-foot { display: flex; gap: calc(var(--u) * 1); }\n  #lobby .rs-btn { pointer-events: auto; font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.4); padding: calc(var(--u) * .8) calc(var(--u) * 2.4); border: calc(var(--u) * .3) solid #111; background: #F2EFE9; color: #111; cursor: pointer;\n    box-shadow: calc(var(--u) * .4) calc(var(--u) * .4) 0 #111; transition: transform .1s ease, box-shadow .1s ease; }\n  #lobby .rs-btn.go { background: var(--or); color: #fff; } #lobby .rs-btn:hover { transform: translate(calc(var(--u) * -.2), calc(var(--u) * -.2)); box-shadow: calc(var(--u) * .6) calc(var(--u) * .6) 0 #111; }';
  class PotatoResult extends MenuScreen {
    constructor(t, e) {
      (super(t, null),
        (this.potato = !0),
        (this.orig = e),
        (this.pauses = !1),
        (this.blurBg = !0),
        (this.el = null),
        (this.st = Object.assign({}, psFor())));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      const t = this.game,
        e = this.orig.r,
        a = self.XZ,
        o = this.st,
        s = a && a.ladder;
      ensureCss();
      const i = e.won > e.lost,
        l = e.lost > e.won,
        r = i ? "胜利" : l ? "失败" : "平局",
        d = i ? "VICTORY" : l ? "DEFEAT" : "DRAW",
        u = i ? "#3DDC84" : l ? "#FF5A4A" : "#C9C5BC";
      try {
        self.PotatoMusic && self.PotatoMusic.sting(i ? "win" : l ? "lose" : "draw");
      } catch (t) {}
      const b = e.guns || (s && s.ROUNDS) || [],
        h = (e.rounds && e.rounds.length) || 5,
        p = Math.max(1, Math.min(h, e.played || h)),
        v = (this.rt = rateMatch(o, e.won, p)),
        m = a && a.duel,
        y = e.team || null,
        w = y ? [e.me ? e.me.name : "你", ...y.mates] : [(e.me && e.me.name) || "你"],
        k = y ? y.foes : [(e.opp && e.opp.name) || "对手"],
        x = e.custom
          ? (e.ai ? "人机试玩" : "自定义房间") + " · " + (e.map || "") + " · 不计分"
          : e.ai && e.tour
            ? "人机 · 8 人淘汰赛"
            : e.ai
              ? "人机对战 · " + (y ? "2V2" : "1V1")
              : e.friend
                ? "好友约战 · 不计分"
                : e.tour
                  ? "8 人淘汰赛"
                  : y
                    ? "2V2 排位"
                    : "天梯 1V1",
        tn = (e) => {
          const a = ((t) => (s && null != t ? s.tierOf(t) : null))(e);
          return a
            ? `<img src="${tierPic(t, a)}" alt="" style="height:1.4em;vertical-align:middle"> ${esc(a.n)}`
            : "";
        },
        S = (this.el = document.createElement("div"));
      ((S.id = "lobby"),
        (S.className = "rk rs2"),
        S.style.setProperty("--rc", u),
        S.style.setProperty("--gc", v.col),
        S.style.setProperty("--band", i ? "#FF5A1F" : l ? "#56606F" : "#8A877F"),
        S.style.setProperty(
          "--gcs",
          { "S+": "#F2B705", S: "#F29A05", A: "#1E9E57", B: "#2F7FE0", C: "#7C7870", D: "#5A5650" }[
            v.grade
          ] || "#111",
        ));
      const pct = (t, e) => (e ? Math.round((t / e) * 100) + "%" : "—"),
        F = (d + " · ").repeat(8),
        A = (m && m.rdDmg) || {},
        E = o.rd || [0, 0, 0, 0, 0],
        C = [
          ...w.map((t, e) => ({ n: t, side: "w", d: 0 === e ? E : A[t] || [0, 0, 0, 0, 0] })),
          ...k.map((t) => ({
            n: t,
            side: "l",
            d: A[t] || A[(e.opp && e.opp.name) || ""] || [0, 0, 0, 0, 0],
          })),
        ],
        sum = (t) => t.reduce((t, e) => t + e, 0),
        best = (t, e) => t.reduce((t, a) => (e(a) > e(t) ? a : t), t[0]),
        T = e.rounds.map((t, e) => {
          const a = C.filter((e) => "d" === t || e.side === t || ("l" === t && "l" === e.side)),
            o =
              "w" === t
                ? C.filter((t) => "w" === t.side)
                : "l" === t
                  ? C.filter((t) => "l" === t.side)
                  : C;
          return best(o.length ? o : a, (t) => t.d[e] || 0);
        }),
        M = best(C, (t) => sum(t.d) + (t.side === (i ? "w" : "l") ? 0.5 : 0));
      if (
        ((S.innerHTML = `<div class="r2-bg"><i class="bl"></i><i class="br"></i><div class="wm">${F}</div><div class="wm b">${F}</div></div><div class="r2-wrap">\n        <div class="r2-top"><div class="r2-res"><div class="rk-title">${blockText(d)}</div><div class="sub"><b>${r}</b><span>${x}</span></div></div>\n          <div class="r2-score"><span class="w">${e.won}</span><i>:</i><span class="l">${e.lost}</span></div></div>\n        <div class="r2-mid">\n          <div class="r2-side me"><div class="r2-fw"><canvas class="r2-fig" data-s="me"></canvas></div><div class="r2-nm"><b>${"w" === M.side ? "<i>MVP</i>" : ""}${w.map(esc).join(" · ")}</b><small>${e.me && null != e.me.score ? tn(e.me.score) : "我方"}</small></div></div>\n          <div class="r2-card"><div class="r2-cap">本场评分 · RATING</div>\n            <div class="r2-gr"><div class="r2-g ${v.score >= 85 ? "glow" : ""}">${v.grade}</div><div class="r2-n"><b class="r2-cnt">0</b><small>/ 100</small><em>${v.score >= 95 ? "无可挑剔" : v.score >= 85 ? "统治级表现" : v.score >= 70 ? "发挥出色" : v.score >= 55 ? "中规中矩" : v.score >= 40 ? "还有提升空间" : "下把再来"}</em></div></div>\n            <div class="r2-parts">${v.parts.map(([t, e, a, o], s) => `<div class="r2-p"><span>${t}</span><div class="r2-bar"><i style="--w:${Math.round(100 * a)}%;--i:${s}"></i></div><em>${esc(o)}<small>${Math.round(e * a)}/${e}</small></em></div>`).join("")}</div>\n            <div class="r2-mvp"><i>全场 MVP</i><b>${esc(M.n)}</b><span>${Math.round(sum(M.d))} 伤害</span></div></div>\n          <div class="r2-side op"><div class="r2-fw"><canvas class="r2-fig" data-s="op"></canvas></div><div class="r2-nm"><b>${"l" === M.side ? "<i>MVP</i>" : ""}${k.map(esc).join(" · ")}</b><small>${e.opp && null != e.opp.score && !y ? tn(e.opp.score) : "对方"}</small></div></div>\n        </div>\n        <div class="r2-stats">${[
          ["击杀", o.kills || 0, "#FF5A1F"],
          ["伤害", Math.round(o.dmg || 0), "#E8423F"],
          ["命中率", pct(o.hits, o.shots), "#3DDC84"],
          ["爆头", o.heads || 0, "#FFC94A"],
          ["急停", pct(o.stops || 0, o.shots), "#5CB8FF"],
          ["开火", o.shots || 0, "#B57BFF"],
        ]
          .map(
            ([t, e, a], o) =>
              `<div style="--c:${a};--i:${o}"><small>${t}</small><b>${esc(e)}</b></div>`,
          )
          .join("")}</div>\n        <div class="r2-bot"><div class="r2-rds">${e.rounds
          .map((e, o) =>
            o >= p
              ? `<div class="r2-rd x"><img src="" alt="" style="visibility:hidden"><b>${o + 1} · 未打</b><i>先胜 ${Math.floor(h / 2) + 1} 局</i></div>`
              : `<div class="r2-rd ${e}"><img src="${
                  b[o]
                    ? ((e) => {
                        try {
                          const o = ITEM_KEY[a.R.keys[e]],
                            s = a.g3Icon && a.g3Icon(t.renderer, { id: o, count: 1 });
                          return s ? s.toDataURL() : "";
                        } catch (t) {
                          return "";
                        }
                      })(b[o][0])
                    : ""
                }" alt=""><b>${o + 1} · ${"w" === e ? "胜" : "l" === e ? "负" : "平"}</b><i>MVP ${esc(T[o] ? T[o].n : "—")}</i></div>`,
          )
          .join(
            "",
          )}</div>\n          <div class="rs-out"></div>\n          <div class="rs-foot">${e.tour ? '<button class="rs-btn go" data-a="again">查看对阵</button>' : (e.friend ? "" : '<button class="rs-btn go" data-a="again">再来一局</button>') + '<button class="rs-btn" data-a="back">' + (e.room ? "返回房间" : "返回大厅") + "</button>"}</div></div>\n      </div>`),
        !document.getElementById("rs-css"))
      ) {
        const t = document.createElement("style");
        ((t.id = "rs-css"), (t.textContent = ie), document.head.appendChild(t));
      }
      (host().appendChild(S),
        S.addEventListener("click", (t) => {
          const e = t.target.closest("[data-a]");
          if (!e) return;
          const a = this.orig.widgets || [],
            o =
              "again" === e.dataset.a
                ? a.find((t) => "再来一局" === t.label)
                : a.find((t) => "返回" === t.label);
          o && o.onClick && o.onClick();
        }));
      const $ = S.querySelector(".r2-cnt"),
        z = performance.now(),
        up = () => {
          if (!this.el) return;
          const t = Math.min(1, (performance.now() - z - 300) / 1e3);
          (($.textContent = Math.round(v.score * (t < 0 ? 0 : 1 - Math.pow(1 - t, 3)))),
            t < 1 && requestAnimationFrame(up));
        };
      requestAnimationFrame(up);
      const P = s && s._t,
        B = "undefined" != typeof Skins && Skins.mine ? Skins.mine(t) : null,
        R = (m && m.opp && m.opp.look) || null,
        D = { me: S.querySelector('[data-s="me"]'), op: S.querySelector('[data-s="op"]') },
        figs = (t, e) => {
          const a = "me" === t ? i : l,
            o = "me" === t ? w.length : k.length,
            s = [];
          for (let i = 0; i < o; i++) {
            const o = Math.PI + ("me" === t ? -0.55 : 0.55) + (i ? ("me" === t ? 0.25 : -0.25) : 0),
              l = a ? (i ? P.MOVES.hop : P.MOVES.cheer) : i ? P.MOVES.idle : P.MOVES.look;
            s.push({
              look: "me" === t && 0 === i ? B : "op" === t && 0 === i ? R : null,
              yaw: o,
              poses: l(e + 0.4 * i, "me" === t ? "rarm" : "larm"),
            });
          }
          return s;
        },
        drawFigs = () => {
          if (!this.el || !P) return;
          const e = performance.now() / 1e3;
          for (const a of ["me", "op"]) {
            const o = D[a],
              s = figs(a, e),
              i = 290,
              l = 380,
              r = P.renderFigs(t, s, i, l, 2.2, -0.06);
            if (!r) continue;
            o.width !== i * s.length && ((o.width = i * s.length), (o.height = l));
            const d = o.getContext("2d");
            (d.clearRect(0, 0, o.width, o.height),
              d.drawImage(r, 0, 0, i * s.length, l, 0, 0, i * s.length, l));
          }
        };
      ((this.fig = setInterval(drawFigs, 70)),
        drawFigs(),
        (this.tm = setInterval(() => this.out(), 300)),
        this.out());
    }
    out() {
      const t = this.el && this.el.querySelector(".rs-out");
      if (!t) return;
      const e = this.orig.out,
        a = self.XZ && self.XZ.ladder;
      let o;
      if (e && e.friend) o = "好友约战 · 不计分";
      else if (e && e.ai) {
        const t = { easy: "简单", normal: "普通", hard: "困难" }[e.diff] || "";
        if (e.pending) o = "人机对战 · 正在结算天梯分…";
        else if (e.banned)
          o =
            '<span style="color:#FF7A6B">检测到段位分异常增长（' +
            esc(e.banned) +
            "）：段位分已清零，1 小时内不能联机游玩</span>";
        else if (e.d > 0 && null != e.score && a) {
          const s = a.tierOf(e.score);
          o = `<img src="${tierPic(this.game, s)}" alt="" class="${s.glow ? "shine" : ""}"> <span style="color:${s.col}">${esc(s.n)}</span> · ${e.score} 分 <span style="color:#3DDC84">+${e.d}</span><small style="color:#FFD36B">人机${esc(t)} · 排位胜场 +${0 | e.full} 的 ${0 | e.pct}%${e.score >= Ct ? ` · 已到 ${Ct} 分，人机不再加分` : ""}</small>`;
        } else o = "人机对战 · " + (e.why ? esc(e.why) : "不计天梯分");
      } else if (this.orig.r.tour) o = "<small>淘汰赛的名次在对阵页</small>";
      else if (e)
        if (e.error) o = "结算失败：" + esc(e.error);
        else if (e.pending) o = "等待对方上报结果（对方离开 20 秒后自动算分，最多 3 分钟）";
        else if (e.disputed) o = "两边的结果对不上：这场不计分";
        else if (e.void) o = "房主网络不稳定，比赛中断：这场不计分";
        else if (e.banned)
          o =
            '<span style="color:#FF7A6B">检测到段位分异常增长（' +
            esc(e.banned) +
            "）：段位分已清零，1 小时内不能联机游玩</span>";
        else {
          const t = a.tierOf(e.score),
            s = e.d;
          o = `<img src="${tierPic(this.game, t)}" alt="" class="${t.glow ? "shine" : ""}"> <span style="color:${t.col}">${esc(t.n)}</span> · ${e.score} 分 <span style="color:${s >= 0 ? "#3DDC84" : "#FF7A6B"}">${s >= 0 ? "+" : ""}${s}</span>${null != e.bonus ? `<small>其中表现加分 ${e.bonus >= 0 ? "+" : ""}${e.bonus}（评分 ${this.rt.score}）</small>` : ""}`;
        }
      else o = "正在结算…";
      const s = e && e.coins;
      if (
        (s && (s.time || s.win)
          ? (o += `<small style="color:#FFD36B">+${(0 | s.time) + (0 | s.win)} 土豆币 · 对局 ${null != s.mins ? s.mins + " 分钟 " : ""}+${0 | s.time}${s.win ? " · 今日首胜 +" + s.win : ""}</small>`)
          : s && (o += "<small>今天的土豆币已经领满了</small>"),
        t.__h !== o &&
          ((t.__h = o),
          (t.innerHTML = o),
          s &&
            !this.coined &&
            self.XZ &&
            self.XZ.skins &&
            ((this.coined = !0), self.XZ.skins.load(!0))),
        e && e.rating && !this.srv && this.el)
      ) {
        this.srv = !0;
        const t = se.find((t) => t[1] === e.rating.grade) || se[se.length - 1],
          a = this.el.querySelector(".r2-g");
        ((a.textContent = e.rating.grade),
          a.classList.toggle("glow", e.rating.score >= 85),
          this.el.style.setProperty("--gc", t[2]),
          this.el.style.setProperty(
            "--gcs",
            {
              "S+": "#F2B705",
              S: "#F29A05",
              A: "#1E9E57",
              B: "#2F7FE0",
              C: "#7C7870",
              D: "#5A5650",
            }[e.rating.grade] || "#111",
          ),
          (this.rt.score = e.rating.score));
        const o = this.el.querySelector(".r2-cnt");
        o && (o.textContent = e.rating.score);
        const s = this.el.querySelector(".r2-cap");
        s && (s.textContent = "本场评分 · 服务器结算");
      }
    }
    onEsc() {}
    close() {
      (clearInterval(this.tm),
        clearInterval(this.fig),
        this.el && (unmount(this.el), (this.el = null)));
    }
    draw(t) {
      t.menuBackground();
    }
    mouseDown() {}
  }
  self.PotatoResult = PotatoResult;
  const le = {
    CH: [
      [57, 60, 64],
      [53, 57, 60],
      [48, 52, 55],
      [55, 59, 62],
    ],
    BPM: 92,
    out: null,
    echo: null,
    next: 0,
    step: 0,
    live: !1,
    hz: (t) => 440 * Math.pow(2, (t - 69) / 12),
    nodes(t) {
      if (this.out) return;
      ((this.out = t.createGain()),
        (this.out.gain.value = 0),
        this.out.connect(Sound.master || t.destination));
      const e = t.createDelay(1);
      e.delayTime.value = (60 / this.BPM) * 0.75;
      const a = t.createGain();
      a.gain.value = 0.32;
      const o = t.createGain();
      ((o.gain.value = 0.45),
        e.connect(a),
        a.connect(e),
        e.connect(o),
        o.connect(this.out),
        (this.echo = e));
    },
    note(
      t,
      e,
      a,
      {
        type: o = "triangle",
        dur: s = 0.2,
        vol: i = 0.05,
        attack: l = 0.005,
        cut: r = 0,
        echo: d = !1,
        detune: u = 0,
      },
    ) {
      const b = t.createOscillator();
      ((b.type = o), (b.frequency.value = this.hz(a)), u && (b.detune.value = u));
      const h = t.createGain();
      (h.gain.setValueAtTime(0, e),
        h.gain.linearRampToValueAtTime(i, e + l),
        h.gain.exponentialRampToValueAtTime(8e-4, e + s));
      let p = b;
      if (r) {
        const e = t.createBiquadFilter();
        ((e.type = "lowpass"), (e.frequency.value = r), b.connect(e), (p = e));
      }
      (p.connect(h),
        h.connect(this.out),
        d && this.echo && h.connect(this.echo),
        b.start(e),
        b.stop(e + s + 0.05));
    },
    beat(t, e, a) {
      if (a) {
        const a = t.createOscillator(),
          o = t.createGain();
        return (
          (a.type = "sine"),
          a.frequency.setValueAtTime(120, e),
          a.frequency.exponentialRampToValueAtTime(42, e + 0.22),
          o.gain.setValueAtTime(0.2, e),
          o.gain.exponentialRampToValueAtTime(0.001, e + 0.26),
          a.connect(o),
          o.connect(this.out),
          a.start(e),
          void a.stop(e + 0.3)
        );
      }
      if (!Sound.noiseBuf) return;
      const o = t.createBufferSource();
      o.buffer = Sound.noiseBuf;
      const s = t.createBiquadFilter();
      ((s.type = "highpass"), (s.frequency.value = 7e3));
      const i = t.createGain();
      (i.gain.setValueAtTime(0.022, e),
        i.gain.exponentialRampToValueAtTime(8e-4, e + 0.04),
        o.connect(s),
        s.connect(i),
        i.connect(this.out),
        o.start(e, Math.random()),
        o.stop(e + 0.06));
    },
    play(t, e, a) {
      const o = this.CH[Math.floor(a / 32) % 4],
        s = a % 32,
        i = 60 / this.BPM / 4;
      if (0 === s)
        for (const a of o)
          for (const o of [-7, 7])
            this.note(t, e, a, {
              type: "sawtooth",
              dur: 32 * i + 0.6,
              vol: 0.016,
              attack: 1.4,
              cut: 900,
              detune: o,
            });
      [0, 6, 8, 16, 22, 24].includes(s) &&
        this.note(t, e, o[0] - 12, { type: "triangle", dur: 2.6 * i, vol: 0.11, cut: 600 });
      if (
        [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0][s % 16] &&
        (Math.floor(a / 16) % 2 == 0 || s % 4 != 3)
      ) {
        const i = o[(5 * a + Math.floor(a / 16)) % 3] + 12 + (s % 8 == 4 ? 12 : 0);
        this.note(t, e, i, { type: "triangle", dur: 0.22, vol: 0.035, echo: !0 });
      }
      (s % 8 == 0 && this.beat(t, e, !0), s % 4 == 2 && this.beat(t, e, !1));
    },
    tick() {
      const t = self.game,
        e = "undefined" != typeof Sound && Sound.ctx;
      if (!t || !e || "running" !== e.state || Sound.idle) return;
      this.nodes(e);
      const a = "title" === t.state && !1 !== t.settings.potMusic,
        o = e.currentTime,
        s = 0.55 * (Sound.volume ?? 0.8);
      if (a !== this.live) {
        this.live = a;
        const t = this.out.gain;
        (t.cancelScheduledValues(o),
          t.setValueAtTime(t.value, o),
          t.linearRampToValueAtTime(a ? s : 0, o + (a ? 2.5 : 0.8)),
          a && ((this.next = o + 0.1), (this.step = 0)));
      }
      if (!this.live) return;
      const i = 60 / this.BPM / 4;
      for (; this.next < o + 0.3;)
        (this.play(e, this.next, this.step), (this.step = (this.step + 1) % 128), (this.next += i));
    },
    sting(t) {
      const e = "undefined" != typeof Sound && Sound.ctx;
      if (!e || Sound.idle) return;
      this.nodes(e);
      const a = e.currentTime + 0.05,
        o = this.out;
      (o.gain.cancelScheduledValues(a), o.gain.setValueAtTime(0.55 * (Sound.volume ?? 0.8), a));
      const s = "win" === t ? [72, 76, 79, 84] : "lose" === t ? [69, 65, 62, 57] : [72, 72];
      s.forEach((o, i) => {
        const l = i === s.length - 1;
        (this.note(e, a + i * ("lose" === t ? 0.16 : 0.1), o, {
          type: "triangle",
          dur: l ? 1.1 : 0.25,
          vol: 0.12,
          echo: !0,
        }),
          l &&
            "win" === t &&
            this.note(e, a + 0.1 * i, o - 12, {
              type: "sawtooth",
              dur: 1.2,
              vol: 0.03,
              cut: 1800,
            }));
      });
    },
  };
  ((self.PotatoMusic = le),
    setInterval(() => {
      try {
        le.tick();
      } catch (t) {}
    }, 60));
  class PotatoFfaResult extends MenuScreen {
    constructor(t, e) {
      (super(t, null),
        (this.potato = !0),
        (this.orig = e),
        (this.pauses = !1),
        (this.blurBg = !0),
        (this.el = null));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      this.game;
      const t = this.orig,
        e = t.list || [],
        a = self.XZ;
      if ((ensureCss(), !document.getElementById("rs-css"))) {
        const t = document.createElement("style");
        ((t.id = "rs-css"), (t.textContent = ie), document.head.appendChild(t));
      }
      if (!document.getElementById("ff-css")) {
        const t = document.createElement("style");
        ((t.id = "ff-css"),
          (t.textContent =
            '\n  /* 乱斗\'s result (PotatoFfaResult) - the result page\'s language: the band, the title, a paper table of the six */\n  #lobby .ff-wrap { position: absolute; inset: calc(var(--u) * 2) calc(var(--u) * 2.6); display: flex; flex-direction: column; gap: calc(var(--u) * 1); }\n  #lobby .ff-mid { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }\n  #lobby .ff-tab { width: min(100%, calc(var(--u) * 52)); background: #F2EFE9; color: #111; border: calc(var(--u) * .3) solid #111; box-shadow: calc(var(--u) * .7) calc(var(--u) * .7) 0 #111;\n    padding: calc(var(--u) * .9) calc(var(--u) * 1.2); pointer-events: auto; animation: lbUp .5s cubic-bezier(.2,.9,.25,1) .1s backwards; max-height: 100%; overflow: auto; }\n  #lobby .ff-hd, #lobby .ff-row { display: grid; grid-template-columns: calc(var(--u) * 3.4) 1fr calc(var(--u) * 6) calc(var(--u) * 6); align-items: center; gap: calc(var(--u) * .6); }\n  #lobby .ff-hd { font-size: calc(var(--u) * .95); font-weight: 900; color: #6A665E; letter-spacing: .1em; padding: 0 calc(var(--u) * .6) calc(var(--u) * .5); border-bottom: calc(var(--u) * .25) solid #111; }\n  #lobby .ff-hd span:nth-child(n+3), #lobby .ff-row span:nth-child(n+3) { text-align: center; }\n  #lobby .ff-row { margin-top: calc(var(--u) * .5); padding: calc(var(--u) * .45) calc(var(--u) * .6); background: #fff; border: calc(var(--u) * .2) solid #111; font-weight: 900;\n    animation: lbUp .4s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(.25s + var(--i) * 60ms); }\n  #lobby .ff-row.me { background: #FF5A1F; color: #fff; box-shadow: calc(var(--u) * .35) calc(var(--u) * .35) 0 #111; }\n  #lobby .ff-row .pl { font: 900 calc(var(--u) * 1.6)/1 "Bahnschrift", "Arial Black", sans-serif; }\n  #lobby .ff-row.p1 .pl { color: #E0A400; } #lobby .ff-row.me.p1 .pl { color: #FFE27A; }\n  #lobby .ff-row .nm { font-size: calc(var(--u) * 1.3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }\n  #lobby .ff-row .k, #lobby .ff-row .d { font: 900 calc(var(--u) * 1.6)/1 "Bahnschrift", "Arial Black", sans-serif; }\n  #lobby .ff-row .k { color: #1E9E57; } #lobby .ff-row .d { color: #D6402F; } #lobby .ff-row.me .k, #lobby .ff-row.me .d { color: #fff; }\n  #lobby .ff-crown { display: inline-block; font-size: calc(var(--u) * .8); background: #FFC94A; color: #111; padding: 0 calc(var(--u) * .35); margin-left: calc(var(--u) * .4); vertical-align: middle; }\n  #lobby .ff-bot { display: flex; align-items: center; justify-content: space-between; gap: calc(var(--u) * 1.2); animation: lbUp .45s cubic-bezier(.2,.9,.25,1) .3s backwards; }\n  #lobby .ff-note { font-weight: 900; font-size: calc(var(--u) * 1.1); background: #111; color: #A9A59C; padding: calc(var(--u) * .4) calc(var(--u) * 1.1); }'),
          document.head.appendChild(t));
      }
      const o = Math.max(1, e.findIndex((t) => t.me) + 1),
        s = e[o - 1] || { k: 0, d: 0 },
        i = 1 === o,
        l = o <= 3,
        r = i ? "CHAMPION" : "RANK " + o,
        d = i ? "乱斗第一！" : "第 " + o + " 名",
        u = (r + " · ").repeat(8),
        b = a && a.aiDiffName && t.ai ? a.aiDiffName(t.ai.diff) : "";
      try {
        self.PotatoMusic && self.PotatoMusic.sting(i ? "win" : l ? "draw" : "lose");
      } catch (t) {}
      const h = (this.el = document.createElement("div"));
      ((h.id = "lobby"),
        (h.className = "rk rs2"),
        h.style.setProperty("--band", i ? "#FF5A1F" : l ? "#1E9E57" : "#56606F"),
        h.style.setProperty("--rc", i ? "#FFD24A" : l ? "#3DDC84" : "#C9C5BC"),
        (h.innerHTML = `<div class="r2-bg"><i class="bl"></i><i class="br"></i><div class="wm">${u}</div><div class="wm b">${u}</div></div><div class="ff-wrap">\n        <div class="r2-top"><div class="r2-res"><div class="rk-title">${blockText(r)}</div><div class="sub"><b>${d}</b><span>人机 · 乱斗 · 6 人混战${b ? " · " + esc(b) : ""}</span></div></div>\n          <div class="r2-score" title="击杀 / 阵亡"><span class="w">${0 | s.k}</span><i>/</i><span class="l">${0 | s.d}</span></div></div>\n        <div class="ff-mid"><div class="ff-tab"><div class="ff-hd"><span>名次</span><span>玩家</span><span>击杀</span><span>阵亡</span></div>\n          ${e.map((t, e) => `<div class="ff-row ${t.me ? "me" : ""} ${0 === e ? "p1" : ""}" style="--i:${e}"><span class="pl">${e + 1}</span><span class="nm">${esc(String(t.name).slice(0, 16))}${0 === e ? '<i class="ff-crown">冠军</i>' : ""}</span><span class="k">${0 | t.k}</span><span class="d">${0 | t.d}</span></div>`).join("")}\n        </div></div>\n        <div class="ff-bot"><div class="ff-note">乱斗不计天梯分</div><div class="rs-foot"><button class="rs-btn go" data-a="again">再来一局</button><button class="rs-btn" data-a="back">返回大厅</button></div></div>\n      </div>`),
        host().appendChild(h),
        h.addEventListener("click", (e) => {
          const a = e.target.closest("[data-a]");
          if (!a) return;
          const o = t.widgets || [],
            s =
              "again" === a.dataset.a
                ? o.find((t) => "再来一局" === t.label)
                : o.find((t) => "返回" === t.label);
          s && s.onClick && s.onClick();
        }));
    }
    onEsc() {}
    close() {
      this.el && (unmount(this.el), (this.el = null));
    }
    draw(t) {
      t.menuBackground();
    }
    mouseDown() {}
  }
  self.PotatoFfaResult = PotatoFfaResult;
  const re = UI.prototype.open;
  if (
    ((UI.prototype.open = function (t) {
      const e = self.XZ;
      return (
        self.POTATO && t && e && e.LadderResultScreen && t instanceof e.LadderResultScreen
          ? (t = new PotatoResult(this.game, t))
          : self.POTATO &&
            t &&
            e &&
            e.FfaResultScreen &&
            t instanceof e.FfaResultScreen &&
            (t = new PotatoFfaResult(this.game, t)),
        re.call(this, t)
      );
    }),
    "function" == typeof runCommand)
  ) {
    const fa = runCommand;
    runCommand = function (t, e) {
      const a = String(e || "").trim();
      if (a.startsWith("/")) t.ui.message("土豆史诗里不能使用指令", "#FF7A6B");
      else if (a && (t.net || !self.XZ || !XZ.pmChat || !XZ.pmChat(t, a))) {
        if (t.net) return fa.apply(this, arguments);
        t.ui.message(
          "<" + (("undefined" != typeof Account && Account.name) || "我") + "> " + a.slice(0, 60),
          "#FFFF55",
        );
      }
    };
  }
  ("function" == typeof cmdSuggest &&
    (cmdSuggest = function () {
      return null;
    }),
    "undefined" != typeof ChatScreen &&
      ((ChatScreen.prototype.complete = function () {}),
      (ChatScreen.prototype.draw = function (t) {
        const e = this.widgets[0];
        if (!e) return;
        const a = t.ctx;
        (a.save(),
          (a.fillStyle = "#FF5A1F"),
          a.fillRect(e.x, e.y, e.w, e.h),
          (a.font = "800 6.5px " + de),
          (a.fillStyle = "#FFFFFF"),
          (a.textAlign = "center"),
          (a.textBaseline = "middle"),
          a.fillText("发送", e.x + e.w / 2, e.y + e.h / 2 + 0.5),
          a.restore());
      })));
  {
    const ga = document.createElement("style");
    ((ga.textContent =
      '#textinput.pchat { color: #F2EFE9 !important; caret-color: #FF5A1F !important; background: rgba(12,13,16,.82) !important; border-left: 3px solid #FF5A1F !important;\n    font: 600 14px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif !important; padding: 0 10px !important; box-sizing: border-box; border-radius: 0; outline: none; }\n    #textinput.pchat::placeholder { color: #8A877F; }'),
      document.head.appendChild(ga));
  }
  const ce = UI.prototype.drawInputText;
  UI.prototype.drawInputText = function () {
    const t = !(!this.screen || !this.screen.isChat),
      e = this.input;
    if (
      (e &&
        (e.classList.toggle("pchat", t),
        (e.placeholder = t ? "说点什么… Enter 发送 · Esc 取消" : "")),
      !t)
    )
      return ce.apply(this, arguments);
  };
  const de = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    recol = (t) => (
      (t = String(t || "#FFFFFF").toUpperCase()),
      /FF55|FF6B|FF7A/.test(t)
        ? "#FF7A6B"
        : /FFFF55|FFAA|FFD/.test(t)
          ? "#FFD36B"
          : /55FF|7CFF|5CFF/.test(t)
            ? "#7FE3A6"
            : /AAAA|A0A0|8080|7070/.test(t)
              ? "#A9A59C"
              : "#F2EFE9"
    );
  UI.prototype.drawChat = function () {
    const t = this.ctx,
      e = performance.now(),
      a = this.screen && this.screen.isChat,
      o = Math.min(220, 0.45 * this.w),
      s = !(this.touch && this.touch.on && this.touch.on());
    let i =
      this.h -
      (s ? 34 : 70) -
      (this.touch && this.touch.chatLift ? this.touch.chatLift() : 0) -
      (a ? 6 : 0);
    (t.save(), (t.font = "600 6px " + de), (t.textBaseline = "middle"), (t.textAlign = "left"));
    const l = [],
      r = a ? 12 : 6;
    for (let s = this.chat.length - 1; s >= 0 && l.length < 2 * r; s--) {
      const i = this.chat[s],
        r = e - i.t;
      if (!a && r > 1e4) break;
      const d = i.parts ? i.parts.map((t) => t[0]).join("") : String(i.text || ""),
        u = /^<([^>]{1,24})>\s?(.*)$/s.exec(d),
        b = u ? u[1] : null,
        h = u ? u[2] : d,
        p = [];
      let v = "",
        m = o - 10 - (b ? t.measureText(b + "  ").width : 0);
      for (const e of h)
        (t.measureText(v + e).width > m && (p.push(v), (v = ""), (m = o - 10)), (v += e));
      p.push(v);
      for (let t = p.length - 1; t >= 0; t--)
        l.push({
          name: 0 === t ? b : null,
          t: p[t],
          col: recol(i.color),
          a: a ? 1 : Math.max(0, Math.min(1, (1e4 - r) / 1e3)),
        });
    }
    for (const e of l.slice(0, 2 * r)) {
      if (i < 20) break;
      ((t.globalAlpha = 0.62 * e.a),
        (t.fillStyle = "#0C0D10"),
        t.fillRect(4, i - 4.5, o, 9),
        (t.globalAlpha = e.a));
      let a = 8;
      (e.name &&
        ((t.font = "800 6px " + de),
        (t.fillStyle = "#FF8A4D"),
        t.fillText(e.name, a, i),
        (a += t.measureText(e.name + "  ").width),
        (t.font = "600 6px " + de)),
        (t.fillStyle = e.col),
        t.fillText(e.t, a, i),
        (i -= 9.5));
    }
    t.restore();
  };
  const ue = [
      [
        "移动",
        [
          ["forward", "向前", "KeyW"],
          ["back", "向后", "KeyS"],
          ["left", "向左", "KeyA"],
          ["right", "向右", "KeyD"],
          ["jump", "跳", "Space"],
          ["sneak", "蹲（按住）", "ControlLeft"],
          ["potato_crouch2", "蹲（备用键）", "KeyC"],
          ["potato_shift", "静步（按住）/ 滑铲（移动中轻点）", "ShiftLeft"],
        ],
      ],
      [
        "战斗",
        [
          ["attack", "开火", "Mouse0"],
          ["use", "开镜", "Mouse2"],
          ["xzguns_reload", "换弹", "KeyR"],
          ["xzguns_inspect", "检视", "KeyF"],
          ["potato_leanL", "左探头", "KeyQ"],
          ["potato_leanR", "右探头", "KeyE"],
        ],
      ],
      [
        "武器",
        [
          ...[1, 2, 3, 4].map((t) => ["hotbar." + t, "武器栏第 " + t + " 个", "Digit" + t]),
          ["inventory", "装备", "KeyB"],
        ],
      ],
      [
        "交流",
        [
          ["chat", "聊天", "KeyT"],
          ["potato_score", "比分表", "Tab"],
        ],
      ],
      [
        "其他",
        [
          ["togglePerspective", "切换视角（第三人称）", "F5"],
          ["toggleGui", "隐藏界面", "F1"],
          ["screenshot", "截图", "F2"],
          ["fullscreen", "全屏", "F11"],
        ],
      ],
    ],
    fpsKeys = () => {
      if ("undefined" != typeof KEYBIND_CATS) {
        ((KEYBIND_CATS.length = 0), KEYBIND_CATS.push(...ue));
        for (const t of Object.keys(KEY_DEFAULT)) (delete KEY_DEFAULT[t], delete KEY_CN[t]);
        for (const [, t] of ue) for (const [e, a, o] of t) ((KEY_DEFAULT[e] = o), (KEY_CN[e] = a));
      }
    };
  fpsKeys();
  const be = setInterval(() => {
      "undefined" != typeof KEY_CN && self.XZ && self.XZ.R && (clearInterval(be), fpsKeys());
    }, 300),
    RIGHT = (t) => [Math.cos(t), 0, -Math.sin(t)],
    he = Game.prototype.tick;
  function potFlip(t) {
    if (((t.potTP = t.potTP ? 0 : 1), t.potTP && t.ui)) {
      const e = !!(t.ui.touch && t.ui.touch.on && t.ui.touch.on());
      t.ui.actionBar = {
        text: e ? "第三人称 · 再点一次视角按钮回到第一人称" : "第三人称 · 再按 F5 回到第一人称",
        t: performance.now(),
        color: "#FFD24A",
      };
    }
  }
  ((Game.prototype.tick = function () {
    const t = he.apply(this, arguments),
      e = this.player;
    if (!self.POTATO || "play" !== this.state || !e) return t;
    ((this.potView = 0),
      this.perspective !== (this.potPersp ?? 0) && potFlip(this),
      (this.perspective = this.potPersp = this.potTP || 0));
    let a =
      0.45 *
      ("function" != typeof bindDown || this.ui.screen
        ? 0
        : (bindDown(this, "potato_leanR") ? 1 : 0) - (bindDown(this, "potato_leanL") ? 1 : 0));
    if (a && this.raycast) {
      const t = [e.pos[0], e.pos[1] + e.eye(), e.pos[2]],
        o = RIGHT(e.yaw),
        s = [o[0] * Math.sign(a), 0, o[2] * Math.sign(a)],
        i = this.raycast(t, s, Math.abs(a) + 0.25, !1, !0);
      if (i) {
        const e = Math.hypot(i.point[0] - t[0], i.point[2] - t[2]) - 0.25;
        a = Math.sign(a) * Math.max(0, Math.min(Math.abs(a), e));
      }
    }
    return ((e.potLeanT = a), t);
  }),
    (self.Potato.view1 = (t) => {
      ((t.potTP = 0), (t.perspective = t.potPersp = 0));
    }),
    (self.POTATO_CAM = function (t, e, a, o) {
      const s = t.player,
        i = performance.now(),
        l = Math.min(0.1, (i - (t.potCamT || i)) / 1e3);
      ((t.potCamT = i),
        t.perspective !== (t.potPersp ?? 0) && (potFlip(t), (t.potPersp = t.perspective)));
      const r = self.XZ && self.XZ.duel && self.XZ.duel.killCam;
      if (r && self.XZ.duel.down && i - r.t < 2600 && r.e && !r.e.dead) {
        const e = r.e,
          a = [e.pos[0], e.pos[1] + 1.62, e.pos[2]],
          o = [s.pos[0], s.pos[1] + 0.9, s.pos[2]],
          l = [o[0] - a[0], o[1] - a[1], o[2] - a[2]],
          d = Math.hypot(l[0], l[1], l[2]) || 1,
          u = [l[0] / d, l[1] / d, l[2] / d],
          b = Math.min(1, (i - r.t) / 400),
          h = 2.2 * (1 - b) + 3.2 * b,
          p = RIGHT(Math.atan2(-u[0], -u[2])),
          v = [a[0] - u[0] * h + 1.1 * p[0], a[1] + 0.7, a[2] - u[2] * h + 1.1 * p[2]],
          m = [o[0] - v[0], o[1] - v[1], o[2] - v[2]],
          y = Math.hypot(m[0], m[2]) || 1;
        return (
          (t.perspective = t.potPersp = 1),
          (t.potRoll = 0),
          { pos: v, yaw: Math.atan2(-m[0], -m[2]), pitch: Math.atan2(m[1], y) }
        );
      }
      (r &&
        (!self.XZ.duel.down || i - r.t >= 2600) &&
        1 === t.potPersp &&
        1 !== t.potView &&
        (t.perspective = t.potPersp = t.potTP || 0),
        (s.potLean =
          (s.potLean || 0) + ((s.potLeanT || 0) - (s.potLean || 0)) * Math.min(1, 12 * l)),
        (s.potSlideK =
          (s.potSlideK || 0) +
          ((s.potSlide ? 1 : 0) - (s.potSlideK || 0)) * Math.min(1, l * (s.potSlide ? 13 : 5.5))));
      const d = s.potSlideK,
        u = d * d * (3 - 2 * d),
        b = RIGHT(a),
        h = [
          e[0] + b[0] * s.potLean,
          e[1] - 0.12 * Math.abs(s.potLean) - 0.32 * u,
          e[2] + b[2] * s.potLean,
        ];
      t.potRoll = 0.24 * -s.potLean + 0.065 * u;
      const p = self.XZ,
        v = !!(p && p.aimAmount && p.isGun && p.isGun(s.inv.held) && p.aimAmount(s) > 0.3);
      if (t.potTP) {
        if (!v && 0 === s.deathTime)
          return ((t.perspective = t.potPersp = t.potTP), (t.potRoll = 0), null);
        t.perspective = t.potPersp = 0;
      }
      const m = 1 !== t.potView || v || 0 !== s.deathTime ? 0 : 1;
      t.potCamK =
        (t.potCamK || 0) +
        Math.sign(m - (t.potCamK || 0)) *
          Math.min(Math.abs(m - (t.potCamK || 0)), l * (v ? 9 : 5.5));
      const y = t.potCamK,
        w = y * y * (3 - 2 * y);
      if (((t.perspective = t.potPersp = y > 0.04 ? 1 : 0), y <= 0.001))
        return { pos: h, yaw: a, pitch: o };
      const k = [-Math.sin(a) * Math.cos(o), Math.sin(o), -Math.cos(a) * Math.cos(o)];
      t.potSide =
        (t.potSide ?? 1) +
        (((s.potLeanT || 0) < -0.05 ? -1 : 1) - (t.potSide ?? 1)) * Math.min(1, 7 * l);
      const x = 0.65 * t.potSide,
        S = [2 * -k[0] + b[0] * x, 2 * -k[1] + 0.25, 2 * -k[2] + b[2] * x],
        F = Math.hypot(S[0], S[1], S[2]),
        A = [S[0] / F, S[1] / F, S[2] / F];
      let E = F * w;
      for (let e = 0; e < 8; e++) {
        const a = [
            h[0] + 0.1 * (2 * (1 & e) - 1),
            h[1] + 0.1 * (2 * ((e >> 1) & 1) - 1),
            h[2] + 0.1 * (2 * ((e >> 2) & 1) - 1),
          ],
          o = t.raycast(a, A, E, !1, !0);
        if (o) {
          const t = o.point,
            e = Math.hypot(t[0] - h[0], t[1] - h[1], t[2] - h[2]) - 0.15;
          e < E && (E = Math.max(0.05, e));
        }
      }
      const C = [h[0] + A[0] * E, h[1] + A[1] * E, h[2] + A[2] * E],
        T = t.raycast(h, k, 80, !1, !0),
        M = T ? T.point : [h[0] + 80 * k[0], h[1] + 80 * k[1], h[2] + 80 * k[2]],
        $ = [M[0] - C[0], M[1] - C[1], M[2] - C[2]],
        z = Math.hypot($[0], $[1], $[2]) || 1,
        P = Math.atan2(-$[0], -$[2]),
        B = Math.asin(Math.max(-1, Math.min(1, $[1] / z)));
      let R = P - a;
      for (; R > Math.PI;) R -= 2 * Math.PI;
      for (; R < -Math.PI;) R += 2 * Math.PI;
      return { pos: C, yaw: a + R * w, pitch: o + (B - o) * w };
    }));
  const pe = setInterval(() => {
      if (!self.XZ || !self.XZ.R || !self.XZ.duel) return;
      clearInterval(pe);
      const t = UI.prototype.drawHUD;
      UI.prototype.drawHUD = function (...e) {
        const a = this.game,
          o = self.POTATO && a && 1 === a.perspective;
        o && (a.perspective = 0);
        try {
          return t.apply(this, e);
        } finally {
          o && (a.perspective = 1);
        }
      };
      const e = self.XZ.spreadNow;
      self.XZ.spreadNow = function (t, a, o) {
        const s = e.apply(this, arguments);
        return t && t.potSlide ? 2.5 * s + 2 : s;
      };
    }, 300),
    ensureTourCss = () => {
      if ((ensureCss(), !document.getElementById("tr-css"))) {
        const t = document.createElement("style");
        ((t.id = "tr-css"),
          (t.textContent =
            "\n  #lobby.tr { color: #F2EFE9; }\n  #lobby.tr .rk-dim { background: radial-gradient(ellipse at 50% 40%, rgba(255,90,31,.10), transparent 60%), rgba(9,10,13,.94); }\n  #lobby .tr-wrap { position: absolute; inset: calc(var(--u) * 2.4) calc(var(--u) * 3.5); display: flex; flex-direction: column; gap: calc(var(--u) * 1.2); }\n  #lobby .tr-top { display: flex; align-items: flex-end; gap: calc(var(--u) * 2); }\n  #lobby .tr-top .rk-title { font-size: calc(var(--u) * 3.6); }\n  #lobby .tr-top .t2 b { display: block; font-size: calc(var(--u) * 1.8); font-weight: 900; } #lobby .tr-top .t2 span { font-size: calc(var(--u) * 1); color: #A9A59C; font-weight: 700; }\n  #lobby .tr-chips { margin-left: auto; display: flex; gap: calc(var(--u) * .4); }\n  #lobby .tr-chips i { font-style: normal; font-size: calc(var(--u) * 1); font-weight: 900; padding: calc(var(--u) * .45) calc(var(--u) * 1.1); background: rgba(242,239,233,.06); color: #8A877F; clip-path: polygon(8% 0, 100% 0, 92% 100%, 0 100%); }\n  #lobby .tr-chips i.on { background: var(--or); color: #fff; } #lobby .tr-chips i.past { color: #F2EFE9; background: rgba(242,239,233,.14); }\n  #lobby .tr-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr calc(var(--u) * 26); gap: calc(var(--u) * 1.4); }\n  #lobby .tr-br { position: relative; pointer-events: auto; }\n  #lobby .tr-br svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }\n  #lobby .tr-br path { fill: none; stroke: rgba(242,239,233,.16); stroke-width: 2; vector-effect: non-scaling-stroke; }\n  #lobby .tr-br path.won { stroke: rgba(61,220,132,.55); } #lobby .tr-br path.me { stroke: var(--or); stroke-width: 3; filter: drop-shadow(0 0 4px rgba(255,90,31,.7)); }\n  #lobby .tr-c { position: absolute; transform: translate(-50%, -50%); width: 21%; display: flex; align-items: center; gap: calc(var(--u) * .6); padding: calc(var(--u) * .45) calc(var(--u) * .7);\n    background: #17191E; border: 1px solid rgba(242,239,233,.12); border-left: calc(var(--u) * .3) solid #3A3F48; animation: lbUp .4s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(var(--i) * 40ms); }\n  #lobby .tr-c img { width: calc(var(--u) * 2.2); height: calc(var(--u) * 2.2); image-rendering: pixelated; flex: none; }\n  #lobby .tr-c b { flex: 1; font-size: calc(var(--u) * 1.05); font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n  #lobby .tr-c small { font-size: calc(var(--u) * .85); color: #8A877F; font-weight: 800; }\n  #lobby .tr-c.win { border-left-color: #3DDC84; } #lobby .tr-c.lose { opacity: .4; } #lobby .tr-c.lose b { text-decoration: line-through; }\n  #lobby .tr-c.me { border-color: rgba(255,90,31,.6); border-left-color: var(--or); box-shadow: 0 0 calc(var(--u) * 1.2) rgba(255,90,31,.28); }\n  #lobby .tr-c.live { animation: trLive 1.6s ease-in-out infinite; } @keyframes trLive { 50% { border-color: rgba(255,90,31,.55); } }\n  #lobby .tr-c.tbd { background: transparent; border-style: dashed; color: #5E5B55; justify-content: center; }\n  #lobby .tr-c.champ { width: 24%; padding: calc(var(--u) * .9); background: linear-gradient(135deg, #3A2A0E, #1B1508); border: 1px solid #FFD36B; box-shadow: 0 0 calc(var(--u) * 2.4) rgba(255,211,107,.35); flex-direction: column; text-align: center; }\n  #lobby .tr-c.champ img.cup { width: calc(var(--u) * 4.4); height: calc(var(--u) * 4.4); filter: drop-shadow(0 0 calc(var(--u) * .8) rgba(255,211,107,.8)); }\n  #lobby .tr-c.champ b { color: #FFD36B; font-size: calc(var(--u) * 1.5); } #lobby .tr-c.champ small { color: #C9A85E; letter-spacing: .2em; }\n  #lobby .tr-col { position: absolute; top: 0; transform: translateX(-50%); font-size: calc(var(--u) * .9); color: #8A877F; font-weight: 900; letter-spacing: .14em; }\n  #lobby .tr-side { pointer-events: auto; display: flex; flex-direction: column; gap: calc(var(--u) * .8); min-height: 0; }\n  #lobby .tr-card { background: #17191E; border: 1px solid rgba(242,239,233,.12); padding: calc(var(--u) * 1.2); position: relative; overflow: hidden; }\n  #lobby .tr-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: calc(var(--u) * .35); background: var(--or); }\n  #lobby .tr-st { font-size: calc(var(--u) * 2.4); font-weight: 900; line-height: 1.1; } #lobby .tr-sub { font-size: calc(var(--u) * .95); color: #A9A59C; font-weight: 700; line-height: 1.6; margin-top: calc(var(--u) * .4); }\n  #lobby .tr-kv { display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--u) * .6); margin-top: calc(var(--u) * .8); }\n  #lobby .tr-kv div b { display: block; font-size: calc(var(--u) * 1.9); font-weight: 900; } #lobby .tr-kv div small { font-size: calc(var(--u) * .85); color: #8A877F; font-weight: 800; }\n  #lobby .tr-list { flex: 1; min-height: 0; overflow-y: auto; background: #17191E; border: 1px solid rgba(242,239,233,.12); padding: calc(var(--u) * .6) calc(var(--u) * 1); }\n  #lobby .tr-pl { display: grid; grid-template-columns: calc(var(--u) * 2) calc(var(--u) * 1.8) 1fr auto; align-items: center; gap: calc(var(--u) * .6); font-size: calc(var(--u) * 1); font-weight: 800; padding: calc(var(--u) * .35) 0; border-bottom: 1px solid rgba(242,239,233,.06); }\n  #lobby .tr-pl img { width: 100%; image-rendering: pixelated; } #lobby .tr-pl i { font-style: normal; color: var(--or); font-weight: 900; } #lobby .tr-pl em { font-style: normal; color: #A9A59C; font-size: calc(var(--u) * .9); }\n  #lobby .tr-pl.me { color: var(--or); } #lobby .tr-pl.out { opacity: .5; }\n  #lobby .tr-pod { display: grid; grid-template-columns: 1fr 1.15fr 1fr; align-items: end; gap: calc(var(--u) * .5); margin-top: calc(var(--u) * .6); }\n  #lobby .tr-pod div { text-align: center; } #lobby .tr-pod img { width: calc(var(--u) * 3); image-rendering: pixelated; } #lobby .tr-pod b { display: block; font-size: calc(var(--u) * .95); font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n  #lobby .tr-pod i { display: flex; align-items: center; justify-content: center; font-style: normal; font-weight: 900; font-size: calc(var(--u) * 1.6); color: #111; margin-top: calc(var(--u) * .3); animation: trRise .6s cubic-bezier(.2,.9,.25,1) backwards; transform-origin: bottom; }\n  @keyframes trRise { from { transform: scaleY(0); } }\n  #lobby .tr-pod .p1 i { height: calc(var(--u) * 5); background: #FFD36B; animation-delay: .5s; } #lobby .tr-pod .p2 i { height: calc(var(--u) * 3.6); background: #D7DCE2; animation-delay: .3s; } #lobby .tr-pod .p3 i { height: calc(var(--u) * 2.6); background: #E09A5B; animation-delay: .1s; }\n  #lobby .tr-foot { display: flex; justify-content: flex-end; }\n  #lobby .tr-btn { pointer-events: auto; font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.3); padding: calc(var(--u) * .8) calc(var(--u) * 2.6); border: 1px solid rgba(242,239,233,.25); background: rgba(242,239,233,.06); color: #F2EFE9; cursor: pointer; }\n  #lobby .tr-btn:hover { border-color: var(--or); }\n  #lobby .tr-dots::after { content: '…'; animation: lbFade 1s ease infinite alternate; }\n  /* the queue: eight seats round the trophy, the radar's sweep */\n  #lobby .tq-stage { flex: 1; position: relative; pointer-events: auto; }\n  #lobby .tq-mid { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: calc(var(--u) * 24); height: calc(var(--u) * 24); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center;\n    background: radial-gradient(circle, rgba(255,90,31,.12), transparent 70%); }\n  #lobby .tq-mid::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, rgba(255,90,31,.35), transparent 25%); animation: tqSweep 2.4s linear infinite; mask: radial-gradient(circle, transparent 54%, #000 55%); -webkit-mask: radial-gradient(circle, transparent 54%, #000 55%); }\n  #lobby .tq-mid::after { content: ''; position: absolute; inset: 0; border-radius: 50%; border: 1px solid rgba(255,90,31,.35); }\n  @keyframes tqSweep { to { transform: rotate(360deg); } }\n  #lobby .tq-mid img { width: calc(var(--u) * 6); image-rendering: pixelated; filter: drop-shadow(0 0 calc(var(--u) * 1) rgba(255,211,107,.7)); }\n  #lobby .tq-n { font-size: calc(var(--u) * 4.4); font-weight: 900; line-height: 1; margin-top: calc(var(--u) * .5); } #lobby .tq-n em { font-style: normal; font-size: calc(var(--u) * 2); color: #8A877F; }\n  #lobby .tq-t { font-size: calc(var(--u) * 1); color: #A9A59C; font-weight: 800; letter-spacing: .1em; margin-top: calc(var(--u) * .3); }\n  #lobby .tq-seat { position: absolute; transform: translate(-50%, -50%); width: calc(var(--u) * 14); padding: calc(var(--u) * .6) calc(var(--u) * .8); display: flex; align-items: center; gap: calc(var(--u) * .6);\n    border: 1px dashed rgba(242,239,233,.2); color: #5E5B55; font-weight: 900; font-size: calc(var(--u) * 1); transition: all .35s cubic-bezier(.2,.9,.25,1); }\n  #lobby .tq-seat img { width: calc(var(--u) * 2); image-rendering: pixelated; opacity: 0; transition: opacity .3s ease; }\n  #lobby .tq-seat.on { border: 1px solid rgba(242,239,233,.2); border-left: calc(var(--u) * .3) solid var(--or); background: #17191E; color: #F2EFE9; animation: tqPop .45s cubic-bezier(.2,1.4,.4,1); }\n  #lobby .tq-seat.on img { opacity: 1; } #lobby .tq-seat.me { box-shadow: 0 0 calc(var(--u) * 1.2) rgba(255,90,31,.35); }\n  @keyframes tqPop { from { transform: translate(-50%, -50%) scale(.6); opacity: 0; } }\n  #lobby .tq-seat.shuffle { animation: tqShake .12s linear infinite; } @keyframes tqShake { 50% { filter: brightness(1.6); } }\n  #lobby .tq-done { position: absolute; left: 50%; bottom: 4%; transform: translateX(-50%); font-size: calc(var(--u) * 1.8); font-weight: 900; color: var(--or); letter-spacing: .2em; opacity: 0; transition: opacity .3s ease; }\n  #lobby .tq-done.on { opacity: 1; }"),
          document.head.appendChild(t));
      }
    },
    cupPic = (t) => {
      try {
        const e = self.XZ && self.XZ.ladder;
        return e ? tierPic(t, e.TIERS[e.TIERS.length - 1]) : "";
      } catch (t) {
        return "";
      }
    };
  class PotatoTourQueue extends MenuScreen {
    constructor(t, e, a) {
      (super(t, null),
        (this.potato = !0),
        (this.isTourQ = !0),
        (this.me = e || {}),
        (this.o = a || {}),
        (this.n = 1),
        (this.of = 8),
        (this.t0 = performance.now()),
        (this.pauses = !1),
        (this.blurBg = !0),
        (this.el = null));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      (ensureTourCss(), faceIcon());
      const t = this.game,
        e = (this.el = document.createElement("div"));
      ((e.id = "lobby"), (e.className = "rk tr"));
      const a = Array.from({ length: 8 }, (t, e) => {
        const a = -Math.PI / 2 + (e * Math.PI) / 4;
        return `<div class="tq-seat" style="left:${50 + 34 * Math.cos(a)}%;top:${50 + 38 * Math.sin(a)}%"><img alt=""><span>等待玩家</span></div>`;
      }).join("");
      ((e.innerHTML = `<div class="rk-dim"></div><div class="tr-wrap">\n        <div class="tr-top"><div class="rk-title">${blockText("TOURNAMENT")}</div><div class="t2"><b>8 人淘汰赛</b><span>正在集结 · 满 8 人自动开赛</span></div></div>\n        <div class="tq-stage">${a}<div class="tq-mid"><img src="${cupPic(t)}" alt=""><div class="tq-n"><span class="n">1</span><em>/8</em></div><div class="tq-t">已等待 0:00</div></div><div class="tq-done">抽签中</div></div>\n        <div class="tr-foot"><button class="tr-btn" data-a="away" style="display:none">先打人机，轮到再进</button><button class="tr-btn" data-a="cancel">取消排队</button></div></div>`),
        host().appendChild(e),
        e.addEventListener("click", (t) => {
          t.target.closest('[data-a="cancel"]') && this.o.onCancel
            ? this.o.onCancel()
            : t.target.closest('[data-a="away"]') && self.XZ && XZ.capAway && XZ.capAway(this.game);
        }),
        (this.tm = setInterval(() => this.tick(), 250)),
        this.tick());
    }
    count(t, e) {
      ((this.n = Math.max(1, 0 | t)), (this.of = e || 8), this.tick());
    }
    tick() {
      const t = this.el;
      if (!t) return;
      const e = Math.floor((performance.now() - this.t0) / 1e3);
      ((t.querySelector(".tq-n .n").textContent = this.isFull ? this.of : this.n),
        (t.querySelector(".tq-n em").textContent = "/" + this.of));
      const a = self.XZ && XZ.capq && XZ.capq();
      {
        const e = t.querySelector('[data-a="away"]');
        e &&
          (e.style.display =
            !this.isFull && self.XZ && XZ.capCanAway && XZ.capCanAway() ? "" : "none");
      }
      t.querySelector(".tq-t").textContent = this.isFull
        ? "人齐了"
        : a
          ? "排队中 · 前面还有 " + a.ahead + " 人"
          : "已等待 " + Math.floor(e / 60) + ":" + String(e % 60).padStart(2, "0");
      {
        const e = t.querySelector(".tr-top .t2 span");
        e &&
          (e.textContent = a
            ? "服务器人满了 · 现在有 " + a.playing + " 人在玩 · 排队中"
            : "正在集结 · 满 8 人自动开赛");
      }
      this.isFull ||
        t.querySelectorAll(".tq-seat").forEach((t, e) => {
          const a = e < this.n;
          t.classList.contains("on") !== a &&
            (t.classList.toggle("on", a),
            t.classList.toggle("me", 0 === e),
            (t.querySelector("img").src = mt || ""),
            (t.querySelector("span").textContent = a
              ? 0 === e
                ? this.me.name || "我"
                : "玩家 " + (e + 1)
              : "等待玩家"));
        });
    }
    full(t) {
      this.isFull = !0;
      const e = this.el;
      if (!e) return;
      const a = (t || []).map((t) => t.name),
        o = [...e.querySelectorAll(".tq-seat")];
      (o.forEach((t) => {
        (t.classList.add("on", "shuffle"), (t.querySelector("img").src = mt || ""));
      }),
        e.querySelector(".tq-done").classList.add("on"),
        this.tick());
      let s = 0;
      const i = setInterval(() => {
        (o.forEach((t, e) => {
          t.querySelector("span").textContent = a[(e + s) % Math.max(1, a.length)] || "玩家";
        }),
          s++);
      }, 90);
      setTimeout(() => {
        (clearInterval(i),
          o.forEach((t, e) => {
            (t.classList.remove("shuffle"), (t.querySelector("span").textContent = a[e] || "玩家"));
          }),
          (e.querySelector(".tq-done").textContent = "对阵已定"));
      }, 1300);
    }
    onEsc() {}
    close() {
      (clearInterval(this.tm), this.el && (unmount(this.el), (this.el = null)));
    }
    draw(t) {
      t.menuBackground();
    }
    mouseDown() {}
  }
  self.PotatoTourQueue = PotatoTourQueue;
  class PotatoTour extends MenuScreen {
    constructor(t, e) {
      (super(t, null),
        (this.potato = !0),
        (this.isTour = !0),
        (this.st = e || {}),
        (this.pauses = !1),
        (this.blurBg = !0),
        (this.el = null));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      (ensureTourCss(), faceIcon());
      const t = (this.el = document.createElement("div"));
      ((t.id = "lobby"),
        (t.className = "rk tr"),
        (t.innerHTML = `<div class="rk-dim"></div><div class="tr-wrap">\n        <div class="tr-top"><div class="rk-title">${blockText("TOURNAMENT")}</div><div class="t2"><b>8 人淘汰赛</b><span>每场先胜 3 局 · 每局随机一把枪 · 输了淘汰</span></div><div class="tr-chips"></div></div>\n        <div class="tr-body"><div class="tr-br"></div><div class="tr-side"></div></div>\n        <div class="tr-foot"><button class="tr-btn" data-a="leave">返回大厅</button></div></div>`),
        host().appendChild(t),
        t.addEventListener("click", (t) => {
          const e = t.target.closest("[data-a]");
          e && "leave" === e.dataset.a && this.leave();
        }),
        this.fill());
    }
    update(t) {
      ((this.st = t || {}), this.fill());
    }
    fill() {
      const t = this.el;
      if (!t) return;
      const e = this.st,
        a = this.game;
      if (e.error)
        return void (t.querySelector(".tr-side").innerHTML =
          `<div class="tr-card"><div class="tr-st">连接出错</div><div class="tr-sub">${esc(e.error)}</div></div>`);
      const o = e.players || [],
        s = o.length || 8,
        i = Math.max(1, Math.round(Math.log2(s))),
        l = e.done ? i + 1 : e.round || 1,
        r = mt || "",
        d = 3 === i ? ["八强", "半决赛", "决赛"] : 2 === i ? ["半决赛", "决赛"] : ["决赛"];
      t.querySelector(".tr-chips").innerHTML =
        d
          .map((t, e) => `<i class="${e + 1 === l ? "on" : e + 1 < l ? "past" : ""}">${t}</i>`)
          .join("") + `<i class="${e.done ? "on" : ""}">冠军</i>`;
      const passed = (t, a) => t.out > a || (t.out < 0 && (l > a || e.done)),
        through = (t, e) =>
          o.slice(e * (1 << t), (e + 1) * (1 << t)).find((e) => passed(e, t)) || null,
        X = (t) => 11 + t * (78 / i),
        Y = (t, e) => ((e + 0.5) / (s >> t)) * 92 + 6;
      let u = "",
        b = "",
        h = 0;
      for (let t = 0; t <= i; t++) {
        u += `<div class="tr-col" style="left:${X(t)}%">${t === i ? "冠军" : d[t]}</div>`;
        for (let d = 0; d < s >> t; d++) {
          const s = 0 === t ? o[d] : through(t, d),
            p = X(t),
            v = Y(t, d);
          if (t === i) {
            u += s
              ? `<div class="tr-c champ" style="left:${p}%;top:${v}%;--i:${h++}"><img class="cup" src="${cupPic(a)}" alt=""><b>${esc(s.name)}</b><small>CHAMPION</small></div>`
              : `<div class="tr-c champ tbd" style="left:${p}%;top:${v}%;--i:${h++}"><img class="cup" src="${cupPic(a)}" alt="" style="opacity:.35"><small>待定</small></div>`;
            continue;
          }
          const m = s && s.out >= 0 && s.out === t + 1,
            y = s && passed(s, t + 1),
            w = s && !e.done && l === t + 1 && !m && !y;
          u += s
            ? `<div class="tr-c ${s.me ? "me" : ""} ${m ? "lose" : y ? "win" : ""} ${w ? "live" : ""}" style="left:${p}%;top:${v}%;--i:${h++}"><img src="${r}" alt=""><b>${esc(s.name)}</b>${0 === t ? `<small>${s.score}</small>` : ""}</div>`
            : `<div class="tr-c tbd" style="left:${p}%;top:${v}%;--i:${h++}">待定</div>`;
          const k = X(t + 1),
            x = Y(t + 1, d >> 1),
            S = (p + k) / 2;
          b += `<path class="${s && y ? (s.me ? "me" : "won") : ""}" d="M${p + 10.5} ${v} H${S} V${x} H${k - (t + 1 === i ? 12 : 10.5)}"/>`;
        }
      }
      t.querySelector(".tr-br").innerHTML =
        `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${b}</svg>` + u;
      const p = o.find((t) => t.me),
        v = t.querySelector(".tr-side");
      let m = "",
        y = "";
      const w = e.places && p ? e.places.find((t) => t.name === p.name) : null;
      e.done
        ? ((m = w && 1 === w.place ? "冠军！" : w ? "第 " + w.place + " 名" : "比赛结束"),
          (y = "冠军、亚军之后按出局的轮次排；同一轮出局的，看整场比赛造成的伤害。"))
        : p && p.out >= 0
          ? ((m = "已淘汰"), (y = d[p.out - 1] + "出局 · 比赛结束后按伤害排名次，可以留下来看完。"))
          : e.bye
            ? ((m = "轮空晋级"), (y = '这一轮没有对手，直接进下一轮<span class="tr-dots"></span>'))
            : ((m = d[l - 1] || "进行中"),
              (y = '等待其他比赛结束<span class="tr-dots"></span> 你的下一场准备好会自动开始。'));
      const k = e.places
        ? (() => {
            const at = (t) => e.places[t] || { name: "—", dmg: 0 };
            return `<div class="tr-pod"><div class="p2"><img src="${r}" alt=""><b>${esc(at(1).name)}</b><i>2</i></div><div class="p1"><img src="${r}" alt=""><b>${esc(at(0).name)}</b><i>1</i></div><div class="p3"><img src="${r}" alt=""><b>${esc(at(2).name)}</b><i>3</i></div></div>`;
          })()
        : "";
      ((v.innerHTML = `<div class="tr-card"><div class="tr-st">${m}</div><div class="tr-sub">${y}</div>${p ? `<div class="tr-kv"><div><b>${p.dmg}</b><small>累计伤害</small></div><div><b>${o.filter((t) => t.out < 0).length}</b><small>剩余选手</small></div></div>` : ""}${k}</div>\n        <div class="tr-list">${(e.places || o.map((t) => ({ name: t.name, dmg: t.dmg, out: t.out }))).map((t, a) => `<div class="tr-pl ${(o.find((e) => e.name === t.name) || {}).me ? "me" : ""} ${!e.places && t.out >= 0 ? "out" : ""}"><i>${e.places ? t.place : t.out < 0 ? "●" : "×"}</i><img src="${r}" alt=""><span>${esc(t.name)}</span><em>${e.places ? t.dmg + " 伤害" : t.out < 0 ? "在赛 · " + t.dmg : d[t.out - 1] + "出局 · " + t.dmg}</em></div>`).join("")}</div>`),
        (t.querySelector('[data-a="leave"]').textContent =
          e.done || (p && p.out >= 0) ? "返回大厅" : "退出（算输）"));
    }
    leave() {
      const t = self.XZ;
      t && t.tourLeave ? t.tourLeave(this.game) : this.game.ui.close();
    }
    onEsc() {}
    close() {
      this.el && (unmount(this.el), (this.el = null));
    }
    draw(t) {
      t.menuBackground();
    }
    mouseDown() {}
  }
  self.PotatoTour = PotatoTour;
  const fe = ["#FFC94A", "#C9CED8", "#D9874A"];
  class PotatoTourEnd extends MenuScreen {
    constructor(t, e) {
      (super(t, null),
        (this.potato = !0),
        (this.isTourEnd = !0),
        (this.st = e || {}),
        (this.pauses = !1),
        (this.blurBg = !0),
        (this.el = null));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      const t = this.game,
        e = this.st,
        a = self.XZ,
        o = a && a.ladder;
      ensureCss();
      for (const [t, e] of [
        ["rs-css", ie],
        [
          "te-css",
          '\n  #lobby .te-mid { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: calc(var(--u) * 1.4); align-items: stretch; }\n  #lobby .te-card { background: #F2EFE9; color: #111; border: calc(var(--u) * .3) solid #111; box-shadow: calc(var(--u) * .7) calc(var(--u) * .7) 0 var(--band); padding: calc(var(--u) * 1) calc(var(--u) * 1.3);\n    display: flex; flex-direction: column; gap: calc(var(--u) * .6); align-self: center; pointer-events: auto; animation: lbUp .5s cubic-bezier(.2,.9,.25,1) .15s backwards; }\n  #lobby .te-cap { font-size: calc(var(--u) * .95); color: #6A665E; font-weight: 900; letter-spacing: .14em; }\n  #lobby .te-place { display: flex; align-items: baseline; gap: calc(var(--u) * .6); }\n  #lobby .te-place b { font: italic 900 calc(var(--u) * 7)/1 "Bahnschrift", "Arial Black", sans-serif; color: var(--band); -webkit-text-stroke: calc(var(--u) * .25) #111; paint-order: stroke fill;\n    text-shadow: calc(var(--u) * .4) calc(var(--u) * .4) 0 #111; animation: r2Stamp .5s cubic-bezier(.3,1.6,.5,1) .9s backwards; }\n  #lobby .te-place span { font-size: calc(var(--u) * 1.5); font-weight: 900; color: #6A665E; }\n  #lobby .te-kv { display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--u) * .5); }\n  #lobby .te-kv div { background: #111; color: #F2EFE9; padding: calc(var(--u) * .45) calc(var(--u) * .7); border-top: calc(var(--u) * .3) solid var(--c); }\n  #lobby .te-kv b { display: block; font: 900 calc(var(--u) * 1.9)/1.1 "Bahnschrift", "Arial Black", sans-serif; } #lobby .te-kv small { font-size: calc(var(--u) * .85); color: #A9A59C; font-weight: 900; }\n  #lobby .te-path { display: flex; gap: calc(var(--u) * .4); }\n  #lobby .te-path i { flex: 1; font-style: normal; text-align: center; font-size: calc(var(--u) * .85); font-weight: 900; padding: calc(var(--u) * .3) 0; border: calc(var(--u) * .2) solid #111; background: #DDD8CE; color: #8A877F; }\n  #lobby .te-path i.ok { background: #1E9E57; color: #fff; } #lobby .te-path i.no { background: #D6402F; color: #fff; } #lobby .te-path i.top { background: #F2B705; color: #111; }\n  #lobby .te-pod { display: grid; grid-template-columns: 1fr 1.15fr 1fr; align-items: end; gap: calc(var(--u) * .6); min-height: 0; }\n  #lobby .te-col { display: flex; flex-direction: column; align-items: stretch; min-height: 0; height: 100%; justify-content: flex-end; animation: lbUp .55s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .te-col:nth-child(1) { animation-delay: .45s; } #lobby .te-col:nth-child(2) { animation-delay: .25s; } #lobby .te-col:nth-child(3) { animation-delay: .6s; }\n  #lobby .te-fw { flex: 1; min-height: 0; position: relative; }\n  #lobby .te-fw canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; object-position: center bottom; image-rendering: pixelated; filter: drop-shadow(calc(var(--u) * .5) calc(var(--u) * .4) 0 rgba(0,0,0,.35)); }\n  #lobby .te-blk { background: var(--pc); border: calc(var(--u) * .3) solid #111; box-shadow: calc(var(--u) * .5) calc(var(--u) * .5) 0 rgba(0,0,0,.45); display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: calc(var(--u) * .4); }\n  #lobby .te-blk b { font: 900 calc(var(--u) * 2.7)/1 "Bahnschrift", "Arial Black", sans-serif; color: #111; } #lobby .te-col:nth-child(2) .te-blk b { font-size: calc(var(--u) * 3.6); } #lobby .te-blk span { font-size: calc(var(--u) * 1.1); font-weight: 900; color: #111; max-width: 92%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n  #lobby .te-blk.me { outline: calc(var(--u) * .35) solid #FF5A1F; outline-offset: calc(var(--u) * .2); }\n  #lobby .te-list { display: flex; flex-direction: column; gap: calc(var(--u) * .3); }\n  #lobby .te-row { display: grid; grid-template-columns: calc(var(--u) * 2.2) 1fr auto; gap: calc(var(--u) * .6); align-items: center; font-size: calc(var(--u) * 1.05); font-weight: 900; padding: calc(var(--u) * .3) calc(var(--u) * .5);\n    border-bottom: 1px solid #D6D1C6; animation: lbUp .35s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: calc(.4s + var(--i) * 45ms); }\n  #lobby .te-row i { font-style: normal; text-align: center; background: #DDD8CE; } #lobby .te-row.p1 i { background: #F2B705; } #lobby .te-row.p2 i { background: #C9CED8; } #lobby .te-row.p3 i { background: #D9874A; }\n  #lobby .te-row.me { background: #111; color: #F2EFE9; } #lobby .te-row em { font-style: normal; color: #6A665E; font-size: calc(var(--u) * .9); } #lobby .te-row.me em { color: #A9A59C; }',
        ],
      ])
        if (!document.getElementById(t)) {
          const a = document.createElement("style");
          ((a.id = t), (a.textContent = e), document.head.appendChild(a));
        }
      const s = e.players || [],
        i = s.find((t) => t.me) || {},
        l = e.places || [],
        r = l.find((t) => t.name === i.name) || { place: 8, dmg: i.dmg || 0 },
        d = r.place,
        u = 1 === d ? "CHAMPION" : 2 === d ? "RUNNER-UP" : d <= 4 ? "TOP 4" : "TOP 8",
        b = 1 === d ? "冠军！" : "第 " + d + " 名",
        h = 1 === d ? "#F2A900" : 2 === d ? "#8E97A8" : d <= 4 ? "#C9733A" : "#56606F",
        p = (u + " · ").repeat(8),
        v = null == i.out ? -1 : i.out,
        m = ["八强", "半决赛", "决赛"]
          .map((t, e) => {
            const a = e + 1,
              o = v < 0 ? (3 === a ? "top" : "ok") : a < v ? "ok" : a === v ? "no" : "";
            return `<i class="${o}">${t}${"ok" === o || "top" === o ? " ✓" : "no" === o ? " ✗" : ""}</i>`;
          })
          .join(""),
        y = v < 0 ? 3 : Math.max(0, v - 1),
        w = [l[1], l[0], l[2]],
        k = (this.el = document.createElement("div"));
      ((k.id = "lobby"),
        (k.className = "rk rs2"),
        k.style.setProperty("--band", h),
        k.style.setProperty("--rc", 1 === d ? "#FFC94A" : "#F2EFE9"),
        (k.innerHTML = `<div class="r2-bg"><i class="bl"></i><i class="br"></i><div class="wm">${p}</div><div class="wm b">${p}</div></div><div class="r2-wrap">\n        <div class="r2-top"><div class="r2-res"><div class="rk-title">${blockText(u)}</div><div class="sub"><b>${b}</b><span>8 人淘汰赛 · 共 ${s.length || 8} 人</span></div></div>\n          <div class="r2-score">#${d}<i>/</i><span style="color:#8A877F">${s.length || 8}</span></div></div>\n        <div class="te-mid">\n          <div class="te-card"><div class="te-cap">你的淘汰赛 · MY RUN</div>\n            <div class="te-place"><b>${1 === d ? "1st" : 2 === d ? "2nd" : 3 === d ? "3rd" : d + "th"}</b><span>${1 === d ? "夺得冠军" : 2 === d ? "获得亚军" : d <= 4 ? "进入四强" : "首轮出局"}</span></div>\n            <div class="te-path">${m}</div>\n            <div class="te-kv"><div style="--c:#E8423F"><b>${Math.round(r.dmg || 0)}</b><small>累计伤害</small></div><div style="--c:#3DDC84"><b>${y}</b><small>赢下场次</small></div></div></div>\n          <div class="te-pod">${w
          .map((t, e) => {
            const a = 1 === e ? 1 : 0 === e ? 2 : 3;
            return t
              ? `<div class="te-col"><div class="te-fw"><canvas data-k="${e}"></canvas></div>\n            <div class="te-blk ${t.name === i.name ? "me" : ""}" style="--pc:${fe[a - 1]};height:calc(var(--u) * ${1 === a ? 8 : 2 === a ? 6.4 : 5.2})"><b>${a}</b><span>${esc(t.name)}</span></div></div>`
              : '<div class="te-col"></div>';
          })
          .join(
            "",
          )}</div>\n          <div class="te-card"><div class="te-cap">名次 · STANDINGS</div><div class="te-list">${l.map((t, e) => `<div class="te-row p${t.place} ${t.name === i.name ? "me" : ""}" style="--i:${e}"><i>${t.place}</i><span>${esc(t.name)}</span><em>${t.dmg} 伤害</em></div>`).join("")}</div></div>\n        </div>\n        <div class="r2-bot"><div></div><div class="rs-out"></div>\n          <div class="rs-foot"><button class="rs-btn" data-a="bracket">查看对阵</button><button class="rs-btn go" data-a="back">返回大厅</button></div></div>\n      </div>`),
        host().appendChild(k),
        k.addEventListener("click", (o) => {
          const s = o.target.closest("[data-a]");
          s &&
            ("bracket" === s.dataset.a
              ? t.ui.open(new PotatoTour(t, e))
              : a && a.tourLeave
                ? a.tourLeave(t)
                : t.ui.close());
        }));
      const x = k.querySelector(".rs-out"),
        S = e.ladder;
      if (S && o) {
        const e = o.tierOf(S.score),
          a = S.d;
        x.innerHTML = `<img src="${tierPic(t, e)}" alt=""> <span style="color:${e.col}">${esc(e.n)}</span> · ${S.score} 分 <span style="color:${a >= 0 ? "#3DDC84" : "#FF7A6B"}">${a >= 0 ? "+" : ""}${a}</span><small>按名次计天梯分：冠军约为一场胜利的 1.8 倍</small>`;
      } else x.innerHTML = "<small>天梯分正在结算…</small>";
      const F = o && o._t,
        A = "undefined" != typeof Skins && Skins.mine ? Skins.mine(t) : null,
        E = [...k.querySelectorAll(".te-fw canvas")],
        draw = () => {
          if (!this.el || !F) return;
          const e = performance.now() / 1e3;
          for (const a of E) {
            const o = +a.dataset.k,
              s = w[o],
              l = 1 === o ? 1 : 0 === o ? 2 : 3;
            if (!s) continue;
            const r = 1 === l ? F.MOVES.cheer : 2 === l ? F.MOVES.wave : F.MOVES.hop,
              d = 260,
              u = 380,
              b = F.renderFigs(
                t,
                [
                  {
                    look: s.name === i.name ? A : null,
                    yaw: Math.PI + (0 === o ? -0.35 : 2 === o ? 0.35 : 0),
                    poses: r(e + 0.5 * o, 2 === o ? "larm" : "rarm"),
                  },
                ],
                d,
                u,
                2.05,
                -0.03,
              );
            if (!b) continue;
            a.width !== d && ((a.width = d), (a.height = u));
            const h = a.getContext("2d");
            (h.clearRect(0, 0, d, u), h.drawImage(b, 0, 0, d, u, 0, 0, d, u));
          }
        };
      ((this.fig = setInterval(draw, 70)), draw());
    }
    update(t) {
      this.st = t;
    }
    onEsc() {}
    close() {
      (clearInterval(this.fig), this.el && (unmount(this.el), (this.el = null)));
    }
    draw(t) {
      t.menuBackground();
    }
    mouseDown() {}
  }
  self.PotatoTourEnd = PotatoTourEnd;
  const ge = setInterval(() => {
      const t = self.XZ;
      t &&
        t.duel &&
        (clearInterval(ge),
        (t.tourShow = (t, e) => {
          const a = t.ui.screen;
          if (e && e.done && e.places && PotatoTourEnd.seen !== e.id)
            return ((PotatoTourEnd.seen = e.id), void t.ui.open(new PotatoTourEnd(t, e)));
          (a && a.isTourEnd) || (a && a.isTour) ? a.update(e) : t.ui.open(new PotatoTour(t, e));
        }),
        (t.tourQueueScreen = (t, e, a) => new PotatoTourQueue(t, e, a)));
    }, 300),
    ve = ["#FF5A1F", "#3E7BFA", "#19C79A", "#FFB020", "#B57BFF", "#FF5AA5", "#5CE8DD"],
    shCol = (t) => {
      let e = 0;
      for (const a of String(t)) e = (31 * e + a.codePointAt(0)) >>> 0;
      return ve[e % ve.length];
    },
    shCss = () => {
      ensureCss();
      for (const [t, e] of [
        ["rs-css", ie],
        [
          "shp-css",
          '\n  #lobby .lb-sh { position: absolute; left: calc(var(--u) * 3); top: calc(var(--u) * 27.4); width: calc(var(--u) * 26); transform: rotateY(13deg); transform-origin: left center; pointer-events: auto; cursor: pointer; background: var(--paper); border: calc(var(--u) * .3) solid var(--ink);\n    box-shadow: calc(var(--u) * .45) calc(var(--u) * .45) 0 #111; padding: calc(var(--u) * .55) calc(var(--u) * .9); display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 0 calc(var(--u) * .8);\n    transition: transform .15s ease, box-shadow .15s ease; animation: lbL .5s .12s cubic-bezier(.2,.9,.25,1) backwards; }\n  #lobby .lb-sh:hover { transform: rotateY(13deg) translate(calc(var(--u) * -.2), calc(var(--u) * -.2)); box-shadow: calc(var(--u) * .7) calc(var(--u) * .7) 0 var(--or); }\n  #lobby .lb-sh small { font-size: calc(var(--u) * .8); font-weight: 900; color: #6A665E; letter-spacing: .12em; }\n  #lobby .lb-sh b { font: 900 calc(var(--u) * 1.7)/1.1 "Bahnschrift", "Arial Black", sans-serif; color: #111; grid-row: span 2; text-align: right; }\n  #lobby .lb-sh b em { font-style: normal; font-size: calc(var(--u) * .9); color: #6A665E; margin-left: calc(var(--u) * .2); }\n  #lobby .lb-sh .nm { font-size: calc(var(--u) * 1.1); font-weight: 900; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; height: 1.4em; position: relative; }\n  #lobby .lb-sh .nm span { position: absolute; left: 0; top: 0; animation: shRoll .35s cubic-bezier(.2,.9,.25,1); } @keyframes shRoll { from { transform: translateY(100%); opacity: 0; } }\n  #lobby .lb-sh i { position: absolute; right: calc(var(--u) * -.6); top: calc(var(--u) * -.9); font-style: normal; font-weight: 900; font-size: calc(var(--u) * .8); background: var(--or); color: #fff; padding: 0 calc(var(--u) * .4); opacity: 0; transform: scale(.6); transition: .2s; }\n  #lobby .lb-sh.new i { opacity: 1; transform: none; }\n  #lobby.shp .shp-mid { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.5fr); gap: calc(var(--u) * 1.6); }\n  #lobby .shp-card { align-self: center; background: #F2EFE9; color: #111; border: calc(var(--u) * .3) solid #111; box-shadow: calc(var(--u) * .7) calc(var(--u) * .7) 0 var(--or); padding: calc(var(--u) * 1.2) calc(var(--u) * 1.5);\n    display: flex; flex-direction: column; gap: calc(var(--u) * .7); pointer-events: auto; animation: lbUp .5s cubic-bezier(.2,.9,.25,1) .1s backwards; }\n  #lobby .shp-cap { font-size: calc(var(--u) * .95); color: #6A665E; font-weight: 900; letter-spacing: .14em; }\n  #lobby .shp-n { font: italic 900 calc(var(--u) * 6.4)/1 "Bahnschrift", "Arial Black", sans-serif; color: var(--or); -webkit-text-stroke: calc(var(--u) * .22) #111; paint-order: stroke fill; text-shadow: calc(var(--u) * .4) calc(var(--u) * .4) 0 #111; }\n  #lobby .shp-n small { font-size: calc(var(--u) * 1.6); color: #6A665E; -webkit-text-stroke: 0; text-shadow: none; font-style: normal; margin-left: calc(var(--u) * .4); }\n  #lobby .shp-sub { font-size: calc(var(--u) * 1); font-weight: 800; color: #4A4740; line-height: 1.6; }\n  #lobby .shp-me { background: #111; color: #F2EFE9; padding: calc(var(--u) * .7) calc(var(--u) * .9); display: flex; align-items: center; justify-content: space-between; gap: calc(var(--u) * .6); }\n  #lobby .shp-me b { font-size: calc(var(--u) * 1.4); font-weight: 900; } #lobby .shp-me b em { font-style: normal; color: var(--or); }\n  #lobby .shp-btn { pointer-events: auto; font: inherit; font-weight: 900; font-size: calc(var(--u) * 1.25); padding: calc(var(--u) * .6) calc(var(--u) * 1.4); border: calc(var(--u) * .3) solid #111; background: #F2EFE9; color: #111; cursor: pointer;\n    box-shadow: calc(var(--u) * .35) calc(var(--u) * .35) 0 #111; transition: transform .1s ease, box-shadow .1s ease; }\n  #lobby .shp-btn.go { background: var(--or); color: #fff; } #lobby .shp-btn:hover { transform: translate(calc(var(--u) * -.15), calc(var(--u) * -.15)); box-shadow: calc(var(--u) * .5) calc(var(--u) * .5) 0 #111; }\n  #lobby .shp-btn.sm { font-size: calc(var(--u) * .95); padding: calc(var(--u) * .35) calc(var(--u) * .8); box-shadow: none; }\n  #lobby .shp-gift { display: flex; align-items: center; gap: calc(var(--u) * .7); font-size: calc(var(--u) * .95); font-weight: 800; color: #4A4740; border-top: 1px dashed #C9C4B8; padding-top: calc(var(--u) * .6); }\n  #lobby .shp-gift i { width: calc(var(--u) * 2.4); height: calc(var(--u) * 3); flex: none; background: linear-gradient(180deg, #0B1030, #2A1B5C); border: calc(var(--u) * .2) solid #111; position: relative; overflow: hidden; }\n  #lobby .shp-gift i::after { content: \'\'; position: absolute; left: 30%; top: 25%; width: 3px; height: 3px; background: #FFD54A; box-shadow: 6px 4px #FF5AA5, 2px 10px #5CE8DD, 9px 13px #fff; animation: shTw 1.4s steps(2) infinite; } @keyframes shTw { 50% { opacity: .35; } }\n  #lobby .shp-wall { position: relative; min-height: 0; overflow: hidden; pointer-events: auto; cursor: grab; touch-action: none; border: calc(var(--u) * .3) solid #111; background: rgba(10,11,14,.55);\n    -webkit-mask-image: linear-gradient(180deg, transparent, #000 10%, #000 90%, transparent); mask-image: linear-gradient(180deg, transparent, #000 10%, #000 90%, transparent); animation: lbFade .6s ease-out .2s backwards; }\n  #lobby .shp-wall.drag { cursor: grabbing; }\n  #lobby .shp-cols { position: absolute; inset: 0 calc(var(--u) * .8); display: grid; gap: calc(var(--u) * .7); }\n  #lobby .shp-col { position: relative; overflow: visible; }\n  #lobby .shp-t { position: absolute; left: 0; right: 0; height: calc(var(--u) * 3.4); background: #F2EFE9; color: #111; border: calc(var(--u) * .22) solid #111; box-shadow: calc(var(--u) * .3) calc(var(--u) * .3) 0 rgba(0,0,0,.55);\n    display: flex; align-items: center; gap: calc(var(--u) * .5); padding: 0 calc(var(--u) * .6); font-size: calc(var(--u) * 1.05); font-weight: 900; white-space: nowrap; overflow: hidden; transition: transform .2s cubic-bezier(.3,1.6,.5,1), background .2s, opacity .3s; cursor: pointer; }\n  #lobby .shp-t::before { content: \'\'; flex: none; width: calc(var(--u) * .5); align-self: stretch; margin: calc(var(--u) * .5) 0; background: var(--c); }\n  #lobby .shp-t span { overflow: hidden; text-overflow: ellipsis; }\n  #lobby .shp-t:hover { transform: translate(calc(var(--u) * -.2), calc(var(--u) * -.25)) rotate(-1deg); box-shadow: calc(var(--u) * .5) calc(var(--u) * .5) 0 var(--c); }\n  #lobby .shp-t.pop { animation: shPop .45s cubic-bezier(.3,1.6,.5,1); } @keyframes shPop { 40% { transform: scale(1.18) rotate(-3deg); background: var(--c); color: #fff; } }\n  #lobby .shp-t.me { background: var(--or); color: #fff; } #lobby .shp-t.new::after { content: \'NEW\'; margin-left: auto; font-size: calc(var(--u) * .75); background: #111; color: #FFD54A; padding: 0 calc(var(--u) * .35); }\n  #lobby .shp-wall.dim .shp-t:not(.me):not(.hit) { opacity: .25; } #lobby .shp-t.hit { outline: calc(var(--u) * .3) solid #FFD54A; }\n  #lobby .shp-burst { position: absolute; width: calc(var(--u) * .7); height: calc(var(--u) * .7); pointer-events: none; background: var(--c); animation: shBurst .7s cubic-bezier(.2,.8,.3,1) forwards; z-index: 3; }\n  @keyframes shBurst { to { transform: translate(var(--dx), var(--dy)) rotate(var(--r)); opacity: 0; } }\n  #lobby .shp-tools { display: flex; gap: calc(var(--u) * .7); align-items: center; pointer-events: auto; }\n  #lobby .shp-tools input { font: inherit; font-weight: 800; font-size: calc(var(--u) * 1.05); padding: calc(var(--u) * .45) calc(var(--u) * .8); border: calc(var(--u) * .25) solid #111; background: #F2EFE9; color: #111; width: calc(var(--u) * 14); outline: none; }\n  #lobby .shp-toast { position: absolute; left: 50%; top: calc(var(--u) * 6); transform: translateX(-50%); background: #111; color: #F2EFE9; border-left: calc(var(--u) * .6) solid var(--or); padding: calc(var(--u) * .6) calc(var(--u) * 1.2);\n    font-weight: 900; font-size: calc(var(--u) * 1.2); z-index: 5; animation: shToast 3.2s ease forwards; pointer-events: none; } @keyframes shToast { 0% { opacity: 0; transform: translate(-50%, -40%); } 10%, 85% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; } }',
        ],
      ])
        if (!document.getElementById(t)) {
          const a = document.createElement("style");
          ((a.id = t), (a.textContent = e), document.head.appendChild(a));
        }
    },
    shOk = () =>
      "undefined" != typeof Share &&
      "undefined" != typeof RoomService &&
      RoomService.base &&
      RoomService.base();
  class PotatoShare extends MenuScreen {
    constructor(t, e) {
      (super(t, null),
        (this.potato = !0),
        (this.parent = e),
        (this.pauses = !1),
        (this.blurBg = !0),
        (this.el = null),
        (this.cols = []),
        (this.v = 0),
        (this.drag = null),
        (this.q = ""));
    }
    layout() {
      this.el || this.mount();
    }
    mount() {
      this.game;
      shCss();
      const t = (this.el = document.createElement("div"));
      ((t.id = "lobby"),
        (t.className = "rk rs2 shp"),
        t.style.setProperty("--band", "#FF5A1F"),
        t.style.setProperty("--rc", "#FFF8EE"));
      const e = "SHAREHOLDERS · ".repeat(8);
      ((t.innerHTML = `<div class="r2-bg"><i class="bl"></i><i class="br"></i><div class="wm">${e}</div><div class="wm b">${e}</div></div><div class="r2-wrap">\n        <div class="r2-top"><div class="r2-res"><div class="rk-title">${blockText("SHAREHOLDERS")}</div><div class="sub"><b>股东名单</b><span>关注 UP 主就能加入 · 名字永久留在这里</span></div></div>\n          <div class="shp-tools" style="margin-left:auto"><input class="shp-q" placeholder="搜索名字" maxlength="20"><button class="shp-btn sm" data-a="find">找到我</button></div></div>\n        <div class="shp-mid">\n          <div class="shp-card"><div class="shp-cap">股东人数 · TOTAL</div>\n            <div class="shp-n"><span class="shp-cnt">0</span><small>位</small></div>\n            <div class="shp-sub">每一位关注 UP 主的玩家都能加入。新加入的名字会实时出现在右边的名字墙上。</div>\n            <div class="shp-me"></div>\n            <div class="shp-gift"><i></i><span>加入就送「烟花夜空披风」，退出后也保留</span></div></div>\n          <div class="shp-wall"><div class="shp-cols"></div></div>\n        </div>\n        <div class="r2-bot"><div></div><div></div><div class="rs-foot"><button class="rs-btn" data-a="back">返回大厅</button></div></div>\n      </div>`),
        host().appendChild(t),
        t.addEventListener("click", (t) => {
          const e = t.target.closest("[data-a]");
          if (e) return void this.act(e.dataset.a);
          const a = t.target.closest(".shp-t");
          a && !this.moved && this.pop(a);
        }),
        t.querySelector(".shp-q").addEventListener("input", (t) => {
          ((this.q = t.target.value.trim()),
            clearTimeout(this.qT),
            (this.qT = setTimeout(() => this.fill(), 180)));
        }),
        ["keydown", "keyup"].forEach((e) =>
          t.querySelector(".shp-q").addEventListener(e, (t) => t.stopPropagation()),
        ));
      const a = t.querySelector(".shp-wall");
      (a.addEventListener("pointerdown", (t) => {
        ((this.drag = { y: t.clientY, t: performance.now() }),
          (this.moved = !1),
          a.classList.add("drag"),
          a.setPointerCapture(t.pointerId));
      }),
        a.addEventListener("pointermove", (t) => {
          if (!this.drag) return;
          const e = t.clientY - this.drag.y,
            a = performance.now();
          (Math.abs(e) > 3 && (this.moved = !0),
            (this.off += e),
            (this.v = (e / Math.max(1, a - this.drag.t)) * 16),
            (this.drag = { y: t.clientY, t: a }));
        }));
      const up = () => {
        this.drag &&
          ((this.drag = null),
          a.classList.remove("drag"),
          setTimeout(() => {
            this.moved = !1;
          }, 0));
      };
      (a.addEventListener("pointerup", up),
        a.addEventListener("pointercancel", up),
        (this.off = 0),
        (this.names = []),
        this.fill(),
        this.me(),
        (this.shown = 0),
        (this.tm = setInterval(() => this.poll(), 4e3)),
        this.poll(!0));
      const step = () => {
        this.el && ((this.raf = requestAnimationFrame(step)), this.frame());
      };
      this.raf = requestAnimationFrame(step);
    }
    async poll(t) {
      if (!shOk()) return void this.say("没有连接到服务器，暂时看不到名单");
      try {
        t ? await Share.load() : await Share.poll();
      } catch (t) {
        return void this.say(t.message);
      }
      const e = new Set(this.names),
        a = (Share.news || []).filter((t) => !e.has(t.name) && performance.now() - t.t < 8e3);
      ((this.names = [...new Set([...Share.pool])]), this.fill(a.map((t) => t.name)));
      for (const t of a) this.say("欢迎 " + t.name + " 成为第 " + t.no + " 位股东！");
    }
    async me() {
      const t = this.el && this.el.querySelector(".shp-me");
      if (!t) return;
      const e = "undefined" != typeof Account && Account.loggedIn;
      e && shOk() && (await Share.mine().catch(() => {}));
      const a = Share.me;
      t.innerHTML = e
        ? a && a.in
          ? `<b>你是第 <em>${a.no}</em> 位股东</b><button class="shp-btn sm" data-a="leave">退出</button>`
          : '<b>你还不是股东</b><button class="shp-btn go sm" data-a="join">加入股东名单</button>'
        : '<b>登录后可以加入</b><button class="shp-btn go sm" data-a="login">登录</button>';
    }
    fill(t = []) {
      const e = this.el && this.el.querySelector(".shp-cols");
      if (!e) return;
      const a = e.clientWidth || 600,
        o = Math.max(2, Math.min(5, Math.floor(a / 150)));
      e.style.gridTemplateColumns = `repeat(${o}, 1fr)`;
      const s = Share.me && Share.me.in ? Share.me.name : null,
        i = (this.q || "").toLowerCase();
      let l = this.names.length ? this.names : ["虚位以待"];
      if (i) {
        const t = l.filter((t) => t.toLowerCase().includes(i));
        t.length && (l = t);
      }
      const r = [...new Set([...(s ? [s] : []), ...t])].filter(
        (t) => !i || t.toLowerCase().includes(i),
      );
      if (l.length > 36 * o) {
        const t = l.filter((t) => !r.includes(t)),
          e = [],
          a = t.length / (36 * o - r.length);
        for (let s = 0; e.length < 36 * o - r.length && s < t.length; s++)
          e.push(t[Math.floor(s * a) % t.length]);
        l = [...r, ...e];
      }
      ((e.innerHTML = ""), (this.cols = []));
      const d = (this.uu = parseFloat(getComputedStyle(this.el).getPropertyValue("--u")) || 8),
        u = (this.tileH = 4.1 * d),
        b = e.clientHeight || 400;
      for (let a = 0; a < o; a++) {
        const i = document.createElement("div");
        ((i.className = "shp-col"), (i.style.willChange = "transform"), e.appendChild(i));
        const r = l.filter((t, e) => e % o === a);
        r.length || r.push(l[a % l.length]);
        for (const e of t) r.includes(e) || 0 !== a || r.unshift(e);
        const d = Math.max(2, Math.ceil(b / (r.length * u)) + 1),
          h = document.createDocumentFragment();
        let p = 0;
        for (let e = 0; e < d; e++)
          for (const e of r) {
            const a = document.createElement("div");
            ((a.className = "shp-t" + (e === s ? " me" : "") + (t.includes(e) ? " new" : "")),
              a.style.setProperty("--c", shCol(e)),
              (a.style.top = p++ * u + "px"),
              (a.innerHTML = `<span>${esc(e)}</span>`),
              (a.dataset.n = e),
              h.appendChild(a));
          }
        (i.appendChild(h),
          this.cols.push({
            col: i,
            len: r.length,
            sp: 0.25 + (((37 * a) % 5) * 0.18) / 4,
            dir: a % 2 ? 1 : -1,
          }));
      }
      ((this.qShown = i), this.mark());
    }
    frame() {
      const t = this.tileH || 32;
      this.drag || ((this.off += this.v), (this.v *= 0.94));
      const e = performance.now() / 1e3;
      for (const a of this.cols) {
        const o = a.len * t,
          s = (((a.dir * e * a.sp * 40 + this.off * (1 + 0.15 * a.dir)) % o) + o) % o;
        a.col.style.transform = "translate3d(0," + (-s).toFixed(1) + "px,0)";
      }
      const a = this.el.querySelector(".shp-cnt"),
        o = 0 | Share.count;
      a &&
        this.shown !== o &&
        ((this.shown += Math.max(1, Math.ceil((o - this.shown) / 12)) * Math.sign(o - this.shown)),
        Math.abs(o - this.shown) < 1 && (this.shown = o),
        (a.textContent = this.shown));
    }
    pop(t) {
      (t.classList.remove("pop"), t.offsetWidth, t.classList.add("pop"));
      const e = this.el.querySelector(".shp-wall"),
        a = e.getBoundingClientRect(),
        o = t.getBoundingClientRect(),
        s = getComputedStyle(t).getPropertyValue("--c");
      for (let t = 0; t < 14; t++) {
        const i = document.createElement("div"),
          l = Math.random() * Math.PI * 2,
          r = 40 + 70 * Math.random();
        ((i.className = "shp-burst"),
          (i.style.left = o.left - a.left + o.width / 2 + "px"),
          (i.style.top = o.top - a.top + o.height / 2 + "px"),
          i.style.setProperty("--c", t % 3 ? s : "#FFD54A"),
          i.style.setProperty("--dx", Math.cos(l) * r + "px"),
          i.style.setProperty("--dy", Math.sin(l) * r + "px"),
          i.style.setProperty("--r", ((360 * Math.random()) | 0) + "deg"),
          e.appendChild(i),
          setTimeout(() => i.remove(), 800));
      }
      try {
        Sound.click();
      } catch (t) {}
    }
    mark() {
      const t = this.el && this.el.querySelector(".shp-wall");
      if (!t) return;
      const e = this.q.toLowerCase();
      let a = !1;
      (t.querySelectorAll(".shp-t").forEach((t) => {
        const o = !!e && t.dataset.n.toLowerCase().includes(e);
        (t.classList.toggle("hit", o), (a = a || o));
      }),
        t.classList.toggle("dim", a || !!this.finding));
    }
    say(t) {
      if (!this.el) return;
      const e = document.createElement("div");
      ((e.className = "shp-toast"),
        (e.textContent = t),
        this.el.appendChild(e),
        setTimeout(() => e.remove(), 3300));
    }
    async act(t) {
      const e = this.game;
      if ("back" !== t)
        if ("login" !== t)
          if ("join" !== t)
            if ("leave" !== t) {
              if ("find" === t) {
                if (!(Share.me && Share.me.in ? Share.me.name : null))
                  return void this.say(
                    "undefined" != typeof Account && Account.loggedIn
                      ? "你还不在名单里 · 点「加入股东名单」"
                      : "先登录才能找到自己",
                  );
                ((this.finding = !0), this.mark(), (this.v = 0));
                const t = this.el.querySelector(".shp-t.me"),
                  e = this.el.querySelector(".shp-wall");
                if (t) {
                  const a = e.getBoundingClientRect(),
                    o = t.getBoundingClientRect();
                  ((this.off += a.top + a.height / 2 - (o.top + o.height / 2)), this.pop(t));
                }
                setTimeout(() => {
                  ((this.finding = !1), this.mark());
                }, 3e3);
              }
            } else {
              try {
                (await Share.leave(), this.say("已退出股东名单（披风会保留）"), this.poll(!0));
              } catch (t) {
                this.say(t.message);
              }
              this.me();
            }
          else {
            try {
              const t = await Share.join();
              (this.say("欢迎！你是第 " + t.no + " 位股东"),
                (this.names = [...new Set([...Share.pool])]),
                this.fill([t.name]));
            } catch (t) {
              this.say(t.message);
            }
            this.me();
          }
        else e.ui.open(new LoginScreen(e, () => e.ui.open(new PotatoShare(e, this.parent))));
      else backTo(e, this.parent);
    }
    onEsc() {
      backTo(this.game, this.parent);
    }
    close() {
      (clearInterval(this.tm),
        cancelAnimationFrame(this.raf),
        this.el && (unmount(this.el), (this.el = null)));
    }
    draw(t) {
      t.menuBackground();
    }
    mouseDown() {}
  }
  self.PotatoShare = PotatoShare;
  ((self.Potato.lobbyShare = (t) => {
    const e = t && t.querySelector(".lb-sh");
    if (!e) return () => {};
    let a = !0,
      o = 0,
      s = -1;
    const tick = async () => {
      if (!a || !shOk()) return;
      try {
        Share.seq < 0 || !Share.ok ? await Share.load() : await Share.poll();
      } catch (t) {
        return;
      }
      e.querySelector("b").innerHTML = (0 | Share.count) + "<em>位</em>";
      const t =
        Share.news.length && performance.now() - Share.news[Share.news.length - 1].t < 6e3
          ? Share.news[Share.news.length - 1].name
          : Share.pool[o++ % Math.max(1, Share.pool.length)];
      (t && (e.querySelector(".nm").innerHTML = `<span>${esc(t)}</span>`),
        e.classList.toggle("new", s >= 0 && Share.seq > s),
        (s = Share.seq));
    };
    tick();
    const i = setInterval(tick, 2500);
    return () => {
      ((a = !1), clearInterval(i));
    };
  }),
    (self.Potato.openRange = openRange));
  {
    const va = UI.prototype.open;
    UI.prototype.open = function (t) {
      return (
        self.POTATO &&
          t &&
          "undefined" != typeof ShareholdersScreen &&
          t instanceof ShareholdersScreen &&
          (t = new PotatoShare(this.game, t.parent || null)),
        va.call(this, t)
      );
    };
  }
})();
//# sourceURL=js/potato.js
