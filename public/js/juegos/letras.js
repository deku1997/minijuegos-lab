/* ══════════════════ JUEGO 8: LETRAS ABC ══════════════════ */

(function(){
  const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const NOMBRE_ES = {
    'A':'a','B':'be','C':'ce','D':'de','E':'e','F':'efe','G':'ge','H':'hache',
    'I':'i','J':'jota','K':'ka','L':'ele','M':'eme','N':'ene','O':'o',
    'P':'pe','Q':'cu','R':'erre','S':'ese','T':'te','U':'u','V':'uve','W':'doble uve',
    'X':'equis','Y':'i griega','Z':'zeta'
  };
  const NOMBRE_EN = {
    'A':'ay','B':'bee','C':'see','D':'dee','E':'ee','F':'ef','G':'gee','H':'aitch',
    'I':'eye','J':'jay','K':'kay','L':'el','M':'em','N':'en','O':'oh','P':'pee',
    'Q':'cue','R':'ar','S':'ess','T':'tee','U':'you','V':'vee','W':'double you',
    'X':'ex','Y':'why','Z':'zee'
  };

  const RONDAS = 8;
  let st = null;

  const juego = {
    id:'letras', emoji:'🔤', nombre:'LETRAS ABC',
    descripcion:'Toca la letra que te piden',
    edad:'3-5 años',
    iniciar(cont, api){

      // Estilos específicos
      if (!document.getElementById('estilo-letras')) {
        const s = document.createElement('style');
        s.id = 'estilo-letras';
        s.textContent = `
          .letras-grid {
            flex:1; display:grid; gap:10px;
            grid-template-columns:repeat(3, 1fr);
            grid-template-rows:repeat(2, 1fr);
            min-height:0; padding:4px;
          }
          .letra-carta {
            display:flex; align-items:center; justify-content:center;
            font-family:'Orbitron', sans-serif;
            font-size:clamp(44px, 16vw, 90px);
            font-weight:900;
            color:#22d3ee;
            text-shadow:0 0 20px rgba(34,211,238,.6);
            background:rgba(30,41,59,.85);
            border:3px solid rgba(34,211,238,.3);
            border-radius:20px;
            cursor:pointer;
            box-shadow:0 5px 0 rgba(0,0,0,.4);
            transition:transform .1s, box-shadow .1s, border-color .2s;
            padding:0;
          }
          .letra-carta:active {
            transform:translateY(4px);
            box-shadow:0 1px 0 rgba(0,0,0,.4);
          }
          .letra-carta:hover {
            border-color:rgba(34,211,238,.6);
          }
          .letra-carta.ok {
            background:rgba(163,230,53,.15);
            border-color:#a3e635;
            color:#a3e635;
            box-shadow:0 0 25px rgba(163,230,53,.4);
            animation:popOK .35s;
          }
          .letra-carta.mal {
            background:rgba(248,113,113,.15);
            border-color:#f87171;
            color:#f87171;
            animation:temblar .35s;
          }
        `;
        document.head.appendChild(s);
      }

      cont.innerHTML = `
        <p class="instruccion" id="inst"></p>
        <div class="letras-grid" id="grid"></div>
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

        const opciones = window.elegirN(ALFABETO, 6);
        const objetivo = opciones[Math.floor(Math.random()*opciones.length)];
        st.objetivo = objetivo;

        $('inst').innerHTML =
          `TOCA LA LETRA <span style="color:#22d3ee">${objetivo}</span>` +
          `<span class="en">TOUCH THE LETTER ${objetivo}</span>`;

        window.decirBilingue(
          'Toca la letra ' + (NOMBRE_ES[objetivo] || objetivo),
          'Touch the letter ' + (NOMBRE_EN[objetivo] || objetivo)
        );

        const grid = $('grid');
        grid.innerHTML = '';
        window.barajar(opciones).forEach(l => {
          const b = document.createElement('button');
          b.className = 'letra-carta';
          b.textContent = l;
          b.addEventListener('click', () => responder(b, l));
          grid.appendChild(b);
        });
      }

      function responder(btn, letra){
        if (st.bloqueado) return;
        st.bloqueado = true;
        if (letra === st.objetivo){
          btn.classList.add('ok');
          window.melodia([880, 1100]);
          window.decirBilingue('¡Muy bien!', 'Well done!');
          st.aciertos++;
          setTimeout(ronda, 1100);
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
  window.JUEGOS.letras = juego;
})();