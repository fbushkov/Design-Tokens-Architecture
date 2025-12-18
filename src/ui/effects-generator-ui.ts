/**
 * Effects Generator UI Component
 * Shadows, Blur, Opacity - Primitives & Semantic tokens
 */

import {
  EffectsState,
  EffectSemanticToken,
  ShadowOffsetPrimitive,
  ShadowBlurPrimitive,
  ShadowSpreadPrimitive,
  ShadowColorPrimitive,
  BlurPrimitive,
  OpacityPrimitive,
  INITIAL_EFFECTS_STATE,
  DEFAULT_SHADOW_OFFSET_X,
  DEFAULT_SHADOW_OFFSET_Y,
  DEFAULT_SHADOW_BLUR,
  DEFAULT_SHADOW_SPREAD,
  DEFAULT_SHADOW_COLORS,
  DEFAULT_BLURS,
  DEFAULT_OPACITIES,
  DEFAULT_SEMANTIC_EFFECTS,
  DEFAULT_EFFECT_CATEGORIES,
} from '../types/effects-tokens';

import { storageGet, storageSet } from './storage-utils';
import { addPendingChange } from './token-manager-ui';

// ============================================
// STATE
// ============================================

let effectsState: EffectsState = { ...INITIAL_EFFECTS_STATE };
let activeEffectsCategory: string = 'elevation';
let activeEffectsTab: 'primitives' | 'semantic' = 'primitives';
let activePrimitiveTab: 'offsetX' | 'offsetY' | 'blur' | 'spread' | 'colors' | 'backdrop' | 'opacity' = 'offsetX';

// ============================================
// STORAGE
// ============================================

const EFFECTS_STORAGE_KEY = 'effects-state';

async function saveEffectsState(): Promise<void> {
  try {
    await storageSet(EFFECTS_STORAGE_KEY, effectsState);
  } catch (e) {
    console.error('Failed to save effects state:', e);
  }
}

export async function loadEffectsState(): Promise<void> {
  try {
    const saved = await storageGet<EffectsState>(EFFECTS_STORAGE_KEY);
    if (saved) {
      effectsState = { ...INITIAL_EFFECTS_STATE, ...saved };
      
      // Fix legacy dot notation in color names (e.g., "black.10" -> "black-10")
      if (effectsState.shadowColors) {
        effectsState.shadowColors = effectsState.shadowColors.map(c => ({
          ...c,
          name: c.name.replace(/\./g, '-')
        }));
      }
      
      // Fix color references in semantic tokens
      if (effectsState.semanticTokens) {
        effectsState.semanticTokens = effectsState.semanticTokens.map(t => ({
          ...t,
          color: t.color?.replace(/\./g, '-')
        }));
      }
    }
  } catch (e) {
    console.error('Failed to load effects state:', e);
  }
}

// ============================================
// GETTERS
// ============================================

export function getEffectsState(): EffectsState {
  return effectsState;
}

// ============================================
// RENDER MAIN
// ============================================

export function renderEffectsGenerator(): string {
  return `
    <div class="effects-generator">
      <div class="effects-tabs">
        <button class="effects-tab ${activeEffectsTab === 'primitives' ? 'active' : ''}" data-effects-tab="primitives">
          📐 Примитивы
        </button>
        <button class="effects-tab ${activeEffectsTab === 'semantic' ? 'active' : ''}" data-effects-tab="semantic">
          🎭 Семантика
        </button>
      </div>
      
      <div class="effects-content">
        ${activeEffectsTab === 'semantic' ? renderSemanticEffects() : renderPrimitivesEffects()}
      </div>
      
      <div class="effects-actions">
        <button class="btn btn-primary" id="btn-export-effects-primitives">
          📤 Экспорт примитивов
        </button>
        <button class="btn btn-primary" id="btn-export-effects-semantic">
          📤 Экспорт семантики
        </button>
        <button class="btn btn-secondary" id="btn-export-effects-styles">
          🎨 Создать стили эффектов
        </button>
      </div>
    </div>
  `;
}

// ============================================
// PRIMITIVES TAB
// ============================================

