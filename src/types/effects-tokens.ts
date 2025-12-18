/**
 * Effects Token System
 * Shadows, Blur, Opacity - Primitives & Semantic tokens
 */

// ============================================
// PRIMITIVE TYPES
// ============================================

export interface ShadowOffsetPrimitive {
  name: string;  // "0", "1", "2", "n1" (negative)
  value: number; // px value
}

export interface ShadowBlurPrimitive {
  name: string;
  value: number;
}

export interface ShadowSpreadPrimitive {
  name: string;
  value: number;
}

export interface ShadowColorPrimitive {
  name: string;      // "black.10", "brand.20"
  baseColor: string; // "black", "white", "brand", "error", "success", "warning"
  opacity: number;   // 0-100
}

export interface BlurPrimitive {
  name: string;
  value: number;
}

export interface OpacityPrimitive {
  name: string;
  value: number; // 0-100, stored as 0-1 in Figma
}

// ============================================
// SEMANTIC TYPES
// ============================================

export type ShadowType = 'drop' | 'inset';

export interface EffectSemanticToken {
  id: string;
  path: string;           // "effect.elevation.raised" or "effect.backdrop.modal"
  category: string;       // "elevation", "focus", "button", "card", etc.
  name: string;           // "raised", "float", "dropdown", etc.
  description?: string;
  
  // Shadow properties (references to primitives)
  offsetX?: string;       // Reference like "0"
  offsetY?: string;       // Reference like "4"
  blur?: string;          // Reference like "8"
  spread?: string;        // Reference like "0"
  color?: string;         // Reference like "black.10"
  shadowType?: ShadowType; // "drop" or "inset"
  
  // Backdrop blur properties
  backdropBlur?: string;  // Reference to blur primitive
  backdropOpacity?: string; // Reference to opacity primitive
  
  // Simple opacity
  opacity?: string;       // Reference to opacity primitive
}

// ============================================
// STATE
// ============================================

export interface EffectsState {
  // Primitives
  shadowOffsetX: ShadowOffsetPrimitive[];
  shadowOffsetY: ShadowOffsetPrimitive[];
  shadowBlur: ShadowBlurPrimitive[];
  shadowSpread: ShadowSpreadPrimitive[];
  shadowColors: ShadowColorPrimitive[];
  blurs: BlurPrimitive[];
  opacities: OpacityPrimitive[];
  
  // Semantic tokens
  semanticTokens: EffectSemanticToken[];
  
  // Categories for organization
  categories: string[];
}

// ============================================
// DEFAULT PRIMITIVES
// ============================================

export const DEFAULT_SHADOW_OFFSET_X: ShadowOffsetPrimitive[] = [
  { name: '0', value: 0 },
  { name: '1', value: 1 },
  { name: '2', value: 2 },
  { name: '4', value: 4 },
  { name: 'n1', value: -1 },
  { name: 'n2', value: -2 },
  { name: 'n4', value: -4 },
];

export const DEFAULT_SHADOW_OFFSET_Y: ShadowOffsetPrimitive[] = [
  { name: '0', value: 0 },
  { name: '1', value: 1 },
  { name: '2', value: 2 },
  { name: '4', value: 4 },
  { name: '6', value: 6 },
  { name: '8', value: 8 },
  { name: '10', value: 10 },
  { name: '12', value: 12 },
  { name: '16', value: 16 },
  { name: '20', value: 20 },
  { name: '24', value: 24 },
  { name: '32', value: 32 },
  { name: 'n1', value: -1 },
  { name: 'n2', value: -2 },
  { name: 'n4', value: -4 },
  { name: 'n8', value: -8 },
];

export const DEFAULT_SHADOW_BLUR: ShadowBlurPrimitive[] = [
  { name: '0', value: 0 },
  { name: '1', value: 1 },
  { name: '2', value: 2 },
  { name: '3', value: 3 },
  { name: '4', value: 4 },
  { name: '6', value: 6 },
  { name: '8', value: 8 },
  { name: '10', value: 10 },
  { name: '12', value: 12 },
  { name: '16', value: 16 },
  { name: '20', value: 20 },
  { name: '24', value: 24 },
  { name: '32', value: 32 },
  { name: '40', value: 40 },
  { name: '48', value: 48 },
  { name: '64', value: 64 },
];

