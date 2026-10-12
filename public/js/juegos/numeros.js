/* ══════════════════ JUEGO 10: NÚMEROS 1-10 ══════════════════ */

(function(){
  const NUMEROS = [1,2,3,4,5,6,7,8,9,10];
  const NOMBRE_ES = {
    1:'uno', 2:'dos', 3:'tres', 4:'cuatro', 5:'cinco',
    6:'seis', 7:'siete', 8:'ocho', 9:'nueve', 10:'diez'
  };
  const NOMBRE_EN = {
    1:'one', 2:'two', 3:'three', 4:'four', 5:'five',
    6:'six', 7:'seven', 8:'eight', 9:'nine', 10:'ten'
  };
  // Colores para cada número (rotan)
  const COLORES = ['#22d3ee', '#e879f9', '#a3e635', '#fbbf24', '#f87171', '#60a5fa'];

  const RONDAS = 8;
  let st = null;

  const juego = {
    id:'numeros', emoji:'🔢', nombre:'NÚMEROS 1-10',
    descripcion:'Toca el número que te piden',
    edad:'3-5 años',
    iniciar(cont, api){

      if (!document.getElementById('estilo-numeros')) {
        const s = document.createElement('style');
        s.id = 'estilo-numeros';
        s.textContent = `
          .numeros-grid {
            flex:1; display:grid; gap:10px;
            grid-template-columns:repeat(3, 1fr);
            grid-template-rows:repeat(2, 1fr);
            min-height:0; padding:4px;
          }
          .num-carta {
            display:flex; align-items:center; justify-content:center;
            font-family:'Orbitron', sans-serif;
            font-size:clamp(48px, 18vw, 100px);
            font-weight:900;
            color:var(--num-color, #22d3ee);
            text-shadow:0 0 25px var(--num-color, #22d3ee);
            background:rgba(30,41,59,.85);
            border:3px solid var(--num-color, rgba(34,211,238,.3));
            border-radius:20px;
            cursor:pointer;
            box-shadow:0 5px 0 rgba(0,0,0,.4);
            transition:transform .1s, box-shadow .1s, border-color .2s;
            padding:0;
          }
          .num-carta:active {
            transform:translateY(4px);
            box-shadow:0 1px 0 rgba(0,0,0,.4);
          }
          .num-carta.ok {
            background:rgba(163,230,53,.2);
            border-color:#a3e635;
            color:#a3e635;
            text-shadow:0 0 25px #a3e635;
            box-shadow:0 0 30px rgba(163,230,53,.5);
            animation:popOK .35s;
          }
          .num-carta.mal {
            background:rgba(248,113,113,.2);
            border-color:#f87171;
            color:#f87171;
            text-shadow:0 0 25px #f87171;
            animation:temblar .35s;
          }
        `;
        document.head.appendChild(s);
      }

      cont.innerHTML = `
        <p class="instruccion" id="inst"></p>
        <div class="numeros-grid" id="grid"></div>
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

        const opciones = window.elegirN(NUMEROS, 6);
        const objetivo = opciones[Math.floor(Math.random()*opciones.length)];
        st.objetivo = objetivo;

        $('inst').innerHTML =
          `TOCA EL NÚMERO <span style="color:#22d3ee;font-size:1.2em">${objetivo}</span>` +
          `<span class="en">TOUCH NUMBER ${objetivo}</span>`;

        window.decirBilingue(
          'Toca el número ' + NOMBRE_ES[objetivo],
          'Touch number ' + NOMBRE_EN[objetivo]
        );

        const grid = $('grid');
        grid.innerHTML = '';
        window.barajar(opciones).forEach(n => {
          const b = document.createElement('button');
          b.className = 'num-carta';
          b.textContent = n;
          b.style.setProperty('--num-color', COLORES[n % COLORES.length]);
          b.addEventListener('click', () => responder(b, n));
          grid.appendChild(b);
        });
      }

      function responder(btn, num){
        if (st.bloqueado) return;
        st.bloqueado = true;
        if (num === st.objetivo){
          btn.classList.add('ok');
          window.melodia([880, 1100]);
          window.decirBilingue(
            '¡Muy bien! Es el ' + NOMBRE_ES[num],
            'Well done! It is ' + NOMBRE_EN[num]
          );
          st.aciertos++;
          setTimeout(ronda, 1300);
        } else {
          btn.classList.add('mal');
          window.tono(200, 0.3, 'sawtooth');
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
  window.JUEGOS.numeros = juego;
})();