function renderPrimitivesEffects(): string {
  return `
    <div class="primitives-effects">
      <div class="primitives-tabs">
        <button class="prim-tab ${activePrimitiveTab === 'offsetX' ? 'active' : ''}" data-prim-tab="offsetX">
          ↔ Offset X
        </button>
        <button class="prim-tab ${activePrimitiveTab === 'offsetY' ? 'active' : ''}" data-prim-tab="offsetY">
          ↕ Offset Y
        </button>
        <button class="prim-tab ${activePrimitiveTab === 'blur' ? 'active' : ''}" data-prim-tab="blur">
          🌫 Blur
        </button>
        <button class="prim-tab ${activePrimitiveTab === 'spread' ? 'active' : ''}" data-prim-tab="spread">
          📏 Spread
        </button>
        <button class="prim-tab ${activePrimitiveTab === 'colors' ? 'active' : ''}" data-prim-tab="colors">
          🎨 Colors
        </button>
        <button class="prim-tab ${activePrimitiveTab === 'backdrop' ? 'active' : ''}" data-prim-tab="backdrop">
          🔲 Backdrop
        </button>
        <button class="prim-tab ${activePrimitiveTab === 'opacity' ? 'active' : ''}" data-prim-tab="opacity">
          👁 Opacity
        </button>
      </div>
      
      <div class="primitives-content">
        ${renderPrimitiveContent()}
      </div>
    </div>
  `;
}

function renderPrimitiveContent(): string {
  switch (activePrimitiveTab) {
    case 'offsetX':
      return renderOffsetPrimitives(effectsState.shadowOffsetX, 'offsetX', 'shadow.offsetX');
    case 'offsetY':
      return renderOffsetPrimitives(effectsState.shadowOffsetY, 'offsetY', 'shadow.offsetY');
    case 'blur':
      return renderNumberPrimitives(effectsState.shadowBlur, 'shadowBlur', 'shadow.blur');
    case 'spread':
      return renderOffsetPrimitives(effectsState.shadowSpread, 'spread', 'shadow.spread');
    case 'colors':
      return renderColorPrimitives();
    case 'backdrop':
      return renderNumberPrimitives(effectsState.blurs, 'blurs', 'blur');
    case 'opacity':
      return renderOpacityPrimitives();
    default:
      return '';
  }
}

function renderOffsetPrimitives(
  primitives: ShadowOffsetPrimitive[] | ShadowSpreadPrimitive[],
  type: string,
  prefix: string
): string {
  return `
    <div class="primitives-grid">
      <div class="primitives-header">
        <span>Имя</span>
        <span>Значение (px)</span>
        <span></span>
      </div>
      ${primitives.map((p, idx) => `
        <div class="primitive-row" data-primitive-type="${type}" data-idx="${idx}">
          <span class="primitive-name">${prefix}.${p.name}</span>
          <input type="number" class="primitive-value" value="${p.value}" data-field="value">
          <button class="btn btn-icon btn-delete-primitive" title="Удалить">🗑</button>
        </div>
      `).join('')}
      <button class="btn btn-secondary btn-add-primitive" data-primitive-type="${type}">
        + Добавить
      </button>
    </div>
  `;
}

function renderNumberPrimitives(
  primitives: ShadowBlurPrimitive[] | BlurPrimitive[],
  type: string,
  prefix: string
): string {
  return `
    <div class="primitives-grid">
      <div class="primitives-header">
        <span>Имя</span>
        <span>Значение (px)</span>
        <span></span>
      </div>
      ${primitives.map((p, idx) => `
        <div class="primitive-row" data-primitive-type="${type}" data-idx="${idx}">
          <span class="primitive-name">${prefix}.${p.name}</span>
          <input type="number" class="primitive-value" value="${p.value}" min="0" data-field="value">
          <button class="btn btn-icon btn-delete-primitive" title="Удалить">🗑</button>
        </div>
      `).join('')}
      <button class="btn btn-secondary btn-add-primitive" data-primitive-type="${type}">
        + Добавить
      </button>
    </div>
  `;
}

