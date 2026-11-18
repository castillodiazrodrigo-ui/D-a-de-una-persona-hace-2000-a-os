// =====================================================================
//  UTILERÍA 3D: edificios, muebles, objetos, vehículos, vegetación...
//  Todo construido con geometría real (volumen, sombras, perspectiva).
// =====================================================================
import * as THREE from 'three';
import { TEX, radialTex } from './textures.js';
import { rng } from '../core/math.js';

export function std(o = {}) {
  return new THREE.MeshStandardMaterial({ color: o.color ?? 0xffffff, map: o.map || null, roughness: o.rough ?? .85, metalness: o.metal ?? 0, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide, transparent: !!o.transparent, opacity: o.opacity ?? 1, flatShading: !!o.flat });
}
export function mesh(geo, mat, o = {}) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = o.cast !== false; m.receiveShadow = o.receive !== false;
  if (o.pos) m.position.set(...o.pos); if (o.rot) m.rotation.set(...o.rot); if (o.scale) m.scale.set(...(Array.isArray(o.scale) ? o.scale : [o.scale, o.scale, o.scale]));
  return m;
}
export const box = (w, h, d, mat, o = {}) => { const m = mesh(new THREE.BoxGeometry(w, h, d), mat, o); if (!o.center) m.geometry.translate(0, h / 2, 0); return m; };
const lathe = (pts, seg = 28) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

// ---------- recipientes ----------
export function amphora(s = 1, color = 0xb5623a) {
  const g = lathe([[0, 0], [.05, .02], [.09, .12], [.17, .38], [.19, .52], [.16, .66], [.07, .78], [.055, .9], [.07, .93], [0, .93]]);
  const m = mesh(g, std({ color, rough: .7 })); m.scale.setScalar(s);
  const grp = new THREE.Group(); grp.add(m);
  for (const sd of [-1, 1]) { const h = mesh(new THREE.TorusGeometry(.06, .015, 6, 12, Math.PI), std({ color, rough: .7 }), { pos: [sd * .1 * s, .8 * s, 0], rot: [0, 0, sd * Math.PI / 2 + Math.PI / 2] }); h.scale.setScalar(s); grp.add(h); }
  return grp;
}
export function jar(s = 1, color = 0xb65a32) {
  const g = lathe([[0, 0], [.08, 0], [.13, .08], [.14, .16], [.1, .25], [.06, .3], [.075, .33], [0, .33]]);
  const m = mesh(g, std({ color, rough: .6 })); m.scale.setScalar(s); return m;
}
export function bowl(s = 1, color = 0x9c5a34) { const m = mesh(lathe([[0, 0], [.08, 0], [.14, .05], [.16, .08], [.15, .085], [.12, .05], [0, .03]]), std({ color, rough: .6, side: THREE.DoubleSide })); m.scale.setScalar(s); return m; }
export function dolium(s = 1) { const m = mesh(lathe([[0, 0], [.2, 0], [.36, .25], [.38, .45], [.3, .62], [.22, .66], [0, .66]]), std({ color: 0xa65530, rough: .8 })); m.scale.setScalar(s); return m; }

// ---------- comida ----------
export function bread(s = 1) { // panis quadratus con 8 gajos
  const g = new THREE.Group();
  const m = mesh(new THREE.SphereGeometry(.11, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: 0xc98a42, rough: .9 })); m.scale.set(1, .55, 1); g.add(m);
  for (let i = 0; i < 4; i++) { const l = mesh(new THREE.BoxGeometry(.22, .012, .008), std({ color: 0x6b3c18 }), { pos: [0, .058, 0], rot: [0, i * Math.PI / 4, 0] }); g.add(l); }
  g.scale.setScalar(s); return g;
}
export function cheese(s = 1) { const m = mesh(new THREE.CylinderGeometry(.09, .09, .06, 20, 1, false, 0, Math.PI * 1.6), std({ color: 0xead9a0, rough: .6 })); m.geometry.translate(0, .03, 0); m.scale.setScalar(s); return m; }
export function olives(s = 1) {
  const g = new THREE.Group(); g.add(bowl(.8));
  const R = rng(3); const mat = std({ color: 0x3d4a1f, rough: .3 });
  for (let i = 0; i < 9; i++) { const o = mesh(new THREE.SphereGeometry(.018, 10, 8), mat, { pos: [(R() - .5) * .14, .055 + R() * .02, (R() - .5) * .14] }); o.scale.set(1, .8, .8); g.add(o); }
  g.scale.setScalar(s); return g;
}

