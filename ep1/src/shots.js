// =====================================================================
//  PLANOS DEL EPISODIO 1 — «Encerrado en el shopping»
//  Tiempos tomados de audio/transcripcion.json (Whisper, por palabra).
//  draw(ctx, c) dibuja el plano y devuelve efectos de pantalla.
// =====================================================================
import { W, H, View, Queue, glow, hash, INK } from './core.js';
import { lerp, clamp, smooth, inv, win, pulse, easeOut, easeInOut, backOut } from './math.js';
import { ROSTER, idle, walk, run, R_M, drawChar, drawItem } from './char.js';
import { corridor, entrance, putChar } from './env.js';
import { skyBG, exterior, fitting, escalator, foodcourt, megamap, vent, musicBox, security, phoneClose, clockClose } from './places.js';

export const DURATION = 71.000813;
const LEO = ROSTER.leo, OTRO = ROSTER.otro;
const NIGHT_T = 'rgba(70,90,160,.12)', EMER_T = 'rgba(20,50,60,.22)', MON_T = 'rgba(80,140,255,.14)';
const P = (t, o) => ({ ...idle(t), ...o });
const sit = (h, o = {}) => ({ hip: [0, -h / R_M], ff: [.75, 0], fb: [.5, 0], kneeF: -1, kneeB: -1, hf: [.6, -h / R_M - .3], hb: [.2, -h / R_M - .3], ...o });

// ---------- cámara de seguridad (CCTV) ----------
const off = {};
function offCanvas(key, w, h) { if (!off[key]) { off[key] = document.createElement('canvas'); off[key].width = w; off[key].height = h; } return off[key]; }
const CCTV_CAM = { p: [3.1, 2.85, 3.75], l: [-1.2, .75, -.2] };
function renderRoom(ctx2, w, h, t, S) {
  ctx2.setTransform(1, 0, 0, 1, 0, 0); ctx2.fillStyle = '#000'; ctx2.fillRect(0, 0, w, h);
  const cam = S.cam || CCTV_CAM; const dx = cam.l[0] - cam.p[0], dy = cam.l[1] - cam.p[1], dz = cam.l[2] - cam.p[2];
  const v = new View({ x: cam.p[0], y: cam.p[1], z: cam.p[2], yaw: Math.atan2(dx, dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)), f: S.f || .5, w, h });
  const q = new Queue(); security(q, v, t, { feeds: [], chairRot: S.chairRot ?? 0, steam: 0 });
  const out = { leo: v.P([.4, 1.45, 2.2]), fig: S.fig ? v.P([S.fig.x, 1.45, S.fig.z]) : null };
  if (S.leo !== false) putChar(q, v, LEO, P(t, { back: false, turn: .15, expr: S.leoExpr || 'neutral', look: [0, -.6], hf: [.5, -2.0] }), .4, 2.2, t, { tint: MON_T });
  if (S.fig) putChar(q, v, S.fig.color ? OTRO : ROSTER.otro, P(t + 2, { turn: .2, expr: 'neutral', eyesGlow: S.fig.eyes || 0, smile: S.fig.smile || 0, hf: [.4, -1.9], hb: [-.4, -1.9] }), S.fig.x, S.fig.z, t, { tint: S.fig.tint ?? 'rgba(0,0,0,.55)', shadow: false });
  q.flush(ctx2); return out;
}
function cctvPost(ctx, src, w, h, t, o = {}) {
  ctx.save(); ctx.imageSmoothingEnabled = true;
  ctx.filter = o.color ? 'saturate(.85) contrast(1.15) brightness(1.5)' : 'grayscale(1) contrast(1.3) brightness(1.7)';
  if (o.zoom) { const z = o.zoom; const cx = o.zx ?? w / 2, cy = o.zy ?? h / 2; ctx.drawImage(src, cx - w / 2 / z, cy - h / 2 / z, w / z, h / z, 0, 0, W, H); } else ctx.drawImage(src, 0, 0, W, H);
  ctx.filter = 'none';
  ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);
  ctx.globalAlpha = .12; for (let i = 0; i < 160; i++) { ctx.fillStyle = hash(i + Math.floor(t * 30)) > .5 ? '#fff' : '#000'; ctx.fillRect(hash(i * 3 + t) * W, hash(i * 7 + t * 2) * H, 6, 3); } ctx.globalAlpha = 1;
  ctx.font = '900 46px Mont'; ctx.fillStyle = '#e8ffe8'; ctx.textAlign = 'left'; ctx.fillText('CAM 07 · SEGURIDAD', 50, 110);
  const sec = Math.floor(14 * 60 + 22 + (t - 55)); ctx.fillText(`00:${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`, 50, 170);
  if (Math.floor(t * 2) % 2) { ctx.fillStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(W - 120, 100, 18, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.fillText('REC', W - 150, 115); }
  ctx.restore();
}
// fuentes estáticas para el muro de monitores (pasillos vistos desde arriba)
function corridorFeed(i, look) {
  const key = 'feed' + i + look; if (off[key]) return off[key];
  const c = offCanvas(key, 320, 180), x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 320, 180);
  const v = new View({ x: [-3, 2, 0, -1, 3][i % 5], y: 6, z: [-10, 4, 20, 34, 10][i % 5], yaw: [.4, -.3, .2, 3.0, -.6][i % 5], pitch: -.45, f: .55, w: 320, h: 180 });
  const q = new Queue(); corridor(q, v, 0, { look }); q.flush(x);
  x.filter = 'grayscale(1) contrast(1.3)'; x.drawImage(c, 0, 0); x.filter = 'none';
  return c;
}
function feeds(t, look, selfOpts) {
  const self = offCanvas('self', 320, 180); renderRoom(self.getContext('2d'), 320, 180, t, { ...selfOpts, f: .33 });
  const sx = self.getContext('2d'); sx.filter = 'grayscale(1) contrast(1.3)'; sx.drawImage(self, 0, 0); sx.filter = 'none';
  const arr = [0, 1, 2, 3, 4].map(i => corridorFeed(i, look)); arr.splice(1, 0, self);
  return arr;
}

