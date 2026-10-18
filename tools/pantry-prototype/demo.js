// ?demo — сценарий скринкаста: запуск приложения → выбор фото с матчей и удержание
// (видны изгибы) → перенос в Weekends → заставка. Цикл бесшовный: первый и последний
// кадр — заставка. ?demo&record — запуск по команде записи (window.__demo.go()).

const params = new URLSearchParams(location.search);
const RECORD = params.has('record');

export const CYCLE = 7400;

if (params.has('demo')) main();

async function main() {
  const P = window.__pantry;
  await P.ready;
  await document.fonts?.ready;

  const screen = document.getElementById('screen');
  const style = document.createElement('style');
  style.textContent = `
    .splash {
      position: absolute; inset: 0; z-index: 6;
      display: grid; place-items: center;
      background: var(--bg);
      pointer-events: none;
    }
    .splash img { width: 72px; height: auto; }
    .touch {
      position: absolute; left: 0; top: 0; z-index: 4;
      width: 42px; height: 42px; margin: -21px 0 0 -21px;
      border-radius: 50%;
      background: rgba(118, 118, 128, .34);
      box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, .6), 0 2px 10px rgba(0, 0, 0, .12);
      opacity: 0;
      pointer-events: none;
    }
    .is-demo .device, .is-demo .device * { cursor: auto !important; }
  `;
  document.head.append(style);
  document.documentElement.classList.add('is-demo');

  const splash = document.createElement('div');
  splash.className = 'splash';
  splash.innerHTML = '<img src="assets/logo.svg" alt="" draggable="false">';
  const logo = splash.firstElementChild;
  const touch = document.createElement('div');
  touch.className = 'touch';
  screen.append(touch, splash);

  const frame = () => new Promise((r) => requestAnimationFrame(r));
  const until = (t0, ms) => new Promise((r) => setTimeout(r, Math.max(0, t0 + ms - performance.now())));
  async function tween(ms, fn) {
    const t0 = performance.now();
    for (;;) {
      const t = Math.min(1, (performance.now() - t0) / ms);
      fn(t);
      if (t >= 1) return;
      await frame();
    }
  }
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const bez = (a, b, c, d, t) => {
    const u = 1 - t;
    return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
  };

  function client(pt) {
    const r = screen.getBoundingClientRect();
    const s = r.width / 385;
    return { clientX: r.left + pt.x * s, clientY: r.top + pt.y * s };
  }
  const ev = (pt) => ({ ...client(pt), pointerId: 1, isPrimary: true, bubbles: true, button: 0, pointerType: 'touch' });
  let touchScale = 1;
  let touchOpacity = 0;
  let cur = { x: 0, y: 0 };
  function moveTouch(pt) {
    cur = pt;
    touch.style.transform = `translate(${pt.x}px, ${pt.y}px) scale(${touchScale})`;
    touch.style.opacity = touchOpacity;
  }
  function move(pt) {
    moveTouch(pt);
    window.dispatchEvent(new PointerEvent('pointermove', ev(pt)));
  }

  async function cycle() {
    const t0 = performance.now();
    splash.style.opacity = 1;
    logo.style.opacity = 1;
    logo.style.transform = 'scale(1)';

    // 1. Запуск приложения: логотип уходит, затем экран собирается уже на виду
    const content = ['#stack', '#folders', '.sheet', '.logo', '.upload'].map((s) => document.querySelector(s));
    content.forEach((el) => { el.style.visibility = 'hidden'; });
    await until(t0, 380);
    await tween(300, (t) => {
      const e = easeOut(t);
      logo.style.opacity = 1 - e;
      logo.style.transform = `scale(${1 - 0.14 * e})`;
    });
    splash.style.opacity = 0;
    await until(t0, 720);
    content.forEach((el) => { el.style.visibility = ''; });
    P.reset();

    // 2. Касание фото с матчей
    const photo = P.photos()[5];
    const start = { x: photo.cx - 8, y: photo.cy + 14 };
    await until(t0, 1950);
    touchScale = 0.6;
    await tween(170, (t) => {
      touchOpacity = easeOut(t);
      touchScale = 0.6 + 0.4 * easeOut(t);
      moveTouch(start);
    });
    photo.el.dispatchEvent(new PointerEvent('pointerdown', ev(start)));
    tween(160, (t) => { touchScale = 1 - 0.12 * easeOut(t); moveTouch(cur); });

    // 3. Удержание: лёгкое покачивание, чтобы было видно «платок»
    await until(t0, 2150);
    await tween(1500, (t) => {
      const env = Math.sin(Math.PI * Math.min(1, t * 1.6)) * 0.35 + Math.min(1, t * 2) * 0.65;
      move({
        x: start.x + Math.sin(t * Math.PI * 2 * 1.25) * 11 * env,
        y: start.y + Math.sin(t * Math.PI * 2 * 0.85) * 7 * env,
      });
    });

    // 4. Перенос в Weekends
    const f = P.folders()[1];
    const end = { x: f.x + 84.74 + 6, y: f.y + 84.74 - 4 };
    const p0 = { ...cur };
    const p1 = { x: p0.x + 70, y: p0.y + 30 };
    const p2 = { x: end.x - 20, y: end.y - 120 };
    await tween(1000, (t) => {
      const e = ease(t);
      move({ x: bez(p0.x, p1.x, p2.x, end.x, e), y: bez(p0.y, p1.y, p2.y, end.y, e) });
    });
    await tween(300, (t) => move({ x: end.x + 3 * t, y: end.y + 4 * t }));

    // 5. Отпускание
    await until(t0, 5000);
    window.dispatchEvent(new PointerEvent('pointerup', ev(cur)));
    tween(260, (t) => {
      const e = easeOut(t);
      touchOpacity = 1 - e;
      touchScale = 0.88 + 0.5 * e;
      moveTouch(cur);
    });

    // 6. Заставка — возврат к первому кадру
    await until(t0, 6650);
    await tween(420, (t) => { splash.style.opacity = easeOut(t); });
    logo.style.transform = 'scale(1.08)';
    await tween(300, (t) => {
      const e = easeOut(t);
      logo.style.opacity = e;
      logo.style.transform = `scale(${1.08 - 0.08 * e})`;
    });
    await until(t0, CYCLE);
  }

  // Стартовый кадр — заставка
  splash.style.opacity = 1;

  if (RECORD) {
    let go;
    const started = new Promise((r) => { go = r; });
    window.__demo = { ready: true, cycle: CYCLE, go: () => go() };
    await started;
    cycle();
    return;
  }
  for (;;) await cycle();
}
