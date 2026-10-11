/* ══════════════════ JUEGO 6: EL GRANDE (3 años) ══════════════════ */

(function(){
  const OBJETOS = ['🍎','🍌','⭐','🐶','🐱','🌸','⚽','🎈','🐟','🌞','🍓','🧸'];
  const RONDAS = 5;

  let st = null;

  const juego = {
    id:'grandes', emoji:'🔵', nombre:'EL GRANDE',
    descripcion:'Toca el objeto grande o el pequeño',
    edad:'3 años',
    iniciar(cont, api){
      if (!document.getElementById('estilo-grandes')) {
        const s = document.createElement('style');
        s.id = 'estilo-grandes';
        s.textContent = `
          .grande-wrap {
            display:flex; flex-direction:column;
            align-items:center; gap:6px;
          }
          .grande-nombre-en {
            font-family:'Orbitron',sans-serif;
            font-size:clamp(12px,3.4vw,16px);
            font-weight:900;
            color:#22d3ee;
            letter-spacing:1px;
            text-shadow:0 0 10px rgba(34,211,238,.6);
            background:rgba(30,41,59,.85);
            padding:3px 10px;
            border-radius:10px;
            border:1px solid rgba(34,211,238,.4);
          }
        `;
        document.head.appendChild(s);
      }

      cont.innerHTML = `
        <p class="instruccion" id="inst"></p>
        <div class="grandes-escena" id="escena"></div>
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

        const esContar = st.ronda >= 3 && Math.random() < 0.5;

        const e1 = OBJETOS[Math.floor(Math.random()*OBJETOS.length)];
        let e2 = OBJETOS[Math.floor(Math.random()*OBJETOS.length)];
        while (e2 === e1) e2 = OBJETOS[Math.floor(Math.random()*OBJETOS.length)];

        if (esContar){
          const grupos = window.barajar([1,2,3]);
          const objetivo = 1 + Math.floor(Math.random()*3);

          $('inst').innerHTML =
            `👆 TOCA EL GRUPO QUE TIENE <span style="color:#22d3ee">${objetivo}</span>` +
            `<span class="en">Touch the group with ${objetivo}</span>`;

          window.decirBilingue(
            'Toca el grupo que tiene ' + objetivo,
            'Touch the group with ' + objetivo
          );

          const esc = $('escena');
          esc.innerHTML = '';
          grupos.forEach(n => {
            const wrap = document.createElement('div');
            wrap.className = 'grande-wrap';

            const b = document.createElement('button');
            b.className = 'objeto-grande';
            b.innerHTML = Array.from({length:n}).map(() =>
              `<span class="emoji-grande" style="font-size:clamp(24px,8vw,44px)">${e1}</span>`
            ).join('');
            b.addEventListener('click', () => responder(b, n, objetivo, '¡Muy bien! Tiene ' + objetivo));

            wrap.appendChild(b);
            esc.appendChild(wrap);
          });
        } else {
          const pedirGrande = Math.random() < 0.5;

          $('inst').innerHTML = pedirGrande
            ? `👆 TOCA EL <span style="color:#22d3ee">GRANDE</span>` +
              `<span class="en">Touch the BIG one</span>`
            : `👆 TOCA EL <span style="color:#22d3ee">PEQUEÑO</span>` +
              `<span class="en">Touch the SMALL one</span>`;

          window.decirBilingue(
            pedirGrande ? 'Toca el grande' : 'Toca el pequeño',
            pedirGrande ? 'Touch the big one' : 'Touch the small one'
          );

          const grande  = 'clamp(72px,28vw,140px)';
          const pequeno = 'clamp(38px,14vw,72px)';

          const esc = $('escena');
          esc.innerHTML = '';
          const items = window.barajar([
            { emoji:e1, size:grande,  esGrande:true  },
            { emoji:e2, size:pequeno, esGrande:false }
          ]);
          items.forEach(it => {
            const wrap = document.createElement('div');
            wrap.className = 'grande-wrap';

            const b = document.createElement('button');
            b.className = 'objeto-grande';
            b.innerHTML = `<span class="emoji-grande" style="font-size:${it.size}">${it.emoji}</span>`;
            b.addEventListener('click', () => {
              const acierto = (pedirGrande === it.esGrande);
              responder(b, acierto, true,
                pedirGrande ? '¡Ese es el grande!' : '¡Ese es el pequeño!');
            });

            // Etiqueta BIG / SMALL debajo
            const lbl = document.createElement('div');
            lbl.className = 'grande-nombre-en';
            lbl.textContent = it.esGrande ? 'BIG' : 'SMALL';

            wrap.appendChild(b);
            wrap.appendChild(lbl);
            esc.appendChild(wrap);
          });
        }
      }

      function responder(btn, valor, correcto, msgOK){
        if (st.bloqueado) return;
        st.bloqueado = true;
        if (valor === correcto){
          btn.classList.add('ok');
          window.melodia([880,1100]);
          window.decir(msgOK);
          st.aciertos++;
          setTimeout(() => { st.bloqueado = false; ronda(); }, 950);
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
  window.JUEGOS.grandes = juego;
})();