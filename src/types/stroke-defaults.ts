/**
 * Complete Default Stroke Semantic Tokens
 * All tokens from the specification
 */

import { StrokeSemanticToken } from './stroke-tokens';

// Counter for unique IDs
let idCounter = 1;

function token(path: string, category: string, property: 'width' | 'style' | 'color', ref: string): StrokeSemanticToken {
  const t: StrokeSemanticToken = {
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

export const COMPLETE_STROKE_SEMANTIC_TOKENS: StrokeSemanticToken[] = [
  // ============================================
  // BASE - Базовые стили
  // ============================================
  token('stroke.base.subtle.width', 'base', 'width', '1'),
  token('stroke.base.subtle.style', 'base', 'style', 'solid'),
  token('stroke.base.subtle.color', 'base', 'color', 'neutral.200'),
  
  token('stroke.base.default.width', 'base', 'width', '1'),
  token('stroke.base.default.style', 'base', 'style', 'solid'),
  token('stroke.base.default.color', 'base', 'color', 'neutral.300'),
  
  token('stroke.base.strong.width', 'base', 'width', '1'),
  token('stroke.base.strong.style', 'base', 'style', 'solid'),
  token('stroke.base.strong.color', 'base', 'color', 'neutral.400'),
  
  token('stroke.base.heavy.width', 'base', 'width', '2'),
  token('stroke.base.heavy.style', 'base', 'style', 'solid'),
  token('stroke.base.heavy.color', 'base', 'color', 'neutral.400'),

  // ============================================
  // BUTTON - Кнопки
  // ============================================
  token('stroke.button.default.width', 'button', 'width', '1'),
  token('stroke.button.default.style', 'button', 'style', 'solid'),
  token('stroke.button.default.color', 'button', 'color', 'neutral.300'),
  
  token('stroke.button.hover.width', 'button', 'width', '1'),
  token('stroke.button.hover.style', 'button', 'style', 'solid'),
  token('stroke.button.hover.color', 'button', 'color', 'neutral.400'),
  
  token('stroke.button.focus.width', 'button', 'width', '2'),
  token('stroke.button.focus.style', 'button', 'style', 'solid'),
  token('stroke.button.focus.color', 'button', 'color', 'brand.500'),
  
  token('stroke.button.active.width', 'button', 'width', '1'),
  token('stroke.button.active.style', 'button', 'style', 'solid'),
  token('stroke.button.active.color', 'button', 'color', 'neutral.500'),
  
  token('stroke.button.disabled.width', 'button', 'width', '1'),
  token('stroke.button.disabled.style', 'button', 'style', 'solid'),
  token('stroke.button.disabled.color', 'button', 'color', 'neutral.200'),
  
  token('stroke.button.primary.width', 'button', 'width', '0'),
  token('stroke.button.primary.style', 'button', 'style', 'none'),
  token('stroke.button.primary.color', 'button', 'color', 'transparent'),
  
  token('stroke.button.outline.width', 'button', 'width', '1'),
  token('stroke.button.outline.style', 'button', 'style', 'solid'),
  token('stroke.button.outline.color', 'button', 'color', 'brand.500'),
  
  token('stroke.button.outlineHover.width', 'button', 'width', '1'),
  token('stroke.button.outlineHover.style', 'button', 'style', 'solid'),
  token('stroke.button.outlineHover.color', 'button', 'color', 'brand.600'),
  
  token('stroke.button.ghost.width', 'button', 'width', '0'),
  token('stroke.button.ghost.style', 'button', 'style', 'none'),
  token('stroke.button.ghost.color', 'button', 'color', 'transparent'),

  // ============================================
  // INPUT - Поля ввода
  // ============================================
  token('stroke.input.default.width', 'input', 'width', '1'),
  token('stroke.input.default.style', 'input', 'style', 'solid'),
  token('stroke.input.default.color', 'input', 'color', 'neutral.300'),
  
  token('stroke.input.hover.width', 'input', 'width', '1'),
  token('stroke.input.hover.style', 'input', 'style', 'solid'),
  token('stroke.input.hover.color', 'input', 'color', 'neutral.400'),
  
  token('stroke.input.focus.width', 'input', 'width', '2'),
  token('stroke.input.focus.style', 'input', 'style', 'solid'),
  token('stroke.input.focus.color', 'input', 'color', 'brand.500'),
  
  token('stroke.input.filled.width', 'input', 'width', '1'),
  token('stroke.input.filled.style', 'input', 'style', 'solid'),
  token('stroke.input.filled.color', 'input', 'color', 'neutral.400'),
  
  token('stroke.input.disabled.width', 'input', 'width', '1'),
  token('stroke.input.disabled.style', 'input', 'style', 'solid'),
  token('stroke.input.disabled.color', 'input', 'color', 'neutral.200'),
  
  token('stroke.input.readonly.width', 'input', 'width', '1'),
  token('stroke.input.readonly.style', 'input', 'style', 'dashed'),
  token('stroke.input.readonly.color', 'input', 'color', 'neutral.300'),
  
  token('stroke.input.error.width', 'input', 'width', '1'),
  token('stroke.input.error.style', 'input', 'style', 'solid'),
  token('stroke.input.error.color', 'input', 'color', 'error.500'),
  
  token('stroke.input.errorFocus.width', 'input', 'width', '2'),
  token('stroke.input.errorFocus.style', 'input', 'style', 'solid'),
  token('stroke.input.errorFocus.color', 'input', 'color', 'error.500'),
  
  token('stroke.input.warning.width', 'input', 'width', '1'),
  token('stroke.input.warning.style', 'input', 'style', 'solid'),
  token('stroke.input.warning.color', 'input', 'color', 'warning.500'),
  
  token('stroke.input.success.width', 'input', 'width', '1'),
  token('stroke.input.success.style', 'input', 'style', 'solid'),
  token('stroke.input.success.color', 'input', 'color', 'success.500'),

  // ============================================
  // CHECKBOX
  // ============================================
  token('stroke.checkbox.default.width', 'checkbox', 'width', '1.5'),
  token('stroke.checkbox.default.style', 'checkbox', 'style', 'solid'),
  token('stroke.checkbox.default.color', 'checkbox', 'color', 'neutral.400'),
  
  token('stroke.checkbox.hover.width', 'checkbox', 'width', '1.5'),
  token('stroke.checkbox.hover.style', 'checkbox', 'style', 'solid'),
  token('stroke.checkbox.hover.color', 'checkbox', 'color', 'brand.500'),
  
  token('stroke.checkbox.checked.width', 'checkbox', 'width', '0'),
  token('stroke.checkbox.checked.style', 'checkbox', 'style', 'none'),
  token('stroke.checkbox.checked.color', 'checkbox', 'color', 'transparent'),
  
  token('stroke.checkbox.focus.width', 'checkbox', 'width', '2'),
  token('stroke.checkbox.focus.style', 'checkbox', 'style', 'solid'),
  token('stroke.checkbox.focus.color', 'checkbox', 'color', 'brand.500'),
  
  token('stroke.checkbox.error.width', 'checkbox', 'width', '1.5'),
  token('stroke.checkbox.error.style', 'checkbox', 'style', 'solid'),
  token('stroke.checkbox.error.color', 'checkbox', 'color', 'error.500'),

  // ============================================
  // RADIO
  // ============================================
  token('stroke.radio.default.width', 'radio', 'width', '1.5'),
  token('stroke.radio.default.style', 'radio', 'style', 'solid'),
  token('stroke.radio.default.color', 'radio', 'color', 'neutral.400'),
  
  token('stroke.radio.hover.width', 'radio', 'width', '1.5'),
  token('stroke.radio.hover.style', 'radio', 'style', 'solid'),
  token('stroke.radio.hover.color', 'radio', 'color', 'brand.500'),
  
  token('stroke.radio.selected.width', 'radio', 'width', '4'),
  token('stroke.radio.selected.style', 'radio', 'style', 'solid'),
  token('stroke.radio.selected.color', 'radio', 'color', 'brand.500'),

  // ============================================
  // SWITCH
  // ============================================
  token('stroke.switch.track.width', 'switch', 'width', '1'),
  token('stroke.switch.track.style', 'switch', 'style', 'solid'),
  token('stroke.switch.track.color', 'switch', 'color', 'neutral.300'),
  
  token('stroke.switch.trackActive.width', 'switch', 'width', '0'),
  token('stroke.switch.trackActive.style', 'switch', 'style', 'none'),
  token('stroke.switch.trackActive.color', 'switch', 'color', 'transparent'),
  
  token('stroke.switch.thumb.width', 'switch', 'width', '0'),
  token('stroke.switch.thumb.style', 'switch', 'style', 'none'),
  token('stroke.switch.thumb.color', 'switch', 'color', 'transparent'),

  // ============================================
  // TEXTAREA
  // ============================================
  token('stroke.textarea.default.width', 'textarea', 'width', '1'),
  token('stroke.textarea.default.style', 'textarea', 'style', 'solid'),
  token('stroke.textarea.default.color', 'textarea', 'color', 'neutral.300'),
  
  token('stroke.textarea.focus.width', 'textarea', 'width', '2'),
  token('stroke.textarea.focus.style', 'textarea', 'style', 'solid'),
  token('stroke.textarea.focus.color', 'textarea', 'color', 'brand.500'),

  // ============================================
  // SELECT
  // ============================================
  token('stroke.select.default.width', 'select', 'width', '1'),
  token('stroke.select.default.style', 'select', 'style', 'solid'),
  token('stroke.select.default.color', 'select', 'color', 'neutral.300'),
  
  token('stroke.select.open.width', 'select', 'width', '2'),
  token('stroke.select.open.style', 'select', 'style', 'solid'),
  token('stroke.select.open.color', 'select', 'color', 'brand.500'),

  // ============================================
  // FILE UPLOAD
  // ============================================
  token('stroke.fileUpload.zone.width', 'fileUpload', 'width', '2'),
  token('stroke.fileUpload.zone.style', 'fileUpload', 'style', 'dashed'),
  token('stroke.fileUpload.zone.color', 'fileUpload', 'color', 'neutral.300'),
  
  token('stroke.fileUpload.zoneHover.width', 'fileUpload', 'width', '2'),
  token('stroke.fileUpload.zoneHover.style', 'fileUpload', 'style', 'dashed'),
  token('stroke.fileUpload.zoneHover.color', 'fileUpload', 'color', 'brand.500'),
  
  token('stroke.fileUpload.zoneDragOver.width', 'fileUpload', 'width', '2'),
  token('stroke.fileUpload.zoneDragOver.style', 'fileUpload', 'style', 'solid'),
  token('stroke.fileUpload.zoneDragOver.color', 'fileUpload', 'color', 'brand.500'),
  
  token('stroke.fileUpload.zoneError.width', 'fileUpload', 'width', '2'),
  token('stroke.fileUpload.zoneError.style', 'fileUpload', 'style', 'dashed'),
  token('stroke.fileUpload.zoneError.color', 'fileUpload', 'color', 'error.500'),

  // ============================================
  // CARD
  // ============================================
  token('stroke.card.default.width', 'card', 'width', '1'),
  token('stroke.card.default.style', 'card', 'style', 'solid'),
  token('stroke.card.default.color', 'card', 'color', 'neutral.200'),
  
  token('stroke.card.hover.width', 'card', 'width', '1'),
  token('stroke.card.hover.style', 'card', 'style', 'solid'),
  token('stroke.card.hover.color', 'card', 'color', 'neutral.300'),
  
  token('stroke.card.selected.width', 'card', 'width', '2'),
  token('stroke.card.selected.style', 'card', 'style', 'solid'),
  token('stroke.card.selected.color', 'card', 'color', 'brand.500'),
  
  token('stroke.card.interactive.width', 'card', 'width', '1'),
  token('stroke.card.interactive.style', 'card', 'style', 'solid'),
  token('stroke.card.interactive.color', 'card', 'color', 'neutral.300'),
  
  token('stroke.card.outlined.width', 'card', 'width', '1'),
  token('stroke.card.outlined.style', 'card', 'style', 'solid'),
  token('stroke.card.outlined.color', 'card', 'color', 'neutral.300'),
  
  token('stroke.card.elevated.width', 'card', 'width', '0'),
  token('stroke.card.elevated.style', 'card', 'style', 'none'),
  token('stroke.card.elevated.color', 'card', 'color', 'transparent'),

  // ============================================
  // MODAL
  // ============================================
  token('stroke.modal.container.width', 'modal', 'width', '0'),
  token('stroke.modal.container.style', 'modal', 'style', 'none'),
  token('stroke.modal.container.color', 'modal', 'color', 'transparent'),
  
  token('stroke.modal.header.width', 'modal', 'width', '1'),
  token('stroke.modal.header.style', 'modal', 'style', 'solid'),
  token('stroke.modal.header.color', 'modal', 'color', 'neutral.200'),
  
  token('stroke.modal.footer.width', 'modal', 'width', '1'),
  token('stroke.modal.footer.style', 'modal', 'style', 'solid'),
  token('stroke.modal.footer.color', 'modal', 'color', 'neutral.200'),

  // ============================================
  // DROPDOWN / POPOVER / TOOLTIP
  // ============================================
  token('stroke.dropdown.container.width', 'dropdown', 'width', '1'),
  token('stroke.dropdown.container.style', 'dropdown', 'style', 'solid'),
  token('stroke.dropdown.container.color', 'dropdown', 'color', 'neutral.200'),
  
  token('stroke.popover.container.width', 'popover', 'width', '1'),
  token('stroke.popover.container.style', 'popover', 'style', 'solid'),
  token('stroke.popover.container.color', 'popover', 'color', 'neutral.200'),
  
  token('stroke.tooltip.container.width', 'tooltip', 'width', '0'),
  token('stroke.tooltip.container.style', 'tooltip', 'style', 'none'),
  token('stroke.tooltip.container.color', 'tooltip', 'color', 'transparent'),

  // ============================================
  // PANEL / SECTION / WELL
  // ============================================
  token('stroke.panel.default.width', 'panel', 'width', '1'),
  token('stroke.panel.default.style', 'panel', 'style', 'solid'),
  token('stroke.panel.default.color', 'panel', 'color', 'neutral.200'),
  
  token('stroke.section.default.width', 'section', 'width', '1'),
  token('stroke.section.default.style', 'section', 'style', 'solid'),
  token('stroke.section.default.color', 'section', 'color', 'neutral.200'),
  
  token('stroke.well.default.width', 'well', 'width', '1'),
  token('stroke.well.default.style', 'well', 'style', 'solid'),
  token('stroke.well.default.color', 'well', 'color', 'neutral.200'),

  // ============================================
  // TAB
  // ============================================
  token('stroke.tab.default.width', 'tab', 'width', '0'),
  token('stroke.tab.default.style', 'tab', 'style', 'none'),
  token('stroke.tab.default.color', 'tab', 'color', 'transparent'),
  
  token('stroke.tab.active.width', 'tab', 'width', '2'),
  token('stroke.tab.active.style', 'tab', 'style', 'solid'),
  token('stroke.tab.active.color', 'tab', 'color', 'brand.500'),
  
  token('stroke.tab.hover.width', 'tab', 'width', '2'),
  token('stroke.tab.hover.style', 'tab', 'style', 'solid'),
  token('stroke.tab.hover.color', 'tab', 'color', 'neutral.300'),
  
  token('stroke.tab.container.width', 'tab', 'width', '1'),
  token('stroke.tab.container.style', 'tab', 'style', 'solid'),
  token('stroke.tab.container.color', 'tab', 'color', 'neutral.200'),

  // ============================================
  // MENU
  // ============================================
  token('stroke.menu.item.width', 'menu', 'width', '0'),
  token('stroke.menu.item.style', 'menu', 'style', 'none'),
  token('stroke.menu.item.color', 'menu', 'color', 'transparent'),
  
  token('stroke.menu.container.width', 'menu', 'width', '1'),
  token('stroke.menu.container.style', 'menu', 'style', 'solid'),
  token('stroke.menu.container.color', 'menu', 'color', 'neutral.200'),
  
  token('stroke.menu.divider.width', 'menu', 'width', '1'),
  token('stroke.menu.divider.style', 'menu', 'style', 'solid'),
  token('stroke.menu.divider.color', 'menu', 'color', 'neutral.200'),

  // ============================================
  // SIDEBAR
  // ============================================
  token('stroke.sidebar.container.width', 'sidebar', 'width', '1'),
  token('stroke.sidebar.container.style', 'sidebar', 'style', 'solid'),
  token('stroke.sidebar.container.color', 'sidebar', 'color', 'neutral.200'),
  
  token('stroke.sidebar.item.width', 'sidebar', 'width', '0'),
  token('stroke.sidebar.item.style', 'sidebar', 'style', 'none'),
  token('stroke.sidebar.item.color', 'sidebar', 'color', 'transparent'),
  
  token('stroke.sidebar.itemActive.width', 'sidebar', 'width', '2'),
  token('stroke.sidebar.itemActive.style', 'sidebar', 'style', 'solid'),
  token('stroke.sidebar.itemActive.color', 'sidebar', 'color', 'brand.500'),

  // ============================================
  // HEADER
  // ============================================
  token('stroke.header.container.width', 'header', 'width', '1'),
  token('stroke.header.container.style', 'header', 'style', 'solid'),
  token('stroke.header.container.color', 'header', 'color', 'neutral.200'),

  // ============================================
  // BREADCRUMB
  // ============================================
  token('stroke.breadcrumb.item.width', 'breadcrumb', 'width', '0'),
  token('stroke.breadcrumb.item.style', 'breadcrumb', 'style', 'none'),
  token('stroke.breadcrumb.item.color', 'breadcrumb', 'color', 'transparent'),

  // ============================================
  // PAGINATION
  // ============================================
  token('stroke.pagination.item.width', 'pagination', 'width', '1'),
  token('stroke.pagination.item.style', 'pagination', 'style', 'solid'),
  token('stroke.pagination.item.color', 'pagination', 'color', 'neutral.300'),
  
  token('stroke.pagination.itemActive.width', 'pagination', 'width', '1'),
  token('stroke.pagination.itemActive.style', 'pagination', 'style', 'solid'),
  token('stroke.pagination.itemActive.color', 'pagination', 'color', 'brand.500'),
  
  token('stroke.pagination.itemHover.width', 'pagination', 'width', '1'),
  token('stroke.pagination.itemHover.style', 'pagination', 'style', 'solid'),
  token('stroke.pagination.itemHover.color', 'pagination', 'color', 'neutral.400'),

  // ============================================
  // TABLE
  // ============================================
  token('stroke.table.container.width', 'table', 'width', '1'),
  token('stroke.table.container.style', 'table', 'style', 'solid'),
  token('stroke.table.container.color', 'table', 'color', 'neutral.200'),
  
  token('stroke.table.header.width', 'table', 'width', '1'),
  token('stroke.table.header.style', 'table', 'style', 'solid'),
  token('stroke.table.header.color', 'table', 'color', 'neutral.300'),
  
  token('stroke.table.row.width', 'table', 'width', '1'),
  token('stroke.table.row.style', 'table', 'style', 'solid'),
  token('stroke.table.row.color', 'table', 'color', 'neutral.200'),
  
  token('stroke.table.rowHover.width', 'table', 'width', '1'),
  token('stroke.table.rowHover.style', 'table', 'style', 'solid'),
  token('stroke.table.rowHover.color', 'table', 'color', 'neutral.300'),
  
  token('stroke.table.rowSelected.width', 'table', 'width', '1'),
  token('stroke.table.rowSelected.style', 'table', 'style', 'solid'),
  token('stroke.table.rowSelected.color', 'table', 'color', 'brand.200'),
  
  token('stroke.table.cell.width', 'table', 'width', '1'),
  token('stroke.table.cell.style', 'table', 'style', 'solid'),
  token('stroke.table.cell.color', 'table', 'color', 'neutral.200'),
  
  token('stroke.table.cellVertical.width', 'table', 'width', '1'),
  token('stroke.table.cellVertical.style', 'table', 'style', 'solid'),
  token('stroke.table.cellVertical.color', 'table', 'color', 'neutral.200'),

  // ============================================
  // DATA GRID
  // ============================================
  token('stroke.dataGrid.container.width', 'dataGrid', 'width', '1'),
  token('stroke.dataGrid.container.style', 'dataGrid', 'style', 'solid'),
  token('stroke.dataGrid.container.color', 'dataGrid', 'color', 'neutral.300'),
  
  token('stroke.dataGrid.cell.width', 'dataGrid', 'width', '1'),
  token('stroke.dataGrid.cell.style', 'dataGrid', 'style', 'solid'),
  token('stroke.dataGrid.cell.color', 'dataGrid', 'color', 'neutral.200'),

  // ============================================
  // ALERT
  // ============================================
  token('stroke.alert.info.width', 'alert', 'width', '1'),
  token('stroke.alert.info.style', 'alert', 'style', 'solid'),
  token('stroke.alert.info.color', 'alert', 'color', 'info.300'),
  
  token('stroke.alert.success.width', 'alert', 'width', '1'),
  token('stroke.alert.success.style', 'alert', 'style', 'solid'),
  token('stroke.alert.success.color', 'alert', 'color', 'success.300'),
  
  token('stroke.alert.warning.width', 'alert', 'width', '1'),
  token('stroke.alert.warning.style', 'alert', 'style', 'solid'),
  token('stroke.alert.warning.color', 'alert', 'color', 'warning.300'),
  
  token('stroke.alert.error.width', 'alert', 'width', '1'),
  token('stroke.alert.error.style', 'alert', 'style', 'solid'),
  token('stroke.alert.error.color', 'alert', 'color', 'error.300'),
  
  token('stroke.alert.neutral.width', 'alert', 'width', '1'),
  token('stroke.alert.neutral.style', 'alert', 'style', 'solid'),
  token('stroke.alert.neutral.color', 'alert', 'color', 'neutral.300'),

  // ============================================
  // BADGE
  // ============================================
  token('stroke.badge.default.width', 'badge', 'width', '0'),
  token('stroke.badge.default.style', 'badge', 'style', 'none'),
  token('stroke.badge.default.color', 'badge', 'color', 'transparent'),
  
  token('stroke.badge.outlined.width', 'badge', 'width', '1'),
  token('stroke.badge.outlined.style', 'badge', 'style', 'solid'),
  token('stroke.badge.outlined.color', 'badge', 'color', 'neutral.400'),

  // ============================================
  // TAG
  // ============================================
  token('stroke.tag.default.width', 'tag', 'width', '1'),
  token('stroke.tag.default.style', 'tag', 'style', 'solid'),
  token('stroke.tag.default.color', 'tag', 'color', 'neutral.300'),
  
  token('stroke.tag.selected.width', 'tag', 'width', '1'),
  token('stroke.tag.selected.style', 'tag', 'style', 'solid'),
  token('stroke.tag.selected.color', 'tag', 'color', 'brand.500'),

  // ============================================
  // CHIP
  // ============================================
  token('stroke.chip.default.width', 'chip', 'width', '1'),
  token('stroke.chip.default.style', 'chip', 'style', 'solid'),
  token('stroke.chip.default.color', 'chip', 'color', 'neutral.300'),
  
  token('stroke.chip.selected.width', 'chip', 'width', '1'),
  token('stroke.chip.selected.style', 'chip', 'style', 'solid'),
  token('stroke.chip.selected.color', 'chip', 'color', 'brand.500'),
  
  token('stroke.chip.hover.width', 'chip', 'width', '1'),
  token('stroke.chip.hover.style', 'chip', 'style', 'solid'),
  token('stroke.chip.hover.color', 'chip', 'color', 'neutral.400'),

  // ============================================
  // TOAST
  // ============================================
  token('stroke.toast.default.width', 'toast', 'width', '0'),
  token('stroke.toast.default.style', 'toast', 'style', 'none'),
  token('stroke.toast.default.color', 'toast', 'color', 'transparent'),
  
  token('stroke.toast.outlined.width', 'toast', 'width', '1'),
  token('stroke.toast.outlined.style', 'toast', 'style', 'solid'),
  token('stroke.toast.outlined.color', 'toast', 'color', 'neutral.300'),

  // ============================================
  // AVATAR
  // ============================================
  token('stroke.avatar.default.width', 'avatar', 'width', '2'),
  token('stroke.avatar.default.style', 'avatar', 'style', 'solid'),
  token('stroke.avatar.default.color', 'avatar', 'color', 'white'),
  
  token('stroke.avatar.group.width', 'avatar', 'width', '2'),
  token('stroke.avatar.group.style', 'avatar', 'style', 'solid'),
  token('stroke.avatar.group.color', 'avatar', 'color', 'white'),
  
  token('stroke.avatar.status.width', 'avatar', 'width', '2'),
  token('stroke.avatar.status.style', 'avatar', 'style', 'solid'),
  token('stroke.avatar.status.color', 'avatar', 'color', 'white'),

  // ============================================
  // IMAGE
  // ============================================
  token('stroke.image.default.width', 'image', 'width', '0'),
  token('stroke.image.default.style', 'image', 'style', 'none'),
  token('stroke.image.default.color', 'image', 'color', 'transparent'),
  
  token('stroke.image.bordered.width', 'image', 'width', '1'),
  token('stroke.image.bordered.style', 'image', 'style', 'solid'),
  token('stroke.image.bordered.color', 'image', 'color', 'neutral.200'),
  
  token('stroke.image.selected.width', 'image', 'width', '2'),
  token('stroke.image.selected.style', 'image', 'style', 'solid'),
  token('stroke.image.selected.color', 'image', 'color', 'brand.500'),

  // ============================================
  // THUMBNAIL
  // ============================================
  token('stroke.thumbnail.default.width', 'thumbnail', 'width', '1'),
  token('stroke.thumbnail.default.style', 'thumbnail', 'style', 'solid'),
  token('stroke.thumbnail.default.color', 'thumbnail', 'color', 'neutral.200'),
  
  token('stroke.thumbnail.hover.width', 'thumbnail', 'width', '1'),
  token('stroke.thumbnail.hover.style', 'thumbnail', 'style', 'solid'),
  token('stroke.thumbnail.hover.color', 'thumbnail', 'color', 'neutral.400'),
  
  token('stroke.thumbnail.selected.width', 'thumbnail', 'width', '2'),
  token('stroke.thumbnail.selected.style', 'thumbnail', 'style', 'solid'),
  token('stroke.thumbnail.selected.color', 'thumbnail', 'color', 'brand.500'),

  // ============================================
  // LIST
  // ============================================
  token('stroke.list.container.width', 'list', 'width', '1'),
  token('stroke.list.container.style', 'list', 'style', 'solid'),
  token('stroke.list.container.color', 'list', 'color', 'neutral.200'),
  
  token('stroke.list.item.width', 'list', 'width', '0'),
  token('stroke.list.item.style', 'list', 'style', 'none'),
  token('stroke.list.item.color', 'list', 'color', 'transparent'),
  
  token('stroke.list.itemDivider.width', 'list', 'width', '1'),
  token('stroke.list.itemDivider.style', 'list', 'style', 'solid'),
  token('stroke.list.itemDivider.color', 'list', 'color', 'neutral.200'),
  
  token('stroke.list.itemSelected.width', 'list', 'width', '2'),
  token('stroke.list.itemSelected.style', 'list', 'style', 'solid'),
  token('stroke.list.itemSelected.color', 'list', 'color', 'brand.500'),

  // ============================================
  // DIVIDER
  // ============================================
  token('stroke.divider.horizontal.default.width', 'divider', 'width', '1'),
  token('stroke.divider.horizontal.default.style', 'divider', 'style', 'solid'),
  token('stroke.divider.horizontal.default.color', 'divider', 'color', 'neutral.200'),
  
  token('stroke.divider.horizontal.subtle.width', 'divider', 'width', '1'),
  token('stroke.divider.horizontal.subtle.style', 'divider', 'style', 'solid'),
  token('stroke.divider.horizontal.subtle.color', 'divider', 'color', 'neutral.100'),
  
  token('stroke.divider.horizontal.strong.width', 'divider', 'width', '1'),
  token('stroke.divider.horizontal.strong.style', 'divider', 'style', 'solid'),
  token('stroke.divider.horizontal.strong.color', 'divider', 'color', 'neutral.300'),
  
  token('stroke.divider.horizontal.heavy.width', 'divider', 'width', '2'),
  token('stroke.divider.horizontal.heavy.style', 'divider', 'style', 'solid'),
  token('stroke.divider.horizontal.heavy.color', 'divider', 'color', 'neutral.300'),
  
  token('stroke.divider.horizontal.dashed.width', 'divider', 'width', '1'),
  token('stroke.divider.horizontal.dashed.style', 'divider', 'style', 'dashed'),
  token('stroke.divider.horizontal.dashed.color', 'divider', 'color', 'neutral.300'),
  
  token('stroke.divider.horizontal.dotted.width', 'divider', 'width', '1'),
  token('stroke.divider.horizontal.dotted.style', 'divider', 'style', 'dotted'),
  token('stroke.divider.horizontal.dotted.color', 'divider', 'color', 'neutral.300'),
  
  token('stroke.divider.vertical.default.width', 'divider', 'width', '1'),
  token('stroke.divider.vertical.default.style', 'divider', 'style', 'solid'),
  token('stroke.divider.vertical.default.color', 'divider', 'color', 'neutral.200'),
  
  token('stroke.divider.vertical.subtle.width', 'divider', 'width', '1'),
  token('stroke.divider.vertical.subtle.style', 'divider', 'style', 'solid'),
  token('stroke.divider.vertical.subtle.color', 'divider', 'color', 'neutral.100'),
  
  token('stroke.divider.vertical.strong.width', 'divider', 'width', '1'),
  token('stroke.divider.vertical.strong.style', 'divider', 'style', 'solid'),
  token('stroke.divider.vertical.strong.color', 'divider', 'color', 'neutral.300'),

  // ============================================
  // PROGRESS
  // ============================================
  token('stroke.progress.track.width', 'progress', 'width', '0'),
  token('stroke.progress.track.style', 'progress', 'style', 'none'),
  token('stroke.progress.track.color', 'progress', 'color', 'transparent'),
  
  token('stroke.progress.bar.width', 'progress', 'width', '0'),
  token('stroke.progress.bar.style', 'progress', 'style', 'none'),
  token('stroke.progress.bar.color', 'progress', 'color', 'transparent'),
  
  token('stroke.progressCircular.track.width', 'progress', 'width', '4'),
  token('stroke.progressCircular.track.style', 'progress', 'style', 'solid'),
  token('stroke.progressCircular.track.color', 'progress', 'color', 'neutral.200'),
  
  token('stroke.progressCircular.indicator.width', 'progress', 'width', '4'),
  token('stroke.progressCircular.indicator.style', 'progress', 'style', 'solid'),
  token('stroke.progressCircular.indicator.color', 'progress', 'color', 'brand.500'),

  // ============================================
  // SLIDER
  // ============================================
  token('stroke.slider.track.width', 'slider', 'width', '0'),
  token('stroke.slider.track.style', 'slider', 'style', 'none'),
  token('stroke.slider.track.color', 'slider', 'color', 'transparent'),
  
  token('stroke.slider.thumb.width', 'slider', 'width', '2'),
  token('stroke.slider.thumb.style', 'slider', 'style', 'solid'),
  token('stroke.slider.thumb.color', 'slider', 'color', 'white'),
  
  token('stroke.slider.thumbFocus.width', 'slider', 'width', '2'),
  token('stroke.slider.thumbFocus.style', 'slider', 'style', 'solid'),
  token('stroke.slider.thumbFocus.color', 'slider', 'color', 'brand.500'),

  // ============================================
  // STEPPER
  // ============================================
  token('stroke.stepper.item.width', 'stepper', 'width', '2'),
  token('stroke.stepper.item.style', 'stepper', 'style', 'solid'),
  token('stroke.stepper.item.color', 'stepper', 'color', 'neutral.300'),
  
  token('stroke.stepper.itemActive.width', 'stepper', 'width', '2'),
  token('stroke.stepper.itemActive.style', 'stepper', 'style', 'solid'),
  token('stroke.stepper.itemActive.color', 'stepper', 'color', 'brand.500'),
  
  token('stroke.stepper.itemCompleted.width', 'stepper', 'width', '0'),
  token('stroke.stepper.itemCompleted.style', 'stepper', 'style', 'none'),
  token('stroke.stepper.itemCompleted.color', 'stepper', 'color', 'transparent'),
  
  token('stroke.stepper.connector.width', 'stepper', 'width', '2'),
  token('stroke.stepper.connector.style', 'stepper', 'style', 'solid'),
  token('stroke.stepper.connector.color', 'stepper', 'color', 'neutral.300'),
  
  token('stroke.stepper.connectorCompleted.width', 'stepper', 'width', '2'),
  token('stroke.stepper.connectorCompleted.style', 'stepper', 'style', 'solid'),
  token('stroke.stepper.connectorCompleted.color', 'stepper', 'color', 'brand.500'),

  // ============================================
  // CODE
  // ============================================
  token('stroke.code.inline.width', 'code', 'width', '1'),
  token('stroke.code.inline.style', 'code', 'style', 'solid'),
  token('stroke.code.inline.color', 'code', 'color', 'neutral.200'),
  
  token('stroke.code.block.width', 'code', 'width', '1'),
  token('stroke.code.block.style', 'code', 'style', 'solid'),
  token('stroke.code.block.color', 'code', 'color', 'neutral.200'),

  // ============================================
  // BLOCKQUOTE
  // ============================================
  token('stroke.blockquote.accent.width', 'blockquote', 'width', '4'),
  token('stroke.blockquote.accent.style', 'blockquote', 'style', 'solid'),
  token('stroke.blockquote.accent.color', 'blockquote', 'color', 'brand.500'),
  
  token('stroke.blockquote.container.width', 'blockquote', 'width', '0'),
  token('stroke.blockquote.container.style', 'blockquote', 'style', 'none'),
  token('stroke.blockquote.container.color', 'blockquote', 'color', 'transparent'),

  // ============================================
  // CALLOUT
  // ============================================
  token('stroke.callout.default.width', 'callout', 'width', '1'),
  token('stroke.callout.default.style', 'callout', 'style', 'solid'),
  token('stroke.callout.default.color', 'callout', 'color', 'neutral.200'),
  
  token('stroke.callout.accent.width', 'callout', 'width', '4'),
  token('stroke.callout.accent.style', 'callout', 'style', 'solid'),
  token('stroke.callout.accent.color', 'callout', 'color', 'brand.500'),

  // ============================================
  // KBD
  // ============================================
  token('stroke.kbd.default.width', 'kbd', 'width', '1'),
  token('stroke.kbd.default.style', 'kbd', 'style', 'solid'),
  token('stroke.kbd.default.color', 'kbd', 'color', 'neutral.300'),

  // ============================================
  // SKELETON
  // ============================================
  token('stroke.skeleton.default.width', 'skeleton', 'width', '0'),
  token('stroke.skeleton.default.style', 'skeleton', 'style', 'none'),
  token('stroke.skeleton.default.color', 'skeleton', 'color', 'transparent'),

  // ============================================
  // EMPTY STATE
  // ============================================
  token('stroke.empty.container.width', 'empty', 'width', '2'),
  token('stroke.empty.container.style', 'empty', 'style', 'dashed'),
  token('stroke.empty.container.color', 'empty', 'color', 'neutral.300'),

  // ============================================
  // ACCENT
  // ============================================
  token('stroke.accent.left.brand.width', 'accent', 'width', '4'),
  token('stroke.accent.left.brand.style', 'accent', 'style', 'solid'),
  token('stroke.accent.left.brand.color', 'accent', 'color', 'brand.500'),
  
  token('stroke.accent.left.error.width', 'accent', 'width', '4'),
  token('stroke.accent.left.error.style', 'accent', 'style', 'solid'),
  token('stroke.accent.left.error.color', 'accent', 'color', 'error.500'),
  
  token('stroke.accent.left.warning.width', 'accent', 'width', '4'),
  token('stroke.accent.left.warning.style', 'accent', 'style', 'solid'),
  token('stroke.accent.left.warning.color', 'accent', 'color', 'warning.500'),
  
  token('stroke.accent.left.success.width', 'accent', 'width', '4'),
  token('stroke.accent.left.success.style', 'accent', 'style', 'solid'),
  token('stroke.accent.left.success.color', 'accent', 'color', 'success.500'),
  
  token('stroke.accent.left.info.width', 'accent', 'width', '4'),
  token('stroke.accent.left.info.style', 'accent', 'style', 'solid'),
  token('stroke.accent.left.info.color', 'accent', 'color', 'info.500'),
  
  token('stroke.accent.bottom.brand.width', 'accent', 'width', '2'),
  token('stroke.accent.bottom.brand.style', 'accent', 'style', 'solid'),
  token('stroke.accent.bottom.brand.color', 'accent', 'color', 'brand.500'),
  
  token('stroke.accent.bottom.neutral.width', 'accent', 'width', '2'),
  token('stroke.accent.bottom.neutral.style', 'accent', 'style', 'solid'),
  token('stroke.accent.bottom.neutral.color', 'accent', 'color', 'neutral.400'),
  
  token('stroke.accent.top.brand.width', 'accent', 'width', '3'),
  token('stroke.accent.top.brand.style', 'accent', 'style', 'solid'),
  token('stroke.accent.top.brand.color', 'accent', 'color', 'brand.500'),
];
