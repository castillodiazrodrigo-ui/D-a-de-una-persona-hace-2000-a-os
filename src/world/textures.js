// =====================================================================
//  TEXTURAS PROCEDURALES (Canvas) — piedra, estuco, tejas, madera, etc.
// =====================================================================
import * as THREE from 'three';
import { rng } from '../core/math.js';
const cache = {};
function mk(key, w, h, fn, rep = [1, 1], srgb = true) {
  const id = key + rep.join('x');
  if (cache[id]) return cache[id];
  let base = cache['_c' + key];
  if (!base) { base = document.createElement('canvas'); base.width = w; base.height = h; fn(base.getContext('2d'), w, h); cache['_c' + key] = base; }
  const t = new THREE.CanvasTexture(base);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return (cache[id] = t);
}
function speckle(x, w, h, n, cols, r, a, seed = 1) { const R = rng(seed); for (let i = 0; i < n; i++) { x.globalAlpha = a * R(); x.fillStyle = cols[(R() * cols.length) | 0]; const s = r * (0.3 + R()); x.fillRect(R() * w, R() * h, s, s); } x.globalAlpha = 1; }
function stains(x, w, h, n, col, seed) { const R = rng(seed); for (let i = 0; i < n; i++) { const cx = R() * w, cy = R() * h, rr = 20 + R() * 120; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); } }

