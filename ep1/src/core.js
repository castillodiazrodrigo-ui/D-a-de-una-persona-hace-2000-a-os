// =====================================================================
//  NÚCLEO DE ILUSTRACIÓN 2.5D (Canvas 2D, sin motores 3D)
//  Los escenarios se DIBUJAN como ilustraciones planas con contorno,
//  usando una proyección en perspectiva sólo para colocar las formas.
//  Cada cara se rellena con color plano + sombreado dibujado + trazo.
// =====================================================================
export const W = 1080, H = 1920;
export const INK = '#1a1410';

// ---------- color ----------
export function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
export function rgb(a, al = 1) { return al >= 1 ? `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})` : `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`; }
export function mixc(a, b, k) { a = typeof a === 'string' ? hex(a) : a; b = typeof b === 'string' ? hex(b) : b; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
export function shadec(c, k) { c = typeof c === 'string' ? hex(c) : c; return k < 0 ? c.map(v => v * (1 + k)) : c.map(v => v + (255 - v) * k); }

// ---------- cámara / proyección ----------
export class View {
  constructor(cam) {
    this.set(cam);
  }
  set(cam) {
    this.cam = { x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0, roll: 0, f: 1.15, near: .15, ...cam };
    const c = this.cam; this.cy = Math.cos(c.yaw); this.sy = Math.sin(c.yaw); this.cp = Math.cos(c.pitch); this.sp = Math.sin(c.pitch);
    const vw = c.w || W, vh = c.h || H; this.F = c.f * vw; // distancia focal en px (f relativo al ancho)
    this.ox = vw / 2 + (c.shiftX || 0); this.oy = vh / 2 + (c.shiftY || 0);
  }
  // mundo -> cámara (x derecha, y arriba, z adelante)
  toCam(p) {
    const c = this.cam; let x = p[0] - c.x, y = p[1] - c.y, z = p[2] - c.z;
    let x1 = x * this.cy - z * this.sy, z1 = x * this.sy + z * this.cy;
    let y1 = y * this.cp - z1 * this.sp, z2 = y * this.sp + z1 * this.cp;
    return [x1, y1, z2];
  }
  proj(pc) { const s = this.F / pc[2]; let x = pc[0] * s, y = -pc[1] * s; if (this.cam.roll) { const r = this.cam.roll, c = Math.cos(r), sn = Math.sin(r); [x, y] = [x * c - y * sn, x * sn + y * c]; } return [this.ox + x, this.oy + y, pc[2]]; }
  P(p) { const c = this.toCam(p); if (c[2] < this.cam.near) return null; return this.proj(c); }
  // escala en px de 1 metro a la distancia del punto
  scaleAt(p) { const c = this.toCam(p); return c[2] > this.cam.near ? this.F / c[2] : 0; }
  // proyección de un polígono con recorte por el plano cercano
  poly(pts) {
    const n = this.cam.near; const cp = pts.map(p => this.toCam(p)); const out = [];
    for (let i = 0; i < cp.length; i++) {
      const a = cp[i], b = cp[(i + 1) % cp.length];
      const ain = a[2] >= n, bin = b[2] >= n;
      if (ain) out.push(a);
      if (ain !== bin) { const k = (n - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, n]); }
    }
    if (out.length < 3) return null;
    return out.map(p => this.proj(p));
  }
  depth(p) { return this.toCam(p)[2]; }
}

// ---------- cola de dibujo ordenada por profundidad (pintor) ----------
export class Queue {
  constructor() { this.items = []; }
  add(z, fn) { this.items.push({ z, fn }); }
  flush(ctx) { this.items.sort((a, b) => b.z - a.z); for (const it of this.items) it.fn(ctx); this.items = []; }
}

