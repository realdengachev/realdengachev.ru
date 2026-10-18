import { ClothRenderer } from './cloth.js';

// ───────── Геометрия из Figma (узел 83:1347, координаты экрана 385×819) ─────────

const SCREEN_W = 385;
const SCREEN_H = 819;
const PHOTO_W = 118.97, PHOTO_H = 169.96, PHOTO_R = 13.597;
const THUMB_W = 45.5, THUMB_H = 65, THUMB_R = 7.837;
const FOLDER = 169.48;
const FOLDER_HOVER_SCALE = 1.06;
const THUMB_SCALE = THUMB_W / PHOTO_W;

// x, y — левый верхний угол до поворота; rot — градусы против часовой (как в Figma)
const PHOTOS = [
  { src: 'assets/p1.webp', x: 168.522, y: 130.641, rot: 3 },
  { src: 'assets/p2.webp', x: 222.647, y: 177.631, rot: 10 },
  { src: 'assets/p3.webp', x: 89.61, y: 139.31, rot: 0 },
  { src: 'assets/p4.webp', x: 33.44, y: 191.997, rot: -6 },
  { src: 'assets/p5.webp', x: 191.564, y: 200.734, rot: -9 },
  { src: 'assets/p6.webp', x: 92.605, y: 255.696, rot: 9 },
];

const FOLDERS = [
  {
    name: 'Family', count: 43, x: 15.67, y: 539.78, label: { x: 77.39, y: 719.06 }, droppable: true,
    thumbs: [['c2ff1a', 42.354, 71.514, -8], ['f073b8', 19.593, 43.365, 9], ['44d1e5', 70.907, 24.491, -9], ['28f938', 105.311, 53.86, -6], ['632093', 72.494, 82.156, 11]],
  },
  {
    name: 'Weekends', count: 71, x: 200.83, y: 539.78, label: { x: 250.79, y: 719.06, gap: 4.45 }, droppable: true,
    thumbs: [['56d6dc', 56.819, 27.852, 3], ['8d9183', 101.968, 31.349, -7], ['b50cd8', 84.344, 73.137, 12], ['a42f3e', 17.633, 50.401, 13], ['f865d1', 50.94, 79.18, 0]],
  },
  {
    name: 'Music', count: 71, x: 15.67, y: 765.1, label: { x: 80.33, y: 1003.16 },
    thumbs: [['4787ef', 56.82, 27.852, 3], ['be64be', 101.969, 31.349, -7], ['b50cd8', 84.345, 73.137, 12], ['826801', 17.634, 50.401, 13], ['f865d1', 50.94, 79.18, 0]],
  },
  {
    name: 'Cars', count: 43, x: 200.83, y: 765.1, label: { x: 269.4, y: 1003.16 },
    thumbs: [['c2ff1a', 42.354, 71.514, -8], ['d72bfd', 19.593, 43.365, 9], ['9baed3', 70.906, 24.491, -9], ['dfa27d', 105.31, 53.86, -6], ['632093', 72.493, 82.156, 11]],
  },
];

// Куда ложатся новые фото внутри папки: центр (в координатах папки) и поворот
const SLOTS = [[86, 82, -6], [92, 87, 7], [79, 88, -3], [95, 79, 10], [85, 93, -9], [79, 77, 4]];

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEMO = new URLSearchParams(location.search).has('demo');
const $ = (s) => document.querySelector(s);
const device = $('#device');
const screen = $('#screen');
const stackEl = $('#stack');
const foldersEl = $('#folders');
const pantryCount = $('#pantryCount');
const canvas = $('#cloth');

const rad = (deg) => -deg * Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rotate = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const vibrate = (ms) => {
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  navigator.vibrate?.(ms);
};

function figmaToCenter(x, y, w, h, rot) {
  const a = rad(rot);
  const [dx, dy] = rotate(w / 2, h / 2, a);
  return { cx: x + dx, cy: y + dy, a };
}

// ───────── Пружины ─────────

class Spring {
  constructor(x, k, c) { this.x = x; this.t = x; this.v = 0; this.k = k; this.c = c; }
  set(k, c) { this.k = k; this.c = c; return this; }
  step(dt) {
    const a = -this.k * (this.x - this.t) - this.c * this.v;
    this.v += a * dt;
    this.x += this.v * dt;
  }
  rest(eps = 0.01) { return Math.abs(this.x - this.t) < eps && Math.abs(this.v) < eps * 10; }
}

