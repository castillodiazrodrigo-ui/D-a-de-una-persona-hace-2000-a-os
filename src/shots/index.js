// Ensambla la línea de tiempo completa a partir de los tres actos.
import { SHOTS as A1 } from './act1.js';
import { SHOTS as A2 } from './act2.js';
import { SHOTS as A3 } from './act3.js';
export const DURATION = 67.787750;   // duración exacta del audio (ffprobe)
export const SHOTS = [...A1, ...A2, ...A3].sort((a, b) => a.t0 - b.t0);
SHOTS.forEach((s, i) => { s.t1 = SHOTS[i + 1] ? SHOTS[i + 1].t0 : DURATION; });
export { LABELS, OVERLAY_FX } from './labels.js';
