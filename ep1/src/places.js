// =====================================================================
//  LUGARES DEL EPISODIO: exterior, probador, escaleras, patio de comidas,
//  mapa del mega-shopping, rejilla del aire, juguetería, sala de
//  seguridad y planos detalle (celular, reloj). Estilo ilustrado 2D.
// =====================================================================
import { W, H, INK, View, Queue, face, boxF, quadText, glow, ellipseShadow, path, hex, rgb, mixc, shadec, hash } from './core.js';
import { drawChar, ROSTER, R_M } from './char.js';
import { corridor, putChar, LOOK } from './env.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export function skyBG(ctx, top = '#0a1230', bot = '#2a3866', moon = [820, 380, 70]) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(.55, bot); g.addColorStop(1, '#141a2c'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(255,255,255,${.25 + hash(i) * .6})`; ctx.fillRect(hash(i * 3.1) * W, hash(i * 7.7) * H * .55, 2.6, 2.6); }
  if (moon) { glow(ctx, moon[0], moon[1], moon[2] * 3.5, 'rgba(200,215,255,.35)', 1); ctx.beginPath(); ctx.arc(moon[0], moon[1], moon[2], 0, 7); ctx.fillStyle = '#f2f0e4'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = 'rgba(190,185,170,.6)'; for (const [dx, dy, r] of [[-20, -15, 14], [18, 12, 10], [5, -30, 7]]) { ctx.beginPath(); ctx.arc(moon[0] + dx, moon[1] + dy, r, 0, 7); ctx.fill(); } }
  for (let i = 0; i < 5; i++) { ctx.save(); ctx.globalAlpha = .25; ctx.fillStyle = '#3a4a7a'; ctx.beginPath(); ctx.ellipse(hash(i + 50) * W, 200 + hash(i + 60) * 500, 260, 50, 0, 0, 7); ctx.fill(); ctx.restore(); }
}

// ---------------- EXTERIOR DEL MEGA SHOPPING ----------------
export function exterior(q, v, t, S = {}) {
  v.fog = { color: '#141a33', near: 20, far: 160, max: .6 };
  q.add(1e9, ctx => { face(ctx, v, [[-80, 0, -10], [80, 0, -10], [80, 0, 200], [-80, 0, 200]], '#2b2e3a', { stroke: false });
    ctx.save(); ctx.strokeStyle = 'rgba(230,230,210,.5)'; ctx.lineWidth = 3; for (let x = -30; x <= 30; x += 4) { const a = v.P([x, 0, 8]), b = v.P([x, 0, 14]); if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } } ctx.restore(); });
  const Z = 30;
  q.add(v.depth([0, 9, Z + 10]) + 10, ctx => {
    boxF(ctx, v, -34, 0, Z, 34, 18, Z + 30, '#6f6a86');
    // franjas de la fachada
    for (let y = 3; y < 18; y += 4) face(ctx, v, [[-34, y, Z - .01], [34, y, Z - .01], [34, y + .4, Z - .01], [-34, y + .4, Z - .01]], '#57536c', { lw: 2 });
    // entrada de vidrio iluminada (se apaga)
    const k = S.lights ?? 1;
    face(ctx, v, [[-8, 0, Z - .02], [8, 0, Z - .02], [8, 8, Z - .02], [-8, 8, Z - .02]], mixc('#1c2340', '#ffd79a', k * .85), { lw: 4 });
    for (let x = -8; x <= 8; x += 2.7) boxF(ctx, v, x - .12, 0, Z - .2, x + .12, 8, Z, '#2c2f3c');
    boxF(ctx, v, -9, 8, Z - 1.5, 9, 8.6, Z, '#3d3b4c');
    if (k > 0) { const c = v.P([0, 2, Z - .1]); if (c) glow(ctx, c[0], c[1] + 60, v.scaleAt([0, 2, Z]) * 9, 'rgba(255,200,120,.6)', k, 'lighter', .4); }
    // letrero con letras que se apagan una a una
    const word = 'MEGA SHOPPING'; const off = S.signOff ?? 0;
    const p0 = v.P([-17, 16.5, Z - .3]), p1 = v.P([17, 16.5, Z - .3]); if (!p0 || !p1) return;
    const sz = (p1[0] - p0[0]) / word.length * 1.25; ctx.font = `900 ${sz}px Mont`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < word.length; i++) { const lit = (i + 1) / word.length > off; const x = p0[0] + (i + .5) * (p1[0] - p0[0]) / word.length;
      if (lit) { ctx.shadowColor = '#ff5fa2'; ctx.shadowBlur = 40; }
      ctx.fillStyle = lit ? '#ffd1e6' : '#3b3346'; ctx.lineWidth = sz * .07; ctx.strokeStyle = INK; ctx.strokeText(word[i], x, p0[1] - sz * .1); ctx.fillText(word[i], x, p0[1] - sz * .1); ctx.shadowBlur = 0; }
  });
  // faroles del estacionamiento
  for (let i = 0; i < 6; i++) { const x = -25 + i * 10, z = 12 + (i % 2) * 8; q.add(v.depth([x, 3, z]), ctx => { boxF(ctx, v, x - .12, 0, z - .12, x + .12, 7, z + .12, '#23252f'); boxF(ctx, v, x - .1, 7, z - .1, x + 1.3, 7.25, z + .1, '#23252f'); const c = v.P([x + 1.1, 6.9, z]); if (c) { glow(ctx, c[0], c[1], v.scaleAt([x, 7, z]) * 4, 'rgba(255,205,130,.6)', 1); const f = v.P([x + 1.1, 0, z]); if (f) glow(ctx, f[0], f[1], v.scaleAt([x, 0, z]) * 4, 'rgba(255,190,110,.35)', 1, 'lighter', .3); } }); }
  for (let i = 0; i < 8; i++) { const x = -40 + i * 11 + (i % 2) * 3, z = 26; q.add(v.depth([x, 2, z]) + 5, ctx => { const p = v.P([x, 0, z]); if (!p) return; const s = v.scaleAt([x, 0, z]); ctx.fillStyle = '#16301f'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p[0], p[1] - s * 2.6, s * 1.6, s * 2, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillRect(p[0] - s * .1, p[1] - s, s * .2, s); }); }
}

