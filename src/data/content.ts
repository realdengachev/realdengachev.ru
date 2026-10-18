import avatar from '../assets/img/avatar.jpg';
import nadiktuy from '../assets/img/nadiktuy.jpg';
import logoSrc from '../assets/img/deepdigital-logo-src.png';
import cardA from '../assets/img/card-a.jpg';
import cardB from '../assets/img/card-b2.png';
import cardE from '../assets/img/card-e.png';
import pantryPoster from '../assets/img/pantry-poster.png';
import vinylPoster from '../assets/img/vinyl-poster.png';
import nadiktuyPoster from '../assets/img/nadiktuy-poster.png';
import logoMr from '../assets/img/logo-mrgroup.png';
import logoOchen from '../assets/img/logo-ochen.jpg';
import logoVtb from '../assets/img/logo-vtb.png';
import logoAvito from '../assets/img/logo-avito.png';
import logoTbank from '../assets/img/logo-tbank.png';
import logoCrauch from '../assets/img/logo-crauch.png';
import logoDeepNew from '../assets/img/logo-deep-new.png';
import logoDeepRound from '../assets/img/logo-deep-round.png';
import logoSnapNew from '../assets/img/logo-snapbuild-new.png';
import { url, email } from './links';

/** Локализованная строка: английский — по умолчанию. */
export interface L {
  en: string;
  ru: string;
}
export const l = (en: string, ru: string): L => ({ en, ru });
/** Название, одинаковое в обеих локалях (бренды). */
const same = (s: string): L => l(s, s);

export const site = {
  title: 'Kirill Dengachev — Lead UX/UI designer',
  titleRu: 'Кирилл Деньгачев — Lead UX/UI дизайнер',
  description:
    'Develop creative and emotionally engaging solutions for large-scale banking products, create design systems and improve team workflows',
};

/* ---------- UI: тема и язык ---------- */
export const ui = {
  theme: {
    label: l('Theme', 'Тема'),
    names: { light: l('Light', 'Светлая'), dark: l('Dark', 'Тёмная') },
  },
  language: {
    label: l('Language', 'Язык'),
    names: { en: 'English', ru: 'Русский' },
  },
  tablist: l('Sections', 'Разделы'),
  gallery: l('Selected work', 'Избранные работы'),
};

export const profile = {
  name: l('Kirill Dengachev', 'Кирилл Деньгачев'),
  about: l(
    'Develop creative and emotionally engaging solutions for large-scale banking products, create and evolve design systems, oversee and improve team workflows',
    'Разрабатываю креативные и эмоциональные решения для крупных банковских продуктов, создаю и развиваю дизайн-системы, выстраиваю и улучшаю рабочие процессы в командах',
  ),
  avatar,
  avatarAlt: 'Kirill Dengachev',
};

export type ExpSeg = L | { link: L; href: string } | { br: true };

/** Верхний текст Experience: переносы строк (br) — как в макете, на узких экранах скрываются. */
export const experience = {
  label: l('Experience', 'Опыт'),
  segments: [
    l('Currently developing ', 'Развиваю платформу '),
    { link: l('Snapbuild', 'Снэпбилд'), href: url.snapbuild },
    l(' at ', ' в '),
    { link: l('Ochen', 'Очень'), href: url.ochen },
    l(' ', ' '),
    { br: true },
    l('as a Design Engineer and Lead UX/UI designer ', 'как Design Engineer и Lead UX/UI дизайнер '),
    { br: true },
    l('at ', 'в '),
    { link: same('Deep Digital'), href: url.deepDigital },
    l(' — an innovative IT company', ' — инновационные IT-компании'),
  ] as ExpSeg[],
};

export const workingAt = {
  label: l('working at', 'работаю в'),
  company: 'Deep Digital',
  href: url.deepDigital,
  role: l('Lead UX/UI designer', 'Lead UX/UI дизайнер'),
  logoSrc,
  icon: logoDeepNew,
};

export const developing = {
  label: l('developing', 'развиваю'),
  name: l('Snapbuild', 'Снэпбилд'),
  href: url.snapbuild,
  role: l('Design Engineer', 'Design Engineer'),
  icon: logoSnapNew,
};

export const built = {
  label: l('Built', 'Создал'),
  name: l('Nadiktuy', 'Надиктуй'),
  href: url.nadiktuy,
  description: l('Turn messy voice notes into polished messages', 'Сумбурные голосовые в готовые сообщения'),
  icon: nadiktuy,
};

export const tabs = [
  { id: 'all', label: l('Gallery', 'Галерея') },
  { id: 'work', label: l('Experience', 'Опыт') },
  { id: 'story', label: l('Story', 'История') },
  { id: 'connect', label: l('Connect', 'Контакты') },
] as const;
export type TabId = (typeof tabs)[number]['id'];

