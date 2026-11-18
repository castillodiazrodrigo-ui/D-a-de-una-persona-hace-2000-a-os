// =====================================================================
//  ACTO 3 — TARDE, NOCHE Y TRÁFICO (46.35 s – 67.79 s)
// =====================================================================
import { lerp, clamp, smooth, inv, win, pulse, walk, idle, sit, lying, travel, poseTrack, PI } from './helpers.js';
import { backOut, easeOut, easeInOut } from '../core/math.js';

export const SHOTS = [
  // S19 · 46.35–50.00 · "Ahí te bañas, conversas y cierras negocios."
  { id: 'S19_termas_int', t0: 46.35, set: 'bathsInt', sfx: [[46.36, 'amb_baths_in', 1], [46.88, 'splash', 1], [47.2, 'splash_small', .6], [47.65, 'murmur', .8], [48.95, 'handshake', .9], [49.1, 'ding', .45]],
    run(c, s) {
      s.mode(); const t = c.t, lt = c.lt;
      s.splash(0, 46.88, -1.25, .75); s.splash(1, 47.2, -1.1, .7);
      c.camKeys([
        { t: 0, p: [-3.6, 2.6, 6.2], l: [-.8, .9, .3], fov: 44 },
        { t: 1.2, p: [-2.3, 1.4, 4.0], l: [-.8, .95, .5], fov: 40 },
        { t: 2.2, p: [-.5, 1.45, 5.2], l: [-.5, 1.0, .5], fov: 46, ease: easeOut },
        { t: 3.65, p: [-.4, 1.4, 4.8], l: [-.5, 1.05, .5], fov: 44 },
      ], { shake: .015 });
      const yW = -.42;
      const splashPose = { ...idle(t), facing: 1, turn: .4, expr: 'joy', hf: [lerp(14, 6, pulse(t, 46.75, .4)), lerp(-36, -88, pulse(t, 46.75, .45))], hb: [-6, lerp(-36, -86, pulse(t, 46.8, .45))], elbowF: .4, elbowB: .4 };
      const talkPose = { ...idle(t), facing: 1, turn: .45, expr: 'talk', talk: win(t, 47.65, 48.1, .08) * .9, hf: [16, -52 + Math.sin(t * 6) * 4], elbowF: .5 };
      const deal = { ...idle(t), facing: 1, turn: .45, expr: 'confident', hf: [17, -54 + Math.sin(clamp((t - 48.95) / .5) * 18) * 1.5 * win(t, 48.9, 49.6, .05)], elbowF: .3 };
      const m = s.chars.marcoBano; m.setPos(-1.25, yW, .75);
      m.update(c.cam, poseTrack(lt, [[0, splashPose], [1.25, talkPose], [2.35, deal]], .2), t);
      const b1 = s.chars.banista1; b1.setPos(.25, yW, .35);
      b1.update(c.cam, { ...idle(t + 1), facing: -1, turn: .4, expr: t > 47.9 && t < 48.4 ? 'talk' : 'happy', talk: win(t, 48.0, 48.45, .08) * .8, hf: [12, -48 + Math.sin(t * 5) * 3], elbowF: .5 }, t);
      const b2 = s.chars.banista2; const inK = smooth(inv(48.2, 48.75, t));
      b2.setPos(lerp(1.6, -.27, inK), yW, .95);
      b2.update(c.cam, { ...idle(t + 2), facing: -1, turn: .4, expr: 'confident', hf: [lerp(8, 17, smooth(inv(48.6, 48.95, t))), lerp(-40, -54, smooth(inv(48.6, 48.95, t))) + Math.sin(clamp((t - 48.95) / .5) * 18) * 1.5 * win(t, 48.9, 49.6, .05)], elbowF: .3 }, t);
    } },
  // S20 · 50.00–52.25 · "Al atardecer, llega la cena."  La familia a la mesa.
  { id: 'S20_cena', t0: 50.0, set: 'bedroom', sfx: [[50.02, 'amb_dusk', .8], [51.1, 'pot', .9], [51.5, 'cutlery', .6]],
    run(c, s) {
      s.mode('dusk', 0); const t = c.t, lt = c.lt;
      s.food.visible = true; s.fOlives.visible = false; s.fCheese.visible = false; s.fBread.visible = true; s.fBread.scale.setScalar(1.2); s.fBread.position.set(.45, .62, -.25);
      s.cups.forEach(x => x.visible = true); s.lamp.visible = true;
      const potK = smooth(inv(50.25, 51.05, t));
      s.pot.visible = true; s.pot.position.set(lerp(1.9, .78, potK), lerp(.95, .62, smooth(inv(50.85, 51.08, t))), lerp(.35, -.18, potK));
      s.steam.intensity = 1; s.steam.box[0] = s.pot.position.x - .1; s.steam.box[3] = s.pot.position.x + .1; s.steam.box[1] = s.pot.position.y + .2;
      c.camKeys([{ t: 0, p: [.9, 1.5, 3.9], l: [.85, .85, -.3], fov: 44 }, { t: 2.25, p: [.8, 1.35, 3.3], l: [.8, .82, -.3], fov: 42 }], { shake: .01 });
      const L = s.chars.livia; const ld = travel(lt, 0, 1.0, .95);
      L.setPos(2.25 - ld, 0, .1);
      L.update(c.cam, lt < 1.05 ? { ...walk(ld), facing: -1, expr: 'happy', turn: .4, hf: [20, -54], hb: [16, -54], elbowF: .2, elbowB: .2 } : { ...idle(t), facing: -1, expr: 'happy', turn: .45, hf: [lerp(20, 8, smooth(inv(51.1, 51.5, t))), -48] }, t);
      c.steps('livia', ld, 'wood', .5);
      const m = s.chars.marco; m.setPos(.12, 0, -.05);
      m.update(c.cam, { ...sit(t, 24.7), facing: 1, turn: .55, expr: t > 51.05 ? 'joy' : 'happy', hf: t > 51.05 ? [12, -52 + Math.sin(t * 9) * 2] : [18, -40], elbowF: .6 }, t);
      const k = s.chars.tito; k.setPos(.75, 0, -.72);
      k.update(c.cam, { ...sit(t, 40), facing: 1, turn: 0, expr: t > 51.0 ? 'joy' : 'happy', hf: [10, -52 + pulse(t, 51.2, .3) * 12], hb: [-10, -52 + pulse(t, 51.25, .3) * 12], fx: { spark: win(t, 51.1, 51.9, .1) * .6 } }, t);
    } },
  // S21 · 52.25–54.50 · "Y después, la oscuridad."  La luz se apaga.
  { id: 'S21_oscuridad', t0: 52.25, set: 'bedroom', sfx: [[52.3, 'dark_whoosh', .9], [52.6, 'crickets', .8], [53.4, 'owl', .4]],
    run(c, s) {
      const t = c.t, k = smooth(inv(52.35, 53.9, t));
      s.mode('dusk', k); s.food.visible = true; s.fOlives.visible = false; s.fCheese.visible = false; s.fBread.visible = false; s.pot.visible = true; s.pot.position.set(.78, .62, -.18); s.cups.forEach(x => x.visible = true); s.lamp.visible = true;
      c.camKeys([{ t: 0, p: [.8, 1.35, 3.3], l: [.8, .82, -.3], fov: 42 }, { t: 2.25, p: [.78, 1.2, 2.5], l: [.78, .85, -.3], fov: 40 }]);
      const m = s.chars.marco; m.setPos(.12, 0, -.05); m.update(c.cam, { ...sit(t, 24.7), facing: 1, turn: .5, expr: k > .5 ? 'fear' : 'neutral', look: [.6, -.2] }, t);
      const L = s.chars.livia; L.setPos(1.35, 0, -.05); L.update(c.cam, { ...sit(t, 24.7), facing: -1, turn: .5, expr: k > .5 ? 'surprise' : 'happy' }, t);
      const ki = s.chars.tito; ki.setPos(.75, 0, -.72); ki.update(c.cam, { ...sit(t, 40), facing: 1, turn: 0, expr: k > .6 ? 'fear' : 'neutral', hf: [8, -60], hb: [-8, -60] }, t);
    } },
  // S22 · 54.50–56.55 · "Sólo hay lámparas de aceite."  Marco enciende la lucerna.
  { id: 'S22_lampara', t0: 54.5, set: 'bedroom', sfx: [[54.8, 'strike', .8], [55.05, 'ignite', 1], [55.2, 'flame_loop', .7]],
    run(c, s) {
      const t = c.t, lit = smooth(inv(55.05, 55.45, t));
      s.mode('lamp', lit, t); s.food.visible = false; s.pot.visible = true; s.pot.position.set(.95, .62, -.25); s.cups.forEach(x => x.visible = true); s.lamp.visible = true;
      s.lamp.position.set(.6, .62, -.1);
      c.camKeys([{ t: 0, p: [.62, 1.0, 1.25], l: [.62, .74, -.12], fov: 38 }, { t: 1.0, p: [.62, 1.0, 1.1], l: [.62, .76, -.12], fov: 36 }, { t: 2.05, p: [.82, 1.3, 2.9], l: [.75, .85, -.2], fov: 42 }], { shake: .008 });
      const m = s.chars.marco; m.setPos(.12, 0, -.05);
      const reach = smooth(inv(54.55, 54.95, t)) * (1 - smooth(inv(55.4, 55.8, t)));
      m.update(c.cam, { ...sit(t, 24.7), facing: 1, turn: .5, expr: lit > .5 ? 'happy' : 'determined', look: [.7, .6], hf: [lerp(14, 26, reach), lerp(-40, -42, reach)], holdF: reach > .2 ? 'torch' : null, rotF: 1.2, elbowF: .4 }, t);
      const L = s.chars.livia; L.setPos(1.35, 0, -.05); L.update(c.cam, { ...sit(t, 24.7), facing: -1, turn: .5, expr: lit > .5 ? 'happy' : 'neutral' }, t);
      const ki = s.chars.tito; ki.setPos(.75, 0, -.72); ki.update(c.cam, { ...sit(t, 40), facing: 1, turn: 0, expr: lit > .5 ? 'joy' : 'fear', hf: [8, lit > .5 ? -66 : -60], hb: [-8, -60] }, t);
    } },
  // S23 · 56.55–59.10 · "Pero Roma no duerme en silencio."
  // En la cama, con la lámpara tenue, Marco abre los ojos: ruido fuera.
  { id: 'S23_no_silencio', t0: 56.55, set: 'bedroom', sfx: [[56.56, 'amb_night', .9], [57.4, 'cart_far', .9], [57.6, 'dog', .5], [58.4, 'whoosh_long', .6]],
    run(c, s) {
      const t = c.t, lt = c.lt;
      s.mode('lamp', .45, t); s.food.visible = false; s.pot.visible = false; s.cups.forEach(x => x.visible = false); s.lamp.visible = true; s.lamp.position.set(-1.65, .45, -.55); s.lampLight.position.set(-1.55, .6, -.5);
      s.clock.visible = false;
      // luz de un carro que pasa al otro lado de la ventana
      const cx = smooth(inv(57.2, 59.0, t)); s.cartLight.intensity = 5 * win(t, 57.2, 59.1, .4); s.cartLight.position.set(-3.2, 1.2, lerp(-3, 2.5, cx));
      c.camKeys([{ t: 0, p: [-.5, 1.4, 2.6], l: [-.95, .75, -1.0], fov: 42 }, { t: 1.4, p: [-.8, 1.2, 1.7], l: [-1.15, .8, -1.0], fov: 40 }, { t: 2.55, p: [-1.55, 1.35, -.6], l: [-2.6, 1.3, -.75], fov: 42, ease: easeInOut }]);
      const m = s.chars.marco; m.setPos(.15, .72, -1.1);
      m.update(c.cam, poseTrack(lt, [[0, lying({ expr: 'sleepy' })], [.85, lying({ expr: 'surprise', look: [-.9, -.4], fx: { exclaim: win(t, 57.45, 58.4, .1) } })], [1.6, lying({ expr: 'confused', look: [-.9, -.4] })]], .15), t);
      s.blk.drape(0);
    } },
  // S24 · 59.10–60.45 · "Desde Julio César,"  Estatua de César (contrapicado).
  { id: 'S24_cesar', t0: 59.1, set: 'street', sfx: [[59.12, 'amb_night', .8], [59.15, 'boom_soft', .9], [59.3, 'torch_loop', .6]],
    run(c, s) {
      s.mode('night'); s.cart.visible = s.cart2.visible = false; const t = c.t;
      c.camKeys([{ t: 0, p: [-11.3, .55, 1.0], l: [-12, 3.2, -4.3], fov: 44 }, { t: 1.35, p: [-11.6, .7, -.2], l: [-12, 3.3, -4.3], fov: 40 }], { shake: .01 });
      const cs = s.chars.cesar; cs.setPos(-12, 2.03, -4.3); cs.tint.setRGB(.95, .82, .72);
      cs.update(c.cam, { ...idle(0), facing: 1, turn: .25, expr: 'confident', noBlink: true, hf: [26, -98], elbowF: .1, scale: 1.25, contact: false }, 0);
    } },
  // S25 · 60.45–63.75 · "la mayoría de los carros sólo podía circular de noche."
  { id: 'S25_carros', t0: 60.45, set: 'street', sfx: [[60.46, 'amb_night', .8], [60.5, 'cart_roll', 1], [61.2, 'mule_snort', .6], [63.0, 'cart_roll2', .8]],
    run(c, s) {
      s.mode('night'); const t = c.t, lt = c.lt;
      const drive = (cartObj, mule, driver, x0, z, d, flip) => {
        cartObj.visible = true; cartObj.position.set(x0 + d, .02, z); cartObj.userData.wheels.forEach(w => w.rotation.z = -d / .5);
        cartObj.rotation.y = 0; cartObj.position.y = .02 + Math.abs(Math.sin(d * 3.2)) * .012;
        mule.setPos(x0 + d + 3.15, .02, z); mule.update(c.cam, { facing: 1, walkPhase: d * PI * 2, nod: Math.sin(d * 6) * .04, contact: true }, t);
        driver.setPos(x0 + d + 2.0, .25, z + 1.05); driver.update(c.cam, { ...walk(d), facing: 1, expr: 'sleepy', holdF: 'torch', hf: [8, -66], rotF: .1, elbowF: .6, turn: .45 }, t);
      };
      const d1 = lt * 1.6, d2 = lt * 1.45;
      drive(s.cart, s.chars.mule, s.chars.carretero, -13, -1.0, d1);
      drive(s.cart2, s.chars.mule2, s.chars.carretero2, -24, -1.0, d2);
      c.steps('mule1', d1, 'hoof', 1, 14.7); c.steps('mule2', d2, 'hoof', .6, 14.7);
      const tp = s.cartTorch; const cx = -13 + d1 + 2.0; tp.position.set(cx + .25, 1.9 + .02, .05 + .0); s.cartLight.position.set(cx + .3, 2.2, .4); s.cartLight.intensity = 9 * (.9 + .1 * Math.sin(t * 20));
      c.camKeys([
        { t: 0, p: [-11.8, .6, 3.6], l: [-10.4, .75, -1.0], fov: 42 },
        { t: 1.4, p: [-9.0, .65, 3.8], l: [-8.0, .85, -1.0], fov: 42 },
        { t: 1.6, p: [-9.5, 3.2, 7.8], l: [-8.5, 1.2, -1.5], fov: 46, ease: easeOut },
        { t: 3.3, p: [-6.5, 3.4, 8.2], l: [-6.5, 1.2, -1.5], fov: 46 },
      ], { shake: .02 });
      s.dustCart.box[0] = cx - 4; s.dustCart.box[3] = cx + 3;
    } },
  // S26 · 63.75–66.10 · "Así que te dormías igual que hoy,"
  { id: 'S26_dormir', t0: 63.75, set: 'bedroom', sfx: [[63.76, 'amb_night_room', .9], [64.2, 'cart_far', .7]],
    run(c, s) {
      const t = c.t; s.mode('night'); s.food.visible = false; s.pot.visible = false; s.cups.forEach(x => x.visible = false); s.lamp.visible = true; s.lamp.position.set(-1.65, .45, -.55);
      for (const [i, p] of s.shutters.entries()) p.rotation.y = (i ? 1 : -1) * 1.9;
      const cx = ((t - 63.75) / 2.2) % 1; s.cartLight.intensity = 6 * Math.sin(cx * PI); s.cartLight.position.set(-3.4, 1.1, lerp(-3.5, 2.5, cx));
      c.camKeys([{ t: 0, p: [-.3, 1.6, 2.9], l: [-.85, .75, -1.05], fov: 44 }, { t: 2.35, p: [-.65, 1.3, 2.0], l: [-1.0, .75, -1.05], fov: 40 }]);
      const m = s.chars.marco; m.setPos(.15, .72, -1.1);
      m.update(c.cam, lying({ expr: { ...{ eye: 0, mouth: .7, brow: .2, open: 0, mw: .8, blush: .4 } }, fx: { zzz: t > 64.3 }, hf: [8, -34 + Math.sin(t * 1.6) * .8] }), t);
      s.blk.drape(0);
    } },
  // S27 · 66.10–67.79 · "escuchando el tráfico."  Salida por la ventana a la ciudad nocturna.
  { id: 'S27_trafico', t0: 66.1, set: 'city', sfx: [[66.11, 'whoosh_long', .6], [66.15, 'amb_night_city', 1]],
    run(c, s) {
      s.mode('night', .0);
      c.camKeys([
        { t: 0, p: [0, 11.7, 8.2], l: [0, 11.2, 3.5], fov: 42 },
        { t: 1.69, p: [10, 22, 34], l: [6, 6, 0], fov: 46, ease: easeInOut },
      ], { shake: .03 });
      s.winGlow.material.emissiveIntensity = .45;
    } },
];
