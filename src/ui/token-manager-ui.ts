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
  getSettings,
} from '../types/token-manager-state';

import { getCurrentProduct } from './primitives-generator-ui';

import { resetTypographyToDefaults } from './typography-generator-ui';

import { resetColorsToDefaults } from './primitives-generator-ui';

import { resetSpacingToDefaults } from './spacing-generator-ui';

import { resetGapToDefaults } from './gap-generator-ui';

import { resetRadiusToDefaults } from './radius-generator-ui';

import { resetIconSizeToDefaults } from './icon-size-generator-ui';

import { clearStorageKeys, storageGet, storageSet, STORAGE_KEYS } from './storage-utils';

import {
  DEFAULT_PALETTES,
  COLOR_SCALE,
} from '../types/token-manager-constants';

import {
  renderBreakpointsSettings,
  getBreakpointsSettingsStyles,
  initBreakpointsSettingsListeners,
} from './breakpoints-settings-ui';

import {
  renderSyncPanel,
  getSyncStyles,
  initSyncListeners,
  handleSyncMessage,
  loadCollectionsFromFigma,
  initSyncUI,
} from './sync-ui';

import { PluginVariable } from '../types/sync-manager';

// ============================================
// PROJECT SYNC STATE
// ============================================

let projectSyncData: ProjectSyncData | null = null;
let projectSyncTab: 'overview' | 'changes' = 'overview';
let selectedCollectionId: string | null = null;
let syncModalOpen = false;

export function setProjectSyncData(data: ProjectSyncData): void {
  projectSyncData = data;
  // Save to clientStorage for persistence
  saveProjectSyncData(data);
}

export function getProjectSyncData(): ProjectSyncData | null {
  return projectSyncData;
}

async function saveProjectSyncData(data: ProjectSyncData): Promise<void> {
  try {
    await storageSet(STORAGE_KEYS.PROJECT_SYNC_DATA, data);
  } catch (e) {
    console.error('Failed to save project sync data:', e);
  }
}

