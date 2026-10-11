/* Router + socket + registro + menú */

const socket = io();

const APP = {
  jugador: null,
  juegos: {},
  juegoActual: null,

  registrar(juego){ this.juegos[juego.id] = juego; },

  irA(pantalla){
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    document.getElementById(pantalla).classList.add('activa');
  },

  abrirOverlay(id){ document.getElementById(id).classList.add('activo'); },
  cerrarOverlays(){
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('activo'));
  },

  actualizarHUD(){
    if (!this.jugador) return;
    document.querySelectorAll('.hud-nombre').forEach(e => e.textContent = this.jugador.nombre);
    document.querySelectorAll('.hud-avatar').forEach(e => e.textContent = this.jugador.avatar);
    document.querySelectorAll('.hud-puntos-valor').forEach(e => e.textContent = this.jugador.puntos);
  },

  sumarPuntos(n){
    if (!this.jugador) return;
    this.jugador.puntos += n;
    this.actualizarHUD();
    socket.emit('sumarPuntos', n);
  },

  mostrarVictoria(puntos, msg){
    document.getElementById('win-pts').textContent = puntos;
    if (msg) document.querySelector('#ov-win .win-titulo').textContent = msg;
    this.abrirOverlay('ov-win');
  },

  mostrarFin(puntos){
    document.getElementById('fin-pts').textContent = puntos;
    this.abrirOverlay('ov-fin');
  },

  volverAlMenu(){
    this.cerrarOverlays();
    this.irA('p-menu');
    this.juegoActual = null;
    window.SONIDO && window.decir('Elige un juego');
  },

  iniciarJuego(id){
    const juego = this.juegos[id];
    if (!juego) return;
    this.juegoActual = juego;
    const cont = document.getElementById('juego-contenedor');
    cont.innerHTML = '';
    this.irA('p-juego');
    juego.iniciar(cont, {
      sumarPuntos: n => this.sumarPuntos(n),
      victoria: (p, m) => this.mostrarVictoria(p, m),
      derrota: (msg) => window.mostrarToast(msg || '¡Casi! Inténtalo otra vez'),
      fin: (p) => this.mostrarFin(p),
      volverAlMenu: () => this.volverAlMenu(),
      puntosActuales: () => this.jugador ? this.jugador.puntos : 0
    });
  },

  pintarMenu(){
    const cont = document.getElementById('lista-juegos');
    cont.innerHTML = '';
    Object.values(this.juegos).forEach(j => {
      const b = document.createElement('button');
      b.className = 'juego-card';
      b.innerHTML = `
        <div class="ic">${j.emoji}</div>
        <div class="info">
          <h3 class="titulo">${j.nombre}</h3>
          <p class="desc">${j.descripcion}</p>
        </div>
        <div class="edad">${j.edad}</div>
      `;
      b.addEventListener('click', () => {
        window.tono(660, 0.09, 'triangle');
        this.iniciarJuego(j.id);
      });
      cont.appendChild(b);
    });
  }
};
window.APP = APP;

/* ─────── Registro ─────── */
const inpNombre = document.getElementById('inp-nombre');
document.getElementById('btn-entrar').addEventListener('click', registrar);
inpNombre.addEventListener('keydown', e => { if (e.key === 'Enter') registrar(); });

function registrar(){
  const nombre = inpNombre.value.trim();
  if (!nombre){ inpNombre.focus(); return; }
  socket.emit('registrar', nombre, res => {
    if (!res || !res.ok) return;
    APP.jugador = res.jugador;
    APP.actualizarHUD();
    APP.pintarMenu();
    APP.irA('p-menu');
    window.tono(880, 0.12, 'triangle');
    window.decir('¡Hola ' + res.jugador.nombre + '! Elige un juego');
  });
}

/* ─────── Botones globales ─────── */
document.getElementById('btn-sonido').addEventListener('click', e => {
  window.SONIDO = !window.SONIDO;
  e.currentTarget.textContent = window.SONIDO ? '🔊' : '🔇';
  if (!window.SONIDO && 'speechSynthesis' in window) speechSynthesis.cancel();
  else window.tono(660, 0.1, 'triangle');
});
document.getElementById('btn-tabla').addEventListener('click',  () => APP.abrirOverlay('ov-tabla'));
document.getElementById('btn-tabla2').addEventListener('click', () => APP.abrirOverlay('ov-tabla'));
document.getElementById('btn-tabla-reg').addEventListener('click',() => APP.abrirOverlay('ov-tabla'));
document.getElementById('btn-cerrar-tabla').addEventListener('click', () => APP.cerrarOverlays());
document.getElementById('btn-volver').addEventListener('click', () => APP.volverAlMenu());
document.getElementById('btn-salir').addEventListener('click', () => {
  if (confirm('¿Cambiar de jugador?')){
    APP.jugador = null;
    inpNombre.value = '';
    APP.irA('p-registro');
  }
});

document.getElementById('btn-otra').addEventListener('click', () => {
  APP.cerrarOverlays();
  if (APP.juegoActual) APP.iniciarJuego(APP.juegoActual.id);
});
document.getElementById('btn-otra-fin').addEventListener('click', () => {
  APP.cerrarOverlays();
  if (APP.juegoActual) APP.iniciarJuego(APP.juegoActual.id);
});
document.getElementById('btn-menu-win').addEventListener('click', () => APP.volverAlMenu());
document.getElementById('btn-menu-fin').addEventListener('click', () => APP.volverAlMenu());

document.getElementById('btn-borrar-tabla').addEventListener('click', () => {
  if (confirm('¿Borrar TODOS los puntos y jugadores?')){
    socket.emit('reiniciar');
    window.mostrarToast('Tabla borrada');
  }
});

/* ─────── Tabla en vivo ─────── */
socket.on('tabla', lista => {
  const ol = document.getElementById('lista-tabla');
  if (!ol) return;
  ol.innerHTML = '';
  if (!lista.length){
    const li = document.createElement('li');
    li.className = 'fila vacio'; li.textContent = 'Aún no hay jugadores 😴';
    ol.appendChild(li); return;
  }
  const medallas = ['🥇','🥈','🥉'];
  lista.slice(0,12).forEach((j,i) => {
    const li = document.createElement('li');
    const yo = APP.jugador && j.nombre === APP.jugador.nombre;
    li.className = 'fila' + (yo ? ' yo' : '');
    li.innerHTML =
      '<span class="puesto">' + (medallas[i] || (i+1)) + '</span>' +
      '<span class="avatar">' + j.avatar + '</span>' +
      '<span class="nombre">' + j.nombre.replace(/[<>&"]/g,'') + '</span>' +
      '<span class="puntos">' + j.puntos + '</span>';
    ol.appendChild(li);
  });
});

/* Prevenir zoom doble toque */
let _ultimoToque = 0;
document.addEventListener('touchend', e => {
  const ahora = Date.now();
  if (ahora - _ultimoToque < 300) e.preventDefault();
  _ultimoToque = ahora;
}, { passive:false });
/* ═══ Registrar los juegos que se cargaron antes ═══ */
Object.values(window.JUEGOS || {}).forEach(j => APP.registrar(j));