/**
 * Typography Generator UI
 * Handles primitives, semantic tokens, and Figma sync
 */

import {
  TypographyState,
  TypographySemanticToken,
  TypographyCategory,
  FontSizePrimitive,
  LineHeightPrimitive,
  LetterSpacingPrimitive,
  createDefaultTypographyState,
  DEFAULT_FONT_SIZES,
  DEFAULT_LINE_HEIGHTS,
  DEFAULT_LETTER_SPACINGS,
  lineHeightToPercent,
  letterSpacingToPercent,
  generateTokenId,
} from '../types/typography-tokens';

import { createToken } from '../types/token-manager-state';
import { TMTokenType, TMCollectionType } from '../types/token-manager';
import { storageGet, storageSet, storageDelete, STORAGE_KEYS } from './storage-utils';
import { addPendingChange } from './token-manager-ui';

// ============================================
// BREAKPOINTS & RESPONSIVE SCALES
// ============================================

export interface BreakpointConfig {
  name: string;
  label: string;
  minWidth: number;
  scale: number; // Коэффициент масштабирования (1.0 = базовый)
}

// Настройки по умолчанию для адаптивных режимов
const DEFAULT_BREAKPOINTS: BreakpointConfig[] = [
  { name: 'desktop', label: 'Desktop', minWidth: 1280, scale: 1.0 },
  { name: 'tablet', label: 'Tablet', minWidth: 768, scale: 0.875 },
  { name: 'mobile', label: 'Mobile', minWidth: 0, scale: 0.75 },
];

// Текущие настройки брейкпоинтов (можно редактировать через UI)
let breakpointConfigs: BreakpointConfig[] = [...DEFAULT_BREAKPOINTS];

// Флаг включения адаптивных режимов
let responsiveModesEnabled = true;

// Функция получения масштабированного значения
function getScaledValue(baseValue: number, scale: number, step: number = 2): number {
  // Округляем до ближайшего шага (для font-size: 2px, для line-height: 5%)
  const scaled = baseValue * scale;
  return Math.round(scaled / step) * step;
}

// Функция поиска ближайшего примитива
function findClosestPrimitive(targetValue: number, primitives: { name: string; value: number }[]): { name: string; value: number } | null {
  if (primitives.length === 0) return null;
  
  let closest = primitives[0];
  let minDiff = Math.abs(targetValue - closest.value);
  
  for (const p of primitives) {
    const diff = Math.abs(targetValue - p.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = p;
    }
  }
  
  return closest;
}

// ============================================
// STATE
// ============================================

let typographyState: TypographyState = createDefaultTypographyState();

// ============================================
// STATE PERSISTENCE (using figma.clientStorage via postMessage)
// ============================================

interface TypographyStorageData {
  state: TypographyState;
  breakpoints: BreakpointConfig[];
  responsiveEnabled: boolean;
}

/**
 * Сохранить состояние типографики в clientStorage
 */
async function saveTypographyState(): Promise<void> {
  try {
    const data: TypographyStorageData = {
      state: typographyState,
      breakpoints: breakpointConfigs,
      responsiveEnabled: responsiveModesEnabled,
    };
    await storageSet(STORAGE_KEYS.TYPOGRAPHY_STATE, data);
    console.log('[Typography] State saved');
  } catch (e) {
    console.warn('[Typography] Failed to save state:', e);
  }
}

/**
 * Загрузить состояние типографики из clientStorage
 */
async function loadTypographyState(): Promise<boolean> {
  try {
    const data = await storageGet<TypographyStorageData>(STORAGE_KEYS.TYPOGRAPHY_STATE);
    
    if (data) {
      if (data.state) {
        const defaults = createDefaultTypographyState();
        typographyState = { ...defaults, ...data.state };
        
        // Merge missing line heights from defaults (migration)
        DEFAULT_LINE_HEIGHTS.forEach(defaultLH => {
          if (!typographyState.lineHeights.some(lh => lh.name === defaultLH.name)) {
            typographyState.lineHeights.push(defaultLH);
          }
        });
        typographyState.lineHeights.sort((a, b) => a.value - b.value);
      }
      if (data.breakpoints) {
        breakpointConfigs = data.breakpoints;
      }
      if (data.responsiveEnabled !== undefined) {
        responsiveModesEnabled = data.responsiveEnabled;
      }
      console.log('[Typography] State loaded');
      return true;
    }
    
    return false;
  } catch (e) {
    console.warn('[Typography] Failed to load state:', e);
    return false;
  }
}

/**
 * Сбросить настройки типографики к значениям по умолчанию
 */
export async function resetTypographyToDefaults(): Promise<void> {
  // Сбрасываем состояние
  typographyState = createDefaultTypographyState();
  breakpointConfigs = [...DEFAULT_BREAKPOINTS];
  responsiveModesEnabled = true;
  
  // Очищаем storage
  try {
    await storageDelete(STORAGE_KEYS.TYPOGRAPHY_STATE);
  } catch (e) {
    console.warn('[Typography] Failed to clear storage:', e);
  }
  
  // Перезагружаем UI
  loadDefaultSemanticTokens();
  renderFontFamilies();
  renderFontSizes();
  renderLineHeights();
  renderLetterSpacings();
  renderBreakpointSettings();
  
  // Обновляем чекбокс
  const responsiveToggle = document.getElementById('responsive-modes-enabled') as HTMLInputElement;
  if (responsiveToggle) {
    responsiveToggle.checked = responsiveModesEnabled;
  }
}

/**
 * Вызывается при изменении состояния (для auto-save)
 */
function onTypographyStateChanged(): void {
  saveTypographyState();
}

// ============================================
// CATEGORY → SUBCATEGORY MAPPING (Полная структура)
// ============================================

const CATEGORY_SUBCATEGORIES: Record<string, { value: string; label: string; description: string }[]> = {
  page: [
    { value: 'hero', label: 'Hero', description: 'Главный заголовок страницы, лендинга' },
    { value: 'title', label: 'Title', description: 'Заголовок страницы H1' },
    { value: 'subtitle', label: 'Subtitle', description: 'Подзаголовок страницы' },
    { value: 'description', label: 'Description', description: 'Описание страницы под заголовком' },
  ],
  section: [
    { value: 'heading', label: 'Heading', description: 'Заголовок секции H2' },
    { value: 'subheading', label: 'Subheading', description: 'Подзаголовок секции H3' },
    { value: 'description', label: 'Description', description: 'Описание секции' },
  ],
  card: [
    { value: 'title', label: 'Title', description: 'Заголовок карточки' },
    { value: 'subtitle', label: 'Subtitle', description: 'Подзаголовок карточки' },
    { value: 'body', label: 'Body', description: 'Основной текст карточки' },
    { value: 'meta', label: 'Meta', description: 'Мета-информация (дата, автор)' },
    { value: 'caption', label: 'Caption', description: 'Подпись к изображению' },
  ],
  modal: [
    { value: 'title', label: 'Title', description: 'Заголовок модального окна' },
    { value: 'subtitle', label: 'Subtitle', description: 'Подзаголовок модального окна' },
    { value: 'body', label: 'Body', description: 'Текст в модальном окне' },
    { value: 'action', label: 'Action', description: 'Текст кнопок действий' },
  ],
  sidebar: [
    { value: 'groupTitle', label: 'Group Title', description: 'Заголовок группы в сайдбаре (UPPERCASE)' },
    { value: 'itemLabel', label: 'Item Label', description: 'Текст пункта меню' },
    { value: 'caption', label: 'Caption', description: 'Подпись/описание пункта' },
  ],
  paragraph: [
    { value: 'lead', label: 'Lead', description: 'Лид-абзац, вводный текст' },
    { value: 'default', label: 'Default', description: 'Стандартный текст статьи' },
    { value: 'compact', label: 'Compact', description: 'Компактный текст в UI' },
    { value: 'dense', label: 'Dense', description: 'Плотный текст, таблицы' },
  ],
  helper: [
    { value: 'hint', label: 'Hint', description: 'Подсказка к элементу' },
    { value: 'caption', label: 'Caption', description: 'Подпись к изображению/элементу' },
    { value: 'footnote', label: 'Footnote', description: 'Сноска, примечание' },
  ],
  action: [
    { value: 'button.primary', label: 'Button Primary', description: 'Основная кнопка' },
    { value: 'button.compact', label: 'Button Compact', description: 'Компактная кнопка' },
    { value: 'button.large', label: 'Button Large', description: 'Большая кнопка CTA' },
    { value: 'link.inline', label: 'Link Inline', description: 'Ссылка внутри текста' },
    { value: 'link.standalone', label: 'Link Standalone', description: 'Отдельная ссылка' },
    { value: 'link.navigation', label: 'Link Navigation', description: 'Навигационная ссылка' },
  ],
  form: [
    { value: 'label.default', label: 'Label Default', description: 'Стандартный лейбл поля' },
    { value: 'label.floating', label: 'Label Floating', description: 'Плавающий лейбл' },
    { value: 'label.required', label: 'Label Required', description: 'Обязательное поле' },
    { value: 'input.value', label: 'Input Value', description: 'Введённое значение' },
    { value: 'input.placeholder', label: 'Input Placeholder', description: 'Плейсхолдер' },
    { value: 'textarea.value', label: 'Textarea Value', description: 'Текст в textarea' },
    { value: 'validation.error', label: 'Validation Error', description: 'Сообщение об ошибке' },
    { value: 'validation.success', label: 'Validation Success', description: 'Сообщение об успехе' },
    { value: 'validation.warning', label: 'Validation Warning', description: 'Предупреждение' },
    { value: 'helpText', label: 'Help Text', description: 'Вспомогательный текст под полем' },
  ],
  data: [
    { value: 'table.header', label: 'Table Header', description: 'Заголовок столбца таблицы' },
    { value: 'table.cell', label: 'Table Cell', description: 'Ячейка таблицы' },
    { value: 'table.cellNumeric', label: 'Table Cell Numeric', description: 'Числовая ячейка (моноширинный)' },
    { value: 'table.footer', label: 'Table Footer', description: 'Футер таблицы (итоги)' },
    { value: 'metric.value', label: 'Metric Value', description: 'Значение KPI/метрики' },
    { value: 'metric.valueCompact', label: 'Metric Value Compact', description: 'Компактное значение метрики' },
    { value: 'metric.label', label: 'Metric Label', description: 'Название метрики' },
    { value: 'metric.delta', label: 'Metric Delta', description: 'Изменение метрики (+12%)' },
    { value: 'metric.unit', label: 'Metric Unit', description: 'Единица измерения' },
  ],
  status: [
    { value: 'badge.default', label: 'Badge Default', description: 'Стандартный бейдж' },
    { value: 'badge.counter', label: 'Badge Counter', description: 'Счётчик уведомлений' },
    { value: 'tag', label: 'Tag', description: 'Тег/метка' },
  ],
  notification: [
    { value: 'toast.title', label: 'Toast Title', description: 'Заголовок тоста' },
    { value: 'toast.message', label: 'Toast Message', description: 'Текст тоста' },
    { value: 'banner.title', label: 'Banner Title', description: 'Заголовок баннера' },
    { value: 'banner.message', label: 'Banner Message', description: 'Текст баннера' },
    { value: 'alert.title', label: 'Alert Title', description: 'Заголовок алерта' },
    { value: 'alert.description', label: 'Alert Description', description: 'Описание алерта' },
  ],
  navigation: [
    { value: 'menu.item', label: 'Menu Item', description: 'Пункт меню' },
    { value: 'menu.itemActive', label: 'Menu Item Active', description: 'Активный пункт меню' },
    { value: 'menu.groupLabel', label: 'Menu Group Label', description: 'Группа меню (UPPERCASE)' },
    { value: 'breadcrumb.item', label: 'Breadcrumb Item', description: 'Элемент хлебных крошек' },
    { value: 'breadcrumb.current', label: 'Breadcrumb Current', description: 'Текущая страница' },
    { value: 'tab.label', label: 'Tab Label', description: 'Название вкладки' },
    { value: 'tab.labelActive', label: 'Tab Label Active', description: 'Активная вкладка' },
    { value: 'tab.badge', label: 'Tab Badge', description: 'Бейдж на вкладке' },
    { value: 'pagination.item', label: 'Pagination Item', description: 'Номер страницы' },
    { value: 'pagination.info', label: 'Pagination Info', description: 'Информация о страницах' },
  ],
  code: [
    { value: 'inline', label: 'Inline', description: 'Код внутри текста' },
    { value: 'block', label: 'Block', description: 'Блок кода' },
    { value: 'lineNumber', label: 'Line Number', description: 'Номера строк' },
    { value: 'comment', label: 'Comment', description: 'Комментарии в коде' },
  ],
  content: [
    { value: 'blockquote.text', label: 'Blockquote Text', description: 'Текст цитаты' },
    { value: 'blockquote.citation', label: 'Blockquote Citation', description: 'Автор цитаты' },
    { value: 'list.item', label: 'List Item', description: 'Элемент списка' },
    { value: 'list.itemCompact', label: 'List Item Compact', description: 'Компактный список' },
    { value: 'timestamp.absolute', label: 'Timestamp Absolute', description: 'Абсолютная дата (12.05.2024)' },
    { value: 'timestamp.relative', label: 'Timestamp Relative', description: 'Относительная дата (5 мин назад)' },
  ],
  empty: [
    { value: 'title', label: 'Title', description: 'Заголовок пустого состояния' },
    { value: 'description', label: 'Description', description: 'Описание пустого состояния' },
    { value: 'action', label: 'Action', description: 'Текст кнопки действия' },
  ],
  loading: [
    { value: 'label', label: 'Label', description: 'Текст загрузки' },
    { value: 'percentage', label: 'Percentage', description: 'Процент загрузки' },
    { value: 'status', label: 'Status', description: 'Статус загрузки' },
  ],
};

