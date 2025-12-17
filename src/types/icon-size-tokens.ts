/**
 * Icon Size Tokens Type Definitions
 * 2-tier architecture with device modes (like Spacing/Gap)
 * 
 * Level 1: Primitives (iconSize.10, iconSize.16...) - in Primitives collection
 * Level 2: Semantic (iconSize.interactive.button) - in Icon Size collection with Desktop/Tablet/Mobile modes
 */

// ============================================
// PRIMITIVES
// ============================================

export interface IconSizePrimitive {
  name: string;   // "10", "12", "16"...
  value: number;  // 10, 12, 16...
  selected: boolean;
}

export const DEFAULT_ICON_SIZE_PRIMITIVES: IconSizePrimitive[] = [
  { name: '10', value: 10, selected: true },
  { name: '12', value: 12, selected: true },
  { name: '14', value: 14, selected: true },
  { name: '16', value: 16, selected: true },
  { name: '18', value: 18, selected: true },
  { name: '20', value: 20, selected: true },
  { name: '24', value: 24, selected: true },
  { name: '28', value: 28, selected: true },
  { name: '32', value: 32, selected: true },
  { name: '36', value: 36, selected: true },
  { name: '40', value: 40, selected: true },
  { name: '48', value: 48, selected: true },
  { name: '56', value: 56, selected: true },
  { name: '64', value: 64, selected: true },
  { name: '72', value: 72, selected: true },
  { name: '96', value: 96, selected: true },
];

// ============================================
// SEMANTIC TOKENS (with device modes)
// ============================================

export type IconSizeCategory = 
  | 'interactive'
  | 'form'
  | 'navigation'
  | 'status'
  | 'notification'
  | 'data'
  | 'media'
  | 'empty'
  | 'modal'
  | 'card'
  | 'list'
  | 'action'
  | 'loading'
  | 'special';

export const ICON_SIZE_CATEGORIES: Record<IconSizeCategory, { label: string; description: string }> = {
  interactive: { label: 'Interactive', description: 'Buttons, links, menu items, tabs' },
  form: { label: 'Form', description: 'Inputs, selects, checkboxes, radio, validation' },
  navigation: { label: 'Navigation', description: 'Breadcrumbs, pagination, expand/collapse, back/close' },
  status: { label: 'Status', description: 'Badges, tags, chips, indicators' },
  notification: { label: 'Notification', description: 'Alerts, toasts, banners' },
  data: { label: 'Data', description: 'Tables, metrics, charts' },
  media: { label: 'Media', description: 'Avatars, placeholders, media players' },
  empty: { label: 'Empty States', description: 'Empty state illustrations and icons' },
  modal: { label: 'Modal', description: 'Modal dialogs and confirmations' },
  card: { label: 'Card', description: 'Card header, action, meta icons' },
  list: { label: 'List', description: 'List items, bullets, drag handles' },
  action: { label: 'Action', description: 'FAB, context menu, primary/secondary actions' },
  loading: { label: 'Loading', description: 'Spinners and loaders' },
  special: { label: 'Special', description: 'Logos, social icons, ratings, steppers' },
};

// Semantic token with device-specific values
export interface IconSizeSemanticToken {
  id: string;
  path: string;           // "iconSize.interactive.button"
  category: IconSizeCategory;
  name: string;
  description?: string;
  // Device-specific references to primitives (primitive name like "16" -> {iconSize.16})
  desktop: string;
  tablet: string;
  mobile: string;
}

// Custom category for user-defined sections
export interface CustomIconSizeCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface IconSizeState {
  primitives: IconSizePrimitive[];
  semanticTokens: IconSizeSemanticToken[];
  customCategories?: CustomIconSizeCategory[];
}

// ============================================
// DEFAULT SEMANTIC TOKENS
// По умолчанию значения одинаковые для всех устройств,
// но могут быть изменены при необходимости
// ============================================

