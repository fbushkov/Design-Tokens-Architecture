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
  createDefaultSpacingState,
  generateSpacingTokenId,
  getTokensByCategory,
} from '../types/spacing-tokens';

// ============================================
// STATE
// ============================================

let spacingState: SpacingState = createDefaultSpacingState();
let activeCategory: SpacingCategory = 'button';
let activeTab: 'primitives' | 'semantic' | 'export' = 'primitives';

// ============================================
// INIT
// ============================================

export function initSpacingUI(): void {
  loadSpacingState();
  
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
  
  // Initial render
  renderPrimitives();
  renderCategoryTabs();
  renderSemanticTokens();
  
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
}

// ============================================
// TAB MANAGEMENT
// ============================================

function setActiveTab(tab: 'primitives' | 'semantic' | 'export'): void {
  activeTab = tab;
  
  // Update tab buttons (typo-tab class)
  const tabs = document.querySelectorAll('.typo-tab[data-spacing-tab]');
  tabs.forEach(t => {
    const tabId = t.getAttribute('data-spacing-tab');
    t.classList.toggle('active', tabId === `spacing-${tab}`);
  });
  
  // Update content panels (typo-tab-content class)
  const primitivesPanel = document.getElementById('spacing-primitives');
  const semanticPanel = document.getElementById('spacing-semantic');
  const exportPanel = document.getElementById('spacing-export');
  
  if (primitivesPanel) primitivesPanel.classList.toggle('active', tab === 'primitives');
  if (semanticPanel) semanticPanel.classList.toggle('active', tab === 'semantic');
  if (exportPanel) exportPanel.classList.toggle('active', tab === 'export');
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
  
  const categories = Object.keys(SPACING_CATEGORIES) as SpacingCategory[];
  
  container.innerHTML = categories.map(cat => {
    const info = SPACING_CATEGORIES[cat];
    const count = getTokensByCategory(spacingState.semanticTokens, cat).length;
    return `
      <button class="category-tab ${cat === activeCategory ? 'active' : ''}" 
              data-category="${cat}" title="${info.description}">
        ${info.label} <span class="count">(${count})</span>
      </button>
    `;
  }).join('');
  
  // Click handlers
  container.querySelectorAll('.category-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category') as SpacingCategory;
      setActiveCategory(cat);
    });
  });
}

function setActiveCategory(category: SpacingCategory): void {
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
  
  const tokens = getTokensByCategory(spacingState.semanticTokens, activeCategory);
  const categoryInfo = SPACING_CATEGORIES[activeCategory];
  
  // Update total count
  const totalCounter = document.getElementById('spacing-semantic-count');
  if (totalCounter) totalCounter.textContent = `${spacingState.semanticTokens.length}`;
  
  if (tokens.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Нет токенов в категории "${categoryInfo.label}"</p>
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
    category: activeCategory,
    desktop: '16',
    tablet: '14',
    mobile: '12',
  };
  
  spacingState.semanticTokens.push(newToken);
  saveSpacingState();
  renderCategoryTabs();
  renderSemanticTokens();
}

function updateSemanticToken(tokenId: string, field: 'path' | 'desktop' | 'tablet' | 'mobile', value: string): void {
  const token = spacingState.semanticTokens.find(t => t.id === tokenId);
  if (token) {
    (token as any)[field] = value;
    saveSpacingState();
  }
}

function deleteSemanticToken(tokenId: string): void {
  const index = spacingState.semanticTokens.findIndex(t => t.id === tokenId);
  if (index > -1) {
    spacingState.semanticTokens.splice(index, 1);
    saveSpacingState();
    renderCategoryTabs();
    renderSemanticTokens();
  }
}

// ============================================
// STORAGE
// ============================================

const SPACING_STORAGE_KEY = 'figma_spacing_state_v2';

function saveSpacingState(): void {
  try {
    localStorage.setItem(SPACING_STORAGE_KEY, JSON.stringify(spacingState));
  } catch (e) {
    console.warn('Failed to save spacing state:', e);
  }
}

function loadSpacingState(): void {
  try {
    const saved = localStorage.getItem(SPACING_STORAGE_KEY);
    if (saved) {
      spacingState = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load spacing state:', e);
    spacingState = createDefaultSpacingState();
  }
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