// ============================================
// UI INITIALIZATION
// ============================================

export function initTypographyUI(): void {
  // Initialize typography tabs
  initTypographyTabs();
  
  // Render primitives first with defaults
  renderFontFamilies();
  renderFontSizes();
  renderLineHeights();
  renderLetterSpacings();
  
  // Setup event listeners
  setupTypographyEvents();
  
  // Setup modal events
  setupModalEvents();
  
  // Load default semantic tokens first
  loadDefaultSemanticTokens();
  
  // Render breakpoint settings
  renderBreakpointSettings();
  
  // Update responsive toggle
  const responsiveToggle = document.getElementById('responsive-modes-enabled') as HTMLInputElement;
  if (responsiveToggle) {
    responsiveToggle.checked = responsiveModesEnabled;
  }
  
  // Рендерим фильтр категорий
  renderCategoryFilter();
  
  // Затем асинхронно загружаем сохранённое состояние
  loadTypographyState().then((hasStoredState) => {
    if (hasStoredState) {
      // Re-render UI with loaded state
      renderFontFamilies();
      renderFontSizes();
      renderLineHeights();
      renderLetterSpacings();
      renderBreakpointSettings();
      
      // Update responsive toggle
      const toggle = document.getElementById('responsive-modes-enabled') as HTMLInputElement;
      if (toggle) {
        toggle.checked = responsiveModesEnabled;
      }
      
      // Re-render category filter with loaded custom categories
      renderCategoryFilter();
      
      // Update select options in modal
      updateLineHeightSelect();
      
      // Если есть сохранённые семантические токены - рендерим их
      if (typographyState.semanticTokens.length > 0) {
        renderSemanticTokens();
      }
    }
  });
}

function initTypographyTabs(): void {
  // Only select Typography tabs (with data-typo-tab attribute)
  const tabs = document.querySelectorAll('.typo-tab[data-typo-tab]');
  const container = document.getElementById('prim-typography');
  if (!container) return;
  
  const contents = container.querySelectorAll('.typo-tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-typo-tab');
      
      // Only toggle Typography tabs
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');
      }
    });
  });
}

// ============================================
// RENDER PRIMITIVES
// ============================================