export async function loadProjectSyncData(): Promise<void> {
  try {
    const saved = await storageGet<ProjectSyncData>(STORAGE_KEYS.PROJECT_SYNC_DATA);
    if (saved) {
      projectSyncData = saved;
    }
  } catch (e) {
    console.error('Failed to load project sync data:', e);
  }
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
  // All 7 managed collections
  const allCollections: TMCollectionType[] = [
    'Primitives',
    'Tokens', 
    'Components',
    'Typography',
    'Spacing',
    'Gap',
    'Icon Size',
    'Radius',
  ];
  
  const collections: Record<TMCollectionType, TreeNode> = {} as Record<TMCollectionType, TreeNode>;
  
  // Initialize all collections
  for (const collName of allCollections) {
    collections[collName] = {
      id: `collection-${collName.toLowerCase().replace(' ', '-')}`,
      name: collName,
      path: [],
      fullPath: collName,
      type: 'collection',
      children: [],
      expanded: true,
      enabled: true,
      tokenCount: 0,
    };
  }

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
          <option value="Typography" ${state.filterCollection === 'Typography' ? 'selected' : ''}>Typography</option>
          <option value="Spacing" ${state.filterCollection === 'Spacing' ? 'selected' : ''}>Spacing</option>
          <option value="Gap" ${state.filterCollection === 'Gap' ? 'selected' : ''}>Gap</option>
          <option value="Icon Size" ${state.filterCollection === 'Icon Size' ? 'selected' : ''}>Icon Size</option>
          <option value="Radius" ${state.filterCollection === 'Radius' ? 'selected' : ''}>Radius</option>
        </select>
        <select class="tm-filter-enabled">
          <option value="all" ${state.filterEnabled === 'all' ? 'selected' : ''}>Все</option>
          <option value="enabled" ${state.filterEnabled === 'enabled' ? 'selected' : ''}>Включённые</option>
          <option value="disabled" ${state.filterEnabled === 'disabled' ? 'selected' : ''}>Выключенные</option>
        </select>
      </div>
      <div class="tm-actions">
        <button class="btn btn-sm btn-primary tm-sync-btn" title="Синхронизировать с Figma">🔄 Sync</button>
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
                <option value="frontend" ${settings.exportFormat === 'frontend' ? 'selected' : ''}>📦 Frontend (семантика)</option>
                <option value="css" ${settings.exportFormat === 'css' ? 'selected' : ''}>CSS Variables</option>
                <option value="scss" ${settings.exportFormat === 'scss' ? 'selected' : ''}>SCSS Variables</option>
                <option value="figma" ${settings.exportFormat === 'figma' ? 'selected' : ''}>Figma Variables</option>
                <option value="tailwind" ${settings.exportFormat === 'tailwind' ? 'selected' : ''}>Tailwind Config</option>
              </select>
            </div>
            <div class="ts-info">Frontend: только финальный уровень (Components + семантика)</div>
          </div>
          
          <div class="ts-divider"></div>
          
          <div class="ts-section ts-section-breakpoints" id="breakpoints-settings-container">
            ${renderBreakpointsSettings()}
          </div>

          <div class="ts-actions">
            <button class="btn btn-primary ts-save-settings">Сохранить</button>
            <button class="btn btn-secondary ts-reset-settings">Сбросить</button>
          </div>
          
          <div class="ts-divider" style="margin-top: 16px;"></div>
          
          <div class="ts-section">
            <div class="ts-section-title">🔄 Сброс настроек</div>
            <div class="ts-field">
              <button class="btn btn-secondary ts-reset-plugin-settings" style="width: 100%;">
                🔄 Сбросить настройки плагина
              </button>
              <div class="ts-info" style="margin-top: 8px;">
                Сбрасывает UI-настройки (Typography, Spacing и т.д.) к дефолтным. <strong>Не влияет</strong> на Variables в Figma и Token Map.
              </div>
            </div>
            
            <div class="ts-field" style="margin-top: 12px;">
              <button class="btn btn-ghost ts-reset-all-defaults" style="width: 100%; color: var(--color-text-error, #f24822); border: 1px solid var(--color-border);">
                ⚠️ Полный сброс системы
              </button>
              <div class="ts-info" style="margin-top: 8px;">
                Сбрасывает ВСЕ: настройки + Token Map. Variables в Figma <strong>не удаляются</strong>.
              </div>
            </div>
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
  // Get stats from Figma (projectSyncData) if available, otherwise from Token Map
  const syncData = getProjectSyncData();
  
  let primitives = 0;
  let semantic = 0;
  let components = 0;
  let total = 0;
  
  if (syncData) {
    // Use real Figma data
    const primitivesCollection = syncData.collections.managed.find(c => c.name === 'Primitives');
    const tokensCollection = syncData.collections.managed.find(c => c.name === 'Tokens');
    const componentsCollection = syncData.collections.managed.find(c => c.name === 'Components');
    
    primitives = primitivesCollection?.variableCount || 0;
    semantic = tokensCollection?.variableCount || 0;
    components = componentsCollection?.variableCount || 0;
    total = primitives + semantic + components;
  } else {
    // Fallback to Token Map data
    const tokens = getTokens();
    primitives = tokens.filter(t => t.collection === 'Primitives').length;
    semantic = tokens.filter(t => t.collection === 'Tokens').length;
    components = tokens.filter(t => t.collection === 'Components').length;
    total = tokens.length;
  }

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
        <span class="tm-stat-value">${total}/${total}</span>
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
    
    <!-- Sync Modal -->
    ${renderSyncModal()}
  `;
}

function renderSyncModal(): string {
  if (!syncModalOpen) return '';
  
  return `
    <div class="sync-modal-overlay" id="sync-modal">
      <div class="sync-modal">
        ${renderSyncPanel()}
      </div>
    </div>
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

    // Open Sync Modal
    if (target.closest('.tm-sync-btn')) {
      openSyncModal(container, refreshCallback);
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
        // Initialize breakpoints settings listeners
        const bpContainer = overlay.querySelector('#breakpoints-settings-container') as HTMLElement;
        if (bpContainer) {
          initBreakpointsSettingsListeners(bpContainer);
        }
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
    
    // Reset plugin settings only (not Token Map)
    if (target.classList.contains('ts-reset-plugin-settings')) {
      if (confirm('Сбросить настройки плагина к дефолтным?\n\nЭто сбросит UI-настройки (Typography, Spacing и т.д.)\nToken Map и Variables в Figma НЕ будут изменены.')) {
        resetPluginSettingsToDefaults();
        refreshCallback();
        const overlay = container.querySelector('#settings-modal-overlay') as HTMLElement;
        if (overlay) {
          overlay.classList.remove('open');
        }
      }
    }
    
    // Reset ALL system to defaults
    if (target.classList.contains('ts-reset-all-defaults')) {
      if (confirm('⚠️ Полный сброс системы?\n\nЭто удалит:\n• Все токены из Token Map\n• Настройки Typography, Spacing, Gap, Radius, Colors\n\nVariables в Figma НЕ будут удалены.')) {
        resetAllSystemToDefaults();
        refreshCallback();
        // Close modal after reset
        const overlay = container.querySelector('#settings-modal-overlay') as HTMLElement;
        if (overlay) {
          overlay.classList.remove('open');
        }
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
    state.settings.exportFormat = exportFormatSelect.value as 'figma' | 'json' | 'css' | 'scss' | 'tailwind' | 'frontend';
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

/**
 * Сброс настроек плагина к дефолтным
 * ВАЖНО: НЕ удаляет токены из Token Map и НЕ влияет на Variables в Figma
 * Сбрасывает только UI-состояние модулей (выбранные примитивы, настройки и т.д.)
 */
async function resetPluginSettingsToDefaults(): Promise<void> {
  // 1. Сбрасываем настройки Token Manager (только settings, НЕ tokens)
  resetSettings();
  
  // 2. Очищаем storage только для настроек (НЕ для токенов)
  await clearStorageKeys([
    STORAGE_KEYS.TOKEN_MANAGER_SETTINGS,
    STORAGE_KEYS.TYPOGRAPHY_STATE,
    STORAGE_KEYS.SPACING_STATE,
    STORAGE_KEYS.GAP_STATE,
    STORAGE_KEYS.RADIUS_STATE,
    STORAGE_KEYS.ICON_SIZE_STATE,
    STORAGE_KEYS.COLORS_STATE,
    // НЕ очищаем: TOKEN_MANAGER_STATE, GENERATED_PALETTES
  ]);
  
  // 3. Сбрасываем UI модули к дефолтным настройкам
  try { await resetTypographyToDefaults(); } catch (e) { /* ignore */ }
  try { await resetColorsToDefaults(); } catch (e) { /* ignore */ }
  try { await resetSpacingToDefaults(); } catch (e) { /* ignore */ }
  try { await resetGapToDefaults(); } catch (e) { /* ignore */ }
  try { await resetRadiusToDefaults(); } catch (e) { /* ignore */ }
  try { await resetIconSizeToDefaults(); } catch (e) { /* ignore */ }
  
  // 4. Сохраняем состояние
  saveState();
  
  // 5. Уведомление
  parent.postMessage({
    pluginMessage: {
      type: 'notify',
      message: '🔄 Настройки плагина сброшены. Токены в Figma не изменены.',
      options: { timeout: 3000 },
    },
  }, '*');
}

/**
 * Полный сброс системы (включая Token Map)
 * Используется для полной очистки
 */
async function resetAllSystemToDefaults(): Promise<void> {
  // 1. Сбрасываем настройки Token Manager
  resetSettings();
  
  // 2. Очищаем все токены
  clearAllTokens();
  
  // 3. Очищаем storage для всех подсистем (using figma.clientStorage)
  await clearStorageKeys([
    STORAGE_KEYS.TOKEN_MANAGER_STATE,
    STORAGE_KEYS.TOKEN_MANAGER_SETTINGS,
    STORAGE_KEYS.TYPOGRAPHY_STATE,
    STORAGE_KEYS.SPACING_STATE,
    STORAGE_KEYS.GAP_STATE,
    STORAGE_KEYS.RADIUS_STATE,
    STORAGE_KEYS.ICON_SIZE_STATE,
    STORAGE_KEYS.COLORS_STATE,
    STORAGE_KEYS.GENERATED_PALETTES,
  ]);
  
  // 4. Сбрасываем все UI модули к дефолтным настройкам
  try { await resetTypographyToDefaults(); } catch (e) { /* ignore */ }
  try { await resetColorsToDefaults(); } catch (e) { /* ignore */ }
  try { await resetSpacingToDefaults(); } catch (e) { /* ignore */ }
  try { await resetGapToDefaults(); } catch (e) { /* ignore */ }
  try { await resetRadiusToDefaults(); } catch (e) { /* ignore */ }
  try { await resetIconSizeToDefaults(); } catch (e) { /* ignore */ }
  
  // 5. Сохраняем сброшенное состояние Token Manager
  saveState();
  
  // 6. Показываем уведомление
  window.dispatchEvent(new CustomEvent('system-reset-complete'));
  
  parent.postMessage({
    pluginMessage: {
      type: 'notify',
      message: '🔄 Система полностью сброшена. Variables в Figma не изменены.',
      options: { timeout: 5000 },
    },
  }, '*');
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
  // Load persisted project sync data and pending changes
  loadProjectSyncData();
  loadPendingChanges();
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
          Общая информация
        </button>
        <button class="sync-tab ${projectSyncTab === 'changes' ? 'active' : ''}" data-sync-tab="changes">
          Изменения
        </button>
      </div>
      
      <div class="project-sync-content">
        ${projectSyncTab === 'overview' ? renderSyncOverview(summary, collections, styles) : ''}
        ${projectSyncTab === 'changes' ? renderPendingChanges() : ''}
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
// PENDING CHANGES TRACKING
// ============================================

export interface PendingChange {
  module: 'colors' | 'typography' | 'spacing' | 'gap' | 'radius' | 'iconSize' | 'effects';
  type: 'add' | 'update' | 'delete';
  category: string;
  name: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
  timestamp?: number;
}

// Track pending changes across all modules
let pendingChanges: PendingChange[] = [];

export function addPendingChange(change: PendingChange): void {
  // Check if similar change already exists
  const existingIndex = pendingChanges.findIndex(c => 
    c.module === change.module && c.name === change.name && c.category === change.category
  );
  
  if (existingIndex >= 0) {
    // Update existing change
    pendingChanges[existingIndex] = change;
  } else {
    pendingChanges.push(change);
  }
  
  // Save to storage
  savePendingChanges();
}

export function clearPendingChanges(): void {
  pendingChanges = [];
  savePendingChanges();
}

async function savePendingChanges(): Promise<void> {
  try {
    await storageSet('pending-changes', pendingChanges);
  } catch (e) {
    console.error('Failed to save pending changes:', e);
  }
}

export async function loadPendingChanges(): Promise<void> {
  try {
    const saved = await storageGet<PendingChange[]>('pending-changes');
    if (saved) {
      pendingChanges = saved;
    }
  } catch (e) {
    console.error('Failed to load pending changes:', e);
  }
}

function renderPendingChanges(): string {
  // Group changes by module
  const grouped = {
    colors: pendingChanges.filter(c => c.module === 'colors'),
    typography: pendingChanges.filter(c => c.module === 'typography'),
    spacing: pendingChanges.filter(c => c.module === 'spacing'),
    gap: pendingChanges.filter(c => c.module === 'gap'),
    radius: pendingChanges.filter(c => c.module === 'radius'),
    iconSize: pendingChanges.filter(c => c.module === 'iconSize'),
    effects: pendingChanges.filter(c => c.module === 'effects'),
  };
  
  const totalChanges = pendingChanges.length;
  
  const moduleLabels: Record<string, { icon: string; label: string }> = {
    colors: { icon: '🎨', label: 'Цвета' },
    typography: { icon: '🔤', label: 'Типографика' },
    spacing: { icon: '📏', label: 'Spacing' },
    gap: { icon: '↔️', label: 'Gap' },
    radius: { icon: '◯', label: 'Radius' },
    iconSize: { icon: '📐', label: 'Icon Size' },
    effects: { icon: '✨', label: 'Эффекты' },
  };
  
  // Helper to safely get module label (防止 undefined 错误)
  const getModuleInfo = (module: string) => {
    return moduleLabels[module] || { icon: '❓', label: module };
  };
  
  const renderChangeType = (type: string) => {
    switch (type) {
      case 'add': return '<span class="change-badge add">+ добавлено</span>';
      case 'update': return '<span class="change-badge update">✎ изменено</span>';
      case 'delete': return '<span class="change-badge delete">× удалено</span>';
      default: return '';
    }
  };
  
  const renderChangeValue = (change: PendingChange) => {
    if (change.type === 'update' && change.oldValue && change.newValue) {
      return `<span class="change-value old">${change.oldValue}</span> → <span class="change-value new">${change.newValue}</span>`;
    }
    if (change.type === 'add' && change.newValue) {
      return `<span class="change-value new">${change.newValue}</span>`;
    }
    if (change.type === 'delete' && change.oldValue) {
      return `<span class="change-value old">${change.oldValue}</span>`;
    }
    return change.details || '';
  };
  
  return `
    <div class="pending-changes">
      <!-- Export button at top -->
      <div class="export-section-header">
        <button class="btn btn-primary btn-lg" id="btn-export-all-changes" style="width: 100%; padding: 12px; font-size: 14px;">
          📤 Экспортировать выбранные изменения
        </button>
        <div class="export-all-hint">
          Экспортирует только отмеченные токены в Figma Variables
        </div>
      </div>
      
      ${totalChanges === 0 ? `
        <div class="no-changes">
          <div class="no-changes-icon">✓</div>
          <p>Нет ожидающих изменений</p>
          <p class="hint">Внесите изменения в токены Colors, Typography, Spacing и др., чтобы они отобразились здесь</p>
        </div>
      ` : `
        <div class="changes-header">
          <div class="changes-summary">
            <span class="changes-count">${totalChanges}</span> изменений готово к экспорту
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-clear-changes">
            Очистить
          </button>
        </div>
        
        <!-- Changes Table -->
        <div class="changes-table-wrapper">
          <table class="changes-table">
            <thead>
              <tr>
                <th style="width: 30px;"></th>
                <th>Модуль</th>
                <th>Категория</th>
                <th>Имя токена</th>
                <th>Изменение</th>
                <th>Значение</th>
              </tr>
            </thead>
            <tbody>
              ${pendingChanges.map((change, idx) => `
                <tr class="change-row change-${change.type}" data-change-idx="${idx}">
                  <td class="change-checkbox">
                    <input type="checkbox" checked data-change-idx="${idx}">
                  </td>
                  <td class="change-module">
                    <span class="module-icon">${getModuleInfo(change.module).icon}</span>
                    ${getModuleInfo(change.module).label}
                  </td>
                  <td class="change-category">${change.category}</td>
                  <td class="change-name">${change.name}</td>
                  <td class="change-type">${renderChangeType(change.type)}</td>
                  <td class="change-value">${renderChangeValue(change)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Module Summary -->
        <div class="changes-modules-summary">
          ${Object.entries(grouped)
            .filter(([_, changes]) => changes.length > 0)
            .map(([module, changes]) => `
              <div class="module-summary-item">
                <span class="module-icon">${getModuleInfo(module).icon}</span>
                <span class="module-label">${getModuleInfo(module).label}</span>
                <span class="module-count">${changes.length}</span>
              </div>
            `).join('')}
        </div>
      `}
    </div>
  `;
}

// ============================================
// PROJECT SYNC EVENT HANDLERS
// ============================================

export function handleProjectSyncEvents(container: HTMLElement): void {
  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // Export All button
    if (target.id === 'btn-export-all-changes' || target.closest('#btn-export-all-changes')) {
      exportAllChangesToFigma();
      return;
    }
    
    // Clear changes button
    if (target.id === 'btn-clear-changes' || target.closest('#btn-clear-changes')) {
      if (confirm('Очистить список ожидающих изменений?')) {
        clearPendingChanges();
        refreshProjectSync(container);
      }
      return;
    }
    
    // Sync button
    if (target.id === 'btn-sync-from-project' || target.closest('#btn-sync-from-project')) {
      parent.postMessage({ pluginMessage: { type: 'sync-from-project' } }, '*');
      return;
    }
    
    // Tab switching
    const tabBtn = target.closest('.sync-tab') as HTMLElement;
    if (tabBtn) {
      const tab = tabBtn.dataset.syncTab as 'overview' | 'changes';
      if (tab) {
        projectSyncTab = tab;
        refreshProjectSync(container);
      }
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
// ============================================
// SYNC MODAL
// ============================================

let syncRefreshCallback: (() => void) | null = null;

function openSyncModal(container: HTMLElement, refreshCallback: () => void): void {
  syncModalOpen = true;
  syncRefreshCallback = refreshCallback;
  
  // Initialize sync UI with callback to get plugin variables
  initSyncUI(getPluginVariablesForCollection);
  
  refreshCallback();
  
  // After render, initialize listeners and load data
  setTimeout(() => {
    const syncModal = container.querySelector('#sync-modal');
    if (syncModal) {
      initSyncListeners(syncModal as HTMLElement);
      loadCollectionsFromFigma();
      
      // Close on overlay click
      syncModal.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).classList.contains('sync-modal-overlay')) {
          closeSyncModal(container);
        }
      });
    }
  }, 0);
  
  // Listen for close event
  document.addEventListener('sync-panel-close', () => {
    closeSyncModal(container);
  }, { once: true });
}

function closeSyncModal(container: HTMLElement): void {
  syncModalOpen = false;
  if (syncRefreshCallback) {
    syncRefreshCallback();
  }
}

/**
 * Получить plugin variables для конкретной коллекции
 * Это callback для sync-ui
 */
function getPluginVariablesForCollection(collectionName: string): PluginVariable[] {
  const tokens = getTokens();
  const settings = getSettings();
  const result: PluginVariable[] = [];
  
  // Фильтруем токены по коллекции
  const collectionTokens = tokens.filter(t => t.collection === collectionName && t.enabled);
  
  for (const token of collectionTokens) {
    const fullPath = buildFullPath(token.path, token.name, settings.separator);
    
    // Определяем тип и значение
    let type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN' = 'FLOAT';
    let modeValues: Record<string, any> = {};
    
    if (token.type === 'COLOR') {
      type = 'COLOR';
      const colorValue = token.value as TMColorValue;
      if (colorValue && colorValue.rgba) {
        modeValues['Mode 1'] = { 
          r: colorValue.rgba.r, 
          g: colorValue.rgba.g, 
          b: colorValue.rgba.b 
        };
      }
    } else if (token.type === 'NUMBER') {
      type = 'FLOAT';
      modeValues['Mode 1'] = token.value as number;
    } else if (token.type === 'STRING') {
      type = 'STRING';
      modeValues['Mode 1'] = token.value as string;
    } else if (token.type === 'BOOLEAN') {
      type = 'BOOLEAN';
      modeValues['Mode 1'] = token.value as boolean;
    }
    
    result.push({
      name: fullPath,
      type,
      description: token.description,
      modeValues,
    });
  }
  
  return result;
}

/**
 * Обработчик сообщений от Figma для sync
 */
export function handleSyncMessageFromFigma(msg: any): void {
  const container = document.querySelector('.token-manager') as HTMLElement;
  if (!container) {
    console.log('[handleSyncMessageFromFigma] container not found');
    return;
  }
  
  // Handle export-selected-complete - clear exported changes
  if (msg.type === 'export-selected-complete') {
    console.log('[export-selected-complete] Starting cleanup, pendingChanges before:', pendingChanges.length);
    
    // Get checked checkboxes and remove those changes
    const checkboxes = document.querySelectorAll('.changes-table input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
    const indicesToRemove = new Set<number>();
    
    console.log('[export-selected-complete] Found checked checkboxes:', checkboxes.length);
    
    checkboxes.forEach(checkbox => {
      const idx = parseInt(checkbox.dataset.changeIdx || '-1', 10);
      if (idx >= 0) {
        indicesToRemove.add(idx);
      }
    });
    
    console.log('[export-selected-complete] Indices to remove:', Array.from(indicesToRemove));
    
    // Remove exported changes (from end to start to preserve indices)
    const sortedIndices = Array.from(indicesToRemove).sort((a, b) => b - a);
    for (const idx of sortedIndices) {
      pendingChanges.splice(idx, 1);
    }
    
    console.log('[export-selected-complete] pendingChanges after cleanup:', pendingChanges.length);
    
    // Save and refresh UI
    savePendingChanges();
    
    // Force re-render the entire project sync section
    const syncWrapper = container.querySelector('.project-sync-wrapper');
    console.log('[export-selected-complete] syncWrapper found:', !!syncWrapper);
    
    if (syncWrapper) {
      const newHtml = renderProjectSync();
      syncWrapper.innerHTML = newHtml;
      console.log('[export-selected-complete] UI refreshed');
    }
    
    // Reset export button state
    const btn = document.getElementById('btn-export-all-changes') as HTMLButtonElement;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '📤 Экспортировать выбранные изменения';
    }
    
    return;
  }
  
  const syncModal = container.querySelector('#sync-modal') as HTMLElement;
  if (syncModal) {
    handleSyncMessage(msg, syncModal);
  }
}

/**
 * Export all changes to Figma at once
 * Sends sequential messages to create/update all variable types
 */
function exportAllChangesToFigma(): void {
  // Collect selected changes from checkboxes
  const selectedChanges: PendingChange[] = [];
  const checkboxes = document.querySelectorAll('.changes-table input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
  
  checkboxes.forEach(checkbox => {
    const idx = parseInt(checkbox.dataset.changeIdx || '-1', 10);
    if (idx >= 0 && idx < pendingChanges.length) {
      selectedChanges.push(pendingChanges[idx]);
    }
  });
  
  if (selectedChanges.length === 0) {
    alert('Выберите изменения для экспорта');
    return;
  }
  
  // Show loading state on button
  const btn = document.getElementById('btn-export-all-changes') as HTMLButtonElement;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Экспортируем...';
  }
  
  // Send export message with selected changes
  parent.postMessage({
    pluginMessage: {
      type: 'export-selected-changes',
      payload: { changes: selectedChanges }
    }
  }, '*');
  
  // Reset button after delay
  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '📤 Экспортировать выбранные изменения';
    }
  }, 3000);
}