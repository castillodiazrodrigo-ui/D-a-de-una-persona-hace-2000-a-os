// =====================================================================
//  Utilidades compartidas por los escenarios (sets)
// =====================================================================
import * as THREE from 'three';
import { makeSky, makeLights } from '../core/stage.js';
import { Toon } from '../characters/toon.js';
import { ROSTER } from '../characters/roster.js';
import { std, mesh } from '../world/props.js';

// Presets de iluminación por momento del día
export const TOD = {
  dawn:   { sun: 0xffa86a, sunI: 2.4, sky: 0x8a9ccc, ground: 0x6a4a3a, hemi: .55, top: 0x3c5a8c, mid: 0xffae78, bot: 0x6a5a5a, fog: 0xd8a88a, tint: [1, .9, .8], exp: 1.0 },
  day:    { sun: 0xfff1da, sunI: 3.1, sky: 0xbcd4ff, ground: 0x8a6a4a, hemi: .7, top: 0x3a76c4, mid: 0xcfe0ee, bot: 0x9a8a7a, fog: 0xcad8e2, tint: [1, 1, .97], exp: 1.0 },
  golden: { sun: 0xffc27a, sunI: 3.0, sky: 0xa8bce0, ground: 0x8a5a3a, hemi: .55, top: 0x4a70b0, mid: 0xf6c68a, bot: 0x8a6a5a, fog: 0xe2bc90, tint: [1, .92, .8], exp: 1.0 },
  dusk:   { sun: 0xff6a3a, sunI: 2.3, sky: 0x6a6aa8, ground: 0x4a2a2a, hemi: .45, top: 0x2a2a6a, mid: 0xff7a4a, bot: 0x4a3040, fog: 0xa85a50, tint: [1, .78, .66], exp: 1.0 },
  night:  { sun: 0x7f9cff, sunI: .55, sky: 0x2a3a70, ground: 0x0c0c18, hemi: .28, top: 0x03081a, mid: 0x14244a, bot: 0x05060c, fog: 0x0a1226, tint: [.5, .58, .85], exp: 1.05, stars: 1 },
  winter: { sun: 0xe0e8ff, sunI: 1.7, sky: 0xb8c8e8, ground: 0x8a8a9a, hemi: .7, top: 0x7088b0, mid: 0xdde4ec, bot: 0xa0a8b8, fog: 0xc8d2de, tint: [.9, .95, 1.05], exp: 1.0 },
};

export function baseSet(o = {}) {
  const scene = new THREE.Scene();
  const sky = o.sky === false ? null : makeSky(); if (sky) scene.add(sky);
  scene.fog = new THREE.Fog(0xcad8e2, o.fogNear ?? 30, o.fogFar ?? 160);
  const lights = makeLights(scene, o.lights || {});
  const set = { scene, sky, lights, toons: [], chars: {}, exposure: 1, tint: new THREE.Color(1, 1, 1) };
  set.addToon = (key, id = key, opts) => { const t = new Toon(ROSTER[key], opts); scene.add(t.root); set.toons.push(t); set.chars[id] = t; return t; };
  // aplica un preset (o mezcla de dos) de iluminación exterior
  set.tod = (name, name2, k = 0) => {
    const A = TOD[name], B = TOD[name2 || name];
    const c = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), k);
    const n = (a, b) => a + (b - a) * k;
    lights.sun.color.copy(c(A.sun, B.sun)); lights.sun.intensity = n(A.sunI, B.sunI);
    lights.hemi.color.copy(c(A.sky, B.sky)); lights.hemi.groundColor.copy(c(A.ground, B.ground)); lights.hemi.intensity = n(A.hemi, B.hemi);
    if (sky) { sky.u.top.value.copy(c(A.top, B.top)); sky.u.mid.value.copy(c(A.mid, B.mid)); sky.u.bot.value.copy(c(A.bot, B.bot)); sky.u.sunCol.value.copy(c(A.sun, B.sun)); sky.u.stars.value = n(A.stars || 0, B.stars || 0); }
    scene.fog.color.copy(c(A.fog, B.fog));
    set.tint.setRGB(n(A.tint[0], B.tint[0]), n(A.tint[1], B.tint[1]), n(A.tint[2], B.tint[2]));
    set.exposure = n(A.exp, B.exp);
    lights.fill.intensity = n(.35, .35) * (name === 'night' ? .4 : 1);
  };
  // coloca el sol en dirección (azimut, elevación) y actualiza el disco del cielo
  set.sunAt = (az, el, dist = 30, target = [0, 0, 0]) => {
    const d = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    lights.sun.position.set(target[0] + d.x * dist, target[1] + d.y * dist, target[2] + d.z * dist);
    lights.sun.target.position.set(...target); lights.sun.target.updateMatrixWorld();
    if (sky) sky.u.sunDir.value.copy(d);
  };
  set.applyTint = (extra = [1, 1, 1]) => { for (const t of set.toons) t.tint.setRGB(set.tint.r * extra[0], set.tint.g * extra[1], set.tint.b * extra[2]); };
  return set;
}
export function ground(map, size = 60, o = {}) {
  const g = mesh(new THREE.PlaneGeometry(size, size), std({ map, rough: o.rough ?? .95, color: o.color ?? 0xffffff }), { rot: [-Math.PI / 2, 0, 0], cast: false });
  return g;
}