// ---------- luz de fuego ----------
export function flame(s = 1, color = 0xffa040) {
  const g = new THREE.Group();
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex('rgba(255,250,220,1)', 'rgba(255,150,40,0)'), color, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  core.scale.set(.09 * s, .16 * s, 1); core.position.y = .06 * s;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex('rgba(255,180,90,.5)', 'rgba(255,120,30,0)'), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  halo.scale.set(.6 * s, .6 * s, 1); halo.position.y = .06 * s;
  g.add(core, halo); g.userData = { core, halo, s };
  g.flicker = (t, k = 1) => { const f = .85 + .15 * Math.sin(t * 23) * Math.sin(t * 7.7 + 1) + .05 * Math.sin(t * 51); core.scale.set(.09 * s * f * k, .17 * s * (2 - f) * k, 1); halo.material.opacity = .8 * f * k; core.material.opacity = k; return f; };
  return g;
}
export function oilLamp(s = 1) { // lucerna de terracota con mecha
  const g = new THREE.Group();
  const body = mesh(lathe([[0, 0], [.05, 0], [.07, .015], [.065, .03], [.02, .04], [0, .04]]), std({ color: 0xa8562e, rough: .6 }));
  const nozzle = mesh(new THREE.CylinderGeometry(.015, .02, .06, 10), std({ color: 0xa8562e, rough: .6 }), { pos: [.07, .022, 0], rot: [0, 0, Math.PI / 2] });
  g.add(body, nozzle);
  const f = flame(.7); f.position.set(.1, .03, 0); g.add(f); g.userData.flame = f;
  g.scale.setScalar(s); return g;
}

// ---------- muebles ----------
export function bed(mats) {
  const g = new THREE.Group(); const wood = mats?.wood || std({ map: TEX.wood([1, 1]), color: 0x9a7050 });
  g.add(box(2, .35, .9, wood)); g.add(box(.08, .7, .9, wood, { pos: [-1, 0, 0] })); g.add(box(.08, .55, .9, wood, { pos: [1, 0, 0] }));
  const mat = box(1.9, .14, .82, std({ map: TEX.cloth([2, 1], '#d9c9a0') }), { pos: [0, .35, 0] }); g.add(mat);
  const pillow = mesh(new THREE.SphereGeometry(.2, 16, 10), std({ map: TEX.cloth([1, 1], '#e8dcc0') }), { pos: [-.72, .55, 0], scale: [1.1, .4, 1.5] }); g.add(pillow);
  return g;
}
export function blanket(w = 1.3) { // manta con caída (se dobla al levantarse)
  const geo = new THREE.PlaneGeometry(w, 1.1, 24, 12); geo.rotateX(-Math.PI / 2);
  const m = mesh(geo, std({ map: TEX.cloth([3, 3], '#8a4a3a'), side: THREE.DoubleSide, rough: 1 }));
  const base = geo.attributes.position.array.slice();
  m.drape = (lift = 0, bump = .12) => { // lift: 0 cubierto, 1 retirado hacia los pies
    const p = geo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const x = base[i], z = base[i + 2];
      const edge = Math.abs(z) > .42 ? (Math.abs(z) - .42) / .13 : 0;
      let y = bump * Math.cos(z / .55 * Math.PI / 2) * (1 - edge) - edge * .22;
      const fold = THREE.MathUtils.smoothstep(-x / w + .5, 0, lift * 1.1);
      p[i] = x + fold * (w * .4) * lift; p[i + 1] = Math.max(-.22, y + fold * .05); p[i + 2] = z;
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
  };
  m.drape(0); return m;
}
export function stool(h = .45) { const g = new THREE.Group(); const w = std({ map: TEX.wood([1, 1]), color: 0x8a6040 }); g.add(box(.42, .05, .42, w, { pos: [0, h - .05, 0] })); for (const [x, z] of [[-.17, -.17], [.17, -.17], [-.17, .17], [.17, .17]]) g.add(box(.04, h - .05, .04, w, { pos: [x, 0, z] })); return g; }
export function table(w = 1, d = .6, h = .7) { const g = new THREE.Group(); const m = std({ map: TEX.wood([1, 1]), color: 0x9a6a44 }); g.add(box(w, .06, d, m, { pos: [0, h - .06, 0] })); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(.06, h - .06, .06, m, { pos: [x * (w / 2 - .06), 0, z * (d / 2 - .06)] })); return g; }
export function shelf() { const g = new THREE.Group(); const m = std({ map: TEX.wood([1, 1]), color: 0x7a5434 }); g.add(box(1, .04, .3, m, { pos: [0, 1.4, 0] })); g.add(box(.04, .2, .3, m, { pos: [-.45, 1.2, 0] })); g.add(box(.04, .2, .3, m, { pos: [.45, 1.2, 0] })); return g; }

