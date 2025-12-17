/**
 * Gap Tokens Type Definitions
 * 2-tier architecture with device modes (like Spacing)
 * 
 * Level 1: Primitives (gap.0, gap.4, gap.8...) - in Primitives collection
 * Level 2: Semantic (gap.inline.icon, gap.action.group) - in Gap collection with Desktop/Tablet/Mobile modes
 */

// ============================================
// PRIMITIVES
// ============================================

export interface GapPrimitive {
  name: string;   // "0", "2", "4", "6", "8"...
  value: number;  // 0, 2, 4, 6, 8...
  enabled: boolean;
}

export const DEFAULT_GAP_PRIMITIVES: GapPrimitive[] = [
  { name: '0', value: 0, enabled: true },
  { name: '2', value: 2, enabled: true },
  { name: '4', value: 4, enabled: true },
  { name: '6', value: 6, enabled: true },
  { name: '8', value: 8, enabled: true },
  { name: '10', value: 10, enabled: true },
  { name: '12', value: 12, enabled: true },
  { name: '16', value: 16, enabled: true },
  { name: '20', value: 20, enabled: true },
  { name: '24', value: 24, enabled: true },
  { name: '28', value: 28, enabled: true },
  { name: '32', value: 32, enabled: true },
  { name: '40', value: 40, enabled: true },
  { name: '48', value: 48, enabled: true },
  { name: '56', value: 56, enabled: true },
  { name: '64', value: 64, enabled: true },
  { name: '80', value: 80, enabled: true },
  { name: '96', value: 96, enabled: true },
];

// ============================================
// SEMANTIC TOKENS (with device modes)
// ============================================

export type GapCategory = 
  | 'inline'
  | 'action'
  | 'form'
  | 'card'
  | 'list'
  | 'navigation'
  | 'table'
  | 'modal'
  | 'alert'
  | 'content'
  | 'grid'
  | 'stack'
  | 'data';

export const GAP_CATEGORIES: Record<GapCategory, { label: string; icon: string; description: string }> = {
  inline: { label: 'Инлайн', icon: '📍', description: 'Иконки, бейджи, теги' },
  action: { label: 'Действия', icon: '🔘', description: 'Кнопки, тулбары' },
  form: { label: 'Формы', icon: '📝', description: 'Поля, группы полей' },
  card: { label: 'Карточки', icon: '🃏', description: 'Header, body, footer' },
  list: { label: 'Списки', icon: '📋', description: 'Элементы списков' },
  navigation: { label: 'Навигация', icon: '🧭', description: 'Табы, меню, хлебные крошки' },
  table: { label: 'Таблицы', icon: '📊', description: 'Ячейки, строки' },
  modal: { label: 'Модалки', icon: '🪟', description: 'Диалоги, попапы' },
  alert: { label: 'Уведомления', icon: '🔔', description: 'Алерты, тосты, баннеры' },
  content: { label: 'Контент', icon: '📄', description: 'Секции, блоки, абзацы' },
  grid: { label: 'Сетки', icon: '⊞', description: 'Grid layouts' },
  stack: { label: 'Стеки', icon: '📚', description: 'Vertical stacks' },
  data: { label: 'Данные', icon: '📈', description: 'Метрики, графики' },
};

export interface GapSemanticToken {
  id: string;
  path: string;           // "gap.inline.icon"
  category: GapCategory;
  description?: string;
  // Device-specific references to primitives (primitive name like "4" -> {gap.4})
  desktop: string;
  tablet: string;
  mobile: string;
}

// Custom category for user-defined sections
export interface CustomGapCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface GapState {
  primitives: GapPrimitive[];
  semanticTokens: GapSemanticToken[];
  customCategories?: CustomGapCategory[];
}

// ============================================
// DEFAULT SEMANTIC TOKENS
// ============================================

