/**
 * Radius Generator UI
 * 2-tier architecture (like Spacing/Gap)
 * 
 * Level 1: Primitives (radius.0, radius.4...) → Primitives collection
 * Level 2: Semantic (radius.interactive.button) → Radius collection
 */

import {
  RadiusState,
  RadiusPrimitive,
  RadiusSemanticToken,
  RadiusCategory,
  RADIUS_CATEGORIES,
  createDefaultRadiusState,
  getRadiusTokensByCategory,
  getEnabledRadiusPrimitives,
} from '../types/radius-tokens';

import { storageGet, storageSet, storageDelete, STORAGE_KEYS } from './storage-utils';

// ============================================
// STATE
// ============================================

let radiusState: RadiusState = createDefaultRadiusState();
let activeRadiusCategory: RadiusCategory = 'interactive';
let activeRadiusTab: 'primitives' | 'semantic' | 'export' = 'primitives';

// ============================================
// INIT
// ============================================

export function initRadiusUI(): void {
  const container = document.getElementById('prim-radius');
  if (!container) return;
  
  // Render content with defaults first
  renderRadiusPrimitives();
  renderRadiusCategoryTabs();
  renderRadiusSemanticTokens();
  
  // Setup tab switching using event delegation
  container.onclick = (e) => {
    const target = e.target as HTMLElement;
    
    // Tab button click
    const tabBtn = target.closest('.typo-tab[data-radius-tab]') as HTMLElement;
    if (tabBtn) {
      e.preventDefault();
      const tabId = tabBtn.getAttribute('data-radius-tab');
      if (tabId) {
        const tab = tabId.replace('radius-', '') as 'primitives' | 'semantic' | 'export';
        setActiveRadiusTab(tab);
      }
      return;
    }
    
    // Primitive item click
    const primItem = target.closest('.spacing-prim-item[data-radius-primitive]') as HTMLElement;
    if (primItem) {
      const name = primItem.getAttribute('data-radius-primitive');
      if (name) toggleRadiusPrimitive(name);
      return;
    }
    
    // Category tab click
    const catTab = target.closest('.category-tab[data-radius-category]') as HTMLElement;
    if (catTab) {
      const catId = catTab.getAttribute('data-radius-category') as RadiusCategory;
      if (catId) {
        activeRadiusCategory = catId;
        renderRadiusCategoryTabs();
        renderRadiusSemanticTokens();
      }
      return;
    }
    
    // Export buttons
    if (target.id === 'btn-generate-radius-primitives' || target.id === 'export-radius-primitives') {
      exportRadiusPrimitivesToFigma();
      return;
    }
    if (target.id === 'export-radius-semantic') {
      exportRadiusSemanticToFigma();
      return;
    }
    if (target.id === 'export-radius-all') {
      exportRadiusPrimitivesToFigma();
      setTimeout(() => exportRadiusSemanticToFigma(), 500);
      return;
    }
  };
  
  // Load state asynchronously
  loadRadiusState().then(() => {
    renderRadiusPrimitives();
    renderRadiusCategoryTabs();
    renderRadiusSemanticTokens();
  });
}

// ============================================
// TAB MANAGEMENT
// ============================================

function setActiveRadiusTab(tab: 'primitives' | 'semantic' | 'export'): void {
  activeRadiusTab = tab;
  
  const container = document.getElementById('prim-radius');
  if (!container) return;
  
  // Update tab buttons
  const tabs = container.querySelectorAll('.typo-tab[data-radius-tab]');
  tabs.forEach(t => {
    const tabId = t.getAttribute('data-radius-tab');
    t.classList.toggle('active', tabId === `radius-${tab}`);
  });
  
  // Update content panels
  const contents = container.querySelectorAll('.typo-tab-content');
  contents.forEach(c => c.classList.remove('active'));
  
  const activePanel = document.getElementById(`radius-${tab}`);
  if (activePanel) activePanel.classList.add('active');
}

// ============================================
// STATE MANAGEMENT (using figma.clientStorage via postMessage)
// ============================================

