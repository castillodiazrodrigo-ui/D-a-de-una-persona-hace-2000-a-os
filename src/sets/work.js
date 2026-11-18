// =====================================================================
//  SETS DE TRABAJO: TALLER (fragua + torno de alfarero) y PUERTO
// =====================================================================
import * as THREE from 'three';
import { baseSet, ground } from './common.js';
import { TEX } from '../world/textures.js';
import { stool as stoolW, std, box, mesh, anvil, forge, potWheel, shelf, jar, amphora, crate, sack, ship, farBuilding, column, hills, flame, wallHoles, bowl } from '../world/props.js';
import { Particles } from '../core/stage.js';
import { Gull } from '../characters/animals.js';
import { rng } from '../core/math.js';

export function buildWorkshop() {
  const set = baseSet({ fogNear: 20, fogFar: 90, lights: { sunPos: [4, 9, 14], target: [0, 1, 0], shadowSize: 6, mapSize: 2048, hemi: .45 } });
  const S = set.scene;
  S.add(ground(TEX.dirt([4, 4]), 30));
  const brick = std({ map: TEX.brick([2, 1]) });
  const back = wallHoles(9, 3.4, [], .3, brick); back.position.set(0, 0, -3); S.add(back);
  const l = wallHoles(6, 3.4, [], .3, brick); l.rotation.y = Math.PI / 2; l.position.set(-4.5, 0, 0); S.add(l);
  const r = wallHoles(6, 3.4, [], .3, brick); r.rotation.y = Math.PI / 2; r.position.set(4.5, 0, 0); S.add(r);
  S.add(box(9.4, .2, 6.4, std({ map: TEX.planks([3, 2]), color: 0x6a4a30 }), { pos: [0, 3.4, 0] }));
  for (let i = 0; i < 5; i++) S.add(box(.2, .25, 6.2, std({ map: TEX.wood([1, 3]), color: 0x5a3a24 }), { pos: [-3.6 + i * 1.8, 3.15, 0] }));
  const fg = forge(); fg.position.set(-2.6, 0, -2.2); S.add(fg);
  const av = anvil(); av.position.set(-.9, 0, -.6); S.add(av); set.anvil = av;
  const pw = potWheel(); pw.position.set(2.0, 0, -.4); S.add(pw); set.wheel = pw;
  const st = stoolW(); st.position.set(1.45, 0, -.16); S.add(st);
  const sh = shelf(); sh.position.set(2.4, .2, -2.75); S.add(sh); const sh2 = shelf(); sh2.position.set(2.4, -.5, -2.75); S.add(sh2);
  for (let i = 0; i < 5; i++) { const j = jar(.9 + (i % 2) * .2, [0xb65a32, 0xa8603a, 0x9a4a2a][i % 3]); j.position.set(1.95 + i * .22, i < 3 ? 1.62 : .92, -2.75); S.add(j); }
  for (let i = 0; i < 4; i++) { const b = bowl(1.2); b.position.set(3.4, .02, -1.5 + i * .35); S.add(b); }
  for (let i = 0; i < 3; i++) { const a = amphora(1.1); a.position.set(-3.8 + i * .55, 0, -2.6); S.add(a); }
  // herramientas colgadas
  for (let i = 0; i < 4; i++) S.add(box(.05, .7, .03, std({ color: 0x3a3c40, metal: .7, rough: .4 }), { pos: [-1.2 + i * .3, 1.6, -2.83] }));
  const forgeL = new THREE.PointLight(0xff6a20, 6, 7, 1.4); forgeL.position.set(-2.6, 1.3, -1.6); S.add(forgeL);
  const embers = new Particles('embers', 40, [-2.6, 1.0, -2.2, 0, 0, 0], { size: 16, life: 1.6, color: 0xffa040, additive: true, seed: 3 }); S.add(embers.points);
  const smoke = new Particles('smoke', 14, [-2.9, 1.2, -2.4, -2.3, 3.2, -2.0], { size: 500, life: 3, alpha: .2, color: 0x8a8078, seed: 6 }); S.add(smoke.points);
  const sparks = []; for (let i = 0; i < 4; i++) { const p = new Particles('sparks', 40, [-.75, .86, -.6, 0, 0, 0], { size: 14, life: .45, color: 0xffd070, additive: true, seed: 10 + i, burstAt: -9 }); S.add(p.points); sparks.push(p); }
  const dust = new Particles('dust', 100, [-4, .3, -2.8, 4, 3, 2], { size: 9, color: 0xffe0b0, additive: true, seed: 8 }); S.add(dust.points);
  set.addToon('marco'); set.addToon('herrero');
  Object.assign(set, { forgeL, sparks, embers });
  set.mode = () => { set.tod('day'); set.sunAt(.3, .55, 25, [0, 1, 0]); set.lights.sun.intensity = 2.2; set.lights.hemi.intensity = .5; set.exposure = 1.15; set.applyTint([1, .95, .88]); };
  set.burst = (i, at) => { sparks[i % sparks.length].o.burstAt = at; };
  set.reset = () => { for (const p of sparks) p.o.burstAt = -9; };
  set.update = (t) => { embers.update(t); smoke.update(t); dust.update(t); for (const s of sparks) s.update(t); forgeL.intensity = 6 + Math.sin(t * 9) * 1.2 + Math.sin(t * 23) * .6; pw.userData.disc.rotation.y = t * 9; pw.userData.clay.rotation.y = t * 9; };
  set.mode(); return set;
}

