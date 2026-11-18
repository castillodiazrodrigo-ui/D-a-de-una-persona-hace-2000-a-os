// Poses compuestas y utilidades de coreografía reutilizables por los planos
import { lerp, clamp, smooth, inv, win, pulse } from '../core/math.js';
import { walk, idle, sit, blendPose } from '../characters/poses.js';
export { lerp, clamp, smooth, inv, win, pulse, walk, idle, sit, blendPose };
export const PI = Math.PI;
// Tumbado en la cama (la tarjeta rota 90°; la cabeza hacia -X)
export const lying = (o = {}) => ({ roll: PI / 2, yaw: 0, hip: [0, -33], ff: [3, 0], fb: [-3, 0], hf: [7, -36], hb: [-5, -36], expr: 'sleep', turn: .15, contact: false, ...o });
// Recorrido a velocidad constante con arranque/parada suaves -> devuelve distancia
export function travel(lt, t0, t1, dist) { const k = clamp((lt - t0) / (t1 - t0)); const e = k < .15 ? (k * k) / (.3) : k > .85 ? 1 - ((1 - k) ** 2) / .3 : (k - .075) / .85; return clamp(e) * dist; }
// Mezcla temporal entre poses: [[t, pose], ...]
export function poseTrack(lt, list, d = .25) {
  let p = list[0][1];
  for (let i = 1; i < list.length; i++) { const [tt, pp] = list[i]; if (lt >= tt - d) p = blendPose(p, pp, smooth((lt - tt + d) / d)); }
  return p;
}
