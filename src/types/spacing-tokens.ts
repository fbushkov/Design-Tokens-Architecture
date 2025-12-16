/**
 * Spacing Tokens Type Definitions
 * 2-tier architecture with device modes
 * 
 * Level 1: Primitives (space.0, space.4, space.8...) - in Primitives collection
 * Level 2: Semantic (spacing.button.default.paddingX) - in Spacing collection with Desktop/Tablet/Mobile modes
 */

// ============================================
// PRIMITIVES
// ============================================

export interface SpacingPrimitive {
  name: string;   // "0", "1", "2", "4", "6", "8"...
  value: number;  // 0, 1, 2, 4, 6, 8...
  enabled: boolean;
}

export const DEFAULT_SPACING_PRIMITIVES: SpacingPrimitive[] = [
  { name: '0', value: 0, enabled: true },
  { name: '1', value: 1, enabled: true },
  { name: '2', value: 2, enabled: true },
  { name: '4', value: 4, enabled: true },
  { name: '6', value: 6, enabled: true },
  { name: '8', value: 8, enabled: true },
  { name: '10', value: 10, enabled: true },
  { name: '12', value: 12, enabled: true },
  { name: '14', value: 14, enabled: true },
  { name: '16', value: 16, enabled: true },
  { name: '18', value: 18, enabled: true },
  { name: '20', value: 20, enabled: true },
  { name: '24', value: 24, enabled: true },
  { name: '28', value: 28, enabled: true },
  { name: '32', value: 32, enabled: true },
  { name: '36', value: 36, enabled: true },
  { name: '40', value: 40, enabled: true },
  { name: '44', value: 44, enabled: true },
  { name: '48', value: 48, enabled: true },
  { name: '56', value: 56, enabled: true },
  { name: '64', value: 64, enabled: true },
  { name: '72', value: 72, enabled: true },
  { name: '80', value: 80, enabled: true },
  { name: '96', value: 96, enabled: true },
  { name: '112', value: 112, enabled: true },
  { name: '128', value: 128, enabled: true },
  { name: '160', value: 160, enabled: true },
  { name: '192', value: 192, enabled: true },
  { name: '224', value: 224, enabled: true },
  { name: '256', value: 256, enabled: true },
];

// ============================================
// SEMANTIC TOKENS (with device modes)
// ============================================

export type SpacingCategory = 
  | 'inline' 
  | 'button' 
  | 'input' 
  | 'card' 
  | 'modal' 
  | 'dropdown' 
  | 'list' 
  | 'table' 
  | 'navigation' 
  | 'alert' 
  | 'badge' 
  | 'form' 
  | 'page' 
  | 'content' 
  | 'grid';

export const SPACING_CATEGORIES: Record<SpacingCategory, { label: string; description: string }> = {
  inline: { label: 'Инлайн-элементы', description: 'Горизонтальные отступы внутри' },
  button: { label: 'Кнопки', description: 'Отступы для кнопок' },
  input: { label: 'Поля ввода', description: 'Отступы для input/textarea' },
  card: { label: 'Карточки', description: 'Отступы для карточек' },
  modal: { label: 'Модальные окна', description: 'Отступы для диалогов' },
  dropdown: { label: 'Выпадающие меню', description: 'Dropdown, popover, tooltip' },
  list: { label: 'Списки', description: 'Отступы для списков' },
  table: { label: 'Таблицы', description: 'Отступы для таблиц' },
  navigation: { label: 'Навигация', description: 'Tabs, breadcrumbs, sidebar' },
  alert: { label: 'Уведомления', description: 'Alert, toast, banner' },
  badge: { label: 'Бейджи', description: 'Badge, tag, chip' },
  form: { label: 'Формы', description: 'Группы полей форм' },
  page: { label: 'Страницы', description: 'Контейнеры страниц' },
  content: { label: 'Контент', description: 'Текстовый контент' },
  grid: { label: 'Сетка', description: 'Grid inset' },
};

export interface DeviceSpacingToken {
  id: string;
  path: string;           // "spacing.button.default.paddingX"
  category: SpacingCategory;
  description?: string;
  // Device-specific references to primitives (primitive name like "16" -> {space.16})
  desktop: string;
  tablet: string;
  mobile: string;
}

export interface SpacingState {
  primitives: SpacingPrimitive[];
  semanticTokens: DeviceSpacingToken[];
}

// ============================================
// DEFAULT SEMANTIC TOKENS
// ============================================

