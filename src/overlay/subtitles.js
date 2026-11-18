// =====================================================================
//  SUBTÍTULOS DINÁMICOS sincronizados palabra a palabra con la voz.
//  Fuente: audio/transcripcion.json (tiempos por palabra de Whisper).
// =====================================================================
import { clamp, backOut } from '../core/math.js';

// Correcciones ortográficas de la transcripción (no cambian el audio)
const FIX = [[['de', 'la', 'amanecer'], ['del', 'amanecer']], [['12'], ['12']]];
// Palabras destacadas (color dorado)
const HL = new Set(['roma', 'dos', 'mil', 'años', 'alarma', 'sol', '12', 'horas', 'amanecer', 'atardecer', 'verano', 'invierno', 'ínsula', 'pisos', 'arriba', 'menos', 'agua', 'cocina', 'fuente', 'jarra', 'pan', 'queso', 'aceitunas', 'trabajar', 'taller', 'mercado', 'puerto', 'mano', 'mediodía', 'ligera', 'termas', 'poco', 'bañas', 'conversas', 'negocios', 'cena', 'oscuridad', 'lámparas', 'aceite', 'silencio', 'julio', 'césar', 'carros', 'noche', 'tráfico', 'hoy']);

export function buildChunks(segments) {
  let words = segments.flatMap(s => s.words.map(w => ({ ...w })));
  // aplicar correcciones
  for (const [from, to] of FIX) {
    for (let i = 0; i + from.length <= words.length; i++) {
      if (from.every((f, j) => words[i + j].w.toLowerCase().replace(/[.,]/g, '') === f) && from.length !== to.length) {
        const group = words.slice(i, i + from.length);
        const rep = to.map((tw, j) => ({ w: tw + (j === to.length - 1 ? group[group.length - 1].w.replace(/[^.,]/g, '') : ''), s: j === 0 ? group[0].s : group[group.length - 1].s - .3 * 0, e: group[group.length - 1].e }));
        rep[0].e = group[1].e; if (rep[1]) rep[1].s = group[group.length - 1].s;
        words.splice(i, from.length, ...rep);
      }
    }
  }
  // agrupar en fragmentos cortos (máx. 3 palabras o pausa / puntuación)
  const chunks = []; let cur = [];
  const flush = () => { if (cur.length) chunks.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e }); cur = []; };
  for (let i = 0; i < words.length; i++) {
    const w = words[i], next = words[i + 1];
    cur.push(w);
    const punct = /[.,]$/.test(w.w);
    const gap = next ? next.s - w.e : 9;
    const short = w.w.length <= 3 && next && !punct;
    if (punct || gap > .28 || (cur.length >= 3 && !short) || cur.length >= 4) flush();
  }
  flush();
  // cada fragmento permanece hasta que empieza el siguiente (sin parpadeos)
  for (let i = 0; i < chunks.length; i++) { const n = chunks[i + 1]; chunks[i].end = n ? Math.min(n.s, chunks[i].e + .6) : chunks[i].e + .5; }
  return chunks;
}

export class Subtitles {
  constructor(el, chunks) { this.el = el; this.chunks = chunks; this.last = null; }
  update(t, style = {}) {
    const c = this.chunks.find(c => t >= c.s - .05 && t < c.end);
    if (!c) { this.el.innerHTML = ''; this.last = null; return; }
    const k = clamp((t - c.s + .05) / .16);
    const html = c.words.map(w => {
      const clean = w.w.toLowerCase().replace(/[.,¿?¡!]/g, '');
      const active = t >= w.s - .03;
      const now = t >= w.s - .03 && t < w.e + .05;
      const pop = now ? 1 + .12 * Math.sin(clamp((t - w.s) / .25) * Math.PI) : 1;
      const cls = (HL.has(clean) ? 'hl ' : '') + (active ? 'on' : 'off');
      return `<span class="${cls}" style="transform:scale(${pop.toFixed(3)})">${w.w.replace(/[.,]$/, '').toUpperCase()}</span>`;
    }).join(' ');
    this.el.innerHTML = html;
    const s = .75 + .25 * backOut(k);
    this.el.style.transform = `translateX(-50%) scale(${s.toFixed(3)})`;
    this.el.style.opacity = clamp(k * 2).toFixed(3);
    this.el.style.top = (style.top ?? 1215) + 'px';
  }
}
