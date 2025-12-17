/**
 * Sync UI Component
 * 
 * UI для синхронизации Variables между Plugin State и Figma
 */

import {
  FigmaCollection,
  SyncFigmaVariable,
  SyncDiff,
  SyncChange,
  PluginVariable,
  calculateDiff,
  getFigmaCollections,
  setFigmaCollections,
  getFigmaVariables,
  setFigmaVariables,
  getLastDiff,
  getSyncSettings,
  updateSyncSettings,
  getChangeDisplayName,
  formatValue,
} from '../types/sync-manager';

// ============================================
// STATE
// ============================================

let selectedCollectionId: string | null = null;
let currentDiff: SyncDiff | null = null;
let isLoading = false;
let syncInProgress = false;

// Callback для получения plugin variables
type GetPluginVariablesCallback = (collectionName: string) => PluginVariable[];
let getPluginVariablesCallback: GetPluginVariablesCallback | null = null;

// ============================================
// INITIALIZATION
// ============================================

export function initSyncUI(getPluginVariables: GetPluginVariablesCallback): void {
  getPluginVariablesCallback = getPluginVariables;
}

// ============================================
// RENDER
// ============================================

export function renderSyncPanel(): string {
  const collections = getFigmaCollections();
  const settings = getSyncSettings();
  
  return `
    <div class="sync-panel">
      <div class="sync-header">
        <h3>🔄 Синхронизация с Figma</h3>
        <button class="btn btn-sm btn-secondary" id="sync-refresh-btn" ${isLoading ? 'disabled' : ''}>
          ${isLoading ? '⏳' : '🔄'} Обновить
        </button>
      </div>
      
      <div class="sync-content">
        <!-- Collection selector -->
        <div class="sync-section">
          <label class="form-label">Коллекция</label>
          <select class="form-select" id="sync-collection-select" ${isLoading ? 'disabled' : ''}>
            <option value="">— Выберите коллекцию —</option>
            ${collections.map(c => `
              <option value="${c.id}" ${selectedCollectionId === c.id ? 'selected' : ''}>
                ${c.name} (${c.variableCount} vars, ${c.modes.length} modes)
              </option>
            `).join('')}
          </select>
        </div>
        
        <!-- Settings -->
        <div class="sync-section sync-settings">
          <div class="sync-setting">
            <label class="checkbox-label">
              <input type="checkbox" id="sync-include-deletes" ${settings.includeDeletes ? 'checked' : ''}>
              <span>Включить удаления</span>
            </label>
            <p class="hint">Удалять переменные, которых нет в плагине</p>
          </div>
        </div>
        
        <!-- Diff preview -->
        <div class="sync-diff-container" id="sync-diff-container">
          ${renderDiffPreview()}
        </div>
        
        <!-- Actions -->
        <div class="sync-actions">
          <button class="btn btn-secondary" id="sync-cancel-btn">Отмена</button>
          <button class="btn btn-primary" id="sync-apply-btn" 
            ${!currentDiff || syncInProgress || (currentDiff.summary.add === 0 && currentDiff.summary.update === 0 && currentDiff.summary.delete === 0) ? 'disabled' : ''}>
            ${syncInProgress ? '⏳ Синхронизация...' : '🔄 Применить'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderDiffPreview(): string {
  if (isLoading) {
    return `
      <div class="sync-loading">
        <div class="spinner"></div>
        <p>Загрузка данных из Figma...</p>
      </div>
    `;
  }
  
  if (!selectedCollectionId) {
    return `
      <div class="sync-empty">
        <p>👆 Выберите коллекцию для синхронизации</p>
      </div>
    `;
  }
  
  if (!currentDiff) {
    return `
      <div class="sync-empty">
        <p>⏳ Вычисление изменений...</p>
      </div>
    `;
  }
  
  const { summary, changes, modesToAdd, modesToRemove } = currentDiff;
  
  if (summary.add === 0 && summary.update === 0 && summary.delete === 0 && modesToAdd.length === 0) {
    return `
      <div class="sync-empty sync-up-to-date">
        <span class="sync-icon">✅</span>
        <p>Всё синхронизировано!</p>
        <p class="hint">${summary.unchanged} переменных без изменений</p>
      </div>
    `;
  }
  
  // Group changes by type
  const additions = changes.filter(c => c.type === 'add');
  const updates = changes.filter(c => c.type === 'update');
  const deletions = changes.filter(c => c.type === 'delete');
  
  return `
    <div class="sync-diff">
      <!-- Summary -->
      <div class="sync-summary">
        ${summary.add > 0 ? `<span class="badge badge-success">+${summary.add} новых</span>` : ''}
        ${summary.update > 0 ? `<span class="badge badge-warning">~${summary.update} изменений</span>` : ''}
        ${summary.delete > 0 ? `<span class="badge badge-danger">-${summary.delete} удалений</span>` : ''}
        ${modesToAdd.length > 0 ? `<span class="badge badge-info">+${modesToAdd.length} режимов</span>` : ''}
      </div>
      
      <!-- Modes changes -->
      ${modesToAdd.length > 0 ? `
        <div class="sync-group">
          <div class="sync-group-header">
            <span class="sync-group-icon">📱</span>
            <span>Новые режимы (${modesToAdd.length})</span>
          </div>
          <div class="sync-group-items">
            ${modesToAdd.map(m => `<div class="sync-item sync-item-add">${m}</div>`).join('')}
          </div>
        </div>
      ` : ''}
      
      <!-- Additions -->
      ${additions.length > 0 ? `
        <div class="sync-group">
          <div class="sync-group-header">
            <span class="sync-group-icon">✚</span>
            <span>Добавить (${additions.length})</span>
            <button class="btn-icon sync-toggle-group" data-group="additions">▼</button>
          </div>
          <div class="sync-group-items" id="sync-group-additions">
            ${additions.slice(0, 10).map(c => renderChangeItem(c)).join('')}
            ${additions.length > 10 ? `<div class="sync-item-more">... и ещё ${additions.length - 10}</div>` : ''}
          </div>
        </div>
      ` : ''}
      
      <!-- Updates -->
      ${updates.length > 0 ? `
        <div class="sync-group">
          <div class="sync-group-header">
            <span class="sync-group-icon">✎</span>
            <span>Обновить (${updates.length})</span>
            <button class="btn-icon sync-toggle-group" data-group="updates">▼</button>
          </div>
          <div class="sync-group-items" id="sync-group-updates">
            ${updates.slice(0, 10).map(c => renderChangeItem(c)).join('')}
            ${updates.length > 10 ? `<div class="sync-item-more">... и ещё ${updates.length - 10}</div>` : ''}
          </div>
        </div>
      ` : ''}
      
      <!-- Deletions -->
      ${deletions.length > 0 ? `
        <div class="sync-group sync-group-danger">
          <div class="sync-group-header">
            <span class="sync-group-icon">✖</span>
            <span>Удалить (${deletions.length})</span>
            <button class="btn-icon sync-toggle-group" data-group="deletions">▼</button>
          </div>
          <div class="sync-group-items" id="sync-group-deletions">
            ${deletions.slice(0, 10).map(c => renderChangeItem(c)).join('')}
            ${deletions.length > 10 ? `<div class="sync-item-more">... и ещё ${deletions.length - 10}</div>` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderChangeItem(change: SyncChange): string {
  const displayName = getChangeDisplayName(change);
  
  if (change.type === 'add') {
    return `
      <div class="sync-item sync-item-add">
        <span class="sync-item-name">${displayName}</span>
        <span class="sync-item-value">${formatValue(change.newValue)}</span>
      </div>
    `;
  }
  
  if (change.type === 'update') {
    return `
      <div class="sync-item sync-item-update">
        <span class="sync-item-name">${displayName}</span>
        <span class="sync-item-change">
          <span class="old-value">${formatValue(change.oldValue)}</span>
          <span class="arrow">→</span>
          <span class="new-value">${formatValue(change.newValue)}</span>
        </span>
      </div>
    `;
  }
  
  if (change.type === 'delete') {
    return `
      <div class="sync-item sync-item-delete">
        <span class="sync-item-name">${displayName}</span>
        <span class="sync-item-value">${formatValue(change.oldValue)}</span>
      </div>
    `;
  }
  
  return '';
}

// ============================================
// STYLES
// ============================================

export function getSyncStyles(): string {
  return `
    .sync-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .sync-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
    }
    
    .sync-header h3 {
      margin: 0;
      font-size: 16px;
    }
    
    .sync-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-md);
    }
    
    .sync-section {
      margin-bottom: var(--spacing-md);
    }
    
    .sync-settings {
      padding: var(--spacing-sm);
      background: var(--color-bg-secondary);
      border-radius: var(--radius-md);
    }
    
    .sync-setting {
      margin-bottom: var(--spacing-xs);
    }
    
    .sync-setting:last-child {
      margin-bottom: 0;
    }
    
    .sync-setting .hint {
      margin: 2px 0 0 24px;
      font-size: 10px;
      color: var(--color-text-tertiary);
    }
    
    .sync-diff-container {
      min-height: 200px;
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg-secondary);
    }
    
    .sync-loading, .sync-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl);
      text-align: center;
      color: var(--color-text-secondary);
    }
    
    .sync-loading .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: var(--spacing-sm);
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .sync-up-to-date .sync-icon {
      font-size: 32px;
      margin-bottom: var(--spacing-sm);
    }
    
    .sync-diff {
      padding: var(--spacing-sm);
    }
    
    .sync-summary {
      display: flex;
      gap: var(--spacing-xs);
      flex-wrap: wrap;
      padding: var(--spacing-sm);
      border-bottom: 1px solid var(--color-border);
      margin-bottom: var(--spacing-sm);
    }
    
    .badge {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 500;
    }
    
    .badge-success {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
    }
    
    .badge-warning {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }
    
    .badge-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
    
    .badge-info {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
    }
    
    .sync-group {
      margin-bottom: var(--spacing-sm);
    }
    
    .sync-group-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      background: var(--color-bg);
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }
    
    .sync-group-header:hover {
      background: var(--color-bg-tertiary);
    }
    
    .sync-group-icon {
      font-size: 14px;
    }
    
    .sync-toggle-group {
      margin-left: auto;
      opacity: 0.5;
    }
    
    .sync-group-items {
      padding-left: var(--spacing-md);
      margin-top: var(--spacing-xs);
    }
    
    .sync-group-items.collapsed {
      display: none;
    }
    
    .sync-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: 11px;
      border-radius: var(--radius-sm);
      margin-bottom: 2px;
    }
    
    .sync-item-add {
      background: rgba(34, 197, 94, 0.08);
    }
    
    .sync-item-update {
      background: rgba(245, 158, 11, 0.08);
    }
    
    .sync-item-delete {
      background: rgba(239, 68, 68, 0.08);
    }
    
    .sync-item-name {
      font-family: 'SF Mono', monospace;
      color: var(--color-text);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .sync-item-value {
      color: var(--color-text-secondary);
      margin-left: var(--spacing-sm);
    }
    
    .sync-item-change {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
    }
    
    .sync-item-change .old-value {
      color: var(--color-text-tertiary);
      text-decoration: line-through;
    }
    
    .sync-item-change .arrow {
      color: var(--color-text-secondary);
    }
    
    .sync-item-change .new-value {
      color: var(--color-primary);
    }
    
    .sync-item-more {
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: 10px;
      color: var(--color-text-tertiary);
      font-style: italic;
    }
    
    .sync-group-danger .sync-group-header {
      background: rgba(239, 68, 68, 0.1);
    }
    
    .sync-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      border-top: 1px solid var(--color-border);
      margin-top: auto;
    }
  `;
}

// ============================================
// EVENT HANDLERS
// ============================================

export function initSyncListeners(container: HTMLElement): void {
  // Refresh button
  const refreshBtn = container.querySelector('#sync-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadCollectionsFromFigma();
    });
  }
  
  // Collection select
  const collectionSelect = container.querySelector('#sync-collection-select') as HTMLSelectElement;
  if (collectionSelect) {
    collectionSelect.addEventListener('change', () => {
      selectedCollectionId = collectionSelect.value || null;
      if (selectedCollectionId) {
        loadVariablesAndCalculateDiff(selectedCollectionId);
      } else {
        currentDiff = null;
        refreshSyncUI(container);
      }
    });
  }
  
  // Include deletes checkbox
  const includeDeletesCheckbox = container.querySelector('#sync-include-deletes') as HTMLInputElement;
  if (includeDeletesCheckbox) {
    includeDeletesCheckbox.addEventListener('change', () => {
      updateSyncSettings({ includeDeletes: includeDeletesCheckbox.checked });
      // Recalculate diff if collection selected
      if (selectedCollectionId) {
        recalculateDiff();
        refreshSyncUI(container);
      }
    });
  }
  
  // Toggle group buttons
  container.querySelectorAll('.sync-toggle-group').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const group = btn.getAttribute('data-group');
      const items = container.querySelector(`#sync-group-${group}`);
      if (items) {
        items.classList.toggle('collapsed');
        btn.textContent = items.classList.contains('collapsed') ? '▶' : '▼';
      }
    });
  });
  
  // Apply button
  const applyBtn = container.querySelector('#sync-apply-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      if (currentDiff) {
        applySync();
      }
    });
  }
  
  // Cancel button
  const cancelBtn = container.querySelector('#sync-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      closeSyncPanel();
    });
  }
}