export const DEFAULT_SEMANTIC_TOKENS: DeviceSpacingToken[] = [
  // Инлайн-элементы
  { id: 'sp-1', path: 'spacing.inline.icon.paddingX', category: 'inline', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'sp-2', path: 'spacing.inline.badge.paddingX', category: 'inline', desktop: '6', tablet: '6', mobile: '4' },
  { id: 'sp-3', path: 'spacing.inline.tag.paddingX', category: 'inline', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'sp-4', path: 'spacing.inline.chip.paddingX', category: 'inline', desktop: '12', tablet: '10', mobile: '8' },
  { id: 'sp-5', path: 'spacing.inline.pill.paddingX', category: 'inline', desktop: '16', tablet: '14', mobile: '12' },

  // Кнопки
  { id: 'sp-10', path: 'spacing.button.compact.paddingX', category: 'button', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'sp-11', path: 'spacing.button.compact.paddingY', category: 'button', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'sp-12', path: 'spacing.button.default.paddingX', category: 'button', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-13', path: 'spacing.button.default.paddingY', category: 'button', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'sp-14', path: 'spacing.button.large.paddingX', category: 'button', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-15', path: 'spacing.button.large.paddingY', category: 'button', desktop: '12', tablet: '10', mobile: '8' },
  { id: 'sp-16', path: 'spacing.button.icon.padding', category: 'button', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'sp-17', path: 'spacing.button.iconLarge.padding', category: 'button', desktop: '12', tablet: '10', mobile: '8' },
  { id: 'sp-18', path: 'spacing.button.withIcon.gap', category: 'button', desktop: '8', tablet: '6', mobile: '6' },
  { id: 'sp-19', path: 'spacing.button.withIconCompact.gap', category: 'button', desktop: '6', tablet: '4', mobile: '4' },

  // Поля ввода
  { id: 'sp-20', path: 'spacing.input.default.paddingX', category: 'input', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'sp-21', path: 'spacing.input.default.paddingY', category: 'input', desktop: '10', tablet: '10', mobile: '8' },
  { id: 'sp-22', path: 'spacing.input.compact.paddingX', category: 'input', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'sp-23', path: 'spacing.input.compact.paddingY', category: 'input', desktop: '6', tablet: '6', mobile: '4' },
  { id: 'sp-24', path: 'spacing.input.large.paddingX', category: 'input', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-25', path: 'spacing.input.large.paddingY', category: 'input', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'sp-26', path: 'spacing.input.textarea.paddingX', category: 'input', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'sp-27', path: 'spacing.input.textarea.paddingY', category: 'input', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'sp-28', path: 'spacing.input.withIcon.paddingLeft', category: 'input', desktop: '40', tablet: '36', mobile: '32' },
  { id: 'sp-29', path: 'spacing.input.withAction.paddingRight', category: 'input', desktop: '40', tablet: '36', mobile: '32' },
  { id: 'sp-30', path: 'spacing.input.select.paddingRight', category: 'input', desktop: '36', tablet: '32', mobile: '28' },

  // Карточки
  { id: 'sp-40', path: 'spacing.card.compact.padding', category: 'card', desktop: '12', tablet: '12', mobile: '8' },
  { id: 'sp-41', path: 'spacing.card.default.padding', category: 'card', desktop: '16', tablet: '16', mobile: '12' },
  { id: 'sp-42', path: 'spacing.card.comfortable.padding', category: 'card', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-43', path: 'spacing.card.spacious.padding', category: 'card', desktop: '32', tablet: '28', mobile: '20' },
  { id: 'sp-44', path: 'spacing.card.header.paddingX', category: 'card', desktop: '16', tablet: '16', mobile: '12' },
  { id: 'sp-45', path: 'spacing.card.header.paddingY', category: 'card', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'sp-46', path: 'spacing.card.body.paddingX', category: 'card', desktop: '16', tablet: '16', mobile: '12' },
  { id: 'sp-47', path: 'spacing.card.body.paddingY', category: 'card', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-48', path: 'spacing.card.footer.paddingX', category: 'card', desktop: '16', tablet: '16', mobile: '12' },
  { id: 'sp-49', path: 'spacing.card.footer.paddingY', category: 'card', desktop: '12', tablet: '12', mobile: '10' },

  // Модальные окна
  { id: 'sp-50', path: 'spacing.modal.compact.padding', category: 'modal', desktop: '16', tablet: '16', mobile: '12' },
  { id: 'sp-51', path: 'spacing.modal.default.padding', category: 'modal', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-52', path: 'spacing.modal.spacious.padding', category: 'modal', desktop: '32', tablet: '28', mobile: '20' },
  { id: 'sp-53', path: 'spacing.modal.header.paddingX', category: 'modal', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-54', path: 'spacing.modal.header.paddingY', category: 'modal', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-55', path: 'spacing.modal.body.paddingX', category: 'modal', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-56', path: 'spacing.modal.body.paddingY', category: 'modal', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-57', path: 'spacing.modal.footer.paddingX', category: 'modal', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-58', path: 'spacing.modal.footer.paddingY', category: 'modal', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-59', path: 'spacing.modal.fullscreen.padding', category: 'modal', desktop: '32', tablet: '24', mobile: '16' },

  // Выпадающие меню
  { id: 'sp-60', path: 'spacing.dropdown.paddingX', category: 'dropdown', desktop: '0', tablet: '0', mobile: '0' },
  { id: 'sp-61', path: 'spacing.dropdown.paddingY', category: 'dropdown', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'sp-62', path: 'spacing.dropdown.item.paddingX', category: 'dropdown', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'sp-63', path: 'spacing.dropdown.item.paddingY', category: 'dropdown', desktop: '8', tablet: '8', mobile: '8' },
  { id: 'sp-64', path: 'spacing.dropdown.itemCompact.paddingX', category: 'dropdown', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'sp-65', path: 'spacing.dropdown.itemCompact.paddingY', category: 'dropdown', desktop: '6', tablet: '6', mobile: '4' },
  { id: 'sp-66', path: 'spacing.popover.padding', category: 'dropdown', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'sp-67', path: 'spacing.tooltip.paddingX', category: 'dropdown', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'sp-68', path: 'spacing.tooltip.paddingY', category: 'dropdown', desktop: '4', tablet: '4', mobile: '4' },

  // Списки
  { id: 'sp-70', path: 'spacing.list.item.paddingX', category: 'list', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'sp-71', path: 'spacing.list.item.paddingY', category: 'list', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'sp-72', path: 'spacing.list.itemCompact.paddingX', category: 'list', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'sp-73', path: 'spacing.list.itemCompact.paddingY', category: 'list', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'sp-74', path: 'spacing.list.nested.paddingLeft', category: 'list', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-75', path: 'spacing.list.group.paddingY', category: 'list', desktop: '8', tablet: '8', mobile: '6' },

  // Таблицы
  { id: 'sp-80', path: 'spacing.table.cell.paddingX', category: 'table', desktop: '12', tablet: '10', mobile: '8' },
  { id: 'sp-81', path: 'spacing.table.cell.paddingY', category: 'table', desktop: '10', tablet: '8', mobile: '6' },
  { id: 'sp-82', path: 'spacing.table.cellCompact.paddingX', category: 'table', desktop: '8', tablet: '6', mobile: '4' },
  { id: 'sp-83', path: 'spacing.table.cellCompact.paddingY', category: 'table', desktop: '6', tablet: '4', mobile: '4' },
  { id: 'sp-84', path: 'spacing.table.header.paddingX', category: 'table', desktop: '12', tablet: '10', mobile: '8' },
  { id: 'sp-85', path: 'spacing.table.header.paddingY', category: 'table', desktop: '12', tablet: '10', mobile: '8' },

  // Навигация
  { id: 'sp-90', path: 'spacing.navigation.item.paddingX', category: 'navigation', desktop: '12', tablet: '10', mobile: '8' },
  { id: 'sp-91', path: 'spacing.navigation.item.paddingY', category: 'navigation', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'sp-92', path: 'spacing.navigation.tab.paddingX', category: 'navigation', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-93', path: 'spacing.navigation.tab.paddingY', category: 'navigation', desktop: '12', tablet: '10', mobile: '8' },
  { id: 'sp-94', path: 'spacing.navigation.sidebar.paddingX', category: 'navigation', desktop: '12', tablet: '10', mobile: '8' },
  { id: 'sp-95', path: 'spacing.navigation.sidebar.paddingY', category: 'navigation', desktop: '8', tablet: '8', mobile: '6' },

  // Уведомления
  { id: 'sp-100', path: 'spacing.alert.compact.paddingX', category: 'alert', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'sp-101', path: 'spacing.alert.compact.paddingY', category: 'alert', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'sp-102', path: 'spacing.alert.default.paddingX', category: 'alert', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-103', path: 'spacing.alert.default.paddingY', category: 'alert', desktop: '12', tablet: '10', mobile: '8' },
  { id: 'sp-104', path: 'spacing.toast.paddingX', category: 'alert', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-105', path: 'spacing.toast.paddingY', category: 'alert', desktop: '12', tablet: '10', mobile: '8' },
  { id: 'sp-106', path: 'spacing.banner.paddingX', category: 'alert', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-107', path: 'spacing.banner.paddingY', category: 'alert', desktop: '16', tablet: '14', mobile: '12' },

  // Бейджи
  { id: 'sp-110', path: 'spacing.badge.paddingX', category: 'badge', desktop: '6', tablet: '6', mobile: '4' },
  { id: 'sp-111', path: 'spacing.badge.paddingY', category: 'badge', desktop: '2', tablet: '2', mobile: '2' },
  { id: 'sp-112', path: 'spacing.tag.paddingX', category: 'badge', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'sp-113', path: 'spacing.tag.paddingY', category: 'badge', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'sp-114', path: 'spacing.chip.paddingX', category: 'badge', desktop: '12', tablet: '10', mobile: '8' },
  { id: 'sp-115', path: 'spacing.chip.paddingY', category: 'badge', desktop: '6', tablet: '6', mobile: '4' },

  // Формы
  { id: 'sp-120', path: 'spacing.form.field.marginBottom', category: 'form', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-121', path: 'spacing.form.fieldCompact.marginBottom', category: 'form', desktop: '12', tablet: '10', mobile: '8' },
  { id: 'sp-122', path: 'spacing.form.label.marginBottom', category: 'form', desktop: '6', tablet: '6', mobile: '4' },
  { id: 'sp-123', path: 'spacing.form.helpText.marginTop', category: 'form', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'sp-124', path: 'spacing.form.group.marginBottom', category: 'form', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-125', path: 'spacing.form.section.marginBottom', category: 'form', desktop: '32', tablet: '28', mobile: '24' },
  { id: 'sp-126', path: 'spacing.form.actions.marginTop', category: 'form', desktop: '24', tablet: '20', mobile: '16' },

  // Страницы
  { id: 'sp-130', path: 'spacing.page.paddingX', category: 'page', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-131', path: 'spacing.page.paddingY', category: 'page', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-132', path: 'spacing.page.paddingXWide', category: 'page', desktop: '48', tablet: '32', mobile: '16' },
  { id: 'sp-133', path: 'spacing.page.paddingYWide', category: 'page', desktop: '32', tablet: '24', mobile: '16' },
  { id: 'sp-134', path: 'spacing.page.section.marginBottom', category: 'page', desktop: '48', tablet: '40', mobile: '32' },
  { id: 'sp-135', path: 'spacing.page.header.paddingY', category: 'page', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-136', path: 'spacing.page.header.marginBottom', category: 'page', desktop: '32', tablet: '28', mobile: '24' },
  { id: 'sp-137', path: 'spacing.page.footer.paddingY', category: 'page', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-138', path: 'spacing.page.footer.marginTop', category: 'page', desktop: '48', tablet: '40', mobile: '32' },

  // Контент
  { id: 'sp-140', path: 'spacing.content.paragraph.marginBottom', category: 'content', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-141', path: 'spacing.content.heading.marginTop', category: 'content', desktop: '32', tablet: '28', mobile: '24' },
  { id: 'sp-142', path: 'spacing.content.heading.marginBottom', category: 'content', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-143', path: 'spacing.content.list.marginBottom', category: 'content', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-144', path: 'spacing.content.blockquote.paddingLeft', category: 'content', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-145', path: 'spacing.content.blockquote.marginY', category: 'content', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-146', path: 'spacing.content.codeBlock.padding', category: 'content', desktop: '16', tablet: '14', mobile: '12' },
  { id: 'sp-147', path: 'spacing.content.divider.marginY', category: 'content', desktop: '24', tablet: '20', mobile: '16' },

  // Сетка
  { id: 'sp-150', path: 'spacing.grid.inset.none', category: 'grid', desktop: '0', tablet: '0', mobile: '0' },
  { id: 'sp-151', path: 'spacing.grid.inset.tight', category: 'grid', desktop: '8', tablet: '6', mobile: '4' },
  { id: 'sp-152', path: 'spacing.grid.inset.default', category: 'grid', desktop: '16', tablet: '12', mobile: '8' },
  { id: 'sp-153', path: 'spacing.grid.inset.relaxed', category: 'grid', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'sp-154', path: 'spacing.grid.inset.loose', category: 'grid', desktop: '32', tablet: '28', mobile: '24' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createDefaultSpacingState(): SpacingState {
  return {
    primitives: [...DEFAULT_SPACING_PRIMITIVES],
    semanticTokens: [...DEFAULT_SEMANTIC_TOKENS],
  };
}

export function generateSpacingTokenId(): string {
  return `sp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getTokensByCategory(tokens: DeviceSpacingToken[], category: SpacingCategory): DeviceSpacingToken[] {
  return tokens.filter(t => t.category === category);
}
