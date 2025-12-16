/**
 * Radius Tokens Type Definitions
 * 2-tier architecture (like Spacing/Gap)
 * 
 * Level 1: Primitives (radius.0, radius.4, radius.8...) - in Primitives collection
 * Level 2: Semantic (radius.interactive.button, radius.container.card) - in Radius collection
 */

// ============================================
// PRIMITIVES
// ============================================

export interface RadiusPrimitive {
  name: string;   // "0", "2", "4", "6", "8", "full"...
  value: number;  // 0, 2, 4, 6, 8, 9999...
  enabled: boolean;
}

export const DEFAULT_RADIUS_PRIMITIVES: RadiusPrimitive[] = [
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
  { name: '32', value: 32, enabled: true },
  { name: 'full', value: 9999, enabled: true },
];

// ============================================
// SEMANTIC TOKENS
// ============================================

export type RadiusCategory = 
  | 'interactive'
  | 'container'
  | 'feedback'
  | 'media'
  | 'form'
  | 'data'
  | 'overlay'
  | 'special';

export const RADIUS_CATEGORIES: Record<RadiusCategory, { label: string; icon: string; description: string }> = {
  interactive: { label: 'Интерактивные', icon: '🔘', description: 'Кнопки, инпуты, чекбоксы, слайдеры' },
  container: { label: 'Контейнеры', icon: '📦', description: 'Карточки, модалки, панели' },
  feedback: { label: 'Уведомления', icon: '🔔', description: 'Алерты, бейджи, теги' },
  media: { label: 'Медиа', icon: '🖼️', description: 'Аватары, изображения, видео' },
  form: { label: 'Формы', icon: '📝', description: 'Поля ввода, селекты' },
  data: { label: 'Данные', icon: '📊', description: 'Таблицы, графики, прогресс' },
  overlay: { label: 'Оверлеи', icon: '🪟', description: 'Модалки, drawers, диалоги' },
  special: { label: 'Специальные', icon: '✨', description: 'Код, цитаты, callout' },
};

export interface RadiusSemanticToken {
  id: string;
  path: string;           // "radius.interactive.button"
  category: RadiusCategory;
  description?: string;
  primitiveRef: string;   // Reference to primitive name: "6", "full", "0"
}

export interface RadiusState {
  primitives: RadiusPrimitive[];
  semanticTokens: RadiusSemanticToken[];
}

// ============================================
// DEFAULT SEMANTIC TOKENS
// ============================================

