/**
 * Grid/Layout Tokens Type Definitions
 * 2-tier architecture with device modes (like Gap/Spacing)
 * 
 * Level 1: Primitives (grid.gutter.*, grid.margin.*, grid.container.*) - in Primitives collection
 * Level 2: Semantic (layout.grid.page, layout.grid.cards) - in Grid collection with Desktop/Tablet/Mobile modes
 * 
 * ВАЖНО: Grid примитивы НЕЗАВИСИМЫ от Gap и Spacing!
 * - grid.gutter.* — для Layout Grid gutter (расстояние между колонками)
 * - grid.margin.* — для Layout Grid margin/offset (отступ от края)
 * - grid.container.* — для max-width контейнеров
 */

// ============================================
// PRIMITIVES
// ============================================

export interface GridPrimitive {
  name: string;
  value: number;
  enabled: boolean;
}

// Gutter - расстояние между колонками/строками в Layout Grid
export const DEFAULT_GRID_GUTTER_PRIMITIVES: GridPrimitive[] = [
  { name: '0', value: 0, enabled: true },
  { name: '4', value: 4, enabled: true },
  { name: '8', value: 8, enabled: true },
  { name: '12', value: 12, enabled: true },
  { name: '16', value: 16, enabled: true },
  { name: '20', value: 20, enabled: true },
  { name: '24', value: 24, enabled: true },
  { name: '32', value: 32, enabled: true },
  { name: '40', value: 40, enabled: true },
  { name: '48', value: 48, enabled: true },
];

// Margin - отступ от края фрейма до сетки
export const DEFAULT_GRID_MARGIN_PRIMITIVES: GridPrimitive[] = [
  { name: '0', value: 0, enabled: true },
  { name: '16', value: 16, enabled: true },
  { name: '20', value: 20, enabled: true },
  { name: '24', value: 24, enabled: true },
  { name: '32', value: 32, enabled: true },
  { name: '48', value: 48, enabled: true },
  { name: '64', value: 64, enabled: true },
  { name: '80', value: 80, enabled: true },
  { name: '96', value: 96, enabled: true },
  { name: '120', value: 120, enabled: true },
  { name: '160', value: 160, enabled: true },
];

// Container - максимальная ширина контейнеров
export const DEFAULT_GRID_CONTAINER_PRIMITIVES: GridPrimitive[] = [
  { name: '480', value: 480, enabled: true },
  { name: '560', value: 560, enabled: true },
  { name: '640', value: 640, enabled: true },
  { name: '720', value: 720, enabled: true },
  { name: '800', value: 800, enabled: true },
  { name: '960', value: 960, enabled: true },
  { name: '1024', value: 1024, enabled: true },
  { name: '1200', value: 1200, enabled: true },
  { name: '1280', value: 1280, enabled: true },
  { name: '1440', value: 1440, enabled: true },
  { name: '1600', value: 1600, enabled: true },
  { name: '1920', value: 1920, enabled: true },
];

// ============================================
// SEMANTIC TOKENS (with device modes)
// ============================================

export type GridCategory = 
  | 'page'        // Основные сетки страниц
  | 'content'     // Контентные области (narrow, wide, fluid)
  | 'container'   // Контейнеры с max-width
  | 'cards'       // Сетки карточек
  | 'gallery'     // Галереи, медиа
  | 'dashboard'   // Дашборды, виджеты
  | 'form'        // Формы
  | 'list'        // Списки
  | 'navigation'  // Навигация, меню
  | 'data'        // Таблицы данных
  | 'footer'      // Футеры
  | 'custom';     // Пользовательские

export const GRID_CATEGORIES: Record<GridCategory, { label: string; icon: string; description: string }> = {
  page: { label: 'Страницы', icon: '📄', description: 'Основные сетки страниц' },
  content: { label: 'Контент', icon: '📝', description: 'Narrow, wide, fluid сетки' },
  container: { label: 'Контейнеры', icon: '📦', description: 'Max-width контейнеры' },
  cards: { label: 'Карточки', icon: '🃏', description: 'Сетки карточек' },
  gallery: { label: 'Галерея', icon: '🖼️', description: 'Галереи, медиа' },
  dashboard: { label: 'Дашборд', icon: '📊', description: 'Виджеты, метрики' },
  form: { label: 'Формы', icon: '📋', description: 'Сетки форм' },
  list: { label: 'Списки', icon: '📑', description: 'Многоколоночные списки' },
  navigation: { label: 'Навигация', icon: '🧭', description: 'Меню, табы' },
  data: { label: 'Данные', icon: '🗃️', description: 'Таблицы, data grids' },
  footer: { label: 'Футер', icon: '🦶', description: 'Сетки футера' },
  custom: { label: 'Пользовательские', icon: '⚙️', description: 'Кастомные сетки' },
};

