// =====================================================================
//  ESCENARIOS ILUSTRADOS DEL SHOPPING (piezas reutilizables)
//  Todas las formas son planos de color con contorno de tinta; la
//  perspectiva sólo coloca las formas. Iluminación = capas dibujadas.
// =====================================================================
import { W, H, INK, View, Queue, face, boxF, quadText, glow, ellipseShadow, path, hex, rgb, mixc, shadec, hash } from './core.js';
import { drawChar, ROSTER, R_M } from './char.js';

// ---------- paletas por estado de iluminación ----------
export const LOOK = {
  night: { sky: ['#0b1430', '#22325c'], floor: '#6a7088', tile: '#565c74', wall: '#7a6f8e', fog: { color: '#141a33', near: 4, far: 60, max: .85 }, amb: 'rgba(40,60,120,.35)', glass: '#2a3a66', ceil: '#2b2f45' },
  emergency: { sky: ['#05070f', '#111526'], floor: '#4c4f5c', tile: '#3c3f4b', wall: '#4a4458', fog: { color: '#07080f', near: 4, far: 45, max: .9 }, amb: 'rgba(10,20,40,.55)', glass: '#151b2e', ceil: '#15161f' },
};
const STORES = [
  { name: 'MODA 21', col: '#d64f6a' }, { name: 'TECNOMAX', col: '#3f7fd8' }, { name: 'ZAPAS', col: '#f08a2b' }, { name: 'DULCE', col: '#e05fa8' },
  { name: 'LIBROS', col: '#4aa36b' }, { name: 'JUGUETES', col: '#e8b62f', toy: true }, { name: 'PERFUMES', col: '#9a6ad8' }, { name: 'DEPORTES', col: '#2fb3b0' },
  { name: 'ÓPTICA', col: '#c4473a' }, { name: 'CAFÉ', col: '#8b5a3a' }, { name: 'GAMER', col: '#5a4ad6' }, { name: 'HOGAR', col: '#6aa0a8' },
];

// ---------- personaje colocado en el mundo ----------
let _layer = null;
export function putChar(q, v, D, pose, x, z, t, o = {}) {
  const y = o.y || 0; const d = v.depth([x, y, z]); if (d < v.cam.near + .2) return;
  q.add(d - (o.front || 0), ctx => {
    const p = v.P([x, y, z]); if (!p) return; const s = v.scaleAt([x, y, z]) * R_M * (o.scale || 1);
    if (o.shadow !== false) ellipseShadow(ctx, v, x, z, .45 * (o.scale || 1), o.shadowA ?? .4, y);
    if (!o.tint) { drawChar(ctx, D, pose, p[0], p[1], s, t); return; }
    // personaje en su propia capa para teñirlo con la luz del lugar
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    if (!_layer || _layer.width !== cw || _layer.height !== ch) { _layer = document.createElement('canvas'); _layer.width = cw; _layer.height = ch; }
    const lc = _layer.getContext('2d'); lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, cw, ch);
    drawChar(lc, D, pose, p[0], p[1], s, t);
    lc.globalCompositeOperation = 'source-atop'; lc.fillStyle = o.tint; lc.fillRect(0, 0, cw, ch);
    if (o.rim) { const g = lc.createLinearGradient(p[0] - s * 2, 0, p[0] + s * 2, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, o.rim); lc.fillStyle = g; lc.fillRect(0, 0, cw, ch); }
    lc.globalCompositeOperation = 'source-over';
    ctx.drawImage(_layer, 0, 0);
  });
}