export const TEX = {
  cobble: (rep) => mk('cobble', 512, 512, (x, w, h) => { // adoquines romanos (basalto poligonal)
    x.fillStyle = '#3e3a36'; x.fillRect(0, 0, w, h); const R = rng(7);
    const cells = []; for (let i = 0; i < 70; i++) cells.push([R() * w, R() * h]);
    const img = x.getImageData(0, 0, w, h); const d = img.data;
    const shadeOf = cells.map(() => 70 + R() * 50);
    for (let y = 0; y < h; y++) for (let X = 0; X < w; X++) {
      let b1 = 1e9, b2 = 1e9, bi = 0;
      for (let i = 0; i < cells.length; i++) { for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { const dx = X - cells[i][0] - ox, dy = y - cells[i][1] - oy; const dd = dx * dx + dy * dy; if (dd < b1) { b2 = b1; b1 = dd; bi = i; } else if (dd < b2) b2 = dd; } }
      const edge = Math.sqrt(b2) - Math.sqrt(b1);
      const k = (X + y * w) * 4; let v = shadeOf[bi] + (R() * 10);
      if (edge < 5) v = 30 + edge * 6;
      d[k] = v * 1.02; d[k + 1] = v * .97; d[k + 2] = v * .9; d[k + 3] = 255;
    }
    x.putImageData(img, 0, 0); speckle(x, w, h, 3000, ['#000', '#8a8070'], 2, .25, 3);
  }, rep),
  plaster: (rep, tint = 'warm') => mk('plaster_' + tint, 512, 512, (x, w, h) => { // estuco envejecido
    const base = { warm: '#d9b98a', ochre: '#c99a5a', red: '#b86a48', pale: '#e6d6b8', pink: '#d4a08a' }[tint];
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    stains(x, w, h, 40, 'rgba(90,60,30,.12)', 11); stains(x, w, h, 25, 'rgba(255,240,210,.12)', 12);
    speckle(x, w, h, 6000, ['#6a4a2a', '#fff2d8'], 2, .18, 5);
    x.fillStyle = 'rgba(70,45,25,.25)'; x.fillRect(0, h - 40, w, 40); // zócalo sucio
    // pequeñas zonas de ladrillo visto donde se cae el estuco (irregulares, sutiles)
    const R = rng(21); for (let i = 0; i < 3; i++) { const cx = R() * w, cy = 80 + R() * (h - 200); x.save(); x.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283, rr = (18 + R() * 16) * (k % 2 ? 1 : .7); x.lineTo(cx + Math.cos(a) * rr * 1.6, cy + Math.sin(a) * rr); } x.closePath(); x.clip(); x.globalAlpha = .55; x.fillStyle = '#a8644a'; x.fillRect(cx - 70, cy - 40, 140, 80); x.strokeStyle = 'rgba(230,200,160,.8)'; x.lineWidth = 2; for (let yy = cy - 40; yy < cy + 40; yy += 10) { x.beginPath(); x.moveTo(cx - 70, yy); x.lineTo(cx + 70, yy); x.stroke(); } x.restore(); x.globalAlpha = 1; }
  }, rep),
  brick: (rep) => mk('brick', 512, 512, (x, w, h) => { x.fillStyle = '#c9b08a'; x.fillRect(0, 0, w, h); const R = rng(4); for (let r = 0; r < 32; r++) for (let c = 0; c < 9; c++) { x.fillStyle = `hsl(${12 + R() * 10},${45 + R() * 15}%,${33 + R() * 12}%)`; x.fillRect(c * 60 + (r % 2) * 30 - 30, r * 16, 56, 13); } speckle(x, w, h, 3000, ['#000'], 2, .2, 9); }, rep),
  tiles: (rep) => mk('tiles', 512, 512, (x, w, h) => { // tejas de terracota (tegulae + imbrices)
    x.fillStyle = '#a24a2a'; x.fillRect(0, 0, w, h); const R = rng(5);
    for (let c = 0; c < 8; c++) { for (let r = 0; r < 8; r++) { x.fillStyle = `hsl(${14 + R() * 8},${55 + R() * 10}%,${36 + R() * 10}%)`; x.fillRect(c * 64 + 6, r * 64, 52, 60); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(c * 64 + 6, r * 64 + 56, 52, 6); }
      const g = x.createLinearGradient(c * 64 - 8, 0, c * 64 + 8, 0); g.addColorStop(0, '#5a2414'); g.addColorStop(.5, '#d07850'); g.addColorStop(1, '#5a2414'); x.fillStyle = g; x.fillRect(c * 64 - 8, 0, 16, h); }
  }, rep),
  wood: (rep) => mk('wood', 512, 512, (x, w, h) => { x.fillStyle = '#6e4a2c'; x.fillRect(0, 0, w, h); const R = rng(8); for (let i = 0; i < 8; i++) { x.fillStyle = `hsl(28,${35 + R() * 10}%,${22 + R() * 10}%)`; x.fillRect(0, i * 64 + 2, w, 60); x.strokeStyle = 'rgba(0,0,0,.25)'; for (let j = 0; j < 14; j++) { x.lineWidth = 1 + R(); x.beginPath(); const y = i * 64 + 4 + R() * 56; x.moveTo(0, y); x.bezierCurveTo(w * .3, y + R() * 6 - 3, w * .6, y + R() * 6 - 3, w, y); x.stroke(); } x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, i * 64, w, 3); } }, rep),
  marble: (rep) => mk('marble', 512, 512, (x, w, h) => { x.fillStyle = '#e8e2d6'; x.fillRect(0, 0, w, h); const R = rng(13); x.strokeStyle = 'rgba(120,110,100,.25)'; for (let i = 0; i < 30; i++) { x.lineWidth = .5 + R() * 2; x.beginPath(); let px = R() * w, py = R() * h; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += R() * 80 - 30; py += R() * 80 - 40; x.lineTo(px, py); } x.stroke(); } stains(x, w, h, 20, 'rgba(180,170,150,.15)', 3); }, rep),
  mosaic: (rep) => mk('mosaic', 512, 512, (x, w, h) => { x.fillStyle = '#d8ccb0'; x.fillRect(0, 0, w, h); const R = rng(17); const s = 12; for (let r = 0; r < h / s; r++) for (let c = 0; c < w / s; c++) { const cx = c - 21, cy = r - 21; const ring = Math.max(Math.abs(cx), Math.abs(cy)); let col = ring % 6 < 1 ? '#2f4f6a' : ring % 6 < 2 ? '#e8dfc8' : '#d6c8a8'; if (ring > 19) col = '#7a3a24'; x.fillStyle = col; x.globalAlpha = .85 + R() * .15; x.fillRect(c * s + 1, r * s + 1, s - 2, s - 2); } x.globalAlpha = 1; }, rep),
  dirt: (rep) => mk('dirt', 512, 512, (x, w, h) => { x.fillStyle = '#8a7356'; x.fillRect(0, 0, w, h); stains(x, w, h, 60, 'rgba(60,40,20,.15)', 31); speckle(x, w, h, 9000, ['#4a3a28', '#b8a080'], 2, .35, 32); }, rep),
  planks: (rep) => mk('planks', 512, 512, (x, w, h) => { x.fillStyle = '#5a3c22'; x.fillRect(0, 0, w, h); const R = rng(41); for (let i = 0; i < 6; i++) { x.fillStyle = `hsl(26,${30 + R() * 10}%,${20 + R() * 9}%)`; x.fillRect(i * 85 + 2, 0, 81, h); x.strokeStyle = 'rgba(0,0,0,.2)'; for (let j = 0; j < 10; j++) { x.beginPath(); const xx = i * 85 + 4 + R() * 78; x.moveTo(xx, 0); x.lineTo(xx + R() * 6 - 3, h); x.stroke(); } } }, rep),
  water: (rep) => mk('water', 512, 512, (x, w, h) => { x.fillStyle = '#2e6a78'; x.fillRect(0, 0, w, h); const R = rng(51); for (let i = 0; i < 260; i++) { x.strokeStyle = `rgba(${200 + R() * 55},${230 + R() * 25},255,${.1 + R() * .25})`; x.lineWidth = 1 + R() * 2; x.beginPath(); const xx = R() * w, yy = R() * h, l = 10 + R() * 40; x.moveTo(xx, yy); x.quadraticCurveTo(xx + l / 2, yy - 4, xx + l, yy); x.stroke(); } }, rep),
  cloth: (rep, col = '#d8c8a0') => mk('cloth' + col, 256, 256, (x, w, h) => { x.fillStyle = col; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < w; i += 3) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } stains(x, w, h, 10, 'rgba(0,0,0,.08)', 61); }, rep),
  stone: (rep) => mk('stone', 512, 512, (x, w, h) => { x.fillStyle = '#b8ab92'; x.fillRect(0, 0, w, h); const R = rng(71); for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { x.fillStyle = `hsl(38,${15 + R() * 10}%,${58 + R() * 10}%)`; x.fillRect(c * 128 + (r % 2) * 64 - 64 + 2, r * 64 + 2, 124, 60); } speckle(x, w, h, 6000, ['#5a5040', '#fff'], 2, .2, 72); }, rep),
};
// Gradiente radial genérico (para halos de luz, rayos, humo)
export function radialTex(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 128) {
  const id = 'rad' + inner + outer; if (cache[id]) return cache[id];
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); g.addColorStop(0, inner); g.addColorStop(1, outer);
  x.fillStyle = g; x.fillRect(0, 0, size, size); return (cache[id] = new THREE.CanvasTexture(c));
}
// Textura de haz de luz (gradiente vertical suave)
export function beamTex() {
  if (cache.beam) return cache.beam;
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 256);
  const g2 = x.createLinearGradient(0, 0, 64, 0); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(.25, 'rgba(0,0,0,0)'); g2.addColorStop(.75, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,1)');
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = g2; x.fillRect(0, 0, 64, 256);
  return (cache.beam = new THREE.CanvasTexture(c));
}
// Fachada lejana: estuco + rejilla de ventanas (mapa de color y mapa emisivo para la noche)
export function facade(tint = 'warm', seed = 1) {
  const id = 'fac' + tint + seed; if (cache[id]) return cache[id];
  const base = { warm: '#d9b98a', ochre: '#c99a5a', red: '#b86a48', pale: '#e6d6b8', pink: '#d4a08a' }[tint];
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const x = c.getContext('2d');
  const e = document.createElement('canvas'); e.width = 256; e.height = 512; const y = e.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 256, 512); stains(x, 256, 512, 20, 'rgba(90,60,30,.15)', seed); speckle(x, 256, 512, 2000, ['#6a4a2a', '#fff2d8'], 2, .2, seed + 1);
  y.fillStyle = '#000'; y.fillRect(0, 0, 256, 512);
  const R = rng(seed * 7 + 3);
  for (let f = 0; f < 5; f++) { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, f * 102 + 98, 256, 4);
    for (let i = 0; i < 3; i++) { const wx = 28 + i * 80, wy = f * 102 + 30; if (f === 4) { x.fillStyle = '#2a1a10'; x.fillRect(wx - 6, wy + 10, 56, 62); continue; }
      x.fillStyle = '#1a120c'; x.fillRect(wx, wy, 36, 46); x.fillStyle = '#6a4a2a'; x.fillRect(wx - 4, wy + 46, 44, 5);
      if (R() > .4) { x.fillStyle = '#7a5434'; x.fillRect(wx - 14, wy, 12, 46); x.fillRect(wx + 38, wy, 12, 46); }
      if (R() > .45) { y.fillStyle = `rgb(255,${140 + R() * 60 | 0},60)`; y.fillRect(wx, wy, 36, 46); } } }
  const t1 = new THREE.CanvasTexture(c); t1.colorSpace = THREE.SRGBColorSpace; const t2 = new THREE.CanvasTexture(e); t2.colorSpace = THREE.SRGBColorSpace;
  return (cache[id] = { map: t1, emissive: t2 });
}
