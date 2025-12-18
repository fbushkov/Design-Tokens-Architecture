/**
 * Stroke Generator UI
 * 2-tier architecture for border/stroke tokens
 * 
 * Level 1: Primitives (stroke.width.*, stroke.style.*, stroke.dashArray.*) → Primitives collection
 * Level 2: Semantic (stroke.{component}.{variant}.{property}) → Stroke collection
 * 
 * Properties: width (NUMBER), style (STRING), color (COLOR alias)
 */

import {
  StrokeState,
  StrokeWidthPrimitive,
  StrokeStylePrimitive,
  StrokeDashArrayPrimitive,
  StrokeSemanticToken,
  StrokeCategory,
  STROKE_CATEGORIES,
  createDefaultStrokeState,
  getStrokeTokensByCategory,
  generateStrokeTokenId,
} from '../types/stroke-tokens';

import { COMPLETE_STROKE_SEMANTIC_TOKENS } from '../types/stroke-defaults';
import { storageGet, storageSet, storageDelete, STORAGE_KEYS } from './storage-utils';
import { addPendingChange } from './token-manager-ui';

// ============================================
// STATE
// ============================================

let strokeState: StrokeState = createDefaultStrokeState();
let activeStrokeCategory: StrokeCategory | string = 'base';
let activeStrokeTab: 'primitives' | 'semantic' | 'export' = 'primitives';
let activePrimitiveSubtab: 'width' | 'style' | 'dashArray' = 'width';

// ============================================
// INIT
// ============================================

export function initStrokeUI(): void {
  const container = document.getElementById('prim-borders');
  if (!container) return;
  
  // First render with defaults
  renderStrokePrimitives();
  renderStrokeCategoryTabs();
  renderStrokeSemanticTokens();
  
  // Setup event delegation
  container.onclick = (e) => {
    const target = e.target as HTMLElement;
    
    // Main tab click
    const tabBtn = target.closest('.typo-tab[data-stroke-tab]') as HTMLElement;
    if (tabBtn) {
      e.preventDefault();
      const tabId = tabBtn.getAttribute('data-stroke-tab');
      if (tabId) {
        const tab = tabId.replace('stroke-', '') as 'primitives' | 'semantic' | 'export';
        setActiveStrokeTab(tab);
      }
      return;
    }
    
    // Primitive subtab click
    const subtabBtn = target.closest('.prim-subtab[data-stroke-prim-tab]') as HTMLElement;
    if (subtabBtn) {
      const subtab = subtabBtn.getAttribute('data-stroke-prim-tab') as 'width' | 'style' | 'dashArray';
      if (subtab) {
        setActivePrimitiveSubtab(subtab);
      }
      return;
    }
    
    // Width primitive click
    const widthItem = target.closest('.spacing-prim-item[data-stroke-width]') as HTMLElement;
    if (widthItem) {
      const name = widthItem.getAttribute('data-stroke-width');
      if (name) toggleStrokeWidthPrimitive(name);
      return;
    }
    
    // Style primitive click
    const styleItem = target.closest('.spacing-prim-item[data-stroke-style]') as HTMLElement;
    if (styleItem) {
      const name = styleItem.getAttribute('data-stroke-style');
      if (name) toggleStrokeStylePrimitive(name);
      return;
    }
    
    // DashArray primitive click
    const dashItem = target.closest('.spacing-prim-item[data-stroke-dash]') as HTMLElement;
    if (dashItem) {
      const name = dashItem.getAttribute('data-stroke-dash');
      if (name) toggleStrokeDashArrayPrimitive(name);
      return;
    }
    
    // Delete category button
    const deleteBtn = target.closest('.btn-delete-category') as HTMLElement;
    if (deleteBtn) {
      e.stopPropagation();
      const catId = deleteBtn.dataset.categoryId;
      if (catId) deleteCustomStrokeCategory(catId);
      return;
    }
    
    // Add category button
    if (target.id === 'stroke-add-category' || target.closest('#stroke-add-category')) {
      showAddStrokeCategoryDialog();
      return;
    }
    
    // Category tab click
    const catTab = target.closest('.category-tab[data-stroke-category]') as HTMLElement;
    if (catTab) {
      const catId = catTab.getAttribute('data-stroke-category');
      if (catId) {
        activeStrokeCategory = catId;
        renderStrokeCategoryTabs();
        renderStrokeSemanticTokens();
      }
      return;
    }
    
    // Export buttons
    if (target.id === 'btn-generate-stroke-primitives' || target.id === 'export-stroke-primitives') {
      exportStrokePrimitivesToFigma();
      return;
    }
    if (target.id === 'export-stroke-semantic') {
      exportStrokeSemanticToFigma();
      return;
    }
    if (target.id === 'export-stroke-all') {
      exportStrokePrimitivesToFigma();
      setTimeout(() => exportStrokeSemanticToFigma(), 500);
      return;
    }
    
    // Load all tokens
    if (target.id === 'stroke-load-all-tokens' || target.closest('#stroke-load-all-tokens')) {
      loadAllStrokeTokens();
      return;
    }
  };
  
  // Load saved state
  loadStrokeState().then(() => {
    renderStrokePrimitives();
    renderStrokeCategoryTabs();
    renderStrokeSemanticTokens();
  });
}