function springEasing(k = 170, c = 17) {
  let x = 0, v = 0, t = 0;
  const dt = 1 / 120, pts = [];
  while (t < 3) {
    v += (-k * (x - 1) - c * v) * dt;
    x += v * dt;
    t += dt;
    pts.push(x);
    if (t > 0.2 && Math.abs(x - 1) < 0.0008 && Math.abs(v) < 0.01) break;
  }
  if (!CSS.supports('transition-timing-function', 'linear(0, 1)')) {
    return { easing: 'cubic-bezier(.34, 1.3, .5, 1)', duration: t * 1000 };
  }
  const step = Math.max(1, Math.floor(pts.length / 48));
  const s = ['0'];
  for (let i = step; i < pts.length; i += step) s.push(pts[i].toFixed(4));
  s.push('1');
  return { easing: `linear(${s.join(',')})`, duration: Math.round(t * 1000) };
}
const SPRING_SOFT = springEasing(140, 15);
const SPRING_BOUNCY = springEasing(260, 14);

// ───────── Состояние и DOM ─────────

let photos = [];
let folders = [];
let pantry = 6;
const images = new Map();

function buildStack() {
  stackEl.textContent = '';
  photos = PHOTOS.map((p, i) => {
    const { cx, cy, a } = figmaToCenter(p.x, p.y, PHOTO_W, PHOTO_H, p.rot);
    const el = document.createElement('div');
    el.className = 'photo';
    el.style.left = `${cx - PHOTO_W / 2}px`;
    el.style.top = `${cy - PHOTO_H / 2}px`;
    el.style.transform = `rotate(${a}rad)`;
    el.innerHTML = `<img src="${p.src}" alt="" draggable="false">`;
    const photo = { ...p, i, cx, cy, a, el, img: images.get(p.src) };
    el.addEventListener('pointerdown', (e) => onPointerDown(e, photo));
    stackEl.append(el);
    return photo;
  });
}

function makeThumb(src, cx, cy, a, fanFrom) {
  const el = document.createElement('div');
  el.className = 'thumb';
  el.style.left = `${cx - THUMB_W / 2}px`;
  el.style.top = `${cy - THUMB_H / 2}px`;
  el.style.transform = `rotate(${a}rad)`;
  if (fanFrom) {
    const dx = cx - FOLDER / 2, dy = cy - FOLDER / 2;
    const len = Math.hypot(dx, dy) || 1;
    el.style.setProperty('--fx', (dx / len).toFixed(3));
    el.style.setProperty('--fy', (dy / len).toFixed(3));
    el.style.setProperty('--fr', (dx > 0 ? 4 : -4).toString());
  } else {
    el.style.setProperty('--fx', '0');
    el.style.setProperty('--fy', '0');
    el.style.setProperty('--fr', '0');
  }
  el.innerHTML = `<img src="${src}" alt="" draggable="false">`;
  return el;
}

function buildFolders() {
  foldersEl.textContent = '';
  folders = FOLDERS.map((f) => {
    const el = document.createElement('div');
    el.className = 'folder';
    el.style.left = `${f.x}px`;
    el.style.top = `${f.y}px`;
    el.innerHTML = '<div class="folder__bg"></div>';
    for (const [hash, x, y, rot] of f.thumbs) {
      const { cx, cy, a } = figmaToCenter(x, y, THUMB_W, THUMB_H, rot);
      el.append(makeThumb(`assets/t_${hash}.webp`, cx, cy, a, true));
    }
    const label = document.createElement('div');
    label.className = 'label';
    label.style.left = `${f.label.x}px`;
    if (f.label.gap) label.style.gap = `${f.label.gap}px`;
    label.style.top = `${f.label.y}px`;
    label.innerHTML = `<span class="label__name">${f.name}</span><span class="label__count"><span>${f.count}</span></span>`;
    foldersEl.append(el, label);
    return { ...f, el, countEl: label.querySelector('.label__count'), n: f.count, drops: 0 };
  });
}

function rollCount(container, value) {
  const old = container.firstElementChild;
  const next = document.createElement('span');
  next.textContent = value;
  next.style.position = 'absolute';
  next.style.inset = '0 auto auto 0';
  container.append(next);
  const o = { duration: 520, easing: 'cubic-bezier(.22, 1, .36, 1)' };
  old.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], o).finished.then(() => {
    old.remove();
    next.style.position = '';
  });
  next.animate([{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], o);
}

