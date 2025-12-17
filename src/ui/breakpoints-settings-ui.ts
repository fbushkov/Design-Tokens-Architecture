/**
 * Breakpoints Settings UI
 * 
 * UI для настройки breakpoints и устройств в Token Manager → Settings
 */

import {
  Breakpoint,
  BreakpointConfig,
  BREAKPOINT_PRESETS,
  getBreakpointConfig,
  setBreakpointConfig,
  getBreakpoints,
  addBreakpoint,
  updateBreakpoint,
  removeBreakpoint,
  reorderBreakpoints,
  applyPreset,
  getModeName,
  resetBreakpointConfig,
} from '../types/breakpoint-config';

// ============================================
// RENDER FUNCTIONS
// ============================================

export function renderBreakpointsSettings(): string {
  const config = getBreakpointConfig();
  const breakpoints = getBreakpoints();
  
  return `
    <div class="breakpoints-settings">
      <div class="settings-section">
        <div class="section-header">
          <h4>📐 Breakpoints (устройства)</h4>
          <p class="section-description">
            Настройка адаптивных режимов для Spacing, Gap, Typography и других токенов
          </p>
        </div>
        
        <div class="settings-row">
          <label class="checkbox-label">
            <input type="checkbox" id="bp-show-value" ${config.showValueInModeName ? 'checked' : ''}>
            Показывать разрешение в названии режима
          </label>
          <p class="hint">Desktop → Desktop (1440px)</p>
        </div>
        
        <div class="settings-row">
          <label class="form-label">Пресеты:</label>
          <div class="preset-buttons">
            ${Object.entries(BREAKPOINT_PRESETS).map(([key, preset]) => `
              <button class="btn btn-sm btn-secondary bp-preset-btn" data-preset="${key}" title="${preset.description}">
                ${preset.name}
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="breakpoints-list" id="breakpoints-list">
          ${renderBreakpointsList(breakpoints, config.showValueInModeName)}
        </div>
        
        <div class="breakpoints-actions">
          <button class="btn btn-secondary btn-sm" id="btn-add-breakpoint">
            + Добавить breakpoint
          </button>
          <button class="btn btn-ghost btn-sm" id="btn-reset-breakpoints">
            ↺ Сбросить
          </button>
        </div>
        
        <div class="preview-section">
          <label class="form-label">Превью режимов в Figma:</label>
          <div class="figma-modes-preview">
            ${breakpoints.map(bp => `
              <span class="mode-preview-chip">${getModeName(bp)}</span>
            `).join(' → ')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderBreakpointsList(breakpoints: Breakpoint[], showValue: boolean): string {
  if (breakpoints.length === 0) {
    return '<div class="empty-hint">Нет breakpoints. Выберите пресет или добавьте вручную.</div>';
  }
  
  return breakpoints
    .sort((a, b) => a.order - b.order)
    .map((bp, index) => `
      <div class="breakpoint-item" data-bp-id="${bp.id}" draggable="true">
        <div class="bp-drag-handle" title="Перетащите для изменения порядка">⋮⋮</div>
        <div class="bp-icon">${bp.icon}</div>
        <div class="bp-info">
          <input type="text" class="bp-name-input" value="${bp.name}" data-field="name" placeholder="Название">
          <div class="bp-value-row">
            <input type="number" class="bp-value-input" value="${bp.value}" data-field="value" min="0" max="9999">
            <span class="bp-unit">px</span>
          </div>
        </div>
        <div class="bp-preview">${showValue ? `${bp.name} (${bp.value}px)` : bp.name}</div>
        <div class="bp-actions">
          <button class="btn-icon bp-move-up" title="Вверх" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn-icon bp-move-down" title="Вниз" ${index === breakpoints.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn-icon bp-delete" title="Удалить" ${breakpoints.length <= 1 ? 'disabled' : ''}>🗑️</button>
        </div>
      </div>
    `).join('');
}

// ============================================
// STYLES
// ============================================

export function getBreakpointsSettingsStyles(): string {
  return `
    .breakpoints-settings {
      padding: 16px 0;
    }
    
    .breakpoints-settings .section-header {
      margin-bottom: 16px;
    }
    
    .breakpoints-settings .section-header h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
    }
    
    .breakpoints-settings .section-description {
      margin: 0;
      font-size: 12px;
      color: var(--color-text-secondary);
    }
    
    .settings-row {
      margin-bottom: 16px;
    }
    
    .settings-row .hint {
      margin: 4px 0 0 24px;
      font-size: 11px;
      color: var(--color-text-tertiary);
    }
    
    .preset-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    
    .bp-preset-btn {
      font-size: 11px !important;
      padding: 4px 8px !important;
    }
    
    .breakpoints-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 16px 0;
      padding: 12px;
      background: var(--color-bg-secondary);
      border-radius: 8px;
    }
    
    .breakpoint-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: var(--color-bg);
      border-radius: 6px;
      border: 1px solid var(--color-border);
      transition: all 0.15s ease;
    }
    
    .breakpoint-item:hover {
      border-color: var(--color-border-hover);
    }
    
    .breakpoint-item.dragging {
      opacity: 0.5;
      border-style: dashed;
    }
    
    .bp-drag-handle {
      cursor: grab;
      color: var(--color-text-tertiary);
      font-size: 12px;
      padding: 4px;
    }
    
    .bp-drag-handle:active {
      cursor: grabbing;
    }
    
    .bp-icon {
      font-size: 16px;
      width: 24px;
      text-align: center;
    }
    
    .bp-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .bp-name-input {
      width: 100%;
      padding: 4px 8px;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      font-size: 13px;
      background: var(--color-bg);
    }
    
    .bp-value-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .bp-value-input {
      width: 70px;
      padding: 4px 8px;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      font-size: 12px;
      background: var(--color-bg);
    }
    
    .bp-unit {
      font-size: 11px;
      color: var(--color-text-tertiary);
    }
    
    .bp-preview {
      font-size: 11px;
      color: var(--color-text-secondary);
      padding: 4px 8px;
      background: var(--color-bg-secondary);
      border-radius: 4px;
      white-space: nowrap;
    }
    
    .bp-actions {
      display: flex;
      gap: 4px;
    }
    
    .bp-actions .btn-icon {
      width: 24px;
      height: 24px;
      padding: 0;
      font-size: 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      opacity: 0.6;
      transition: all 0.15s ease;
    }
    
    .bp-actions .btn-icon:hover:not(:disabled) {
      opacity: 1;
      background: var(--color-bg-secondary);
    }
    
    .bp-actions .btn-icon:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    
    .breakpoints-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .preview-section {
      padding: 12px;
      background: var(--color-bg-secondary);
      border-radius: 8px;
    }
    
    .preview-section .form-label {
      display: block;
      margin-bottom: 8px;
      font-size: 12px;
      color: var(--color-text-secondary);
    }
    
    .figma-modes-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .mode-preview-chip {
      padding: 6px 12px;
      background: var(--color-primary);
      color: white;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
  `;
}

// ============================================
// EVENT HANDLERS
// ============================================

export function initBreakpointsSettingsListeners(container: HTMLElement): void {
  // Show value checkbox
  const showValueCheckbox = container.querySelector('#bp-show-value') as HTMLInputElement;
  if (showValueCheckbox) {
    showValueCheckbox.addEventListener('change', () => {
      setBreakpointConfig({ showValueInModeName: showValueCheckbox.checked });
      refreshBreakpointsList(container);
    });
  }
  
  // Preset buttons
  container.querySelectorAll('.bp-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset') as keyof typeof BREAKPOINT_PRESETS;
      if (preset) {
        applyPreset(preset);
        refreshBreakpointsList(container);
      }
    });
  });
  
  // Add breakpoint
  const btnAdd = container.querySelector('#btn-add-breakpoint');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      const breakpoints = getBreakpoints();
      const newId = `custom-${Date.now()}`;
      addBreakpoint({
        id: newId,
        name: `Custom ${breakpoints.length + 1}`,
        value: 1024,
        unit: 'px',
        icon: '📱',
        description: 'Custom breakpoint',
      });
      refreshBreakpointsList(container);
    });
  }
  
  // Reset breakpoints
  const btnReset = container.querySelector('#btn-reset-breakpoints');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Сбросить breakpoints к настройкам по умолчанию?')) {
        resetBreakpointConfig();
        refreshBreakpointsList(container);
      }
    });
  }
  
  // Delegate events for breakpoint items
  initBreakpointItemListeners(container);
}