// ---------- primitivas ilustradas ----------
export function path(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
// cara plana: relleno + trazo, con niebla/oscuridad por profundidad
export function face(ctx, v, pts3, fill, o = {}) {
  const pp = v.poly(pts3); if (!pp) return null;
  path(ctx, pp);
  const d = pts3.reduce((s, p) => s + v.depth(p), 0) / pts3.length;
  const fog = o.fog ?? v.fog; let col = typeof fill === 'string' ? hex(fill) : fill;
  if (fog) col = mixc(col, fog.color, Math.min(fog.max ?? .85, Math.max(0, (d - fog.near) / (fog.far - fog.near))));
  if (o.grad) { const g = o.grad(ctx, pp, col); ctx.fillStyle = g; } else ctx.fillStyle = rgb(col, o.alpha ?? 1);
  ctx.fill();
  if (o.stroke !== false) { ctx.lineJoin = 'round'; ctx.lineWidth = o.lw ?? Math.max(1.5, Math.min(6, 260 / Math.max(d, .5) * .04)); ctx.strokeStyle = o.strokeCol || INK; ctx.globalAlpha = o.strokeAlpha ?? .9; ctx.stroke(); ctx.globalAlpha = 1; }
  return pp;
}
// caja con caras visibles (sombreado por orientación)
export function boxF(ctx, v, x0, y0, z0, x1, y1, z1, col, o = {}) {
  const c = typeof col === 'string' ? hex(col) : col;
  const P = (x, y, z) => [x, y, z];
  const faces = [
    { n: [0, 0, -1], p: [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], k: 0 },
    { n: [0, 0, 1], p: [P(x1, y0, z1), P(x0, y0, z1), P(x0, y1, z1), P(x1, y1, z1)], k: -.25 },
    { n: [-1, 0, 0], p: [P(x0, y0, z1), P(x0, y0, z0), P(x0, y1, z0), P(x0, y1, z1)], k: -.15 },
    { n: [1, 0, 0], p: [P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], k: -.3 },
    { n: [0, 1, 0], p: [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], k: .12 },
    { n: [0, -1, 0], p: [P(x0, y0, z1), P(x1, y0, z1), P(x1, y0, z0), P(x0, y0, z0)], k: -.4 },
  ];
  const cam = v.cam;
  for (const f of faces) {
    const cx = (f.p[0][0] + f.p[2][0]) / 2, cy = (f.p[0][1] + f.p[2][1]) / 2, cz = (f.p[0][2] + f.p[2][2]) / 2;
    const dot = (cam.x - cx) * f.n[0] + (cam.y - cy) * f.n[1] + (cam.z - cz) * f.n[2];
    if (dot <= 0) continue;
    face(ctx, v, f.p, shadec(c, f.k + (o.light || 0)), o);
  }
}
// texto pegado a un cuadrilátero vertical (aproximación afín)
export function quadText(ctx, v, p0, p1, p3, text, o = {}) {
  const a = v.P(p0), b = v.P(p1), d = v.P(p3); if (!a || !b || !d) return;
  const w = o.w || 1000, h = o.h || 200;
  ctx.save(); ctx.setTransform((b[0] - a[0]) / w, (b[1] - a[1]) / w, (d[0] - a[0]) / h, (d[1] - a[1]) / h, a[0], a[1]);
  ctx.font = o.font || `900 ${h * .62}px Mont`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 25; }
  if (o.stroke) { ctx.lineWidth = h * .08; ctx.strokeStyle = o.stroke; ctx.strokeText(text, w / 2, h * .54); }
  ctx.fillStyle = o.color || '#fff'; ctx.fillText(text, w / 2, h * .54);
  ctx.restore();
}
// mancha de luz / sombra en pantalla (para charcos de luz dibujados)
export function glow(ctx, x, y, r, color, a = 1, op = 'lighter', sy = 1) {
  ctx.save(); ctx.globalCompositeOperation = op; ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(1, sy);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore();
}
export function ellipseShadow(ctx, v, x, z, rx, a = .35, y = 0) {
  const c = v.P([x, y, z]); if (!c) return; const s = v.scaleAt([x, y, z]);
  const e = v.P([x, y, z + .3]); const sy = e ? Math.max(.12, Math.min(.6, Math.abs(c[1] - e[1]) / (s * .3))) : .3;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(c[0], c[1]); ctx.scale(1, sy);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * s); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx * s, 0, 7); ctx.fill(); ctx.restore();
}
// ruido determinista
export function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
