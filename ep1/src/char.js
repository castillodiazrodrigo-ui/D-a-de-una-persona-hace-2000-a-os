// =====================================================================
//  PERSONAJES — caricatura 2D dibujada (estilo cabezas blancas)
//  Proporciones en unidades de R = radio de la cabeza:
//   cabeza Ø2 · cuerpo-cápsula 1.15×1.45 · piernas-palito 1.9 · total ≈ 5R
//  Brazos y piernas son trazos negros finos; manos y pies pequeños.
// =====================================================================
import { INK } from './core.js';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
export const R_M = .35;               // radio de la cabeza en metros (persona de ~1,75 m)

// ---------- FICHAS DE DISEÑO ----------
export const ROSTER = {
  // LEO (“yo”, el narrador). Cabeza redonda blanca, pelo negro despeinado,
  // buzo con capucha mostaza con cordones blancos y bolsillo canguro,
  // piernas-palito, zapatillas blancas. Curioso, impulsivo, expresivo.
  leo: { head: '#f8f6f1', hair: 'messy', body: '#e2a52f', bodyDark: '#b77d18', hood: true, pocket: true, strings: '#fbf6ea', shoes: '#f4f4f4', limb: INK },
  // EL OTRO: idéntico a Leo (misma ropa, mismo pelo). Sólo se ve en sombras
  // o en las cámaras; el rostro queda en penumbra.
  otro: { head: '#f8f6f1', hair: 'messy', body: '#e2a52f', bodyDark: '#b77d18', hood: true, pocket: true, strings: '#fbf6ea', shoes: '#f4f4f4', limb: INK, shadowFace: true },
  // Maniquíes de las tiendas: sin rostro, gris claro.
  mani: { head: '#d9d6cf', hair: null, body: '#bdb8ae', bodyDark: '#9a958b', faceless: true, shoes: '#bdb8ae', limb: '#8a857b' },
};

// ---------- EXPRESIONES ----------
export const EXPR = {
  neutral: { eye: 'dot', brow: 0, browAng: 0, mouth: .05, open: 0 },
  happy: { eye: 'dot', brow: .25, browAng: -.1, mouth: .9, open: .25, blush: .7 },
  joy: { eye: 'arc', brow: .5, browAng: -.1, mouth: 1, open: .8, blush: 1 },
  surprise: { eye: 'big', pupil: .5, brow: .9, browAng: 0, mouth: 0, open: .7, round: true },
  fear: { eye: 'big', pupil: .3, brow: .9, browAng: .45, mouth: -.5, open: .35, sweat: true, wavy: true },
  terror: { eye: 'big', pupil: .2, brow: 1.1, browAng: .55, mouth: -.6, open: 1, round: true, sweat: true },
  sad: { eye: 'dot', brow: .3, browAng: .5, mouth: -.8, open: 0 },
  sleepy: { eye: 'half', brow: -.1, browAng: .05, mouth: 0, open: 0 },
  sleep: { eye: 'closed', brow: -.15, browAng: 0, mouth: .1, open: .15 },
  squint: { eye: 'line', brow: -.3, browAng: -.3, mouth: -.25, open: 0 },
  suspicious: { eye: 'half', brow: -.25, browAng: -.35, mouth: -.15, open: 0, smirk: true },
  confused: { eye: 'uneven', brow: .4, browAng: .3, browAsym: 1, mouth: -.2, open: 0 },
  frustrated: { eye: 'line', brow: -.4, browAng: -.5, mouth: -.6, open: .3, teeth: true },
  determined: { eye: 'dot', brow: -.3, browAng: -.35, mouth: .2, open: 0 },
  cold: { eye: 'dot', brow: .6, browAng: .45, mouth: -.4, open: .25, teeth: true, sweat: false },
  listen: { eye: 'dot', brow: .45, browAng: .15, browAsym: .6, mouth: -.1, open: 0 },
  yum: { eye: 'arc', brow: .3, browAng: 0, mouth: .8, open: 0, blush: .9 },
  shock: { eye: 'tiny', brow: 1.2, browAng: .2, mouth: -.3, open: .5, round: true, sweat: true },
};
function ex(e) { return typeof e === 'string' ? EXPR[e] : e; }

