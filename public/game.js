/* ============================================================
   ROBOTITO - Lógica del juego
   ============================================================ */

const socket = io();

/* ---------------- Niveles ----------------
   x = columna (0 = izquierda)   y = fila (0 = arriba)        */
const NIVELES = [
  { cols:3, rows:3, inicio:{x:0,y:2}, meta:{x:0,y:0}, muros:[],
    pista:'⬆️ ¿Cuántas veces hay que subir?' },

  { cols:3, rows:3, inicio:{x:0,y:2}, meta:{x:2,y:2}, muros:[],
    pista:'➡️ ¡Camina hacia la derecha!' },

  { cols:3, rows:3, inicio:{x:0,y:2}, meta:{x:2,y:0}, muros:[],
    pista:'Primero sube... ¿y después?' },

  { cols:4, rows:4, inicio:{x:0,y:3}, meta:{x:3,y:3}, muros:[],
    pista:'➡️ Da tres pasos a la derecha' },

  { cols:4, rows:4, inicio:{x:0,y:3}, meta:{x:3,y:0}, muros:[],
    pista:'¿Subimos primero o caminamos primero?' },

  { cols:4, rows:4, inicio:{x:0,y:3}, meta:{x:3,y:0}, muros:[{x:1,y:3},{x:1,y:2}],
    pista:'🪨 ¡Cuidado con las piedras!' },

  { cols:5, rows:5, inicio:{x:0,y:4}, meta:{x:4,y:0}, muros:[{x:0,y:2},{x:1,y:2},{x:2,y:2}],
    pista:'🪨 Busca el camino más largo' },

  { cols:5, rows:5, inicio:{x:2,y:4}, meta:{x:2,y:0}, muros:[{x:2,y:2}],
    pista:'🪨 ¡Rodea la piedra para llegar!' }
];

const FLECHAS = { up:'⬆️', down:'⬇️', left:'⬅️', right:'➡️' };
const MAX_PASOS = 16;

/* ---------------- Estado ---------------- */
const estado = {
  nombre: '',
  puntos: 0,
  nivel: 0,
  programa: [],
  corriendo: false,
  fallos: 0,
  sonido: true,
  voz: true
};

/* ---------------- Utilidades ---------------- */
const $ = id => document.getElementById(id);
const dormir = ms => new Promise(r => setTimeout(r, ms));
const esMuro = (n, p) => n.muros.some(m => m.x === p.x && m.y === p.y);
const escapeHtml = s => String(s).replace(/[&<>"']/g,
  c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

/* ---------------- Audio (sin archivos) ---------------- */
let actx = null;
function tono(freq, dur = 0.12, tipo = 'sine', vol = 0.18) {
  if (!estado.sonido) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = tipo;
    o.frequency.value = freq;
    o.connect(g); g.connect(actx.destination);
    const t = actx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.04);
  } catch (e) { /* silencio */ }
}
function melodia(notas) {
  notas.forEach((f, i) => setTimeout(() => tono(f, 0.18, 'triangle', 0.2), i * 135));
}

/* ---------------- Voz ---------------- */
function decir(texto) {
  if (!estado.voz || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-ES';
    u.rate = 0.95;
    u.pitch = 1.25;
    speechSynthesis.speak(u);
  } catch (e) { /* sin voz */ }
}

/* ---------------- Pantallas y overlays ---------------- */
function mostrarPantalla(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
  $(id).classList.add('activa');
}
function abrirOverlay(id) { $(id).classList.add('activo'); }
function cerrarOverlays() {
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('activo'));
}

/* ---------------- Registro ---------------- */
$('btn-jugar').addEventListener('click', registrar);
$('input-nombre').addEventListener('keydown', e => { if (e.key === 'Enter') registrar(); });

function registrar() {
  const nombre = $('input-nombre').value.trim();
  if (!nombre) { $('input-nombre').focus(); return; }

  socket.emit('registrar', nombre, res => {
    if (!res || !res.ok) return;
    estado.nombre = res.jugador.nombre;
    estado.puntos = res.jugador.puntos;
    $('hud-nombre').textContent = estado.nombre;
    $('hud-avatar').textContent = res.jugador.avatar;
    $('hud-puntos').textContent = estado.puntos;

    mostrarPantalla('pantalla-juego');
    cargarNivel(0);
    tono(660, 0.1, 'triangle');
  });
}