// ---------------- PROBADOR (y tienda oscura detrás) ----------------
export function fitting(q, v, t, S = {}) {
  v.fog = { color: '#120f1c', near: 3, far: 22, max: .85 };
  const cur = S.curtain ?? 0; // 0 cerrado, 1 abierto
  q.add(1e9, ctx => face(ctx, v, [[-12, 0, -14], [12, 0, -14], [12, 0, 4], [-12, 0, 4]], '#4b4258', { stroke: false }));
  q.add(9e8, ctx => face(ctx, v, [[-12, 3.2, -14], [12, 3.2, -14], [12, 3.2, 4], [-12, 3.2, 4]], '#221f2c', { stroke: false }));
  // cabina
  q.add(v.depth([0, 1.2, 1.5]) + 2, ctx => face(ctx, v, [[-1.2, 0, 1.4], [1.2, 0, 1.4], [1.2, 2.6, 1.4], [-1.2, 2.6, 1.4]], '#b58b98'));
  for (const sd of [-1, 1]) q.add(v.depth([sd * 1.2, 1.2, .3]) + 1, ctx => face(ctx, v, [[sd * 1.2, 0, -1], [sd * 1.2, 0, 1.4], [sd * 1.2, 2.6, 1.4], [sd * 1.2, 2.6, -1]], sd < 0 ? '#9d7584' : '#a87e8d'));
  // espejo
  q.add(v.depth([1.18, 1.3, .3]) + .5, ctx => { face(ctx, v, [[1.17, .5, -.2], [1.17, .5, .9], [1.17, 2.1, .9], [1.17, 2.1, -.2]], '#9fc4d6', { lw: 4 }); face(ctx, v, [[1.16, 1.2, .1], [1.16, 1.2, .3], [1.16, 2.0, .6], [1.16, 2.0, .4]], '#e6f3fa', { stroke: false, alpha: .5 }); });
  // banquito y ropa
  q.add(v.depth([-.6, .3, .9]), ctx => { boxF(ctx, v, -.95, .42, .55, -.25, .5, 1.2, '#7a5a3c'); boxF(ctx, v, -.9, 0, .6, -.84, .42, .66, '#2a2a30'); boxF(ctx, v, -.36, 0, 1.1, -.3, .42, 1.16, '#2a2a30'); });
  q.add(v.depth([0, 1.9, 1.35]), ctx => { for (let i = 0; i < 3; i++) { const x = .1 + i * .35; face(ctx, v, [[x - .14, 1.45, 1.35], [x + .14, 1.45, 1.35], [x + .11, 1.95, 1.35], [x - .11, 1.95, 1.35]], ['#3f7fd8', '#d64f6a', '#4aa36b'][i]); } });
  q.add(v.depth([.4, .1, .8]), ctx => { for (let i = 0; i < 4; i++) { const p = v.P([.3 + hash(i) * .5, .06 + i * .07, .6 + hash(i + 3) * .5]); if (!p) continue; const s = v.scaleAt([.5, 0, .8]); ctx.beginPath(); ctx.ellipse(p[0], p[1], s * .3, s * .08, hash(i) - .5, 0, 7); ctx.fillStyle = ['#e8b62f', '#9a6ad8', '#2fb3b0', '#d64f6a'][i]; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); } });
  // cortina (barra + paños con pliegues)
  q.add(v.depth([0, 1.3, -1]) - .2, ctx => {
    boxF(ctx, v, -1.3, 2.55, -1.04, 1.3, 2.6, -.98, '#2a2a30');
    const span = 2.4 * (1 - cur * .82), x0 = -1.2 + (cur * 2.4 * .82);
    const n = 9; for (let i = 0; i < n; i++) { const a = x0 + i / n * span, b = x0 + (i + 1) / n * span; const sway = Math.sin(t * 2 + i) * .02 * (S.sway || 0);
      face(ctx, v, [[a, .08, -1 + sway], [b, .08, -1 - sway], [b, 2.55, -1], [a, 2.55, -1]], i % 2 ? '#a3262f' : '#c23a3f', { lw: 2 }); }
  });
  // tienda oscura detrás: percheros y maniquíes
  for (let i = 0; i < 4; i++) { const x = -5 + i * 3.4, z = -6 - (i % 2) * 3; q.add(v.depth([x, 1, z]), ctx => { boxF(ctx, v, x - 1, 1.6, z - .05, x + 1, 1.66, z + .05, '#2a2a30'); for (let k = 0; k < 6; k++) face(ctx, v, [[x - .9 + k * .33, .8, z], [x - .65 + k * .33, .8, z], [x - .65 + k * .33, 1.62, z], [x - .9 + k * .33, 1.62, z]], ['#3f7fd8', '#d64f6a', '#e8b62f', '#4aa36b'][(k + i) % 4]); }); }
  for (const [x, z] of [[-3, -4], [3.2, -5], [6, -8]]) putChar(q, v, ROSTER.mani, { turn: 0, hf: [.5, -2.1], hb: [-.5, -2.1] }, x, z, 0, { shadowA: .3 });
}

