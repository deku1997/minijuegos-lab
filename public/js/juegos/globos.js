/* ══════════════════ JUEGO 5: GLOBOS ══════════════════ */

(function(){
  const COLORES = [
    { nombre:'ROJO',     clase:'rojo'    },
    { nombre:'AZUL',     clase:'azul'    },
    { nombre:'AMARILLO', clase:'amarillo'},
    { nombre:'VERDE',    clase:'verde'   },
    { nombre:'MORADO',   clase:'morado'  },
    { nombre:'NARANJA',  clase:'naranja' }
  ];
  const RONDAS = 5;

  let st = null;

  const juego = {
    id:'globos', emoji:'🎈', nombre:'GLOBOS',
    descripcion:'Toca el globo del color que te piden',
    edad:'3 años',
    iniciar(cont, api){
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
          `🎈 TOCA EL GLOBO <span style="color:var(--morado)">${objetivo.nombre}</span>`;
        window.decir('Toca el globo ' + objetivo.nombre);

        const esc = $('escena');
        esc.innerHTML = '';
        window.barajar(tres).forEach(c => {
          const b = document.createElement('button');
          b.className = 'globo ' + c.clase;
          b.textContent = '🎈';
          b.addEventListener('click', () => responder(b, c, objetivo));
          esc.appendChild(b);
        });
      }

      function responder(btn, color, objetivo){
        if (st.bloqueado) return;
        st.bloqueado = true;
        if (color.nombre === objetivo.nombre){
          btn.classList.add('pop');
          window.tono(1000,0.15,'triangle');
          setTimeout(() => window.tono(1400,0.15,'triangle'), 100);
          window.decir('¡Muy bien! Es ' + color.nombre);
          st.aciertos++;
          setTimeout(() => { st.bloqueado = false; ronda(); }, 900);
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