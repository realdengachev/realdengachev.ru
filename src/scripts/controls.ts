export {};
/** Переключатели темы и языка (иконки-пилюли: при hover раскрывается подпись с текущим значением). */
type Theme = 'light' | 'dark';
type Lang = 'en' | 'ru';
interface Dict {
  theme: { label: Record<Lang, string>; names: Record<Theme, Record<Lang, string>> };
  language: { label: Record<Lang, string>; names: Record<Lang, string> };
  title: string;
  titleRu: string;
}

const root = document.documentElement;
const dictEl = document.querySelector<HTMLScriptElement>('[data-ctl-dict]');
const themeBtn = document.querySelector<HTMLButtonElement>('#theme-btn');
const langBtn = document.querySelector<HTMLButtonElement>('#lang-btn');
const themeIcon = document.querySelector<SVGElement>('#theme-icon');
const langIcon = document.querySelector<SVGElement>('#lang-icon');

const MOON =
  '<path d="M6.04458 1.60806C6.1589 1.35528 6.10472 1.05812 5.90855 0.861947C5.71237 0.665775 5.41522 0.611597 5.16244 0.725914C2.51258 1.92428 0.666626 4.59176 0.666626 7.69181C0.666626 11.9121 4.08786 15.3334 8.30817 15.3334C11.4082 15.3334 14.0757 13.4874 15.2741 10.8375C15.3884 10.5848 15.3342 10.2876 15.138 10.0914C14.9419 9.89526 14.6447 9.84108 14.3919 9.9554C13.6009 10.3131 12.7225 10.5126 11.7956 10.5126C8.31168 10.5126 5.4874 7.6883 5.4874 4.20438C5.4874 3.27752 5.68686 2.39905 6.04458 1.60806Z" fill="currentColor"/>';
const SUN =
  '<path d="M8.66663 1.33333C8.66663 0.965143 8.36815 0.666666 7.99996 0.666666C7.63177 0.666666 7.33329 0.965143 7.33329 1.33333V2.66667C7.33329 3.03486 7.63177 3.33333 7.99996 3.33333C8.36815 3.33333 8.66663 3.03486 8.66663 2.66667V1.33333Z" fill="currentColor"/><path d="M8.66663 13.3333C8.66663 12.9651 8.36815 12.6667 7.99996 12.6667C7.63177 12.6667 7.33329 12.9651 7.33329 13.3333V14.6667C7.33329 15.0349 7.63177 15.3333 7.99996 15.3333C8.36815 15.3333 8.66663 15.0349 8.66663 14.6667V13.3333Z" fill="currentColor"/><path d="M0.666626 8C0.666626 7.63181 0.965103 7.33333 1.33329 7.33333H2.66663C3.03482 7.33333 3.33329 7.63181 3.33329 8C3.33329 8.36819 3.03482 8.66667 2.66663 8.66667H1.33329C0.965103 8.66667 0.666626 8.36819 0.666626 8Z" fill="currentColor"/><path d="M3.73797 2.7952C3.47762 2.53485 3.05551 2.53485 2.79516 2.7952C2.53481 3.05555 2.53481 3.47766 2.79516 3.73801L3.73797 4.68081C3.99831 4.94116 4.42042 4.94116 4.68077 4.68081C4.94112 4.42046 4.94112 3.99836 4.68077 3.73801L3.73797 2.7952Z" fill="currentColor"/><path d="M13.2048 2.7952C13.4651 3.05555 13.4651 3.47766 13.2048 3.73801L12.262 4.68081C12.0016 4.94116 11.5795 4.94116 11.3192 4.68081C11.0588 4.42046 11.0588 3.99836 11.3192 3.73801L12.262 2.7952C12.5223 2.53485 12.9444 2.53485 13.2048 2.7952Z" fill="currentColor"/><path d="M4.68077 12.2647C4.94112 12.0043 4.94112 11.5822 4.68077 11.3219C4.42042 11.0615 3.99831 11.0615 3.73797 11.3219L2.79516 12.2647C2.53481 12.525 2.53481 12.9472 2.79516 13.2075C3.05551 13.4679 3.47762 13.4679 3.73797 13.2075L4.68077 12.2647Z" fill="currentColor"/><path d="M11.3192 11.3219C11.5795 11.0615 12.0016 11.0615 12.262 11.3219L13.2048 12.2647C13.4651 12.525 13.4651 12.9472 13.2048 13.2075C12.9444 13.4679 12.5223 13.4679 12.262 13.2075L11.3192 12.2647C11.0588 12.0043 11.0588 11.5822 11.3192 11.3219Z" fill="currentColor"/><path d="M13.3333 7.33333C12.9651 7.33333 12.6666 7.63181 12.6666 8C12.6666 8.36819 12.9651 8.66667 13.3333 8.66667H14.6666C15.0348 8.66667 15.3333 8.36819 15.3333 8C15.3333 7.63181 15.0348 7.33333 14.6666 7.33333H13.3333Z" fill="currentColor"/><path d="M7.99996 4C5.79082 4 3.99996 5.79086 3.99996 8C3.99996 10.2091 5.79082 12 7.99996 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 7.99996 4Z" fill="currentColor"/>';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const dict: Dict | null = dictEl?.textContent ? (JSON.parse(dictEl.textContent) as Dict) : null;

