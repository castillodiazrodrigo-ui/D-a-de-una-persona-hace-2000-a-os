// =====================================================================
//  SET: LA ÍNSULA — exterior de varios pisos y corte transversal
//  ("casa de muñecas") donde cada piso muestra a sus inquilinos y el
//  alquiler (pilas de monedas) disminuye al subir.
// =====================================================================
import * as THREE from 'three';
import { baseSet, ground } from './common.js';
import { TEX } from '../world/textures.js';
import { std, box, mesh, building, farBuilding, column, roof, windowHole, bed, table, stool, amphora, bush, pine, setGlow, jar } from '../world/props.js';
import { rng } from '../world/../core/math.js';

export const FH = 2.6, FLOORS = 5, IW = 8, ID = 4.5;
export function build() {
  const set = baseSet({ fogNear: 30, fogFar: 160, lights: { sunPos: [-12, 14, 12], target: [0, 6, 0], shadowSize: 14, mapSize: 2048 } });
  const S = set.scene;
  S.add(ground(TEX.cobble([14, 14]), 60));
  const walk = box(40, .15, 2.2, std({ map: TEX.stone([10, 1]) }), { pos: [0, 0, ID / 2 + 1.1] }); S.add(walk);
  // ------ el edificio en corte: losas, muros de fondo y laterales ------
  const plaster = std({ map: TEX.plaster([2, 1.4], 'ochre') });
  const shell = new THREE.Group(); S.add(shell);
  shell.add(box(.3, FH * FLOORS, ID, plaster, { pos: [-IW / 2, 0, 0] })); shell.add(box(.3, FH * FLOORS, ID, plaster, { pos: [IW / 2, 0, 0] }));
  const wallCols = ['#b0543a', '#c9a24a', '#6a8a7a', '#c9b89a', '#a89a8a'];
  for (let f = 0; f < FLOORS; f++) {
    shell.add(box(IW, .22, ID, std({ map: f === 0 ? TEX.mosaic([2, 1]) : TEX.planks([2, 1]) }), { pos: [0, f * FH, 0] }));
    const bw = box(IW, FH, .2, std({ map: TEX.plaster([2, .7], f === 0 ? 'red' : f < 3 ? 'warm' : 'pale'), color: f === 0 ? 0xffffff : 0xe0e0e0 }), { pos: [0, f * FH, -ID / 2] }); shell.add(bw);
  }
  shell.add(box(IW + .3, .25, ID, plaster, { pos: [0, FH * FLOORS, 0] }));
  const rf = roof(IW, ID, 1.6); rf.position.y = FH * FLOORS + .25; rf.rotation.y = 0; shell.add(rf);
  // ------ interiores por piso ------
  const R = rng(4);
  // planta baja: apartamento rico (columnas, plantas, mosaico)
  for (const x of [-2.6, 2.6]) { const c = column(FH - .2, .16); c.position.set(x, .2, -1.2); shell.add(c); }
  const pl1 = bush(.9, 0x4a7a2e); pl1.position.set(-3.2, .2, -1.6); shell.add(pl1);
  const a1 = amphora(1.2); a1.position.set(3.3, .2, -1.7); shell.add(a1);
  const tb = table(1.4, .7, .7); tb.position.set(.8, .2, -1); shell.add(tb);
  // pisos 1-2: familias
  const t2 = table(1, .6, .65); t2.position.set(1.8, FH + .2, -1.2); shell.add(t2);
  const b2 = bed(); b2.position.set(-1.8, FH + .2, -1.6); b2.scale.set(.9, 1, .9); shell.add(b2);
  const b3 = bed(); b3.position.set(-1.5, FH * 2 + .2, -1.6); b3.scale.set(.8, 1, .8); shell.add(b3);
  const b3b = bed(); b3b.position.set(1.8, FH * 2 + .2, -1.6); b3b.scale.set(.8, 1, .8); shell.add(b3b);
  // pisos 3-4: cada vez más estrechos y pobres
  for (const x of [-2.6, 0, 2.6]) { const m = box(1.2, .14, .7, std({ map: TEX.cloth([1, 1], '#b8a27a') }), { pos: [x, FH * 3 + .2, -1.7] }); shell.add(m); }
  const s4 = stool(.4); s4.position.set(2.4, FH * 4 + .2, -1.5); shell.add(s4);
  const j4 = jar(1); j4.position.set(2.0, FH * 4 + .2, -1.8); shell.add(j4);
  const m4 = box(1.3, .14, .7, std({ map: TEX.cloth([1, 1], '#9a8a6a') }), { pos: [-.4, FH * 4 + .2, -1.7] }); shell.add(m4);
  // tabiques que hacen más pequeños los cuartos de arriba
  for (const f of [3, 4]) for (const x of [-1.4, 1.3]) shell.add(box(.12, FH - .2, ID - .4, std({ map: TEX.plaster([1, 1], 'pale') }), { pos: [x, f * FH + .2, -.2] }));
  // luces interiores tenues por piso
  const roomL = []; for (let f = 0; f < FLOORS; f++) { const l = new THREE.PointLight(0xffd2a0, 0, 7, 1.5); l.position.set(0, f * FH + 2.1, 1); S.add(l); roomL.push(l); }
  // ------ fachada frontal (se levanta para revelar el interior) ------
  const facadeG = new THREE.Group(); S.add(facadeG);
  const fMat = std({ map: TEX.plaster([2, 3.4], 'ochre') });
  const fw = new THREE.Mesh(new THREE.BoxGeometry(IW + .3, FH * FLOORS, .25), fMat); fw.geometry.translate(0, FH * FLOORS / 2, ID / 2); fw.castShadow = fw.receiveShadow = true; facadeG.add(fw);
  for (let f = 0; f < FLOORS; f++) for (let i = 0; i < 3; i++) {
    const x = -IW / 2 + (i + .5) * IW / 3;
    if (f === 0) { const door = box(1.4, 2.1, .05, std({ color: 0x1a120c }), { pos: [x, 0, ID / 2 + .13] }); facadeG.add(door); const lin = box(1.6, .15, .2, std({ map: TEX.wood([1, 1]) }), { pos: [x, 2.1, ID / 2 + .15] }); facadeG.add(lin); continue; }
    const w = windowHole(.65, .85 - f * .05, { shutters: true }); w.position.set(x, f * FH + .9, ID / 2 + .13); facadeG.add(w);
    if (f === FLOORS - 1 && i === 1) set.marcoWin = new THREE.Vector3(x, f * FH + 1.3, ID / 2 + .2);
  }
  for (let f = 1; f < FLOORS; f++) facadeG.add(box(IW + .5, .12, .3, std({ color: 0xc8a878 }), { pos: [0, f * FH, ID / 2 + .2] }));
  // balcón de madera en el 2º piso
  const bm = std({ map: TEX.wood([2, 1]), color: 0x8a6040 }); const bal = new THREE.Group(); bal.position.set(0, FH * 2, ID / 2 + .7);
  bal.add(box(5, .1, 1, bm)); for (let k = 0; k < 11; k++) bal.add(box(.05, .8, .05, bm, { pos: [-2.4 + k * .48, 0, .45] })); bal.add(box(5, .06, .08, bm, { pos: [0, .8, .45] })); facadeG.add(bal);
  // monedas de alquiler (pilas por piso, a la derecha del edificio)
  const coinMat = std({ color: 0xe0b040, metal: .85, rough: .3 });
  const stacks = [];
  for (let f = 0; f < FLOORS; f++) { const g = new THREE.Group(); g.position.set(IW / 2 - 1.0, f * FH + .32, .9); const n = [6, 5, 4, 2, 1][f]; for (let k = 0; k < n; k++) { const c = mesh(new THREE.CylinderGeometry(.22, .22, .07, 20), coinMat, { pos: [0, .035 + k * .08, 0] }); g.add(c); } const shelfB = box(.9, .1, .8, std({ map: TEX.wood([1, 1]) }), { pos: [0, -.1, 0] }); g.add(shelfB); S.add(g); stacks.push(g); }
  // vecindario
  const tints = ['warm', 'red', 'pale', 'pink'];
  for (let i = 0; i < 4; i++) { const b = farBuilding(7, (3 + i % 2) * 2.6, 5, tints[i], i + 3); b.position.set(i < 2 ? -12.5 - i * 7.5 : 12 + (i - 2) * 7.5, 0, -.5); S.add(b); }
  for (let i = 0; i < 6; i++) { const b = farBuilding(6, (2 + i % 3) * 2.6, 5, tints[i % 4], i + 9); b.position.set(-20 + i * 8, 0, -14); S.add(b); }
  const p = pine(6, 2); p.position.set(-9, 0, -7); S.add(p);
  // inquilinos
  const rico = set.addToon('rico'), p2 = set.addToon('peaton2'), p1 = set.addToon('peaton1'), p3 = set.addToon('peaton3'), marco = set.addToon('marco');
  Object.assign(set, { facadeG, stacks, roomL, shell });
  set.reset = () => { facadeG.position.set(0, 0, 0); facadeG.visible = true; for (const st of stacks) st.visible = false; for (const l of roomL) { l.intensity = 0; l.visible = false; } };
  set.mode = (m) => { set.tod('dawn', 'day', .55); set.sunAt(-.7, .55, 40, [0, 6, 0]); setGlow(S, 0); set.applyTint(); };
  set.mode('morning');
  return set;
}
