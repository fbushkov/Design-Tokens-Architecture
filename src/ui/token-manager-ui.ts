/**
 * Token Manager UI Component
 * Left Panel: Token Tree with collections and folders
 */

import {
  TokenDefinition,
  TokenManagerState,
  TMCollectionType,
  TMColorValue,
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
} from '../types/token-manager-state';

import { getCurrentProduct } from './primitives-generator-ui';

import {
  DEFAULT_PALETTES,
  COLOR_SCALE,
} from '../types/token-manager-constants';

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

export function renderTokenManager(): string {
  return `
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
  `;
}

// ============================================
// EVENT HANDLERS
// ============================================

export function initTokenManagerEvents(container: HTMLElement, refreshCallback: () => void): void {
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
