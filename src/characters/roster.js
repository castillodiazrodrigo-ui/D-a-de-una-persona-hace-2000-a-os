// =====================================================================
//  FICHAS DE DISEÑO DE PERSONAJES (consistencia en todo el video)
//  Cada ficha define: forma de cabeza, ropa, colores, accesorios y
//  proporciones. NO se modifican entre escenas.
// =====================================================================
export const ROSTER = {
  // Protagonista: "tú", un romano común. Túnica ocre con clavi rojizos,
  // cinturón de cuero, bolsita, sandalias. Cabeza ovalada blanca con un
  // pequeño mechón. Personalidad: curioso, cálido, expresivo.
  marco: { name: 'Marco', seed: 1, headR: [17, 19.5], wob: [.02, 0, .06, 0], hair: 'tuft',
    body: '#c9793c', clavi: '#8e3b22', belt: '#5a3a22', pouch: '#7a5232', sandal: '#6a4426',
    wTop: 10.5, wBot: 15.5, hem: 13 },
  // Livia: compañera de Marco. Cabeza más redonda, moño oscuro, estola azul petróleo.
  livia: { name: 'Livia', seed: 2, headR: [16.5, 18], hair: 'bun', hairCol: '#3a2216',
    body: '#3f7480', belt: '#c9a35c', sandal: '#5a3a22', wTop: 9.5, wBot: 16.5, hem: 31, leg: 34 },
  // Tito: hijo pequeño. Escala 0.62, cabeza proporcionalmente grande.
  tito: { name: 'Tito', seed: 3, scale: .62, headR: [19, 20], hair: 'tuft',
    body: '#6f8f3e', belt: '#5a3a22', sandal: '#6a4426', wTop: 10, wBot: 14, hem: 10 },
  // Vecina de la fuente: pañuelo malva sobre la cabeza.
  vecina: { name: 'Vecina', seed: 4, headR: [16, 18.5], hair: 'scarf', scarf: '#8a5a7a',
    body: '#b58aa0', belt: '#6b3f55', sandal: '#5a3a22', wTop: 10, wBot: 17, hem: 31 },
  // Inquilino rico de la planta baja: toga blanca con franja púrpura, cuerpo ancho.
  rico: { name: 'Rico', seed: 5, headR: [18, 19], cloth: 'toga', body: '#efe6d2', toga: '#f4ecdb', stripe: '#6b2a5c',
    sandal: '#3a2416', wTop: 13, wBot: 20, hem: 22 },
  // Artesano/herrero del taller: delantal de cuero, gorro pileus.
  herrero: { name: 'Herrero', seed: 6, headR: [17.5, 18.5], cap: '#7b5b3c', body: '#7d8a8c', apron: '#5b3b24',
    belt: '#3a2416', sandal: '#4a2e18', wTop: 12, wBot: 17, hem: 12 },
  // Vendedor del mercado: túnica roja, delantal claro.
  vendedor: { name: 'Vendedor', seed: 7, headR: [18, 18], body: '#a8402e', apron: '#e8dcc0', belt: '#4a2e18',
    sandal: '#4a2e18', wTop: 11.5, wBot: 17.5, hem: 12 },
  // Estibador del puerto: túnica azul desteñida.
  estibador: { name: 'Estibador', seed: 8, headR: [17, 19], cap: '#9a7b52', body: '#5a6f8c', belt: '#3a2416',
    sandal: '#4a2e18', wTop: 11, wBot: 15, hem: 10 },
  estibador2: { name: 'Estibador2', seed: 9, headR: [18, 18.5], body: '#8c7a5a', belt: '#3a2416',
    sandal: '#4a2e18', wTop: 11, wBot: 16, hem: 10 },
  // Tabernero del thermopolium.
  tabernero: { name: 'Tabernero', seed: 10, headR: [18.5, 18], body: '#8a6a3a', apron: '#d8cbb0', belt: '#4a2e18',
    sandal: '#4a2e18', wTop: 12, wBot: 18.5, hem: 12 },
  // Bañistas de las termas (torso desnudo + toalla).
  banista1: { name: 'Bañista', seed: 11, headR: [17.5, 19], cloth: 'towel', body: '#e9e2cf', sandal: '#6a4426', wTop: 10, wBot: 14, hem: 14 },
  banista2: { name: 'Mercader', seed: 12, headR: [18.5, 18.5], cloth: 'towel', body: '#c9b27a', sandal: '#6a4426', wTop: 12, wBot: 16, hem: 14 },
  // Marco en las termas: mismo personaje (misma cabeza y mechón) con toalla ocre.
  marcoBano: { name: 'Marco', seed: 1, headR: [17, 19.5], wob: [.02, 0, .06, 0], hair: 'tuft', cloth: 'towel',
    body: '#c9793c', sandal: '#6a4426', wTop: 10.5, wBot: 15.5, hem: 14 },
  // Portero de las termas que cobra la entrada.
  portero: { name: 'Portero', seed: 13, headR: [17, 18], body: '#5e4a6e', belt: '#2e2216', sandal: '#3a2416', wTop: 11, wBot: 15, hem: 12 },
  // Carretero nocturno: paenula marrón con capucha.
  carretero: { name: 'Carretero', seed: 14, headR: [17, 18], hood: true, cloth: 'cloak', body: '#6b4e32', scarf: '#5a3f27',
    sandal: '#3a2416', wTop: 12, wBot: 17, hem: 16 },
  // Estatua de Julio César (mármol, corona de laurel).
  cesar: { name: 'César', seed: 15, headR: [16.5, 19.5], cloth: 'toga', body: '#e4e0d6', toga: '#ebe7dd', stripe: '#b9b3a6',
    skin: '#ebe7dd', laurel: '#8f8a7c', sandal: '#cfc9bc', wTop: 12, wBot: 18, hem: 22 },
  // Peatones genéricos (variantes de color)
  peaton1: { name: 'P1', seed: 16, headR: [17, 18.5], body: '#9a6a4a', belt: '#4a2e18', sandal: '#4a2e18', wTop: 11, wBot: 15, hem: 12 },
  peaton2: { name: 'P2', seed: 17, headR: [16, 18], hair: 'bun', hairCol: '#2a1a10', body: '#a39a5e', belt: '#5a4a2a', sandal: '#4a2e18', wTop: 10, wBot: 16, hem: 30 },
  peaton3: { name: 'P3', seed: 18, headR: [18, 19], cap: '#6a5a3a', body: '#6a7a52', belt: '#3a2a16', sandal: '#4a2e18', wTop: 11, wBot: 16, hem: 12 },
};
