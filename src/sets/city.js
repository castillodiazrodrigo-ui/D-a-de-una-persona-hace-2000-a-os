// =====================================================================
//  SET: PANORAMA DE ROMA (amanecer / noche)
//  Ínsula protagonista en el centro, templo en la colina, acueducto,
//  pinos, colinas, humo de braseros, pájaros y antorchas de carros.
// =====================================================================
import * as THREE from 'three';
import { baseSet, ground } from './common.js';
import { TEX } from '../world/textures.js';
import { std, box, mesh, building, farBuilding, column, roof, archWall, pine, cypress, hills, setGlow, flame } from '../world/props.js';
import { Particles, cloud } from '../core/stage.js';
import { rng } from '../core/math.js';

function temple(s = 1) {
  const g = new THREE.Group(); const m = std({ map: TEX.marble([2, 1]), rough: .55 });
  g.add(box(12, 2.2, 18, m));
  for (let i = 0; i < 6; i++) { const c = column(7, .45, m); c.position.set(-5 + i * 2, 2.2, 8); g.add(c); }
  for (let i = 0; i < 5; i++) for (const sd of [-1, 1]) { const c = column(7, .45, m); c.position.set(sd * 5, 2.2, 6 - i * 3); g.add(c); }
  g.add(box(11, 6.5, 12, std({ map: TEX.stone([3, 2]) }), { pos: [0, 2.2, -2] }));
  g.add(box(12.4, .9, 18.4, m, { pos: [0, 9.2, 0] }));
  const r = roof(12.4, 18.4, 2.6, .3); r.position.y = 10.1; r.rotation.y = 0; g.add(r);
  const ped = new THREE.Shape(); ped.moveTo(-6.2, 0); ped.lineTo(6.2, 0); ped.lineTo(0, 2.4); ped.closePath();
  const pm = mesh(new THREE.ExtrudeGeometry(ped, { depth: .3, bevelEnabled: false }), m, { pos: [0, 10.1, 9.2] }); g.add(pm);
  g.scale.setScalar(s); return g;
}
function aqueduct(n = 14) {
  const g = new THREE.Group(); const m = std({ map: TEX.brick([1, 1]), rough: .9 });
  for (let i = 0; i < n; i++) { const a = archWall(6, 12, 4, 9, 2, m); a.position.x = i * 6; g.add(a); }
  g.add(box(n * 6, 1, 2.4, std({ map: TEX.stone([8, 1]) }), { pos: [(n - 1) * 3, 12, 0] }));
  return g;
}
class Bird { // pájaro lejano: dos alas que aletean
  constructor(scene, seed) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x1a1410, side: THREE.DoubleSide, fog: true });
    this.g = new THREE.Group(); this.l = new THREE.Mesh(new THREE.PlaneGeometry(.7, .14), mat); this.r = this.l.clone();
    this.l.geometry = this.l.geometry.clone(); this.l.geometry.translate(-.35, 0, 0); this.r.geometry = this.r.geometry.clone(); this.r.geometry.translate(.35, 0, 0);
    this.g.add(this.l, this.r); scene.add(this.g); const R = rng(seed); this.s = [R(), R(), R(), R()];
  }
  update(t) { const s = this.s; const a = t * (.15 + s[0] * .1) + s[1] * 6; this.g.position.set(Math.cos(a) * (10 + s[2] * 15), 16 + s[3] * 8 + Math.sin(t * .7 + s[0] * 5), -10 + Math.sin(a) * (10 + s[2] * 12)); this.g.rotation.y = -a; const f = Math.sin(t * 10 + s[1] * 20) * .6; this.l.rotation.z = f; this.r.rotation.z = -f; }
}

