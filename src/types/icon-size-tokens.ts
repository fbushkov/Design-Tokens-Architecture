// ============================================
// ICON SIZE TOKEN TYPES
// ============================================

// Primitive icon sizes
export interface IconSizePrimitive {
  name: string;
  value: number;
  selected: boolean;
}

// Icon Size categories
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

// Semantic icon size token
export interface IconSizeSemanticToken {
  id: string;
  category: IconSizeCategory;
  subcategory: string;
  name: string;
  primitiveRef: string; // e.g., '{iconSize.16}'
  value: number; // resolved value
  description?: string;
}

// Icon Size state
export interface IconSizeState {
  primitives: IconSizePrimitive[];
  semanticTokens: IconSizeSemanticToken[];
}

// ============================================
// DEFAULT PRIMITIVES
// ============================================

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
// DEFAULT SEMANTIC TOKENS
// ============================================

export const DEFAULT_ICON_SIZE_SEMANTIC_TOKENS: IconSizeSemanticToken[] = [
  // ============================================
  // INTERACTIVE - buttons, links, menu items, tabs
  // ============================================
  { id: 'iconSize.interactive.buttonLarge', category: 'interactive', subcategory: 'button', name: 'buttonLarge', primitiveRef: '{iconSize.20}', value: 20, description: 'Large button icon' },
  { id: 'iconSize.interactive.button', category: 'interactive', subcategory: 'button', name: 'button', primitiveRef: '{iconSize.16}', value: 16, description: 'Default button icon' },
  { id: 'iconSize.interactive.buttonCompact', category: 'interactive', subcategory: 'button', name: 'buttonCompact', primitiveRef: '{iconSize.14}', value: 14, description: 'Compact button icon' },
  
  { id: 'iconSize.interactive.buttonIconOnly', category: 'interactive', subcategory: 'button', name: 'buttonIconOnly', primitiveRef: '{iconSize.20}', value: 20, description: 'Icon-only button' },
  { id: 'iconSize.interactive.buttonIconOnlyCompact', category: 'interactive', subcategory: 'button', name: 'buttonIconOnlyCompact', primitiveRef: '{iconSize.16}', value: 16, description: 'Compact icon-only button' },
  
  { id: 'iconSize.interactive.link', category: 'interactive', subcategory: 'link', name: 'link', primitiveRef: '{iconSize.16}', value: 16, description: 'Link icon' },
  { id: 'iconSize.interactive.linkCompact', category: 'interactive', subcategory: 'link', name: 'linkCompact', primitiveRef: '{iconSize.14}', value: 14, description: 'Compact link icon' },
  
  { id: 'iconSize.interactive.menuItem', category: 'interactive', subcategory: 'menu', name: 'menuItem', primitiveRef: '{iconSize.16}', value: 16, description: 'Menu item icon' },
  { id: 'iconSize.interactive.menuItemCompact', category: 'interactive', subcategory: 'menu', name: 'menuItemCompact', primitiveRef: '{iconSize.14}', value: 14, description: 'Compact menu item icon' },
  
  { id: 'iconSize.interactive.tab', category: 'interactive', subcategory: 'tab', name: 'tab', primitiveRef: '{iconSize.18}', value: 18, description: 'Tab icon' },
  { id: 'iconSize.interactive.tabCompact', category: 'interactive', subcategory: 'tab', name: 'tabCompact', primitiveRef: '{iconSize.16}', value: 16, description: 'Compact tab icon' },
  
  // ============================================
  // FORM - inputs, selects, checkboxes
  // ============================================
  { id: 'iconSize.form.inputPrefix', category: 'form', subcategory: 'input', name: 'inputPrefix', primitiveRef: '{iconSize.16}', value: 16, description: 'Input prefix icon' },
  { id: 'iconSize.form.inputSuffix', category: 'form', subcategory: 'input', name: 'inputSuffix', primitiveRef: '{iconSize.16}', value: 16, description: 'Input suffix icon' },
  { id: 'iconSize.form.inputAction', category: 'form', subcategory: 'input', name: 'inputAction', primitiveRef: '{iconSize.18}', value: 18, description: 'Input action icon' },
  
  { id: 'iconSize.form.selectArrow', category: 'form', subcategory: 'select', name: 'selectArrow', primitiveRef: '{iconSize.16}', value: 16, description: 'Select dropdown arrow' },
  { id: 'iconSize.form.clearButton', category: 'form', subcategory: 'select', name: 'clearButton', primitiveRef: '{iconSize.14}', value: 14, description: 'Clear button icon' },
  
  { id: 'iconSize.form.checkbox', category: 'form', subcategory: 'checkbox', name: 'checkbox', primitiveRef: '{iconSize.16}', value: 16, description: 'Checkbox icon' },
  { id: 'iconSize.form.radio', category: 'form', subcategory: 'radio', name: 'radio', primitiveRef: '{iconSize.16}', value: 16, description: 'Radio button icon' },
  { id: 'iconSize.form.switch', category: 'form', subcategory: 'switch', name: 'switch', primitiveRef: '{iconSize.14}', value: 14, description: 'Switch icon' },
  
  { id: 'iconSize.form.validation', category: 'form', subcategory: 'validation', name: 'validation', primitiveRef: '{iconSize.14}', value: 14, description: 'Validation status icon' },
  { id: 'iconSize.form.required', category: 'form', subcategory: 'validation', name: 'required', primitiveRef: '{iconSize.10}', value: 10, description: 'Required indicator' },
  
  // ============================================
  // NAVIGATION - breadcrumbs, pagination, arrows
  // ============================================
  { id: 'iconSize.navigation.item', category: 'navigation', subcategory: 'item', name: 'item', primitiveRef: '{iconSize.20}', value: 20, description: 'Navigation item icon' },
  { id: 'iconSize.navigation.itemCompact', category: 'navigation', subcategory: 'item', name: 'itemCompact', primitiveRef: '{iconSize.16}', value: 16, description: 'Compact navigation item' },
  
  { id: 'iconSize.navigation.breadcrumbSeparator', category: 'navigation', subcategory: 'breadcrumb', name: 'breadcrumbSeparator', primitiveRef: '{iconSize.14}', value: 14, description: 'Breadcrumb separator' },
  { id: 'iconSize.navigation.breadcrumbHome', category: 'navigation', subcategory: 'breadcrumb', name: 'breadcrumbHome', primitiveRef: '{iconSize.16}', value: 16, description: 'Breadcrumb home icon' },
  
  { id: 'iconSize.navigation.paginationArrow', category: 'navigation', subcategory: 'pagination', name: 'paginationArrow', primitiveRef: '{iconSize.16}', value: 16, description: 'Pagination arrow' },
  
  { id: 'iconSize.navigation.expand', category: 'navigation', subcategory: 'expand', name: 'expand', primitiveRef: '{iconSize.16}', value: 16, description: 'Expand icon' },
  { id: 'iconSize.navigation.collapse', category: 'navigation', subcategory: 'expand', name: 'collapse', primitiveRef: '{iconSize.16}', value: 16, description: 'Collapse icon' },
  
  { id: 'iconSize.navigation.menuArrow', category: 'navigation', subcategory: 'menu', name: 'menuArrow', primitiveRef: '{iconSize.12}', value: 12, description: 'Menu arrow' },
  { id: 'iconSize.navigation.submenuArrow', category: 'navigation', subcategory: 'menu', name: 'submenuArrow', primitiveRef: '{iconSize.14}', value: 14, description: 'Submenu arrow' },
  
  { id: 'iconSize.navigation.back', category: 'navigation', subcategory: 'control', name: 'back', primitiveRef: '{iconSize.20}', value: 20, description: 'Back navigation' },
  { id: 'iconSize.navigation.close', category: 'navigation', subcategory: 'control', name: 'close', primitiveRef: '{iconSize.20}', value: 20, description: 'Close icon' },
  { id: 'iconSize.navigation.hamburger', category: 'navigation', subcategory: 'control', name: 'hamburger', primitiveRef: '{iconSize.24}', value: 24, description: 'Hamburger menu' },
  
  // ============================================
  // STATUS - badges, tags, chips, indicators
  // ============================================
  { id: 'iconSize.status.badge', category: 'status', subcategory: 'badge', name: 'badge', primitiveRef: '{iconSize.12}', value: 12, description: 'Badge icon' },
  { id: 'iconSize.status.tag', category: 'status', subcategory: 'tag', name: 'tag', primitiveRef: '{iconSize.14}', value: 14, description: 'Tag icon' },
  { id: 'iconSize.status.chip', category: 'status', subcategory: 'chip', name: 'chip', primitiveRef: '{iconSize.16}', value: 16, description: 'Chip icon' },
  { id: 'iconSize.status.chipRemove', category: 'status', subcategory: 'chip', name: 'chipRemove', primitiveRef: '{iconSize.14}', value: 14, description: 'Chip remove icon' },
  
  { id: 'iconSize.status.indicator', category: 'status', subcategory: 'indicator', name: 'indicator', primitiveRef: '{iconSize.12}', value: 12, description: 'Status indicator' },
  { id: 'iconSize.status.dot', category: 'status', subcategory: 'indicator', name: 'dot', primitiveRef: '{iconSize.10}', value: 10, description: 'Status dot' },
  
  // ============================================
  // NOTIFICATION - alerts, toasts, banners
  // ============================================
  { id: 'iconSize.notification.alert', category: 'notification', subcategory: 'alert', name: 'alert', primitiveRef: '{iconSize.20}', value: 20, description: 'Alert icon' },
  { id: 'iconSize.notification.alertCompact', category: 'notification', subcategory: 'alert', name: 'alertCompact', primitiveRef: '{iconSize.16}', value: 16, description: 'Compact alert icon' },
  
  { id: 'iconSize.notification.toast', category: 'notification', subcategory: 'toast', name: 'toast', primitiveRef: '{iconSize.20}', value: 20, description: 'Toast icon' },
  { id: 'iconSize.notification.toastClose', category: 'notification', subcategory: 'toast', name: 'toastClose', primitiveRef: '{iconSize.16}', value: 16, description: 'Toast close icon' },
  
  { id: 'iconSize.notification.banner', category: 'notification', subcategory: 'banner', name: 'banner', primitiveRef: '{iconSize.24}', value: 24, description: 'Banner icon' },
  { id: 'iconSize.notification.bannerClose', category: 'notification', subcategory: 'banner', name: 'bannerClose', primitiveRef: '{iconSize.20}', value: 20, description: 'Banner close icon' },
  
  // ============================================
  // DATA - tables, metrics, charts
  // ============================================
  { id: 'iconSize.data.tableAction', category: 'data', subcategory: 'table', name: 'tableAction', primitiveRef: '{iconSize.16}', value: 16, description: 'Table action icon' },
  { id: 'iconSize.data.tableSort', category: 'data', subcategory: 'table', name: 'tableSort', primitiveRef: '{iconSize.14}', value: 14, description: 'Table sort icon' },
  { id: 'iconSize.data.tableExpand', category: 'data', subcategory: 'table', name: 'tableExpand', primitiveRef: '{iconSize.16}', value: 16, description: 'Table expand icon' },
  
  { id: 'iconSize.data.metricTrend', category: 'data', subcategory: 'metric', name: 'metricTrend', primitiveRef: '{iconSize.16}', value: 16, description: 'Metric trend icon' },
  { id: 'iconSize.data.metricInfo', category: 'data', subcategory: 'metric', name: 'metricInfo', primitiveRef: '{iconSize.14}', value: 14, description: 'Metric info icon' },
  
  { id: 'iconSize.data.chartLegend', category: 'data', subcategory: 'chart', name: 'chartLegend', primitiveRef: '{iconSize.12}', value: 12, description: 'Chart legend icon' },
  
  // ============================================
  // MEDIA - avatars, placeholders, players
  // ============================================
  { id: 'iconSize.media.avatarBadge', category: 'media', subcategory: 'avatar', name: 'avatarBadge', primitiveRef: '{iconSize.12}', value: 12, description: 'Avatar badge icon' },
  { id: 'iconSize.media.avatarStatus', category: 'media', subcategory: 'avatar', name: 'avatarStatus', primitiveRef: '{iconSize.10}', value: 10, description: 'Avatar status icon' },
  
  { id: 'iconSize.media.placeholder', category: 'media', subcategory: 'placeholder', name: 'placeholder', primitiveRef: '{iconSize.48}', value: 48, description: 'Media placeholder icon' },
  { id: 'iconSize.media.placeholderCompact', category: 'media', subcategory: 'placeholder', name: 'placeholderCompact', primitiveRef: '{iconSize.32}', value: 32, description: 'Compact placeholder' },
  
  { id: 'iconSize.media.playButton', category: 'media', subcategory: 'player', name: 'playButton', primitiveRef: '{iconSize.48}', value: 48, description: 'Play button icon' },
  { id: 'iconSize.media.playButtonCompact', category: 'media', subcategory: 'player', name: 'playButtonCompact', primitiveRef: '{iconSize.32}', value: 32, description: 'Compact play button' },
  
  { id: 'iconSize.media.controls', category: 'media', subcategory: 'player', name: 'controls', primitiveRef: '{iconSize.24}', value: 24, description: 'Media controls icon' },
  { id: 'iconSize.media.controlsCompact', category: 'media', subcategory: 'player', name: 'controlsCompact', primitiveRef: '{iconSize.20}', value: 20, description: 'Compact media controls' },
  
  // ============================================
  // EMPTY - empty states, illustrations
  // ============================================
  { id: 'iconSize.empty.illustration', category: 'empty', subcategory: 'illustration', name: 'illustration', primitiveRef: '{iconSize.96}', value: 96, description: 'Empty state illustration' },
  { id: 'iconSize.empty.illustrationCompact', category: 'empty', subcategory: 'illustration', name: 'illustrationCompact', primitiveRef: '{iconSize.64}', value: 64, description: 'Compact illustration' },
  
  { id: 'iconSize.empty.icon', category: 'empty', subcategory: 'icon', name: 'icon', primitiveRef: '{iconSize.48}', value: 48, description: 'Empty state icon' },
  { id: 'iconSize.empty.iconCompact', category: 'empty', subcategory: 'icon', name: 'iconCompact', primitiveRef: '{iconSize.32}', value: 32, description: 'Compact empty state icon' },
  
  // ============================================
  // MODAL - dialogs, confirmations
  // ============================================
  { id: 'iconSize.modal.close', category: 'modal', subcategory: 'control', name: 'close', primitiveRef: '{iconSize.20}', value: 20, description: 'Modal close icon' },
  { id: 'iconSize.modal.headerIcon', category: 'modal', subcategory: 'header', name: 'headerIcon', primitiveRef: '{iconSize.24}', value: 24, description: 'Modal header icon' },
  { id: 'iconSize.modal.confirmationIcon', category: 'modal', subcategory: 'confirmation', name: 'confirmationIcon', primitiveRef: '{iconSize.48}', value: 48, description: 'Confirmation dialog icon' },
  
  // ============================================
  // CARD - card components
  // ============================================
  { id: 'iconSize.card.headerIcon', category: 'card', subcategory: 'header', name: 'headerIcon', primitiveRef: '{iconSize.24}', value: 24, description: 'Card header icon' },
  { id: 'iconSize.card.action', category: 'card', subcategory: 'action', name: 'action', primitiveRef: '{iconSize.18}', value: 18, description: 'Card action icon' },
  { id: 'iconSize.card.meta', category: 'card', subcategory: 'meta', name: 'meta', primitiveRef: '{iconSize.14}', value: 14, description: 'Card meta icon' },
  { id: 'iconSize.card.feature', category: 'card', subcategory: 'feature', name: 'feature', primitiveRef: '{iconSize.32}', value: 32, description: 'Card feature icon' },
  
  // ============================================
  // LIST - list items
  // ============================================
  { id: 'iconSize.list.itemIcon', category: 'list', subcategory: 'item', name: 'itemIcon', primitiveRef: '{iconSize.20}', value: 20, description: 'List item icon' },
  { id: 'iconSize.list.itemIconCompact', category: 'list', subcategory: 'item', name: 'itemIconCompact', primitiveRef: '{iconSize.16}', value: 16, description: 'Compact list item icon' },
  
  { id: 'iconSize.list.bullet', category: 'list', subcategory: 'bullet', name: 'bullet', primitiveRef: '{iconSize.10}', value: 10, description: 'List bullet' },
  { id: 'iconSize.list.checkbox', category: 'list', subcategory: 'checkbox', name: 'checkbox', primitiveRef: '{iconSize.18}', value: 18, description: 'List checkbox icon' },
  
  { id: 'iconSize.list.dragHandle', category: 'list', subcategory: 'drag', name: 'dragHandle', primitiveRef: '{iconSize.16}', value: 16, description: 'Drag handle icon' },
  { id: 'iconSize.list.expandArrow', category: 'list', subcategory: 'expand', name: 'expandArrow', primitiveRef: '{iconSize.16}', value: 16, description: 'List expand arrow' },
  
  // ============================================
  // ACTION - FAB, context menu, more
  // ============================================
  { id: 'iconSize.action.primary', category: 'action', subcategory: 'primary', name: 'primary', primitiveRef: '{iconSize.20}', value: 20, description: 'Primary action icon' },
  { id: 'iconSize.action.secondary', category: 'action', subcategory: 'secondary', name: 'secondary', primitiveRef: '{iconSize.18}', value: 18, description: 'Secondary action icon' },
  { id: 'iconSize.action.tertiary', category: 'action', subcategory: 'tertiary', name: 'tertiary', primitiveRef: '{iconSize.16}', value: 16, description: 'Tertiary action icon' },
  
  { id: 'iconSize.action.fab', category: 'action', subcategory: 'fab', name: 'fab', primitiveRef: '{iconSize.24}', value: 24, description: 'FAB icon' },
  { id: 'iconSize.action.fabCompact', category: 'action', subcategory: 'fab', name: 'fabCompact', primitiveRef: '{iconSize.20}', value: 20, description: 'Compact FAB icon' },
  
  { id: 'iconSize.action.contextMenu', category: 'action', subcategory: 'context', name: 'contextMenu', primitiveRef: '{iconSize.16}', value: 16, description: 'Context menu icon' },
  { id: 'iconSize.action.more', category: 'action', subcategory: 'more', name: 'more', primitiveRef: '{iconSize.20}', value: 20, description: 'More actions icon' },
  
  // ============================================
  // LOADING - spinners, loaders
  // ============================================
  { id: 'iconSize.loading.spinner', category: 'loading', subcategory: 'spinner', name: 'spinner', primitiveRef: '{iconSize.20}', value: 20, description: 'Default spinner' },
  { id: 'iconSize.loading.spinnerCompact', category: 'loading', subcategory: 'spinner', name: 'spinnerCompact', primitiveRef: '{iconSize.16}', value: 16, description: 'Compact spinner' },
  { id: 'iconSize.loading.spinnerLarge', category: 'loading', subcategory: 'spinner', name: 'spinnerLarge', primitiveRef: '{iconSize.32}', value: 32, description: 'Large spinner' },
  
  { id: 'iconSize.loading.button', category: 'loading', subcategory: 'button', name: 'button', primitiveRef: '{iconSize.16}', value: 16, description: 'Button loading spinner' },
  { id: 'iconSize.loading.page', category: 'loading', subcategory: 'page', name: 'page', primitiveRef: '{iconSize.48}', value: 48, description: 'Page loading spinner' },
  
  // ============================================
  // SPECIAL - logos, social, rating, stepper
  // ============================================
  { id: 'iconSize.special.logo', category: 'special', subcategory: 'logo', name: 'logo', primitiveRef: '{iconSize.32}', value: 32, description: 'Logo icon' },
  { id: 'iconSize.special.logoCompact', category: 'special', subcategory: 'logo', name: 'logoCompact', primitiveRef: '{iconSize.24}', value: 24, description: 'Compact logo' },
  { id: 'iconSize.special.logoLarge', category: 'special', subcategory: 'logo', name: 'logoLarge', primitiveRef: '{iconSize.48}', value: 48, description: 'Large logo' },
  
  { id: 'iconSize.special.social', category: 'special', subcategory: 'social', name: 'social', primitiveRef: '{iconSize.24}', value: 24, description: 'Social icon' },
  { id: 'iconSize.special.socialCompact', category: 'special', subcategory: 'social', name: 'socialCompact', primitiveRef: '{iconSize.20}', value: 20, description: 'Compact social icon' },
  
  { id: 'iconSize.special.rating', category: 'special', subcategory: 'rating', name: 'rating', primitiveRef: '{iconSize.18}', value: 18, description: 'Rating star icon' },
  { id: 'iconSize.special.ratingCompact', category: 'special', subcategory: 'rating', name: 'ratingCompact', primitiveRef: '{iconSize.14}', value: 14, description: 'Compact rating star' },
  
  { id: 'iconSize.special.step', category: 'special', subcategory: 'stepper', name: 'step', primitiveRef: '{iconSize.24}', value: 24, description: 'Stepper icon' },
  { id: 'iconSize.special.stepCompact', category: 'special', subcategory: 'stepper', name: 'stepCompact', primitiveRef: '{iconSize.20}', value: 20, description: 'Compact stepper icon' },
];

// Category labels for UI
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

// Category descriptions
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
