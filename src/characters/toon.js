// =====================================================================
//  TOON: personaje caricaturesco 2D dibujado en Canvas e integrado en 3D
//  como "billboard" cilíndrico (siempre de cara a la cámara), con sombra
//  proyectada real (tarjeta orientada a la luz) y sombra de contacto.
//  Unidades de dibujo: altura de un adulto = 100. Origen en los pies,
//  eje Y hacia abajo (convención Canvas), +X = hacia donde mira.
// =====================================================================
import * as THREE from 'three';
import { clamp, lerp } from '../core/math.js';

const CW = 1024, CH = 1536;          // resolución del lienzo
const PX_PER_WORLD = 640;            // px de lienzo por unidad de mundo
const FEET_PX = 96;                  // margen bajo los pies
const INK = '#17110d';               // tinta del contorno
export const UNIT = 1.7 / 100;       // 1 unidad de dibujo en metros (adulto 1.7 m)

// ---------- expresiones faciales (preset -> parámetros) ----------
export const EXPR = {
  neutral:   { eye: 1, eyeS: 1, brow: 0, browAng: 0, mouth: 0.1, open: 0, mw: 1 },
  happy:     { eye: 1, eyeS: 1, brow: 1, browAng: -0.1, mouth: 1, open: 0.15, mw: 1.15, blush: .6 },
  joy:       { eye: 0, eyeS: 1, brow: 1.5, browAng: -0.1, mouth: 1, open: .7, mw: 1.2, blush: .8, happyClosed: true },
  surprise:  { eye: 1.45, eyeS: 1.25, brow: 3.2, browAng: 0, mouth: 0, open: .8, mw: .55, round: true },
  fear:      { eye: 1.5, eyeS: 1.15, brow: 2.6, browAng: .35, mouth: -.5, open: .25, mw: 1.2, tense: true },
  sad:       { eye: .8, eyeS: 1, brow: 1, browAng: .45, mouth: -.9, open: 0, mw: .9 },
  confident: { eye: .75, eyeS: 1, brow: -.3, browAng: -.15, mouth: .6, open: 0, mw: 1, smirk: .5 },
  angry:     { eye: .9, eyeS: 1, brow: -1, browAng: -.55, mouth: -.5, open: .1, mw: 1, tense: true },
  confused:  { eye: 1, eyeS: 1, brow: 1.2, browAng: .3, browAsym: 1, mouth: -.2, open: 0, mw: .8, wobble: true },
  sleepy:    { eye: .25, eyeS: 1, brow: -.2, browAng: .1, mouth: 0, open: 0, mw: .7 },
  sleep:     { eye: 0, eyeS: 1, brow: -.3, browAng: 0, mouth: .15, open: 0, mw: .6 },
  squint:    { eye: .12, eyeS: 1, brow: -.6, browAng: -.25, mouth: -.3, open: 0, mw: .9, tense: true },
  determined:{ eye: .85, eyeS: 1, brow: -.5, browAng: -.3, mouth: .35, open: 0, mw: 1 },
  talk:      { eye: 1, eyeS: 1, brow: .6, browAng: 0, mouth: .4, open: .4, mw: 1 },
  yum:       { eye: 0, eyeS: 1, brow: .8, browAng: 0, mouth: .9, open: 0, mw: 1, blush: .7, happyClosed: true },
  hot:       { eye: .55, eyeS: 1, brow: .4, browAng: .3, mouth: -.2, open: .3, mw: .9, blush: 1 },
  cold:      { eye: .9, eyeS: 1, brow: 1.4, browAng: .4, mouth: -.4, open: .1, mw: 1.1, tense: true, teeth: true },
};
export function mixExpr(a, b, k) {
  const A = typeof a === 'string' ? EXPR[a] : a, B = typeof b === 'string' ? EXPR[b] : b;
  const o = {};
  for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const va = A[key] ?? (typeof B[key] === 'boolean' ? false : 0), vb = B[key] ?? (typeof A[key] === 'boolean' ? false : 0);
    o[key] = typeof va === 'boolean' ? (k < .5 ? va : vb) : lerp(va, vb, k);
  }
  return o;
}

// ---------- pose por defecto ----------
export function basePose() {
  return {
    facing: 1, turn: .45, lean: 0, bob: 0, hip: [0, -33], squash: 1,
    headTilt: 0, headOff: [0, 0], neck: 0,
    hf: [9, -36], hb: [-8, -36],         // manos: delantera / trasera (relativas a pies)
    ff: [5, 0], fb: [-5, 0],             // pies
    elbowF: 1, elbowB: 1, kneeF: 1, kneeB: 1,
    expr: 'neutral', look: [0, 0], talk: 0,
    holdF: null, holdB: null, rotF: 0, rotB: 0, itemScale: 1,
    fx: null, // efectos extra (sudor, zzz, temblor...)
  };
}

