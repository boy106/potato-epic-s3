"use strict";
const Capes = (() => {
  const hex = (t) => [
      parseInt(t.slice(1, 3), 16),
      parseInt(t.slice(3, 5), 16),
      parseInt(t.slice(5, 7), 16),
    ],
    t = {
      potato: {
        pal: {
          y: "#E8B830",
          g: "#3F7A3A",
          G: "#2F5D2C",
          s: "#7BC24F",
          p: "#C8914F",
          P: "#A06A33",
          d: "#6E4522",
          h: "#E8BB80",
        },
        rows: [
          "yyyyyyyyyy",
          "yGgGgGgGgy",
          "ygGgsgGgGy",
          "yGgGssGgGy",
          "ygGgGsgGgy",
          "yGgpppppgy",
          "ygpphpppPy",
          "yGphhppdPy",
          "ygpppppPPy",
          "yGpdpppPPy",
          "ygpppdPPPy",
          "yGgPPPPPgy",
          "ygGgGgGgGy",
          "yGgGgGgGgy",
          "ygGgGgGgGy",
          "yyyyyyyyyy",
        ],
      },
      sakura: {
        pal: { s: "#F9D3E2", S: "#F3B4CC", w: "#FFFFFF", p: "#E86A9A", b: "#6A4434", k: "#4A2E24" },
        rows: [
          "ssSsssSsss",
          "sspwpsssSs",
          "spwpbbsSss",
          "ssbbkspwps",
          "sbksspwwps",
          "bkSsssppss",
          "kssSpssSss",
          "ssspwpssSs",
          "sSsspssbbs",
          "sssSssbkSs",
          "spssSbkspw",
          "pwpsbkssSp",
          "spsbkSsssS",
          "ssbkssSpss",
          "sbkssspwps",
          "bkSsssspss",
        ],
      },
      starry: {
        pal: {
          n: "#0B1636",
          N: "#16245A",
          w: "#FFFFFF",
          y: "#FFE58A",
          m: "#F5F1C8",
          b: "#2B3A7A",
          c: "#5468B8",
        },
        rows: [
          "nNnnnwnnNn",
          "nnnNnnnnnn",
          "nwnnnnmmnn",
          "nnnnnmmnnn",
          "nnNnnmmnnN",
          "nnnnnnmmny",
          "Nnnynnnnnn",
          "nnnnnNnnnn",
          "nnwnnnnnwn",
          "nnnnnnnNnn",
          "nNnnnynnnn",
          "nnnnnnnnnn",
          "nnnNnnnnwn",
          "nwnnnnNnnn",
          "cnncnncnnc",
          "bbbbbbbbbb",
        ],
      },
      ocean: {
        pal: { l: "#8FDBF5", w: "#EEF9FF", m: "#2C7CC4", d: "#114780", D: "#0B3462", s: "#F2D79B" },
        rows: [
          "llllllllll",
          "lwwllllwwl",
          "wmmwllwmmw",
          "mmmmwwmmmm",
          "mmmmmmmmmm",
          "mwwmmmmwwm",
          "wddwmmwddw",
          "dddddddddd",
          "dwwddddwwd",
          "wDDwddwDDw",
          "DDDDDDDDDD",
          "DDsDDDDDsD",
          "DDDDDDDDDD",
          "DDDDsDDDDD",
          "ssDDDDDsss",
          "ssssssssss",
        ],
      },
      penguin: {
        pal: {
          b: "#BFE6FF",
          w: "#FFFFFF",
          k: "#1E1E26",
          e: "#FFFFFF",
          o: "#F29A2E",
          W: "#F7F7F2",
          g: "#F4FAFF",
          G: "#D6ECFA",
        },
        rows: [
          "bwbbbbbwbb",
          "bbbkkkkbbb",
          "wbkkkkkkbb",
          "bbkekkekbw",
          "bbkkookkbb",
          "bbkkWWkkbb",
          "bkkWWWWkkb",
          "bkkWWWWkkb",
          "wkkWWWWkkb",
          "bbkWWWWkbb",
          "bbkWWWWkbw",
          "bbkkWWkkbb",
          "bwbkkkkbbb",
          "bboobboobb",
          "gggggggggg",
          "gGgggGgggG",
        ],
      },
    },
    n = [
      "...kkkk...",
      "..kkkkkk..",
      "..kekkek..",
      "..kkookk..",
      "..kkWWkk..",
      ".kkWWWWkk.",
      ".kkWWWWkk.",
      ".kkWWWWkk.",
      "..kWWWWk..",
      "..kWWWWk..",
      "..kkWWkk..",
      "...kkkk...",
    ],
    o = [
      "....b...",
      "...bgG..",
      ".yy.byy.",
      "yWYyyyyy",
      "yYYyyyyo",
      "yYyyyyyo",
      "yyyyyyoo",
      ".yyyyoo.",
      "..yo.oo.",
    ],
    a = 2 * Math.PI,
    mix = (t, n, o) => [
      t[0] + (n[0] - t[0]) * o,
      t[1] + (n[1] - t[1]) * o,
      t[2] + (n[2] - t[2]) * o,
    ],
    STAR = (t, n, o) => {
      const a =
        43758.5453 * Math.sin(12.9898 * Math.floor(10 * t) + 78.233 * Math.floor(16 * n) + o);
      return a - Math.floor(a);
    },
    s = {
      sunset(t, n, o) {
        const s = Math.min(9, Math.floor(10 * t)),
          e = Math.min(15, Math.floor(16 * n)),
          rnd = (t) => {
            const n = 43758.5453 * Math.sin(12.9898 * s + 78.233 * e + t);
            return n - Math.floor(n);
          };
        if (e < 8) {
          let t = mix(hex("#FF7A59"), hex("#FFD27A"), e / 7);
          const n = Math.hypot(s - 4.5, 1.1 * (e - 6.2));
          return (
            n < 2.4 && (t = hex(n < 1.4 ? "#FFF6C8" : "#FFE27A")),
            e < 3 && rnd(2) > 0.86 && (t = mix(t, hex("#FFB8A0"), 0.6)),
            t
          );
        }
        if (e < 13) {
          let t = hex(8 === e ? "#4AA3E0" : e < 11 ? "#2B7FD1" : "#1F64B0");
          return (
            Math.abs(s - 4.5) < 1.6 - 0.15 * (e - 8) &&
              rnd(Math.floor(16 * o)) > 0.4 &&
              (t = hex(8 === e ? "#FFF2B0" : "#FFD27A")),
            t
          );
        }
        const r = 13 + Math.round(0.9 * Math.sin(o * a + 0.4 * s));
        return hex(e === r ? "#F5FBFF" : e < r ? "#5BB7E8" : 15 === e ? "#E8C77E" : "#F2D79B");
      },
      lava(t, n, o) {
        const s =
          Math.sin(7 * t + 1.5 * Math.sin(5 * n + o * a)) * Math.cos(6 * n - o * a * 2) +
          0.6 * Math.sin(9 * (t + n) + o * a);
        return hex(
          s > 0.9
            ? "#FFE27A"
            : s > 0.35
              ? "#FF9A2A"
              : s > -0.3
                ? "#E0461A"
                : s > -0.9
                  ? "#7A1A0A"
                  : "#2E0A04",
        );
      },
      nebula(t, n, o) {
        const s =
          (Math.sin(4 * t + o * a) +
            Math.sin(5 * n - o * a) +
            0.7 * Math.sin(6 * (t - n) + 1.3) +
            0.4 * Math.sin(9 * t + 3 * n + o * a * 2) +
            3) /
          6;
        let e =
          s < 0.4
            ? mix(hex("#0A0420"), hex("#2A1060"), s / 0.4)
            : s < 0.7
              ? mix(hex("#2A1060"), hex("#7A3AB8"), (s - 0.4) / 0.3)
              : mix(hex("#7A3AB8"), hex("#F08AD8"), Math.min(1, (s - 0.7) / 0.3));
        const r = STAR(t, n, 7);
        return (
          r > 0.9 && (e = mix(e, [255, 255, 255], Math.max(0, Math.sin(o * a * 3 + 60 * r)))),
          e
        );
      },
    },
    e = ["#.##.#", "######", "#R##B#", "######"],
    r = [".##.", "####", ".##."],
    i = {
      rim: "#E8B830",
      rimL: "#FFF6C0",
      crL: "#FFE27A",
      cr: "#F2C94C",
      crD: "#C8961E",
      star: "#FFF0A0",
    },
    F = {
      rim: "#B8C0CC",
      rimL: "#FFFFFF",
      crL: "#F2F5FA",
      cr: "#C8D0DC",
      crD: "#8A94A4",
      star: "#FFFFFF",
    },
    c = {
      admin: [
        "紫金",
        {
          ...i,
          bg1: "#2A0A4A",
          bg2: "#4A1478",
          weave: "#7A3AB8",
          j1: "#E0303A",
          j2: "#3A6AE0",
          spark: "#FFF0C8",
        },
      ],
      admblack: [
        "黑金",
        {
          ...i,
          bg1: "#0C0C10",
          bg2: "#1E1E26",
          weave: "#3C3A30",
          j1: "#E0303A",
          j2: "#2FC4A0",
          spark: "#FFE08A",
        },
      ],
      admred: [
        "酒红金",
        {
          ...i,
          bg1: "#3A0610",
          bg2: "#6E1020",
          weave: "#A8303E",
          j1: "#2FB0E0",
          j2: "#3AD07A",
          spark: "#FFE6C0",
        },
      ],
      admblue: [
        "宝蓝金",
        {
          ...i,
          bg1: "#08163E",
          bg2: "#123072",
          weave: "#2E5AB8",
          j1: "#E0303A",
          j2: "#3AD07A",
          spark: "#DDEBFF",
        },
      ],
      admgreen: [
        "翡翠金",
        {
          ...i,
          bg1: "#052A1A",
          bg2: "#0C5434",
          weave: "#1F8A55",
          j1: "#E0303A",
          j2: "#3A6AE0",
          spark: "#E6FFE0",
        },
      ],
      admivory: [
        "象牙白金",
        {
          ...i,
          rim: "#C8961E",
          bg1: "#F4F0E6",
          bg2: "#DCD2BE",
          weave: "#FFFFFF",
          j1: "#D0283A",
          j2: "#2A5AD0",
          spark: "#FFFFFF",
          star: "#FFE27A",
        },
      ],
      admsilver: [
        "黑银",
        {
          ...F,
          bg1: "#0C0C10",
          bg2: "#1C1E26",
          weave: "#3A3E4A",
          j1: "#E0303A",
          j2: "#3A8AE0",
          spark: "#E6F0FF",
        },
      ],
      admnavy: [
        "午夜蓝银",
        {
          ...F,
          star: "#EAF2FF",
          bg1: "#060A1E",
          bg2: "#101C44",
          weave: "#26386E",
          j1: "#8A3AE0",
          j2: "#3AD0E0",
          spark: "#CFE0FF",
        },
      ],
    },
    crownCape = (t) => (n, o, s) => {
      const i = Math.min(9, Math.floor(10 * n)),
        F = Math.min(15, Math.floor(16 * o)),
        c = hex(t.rim),
        l = hex(t.rimL);
      if (0 === i || 9 === i || 0 === F || 15 === F) {
        const t = 0 === F ? i : 9 === i ? 9 + F : 15 === F ? 9 - i + 24 : 15 - F + 33,
          n = Math.abs((((t - 48 * s) % 48) + 48) % 48),
          o = Math.min(n, 48 - n);
        return o < 1.5 ? l : o < 3.5 ? mix(c, l, 0.45) : c;
      }
      const sheen = (t) => {
          const n = (i + 0.6 * F) / 15,
            o = ((1.6 * s) % 1.6) - 0.2;
          return Math.abs(n - o) < 0.07 ? mix(t, [255, 255, 255], 0.3) : t;
        },
        h = F >= 2 && F <= 5 && i >= 2 && i <= 7 ? e[F - 2][i - 2] : ".";
      if ("R" === h || "B" === h)
        return mix(
          hex("R" === h ? t.j1 : t.j2),
          [255, 255, 255],
          0.5 * Math.max(0, Math.sin(s * a * 2 + ("R" === h ? 0 : 2))),
        );
      if ("#" === h) return sheen(hex(2 === F ? t.crL : 5 === F ? t.crD : t.cr));
      if ("#" === (F >= 9 && F <= 11 && i >= 3 && i <= 6 ? r[F - 9][i - 3] : "."))
        return mix(hex(t.crD), hex(t.star), 0.5 + 0.5 * Math.sin(s * a));
      let m = mix(hex(t.bg1), hex(t.bg2), F / 15);
      (i + F) % 4 == 0 && (((i - F) % 4) + 4) % 4 == 0 && (m = mix(m, hex(t.weave), 0.55));
      const p = STAR(n, o, 11);
      return (
        p > 0.92 && (m = mix(m, hex(t.spark), 0.9 * Math.max(0, Math.sin(s * a * 3 + 60 * p)))),
        sheen(m)
      );
    };
  for (const t in c) s[t] = crownCape(c[t][1]);
  const px = (t, n) => [Math.min(9, Math.floor(10 * t)), Math.min(15, Math.floor(16 * n))],
    rndc = (t, n, o) => {
      const a = 43758.5453 * Math.sin(12.9898 * t + 78.233 * n + o);
      return a - Math.floor(a);
    };
  ((s.admender = (t, n, o) => {
    const [s, e] = px(t, n);
    if (0 === s || 9 === s || 0 === e || 15 === e)
      return mix(hex("#3A0F55"), hex("#B040E0"), 0.5 + 0.5 * Math.sin(o * a + 0.5 * (s + e)));
    if (3 === e && (3 === s || 6 === s)) {
      return ((16 * o) | 0) % 16 == 9
        ? hex("#1A0826")
        : mix(hex("#CC33FF"), hex("#FFD0FF"), 0.5 + 0.5 * Math.sin(o * a * 2));
    }
    let r = mix(hex("#0B0410"), hex("#1E0A30"), e / 15);
    for (let t = 0; t < 2; t++) {
      const n = (((16 * rndc(s, t, 3) - 16 * o * (1 + t)) % 16) + 16) % 16;
      Math.abs(n - e) < 0.6
        ? (r = hex(t ? "#FF66FF" : "#CC33FF"))
        : Math.abs(n - e) < 1.4 && (r = mix(r, hex("#7A1AA0"), 0.6));
    }
    return r;
  }),
    (s.admaurora = (t, n, o) => {
      const [s, e] = px(t, n),
        r = [12, 11, 10, 11, 12, 11, 10, 9, 10, 11];
      if (e >= r[s]) return hex(e === r[s] ? "#F2F8FF" : e < 14 ? "#9DB4D0" : "#6E86A8");
      let i = mix(hex("#03101C"), hex("#0B2540"), e / 12);
      const F = 3.5 + 1.6 * Math.sin(0.7 * s + o * a),
        c = 7 + 1.2 * Math.sin(0.55 * s - o * a + 1),
        l = Math.abs(e - F),
        h = Math.abs(e - c);
      (l < 1.6 && (i = mix(i, mix(hex("#3BFF9A"), hex("#4AE0FF"), s / 9), 1 - l / 1.6)),
        h < 1.2 && (i = mix(i, hex("#9A5BFF"), 0.8 * (1 - h / 1.2))));
      const m = rndc(s, e, 9);
      return (
        m > 0.93 &&
          l > 1.6 &&
          (i = mix(i, [255, 255, 255], Math.max(0, Math.sin(o * a * 2 + 40 * m)))),
        i
      );
    }),
    (s.admriver = (t, n, o) => {
      const [a, s] = px(t, n),
        e = 4.5 + 2.2 * Math.sin(0.45 * s),
        r = Math.abs(a - e);
      if (r < 1.6) {
        const t = (((s - 16 * o) % 4) + 4) % 4;
        return hex(t < 1 ? "#FF5A5A" : t < 2 ? "#E0283A" : "#B3122E");
      }
      if (r < 2.5) return (s + Math.floor(8 * o)) % 3 ? hex("#E8B830") : hex("#FFE27A");
      const i = rndc(a, s, 4);
      return hex(i > 0.8 ? "#4A4A4A" : i > 0.4 ? "#353535" : "#262626");
    }),
    (s.admgold = (t, n, o) => {
      const [s, e] = px(t, n),
        r = 3 + Math.floor(4 * rndc(s, 0, 6)),
        i = 3 + Math.floor(7 * (0.5 + 0.5 * Math.sin(o * a + 1.3 * s)));
      let F =
        e < 2
          ? hex("#E8B830")
          : e <= r + i
            ? hex(e === r + i ? "#FFE27A" : e % 2 ? "#D9A520" : "#E8B830")
            : mix(hex("#141414"), hex("#222222"), e / 15);
      const c = (s + 0.6 * e) / 15,
        l = ((1.4 * o) % 1.4) - 0.2;
      return (Math.abs(c - l) < 0.06 && e <= r + i && (F = mix(F, [255, 255, 255], 0.5)), F);
    }),
    (s.admvoid = (t, n, o) => {
      const [s, e] = px(t, n),
        r = s - 4.5,
        i = 0.7 * (e - 7.5),
        F = Math.hypot(r, i),
        c = Math.atan2(i, r);
      let l = hex("#03020A");
      if (F < 0.9) return hex("#FFFFFF");
      if (F < 1.6) l = hex("#C8B8FF");
      else if (F < 5.2) {
        const t = Math.cos(2 * (c - 0.9 * F - o * a));
        t > 0.55 && (l = mix(hex("#3A2AA0"), hex("#B060FF"), ((t - 0.55) / 0.45) * (1 - F / 6)));
      }
      const h = rndc(s, e, 12);
      return (
        h > 0.92 &&
          (l = mix(l, [255, 255, 255], 0.4 + 0.6 * Math.max(0, Math.sin(o * a * 2 + 50 * h)))),
        l
      );
    }),
    (s.penguinwalk = (t, o, a) => {
      const [s, e] = px(t, o),
        r = Math.floor(16 * a) % 16,
        i = (r >> 1) % 4,
        F = [0, 1, 0, -1][i],
        c = 1 === i ? 0 : 3 === i ? 1 : -1,
        l = c >= 0 ? -1 : 0;
      if (e >= 14) return hex(15 === e && s % 4 == 1 ? "#D6ECFA" : "#F4FAFF");
      const h = e - 1 - l,
        m = s - F,
        p = h >= 0 && h < 12 && m >= 0 && m < 10 ? n[h][m] : ".";
      if ("." !== p) return hex({ k: "#1E1E26", e: "#FFFFFF", o: "#F29A2E", W: "#F7F7F2" }[p]);
      for (let t = 0; t < 2; t++) {
        const n = (t ? 6 : 2) + F;
        if ((s === n || s === n + 1) && e >= (c === t || l ? 12 : 13) && e <= (c === t ? 12 : 13))
          return hex("#F29A2E");
      }
      for (let t = 0; t < 7; t++) {
        const n = (7 * t + r) % 16;
        if (s === (((3 * t + 1) % 10) + (((n >> 2) + t) & 1)) % 10 && e === n)
          return hex("#FFFFFF");
      }
      return hex(e < 7 ? "#BFE6FF" : "#C8EAFF");
    }),
    (s.goldapple = (t, n, s) => {
      const [e, r] = px(t, n);
      if (0 === e || 9 === e || 0 === r || 15 === r) {
        const t =
          ((((0 === r ? e : 9 === e ? 9 + r : 15 === r ? 33 - e : 48 - r) - 48 * s) % 48) + 48) %
          48;
        return hex(t < 2 || t > 46 ? "#FFF6C8" : t < 4 || t > 44 ? "#FFD860" : "#C8901E");
      }
      const i = e - 1,
        F = r - 3,
        c = F >= 0 && F < o.length && i >= 0 && i < 8 ? o[F][i] : ".";
      if ("." !== c) {
        let t = hex(
          {
            b: "#6B3E12",
            g: "#4FB83A",
            G: "#2E7F28",
            W: "#FFFDF0",
            Y: "#FFE98A",
            y: "#F5C431",
            o: "#C98A12",
          }[c],
        );
        const n = Math.abs(e + r - (30 * s - 4));
        return (
          "WYyo".includes(c) && n < 1.5 && (t = mix(t, [255, 255, 240], n < 0.5 ? 0.7 : 0.35)),
          t
        );
      }
      const l = Math.hypot(e - 4.5, 0.9 * (r - 7)),
        h = Math.max(0, 1 - l / 5.5) * (0.35 + 0.25 * Math.sin(s * a));
      let m = mix(mix(hex("#6E1426"), hex("#3A0814"), r / 15), hex("#E07A28"), h);
      13 === r && (m = mix(m, hex("#C8901E"), e % 2 ? 0.5 : 0.25));
      const p = rndc(e, r, 21);
      return (
        p > 0.86 && (m = mix(m, hex("#FFE27A"), 0.9 * Math.max(0, Math.sin(s * a * 2 + 60 * p)))),
        m
      );
    }));
  const l = [
      ["#8A3A12", "#D8641E", "#FFB060"],
      ["#123A8A", "#2A6FE0", "#8FC4FF"],
      ["#4A167A", "#8A3FD0", "#DE9AFF"],
    ],
    smeltCol = (t, n) => {
      const o = (3 * t) % 3,
        a = Math.floor(o),
        s = o - a,
        e = s < 0.7 ? 0 : (s - 0.7) / 0.3,
        r = e * e * (3 - 2 * e);
      return mix(hex(l[a][n]), hex(l[(a + 1) % 3][n]), r);
    },
    seared = (t, n, o) => {
      const a = (t + (n % 2)) % 2 == 0 && "h" !== o,
        s = rndc(t, n, 31);
      return hex(
        a && s > 0.55 ? "#2A2624" : s > 0.8 ? "#57504B" : s > 0.35 ? "#45403C" : "#3A3532",
      );
    };
  s.smeltery = (t, n, o) => {
    const [s, e] = px(t, n);
    if (0 === s || 9 === s || 0 === e || 15 === e) {
      const t = seared(s, e),
        n = rndc(s, e, 77),
        r = Math.max(0, Math.sin(o * a * 3 + 40 * n)) ** 6 * (n > 0.7 ? 1 : 0);
      return r > 0.05 ? mix(t, hex("#FFC060"), r) : t;
    }
    if (e <= 2) return 2 === e ? mix(seared(s, e), smeltCol(o, 0), 0.35) : seared(s, e, "h");
    const r = smeltCol(o, 0),
      i = smeltCol(o, 1),
      F = smeltCol(o, 2);
    if (e >= 13) {
      const t = 0.5 + 0.5 * Math.sin(o * a * 2 + 0.9 * s);
      return 13 === e ? mix(i, F, 0.35 + 0.4 * t) : mix(r, i, 0.5 + 0.3 * t);
    }
    const c = 2 + Math.floor(3 * rndc(s, 1, 9)),
      l = (((e - 8 * o * c + 8 * rndc(s, 2, 9)) % 8) + 8) % 8;
    let h = l < 1 ? F : l < 3 ? mix(F, i, (l - 1) / 2) : l < 6 ? i : mix(i, r, (l - 6) / 2);
    return (l < 0.6 && c >= 4 && (h = mix(h, hex("#FFF4D8"), 0.6)), h);
  };
  const h = [
      { x: 3, y: 4, t0: 0, c: ["#FFFFFF", "#FFE27A", "#F0A030"] },
      { x: 6, y: 6, t0: 0.5, c: ["#FFFFFF", "#FF9AC8", "#C04888"] },
    ],
    m = [
      [9, 1, 3, "#5CE1FF", 0],
      [11, 2, 2, "#FFE066", 6],
      [12, 1, 4, "#FF6FA8", 9],
      [14, 2, 3, "#7CF29A", 3],
    ];
  s.fireworks = (t, n, o) => {
    const [s, e] = px(t, n);
    let r =
      e < 9
        ? ((t, n, o, s) => {
            const e = mix(hex("#060A24"), hex("#1E1446"), n / 15),
              r = rndc(t, n, s);
            return r > 0.88
              ? mix(
                  e,
                  hex(r > 0.96 ? "#FFE9A0" : "#FFFFFF"),
                  0.2 + 0.7 * Math.max(0, Math.sin(o * a * 3 + 80 * r)) ** 2,
                )
              : e;
          })(s, e, o, 41)
        : mix(hex("#060A24"), hex("#1E1446"), e / 15);
    15 === e && (r = mix(r, [0, 0, 0], 0.35));
    for (const [t, n, a, i, F] of m) {
      if (e !== t) continue;
      const c = (((s + 14 * o * n - F) % 14) + 14) % 14;
      c < a
        ? (r = mix(hex(i), [255, 255, 255], c < 1 ? 0.45 : 0))
        : c < a + 1 && (r = mix(r, hex(i), 0.3));
    }
    let i = 0,
      F = null;
    for (const t of h) {
      const n = ((((o - t.t0) % 1) + 1) % 1) * 2;
      if (n >= 1) continue;
      if (n < 0.25) {
        const o = Math.round(15 - (15 - t.y) * (n / 0.25));
        s === t.x && e === o
          ? ((i = 1), (F = hex("#FFF6C8")))
          : s === t.x &&
            e > o &&
            e <= o + 2 &&
            i < 0.6 / (e - o) &&
            ((i = 0.6 / (e - o)), (F = hex(t.c[2])));
        continue;
      }
      const c = (n - 0.25) / 0.75,
        l = Math.hypot(s - t.x, e - t.y);
      if (c < 0.1 && Math.abs(s - t.x) + Math.abs(e - t.y) <= 1) {
        ((i = 1), (F = hex("#FFFFFF")));
        continue;
      }
      const h = 3.8 * (1 - (1 - c) ** 2.2),
        m = 2.2 * c * c,
        p =
          c < 0.3
            ? mix(hex(t.c[0]), hex(t.c[1]), c / 0.3)
            : mix(hex(t.c[1]), hex(t.c[2]), (c - 0.3) / 0.7);
      for (let n = 0; n < 12; n++) {
        const r = (n / 12) * a + 1.3 * t.t0;
        let l = c < 0.55 ? 1 : 1 - (c - 0.55) / 0.45;
        c > 0.6 && (l *= 0.55 + 0.45 * Math.sin(o * a * 12 + 2.1 * n));
        for (const [n, o] of [
          [h, 1],
          [0.7 * h, 0.45],
        ]) {
          const a = Math.round(t.x + Math.cos(r) * n),
            c = Math.round(t.y + Math.sin(r) * n * 0.95 + m * (h > 0 ? n / h : 0));
          a === s && c === e && l * o > i && ((i = l * o), (F = p));
        }
      }
      !F && l < h + 0.5 && (r = mix(r, hex(t.c[1]), 0.14 * (1 - c)));
    }
    return F ? mix(r, F, i) : r;
  };
  const p = new Set(
      [
        [6, 2],
        [7, 2],
        [5, 3],
        [6, 3],
        [5, 4],
        [5, 5],
        [6, 5],
        [6, 6],
        [7, 6],
      ].map(([t, n]) => 100 * t + n),
    ),
    rnd2 = (t, n, o) => {
      const a = 43758.5453 * Math.sin(12.9898 * t + 78.233 * n + o);
      return a - Math.floor(a);
    },
    d = {
      potato: {
        top: [2, 1, 1, 0, 0, 0, 0, 0, 1, 2],
        bot: [19, 19, 19, 18, 17, 16, 15, 13, 11, 8],
        color(t, n, o, a) {
          if (a) return hex("#E8B830");
          if (Math.hypot((t - 2.5) / 1.6, (n - 6) / 2.4) < 1)
            return hex(
              2 === t && 6 === n
                ? "#6E4522"
                : t + n < 7
                  ? "#E8BB80"
                  : t >= 3 && n >= 7
                    ? "#A06A33"
                    : "#C8914F",
            );
          const s = Math.round(4 + 1.4 * t);
          return hex(
            n === s || (t > 3 && t < 8 && n === s + 3 - (t % 2))
              ? n === s
                ? "#7BC24F"
                : "#5E9E45"
              : (t + n) % 2
                ? "#3F7A3A"
                : "#356B32",
          );
        },
      },
      sakura: {
        top: [3, 2, 1, 1, 0, 0, 0, 0, 0, 1],
        bot: [19, 18, 19, 18, 17, 15, 16, 14, 12, 13],
        color(t, n, o, a) {
          const s = [
            [3, 6],
            [7, 5],
            [5, 10],
            [2, 13],
            [7, 12],
            [4, 16],
          ];
          for (const [o, a] of s) {
            const s = Math.abs(t - o) + Math.abs(n - a);
            if (0 === s) return hex("#E86A9A");
            if (1 === s) return hex("#FFFFFF");
          }
          return n === 2 + Math.round(0.45 * t) ||
            (t > 2 && t < 6 && n === 5 + Math.round(0.8 * (t - 3)))
            ? hex(t % 3 ? "#6A4434" : "#4A2E24")
            : a
              ? hex("#E86A9A")
              : mix(hex("#FCE4EE"), hex("#F3B4CC"), n / 19);
        },
      },
      starry: {
        top: [3, 2, 1, 0, 0, 0, 0, 0, 0, 0],
        bot: [19, 17, 19, 16, 18, 15, 16, 12, 13, 9],
        color(t, n, o, a) {
          if (p.has(100 * t + n)) return hex("#F5F1C8");
          if (a) return hex("#5468B8");
          const s = rnd2(t, n, 3);
          return s > 0.93
            ? hex(s > 0.97 ? "#FFE58A" : "#FFFFFF")
            : mix(hex("#0B1636"), hex("#2B3A7A"), Math.min(1, n / 16));
        },
      },
      ocean: {
        top: [3, 2, 1, 1, 0, 0, 0, 0, 0, 1],
        bot: [19, 19, 18, 18, 19, 17, 16, 16, 14, 12],
        color(t, n, o, a) {
          const s = this.bot[t];
          if (a && n >= s - 1) return hex("#EEF9FF");
          if (a) return hex("#0B3462");
          if ((n + Math.round(1.4 * Math.sin(0.9 * t))) % 6 == 3) return hex("#EEF9FF");
          const e = n / 19;
          return e < 0.45
            ? mix(hex("#8FDBF5"), hex("#2C7CC4"), e / 0.45)
            : mix(hex("#2C7CC4"), hex("#114780"), (e - 0.45) / 0.55);
        },
      },
      sunset: {
        top: [3, 2, 1, 1, 0, 0, 0, 0, 0, 1],
        bot: [19, 19, 19, 18, 18, 17, 16, 15, 13, 11],
        color(t, n, o, s) {
          const e = this.bot[t];
          if (n < 9) {
            const o = Math.hypot(t - 6.5, 1.1 * (n - 5.5));
            if (o < 2.3) return hex(o < 1.3 ? "#FFF6C8" : "#FFE27A");
            const a = mix(hex("#FF7A59"), hex("#FFD27A"), n / 8);
            return s
              ? mix(a, hex("#E0503A"), 0.5)
              : n < 3 && rnd2(t, n, 2) > 0.85
                ? mix(a, hex("#FFB8A0"), 0.6)
                : a;
          }
          const r = e - 2 + Math.round(0.8 * Math.sin(o * a + 0.6 * t));
          return n === r
            ? hex("#F5FBFF")
            : n > r
              ? hex(n === e ? "#E8C77E" : "#F2D79B")
              : Math.abs(t - 6.5) < 1.8 - 0.12 * (n - 9) && rnd2(t, n, Math.floor(16 * o)) > 0.45
                ? hex("#FFD27A")
                : hex(9 === n ? "#4AA3E0" : n < 12 ? "#2B7FD1" : "#1F64B0");
        },
      },
      lava: {
        top: [2, 1, 1, 0, 0, 0, 0, 0, 1, 2],
        hem: [17, 17, 16, 16, 15, 15, 14, 13, 12, 10],
        bot(t, n) {
          return (
            this.hem[t] +
            (t % 3 == 1 ? Math.round(2.5 * (0.5 + 0.5 * Math.sin(n * a + 1.7 * t))) : 0)
          );
        },
        color(t, n, o, a) {
          if (n > this.hem[t]) return hex(n === this.bot(t, o) ? "#FFE27A" : "#FF9A2A");
          if (n <= this.top[t] + 1) return hex(rnd2(t, n, 5) > 0.7 ? "#FF6A1A" : "#2E0A04");
          const e = s.lava(t / 9, n / 19, o);
          return a ? mix(e, hex("#2E0A04"), 0.5) : e;
        },
      },
      nebula: {
        top: [3, 2, 1, 0, 0, 0, 0, 0, 1, 2],
        bot: [19, 18, 19, 17, 18, 16, 17, 14, 15, 11],
        color(t, n, o, a) {
          const e = s.nebula(t / 9, n / 19, o);
          return a ? mix(e, hex("#F08AD8"), 0.45) : e;
        },
      },
      penguin: {
        top: [3, 2, 1, 1, 0, 0, 0, 0, 1, 2],
        bot: [19, 19, 19, 18, 18, 17, 16, 15, 13, 10],
        color(t, n, o, a) {
          if (a) return hex("#1E1E26");
          const s = this.bot[t];
          return n >= s - 2
            ? hex(n === s - 2 && t % 3 == 1 ? "#D6ECFA" : "#F4FAFF")
            : rnd2(t, this.fall ? (((n - Math.floor(16 * o)) % 16) + 16) % 16 : n, 13) > 0.9
              ? hex("#FFFFFF")
              : mix(hex("#BFE6FF"), hex("#A8D8F5"), n / 19);
        },
      },
    };
  ((d.penguinwalk = { ...d.penguin, fall: !0 }),
    (d.smeltery = {
      top: [2, 1, 0, 0, 0, 0, 0, 0, 1, 2],
      bot: [19, 19, 19, 18, 18, 17, 16, 15, 13, 10],
      color(t, n, o, a) {
        if (a || n <= this.top[t] + 1) return seared(t, n);
        const s = (((n - 8 * o * (2 + (t % 3)) + 1.7 * t) % 8) + 8) % 8;
        return s < 1
          ? smeltCol(o, 2)
          : s < 4
            ? smeltCol(o, 1)
            : mix(smeltCol(o, 1), smeltCol(o, 0), (s - 4) / 4);
      },
    }),
    (d.fireworks = {
      top: [2, 1, 0, 0, 0, 0, 0, 0, 1, 2],
      bot: [19, 19, 19, 18, 18, 17, 16, 15, 13, 10],
      color(t, n, o, s) {
        if (s) {
          const a = (((t + n - 30 * o) % 30) + 30) % 30;
          return hex(a < 1.5 ? "#FFF6C8" : a < 3 ? "#FFD860" : "#2E2468");
        }
        let e = mix(hex("#060A24"), hex("#1E1446"), n / 19);
        const r = rnd2(t, n, 41);
        r > 0.86 &&
          (e = mix(
            e,
            hex(r > 0.95 ? "#FFE9A0" : "#FFFFFF"),
            0.2 + 0.7 * Math.max(0, Math.sin(o * a * 3 + 80 * r)) ** 2,
          ));
        const i = n - Math.round(0.8 * t);
        if (n > 4 && i % 4 == 0) {
          const n = m[(((i / 4) % 4) + 4) % 4][3],
            a = (((t - 20 * o) % 10) + 10) % 10;
          e = mix(e, hex(n), a < 2 ? 0.9 : 0.25);
        }
        return e;
      },
    }),
    (d.goldapple = {
      top: [2, 1, 0, 0, 0, 0, 0, 0, 1, 2],
      bot: [19, 19, 19, 18, 18, 17, 16, 15, 13, 10],
      color(t, n, o, s) {
        if (s) {
          const a = Math.abs(t + n - 30 * o);
          return hex(a < 1.5 ? "#FFF6C8" : a < 3 ? "#FFD860" : "#C8901E");
        }
        let e = mix(hex("#6E1426"), hex("#3A0814"), n / 19);
        n > 4 && (n - Math.round(0.8 * t)) % 4 == 0 && (e = mix(e, hex("#C8901E"), 0.55));
        const r = rnd2(t, n, 21);
        return (
          r > 0.88 && (e = mix(e, hex("#FFE27A"), 0.9 * Math.max(0, Math.sin(o * a * 2 + 60 * r)))),
          e
        );
      },
    }));
  for (const t in c) {
    const n = c[t][1];
    d[t] = {
      top: [2, 1, 0, 0, 0, 0, 0, 0, 1, 2],
      bot: [19, 19, 19, 18, 19, 17, 18, 16, 17, 13],
      color(t, o, s, r) {
        if (r) {
          const a = Math.abs(t + o - 30 * s);
          return a < 1.5 ? hex(n.rimL) : a < 3 ? mix(hex(n.rim), hex(n.rimL), 0.5) : hex(n.rim);
        }
        const i = o >= 3 && o <= 6 && t >= 2 && t <= 7 ? e[o - 3][t - 2] : ".";
        if ("R" === i || "B" === i) return hex("R" === i ? n.j1 : n.j2);
        if ("#" === i) return hex(3 === o ? n.crL : n.cr);
        if (8 === t && 15 === o)
          return mix(hex(n.j1), [255, 255, 255], 0.6 * Math.max(0, Math.sin(s * a * 2)));
        let F = mix(hex(n.bg1), hex(n.bg2), o / 19);
        o > 7 && (o - Math.round(0.8 * t)) % 4 == 0 && (F = mix(F, hex(n.weave), 0.7));
        const c = rnd2(t, o, 11);
        return (
          c > 0.92 && (F = mix(F, hex(n.spark), 0.9 * Math.max(0, Math.sin(s * a * 3 + 60 * c)))),
          F
        );
      },
    };
  }
  const f = {
    admender: "#B040E0",
    admaurora: "#4AE0FF",
    admriver: "#E8B830",
    admgold: "#FFE27A",
    admvoid: "#6A5AE0",
  };
  for (const t in f)
    d[t] = {
      top: [2, 1, 0, 0, 0, 0, 0, 0, 1, 3],
      bot: [19, 19, 19, 18, 19, 17, 18, 15, 16, 12],
      color(n, o, a, e) {
        const r = s[t](n / 9, Math.min(1, o / 19), a);
        return e ? mix(r, hex(f[t]), 0.7) : r;
      },
    };
  function wingGrid(t, n) {
    const inside = (o, a) =>
        o >= 0 &&
        o < 10 &&
        a >= t.top[o] &&
        a <= ((o) => ("function" == typeof t.bot ? t.bot(o, n) : t.bot[o]))(o) &&
        a < 20,
      o = [];
    for (let a = 0; a < 20; a++)
      for (let s = 0; s < 10; s++) {
        if (!inside(s, a)) {
          o.push(null);
          continue;
        }
        const e = !(inside(s - 1, a) && inside(s + 1, a) && inside(s, a - 1) && inside(s, a + 1));
        o.push(t.color(s, a, n, e));
      }
    return o;
  }
  const u = [
      { id: "potato", name: "土豆", anim: !1 },
      { id: "sakura", name: "樱花", anim: !1 },
      { id: "starry", name: "星空", anim: !1 },
      { id: "ocean", name: "海浪", anim: !1 },
      { id: "sunset", name: "海边日落", anim: !0 },
      { id: "lava", name: "熔岩", anim: !0 },
      { id: "nebula", name: "星云", anim: !0 },
      ...Object.entries(c).map(([t, [n]]) => ({ id: t, name: "王冠·" + n, anim: !0, admin: !0 })),
      { id: "admender", name: "管理员·末影", anim: !0, admin: !0 },
      { id: "admaurora", name: "管理员·极光", anim: !0, admin: !0 },
      { id: "admriver", name: "管理员·红河", anim: !0, admin: !0 },
      { id: "admgold", name: "管理员·流金", anim: !0, admin: !0 },
      { id: "admvoid", name: "管理员·虚空", anim: !0, admin: !0 },
      { id: "penguin", name: "企鹅", anim: !1, ev: !0 },
      { id: "penguinwalk", name: "摇摆企鹅", anim: !0, ev: !0 },
      { id: "goldapple", name: "金苹果", anim: !0, ev: !0 },
      { id: "smeltery", name: "冶炼炉", anim: !0, ev: !0 },
      { id: "fireworks", name: "烟花夜空", anim: !0, ev: !0 },
    ],
    A = { smeltery: 48, fireworks: 48 };
  function paint(t, n, o, a) {
    const s = document.createElement("canvas");
    ((s.width = 64), (s.height = 32));
    const e = s.getContext("2d"),
      r = e.createImageData(64, 32),
      i = r.data,
      put = (t, n, o, a = 1) => {
        const s = 4 * (64 * n + t);
        ((i[s] = o[0] * a), (i[s + 1] = o[1] * a), (i[s + 2] = o[2] * a), (i[s + 3] = 255));
      },
      rect = (t, n, o, a, s) => {
        for (let e = 0; e < a; e++)
          for (let r = 0; r < o; r++) s(t + r, n + e, (r + 0.5) / o, (e + 0.5) / a);
      },
      F = n ? 0.15 : 0,
      c = 1 - F,
      rim = (n, o) => t(Math.min(c, Math.max(F, n)), Math.min(c, Math.max(F, o))),
      l = rim(0.5, 0.97);
    (rect(1, 1, 10, 16, (n, o, a, s) => put(n, o, t(a, s))),
      rect(12, 1, 10, 16, (n, o, a, s) => put(n, o, t(1 - a, s), 0.62)),
      rect(0, 1, 1, 16, (t, n, o, a) => put(t, n, rim(0, a), 0.8)),
      rect(11, 1, 1, 16, (t, n, o, a) => put(t, n, rim(1, a), 0.8)),
      rect(1, 0, 10, 1, (t, n, o) => put(t, n, rim(o, 0), 0.9)),
      rect(11, 0, 10, 1, (t, n, o) => put(t, n, l, 0.8)));
    const h = wingGrid(o, a),
      at = (t, n) => h[10 * n + t];
    for (let t = 0; t < 20; t++)
      for (let n = 0; n < 10; n++) {
        const o = at(n, t);
        o &&
          (put(45 - n, 2 + t, o),
          put(24 + n, 2 + t, o, 0.7),
          0 === n && (put(22, 2 + t, o, 0.8), put(23, 2 + t, o, 0.8)),
          9 === n && (put(34, 2 + t, o, 0.8), put(35, 2 + t, o, 0.8)));
      }
    for (let t = 0; t < 10; t++)
      (at(t, 0) && (put(24 + t, 0, at(t, 0), 0.9), put(24 + t, 1, at(t, 0), 0.9)),
        at(t, 19) && (put(34 + t, 0, at(t, 19), 0.8), put(34 + t, 1, at(t, 19), 0.8)));
    return (e.putImageData(r, 0, 0), s);
  }
  const b = new Map(),
    y = { aurora: "sunset" },
    norm = (t) => y[t] || t;
  function get(n) {
    n = norm(n);
    let o = b.get(n);
    if (o) return o;
    if (t[n])
      o = {
        frames: [
          paint(
            ((a = t[n]),
            (t, n) => {
              const o = a.rows[Math.min(15, Math.floor(16 * n))][Math.min(9, Math.floor(10 * t))];
              return hex(a.pal[o] || "#FF00FF");
            }),
            !1,
            d[n],
            0,
          ),
        ],
      };
    else {
      if (!s[n]) return null;
      {
        const t = A[n] || 16;
        o = {
          frames: Array.from({ length: t }, (o, a) =>
            paint((o, e) => s[n](o, e, a / t), !0, d[n], a / t),
          ),
        };
      }
    }
    var a;
    return (b.set(n, o), o);
  }
  const frameNow = (t) =>
    t.frames.length > 1 ? Math.floor((performance.now() / 1e3) * 8) % t.frames.length : 0;
  function texKey(t, n) {
    const o = get((n = norm(n)));
    if (!o) return null;
    const a = "cape_" + n,
      s = t.gl,
      e = frameNow(o);
    return (
      t.entityTex[a]
        ? o.shown !== e &&
          (s.bindTexture(s.TEXTURE_2D, t.entityTex[a]),
          s.texSubImage2D(s.TEXTURE_2D, 0, 0, 0, s.RGBA, s.UNSIGNED_BYTE, o.frames[e]),
          (o.shown = e))
        : ((t.entityTex[a] = t.tex2D(o.frames[e], !1)), (o.shown = e)),
      a
    );
  }
  function initModel(t) {
    if (t.models.cape) return;
    const n = [
      { name: "body", pivot: [0, 12, 0], boxes: [] },
      {
        name: "cape",
        parent: "body",
        pivot: [0, 12, 2],
        boxes: [[0, 0, -5, -16, -1, 10, 16, 1]],
        rotY: Math.PI,
      },
    ];
    for (const o of n) o.mesh = t.makeModelPart(o.boxes, 64, 32);
    t.models.cape = { parts: n };
  }
  function of(t, n) {
    let o = null;
    if (n === t.player) {
      const t =
        ("undefined" != typeof Skins && Skins.preview()) || (Account.data && Account.data.skin);
      ((o = t && t.cape), o && !unlocked(o) && (o = null));
    } else n.look && (o = n.look.cape);
    return o && get(o) ? norm(o) : null;
  }
  const info = (t) => u.find((n) => n.id === norm(t)),
    unlocked = (t) => {
      const n = info(t);
      return (
        !!n &&
        (n.ev
          ? ((t) =>
              !(
                !Account.loggedIn ||
                !(
                  "undefined" != typeof Cosmetics
                    ? Cosmetics.owned()
                    : (Account.data && Account.data.owned) || []
                ).includes("cape:" + t)
              ))(n.id)
          : n.admin
            ? !(!Account.data || !Account.data.super)
            : Account.has(n.anim || self.POTATO ? "anim" : "static"))
      );
    },
    shown = (t, n, o) => "undefined" == typeof Cosmetics || Cosmetics.shown(t, n, o);
  return {
    list: u,
    get: get,
    texKey: texKey,
    draw: function draw(t, n, o, a, s, e, r) {
      (shown(t, n, r) &&
        (function drawCape(t, n, o, a, s, e, r) {
          const i = of(t, n);
          if (!i) return;
          const F = t.renderer;
          initModel(F);
          const c = texKey(F, i);
          if (!c) return;
          const l = n.inv ? n.inv.slots[37] : (n.armorItems || [])[1];
          if (l && "elytra" === keyOfStack(l)) return;
          const h =
              r && r.still
                ? { rx: (-6 * Math.PI) / 180, rz: 0, ry: 0 }
                : (function swing(t, n, o, a, s) {
                    const e = performance.now(),
                      r = s || n.pos;
                    (!n.cloak || e - (n.cloakT || 0) > 1e3) &&
                      ((n.cloak = [r[0], r[1], r[2]]), (n.cloakT = e));
                    const i = Math.min(0.25, (e - n.cloakT) / 1e3);
                    n.cloakT = e;
                    const F = 1 - Math.pow(0.75, 20 * i);
                    for (let t = 0; t < 3; t++)
                      (Math.abs(r[t] - n.cloak[t]) > 10 && (n.cloak[t] = r[t]),
                        (n.cloak[t] += (r[t] - n.cloak[t]) * F));
                    let c = n.bodyYaw ?? n.yaw ?? 0;
                    if (n === t.player && t.playerBodyYaw) c = t.playerBodyYaw(o);
                    else if (void 0 !== n.prevBodyYaw) {
                      let t = c - n.prevBodyYaw;
                      for (; t > Math.PI;) t -= 2 * Math.PI;
                      for (; t < -Math.PI;) t += 2 * Math.PI;
                      c = n.prevBodyYaw + t * o;
                    }
                    const l = n.cloak[0] - r[0],
                      h = n.cloak[1] - r[1],
                      m = n.cloak[2] - r[2],
                      p = l * Math.sin(c) + m * Math.cos(c),
                      d = l * Math.cos(c) - m * Math.sin(c);
                    let f = clamp(10 * h, -6, 32);
                    const u = clamp(100 * p, 0, 150),
                      A = clamp(100 * d, -20, 20);
                    let b, y;
                    (void 0 !== n.bobAmt
                      ? ((b = 0.6 * lerp(n.prevBob || 0, n.bob || 0, o)),
                        (y = lerp(n.prevBobAmt || 0, n.bobAmt, o)))
                      : ((b = 0.15 * ((n.limbSwing || 0) - (n.limbAmt || 0) * (1 - o))),
                        (y = n.flying ? 0 : Math.min(0.1, (n.limbAmt || 0) / 4))),
                      (f += 32 * Math.sin(6 * b) * y),
                      a && (f += 25));
                    const M = Math.PI / 180;
                    return { rx: -(6 + u / 2 + f) * M, rz: (A / 2) * M, ry: (-A / 2) * M };
                  })(
                    t,
                    n,
                    r && null != r.a ? r.a : t.frameA || 1,
                    n.sneaking && !n.flying,
                    r && r.ip,
                  ),
            m = !(!l || !ITEMS[l.id].armor || "elytra" === ITEMS[l.id].armor.mat),
            p = {
              body: a && a.body ? a.body : void 0,
              cape: { rx: h.rx, rz: h.rz, ry: h.ry, t: m ? [0, 0, 1 / 16] : void 0 },
            },
            d = F.gl,
            f = d.isEnabled(d.CULL_FACE);
          (d.disable(d.CULL_FACE),
            F.drawModel("cape", c, o, p, s, e, r || {}),
            f && d.enable(d.CULL_FACE));
        })(t, n, o, a, s, e, r),
        "undefined" != typeof Cosmetics && Cosmetics.drawOn(t, n, o, a, s, e, r));
    },
    drawFlat: function drawFlat(t, n, o, a, s, e) {
      const r = get(n);
      if (!r) return;
      const i = frameNow(r);
      (t.drawImage(r.frames[i], 1, 1, 10, 16, o, a, 10 * s, 16 * s),
        e && ((t.fillStyle = "rgba(0,0,0,0.45)"), t.fillRect(o, a, 10 * s, 16 * s)));
    },
    of: of,
    info: info,
    unlocked: unlocked,
    shown: shown,
    initModel: initModel,
    initWings: function initWings(t) {
      if (t.models.cape_wings) return;
      const thin = (t) => {
          for (let n = 2; n < t.length; n += 8) t[n] = (1 + 0.25 * (16 * t[n] - 1)) / 16;
        },
        n = [
          { name: "lw", pivot: [-5, 24, 2], boxes: [[22, 0, 0, -20, 0, 10, 20, 2, 1]] },
          { name: "rw", pivot: [5, 24, 2], boxes: [[22, 0, -10, -20, 0, 10, 20, 2, 1, !0]] },
        ];
      for (const o of n) o.mesh = t.makeModelPart(o.boxes, 64, 32, thin);
      t.models.cape_wings = { parts: n };
    },
    fx: (t) => {
      const n = c[t];
      if (n) {
        const t = n[1];
        return [t.spark, t.rimL, t.j1, t.j2].map(hex);
      }
      const o = f[t];
      return o ? [hex(o), [255, 255, 255]] : null;
    },
  };
})();
(() => {
  const t = Game.prototype.drawMob;
  Game.prototype.drawMob = function (n, o, a, s, e) {
    if (
      (t.call(this, n, o, a, s, e),
      (n === this.player || "player" === n.type) &&
        !n.dead &&
        !(n.invisible || (n.hasEffect && n.hasEffect("invisibility"))) &&
        this.lastPlayerModel)
    )
      try {
        Capes.draw(
          this,
          n,
          this.lastPlayerModel.m,
          this.lastPlayerModel.poses,
          this.lastPlayerModel.lt,
          s,
          { ip: o, a: a },
        );
      } catch (t) {
        this.reportError("cape", t, !0);
      }
    this.lastPlayerModel = null;
  };
  const n = Game.prototype.drawWings;
  n &&
    (Game.prototype.drawWings = function (t, o, a, s, e, r) {
      const i = Capes.shown(this, t, r ? { inv: !0 } : null) ? Capes.of(this, t) : null,
        F = this.renderer;
      if (!i) return n.call(this, t, o, a, s, e, r);
      const c = Capes.texKey(F, i),
        l = F.beTex;
      (F.initEquipModels(), Capes.initWings(F));
      const h = F.models.eq_elytra,
        m = !(!Capes.info(i) || !Capes.info(i).admin),
        p = F.drawModel;
      (m &&
        ((o = new Float32Array(o)),
        M4.translate(o, 0, 1.5, 0.125),
        M4.scale(o, 1.3, 1.3, 1.3),
        M4.translate(o, 0, -1.5, -0.125),
        (F.drawModel = function (t, n, o, a, s, e, r) {
          return p.call(this, t, n, o, a, s, e, { ...(r || {}), bright: !0 });
        })),
        (F.beTex = (t) => ("elytra_wings" === t ? c : l.call(F, t))),
        (F.models.eq_elytra = F.models.cape_wings));
      try {
        n.call(this, t, o, a, s, e, r);
      } finally {
        ((F.beTex = l), (F.models.eq_elytra = h), (F.drawModel = p));
      }
    });
  const spark = (t, n, o, a, s, e, r, i, F) => {
    const c = t.particles.list,
      l = c.length;
    if ((t.particles.spawn(n, o, a, s, e, r, i, { col: F }), c.length > l)) {
      const t = c[c.length - 1];
      ((t.col = F),
        (t.bright = !0),
        "crit" === n && ((t.grav = 0), (t.life = 14 + 8 * Math.random())));
    }
  };
  function wingFx(t, n, o) {
    const a = n.bodyYaw ?? n.yaw ?? 0,
      s = [Math.sin(a), Math.cos(a)],
      e = [Math.cos(a), -Math.sin(a)],
      r = Math.random,
      i = n === t.player ? n.vel : n.netVel || [0, 0, 0],
      pick = () => o[(r() * o.length) | 0];
    if (n.gliding) {
      const a = n === t.player ? n.boostT > 0 : Math.hypot(i[0], i[1], i[2]) > 1.2;
      for (const F of [-1, 1]) {
        const c = 0.8 + 0.2 * r(),
          l = n.pos[0] + e[0] * F * 1.75 * c + 0.5 * s[0],
          h = n.pos[1] + 0.75 * c,
          m = n.pos[2] + e[1] * F * 1.75 * c + 0.5 * s[1];
        if (
          (spark(
            t,
            "crit",
            l,
            h,
            m,
            0.15 * -i[0] + 0.02 * (r() - 0.5),
            0.15 * -i[1] + 0.02 * (r() - 0.5),
            0.15 * -i[2] + 0.02 * (r() - 0.5),
            pick(),
          ),
          a)
        )
          for (let n = 0; n < 2; n++)
            spark(
              t,
              "effect",
              l,
              h,
              m,
              0.2 * (r() - 0.5),
              0.2 * (r() - 0.5),
              0.2 * (r() - 0.5),
              o[2 + ((r() * (o.length - 2)) | 0)] || pick(),
            );
      }
    } else if (t.tickCount % 7 == 0) {
      const o = r() < 0.5 ? -1 : 1,
        a = 0.6 + 0.8 * r();
      spark(
        t,
        "crit",
        n.pos[0] + e[0] * o * 0.45 + 0.35 * s[0],
        n.pos[1] + a,
        n.pos[2] + e[1] * o * 0.45 + 0.35 * s[1],
        0,
        0.01,
        0,
        pick(),
      );
    }
  }
  const o = Game.prototype.tick;
  Game.prototype.tick = function () {
    const t = o.apply(this, arguments);
    if (
      "play" !== this.state ||
      !this.world ||
      (this.ui.screen && this.ui.screen.pauses && !this.net)
    )
      return t;
    for (const t of [this.player, ...this.entities]) {
      if (!t || t.dead || (t !== this.player && "player" !== t.type)) continue;
      const n = Capes.shown(this, t) && Capes.of(this, t),
        o = n && Capes.info(n) && Capes.info(n).admin && Capes.fx(n);
      o &&
        "elytra" === keyOfStack(t.inv ? t.inv.slots[37] : (t.armorItems || [])[1]) &&
        wingFx(this, t, o);
    }
    return t;
  };
})();
//# sourceURL=js/capes.js
