// =====================================================================
//  ACTO 2 — LA MAÑANA Y EL TRABAJO (22.50 s – 46.35 s)
// =====================================================================
import { lerp, clamp, smooth, inv, win, pulse, walk, idle, sit, travel, poseTrack, PI } from './helpers.js';
import { backOut, easeOut, easeInOut } from '../core/math.js';
import { run as runPose } from '../characters/poses.js';

export const SHOTS = [
  // S09 · 22.50–24.95 · "No hay agua corriente ni cocina."
  // Marco vuelca su jarra vacía: sólo cae una gota. Mira el rincón vacío.
  { id: 'S09_sin_agua', t0: 22.5, set: 'bedroom', sfx: [[22.55, 'amb_room', .6], [23.05, 'jar_shake', .7], [23.45, 'drip', .9], [24.0, 'whoosh', .4], [24.1, 'sad_horn', .5]],
    run(c, s) {
      s.mode('day'); s.food.visible = false; s.pot.visible = false; s.cups.forEach(x => x.visible = false); s.lamp.visible = false;
      const t = c.t;
      c.camKeys([{ t: 0, p: [1.2, 1.4, 3.6], l: [1.0, 1.0, -.6], fov: 44 }, { t: 1.3, p: [1.05, 1.3, 2.9], l: [1.0, 1.0, -.6], fov: 42 }, { t: 2.45, p: [.8, 1.3, 3.1], l: [1.25, .95, -.8], fov: 44 }]);
      const shake = Math.sin(t * 30) * win(t, 22.95, 23.5, .05);
      const m = s.chars.marco; m.setPos(.95, 0, -.55);
      m.update(c.cam, poseTrack(c.lt, [
        [0, { ...idle(t), facing: 1, expr: 'neutral', holdF: 'jar', hf: [12, -50], rotF: 0 }],
        [.45, { ...idle(t), facing: 1, expr: 'confused', holdF: 'jar', hf: [22, -60 + shake * 2], rotF: 2.8 + shake * .2, elbowF: .4, look: [.5, -.6] }],
        [1.2, { ...idle(t), facing: 1, expr: 'sad', holdF: 'jar', hf: [20, -58], rotF: 2.9, fx: { question: 1 } }],
        [1.6, { ...idle(t), facing: -1, expr: 'confused', hf: [10, -46], hb: [-10, -46], turn: .2, headTilt: .15, fx: { question: 1 } }],
      ]), t);
      // gota que cae de la jarra vacía
      const dk = (t - 23.3) / .42; s.drop.visible = dk > 0 && dk < 1;
      s.drop.position.set(1.23, lerp(1.02, .02, dk * dk), -.55);
    } },
  // S10 · 24.95–27.40 · "Bajas a la fuente del barrio a llenar tu jarra."
  // Travelling lateral siguiendo a Marco hasta la fuente; llena la jarra.
  { id: 'S10_fuente', t0: 24.95, set: 'street', sfx: [[24.96, 'amb_street', .9], [24.96, 'fountain', .9], [26.55, 'jar_fill', .9]],
    run(c, s) {
      s.mode('morning'); s.cart.visible = s.cart2.visible = false;
      const t = c.t, lt = c.lt;
      const d = travel(lt, 0, 1.5, 3.4);           // camina 3.4 m en 1.5 s
      const x = -3.75 + d;
      c.camKeys([{ t: 0, p: [-3.3, 1.5, 1.6], l: [-3.0, 1.1, -3.3], fov: 44 }, { t: 1.5, p: [-.6, 1.35, 1.2], l: [-.25, 1.0, -3.6], fov: 42 }, { t: 2.45, p: [-.2, 1.2, -.3], l: [-.1, .95, -3.8], fov: 40 }], { shake: .02 });
      const m = s.chars.marco; m.setPos(x, .25, -3.3);
      const fillK = smooth(inv(26.55, 27.4, t));
      const walking = { ...walk(d), facing: 1, expr: 'neutral', holdF: 'jar', hf: [9, -40], rotF: 0, turn: .5 };
      const filling = { ...idle(t), facing: 1, expr: 'happy', holdF: 'jar', hf: [20, -31], rotF: 0, elbowF: .5, turn: .5, itemF: { water: fillK > .8 }, look: [.5, .4] };
      m.update(c.cam, lt < 1.45 ? walking : poseTrack(lt, [[1.45, walking], [1.65, filling]], .2), t);
      c.steps('marco', d, 'stone', .9);
      s.splash.o.burstAt = undefined; s.splash.intensity = fillK > 0 ? 1 : .4;
      // vecina esperando con su jarra y Tito corriendo al fondo
      const v = s.chars.vecina; v.setPos(1.35, .25, -3.6); v.update(c.cam, { ...idle(t + 2), facing: -1, expr: 'talk', talk: win(t, 26.0, 26.9, .1) * .7, holdB: 'jar', hb: [-6, -38], turn: .4 }, t);
      const ti = s.chars.tito; const dt = lt * 2.6; ti.setPos(5 - dt, .25, -4.6); ti.update(c.cam, { ...runPose(dt * 1.6), facing: -1, expr: 'joy' }, t); c.steps('tito', dt * 1.6, 'stone', .3, 13);
    } },
  // S11 · 27.40–32.45 · "Desayunas pan, un poco de queso y, con suerte, aceitunas."
  { id: 'S11_desayuno', t0: 27.4, set: 'bedroom', sfx: [[27.45, 'amb_room', .6], [27.6, 'stool', .6], [28.46, 'pop_plate', .8], [28.95, 'crunch', .8], [29.66, 'pop_plate', .8], [31.52, 'pop_plate', .8], [31.6, 'sparkle', .8], [31.95, 'yum', .6]],
    run(c, s) {
      s.mode('day'); s.pot.visible = false; s.cups.forEach(x => x.visible = false); s.lamp.visible = false; s.food.visible = true;
      const t = c.t, lt = c.lt;
      const pop = (o, at) => { const k = backOut(inv(at, at + .3, t)); o.visible = k > 0; o.scale.setScalar(Math.max(.001, k) * (o.userData.s || 1.15)); };
      s.fBread.userData.s = 1.2; pop(s.fBread, 28.46); s.fCheese.userData.s = 1.1; pop(s.fCheese, 29.66); s.fOlives.userData.s = 1.1; pop(s.fOlives, 31.52);
      c.camKeys([
        { t: 0, p: [.6, 1.35, 3.3], l: [.55, .85, -.2], fov: 44 },
        { t: .95, p: [.62, 1.3, 2.9], l: [.6, .8, -.2], fov: 42 },
        { t: 1.15, p: [.8, 1.2, 1.45], l: [.78, .66, -.2], fov: 38, ease: easeOut },
        { t: 2.8, p: [.95, 1.15, 1.3], l: [.8, .66, -.2], fov: 36 },
        { t: 3.1, p: [.45, 1.25, 2.5], l: [.4, .9, -.1], fov: 40, ease: easeOut },
        { t: 5.05, p: [.42, 1.2, 2.2], l: [.4, .9, -.1], fov: 40 },
      ], { shake: .01 });
      const m = s.chars.marco; m.setPos(.12, 0, -.05);
      const bite = win(t, 28.85, 29.4, .15);
      const olive = win(t, 31.65, 32.3, .15);
      m.update(c.cam, poseTrack(lt, [
        [0, { ...sit(t, 24.7), facing: 1, expr: 'neutral', turn: .5 }],
        [1.05, { ...sit(t, 24.7), facing: 1, expr: 'happy', turn: .5, holdF: 'bread', itemF: { bite: t > 29.1 }, hf: [lerp(18, 10, bite), lerp(-40, -72, bite)], elbowF: 1, rotF: -.3 }],
        [2.2, { ...sit(t, 24.7), facing: 1, expr: bite > .5 ? 'yum' : 'happy', turn: .5, holdF: 'bread', itemF: { bite: true }, hf: [16, -40], rotF: -.3 }],
        [3.95, { ...sit(t, 24.7), facing: 1, expr: olive > .3 ? 'joy' : 'surprise', turn: .45, hf: [lerp(22, 12, olive), lerp(-40, -72, olive)], hb: [6, -36], holdB: 'bread', itemB: { bite: true }, elbowF: .9, fx: { spark: win(t, 31.55, 32.4, .1) } }],
      ]), t);
    } },
  // S12 · 32.45–34.50 · "Después, a trabajar."
  { id: 'S12_a_trabajar', t0: 32.45, set: 'street', sfx: [[32.5, 'door', .7], [32.46, 'amb_street', .9], [33.5, 'whoosh', .5]],
    run(c, s) {
      s.mode('morning'); s.cart.visible = s.cart2.visible = false;
      const t = c.t, lt = c.lt;
      const d = travel(lt, .3, 2.05, 4.6);
      const x = -5.2 + d;
      c.camKeys([{ t: 0, p: [-6.8, .9, 1.9], l: [-5.0, 1.25, -3.4], fov: 44 }, { t: 2.05, p: [-1.6, .85, 1.0], l: [-.6, 1.25, -3.4], fov: 42 }], { shake: .03 });
      const m = s.chars.marco; m.setPos(x, .25, -3.4);
      m.update(c.cam, lt < .3 ? { ...idle(t), facing: 1, expr: 'determined', turn: .5 } : { ...walk(d, { swing: 10 }), facing: 1, expr: 'determined', turn: .55, lean: .1 }, t);
      c.steps('marco', d, 'stone', .9);
      const v = s.chars.peaton2; const dv = lt * 1.0; v.setPos(1.5 - dv, .25, -3.9); v.update(c.cam, { ...walk(dv), facing: -1, expr: 'neutral', holdB: 'amphora', hb: [-2, -62], rotB: .5 }, t);
      const p = s.chars.peaton3; p.setPos(-3.2, .25, -4.6); p.update(c.cam, { ...idle(t), facing: 1, expr: 'happy', hf: [14, -64 + Math.sin(t * 9) * 5], elbowF: .4, turn: .3 }, t);
      const ft = s.fountain; // la fuente sigue manando al fondo
    } },
  // S13 · 34.50–35.50 · "En un taller,"  Martilleo sobre el yunque con chispas.
  { id: 'S13_taller', t0: 34.5, set: 'workshop', sfx: [[34.52, 'amb_forge', .9], [34.88, 'anvil', 1], [35.24, 'anvil', .9]],
    run(c, s) {
      s.mode(); const t = c.t;
      s.burst(0, 34.88); s.burst(1, 35.24);
      c.camKeys([{ t: 0, p: [.3, 1.25, 2.9], l: [-1.0, 1.0, -.6], fov: 42 }, { t: 1.0, p: [.0, 1.15, 2.5], l: [-1.05, .95, -.6], fov: 40 }], { shake: .025 });
      const strikes = [34.88, 35.24]; let raise = 1; for (const st of strikes) { const k = (t - st); if (k > -.22 && k < .14) raise = k < 0 ? -k / .22 : k / .14 * .6; }
      const m = s.chars.marco; m.setPos(-1.45, 0, -.35);
      m.update(c.cam, { ...idle(t), facing: 1, expr: raise < .2 ? 'squint' : 'determined', holdF: 'hammer', hf: [lerp(22, 8, raise), lerp(-50, -92, raise)], rotF: lerp(1.75, .2, raise), elbowF: .5, hb: [12, -46], lean: lerp(.18, -.05, raise), turn: .5 }, t);
      const h = s.chars.herrero; h.setPos(-3.2, 0, -1.6); h.update(c.cam, { ...idle(t), facing: 1, expr: 'neutral', hf: [12, -40 + Math.sin(t * 6) * 6], hb: [8, -40 + Math.sin(t * 6) * 6], turn: .4 }, t);
    } },
  // S14 · 35.50–36.55 · "en el mercado"
  { id: 'S14_mercado', t0: 35.5, set: 'street', sfx: [[35.52, 'amb_market', 1]],
    run(c, s) {
      s.mode('morning'); s.cart.visible = s.cart2.visible = false; const t = c.t, lt = c.lt;
      c.camKeys([{ t: 0, p: [17.2, 1.5, 1.2], l: [16.0, 1.45, -4.6], fov: 42 }, { t: 1.05, p: [16.6, 1.45, .6], l: [15.8, 1.45, -4.6], fov: 39 }], { shake: .02 });
      const m = s.chars.marco; m.setPos(15.2, .25, -5.0);
      m.update(c.cam, { ...idle(t), facing: 1, turn: .05, expr: 'talk', talk: .9, holdF: 'bowl', hf: [10, -78 + Math.sin(t * 8) * 3], elbowF: .3, hb: [-14, -66 + Math.cos(t * 8) * 4], elbowB: .3 }, t);
      const v = s.chars.vendedor; v.setPos(18.0, .25, -5.0); v.update(c.cam, { ...idle(t + 1), facing: -1, turn: .3, expr: 'happy', hf: [12, -58], elbowF: .4 }, t);
      const p = s.chars.peaton2; const dp = lt * 1.1; p.setPos(19 - dp, .25, -2.4); p.update(c.cam, { ...walk(dp), facing: -1, expr: 'neutral', holdB: 'jar', hb: [-6, -38] }, t);
      const q = s.chars.peaton1; const dq = lt * .9; q.setPos(13.6 + dq, .25, -1.8); q.update(c.cam, { ...walk(dq), facing: 1, expr: 'happy', turn: .4 }, t);
      c.steps('p', dp, 'stone', .35); c.steps('q', dq, 'stone', .35);
    } },
  // S15 · 36.55–37.65 · "o en el puerto."
  { id: 'S15_puerto', t0: 36.55, set: 'port', sfx: [[36.56, 'amb_port', 1], [36.7, 'gull', .7], [37.2, 'creak', .5]],
    run(c, s) {
      s.mode(); const t = c.t, lt = c.lt;
      c.camKeys([{ t: 0, p: [-3.8, 1.25, 5.2], l: [-1.8, 1.8, -2], fov: 46 }, { t: 1.1, p: [-2.8, 1.2, 4.6], l: [-1.0, 1.8, -2], fov: 44 }], { shake: .02 });
      const d = lt * .95; const m = s.chars.marco; m.setPos(-3.2 + d, 0, .8);
      m.update(c.cam, { ...walk(d, { hf: [3, -64], hb: [-4, -64] }), facing: 1, expr: 'determined', holdF: 'amphora', rotF: -1.25, elbowF: 1.6, turn: .4, lean: .12 }, t);
      c.steps('m', d, 'wood', .9);
      const e = s.chars.estibador; const de = lt * .9; e.setPos(-1 + de, 0, -1.4); e.update(c.cam, { ...walk(de, { hf: [3, -64], hb: [-4, -64] }), facing: 1, expr: 'neutral', holdF: 'amphora', rotF: -1.25, elbowF: 1.6 }, t);
      const e2 = s.chars.estibador2; const d2 = lt * .8; e2.setPos(2.5 - d2, 0, -.5); e2.update(c.cam, { ...walk(d2), facing: -1, expr: 'neutral', holdB: 'amphora', hb: [0, -64], rotB: .9 }, t);
    } },
  // S16 · 37.65–39.75 · "Casi todo se hace a mano."  Plano detalle del torno.
  { id: 'S16_a_mano', t0: 37.65, set: 'workshop', sfx: [[37.66, 'amb_forge', .5], [37.66, 'wheel', .8], [38.4, 'clay', .6], [39.1, 'anvil', .35]],
    run(c, s) {
      s.mode(); const t = c.t;
      s.burst(2, 39.1);
      c.camKeys([{ t: 0, p: [2.15, 1.05, 1.35], l: [1.95, .8, -.4], fov: 36 }, { t: 2.1, p: [1.75, 1.35, 2.6], l: [1.75, .9, -.4], fov: 42 }], { shake: .01 });
      const sh = Math.sin(t * 3) * 2;
      const m = s.chars.marco; m.setPos(1.45, 0, -.16);
      m.update(c.cam, { ...sit(t, 26), facing: 1, turn: .45, expr: 'determined', look: [.6, .7], hf: [29, -44 + sh], hb: [24, -47 - sh], elbowF: .8, elbowB: .8, lean: .2 }, t);
      const h = s.chars.herrero; h.setPos(-1.45, 0, -.35);
      const k = t - 39.1; const raise = k > -.22 && k < .14 ? (k < 0 ? -k / .22 : k / .14 * .6) : 1;
      h.update(c.cam, { ...idle(t), facing: 1, expr: 'determined', holdF: 'hammer', hf: [lerp(22, 8, raise), lerp(-50, -92, raise)], rotF: lerp(1.75, .2, raise), elbowF: .5, turn: .5 }, t);
    } },
  // S17 · 39.75–42.25 · "Al mediodía, una comida ligera."  Thermopolium.
  { id: 'S17_mediodia', t0: 39.75, set: 'street', sfx: [[39.76, 'amb_street', .8], [39.8, 'sizzle', .7], [40.4, 'bowl', .8]],
    run(c, s) {
      s.mode('noon'); s.cart.visible = s.cart2.visible = false; const t = c.t, lt = c.lt;
      c.camKeys([{ t: 0, p: [7.6, 3.2, 3.2], l: [7.8, 1.0, -4.4], fov: 40 }, { t: .9, p: [7.0, 1.55, .3], l: [7.6, 1.25, -4.3], fov: 38 }, { t: 2.5, p: [6.7, 1.5, -.6], l: [7.4, 1.3, -4.2], fov: 36 }], { shake: .015 });
      const tb = s.chars.tabernero; tb.setPos(8.7, .25, -5.25);
      const give = smooth(inv(40.1, 40.5, t));
      tb.update(c.cam, { ...idle(t), facing: -1, turn: .3, expr: 'happy', hf: [lerp(8, 20, give * (1 - smooth(inv(40.6, 40.9, t)))), -52], elbowF: .4, holdF: t < 40.55 ? 'bowl' : null }, t);
      const m = s.chars.marco; m.setPos(7.0, .25, -4.0);
      const eat = win(t, 41.0, 41.9, .2);
      m.update(c.cam, { ...idle(t), facing: 1, turn: .45, expr: eat > .4 ? 'yum' : 'happy', holdF: t >= 40.55 ? 'bowl' : null, hf: t >= 40.55 ? [lerp(14, 9, eat), lerp(-46, -70, eat)] : [16, -50], rotF: lerp(0, -.5, eat), elbowF: .9 }, t);
      const p = s.chars.peaton3; p.setPos(9.9, .25, -3.6); p.update(c.cam, { ...idle(t + 4), facing: -1, expr: 'yum', holdF: 'cup', hf: [10, -66], elbowF: .6 }, t);
    } },
  // S18 · 42.25–46.35 · "Por la tarde, vas a las termas. Entrar cuesta muy poco."
  { id: 'S18_termas_ext', t0: 42.25, set: 'bathsExt', sfx: [[42.26, 'amb_baths_out', 1], [42.3, 'whoosh_long', .5], [44.95, 'coin', 1], [45.1, 'coin_drop', .7]],
    run(c, s) {
      s.mode(); const t = c.t, lt = c.lt;
      const d = travel(lt, 0, 2.3, 4.6);
      c.camKeys([
        { t: 0, p: [-7.5, 1.0, 15], l: [-1, 5.6, 0], fov: 48 },
        { t: 2.1, p: [-3, .9, 9.5], l: [0, 3.6, 2], fov: 44 },
        { t: 2.35, p: [1.5, 1.8, 7.4], l: [1.9, 1.6, 3.2], fov: 40, ease: easeOut },
        { t: 4.1, p: [1.6, 1.8, 6.9], l: [2.0, 1.65, 3.2], fov: 38 },
      ], { shake: .02 });
      const m = s.chars.marco; m.setPos(-3.0 + d, .8, 3.55);
      const pay = smooth(inv(44.6, 44.95, t)) * (1 - smooth(inv(45.5, 45.8, t)));
      m.update(c.cam, lt < 2.3 ? { ...walk(d), facing: 1, expr: 'happy', turn: .5 } : { ...idle(t), facing: 1, turn: .45, expr: 'happy', holdF: pay > .02 && t < 45.0 ? 'coin' : null, hf: [lerp(8, 22, pay), lerp(-38, -55, pay)], elbowF: .5 }, t);
      c.steps('m', d, 'stone', .8);
      const p = s.chars.portero; p.setPos(2.85, .8, 3.15);
      p.update(c.cam, { ...idle(t), facing: -1, turn: .35, expr: t > 45.0 ? 'happy' : 'neutral', hf: t > 44.9 ? [lerp(14, 18, pay), -55] : [8, -40], holdF: t > 45.0 && t < 45.6 ? 'coin' : null, elbowF: .5 }, t);
      const q = s.chars.peaton1; const dq = lt * 1.0; q.setPos(4.5 - dq * .2, .8 + 0, 3.9 - 0); q.visible = true; q.update(c.cam, { ...idle(t + 2), facing: -1, expr: 'talk', talk: .5 }, t);
      const r = s.chars.peaton2; const dr = lt * .9; r.setPos(-6 + dr, .0, 6.2); r.update(c.cam, { ...walk(dr), facing: 1, expr: 'neutral' }, t); c.steps('r', dr, 'stone', .3);
    } },
];
