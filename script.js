const $ = (id) => document.getElementById(id);

/* ================= SOUND (Web Audio, no files needed) ================= */
let actx, soundOn = true;
const audio = () => { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; };
function tone(f, d = 0.08, type = 'sine', vol = 0.15, when = 0, slide = 0) {
  if (!soundOn) return;
  const c = audio(), t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.02);
}
function noise(d = 0.15, freq = 800, vol = 0.2, when = 0) {
  if (!soundOn) return;
  const c = audio(), n = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, n, c.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + when;
  s.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; g.gain.setValueAtTime(vol, t);
  s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
}
const sfx = {
  key: (k) => { const base = /\d/.test(k) ? 420 + Number(k) * 55 : k === '.' ? 380 : 700; tone(base, 0.07, 'square', 0.07); tone(base * 1.5, 0.05, 'triangle', 0.05, 0.02); },
  op: () => { tone(740, 0.08, 'square', 0.07); tone(980, 0.06, 'triangle', 0.05, 0.03); },
  clear: () => tone(300, 0.14, 'sawtooth', 0.07, 0, -140),
  eq: () => { tone(523, 0.12, 'triangle', 0.1); tone(659, 0.12, 'triangle', 0.1, 0.09); tone(784, 0.2, 'triangle', 0.1, 0.18); },
  push: () => { noise(0.05, 2400, 0.25); tone(140, 0.12, 'square', 0.12, 0.02, -50); },
  open: () => { noise(0.4, 500, 0.22); tone(180, 0.35, 'sine', 0.1, 0, -70); tone(900, 0.12, 'sine', 0.05, 0.3); },
  thunk: () => { tone(95, 0.22, 'sine', 0.4, 0, -45); noise(0.12, 260, 0.35); },
  pop: () => tone(520, 0.1, 'sine', 0.12, 0, 380),
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.12, i * 0.11)),
};
$('snd').addEventListener('click', () => { soundOn = !soundOn; $('snd').textContent = soundOn ? '🔊' : '🔇'; if (soundOn) sfx.pop(); });

/* ================= PHOTOS ================= */
document.querySelectorAll('img[data-drive]').forEach((img) => {
  img.onerror = () => { img.onerror = () => img.removeAttribute('src'); img.src = img.dataset.fallback; };
  img.src = `https://drive.google.com/thumbnail?id=${img.dataset.drive}&sz=w900`;
});

/* ================= TOAST ================= */
let toastT;
function toast(msg, ms) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
}

/* ================= FRIDGE: spring-physics door ================= */
const fridge = $('fridge'), door = $('door'), MAX = 88;
let angle = 0, vel = 0, springId, startX = 0, dragging = false, moved = false, isOpen = false;

function setA(a) {
  angle = a;
  door.style.setProperty('--a', a.toFixed(2));
  fridge.style.setProperty('--o', Math.min(1, a / MAX).toFixed(3));
}
function springTo(target, k, c) {
  cancelAnimationFrame(springId);
  let last = performance.now(), hit = false;
  const step = (now) => {
    const dt = Math.min((now - last) / 1000, 0.032); last = now;
    vel += ((target - angle) * k - vel * c) * dt;
    let a = angle + vel * dt;
    if (a < 0) { a = 0; if (!hit && Math.abs(vel) > 20) { hit = true; thunk(); } vel = -vel * 0.22; }
    if (a > MAX + 5) { a = MAX + 5; vel = -vel * 0.3; }
    setA(a);
    if (Math.abs(vel) < 0.4 && Math.abs(target - a) < 0.25) { setA(target); return; }
    springId = requestAnimationFrame(step);
  };
  springId = requestAnimationFrame(step);
}
function thunk() {
  sfx.thunk(); fridge.classList.remove('thump'); void fridge.offsetWidth; fridge.classList.add('thump');
}
function confetti() {
  const colors = ['#7fb2d8', '#fbf3e0', '#35557f', '#e8799f', '#f0cf79', '#e0594d'];
  for (let i = 0; i < 34; i++) {
    const s = document.createElement('i'); s.className = 'confetti';
    s.style.left = 10 + Math.random() * 80 + '%'; s.style.background = colors[i % colors.length];
    s.style.setProperty('--dx', (Math.random() * 30 - 15) + 'cqw'); s.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
    s.style.animationDelay = Math.random() * 0.4 + 's'; s.style.animationDuration = 1.8 + Math.random() * 1.2 + 's';
    fridge.appendChild(s); setTimeout(() => s.remove(), 3500);
  }
}
function openFridge() {
  if (isOpen) return;
  isOpen = true; vel = 0; sfx.open(); springTo(MAX, 70, 9); confetti();
  door.style.pointerEvents = 'none'; fridge.classList.add('open');
  $('caption').classList.add('hidden'); $('closeWrap').classList.remove('hidden');
}
function closeFridge() {
  isOpen = false; vel = 0; springTo(0, 120, 14);
  door.style.pointerEvents = ''; fridge.classList.remove('open');
  $('caption').classList.remove('hidden'); $('closeWrap').classList.add('hidden');
  $('inside').scrollTop = 0;
}
door.addEventListener('pointerdown', (e) => {
  if (isOpen) return;
  cancelAnimationFrame(springId); dragging = true; moved = false; startX = e.clientX; vel = 0;
  door.classList.add('drag'); door.setPointerCapture(e.pointerId);
});
door.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = Math.abs(e.clientX - startX);
  if (dx > 4) moved = true;
  setA(Math.max(0, Math.min(MAX, dx / (door.offsetWidth * 0.7) * MAX)));
});
function endDrag() {
  if (!dragging) return;
  dragging = false; door.classList.remove('drag');
  if (angle > 22) { isOpen = false; openFridge(); } else springTo(0, 120, 14);
}
door.addEventListener('pointerup', endDrag);
door.addEventListener('pointercancel', endDrag);
[$('hdlTop'), $('hdlBot')].forEach((h) => h.addEventListener('click', () => { if (!moved && !isOpen) openFridge(); }));
$('closeBtn').addEventListener('click', closeFridge);

