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

        // Decidir si la ronda es de TAMAÑO o de CONTAR
        const esContar = st.ronda >= 3 && Math.random() < 0.5;

        const e1 = OBJETOS[Math.floor(Math.random()*OBJETOS.length)];
        let e2 = OBJETOS[Math.floor(Math.random()*OBJETOS.length)];
        while (e2 === e1) e2 = OBJETOS[Math.floor(Math.random()*OBJETOS.length)];

        if (esContar){
          // 3 grupos con 1, 2 o 3 objetos
          const grupos = window.barajar([1,2,3]);
          const objetivo = 1 + Math.floor(Math.random()*3);
          $('inst').innerHTML =
            `👆 TOCA EL GRUPO QUE TIENE <span style="color:var(--morado)">${objetivo}</span>`;
          window.decir('Toca el grupo que tiene ' + objetivo);

          const esc = $('escena');
          esc.innerHTML = '';
          grupos.forEach(n => {
            const b = document.createElement('button');
            b.className = 'objeto-grande';
            b.innerHTML = Array.from({length:n}).map(() =>
              `<span class="emoji-grande" style="font-size:clamp(24px,8vw,44px)">${e1}</span>`
            ).join('');
            b.addEventListener('click', () => responder(b, n, objetivo, '¡Muy bien! Tiene ' + objetivo));
            esc.appendChild(b);
          });
        } else {
          // 2 objetos: uno grande y uno pequeño
          const pedirGrande = Math.random() < 0.5;
          $('inst').innerHTML =
            pedirGrande
              ? `👆 TOCA EL <span style="color:var(--morado)">GRANDE</span>`
              : `👆 TOCA EL <span style="color:var(--morado)">PEQUEÑO</span>`;
          window.decir(pedirGrande ? 'Toca el grande' : 'Toca el pequeño');

          const grande   = 'clamp(72px,28vw,140px)';
          const pequeno  = 'clamp(38px,14vw,72px)';

          const esc = $('escena');
          esc.innerHTML = '';
          const items = window.barajar([
            { emoji:e1, size:grande,  esGrande:true  },
            { emoji:e2, size:pequeno, esGrande:false }
          ]);
          items.forEach(it => {
            const b = document.createElement('button');
            b.className = 'objeto-grande';
            b.innerHTML = `<span class="emoji-grande" style="font-size:${it.size}">${it.emoji}</span>`;
            b.addEventListener('click', () => {
              const acierto = (pedirGrande === it.esGrande);
              responder(b, acierto, true, pedirGrande ? '¡Ese es el grande!' : '¡Ese es el pequeño!');
            });
            esc.appendChild(b);
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