/**
 * Spacing Generator UI
 * 2-tier architecture with device modes
 * 
 * Level 1: Primitives (space.0, space.4...) → Primitives collection
 * Level 2: Semantic (spacing.button.default.paddingX) → Spacing collection with Desktop/Tablet/Mobile modes
 */

import {
  SpacingState,
  SpacingPrimitive,
  DeviceSpacingToken,
  SpacingCategory,
  SPACING_CATEGORIES,
  CustomSpacingCategory,
  createDefaultSpacingState,
  generateSpacingTokenId,
  getTokensByCategory,
} from '../types/spacing-tokens';

import { storageGet, storageSet, storageDelete, STORAGE_KEYS } from './storage-utils';
import { addPendingChange } from './token-manager-ui';

// ============================================
// STATE
// ============================================

let spacingState: SpacingState = createDefaultSpacingState();
let activeCategory: SpacingCategory | string = 'button';
let activeTab: 'primitives' | 'semantic' | 'export' = 'primitives';

// ============================================
// INIT
// ============================================

export function initSpacingUI(): void {
  // First render with defaults
  renderPrimitives();
  renderCategoryTabs();
  renderSemanticTokens();
  
  // Tab switching (uses typo-tab class like Typography)
  const tabBtns = document.querySelectorAll('.typo-tab[data-spacing-tab]');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-spacing-tab');
      if (tabId) {
        const tab = tabId.replace('spacing-', '') as 'primitives' | 'semantic' | 'export';
        setActiveTab(tab);
      }
    });
  });
  
  // Export buttons
  const exportPrimBtn = document.getElementById('export-spacing-primitives');
  if (exportPrimBtn) {
    exportPrimBtn.addEventListener('click', () => exportPrimitivesToFigma());
  }
  
  const exportSemanticBtn = document.getElementById('export-spacing-semantic');
  if (exportSemanticBtn) {
    exportSemanticBtn.addEventListener('click', () => exportSemanticToFigma());
  }
  
  const exportAllBtn = document.getElementById('export-spacing-all');
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', () => {
      exportPrimitivesToFigma();
      setTimeout(() => exportSemanticToFigma(), 500);
    });
  }
  
  // Generate primitives button
  const generatePrimBtn = document.getElementById('btn-generate-spacing-primitives');
  if (generatePrimBtn) {
    generatePrimBtn.addEventListener('click', () => exportPrimitivesToFigma());
  }
  
  // Then load saved state asynchronously
  loadSpacingState().then(() => {
    renderPrimitives();
    renderCategoryTabs();
    renderSemanticTokens();
  });
}

// ============================================
// TAB MANAGEMENT
// ============================================

function setActiveTab(tab: 'primitives' | 'semantic' | 'export'): void {
  activeTab = tab;
  
  // Get the Spacing container to scope our selectors
  const container = document.getElementById('prim-spacing');
  if (!container) return;
  
  // Update tab buttons (only within Spacing container)
  const tabs = container.querySelectorAll('.typo-tab[data-spacing-tab]');
  tabs.forEach(t => {
    const tabId = t.getAttribute('data-spacing-tab');
    t.classList.toggle('active', tabId === `spacing-${tab}`);
  });
  
  // Update content panels (only within Spacing container)
  const contents = container.querySelectorAll('.typo-tab-content');
  contents.forEach(c => c.classList.remove('active'));
  
  const activePanel = document.getElementById(`spacing-${tab}`);
  if (activePanel) activePanel.classList.add('active');
}

// ============================================
// PRIMITIVES RENDER
// ============================================

function renderPrimitives(): void {
  const container = document.getElementById('spacing-primitives-grid');
  if (!container) return;
  
  const enabledCount = spacingState.primitives.filter(p => p.enabled).length;
  const totalCount = spacingState.primitives.length;
  
  // Update counter
  const counter = document.getElementById('spacing-primitives-count');
  if (counter) counter.textContent = `${enabledCount}/${totalCount}`;
  
  container.innerHTML = spacingState.primitives.map(prim => `
    <div class="spacing-prim-item ${prim.enabled ? 'enabled' : ''}" data-name="${prim.name}">
      <span class="prim-value">${prim.value}</span>
      <span class="prim-name">space.${prim.name}</span>
    </div>
  `).join('');
  
  // Click handlers
  container.querySelectorAll('.spacing-prim-item').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.getAttribute('data-name');
      if (name) togglePrimitive(name);
    });
  });
}

function togglePrimitive(name: string): void {
  const prim = spacingState.primitives.find(p => p.name === name);
  if (prim) {
    prim.enabled = !prim.enabled;
    saveSpacingState();
    renderPrimitives();
  }
}