// Alignment типы для Figma Layout Grid
export type GridAlignment = 'MIN' | 'CENTER' | 'MAX' | 'STRETCH';

// Конфигурация Layout Grid для одного breakpoint
export interface GridLayoutConfig {
  columns: number;          // Количество колонок (просто число, не Variable)
  gutter: string;           // Ссылка на примитив: "24" → {grid/gutter/24}
  margin: string;           // Ссылка на примитив: "64" → {grid/margin/64}
  alignment: GridAlignment; // Выравнивание сетки
  maxWidth?: string;        // Опционально: ссылка на container "1280" → {grid/container/1280}
}

// Семантический Grid токен с адаптивностью
export interface GridSemanticToken {
  id: string;
  path: string;             // "layout.grid.page.default"
  category: GridCategory;
  description?: string;
  // Device-specific configurations
  desktop: GridLayoutConfig;
  tablet: GridLayoutConfig;
  mobile: GridLayoutConfig;
}

// Custom category for user-defined sections
export interface CustomGridCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface GridState {
  gutterPrimitives: GridPrimitive[];
  marginPrimitives: GridPrimitive[];
  containerPrimitives: GridPrimitive[];
  semanticTokens: GridSemanticToken[];
  customCategories?: CustomGridCategory[];
}

// ============================================
// DEFAULT SEMANTIC TOKENS
// ============================================

