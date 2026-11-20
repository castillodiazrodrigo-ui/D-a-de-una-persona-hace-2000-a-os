# «Encerrado en el shopping» — Parte 1 (YouTube Short, 1080×1920, 71,0 s)

Episodio 1 de una serie. Estilo de caricatura ilustrada 2D inspirado en el lenguaje visual de la
referencia (cabezas blancas grandes con contorno grueso, rostros minimalistas, cuerpos-cápsula,
extremidades de palito, primeros planos expresivos, cortes rápidos, subtítulos de 1–2 palabras),
con personajes, escenarios e historia originales. Narración y guion: los del audio entregado (sin cambios).

* `src/core.js` — ilustración 2.5D en Canvas 2D: formas planas con trazo, colocadas en perspectiva (sin motores 3D).
* `src/char.js` — fichas y dibujo de personajes (Leo, su doble, maniquíes), expresiones y ciclos de caminar/correr.
* `src/env.js`, `src/places.js` — escenarios: pasillo de dos niveles con persianas, entrada, probador, escaleras
  mecánicas, patio de comidas, mapa del mega-shopping, rejilla del aire, juguetería, sala de seguridad, celular, reloj.
* `src/shots.js` — 37 planos con tiempos por palabra, cámara, acción y efectos de sonido.
* `src/subs.js` — subtítulos sincronizados (palabras clave en amarillo).
* `audio/build_audio.py` — música original por secciones, caja musical diegética y SFX sintetizados; mezcla bajo la voz.

Regenerar: `node ep1/render/cues.js && python3 ep1/audio/build_audio.py && node ep1/render/render.js --workers 4`,
luego codificar con ffmpeg (ver historial). Vista previa: `node ep1/render/shot.js 12.5,40 /tmp/prev`.