export const DEFAULT_ICON_SIZE_SEMANTIC_TOKENS: IconSizeSemanticToken[] = [
  // ============================================
  // INTERACTIVE - buttons, links, menu items, tabs
  // ============================================
  { id: 'is-1', path: 'iconSize.interactive.buttonLarge', category: 'interactive', name: 'buttonLarge', desktop: '20', tablet: '20', mobile: '20', description: 'Large button icon' },
  { id: 'is-2', path: 'iconSize.interactive.button', category: 'interactive', name: 'button', desktop: '16', tablet: '16', mobile: '16', description: 'Default button icon' },
  { id: 'is-3', path: 'iconSize.interactive.buttonCompact', category: 'interactive', name: 'buttonCompact', desktop: '14', tablet: '14', mobile: '14', description: 'Compact button icon' },
  { id: 'is-4', path: 'iconSize.interactive.buttonIconOnly', category: 'interactive', name: 'buttonIconOnly', desktop: '20', tablet: '20', mobile: '20', description: 'Icon-only button' },
  { id: 'is-5', path: 'iconSize.interactive.buttonIconOnlyCompact', category: 'interactive', name: 'buttonIconOnlyCompact', desktop: '16', tablet: '16', mobile: '16', description: 'Compact icon-only button' },
  { id: 'is-6', path: 'iconSize.interactive.link', category: 'interactive', name: 'link', desktop: '16', tablet: '16', mobile: '16', description: 'Link icon' },
  { id: 'is-7', path: 'iconSize.interactive.linkCompact', category: 'interactive', name: 'linkCompact', desktop: '14', tablet: '14', mobile: '14', description: 'Compact link icon' },
  { id: 'is-8', path: 'iconSize.interactive.menuItem', category: 'interactive', name: 'menuItem', desktop: '16', tablet: '16', mobile: '16', description: 'Menu item icon' },
  { id: 'is-9', path: 'iconSize.interactive.menuItemCompact', category: 'interactive', name: 'menuItemCompact', desktop: '14', tablet: '14', mobile: '14', description: 'Compact menu item icon' },
  { id: 'is-10', path: 'iconSize.interactive.tab', category: 'interactive', name: 'tab', desktop: '18', tablet: '18', mobile: '18', description: 'Tab icon' },
  { id: 'is-11', path: 'iconSize.interactive.tabCompact', category: 'interactive', name: 'tabCompact', desktop: '16', tablet: '16', mobile: '16', description: 'Compact tab icon' },

  // ============================================
  // FORM - inputs, selects, checkboxes
  // ============================================
  { id: 'is-20', path: 'iconSize.form.inputPrefix', category: 'form', name: 'inputPrefix', desktop: '16', tablet: '16', mobile: '16', description: 'Input prefix icon' },
  { id: 'is-21', path: 'iconSize.form.inputSuffix', category: 'form', name: 'inputSuffix', desktop: '16', tablet: '16', mobile: '16', description: 'Input suffix icon' },
  { id: 'is-22', path: 'iconSize.form.inputAction', category: 'form', name: 'inputAction', desktop: '18', tablet: '18', mobile: '18', description: 'Input action icon' },
  { id: 'is-23', path: 'iconSize.form.selectArrow', category: 'form', name: 'selectArrow', desktop: '16', tablet: '16', mobile: '16', description: 'Select dropdown arrow' },
  { id: 'is-24', path: 'iconSize.form.clearButton', category: 'form', name: 'clearButton', desktop: '14', tablet: '14', mobile: '14', description: 'Clear button icon' },
  { id: 'is-25', path: 'iconSize.form.checkbox', category: 'form', name: 'checkbox', desktop: '16', tablet: '16', mobile: '16', description: 'Checkbox icon' },
  { id: 'is-26', path: 'iconSize.form.radio', category: 'form', name: 'radio', desktop: '16', tablet: '16', mobile: '16', description: 'Radio button icon' },
  { id: 'is-27', path: 'iconSize.form.switch', category: 'form', name: 'switch', desktop: '14', tablet: '14', mobile: '14', description: 'Switch icon' },
  { id: 'is-28', path: 'iconSize.form.validation', category: 'form', name: 'validation', desktop: '14', tablet: '14', mobile: '14', description: 'Validation status icon' },
  { id: 'is-29', path: 'iconSize.form.required', category: 'form', name: 'required', desktop: '10', tablet: '10', mobile: '10', description: 'Required indicator' },

  // ============================================
  // NAVIGATION - breadcrumbs, pagination, arrows
  // ============================================
  { id: 'is-30', path: 'iconSize.navigation.item', category: 'navigation', name: 'item', desktop: '20', tablet: '20', mobile: '20', description: 'Navigation item icon' },
  { id: 'is-31', path: 'iconSize.navigation.itemCompact', category: 'navigation', name: 'itemCompact', desktop: '16', tablet: '16', mobile: '16', description: 'Compact navigation item' },
  { id: 'is-32', path: 'iconSize.navigation.breadcrumbSeparator', category: 'navigation', name: 'breadcrumbSeparator', desktop: '14', tablet: '14', mobile: '14', description: 'Breadcrumb separator' },
  { id: 'is-33', path: 'iconSize.navigation.breadcrumbHome', category: 'navigation', name: 'breadcrumbHome', desktop: '16', tablet: '16', mobile: '16', description: 'Breadcrumb home icon' },
  { id: 'is-34', path: 'iconSize.navigation.paginationArrow', category: 'navigation', name: 'paginationArrow', desktop: '16', tablet: '16', mobile: '16', description: 'Pagination arrow' },
  { id: 'is-35', path: 'iconSize.navigation.expand', category: 'navigation', name: 'expand', desktop: '16', tablet: '16', mobile: '16', description: 'Expand icon' },
  { id: 'is-36', path: 'iconSize.navigation.collapse', category: 'navigation', name: 'collapse', desktop: '16', tablet: '16', mobile: '16', description: 'Collapse icon' },
  { id: 'is-37', path: 'iconSize.navigation.menuArrow', category: 'navigation', name: 'menuArrow', desktop: '12', tablet: '12', mobile: '12', description: 'Menu arrow' },
  { id: 'is-38', path: 'iconSize.navigation.submenuArrow', category: 'navigation', name: 'submenuArrow', desktop: '14', tablet: '14', mobile: '14', description: 'Submenu arrow' },
  { id: 'is-39', path: 'iconSize.navigation.back', category: 'navigation', name: 'back', desktop: '20', tablet: '20', mobile: '20', description: 'Back navigation' },
  { id: 'is-40', path: 'iconSize.navigation.close', category: 'navigation', name: 'close', desktop: '20', tablet: '20', mobile: '20', description: 'Close icon' },
  { id: 'is-41', path: 'iconSize.navigation.hamburger', category: 'navigation', name: 'hamburger', desktop: '24', tablet: '24', mobile: '24', description: 'Hamburger menu' },

  // ============================================
  // STATUS - badges, tags, chips, indicators
  // ============================================
  { id: 'is-50', path: 'iconSize.status.badge', category: 'status', name: 'badge', desktop: '12', tablet: '12', mobile: '12', description: 'Badge icon' },
  { id: 'is-51', path: 'iconSize.status.tag', category: 'status', name: 'tag', desktop: '14', tablet: '14', mobile: '14', description: 'Tag icon' },
  { id: 'is-52', path: 'iconSize.status.chip', category: 'status', name: 'chip', desktop: '16', tablet: '16', mobile: '16', description: 'Chip icon' },
  { id: 'is-53', path: 'iconSize.status.chipRemove', category: 'status', name: 'chipRemove', desktop: '14', tablet: '14', mobile: '14', description: 'Chip remove icon' },
  { id: 'is-54', path: 'iconSize.status.indicator', category: 'status', name: 'indicator', desktop: '12', tablet: '12', mobile: '12', description: 'Status indicator' },
  { id: 'is-55', path: 'iconSize.status.dot', category: 'status', name: 'dot', desktop: '10', tablet: '10', mobile: '10', description: 'Status dot' },

  // ============================================
  // NOTIFICATION - alerts, toasts, banners
  // ============================================
  { id: 'is-60', path: 'iconSize.notification.alert', category: 'notification', name: 'alert', desktop: '20', tablet: '20', mobile: '20', description: 'Alert icon' },
  { id: 'is-61', path: 'iconSize.notification.alertCompact', category: 'notification', name: 'alertCompact', desktop: '16', tablet: '16', mobile: '16', description: 'Compact alert icon' },
  { id: 'is-62', path: 'iconSize.notification.toast', category: 'notification', name: 'toast', desktop: '20', tablet: '20', mobile: '20', description: 'Toast icon' },
  { id: 'is-63', path: 'iconSize.notification.toastClose', category: 'notification', name: 'toastClose', desktop: '16', tablet: '16', mobile: '16', description: 'Toast close icon' },
  { id: 'is-64', path: 'iconSize.notification.banner', category: 'notification', name: 'banner', desktop: '24', tablet: '24', mobile: '24', description: 'Banner icon' },
  { id: 'is-65', path: 'iconSize.notification.bannerClose', category: 'notification', name: 'bannerClose', desktop: '20', tablet: '20', mobile: '20', description: 'Banner close icon' },

  // ============================================
  // DATA - tables, metrics, charts
  // ============================================
  { id: 'is-70', path: 'iconSize.data.tableAction', category: 'data', name: 'tableAction', desktop: '16', tablet: '16', mobile: '16', description: 'Table action icon' },
  { id: 'is-71', path: 'iconSize.data.tableSort', category: 'data', name: 'tableSort', desktop: '14', tablet: '14', mobile: '14', description: 'Table sort icon' },
  { id: 'is-72', path: 'iconSize.data.tableExpand', category: 'data', name: 'tableExpand', desktop: '16', tablet: '16', mobile: '16', description: 'Table expand icon' },
  { id: 'is-73', path: 'iconSize.data.metricTrend', category: 'data', name: 'metricTrend', desktop: '16', tablet: '16', mobile: '16', description: 'Metric trend icon' },
  { id: 'is-74', path: 'iconSize.data.metricInfo', category: 'data', name: 'metricInfo', desktop: '14', tablet: '14', mobile: '14', description: 'Metric info icon' },
  { id: 'is-75', path: 'iconSize.data.chartLegend', category: 'data', name: 'chartLegend', desktop: '12', tablet: '12', mobile: '12', description: 'Chart legend icon' },

  // ============================================
  // MEDIA - avatars, placeholders, players
  // ============================================
  { id: 'is-80', path: 'iconSize.media.avatarBadge', category: 'media', name: 'avatarBadge', desktop: '12', tablet: '12', mobile: '12', description: 'Avatar badge icon' },
  { id: 'is-81', path: 'iconSize.media.avatarStatus', category: 'media', name: 'avatarStatus', desktop: '10', tablet: '10', mobile: '10', description: 'Avatar status icon' },
  { id: 'is-82', path: 'iconSize.media.placeholder', category: 'media', name: 'placeholder', desktop: '48', tablet: '48', mobile: '48', description: 'Media placeholder icon' },
  { id: 'is-83', path: 'iconSize.media.placeholderCompact', category: 'media', name: 'placeholderCompact', desktop: '32', tablet: '32', mobile: '32', description: 'Compact placeholder' },
  { id: 'is-84', path: 'iconSize.media.playButton', category: 'media', name: 'playButton', desktop: '48', tablet: '48', mobile: '48', description: 'Play button icon' },
  { id: 'is-85', path: 'iconSize.media.playButtonCompact', category: 'media', name: 'playButtonCompact', desktop: '32', tablet: '32', mobile: '32', description: 'Compact play button' },
  { id: 'is-86', path: 'iconSize.media.controls', category: 'media', name: 'controls', desktop: '24', tablet: '24', mobile: '24', description: 'Media controls icon' },
  { id: 'is-87', path: 'iconSize.media.controlsCompact', category: 'media', name: 'controlsCompact', desktop: '20', tablet: '20', mobile: '20', description: 'Compact media controls' },

  // ============================================
  // EMPTY - empty states, illustrations
  // ============================================
  { id: 'is-90', path: 'iconSize.empty.illustration', category: 'empty', name: 'illustration', desktop: '96', tablet: '96', mobile: '72', description: 'Empty state illustration' },
  { id: 'is-91', path: 'iconSize.empty.illustrationCompact', category: 'empty', name: 'illustrationCompact', desktop: '64', tablet: '64', mobile: '48', description: 'Compact illustration' },
  { id: 'is-92', path: 'iconSize.empty.icon', category: 'empty', name: 'icon', desktop: '48', tablet: '48', mobile: '40', description: 'Empty state icon' },
  { id: 'is-93', path: 'iconSize.empty.iconCompact', category: 'empty', name: 'iconCompact', desktop: '32', tablet: '32', mobile: '28', description: 'Compact empty state icon' },

  // ============================================
  // MODAL - dialogs, confirmations
  // ============================================
  { id: 'is-100', path: 'iconSize.modal.close', category: 'modal', name: 'close', desktop: '20', tablet: '20', mobile: '20', description: 'Modal close icon' },
  { id: 'is-101', path: 'iconSize.modal.headerIcon', category: 'modal', name: 'headerIcon', desktop: '24', tablet: '24', mobile: '24', description: 'Modal header icon' },
  { id: 'is-102', path: 'iconSize.modal.confirmationIcon', category: 'modal', name: 'confirmationIcon', desktop: '48', tablet: '48', mobile: '40', description: 'Confirmation dialog icon' },

  // ============================================
  // CARD - card components
  // ============================================
  { id: 'is-110', path: 'iconSize.card.headerIcon', category: 'card', name: 'headerIcon', desktop: '24', tablet: '24', mobile: '24', description: 'Card header icon' },
  { id: 'is-111', path: 'iconSize.card.action', category: 'card', name: 'action', desktop: '18', tablet: '18', mobile: '18', description: 'Card action icon' },
  { id: 'is-112', path: 'iconSize.card.meta', category: 'card', name: 'meta', desktop: '14', tablet: '14', mobile: '14', description: 'Card meta icon' },
  { id: 'is-113', path: 'iconSize.card.feature', category: 'card', name: 'feature', desktop: '32', tablet: '32', mobile: '28', description: 'Card feature icon' },

  // ============================================
  // LIST - list items
  // ============================================
  { id: 'is-120', path: 'iconSize.list.itemIcon', category: 'list', name: 'itemIcon', desktop: '20', tablet: '20', mobile: '20', description: 'List item icon' },
  { id: 'is-121', path: 'iconSize.list.itemIconCompact', category: 'list', name: 'itemIconCompact', desktop: '16', tablet: '16', mobile: '16', description: 'Compact list item icon' },
  { id: 'is-122', path: 'iconSize.list.bullet', category: 'list', name: 'bullet', desktop: '10', tablet: '10', mobile: '10', description: 'List bullet' },
  { id: 'is-123', path: 'iconSize.list.checkbox', category: 'list', name: 'checkbox', desktop: '18', tablet: '18', mobile: '18', description: 'List checkbox icon' },
  { id: 'is-124', path: 'iconSize.list.dragHandle', category: 'list', name: 'dragHandle', desktop: '16', tablet: '16', mobile: '16', description: 'Drag handle icon' },
  { id: 'is-125', path: 'iconSize.list.expandArrow', category: 'list', name: 'expandArrow', desktop: '16', tablet: '16', mobile: '16', description: 'List expand arrow' },

  // ============================================
  // ACTION - FAB, context menu, more
  // ============================================
  { id: 'is-130', path: 'iconSize.action.primary', category: 'action', name: 'primary', desktop: '20', tablet: '20', mobile: '20', description: 'Primary action icon' },
  { id: 'is-131', path: 'iconSize.action.secondary', category: 'action', name: 'secondary', desktop: '18', tablet: '18', mobile: '18', description: 'Secondary action icon' },
  { id: 'is-132', path: 'iconSize.action.tertiary', category: 'action', name: 'tertiary', desktop: '16', tablet: '16', mobile: '16', description: 'Tertiary action icon' },
  { id: 'is-133', path: 'iconSize.action.fab', category: 'action', name: 'fab', desktop: '24', tablet: '24', mobile: '24', description: 'FAB icon' },
  { id: 'is-134', path: 'iconSize.action.fabCompact', category: 'action', name: 'fabCompact', desktop: '20', tablet: '20', mobile: '20', description: 'Compact FAB icon' },
  { id: 'is-135', path: 'iconSize.action.contextMenu', category: 'action', name: 'contextMenu', desktop: '16', tablet: '16', mobile: '16', description: 'Context menu icon' },
  { id: 'is-136', path: 'iconSize.action.more', category: 'action', name: 'more', desktop: '20', tablet: '20', mobile: '20', description: 'More actions icon' },

  // ============================================
  // LOADING - spinners, loaders
  // ============================================
  { id: 'is-140', path: 'iconSize.loading.spinner', category: 'loading', name: 'spinner', desktop: '20', tablet: '20', mobile: '20', description: 'Default spinner' },
  { id: 'is-141', path: 'iconSize.loading.spinnerCompact', category: 'loading', name: 'spinnerCompact', desktop: '16', tablet: '16', mobile: '16', description: 'Compact spinner' },
  { id: 'is-142', path: 'iconSize.loading.spinnerLarge', category: 'loading', name: 'spinnerLarge', desktop: '32', tablet: '32', mobile: '32', description: 'Large spinner' },
  { id: 'is-143', path: 'iconSize.loading.button', category: 'loading', name: 'button', desktop: '16', tablet: '16', mobile: '16', description: 'Button loading spinner' },
  { id: 'is-144', path: 'iconSize.loading.page', category: 'loading', name: 'page', desktop: '48', tablet: '48', mobile: '40', description: 'Page loading spinner' },

  // ============================================
  // SPECIAL - logos, social, rating, stepper
  // ============================================
  { id: 'is-150', path: 'iconSize.special.logo', category: 'special', name: 'logo', desktop: '32', tablet: '32', mobile: '28', description: 'Logo icon' },
  { id: 'is-151', path: 'iconSize.special.logoCompact', category: 'special', name: 'logoCompact', desktop: '24', tablet: '24', mobile: '24', description: 'Compact logo' },
  { id: 'is-152', path: 'iconSize.special.logoLarge', category: 'special', name: 'logoLarge', desktop: '48', tablet: '48', mobile: '40', description: 'Large logo' },
  { id: 'is-153', path: 'iconSize.special.social', category: 'special', name: 'social', desktop: '24', tablet: '24', mobile: '24', description: 'Social icon' },
  { id: 'is-154', path: 'iconSize.special.socialCompact', category: 'special', name: 'socialCompact', desktop: '20', tablet: '20', mobile: '20', description: 'Compact social icon' },
  { id: 'is-155', path: 'iconSize.special.rating', category: 'special', name: 'rating', desktop: '18', tablet: '18', mobile: '18', description: 'Rating star icon' },
  { id: 'is-156', path: 'iconSize.special.ratingCompact', category: 'special', name: 'ratingCompact', desktop: '14', tablet: '14', mobile: '14', description: 'Compact rating star' },
  { id: 'is-157', path: 'iconSize.special.step', category: 'special', name: 'step', desktop: '24', tablet: '24', mobile: '24', description: 'Stepper icon' },
  { id: 'is-158', path: 'iconSize.special.stepCompact', category: 'special', name: 'stepCompact', desktop: '20', tablet: '20', mobile: '20', description: 'Compact stepper icon' },
];

