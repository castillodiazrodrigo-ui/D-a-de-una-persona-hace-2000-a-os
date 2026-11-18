// =====================================================================
//  SETS: TERMAS — fachada exterior (tarde dorada) e interior
//  (piscina humeante, bóveda, haces de luz, bañistas).
// =====================================================================
import * as THREE from 'three';
import { baseSet, ground } from './common.js';
import { TEX } from '../world/textures.js';
import { std, box, mesh, column, roof, farBuilding, pine, cypress, bush, amphora, table, stool, archWall } from '../world/props.js';
import { Particles, lightShaft } from '../core/stage.js';

function inscription(text) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const x = c.getContext('2d');
  x.fillStyle = '#e4dccb'; x.fillRect(0, 0, 1024, 160); x.fillStyle = '#3a2a1a'; x.font = '900 104px Cinzel, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 512, 86);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildBathsExt() {
  const set = baseSet({ fogNear: 30, fogFar: 160, lights: { sunPos: [-14, 8, 12], target: [0, 2, 0], shadowSize: 14, mapSize: 2048 } });
  const S = set.scene;
  S.add(ground(TEX.stone([16, 16]), 90));
  const m = std({ map: TEX.marble([2, 1]), rough: .55 });
  // escalinata
  for (let i = 0; i < 4; i++) S.add(box(16 - i * .4, .2, 2.4 - i * .5, m, { pos: [0, i * .2, 4.4 - i * .25] }));
  S.add(box(17, .8, 3.0, m, { pos: [0, 0, 2.6] }));
  // cuerpo del edificio de ladrillo + columnas + frontón
  S.add(box(18, 9, 12, std({ map: TEX.brick([4, 2]) }), { pos: [0, 0, -4] }));
  S.add(mesh(new THREE.CylinderGeometry(5, 5, 4, 24, 1, false, 0, Math.PI), std({ map: TEX.brick([3, 1]) }), { pos: [0, 9, -4], rot: [Math.PI / 2, 0, Math.PI / 2] }));
  for (let i = 0; i < 6; i++) { const c = column(6, .38, m); c.position.set(-6.25 + i * 2.5, .8, 2.6); S.add(c); }
  S.add(box(16, 1, 2.2, m, { pos: [0, 6.8, 2.3] }));
  const ped = new THREE.Shape(); ped.moveTo(-8, 0); ped.lineTo(8, 0); ped.lineTo(0, 2.6); ped.closePath();
  S.add(mesh(new THREE.ExtrudeGeometry(ped, { depth: 2.2, bevelEnabled: false }), m, { pos: [0, 7.8, 1.2] }));
  const ins = mesh(new THREE.PlaneGeometry(9, 1.3), std({ map: inscription('THERMAE'), rough: .7 }), { pos: [0, 7.3, 3.42], cast: false }); S.add(ins);
  // puerta de entrada con interior cálido
  const door = archWall(5, 5.2, 3, 4.4, .3, m); door.position.set(0, .8, 1.95); S.add(door);
  S.add(box(3, 4.4, .1, std({ color: 0x2a1408, emissive: 0xff9a50, ei: .45 }), { pos: [0, .8, 1.7], cast: false }));
  const steam = new Particles('steam', 16, [-1.3, 1.2, 1.9, 1.3, 5, 2.3], { size: 900, life: 4, alpha: .12, seed: 3 }); S.add(steam.points);
  // mesa del portero con la caja de monedas
  const tb = table(1.1, .6, .9); tb.position.set(2.6, .8, 3.4); S.add(tb);
  const coinBox = box(.35, .2, .25, std({ map: TEX.wood([1, 1]), color: 0x7a5434 }), { pos: [2.4, 1.7, 3.4] }); S.add(coinBox);
  for (let i = 0; i < 6; i++) S.add(mesh(new THREE.CylinderGeometry(.04, .04, .012, 14), std({ color: 0xc08a3a, metal: .8, rough: .3 }), { pos: [2.75 + (i % 3) * .09, 1.71 + Math.floor(i / 3) * .013, 3.45] }));
  // entorno
  for (const [x, z] of [[-14, -2], [14, -2], [-20, -10], [20, -10]]) { const p = pine(7, x); p.position.set(x, 0, z); S.add(p); }
  for (const x of [-10, -9, 9, 10]) { const c = cypress(4.5, x); c.position.set(x, 0, 5); S.add(c); }
  for (let i = 0; i < 6; i++) { const b = farBuilding(7, (2 + i % 3) * 2.6, 5, ['warm', 'red', 'pale'][i % 3], i + 60); b.position.set(-30 + i * 12, 0, -25); S.add(b); }
  const dust = new Particles('dust', 120, [-6, .5, 0, 6, 5, 8], { size: 12, color: 0xffd8a0, additive: true, seed: 5 }); S.add(dust.points);
  for (const k of ['marco', 'portero', 'peaton1', 'peaton2', 'peaton3']) set.addToon(k);
  set.mode = () => { set.tod('golden'); set.sunAt(-1.0, .32, 40, [0, 2, 0]); set.applyTint(); };
  set.update = (t) => { steam.update(t); dust.update(t); };
  set.mode(); return set;
}

