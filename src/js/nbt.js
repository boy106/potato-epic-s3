"use strict";
!(function (t) {
  const e = new TextDecoder("utf-8");
  class Longs {
    constructor(t) {
      ((this.u32 = t), (this.length = t.length >> 1));
    }
    hi(t) {
      return this.u32[2 * t];
    }
    lo(t) {
      return this.u32[2 * t + 1];
    }
  }
  class Tag {
    constructor(t, e) {
      ((this.t = t), (this.v = e));
    }
  }
  const tag = (t) => (e) => new Tag(t, e),
    tagOf = (t) =>
      t instanceof Tag
        ? t.t
        : "number" == typeof t
          ? Number.isInteger(t) && t >= -2147483648 && t <= 2147483647
            ? 3
            : 6
          : "boolean" == typeof t
            ? 1
            : "bigint" == typeof t
              ? 4
              : "string" == typeof t
                ? 8
                : Array.isArray(t)
                  ? 9
                  : t instanceof Int8Array || t instanceof Uint8Array
                    ? 7
                    : t instanceof Int32Array
                      ? 11
                      : t instanceof Longs
                        ? 12
                        : 10,
    n = new TextEncoder();
  const r = {
    parse: function parse(t) {
      const n = new DataView(t.buffer, t.byteOffset, t.byteLength);
      let r = 0;
      const str = () => {
          const s = n.getUint16(r);
          r += 2;
          const o = e.decode(t.subarray(r, r + s));
          return ((r += s), o);
        },
        read = (e) => {
          switch (e) {
            case 1:
              return n.getInt8(r++);
            case 2: {
              const t = n.getInt16(r);
              return ((r += 2), t);
            }
            case 3: {
              const t = n.getInt32(r);
              return ((r += 4), t);
            }
            case 4: {
              const t = n.getBigInt64(r);
              return ((r += 8), t);
            }
            case 5: {
              const t = n.getFloat32(r);
              return ((r += 4), t);
            }
            case 6: {
              const t = n.getFloat64(r);
              return ((r += 8), t);
            }
            case 7: {
              const e = n.getInt32(r);
              r += 4;
              const s = new Int8Array(t.buffer.slice(t.byteOffset + r, t.byteOffset + r + e));
              return ((r += e), s);
            }
            case 8:
              return str();
            case 9: {
              const t = n.getUint8(r++),
                e = n.getInt32(r);
              r += 4;
              const s = new Array(Math.max(0, e));
              for (let n = 0; n < e; n++) s[n] = read(t);
              return s;
            }
            case 10: {
              const t = {};
              for (;;) {
                const e = n.getUint8(r++);
                if (0 === e) break;
                t[str()] = read(e);
              }
              return t;
            }
            case 11: {
              const t = n.getInt32(r);
              r += 4;
              const e = new Int32Array(t);
              for (let s = 0; s < t; s++, r += 4) e[s] = n.getInt32(r);
              return e;
            }
            case 12: {
              const t = n.getInt32(r);
              r += 4;
              const e = new Uint32Array(2 * t);
              for (let s = 0; s < 2 * t; s++, r += 4) e[s] = n.getUint32(r);
              return new Longs(e);
            }
          }
          throw new Error("NBT: unknown tag " + e + " at " + r);
        };
      if (10 !== n.getUint8(r++)) throw new Error("NBT: root is not a compound");
      return (str(), read(10));
    },
    inflate: async function inflate(t, e) {
      const n = new Blob([t]).stream().pipeThrough(new DecompressionStream(e));
      return new Uint8Array(await new Response(n).arrayBuffer());
    },
    Longs: Longs,
    write: function write(t) {
      let e = new Uint8Array(65536),
        r = new DataView(e.buffer),
        s = 0;
      const room = (t) => {
          if (s + t <= e.length) return;
          let n = 2 * e.length;
          for (; n < s + t;) n *= 2;
          const o = new Uint8Array(n);
          (o.set(e), (e = o), (r = new DataView(e.buffer)));
        },
        str = (t) => {
          const o = n.encode(t);
          (room(2 + o.length), r.setUint16(s, o.length), (s += 2), e.set(o, s), (s += o.length));
        },
        put = (t, n) => {
          switch ((n instanceof Tag && (n = n.v), t)) {
            case 1:
              return (room(1), void r.setInt8(s++, "boolean" == typeof n ? +n : n));
            case 2:
              return (room(2), r.setInt16(s, n), void (s += 2));
            case 3:
              return (room(4), r.setInt32(s, n), void (s += 4));
            case 4:
              return (room(8), r.setBigInt64(s, BigInt.asIntN(64, BigInt(n))), void (s += 8));
            case 5:
              return (room(4), r.setFloat32(s, n), void (s += 4));
            case 6:
              return (room(8), r.setFloat64(s, n), void (s += 8));
            case 7:
              return (
                room(4 + n.length),
                r.setInt32(s, n.length),
                (s += 4),
                e.set(new Uint8Array(n.buffer, n.byteOffset, n.length), s),
                void (s += n.length)
              );
            case 8:
              return void str(n);
            case 9: {
              const t = n.length ? tagOf(n[0]) : 0;
              (room(5), r.setUint8(s++, t), r.setInt32(s, n.length), (s += 4));
              for (const e of n) put(t, e);
              return;
            }
            case 10:
              for (const t in n) {
                const e = n[t];
                if (null == e) continue;
                const o = tagOf(e);
                (room(1), r.setUint8(s++, o), str(t), put(o, e));
              }
              return (room(1), void r.setUint8(s++, 0));
            case 11:
              (room(4 + 4 * n.length), r.setInt32(s, n.length), (s += 4));
              for (let t = 0; t < n.length; t++, s += 4) r.setInt32(s, n[t]);
              return;
            case 12:
              (room(4 + 4 * n.u32.length), r.setInt32(s, n.length), (s += 4));
              for (let t = 0; t < n.u32.length; t++, s += 4) r.setUint32(s, n.u32[t]);
              return;
          }
          throw new Error("NBT: cannot write tag " + t);
        };
      return (room(3), r.setUint8(s++, 10), str(""), put(10, t), e.slice(0, s));
    },
    deflate: async function deflate(t, e) {
      const n = new Blob([t]).stream().pipeThrough(new CompressionStream(e));
      return new Uint8Array(await new Response(n).arrayBuffer());
    },
    Tag: Tag,
    byte: tag(1),
    short: tag(2),
    int: tag(3),
    long: tag(4),
    float: tag(5),
    double: tag(6),
  };
  "undefined" != typeof module && module.exports ? (module.exports = r) : (t.NBT = r);
})("undefined" != typeof self ? self : globalThis);
//# sourceURL=js/nbt.js
