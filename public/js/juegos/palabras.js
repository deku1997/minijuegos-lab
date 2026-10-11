/* ══════════════════ JUEGO 2: PALABRAS (ES/EN) ══════════════════ */

(function(){
  // "gen" = género del artículo en español (el / la / las)
  const PALABRAS = [
    { es:'ROJO',      en:'RED',      emoji:'🔴', gen:'el'  },
    { es:'AZUL',      en:'BLUE',     emoji:'🔵', gen:'el'  },
    { es:'VERDE',     en:'GREEN',    emoji:'🟢', gen:'el'  },
    { es:'AMARILLO',  en:'YELLOW',   emoji:'🟡', gen:'el'  },
    { es:'NARANJA',   en:'ORANGE',   emoji:'🟠', gen:'el'  },
    { es:'MORADO',    en:'PURPLE',   emoji:'🟣', gen:'el'  },
    { es:'ROSA',      en:'PINK',     emoji:'🐱', gen:'el'  },
    { es:'CAFÉ',      en:'BROWN',    emoji:'🟤', gen:'el'  },
    { es:'LÁPIZ',     en:'PENCIL',   emoji:'✏️', gen:'el'  },
    { es:'LIBRO',     en:'BOOK',     emoji:'📚', gen:'el'  },
    { es:'MOCHILA',   en:'BACKPACK', emoji:'🎒', gen:'la'  },
    { es:'TIJERAS',   en:'SCISSORS', emoji:'✂️', gen:'las' },
    { es:'REGLA',     en:'RULER',    emoji:'📏', gen:'la'  },
    { es:'CRAYÓN',    en:'CRAYON',   emoji:'🖍️', gen:'el'  },
    { es:'PINCEL',    en:'BRUSH',    emoji:'🖌️', gen:'el'  },
    { es:'PEGAMENTO', en:'GLUE',     emoji:'🧴', gen:'el'  }
  ];
  const RONDAS = 6;

  let st = null;

  const juego = {
    id:'palabras', emoji:'🎨', nombre:'PALABRAS',
    descripcion:'Toca el objeto correcto en español e inglés',
    edad:'4-5 años',
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
          window.decir('¡Terminaste!');
          const bonus = st.aciertos * 5;
          api.sumarPuntos(bonus);
          api.fin(api.puntosActuales());
          return;
        }
        st.ronda++;

        const elegidas = window.elegirN(PALABRAS, 4);
        const objetivo = elegidas[Math.floor(Math.random()*4)];
        st.objetivo = objetivo;

        // Instrucción con el artículo correcto
        $('inst').innerHTML =
          `TOCA ${objetivo.gen.toUpperCase()} <span style="color:#22d3ee">${objetivo.es}</span>` +
          `<span class="en">TOUCH THE ${objetivo.en}</span>`;
        window.decir('Toca ' + objetivo.gen + ' ' + objetivo.es + '. Touch the ' + objetivo.en);

        const cont_op = $('opciones');
        cont_op.className = 'opciones';
        cont_op.innerHTML = '';
        window.barajar(elegidas).forEach(p => {
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
          window.decir('¡Muy bien! ' + p.es + '. ' + p.en);
          st.aciertos++;
          setTimeout(() => {
            st.bloqueado = false;
            ronda();
          }, 900);
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
  window.JUEGOS.palabras = juego;
})();