function setPantry(n) {
  pantry = n;
  pantryCount.animate(
    [{ opacity: 0.4, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(2px)' }, { opacity: 0.4, filter: 'blur(0)' }],
    { duration: 420, easing: 'ease-out' },
  );
  setTimeout(() => { pantryCount.textContent = `( ${n} )`; }, 160);
}

// ───────── Layout / масштаб ─────────

let renderer = null;
let unit = 1;

function layout() {
  const bare = DEMO || innerWidth < 500;
  document.documentElement.classList.toggle('is-bare', bare);
  const s = bare
    ? innerWidth / SCREEN_W
    : Math.min((innerHeight - 40) / 843, (innerWidth - 40) / 409, 1.2);
  device.style.setProperty('--scale', s);
  unit = s * Math.min(devicePixelRatio || 1, 2.5);
  renderer?.resize(unit);
  draw();
}

function toLocal(e) {
  const r = screen.getBoundingClientRect();
  const s = r.width / SCREEN_W;
  return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
}

// ───────── Ткань: создание, физика, отрисовка ─────────

const cloths = [];
let active = null;

function createCloth(photo, pt) {
  const dx = pt.x - photo.cx, dy = pt.y - photo.cy;
  const [gx, gy] = rotate(dx, dy, -photo.a);
  const c = {
    photo,
    tex: renderer.texture(photo.img),
    cx: new Spring(photo.cx, 520, 30),
    cy: new Spring(photo.cy, 520, 30),
    rot: new Spring(photo.a, 170, 15),
    sc: new Spring(1, 380, 24),
    amp: new Spring(0, 70, 9.5),
    lift: new Spring(0, 260, 26),
    grabMix: new Spring(1, 120, 22),
    grab: [gx, gy],
    pointer: pt,
    time: Math.random() * 50,
    ripT: 0,
    mode: 'drag',
    hover: null,
    releasedAt: 0,
    radiusEnd: THUMB_R,
  };
  c.sc.t = 1.075;
  c.amp.t = reduced ? 0.3 : 1;
  c.lift.t = 1;
  return c;
}

function hitFolder(pt) {
  for (const f of folders) {
    if (!f.droppable) continue;
    const pad = 14;
    if (pt.x > f.x - pad && pt.x < f.x + FOLDER + pad && pt.y > f.y - pad && pt.y < f.y + FOLDER + pad) return f;
  }
  return null;
}

function setHover(c, f) {
  if (c.hover === f) return;
  c.hover?.el.classList.remove('is-target');
  c.hover = f;
  if (f) {
    f.el.classList.add('is-target');
    vibrate(6);
  }
}

function updateCloth(c, dt) {
  if (c.mode === 'drag') {
    const hovering = !!c.hover;
    c.sc.t = hovering ? 0.62 : 1.075;
    const [ox, oy] = rotate(c.grab[0] * c.sc.x, c.grab[1] * c.sc.x, c.rot.x);
    let tx = c.pointer.x - ox, ty = c.pointer.y - oy;
    if (hovering) {
      const fx = c.hover.x + FOLDER / 2, fy = c.hover.y + FOLDER / 2;
      tx = lerp(tx, fx, 0.3);
      ty = lerp(ty, fy, 0.3);
    }
    c.cx.t = tx;
    c.cy.t = ty;
    c.rot.t = c.photo.a * 0.35 + clamp(c.cx.v * 0.00011, -0.24, 0.24);
    c.amp.t = (reduced ? 0.3 : 1) * (hovering ? 0.85 : 1);
  }

  const springs = [c.cx, c.cy, c.rot, c.sc, c.amp, c.lift, c.grabMix];
  const n = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / n;
  for (let i = 0; i < n; i++) for (const s of springs) s.step(h);

  const speed = Math.hypot(c.cx.v, c.cy.v);
  c.time += dt * (0.55 + 1.3 * clamp(speed / 1600, 0, 1));
  c.ripT += dt;

  if (c.mode === 'drop' || c.mode === 'return') {
    const elapsed = performance.now() - c.releasedAt;
    const settled = c.cx.rest(0.35) && c.cy.rest(0.35) && c.sc.rest(0.004) && c.rot.rest(0.004) && Math.abs(c.amp.x) < 0.012;
    if (settled || elapsed > 1500) finishCloth(c);
  }
}

function clothItem(c) {
  const sc = c.sc.x;
  const t = clamp((1 - sc) / (1 - THUMB_SCALE), 0, 1);
  let [vx, vy] = rotate(c.cx.v, c.cy.v, -c.rot.x);
  const vl = Math.hypot(vx, vy);
  if (vl > 2400) { vx *= 2400 / vl; vy *= 2400 / vl; }
  return {
    tex: c.tex,
    cx: c.cx.x,
    cy: c.cy.x,
    w: PHOTO_W * sc,
    h: PHOTO_H * sc,
    rot: c.rot.x,
    radius: lerp(PHOTO_R * sc, c.radiusEnd, t),
    grab: [c.grab[0] * sc * c.grabMix.x, c.grab[1] * sc * c.grabMix.x],
    vel: [vx, vy],
    time: c.time,
    amp: Math.max(0, c.amp.x),
    ripT: c.ripT,
    ripA: reduced ? 0 : 1,
    lift: clamp(c.lift.x, 0, 1.2),
    alpha: 1,
  };
}

function draw() {
  renderer?.draw(cloths.map(clothItem));
}

let raf = 0, last = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 1 / 24);
  last = now;
  for (const c of [...cloths]) updateCloth(c, dt);
  draw();
  raf = cloths.length ? requestAnimationFrame(tick) : 0;
}
function kick() {
  if (raf) return;
  last = performance.now();
  raf = requestAnimationFrame(tick);
}

