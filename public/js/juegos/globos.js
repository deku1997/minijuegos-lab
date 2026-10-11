/* ══════════════════ JUEGO 5: GLOBOS ══════════════════ */

(function(){
  const COLORES = [
    { nombre:'ROJO',     en:'RED',    clase:'rojo'    },
    { nombre:'AZUL',     en:'BLUE',   clase:'azul'    },
    { nombre:'AMARILLO', en:'YELLOW', clase:'amarillo'},
    { nombre:'VERDE',    en:'GREEN',  clase:'verde'   },
    { nombre:'MORADO',   en:'PURPLE', clase:'morado'  },
    { nombre:'NARANJA',  en:'ORANGE', clase:'naranja' }
  ];
  const RONDAS = 5;

  let st = null;

  const juego = {
    id:'globos', emoji:'🎈', nombre:'GLOBOS',
    descripcion:'Toca el globo del color que te piden',
    edad:'3 años',
    iniciar(cont, api){
      if (!document.getElementById('estilo-globos')) {
        const s = document.createElement('style');
        s.id = 'estilo-globos';
        s.textContent = `
          .globo-wrap {
            display:flex; flex-direction:column;
            align-items:center; gap:6px;
          }
          .globo-nombre-en {
            font-family:'Orbitron',sans-serif;
            font-size:clamp(12px,3.4vw,16px);
            font-weight:900;
            color:#e879f9;
            letter-spacing:1px;
            text-shadow:0 0 10px rgba(232,121,249,.6);
            background:rgba(30,41,59,.85);
            padding:3px 10px;
            border-radius:10px;
            border:1px solid rgba(232,121,249,.4);
          }
        `;
        document.head.appendChild(s);
      }

      cont.innerHTML = `
        <p class="instruccion" id="inst">🎈 Toca el globo…</p>
        <div class="globos-escena" id="escena"></div>
      `;
      st = { ronda:0, aciertos:0, api };
      const $ = id => document.getElementById(id);

      function ronda(){
        if (st.ronda >= RONDAS){
          window.melodia([523,659,784,1047]);
          api.sumarPuntos(st.aciertos * 4);
          api.fin(api.puntosActuales());
          return;
        }
        st.ronda++;

        const tres = window.elegirN(COLORES, 3);
        const objetivo = tres[Math.floor(Math.random()*3)];

        $('inst').innerHTML =
          `🎈 TOCA EL GLOBO <span style="color:#e879f9">${objetivo.nombre}</span>` +
          `<span class="en">Touch the ${objetivo.en} balloon</span>`;

        window.decirBilingue(
          'Toca el globo ' + objetivo.nombre,
          'Touch the ' + objetivo.en + ' balloon'
        );

        const esc = $('escena');
        esc.innerHTML = '';
        window.barajar(tres).forEach(c => {
          const wrap = document.createElement('div');
          wrap.className = 'globo-wrap';

          const b = document.createElement('button');
          b.className = 'globo ' + c.clase;
          b.textContent = '🎈';
          b.addEventListener('click', () => responder(b, c, objetivo));

          const lbl = document.createElement('div');
          lbl.className = 'globo-nombre-en';
          lbl.textContent = c.en;

          wrap.appendChild(b);
          wrap.appendChild(lbl);
          esc.appendChild(wrap);
        });
      }

      function responder(btn, color, objetivo){
        if (st.bloqueado) return;
        st.bloqueado = true;
        if (color.nombre === objetivo.nombre){
          btn.classList.add('pop');
          window.tono(1000,0.15,'triangle');
          setTimeout(() => window.tono(1400,0.15,'triangle'), 100);
          window.decirBilingue(
            '¡Muy bien! Es ' + color.nombre,
            'Well done! It is ' + color.en
          );
          st.aciertos++;
          setTimeout(() => { st.bloqueado = false; ronda(); }, 1100);
        } else {
          btn.classList.add('mal');
          window.tono(200,0.3,'sawtooth');
          window.decir('Ese no es. Inténtalo');
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
  window.JUEGOS.globos = juego;
})();