// =====================================================================
export const SHOTS = [
  // S01 · 0.00–1.30 · «Me quedé encerrado» — el letrero del shopping se apaga
  { id: 'S01', t0: 0, place: 'exterior', sfx: [[0, 'amb_night_out', .8], [.05, 'riser', .5], [.45, 'clunk', .6], [.75, 'clunk', .6], [.95, 'power_down', .9]],
    draw(ctx, c) {
      skyBG(ctx); const v = c.cam([{ t: 0, p: [0, 2.6, -2], l: [0, 9, 30], f: .95 }, { t: 1.3, p: [0, 3.2, 6], l: [0, 8, 30], f: 1.05 }], { shake: .03 });
      const q = new Queue(); exterior(q, v, c.t, { signOff: smooth(inv(.25, 1.05, c.t)), lights: 1 - smooth(inv(.85, 1.05, c.t)) }); q.flush(ctx);
      return { flash: pulse(c.t, .95, .12) * .25 };
    } },
  // S02 · 1.30–2.50 · «en un shopping gigante» — plano general enorme, Leo diminuto
  { id: 'S02', t0: 1.3, place: 'corridor', sfx: [[1.3, 'amb_mall_night', .9], [1.32, 'whoosh', .5]],
    draw(ctx, c) {
      const v = c.cam([{ t: 0, p: [2.5, 9.2, -10], l: [0, 0, 26], f: .8 }, { t: 1.2, p: [1.8, 7.6, -8], l: [0, .5, 24], f: .85 }], { shake: .02 });
      const q = new Queue(); corridor(q, v, c.t, { noProps: z => z > 16 && z < 32 }); escalator(q, v, c.t, { z0: 20 });
      putChar(q, v, LEO, P(c.t, { turn: Math.sin(c.lt * 3) * .6, expr: 'confused', fx: { question: smooth(inv(.4, .7, c.lt)) } }), 0, 4, c.t, { tint: NIGHT_T });
      q.flush(ctx); return {};
    } },
  // S03 · 2.50–4.30 · «y no estaba solo» — primer plano; al fondo, una silueta
  { id: 'S03', t0: 2.5, place: 'corridor', sfx: [[2.55, 'drone_low', .7], [3.28, 'sting', 1], [3.75, 'heartbeat', .7]],
    draw(ctx, c) {
      const v = c.cam([{ t: 0, p: [.45, 1.55, 2.5], l: [.1, 1.35, 4.2], f: 1.0 }, { t: 1.8, p: [.25, 1.5, 2.95], l: [.05, 1.4, 4.2], f: 1.0 }]);
      const q = new Queue(); corridor(q, v, c.t, {});
      const figA = win(c.t, 2.75, 3.95, .15);
      if (figA > 0) putChar(q, v, OTRO, { turn: 0, alpha: figA, hf: [.4, -1.9], hb: [-.4, -1.9] }, 2.2, 22, c.t, { tint: 'rgba(4,5,10,.95)', shadow: false });
      const e = c.t < 3.26 ? 'neutral' : c.t < 3.7 ? 'surprise' : 'fear';
      putChar(q, v, LEO, P(c.t, { turn: c.t < 3.26 ? .25 : -.15, expr: e, look: c.t > 3.3 ? [-.6, 0] : [0, 0], headTilt: c.t > 3.3 ? -.06 : 0, fx: { exclaim: win(c.t, 3.3, 3.9, .08) } }), .05, 4.2, c.t, { tint: NIGHT_T });
      q.flush(ctx); return { flash: pulse(c.t, 3.28, .1) * .15 };
    } },
  // S04 · 4.30–6.40 · «eran las 10 y cuarto» — la pantalla del celular
  { id: 'S04', t0: 4.3, place: 'phone', sfx: [[4.35, 'phone_tap', .8], [5.25, 'tick', .5], [5.65, 'tick', .5]],
    draw(ctx, c) { const k = easeOut(inv(0, .4, c.lt)); phoneClose(ctx, c.t, { time: '22:15', date: 'SÁBADO 14', signal: 2, dy: (1 - k) * 500, rot: -.05 + Math.sin(c.t * 1.3) * .015 }); return {}; } },
  // S05 · 6.40–8.00 · «me había quedado dormido» — dormido en el probador
  { id: 'S05', t0: 6.4, place: 'fitting', sfx: [[6.42, 'amb_store', .6], [6.6, 'snore', .8], [7.6, 'snore', .7]],
    draw(ctx, c) {
      const v = c.cam([{ t: 0, p: [.35, 1.25, -.75], l: [-.55, .95, 1.0], f: .9 }, { t: 1.6, p: [.2, 1.15, -.45], l: [-.55, .95, 1.0], f: .95 }]);
      const q = new Queue(); fitting(q, v, c.t, { curtain: 0 });
      const br = Math.sin(c.t * 2.2);
      putChar(q, v, LEO, { ...sit(.5, { hf: [.4, -1.2], hb: [-.2, -1.25], lean: -.12 }), turn: .4, expr: 'sleep', headTilt: -.25 + br * .02, sy: 1 + br * .015, fx: { zzz: true } }, -.6, .9, c.t, { tint: 'rgba(90,60,110,.25)' });
      q.flush(ctx); glow(ctx, 540, 300, 700, 'rgba(255,200,170,.12)', 1); return {};
    } },
  // S06 · 8.00–9.05 · «en un probador» — exterior del probador, cortina cerrada
  { id: 'S06', t0: 8.0, place: 'fitting', sfx: [[8.1, 'snore', .5]],
    draw(ctx, c) {
      const v = c.cam([{ t: 0, p: [.6, 1.5, -5.0], l: [0, 1.2, 0], f: .95 }, { t: 1.05, p: [.4, 1.45, -4.4], l: [0, 1.2, 0], f: .95 }]);
      const q = new Queue(); fitting(q, v, c.t, { curtain: 0, sway: .3 }); q.flush(ctx);
      ctx.save(); ctx.font = '900 70px Mont'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.lineWidth = 12; ctx.strokeStyle = INK; const k = backOut(inv(.1, .4, c.lt)); ctx.translate(560, 560); ctx.scale(k, k); ctx.strokeText('ZZZ...', 0, 0); ctx.fillText('ZZZ...', 0, 0); ctx.restore();
      return {};
    } },
  // S07 · 9.05–11.80 · «Cuando salí todo estaba apagado» — abre la cortina y sale a la tienda a oscuras
  { id: 'S07', t0: 9.05, place: 'fitting', sfx: [[9.15, 'curtain', 1], [10.75, 'sting_small', .6]],
    draw(ctx, c) {
      const t = c.t, lt = c.lt; const op = easeOut(inv(9.12, 9.45, t));
      const d = clamp((t - 9.5) / .85) * 1.6;
      const v = c.cam([{ t: 0, p: [.5, 1.5, -4.6], l: [0, 1.2, 0], f: .95 }, { t: 1.4, p: [.3, 1.45, -3.9], l: [0, 1.15, -.6], f: 1.0 }, { t: 2.75, p: [.15, 1.4, -3.3], l: [0, 1.25, -1.2], f: 1.05 }]);
      const q = new Queue(); fitting(q, v, t, { curtain: op });
      const look = t > 10.4 ? Math.sin((t - 10.4) * 3.2) : 0;
      const pose = t < 9.5 ? P(t, { turn: 0, expr: 'sleepy', hf: [.9, -2.6], elbowF: .2 }) : t < 10.35 ? { ...walk(d), turn: 0, expr: 'sleepy' } : P(t, { turn: look * .8, expr: t > 10.78 ? 'surprise' : 'confused', look: [look, 0] });
      putChar(q, v, LEO, pose, 0, .4 - d, t, { tint: 'rgba(60,60,120,.32)' }); c.steps('leo', d, 'carpet', .6);
      q.flush(ctx); return {};
    } },
  // S08 · 11.80–14.00 · «las persianas bajas» — travelling junto a las persianas
  { id: 'S08', t0: 11.8, place: 'corridor', sfx: [[11.82, 'amb_mall_night', .8], [12.1, 'shutter_rattle', .7]],
    draw(ctx, c) {
      const d = c.lt * 1.3; const z = 6 + d;
      const v = c.cam([{ t: 0, p: [.9, 1.45, z - 2.6], l: [-3.4, 1.5, z + .9], f: .95 }]);
      const q = new Queue(); corridor(q, v, c.t, {});
      putChar(q, v, LEO, { ...walk(d), turn: -.25, expr: 'confused', look: [-.4, -.5] }, -3.6, z, c.t, { tint: NIGHT_T }); c.steps('leo', d, 'tile', .7);
      q.flush(ctx); return {};
    } },
  // S09 · 14.00–15.95 · «las puertas trabadas» — tira de la puerta encadenada
  { id: 'S09', t0: 14.0, place: 'entrance', sfx: [[14.15, 'chain_rattle', 1], [14.6, 'door_thud', .8], [15.1, 'chain_rattle', .8], [15.5, 'door_thud', .7]],
    draw(ctx, c) {
      const t = c.t; const pull = Math.max(0, Math.sin((t - 14.1) * 9)) * win(t, 14.1, 15.8, .1);
      const v = c.cam([{ t: 0, p: [3.4, 1.5, -9.4], l: [-.2, 1.3, -11.6], f: 1.0 }, { t: 1.95, p: [2.6, 1.45, -9.9], l: [-.1, 1.35, -11.6], f: 1.05 }]);
      const q = new Queue(); corridor(q, v, t, {}); entrance(q, v, t, { z: -12, rattle: pull });
      putChar(q, v, LEO, P(t, { facing: -1, turn: .2, expr: t > 14.6 ? 'frustrated' : 'determined', hf: [.95, -2.45], hb: [.85, -2.45], elbowF: .4, elbowB: .4, lean: -.18 * pull, fx: { sweat: t > 15 } }), .2, -11.0, t, { tint: NIGHT_T });
      q.flush(ctx); return {};
    } },
  // S10 · 15.95–17.70 · «mi celular sin señal» — las barras caen a cero
  { id: 'S10', t0: 15.95, place: 'phone', sfx: [[16.3, 'beep', .6], [16.7, 'beep', .6], [17.2, 'error', 1]],
    draw(ctx, c) { const sig = Math.max(0, 2 - Math.floor((c.t - 16.2) / .35)); phoneClose(ctx, c.t, { time: '22:31', signal: c.t < 16.2 ? 2 : sig, noSignal: backOut(inv(17.15, 17.4, c.t)), rot: Math.sin(c.t * 9) * .02 * win(c.t, 17.2, 17.7, .05) }); return {}; } },
  // S11 · 17.70–18.35 · salta con el celular en alto
  { id: 'S11', t0: 17.7, place: 'corridor', sfx: [[17.75, 'jump', .6], [18.05, 'land', .6]],
    draw(ctx, c) {
      const j = Math.abs(Math.sin((c.lt) * 5.2)) * .45;
      const v = c.cam([{ t: 0, p: [.5, 1.3, 1.6], l: [0, 1.6, 4], f: .95 }]);
      const q = new Queue(); corridor(q, v, c.t, {});
      putChar(q, v, LEO, P(c.t, { turn: .1, expr: 'frustrated', holdF: 'phone', itemF: { light: true }, hf: [.4, -5.6], elbowF: .1, rotF: .1, ff: [.2, -j / R_M * .4], fb: [-.25, -j / R_M * .3] }), 0, 4, c.t, { tint: NIGHT_T, y: j });
      q.flush(ctx); return {};
    } },
  // S12 · 18.35–20.50 · «Al principio fue increíble» — euforia
  { id: 'S12', t0: 18.35, place: 'corridor', sfx: [[18.4, 'music_fun_start', 0], [19.25, 'whoosh_up', .7], [19.35, 'sparkle', .8]],
    draw(ctx, c) {
      const t = c.t; const jump = Math.max(0, Math.sin((t - 19.1) * 4.5)) * win(t, 19.1, 19.8, .02) * .6;
      const v = c.cam([{ t: 0, p: [.1, .7, 1.4], l: [0, 2.1, 4.2], f: .95 }, { t: 2.15, p: [-.2, .75, 1.75], l: [0, 2.1, 4.2], f: .95 }]);
      const q = new Queue(); corridor(q, v, t, {});
      const arms = smooth(inv(18.9, 19.2, t));
      putChar(q, v, LEO, P(t, { turn: 0, expr: t > 19.1 ? 'joy' : 'happy', hf: [lerp(.6, 1.2, arms), lerp(-2, -5.4, arms)], hb: [lerp(-.6, -1.2, arms), lerp(-2, -5.4, arms)], elbowF: .3, elbowB: .3, fx: { sparkle: win(t, 19.2, 20.3, .1) } }), 0, 4.2, t, { tint: NIGHT_T, y: jump });
      q.flush(ctx);
      for (let i = 0; i < 26; i++) { const k = (t * .7 + hash(i)) % 1; if (t < 19.2) break; ctx.fillStyle = ['#ffd43b', '#ff5fa2', '#5fd0ff', '#7be38b'][i % 4]; ctx.save(); ctx.translate(hash(i * 3) * W, k * H); ctx.rotate(t * 3 + i); ctx.fillRect(-10, -5, 20, 10); ctx.restore(); }
      return {};
    } },
  // S13 · 20.50–23.35 · «las escaleras mecánicas eran para mí solo»
  { id: 'S13', t0: 20.5, place: 'escalator', sfx: [[20.5, 'escalator', .8], [22.2, 'chill', 0]],
    draw(ctx, c) {
      const k = .08 + c.lt * .11; const z0 = 20; const y = 4.2 * k + .18, z = z0 + 8 * k;
      const v = c.cam([{ t: 0, p: [3.3, y + 1.3, z - 1.6], l: [0, y + .95, z + .2], f: .95 }]);
      const q = new Queue(); corridor(q, v, c.t, { noProps: zz => zz > 16 && zz < 32 }); escalator(q, v, c.t, { z0, speed: .55 });
      putChar(q, v, LEO, { ...sit(.42, { hf: [.75, -2.6 + Math.sin(c.t * 2) * .05], hb: [-.5, -4.4], elbowF: .6, elbowB: 1.8, lean: -.25 }), holdF: 'soda', rotF: .2, turn: .55, expr: c.t > 22.0 ? 'yum' : 'happy', headTilt: -.08 + Math.sin(c.t * 2.4) * .06, bob: Math.sin(c.t * 4.8) * .03 }, 0, z, c.t, { tint: NIGHT_T, y, front: 1.5, shadow: false });
      q.flush(ctx); return {};
    } },
  // S14 · 23.35–26.20 · «tenía un patio de comidas entero»
  { id: 'S14', t0: 23.35, place: 'foodcourt', sfx: [[23.4, 'amb_foodcourt', .7], [23.9, 'pop', .6], [24.4, 'crunch', .8], [24.9, 'slurp', .8], [25.5, 'crunch', .6]],
    draw(ctx, c) {
      const t = c.t;
      const v = c.cam([{ t: 0, p: [-.4, 1.35, 4.7], l: [1.4, 1.1, 7.2], f: .95 }, { t: 1.4, p: [-.1, 1.3, 5.3], l: [1.4, 1.1, 7.2], f: 1.0 }, { t: 1.5, p: [-1.6, 2.4, 2.6], l: [1.3, .9, 7.2], f: .85 }, { t: 2.85, p: [-1.2, 2.3, 3.2], l: [1.3, .9, 7.2], f: .85 }]);
      const q = new Queue(); foodcourt(q, v, t, {});
      // montaña de comida sobre la mesa
      q.add(v.depth([1.8, 1, 7.2]) - .4, x => { const items = [['burger', 1.55, .95, 7.0], ['burger', 1.6, 1.12, 7.0], ['burger', 1.57, 1.29, 7.0], ['fries', 2.05, 1.02, 7.3], ['soda', 2.2, 1.05, 6.9], ['fries', 1.25, 1.02, 7.4], ['soda', 1.95, 1.05, 7.6]];
        for (const [n, x0, y0, z0] of items) { const p = v.P([x0, y0, z0]); if (!p) continue; const s = v.scaleAt([x0, y0, z0]) * R_M; x.save(); x.translate(p[0], p[1]); x.scale(s, s); drawItem(x, n, 0, 0, 0); x.restore(); } });
      const eat = Math.max(0, Math.sin((t - 23.8) * 4.2)) * win(t, 23.8, 25.9, .05);
      putChar(q, v, LEO, { ...sit(.48, { hf: [lerp(1.2, .5, eat), lerp(-2.2, -4.3, eat)], hb: [.9, -2.3], elbowF: .9 }), turn: .5, expr: eat > .5 ? 'yum' : 'joy', holdF: 'burger', rotF: -.2, fx: { sparkle: t > 24.8 ? .8 : 0 } }, .85, 7.2, t, { tint: NIGHT_T });
      q.flush(ctx); return {};
    } },
  // S15 · 26.20–27.60 · «y un silencio total» — gran plano vacío
  { id: 'S15', t0: 26.2, place: 'corridor', sfx: [[26.22, 'silence_tone', .5]],
    draw(ctx, c) {
      const v = c.cam([{ t: 0, p: [0, 10, -11], l: [0, 0, 10], f: .75 }, { t: 1.4, p: [0, 9.2, -9.5], l: [0, 0, 10], f: .78 }], { shake: .01 });
      const q = new Queue(); corridor(q, v, c.t, {});
      putChar(q, v, LEO, P(c.t, { turn: 0, expr: 'neutral', hf: [.3, -3.4], elbowF: 1.6 }), 0, 7, c.t, { tint: NIGHT_T });
      q.flush(ctx); return { vignette: .75 };
    } },
  // S16 · 27.60–32.70 · «Un shopping como el Dubai Mall tiene más de 1.200 tiendas»
  { id: 'S16', t0: 27.6, place: 'map', sfx: [[27.62, 'whoosh_long', .6], [29.3, 'boom', .6], [30.4, 'counter', .8], [31.4, 'ding', .8]],
    draw(ctx, c) {
      const a = c.lt * .06; megamap(ctx, c.t, { cx: Math.sin(a) * 30 - 5, cy: lerp(85, 62, easeOut(c.k)), cz: -70 + c.lt * 3, pitch: .78, yaw: Math.sin(a) * .25, lit: smooth(inv(30.2, 31.5, c.t)) });
      return { vignette: .7 };
    } },
  // S17 · 32.70–35.30 · «De noche muchos apagan el aire acondicionado»
  { id: 'S17', t0: 32.7, place: 'vent', sfx: [[32.72, 'ac_hum', .8], [34.62, 'switch', 1], [34.7, 'spin_down', .9]],
    draw(ctx, c) { const t = c.t; const sp = t < 34.62 ? 1 : Math.max(0, 1 - (t - 34.62) / .7); const ang = t < 34.62 ? t * 14 : 34.62 * 14 + 14 * .7 * (1 - Math.pow(1 - Math.min(1, (t - 34.62) / .7), 2)) / 2; vent(ctx, t, { ang, on: t < 34.62 ? 1 : 0 }); return {}; } },
  // S18 · 35.30–37.95 · «y dejan sólo las luces de emergencia»
  { id: 'S18', t0: 35.3, place: 'corridor', sfx: [[35.75, 'clunk', .7], [36.05, 'clunk', .7], [36.35, 'clunk', .8], [36.65, 'clunk', .9], [36.95, 'power_down', 1], [37.0, 'emergency_hum', .7]],
    draw(ctx, c) {
      const t = c.t; const look = t > 36.95 ? 'emergency' : 'night';
      const v = c.cam([{ t: 0, p: [.6, 1.0, -3], l: [0, 3.5, 20], f: .9 }, { t: 2.65, p: [.4, 1.0, -1.5], l: [0, 3.8, 20], f: .95 }]);
      const q = new Queue(); corridor(q, v, t, { look, lamp: z => { const off = 35.75 + clamp((60 - z) / 60) * 1.2; return t < off ? .9 : 0; } });
      putChar(q, v, LEO, P(t, { turn: 0, expr: t > 36.9 ? 'fear' : 'surprise', look: [0, -1], headTilt: .05 }), .2, 6, t, { tint: look === 'emergency' ? EMER_T : NIGHT_T });
      q.flush(ctx); if (look === 'emergency') { ctx.fillStyle = 'rgba(0,30,10,.25)'; ctx.fillRect(0, 0, W, H); }
      return { flash: pulse(t, 36.95, .1) * .1 };
    } },
  // S19 · 37.95–40.10 · «Por eso empezó a hacer frío» — tirita, vaho
  { id: 'S19', t0: 37.95, place: 'corridor', sfx: [[37.97, 'wind_cold', .9], [38.5, 'shiver', .7], [39.2, 'breath', .6]],
    draw(ctx, c) {
      const t = c.t;
      const v = c.cam([{ t: 0, p: [.35, 1.55, 2.4], l: [0, 1.45, 4.2], f: 1.0 }, { t: 2.15, p: [.2, 1.5, 2.85], l: [0, 1.45, 4.2], f: 1.0 }]);
      const q = new Queue(); corridor(q, v, t, { look: 'emergency' });
      const sh = Math.sin(t * 45) * .03;
      putChar(q, v, LEO, P(t, { turn: .1, expr: 'cold', fx: { shiver: true }, hf: [-.45, -2.4 + sh], hb: [.45, -2.4 - sh], elbowF: 1.5, elbowB: 1.5, headOff: [sh * 2, 0] }), 0, 4.2, t, { tint: 'rgba(60,120,200,.35)' });
      q.flush(ctx);
      // vaho
      const mouth = v.P([0, 1.3, 4.1]);
      if (mouth) for (let i = 0; i < 3; i++) { const k = ((t - 37.95) * .8 + i / 3) % 1; ctx.globalAlpha = Math.sin(k * Math.PI) * .45; glow(ctx, mouth[0] + 150 + k * 220, mouth[1] + 40 - k * 120, 40 + k * 90, 'rgba(235,245,255,1)', 1, 'source-over'); }
      ctx.globalAlpha = 1;
      // escarcha en los bordes
      const fk = smooth(inv(38.4, 39.4, t)); const g = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .75); g.addColorStop(0, 'rgba(200,230,255,0)'); g.addColorStop(1, `rgba(200,230,255,${.45 * fk})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      return {};
    } },
  // S20 · 40.10–41.30 · «Cerca de la medianoche» — 23:59 → 00:00
  { id: 'S20', t0: 40.1, place: 'clock', sfx: [[40.12, 'clock_tick', .7], [40.55, 'clock_tick', .7], [40.95, 'clock_chime', .9]],
    draw(ctx, c) { const k = c.t > 40.95; clockClose(ctx, c.t, { time: k ? '00:00' : '23:59', col: k ? '#ff3b30' : '#ff8a5c' }); return { flash: pulse(c.t, 40.95, .12) * .2 }; } },
  // S21 · 41.30–42.95 · «escuché música» — gira la cabeza, notas en el aire
  { id: 'S21', t0: 41.3, place: 'corridor', sfx: [[41.3, 'musicbox', .9]],
    draw(ctx, c) {
      const t = c.t; const turn = lerp(.3, -.75, smooth(inv(41.6, 42.1, t)));
      const v = c.cam([{ t: 0, p: [.35, 1.6, 2.9], l: [0, 1.6, 4.2], f: 1.0 }, { t: 1.65, p: [.25, 1.6, 3.15], l: [0, 1.6, 4.2], f: 1.0 }]);
      const q = new Queue(); corridor(q, v, t, { look: 'emergency' });
      putChar(q, v, LEO, P(t, { turn, expr: 'listen', look: [-.8, 0], headTilt: -.1 }), 0, 4.2, t, { tint: EMER_T });
      q.flush(ctx);
      for (let i = 0; i < 6; i++) { const k = ((t - 41.3) * .5 + i / 6) % 1; ctx.globalAlpha = Math.sin(k * Math.PI) * .9; ctx.fillStyle = '#ffd98a'; ctx.font = '900 90px DejaVu Sans'; ctx.fillText(i % 2 ? '♪' : '♫', -40 + k * 420, 700 + Math.sin(k * 8 + i) * 70 + i * 40); }
      ctx.globalAlpha = 1; return {};
    } },
  // S22 · 42.95–45.20 · «Venía de una juguetería cerrada» — espía por la persiana
  { id: 'S22', t0: 42.95, place: 'corridor', sfx: [[43.6, 'step_tile', .5], [44.3, 'shutter_rattle', .4]],
    draw(ctx, c) {
      const t = c.t; const gl = .55 + .25 * Math.sin(t * 3);
      const v = c.cam([{ t: 0, p: [-1.4, 1.5, 22.0], l: [-5.6, 1.4, 26.5], f: .95 }, { t: 2.25, p: [-2.6, 1.25, 23.6], l: [-5.6, 1.1, 26.5], f: 1.0 }]);
      const q = new Queue(); corridor(q, v, t, { look: 'emergency', toyAt: 5, toySide: -1, toyGlow: gl });
      const crouch = smooth(inv(43.4, 43.9, t));
      putChar(q, v, LEO, P(t, { facing: -1, turn: .4, expr: crouch > .5 ? 'suspicious' : 'listen', hip: [0, lerp(-1.9, -1.15, crouch)], kneeF: lerp(1, -1.6, crouch), kneeB: lerp(1, -1.6, crouch), ff: [lerp(.28, .55, crouch), 0], fb: [lerp(-.28, -.4, crouch), 0], hf: [1.1, lerp(-2, -2.4, crouch)], elbowF: .5 }), -4.75, 26.4, t, { tint: EMER_T, rim: `rgba(255,170,80,${.35 * gl})` });
      q.flush(ctx); return {};
    } },
  // S23 · 45.20–47.75 · «Adentro una cajita musical giraba sola»
  { id: 'S23', t0: 45.2, place: 'toys', sfx: [[47.1, 'creak_small', .5]],
    draw(ctx, c) { const t = c.t; ctx.save(); const z = lerp(1, 1.12, c.k); ctx.translate(W / 2, H * .65); ctx.scale(z, z); ctx.translate(-W / 2, -H * .65); musicBox(ctx, t, { spin: t * 2.4, bearLook: smooth(inv(47.0, 47.4, t)) }); ctx.restore(); return { vignette: .8 }; } },
  // S24 · 47.75–48.45 · reacción: terror
  { id: 'S24', t0: 47.75, place: 'corridor', sfx: [[47.76, 'sting', .9]],
    draw(ctx, c) {
      const v = c.cam([{ t: 0, p: [-3.4, 1.45, 24.6], l: [-4.75, 1.0, 26.4], f: 1.0 }, { t: .7, p: [-3.65, 1.3, 25.1], l: [-4.75, .95, 26.4], f: 1.0 }], { shake: .05 });
      const q = new Queue(); corridor(q, v, c.t, { look: 'emergency', toyAt: 5, toySide: -1, toyGlow: .7 });
      putChar(q, v, LEO, P(c.t, { facing: -1, turn: -.3, expr: 'terror', hip: [0, -1.15], kneeF: -1.6, kneeB: -1.6, ff: [.55, 0], fb: [-.4, 0], hf: [.5, -3.6], hb: [-.4, -3.5], elbowF: 1.5, elbowB: 1.5 }), -4.75, 26.4, c.t, { tint: EMER_T, rim: 'rgba(255,170,80,.35)' });
      q.flush(ctx); return {};
    } },
  // S25 · 48.45–50.75 · «Corrí a la sala de seguridad a pedir ayuda» — carrera
  { id: 'S25', t0: 48.45, place: 'corridor', sfx: [[48.5, 'whoosh', .7], [50.4, 'door_bang', 1]],
    draw(ctx, c) {
      const d = c.lt * 5.2, z = 8 + d;
      const v = c.cam([{ t: 0, p: [2.4, 1.1, 8 - .6], l: [-1, 1.3, 8 - .4], f: .9 }, { t: 2.3, ease: k => k, p: [2.4, 1.1, 8 + 11.96 - .6], l: [-1, 1.3, 8 + 11.96 - .4], f: .9 }], { shake: .06 });
      const q = new Queue(); corridor(q, v, c.t, { look: 'emergency', noProps: zz => zz < 26 });
      putChar(q, v, LEO, { ...run(d), turn: .6, expr: 'fear' }, -.5, z, c.t, { tint: EMER_T }); c.steps('leo', d, 'tile', 1, .75);
      q.flush(ctx); return { whip: c.lt > 2.15 ? (c.lt - 2.15) * 6 : 0 };
    } },
  // S26 · 50.75–52.60 · «Estaba vacía» — la silla gira sola, el café humea
  { id: 'S26', t0: 50.75, place: 'security', sfx: [[50.77, 'amb_security', .8], [50.9, 'chair_creak', .8]],
    draw(ctx, c) {
      const t = c.t; const v = c.cam([{ t: 0, p: [-2.7, 2.2, -4.6], l: [.4, 1.0, 2.2], f: .85 }, { t: 1.85, p: [-2.4, 2.0, -3.9], l: [.4, 1.0, 2.2], f: .9 }]);
      const q = new Queue(); security(q, v, t, { feeds: feeds(t, 'emergency', { leo: false }), chairRot: .4 + Math.sin(c.lt * 1.4) * .5, steam: 1 });
      const d = clamp((t - 51.6) / .9) * 1.2;
      if (t > 51.6) putChar(q, v, LEO, { ...walk(d), turn: .5, expr: 'confused', look: [.5, 0] }, -2.2 + d * .7, -2.6 + d * .8, t, { tint: MON_T });
      q.flush(ctx); return {};
    } },
  // S27 · 52.60–54.95 · «pero los monitores seguían prendidos»
  { id: 'S27', t0: 52.6, place: 'security', sfx: [[52.62, 'monitor_hum', .8], [53.95, 'static', .6]],
    draw(ctx, c) {
      const t = c.t; const v = c.cam([{ t: 0, p: [.9, 1.75, .3], l: [0, 1.75, 4], f: .95 }, { t: 2.35, p: [.7, 1.75, .9], l: [0, 1.7, 4], f: 1.0 }]);
      const q = new Queue(); security(q, v, t, { feeds: feeds(t, 'emergency', { leo: true }), chairRot: .2, steam: .6 });
      putChar(q, v, LEO, P(t, { back: true, turn: 0, hf: [.4, -1.9] }), .45, 2.2, t, { tint: MON_T });
      q.flush(ctx); return { flash: pulse(t, 53.98, .12) * .12 };
    } },
  // S28 · 54.95–56.05 · «En una pantalla me vi…» — zoom a un monitor (CCTV)
  { id: 'S28', t0: 54.95, place: 'cctv', sfx: [[54.97, 'zoom', .8], [55.1, 'static', .5]],
    draw(ctx, c) { const src = offCanvas('full', 540, 960); renderRoom(src.getContext('2d'), 540, 960, c.t, { leoExpr: 'neutral', chairRot: .2 }); const pr = { leo: null }; cctvPost(ctx, src, 540, 960, c.t, { zoom: lerp(1, 1.4, easeOut(c.k)), zx: 300, zy: 560 }); return { glitch: pulse(c.t, 55.0, .2) * .6 }; } },
  // S29 · 56.05–57.40 · «…a mí mismo» — su cara iluminada por los monitores
  { id: 'S29', t0: 56.05, place: 'security', sfx: [[56.1, 'heartbeat', .6]],
    draw(ctx, c) {
      const t = c.t; const v = c.cam([{ t: 0, p: [.3, 1.6, 3.55], l: [.42, 1.45, 2.2], f: 1.0 }, { t: 1.35, p: [.33, 1.6, 3.4], l: [.42, 1.48, 2.2], f: 1.0 }]);
      const q = new Queue(); security(q, v, t, { feeds: [], chairRot: .2 });
      putChar(q, v, LEO, P(t, { turn: -.1, expr: 'confused', look: [-.2, -.6], headTilt: .08 }), .42, 2.2, t, { tint: MON_T });
      q.flush(ctx); glow(ctx, 540, 700, 800, 'rgba(110,160,255,.22)', 1); return {};
    } },
  // S30 · 57.40–59.55 · «parado frente a los monitores» — por encima del hombro
  { id: 'S30', t0: 57.4, place: 'security', sfx: [[57.42, 'monitor_hum', .7]],
    draw(ctx, c) {
      const t = c.t; const v = c.cam([{ t: 0, p: [1.3, 1.95, -.4], l: [-.2, 1.65, 4], f: .9 }, { t: 2.15, p: [1.1, 1.9, .2], l: [-.2, 1.65, 4], f: .95 }]);
      const q = new Queue(); security(q, v, t, { feeds: feeds(t, 'emergency', { leo: true, leoExpr: 'confused' }), chairRot: .2 });
      putChar(q, v, LEO, P(t, { back: true, turn: 0, hf: [.35, -1.9] }), .4, 2.2, t, { tint: MON_T });
      q.flush(ctx); return {};
    } },
  // S31 · 59.55–61.95 · «y detrás de mí había alguien» — en la cámara, una figura
  { id: 'S31', t0: 59.55, place: 'cctv', sfx: [[59.62, 'sting_big', 1], [60.0, 'drone_tension', .9], [60.9, 'glitch', .8]],
    draw(ctx, c) {
      const t = c.t; const src = offCanvas('full', 540, 960);
      const pr = renderRoom(src.getContext('2d'), 540, 960, t, { leoExpr: 'neutral', chairRot: .2, fig: { x: -2.4, z: -2.0, tint: 'rgba(0,0,0,.72)' } });
      const e = easeInOut(c.k); cctvPost(ctx, src, 540, 960, t, { zoom: lerp(1.05, 2.0, e), zx: lerp(270, pr.fig[0], e), zy: lerp(480, pr.fig[1] + 40, e) });
      return { glitch: pulse(t, 59.62, .25) * .8 + pulse(t, 60.92, .3) * .6 };
    } },
  // S32 · 61.95–63.30 · «Me di vuelta» — giro brusco
  { id: 'S32', t0: 61.95, place: 'security', sfx: [[62.25, 'whoosh_fast', 1], [62.4, 'hit', .9]],
    draw(ctx, c) {
      const t = c.t; const v = c.cam([{ t: 0, p: [.35, 1.7, -.6], l: [.42, 1.45, 2.2], f: 1.0 }, { t: 1.35, p: [.38, 1.6, .15], l: [.42, 1.5, 2.2], f: 1.0 }], { shakeFn: lt => pulse(lt, .35, .4) * .12 });
      const q = new Queue(); security(q, v, t, { feeds: feeds(t, 'emergency', { leo: true }), chairRot: .2 });
      const sp = clamp((t - 62.2) / .22); const sx = Math.abs(Math.cos(sp * Math.PI)) * .9 + .1;
      putChar(q, v, LEO, P(t, { back: sp < .5, turn: 0, sx, expr: 'terror', hf: [.6, -2.6], hb: [-.6, -2.6] }), .42, 2.2, t, { tint: MON_T });
      q.flush(ctx); return { whip: pulse(t, 62.3, .2) * 1.2, whipDir: -1 };
    } },
  // S33 · 63.30–64.60 · «no había nadie» — puerta vacía
  { id: 'S33', t0: 63.3, place: 'security', sfx: [[63.32, 'silence_tone', .6]],
    draw(ctx, c) {
      const t = c.t; const v = c.cam([{ t: 0, p: [.4, 1.6, 2.0], l: [-3.5, 1.1, -2.5], f: .95 }, { t: 1.3, p: [.2, 1.55, 1.6], l: [-3.5, 1.1, -2.5], f: 1.0 }], { shake: .015 });
      const q = new Queue(); security(q, v, t, { feeds: [], chairRot: .2 }); q.flush(ctx); return { vignette: .8 };
    } },
  // S34 · 64.60–66.60 · «Volví a mirar la pantalla» — se da vuelta despacio
  { id: 'S34', t0: 64.6, place: 'security', sfx: [[64.7, 'cloth', .5], [65.6, 'heartbeat', .8]],
    draw(ctx, c) {
      const t = c.t; const v = c.cam([{ t: 0, p: [.33, 1.6, 3.5], l: [.42, 1.45, 2.2], f: 1.0 }, { t: 2.0, p: [.38, 1.55, 3.15], l: [.42, 1.5, 2.2], f: 1.0 }]);
      const q = new Queue(); security(q, v, t, { feeds: [], chairRot: .2 });
      const sp = clamp((t - 64.75) / .9); const sx = Math.abs(Math.cos(sp * Math.PI)) * .9 + .1;
      putChar(q, v, LEO, P(t, { back: sp < .5, turn: 0, sx, expr: 'fear', look: [0, -.4], fx: { sweat: true } }), .42, 2.2, t, { tint: MON_T });
      q.flush(ctx); glow(ctx, 540, 650, 800, 'rgba(110,160,255,.2)', 1); return {};
    } },
  // S35 · 66.60–68.10 · «Ahora estaba más cerca» — la figura, justo detrás
  { id: 'S35', t0: 66.6, place: 'cctv', sfx: [[66.64, 'glitch', .9], [67.38, 'sting', 1]],
    draw(ctx, c) {
      const t = c.t; const src = offCanvas('full', 540, 960);
      const pr = renderRoom(src.getContext('2d'), 540, 960, t, { leoExpr: 'fear', chairRot: .2, fig: { x: -1.15, z: 1.8, tint: 'rgba(0,0,0,.72)', eyes: .6 } });
      cctvPost(ctx, src, 540, 960, t, { zoom: lerp(1.2, 1.7, easeOut(c.k)), zx: (pr.fig[0] + pr.leo[0]) / 2, zy: (pr.fig[1] + pr.leo[1]) / 2 + 60 });
      return { glitch: pulse(t, 66.65, .25) * .9 + pulse(t, 67.4, .2) * .5 };
    } },
  // S36 · 68.10–69.55 · reacción: comprende lo que ve
  { id: 'S36', t0: 68.1, place: 'security', sfx: [[68.15, 'drone_tension', .9]],
    draw(ctx, c) {
      const t = c.t; const v = c.cam([{ t: 0, p: [.38, 1.55, 3.2], l: [.42, 1.5, 2.2], f: 1.0 }, { t: 1.45, p: [.41, 1.53, 2.95], l: [.42, 1.52, 2.2], f: 1.05 }]);
      const q = new Queue(); security(q, v, t, { feeds: [], chairRot: .2 });
      putChar(q, v, LEO, P(t, { turn: 0, expr: t > 68.8 ? 'shock' : 'fear', look: [0, -.3] }), .42, 2.2, t, { tint: MON_T });
      q.flush(ctx); glow(ctx, 540, 650, 800, 'rgba(110,160,255,.22)', 1); return {};
    } },
  // S37 · 69.55–71.00 · «…mi misma ropa» — la figura viste igual que él
  { id: 'S37', t0: 69.55, place: 'cctv', sfx: [[69.6, 'reveal_hit', 1], [70.35, 'glitch', 1], [70.6, 'cut_out', .9]],
    draw(ctx, c) {
      const t = c.t; const src = offCanvas('full', 540, 960);
      const pr = renderRoom(src.getContext('2d'), 540, 960, t, { leoExpr: 'fear', chairRot: .2, fig: { x: -1.15, z: 1.8, tint: 'rgba(0,0,0,.1)', eyes: .9, smile: smooth(inv(70.0, 70.4, t)) * .9, color: true } });
      const e = easeInOut(c.k); cctvPost(ctx, src, 540, 960, t, { color: true, zoom: lerp(1.9, 3.6, e), zx: lerp((pr.fig[0] + pr.leo[0]) / 2, pr.fig[0], e), zy: lerp((pr.fig[1] + pr.leo[1]) / 2 + 60, pr.fig[1] + 70, e) });
      const end = smooth(inv(70.3, 70.5, t));
      if (end > 0) { ctx.save(); ctx.globalAlpha = end; ctx.textAlign = 'center'; ctx.font = '900 120px Mont'; ctx.lineWidth = 20; ctx.strokeStyle = '#000'; ctx.fillStyle = '#ffd43b'; const s = backOut(inv(70.3, 70.6, t)); ctx.translate(W / 2, 400); ctx.scale(s, s); ctx.strokeText('PARTE 2', 0, 0); ctx.fillText('PARTE 2', 0, 0); ctx.font = '900 60px Mont'; ctx.fillStyle = '#fff'; ctx.lineWidth = 14; ctx.strokeText('CONTINUARÁ...', 0, 95); ctx.fillText('CONTINUARÁ...', 0, 95); ctx.restore(); }
      return { glitch: pulse(t, 69.6, .25) * .9 + smooth(inv(70.3, 70.9, t)) * .9, black: smooth(inv(70.88, 71.0, t)) };
    } },
];
SHOTS.forEach((s, i) => { s.t1 = SHOTS[i + 1] ? SHOTS[i + 1].t0 : DURATION; });

// Textos extra en pantalla (datos)
export const LABELS = [
  { t0: 29.25, t1: 32.65, draw(ctx, t, k) { const s = backOut(inv(29.25, 29.6, t)); ctx.save(); ctx.translate(W / 2, 380); ctx.scale(s, s); ctx.textAlign = 'center'; ctx.font = '900 112px Mont'; ctx.lineWidth = 18; ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff'; ctx.strokeText('DUBAI MALL', 0, 0); ctx.fillText('DUBAI MALL', 0, 0); ctx.restore(); } },
  { t0: 30.4, t1: 32.65, draw(ctx, t, k) { const n = Math.round(1200 * easeOut(inv(30.4, 31.4, t))); const s = backOut(inv(30.4, 30.7, t)); ctx.save(); ctx.translate(W / 2, 560); ctx.scale(s, s); ctx.textAlign = 'center'; ctx.font = '900 150px Mont'; ctx.lineWidth = 22; ctx.strokeStyle = '#000'; ctx.fillStyle = '#ffd43b'; const txt = '+' + n.toLocaleString('es-AR'); ctx.strokeText(txt, 0, 0); ctx.fillText(txt, 0, 0); ctx.font = '900 70px Mont'; ctx.fillStyle = '#fff'; ctx.lineWidth = 14; ctx.strokeText('TIENDAS', 0, 90); ctx.fillText('TIENDAS', 0, 90); ctx.restore(); } },
];