// ============================================
// TAB MANAGEMENT
// ============================================

function setActiveStrokeTab(tab: 'primitives' | 'semantic' | 'export'): void {
  activeStrokeTab = tab;
  
  const container = document.getElementById('prim-borders');
  if (!container) return;
  
  // Update tab buttons
  const tabs = container.querySelectorAll('.typo-tab[data-stroke-tab]');
  tabs.forEach(t => {
    const tabId = t.getAttribute('data-stroke-tab');
    t.classList.toggle('active', tabId === `stroke-${tab}`);
  });
  
  // Update content panels
  const contents = container.querySelectorAll('.typo-tab-content');
  contents.forEach(c => c.classList.remove('active'));
  
  const activePanel = document.getElementById(`stroke-${tab}`);
  if (activePanel) activePanel.classList.add('active');
}

function setActivePrimitiveSubtab(subtab: 'width' | 'style' | 'dashArray'): void {
  activePrimitiveSubtab = subtab;
  
  const container = document.getElementById('stroke-primitives');
  if (!container) return;
  
  // Update subtab buttons
  container.querySelectorAll('.prim-subtab').forEach(btn => {
    const tab = btn.getAttribute('data-stroke-prim-tab');
    btn.classList.toggle('active', tab === subtab);
  });
  
  // Update subtab content
  container.querySelectorAll('.stroke-prim-content').forEach(content => {
    content.classList.remove('active');
  });
  
  const activeContent = document.getElementById(`stroke-prim-${subtab}`);
  if (activeContent) activeContent.classList.add('active');
}

// ============================================
// STATE MANAGEMENT
// ============================================

async function loadStrokeState(): Promise<void> {
  try {
    const saved = await storageGet<StrokeState>(STORAGE_KEYS.STROKE_STATE);
    if (saved) {
      const defaults = createDefaultStrokeState();
      strokeState = {
        ...defaults,
        ...saved,
        widthPrimitives: saved.widthPrimitives || defaults.widthPrimitives,
        stylePrimitives: saved.stylePrimitives || defaults.stylePrimitives,
        dashArrayPrimitives: saved.dashArrayPrimitives || defaults.dashArrayPrimitives,
        semanticTokens: saved.semanticTokens || defaults.semanticTokens,
        customCategories: saved.customCategories || [],
      };
      console.log('[Stroke] State loaded');
    } else {
      strokeState = createDefaultStrokeState();
      console.log('[Stroke] No saved state, using defaults');
    }
  } catch (e) {
    console.error('[Stroke] Failed to load state:', e);
    strokeState = createDefaultStrokeState();
  }
}

async function saveStrokeState(): Promise<void> {
  try {
    await storageSet(STORAGE_KEYS.STROKE_STATE, strokeState);
    console.log('[Stroke] State saved');
  } catch (e) {
    console.error('[Stroke] Failed to save state:', e);
  }
}

/** Reset Stroke to defaults */
export async function resetStrokeToDefaults(): Promise<void> {
  try {
    await storageDelete(STORAGE_KEYS.STROKE_STATE);
  } catch (e) {
    console.warn('[Stroke] Failed to clear storage:', e);
  }
  
  strokeState = createDefaultStrokeState();
  activeStrokeCategory = 'base';
  activeStrokeTab = 'primitives';
  activePrimitiveSubtab = 'width';
  
  renderStrokePrimitives();
  renderStrokeCategoryTabs();
  renderStrokeSemanticTokens();
  
  console.log('[Stroke] Reset to defaults');
}

