# Un día en Roma hace 2000 años — YouTube Short animado

Short educativo narrado (1080×1920, 9:16, 30 fps, 67,79 s), construido íntegramente con código:
personajes caricaturescos 2D (cabezas blancas, rostros minimalistas, contorno negro) integrados como
*billboards* en escenarios 3D (Three.js) con iluminación, sombras proyectadas reales, niebla,
partículas y haces de luz; subtítulos dinámicos palabra a palabra; música y efectos sintetizados y
sincronizados con la animación.

Resultado: `out/roma_2000_short.mp4` · Planificación: [`docs/PLAN_DE_ESCENAS.md`](docs/PLAN_DE_ESCENAS.md)

## Estructura

```
index.html                  página de render (lienzo WebGL + capas de subtítulos/textos)
src/main.js                 motor: línea de tiempo, cámara, transiciones, recolección de SFX
src/core/                   matemáticas/easing deterministas, renderer, cielo, luces, partículas
src/characters/toon.js      PERSONAJES 2D: dibujo en Canvas + billboard 3D + sombras
src/characters/roster.js    fichas de diseño (consistencia de cada personaje)
src/characters/poses.js     ciclos de caminar/correr sin deslizamiento, sentarse, señalar...
src/characters/animals.js   mula de tiro y gaviota (mismo estilo de tinta)
src/world/                  texturas procedurales y utilería 3D (edificios, muebles, carros, barco...)
src/sets/                   ESCENARIOS: city, bedroom, sundial, insula, street, workshop/port, baths
src/shots/act1..3.js        PLANOS: cada uno con tiempos, cámara, acción y SFX (editables por separado)
src/shots/labels.js         textos en pantalla y fundidos
src/overlay/                subtítulos sincronizados y títulos animados
audio/narracion.mp3         narración original (no se modifica)
audio/transcripcion.json    tiempos por palabra (Whisper)
audio/cues.json             SFX con tiempos exactos exportados por la animación
audio/build_audio.py        música original + SFX sintetizados + mezcla con ducking
render/render.js            captura determinista fotograma a fotograma (Chromium headless, en paralelo)
render/encode.sh            MP4 final (H.264 + AAC)
tools/transcribe.py         transcripción con tiempos por palabra
```

## Cómo regenerar

```bash
npm install                                   # three + fuentes
node render/render.js --cues                  # exporta audio/cues.json y out/shots.json
python3 audio/build_audio.py                  # out/mix.wav (música + SFX + narración)
node render/render.js --workers 3             # out/frames/*.jpg (≈ 0,8 s/fotograma)
render/encode.sh                              # out/roma_2000_short.mp4
```

Para corregir un plano basta con editar su entrada en `src/shots/actN.js` y volver a renderizar solo
su rango de fotogramas: `node render/render.js --from 187 --to 352 --force` (fotograma = segundo × 30).
Vista previa de un instante: `node dev/frame.js 12.5,30 /tmp/prev` .
