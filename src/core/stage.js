// =====================================================================
//  ESCENARIO BASE: renderer, cielo, luces y sistemas de partículas.
// =====================================================================
import * as THREE from 'three';
import { radialTex } from '../world/textures.js';
import { rng } from './math.js';

export const W = 1080, H = 1920;
export function createRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: !/noaa/.test(location.search), preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  r.setPixelRatio(1); r.setSize(W, H, false);
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1;
  r.outputColorSpace = THREE.SRGBColorSpace;
  return r;
}

// ---------- cielo con gradiente, sol y estrellas ----------
export function makeSky(o = {}) {
  const u = {
    top: { value: new THREE.Color(o.top ?? 0x3a6ea8) }, mid: { value: new THREE.Color(o.mid ?? 0xf0c890) }, bot: { value: new THREE.Color(o.bot ?? 0x8a7a6a) },
    sunDir: { value: new THREE.Vector3(0, .3, -1).normalize() }, sunCol: { value: new THREE.Color(o.sun ?? 0xffe0a0) },
    stars: { value: o.stars ?? 0 }, sunSize: { value: o.sunSize ?? 1 }, horizon: { value: o.horizon ?? .0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }`,
    fragmentShader: `uniform vec3 top, mid, bot, sunCol, sunDir; uniform float stars, sunSize, horizon; varying vec3 vDir;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      void main(){ vec3 d = normalize(vDir); float h = d.y - horizon;
        vec3 c = h > 0. ? mix(mid, top, pow(clamp(h,0.,1.), .55)) : mix(mid, bot, pow(clamp(-h*3.,0.,1.), .5));
        float s = max(dot(d, normalize(sunDir)), 0.);
        c += sunCol * (smoothstep(1. - .0009*sunSize, 1. - .0006*sunSize, s) * 6. + pow(s, 12.) * .5 + pow(s, 3.) * .12);
        if (stars > 0.) { vec2 g = vec2(atan(d.x, d.z) * 180., d.y * 260.); vec2 id = floor(g); float r = h21(id); float st = step(.985, r) * smoothstep(.0, .3, h) * (0.6 + .4*sin(r*800.)); c += vec3(st * stars); }
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), mat); m.frustumCulled = false; m.renderOrder = -10;
  m.u = u; return m;
}