export interface CardCaption {
  name: L;
  text: L;
}

export type GalleryCard = { caption: CardCaption; href?: string } & (
  | { kind: 'wide'; image: ImageMetadata; alt: string; fillH?: number; fillTop?: number }
  | { kind: 'phone-ios16'; wallpaper: ImageMetadata; alt: string }
  | { kind: 'phone-video'; video: string; poster: ImageMetadata; alt: string; lazy?: boolean; bare?: boolean }
  | { kind: 'wide-video'; video: string; poster: ImageMetadata; alt: string }
);

/* Подписи показываются при hover. Для карточек 2–5 текст в макете не задан — взят по содержимому/названию слоя. */
export const gallery: GalleryCard[] = [
  {
    kind: 'wide',
    image: cardA,
    alt: "Snapbuild product's main page",
    href: 'https://snapbuild.ru/work',
    caption: { name: l('Snapbuild', 'Снэпбилд'), text: l("product's main page", 'продуктовая страница') },
  },
  {
    kind: 'phone-video',
    video: '/video/pantry.mp4',
    poster: pantryPoster,
    alt: 'Photo app main screen on iPhone: a photo is dragged into the Weekends folder',
    caption: { name: same('Pantry'), text: l('main screen', 'главный экран') },
  },
  {
    kind: 'wide',
    image: cardB,
    alt: 'AI studio website with project catalogue',
    fillH: 101.86,
    fillTop: -0.14,
    href: 'https://ochen.digital/',
    caption: { name: l('Ochen', 'Очень'), text: l("AI studio's website", 'сайт AI-студии') },
  },
  {
    kind: 'wide',
    image: cardE,
    alt: 'Deep.app landing page: Controlled AI UGC',
    fillH: 102.1,
    fillTop: 0.01,
    href: 'https://deeep.app/ugc',
    caption: { name: same('Deeep.app'), text: l('product page', 'продуктовая страница') },
  },
  {
    kind: 'phone-video',
    video: '/video/nadiktuy.mp4',
    poster: nadiktuyPoster,
    lazy: true, // 4.5 МБ — грузим, когда карточка рядом с экраном
    bare: true, // в записи уже есть статус-бар и остров — рамка без своих
    alt: 'Nadiktuy Telegram bot: a voice note is turned into a ready-to-send text',
    href: 'https://t.me/nadiktuy_bot',
    caption: { name: l('Nadiktuy', 'Надиктуй'), text: l('AI STT service', 'AI STT сервис') },
  },
  {
    kind: 'wide-video',
    video: '/video/vinyl-review.mp4',
    poster: vinylPoster,
    alt: 'Vinyl player concept: a spinning record, a turntable and a now-playing widget',
    caption: { name: l('Vinyl', 'Винил'), text: l('interactive concept', 'интерактивный концепт') },
  },
];

/* ---------- Work ---------- */
export interface WorkEntry {
  name: L;
  logo: ImageMetadata | 'deeep'; // 'deeep' — составной знак Deeep.app (чёрный круг + кроп вордмарка)
  href: string;
  suffix?: L; // серая приписка в скобках: «(Ochen)»
  logoRadius: number;
  description: L[]; // строки; между ними — принудительный перенос
  maxWidth?: number; // если в макете у текста задана ширина
  maxWidthRu?: number; // другая ширина текста для русской версии
  tightLeading?: boolean; // line-height 1.4 вместо 1.5 (как в макете у T-Bank)
  badge?: { en: string[]; ru: string[] }; // строки значка «победа»
}

export interface WorkGroup {
  period: L;
  live?: boolean;
  role: L;
  company?: L; // нет компании — роль выводится обычным текстом
  href?: string;
  entries: WorkEntry[];
}

