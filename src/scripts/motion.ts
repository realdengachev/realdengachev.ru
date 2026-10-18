import { lensZone, trackX } from './loop';

/** Параметры механики — см. docs/motion-catalog.md */
const WHEEL_SPEED = 0.7; // px ленты на 1px прокрутки колеса (референс: 1.0)
const FOLLOW = 9; // жёсткость догоняния цели, 1/с (больше — резче)
const DRAG_FOLLOW = 28;
const FLING = 0.22; // секунд «инерции» после отпускания drag
const LENS_MARGIN = 160; // запас по краям линзы, px (= --lens-m в CSS)
// мягкий «изгиб» к краям экрана (как arseniivostrikov.com): без цветовых смещений, только лёгкая кривизна: у краёв карточки крупнее, к центру — обычный размер
const LENS_FULL = { shiftX: 0.03, squeezeY: 0.06, start: 0.55 };
const LENS_SOFT = { shiftX: 0.022, squeezeY: 0.04, start: 0.5 }; // мобильный: мягче
const isCompact = (): boolean => matchMedia('(max-width: 767px)').matches;

const root = document.documentElement;

function setupLens(gallery: HTMLElement, lens: HTMLElement): () => void {
  const map = document.querySelector<SVGFEImageElement>('[data-lens-map]');
  const disp = document.querySelector<SVGFEDisplacementMapElement>('[data-lens-disp]');
  if (!map || !disp) return () => {};

  const build = (): void => {
    if (isCompact()) return; // на телефонах линзу рисуют трансформации карточек (см. infiniteGallery)
    const vw = gallery.clientWidth;
    const w = vw + LENS_MARGIN * 2;
    const h = lens.offsetHeight;
    if (!vw || !h) return;
    const half = vw / 2;
    const L = isCompact() ? LENS_SOFT : LENS_FULL;
    const maxShift = Math.max(L.shiftX * half, L.squeezeY * (h / 2));
    const range = Math.max(maxShift * 2 * 1.15, 24); // диапазон карты смещений (px)

    const cw = Math.ceil(w / 2);
    const ch = Math.ceil(h / 2);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(cw, ch);
    for (let j = 0; j < ch; j++) {
      const y = (j + 0.5) * 2;
      for (let i = 0; i < cw; i++) {
        const u = ((i + 0.5) * 2 - w / 2) / half;
        const z = lensZone(u, L.start);
        const dx = -Math.sign(u) * L.shiftX * half * z; // берём источник ближе к центру → у краёв карточки крупнее
        const dy = -(y - h / 2) * L.squeezeY * z;
        const k = (j * cw + i) * 4;
        img.data[k] = Math.round(255 * (0.5 + dx / range));
        img.data[k + 1] = Math.round(255 * (0.5 + dy / range));
        img.data[k + 2] = 0;
        img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    map.setAttribute('href', canvas.toDataURL('image/png'));
    map.setAttribute('x', '0');
    map.setAttribute('y', '0');
    map.setAttribute('width', String(w));
    map.setAttribute('height', String(h));
    disp.setAttribute('scale', String(range));
  };

  const ro = new ResizeObserver(build);
  ro.observe(gallery);
  build();
  return () => {
    ro.disconnect();
  };
}

function infiniteGallery(): () => void {
  const gallery = document.querySelector<HTMLElement>('[data-gallery]');
  const lens = document.querySelector<HTMLElement>('[data-lens]');
  const track = document.querySelector<HTMLElement>('[data-track]');
  const firstSet = document.querySelector<HTMLElement>('[data-set]');
  if (!gallery || !lens || !track || !firstSet) return () => {};

  let period = 2780;
  let pos = 0; // текущая позиция (px ленты, без заворота)
  let target = 0;
  let follow = FOLLOW;
  let raf = 0;
  let last = 0;
  let idleTimer = 0;

  // Линза (SVG-фильтр) — только на десктопе; на телефонах отключена
  const compact = matchMedia('(max-width: 767px)');
  const syncLensMode = (): void => {
    gallery.dataset.lens = compact.matches ? 'none' : 'svg';
  };

  const origin = (): number => LENS_MARGIN + (parseFloat(getComputedStyle(gallery).getPropertyValue('--gutter')) || 16);
  const render = (): void => {
    track.style.transform = `translate3d(${trackX(pos, period, origin()).toFixed(2)}px,0,0)`;
  };

  const measure = (): void => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    period = firstSet.getBoundingClientRect().width + gap;
    render();
  };

  const frame = (t: number): void => {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    pos += (target - pos) * (1 - Math.exp(-follow * dt));
    // держим числа небольшими: сдвигаем обе позиции на целое число периодов
    if (Math.abs(pos) > period * 50) {
      const shift = Math.trunc(pos / period) * period;
      pos -= shift;
      target -= shift;
    }
    render();
    if (Math.abs(target - pos) > 0.05) {
      raf = requestAnimationFrame(frame);
    } else {
      pos = target;
      render();
      raf = 0;
      idleTimer = window.setTimeout(() => gallery.classList.remove('is-moving'), 150);
    }
  };

  const kick = (): void => {
    window.clearTimeout(idleTimer);
    gallery.classList.add('is-moving');
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  const onWheel = (e: WheelEvent): void => {
    if (e.ctrlKey) return; // pinch-zoom
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? gallery.clientWidth : 1;
    const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * unit;
    e.preventDefault();
    follow = FOLLOW;
    target += delta * WHEEL_SPEED;
    kick();
  };

  // drag: захват указателя только после сдвига > 6px — иначе обычный тап/клик по карточке-ссылке проходит как есть
  const THRESHOLD = 6;
  let pending = false;
  let dragging = false;
  let suppressClick = false;
  let downX = 0;
  let startX = 0;
  let startTarget = 0;
  let vel = 0;
  let lastX = 0;
  let lastT = 0;
  const onDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    pending = true;
    dragging = false;
    downX = startX = lastX = e.clientX;
    startTarget = target;
    lastT = e.timeStamp;
    vel = 0;
  };
  const onMove = (e: PointerEvent): void => {
    if (!pending) return;
    if (!dragging) {
      if (Math.abs(e.clientX - downX) < THRESHOLD) return;
      dragging = true;
      follow = DRAG_FOLLOW;
      gallery.classList.add('is-dragging');
      gallery.setPointerCapture(e.pointerId);
      startX = lastX = e.clientX;
      startTarget = target;
      lastT = e.timeStamp;
    }
    target = startTarget - (e.clientX - startX);
    const dt = e.timeStamp - lastT;
    if (dt > 0) vel = (e.clientX - lastX) / dt; // px/ms
    lastX = e.clientX;
    lastT = e.timeStamp;
    kick();
  };
  const onUp = (e: PointerEvent): void => {
    if (!pending) return;
    pending = false;
    if (!dragging) return;
    dragging = false;
    suppressClick = true; // клик, закончивший перетаскивание, не должен открывать ссылку
    window.setTimeout(() => (suppressClick = false), 0);
    gallery.classList.remove('is-dragging');
    if (gallery.hasPointerCapture(e.pointerId)) gallery.releasePointerCapture(e.pointerId);
    follow = FOLLOW;
    if (e.timeStamp - lastT < 80) target -= vel * FLING * 1000; // инерция
    kick();
  };
  const onClickCapture = (e: MouseEvent): void => {
    if (!suppressClick) return;
    e.preventDefault();
    e.stopPropagation();
  };

  gallery.addEventListener('wheel', onWheel, { passive: false });
  gallery.addEventListener('pointerdown', onDown);
  gallery.addEventListener('pointermove', onMove);
  gallery.addEventListener('pointerup', onUp);
  gallery.addEventListener('pointercancel', onUp);
  gallery.addEventListener('click', onClickCapture, true);

  const ro = new ResizeObserver(measure);
  ro.observe(firstSet);
  measure();
  compact.addEventListener('change', syncLensMode);
  syncLensMode();
  const disposeLens = setupLens(gallery, lens);

  return () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(idleTimer);
    ro.disconnect();
    disposeLens();
    gallery.removeEventListener('wheel', onWheel);
    gallery.removeEventListener('pointerdown', onDown);
    gallery.removeEventListener('pointermove', onMove);
    gallery.removeEventListener('pointerup', onUp);
    gallery.removeEventListener('pointercancel', onUp);
    gallery.removeEventListener('click', onClickCapture, true);
    compact.removeEventListener('change', syncLensMode);
    track.style.transform = '';
  };
}

let destroy: (() => void) | null = root.classList.contains('motion') ? infiniteGallery() : null;

// если пользователь включит reduced-motion во время сессии — выключаем механику
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
  if (e.matches) {
    destroy?.();
    destroy = null;
    root.classList.remove('motion');
  }
});
