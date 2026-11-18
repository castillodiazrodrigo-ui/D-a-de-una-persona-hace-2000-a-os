# Planificación de escenas — «Un día en Roma hace 2000 años»

**Audio:** `audio/narracion.mp3` · **duración exacta:** 67,788 s (ffprobe) · mono 44,1 kHz
**Formato:** 1080×1920 (9:16), 30 fps → 2034 fotogramas.
Los tiempos por palabra se obtuvieron con Whisper (`audio/transcripcion.json`). El audio original no se modifica: se mezcla con ganancia 1,0.

## Fichas de personajes (`src/characters/roster.js`)

| Personaje | Cabeza | Vestimenta / color | Accesorios | Personalidad |
|---|---|---|---|---|
| **Marco** (“tú”) | óvalo blanco cálido, base algo más ancha, mechón | túnica ocre `#c9793c` con *clavi* rojizos | cinturón de cuero, bolsita, sandalias | curioso, cálido, expresivo |
| Livia | redonda | estola azul petróleo | moño oscuro, cinturón dorado | serena |
| Tito | grande (escala 0,62) | túnica verde corta | mechón | alegre, inquieto |
| Vecina | ovalada | vestido malva | pañuelo en la cabeza | conversadora |
| Inquilino rico | ancha | toga blanca, franja púrpura | moneda | seguro de sí |
| Herrero / estibadores / vendedor / tabernero / portero / carretero | variantes | ropa de oficio | gorro *pileus*, delantales, capucha | — |
| Julio César | estatua de mármol | toga | corona de laurel | solemne |

En las termas, Marco conserva la misma cabeza, mechón y paleta, con una toalla ocre.

## Línea de tiempo