/* ---------------- Nivel ---------------- */
function cargarNivel(i) {
  estado.nivel = i;
  estado.programa = [];
  estado.fallos = 0;

  const n = NIVELES[i];
  $('hud-nivel').textContent = i + 1;
  $('pista').textContent = n.pista;

  pintarTablero();
  pintarPrograma();
  decir(n.pista);
}

function pintarTablero() {
  const n = NIVELES[estado.nivel];
  const tablero = $('tablero');

  tablero.style.setProperty('--cols', n.cols);
  tablero.style.setProperty('--rows', n.rows);
  tablero.innerHTML = '';

  for (let y = 0; y < n.rows; y++) {
    for (let x = 0; x < n.cols; x++) {
      const c = document.createElement('div');
      c.className = 'celda' + ((x + y) % 2 === 0 ? ' clara' : '');
      tablero.appendChild(c);
    }
  }

  n.muros.forEach(m => {
    const w = document.createElement('div');
    w.className = 'muro';
    w.textContent = '🪨';
    posicionar(w, m, n);
    tablero.appendChild(w);
  });

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = '⭐';
  posicionar(meta, n.meta, n);
  tablero.appendChild(meta);

  const robot = document.createElement('div');
  robot.className = 'robot';
  robot.id = 'robot';
  robot.textContent = '🤖';
  tablero.appendChild(robot);

  colocarRobot(n.inicio);
}

function posicionar(el, p, n) {
  el.style.left = (p.x / n.cols * 100) + '%';
  el.style.top  = (p.y / n.rows * 100) + '%';
}

function colocarRobot(p) {
  const n = NIVELES[estado.nivel];
  const r = $('robot');
  if (!r) return;
  r.style.left = (p.x / n.cols * 100) + '%';
  r.style.top  = (p.y / n.rows * 100) + '%';
}

/* ---------------- Programa (slots) ---------------- */
function pintarPrograma(indiceActivo = -1) {
  const cont = $('slots');
  cont.innerHTML = '';

  const total = Math.max(6, estado.programa.length + 1);
  for (let i = 0; i < total; i++) {
    const s = document.createElement('div');
    s.className = 'slot';
    const d = estado.programa[i];
    if (d) {
      s.classList.add('lleno');
      s.textContent = FLECHAS[d];
    }
    if (i === indiceActivo) s.classList.add('activo');
    cont.appendChild(s);
  }

  // Auto-scroll al último
  cont.scrollLeft = cont.scrollWidth;
}

/* ---------------- Controles ---------------- */
document.querySelectorAll('.dir').forEach(b => {
  b.addEventListener('click', () => agregarPaso(b.dataset.dir));
});

function agregarPaso(dir) {
  if (estado.corriendo) return;
  if (estado.programa.length >= MAX_PASOS) {
    mostrarToast('¡Ya hay muchos pasos!');
    return;
  }
  estado.programa.push(dir);
  tono(700, 0.07, 'square', 0.12);
  pintarPrograma();
}

$('btn-quitar').addEventListener('click', () => {
  if (estado.corriendo) return;
  estado.programa.pop();
  tono(320, 0.09, 'square', 0.1);
  pintarPrograma();
});

$('btn-borrar').addEventListener('click', () => {
  if (estado.corriendo) return;
  estado.programa = [];
  tono(220, 0.14, 'square', 0.12);
  pintarPrograma();
});

$('btn-correr').addEventListener('click', correr);

function bloquear(v) {
  document.querySelectorAll('.dir, #btn-correr, #btn-quitar, #btn-borrar')
    .forEach(b => { b.disabled = v; });
}

/* ---------------- Ejecución ---------------- */
async function correr() {
  if (estado.corriendo || estado.programa.length === 0) return;

  estado.corriendo = true;
  bloquear(true);

  const n = NIVELES[estado.nivel];
  let pos = { ...n.inicio };

  $('robot').classList.remove('choque');
  colocarRobot(pos);
  await dormir(320);

  let exito = true;

  for (let i = 0; i < estado.programa.length; i++) {
    pintarPrograma(i);
    const dir = estado.programa[i];

    const siguiente = {
      x: pos.x + (dir === 'left' ? -1 : dir === 'right' ? 1 : 0),
      y: pos.y + (dir === 'up'   ? -1 : dir === 'down'  ? 1 : 0)
    };

    const fuera = siguiente.x < 0 || siguiente.x >= n.cols ||
                  siguiente.y < 0 || siguiente.y >= n.rows;

    if (fuera || esMuro(n, siguiente)) {
      exito = false;
      $('robot').classList.add('choque');
      tono(150, 0.35, 'sawtooth', 0.22);
      await dormir(650);
      break;
    }

    pos = siguiente;
    colocarRobot(pos);
    tono(520 + i * 35, 0.09, 'sine', 0.13);
    await dormir(430);
  }

  pintarPrograma(-1);
  await dormir(180);

  if (exito && pos.x === n.meta.x && pos.y === n.meta.y) {
    ganar();
  } else {
    perder();
  }

  estado.corriendo = false;
  bloquear(false);
}

