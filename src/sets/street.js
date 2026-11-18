// =====================================================================
//  SET: CALLE DEL BARRIO (Subura) — fuente pública, thermopolium,
//  puestos del mercado, estatua de Julio César y tráfico nocturno.
//  La calle corre a lo largo del eje X.
// =====================================================================
import * as THREE from 'three';
import { baseSet, ground } from './common.js';
import { TEX } from '../world/textures.js';
import { std, box, mesh, building, farBuilding, fountain, stall, dolium, amphora, crate, sack, pedestal, cart, flame, bush, pine, setGlow, jar, bowl, bread } from '../world/props.js';
import { Particles } from '../core/stage.js';
import { Mule } from '../characters/animals.js';
import { rng } from '../core/math.js';

export function build() {
  const set = baseSet({ fogNear: 25, fogFar: 120, lights: { sunPos: [8, 16, 10], shadowSize: 16, mapSize: 2048 } });
  const S = set.scene;
  const road = mesh(new THREE.PlaneGeometry(90, 6), std({ map: TEX.cobble([30, 2]), rough: .8 }), { rot: [-Math.PI / 2, 0, 0], pos: [0, 0, 0], cast: false }); S.add(road);
  S.add(ground(TEX.dirt([20, 20]), 120)); road.position.y = .01;
  // aceras elevadas de piedra
  const curb = std({ map: TEX.stone([20, 1]) });
  S.add(box(90, .25, 2.4, curb, { pos: [0, 0, -4.2] })); S.add(box(90, .25, 2.4, curb, { pos: [0, 0, 4.2] }));
  // piedras pasaderas (típicas de Pompeya)
  for (const x of [-6, 3.5, 12]) for (let k = 0; k < 3; k++) S.add(mesh(new THREE.CylinderGeometry(.35, .38, .3, 10), curb, { pos: [x, .15, -1.6 + k * 1.6], scale: [1, 1, .7] }));
  // fila de edificios del fondo con tiendas
  const R = rng(13); const tints = ['ochre', 'red', 'warm', 'pink', 'pale', 'ochre', 'red', 'warm', 'pale', 'pink'];
  for (let i = 0; i < 10; i++) { const b = building({ w: 6.5, d: 6, floors: 3 + (i % 3), tint: tints[i], seed: 50 + i, windows: 3, shop: true, lit: .6 }); b.position.set(-30 + i * 6.6, 0, -8.4); S.add(b); }
  // fila delantera (sólo se ve en planos invertidos) — edificios lejanos baratos
  for (let i = 0; i < 9; i++) { const b = farBuilding(6.5, (2 + i % 3) * 2.6, 5, tints[(i + 3) % 10], i + 20); b.position.set(-30 + i * 7, 0, 8.4); b.rotation.y = Math.PI; S.add(b); }
  // ---- fuente pública (x = 0) ----
  const ft = fountain(); ft.position.set(0, .25, -4); S.add(ft); set.fountain = ft;
  const splash = new Particles('sparks', 30, [0, .87, -3.9, 0, 0, 0], { size: 18, life: .5, color: 0xd8f0ff, seed: 4 }); S.add(splash.points); set.splash = splash;
  // ---- thermopolium (x = 8) ----
  const counter = new THREE.Group(); counter.position.set(8, .25, -4.6); S.add(counter);
  counter.add(box(3, 1, .8, std({ map: TEX.plaster([1, .4], 'red') })));
  counter.add(box(3.1, .08, .9, std({ map: TEX.marble([2, 1]) }), { pos: [0, 1, 0] }));
  for (let i = 0; i < 3; i++) { const d = mesh(new THREE.CylinderGeometry(.22, .22, .03, 16), std({ color: 0x2a1408 }), { pos: [-.9 + i * .9, 1.09, 0], cast: false }); counter.add(d); }
  for (let i = 0; i < 4; i++) { const j = jar(.9, [0xb65a32, 0x9a4a2a][i % 2]); j.position.set(-1.2 + i * .8, 2.1, -1.0); counter.add(j); }
  counter.add(box(3, .06, .3, std({ map: TEX.wood([1, 1]) }), { pos: [0, 2.05, -1.0] }));
  const stew = new Particles('steam', 14, [7.1, 1.4, -4.6, 8.9, 2.6, -4.5], { size: 300, life: 2.6, alpha: .2, seed: 2 }); S.add(stew.points); set.stew = stew;
  const bowlC = bowl(1.3); bowlC.position.set(8.9, 1.33, -4.3); S.add(bowlC);
  // ---- mercado (x = 15..23) ----
  const stalls = ['#b8442e', '#3f6f8a', '#c9a23a', '#6a8a4a'].map((c, i) => { const s = stall(c, i + 1); s.position.set(15 + i * 2.6, .25, -4.3); S.add(s); return s; });
  for (let i = 0; i < 6; i++) { const a = amphora(.9 + R() * .3); a.position.set(14 + R() * 10, .25, -3.1 - R() * .4); a.rotation.z = (R() - .5) * .2; S.add(a); }
  for (let i = 0; i < 4; i++) { const c = crate(1); c.position.set(25 + i * .7, .25 + (i % 2) * .5, -4.5); S.add(c); }
  // ---- plaza con estatua de César (x = -12) ----
  const ped = pedestal(); ped.position.set(-12, .25, -4.3); S.add(ped);
  const torchA = flame(3.5); torchA.position.set(-13.6, 2.9, -3.5); S.add(torchA); S.add(box(.08, 2.6, .08, std({ map: TEX.wood([1, 1]) }), { pos: [-13.6, .25, -3.5] }));
  const torchB = flame(3.5); torchB.position.set(-10.4, 2.9, -3.5); S.add(torchB); S.add(box(.08, 2.6, .08, std({ map: TEX.wood([1, 1]) }), { pos: [-10.4, .25, -3.5] }));
  const statueLight = new THREE.PointLight(0xffa050, 0, 9, 1.4); statueLight.position.set(-12, 3.4, -2.6); S.add(statueLight);
  // ---- primer plano: macetas, ánforas, sacos sobre la acera delantera ----
  for (const x of [-15, -4, 5, 11, 20]) { const b = bush(.9); b.position.set(x, .25, 3.6); S.add(b); }
  for (const x of [-8, 2, 9]) { const a = amphora(1.1); a.position.set(x, .25, 3.4); S.add(a); const s = sack(1); s.position.set(x + .6, .25, 3.6); S.add(s); }
  // ---- carro nocturno con mula ----
  const crt = cart(); S.add(crt); set.cart = crt;
  const mule = new Mule(); S.add(mule.root); set.toons.push(mule); set.chars.mule = mule;
  const cartTorch = flame(3.2); S.add(cartTorch); set.cartTorch = cartTorch;
  const cartLight = new THREE.PointLight(0xff9a40, 0, 14, 1.3); S.add(cartLight); set.cartLight = cartLight;
  const crt2 = cart(); S.add(crt2); set.cart2 = crt2; const mule2 = new Mule(); S.add(mule2.root); set.toons.push(mule2); set.chars.mule2 = mule2;
  const dustCart = new Particles('dust', 120, [-20, .1, -1.5, 20, 1.6, 1.5], { size: 14, color: 0xffd0a0, additive: true, seed: 6 }); S.add(dustCart.points); set.dustCart = dustCart;
  // ---- personajes ----
  for (const k of ['marco', 'vecina', 'tito', 'tabernero', 'vendedor', 'peaton1', 'peaton2', 'peaton3', 'carretero', 'cesar']) set.addToon(k);
  set.addToon('carretero', 'carretero2');
  set.chars.cesar.castShadow = true;
  Object.assign(set, { torchA, torchB, statueLight, stalls });
  set.mode = (m) => {
    set.night = m === 'night';
    if (m === 'night') { set.tod('night'); set.sunAt(.6, .9, 40); setGlow(S, 1); set.lights.hemi.intensity = .22; set.exposure = 1.25; }
    else if (m === 'noon') { set.tod('day'); set.sunAt(.3, 1.35, 40); setGlow(S, 0); }
    else { set.tod('dawn', 'day', .7); set.sunAt(-.8, .6, 40); setGlow(S, 0); }
    torchA.visible = torchB.visible = set.night; statueLight.intensity = set.night ? 8 : 0; statueLight.visible = set.night;
    cartTorch.visible = set.night; cartLight.visible = set.night;
    dustCart.intensity = set.night ? .5 : 0; stew.intensity = m === 'night' ? 0 : 1;
    set.applyTint();
  };
  set.reset = () => { crt.visible = crt2.visible = false; set.chars.cesar.tint.setRGB(1, 1, 1); };
  set.update = (t) => {
    splash.update(t); stew.update(t); dustCart.update(t);
    torchA.flicker(t); torchB.flicker(t + 3); cartTorch.flicker(t + 1.3);
    const w = ft.userData.stream.material.map; w.offset.y = -t * 2.5; ft.userData.water.material.map.offset.set(Math.sin(t * .5) * .05, t * .03);
    for (const s of stalls) s.userData.awning.rotation.z = Math.sin(t * 1.3 + s.position.x) * .015;
  };
  set.mode('morning');
  return set;
}