export function basePose() {
  return { facing: 1, turn: .35, lean: 0, bob: 0, sx: 1, sy: 1, hip: [0, -1.9],
    hf: [.75, -1.95], hb: [-.7, -1.95], ff: [.28, 0], fb: [-.28, 0], elbowF: 1, elbowB: 1, kneeF: 1, kneeB: 1,
    headTilt: 0, headOff: [0, 0], expr: 'neutral', look: [0, 0], talk: 0, fx: {}, holdF: null, holdB: null, rotF: 0, rotB: 0, back: false, alpha: 1, dark: 0 };
}

// ---------- ciclos ----------
const STRIDE = .5;
export function walk(distM, o = {}) {
  const S = o.stride || STRIDE; const cyc = 4 * S * R_M; const a = distM / cyc * Math.PI * 2, b = a + Math.PI; const lift = o.lift ?? .32;
  const foot = th => [Math.sin(th) * S, -Math.max(0, Math.cos(th)) * lift];
  const sw = o.swing ?? .5;
  return { ff: foot(a), fb: foot(b), hip: [0, -1.86], bob: -Math.abs(Math.cos(a)) * .09 + .04,
    hf: o.hf || [.35 - Math.sin(a) * sw, -1.85], hb: o.hb || [-.3 + Math.sin(a) * sw, -1.85], lean: o.lean ?? .05, headTilt: Math.sin(a * 2) * .02 };
}
export function stepsFor(d0, d1, stride = STRIDE) { const cyc = 4 * stride * R_M, out = []; const k0 = Math.ceil((d0 / cyc - .25) * 2), k1 = Math.floor((d1 / cyc - .25) * 2); for (let k = k0; k <= k1; k++) { const d = cyc * (.25 + k / 2); if (d > d0 && d <= d1) out.push(d); } return out; }
export function run(distM) { const p = walk(distM, { stride: .75, lift: .6, swing: .9, lean: .22 }); p.hf = [.6 - Math.sin(distM / (3 * R_M) * Math.PI * 2) * .7, -2.4]; p.hb = [-.3 + Math.sin(distM / (3 * R_M) * Math.PI * 2) * .7, -2.4]; p.elbowF = p.elbowB = 1.5; p.bob -= .12; return p; }
export function idle(t, o = {}) { const b = Math.sin(t * 2.2 + (o.seed || 0)) * .5 + .5; return { bob: b * .03, sy: 1 + b * .012, headTilt: Math.sin(t * 1.1 + (o.seed || 0)) * .03 }; }

// ---------- dibujo ----------
function limb(ctx, a, b, L, bend, w, col) {
  let dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-4;
  if (d > L) { const k = L / d; b = [a[0] + dx * k, a[1] + dy * k]; dx *= k; dy *= k; d = L; }
  const sag = Math.sqrt(Math.max(0, L * L - d * d) * 3 / 16) * bend; const nx = -dy / d, ny = dx / d;
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2 + nx * sag * 2, (a[1] + b[1]) / 2 + ny * sag * 2, b[0], b[1]);
  ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke(); return b;
}
function inkFill(ctx, fill, lw) { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(); }
function capsule(ctx, cx, top, w, h) { const r = Math.min(w / 2, .55); ctx.beginPath(); ctx.moveTo(cx - w / 2 + r, top); ctx.lineTo(cx + w / 2 - r, top); ctx.quadraticCurveTo(cx + w / 2, top, cx + w / 2, top + r); ctx.lineTo(cx + w / 2 + .03, top + h - r); ctx.quadraticCurveTo(cx + w / 2 + .03, top + h, cx + w / 2 - r, top + h); ctx.lineTo(cx - w / 2 + r, top + h); ctx.quadraticCurveTo(cx - w / 2 - .03, top + h, cx - w / 2 - .03, top + h - r); ctx.lineTo(cx - w / 2, top + r); ctx.quadraticCurveTo(cx - w / 2, top, cx - w / 2 + r, top); ctx.closePath(); }