export const DEFAULT_GRID_SEMANTIC_TOKENS: GridSemanticToken[] = [
  // ----------------------------------------
  // PAGE GRIDS - Основные сетки страниц
  // ----------------------------------------
  {
    id: 'grid-1',
    path: 'layout.grid.page.default',
    category: 'page',
    description: 'Стандартная 12-колоночная сетка страницы',
    desktop: { columns: 12, gutter: '24', margin: '64', alignment: 'CENTER', maxWidth: '1280' },
    tablet:  { columns: 8,  gutter: '20', margin: '32', alignment: 'CENTER' },
    mobile:  { columns: 4,  gutter: '16', margin: '16', alignment: 'STRETCH' },
  },
  {
    id: 'grid-2',
    path: 'layout.grid.page.wide',
    category: 'page',
    description: 'Широкая сетка для дашбордов',
    desktop: { columns: 12, gutter: '24', margin: '32', alignment: 'STRETCH', maxWidth: '1600' },
    tablet:  { columns: 8,  gutter: '20', margin: '24', alignment: 'STRETCH' },
    mobile:  { columns: 4,  gutter: '16', margin: '16', alignment: 'STRETCH' },
  },
  {
    id: 'grid-3',
    path: 'layout.grid.page.fluid',
    category: 'page',
    description: 'Полноширинная резиновая сетка',
    desktop: { columns: 12, gutter: '24', margin: '24', alignment: 'STRETCH' },
    tablet:  { columns: 8,  gutter: '20', margin: '20', alignment: 'STRETCH' },
    mobile:  { columns: 4,  gutter: '16', margin: '16', alignment: 'STRETCH' },
  },

  // ----------------------------------------
  // CONTENT - Контентные сетки
  // ----------------------------------------
  {
    id: 'grid-10',
    path: 'layout.grid.content.narrow',
    category: 'content',
    description: 'Узкая сетка для статей и текстового контента',
    desktop: { columns: 8, gutter: '24', margin: '0', alignment: 'CENTER', maxWidth: '800' },
    tablet:  { columns: 6, gutter: '20', margin: '32', alignment: 'CENTER' },
    mobile:  { columns: 4, gutter: '16', margin: '16', alignment: 'STRETCH' },
  },
  {
    id: 'grid-11',
    path: 'layout.grid.content.prose',
    category: 'content',
    description: 'Сетка для длинного текста (prose)',
    desktop: { columns: 1, gutter: '0', margin: '0', alignment: 'CENTER', maxWidth: '720' },
    tablet:  { columns: 1, gutter: '0', margin: '32', alignment: 'CENTER' },
    mobile:  { columns: 1, gutter: '0', margin: '16', alignment: 'STRETCH' },
  },

  // ----------------------------------------
  // CONTAINER - Контейнеры
  // ----------------------------------------
  {
    id: 'grid-20',
    path: 'layout.container.default',
    category: 'container',
    description: 'Основной контейнер',
    desktop: { columns: 1, gutter: '0', margin: '24', alignment: 'CENTER', maxWidth: '1280' },
    tablet:  { columns: 1, gutter: '0', margin: '20', alignment: 'CENTER', maxWidth: '1280' },
    mobile:  { columns: 1, gutter: '0', margin: '16', alignment: 'STRETCH' },
  },
  {
    id: 'grid-21',
    path: 'layout.container.narrow',
    category: 'container',
    description: 'Узкий контейнер для форм и статей',
    desktop: { columns: 1, gutter: '0', margin: '24', alignment: 'CENTER', maxWidth: '720' },
    tablet:  { columns: 1, gutter: '0', margin: '20', alignment: 'CENTER', maxWidth: '720' },
    mobile:  { columns: 1, gutter: '0', margin: '16', alignment: 'STRETCH' },
  },
  {
    id: 'grid-22',
    path: 'layout.container.medium',
    category: 'container',
    description: 'Средний контейнер',
    desktop: { columns: 1, gutter: '0', margin: '24', alignment: 'CENTER', maxWidth: '960' },
    tablet:  { columns: 1, gutter: '0', margin: '20', alignment: 'CENTER', maxWidth: '960' },
    mobile:  { columns: 1, gutter: '0', margin: '16', alignment: 'STRETCH' },
  },
  {
    id: 'grid-23',
    path: 'layout.container.wide',
    category: 'container',
    description: 'Широкий контейнер',
    desktop: { columns: 1, gutter: '0', margin: '32', alignment: 'CENTER', maxWidth: '1440' },
    tablet:  { columns: 1, gutter: '0', margin: '24', alignment: 'CENTER', maxWidth: '1440' },
    mobile:  { columns: 1, gutter: '0', margin: '16', alignment: 'STRETCH' },
  },
  {
    id: 'grid-24',
    path: 'layout.container.modal.compact',
    category: 'container',
    description: 'Контейнер для компактных модальных окон',
    desktop: { columns: 1, gutter: '0', margin: '0', alignment: 'CENTER', maxWidth: '480' },
    tablet:  { columns: 1, gutter: '0', margin: '0', alignment: 'CENTER', maxWidth: '480' },
    mobile:  { columns: 1, gutter: '0', margin: '16', alignment: 'STRETCH' },
  },
  {
    id: 'grid-25',
    path: 'layout.container.modal.default',
    category: 'container',
    description: 'Контейнер для стандартных модальных окон',
    desktop: { columns: 1, gutter: '0', margin: '0', alignment: 'CENTER', maxWidth: '560' },
    tablet:  { columns: 1, gutter: '0', margin: '0', alignment: 'CENTER', maxWidth: '560' },
    mobile:  { columns: 1, gutter: '0', margin: '16', alignment: 'STRETCH' },
  },
  {
    id: 'grid-26',
    path: 'layout.container.modal.large',
    category: 'container',
    description: 'Контейнер для больших модальных окон',
    desktop: { columns: 1, gutter: '0', margin: '0', alignment: 'CENTER', maxWidth: '720' },
    tablet:  { columns: 1, gutter: '0', margin: '0', alignment: 'CENTER', maxWidth: '720' },
    mobile:  { columns: 1, gutter: '0', margin: '16', alignment: 'STRETCH' },
  },
  {
    id: 'grid-27',
    path: 'layout.container.modal.wide',
    category: 'container',
    description: 'Контейнер для широких модальных окон',
    desktop: { columns: 1, gutter: '0', margin: '0', alignment: 'CENTER', maxWidth: '960' },
    tablet:  { columns: 1, gutter: '0', margin: '24', alignment: 'STRETCH' },
    mobile:  { columns: 1, gutter: '0', margin: '16', alignment: 'STRETCH' },
  },

  // ----------------------------------------
  // CARDS - Сетки карточек
  // ----------------------------------------
  {
    id: 'grid-30',
    path: 'layout.grid.cards.default',
    category: 'cards',
    description: 'Стандартная сетка карточек (3 в ряд на desktop)',
    desktop: { columns: 12, gutter: '24', margin: '0', alignment: 'STRETCH' },
    tablet:  { columns: 8,  gutter: '20', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 4,  gutter: '16', margin: '0', alignment: 'STRETCH' },
  },
  {
    id: 'grid-31',
    path: 'layout.grid.cards.compact',
    category: 'cards',
    description: 'Компактная сетка карточек',
    desktop: { columns: 12, gutter: '16', margin: '0', alignment: 'STRETCH' },
    tablet:  { columns: 8,  gutter: '12', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 4,  gutter: '8',  margin: '0', alignment: 'STRETCH' },
  },
  {
    id: 'grid-32',
    path: 'layout.grid.cards.spacious',
    category: 'cards',
    description: 'Просторная сетка карточек',
    desktop: { columns: 12, gutter: '32', margin: '0', alignment: 'STRETCH' },
    tablet:  { columns: 8,  gutter: '24', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 4,  gutter: '16', margin: '0', alignment: 'STRETCH' },
  },

  // ----------------------------------------
  // GALLERY - Галереи и медиа
  // ----------------------------------------
  {
    id: 'grid-40',
    path: 'layout.grid.gallery.default',
    category: 'gallery',
    description: 'Стандартная галерея изображений',
    desktop: { columns: 4, gutter: '8', margin: '0', alignment: 'STRETCH' },
    tablet:  { columns: 3, gutter: '8', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 2, gutter: '4', margin: '0', alignment: 'STRETCH' },
  },
  {
    id: 'grid-41',
    path: 'layout.grid.gallery.compact',
    category: 'gallery',
    description: 'Компактная галерея',
    desktop: { columns: 6, gutter: '4', margin: '0', alignment: 'STRETCH' },
    tablet:  { columns: 4, gutter: '4', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 3, gutter: '4', margin: '0', alignment: 'STRETCH' },
  },
  {
    id: 'grid-42',
    path: 'layout.grid.gallery.thumbnails',
    category: 'gallery',
    description: 'Сетка превью/тамбнейлов',
    desktop: { columns: 8, gutter: '8', margin: '0', alignment: 'STRETCH' },
    tablet:  { columns: 6, gutter: '8', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 4, gutter: '4', margin: '0', alignment: 'STRETCH' },
  },
  {
    id: 'grid-43',
    path: 'layout.grid.gallery.masonry',
    category: 'gallery',
    description: 'Masonry-подобная сетка',
    desktop: { columns: 4, gutter: '16', margin: '0', alignment: 'STRETCH' },
    tablet:  { columns: 3, gutter: '16', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 2, gutter: '12', margin: '0', alignment: 'STRETCH' },
  },

  // ----------------------------------------
  // DASHBOARD - Дашборды и виджеты
  // ----------------------------------------
  {
    id: 'grid-50',
    path: 'layout.grid.dashboard.main',
    category: 'dashboard',
    description: 'Основная сетка дашборда',
    desktop: { columns: 12, gutter: '24', margin: '24', alignment: 'STRETCH' },
    tablet:  { columns: 8,  gutter: '20', margin: '20', alignment: 'STRETCH' },
    mobile:  { columns: 4,  gutter: '16', margin: '16', alignment: 'STRETCH' },
  },
  {
    id: 'grid-51',
    path: 'layout.grid.dashboard.compact',
    category: 'dashboard',
    description: 'Компактная сетка дашборда',
    desktop: { columns: 12, gutter: '16', margin: '16', alignment: 'STRETCH' },
    tablet:  { columns: 8,  gutter: '12', margin: '12', alignment: 'STRETCH' },
    mobile:  { columns: 4,  gutter: '12', margin: '12', alignment: 'STRETCH' },
  },
  {
    id: 'grid-52',
    path: 'layout.grid.dashboard.metrics',
    category: 'dashboard',
    description: 'Сетка для KPI и метрик',
    desktop: { columns: 12, gutter: '16', margin: '0', alignment: 'STRETCH' },
    tablet:  { columns: 8,  gutter: '16', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 4,  gutter: '12', margin: '0', alignment: 'STRETCH' },
  },

  // ----------------------------------------
  // FORM - Сетки форм
  // ----------------------------------------
  {
    id: 'grid-60',
    path: 'layout.grid.form.single',
    category: 'form',
    description: 'Форма в одну колонку',
    desktop: { columns: 1, gutter: '16', margin: '0', alignment: 'STRETCH', maxWidth: '480' },
    tablet:  { columns: 1, gutter: '16', margin: '0', alignment: 'STRETCH', maxWidth: '480' },
    mobile:  { columns: 1, gutter: '12', margin: '0', alignment: 'STRETCH' },
  },
  {
    id: 'grid-61',
    path: 'layout.grid.form.double',
    category: 'form',
    description: 'Форма в две колонки',
    desktop: { columns: 2, gutter: '24', margin: '0', alignment: 'STRETCH', maxWidth: '720' },
    tablet:  { columns: 2, gutter: '20', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 1, gutter: '12', margin: '0', alignment: 'STRETCH' },
  },
  {
    id: 'grid-62',
    path: 'layout.grid.form.triple',
    category: 'form',
    description: 'Форма в три колонки',
    desktop: { columns: 3, gutter: '24', margin: '0', alignment: 'STRETCH', maxWidth: '960' },
    tablet:  { columns: 2, gutter: '20', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 1, gutter: '12', margin: '0', alignment: 'STRETCH' },
  },
  {
    id: 'grid-63',
    path: 'layout.grid.form.inline',
    category: 'form',
    description: 'Инлайн-форма (горизонтальная)',
    desktop: { columns: 12, gutter: '12', margin: '0', alignment: 'STRETCH' },
    tablet:  { columns: 8,  gutter: '12', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 4,  gutter: '8',  margin: '0', alignment: 'STRETCH' },
  },

  // ----------------------------------------
  // LIST - Сетки списков
  // ----------------------------------------
  {
    id: 'grid-70',
    path: 'layout.grid.list.single',
    category: 'list',
    description: 'Список в одну колонку',
    desktop: { columns: 1, gutter: '0', margin: '0', alignment: 'STRETCH' },
    tablet:  { columns: 1, gutter: '0', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 1, gutter: '0', margin: '0', alignment: 'STRETCH' },
  },
  {
    id: 'grid-71',
    path: 'layout.grid.list.double',
    category: 'list',
    description: 'Список в две колонки',
    desktop: { columns: 2, gutter: '16', margin: '0', alignment: 'STRETCH' },
    tablet:  { columns: 2, gutter: '16', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 1, gutter: '0',  margin: '0', alignment: 'STRETCH' },
  },
  {
    id: 'grid-72',
    path: 'layout.grid.list.triple',
    category: 'list',
    description: 'Список в три колонки',
    desktop: { columns: 3, gutter: '16', margin: '0', alignment: 'STRETCH' },
    tablet:  { columns: 2, gutter: '16', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 1, gutter: '0',  margin: '0', alignment: 'STRETCH' },
  },

  // ----------------------------------------
  // NAVIGATION - Навигация
  // ----------------------------------------
  {
    id: 'grid-80',
    path: 'layout.grid.navigation.header',
    category: 'navigation',
    description: 'Сетка для хедера',
    desktop: { columns: 12, gutter: '24', margin: '24', alignment: 'STRETCH' },
    tablet:  { columns: 8,  gutter: '20', margin: '20', alignment: 'STRETCH' },
    mobile:  { columns: 4,  gutter: '16', margin: '16', alignment: 'STRETCH' },
  },
  {
    id: 'grid-81',
    path: 'layout.grid.navigation.megaMenu',
    category: 'navigation',
    description: 'Сетка для мега-меню',
    desktop: { columns: 4, gutter: '32', margin: '24', alignment: 'STRETCH' },
    tablet:  { columns: 3, gutter: '24', margin: '20', alignment: 'STRETCH' },
    mobile:  { columns: 1, gutter: '0',  margin: '16', alignment: 'STRETCH' },
  },
  {
    id: 'grid-82',
    path: 'layout.grid.navigation.sidebar',
    category: 'navigation',
    description: 'Сетка для сайдбара',
    desktop: { columns: 1, gutter: '0', margin: '16', alignment: 'STRETCH' },
    tablet:  { columns: 1, gutter: '0', margin: '12', alignment: 'STRETCH' },
    mobile:  { columns: 1, gutter: '0', margin: '0',  alignment: 'STRETCH' },
  },

  // ----------------------------------------
  // DATA - Таблицы данных
  // ----------------------------------------
  {
    id: 'grid-90',
    path: 'layout.grid.data.table',
    category: 'data',
    description: 'Сетка для таблицы данных',
    desktop: { columns: 12, gutter: '0', margin: '0', alignment: 'STRETCH' },
    tablet:  { columns: 8,  gutter: '0', margin: '0', alignment: 'STRETCH' },
    mobile:  { columns: 4,  gutter: '0', margin: '0', alignment: 'STRETCH' },
  },

  // ----------------------------------------
  // FOOTER - Футеры
  // ----------------------------------------
  {
    id: 'grid-100',
    path: 'layout.grid.footer.default',
    category: 'footer',
    description: 'Стандартная сетка футера',
    desktop: { columns: 12, gutter: '32', margin: '64', alignment: 'CENTER', maxWidth: '1280' },
    tablet:  { columns: 8,  gutter: '24', margin: '32', alignment: 'CENTER' },
    mobile:  { columns: 4,  gutter: '16', margin: '16', alignment: 'STRETCH' },
  },
  {
    id: 'grid-101',
    path: 'layout.grid.footer.simple',
    category: 'footer',
    description: 'Простой футер',
    desktop: { columns: 4, gutter: '32', margin: '24', alignment: 'STRETCH' },
    tablet:  { columns: 2, gutter: '24', margin: '20', alignment: 'STRETCH' },
    mobile:  { columns: 1, gutter: '16', margin: '16', alignment: 'STRETCH' },
  },
];