// ---------- arquitectura ----------
export function column(h = 3, r = .22, mat) {
  const g = new THREE.Group(); mat = mat || std({ map: TEX.marble([1, 2]), rough: .6 });
  const shaft = mesh(new THREE.CylinderGeometry(r * .88, r, h - .4, 20, 1), mat, { pos: [0, .2 + (h - .4) / 2, 0] });
  g.add(box(r * 2.6, .2, r * 2.6, mat), shaft, box(r * 2.7, .2, r * 2.7, mat, { pos: [0, h - .2, 0] }));
  g.add(mesh(new THREE.CylinderGeometry(r * 1.3, r * .9, .15, 20), mat, { pos: [0, h - .27, 0] }));
  return g;
}
export function archWall(w, h, aw, ah, depth, mat) { // muro con arco (ExtrudeGeometry)
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  const hole = new THREE.Path(); hole.moveTo(-aw / 2, 0); hole.lineTo(-aw / 2, ah - aw / 2); hole.absarc(0, ah - aw / 2, aw / 2, Math.PI, 0, true); hole.lineTo(aw / 2, 0); hole.closePath();
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2);
  fixUV(g, 1 / 2);
  return mesh(g, mat);
}
function fixUV(g, k) { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + p.getZ(i)) * k, p.getY(i) * k); uv.needsUpdate = true; }
export function windowHole(w = .6, h = .8, opts = {}) { // ventana con marco, interior oscuro y postigos
  const g = new THREE.Group();
  const inMat = std({ color: opts.inside ?? 0x1a120c, rough: 1, emissive: opts.glow ?? 0x000000, ei: opts.glowI ?? 1 }); if (opts.glow) inMat.userData.isGlow = true;
  g.add(box(w, h, .02, inMat, { pos: [0, 0, .01], cast: false }));
  const fr = std({ map: TEX.wood([1, 1]), color: 0x7a5434 });
  g.add(box(w + .12, .08, .12, fr, { pos: [0, -.06, .05] }));
  g.add(box(w + .12, .06, .1, fr, { pos: [0, h, .04] }));
  if (opts.shutters !== false) for (const sd of [-1, 1]) { const sh = box(w / 2, h, .03, fr, { pos: [sd * (w * .75 + .02), 0, .06] }); g.add(sh); }
  return g;
}
export function roof(w, d, h, overhang = .25) { // tejado a dos aguas con tejas
  const s = new THREE.Shape(); s.moveTo(-w / 2 - overhang, 0); s.lineTo(w / 2 + overhang, 0); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d + overhang * 2, bevelEnabled: false }); g.translate(0, 0, -(d + overhang * 2) / 2);
  const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getZ(i) * .8, (Math.abs(p.getX(i)) + p.getY(i)) * .8); uv.needsUpdate = true;
  return mesh(g, std({ map: TEX.tiles([1, 1]), rough: .8 }));
}
// Bloque de ínsula / casa con ventanas, balcones y tejado
export function building(o) {
  const { w = 6, d = 5, floors = 4, fh = 2.6, tint = 'warm', seed = 1, windows = 3, balcony = true, roofH = 1.1, shop = false, lit = 0 } = o;
  const g = new THREE.Group(); const R = rng(seed);
  const mat = std({ map: TEX.plaster([w / 4, floors * fh / 4], tint), rough: .95 });
  const h = floors * fh;
  g.add(box(w, h, d, mat));
  const front = new THREE.Group(); front.position.z = d / 2; g.add(front);
  for (let f = 0; f < floors; f++) {
    for (let i = 0; i < windows; i++) {
      const x = -w / 2 + (i + .5) * (w / windows);
      if (f === 0 && shop) { const door = box(w / windows * .7, 2, .05, std({ color: 0x1a120c }), { pos: [x, 0, .02] }); front.add(door); continue; }
      const glow = lit && R() < lit ? 0xffa050 : 0x000000;
      const wn = windowHole(.55 + R() * .1, .85 - f * .05, { glow, glowI: 1.4, shutters: R() > .3 });
      wn.position.set(x, f * fh + .9, 0); front.add(wn);
    }
    if (balcony && f > 0 && f < floors - 1 && R() > .35) {
      const bm = std({ map: TEX.wood([2, 1]), color: 0x8a6040 });
      const b = new THREE.Group(); b.position.set((R() - .5) * w * .4, f * fh + .1, .45);
      b.add(box(w * .45, .08, .9, bm, { pos: [0, 0, 0] }));
      for (let k = 0; k < 7; k++) b.add(box(.04, .7, .04, bm, { pos: [-w * .22 + k * w * .45 / 6, 0, .42] }));
      b.add(box(w * .45, .05, .06, bm, { pos: [0, .7, .42] }));
      if (R() > .4) { const pot = mesh(new THREE.CylinderGeometry(.12, .09, .22, 12), std({ color: 0xa0522d }), { pos: [w * .15, .08 + .11, .2] }); b.add(pot); const pl = mesh(new THREE.IcosahedronGeometry(.2, 1), std({ color: 0x4f6a2a, flat: true }), { pos: [w * .15, .45, .2] }); b.add(pl); }
      front.add(b);
    }
    // cornisa entre pisos
    g.add(box(w + .1, .1, d + .1, std({ color: 0xcdb08a }), { pos: [0, (f + 1) * fh - .1, 0] }));
  }
  const r = roof(w, d, roofH); r.position.y = h; g.add(r);
  return g;
}