function renderFontSizes(): void {
  const container = document.getElementById('font-sizes-grid');
  if (!container) return;
  
  container.innerHTML = typographyState.fontSizes.map(size => `
    <div class="typo-scale-item active" data-size="${size.name}" title="${size.value}px">
      ${size.value}
    </div>
  `).join('');
  
  // Add click handlers
  container.querySelectorAll('.typo-scale-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });
}

function renderLineHeights(): void {
  const container = document.getElementById('line-heights-grid');
  if (!container) return;
  
  container.innerHTML = typographyState.lineHeights.map(lh => `
    <div class="typo-scale-item active" data-line-height="${lh.name}" title="×${lh.value}">
      ${lh.value}
    </div>
  `).join('');
  
  container.querySelectorAll('.typo-scale-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });
}

function renderLetterSpacings(): void {
  const container = document.getElementById('letter-spacings-grid');
  if (!container) return;
  
  container.innerHTML = typographyState.letterSpacings.map(ls => {
    const isNegative = ls.value < 0;
    const displayValue = ls.value === 0 ? '0' : (ls.value > 0 ? `+${ls.value}` : ls.value);
    return `
      <div class="typo-spacing-item active ${isNegative ? 'negative' : ''}" 
           data-spacing="${ls.name}" 
           title="${ls.value}em = ${letterSpacingToPercent(ls.value)}%">
        ${displayValue}em
      </div>
    `;
  }).join('');
  
  container.querySelectorAll('.typo-spacing-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });
}

// ============================================
// RESPONSIVE DEFAULTS
// ============================================

/**
 * Категории, для которых responsive включен по умолчанию
 * Это крупные заголовки, которые должны масштабироваться на разных устройствах
 */
const RESPONSIVE_CATEGORIES_DEFAULT: string[] = [
  'page',      // Заголовки страниц - hero, title, subtitle
  'section',   // Заголовки секций - h2, h3
];

/**
 * Subcategories которые должны быть responsive независимо от категории
 * (например, lead paragraph - крупный вводный текст)
 */
const RESPONSIVE_SUBCATEGORIES_DEFAULT: string[] = [
  'hero',
  'title', 
  'lead',
];

/**
 * Определяет, должен ли токен быть responsive по умолчанию
 */
function shouldBeResponsiveByDefault(category: string, subcategory?: string): boolean {
  // Проверяем категорию
  if (RESPONSIVE_CATEGORIES_DEFAULT.includes(category)) {
    return true;
  }
  
  // Проверяем subcategory
  if (subcategory && RESPONSIVE_SUBCATEGORIES_DEFAULT.some(sub => subcategory.includes(sub))) {
    return true;
  }
  
  return false;
}

// ============================================
// SEMANTIC TOKENS
// ============================================

function loadDefaultSemanticTokens(): void {
  // Complete semantic tokens based on the full typography specification
  const defaultTokens: TypographySemanticToken[] = [
    // ============================================
    // PAGE HEADINGS
    // ============================================
    {
      id: 'typography.page.hero',
      path: ['typography', 'page', 'hero'],
      name: 'hero',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.56}',
      fontWeight: '{font.weight.700}',
      lineHeight: '{font.lineHeight.110}',
      letterSpacing: '{font.letterSpacing.n025}',
      category: 'page',
      subcategory: 'hero',
      description: 'Hero page heading - Landing pages, main CTAs',
    },
    {
      id: 'typography.page.title',
      path: ['typography', 'page', 'title'],
      name: 'title',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.40}',
      fontWeight: '{font.weight.700}',
      lineHeight: '{font.lineHeight.120}',
      letterSpacing: '{font.letterSpacing.n020}',
      category: 'page',
      subcategory: 'title',
      description: 'Page title H1',
    },
    {
      id: 'typography.page.subtitle',
      path: ['typography', 'page', 'subtitle'],
      name: 'subtitle',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.24}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.n015}',
      category: 'page',
      subcategory: 'subtitle',
      description: 'Page subtitle',
    },
    
    // ============================================
    // SECTION HEADINGS
    // ============================================
    {
      id: 'typography.section.heading',
      path: ['typography', 'section', 'heading'],
      name: 'heading',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.32}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.125}',
      letterSpacing: '{font.letterSpacing.n015}',
      category: 'section',
      subcategory: 'heading',
      description: 'Section heading H2',
    },
    {
      id: 'typography.section.subheading',
      path: ['typography', 'section', 'subheading'],
      name: 'subheading',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.20}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'section',
      subcategory: 'subheading',
      description: 'Section subheading H3',
    },
    
    // ============================================
    // CARD TYPOGRAPHY
    // ============================================
    {
      id: 'typography.card.title',
      path: ['typography', 'card', 'title'],
      name: 'title',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.18}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'card',
      subcategory: 'title',
      description: 'Card title',
    },
    {
      id: 'typography.card.subtitle',
      path: ['typography', 'card', 'subtitle'],
      name: 'subtitle',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'card',
      subcategory: 'subtitle',
      description: 'Card subtitle',
    },
    {
      id: 'typography.card.body',
      path: ['typography', 'card', 'body'],
      name: 'body',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.150}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'card',
      subcategory: 'body',
      description: 'Card body text',
    },
    {
      id: 'typography.card.meta',
      path: ['typography', 'card', 'meta'],
      name: 'meta',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.11}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.015}',
      category: 'card',
      subcategory: 'meta',
      description: 'Card meta info (date, author)',
    },
    
    // ============================================
    // MODAL TYPOGRAPHY
    // ============================================
    {
      id: 'typography.modal.title',
      path: ['typography', 'modal', 'title'],
      name: 'title',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.20}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.n010}',
      category: 'modal',
      subcategory: 'title',
      description: 'Modal dialog title',
    },
    {
      id: 'typography.modal.subtitle',
      path: ['typography', 'modal', 'subtitle'],
      name: 'subtitle',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.150}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'modal',
      subcategory: 'subtitle',
      description: 'Modal subtitle',
    },
    
    // ============================================
    // SIDEBAR TYPOGRAPHY
    // ============================================
    {
      id: 'typography.sidebar.groupTitle',
      path: ['typography', 'sidebar', 'groupTitle'],
      name: 'groupTitle',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.11}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.120}',
      letterSpacing: '{font.letterSpacing.075}',
      textTransform: '{font.transform.uppercase}',
      category: 'sidebar',
      subcategory: 'groupTitle',
      description: 'Sidebar group title (UPPERCASE)',
    },
    {
      id: 'typography.sidebar.itemLabel',
      path: ['typography', 'sidebar', 'itemLabel'],
      name: 'itemLabel',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'sidebar',
      subcategory: 'itemLabel',
      description: 'Sidebar menu item',
    },
    
    // ============================================
    // PARAGRAPH TEXT
    // ============================================
    {
      id: 'typography.paragraph.lead',
      path: ['typography', 'paragraph', 'lead'],
      name: 'lead',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.20}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.160}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'paragraph',
      subcategory: 'lead',
      description: 'Lead paragraph - intro text',
    },
    {
      id: 'typography.paragraph.default',
      path: ['typography', 'paragraph', 'default'],
      name: 'default',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.16}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.160}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'paragraph',
      subcategory: 'default',
      description: 'Standard body text',
    },
    {
      id: 'typography.paragraph.compact',
      path: ['typography', 'paragraph', 'compact'],
      name: 'compact',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.150}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'paragraph',
      subcategory: 'compact',
      description: 'Compact paragraph - UI text',
    },
    {
      id: 'typography.paragraph.dense',
      path: ['typography', 'paragraph', 'dense'],
      name: 'dense',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.13}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.150}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'paragraph',
      subcategory: 'dense',
      description: 'Dense paragraph - tables, lists',
    },
    
    // ============================================
    // HELPER TEXT
    // ============================================
    {
      id: 'typography.helper.hint',
      path: ['typography', 'helper', 'hint'],
      name: 'hint',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'helper',
      subcategory: 'hint',
      description: 'Hint text - tooltips, helpers',
    },
    {
      id: 'typography.helper.caption',
      path: ['typography', 'helper', 'caption'],
      name: 'caption',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.11}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.015}',
      category: 'helper',
      subcategory: 'caption',
      description: 'Caption - image captions',
    },
    {
      id: 'typography.helper.footnote',
      path: ['typography', 'helper', 'footnote'],
      name: 'footnote',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.10}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.020}',
      category: 'helper',
      subcategory: 'footnote',
      description: 'Footnote - legal text, notes',
    },
    
    // ============================================
    // ACTION - BUTTONS
    // ============================================
    {
      id: 'typography.action.button.primary',
      path: ['typography', 'action', 'button', 'primary'],
      name: 'primary',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'action',
      subcategory: 'button.primary',
      description: 'Primary button',
    },
    {
      id: 'typography.action.button.compact',
      path: ['typography', 'action', 'button', 'compact'],
      name: 'compact',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.015}',
      category: 'action',
      subcategory: 'button.compact',
      description: 'Compact/small button',
    },
    {
      id: 'typography.action.button.large',
      path: ['typography', 'action', 'button', 'large'],
      name: 'large',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.16}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'action',
      subcategory: 'button.large',
      description: 'Large CTA button',
    },
    
    // ============================================
    // ACTION - LINKS
    // ============================================
    {
      id: 'typography.action.link.inline',
      path: ['typography', 'action', 'link', 'inline'],
      name: 'inline',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.16}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.160}',
      letterSpacing: '{font.letterSpacing.000}',
      textDecoration: '{font.decoration.underline}',
      category: 'action',
      subcategory: 'link.inline',
      description: 'Inline link in text',
    },
    {
      id: 'typography.action.link.standalone',
      path: ['typography', 'action', 'link', 'standalone'],
      name: 'standalone',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'action',
      subcategory: 'link.standalone',
      description: 'Standalone link',
    },
    {
      id: 'typography.action.link.navigation',
      path: ['typography', 'action', 'link', 'navigation'],
      name: 'navigation',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'action',
      subcategory: 'link.navigation',
      description: 'Navigation link',
    },
    
    // ============================================
    // FORM - LABELS
    // ============================================
    {
      id: 'typography.form.label.default',
      path: ['typography', 'form', 'label', 'default'],
      name: 'default',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'form',
      subcategory: 'label.default',
      description: 'Default form label',
    },
    {
      id: 'typography.form.label.floating',
      path: ['typography', 'form', 'label', 'floating'],
      name: 'floating',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'form',
      subcategory: 'label.floating',
      description: 'Floating label (focused state)',
    },
    {
      id: 'typography.form.label.required',
      path: ['typography', 'form', 'label', 'required'],
      name: 'required',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'form',
      subcategory: 'label.required',
      description: 'Required field label',
    },
    
    // ============================================
    // FORM - INPUTS
    // ============================================
    {
      id: 'typography.form.input.value',
      path: ['typography', 'form', 'input', 'value'],
      name: 'value',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'form',
      subcategory: 'input.value',
      description: 'Input value text',
    },
    {
      id: 'typography.form.input.placeholder',
      path: ['typography', 'form', 'input', 'placeholder'],
      name: 'placeholder',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      fontStyle: '{font.style.italic}',
      category: 'form',
      subcategory: 'input.placeholder',
      description: 'Input placeholder (italic)',
    },
    {
      id: 'typography.form.textarea.value',
      path: ['typography', 'form', 'textarea', 'value'],
      name: 'value',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.160}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'form',
      subcategory: 'textarea.value',
      description: 'Textarea value',
    },
    
    // ============================================
    // FORM - VALIDATION
    // ============================================
    {
      id: 'typography.form.validation.error',
      path: ['typography', 'form', 'validation', 'error'],
      name: 'error',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'form',
      subcategory: 'validation.error',
      description: 'Error message',
    },
    {
      id: 'typography.form.validation.success',
      path: ['typography', 'form', 'validation', 'success'],
      name: 'success',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'form',
      subcategory: 'validation.success',
      description: 'Success message',
    },
    {
      id: 'typography.form.validation.warning',
      path: ['typography', 'form', 'validation', 'warning'],
      name: 'warning',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'form',
      subcategory: 'validation.warning',
      description: 'Warning message',
    },
    {
      id: 'typography.form.helpText',
      path: ['typography', 'form', 'helpText'],
      name: 'helpText',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'form',
      subcategory: 'helpText',
      description: 'Help text under input',
    },
    
    // ============================================
    // DATA - TABLE
    // ============================================
    {
      id: 'typography.data.table.header',
      path: ['typography', 'data', 'table', 'header'],
      name: 'header',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.120}',
      letterSpacing: '{font.letterSpacing.025}',
      textTransform: '{font.transform.uppercase}',
      category: 'data',
      subcategory: 'table.header',
      description: 'Table header (UPPERCASE)',
    },
    {
      id: 'typography.data.table.cell',
      path: ['typography', 'data', 'table', 'cell'],
      name: 'cell',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'data',
      subcategory: 'table.cell',
      description: 'Table cell text',
    },
    {
      id: 'typography.data.table.cellNumeric',
      path: ['typography', 'data', 'table', 'cellNumeric'],
      name: 'cellNumeric',
      fontFamily: '{font.family.roboto-mono}',
      fontSize: '{font.size.13}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'data',
      subcategory: 'table.cellNumeric',
      description: 'Numeric cell (monospace)',
    },
    {
      id: 'typography.data.table.footer',
      path: ['typography', 'data', 'table', 'footer'],
      name: 'footer',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'data',
      subcategory: 'table.footer',
      description: 'Table footer (totals)',
    },
    
    // ============================================
    // DATA - METRICS
    // ============================================
    {
      id: 'typography.data.metric.value',
      path: ['typography', 'data', 'metric', 'value'],
      name: 'value',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.36}',
      fontWeight: '{font.weight.700}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.n020}',
      category: 'data',
      subcategory: 'metric.value',
      description: 'KPI/metric value',
    },
    {
      id: 'typography.data.metric.valueCompact',
      path: ['typography', 'data', 'metric', 'valueCompact'],
      name: 'valueCompact',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.24}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.110}',
      letterSpacing: '{font.letterSpacing.n015}',
      category: 'data',
      subcategory: 'metric.valueCompact',
      description: 'Compact metric value',
    },
    {
      id: 'typography.data.metric.label',
      path: ['typography', 'data', 'metric', 'label'],
      name: 'label',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.120}',
      letterSpacing: '{font.letterSpacing.025}',
      textTransform: '{font.transform.uppercase}',
      category: 'data',
      subcategory: 'metric.label',
      description: 'Metric label (UPPERCASE)',
    },
    {
      id: 'typography.data.metric.delta',
      path: ['typography', 'data', 'metric', 'delta'],
      name: 'delta',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'data',
      subcategory: 'metric.delta',
      description: 'Metric change (+12%)',
    },
    {
      id: 'typography.data.metric.unit',
      path: ['typography', 'data', 'metric', 'unit'],
      name: 'unit',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'data',
      subcategory: 'metric.unit',
      description: 'Unit of measurement',
    },
    
    // ============================================
    // STATUS - BADGES & TAGS
    // ============================================
    {
      id: 'typography.status.badge.default',
      path: ['typography', 'status', 'badge', 'default'],
      name: 'default',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.11}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.020}',
      category: 'status',
      subcategory: 'badge.default',
      description: 'Standard badge',
    },
    {
      id: 'typography.status.badge.counter',
      path: ['typography', 'status', 'badge', 'counter'],
      name: 'counter',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.10}',
      fontWeight: '{font.weight.700}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'status',
      subcategory: 'badge.counter',
      description: 'Notification counter',
    },
    {
      id: 'typography.status.tag',
      path: ['typography', 'status', 'tag'],
      name: 'tag',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.015}',
      category: 'status',
      subcategory: 'tag',
      description: 'Tag/label',
    },
    
    // ============================================
    // NOTIFICATION - TOAST
    // ============================================
    {
      id: 'typography.notification.toast.title',
      path: ['typography', 'notification', 'toast', 'title'],
      name: 'title',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'notification',
      subcategory: 'toast.title',
      description: 'Toast title',
    },
    {
      id: 'typography.notification.toast.message',
      path: ['typography', 'notification', 'toast', 'message'],
      name: 'message',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.13}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'notification',
      subcategory: 'toast.message',
      description: 'Toast message',
    },
    
    // ============================================
    // NOTIFICATION - BANNER
    // ============================================
    {
      id: 'typography.notification.banner.title',
      path: ['typography', 'notification', 'banner', 'title'],
      name: 'title',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.16}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'notification',
      subcategory: 'banner.title',
      description: 'Banner title',
    },
    {
      id: 'typography.notification.banner.message',
      path: ['typography', 'notification', 'banner', 'message'],
      name: 'message',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.150}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'notification',
      subcategory: 'banner.message',
      description: 'Banner message',
    },
    
    // ============================================
    // NOTIFICATION - ALERT
    // ============================================
    {
      id: 'typography.notification.alert.title',
      path: ['typography', 'notification', 'alert', 'title'],
      name: 'title',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'notification',
      subcategory: 'alert.title',
      description: 'Alert title',
    },
    {
      id: 'typography.notification.alert.description',
      path: ['typography', 'notification', 'alert', 'description'],
      name: 'description',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.150}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'notification',
      subcategory: 'alert.description',
      description: 'Alert description',
    },
    
    // ============================================
    // NAVIGATION - MENU
    // ============================================
    {
      id: 'typography.navigation.menu.item',
      path: ['typography', 'navigation', 'menu', 'item'],
      name: 'item',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'navigation',
      subcategory: 'menu.item',
      description: 'Menu item',
    },
    {
      id: 'typography.navigation.menu.itemActive',
      path: ['typography', 'navigation', 'menu', 'itemActive'],
      name: 'itemActive',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'navigation',
      subcategory: 'menu.itemActive',
      description: 'Active menu item',
    },
    {
      id: 'typography.navigation.menu.groupLabel',
      path: ['typography', 'navigation', 'menu', 'groupLabel'],
      name: 'groupLabel',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.11}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.075}',
      textTransform: '{font.transform.uppercase}',
      category: 'navigation',
      subcategory: 'menu.groupLabel',
      description: 'Menu group label (UPPERCASE)',
    },
    
    // ============================================
    // NAVIGATION - BREADCRUMB
    // ============================================
    {
      id: 'typography.navigation.breadcrumb.item',
      path: ['typography', 'navigation', 'breadcrumb', 'item'],
      name: 'item',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.13}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'navigation',
      subcategory: 'breadcrumb.item',
      description: 'Breadcrumb item',
    },
    {
      id: 'typography.navigation.breadcrumb.current',
      path: ['typography', 'navigation', 'breadcrumb', 'current'],
      name: 'current',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.13}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'navigation',
      subcategory: 'breadcrumb.current',
      description: 'Current breadcrumb',
    },
    
    // ============================================
    // NAVIGATION - TABS
    // ============================================
    {
      id: 'typography.navigation.tab.label',
      path: ['typography', 'navigation', 'tab', 'label'],
      name: 'label',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'navigation',
      subcategory: 'tab.label',
      description: 'Tab label',
    },
    {
      id: 'typography.navigation.tab.labelActive',
      path: ['typography', 'navigation', 'tab', 'labelActive'],
      name: 'labelActive',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'navigation',
      subcategory: 'tab.labelActive',
      description: 'Active tab label',
    },
    {
      id: 'typography.navigation.tab.badge',
      path: ['typography', 'navigation', 'tab', 'badge'],
      name: 'badge',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.11}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'navigation',
      subcategory: 'tab.badge',
      description: 'Tab badge',
    },
    
    // ============================================
    // NAVIGATION - PAGINATION
    // ============================================
    {
      id: 'typography.navigation.pagination.item',
      path: ['typography', 'navigation', 'pagination', 'item'],
      name: 'item',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'navigation',
      subcategory: 'pagination.item',
      description: 'Pagination page number',
    },
    {
      id: 'typography.navigation.pagination.info',
      path: ['typography', 'navigation', 'pagination', 'info'],
      name: 'info',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.13}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'navigation',
      subcategory: 'pagination.info',
      description: 'Pagination info text',
    },
    
    // ============================================
    // CODE
    // ============================================
    {
      id: 'typography.code.inline',
      path: ['typography', 'code', 'inline'],
      name: 'inline',
      fontFamily: '{font.family.roboto-mono}',
      fontSize: '{font.size.13}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'code',
      subcategory: 'inline',
      description: 'Inline code snippet',
    },
    {
      id: 'typography.code.block',
      path: ['typography', 'code', 'block'],
      name: 'block',
      fontFamily: '{font.family.roboto-mono}',
      fontSize: '{font.size.13}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.160}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'code',
      subcategory: 'block',
      description: 'Code block',
    },
    {
      id: 'typography.code.lineNumber',
      path: ['typography', 'code', 'lineNumber'],
      name: 'lineNumber',
      fontFamily: '{font.family.roboto-mono}',
      fontSize: '{font.size.11}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.160}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'code',
      subcategory: 'lineNumber',
      description: 'Line numbers',
    },
    {
      id: 'typography.code.comment',
      path: ['typography', 'code', 'comment'],
      name: 'comment',
      fontFamily: '{font.family.roboto-mono}',
      fontSize: '{font.size.13}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.160}',
      letterSpacing: '{font.letterSpacing.000}',
      fontStyle: '{font.style.italic}',
      category: 'code',
      subcategory: 'comment',
      description: 'Code comment (italic)',
    },
    
    // ============================================
    // CONTENT - BLOCKQUOTE
    // ============================================
    {
      id: 'typography.content.blockquote.text',
      path: ['typography', 'content', 'blockquote', 'text'],
      name: 'text',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.18}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.170}',
      letterSpacing: '{font.letterSpacing.000}',
      fontStyle: '{font.style.italic}',
      category: 'content',
      subcategory: 'blockquote.text',
      description: 'Quote text (italic)',
    },
    {
      id: 'typography.content.blockquote.citation',
      path: ['typography', 'content', 'blockquote', 'citation'],
      name: 'citation',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'content',
      subcategory: 'blockquote.citation',
      description: 'Quote author',
    },
    
    // ============================================
    // CONTENT - LISTS
    // ============================================
    {
      id: 'typography.content.list.item',
      path: ['typography', 'content', 'list', 'item'],
      name: 'item',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.16}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.160}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'content',
      subcategory: 'list.item',
      description: 'List item',
    },
    {
      id: 'typography.content.list.itemCompact',
      path: ['typography', 'content', 'list', 'itemCompact'],
      name: 'itemCompact',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.150}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'content',
      subcategory: 'list.itemCompact',
      description: 'Compact list item',
    },
    
    // ============================================
    // CONTENT - TIMESTAMP
    // ============================================
    {
      id: 'typography.content.timestamp.absolute',
      path: ['typography', 'content', 'timestamp', 'absolute'],
      name: 'absolute',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'content',
      subcategory: 'timestamp.absolute',
      description: 'Absolute date (12.05.2024)',
    },
    {
      id: 'typography.content.timestamp.relative',
      path: ['typography', 'content', 'timestamp', 'relative'],
      name: 'relative',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'content',
      subcategory: 'timestamp.relative',
      description: 'Relative date (5 min ago)',
    },
    
    // ============================================
    // EMPTY STATES
    // ============================================
    {
      id: 'typography.empty.title',
      path: ['typography', 'empty', 'title'],
      name: 'title',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.20}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.n010}',
      category: 'empty',
      subcategory: 'title',
      description: 'Empty state title',
    },
    {
      id: 'typography.empty.description',
      path: ['typography', 'empty', 'description'],
      name: 'description',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.160}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'empty',
      subcategory: 'description',
      description: 'Empty state description',
    },
    {
      id: 'typography.empty.action',
      path: ['typography', 'empty', 'action'],
      name: 'action',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'empty',
      subcategory: 'action',
      description: 'Empty state CTA',
    },
    
    // ============================================
    // LOADING STATES
    // ============================================
    {
      id: 'typography.loading.label',
      path: ['typography', 'loading', 'label'],
      name: 'label',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'loading',
      subcategory: 'label',
      description: 'Loading text',
    },
    {
      id: 'typography.loading.percentage',
      path: ['typography', 'loading', 'percentage'],
      name: 'percentage',
      fontFamily: '{font.family.roboto-mono}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'loading',
      subcategory: 'percentage',
      description: 'Loading percentage',
    },
    {
      id: 'typography.loading.status',
      path: ['typography', 'loading', 'status'],
      name: 'status',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'loading',
      subcategory: 'status',
      description: 'Loading status text',
    },
  ];
  
  // Применяем responsive по умолчанию для соответствующих категорий
  const tokensWithResponsive = defaultTokens.map(token => ({
    ...token,
    responsive: shouldBeResponsiveByDefault(token.category, token.subcategory),
  }));
  
  typographyState.semanticTokens = tokensWithResponsive;
  renderSemanticTokens();
}