// ============================================
// FIGMA COMMUNICATION
// ============================================

export function loadCollectionsFromFigma(): void {
  isLoading = true;
  selectedCollectionId = null;
  currentDiff = null;
  
  // Request collections from Figma
  parent.postMessage({ pluginMessage: { type: 'sync-get-collections' } }, '*');
}

function loadVariablesAndCalculateDiff(collectionId: string): void {
  isLoading = true;
  
  // Request variables from Figma
  parent.postMessage({ 
    pluginMessage: { 
      type: 'sync-get-variables',
      payload: { collectionId }
    } 
  }, '*');
}

function applySync(): void {
  if (!currentDiff) return;
  
  syncInProgress = true;
  
  // Filter out unchanged
  const changesToApply = currentDiff.changes.filter(c => c.type !== 'unchanged');
  
  parent.postMessage({
    pluginMessage: {
      type: 'sync-apply-changes',
      payload: {
        collectionName: currentDiff.collectionName,
        changes: changesToApply,
        modesToAdd: currentDiff.modesToAdd,
      }
    }
  }, '*');
}

// ============================================
// MESSAGE HANDLERS
// ============================================

export function handleSyncMessage(msg: any, container: HTMLElement): void {
  switch (msg.type) {
    case 'sync-collections-loaded':
      isLoading = false;
      setFigmaCollections(msg.payload.collections);
      refreshSyncUI(container);
      break;
      
    case 'sync-variables-loaded':
      isLoading = false;
      const { collectionId, variables } = msg.payload;
      setFigmaVariables(collectionId, variables);
      recalculateDiff();
      refreshSyncUI(container);
      break;
      
    case 'sync-applied':
      syncInProgress = false;
      const result = msg.payload;
      
      if (result.success) {
        showNotification(`✅ Синхронизация: +${result.created}, ~${result.updated}, -${result.deleted}`);
        // Reload to show updated state
        if (selectedCollectionId) {
          loadVariablesAndCalculateDiff(selectedCollectionId);
        }
      } else {
        showNotification(`⚠️ Ошибки: ${result.errors.join(', ')}`);
      }
      refreshSyncUI(container);
      break;
      
    case 'sync-error':
      isLoading = false;
      syncInProgress = false;
      showNotification(`❌ ${msg.payload.error}`);
      refreshSyncUI(container);
      break;
  }
}

