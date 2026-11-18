// =====================================================================
//  SET: TERRAZA CON RELOJ DE SOL (solarium) — el día de 12 horas,
//  el sol recorre el cielo y las estaciones cambian (verano / invierno).
// =====================================================================
import * as THREE from 'three';
import { baseSet, ground } from './common.js';
import { TEX } from '../world/textures.js';
import { std, box, mesh, sundial, column, tree, farBuilding, hills, cypress, pine, amphora, bush } from '../world/props.js';
import { Particles, cloud } from '../core/stage.js';
import { rng } from '../core/math.js';

export function build() {
  const set = baseSet({ fogNear: 30, fogFar: 180, lights: { sunPos: [10, 10, 5], shadowSize: 9, mapSize: 2048, radius: 2 } });
  const S = set.scene;
  const floorMat = std({ map: TEX.marble([8, 8]), rough: .6, color: 0xc8beb0 }); const floor = ground(null, 30); floor.material = floorMat; S.add(floor);
  set.floorMat = floorMat;
  const dial = sundial(); S.add(dial); set.dial = dial;
  // pórtico de columnas al fondo
  const m = std({ map: TEX.marble([1, 2]), rough: .55 });
  for (let i = 0; i < 7; i++) { const c = column(4, .25, m); c.position.set(-6 + i * 2, 0, -5); S.add(c); }
  S.add(box(14.5, .6, 1, m, { pos: [0, 4, -5] }));
  S.add(box(14.5, 4.6, .4, std({ map: TEX.plaster([4, 1.5], 'red') }), { pos: [0, 0, -6.2] }));
  // balaustrada lateral y macetas
  for (let i = 0; i < 6; i++) S.add(box(.25, .9, .25, m, { pos: [6.5, 0, -4 + i * 1.6] }));
  S.add(box(.3, .12, 8.5, m, { pos: [6.5, .9, 0] }));
  for (const [x, z] of [[-3.5, -3.6], [4.5, -3.8]]) { const a = amphora(1.4); a.position.set(x, 0, z); S.add(a); }
  // árbol que cambia con las estaciones
  const tr = tree(1.3, 0x5a8a30); tr.position.set(-3.2, 0, -2.4); S.add(tr); set.tree = tr;
  const bsh = bush(1.2, 0x4a7a2e); bsh.position.set(3.6, 0, -3.4); S.add(bsh); set.bush = bsh;
  // ciudad lejana más allá de la terraza
  const R = rng(5); const tints = ['warm', 'ochre', 'red', 'pale', 'pink'];
  for (let i = 0; i < 16; i++) { const b = farBuilding(5 + R() * 3, (2 + Math.floor(R() * 3)) * 2.6, 5, tints[i % 5], i + 2); b.position.set(-40 + i * 6 + R() * 2, -6, -22 - R() * 14); S.add(b); }
  S.add(hills(0x6a7a4a, 7, 6, 120));
  for (let i = 0; i < 6; i++) { const c = cypress(5, i); c.position.set(-25 + i * 10, -6, -30); S.add(c); }
  const snow = new Particles('snow', 900, [-4, 0, -3, 6, 5, 6], { size: 30, seed: 9 }); S.add(snow.points); set.snow = snow;
  const heat = new Particles('dust', 80, [-4, .2, -3, 4, 3, 3], { size: 10, color: 0xfff0c0, additive: true, seed: 2 }); S.add(heat.points); set.heat = heat;
  const snowCover = mesh(new THREE.CircleGeometry(9, 32), std({ color: 0xf2f6fb, rough: .9, transparent: true, opacity: 0 }), { rot: [-Math.PI / 2, 0, 0], pos: [0, .01, 0], cast: false }); S.add(snowCover); set.snowCover = snowCover;
  for (let i = 0; i < 5; i++) { const c = cloud(40, .6); c.position.set(-80 + i * 40, 40 + R() * 20, -150); S.add(c); }
  const marco = set.addToon('marco');
  // dayK: 0 = amanecer (este) … 1 = atardecer (oeste); arc: altura máxima del sol
  set.day = (dayK, arc = 1.05) => {
    const az = Math.PI * .5 - dayK * Math.PI;            // de +x (este) a -x (oeste), pasando por el sur (+z)
    const el = Math.max(.04, Math.sin(dayK * Math.PI) * arc);
    set.sunAt(az, el, 30, [0, 0, 0]);
    const hk = Math.sin(dayK * Math.PI);                  // 0 en los extremos, 1 a mediodía
    if (hk < .5) set.tod(dayK < .5 ? 'dawn' : 'dusk', 'day', hk * 2); else set.tod('day');
  };
  set.season = (k) => { // 0 verano … 1 invierno
    tr.userData.leafMat.color.set(0x5a8a30).lerp(new THREE.Color(0xb8a070), Math.min(1, k * 1.5));
    tr.userData.leaves.children.forEach((l, i) => { l.visible = k < .45 + i * .07; });
    snow.intensity = Math.max(0, k * 1.4 - .3); snowCover.material.opacity = Math.max(0, k - .25) * .9;
    heat.intensity = Math.max(0, 1 - k * 3);
    if (k > 0) { const L = set.lights; const W = new THREE.Color(0xdde6ff); L.sun.color.lerp(W, k); L.hemi.color.lerp(new THREE.Color(0xc8d4ec), k); set.scene.fog.color.lerp(new THREE.Color(0xc8d2de), k); set.sky.u.mid.value.lerp(new THREE.Color(0xd8e0ea), k); set.sky.u.top.value.lerp(new THREE.Color(0x7088b0), k); }
  };
  set.update = (t) => { snow.update(t); heat.update(t); };
  set.day(.5); set.season(0);
  return set;
}
