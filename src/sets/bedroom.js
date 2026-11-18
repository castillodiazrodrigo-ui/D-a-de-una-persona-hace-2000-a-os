// =====================================================================
//  SET: HABITACIÓN DEL ÚLTIMO PISO DE LA ÍNSULA (cenaculum)
//  Usado para: despertar, "no hay agua", desayuno, cena, oscuridad,
//  lámpara de aceite y el sueño final con el tráfico nocturno.
// =====================================================================
import * as THREE from 'three';
import { baseSet, ground } from './common.js';
import { TEX } from '../world/textures.js';
import { std, box, mesh, bed, blanket, stool, table, shelf, amphora, jar, bowl, oilLamp, bread, cheese, olives, wallHoles, alarmClock, building, flame } from '../world/props.js';
import { Particles, lightShaft } from '../core/stage.js';
import { radialTex } from '../world/textures.js';

export function build() {
  const set = baseSet({ fogNear: 40, fogFar: 200, lights: { sunPos: [-10, 6, -1], target: [-.5, .5, -.8], shadowSize: 4, mapSize: 2048, radius: 4, hemi: .25 } });
  const S = set.scene;
  const wallM = std({ map: TEX.plaster([1.4, 1], 'warm'), rough: .95 });
  const wallM2 = std({ map: TEX.plaster([1.4, 1], 'pale'), rough: .95 });
  // suelo de tablones y techo con vigas
  const floor = mesh(new THREE.PlaneGeometry(4.4, 7), std({ map: TEX.planks([3, 5]) }), { rot: [-Math.PI / 2, 0, 0], pos: [0, 0, 1.6], cast: false }); S.add(floor);
  const ceil = mesh(new THREE.PlaneGeometry(4.4, 7), std({ map: TEX.planks([2, 4]), color: 0x7a5a40 }), { rot: [Math.PI / 2, 0, 0], pos: [0, 2.6, 1.6] }); S.add(ceil);
  for (let i = 0; i < 4; i++) S.add(box(.18, .2, 7, std({ map: TEX.wood([1, 3]), color: 0x6a4a30 }), { pos: [-1.5 + i, 2.4, 0] }));
  // muro del fondo, muro izquierdo con ventana, muro derecho con puerta
  const back = wallHoles(4.4, 2.6, [], .2, wallM); back.position.set(0, 0, -1.7); S.add(back);
  const left = wallHoles(7, 2.6, [{ x: 2.35, y: .95, w: .7, h: .8 }], .22, wallM2); left.rotation.y = Math.PI / 2; left.position.set(-2.1, 0, 1.6); S.add(left);
  const right = wallHoles(7, 2.6, [{ x: -2.0, y: 0, w: .9, h: 1.95 }], .22, wallM2); right.rotation.y = -Math.PI / 2; right.position.set(2.1, 0, 1.6); S.add(right);
  // marco y postigos de la ventana (z ~ -0.75 en coordenadas del mundo)
  const fr = std({ map: TEX.wood([1, 1]), color: 0x7a5434 });
  const winZ = -.75;
  S.add(box(.3, .06, .9, fr, { pos: [-2.0, .92, winZ] }));
  const shutters = [];
  for (const sd of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(-1.98, .95, winZ + sd * .35); const sh = box(.03, .8, .35, fr, { pos: [.02, 0, -sd * .175] }); piv.add(sh); S.add(piv); shutters.push(piv); }
  // marco de la puerta
  S.add(box(.25, .1, 1.05, fr, { pos: [2.0, 1.95, -.4] })); S.add(box(.06, 1.95, .9, std({ map: TEX.planks([1, 1]), color: 0x6a4a30 }), { pos: [2.12, 0, -.4] }));
  // zócalo pintado (franja roja pompeyana)
  S.add(box(4.4, .5, .02, std({ color: 0x8a3a24, rough: .9 }), { pos: [0, 0, -1.59] }));
  // mobiliario
  const theBed = bed(); theBed.position.set(-.7, 0, -1.1); S.add(theBed);
  const blk = blanket(1.25); blk.position.set(-.35, .5, -1.1); S.add(blk);
  const tbl = table(.9, .6, .62); tbl.position.set(.75, 0, -.15); S.add(tbl);
  const stools = [[.15, -.1], [1.4, -.15], [.75, -.72]].map(([x, z]) => { const s = stool(.42); s.position.set(x, 0, z); S.add(s); return s; });
  const sh = shelf(); sh.position.set(1.1, 0, -1.55); S.add(sh);
  const j1 = jar(1.1); j1.position.set(.85, 1.42, -1.55); S.add(j1);
  const b1 = bowl(1); b1.position.set(1.25, 1.42, -1.55); S.add(b1);
  const amph = amphora(1.1); amph.position.set(1.8, 0, -1.45); amph.rotation.z = .12; S.add(amph);
  const rug = mesh(new THREE.PlaneGeometry(1.6, 1), std({ map: TEX.cloth([2, 2], '#7a4a3a') }), { rot: [-Math.PI / 2, 0, 0], pos: [.7, .005, .1], cast: false }); S.add(rug);
  // túnica colgada en un gancho y nicho con lámpara
  const hang = mesh(new THREE.PlaneGeometry(.45, .7, 4, 4), std({ map: TEX.cloth([1, 1], '#8a6a4a'), side: THREE.DoubleSide }), { pos: [-1.6, 1.5, -1.58] }); S.add(hang);
  const niche = box(.4, .35, .1, std({ color: 0x3a2a1e }), { pos: [.0, 1.25, -1.62] }); S.add(niche);
  // objetos de la escena (visibilidad controlada por los planos)
  const lamp = oilLamp(1.4); lamp.position.set(.6, .62, -.1); S.add(lamp);
  const lampLight = new THREE.PointLight(0xff9a40, 0, 6, 1.6); lampLight.castShadow = true; lampLight.shadow.mapSize.set(512, 512); lampLight.shadow.bias = -.004; lampLight.position.set(.75, .75, -.1); S.add(lampLight);
  const food = new THREE.Group(); S.add(food);
  const fBread = bread(1.2); fBread.position.set(.55, .62, -.2); food.add(fBread);
  const fCheese = cheese(1.1); fCheese.position.set(.85, .62, -.05); food.add(fCheese);
  const fOlives = olives(1.1); fOlives.position.set(1.0, .62, -.3); food.add(fOlives);
  const pot = mesh(new THREE.LatheGeometry([[0, 0], [.14, 0], [.18, .1], [.16, .18], [.13, .2]].map(p => new THREE.Vector2(...p)), 20), std({ color: 0x6a3a22, rough: .6 }), { pos: [.75, .62, -.18] }); S.add(pot);
  const cups = [0, 1].map(i => { const c = jar(.45, 0xa0603a); c.position.set(.45 + i * .6, .62, .0); S.add(c); return c; });
  const drop = mesh(new THREE.SphereGeometry(.02, 10, 8), std({ color: 0xa8dcff, rough: .05, metal: .1, emissive: 0x204060, ei: .5 }), { scale: [1, 1.5, 1] }); drop.visible = false; S.add(drop); set.drop = drop;
  const clock = alarmClock(); clock.position.set(-1.65, .45, -.55); S.add(clock);
  const clockStool = stool(.45); clockStool.position.set(-1.65, 0, -.55); S.add(clockStool);
  // vista exterior desde la ventana: edificios vecinos
  const out = new THREE.Group(); S.add(out);
  for (let i = 0; i < 4; i++) { const b = building({ w: 5, d: 4, floors: 5, seed: 30 + i, tint: ['ochre', 'warm', 'red', 'pink'][i], windows: 3, lit: .5 }); b.position.set(-9 - i * 2.5, -9, -6 + i * 4.5); b.rotation.y = Math.PI / 2; out.add(b); }
  // haz de sol volumétrico + polvo en suspensión
  const shaft = lightShaft(3.4, .3, .6, 0xffc88a, .09); S.add(shaft);
  const dust = new Particles('dust', 160, [-2, .3, -1.5, .5, 2.2, .2], { size: 7, color: 0xffe2b0, additive: true, seed: 3 }); S.add(dust.points);
  const steam = new Particles('steam', 18, [.65, .82, -.25, .85, 1.5, -.1], { size: 260, life: 2.4, alpha: .22, seed: 5 }); S.add(steam.points);
  const poof = new Particles('smoke', 30, [-1.8, .5, -.7, -1.5, 1.1, -.4], { size: 380, life: .9, alpha: .6, seed: 8 }); S.add(poof.points);
  // luz de los carros que pasan por la calle (se cuela por la ventana)
  const cartLight = new THREE.PointLight(0xffa040, 0, 9, 1.2); S.add(cartLight);
  // luz de rebote cálida para el interior
  const bounce = new THREE.PointLight(0xffc89a, .6, 9, 1.2); bounce.position.set(.5, 2.0, 1.2); S.add(bounce);

  const marco = set.addToon('marco'); const livia = set.addToon('livia'); const tito = set.addToon('tito');
  Object.assign(set, { shutters, lamp, lampLight, food, fBread, fCheese, fOlives, pot, cups, clock, shaft, dust, steam, poof, cartLight, bounce, blk, stools, tbl });

  // modos de iluminación del interior
  set.mode = (m, k = 0, t = 0) => {
    const L = set.lights;
    shaft.visible = false; dust.intensity = 0; steam.intensity = 0; poof.intensity = 0;
    lampLight.intensity = 0; lamp.userData.flame.visible = false; cartLight.intensity = 0; set.sky.u.stars.value = 0;
    if (m === 'dawn' || m === 'day') {
      set.tod(m === 'dawn' ? 'dawn' : 'day'); set.sunAt(-Math.PI / 2 + .25, m === 'dawn' ? .52 : .75, 20, [-1, .6, -.8]);
      L.sun.intensity = m === 'dawn' ? 3.4 : 3.2; L.hemi.intensity = m === 'dawn' ? .55 : .8; bounce.intensity = m === 'dawn' ? 1.6 : 2.2; bounce.color.set(m === 'dawn' ? 0xffb88a : 0xffe0c0); set.exposure = 1.35;
      shaft.visible = true; dust.intensity = 1; shaft.material.uniforms.opacity.value = .09;
      shaft.position.set(-2.05, 1.38, winZ); shaft.rotation.set(0, 0, m === 'dawn' ? 1.05 : .82);
      shaft.material.uniforms.color.value.set(m === 'dawn' ? 0xffb070 : 0xfff0d0);
    } else if (m === 'dusk') {
      set.tod('dusk'); set.sunAt(-Math.PI / 2 + .1, .28, 20, [-1, .6, -.4]); L.sun.intensity = 3.6 * (1 - k) + .0; L.hemi.intensity = .3 * (1 - k) + .08; bounce.intensity = .7 * (1 - k) + .05;
      bounce.color.set(0xff9a6a);
      shaft.visible = k < .9; shaft.position.set(-2.05, 1.38, winZ); shaft.rotation.set(0, 0, 1.29); shaft.material.uniforms.color.value.set(0xff7a40); shaft.material.uniforms.opacity.value = .25 * (1 - k);
      if (k > 0) { set.tod('dusk', 'night', k); L.sun.intensity = 3.6 * (1 - k) + .25 * k; }
    } else if (m === 'night' || m === 'lamp') {
      set.tod('night'); set.sunAt(-Math.PI / 2 + .3, .6, 20, [-1, .6, -.8]); L.sun.intensity = .9; L.hemi.intensity = .12; bounce.intensity = .05; bounce.color.set(0x6a7aff);
      if (m === 'lamp') { lamp.userData.flame.visible = k > 0; const f = lamp.userData.flame.flicker(t, k); lampLight.intensity = 2.6 * k * f; }
    }
    set.applyTint();
    if (m === 'lamp' && k > 0) { const f = .9 + .1 * Math.sin(t * 23) * Math.sin(t * 7.7); for (const c of set.toons) c.tint.lerp(new THREE.Color(1, .76, .52).multiplyScalar(f), k * .85); }
  };
  set.reset = () => {
    drop.visible = false; clock.visible = false; food.visible = false; pot.visible = false; cups.forEach(c => c.visible = false);
    lamp.visible = true; lamp.position.set(.6, .62, -.1); lampLight.position.set(.75, .75, -.1); bounce.color.set(0xffc89a);
    for (const [i, p] of shutters.entries()) p.rotation.y = (i ? 1 : -1) * 1.9;
    fBread.position.set(.55, .62, -.2); fBread.scale.setScalar(1.2); fCheese.scale.setScalar(1.1); fOlives.scale.setScalar(1.1); fBread.visible = fCheese.visible = fOlives.visible = true;
    steam.box.splice(0, 6, .65, .82, -.25, .85, 1.5, -.1); cartLight.intensity = 0;
  };
  set.update = (t) => { dust.update(t); steam.update(t); poof.update(t); lampLight.visible = lampLight.intensity > 0; cartLight.visible = cartLight.intensity > 0; };
  set.mode('dawn');
  return set;
}
