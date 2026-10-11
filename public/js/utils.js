/* Utilidades compartidas: sonido, voz, toast */

window.SONIDO = true;

let _actx = null;
window.tono = function(freq, dur=0.12, tipo='sine', vol=0.18){
  if (!window.SONIDO) return;
  try{
    _actx = _actx || new (window.AudioContext || window.webkitAudioContext)();
    if (_actx.state === 'suspended') _actx.resume();
    const o = _actx.createOscillator();
    const g = _actx.createGain();
    o.type = tipo; o.frequency.value = freq;
    o.connect(g); g.connect(_actx.destination);
    const t = _actx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.04);
  } catch(e){}
};

window.melodia = function(notas, dur=0.18, gap=135){
  notas.forEach((f,i) => setTimeout(() => window.tono(f, dur, 'triangle', 0.2), i * gap));
};

/* ─── VOZ ESPAÑOL ─── */
window.decir = function(texto){
  if (!window.SONIDO || !('speechSynthesis' in window)) return;
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-ES'; u.rate = 0.95; u.pitch = 1.25;
    speechSynthesis.speak(u);
  } catch(e){}
};

/* ─── VOZ INGLÉS (evita que deletree palabras) ─── */
window.decirEn = function(texto){
  if (!window.SONIDO || !('speechSynthesis' in window)) return;
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'en-US'; u.rate = 0.85; u.pitch = 1.15;
    speechSynthesis.speak(u);
  } catch(e){}
};

/* ─── VOZ BILINGÜE: dice español y luego inglés ─── */
window.decirBilingue = function(textoEs, textoEn){
  if (!window.SONIDO || !('speechSynthesis' in window)) return;
  try{
    speechSynthesis.cancel();
    const u1 = new SpeechSynthesisUtterance(textoEs);
    u1.lang = 'es-ES'; u1.rate = 0.95; u1.pitch = 1.25;
    const u2 = new SpeechSynthesisUtterance(textoEn);
    u2.lang = 'en-US'; u2.rate = 0.85; u2.pitch = 1.15;
    speechSynthesis.speak(u1);
    speechSynthesis.speak(u2);
  } catch(e){}
};

let _toastTimer = null;
window.mostrarToast = function(texto){
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = texto;
  t.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('visible'), 1700);
};

window.barajar = function(a){
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

window.elegirN = function(arr, n){
  return window.barajar(arr).slice(0, n);
};