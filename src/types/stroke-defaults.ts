/**
 * Complete Default Stroke Semantic Tokens
 * 
 * COLORS: Reference semantic colors from Tokens collection:
 * Format: {category}/{name}/{name} (e.g., stroke/default/default)
 * 
 * Available stroke colors in Tokens:
 * - stroke/default/default, stroke/default/default-hover
 * - stroke/subtle/subtle
 * - stroke/strong/strong  
 * - stroke/focus/focus
 * - stroke/error/error
 * - stroke/disabled/disabled
 * 
 * Feedback colors:
 * - feedback/success-stroke/success-stroke
 * - feedback/warning-stroke/warning-stroke
 * - feedback/info-stroke/info-stroke
 * - feedback/error-stroke/error-stroke
 */

// Local interface to avoid circular dependency
// This must match StrokeSemanticToken from stroke-tokens.ts
interface StrokeSemanticTokenLocal {
  id: string;
  path: string;
  category: string;
  property: 'width' | 'style' | 'color';
  widthRef?: string;
  styleRef?: string;
  colorRef?: string;
}

// Counter for unique IDs
let idCounter = 1;

function token(path: string, category: string, property: 'width' | 'style' | 'color', ref: string): StrokeSemanticTokenLocal {
  const t: StrokeSemanticTokenLocal = {
    id: `st-${idCounter++}`,
    path,
    category: category as any,
    property,
  };
  if (property === 'width') t.widthRef = ref;
  else if (property === 'style') t.styleRef = ref;
  else if (property === 'color') t.colorRef = ref;
  return t;
}