// ============================================
// CATEGORY TABS
// ============================================

function renderCategoryTabs(): void {
  const container = document.getElementById('spacing-category-tabs');
  if (!container) return;
  
  const defaultCategories = Object.keys(SPACING_CATEGORIES) as SpacingCategory[];
  const customCategories = spacingState.customCategories || [];
  
  container.innerHTML = `
    ${defaultCategories.map(cat => {
      const info = SPACING_CATEGORIES[cat];
      const count = getTokensByCategory(spacingState.semanticTokens, cat).length;
      return `
        <button class="category-tab ${cat === activeCategory ? 'active' : ''}" 
                data-category="${cat}" title="${info.description}">
          ${info.label} <span class="count">(${count})</span>
        </button>
      `;
    }).join('')}
    ${customCategories.map(cat => {
      const count = spacingState.semanticTokens.filter(t => t.category === cat.id).length;
      return `
        <button class="category-tab custom-category ${cat.id === activeCategory ? 'active' : ''}" 
                data-category="${cat.id}" title="${cat.description}">
          ${cat.icon} ${cat.name} <span class="count">(${count})</span>
          <span class="btn-delete-category" data-category-id="${cat.id}" title="Удалить категорию">×</span>
        </button>
      `;
    }).join('')}
    <button class="category-tab add-category-btn" id="spacing-add-category" title="Добавить категорию">+</button>
  `;
  
  // Click handlers
  container.querySelectorAll('.category-tab[data-category]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Ignore if clicking delete button
      if ((e.target as HTMLElement).classList.contains('btn-delete-category')) return;
      const cat = btn.getAttribute('data-category');
      if (cat) setActiveCategory(cat);
    });
  });
  
  // Delete category handlers
  container.querySelectorAll('.btn-delete-category').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const catId = (btn as HTMLElement).dataset.categoryId;
      if (catId) deleteCustomCategory(catId);
    });
  });
  
  // Add category button
  const addBtn = document.getElementById('spacing-add-category');
  if (addBtn) {
    addBtn.addEventListener('click', () => showAddCategoryDialog());
  }
}

function setActiveCategory(category: string): void {
  activeCategory = category;
  renderCategoryTabs();
  renderSemanticTokens();
}

// ============================================
// SEMANTIC TOKENS RENDER
// ============================================

function renderSemanticTokens(): void {
  const container = document.getElementById('spacing-semantic-list');
  if (!container) return;
  
  // Support both default and custom categories
  const isCustomCategory = !Object.keys(SPACING_CATEGORIES).includes(activeCategory);
  const tokens = isCustomCategory 
    ? spacingState.semanticTokens.filter(t => t.category === activeCategory)
    : getTokensByCategory(spacingState.semanticTokens, activeCategory as SpacingCategory);
  
  const categoryInfo = isCustomCategory
    ? spacingState.customCategories?.find(c => c.id === activeCategory)
    : SPACING_CATEGORIES[activeCategory as SpacingCategory];
  const categoryLabel = isCustomCategory 
    ? (categoryInfo as CustomSpacingCategory)?.name || activeCategory
    : (categoryInfo as { label: string })?.label || activeCategory;
  
  // Update total count
  const totalCounter = document.getElementById('spacing-semantic-count');
  if (totalCounter) totalCounter.textContent = `${spacingState.semanticTokens.length}`;
  
  if (tokens.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Нет токенов в категории "${categoryLabel}"</p>
        <button class="btn btn-primary" id="add-first-semantic-btn">+ Добавить токен</button>
      </div>
    `;
    const addBtn = document.getElementById('add-first-semantic-btn');
    if (addBtn) addBtn.addEventListener('click', () => addSemanticToken());
    return;
  }
  
  // Get enabled primitives for select options
  const primOptions = spacingState.primitives
    .filter(p => p.enabled)
    .map(p => `<option value="${p.name}">${p.value}px (space.${p.name})</option>`)
    .join('');
  
  container.innerHTML = `
    <div class="semantic-table">
      <div class="semantic-table-header">
        <div class="col-path">Путь токена</div>
        <div class="col-device">Desktop</div>
        <div class="col-device">Tablet</div>
        <div class="col-device">Mobile</div>
        <div class="col-actions"></div>
      </div>
      ${tokens.map(token => `
        <div class="semantic-token-row" data-token-id="${token.id}">
          <div class="col-path">
            <input type="text" class="token-path-input" value="${token.path}" data-field="path" />
          </div>
          <div class="col-device">
            <select class="device-select" data-field="desktop">
              ${primOptions.replace(`value="${token.desktop}"`, `value="${token.desktop}" selected`)}
            </select>
          </div>
          <div class="col-device">
            <select class="device-select" data-field="tablet">
              ${primOptions.replace(`value="${token.tablet}"`, `value="${token.tablet}" selected`)}
            </select>
          </div>
          <div class="col-device">
            <select class="device-select" data-field="mobile">
              ${primOptions.replace(`value="${token.mobile}"`, `value="${token.mobile}" selected`)}
            </select>
          </div>
          <div class="col-actions">
            <button class="btn-icon delete-token-btn" title="Удалить">×</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="semantic-toolbar">
      <button class="btn btn-secondary" id="add-semantic-token-btn">+ Добавить токен</button>
    </div>
  `;
  
  attachSemanticListeners(container);
}

function attachSemanticListeners(container: HTMLElement): void {
  // Path inputs
  container.querySelectorAll('.token-path-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const row = target.closest('.semantic-token-row');
      const tokenId = row?.getAttribute('data-token-id');
      if (tokenId) updateSemanticToken(tokenId, 'path', target.value);
    });
  });
  
  // Device selects
  container.querySelectorAll('.device-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      const row = target.closest('.semantic-token-row');
      const tokenId = row?.getAttribute('data-token-id');
      const field = target.dataset.field as 'desktop' | 'tablet' | 'mobile';
      if (tokenId && field) updateSemanticToken(tokenId, field, target.value);
    });
  });
  
  // Delete buttons
  container.querySelectorAll('.delete-token-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const row = (e.target as HTMLElement).closest('.semantic-token-row');
      const tokenId = row?.getAttribute('data-token-id');
      if (tokenId) deleteSemanticToken(tokenId);
    });
  });
  
  // Add button
  const addBtn = document.getElementById('add-semantic-token-btn');
  if (addBtn) addBtn.addEventListener('click', () => addSemanticToken());
}