// ============================================
// LOAD ALL TOKENS
// ============================================

function loadAllStrokeTokens(): void {
  strokeState.semanticTokens = [...COMPLETE_STROKE_SEMANTIC_TOKENS];
  saveStrokeState();
  renderStrokeCategoryTabs();
  renderStrokeSemanticTokens();
  showStrokeExportStatus(`✅ Загружено ${strokeState.semanticTokens.length} токенов`, 'success');
}

// ============================================
// RENDER PRIMITIVES
// ============================================

function renderStrokePrimitives(): void {
  renderStrokeWidthPrimitives();
  renderStrokeStylePrimitives();
  renderStrokeDashArrayPrimitives();
  updateStrokePrimitivesCount();
}

function renderStrokeWidthPrimitives(): void {
  const grid = document.getElementById('stroke-width-grid');
  if (!grid) return;
  
  grid.innerHTML = strokeState.widthPrimitives.map(prim => `
    <div class="spacing-prim-item ${prim.enabled ? 'enabled' : ''}" 
         data-stroke-width="${prim.name}"
         title="stroke.width.${prim.name} = ${prim.value}px">
      <span class="prim-value">${prim.value}</span>
      <span class="prim-name">stroke.width.${prim.name}</span>
    </div>
  `).join('');
}

function renderStrokeStylePrimitives(): void {
  const grid = document.getElementById('stroke-style-grid');
  if (!grid) return;
  
  grid.innerHTML = strokeState.stylePrimitives.map(prim => `
    <div class="spacing-prim-item ${prim.enabled ? 'enabled' : ''}" 
         data-stroke-style="${prim.name}"
         title="stroke.style.${prim.name} = ${prim.value}">
      <span class="prim-value" style="font-size: 10px;">${prim.value}</span>
      <span class="prim-name">stroke.style.${prim.name}</span>
    </div>
  `).join('');
}

function renderStrokeDashArrayPrimitives(): void {
  const grid = document.getElementById('stroke-dash-grid');
  if (!grid) return;
  
  grid.innerHTML = strokeState.dashArrayPrimitives.map(prim => `
    <div class="spacing-prim-item ${prim.enabled ? 'enabled' : ''}" 
         data-stroke-dash="${prim.name}"
         title="stroke.dashArray.${prim.name} = ${prim.value}">
      <span class="prim-value" style="font-size: 9px;">${prim.value}</span>
      <span class="prim-name">stroke.dashArray.${prim.name}</span>
    </div>
  `).join('');
}

function toggleStrokeWidthPrimitive(name: string): void {
  const prim = strokeState.widthPrimitives.find(p => p.name === name);
  if (prim) {
    prim.enabled = !prim.enabled;
    saveStrokeState();
    renderStrokeWidthPrimitives();
    updateStrokePrimitivesCount();
  }
}

function toggleStrokeStylePrimitive(name: string): void {
  const prim = strokeState.stylePrimitives.find(p => p.name === name);
  if (prim) {
    prim.enabled = !prim.enabled;
    saveStrokeState();
    renderStrokeStylePrimitives();
    updateStrokePrimitivesCount();
  }
}

function toggleStrokeDashArrayPrimitive(name: string): void {
  const prim = strokeState.dashArrayPrimitives.find(p => p.name === name);
  if (prim) {
    prim.enabled = !prim.enabled;
    saveStrokeState();
    renderStrokeDashArrayPrimitives();
    updateStrokePrimitivesCount();
  }
}

function updateStrokePrimitivesCount(): void {
  const widthCount = document.getElementById('stroke-width-count');
  const styleCount = document.getElementById('stroke-style-count');
  const dashCount = document.getElementById('stroke-dash-count');
  
  if (widthCount) {
    const enabled = strokeState.widthPrimitives.filter(p => p.enabled).length;
    const total = strokeState.widthPrimitives.length;
    widthCount.textContent = `${enabled}/${total}`;
  }
  
  if (styleCount) {
    const enabled = strokeState.stylePrimitives.filter(p => p.enabled).length;
    const total = strokeState.stylePrimitives.length;
    styleCount.textContent = `${enabled}/${total}`;
  }
  
  if (dashCount) {
    const enabled = strokeState.dashArrayPrimitives.filter(p => p.enabled).length;
    const total = strokeState.dashArrayPrimitives.length;
    dashCount.textContent = `${enabled}/${total}`;
  }
}