// ---------------- ESCALERA MECÁNICA ----------------
export function escalator(q, v, t, S = {}) {
  const z0 = S.z0 ?? 20, z1 = z0 + 8, y1 = 4.2;
  const P = (x, k) => [x, y1 * k, z0 + (z1 - z0) * k];
  q.add(v.depth([0, 2, (z0 + z1) / 2]), ctx => {
    // cara inferior (estructura)
    face(ctx, v, [P(-1.1, 0), P(1.1, 0), [1.1, y1 - .6, z1], [-1.1, y1 - .6, z1]], '#6f6a7e', { lw: 3 });
    // escalones que suben (rayas animadas)
    face(ctx, v, [P(-.9, 0), P(.9, 0), P(.9, 1), P(-.9, 1)], '#4d4f5c', { lw: 2 });
    ctx.save(); ctx.strokeStyle = 'rgba(200,205,220,.55)'; ctx.lineWidth = 2.2; const off = ((t * (S.speed ?? .5)) % .05);
    for (let k = off; k < 1; k += .05) { const a = v.P(P(-.9, k)), b = v.P(P(.9, k)); if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } }
    ctx.restore();
  });
  for (const sd of [-1, 1]) q.add(v.depth([sd, 2, (z0 + z1) / 2]) - .3 * sd * Math.sign(v.cam.x || 1), ctx => {
    face(ctx, v, [P(sd * 1.0, 0), P(sd * 1.0, 1), [sd * 1.0, y1 + 1.0, z1], [sd * 1.0, 1.0, z0]], '#a8d8ee', { alpha: .3, lw: 3 });
    const pts = [[sd, 1.0, z0 - .6], [sd, 1.0, z0], [sd, y1 + 1.0, z1], [sd, y1 + 1.0, z1 + .6]].map(p => v.P(p)).filter(Boolean);
    if (pts.length > 1) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.lineWidth = Math.max(5, v.scaleAt([sd, 1, z0]) * .08); ctx.strokeStyle = '#141418'; ctx.lineCap = 'round'; ctx.stroke(); }
  });
}