export const DEFAULT_SHADOW_SPREAD: ShadowSpreadPrimitive[] = [
  { name: '0', value: 0 },
  { name: '1', value: 1 },
  { name: '2', value: 2 },
  { name: '4', value: 4 },
  { name: '6', value: 6 },
  { name: '8', value: 8 },
  { name: 'n1', value: -1 },
  { name: 'n2', value: -2 },
  { name: 'n4', value: -4 },
  { name: 'n6', value: -6 },
  { name: 'n8', value: -8 },
  { name: 'n12', value: -12 },
];

export const DEFAULT_SHADOW_COLORS: ShadowColorPrimitive[] = [
  // Black
  { name: 'black-3', baseColor: 'black', opacity: 3 },
  { name: 'black-5', baseColor: 'black', opacity: 5 },
  { name: 'black-7', baseColor: 'black', opacity: 7 },
  { name: 'black-10', baseColor: 'black', opacity: 10 },
  { name: 'black-12', baseColor: 'black', opacity: 12 },
  { name: 'black-15', baseColor: 'black', opacity: 15 },
  { name: 'black-20', baseColor: 'black', opacity: 20 },
  { name: 'black-25', baseColor: 'black', opacity: 25 },
  { name: 'black-30', baseColor: 'black', opacity: 30 },
  { name: 'black-40', baseColor: 'black', opacity: 40 },
  { name: 'black-50', baseColor: 'black', opacity: 50 },
  // White
  { name: 'white-5', baseColor: 'white', opacity: 5 },
  { name: 'white-10', baseColor: 'white', opacity: 10 },
  { name: 'white-15', baseColor: 'white', opacity: 15 },
  { name: 'white-20', baseColor: 'white', opacity: 20 },
  // Brand
  { name: 'brand-10', baseColor: 'brand', opacity: 10 },
  { name: 'brand-20', baseColor: 'brand', opacity: 20 },
  { name: 'brand-30', baseColor: 'brand', opacity: 30 },
  // Error
  { name: 'error-10', baseColor: 'error', opacity: 10 },
  { name: 'error-20', baseColor: 'error', opacity: 20 },
  { name: 'error-30', baseColor: 'error', opacity: 30 },
  // Success
  { name: 'success-10', baseColor: 'success', opacity: 10 },
  { name: 'success-20', baseColor: 'success', opacity: 20 },
  // Warning
  { name: 'warning-10', baseColor: 'warning', opacity: 10 },
  { name: 'warning-20', baseColor: 'warning', opacity: 20 },
];

export const DEFAULT_BLURS: BlurPrimitive[] = [
  { name: '0', value: 0 },
  { name: '2', value: 2 },
  { name: '4', value: 4 },
  { name: '8', value: 8 },
  { name: '12', value: 12 },
  { name: '16', value: 16 },
  { name: '20', value: 20 },
  { name: '24', value: 24 },
  { name: '32', value: 32 },
  { name: '40', value: 40 },
  { name: '64', value: 64 },
];

export const DEFAULT_OPACITIES: OpacityPrimitive[] = [
  { name: '0', value: 0 },
  { name: '5', value: 5 },
  { name: '10', value: 10 },
  { name: '15', value: 15 },
  { name: '20', value: 20 },
  { name: '25', value: 25 },
  { name: '30', value: 30 },
  { name: '40', value: 40 },
  { name: '50', value: 50 },
  { name: '60', value: 60 },
  { name: '70', value: 70 },
  { name: '75', value: 75 },
  { name: '80', value: 80 },
  { name: '85', value: 85 },
  { name: '90', value: 90 },
  { name: '95', value: 95 },
  { name: '100', value: 100 },
];

// ============================================
// DEFAULT SEMANTIC TOKENS
// ============================================

export const DEFAULT_EFFECT_CATEGORIES = [
  'elevation',
  'focus',
  'button',
  'card',
  'input',
  'modal',
  'dropdown',
  'directional',
  'inset',
  'glow',
  'backdrop',
  'opacity',
];

