/**
 * Gap Tokens Type Definitions
 * 2-tier architecture for flex/grid gap values
 * 
 * Level 1: Primitives (gap.0, gap.4, gap.8...) - in Primitives collection
 * Level 2: Semantic (gap.inline.icon, gap.action.group) - in Gap collection
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
// SEMANTIC TOKENS
// ============================================

export interface GapSemanticToken {
  id: string;           // "gap.inline.icon"
  category: GapCategory;
  name: string;         // "icon"
  path: string[];       // ["inline", "icon"]
  aliasTo: string;      // "gap.4"
}

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

export const GAP_CATEGORIES: { id: GapCategory; label: string; icon: string }[] = [
  { id: 'inline', label: 'Инлайн', icon: '📍' },
  { id: 'action', label: 'Действия', icon: '🔘' },
  { id: 'form', label: 'Формы', icon: '📝' },
  { id: 'card', label: 'Карточки', icon: '🃏' },
  { id: 'list', label: 'Списки', icon: '📋' },
  { id: 'navigation', label: 'Навигация', icon: '🧭' },
  { id: 'table', label: 'Таблицы', icon: '📊' },
  { id: 'modal', label: 'Модалки', icon: '🪟' },
  { id: 'alert', label: 'Уведомления', icon: '🔔' },
  { id: 'content', label: 'Контент', icon: '📄' },
  { id: 'grid', label: 'Сетки', icon: '⊞' },
  { id: 'stack', label: 'Стеки', icon: '📚' },
  { id: 'data', label: 'Данные', icon: '📈' },
];

// ============================================
// DEFAULT SEMANTIC TOKENS
// ============================================

export const DEFAULT_GAP_SEMANTIC_TOKENS: GapSemanticToken[] = [
  // ----------------------------------------
  // INLINE ELEMENTS
  // ----------------------------------------
  { id: 'gap.inline.icon', category: 'inline', name: 'icon', path: ['inline', 'icon'], aliasTo: 'gap.4' },
  { id: 'gap.inline.text', category: 'inline', name: 'text', path: ['inline', 'text'], aliasTo: 'gap.4' },
  { id: 'gap.inline.badge', category: 'inline', name: 'badge', path: ['inline', 'badge'], aliasTo: 'gap.6' },
  { id: 'gap.inline.tag', category: 'inline', name: 'tag', path: ['inline', 'tag'], aliasTo: 'gap.8' },
  { id: 'gap.inline.action', category: 'inline', name: 'action', path: ['inline', 'action'], aliasTo: 'gap.8' },

  // ----------------------------------------
  // ACTIONS (Buttons, Toolbars)
  // ----------------------------------------
  { id: 'gap.action.group', category: 'action', name: 'group', path: ['action', 'group'], aliasTo: 'gap.8' },
  { id: 'gap.action.groupCompact', category: 'action', name: 'groupCompact', path: ['action', 'groupCompact'], aliasTo: 'gap.4' },
  { id: 'gap.action.groupSpacious', category: 'action', name: 'groupSpacious', path: ['action', 'groupSpacious'], aliasTo: 'gap.12' },
  { id: 'gap.action.toolbar', category: 'action', name: 'toolbar', path: ['action', 'toolbar'], aliasTo: 'gap.4' },
  { id: 'gap.action.toolbarSection', category: 'action', name: 'toolbarSection', path: ['action', 'toolbarSection'], aliasTo: 'gap.12' },
  { id: 'gap.action.buttonContent', category: 'action', name: 'buttonContent', path: ['action', 'buttonContent'], aliasTo: 'gap.8' },
  { id: 'gap.action.buttonContentCompact', category: 'action', name: 'buttonContentCompact', path: ['action', 'buttonContentCompact'], aliasTo: 'gap.6' },

  // ----------------------------------------
  // FORMS
  // ----------------------------------------
  { id: 'gap.form.field', category: 'form', name: 'field', path: ['form', 'field'], aliasTo: 'gap.16' },
  { id: 'gap.form.fieldCompact', category: 'form', name: 'fieldCompact', path: ['form', 'fieldCompact'], aliasTo: 'gap.12' },
  { id: 'gap.form.fieldSpacious', category: 'form', name: 'fieldSpacious', path: ['form', 'fieldSpacious'], aliasTo: 'gap.20' },
  { id: 'gap.form.group', category: 'form', name: 'group', path: ['form', 'group'], aliasTo: 'gap.24' },
  { id: 'gap.form.section', category: 'form', name: 'section', path: ['form', 'section'], aliasTo: 'gap.32' },
  { id: 'gap.form.inline', category: 'form', name: 'inline', path: ['form', 'inline'], aliasTo: 'gap.12' },
  { id: 'gap.form.inlineCompact', category: 'form', name: 'inlineCompact', path: ['form', 'inlineCompact'], aliasTo: 'gap.8' },
  { id: 'gap.form.labelGroup', category: 'form', name: 'labelGroup', path: ['form', 'labelGroup'], aliasTo: 'gap.4' },
  { id: 'gap.form.radioGroup', category: 'form', name: 'radioGroup', path: ['form', 'radioGroup'], aliasTo: 'gap.12' },
  { id: 'gap.form.checkboxGroup', category: 'form', name: 'checkboxGroup', path: ['form', 'checkboxGroup'], aliasTo: 'gap.12' },
  { id: 'gap.form.actions', category: 'form', name: 'actions', path: ['form', 'actions'], aliasTo: 'gap.12' },
  { id: 'gap.form.actionsCompact', category: 'form', name: 'actionsCompact', path: ['form', 'actionsCompact'], aliasTo: 'gap.8' },

  // ----------------------------------------
  // CARDS
  // ----------------------------------------
  { id: 'gap.card.header', category: 'card', name: 'header', path: ['card', 'header'], aliasTo: 'gap.8' },
  { id: 'gap.card.body', category: 'card', name: 'body', path: ['card', 'body'], aliasTo: 'gap.12' },
  { id: 'gap.card.footer', category: 'card', name: 'footer', path: ['card', 'footer'], aliasTo: 'gap.12' },
  { id: 'gap.card.sections', category: 'card', name: 'sections', path: ['card', 'sections'], aliasTo: 'gap.16' },
  { id: 'gap.card.meta', category: 'card', name: 'meta', path: ['card', 'meta'], aliasTo: 'gap.8' },
  { id: 'gap.card.actions', category: 'card', name: 'actions', path: ['card', 'actions'], aliasTo: 'gap.8' },
  { id: 'gap.card.tags', category: 'card', name: 'tags', path: ['card', 'tags'], aliasTo: 'gap.6' },

  // ----------------------------------------
  // LISTS
  // ----------------------------------------
  { id: 'gap.list.items', category: 'list', name: 'items', path: ['list', 'items'], aliasTo: 'gap.0' },
  { id: 'gap.list.itemsSpaced', category: 'list', name: 'itemsSpaced', path: ['list', 'itemsSpaced'], aliasTo: 'gap.4' },
  { id: 'gap.list.itemsLoose', category: 'list', name: 'itemsLoose', path: ['list', 'itemsLoose'], aliasTo: 'gap.8' },
  { id: 'gap.list.itemContent', category: 'list', name: 'itemContent', path: ['list', 'itemContent'], aliasTo: 'gap.12' },
  { id: 'gap.list.itemContentCompact', category: 'list', name: 'itemContentCompact', path: ['list', 'itemContentCompact'], aliasTo: 'gap.8' },
  { id: 'gap.list.itemMeta', category: 'list', name: 'itemMeta', path: ['list', 'itemMeta'], aliasTo: 'gap.8' },
  { id: 'gap.list.itemActions', category: 'list', name: 'itemActions', path: ['list', 'itemActions'], aliasTo: 'gap.4' },
  { id: 'gap.list.groups', category: 'list', name: 'groups', path: ['list', 'groups'], aliasTo: 'gap.16' },

  // ----------------------------------------
  // NAVIGATION
  // ----------------------------------------
  { id: 'gap.navigation.items', category: 'navigation', name: 'items', path: ['navigation', 'items'], aliasTo: 'gap.4' },
  { id: 'gap.navigation.itemsCompact', category: 'navigation', name: 'itemsCompact', path: ['navigation', 'itemsCompact'], aliasTo: 'gap.2' },
  { id: 'gap.navigation.itemsSpacious', category: 'navigation', name: 'itemsSpacious', path: ['navigation', 'itemsSpacious'], aliasTo: 'gap.8' },
  { id: 'gap.navigation.tabs', category: 'navigation', name: 'tabs', path: ['navigation', 'tabs'], aliasTo: 'gap.0' },
  { id: 'gap.navigation.tabsSpaced', category: 'navigation', name: 'tabsSpaced', path: ['navigation', 'tabsSpaced'], aliasTo: 'gap.4' },
  { id: 'gap.navigation.breadcrumb', category: 'navigation', name: 'breadcrumb', path: ['navigation', 'breadcrumb'], aliasTo: 'gap.8' },
  { id: 'gap.navigation.breadcrumbSeparator', category: 'navigation', name: 'breadcrumbSeparator', path: ['navigation', 'breadcrumbSeparator'], aliasTo: 'gap.8' },
  { id: 'gap.navigation.pagination', category: 'navigation', name: 'pagination', path: ['navigation', 'pagination'], aliasTo: 'gap.4' },
  { id: 'gap.navigation.menuSections', category: 'navigation', name: 'menuSections', path: ['navigation', 'menuSections'], aliasTo: 'gap.8' },

  // ----------------------------------------
  // TABLES
  // ----------------------------------------
  { id: 'gap.table.headerCells', category: 'table', name: 'headerCells', path: ['table', 'headerCells'], aliasTo: 'gap.0' },
  { id: 'gap.table.rows', category: 'table', name: 'rows', path: ['table', 'rows'], aliasTo: 'gap.0' },
  { id: 'gap.table.rowsStriped', category: 'table', name: 'rowsStriped', path: ['table', 'rowsStriped'], aliasTo: 'gap.0' },
  { id: 'gap.table.cellContent', category: 'table', name: 'cellContent', path: ['table', 'cellContent'], aliasTo: 'gap.8' },
  { id: 'gap.table.cellActions', category: 'table', name: 'cellActions', path: ['table', 'cellActions'], aliasTo: 'gap.4' },
  { id: 'gap.table.toolbar', category: 'table', name: 'toolbar', path: ['table', 'toolbar'], aliasTo: 'gap.12' },
  { id: 'gap.table.toolbarActions', category: 'table', name: 'toolbarActions', path: ['table', 'toolbarActions'], aliasTo: 'gap.8' },
  { id: 'gap.table.pagination', category: 'table', name: 'pagination', path: ['table', 'pagination'], aliasTo: 'gap.16' },

  // ----------------------------------------
  // MODALS
  // ----------------------------------------
  { id: 'gap.modal.header', category: 'modal', name: 'header', path: ['modal', 'header'], aliasTo: 'gap.8' },
  { id: 'gap.modal.body', category: 'modal', name: 'body', path: ['modal', 'body'], aliasTo: 'gap.16' },
  { id: 'gap.modal.footer', category: 'modal', name: 'footer', path: ['modal', 'footer'], aliasTo: 'gap.12' },
  { id: 'gap.modal.sections', category: 'modal', name: 'sections', path: ['modal', 'sections'], aliasTo: 'gap.24' },
  { id: 'gap.modal.actions', category: 'modal', name: 'actions', path: ['modal', 'actions'], aliasTo: 'gap.12' },
  { id: 'gap.modal.actionsCompact', category: 'modal', name: 'actionsCompact', path: ['modal', 'actionsCompact'], aliasTo: 'gap.8' },

  // ----------------------------------------
  // ALERTS & NOTIFICATIONS
  // ----------------------------------------
  { id: 'gap.alert.content', category: 'alert', name: 'content', path: ['alert', 'content'], aliasTo: 'gap.8' },
  { id: 'gap.alert.actions', category: 'alert', name: 'actions', path: ['alert', 'actions'], aliasTo: 'gap.12' },
  { id: 'gap.toast.content', category: 'alert', name: 'toast.content', path: ['toast', 'content'], aliasTo: 'gap.8' },
  { id: 'gap.toast.actions', category: 'alert', name: 'toast.actions', path: ['toast', 'actions'], aliasTo: 'gap.8' },
  { id: 'gap.banner.content', category: 'alert', name: 'banner.content', path: ['banner', 'content'], aliasTo: 'gap.12' },
  { id: 'gap.banner.actions', category: 'alert', name: 'banner.actions', path: ['banner', 'actions'], aliasTo: 'gap.16' },

  // ----------------------------------------
  // CONTENT
  // ----------------------------------------
  { id: 'gap.content.sections', category: 'content', name: 'sections', path: ['content', 'sections'], aliasTo: 'gap.48' },
  { id: 'gap.content.sectionsCompact', category: 'content', name: 'sectionsCompact', path: ['content', 'sectionsCompact'], aliasTo: 'gap.32' },
  { id: 'gap.content.blocks', category: 'content', name: 'blocks', path: ['content', 'blocks'], aliasTo: 'gap.24' },
  { id: 'gap.content.blocksCompact', category: 'content', name: 'blocksCompact', path: ['content', 'blocksCompact'], aliasTo: 'gap.16' },
  { id: 'gap.content.paragraphs', category: 'content', name: 'paragraphs', path: ['content', 'paragraphs'], aliasTo: 'gap.16' },
  { id: 'gap.content.list', category: 'content', name: 'list', path: ['content', 'list'], aliasTo: 'gap.8' },
  { id: 'gap.content.listCompact', category: 'content', name: 'listCompact', path: ['content', 'listCompact'], aliasTo: 'gap.4' },
  { id: 'gap.content.headingToContent', category: 'content', name: 'headingToContent', path: ['content', 'headingToContent'], aliasTo: 'gap.16' },
  { id: 'gap.content.contentToHeading', category: 'content', name: 'contentToHeading', path: ['content', 'contentToHeading'], aliasTo: 'gap.32' },

  // ----------------------------------------
  // GRID (Flex/Grid layouts)
  // ----------------------------------------
  { id: 'gap.grid.tight', category: 'grid', name: 'tight', path: ['grid', 'tight'], aliasTo: 'gap.8' },
  { id: 'gap.grid.default', category: 'grid', name: 'default', path: ['grid', 'default'], aliasTo: 'gap.16' },
  { id: 'gap.grid.relaxed', category: 'grid', name: 'relaxed', path: ['grid', 'relaxed'], aliasTo: 'gap.24' },
  { id: 'gap.grid.loose', category: 'grid', name: 'loose', path: ['grid', 'loose'], aliasTo: 'gap.32' },
  { id: 'gap.grid.extraLoose', category: 'grid', name: 'extraLoose', path: ['grid', 'extraLoose'], aliasTo: 'gap.48' },
  { id: 'gap.grid.cards', category: 'grid', name: 'cards', path: ['grid', 'cards'], aliasTo: 'gap.16' },
  { id: 'gap.grid.cardsCompact', category: 'grid', name: 'cardsCompact', path: ['grid', 'cardsCompact'], aliasTo: 'gap.12' },
  { id: 'gap.grid.cardsSpacious', category: 'grid', name: 'cardsSpacious', path: ['grid', 'cardsSpacious'], aliasTo: 'gap.24' },
  { id: 'gap.grid.tiles', category: 'grid', name: 'tiles', path: ['grid', 'tiles'], aliasTo: 'gap.8' },
  { id: 'gap.grid.gallery', category: 'grid', name: 'gallery', path: ['grid', 'gallery'], aliasTo: 'gap.4' },
  { id: 'gap.grid.masonry', category: 'grid', name: 'masonry', path: ['grid', 'masonry'], aliasTo: 'gap.16' },

  // ----------------------------------------
  // STACK (Vertical groups)
  // ----------------------------------------
  { id: 'gap.stack.none', category: 'stack', name: 'none', path: ['stack', 'none'], aliasTo: 'gap.0' },
  { id: 'gap.stack.tight', category: 'stack', name: 'tight', path: ['stack', 'tight'], aliasTo: 'gap.4' },
  { id: 'gap.stack.default', category: 'stack', name: 'default', path: ['stack', 'default'], aliasTo: 'gap.8' },
  { id: 'gap.stack.relaxed', category: 'stack', name: 'relaxed', path: ['stack', 'relaxed'], aliasTo: 'gap.12' },
  { id: 'gap.stack.loose', category: 'stack', name: 'loose', path: ['stack', 'loose'], aliasTo: 'gap.16' },
  { id: 'gap.stack.extraLoose', category: 'stack', name: 'extraLoose', path: ['stack', 'extraLoose'], aliasTo: 'gap.24' },

  // ----------------------------------------
  // DATA (Metrics, Charts)
  // ----------------------------------------
  { id: 'gap.data.metric', category: 'data', name: 'metric', path: ['data', 'metric'], aliasTo: 'gap.4' },
  { id: 'gap.data.metricGroup', category: 'data', name: 'metricGroup', path: ['data', 'metricGroup'], aliasTo: 'gap.24' },
  { id: 'gap.data.stat', category: 'data', name: 'stat', path: ['data', 'stat'], aliasTo: 'gap.8' },
  { id: 'gap.data.statGroup', category: 'data', name: 'statGroup', path: ['data', 'statGroup'], aliasTo: 'gap.32' },
  { id: 'gap.data.chart.legend', category: 'data', name: 'chart.legend', path: ['data', 'chart', 'legend'], aliasTo: 'gap.12' },
  { id: 'gap.data.chart.labels', category: 'data', name: 'chart.labels', path: ['data', 'chart', 'labels'], aliasTo: 'gap.8' },
];

// ============================================
// STATE
// ============================================

export interface GapState {
  primitives: GapPrimitive[];
  semanticTokens: GapSemanticToken[];
}

export function createDefaultGapState(): GapState {
  return {
    primitives: JSON.parse(JSON.stringify(DEFAULT_GAP_PRIMITIVES)),
    semanticTokens: JSON.parse(JSON.stringify(DEFAULT_GAP_SEMANTIC_TOKENS)),
  };
}

// ============================================
// HELPERS
// ============================================

export function generateGapTokenId(category: GapCategory, ...pathParts: string[]): string {
  return `gap.${category}.${pathParts.join('.')}`;
}

export function getGapTokensByCategory(tokens: GapSemanticToken[], category: GapCategory): GapSemanticToken[] {
  return tokens.filter(t => t.category === category);
}

export function getEnabledGapPrimitives(primitives: GapPrimitive[]): GapPrimitive[] {
  return primitives.filter(p => p.enabled);
}
