/**
 * Grid Generator UI
 * 2-tier architecture with device modes (like Gap/Spacing)
 * 
 * Level 1: Primitives (grid.gutter.*, grid.margin.*, grid.container.*) → Primitives collection
 * Level 2: Semantic (layout.grid.page.*) → Grid collection with Desktop/Tablet/Mobile modes
 * 
 * Grid примитивы НЕЗАВИСИМЫ от Gap и Spacing!
 */

import {
  GridState,
  GridPrimitive,
  GridSemanticToken,
  GridCategory,
  GridAlignment,
  GridLayoutConfig,
  GRID_CATEGORIES,
  CustomGridCategory,
  createDefaultGridState,
  getGridTokensByCategory,
  getEnabledGridPrimitives,
  generateGridTokenId,
} from '../types/grid-tokens';

import { storageGet, storageSet, storageDelete, STORAGE_KEYS } from './storage-utils';
import { addPendingChange } from './token-manager-ui';

// ============================================
// STATE
// ============================================

let gridState: GridState = createDefaultGridState();
let activeGridCategory: GridCategory | string = 'page';
let activeGridTab: 'primitives' | 'semantic' | 'export' = 'primitives';
let activePrimitiveType: 'gutter' | 'margin' | 'container' = 'gutter';

// ============================================
// INIT
// ============================================

export function initGridUI(): void {
  const container = document.getElementById('prim-grid');
  if (!container) return;
  
  // Render content with defaults first
  renderGridPrimitives();
  renderGridCategoryTabs();
  renderGridSemanticTokens();
  
  // Setup tab switching using event delegation
  container.onclick = (e) => {
    const target = e.target as HTMLElement;
    
    // Tab button click (main tabs: primitives/semantic/export)
    const tabBtn = target.closest('.typo-tab[data-grid-tab]') as HTMLElement;
    if (tabBtn) {
      e.preventDefault();
      const tabId = tabBtn.getAttribute('data-grid-tab');
      if (tabId) {
        const tab = tabId.replace('grid-', '') as 'primitives' | 'semantic' | 'export';
        setActiveGridTab(tab);
      }
      return;
    }
    
    // Primitive type tab click (gutter/margin/container)
    const primTypeTab = target.closest('.primitive-type-tab') as HTMLElement;
    if (primTypeTab) {
      const type = primTypeTab.getAttribute('data-prim-type') as 'gutter' | 'margin' | 'container';
      if (type) {
        activePrimitiveType = type;
        renderGridPrimitives();
      }
      return;
    }
    
    // Primitive item click
    const primItem = target.closest('.spacing-prim-item[data-grid-primitive]') as HTMLElement;
    if (primItem) {
      const name = primItem.getAttribute('data-grid-primitive');
      if (name) toggleGridPrimitive(name);
      return;
    }
    
    // Delete category button
    const deleteBtn = target.closest('.btn-delete-category') as HTMLElement;
    if (deleteBtn) {
      e.stopPropagation();
      const catId = deleteBtn.dataset.categoryId;
      if (catId) deleteCustomGridCategory(catId);
      return;
    }
    
    // Add category button
    if (target.id === 'grid-add-category' || target.closest('#grid-add-category')) {
      showAddGridCategoryDialog();
      return;
    }
    
    // Category tab click
    const catTab = target.closest('.category-tab[data-grid-category]') as HTMLElement;
    if (catTab) {
      const catId = catTab.getAttribute('data-grid-category');
      if (catId) {
        activeGridCategory = catId;
        renderGridCategoryTabs();
        renderGridSemanticTokens();
      }
      return;
    }
    
    // Export buttons
    if (target.id === 'btn-generate-grid-primitives' || target.id === 'export-grid-primitives') {
      exportGridPrimitivesToFigma();
      return;
    }
    if (target.id === 'export-grid-semantic') {
      exportGridSemanticToFigma();
      return;
    }
    if (target.id === 'export-grid-all') {
      exportGridPrimitivesToFigma();
      setTimeout(() => exportGridSemanticToFigma(), 500);
      return;
    }
    if (target.id === 'btn-apply-grid-to-frame') {
      applyGridToSelectedFrame();
      return;
    }
    if (target.id === 'btn-create-grid-components') {
      createGridComponents();
      return;
    }
  };
  
  // Load state asynchronously
  loadGridState().then(() => {
    renderGridPrimitives();
    renderGridCategoryTabs();
    renderGridSemanticTokens();
  });
}

