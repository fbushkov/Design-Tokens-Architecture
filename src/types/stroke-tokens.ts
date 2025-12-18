/**
 * Stroke (Border) Tokens
 * 2-tier architecture: Primitives → Semantic
 * 
 * Level 1: Primitives (stroke.width.*, stroke.style.*, stroke.dashArray.*) → Primitives collection
 * Level 2: Semantic (stroke.{component}.{variant}.{property}) → Stroke collection
 */

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
// ============================================

export const DEFAULT_STROKE_SEMANTIC_TOKENS: StrokeSemanticToken[] = [
  // ============================================
  // BASE - Базовые стили
  // ============================================
  { id: 'st-1', path: 'stroke.base.subtle.width', category: 'base', property: 'width', widthRef: '1' },
  { id: 'st-2', path: 'stroke.base.subtle.style', category: 'base', property: 'style', styleRef: 'solid' },
  { id: 'st-3', path: 'stroke.base.subtle.color', category: 'base', property: 'color', colorRef: 'neutral.200' },
  
  { id: 'st-4', path: 'stroke.base.default.width', category: 'base', property: 'width', widthRef: '1' },
  { id: 'st-5', path: 'stroke.base.default.style', category: 'base', property: 'style', styleRef: 'solid' },
  { id: 'st-6', path: 'stroke.base.default.color', category: 'base', property: 'color', colorRef: 'neutral.300' },
  
  { id: 'st-7', path: 'stroke.base.strong.width', category: 'base', property: 'width', widthRef: '1' },
  { id: 'st-8', path: 'stroke.base.strong.style', category: 'base', property: 'style', styleRef: 'solid' },
  { id: 'st-9', path: 'stroke.base.strong.color', category: 'base', property: 'color', colorRef: 'neutral.400' },
  
  { id: 'st-10', path: 'stroke.base.heavy.width', category: 'base', property: 'width', widthRef: '2' },
  { id: 'st-11', path: 'stroke.base.heavy.style', category: 'base', property: 'style', styleRef: 'solid' },
  { id: 'st-12', path: 'stroke.base.heavy.color', category: 'base', property: 'color', colorRef: 'neutral.400' },

  // ============================================
  // BUTTON - Кнопки
  // ============================================
  { id: 'st-20', path: 'stroke.button.default.width', category: 'button', property: 'width', widthRef: '1' },
  { id: 'st-21', path: 'stroke.button.default.style', category: 'button', property: 'style', styleRef: 'solid' },
  { id: 'st-22', path: 'stroke.button.default.color', category: 'button', property: 'color', colorRef: 'neutral.300' },
  
  { id: 'st-23', path: 'stroke.button.hover.width', category: 'button', property: 'width', widthRef: '1' },
  { id: 'st-24', path: 'stroke.button.hover.style', category: 'button', property: 'style', styleRef: 'solid' },
  { id: 'st-25', path: 'stroke.button.hover.color', category: 'button', property: 'color', colorRef: 'neutral.400' },
  
  { id: 'st-26', path: 'stroke.button.focus.width', category: 'button', property: 'width', widthRef: '2' },
  { id: 'st-27', path: 'stroke.button.focus.style', category: 'button', property: 'style', styleRef: 'solid' },
  { id: 'st-28', path: 'stroke.button.focus.color', category: 'button', property: 'color', colorRef: 'brand.500' },
  
  { id: 'st-29', path: 'stroke.button.active.width', category: 'button', property: 'width', widthRef: '1' },
  { id: 'st-30', path: 'stroke.button.active.style', category: 'button', property: 'style', styleRef: 'solid' },
  { id: 'st-31', path: 'stroke.button.active.color', category: 'button', property: 'color', colorRef: 'neutral.500' },
  
  { id: 'st-32', path: 'stroke.button.disabled.width', category: 'button', property: 'width', widthRef: '1' },
  { id: 'st-33', path: 'stroke.button.disabled.style', category: 'button', property: 'style', styleRef: 'solid' },
  { id: 'st-34', path: 'stroke.button.disabled.color', category: 'button', property: 'color', colorRef: 'neutral.200' },
  
  { id: 'st-35', path: 'stroke.button.primary.width', category: 'button', property: 'width', widthRef: '0' },
  { id: 'st-36', path: 'stroke.button.primary.style', category: 'button', property: 'style', styleRef: 'none' },
  { id: 'st-37', path: 'stroke.button.primary.color', category: 'button', property: 'color', colorRef: 'transparent' },
  
  { id: 'st-38', path: 'stroke.button.outline.width', category: 'button', property: 'width', widthRef: '1' },
  { id: 'st-39', path: 'stroke.button.outline.style', category: 'button', property: 'style', styleRef: 'solid' },
  { id: 'st-40', path: 'stroke.button.outline.color', category: 'button', property: 'color', colorRef: 'brand.500' },
  
  { id: 'st-41', path: 'stroke.button.outlineHover.width', category: 'button', property: 'width', widthRef: '1' },
  { id: 'st-42', path: 'stroke.button.outlineHover.style', category: 'button', property: 'style', styleRef: 'solid' },
  { id: 'st-43', path: 'stroke.button.outlineHover.color', category: 'button', property: 'color', colorRef: 'brand.600' },
  
  { id: 'st-44', path: 'stroke.button.ghost.width', category: 'button', property: 'width', widthRef: '0' },
  { id: 'st-45', path: 'stroke.button.ghost.style', category: 'button', property: 'style', styleRef: 'none' },
  { id: 'st-46', path: 'stroke.button.ghost.color', category: 'button', property: 'color', colorRef: 'transparent' },

  // ============================================
  // INPUT - Поля ввода
  // ============================================
  { id: 'st-50', path: 'stroke.input.default.width', category: 'input', property: 'width', widthRef: '1' },
  { id: 'st-51', path: 'stroke.input.default.style', category: 'input', property: 'style', styleRef: 'solid' },
  { id: 'st-52', path: 'stroke.input.default.color', category: 'input', property: 'color', colorRef: 'neutral.300' },
  
  { id: 'st-53', path: 'stroke.input.hover.width', category: 'input', property: 'width', widthRef: '1' },
  { id: 'st-54', path: 'stroke.input.hover.style', category: 'input', property: 'style', styleRef: 'solid' },
  { id: 'st-55', path: 'stroke.input.hover.color', category: 'input', property: 'color', colorRef: 'neutral.400' },
  
  { id: 'st-56', path: 'stroke.input.focus.width', category: 'input', property: 'width', widthRef: '2' },
  { id: 'st-57', path: 'stroke.input.focus.style', category: 'input', property: 'style', styleRef: 'solid' },
  { id: 'st-58', path: 'stroke.input.focus.color', category: 'input', property: 'color', colorRef: 'brand.500' },
  
  { id: 'st-59', path: 'stroke.input.filled.width', category: 'input', property: 'width', widthRef: '1' },
  { id: 'st-60', path: 'stroke.input.filled.style', category: 'input', property: 'style', styleRef: 'solid' },
  { id: 'st-61', path: 'stroke.input.filled.color', category: 'input', property: 'color', colorRef: 'neutral.400' },
  
  { id: 'st-62', path: 'stroke.input.disabled.width', category: 'input', property: 'width', widthRef: '1' },
  { id: 'st-63', path: 'stroke.input.disabled.style', category: 'input', property: 'style', styleRef: 'solid' },
  { id: 'st-64', path: 'stroke.input.disabled.color', category: 'input', property: 'color', colorRef: 'neutral.200' },
  
  { id: 'st-65', path: 'stroke.input.readonly.width', category: 'input', property: 'width', widthRef: '1' },
  { id: 'st-66', path: 'stroke.input.readonly.style', category: 'input', property: 'style', styleRef: 'dashed' },
  { id: 'st-67', path: 'stroke.input.readonly.color', category: 'input', property: 'color', colorRef: 'neutral.300' },
  
  { id: 'st-68', path: 'stroke.input.error.width', category: 'input', property: 'width', widthRef: '1' },
  { id: 'st-69', path: 'stroke.input.error.style', category: 'input', property: 'style', styleRef: 'solid' },
  { id: 'st-70', path: 'stroke.input.error.color', category: 'input', property: 'color', colorRef: 'error.500' },
  
  { id: 'st-71', path: 'stroke.input.errorFocus.width', category: 'input', property: 'width', widthRef: '2' },
  { id: 'st-72', path: 'stroke.input.errorFocus.style', category: 'input', property: 'style', styleRef: 'solid' },
  { id: 'st-73', path: 'stroke.input.errorFocus.color', category: 'input', property: 'color', colorRef: 'error.500' },
  
  { id: 'st-74', path: 'stroke.input.warning.width', category: 'input', property: 'width', widthRef: '1' },
  { id: 'st-75', path: 'stroke.input.warning.style', category: 'input', property: 'style', styleRef: 'solid' },
  { id: 'st-76', path: 'stroke.input.warning.color', category: 'input', property: 'color', colorRef: 'warning.500' },
  
  { id: 'st-77', path: 'stroke.input.success.width', category: 'input', property: 'width', widthRef: '1' },
  { id: 'st-78', path: 'stroke.input.success.style', category: 'input', property: 'style', styleRef: 'solid' },
  { id: 'st-79', path: 'stroke.input.success.color', category: 'input', property: 'color', colorRef: 'success.500' },

  // ============================================
  // CHECKBOX
  // ============================================
  { id: 'st-80', path: 'stroke.checkbox.default.width', category: 'checkbox', property: 'width', widthRef: '1.5' },
  { id: 'st-81', path: 'stroke.checkbox.default.style', category: 'checkbox', property: 'style', styleRef: 'solid' },
  { id: 'st-82', path: 'stroke.checkbox.default.color', category: 'checkbox', property: 'color', colorRef: 'neutral.400' },
  
  { id: 'st-83', path: 'stroke.checkbox.hover.width', category: 'checkbox', property: 'width', widthRef: '1.5' },
  { id: 'st-84', path: 'stroke.checkbox.hover.style', category: 'checkbox', property: 'style', styleRef: 'solid' },
  { id: 'st-85', path: 'stroke.checkbox.hover.color', category: 'checkbox', property: 'color', colorRef: 'brand.500' },
  
  { id: 'st-86', path: 'stroke.checkbox.checked.width', category: 'checkbox', property: 'width', widthRef: '0' },
  { id: 'st-87', path: 'stroke.checkbox.checked.style', category: 'checkbox', property: 'style', styleRef: 'none' },
  { id: 'st-88', path: 'stroke.checkbox.checked.color', category: 'checkbox', property: 'color', colorRef: 'transparent' },
  
  { id: 'st-89', path: 'stroke.checkbox.focus.width', category: 'checkbox', property: 'width', widthRef: '2' },
  { id: 'st-90', path: 'stroke.checkbox.focus.style', category: 'checkbox', property: 'style', styleRef: 'solid' },
  { id: 'st-91', path: 'stroke.checkbox.focus.color', category: 'checkbox', property: 'color', colorRef: 'brand.500' },
  
  { id: 'st-92', path: 'stroke.checkbox.error.width', category: 'checkbox', property: 'width', widthRef: '1.5' },
  { id: 'st-93', path: 'stroke.checkbox.error.style', category: 'checkbox', property: 'style', styleRef: 'solid' },
  { id: 'st-94', path: 'stroke.checkbox.error.color', category: 'checkbox', property: 'color', colorRef: 'error.500' },

  // ============================================
  // RADIO
  // ============================================
  { id: 'st-100', path: 'stroke.radio.default.width', category: 'radio', property: 'width', widthRef: '1.5' },
  { id: 'st-101', path: 'stroke.radio.default.style', category: 'radio', property: 'style', styleRef: 'solid' },
  { id: 'st-102', path: 'stroke.radio.default.color', category: 'radio', property: 'color', colorRef: 'neutral.400' },
  
  { id: 'st-103', path: 'stroke.radio.hover.width', category: 'radio', property: 'width', widthRef: '1.5' },
  { id: 'st-104', path: 'stroke.radio.hover.style', category: 'radio', property: 'style', styleRef: 'solid' },
  { id: 'st-105', path: 'stroke.radio.hover.color', category: 'radio', property: 'color', colorRef: 'brand.500' },
  
  { id: 'st-106', path: 'stroke.radio.selected.width', category: 'radio', property: 'width', widthRef: '4' },
  { id: 'st-107', path: 'stroke.radio.selected.style', category: 'radio', property: 'style', styleRef: 'solid' },
  { id: 'st-108', path: 'stroke.radio.selected.color', category: 'radio', property: 'color', colorRef: 'brand.500' },

  // ============================================
  // CARD
  // ============================================
  { id: 'st-120', path: 'stroke.card.default.width', category: 'card', property: 'width', widthRef: '1' },
  { id: 'st-121', path: 'stroke.card.default.style', category: 'card', property: 'style', styleRef: 'solid' },
  { id: 'st-122', path: 'stroke.card.default.color', category: 'card', property: 'color', colorRef: 'neutral.200' },
  
  { id: 'st-123', path: 'stroke.card.hover.width', category: 'card', property: 'width', widthRef: '1' },
  { id: 'st-124', path: 'stroke.card.hover.style', category: 'card', property: 'style', styleRef: 'solid' },
  { id: 'st-125', path: 'stroke.card.hover.color', category: 'card', property: 'color', colorRef: 'neutral.300' },
  
  { id: 'st-126', path: 'stroke.card.selected.width', category: 'card', property: 'width', widthRef: '2' },
  { id: 'st-127', path: 'stroke.card.selected.style', category: 'card', property: 'style', styleRef: 'solid' },
  { id: 'st-128', path: 'stroke.card.selected.color', category: 'card', property: 'color', colorRef: 'brand.500' },
  
  { id: 'st-129', path: 'stroke.card.elevated.width', category: 'card', property: 'width', widthRef: '0' },
  { id: 'st-130', path: 'stroke.card.elevated.style', category: 'card', property: 'style', styleRef: 'none' },
  { id: 'st-131', path: 'stroke.card.elevated.color', category: 'card', property: 'color', colorRef: 'transparent' },

  // ============================================
  // ALERT
  // ============================================
  { id: 'st-140', path: 'stroke.alert.info.width', category: 'alert', property: 'width', widthRef: '1' },
  { id: 'st-141', path: 'stroke.alert.info.style', category: 'alert', property: 'style', styleRef: 'solid' },
  { id: 'st-142', path: 'stroke.alert.info.color', category: 'alert', property: 'color', colorRef: 'info.300' },
  
  { id: 'st-143', path: 'stroke.alert.success.width', category: 'alert', property: 'width', widthRef: '1' },
  { id: 'st-144', path: 'stroke.alert.success.style', category: 'alert', property: 'style', styleRef: 'solid' },
  { id: 'st-145', path: 'stroke.alert.success.color', category: 'alert', property: 'color', colorRef: 'success.300' },
  
  { id: 'st-146', path: 'stroke.alert.warning.width', category: 'alert', property: 'width', widthRef: '1' },
  { id: 'st-147', path: 'stroke.alert.warning.style', category: 'alert', property: 'style', styleRef: 'solid' },
  { id: 'st-148', path: 'stroke.alert.warning.color', category: 'alert', property: 'color', colorRef: 'warning.300' },
  
  { id: 'st-149', path: 'stroke.alert.error.width', category: 'alert', property: 'width', widthRef: '1' },
  { id: 'st-150', path: 'stroke.alert.error.style', category: 'alert', property: 'style', styleRef: 'solid' },
  { id: 'st-151', path: 'stroke.alert.error.color', category: 'alert', property: 'color', colorRef: 'error.300' },
  
  { id: 'st-152', path: 'stroke.alert.neutral.width', category: 'alert', property: 'width', widthRef: '1' },
  { id: 'st-153', path: 'stroke.alert.neutral.style', category: 'alert', property: 'style', styleRef: 'solid' },
  { id: 'st-154', path: 'stroke.alert.neutral.color', category: 'alert', property: 'color', colorRef: 'neutral.300' },

  // ============================================
  // TABLE
  // ============================================
  { id: 'st-160', path: 'stroke.table.container.width', category: 'table', property: 'width', widthRef: '1' },
  { id: 'st-161', path: 'stroke.table.container.style', category: 'table', property: 'style', styleRef: 'solid' },
  { id: 'st-162', path: 'stroke.table.container.color', category: 'table', property: 'color', colorRef: 'neutral.200' },
  
  { id: 'st-163', path: 'stroke.table.header.width', category: 'table', property: 'width', widthRef: '1' },
  { id: 'st-164', path: 'stroke.table.header.style', category: 'table', property: 'style', styleRef: 'solid' },
  { id: 'st-165', path: 'stroke.table.header.color', category: 'table', property: 'color', colorRef: 'neutral.300' },
  
  { id: 'st-166', path: 'stroke.table.row.width', category: 'table', property: 'width', widthRef: '1' },
  { id: 'st-167', path: 'stroke.table.row.style', category: 'table', property: 'style', styleRef: 'solid' },
  { id: 'st-168', path: 'stroke.table.row.color', category: 'table', property: 'color', colorRef: 'neutral.200' },
  
  { id: 'st-169', path: 'stroke.table.cell.width', category: 'table', property: 'width', widthRef: '1' },
  { id: 'st-170', path: 'stroke.table.cell.style', category: 'table', property: 'style', styleRef: 'solid' },
  { id: 'st-171', path: 'stroke.table.cell.color', category: 'table', property: 'color', colorRef: 'neutral.200' },

  // ============================================
  // DIVIDER
  // ============================================
  { id: 'st-180', path: 'stroke.divider.horizontal.default.width', category: 'divider', property: 'width', widthRef: '1' },
  { id: 'st-181', path: 'stroke.divider.horizontal.default.style', category: 'divider', property: 'style', styleRef: 'solid' },
  { id: 'st-182', path: 'stroke.divider.horizontal.default.color', category: 'divider', property: 'color', colorRef: 'neutral.200' },
  
  { id: 'st-183', path: 'stroke.divider.horizontal.subtle.width', category: 'divider', property: 'width', widthRef: '1' },
  { id: 'st-184', path: 'stroke.divider.horizontal.subtle.style', category: 'divider', property: 'style', styleRef: 'solid' },
  { id: 'st-185', path: 'stroke.divider.horizontal.subtle.color', category: 'divider', property: 'color', colorRef: 'neutral.100' },
  
  { id: 'st-186', path: 'stroke.divider.horizontal.strong.width', category: 'divider', property: 'width', widthRef: '1' },
  { id: 'st-187', path: 'stroke.divider.horizontal.strong.style', category: 'divider', property: 'style', styleRef: 'solid' },
  { id: 'st-188', path: 'stroke.divider.horizontal.strong.color', category: 'divider', property: 'color', colorRef: 'neutral.300' },
  
  { id: 'st-189', path: 'stroke.divider.horizontal.dashed.width', category: 'divider', property: 'width', widthRef: '1' },
  { id: 'st-190', path: 'stroke.divider.horizontal.dashed.style', category: 'divider', property: 'style', styleRef: 'dashed' },
  { id: 'st-191', path: 'stroke.divider.horizontal.dashed.color', category: 'divider', property: 'color', colorRef: 'neutral.300' },
  
  { id: 'st-192', path: 'stroke.divider.vertical.default.width', category: 'divider', property: 'width', widthRef: '1' },
  { id: 'st-193', path: 'stroke.divider.vertical.default.style', category: 'divider', property: 'style', styleRef: 'solid' },
  { id: 'st-194', path: 'stroke.divider.vertical.default.color', category: 'divider', property: 'color', colorRef: 'neutral.200' },

  // ============================================
  // ACCENT
  // ============================================
  { id: 'st-200', path: 'stroke.accent.left.brand.width', category: 'accent', property: 'width', widthRef: '4' },
  { id: 'st-201', path: 'stroke.accent.left.brand.style', category: 'accent', property: 'style', styleRef: 'solid' },
  { id: 'st-202', path: 'stroke.accent.left.brand.color', category: 'accent', property: 'color', colorRef: 'brand.500' },
  
  { id: 'st-203', path: 'stroke.accent.left.error.width', category: 'accent', property: 'width', widthRef: '4' },
  { id: 'st-204', path: 'stroke.accent.left.error.style', category: 'accent', property: 'style', styleRef: 'solid' },
  { id: 'st-205', path: 'stroke.accent.left.error.color', category: 'accent', property: 'color', colorRef: 'error.500' },
  
  { id: 'st-206', path: 'stroke.accent.left.warning.width', category: 'accent', property: 'width', widthRef: '4' },
  { id: 'st-207', path: 'stroke.accent.left.warning.style', category: 'accent', property: 'style', styleRef: 'solid' },
  { id: 'st-208', path: 'stroke.accent.left.warning.color', category: 'accent', property: 'color', colorRef: 'warning.500' },
  
  { id: 'st-209', path: 'stroke.accent.left.success.width', category: 'accent', property: 'width', widthRef: '4' },
  { id: 'st-210', path: 'stroke.accent.left.success.style', category: 'accent', property: 'style', styleRef: 'solid' },
  { id: 'st-211', path: 'stroke.accent.left.success.color', category: 'accent', property: 'color', colorRef: 'success.500' },
  
  { id: 'st-212', path: 'stroke.accent.left.info.width', category: 'accent', property: 'width', widthRef: '4' },
  { id: 'st-213', path: 'stroke.accent.left.info.style', category: 'accent', property: 'style', styleRef: 'solid' },
  { id: 'st-214', path: 'stroke.accent.left.info.color', category: 'accent', property: 'color', colorRef: 'info.500' },
  
  { id: 'st-215', path: 'stroke.accent.bottom.brand.width', category: 'accent', property: 'width', widthRef: '2' },
  { id: 'st-216', path: 'stroke.accent.bottom.brand.style', category: 'accent', property: 'style', styleRef: 'solid' },
  { id: 'st-217', path: 'stroke.accent.bottom.brand.color', category: 'accent', property: 'color', colorRef: 'brand.500' },
  
  { id: 'st-218', path: 'stroke.accent.top.brand.width', category: 'accent', property: 'width', widthRef: '3' },
  { id: 'st-219', path: 'stroke.accent.top.brand.style', category: 'accent', property: 'style', styleRef: 'solid' },
  { id: 'st-220', path: 'stroke.accent.top.brand.color', category: 'accent', property: 'color', colorRef: 'brand.500' },
];

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
