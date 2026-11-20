// =====================================================================
//  MOTOR DEL EPISODIO: línea de tiempo de planos, cámara 2.5D,
//  efectos de edición (sacudida, barrido, destello, glitch, CCTV),
//  subtítulos y recolección de efectos de sonido.
//    window.renderFrame(t)  · window.collectCues()
// =====================================================================
import { W, H, View, Queue, hash } from './core.js';
import { keys, fbm, clamp, smooth, inv } from './math.js';
import { stepsFor } from './char.js';
import { SHOTS, DURATION, LABELS } from './shots.js';
import { Subs } from './subs.js';

const canvas = document.getElementById('c'); const ctx = canvas.getContext('2d');
const prev = document.createElement('canvas'); prev.width = W; prev.height = H; const pctx = prev.getContext('2d');
let subs = null, collecting = false, cues = [], lastD = {};

function makeCam(lt, ks, o = {}) {
  const get = (k, d) => keys(lt, ks.map(q => ({ t: q.t, v: q[k] ?? ks[0][k] ?? d, ease: q.ease })));
  const p = get('p', [0, 1.6, 0]), l = get('l', null);
  const sh = (o.shake ?? .02) + (o.shakeFn ? o.shakeFn(lt) : 0), tt = lt + (o.seed || 0);
  const cam = { x: p[0] + fbm(tt * .9) * sh, y: p[1] + fbm(tt * .8 + 4) * sh, z: p[2], f: get('f', 1.05), roll: get('roll', 0) + fbm(tt * .7 + 9) * sh * .05, near: o.near ?? .15, w: o.w, h: o.h };
  if (l) { const dx = l[0] - cam.x, dy = l[1] - cam.y, dz = l[2] - cam.z; cam.yaw = Math.atan2(dx, dz); cam.pitch = Math.atan2(dy, Math.hypot(dx, dz)); }
  return new View(cam);
}
function ctxFor(shot, t) {
  const lt = t - shot.t0;
  return {
    t, lt, dur: shot.t1 - shot.t0, k: clamp(lt / (shot.t1 - shot.t0)), collecting,
    cam: (ks, o) => makeCam(lt, ks, o), q: () => new Queue(),
    steps(id, dist, surface = 'tile', gain = 1, stride) { if (!collecting) return; const key = shot.id + id; const d0 = lastD[key]; if (d0 !== undefined && dist > d0) for (const _ of stepsFor(d0, dist, stride)) cues.push({ t, name: 'step_' + surface, gain }); lastD[key] = dist; },
  };
}
function active(t) { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.t0) s = x; return s; }

// ---------- efectos de pantalla ----------
function grain(t) { const n = Math.floor(t * 24); ctx.save(); ctx.globalAlpha = .05; for (let i = 0; i < 260; i++) { const x = hash(n * 31 + i) * W, y = hash(n * 17 + i * 3) * H; ctx.fillStyle = hash(i + n) > .5 ? '#fff' : '#000'; ctx.fillRect(x, y, 3, 3); } ctx.restore(); }
function vignette(a) { const g = ctx.createRadialGradient(W / 2, H * .46, H * .22, W / 2, H * .5, H * .8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
export function glitch(c, k, seed) {
  if (k <= 0) return; const cv = c.canvas; pctx.drawImage(cv, 0, 0);
  for (let i = 0; i < 10 * k + 2; i++) { const y = hash(seed * 7 + i) * H, h = 20 + hash(seed + i * 3) * 120 * k, dx = (hash(seed * 3 + i) - .5) * 160 * k; c.drawImage(prev, 0, y, W, h, dx, y, W, h); }
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .35 * k; c.drawImage(prev, 12 * k, 0); c.restore();
}
function whip(k, dir = 1) { if (k <= 0) return; pctx.drawImage(canvas, 0, 0); ctx.save(); for (let i = 1; i <= 6; i++) { ctx.globalAlpha = .22; ctx.drawImage(prev, dir * i * 40 * k, 0); } ctx.restore(); }

window.renderFrame = (t) => {
  t = Math.min(t, DURATION - 1e-4);
  const shot = active(t); const c = ctxFor(shot, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const fx = shot.draw(ctx, c) || {};
  if (fx.whip) whip(fx.whip, fx.whipDir || 1);
  if (fx.glitch) glitch(ctx, fx.glitch, Math.floor(t * 30));
  vignette(fx.vignette ?? .55); grain(t);
  // entradas / salidas de plano: pequeño "punch-in" de corte
  if (fx.flash) { ctx.fillStyle = `rgba(255,255,255,${fx.flash})`; ctx.fillRect(0, 0, W, H); }
  if (fx.black) { ctx.fillStyle = `rgba(0,0,0,${fx.black})`; ctx.fillRect(0, 0, W, H); }
  for (const L of LABELS) if (t >= L.t0 && t <= L.t1) L.draw(ctx, t, (t - L.t0) / (L.t1 - L.t0));
  if (subs && !fx.noSubs) subs.draw(ctx, t);
  if (t > DURATION - .08) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
  return shot.id;
};
window.collectCues = () => {
  collecting = true; cues = []; lastD = {}; const off = document.createElement('canvas'); off.width = 8; off.height = 8;
  const real = ctx; // los planos dibujan; aquí sólo interesa la lógica de pasos
  for (let f = 0; f < DURATION * 60; f++) { const t = f / 60; const s = active(t); s.draw(real, ctxFor(s, t)); }
  collecting = false;
  for (const s of SHOTS) for (const q of (s.sfx || [])) cues.push({ t: q[0], name: q[1], gain: q[2] ?? 1, ...(q[3] || {}) });
  cues.sort((a, b) => a.t - b.t); return cues;
};
window.shotList = () => SHOTS.map(s => ({ id: s.id, t0: s.t0, t1: s.t1, place: s.place }));

(async () => {
  const f1 = new FontFace('Mont', 'url(/node_modules/@fontsource/montserrat/files/montserrat-latin-900-normal.woff2)', { weight: '900' });
  await f1.load(); document.fonts.add(f1);
  const segs = await (await fetch('/ep1/audio/transcripcion.json')).json();
  subs = new Subs(segs);
  window.ready = window.done = true;
  const u = new URLSearchParams(location.search); if (u.has('t')) window.renderFrame(+u.get('t'));
})();