// ============================================
// SEMANTIC CRUD
// ============================================

function addSemanticToken(): void {
  const newToken: DeviceSpacingToken = {
    id: generateSpacingTokenId(),
    path: `spacing.${activeCategory}.new.padding`,
    category: activeCategory as SpacingCategory,
    desktop: '16',
    tablet: '14',
    mobile: '12',
  };
  
  spacingState.semanticTokens.push(newToken);
  saveSpacingState();
  renderCategoryTabs();
  renderSemanticTokens();
  
  // Track change
  addPendingChange({
    module: 'spacing',
    type: 'add',
    category: activeCategory,
    name: newToken.path,
    newValue: `D:${newToken.desktop} T:${newToken.tablet} M:${newToken.mobile}`,
  });
}

function updateSemanticToken(tokenId: string, field: 'path' | 'desktop' | 'tablet' | 'mobile', value: string): void {
  const token = spacingState.semanticTokens.find(t => t.id === tokenId);
  if (token) {
    const oldValue = (token as any)[field];
    (token as any)[field] = value;
    saveSpacingState();
    
    // Track change
    addPendingChange({
      module: 'spacing',
      type: 'update',
      category: token.category,
      name: token.path,
      oldValue: String(oldValue),
      newValue: String(value),
      details: field,
    });
  }
}

function deleteSemanticToken(tokenId: string): void {
  const index = spacingState.semanticTokens.findIndex(t => t.id === tokenId);
  if (index > -1) {
    const token = spacingState.semanticTokens[index];
    spacingState.semanticTokens.splice(index, 1);
    saveSpacingState();
    renderCategoryTabs();
    renderSemanticTokens();
    
    // Track change
    addPendingChange({
      module: 'spacing',
      type: 'delete',
      category: token.category,
      name: token.path,
      oldValue: `D:${token.desktop} T:${token.tablet} M:${token.mobile}`,
    });
  }
}

// ============================================
// CUSTOM CATEGORY MANAGEMENT
// ============================================

function addCustomCategory(name: string, icon: string = '📁'): void {
  const id = `custom-${Date.now()}`;
  const newCategory: CustomSpacingCategory = {
    id,
    name,
    icon,
    description: `Custom category: ${name}`,
  };
  
  if (!spacingState.customCategories) {
    spacingState.customCategories = [];
  }
  spacingState.customCategories.push(newCategory);
  saveSpacingState();
  renderCategoryTabs();
}

