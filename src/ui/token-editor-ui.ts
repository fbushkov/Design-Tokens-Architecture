/**
 * Token Editor UI Component
 * Right Panel: Edit token properties, semantic mapping, references
 */

import {
  TokenDefinition,
  TokenSemantic,
  TokenReference,
  TMCollectionType,
  TMColorValue,
  TMTokenType,
} from '../types/token-manager';

import {
  getState,
  getTokenById,
  getTokens,
  updateToken,
  deleteToken,
  createToken,
  setSelectedToken,
  saveState,
  buildFullPath,
  parseHexToRgba,
  formatRgbaToHex,
} from '../types/token-manager-state';

import {
  DEFAULT_CATEGORIES,
  DEFAULT_PALETTES,
} from '../types/token-manager-constants';

// ============================================
// EDITOR RENDERING
// ============================================

export function renderTokenEditor(): string {
  const state = getState();
  const selectedId = state.selectedTokenId;

  if (!selectedId) {
    return renderEmptyState();
  }

  const token = getTokenById(selectedId);
  if (!token) {
    return renderEmptyState();
  }

  return `
    <div class="te-container">
      <div class="te-header">
        <h3 class="te-title">Редактирование токена</h3>
        <button class="te-close" title="Закрыть">✕</button>
      </div>
      
      <div class="te-content">
        ${renderIdentitySection(token)}
        ${renderValueSection(token)}
        ${renderSemanticSection(token)}
        ${renderReferencesSection(token)}
        ${renderMetaSection(token)}
      </div>
      
      <div class="te-footer">
        <button class="btn btn-primary te-save">💾 Сохранить</button>
        <button class="btn btn-secondary te-duplicate">📋 Дублировать</button>
        <button class="btn btn-danger te-delete">🗑 Удалить</button>
      </div>
    </div>
  `;
}

function renderEmptyState(): string {
  return `
    <div class="te-container te-empty">
      <div class="te-empty-content">
        <span class="te-empty-icon">📝</span>
        <p>Выберите токен для редактирования</p>
        <button class="btn btn-primary te-create-new">+ Создать токен</button>
      </div>
    </div>
  `;
}

// ============================================
// SECTION RENDERERS
// ============================================

function renderIdentitySection(token: TokenDefinition): string {
  const pathString = token.path.join('/');

  return `
    <div class="te-section">
      <div class="te-section-title">Идентификация</div>
      
      <div class="te-field">
        <label class="te-label">Имя токена</label>
        <input type="text" class="te-input te-token-name" value="${token.name}" data-field="name">
      </div>
      
      <div class="te-field">
        <label class="te-label">Путь</label>
        <input type="text" class="te-input te-token-path" value="${pathString}" data-field="path" placeholder="colors/brand">
      </div>
      
      <div class="te-field">
        <label class="te-label">Полный путь</label>
        <div class="te-readonly">${token.fullPath}</div>
      </div>
      
      <div class="te-field">
        <label class="te-label">Коллекция</label>
        <select class="te-select te-token-collection" data-field="collection">
          <option value="Primitives" ${token.collection === 'Primitives' ? 'selected' : ''}>Primitives</option>
          <option value="Tokens" ${token.collection === 'Tokens' ? 'selected' : ''}>Tokens</option>
          <option value="Components" ${token.collection === 'Components' ? 'selected' : ''}>Components</option>
          <option value="Typography" ${token.collection === 'Typography' ? 'selected' : ''}>Typography</option>
          <option value="Spacing" ${token.collection === 'Spacing' ? 'selected' : ''}>Spacing</option>
          <option value="Gap" ${token.collection === 'Gap' ? 'selected' : ''}>Gap</option>
          <option value="Icon Size" ${token.collection === 'Icon Size' ? 'selected' : ''}>Icon Size</option>
          <option value="Radius" ${token.collection === 'Radius' ? 'selected' : ''}>Radius</option>
        </select>
      </div>
      
      <div class="te-field">
        <label class="te-label">Тип</label>
        <select class="te-select te-token-type" data-field="type">
          <option value="COLOR" ${token.type === 'COLOR' ? 'selected' : ''}>🎨 Color</option>
          <option value="NUMBER" ${token.type === 'NUMBER' ? 'selected' : ''}>🔢 Number</option>
          <option value="STRING" ${token.type === 'STRING' ? 'selected' : ''}>📝 String</option>
          <option value="BOOLEAN" ${token.type === 'BOOLEAN' ? 'selected' : ''}>✓ Boolean</option>
        </select>
      </div>
    </div>
  `;
}

