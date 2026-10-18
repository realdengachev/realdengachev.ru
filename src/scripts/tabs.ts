export {};
/** Переключение табов: уходящая панель мягко гаснет, высота контейнера плавно подстраивается, новая панель выезжает со stagger. */
const TABS = ['all', 'work', 'story', 'connect'] as const;
type TabId = (typeof TABS)[number];

const OUT = { duration: 220, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
const HEIGHT = { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
const IN = { duration: 650, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', stagger: 70, delay: 140 };

const root = document.documentElement;
const panelsEl = document.querySelector<HTMLElement>('[data-panels]');
const tabEls = [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

const isTab = (v: string | undefined): v is TabId => !!v && (TABS as readonly string[]).includes(v);
const panelOf = (id: TabId): HTMLElement | null => document.getElementById(`panel-${id}`);
let current: TabId = isTab(root.dataset.tab) ? root.dataset.tab : 'all';
let token = 0;

function markTabs(id: TabId): void {
  tabEls.forEach((t) => {
    const on = t.dataset.tab === id;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
  });
}

async function select(id: TabId, { focus = false } = {}): Promise<void> {
  if (id === current || !panelsEl) return;
  const from = panelOf(current);
  const to = panelOf(id);
  const run = ++token;
  current = id;
  markTabs(id);
  history.replaceState(null, '', id === 'all' ? location.pathname + location.search : `#${id}`);
  if (focus) tabEls.find((t) => t.dataset.tab === id)?.focus();

  if (!from || !to || reduce.matches || document.hidden) {
    root.dataset.tab = id;
    return;
  }

  const h0 = panelsEl.offsetHeight;
  panelsEl.style.height = `${h0}px`;
  panelsEl.style.overflow = 'clip';
  panelsEl.style.setProperty('overflow-clip-margin', '48px');

  await from.animate(
    [{ opacity: 1, transform: 'translate3d(0,0,0)' }, { opacity: 0, transform: 'translate3d(0,-8px,0)' }],
    { ...OUT, fill: 'forwards' },
  ).finished.catch(() => undefined);
  if (run !== token) return;

  root.dataset.tab = id; // CSS переключает видимые панели
  from.getAnimations().forEach((a) => a.cancel());

  const h1 = to.offsetHeight;
  const heightAnim = panelsEl.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { ...HEIGHT, fill: 'forwards' });

  const items = [...to.querySelectorAll<HTMLElement>('[data-enter]')];
  const targets = items.length ? items : [to];
  targets.forEach((el, i) => {
    el.animate(
      [{ opacity: 0, transform: 'translate3d(0,14px,0)' }, { opacity: 1, transform: 'translate3d(0,0,0)' }],
      { duration: IN.duration, easing: IN.easing, delay: IN.delay + i * IN.stagger, fill: 'backwards' },
    );
  });

  await heightAnim.finished.catch(() => undefined);
  if (run !== token) return;
  heightAnim.cancel();
  panelsEl.style.height = '';
  panelsEl.style.overflow = '';
  panelsEl.style.removeProperty('overflow-clip-margin');
}

tabEls.forEach((t) => {
  t.addEventListener('click', () => {
    const id = t.dataset.tab;
    if (isTab(id)) void select(id);
  });
  t.addEventListener('keydown', (e) => {
    const i = tabEls.indexOf(t);
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabEls.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    const id = tabEls[(next + tabEls.length) % tabEls.length]?.dataset.tab;
    if (isTab(id)) void select(id, { focus: true });
  });
});

window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (isTab(id)) void select(id);
  else if (!id) void select('all');
});

markTabs(current);

// ссылки пока никуда не ведут: «#» не должен прыгать к началу страницы
document.addEventListener('click', (e) => {
  const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href="#"]');
  if (a) e.preventDefault();
});

// стартовый reveal проигрывается один раз: иначе CSS-анимация перезапускается при каждом показе панели
document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
  if (el.closest('.panel') && el.closest('.panel') !== panelOf(current)) {
    el.removeAttribute('data-reveal');
    return;
  }
  el.addEventListener('animationend', () => el.removeAttribute('data-reveal'), { once: true });
});
