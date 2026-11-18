// =====================================================================
//  TEXTOS EN PANTALLA (fuera de los subtítulos) y efectos globales
//  Posiciones en píxeles del lienzo 1080x1920 (zona segura de Shorts:
//  se evita la franja superior de 0-220 px y la inferior > 1500 px).
// =====================================================================
import { clamp, smooth, inv, pulse } from '../core/math.js';

const romanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
export const LABELS = [
  { id: 'roma', t0: .8, t1: 2.6, x: 540, y: 470, cls: 'roman', html: 'ROMA<span class="sub">SIGLO I d.C.</span>' },
  { id: 'x-alarma', t0: 3.56, t1: 4.3, x: 400, y: 760, cls: 'icon x', html: '✕', rot: -8 },
  { id: 'horas', t0: 8.3, t1: 11.7, x: 540, y: 420, cls: 'big', html: '12 HORAS',
    dyn: (t) => { const k = smooth(inv(7.4, 11.3, t)); const h = Math.min(11, Math.floor(k * 12)); return `12 HORAS<span class="sub">HORA <span class="gold">${romanos[h]}</span></span>`; } },
  { id: 'verano', t0: 12.05, t1: 13.55, x: 540, y: 430, cls: 'mid', html: '☀ VERANO<span class="sub">1 HORA ≈ <span class="gold">75 MIN</span></span>' },
  { id: 'invierno', t0: 14.3, t1: 15.3, x: 540, y: 430, cls: 'mid', html: '❄ INVIERNO<span class="sub">1 HORA ≈ <span class="blue">45 MIN</span></span>' },
  { id: 'insula', t0: 17.0, t1: 19.5, x: 540, y: 400, cls: 'roman', html: 'ÍNSULA<span class="sub">EDIFICIO DE ALQUILER</span>' },
  { id: 'arriba', t0: 20.1, t1: 22.4, x: 540, y: 330, cls: 'tag', html: '↑ MÁS ARRIBA = <span class="red">MENOS ALQUILER</span>' },
  { id: 'agua', t0: 23.0, t1: 24.9, x: 540, y: 380, cls: 'tag', html: '<span class="x">✕</span> AGUA CORRIENTE' },
  { id: 'cocina', t0: 23.85, t1: 24.9, x: 540, y: 490, cls: 'tag', html: '<span class="x">✕</span> COCINA' },
  { id: 'pan', t0: 28.5, t1: 32.4, x: 300, y: 380, cls: 'tag', html: 'PAN' },
  { id: 'queso', t0: 29.7, t1: 32.4, x: 560, y: 480, cls: 'tag', html: 'QUESO' },
  { id: 'aceitunas', t0: 31.55, t1: 32.4, x: 790, y: 380, cls: 'tag', html: '¡ACEITUNAS!' },
  { id: 'taller', t0: 34.6, t1: 35.48, x: 540, y: 360, cls: 'roman', html: 'TALLER' },
  { id: 'mercado', t0: 35.6, t1: 36.53, x: 540, y: 360, cls: 'roman', html: 'MERCADO' },
  { id: 'puerto', t0: 36.65, t1: 37.63, x: 540, y: 360, cls: 'roman', html: 'PUERTO' },
  { id: 'hora6', t0: 40.0, t1: 42.2, x: 540, y: 380, cls: 'mid', html: '☀ HORA VI<span class="sub">MEDIODÍA</span>' },
  { id: 'thermae', t0: 42.7, t1: 44.4, x: 540, y: 330, cls: 'tag', html: 'TERMAS PÚBLICAS' },
  { id: 'precio', t0: 45.0, t1: 46.3, x: 540, y: 400, cls: 'mid', html: '¼ DE AS<span class="sub">UN <span class="gold">CUADRANTE</span></span>' },
  { id: 'lucerna', t0: 55.2, t1: 56.5, x: 540, y: 400, cls: 'roman', html: 'LUCERNA<span class="sub">LÁMPARA DE ACEITE</span>' },
  { id: 'cesar', t0: 59.25, t1: 60.42, x: 540, y: 380, cls: 'roman', html: 'JULIO CÉSAR<span class="sub">LEX IULIA · 45 a.C.</span>' },
  { id: 'noche', t0: 62.4, t1: 63.7, x: 540, y: 380, cls: 'tag', html: '☾ CARROS: SÓLO DE NOCHE' },
];

// Fundidos y destellos globales
export const OVERLAY_FX = [
  { type: 'fade', fn: (t) => 1 - smooth(inv(0, .45, t)) },                     // entrada desde negro
  { type: 'flash', fn: (t) => pulse(t, 2.72, .16) * .35 },                       // golpe de luz al entrar por la ventana
  { type: 'flash', fn: (t) => pulse(t, 19.6, .2) * .25 },
  { type: 'fade', fn: (t) => pulse(t, 52.2, .1) * 0 },
  { type: 'flash', fn: (t) => pulse(t, 55.05, .25) * .18 },                      // la llama se enciende
  { type: 'fade', fn: (t) => pulse(t, 59.1, .16) * .8 },                         // corte a la calle nocturna
  { type: 'fade', fn: (t) => smooth(inv(67.45, 67.78, t)) },                     // fundido final a negro
];