// ---------- utilidades de dibujo ----------
function limb(ctx, a, b, L, bend, w, col, outline = 1.25) {
  let dx = b[0] - a[0], dy = b[1] - a[1];
  let d = Math.hypot(dx, dy) || 1e-3;
  if (d > L * 1.04) { const k = L * 1.04 / d; b = [a[0] + dx * k, a[1] + dy * k]; dx *= k; dy *= k; d = L * 1.04; }
  const sag = Math.sqrt(Math.max(0, L * L - d * d) * 3 / 16) * bend;
  const nx = -dy / d, ny = dx / d;
  const c = [(a[0] + b[0]) / 2 + nx * sag * 2, (a[1] + b[1]) / 2 + ny * sag * 2];
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]);
  ctx.strokeStyle = INK; ctx.lineWidth = w + outline * 2; ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  return b;
}
function blob(ctx, cx, cy, rx, ry, wob = [0, 0, 0, 0]) {
  // óvalo ligeramente irregular (4 cuadrantes con deformación)
  const k = .5523;
  const t = ry * (1 + wob[0]), r = rx * (1 + wob[1]), bt = ry * (1 + wob[2]), l = rx * (1 + wob[3]);
  ctx.beginPath();
  ctx.moveTo(cx, cy - t);
  ctx.bezierCurveTo(cx + r * k, cy - t, cx + r, cy - t * k, cx + r, cy);
  ctx.bezierCurveTo(cx + r, cy + bt * k, cx + r * k, cy + bt, cx, cy + bt);
  ctx.bezierCurveTo(cx - l * k, cy + bt, cx - l, cy + bt * k, cx - l, cy);
  ctx.bezierCurveTo(cx - l, cy - t * k, cx - l * k, cy - t, cx, cy - t);
  ctx.closePath();
}
function inkFill(ctx, fill, lw = 1.3) {
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = lw * 2; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
}
function shade(hex, k) { // aclara (k>0) u oscurece (k<0)
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

// ---------- objetos en la mano (2D, mismo estilo de tinta) ----------
export function drawItem(ctx, name, x, y, rot, s = 1, extra = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const lw = 1.1;
  switch (name) {
    case 'jar': { // jarra/hidria de terracota
      const fill = extra.fillLevel ?? 0;
      ctx.beginPath();
      ctx.moveTo(-2.5, -2); ctx.bezierCurveTo(-8, 0, -8, 13, -3.5, 15); ctx.lineTo(3.5, 15);
      ctx.bezierCurveTo(8, 13, 8, 0, 2.5, -2); ctx.lineTo(3, -5); ctx.lineTo(-3, -5); ctx.closePath();
      inkFill(ctx, '#b65a32', lw);
      ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(1.5, -6, 8, 22);
      ctx.strokeStyle = '#e4b07a'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-7, 5); ctx.lineTo(7, 5); ctx.stroke();
      if (fill > 0) { ctx.fillStyle = 'rgba(120,190,230,.0)'; }
      ctx.restore();
      ctx.beginPath(); ctx.arc(6.5, 3, 3.2, -1.3, 1.6); ctx.lineWidth = 3.3; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 1.3; ctx.strokeStyle = '#b65a32'; ctx.stroke();
      if (extra.water) { // agua desbordando por la boca
        ctx.fillStyle = 'rgba(150,210,240,.9)'; ctx.beginPath(); ctx.ellipse(0, -5, 3, 1.2, 0, 0, 7); ctx.fill();
      }
      break;
    }
    case 'bread': {
      blob(ctx, 0, 0, 6.5, 4.8); inkFill(ctx, '#d79a4c', lw);
      ctx.strokeStyle = '#7a4a1e'; ctx.lineWidth = .8;
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 5.3, Math.sin(a) * 3.8); ctx.lineTo(-Math.cos(a) * 5.3, -Math.sin(a) * 3.8); ctx.stroke(); }
      if (extra.bite) { ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(6.5, -2.5, 3, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
      break;
    }
    case 'coin': {
      ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, 7); inkFill(ctx, '#d8a93a', .7);
      ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, 7); ctx.strokeStyle = '#8a6416'; ctx.lineWidth = .5; ctx.stroke();
      break;
    }
    case 'hammer': {
      ctx.beginPath(); ctx.rect(-1, -18, 2, 20); inkFill(ctx, '#8a5a30', .9);
      ctx.beginPath(); ctx.rect(-5, -23, 10, 5.5); inkFill(ctx, '#6f747a', .9);
      break;
    }
    case 'lamp': { // lucerna de aceite
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.bezierCurveTo(-6, -4, 4, -4, 7, -1.5); ctx.lineTo(8.5, -2); ctx.lineTo(8.5, .5); ctx.bezierCurveTo(4, 2.5, -6, 3, -6, 0); ctx.closePath();
      inkFill(ctx, '#a8562e', lw);
      ctx.beginPath(); ctx.arc(-1, -2.3, 1.3, 0, 7); ctx.fillStyle = '#5a2a12'; ctx.fill();
      break;
    }
    case 'torch': {
      ctx.beginPath(); ctx.rect(-1.2, -16, 2.4, 22); inkFill(ctx, '#6b4423', .9);
      ctx.beginPath(); ctx.rect(-2, -18, 4, 4); inkFill(ctx, '#3d2a1a', .8);
      break;
    }
    case 'amphora': {
      ctx.beginPath();
      ctx.moveTo(-1.5, -16); ctx.lineTo(-1.8, -12); ctx.bezierCurveTo(-8, -10, -8, 8, 0, 18);
      ctx.bezierCurveTo(8, 8, 8, -10, 1.8, -12); ctx.lineTo(1.5, -16); ctx.closePath();
      inkFill(ctx, '#c06a3a', lw);
      ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(2, -16, 8, 36); ctx.restore();
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-2, -14); ctx.quadraticCurveTo(-6, -14, -5.5, -9); ctx.moveTo(2, -14); ctx.quadraticCurveTo(6, -14, 5.5, -9); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#c06a3a'; ctx.stroke();
      break;
    }
    case 'cup': {
      ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(3, -4); ctx.lineTo(2.2, 3); ctx.lineTo(-2.2, 3); ctx.closePath(); inkFill(ctx, '#b0683c', .9);
      break;
    }
    case 'bowl': {
      ctx.beginPath(); ctx.moveTo(-6, -1); ctx.quadraticCurveTo(0, 7, 6, -1); ctx.closePath(); inkFill(ctx, '#9c5a34', .9);
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-3.6 + i * 1.8, -1.4 - (i % 2) * .8, 1.1, 0, 7); inkFill(ctx, '#4b5a2a', .5); }
      break;
    }
    case 'scroll': {
      ctx.beginPath(); ctx.rect(-5, -3, 10, 6); inkFill(ctx, '#efe0b8', .8);
      ctx.beginPath(); ctx.arc(-5, 0, 3, 0, 7); inkFill(ctx, '#e2cf9e', .8);
      ctx.beginPath(); ctx.arc(5, 0, 3, 0, 7); inkFill(ctx, '#e2cf9e', .8);
      break;
    }
    case 'reins': {
      ctx.strokeStyle = '#4a2e18'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, 8, 28, 4); ctx.stroke();
      break;
    }
    case 'fan': { // abanico de hoja de palma (verano)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-6, -12); ctx.quadraticCurveTo(0, -16, 6, -12); ctx.closePath(); inkFill(ctx, '#9fae5a', .8);
      break;
    }
  }
  ctx.restore();
}

