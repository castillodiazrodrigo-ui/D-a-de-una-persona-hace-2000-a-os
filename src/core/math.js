// Utilidades matemáticas deterministas (todo depende sólo del tiempo t).
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const smooth = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
export const smoother = (k) => { k = clamp(k); return k * k * k * (k * (k * 6 - 15) + 10); };
export const easeOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
export const easeIn = (k) => Math.pow(clamp(k), 3);
export const easeInOut = (k) => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const backOut = (k) => { k = clamp(k); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
export const elastic = (k) => { k = clamp(k); return k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - .75) * (2 * Math.PI / 3)) + 1; };
// ventana suave: 0 fuera, 1 dentro, rampas de duración r
export const win = (t, a, b, r = .25) => smooth(inv(a, a + r, t)) * (1 - smooth(inv(b - r, b, t)));
export const pulse = (t, at, d = .3) => { const k = (t - at) / d; return k < 0 || k > 1 ? 0 : Math.sin(k * Math.PI); };

// ruido 1D suave y determinista
function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }
export function noise1(x) { const i = Math.floor(x), f = x - i; const u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }
export function fbm(x) { return noise1(x) * .6 + noise1(x * 2.13 + 7) * .3 + noise1(x * 4.7 + 3) * .1; }
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }

// Interpolación de keyframes [{t, v:number|array}, ...] con easing por segmento
export function keys(t, ks, ease = easeInOut) {
  if (t <= ks[0].t) return ks[0].v;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (t <= b.t) {
      const e = (b.ease || ease)(inv(a.t, b.t, t));
      if (Array.isArray(a.v)) return a.v.map((x, j) => lerp(x, b.v[j], e));
      return lerp(a.v, b.v, e);
    }
  }
  return ks[ks.length - 1].v;
}
