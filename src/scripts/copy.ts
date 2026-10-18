export {};

/** Почта в Connect: клик копирует адрес (ссылка mailto остаётся запасным вариантом без JS). */
const status = document.querySelector<HTMLElement>('[data-copy-status]');
const timers = new WeakMap<HTMLElement, number>();

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // запасной путь: старые браузеры / нет разрешения на clipboard
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    Object.assign(ta.style, { position: 'fixed', opacity: '0', pointerEvents: 'none' });
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

document.querySelectorAll<HTMLAnchorElement>('a[data-copy]').forEach((a) => {
  a.addEventListener('click', async (e) => {
    const value = a.dataset.copy;
    if (!value) return;
    e.preventDefault();
    if (!(await copy(value))) {
      window.location.href = a.href; // не вышло скопировать — открываем почтовый клиент
      return;
    }
    a.setAttribute('data-copied', '');
    if (status) status.textContent = document.documentElement.dataset.lang === 'ru' ? 'Адрес скопирован' : 'Email copied';
    window.clearTimeout(timers.get(a));
    timers.set(
      a,
      window.setTimeout(() => {
        a.removeAttribute('data-copied');
        if (status) status.textContent = '';
      }, 1800),
    );
  });
});