export const DEFAULT_GAP_SEMANTIC_TOKENS: GapSemanticToken[] = [
  // ----------------------------------------
  // INLINE ELEMENTS
  // ----------------------------------------
  { id: 'g-1', path: 'gap.inline.icon', category: 'inline', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-2', path: 'gap.inline.text', category: 'inline', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-3', path: 'gap.inline.badge', category: 'inline', desktop: '6', tablet: '6', mobile: '4' },
  { id: 'g-4', path: 'gap.inline.tag', category: 'inline', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-5', path: 'gap.inline.action', category: 'inline', desktop: '8', tablet: '8', mobile: '6' },

  // ----------------------------------------
  // ACTIONS (Buttons, Toolbars)
  // ----------------------------------------
  { id: 'g-10', path: 'gap.action.group', category: 'action', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-11', path: 'gap.action.groupCompact', category: 'action', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-12', path: 'gap.action.groupSpacious', category: 'action', desktop: '12', tablet: '12', mobile: '8' },
  { id: 'g-13', path: 'gap.action.toolbar', category: 'action', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-14', path: 'gap.action.toolbarSection', category: 'action', desktop: '12', tablet: '12', mobile: '8' },
  { id: 'g-15', path: 'gap.action.buttonContent', category: 'action', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-16', path: 'gap.action.buttonContentCompact', category: 'action', desktop: '6', tablet: '6', mobile: '4' },

  // ----------------------------------------
  // FORMS
  // ----------------------------------------
  { id: 'g-20', path: 'gap.form.field', category: 'form', desktop: '16', tablet: '16', mobile: '12' },
  { id: 'g-21', path: 'gap.form.fieldCompact', category: 'form', desktop: '12', tablet: '12', mobile: '8' },
  { id: 'g-22', path: 'gap.form.fieldSpacious', category: 'form', desktop: '20', tablet: '20', mobile: '16' },
  { id: 'g-23', path: 'gap.form.group', category: 'form', desktop: '24', tablet: '24', mobile: '20' },
  { id: 'g-24', path: 'gap.form.section', category: 'form', desktop: '32', tablet: '32', mobile: '24' },
  { id: 'g-25', path: 'gap.form.inline', category: 'form', desktop: '12', tablet: '12', mobile: '8' },
  { id: 'g-26', path: 'gap.form.inlineCompact', category: 'form', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-27', path: 'gap.form.labelGroup', category: 'form', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-28', path: 'gap.form.radioGroup', category: 'form', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'g-29', path: 'gap.form.checkboxGroup', category: 'form', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'g-30', path: 'gap.form.actions', category: 'form', desktop: '12', tablet: '12', mobile: '8' },
  { id: 'g-31', path: 'gap.form.actionsCompact', category: 'form', desktop: '8', tablet: '8', mobile: '6' },

  // ----------------------------------------
  // CARDS
  // ----------------------------------------
  { id: 'g-40', path: 'gap.card.header', category: 'card', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-41', path: 'gap.card.body', category: 'card', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'g-42', path: 'gap.card.footer', category: 'card', desktop: '12', tablet: '12', mobile: '8' },
  { id: 'g-43', path: 'gap.card.sections', category: 'card', desktop: '16', tablet: '16', mobile: '12' },
  { id: 'g-44', path: 'gap.card.meta', category: 'card', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-45', path: 'gap.card.actions', category: 'card', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-46', path: 'gap.card.tags', category: 'card', desktop: '6', tablet: '6', mobile: '4' },

  // ----------------------------------------
  // LISTS
  // ----------------------------------------
  { id: 'g-50', path: 'gap.list.items', category: 'list', desktop: '0', tablet: '0', mobile: '0' },
  { id: 'g-51', path: 'gap.list.itemsSpaced', category: 'list', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-52', path: 'gap.list.itemsLoose', category: 'list', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-53', path: 'gap.list.itemContent', category: 'list', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'g-54', path: 'gap.list.itemContentCompact', category: 'list', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-55', path: 'gap.list.itemMeta', category: 'list', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-56', path: 'gap.list.itemActions', category: 'list', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-57', path: 'gap.list.groups', category: 'list', desktop: '16', tablet: '16', mobile: '12' },

  // ----------------------------------------
  // NAVIGATION
  // ----------------------------------------
  { id: 'g-60', path: 'gap.navigation.items', category: 'navigation', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-61', path: 'gap.navigation.itemsCompact', category: 'navigation', desktop: '2', tablet: '2', mobile: '2' },
  { id: 'g-62', path: 'gap.navigation.itemsSpacious', category: 'navigation', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-63', path: 'gap.navigation.tabs', category: 'navigation', desktop: '0', tablet: '0', mobile: '0' },
  { id: 'g-64', path: 'gap.navigation.tabsSpaced', category: 'navigation', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-65', path: 'gap.navigation.breadcrumb', category: 'navigation', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-66', path: 'gap.navigation.breadcrumbSeparator', category: 'navigation', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-67', path: 'gap.navigation.pagination', category: 'navigation', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-68', path: 'gap.navigation.menuSections', category: 'navigation', desktop: '8', tablet: '8', mobile: '6' },

  // ----------------------------------------
  // TABLES
  // ----------------------------------------
  { id: 'g-70', path: 'gap.table.headerCells', category: 'table', desktop: '0', tablet: '0', mobile: '0' },
  { id: 'g-71', path: 'gap.table.rows', category: 'table', desktop: '0', tablet: '0', mobile: '0' },
  { id: 'g-72', path: 'gap.table.rowsStriped', category: 'table', desktop: '0', tablet: '0', mobile: '0' },
  { id: 'g-73', path: 'gap.table.cellContent', category: 'table', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-74', path: 'gap.table.cellActions', category: 'table', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-75', path: 'gap.table.toolbar', category: 'table', desktop: '12', tablet: '12', mobile: '8' },
  { id: 'g-76', path: 'gap.table.toolbarActions', category: 'table', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-77', path: 'gap.table.pagination', category: 'table', desktop: '16', tablet: '16', mobile: '12' },

  // ----------------------------------------
  // MODALS
  // ----------------------------------------
  { id: 'g-80', path: 'gap.modal.header', category: 'modal', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-81', path: 'gap.modal.body', category: 'modal', desktop: '16', tablet: '16', mobile: '12' },
  { id: 'g-82', path: 'gap.modal.footer', category: 'modal', desktop: '12', tablet: '12', mobile: '8' },
  { id: 'g-83', path: 'gap.modal.sections', category: 'modal', desktop: '24', tablet: '24', mobile: '20' },
  { id: 'g-84', path: 'gap.modal.actions', category: 'modal', desktop: '12', tablet: '12', mobile: '8' },
  { id: 'g-85', path: 'gap.modal.actionsCompact', category: 'modal', desktop: '8', tablet: '8', mobile: '6' },

  // ----------------------------------------
  // ALERTS & NOTIFICATIONS
  // ----------------------------------------
  { id: 'g-90', path: 'gap.alert.content', category: 'alert', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-91', path: 'gap.alert.actions', category: 'alert', desktop: '12', tablet: '12', mobile: '8' },
  { id: 'g-92', path: 'gap.toast.content', category: 'alert', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-93', path: 'gap.toast.actions', category: 'alert', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-94', path: 'gap.banner.content', category: 'alert', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'g-95', path: 'gap.banner.actions', category: 'alert', desktop: '16', tablet: '16', mobile: '12' },

  // ----------------------------------------
  // CONTENT
  // ----------------------------------------
  { id: 'g-100', path: 'gap.content.sections', category: 'content', desktop: '48', tablet: '40', mobile: '32' },
  { id: 'g-101', path: 'gap.content.sectionsCompact', category: 'content', desktop: '32', tablet: '28', mobile: '24' },
  { id: 'g-102', path: 'gap.content.blocks', category: 'content', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'g-103', path: 'gap.content.blocksCompact', category: 'content', desktop: '16', tablet: '16', mobile: '12' },
  { id: 'g-104', path: 'gap.content.paragraphs', category: 'content', desktop: '16', tablet: '16', mobile: '12' },
  { id: 'g-105', path: 'gap.content.list', category: 'content', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-106', path: 'gap.content.listCompact', category: 'content', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-107', path: 'gap.content.headingToContent', category: 'content', desktop: '16', tablet: '16', mobile: '12' },
  { id: 'g-108', path: 'gap.content.contentToHeading', category: 'content', desktop: '32', tablet: '28', mobile: '24' },

  // ----------------------------------------
  // GRID (Flex/Grid layouts)
  // ----------------------------------------
  { id: 'g-110', path: 'gap.grid.tight', category: 'grid', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-111', path: 'gap.grid.default', category: 'grid', desktop: '16', tablet: '16', mobile: '12' },
  { id: 'g-112', path: 'gap.grid.relaxed', category: 'grid', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'g-113', path: 'gap.grid.loose', category: 'grid', desktop: '32', tablet: '28', mobile: '24' },
  { id: 'g-114', path: 'gap.grid.extraLoose', category: 'grid', desktop: '48', tablet: '40', mobile: '32' },
  { id: 'g-115', path: 'gap.grid.cards', category: 'grid', desktop: '16', tablet: '16', mobile: '12' },
  { id: 'g-116', path: 'gap.grid.cardsCompact', category: 'grid', desktop: '12', tablet: '12', mobile: '8' },
  { id: 'g-117', path: 'gap.grid.cardsSpacious', category: 'grid', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'g-118', path: 'gap.grid.tiles', category: 'grid', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-119', path: 'gap.grid.gallery', category: 'grid', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-120', path: 'gap.grid.masonry', category: 'grid', desktop: '16', tablet: '16', mobile: '12' },

  // ----------------------------------------
  // STACK (Vertical groups)
  // ----------------------------------------
  { id: 'g-130', path: 'gap.stack.none', category: 'stack', desktop: '0', tablet: '0', mobile: '0' },
  { id: 'g-131', path: 'gap.stack.tight', category: 'stack', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-132', path: 'gap.stack.default', category: 'stack', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-133', path: 'gap.stack.relaxed', category: 'stack', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'g-134', path: 'gap.stack.loose', category: 'stack', desktop: '16', tablet: '16', mobile: '12' },
  { id: 'g-135', path: 'gap.stack.extraLoose', category: 'stack', desktop: '24', tablet: '20', mobile: '16' },

  // ----------------------------------------
  // DATA (Metrics, Charts)
  // ----------------------------------------
  { id: 'g-140', path: 'gap.data.metric', category: 'data', desktop: '4', tablet: '4', mobile: '4' },
  { id: 'g-141', path: 'gap.data.metricGroup', category: 'data', desktop: '24', tablet: '20', mobile: '16' },
  { id: 'g-142', path: 'gap.data.stat', category: 'data', desktop: '8', tablet: '8', mobile: '6' },
  { id: 'g-143', path: 'gap.data.statGroup', category: 'data', desktop: '32', tablet: '28', mobile: '24' },
  { id: 'g-144', path: 'gap.data.chartLegend', category: 'data', desktop: '12', tablet: '12', mobile: '10' },
  { id: 'g-145', path: 'gap.data.chartLabels', category: 'data', desktop: '8', tablet: '8', mobile: '6' },
];

// ============================================
// STATE
// ============================================

export function createDefaultGapState(): GapState {
  return {
    primitives: JSON.parse(JSON.stringify(DEFAULT_GAP_PRIMITIVES)),
    semanticTokens: JSON.parse(JSON.stringify(DEFAULT_GAP_SEMANTIC_TOKENS)),
  };
}

// ============================================
// HELPERS
// ============================================

export function getGapTokensByCategory(tokens: GapSemanticToken[], category: GapCategory): GapSemanticToken[] {
  return tokens.filter(t => t.category === category);
}

export function getEnabledGapPrimitives(primitives: GapPrimitive[]): GapPrimitive[] {
  return primitives.filter(p => p.enabled);
}