// ---------- vegetación ----------
export function cypress(h = 4, seed = 1) { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(.07, .1, .5, 6), std({ color: 0x4a3420 }))); const c = mesh(new THREE.ConeGeometry(h * .13, h, 10, 4), std({ color: 0x2f4a26, flat: true, rough: 1 }), { pos: [0, h / 2 + .3, 0] }); c.scale.set(1, 1, 1); g.add(c); return g; }
export function pine(h = 5, seed = 1) { // pino piñonero (sombrilla)
  const g = new THREE.Group(); const R = rng(seed);
  g.add(mesh(new THREE.CylinderGeometry(.09, .15, h, 7), std({ color: 0x5a4030 }), { pos: [0, h / 2, 0], rot: [0, 0, (R() - .5) * .15] }));
  for (let i = 0; i < 5; i++) { const b = mesh(new THREE.SphereGeometry(1, 10, 6), std({ color: 0x3a5a2a, flat: true, rough: 1 }), { pos: [(R() - .5) * 1.6, h + (R() - .5) * .3, (R() - .5) * 1.6] }); b.scale.set(1.3 + R() * .5, .45, 1.3 + R() * .5); g.add(b); }
  return g;
}
export function bush(s = 1, color = 0x4a6a2e) { const g = new THREE.Group(); const R = rng(Math.floor(s * 100)); for (let i = 0; i < 4; i++) g.add(mesh(new THREE.IcosahedronGeometry(.3 * s, 1), std({ color, flat: true, rough: 1 }), { pos: [(R() - .5) * .5 * s, .25 * s, (R() - .5) * .5 * s] })); return g; }
export function tree(s = 1, leafCol = 0x5a7a30) { // árbol de hoja caduca (para las estaciones)
  const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(.1 * s, .18 * s, 2 * s, 8), std({ color: 0x5a4030 }), { pos: [0, s, 0] }));
  const leaves = new THREE.Group(); const R = rng(9); const lm = std({ color: leafCol, flat: true, rough: 1 });
  for (let i = 0; i < 7; i++) leaves.add(mesh(new THREE.IcosahedronGeometry(.6 * s, 1), lm, { pos: [(R() - .5) * 1.2 * s, 2.2 * s + R() * .8 * s, (R() - .5) * 1.2 * s] }));
  g.add(leaves); g.userData.leaves = leaves; g.userData.leafMat = lm; return g;
}