// ---------------- PATIO DE COMIDAS ----------------
export function foodcourt(q, v, t, S = {}) {
  v.fog = { color: '#141a33', near: 6, far: 50, max: .75 };
  q.add(1e9, ctx => { face(ctx, v, [[-14, 0, -6], [14, 0, -6], [14, 0, 24], [-14, 0, 24]], '#7a6e7e', { stroke: false });
    ctx.save(); for (let i = -7; i < 7; i++) for (let j = -3; j < 12; j++) if ((i + j) % 2 === 0) { const pp = v.poly([[i * 2, .001, j * 2], [i * 2 + 2, .001, j * 2], [i * 2 + 2, .001, j * 2 + 2], [i * 2, .001, j * 2 + 2]]); if (pp) { path(ctx, pp); ctx.fillStyle = 'rgba(40,30,50,.25)'; ctx.fill(); } } ctx.restore(); });
  q.add(9e8, ctx => face(ctx, v, [[-14, 7, -6], [14, 7, -6], [14, 7, 24], [-14, 7, 24]], '#262836', { stroke: false }));
  const Z = 18; const stands = [['BURGER', '#d9342b', '#f2c94c'], ['PIZZA', '#2f8f4a', '#f0e6d0'], ['SUSHI', '#2b2b33', '#e8352b'], ['HELADOS', '#e05fa8', '#fff3fb']];
  q.add(v.depth([0, 3, Z]) + 3, ctx => face(ctx, v, [[-14, 0, Z + 1.2], [14, 0, Z + 1.2], [14, 7, Z + 1.2], [-14, 7, Z + 1.2]], '#4a4560', { lw: 3 }));
  stands.forEach(([name, c1, c2], i) => { const x0 = -12 + i * 6, x1 = x0 + 5.2;
    q.add(v.depth([(x0 + x1) / 2, 2, Z]) + 1, ctx => {
      face(ctx, v, [[x0, 0, Z + 1.1], [x1, 0, Z + 1.1], [x1, 4.2, Z + 1.1], [x0, 4.2, Z + 1.1]], shadec(c1, -.45), { lw: 3 });
      boxF(ctx, v, x0, 0, Z - .4, x1, 1.1, Z + .3, shadec(c1, -.1));
      boxF(ctx, v, x0, 4.2, Z - .6, x1, 5.2, Z + 1.1, c1);
      quadText(ctx, v, [x0 + .2, 5.1, Z - .61], [x1 - .2, 5.1, Z - .61], [x0 + .2, 4.3, Z - .61], name, { color: c2, w: 1000, h: 260, stroke: INK });
      // menú con íconos
      for (let k = 0; k < 3; k++) face(ctx, v, [[x0 + .4 + k * 1.6, 2.4, Z + 1.05], [x0 + 1.6 + k * 1.6, 2.4, Z + 1.05], [x0 + 1.6 + k * 1.6, 3.6, Z + 1.05], [x0 + .4 + k * 1.6, 3.6, Z + 1.05]], '#1e1c26', { lw: 2.5 });
    }); });
  // mesas y sillas
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { const x = -9 + i * 3.6, z = 6 + j * 5 + (i % 2) * 1.2; if (S.skipTable && S.skipTable(x, z)) continue;
    q.add(v.depth([x, .8, z]), ctx => { boxF(ctx, v, x - .07, 0, z - .07, x + .07, .78, z + .07, '#2a2a30'); boxF(ctx, v, x - .65, .78, z - .65, x + .65, .86, z + .65, '#e9e4ec');
      for (const [dx, dz] of [[-.95, 0], [.95, 0]]) { boxF(ctx, v, x + dx - .25, .45, z + dz - .25, x + dx + .25, .52, z + dz + .25, '#d9534a'); boxF(ctx, v, x + dx - .03, 0, z + dz - .03, x + dx + .03, .45, z + dz + .03, '#2a2a30'); } }); }
}