/* ================= MODALS ================= */
let raf;
const openModal = (id) => $(id).classList.add('show');
function closeModals() { document.querySelectorAll('.modal.show').forEach((m) => m.classList.remove('show')); cancelAnimationFrame(raf); }
document.querySelectorAll('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m || e.target.hasAttribute('data-close')) closeModals(); }));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModals(); });

/* ================= MAP: CHURCH -> THIRDY'S (real streets from OpenStreetMap) =================
   Set the REAL places here: either "queries" (name/address) or exact lat/lng
   (Google Maps: right-click the spot -> click the coordinates to copy them). */
const PLACES = {
  church:  { name: 'CHURCH',   queries: [], lat: null, lng: null },
  thirdys: { name: "THIRDY'S", queries: ["Thirdy's Food Haus, Davao City", 'Fatima Street, Agdao, Davao City'], lat: null, lng: null },
};
let map, line, car, markers = [], mode = 'car', route = null, runId = 0;
const geoCache = {};
async function geocode(p) {
  if (p.lat != null && p.lng != null) return [p.lat, p.lng];
  for (const q of p.queries) {
    if (geoCache[q]) return geoCache[q];
    try {
      const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=' + encodeURIComponent(q));
      const d = await r.json();
      if (d[0]) return (geoCache[q] = [+d[0].lat, +d[0].lon]);
    } catch (e) { /* try next query */ }
  }
  return null;
}
const dist = (m) => (m >= 1000 ? (m / 1000).toFixed(1) + ' km' : Math.round(m) + ' m');
const hav = (a, b) => {
  const t = (x) => x * Math.PI / 180, s = Math.sin(t(b[0] - a[0]) / 2) ** 2 + Math.cos(t(a[0])) * Math.cos(t(b[0])) * Math.sin(t(b[1] - a[1]) / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(s));
};
const pin = (ll, emoji, label) => L.marker(ll, { icon: L.divIcon({ className: 'pinicon', html: `<div class="pin"><span>${emoji}</span><b>${label}</b></div>`, iconSize: [90, 56], iconAnchor: [45, 38] }) }).addTo(map);
function stepText(s) {
  const m = s.maneuver, name = s.name || 'the road', mod = (m.modifier || '').replace('slight ', 'bear ').replace('sharp ', 'sharp ');
  if (m.type === 'depart') return `Head out on <b>${name}</b>`;
  if (m.type === 'arrive') return `Arrive at <b>${PLACES.thirdys.name}</b>${s.name ? ' · ' + s.name : ''}`;
  if (m.type === 'roundabout' || m.type === 'rotary') return `Take the roundabout onto <b>${name}</b>`;
  if (['turn', 'end of road', 'fork', 'on ramp', 'off ramp'].includes(m.type) && mod && mod !== 'straight') return `Turn ${mod} onto <b>${name}</b>`;
  return `Continue on <b>${name}</b>`;
}
function setNow(t) { $('nowOn').textContent = t; }
async function showRoute() {
  const my = ++runId; cancelAnimationFrame(raf); route = null; $('steps').innerHTML = '';
  if (!window.L) { setNow('The map needs an internet connection. Use the buttons below to open Google Maps.'); return; }
  if (!map) {
    map = L.map('leaf').setView([7.0731, 125.6128], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);
  }
  setTimeout(() => map.invalidateSize(), 80);
  [line, car, ...markers].forEach((l) => l && map.removeLayer(l)); line = car = null; markers = [];
  setNow('Finding the route…');
  const [a, b] = await Promise.all([geocode(PLACES.church), geocode(PLACES.thirdys)]);
  if (my !== runId) return;
  if (b) markers.push(pin(b, '🍽️', PLACES.thirdys.name)); if (a) markers.push(pin(a, '⛪', PLACES.church.name));
  if (!b) { setNow("Couldn't find Thirdy's on the map. Use the buttons below."); return; }
  if (!a) { map.setView(b, 16); setNow("Thirdy's Food Haus is marked on the map. Tap the buttons below for directions."); return; }
  map.fitBounds([a, b], { padding: [50, 50] });
  let data = null;
  try {
    const svc = mode === 'car' ? 'routed-car' : 'routed-foot';
    const r = await fetch(`https://routing.openstreetmap.de/${svc}/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson&steps=true`);
    data = await r.json();
  } catch (e) { /* handled below */ }
  if (my !== runId) return;
  if (!data || !data.routes || !data.routes[0]) { setNow("Couldn't load the route right now. Use the buttons below for directions."); return; }
  const rt = data.routes[0], coords = rt.geometry.coordinates.map((c) => [c[1], c[0]]), steps = rt.legs[0].steps;
  const cum = [0]; for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + hav(coords[i - 1], coords[i]));
  const total = cum[cum.length - 1] || 1, sum = steps.reduce((s, x) => s + x.distance, 0) || 1; let acc = 0;
  const ends = steps.map((s) => (acc += s.distance, acc / sum * total));
  route = { coords, cum, total, steps, ends };
  $('steps').innerHTML = steps.map((s) => `<li>${stepText(s)} <small>${s.distance ? '· ' + dist(s.distance) : ''}</small></li>`).join('');
  playRoute();
}
function playRoute() {
  if (!route) { showRoute(); return; }
  cancelAnimationFrame(raf);
  const { coords, cum, total, steps, ends } = route, items = [...$('steps').children];
  [line, car].forEach((l) => l && map.removeLayer(l));
  line = L.polyline([coords[0]], { color: '#e0594d', weight: 6, opacity: 0.9 }).addTo(map);
  car = L.marker(coords[0], { zIndexOffset: 1000, icon: L.divIcon({ className: 'pinicon', html: `<div class="car">${mode === 'car' ? '🚗' : '🚶'}</div>`, iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(map);
  map.setView(coords[0], 16, { animate: false });
  const dur = matchMedia('(prefers-reduced-motion: reduce)').matches ? 10 : Math.min(16000, Math.max(7000, total * 4));
  let t0 = null, seg = 0, last = -1;
  const step = (t) => {
    if (t0 === null) t0 = t;
    const k = Math.min((t - t0) / dur, 1), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, d = total * e;
    while (seg < cum.length - 2 && cum[seg + 1] < d) seg++;
    const f = (d - cum[seg]) / ((cum[seg + 1] - cum[seg]) || 1), A = coords[seg], B = coords[seg + 1] || A;
    const p = [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f];
    line.setLatLngs(coords.slice(0, seg + 1).concat([p])); car.setLatLng(p); map.panTo(p, { animate: false });
    const idx = k >= 1 ? steps.length - 1 : Math.max(0, ends.findIndex((x) => d <= x));
    if (idx !== last) {
      last = idx; items.forEach((li, i) => { li.className = i < idx ? 'done' : i === idx ? 'on' : ''; });
      setNow(idx === steps.length - 1 && k >= 1 ? `You’ve arrived at ${PLACES.thirdys.name}! 🍽️` : `Now on: ${steps[idx].name || 'the road'}`);
      if (items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
    }
    if (k < 1) raf = requestAnimationFrame(step); else { items.forEach((li) => { li.className = 'done'; }); map.fitBounds(line.getBounds(), { padding: [40, 40] }); }
  };
  raf = requestAnimationFrame(step);
}
document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x === b)); mode = b.dataset.mode; sfx.pop(); showRoute();
}));
$('mapBtn').addEventListener('click', () => { sfx.pop(); openModal('mapModal'); showRoute(); });
$('replay').addEventListener('click', () => { sfx.pop(); playRoute(); });