export const DEFAULT_SEMANTIC_EFFECTS: EffectSemanticToken[] = [
  // ===== ELEVATION =====
  {
    id: 'effect-elevation-raised',
    path: 'effect.elevation.raised',
    category: 'elevation',
    name: 'raised',
    description: 'Minimal elevation - Level 1',
    offsetX: '0', offsetY: '1', blur: '2', spread: '0', color: 'black-7', shadowType: 'drop'
  },
  {
    id: 'effect-elevation-float',
    path: 'effect.elevation.float',
    category: 'elevation',
    name: 'float',
    description: 'Cards, buttons - Level 2',
    offsetX: '0', offsetY: '2', blur: '4', spread: '0', color: 'black-10', shadowType: 'drop'
  },
  {
    id: 'effect-elevation-dropdown',
    path: 'effect.elevation.dropdown',
    category: 'elevation',
    name: 'dropdown',
    description: 'Dropdown menus - Level 3',
    offsetX: '0', offsetY: '4', blur: '8', spread: '0', color: 'black-12', shadowType: 'drop'
  },
  {
    id: 'effect-elevation-popover',
    path: 'effect.elevation.popover',
    category: 'elevation',
    name: 'popover',
    description: 'Popovers, tooltips - Level 4',
    offsetX: '0', offsetY: '8', blur: '16', spread: '0', color: 'black-15', shadowType: 'drop'
  },
  {
    id: 'effect-elevation-modal',
    path: 'effect.elevation.modal',
    category: 'elevation',
    name: 'modal',
    description: 'Modal windows - Level 5',
    offsetX: '0', offsetY: '16', blur: '32', spread: '0', color: 'black-20', shadowType: 'drop'
  },
  {
    id: 'effect-elevation-dragging',
    path: 'effect.elevation.dragging',
    category: 'elevation',
    name: 'dragging',
    description: 'Drag and drop - Level 6',
    offsetX: '0', offsetY: '24', blur: '48', spread: '0', color: 'black-25', shadowType: 'drop'
  },

  // ===== FOCUS =====
  {
    id: 'effect-focus-default',
    path: 'effect.focus.default',
    category: 'focus',
    name: 'default',
    description: 'Default focus ring',
    offsetX: '0', offsetY: '0', blur: '0', spread: '4', color: 'brand-30', shadowType: 'drop'
  },
  {
    id: 'effect-focus-error',
    path: 'effect.focus.error',
    category: 'focus',
    name: 'error',
    description: 'Error focus ring',
    offsetX: '0', offsetY: '0', blur: '0', spread: '4', color: 'error-30', shadowType: 'drop'
  },
  {
    id: 'effect-focus-success',
    path: 'effect.focus.success',
    category: 'focus',
    name: 'success',
    description: 'Success focus ring',
    offsetX: '0', offsetY: '0', blur: '0', spread: '4', color: 'success-30', shadowType: 'drop'
  },
  {
    id: 'effect-focus-soft',
    path: 'effect.focus.soft',
    category: 'focus',
    name: 'soft',
    description: 'Soft focus ring with blur',
    offsetX: '0', offsetY: '0', blur: '8', spread: '2', color: 'brand-20', shadowType: 'drop'
  },

  // ===== BUTTON =====
  {
    id: 'effect-button-default',
    path: 'effect.button.default',
    category: 'button',
    name: 'default',
    offsetX: '0', offsetY: '1', blur: '2', spread: '0', color: 'black-7', shadowType: 'drop'
  },
  {
    id: 'effect-button-hover',
    path: 'effect.button.hover',
    category: 'button',
    name: 'hover',
    offsetX: '0', offsetY: '2', blur: '4', spread: '0', color: 'black-10', shadowType: 'drop'
  },
  {
    id: 'effect-button-active',
    path: 'effect.button.active',
    category: 'button',
    name: 'active',
    offsetX: '0', offsetY: '0', blur: '1', spread: '0', color: 'black-5', shadowType: 'drop'
  },
  {
    id: 'effect-button-primary',
    path: 'effect.button.primary',
    category: 'button',
    name: 'primary',
    offsetX: '0', offsetY: '2', blur: '6', spread: '0', color: 'brand-30', shadowType: 'drop'
  },

  // ===== CARD =====
  {
    id: 'effect-card-default',
    path: 'effect.card.default',
    category: 'card',
    name: 'default',
    offsetX: '0', offsetY: '1', blur: '3', spread: '0', color: 'black-7', shadowType: 'drop'
  },
  {
    id: 'effect-card-hover',
    path: 'effect.card.hover',
    category: 'card',
    name: 'hover',
    offsetX: '0', offsetY: '4', blur: '12', spread: '0', color: 'black-10', shadowType: 'drop'
  },
  {
    id: 'effect-card-selected',
    path: 'effect.card.selected',
    category: 'card',
    name: 'selected',
    offsetX: '0', offsetY: '0', blur: '0', spread: '2', color: 'brand-30', shadowType: 'drop'
  },
  {
    id: 'effect-card-interactive',
    path: 'effect.card.interactive',
    category: 'card',
    name: 'interactive',
    offsetX: '0', offsetY: '2', blur: '6', spread: '0', color: 'black-10', shadowType: 'drop'
  },

  // ===== INPUT =====
  {
    id: 'effect-input-focus',
    path: 'effect.input.focus',
    category: 'input',
    name: 'focus',
    offsetX: '0', offsetY: '0', blur: '0', spread: '4', color: 'brand-20', shadowType: 'drop'
  },
  {
    id: 'effect-input-error',
    path: 'effect.input.error',
    category: 'input',
    name: 'error',
    offsetX: '0', offsetY: '0', blur: '0', spread: '4', color: 'error-20', shadowType: 'drop'
  },
  {
    id: 'effect-input-success',
    path: 'effect.input.success',
    category: 'input',
    name: 'success',
    offsetX: '0', offsetY: '0', blur: '0', spread: '4', color: 'success-20', shadowType: 'drop'
  },

  // ===== MODAL =====
  {
    id: 'effect-modal-backdrop',
    path: 'effect.modal.backdrop',
    category: 'modal',
    name: 'backdrop',
    offsetX: '0', offsetY: '0', blur: '0', spread: '0', color: 'black-50', shadowType: 'drop'
  },
  {
    id: 'effect-modal-container',
    path: 'effect.modal.container',
    category: 'modal',
    name: 'container',
    offsetX: '0', offsetY: '24', blur: '48', spread: 'n12', color: 'black-25', shadowType: 'drop'
  },

  // ===== DROPDOWN =====
  {
    id: 'effect-dropdown-container',
    path: 'effect.dropdown.container',
    category: 'dropdown',
    name: 'container',
    offsetX: '0', offsetY: '4', blur: '12', spread: 'n2', color: 'black-15', shadowType: 'drop'
  },
  {
    id: 'effect-popover-container',
    path: 'effect.popover.container',
    category: 'dropdown',
    name: 'popover',
    offsetX: '0', offsetY: '8', blur: '24', spread: 'n4', color: 'black-15', shadowType: 'drop'
  },
  {
    id: 'effect-tooltip-container',
    path: 'effect.tooltip.container',
    category: 'dropdown',
    name: 'tooltip',
    offsetX: '0', offsetY: '4', blur: '8', spread: '0', color: 'black-20', shadowType: 'drop'
  },
  {
    id: 'effect-toast-container',
    path: 'effect.toast.container',
    category: 'dropdown',
    name: 'toast',
    offsetX: '0', offsetY: '8', blur: '16', spread: 'n2', color: 'black-15', shadowType: 'drop'
  },

  // ===== DIRECTIONAL =====
  {
    id: 'effect-directional-top',
    path: 'effect.directional.top',
    category: 'directional',
    name: 'top',
    offsetX: '0', offsetY: 'n4', blur: '8', spread: 'n2', color: 'black-10', shadowType: 'drop'
  },
  {
    id: 'effect-directional-bottom',
    path: 'effect.directional.bottom',
    category: 'directional',
    name: 'bottom',
    offsetX: '0', offsetY: '4', blur: '8', spread: 'n2', color: 'black-10', shadowType: 'drop'
  },
  {
    id: 'effect-directional-left',
    path: 'effect.directional.left',
    category: 'directional',
    name: 'left',
    offsetX: 'n4', offsetY: '0', blur: '8', spread: 'n2', color: 'black-10', shadowType: 'drop'
  },
  {
    id: 'effect-directional-right',
    path: 'effect.directional.right',
    category: 'directional',
    name: 'right',
    offsetX: '4', offsetY: '0', blur: '8', spread: 'n2', color: 'black-10', shadowType: 'drop'
  },

  // ===== INSET =====
  {
    id: 'effect-inset-subtle',
    path: 'effect.inset.subtle',
    category: 'inset',
    name: 'subtle',
    offsetX: '0', offsetY: '1', blur: '2', spread: '0', color: 'black-7', shadowType: 'inset'
  },
  {
    id: 'effect-inset-default',
    path: 'effect.inset.default',
    category: 'inset',
    name: 'default',
    offsetX: '0', offsetY: '2', blur: '4', spread: '0', color: 'black-10', shadowType: 'inset'
  },
  {
    id: 'effect-inset-deep',
    path: 'effect.inset.deep',
    category: 'inset',
    name: 'deep',
    offsetX: '0', offsetY: '4', blur: '8', spread: '0', color: 'black-15', shadowType: 'inset'
  },
  {
    id: 'effect-inset-input',
    path: 'effect.inset.input',
    category: 'inset',
    name: 'input',
    offsetX: '0', offsetY: '1', blur: '2', spread: '0', color: 'black-5', shadowType: 'inset'
  },
  {
    id: 'effect-inset-well',
    path: 'effect.inset.well',
    category: 'inset',
    name: 'well',
    offsetX: '0', offsetY: '2', blur: '6', spread: 'n1', color: 'black-10', shadowType: 'inset'
  },

  // ===== GLOW =====
  {
    id: 'effect-glow-brand-subtle',
    path: 'effect.glow.brand.subtle',
    category: 'glow',
    name: 'brand-subtle',
    offsetX: '0', offsetY: '0', blur: '8', spread: '0', color: 'brand-10', shadowType: 'drop'
  },
  {
    id: 'effect-glow-brand-default',
    path: 'effect.glow.brand.default',
    category: 'glow',
    name: 'brand-default',
    offsetX: '0', offsetY: '0', blur: '16', spread: '0', color: 'brand-20', shadowType: 'drop'
  },
  {
    id: 'effect-glow-brand-intense',
    path: 'effect.glow.brand.intense',
    category: 'glow',
    name: 'brand-intense',
    offsetX: '0', offsetY: '0', blur: '24', spread: '4', color: 'brand-30', shadowType: 'drop'
  },
  {
    id: 'effect-glow-error-subtle',
    path: 'effect.glow.error.subtle',
    category: 'glow',
    name: 'error-subtle',
    offsetX: '0', offsetY: '0', blur: '8', spread: '0', color: 'error-10', shadowType: 'drop'
  },
  {
    id: 'effect-glow-error-default',
    path: 'effect.glow.error.default',
    category: 'glow',
    name: 'error-default',
    offsetX: '0', offsetY: '0', blur: '16', spread: '0', color: 'error-20', shadowType: 'drop'
  },
  {
    id: 'effect-glow-success-subtle',
    path: 'effect.glow.success.subtle',
    category: 'glow',
    name: 'success-subtle',
    offsetX: '0', offsetY: '0', blur: '8', spread: '0', color: 'success-10', shadowType: 'drop'
  },
  {
    id: 'effect-glow-success-default',
    path: 'effect.glow.success.default',
    category: 'glow',
    name: 'success-default',
    offsetX: '0', offsetY: '0', blur: '16', spread: '0', color: 'success-20', shadowType: 'drop'
  },
  {
    id: 'effect-glow-warning-default',
    path: 'effect.glow.warning.default',
    category: 'glow',
    name: 'warning-default',
    offsetX: '0', offsetY: '0', blur: '16', spread: '0', color: 'warning-20', shadowType: 'drop'
  },

  // ===== BACKDROP =====
  {
    id: 'effect-backdrop-subtle',
    path: 'effect.backdrop.subtle',
    category: 'backdrop',
    name: 'subtle',
    backdropBlur: '4', backdropOpacity: '80'
  },
  {
    id: 'effect-backdrop-default',
    path: 'effect.backdrop.default',
    category: 'backdrop',
    name: 'default',
    backdropBlur: '8', backdropOpacity: '70'
  },
  {
    id: 'effect-backdrop-medium',
    path: 'effect.backdrop.medium',
    category: 'backdrop',
    name: 'medium',
    backdropBlur: '16', backdropOpacity: '60'
  },
  {
    id: 'effect-backdrop-strong',
    path: 'effect.backdrop.strong',
    category: 'backdrop',
    name: 'strong',
    backdropBlur: '24', backdropOpacity: '50'
  },
  {
    id: 'effect-backdrop-intense',
    path: 'effect.backdrop.intense',
    category: 'backdrop',
    name: 'intense',
    backdropBlur: '40', backdropOpacity: '40'
  },
  {
    id: 'effect-backdrop-modal',
    path: 'effect.backdrop.modal',
    category: 'backdrop',
    name: 'modal',
    backdropBlur: '8', backdropOpacity: '50'
  },
  {
    id: 'effect-backdrop-header',
    path: 'effect.backdrop.header',
    category: 'backdrop',
    name: 'header',
    backdropBlur: '12', backdropOpacity: '85'
  },

  // ===== OPACITY =====
  {
    id: 'effect-opacity-disabled',
    path: 'effect.opacity.disabled',
    category: 'opacity',
    name: 'disabled',
    opacity: '40'
  },
  {
    id: 'effect-opacity-placeholder',
    path: 'effect.opacity.placeholder',
    category: 'opacity',
    name: 'placeholder',
    opacity: '50'
  },
  {
    id: 'effect-opacity-hint',
    path: 'effect.opacity.hint',
    category: 'opacity',
    name: 'hint',
    opacity: '60'
  },
  {
    id: 'effect-opacity-secondary',
    path: 'effect.opacity.secondary',
    category: 'opacity',
    name: 'secondary',
    opacity: '70'
  },
  {
    id: 'effect-opacity-muted',
    path: 'effect.opacity.muted',
    category: 'opacity',
    name: 'muted',
    opacity: '50'
  },
  {
    id: 'effect-opacity-hover',
    path: 'effect.opacity.hover',
    category: 'opacity',
    name: 'hover',
    opacity: '80'
  },
  {
    id: 'effect-opacity-active',
    path: 'effect.opacity.active',
    category: 'opacity',
    name: 'active',
    opacity: '90'
  },
  {
    id: 'effect-opacity-overlay-subtle',
    path: 'effect.opacity.overlay.subtle',
    category: 'opacity',
    name: 'overlay-subtle',
    opacity: '10'
  },
  {
    id: 'effect-opacity-overlay-light',
    path: 'effect.opacity.overlay.light',
    category: 'opacity',
    name: 'overlay-light',
    opacity: '20'
  },
  {
    id: 'effect-opacity-overlay-medium',
    path: 'effect.opacity.overlay.medium',
    category: 'opacity',
    name: 'overlay-medium',
    opacity: '40'
  },
  {
    id: 'effect-opacity-overlay-heavy',
    path: 'effect.opacity.overlay.heavy',
    category: 'opacity',
    name: 'overlay-heavy',
    opacity: '60'
  },
  {
    id: 'effect-opacity-divider',
    path: 'effect.opacity.divider',
    category: 'opacity',
    name: 'divider',
    opacity: '10'
  },
  {
    id: 'effect-opacity-dividerStrong',
    path: 'effect.opacity.dividerStrong',
    category: 'opacity',
    name: 'dividerStrong',
    opacity: '20'
  },
];

// ============================================
// INITIAL STATE
// ============================================

export const INITIAL_EFFECTS_STATE: EffectsState = {
  shadowOffsetX: [...DEFAULT_SHADOW_OFFSET_X],
  shadowOffsetY: [...DEFAULT_SHADOW_OFFSET_Y],
  shadowBlur: [...DEFAULT_SHADOW_BLUR],
  shadowSpread: [...DEFAULT_SHADOW_SPREAD],
  shadowColors: [...DEFAULT_SHADOW_COLORS],
  blurs: [...DEFAULT_BLURS],
  opacities: [...DEFAULT_OPACITIES],
  semanticTokens: [...DEFAULT_SEMANTIC_EFFECTS],
  categories: [...DEFAULT_EFFECT_CATEGORIES],
};