export const DEFAULT_RADIUS_SEMANTIC_TOKENS: RadiusSemanticToken[] = [
  // ----------------------------------------
  // INTERACTIVE ELEMENTS
  // ----------------------------------------
  { id: 'r-1', path: 'radius.interactive.button', category: 'interactive', primitiveRef: '6' },
  { id: 'r-2', path: 'radius.interactive.buttonPill', category: 'interactive', primitiveRef: 'full' },
  { id: 'r-3', path: 'radius.interactive.buttonSquare', category: 'interactive', primitiveRef: '4' },
  
  { id: 'r-4', path: 'radius.interactive.input', category: 'interactive', primitiveRef: '6' },
  { id: 'r-5', path: 'radius.interactive.inputRounded', category: 'interactive', primitiveRef: '8' },
  
  { id: 'r-6', path: 'radius.interactive.checkbox', category: 'interactive', primitiveRef: '4' },
  { id: 'r-7', path: 'radius.interactive.radio', category: 'interactive', primitiveRef: 'full' },
  { id: 'r-8', path: 'radius.interactive.switch', category: 'interactive', primitiveRef: 'full' },
  { id: 'r-9', path: 'radius.interactive.switchTrack', category: 'interactive', primitiveRef: 'full' },
  
  { id: 'r-10', path: 'radius.interactive.slider', category: 'interactive', primitiveRef: 'full' },
  { id: 'r-11', path: 'radius.interactive.sliderThumb', category: 'interactive', primitiveRef: 'full' },
  { id: 'r-12', path: 'radius.interactive.sliderTrack', category: 'interactive', primitiveRef: 'full' },

  // ----------------------------------------
  // CONTAINERS
  // ----------------------------------------
  { id: 'r-20', path: 'radius.container.card', category: 'container', primitiveRef: '8' },
  { id: 'r-21', path: 'radius.container.cardSubtle', category: 'container', primitiveRef: '6' },
  { id: 'r-22', path: 'radius.container.cardProminent', category: 'container', primitiveRef: '12' },
  
  { id: 'r-23', path: 'radius.container.modal', category: 'container', primitiveRef: '12' },
  { id: 'r-24', path: 'radius.container.modalSheet', category: 'container', primitiveRef: '16' },
  
  { id: 'r-25', path: 'radius.container.dropdown', category: 'container', primitiveRef: '8' },
  { id: 'r-26', path: 'radius.container.popover', category: 'container', primitiveRef: '8' },
  { id: 'r-27', path: 'radius.container.tooltip', category: 'container', primitiveRef: '4' },
  
  { id: 'r-28', path: 'radius.container.panel', category: 'container', primitiveRef: '8' },
  { id: 'r-29', path: 'radius.container.section', category: 'container', primitiveRef: '12' },
  { id: 'r-30', path: 'radius.container.well', category: 'container', primitiveRef: '8' },

  // ----------------------------------------
  // FEEDBACK & STATUS
  // ----------------------------------------
  { id: 'r-40', path: 'radius.feedback.alert', category: 'feedback', primitiveRef: '8' },
  { id: 'r-41', path: 'radius.feedback.toast', category: 'feedback', primitiveRef: '8' },
  { id: 'r-42', path: 'radius.feedback.banner', category: 'feedback', primitiveRef: '0' },
  
  { id: 'r-43', path: 'radius.feedback.badge', category: 'feedback', primitiveRef: 'full' },
  { id: 'r-44', path: 'radius.feedback.badgeSquare', category: 'feedback', primitiveRef: '4' },
  
  { id: 'r-45', path: 'radius.feedback.tag', category: 'feedback', primitiveRef: '4' },
  { id: 'r-46', path: 'radius.feedback.tagRounded', category: 'feedback', primitiveRef: 'full' },
  
  { id: 'r-47', path: 'radius.feedback.chip', category: 'feedback', primitiveRef: 'full' },
  { id: 'r-48', path: 'radius.feedback.indicator', category: 'feedback', primitiveRef: 'full' },
  { id: 'r-49', path: 'radius.feedback.dot', category: 'feedback', primitiveRef: 'full' },

  // ----------------------------------------
  // MEDIA
  // ----------------------------------------
  { id: 'r-50', path: 'radius.media.avatar', category: 'media', primitiveRef: 'full' },
  { id: 'r-51', path: 'radius.media.avatarSquare', category: 'media', primitiveRef: '8' },
  
  { id: 'r-52', path: 'radius.media.thumbnail', category: 'media', primitiveRef: '6' },
  { id: 'r-53', path: 'radius.media.thumbnailRounded', category: 'media', primitiveRef: '8' },
  
  { id: 'r-54', path: 'radius.media.image', category: 'media', primitiveRef: '8' },
  { id: 'r-55', path: 'radius.media.imageSharp', category: 'media', primitiveRef: '0' },
  { id: 'r-56', path: 'radius.media.imageRounded', category: 'media', primitiveRef: '12' },
  
  { id: 'r-57', path: 'radius.media.video', category: 'media', primitiveRef: '8' },
  { id: 'r-58', path: 'radius.media.videoPlayer', category: 'media', primitiveRef: '12' },
  
  { id: 'r-59', path: 'radius.media.icon', category: 'media', primitiveRef: '4' },
  { id: 'r-60', path: 'radius.media.iconRounded', category: 'media', primitiveRef: 'full' },

  // ----------------------------------------
  // FORMS
  // ----------------------------------------
  { id: 'r-70', path: 'radius.form.input', category: 'form', primitiveRef: '6' },
  { id: 'r-71', path: 'radius.form.inputRounded', category: 'form', primitiveRef: '8' },
  
  { id: 'r-72', path: 'radius.form.select', category: 'form', primitiveRef: '6' },
  { id: 'r-73', path: 'radius.form.textarea', category: 'form', primitiveRef: '6' },
  
  { id: 'r-74', path: 'radius.form.fieldGroup', category: 'form', primitiveRef: '8' },
  { id: 'r-75', path: 'radius.form.inputGroup', category: 'form', primitiveRef: '6' },
  
  { id: 'r-76', path: 'radius.form.fileUpload', category: 'form', primitiveRef: '8' },
  { id: 'r-77', path: 'radius.form.fileUploadZone', category: 'form', primitiveRef: '12' },

  // ----------------------------------------
  // DATA
  // ----------------------------------------
  { id: 'r-80', path: 'radius.data.table', category: 'data', primitiveRef: '8' },
  { id: 'r-81', path: 'radius.data.tableCell', category: 'data', primitiveRef: '0' },
  
  { id: 'r-82', path: 'radius.data.chart', category: 'data', primitiveRef: '8' },
  { id: 'r-83', path: 'radius.data.chartBar', category: 'data', primitiveRef: '4' },
  
  { id: 'r-84', path: 'radius.data.progress', category: 'data', primitiveRef: 'full' },
  { id: 'r-85', path: 'radius.data.progressBar', category: 'data', primitiveRef: 'full' },
  
  { id: 'r-86', path: 'radius.data.skeleton', category: 'data', primitiveRef: '4' },
  { id: 'r-87', path: 'radius.data.skeletonCircle', category: 'data', primitiveRef: 'full' },

  // ----------------------------------------
  // OVERLAYS
  // ----------------------------------------
  { id: 'r-90', path: 'radius.overlay.modal', category: 'overlay', primitiveRef: '12' },
  { id: 'r-91', path: 'radius.overlay.drawer', category: 'overlay', primitiveRef: '0' },
  { id: 'r-92', path: 'radius.overlay.drawerRounded', category: 'overlay', primitiveRef: '16' },
  
  { id: 'r-93', path: 'radius.overlay.dialog', category: 'overlay', primitiveRef: '12' },
  { id: 'r-94', path: 'radius.overlay.sheet', category: 'overlay', primitiveRef: '16' },
  
  { id: 'r-95', path: 'radius.overlay.backdrop', category: 'overlay', primitiveRef: '0' },

  // ----------------------------------------
  // SPECIAL
  // ----------------------------------------
  { id: 'r-100', path: 'radius.special.code', category: 'special', primitiveRef: '4' },
  { id: 'r-101', path: 'radius.special.codeBlock', category: 'special', primitiveRef: '8' },
  
  { id: 'r-102', path: 'radius.special.kbd', category: 'special', primitiveRef: '4' },
  { id: 'r-103', path: 'radius.special.mark', category: 'special', primitiveRef: '2' },
  
  { id: 'r-104', path: 'radius.special.callout', category: 'special', primitiveRef: '8' },
  { id: 'r-105', path: 'radius.special.quote', category: 'special', primitiveRef: '0' },
  
  { id: 'r-106', path: 'radius.special.divider', category: 'special', primitiveRef: 'full' },
];

// ============================================
// STATE
// ============================================

export function createDefaultRadiusState(): RadiusState {
  return {
    primitives: JSON.parse(JSON.stringify(DEFAULT_RADIUS_PRIMITIVES)),
    semanticTokens: JSON.parse(JSON.stringify(DEFAULT_RADIUS_SEMANTIC_TOKENS)),
  };
}

// ============================================
// HELPERS
// ============================================

export function getRadiusTokensByCategory(tokens: RadiusSemanticToken[], category: RadiusCategory): RadiusSemanticToken[] {
  return tokens.filter(t => t.category === category);
}

export function getEnabledRadiusPrimitives(primitives: RadiusPrimitive[]): RadiusPrimitive[] {
  return primitives.filter(p => p.enabled);
}
