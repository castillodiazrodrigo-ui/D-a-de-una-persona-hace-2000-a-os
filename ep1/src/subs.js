// =====================================================================
//  SUBTÍTULOS estilo short narrado: 1–2 palabras a la vez, blancas con
//  contorno negro grueso, palabras clave en amarillo, aparición con
//  rebote en el instante exacto en que se pronuncian.
// =====================================================================
import { W } from './core.js';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
// Ortografía corregida de la transcripción automática (el audio no cambia)
const FIX = [
  [['corría', 'la'], ['corrí', 'a la']], [['a', 'ser', 'frío.'], ['a', 'hacer', 'frío.']], [['media', 'noche'], ['medianoche']], [['1200'], ['1.200']],
];
const HL = new Set(['encerrado', 'shopping', 'gigante', 'solo', 'solo,', '10', 'cuarto', 'dormido', 'probador', 'apagado', 'persianas', 'puertas', 'trabadas', 'señal', 'increíble', 'escaleras', 'mecánicas', 'patio', 'comidas', 'silencio', 'dubai', 'mall', '1.200', 'tiendas', 'aire', 'acondicionado', 'emergencia', 'frío', 'medianoche', 'música', 'juguetería', 'cajita', 'musical', 'sola', 'seguridad', 'ayuda', 'vacía', 'monitores', 'prendidos', 'mismo', 'alguien', 'nadie', 'cerca', 'misma', 'ropa', 'mí']);
const clean = w => w.toLowerCase().replace(/[.,¿?¡!]/g, '');

export class Subs {
  constructor(segs) {
    let words = segs.flatMap(s => s.words.map(w => ({ ...w })));
    for (const [from, to] of FIX) for (let i = 0; i + from.length <= words.length; i++) {
      if (from.every((f, j) => clean(words[i + j].w) === clean(f))) {
        const g = words.slice(i, i + from.length); const punct = g[g.length - 1].w.replace(/[^.,]/g, '');
        const rep = to.map((tw, j) => ({ w: tw.replace(/[.,]/g, '') + (j === to.length - 1 ? punct : ''), s: g[Math.min(j, g.length - 1)].s, e: g[Math.min(j, g.length - 1)].e }));
        rep[rep.length - 1].e = g[g.length - 1].e; words.splice(i, from.length, ...rep);
      }
    }
    // fragmentos de 1–2 palabras (las palabras cortas se agrupan con la siguiente)
    const chunks = []; let cur = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i], n = words[i + 1]; cur.push(w);
      const punct = /[.,]$/.test(w.w), gap = n ? n.s - w.e : 9, short = clean(w.w).length <= 3 && n && !punct;
      if (punct || gap > .25 || (cur.length >= 2 && !short) || cur.length >= 3) { chunks.push(cur); cur = []; }
    }
    if (cur.length) chunks.push(cur);
    this.chunks = chunks.map((c, i) => ({ words: c, s: c[0].s, e: c[c.length - 1].e }));
    this.chunks.forEach((c, i) => { const n = this.chunks[i + 1]; c.end = n ? Math.min(n.s, c.e + .45) : c.e + .4; });
  }
  draw(ctx, t, y = 1395) {
    const c = this.chunks.find(c => t >= c.s - .03 && t < c.end); if (!c) return;
    const k = clamp((t - c.s + .03) / .12); const pop = 1 + .18 * Math.sin(k * Math.PI) * (1 - k * .3);
    ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = '900 92px Mont';
    const items = c.words.filter(w => t >= w.s - .04).map(w => ({ txt: w.w.replace(/[.,]$/, '').toUpperCase(), hl: HL.has(clean(w.w)) }));
    const sp = 26, widths = items.map(i => ctx.measureText(i.txt).width); const total = widths.reduce((a, b) => a + b, 0) + sp * (items.length - 1);
    const scale = Math.min(1, 980 / total) * (.85 + .15 * k) * pop;
    ctx.translate(W / 2, y); ctx.scale(scale, scale); let x = -total / 2;
    items.forEach((it, i) => {
      ctx.lineJoin = 'round'; ctx.lineWidth = 18; ctx.strokeStyle = '#000'; ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowOffsetY = 7; ctx.shadowBlur = 0;
      ctx.strokeText(it.txt, x, 0); ctx.shadowColor = 'transparent';
      ctx.fillStyle = it.hl ? '#ffd43b' : '#ffffff'; ctx.fillText(it.txt, x, 0); x += widths[i] + sp;
    });
    ctx.restore();
  }
}