/* ---------------- Ganar / Perder ---------------- */
function ganar() {
  const base = 10 * (estado.nivel + 1);
  const ganados = Math.max(4, base - estado.fallos * 2);

  estado.puntos += ganados;
  socket.emit('sumarPuntos', ganados);
  $('hud-puntos').textContent = estado.puntos;

  $('win-puntos').textContent = ganados;
  melodia([523, 659, 784, 1047]);
  decir('¡Muy bien! ¡Lo lograste!');
  abrirOverlay('overlay-win');
}

function perder() {
  estado.fallos++;
  tono(190, 0.25, 'sawtooth', 0.16);
  decir('¡Casi! Inténtalo otra vez');
  mostrarToast('¡Casi! Inténtalo otra vez 🔄');

  setTimeout(() => {
    const r = $('robot');
    if (r) {
      r.classList.remove('choque');
      colocarRobot(NIVELES[estado.nivel].inicio);
    }
  }, 850);
}

/* ---------------- Siguiente nivel ---------------- */
$('btn-siguiente').addEventListener('click', () => {
  cerrarOverlays();
  const siguiente = estado.nivel + 1;
  if (siguiente >= NIVELES.length) {
    $('fin-puntos').textContent = estado.puntos;
    melodia([523, 659, 784, 1047, 1319]);
    abrirOverlay('overlay-fin');
  } else {
    cargarNivel(siguiente);
  }
});

$('btn-reiniciar-juego').addEventListener('click', () => {
  cerrarOverlays();
  cargarNivel(0);
});

/* ---------------- Toast ---------------- */
let toastTimer = null;
function mostrarToast(texto) {
  const t = $('toast');
  t.textContent = texto;
  t.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('visible'), 1700);
}

/* ---------------- Sonido / Voz ---------------- */
$('btn-sonido').addEventListener('click', () => {
  estado.sonido = !estado.sonido;
  estado.voz = estado.sonido;
  $('btn-sonido').textContent = estado.sonido ? '🔊' : '🔇';
  if (!estado.sonido && 'speechSynthesis' in window) speechSynthesis.cancel();
  if (estado.sonido) tono(660, 0.1, 'triangle');
});

/* ---------------- Clasificación ---------------- */
$('btn-trofeo').addEventListener('click', () => abrirOverlay('overlay-tabla'));
$('btn-ver-tabla').addEventListener('click', () => abrirOverlay('overlay-tabla'));
$('btn-ver-tabla-fin').addEventListener('click', () => abrirOverlay('overlay-tabla'));
$('btn-cerrar-tabla').addEventListener('click', cerrarOverlays);

$('btn-reiniciar-tabla').addEventListener('click', () => {
  if (confirm('¿Borrar TODOS los puntos y jugadores de la tabla?')) {
    socket.emit('reiniciar');
    mostrarToast('Tabla borrada');
  }
});

socket.on('tabla', lista => {
  const ol = $('lista-tabla');
  ol.innerHTML = '';

  if (!lista.length) {
    const li = document.createElement('li');
    li.className = 'fila vacio';
    li.textContent = 'Aún no hay jugadores 😴';
    ol.appendChild(li);
    return;
  }

  const medallas = ['🥇', '🥈', '🥉'];

  lista.slice(0, 12).forEach((j, i) => {
    const li = document.createElement('li');
    li.className = 'fila' + (j.nombre === estado.nombre ? ' yo' : '');
    li.innerHTML =
      '<span class="puesto">' + (medallas[i] || (i + 1)) + '</span>' +
      '<span class="avatar">' + j.avatar + '</span>' +
      '<span class="nombre">' + escapeHtml(j.nombre) + '</span>' +
      '<span class="puntos">' + j.puntos + '</span>';
    ol.appendChild(li);
  });
});

/* ---------------- Evitar zoom con doble toque ---------------- */
let ultimoToque = 0;
document.addEventListener('touchend', e => {
  const ahora = Date.now();
  if (ahora - ultimoToque < 300) e.preventDefault();
  ultimoToque = ahora;
}, { passive: false });