export function buildBathsInt() {
  const set = baseSet({ sky: false, fogNear: 6, fogFar: 40, lights: { sunPos: [-6, 14, 2], target: [0, 0, 0], shadowSize: 9, mapSize: 2048, hemi: .5 } });
  const S = set.scene; S.background = new THREE.Color(0x2a2018);
  S.add(ground(TEX.mosaic([3, 3]), 30));
  const m = std({ map: TEX.marble([2, 2]), rough: .4 });
  // piscina rectangular hundida
  const PW = 8, PD = 4.5;
  S.add(box(PW + .6, .35, .3, m, { pos: [0, 0, PD / 2 + .15] })); S.add(box(PW + .6, .35, .3, m, { pos: [0, 0, -PD / 2 - .15] }));
  S.add(box(.3, .35, PD, m, { pos: [PW / 2 + .15, 0, 0] })); S.add(box(.3, .35, PD, m, { pos: [-PW / 2 - .15, 0, 0] }));
  const pool = mesh(new THREE.PlaneGeometry(PW, PD, 40, 24), new THREE.MeshStandardMaterial({ map: TEX.water([4, 2]), color: 0x7ac0c8, roughness: .08, metalness: .25, transparent: true, opacity: .9 }), { rot: [-Math.PI / 2, 0, 0], pos: [0, .25, 0], cast: false });
  S.add(pool); set.pool = pool; const pb = pool.geometry.attributes.position.array.slice();
  const poolFloor = mesh(new THREE.PlaneGeometry(PW, PD), std({ map: TEX.mosaic([2, 1]), color: 0x6aa0b0 }), { rot: [-Math.PI / 2, 0, 0], pos: [0, -.6, 0] }); S.add(poolFloor);
  // muros, columnas y bóveda de cañón
  const wall = std({ map: TEX.plaster([4, 2], 'pink') });
  S.add(box(16, 7, .4, wall, { pos: [0, 0, -5] }));
  S.add(box(.4, 7, 12, wall, { pos: [-8, 0, 0] })); S.add(box(.4, 7, 12, wall, { pos: [8, 0, 0] }));
  for (let i = 0; i < 6; i++) { const c = column(5, .3, m); c.position.set(-6.5 + i * 2.6, 0, -3.6); S.add(c); }
  const vg = new THREE.CylinderGeometry(5.2, 5.2, 16, 32, 1, true, 0, Math.PI); vg.rotateZ(Math.PI / 2);
  const vault = mesh(vg, std({ map: TEX.plaster([6, 3], 'pale'), side: THREE.BackSide }), { pos: [0, 7, 0] }); S.add(vault);
  // ventanas altas: haces de luz volumétricos
  const shafts = []; for (let i = 0; i < 3; i++) { const sh = lightShaft(10, .5, 1.6, 0xffe2b0, .1); sh.position.set(-4 + i * 4, 9, -3.5); sh.rotation.set(-.35, 0, .35); S.add(sh); shafts.push(sh); }
  for (let i = 0; i < 3; i++) S.add(box(1.2, 1.4, .1, std({ color: 0xfff0d0, emissive: 0xffe8c0, ei: 1.5 }), { pos: [-4 + i * 4, 5.4, -4.75], cast: false }));
  const nicheL = [-6, 6].map(x => { const a = amphora(1.4); a.position.set(x, 0, -4.4); S.add(a); return a; });
  const steam = new Particles('steam', 60, [-4, .3, -2, 4, 3, 2], { size: 900, life: 5, alpha: .16, seed: 7 }); S.add(steam.points);
  const dust = new Particles('dust', 150, [-6, 1, -4, 6, 6, 2], { size: 10, color: 0xfff0c0, additive: true, seed: 9 }); S.add(dust.points);
  const splashes = [0, 1, 2].map(i => { const p = new Particles('splash', 40, [0, .3, 0], { size: 18, color: 0xe0f4ff, seed: 20 + i, burstAt: -9 }); S.add(p.points); return p; });
  const warm = new THREE.PointLight(0xffb070, 3, 16, 1.3); warm.position.set(0, 4, 3); S.add(warm);
  for (const k of ['marcoBano', 'banista1', 'banista2']) set.addToon(k);
  Object.assign(set, { splashes, PW, PD });
  set.splash = (i, at, x, z) => { const p = splashes[i]; p.o.burstAt = at; p.box[0] = x; p.box[2] = z; };
  set.reset = () => { for (const p of splashes) p.o.burstAt = -9; };
  set.mode = () => { set.tod('golden'); set.lights.sun.intensity = 2.6; set.lights.hemi.intensity = .6; set.exposure = 1.2; set.applyTint([1, .95, .88]); };
  set.update = (t) => {
    const p = pool.geometry.attributes.position.array; for (let i = 0; i < p.length; i += 3) { const x = pb[i], y = pb[i + 1]; p[i + 2] = Math.sin(x * 1.5 + t * 2) * .025 + Math.sin(y * 2 + t * 1.5) * .02; } pool.geometry.attributes.position.needsUpdate = true; pool.geometry.computeVertexNormals();
    pool.material.map.offset.set(t * .02, Math.sin(t * .4) * .03); steam.update(t); dust.update(t); for (const s of splashes) s.update(t);
  };
  set.mode(); return set;
}
