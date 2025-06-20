// Crédits : https://github.com/lokesh/color-thief

!(function (t, n) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = n())
    : "function" == typeof define && define.amd
    ? define(n)
    : ((t || self).ColorThief = n());
})(this, function () {
  var t = function (t, n) {
      return t < n ? -1 : t > n ? 1 : 0;
    },
    n = function (t) {
      return t.reduce(function (t, n) {
        return t + n;
      }, 0);
    },
    r = /*#__PURE__*/ (function () {
      function t(t) {
        this.colors = t;
      }
      var n = t.prototype;
      return (
        (n.palette = function () {
          return this.colors;
        }),
        (n.map = function (t) {
          return t;
        }),
        t
      );
    })(),
    o = (function () {
      function o(t, n, r) {
        return (t << 10) + (n << 5) + r;
      }
      function e(t) {
        var n = [],
          r = !1;
        function o() {
          n.sort(t), (r = !0);
        }
        return {
          push: function (t) {
            n.push(t), (r = !1);
          },
          peek: function (t) {
            return r || o(), void 0 === t && (t = n.length - 1), n[t];
          },
          pop: function () {
            return r || o(), n.pop();
          },
          size: function () {
            return n.length;
          },
          map: function (t) {
            return n.map(t);
          },
          debug: function () {
            return r || o(), n;
          },
        };
      }
      function i(t, n, r, o, e, i, u) {
        var a = this;
        (a.r1 = t),
          (a.r2 = n),
          (a.g1 = r),
          (a.g2 = o),
          (a.b1 = e),
          (a.b2 = i),
          (a.histo = u);
      }
      function u() {
        this.vboxes = new e(function (n, r) {
          return t(
            n.vbox.count() * n.vbox.volume(),
            r.vbox.count() * r.vbox.volume()
          );
        });
      }
      function a(t, n) {
        if (n.count()) {
          var r = n.r2 - n.r1 + 1,
            e = n.g2 - n.g1 + 1,
            i = Math.max.apply(null, [r, e, n.b2 - n.b1 + 1]);
          if (1 == n.count()) return [n.copy()];
          var u,
            a,
            c,
            f,
            s = 0,
            h = [],
            l = [];
          if (i == r)
            for (u = n.r1; u <= n.r2; u++) {
              for (f = 0, a = n.g1; a <= n.g2; a++)
                for (c = n.b1; c <= n.b2; c++) f += t[o(u, a, c)] || 0;
              h[u] = s += f;
            }
          else if (i == e)
            for (u = n.g1; u <= n.g2; u++) {
              for (f = 0, a = n.r1; a <= n.r2; a++)
                for (c = n.b1; c <= n.b2; c++) f += t[o(a, u, c)] || 0;
              h[u] = s += f;
            }
          else
            for (u = n.b1; u <= n.b2; u++) {
              for (f = 0, a = n.r1; a <= n.r2; a++)
                for (c = n.g1; c <= n.g2; c++) f += t[o(a, c, u)] || 0;
              h[u] = s += f;
            }
          return (
            h.forEach(function (t, n) {
              l[n] = s - t;
            }),
            (function (t) {
              var r,
                o,
                e,
                i,
                a,
                c = t + "1",
                f = t + "2",
                v = 0;
              for (u = n[c]; u <= n[f]; u++)
                if (h[u] > s / 2) {
                  for (
                    e = n.copy(),
                      i = n.copy(),
                      a =
                        (r = u - n[c]) <= (o = n[f] - u)
                          ? Math.min(n[f] - 1, ~~(u + o / 2))
                          : Math.max(n[c], ~~(u - 1 - r / 2));
                    !h[a];

                  )
                    a++;
                  for (v = l[a]; !v && h[a - 1]; ) v = l[--a];
                  return (e[f] = a), (i[c] = e[f] + 1), [e, i];
                }
            })(i == r ? "r" : i == e ? "g" : "b")
          );
        }
      }
      return (
        (i.prototype = {
          volume: function (t) {
            var n = this;
            return (
              (n._volume && !t) ||
                (n._volume =
                  (n.r2 - n.r1 + 1) * (n.g2 - n.g1 + 1) * (n.b2 - n.b1 + 1)),
              n._volume
            );
          },
          count: function (t) {
            var n = this,
              r = n.histo;
            if (!n._count_set || t) {
              var e,
                i,
                u,
                a = 0;
              for (e = n.r1; e <= n.r2; e++)
                for (i = n.g1; i <= n.g2; i++)
                  for (u = n.b1; u <= n.b2; u++) a += r[o(e, i, u)] || 0;
              (n._count = a), (n._count_set = !0);
            }
            return n._count;
          },
          copy: function () {
            var t = this;
            return new i(t.r1, t.r2, t.g1, t.g2, t.b1, t.b2, t.histo);
          },
          avg: function (t) {
            var n = this,
              r = n.histo;
            if (!n._avg || t) {
              var e,
                i,
                u,
                a,
                c = 0,
                f = 0,
                s = 0,
                h = 0;
              if (n.r1 === n.r2 && n.g1 === n.g2 && n.b1 === n.b2)
                n._avg = [n.r1 << 3, n.g1 << 3, n.b1 << 3];
              else {
                for (i = n.r1; i <= n.r2; i++)
                  for (u = n.g1; u <= n.g2; u++)
                    for (a = n.b1; a <= n.b2; a++)
                      (c += e = r[o(i, u, a)] || 0),
                        (f += e * (i + 0.5) * 8),
                        (s += e * (u + 0.5) * 8),
                        (h += e * (a + 0.5) * 8);
                n._avg = c
                  ? [~~(f / c), ~~(s / c), ~~(h / c)]
                  : [
                      ~~((8 * (n.r1 + n.r2 + 1)) / 2),
                      ~~((8 * (n.g1 + n.g2 + 1)) / 2),
                      ~~((8 * (n.b1 + n.b2 + 1)) / 2),
                    ];
              }
            }
            return n._avg;
          },
          contains: function (t) {
            var n = this,
              r = t[0] >> 3;
            return (
              (gval = t[1] >> 3),
              (bval = t[2] >> 3),
              r >= n.r1 &&
                r <= n.r2 &&
                gval >= n.g1 &&
                gval <= n.g2 &&
                bval >= n.b1 &&
                bval <= n.b2
            );
          },
        }),
        (u.prototype = {
          push: function (t) {
            this.vboxes.push({ vbox: t, color: t.avg() });
          },
          palette: function () {
            return this.vboxes.map(function (t) {
              return t.color;
            });
          },
          size: function () {
            return this.vboxes.size();
          },
          map: function (t) {
            for (var n = this.vboxes, r = 0; r < n.size(); r++)
              if (n.peek(r).vbox.contains(t)) return n.peek(r).color;
            return this.nearest(t);
          },
          nearest: function (t) {
            for (var n, r, o, e = this.vboxes, i = 0; i < e.size(); i++)
              ((r = Math.sqrt(
                Math.pow(t[0] - e.peek(i).color[0], 2) +
                  Math.pow(t[1] - e.peek(i).color[1], 2) +
                  Math.pow(t[2] - e.peek(i).color[2], 2)
              )) < n ||
                void 0 === n) &&
                ((n = r), (o = e.peek(i).color));
            return o;
          },
          forcebw: function () {
            var r = this.vboxes;
            r.sort(function (r, o) {
              return t(n(r.color), n(o.color));
            });
            var o = r[0].color;
            o[0] < 5 && o[1] < 5 && o[2] < 5 && (r[0].color = [0, 0, 0]);
            var e = r.length - 1,
              i = r[e].color;
            i[0] > 251 &&
              i[1] > 251 &&
              i[2] > 251 &&
              (r[e].color = [255, 255, 255]);
          },
        }),
        {
          quantize: function (n, c) {
            if (!Number.isInteger(c) || c < 1 || c > 256)
              throw new Error(
                "Invalid maximum color count. It must be an integer between 1 and 256."
              );
            if (!n.length || c < 2 || c > 256) return !1;
            if (!n.length || c < 2 || c > 256) return !1;
            for (var f = [], s = new Set(), h = 0; h < n.length; h++) {
              var l = n[h],
                v = l.join(",");
              s.has(v) || (s.add(v), f.push(l));
            }
            if (f.length <= c) return new r(f);
            var g = (function (t) {
              var n,
                r = new Array(32768);
              return (
                t.forEach(function (t) {
                  (n = o(t[0] >> 3, t[1] >> 3, t[2] >> 3)),
                    (r[n] = (r[n] || 0) + 1);
                }),
                r
              );
            })(n);
            g.forEach(function () {});
            var p = (function (t, n) {
                var r,
                  o,
                  e,
                  u = 1e6,
                  a = 0,
                  c = 1e6,
                  f = 0,
                  s = 1e6,
                  h = 0;
                return (
                  t.forEach(function (t) {
                    (r = t[0] >> 3) < u ? (u = r) : r > a && (a = r),
                      (o = t[1] >> 3) < c ? (c = o) : o > f && (f = o),
                      (e = t[2] >> 3) < s ? (s = e) : e > h && (h = e);
                  }),
                  new i(u, a, c, f, s, h, n)
                );
              })(n, g),
              b = new e(function (n, r) {
                return t(n.count(), r.count());
              });
            function d(t, n) {
              for (var r, o = t.size(), e = 0; e < 1e3; ) {
                if (o >= n) return;
                if (e++ > 1e3) return;
                if ((r = t.pop()).count()) {
                  var i = a(g, r),
                    u = i[0],
                    c = i[1];
                  if (!u) return;
                  t.push(u), c && (t.push(c), o++);
                } else t.push(r), e++;
              }
            }
            b.push(p), d(b, 0.75 * c);
            for (
              var m = new e(function (n, r) {
                return t(n.count() * n.volume(), r.count() * r.volume());
              });
              b.size();

            )
              m.push(b.pop());
            d(m, c);
            for (var w = new u(); m.size(); ) w.push(m.pop());
            return w;
          },
        }
      );
    })().quantize,
    e = function (t) {
      (this.canvas = document.createElement("canvas")),
        (this.context = this.canvas.getContext("2d")),
        (this.width = this.canvas.width = t.naturalWidth),
        (this.height = this.canvas.height = t.naturalHeight),
        this.context.drawImage(t, 0, 0, this.width, this.height);
    };
  e.prototype.getImageData = function () {
    return this.context.getImageData(0, 0, this.width, this.height);
  };
  var u = function () {};
  return (
    (u.prototype.getColor = function (t, n) {
      return void 0 === n && (n = 10), this.getPalette(t, 5, n)[0];
    }),
    (u.prototype.getPalette = function (t, n, r) {
      var i = (function (t) {
          var n = t.colorCount,
            r = t.quality;
          if (void 0 !== n && Number.isInteger(n)) {
            if (1 === n)
              throw new Error(
                "colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()"
              );
            (n = Math.max(n, 2)), (n = Math.min(n, 20));
          } else n = 10;
          return (
            (void 0 === r || !Number.isInteger(r) || r < 1) && (r = 10),
            { colorCount: n, quality: r }
          );
        })({ colorCount: n, quality: r }),
        u = new e(t),
        a = (function (t, n, r) {
          for (var o, e, i, u, a, c = t, f = [], s = 0; s < n; s += r)
            (e = c[0 + (o = 4 * s)]),
              (i = c[o + 1]),
              (u = c[o + 2]),
              (void 0 === (a = c[o + 3]) || a >= 125) &&
                ((e > 250 && i > 250 && u > 250) || f.push([e, i, u]));
          return f;
        })(u.getImageData().data, u.width * u.height, i.quality),
        c = o(a, i.colorCount);
      return c ? c.palette() : null;
    }),
    (u.prototype.getColorFromUrl = function (t, n, r) {
      var o = this,
        e = document.createElement("img");
      e.addEventListener("load", function () {
        var i = o.getPalette(e, 5, r);
        n(i[0], t);
      }),
        (e.src = t);
    }),
    (u.prototype.getImageData = function (t, n) {
      var r = new XMLHttpRequest();
      r.open("GET", t, !0),
        (r.responseType = "arraybuffer"),
        (r.onload = function () {
          if (200 == this.status) {
            var t = new Uint8Array(this.response);
            i = t.length;
            for (var r = new Array(i), o = 0; o < t.length; o++)
              r[o] = String.fromCharCode(t[o]);
            var e = r.join(""),
              u = window.btoa(e);
            n("data:image/png;base64," + u);
          }
        }),
        r.send();
    }),
    (u.prototype.getColorAsync = function (t, n, r) {
      var o = this;
      this.getImageData(t, function (t) {
        var e = document.createElement("img");
        e.addEventListener("load", function () {
          var t = o.getPalette(e, 5, r);
          n(t[0], this);
        }),
          (e.src = t);
      });
    }),
    u
  );
});