// ---------------- MAPA DEL MEGA SHOPPING (vista aérea) ----------------
export function megamap(ctx, t, S = {}) {
  const v = new View({ x: S.cx ?? 0, y: S.cy ?? 60, z: S.cz ?? -40, pitch: -(S.pitch ?? .95), yaw: S.yaw ?? 0, f: 1.0 });
  ctx.fillStyle = '#0d1226'; ctx.fillRect(0, 0, W, H);
  const q = new Queue(); v.fog = { color: '#0d1226', near: 40, far: 220, max: .6 };
  q.add(1e9, c => face(c, v, [[-90, 0, -60], [90, 0, -60], [90, 0, 140], [-90, 0, 140]], '#1d2a3a', { stroke: false }));
  q.add(9e8, c => { face(c, v, [[-40, .05, 60], [10, .05, 60], [10, .05, 110], [-40, .05, 110]], '#1f5f8a', { lw: 3 }); });
  const lit = S.lit ?? 0; let n = 0;
  for (let i = -6; i <= 6; i++) for (let j = -2; j <= 8; j++) {
    if (Math.abs(i) < 1 || (j > 4 && i < 0)) continue;
    const x = i * 6, z = j * 6, h = 1.5 + hash(i * 13 + j) * 2.5; const idx = n++;
    const on = hash(idx * 1.7) < lit;
    q.add(v.depth([x, h, z]), c => boxF(c, v, x - 2.6, 0, z - 2.6, x + 2.6, h, z + 2.6, on ? ['#f2c94c', '#ff8a5c', '#5fd0ff', '#ff5fa2', '#7be38b'][idx % 5] : '#3a3f55', { light: on ? .1 : 0 }));
  }
  q.add(v.depth([30, 20, 85]), c => { boxF(c, v, 27, 0, 82, 33, 40, 88, '#8fa3c0'); boxF(c, v, 28.5, 40, 83.5, 31.5, 70, 86.5, '#a8bad2'); boxF(c, v, 29.6, 70, 84.6, 30.4, 95, 85.4, '#c3d2e6'); });
  q.flush(ctx);
  return v;
}

// ---------------- REJILLA DEL AIRE ACONDICIONADO (detalle 2D) ----------------
export function vent(ctx, t, S = {}) {
  ctx.fillStyle = '#5b5f73'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 12; i++) { ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(0, i * 170, W, 3); }
  const cx = W / 2, cy = H * .42, r = 380;
  ctx.beginPath(); ctx.roundRect(cx - r - 40, cy - r - 40, (r + 40) * 2, (r + 40) * 2, 40); ctx.fillStyle = '#cfd3dc'; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fillStyle = '#1a1c24'; ctx.fill(); ctx.clip();
  const ang = S.ang ?? t * 12; ctx.translate(cx, cy);
  for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate(ang + i * Math.PI * 2 / 5); ctx.beginPath(); ctx.ellipse(0, -r * .48, r * .17, r * .46, .35, 0, 7); ctx.fillStyle = '#8a90a3'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
  ctx.beginPath(); ctx.arc(0, 0, r * .14, 0, 7); ctx.fillStyle = '#c6cad4'; ctx.fill(); ctx.lineWidth = 7; ctx.stroke();
  ctx.restore();
  ctx.lineWidth = 12; ctx.strokeStyle = '#2b2e38'; for (let y = cy - r; y <= cy + r; y += 64) { const dx = Math.sqrt(Math.max(0, r * r - (y - cy) ** 2)); ctx.beginPath(); ctx.moveTo(cx - dx, y); ctx.lineTo(cx + dx, y); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.stroke();
  // panel con interruptor
  ctx.beginPath(); ctx.roundRect(cx - 230, H * .74, 460, 190, 30); ctx.fillStyle = '#2a2d38'; ctx.fill(); ctx.lineWidth = 8; ctx.stroke();
  const on = S.on ?? 1; ctx.font = '900 92px Mont'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = on > .5 ? '#7be38b' : '#ff5a4a'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 30; ctx.fillText(on > .5 ? 'A/C  ON' : 'A/C  OFF', cx, H * .74 + 98); ctx.shadowBlur = 0;
}