function renderColorPrimitives(): string {
  const grouped: Record<string, ShadowColorPrimitive[]> = {};
  effectsState.shadowColors.forEach(c => {
    if (!grouped[c.baseColor]) grouped[c.baseColor] = [];
    grouped[c.baseColor].push(c);
  });

  return `
    <div class="color-primitives">
      ${Object.entries(grouped).map(([baseColor, colors]) => `
        <div class="color-group">
          <div class="color-group-header">${baseColor}</div>
          <div class="color-swatches">
            ${colors.map((c, idx) => `
              <div class="color-swatch" data-color-name="${c.name}" title="${c.name}: ${c.opacity}%">
                <div class="swatch-preview" style="background: rgba(${
                  baseColor === 'black' ? '0,0,0' : 
                  baseColor === 'white' ? '255,255,255' : 
                  'var(--color-brand)'
                }, ${c.opacity / 100})"></div>
                <span class="swatch-label">${c.opacity}%</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderOpacityPrimitives(): string {
  return `
    <div class="opacity-primitives">
      <div class="opacity-grid">
        ${effectsState.opacities.map((o, idx) => `
          <div class="opacity-item" data-opacity-idx="${idx}">
            <div class="opacity-preview" style="opacity: ${o.value / 100}"></div>
            <span class="opacity-label">${o.name}</span>
            <span class="opacity-value">${o.value}%</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ============================================
// SEMANTIC TAB
// ============================================

function renderSemanticEffects(): string {
  const categories = effectsState.categories;
  const tokens = effectsState.semanticTokens.filter(t => t.category === activeEffectsCategory);
  
  return `
    <div class="semantic-effects">
      <div class="category-tabs">
        ${categories.map(cat => `
          <button class="cat-tab ${activeEffectsCategory === cat ? 'active' : ''}" data-category="${cat}">
            ${getCategoryIcon(cat)} ${cat}
            <span class="cat-count">${effectsState.semanticTokens.filter(t => t.category === cat).length}</span>
          </button>
        `).join('')}
      </div>
      
      <div class="effects-semantic-list">
        ${tokens.length === 0 ? `
          <div class="effects-empty-state">
            <p>Нет токенов в категории "${activeEffectsCategory}"</p>
            <button class="btn btn-primary btn-add-effect-token">+ Добавить токен</button>
          </div>
        ` : `
          ${tokens.map(token => renderEffectToken(token)).join('')}
          <button class="btn btn-secondary btn-add-effect-token">+ Добавить токен</button>
        `}
      </div>
    </div>
  `;
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'elevation': '📦',
    'focus': '🎯',
    'button': '🔘',
    'card': '🃏',
    'input': '📝',
    'modal': '🖼',
    'dropdown': '📋',
    'directional': '🧭',
    'inset': '⬇️',
    'glow': '✨',
    'backdrop': '🔲',
    'opacity': '👁',
  };
  return icons[category] || '🎭';
}

function renderEffectToken(token: EffectSemanticToken): string {
  const isShadow = token.offsetX !== undefined;
  const isBackdrop = token.backdropBlur !== undefined;
  const isOpacity = token.opacity !== undefined && !isBackdrop && !isShadow;
  
  return `
    <div class="effect-token" data-token-id="${token.id}">
      <div class="effect-token-header">
        <span class="effect-token-path">${token.path}</span>
        <div class="effect-token-actions">
          <button class="btn btn-icon btn-edit-token" title="Редактировать">✏️</button>
          <button class="btn btn-icon btn-delete-token" title="Удалить">🗑</button>
        </div>
      </div>
      
      ${isShadow ? `
        <div class="effect-token-preview shadow-preview">
          <div class="preview-box" style="box-shadow: ${token.shadowType === 'inset' ? 'inset ' : ''}${
            getPrimitiveValue('offsetX', token.offsetX)}px ${
            getPrimitiveValue('offsetY', token.offsetY)}px ${
            getPrimitiveValue('blur', token.blur)}px ${
            getPrimitiveValue('spread', token.spread)}px ${
            getColorValue(token.color)}"></div>
        </div>
        <div class="effect-token-values">
          <span>X: ${token.offsetX}</span>
          <span>Y: ${token.offsetY}</span>
          <span>Blur: ${token.blur}</span>
          <span>Spread: ${token.spread}</span>
          <span>Color: ${token.color}</span>
          ${token.shadowType === 'inset' ? '<span class="badge">inset</span>' : ''}
        </div>
      ` : ''}
      
      ${isBackdrop ? `
        <div class="effect-token-preview backdrop-preview">
          <div class="preview-blur" style="backdrop-filter: blur(${getPrimitiveValue('backdrop', token.backdropBlur)}px); opacity: ${getPrimitiveValue('opacity', token.backdropOpacity) / 100}"></div>
        </div>
        <div class="effect-token-values">
          <span>Blur: ${token.backdropBlur}</span>
          <span>Opacity: ${token.backdropOpacity}%</span>
        </div>
      ` : ''}
      
      ${isOpacity ? `
        <div class="effect-token-preview opacity-preview">
          <div class="preview-opacity" style="opacity: ${getPrimitiveValue('opacity', token.opacity) / 100}"></div>
        </div>
        <div class="effect-token-values">
          <span>Opacity: ${token.opacity}%</span>
        </div>
      ` : ''}
    </div>
  `;
}

function getPrimitiveValue(type: string, ref?: string): number {
  if (!ref) return 0;
  
  switch (type) {
    case 'offsetX':
      return effectsState.shadowOffsetX.find(p => p.name === ref)?.value || 0;
    case 'offsetY':
      return effectsState.shadowOffsetY.find(p => p.name === ref)?.value || 0;
    case 'blur':
      return effectsState.shadowBlur.find(p => p.name === ref)?.value || 0;
    case 'spread':
      return effectsState.shadowSpread.find(p => p.name === ref)?.value || 0;
    case 'backdrop':
      return effectsState.blurs.find(p => p.name === ref)?.value || 0;
    case 'opacity':
      return effectsState.opacities.find(p => p.name === ref)?.value || 0;
    default:
      return 0;
  }
}

function getColorValue(ref?: string): string {
  if (!ref) return 'rgba(0,0,0,0)';
  
  const color = effectsState.shadowColors.find(c => c.name === ref);
  if (!color) return 'rgba(0,0,0,0)';
  
  const rgb = color.baseColor === 'black' ? '0,0,0' :
              color.baseColor === 'white' ? '255,255,255' :
              '59,130,246'; // Default brand blue
  
  return `rgba(${rgb}, ${color.opacity / 100})`;
}

// ============================================
// EVENT HANDLERS
// ============================================

export function initEffectsEvents(container: HTMLElement): void {
  container.addEventListener('click', handleEffectsClick);
  container.addEventListener('change', handleEffectsChange);
}

function handleEffectsClick(e: Event): void {
  const target = e.target as HTMLElement;
  
  // Tab switching
  const effectsTab = target.closest('.effects-tab') as HTMLElement;
  if (effectsTab) {
    activeEffectsTab = effectsTab.dataset.effectsTab as 'primitives' | 'semantic';
    refreshEffectsUI();
    return;
  }
  
  // Primitive tab switching
  const primTab = target.closest('.prim-tab') as HTMLElement;
  if (primTab) {
    activePrimitiveTab = primTab.dataset.primTab as any;
    refreshEffectsUI();
    return;
  }
  
  // Category switching
  const catTab = target.closest('.cat-tab') as HTMLElement;
  if (catTab) {
    activeEffectsCategory = catTab.dataset.category || 'elevation';
    refreshEffectsUI();
    return;
  }
  
  // Export primitives
  if (target.id === 'btn-export-effects-primitives' || target.closest('#btn-export-effects-primitives')) {
    exportEffectsPrimitives();
    return;
  }
  
  // Export semantic
  if (target.id === 'btn-export-effects-semantic' || target.closest('#btn-export-effects-semantic')) {
    exportEffectsSemantic();
    return;
  }
  
  // Export effect styles
  if (target.id === 'btn-export-effects-styles' || target.closest('#btn-export-effects-styles')) {
    exportEffectStyles();
    return;
  }
  
  // Delete token
  const deleteBtn = target.closest('.btn-delete-token') as HTMLElement;
  if (deleteBtn) {
    const tokenEl = deleteBtn.closest('.effect-token') as HTMLElement;
    if (tokenEl) {
      deleteEffectToken(tokenEl.dataset.tokenId || '');
    }
    return;
  }
  
  // Add token
  if (target.closest('.btn-add-effect-token')) {
    addEffectToken();
    return;
  }
}

function handleEffectsChange(e: Event): void {
  const target = e.target as HTMLInputElement;
  
  // Primitive value change
  const primitiveRow = target.closest('.primitive-row') as HTMLElement;
  if (primitiveRow && target.classList.contains('primitive-value')) {
    const type = primitiveRow.dataset.primitiveType;
    const idx = parseInt(primitiveRow.dataset.idx || '0', 10);
    const value = parseFloat(target.value) || 0;
    
    updatePrimitiveValue(type as string, idx, value);
  }
}

// ============================================
// ACTIONS
// ============================================

function updatePrimitiveValue(type: string, idx: number, value: number): void {
  switch (type) {
    case 'offsetX':
      if (effectsState.shadowOffsetX[idx]) {
        effectsState.shadowOffsetX[idx].value = value;
      }
      break;
    case 'offsetY':
      if (effectsState.shadowOffsetY[idx]) {
        effectsState.shadowOffsetY[idx].value = value;
      }
      break;
    case 'shadowBlur':
      if (effectsState.shadowBlur[idx]) {
        effectsState.shadowBlur[idx].value = value;
      }
      break;
    case 'spread':
      if (effectsState.shadowSpread[idx]) {
        effectsState.shadowSpread[idx].value = value;
      }
      break;
    case 'blurs':
      if (effectsState.blurs[idx]) {
        effectsState.blurs[idx].value = value;
      }
      break;
  }
  saveEffectsState();
}

function addEffectToken(): void {
  const newToken: EffectSemanticToken = {
    id: `effect-${Date.now()}`,
    path: `effect.${activeEffectsCategory}.new`,
    category: activeEffectsCategory,
    name: 'new',
    offsetX: '0',
    offsetY: '2',
    blur: '4',
    spread: '0',
    color: 'black-10',
    shadowType: 'drop',
  };
  
  effectsState.semanticTokens.push(newToken);
  saveEffectsState();
  refreshEffectsUI();
  
  addPendingChange({
    module: 'effects',
    type: 'add',
    category: activeEffectsCategory,
    name: newToken.path,
    newValue: 'new shadow effect',
  });
}

function deleteEffectToken(tokenId: string): void {
  const idx = effectsState.semanticTokens.findIndex(t => t.id === tokenId);
  if (idx > -1) {
    const token = effectsState.semanticTokens[idx];
    effectsState.semanticTokens.splice(idx, 1);
    saveEffectsState();
    refreshEffectsUI();
    
    addPendingChange({
      module: 'effects',
      type: 'delete',
      category: token.category,
      name: token.path,
      oldValue: token.name,
    });
  }
}

function exportEffectsPrimitives(): void {
  parent.postMessage({
    pluginMessage: {
      type: 'create-effects-primitives',
      payload: {
        shadowOffsetX: effectsState.shadowOffsetX,
        shadowOffsetY: effectsState.shadowOffsetY,
        shadowBlur: effectsState.shadowBlur,
        shadowSpread: effectsState.shadowSpread,
        shadowColors: effectsState.shadowColors,
        blurs: effectsState.blurs,
        opacities: effectsState.opacities,
      }
    }
  }, '*');
}

function exportEffectsSemantic(): void {
  parent.postMessage({
    pluginMessage: {
      type: 'create-effects-semantic',
      payload: {
        semanticTokens: effectsState.semanticTokens,
      }
    }
  }, '*');
}

function exportEffectStyles(): void {
  // Prepare styles data with resolved primitive values
  const stylesData = effectsState.semanticTokens
    .filter(token => token.offsetX !== undefined || token.backdropBlur !== undefined)
    .map(token => {
      if (token.offsetX !== undefined) {
        // Shadow token
        const offsetX = effectsState.shadowOffsetX.find(p => p.name === token.offsetX)?.value || 0;
        const offsetY = effectsState.shadowOffsetY.find(p => p.name === token.offsetY)?.value || 0;
        const blur = effectsState.shadowBlur.find(p => p.name === token.blur)?.value || 0;
        const spread = effectsState.shadowSpread.find(p => p.name === token.spread)?.value || 0;
        const colorPrim = effectsState.shadowColors.find(p => p.name === token.color);
        
        return {
          name: token.path.replace(/\./g, '/'),
          type: 'shadow' as const,
          shadowType: token.shadowType || 'drop',
          offsetX,
          offsetY,
          blur,
          spread,
          color: colorPrim?.baseColor || 'black',
          opacity: colorPrim?.opacity || 10,
        };
      } else if (token.backdropBlur !== undefined) {
        // Backdrop blur token
        const blurValue = effectsState.blurs.find(p => p.name === token.backdropBlur)?.value || 0;
        
        return {
          name: token.path.replace(/\./g, '/'),
          type: 'blur' as const,
          blur: blurValue,
        };
      }
      return null;
    })
    .filter(Boolean);
  
  parent.postMessage({
    pluginMessage: {
      type: 'create-effects-styles',
      payload: {
        styles: stylesData,
      }
    }
  }, '*');
}

function refreshEffectsUI(): void {
  const container = document.querySelector('.effects-generator');
  if (container) {
    container.outerHTML = renderEffectsGenerator();
    const newContainer = document.querySelector('.effects-generator');
    if (newContainer) {
      initEffectsEvents(newContainer as HTMLElement);
    }
  }
}

// ============================================
// INIT
// ============================================

export async function initEffectsUI(): Promise<void> {
  const container = document.querySelector('.effects-container');
  if (!container) {
    console.warn('[Effects] Container .effects-container not found');
    return;
  }
  
  // Load saved state
  await loadEffectsState();
  
  // Render initial UI
  container.innerHTML = renderEffectsGenerator();
  
  // Setup event listeners
  const effectsEl = container.querySelector('.effects-generator');
  if (effectsEl) {
    initEffectsEvents(effectsEl as HTMLElement);
  }
  
  console.log('[Effects] UI initialized');
}

// ============================================
// EXPORTS
// ============================================

export { effectsState };