// ───────── Жесты ─────────

function onPointerDown(e, photo) {
  if (active || !renderer || e.button > 0) return;
  e.preventDefault();
  const pt = toLocal(e);
  const c = createCloth(photo, pt);
  cloths.push(c);
  active = c;
  draw(); // первый кадр ткани совпадает с DOM-фото пиксель в пиксель
  photo.el.classList.add('is-hidden');
  document.documentElement.classList.add('is-dragging');
  vibrate(8);
  addEventListener('pointermove', onPointerMove, { passive: false });
  addEventListener('pointerup', onPointerUp);
  addEventListener('pointercancel', onPointerUp);
  kick();
}

function onPointerMove(e) {
  if (!active) return;
  e.preventDefault();
  active.pointer = toLocal(e);
  setHover(active, hitFolder(active.pointer));
}

function onPointerUp() {
  const c = active;
  if (!c) return;
  active = null;
  removeEventListener('pointermove', onPointerMove);
  removeEventListener('pointerup', onPointerUp);
  removeEventListener('pointercancel', onPointerUp);
  document.documentElement.classList.remove('is-dragging');
  c.releasedAt = performance.now();

  if (c.hover) {
    const f = c.hover;
    const [sx, sy, srot] = SLOTS[f.drops % SLOTS.length];
    f.drops++;
    // Папка раскрыта (scale 1.06 от центра) — целимся в слот с учётом масштаба
    const fcX = f.x + FOLDER / 2, fcY = f.y + FOLDER / 2;
    c.target = { f, sx, sy, a: rad(srot) };
    c.mode = 'drop';
    c.cx.set(300, 28).t = fcX + (sx - FOLDER / 2) * FOLDER_HOVER_SCALE;
    c.cy.set(300, 28).t = fcY + (sy - FOLDER / 2) * FOLDER_HOVER_SCALE;
    c.rot.set(200, 20).t = rad(srot);
    c.sc.set(260, 24).t = THUMB_SCALE * FOLDER_HOVER_SCALE;
    c.amp.set(95, 11).t = 0;
    c.lift.t = 0;
    c.grabMix.t = 0;
    c.radiusEnd = THUMB_R * FOLDER_HOVER_SCALE;
    setPantry(pantry - 1);
    vibrate([4, 30, 10]);
  } else {
    c.mode = 'return';
    c.cx.set(260, 25).t = c.photo.cx;
    c.cy.set(260, 25).t = c.photo.cy;
    c.rot.set(200, 19).t = c.photo.a;
    c.sc.t = 1;
    c.amp.set(80, 11).t = 0;
    c.lift.t = 0;
    c.grabMix.t = 0;
  }
  kick();
}

