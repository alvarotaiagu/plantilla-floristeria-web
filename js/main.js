/* ============================================================
   Ramalleira — main.js
   Concepto «Ramo»: la página se monta como se monta un ramo.
   Sin framework. GSAP + ScrollTrigger + Lenis por CDN.

   Dos reglas que vienen de trampas ya pagadas:
   · Todo lo de «una sola vez» (titulares, apariciones, máscaras,
     contadores) va con IntersectionObserver. Un ScrollTrigger con
     once:true puede no disparar si el elemento ya está en pantalla.
   · El estado «vacío» del char-reveal está en CSS como translateY(%),
     y GSAP lo lee como píxeles: se anima `y: 0`, nunca `yPercent`.
   ============================================================ */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsapListo = !!(window.gsap && window.ScrollTrigger);
  var movimiento = gsapListo && !reduce;

  if (gsapListo) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: 'power3.out' });
  }
  if (movimiento) raiz.classList.add('has-motion');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. Lenis ---------- */

  var lenis = null;
  if (movimiento && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var destino = document.querySelector(id);
      if (!destino) return;
      e.preventDefault();
      cerrarMenu();
      if (lenis) lenis.scrollTo(destino, { offset: -70 });
      else destino.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      destino.setAttribute('tabindex', '-1');
      destino.focus({ preventScroll: true });
    });
  });

  /* ---------- 2. Cabecera y menú ---------- */

  var cabecera = $('#cabecera');
  var nav = $('#nav');
  var boton = $('#hamburguesa');

  function alScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    cabecera.classList.toggle('cabecera--posada', y > 120);
  }
  window.addEventListener('scroll', alScroll, { passive: true });
  alScroll();

  function cerrarMenu() {
    if (!nav.classList.contains('nav--abierto')) return;
    nav.classList.remove('nav--abierto');
    boton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-abierto');
    if (lenis) lenis.start();
  }

  boton.addEventListener('click', function () {
    var abierto = nav.classList.toggle('nav--abierto');
    boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    document.body.classList.toggle('menu-abierto', abierto);
    if (lenis) { abierto ? lenis.stop() : lenis.start(); }
    if (abierto) { var primero = nav.querySelector('a'); if (primero) primero.focus(); }
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });

  /* ---------- 3. Cookies ---------- */

  var banner = $('#cookieBanner');
  var CLAVE = 'ramalleira-cookies-v1';
  try { if (!localStorage.getItem(CLAVE)) banner.hidden = false; }
  catch (e) { banner.hidden = false; }

  $('#cookieAceptar').addEventListener('click', function () {
    banner.hidden = true;
    try { localStorage.setItem(CLAVE, 'visto'); } catch (e) {}
  });

  /* ---------- 4. Mapa solo bajo clic ---------- */

  var mapaBoton = $('#mapaBoton');
  if (mapaBoton) {
    mapaBoton.addEventListener('click', function () {
      var caja = $('.tienda__mapa');
      var marco = document.createElement('iframe');
      marco.src = 'https://www.google.com/maps?q=Betanzos%2C%20A%20Coru%C3%B1a&output=embed';
      marco.title = 'Mapa de Betanzos (A Coruña)';
      marco.loading = 'lazy';
      marco.referrerPolicy = 'no-referrer-when-downgrade';
      marco.setAttribute('allowfullscreen', '');
      caja.innerHTML = '';
      caja.appendChild(marco);
      var pie = document.createElement('p');
      pie.className = 'mostrador__aviso';
      pie.style.marginTop = '.6rem';
      pie.textContent = 'El mapa apunta al municipio, no a un portal concreto: la tienda es ficticia.';
      caja.appendChild(pie);
      if (gsapListo) ScrollTrigger.refresh();
    });
  }

  /* ---------- 5. Una sola vez: IntersectionObserver ---------- */

  function alEntrar(el, fn, margen) {
    if (!('IntersectionObserver' in window)) { fn(el); return; }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        io.unobserve(entrada.target);
        fn(entrada.target);
      });
    }, { rootMargin: margen || '0px 0px -12% 0px', threshold: 0.01 });
    io.observe(el);
  }

  /* ---------- 6. Char-reveal ---------- */

  function partirTitular(el) {
    var texto = el.textContent.trim();
    el.setAttribute('aria-label', texto);
    var palabras = texto.split(/\s+/);
    el.textContent = '';
    palabras.forEach(function (palabra, i) {
      var caja = document.createElement('span');
      caja.className = 'palabra';
      caja.setAttribute('aria-hidden', 'true');
      palabra.split('').forEach(function (letra) {
        var s = document.createElement('span');
        s.className = 'letra';
        s.textContent = letra;
        caja.appendChild(s);
      });
      el.appendChild(caja);
      if (i < palabras.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return $$('.letra', el);
  }

  var letrasHero = [];
  if (movimiento) {
    $$('[data-reveal]').forEach(function (el) {
      var letras = partirTitular(el);
      if (el.classList.contains('hero__titular')) { letrasHero = letras; return; }
      alEntrar(el, function () {
        // y: 0 en píxeles — el estado de partida viene del CSS en %
        gsap.to(letras, { y: 0, duration: .9, ease: 'power4.out', stagger: .014 });
      });
    });
  }

  /* ---------- 7. Apariciones y máscaras ---------- */

  if (movimiento) {
    $$('.tallo, .ocasion, .talleres__lista li, .encargar__pasos li, .reparto li, .tabla-plantas tbody tr, .mostrador, .cubo__destacados, .hero__datos, .estado, .horario')
      .forEach(function (el) {
        el.classList.add('aparece');
        alEntrar(el, function (t) {
          gsap.to(t, { opacity: 1, y: 0, duration: .8 });
        });
      });

    $$('[data-mascara] img').forEach(function (img) {
      alEntrar(img, function (t) {
        gsap.to(t, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut' });
      });
    });
  }

  /* ---------- 8. El cubo de esta semana (contenido que rota) ---------- */

  var FLORES = [
    { n: 'Ranúnculo', p: '2,80 € el tallo', nota: 'de octubre a mayo, abre en casa cuatro días' },
    { n: 'Rosa de tallo largo', p: '3,20 € el tallo', nota: 'roja, coral o blanca' },
    { n: 'Tulipán', p: '1,90 € el tallo', nota: 'sigue creciendo dentro del jarrón' },
    { n: 'Clavel', p: '1,40 € el tallo', nota: 'quince días si le cambias el agua' },
    { n: 'Paniculata', p: '5,00 € el manojo', nota: 'seca muy bien colgada boca abajo' },
    { n: 'Eucalipto cinerea', p: '2,20 € la rama', nota: 'huele a mesa recién puesta' },
    { n: 'Espiga y avena', p: '1,60 € el tallo', nota: 'aguanta el invierno entero' },
    { n: 'Helecho de monte', p: '1,20 € la rama', nota: 'cortado en la finca de Requián' },
    { n: 'Lisianthus', p: '3,80 € el tallo', nota: 'parece una rosa y dura más' },
    { n: 'Hortensia', p: '4,50 € el tallo', nota: 'de julio a octubre, del país' }
  ];

  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function semanaDelAno(fecha) {
    var d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    var dia = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dia);
    var inicio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - inicio) / 86400000) + 1) / 7);
  }

  function pintaCubo() {
    var lista = $('#cuboDestacados');
    var etiqueta = $('#cuboSemana');
    if (!lista) return;
    var hoy = new Date();
    var semana = semanaDelAno(hoy);

    var lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    var sabado = new Date(lunes);
    sabado.setDate(lunes.getDate() + 5);
    if (etiqueta) {
      etiqueta.textContent = 'Semana del ' + lunes.getDate() + ' al ' + sabado.getDate() + ' de ' + MESES[sabado.getMonth()];
    }

    lista.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var flor = FLORES[(semana * 3 + i) % FLORES.length];
      var li = document.createElement('li');
      var b = document.createElement('b');
      b.textContent = flor.n;
      var precio = document.createElement('span');
      precio.textContent = flor.p;
      var nota = document.createElement('em');
      nota.textContent = '· ' + flor.nota;
      nota.style.fontStyle = 'normal';
      nota.style.color = 'var(--ciruela-suave)';
      nota.style.fontSize = '.88rem';
      li.appendChild(b);
      li.appendChild(precio);
      li.appendChild(nota);
      lista.appendChild(li);
    }
  }
  pintaCubo();

  /* ---------- 9. Horario en vivo ---------- */

  var HORARIO = [
    [],                                  // domingo
    [],                                  // lunes
    [[570, 810], [1020, 1200]],          // martes
    [[570, 810], [1020, 1200]],
    [[570, 810], [1020, 1200]],
    [[570, 810], [1020, 1200]],
    [[570, 870]]                         // sábado
  ];
  var NOMBRES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  function reloj(minutos) {
    var h = Math.floor(minutos / 60), m = minutos % 60;
    return h + ':' + (m < 10 ? '0' + m : m);
  }

  function pintaEstado() {
    var caja = $('#estado');
    var texto = $('#estadoTexto');
    if (!caja || !texto) return;
    var ahora = new Date();
    var dia = ahora.getDay();
    var minuto = ahora.getHours() * 60 + ahora.getMinutes();
    var tramos = HORARIO[dia];
    var abierto = false, cierre = 0, proximo = null;

    tramos.forEach(function (t) {
      if (minuto >= t[0] && minuto < t[1]) { abierto = true; cierre = t[1]; }
      if (!abierto && minuto < t[0] && proximo === null) proximo = t[0];
    });

    caja.classList.toggle('estado--abierto', abierto);
    caja.classList.toggle('estado--cerrado', !abierto);

    if (abierto) {
      texto.textContent = 'Abierto ahora · cerramos a las ' + reloj(cierre);
    } else if (proximo !== null) {
      texto.textContent = 'Cerrado ahora · abrimos hoy a las ' + reloj(proximo);
    } else {
      var d = dia, vueltas = 0;
      do { d = (d + 1) % 7; vueltas++; } while (HORARIO[d].length === 0 && vueltas < 7);
      texto.textContent = 'Cerrado · abrimos el ' + NOMBRES[d] + ' a las ' + reloj(HORARIO[d][0][0]);
    }

    var filas = $$('#horarioCuerpo tr');
    var indice = (dia + 6) % 7; // la tabla empieza en lunes
    filas.forEach(function (fila, i) { fila.classList.toggle('hoy', i === indice); });
  }
  pintaEstado();
  setInterval(pintaEstado, 60000);

  /* ---------- 10. El montaje del ramo (protagonista) ---------- */

  var TALLOS = [0, 4, 9, 13, 13, 13];

  function iniciarMontaje() {
    var anclado = $('#montajeAnclado');
    var svg = $('#ramoMontaje');
    var pasos = $$('#montajePasos li');
    var contador = $('#montajeTallos');
    if (!anclado || !svg) return;

    var grupos = $$('g[data-paso]', svg);

    function ponerPaso(n) {
      grupos.forEach(function (g) {
        g.classList.toggle('puesto', parseInt(g.dataset.paso, 10) <= n);
      });
      pasos.forEach(function (li) {
        var p = parseInt(li.dataset.paso, 10);
        li.classList.toggle('activo', p === n);
        li.classList.toggle('hecho', p < n);
      });
      if (contador) contador.textContent = TALLOS[Math.max(0, Math.min(n, 5))];
    }

    if (!movimiento) {
      // sin GSAP o con movimiento reducido: el ramo está entero y los
      // pasos se leen como una lista normal
      if (contador) contador.textContent = TALLOS[5];
      return;
    }

    anclado.parentNode.classList.add('montaje--anima');
    ponerPaso(0);

    ScrollTrigger.create({
      trigger: '.montaje',
      start: 'top top',
      end: '+=2600',
      pin: anclado,
      pinSpacing: true,
      anticipatePin: 1,
      onUpdate: function (self) {
        ponerPaso(Math.max(1, Math.min(5, Math.ceil(self.progress * 5))));
      },
      onLeaveBack: function () { ponerPaso(1); },
      onLeave: function () { ponerPaso(5); }
    });
  }

  /* ---------- 11. Cinta ---------- */

  function iniciarCinta() {
    var cinta = $('#cintaPista');
    if (!cinta || !movimiento) return;
    cinta.innerHTML = cinta.innerHTML + cinta.innerHTML;
    var mitad = cinta.scrollWidth / 2;
    var giro = gsap.to(cinta, {
      x: -mitad, duration: 24, ease: 'none', repeat: -1,
      modifiers: { x: function (x) { return (parseFloat(x) % mitad) + 'px'; } }
    });
    ScrollTrigger.create({
      trigger: '.cinta',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: function (self) {
        var v = Math.abs(self.getVelocity());
        gsap.to(giro, { timeScale: 1 + Math.min(v / 280, 6), duration: .4, overwrite: true });
        gsap.to(giro, { timeScale: 1, duration: 1.4, delay: .35, overwrite: false });
      }
    });
  }

  /* ---------- 12. Magnéticos y cursor ---------- */

  function iniciarPuntero() {
    if (!movimiento || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    $$('.magnetico').forEach(function (el) {
      var x = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3.out' });
      var y = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3.out' });
      el.addEventListener('mousemove', function (e) {
        var c = el.getBoundingClientRect();
        x((e.clientX - (c.left + c.width / 2)) * 0.3);
        y((e.clientY - (c.top + c.height / 2)) * 0.4);
      });
      el.addEventListener('mouseleave', function () { x(0); y(0); });
      el.addEventListener('blur', function () { x(0); y(0); });
    });

    var cursor = $('#cursor');
    var texto = $('#cursorTexto');
    if (!cursor) return;
    var cx = gsap.quickTo(cursor, 'x', { duration: .32, ease: 'power3.out' });
    var cy = gsap.quickTo(cursor, 'y', { duration: .32, ease: 'power3.out' });
    window.addEventListener('mousemove', function (e) { cx(e.clientX); cy(e.clientY); });

    [
      { sel: '.hero__foto, .ocasiones__foto, .plantas__foto, .talleres__foto, .tienda__foto, .encargar__foto', t: 'mirar' },
      { sel: '.tallo', t: 'al ramo' },
      { sel: '.mapa-consent', t: 'mapa' },
      { sel: '.ramo', t: 'a mano' }
    ].forEach(function (z) {
      $$(z.sel).forEach(function (el) {
        el.addEventListener('mouseenter', function () { cursor.classList.add('cursor--grande'); texto.textContent = z.t; });
        el.addEventListener('mouseleave', function () { cursor.classList.remove('cursor--grande'); texto.textContent = ''; });
      });
    });
  }

  /* ---------- 13. Preloader e intro ---------- */

  function intro() {
    var preloader = $('#preloader');

    if (!movimiento) {
      if (preloader) preloader.remove();
      return;
    }

    var tl = gsap.timeline();
    if (preloader) {
      tl.to('.preloader__marca path[pathLength]', { strokeDashoffset: 0, duration: .8, ease: 'power2.inOut' })
        .to('.preloader__flor', { scale: 1, duration: .6, ease: 'back.out(2)' }, '-=.25')
        .to('.preloader__palabra', { opacity: 1, duration: .45 }, '-=.35')
        .to(preloader, {
          yPercent: -100, duration: .85, ease: 'power3.inOut',
          onComplete: function () { preloader.remove(); if (gsapListo) ScrollTrigger.refresh(); }
        }, '+=.15');
    }

    // el ramo del hero se monta: primero el papel, luego verde, flores, relleno y lazo
    var grupos = $$('#ramoHero > g');
    tl.to(grupos, { opacity: 1, duration: .55, stagger: .16 }, '-=.5')
      .to(letrasHero, { y: 0, duration: 1, ease: 'power4.out', stagger: .012 }, '-=.9')
      .to('.hero__sobre', { opacity: 1, duration: .5 }, '-=.9')
      .to('.hero__entrada', { opacity: 1, duration: .6 }, '-=.6')
      .to('.hero__acciones', { opacity: 1, duration: .6 }, '-=.45')
      .to('.hero__datos', { opacity: 1, duration: .6 }, '-=.4');

    // red de seguridad: si algo falla, ni el preloader se queda puesto ni el
    // hero se queda invisible
    setTimeout(function () {
      var p = $('#preloader');
      if (p) p.remove();
      gsap.set($$('#ramoHero > g'), { opacity: 1 });
      gsap.set([letrasHero, '.hero__sobre', '.hero__entrada', '.hero__acciones', '.hero__datos'], { opacity: 1, y: 0 });
    }, 4600);
  }

  /* ---------- 14. Medida de tareas largas (§7 del pliego) ---------- */

  (function medirTareasLargas() {
    if (!('PerformanceObserver' in window)) return;
    var largas = [];
    try {
      var po = new PerformanceObserver(function (lista) {
        lista.getEntries().forEach(function (e) { largas.push(Math.round(e.duration)); });
      });
      po.observe({ type: 'longtask', buffered: true });
      window.__tareasLargas = largas;
      setTimeout(function () {
        if (largas.length) {
          console.info('[Ramalleira] tareas largas en los primeros 10 s:', largas.join(' ms, ') + ' ms');
        } else {
          console.info('[Ramalleira] ninguna tarea larga en los primeros 10 s');
        }
      }, 10000);
    } catch (e) { /* el navegador no lo soporta */ }
  })();

  /* ---------- 15. Arranque ---------- */

  iniciarMontaje();
  iniciarCinta();
  iniciarPuntero();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      intro();
      if (gsapListo) ScrollTrigger.refresh();
    });
  } else {
    intro();
  }

  window.addEventListener('load', function () { if (gsapListo) ScrollTrigger.refresh(); });

})();
