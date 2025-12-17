/**
 * Gap Generator UI
 * 2-tier architecture with device modes (like Spacing)
 * 
 * Level 1: Primitives (gap.0, gap.4...) → Primitives collection
 * Level 2: Semantic (gap.inline.icon) → Gap collection with Desktop/Tablet/Mobile modes
 */

import {
  GapState,
  GapPrimitive,
  GapSemanticToken,
  GapCategory,
  GAP_CATEGORIES,
  createDefaultGapState,
  getGapTokensByCategory,
  getEnabledGapPrimitives,
} from '../types/gap-tokens';

import { storageGet, storageSet, storageDelete, STORAGE_KEYS } from './storage-utils';

// ============================================
// STATE
// ============================================

let gapState: GapState = createDefaultGapState();
let activeGapCategory: GapCategory = 'inline';
let activeGapTab: 'primitives' | 'semantic' | 'export' = 'primitives';

// ============================================
// INIT
// ============================================

export function initGapUI(): void {
  const container = document.getElementById('prim-gap');
  if (!container) return;
  
  // Render content with defaults first
  renderGapPrimitives();
  renderGapCategoryTabs();
  renderGapSemanticTokens();
  
  // Setup tab switching using event delegation
  container.onclick = (e) => {
    const target = e.target as HTMLElement;
    
    // Tab button click
    const tabBtn = target.closest('.typo-tab[data-gap-tab]') as HTMLElement;
    if (tabBtn) {
      e.preventDefault();
      const tabId = tabBtn.getAttribute('data-gap-tab');
      if (tabId) {
        const tab = tabId.replace('gap-', '') as 'primitives' | 'semantic' | 'export';
        setActiveGapTab(tab);
      }
      return;
    }
    
    // Primitive item click
    const primItem = target.closest('.spacing-prim-item[data-gap-primitive]') as HTMLElement;
    if (primItem) {
      const name = primItem.getAttribute('data-gap-primitive');
      if (name) toggleGapPrimitive(name);
      return;
    }
    
    // Category tab click
    const catTab = target.closest('.category-tab[data-gap-category]') as HTMLElement;
    if (catTab) {
      const catId = catTab.getAttribute('data-gap-category') as GapCategory;
      if (catId) {
        activeGapCategory = catId;
        renderGapCategoryTabs();
        renderGapSemanticTokens();
      }
      return;
    }
    
    // Export buttons
    if (target.id === 'btn-generate-gap-primitives' || target.id === 'export-gap-primitives') {
      exportGapPrimitivesToFigma();
      return;
    }
    if (target.id === 'export-gap-semantic') {
      exportGapSemanticToFigma();
      return;
    }
    if (target.id === 'export-gap-all') {
      exportGapPrimitivesToFigma();
      setTimeout(() => exportGapSemanticToFigma(), 500);
      return;
    }
  };
  
  // Load state asynchronously
  loadGapState().then(() => {
    renderGapPrimitives();
    renderGapCategoryTabs();
    renderGapSemanticTokens();
  });
}

// ============================================
// TAB MANAGEMENT
// ============================================

function setActiveGapTab(tab: 'primitives' | 'semantic' | 'export'): void {
  activeGapTab = tab;
  
  const container = document.getElementById('prim-gap');
  if (!container) return;
  
  // Update tab buttons
  const tabs = container.querySelectorAll('.typo-tab[data-gap-tab]');
  tabs.forEach(t => {
    const tabId = t.getAttribute('data-gap-tab');
    t.classList.toggle('active', tabId === `gap-${tab}`);
  });
  
  // Update content panels
  const contents = container.querySelectorAll('.typo-tab-content');
  contents.forEach(c => c.classList.remove('active'));
  
  const activePanel = document.getElementById(`gap-${tab}`);
  if (activePanel) activePanel.classList.add('active');
}

// ============================================
// STATE MANAGEMENT (using figma.clientStorage via postMessage)
// ============================================

