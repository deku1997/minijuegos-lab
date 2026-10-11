/* ══════════════════ JUEGO 2: PALABRAS (ES/EN) ══════════════════ */

(function(){
  const PALABRAS = [
    { es:'ROJO',     en:'RED',      emoji:'🔴' },
    { es:'AZUL',     en:'BLUE',     emoji:'🔵' },
    { es:'VERDE',    en:'GREEN',    emoji:'🟢' },
    { es:'AMARILLO', en:'YELLOW',   emoji:'🟡' },
    { es:'NARANJA',  en:'ORANGE',   emoji:'🟠' },
    { es:'MORADO',   en:'PURPLE',   emoji:'🟣' },
    { es:'ROSA',     en:'PINK',     emoji:'🐱' },
    { es:'CAFÉ',     en:'BROWN',    emoji:'🟤' },
    { es:'LÁPIZ',    en:'PENCIL',   emoji:'✏️' },
    { es:'LIBRO',    en:'BOOK',     emoji:'📚' },
    { es:'MOCHILA',  en:'BACKPACK', emoji:'🎒' },
    { es:'TIJERAS',  en:'SCISSORS', emoji:'✂️' },
    { es:'REGLA',    en:'RULER',    emoji:'📏' },
    { es:'CRAYÓN',   en:'CRAYON',   emoji:'🖍️' },
    { es:'PINCEL',   en:'BRUSH',    emoji:'🖌️' },
    { es:'PEGAMENTO',en:'GLUE',     emoji:'🧴' }
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

        $('inst').innerHTML =
          `TOCA EL <span style="color:#22d3ee">${objetivo.es}</span>` +
          `<span class="en">TOUCH THE ${objetivo.en}</span>`;
        window.decir('Toca el ' + objetivo.es + '. Touch the ' + objetivo.en);

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