function renderSemanticTokens(): void {
  const container = document.getElementById('semantic-tokens-list');
  if (!container) return;
  
  // Group tokens by category
  const grouped = typographyState.semanticTokens.reduce((acc, token) => {
    if (!acc[token.category]) acc[token.category] = [];
    acc[token.category].push(token);
    return acc;
  }, {} as Record<string, TypographySemanticToken[]>);
  
  const categoryIcons: Record<string, string> = {
    page: '📄',
    section: '📑',
    card: '🃏',
    modal: '🪟',
    sidebar: '📌',
    paragraph: '📝',
    helper: '💡',
    action: '🔘',
    form: '📋',
    data: '📊',
    status: '🏷️',
    notification: '🔔',
    navigation: '🧭',
    code: '💻',
    content: '📖',
    empty: '📭',
    loading: '⏳',
  };
  
  // Merge custom categories icons
  const customIcons: Record<string, string> = {};
  typographyState.customCategories?.forEach(cat => {
    customIcons[cat.id] = cat.icon;
  });
  const allIcons = { ...categoryIcons, ...customIcons };
  
  container.innerHTML = Object.entries(grouped).map(([category, tokens]) => {
    const isCustom = typographyState.customCategories?.some(c => c.id === category);
    return `
    <div class="semantic-token-group" data-category="${category}">
      <div class="semantic-group-header">
        <span class="group-icon">${allIcons[category] || '📎'}</span>
        <span class="group-name">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
        <span class="group-count">${tokens.length} токен${tokens.length > 1 ? (tokens.length < 5 ? 'а' : 'ов') : ''}</span>
        <button class="btn-icon btn-add-token-to-category" data-category="${category}" title="Добавить токен в секцию">+</button>
        ${isCustom ? `<button class="btn-icon btn-delete-category" data-category="${category}" title="Удалить секцию">🗑️</button>` : ''}
      </div>
      <div class="semantic-group-items">
        ${tokens.map(token => renderSemanticTokenItem(token)).join('')}
      </div>
    </div>
  `;
  }).join('');
  
  // Setup edit handlers
  container.querySelectorAll('.btn-edit-token').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = (e.target as HTMLElement).closest('.semantic-token-item');
      const tokenId = item?.getAttribute('data-token');
      if (tokenId) openTokenEditor(tokenId);
    });
  });
  
  // Setup add token to category handlers
  container.querySelectorAll('.btn-add-token-to-category').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const category = (e.target as HTMLElement).getAttribute('data-category');
      if (category) openTokenEditorForCategory(category);
    });
  });
  
  // Setup delete category handlers
  container.querySelectorAll('.btn-delete-category').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const category = (e.target as HTMLElement).getAttribute('data-category');
      if (category) deleteCategory(category);
    });
  });
}

function renderSemanticTokenItem(token: TypographySemanticToken): string {
  // Parse token references to get display values
  const fontSize = token.fontSize.match(/\{font\.size\.(\d+)\}/)?.[1] || '?';
  const fontWeight = token.fontWeight.match(/\{font\.weight\.(\d+)\}/)?.[1] || '?';
  const lineHeight = token.lineHeight.match(/\{font\.lineHeight\.(\d+)\}/)?.[1] || '?';
  const letterSpacing = token.letterSpacing.match(/\{font\.letterSpacing\.(n?\d+)\}/)?.[1] || '0';
  
  const lhValue = typographyState.lineHeights.find(lh => lh.name === lineHeight)?.value || 1.4;
  const lsValue = typographyState.letterSpacings.find(ls => ls.name === letterSpacing)?.value || 0;
  const lsDisplay = lsValue === 0 ? '0' : `${lsValue}em`;
  
  const displayName = token.path.slice(1).join('.');
  
  return `
    <div class="semantic-token-item" data-token="${token.id}">
      <div class="token-name">${displayName}</div>
      <div class="token-preview" style="font-size: ${Math.min(parseInt(fontSize), 20)}px; font-weight: ${fontWeight};">
        ${token.description || token.name}
      </div>
      <div class="token-props">${fontSize}px · ${getWeightLabel(parseInt(fontWeight))} · ${lhValue} · ${lsDisplay}</div>
      <button class="btn-icon btn-edit-token" title="Редактировать">✏️</button>
    </div>
  `;
}

function getWeightLabel(weight: number): string {
  const labels: Record<number, string> = {
    100: 'Thin',
    200: 'ExtraLight',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'Semibold',
    700: 'Bold',
    800: 'ExtraBold',
    900: 'Black',
  };
  return labels[weight] || String(weight);
}

// ============================================
// TOKEN EDITOR MODAL
// ============================================

let currentEditingTokenId: string | null = null;
let isNewToken = false;

/**
 * Update category select dropdown with custom categories
 */