function finishCloth(c) {
  const idx = cloths.indexOf(c);
  if (idx < 0) return;
  cloths.splice(idx, 1);

  if (c.mode === 'return') {
    c.photo.el.classList.remove('is-hidden');
    draw();
    return;
  }

  const { f, sx, sy, a } = c.target;
  const thumb = makeThumb(c.photo.src, sx, sy, a, false);
  f.el.append(thumb);
  c.photo.el.remove();
  draw();

  // Папка «проглатывает» фото: схлопывает веер и мягко пружинит
  requestAnimationFrame(() => {
    f.el.classList.remove('is-target');
    thumb.style.setProperty('--fx', '0');
    f.el.animate(
      [{ scale: 1 }, { scale: 0.955 }, { scale: 1 }],
      { duration: SPRING_BOUNCY.duration, easing: 'cubic-bezier(.3, 0, .2, 1)', composite: 'add' },
    );
    f.el.querySelector('.folder__bg').animate(
      [{ scale: 1 }, { scale: 1.035 }, { scale: 1 }],
      { duration: 520, easing: 'cubic-bezier(.22, 1, .36, 1)' },
    );
  });

  // Держим в папке не больше 7 превью
  const thumbs = f.el.querySelectorAll('.thumb:not(.is-leaving)');
  if (thumbs.length > 7) {
    const old = thumbs[0];
    old.classList.add('is-leaving');
    setTimeout(() => old.remove(), 420);
  }

  f.n++;
  rollCount(f.countEl, f.n);
  vibrate(12);
}

// ───────── Интро ─────────

function intro() {
  if (reduced) return;
  const { easing, duration } = SPRING_SOFT;
  photos.forEach((p, i) => {
    const r = (i % 2 ? 1 : -1) * (6 + i * 2);
    p.el.animate(
      [{ translate: `${(p.cx - 192) * -0.25}px 80px`, scale: 0.8, rotate: `${r}deg`, opacity: 0 }, { translate: '0 0', scale: 1, rotate: '0deg', opacity: 1 }],
      { duration, easing, delay: 80 + i * 55, fill: 'backwards' },
    );
  });
  $('.sheet').animate([{ translate: '0 70px' }, { translate: '0 0' }], { duration, easing, delay: 40, fill: 'backwards' });
  $('.pantry').animate([{ opacity: 0, translate: '0 16px' }, { opacity: 1, translate: '0 0' }], { duration, easing, delay: 160, fill: 'backwards' });
  [...foldersEl.children].forEach((el, i) => {
    el.animate([{ opacity: 0, translate: '0 40px' }, { opacity: 1, translate: '0 0' }], { duration, easing, delay: 200 + Math.floor(i / 2) * 50 + (i % 2) * 20, fill: 'backwards' });
  });
  for (const sel of ['.logo', '.upload']) {
    $(sel).animate([{ opacity: 0, translate: '0 -8px' }, { opacity: 1, translate: '0 0' }], { duration: 600, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
  }
}

function reset() {
  if (active || cloths.length) return;
  buildStack();
  buildFolders();
  pantry = 6;
  pantryCount.textContent = '( 6 )';
  intro();
}

// ───────── Старт ─────────

async function boot() {
  await Promise.all(PHOTOS.map(async (p) => {
    const img = new Image();
    img.src = p.src;
    await img.decode();
    images.set(p.src, img);
  }));
  try {
    renderer = new ClothRenderer(canvas, SCREEN_W, SCREEN_H);
    for (const img of images.values()) renderer.texture(img);
  } catch (err) {
    console.error(err);
  }
  buildStack();
  buildFolders();
  layout();
  await document.fonts?.ready;
  if (!DEMO) intro();
}

// ?overlay — полупрозрачный эталон из Figma поверх вёрстки для сверки
if (new URLSearchParams(location.search).has('overlay')) {
  const ref = new Image();
  ref.src = 'ref/reference.png';
  ref.className = 'overlay';
  device.append(ref);
}

addEventListener('resize', layout);
$('#logo').addEventListener('click', reset);
screen.addEventListener('contextmenu', (e) => e.preventDefault());
const ready = boot();

// Хуки для отладки и демо-сценария (demo.js)
window.__pantry = {
  cloths,
  ready,
  reset,
  renderer: () => renderer,
  photos: () => photos,
  folders: () => folders,
  isIdle: () => !active && !cloths.length,
};