function initBreakpointItemListeners(container: HTMLElement): void {
  const list = container.querySelector('#breakpoints-list');
  if (!list) return;
  
  list.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    const item = target.closest('.breakpoint-item') as HTMLElement;
    if (!item) return;
    
    const bpId = item.dataset.bpId;
    const field = target.dataset.field;
    
    if (bpId && field) {
      const value = field === 'value' ? parseInt(target.value) || 0 : target.value;
      updateBreakpoint(bpId, { [field]: value });
      refreshBreakpointsPreview(container);
    }
  });
  
  list.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const item = target.closest('.breakpoint-item') as HTMLElement;
    if (!item) return;
    
    const bpId = item.dataset.bpId;
    if (!bpId) return;
    
    // Move up
    if (target.classList.contains('bp-move-up')) {
      moveBreakpoint(bpId, -1);
      refreshBreakpointsList(container);
    }
    
    // Move down
    if (target.classList.contains('bp-move-down')) {
      moveBreakpoint(bpId, 1);
      refreshBreakpointsList(container);
    }
    
    // Delete
    if (target.classList.contains('bp-delete')) {
      if (confirm(`Удалить breakpoint?`)) {
        removeBreakpoint(bpId);
        refreshBreakpointsList(container);
      }
    }
  });
}

function moveBreakpoint(id: string, direction: -1 | 1): void {
  const breakpoints = getBreakpoints();
  const currentIndex = breakpoints.findIndex(b => b.id === id);
  if (currentIndex === -1) return;
  
  const newIndex = currentIndex + direction;
  if (newIndex < 0 || newIndex >= breakpoints.length) return;
  
  const orderedIds = breakpoints
    .sort((a, b) => a.order - b.order)
    .map(b => b.id);
  
  // Swap
  [orderedIds[currentIndex], orderedIds[newIndex]] = [orderedIds[newIndex], orderedIds[currentIndex]];
  
  reorderBreakpoints(orderedIds);
}

function refreshBreakpointsList(container: HTMLElement): void {
  const list = container.querySelector('#breakpoints-list');
  if (list) {
    const config = getBreakpointConfig();
    list.innerHTML = renderBreakpointsList(getBreakpoints(), config.showValueInModeName);
  }
  refreshBreakpointsPreview(container);
}

function refreshBreakpointsPreview(container: HTMLElement): void {
  const preview = container.querySelector('.figma-modes-preview');
  if (preview) {
    const breakpoints = getBreakpoints().sort((a, b) => a.order - b.order);
    preview.innerHTML = breakpoints.map(bp => `
      <span class="mode-preview-chip">${getModeName(bp)}</span>
    `).join(' → ');
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  getBreakpointConfig,
  getBreakpoints,
  getModeName,
} from '../types/breakpoint-config';
