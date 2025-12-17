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
  CustomRadiusCategory,
  createDefaultRadiusState,
  getRadiusTokensByCategory,
  getEnabledRadiusPrimitives,
} from '../types/radius-tokens';

import { storageGet, storageSet, storageDelete, STORAGE_KEYS } from './storage-utils';
import { addPendingChange } from './token-manager-ui';

// ============================================
// STATE
// ============================================

let radiusState: RadiusState = createDefaultRadiusState();
let activeRadiusCategory: RadiusCategory | string = 'interactive';
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
    
    // Delete category button
    const deleteBtn = target.closest('.btn-delete-category') as HTMLElement;
    if (deleteBtn) {
      e.stopPropagation();
      const catId = deleteBtn.dataset.categoryId;
      if (catId) deleteCustomRadiusCategory(catId);
      return;
    }
    
    // Add category button
    if (target.id === 'radius-add-category' || target.closest('#radius-add-category')) {
      showAddRadiusCategoryDialog();
      return;
    }
    
    // Category tab click
    const catTab = target.closest('.category-tab[data-radius-category]') as HTMLElement;
    if (catTab) {
      const catId = catTab.getAttribute('data-radius-category');
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
  
  const defaultCategories = Object.keys(RADIUS_CATEGORIES) as RadiusCategory[];
  const customCategories = radiusState.customCategories || [];
  
  container.innerHTML = `
    ${defaultCategories.map(cat => {
      const info = RADIUS_CATEGORIES[cat];
      const count = getRadiusTokensByCategory(radiusState.semanticTokens, cat).length;
      return `
        <button class="category-tab ${cat === activeRadiusCategory ? 'active' : ''}" 
                data-radius-category="${cat}" title="${info.description}">
          ${info.icon} ${info.label} <span class="count">(${count})</span>
        </button>
      `;
    }).join('')}
    ${customCategories.map(cat => {
      const count = radiusState.semanticTokens.filter(t => t.category === cat.id).length;
      return `
        <button class="category-tab custom-category ${cat.id === activeRadiusCategory ? 'active' : ''}" 
                data-radius-category="${cat.id}" title="${cat.description}">
          ${cat.icon} ${cat.name} <span class="count">(${count})</span>
          <span class="btn-delete-category" data-category-id="${cat.id}" title="Удалить">×</span>
        </button>
      `;
    }).join('')}
    <button class="category-tab add-category-btn" id="radius-add-category" title="Добавить категорию">+</button>
  `;
}

// ============================================
// CUSTOM CATEGORY MANAGEMENT
// ============================================

function addCustomRadiusCategory(name: string, icon: string = '📁'): void {
  const id = `custom-${Date.now()}`;
  const newCategory: CustomRadiusCategory = {
    id,
    name,
    icon,
    description: `Custom category: ${name}`,
  };
  
  if (!radiusState.customCategories) {
    radiusState.customCategories = [];
  }
  radiusState.customCategories.push(newCategory);
  saveRadiusState();
  renderRadiusCategoryTabs();
}

function deleteCustomRadiusCategory(categoryId: string): void {
  if (!radiusState.customCategories) return;
  
  const tokensInCategory = radiusState.semanticTokens.filter(t => t.category === categoryId);
  if (tokensInCategory.length > 0) {
    if (!confirm(`В категории есть ${tokensInCategory.length} токенов. Удалить категорию и все токены?`)) {
      return;
    }
    radiusState.semanticTokens = radiusState.semanticTokens.filter(t => t.category !== categoryId);
  }
  
  radiusState.customCategories = radiusState.customCategories.filter(c => c.id !== categoryId);
  saveRadiusState();
  
  activeRadiusCategory = 'interactive';
  renderRadiusCategoryTabs();
  renderRadiusSemanticTokens();
}

function showAddRadiusCategoryDialog(): void {
  const name = prompt('Введите название новой категории:');
  if (name && name.trim()) {
    addCustomRadiusCategory(name.trim());
  }
}

// ============================================
// RENDER SEMANTIC TOKENS
// ============================================