/* ================= MENU TWIST / PUSH ME / HINT ================= */
$('twistBtn').addEventListener('click', () => { sfx.pop(); toast('🍚 YOU CAN HAVE UNLIMITED RICE', 3000); });
$('pushBtn').addEventListener('click', () => {
  const b = $('pushBtn'); sfx.push(); b.classList.add('pressed');
  setTimeout(() => { b.classList.remove('pressed'); openModal('calcModal'); }, 240);
});
let hintOn = false;
$('hint').addEventListener('click', () => { hintOn = !hintOn; sfx.pop(); $('hintText').textContent = hintOn ? 'Was a debutant last year' : 'tap me'; });

/* ================= CALCULATOR (shows everything you click) ================= */
document.querySelectorAll('.k').forEach((b, i) => b.style.setProperty('--h', (i * 41 + 8) % 360));
let cur = '0', prev = null, op = null, reset = false, justEq = false, expr = '';
const disp = $('calcDisp'), exprEl = $('calcExpr');
const fmt = (n) => String(+n.toFixed(10));
const compute = (a, b, o) => o === '+' ? a + b : o === '-' ? a - b : o === '×' ? a * b : b === 0 ? NaN : a / b;
const sym = (k) => (k === '-' ? '−' : k);
function show() {
  disp.textContent = cur.length > 12 ? Number(cur).toExponential(5) : cur;
  exprEl.textContent = expr || '\u00a0';
}
function check19() { if (cur === '19') { sfx.win(); toast('KKB PO TAYO!', 5000); } }
function press(k) {
  if (cur === 'Error' && k !== 'C') return;
  if (/^\d$/.test(k)) {
    if (justEq) { cur = '0'; expr = ''; justEq = false; }
    if (cur === '0' && !reset && /(^|\s)0$/.test(expr) && k !== '0') expr = expr.slice(0, -1);
    cur = (reset || cur === '0') ? k : cur + k; reset = false; expr += k; sfx.key(k);
  } else if (k === '.') {
    if (justEq) { cur = '0'; expr = ''; justEq = false; reset = false; }
    if (reset) { cur = '0.'; expr += '0.'; reset = false; } else if (!cur.includes('.')) { cur += '.'; expr += '.'; }
    sfx.key('.');
  } else if (k === 'C') {
    cur = '0'; prev = null; op = null; reset = false; justEq = false; expr = ''; sfx.clear();
  } else if (k === '⌫') {
    if (justEq) { expr = ''; justEq = false; }
    else if (!reset && cur !== '0') { cur = cur.length > 1 ? cur.slice(0, -1) : '0'; expr = expr.slice(0, -1); }
    sfx.clear();
  } else if ('+-×÷'.includes(k)) {
    if (justEq) { expr = cur; justEq = false; }
    if (op && !reset) { const r = compute(prev, +cur, op); cur = Number.isFinite(r) ? fmt(r) : 'Error'; check19(); }
    if (/ [+−×÷] $/.test(expr)) expr = expr.replace(/ [+−×÷] $/, ` ${sym(k)} `); else expr += ` ${sym(k)} `;
    prev = +cur; op = k; reset = true; sfx.op();
  } else if (k === '=') {
    if (justEq) { sfx.eq(); }
    else {
      if (op) { const r = compute(prev, +cur, op); cur = Number.isFinite(r) ? fmt(r) : 'Error'; prev = null; op = null; }
      expr = (expr.replace(/ [+−×÷] $/, '') || cur) + ' = ' + cur; reset = true; justEq = true; sfx.eq(); check19();
    }
  }
  show();
}
$('keys').addEventListener('click', (e) => {
  const b = e.target.closest('[data-k]'); if (!b) return;
  b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); press(b.dataset.k);
});
document.addEventListener('keydown', (e) => {
  if (!$('calcModal').classList.contains('show')) return;
  const k = { '*': '×', '/': '÷', Enter: '=', Backspace: '⌫', Delete: 'C' }[e.key] || e.key;
  if (/^[\d.+\-×÷=⌫C]$/.test(k)) { e.preventDefault(); const b = document.querySelector(`[data-k="${CSS.escape(k)}"]`); if (b) { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); } press(k); }
});
show();