// ---------- la clase del personaje ----------
export class Toon {
  /** @param {object} design ficha de diseño (ver roster.js) */
  constructor(design, opts = {}) {
    this.d = design;
    this.scale = design.scale || 1;
    this.canvas = document.createElement('canvas');
    this.canvas.width = CW; this.canvas.height = CH;
    this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 4;
    const w = CW / PX_PER_WORLD * this.scale, h = CH / PX_PER_WORLD * this.scale;
    const geo = new THREE.PlaneGeometry(w, h);
    geo.translate(0, h / 2 - FEET_PX / PX_PER_WORLD * this.scale, 0);
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, alphaTest: .5, side: THREE.DoubleSide, toneMapped: false, fog: true });
    this.mesh = new THREE.Mesh(geo, this.mat);
    // tarjeta invisible orientada hacia la luz: sólo proyecta la sombra
    this.shadowMat = new THREE.MeshBasicMaterial({ map: this.tex, alphaTest: .5, side: THREE.DoubleSide, colorWrite: false, depthWrite: false });
    this.caster = new THREE.Mesh(geo, this.shadowMat);
    this.caster.castShadow = true;
    this.caster.renderOrder = -1;
    // sombra de contacto (gradiente radial)
    this.contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: contactTex(), transparent: true, depthWrite: false, opacity: .55, color: 0x000000, polygonOffset: true, polygonOffsetFactor: -2 }));
    this.contact.rotation.x = -Math.PI / 2; this.contact.position.y = .006;
    this.contact.scale.set(.75 * this.scale, .32 * this.scale, 1);
    this.root = new THREE.Group();
    this.yaw = new THREE.Group();
    this.yaw.add(this.mesh);
    this.root.add(this.yaw, this.caster, this.contact);
    this.pose = basePose();
    this.tint = new THREE.Color(1, 1, 1);
    this.roll = 0;
    this.visible = true;
    this.lightDir = new THREE.Vector3(1, 1, 1);
    this.castShadow = opts.castShadow !== false;
  }
  setPos(x, y, z) { this.root.position.set(x, y, z); return this; }
  // actualiza orientación, tinte y redibuja la ilustración
  update(camera, pose, t = 0) {
    this.pose = Object.assign(basePose(), pose);
    this.root.visible = true;
    const p = this.root.getWorldPosition(_v);
    const cp = camera.getWorldPosition(_v2);
    this.yaw.rotation.y = this.pose.yaw ?? Math.atan2(cp.x - p.x, cp.z - p.z);
    this.roll = this.pose.roll ?? 0;
    this.root.scale.setScalar(this.pose.scale ?? 1);
    this.mesh.rotation.z = this.roll;
    // tarjeta de sombra: de frente a la luz
    this.caster.rotation.set(0, Math.atan2(this.lightDir.x, this.lightDir.z), 0);
    this.caster.rotateZ(this.roll);
    this.caster.visible = this.castShadow && this.roll === 0;
    this.caster.castShadow = this.castShadow;
    this.contact.visible = this.roll === 0 && this.pose.contact !== false;
    this.contact.material.opacity = (this.pose.contactOpacity ?? .55) * clamp(1 - (this.pose.air || 0) * 2.5, 0, 1);
    this.mat.color.copy(this.tint);
    if (Toon.skipDraw || window.HIDE) return;
    this.draw(t);
    this.tex.needsUpdate = true;
  }

  draw(t) {
    const ctx = this.ctx, P = this.pose, D = this.d;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, CW, CH);
    const s = PX_PER_WORLD * UNIT;     // px por unidad de dibujo
    ctx.setTransform(s * P.facing, 0, 0, s * P.squash, CW / 2, CH - FEET_PX);
    const H = D.headR || [17, 19];
    const skin = D.skin || '#fbf6ea';
    const skinB = shade(skin.startsWith('#') ? skin : '#fbf6ea', -.08);
    const lean = P.lean;
    const hip = [P.hip[0], P.hip[1] + P.bob];
    const torsoLen = D.torso || 30;
    // puntos del torso con inclinación
    const rot = (pt, ang, o) => { const c = Math.cos(ang), sn = Math.sin(ang); const x = pt[0] - o[0], y = pt[1] - o[1]; return [o[0] + x * c - y * sn, o[1] + x * sn + y * c]; };
    const shoulderC = rot([hip[0], hip[1] - torsoLen], lean, hip);
    const shF = rot([hip[0] + 7, hip[1] - torsoLen + 4], lean, hip);
    const shB = rot([hip[0] - 6, hip[1] - torsoLen + 4], lean, hip);
    const neck = rot([hip[0] + 1.5, hip[1] - torsoLen - 3], lean, hip);
    const headC = [neck[0] + P.headOff[0] + Math.sin(lean) * 4, neck[1] - H[1] + 2 + P.headOff[1]];
    const legL = D.leg || 34, armL = D.arm || 31;
    const legW = D.legW || 4.2, armW = D.armW || 3.5;
    const hipF = [hip[0] + 4, hip[1]], hipB = [hip[0] - 4, hip[1]];
    const toWorld = (p) => [p[0], p[1]];
    const hand = (k) => [P[k][0], P[k][1] + P.bob * .6];

    // --- capa trasera: brazo y pierna de atrás ---
    const backTone = shade('#fbf6ea', -.13);
    // pierna trasera
    const footB = limb(ctx, hipB, P.fb, legL, -P.kneeB, legW, backTone);
    this.foot(ctx, footB, shade(D.sandal || '#6a4426', -.2), P.fbRot || 0);
    // objeto en mano trasera (detrás del cuerpo)
    const hb = hand('hb');
    const handB = limb(ctx, shB, hb, armL, P.elbowB, armW, backTone);
    if (P.holdB) drawItem(ctx, P.holdB, handB[0], handB[1], P.rotB, P.itemScale, P.itemB || {});
    this.glove(ctx, handB, backTone, P.gripB);
    // --- pierna delantera ---
    const footF = limb(ctx, hipF, P.ff, legL, -P.kneeF, legW, skin);
    this.foot(ctx, footF, D.sandal || '#6a4426', P.ffRot || 0);
    // --- torso / ropa ---
    this.torso(ctx, hip, shoulderC, lean, torsoLen, t);
    // --- cabeza ---
    ctx.save();
    ctx.translate(headC[0], headC[1] + H[1] - 2); ctx.rotate(P.headTilt + (P.expr.wobble ? Math.sin(t * 3) * .04 : 0)); ctx.translate(0, -(H[1] - 2));
    this.head(ctx, H, skin, skinB, t);
    ctx.restore();
    // --- brazo delantero ---
    const hf = hand('hf');
    const handF = limb(ctx, shF, hf, armL, -P.elbowF, armW, skin);
    // manga corta sobre el hombro
    if (D.cloth !== 'towel') { ctx.beginPath(); ctx.ellipse(shF[0] - 1.2, shF[1] + 1.2, 3.6, 3.4, lean, 0, 7); inkFill(ctx, D.body, 1.0); }
    if (P.holdF) drawItem(ctx, P.holdF, handF[0], handF[1], P.rotF, P.itemScale, P.itemF || {});
    this.glove(ctx, handF, skin, P.gripF);
    // --- efectos ---
    if (P.fx) this.effects(ctx, P.fx, headC, H, t);
  }

  foot(ctx, p, col, r = 0) {
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(r);
    ctx.beginPath(); ctx.ellipse(2.4, -1.3, 4.6, 2.2, 0, 0, 7); inkFill(ctx, col, 1.0);
    ctx.restore();
  }
  glove(ctx, p, col, grip) {
    ctx.beginPath(); ctx.ellipse(p[0], p[1], 3.6, 3.3, 0, 0, 7); inkFill(ctx, col, 1.0);
    // pulgar
    ctx.beginPath(); ctx.ellipse(p[0] + 2.3, p[1] - 2.0, 1.4, 1.9, .6, 0, 7); inkFill(ctx, col, .85);
  }
  torso(ctx, hip, sh, lean, len, t) {
    const D = this.d, P = this.pose;
    ctx.save();
    ctx.translate(hip[0], hip[1]); ctx.rotate(lean);
    const wTop = (D.wTop || 10.5) * 1.08, wBot = (D.wBot || 15.5) * 1.18, hem = D.hem ?? 13;
    const cloth = D.cloth || 'tunic';
    const sway = Math.sin(t * 2.2) * .5;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(-wTop * .7, -len);
      ctx.quadraticCurveTo(0, -len - 3.5, wTop * .8, -len);
      ctx.bezierCurveTo(wTop + 2, -len * .55, wBot + 2.5, -len * .1, wBot + sway, hem);
      ctx.quadraticCurveTo(0, hem + 3, -wBot + sway, hem);
      ctx.bezierCurveTo(-wBot - 2.5, -len * .1, -wTop - 2, -len * .55, -wTop * .7, -len);
      ctx.closePath();
    };
    if (cloth === 'towel') {
      // torso desnudo blanco + toalla en la cintura
      ctx.beginPath(); blob(ctx, 0, -len * .5, wTop + 2.5, len * .55 + 1); inkFill(ctx, '#fbf6ea', 1.25);
      ctx.beginPath(); ctx.moveTo(-wBot, -3); ctx.lineTo(wBot, -3); ctx.lineTo(wBot - 1, hem - 2); ctx.quadraticCurveTo(0, hem, -wBot + 1, hem - 2); ctx.closePath(); inkFill(ctx, D.body, 1.2);
      ctx.strokeStyle = shade(D.body, -.25); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-wBot + 2, 1); ctx.lineTo(wBot - 2, 1); ctx.stroke();
      ctx.restore(); return;
    }
    path(); inkFill(ctx, D.body, 1.3);
    // volumen: sombreado lateral + brillo
    ctx.save(); path(); ctx.clip();
    const g = ctx.createLinearGradient(-wBot, 0, wBot, 0);
    g.addColorStop(0, 'rgba(0,0,0,.28)'); g.addColorStop(.45, 'rgba(0,0,0,0)'); g.addColorStop(.8, 'rgba(255,240,210,.12)'); g.addColorStop(1, 'rgba(0,0,0,.08)');
    ctx.fillStyle = g; ctx.fillRect(-wBot - 4, -len - 5, wBot * 2 + 8, len + hem + 10);
    // pliegues
    ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = .8;
    for (const fx of [-6, 1, 7]) { ctx.beginPath(); ctx.moveTo(fx * .6, -len * .2); ctx.quadraticCurveTo(fx + sway * .5, hem * .3, fx * 1.15 + sway, hem + 1); ctx.stroke(); }
    // clavi (franjas verticales de la túnica romana)
    if (D.clavi) { ctx.fillStyle = D.clavi; ctx.fillRect(-5.5, -len - 2, 1.7, len + hem + 4); ctx.fillRect(3.8, -len - 2, 1.7, len + hem + 4); }
    if (cloth === 'toga') { // drapeado diagonal
      ctx.fillStyle = D.toga || '#f1ead8'; ctx.beginPath(); ctx.moveTo(-wTop, -len - 2); ctx.lineTo(wTop + 3, -len - 2); ctx.lineTo(wBot + 4, hem * .4); ctx.lineTo(-wBot * .3, hem + 3); ctx.lineTo(-wBot - 3, hem + 3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = D.stripe || '#6b2a5c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(wTop + 2, -len - 1); ctx.lineTo(-wBot * .2, hem + 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = .8; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(wTop - i * 4, -len + i); ctx.lineTo(-wBot * .2 - i * 4, hem + 1); ctx.stroke(); }
    }
    if (cloth === 'cloak') { // paenula con capucha
      ctx.fillStyle = shade(D.body, -.15); ctx.beginPath(); ctx.moveTo(-wTop - 3, -len); ctx.quadraticCurveTo(0, -len * .3, wTop + 3, -len); ctx.lineTo(wTop + 4, -len * .55); ctx.quadraticCurveTo(0, -len * .1, -wTop - 4, -len * .55); ctx.closePath(); ctx.fill();
    }
    if (D.apron) { ctx.fillStyle = D.apron; ctx.beginPath(); ctx.moveTo(-6, -len * .45); ctx.lineTo(8, -len * .45); ctx.lineTo(10, hem); ctx.lineTo(-7, hem); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = .7; ctx.stroke(); }
    ctx.restore();
    // cinturón
    if (D.belt) {
      ctx.save(); path(); ctx.clip();
      ctx.fillStyle = D.belt; ctx.fillRect(-wBot - 4, -len * .42, wBot * 2 + 8, 2.6);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-wBot - 4, -len * .42 + 2.1, wBot * 2 + 8, .5);
      ctx.restore();
      if (D.pouch) { ctx.beginPath(); ctx.ellipse(-wBot + 3, -len * .3, 2.6, 3.2, .2, 0, 7); inkFill(ctx, D.pouch, .8); }
    }
    path(); ctx.lineWidth = 2.6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }

  head(ctx, H, skin, skinB, t) {
    const D = this.d, P = this.pose;
    const E = typeof P.expr === 'string' ? EXPR[P.expr] : P.expr;
    const turn = P.turn;
    const [rx, ry] = H;
    // accesorios traseros
    if (D.hair === 'bun') { ctx.beginPath(); ctx.arc(-rx * .8, -ry * .55, 6.2, 0, 7); inkFill(ctx, D.hairCol || '#3b2416', 1.1); }
    if (D.hair === 'scarf' || D.hood) {
      ctx.beginPath(); blob(ctx, -turn * 1.5, -1, rx + 3.4, ry + 3.4); inkFill(ctx, D.scarf || D.body, 1.2);
    }
    // cabeza
    blob(ctx, 0, 0, rx, ry, D.wob || [0, 0, .04, 0]);
    ctx.fillStyle = skin; ctx.fill();
    ctx.save(); ctx.clip();
    const g = ctx.createRadialGradient(rx * .35 + turn * 4, -ry * .4, 2, 0, 0, ry * 1.25);
    g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(.6, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,90,60,.22)');
    ctx.fillStyle = g; ctx.fillRect(-rx - 2, -ry - 2, rx * 2 + 4, ry * 2 + 4);
    ctx.restore();
    blob(ctx, 0, 0, rx, ry, D.wob || [0, 0, .04, 0]);
    ctx.lineWidth = 2.7; ctx.strokeStyle = INK; ctx.stroke();
    // oreja del lado opuesto al giro
    if (!D.hood && D.hair !== 'scarf') {
      const ex = -rx * (.95 - Math.abs(turn) * .1) * Math.sign(turn || 1);
      ctx.beginPath(); ctx.ellipse(ex, 2, 2.4, 3.6, 0, 0, 7); inkFill(ctx, skin, 1);
      blob(ctx, 0, 0, rx - 1.1, ry - 1.1); ctx.save(); ctx.clip(); ctx.restore();
    }
    // pelo / accesorios frontales
    if (D.hair === 'tuft') { ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-1, -ry); ctx.quadraticCurveTo(1, -ry - 5, 4, -ry - 3.5); ctx.moveTo(1, -ry + .3); ctx.quadraticCurveTo(4, -ry - 3, 7, -ry - 1); ctx.stroke(); }
    if (D.hair === 'bun' || D.hair === 'band') { ctx.beginPath(); ctx.moveTo(-rx * .95, -ry * .35); ctx.quadraticCurveTo(0, -ry * 1.25, rx * .95, -ry * .35); ctx.quadraticCurveTo(rx * .6, -ry * .7, 0, -ry * .78); ctx.quadraticCurveTo(-rx * .6, -ry * .7, -rx * .95, -ry * .35); inkFill(ctx, D.hairCol || '#3b2416', 1); }
    if (D.cap) { ctx.beginPath(); ctx.moveTo(-rx * .9, -ry * .45); ctx.quadraticCurveTo(-rx * .2, -ry * 1.55, rx * .8, -ry * .5); ctx.closePath(); inkFill(ctx, D.cap, 1.1); }
    if (D.laurel) {
      ctx.strokeStyle = '#3f6b2a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, -ry * .45, rx * 1.02, ry * .32, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      for (let i = 0; i < 9; i++) { const a = Math.PI * (1.08 + i * .1); const x = Math.cos(a) * rx * 1.02, y = -ry * .45 + Math.sin(a) * ry * .32; ctx.beginPath(); ctx.ellipse(x, y, 2.6, 1.2, a + .9, 0, 7); inkFill(ctx, D.laurel, .5); }
    }
    // --- rasgos ---
    const fx = turn * rx * .42 + P.look[0] * .6, fy = 1 + P.look[1] * .6;
    const sp = 6.4 * (1 - Math.abs(turn) * .22);
    const eyeY = fy - 1.5;
    const eo = clamp(E.eye ?? 1, 0, 2);
    const blinkK = this.blink(t);
    const open = eo * blinkK;
    for (const side of [-1, 1]) {
      const ex = fx + side * sp - turn * side * 1.2, ey = eyeY;
      const sz = (E.eyeS || 1) * (side === Math.sign(turn) ? 1.06 : .94);
      ctx.fillStyle = INK; ctx.strokeStyle = INK;
      if (E.happyClosed && eo < .3) {
        ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(ex, ey + 1, 2.1 * sz, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      } else if (open < .18) {
        ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ex - 2.1, ey + .4); ctx.quadraticCurveTo(ex, ey + 1.6, ex + 2.1, ey + .4); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.ellipse(ex + P.look[0] * .35, ey + P.look[1] * .35, 1.75 * sz * (open > 1.2 ? 1.12 : 1), 2.35 * sz * Math.min(open, 1.5), 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + .55 + P.look[0] * .35, ey - .8, .5 * sz, 0, 7); ctx.fill();
        if (open < .8) { // párpado superior caído
          ctx.fillStyle = skin; ctx.fillRect(ex - 2.6, ey - 3.6 * sz, 5.2, (1 - open) * 2.6 * sz);
          ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(ex - 2.3, ey - 3.6 * sz + (1 - open) * 2.6 * sz); ctx.lineTo(ex + 2.3, ey - 3.6 * sz + (1 - open) * 2.6 * sz); ctx.stroke();
        }
      }
      // cejas
      const br = E.brow || 0, asym = (E.browAsym || 0) * (side > 0 ? 1.4 : -.2);
      ctx.lineWidth = 1.35; ctx.lineCap = 'round';
      const by = ey - 5.2 - br * .9 - asym;
      const ang = (E.browAng || 0);
      const x1 = ex - 2.3, x2 = ex + 2.3;
      const yIn = by - ang * 2.4, yOut = by + ang * 1.2;
      ctx.beginPath();
      if (side < 0) { ctx.moveTo(x1, yOut); ctx.lineTo(x2, yIn); } else { ctx.moveTo(x1, yIn); ctx.lineTo(x2, yOut); }
      ctx.stroke();
    }
    // nariz mínima (indica la dirección)
    if (Math.abs(turn) > .15) { ctx.lineWidth = 1.0; ctx.strokeStyle = INK; ctx.beginPath(); const nx = fx + Math.sign(turn) * 2.6; ctx.arc(nx, eyeY + 4.4, 1.3, -1.2 * Math.sign(turn) + (turn < 0 ? Math.PI : 0), 1.4 * Math.sign(turn) + (turn < 0 ? Math.PI : 0)); ctx.stroke(); }
    // rubor
    const bl = E.blush || 0;
    if (bl > 0) { ctx.fillStyle = `rgba(232,120,110,${.35 * bl})`; for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(fx + side * (sp + 2.6), eyeY + 4.6, 2.6, 1.5, 0, 0, 7); ctx.fill(); } }
    // boca
    const talkOpen = P.talk ? (0.3 + 0.7 * Math.abs(Math.sin(t * 13.5) * Math.sin(t * 7.3 + 1))) * P.talk : 0;
    const mo = clamp((E.open || 0) + talkOpen, 0, 1.2), mc = E.mouth || 0, mw = (E.mw || 1) * 3.6;
    const mx = fx + (E.smirk ? 1 : 0), my = eyeY + 8.2;
    ctx.strokeStyle = INK; ctx.lineWidth = 1.25; ctx.lineCap = 'round';
    if (mo < .12) {
      ctx.beginPath(); ctx.moveTo(mx - mw, my - mc * .9 + (E.smirk ? -.7 : 0)); ctx.quadraticCurveTo(mx, my + mc * 2.2, mx + mw, my - mc * .9 - (E.smirk ? .8 : 0)); ctx.stroke();
      if (E.tense) { ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(mx - mw - .4, my - .8); ctx.lineTo(mx - mw - .4, my + .8); ctx.moveTo(mx + mw + .4, my - .8); ctx.lineTo(mx + mw + .4, my + .8); ctx.stroke(); }
    } else if (E.round) {
      ctx.beginPath(); ctx.ellipse(mx, my + .8, 1.6 + mo * .9, 1.3 + mo * 2.2, 0, 0, 7); inkFill(ctx, '#4a1d16', .6);
    } else {
      ctx.beginPath(); ctx.moveTo(mx - mw, my - mc * .8); ctx.quadraticCurveTo(mx, my + mc * 1.8 - .5, mx + mw, my - mc * .8);
      ctx.quadraticCurveTo(mx, my + mo * 5 + mc * 1.5, mx - mw, my - mc * .8); ctx.closePath(); inkFill(ctx, '#4a1d16', .6);
      if (E.teeth) { ctx.fillStyle = '#fff'; ctx.fillRect(mx - mw * .7, my - .4, mw * 1.4, .9); }
      else if (mo > .35) { ctx.save(); ctx.clip(); ctx.fillStyle = '#c4574e'; ctx.beginPath(); ctx.ellipse(mx, my + mo * 4.2 + mc, mw * .6, 1.6, 0, 0, 7); ctx.fill(); ctx.restore(); }
    }
  }
  blink(t) {
    if (this.pose.noBlink) return 1;
    const period = 3.1 + (this.d.seed || 0) * .37;
    const ph = ((t + (this.d.seed || 0) * .9) % period) / period;
    const k = (ph - .96) / .04;
    return k > 0 ? Math.abs(k * 2 - 1) * .95 + .05 : 1;
  }
  effects(ctx, fx, headC, H, t) {
    ctx.save(); ctx.translate(headC[0], headC[1]);
    if (fx.sweat) { for (let i = 0; i < 2; i++) { const y = -H[1] * .4 + ((t * 18 + i * 9) % 14); ctx.beginPath(); ctx.moveTo(H[0] + 2 + i * 3, y - 2.5); ctx.quadraticCurveTo(H[0] + 4 + i * 3, y + 1, H[0] + 2 + i * 3, y + 1.5); ctx.quadraticCurveTo(H[0] + i * 3, y + 1, H[0] + 2 + i * 3, y - 2.5); inkFill(ctx, '#bfe3f5', .5); } }
    if (fx.zzz) { ctx.fillStyle = INK; ctx.font = 'bold 7px sans-serif'; for (let i = 0; i < 3; i++) { const k = ((t * .6 + i / 3) % 1); ctx.globalAlpha = Math.sin(k * Math.PI); ctx.font = `bold ${4 + k * 5}px sans-serif`; ctx.fillText('z', H[0] * .4 + k * 12, -H[1] - k * 16); } ctx.globalAlpha = 1; }
    if (fx.shiver) { ctx.strokeStyle = INK; ctx.lineWidth = .8; for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(sd * (H[0] + 3 + i * 2.5), -3 + i * 2); ctx.lineTo(sd * (H[0] + 4.5 + i * 2.5), 0 + i * 2); ctx.lineTo(sd * (H[0] + 3 + i * 2.5), 3 + i * 2); ctx.stroke(); } }
    if (fx.spark) { ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 1.2; const k = fx.spark; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + .3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (H[0] + 4) * (1 + k * .2), -H[1] * .2 + Math.sin(a) * (H[1] + 4)); ctx.lineTo(Math.cos(a) * (H[0] + 8 + k * 4), -H[1] * .2 + Math.sin(a) * (H[1] + 8 + k * 4)); ctx.stroke(); } }
    if (fx.question) { ctx.fillStyle = INK; ctx.font = 'bold 12px sans-serif'; ctx.globalAlpha = fx.question; ctx.fillText('?', H[0] + 2, -H[1] - 2); ctx.globalAlpha = 1; }
    if (fx.exclaim) { ctx.fillStyle = INK; ctx.font = 'bold 13px sans-serif'; ctx.globalAlpha = fx.exclaim; ctx.fillText('!', H[0] + 1, -H[1] - 1); ctx.globalAlpha = 1; }
    if (fx.steam) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { const k = (t * .8 + i / 3) % 1; ctx.globalAlpha = Math.sin(k * Math.PI) * .7; ctx.beginPath(); ctx.moveTo(-6 + i * 6, -H[1] - k * 14); ctx.bezierCurveTo(-8 + i * 6, -H[1] - 4 - k * 14, -4 + i * 6, -H[1] - 8 - k * 14, -6 + i * 6, -H[1] - 12 - k * 14); ctx.stroke(); } ctx.globalAlpha = 1; }
    ctx.restore();
  }
}
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
let _ctex = null;
function contactTex() {
  if (_ctex) return _ctex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.5, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  _ctex = new THREE.CanvasTexture(c);
  // usamos alphaMap para oscurecer
  return _ctex;
}