// ---------------- JUGUETERÍA POR DENTRO: CAJITA MUSICAL (detalle 2D) ----------------
export function musicBox(ctx, t, S = {}) {
  const g = ctx.createRadialGradient(W / 2, H * .5, 50, W / 2, H * .5, H * .75); g.addColorStop(0, '#3a2a3a'); g.addColorStop(1, '#0b0810'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // estantes con juguetes en penumbra
  ctx.lineWidth = 8; ctx.strokeStyle = INK;
  for (const y of [520, 1020]) { ctx.fillStyle = '#4a3428'; ctx.fillRect(0, y, W, 40); ctx.strokeRect(-10, y, W + 20, 40); }
  bear(ctx, 210, 520, 1.0, t, S.bearLook || 0); robot(ctx, 870, 520, 1); bear(ctx, 900, 1020, .8, t, 0, '#8a5a8a');
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.rect(120 + i * 90, 1020 - 80 - i * 0, 80, 80); ctx.fillStyle = ['#d64f6a', '#3f7fd8', '#e8b62f'][i]; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = '900 54px Mont'; ctx.textAlign = 'center'; ctx.fillText('ABC'[i], 160 + i * 90, 1000); }
  // cono de luz sobre la cajita
  glow(ctx, W / 2, H * .72, 560, 'rgba(255,190,110,.55)', 1, 'lighter', .6);
  const cx = W / 2, by = H * .8;
  // caja
  ctx.beginPath(); ctx.moveTo(cx - 260, by - 170); ctx.lineTo(cx + 260, by - 170); ctx.lineTo(cx + 260, by); ctx.lineTo(cx - 260, by); ctx.closePath(); ctx.fillStyle = '#c0544a'; ctx.fill(); ctx.lineWidth = 10; ctx.stroke();
  ctx.fillStyle = '#e8b62f'; ctx.fillRect(cx - 260, by - 110, 520, 22); ctx.strokeRect(cx - 260, by - 110, 520, 22);
  ctx.beginPath(); ctx.moveTo(cx - 260, by - 170); ctx.lineTo(cx - 200, by - 230); ctx.lineTo(cx + 320, by - 230); ctx.lineTo(cx + 260, by - 170); ctx.closePath(); ctx.fillStyle = '#7a2f2a'; ctx.fill(); ctx.stroke();
  // tapa abierta
  ctx.beginPath(); ctx.moveTo(cx - 200, by - 230); ctx.lineTo(cx - 170, by - 560); ctx.lineTo(cx + 350, by - 560); ctx.lineTo(cx + 320, by - 230); ctx.closePath(); ctx.fillStyle = '#a8443c'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 150, by - 270); ctx.lineTo(cx - 130, by - 520); ctx.lineTo(cx + 300, by - 520); ctx.lineTo(cx + 285, by - 270); ctx.closePath(); ctx.fillStyle = '#b9d5e6'; ctx.fill(); ctx.stroke();
  // bailarina girando (escala en X = coseno)
  const a = (S.spin ?? t * 2.2); const sx = Math.cos(a); const bx = cx + 60, byy = by - 240;
  ctx.beginPath(); ctx.ellipse(bx, byy, 70, 20, 0, 0, 7); ctx.fillStyle = '#e8b62f'; ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(bx, byy - 20); ctx.scale(sx >= 0 ? Math.max(.25, Math.abs(sx)) : -Math.max(.25, Math.abs(sx)), 1);
  ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -120); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(35, -10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-75, -120); ctx.quadraticCurveTo(0, -95, 75, -120); ctx.lineTo(30, -170); ctx.lineTo(-30, -170); ctx.closePath(); ctx.fillStyle = '#f6b7cf'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-15, -170); ctx.lineTo(-60, -235); ctx.moveTo(15, -170); ctx.lineTo(60, -235); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -225, 42, 0, 7); ctx.fillStyle = '#f8f6f1'; ctx.fill(); ctx.stroke();
  if (sx > 0) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-13, -228, 5, 0, 7); ctx.arc(13, -228, 5, 0, 7); ctx.fill(); }
  ctx.restore();
  // notas musicales
  for (let i = 0; i < 7; i++) { const k = (t * .35 + i / 7) % 1; const x = cx - 200 + i * 70 + Math.sin(k * 6 + i) * 40, y = by - 600 - k * 600; ctx.globalAlpha = Math.sin(k * Math.PI) * (S.notes ?? 1); ctx.fillStyle = '#ffe1a0'; ctx.font = '900 80px DejaVu Sans'; ctx.fillText(i % 2 ? '♪' : '♫', x, y); }
  ctx.globalAlpha = 1;
}
function bear(ctx, x, y, s, t, look, col = '#a0703a') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineWidth = 8; ctx.strokeStyle = INK;
  for (const [dx, dy, r] of [[0, -110, 95], [-75, -215, 32], [75, -215, 32], [0, -250, 85]]) { ctx.beginPath(); ctx.arc(dx, dy, r, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, -225, 30, 22, 0, 0, 7); ctx.fillStyle = '#e0c49a'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 30 + look * 10, -270, 9, 0, 7); ctx.fill(); }
  ctx.restore();
}
function robot(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.fillStyle = '#8fa0b8'; ctx.beginPath(); ctx.rect(-70, -170, 140, 170); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.rect(-55, -290, 110, 110); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff5a4a'; ctx.beginPath(); ctx.arc(-22, -240, 12, 0, 7); ctx.arc(22, -240, 12, 0, 7); ctx.fill(); ctx.restore(); }

// ---------------- SALA DE SEGURIDAD ----------------
export function security(q, v, t, S = {}) {
  v.fog = { color: '#06080f', near: 3, far: 18, max: .7 };
  const Zb = 4;
  q.add(1e9, ctx => face(ctx, v, [[-3.5, 0, -6], [3.5, 0, -6], [3.5, 0, Zb], [-3.5, 0, Zb]], '#2e3140', { stroke: false }));
  q.add(9e8, ctx => face(ctx, v, [[-3.5, 3, -6], [3.5, 3, -6], [3.5, 3, Zb], [-3.5, 3, Zb]], '#15171f', { stroke: false }));
  q.add(v.depth([0, 1.5, Zb]) + 3, ctx => face(ctx, v, [[-3.5, 0, Zb], [3.5, 0, Zb], [3.5, 3, Zb], [-3.5, 3, Zb]], '#3a3f52'));
  // pared derecha y pared izquierda con la puerta (rectángulo oscuro)
  q.add(v.depth([3.5, 1.5, -1]) + 2, ctx => face(ctx, v, [[3.5, 0, Zb], [3.5, 0, -6], [3.5, 3, -6], [3.5, 3, Zb]], '#313546'));
  q.add(v.depth([-3.5, 1.5, -1]) + 2, ctx => { face(ctx, v, [[-3.5, 0, -6], [-3.5, 0, Zb], [-3.5, 3, Zb], [-3.5, 3, -6]], '#2c3040'); face(ctx, v, [[-3.49, 0, -3.2], [-3.49, 0, -1.8], [-3.49, 2.2, -1.8], [-3.49, 2.2, -3.2]], '#050608', { lw: 4 });
    quadText(ctx, v, [-3.48, 2.75, -3.4], [-3.48, 2.75, -1.6], [-3.48, 2.35, -3.4], 'SEGURIDAD', { color: '#e8e4d8', w: 1000, h: 200 }); });
  // muro de monitores 3x3 (contenido: canvases con las cámaras)
  const feeds = S.feeds || [];
  q.add(v.depth([0, 1.9, Zb]) + 1, ctx => {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const x0 = -2.35 + c * 1.6, y0 = 2.05 - r * .92, x1 = x0 + 1.45, y1 = y0 + .82; const zz = Zb - .1;
      boxF(ctx, v, x0 - .05, y0 - .05, zz - .08, x1 + .05, y1 + .05, zz, '#16171c');
      const a = v.P([x0, y1, zz - .09]), b = v.P([x1, y1, zz - .09]), d = v.P([x0, y0, zz - .09]);
      const f = feeds[r * 3 + c];
      if (a && b && d && f) { ctx.save(); ctx.setTransform((b[0] - a[0]) / f.width, (b[1] - a[1]) / f.width, (d[0] - a[0]) / f.height, (d[1] - a[1]) / f.height, a[0], a[1]); ctx.drawImage(f, 0, 0); ctx.restore(); }
      const m = v.P([(x0 + x1) / 2, (y0 + y1) / 2, zz - .1]); if (m) glow(ctx, m[0], m[1], v.scaleAt([0, 1.6, zz]) * 1.1, 'rgba(120,170,255,.25)', 1);
    }
  });
  // escritorio, teclado, taza humeante
  q.add(v.depth([0, .8, Zb - .9]), ctx => { boxF(ctx, v, -2.6, .75, Zb - 1.5, 2.6, .85, Zb - .2, '#4a3a30'); boxF(ctx, v, -2.5, 0, Zb - 1.4, -2.3, .75, Zb - .3, '#2a2a30'); boxF(ctx, v, 2.3, 0, Zb - 1.4, 2.5, .75, Zb - .3, '#2a2a30'); boxF(ctx, v, -.7, .85, Zb - 1.2, .5, .9, Zb - .9, '#1e1f26');
    boxF(ctx, v, 1.2, .85, Zb - 1.25, 1.42, 1.07, Zb - 1.03, '#e8e4dc');
    if (S.steam) for (let i = 0; i < 3; i++) { const k = (t * .5 + i / 3) % 1; const p = v.P([1.31 + Math.sin(k * 6 + i) * .05, 1.1 + k * .5, Zb - 1.14]); if (!p) continue; ctx.globalAlpha = Math.sin(k * Math.PI) * .5 * S.steam; glow(ctx, p[0], p[1], v.scaleAt([1.3, 1.2, Zb]) * .14, 'rgba(230,235,245,1)', 1, 'source-over'); ctx.globalAlpha = 1; } });
  // silla giratoria (gira sola)
  const cr = S.chairRot ?? 0; const cx = -1.5, cz = Zb - 2.3;
  q.add(v.depth([cx, .6, cz]), ctx => {
    boxF(ctx, v, cx - .04, .1, cz - .04, cx + .04, .5, cz + .04, '#2a2a30');
    const pts = (y0, y1, rz, w) => { const c = Math.cos(cr), s = Math.sin(cr); return [[-w, y0], [w, y0], [w, y1], [-w, y1]].map(([x, y]) => [cx + x * c + rz * s, y, cz - x * s + rz * c]); };
    face(ctx, v, pts(.5, .55, 0, .35).map((p, i) => [p[0], .52, p[2] + (i < 2 ? -.3 : .3) * 0]), '#22252f');
    face(ctx, v, [[cx - .35, .52, cz - .32], [cx + .35, .52, cz - .32], [cx + .35, .58, cz + .32], [cx - .35, .58, cz + .32]], '#2a2d3a');
    face(ctx, v, pts(.6, 1.35, .3, .33), '#262935');
  });
}

