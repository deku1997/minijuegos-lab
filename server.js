const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const AVATARES = ['🤖','🦊','🐼','🐸','🦁','🐵','🐧','🦄','🐙','🐝','🐯','🐨','🐷','🐰','🐻','🐢'];
const jugadores = new Map();

function tabla() {
  return [...jugadores.values()]
    .sort((a, b) => b.puntos - a.puntos)
    .map((j, i) => ({ ...j, puesto: i + 1 }));
}

io.on('connection', (socket) => {
  socket.emit('tabla', tabla());

  socket.on('registrar', (nombreRaw, cb) => {
    const nombre = String(nombreRaw || '').trim().slice(0, 12);
    if (!nombre) return typeof cb === 'function' && cb({ ok: false });
    const clave = nombre.toLowerCase();
    let j = jugadores.get(clave);
    if (!j) {
      j = { nombre, puntos: 0, avatar: AVATARES[Math.floor(Math.random() * AVATARES.length)] };
      jugadores.set(clave, j);
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
    io.emit('tabla', tabla());
  });

  socket.on('reiniciar', () => {
    jugadores.clear();
    io.emit('tabla', tabla());
  });
});

function ipLocal() {
  const nets = os.networkInterfaces();
  for (const n of Object.keys(nets))
    for (const net of nets[n])
      if (net.family === 'IPv4' && !net.internal) return net.address;
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const ip = ipLocal();
  console.log('\n==================================================');
  console.log('   🎮  MINIJUEGOS  🎮');
  console.log('==================================================');
  console.log('   En esta PC:        http://localhost:' + PORT);
  console.log('   Desde el telefono: http://' + ip + ':' + PORT);
  console.log('   Tablero para TV:   http://' + ip + ':' + PORT + '/tablero.html');
  console.log('==================================================\n');
});