export function build() {
  const set = baseSet({ fogNear: 40, fogFar: 230, lights: { sunPos: [30, 12, -40], target: [0, 0, 0], shadowSize: 45, mapSize: 2048, far: 150 } });
  const S = set.scene;
  const gr = ground(TEX.dirt([30, 30]), 400); S.add(gr);
  // calles empedradas alrededor de la ínsula
  const st = mesh(new THREE.PlaneGeometry(8, 160), std({ map: TEX.cobble([3, 60]) }), { rot: [-Math.PI / 2, 0, 0], pos: [8, .02, 0], cast: false }); S.add(st);
  const st2 = mesh(new THREE.PlaneGeometry(160, 7), std({ map: TEX.cobble([60, 3]) }), { rot: [-Math.PI / 2, 0, 0], pos: [0, .02, 9], cast: false }); S.add(st2);
  // ínsula protagonista (detallada) — la ventana del último piso es la de Marco
  const hero = building({ w: 7, d: 7, floors: 5, fh: 2.6, tint: 'ochre', seed: 3, windows: 3, shop: true, lit: 0 });
  S.add(hero); set.hero = hero;
  const heroWin = new THREE.Vector3(0, 4 * 2.6 + 1.3, 3.55); set.heroWin = heroWin;
  // ventana de Marco con luz propia (cálida al amanecer / lámpara de noche)
  const winGlow = box(.6, .8, .02, std({ color: 0x1a120c, emissive: 0xffa050, ei: 0 }), { pos: [0, 4 * 2.6 + .9, 3.53], cast: false }); S.add(winGlow); set.winGlow = winGlow;
  // manzanas de edificios alrededor
  const R = rng(11); const tints = ['warm', 'ochre', 'red', 'pale', 'pink'];
  const spots = [];
  for (let ix = -5; ix <= 5; ix++) for (let iz = -6; iz <= 2; iz++) {
    const x = ix * 9.5 + (R() - .5) * 2, z = iz * 9.5 + (R() - .5) * 2;
    if (Math.abs(x) < 7 && Math.abs(z) < 7) continue; if (Math.abs(x - 8) < 4.5 || Math.abs(z - 9) < 4) continue;
    spots.push([x, z]);
  }
  for (const [x, z] of spots) { const fl = 2 + Math.floor(R() * 4); const b = farBuilding(5 + R() * 3, fl * 2.6, 5 + R() * 3, tints[(R() * 5) | 0], (R() * 9) | 0 + 1); b.position.set(x, 0, z); b.rotation.y = (R() - .5) * .1; S.add(b); }
  // detalladas cerca de la cámara (a los lados de la calle)
  for (const [x, z, f, tn] of [[-8, 1, 4, 'red'], [16, 1, 3, 'pale'], [-8, 16, 3, 'pink'], [16, 16, 4, 'warm'], [0, 17, 2, 'red']]) { const b = building({ w: 6, d: 6, floors: f, tint: tn, seed: x * 3 + z, windows: 3, lit: .6, shop: true }); b.position.set(x, 0, z); if (z > 10) b.rotation.y = Math.PI; S.add(b); }
  // colina capitolina con templo
  const hill = mesh(new THREE.SphereGeometry(30, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: 0x6a7a4a, rough: 1, flat: true }), { pos: [-45, -14, -75], scale: [1.2, .8, 1] }); S.add(hill);
  const tp = temple(1.1); tp.position.set(-42, 9.5, -68); tp.rotation.y = .5; S.add(tp);
  const aq = aqueduct(16); aq.position.set(-10, 0, -120); aq.rotation.y = -.15; S.add(aq);
  S.add(hills(0x5a6a48, 3, 7, 170));
  for (let i = 0; i < 18; i++) { const p = i % 3 ? pine(5 + R() * 3, i) : cypress(5 + R() * 3, i); p.position.set(-60 + R() * 120, 0, -40 - R() * 60); S.add(p); }
  for (let i = 0; i < 6; i++) { const p = pine(4 + R() * 2, i + 30); p.position.set(-40 + i * 12 + R() * 4, 9 + 1.5 * Math.sin(i), -72 + R() * 6); if (Math.abs(i - 1.5) < 1.6) S.add(p); }
  // nubes, humo de braseros, pájaros
  const clouds = []; for (let i = 0; i < 7; i++) { const c = cloud(50 + R() * 40, .55); c.position.set(-150 + i * 50, 50 + R() * 25, -220); S.add(c); clouds.push(c); }
  const smoke = [[-12, 8, -10], [20, 9, -30], [-28, 6, -20]].map(([x, y, z], i) => { const p = new Particles('smoke', 26, [x, y, z, x + .5, y + 12, z + .5], { size: 1800, life: 7, alpha: .28, drift: 3, color: 0xd8d0c8, seed: i + 4 }); S.add(p.points); return p; });
  const birds = Array.from({ length: 9 }, (_, i) => new Bird(S, i + 1));
  // antorchas de carros nocturnos recorriendo la calle
  const torches = [0, 1, 2].map(i => { const f = flame(5); S.add(f); return f; });
  const cartLight = new THREE.PointLight(0xff9a40, 0, 25, 1.4); S.add(cartLight);
  Object.assign(set, { smoke, birds, torches, cartLight, clouds });
  set.mode = (m, k = 0) => {
    if (m === 'dawn') { set.tod('dawn'); set.sunAt(-.4 + Math.PI, .14, 80); setGlow(S, .25); winGlow.material.emissiveIntensity = 0; }
    if (m === 'night') { set.tod('night'); set.sunAt(.8, .9, 80); setGlow(S, 1); set.exposure = 1.7; set.lights.hemi.intensity = .4; set.lights.sun.intensity = .9; winGlow.material.emissiveIntensity = 1.6 * (1 - k); }
    set.night = m === 'night';
    for (const s of smoke) s.intensity = m === 'night' ? .3 : 1;
    set.applyTint();
  };
  set.update = (t) => {
    for (const s of smoke) s.update(t); for (const b of birds) { b.g.visible = !set.night; b.update(t); }
    torches.forEach((f, i) => { f.visible = !!set.night; const x = 8 + (i % 2 ? .8 : -.8); const z = 60 - ((t * 2.2 + i * 18) % 120); f.position.set(x, 2.2, z); f.flicker(t + i); });
    cartLight.intensity = set.night ? 30 : 0; cartLight.visible = !!set.night; cartLight.position.set(8, 3, 60 - ((t * 2.2) % 120));
  };
  set.mode('dawn');
  return set;
}
