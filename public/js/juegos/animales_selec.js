/* ══════════════════ JUEGO 9: ANIMALES (selección) ══════════════════ */

(function(){
  // "gen" = artículo correcto en español (el / la)
  const ANIMALES = [
    { es:'PERRO',   en:'DOG',      emoji:'🐶', gen:'el' },
    { es:'GATO',    en:'CAT',      emoji:'🐱', gen:'el' },
    { es:'VACA',    en:'COW',      emoji:'🐮', gen:'la' },
    { es:'PATO',    en:'DUCK',     emoji:'🦆', gen:'el' },
    { es:'PEZ',     en:'FISH',     emoji:'🐟', gen:'el' },
    { es:'OSO',     en:'BEAR',     emoji:'🐻', gen:'el' },
    { es:'RANA',    en:'FROG',     emoji:'🐸', gen:'la' },
    { es:'PÁJARO',  en:'BIRD',     emoji:'🐦', gen:'el' },
    { es:'LEÓN',    en:'LION',     emoji:'🦁', gen:'el' },
    { es:'TIGRE',   en:'TIGER',    emoji:'🐯', gen:'el' },
    { es:'MONO',    en:'MONKEY',   emoji:'🐵', gen:'el' },
    { es:'ZORRO',   en:'FOX',      emoji:'🦊', gen:'el' },
    { es:'LOBO',    en:'WOLF',     emoji:'🐺', gen:'el' },
    { es:'OVEJA',   en:'SHEEP',    emoji:'🐑', gen:'la' },
    { es:'CABRA',   en:'GOAT',     emoji:'🐐', gen:'la' },
    { es:'CABALLO', en:'HORSE',    emoji:'🐴', gen:'el' },
    { es:'CONEJO',  en:'RABBIT',   emoji:'🐰', gen:'el' },
    { es:'TORTUGA', en:'TURTLE',   emoji:'🐢', gen:'la' },
    { es:'ABEJA',   en:'BEE',      emoji:'🐝', gen:'la' },
    { es:'MARIPOSA',en:'BUTTERFLY',emoji:'🦋', gen:'la' }
  ];

  const RONDAS = 8;
  let st = null;

  const juego = {
    id:'animales_selec', emoji:'🦁', nombre:'ANIMALES',
    descripcion:'Toca el animal que te piden',
    edad:'3-5 años',
    iniciar(cont, api){
      cont.innerHTML = `
        <p class="instruccion" id="inst"></p>
        <div class="opciones" id="opciones"></div>
      `;
      st = { ronda:0, aciertos:0, api };
      const $ = id => document.getElementById(id);

      function ronda(){
        if (st.ronda >= RONDAS){
          window.melodia([523,659,784,1047]);
          api.sumarPuntos(st.aciertos * 5);
          api.fin(api.puntosActuales());
          return;
        }
        st.ronda++;
        st.bloqueado = false;

        const elegidos = window.elegirN(ANIMALES, 4);
        const objetivo = elegidos[Math.floor(Math.random()*4)];
        st.objetivo = objetivo;

        // Instrucción con el artículo correcto (EL / LA)
        $('inst').innerHTML =
          `TOCA ${objetivo.gen.toUpperCase()} <span style="color:#22d3ee">${objetivo.es}</span>` +
          `<span class="en">TOUCH THE ${objetivo.en}</span>`;

        // Voz bilingüe con el artículo correcto
        window.decirBilingue(
          'Toca ' + objetivo.gen + ' ' + objetivo.es.toLowerCase(),
          'Touch the ' + objetivo.en.toLowerCase()
        );

        const cont_op = $('opciones');
        cont_op.className = 'opciones';
        cont_op.innerHTML = '';
        window.barajar(elegidos).forEach(p => {
          const b = document.createElement('button');
          b.className = 'opcion';
          b.innerHTML = `
            <span class="emoji">${p.emoji}</span>
            <span class="texto">${p.es}</span>
            <span class="texto-en">${p.en}</span>
          `;
          b.addEventListener('click', () => responder(b, p));
          cont_op.appendChild(b);
        });
      }

      function responder(btn, p){
        if (st.bloqueado) return;
        st.bloqueado = true;
        if (p.es === st.objetivo.es){
          btn.classList.add('ok');
          window.tono(880,0.15,'triangle');
          setTimeout(() => window.tono(1100,0.15,'triangle'), 130);
          window.decirBilingue(
            '¡Muy bien! ' + p.es.toLowerCase(),
            'Well done! ' + p.en.toLowerCase()
          );
          st.aciertos++;
          setTimeout(ronda, 1200);
        } else {
          btn.classList.add('mal');
          window.tono(200,0.3,'sawtooth');
          window.decir('Inténtalo otra vez');
          setTimeout(() => {
            btn.classList.remove('mal');
            st.bloqueado = false;
          }, 700);
        }
      }

      ronda();
    }
  };

  window.JUEGOS = window.JUEGOS || {};
  window.JUEGOS.animales_selec = juego;
})();