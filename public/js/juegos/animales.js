/* ══════════════════ JUEGO 4: ANIMAL LAB (Bilingüe) ══════════════════ */

(function(){
  const ANIMALES = [
    { es:'VACA',  en:'COW',    emoji:'🐮' },
    { es:'GATO',  en:'CAT',    emoji:'🐱' },
    { es:'PATO',  en:'DUCK',   emoji:'🦆' },
    { es:'PEZ',   en:'FISH',   emoji:'🐟' },
    { es:'OSO',   en:'BEAR',   emoji:'🐻' },
    { es:'PERRO', en:'DOG',    emoji:'🐶' },
    { es:'CABRA', en:'GOAT',   emoji:'🐐' },
    { es:'OVEJA', en:'SHEEP',  emoji:'🐑' },
    { es:'TIGRE', en:'TIGER',  emoji:'🐯' },
    { es:'LEÓN',  en:'LION',   emoji:'🦁' },
    { es:'RANA',  en:'FROG',   emoji:'🐸' },
    { es:'PÁJARO',en:'BIRD',   emoji:'🐦' },
    { es:'LOBO',  en:'WOLF',   emoji:'🐺' },
    { es:'ZORRO', en:'FOX',    emoji:'🦊' },
    { es:'MONO',  en:'MONKEY', emoji:'🐵' }
  ];

  const RONDAS = 8;
  const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Nombres de las letras en español e inglés para pronunciarlas correctamente
  const NOMBRE_ES = {
    'A':'a','B':'be','C':'ce','D':'de','E':'e','F':'efe','G':'ge','H':'hache',
    'I':'i','J':'jota','K':'ka','L':'ele','M':'eme','N':'ene','Ñ':'eñe','O':'o',
    'P':'pe','Q':'cu','R':'erre','S':'ese','T':'te','U':'u','V':'uve','W':'doble uve',
    'X':'equis','Y':'i griega','Z':'zeta'
  };
  const NOMBRE_EN = {
    'A':'ay','B':'bee','C':'see','D':'dee','E':'ee','F':'ef','G':'gee','H':'aitch',
    'I':'eye','J':'jay','K':'kay','L':'el','M':'em','N':'en','O':'oh','P':'pee',
    'Q':'cue','R':'ar','S':'ess','T':'tee','U':'you','V':'vee','W':'double you',
    'X':'ex','Y':'why','Z':'zee'
  };

  let st = null;

  const juego = {
    id:'animales', emoji:'🐾', nombre:'ANIMAL LAB',
    descripcion:'Completa el nombre del animal en español e inglés',
    edad:'3-5 años',
    iniciar(cont, api){
      cont.innerHTML = `
        <p class="instruccion" id="inst"></p>
        <div class="animal-escena" id="escena">
          <div class="animal-img" id="animal-img"></div>
          <div class="palabra-es" id="palabra-es"></div>
          <div class="palabra-en" id="palabra-en"></div>
          <p class="ronda-info" id="ronda-info"></p>
        </div>
        <div class="letras-banco" id="letras-banco"></div>
      `;

      st = { ronda:0, aciertos:0, api, fase:'es' };
      const $ = id => document.getElementById(id);

      if (!document.getElementById('estilo-animales')) {
        const s = document.createElement('style');
        s.id = 'estilo-animales';
        s.textContent = `
          .animal-escena {
            flex:1; display:flex; flex-direction:column;
            align-items:center; justify-content:center; gap:6px;
            min-height:0;
          }
          .animal-img {
            font-size:clamp(60px,22vw,120px);
            animation:flotarAnimal 2s ease-in-out infinite alternate;
            filter:drop-shadow(0 0 25px rgba(34,211,238,.5));
            line-height:1;
          }
          @keyframes flotarAnimal {
            from{ transform:translateY(0) }
            to  { transform:translateY(-8px) }
          }
          .palabra-es {
            font-family:'Orbitron',sans-serif;
            font-size:clamp(22px,7vw,36px);
            font-weight:900; color:#22d3ee;
            letter-spacing:3px;
            text-shadow:0 0 20px rgba(34,211,238,.6);
            display:flex; gap:4px; flex-wrap:wrap; justify-content:center;
          }
          .palabra-en {
            font-family:'Orbitron',sans-serif;
            font-size:clamp(18px,5.5vw,26px);
            font-weight:700; color:#e879f9;
            letter-spacing:2px;
            text-shadow:0 0 15px rgba(232,121,249,.6);
            display:flex; gap:4px; flex-wrap:wrap; justify-content:center;
          }
          .letra-slot {
            display:inline-flex; align-items:center; justify-content:center;
            width:clamp(28px,9vw,48px); height:clamp(36px,11vw,56px);
            border-bottom:4px solid rgba(34,211,238,.4);
            font-size:inherit; font-weight:inherit;
            color:inherit;
          }
          .letra-slot.lleno {
            border-bottom-color:#22d3ee;
            animation:popLetra .3s;
          }
          .letra-slot.en.lleno {
            border-bottom-color:#e879f9;
          }
          .letra-slot.vacia {
            color:rgba(148,163,184,.4);
          }
          @keyframes popLetra {
            0%{ transform:scale(1) }
            50%{ transform:scale(1.3) }
            100%{ transform:scale(1) }
          }
          .letras-banco {
            display:grid;
            grid-template-columns:repeat(auto-fit, minmax(46px, 1fr));
            gap:8px; padding:8px;
            max-height:32vh; overflow-y:auto;
            flex-shrink:0;
          }
          .letra-btn {
            aspect-ratio:1;
            border:2px solid rgba(34,211,238,.3);
            border-radius:14px;
            background:rgba(30,41,59,.8);
            color:#22d3ee;
            font-family:'Orbitron',sans-serif;
            font-size:clamp(20px,6vw,28px);
            font-weight:900;
            cursor:pointer;
            box-shadow:0 4px 0 rgba(0,0,0,.4);
            transition:transform .07s, box-shadow .07s, border-color .2s;
            display:flex; align-items:center; justify-content:center;
            padding:0;
          }
          .letra-btn:active {
            transform:translateY(3px);
            box-shadow:0 1px 0 rgba(0,0,0,.4);
          }
          .letra-btn.usada {
            opacity:.2; pointer-events:none;
          }
          .letra-btn.error {
            animation:temblar .3s;
            border-color:#f87171;
            color:#f87171;
          }
          .letra-btn.ok {
            border-color:#a3e635;
            color:#a3e635;
            box-shadow:0 0 15px rgba(163,230,53,.4);
          }
          .ronda-info {
            font-size:13px; color:#94a3b8;
            font-weight:700; text-align:center;
            margin:4px 0 0;
          }
        `;
        document.head.appendChild(s);
      }

      function ronda(){
        if (st.ronda >= RONDAS){
          window.melodia([523,659,784,1047]);
          api.sumarPuntos(st.aciertos * 6);
          api.fin(api.puntosActuales());
          return;
        }
        st.ronda++;

        let pool;
        if (st.ronda <= 3) pool = ANIMALES.slice(0, 5);
        else if (st.ronda <= 6) pool = ANIMALES.slice(5, 10);
        else pool = ANIMALES.slice(10);

        const animal = pool[Math.floor(Math.random() * pool.length)];
        st.animal = animal;
        st.fase = 'es';
        st.palabraCompletada = false;
        st.letrasUsadas = [];
        st.bloqueado = false;

        $('animal-img').textContent = animal.emoji;
        $('ronda-info').innerHTML =
          `Ronda ${st.ronda} de ${RONDAS} — ` +
          `<span style="color:#22d3ee">${animal.es}</span> / ` +
          `<span style="color:#e879f9">${animal.en}</span>`;

        pintarPalabra('es', animal.es, []);
        pintarPalabra('en', animal.en, []);

        $('inst').innerHTML =
          `Completa la palabra: <span style="color:#22d3ee">${animal.es}</span>` +
          `<span class="en">Complete the word: ${animal.en}</span>`;

        // Voz bilingüe correcta
        window.decirBilingue(
          'Completa la palabra. ' + animal.es,
          'Complete the word. ' + animal.en
        );

        construirBanco(animal.es);
      }

      function construirBanco(palabra){
        const letrasUnicas = [...new Set(palabra.split(''))];
        const disponibles = LETRAS.filter(l => !palabra.includes(l));
        const numDistractores = Math.max(4, 9 - letrasUnicas.length);
        const distractores = window.elegirN(disponibles, numDistractores);
        const banco = window.barajar([...letrasUnicas, ...distractores]);

        const bancoCont = document.getElementById('letras-banco');
        bancoCont.innerHTML = '';
        banco.forEach(l => {
          const b = document.createElement('button');
          b.className = 'letra-btn';
          b.textContent = l;
          b.dataset.letra = l;
          b.addEventListener('click', () => elegirLetra(b, l));
          bancoCont.appendChild(b);
        });
      }

      function pintarPalabra(fase, palabra, letrasPuestas){
        const elId = fase === 'es' ? 'palabra-es' : 'palabra-en';
        const el = document.getElementById(elId);
        if (!el) return;
        const restantes = [...letrasPuestas];
        el.innerHTML = palabra.split('').map(c => {
          const idx = restantes.indexOf(c);
          let lleno = false;
          if (idx !== -1){ lleno = true; restantes.splice(idx, 1); }
          return `<span class="letra-slot ${fase === 'en' ? 'en' : ''} ` +
                 `${lleno ? 'lleno' : 'vacia'}">${lleno ? c : '_'}</span>`;
        }).join('');
      }

      function elegirLetra(btn, letra){
        if (st.bloqueado || st.palabraCompletada) return;

        const palabra = st.fase === 'es' ? st.animal.es : st.animal.en;
        const enPalabra = palabra.split('').filter(c => c === letra).length;
        const puestas = st.letrasUsadas.filter(c => c === letra).length;

        if (enPalabra === 0 || puestas >= enPalabra){
          btn.classList.add('error');
          window.tono(200, 0.2, 'sawtooth');
          setTimeout(() => btn.classList.remove('error'), 400);
          return;
        }

        // Pronunciar la letra según la fase (español o inglés)
        if (st.fase === 'es'){
          window.decir(NOMBRE_ES[letra] || letra);
        } else {
          window.decirEn(NOMBRE_EN[letra] || letra);
        }

        st.letrasUsadas.push(letra);
        btn.classList.add('ok');
        window.tono(600 + st.letrasUsadas.length * 50, 0.08, 'square');

        if (st.letrasUsadas.filter(c => c === letra).length >= enPalabra){
          setTimeout(() => btn.classList.add('usada'), 300);
        }

        pintarPalabra(st.fase, palabra, st.letrasUsadas);

        const unicasPalabra = [...new Set(palabra.split(''))];
        const completo = unicasPalabra.every(l => {
          const enPal = palabra.split('').filter(c => c === l).length;
          const puestasL = st.letrasUsadas.filter(c => c === l).length;
          return puestasL >= enPal;
        });

        if (completo){
          st.palabraCompletada = true;
          window.melodia([880, 1100]);

          if (st.fase === 'es'){
            window.decirBilingue(
              '¡Muy bien! Ahora en inglés',
              'Now in English: ' + st.animal.en
            );
            setTimeout(() => {
              st.fase = 'en';
              st.palabraCompletada = false;
              st.letrasUsadas = [];
              pintarPalabra('en', st.animal.en, []);
              construirBanco(st.animal.en);
              $('inst').innerHTML =
                `Ahora en inglés: <span style="color:#e879f9">${st.animal.en}</span>` +
                `<span class="en">Now in English: ${st.animal.en}</span>`;
            }, 1400);
          } else {
            st.aciertos++;
            window.decirBilingue(
              '¡Excelente! ' + st.animal.es,
              'Excellent! ' + st.animal.en
            );
            setTimeout(() => { ronda(); }, 1400);
          }
        }
      }

      ronda();
    }
  };

  window.JUEGOS = window.JUEGOS || {};
  window.JUEGOS.animales = juego;
})();