// ============================================
// TAB MANAGEMENT
// ============================================

function setActiveGridTab(tab: 'primitives' | 'semantic' | 'export'): void {
  activeGridTab = tab;
  
  const container = document.getElementById('prim-grid');
  if (!container) return;
  
  // Update tab buttons
  const tabs = container.querySelectorAll('.typo-tab[data-grid-tab]');
  tabs.forEach(t => {
    const tabId = t.getAttribute('data-grid-tab');
    t.classList.toggle('active', tabId === `grid-${tab}`);
  });
  
  // Update content panels
  const contents = container.querySelectorAll('.typo-tab-content');
  contents.forEach(c => c.classList.remove('active'));
  
  const activePanel = document.getElementById(`grid-${tab}`);
  if (activePanel) activePanel.classList.add('active');
  
  // Populate grid select when switching to export tab
  if (tab === 'export') {
    populateGridApplySelect();
  }
}

/** Populate the grid select dropdown in export tab */
function populateGridApplySelect(): void {
  const selectEl = document.getElementById('grid-apply-select') as HTMLSelectElement;
  if (!selectEl) return;
  
  selectEl.innerHTML = `
    <option value="">Выберите сетку...</option>
    ${gridState.semanticTokens.map(token => `
      <option value="${token.id}">${token.path}</option>
    `).join('')}
  `;
}

// ============================================
// STATE MANAGEMENT
// ============================================

async function loadGridState(): Promise<void> {
  try {
    const saved = await storageGet<GridState>(STORAGE_KEYS.GRID_STATE || 'grid-state');
    if (saved) {
      const defaults = createDefaultGridState();
      gridState = {
        ...defaults,
        ...saved,
        gutterPrimitives: saved.gutterPrimitives || defaults.gutterPrimitives,
        marginPrimitives: saved.marginPrimitives || defaults.marginPrimitives,
        containerPrimitives: saved.containerPrimitives || defaults.containerPrimitives,
        semanticTokens: saved.semanticTokens || defaults.semanticTokens,
      };
      console.log('[Grid] State loaded');
    } else {
      gridState = createDefaultGridState();
      console.log('[Grid] No saved state, using defaults');
    }
  } catch (e) {
    console.error('[Grid] Failed to load state:', e);
    gridState = createDefaultGridState();
  }
}

async function saveGridState(): Promise<void> {
  try {
    await storageSet(STORAGE_KEYS.GRID_STATE || 'grid-state', gridState);
    console.log('[Grid] State saved');
  } catch (e) {
    console.error('[Grid] Failed to save state:', e);
  }
}

/** Сброс Grid к дефолтным значениям */
export async function resetGridToDefaults(): Promise<void> {
  try {
    await storageDelete(STORAGE_KEYS.GRID_STATE || 'grid-state');
  } catch (e) {
    console.warn('[Grid] Failed to clear storage:', e);
  }
  
  gridState = createDefaultGridState();
  activeGridCategory = 'page';
  activeGridTab = 'primitives';
  activePrimitiveType = 'gutter';
  
  renderGridPrimitives();
  renderGridCategoryTabs();
  renderGridSemanticTokens();
  
  console.log('[Grid] Reset to defaults');
}

// ============================================
// RENDER PRIMITIVES
// ============================================

function getCurrentPrimitives(): GridPrimitive[] {
  switch (activePrimitiveType) {
    case 'gutter': return gridState.gutterPrimitives;
    case 'margin': return gridState.marginPrimitives;
    case 'container': return gridState.containerPrimitives;
    default: return gridState.gutterPrimitives;
  }
}