export function buildPort() {
  const set = baseSet({ fogNear: 40, fogFar: 220, lights: { sunPos: [12, 14, 10], shadowSize: 16, mapSize: 2048 } });
  const S = set.scene;
  // agua con olas (vértices animados)
  const wg = new THREE.PlaneGeometry(200, 120, 80, 40); wg.rotateX(-Math.PI / 2);
  const wMat = std({ map: TEX.water([40, 24]), color: 0x6aa8b8, rough: .15, metal: .2 });
  const water = mesh(wg, wMat, { pos: [0, -.6, -58], cast: false }); S.add(water);
  const wb = wg.attributes.position.array.slice();
  // muelle de madera sobre pilotes
  const dock = box(40, .3, 6, std({ map: TEX.planks([10, 2]), color: 0x9a7a5a }), { pos: [0, -.3, 0] }); S.add(dock);
  for (let i = 0; i < 20; i++) S.add(mesh(new THREE.CylinderGeometry(.15, .15, 2.4, 8), std({ map: TEX.wood([1, 1]) }), { pos: [-19 + i * 2, -1.2, -2.9] }));
  const quay = ground(TEX.stone([20, 4]), 80); quay.position.set(0, -.01, 43); S.add(quay);
  const sh = ship(); sh.position.set(-1, -1.2, -6.2); S.add(sh); set.ship = sh;
  const sh2 = ship(); sh2.position.set(-30, -1.2, -30); sh2.rotation.y = .4; sh2.scale.setScalar(.9); S.add(sh2);
  // carga en el muelle
  const R = rng(17);
  for (let i = 0; i < 8; i++) { const a = amphora(1 + R() * .2); a.position.set(3 + (i % 4) * .45, 0, -1 - Math.floor(i / 4) * .45); S.add(a); }
  for (let i = 0; i < 6; i++) { const c = crate(1.2); c.position.set(-6 + (i % 3) * .75, Math.floor(i / 3) * .6, -1.2); S.add(c); }
  for (let i = 0; i < 4; i++) { const s = sack(1.1); s.position.set(7 + i * .6, 0, -1.6); S.add(s); }
  S.add(mesh(new THREE.CylinderGeometry(.18, .2, .5, 10), std({ color: 0x4a3a2a }), { pos: [1.5, .25, -2.6] }));
  // almacenes (horrea) y faro al fondo
  for (let i = 0; i < 5; i++) { const b = farBuilding(7, 5.2, 6, ['warm', 'red', 'ochre', 'pale', 'red'][i], i + 40); b.position.set(-16 + i * 8, 0, 8); b.rotation.y = Math.PI; S.add(b); }
  const lh = new THREE.Group(); const stone = std({ map: TEX.stone([2, 4]) }); lh.add(box(4, 8, 4, stone)); lh.add(box(3, 6, 3, stone, { pos: [0, 8, 0] })); lh.add(mesh(new THREE.CylinderGeometry(1.1, 1.3, 4, 12), stone, { pos: [0, 16, 0] })); const lf = flame(14); lf.position.set(0, 18.4, 0); lh.add(lf); lh.position.set(40, -1, -70); S.add(lh); set.lhFlame = lf;
  S.add(hills(0x6a7a56, 11, 6, 160));
  const gulls = [0, 1, 2, 3].map(i => { const g = new Gull(i + 1); S.add(g.root); return g; });
  const spray = new Particles('dust', 90, [-12, -.5, -6, 12, .3, -3], { size: 14, color: 0xffffff, additive: true, seed: 4 }); S.add(spray.points);
  for (const k of ['marco', 'estibador', 'estibador2', 'peaton3']) set.addToon(k);
  set.mode = () => { set.tod('day'); set.sunAt(.4, .75, 40); set.applyTint(); };
  set.update = (t, ctx) => {
    const p = wg.attributes.position.array; for (let i = 0; i < p.length; i += 3) { const x = wb[i], z = wb[i + 2]; p[i + 1] = Math.sin(x * .35 + t * 1.6) * .12 + Math.sin(z * .5 + t * 1.1 + x * .1) * .1; } wg.attributes.position.needsUpdate = true; wg.computeVertexNormals();
    wMat.map.offset.set(t * .01, t * .02);
    sh.position.y = -1.2 + Math.sin(t * 1.2) * .08; sh.rotation.z = Math.sin(t * .9) * .015; sh.userData.billow(t);
    lhFlicker(t); spray.update(t);
    gulls.forEach((g, i) => { const a = t * (.35 + i * .07) + i * 1.7; g.setPos(Math.cos(a) * (6 + i * 2) + 1, 6 + i * 1.2 + Math.sin(t * 2 + i), -8 + Math.sin(a) * 4); if (ctx?.cam) g.update(ctx.cam, { facing: -Math.sin(a) > 0 ? 1 : -1 }, t); });
  };
  const lhFlicker = (t) => lf.flicker(t);
  set.mode(); return set;
}
