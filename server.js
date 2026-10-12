const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const { Server } = require('socket.io');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const AVATARES = ['🤖','🦊','🐼','🐸','🦁','🐵','🐧','🦄','🐙','🐝','🐯','🐨','🐷','🐰','🐻','🐢'];
const jugadores = new Map();

/* ══════════════ BASE DE DATOS ══════════════ */
let usarDB = false;
let pool = null;

if (process.env.DATABASE_URL){
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  pool.query(`
    CREATE TABLE IF NOT EXISTS jugadores (
      clave   TEXT PRIMARY KEY,
      nombre  TEXT NOT NULL,
      puntos  INTEGER DEFAULT 0,
      avatar  TEXT
    )
  `).then(() => {
    usarDB = true;
    console.log('✅ Base de datos conectada');
    return pool.query('SELECT * FROM jugadores');
  }).then(res => {
    res.rows.forEach(r => {
      jugadores.set(r.clave, { nombre: r.nombre, puntos: r.puntos, avatar: r.avatar });
    });
    console.log(`📊 ${res.rows.length} jugadores cargados desde la base de datos`);
    io.emit('tabla', tabla());
  }).catch(err => {
    console.error('❌ Error al conectar la base de datos:', err.message);
    console.log('⚠️  Modo sin persistencia (los puntos se perderán al reiniciar)');
  });
} else {
  console.log('⚠️  DATABASE_URL no configurada. Modo sin persistencia.');
}

function guardarJugador(j){
  if (!usarDB || !pool) return;
  pool.query(`
    INSERT INTO jugadores (clave, nombre, puntos, avatar)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (clave) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      puntos = EXCLUDED.puntos,
      avatar = EXCLUDED.avatar
  `, [j.clave, j.nombre, j.puntos, j.avatar]).catch(err => {
    console.error('Error al guardar jugador:', err.message);
  });
}

function borrarTodos(){
  if (!usarDB || !pool) return;
  pool.query('DELETE FROM jugadores').catch(err => {
    console.error('Error al borrar:', err.message);
  });
}

/* ══════════════ TABLA EN MEMORIA ══════════════ */
function tabla(){
  return [...jugadores.values()]
    .sort((a, b) => b.puntos - a.puntos)
    .map((j, i) => ({ ...j, puesto: i + 1 }));
}

/* ══════════════ SOCKET.IO ══════════════ */
io.on('connection', (socket) => {
  socket.emit('tabla', tabla());

  socket.on('registrar', (nombreRaw, cb) => {
    const nombre = String(nombreRaw || '').trim().slice(0, 12);
    if (!nombre){
      if (typeof cb === 'function') cb({ ok: false });
      return;
    }
    const clave = nombre.toLowerCase();
    let j = jugadores.get(clave);
    if (!j){
      j = {
        clave,
        nombre,
        puntos: 0,
        avatar: AVATARES[Math.floor(Math.random() * AVATARES.length)]
      };
      jugadores.set(clave, j);
      guardarJugador(j);
    }
    socket.data.clave = clave;
    if (typeof cb === 'function') cb({ ok: true, jugador: j });
    io.emit('tabla', tabla());
  });

  socket.on('sumarPuntos', (p) => {
    const clave = socket.data.clave;
    if (!clave) return;
    const j = jugadores.get(clave);
    if (!j) return;
    j.puntos += Number(p) || 0;
    guardarJugador(j);
    io.emit('tabla', tabla());
  });

  socket.on('reiniciar', () => {
    jugadores.clear();
    borrarTodos();
    io.emit('tabla', tabla());
  });
});

/* ══════════════ ARRANQUE ══════════════ */
function ipLocal(){
  const nets = os.networkInterfaces();
  for (const n of Object.keys(nets))
    for (const net of nets[n])
      if (net.family === 'IPv4' && !net.internal) return net.address;
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const ip = ipLocal();
  console.log('');
  console.log('==================================================');
  console.log('   MINIJUEGOS LAB');
  console.log('==================================================');
  console.log('   En esta PC:        http://localhost:' + PORT);
  console.log('   Desde el telefono: http://' + ip + ':' + PORT);
  console.log('   Tablero para TV:   http://' + ip + ':' + PORT + '/tablero.html');
  console.log('==================================================');
  console.log('');
});