// ============================================
// HELPERS
// ============================================

function recalculateDiff(): void {
  if (!selectedCollectionId || !getPluginVariablesCallback) {
    currentDiff = null;
    return;
  }
  
  const collections = getFigmaCollections();
  const collection = collections.find(c => c.id === selectedCollectionId);
  const figmaVariables = getFigmaVariables(selectedCollectionId);
  
  if (!collection) {
    currentDiff = null;
    return;
  }
  
  // Get plugin variables for this collection
  const pluginVariables = getPluginVariablesCallback(collection.name);
  
  currentDiff = calculateDiff(
    collection.name,
    pluginVariables,
    collection,
    figmaVariables
  );
}

function refreshSyncUI(container: HTMLElement): void {
  const diffContainer = container.querySelector('#sync-diff-container');
  if (diffContainer) {
    diffContainer.innerHTML = renderDiffPreview();
  }
  
  // Update apply button state
  const applyBtn = container.querySelector('#sync-apply-btn') as HTMLButtonElement;
  if (applyBtn) {
    const hasChanges = currentDiff && (
      currentDiff.summary.add > 0 || 
      currentDiff.summary.update > 0 || 
      currentDiff.summary.delete > 0 ||
      currentDiff.modesToAdd.length > 0
    );
    applyBtn.disabled = !hasChanges || syncInProgress;
    applyBtn.textContent = syncInProgress ? '⏳ Синхронизация...' : '🔄 Применить';
  }
  
  // Update refresh button
  const refreshBtn = container.querySelector('#sync-refresh-btn') as HTMLButtonElement;
  if (refreshBtn) {
    refreshBtn.disabled = isLoading;
    refreshBtn.innerHTML = isLoading ? '⏳' : '🔄 Обновить';
  }
  
  // Re-init toggle listeners
  container.querySelectorAll('.sync-toggle-group').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const group = btn.getAttribute('data-group');
      const items = container.querySelector(`#sync-group-${group}`);
      if (items) {
        items.classList.toggle('collapsed');
        btn.textContent = items.classList.contains('collapsed') ? '▶' : '▼';
      }
    });
  });
}

function closeSyncPanel(): void {
  // This will be handled by parent component
  const event = new CustomEvent('sync-panel-close');
  document.dispatchEvent(event);
}

function showNotification(message: string): void {
  // Use existing notification system
  const event = new CustomEvent('show-notification', { detail: { message } });
  document.dispatchEvent(event);
}

// ============================================
// EXPORTS
// ============================================

export {
  selectedCollectionId,
  currentDiff,
  isLoading,
  syncInProgress,
};