async function loadGapState(): Promise<void> {
  try {
    const saved = await storageGet<GapState>(STORAGE_KEYS.GAP_STATE);
    if (saved) {
      const defaults = createDefaultGapState();
      gapState = {
        ...defaults,
        ...saved,
        primitives: saved.primitives || defaults.primitives,
        semanticTokens: saved.semanticTokens || defaults.semanticTokens,
      };
      console.log('[Gap] State loaded');
    } else {
      gapState = createDefaultGapState();
      console.log('[Gap] No saved state, using defaults');
    }
  } catch (e) {
    console.error('[Gap] Failed to load state:', e);
    gapState = createDefaultGapState();
  }
}

async function saveGapState(): Promise<void> {
  try {
    await storageSet(STORAGE_KEYS.GAP_STATE, gapState);
    console.log('[Gap] State saved');
  } catch (e) {
    console.error('[Gap] Failed to save state:', e);
  }
}

/** Сброс Gap к дефолтным значениям */
export async function resetGapToDefaults(): Promise<void> {
  try {
    await storageDelete(STORAGE_KEYS.GAP_STATE);
  } catch (e) {
    console.warn('[Gap] Failed to clear storage:', e);
  }
  
  gapState = createDefaultGapState();
  activeGapCategory = 'inline';
  activeGapTab = 'primitives';
  
  renderGapPrimitives();
  renderGapCategoryTabs();
  renderGapSemanticTokens();
  
  console.log('[Gap] Reset to defaults');
}

// ============================================
// RENDER PRIMITIVES
// ============================================

function renderGapPrimitives(): void {
  const grid = document.getElementById('gap-primitives-grid');
  if (!grid) return;
  
  grid.innerHTML = gapState.primitives.map(prim => `
    <div class="spacing-prim-item ${prim.enabled ? 'enabled' : ''}" 
         data-gap-primitive="${prim.name}"
         title="gap.${prim.name} = ${prim.value}px">
      <span class="prim-value">${prim.value}</span>
      <span class="prim-name">gap.${prim.name}</span>
    </div>
  `).join('');
  
  updateGapPrimitivesCount();
}

function toggleGapPrimitive(name: string): void {
  const prim = gapState.primitives.find(p => p.name === name);
  if (prim) {
    prim.enabled = !prim.enabled;
    saveGapState();
    renderGapPrimitives();
    renderGapSemanticTokens();
  }
}

function updateGapPrimitivesCount(): void {
  const countEl = document.getElementById('gap-primitives-count');
  if (countEl) {
    const enabled = gapState.primitives.filter(p => p.enabled).length;
    const total = gapState.primitives.length;
    countEl.textContent = `${enabled}/${total}`;
  }
}

// ============================================
// RENDER CATEGORY TABS
// ============================================

function renderGapCategoryTabs(): void {
  const container = document.getElementById('gap-category-tabs');
  if (!container) return;
  
  const categories = Object.keys(GAP_CATEGORIES) as GapCategory[];
  
  container.innerHTML = categories.map(cat => {
    const info = GAP_CATEGORIES[cat];
    const count = getGapTokensByCategory(gapState.semanticTokens, cat).length;
    return `
      <button class="category-tab ${cat === activeGapCategory ? 'active' : ''}" 
              data-gap-category="${cat}" title="${info.description}">
        ${info.icon} ${info.label} <span class="count">(${count})</span>
      </button>
    `;
  }).join('');
}

// ============================================
// RENDER SEMANTIC TOKENS (with device modes)
// ============================================

