/**
 * Token Manager UI Component
 * Left Panel: Token Tree with collections and folders
 * Project Sync: View and manage project variables and styles
 */

import {
  TokenDefinition,
  TokenManagerState,
  TMCollectionType,
  TMColorValue,
  ProjectSyncData,
  ProjectCollection,
  ProjectStyle,
} from '../types/token-manager';

import {
  getState,
  getTokens,
  getTokenById,
  createToken,
  updateToken,
  deleteToken,
  toggleTokenEnabled,
  setSelectedToken,
  togglePathExpanded,
  setSearchQuery,
  setFilterCollection,
  generateColorPrimitives,
  saveState,
  loadState,
  filterTokens,
  generateId,
  buildFullPath,
  importFromProjectSync,
  clearAllTokens,
} from '../types/token-manager-state';

import { getCurrentProduct } from './primitives-generator-ui';

import {
  DEFAULT_PALETTES,
  COLOR_SCALE,
} from '../types/token-manager-constants';

// ============================================
// PROJECT SYNC STATE
// ============================================

let projectSyncData: ProjectSyncData | null = null;
let projectSyncTab: 'overview' | 'collections' | 'styles' = 'overview';
let selectedCollectionId: string | null = null;

export function setProjectSyncData(data: ProjectSyncData): void {
  projectSyncData = data;
}

export function getProjectSyncData(): ProjectSyncData | null {
  return projectSyncData;
}

// ============================================
// TOKEN TREE NODE STRUCTURE
// ============================================

interface TreeNode {
  id: string;
  name: string;
  path: string[];
  fullPath: string;
  type: 'collection' | 'folder' | 'token';
  children: TreeNode[];
  token?: TokenDefinition;
  expanded: boolean;
  enabled: boolean;
  tokenCount: number;
}

// ============================================
// TREE BUILDING
// ============================================

export function buildTokenTree(tokens: TokenDefinition[]): TreeNode[] {
  const collections: Record<TMCollectionType, TreeNode> = {
    'Primitives': {
      id: 'collection-primitives',
      name: 'Primitives',
      path: [],
      fullPath: 'Primitives',
      type: 'collection',
      children: [],
      expanded: true,
      enabled: true,
      tokenCount: 0,
    },
    'Tokens': {
      id: 'collection-tokens',
      name: 'Tokens',
      path: [],
      fullPath: 'Tokens',
      type: 'collection',
      children: [],
      expanded: true,
      enabled: true,
      tokenCount: 0,
    },
    'Components': {
      id: 'collection-components',
      name: 'Components',
      path: [],
      fullPath: 'Components',
      type: 'collection',
      children: [],
      expanded: true,
      enabled: true,
      tokenCount: 0,
    },
  };

  for (const token of tokens) {
    const collection = collections[token.collection];
    if (!collection) continue;

    collection.tokenCount++;
    
    let currentNode = collection;
    const pathParts = token.path;

    // Build folder structure
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const partPath = pathParts.slice(0, i + 1);
      const partFullPath = `${token.collection}/${partPath.join('/')}`;

      let childNode = currentNode.children.find(c => c.name === part && c.type === 'folder');

      if (!childNode) {
        childNode = {
          id: `folder-${partFullPath}`,
          name: part,
          path: partPath,
          fullPath: partFullPath,
          type: 'folder',
          children: [],
          expanded: getState().expandedPaths.includes(partFullPath),
          enabled: true,
          tokenCount: 0,
        };
        currentNode.children.push(childNode);
      }

      childNode.tokenCount++;
      currentNode = childNode;
    }

    // Add token node
    const tokenNode: TreeNode = {
      id: token.id,
      name: token.name,
      path: token.path,
      fullPath: token.fullPath,
      type: 'token',
      children: [],
      token,
      expanded: false,
      enabled: token.enabled,
      tokenCount: 1,
    };
    currentNode.children.push(tokenNode);
  }

  // Sort children: folders first, then tokens (with natural number sorting)
  const naturalSort = (a: string, b: string): number => {
    // Extract number suffix if exists (e.g., "accent-25" -> 25)
    const aMatch = a.match(/^(.+?)-?(\d+)$/);
    const bMatch = b.match(/^(.+?)-?(\d+)$/);
    
    if (aMatch && bMatch && aMatch[1] === bMatch[1]) {
      // Same prefix, compare numbers
      return parseInt(aMatch[2]) - parseInt(bMatch[2]);
    }
    
    // Different prefixes or no numbers, use locale compare
    return a.localeCompare(b);
  };
  
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return naturalSort(a.name, b.name);
    }).map(node => ({
      ...node,
      children: sortNodes(node.children),
    }));
  };

  // Filter out empty collections (when filter is set or no tokens)
  const state = getState();
  const result = Object.values(collections)
    .filter(c => {
      // If filtering by specific collection, only show that one
      if (state.filterCollection !== 'all') {
        return c.name === state.filterCollection;
      }
      // Otherwise show all non-empty collections
      return c.tokenCount > 0;
    })
    .map(c => ({
      ...c,
      children: sortNodes(c.children),
    }));
  
  return result;
}

// ============================================
// TREE RENDERING
// ============================================