function renderValueSection(token: TokenDefinition): string {
  let valueInput = '';

  if (token.type === 'COLOR' && typeof token.value === 'object' && 'hex' in token.value) {
    const colorValue = token.value as TMColorValue;
    valueInput = `
      <div class="te-color-input">
        <input type="color" class="te-color-picker" value="${colorValue.hex}" data-field="value-color">
        <input type="text" class="te-input te-color-hex" value="${colorValue.hex}" data-field="value-hex" placeholder="#000000">
      </div>
      <div class="te-color-preview-large" style="background-color: ${colorValue.hex}"></div>
      <div class="te-color-rgba">
        RGBA: ${Math.round(colorValue.rgba.r * 255)}, ${Math.round(colorValue.rgba.g * 255)}, ${Math.round(colorValue.rgba.b * 255)}, ${colorValue.rgba.a}
      </div>
    `;
  } else if (token.type === 'NUMBER') {
    valueInput = `
      <input type="number" class="te-input" value="${token.value}" data-field="value-number">
    `;
  } else if (token.type === 'BOOLEAN') {
    valueInput = `
      <label class="te-checkbox-wrapper">
        <input type="checkbox" class="te-checkbox" ${token.value ? 'checked' : ''} data-field="value-boolean">
        <span>${token.value ? 'True' : 'False'}</span>
      </label>
    `;
  } else {
    valueInput = `
      <input type="text" class="te-input" value="${token.value}" data-field="value-string">
    `;
  }

  return `
    <div class="te-section">
      <div class="te-section-title">Значение</div>
      <div class="te-field">
        ${valueInput}
      </div>
    </div>
  `;
}

function renderSemanticSection(token: TokenDefinition): string {
  const semantic = token.semantic || { category: '', subcategory: '', variant: '', state: '' };
  const categories = DEFAULT_CATEGORIES;

  // Get current category's subcategories
  const currentCategory = categories.find(c => c.name === semantic.category);
  const subcategories = currentCategory?.subcategories || [];
  const currentSubcategory = subcategories.find(s => s.name === semantic.subcategory);
  const variants = currentSubcategory?.variants || [];
  const states = currentSubcategory?.states || ['default'];

  return `
    <div class="te-section">
      <div class="te-section-title">Семантика</div>
      
      <div class="te-field">
        <label class="te-label">Категория</label>
        <select class="te-select te-semantic-category" data-field="semantic-category">
          <option value="">— Не выбрано —</option>
          ${categories.map(cat => `
            <option value="${cat.name}" ${semantic.category === cat.name ? 'selected' : ''}>${cat.label}</option>
          `).join('')}
        </select>
      </div>
      
      <div class="te-field">
        <label class="te-label">Подкатегория</label>
        <select class="te-select te-semantic-subcategory" data-field="semantic-subcategory" ${!semantic.category ? 'disabled' : ''}>
          <option value="">— Не выбрано —</option>
          ${subcategories.map(sub => `
            <option value="${sub.name}" ${semantic.subcategory === sub.name ? 'selected' : ''}>${sub.label}</option>
          `).join('')}
        </select>
      </div>
      
      <div class="te-field">
        <label class="te-label">Вариант</label>
        <select class="te-select te-semantic-variant" data-field="semantic-variant" ${variants.length === 0 ? 'disabled' : ''}>
          <option value="">— По умолчанию —</option>
          ${variants.map(v => `
            <option value="${v}" ${semantic.variant === v ? 'selected' : ''}>${v}</option>
          `).join('')}
        </select>
      </div>
      
      <div class="te-field">
        <label class="te-label">Состояние</label>
        <select class="te-select te-semantic-state" data-field="semantic-state">
          ${states.map(s => `
            <option value="${s}" ${semantic.state === s ? 'selected' : ''}>${s}</option>
          `).join('')}
        </select>
      </div>
      
      <div class="te-field">
        <label class="te-label">Сгенерированный путь</label>
        <div class="te-readonly te-semantic-preview">${buildSemanticPath(semantic)}</div>
      </div>
    </div>
  `;
}