// ---------------- PLANOS DETALLE 2D ----------------
export function phoneClose(ctx, t, S = {}) {
  const g = ctx.createRadialGradient(W / 2, H * .45, 100, W / 2, H * .5, H * .7); g.addColorStop(0, '#2a3256'); g.addColorStop(1, '#090c18'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const cx = W / 2 + (S.dx || 0), cy = H * .46 + (S.dy || 0); ctx.save(); ctx.translate(cx, cy); ctx.rotate(S.rot || -.05);
  // brazo-palito y mano
  ctx.lineWidth = 34; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(60, 380); ctx.quadraticCurveTo(200, 700, 420, 1100); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-250, -470, 500, 940, 70); ctx.fillStyle = '#23252d'; ctx.fill(); ctx.lineWidth = 14; ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-215, -430, 430, 860, 45); const sg = ctx.createLinearGradient(0, -430, 0, 430); sg.addColorStop(0, '#3a6ad8'); sg.addColorStop(1, '#8a5ad8'); ctx.fillStyle = sg; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '900 180px Mont'; ctx.fillText(S.time || '22:15', 0, -190);
  ctx.font = '900 40px Mont'; ctx.fillText(S.date || 'SÁBADO', 0, -60);
  // barras de señal
  const sig = S.signal ?? 0; for (let i = 0; i < 4; i++) { ctx.fillStyle = i < sig ? '#fff' : 'rgba(255,255,255,.25)'; ctx.fillRect(110 + i * 22, -395 - i * 10, 16, 20 + i * 10); }
  if (S.noSignal) { ctx.strokeStyle = '#ff4a3a'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(105, -425); ctx.lineTo(195, -370); ctx.stroke();
    const k = S.noSignal; ctx.globalAlpha = k; ctx.beginPath(); ctx.roundRect(-180, 60, 360, 150, 30); ctx.fillStyle = 'rgba(20,20,30,.85)'; ctx.fill(); ctx.fillStyle = '#ff6a5a'; ctx.font = '900 58px Mont'; ctx.fillText('SIN SEÑAL', 0, 120); ctx.fillStyle = '#ddd'; ctx.font = '900 30px Mont'; ctx.fillText('Llamada fallida', 0, 175); ctx.globalAlpha = 1; }
  ctx.beginPath(); ctx.ellipse(0, 470 - 30, 70, 40, 0, 0, Math.PI); ctx.restore();
  // pulgar
  ctx.beginPath(); ctx.arc(cx + 235, cy + 120, 42, 0, 7); ctx.fillStyle = INK; ctx.fill();
  glow(ctx, cx, cy, 600, 'rgba(120,140,255,.25)', 1);
}
export function clockClose(ctx, t, S = {}) {
  ctx.fillStyle = '#121624'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 9; i++) { ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fillRect(0, i * 230, W, 110); }
  const cx = W / 2, cy = H * .42; ctx.beginPath(); ctx.roundRect(cx - 430, cy - 210, 860, 420, 50); ctx.fillStyle = '#20232e'; ctx.fill(); ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.roundRect(cx - 380, cy - 160, 760, 320, 30); ctx.fillStyle = '#0a0b10'; ctx.fill();
  ctx.font = '900 250px Mont'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = S.col || '#ff4a3a'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 45; ctx.fillText(S.time || '23:59', cx, cy + 12); ctx.shadowBlur = 0;
  ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(cx, cy - 210); ctx.lineTo(cx, 0); ctx.stroke();
}