function renderGapSemanticTokens(): void {
  const container = document.getElementById('gap-semantic-list');
  if (!container) return;
  
  const tokens = getGapTokensByCategory(gapState.semanticTokens, activeGapCategory);
  const categoryInfo = GAP_CATEGORIES[activeGapCategory];
  
  // Update total count
  const totalCounter = document.getElementById('gap-semantic-count');
  if (totalCounter) totalCounter.textContent = `${gapState.semanticTokens.length}`;
  
  if (tokens.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Нет токенов в категории "${categoryInfo.label}"</p>
      </div>
    `;
    return;
  }
  
  // Get enabled primitives for select options
  const primOptions = gapState.primitives
    .filter(p => p.enabled)
    .map(p => `<option value="${p.name}">${p.value}px (gap.${p.name})</option>`)
    .join('');
  
  container.innerHTML = `
    <div class="semantic-table">
      <div class="semantic-table-header">
        <div class="col-path">Путь токена</div>
        <div class="col-device">Desktop</div>
        <div class="col-device">Tablet</div>
        <div class="col-device">Mobile</div>
      </div>
      ${tokens.map(token => `
        <div class="semantic-token-row" data-token-id="${token.id}">
          <div class="col-path">
            <span class="token-path-display">${token.path}</span>
          </div>
          <div class="col-device">
            <select class="device-select" data-field="desktop" data-token-id="${token.id}">
              ${primOptions.replace(`value="${token.desktop}"`, `value="${token.desktop}" selected`)}
            </select>
          </div>
          <div class="col-device">
            <select class="device-select" data-field="tablet" data-token-id="${token.id}">
              ${primOptions.replace(`value="${token.tablet}"`, `value="${token.tablet}" selected`)}
            </select>
          </div>
          <div class="col-device">
            <select class="device-select" data-field="mobile" data-token-id="${token.id}">
              ${primOptions.replace(`value="${token.mobile}"`, `value="${token.mobile}" selected`)}
            </select>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  // Add change handlers for selects
  container.querySelectorAll('.device-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const sel = e.target as HTMLSelectElement;
      const tokenId = sel.getAttribute('data-token-id');
      const field = sel.getAttribute('data-field') as 'desktop' | 'tablet' | 'mobile';
      const value = sel.value;
      
      if (tokenId && field) {
        updateGapTokenDevice(tokenId, field, value);
      }
    });
  });
}

function updateGapTokenDevice(tokenId: string, field: 'desktop' | 'tablet' | 'mobile', value: string): void {
  const token = gapState.semanticTokens.find(t => t.id === tokenId);
  if (token) {
    token[field] = value;
    saveGapState();
  }
}

// ============================================
// EXPORT TO FIGMA
// ============================================

function exportGapPrimitivesToFigma(): void {
  const enabledPrimitives = getEnabledGapPrimitives(gapState.primitives);
  
  parent.postMessage({
    pluginMessage: {
      type: 'create-gap-primitives',
      primitives: enabledPrimitives.map(p => ({
        name: p.name,
        value: p.value,
      })),
    }
  }, '*');
  
  showGapExportStatus('Примитивы gap отправлены в Figma...', 'info');
}

function exportGapSemanticToFigma(): void {
  parent.postMessage({
    pluginMessage: {
      type: 'create-gap-semantic',
      tokens: gapState.semanticTokens.map(t => ({
        id: t.id,
        path: t.path,
        desktop: t.desktop,
        tablet: t.tablet,
        mobile: t.mobile,
      })),
    }
  }, '*');
  
  showGapExportStatus('Семантические токены gap отправлены в Figma...', 'info');
}

function showGapExportStatus(message: string, type: 'info' | 'success' | 'error'): void {
  const statusEl = document.getElementById('gap-export-status');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `export-status ${type}`;
    statusEl.style.display = 'block';
    
    if (type !== 'error') {
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 3000);
    }
  }
}

// Listen for messages from plugin
window.addEventListener('message', (event) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;
  
  if (msg.type === 'gap-primitives-created') {
    showGapExportStatus(`✅ Создано ${msg.count} примитивов gap`, 'success');
  } else if (msg.type === 'gap-semantic-created') {
    showGapExportStatus(`✅ Создано ${msg.count} семантических токенов gap`, 'success');
  } else if (msg.type === 'gap-error') {
    showGapExportStatus(`❌ Ошибка: ${msg.error}`, 'error');
  }
});