// ============================================
// RENDER CATEGORY TABS
// ============================================

function renderStrokeCategoryTabs(): void {
  const container = document.getElementById('stroke-category-tabs');
  if (!container) return;
  
  const defaultCategories = Object.keys(STROKE_CATEGORIES) as StrokeCategory[];
  const customCategories = strokeState.customCategories || [];
  
  // Group categories to avoid too many tabs
  const mainCategories: StrokeCategory[] = ['base', 'button', 'input', 'card', 'alert', 'table', 'divider', 'accent'];
  const otherCategories = defaultCategories.filter(c => !mainCategories.includes(c));
  
  container.innerHTML = `
    ${mainCategories.map(cat => {
      const info = STROKE_CATEGORIES[cat];
      const count = getStrokeTokensByCategory(strokeState.semanticTokens, cat).length;
      return `
        <button class="category-tab ${cat === activeStrokeCategory ? 'active' : ''}" 
                data-stroke-category="${cat}" title="${info.description}">
          ${info.label} <span class="count">(${count})</span>
        </button>
      `;
    }).join('')}
    <div class="category-dropdown">
      <button class="category-tab dropdown-toggle" id="stroke-more-categories">
        Ещё ▼
      </button>
      <div class="dropdown-menu" id="stroke-categories-dropdown">
        ${otherCategories.map(cat => {
          const info = STROKE_CATEGORIES[cat];
          const count = getStrokeTokensByCategory(strokeState.semanticTokens, cat).length;
          return `
            <button class="dropdown-item category-tab ${cat === activeStrokeCategory ? 'active' : ''}" 
                    data-stroke-category="${cat}" title="${info.description}">
              ${info.label} <span class="count">(${count})</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
    ${customCategories.map(cat => {
      const count = strokeState.semanticTokens.filter(t => t.category === cat.id).length;
      return `
        <button class="category-tab custom-category ${cat.id === activeStrokeCategory ? 'active' : ''}" 
                data-stroke-category="${cat.id}" title="${cat.description}">
          ${cat.label} <span class="count">(${count})</span>
          <span class="btn-delete-category" data-category-id="${cat.id}" title="Удалить">×</span>
        </button>
      `;
    }).join('')}
    <button class="category-tab add-category-btn" id="stroke-add-category" title="Добавить категорию">+</button>
  `;
  
  // Setup dropdown toggle
  const dropdownToggle = document.getElementById('stroke-more-categories');
  const dropdownMenu = document.getElementById('stroke-categories-dropdown');
  if (dropdownToggle && dropdownMenu) {
    dropdownToggle.onclick = (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('show');
    };
    
    // Close on click outside
    document.addEventListener('click', () => {
      dropdownMenu.classList.remove('show');
    });
  }
}

// ============================================
// CUSTOM CATEGORY MANAGEMENT
// ============================================

function addCustomStrokeCategory(name: string): void {
  const id = `custom-${Date.now()}`;
  const newCategory = {
    id,
    label: name,
    description: `Custom category: ${name}`,
  };
  
  if (!strokeState.customCategories) {
    strokeState.customCategories = [];
  }
  strokeState.customCategories.push(newCategory);
  saveStrokeState();
  renderStrokeCategoryTabs();
}

function deleteCustomStrokeCategory(categoryId: string): void {
  if (!strokeState.customCategories) return;
  
  const tokensInCategory = strokeState.semanticTokens.filter(t => t.category === categoryId);
  if (tokensInCategory.length > 0) {
    if (!confirm(`В категории есть ${tokensInCategory.length} токенов. Удалить категорию и все токены?`)) {
      return;
    }
    strokeState.semanticTokens = strokeState.semanticTokens.filter(t => t.category !== categoryId);
  }
  
  strokeState.customCategories = strokeState.customCategories.filter(c => c.id !== categoryId);
  saveStrokeState();
  
  activeStrokeCategory = 'base';
  renderStrokeCategoryTabs();
  renderStrokeSemanticTokens();
}

function showAddStrokeCategoryDialog(): void {
  const name = prompt('Введите название новой категории:');
  if (name && name.trim()) {
    addCustomStrokeCategory(name.trim());
  }
}

// ============================================
// RENDER SEMANTIC TOKENS
// ============================================

function renderStrokeSemanticTokens(): void {
  const container = document.getElementById('stroke-semantic-list');
  if (!container) return;
  
  const isCustomCategory = !Object.keys(STROKE_CATEGORIES).includes(activeStrokeCategory);
  const tokens = isCustomCategory
    ? strokeState.semanticTokens.filter(t => t.category === activeStrokeCategory)
    : getStrokeTokensByCategory(strokeState.semanticTokens, activeStrokeCategory as StrokeCategory);
  
  const categoryInfo = isCustomCategory
    ? strokeState.customCategories?.find(c => c.id === activeStrokeCategory)
    : STROKE_CATEGORIES[activeStrokeCategory as StrokeCategory];
  const categoryLabel = isCustomCategory
    ? (categoryInfo as any)?.label || activeStrokeCategory
    : (categoryInfo as { label: string })?.label || activeStrokeCategory;
  
  // Update total count
  const totalCounter = document.getElementById('stroke-semantic-count');
  if (totalCounter) totalCounter.textContent = `${strokeState.semanticTokens.length}`;
  
  if (tokens.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Нет токенов в категории "${categoryLabel}"</p>
        <button class="btn btn-primary" id="stroke-add-first-token">+ Добавить токен</button>
        <button class="btn btn-secondary" id="stroke-load-all-tokens" style="margin-top: 8px;">📥 Загрузить все токены</button>
      </div>
    `;
    const addBtn = document.getElementById('stroke-add-first-token');
    if (addBtn) addBtn.addEventListener('click', () => addStrokeSemanticToken());
    return;
  }
  
  // Get enabled primitives for select options
  const widthOptions = strokeState.widthPrimitives
    .filter(p => p.enabled)
    .map(p => `<option value="${p.name}">${p.value}px</option>`)
    .join('');
  
  const styleOptions = strokeState.stylePrimitives
    .filter(p => p.enabled)
    .map(p => `<option value="${p.name}">${p.value}</option>`)
    .join('');
  
  // Color options - use color primitives
  const colorOptions = getColorOptions();
  
  // Group tokens by base path (without .width/.style/.color)
  const groupedTokens = groupTokensByPath(tokens);
  
  container.innerHTML = `
    <div class="semantic-table stroke-table">
      <div class="semantic-table-header">
        <div class="col-path">Токен</div>
        <div class="col-width">Width</div>
        <div class="col-style">Style</div>
        <div class="col-color">Color</div>
        <div class="col-actions"></div>
      </div>
      ${Object.entries(groupedTokens).map(([basePath, group]) => `
        <div class="semantic-token-row stroke-row" data-base-path="${basePath}">
          <div class="col-path">
            <span class="token-path">${basePath}</span>
          </div>
          <div class="col-width">
            ${group.width ? `
              <select class="stroke-select" data-field="widthRef" data-token-id="${group.width.id}">
                ${widthOptions.replace(`value="${group.width.widthRef}"`, `value="${group.width.widthRef}" selected`)}
              </select>
            ` : '<span class="no-value">—</span>'}
          </div>
          <div class="col-style">
            ${group.style ? `
              <select class="stroke-select" data-field="styleRef" data-token-id="${group.style.id}">
                ${styleOptions.replace(`value="${group.style.styleRef}"`, `value="${group.style.styleRef}" selected`)}
              </select>
            ` : '<span class="no-value">—</span>'}
          </div>
          <div class="col-color">
            ${group.color ? `
              <select class="stroke-select color-select" data-field="colorRef" data-token-id="${group.color.id}">
                ${colorOptions.replace(`value="${group.color.colorRef}"`, `value="${group.color.colorRef}" selected`)}
              </select>
            ` : '<span class="no-value">—</span>'}
          </div>
          <div class="col-actions">
            <button class="btn-icon delete-stroke-group-btn" data-base-path="${basePath}" title="Удалить">×</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="semantic-toolbar">
      <button class="btn btn-secondary" id="stroke-add-token-btn">+ Добавить токен</button>
    </div>
  `;
  
  // Add change handlers
  container.querySelectorAll('.stroke-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const sel = e.target as HTMLSelectElement;
      const tokenId = sel.getAttribute('data-token-id');
      const field = sel.getAttribute('data-field') as 'widthRef' | 'styleRef' | 'colorRef';
      const value = sel.value;
      
      if (tokenId && field) {
        updateStrokeToken(tokenId, field, value);
      }
    });
  });
  
  // Delete button handlers
  container.querySelectorAll('.delete-stroke-group-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const basePath = (btn as HTMLElement).dataset.basePath;
      if (basePath) deleteStrokeTokenGroup(basePath);
    });
  });
  
  // Add token button
  const addBtn = document.getElementById('stroke-add-token-btn');
  if (addBtn) addBtn.addEventListener('click', () => addStrokeSemanticToken());
}

// Group tokens by base path (e.g., "stroke.button.default" groups .width, .style, .color)
function groupTokensByPath(tokens: StrokeSemanticToken[]): Record<string, { width?: StrokeSemanticToken; style?: StrokeSemanticToken; color?: StrokeSemanticToken }> {
  const groups: Record<string, { width?: StrokeSemanticToken; style?: StrokeSemanticToken; color?: StrokeSemanticToken }> = {};
  
  tokens.forEach(token => {
    // Extract base path by removing last segment (.width, .style, .color)
    const pathParts = token.path.split('.');
    const lastPart = pathParts[pathParts.length - 1];
    
    let basePath: string;
    if (['width', 'style', 'color'].includes(lastPart)) {
      basePath = pathParts.slice(0, -1).join('.');
    } else {
      basePath = token.path;
    }
    
    if (!groups[basePath]) {
      groups[basePath] = {};
    }
    
    if (token.property === 'width') {
      groups[basePath].width = token;
    } else if (token.property === 'style') {
      groups[basePath].style = token;
    } else if (token.property === 'color') {
      groups[basePath].color = token;
    }
  });
  
  return groups;
}

function getColorOptions(): string {
  // Color options for stroke.color references
  const colors = [
    { value: 'transparent', label: 'transparent' },
    { value: 'white', label: 'white' },
    { value: 'black', label: 'black' },
    // Neutral
    { value: 'neutral.100', label: 'neutral.100' },
    { value: 'neutral.200', label: 'neutral.200' },
    { value: 'neutral.300', label: 'neutral.300' },
    { value: 'neutral.400', label: 'neutral.400' },
    { value: 'neutral.500', label: 'neutral.500' },
    { value: 'neutral.600', label: 'neutral.600' },
    { value: 'neutral.700', label: 'neutral.700' },
    { value: 'neutral.800', label: 'neutral.800' },
    { value: 'neutral.900', label: 'neutral.900' },
    // Brand
    { value: 'brand.100', label: 'brand.100' },
    { value: 'brand.200', label: 'brand.200' },
    { value: 'brand.300', label: 'brand.300' },
    { value: 'brand.500', label: 'brand.500' },
    { value: 'brand.600', label: 'brand.600' },
    { value: 'brand.700', label: 'brand.700' },
    // Error
    { value: 'error.200', label: 'error.200' },
    { value: 'error.300', label: 'error.300' },
    { value: 'error.500', label: 'error.500' },
    { value: 'error.600', label: 'error.600' },
    // Warning
    { value: 'warning.200', label: 'warning.200' },
    { value: 'warning.300', label: 'warning.300' },
    { value: 'warning.500', label: 'warning.500' },
    // Success
    { value: 'success.200', label: 'success.200' },
    { value: 'success.300', label: 'success.300' },
    { value: 'success.500', label: 'success.500' },
    // Info
    { value: 'info.200', label: 'info.200' },
    { value: 'info.300', label: 'info.300' },
    { value: 'info.500', label: 'info.500' },
  ];
  
  return colors.map(c => `<option value="${c.value}">${c.label}</option>`).join('');
}

// ============================================
// STROKE SEMANTIC TOKEN CRUD
// ============================================

function addStrokeSemanticToken(): void {
  const basePath = `stroke.${activeStrokeCategory}.new`;
  
  // Create three tokens: width, style, color
  const widthToken: StrokeSemanticToken = {
    id: generateStrokeTokenId(),
    path: `${basePath}.width`,
    category: activeStrokeCategory as StrokeCategory,
    property: 'width',
    widthRef: '1',
  };
  
  const styleToken: StrokeSemanticToken = {
    id: generateStrokeTokenId(),
    path: `${basePath}.style`,
    category: activeStrokeCategory as StrokeCategory,
    property: 'style',
    styleRef: 'solid',
  };
  
  const colorToken: StrokeSemanticToken = {
    id: generateStrokeTokenId(),
    path: `${basePath}.color`,
    category: activeStrokeCategory as StrokeCategory,
    property: 'color',
    colorRef: 'neutral.300',
  };
  
  strokeState.semanticTokens.push(widthToken, styleToken, colorToken);
  saveStrokeState();
  renderStrokeCategoryTabs();
  renderStrokeSemanticTokens();
  
  addPendingChange({
    module: 'stroke',
    type: 'add',
    category: activeStrokeCategory,
    name: basePath,
    newValue: 'width:1, style:solid, color:neutral.300',
  });
}

function updateStrokeToken(tokenId: string, field: 'widthRef' | 'styleRef' | 'colorRef', value: string): void {
  const token = strokeState.semanticTokens.find(t => t.id === tokenId);
  if (token) {
    const oldValue = (token as any)[field];
    (token as any)[field] = value;
    saveStrokeState();
    
    addPendingChange({
      module: 'stroke',
      type: 'update',
      category: token.category,
      name: token.path,
      oldValue: String(oldValue),
      newValue: String(value),
      details: field,
    });
  }
}

function deleteStrokeTokenGroup(basePath: string): void {
  // Delete all tokens with this base path
  const tokensToDelete = strokeState.semanticTokens.filter(t => {
    const tokenBasePath = t.path.replace(/\.(width|style|color)$/, '');
    return tokenBasePath === basePath || t.path === basePath;
  });
  
  if (tokensToDelete.length > 0) {
    strokeState.semanticTokens = strokeState.semanticTokens.filter(t => !tokensToDelete.includes(t));
    saveStrokeState();
    renderStrokeCategoryTabs();
    renderStrokeSemanticTokens();
    
    addPendingChange({
      module: 'stroke',
      type: 'delete',
      category: activeStrokeCategory,
      name: basePath,
      oldValue: `${tokensToDelete.length} tokens`,
    });
  }
}

// ============================================
// EXPORT TO FIGMA
// ============================================

function exportStrokePrimitivesToFigma(): void {
  const enabledWidths = strokeState.widthPrimitives.filter(p => p.enabled);
  const enabledStyles = strokeState.stylePrimitives.filter(p => p.enabled);
  const enabledDashArrays = strokeState.dashArrayPrimitives.filter(p => p.enabled);
  
  parent.postMessage({
    pluginMessage: {
      type: 'create-stroke-primitives',
      widths: enabledWidths.map(p => ({ name: p.name, value: p.value })),
      styles: enabledStyles.map(p => ({ name: p.name, value: p.value })),
      dashArrays: enabledDashArrays.map(p => ({ name: p.name, value: p.value })),
    }
  }, '*');
  
  showStrokeExportStatus('Примитивы stroke отправлены в Figma...', 'info');
}

function exportStrokeSemanticToFigma(): void {
  parent.postMessage({
    pluginMessage: {
      type: 'create-stroke-semantic',
      tokens: strokeState.semanticTokens.map(t => ({
        id: t.id,
        path: t.path,
        category: t.category,
        property: t.property,
        widthRef: t.widthRef,
        styleRef: t.styleRef,
        colorRef: t.colorRef,
      })),
    }
  }, '*');
  
  showStrokeExportStatus('Семантические токены stroke отправлены в Figma...', 'info');
}

function showStrokeExportStatus(message: string, type: 'info' | 'success' | 'error'): void {
  const statusEl = document.getElementById('stroke-export-status');
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
  
  if (msg.type === 'stroke-primitives-created') {
    showStrokeExportStatus(`✅ Создано ${msg.count} примитивов stroke`, 'success');
  } else if (msg.type === 'stroke-semantic-created') {
    showStrokeExportStatus(`✅ Создано ${msg.count} семантических токенов stroke`, 'success');
  } else if (msg.type === 'stroke-error') {
    showStrokeExportStatus(`❌ Ошибка: ${msg.error}`, 'error');
  }
});