function renderGridPrimitives(): void {
  const container = document.getElementById('prim-grid');
  if (!container) return;
  
  // Render primitive type tabs
  const typeTabsContainer = document.getElementById('grid-primitive-type-tabs');
  if (typeTabsContainer) {
    typeTabsContainer.innerHTML = `
      <button class="primitive-type-tab ${activePrimitiveType === 'gutter' ? 'active' : ''}" data-prim-type="gutter">
        Gutter <span class="count">(${gridState.gutterPrimitives.filter(p => p.enabled).length})</span>
      </button>
      <button class="primitive-type-tab ${activePrimitiveType === 'margin' ? 'active' : ''}" data-prim-type="margin">
        Margin <span class="count">(${gridState.marginPrimitives.filter(p => p.enabled).length})</span>
      </button>
      <button class="primitive-type-tab ${activePrimitiveType === 'container' ? 'active' : ''}" data-prim-type="container">
        Container <span class="count">(${gridState.containerPrimitives.filter(p => p.enabled).length})</span>
      </button>
    `;
  }
  
  // Get primitives for current type
  const primitives = getCurrentPrimitives();
  const prefix = `grid.${activePrimitiveType}`;
  
  const grid = document.getElementById('grid-primitives-grid');
  if (grid) {
    grid.innerHTML = primitives.map(prim => `
      <div class="spacing-prim-item ${prim.enabled ? 'enabled' : ''}" 
           data-grid-primitive="${prim.name}"
           title="${prefix}.${prim.name} = ${prim.value}${activePrimitiveType === 'container' ? 'px' : 'px'}">
        <span class="prim-value">${prim.value}</span>
        <span class="prim-name">${prefix}.${prim.name}</span>
      </div>
    `).join('');
  }
  
  updateGridPrimitivesCount();
}

function toggleGridPrimitive(name: string): void {
  const primitives = getCurrentPrimitives();
  const prim = primitives.find(p => p.name === name);
  if (prim) {
    prim.enabled = !prim.enabled;
    saveGridState();
    renderGridPrimitives();
    renderGridSemanticTokens();
  }
}

function updateGridPrimitivesCount(): void {
  const countEl = document.getElementById('grid-primitives-count');
  if (countEl) {
    const gutterEnabled = gridState.gutterPrimitives.filter(p => p.enabled).length;
    const marginEnabled = gridState.marginPrimitives.filter(p => p.enabled).length;
    const containerEnabled = gridState.containerPrimitives.filter(p => p.enabled).length;
    const total = gutterEnabled + marginEnabled + containerEnabled;
    countEl.textContent = `${total}`;
  }
}

// ============================================
// RENDER CATEGORY TABS
// ============================================

function renderGridCategoryTabs(): void {
  const container = document.getElementById('grid-category-tabs');
  if (!container) return;
  
  const defaultCategories = Object.keys(GRID_CATEGORIES) as GridCategory[];
  const customCategories = gridState.customCategories || [];
  
  container.innerHTML = `
    ${defaultCategories.map(cat => {
      const info = GRID_CATEGORIES[cat];
      const count = getGridTokensByCategory(gridState.semanticTokens, cat).length;
      return `
        <button class="category-tab ${cat === activeGridCategory ? 'active' : ''}" 
                data-grid-category="${cat}" title="${info.description}">
          ${info.icon} ${info.label} <span class="count">(${count})</span>
        </button>
      `;
    }).join('')}
    ${customCategories.map(cat => {
      const count = gridState.semanticTokens.filter(t => t.category === cat.id).length;
      return `
        <button class="category-tab custom-category ${cat.id === activeGridCategory ? 'active' : ''}" 
                data-grid-category="${cat.id}" title="${cat.description}">
          ${cat.icon} ${cat.name} <span class="count">(${count})</span>
          <span class="btn-delete-category" data-category-id="${cat.id}" title="Удалить">×</span>
        </button>
      `;
    }).join('')}
    <button class="category-tab add-category-btn" id="grid-add-category" title="Добавить категорию">+</button>
  `;
}

// ============================================
// CUSTOM CATEGORY MANAGEMENT
// ============================================

function addCustomGridCategory(name: string, icon: string = '📁'): void {
  const id = `custom-${Date.now()}`;
  const newCategory: CustomGridCategory = {
    id,
    name,
    icon,
    description: `Custom category: ${name}`,
  };
  
  if (!gridState.customCategories) {
    gridState.customCategories = [];
  }
  gridState.customCategories.push(newCategory);
  saveGridState();
  renderGridCategoryTabs();
}

function deleteCustomGridCategory(categoryId: string): void {
  if (!gridState.customCategories) return;
  
  const tokensInCategory = gridState.semanticTokens.filter(t => t.category === categoryId);
  if (tokensInCategory.length > 0) {
    if (!confirm(`В категории есть ${tokensInCategory.length} токенов. Удалить категорию и все токены?`)) {
      return;
    }
    gridState.semanticTokens = gridState.semanticTokens.filter(t => t.category !== categoryId);
  }
  
  gridState.customCategories = gridState.customCategories.filter(c => c.id !== categoryId);
  saveGridState();
  
  activeGridCategory = 'page';
  renderGridCategoryTabs();
  renderGridSemanticTokens();
}