async function loadRadiusState(): Promise<void> {
  try {
    const saved = await storageGet<RadiusState>(STORAGE_KEYS.RADIUS_STATE);
    if (saved) {
      const defaults = createDefaultRadiusState();
      radiusState = {
        ...defaults,
        ...saved,
        primitives: saved.primitives || defaults.primitives,
        semanticTokens: saved.semanticTokens || defaults.semanticTokens,
      };
      console.log('[Radius] State loaded');
    } else {
      radiusState = createDefaultRadiusState();
      console.log('[Radius] No saved state, using defaults');
    }
  } catch (e) {
    console.error('[Radius] Failed to load state:', e);
    radiusState = createDefaultRadiusState();
  }
}

async function saveRadiusState(): Promise<void> {
  try {
    await storageSet(STORAGE_KEYS.RADIUS_STATE, radiusState);
    console.log('[Radius] State saved');
  } catch (e) {
    console.error('[Radius] Failed to save state:', e);
  }
}

/** Сброс Radius к дефолтным значениям */
export async function resetRadiusToDefaults(): Promise<void> {
  try {
    await storageDelete(STORAGE_KEYS.RADIUS_STATE);
  } catch (e) {
    console.warn('[Radius] Failed to clear storage:', e);
  }
  
  radiusState = createDefaultRadiusState();
  activeRadiusCategory = 'interactive';
  activeRadiusTab = 'primitives';
  
  renderRadiusPrimitives();
  renderRadiusCategoryTabs();
  renderRadiusSemanticTokens();
  
  console.log('[Radius] Reset to defaults');
}

// ============================================
// RENDER PRIMITIVES
// ============================================

function renderRadiusPrimitives(): void {
  const grid = document.getElementById('radius-primitives-grid');
  if (!grid) return;
  
  grid.innerHTML = radiusState.primitives.map(prim => {
    const displayValue = prim.name === 'full' ? '∞' : prim.value;
    return `
      <div class="spacing-prim-item ${prim.enabled ? 'enabled' : ''}" 
           data-radius-primitive="${prim.name}"
           title="radius.${prim.name} = ${prim.value}px">
        <span class="prim-value">${displayValue}</span>
        <span class="prim-name">radius.${prim.name}</span>
      </div>
    `;
  }).join('');
  
  updateRadiusPrimitivesCount();
}

function toggleRadiusPrimitive(name: string): void {
  const prim = radiusState.primitives.find(p => p.name === name);
  if (prim) {
    prim.enabled = !prim.enabled;
    saveRadiusState();
    renderRadiusPrimitives();
    renderRadiusSemanticTokens();
  }
}

function updateRadiusPrimitivesCount(): void {
  const countEl = document.getElementById('radius-primitives-count');
  if (countEl) {
    const enabled = radiusState.primitives.filter(p => p.enabled).length;
    const total = radiusState.primitives.length;
    countEl.textContent = `${enabled}/${total}`;
  }
}

// ============================================
// RENDER CATEGORY TABS
// ============================================

function renderRadiusCategoryTabs(): void {
  const container = document.getElementById('radius-category-tabs');
  if (!container) return;
  
  const categories = Object.keys(RADIUS_CATEGORIES) as RadiusCategory[];
  
  container.innerHTML = categories.map(cat => {
    const info = RADIUS_CATEGORIES[cat];
    const count = getRadiusTokensByCategory(radiusState.semanticTokens, cat).length;
    return `
      <button class="category-tab ${cat === activeRadiusCategory ? 'active' : ''}" 
              data-radius-category="${cat}" title="${info.description}">
        ${info.icon} ${info.label} <span class="count">(${count})</span>
      </button>
    `;
  }).join('');
}

// ============================================
// RENDER SEMANTIC TOKENS
// ============================================