function renderReferencesSection(token: TokenDefinition): string {
  // Only show for Tokens and Components collections
  if (token.collection === 'Primitives') {
    return '';
  }

  const references = token.references || { light: '', dark: '' };
  const primitives = getTokens().filter(t => t.collection === 'Primitives' && t.type === 'COLOR');

  // Group primitives by color
  const groupedPrimitives: Record<string, TokenDefinition[]> = {};
  for (const prim of primitives) {
    const colorName = prim.path[1] || 'other';
    if (!groupedPrimitives[colorName]) {
      groupedPrimitives[colorName] = [];
    }
    groupedPrimitives[colorName].push(prim);
  }

  return `
    <div class="te-section">
      <div class="te-section-title">Референсы</div>
      
      <div class="te-field">
        <label class="te-label">Light Mode</label>
        <select class="te-select te-reference-light" data-field="reference-light">
          <option value="">— Не выбрано —</option>
          ${Object.entries(groupedPrimitives).map(([color, tokens]) => `
            <optgroup label="${color}">
              ${tokens.map(t => `
                <option value="${t.fullPath}" ${references.light === t.fullPath ? 'selected' : ''}>${t.name}</option>
              `).join('')}
            </optgroup>
          `).join('')}
        </select>
        ${references.light ? renderReferencePreview(references.light) : ''}
      </div>
      
      <div class="te-field">
        <label class="te-label">Dark Mode</label>
        <select class="te-select te-reference-dark" data-field="reference-dark">
          <option value="">— Не выбрано —</option>
          ${Object.entries(groupedPrimitives).map(([color, tokens]) => `
            <optgroup label="${color}">
              ${tokens.map(t => `
                <option value="${t.fullPath}" ${references.dark === t.fullPath ? 'selected' : ''}>${t.name}</option>
              `).join('')}
            </optgroup>
          `).join('')}
        </select>
        ${references.dark ? renderReferencePreview(references.dark) : ''}
      </div>
    </div>
  `;
}

function renderReferencePreview(path: string): string {
  const token = getTokens().find(t => t.fullPath === path);
  if (!token || token.type !== 'COLOR') return '';

  const value = token.value as TMColorValue;
  return `<div class="te-reference-preview" style="background-color: ${value.hex}" title="${value.hex}"></div>`;
}