let theme: Theme = root.dataset.theme === 'dark' ? 'dark' : 'light';
let lang: Lang = root.dataset.lang === 'ru' ? 'ru' : 'en';

const save = (k: string, v: string): void => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* приватный режим — не критично */
  }
};

/** Подпись пилюли + ширина раскрытия (иконка 16 + отступы + текст). */
function setLabel(btn: HTMLButtonElement, text: string, animate: boolean): void {
  const label = btn.querySelector<HTMLElement>('[data-label]');
  if (!label) return;
  const apply = (): void => {
    label.textContent = text;
    btn.style.setProperty('--w-open', `${8 + 16 + 6 + Math.ceil(label.offsetWidth) + 12}px`);
  };
  if (!animate || reduce.matches) {
    apply();
    return;
  }
  label.classList.add('is-swap');
  window.setTimeout(() => {
    apply();
    label.classList.remove('is-swap');
  }, 130);
}

function morphIcon(icon: SVGElement | null, swap: () => void): void {
  if (!icon) return swap();
  if (reduce.matches) {
    swap();
    return;
  }
  icon.classList.add('morph-out');
  window.setTimeout(() => {
    swap();
    icon.classList.remove('morph-out');
  }, 250);
}

function renderTheme(animate: boolean): void {
  if (!dict || !themeBtn) return;
  const name = dict.theme.names[theme][lang];
  const other = dict.theme.names[theme === 'light' ? 'dark' : 'light'][lang];
  setLabel(themeBtn, name, animate);
  themeBtn.setAttribute(
    'aria-label',
    lang === 'ru' ? `${dict.theme.label.ru}: ${name}. Переключить на: ${other.toLowerCase()}` : `${dict.theme.label.en}: ${name}. Switch to ${other.toLowerCase()}`,
  );
  const swap = (): void => {
    if (themeIcon) themeIcon.innerHTML = theme === 'light' ? MOON : SUN; // светлая — луна (→ тёмная), тёмная — солнце
  };
  if (animate) morphIcon(themeIcon, swap);
  else swap();
}

function renderLang(animate: boolean): void {
  if (!dict || !langBtn) return;
  const name = dict.language.names[lang];
  setLabel(langBtn, name, animate);
  const other = dict.language.names[lang === 'en' ? 'ru' : 'en'];
  langBtn.setAttribute(
    'aria-label',
    lang === 'ru' ? `${dict.language.label.ru}: ${name}. Переключить на: ${other}` : `${dict.language.label.en}: ${name}. Switch to ${other}`,
  );
}

function applyLang(next: Lang): void {
  lang = next;
  root.dataset.lang = next;
  root.lang = next;
  save('lang', next);
  document.title = next === 'ru' ? (dict?.titleRu ?? document.title) : (dict?.title ?? document.title);
  document.querySelectorAll<HTMLElement>('[data-aria-ru]').forEach((el) => {
    if (!el.dataset.ariaEn) el.dataset.ariaEn = el.getAttribute('aria-label') ?? '';
    el.setAttribute('aria-label', next === 'ru' ? (el.dataset.ariaRu ?? '') : (el.dataset.ariaEn ?? ''));
  });
  renderLang(true);
  renderTheme(false);
}

themeBtn?.addEventListener('click', () => {
  theme = theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = theme; // цвета плавно анимируются через @property (см. tokens.css)
  save('theme', theme);
  renderTheme(true);
});

langBtn?.addEventListener('click', () => {
  const next: Lang = lang === 'en' ? 'ru' : 'en';
  langIcon?.classList.add('morph-out');
  window.setTimeout(() => langIcon?.classList.remove('morph-out'), 250);
  if (reduce.matches) {
    applyLang(next);
    return;
  }
  root.classList.add('lang-out');
  window.setTimeout(() => {
    root.classList.remove('lang-out');
    applyLang(next);
    root.classList.add('lang-in');
    window.setTimeout(() => root.classList.remove('lang-in'), 360);
  }, 190);
});

// начальное состояние (язык мог быть сохранён)
if (lang === 'ru') applyLang('ru');
renderTheme(false);
renderLang(false);
void document.fonts?.ready.then(() => {
  renderTheme(false);
  renderLang(false);
});
