/* ══════════════════ JUEGO 3: SUMA ROBOT ══════════════════ */

(function(){
  const RONDAS = 6;

  // Emojis de materiales ROBÓTICOS garantizados en Windows/Mac/Android/iOS
  const MATERIALES = ['🔧', '⚙️', '🔋', '💡', '🔌'];

  let st = null;

  const juego = {
    id:'suma', emoji:'➕', nombre:'SUMA ROBOT',
    descripcion:'El robot necesita sumar tuercas y baterías',
    edad:'4-5 años',
    iniciar(cont, api){
      cont.innerHTML = `
        <p class="instruccion" id="inst">🤖 El robot necesita contar…</p>
        <div class="suma-escena" id="escena"></div>
        <div class="suma-respuestas" id="respuestas"></div>
      `;

      // Inyectar fuente de emoji forzada para este juego
      if (!document.getElementById('estilo-suma')) {
        const s = document.createElement('style');
        s.id = 'estilo-suma';
        s.textContent = `
          .grupo-suma .items span {
            font-family: "Apple Color Emoji", "Segoe UI Emoji",
                         "Noto Color Emoji", "EmojiOne Color",
                         "Android Emoji", sans-serif !important;
            font-size: clamp(26px, 7.5vw, 40px);
            line-height: 1;
            display: inline-block;
          }
          .suma-escena .signo,
          .suma-respuestas .num-big {
            font-family: 'Orbitron', 'Baloo 2', sans-serif !important;
          }
        `;
        document.head.appendChild(s);
      }

      st = { ronda:0, aciertos:0, api };
      const $ = id => document.getElementById(id);

      function ronda(){
        if (st.ronda >= RONDAS){
          window.melodia([523,659,784,1047]);
          const bonus = st.aciertos * 5;
          api.sumarPuntos(bonus);
          api.fin(api.puntosActuales());
          return;
        }
        st.ronda++;

        // a: 1-4, b: 1-4, resultado: 2-8 (apropiado para 4-5 años)
        const a = 1 + Math.floor(Math.random() * 4);
        const b = 1 + Math.floor(Math.random() * 4);
        const res = a + b;

        const material = MATERIALES[Math.floor(Math.random() * MATERIALES.length)];

        $('inst').innerHTML =
          `🤖 El robot tiene <b style="color:#22d3ee">${a}</b> y le dan ` +
          `<b style="color:#e879f9">${b}</b> más. ¿Cuántos tiene en total?`;
        window.decir(`El robot tiene ${a} y le dan ${b} más. ¿Cuántos tiene en total?`);

        $('escena').innerHTML = `
          <div class="grupo-suma">
            <div class="items">${Array.from({length:a}, () => '<span>'+material+'</span>').join('')}</div>
            <div class="num">${a}</div>
          </div>
          <div class="signo">+</div>
          <div class="grupo-suma">
            <div class="items">${Array.from({length:b}, () => '<span>'+material+'</span>').join('')}</div>
            <div class="num">${b}</div>
          </div>
          <div class="signo">=</div>
        `;

        // 3 opciones: correcta + 2 distractores cercanos
        const opciones = new Set([res]);
        let intentos = 0;
        while (opciones.size < 3 && intentos < 30){
          intentos++;
          let n = res + (Math.floor(Math.random() * 5) - 2); // -2 a +2
          if (n < 1) n = 1 + Math.floor(Math.random() * 3);
          if (n !== res) opciones.add(n);
        }
        while (opciones.size < 3){
          opciones.add(1 + Math.floor(Math.random() * 10));
        }

        const contR = $('respuestas');
        contR.innerHTML = '';
        window.barajar([...opciones]).forEach(n => {
          const btn = document.createElement('button');
          btn.className = 'opcion';
          btn.innerHTML = `<span class="num-big">${n}</span>`;
          btn.addEventListener('click', () => responder(btn, n, res));
          contR.appendChild(btn);
        });
      }

      function responder(btn, elegido, correcto){
        if (st.bloqueado) return;
        st.bloqueado = true;
        if (elegido === correcto){
          btn.classList.add('ok');
          window.melodia([880, 1100]);
          window.decir('¡Muy bien! Son ' + correcto);
          st.aciertos++;
          setTimeout(() => { st.bloqueado = false; ronda(); }, 950);
        } else {
          btn.classList.add('mal');
          window.tono(200, 0.3, 'sawtooth');
          window.decir('Cuenta otra vez');
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
  window.JUEGOS.suma = juego;
})();