function renderRadiusSemanticTokens(): void {
  const container = document.getElementById('radius-semantic-list');
  if (!container) return;
  
  const isCustomCategory = !Object.keys(RADIUS_CATEGORIES).includes(activeRadiusCategory);
  const tokens = isCustomCategory
    ? radiusState.semanticTokens.filter(t => t.category === activeRadiusCategory)
    : getRadiusTokensByCategory(radiusState.semanticTokens, activeRadiusCategory as RadiusCategory);
  
  const categoryInfo = isCustomCategory
    ? radiusState.customCategories?.find(c => c.id === activeRadiusCategory)
    : RADIUS_CATEGORIES[activeRadiusCategory as RadiusCategory];
  const categoryLabel = isCustomCategory
    ? (categoryInfo as CustomRadiusCategory)?.name || activeRadiusCategory
    : (categoryInfo as { label: string })?.label || activeRadiusCategory;
  
  // Update total count
  const totalCounter = document.getElementById('radius-semantic-count');
  if (totalCounter) totalCounter.textContent = `${radiusState.semanticTokens.length}`;
  
  if (tokens.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Нет токенов в категории "${categoryLabel}"</p>
        <button class="btn btn-primary" id="radius-add-first-token">+ Добавить токен</button>
      </div>
    `;
    const addBtn = document.getElementById('radius-add-first-token');
    if (addBtn) addBtn.addEventListener('click', () => addRadiusSemanticToken());
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
        <div class="col-actions" style="flex: 0 0 40px;"></div>
      </div>
      ${tokens.map(token => {
        const prim = radiusState.primitives.find(p => p.name === token.primitiveRef);
        const radiusValue = prim ? prim.value : 0;
        // For preview, limit to 20px max for visual purposes
        const previewRadius = radiusValue === 9999 ? '50%' : `${Math.min(radiusValue, 20)}px`;
        
        return `
          <div class="semantic-token-row" data-token-id="${token.id}">
            <div class="col-path" style="flex: 2;">
              <input type="text" class="token-path-input" value="${token.path}" data-field="path" />
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
            <div class="col-actions" style="flex: 0 0 40px;">
              <button class="btn-icon delete-token-btn" data-token-id="${token.id}" title="Удалить">×</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="semantic-toolbar">
      <button class="btn btn-secondary" id="radius-add-token-btn">+ Добавить токен</button>
    </div>
  `;
  
  // Path input handlers
  container.querySelectorAll('.token-path-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const row = target.closest('.semantic-token-row');
      const tokenId = row?.getAttribute('data-token-id');
      if (tokenId) updateRadiusToken(tokenId, 'path', target.value);
    });
  });
  
  // Add change handlers for selects
  container.querySelectorAll('.device-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const sel = e.target as HTMLSelectElement;
      const tokenId = sel.getAttribute('data-token-id');
      const value = sel.value;
      
      if (tokenId) {
        updateRadiusToken(tokenId, 'primitiveRef', value);
      }
    });
  });
  
  // Delete button handlers
  container.querySelectorAll('.delete-token-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tokenId = (btn as HTMLElement).dataset.tokenId;
      if (tokenId) deleteRadiusSemanticToken(tokenId);
    });
  });
  
  // Add token button
  const addBtn = document.getElementById('radius-add-token-btn');
  if (addBtn) addBtn.addEventListener('click', () => addRadiusSemanticToken());
}

// ============================================
// RADIUS SEMANTIC TOKEN CRUD
// ============================================

function generateRadiusTokenId(): string {
  return `radius-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function addRadiusSemanticToken(): void {
  const newToken: RadiusSemanticToken = {
    id: generateRadiusTokenId(),
    path: `radius.${activeRadiusCategory}.new`,
    category: activeRadiusCategory as RadiusCategory,
    primitiveRef: '8',
  };
  
  radiusState.semanticTokens.push(newToken);
  saveRadiusState();
  renderRadiusCategoryTabs();
  renderRadiusSemanticTokens();
  
  // Track change
  addPendingChange({
    module: 'radius',
    type: 'add',
    category: activeRadiusCategory,
    name: newToken.path,
    newValue: `radius.${newToken.primitiveRef}`,
  });
}

function updateRadiusToken(tokenId: string, field: 'path' | 'primitiveRef', value: string): void {
  const token = radiusState.semanticTokens.find(t => t.id === tokenId);
  if (token) {
    const oldValue = (token as any)[field];
    (token as any)[field] = value;
    saveRadiusState();
    renderRadiusSemanticTokens(); // Re-render to update preview
    
    // Track change
    addPendingChange({
      module: 'radius',
      type: 'update',
      category: token.category,
      name: token.path,
      oldValue: String(oldValue),
      newValue: String(value),
      details: field,
    });
  }
}

function deleteRadiusSemanticToken(tokenId: string): void {
  const index = radiusState.semanticTokens.findIndex(t => t.id === tokenId);
  if (index > -1) {
    const token = radiusState.semanticTokens[index];
    radiusState.semanticTokens.splice(index, 1);
    saveRadiusState();
    renderRadiusCategoryTabs();
    renderRadiusSemanticTokens();
    
    // Track change
    addPendingChange({
      module: 'radius',
      type: 'delete',
      category: token.category,
      name: token.path,
      oldValue: `radius.${token.primitiveRef}`,
    });
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
