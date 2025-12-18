/**
 * Stroke (Border) Tokens
 * 2-tier architecture: Primitives → Semantic
 * 
 * Level 1: Primitives (stroke.width.*, stroke.style.*, stroke.dashArray.*) → Primitives collection
 * Level 2: Semantic (stroke.{component}.{variant}.{property}) → Stroke collection
 * 
 * NOTE: Default semantic tokens are imported from stroke-defaults.ts
 * which has the correct colorRef paths pointing to Tokens collection
 */

import { COMPLETE_STROKE_SEMANTIC_TOKENS } from './stroke-defaults';

// ============================================
// PRIMITIVES
// ============================================

export interface StrokeWidthPrimitive {
  name: string;      // "0", "1", "1.5", "2", etc.
  value: number;     // 0, 1, 1.5, 2, etc.
  enabled: boolean;
}

export interface StrokeStylePrimitive {
  name: string;      // "none", "solid", "dashed", "dotted", "double"
  value: string;     // same as name
  enabled: boolean;
}

export interface StrokeDashArrayPrimitive {
  name: string;      // "default", "tight", "loose", etc.
  value: string;     // "4, 4", "2, 2", etc.
  enabled: boolean;
}

// Default width primitives
export const DEFAULT_STROKE_WIDTH_PRIMITIVES: StrokeWidthPrimitive[] = [
  { name: '0', value: 0, enabled: true },
  { name: '1', value: 1, enabled: true },
  { name: '1.5', value: 1.5, enabled: true },
  { name: '2', value: 2, enabled: true },
  { name: '3', value: 3, enabled: true },
  { name: '4', value: 4, enabled: true },
  { name: '6', value: 6, enabled: true },
  { name: '8', value: 8, enabled: true },
];

// Default style primitives
export const DEFAULT_STROKE_STYLE_PRIMITIVES: StrokeStylePrimitive[] = [
  { name: 'none', value: 'none', enabled: true },
  { name: 'solid', value: 'solid', enabled: true },
  { name: 'dashed', value: 'dashed', enabled: true },
  { name: 'dotted', value: 'dotted', enabled: true },
  { name: 'double', value: 'double', enabled: true },
];

// Default dash array primitives
export const DEFAULT_STROKE_DASH_ARRAY_PRIMITIVES: StrokeDashArrayPrimitive[] = [
  { name: 'default', value: '4, 4', enabled: true },
  { name: 'tight', value: '2, 2', enabled: true },
  { name: 'loose', value: '8, 4', enabled: true },
  { name: 'dotted', value: '1, 4', enabled: true },
  { name: 'longDash', value: '12, 4', enabled: true },
  { name: 'mixed', value: '12, 4, 4, 4', enabled: true },
];

// ============================================
// SEMANTIC TOKENS
// ============================================

export interface StrokeSemanticToken {
  id: string;
  path: string;                    // e.g., "stroke.button.default.width"
  category: StrokeCategory;
  property: 'width' | 'style' | 'color';
  widthRef?: string;               // Reference to width primitive, e.g., "1"
  styleRef?: string;               // Reference to style primitive, e.g., "solid"
  colorRef?: string;               // Reference to color, e.g., "neutral.300"
}

export type StrokeCategory = 
  | 'base'
  | 'button'
  | 'input'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'textarea'
  | 'select'
  | 'fileUpload'
  | 'card'
  | 'modal'
  | 'dropdown'
  | 'popover'
  | 'tooltip'
  | 'panel'
  | 'section'
  | 'well'
  | 'tab'
  | 'menu'
  | 'sidebar'
  | 'header'
  | 'breadcrumb'
  | 'pagination'
  | 'table'
  | 'dataGrid'
  | 'alert'
  | 'badge'
  | 'tag'
  | 'chip'
  | 'toast'
  | 'avatar'
  | 'image'
  | 'thumbnail'
  | 'list'
  | 'divider'
  | 'progress'
  | 'slider'
  | 'stepper'
  | 'code'
  | 'blockquote'
  | 'callout'
  | 'kbd'
  | 'skeleton'
  | 'empty'
  | 'accent';