// ---------- carro con ruedas ----------
export function cart() {
  const g = new THREE.Group(); const w = std({ map: TEX.wood([1, 1]), color: 0x8a6040 });
  const bed = new THREE.Group(); bed.position.y = .55; g.add(bed);
  bed.add(box(2.2, .1, 1.2, w)); bed.add(box(2.2, .35, .06, w, { pos: [0, .1, .6] })); bed.add(box(2.2, .35, .06, w, { pos: [0, .1, -.6] })); bed.add(box(.06, .35, 1.2, w, { pos: [-1.1, .1, 0] }));
  bed.add(box(1.6, .06, .08, w, { pos: [1.9, .02, .3] })); bed.add(box(1.6, .06, .08, w, { pos: [1.9, .02, -.3] })); // varas
  // carga: ánforas y sacos
  for (let i = 0; i < 3; i++) { const a = amphora(.7); a.rotation.z = Math.PI / 2.2; a.position.set(-.7 + i * .5, .25, (i % 2 ? .2 : -.2)); bed.add(a); }
  for (let i = 0; i < 2; i++) { const s = mesh(new THREE.SphereGeometry(.28, 12, 8), std({ map: TEX.cloth([1, 1], '#b8a27a') }), { pos: [.6, .3, -.25 + i * .5], scale: [1, .7, 1] }); bed.add(s); }
  const wheels = [];
  for (const sd of [-1, 1]) {
    const wh = new THREE.Group(); wh.position.set(-.2, .55, sd * .72);
    wh.add(mesh(new THREE.TorusGeometry(.5, .05, 8, 24), std({ color: 0x5a3a20 })));
    for (let k = 0; k < 8; k++) wh.add(mesh(new THREE.BoxGeometry(.04, 1, .04), w, { rot: [0, 0, k * Math.PI / 8] }));
    wh.add(mesh(new THREE.CylinderGeometry(.09, .09, .14, 12), std({ color: 0x3a2a1a }), { rot: [Math.PI / 2, 0, 0] }));
    g.add(wh); wheels.push(wh);
  }
  g.userData.wheels = wheels; return g;
}
// ---------- barco mercante ----------
export function ship() {
  const g = new THREE.Group(); const w = std({ map: TEX.planks([2, 1]), color: 0x8a6040 });
  const hs = new THREE.Shape(); hs.moveTo(-4, 1.2); hs.quadraticCurveTo(-4.2, 0, -2.5, -.3); hs.lineTo(2.5, -.3); hs.quadraticCurveTo(4.3, 0, 4.6, 1.6); hs.lineTo(4, 1.2); hs.closePath();
  const hull = mesh(new THREE.ExtrudeGeometry(hs, { depth: 2, bevelEnabled: true, bevelSize: .4, bevelThickness: .5, bevelSegments: 3 }), w); hull.geometry.translate(0, 0, -1); g.add(hull);
  g.add(box(7.6, .1, 2.4, w, { pos: [0, 1.1, 0] }));
  const mast = mesh(new THREE.CylinderGeometry(.08, .1, 6, 8), std({ color: 0x5a3a20 }), { pos: [0, 4, 0] }); g.add(mast);
  g.add(mesh(new THREE.CylinderGeometry(.05, .05, 4.2, 6), std({ color: 0x5a3a20 }), { pos: [0, 6.3, 0], rot: [0, 0, Math.PI / 2] }));
  const sg = new THREE.PlaneGeometry(4, 3.4, 12, 8); sg.translate(0, 4.6, 0); sg.rotateY(Math.PI / 2);
  const sail = mesh(sg, std({ map: TEX.cloth([2, 2], '#e8d8b4'), side: THREE.DoubleSide, rough: 1 })); sail.rotation.y = Math.PI / 2; g.add(sail);
  const base = sg.attributes.position.array.slice();
  g.userData.billow = (t) => { const p = sg.attributes.position.array; for (let i = 0; i < p.length; i += 3) { const y = base[i + 1] - 4.6, z = base[i + 2]; p[i] = base[i] + (1 - (y / 1.7) ** 2) * (1 - (z / 2) ** 2) * (.45 + .08 * Math.sin(t * 2 + z)); } sg.attributes.position.needsUpdate = true; sg.computeVertexNormals(); };
  g.userData.billow(0);
  // ojo pintado en proa
  g.add(mesh(new THREE.CircleGeometry(.18, 16), std({ color: 0xf0e8d0 }), { pos: [3.9, .9, 1.42] }));
  g.add(mesh(new THREE.CircleGeometry(.09, 16), std({ color: 0x111111 }), { pos: [3.92, .9, 1.43] }));
  return g;
}
// ---------- puesto del mercado ----------
export function stall(col = '#b8442e', seed = 1) {
  const g = new THREE.Group(); const w = std({ map: TEX.wood([1, 1]), color: 0x8a6040 }); const R = rng(seed);
  g.add(box(2, .9, .8, w));
  for (const [x, z] of [[-1, -.4], [1, -.4], [-1, .4], [1, .4]]) g.add(box(.07, 2.2, .07, w, { pos: [x * .95, 0, z] }));
  const aw = new THREE.PlaneGeometry(2.3, 1.3, 8, 4); aw.rotateX(-Math.PI / 2 + .25);
  const awning = mesh(aw, std({ map: TEX.cloth([1, 1], col), side: THREE.DoubleSide }), { pos: [0, 2.25, .1] }); g.add(awning); g.userData.awning = awning;
  const fruitCols = [0xd8602a, 0xb02a24, 0xe0b030, 0x6a2a4a, 0x7a9a3a];
  for (let i = 0; i < 4; i++) { const bk = mesh(new THREE.CylinderGeometry(.22, .17, .16, 12), std({ color: 0x9a7a4a }), { pos: [-.7 + i * .47, .9 + .08, 0] }); g.add(bk);
    const fc = fruitCols[(R() * fruitCols.length) | 0]; for (let k = 0; k < 6; k++) g.add(mesh(new THREE.SphereGeometry(.06, 8, 6), std({ color: fc, rough: .5 }), { pos: [-.7 + i * .47 + (R() - .5) * .25, 1.07 + R() * .05, (R() - .5) * .25] })); }
  return g;
}
// ---------- fuente pública (lacus) con caño de cabeza de león ----------
export function fountain() {
  const g = new THREE.Group(); const st = std({ map: TEX.stone([1, 1]), rough: .9 });
  const basin = new THREE.Group();
  basin.add(box(2.2, .7, .12, st, { pos: [0, 0, .5] })); basin.add(box(2.2, .7, .12, st, { pos: [0, 0, -.5] }));
  basin.add(box(.12, .7, 1.1, st, { pos: [1.05, 0, 0] })); basin.add(box(.12, .7, 1.1, st, { pos: [-1.05, 0, 0] }));
  g.add(basin);
  const water = mesh(new THREE.PlaneGeometry(2, .9), std({ map: TEX.water([1, 1]), color: 0x88bbcc, rough: .08, metal: .3, transparent: true, opacity: .88 }), { rot: [-Math.PI / 2, 0, 0], pos: [0, .6, 0], cast: false });
  g.add(water); g.userData.water = water;
  const stele = box(.9, 1.6, .3, st, { pos: [0, 0, -.62] }); g.add(stele);
  const head = mesh(new THREE.SphereGeometry(.17, 14, 10), std({ color: 0x8a7a5a, metal: .4, rough: .5 }), { pos: [0, 1.2, -.42] }); g.add(head);
  const spout = mesh(new THREE.CylinderGeometry(.03, .035, .18, 8), std({ color: 0x7a6a4a, metal: .5, rough: .4 }), { pos: [0, 1.16, -.3], rot: [Math.PI / 2, 0, 0] }); g.add(spout);
  // chorro de agua (curva) con textura animada
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 1.16, -.22), new THREE.Vector3(0, 1.14, .02), new THREE.Vector3(0, .62, .12));
  const stream = mesh(new THREE.TubeGeometry(curve, 16, .028, 8), new THREE.MeshStandardMaterial({ map: TEX.water([1, 4]), color: 0xcfeefa, roughness: .05, transparent: true, opacity: .85, emissive: 0x204050, emissiveIntensity: .4 }), { cast: false });
  g.add(stream); g.userData.stream = stream; g.userData.curve = curve;
  return g;
}
// ---------- reloj de sol (solarium) ----------
export function sundial() {
  const g = new THREE.Group(); const st = std({ map: TEX.marble([1, 1]), rough: .5 });
  g.add(mesh(new THREE.CylinderGeometry(.55, .65, 1, 24), st, { pos: [0, .5, 0] }));
  g.add(mesh(new THREE.CylinderGeometry(.8, .7, .12, 32), st, { pos: [0, 1.06, 0] }));
  // marcas de las 12 horas (semicírculo hacia el norte)
  for (let i = 0; i <= 12; i++) { const a = Math.PI * (i / 12); const m = box(.02, .012, .22, std({ color: 0x2a2018 }), { pos: [Math.cos(a) * .55, 1.12, -Math.sin(a) * .55 + .0], rot: [0, -a + Math.PI / 2, 0], cast: false }); g.add(m); }
  const gn = new THREE.Shape(); gn.moveTo(0, 0); gn.lineTo(.6, 0); gn.lineTo(0, .45); gn.closePath();
  const gnomon = mesh(new THREE.ExtrudeGeometry(gn, { depth: .03, bevelEnabled: false }), std({ color: 0x8a6a3a, metal: .6, rough: .35 }), { pos: [-.015, 1.12, .3], rot: [0, Math.PI / 2, 0] });
  gnomon.geometry.translate(0, 0, -.015); g.add(gnomon);
  return g;
}
// ---------- herrería: yunque y fragua ----------
export function anvil() { const g = new THREE.Group(); const m = std({ color: 0x3a3c40, metal: .8, rough: .4 }); g.add(mesh(new THREE.CylinderGeometry(.22, .26, .5, 10), std({ map: TEX.wood([1, 1]) }), { pos: [0, .25, 0] })); g.add(box(.5, .1, .2, m, { pos: [0, .5, 0] })); g.add(box(.25, .12, .16, m, { pos: [0, .6, 0] })); g.add(box(.6, .12, .22, m, { pos: [.05, .72, 0] })); const horn = mesh(new THREE.ConeGeometry(.08, .3, 10), m, { pos: [.48, .74, 0], rot: [0, 0, -Math.PI / 2] }); g.add(horn); return g; }
export function forge() { const g = new THREE.Group(); const b = std({ map: TEX.brick([1, 1]) }); g.add(box(1.4, .9, 1, b)); g.add(mesh(new THREE.CylinderGeometry(.45, .45, .06, 16), std({ color: 0x1a0d08, emissive: 0xff4a10, ei: 1.2 }), { pos: [0, .92, 0] })); const hood = mesh(new THREE.ConeGeometry(.8, 1.2, 4, 1, true), b, { pos: [0, 2.2, 0], rot: [0, Math.PI / 4, 0] }); g.add(hood); g.add(box(.5, 1.5, .5, b, { pos: [0, 2.7, 0] })); return g; }
export function potWheel() { const g = new THREE.Group(); const w = std({ map: TEX.wood([1, 1]), color: 0x8a6040 }); g.add(mesh(new THREE.CylinderGeometry(.12, .2, .55, 10), w, { pos: [0, .27, 0] })); const disc = mesh(new THREE.CylinderGeometry(.35, .35, .05, 24), w, { pos: [0, .57, 0] }); g.add(disc); const clay = mesh(lathe([[0, 0], [.15, 0], [.16, .08], [.12, .18], [.09, .24], [.1, .27], [0, .27]], 24), std({ color: 0xa8603a, rough: .6 }), { pos: [0, .6, 0] }); g.add(clay); g.userData.disc = disc; g.userData.clay = clay; return g; }
export function crate(s = 1) { const m = std({ map: TEX.planks([1, 1]), color: 0x9a7050 }); return box(.6 * s, .5 * s, .5 * s, m); }
export function sack(s = 1) { const m = mesh(new THREE.SphereGeometry(.3, 12, 8), std({ map: TEX.cloth([1, 1], '#b8a27a') }), { scale: [s, s * .8, s], pos: [0, .22 * s, 0] }); const g = new THREE.Group(); g.add(m); return g; }
// Busto de mármol (Julio César) sobre pedestal (personaje 2D + pedestal 3D)
export function pedestal() { const g = new THREE.Group(); const m = std({ map: TEX.marble([1, 1]), rough: .5 }); g.add(box(1, .2, 1, m)); g.add(box(.8, 1.4, .8, m, { pos: [0, .2, 0] })); g.add(box(1, .18, 1, m, { pos: [0, 1.6, 0] })); return g; }
// Colinas lejanas
export function hills(color = 0x6a7a4a, seed = 1, n = 6, rad = 60) { const g = new THREE.Group(); const R = rng(seed); for (let i = 0; i < n; i++) { const s = 12 + R() * 18; const h = mesh(new THREE.SphereGeometry(s, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std({ color, rough: 1, flat: true }), { pos: [(i / (n - 1) - .5) * rad * 1.8, -s * .55, -rad - R() * 20], cast: false }); h.scale.y = .5 + R() * .3; g.add(h); } return g; }

// Muro con huecos rectangulares (ventanas/puertas) — construido en el plano XY, centrado en x
export function wallHoles(w, h, holes, depth, mat) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  for (const o of holes) { const p = new THREE.Path(); p.moveTo(o.x - o.w / 2, o.y); p.lineTo(o.x + o.w / 2, o.y); p.lineTo(o.x + o.w / 2, o.y + o.h); p.lineTo(o.x - o.w / 2, o.y + o.h); p.closePath(); s.holes.push(p); }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2);
  const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + p.getZ(i)) / 3, p.getY(i) / 3); uv.needsUpdate = true;
  return mesh(g, mat);
}
// Despertador moderno (para el gag "no habría alarma")
export function alarmClock() {
  const g = new THREE.Group(); const red = std({ color: 0xd8342a, rough: .35, metal: .2 }); const met = std({ color: 0xd0d0d0, metal: .9, rough: .25 });
  const body = mesh(new THREE.CylinderGeometry(.13, .13, .08, 28), red, { rot: [Math.PI / 2, 0, 0], pos: [0, .16, 0] }); g.add(body);
  g.add(mesh(new THREE.CircleGeometry(.11, 28), std({ color: 0xfaf6ea, rough: .4 }), { pos: [0, .16, .041] }));
  g.add(box(.008, .07, .004, std({ color: 0x111111 }), { pos: [0, .16, .045], center: true }));
  g.add(box(.05, .008, .004, std({ color: 0x111111 }), { pos: [.02, .16, .045], center: true }));
  for (const sd of [-1, 1]) { g.add(mesh(new THREE.SphereGeometry(.06, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), met, { pos: [sd * .09, .28, 0], rot: [0, 0, -sd * .5] })); g.add(mesh(new THREE.CylinderGeometry(.01, .01, .08, 6), met, { pos: [sd * .08, .04, 0], rot: [0, 0, sd * .4] })); }
  return g;
}
// Edificio lejano económico (una caja con textura de fachada y ventanas iluminables)
import { facade } from './textures.js';
export function farBuilding(w, h, d, tint = 'warm', seed = 1, roofed = true) {
  const g = new THREE.Group(); const f = facade(tint, seed);
  const mat = new THREE.MeshStandardMaterial({ map: f.map, emissiveMap: f.emissive, emissive: 0xffffff, emissiveIntensity: 0, roughness: .95 });
  mat.userData.isGlow = true; mat.map = f.map.clone(); mat.map.needsUpdate = true; mat.map.repeat.set(w / 4.5, h / 12); mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
  mat.emissiveMap = f.emissive.clone(); mat.emissiveMap.needsUpdate = true; mat.emissiveMap.repeat.copy(mat.map.repeat); mat.emissiveMap.wrapS = mat.emissiveMap.wrapT = THREE.RepeatWrapping;
  const side = std({ map: TEX.plaster([d / 4, h / 4], tint) });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, side, side, mat, side]); m.geometry.translate(0, h / 2, 0); m.castShadow = m.receiveShadow = true; g.add(m);
  if (roofed) { const r = roof(w, d, Math.min(1.4, w * .22), .2); r.position.y = h; g.add(r); }
  return g;
}
// Ajusta todas las ventanas iluminadas de una escena (noche = 1, día = 0)
export function setGlow(scene, k) { scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.userData?.isGlow) m.emissiveIntensity = k * (m.emissiveMap ? 1.6 : 1.4); }); }