// Category labels for UI (backward compatibility)
export const ICON_SIZE_CATEGORY_LABELS: Record<IconSizeCategory, string> = {
  interactive: 'Interactive',
  form: 'Form',
  navigation: 'Navigation',
  status: 'Status',
  notification: 'Notification',
  data: 'Data',
  media: 'Media',
  empty: 'Empty States',
  modal: 'Modal',
  card: 'Card',
  list: 'List',
  action: 'Action',
  loading: 'Loading',
  special: 'Special',
};

// Category descriptions (backward compatibility)
export const ICON_SIZE_CATEGORY_DESCRIPTIONS: Record<IconSizeCategory, string> = {
  interactive: 'Buttons, links, menu items, tabs',
  form: 'Inputs, selects, checkboxes, radio, validation',
  navigation: 'Breadcrumbs, pagination, expand/collapse, back/close',
  status: 'Badges, tags, chips, indicators',
  notification: 'Alerts, toasts, banners',
  data: 'Tables, metrics, charts',
  media: 'Avatars, placeholders, media players',
  empty: 'Empty state illustrations and icons',
  modal: 'Modal dialogs and confirmations',
  card: 'Card header, action, meta icons',
  list: 'List items, bullets, drag handles',
  action: 'FAB, context menu, primary/secondary/tertiary actions',
  loading: 'Spinners and loaders',
  special: 'Logos, social icons, ratings, steppers',
};

// Helper functions
export function getIconSizeTokensByCategory(category: IconSizeCategory): IconSizeSemanticToken[] {
  return DEFAULT_ICON_SIZE_SEMANTIC_TOKENS.filter(t => t.category === category);
}

export function getEnabledIconSizePrimitives(primitives: IconSizePrimitive[]): IconSizePrimitive[] {
  return primitives.filter(p => p.selected);
}

export function createDefaultIconSizeState(): IconSizeState {
  return {
    primitives: [...DEFAULT_ICON_SIZE_PRIMITIVES],
    semanticTokens: [...DEFAULT_ICON_SIZE_SEMANTIC_TOKENS],
  };
}