function updateCategorySelectOptions(): void {
  const select = document.getElementById('typo-category') as HTMLSelectElement;
  if (!select) return;
  
  const defaultCategories = [
    { id: 'page', label: 'Page' },
    { id: 'section', label: 'Section' },
    { id: 'card', label: 'Card' },
    { id: 'modal', label: 'Modal' },
    { id: 'sidebar', label: 'Sidebar' },
    { id: 'paragraph', label: 'Paragraph' },
    { id: 'helper', label: 'Helper' },
    { id: 'action', label: 'Action' },
    { id: 'form', label: 'Form' },
    { id: 'data', label: 'Data' },
    { id: 'status', label: 'Status' },
    { id: 'notification', label: 'Notification' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'code', label: 'Code' },
  ];
  
  const customCategories = typographyState.customCategories || [];
  
  select.innerHTML = `
    ${defaultCategories.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
    ${customCategories.length > 0 ? '<option disabled>────────────</option>' : ''}
    ${customCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
  `;
}

function openTokenEditor(tokenId: string): void {
  const token = typographyState.semanticTokens.find(t => t.id === tokenId);
  if (!token) return;
  
  currentEditingTokenId = tokenId;
  isNewToken = false;
  
  // Populate form fields
  const modal = document.getElementById('typography-modal');
  if (!modal) return;
  
  // Update category dropdown with custom categories
  updateCategorySelectOptions();
  
  (document.getElementById('typography-modal-title') as HTMLElement).textContent = 'Редактировать токен';
  (document.getElementById('typo-token-path') as HTMLInputElement).value = token.id;
  (document.getElementById('typo-token-name') as HTMLInputElement).value = token.name;
  (document.getElementById('typo-font-family') as HTMLSelectElement).value = token.fontFamily;
  (document.getElementById('typo-font-size') as HTMLSelectElement).value = token.fontSize;
  (document.getElementById('typo-font-weight') as HTMLSelectElement).value = token.fontWeight;
  (document.getElementById('typo-line-height') as HTMLSelectElement).value = token.lineHeight;
  (document.getElementById('typo-letter-spacing') as HTMLSelectElement).value = token.letterSpacing;
  (document.getElementById('typo-text-decoration') as HTMLSelectElement).value = token.textDecoration || '';
  (document.getElementById('typo-text-transform') as HTMLSelectElement).value = token.textTransform || '';
  (document.getElementById('typo-category') as HTMLSelectElement).value = token.category;
  
  // Update subcategory options based on category, then set value
  updateSubcategoryOptions(token.category);
  (document.getElementById('typo-subcategory') as HTMLSelectElement).value = token.subcategory || '';
  
  (document.getElementById('typo-description') as HTMLTextAreaElement).value = token.description || '';
  
  // Set responsive checkbox
  (document.getElementById('typo-responsive') as HTMLInputElement).checked = token.responsive === true;
  
  // Show delete button for existing tokens
  const deleteBtn = document.getElementById('typography-modal-delete');
  if (deleteBtn) deleteBtn.style.display = 'block';
  
  // Update preview
  updateTokenPreview();
  
  // Show modal
  modal.style.display = 'flex';
}

function openNewTokenEditor(): void {
  currentEditingTokenId = null;
  isNewToken = true;
  
  const modal = document.getElementById('typography-modal');
  if (!modal) return;
  
  // Update category dropdown with custom categories
  updateCategorySelectOptions();
  
  const defaultCategory = 'paragraph';
  
  (document.getElementById('typography-modal-title') as HTMLElement).textContent = 'Новый токен';
  (document.getElementById('typo-token-path') as HTMLInputElement).value = 'typography.custom.';
  (document.getElementById('typo-token-name') as HTMLInputElement).value = '';
  (document.getElementById('typo-font-family') as HTMLSelectElement).value = '{font.family.roboto}';
  (document.getElementById('typo-font-size') as HTMLSelectElement).value = '{font.size.16}';
  (document.getElementById('typo-font-weight') as HTMLSelectElement).value = '{font.weight.400}';
  (document.getElementById('typo-line-height') as HTMLSelectElement).value = '{font.lineHeight.140}';
  (document.getElementById('typo-letter-spacing') as HTMLSelectElement).value = '{font.letterSpacing.000}';
  (document.getElementById('typo-text-decoration') as HTMLSelectElement).value = '';
  (document.getElementById('typo-text-transform') as HTMLSelectElement).value = '';
  (document.getElementById('typo-category') as HTMLSelectElement).value = defaultCategory;
  
  // Update subcategory options based on default category
  updateSubcategoryOptions(defaultCategory);
  
  (document.getElementById('typo-description') as HTMLTextAreaElement).value = '';
  
  // Default: not responsive (same value for all devices)
  (document.getElementById('typo-responsive') as HTMLInputElement).checked = false;
  
  // Hide delete button for new tokens
  const deleteBtn = document.getElementById('typography-modal-delete');
  if (deleteBtn) deleteBtn.style.display = 'none';
  
  // Update preview
  updateTokenPreview();
  
  // Show modal
  modal.style.display = 'flex';
}

/**
 * Open token editor with pre-selected category
 */
function openTokenEditorForCategory(category: string): void {
  currentEditingTokenId = null;
  isNewToken = true;
  
  const modal = document.getElementById('typography-modal');
  if (!modal) return;
  
  // Update category dropdown with custom categories
  updateCategorySelectOptions();
  
  (document.getElementById('typography-modal-title') as HTMLElement).textContent = 'Новый токен';
  (document.getElementById('typo-token-path') as HTMLInputElement).value = `typography.${category}.`;
  (document.getElementById('typo-token-name') as HTMLInputElement).value = '';
  (document.getElementById('typo-font-family') as HTMLSelectElement).value = '{font.family.roboto}';
  (document.getElementById('typo-font-size') as HTMLSelectElement).value = '{font.size.16}';
  (document.getElementById('typo-font-weight') as HTMLSelectElement).value = '{font.weight.400}';
  (document.getElementById('typo-line-height') as HTMLSelectElement).value = '{font.lineHeight.140}';
  (document.getElementById('typo-letter-spacing') as HTMLSelectElement).value = '{font.letterSpacing.000}';
  (document.getElementById('typo-text-decoration') as HTMLSelectElement).value = '';
  (document.getElementById('typo-text-transform') as HTMLSelectElement).value = '';
  (document.getElementById('typo-category') as HTMLSelectElement).value = category;
  
  // Update subcategory options based on category
  updateSubcategoryOptions(category);
  
  (document.getElementById('typo-description') as HTMLTextAreaElement).value = '';
  (document.getElementById('typo-responsive') as HTMLInputElement).checked = false;
  
  // Hide delete button for new tokens
  const deleteBtn = document.getElementById('typography-modal-delete');
  if (deleteBtn) deleteBtn.style.display = 'none';
  
  // Update preview
  updateTokenPreview();
  
  // Show modal
  modal.style.display = 'flex';
}

/**
 * Add a new custom category
 */
export function addCategory(name: string, icon: string = '📎'): void {
  if (!name) return;
  
  const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  // Check if category already exists
  const defaultCategories = ['page', 'section', 'card', 'modal', 'sidebar', 'paragraph', 'helper', 'action', 'form', 'data', 'status', 'notification', 'navigation', 'code', 'content', 'empty', 'loading'];
  if (defaultCategories.includes(id)) {
    showNotification('⚠️ Такая категория уже существует');
    return;
  }
  
  if (typographyState.customCategories?.some(c => c.id === id)) {
    showNotification('⚠️ Категория с таким ID уже существует');
    return;
  }
  
  // Initialize custom categories if needed
  if (!typographyState.customCategories) {
    typographyState.customCategories = [];
  }
  
  typographyState.customCategories.push({ id, name, icon });
  
  // Save state
  onTypographyStateChanged();
  
  // Refresh UI
  renderCategoryFilter();
  renderSemanticTokens();
  
  showNotification(`✅ Категория "${name}" добавлена`);
}

/**
 * Delete a custom category
 */
function deleteCategory(categoryId: string): void {
  // Check if category has tokens
  const tokensInCategory = typographyState.semanticTokens.filter(t => t.category === categoryId);
  
  if (tokensInCategory.length > 0) {
    if (!confirm(`Категория "${categoryId}" содержит ${tokensInCategory.length} токенов. Удалить всё?`)) {
      return;
    }
    
    // Remove all tokens in this category
    typographyState.semanticTokens = typographyState.semanticTokens.filter(t => t.category !== categoryId);
  }
  
  // Remove custom category
  if (typographyState.customCategories) {
    typographyState.customCategories = typographyState.customCategories.filter(c => c.id !== categoryId);
  }
  
  // Save state
  onTypographyStateChanged();
  
  // Refresh UI
  renderCategoryFilter();
  renderSemanticTokens();
  
  showNotification(`🗑️ Категория "${categoryId}" удалена`);
}

/**
 * Render category filter buttons with custom categories
 */
function renderCategoryFilter(): void {
  const container = document.querySelector('.typo-category-filter');
  if (!container) return;
  
  const defaultCategories = [
    { id: 'page', label: 'Page' },
    { id: 'section', label: 'Section' },
    { id: 'card', label: 'Card' },
    { id: 'modal', label: 'Modal' },
    { id: 'paragraph', label: 'Paragraph' },
    { id: 'form', label: 'Form' },
    { id: 'action', label: 'Action' },
    { id: 'data', label: 'Data' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'status', label: 'Status' },
    { id: 'code', label: 'Code' },
  ];
  
  const customCategories = typographyState.customCategories || [];
  
  container.innerHTML = `
    <button class="typo-category-btn active" data-category="all">Все</button>
    ${defaultCategories.map(c => `
      <button class="typo-category-btn" data-category="${c.id}">${c.label}</button>
    `).join('')}
    ${customCategories.map(c => `
      <button class="typo-category-btn custom-category" data-category="${c.id}">${c.icon} ${c.name}</button>
    `).join('')}
    <button class="typo-category-btn add-category" id="btn-add-category" title="Добавить секцию">+</button>
  `;
  
  // Setup filter handlers
  container.querySelectorAll('.typo-category-btn[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.typo-category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const category = btn.getAttribute('data-category');
      filterSemanticTokensByCategory(category || 'all');
    });
  });
  
  // Setup add category handler
  const addBtn = container.querySelector('#btn-add-category');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      showAddCategoryDialog();
    });
  }
}

/**
 * Filter semantic tokens by category
 */
function filterSemanticTokensByCategory(category: string): void {
  const container = document.getElementById('semantic-tokens-list');
  if (!container) return;
  
  const groups = container.querySelectorAll('.semantic-token-group');
  groups.forEach(group => {
    if (category === 'all') {
      (group as HTMLElement).style.display = '';
    } else {
      const groupCategory = group.getAttribute('data-category');
      (group as HTMLElement).style.display = groupCategory === category ? '' : 'none';
    }
  });
}

/**
 * Show dialog to add a new category
 */
function showAddCategoryDialog(): void {
  const name = prompt('Введите название новой секции:');
  if (name) {
    const icon = prompt('Введите иконку (emoji):', '📎') || '📎';
    addCategory(name, icon);
  }
}

function closeTokenEditor(): void {
  const modal = document.getElementById('typography-modal');
  if (modal) modal.style.display = 'none';
  currentEditingTokenId = null;
  isNewToken = false;
}