function deleteCustomCategory(categoryId: string): void {
  if (!spacingState.customCategories) return;
  
  // Check if there are tokens in this category
  const tokensInCategory = spacingState.semanticTokens.filter(t => t.category === categoryId);
  if (tokensInCategory.length > 0) {
    if (!confirm(`В категории есть ${tokensInCategory.length} токенов. Удалить категорию и все токены?`)) {
      return;
    }
    // Remove tokens
    spacingState.semanticTokens = spacingState.semanticTokens.filter(t => t.category !== categoryId);
  }
  
  spacingState.customCategories = spacingState.customCategories.filter(c => c.id !== categoryId);
  saveSpacingState();
  
  // Switch to first default category
  activeCategory = 'button';
  renderCategoryTabs();
  renderSemanticTokens();
}

function showAddCategoryDialog(): void {
  const name = prompt('Введите название новой категории:');
  if (name && name.trim()) {
    addCustomCategory(name.trim());
  }
}

// ============================================
// STORAGE (using figma.clientStorage via postMessage)
// ============================================

async function saveSpacingState(): Promise<void> {
  try {
    await storageSet(STORAGE_KEYS.SPACING_STATE, spacingState);
    console.log('[Spacing] State saved');
  } catch (e) {
    console.error('[Spacing] Failed to save state:', e);
  }
}

async function loadSpacingState(): Promise<void> {
  try {
    const saved = await storageGet<SpacingState>(STORAGE_KEYS.SPACING_STATE);
    if (saved) {
      const defaults = createDefaultSpacingState();
      spacingState = {
        ...defaults,
        ...saved,
        primitives: saved.primitives || defaults.primitives,
        semanticTokens: saved.semanticTokens || defaults.semanticTokens,
      };
      console.log('[Spacing] State loaded');
    } else {
      spacingState = createDefaultSpacingState();
      console.log('[Spacing] No saved state, using defaults');
    }
  } catch (e) {
    console.error('[Spacing] Failed to load state:', e);
    spacingState = createDefaultSpacingState();
  }
}

/** Сброс Spacing к дефолтным значениям */
export async function resetSpacingToDefaults(): Promise<void> {
  try {
    await storageDelete(STORAGE_KEYS.SPACING_STATE);
  } catch (e) {
    console.warn('[Spacing] Failed to clear storage:', e);
  }
  
  spacingState = createDefaultSpacingState();
  activeCategory = 'button';
  activeTab = 'primitives';
  
  renderPrimitives();
  renderCategoryTabs();
  renderSemanticTokens();
  
  console.log('[Spacing] Reset to defaults');
}

// ============================================
// EXPORT TO FIGMA
// ============================================

function exportPrimitivesToFigma(): void {
  const enabledPrimitives = spacingState.primitives.filter(p => p.enabled);
  
  if (enabledPrimitives.length === 0) {
    showStatus('⚠️ Нет включенных примитивов');
    return;
  }
  
  parent.postMessage({
    pluginMessage: {
      type: 'create-spacing-primitives',
      payload: {
        primitives: enabledPrimitives.map(p => ({
          name: p.name,
          value: p.value,
        })),
      },
    },
  }, '*');
  
  showStatus(`🔄 Экспорт ${enabledPrimitives.length} примитивов в Primitives...`);
}

function exportSemanticToFigma(): void {
  if (spacingState.semanticTokens.length === 0) {
    showStatus('⚠️ Нет семантических токенов');
    return;
  }
  
  // Build primitive map for value lookup
  const primMap = new Map<string, number>();
  spacingState.primitives.forEach(p => primMap.set(p.name, p.value));
  
  const tokens = spacingState.semanticTokens.map(token => ({
    path: token.path,
    desktop: { ref: token.desktop, value: primMap.get(token.desktop) || 0 },
    tablet: { ref: token.tablet, value: primMap.get(token.tablet) || 0 },
    mobile: { ref: token.mobile, value: primMap.get(token.mobile) || 0 },
  }));
  
  parent.postMessage({
    pluginMessage: {
      type: 'create-spacing-semantic',
      payload: {
        collectionName: 'Spacing',
        tokens,
      },
    },
  }, '*');
  
  showStatus(`🔄 Экспорт ${tokens.length} семантических токенов в Spacing...`);
}

function showStatus(message: string): void {
  const statusEl = document.getElementById('spacing-export-status');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.style.display = 'block';
  }
}

// ============================================
// MESSAGE HANDLER
// ============================================

export function handleSpacingMessage(msg: any): void {
  if (msg.type === 'spacing-primitives-created') {
    showStatus(`✓ Примитивы: ${msg.payload.created} создано, ${msg.payload.updated} обновлено`);
  } else if (msg.type === 'spacing-semantic-created') {
    showStatus(`✓ Семантика: ${msg.payload.created} создано в Spacing`);
  } else if (msg.type === 'spacing-error') {
    showStatus(`✗ Ошибка: ${msg.error}`);
  }
}