export function renderTreeNode(node: TreeNode, depth = 0): string {
  const indent = depth * 16;
  const state = getState();
  const isSelected = node.type === 'token' && state.selectedTokenId === node.id;
  
  if (node.type === 'collection') {
    return `
      <div class="tm-collection" data-collection="${node.name}">
        <div class="tm-collection-header" data-path="${node.fullPath}">
          <span class="tm-expand-icon">${node.expanded ? '▼' : '▶'}</span>
          <span class="tm-collection-icon">📁</span>
          <span class="tm-collection-name">${node.name}</span>
          <span class="tm-count">${node.tokenCount}</span>
        </div>
        <div class="tm-collection-content ${node.expanded ? '' : 'hidden'}">
          ${node.children.map(child => renderTreeNode(child, depth + 1)).join('')}
        </div>
      </div>
    `;
  }

  if (node.type === 'folder') {
    return `
      <div class="tm-folder" style="padding-left: ${indent}px">
        <div class="tm-folder-header" data-path="${node.fullPath}">
          <span class="tm-expand-icon">${node.expanded ? '▼' : '▶'}</span>
          <span class="tm-folder-icon">📂</span>
          <span class="tm-folder-name">${node.name}</span>
          <span class="tm-count">${node.tokenCount}</span>
        </div>
        <div class="tm-folder-content ${node.expanded ? '' : 'hidden'}">
          ${node.children.map(child => renderTreeNode(child, depth + 1)).join('')}
        </div>
      </div>
    `;
  }

  // Token node
  const token = node.token!;
  const colorPreview = token.type === 'COLOR' && typeof token.value === 'object' && 'hex' in token.value
    ? `<span class="tm-color-preview" style="background-color: ${(token.value as TMColorValue).hex}"></span>`
    : '';

  return `
    <div class="tm-token ${isSelected ? 'selected' : ''} ${!token.enabled ? 'disabled' : ''}" 
         style="padding-left: ${indent}px"
         data-token-id="${token.id}">
      <label class="tm-checkbox-wrapper">
        <input type="checkbox" class="tm-token-checkbox" 
               data-token-id="${token.id}" 
               ${token.enabled ? 'checked' : ''}>
      </label>
      ${colorPreview}
      <span class="tm-token-name">${token.name}</span>
      ${token.type === 'COLOR' && typeof token.value === 'object' && 'hex' in token.value
        ? `<span class="tm-token-value">${(token.value as TMColorValue).hex}</span>`
        : ''}
    </div>
  `;
}

export function renderTokenTree(): string {
  const state = getState();
  
  // Use filterTokens which applies all filters (collection, enabled, search)
  const tokens = filterTokens();

  if (tokens.length === 0) {
    return `
      <div class="tm-empty">
        <p>🗂 Карта токенов пуста</p>
        <p style="font-size: 11px; color: var(--color-text-secondary); margin-top: 8px;">
          Перейдите во вкладку <b>Примитивы</b> для генерации токенов
        </p>
        <button class="btn btn-primary tm-goto-primitives" style="margin-top: 12px;">
          🎨 Перейти к генерации
        </button>
      </div>
    `;
  }

  const tree = buildTokenTree(tokens);
  return tree.map(node => renderTreeNode(node)).join('');
}

// ============================================
// TOOLBAR RENDERING
// ============================================

export function renderToolbar(): string {
  const state = getState();

  return `
    <div class="tm-toolbar">
      <div class="tm-search">
        <input type="text" 
               class="tm-search-input" 
               placeholder="🔍 Поиск токенов..."
               value="${state.searchQuery}">
      </div>
      <div class="tm-filters">
        <select class="tm-filter-collection">
          <option value="all" ${state.filterCollection === 'all' ? 'selected' : ''}>Все коллекции</option>
          <option value="Primitives" ${state.filterCollection === 'Primitives' ? 'selected' : ''}>Primitives</option>
          <option value="Tokens" ${state.filterCollection === 'Tokens' ? 'selected' : ''}>Tokens</option>
          <option value="Components" ${state.filterCollection === 'Components' ? 'selected' : ''}>Components</option>
        </select>
        <select class="tm-filter-enabled">
          <option value="all" ${state.filterEnabled === 'all' ? 'selected' : ''}>Все</option>
          <option value="enabled" ${state.filterEnabled === 'enabled' ? 'selected' : ''}>Включённые</option>
          <option value="disabled" ${state.filterEnabled === 'disabled' ? 'selected' : ''}>Выключенные</option>
        </select>
      </div>
      <div class="tm-actions">
        <button class="btn btn-sm btn-secondary tm-add-token" title="Добавить токен">+</button>
        <button class="btn btn-sm btn-secondary tm-expand-all" title="Развернуть все">⏷</button>
        <button class="btn btn-sm btn-secondary tm-collapse-all" title="Свернуть все">⏶</button>
        <button class="tm-settings-toggle" title="Настройки">⚙️</button>
      </div>
    </div>
  `;
}

// ============================================
// SETTINGS PANEL
// ============================================

