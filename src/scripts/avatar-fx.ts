export {};

/**
 * Мобильная анимация аватара (как в профиле Telegram): при скролле вниз фото уменьшается и «втягивается»
 * в закреплённую шапку до размера кнопок-иконок; при скролле вверх так же вытягивается обратно.
 * Форма капли между фото и точкой в шапке — метабол-эффект (SVG: blur + порог по альфе в маске).
 * Состояние зависит только от scrollY, поэтому анимация симметрична в обе стороны.
 */
const root = document.documentElement;
const mq = matchMedia('(max-width: 767px)');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const avatar = document.querySelector<HTMLElement>('.avatar');
const svg = document.querySelector<SVGSVGElement>('[data-avfx]');

const DOCK = 0.85; // доля пути до шапки, на которой фото уже полностью «втянуто»

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const smooth = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

if (avatar && svg) {
  const q = <T extends Element>(k: string): T => svg.querySelector<T>(`[data-fx="${k}"]`) as T;
  const m = q<SVGCircleElement>('m');
  const a = q<SVGCircleElement>('a');
  const cm = q<SVGCircleElement>('cm');
  const ca = q<SVGCircleElement>('ca');
  const im = q<SVGImageElement>('im');
  const ia = q<SVGImageElement>('ia');

  let docTop = 0;
  let r0 = 48;
  let natX = 0;
  let slotX = 0;
  let slotY = 0;
  let r1 = 16;
  let active = false;
  let range = 100; // px скролла до стыковки с шапкой

  const setCircle = (c: SVGCircleElement, x: number, y: number, r: number): void => {
    c.setAttribute('cx', x.toFixed(2));
    c.setAttribute('cy', y.toFixed(2));
    c.setAttribute('r', Math.max(0, r).toFixed(2));
  };
  const setImage = (img: SVGImageElement, x: number, y: number, r: number): void => {
    const d = Math.max(0, r) * 2;
    img.setAttribute('x', (x - r).toFixed(2));
    img.setAttribute('y', (y - r).toFixed(2));
    img.setAttribute('width', d.toFixed(2));
    img.setAttribute('height', d.toFixed(2));
    img.style.display = r < 0.5 ? 'none' : '';
  };

  const measure = (): void => {
    const ar = avatar.getBoundingClientRect();
    const ctl = document.querySelector<HTMLElement>('.ctl');
    const size = ctl ? ctl.offsetHeight : 32;
    const cr = ctl ? ctl.getBoundingClientRect() : ({ top: 12 } as DOMRect);
    r0 = avatar.offsetWidth / 2;
    docTop = ar.top + window.scrollY;
    natX = ar.left + r0;
    r1 = size / 2;
    slotX = ar.left + r1;
    slotY = cr.top + r1;
    range = Math.max(40, (docTop + r0 - slotY) * DOCK);
  };

  const update = (): void => {
    const s = window.scrollY;
    root.classList.toggle('avfx-scrolled', s > 6);
    const natY = docTop + r0 - s;
    const prog = clamp01(s / range);
    if (prog <= 0) {
      svg.style.display = 'none';
      avatar.style.visibility = '';
      return;
    }
    svg.style.display = 'block';
    avatar.style.visibility = 'hidden';
    const e = smooth(prog);
    const cx = lerp(natX, slotX, e);
    const cy = lerp(natY, slotY, e);
    const r = lerp(r0, r1, e);
    // якорь в шапке растёт навстречу фото — между ними образуется «шейка»
    const ra = r1 * smooth(clamp01((prog - 0.05) / 0.5));
    setCircle(m, cx, cy, r);
    setCircle(cm, cx, cy, r);
    setImage(im, cx, cy, r);
    setCircle(a, slotX, slotY, ra);
    setCircle(ca, slotX, slotY, ra);
    setImage(ia, slotX, slotY, ra);
  };

  // scroll-события приходят раз в кадр, отдельный rAF не нужен (так анимация не отстаёт от прокрутки)
  const onScroll = (): void => update();

  const enable = (): void => {
    if (active) return;
    active = true;
    root.classList.add('avfx-on');
    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
  };
  const disable = (): void => {
    if (!active) return;
    active = false;
    root.classList.remove('avfx-on', 'avfx-scrolled');
    window.removeEventListener('scroll', onScroll);
    svg.style.display = 'none';
    avatar.style.visibility = '';
  };
  const sync = (): void => {
    if (mq.matches && !reduce.matches) {
      enable();
      measure();
      update();
    } else {
      disable();
    }
  };

  mq.addEventListener('change', sync);
  reduce.addEventListener('change', sync);
  window.addEventListener('resize', () => {
    if (active) {
      measure();
      update();
    }
  });
  void document.fonts?.ready.then(() => {
    if (active) {
      measure();
      update();
    }
  });
  sync();
}