function saveToken(): void {
  const category = (document.getElementById('typo-category') as HTMLSelectElement).value as TypographyCategory;
  const subcategory = (document.getElementById('typo-subcategory') as HTMLSelectElement).value;
  const name = (document.getElementById('typo-token-name') as HTMLInputElement).value.trim();
  
  if (!name) {
    showNotification('⚠️ Введите название токена');
    return;
  }
  
  // Build path from category and subcategory
  // Path structure: typography / category / [subcategory parts...] / name
  // BUT: if subcategory ends with name, don't duplicate it
  const path = ['typography', category];
  
  if (subcategory) {
    // Split subcategory by dots and add each part to path
    const subcategoryParts = subcategory.split('.');
    subcategoryParts.forEach(part => path.push(part));
    
    // Only add name if it's different from the last subcategory part
    const lastPart = subcategoryParts[subcategoryParts.length - 1];
    if (lastPart !== name) {
      path.push(name);
    }
  } else {
    // No subcategory - just add name
    path.push(name);
  }
  
  const tokenId = path.join('.');
  
  // Get responsive flag
  const isResponsive = (document.getElementById('typo-responsive') as HTMLInputElement).checked;
  
  const tokenData: TypographySemanticToken = {
    id: tokenId,
    path: path,
    name: name,
    fontFamily: (document.getElementById('typo-font-family') as HTMLSelectElement).value,
    fontSize: (document.getElementById('typo-font-size') as HTMLSelectElement).value,
    fontWeight: (document.getElementById('typo-font-weight') as HTMLSelectElement).value,
    lineHeight: (document.getElementById('typo-line-height') as HTMLSelectElement).value,
    letterSpacing: (document.getElementById('typo-letter-spacing') as HTMLSelectElement).value,
    textDecoration: (document.getElementById('typo-text-decoration') as HTMLSelectElement).value || undefined,
    textTransform: (document.getElementById('typo-text-transform') as HTMLSelectElement).value || undefined,
    category: category,
    subcategory: subcategory || undefined,
    description: (document.getElementById('typo-description') as HTMLTextAreaElement).value.trim() || undefined,
    responsive: isResponsive || undefined, // Only save if true
  };
  
  if (isNewToken) {
    // Check for duplicate
    const exists = typographyState.semanticTokens.some(t => t.id === tokenId);
    if (exists) {
      showNotification('⚠️ Токен с таким путём уже существует');
      return;
    }
    typographyState.semanticTokens.push(tokenData);
    showNotification('✨ Токен создан');
    
    // Track change
    addPendingChange({
      module: 'typography',
      type: 'add',
      category: category,
      name: tokenId,
      newValue: `${tokenData.fontSize} / ${tokenData.fontWeight}`,
      details: tokenData.responsive ? 'adaptive' : undefined,
    });
  } else {
    // Update existing token
    const index = typographyState.semanticTokens.findIndex(t => t.id === currentEditingTokenId);
    if (index !== -1) {
      const oldToken = typographyState.semanticTokens[index];
      typographyState.semanticTokens[index] = tokenData;
      showNotification('✅ Токен обновлён');
      
      // Track change
      addPendingChange({
        module: 'typography',
        type: 'update',
        category: category,
        name: tokenId,
        oldValue: `${oldToken.fontSize} / ${oldToken.fontWeight}${oldToken.responsive ? ' (adaptive)' : ''}`,
        newValue: `${tokenData.fontSize} / ${tokenData.fontWeight}${tokenData.responsive ? ' (adaptive)' : ''}`,
      });
    }
  }
  
  // Сохраняем состояние
  onTypographyStateChanged();
  
  renderSemanticTokens();
  closeTokenEditor();
}

function deleteToken(): void {
  if (!currentEditingTokenId) return;
  
  const index = typographyState.semanticTokens.findIndex(t => t.id === currentEditingTokenId);
  if (index !== -1) {
    const token = typographyState.semanticTokens[index];
    typographyState.semanticTokens.splice(index, 1);
    
    // Track change
    addPendingChange({
      module: 'typography',
      type: 'delete',
      category: token.category,
      name: token.id,
      oldValue: `${token.fontSize} / ${token.fontWeight}`,
    });
    
    // Сохраняем состояние
    onTypographyStateChanged();
    
    renderSemanticTokens();
    showNotification('🗑️ Токен удалён');
  }
  
  closeTokenEditor();
}

function updateTokenPreview(): void {
  const preview = document.getElementById('typo-edit-preview');
  if (!preview) return;
  
  const fontSize = (document.getElementById('typo-font-size') as HTMLSelectElement).value;
  const fontWeight = (document.getElementById('typo-font-weight') as HTMLSelectElement).value;
  const lineHeight = (document.getElementById('typo-line-height') as HTMLSelectElement).value;
  const letterSpacing = (document.getElementById('typo-letter-spacing') as HTMLSelectElement).value;
  const textDecoration = (document.getElementById('typo-text-decoration') as HTMLSelectElement).value;
  const textTransform = (document.getElementById('typo-text-transform') as HTMLSelectElement).value;
  
  // Parse values
  const sizeValue = fontSize.match(/\{font\.size\.(\d+)\}/)?.[1] || '16';
  const weightValue = fontWeight.match(/\{font\.weight\.(\d+)\}/)?.[1] || '400';
  const lhValue = lineHeight.match(/\{font\.lineHeight\.(\d+)\}/)?.[1] || '140';
  const lsValue = letterSpacing.match(/\{font\.letterSpacing\.(n?\d+)\}/)?.[1] || '000';
  
  // Convert letter spacing
  let lsEm = 0;
  if (lsValue.startsWith('n')) {
    lsEm = -parseInt(lsValue.slice(1)) / 1000;
  } else {
    lsEm = parseInt(lsValue) / 1000;
  }
  
  const previewSize = Math.min(parseInt(sizeValue), 32);
  
  let styles = `font-size: ${previewSize}px; font-weight: ${weightValue}; line-height: ${parseInt(lhValue) / 100}; letter-spacing: ${lsEm}em;`;
  
  if (textDecoration) {
    const decValue = textDecoration.match(/\{font\.decoration\.([^}]+)\}/)?.[1] || '';
    if (decValue) styles += ` text-decoration: ${decValue};`;
  }
  
  if (textTransform) {
    const transValue = textTransform.match(/\{font\.transform\.([^}]+)\}/)?.[1] || '';
    if (transValue) styles += ` text-transform: ${transValue};`;
  }
  
  preview.innerHTML = `<span style="${styles}">Sample Text Preview</span>`;
}

function setupModalEvents(): void {
  // Close modal
  const closeBtn = document.getElementById('typography-modal-close');
  const cancelBtn = document.getElementById('typography-modal-cancel');
  
  if (closeBtn) closeBtn.addEventListener('click', closeTokenEditor);
  if (cancelBtn) cancelBtn.addEventListener('click', closeTokenEditor);
  
  // Save
  const saveBtn = document.getElementById('typography-modal-save');
  if (saveBtn) saveBtn.addEventListener('click', saveToken);
  
  // Delete
  const deleteBtn = document.getElementById('typography-modal-delete');
  if (deleteBtn) deleteBtn.addEventListener('click', deleteToken);
  
  // Preview update on form change
  const formSelects = document.querySelectorAll('#typography-token-form select');
  formSelects.forEach(select => {
    select.addEventListener('change', updateTokenPreview);
  });
  
  // Category change → update subcategories
  const categorySelect = document.getElementById('typo-category') as HTMLSelectElement;
  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      updateSubcategoryOptions(categorySelect.value);
    });
  }
  
  // Add new token button
  const addTokenBtn = document.getElementById('btn-add-semantic-token');
  if (addTokenBtn) {
    addTokenBtn.addEventListener('click', openNewTokenEditor);
  }
  
  // Close on overlay click
  const modal = document.getElementById('typography-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeTokenEditor();
    });
  }
}

// Update subcategory select based on category
function updateSubcategoryOptions(category: string): void {
  const subcategorySelect = document.getElementById('typo-subcategory') as HTMLSelectElement;
  if (!subcategorySelect) return;
  
  const subcategories = CATEGORY_SUBCATEGORIES[category] || [];
  
  subcategorySelect.innerHTML = subcategories.map(sub => 
    `<option value="${sub.value}">${sub.label}</option>`
  ).join('');
}

// ============================================
// EVENT HANDLERS
// ============================================

function setupTypographyEvents(): void {
  // Generate Primitives button
  const btnGeneratePrimitives = document.getElementById('btn-generate-typography-primitives');
  if (btnGeneratePrimitives) {
    btnGeneratePrimitives.addEventListener('click', generateTypographyPrimitives);
  }
  
  // Generate Semantic button
  const btnGenerateSemantic = document.getElementById('btn-generate-semantic-typography');
  if (btnGenerateSemantic) {
    btnGenerateSemantic.addEventListener('click', generateSemanticTypography);
  }
  
  // Import defaults button
  const btnImportDefaults = document.getElementById('btn-import-semantic-defaults');
  if (btnImportDefaults) {
    btnImportDefaults.addEventListener('click', () => {
      loadDefaultSemanticTokens();
      showNotification('📥 Стандартные токены загружены');
    });
  }
  
  // Sync with Figma button
  const btnSyncFigma = document.getElementById('btn-sync-typography-figma');
  if (btnSyncFigma) {
    btnSyncFigma.addEventListener('click', syncTypographyToFigma);
  }
  
  // Create Text Styles button
  const btnCreateTextStyles = document.getElementById('btn-create-text-styles');
  if (btnCreateTextStyles) {
    btnCreateTextStyles.addEventListener('click', createTextStylesInFigma);
  }
  
  // Create Semantic Variables button
  const btnCreateSemanticVars = document.getElementById('btn-create-semantic-variables');
  if (btnCreateSemanticVars) {
    btnCreateSemanticVars.addEventListener('click', createSemanticVariablesInFigma);
  }
  
  // Responsive modes toggle
  const responsiveToggle = document.getElementById('responsive-modes-enabled') as HTMLInputElement;
  if (responsiveToggle) {
    responsiveToggle.addEventListener('change', () => {
      toggleResponsiveModes(responsiveToggle.checked);
    });
  }
  
  // Breakpoint settings handlers
  setupBreakpointHandlers();
  
  // Category filter
  document.querySelectorAll('.typo-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      
      document.querySelectorAll('.typo-category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      filterSemanticTokens(category || 'all');
    });
  });
  
  // Font weight toggle
  document.querySelectorAll('.typo-weight-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });
  
  // Text options toggle
  document.querySelectorAll('.typo-option').forEach(option => {
    option.addEventListener('click', () => {
      option.classList.toggle('active');
      const checkbox = option.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (checkbox) checkbox.checked = option.classList.contains('active');
    });
  });
  
  // Setup primitive add buttons
  setupPrimitiveModals();
}

function setupBreakpointHandlers(): void {
  const container = document.getElementById('breakpoints-list');
  if (!container) return;
  
  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', handleBreakpointChange);
    input.addEventListener('input', (e) => {
      // Обновляем превью при вводе для scale
      const inputEl = e.target as HTMLInputElement;
      if (inputEl.getAttribute('data-field') === 'scale') {
        const scale = parseFloat(inputEl.value) || 1.0;
        const item = inputEl.closest('.breakpoint-item');
        const index = parseInt(item?.getAttribute('data-index') || '0', 10);
        
        // Обновляем локальный конфиг
        if (breakpointConfigs[index]) {
          breakpointConfigs[index].scale = scale;
        }
        
        // Обновляем процент
        const percentSpan = inputEl.parentElement?.querySelector('.scale-percent');
        if (percentSpan) {
          percentSpan.textContent = `${Math.round(scale * 100)}%`;
        }
        
        // Обновляем превью
        const preview = item?.querySelector('.breakpoint-preview small');
        if (preview) {
          preview.textContent = `Пример: 16px → ${getScaledValue(16, scale, 2)}px, 140% → ${getScaledValue(140, scale, 5)}%`;
        }
      }
    });
  });
}

