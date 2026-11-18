// =====================================================================
//  BIBLIOTECA DE POSES Y CICLOS DE ANIMACIÓN (procedurales, deterministas)
// =====================================================================
import { lerp, clamp, smooth } from '../core/math.js';
import { UNIT, mixExpr } from './toon.js';

export const STRIDE = 9;                       // media zancada (unidades)
export const STRIDE_WORLD = 4 * STRIDE * UNIT; // distancia por ciclo completo (m)

// Ciclo de caminar a partir de la distancia recorrida => sin deslizamiento
export function walk(dist, o = {}) {
  const S = o.stride || STRIDE;
  const ph = dist / (4 * S * UNIT) * Math.PI * 2;
  const a = ph, b = ph + Math.PI;
  const lift = o.lift ?? 5;
  const foot = (th) => [Math.sin(th) * S, -Math.max(0, Math.cos(th)) * lift];
  const sw = o.swing ?? 7;
  return {
    ff: foot(a), fb: foot(b),
    ffRot: -Math.max(0, Math.cos(a)) * .25, fbRot: -Math.max(0, Math.cos(b)) * .25,
    hip: [0, -32.5], bob: -Math.abs(Math.cos(a)) * 1.3 + .6,
    hf: o.hf || [3 - Math.sin(a) * sw, -34 + Math.abs(Math.sin(a)) * -1.5],
    hb: o.hb || [-2 + Math.sin(a) * sw, -34 + Math.abs(Math.sin(a)) * -1.5],
    lean: o.lean ?? .06, headTilt: Math.sin(a * 2) * .015,
    _phase: ph,
  };
}
// Correr
export function run(dist) {
  const S = 13; const ph = dist / (4 * S * UNIT) * Math.PI * 2;
  const foot = (th) => [Math.sin(th) * S, -Math.max(0, Math.cos(th)) * 9];
  return { ff: foot(ph), fb: foot(ph + Math.PI), hip: [0, -31], bob: -Math.abs(Math.cos(ph)) * 3,
    hf: [6 - Math.sin(ph) * 9, -40], hb: [-2 + Math.sin(ph) * 9, -40], elbowF: 1.4, elbowB: 1.4, lean: .2, _phase: ph };
}
// Detecta pisadas entre dos distancias (para sincronizar SFX de pasos)
export function stepsBetween(d0, d1, stride = STRIDE) {
  const cyc = 4 * stride * UNIT, out = [];
  const half = cyc / 2;
  // pisada cuando cos(th) cruza 0 a negativo: th = pi/2 + k*pi -> d = cyc*(0.25 + k/2)
  const k0 = Math.ceil((d0 / cyc - .25) * 2), k1 = Math.floor((d1 / cyc - .25) * 2);
  for (let k = k0; k <= k1; k++) { const d = cyc * (.25 + k / 2); if (d > d0 && d <= d1) out.push(d); }
  return out;
}
// Respiración en reposo
export function idle(t, o = {}) {
  const br = Math.sin(t * 2.1 + (o.seed || 0)) * .5 + .5;
  return { hip: [0, -33 + br * .5], bob: br * .4, hf: o.hf || [7, -35 + br * .8], hb: o.hb || [-7, -35 + br * .8],
    ff: [5, 0], fb: [-5, 0], headTilt: Math.sin(t * .9 + (o.seed || 0)) * .03 };
}
// Sentado en un taburete (altura del asiento en unidades)
export function sit(t, seat = 26, o = {}) {
  const br = Math.sin(t * 2.1) * .5 + .5;
  return { hip: [0, -seat + br * .3], bob: 0, ff: [16, 0], fb: [10, 0], kneeF: -1, kneeB: -1,
    hf: o.hf || [12, -seat - 6], hb: o.hb || [6, -seat - 6], lean: o.lean ?? .05 };
}
// Señalar hacia un punto (dirección en unidades)
export function point(dirX, dirY) { return { hf: [8 + dirX * 24, -58 + dirY * 24], elbowF: .2 }; }
// Mano llevada a la boca (comer)
export function toMouth(k) { return { hf: [lerp(12, 8, k), lerp(-36, -74, k)], elbowF: 1 }; }
// Mezcla dos poses (sólo campos numéricos y arrays)
export function blendPose(a, b, k) {
  const o = { ...a };
  for (const key in b) {
    const va = a[key], vb = b[key];
    if (key === 'expr' && va && vb) { o.expr = mixExpr(va, vb, k); continue; }
    if (Array.isArray(vb) && Array.isArray(va)) o[key] = va.map((x, i) => lerp(x, vb[i], k));
    else if (typeof vb === 'number' && typeof va === 'number') o[key] = lerp(va, vb, k);
    else o[key] = k < .5 && va !== undefined ? va : vb;
  }
  return o;
}
