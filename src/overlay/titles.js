// =====================================================================
//  TEXTOS EN PANTALLA (cifras, conceptos, etiquetas) con animación.
// =====================================================================
import { clamp, backOut, easeOut } from '../core/math.js';
export class Titles {
  constructor(root) { this.root = root; this.pool = new Map(); }
  // items: [{id, t0, t1, html, x, y, cls, anchor}]
  update(t, items) {
    const live = new Set();
    for (const it of items) {
      if (t < it.t0 - .01 || t > it.t1 + .01) continue;
      live.add(it.id);
      let el = this.pool.get(it.id);
      if (!el) { el = document.createElement('div'); el.className = 'ttl ' + (it.cls || ''); el.innerHTML = it.html; this.root.appendChild(el); this.pool.set(it.id, el); }
      const kin = clamp((t - it.t0) / (it.inDur ?? .35)), kout = clamp((it.t1 - t) / (it.outDur ?? .25));
      const s = (it.pop === false ? 1 : .4 + .6 * backOut(kin)) * (.9 + .1 * kout);
      const dy = (1 - easeOut(kin)) * 40;
      el.style.left = it.x + 'px'; el.style.top = (it.y + dy) + 'px';
      el.style.opacity = Math.min(kin * 1.5, kout).toFixed(3);
      el.style.transform = `translate(-50%,-50%) scale(${s.toFixed(3)}) rotate(${(it.rot || 0)}deg)`;
      if (it.dyn) el.innerHTML = it.dyn(t);
    }
    for (const [id, el] of this.pool) if (!live.has(id)) { el.remove(); this.pool.delete(id); }
  }
}