export const workGroups: WorkGroup[] = [
  {
    period: l('2026 — present', '2026 — сейчас'),
    live: true,
    role: l('Design Engineer', 'Design Engineer'),
    entries: [
      {
        name: l('Snapbuild', 'Снэпбилд'),
        suffix: l('(Ochen)', '(Очень)'),
        href: url.snapbuild,
        logo: logoSnapNew,
        logoRadius: 100,
        maxWidth: 550,
        description: [
          l(
            'Working in close collaboration with the CEO and Product Owner ',
            'Вместе с CEO и Product Owner развиваю Снэпбилд — маркетинговая UGC AI-платформа, являющаяся ключевым продуктом компании',
          ),
          l("on Snapbuild — an AI-powered UGC marketing platform and company's key product", ''),
        ],
      },
      {
        name: same('Deeep.app'),
        suffix: l('(Deep Digital)', '(Deep Digital)'),
        href: url.deeep,
        logo: 'deeep',
        logoRadius: 100,
        maxWidth: 550,
        description: [
          l(
            'An equivalent of Snapbuild for an international audience. We launched ',
            'Аналог Снэпбилда для зарубежной аудитории. Запустили продуктовую страницу для привлечения новых пользователей и продвижения нашего продукта',
          ),
          l('a product page to attract new users and promote our product', ''),
        ],
      },
    ],
  },
  {
    period: l('2026 — present', '2026 — сейчас'),
    live: true,
    role: l('Lead UX/UI designer at', 'Lead UX/UI дизайнер в'),
    company: same('Deep Digital'),
    href: url.deepDigital,
    entries: [
      {
        name: same('Deep Digital'),
        href: url.deepDigital,
        logo: logoDeepRound,
        logoRadius: 100,
        maxWidth: 550,
        description: [
          l(
            'High-level project management and task reviews, hiring and developing the design team, establishing career paths for junior and middle designers, and creating guidelines and standard operating procedures',
            'Управление проектами, распределение ресурсов и ревью задач, найм и развитие дизайн-команды, создание ИПР для джунов и мидлов, создание гайдлайнов и внутренних регламентов',
          ),
        ],
      },
      {
        name: same('MR Group'),
        href: url.mrGroup,
        logo: logoMr,
        logoRadius: 100,
        description: [
          l('End-to-end development of an AI product for the main website, including ', 'Разработка AI-продукта с нуля для главного сайта, '),
          l(
            'a conceptual redesign of the home screen and pages across all business segments. Also participated in the creation of a marketplace for real estate transactions',
            'концептуальный редизайн главной страницы и страниц всех бизнес-направлений. Участие в создании маркетплейса для сделок с недвижимостью',
          ),
        ],
      },
    ],
  },
  {
    period: l('2024 — 2026', '2024 — 2026'),
    role: l('UX/UI & Product Designer at', 'UX/UI и продуктовый дизайнер в'),
    company: l('Ochen', 'Очень'),
    href: url.ochen,
    entries: [
      {
        name: l('Ochen', 'Очень'),
        href: url.ochen,
        logo: logoOchen,
        logoRadius: 10,
        description: [
          l(
            'Worked on improving the company website — including developing project cases, UX features, pre-development preparations and handled internal tasks and projects',
            'Работал над улучшением сайта компании — разрабатывал кейсы проектов и UX-фичи, готовил материалы к разработке, а также ',
          ),
          l('', 'занимался внутренними задачами и проектами'),
        ],
      },
      {
        name: l('VTB', 'ВТБ'),
        href: url.vtb,
        logo: logoVtb,
        logoRadius: 100,
        description: [
          l(
            'Participated in and led most of the major projects that were critical to VTB —including developing pages for VTB’s new design, redesigning the career portal, migrating the design system to tokens, creating the concept ',
            'Участвовал и управлял большинством крупных проектов, важных для ВТБ, — в том числе разработкой страниц нового дизайна ВТБ, редизайном карьерного портала, переводом дизайн-системы на токены, ',
          ),
          l(
            'for an article portal, and compiling monthly and annual project digests',
            'созданием концепции статейного портала и подготовкой ежемесячных и годовых дайджестов проектов для высшего менеджмента ВТБ',
          ),
        ],
      },
      {
        name: l('Avito', 'Авито'),
        href: url.avito,
        logo: logoAvito,
        logoRadius: 10,
        maxWidth: 515,
        badge: { en: ['Tender', 'winners'], ru: ['Победа'] },
        description: [
          l(
            'For the tender we developed a concept for a new vertical of premium products within the mobile app — as a result, we won the tender!',
            'Для тендера мы разработали концепцию новой вертикали премиальных продуктов в мобильном приложении Авито — ',
          ),
          l('', 'тендер был выигран!'),
        ],
      },
    ],
  },
  {
    period: l('2024', '2024'),
    role: l('Fintech student at', 'Студент финтеха в'),
    company: l('T-Bank', 'Т-Банк'),
    href: url.tbank,
    entries: [
      {
        name: l('T-Bank', 'Т-Банк'),
        href: url.tbank,
        logo: logoTbank,
        logoRadius: 100,
        maxWidth: 504,
        maxWidthRu: 520, // чтобы «спроектировал» поместилось в первую строку
        tightLeading: true,
        description: [
          l(
            'In T-Bank’s fintech designed a personal account for job applicants — drew the app design, developed a design system and set up a fully functional prototype',
            'В финтехе Т-Банка на курсе продуктового дизайна спроектировал личный кабинет для соискателей работы — в команде разработали мобильное приложение, дизайн-систему и собрали полностью рабочий прототип',
          ),
        ],
      },
    ],
  },
  {
    period: l('2023', '2023'),
    role: l('UX/UI designer at', 'UX/UI дизайнер в'),
    company: same('Crauch'),
    href: url.crauch,
    entries: [
      {
        name: same('Crauch'),
        href: url.crauch,
        logo: logoCrauch,
        logoRadius: 100,
        maxWidth: 477,
        tightLeading: true,
        description: [
          l(
            "Worked on updating the studio's main website and participated in projects for X5, Synergetic, Zefir, and others. Prepared creative materials and developed articles",
            'Работал над обновлением главного сайта студии и участвовал в проектах для X5, Synergetic и Zefir. ',
          ),
          l('', 'Готовил креативные материалы и верстал статьи'),
        ],
      },
    ],
  },
];

