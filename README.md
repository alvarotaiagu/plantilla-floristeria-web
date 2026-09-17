# Ramalleira — plantilla de web para floristería

> **Sitio de demostración. Ramalleira es una floristería ficticia**: el nombre,
> la dirección, los teléfonos, los precios, los talleres y las notas del
> mostrador son de muestra y no corresponden a ningún negocio real. La web
> lleva `noindex, nofollow` a propósito.

Demo: **https://alvarotaiagu.github.io/plantilla-floristeria-web/**

Web estática de una sola página (más aviso legal, privacidad y 404). Sin
framework, sin build, sin backend y sin npm: se abre con doble clic. GSAP,
ScrollTrigger y Lenis entran por CDN; si el CDN cae, la página se lee entera.

---

## El concepto: «Ramo»

En una floristería de barrio lo que se compra no es un producto de estantería:
es **un rato de mostrador**. Le dices para quién es, miráis juntos el cubo y el
ramo se monta delante de ti, tallo a tallo.

La página hace exactamente eso:

- El **hero** es un ramo dibujado que se monta al entrar: primero el papel,
  después el verde, las flores, el relleno y el lazo.
- La sección **«Cómo se monta»** se ancla a la pantalla y el ramo va ganando
  grupos conforme lees los cinco pasos, con un contador de **tallos en la
  mano** que sube de 0 a 13. Es el recurso protagonista.
- **«El cubo»** es lo que hay cortado esta semana, con precio por tallo, y los
  tres destacados **cambian solos cada semana** a partir de la fecha.
- La cabecera de **«La tienda»** dice si está **abierto ahora** y a qué hora se
  abre o se cierra, y marca la fila de hoy en el horario.

Ninguna de las ocho flores es una foto: están **dibujadas en SVG** en el
`<defs>` de `index.html` (rosa, ranúnculo, tulipán, clavel, eucalipto, helecho,
paniculata y espiga) y se colocan con `<use>`, `transform` y el atributo
`color`. Por eso el mismo ramo puede montarse dos veces, en el hero y en la
sección anclada, sin repetir dibujo.

---

## Mapa de secciones

| # | Sección | Qué hace |
|---|---|---|
| — | Cabecera | Fija, se «posa» al bajar. Menú móvil a pantalla completa con `aria-expanded`. |
| 01 | Hero | Ramo SVG que se monta al entrar, titular char-reveal, precio del ramo del día y CTA de WhatsApp. |
| — | Cinta | Marquee infinito de nombres de flor, con la velocidad ligada a la del scroll. |
| 02 | El cubo | Ocho tallos con su dibujo, su nota y su precio; tres destacados que rotan por semana. |
| 03 | Cómo se monta | **Anclado**: cinco pasos y el ramo completándose grupo a grupo, con contador de tallos. |
| 04 | Ocasiones | Seis motivos (cumpleaños, aniversario, nacimiento, bodas, duelo, empresas) con precio desde. |
| 05 | Plantas de interior | Tabla de cuidados: luz, riego, lo que perdona y precio. |
| 06 | Talleres | Tres fechas con plazas y precio. |
| 07 | Cómo encargar | Cuatro pasos del encargo por WhatsApp y las zonas de reparto con su tarifa. |
| 08 | La tienda | Estado abierto/cerrado en vivo, horario con el día de hoy marcado, contacto, notas del mostrador y mapa **solo bajo clic**. |
| — | Pie | Sello de demostración, horario, legal y créditos. |

---

## Qué hay que tocar para reskinearlo a un cliente real

1. **Datos del negocio**: el bloque `application/ld+json` del `<head>`
   (schema.org `Florist`), la sección `#tienda` y el `<footer>`. Quitar el
   sello de demostración (comentario HTML inicial, `.pie__demo`, avisos de
   `aviso-legal.html` y `privacidad.html`) y **quitar
   `<meta name="robots" content="noindex, nofollow">`**. No hay
   `aggregateRating` en el schema y no debe añadirse sin datos reales.
2. **Horario**: el array `HORARIO` de `js/main.js` (minutos desde medianoche,
   domingo = índice 0) y la tabla `#horarioCuerpo`. De ahí salen el «abierto
   ahora» y la fila resaltada.
3. **El cubo**: el array `FLORES` de `js/main.js` y la lista `.cubo__lista` del
   HTML. Si cambian las especies, se dibuja el `<g>` nuevo en el `<defs>` y se
   referencia con `<use href="#flor-loquesea">`.
