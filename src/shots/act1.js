// =====================================================================
//  ACTO 1 — EL DESPERTAR (0.00 s – 22.50 s)
//  Cada plano: t0 (inicio), set, run(ctx, set) y sfx [[t, nombre, gan]]
//  Narración de referencia entre comillas.
// =====================================================================
import { lerp, clamp, smooth, inv, win, pulse, walk, idle, sit, lying, travel, poseTrack, PI } from './helpers.js';
import { backOut, easeOut } from '../core/math.js';
import * as THREE from 'three';

export const SHOTS = [
  // ---------------------------------------------------------------
  // S01 · 0.00–2.75 · "Si despertaras en Roma hace dos mil años,"
  // Plano general aéreo de Roma al amanecer; la cámara desciende y
  // se acerca a la ventana del último piso de la ínsula protagonista.
  { id: 'S01_roma_amanecer', t0: 0, set: 'city', sfx: [[0, 'amb_dawn', 1], [.05, 'whoosh_long', .5], [.6, 'rooster', .55], [2.3, 'whoosh', .5]],
    run(c, s) {
      s.mode('dawn');
      c.camKeys([
        { t: 0, p: [-14, 36, 70], l: [0, 8, 0], fov: 46 },
        { t: 1.6, p: [-4, 22, 34], l: [0, 10, 2], fov: 42 },
        { t: 2.75, p: [0, 11.8, 6.2], l: [0, 11.4, 3.5], fov: 38, ease: k => k * k * (3 - 2 * k) },
      ], { shake: .05 });
      s.winGlow.material.emissiveIntensity = .5 * smooth(inv(1.5, 2.6, c.t));
    } },
  // ---------------------------------------------------------------
  // S02 · 2.75–4.35 · "no habría alarma."
  // Marco duerme. Aparece un despertador moderno (gag), tiembla y
  // desaparece en una nube de humo: en Roma no existía.
  { id: 'S02_sin_alarma', t0: 2.75, set: 'bedroom', sfx: [[2.92, 'pop', .8], [3.0, 'tick', .45], [3.56, 'poof', .9], [3.6, 'stamp', .6]],
    run(c, s) {
      s.mode('dawn'); s.lights.sun.intensity *= .35; s.shaft.visible = false; s.dust.intensity = .4;
      c.camKeys([{ t: 0, p: [-.75, 1.4, 2.6], l: [-1.15, .72, -.9], fov: 46 }, { t: 1.6, p: [-.95, 1.25, 2.1], l: [-1.25, .7, -.85], fov: 44 }]);
      const t = c.t, ap = clamp((t - 2.92) / .25), gone = t > 3.56;
      s.clock.visible = ap > 0 && !gone;
      s.clock.scale.setScalar(backOut(ap) * (1 + .06 * Math.sin(t * 60) * win(t, 3.0, 3.5, .05)));
      s.clock.rotation.z = Math.sin(t * 70) * .08 * win(t, 3.0, 3.52, .05);
      s.poof.intensity = gone ? 1 : 0; s.poof.o.life = .9; if (gone) s.poof.update(t - 3.56 + .01);
      const m = s.chars.marco; m.setPos(.15, .72, -1.1);
      m.update(c.cam, lying({ expr: 'sleep', fx: { zzz: true }, hf: [8, -34 + Math.sin(t * 2) * .6] }), t);
      s.blk.drape(0);
    } },
  // ---------------------------------------------------------------
  // S03 · 4.35–6.25 · "Te despertaría el sol."
  // Los postigos se abren, el haz de sol cruza la habitación hasta su
  // cara: entrecierra los ojos, los abre y se estira.
  { id: 'S03_despierta_sol', t0: 4.35, set: 'bedroom', sfx: [[4.42, 'shutter', .7], [4.55, 'shimmer', .8], [4.6, 'birds', .7], [5.65, 'stretch', .6]],
    run(c, s) {
      const t = c.t, sunK = smooth(inv(4.45, 5.2, t));
      s.mode('dawn'); s.lights.sun.intensity *= lerp(.3, 1.15, sunK); s.shaft.material.uniforms.opacity.value = .11 * sunK; s.dust.intensity = sunK;
      for (const [i, p] of s.shutters.entries()) p.rotation.y = (i ? 1 : -1) * lerp(0, 1.9, easeOut(inv(4.38, 4.75, t)));
      c.camKeys([{ t: 0, p: [-.8, 1.05, 1.6], l: [-1.05, .8, -1.1], fov: 42 }, { t: 1.9, p: [-.95, 1.0, 1.25], l: [-1.12, .82, -1.1], fov: 40 }]);
      const lt = c.lt;
      const pose = poseTrack(lt, [
        [0, lying({ expr: 'sleep' })],
        [.75, lying({ expr: 'squint', headTilt: -.08 })],
        [1.2, lying({ expr: 'surprise', look: [-.6, -.3] })],
        [1.45, lying({ expr: 'happy', hf: [26, -100], hb: [-22, -100], elbowF: .3, elbowB: -.3 })],
      ], .2);
      const m = s.chars.marco; m.setPos(.15, .72, -1.1); m.update(c.cam, pose, t);
      s.blk.drape(0);
    } },
  // ---------------------------------------------------------------
  // S04 · 6.25–11.75 · "Para los romanos, el día tenía 12 horas,
  // del amanecer al atardecer."  Reloj de sol: el sol recorre el cielo
  // de este a oeste y la sombra del gnomon barre las 12 horas.
  { id: 'S04_doce_horas', t0: 6.25, set: 'sundial', sfx: [[6.3, 'amb_day', .9], [6.4, 'whoosh', .5], [8.3, 'boom_soft', .8], [9.4, 'whoosh_long', .45], [11.2, 'chime', .6]],
    run(c, s) {
      const t = c.t, dk = smooth(inv(7.4, 11.3, t));
      s.season(0); s.day(lerp(.03, .97, dk), 1.05); s.applyTint(); s.heat.intensity = 0;
      c.camKeys([
        { t: 0, p: [3.4, .95, 5.4], l: [.75, 1.6, .3], fov: 46 },
        { t: 2.0, p: [-.3, .75, 5.8], l: [.55, 1.9, .3], fov: 46 },
        { t: 3.3, p: [.0, 2.75, 1.6], l: [0, 1.12, -.1], fov: 40 },
        { t: 5.5, p: [-.25, 2.55, 1.35], l: [0, 1.12, -.15], fov: 38 },
      ], { shake: .02 });
      const m = s.chars.marco; m.setPos(1.15, 0, .55);
      const sunDir = s.lights.sun.position.clone().normalize();
      const look = [clamp(-sunDir.x * 1.2, -1, 1), -sunDir.y];
      const pose = poseTrack(c.lt, [
        [0, { ...idle(t), facing: -1, expr: 'neutral', turn: .3 }],
        [.6, { ...idle(t), facing: -1, expr: 'talk', talk: .6, turn: .5, hf: [12, -82], elbowF: .2 }],
        [2.2, { ...idle(t), facing: -1, expr: 'happy', turn: -.2, hf: [4, -86], hb: [-6, -36], elbowF: .6, look, headTilt: -.12 }],
      ]);
      m.update(c.cam, pose, t);
    } },
  // ---------------------------------------------------------------
  // S05 · 11.75–15.35 · "En verano, cada hora duraba más que en invierno."
  // Verano caluroso (abanico, sudor) -> transición a invierno (nieve,
  // árbol desnudo, Marco tiritando).
  { id: 'S05_verano_invierno', t0: 11.75, set: 'sundial', sfx: [[11.8, 'cicadas', .8], [12.9, 'fan', .5], [13.45, 'wind_cold', .9], [14.1, 'shiver', .6]],
    run(c, s) {
      const t = c.t, wk = smooth(inv(13.35, 14.25, t));
      s.day(.5, lerp(1.25, .55, wk)); s.season(wk); s.applyTint();
      c.camKeys([{ t: 0, p: [3.6, 1.5, 4.8], l: [.4, 1.3, 0], fov: 40 }, { t: 3.6, p: [1.6, 1.25, 4.6], l: [.7, 1.2, 0], fov: 37 }], { shake: .02 });
      const m = s.chars.marco; m.setPos(1.25, 0, .7);
      const hot = { ...idle(t), facing: -1, expr: 'hot', fx: { sweat: true }, holdF: 'fan', hf: [20 + Math.sin(t * 14) * 4, -64 + Math.cos(t * 14) * 3], rotF: -.4 + Math.sin(t * 14) * .5, elbowF: .7, turn: .4 };
      const cold = { ...idle(t), facing: -1, expr: 'cold', fx: { shiver: true }, holdF: null, hf: [-4, -50 + Math.sin(t * 40) * .8], hb: [-12, -50 + Math.cos(t * 40) * .8], elbowF: 1.6, elbowB: 1.6, lean: .05, squash: 1 + Math.sin(t * 50) * .006, turn: .3, headOff: [Math.sin(t * 45) * .4, 0] };
      m.update(c.cam, poseTrack(c.lt, [[0, hot], [2.3, cold]], .35), t);
    } },
  // ---------------------------------------------------------------
  // S06 · 15.35–16.6 · "Abres los ojos..."  Primerísimo primer plano.
  { id: 'S06_abres_ojos', t0: 15.35, set: 'bedroom', sfx: [[15.5, 'blink', .7], [15.4, 'birds', .5]],
    run(c, s) {
      s.mode('dawn');
      c.camKeys([{ t: 0, p: [-1.15, .9, 1.05], l: [-1.2, .78, -1.1], fov: 38 }, { t: 1.25, p: [-1.15, .9, .9], l: [-1.2, .8, -1.1], fov: 38 }]);
      const pose = poseTrack(c.lt, [[0, lying({ expr: 'sleep', noBlink: true })], [.25, lying({ expr: 'sleepy', noBlink: true })], [.55, lying({ expr: 'surprise', look: [.5, -.4], noBlink: true })], [.95, lying({ expr: 'neutral', look: [-.7, .2] })]], .18);
      const m = s.chars.marco; m.setPos(.15, .72, -1.1); m.update(c.cam, pose, c.t); s.blk.drape(0);
    } },
  // ---------------------------------------------------------------
  // S07 · 16.6–19.6 · "...en una ínsula, un edificio de varios pisos."
  // La cámara sale por su ventana y se aleja (grúa) revelando la ínsula.
  { id: 'S07_insula', t0: 16.6, set: 'insula', sfx: [[16.62, 'whoosh_long', .7], [16.8, 'amb_street', .8], [18.4, 'tick', .25], [18.6, 'tick', .25], [18.8, 'tick', .25], [19.0, 'tick', .25]],
    run(c, s) {
      s.mode(); s.facadeG.position.set(0, 0, 0); s.facadeG.rotation.x = 0;
      for (const st of s.stacks) st.visible = false;
      c.camKeys([
        { t: 0, p: [0, 11.4, 6.6], l: [0, 11.3, 2.2], fov: 40 },
        { t: 2.0, p: [-3, 4.5, 18], l: [0, 6.8, 0], fov: 46 },
        { t: 3.0, p: [-4.2, 1.6, 21.5], l: [0, 7.2, 0], fov: 48 },
      ], { shake: .03 });
      // vecinos en la calle
      const p1 = s.chars.peaton1, d1 = c.lt * .9; p1.setPos(-7 + d1, .15, 3.6); p1.update(c.cam, { ...walk(d1), facing: 1, expr: 'neutral' }, c.t); c.steps('p1', d1, 'stone', .35);
      const p2 = s.chars.peaton2; p2.setPos(2.2, FH2, 3.1); p2.update(c.cam, { ...idle(c.t), facing: -1, expr: 'happy', hf: [10, -60 + Math.sin(c.t * 8) * 6], elbowF: .4 }, c.t);
    } },
  // ---------------------------------------------------------------
  // S08 · 19.6–22.5 · "Cuanto más arriba vives, menos pagas."
  // La fachada se levanta: corte del edificio con un inquilino por piso;
  // las pilas de monedas (alquiler) bajan a medida que subimos.
  { id: 'S08_alquiler', t0: 19.6, set: 'insula', sfx: [[19.62, 'amb_street', .7], [19.62, 'rumble_lift', .8], [20.1, 'coin_stack', .7], [20.45, 'coin_stack', .6], [20.8, 'coin_stack', .55], [21.15, 'coin', .5], [21.45, 'coin', .7], [21.8, 'ding', .5]],
    run(c, s) {
      const t = c.t, up = easeOut(inv(19.62, 20.3, t));
      s.mode(); s.facadeG.position.set(0, up * 16, up * 1.5); s.facadeG.visible = up < .99;
      s.roomL.forEach((l, i) => { l.intensity = 2.5 * up; l.visible = up > 0; });
      s.stacks.forEach((st, i) => { const k = backOut(inv(20.0 + i * .35, 20.3 + i * .35, t)); st.visible = k > 0; st.scale.setScalar(Math.max(.001, k)); });
      c.camKeys([
        { t: 0, p: [1.0, 3.2, 15.5], l: [.3, 3.6, 0], fov: 46 },
        { t: 1.0, p: [2.0, 3.0, 13.5], l: [1, 3.2, 0], fov: 44 },
        { t: 2.1, p: [1.8, 10.6, 10.5], l: [1, 10.4, 0], fov: 42 },
        { t: 2.9, p: [1.4, 11.2, 8.4], l: [.8, 11.0, 0], fov: 40 },
      ], { shake: .02 });
      const C = s.chars;
      C.rico.setPos(-1.6, .22, -.2); C.rico.update(c.cam, { ...idle(t), expr: 'confident', facing: 1, holdF: 'coin', hf: [12, -52 + Math.sin(t * 5) * 2], turn: .3 }, t);
      C.peaton2.setPos(1.1, FH + .22, -.4); C.peaton2.update(c.cam, { ...idle(t + 1), expr: 'neutral', facing: -1 }, t);
      C.peaton1.setPos(.4, FH * 2 + .22, -.2); C.peaton1.update(c.cam, { ...idle(t + 2), expr: 'neutral', facing: 1, turn: .2 }, t);
      C.peaton3.setPos(-.2, FH * 3 + .22, -.1); C.peaton3.update(c.cam, { ...idle(t + 3), expr: 'sleepy', facing: -1 }, t);
      const mk = smooth(inv(21.3, 21.7, t));
      C.marco.setPos(.15, FH * 4 + .22, .1);
      C.marco.update(c.cam, poseTrack(c.lt, [[0, { ...idle(t), expr: 'neutral', facing: 1, turn: .2 }], [1.75, { ...idle(t), expr: 'happy', facing: 1, turn: .1, holdF: 'coin', hf: [9, -70], elbowF: .4, hb: [-14, -50], fx: { spark: mk } }]]), t);
    } },
];
const FH = 2.6, FH2 = 2 * 2.6 + .1;