export const STROKE_CATEGORIES: Record<StrokeCategory, { label: string; description: string }> = {
  base: { label: 'Базовые', description: 'Базовые стили границ' },
  button: { label: 'Кнопки', description: 'Границы для кнопок' },
  input: { label: 'Поля ввода', description: 'Границы для input' },
  checkbox: { label: 'Чекбоксы', description: 'Границы для checkbox' },
  radio: { label: 'Радио', description: 'Границы для radio' },
  switch: { label: 'Переключатели', description: 'Границы для switch' },
  textarea: { label: 'Textarea', description: 'Границы для textarea' },
  select: { label: 'Select', description: 'Границы для select' },
  fileUpload: { label: 'Загрузка файлов', description: 'Границы для file upload' },
  card: { label: 'Карточки', description: 'Границы для карточек' },
  modal: { label: 'Модальные окна', description: 'Границы для модалок' },
  dropdown: { label: 'Dropdown', description: 'Границы для dropdown' },
  popover: { label: 'Popover', description: 'Границы для popover' },
  tooltip: { label: 'Tooltip', description: 'Границы для tooltip' },
  panel: { label: 'Панели', description: 'Границы для панелей' },
  section: { label: 'Секции', description: 'Границы для секций' },
  well: { label: 'Well', description: 'Границы для well' },
  tab: { label: 'Табы', description: 'Границы для табов' },
  menu: { label: 'Меню', description: 'Границы для меню' },
  sidebar: { label: 'Sidebar', description: 'Границы для sidebar' },
  header: { label: 'Header', description: 'Границы для header' },
  breadcrumb: { label: 'Breadcrumb', description: 'Границы для breadcrumb' },
  pagination: { label: 'Пагинация', description: 'Границы для пагинации' },
  table: { label: 'Таблицы', description: 'Границы для таблиц' },
  dataGrid: { label: 'Data Grid', description: 'Границы для data grid' },
  alert: { label: 'Алерты', description: 'Границы для алертов' },
  badge: { label: 'Бейджи', description: 'Границы для бейджей' },
  tag: { label: 'Теги', description: 'Границы для тегов' },
  chip: { label: 'Чипы', description: 'Границы для чипов' },
  toast: { label: 'Тосты', description: 'Границы для тостов' },
  avatar: { label: 'Аватары', description: 'Границы для аватаров' },
  image: { label: 'Изображения', description: 'Границы для изображений' },
  thumbnail: { label: 'Thumbnails', description: 'Границы для thumbnails' },
  list: { label: 'Списки', description: 'Границы для списков' },
  divider: { label: 'Разделители', description: 'Границы для divider' },
  progress: { label: 'Прогресс', description: 'Границы для progress' },
  slider: { label: 'Слайдер', description: 'Границы для slider' },
  stepper: { label: 'Stepper', description: 'Границы для stepper' },
  code: { label: 'Код', description: 'Границы для code' },
  blockquote: { label: 'Цитаты', description: 'Границы для blockquote' },
  callout: { label: 'Callout', description: 'Границы для callout' },
  kbd: { label: 'Kbd', description: 'Границы для kbd' },
  skeleton: { label: 'Skeleton', description: 'Границы для skeleton' },
  empty: { label: 'Empty State', description: 'Границы для empty state' },
  accent: { label: 'Акцентные линии', description: 'Акцентные границы' },
};

// ============================================
// STATE
// ============================================

export interface StrokeState {
  widthPrimitives: StrokeWidthPrimitive[];
  stylePrimitives: StrokeStylePrimitive[];
  dashArrayPrimitives: StrokeDashArrayPrimitive[];
  semanticTokens: StrokeSemanticToken[];
  customCategories: Array<{ id: string; label: string; description: string }>;
}

// ============================================
// DEFAULT SEMANTIC TOKENS
// Re-export from stroke-defaults.ts which has correct colorRef paths
// ============================================

export const DEFAULT_STROKE_SEMANTIC_TOKENS: StrokeSemanticToken[] = 
  COMPLETE_STROKE_SEMANTIC_TOKENS as unknown as StrokeSemanticToken[];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createDefaultStrokeState(): StrokeState {
  return {
    widthPrimitives: [...DEFAULT_STROKE_WIDTH_PRIMITIVES],
    stylePrimitives: [...DEFAULT_STROKE_STYLE_PRIMITIVES],
    dashArrayPrimitives: [...DEFAULT_STROKE_DASH_ARRAY_PRIMITIVES],
    semanticTokens: [...DEFAULT_STROKE_SEMANTIC_TOKENS],
    customCategories: [],
  };
}

export function generateStrokeTokenId(): string {
  return `st-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getStrokeTokensByCategory(tokens: StrokeSemanticToken[], category: StrokeCategory | string): StrokeSemanticToken[] {
  return tokens.filter(t => t.category === category);
}