// ============================================
// STATE
// ============================================

export function createDefaultGridState(): GridState {
  return {
    gutterPrimitives: JSON.parse(JSON.stringify(DEFAULT_GRID_GUTTER_PRIMITIVES)),
    marginPrimitives: JSON.parse(JSON.stringify(DEFAULT_GRID_MARGIN_PRIMITIVES)),
    containerPrimitives: JSON.parse(JSON.stringify(DEFAULT_GRID_CONTAINER_PRIMITIVES)),
    semanticTokens: JSON.parse(JSON.stringify(DEFAULT_GRID_SEMANTIC_TOKENS)),
  };
}

// ============================================
// HELPERS
// ============================================

export function getGridTokensByCategory(tokens: GridSemanticToken[], category: GridCategory): GridSemanticToken[] {
  return tokens.filter(t => t.category === category);
}

export function getEnabledGridPrimitives(primitives: GridPrimitive[]): GridPrimitive[] {
  return primitives.filter(p => p.enabled);
}

export function generateGridTokenId(): string {
  return `grid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Валидация ссылки на примитив
export function isValidGutterRef(ref: string, primitives: GridPrimitive[]): boolean {
  return primitives.some(p => p.name === ref && p.enabled);
}

export function isValidMarginRef(ref: string, primitives: GridPrimitive[]): boolean {
  return primitives.some(p => p.name === ref && p.enabled);
}

export function isValidContainerRef(ref: string, primitives: GridPrimitive[]): boolean {
  return primitives.some(p => p.name === ref && p.enabled);
}

// Получить числовое значение по ссылке
export function getGutterValue(ref: string, primitives: GridPrimitive[]): number | undefined {
  const primitive = primitives.find(p => p.name === ref && p.enabled);
  return primitive?.value;
}

export function getMarginValue(ref: string, primitives: GridPrimitive[]): number | undefined {
  const primitive = primitives.find(p => p.name === ref && p.enabled);
  return primitive?.value;
}

export function getContainerValue(ref: string, primitives: GridPrimitive[]): number | undefined {
  const primitive = primitives.find(p => p.name === ref && p.enabled);
  return primitive?.value;
}