function renderRadiusSemanticTokens(): void {
  const container = document.getElementById('radius-semantic-list');
  if (!container) return;
  
  const tokens = getRadiusTokensByCategory(radiusState.semanticTokens, activeRadiusCategory);
  const categoryInfo = RADIUS_CATEGORIES[activeRadiusCategory];
  
  // Update total count
  const totalCounter = document.getElementById('radius-semantic-count');
  if (totalCounter) totalCounter.textContent = `${radiusState.semanticTokens.length}`;
  
  if (tokens.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Нет токенов в категории "${categoryInfo.label}"</p>
      </div>
    `;
    return;
  }
  
  // Get enabled primitives for select options
  const primOptions = radiusState.primitives
    .filter(p => p.enabled)
    .map(p => {
      const displayValue = p.name === 'full' ? '9999px (full)' : `${p.value}px`;
      return `<option value="${p.name}">${displayValue} (radius.${p.name})</option>`;
    })
    .join('');
  
  container.innerHTML = `
    <div class="semantic-table">
      <div class="semantic-table-header">
        <div class="col-path" style="flex: 2;">Путь токена</div>
        <div class="col-device" style="flex: 1;">Значение</div>
        <div class="col-preview" style="flex: 0 0 60px;">Превью</div>
      </div>
      ${tokens.map(token => {
        const prim = radiusState.primitives.find(p => p.name === token.primitiveRef);
        const radiusValue = prim ? prim.value : 0;
        // For preview, limit to 20px max for visual purposes
        const previewRadius = radiusValue === 9999 ? '50%' : `${Math.min(radiusValue, 20)}px`;
        
        return `
          <div class="semantic-token-row" data-token-id="${token.id}">
            <div class="col-path" style="flex: 2;">
              <span class="token-path-display">${token.path}</span>
            </div>
            <div class="col-device" style="flex: 1;">
              <select class="device-select" data-field="primitiveRef" data-token-id="${token.id}">
                ${primOptions.replace(`value="${token.primitiveRef}"`, `value="${token.primitiveRef}" selected`)}
              </select>
            </div>
            <div class="col-preview" style="flex: 0 0 60px; display: flex; justify-content: center;">
              <div class="radius-preview-box" style="
                width: 40px; 
                height: 40px; 
                background: var(--color-primary); 
                border-radius: ${previewRadius};
                opacity: 0.8;
              "></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  // Add change handlers for selects
  container.querySelectorAll('.device-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const sel = e.target as HTMLSelectElement;
      const tokenId = sel.getAttribute('data-token-id');
      const value = sel.value;
      
      if (tokenId) {
        updateRadiusTokenPrimitive(tokenId, value);
      }
    });
  });
}

function updateRadiusTokenPrimitive(tokenId: string, value: string): void {
  const token = radiusState.semanticTokens.find(t => t.id === tokenId);
  if (token) {
    token.primitiveRef = value;
    saveRadiusState();
    renderRadiusSemanticTokens(); // Re-render to update preview
  }
}

// ============================================
// EXPORT TO FIGMA
// ============================================

function exportRadiusPrimitivesToFigma(): void {
  const enabledPrimitives = getEnabledRadiusPrimitives(radiusState.primitives);
  
  parent.postMessage({
    pluginMessage: {
      type: 'create-radius-primitives',
      primitives: enabledPrimitives.map(p => ({
        name: p.name,
        value: p.value,
      })),
    }
  }, '*');
  
  showRadiusExportStatus('Примитивы radius отправлены в Figma...', 'info');
}

function exportRadiusSemanticToFigma(): void {
  parent.postMessage({
    pluginMessage: {
      type: 'create-radius-semantic',
      tokens: radiusState.semanticTokens.map(t => ({
        id: t.id,
        path: t.path,
        primitiveRef: t.primitiveRef,
      })),
    }
  }, '*');
  
  showRadiusExportStatus('Семантические токены radius отправлены в Figma...', 'info');
}

function showRadiusExportStatus(message: string, type: 'info' | 'success' | 'error'): void {
  const statusEl = document.getElementById('radius-export-status');
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
  
  if (msg.type === 'radius-primitives-created') {
    showRadiusExportStatus(`✅ Создано ${msg.count} примитивов radius`, 'success');
  } else if (msg.type === 'radius-semantic-created') {
    showRadiusExportStatus(`✅ Создано ${msg.count} семантических токенов radius`, 'success');
  } else if (msg.type === 'radius-error') {
    showRadiusExportStatus(`❌ Ошибка: ${msg.error}`, 'error');
  }
});