/* ---------- Connect ---------- */
export const connectLinks = [
  { id: 'email', label: l('email', 'email'), href: `mailto:${email}`, copy: email },
  { id: 'telegram', label: l('telegram', 'telegram'), href: url.telegram },
  { id: 'linkedin', label: l('linkedin', 'linkedin'), href: url.linkedin },
] as const;
export const copiedLabel = l('copied', 'скопировано');

export const footer = { handle: '@realdengachev', year: '2026' };

/* ---------- Story ---------- */
export type StorySeg = L | { link: L; href: string } | { muted: L };
/** Абзацы; внутри абзаца — сегменты текста и ссылок; массив массивов = строки с переносом без отступа. */
export const story: { lines: StorySeg[][] }[] = [
  {
    lines: [
      [
        l("I'm a Lead UX/UI Designer at ", 'Я — Lead UX/UI дизайнер в '),
        { link: same('Deep Digital'), href: url.deepDigital },
        l(' and a Design Engineer at ', ' и Design Engineer в '),
        { link: l('Ochen', 'Очень'), href: url.ochen },
        l(
          ": I work in close collaboration with the CEO and Product Owner on the company's key AI products — ",
          ': работаю в тесной связке с CEO и Product Owner над ключевыми AI-продуктами компании — ',
        ),
        { link: l('Snapbuild', 'Снэпбилд'), href: url.snapbuild },
        l(' and ', ' и '),
        { link: same('Deeep.app'), href: url.deeep },
      ],
    ],
  },
  {
    lines: [
      [
        l(
          'I manage the design team: lead projects and conduct task reviews, hire and develop designers, build career tracks for juniors and middles, develop guidelines and internal regulations. Right now, most of my focus is on introducing automation and AI into our processes, championing the idea of a separate AI-agent-based direction within the company',
          'Управляю дизайн-командой: веду проекты и провожу ревью задач, нанимаю и развиваю дизайнеров, выстраиваю карьерные треки для джунов и миддлов, разрабатываю гайдлайны и внутренние регламенты. Сейчас большая часть моего фокуса — внедрение автоматизации и AI в наши процессы, продвигая идею отдельного направления внутри компании на базе AI-агентов',
        ),
      ],
    ],
  },
  {
    lines: [
      [
        l('Before that, at ', 'До этого в '),
        { link: l('Ochen', 'Очень'), href: url.ochen },
        l(' I worked on most of the major projects for ', ' я работал над большинством крупных проектов для '),
        { link: l('VTB', 'ВТБ'), href: url.vtb },
        l(
          " — took part in developing the pages of VTB's new design, as a senior designer led a large-scale redesign of the career portal, migrated VTB's design system to tokens, and developed the concept for the article portal",
          ' — участвовал в разработке страниц нового дизайна ВТБ, в качестве старшего дизайнера провел масштабный редизайн карьерного портала, перевел дизайн-систему ВТБ на токены и разработал концепцию статейного портала',
        ),
      ],
    ],
  },
  {
    lines: [
      [
        l('Won a tender for ', 'Выиграл тендер для '),
        { link: l('Avito', 'Авито'), href: url.avito },
        l(
          ' — designed the concept of a new vertical of premium products in the mobile app, and as a fintech student at ',
          ' — спроектировали концепцию новой вертикали премиальных продуктов в мобильном приложении, а как студент финтеха в ',
        ),
        { link: l('T-Bank', 'Т-Банке'), href: url.tbank },
        l(' designed a personal account for job applicants', ' спроектировал личный кабинет для соискателей работы'),
      ],
    ],
  },
  {
    lines: [
      [l('Went from junior to senior/lead in a couple of years ;)', 'Прошел путь от джуна до старшего/лида за пару лет ;)')],
      [
        l('Outside of work — the gym and motorsport ', 'Вне работы — зал и мотоспорт '),
        { muted: l('(F1 and GT3)', '(F1 и GT3)') },
      ],
    ],
  },
];
