/* ══════════════════ JUEGO 1: ROBOTITO ══════════════════ */

(function(){
  const NIVELES = [
    { cols:3, rows:3, inicio:{x:0,y:2}, meta:{x:0,y:0}, muros:[], pista:'⬆️ ¿Cuántas veces subimos?' },
    { cols:3, rows:3, inicio:{x:0,y:2}, meta:{x:2,y:2}, muros:[], pista:'➡️ ¡Camina a la derecha!' },
    { cols:3, rows:3, inicio:{x:0,y:2}, meta:{x:2,y:0}, muros:[], pista:'Primero sube... ¿y después?' },
    { cols:4, rows:4, inicio:{x:0,y:3}, meta:{x:3,y:3}, muros:[], pista:'➡️ Da tres pasos a la derecha' },
    { cols:4, rows:4, inicio:{x:0,y:3}, meta:{x:3,y:0}, muros:[], pista:'¿Subimos primero o caminamos?' },
    { cols:4, rows:4, inicio:{x:0,y:3}, meta:{x:3,y:0}, muros:[{x:1,y:3},{x:1,y:2}], pista:'🪨 ¡Cuidado con las piedras!' },
    { cols:5, rows:5, inicio:{x:0,y:4}, meta:{x:4,y:0}, muros:[{x:0,y:2},{x:1,y:2},{x:2,y:2}], pista:'🪨 Busca el camino más largo' },
    { cols:5, rows:5, inicio:{x:2,y:4}, meta:{x:2,y:0}, muros:[{x:2,y:2}], pista:'🪨 ¡Rodea la piedra!' }
  ];
  const FLECHAS = { up:'⬆️', down:'⬇️', left:'⬅️', right:'➡️' };
  const MAX = 16;
  const dormir = ms => new Promise(r => setTimeout(r, ms));
  const esMuro = (n,p) => n.muros.some(m => m.x===p.x && m.y===p.y);

  let st = null;

  const juego = {
    id:'robotito', emoji:'🤖', nombre:'ROBOTITO',
    descripcion:'Programa al robot con flechas hasta la estrella ⭐',
    edad:'4-5 años',
    iniciar(cont, api){
      cont.innerHTML = `
        <p class="instruccion" id="pista"></p>
        <div class="zona-tablero">
          <div id="tablero" class="tablero"></div>
        </div>
        <div id="slots" class="slots"></div>
        <div class="dpad">
          <button class="dir" data-dir="up"    style="grid-area:u" aria-label="Arriba">
            <span class="dir-emoji">⬆️</span><span class="dir-label">UP</span>
          </button>
          <button class="dir" data-dir="left"  style="grid-area:l" aria-label="Izquierda">
            <span class="dir-emoji">⬅️</span><span class="dir-label">LEFT</span>
          </button>
          <button id="btn-correr" style="grid-area:c" class="btn-correr">▶</button>
          <button class="dir" data-dir="right" style="grid-area:r" aria-label="Derecha">
            <span class="dir-emoji">➡️</span><span class="dir-label">RIGHT</span>
          </button>
          <button class="dir" data-dir="down"  style="grid-area:d" aria-label="Abajo">
            <span class="dir-emoji">⬇️</span><span class="dir-label">DOWN</span>
          </button>
        </div>
        <div class="acciones">
          <button id="btn-quitar" class="btn btn-naranja">↩️ Quitar</button>
          <button id="btn-borrar" class="btn btn-rojo">🗑️ Borrar</button>
        </div>
      `;

      st = { nivel:0, programa:[], corriendo:false, fallos:0, api };
      const $ = id => document.getElementById(id);

      /* ───── Ajuste dinámico del tablero ───── */
      function ajustarTamano(){
        if (!document.body.contains(cont)){
          window.removeEventListener('resize', ajustarTamano);
          window.removeEventListener('orientationchange', ajustarTamano);
          return;
        }
        const zona = cont.querySelector('.zona-tablero');
        const tablero = cont.querySelector('.tablero');
        if (!zona || !tablero) return;

        const w = zona.clientWidth;
        const h = zona.clientHeight;
        const size = Math.max(140, Math.min(w, h) - 6);
        tablero.style.setProperty('--board-size', size + 'px');
      }
      setTimeout(ajustarTamano, 0);
      window.addEventListener('resize', ajustarTamano);
      window.addEventListener('orientationchange', () => setTimeout(ajustarTamano, 300));

      function cargarNivel(i){
        st.nivel = i; st.programa = []; st.fallos = 0;
        const n = NIVELES[i];
        $('pista').textContent = n.pista;
        pintarTablero(); pintarPrograma();
        setTimeout(ajustarTamano, 30);
        window.decir(n.pista);
      }

      function pintarTablero(){
        const n = NIVELES[st.nivel];
        const tab = $('tablero');
        tab.style.setProperty('--cols', n.cols);
        tab.style.setProperty('--rows', n.rows);
        tab.innerHTML = '';
        for (let y=0; y<n.rows; y++) for (let x=0; x<n.cols; x++){
          const c = document.createElement('div');
          c.className = 'celda' + ((x+y)%2===0 ? ' clara' : '');
          tab.appendChild(c);
        }
        n.muros.forEach(m => {
          const w = document.createElement('div');
          w.className = 'muro'; w.textContent = '🪨';
          pos(w, m, n); tab.appendChild(w);
        });
        const meta = document.createElement('div');
        meta.className = 'meta'; meta.textContent = '⭐';
        pos(meta, n.meta, n); tab.appendChild(meta);
        const r = document.createElement('div');
        r.className = 'robot'; r.id = 'robot'; r.textContent = '🤖';
        tab.appendChild(r);
        colocar(n.inicio);
      }
      function pos(el,p,n){
        el.style.left = (p.x/n.cols*100) + '%';
        el.style.top  = (p.y/n.rows*100) + '%';
      }
      function colocar(p){
        const n = NIVELES[st.nivel], r = $('robot');
        if (!r) return;
        r.style.left = (p.x/n.cols*100) + '%';
        r.style.top  = (p.y/n.rows*100) + '%';
      }
      function pintarPrograma(act=-1){
        const c = $('slots'); c.innerHTML = '';
        const total = Math.max(6, st.programa.length + 1);
        for (let i=0; i<total; i++){
          const s = document.createElement('div');
          s.className = 'slot';
          if (st.programa[i]){
            s.classList.add('lleno');
            s.textContent = FLECHAS[st.programa[i]];
          }
          if (i === act) s.classList.add('activo');
          c.appendChild(s);
        }
        c.scrollLeft = c.scrollWidth;
      }
      function bloquear(v){
        cont.querySelectorAll('.dir,#btn-correr,#btn-quitar,#btn-borrar')
          .forEach(b => b.disabled = v);
      }

      cont.querySelectorAll('.dir').forEach(b => b.addEventListener('click', () => {
        if (st.corriendo) return;
        if (st.programa.length >= MAX){ window.mostrarToast('¡Ya hay muchos pasos!'); return; }
        st.programa.push(b.dataset.dir);
        window.tono(700,0.07,'square',0.12);
        pintarPrograma();
      }));
      $('btn-quitar').addEventListener('click', () => {
        if (st.corriendo) return;
        st.programa.pop(); window.tono(320,0.09,'square',0.1); pintarPrograma();
      });
      $('btn-borrar').addEventListener('click', () => {
        if (st.corriendo) return;
        st.programa = []; window.tono(220,0.14,'square',0.12); pintarPrograma();
      });

      $('btn-correr').addEventListener('click', async () => {
        if (st.corriendo || st.programa.length === 0) return;
        st.corriendo = true; bloquear(true);
        const n = NIVELES[st.nivel];
        let pos_ = { ...n.inicio };
        $('robot').classList.remove('choque');
        colocar(pos_);
        await dormir(300);
        let ok = true;
        for (let i=0; i<st.programa.length; i++){
          pintarPrograma(i);
          const dir = st.programa[i];
          const sig = {
            x: pos_.x + (dir==='left' ? -1 : dir==='right' ? 1 : 0),
            y: pos_.y + (dir==='up'   ? -1 : dir==='down'  ? 1 : 0)
          };
          const fuera = sig.x<0 || sig.x>=n.cols || sig.y<0 || sig.y>=n.rows;
          if (fuera || esMuro(n,sig)){
            ok = false;
            $('robot').classList.add('choque');
            window.tono(150,0.35,'sawtooth',0.22);
            await dormir(650); break;
          }
          pos_ = sig; colocar(pos_);
          window.tono(520+i*35, 0.09, 'sine', 0.13);
          await dormir(420);
        }
        pintarPrograma(-1);
        await dormir(180);

        if (ok && pos_.x === n.meta.x && pos_.y === n.meta.y){
          const base = 10 * (st.nivel + 1);
          const g = Math.max(4, base - st.fallos*2);
          api.sumarPuntos(g);
          window.melodia([523,659,784,1047]);
          window.decir('¡Muy bien! ¡Lo lograste!');
          await dormir(700);
          const siguiente = st.nivel + 1;
          if (siguiente < NIVELES.length){
            cargarNivel(siguiente);
          } else {
            api.fin(api.puntosActuales());
          }
        } else {
          st.fallos++;
          window.tono(190,0.25,'sawtooth',0.16);
          window.decir('¡Casi! Inténtalo otra vez');
          window.mostrarToast('¡Casi! Inténtalo otra vez 🔄');
          await dormir(850);
          const r = $('robot');
          if (r){ r.classList.remove('choque'); colocar(NIVELES[st.nivel].inicio); }
        }
        st.corriendo = false; bloquear(false);
      });

      cargarNivel(0);
    }
  };

  window.JUEGOS = window.JUEGOS || {};
  window.JUEGOS.robotito = juego;
})();