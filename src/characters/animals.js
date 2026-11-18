// =====================================================================
//  ANIMALES 2D en el mismo estilo de tinta (mula de tiro, gaviota, perro)
// =====================================================================
import { Toon, UNIT } from './toon.js';
const INK = '#17110d';
function ink(ctx, fill, lw = 1.2) { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw * 2; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(); }
function leg(ctx, x, y, ang, len, col) {
  const x2 = x + Math.sin(ang) * len, y2 = y + Math.cos(ang) * len;
  ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2);
  ctx.strokeStyle = INK; ctx.lineWidth = 6.4; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x2 + 1, y2 - 1, 2.8, 1.8, 0, 0, 7); ink(ctx, '#3a2a1a', .8);
}
// Mula: misma infraestructura de billboard que los personajes
export class Mule extends Toon {
  constructor() { super({ name: 'Mula', seed: 20, scale: 1.25 }); }
  draw(t) {
    const ctx = this.ctx, P = this.pose; const CW = this.canvas.width, CH = this.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, CW, CH);
    const s = 640 * UNIT; ctx.setTransform(s * P.facing, 0, 0, s, CW / 2, CH - 96);
    const ph = (P.walkPhase || 0), body = '#8a7a6a', dark = '#6a5a4c';
    const bob = Math.abs(Math.sin(ph)) * 1.2;
    ctx.translate(0, -bob);
    // patas traseras (más oscuras) y delanteras
    leg(ctx, -16, -30, Math.sin(ph + Math.PI) * .45, 30, dark); leg(ctx, 14, -30, Math.sin(ph) * .45, 30, dark);
    // cola
    ctx.beginPath(); ctx.moveTo(-24, -44); ctx.quadraticCurveTo(-32, -36 + Math.sin(t * 3) * 3, -29, -24); ctx.lineWidth = 4.5; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = dark; ctx.stroke();
    // cuerpo
    ctx.beginPath(); ctx.ellipse(0, -42, 26, 13, 0, 0, 7); ink(ctx, body, 1.3);
    ctx.beginPath(); ctx.ellipse(-2, -36, 20, 5, 0, 0, Math.PI); ctx.fillStyle = 'rgba(255,240,220,.18)'; ctx.fill();
    // arnés
    ctx.beginPath(); ctx.rect(8, -55, 5, 25); ink(ctx, '#5a3a20', .8);
    leg(ctx, -12, -30, Math.sin(ph) * .45, 30, body); leg(ctx, 18, -30, Math.sin(ph + Math.PI) * .45, 30, body);
    // cuello y cabeza
    const nod = Math.sin(ph * 2) * .05 + (P.nod || 0);
    ctx.save(); ctx.translate(22, -48); ctx.rotate(-.5 + nod);
    ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(4, -18); ctx.lineTo(14, -14); ctx.lineTo(8, 8); ctx.closePath(); ink(ctx, body, 1.2);
    ctx.restore();
    ctx.save(); ctx.translate(34, -66); ctx.rotate(.35 + nod);
    // orejas largas
    for (const [ox, a] of [[-4, -.3], [1, .1]]) { ctx.beginPath(); ctx.ellipse(ox, -12, 2.6, 8, a, 0, 7); ink(ctx, dark, 1); }
    ctx.beginPath(); ctx.ellipse(4, 0, 11, 7.5, .5, 0, 7); ink(ctx, body, 1.2);
    ctx.beginPath(); ctx.ellipse(11, 5, 5.5, 4.5, .4, 0, 7); ink(ctx, '#b8a898', 1);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(2, -2, 1.4, P.sleepy ? .4 : 1.8, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(12.5, 4.5, .8, 0, 7); ctx.fill();
    ctx.restore();
  }
}
// Gaviota (aleteo) — tarjeta pequeña
export class Gull extends Toon {
  constructor(seed = 1) { super({ name: 'Gaviota', seed, scale: .5 }); this.castShadow = false; }
  draw(t) {
    const ctx = this.ctx, P = this.pose; const CW = this.canvas.width, CH = this.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, CW, CH);
    const s = 640 * UNIT * .5 * 2.2; ctx.setTransform(s * P.facing, 0, 0, s, CW / 2, CH / 2);
    const f = Math.sin(t * 9 + this.d.seed * 2);
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 3.5, 0, 0, 7); ink(ctx, '#f4f2ec', 1);
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-1, -1); ctx.quadraticCurveTo(sd * 6, -8 - f * 8, sd * 15, -4 - f * 12); ctx.quadraticCurveTo(sd * 6, -2 - f * 3, 2, 0); ctx.closePath(); ink(ctx, sd > 0 ? '#e8e6e0' : '#d8d6d0', .9); }
    ctx.beginPath(); ctx.arc(7, -2, 3, 0, 7); ink(ctx, '#f4f2ec', .9);
    ctx.beginPath(); ctx.moveTo(9.5, -2); ctx.lineTo(13, -1); ctx.lineTo(9.5, -.5); ctx.fillStyle = '#e0a020'; ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(8, -3, .6, 0, 7); ctx.fill();
  }
}