// ============================================
// FONT FAMILIES RENDERING & MANAGEMENT
// ============================================

function renderFontFamilies(): void {
  const container = document.getElementById('font-families-grid');
  if (!container) return;
  
  container.innerHTML = typographyState.fontFamilies.map(family => `
    <div class="typo-card active" data-font="${family.name}">
      <div class="typo-card-header">
        <span class="typo-card-name">${family.name}</span>
        <span class="typo-card-badge">${family.category}</span>
      </div>
      <div class="typo-card-value">${family.value}</div>
      <div class="typo-card-fallback">${family.fallback || ''}</div>
    </div>
  `).join('');
  
  // Add click handlers for toggle
  container.querySelectorAll('.typo-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('active');
    });
  });
}

function setupPrimitiveModals(): void {
  // Font Family Modal
  const btnAddFontFamily = document.getElementById('btn-add-font-family');
  const fontFamilyModal = document.getElementById('font-family-modal');
  
  if (btnAddFontFamily && fontFamilyModal) {
    btnAddFontFamily.addEventListener('click', () => {
      fontFamilyModal.style.display = 'flex';
    });
    
    // Close handlers
    document.getElementById('font-family-modal-close')?.addEventListener('click', () => {
      fontFamilyModal.style.display = 'none';
    });
    document.getElementById('font-family-modal-cancel')?.addEventListener('click', () => {
      fontFamilyModal.style.display = 'none';
    });
    fontFamilyModal.addEventListener('click', (e) => {
      if (e.target === fontFamilyModal) fontFamilyModal.style.display = 'none';
    });
    
    // Save handler
    document.getElementById('font-family-modal-save')?.addEventListener('click', () => {
      const name = (document.getElementById('new-font-name') as HTMLInputElement).value.trim().toLowerCase().replace(/\s+/g, '-');
      const value = (document.getElementById('new-font-value') as HTMLInputElement).value.trim();
      const fallback = (document.getElementById('new-font-fallback') as HTMLInputElement).value.trim();
      const category = (document.getElementById('new-font-category') as HTMLSelectElement).value as 'sans' | 'serif' | 'mono' | 'display' | 'custom';
      
      if (!name || !value) {
        showNotification('⚠️ Заполните название и font-family');
        return;
      }
      
      // Check for duplicate
      if (typographyState.fontFamilies.some(f => f.name === name)) {
        showNotification('⚠️ Шрифт с таким именем уже существует');
        return;
      }
      
      typographyState.fontFamilies.push({ name, value, fallback, category });
      renderFontFamilies();
      updateFontFamilySelect();
      
      // Clear form
      (document.getElementById('new-font-name') as HTMLInputElement).value = '';
      (document.getElementById('new-font-value') as HTMLInputElement).value = '';
      (document.getElementById('new-font-fallback') as HTMLInputElement).value = '';
      
      fontFamilyModal.style.display = 'none';
      showNotification('✅ Шрифт добавлен');
    });
  }
  
  // Font Size Modal
  const btnAddFontSize = document.getElementById('btn-add-font-size');
  const fontSizeModal = document.getElementById('font-size-modal');
  
  if (btnAddFontSize && fontSizeModal) {
    btnAddFontSize.addEventListener('click', () => {
      fontSizeModal.style.display = 'flex';
    });
    
    document.getElementById('font-size-modal-close')?.addEventListener('click', () => {
      fontSizeModal.style.display = 'none';
    });
    document.getElementById('font-size-modal-cancel')?.addEventListener('click', () => {
      fontSizeModal.style.display = 'none';
    });
    fontSizeModal.addEventListener('click', (e) => {
      if (e.target === fontSizeModal) fontSizeModal.style.display = 'none';
    });
    
    document.getElementById('font-size-modal-save')?.addEventListener('click', () => {
      const size = parseInt((document.getElementById('new-font-size') as HTMLInputElement).value);
      
      if (!size || size < 1) {
        showNotification('⚠️ Введите корректный размер');
        return;
      }
      
      const name = String(size);
      if (typographyState.fontSizes.some(s => s.name === name)) {
        showNotification('⚠️ Такой размер уже существует');
        return;
      }
      
      typographyState.fontSizes.push({ name, value: size });
      typographyState.fontSizes.sort((a, b) => a.value - b.value);
      renderFontSizes();
      updateFontSizeSelect();
      
      (document.getElementById('new-font-size') as HTMLInputElement).value = '';
      fontSizeModal.style.display = 'none';
      showNotification('✅ Размер добавлен');
    });
  }
  
  // Line Height Modal
  const btnAddLineHeight = document.getElementById('btn-add-line-height');
  const lineHeightModal = document.getElementById('line-height-modal');
  
  if (btnAddLineHeight && lineHeightModal) {
    btnAddLineHeight.addEventListener('click', () => {
      lineHeightModal.style.display = 'flex';
    });
    
    document.getElementById('line-height-modal-close')?.addEventListener('click', () => {
      lineHeightModal.style.display = 'none';
    });
    document.getElementById('line-height-modal-cancel')?.addEventListener('click', () => {
      lineHeightModal.style.display = 'none';
    });
    lineHeightModal.addEventListener('click', (e) => {
      if (e.target === lineHeightModal) lineHeightModal.style.display = 'none';
    });
    
    document.getElementById('line-height-modal-save')?.addEventListener('click', () => {
      const value = parseFloat((document.getElementById('new-line-height') as HTMLInputElement).value);
      
      if (!value || value < 0.5) {
        showNotification('⚠️ Введите корректное значение');
        return;
      }
      
      const name = String(Math.round(value * 100));
      if (typographyState.lineHeights.some(lh => lh.name === name)) {
        showNotification('⚠️ Такой интервал уже существует');
        return;
      }
      
      typographyState.lineHeights.push({ name, value });
      typographyState.lineHeights.sort((a, b) => a.value - b.value);
      renderLineHeights();
      updateLineHeightSelect();
      
      (document.getElementById('new-line-height') as HTMLInputElement).value = '';
      lineHeightModal.style.display = 'none';
      showNotification('✅ Интервал добавлен');
    });
  }
}

// Update select options in typography token editor
function updateFontFamilySelect(): void {
  const select = document.getElementById('typo-font-family') as HTMLSelectElement;
  if (!select) return;
  
  select.innerHTML = typographyState.fontFamilies.map(f => 
    `<option value="{font.family.${f.name}}">${f.value}</option>`
  ).join('');
}

function updateFontSizeSelect(): void {
  const select = document.getElementById('typo-font-size') as HTMLSelectElement;
  if (!select) return;
  
  select.innerHTML = typographyState.fontSizes.map(s => 
    `<option value="{font.size.${s.name}}">${s.value}px</option>`
  ).join('');
}

function updateLineHeightSelect(): void {
  const select = document.getElementById('typo-line-height') as HTMLSelectElement;
  if (!select) return;
  
  select.innerHTML = typographyState.lineHeights.map(lh => 
    `<option value="{font.lineHeight.${lh.name}}">${lh.value} (${Math.round(lh.value * 100)}%)</option>`
  ).join('');
}

function filterSemanticTokens(category: string): void {
  const groups = document.querySelectorAll('.semantic-token-group');
  
  groups.forEach(group => {
    if (category === 'all' || group.getAttribute('data-category') === category) {
      (group as HTMLElement).style.display = 'block';
    } else {
      (group as HTMLElement).style.display = 'none';
    }
  });
}

// ============================================
// TOKEN GENERATION
// ============================================

function generateTypographyPrimitives(): void {
  // Collect enabled font sizes
  const enabledSizes = getEnabledPrimitives('font-sizes-grid', 'data-size');
  const enabledLineHeights = getEnabledPrimitives('line-heights-grid', 'data-line-height');
  const enabledLetterSpacings = getEnabledPrimitives('letter-spacings-grid', 'data-spacing');
  const enabledWeights = getEnabledPrimitives('font-weights-grid', 'data-weight');
  
  // Generate font family tokens
  typographyState.fontFamilies.forEach(family => {
    createToken({
      name: family.name,
      path: ['font', 'family'],
      type: 'STRING' as TMTokenType,
      value: family.value,
      collection: 'Primitives' as TMCollectionType,
      description: `Font family: ${family.value}`,
    });
  });
  
  // Generate font size tokens
  enabledSizes.forEach(sizeName => {
    const size = typographyState.fontSizes.find(s => s.name === sizeName);
    if (size) {
      createToken({
        name: size.name,
        path: ['font', 'size'],
        type: 'NUMBER' as TMTokenType,
        value: size.value,
        collection: 'Primitives' as TMCollectionType,
        description: `Font size: ${size.value}px`,
      });
    }
  });
  
  // Generate line height tokens
  enabledLineHeights.forEach(lhName => {
    const lh = typographyState.lineHeights.find(l => l.name === lhName);
    if (lh) {
      createToken({
        name: lh.name,
        path: ['font', 'lineHeight'],
        type: 'NUMBER' as TMTokenType,
        value: lh.value,
        collection: 'Primitives' as TMCollectionType,
        description: `Line height: ${lh.value} (${lineHeightToPercent(lh.value)}%)`,
      });
    }
  });
  
  // Generate font weight tokens
  enabledWeights.forEach(weightName => {
    const weight = typographyState.fontWeights.find(w => w.name === weightName);
    if (weight) {
      createToken({
        name: weight.name,
        path: ['font', 'weight'],
        type: 'NUMBER' as TMTokenType,
        value: weight.value,
        collection: 'Primitives' as TMCollectionType,
        description: `Font weight: ${weight.label} (${weight.value})`,
      });
    }
  });
  
  // Generate letter spacing tokens
  enabledLetterSpacings.forEach(lsName => {
    const ls = typographyState.letterSpacings.find(l => l.name === lsName);
    if (ls) {
      createToken({
        name: ls.name,
        path: ['font', 'letterSpacing'],
        type: 'NUMBER' as TMTokenType,
        value: ls.value,
        collection: 'Primitives' as TMCollectionType,
        description: `Letter spacing: ${ls.value}em (${letterSpacingToPercent(ls.value)}%)`,
      });
    }
  });
  
  // Generate text decoration tokens
  const enabledDecorations = getEnabledTextOptions('text-decorations-group');
  enabledDecorations.forEach(dec => {
    createToken({
      name: dec,
      path: ['font', 'decoration'],
      type: 'STRING' as TMTokenType,
      value: dec,
      collection: 'Primitives' as TMCollectionType,
      description: `Text decoration: ${dec}`,
    });
  });
  
  // Generate text transform tokens
  const enabledTransforms = getEnabledTextOptions('text-transforms-group');
  enabledTransforms.forEach(transform => {
    createToken({
      name: transform,
      path: ['font', 'transform'],
      type: 'STRING' as TMTokenType,
      value: transform,
      collection: 'Primitives' as TMCollectionType,
      description: `Text transform: ${transform}`,
    });
  });
  
  // Font style tokens
  createToken({
    name: 'normal',
    path: ['font', 'style'],
    type: 'STRING' as TMTokenType,
    value: 'normal',
    collection: 'Primitives' as TMCollectionType,
    description: 'Font style: normal',
  });
  
  createToken({
    name: 'italic',
    path: ['font', 'style'],
    type: 'STRING' as TMTokenType,
    value: 'italic',
    collection: 'Primitives' as TMCollectionType,
    description: 'Font style: italic',
  });
  
  showNotification('✨ Примитивы типографики сгенерированы!');
  notifyTokensUpdated();
}