export function drawItem(ctx, name, x, y, rot, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const lw = .06;
  if (name === 'phone') {
    ctx.beginPath(); ctx.roundRect(-.2, -.36, .4, .72, .06); inkFill(ctx, '#2a2c33', lw);
    ctx.beginPath(); ctx.roundRect(-.16, -.31, .32, .6, .03); ctx.fillStyle = o.screen || '#7fd0ff'; ctx.fill();
    if (o.light) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, -.1, 0, 0, -.1, 1.4); g.addColorStop(0, 'rgba(160,220,255,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-1.5, -1.6, 3, 3); }
  } else if (name === 'burger') {
    ctx.beginPath(); ctx.ellipse(0, -.12, .32, .17, 0, Math.PI, 0); inkFill(ctx, '#d99a45', lw);
    ctx.beginPath(); ctx.rect(-.33, -.12, .66, .07); inkFill(ctx, '#5fae3c', lw * .8);
    ctx.beginPath(); ctx.rect(-.3, -.05, .6, .09); inkFill(ctx, '#6a3a1e', lw * .8);
    ctx.beginPath(); ctx.ellipse(0, .06, .31, .08, 0, 0, Math.PI); inkFill(ctx, '#d99a45', lw);
  } else if (name === 'fries') {
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.rect(-.17 + i * .06, -.42 + (i % 2) * .06, .045, .3); inkFill(ctx, '#f2c94c', .03); }
    ctx.beginPath(); ctx.moveTo(-.22, -.18); ctx.lineTo(.22, -.18); ctx.lineTo(.17, .2); ctx.lineTo(-.17, .2); ctx.closePath(); inkFill(ctx, '#d9342b', lw);
  } else if (name === 'soda') {
    ctx.beginPath(); ctx.moveTo(-.16, -.3); ctx.lineTo(.16, -.3); ctx.lineTo(.12, .3); ctx.lineTo(-.12, .3); ctx.closePath(); inkFill(ctx, '#e8ecef', lw);
    ctx.fillStyle = '#d9342b'; ctx.fillRect(-.14, -.05, .27, .12);
    ctx.beginPath(); ctx.moveTo(.04, -.3); ctx.lineTo(.12, -.6); ctx.lineWidth = .05; ctx.strokeStyle = '#d9342b'; ctx.stroke();
  }
  ctx.restore();
}

/** Dibuja un personaje con los pies en (x,y) de pantalla, escala px por unidad R */
export function drawChar(ctx, D, pose, x, y, s, t = 0) {
  const P = Object.assign(basePose(), pose); const E = ex(P.expr);
  ctx.save(); ctx.translate(x, y); ctx.scale(s * P.facing * P.sx, s * P.sy); ctx.globalAlpha = P.alpha;
  const LW = .085, limbW = .085;
  const hip = [P.hip[0], P.hip[1] + P.bob];
  const lean = P.lean;
  const rot = (p, o) => { const c = Math.cos(lean), sn = Math.sin(lean); const dx = p[0] - o[0], dy = p[1] - o[1]; return [o[0] + dx * c - dy * sn, o[1] + dx * sn + dy * c]; };
  const bodyTop = hip[1] - 1.42;
  const shF = rot([hip[0] + .28, bodyTop + .32], hip), shB = rot([hip[0] - .28, bodyTop + .32], hip);
  const headC = rot([hip[0] + P.headOff[0], bodyTop - .78 + P.headOff[1]], hip);
  const limbCol = D.limb;
  // brazo trasero y pierna trasera
  const hB = limb(ctx, shB, [P.hb[0], P.hb[1] + P.bob * .6], 1.55, P.elbowB, limbW, limbCol);
  if (P.holdB) drawItem(ctx, P.holdB, hB[0], hB[1], P.rotB, P.itemB || {});
  ctx.beginPath(); ctx.arc(hB[0], hB[1], .1, 0, 7); ctx.fillStyle = limbCol; ctx.fill();
  const fB = limb(ctx, [hip[0] - .2, hip[1] - .05], P.fb, 1.92, -P.kneeB, limbW, limbCol); shoe(ctx, fB, D, P.fbRot || 0);
  const fF = limb(ctx, [hip[0] + .2, hip[1] - .05], P.ff, 1.92, -P.kneeF, limbW, limbCol); shoe(ctx, fF, D, P.ffRot || 0);
  // cuerpo (cápsula) con ropa
  ctx.save(); ctx.translate(hip[0], hip[1]); ctx.rotate(lean); ctx.translate(-hip[0], -hip[1]);
  capsule(ctx, hip[0], bodyTop, 1.15, 1.5); inkFill(ctx, D.body, LW);
  ctx.save(); capsule(ctx, hip[0], bodyTop, 1.15, 1.5); ctx.clip();
  const g = ctx.createLinearGradient(hip[0] - .6, 0, hip[0] + .6, 0); g.addColorStop(0, 'rgba(0,0,0,.22)'); g.addColorStop(.45, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,255,255,.08)'); ctx.fillStyle = g; ctx.fillRect(hip[0] - .7, bodyTop, 1.4, 1.6);
  if (D.hood) { ctx.fillStyle = D.bodyDark; ctx.fillRect(hip[0] - .7, hip[1] - .17, 1.4, .2); }
  if (D.pocket) { ctx.beginPath(); ctx.roundRect(hip[0] - .3, hip[1] - .62, .6, .36, .1); ctx.fillStyle = D.bodyDark; ctx.fill(); ctx.lineWidth = .035; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke(); }
  ctx.restore();
  if (D.hood && !P.back) { ctx.beginPath(); ctx.ellipse(hip[0], bodyTop + .06, .48, .17, 0, 0, Math.PI); ctx.lineWidth = .07; ctx.strokeStyle = D.bodyDark; ctx.stroke();
    if (D.strings) { ctx.lineWidth = .045; ctx.strokeStyle = D.strings; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hip[0] + sd * .13, bodyTop + .18); ctx.lineTo(hip[0] + sd * .15 + Math.sin(t * 3 + sd) * .02, bodyTop + .55); ctx.stroke(); } } }
  if (D.hood && P.back) { ctx.beginPath(); ctx.ellipse(hip[0], bodyTop + .3, .42, .32, 0, 0, 7); inkFill(ctx, D.bodyDark, .05); }
  ctx.restore();
  // cabeza
  ctx.save(); ctx.translate(headC[0], headC[1] + .9); ctx.rotate(P.headTilt); ctx.translate(0, -.9);
  head(ctx, D, P, E, t);
  ctx.restore();
  // brazo delantero
  const hF = limb(ctx, shF, [P.hf[0], P.hf[1] + P.bob * .6], 1.55, -P.elbowF, limbW, limbCol);
  if (P.holdF) drawItem(ctx, P.holdF, hF[0], hF[1], P.rotF, P.itemF || {});
  ctx.beginPath(); ctx.arc(hF[0], hF[1], .1, 0, 7); ctx.fillStyle = limbCol; ctx.fill();
  // oscurecimiento (siluetas en penumbra)
  ctx.restore();
}
function shoe(ctx, p, D, r) { ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(r); ctx.beginPath(); ctx.ellipse(.1, -.07, .2, .1, 0, 0, 7); inkFill(ctx, D.shoes, .06); ctx.restore(); }