// ---------- luces estándar de un set ----------
export function makeLights(scene, o = {}) {
  const hemi = new THREE.HemisphereLight(o.sky ?? 0xbfd4ff, o.ground ?? 0x6a5040, o.hemi ?? .6); scene.add(hemi);
  const sun = new THREE.DirectionalLight(o.sun ?? 0xfff0d8, o.sunI ?? 2.5);
  sun.position.set(...(o.sunPos || [8, 12, 6])); sun.castShadow = true;
  const sm = o.shadowSize ?? 12; const c = sun.shadow.camera; c.left = -sm; c.right = sm; c.top = sm; c.bottom = -sm; c.near = .5; c.far = o.far ?? 60;
  sun.shadow.mapSize.set(o.mapSize ?? 2048, o.mapSize ?? 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = .03; sun.shadow.radius = o.radius ?? 3;
  sun.target.position.set(...(o.target || [0, 0, 0]));
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(o.fill ?? 0x9ab0e0, o.fillI ?? .35); fill.position.set(-6, 4, 8); scene.add(fill);
  return { hemi, sun, fill };
}

// ---------- partículas deterministas (posición = f(semilla, t)) ----------
const ptsVert = `attribute float aAlpha; attribute float aSize; varying float vA; uniform float uScale;
  void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = min(aSize * uScale * .001 / -mv.z, 400.); gl_Position = projectionMatrix * mv; }`;
const ptsFrag = `uniform sampler2D map; uniform vec3 color; varying float vA;
  void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(color, t.a * vA); if (gl_FragColor.a < .003) discard;
  #include <colorspace_fragment>
  }`;
export class Particles {
  /** kind: dust | snow | steam | smoke | sparks | rain | embers | splash */
  constructor(kind, n, box, o = {}) {
    this.kind = kind; this.n = n; this.box = box; this.o = o;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3); this.alpha = new Float32Array(n); this.size = new Float32Array(n);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1)); g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    const R = rng(o.seed || 7); this.seeds = Array.from({ length: n }, () => [R(), R(), R(), R(), R()]);
    const soft = kind === 'steam' || kind === 'smoke';
    this.mat = new THREE.ShaderMaterial({ uniforms: { map: { value: radialTex(soft ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,1)', 'rgba(255,255,255,0)') }, color: { value: new THREE.Color(o.color ?? 0xffffff) }, uScale: { value: 2300 } },
      vertexShader: ptsVert, fragmentShader: ptsFrag, transparent: true, depthWrite: false, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 5;
    this.intensity = 1;
  }
  update(t) {
    const [x0, y0, z0, x1, y1, z1] = this.box, W = x1 - x0, Hh = y1 - y0, D = z1 - z0; const o = this.o;
    for (let i = 0; i < this.n; i++) {
      const s = this.seeds[i]; let x, y, z, a = 1, sz = o.size ?? 6;
      switch (this.kind) {
        case 'dust': { x = x0 + ((s[0] * W + Math.sin(t * .3 + s[3] * 9) * .3 + t * .05) % W + W) % W; y = y0 + ((s[1] * Hh + Math.sin(t * .4 + s[4] * 7) * .2 + t * .03) % Hh); z = z0 + s[2] * D; a = (.3 + .7 * s[3]) * (.6 + .4 * Math.sin(t * 2 + s[4] * 20)); sz = (o.size ?? 5) * (.5 + s[4]); break; }
        case 'snow': { const sp = .5 + s[3] * .4; y = y1 - ((s[1] * Hh + t * sp) % Hh); x = x0 + s[0] * W + Math.sin(t * 1.3 + s[4] * 9) * .25; z = z0 + s[2] * D; sz = (o.size ?? 9) * (.5 + s[4]); a = .9; break; }
        case 'rain': { y = y1 - ((s[1] * Hh + t * 9) % Hh); x = x0 + s[0] * W; z = z0 + s[2] * D; sz = 3; a = .4; break; }
        case 'steam': case 'smoke': { const life = o.life ?? 3; const k = ((t / life + s[0]) % 1); x = x0 + s[1] * W + Math.sin(k * 5 + s[2] * 9) * .2 * k + (o.drift ?? 0) * k; y = y0 + k * Hh; z = z0 + s[2] * D; a = Math.sin(k * Math.PI) * (o.alpha ?? .35); sz = (o.size ?? 60) * (.4 + k * 1.2) * (.7 + s[3] * .6); break; }
        case 'sparks': case 'embers': { const life = o.life ?? .8; const per = o.period ?? 0; let k; if (o.burstAt !== undefined) { k = (t - o.burstAt) / life * (.6 + s[3] * .8); if (k < 0 || k > 1) { a = 0; k = 0; } } else k = ((t / life + s[0]) % 1);
          const vx = (s[1] - .5) * 2.2, vy = 1.5 + s[2] * 2, vz = (s[4] - .5) * 2.2; const tt = k * life;
          x = x0 + vx * tt; y = y0 + vy * tt - 4.9 * tt * tt * (this.kind === 'embers' ? .05 : 1); z = z0 + vz * tt; if (a) a = 1 - k; sz = (o.size ?? 5) * (1 - k * .5); break; }
        case 'splash': { const life = .6; const k = (t - (o.burstAt ?? 0)) / life; if (k < 0 || k > 1) { a = 0; x = y = z = 0; break; } const ang = s[0] * 6.28, sp = .6 + s[1] * 1.4; const tt = k * life; x = x0 + Math.cos(ang) * sp * tt; z = z0 + Math.sin(ang) * sp * tt; y = y0 + (2 + s[2] * 2) * tt - 9.8 * tt * tt; a = 1 - k; sz = (o.size ?? 7) * (.6 + s[3]); break; }
      }
      this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.alpha[i] = a * this.intensity; this.size[i] = sz;
    }
    this.points.visible = this.intensity > 0 && this._vis !== false;
    const g = this.points.geometry; g.attributes.position.needsUpdate = true; g.attributes.aAlpha.needsUpdate = true; g.attributes.aSize.needsUpdate = true;
  }
}

// ---------- haz de luz volumétrico (cono aditivo) ----------
export function lightShaft(len = 6, r0 = .3, r1 = 1.5, color = 0xffe0a0, opacity = .18) {
  const g = new THREE.CylinderGeometry(r0, r1, len, 24, 1, true); g.translate(0, -len / 2, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, opacity: { value: opacity }, len: { value: len } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = position.y; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 color; uniform float opacity, len; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(vN, vV)), 1.5); float fall = smoothstep(-len, -len*.1, vY) * smoothstep(0., -len*.08, vY); gl_FragColor = vec4(color * opacity * f * fall, 1.);
    #include <colorspace_fragment>
    }`,
  });
  const m = new THREE.Mesh(g, mat); m.renderOrder = 6; return m;
}
// Sprite de nube suave
export function cloud(scale = 20, opacity = .8, color = 0xffffff) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex('rgba(255,255,255,.9)', 'rgba(255,255,255,0)'), color, transparent: true, opacity, depthWrite: false, fog: false }));
  s.scale.set(scale, scale * .35, 1); return s;
}