4. **Los pasos del montaje**: los `<li data-paso="n">` y los `<g data-paso="n">`
   del SVG comparten el número. Para añadir un paso basta con crear los dos y
   ampliar el array `TALLOS` (los tallos acumulados en cada paso).
5. **Paleta y tipografía**: todo en `:root` de `css/estilo.css` (`--hueso`,
   `--papel`, `--kraft`, `--ciruela`, `--azafran`, `--rosa`, `--salvia`) y el
   `<link>` de Google Fonts.
6. **Fotos**: `assets/fotos/`, dos anchos por foto (`-800` y `-1600`), nombres
   semánticos. Se sustituye el archivo manteniendo el nombre y se actualiza el
   `alt`.
7. **WhatsApp**: los enlaces `https://wa.me/34600000012`. Cambiar el número y
   quitar la advertencia de que es de muestra en el aviso legal.
8. **Mapa**: en `js/main.js`, la consulta del `iframe` de Google. **No quitar
   el botón**: el mapa solo debe cargarse bajo clic, o el aviso de cookies deja
   de ser cierto.

---

## Comportamiento degradado y rendimiento

- **Sin GSAP** (CDN caído o JS bloqueado) la página se ve entera: los estados
  «vacíos» viven bajo `html.has-motion`, clase que solo se enciende cuando
  existen `gsap` y `ScrollTrigger`. Comprobado abortando el CDN: el ramo del
  hero sale montado, los cinco pasos se leen como lista y el contador marca 13.
- **`prefers-reduced-motion: reduce`**: se apaga el movimiento, no el
  contenido. Los destacados de la semana, el estado de apertura y el contador
  siguen calculándose.
- Las apariciones y las máscaras de imagen son **transición CSS + una clase**
  que pone un `IntersectionObserver`; GSAP se reserva para titulares, intro,
  cinta, imán y anclaje. (Dos razones: un `ScrollTrigger` con `once:true` puede
  no disparar si el elemento ya está en pantalla, y dos tweens sobre el mismo
  `clip-path` se pisan.)
- **Tareas largas medidas** con `PerformanceObserver` (`longtask`): en la
  verificación local, **una sola tarea larga de ~108 ms** durante la carga,
  atribuible a GSAP + la webfont, y ninguna después. La medida se imprime en
  consola a los 10 s (`[Ramalleira] tareas largas…`) y queda en
  `window.__tareasLargas`.
- Accesibilidad: contraste AA sobre la paleta, foco visible, saltar al
  contenido, tabla de horario con `<th scope>`, `alt` con sentido, y el
  titular partido en letras conserva su `aria-label` sin partir.

---

## Créditos

- Fotografías: Pexels, licencia libre, acreditadas en
  [`CREDITOS.md`](CREDITOS.md). Ninguna retrata la tienda descrita, que no
  existe, y no aparecen menores.
- Flores, logotipo, dibujo del mapa y `og:image`: hechos para esta plantilla.
- Tipografías: [Gloock](https://fonts.google.com/specimen/Gloock) y
  [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk) (OFL).
- Movimiento: [GSAP](https://gsap.com) + ScrollTrigger y
  [Lenis](https://github.com/darkroomengineering/lenis), por CDN.

## Decisiones tomadas

- **Nombre comprobado antes de fijarlo**: no aparece ninguna floristería
  llamada «Ramalleira». Se descartó «Gavela» porque existe una floristería real
  con ese nombre.
- **Dirección genérica** en un municipio real (Betanzos) y mapa que apunta al
  municipio, nunca a un portal.
- **Teléfonos de muestra** (`981 00 00 12`, `600 00 00 12`) y correo en el
  dominio reservado `.example`.
- **Sin carrito ni pasarela de pago**: una floristería de barrio de este tamaño
  vende por WhatsApp, y fingir una tienda en línea en una demo sería vender
  humo. Los encargos se explican paso a paso.
- **Se descartó una foto de archivo** de cubos con tulipanes porque llevaba un
  cartel de precio en alemán, visible y contradictorio con el negocio ficticio.
- **Duelo tratado con sobriedad**: es la mitad del negocio de una floristería y
  no aparecía en ninguna plantilla de la biblioteca; se cuenta sin eufemismos y
  sin imágenes.