// ---------- pasillo principal de dos niveles ----------
export function corridor(q, v, t, S = {}) {
  const L = LOOK[S.look || 'night']; v.fog = L.fog;
  const X = 6, Z0 = S.z0 ?? -12, Z1 = S.z1 ?? 90, Hc = 10.5;
  // suelo brillante (al fondo de la cola)
  q.add(1e9, ctx => {
    face(ctx, v, [[-X, 0, Z0], [X, 0, Z0], [X, 0, Z1], [-X, 0, Z1]], L.floor, { stroke: false });
    ctx.save(); ctx.lineWidth = 1.6; ctx.strokeStyle = rgb(hex(L.tile), .9);
    for (let z = Math.ceil(Z0 / 2) * 2; z <= Z1; z += 2) { const a = v.P([-X, 0, z]), b = v.P([X, 0, z]); if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } }
    for (let x = -X; x <= X; x += 2) { const pp = v.poly([[x, 0, Z0], [x + .02, 0, Z0], [x + .02, 0, Z1], [x, 0, Z1]]); if (pp && pp.length > 2) { const e = pp[pp.length - 1]; ctx.beginPath(); ctx.moveTo(pp[0][0], pp[0][1]); ctx.lineTo(e[0], e[1]); ctx.stroke(); } }
    // reflejos de luz en el piso pulido
    for (let z = Z0 + 10; z < Z1; z += 22) { const c = v.P([0, 0, z + 1.5]); if (c) glow(ctx, c[0], c[1], v.scaleAt([0, 0, z]) * 2.5, S.look === 'emergency' ? 'rgba(40,255,120,.35)' : 'rgba(60,220,130,.25)', 1, 'lighter', .35); }
    for (let z = Z0 + 4; z < Z1; z += 6) { const c = v.P([0, 0, z]); if (c && S.look !== 'emergency') glow(ctx, c[0], c[1], v.scaleAt([0, 0, z]) * 3.2, 'rgba(120,150,255,.16)', 1, 'lighter', .3); }
    // camino central de piedra oscura
    face(ctx, v, [[-1.6, .001, Z0], [1.6, .001, Z0], [1.6, .001, Z1], [-1.6, .001, Z1]], shadec(L.floor, -.15), { stroke: false, alpha: .6 });
    ctx.restore();
  });
  // techo con lucernario (cielo nocturno)
  q.add(9e8, ctx => {
    face(ctx, v, [[-X, Hc, Z0], [X, Hc, Z0], [X, Hc, Z1], [-X, Hc, Z1]], L.ceil, { stroke: false });
    const sk = v.poly([[-3, Hc - .01, Z0], [3, Hc - .01, Z0], [3, Hc - .01, Z1], [-3, Hc - .01, Z1]]);
    if (sk) { path(ctx, sk); const g = ctx.createLinearGradient(0, 0, 0, H * .5); g.addColorStop(0, L.sky[0]); g.addColorStop(1, L.sky[1]); ctx.fillStyle = g; ctx.fill(); ctx.save(); ctx.clip();
      for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(255,255,255,${.3 + hash(i) * .6})`; ctx.fillRect(hash(i * 3) * W, hash(i * 7) * H * .5, 2.5, 2.5); }
      ctx.restore(); }
    ctx.strokeStyle = '#0d0f18'; ctx.lineWidth = 5;
    for (let z = Z0; z <= Z1; z += 3) { const a = v.P([-3, Hc, z]), b = v.P([3, Hc, z]); if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } }
  });
  // locales en ambos lados, dos niveles
  const shut = S.shutters ?? 1;
  for (const side of [-1, 1]) for (let i = 0; i * 7 + Z0 < Z1; i++) {
    const z0 = Z0 + i * 7, z1 = z0 + 7; const st = STORES[(i * 2 + (side > 0 ? 1 : 0)) % STORES.length];
    if (S.toyAt !== undefined && side === S.toySide && i === S.toyAt) storeFront(q, v, side, z0, z1, 0, STORES[5], { shutter: shut, toy: true, t, glowToy: S.toyGlow || 0 }, L);
    else storeFront(q, v, side, z0, z1, 0, st, { shutter: shut * (hash(i + side * 9) < .85 ? 1 : .6), t }, L);
    storeFront(q, v, side, z0, z1, 1, STORES[(i * 2 + 5 + (side > 0 ? 3 : 0)) % STORES.length], { shutter: 1, t }, L);
  }
  // pasarela del primer piso + baranda de vidrio
  for (const side of [-1, 1]) {
    const xi = side * 3.6;
    q.add(v.depth([side * 4.8, 4.4, (Z0 + Z1) / 2]) + 40, ctx => {
      face(ctx, v, [[xi, 4.2, Z0], [side * X, 4.2, Z0], [side * X, 4.2, Z1], [xi, 4.2, Z1]], '#cfc8d8', { lw: 3 });
      face(ctx, v, [[xi, 4.2, Z0], [xi, 4.75, Z0], [xi, 4.75, Z1], [xi, 4.2, Z1]], '#e8e2ee', { lw: 3 });
      face(ctx, v, [[xi, 4.75, Z0], [xi, 5.75, Z0], [xi, 5.75, Z1], [xi, 4.75, Z1]], '#9fd2e8', { alpha: .18, lw: 2 });
      const a = v.P([xi, 5.75, Z0]), b = v.P([xi, 5.75, Z1]);
      const pp = v.poly([[xi, 5.75, Z0], [xi, 5.8, Z0], [xi, 5.8, Z1], [xi, 5.75, Z1]]); if (pp) { path(ctx, pp); ctx.lineWidth = 6; ctx.strokeStyle = '#2b2b33'; ctx.stroke(); }
    });
    // columnas
    for (let z = Z0 + 3.5; z < Z1; z += 14) if (!(S.noProps && S.noProps(z))) q.add(v.depth([xi, 2, z]), ctx => boxF(ctx, v, xi - .3 * side - .25, 0, z - .25, xi - .3 * side + .25, 4.2, z + .25, '#8f8aa3'));
  }
  // lámparas colgantes del techo (encendidas/apagadas por z)
  for (let z = Z0 + 4; z < Z1; z += 8) for (const x of [-3.2, 3.2]) {
    const k = S.lamp ? S.lamp(z) : 0;
    q.add(v.depth([x, 9, z]) - .2, ctx => {
      const a = v.P([x, 10.5, z]), b = v.P([x, 9.2, z]); if (!a || !b) return; const sc = v.scaleAt([x, 9, z]);
      ctx.lineWidth = Math.max(1.5, sc * .03); ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(b[0], b[1], sc * .55, sc * .22, 0, Math.PI, 0); ctx.fillStyle = k > .05 ? '#fff3c8' : '#3a3d4c'; ctx.fill(); ctx.stroke();
      if (k > .02) { glow(ctx, b[0], b[1] + sc * .2, sc * 3, 'rgba(255,230,170,.75)', k); const f = v.P([x, 0, z]); if (f) glow(ctx, f[0], f[1], sc * 4, 'rgba(255,225,160,.5)', k, 'lighter', .3); }
    });
  }
  // carteles de salida de emergencia (verde)
  for (let z = Z0 + 10; z < Z1; z += 22) {
    q.add(v.depth([0, 4, z]) - .1, ctx => {
      face(ctx, v, [[-.9, 3.6, z], [.9, 3.6, z], [.9, 4.25, z], [-.9, 4.25, z]], '#1db954', { lw: 2.5 });
      quadText(ctx, v, [-.9, 4.25, z], [.9, 4.25, z], [-.9, 3.6, z], 'SALIDA', { color: '#eafff0', w: 900, h: 320 });
      ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = '#1a1410'; const a = v.P([0, 4.25, z]), b = v.P([0, 5.2, z]); if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } ctx.restore();
      const c = v.P([0, 3.9, z]); if (c) glow(ctx, c[0], c[1], v.scaleAt([0, 3.9, z]) * 2.2, 'rgba(40,255,120,.55)', S.look === 'emergency' ? 1 : .5);
    });
  }
  // maceteros con plantas y bancos en el centro
  for (let z = Z0 + 26; z < Z1; z += 16) {
    if (S.noProps && S.noProps(z)) continue;
    q.add(v.depth([0, .5, z]), ctx => { boxF(ctx, v, -.6, 0, z - .6, .6, .55, z + .6, '#b9a68f');
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; const pc = [Math.cos(a) * .35, .9 + hash(k + z) * .5, z + Math.sin(a) * .35]; const pr = v.P(pc); if (!pr) continue; const s = v.scaleAt(pc);
        ctx.beginPath(); ctx.ellipse(pr[0], pr[1], s * .45, s * .3, a, 0, 7); ctx.fillStyle = rgb(mixc('#3f7a43', L.fog.color, .25)); ctx.fill(); ctx.lineWidth = Math.max(1.5, s * .03); ctx.strokeStyle = INK; ctx.stroke(); } });
    q.add(v.depth([2.3, .3, z + 3]), ctx => { boxF(ctx, v, 2.0, .38, z + 2.2, 2.6, .48, z + 3.8, '#8a6440'); boxF(ctx, v, 2.05, 0, z + 2.3, 2.15, .38, z + 2.4, '#2a2a30'); boxF(ctx, v, 2.45, 0, z + 3.6, 2.55, .38, z + 3.7, '#2a2a30'); });
  }
}

// ---------- fachada de un local ----------
export function storeFront(q, v, side, z0, z1, level, st, o, L) {
  const x = side * 6, yb = level ? 5.0 : 0, h = 3.6;
  const zc = (z0 + z1) / 2; const d = v.depth([x, yb + 2, zc]) + 3;
  q.add(d, ctx => {
    const P = (z, y) => [x, y, z];
    // interior oscuro / vidriera
    face(ctx, v, [P(z0, yb), P(z1, yb), P(z1, yb + h), P(z0, yb + h)], L.glass, { lw: 2 });
    if (o.toy && o.glowToy) { const c = v.P([x, yb + 1.4, zc]); if (c) glow(ctx, c[0], c[1], v.scaleAt([x, 1, zc]) * 2.6, 'rgba(255,180,80,.9)', o.glowToy); }
    // persiana metálica (baja = 1)
    const k = o.shutter ?? 1;
    if (k > 0) {
      const top = yb + h, bot = top - h * k;
      face(ctx, v, [P(z0 + .2, bot), P(z1 - .2, bot), P(z1 - .2, top), P(z0 + .2, top)], o.toy ? '#a6a9b2' : '#9a9eaa', { lw: 2 });
      ctx.save(); ctx.lineWidth = 1.3; ctx.strokeStyle = 'rgba(30,30,40,.55)';
      for (let y = bot + .18; y < top; y += .22) { const a = v.P(P(z0 + .2, y)), b = v.P(P(z1 - .2, y)); if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } }
      if (o.toy && o.glowToy) { // luz que se filtra entre las láminas
        ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 2.2; ctx.strokeStyle = `rgba(255,190,90,${.7 * o.glowToy})`;
        for (let y = bot + .29; y < top - .3; y += .22) { const a = v.P(P(zc - 1.6, y)), b = v.P(P(zc + 1.6, y)); if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } }
      }
      ctx.restore();
      // candado
      const lc = v.P(P(zc, bot + .1)); if (lc && k > .9) { const s = v.scaleAt(P(zc, bot)); ctx.beginPath(); ctx.roundRect(lc[0] - s * .09, lc[1] - s * .12, s * .18, s * .16, s * .02); ctx.fillStyle = '#c9a23a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }
    }
    // marco y cartel
    face(ctx, v, [P(z0, yb + h), P(z1, yb + h), P(z1, yb + h + .65), P(z0, yb + h + .65)], st.col, { lw: 2.5 });
    const za = side > 0 ? z1 - .4 : z0 + .4, zb = side > 0 ? z0 + .4 : z1 - .4;
    quadText(ctx, v, P(za, yb + h + .65), P(zb, yb + h + .65), P(za, yb + h), st.name, { color: '#fff8e8', w: 1000, h: 170, stroke: 'rgba(0,0,0,.5)' });
    face(ctx, v, [P(z0, yb), P(z0 + .2, yb), P(z0 + .2, yb + h + .65), P(z0, yb + h + .65)], '#d9d3e2', { lw: 2 });
  });
}

// ---------- entrada de vidrio con puertas encadenadas ----------
export function entrance(q, v, t, S = {}) {
  const z = S.z ?? -12, L = LOOK[S.look || 'night'];
  q.add(v.depth([0, 2, z]) + 5, ctx => {
    // exterior a través del vidrio: estacionamiento nocturno
    const pp = v.poly([[-6, 0, z], [6, 0, z], [6, 7, z], [-6, 7, z]]); if (!pp) return;
    ctx.save(); path(ctx, pp); ctx.clip();
    const g = ctx.createLinearGradient(0, pp[2][1], 0, pp[0][1]); g.addColorStop(0, '#0a1230'); g.addColorStop(.6, '#1e2a55'); g.addColorStop(1, '#2b2a3a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 5; i++) { const lp = v.P([-8 + i * 4, 4.5, z - 14]); if (lp) { const s = v.scaleAt([-8 + i * 4, 4.5, z - 14]); ctx.fillStyle = '#20222c'; ctx.fillRect(lp[0] - s * .05, lp[1], s * .1, s * 4.5); glow(ctx, lp[0], lp[1], s * 2.5, 'rgba(255,200,120,.7)', .8); } }
    ctx.restore();
    face(ctx, v, [[-6, 0, z], [6, 0, z], [6, 7, z], [-6, 7, z]], '#9fd2e8', { alpha: .14, lw: 3 });
    for (const x of [-6, -3, 0, 3, 6]) boxF(ctx, v, x - .12, 0, z - .1, x + .12, 7, z + .1, '#3a3d4a');
    boxF(ctx, v, -6, 3.1, z - .12, 6, 3.3, z + .12, '#3a3d4a');
    // manijas y cadena con candado
    for (const x of [-.25, .25]) boxF(ctx, v, x - .04, .9, z + .1, x + .04, 2.0, z + .18, '#c8ccd4');
    const c1 = v.P([-.35, 1.45, z + .2]), c2 = v.P([.35, 1.45, z + .2]);
    if (c1 && c2) { const s = v.scaleAt([0, 1.4, z]); const sh = Math.sin(t * 40) * (S.rattle || 0) * s * .03; ctx.lineWidth = Math.max(3, s * .045); ctx.strokeStyle = '#b8bcc6'; ctx.setLineDash([s * .07, s * .04]); ctx.beginPath(); ctx.moveTo(c1[0], c1[1]); ctx.quadraticCurveTo((c1[0] + c2[0]) / 2 + sh, c1[1] + s * .35, c2[0], c2[1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.roundRect((c1[0] + c2[0]) / 2 - s * .1 + sh, c1[1] + s * .28, s * .2, s * .18, s * .03); ctx.fillStyle = '#d8b13a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
    quadText(ctx, v, [-2.5, 6.6, z + .05], [2.5, 6.6, z + .05], [-2.5, 5.9, z + .05], 'HORARIO 10:00 – 22:00', { color: '#f4f0e6', w: 1400, h: 160 });
  });
}

// ---------- luces del ambiente (capas dibujadas) ----------
export function ambience(ctx, v, S = {}) {
  const L = LOOK[S.look || 'night'];
  // luz de luna desde el lucernario
  if (S.look !== 'emergency') { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(120,150,255,.10)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
}
export function vignette(ctx, a = .6) { const g = ctx.createRadialGradient(W / 2, H * .45, H * .25, W / 2, H * .5, H * .78); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