function renderMetaSection(token: TokenDefinition): string {
  const tags = token.tags?.join(', ') || '';

  return `
    <div class="te-section">
      <div class="te-section-title">Метаданные</div>
      
      <div class="te-field">
        <label class="te-label">Описание</label>
        <textarea class="te-textarea te-description" data-field="description" placeholder="Описание токена...">${token.description || ''}</textarea>
      </div>
      
      <div class="te-field">
        <label class="te-label">Теги (через запятую)</label>
        <input type="text" class="te-input te-tags" value="${tags}" data-field="tags" placeholder="primary, button, interactive">
      </div>
      
      <div class="te-field">
        <label class="te-label">Статус</label>
        <label class="te-checkbox-wrapper">
          <input type="checkbox" class="te-checkbox te-enabled" ${token.enabled ? 'checked' : ''} data-field="enabled">
          <span>Активен</span>
        </label>
      </div>
      
      <div class="te-field te-meta-info">
        <div>Создан: ${new Date(token.createdAt).toLocaleString()}</div>
        <div>Изменён: ${new Date(token.updatedAt).toLocaleString()}</div>
        ${token.figmaId ? `<div>Figma ID: ${token.figmaId}</div>` : ''}
      </div>
    </div>
  `;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function buildSemanticPath(semantic: TokenSemantic): string {
  if (!semantic.category || !semantic.subcategory) {
    return '—';
  }

  const state = getState();
  const sep = state.settings.separator;
  
  let path = `${semantic.category}${sep}${semantic.subcategory}`;
  
  if (semantic.variant) {
    path += `${sep}${semantic.variant}`;
  }
  
  if (semantic.state && semantic.state !== 'default') {
    path += `${sep}${semantic.state}`;
  }
  
  return path;
}

// ============================================
// NEW TOKEN DIALOG
// ============================================

export function renderNewTokenDialog(): string {
  return `
    <div class="te-dialog-overlay">
      <div class="te-dialog">
        <div class="te-dialog-header">
          <h3>Создать новый токен</h3>
          <button class="te-dialog-close">✕</button>
        </div>
        
        <div class="te-dialog-content">
          <div class="te-field">
            <label class="te-label">Имя</label>
            <input type="text" class="te-input te-new-name" placeholder="brand-500">
          </div>
          
          <div class="te-field">
            <label class="te-label">Путь</label>
            <input type="text" class="te-input te-new-path" placeholder="colors/brand">
          </div>
          
          <div class="te-field">
            <label class="te-label">Коллекция</label>
            <select class="te-select te-new-collection">
              <option value="Primitives">Primitives</option>
              <option value="Tokens">Tokens</option>
              <option value="Components">Components</option>
              <option value="Typography">Typography</option>
              <option value="Spacing">Spacing</option>
              <option value="Gap">Gap</option>
              <option value="Icon Size">Icon Size</option>
              <option value="Radius">Radius</option>
            </select>
          </div>
          
          <div class="te-field">
            <label class="te-label">Тип</label>
            <select class="te-select te-new-type">
              <option value="COLOR">🎨 Color</option>
              <option value="NUMBER">🔢 Number</option>
              <option value="STRING">📝 String</option>
              <option value="BOOLEAN">✓ Boolean</option>
            </select>
          </div>
          
          <div class="te-field te-new-value-container">
            <label class="te-label">Значение</label>
            <div class="te-color-input">
              <input type="color" class="te-color-picker te-new-color" value="#3B82F6">
              <input type="text" class="te-input te-new-hex" value="#3B82F6">
            </div>
          </div>
        </div>
        
        <div class="te-dialog-footer">
          <button class="btn btn-primary te-dialog-create">Создать</button>
          <button class="btn btn-secondary te-dialog-cancel">Отмена</button>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// EVENT HANDLERS
// ============================================

export function initTokenEditorEvents(container: HTMLElement, refreshCallback: () => void): void {
  // Close editor
  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    if (target.classList.contains('te-close')) {
      setSelectedToken(null);
      refreshCallback();
    }

    // Save button
    if (target.classList.contains('te-save')) {
      saveCurrentToken(container);
      saveState();
      refreshCallback();
    }

    // Duplicate button
    if (target.classList.contains('te-duplicate')) {
      const state = getState();
      if (state.selectedTokenId) {
        const token = getTokenById(state.selectedTokenId);
        if (token) {
          const newToken = createToken({
            ...token,
            name: `${token.name}-copy`,
            id: undefined,
            figmaId: undefined,
          });
          setSelectedToken(newToken.id);
          saveState();
          refreshCallback();
        }
      }
    }

    // Delete button
    if (target.classList.contains('te-delete')) {
      const state = getState();
      if (state.selectedTokenId && confirm('Удалить токен?')) {
        deleteToken(state.selectedTokenId);
        setSelectedToken(null);
        saveState();
        refreshCallback();
      }
    }

    // Create new token button
    if (target.classList.contains('te-create-new')) {
      showNewTokenDialog(container, refreshCallback);
    }
  });

  // Input changes for live preview
  container.addEventListener('input', (e) => {
    const target = e.target as HTMLElement;

    // Color picker sync
    if (target.classList.contains('te-color-picker')) {
      const hex = (target as HTMLInputElement).value;
      const hexInput = container.querySelector('.te-color-hex') as HTMLInputElement;
      if (hexInput) hexInput.value = hex.toUpperCase();
      
      const preview = container.querySelector('.te-color-preview-large') as HTMLElement;
      if (preview) preview.style.backgroundColor = hex;
      
      const rgba = parseHexToRgba(hex);
      const rgbaDiv = container.querySelector('.te-color-rgba') as HTMLElement;
      if (rgbaDiv) {
        rgbaDiv.textContent = `RGBA: ${Math.round(rgba.r * 255)}, ${Math.round(rgba.g * 255)}, ${Math.round(rgba.b * 255)}, ${rgba.a}`;
      }
    }

    // Hex input sync
    if (target.classList.contains('te-color-hex')) {
      const hex = (target as HTMLInputElement).value;
      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        const colorPicker = container.querySelector('.te-color-picker') as HTMLInputElement;
        if (colorPicker) colorPicker.value = hex;
        
        const preview = container.querySelector('.te-color-preview-large') as HTMLElement;
        if (preview) preview.style.backgroundColor = hex;
      }
    }
  });

  // Select changes for semantic cascade
  container.addEventListener('change', (e) => {
    const target = e.target as HTMLElement;

    // Category change - update subcategories
    if (target.classList.contains('te-semantic-category')) {
      const category = (target as HTMLSelectElement).value;
      updateSemanticSubcategories(container, category);
    }

    // Subcategory change - update variants and states
    if (target.classList.contains('te-semantic-subcategory')) {
      const categorySelect = container.querySelector('.te-semantic-category') as HTMLSelectElement;
      const subcategory = (target as HTMLSelectElement).value;
      updateSemanticVariantsAndStates(container, categorySelect.value, subcategory);
    }
  });
}

function saveCurrentToken(container: HTMLElement): void {
  const state = getState();
  if (!state.selectedTokenId) return;

  const token = getTokenById(state.selectedTokenId);
  if (!token) return;

  // Gather values from form
  const name = (container.querySelector('.te-token-name') as HTMLInputElement)?.value || token.name;
  const pathString = (container.querySelector('.te-token-path') as HTMLInputElement)?.value || '';
  const path = pathString.split('/').filter(p => p.trim());
  const collection = (container.querySelector('.te-token-collection') as HTMLSelectElement)?.value as TMCollectionType;
  const type = (container.querySelector('.te-token-type') as HTMLSelectElement)?.value as TMTokenType;

  // Value based on type
  let value: TMColorValue | number | string | boolean = token.value;
  
  if (type === 'COLOR') {
    const hex = (container.querySelector('.te-color-hex') as HTMLInputElement)?.value || '#000000';
    value = {
      hex: hex.toUpperCase(),
      rgba: parseHexToRgba(hex),
    };
  } else if (type === 'NUMBER') {
    value = parseFloat((container.querySelector('[data-field="value-number"]') as HTMLInputElement)?.value || '0');
  } else if (type === 'BOOLEAN') {
    value = (container.querySelector('[data-field="value-boolean"]') as HTMLInputElement)?.checked || false;
  } else {
    value = (container.querySelector('[data-field="value-string"]') as HTMLInputElement)?.value || '';
  }

  // Semantic
  const semantic: TokenSemantic = {
    category: (container.querySelector('.te-semantic-category') as HTMLSelectElement)?.value || '',
    subcategory: (container.querySelector('.te-semantic-subcategory') as HTMLSelectElement)?.value || '',
    variant: (container.querySelector('.te-semantic-variant') as HTMLSelectElement)?.value,
    state: (container.querySelector('.te-semantic-state') as HTMLSelectElement)?.value,
  };

  // References
  const references: TokenReference = {
    light: (container.querySelector('.te-reference-light') as HTMLSelectElement)?.value || '',
    dark: (container.querySelector('.te-reference-dark') as HTMLSelectElement)?.value,
  };

  // Meta
  const description = (container.querySelector('.te-description') as HTMLTextAreaElement)?.value;
  const tagsString = (container.querySelector('.te-tags') as HTMLInputElement)?.value || '';
  const tags = tagsString.split(',').map(t => t.trim()).filter(t => t);
  const enabled = (container.querySelector('.te-enabled') as HTMLInputElement)?.checked ?? true;

  // Update token
  updateToken(state.selectedTokenId, {
    name,
    path,
    fullPath: buildFullPath(path, name, state.settings.separator),
    collection,
    type,
    value,
    semantic: semantic.category ? semantic : undefined,
    references: references.light ? references : undefined,
    description,
    tags,
    enabled,
  });
}

function updateSemanticSubcategories(container: HTMLElement, category: string): void {
  const subcatSelect = container.querySelector('.te-semantic-subcategory') as HTMLSelectElement;
  const variantSelect = container.querySelector('.te-semantic-variant') as HTMLSelectElement;
  const stateSelect = container.querySelector('.te-semantic-state') as HTMLSelectElement;

  if (!subcatSelect) return;

  const categoryDef = DEFAULT_CATEGORIES.find(c => c.name === category);
  const subcategories = categoryDef?.subcategories || [];

  subcatSelect.innerHTML = `
    <option value="">— Не выбрано —</option>
    ${subcategories.map(sub => `<option value="${sub.name}">${sub.label}</option>`).join('')}
  `;
  subcatSelect.disabled = !category;

  // Reset variants and states
  if (variantSelect) {
    variantSelect.innerHTML = '<option value="">— По умолчанию —</option>';
    variantSelect.disabled = true;
  }
  if (stateSelect) {
    stateSelect.innerHTML = '<option value="default">default</option>';
  }

  updateSemanticPreview(container);
}

function updateSemanticVariantsAndStates(container: HTMLElement, category: string, subcategory: string): void {
  const variantSelect = container.querySelector('.te-semantic-variant') as HTMLSelectElement;
  const stateSelect = container.querySelector('.te-semantic-state') as HTMLSelectElement;

  const categoryDef = DEFAULT_CATEGORIES.find(c => c.name === category);
  const subcatDef = categoryDef?.subcategories.find(s => s.name === subcategory);

  if (variantSelect) {
    const variants = subcatDef?.variants || [];
    variantSelect.innerHTML = `
      <option value="">— По умолчанию —</option>
      ${variants.map(v => `<option value="${v}">${v}</option>`).join('')}
    `;
    variantSelect.disabled = variants.length === 0;
  }

  if (stateSelect) {
    const states = subcatDef?.states || ['default'];
    stateSelect.innerHTML = states.map(s => `<option value="${s}">${s}</option>`).join('');
  }

  updateSemanticPreview(container);
}

function updateSemanticPreview(container: HTMLElement): void {
  const preview = container.querySelector('.te-semantic-preview') as HTMLElement;
  if (!preview) return;

  const category = (container.querySelector('.te-semantic-category') as HTMLSelectElement)?.value || '';
  const subcategory = (container.querySelector('.te-semantic-subcategory') as HTMLSelectElement)?.value || '';
  const variant = (container.querySelector('.te-semantic-variant') as HTMLSelectElement)?.value || '';
  const state = (container.querySelector('.te-semantic-state') as HTMLSelectElement)?.value || 'default';

  preview.textContent = buildSemanticPath({ category, subcategory, variant, state });
}

function showNewTokenDialog(container: HTMLElement, refreshCallback: () => void): void {
  const dialog = document.createElement('div');
  dialog.innerHTML = renderNewTokenDialog();
  document.body.appendChild(dialog.firstElementChild!);

  const overlay = document.querySelector('.te-dialog-overlay') as HTMLElement;

  // Close handlers
  overlay.querySelector('.te-dialog-close')?.addEventListener('click', () => overlay.remove());
  overlay.querySelector('.te-dialog-cancel')?.addEventListener('click', () => overlay.remove());

  // Create handler
  overlay.querySelector('.te-dialog-create')?.addEventListener('click', () => {
    const name = (overlay.querySelector('.te-new-name') as HTMLInputElement).value.trim();
    const pathString = (overlay.querySelector('.te-new-path') as HTMLInputElement).value.trim();
    const collection = (overlay.querySelector('.te-new-collection') as HTMLSelectElement).value as TMCollectionType;
    const type = (overlay.querySelector('.te-new-type') as HTMLSelectElement).value as TMTokenType;
    const hex = (overlay.querySelector('.te-new-hex') as HTMLInputElement).value;

    if (!name) {
      alert('Введите имя токена');
      return;
    }

    const path = pathString.split('/').filter(p => p);
    const state = getState();

    let value: TMColorValue | number | string | boolean;
    if (type === 'COLOR') {
      value = { hex: hex.toUpperCase(), rgba: parseHexToRgba(hex) };
    } else if (type === 'NUMBER') {
      value = 0;
    } else if (type === 'BOOLEAN') {
      value = false;
    } else {
      value = '';
    }

    const newToken = createToken({
      name,
      path,
      fullPath: buildFullPath(path, name, state.settings.separator),
      collection,
      type,
      value,
      enabled: true,
    });

    setSelectedToken(newToken.id);
    saveState();
    overlay.remove();
    refreshCallback();
  });

  // Sync color inputs in dialog
  const colorPicker = overlay.querySelector('.te-new-color') as HTMLInputElement;
  const hexInput = overlay.querySelector('.te-new-hex') as HTMLInputElement;

  colorPicker?.addEventListener('input', () => {
    hexInput.value = colorPicker.value.toUpperCase();
  });

  hexInput?.addEventListener('input', () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
      colorPicker.value = hexInput.value;
    }
  });
}