export const COMPLETE_STROKE_SEMANTIC_TOKENS: StrokeSemanticTokenLocal[] = [
  // ============================================
  // BASE - Базовые стили
  // ============================================
  token('stroke.base.subtle.width', 'base', 'width', '1'),
  token('stroke.base.subtle.style', 'base', 'style', 'solid'),
  token('stroke.base.subtle.color', 'base', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.base.default.width', 'base', 'width', '1'),
  token('stroke.base.default.style', 'base', 'style', 'solid'),
  token('stroke.base.default.color', 'base', 'color', 'stroke/default/default'),
  
  token('stroke.base.strong.width', 'base', 'width', '1'),
  token('stroke.base.strong.style', 'base', 'style', 'solid'),
  token('stroke.base.strong.color', 'base', 'color', 'stroke/strong/strong'),
  
  token('stroke.base.heavy.width', 'base', 'width', '2'),
  token('stroke.base.heavy.style', 'base', 'style', 'solid'),
  token('stroke.base.heavy.color', 'base', 'color', 'stroke/strong/strong'),

  // ============================================
  // BUTTON - Кнопки
  // ============================================
  token('stroke.button.default.width', 'button', 'width', '1'),
  token('stroke.button.default.style', 'button', 'style', 'solid'),
  token('stroke.button.default.color', 'button', 'color', 'stroke/default/default'),
  
  token('stroke.button.hover.width', 'button', 'width', '1'),
  token('stroke.button.hover.style', 'button', 'style', 'solid'),
  token('stroke.button.hover.color', 'button', 'color', 'stroke/default/default-hover'),
  
  token('stroke.button.focus.width', 'button', 'width', '2'),
  token('stroke.button.focus.style', 'button', 'style', 'solid'),
  token('stroke.button.focus.color', 'button', 'color', 'stroke/focus/focus'),
  
  token('stroke.button.active.width', 'button', 'width', '1'),
  token('stroke.button.active.style', 'button', 'style', 'solid'),
  token('stroke.button.active.color', 'button', 'color', 'stroke/strong/strong'),
  
  token('stroke.button.disabled.width', 'button', 'width', '1'),
  token('stroke.button.disabled.style', 'button', 'style', 'solid'),
  token('stroke.button.disabled.color', 'button', 'color', 'stroke/disabled/disabled'),
  
  token('stroke.button.primary.width', 'button', 'width', '0'),
  token('stroke.button.primary.style', 'button', 'style', 'none'),
  token('stroke.button.primary.color', 'button', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.button.outline.width', 'button', 'width', '1'),
  token('stroke.button.outline.style', 'button', 'style', 'solid'),
  token('stroke.button.outline.color', 'button', 'color', 'stroke/focus/focus'),
  
  token('stroke.button.outlineHover.width', 'button', 'width', '1'),
  token('stroke.button.outlineHover.style', 'button', 'style', 'solid'),
  token('stroke.button.outlineHover.color', 'button', 'color', 'stroke/focus/focus'),
  
  token('stroke.button.ghost.width', 'button', 'width', '0'),
  token('stroke.button.ghost.style', 'button', 'style', 'none'),
  token('stroke.button.ghost.color', 'button', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // INPUT - Поля ввода
  // ============================================
  token('stroke.input.default.width', 'input', 'width', '1'),
  token('stroke.input.default.style', 'input', 'style', 'solid'),
  token('stroke.input.default.color', 'input', 'color', 'stroke/default/default'),
  
  token('stroke.input.hover.width', 'input', 'width', '1'),
  token('stroke.input.hover.style', 'input', 'style', 'solid'),
  token('stroke.input.hover.color', 'input', 'color', 'stroke/default/default-hover'),
  
  token('stroke.input.focus.width', 'input', 'width', '2'),
  token('stroke.input.focus.style', 'input', 'style', 'solid'),
  token('stroke.input.focus.color', 'input', 'color', 'stroke/focus/focus'),
  
  token('stroke.input.filled.width', 'input', 'width', '1'),
  token('stroke.input.filled.style', 'input', 'style', 'solid'),
  token('stroke.input.filled.color', 'input', 'color', 'stroke/strong/strong'),
  
  token('stroke.input.disabled.width', 'input', 'width', '1'),
  token('stroke.input.disabled.style', 'input', 'style', 'solid'),
  token('stroke.input.disabled.color', 'input', 'color', 'stroke/disabled/disabled'),
  
  token('stroke.input.readonly.width', 'input', 'width', '1'),
  token('stroke.input.readonly.style', 'input', 'style', 'dashed'),
  token('stroke.input.readonly.color', 'input', 'color', 'stroke/default/default'),
  
  token('stroke.input.error.width', 'input', 'width', '1'),
  token('stroke.input.error.style', 'input', 'style', 'solid'),
  token('stroke.input.error.color', 'input', 'color', 'stroke/error/error'),
  
  token('stroke.input.errorFocus.width', 'input', 'width', '2'),
  token('stroke.input.errorFocus.style', 'input', 'style', 'solid'),
  token('stroke.input.errorFocus.color', 'input', 'color', 'stroke/error/error'),

  // ============================================
  // CHECKBOX
  // ============================================
  token('stroke.checkbox.default.width', 'checkbox', 'width', '1.5'),
  token('stroke.checkbox.default.style', 'checkbox', 'style', 'solid'),
  token('stroke.checkbox.default.color', 'checkbox', 'color', 'stroke/default/default'),
  
  token('stroke.checkbox.hover.width', 'checkbox', 'width', '1.5'),
  token('stroke.checkbox.hover.style', 'checkbox', 'style', 'solid'),
  token('stroke.checkbox.hover.color', 'checkbox', 'color', 'stroke/focus/focus'),
  
  token('stroke.checkbox.checked.width', 'checkbox', 'width', '0'),
  token('stroke.checkbox.checked.style', 'checkbox', 'style', 'none'),
  token('stroke.checkbox.checked.color', 'checkbox', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.checkbox.focus.width', 'checkbox', 'width', '2'),
  token('stroke.checkbox.focus.style', 'checkbox', 'style', 'solid'),
  token('stroke.checkbox.focus.color', 'checkbox', 'color', 'stroke/focus/focus'),
  
  token('stroke.checkbox.error.width', 'checkbox', 'width', '1.5'),
  token('stroke.checkbox.error.style', 'checkbox', 'style', 'solid'),
  token('stroke.checkbox.error.color', 'checkbox', 'color', 'stroke/error/error'),

  // ============================================
  // RADIO
  // ============================================
  token('stroke.radio.default.width', 'radio', 'width', '1.5'),
  token('stroke.radio.default.style', 'radio', 'style', 'solid'),
  token('stroke.radio.default.color', 'radio', 'color', 'stroke/default/default'),
  
  token('stroke.radio.hover.width', 'radio', 'width', '1.5'),
  token('stroke.radio.hover.style', 'radio', 'style', 'solid'),
  token('stroke.radio.hover.color', 'radio', 'color', 'stroke/focus/focus'),
  
  token('stroke.radio.selected.width', 'radio', 'width', '4'),
  token('stroke.radio.selected.style', 'radio', 'style', 'solid'),
  token('stroke.radio.selected.color', 'radio', 'color', 'stroke/focus/focus'),

  // ============================================
  // SWITCH
  // ============================================
  token('stroke.switch.track.width', 'switch', 'width', '1'),
  token('stroke.switch.track.style', 'switch', 'style', 'solid'),
  token('stroke.switch.track.color', 'switch', 'color', 'stroke/default/default'),
  
  token('stroke.switch.trackActive.width', 'switch', 'width', '0'),
  token('stroke.switch.trackActive.style', 'switch', 'style', 'none'),
  token('stroke.switch.trackActive.color', 'switch', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.switch.thumb.width', 'switch', 'width', '0'),
  token('stroke.switch.thumb.style', 'switch', 'style', 'none'),
  token('stroke.switch.thumb.color', 'switch', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // TEXTAREA
  // ============================================
  token('stroke.textarea.default.width', 'textarea', 'width', '1'),
  token('stroke.textarea.default.style', 'textarea', 'style', 'solid'),
  token('stroke.textarea.default.color', 'textarea', 'color', 'stroke/default/default'),
  
  token('stroke.textarea.focus.width', 'textarea', 'width', '2'),
  token('stroke.textarea.focus.style', 'textarea', 'style', 'solid'),
  token('stroke.textarea.focus.color', 'textarea', 'color', 'stroke/focus/focus'),

  // ============================================
  // SELECT
  // ============================================
  token('stroke.select.default.width', 'select', 'width', '1'),
  token('stroke.select.default.style', 'select', 'style', 'solid'),
  token('stroke.select.default.color', 'select', 'color', 'stroke/default/default'),
  
  token('stroke.select.open.width', 'select', 'width', '2'),
  token('stroke.select.open.style', 'select', 'style', 'solid'),
  token('stroke.select.open.color', 'select', 'color', 'stroke/focus/focus'),

  // ============================================
  // CARD
  // ============================================
  token('stroke.card.default.width', 'card', 'width', '1'),
  token('stroke.card.default.style', 'card', 'style', 'solid'),
  token('stroke.card.default.color', 'card', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.card.hover.width', 'card', 'width', '1'),
  token('stroke.card.hover.style', 'card', 'style', 'solid'),
  token('stroke.card.hover.color', 'card', 'color', 'stroke/default/default'),
  
  token('stroke.card.selected.width', 'card', 'width', '2'),
  token('stroke.card.selected.style', 'card', 'style', 'solid'),
  token('stroke.card.selected.color', 'card', 'color', 'stroke/focus/focus'),
  
  token('stroke.card.interactive.width', 'card', 'width', '1'),
  token('stroke.card.interactive.style', 'card', 'style', 'solid'),
  token('stroke.card.interactive.color', 'card', 'color', 'stroke/default/default'),

  // ============================================
  // MODAL
  // ============================================
  token('stroke.modal.container.width', 'modal', 'width', '0'),
  token('stroke.modal.container.style', 'modal', 'style', 'none'),
  token('stroke.modal.container.color', 'modal', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.modal.header.width', 'modal', 'width', '1'),
  token('stroke.modal.header.style', 'modal', 'style', 'solid'),
  token('stroke.modal.header.color', 'modal', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.modal.footer.width', 'modal', 'width', '1'),
  token('stroke.modal.footer.style', 'modal', 'style', 'solid'),
  token('stroke.modal.footer.color', 'modal', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // DROPDOWN
  // ============================================
  token('stroke.dropdown.container.width', 'dropdown', 'width', '1'),
  token('stroke.dropdown.container.style', 'dropdown', 'style', 'solid'),
  token('stroke.dropdown.container.color', 'dropdown', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.dropdown.item.width', 'dropdown', 'width', '0'),
  token('stroke.dropdown.item.style', 'dropdown', 'style', 'none'),
  token('stroke.dropdown.item.color', 'dropdown', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.dropdown.separator.width', 'dropdown', 'width', '1'),
  token('stroke.dropdown.separator.style', 'dropdown', 'style', 'solid'),
  token('stroke.dropdown.separator.color', 'dropdown', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // TOOLTIP
  // ============================================
  token('stroke.tooltip.default.width', 'tooltip', 'width', '0'),
  token('stroke.tooltip.default.style', 'tooltip', 'style', 'none'),
  token('stroke.tooltip.default.color', 'tooltip', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // POPOVER
  // ============================================
  token('stroke.popover.container.width', 'popover', 'width', '1'),
  token('stroke.popover.container.style', 'popover', 'style', 'solid'),
  token('stroke.popover.container.color', 'popover', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // ALERT
  // ============================================
  token('stroke.alert.info.width', 'alert', 'width', '1'),
  token('stroke.alert.info.style', 'alert', 'style', 'solid'),
  token('stroke.alert.info.color', 'alert', 'color', 'feedback/info-stroke/info-stroke'),
  
  token('stroke.alert.success.width', 'alert', 'width', '1'),
  token('stroke.alert.success.style', 'alert', 'style', 'solid'),
  token('stroke.alert.success.color', 'alert', 'color', 'feedback/success-stroke/success-stroke'),
  
  token('stroke.alert.warning.width', 'alert', 'width', '1'),
  token('stroke.alert.warning.style', 'alert', 'style', 'solid'),
  token('stroke.alert.warning.color', 'alert', 'color', 'feedback/warning-stroke/warning-stroke'),
  
  token('stroke.alert.error.width', 'alert', 'width', '1'),
  token('stroke.alert.error.style', 'alert', 'style', 'solid'),
  token('stroke.alert.error.color', 'alert', 'color', 'feedback/error-stroke/error-stroke'),

  // ============================================
  // BADGE
  // ============================================
  token('stroke.badge.default.width', 'badge', 'width', '0'),
  token('stroke.badge.default.style', 'badge', 'style', 'none'),
  token('stroke.badge.default.color', 'badge', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.badge.outline.width', 'badge', 'width', '1'),
  token('stroke.badge.outline.style', 'badge', 'style', 'solid'),
  token('stroke.badge.outline.color', 'badge', 'color', 'stroke/default/default'),

  // ============================================
  // TAG
  // ============================================
  token('stroke.tag.default.width', 'tag', 'width', '1'),
  token('stroke.tag.default.style', 'tag', 'style', 'solid'),
  token('stroke.tag.default.color', 'tag', 'color', 'stroke/default/default'),
  
  token('stroke.tag.interactive.width', 'tag', 'width', '1'),
  token('stroke.tag.interactive.style', 'tag', 'style', 'solid'),
  token('stroke.tag.interactive.color', 'tag', 'color', 'stroke/focus/focus'),

  // ============================================
  // CHIP
  // ============================================
  token('stroke.chip.default.width', 'chip', 'width', '1'),
  token('stroke.chip.default.style', 'chip', 'style', 'solid'),
  token('stroke.chip.default.color', 'chip', 'color', 'stroke/default/default'),
  
  token('stroke.chip.selected.width', 'chip', 'width', '1'),
  token('stroke.chip.selected.style', 'chip', 'style', 'solid'),
  token('stroke.chip.selected.color', 'chip', 'color', 'stroke/focus/focus'),
  
  token('stroke.chip.deletable.width', 'chip', 'width', '1'),
  token('stroke.chip.deletable.style', 'chip', 'style', 'solid'),
  token('stroke.chip.deletable.color', 'chip', 'color', 'stroke/default/default'),

  // ============================================
  // AVATAR
  // ============================================
  token('stroke.avatar.default.width', 'avatar', 'width', '0'),
  token('stroke.avatar.default.style', 'avatar', 'style', 'none'),
  token('stroke.avatar.default.color', 'avatar', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.avatar.ring.width', 'avatar', 'width', '2'),
  token('stroke.avatar.ring.style', 'avatar', 'style', 'solid'),
  token('stroke.avatar.ring.color', 'avatar', 'color', 'stroke/focus/focus'),
  
  token('stroke.avatar.group.width', 'avatar', 'width', '2'),
  token('stroke.avatar.group.style', 'avatar', 'style', 'solid'),
  token('stroke.avatar.group.color', 'avatar', 'color', 'bg/page/page-primary'),

  // ============================================
  // TABLE
  // ============================================
  token('stroke.table.container.width', 'table', 'width', '1'),
  token('stroke.table.container.style', 'table', 'style', 'solid'),
  token('stroke.table.container.color', 'table', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.table.row.width', 'table', 'width', '1'),
  token('stroke.table.row.style', 'table', 'style', 'solid'),
  token('stroke.table.row.color', 'table', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.table.cell.width', 'table', 'width', '1'),
  token('stroke.table.cell.style', 'table', 'style', 'solid'),
  token('stroke.table.cell.color', 'table', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.table.header.width', 'table', 'width', '1'),
  token('stroke.table.header.style', 'table', 'style', 'solid'),
  token('stroke.table.header.color', 'table', 'color', 'stroke/default/default'),

  // ============================================
  // LIST
  // ============================================
  token('stroke.list.container.width', 'list', 'width', '0'),
  token('stroke.list.container.style', 'list', 'style', 'none'),
  token('stroke.list.container.color', 'list', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.list.item.width', 'list', 'width', '0'),
  token('stroke.list.item.style', 'list', 'style', 'none'),
  token('stroke.list.item.color', 'list', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.list.divider.width', 'list', 'width', '1'),
  token('stroke.list.divider.style', 'list', 'style', 'solid'),
  token('stroke.list.divider.color', 'list', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // MENU
  // ============================================
  token('stroke.menu.container.width', 'menu', 'width', '1'),
  token('stroke.menu.container.style', 'menu', 'style', 'solid'),
  token('stroke.menu.container.color', 'menu', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.menu.item.width', 'menu', 'width', '0'),
  token('stroke.menu.item.style', 'menu', 'style', 'none'),
  token('stroke.menu.item.color', 'menu', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.menu.separator.width', 'menu', 'width', '1'),
  token('stroke.menu.separator.style', 'menu', 'style', 'solid'),
  token('stroke.menu.separator.color', 'menu', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // TABS
  // ============================================
  token('stroke.tabs.container.width', 'tabs', 'width', '1'),
  token('stroke.tabs.container.style', 'tabs', 'style', 'solid'),
  token('stroke.tabs.container.color', 'tabs', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.tabs.item.width', 'tabs', 'width', '0'),
  token('stroke.tabs.item.style', 'tabs', 'style', 'none'),
  token('stroke.tabs.item.color', 'tabs', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.tabs.active.width', 'tabs', 'width', '2'),
  token('stroke.tabs.active.style', 'tabs', 'style', 'solid'),
  token('stroke.tabs.active.color', 'tabs', 'color', 'stroke/focus/focus'),
  
  token('stroke.tabs.indicator.width', 'tabs', 'width', '2'),
  token('stroke.tabs.indicator.style', 'tabs', 'style', 'solid'),
  token('stroke.tabs.indicator.color', 'tabs', 'color', 'stroke/focus/focus'),

  // ============================================
  // NAVIGATION
  // ============================================
  token('stroke.navigation.container.width', 'navigation', 'width', '0'),
  token('stroke.navigation.container.style', 'navigation', 'style', 'none'),
  token('stroke.navigation.container.color', 'navigation', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.navigation.item.width', 'navigation', 'width', '0'),
  token('stroke.navigation.item.style', 'navigation', 'style', 'none'),
  token('stroke.navigation.item.color', 'navigation', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.navigation.active.width', 'navigation', 'width', '2'),
  token('stroke.navigation.active.style', 'navigation', 'style', 'solid'),
  token('stroke.navigation.active.color', 'navigation', 'color', 'stroke/focus/focus'),
  
  token('stroke.navigation.separator.width', 'navigation', 'width', '1'),
  token('stroke.navigation.separator.style', 'navigation', 'style', 'solid'),
  token('stroke.navigation.separator.color', 'navigation', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // BREADCRUMB
  // ============================================
  token('stroke.breadcrumb.separator.width', 'breadcrumb', 'width', '0'),
  token('stroke.breadcrumb.separator.style', 'breadcrumb', 'style', 'none'),
  token('stroke.breadcrumb.separator.color', 'breadcrumb', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // PAGINATION
  // ============================================
  token('stroke.pagination.default.width', 'pagination', 'width', '1'),
  token('stroke.pagination.default.style', 'pagination', 'style', 'solid'),
  token('stroke.pagination.default.color', 'pagination', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.pagination.active.width', 'pagination', 'width', '1'),
  token('stroke.pagination.active.style', 'pagination', 'style', 'solid'),
  token('stroke.pagination.active.color', 'pagination', 'color', 'stroke/focus/focus'),
  
  token('stroke.pagination.disabled.width', 'pagination', 'width', '1'),
  token('stroke.pagination.disabled.style', 'pagination', 'style', 'solid'),
  token('stroke.pagination.disabled.color', 'pagination', 'color', 'stroke/disabled/disabled'),

  // ============================================
  // PROGRESS
  // ============================================
  token('stroke.progress.track.width', 'progress', 'width', '0'),
  token('stroke.progress.track.style', 'progress', 'style', 'none'),
  token('stroke.progress.track.color', 'progress', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.progress.indicator.width', 'progress', 'width', '0'),
  token('stroke.progress.indicator.style', 'progress', 'style', 'none'),
  token('stroke.progress.indicator.color', 'progress', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // SLIDER
  // ============================================
  token('stroke.slider.track.width', 'slider', 'width', '0'),
  token('stroke.slider.track.style', 'slider', 'style', 'none'),
  token('stroke.slider.track.color', 'slider', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.slider.thumb.width', 'slider', 'width', '2'),
  token('stroke.slider.thumb.style', 'slider', 'style', 'solid'),
  token('stroke.slider.thumb.color', 'slider', 'color', 'stroke/focus/focus'),
  
  token('stroke.slider.thumbHover.width', 'slider', 'width', '2'),
  token('stroke.slider.thumbHover.style', 'slider', 'style', 'solid'),
  token('stroke.slider.thumbHover.color', 'slider', 'color', 'stroke/focus/focus'),
  
  token('stroke.slider.thumbActive.width', 'slider', 'width', '3'),
  token('stroke.slider.thumbActive.style', 'slider', 'style', 'solid'),
  token('stroke.slider.thumbActive.color', 'slider', 'color', 'stroke/focus/focus'),

  // ============================================
  // STEPPER
  // ============================================
  token('stroke.stepper.default.width', 'stepper', 'width', '2'),
  token('stroke.stepper.default.style', 'stepper', 'style', 'solid'),
  token('stroke.stepper.default.color', 'stepper', 'color', 'stroke/default/default'),
  
  token('stroke.stepper.active.width', 'stepper', 'width', '2'),
  token('stroke.stepper.active.style', 'stepper', 'style', 'solid'),
  token('stroke.stepper.active.color', 'stepper', 'color', 'stroke/focus/focus'),
  
  token('stroke.stepper.completed.width', 'stepper', 'width', '0'),
  token('stroke.stepper.completed.style', 'stepper', 'style', 'none'),
  token('stroke.stepper.completed.color', 'stepper', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.stepper.connector.width', 'stepper', 'width', '1'),
  token('stroke.stepper.connector.style', 'stepper', 'style', 'solid'),
  token('stroke.stepper.connector.color', 'stepper', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // ACCORDION
  // ============================================
  token('stroke.accordion.container.width', 'accordion', 'width', '1'),
  token('stroke.accordion.container.style', 'accordion', 'style', 'solid'),
  token('stroke.accordion.container.color', 'accordion', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.accordion.header.width', 'accordion', 'width', '0'),
  token('stroke.accordion.header.style', 'accordion', 'style', 'none'),
  token('stroke.accordion.header.color', 'accordion', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.accordion.divider.width', 'accordion', 'width', '1'),
  token('stroke.accordion.divider.style', 'accordion', 'style', 'solid'),
  token('stroke.accordion.divider.color', 'accordion', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // DIVIDER - Разделители
  // ============================================
  token('stroke.divider.default.width', 'divider', 'width', '1'),
  token('stroke.divider.default.style', 'divider', 'style', 'solid'),
  token('stroke.divider.default.color', 'divider', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.divider.strong.width', 'divider', 'width', '2'),
  token('stroke.divider.strong.style', 'divider', 'style', 'solid'),
  token('stroke.divider.strong.color', 'divider', 'color', 'stroke/default/default'),
  
  token('stroke.divider.subtle.width', 'divider', 'width', '1'),
  token('stroke.divider.subtle.style', 'divider', 'style', 'solid'),
  token('stroke.divider.subtle.color', 'divider', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.divider.decorative.width', 'divider', 'width', '1'),
  token('stroke.divider.decorative.style', 'divider', 'style', 'dashed'),
  token('stroke.divider.decorative.color', 'divider', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.divider.vertical.width', 'divider', 'width', '1'),
  token('stroke.divider.vertical.style', 'divider', 'style', 'solid'),
  token('stroke.divider.vertical.color', 'divider', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.divider.section.width', 'divider', 'width', '1'),
  token('stroke.divider.section.style', 'divider', 'style', 'solid'),
  token('stroke.divider.section.color', 'divider', 'color', 'stroke/default/default'),

  // ============================================
  // SEPARATOR
  // ============================================
  token('stroke.separator.default.width', 'separator', 'width', '1'),
  token('stroke.separator.default.style', 'separator', 'style', 'solid'),
  token('stroke.separator.default.color', 'separator', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // SKELETON
  // ============================================
  token('stroke.skeleton.default.width', 'skeleton', 'width', '0'),
  token('stroke.skeleton.default.style', 'skeleton', 'style', 'none'),
  token('stroke.skeleton.default.color', 'skeleton', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // IMAGE
  // ============================================
  token('stroke.image.default.width', 'image', 'width', '0'),
  token('stroke.image.default.style', 'image', 'style', 'none'),
  token('stroke.image.default.color', 'image', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.image.hover.width', 'image', 'width', '2'),
  token('stroke.image.hover.style', 'image', 'style', 'solid'),
  token('stroke.image.hover.color', 'image', 'color', 'stroke/focus/focus'),
  
  token('stroke.image.placeholder.width', 'image', 'width', '1'),
  token('stroke.image.placeholder.style', 'image', 'style', 'dashed'),
  token('stroke.image.placeholder.color', 'image', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // VIDEO
  // ============================================
  token('stroke.video.controls.width', 'video', 'width', '0'),
  token('stroke.video.controls.style', 'video', 'style', 'none'),
  token('stroke.video.controls.color', 'video', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // CODE
  // ============================================
  token('stroke.code.block.width', 'code', 'width', '1'),
  token('stroke.code.block.style', 'code', 'style', 'solid'),
  token('stroke.code.block.color', 'code', 'color', 'stroke/subtle/subtle'),
  
  token('stroke.code.inline.width', 'code', 'width', '0'),
  token('stroke.code.inline.style', 'code', 'style', 'none'),
  token('stroke.code.inline.color', 'code', 'color', 'stroke/subtle/subtle'),

  // ============================================
  // ACCENT - Акцентные цвета
  // ============================================
  token('stroke.accent.brand.width', 'accent', 'width', '2'),
  token('stroke.accent.brand.style', 'accent', 'style', 'solid'),
  token('stroke.accent.brand.color', 'accent', 'color', 'stroke/focus/focus'),
  
  token('stroke.accent.primary.width', 'accent', 'width', '2'),
  token('stroke.accent.primary.style', 'accent', 'style', 'solid'),
  token('stroke.accent.primary.color', 'accent', 'color', 'stroke/focus/focus'),
  
  token('stroke.accent.secondary.width', 'accent', 'width', '1'),
  token('stroke.accent.secondary.style', 'accent', 'style', 'solid'),
  token('stroke.accent.secondary.color', 'accent', 'color', 'stroke/default/default'),
  
  token('stroke.accent.success.width', 'accent', 'width', '2'),
  token('stroke.accent.success.style', 'accent', 'style', 'solid'),
  token('stroke.accent.success.color', 'accent', 'color', 'feedback/success-stroke/success-stroke'),
  
  token('stroke.accent.warning.width', 'accent', 'width', '2'),
  token('stroke.accent.warning.style', 'accent', 'style', 'solid'),
  token('stroke.accent.warning.color', 'accent', 'color', 'feedback/warning-stroke/warning-stroke'),
  
  token('stroke.accent.error.width', 'accent', 'width', '2'),
  token('stroke.accent.error.style', 'accent', 'style', 'solid'),
  token('stroke.accent.error.color', 'accent', 'color', 'feedback/error-stroke/error-stroke'),

  // ============================================
  // INTERACTIVE - Интерактивные состояния
  // ============================================
  token('stroke.interactive.default.width', 'interactive', 'width', '1'),
  token('stroke.interactive.default.style', 'interactive', 'style', 'solid'),
  token('stroke.interactive.default.color', 'interactive', 'color', 'stroke/default/default'),
  
  token('stroke.interactive.hover.width', 'interactive', 'width', '1'),
  token('stroke.interactive.hover.style', 'interactive', 'style', 'solid'),
  token('stroke.interactive.hover.color', 'interactive', 'color', 'stroke/default/default-hover'),
  
  token('stroke.interactive.active.width', 'interactive', 'width', '2'),
  token('stroke.interactive.active.style', 'interactive', 'style', 'solid'),
  token('stroke.interactive.active.color', 'interactive', 'color', 'stroke/focus/focus'),
  
  token('stroke.interactive.focus.width', 'interactive', 'width', '2'),
  token('stroke.interactive.focus.style', 'interactive', 'style', 'solid'),
  token('stroke.interactive.focus.color', 'interactive', 'color', 'stroke/focus/focus'),
];