function showAddGridCategoryDialog(): void {
  const name = prompt('Введите название новой категории:');
  if (name && name.trim()) {
    addCustomGridCategory(name.trim());
  }
}

// ============================================
// RENDER SEMANTIC TOKENS
// ============================================

function renderGridSemanticTokens(): void {
  const container = document.getElementById('grid-semantic-list');
  if (!container) return;
  
  const isCustomCategory = !Object.keys(GRID_CATEGORIES).includes(activeGridCategory);
  const tokens = isCustomCategory
    ? gridState.semanticTokens.filter(t => t.category === activeGridCategory)
    : getGridTokensByCategory(gridState.semanticTokens, activeGridCategory as GridCategory);
  
  const categoryInfo = isCustomCategory
    ? gridState.customCategories?.find(c => c.id === activeGridCategory)
    : GRID_CATEGORIES[activeGridCategory as GridCategory];
  const categoryLabel = isCustomCategory
    ? (categoryInfo as CustomGridCategory)?.name || activeGridCategory
    : (categoryInfo as { label: string })?.label || activeGridCategory;
  
  // Update total count
  const totalCounter = document.getElementById('grid-semantic-count');
  if (totalCounter) totalCounter.textContent = `${gridState.semanticTokens.length}`;
  
  if (tokens.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Нет токенов в категории "${categoryLabel}"</p>
        <button class="btn btn-primary" id="grid-add-first-token">+ Добавить токен</button>
      </div>
    `;
    const addBtn = document.getElementById('grid-add-first-token');
    if (addBtn) addBtn.addEventListener('click', () => addGridSemanticToken());
    return;
  }
  
  // Get enabled primitives for select options
  const gutterOptions = gridState.gutterPrimitives
    .filter(p => p.enabled)
    .map(p => `<option value="${p.name}">${p.value}px</option>`)
    .join('');
  
  const marginOptions = gridState.marginPrimitives
    .filter(p => p.enabled)
    .map(p => `<option value="${p.name}">${p.value}px</option>`)
    .join('');
  
  const containerOptions = gridState.containerPrimitives
    .filter(p => p.enabled)
    .map(p => `<option value="${p.name}">${p.value}px</option>`)
    .join('');
  
  const alignmentOptions = `
    <option value="MIN">Start (MIN)</option>
    <option value="CENTER">Center</option>
    <option value="MAX">End (MAX)</option>
    <option value="STRETCH">Stretch</option>
  `;
  
  container.innerHTML = `
    <div class="grid-tokens-table">
      <div class="grid-table-header">
        <div class="col-path">Путь токена</div>
        <div class="col-device">
          <span class="device-label">🖥️ Desktop</span>
        </div>
        <div class="col-device">
          <span class="device-label">📱 Tablet</span>
        </div>
        <div class="col-device">
          <span class="device-label">📱 Mobile</span>
        </div>
        <div class="col-actions"></div>
      </div>
      ${tokens.map(token => renderGridTokenRow(token, gutterOptions, marginOptions, containerOptions, alignmentOptions)).join('')}
    </div>
    <div class="semantic-toolbar">
      <button class="btn btn-secondary" id="grid-add-token-btn">+ Добавить токен</button>
    </div>
  `;
  
  // Add event handlers
  setupGridTokenEventHandlers(container);
  
  // Add token button
  const addBtn = document.getElementById('grid-add-token-btn');
  if (addBtn) addBtn.addEventListener('click', () => addGridSemanticToken());
}

function renderGridTokenRow(
  token: GridSemanticToken, 
  gutterOptions: string, 
  marginOptions: string, 
  containerOptions: string,
  alignmentOptions: string
): string {
  return `
    <div class="grid-token-row" data-token-id="${token.id}">
      <div class="col-path">
        <input type="text" class="token-path-input" value="${token.path}" data-field="path" />
        <span class="token-desc">${token.description || ''}</span>
      </div>
      <div class="col-device">
        <div class="grid-config-mini">
          <div class="config-row">
            <span class="config-label">Col:</span>
            <input type="number" class="config-input small" value="${token.desktop.columns}" 
                   data-device="desktop" data-field="columns" min="1" max="24" />
          </div>
          <div class="config-row">
            <span class="config-label">Gut:</span>
            <select class="config-select" data-device="desktop" data-field="gutter">
              ${gutterOptions.replace(`value="${token.desktop.gutter}"`, `value="${token.desktop.gutter}" selected`)}
            </select>
          </div>
          <div class="config-row">
            <span class="config-label">Mar:</span>
            <select class="config-select" data-device="desktop" data-field="margin">
              ${marginOptions.replace(`value="${token.desktop.margin}"`, `value="${token.desktop.margin}" selected`)}
            </select>
          </div>
          <div class="config-row">
            <span class="config-label">Align:</span>
            <select class="config-select" data-device="desktop" data-field="alignment">
              ${alignmentOptions.replace(`value="${token.desktop.alignment}"`, `value="${token.desktop.alignment}" selected`)}
            </select>
          </div>
          ${token.desktop.maxWidth ? `
          <div class="config-row">
            <span class="config-label">Max:</span>
            <select class="config-select" data-device="desktop" data-field="maxWidth">
              <option value="">none</option>
              ${containerOptions.replace(`value="${token.desktop.maxWidth}"`, `value="${token.desktop.maxWidth}" selected`)}
            </select>
          </div>
          ` : ''}
        </div>
      </div>
      <div class="col-device">
        <div class="grid-config-mini">
          <div class="config-row">
            <span class="config-label">Col:</span>
            <input type="number" class="config-input small" value="${token.tablet.columns}" 
                   data-device="tablet" data-field="columns" min="1" max="24" />
          </div>
          <div class="config-row">
            <span class="config-label">Gut:</span>
            <select class="config-select" data-device="tablet" data-field="gutter">
              ${gutterOptions.replace(`value="${token.tablet.gutter}"`, `value="${token.tablet.gutter}" selected`)}
            </select>
          </div>
          <div class="config-row">
            <span class="config-label">Mar:</span>
            <select class="config-select" data-device="tablet" data-field="margin">
              ${marginOptions.replace(`value="${token.tablet.margin}"`, `value="${token.tablet.margin}" selected`)}
            </select>
          </div>
          <div class="config-row">
            <span class="config-label">Align:</span>
            <select class="config-select" data-device="tablet" data-field="alignment">
              ${alignmentOptions.replace(`value="${token.tablet.alignment}"`, `value="${token.tablet.alignment}" selected`)}
            </select>
          </div>
        </div>
      </div>
      <div class="col-device">
        <div class="grid-config-mini">
          <div class="config-row">
            <span class="config-label">Col:</span>
            <input type="number" class="config-input small" value="${token.mobile.columns}" 
                   data-device="mobile" data-field="columns" min="1" max="24" />
          </div>
          <div class="config-row">
            <span class="config-label">Gut:</span>
            <select class="config-select" data-device="mobile" data-field="gutter">
              ${gutterOptions.replace(`value="${token.mobile.gutter}"`, `value="${token.mobile.gutter}" selected`)}
            </select>
          </div>
          <div class="config-row">
            <span class="config-label">Mar:</span>
            <select class="config-select" data-device="mobile" data-field="margin">
              ${marginOptions.replace(`value="${token.mobile.margin}"`, `value="${token.mobile.margin}" selected`)}
            </select>
          </div>
          <div class="config-row">
            <span class="config-label">Align:</span>
            <select class="config-select" data-device="mobile" data-field="alignment">
              ${alignmentOptions.replace(`value="${token.mobile.alignment}"`, `value="${token.mobile.alignment}" selected`)}
            </select>
          </div>
        </div>
      </div>
      <div class="col-actions">
        <button class="btn-icon delete-token-btn" data-token-id="${token.id}" title="Удалить">×</button>
      </div>
    </div>
  `;
}

function setupGridTokenEventHandlers(container: HTMLElement): void {
  // Path input handlers
  container.querySelectorAll('.token-path-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const row = target.closest('.grid-token-row');
      const tokenId = row?.getAttribute('data-token-id');
      if (tokenId) updateGridTokenPath(tokenId, target.value);
    });
  });
  
  // Config input/select handlers
  container.querySelectorAll('.config-input, .config-select').forEach(el => {
    el.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      const row = target.closest('.grid-token-row');
      const tokenId = row?.getAttribute('data-token-id');
      const device = target.getAttribute('data-device') as 'desktop' | 'tablet' | 'mobile';
      const field = target.getAttribute('data-field') as keyof GridLayoutConfig;
      
      if (tokenId && device && field) {
        const value = field === 'columns' ? parseInt(target.value) : target.value;
        updateGridTokenConfig(tokenId, device, field, value);
      }
    });
  });
  
  // Delete button handlers
  container.querySelectorAll('.delete-token-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tokenId = (btn as HTMLElement).dataset.tokenId;
      if (tokenId) deleteGridSemanticToken(tokenId);
    });
  });
}

// ============================================
// GRID SEMANTIC TOKEN CRUD
// ============================================

function addGridSemanticToken(): void {
  const newToken: GridSemanticToken = {
    id: generateGridTokenId(),
    path: `layout.grid.${activeGridCategory}.new`,
    category: activeGridCategory as GridCategory,
    desktop: { columns: 12, gutter: '24', margin: '64', alignment: 'CENTER' },
    tablet:  { columns: 8,  gutter: '20', margin: '32', alignment: 'CENTER' },
    mobile:  { columns: 4,  gutter: '16', margin: '16', alignment: 'STRETCH' },
  };
  
  gridState.semanticTokens.push(newToken);
  saveGridState();
  renderGridCategoryTabs();
  renderGridSemanticTokens();
  
  addPendingChange({
    module: 'grid',
    type: 'add',
    category: activeGridCategory,
    name: newToken.path,
    newValue: `${newToken.desktop.columns}col`,
  });
}

function updateGridTokenPath(tokenId: string, newPath: string): void {
  const token = gridState.semanticTokens.find(t => t.id === tokenId);
  if (token) {
    const oldPath = token.path;
    token.path = newPath;
    saveGridState();
    
    addPendingChange({
      module: 'grid',
      type: 'update',
      category: token.category,
      name: newPath,
      oldValue: oldPath,
      newValue: newPath,
      details: 'path',
    });
  }
}

function updateGridTokenConfig(
  tokenId: string, 
  device: 'desktop' | 'tablet' | 'mobile', 
  field: keyof GridLayoutConfig, 
  value: string | number
): void {
  const token = gridState.semanticTokens.find(t => t.id === tokenId);
  if (token) {
    const oldValue = (token[device] as any)[field];
    (token[device] as any)[field] = value;
    saveGridState();
    
    addPendingChange({
      module: 'grid',
      type: 'update',
      category: token.category,
      name: token.path,
      oldValue: String(oldValue),
      newValue: String(value),
      details: `${device}.${field}`,
    });
  }
}

function deleteGridSemanticToken(tokenId: string): void {
  const index = gridState.semanticTokens.findIndex(t => t.id === tokenId);
  if (index > -1) {
    const token = gridState.semanticTokens[index];
    gridState.semanticTokens.splice(index, 1);
    saveGridState();
    renderGridCategoryTabs();
    renderGridSemanticTokens();
    
    addPendingChange({
      module: 'grid',
      type: 'delete',
      category: token.category,
      name: token.path,
      oldValue: `${token.desktop.columns}col`,
    });
  }
}

// ============================================
// EXPORT TO FIGMA
// ============================================

function exportGridPrimitivesToFigma(): void {
  const enabledGutter = getEnabledGridPrimitives(gridState.gutterPrimitives);
  const enabledMargin = getEnabledGridPrimitives(gridState.marginPrimitives);
  const enabledContainer = getEnabledGridPrimitives(gridState.containerPrimitives);
  
  parent.postMessage({
    pluginMessage: {
      type: 'create-grid-primitives',
      gutter: enabledGutter.map(p => ({ name: p.name, value: p.value })),
      margin: enabledMargin.map(p => ({ name: p.name, value: p.value })),
      container: enabledContainer.map(p => ({ name: p.name, value: p.value })),
    }
  }, '*');
  
  showGridExportStatus('Примитивы grid отправлены в Figma...', 'info');
}

function exportGridSemanticToFigma(): void {
  parent.postMessage({
    pluginMessage: {
      type: 'create-grid-semantic',
      tokens: gridState.semanticTokens.map(t => ({
        id: t.id,
        path: t.path,
        desktop: t.desktop,
        tablet: t.tablet,
        mobile: t.mobile,
      })),
    }
  }, '*');
  
  showGridExportStatus('Семантические токены grid отправлены в Figma...', 'info');
}

function applyGridToSelectedFrame(): void {
  // Get selected grid token from dropdown
  const selectEl = document.getElementById('grid-apply-select') as HTMLSelectElement;
  const tokenId = selectEl?.value;
  
  if (!tokenId) {
    showGridExportStatus('Выберите сетку для применения', 'error');
    return;
  }
  
  const token = gridState.semanticTokens.find(t => t.id === tokenId);
  if (!token) {
    showGridExportStatus('Токен не найден', 'error');
    return;
  }
  
  parent.postMessage({
    pluginMessage: {
      type: 'apply-grid-to-frame',
      token: {
        id: token.id,
        path: token.path,
        desktop: token.desktop,
        tablet: token.tablet,
        mobile: token.mobile,
      },
      // Send primitive values for immediate application
      gutterPrimitives: gridState.gutterPrimitives,
      marginPrimitives: gridState.marginPrimitives,
    }
  }, '*');
  
  showGridExportStatus(`Применяем сетку "${token.path}" к выбранному фрейму...`, 'info');
}

/** Создаёт компоненты с Layout Grid для всех семантических токенов */
function createGridComponents(): void {
  if (gridState.semanticTokens.length === 0) {
    showGridExportStatus('Нет семантических токенов для создания компонентов', 'error');
    return;
  }
  
  const componentsData = gridState.semanticTokens.map(token => {
    // Get actual values from primitives
    const getGutterValue = (ref: string) => {
      const prim = gridState.gutterPrimitives.find(p => p.name === ref);
      return prim?.value || parseInt(ref) || 16;
    };
    
    const getMarginValue = (ref: string) => {
      const prim = gridState.marginPrimitives.find(p => p.name === ref);
      return prim?.value || parseInt(ref) || 24;
    };
    
    return {
      id: token.id,
      name: token.path.replace(/\//g, '-').replace(/\./g, '-'),
      path: token.path,
      description: token.description || '',
      desktop: {
        columns: token.desktop.columns,
        gutter: getGutterValue(token.desktop.gutter),
        margin: getMarginValue(token.desktop.margin),
        alignment: token.desktop.alignment,
      },
      tablet: {
        columns: token.tablet.columns,
        gutter: getGutterValue(token.tablet.gutter),
        margin: getMarginValue(token.tablet.margin),
        alignment: token.tablet.alignment,
      },
      mobile: {
        columns: token.mobile.columns,
        gutter: getGutterValue(token.mobile.gutter),
        margin: getMarginValue(token.mobile.margin),
        alignment: token.mobile.alignment,
      },
    };
  });
  
  parent.postMessage({
    pluginMessage: {
      type: 'create-grid-components',
      components: componentsData,
    }
  }, '*');
  
  showGridExportStatus(`Создаём ${componentsData.length * 3} Grid Styles...`, 'info');
}

function showGridExportStatus(message: string, type: 'info' | 'success' | 'error'): void {
  const statusEl = document.getElementById('grid-export-status');
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

// ============================================
// GETTERS FOR EXTERNAL USE
// ============================================

export function getGridState(): GridState {
  return gridState;
}

export function getGridSemanticTokens(): GridSemanticToken[] {
  return gridState.semanticTokens;
}

// Listen for messages from plugin
window.addEventListener('message', (event) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;
  
  if (msg.type === 'grid-primitives-created') {
    showGridExportStatus(`✅ Создано ${msg.count} примитивов grid`, 'success');
  } else if (msg.type === 'grid-semantic-created') {
    showGridExportStatus(`✅ Создано ${msg.count} семантических токенов grid`, 'success');
  } else if (msg.type === 'grid-applied-to-frame') {
    showGridExportStatus(`✅ Сетка применена к фрейму`, 'success');
  } else if (msg.type === 'grid-components-created') {
    showGridExportStatus(`✅ Создано ${msg.count} Grid Styles`, 'success');
  } else if (msg.type === 'grid-error') {
    showGridExportStatus(`❌ Ошибка: ${msg.error}`, 'error');
  }
});