function head(ctx, D, P, E, t) {
  const turn = P.back ? 0 : P.turn;
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fillStyle = D.head; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.clip();
  const g = ctx.createRadialGradient(-.25 + turn * .2, -.35, .1, 0, 0, 1.2); g.addColorStop(0, 'rgba(255,255,255,.4)'); g.addColorStop(.7, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(110,90,70,.25)');
  ctx.fillStyle = g; ctx.fillRect(-1.1, -1.1, 2.2, 2.2);
  if (D.shadowFace) { const gd = ctx.createLinearGradient(0, -1, 0, 1); gd.addColorStop(0, 'rgba(10,10,14,.15)'); gd.addColorStop(.35, 'rgba(10,10,14,.92)'); gd.addColorStop(1, 'rgba(10,10,14,.97)'); ctx.fillStyle = gd; ctx.fillRect(-1.1, -1.1, 2.2, 2.2); }
  // pelo
  if (D.hair === 'messy') {
    ctx.beginPath();
    if (P.back) { ctx.moveTo(-1.05, -.05); ctx.quadraticCurveTo(-1.1, -1.15, 0, -1.1); ctx.quadraticCurveTo(1.1, -1.15, 1.05, -.05); for (let i = 0; i <= 8; i++) ctx.lineTo(1.0 - i * .25, (i % 2 ? -.02 : .14) - Math.sin(i / 8 * Math.PI) * .05); ctx.closePath(); }
    else { const o = turn * .25; ctx.moveTo(-1.05, -.15); ctx.quadraticCurveTo(-1.05, -1.15, 0, -1.08); ctx.quadraticCurveTo(1.05, -1.15, 1.05, -.15);
      ctx.lineTo(.78 + o, -.42); ctx.lineTo(.62 + o, -.3); ctx.lineTo(.42 + o, -.52); ctx.lineTo(.2 + o, -.36); ctx.lineTo(-.02 + o, -.56); ctx.lineTo(-.25 + o, -.38); ctx.lineTo(-.48 + o, -.55); ctx.lineTo(-.68 + o, -.33); ctx.lineTo(-.86, -.45); ctx.closePath(); }
    ctx.fillStyle = '#17120f'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = .05; ctx.beginPath(); ctx.arc(-.3, -.75, .35, -2.6, -1.6); ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.lineWidth = .11; ctx.strokeStyle = INK; ctx.stroke();
  if (D.faceless || P.back) return;
  if (D.shadowFace) { // sólo dos puntos de luz en la penumbra
    if (P.eyesGlow) { for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(turn * .3 + sd * .3, .05, .06, 0, 7); ctx.fillStyle = `rgba(255,255,255,${P.eyesGlow})`; ctx.fill(); } }
    if (P.smile) { ctx.beginPath(); ctx.moveTo(turn * .3 - .3, .42); ctx.quadraticCurveTo(turn * .3, .62 + .1 * P.smile, turn * .3 + .3, .42); ctx.lineWidth = .05; ctx.strokeStyle = `rgba(255,255,255,${P.smile})`; ctx.stroke(); }
    return;
  }
  const fx = turn * .32 + P.look[0] * .06, fy = .02 + P.look[1] * .06;
  const sp = .33 * (1 - Math.abs(turn) * .15);
  const blink = blinkK(t, D);
  for (const sd of [-1, 1]) {
    const exx = fx + sd * sp, ey = fy - .02;
    ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineCap = 'round';
    let kind = E.eye; if (blink < .2 && (kind === 'dot' || kind === 'big' || kind === 'uneven' || kind === 'tiny')) kind = 'closed';
    if (kind === 'dot') { ctx.beginPath(); ctx.ellipse(exx + P.look[0] * .04, ey + P.look[1] * .04, .085, .11 * Math.max(.15, blink), 0, 0, 7); ctx.fill(); }
    else if (kind === 'tiny') { ctx.beginPath(); ctx.arc(exx, ey, .045, 0, 7); ctx.fill(); }
    else if (kind === 'uneven') { const r = sd > 0 ? .13 : .075; ctx.beginPath(); ctx.ellipse(exx, ey, r * .8, r, 0, 0, 7); ctx.fill(); }
    else if (kind === 'big') { ctx.beginPath(); ctx.ellipse(exx, ey, .2, .24, 0, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = .05; ctx.stroke();
      const pr = .055 + (E.pupil ?? .5) * .05; ctx.beginPath(); ctx.arc(exx + P.look[0] * .07, ey + P.look[1] * .07, pr, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
    else if (kind === 'half') { ctx.beginPath(); ctx.ellipse(exx, ey + .03, .09, .06, 0, 0, Math.PI); ctx.fill(); ctx.lineWidth = .045; ctx.beginPath(); ctx.moveTo(exx - .12, ey + .02); ctx.lineTo(exx + .12, ey + .02); ctx.stroke(); }
    else if (kind === 'line') { ctx.lineWidth = .055; ctx.beginPath(); ctx.moveTo(exx - .11, ey); ctx.lineTo(exx + .11, ey + sd * .01); ctx.stroke(); }
    else if (kind === 'closed') { ctx.lineWidth = .05; ctx.beginPath(); ctx.arc(exx, ey - .02, .1, .2, Math.PI - .2); ctx.stroke(); }
    else if (kind === 'arc') { ctx.lineWidth = .055; ctx.beginPath(); ctx.arc(exx, ey + .06, .11, Math.PI + .25, -.25); ctx.stroke(); }
    // cejas
    const br = E.brow || 0, ang = E.browAng || 0, asym = (E.browAsym || 0) * (sd > 0 ? .12 : -.02);
    const by = ey - .26 - br * .12 - asym - (kind === 'big' ? .1 : 0);
    ctx.lineWidth = .07; ctx.beginPath();
    const xi = exx - sd * .13, xo = exx + sd * .14;
    ctx.moveTo(xo, by + ang * .08); ctx.lineTo(xi, by - ang * .12); ctx.stroke();
  }
  // nariz mínima
  if (Math.abs(turn) > .25) { ctx.lineWidth = .04; ctx.beginPath(); const nx = fx + Math.sign(turn) * .12; ctx.arc(nx, fy + .17, .06, -1.2 * Math.sign(turn), 1.2 * Math.sign(turn), turn < 0); ctx.stroke(); }
  if (E.blush) { ctx.fillStyle = `rgba(240,120,110,${.35 * E.blush})`; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(fx + sd * (sp + .17), fy + .2, .12, .07, 0, 0, 7); ctx.fill(); } }
  // boca
  const talk = P.talk ? (.35 + .65 * Math.abs(Math.sin(t * 14) * Math.sin(t * 6.3 + 1))) * P.talk : 0;
  const mo = clamp((E.open || 0) + talk, 0, 1.2), mc = E.mouth || 0, mx = fx + (E.smirk ? .06 : 0), my = fy + .42, mw = .2;
  ctx.lineWidth = .06; ctx.strokeStyle = INK; ctx.lineCap = 'round';
  if (mo < .1) {
    ctx.beginPath();
    if (E.wavy) { ctx.moveTo(mx - mw, my); for (let i = 1; i <= 4; i++) ctx.lineTo(mx - mw + i * mw / 2, my + (i % 2 ? -.04 : .04)); }
    else { ctx.moveTo(mx - mw, my - mc * .06 - (E.smirk ? -.03 : 0)); ctx.quadraticCurveTo(mx, my + mc * .14, mx + mw, my - mc * .06 - (E.smirk ? .05 : 0)); }
    ctx.stroke();
  } else if (E.round) { ctx.beginPath(); ctx.ellipse(mx, my + .02, .07 + mo * .06, .06 + mo * .12, 0, 0, 7); inkFill(ctx, '#3a1410', .04); }
  else { ctx.beginPath(); ctx.moveTo(mx - mw, my - mc * .05); ctx.quadraticCurveTo(mx, my + mc * .08, mx + mw, my - mc * .05); ctx.quadraticCurveTo(mx, my + mo * .3 + mc * .1, mx - mw, my - mc * .05); ctx.closePath(); inkFill(ctx, '#3a1410', .04);
    if (E.teeth) { ctx.fillStyle = '#fff'; ctx.fillRect(mx - mw * .7, my - .015, mw * 1.4, .05); }
    else if (mo > .4) { ctx.save(); ctx.clip(); ctx.fillStyle = '#d0564b'; ctx.beginPath(); ctx.ellipse(mx, my + mo * .26, mw * .6, .07, 0, 0, 7); ctx.fill(); ctx.restore(); } }
  // efectos de cabeza
  const F = P.fx || {};
  if (E.sweat || F.sweat) { const k = (t * .6) % 1; const sx = .82, sy = -.45 + k * .25; ctx.beginPath(); ctx.moveTo(sx, sy - .18); ctx.quadraticCurveTo(sx + .13, sy + .02, sx, sy + .06); ctx.quadraticCurveTo(sx - .13, sy + .02, sx, sy - .18); inkFill(ctx, '#9fd6f2', .035); }
  if (F.zzz) { ctx.fillStyle = INK; for (let i = 0; i < 3; i++) { const k = (t * .55 + i / 3) % 1; ctx.globalAlpha = Math.sin(k * Math.PI); ctx.font = `900 ${.3 + k * .4}px Mont`; ctx.fillText('Z', .7 + k * .8, -1 - k * 1.1); } ctx.globalAlpha = 1; }
  if (F.shiver) { ctx.lineWidth = .045; for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(sd * (1.18 + i * .16), -.18 + i * .1); ctx.lineTo(sd * (1.28 + i * .16), -.05 + i * .1); ctx.lineTo(sd * (1.18 + i * .16), .08 + i * .1); ctx.stroke(); } }
  if (F.exclaim) { ctx.globalAlpha = F.exclaim; ctx.fillStyle = '#e8352b'; ctx.font = '900 .9px Mont'; ctx.lineWidth = .1; ctx.strokeStyle = INK; ctx.strokeText('!', .95, -.95); ctx.fillText('!', .95, -.95); ctx.globalAlpha = 1; }
  if (F.question) { ctx.globalAlpha = F.question; ctx.fillStyle = '#fff'; ctx.font = '900 .8px Mont'; ctx.lineWidth = .1; ctx.strokeStyle = INK; ctx.strokeText('?', .9, -.95); ctx.fillText('?', .9, -.95); ctx.globalAlpha = 1; }
  if (F.sparkle) { ctx.strokeStyle = '#ffd64a'; ctx.lineWidth = .06; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + .4; const r0 = 1.25 + F.sparkle * .1; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * (r0 + .3 * F.sparkle), Math.sin(a) * (r0 + .3 * F.sparkle)); ctx.stroke(); } }
}
function blinkK(t, D) { if (D.noBlink) return 1; const per = 3.3; const ph = (t % per) / per; const k = (ph - .955) / .045; return k > 0 ? Math.abs(k * 2 - 1) : 1; }
