// =====================================================================
//  MOTOR PRINCIPAL: línea de tiempo de planos, cámara, transiciones,
//  superposiciones y recolección de efectos de sonido sincronizados.
//  API expuesta para el renderizador:
//    window.renderFrame(t)   -> dibuja el fotograma del instante t
//    window.collectCues()    -> lista de SFX con tiempos exactos
// =====================================================================
import * as THREE from 'three';
import { createRenderer, W, H } from './core/stage.js';
import { keys, fbm, clamp, smooth } from './core/math.js';
import { Toon } from './characters/toon.js';
import { stepsBetween } from './characters/poses.js';
import { Subtitles, buildChunks } from './overlay/subtitles.js';
import { Titles } from './overlay/titles.js';
import { SHOTS, LABELS, DURATION, OVERLAY_FX } from './shots/index.js';
import { getSet } from './sets/index.js';

const renderer = createRenderer(document.getElementById('gl'));
const camera = new THREE.PerspectiveCamera(40, W / H, .05, 900);
const snap = document.getElementById('snap'), snapCtx = snap.getContext('2d');
const fadeEl = document.getElementById('fade'), flashEl = document.getElementById('flash');
const titles = new Titles(document.getElementById('titles'));
let subs = null;

// --- grano de película determinista ---
const grain = document.getElementById('grain').getContext('2d');
const grainFrames = [];
for (let f = 0; f < 6; f++) { const id = grain.createImageData(540, 960); let s = 1234 + f * 999; for (let i = 0; i < id.data.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const v = (s >> 16) & 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } grainFrames.push(id); }

// --- utilidades para los planos ---
function camKeys(lt, ks, o = {}) {
  const p = keys(lt, ks.map(k => ({ t: k.t, v: k.p, ease: k.ease })));
  const l = keys(lt, ks.map(k => ({ t: k.t, v: k.l, ease: k.ease })));
  const fov = keys(lt, ks.map(k => ({ t: k.t, v: k.fov ?? ks[0].fov ?? 40, ease: k.ease })));
  const sh = o.shake ?? .012; const tt = lt + (o.seed || 0) * 10;
  camera.position.set(p[0] + fbm(tt * .7) * sh, p[1] + fbm(tt * .6 + 5) * sh, p[2] + fbm(tt * .5 + 9) * sh * .5);
  camera.lookAt(l[0] + fbm(tt * .5 + 3) * sh * .6, l[1] + fbm(tt * .55 + 7) * sh * .6, l[2]);
  if (o.roll) camera.rotateZ(o.roll);
  camera.fov = fov; camera.updateProjectionMatrix();
}

let collecting = false, cues = [], lastDist = {};
function makeCtx(shot, t) {
  const lt = t - shot.t0, dur = shot.t1 - shot.t0;
  return {
    t, lt, dur, k: clamp(lt / dur), cam: camera, collecting,
    camKeys: (ks, o) => camKeys(lt, ks, o),
    // pasos sincronizados con el ciclo de caminar (sólo durante la recolección)
    steps(id, dist, surface = 'stone', gain = 1, stride) {
      if (!collecting) return;
      const key = shot.id + ':' + id; const d0 = lastDist[key];
      if (d0 !== undefined && dist > d0) for (const _ of stepsBetween(d0, dist, stride)) cues.push({ t, name: 'step_' + surface, gain });
      lastDist[key] = dist;
    },
    cue(name, gain = 1, o = {}) { if (collecting) cues.push({ t, name, gain, ...o }); },
  };
}

function activeShot(t) { let s = SHOTS[0]; for (const sh of SHOTS) if (t >= sh.t0) s = sh; return s; }

function runShot(shot, t) {
  const set = getSet(shot.set);
  const ctx = makeCtx(shot, t);
  ctx.set = set;
  for (const c of (set.toons || [])) c.root.visible = false;
  if (set.reset) set.reset();
  shot.run(ctx, set);
  if (set.update) set.update(t, ctx);
  // orientar las tarjetas de sombra de los personajes hacia la luz
  if (set.toons && set.lights) { const ld = set.lights.sun.position.clone().sub(set.lights.sun.target.position).normalize(); for (const c of set.toons) c.lightDir.copy(ld); }
  return set;
}

function overlays(t) {
  // fundidos y destellos globales
  let fade = 0, flash = 0;
  for (const f of OVERLAY_FX) {
    if (f.type === 'fade') fade = Math.max(fade, f.fn(t));
    if (f.type === 'flash') flash = Math.max(flash, f.fn(t));
  }
  fadeEl.style.opacity = fade.toFixed(3); flashEl.style.opacity = flash.toFixed(3);
  titles.update(t, LABELS);
  if (subs) subs.update(t);
  grain.putImageData(grainFrames[Math.floor(t * 24) % grainFrames.length], 0, 0);
}

window.renderFrame = (t) => {
  t = Math.min(t, DURATION - 1e-4);
  const shot = activeShot(t);
  const idx = SHOTS.indexOf(shot);
  const xf = shot.xfade || 0;
  if (xf > 0 && idx > 0 && t - shot.t0 < xf) {
    // fundido encadenado: renderizar el plano anterior y guardarlo
    const prev = SHOTS[idx - 1]; const ps = runShot(prev, t);
    renderer.render(ps.scene, camera);
    snapCtx.drawImage(renderer.domElement, 0, 0);
    snap.style.opacity = (1 - smooth((t - shot.t0) / xf)).toFixed(3);
  } else snap.style.opacity = 0;
  const set = runShot(shot, t);
  renderer.toneMappingExposure = set.exposure ?? 1;
  const _a = performance.now();
  if (window.NOSHADOW) renderer.shadowMap.enabled = false;
  renderer.render(set.scene, camera);
  window._glms = performance.now() - _a;
  const g = shot.grade || set.grade;
  document.getElementById('gl').style.filter = g || 'none';
  overlays(t);
  return shot.id;
};

window.collectCues = () => {
  collecting = true; Toon.skipDraw = true; cues = []; lastDist = {};
  const fps = 120;
  for (let f = 0; f * (1 / fps) < DURATION; f++) { const t = f / fps; const shot = activeShot(t); runShot(shot, t); }
  collecting = false; Toon.skipDraw = false;
  // SFX declarados de forma estática en los planos
  for (const sh of SHOTS) for (const c of (sh.sfx || [])) cues.push({ t: c[0], name: c[1], gain: c[2] ?? 1, ...(c[3] || {}) });
  cues.sort((a, b) => a.t - b.t);
  return cues;
};
window._getSet = getSet; window._cam = camera; window._renderer = renderer;
window.shotList = () => SHOTS.map(s => ({ id: s.id, t0: s.t0, t1: s.t1, set: s.set }));
window.DURATION = DURATION;

(async () => {
  const segs = await (await fetch('/audio/transcripcion.json')).json();
  subs = new Subtitles(document.getElementById('subs'), buildChunks(segs));
  await document.fonts.load('900 80px Mont'); await document.fonts.load('900 80px Cinzel');
  // precalentar todos los sets (texturas/shaders) para que el render sea estable
  const want = new URLSearchParams(location.search);
  if (!want.has('nowarm')) for (const sh of SHOTS) { const s = runShot(sh, sh.t0 + .01); renderer.compile(s.scene, camera); }
  window.ready = true; window.done = true;
  if (want.has('t')) window.renderFrame(parseFloat(want.get('t')));
})();