| # | Inicio–fin (s) | Narración | Escenario | Acción principal | Cámara | Transición |
|---|---|---|---|---|---|---|
| S01 | 0,00–2,75 | «Si despertaras en Roma hace dos mil años,» | Panorama de Roma al amanecer (acueducto, templo, ínsulas, pájaros, humo) | Se enciende la ventana de Marco | Grúa aérea que desciende hasta la ventana | Entra por la ventana + destello |
| S02 | 2,75–4,35 | «no habría alarma.» | Habitación (último piso) | Marco duerme; aparece un despertador moderno, tiembla y desaparece en humo (✕) | Plano medio, avance lento | Corte |
| S03 | 4,35–6,25 | «Te despertaría el sol.» | Habitación | Se abren los postigos, el haz de sol le da en la cara: entrecierra los ojos, los abre, se estira | Primer plano | Corte |
| S04 | 6,25–11,75 | «Para los romanos, el día tenía 12 horas, del amanecer al atardecer.» | Terraza con reloj de sol | Marco señala el cielo; el sol cruza de este a oeste, la sombra del gnomon barre las horas I–XII | Contrapicado → plano detalle del cuadrante | Corte |
| S05 | 11,75–15,35 | «En verano, cada hora duraba más que en invierno.» | Terraza | Verano (abanico, sudor) → nieve, árbol desnudo, tiritona | Travelling lateral | Cambio de estación dentro del plano |
| S06 | 15,35–16,60 | «Abres los ojos…» | Habitación | Abre los ojos | Primerísimo primer plano | Corte |
| S07 | 16,60–19,60 | «…en una ínsula, un edificio de varios pisos.» | Exterior de la ínsula | Vecinos en la calle y el balcón | Grúa que se aleja desde su ventana hasta un contrapicado general | Corte |
| S08 | 19,60–22,50 | «Cuanto más arriba vives, menos pagas.» | Ínsula en corte | La fachada se levanta; un inquilino por piso; pilas de monedas que disminuyen | Panorámica vertical de abajo arriba | Corte |
| S09 | 22,50–24,95 | «No hay agua corriente ni cocina.» | Habitación | Vuelca la jarra vacía: cae una gota; confusión | Plano general → medio | Corte |
| S10 | 24,95–27,40 | «Bajas a la fuente del barrio a llenar tu jarra.» | Calle con fuente pública | Camina con la jarra y la llena bajo el caño; vecina y Tito | Travelling lateral → detalle | Corte |
| S11 | 27,40–32,45 | «Desayunas pan, un poco de queso y, con suerte, aceitunas.» | Habitación (mesa) | Pan, queso y aceitunas aparecen sincronizados; muerde el pan; alegría con las aceitunas | General → detalle de la comida → medio | Corte |
| S12 | 32,45–34,50 | «Después, a trabajar.» | Calle | Sale decidido y camina | Seguimiento lateral bajo | Corte |
| S13 | 34,50–35,50 | «En un taller,» | Taller (fragua) | Martilla en el yunque (chispas en cada golpe) | Plano medio | Corte rápido |
| S14 | 35,50–36,55 | «en el mercado» | Mercado | Vende fruta pregonando | Plano medio | Corte rápido |
| S15 | 36,55–37,65 | «o en el puerto.» | Puerto (barco, gaviotas, olas) | Carga un ánfora por el muelle | Travelling | Corte |
| S16 | 37,65–39,75 | «Casi todo se hace a mano.» | Taller (torno de alfarero) | Manos modelando la arcilla; el herrero martilla al fondo | Plano detalle → abre | Corte |
| S17 | 39,75–42,25 | «Al mediodía, una comida ligera.» | Thermopolium (sol cenital) | El tabernero le sirve un cuenco y come | Picado → medio | Corte |
| S18 | 42,25–46,35 | «Por la tarde, vas a las termas. Entrar cuesta muy poco.» | Fachada de las termas, luz dorada | Camina a la entrada y paga ¼ de as al portero | Contrapicado general → medio | Corte |
| S19 | 46,35–50,00 | «Ahí te bañas, conversas y cierras negocios.» | Interior de las termas (vapor, haces de luz) | Salpica, conversa, apretón de manos con un mercader | General → plano a dos | Corte |
| S20 | 50,00–52,25 | «Al atardecer, llega la cena.» | Habitación al atardecer | Livia trae la olla humeante; la familia celebra | Plano general de mesa | Corte |
| S21 | 52,25–54,50 | «Y después, la oscuridad.» | Habitación | La luz se apaga; miedo en las caras | Avance lento | Dentro del plano |
| S22 | 54,50–56,55 | «Sólo hay lámparas de aceite.» | Habitación | Marco enciende la lucerna; luz cálida | Detalle de la lámpara → medio | Destello |
| S23 | 56,55–59,10 | «Pero Roma no duerme en silencio.» | Habitación | En la cama oye ruido; luz de carro en la ventana | Avance hacia la ventana | Fundido corto a negro |
| S24 | 59,10–60,45 | «Desde Julio César,» | Calle nocturna | Estatua de César entre antorchas | Contrapicado | Corte |
| S25 | 60,45–63,75 | «la mayoría de los carros sólo podía circular de noche.» | Calle nocturna | Carros con mulas, ruedas girando, carretero con antorcha | Detalle bajo de ruedas → general | Corte |
| S26 | 63,75–66,10 | «Así que te dormías igual que hoy,» | Habitación | Duerme sonriendo; luces de los carros cruzan la pared | Avance lento | Corte |
| S27 | 66,10–67,79 | «escuchando el tráfico.» | Panorama nocturno | Antorchas de carros recorriendo la ciudad | Grúa que sale de su ventana | Fundido a negro final |

## Sonido
* **Música** original sintetizada (modo dórico en Re, 100 BPM, lira / flauta / pads / percusión de marco / taiko), con secciones por emoción: amanecer, día, verano/invierno, vida urbana, trabajo, termas, atardecer, oscuridad, tensión, carros nocturnos y resolución final.
* **Efectos** (223 eventos) generados por síntesis y colocados con los tiempos exactos que exporta la animación (`audio/cues.json`): pasos sincronizados con cada pisada del ciclo de caminar, cascos de mula, yunque, monedas, agua, fuego, chapoteos, viento, grillos, ambientes de calle, mercado, puerto y termas.
* **Mezcla:** narración intacta (ganancia 1,0); música con *ducking* automático bajo la voz; reverberación según el espacio (habitación, termas, exterior).