function generateSemanticTypography(): void {
  // Generate semantic tokens from state
  typographyState.semanticTokens.forEach(token => {
    // Create separate tokens for each typography property
    const properties = [
      { suffix: 'fontFamily', value: token.fontFamily, type: 'STRING' as TMTokenType },
      { suffix: 'fontSize', value: token.fontSize, type: 'STRING' as TMTokenType },
      { suffix: 'fontWeight', value: token.fontWeight, type: 'STRING' as TMTokenType },
      { suffix: 'lineHeight', value: token.lineHeight, type: 'STRING' as TMTokenType },
      { suffix: 'letterSpacing', value: token.letterSpacing, type: 'STRING' as TMTokenType },
    ];
    
    if (token.textDecoration) {
      properties.push({ suffix: 'textDecoration', value: token.textDecoration, type: 'STRING' as TMTokenType });
    }
    if (token.textTransform) {
      properties.push({ suffix: 'textTransform', value: token.textTransform, type: 'STRING' as TMTokenType });
    }
    if (token.fontStyle) {
      properties.push({ suffix: 'fontStyle', value: token.fontStyle, type: 'STRING' as TMTokenType });
    }
    
    properties.forEach(prop => {
      createToken({
        name: prop.suffix,
        path: token.path,
        type: prop.type,
        value: prop.value,
        collection: 'Tokens' as TMCollectionType,
        description: `${token.description || token.name} - ${prop.suffix}`,
      });
    });
  });
  
  showNotification('✨ Семантические токены типографики сгенерированы!');
  notifyTokensUpdated();
}

function syncTypographyToFigma(): void {
  // Prepare typography variables for Figma
  const variables: any[] = [];
  
  // Collect primitives
  typographyState.fontSizes.forEach(size => {
    variables.push({
      name: `font/size/${size.name}`,
      value: size.value,
      type: 'NUMBER',
      collection: 'Primitives',
    });
  });
  
  typographyState.lineHeights.forEach(lh => {
    variables.push({
      name: `font/lineHeight/${lh.name}`,
      value: lineHeightToPercent(lh.value), // Convert to % for Figma
      type: 'NUMBER',
      collection: 'Primitives',
    });
  });
  
  typographyState.fontWeights.forEach(weight => {
    variables.push({
      name: `font/weight/${weight.name}`,
      value: weight.value,
      type: 'NUMBER',
      collection: 'Primitives',
    });
  });
  
  // Send to Figma
  parent.postMessage({
    pluginMessage: {
      type: 'create-typography-variables',
      payload: { variables },
    },
  }, '*');
  
  showNotification('🔄 Синхронизация с Figma...');
}

function createTextStylesInFigma(): void {
  // Подготавливаем данные для создания Text Styles
  const semanticTokens = typographyState.semanticTokens.map(token => ({
    id: token.id,
    name: token.name,
    path: token.path,
    fontFamily: token.fontFamily,
    fontSize: token.fontSize,
    fontWeight: token.fontWeight,
    lineHeight: token.lineHeight,
    letterSpacing: token.letterSpacing,
    textDecoration: token.textDecoration,
    textTransform: token.textTransform,
    fontStyle: token.fontStyle,
    description: token.description,
    category: token.category,
    subcategory: token.subcategory,
    responsive: token.responsive, // Pass responsive flag
    deviceOverrides: token.deviceOverrides, // Pass device overrides
  }));
  
  const primitives = {
    fontFamilies: typographyState.fontFamilies.map(f => ({
      name: f.name,
      value: f.value,
      isEnabled: true, // All fonts in state are considered enabled
    })),
    fontSizes: typographyState.fontSizes.map(s => ({
      name: s.name,
      value: s.value,
    })),
    lineHeights: typographyState.lineHeights.map(lh => ({
      name: lh.name,
      value: lh.value,
    })),
    letterSpacings: typographyState.letterSpacings.map(ls => ({
      name: ls.name,
      value: ls.value,
    })),
    fontWeights: typographyState.fontWeights.map(fw => ({
      name: fw.name,
      value: fw.value,
      label: fw.label,
    })),
  };
  
  if (semanticTokens.length === 0) {
    showNotification('⚠️ Нет семантических токенов для создания Text Styles');
    return;
  }
  
  // Отправляем в Figma
  parent.postMessage({
    pluginMessage: {
      type: 'create-text-styles',
      payload: { semanticTokens, primitives },
    },
  }, '*');
  
  showNotification('🎨 Создание Text Styles в Figma...');
}

function createSemanticVariablesInFigma(): void {
  // Подготавливаем данные для создания семантических Variables
  const semanticTokens = typographyState.semanticTokens.map(token => ({
    id: token.id,
    name: token.name,
    path: token.path,
    fontFamily: token.fontFamily,
    fontSize: token.fontSize,
    fontWeight: token.fontWeight,
    lineHeight: token.lineHeight,
    letterSpacing: token.letterSpacing,
    textDecoration: token.textDecoration,
    textTransform: token.textTransform,
    fontStyle: token.fontStyle,
    description: token.description,
    category: token.category,
    subcategory: token.subcategory,
    // ВАЖНО: передаём responsive и deviceOverrides!
    responsive: token.responsive,
    deviceOverrides: token.deviceOverrides,
  }));
  
  const primitives = {
    fontSizes: typographyState.fontSizes.map(s => ({
      name: s.name,
      value: s.value,
    })),
    lineHeights: typographyState.lineHeights.map(lh => ({
      name: lh.name,
      value: lh.value,
    })),
    letterSpacings: typographyState.letterSpacings.map(ls => ({
      name: ls.name,
      value: ls.value,
    })),
    fontWeights: typographyState.fontWeights.map(fw => ({
      name: fw.name,
      value: fw.value,
    })),
  };
  
  if (semanticTokens.length === 0) {
    showNotification('⚠️ Нет семантических токенов для создания Variables');
    return;
  }
  
  // Подготавливаем конфигурацию брейкпоинтов
  const breakpoints = responsiveModesEnabled ? breakpointConfigs : null;
  
  // Отправляем в Figma
  parent.postMessage({
    pluginMessage: {
      type: 'create-semantic-typography-variables',
      payload: { 
        semanticTokens, 
        primitives,
        breakpoints, // Передаём настройки адаптивности
      },
    },
  }, '*');
  
  const modeInfo = responsiveModesEnabled 
    ? ` с ${breakpointConfigs.length} режимами (${breakpointConfigs.map(b => b.label).join(', ')})` 
    : '';
  showNotification(`📊 Создание семантических Variables${modeInfo}...`);
}

// ============================================
// BREAKPOINT UI FUNCTIONS
// ============================================

function renderBreakpointSettings(): void {
  const container = document.getElementById('breakpoint-settings');
  if (!container) return;
  
  const enabledCheckbox = document.getElementById('responsive-modes-enabled') as HTMLInputElement;
  if (enabledCheckbox) {
    enabledCheckbox.checked = responsiveModesEnabled;
  }
  
  const breakpointsContainer = document.getElementById('breakpoints-list');
  if (!breakpointsContainer) return;
  
  breakpointsContainer.innerHTML = breakpointConfigs.map((bp, index) => `
    <div class="breakpoint-item" data-index="${index}">
      <div class="breakpoint-header">
        <span class="breakpoint-icon">${getBreakpointIcon(bp.name)}</span>
        <input type="text" class="breakpoint-name" value="${bp.label}" data-field="label">
      </div>
      <div class="breakpoint-fields">
        <div class="breakpoint-field">
          <label>Min width</label>
          <input type="number" value="${bp.minWidth}" data-field="minWidth" min="0" max="2560"> px
        </div>
        <div class="breakpoint-field">
          <label>Scale</label>
          <input type="number" value="${bp.scale}" data-field="scale" min="0.5" max="1.5" step="0.025">
          <span class="scale-percent">${Math.round(bp.scale * 100)}%</span>
        </div>
      </div>
      <div class="breakpoint-preview">
        <small>Пример: 16px → ${getScaledValue(16, bp.scale, 2)}px, 140% → ${getScaledValue(140, bp.scale, 5)}%</small>
      </div>
    </div>
  `).join('');
  
  // Добавляем обработчики
  breakpointsContainer.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', handleBreakpointChange);
  });
}

function getBreakpointIcon(name: string): string {
  switch (name) {
    case 'desktop': return '🖥️';
    case 'tablet': return '📱';
    case 'mobile': return '📲';
    default: return '📐';
  }
}

function handleBreakpointChange(e: Event): void {
  const input = e.target as HTMLInputElement;
  const item = input.closest('.breakpoint-item');
  if (!item) return;
  
  const index = parseInt(item.getAttribute('data-index') || '0', 10);
  const field = input.getAttribute('data-field');
  
  if (field && breakpointConfigs[index]) {
    if (field === 'label') {
      breakpointConfigs[index].label = input.value;
    } else if (field === 'minWidth') {
      breakpointConfigs[index].minWidth = parseInt(input.value, 10) || 0;
    } else if (field === 'scale') {
      breakpointConfigs[index].scale = parseFloat(input.value) || 1.0;
      // Обновляем процент
      const percentSpan = input.parentElement?.querySelector('.scale-percent');
      if (percentSpan) {
        percentSpan.textContent = `${Math.round(breakpointConfigs[index].scale * 100)}%`;
      }
      // Обновляем превью
      const preview = item.querySelector('.breakpoint-preview small');
      if (preview) {
        const scale = breakpointConfigs[index].scale;
        preview.textContent = `Пример: 16px → ${getScaledValue(16, scale, 2)}px, 140% → ${getScaledValue(140, scale, 5)}%`;
      }
    }
    
    // Сохраняем изменения
    onTypographyStateChanged();
  }
}

function toggleResponsiveModes(enabled: boolean): void {
  responsiveModesEnabled = enabled;
  const container = document.getElementById('breakpoints-list');
  if (container) {
    container.style.opacity = enabled ? '1' : '0.5';
    container.style.pointerEvents = enabled ? 'auto' : 'none';
  }
  onTypographyStateChanged();
}

// ============================================
// HELPERS
// ============================================

function getEnabledPrimitives(containerId: string, dataAttr: string): string[] {
  const container = document.getElementById(containerId);
  if (!container) return [];
  
  const enabled: string[] = [];
  container.querySelectorAll('.active').forEach(item => {
    const value = item.getAttribute(dataAttr);
    if (value) enabled.push(value);
  });
  
  return enabled;
}

function getEnabledTextOptions(groupId: string): string[] {
  const group = document.getElementById(groupId);
  if (!group) return [];
  
  const enabled: string[] = [];
  group.querySelectorAll('.typo-option.active input').forEach(input => {
    const checkbox = input as HTMLInputElement;
    if (checkbox.value) enabled.push(checkbox.value);
  });
  
  return enabled;
}

function showNotification(message: string): void {
  const notification = document.getElementById('notification');
  if (notification) {
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
  }
}

function notifyTokensUpdated(): void {
  window.dispatchEvent(new CustomEvent('tokens-updated'));
}

// ============================================
// EXPORTS
// ============================================

export function getTypographyState(): TypographyState {
  return typographyState;
}

export function setTypographyState(state: TypographyState): void {
  typographyState = state;
  renderFontSizes();
  renderLineHeights();
  renderLetterSpacings();
  renderSemanticTokens();
}