export function renderSettingsPanel(): string {
  const state = getState();
  const settings = state.settings;

  // Generate preview based on current settings
  const previewPath = generatePathPreview(settings.separator, settings.caseStyle);

  return `
    <div class="tm-settings-modal-overlay" id="settings-modal-overlay">
      <div class="tm-settings-panel" id="settings-panel">
        <div class="tm-settings-header">
          <span class="tm-settings-title">Настройки</span>
          <button class="tm-settings-close">✕</button>
        </div>
        
        <div class="ts-container">
          <div class="ts-section">
            <div class="ts-section-title">Разделитель пути</div>
            <div class="ts-field">
              <div class="ts-radio-group">
                <div class="ts-radio-option">
                  <input type="radio" name="separator" id="sep-slash" value="/" ${settings.separator === '/' ? 'checked' : ''}>
                  <label for="sep-slash">/</label>
                </div>
                <div class="ts-radio-option">
                  <input type="radio" name="separator" id="sep-dot" value="." ${settings.separator === '.' ? 'checked' : ''}>
                  <label for="sep-dot">.</label>
                </div>
                <div class="ts-radio-option">
                  <input type="radio" name="separator" id="sep-dash" value="-" ${settings.separator === '-' ? 'checked' : ''}>
                  <label for="sep-dash">-</label>
                </div>
              </div>
              <div class="ts-info">Разделитель между уровнями иерархии</div>
            </div>
          </div>

          <div class="ts-section">
            <div class="ts-section-title">Стиль именования</div>
            <div class="ts-field">
              <div class="ts-radio-group">
                <div class="ts-radio-option">
                  <input type="radio" name="caseStyle" id="case-kebab" value="kebab" ${settings.caseStyle === 'kebab' ? 'checked' : ''}>
                  <label for="case-kebab">kebab-case</label>
                </div>
                <div class="ts-radio-option">
                  <input type="radio" name="caseStyle" id="case-camel" value="camel" ${settings.caseStyle === 'camel' ? 'checked' : ''}>
                  <label for="case-camel">camelCase</label>
                </div>
              </div>
              <div class="ts-radio-group" style="margin-top: 4px;">
                <div class="ts-radio-option">
                  <input type="radio" name="caseStyle" id="case-snake" value="snake" ${settings.caseStyle === 'snake' ? 'checked' : ''}>
                  <label for="case-snake">snake_case</label>
                </div>
                <div class="ts-radio-option">
                  <input type="radio" name="caseStyle" id="case-pascal" value="pascal" ${settings.caseStyle === 'pascal' ? 'checked' : ''}>
                  <label for="case-pascal">PascalCase</label>
                </div>
              </div>
            </div>
          </div>

          <div class="ts-section">
            <div class="ts-section-title">Превью формата</div>
            <div class="ts-preview">
              <div class="ts-preview-label">Примитив:</div>
              <div>${previewPath.primitive}</div>
            </div>
            <div class="ts-preview">
              <div class="ts-preview-label">Семантический:</div>
              <div>${previewPath.semantic}</div>
            </div>
            <div class="ts-preview">
              <div class="ts-preview-label">Компонент:</div>
              <div>${previewPath.component}</div>
            </div>
          </div>

          <div class="ts-section">
            <div class="ts-section-title">Режимы</div>
            <div class="ts-toggle">
              <span class="ts-toggle-label">Dark Mode</span>
              <label class="ts-switch">
                <input type="checkbox" id="dark-mode-toggle" ${settings.darkModeEnabled ? 'checked' : ''}>
                <span class="ts-switch-slider"></span>
              </label>
            </div>
            <div class="ts-info">Включить поддержку светлой/тёмной темы</div>
          </div>

          <div class="ts-section">
            <div class="ts-section-title">Синхронизация</div>
            <div class="ts-toggle">
              <span class="ts-toggle-label">Auto-sync с Figma</span>
              <label class="ts-switch">
                <input type="checkbox" id="auto-sync-toggle" ${settings.autoSync ? 'checked' : ''}>
                <span class="ts-switch-slider"></span>
              </label>
            </div>
            <div class="ts-info">Автоматически синхронизировать изменения</div>
          </div>

          <div class="ts-section">
            <div class="ts-section-title">Формат экспорта</div>
            <div class="ts-field">
              <select class="te-select ts-export-format" id="export-format-select">
                <option value="json" ${settings.exportFormat === 'json' ? 'selected' : ''}>JSON (Design Tokens)</option>
                <option value="css" ${settings.exportFormat === 'css' ? 'selected' : ''}>CSS Variables</option>
                <option value="scss" ${settings.exportFormat === 'scss' ? 'selected' : ''}>SCSS Variables</option>
                <option value="figma" ${settings.exportFormat === 'figma' ? 'selected' : ''}>Figma Variables</option>
                <option value="tailwind" ${settings.exportFormat === 'tailwind' ? 'selected' : ''}>Tailwind Config</option>
              </select>
            </div>
          </div>

          <div class="ts-actions">
            <button class="btn btn-primary ts-save-settings">Сохранить</button>
            <button class="btn btn-secondary ts-reset-settings">Сбросить</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generatePathPreview(separator: string, caseStyle: string): { primitive: string; semantic: string; component: string } {
  const formatName = (name: string): string => {
    switch (caseStyle) {
      case 'camel':
        return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      case 'snake':
        return name.replace(/-/g, '_');
      case 'pascal':
        return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      default: // kebab
        return name;
    }
  };

  const sep = separator;
  
  return {
    primitive: `colors${sep}${formatName('brand')}${sep}${formatName('brand-500')}`,
    semantic: `${formatName('bg')}${sep}${formatName('surface')}${sep}${formatName('primary')}`,
    component: `${formatName('button')}${sep}${formatName('primary')}${sep}${formatName('primary-bg')}`,
  };
}

// ============================================
// STATS PANEL
// ============================================

export function renderStats(): string {
  const tokens = getTokens();
  const primitives = tokens.filter(t => t.collection === 'Primitives').length;
  const semantic = tokens.filter(t => t.collection === 'Tokens').length;
  const components = tokens.filter(t => t.collection === 'Components').length;
  const enabled = tokens.filter(t => t.enabled).length;

  return `
    <div class="tm-stats">
      <div class="tm-stat">
        <span class="tm-stat-value">${primitives}</span>
        <span class="tm-stat-label">Примитивы</span>
      </div>
      <div class="tm-stat">
        <span class="tm-stat-value">${semantic}</span>
        <span class="tm-stat-label">Токены</span>
      </div>
      <div class="tm-stat">
        <span class="tm-stat-value">${components}</span>
        <span class="tm-stat-label">Компоненты</span>
      </div>
      <div class="tm-stat">
        <span class="tm-stat-value">${enabled}/${tokens.length}</span>
        <span class="tm-stat-label">Активных</span>
      </div>
    </div>
  `;
}

// ============================================
// FULL TOKEN MANAGER PANEL
// ============================================

// Token Manager active tab: 'tokens' or 'sync'
let tokenManagerActiveTab: 'tokens' | 'sync' = 'sync';

export function setTokenManagerTab(tab: 'tokens' | 'sync'): void {
  tokenManagerActiveTab = tab;
}

export function renderTokenManager(): string {
  return `
    <div class="tm-main-tabs">
      <button class="tm-main-tab ${tokenManagerActiveTab === 'sync' ? 'active' : ''}" data-tm-tab="sync">
        🔄 Project Sync
      </button>
      <button class="tm-main-tab ${tokenManagerActiveTab === 'tokens' ? 'active' : ''}" data-tm-tab="tokens">
        🗂 Token Map
      </button>
    </div>
    
    ${tokenManagerActiveTab === 'sync' ? `
      <div class="project-sync-wrapper">
        ${renderProjectSync()}
      </div>
    ` : `
      <div class="tm-two-panel" style="position: relative;">
        <div class="tm-left-panel">
          <div class="tm-container">
            ${renderStats()}
            ${renderToolbar()}
            <div class="tm-tree-container">
              ${renderTokenTree()}
            </div>
            <div class="tm-footer">
              <button class="btn btn-primary tm-sync-figma">📤 Синхр. с Figma</button>
              <button class="btn btn-secondary tm-export-json">📦 Export JSON</button>
            </div>
          </div>
        </div>
        <div class="tm-right-panel">
          <div id="token-editor-container"></div>
        </div>
        ${renderSettingsPanel()}
      </div>
    `}
  `;
}

// ============================================
// EVENT HANDLERS
// ============================================

export function initTokenManagerEvents(container: HTMLElement, refreshCallback: () => void): void {
  // Main tab switching (sync / tokens)
  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const tabBtn = target.closest('.tm-main-tab') as HTMLElement;
    if (tabBtn) {
      const tab = tabBtn.dataset.tmTab as 'tokens' | 'sync';
      if (tab) {
        tokenManagerActiveTab = tab;
        refreshCallback();
      }
      return;
    }
  });
  
  // Project Sync event handlers
  handleProjectSyncEvents(container);
  
  // Search
  container.addEventListener('input', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('tm-search-input')) {
      setSearchQuery((target as HTMLInputElement).value);
      refreshCallback();
    }
  });

  // Collection filter
  container.addEventListener('change', (e) => {
    const target = e.target as HTMLElement;
    
    if (target.classList.contains('tm-filter-collection')) {
      const value = (target as HTMLSelectElement).value as TMCollectionType | 'all';
      setFilterCollection(value);
      refreshCallback();
    }

    if (target.classList.contains('tm-filter-enabled')) {
      const state = getState();
      const value = (target as HTMLSelectElement).value as 'all' | 'enabled' | 'disabled';
      state.filterEnabled = value;
      refreshCallback();
    }

    // Token checkbox
    if (target.classList.contains('tm-token-checkbox')) {
      const tokenId = (target as HTMLInputElement).dataset.tokenId;
      if (tokenId) {
        toggleTokenEnabled(tokenId);
        refreshCallback();
      }
    }
  });

  // Click handlers
  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Expand/collapse collection
    if (target.closest('.tm-collection-header')) {
      const header = target.closest('.tm-collection-header') as HTMLElement;
      const path = header.dataset.path;
      if (path) {
        togglePathExpanded(path);
        refreshCallback();
      }
    }

    // Expand/collapse folder
    if (target.closest('.tm-folder-header')) {
      const header = target.closest('.tm-folder-header') as HTMLElement;
      const path = header.dataset.path;
      if (path) {
        togglePathExpanded(path);
        refreshCallback();
      }
    }

    // Select token
    if (target.closest('.tm-token') && !target.classList.contains('tm-token-checkbox')) {
      const tokenEl = target.closest('.tm-token') as HTMLElement;
      const tokenId = tokenEl.dataset.tokenId;
      if (tokenId) {
        setSelectedToken(tokenId);
        refreshCallback();
        // Dispatch event for editor panel
        container.dispatchEvent(new CustomEvent('token-selected', { detail: { tokenId } }));
      }
    }

    // Go to primitives tab
    if (target.classList.contains('tm-goto-primitives')) {
      const primitivesTab = document.querySelector('[data-tab="primitives"]');
      if (primitivesTab) (primitivesTab as HTMLElement).click();
    }

    // Generate defaults (legacy, still available)
    if (target.classList.contains('tm-generate-defaults')) {
      generateDefaultPrimitives();
      refreshCallback();
    }

    // Expand all
    if (target.classList.contains('tm-expand-all')) {
      expandAllPaths();
      refreshCallback();
    }

    // Collapse all
    if (target.classList.contains('tm-collapse-all')) {
      collapseAllPaths();
      refreshCallback();
    }

    // Sync to Figma
    if (target.classList.contains('tm-sync-figma')) {
      container.dispatchEvent(new CustomEvent('sync-figma'));
    }

    // Export JSON
    if (target.classList.contains('tm-export-json')) {
      container.dispatchEvent(new CustomEvent('export-json'));
    }

    // Add token
    if (target.classList.contains('tm-add-token')) {
      container.dispatchEvent(new CustomEvent('add-token'));
    }

    // Settings toggle
    if (target.classList.contains('tm-settings-toggle')) {
      const overlay = container.querySelector('#settings-modal-overlay') as HTMLElement;
      if (overlay) {
        overlay.classList.add('open');
      }
    }

    // Settings close
    if (target.classList.contains('tm-settings-close')) {
      const overlay = container.querySelector('#settings-modal-overlay') as HTMLElement;
      if (overlay) {
        overlay.classList.remove('open');
      }
    }

    // Click on overlay to close
    if (target.id === 'settings-modal-overlay') {
      target.classList.remove('open');
    }

    // Save settings
    if (target.classList.contains('ts-save-settings')) {
      saveSettingsFromPanel(container);
      saveState();
      refreshCallback();
      container.dispatchEvent(new CustomEvent('settings-saved'));
      // Close modal after save
      const overlay = container.querySelector('#settings-modal-overlay') as HTMLElement;
      if (overlay) {
        overlay.classList.remove('open');
      }
    }

    // Reset settings
    if (target.classList.contains('ts-reset-settings')) {
      resetSettings();
      refreshCallback();
      // Close modal after reset
      const overlay = container.querySelector('#settings-modal-overlay') as HTMLElement;
      if (overlay) {
        overlay.classList.remove('open');
      }
    }
  });

  // Settings radio/checkbox changes for live preview
  container.addEventListener('change', (e) => {
    const target = e.target as HTMLElement;

    // Separator change
    if ((target as HTMLInputElement).name === 'separator') {
      updateSettingsPreview(container);
    }

    // Case style change
    if ((target as HTMLInputElement).name === 'caseStyle') {
      updateSettingsPreview(container);
    }
  });
}

function saveSettingsFromPanel(container: HTMLElement): void {
  const state = getState();
  
  // Separator
  const separatorInput = container.querySelector('input[name="separator"]:checked') as HTMLInputElement;
  if (separatorInput) {
    state.settings.separator = separatorInput.value as '/' | '.' | '-';
  }

  // Case style
  const caseInput = container.querySelector('input[name="caseStyle"]:checked') as HTMLInputElement;
  if (caseInput) {
    state.settings.caseStyle = caseInput.value as 'kebab' | 'camel' | 'snake' | 'pascal';
  }

  // Dark mode
  const darkModeInput = container.querySelector('#dark-mode-toggle') as HTMLInputElement;
  if (darkModeInput) {
    state.settings.darkModeEnabled = darkModeInput.checked;
  }

  // Auto sync
  const autoSyncInput = container.querySelector('#auto-sync-toggle') as HTMLInputElement;
  if (autoSyncInput) {
    state.settings.autoSync = autoSyncInput.checked;
  }

  // Export format
  const exportFormatSelect = container.querySelector('#export-format-select') as HTMLSelectElement;
  if (exportFormatSelect) {
    state.settings.exportFormat = exportFormatSelect.value as 'figma' | 'json' | 'css' | 'scss' | 'tailwind';
  }

  state.hasUnsavedChanges = true;
}

function updateSettingsPreview(container: HTMLElement): void {
  const separatorInput = container.querySelector('input[name="separator"]:checked') as HTMLInputElement;
  const caseInput = container.querySelector('input[name="caseStyle"]:checked') as HTMLInputElement;

  const separator = separatorInput?.value || '/';
  const caseStyle = caseInput?.value || 'kebab';

  const preview = generatePathPreview(separator, caseStyle);

  const previews = container.querySelectorAll('.ts-preview');
  if (previews[0]) {
    previews[0].innerHTML = `<div class="ts-preview-label">Примитив:</div><div>${preview.primitive}</div>`;
  }
  if (previews[1]) {
    previews[1].innerHTML = `<div class="ts-preview-label">Семантический:</div><div>${preview.semantic}</div>`;
  }
  if (previews[2]) {
    previews[2].innerHTML = `<div class="ts-preview-label">Компонент:</div><div>${preview.component}</div>`;
  }
}

function resetSettings(): void {
  const state = getState();
  state.settings = {
    separator: '/',
    caseStyle: 'kebab',
    exportFormat: 'json',
    autoSync: false,
    darkModeEnabled: true,
  };
  state.hasUnsavedChanges = true;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function generateDefaultPrimitives(): void {
  const palettes = DEFAULT_PALETTES.map(p => ({ name: p.name, hex: p.hex }));
  const tokens = generateColorPrimitives(palettes);
  
  // Tokens are added to state in generateColorPrimitives
  saveState();
}

export function expandAllPaths(): void {
  const state = getState();
  const tokens = getTokens();
  const paths = new Set<string>();

  // Add all collection paths
  paths.add('Primitives');
  paths.add('Tokens');
  paths.add('Components');

  // Add all folder paths
  for (const token of tokens) {
    for (let i = 0; i < token.path.length; i++) {
      const path = `${token.collection}/${token.path.slice(0, i + 1).join('/')}`;
      paths.add(path);
    }
  }

  state.expandedPaths = Array.from(paths);
}

export function collapseAllPaths(): void {
  const state = getState();
  state.expandedPaths = [];
}

// ============================================
// INITIALIZE
// ============================================

export function initTokenManager(): void {
  loadState();
}

// ============================================
// PROJECT SYNC UI
// ============================================

export function renderProjectSync(): string {
  if (!projectSyncData) {
    return `
      <div class="project-sync">
        <div class="project-sync-empty">
          <div class="sync-icon">🔄</div>
          <p>Нажмите кнопку ниже, чтобы загрузить данные из проекта Figma</p>
          <button class="btn btn-primary" id="btn-sync-from-project">
            🔄 Синхронизировать с проектом
          </button>
        </div>
      </div>
    `;
  }
  
  const { summary, collections, styles, syncedAt } = projectSyncData;
  const syncTime = new Date(syncedAt).toLocaleTimeString();
  
  return `
    <div class="project-sync">
      <div class="project-sync-header">
        <div class="sync-status">
          <span class="sync-badge sync-success">✓ Синхронизировано</span>
          <span class="sync-time">${syncTime}</span>
        </div>
        <button class="btn btn-sm btn-secondary" id="btn-sync-from-project">
          🔄 Обновить
        </button>
      </div>
      
      <div class="project-sync-tabs">
        <button class="sync-tab ${projectSyncTab === 'overview' ? 'active' : ''}" data-sync-tab="overview">
          Обзор
        </button>
        <button class="sync-tab ${projectSyncTab === 'collections' ? 'active' : ''}" data-sync-tab="collections">
          Коллекции (${summary.totalCollections})
        </button>
        <button class="sync-tab ${projectSyncTab === 'styles' ? 'active' : ''}" data-sync-tab="styles">
          Стили (${summary.totalPaintStyles + summary.totalTextStyles})
        </button>
      </div>
      
      <div class="project-sync-content">
        ${projectSyncTab === 'overview' ? renderSyncOverview(summary, collections, styles) : ''}
        ${projectSyncTab === 'collections' ? renderSyncCollections(collections) : ''}
        ${projectSyncTab === 'styles' ? renderSyncStyles(styles) : ''}
      </div>
    </div>
  `;
}

function renderSyncOverview(
  summary: ProjectSyncData['summary'],
  collections: ProjectSyncData['collections'],
  styles: ProjectSyncData['styles']
): string {
  // Determine available actions - check for component colors (most specific level)
  const componentsCollection = collections.managed.find(c => c.name === 'Components');
  const componentColorCount = componentsCollection?.variables.filter(v => v.resolvedType === 'COLOR').length || 0;
  
  const hasColorVars = componentColorCount > 0;
  const hasPaintStyles = styles.paint.managed.length > 0;
  const hasTypographyVars = collections.managed.some(c => c.name === 'Typography');
  const hasTextStyles = styles.text.managed.length > 0;
  
  return `
    <div class="sync-overview">
      <div class="sync-summary-grid">
        <div class="sync-summary-card">
          <div class="summary-icon">📦</div>
          <div class="summary-value">${summary.managedCollections}</div>
          <div class="summary-label">Коллекций</div>
          <div class="summary-detail">из ${summary.totalCollections}</div>
        </div>
        <div class="sync-summary-card">
          <div class="summary-icon">🔢</div>
          <div class="summary-value">${summary.managedVariables}</div>
          <div class="summary-label">Переменных</div>
          <div class="summary-detail">из ${summary.totalVariables}</div>
        </div>
        <div class="sync-summary-card ${!hasPaintStyles ? 'action-available' : ''}">
          <div class="summary-icon">🎨</div>
          <div class="summary-value">${summary.managedPaintStyles}</div>
          <div class="summary-label">Paint Styles</div>
          <div class="summary-detail">из ${summary.totalPaintStyles}</div>
        </div>
        <div class="sync-summary-card">
          <div class="summary-icon">🔤</div>
          <div class="summary-value">${summary.managedTextStyles}</div>
          <div class="summary-label">Text Styles</div>
          <div class="summary-detail">из ${summary.totalTextStyles}</div>
        </div>
      </div>
      
      <div class="sync-actions-section">
        <div class="section-title">Быстрые действия</div>
        
        ${hasColorVars && !hasPaintStyles ? `
        <div class="sync-action-card action-highlight">
          <div class="action-icon">🎨</div>
          <div class="action-info">
            <div class="action-title">Создать Paint Styles</div>
            <div class="action-desc">${componentColorCount} компонентных цветов → Paint Styles</div>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-create-paint-styles-from-vars">
            Создать
          </button>
        </div>
        ` : ''}
        
        ${hasColorVars && hasPaintStyles ? `
        <div class="sync-action-card">
          <div class="action-icon">🔄</div>
          <div class="action-info">
            <div class="action-title">Paint Styles синхронизированы</div>
            <div class="action-desc">${summary.managedPaintStyles} стилей (${componentColorCount} компонентных цветов)</div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-update-paint-styles">
            Обновить
          </button>
        </div>
        ` : ''}
        
        ${!hasColorVars ? `
        <div class="sync-action-card action-warning">
          <div class="action-icon">⚠️</div>
          <div class="action-info">
            <div class="action-title">Нет компонентных цветов</div>
            <div class="action-desc">Сначала сгенерируйте цвета (нужна коллекция Components)</div>
          </div>
          <button class="btn btn-secondary btn-sm" disabled>
            Недоступно
          </button>
        </div>
        ` : ''}
        
        ${summary.managedVariables > 0 ? `
        <div class="sync-action-card action-highlight">
          <div class="action-icon">🗂</div>
          <div class="action-info">
            <div class="action-title">Импортировать в Token Map</div>
            <div class="action-desc">${summary.managedVariables} переменных → редактирование, настройки форматирования</div>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-import-to-token-map">
            Импортировать
          </button>
        </div>
        ` : ''}
      </div>
      
      <div class="sync-collections-preview">
        <div class="section-title">Управляемые коллекции</div>
        <div class="collections-list">
          ${collections.managed.map(c => `
            <div class="collection-row">
              <span class="collection-name">📁 ${c.name}</span>
              <span class="collection-modes">${c.modes.map(m => m.name).join(', ')}</span>
              <span class="collection-count">${c.variableCount} vars</span>
            </div>
          `).join('')}
          ${collections.managed.length === 0 ? '<div class="empty-hint">Нет управляемых коллекций</div>' : ''}
        </div>
      </div>
      
      ${collections.other.length > 0 ? `
      <div class="sync-other-section">
        <div class="section-title">Прочее на проекте <span class="badge">read-only</span></div>
        <div class="other-list">
          ${collections.other.map(c => `
            <div class="other-row">
              <span class="other-name">📁 ${c.name}</span>
              <span class="other-count">${c.variableCount} vars</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

function renderSyncCollections(collections: ProjectSyncData['collections']): string {
  const allCollections = [...collections.managed, ...collections.other];
  const selected = selectedCollectionId 
    ? allCollections.find(c => c.id === selectedCollectionId) 
    : null;
  
  return `
    <div class="sync-collections">
      <div class="collections-sidebar">
        <div class="collections-group">
          <div class="group-title">Управляемые</div>
          ${collections.managed.map(c => `
            <div class="collection-item ${c.id === selectedCollectionId ? 'selected' : ''}" 
                 data-collection-id="${c.id}">
              <span class="collection-icon">📦</span>
              <span class="collection-name">${c.name}</span>
              <span class="collection-badge">${c.variableCount}</span>
            </div>
          `).join('')}
        </div>
        ${collections.other.length > 0 ? `
        <div class="collections-group">
          <div class="group-title">Прочее</div>
          ${collections.other.map(c => `
            <div class="collection-item other ${c.id === selectedCollectionId ? 'selected' : ''}" 
                 data-collection-id="${c.id}">
              <span class="collection-icon">📁</span>
              <span class="collection-name">${c.name}</span>
              <span class="collection-badge">${c.variableCount}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
      
      <div class="collection-detail">
        ${selected ? renderCollectionDetail(selected) : `
          <div class="detail-empty">
            <p>Выберите коллекцию для просмотра переменных</p>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderCollectionDetail(collection: ProjectCollection): string {
  return `
    <div class="collection-detail-header">
      <h3>${collection.name}</h3>
      <div class="collection-meta">
        <span class="meta-item">Режимы: ${collection.modes.map(m => m.name).join(', ')}</span>
        <span class="meta-item">${collection.variableCount} переменных</span>
        ${!collection.isManaged ? '<span class="badge badge-warning">read-only</span>' : ''}
      </div>
    </div>
    <div class="variables-list">
      ${collection.variables.slice(0, 100).map(v => {
        const valueDisplay = renderVariableValue(v);
        return `
          <div class="variable-row">
            <span class="var-name">${v.name}</span>
            <span class="var-type">${v.resolvedType}</span>
            <span class="var-value">${valueDisplay}</span>
          </div>
        `;
      }).join('')}
      ${collection.variables.length > 100 ? `
        <div class="variables-more">...и ещё ${collection.variables.length - 100} переменных</div>
      ` : ''}
    </div>
  `;
}

function renderVariableValue(v: ProjectSyncData['collections']['managed'][0]['variables'][0]): string {
  if (v.resolvedType === 'COLOR' && v.value && typeof v.value === 'object') {
    const r = Math.round(v.value.r * 255);
    const g = Math.round(v.value.g * 255);
    const b = Math.round(v.value.b * 255);
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    return `<span class="color-swatch" style="background: ${hex}"></span>${hex}`;
  }
  if (v.resolvedType === 'FLOAT') {
    return String(v.value);
  }
  return String(v.value || '-');
}

function renderSyncStyles(styles: ProjectSyncData['styles']): string {
  return `
    <div class="sync-styles">
      <div class="styles-section">
        <div class="section-title">🎨 Paint Styles</div>
        <div class="styles-grid">
          <div class="styles-group">
            <div class="group-title">Управляемые (color/...)</div>
            ${styles.paint.managed.length > 0 ? styles.paint.managed.map(s => `
              <div class="style-item">
                ${s.color ? `<span class="color-swatch" style="background: rgb(${Math.round(s.color.r*255)},${Math.round(s.color.g*255)},${Math.round(s.color.b*255)})"></span>` : ''}
                <span class="style-name">${s.name}</span>
              </div>
            `).join('') : '<div class="empty-hint">Нет paint styles. Создайте их из Variables!</div>'}
          </div>
          ${styles.paint.other.length > 0 ? `
          <div class="styles-group">
            <div class="group-title">Прочее <span class="badge">read-only</span></div>
            ${styles.paint.other.map(s => `
              <div class="style-item other">
                ${s.color ? `<span class="color-swatch" style="background: rgb(${Math.round(s.color.r*255)},${Math.round(s.color.g*255)},${Math.round(s.color.b*255)})"></span>` : ''}
                <span class="style-name">${s.name}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="styles-section">
        <div class="section-title">🔤 Text Styles</div>
        <div class="styles-grid">
          <div class="styles-group">
            <div class="group-title">Управляемые (typography/...)</div>
            ${styles.text.managed.length > 0 ? styles.text.managed.map(s => `
              <div class="style-item">
                <span class="style-preview" style="font-size: ${Math.min(s.fontSize || 14, 16)}px">${s.fontFamily || 'Font'}</span>
                <span class="style-name">${s.name}</span>
              </div>
            `).join('') : '<div class="empty-hint">Нет text styles</div>'}
          </div>
          ${styles.text.other.length > 0 ? `
          <div class="styles-group">
            <div class="group-title">Прочее <span class="badge">read-only</span></div>
            ${styles.text.other.slice(0, 20).map(s => `
              <div class="style-item other">
                <span class="style-name">${s.name}</span>
              </div>
            `).join('')}
            ${styles.text.other.length > 20 ? `<div class="more-hint">...и ещё ${styles.text.other.length - 20}</div>` : ''}
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// ============================================
// PROJECT SYNC EVENT HANDLERS
// ============================================

export function handleProjectSyncEvents(container: HTMLElement): void {
  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // Sync button
    if (target.id === 'btn-sync-from-project' || target.closest('#btn-sync-from-project')) {
      parent.postMessage({ pluginMessage: { type: 'sync-from-project' } }, '*');
      return;
    }
    
    // Tab switching
    const tabBtn = target.closest('.sync-tab') as HTMLElement;
    if (tabBtn) {
      const tab = tabBtn.dataset.syncTab as 'overview' | 'collections' | 'styles';
      if (tab) {
        projectSyncTab = tab;
        refreshProjectSync(container);
      }
      return;
    }
    
    // Collection selection
    const collectionItem = target.closest('.collection-item') as HTMLElement;
    if (collectionItem) {
      selectedCollectionId = collectionItem.dataset.collectionId || null;
      refreshProjectSync(container);
      return;
    }
    
    // Create paint styles from variables
    if (target.id === 'btn-create-paint-styles-from-vars' || target.closest('#btn-create-paint-styles-from-vars')) {
      createPaintStylesFromVariables();
      return;
    }
    
    // Update paint styles
    if (target.id === 'btn-update-paint-styles' || target.closest('#btn-update-paint-styles')) {
      createPaintStylesFromVariables();
      return;
    }
    
    // Import to Token Map
    if (target.id === 'btn-import-to-token-map' || target.closest('#btn-import-to-token-map')) {
      importToTokenMap();
      return;
    }
  });
}

function refreshProjectSync(container: HTMLElement): void {
  const syncContainer = container.querySelector('.project-sync-wrapper');
  if (syncContainer) {
    syncContainer.innerHTML = renderProjectSync();
  }
}

function createPaintStylesFromVariables(): void {
  if (!projectSyncData) return;
  
  // Get color variables ONLY from Components collection (most specific level)
  const componentsCollection = projectSyncData.collections.managed.find(c => c.name === 'Components');
  
  if (!componentsCollection) {
    alert('Коллекция Components не найдена. Сначала сгенерируйте цвета.');
    return;
  }
  
  const colorVars = componentsCollection.variables.filter(v => 
    v.resolvedType === 'COLOR' && v.value && typeof v.value === 'object' && 'r' in v.value
  );
  
  if (colorVars.length === 0) {
    alert('Нет компонентных цветов в Components.');
    return;
  }
  
  // Prepare colors for paint styles
  const colors = colorVars.map(v => {
    const value = v.value as { r: number; g: number; b: number; a: number };
    return {
      name: v.name,
      hex: rgbaToHex(value),
      r: value.r,
      g: value.g,
      b: value.b,
      a: value.a ?? 1,
      description: v.description,
      category: v.name.split('/')[0] || v.name.split('.')[0] || 'color',
    };
  });
  
  // Send to Figma
  parent.postMessage({
    pluginMessage: {
      type: 'create-color-paint-styles',
      payload: {
        colors,
        structureMode: 'grouped',
      }
    }
  }, '*');
}

function rgbaToHex(color: { r: number; g: number; b: number; a?: number }): string {
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

/**
 * Import synced variables to Token Map for management
 */
function importToTokenMap(): void {
  if (!projectSyncData) {
    alert('Сначала выполните синхронизацию с проектом');
    return;
  }
  
  const tokensCount = getTokens().length;
  
  // Confirm if there are existing tokens
  if (tokensCount > 0) {
    const confirm = window.confirm(
      `В Token Map уже есть ${tokensCount} токенов.\n\n` +
      `Выберите действие:\n` +
      `• OK — Добавить к существующим (пропустить дубликаты)\n` +
      `• Отмена — Отменить импорт`
    );
    
    if (!confirm) {
      return;
    }
  }
  
  // Import tokens from sync data
  const result = importFromProjectSync(projectSyncData);
  
  // Show result
  if (result.imported > 0) {
    alert(
      `✅ Импортировано: ${result.imported} токенов\n` +
      `⏭ Пропущено (уже есть): ${result.skipped}\n\n` +
      `Переключитесь на вкладку Token Map для управления.`
    );
    
    // Switch to Token Map tab and refresh UI
    tokenManagerActiveTab = 'tokens';
    const container = document.querySelector('.token-manager');
    if (container) {
      container.innerHTML = renderTokenManager();
    }
  } else if (result.skipped > 0) {
    alert(`Все ${result.skipped} токенов уже существуют в Token Map.`);
  } else {
    alert('Нет токенов для импорта.');
  }
}
