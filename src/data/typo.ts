const NBSP = ' ';

/** Слова, после которых перенос строки недопустим (висячие предлоги, артикли, союзы). */
const GLUE = {
  en: ['a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'by', 'as', 'and', 'or', 'but', 'is', 'it', 'its', 'we', 'our', 'with', 'from', 'into', 'via', 'per', '&'],
  ru: ['в', 'во', 'на', 'с', 'со', 'к', 'ко', 'по', 'о', 'об', 'у', 'и', 'а', 'но', 'за', 'из', 'от', 'до', 'для', 'при', 'без', 'под', 'над', 'не', 'ни', 'то', 'как', 'что', 'или'],
} as const;

const re = (lang: 'en' | 'ru'): RegExp =>
  new RegExp(`(?<=^|[\\s(])(${GLUE[lang].join('|')})\\s+(?=\\S|$)`, 'giu');
const cache = { en: re('en'), ru: re('ru') };

/** Типографика: нет висячих предлогов, тире не уходит в начало строки. */
export function typo(text: string, lang: 'en' | 'ru' = 'en'): string {
  return text
    // короткий префикс с дефисом («AI-платформа», «Т-Банк», «UX-фичи») не рвётся по дефису
    .replace(/(^|[\s(])([A-Za-zА-Яа-я]{1,3})-(?=[A-Za-zА-Яа-я])/gu, '$1$2-\u2060')
    .replace(/\s+—/g, `${NBSP}—`)
    .replace(cache[lang], (_m, word: string) => `${word}${NBSP}`);
}
