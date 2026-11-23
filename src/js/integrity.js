"use strict";
const Integrity = (() => {
  const t = location.href
      .split("#")[0]
      .split("?")[0]
      .replace(/[^/]*$/, ""),
    e = new Set();
  try {
    for (const t of document.scripts) e.add(t);
    new MutationObserver((t) => {
      for (const n of t) for (const t of n.addedNodes) "SCRIPT" === t.tagName && e.add(t);
    }).observe(document.documentElement, { childList: !0, subtree: !0 });
  } catch (t) {}
  const sha = async (t) => {
      return (
        (e = await crypto.subtle.digest(
          "SHA-256",
          "string" == typeof t ? new TextEncoder().encode(t) : t,
        )),
        [...new Uint8Array(e)]
          .slice(0, 8)
          .map((t) => t.toString(16).padStart(2, "0"))
          .join("")
      );
      var e;
    },
    unToy = (t) =>
      t.replace(/<head><script>if\(window\.self===window\.top\)\{[^<]*\}<\/script>/, "<head>"),
    rel = (e) => {
      try {
        const n = new URL(e, t).href.split("#")[0].split("?")[0];
        return n.startsWith(t) ? n.slice(t.length) : null;
      } catch (t) {
        return null;
      }
    },
    n = new Map(),
    sumOf = (e) =>
      n.get(e) ||
      n
        .set(
          e,
          fetch(t + e, { cache: "force-cache" })
            .then((t) => (t.ok ? t.arrayBuffer() : null))
            .then((t) => (t ? sha(t) : null))
            .catch(() => null),
        )
        .get(e);
  let r = null;
  async function report() {
    const n = { b: "undefined" != typeof GAME_BUILD ? GAME_BUILD : "?", f: {}, x: [], i: [] };
    try {
      if (!self.crypto || !crypto.subtle) return ((n.no = "crypto"), n);
      r ||
        (r = fetch(t + "index.html", { cache: "force-cache" })
          .then((t) => t.text())
          .then(async (t) => ({ raw: t, sum: await sha(unToy(t)) }))
          .catch(() => null));
      const o = await r;
      o && (n.f["index.html"] = o.sum);
      const c = new Set();
      for (const t of e) {
        const e = t.getAttribute && t.getAttribute("src");
        if (e) {
          const r = rel(t.src || e);
          r ? c.add(r) : n.x.length < 20 && n.x.push(String(t.src || e).slice(0, 120));
          continue;
        }
        const r = (t.textContent || "").trim();
        r && (!o || !o.raw.includes(r)) && n.i.length < 20 && n.i.push(await sha(r));
      }
      try {
        for (const t of performance.getEntriesByType("resource"))
          if (/\.js$/.test(t.name.split("?")[0])) {
            const e = rel(t.name);
            e && c.add(e);
          }
      } catch (t) {}
      const s = [...c];
      for (let t = 0; t < s.length; t += 8) {
        (await Promise.all(s.slice(t, t + 8).map(sumOf))).forEach((e, r) => {
          e && (n.f[s[t + r]] = e);
        });
      }
    } catch (t) {
      n.no = "error";
    }
    return n;
  }
  return (
    "undefined" != typeof window &&
      window.addEventListener("load", () =>
        setTimeout(() => {
          try {
            report();
          } catch (t) {}
        }, 15e3),
      ),
    {
      report: report,
      reportWithin: (t) =>
        Promise.race([
          report(),
          new Promise((e) =>
            setTimeout(
              () =>
                e({
                  b: "undefined" != typeof GAME_BUILD ? GAME_BUILD : "?",
                  f: {},
                  x: [],
                  i: [],
                  no: "timeout",
                }),
              t,
            ),
          ),
        ]),
    }
  );
})();
//# sourceURL=js/integrity.js
